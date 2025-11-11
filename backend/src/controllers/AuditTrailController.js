var restful = require('node-restful');
var auditTrailService = require('../services/AuditTrailService.js');

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');


module.exports = function (app, route) {

	var resource = restful.model('audit_trails', app.models.auditTrail);
	var rest = resource.methods(['get']);


	app.get(route + "/event", function (req, res, next) {

		return ResponseHandler.success(res, auditTrailService.events);

	});

	// Batch event tracking endpoint for analytics
	app.post(route + "/batch", async function (req, res, next) {
		try {
			const { events, sessionId } = req.body;

			if (!events || !Array.isArray(events)) {
				return ResponseHandler.error(res,
					new AppError(ErrorCodes.INVALID_INPUT, 'Events array required'));
			}

			if (events.length === 0) {
				return ResponseHandler.success(res, { saved: 0 });
			}

			// Prepare audit entries
			const auditEntries = events.map(e => ({
				event: e.event,
				category: e.category || 'user_action',
				details: e.details,
				referenceObject: e.metadata,
				sessionId: e.sessionId || sessionId,
				page: e.page,
				userId: e.userId || (req.user ? req.user._id : null),
				userName: e.userName || (req.user ? req.user.firstName : ''),
				phone: e.phone || (req.user ? req.user.phone : null),
				ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
				dateTime: e.timestamp ? new Date(e.timestamp) : new Date()
			}));

			// Bulk insert (fast!)
			await app.models.auditTrail.insertMany(auditEntries);

			return ResponseHandler.success(res, {
				saved: auditEntries.length,
				message: 'Events tracked successfully'
			});

		} catch (error) {
			console.error('Batch tracking error:', error);
			return ResponseHandler.error(res,
				new AppError(ErrorCodes.DATABASE_ERROR, error.message));
		}
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