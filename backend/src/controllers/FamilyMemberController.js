var restful = require('node-restful');
var mongoose = require('mongoose');
var auditTrailService = require('../services/AuditTrailService.js');

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');


module.exports = function (app, route) {

	var resource = restful.model('family_member', app.models.familyMember);
	var rest = resource.methods(['get', 'put', 'post', 'delete']);

	var FamilyMember = mongoose.model('family_member', app.models.familyMember);
	var FamilyMemberHospitalAccount = mongoose.model('family_member_hospital_account', app.models.familyMemberHospitalAccount);

	rest.before('post', function (req, res, next) {

		var User = mongoose.model('User', app.models.user);

		var userId = req.body.userId;

		User.findById(userId)
			.exec(function (err, user) {

				if (!user) {

					console.error('INVALID_USER: Invalid userId');

					return ResponseHandler.error(res, new AppError(ErrorCodes.INVALID_USER, "Invalid userId"));

				} else {
					next();
				}

			});

	});


	rest.after('post', function (req, res, next) {

		console.log("Data saved");

		var data = res.locals.bundle;

		if (data.errmsg || data.message) {
			console.error('Database error:', data.errmsg || data.message);
			return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, data.errmsg || data.message));
		}

		// Update the user with first name and other details....
		auditTrailService.log(req, auditTrailService.events.FAMILY_MEMBER_ADDED,
			'Family member added', data);

		return ResponseHandler.success(res, data);

	});

	rest.after('put', function (req, res, next) {

		var data = res.locals.bundle;

		if (data.errmsg || data.message) {
			console.error('Database error:', data.errmsg || data.message);
			return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, data.errmsg || data.message));
		}

		auditTrailService.log(req, auditTrailService.events.FAMILY_MEMBER_MODIFIED,
			'Family member modified', data);

		return ResponseHandler.success(res, data);

	});

	rest.before('delete', function (req, res, next) {

		var familyMemberId = req.params.id;

		FamilyMember.findById(familyMemberId, function (errFamilyMember, familyMember) {

			if (familyMember && familyMember.isAppUser) {

				console.error('FAILED: Cannot delete the primary family member');

				return ResponseHandler.error(res, new AppError(ErrorCodes.VALIDATION_ERROR, "Cannot delete the primary family member"));

			} else {
				next();
			}

		});

	});

	rest.after('delete', function (req, res, next) {

		var familyMemberId = req.params.id;
		var data = res.locals.bundle;

		FamilyMemberHospitalAccount.deleteMany({
			"familyMemberId": familyMemberId
		}, function (err, result) {
			console.log("Deleted all mapping of family members");

			auditTrailService.log(req, auditTrailService.events.FAMILY_MEMBER_DELETED,
				'Family member deleted for familyMemberId: ' + familyMemberId);

			return ResponseHandler.success(res, data);
		});

	});

	// Add standardized response handler for GET requests
	rest.after('get', function(req, res, next) {
		const data = res.locals.bundle;
		return ResponseHandler.success(res, data);
	});

	// Register this endpoint
	rest.register(app, route);

	// Return middleware
	return function (req, res, next) {
		next();
	};

};