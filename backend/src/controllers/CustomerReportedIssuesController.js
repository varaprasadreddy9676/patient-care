var mongoose = require('mongoose');
var restful = require('node-restful');
var notificationService = require('../services/NotificationService.js');
var Messenger = require('../services/CommunicationService.js');

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');

var messenger = new Messenger();

module.exports = function (app, route) {

    var resource = restful.model('customer_reported_issue', app.models.customerReportedIssues);
    var rest = resource.methods(['get', 'post', 'put', 'delete']);

    rest.after('put', function (req, res, next) {

        var issueId = req.body._id;
        var userId = req.body.userId;
        var issueName = req.body.issueName;

        var title = 'Issue Resolved';
        var message = 'Your reported issue ' + issueName + ' has been resolved';

        var notification = {
            'userId': userId,
            'objectId': issueId,
            'objectName': 'CustomerReportedIssue',
            'title': title,
            'message': message,
            'path': 'customer-service',

        };

        notificationService.sendNotification(notification);

        console.log(res.locals.bundle);

        const data = res.locals.bundle;
        if (data.message || data.errmsg) {
            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, data.errmsg || data.message));
        }
        return ResponseHandler.success(res, data);

    });

    rest.after('post', function (req, res, next) {
        try {
            const {
                issueDescription = '',
                problemDescription = '',
                userName = '',
                phone = '',
                platform = [],
                version = ''
            } = req.body;
    
            const entityCode = "medics";
    
            const emailBody = `
                <html>
                <body>
                    <div class="issue-title">${issueDescription}</div>
                    <div class="description">${problemDescription}</div>
                    <div class="reporter-info">
                        <strong>Reported By:</strong><br>
                        ${userName}<br>
                        ${phone}
                    </div>
                    <div class="system-info">
                        App Version: ${version || 'N/A'} (${platform[0] || 'N/A'})
                    </div>
                </body>
                </html>
            `;

            const plainText = emailBody.replace(/<[^>]*>/g, '');
    
            const mail = {
                to: 'support@ubq.in',
                cc: [ 'sai.varaprasad@ubq.in', 'prakash.p@ubq.in', 'medics-impl-team@ubq.in'],
                subject: 'ATTENTION: medics care customer issue reported',
                body: plainText
            };
    
            const smsMessage = `mc issue reported: ${issueDescription} by ${userName} - ${phone}`;
            
            Promise.all([
                messenger.sendMail(mail),
                messenger.sendSMS('9945173738', smsMessage, entityCode),
                messenger.sendSMS('9741866433', smsMessage, entityCode),
                messenger.sendSMS('9515557495', smsMessage, entityCode)
            ])
            .then(() => {
                const data = res.locals.bundle;
                if (data.message || data.errmsg) {
                    return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, data.errmsg || data.message));
                }
                return ResponseHandler.success(res, data);
            })
            .catch((error) => {
                console.error('Notification sending failed:', error);
                return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to send notifications'));
            });

        } catch (error) {
            console.error('Error processing request:', error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Internal server error'));
        }
    });



    // Register GET and DELETE hooks with standardized responses
    rest.after('get', function(req, res, next) {
        const data = res.locals.bundle;
        return ResponseHandler.success(res, data);
    });

    rest.after('delete', function(req, res, next) {
        const data = res.locals.bundle;
        return ResponseHandler.success(res, data);
    });

    rest.register(app, route);

    // Return middleware
    return function (req, res, next) {
        next();
    };

};