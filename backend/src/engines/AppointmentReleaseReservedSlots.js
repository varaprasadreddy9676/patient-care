const POLL_INTERVAL = 5; // in mins

const SLOT_RELEASE_AFTER = 15; // in mins

var httpService = require('../services/HTTPService.js');
var mongoose = require('mongoose');

var appointment = require('../models/Appointment');
var Appointment = mongoose.model('appointments', appointment);

function releaseReservedSlots() {

    Appointment.find({
            $or: [{
                    'status': 'PAYMENT_PENDING'
                },
                {
                    'status': 'PAYMENT_FAILED'
                }
            ]
        },
        function (errAppointment, appointments) {

            if (errAppointment) throw errAppointment;

            appointments.forEach(function (appointment, index) {

                var releaseDate = new Date();
                releaseDate.setMinutes(releaseDate.getMinutes() - SLOT_RELEASE_AFTER);

                var bookingDateTime = appointment.bookingDateTime;
                //bookingDateTime.setMinutes(bookingDateTime.getMinutes() + bookingDateTime.getTimezoneOffset());

                var hospitalCode = appointment.hospital.code;
                var slotReservationId = appointment.slotReservationId;

                if (bookingDateTime < releaseDate) {
                    console.log('Releasing the reserved slots... for id ' + slotReservationId);

                    var url = '/appointment-reservations/' + slotReservationId;

                    httpService.doDelete(hospitalCode, url, null, successCb, errorCb);

                    function successCb(response) {

                        if (response.data) {
                            console.log('Slot released with id ' + slotReservationId);

                            appointment.slotReservationId = 0;
                            appointment.status = 'DRAFT';
                            appointment.statusLog.push(appointment.status);
                            appointment.appointmentTime = null;
                            // appointment.save();
                            new Appointment(appointment).save();

                        } else {
                            errorCb(response);
                        }

                    }

                    function errorCb(error) {

                        var message = {
                            code: 'RELEASED_FAILED',
                            message: 'Failed to release the slot. ' + error.ERROR_MSG
                        };
                        console.log(message);

                    }
                }

            });

        });

}


console.log('Releasing the reserved slots in ' + POLL_INTERVAL + ' minutes');

// setInterval(releaseReservedSlots, 3000);
setInterval(releaseReservedSlots, (1000 * 60 * POLL_INTERVAL));

releaseReservedSlots();