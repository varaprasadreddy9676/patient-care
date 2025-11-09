const mongoose = require("mongoose");

// Create the Bill Schema
const BillSchema = new mongoose.Schema({
    entityCode: String,
    patientId: String,
    visitId: String,
    billId: String,
    billAmount: String,
    paidAmount: String,
    billDate: String,

    paymentConfirmationDateTme: {
        type: Date,
        default: null,
    },

    status: {
        type: String,
        required: true,
        default: "DRAFT", // DRAFT, PAYMENT_PENDING, PAYMENT_SUCCESS, PAYMENT_FAILED,
    },

    paymentDetails: {
        type: mongoose.Schema.Types.Mixed,
    },

    createdDateTime: {
        type: Date,
        default: Date.now,
    },

    paymentTransactionNo: {
        type: String,
    }
}, {
    usePushEach: true,
});

// Export the schema
module.exports = BillSchema;