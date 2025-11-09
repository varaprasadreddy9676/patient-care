var mongoose = require('mongoose');
var httpService = require('../services/HTTPService.js');
var auditTrailService = require('../services/AuditTrailService.js');

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');
const SelectedFamilyMemberHelper = require('../utils/SelectedFamilyMemberHelper');


module.exports = function(app, route) {

    var FamilyMember = mongoose.model('family_member', app.models.familyMember);
    var FamilyMemberHospitalAccount = mongoose.model('family_member_hospital_account', app.models.familyMemberHospitalAccount);
    app.get(route + '/new', function(req, res, next) {

        const hospitalCode = req.query.hospitalCode;
        const patientId = req.query.patientId;
        const visitDate = req.query.visitDate;

        const body = {
            'patientId': patientId,
            'visitDate': visitDate // YYYY-MM-DD
        };

        const url = '/emr-visits/';

        httpService.doGet(hospitalCode, url, body, success, error);

        function success(response) {

            if (response.data) {

                const patientVisits = {
                    'patientId': patientId,
                    'visitDetails': response.data
                };

                auditTrailService.log(req, auditTrailService.events.VISIT_FETCHED,
                    "Visit Records fetched at DOCUMENT tab in EMR  of " + patientId, patientVisits);

                return ResponseHandler.success(res, patientVisits);
            } else {
                error(response);

                auditTrailService.log(req, auditTrailService.events.FAILED_IN_FETCHING_VISIT,
                    "Failed to get the Visit Records for user of patient with ID " + patientId);
            }

        }

        function error(error) {
            console.error('Error: ' + JSON.stringify(error));

            auditTrailService.log(req, auditTrailService.events.FAILED_IN_FETCHING_VISIT,
                "Failed to get the Visit Records for user of patient with ID " + patientId);

            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, error.message || error));
        }

    });

    app.get(route, async function(req, res, next) {
        const { userId, selectedFamilyMemberId } = req.query;

        if (!userId) {
            return ResponseHandler.error(res, new AppError(ErrorCodes.VALIDATION_ERROR, 'userId is required'));
        }

        try {
            // SMART CHANGE: Filter at query level
            const query = { userId };
            if (selectedFamilyMemberId) {
                query.familyMemberId = selectedFamilyMemberId;
            }

            const familyMemberHospitalAccounts = await FamilyMemberHospitalAccount.find(query).exec();

            if (!familyMemberHospitalAccounts || familyMemberHospitalAccounts.length === 0) {
                return ResponseHandler.success(res, []);
            }

            const visits = [];

            // Process each account
            for (const fmha of familyMemberHospitalAccounts) {
                const { hospitalCode, patientId, familyMemberId } = fmha;

                // Get family member details
                const familyMember = await FamilyMember.findById(familyMemberId).exec();
                if (!familyMember) continue;

                const body = { patientId };
                const url = '/emr';

                try {
                    // Convert callback-based httpService to Promise
                    const response = await new Promise((resolve, reject) => {
                        httpService.doGet(hospitalCode, url, body, resolve, reject);
                    });

                    if (response && response.data && response.data.visit) {
                        response.data.visit.forEach((visit) => {
                            const pastDatedVisit = isPastDate(visit.visitDate, visit.visitTime);

                            visits.push({
                                familyMemberId: familyMemberId,
                                familyMemberName: familyMember.fullName,
                                familyMemberGender: familyMember.gender,
                                familyMemberDOB: familyMember.dob,
                                patientId: patientId,
                                hospitalCode: hospitalCode,
                                visitId: visit.visitId,
                                visitNumber: visit.visitNumber,
                                visitDate: visit.visitDate,
                                visitTime: visit.visitTime,
                                visitType: visit.visitType,
                                doctorName: visit.doctorName,
                                specialityName: visit.specialityName,
                                consultationCharge: visit.consultationCharge,
                                pastDatedVisit: pastDatedVisit
                            });
                        });
                    }

                    auditTrailService.log(req, auditTrailService.events.VISIT_FETCHED,
                        `Visit Records fetched for ${familyMember.fullName}`);

                } catch (error) {
                    console.error(`Error fetching visits for hospital ${hospitalCode}:`, error);
                    auditTrailService.log(req, auditTrailService.events.FAILED_IN_FETCHING_VISIT,
                        `Failed to get Visit Records for patient ${patientId}`);
                }
            }

            // Sort visits by date (most recent first)
            visits.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

            return ResponseHandler.success(res, visits);

        } catch (error) {
            console.error('Error fetching visits:', error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, error.message));
        }
    });

    function isPastDate(visitDate, visitTime) {
        const vDate = new Date(visitDate);
        const vTime = visitTime ? visitTime.split(':') : ['00', '00'];
        vDate.setHours(parseInt(vTime[0]), parseInt(vTime[1]));
        return vDate < new Date();
    }

    // Return middleware
    return function(req, res, next) {
        next();
    };

};