var mongoose = require('mongoose');
const { FAMILY_MEMBER_RELATIONS } = require('../config/constants');

var FamilyMemberSchema = new mongoose.Schema({

    userId: { // Family member who is using the app
        type: mongoose.Schema.ObjectId,
        required: true
    },

    fullName: {
        type: String,
        required: true
    },

    relation: {
        type: String,
        required: true,
        enum: Object.values(FAMILY_MEMBER_RELATIONS),
        default: FAMILY_MEMBER_RELATIONS.OTHER
    },
    gender: String,

    dob: String,

    profilePicture: String, // Base64 encoded image data

    phone: {
        type: String,
        required: true
    },

    isAppUser: {
        type: Boolean,
        default: false
    },

    active: {
        type: Boolean,
        default: true
    },

    createdDate: {
        type: Date,
        default: Date.now
    },
    location: mongoose.Schema.Types.Mixed,

});

// Export the schema
module.exports = FamilyMemberSchema;