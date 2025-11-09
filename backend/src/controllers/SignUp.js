var restful = require('node-restful');
var mongoose = require('mongoose');
var Messenger = require('../services/CommunicationService.js');
var messenger = new Messenger();
var auditTrailService = require('../services/AuditTrailService.js');
const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');

module.exports = function(app, route) {

    var User = mongoose.model('User', app.models.user);
    var FamilyMember = mongoose.model('family_member', app.models.familyMember);
    var Notification = mongoose.model('notification', app.models.notification);

    var resource = restful.model('users', app.models.user);
    var rest = resource.methods(['get', 'put', 'post']);
    let entityCode = "null";

    // New sign ups
    rest.before('post', function(req, res, next) {
        var user = new User();

        user.setOTP();

        req.body.otp = user.otp;

        next();
    });

    // New sign ups
    rest.after('post', function(req, res, next) {

        if (res.locals.bundle.message) {
            console.log("Failed to save data");
            console.error(res.locals.bundle.errmsg);
            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, res.locals.bundle.errmsg || "Failed to save user"));

        } else {

            console.log("Data saved");
            var user = res.locals.bundle;

            ResponseHandler.success(res, {
                profileId: user._id
            });

            req.user = user;
            auditTrailService.log(req, auditTrailService.events.USER_ADDED, 'User details added', user);

            var otpTemplate = "#OTP# is your OTP for signing in to medics care -medics";;
            if (otpTemplate) {

                otpTemplate = otpTemplate.replace('#OTP#', user.otp);

                if (user.email) {
                    var mail = {
                        to: user.email,
                        subject: 'OTP for medics care',
                        body: otpTemplate
                    }

                    messenger.sendMail(mail);
                }

                var appHashCode = req.query.appHashCode ? req.query.appHashCode : 'TBqVj3kOyEc';
                //  otpTemplate = otpTemplate + "\n" + appHashCode;

                messenger.sendSMS(user.phone, otpTemplate, entityCode);
                messenger.sendWhatsappMessage(user.phone, user.otp);

                auditTrailService.log(req, auditTrailService.events.OTP_SENT,
                    'OTP sent to ' + user.phone + ' for signing up');
            }

        }

    });


    // Get OTP
    app.get(route + '/resendOTP/:profileId', function(req, res, next) {

        var _id = req.params.profileId;

        // Validate required parameter
        if (!_id) {
            return ResponseHandler.error(res, new AppError(ErrorCodes.VALIDATION_ERROR, "profileId is required"));
        }

        User.findById(_id)
            .exec(function(err, user) {
                if (err) {
                    console.error(err);
                    return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message));
                }

                if (user) {

                    user.setOTP();
                    user.save();

                    ResponseHandler.success(res, {
                        profileId: user._id
                    });

                    otpTemplate = user.otp + " is your OTP for signing in to medics care . -medics"

                    if (user.email) {
                        var mail = {
                            to: user.email,
                            subject: 'OTP for medics care',
                            body: otpTemplate
                        }

                        messenger.sendMail(mail);
                    }

                    var appHashCode = req.query.appHashCode ? req.query.appHashCode : 'TBqVj3kOyEc';
                  //  otpTemplate = otpTemplate + "\n" + appHashCode;
                    messenger.sendSMS(user.phone, otpTemplate, entityCode);
                    messenger.sendWhatsappMessage(user.phone, user.otp);

                    req.user = user;
                    auditTrailService.log(req, auditTrailService.events.OTP_SENT,
                        'OTP re-sent to ' + user.phone + ' for signing up');

                } else {
                    var message = 'Invalid user';

                    console.error(message);
                    return ResponseHandler.error(res, new AppError(ErrorCodes.USER_NOT_FOUND, message));
                }

            });

    });

    // Verify OTP and activate profile
    // app.put(route, verifyOTP); 
    app.put(route + '/verifyOTP', verifyOTP);

    function verifyOTP(req, res, next) {

        var _id = req.body.profileId;
        var reqOTP = req.body.otp;
        var playerId = req.body.playerId;

        // Validate required fields
        if (!_id) {
            return ResponseHandler.error(res, new AppError(ErrorCodes.VALIDATION_ERROR, "profileId is required"));
        }

        if (!reqOTP) {
            return ResponseHandler.error(res, new AppError(ErrorCodes.VALIDATION_ERROR, "OTP is required"));
        }

        User.findById(_id)
            .exec(function(err, user) {
                if (err) {
                    console.error(err);
                    return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message));
                }

                if (!user) {
                    return ResponseHandler.error(res, new AppError(ErrorCodes.USER_NOT_FOUND, "User not found with the provided profileId"));
                }

                req.user = user; // for audit trail

                if (reqOTP === user.otp) {

                    var authDetails = user.setRandomPassword();
                    user.token = user.generateJwt();
                    user.otp = null;
                    user.hash = authDetails.hash;
                    user.salt = authDetails.salt;
                    if (playerId) {
                        user.playerId = playerId;
                    }

                    // Wait for user save to complete before proceeding
                    user.save(function(saveErr, savedUser) {
                        if (saveErr) {
                            console.error("Error saving user:", saveErr);
                            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, "Error saving user: " + saveErr.message));
                        }

                        var localStoreUser = {
                            "id": savedUser._id,
                            "firstName": savedUser.firstName,
                            "lastName": savedUser.lastName,
                            "gender": savedUser.gender,
                            "dob": savedUser.dob,
                            "city": savedUser.city,
                            "cityName": savedUser.cityName,
                            "location": savedUser.location ? savedUser.location : null,
                            "email": savedUser.email,
                            "phone": savedUser.phone,
                            "token": savedUser.token,
                            "profilePicture": savedUser.profilePicture
                        };

                        var familyMemberDetails = {
                            "fullName": savedUser.firstName + (savedUser.lastName ? " " + savedUser.lastName : ""),
                            "location": savedUser.location ? savedUser.location : null,
                            "relation": "Self",
                            "gender": savedUser.gender,
                            "dob": savedUser.dob,
                            "phone": savedUser.phone,
                            "userId": savedUser._id,
                            "isAppUser": true,
                            "active": true,
                            "profilePicture": savedUser.profilePicture
                        };

                        FamilyMember.updateOne({
                                "userId": savedUser._id
                            }, {
                                $set: familyMemberDetails
                            }, {
                                upsert: true
                            },
                            function(familyMemberErr) {

                                if (familyMemberErr) {
                                    console.error("Error saving family member:", familyMemberErr);
                                    return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, "Error saving family member: " + familyMemberErr.message));
                                } else {

                                    _handleUserUpdation(savedUser);

                                    auditTrailService.log(req, auditTrailService.events.LOGGED_IN, 'Logged in', savedUser);

                                    return ResponseHandler.success(res, localStoreUser);

                                }

                            });
                    });

                } else {

                    auditTrailService.log(req, auditTrailService.events.OTP_INVALID, 'OTP invalid', user);
                    return ResponseHandler.error(res, new AppError(ErrorCodes.INVALID_OTP, "Invalid OTP. Verification failed"));

                }

            });
    }


    function _handleUserUpdation(user) {

        if (!user || !user._id) {
            console.error("_handleUserUpdation called with invalid user");
            return;
        }

        Notification.update({
            "userId": user._id,
            "status": "PENDING"
        }, {
            "$set": {
                "playerId": user.playerId
            }
        }, {
            "multi": true
        }, (err, writeResult) => {
            if (err) {
                console.error("Error updating notifications:", err);
            } else {
                console.log(writeResult);
            }
        });

    }


    // User updation
    rest.after('put', function(req, res, next) {

        var id = req.params.id;
        var user = req.body;
        console.log(user);
        req.user = user;

        FamilyMember.findOne({
            "userId": id
        }, function(errFamily, familyMember) {
            if (errFamily) {
                console.error("Error finding family member:", errFamily);
                return next();
            }

            if (!familyMember) {
                console.warn("Family member not found for userId:", id);
                return next();
            }

            familyMember.fullName = user.firstName + (user.lastName ? " " + user.lastName : "");
            familyMember.gender = user.gender;
            familyMember.dob = user.dob;
            familyMember.phone = user.phone;
            familyMember.location = user.location ? user.location : null;
            familyMember.profilePicture = user.profilePicture;

            familyMember.save(function(saveErr) {
                if (saveErr) {
                    console.error("Error saving family member:", saveErr);
                }

                auditTrailService.log(req, auditTrailService.events.USER_UPDATED,
                    'User and family details updated', user);
            });

        });

        next();

    });


    // Register this endpoint
    rest.register(app, route);

    // Return middleware
    return function(req, res, next) {
        next();
    };

};