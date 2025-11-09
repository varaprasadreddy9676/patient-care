var restful = require('node-restful');
const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');

module.exports = function (app, route) {

    var resource = restful.model('advertisements', app.models.advertisement);

    var rest = resource.methods(['get', 'post', 'put', 'delete']);

    // Custom endpoint to get all active advertisements with the expected response format
    app.get(route + '/list', function (req, res, next) {

        resource.find({ isActive: true }, function (err, advertisements) {
            if (err) {
                return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, err.message));
            }

            // Transform the data to match the expected response format
            const responseData = advertisements.map(ad => ({
                id: ad._id.toString(),
                base64Image: ad.base64Image,
                targetUrl: ad.targetUrl
            }));

            return ResponseHandler.success(res, {
                data: responseData
            });
        });
    });

    // After GET operations, format the response
    rest.after('get', function (req, res, next) {
        var data = res.locals.bundle;

        // If it's a single advertisement, format it
        if (data && !Array.isArray(data)) {
            const formattedData = {
                id: data._id.toString(),
                base64Image: data.base64Image,
                targetUrl: data.targetUrl
            };
            return ResponseHandler.success(res, formattedData);
        }

        // If it's an array of advertisements, format them
        if (data && Array.isArray(data)) {
            const formattedData = data.map(ad => ({
                id: ad._id.toString(),
                base64Image: ad.base64Image,
                targetUrl: ad.targetUrl
            }));
            return ResponseHandler.success(res, formattedData);
        }

        return ResponseHandler.success(res, data);
    });

    // After POST operations, format the response
    rest.after('post', function (req, res, next) {
        var data = res.locals.bundle;

        if (data) {
            const formattedData = {
                id: data._id.toString(),
                base64Image: data.base64Image,
                targetUrl: data.targetUrl
            };
            return ResponseHandler.success(res, formattedData);
        }

        return ResponseHandler.success(res, data);
    });

    // Register this endpoint
    rest.register(app, route);

    // Return middleware
    return function (req, res, next) {
        next();
    };
};