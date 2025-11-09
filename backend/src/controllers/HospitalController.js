var restful = require('node-restful');
var mongoose = require('mongoose');

var httpService = require('../services/HTTPService.js');

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');


module.exports = function (app, route) {

	var resource = restful.model('hospital', app.models.hospital);
	var rest = resource.methods(['get', 'put']);

	var Hospital = mongoose.model('hospitals', app.models.hospital);
	var HospitalResourceDetail = mongoose.model('hospital_resource_detail', app.models.hospitalResourceDetail);

	app.get(route + '/sync', function (req, res, next) {

		syncHospital();

		var data = {
			"message": "Hospital syncing completed"
		}

		console.log(data);
		return ResponseHandler.success(res, null, data.message);

	});


	function syncHospital() {

		HospitalResourceDetail.find({}, function (err, hospitalResourceDetails) {

			if (err) throw err;

			hospitalResourceDetails.forEach(function (hospitalResourceDetail, index) {

				var agentOptions = hospitalResourceDetail.agentOptions;

				agentOptions.authDetails = hospitalResourceDetail.authDetails;
				agentOptions.authDetails.hospitalCode = hospitalResourceDetail.authDetails.ubqHospitalCode;

				httpService.request(agentOptions, 'get', '/hospitals', null, success, error);

				function success(response) {

					if (!response.data) {
						var errMsg = 'Failed to get hospital data';
						console.log(errMsg);
						throw errMsg;
					}

					// console.log('Success: ' + JSON.stringify(response));

					var hospitals = response.data.hospitals;

					for (var i = 0; i < hospitals.length; i++) {

						var hospital = hospitals[i];
						hospital.entityId = hospital.id;

						if (hospital.name) {
							hospital.name = hospital.name.toUpperCase();
						}

						hospital.resourceId = hospitalResourceDetail._id;
						hospital.active = false;
						hospital.contactDetails = {
							"name": "Help desk",
							"phone": ""
						};

						if (hospital.paymentGatewayDetails == null) {
							continue;
						} else {
							hospital.paymentGatewayDetails = JSON.parse(hospital.paymentGatewayDetails);
						}

						if (hospital.authDetails == null) {
							hospital.authDetails = {
								userId: hospitalResourceDetail.authDetails.userId,
								password: hospitalResourceDetail.authDetails.password
							};
						}

						// Deleting the fields from the object. Update with upsert not supported with same fields
						let mapGeographicPoints = hospital.mapGeographicPoints;
						delete hospital.mapGeographicPoints;
						let address = hospital.address;
						delete hospital.address;
						let paymentGatewayDetails = hospital.paymentGatewayDetails;
						delete hospital.paymentGatewayDetails;

						Hospital.update({
							"code": hospital.code
						}, {
							 $set: {
							    'address': address,
								'paymentGatewayDetails': paymentGatewayDetails,
							    'mapGeographicPoints': mapGeographicPoints
							 },

							$setOnInsert: hospital

						}, {
							upsert: true
						},

							function (errHospital, updateResult) {

								if (errHospital) {
									console.error(errHospital.message);
								}

							});

					}

					console.log('Hospital collection synced');

				}

				function error(error) {
					console.error('Error: ' + error.ERROR_MSG);
				}

			});

		});

	}
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