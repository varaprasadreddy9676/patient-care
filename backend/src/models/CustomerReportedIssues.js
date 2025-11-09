var mongoose = require('mongoose');

// Create the CustomerReportedIssue Schema
var CustomerReportedIssuesSchema = new mongoose.Schema({

    issueId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    issueCode: {
        type: String,
        required: true,
    },

    issueDescription: {
        type: String,
        required: true
    },

    problemDescription: {
        type: String,
    },

    userId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    userName: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    reportedDate: {
        type: Date,
        default: Date.now,
        required: true
    },

    resolvedDate: {
        type: Date,
    },

    platform: String,

    version: String,
    
    status: {
        type: String,
        enum: ['OPEN', 'CLOSED'],
        required: true,
        default: 'OPEN'
    }

});

// Export the schema
module.exports = CustomerReportedIssuesSchema;