var restful = require('node-restful');
var jwt = require('jsonwebtoken');
var Constants = require('../config/constants.js');
var auditTrailService = require('../services/AuditTrailService.js');
const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');

module.exports = function (app, route) {

	var resource = restful.model('users', app.models.user);

	var rest = resource.methods(['get', 'put', 'post', 'patch']);

	rest.after('get', function (req, res, next) {

		// get the object
		// remove token, hash.....
		//next();

		var data = res.locals.bundle;
		data.token = null; //.remove("token");
		data.otp = null;
		data.hash = null;
		data.salt = null;

		return ResponseHandler.success(res, data);

	});

	app.get(route + '/verifyToken', function (req, res, next) {

		var authorization = req.headers.authorization;
		var token = authorization && authorization.split(" ").length == 2 ?
			authorization.split(" ")[1] : "";

		jwt.verify(token, Constants.SECRET_KEY, function (err, user) {
			if (err) {

				if (err.name === 'TokenExpiredError') {
					return ResponseHandler.error(res, new AppError(ErrorCodes.TOKEN_EXPIRED, err.message));
				}

				return ResponseHandler.error(res, new AppError(ErrorCodes.INVALID_TOKEN, err.message));

			} else {

				return ResponseHandler.success(res, {
					profileId: user._id
				});

			}
		});

	});

	// Register this endpoint
	rest.register(app, route);

	// Return middleware
	return function (req, res, next) {
		next();
	};

};