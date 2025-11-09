const https = require('https');
const nodemailer = require('nodemailer');
var mongoose = require('mongoose');
var messageLogSchema = require('../models/MessageLog');
let constants = require('../config/constants')
var MessageLog = mongoose.model('message_log', messageLogSchema);
const request = require('request');

// Should be defined in the system variable
process.env.MEDICS_CARE_PRODUCTION_ENVIRONMENT = "1";
process.env.MEDICS_CARE_EMAIL_USER = "medics-care@ubq.in";
process.env.MEDICS_CARE_EMAIL_PWD = "medicscare@1981";

module.exports.signInTemplate = {
	"OTP": "#OTP# is your OTP for signing in to medics care"  + " -medics"
};

module.exports.signUpTemplate = {
	"OTP": "#OTP# is your OTP for registering into medics care" + " -medics"
};

module.exports.sendSMS = function (phone, message, hospitalCode) {

	if (phone) {

//FMP SMS Gateway
		// let payload = {
		// 	"username": constants.fmpUser,
		// 	"password": constants.fmpPassword,
		// 	"phonenumber": phone,
		// 	"brandname": constants.fmpBrand,
		// 	"message": message,
		// 	"type": "0"
		// }
		// request.post({
		// 	headers: {
		// 		'content-type': 'application/x-www-form-urlencoded'
		// 	},
		// 	url: 'http://221.132.39.104:8088/api/sendsms',
		// 	body: payload
		// }, function (error, response, body) {
		// 	console.log(body);
		// });



		let options = {
			hostname: 'https://www.mgage.solutions',
			path: '/SendSMS/sendmsg.php?uname=ubqtr&pass=ubq!SMS14&send=MEDICS&dest=91' + phone + '&msg=' + encodeURI(message)
		};

		let url = options.hostname + options.path;
		console.log('Sending SMS... ' + url);

		var messageLog = {
			customerCode: (hospitalCode ? hospitalCode : 'APP'),
			type: 'SMS',
			recipient: phone,
			body: message
		}

		https.get(url, function (res) {
			console.log("SMS Send: Got response: " + res.statusCode);

			messageLog.status = 'SUCCESS';
			messageLog.responseDetails = {
				response: "res"
			};

			new MessageLog(messageLog).save();

		}).on('error', function (e) {

			messageLog.status = 'FAILED';
			messageLog.responseDetails = {
				error: e
			};

			new MessageLog(messageLog).save();

			console.error("SMS Send: Got error: " + e.message);
		});

	}

};

let _sendMail = function (mail) {
	// Check if the medics-care user and passwords are set
	if (!process.env.MEDICS_CARE_EMAIL_USER || !process.env.MEDICS_CARE_EMAIL_PWD) {
		console.error("!!!!! medics email user/password not set !!!!!");

		return;
	}

	var transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.MEDICS_CARE_EMAIL_USER,
			pass: process.env.MEDICS_CARE_EMAIL_PWD
		},
		tls: {
			rejectUnauthorized: false
		}
	});

	var mailOptions;

	if (process.env.MEDICS_CARE_PRODUCTION_ENVIRONMENT) {
		mailOptions = {
			from: 'medics-care@ubq.in',
			to: mail.to,
			cc: (mail.cc ? mail.cc : ''),
			subject: mail.subject,
			html: mail.body,
			attachments: mail.attachments
		};
	} else {
		// Set your own From and To email addresses for TESTING
		mailOptions = {
			from: 'medics-care@ubq.in',
			to: mail.to,
			cc: (mail.cc ? mail.cc : ''),
			subject: '[TEST] ' + mail.subject,
			html: mail.body,
			attachments: mail.attachments
		};
	}

	console.log('About to send mail to ' + mail.to);

	var messageLog = {
		customerCode: (mail.hospitalCode ? mail.hospitalCode : 'APP'),
		type: 'EMAIL',
		recipient: mail.to,
		subject: mail.subject,
		body: mail.body
	}

	transporter.sendMail(mailOptions, function (sendMailerror, info) {
		if (sendMailerror) {
			console.error('***** Mail send error' + sendMailerror);

			messageLog.status = 'FAILED';
			messageLog.responseDetails = {
				error: sendMailerror
			};

			new MessageLog(messageLog).save();

		} else {
			console.log('Mail sent: ...................' + info.response);

			messageLog.status = 'SUCCESS';
			messageLog.responseDetails = {
				response: info
			};

			new MessageLog(messageLog).save();

		}
	});

};

module.exports.sendMail = function (mail) {
	try {
		_sendMail(mail);
	} catch (e) {
		console.error(e);
	}
};