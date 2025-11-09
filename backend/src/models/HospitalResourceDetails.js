var mongoose = require('mongoose');

var HospitalResourceDetailsSchema = new mongoose.Schema({

    agentOptions: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },

    authDetails: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }

});

// Export the schema
module.exports = HospitalResourceDetailsSchema;