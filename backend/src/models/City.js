var mongoose = require('mongoose');

// Create the City Schema
var CitySchema = new mongoose.Schema({

    cityId: {
        type: Number,
        required: true
    },

    cityName: {
        type: String,
        required: true
    },

    stateId: {
        type: Number,
        required: true
    },

    stateName: {
        type: String,
        required: true
    }
});

CitySchema.index({
    cityName: 1
});


// Export the schema
module.exports = CitySchema;