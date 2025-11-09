var mongoose = require("mongoose");
var restful = require('node-restful');

var httpService = require("../services/HTTPService.js");

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');


module.exports = function(app, route) {
    var resource = restful.model('location', app.models.location);
    var rest = resource.methods(['get', 'put']);

    app.get(route + '/sync', function(req, res, next) {
        var Location = mongoose.model("location", app.models.location);
        let url = "/locations";
        //  let hospitalCode = req.query.hospitalCode;
        let body = {
            entitycode: "FMP",
        };
        httpService.doGet("FMP", url, body, success, error);

        function success(response) {
            if (response.data) {
                var locations = response.data.hospitals;

                for (var i = 0; i < locations.length; i++) {
                    var location = locations[i];
                    location.entityId = location.id;

                    if (location.name) {
                        location.name = location.name.toUpperCase();
                    }

                    Location.update({
                            code: location.code,
                        }, {


                            $setOnInsert: location,
                        }, {
                            upsert: true,
                        },

                        function(errHospital, updateResult) {
                            if (errHospital) {
                                console.error(errHospital.message);
                            }
                        }
                    );
                }

                return ResponseHandler.success(res, { locations: response.data });
            } else {
                error(response);
            }
        }

        function error(error) {
            console.error("Error: " + error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, error.message || error));
        }
    });
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
    return function(req, res, next) {
        next();
    };
};