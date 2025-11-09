var mongoose = require('mongoose');
var httpService = require('../services/HTTPService.js');

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');


module.exports = function (app, route) {

    app.get(route + "/radiology", function (req, res, next) {

        var hospitalCode = req.query.hospitalCode;
        var patientId = req.query.patientId;
        var visitId = req.query.visitId;

        var body = {
            'patientId': patientId,
            'visitId': visitId
        };

        var url = '/radiology-reports';

        httpService.doGet(hospitalCode, url, body, success, error);

        function success(response) {

            if (response.data) {

                console.log(JSON.stringify(response.data));
                return ResponseHandler.success(res, response.data);

            } else {
                error(response);
            }

        }

        function error(error) {
            console.error('Error: ' + error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, error.message || error));
        }

    });


    app.get(route, function (req, res, next) {

        let hospitalCode = req.query.hospitalCode;
        let patientId = req.query.patientId;
        let visitId = req.query.visitId;

        let url = '/lab-reports';

        let body = {
            'patientId': patientId,
            'visitId': visitId
        };

        httpService.doGet(hospitalCode, url, body, success, error);

        function success(response) {

            if (response.data) {

                console.log(JSON.stringify(response.data));
                return ResponseHandler.success(res, response.data);

            } else {
                error(response);
            }

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