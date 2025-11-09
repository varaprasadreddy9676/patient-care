var mongoose = require("mongoose");

// Create the Hospital Schema
var LocationSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: true,
        dropDups: true,
    },

    name: {
        type: String,
        required: true,
    },
    entId: String,
    street: String,
    state: String,

    AccountingId: String,

    city: String,
    country: String,
    id: String,
    pinCode: String,
    phoneNumber: String,
    mailId: String,
    address: String,

    mobileNumber: String,
    shortName: String,
    isValid: String,

    resourceId: mongoose.Schema.ObjectId,

    active: {
        type: Boolean,
        required: true,
        default: true,
    },
});

// Export the schema
module.exports = LocationSchema;