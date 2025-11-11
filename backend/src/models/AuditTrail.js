var mongoose = require('mongoose');

// Create the AuditTrail Schema
var AuditTrailSchema = new mongoose.Schema({

    event: {
        type: String,
        required: true
    },

    category: {
        type: String,
        default: 'user_action'
    },

    sessionId: String,

    page: String,

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

// Add indexes for better query performance
AuditTrailSchema.index({ userId: 1, dateTime: -1 });
AuditTrailSchema.index({ sessionId: 1 });
AuditTrailSchema.index({ event: 1, category: 1 });
AuditTrailSchema.index({ dateTime: -1 });

// Export the schema
module.exports = AuditTrailSchema;