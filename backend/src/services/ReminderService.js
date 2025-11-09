var mongoose = require('mongoose');

var familyMemberSchema = require('../models/FamilyMember.js');
var FamilyMember = mongoose.model('family_member', familyMemberSchema);

var reminderSchema = require('../models/Reminder.js');
var Reminder = mongoose.model('reminder', reminderSchema);

var notificationService = require('./NotificationService.js');

var methods = {};

methods.scheduleReminder = function (reminder) {

    if (reminder.objectId == null || reminder.objectName == null ||
        reminder.reminderNotificationDetails == null || reminder.familyMemberId == null) {
        console.error('Failed to schedule a reminder. FamilyMemberId, ObjectId, ObjectName, ' +
            'ReminderDetails, ReminderNotificationDetails are mandaory');
        return;
    }

    methods.clearReminder(reminder.objectId, reminder.objectName, () => {

        FamilyMember.findById(reminder.familyMemberId).exec(
            function (err, familyMember) {

                reminder.familyMemberName = familyMember.fullName;
                reminder.userId = familyMember.userId;

                new Reminder(reminder).save();

                if (reminder.remindAt > new Date()) {

                    var notification = {
                        'notifyAt': reminder.remindAt,
                        'userId': reminder.userId,
                        'objectId': reminder.objectId,
                        'objectName': reminder.objectName,
                        'title': reminder.reminderNotificationDetails.title,
                        'message': reminder.reminderNotificationDetails.message,
                        'path': reminder.reminderNotificationDetails.path,
                        'notificationDetails': reminder.reminderDetails
                    };

                    notificationService.scheduleNotification(notification);
                }

            });

    });

};

methods.clearReminder = function (objectId, objectName, cbFunction) {

    Reminder.deleteMany({
        'objectId': objectId,
        'objectName': objectName
    }, function (err) {

        if (err) return handleError(err);

        notificationService.clearNotifications(objectId, objectName);

        if (cbFunction) {
            cbFunction();
        }

    });

};

methods.inActivateReminder = function (objectId, objectName, cbFunction) {

    Reminder.findOne({
        'objectId': objectId,
        'objectName': objectName
    }, function (err, reminder) {

        if (err) return handleError(err);

        if (reminder){
        reminder.active = false;
        reminder.save();
        }


        if (cbFunction) {
            cbFunction();
        }

    });

};


module.exports = methods;