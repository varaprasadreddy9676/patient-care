const mongoose = require('mongoose');
const HTTPServiceV2 = require('../services/HTTPServiceV2');
const httpService = new HTTPServiceV2();
const auditTrailService = require('../services/AuditTrailService');

module.exports = function (app, route) {
  const FamilyMemberHospitalAccount = mongoose.model(
    'family_member_hospital_account',
    app.models.familyMemberHospitalAccount
  );

  /**
   * Helper function to log audit trails.
   */
  function logAuditTrail(req, event, message, data = {}) {
    auditTrailService.log(req, event, message, data);
  }

  /**
   * Route: Get Patient Assessment
   * Query parameters:
   * - familyMemberId: The family member ID
   * - patientId: The patient ID
   * - assessmentMonths: Number of months for assessment (default: 1)
   * - userRequest: The assessment request text
   */
  app.get(route, async (req, res) => {
    const { familyMemberId, patientId, assessmentMonths = 1, userRequest } = req.query;

    // Validate required parameters
    if (!familyMemberId) {
      return res.status(400).json({
        message: 'familyMemberId is required'
      });
    }

    if (!patientId) {
      return res.status(400).json({
        message: 'patientId is required'
      });
    }

    if (!userRequest) {
      return res.status(400).json({
        message: 'userRequest is required'
      });
    }

    try {
      // Find the hospital account for this patient
      const account = await FamilyMemberHospitalAccount.findOne({
        patientId,
        familyMemberId
      });

      if (!account) {
        return res.status(404).json({
          message: 'No family member hospital account found'
        });
      }

      // Build the query parameters
      const queryParams = `/patient-assessment?command=answerPatientQuery&patientId=${patientId}&assessmentMonths=${assessmentMonths}&userRequest=${encodeURIComponent(userRequest)}`;

      // Make request to remote API using HTTPServiceV2
      const response = await httpService.doRequest(
        account.hospitalCode,
        'GET',
        queryParams
      );

      // Log audit trail
      logAuditTrail(
        req,
        auditTrailService.events.PATIENT_ASSESSMENT_FETCHED || 'PATIENT_ASSESSMENT_FETCHED',
        `Patient assessment fetched for patient ${patientId}`,
        { familyMemberId, patientId, assessmentMonths, userRequest }
      );

      // Return the response data
      res.status(200).json(response);

    } catch (error) {
      console.error(`Error fetching patient assessment: ${error.message}`);

      // Log audit trail for failure
      logAuditTrail(
        req,
        auditTrailService.events.PATIENT_ASSESSMENT_FETCH_FAILED || 'PATIENT_ASSESSMENT_FETCH_FAILED',
        `Failed to fetch patient assessment for patient ${patientId}`,
        { error: error.message }
      );

      // Return error response
      res.status(500).json({
        message: 'Failed to fetch patient assessment',
        error: error.message
      });
    }
  });

  // Return middleware
  return (req, res, next) => next();
};
