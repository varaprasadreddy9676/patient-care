
var httpService = require('../services/HTTPService.js');

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');


module.exports = function (app, route) {

    app.get(route, function (req, res, next) {

        var hospitalCode = req.query.hospitalCode;
        var receiptId = req.query.receiptId;

        _handleReceipt(res, hospitalCode, receiptId);

    });


    app.get(route + '/print', function (req, res, next) {

        var hospitalCode = req.query.hospitalCode;
        var receiptId = req.query.receiptId;

        _handleReceipt(res, hospitalCode, receiptId);

    });

    function _handleReceipt(res, hospitalCode, receiptId) {

        var url = '/receipts/' + receiptId;

        httpService.doGet(hospitalCode, url, null, success, error);

        function success(response) {

            if (response.data) {

                var data = {
                    'receipt': response.data
                };

                return ResponseHandler.success(res, data);

            } else {
                error(response);
            }

        }

        function error(error) {
            console.error('Error: ' + error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, error.message || error));
        }

    }


    // Return middleware
    return function (req, res, next) {
        next();
    };

};