var notification = require('../models/Notification');
var Messenger = require('../services/CommunicationService');
var messenger = new Messenger();
const https = require('https');
const request = require('request');
var mongoose = require('mongoose');

const MAX_ATTEMPT_COUNT = 3;
const POLL_INTERVAL = 10; // in secs

var Notification = mongoose.model('notification', notification);


// trigger notifications
function pushNotifications() {

    Notification.find({
            $or: [{
                'status': 'PENDING',
            }, {
                'status': 'FAILED',
            }],
            'notifyAt': {
                $lt: new Date()
            }
        })
        .exec(function (err, notificationList) {

            if (err) {
                console.log(err);
            }

            notificationList.forEach(not => {

                try {
                    sendNotification(not);
                } catch (e) {
                    console.log(e);
                }

            });

        });

}

var notificationAgentOptions = {
    host: 'fcm.googleapis.com',
    path: '/fcm/send',
    rejectUnauthorized: false
};

var serverKey = 'Key=AAAAEpBg3Ck:APA91bHQ1nFDZz2CzsMzqW1yfYJPW2r3LX12-lX5NIIgKfmWWym3rQWWO8Cn2zoZrPJ5HB4BWkNkBZA56RMHre1zHqZG3ye2wVoq8G0lLJXhLsUqa1wcC4ufEwTxZGAZ_QAP2lOXrpE5';

var headers = {
    'Authorization': serverKey,
    'Content-type': 'application/json'
};



function sendNotification(not) {

    not.notificationDetails.path = not.path;

    var payload = {
        "to": not.playerId,
        "collapse_key": "green",
        "notification": {
            "title": not.title,
            "body": not.message,
            "priority": "high",
            "icon": "fcm_push_icon",
            "color": "#71890d"
        },
        "data": not.notificationDetails,
        "priority": "high"
    };


    if (not.phone) {
        messenger.sendSMS(not.phone, not.message, not.hospitalCode);
    }


    var agent = new https.Agent(notificationAgentOptions);

    let url = 'https://' + notificationAgentOptions.host + notificationAgentOptions.path;

    // console.log('Sending notification with id ' + not.externalId + ' for ' + user.userName);

    request({
        url: url,
        method: 'POST',
        agent: agent,
        headers: headers,
        body: payload,
        json: true
    }, function (err, resp, body) {

        if (body.failure > 0) {

            if (not.retryCount >= MAX_ATTEMPT_COUNT) {
                not.status = 'PERMANENTLY-FAILED';
            } else {
                not.retryCount += 1;
                not.status = 'FAILED';
            }

        } else {
            not.status = 'SUCCESS';
        }

        not.statusMessage.push(JSON.stringify(body));

        not.save();

    });

}



console.log('Starting the notification engine to push in ' + POLL_INTERVAL + ' seconds');
setInterval(pushNotifications, POLL_INTERVAL * 1000);