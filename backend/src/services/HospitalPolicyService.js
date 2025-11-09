var mongoose = require('mongoose');
var HashMap = require('hashmap');

var hospitalPolicy = require('../models/HospitalPolicy');
var HospitalPolicy = mongoose.model('hospital_policy', hospitalPolicy);

var methods = {};
var policies = new HashMap();


methods.init = function () {

    HospitalPolicy.find({},
        function (errHospitalPolicy, hospitalPolicies) {

            hospitalPolicies.forEach(function (hospitalPolicy, index) {

            let policyCode = hospitalPolicy.policyCode;
            let hospitalCode = hospitalPolicy.hospitalCode;
            let value = hospitalPolicy.value;
            let key = hospitalCode + "_" + policyCode;

            policies.set(key, value);

            });


        });

}

methods.get = function (hospitalCode, policyCode) {

    let key = hospitalCode + "_" + policyCode;
    let defaultKey = "DEFAULT_" + policyCode;

    let value = policies.get(key);

    if (!value) {
        value = policies.get(defaultKey);
    }

    return value;

}


module.exports = methods;