var httpService = require('../services/HTTPService.js');

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');


module.exports = function (app, route) {

    app.get(route, function (req, res, next) {

        var hospitalCode = req.query.hospitalCode;

        var body = {
            "entityCode": hospitalCode
        };

        httpService.doGet(hospitalCode, '/specialities', body, success, error);

        function success(response) {
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