var mongoose = require('mongoose');

var AdvertisementSchema = new mongoose.Schema({
    base64Image: {
        type: String,
        required: true
    },
    targetUrl: {
        type: String,
        required: true
    },
    createdDateTime: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Export the schema
module.exports = AdvertisementSchema;