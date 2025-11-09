var mongoose = require('mongoose');

var ReminderSchema = new mongoose.Schema({

    remindAt: {
        type: Date
    },

    userId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    familyMemberId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    familyMemberName: {
        type: String,
        required: true
    },

    objectId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    objectName: {
        type: String,
        required: true
    },

    reminderDetails: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },

    reminderNotificationDetails: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },

    reminderType: {
        type: String,
        required: true,
        default: 'OTHERS' //  'APPOINTMENT', 'MEDICINE', 'HEALTH_CHECKUP', 'LABTEST'
    },

    active: {
        type: Boolean,
        required: true,
        default: true
    },

    read: {
        type: Boolean,
        required: true,
        default: false
    },

    createdDate: {
        type: Date,
        default: Date.now
    }

}, {
    usePushEach: true
});

// Export the schema
module.exports = ReminderSchema;