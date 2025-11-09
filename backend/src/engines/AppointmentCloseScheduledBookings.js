const POLL_INTERVAL = 5; // in mins

const CLOSE_AFTER = 600; // in mins

var mongoose = require('mongoose');

var appointment = require('../models/Appointment');
var Appointment = mongoose.model('appointments', appointment);
var reminderService = require('../services/ReminderService.js');

function closeScheduledAppointments() {

    Appointment.find({
            $or: [{
                    'status': 'SCHEDULED'
                },
                {
                    'status': 'RE_SCHEDULED'
                },
                {
                    'status': 'STARTED'
                }
            ]
        },
        function (errAppointment, appointments) {

            if (errAppointment) throw errAppointment;

            appointments.forEach(function (appointment, index) {

                var releaseDate = new Date();
                releaseDate.setMinutes(releaseDate.getMinutes() - CLOSE_AFTER);

                var appointmentDateTime = appointment.appointmentDate;
                var appointmentTime = appointment.appointmentTime;
                
                if (appointmentTime) {
                   var hr = appointmentTime.split(":")[0];
                   var mins = appointmentTime.split(":")[1];
                   appointmentDateTime.setHours(hr);
                   appointmentDateTime.setMinutes(mins);
                }

                if (appointmentDateTime < releaseDate) {
                    console.log('Closing the scheduled appointment after consultation for id ' + appointment._id);

                    appointment.status = 'CLOSED';
                    appointment.statusLog.push(appointment.status);
                    // appointment.save();
                    new Appointment(appointment).save();

                    reminderService.inActivateReminder(appointment._id, 'Appointment');
                }

            });

        });

}


console.log('Releasing the reserved slots in ' + POLL_INTERVAL + ' minutes');

// setInterval(releaseReservedSlots, 3000);
setInterval(closeScheduledAppointments, (1000 * 60 * POLL_INTERVAL));

closeScheduledAppointments();