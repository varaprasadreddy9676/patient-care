const mongoose = require("mongoose");
const HTTPServiceV2 = require("../services/HTTPServiceV2"); // Modern HTTP Service
const httpService = new HTTPServiceV2();
const auditTrailService = require("../services/AuditTrailService");

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');


module.exports = function (app, route) {
  const FamilyMemberHospitalAccount = mongoose.model(
    "family_member_hospital_account",
    app.models.familyMemberHospitalAccount
  );

  /**
   * Helper function to log audit trails.
   */
  function logAuditTrail(req, event, message, data = {}) {
    auditTrailService.log(req, event, message, data);
  }

  /**
   * Fetch EMR Data with Attachments and Reports
   */
  async function fetchEMRData(hospitalCode, patientId, visitId) {

    const body = { patientId, visitId };
    const emr = {};

    try {
      const emrResponse = await httpService.doRequest(
        hospitalCode,
        "GET",
        "/emr/",
        body
      );
      if (emrResponse && emrResponse.data) {
        emr.emrVisit = emrResponse.data;

        // Fetch attachments
        const attachments = await fetchAttachments(hospitalCode, visitId);
        emr.attachments = attachments;

        // Fetch lab reports
        const labReports = await fetchReports(
          hospitalCode,
          visitId,
          "/lab-reports"
        );

        emr.labReports = labReports;

        // Fetch radiology reports
        const radiologyReports = await fetchReports(
          hospitalCode,
          visitId,
          "/radiology-reports"
        );
        emr.radiologyReports = radiologyReports;

        // Fetch discharge summaries
        const dischargeSummaryResponse = await httpService.doRequest(
          hospitalCode,
          "GET",
          "/discharge-summaries",
          body
        );
        emr.dischargeSummary =
          dischargeSummaryResponse?.data?.dischargeSummary || [];
      }
    } catch (error) {
      console.error(`Error fetching EMR data: ${error.message}`);
      throw new Error("Failed to fetch EMR data");
    }

    return emr;
  }

  /**
   * Fetch Attachments for a Visit
   */
  async function fetchAttachments(hospitalCode, visitId) {
    const body = {
      entityCode: hospitalCode,
      contextId: visitId,
      contextType: "VISIT",
      addBase64String: true,
    };
    const response = await httpService.doRequest(
      hospitalCode,
      "GET",
      "/attachments",
      body
    );

    if (response && response.data?.attachments) {
      return await Promise.all(
        response.data.attachments.map(async (attachment) => {
          // Process each attachment (e.g., reduce image size, filter PDFs)
          if (
            attachment.base64DataURI &&
            attachment.base64DataURI !== "null" &&
            attachment.contentType !== "application/pdf"
          ) {
            return attachment;
          }
          return attachment;
        })
      );
    }

    return [];
  }

  /**
   * Fetch Reports (Lab/Radiology)
   */
  async function fetchReports(hospitalCode, visitId, endpoint, reportType) {
    const body = { visitId };
    try {
      const response = await httpService.doRequest(
        hospitalCode,
        "GET",
        endpoint,
        body
      );

      if (response && response.data) {
        return await Promise.all(
          response.data.map(async (report) => {
            report.attachments = await Promise.all(
              report.attachments.map(async (attachment) => {
                if (
                  attachment.base64DataURI &&
                  attachment.base64DataURI !== "null" &&
                  attachment.contentType !== "application/pdf"
                ) {
                  return attachment;
                }
                return attachment;
              })
            );
            return report;
          })
        );
      }

      return [];
    } catch (error) {
      console.error(`Error fetching ${reportType}:`, error.message);
      throw new Error(`Failed to fetch ${reportType}`);
    }
  }

  /**
   * Route: Fetch Detailed EMR Data for a Visit
   */
  app.get(`${route}/new`, async (req, res) => {
    const { hospitalCode, patientId, visitId } = req.query;

    if (!hospitalCode || !patientId || !visitId) {
      return res
        .status(400)
        .json({ message: "hospitalCode, patientId, and visitId are required" });
    }

    try {
      const emrData = await fetchEMRData(hospitalCode, patientId, visitId);

      logAuditTrail(
        req,
        auditTrailService.events.EMR_FETCHED,
        `EMR fetched for patient ${patientId}, visit ${visitId}, hospital ${hospitalCode}`,
        emrData
      );

      res.status(200).json(emrData);
    } catch (error) {
      logAuditTrail(
        req,
        auditTrailService.events.EMR_FETCHING_FAILED,
        `Failed to fetch EMR for patient ${patientId}, visit ${visitId}, hospital ${hospitalCode}`
      );
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Route: Fetch Simple EMR Data
   */
  app.get(route, async (req, res) => {
    const { familyMemberId, patientId, visitId } = req.query;

    if (!familyMemberId || !patientId || !visitId) {
      return res
        .status(400)
        .json({
          message: "familyMemberId, patientId, and visitId are required",
        });
    }

    try {
      const account = await FamilyMemberHospitalAccount.findOne({
        patientId,
        familyMemberId,
      });
      if (!account) {
        throw new Error("No family member hospital account found");
      }

      const body = { patientId, visitId };
      const emrResponse = await httpService.doRequest(
        account.hospitalCode,
        "GET",
        "/emr",
        body
      );

      if (emrResponse && emrResponse.data) {
        const emrVisit = {
          patientId,
          familyMemberId,
          emrVisit: emrResponse.data,
        };

        res.status(200).json(emrVisit);
      } else {
        throw new Error("Failed to fetch EMR data");
      }
    } catch (error) {
      console.error(`Error fetching EMR: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Route: Print EMR
   */
  app.get(`${route}/print`, async (req, res) => {
    const { hospitalCode, patientId, visitId } = req.query;

    if (!hospitalCode || !patientId || !visitId) {
      return res
        .status(400)
        .json({ message: "hospitalCode, patientId, and visitId are required" });
    }

    try {
      const body = { patientId, visitId, printOnly: true };
      const emrResponse = await httpService.doRequest(
        hospitalCode,
        "GET",
        "/emr",
        body
      );

      if (emrResponse && emrResponse.data) {
        res.status(200).json(emrResponse.data);
      } else {
        throw new Error("Failed to fetch EMR data for printing");
      }
    } catch (error) {
      console.error(`Error printing EMR: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Route: Get Visits for a Patient
   */
  app.get(`${route}/getVisits`, async (req, res) => {
    const { hospitalCode, patientId } = req.query;

    if (!hospitalCode || !patientId) {
      return res
        .status(400)
        .json({ message: "hospitalCode and patientId are required" });
    }

    try {
      const url = `/emr/${patientId}`;
      const visitsResponse = await httpService.doRequest(
        hospitalCode,
        "GET",
        url
      );

      res.status(200).json(visitsResponse.data || []);
    } catch (error) {
      console.error(`Error fetching visits: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Route: Get EMR Documents by Visit
   */
  app.get(`${route}/getEMRDocumentsByVisit`, async (req, res) => {
    const { hospitalCode, visitId } = req.query;

    if (!hospitalCode || !visitId) {
      return res
        .status(400)
        .json({ message: "hospitalCode and visitId are required" });
    }

    try {
      const url = `/emr/?visitRID=${visitId}&command=getDocumentsByVisit`;
      const response = await httpService.doRequest(hospitalCode, "GET", url);

      res.status(200).json(response.data || []);
    } catch (error) {
      console.error(`Error fetching EMR documents: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Route: Fetch Lab Reports
   */
  app.get(`${route}/lab-reports`, async (req, res) => {
    const { hospitalCode, visitId } = req.query;

    if (!hospitalCode || !visitId) {
      return res
        .status(400)
        .json({ message: "hospitalCode and visitId are required" });
    }

    try {
      const labReports = await fetchReports(
        hospitalCode,
        visitId,
        "/lab-reports",
        "lab reports"
      );
      logAuditTrail(
        req,
        auditTrailService.events.LAB_REPORTS_FETCHED,
        `Lab reports fetched for visit ${visitId}`,
        labReports
      );
      res.status(200).json(labReports);
    } catch (error) {
      console.error("Error fetching lab reports:", error.message);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Route: Fetch Radiology Reports
   */
  app.get(`${route}/radiology-reports`, async (req, res) => {
    const { hospitalCode, visitId } = req.query;

    if (!hospitalCode || !visitId) {
      return res
        .status(400)
        .json({ message: "hospitalCode and visitId are required" });
    }

    try {
      const radiologyReports = await fetchReports(
        hospitalCode,
        visitId,
        "/radiology-reports",
        "radiology reports"
      );
      logAuditTrail(
        req,
        auditTrailService.events.RADIOLOGY_REPORTS_FETCHED,
        `Radiology reports fetched for visit ${visitId}`,
        radiologyReports
      );
      res.status(200).json(radiologyReports);
    } catch (error) {
      console.error("Error fetching radiology reports:", error.message);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Route: Fetch Discharge Summaries
   */
  app.get(`${route}/discharge-summaries`, async (req, res) => {
    const { hospitalCode, visitId } = req.query;

    if (!hospitalCode || !visitId) {
      return res
        .status(400)
        .json({ message: "hospitalCode and visitId are required" });
    }

    try {
      const dischargeSummaries = await fetchReports(
        hospitalCode,
        visitId,
        "/discharge-summaries",
        "discharge summaries"
      );
      logAuditTrail(
        req,
        auditTrailService.events.DISCHARGE_SUMMARIES_FETCHED,
        `Discharge summaries fetched for visit ${visitId}`,
        dischargeSummaries
      );
      res.status(200).json(dischargeSummaries);
    } catch (error) {
      console.error("Error fetching discharge summaries:", error.message);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Route: Fetch EMR Visit Summary
   * Returns discharge summary, lab reports, and art summary for a visit
   */
  app.get(`${route}/visit-summary`, async (req, res) => {
    const { hospitalCode, visitRID } = req.query;

    if (!hospitalCode || !visitRID) {
      return res
        .status(400)
        .json({ message: "hospitalCode and visitRID are required" });
    }

    try {
      const url = `/emr/?command=getVisitSummary&visitRID=${visitRID}`;
      const response = await httpService.doRequest(hospitalCode, "GET", url);

      if (response && response.data) {
        logAuditTrail(
          req,
          auditTrailService.events.EMR_FETCHED,
          `EMR visit summary fetched for visitRID ${visitRID}, hospital ${hospitalCode}`,
          response.data
        );
        res.status(200).json(response.data);
      } else {
        throw new Error("Failed to fetch EMR visit summary");
      }
    } catch (error) {
      console.error(`Error fetching EMR visit summary: ${error.message}`);
      logAuditTrail(
        req,
        auditTrailService.events.EMR_FETCHING_FAILED,
        `Failed to fetch EMR visit summary for visitRID ${visitRID}, hospital ${hospitalCode}`
      );
      res.status(500).json({ message: error.message });
    }
  });

  // Return middleware
  return (req, res, next) => next();
};
