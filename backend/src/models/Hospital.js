var mongoose = require('mongoose');

// Create the Hospital Schema
var HospitalSchema = new mongoose.Schema({

    code: {
        type: String,
        unique: true,
        required: true,
        dropDups: true
    },

    name: {
        type: String,
        required: true
    },

    parentId: Number,

    shortName: String,

    address: String,

    entityId: Number,

    phone: String,

    resourceId: mongoose.Schema.ObjectId,

    cityId: Number,
    cityName: String,

    stateId: Number,
    stateName: String,

    mapGeographicPoints: String,

    authDetails: {
        type: mongoose.Schema.Types.Mixed
    },

    paymentGatewayDetails: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },

    contactDetails: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        default: {}
    },
    paymentRequired: {
        type: Boolean,
        required: true,
        default: true
    },
    active: {
        type: Boolean,
        required: true,
        default: true
    }

});

// Export the schema
module.exports = HospitalSchema;