var restful = require('node-restful');
var mongoose = require('mongoose');

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');
const SelectedFamilyMemberHelper = require('../utils/SelectedFamilyMemberHelper');


module.exports = function (app, route) {

	var resource = restful.model('notification', app.models.notification);
	var rest = resource.methods(['get', 'put', 'post', 'delete']);

	var Notification = mongoose.model('notification', app.models.notification);

	app.get(route, function (req, res, next) {

		var userId = req.query.userId;
		var selectedFamilyMemberId = req.query.selectedFamilyMemberId;

		const query = {
			userId: mongoose.Types.ObjectId(userId),
			status: {
				$ne: 'PENDING'
			}
		};

		// Add family member filter if provided (only show notifications with matching familyMemberId or no familyMemberId for backward compatibility)
		if (selectedFamilyMemberId) {
			query.$or = [
				{ familyMemberId: mongoose.Types.ObjectId(selectedFamilyMemberId) },
				{ familyMemberId: { $exists: false } },
				{ familyMemberId: null }
			];
		}

		Notification.find(query, function (err, nots) {

			if (err) {
				return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message));
			}

			return ResponseHandler.success(res, nots);

		});

	});

	app.get(route + "/markasread", function (req, res, next) {

		var userId = req.query.userId;
		var selectedFamilyMemberId = req.query.selectedFamilyMemberId;

		const query = {
			'userId': mongoose.Types.ObjectId(userId),
			'read': false
		};

		// Add family member filter if provided (only mark notifications with matching familyMemberId or no familyMemberId for backward compatibility)
		if (selectedFamilyMemberId) {
			query.$or = [
				{ familyMemberId: mongoose.Types.ObjectId(selectedFamilyMemberId) },
				{ familyMemberId: { $exists: false } },
				{ familyMemberId: null }
			];
		}

		Notification.find(query, function (err, nots) {

			if (err) {
				return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message));
			}

			if (nots.length > 0) {

				nots.forEach(function (not) {

					not.read = true;

					not.save();

				});
			}

			return ResponseHandler.success(res, null, 'Marked all notifications as read for the user');

		});

	});

	app.get(route + "/unread", function (req, res, next) {

		var userId = req.query.userId;
		var selectedFamilyMemberId = req.query.selectedFamilyMemberId;

		const query = {
			'userId': mongoose.Types.ObjectId(userId),
			'read': false,
			'status': {
				$ne: 'PENDING'
			}
		};

		// Add family member filter if provided (only count notifications with matching familyMemberId or no familyMemberId for backward compatibility)
		if (selectedFamilyMemberId) {
			query.$or = [
				{ familyMemberId: mongoose.Types.ObjectId(selectedFamilyMemberId) },
				{ familyMemberId: { $exists: false } },
				{ familyMemberId: null }
			];
		}

		Notification.find(query, function (err, notifications) {

			if (err) {
				return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message));
			}

			var data = {
				"count": notifications.length
			};

			return ResponseHandler.success(res, data);

		});
	});
    // Wrap node-restful responses in standardized format
    rest.after('get', function(req, res, next) {
        const data = res.locals.bundle;
        return ResponseHandler.success(res, data);
    });

    rest.after('post', function(req, res, next) {
        const data = res.locals.bundle;
        if (data.message || data.errmsg) {
            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, data.errmsg || data.message));
        }
        return ResponseHandler.success(res, data);
    });

    rest.after('put', function(req, res, next) {
        const data = res.locals.bundle;
        if (data.message || data.errmsg) {
            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, data.errmsg || data.message));
        }
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