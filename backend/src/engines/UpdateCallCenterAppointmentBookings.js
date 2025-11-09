const POLL_INTERVAL = 60; // in mins



var mongoose = require('mongoose');
var hospitalResourceDetail = require('../models/HospitalResourceDetails');
var hospital = require('../models/Hospital');
var familyMemberHospitalAccount = require('../models/FamilyMemberHospitalAccount');
var appointment = require('../models/Appointment');
var httpService = require('../services/HTTPService.js');


var HospitalResourceDetail = mongoose.model('hospital_resource_details', hospitalResourceDetail);
var Hospital = mongoose.model('hospitals', hospital);
var FamilyMemberHospitalAccount = mongoose.model('family_member_hospital_account', familyMemberHospitalAccount);
var Appointment = mongoose.model('appointments', appointment);

function getCallCenterAppointments() {


    HospitalResourceDetail.find({}, function(err, hospitalResourceDetails) {

        if (err) throw err;

        hospitalResourceDetails.forEach(function(hospitalResourceDetail, index) {

            console.log('hospitalResourceDetail: ' + JSON.stringify(hospitalResourceDetail));

            Hospital.find({
                    "resourceId": hospitalResourceDetail._id,
                    active: true
                },
                function(errHospital, hospital) {

                    if (errHospital) throw errHospital;
                    hospital.forEach(function(hospital) {

                        console.log(hospital);

                        httpService.doGet(hospital.code, '/callcenter-appointments', null, success, error)

                        function success(response) {
                            console.log('callCenterAppointment response: ' + JSON.stringify(response));

                            let callCenterAppointmentArray = response.data.appointments;


                            for (let i = 0; i < callCenterAppointmentArray.length; i++) {

                                let callCenterAppointment = callCenterAppointmentArray[i];

                                Appointment.findOne({
                                    "hospital.code": hospital.code,
                                    "appointmentId": +callCenterAppointment.id

                                }, function(errAppointment, appointment) {

                                    // if (errAppt) throw errAppt;

                                    let appointmentStatus;

                                    if (callCenterAppointment.appointmentStatus == -1) {
                                        appointmentStatus = "CANCELLED";

                                    } else if (callCenterAppointment.appointmentStatus == 2) {
                                        appointmentStatus = "SCHEDULED";

                                    }

                                    if (appointment) {

                                        if (callCenterAppointment.appointmentStatus == 2 &&
                                            (appointment.appointmentDate.toDateString() !== new Date(callCenterAppointment.dateTime).toDateString() ||
                                                appointment.appointmentTime !== callCenterAppointment.time ||
                                                appointment.videoConsultation !== (callCenterAppointment.isVideoConsultation == 1 ? true : false))) {

                                            appointmentStatus = "RE_SCHEDULED";

                                        } else if (callCenterAppointment.appointmentStatus == -1) {
                                            appointmentStatus = "CANCELLED";

                                        } else if (callCenterAppointment.appointmentStatus == 2) {
                                            appointmentStatus = "SCHEDULED";
                                        }
                                    }


                                    saveAppointment(callCenterAppointment, hospital, appointmentStatus);

                                });

                                function saveAppointment(callCenterAppointment, hospital, appointmentStatus) {

                                    FamilyMemberHospitalAccount.findOne({
                                        "hospitalCode": hospital.code,
                                        "patientId": callCenterAppointment.patientId

                                    }, function(errFamilyMemberHospitalAccount, familyMemberHospitalAccount) {

                                        if (familyMemberHospitalAccount) {
                                            const familyMemberId = familyMemberHospitalAccount.familyMemberId;
                                            const userId = familyMemberHospitalAccount.userId;

                                            const appointmentObject = {
                                                'familyMemberId': familyMemberId,
                                                'doctorId': +callCenterAppointment.providerId,
                                                'doctorName': callCenterAppointment.providerName,
                                                'specialityCode': callCenterAppointment.specialityCode,
                                                'specialityName': callCenterAppointment.specialityName,
                                                'appointmentDate': new Date(callCenterAppointment.dateTime),
                                                'appointmentTime': callCenterAppointment.time,
                                                'userId': userId,
                                                'patient': {
                                                    'mrn': callCenterAppointment.mrn,
                                                    'name': callCenterAppointment.patientName,
                                                    'gender': callCenterAppointment.patientGender,
                                                    'dob': callCenterAppointment.patientDOB,
                                                    'phone': callCenterAppointment.phone,
                                                    'email': null,
                                                    'id': callCenterAppointment.patientId
                                                },
                                                'hospital': {
                                                    'id': hospital._id,
                                                    'name': hospital.name,
                                                    'code': hospital.code,
                                                    'address': hospital.address,
                                                    'contactDetails': hospital.contactDetails
                                                },
                                                'active': true,
                                                'read': false,
                                                'status': appointmentStatus,
                                                'slotReservationId': 0,
                                                'bookingDateTime': Date.now(),
                                                'videoConsultation': callCenterAppointment.isVideoConsultation == 1 ? true : false,
                                                'appointmentId': +callCenterAppointment.id,
                                                'bookingId': callCenterAppointment.bookingNumber,
                                                'doctorPhone': callCenterAppointment.doctorPhone,
                                                'reportingTime': callCenterAppointment.time,
                                                'visitId': +callCenterAppointment.visitId,
                                                'hospitalBooking': true
                                            }

                                            console.log(appointmentObject);


                                            delete appointmentObject.videoConsultation;
                                            delete appointmentObject.appointmentDate;
                                            delete appointmentObject.appointmentTime;
                                            delete appointmentObject.status;

                                            Appointment.update({
                                                    "hospital.code": hospital.code,
                                                    "appointmentId": +callCenterAppointment.id
                                                }, {

                                                    $set: {
                                                        "videoConsultation": callCenterAppointment.isVideoConsultation == 1 ? true : false,
                                                        "appointmentDate": new Date(callCenterAppointment.dateTime),
                                                        "appointmentTime": callCenterAppointment.time,
                                                        "status": appointmentStatus
                                                    },

                                                    $setOnInsert: appointmentObject

                                                }, {
                                                    upsert: true
                                                },

                                                function(errResult, successResult) {

                                                    if (successResult) {
                                                        console.log(JSON.stringify(successResult));

                                                        const url = "/callcenter-appointments/" + callCenterAppointment.id;

                                                        httpService.doPut(hospital.code, url, null, success, error);

                                                        function success(successResponse) {
                                                            console.log("Success:" + JSON.stringify(successResponse));
                                                        }

                                                        function error(errorResponse) {
                                                            console.log("Error:" + JSON.stringify(errorResponse));
                                                        }

                                                    } else if (errResult) {
                                                        console.error(JSON.stringify(errResult));
                                                    }

                                                });

                                        }

                                    });
                                }


                            }

                        }

                        function error(response) {
                            console.log('callCenterAppointment err response: ' + JSON.stringify(response));
                        }

                    });
                });

        });
    })
}


console.log('Getting call center appointments in ' + POLL_INTERVAL + ' minutes');

setInterval(getCallCenterAppointments, (1000 * 60 * POLL_INTERVAL));