var mongoose = require('mongoose');
var restful = require('node-restful');

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');


module.exports = function (app, route) {

	var resource = restful.model('customer_issues', app.models.customerIssue);
	var rest = resource.methods(['get', 'post', 'put']);
	var CustomerIssue = mongoose.model('customer_Issue', app.models.customerIssue);

	app.get(route, function (req, res, next) {

		CustomerIssue.find({})
			.sort({
				sequence: 1
			})

			.exec(function (err, customerIssues) {

				if (err) {
					return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message || err));
				} else {
					return ResponseHandler.success(res, customerIssues);
				}

			});

	});

	// Register this endpoint
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