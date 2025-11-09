var mongoose = require('mongoose');

// Create the Notification Schema
var NotificationSchema = new mongoose.Schema({

    hospitalCode: {
        type: String,
        required: true,
        default: 'APP'
    },

    notifyAt: {
        type: Date,
        required: true
    },

    userId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    familyMemberId: {
        type: mongoose.Schema.ObjectId,
        required: false  // Optional for backward compatibility
    },

    objectId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    objectName: {
        type: String,
        required: true
    },

    title: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },

    path: {
        type: String,
        required: true
    },

    notificationDetails: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },

    playerId: {
        type: String
    },

    phone: {
        type: String
    },

    status: {
        type: String,
        required: true,
        default: "PENDING" // PENDING; SENT; FAILED
    },

    statusMessage: {
        type: Array,
        default: []
    },

    retryCount: {
        type: Number,
        default: 0
    },

    read: {
        type: Boolean,
        required: true,
        default: false
    },

    createdDate: {
        type: Date,
        default: Date.now
    },


}, {
    usePushEach: true
});

// Export the schema
module.exports = NotificationSchema;