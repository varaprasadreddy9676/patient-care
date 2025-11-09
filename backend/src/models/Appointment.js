var mongoose = require('mongoose');

// Create the Hospital Schema
var AppointmentSchema = new mongoose.Schema({

    hospital: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },

    appointmentDate: {
        type: Date,
        required: true
    },

    appointmentTime: {
        type: String
    },

    patient: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },

    userId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    familyMemberId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    doctorId: {
        type: Number,
        required: true
    },

    doctorName: {
        type: String,
        required: true
    },

    doctorPhone: {
        type: String
    },

    specialityCode: {
        type: String,
        required: true
    },

    specialityName: {
        type: String,
        required: true
    },

    consultationCharge: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        default: {}
    },

    videoConsultation: {
        type: Boolean,
        default: false
    },

    bookingDateTime: {
        type: Date,
        default: Date.now
    },

    slotReservationId: {
        type: Number,
        default: 0
    },

    paymentConfirmationDateTme: {
        type: Date,
        default: null
    },

    status: {
        type: String,
        required: true,
        default: 'DRAFT' // DRAFT, PAYMENT_PENDING, PAYMENT_SUCCESS, PAYMENT_FAILED,  
            // AWAITING_CONFIRMATION_FROM_HOSPITAL, SCHEDULED, RE_SCHEDULED, STARTED, CLOSED, CANCELLED, DELETED
    },

    statusLog: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },

    reportingTime: {
        type: String
    },

    visitId: {
        type: Number
    },

    bookingId: {
        type: String
    },

    appointmentId: {
        type: Number
    },

    billId: {
        type: Number
    },

    receiptId: {
        type: Number
    },

    paymentTransactionNo: {
        type: String
    },

    paymentDetails: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        default: {}
    },

    read: {
        type: Boolean,
        required: true,
        default: false
    },

    active: {
        type: Boolean,
        required: true,
        default: true
    },

    hospitalBooking: {
        type: Boolean,
        default: false
    }
}, {
    usePushEach: true
});

// Export the schema
module.exports = AppointmentSchema;