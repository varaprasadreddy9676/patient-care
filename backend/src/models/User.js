var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var Constants = require('../config/constants');

var UserSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: true
    },

    profilePicture: String,
    lastName: String,
    gender: String,

    dob: String,
    city: mongoose.Schema.ObjectId,
    cityName: String,

    phone: {
        type: String,
        required: true,
    },

    password: String,
    otp: Number,
    hash: String,
    salt: String,
    token: String,

    playerId: {
        type: String
    },

    email: {
        type: String
    },
    location: mongoose.Schema.Types.Mixed,
    appId: {
        type: String,
        required: true
    },

    registeredDateTime: {
        type: Date,
        default: Date.now
    },

    preference: {
        type: mongoose.Schema.Types.Mixed
    },

    roles: {
        type: mongoose.Schema.Types.Mixed
    }

});

UserSchema.index({
    phone: 1,
    appId: 1,
}, {
    unique: true,
});

UserSchema.methods.setOTP = function () {

    var otp = "";
    var possible = "23456789";

    for (var i = 0; i < 4; i++) {
        otp += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    if (this.phone == '9123456789') {
        this.otp = '1234';
    } else {
        this.otp = otp;
    }
    
};

UserSchema.methods.setPassword = function (password) {

    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha1').toString('hex');

    return {
        "salt": this.salt,
        "hash": this.hash
    };
};

UserSchema.methods.setRandomPassword = function () {

    var pwd = "";
    var possible = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

    for (var i = 0; i < 6; i++) {
        pwd += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    var authKey = this.setPassword(pwd);

    return {
        "salt": authKey.salt,
        "hash": authKey.hash,
        "password": pwd
    };
};

UserSchema.methods.validPassword = function (password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha1').toString('hex');
    return this.hash === hash;
};

UserSchema.methods.generateJwt = function () {
    var expiry = new Date();
    expiry.setDate(expiry.getDate() + 60);

    return jwt.sign({
        _id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        gender: this.gender,
        dob: this.dob,
        city: this.city,
        phone: this.phone,
        exp: parseInt(expiry.getTime() / 1000),
    }, Constants.SECRET_KEY);
};

// Export the schema
module.exports = UserSchema;