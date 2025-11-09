var mongoose = require('mongoose');

// Create the ConsentFormRecording Schema
var ConsentFormRecordingSchema = new mongoose.Schema({

    templateCode: {
        type: String,
        required: true,
    },

    userId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    familyMemberId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    hospitalCode: {
        type: String,
        required: true,
    },

    userName: {
        type: String,
        required: true
    },

    contextId: {
        type: mongoose.Schema.ObjectId,
    },

    contextType: {
        type: String,
        required: true,
        default: "VIDEO_CONSULTATION"
    },

    template: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },

    status: {
        type: String,
        enum: ['AGREED', 'DECLINED'],
        required: true,
    },

    recordedDateTime: {
        type: Date,
        default: Date.now,
        required: true
    },

});

// Export the schema
module.exports = ConsentFormRecordingSchema;