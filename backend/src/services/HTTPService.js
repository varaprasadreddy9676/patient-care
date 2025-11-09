const { method } = require('lodash');
var mongoose = require('mongoose');
const request = require('request');
var hospitalSchema = require('../models/Hospital');
var hospitalResourceDetailsSchema = require('../models/HospitalResourceDetails');
const requestPromise = require("request-promise");

var methods = {};

var HospitalResourceDetails = mongoose.model('hospital_resource_detail', hospitalResourceDetailsSchema);
var Hospital = mongoose.model('hospital', hospitalSchema);

function _getAppServerURL(hospitalCode, cbWithOptions, cbError) {

	Hospital.findOne({
		"code": hospitalCode
	},
		function (err, hospital) {
			if (err) {
				cbError(err);
				console.log("Invalid hospital Id, cannot service the request");

			} else {

				if (!hospital) {
					console.log("Invalid hospital code");
					cbError(err);
					return;
				}

				console.log("Hospital code", hospital.code);

				var resourceId = hospital.resourceId;

				HospitalResourceDetails.findById(resourceId,
					function (hrdErr, hospitalsResourceDetails) {
						if (hrdErr) {
							cbError(hrdErr);
							console.log("Resource not found, cannot get the patient details");

						} else {

							var agentOptions = hospitalsResourceDetails.agentOptions;
							if (hospital.authDetails) {
								agentOptions.authDetails = hospital.authDetails;
								agentOptions.authDetails.hospitalCode = hospital.code;
							}

							cbWithOptions(agentOptions);

						}
					});

			}
		});

}

methods.doPost = function (hospitalCode, queryParams, body, cbSuccess, cbError) {

	_getAppServerURL(hospitalCode, function (agentOptions) {
		_processHTTP(agentOptions, 'POST', queryParams, body, cbSuccess, cbError);
	}, cbError);

};

methods.doGet = function (hospitalCode, queryParams, body, cbSuccess, cbError) {

	_getAppServerURL(hospitalCode, function (agentOptions) {
		_processHTTP(agentOptions, 'GET', queryParams, body, cbSuccess, cbError);
	}, cbError);

};

methods.doPut = function (hospitalCode, queryParams, body, cbSuccess, cbError) {

	_getAppServerURL(hospitalCode, function (agentOptions) {
		_processHTTP(agentOptions, 'PUT', queryParams, body, cbSuccess, cbError);
	}, cbError);

};

methods.doDelete = function (hospitalCode, queryParams, body, cbSuccess, cbError) {

	_getAppServerURL(hospitalCode, function (agentOptions) {
		_processHTTP(agentOptions, 'DELETE', queryParams, body, cbSuccess, cbError);
	}, cbError);

};

methods.request = function (agentOptions, method, queryParams, payload, cbSuccess, cbError) {
	_processHTTP(agentOptions, method, queryParams, payload, cbSuccess, cbError);
};

function _processHTTP(agentOptions, method, queryParams, payload, cbSuccess, cbError) {

	let url = agentOptions.host;

	if (agentOptions.port) {
		url += ':' + agentOptions.port;
	}

	url += agentOptions.path + queryParams;

	console.log('>>> Sending Request... ' + url);
	if (payload) {
		console.log('>>> Payload... ' + JSON.stringify(payload));
	}

	var header = {
		"Authorization": agentOptions.authDetails.token
	};

	request(url, {
		method: method,
		headers: header,
		body: payload,
		json: true
	}, function (err, resp, body) {
		if (err) {
			console.log('***** ERROR: ' + JSON.stringify(err));
			cbError(JSON.stringify(err));
		} else {
			//console.log('<<< Response: ' + JSON.stringify(resp));
			//console.log('    Body: ' + JSON.stringify(body));

			if (body.ERROR_MSG && body.ERROR_MSG.includes("Access denied") ||  (body && body.ERROR_MSG && body.ERROR_MSG.includes("Token expired"))) {

				var payload = {
					"entitycode": agentOptions.authDetails.hospitalCode,
					"userId": agentOptions.authDetails.userId,
					"password": agentOptions.authDetails.password
				};

				_processHTTP(agentOptions, 'post', '/token', payload, cbTokenSuccess, cbTokenError);

				function cbTokenSuccess(tokenBody) {

					if (tokenBody.ERROR_MSG) {
						var errMsg = '<<< Failed to get token' + JSON.stringify(tokenBody);
						console.error(errMsg);
						cbError(errMsg);
						return;
					}

					console.log('<<< Response: New token generated' + JSON.stringify(tokenBody));

					Hospital.findOne({
						"code": agentOptions.authDetails.hospitalCode
					},
						function (errHospital, foundHospital) {

							if (foundHospital) {
								var token = 'Berear ' + tokenBody.token;
								foundHospital.authDetails.token = token;
								foundHospital.authDetails.tokenRegeneratedDate = new Date();
								// foundHospital.save();
								new Hospital(foundHospital).save();

								agentOptions.authDetails.token = token;
								_processHTTP(agentOptions, method, queryParams, payload, cbSuccess, cbError);
							}

						});

				}

				function cbTokenError(error) {
					console.error(error);
				}


			} else {

				cbSuccess(body);

			}
		}
	});

}

methods.generateToken = async function (hospitalCode) {

	// assign with default values @@ Need to get this from getHospitalResourceDetails()

	let payload = {
		"entitycode": hospitalCode,
		"userId": "mcuser",
		"password": "Admin@ubq13"
	}
	let url = 'https://medicsprime.in/medics/api/token';

	let hospitalDetails = await getHospitalAuthDetails(hospitalCode);
	let agentOptions = await getHospitalResourceDetails(hospitalDetails.resourceId);

	if (agentOptions) {
		url = agentOptions.host;

		if (agentOptions.port) {
			url += ':' + agentOptions.port;
		}

		url += agentOptions.path + '/token';

		console.log('>>> Sending Request... ' + url);

	}

	if (hospitalDetails.authDetails) {
		payload.userId = hospitalDetails.authDetails.userId;
		payload.password = hospitalDetails.authDetails.password;
	}
	else {
		console.error(`Hospital ${hospitalCode} does not have auth details`);
		return { message: `Hospital ${hospitalCode} does not have auth details` };
	}

	let header = {
		'Content-Type': 'application/json'
	};

	let token = '';
	let options = {
		method: 'POST',
		headers: header,
		url: url,
		body: JSON.stringify(payload)
	}


	try {
		
		let result =  await requestPromise(options);
		return result;
	  } catch (error) {
		console.error(error)
		return error;
	  }



};

async function getHospitalAuthDetails(hospitalCode) {

	let result = await Hospital.findOne({
		"code": hospitalCode
	});

	if (result) {
		return result;
	}
	else {

		console.error(`No hospital found with this hospital code ${hospitalCode}`);
		return `No hospital found with this hospital code ${hospitalCode}`;
	}

}

async function getHospitalResourceDetails(resourceID) {

	let result = await HospitalResourceDetails.findById(resourceID);

	if (result) {
		return result.agentOptions;
	}
	else {
		console.error(`No resource details found for this resource  ${resourceID}`);
		return `No resource details found for this resource  ${resourceID}`;
	}


}


module.exports = methods;