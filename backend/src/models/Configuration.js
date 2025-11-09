var mongoose = require('mongoose');

// Create the AuditTrail Schema
var ConfigurationSchema = new mongoose.Schema({

    code: {
        type: String,
        required: true
    },

    value: {
        type: mongoose.Schema.Types.Mixed
    },

    appId: String,

    description: String

});

// Export the schema
module.exports = ConfigurationSchema;