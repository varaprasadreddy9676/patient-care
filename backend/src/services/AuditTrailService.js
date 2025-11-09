var mongoose = require('mongoose');

var auditTrail = require('../models/AuditTrail');
var AuditTrail = mongoose.model('audit_trails', auditTrail);

module.exports.events = {
    OTP_SENT: "OTP_SENT",
    OTP_RESENT: "OTP_RESENT",
    OTP_INVALID: "OTP_INVALID",
    USER_ADDED: "USER_ADDED",
    USER_UPDATED: "USER_UPDATED",
    LOGGED_IN: "LOGGED_IN",
    VISIT_RECORD_OPENED: "VISIT_RECORD_OPENED",
    REMINDER_OPENED: "REMINDER_OPENED",
    PRESCRIPTION_READY: "PRESCRIPTION_READY",
    PRESCRIPTION_OPENED: "PRESCRIPTION_OPENED",
    PRESCRIPTION_PRINTED: "PRESCRIPTION_PRINTED",
    FAMILY_MEMBER_MAPPED_TO_HOSPITAL: "FAMILY_MEMBER_MAPPED_TO_HOSPITAL",
    SEARCHING_PATIENT_IN_MEDICS_FOR_FAMILY_MEMBER: "SEARCHING_PATIENT_IN_MEDICS_FOR_FAMILY_MEMBER",
    FAMILY_MEMBER_ADDED: "FAMILY_MEMBER_ADDED",
    FAMILY_MEMBER_MODIFIED: "FAMILY_MEMBER_MODIFIED",
    FAMILY_MEMBER_DELETED: "FAMILY_MEMBER_DELETED",
    GET_AVAILABLE_SLOTS: "GET_AVAILABLE_SLOTS",
    SLOT_RESERVED: "SLOT_RESERVED",
    SLOT_RELEASED: "SLOT_RELEASED",
    APPOINTMENT_CONFIRMED: "APPOINTMENT_CONFIRMED",
    APPOINTMENT_CONFIRMATION_FAILED: "APPOINTMENT_CONFIRMATION_FAILED",
    APPOINTMENT_PAYMENT_FAILED: "APPOINTMENT_PAYMENT_FAILED",
    APPOINTMENT_RESCHEDULED: "APPOINTMENT_RESCHEDULED",
    APPOINTMENT_CANCELLED: "APPOINTMENT_CANCELLED",
    APPOINTMENT_SEEN_BY_USER: "APPOINTMENT_SEEN_BY_USER",
    APPOINTMENT_STARTED_BY_DOCTOR: "APPOINTMENT_STARTED_BY_DOCTOR",
    APPOINTMENT_CLOSED_BY_DOCTOR: "APPOINTMENT_CLOSED_BY_DOCTOR",
    ATTACHMENT_OPENED: "ATTACHMENT_OPENED",
    EMR_FETCHED : "EMR_FETCHED",
    EMR_FETCHING_FAILED : "EMR_FETCHING_FAILED",
    VISIT_FETCHED: "VISIT_FETCHED",
    FAILED_IN_FETCHING_VISIT: "FAILED_IN_FETCHING_VISIT"

};

module.exports.log = function (req, event, details, referenceObject) {

    try {
        var entry = {
            event: event,
            details: details,
            referenceObject: referenceObject,
            phone: (req.user ? req.user.phone : null),
            userId: (req.user ? req.user._id : null),
            userName: (req.user ? req.user.firstName : ''),
            ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress
        };

        var auditEntry = new AuditTrail(entry);

        auditEntry.save(function (err, e) {
            if (err) return console.error(err);
        });

    } catch (ex) {
        console.error(ex);
    }

};