var mongoose = require('mongoose');
var restful = require('node-restful');
var httpService = require('../services/HTTPService.js');
var auditTrailService = require('../services/AuditTrailService.js');

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');


module.exports = function (app, route) {

	var resource = restful.model('family_member_hospital_accounts', app.models.familyMemberHospitalAccount);
	var rest = resource.methods(['get', 'put', 'post', 'delete']);
	var Hospital = mongoose.model('hospitals', app.models.hospital);

	rest.before('post', function (req, res, next) {

		var hospitalCode = req.body.hospitalCode;

		Hospital.findOne({
			"code": hospitalCode
		}, function (err, hospital) {

			if (err) {

				console.error(err);
				return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message || err));

			} else {

				req.body.hospitalId = hospital._id;
				req.body.hospitalName = hospital.name;

				console.log("Hospital: ", hospital);
				next();

			}
		});

	});

	rest.after('post', function (req, res, next) {
		console.log("Data saved");

		var data = res.locals.bundle;

		if (data.errmsg) {

			console.error(data.errmsg);

			var errorMessage = data.errmsg;
			var errorCode = ErrorCodes.DATABASE_ERROR;

			if (data.code == "11000") {
				errorMessage = "Patient is already mapped.";
				errorCode = ErrorCodes.CONFLICT;
			}

			return ResponseHandler.error(res, new AppError(errorCode, errorMessage));
		}

		auditTrailService.log(req, auditTrailService.events.FAMILY_MEMBER_MAPPED_TO_HOSPITAL,
			'Family member mapped to hospital', data);

		return ResponseHandler.success(res, data);

	});

	// Wrap node-restful responses in standardized format
    rest.after('get', function(req, res, next) {
        const data = res.locals.bundle;
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

	app.get(route + '/patient', function (req, res, next) {

		var hospitalCode = req.query.hospitalCode;

		var body = {
			"entityCode": hospitalCode,
			"phoneNo": req.query.phoneNo
		};

		console.log('Processing ' + JSON.stringify(body));
		httpService.doGet(hospitalCode, '/patients', body, success, error);

		function success(response) {

			auditTrailService.log(req, auditTrailService.events.SEARCHING_PATIENT_IN_MEDICS_FOR_FAMILY_MEMBER,
				'Searching for patient in medics', body);

			console.log('Success: ' + JSON.stringify(response));
			return ResponseHandler.success(res, response);

		}

		function error(error) {
			console.error('Error: ' + error);
			return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, error.message || error));
		}

	});


	// Return middleware
	return function (req, res, next) {
		next();
	};

};