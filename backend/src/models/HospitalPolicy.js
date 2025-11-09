var mongoose = require('mongoose');

// Create the Hospital Schema
var HospitalPolicySchema = new mongoose.Schema({


    policyCode: {
        type: String,
        required: true,
    },

    hospitalCode: {
        type: String,
    },

    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },

});

HospitalPolicySchema.index({
    hospitalCode: 1,
    policyCode: 1

}, {
    unique: true,
});

// Export the schema
module.exports = HospitalPolicySchema;