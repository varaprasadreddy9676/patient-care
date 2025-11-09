var mongoose = require('mongoose');
var httpService = require('../services/HTTPService.js');

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');


module.exports = function (app, route) {

    app.get(route, function (req, res, next) {

        var hospitalCode = req.query.hospitalCode;
        var patientId = req.query.patientId;
        var visitId = req.query.visitId;

        var body = {
            'patientId': patientId,
            'visitId': visitId
        };

        var url = '/discharge-summaries';

        httpService.doGet(hospitalCode, url, body, success, error);

        function success(response) {

            if (response.data) {

                return ResponseHandler.success(res, response.data.dischargeSummary);

            } else {
                error(response);
            }

        }

        function error(err) {
            console.error('Error: ' + err);
            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message || err));
        }

    });




    // Return middleware
    return function (req, res, next) {
        next();
    };

};