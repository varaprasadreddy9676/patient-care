// src/services/ContextBuilderService.js
const HTTPService = require('./HTTPService');
const TokenBudgetService = require('./TokenBudgetService');
const { getSystemPrompt } = require('../utils/AIPromptTemplates');
const mongoose = require('mongoose');

class ContextBuilderService {
  /**
   * Build context for AI chat based on context type
   * @param {string} contextType - Type of context (VISIT, APPOINTMENT, GENERAL, etc.)
   * @param {string} contextId - ID of the context entity (visitId, appointmentId, etc.)
   * @param {Object} contextData - Additional context data (hospitalCode, patientId, etc.)
   * @returns {Promise<Object>} Context object with systemPrompt, contextText, metadata
   */
  async buildContext(contextType, contextId, contextData = {}) {
    const systemPrompt = getSystemPrompt(contextType);

    switch (contextType) {
      case 'VISIT':
        return await this.buildVisitContext(contextId, contextData, systemPrompt);

      case 'APPOINTMENT':
        return await this.buildAppointmentContext(contextId, systemPrompt);

      case 'PRESCRIPTION':
        return await this.buildPrescriptionContext(contextId, contextData, systemPrompt);

      case 'LAB_REPORT':
        return await this.buildLabReportContext(contextId, contextData, systemPrompt);

      case 'GENERAL':
      default:
        return this.buildGeneralContext(systemPrompt);
    }
  }

  /**
   * Build context for a visit
   * @param {string} visitId - Visit ID
   * @param {Object} data - Context data with hospitalCode, patientId
   * @param {string} systemPrompt - System prompt
   * @returns {Promise<Object>} Visit context
   */
  async buildVisitContext(visitId, data, systemPrompt) {
    try {
      const { hospitalCode, patientId } = data;

      // Fetch visit data from EMR via HTTPService
      const visitData = await this._fetchVisitData(hospitalCode, visitId, patientId);

      // Format visit data into context text
      let contextText = this._formatVisitData(visitData);

      // Apply token budgeting
      const maxContextTokens = 2000; // Reserve 2000 tokens for context
      const tokenCount = TokenBudgetService.countTokens(contextText);

      if (tokenCount > maxContextTokens) {
        contextText = TokenBudgetService.truncateToTokenLimit(
          contextText,
          maxContextTokens,
          'gpt-4'
        );
      }

      return {
        systemPrompt,
        contextText,
        metadata: {
          visitId,
          hospitalCode,
          patientId,
          tokenCount: TokenBudgetService.countTokens(contextText)
        }
      };
    } catch (error) {
      console.error('Error building visit context:', error);
      // Return minimal context if fetch fails
      return {
        systemPrompt,
        contextText: `Visit ID: ${visitId}\n\n[Note: Unable to load complete visit details. Some information may not be available.]`,
        metadata: {
          visitId,
          error: error.message
        }
      };
    }
  }

  /**
   * Build context for an appointment
   * @param {string} appointmentId - Appointment ID
   * @param {string} systemPrompt - System prompt
   * @returns {Promise<Object>} Appointment context
   */
  async buildAppointmentContext(appointmentId, systemPrompt) {
    try {
      const Appointment = mongoose.model('appointment');
      const appointment = await Appointment.findById(appointmentId)
        .populate('hospitalDetails')
        .populate('doctorDetails');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const contextText = this._formatAppointmentData(appointment);

      return {
        systemPrompt,
        contextText,
        metadata: {
          appointmentId,
          tokenCount: TokenBudgetService.countTokens(contextText)
        }
      };
    } catch (error) {
      console.error('Error building appointment context:', error);
      return {
        systemPrompt,
        contextText: `Appointment ID: ${appointmentId}\n\n[Note: Unable to load appointment details.]`,
        metadata: {
          appointmentId,
          error: error.message
        }
      };
    }
  }

  /**
   * Build context for prescription
   * @param {string} prescriptionId - Prescription ID
   * @param {Object} data - Context data
   * @param {string} systemPrompt - System prompt
   * @returns {Promise<Object>} Prescription context
   */
  async buildPrescriptionContext(prescriptionId, data, systemPrompt) {
    try {
      const { hospitalCode, patientId } = data;

      // Fetch prescription data from EMR
      const prescriptionData = await this._fetchPrescriptionData(
        hospitalCode,
        prescriptionId,
        patientId
      );

      const contextText = this._formatPrescriptionData(prescriptionData);

      return {
        systemPrompt,
        contextText,
        metadata: {
          prescriptionId,
          hospitalCode,
          tokenCount: TokenBudgetService.countTokens(contextText)
        }
      };
    } catch (error) {
      console.error('Error building prescription context:', error);
      return {
        systemPrompt,
        contextText: `Prescription ID: ${prescriptionId}\n\n[Note: Unable to load prescription details.]`,
        metadata: {
          prescriptionId,
          error: error.message
        }
      };
    }
  }

  /**
   * Build context for lab report
   * @param {string} reportId - Lab report ID
   * @param {Object} data - Context data
   * @param {string} systemPrompt - System prompt
   * @returns {Promise<Object>} Lab report context
   */
  async buildLabReportContext(reportId, data, systemPrompt) {
    try {
      const { hospitalCode, patientId } = data;

      // Fetch lab report data from EMR
      const labData = await this._fetchLabReportData(
        hospitalCode,
        reportId,
        patientId
      );

      const contextText = this._formatLabReportData(labData);

      return {
        systemPrompt,
        contextText,
        metadata: {
          reportId,
          hospitalCode,
          tokenCount: TokenBudgetService.countTokens(contextText)
        }
      };
    } catch (error) {
      console.error('Error building lab report context:', error);
      return {
        systemPrompt,
        contextText: `Lab Report ID: ${reportId}\n\n[Note: Unable to load lab report details.]`,
        metadata: {
          reportId,
          error: error.message
        }
      };
    }
  }

  /**
   * Build general context (no specific medical data)
   * @param {string} systemPrompt - System prompt
   * @returns {Object} General context
   */
  buildGeneralContext(systemPrompt) {
    return {
      systemPrompt,
      contextText: 'General health information assistant. No specific patient context loaded.',
      metadata: {
        contextType: 'GENERAL',
        tokenCount: 0
        }
    };
  }

  // ============ Private Helper Methods ============

  /**
   * Fetch visit data from EMR
   * @private
   */
  async _fetchVisitData(hospitalCode, visitId, patientId) {
    return new Promise((resolve, reject) => {
      const queryParams = `/patient/visit/${visitId}`;
      const body = { patientId };

      HTTPService.doGet(
        hospitalCode,
        queryParams,
        body,
        (response) => resolve(response),
        (error) => reject(error)
      );
    });
  }

  /**
   * Fetch prescription data from EMR
   * @private
   */
  async _fetchPrescriptionData(hospitalCode, prescriptionId, patientId) {
    return new Promise((resolve, reject) => {
      const queryParams = `/patient/prescription/${prescriptionId}`;
      const body = { patientId };

      HTTPService.doGet(
        hospitalCode,
        queryParams,
        body,
        (response) => resolve(response),
        (error) => reject(error)
      );
    });
  }

  /**
   * Fetch lab report data from EMR
   * @private
   */
  async _fetchLabReportData(hospitalCode, reportId, patientId) {
    return new Promise((resolve, reject) => {
      const queryParams = `/patient/labReport/${reportId}`;
      const body = { patientId };

      HTTPService.doGet(
        hospitalCode,
        queryParams,
        body,
        (response) => resolve(response),
        (error) => reject(error)
      );
    });
  }

  /**
   * Format visit data into readable text
   * @private
   */
  _formatVisitData(visitData) {
    if (!visitData || !visitData.data) {
      return '[No visit data available]';
    }

    const visit = visitData.data;
    let formatted = `## Visit Information\n\n`;

    if (visit.visitDate) {
      formatted += `**Visit Date:** ${visit.visitDate}\n`;
    }

    if (visit.doctorName) {
      formatted += `**Doctor:** ${visit.doctorName}\n`;
    }

    if (visit.specialty) {
      formatted += `**Specialty:** ${visit.specialty}\n`;
    }

    if (visit.diagnosis) {
      formatted += `\n**Diagnosis:**\n${visit.diagnosis}\n`;
    }

    if (visit.chiefComplaint) {
      formatted += `\n**Chief Complaint:**\n${visit.chiefComplaint}\n`;
    }

    if (visit.vitalSigns) {
      formatted += `\n**Vital Signs:**\n`;
      formatted += JSON.stringify(visit.vitalSigns, null, 2);
      formatted += `\n`;
    }

    if (visit.prescriptions && visit.prescriptions.length > 0) {
      formatted += `\n**Prescriptions:**\n`;
      visit.prescriptions.forEach((rx, idx) => {
        formatted += `${idx + 1}. ${rx.medicineName || rx.name} - ${rx.dosage || ''} - ${rx.instructions || ''}\n`;
      });
    }

    if (visit.labReports && visit.labReports.length > 0) {
      formatted += `\n**Lab Results:**\n`;
      visit.labReports.forEach((lab, idx) => {
        formatted += `${idx + 1}. ${lab.testName}: ${lab.result} ${lab.unit || ''} (Normal: ${lab.normalRange || 'N/A'})\n`;
      });
    }

    if (visit.notes) {
      formatted += `\n**Visit Notes:**\n${visit.notes}\n`;
    }

    return formatted;
  }

  /**
   * Format appointment data into readable text
   * @private
   */
  _formatAppointmentData(appointment) {
    let formatted = `## Appointment Information\n\n`;

    if (appointment.appointmentDate) {
      formatted += `**Date:** ${new Date(appointment.appointmentDate).toLocaleDateString()}\n`;
    }

    if (appointment.appointmentTime) {
      formatted += `**Time:** ${appointment.appointmentTime}\n`;
    }

    if (appointment.doctorDetails) {
      formatted += `**Doctor:** ${appointment.doctorDetails.name || 'N/A'}\n`;
      if (appointment.doctorDetails.specialty) {
        formatted += `**Specialty:** ${appointment.doctorDetails.specialty}\n`;
      }
    }

    if (appointment.hospitalDetails) {
      formatted += `**Hospital:** ${appointment.hospitalDetails.name || 'N/A'}\n`;
    }

    if (appointment.appointmentType) {
      formatted += `**Type:** ${appointment.appointmentType}\n`;
    }

    if (appointment.reason) {
      formatted += `\n**Reason for Visit:**\n${appointment.reason}\n`;
    }

    if (appointment.notes) {
      formatted += `\n**Notes:**\n${appointment.notes}\n`;
    }

    return formatted;
  }

  /**
   * Format prescription data into readable text
   * @private
   */
  _formatPrescriptionData(prescriptionData) {
    if (!prescriptionData || !prescriptionData.data) {
      return '[No prescription data available]';
    }

    const prescription = prescriptionData.data;
    let formatted = `## Prescription Information\n\n`;

    if (prescription.medications && prescription.medications.length > 0) {
      formatted += `**Medications:**\n`;
      prescription.medications.forEach((med, idx) => {
        formatted += `\n${idx + 1}. **${med.name}**\n`;
        if (med.dosage) formatted += `   - Dosage: ${med.dosage}\n`;
        if (med.frequency) formatted += `   - Frequency: ${med.frequency}\n`;
        if (med.duration) formatted += `   - Duration: ${med.duration}\n`;
        if (med.instructions) formatted += `   - Instructions: ${med.instructions}\n`;
      });
    }

    return formatted;
  }

  /**
   * Format lab report data into readable text
   * @private
   */
  _formatLabReportData(labData) {
    if (!labData || !labData.data) {
      return '[No lab report data available]';
    }

    const report = labData.data;
    let formatted = `## Laboratory Test Results\n\n`;

    if (report.reportDate) {
      formatted += `**Report Date:** ${report.reportDate}\n\n`;
    }

    if (report.tests && report.tests.length > 0) {
      formatted += `**Test Results:**\n\n`;
      report.tests.forEach((test, idx) => {
        formatted += `${idx + 1}. **${test.testName}**\n`;
        formatted += `   - Result: ${test.result} ${test.unit || ''}\n`;
        if (test.normalRange) {
          formatted += `   - Normal Range: ${test.normalRange}\n`;
        }
        if (test.flag) {
          formatted += `   - Flag: ${test.flag}\n`;
        }
        formatted += `\n`;
      });
    }

    return formatted;
  }
}

module.exports = new ContextBuilderService();
