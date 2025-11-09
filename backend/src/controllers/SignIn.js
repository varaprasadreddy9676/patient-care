var mongoose = require('mongoose');
var Messenger = require('../services/CommunicationService.js');
var auditTrailService = require('../services/AuditTrailService.js');
const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');

module.exports = function (app, route) {

	var User = mongoose.model('User', app.models.user);

	app.get(route, function (req, res, next) {

		var appId = req.query.appId ? req.query.appId : "";
		var mobileNo = req.query.mobileNo;
		let entityCode = "null";

		const messenger = new Messenger();

		User.findOne({
			"phone": mobileNo,
			"appId": appId
		})
			.exec(function (err, user) {
				if (err) {
					console.error(err);
					return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message));
				}

				if (user) {

					user.setOTP();

					user.save();

					console.log("Updated token");

					var otpTemplate = "#OTP# is your OTP for signing in to medics care -medics";
					if (otpTemplate) {
						otpTemplate = otpTemplate.replace('#OTP#', user.otp);

						if (user.email) {
							var mail = {
								to: user.email,
								subject: 'OTP for medics care',
								body: otpTemplate
							}

							messenger.sendMail(mail);
						}

						var appHashCode = req.query.appHashCode ? req.query.appHashCode : 'TBqVj3kOyEc';
					//	otpTemplate = otpTemplate + "\n" + appHashCode;
						messenger.sendSMS(user.phone, otpTemplate, entityCode);

						messenger.sendWhatsappMessage(user.phone, user.otp);

						req.user = user;

						auditTrailService.log(req, auditTrailService.events.OTP_SENT, 'OTP sent to ' + user.phone + ' for signing in');
					}

					return ResponseHandler.success(res, {
						profileId: user._id
					});

				} else {
					var message = 'Invalid user';
					console.error(message);
					return ResponseHandler.error(res, new AppError(ErrorCodes.USER_NOT_FOUND, message));
				}

			});

	});

	// Return middleware
	return function (req, res, next) {
		next();
	};

};