// src/utils/PHIRedactor.js

/**
 * PHI (Protected Health Information) Redactor
 * Redacts sensitive information from logs to comply with privacy regulations
 */

class PHIRedactor {
  /**
   * Redact PHI from text
   * @param {string} text - Text that may contain PHI
   * @returns {string} Redacted text
   */
  static redact(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let redacted = text;

    // Redact phone numbers (various formats)
    redacted = redacted.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE]');
    redacted = redacted.replace(/\b\d{10}\b/g, '[PHONE]');
    redacted = redacted.replace(/\+\d{1,3}[-.\s]?\d{3,14}/g, '[PHONE]');

    // Redact email addresses
    redacted = redacted.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');

    // Redact dates of birth (common formats)
    redacted = redacted.replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, '[DATE]');
    redacted = redacted.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '[DATE]');

    // Redact medical record numbers (pattern: MRN followed by digits)
    redacted = redacted.replace(/\b(MRN|mrn|medical record|patient id)[:\s#]*\d+/gi, '[MRN]');

    // Redact Aadhaar numbers (12 digits, may be space/hyphen separated)
    redacted = redacted.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[ID]');

    // Redact common name patterns (Mr., Mrs., Dr. followed by name)
    redacted = redacted.replace(/\b(Mr\.|Mrs\.|Ms\.|Dr\.|Miss)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*/g, '[NAME]');

    return redacted;
  }

  /**
   * Redact PHI from an object (useful for logging request/response objects)
   * @param {Object} obj - Object that may contain PHI
   * @param {Array} fieldsToRedact - Field names to redact
   * @returns {Object} Redacted object
   */
  static redactObject(obj, fieldsToRedact = []) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const defaultFieldsToRedact = [
      'fullName',
      'name',
      'patientName',
      'phone',
      'mobile',
      'email',
      'dob',
      'dateOfBirth',
      'aadhaar',
      'medicalRecordNumber',
      'mrn',
      'address',
      'content',  // Chat content may contain PHI
      'message',
      'diagnosis',
      'chiefComplaint'
    ];

    const fields = [...new Set([...defaultFieldsToRedact, ...fieldsToRedact])];

    const redacted = JSON.parse(JSON.stringify(obj)); // Deep clone

    const redactRecursive = (o) => {
      if (Array.isArray(o)) {
        o.forEach(item => redactRecursive(item));
      } else if (o && typeof o === 'object') {
        Object.keys(o).forEach(key => {
          if (fields.includes(key)) {
            if (typeof o[key] === 'string') {
              o[key] = '[REDACTED]';
            }
          } else {
            redactRecursive(o[key]);
          }
        });
      }
    };

    redactRecursive(redacted);
    return redacted;
  }

  /**
   * Safe console.log that redacts PHI
   * @param {...any} args - Arguments to log
   */
  static log(...args) {
    const redactedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return this.redact(arg);
      } else if (typeof arg === 'object') {
        return this.redactObject(arg);
      }
      return arg;
    });

    console.log(...redactedArgs);
  }

  /**
   * Safe console.error that redacts PHI
   * @param {...any} args - Arguments to log
   */
  static error(...args) {
    const redactedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return this.redact(arg);
      } else if (typeof arg === 'object') {
        return this.redactObject(arg);
      }
      return arg;
    });

    console.error(...redactedArgs);
  }

  /**
   * Safe console.warn that redacts PHI
   * @param {...any} args - Arguments to log
   */
  static warn(...args) {
    const redactedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return this.redact(arg);
      } else if (typeof arg === 'object') {
        return this.redactObject(arg);
      }
      return arg;
    });

    console.warn(...redactedArgs);
  }
}

module.exports = PHIRedactor;
