var mongoose = require('mongoose');

var MessageLogSchema = new mongoose.Schema({

    customerCode: {
        type: String
    },

    type: {
        type: String,
        enum: ['SMS', 'EMAIL'],
        required: true,
        default: 'SMS'
    },

    recipient: String,

    subject: String,

    body: String,

    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED'],
        required: true,
        default: 'SUCCESS'
    },

    responseDetails: {
        type: mongoose.Schema.Types.Mixed
    },

    createdDate: {
        type: Date,
        default: Date.now
    }

}, {
    usePushEach: true
});

// Export the schema
module.exports = MessageLogSchema;