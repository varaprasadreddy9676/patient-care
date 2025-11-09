var mongoose = require('mongoose');

// Create the CustomerIssue Schema
var CustomerIssueSchema = new mongoose.Schema({

    code: {
        type: String,
        unique: true,
        required: true,
    },

    description: {
        type: String,
        required: true
    },

    active: {
        type: Boolean,
        required: true,
        default: true
    },

    sequence: {
        type: Number,
        default: 0
    }

});

// Export the schema
module.exports = CustomerIssueSchema;