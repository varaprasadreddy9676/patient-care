const axios = require("axios");
const config = require("../config/constants")
const entityCode = "null";
const enterpriseCode = "null";

class CommunicationService {

	constructor() {
		this.source = "medicsNotification";
		this.url = config.communicationServerURL;
	}

	

	async postData(data) {
		const headers = { "Content-Type": "application/json" };

		data.source = this.source;

		console.log(`URL: ${this.url}`);
		console.log(`Payload: ${JSON.stringify({ payload: data })}`);
		console.log(`Headers: ${JSON.stringify(headers)}`);

		try {
			const response = await axios.post(
				`${this.url}sendNotification`,
				{ payload: data },
				{ headers: headers },
			);

			return response?.data;
		} catch (error) {
			const curlHeaders = Object.keys(headers)
				.map((key) => `-H "${key}: ${headers[key]}"`)
				.join(" ");
			const curlCommand = `curl -X POST ${
				this.url
			} ${curlHeaders} -H "Content-Type: application/json" -d '${JSON.stringify(
				data,
			)}'`;
			console.log(
				`POST request to ${this.url} failed: ${error}. Equivalent CURL command: ${curlCommand}`,
			);
			return error;
		}
	}

	async sendSMS(phoneNumber, text, code) {
		const payload = {
			messageType: "sms",
			phone: phoneNumber,
			message: text,
			hospitalCode: code,
			corporateEntityCode: enterpriseCode
		};
		return await this.postData(payload);
	}

	async sendWhatsappMessage(phoneNumber, otp) {
		const payload = {
			messageType: "whatsapp",
			phoneNumber: phoneNumber,
			messageDetails: {
				name: "medics_care_login_otp",
				components: [
					{
						"type": "body",
						"parameters": [
							{
								type: "text",
								text: otp
							}
						]
					},
					{
						type: "button",
						sub_type: "url",
						index: 0,
						parameters: [
							{
								"type": "text",
								"text": otp
							}
						]
					}
				],
				language: {
					code : "en_US",
					policy : "deterministic"
				},
				"namespace": "12dfb464_ca0d_47f6_b753_5e759bbf2c34"
			},
			"hospitalCode": "7123456",
			"corporateEntityCode": "7123456",
			"source": "medicsNotification"
		};
		return await this.postData(payload);
	}

	async sendMail(emailPayload) {
		const payload = {
			messageType: "email",
			subject: emailPayload.subject,
			body: emailPayload.body,
			to: [emailPayload.to],
			cc: [emailPayload.cc],
			attachment: emailPayload.attachment,
			attachmentName: emailPayload.attachmentName,
			hospitalCode: entityCode,
			corporateEntityCode: enterpriseCode,
		};
		return await this.postData(payload);
	}
}

module.exports = CommunicationService;
