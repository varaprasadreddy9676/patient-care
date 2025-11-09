const POLL_INTERVAL = 25; // in hrs

var httpService = require('../services/HTTPService.js');
var mongoose = require('mongoose');
var city = require('../models/City');
var hospitalResourceDetail = require('../models/HospitalResourceDetails');

var City = mongoose.model('cities', city);
var HospitalResourceDetail = mongoose.model('hospital_resource_details', hospitalResourceDetail);

function syncCities() {

    HospitalResourceDetail.find({}, function (err, hospitalResourceDetails) {

        if (err) throw err;

        hospitalResourceDetails.forEach(function (hospitalResourceDetail, index) {

            var agentOptions = hospitalResourceDetail.agentOptions;

            agentOptions.authDetails = hospitalResourceDetail.authDetails;
            agentOptions.authDetails.hospitalCode = hospitalResourceDetail.authDetails.ubqHospitalCode;

            httpService.request(agentOptions, 'get', '/cities', null, success, error);

            function success(response) {

                if (!response.data) {
                    var errMsg = 'Failed to get city data';
                    console.log(errMsg);
                    throw errMsg;
                }

                // console.log('Success: ' + JSON.stringify(response));

                var cities = response.data.cities;

                for (var i = 0; i < cities.length; i++) {

                    var city = cities[i];

                    City.update({
                            "cityId": city.cityId
                        }, {
                            $set: city
                        }, {
                            upsert: true
                        },

                        function (errCity, updateResult) {

                            if (errCity) {
                                console.error(errCity.message);
                            }

                        });

                }

                console.log('City collection synced');

            }

            function error(error) {
                console.error('Error: ' + error.ERROR_MSG);
            }

        });

    });

}


console.log('Syncing the cities in ' + POLL_INTERVAL + ' hrs');
setInterval(syncCities, (1000 * 60 * 60 * POLL_INTERVAL));
syncCities();