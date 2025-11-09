const mongoose = require('mongoose');
const httpService = require('../services/HTTPService.js');
const hospitalSchema = require('../models/Hospital.js');
const Hospital = mongoose.model('hospital', hospitalSchema);
const {performance} = require('perf_hooks');
const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');

module.exports = function (app, route) {

    app.get(route + "/re-generate/all", async function (req, res, next) {

        console.log(`Re-Generating tokens for all active hospitals`);

        let startTime = performance.now();

        const hospitals = await Hospital.find({active: true});

        let response = [];

        for await(const hospital of hospitals) {

            let token = await httpService.generateToken(hospital.code);
            let saveTokenResult = await saveToken(JSON.parse(token), hospital.code);
            console.log(`Token for ${hospital} saved successfully`);
            response.push({hospitalCode: hospital.code, token: JSON.parse(token), result: saveTokenResult});

        }
        let endTime = performance.now();
        console.log(`Time took to re-generate tokens for ${hospitals.length} hospitals is:  ${endTime - startTime} milliseconds`);
        return ResponseHandler.success(res, response, `Re-Generated tokens for all available ${hospitals.length} hospitals`);
    });

    app.get(route + "/generate", async function (req, res, next) {

        const hospitalCode = req.query.hospitalCode;
        const doSaveToken = req.query.doSaveToken;
        let token;
        try {
            token = await httpService.generateToken(hospitalCode);
            console.log(token);

            if (doSaveToken) {
                let result = await saveToken(JSON.parse(token), hospitalCode);
                console.log(result);
                if (result) {
                    console.log(`New token saved for ${hospitalCode}, token: ${token}`);
                }
            }

            return ResponseHandler.success(res, JSON.parse(token));
        } catch (error) {
            console.error(error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.EXTERNAL_SERVICE_ERROR, error.message || "Failed to generate token"));
        }

    });

    async function saveToken(token, hospitalCode) {
        const hospital = await mongoose.model('hospital').findOne({
                code: hospitalCode
        });
        hospital.authDetails.token = `Bearer ${token.token}`;
        hospital.authDetails.tokenRegeneratedDate = new Date();
        return new Hospital(hospital).save();

    }
    // Return middleware
    return function (req, res, next) {
        next();
    };

};