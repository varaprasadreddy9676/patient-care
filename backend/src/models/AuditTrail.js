var mongoose = require('mongoose');

// Create the AuditTrail Schema
var AuditTrailSchema = new mongoose.Schema({

    event: {
        type: String,
        required: true
    },

    phone: String,

    userId: {
        type: mongoose.Schema.ObjectId
    },

    userName: String,

    details: String,

    referenceObject: {
        type: mongoose.Schema.Types.Mixed
    },

    ipAddress: String,

    dateTime: {
        type: Date,
        default: Date.now
    },

}, {
    usePushEach: true
});

// Export the schema
module.exports = AuditTrailSchema;