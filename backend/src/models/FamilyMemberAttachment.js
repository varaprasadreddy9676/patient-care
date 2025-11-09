var mongoose = require('mongoose');

var FamilyMemberAttachmentSchema = new mongoose.Schema({

    familyMemberId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    fileName: {
        type: String,
        required: true
    },

    contentType: {
        type: String,
        required: true
    },

    thumbnailBase64DataURI: {
        type: String,
        required: true
    },

    base64DataURI: {
        type: String,
        required: true
    },

    datetime: {
        type: Date,
        required: true
    }

});

FamilyMemberAttachmentSchema.index({
    familyMemberId: 1,
    fileName: 1
}, {
    unique: true,
});

// Export the schema
module.exports = FamilyMemberAttachmentSchema;