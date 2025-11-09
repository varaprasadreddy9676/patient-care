const POLL_INTERVAL = 1; // in mins

var mongoose = require('mongoose');

var appointment = require('../models/Appointment');
var Appointment = mongoose.model('appointments', appointment);

var Messenger = require('../services/CommunicationService');
var messenger = new Messenger();

function pushReminderForConsultationNotStarted() {

    Appointment.find({
            $or: [{
                    'status': 'SCHEDULED'
                },
                {
                    'status': 'RE_SCHEDULED'
                }
            ]
        },
        function(errAppointment, appointments) {

            if (errAppointment) throw errAppointment;

            appointments.forEach(function(appointment, index) {

                var currentDate = new Date();

                var appointmentDateTime = appointment.appointmentDate;
                var appointmentTime = appointment.appointmentTime;
                var hr = appointmentTime.split(":")[0];
                var mins = appointmentTime.split(":")[1];

                appointmentDateTime.setHours(hr);
                appointmentDateTime.setMinutes(mins);

                var remindTill = new Date(appointmentDateTime);
                remindTill.setSeconds(remindTill.getSeconds() + 70);

                if (appointmentDateTime < currentDate && remindTill > currentDate && appointment.videoConsultation) {
                    console.log('Reminding the doctor for not starting the appointment, id ' + appointment._id);

                    var doctorName = appointment.doctorName.replace(/Dr.|Dr /g, "").trim();
                    var title = 'Video consultation not started';
                    var message = 'Dear Dr ' + doctorName + "," + "" + appointment.patient.name +
                        ' is waiting for video consultation, scheduled for ' + appointment.appointmentTime + ' -medics';

                    if (appointment.doctorPhone) {
                        messenger.sendSMS(appointment.doctorPhone, message, appointment.hospital.code);
                    }

                    if (appointment.hospital && appointment.hospital.contactDetails &&
                        appointment.hospital.contactDetails.phone) {

                        var hospitalPhone = appointment.hospital.contactDetails.phone;
                        var hospitalMessage = 'Please remind ' + doctorName + ' to start the video' +
                            ' consultation for patient ' + appointment.patient.name + ' scheduled @ ' + appointment.appointmentTime + ' -medics';
                        messenger.sendSMS(hospitalPhone, hospitalMessage, appointment.hospital.code);

                    }

                }

            });

        });

}


console.log('Starting reminder engine for not started conusltation in ' + POLL_INTERVAL + ' minutes');

// setInterval(releaseReservedSlots, 3000);
setInterval(pushReminderForConsultationNotStarted, (1000 * 60 * POLL_INTERVAL));