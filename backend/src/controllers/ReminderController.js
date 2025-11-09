var mongoose = require('mongoose');

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');
const SelectedFamilyMemberHelper = require('../utils/SelectedFamilyMemberHelper');


module.exports = function (app, route) {

	// var resource = restful.model('reminder', app.models.reminder);
	// var rest = resource.methods(['get', 'put', 'post', 'delete']);

	var Reminder = mongoose.model('reminder', app.models.Reminder);

	app.get(route, function (req, res, next) {

		var userId = req.query.userId;
		var selectedFamilyMemberId = req.query.selectedFamilyMemberId;

		const query = {
			'userId': mongoose.Types.ObjectId(userId),
			'active': true,
			'remindAt': {
				$gte: new Date()
			}
		};

		// Add family member filter if provided
		if (selectedFamilyMemberId) {
			query.familyMemberId = mongoose.Types.ObjectId(selectedFamilyMemberId);
		}

		Reminder.find(query, function (err, reminders) {

			if (err) {
				return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message));
			}

			if (!reminders) {
				reminders = [];
			}

			return ResponseHandler.success(res, reminders);

		});

	});

	app.get(route + "/markasread", function (req, res, next) {

		var userId = req.query.userId;
		var selectedFamilyMemberId = req.query.selectedFamilyMemberId;

		const query = {
			'userId': mongoose.Types.ObjectId(userId),
			'read': false
		};

		// Add family member filter if provided
		if (selectedFamilyMemberId) {
			query.familyMemberId = mongoose.Types.ObjectId(selectedFamilyMemberId);
		}

		Reminder.find(query, function (err, reminders) {

			if (err) {
				return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message));
			}

			if (reminders.length > 0) {

				reminders.forEach(function (reminder) {

					reminder.read = true;

					reminder.save();

				});
			}

			// auditTrailService.log(req, auditTrailService.events.REMINDER_OPENED,	'Reminder opened');

			return ResponseHandler.success(res, null, 'Marked all reminders as read for the user');

		});

	});


	app.get(route + "/unread", function (req, res, next) {

		var userId = req.query.userId;
		var selectedFamilyMemberId = req.query.selectedFamilyMemberId;

		const query = {
			'userId': mongoose.Types.ObjectId(userId),
			'read': false,
			'remindAt': {
				$lt: new Date()
			}
		};

		// Add family member filter if provided
		if (selectedFamilyMemberId) {
			query.familyMemberId = mongoose.Types.ObjectId(selectedFamilyMemberId);
		}

		Reminder.find(query, function (err, reminders) {

			if (err) {
				return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message));
			}

			var data = {
				"count": reminders.length
			};

			return ResponseHandler.success(res, data);

		});
	});

	// Return middleware
	return function (req, res, next) {
		next();
	};

};