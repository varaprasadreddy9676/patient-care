var mongoose = require('mongoose');

var FamilyMemberHospitalAccountSchema = new mongoose.Schema({

    mrn: {
        type: String,
        required: true
    },

    patientId: {
        type: String,
        required: true,
        integer: true
    },

    familyMemberId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    hospitalId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    hospitalCode: {
        type: String,
        required: true
    },

    hospitalName: {
        type: String,
        required: true
    },

    userId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    createdDate: {
        type: Date,
        default: Date.now
    }

});

FamilyMemberHospitalAccountSchema.index({
    userId: 1,
    hospitalCode: 1,
    patientId: 1

}, {
    unique: true,
});

// Export the schema
module.exports = FamilyMemberHospitalAccountSchema;