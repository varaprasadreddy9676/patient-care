const mongoose = require("mongoose");

// Create the FacilityInformationSchema Schema
const FacilityInformationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['HOSPITAL', 'PHARMACYSTORE', 'AMBULANCE', 'OXYGEN', 'SAMPLECOLLECTION'],
      required: true,
    },
    title: {
      type: String,
    },
    name: {
      type: String
    },
    active : {
      type: Boolean,
      default: true
    },
    url : {
      type: String
    },
    description: {
      type: String,
    },
    phone: String,
    extraDetails: {
      type: mongoose.Schema.Types.Mixed,
    },
    location: {
      type: mongoose.Schema.Types.Mixed,
    },
    createdDateTime: {
      type: Date,
      default: Date.now,
    },
  },
  {
    usePushEach: true,
  }
);

// Export the schema
module.exports = FacilityInformationSchema;
