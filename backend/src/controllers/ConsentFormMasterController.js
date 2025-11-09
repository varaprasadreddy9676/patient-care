var mongoose = require('mongoose');
var restful = require('node-restful');

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');


module.exports = function (app, route) {

	var resource = restful.model('consent_form_master', app.models.consentFormMaster);
	var rest = resource.methods(['get', 'post', 'put']);

	var ConsentFormMaster = mongoose.model('consent_form_master', app.models.consentFormMaster);

	app.get(route, function (req, res, next) {

		var hospitalCode = req.query.hospitalCode;
		var consentFormType = req.query.cft;
		var language = req.query.lang;

		console.log("consentFormType: " + consentFormType);
		console.log("language: " + language);

		ConsentFormMaster.findOne({
			"hospitalCode": hospitalCode,
			"type": consentFormType,
			"language": language
		}, function (err, consentForm) {

			if (err) {
				console.error("Error 1: " + err);
				return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message || err));
			}

			if (consentForm) {

				_handleConsentForm(req, res, consentForm);

			} else {

				ConsentFormMaster.findOne({
					"hospitalCode": "",
					"type": consentFormType,
					"language": language
				}, function (err2, consentForm) {

					if (err2) {
						console.error("Error 2 :" + err2);
						return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err2.message || err2));
					}

					if (consentForm) {

						_handleConsentForm(req, res, consentForm);

					} else {
						return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, "Consent form not found"));
					}

				});

			}

		});

		function _handleConsentForm(req, res, consentForm) {

			try {

				consentForm = JSON.parse(JSON.stringify(consentForm));

				var placeholderData = {};
				if (req.query.pd) {
					placeholderData = JSON.parse(req.query.pd);
				}

				for (var key in placeholderData) {

					if (placeholderData.hasOwnProperty(key)) {

						consentForm.template = consentForm.template.split("##" + key + "##").join(placeholderData[key]);

					}
				}

				res.set('Content-Type', 'text/html');
				return ResponseHandler.success(res, consentForm);

			} catch (e) {
				console.log(e);
				return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, e.message || e));
			}
		}

	});

	app.get(route + "/templateLanguages", function (req, res, next) {

		var hospitalCode = req.query.hospitalCode;
		var consentFormType = req.query.cft;

		ConsentFormMaster.find({
			"hospitalCode": hospitalCode,
			"type": consentFormType,
		}, function (err, consentForm) {

			if (err) {
				console.error("Error fetching template languages: " + err);
				return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message || err));
			}

			if (consentForm) {
				var data = JSON.parse(JSON.stringify(consentForm));

				var templateLanguages = data.map(function (item) {
					return { language: item.language };
				});

				console.log(templateLanguages);
				return ResponseHandler.success(res, templateLanguages);
			}

			return ResponseHandler.success(res, []);

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