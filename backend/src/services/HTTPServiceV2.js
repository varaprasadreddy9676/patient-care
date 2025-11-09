const mongoose = require('mongoose');
const axios = require('axios');
const Hospital = mongoose.model('hospital', require('../models/Hospital'));
const HospitalResourceDetails = mongoose.model('hospital_resource_detail', require('../models/HospitalResourceDetails'));

class HospitalService {
    constructor(logger = console) {
        // Use the provided logger or default to console
        this.logger = logger;
        this.defaultTimeout = 100000; // Default timeout for HTTP requests
    }

    /**
     * Log messages using the provided logger or console.
     */
    log(level, message) {
        if (this.logger && typeof this.logger[level] === 'function') {
            this.logger[level](message);
        } else {
            console[level](message); // Fallback to console
        }
    }

    /**
     * Generate a cURL command for logging purposes.
     */
    generateCurlCommand(url, method, headers, payload) {
        let curl = `curl -X ${method.toUpperCase()} '${url}'`;
        if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
                curl += ` -H '${key}: ${value}'`;
            });
        }
        if (payload) {
            curl += ` -d '${JSON.stringify(payload)}'`;
        }
        return curl;
    }

    /**
     * Fetch the application server URL and options for the given hospital code.
     */
    async getAppServerURL(hospitalCode) {
        try {
            const hospital = await Hospital.findOne({ code: hospitalCode });
            if (!hospital) {
                throw new Error(`Invalid hospital code: ${hospitalCode}`);
            }

            this.log('info', `Hospital code: ${hospital.code}`);
            const hospitalResourceDetails = await HospitalResourceDetails.findById(hospital.resourceId);

            if (!hospitalResourceDetails) {
                throw new Error(`Resource not found for hospital code: ${hospitalCode}`);
            }

            const agentOptions = hospitalResourceDetails.agentOptions;
            if (hospital.authDetails) {
                agentOptions.authDetails = {
                    ...hospital.authDetails,
                    hospitalCode: hospital.code,
                };
            }

            return agentOptions;
        } catch (error) {
            this.log('error', `Error in getAppServerURL: ${error.message}`);
            throw error;
        }
    }

    async processHTTP(agentOptions, method, queryParams = '', payload = null) {
        try {
            const url = `${agentOptions.host}${agentOptions.port ? `:${agentOptions.port}` : ''}${agentOptions.path}${queryParams}`;
            const headers = {
                Authorization: agentOptions.authDetails.token,
            };
    
            // Log the generated cURL command
            const curlCommand = this.generateCurlCommand(url, method, headers, payload);
            this.log('info', `cURL Command: ${curlCommand}`);
    
            const response = await axios({
                method,
                url,
                headers,
                data: payload,
                timeout: this.defaultTimeout,
            });
    
            // Check if the response contains an error message
            if (response.data && response.data.ERROR_MSG) {
                const errorMsg = response.data.ERROR_MSG;
    
                if (errorMsg.includes('Token expired') || errorMsg.includes('Access denied')) {
                    this.log('warn', `Detected token expiration or access issue in response: ${errorMsg}`);
                    this.log('warn', `Attempting to regenerate token for hospitalCode: ${agentOptions.authDetails.hospitalCode}`);
    
                    try {
                        const newToken = await this.generateTokenAndSave(agentOptions.authDetails.hospitalCode);
    
                        // Retry the request with the new token
                        agentOptions.authDetails.token = newToken;
                        return await this.processHTTP(agentOptions, method, queryParams, payload);
                    } catch (tokenError) {
                        this.log('error', `Error regenerating token: ${tokenError.message}`);
                        throw tokenError;
                    }
                }
            }
    
            this.log('info', `<<< Response received from ${url}: ${JSON.stringify(response.data)}`);
            return response.data;
        } catch (error) {
            this.log('error', `Error in processHTTP: ${error.message}`);
    
            if (error.response) {
                this.log('error', `Response error: ${JSON.stringify(error.response.data)}`);
            }
    
            throw error;
        }
    }
    
    /**
     * Regenerate and save a new token for the given hospitalCode.
     */
    async generateTokenAndSave(hospitalCode) {
        try {
            const hospital = await Hospital.findOne({ code: hospitalCode });
    
            if (!hospital || !hospital.authDetails) {
                throw new Error(`Hospital ${hospitalCode} does not have valid auth details.`);
            }
    
            const resourceDetails = await HospitalResourceDetails.findById(hospital.resourceId);
            if (!resourceDetails) {
                throw new Error(`Resource details not found for hospital code: ${hospitalCode}`);
            }
    
            const agentOptions = resourceDetails.agentOptions;
            const url = `${agentOptions.host}${agentOptions.port ? `:${agentOptions.port}` : ''}${agentOptions.path}/token`;
    
            const payload = {
                entitycode: hospitalCode,
                userId: hospital.authDetails.userId,
                password: hospital.authDetails.password,
            };
    
            const curlCommand = this.generateCurlCommand(url, 'POST', { 'Content-Type': 'application/json' }, payload);
            this.log('info', `cURL Command for Token Generation: ${curlCommand}`);
    
            const response = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
    
            if (!response.data || response.data.ERROR_MSG) {
                throw new Error(`Token generation failed: ${response.data.ERROR_MSG}`);
            }
    
            const newToken = `Bearer ${response.data.token}`;
            const tokenRegeneratedDate = new Date();
    
            // Atomically update the token in the database
            const updatedHospital = await Hospital.findOneAndUpdate(
                { code: hospitalCode },
                {
                    $set: {
                        'authDetails.token': newToken,
                        'authDetails.tokenRegeneratedDate': tokenRegeneratedDate,
                    },
                },
                { new: true } // Return the updated document
            );
    
            if (!updatedHospital || updatedHospital.authDetails.token !== newToken) {
                throw new Error(`Failed to save the updated token for hospital code: ${hospitalCode}`);
            }
    
            this.log('info', `Token generated and saved successfully for hospitalCode: ${hospitalCode}`);
            return newToken;
        } catch (error) {
            this.log('error', `Error in generateTokenAndSave: ${error.message}`);
            throw error;
        }
    }

    /**
     * Unified function to perform HTTP requests based on the method.
     */
    async doRequest(hospitalCode, method, queryParams = '', payload = null) {
        try {
            const agentOptions = await this.getAppServerURL(hospitalCode);
            return await this.processHTTP(agentOptions, method, queryParams, payload);
        } catch (error) {
            this.log('error', `Error in doRequest: ${error.message}`);
            throw error;
        }
    }
}

module.exports = HospitalService;