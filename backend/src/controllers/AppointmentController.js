var restful = require('node-restful');
var mongoose = require('mongoose');
var httpService = require('../services/HTTPService.js');
var notificationService = require('../services/NotificationService.js');
var reminderService = require('../services/ReminderService.js');
var auditTrailService = require('../services/AuditTrailService.js');
var Messenger = require('../services/CommunicationService.js');
var messenger = new Messenger();
var hospitalPolicyService = require('../services/HospitalPolicyService.js');
const paymentService = require('../services/PaymentService.js');
const moment = require('moment');
const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');

module.exports = function(app, route) {

    var resource = restful.model('appointment', app.models.appointment);
    var rest = resource.methods(['get', 'put', 'post', 'delete']);

    var FamilyMember = mongoose.model('family_member', app.models.familyMember);
    var FamilyMemberHospitalAccount = mongoose.model('family_member_hospital_account', app.models.familyMemberHospitalAccount);
    var Appointment = mongoose.model('appointment', app.models.appointment);
    var Hospital = mongoose.model('hospital', app.models.hospital);
    var User = mongoose.model('User', app.models.user);
    var ConsentFormRecording = mongoose.model('consent_form_recording', app.models.consentFormRecording);
    var HospitalPolicy = mongoose.model('hospital_policy', app.models.hospitalPolicy);

    app.get(route + "/slot", function(req, res, next) {

        var hospitalCode = req.query.hospitalCode;
        var doctorId = req.query.doctorId;
        var appointmentDate = req.query.appointmentDate;
        let videoConsultationHoursOnly = req.query.videoConsultationHoursOnly ? req.query.videoConsultationHoursOnly : "true";

        var body = {
            "entityCode": hospitalCode,
            "doctorId": doctorId,
            "appointmentDate": appointmentDate,
            "videoConsultationHoursOnly": JSON.parse(videoConsultationHoursOnly)
        };

        const callbacks = ResponseHandler.createHTTPServiceCallbacks(res,
            (response) => {
                auditTrailService.log(req, auditTrailService.events.GET_AVAILABLE_SLOTS,
                    'Get available slots', body);

                console.log('Success: ' + JSON.stringify(response));
                return ResponseHandler.success(res, response);
            },
            (error) => {
                console.error('Error: ' + error.ERROR_MSG || error);
                return ResponseHandler.error(res, error, 500);
            }
        );

        httpService.doGet(hospitalCode, '/appointment-slots', body, callbacks.success, callbacks.error);
    });


    rest.before('post', function(req, res, next) {

        //Body		
        var familyMemberId = req.body.familyMemberId;
        var hospitalCode = req.body.hospitalCode;
        var doctorId = req.body.doctorId;
        var appointmentDate = req.body.appointmentDate;
        var appointmentTime = req.body.appointmentTime;
        var videoConsultation = req.body.videoConsultation;
        var consultationCharge = req.body.consultationCharge;

        //Set family member details
        FamilyMember.findById(familyMemberId,
            function(errFamilyMember, familyMember) {
                req.body.userId = familyMember.userId;

                User.findById(familyMember.userId, function(errUser, user) {

                    req.body.patient = {
                        'name': familyMember.fullName,
                        'gender': familyMember.gender,
                        'dob': familyMember.dob,
                        'phone': user.phone,
                        'email': user.email
                    };

                    req.body.status = 'DRAFT';
                    req.body.statusLog = [];
                    req.body.statusLog.push(req.body.status);

                    // Set the hospital details
                    Hospital.findOne({
                            "code": hospitalCode
                        },
                        function(errHospital, hospital) {
                            req.body.hospital = {
                                'id': hospital._id,
                                'name': hospital.name,
                                'code': hospital.code,
                                'address': hospital.address,
                                'contactDetails': hospital.contactDetails
                            };

                            req.body.paymentDetails = {
                                gatewayKey: hospital.paymentGatewayDetails.key,
                                upi: hospital.paymentGatewayDetails.upi
                            };

                            // Set the patient if he is registered 
                            FamilyMemberHospitalAccount.findOne({
                                "hospitalCode": hospitalCode,
                                "familyMemberId": familyMemberId
                            }, function(errFamilyMemberHospitalAccount, familyMemberHospitalAccount) {

                                if (familyMemberHospitalAccount) {
                                    req.body.patient.id = familyMemberHospitalAccount.patientId;
                                }

                                var reserveSlotPayload = {
                                    "doctorId": doctorId,
                                    "reservationDate": appointmentDate,
                                    "reservationSlotTime": appointmentTime,
                                    "patientName": req.body.patient.name
                                };

                                // Reserving the time slot
                                httpService.doPost(hospitalCode, '/appointment-reservations',
                                    reserveSlotPayload, reserveSlotSuccess, reserveSlotError);

                            });

                        });

                });

            });

        function reserveSlotSuccess(response) {
            console.log('Slot reserved. Proceed with payment...');

            if (response.data) {
                req.body.slotReservationId = response.data.slotReservationId;
                req.body.status = 'PAYMENT_PENDING';
                req.body.statusLog.push(req.body.status);

                next();

            } else {
                reserveSlotError(response);
            }

        }

        function reserveSlotError(error) {

            req.body.statusLog.push('SLOT_NOT_FREE');

            console.log('Failed to reserve slot.' + error.ERROR_MSG);
            res.status(500);

            var err = {
                'code': 'SLOT_NOT_FREE',
                'message': "Failed to reserve the time slot. Please try with a different time slot. " + error.ERROR_MSG
            };

            res.send(err);
        }

    });

    rest.after('post', function(req, res, next) {

        var data = res.locals.bundle;

        if (req.body.consentForm) {
            let consentForm = req.body.consentForm;
            consentForm.contextId = data._id;
            var newConsentForm = new ConsentFormRecording(consentForm);
            newConsentForm.save();
        }

        auditTrailService.log(req, auditTrailService.events.SLOT_RESERVED,
            'Slot reserved', data);

        console.log('Creating the order for the payment gateway');

        next();
    });


    // Delete the reservation and release the slot
    app.put(route + '/:id/delete', function(req, res, next) {

        var id = req.params.id;

        Appointment.findById(id, function(errAppointment, appointment) {

            if (!appointment) {
                var err = {
                    ERROR_MSG: 'Object not found'
                };

                errorCb(err);
                return;
            }

            var slotReservationId = appointment.slotReservationId;

            appointment.active = false;
            appointment.status = 'DELETED';
            appointment.statusLog.push(appointment.status);
            new Appointment(appointment).save();
            //appointment.save();

            auditTrailService.log(req, auditTrailService.events.SLOT_RELEASED,
                'Slot released', appointment);

            var message = {
                code: 'APPOINTMENT REMOVED',
                message: 'Successfully removed the appointment.'
            };

            if (slotReservationId == 0) {
                res.status(200);
                res.send(message);
                return;
            }

            console.log('Releasing the reserved slots... for id ' + slotReservationId);

            var url = '/appointment-reservations/' + slotReservationId;

            httpService.doDelete(appointment.hospital.code, url, null, successCb, errorCb);

            function successCb(response) {

                var message = {
                    code: 'RELEASED',
                    message: 'Slot released with id ' + slotReservationId
                };

                console.log(message);
                res.status(200);
                res.send(message);

            }

            function errorCb(error) {

                var message = {
                    code: 'RELEASED_FAILED',
                    message: 'Failed to release the slot. ' + error.ERROR_MSG
                };

                console.log(message);
                res.status(500);
                res.send(message);

            }

        });

    });

    async function updateAppointment(id, document) {
        let appointment = await Appointment.findByIdAndUpdate(
            id,
            {$set: document}
        );
        return appointment
    }
    app.put(route + '/:id/confirm', function(req, res, next) {

        var appointmentReqBody = req.body;
        let bankAccountNumber = "";
        let bankName = "";

        // Update the appointment with success
        Appointment.findById(appointmentReqBody._id,
            async function(errAppointment, appointment) {

                try {
                    const hospital = await Hospital.findOne({
                        code: appointment.hospital.code,
                    });

                    if (hospital) {
                        (bankAccountNumber = hospital.paymentGatewayDetails.bankAccountNumber ?
                            hospital.paymentGatewayDetails.bankAccountNumber :
                            ""),
                        (bankName = hospital.paymentGatewayDetails.bankName ? hospital.paymentGatewayDetails.bankName : "");
                    }
                } catch (error) {}

                appointment.paymentTransactionNo = appointmentReqBody.paymentTransactionNo;
                appointment.paymentDetails = appointmentReqBody.paymentDetails;
                appointment.paymentConfirmationDateTme = new Date();
                // appointment.consultationCharge.price = 0;
                if (!appointment.paymentTransactionNo && appointment.consultationCharge.price !== 0) {

                    appointment.status = 'PAYMENT_FAILED';
                    appointment.statusLog.push(appointment.status);
                    new Appointment(appointment).save();

                    let message = {
                        code: 'CONFIRMATION_FAILED',
                        message: error?.ERROR_MSG || 'Failed to confirm the appointment at end point. Please contact the hospital.'
                    };

                    auditTrailService.log(req, auditTrailService.events.APPOINTMENT_CONFIRMATION_FAILED, 'MISSING_TRANSACTION_NO ', appointment);

                    console.log(message);
                    res.status(500);
                    res.send(message);
                    return;
                }

                appointment.status = 'PAYMENT_SUCCESS';
                appointment.statusLog.push(appointment.status);
                appointment.paymentDetails.bankAccountNumber = bankAccountNumber;
                appointment.paymentDetails.bankName = bankName;

                //appointment.save();
                let saveApptResp;
                try {
                  console.log(appointment)
                  saveApptResp = await new Appointment(appointment).save();
                  console.log(saveApptResp);
                }
                catch(error) {
                    console.log(error);
                }


                FamilyMember.findById(appointment.familyMemberId,
                    function(errFamilyMember, familyMember) {

                        var appointmentPayLoad = {
                            'doctorId': appointment.doctorId + '',
                            'entityCode': appointment.hospital.code,
                            'appointmentDate': appointment.appointmentDate,
                            'appointmentTime': appointment.appointmentTime,
                            'videoConsultation': appointment.videoConsultation,
                            'consultationCharge': appointment.consultationCharge,
                            'slotReservationId': appointment.slotReservationId + '',
                            'referenceNumber': appointment.paymentTransactionNo,
                            'patientId': (appointment.patient.id ? appointment.patient.id + '' : null),
                            'firstName': familyMember.fullName,
                            'gender': familyMember.gender,
                            'dob': familyMember.dob,
                            'phone': familyMember.phone,
                            'billDate': moment(appointment.appointmentDate).format("DD/MM/YYYY"),
                            "bankName": bankName,
                            "bankAccountNumber": bankAccountNumber,
                        };

                        if (familyMember.fullName.split(" ").length > 1) {
                            appointmentPayLoad.firstName = familyMember.fullName.split(" ")[0];
                            appointmentPayLoad.lastName = familyMember.fullName.split(" ")[1];
                        }

                        console.log('Appointment payload: ' + JSON.stringify(appointmentPayLoad));

                        httpService.doPost(appointment.hospital.code, '/appointments',
                            appointmentPayLoad, successCb, errorCb);

                        async function successCb(response) {

                            if (response.data) {
                                console.log('Appointment confirmed...');

                                appointment.doctorName = response.data.doctorName;
                                appointment.doctorPhone = response.data.doctorPhone;
                                appointment.reportingTime = response.data.reportingTime;
                                appointment.patient.id = response.data.patientId;
                                appointment.patient.mrn = response.data.patientMRN;
                                appointment.visitId = response.data.visitId;
                                appointment.specialityId = response.data.specialityId;
                                appointment.specialityName = response.data.specialityName;
                                appointment.bookingId = response.data.bookingId;
                                appointment.appointmentId = response.data.id;
                                appointment.billId = response.data.billId;
                                appointment.receiptId = response.data.receiptId;
                                appointment.status = 'SCHEDULED';
                                appointment.statusLog.push(appointment.status);
                                appointment.billPrintBase64 = response.data.billPrintPdf;

                                // appointment.save();
                                let saveAppt;
                                try {
                                  delete appointment.__v;
                                  saveAppt = await updateAppointment(appointment.id, appointment)
                                }
                                catch(error) {
                                    console.log(error);
                                }

                                if (appointment.receiptId) {
                                    _sendReceiptByMail(appointment);
                                }


                                auditTrailService.log(req, auditTrailService.events.APPOINTMENT_CONFIRMED,
                                    'Appointment confirmed', appointment);

                                // check and map the patient to hospital account
                                FamilyMemberHospitalAccount.findOne({
                                    "hospitalCode": appointment.hospital.code,
                                    "familyMemberId": appointment.familyMemberId
                                }, function(errFamilyMemberHospitalAccount, familyMemberHospitalAccount) {

                                    if (!familyMemberHospitalAccount) {

                                        var newFamilyMemberHospitalAccountData = {
                                            "mrn": appointment.patient.mrn,
                                            "patientId": appointment.patient.id,
                                            "familyMemberId": appointment.familyMemberId,
                                            "userId": appointment.userId,
                                            "hospitalId": appointment.hospital.id,
                                            "hospitalCode": appointment.hospital.code,
                                            "hospitalName": appointment.hospital.name
                                        };

                                        var newFamilyMemberHospitalAccount = new FamilyMemberHospitalAccount(newFamilyMemberHospitalAccountData);
                                        newFamilyMemberHospitalAccount.save();

                                        res.status(200);
                                        res.send(appointment);

                                        handleReminders(appointment);

                                    } else {

                                        res.status(200);
                                        res.send(appointment);

                                        handleReminders(appointment);

                                    }
                                });

                            } else {
                                errorCb(response);
                            }

                        }

                        function errorCb(error) {

                            console.error(error.ERROR_MSG);

                            Appointment.findById(appointment._id, async function(errAppointment, appt) {

                                appt.paymentConfirmationDateTme = new Date();
                                appt.status = 'AWAITING_CONFIRMATION_FROM_HOSPITAL';
                                appt.statusLog.push(appt.status);
                                //appt.save();
                                let appResp;
                                try {
                                    appResp = await new Appointment(appt).save();
                                } catch (error) {
                                    console.log(error);
                                }
                             

                                res.status(500);
                                var message = {
                                    code: 'CONFIRMATION_FAILED',
                                    message: error?.ERROR_MSG || 'Failed to confirm the appointment at end point. Please contact the hospital.'
                                };

                                auditTrailService.log(req, auditTrailService.events.APPOINTMENT_CONFIRMATION_FAILED,
                                    (error.ERROR_MSG ? error.ERROR_MSG : error), appt);

                                console.log(message);
                                res.send(message);

                            });

                        }

                    });

            });

    });

    function handleReminders(appointment) {

        console.log(appointment);

        // Daily notification
        var doctorName = 'Dr.' + appointment.doctorName.replace(/Dr.|Dr /g, "").trim();
        var title = 'Appointment tomorrow with ' + doctorName;
        var message = 'Hi ' + appointment.patient.name + ', You have ';

        if (appointment.videoConsultation) {
            message += 'a video consultation';
        } else {
            message += 'an';
        }

        message += ' appointment tomorrow @ ' + appointment.appointmentTime + ' with ' +
            doctorName + ' (' + appointment.specialityName + ').';

        var remindAt = new Date(appointment.appointmentDate);
        remindAt.setDate(remindAt.getDate() - 1);
        remindAt.setHours(20);

        var reminder = {
            'remindAt': remindAt,
            'familyMemberId': appointment.familyMemberId,

            'objectId': appointment._id,
            'objectName': 'Appointment',
            'reminderType': 'APPOINTMENT',

            'reminderDetails': {
                'doctorName': appointment.doctorName,
                'specialityName': appointment.specialityName,
                'appointmentDate': appointment.appointmentDate,
                'appointmentTime': appointment.appointmentTime,
                'videoConsultation': appointment.videoConsultation,
                'hospitalCode': appointment.hospital.code,
                'hospitalName': appointment.hospital.name,
                'mrn': appointment.patient.mrn,
                'gender': appointment.patient.gender,
                'bookingId': appointment.bookingId
            },

            'reminderNotificationDetails': {
                'path': 'blank',
                'title': title,
                'message': message
            }
        };

        reminderService.scheduleReminder(reminder);

        // Trigger on notification
        if (appointment.videoConsultation) {
            var title2 = 'Be ready for the video consultation';
            var apptTime = appointment.appointmentTime;

            var message2 = 'Hi ' + appointment.patient.name + ', I hope you are ready for the video consultation with ' +
                doctorName + ' (' + appointment.specialityName + ') @ ' + apptTime + '.';

            var hrs = apptTime.split(":")[0];
            var mins = apptTime.split(":")[1];

            var triggerDateTime = new Date(appointment.appointmentDate);
            triggerDateTime.setHours(hrs);
            triggerDateTime.setMinutes(mins);

            triggerDateTime.setMinutes(triggerDateTime.getMinutes() - 10);

            var notification = {
                'notifyAt': triggerDateTime,
                'userId': appointment.userId,
                'objectId': appointment._id,
                'objectName': 'Appointment',
                'title': title2,
                'message': message2,
                'path': 'blank',
                'notificationDetails': reminder.reminderDetails
            };

            notificationService.scheduleNotification(notification);

        }


        // const messageBody = "You have an appointment scheduled on " + displayDateFormat(appointment.appointmentDate) +
        //     " @ " + appointment.appointmentTime + " for " + appointment.patient.name + "."
        let messageBody;
        var doctorName = appointment.doctorName.replace(/Dr.|Dr /g, "").trim();
        if (appointment.videoConsultation) {
            messageBody = 
                `Dear Dr ${doctorName}, a video consultation has been scheduled for patient ${appointment.patient.name} on ${displayDateFormat(appointment.appointmentDate)} at ${appointment.appointmentTime}. Please initiate the video consultation on time. -medics`
        } else {
            messageBody = 
                `Dear Dr. ${doctorName}, An appointment with ${appointment.patient.name} on ${displayDateFormat(appointment.appointmentDate)} at ${appointment.appointmentTime} has been confirmed. Kindly, proceed with the consultation as scheduled. -medics`
        }


        let s = new Date(appointment.appointmentDate);
        let aptDay = s.getDate();
        let aptMonth = s.getMonth() + 1;
        let aptYear = s.getFullYear();
        let cDate = new Date();
        let cDay = cDate.getDate();
        let cMonth = cDate.getMonth() + 1;
        let cYear = cDate.getFullYear();
        console.log(aptDay, aptMonth, aptYear);
        console.log(cDay, cMonth, cYear);

        if (aptDay === cDay && aptMonth === cMonth && aptYear === cYear) {
            console.log('Same Date, Sending SMS...');
            messenger.sendSMS(appointment.doctorPhone, messageBody, appointment.hospital.code);
        } else {
            console.log('Different Date, Not sending SMS')
        }


    }

    app.put(route + "/:id/paymentFailed", function(req, res, next) {

        var appointment = req.body;

        Appointment.findById(appointment._id, async function(errAppointment, appt) {

            appt.paymentConfirmationDateTme = new Date();
            appt.status = 'PAYMENT_FAILED';
            appt.statusLog.push(appt.status);
            // appt.save();
            let apptResp;
            try {
                apptResp = await new Appointment(appt).save();
            } catch (error) {
                console.log(error);
            }
            
           

            auditTrailService.log(req, auditTrailService.events.APPOINTMENT_PAYMENT_FAILED,
                'Appointment payment failed', appt);

            res.status(200);
            res.send(appt);

        });

    });

    // Release the reserved time slot
    app.put(route + "/:id/release", function(req, res, next) {

        var appointment = req.body;

        next();

    });


    app.put(route + "/:id/reschedule", function(req, res, next) {

        var appointment = req.body;

        var appointmentPayLoad = {
            'doctorId': appointment.doctorId + '',
            'entityCode': appointment.hospital.code,
            'rescheduledAppointmentDate': appointment.appointmentDate,
            'rescheduledAppointmentTime': appointment.appointmentTime,
            'videoConsultation': appointment.videoConsultation
        };

        const reschedulePolicy = hospitalPolicyService.get(appointment.hospital.code, "ALLOWED_APPOINTMENT_MODIFICATION_DURATION");
        let rescheduleValue;

        try {
            rescheduleValue = +reschedulePolicy.reschedule;

        } catch (error) {
            rescheduleValue = null;
        }


        Appointment.findById(appointment._id, function(errAppointment, appt) {

            const appointmentDateTime = _setAppointmentDateTime(appt);

            const timeDifference = Math.floor((appointmentDateTime.getTime() - new Date().getTime()) /
                1000 / 60 / 60); // in hours

            if (rescheduleValue && timeDifference < rescheduleValue) {
                res.status(500);

                var message = {
                    code: 'RESCHEDULE_FAILED',
                    message: 'Can not reschedule appointment within ' + rescheduleValue + ' hours of the appointment.'
                };

                console.log(message);
                res.send(message);

                return;
            }


            var url = '/appointments/' + appointment.appointmentId;

            httpService.doPut(appointment.hospital.code, url,
                appointmentPayLoad, successCb, errorCb);

            function successCb(response) {

                if (response.data) {
                    console.log('Appointment rescheduled...');

                    appointment.appointmentId = response.data.id;
                    appointment.bookingId = response.data.bookingId;
                    appointment.status = 'RE_SCHEDULED';
                    appointment.statusLog.push(appointment.status);

                    Appointment.updateOne({
                        "_id": appointment._id
                    }, appointment, function(errAppointment) {
                        if (errAppointment) {
                            console.error('Failed to save appointment' + errAppointment);
                            res.status(200);
                        }

                        handleReminders(appointment);

                        let messageBody = `Dear ${appointment.patient.name} as per your request the Video Consultation is rescheduled to Date: ${displayDateFormat(appointment.appointmentDate)}, ${appointment.appointmentTime}. -medics`
                        messenger.sendSMS(appointment.patient.phone, messageBody, appointment.hospital.code);

                        auditTrailService.log(req, auditTrailService.events.APPOINTMENT_RESCHEDULED,
                            'Appointment re-scheduled', appointment);

                        res.send(appointment);

                    });

                } else {
                    errorCb(response);
                }

            }

            function errorCb(error) {

                res.status(500);
                var message = {
                    code: 'RESCHEDULE_FAILED',
                    message: 'Failed to reschedule the appointment at end point. Please contact the hospital.'
                };

                console.log(message);
                res.send(message);

            }
        });


    });


    app.put(route + '/:id/cancel', function(req, res, next) {

        const appointment = req.body;

        const cancelPolicy = hospitalPolicyService.get(appointment.hospital.code, "ALLOWED_APPOINTMENT_MODIFICATION_DURATION");
        let cancelValue;

        try {
            cancelValue = +cancelPolicy.cancel;

        } catch (error) {
            cancelValue = null;
        }

        Appointment.findById(appointment._id, function(errAppointment, appt) {

            const appointmentDateTime = _setAppointmentDateTime(appt);

            const timeDifference = Math.floor((appointmentDateTime.getTime() - new Date().getTime()) /
                1000 / 60 / 60); // in hours

            // if (cancelValue && timeDifference < cancelValue) {
            //     res.status(500);

            //     var message = {
            //         code: 'CANCEL_FAILED',
            //         message: 'Can not cancel appointment within ' + cancelValue + ' hours of the appointment.'
            //     };

            //     console.log(message);
            //     res.send(message);

            //     return;
            // }



            // Need to discuss the payment impacts. Disabling this feature now.
            httpService.doDelete(appointment.hospital.code, '/appointments/' + appointment.appointmentId,
                appointment, successCb, errorCb);

            async function successCb(response) {

                if (response.data) {

                    reminderService.clearReminder(appt._id, 'Appointment');

                    appt.slotReservationId = 0;
                    appt.status = 'CANCELLED';
                    appt.statusLog.push(appt.status);
                    let apptResp;
                    try {
                        apptResp =  new Appointment(appt).save();
                    } catch (error) {
                        console.log(error);
                    }
                   

                    // SMS for doctor
                    let messageBody = `Your consultation with ${appointment.patient.name} for ${appointment.appointmentDate} and ${appointment.appointmentTime} has been cancelled. -medics`
                    messenger.sendSMS(appointment.doctorPhone, messageBody, appointment.hospital.code);


                    auditTrailService.log(req, auditTrailService.events.APPOINTMENT_CANCELLED,
                        'Appointment cancelled', appt);
                    let doctorName = 'Dr.' + appointment.doctorName.replace(/Dr.|Dr /g, "").trim();

                    // SMS for Patient
                    let patientMessageBody = `Your appointment with ${doctorName} has been cancelled and the appointment fees refund has been initiated. -medics`
                    messenger.sendSMS(appointment.patient.phone, patientMessageBody, appointment.hospital.code);

                    res.status(200);
                    res.send(appt);
                } else {
                    errorCb(response);
                }

            }

            function errorCb(error) {

                res.status(500);
                var message = {
                    code: 'CANCEL_FAILED',
                    message: 'Failed to cancel the appointment at end point. Please contact the hospital.'
                };

                console.log(message);
                res.send(message);

            }

        });
    });


    app.get(route + "/markasread", function(req, res, next) {

        var userId = req.query.userId;
        var selectedFamilyMemberId = req.query.selectedFamilyMemberId;

        const query = {
            'userId': mongoose.Types.ObjectId(userId),
            'read': false
        };

        // Add family member filter if provided
        if (selectedFamilyMemberId) {
            query.familyMemberId = mongoose.Types.ObjectId(selectedFamilyMemberId);
        }

        Appointment.find(query, function(err, appointments) {

            if (appointments.length > 0) {

                appointments.forEach(function(appointment) {

                    appointment.read = true;

                    appointment.save();

                });
            }

            auditTrailService.log(req, auditTrailService.events.APPOINTMENT_SEEN_BY_USER, 'Appointment seen by user');

            res.status(200);
            res.send('Marked all appointments as read for the user');

        });

    });


    app.get(route + "/unread", function(req, res, next) {

        var userId = req.query.userId;
        var selectedFamilyMemberId = req.query.selectedFamilyMemberId;

        const query = {
            'userId': mongoose.Types.ObjectId(userId),
            'read': false,
            'active': true
        };

        // Add family member filter if provided
        if (selectedFamilyMemberId) {
            query.familyMemberId = mongoose.Types.ObjectId(selectedFamilyMemberId);
        }

        Appointment.find(query, function(err, appointments) {

            if (err) {
                res.send("Error! " + err);
            } else {

                var data = {
                    "count": appointments.length
                };

                res.status(200);
                res.send(data);
            }

        });
    });


    app.get(route + "/start", function(req, res, next) {

        var hospitalCode = req.query.hospitalCode;
        var visitId = req.query.visitId;

        console.log('Appointment starting with params hospitalCode=' + hospitalCode + '; visitId=' + visitId);

        Appointment.findOne({
            $and: [{
                'hospital.code': hospitalCode,
                'visitId': visitId
            }, {
                $or: [{
                    'status': 'SCHEDULED'
                }, {
                    'status': 'RE_SCHEDULED'
                }, {
                    'status': 'STARTED'
                }, {
                    'status': 'CLOSED'
                }]
            }]
        }, async function(errAppointment, appointment) {

            if (appointment && appointment.videoConsultation) {

                if (appointment.status !== 'SCHEDULED' && appointment.status !== 'RE_SCHEDULED' &&
                    appointment.status !== 'CLOSED') {
                    res.status(500);
                    res.send('Failed to start the consultation. Current appointment status is ' + appointment.status);
                    return;
                }

                var doctorName = 'Dr.' + appointment.doctorName.replace(/Dr.|Dr /g, "").trim();
                var title = 'Doctor started the video consultation';
                var message = doctorName + ' has started the video consultation. Please join.';

                var notification = {
                    'hospitalCode': hospitalCode,
                    'userId': appointment.userId,
                    'objectId': appointment._id,
                    'objectName': 'Appointment',
                    'title': title,
                    'message': message,
                    'path': 'appointment-details',

                    'notificationDetails': {
                        'doctorName': appointment.doctorName,
                        'specialityName': appointment.specialityName,
                        'appointmentDate': appointment.appointmentDate,
                        'appointmentTime': appointment.appointmentTime,
                        'videoConsultation': appointment.videoConsultation,
                        'objectId': appointment._id
                    }
                };

                let msgBody = `${appointment.doctorName} is waiting for a video consultation scheduled for ${appointment.appointmentTime} -medics`;
                messenger.sendSMS(appointment.patient.phone, msgBody, appointment.hospital.code);

                notificationService.sendNotification(notification);

                appointment.status = 'STARTED';
                appointment.statusLog.push(appointment.status);
                // appointment.save();
                let apptResp;
                try {
                    apptResp =  new Appointment(appointment).save();
                } catch (error) {
                    console.log(error);
                }


                auditTrailService.log(req, auditTrailService.events.APPOINTMENT_STARTED_BY_DOCTOR,
                    'Appointment started by doctor', appointment);

                res.status(200);
                res.send('Appointment started');

            } else {
                res.status(200);
                res.send('Appointment record not found');
            }

        });

    });



    app.get(route + "/close", function(req, res, next) {

        var hospitalCode = req.query.hospitalCode;
        var visitId = req.query.visitId;

        console.log('Closing appointment with params hospitalCode=' + hospitalCode + '; visitId=' + visitId);

        Appointment.findOne({
            'hospital.code': hospitalCode,
            'visitId': visitId,
            'status': 'STARTED'
        }, async function(errAppointment, appointment) {

            if (appointment) {

                if (appointment.status !== 'STARTED') {
                    res.status(500);
                    res.send('Failed to close the consultation. Current appointment status is ' + appointment.status);
                    return;
                }

                // If payment is from Razor Pay
                if (appointment.paymentDetails.successResponse.razorpay_payment_id) {

                    let captureResponse = await paymentService.capturePayment(appointment);
                    console.log(captureResponse);

                    // If there is message key, it means error
                    if (captureResponse.message) {
                        appointment.paymentDetails.capturedErrorResponse = captureResponse.message;
                    } else {
                        appointment.paymentDetails.capturedSuccessResponse = captureResponse;
                    }
                }

                appointment.status = 'CLOSED';
                appointment.statusLog.push(appointment.status);
                // appointment.save();
                let apptResp;
                try {
                    apptResp =  new Appointment(appointment).save();
                } catch (error) {
                    console.log(error);
                }

                auditTrailService.log(req, auditTrailService.events.APPOINTMENT_CLOSED_BY_DOCTOR,
                    'Appointment closed by doctor', appointment);

                reminderService.inActivateReminder(appointment._id, 'Appointment');

                res.status(200);
                res.send('Appointment closed');

            } else {
                res.status(200);
                res.send('Appointment record not found');
            }

        });

    });

    app.get(route + '/downloadReceipt', function(req, res, next) {

        let hospitalCode = req.query.hospitalCode;
        let receiptId = req.query.receiptId;

        let url = '/receipts/' + receiptId;

        httpService.doGet(hospitalCode, url, null, success, error);

        function success(response) {
            console.log('Success: ' + JSON.stringify(response));
            res.status(200);
            res.send(response);
        }

        function error(error) {
            console.error('Error: ' + error);
            res.status(500);
            res.send(error);
        }
    });


    function _sendReceiptByMail(appointment) {

        try {

            var billPrintBase64 = appointment.billPrintBase64;
            var receiptContent = new Buffer(billPrintBase64, "base64");

            if (appointment.patient.email) {
                var mail = {
                    to: appointment.patient.email,
                    subject: 'medics care appointment booking receipt',
                    body: 'Please find the attached appointment booking payment acknowledgement.',
                    attachments: [{
                        'filename': 'Payment Acknowledgement.pdf',
                        'content': receiptContent,
                        'contentType': 'application/pdf'
                    }]

                }

                messenger.sendMail(mail);

            }

            var message = 'We have received the payment of Rs ' + appointment.consultationCharge.price +
                ' for the appointment booking id ' + appointment.bookingId + ' -medics';

            messenger.sendSMS(appointment.patient.phone, message, appointment.hospital.code);


        } catch (e) {
            console.error(e);
        }

    }

    function displayDateFormat(appointmentDate) {
        let date = new Date(appointmentDate);
        const shortMonthName = new Intl.DateTimeFormat("en-US", {
            month: "short"
        }).format;
        return date.getDate() + " " + shortMonthName(date) + ", " + date.getFullYear();
    }

    function _setAppointmentDateTime(appointment) {
        const appointmentTimeArray = appointment.appointmentTime.split(':');

        const appointmentDateTime = new Date(appointment.appointmentDate);
        appointmentDateTime.setHours(appointmentTimeArray[0], appointmentTimeArray[1], 0, 0);

        return appointmentDateTime;
    }

    // Add selected family member filtering for GET requests
    const SelectedFamilyMemberHelper = require('../utils/SelectedFamilyMemberHelper');
    rest.before('get', function(req, res, next) {
        const selectedFamilyMemberId = req.query.selectedFamilyMemberId;
        const userId = req.query.userId;

        if (selectedFamilyMemberId && userId) {
            // Simple ownership validation (non-blocking, just for audit/logging)
            SelectedFamilyMemberHelper.validateFamilyMemberOwnership(userId, selectedFamilyMemberId, function(err, belongsToUser) {
                if (belongsToUser) {
                    console.log(`Family member ${selectedFamilyMemberId} access validated for user ${userId}`);
                } else {
                    console.warn(`Family member ${selectedFamilyMemberId} access attempted by user ${userId} - may not belong to user`);
                }

                // Add family member filter to the query
                req.query.familyMemberId = selectedFamilyMemberId;
                // Clean up so it doesn't appear in response
                delete req.query.selectedFamilyMemberId;
                next();
            });
        } else {
            next();
        }
    });

    // Wrap node-restful responses in standardized format
    rest.after('get', function(req, res, next) {
        const data = res.locals.bundle;
        return ResponseHandler.success(res, data);
    });

    rest.after('post', function(req, res, next) {
        const data = res.locals.bundle;
        if (data.message || data.errmsg) {
            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, data.errmsg || data.message));
        }
        return ResponseHandler.success(res, data);
    });

    rest.after('put', function(req, res, next) {
        const data = res.locals.bundle;
        if (data.message || data.errmsg) {
            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, data.errmsg || data.message));
        }
        return ResponseHandler.success(res, data);
    });

    rest.after('delete', function(req, res, next) {
        const data = res.locals.bundle;
        return ResponseHandler.success(res, data);
    });

    rest.register(app, route);

    // Return middleware
    return function(req, res, next) {
        next();
    };

};