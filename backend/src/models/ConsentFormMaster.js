var mongoose = require('mongoose');

// Create the ConsentFormMaster Schema
var ConsentFormMasterSchema = new mongoose.Schema({

    code: {
        type: String,
        unique: true,
        required: true,
    },

    hospitalCode: {
        type: String,
    },

    type: {
        type: String,
        default: "VIDEO_CONSULTATION"
    },
    
    language: {
        type: String,
        required: true,
    },

    template: {
        type: mongoose.Schema.Types.Mixed,
    }

});

// Export the schema
module.exports = ConsentFormMasterSchema;