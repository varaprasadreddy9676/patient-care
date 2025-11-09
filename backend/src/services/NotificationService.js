var mongoose = require('mongoose');

var user = require('../models/User');
var User = mongoose.model('User', user);

var notification = require('../models/Notification');
var Notification = mongoose.model('notification', notification);

var methods = {};

methods.scheduleNotification = function (notification) {
    _scheduleNotification(notification);
};

methods.sendNotification = function (notification) {
    notification.notifyAt = new Date();
    _scheduleNotification(notification);
};

function _scheduleNotification(notification) {

    if (notification.objectId == null || notification.objectName == null || notification.path == null ||
        notification.userId == null || notification.title == null || notification.message == null) {
        console.error('Failed to schedule a notification. UserId, ObjectId, ObjectName, Path, Title and Message is mandaory');
        return;
    }

    methods.clearNotifications(notification.objectId, notification.objectName, () => {

        User.findById(notification.userId)
            .exec(function (err, user) {

                notification.playerId = user.playerId;
                notification.phone = user.phone;

                new Notification(notification).save();

            });

    });

}

methods.clearNotifications = function (objectId, objectName, cbFunction) {

    Notification.deleteMany({
        'objectId': objectId,
        'objectName': objectName
    }, function (err) {

        if (err) return handleError(err);

        if (cbFunction) {
            cbFunction();
        }

    });

};


module.exports = methods;