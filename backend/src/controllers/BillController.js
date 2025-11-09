const mongoose = require("mongoose");
const HTTPServiceV2 = require("../services/HTTPServiceV2"); // Use the new HTTPServiceV2
// Instantiate the service 
const httpService = new HTTPServiceV2();

const Messenger = require("../services/CommunicationService");

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');
const SelectedFamilyMemberHelper = require('../utils/SelectedFamilyMemberHelper');

const messenger = new Messenger();

module.exports = function (app, route) {
    const FamilyMember = mongoose.model("family_member", app.models.familyMember);
    const FamilyMemberHospitalAccount = mongoose.model("family_member_hospital_account", app.models.familyMemberHospitalAccount);
    const Hospital = mongoose.model("hospitals", app.models.hospital);
    const Bill = mongoose.model("bill", app.models.bill);

/**
 * Fetch bills for a user within a date range (Sequentially).
 */
app.get(route, async (req, res) => {
    const { userId, selectedFamilyMemberId, status, fromDate, toDate } = req.query;

    // Validate required parameters
    if (!fromDate || !toDate) {
        return res.status(400).json({ message: "fromDate and toDate are required" });
    }

    try {
        // Function to format date with time
        const formatDateTime = (date, time) => {
            return `${date} ${time}`;
        };

        // Append default times if not provided
        const fromDateTime = formatDateTime(fromDate, "00:00:00");
        const toDateTime = formatDateTime(toDate, "23:59:59");

        // SMART CHANGE: Filter by familyMemberId at query level
        const query = { userId };
        if (selectedFamilyMemberId) {
            query.familyMemberId = selectedFamilyMemberId;
        }

        const accounts = await FamilyMemberHospitalAccount.find(query);
        if (!accounts || accounts.length === 0) {
            return res.status(200).json([]); // No accounts, return an empty list
        }

        const bills = [];

        // Process each account sequentially
        for (const account of accounts) {
            const { hospitalCode, patientId, familyMemberId, hospitalName } = account;

            // Fetch family member details
            const familyMember = await FamilyMember.findById(familyMemberId).exec();
            if (!familyMember) {
                console.warn(`Family member not found for ID: ${familyMemberId}`);
                continue; // Skip this account
            }

            // Fetch hospital details
            const hospital = await Hospital.findOne({ code: hospitalCode }).exec();
            if (!hospital) {
                console.warn(`Hospital not found for code: ${hospitalCode}`);
                continue; // Skip this account
            }

            // Prepare the body for fetching bills
            const body = {
                patientId,
                entityCode: hospitalCode,
                fromDateTime,
                toDateTime,
                status,
            };

            // Fetch bills from the hospital API
            try {
                const url = "/bills";
                const response = await httpService.doRequest(hospitalCode, "GET", url, body);

                if (response && response.data && response.data.bills) {
                    bills.push({
                        patientId,
                        familyMemberName: familyMember.fullName,
                        familyMemberGender: familyMember.gender,
                        hospitalName,
                        hospitalCode,
                        bill: response.data.bills,
                        paymentDetails: {
                            gatewayKey: hospital.paymentGatewayDetails?.key || "",
                            upi: hospital.paymentGatewayDetails?.upi || "",
                        },
                    });
                }
            } catch (error) {
                console.error(`Error fetching bills for hospitalCode ${hospitalCode}:`, error.message);
            }
        }

        res.status(200).json(bills);
    } catch (error) {
        console.error("Error fetching bills:", error);
        res.status(500).json({ message: "Failed to fetch bills", error: error.message });
    }
});

    /**
     * Fetch bill details by bill ID.
     */
    app.get(`${route}/billDetails`, async (req, res) => {
        const { hospitalCode, billId } = req.query;

        if (!hospitalCode || !billId) {
            return res.status(400).json({ message: "hospitalCode and billId are required" });
        }

        try {
            const url = `/bills/${billId}`;
            const response = await httpService.doRequest(hospitalCode, "GET", url);
            if (response.ERROR_MSG) {
                return res.status(400).json({
                    code: "FAILED_TO_GET_BILL",
                    message: response.ERROR_MSG,
                });
            }

            res.status(200).json(response.data);
        } catch (error) {
            console.error(`Error fetching bill details for billId ${billId}:`, error.message);
            res.status(500).json({ message: "Failed to fetch bill details", error: error.message });
        }
    });

    /**
     * Confirm payment for a bill.
     */
    app.post(`${route}/confirmPayment`, async (req, res) => {
        const {
            hospitalCode,
            patientId,
            billId,
            price,
            billDate,
            visitId,
            phone,
            chargeName,
            email,
            paymentDetails,
        } = req.body;

        if (!hospitalCode || !patientId || !billId || !price) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        try {
            const hospital = await Hospital.findOne({ code: hospitalCode });
            if (hospital) {
                paymentDetails.bankAccountNumber = hospital.paymentGatewayDetails?.bankAccountNumber || "";
                paymentDetails.bankName = hospital.paymentGatewayDetails?.bankName || "";
            }

            const billModel = new Bill({
                hospitalCode,
                patientId,
                billId,
                price,
                billDate,
                visitId,
                phone,
                chargeName,
                email,
                paymentDetails,
                paymentConfirmationDateTime: new Date(),
                status: "PAYMENT_SUCCESS",
            });
            await billModel.save();

            const url = "/receipts";
            const body = {
                entityCode: hospitalCode,
                patientId,
                visitId,
                billId,
                billAmount: price,
                paidAmount: price,
                billDate,
                referenceNumber: paymentDetails.referenceNumber || "",
                bankName: paymentDetails.bankName,
                bankAccountNumber: paymentDetails.bankAccountNumber,
            };

            const response = await httpService.doRequest(hospitalCode, "POST", url, body);

            if (response.ERROR_MSG) {
                return res.status(400).json({
                    code: "FAILED_TO_CONFIRM_PAYMENT",
                    message: response.ERROR_MSG,
                });
            }

            // Payment confirmation response
            const messageTemplate = `We have received the payment of Rs ${price} for ${chargeName} -medics`;
            messenger.sendSMS(phone, messageTemplate, hospitalCode);

            if (email) {
                await sendReceiptByEmail(hospitalCode, response.data?.Receipt?.id, email, chargeName);
            }

            res.status(200).json({
                code: "PAYMENT_CONFIRMED",
                message: "Successfully paid for the bill.",
            });
        } catch (error) {
            console.error("Error confirming payment:", error.message);
            res.status(500).json({ message: "Payment confirmation failed", error: error.message });
        }
    });

    /**
     * Send receipt by email.
     */
    async function sendReceiptByEmail(hospitalCode, receiptId, email, chargeName) {
        if (!hospitalCode || !receiptId || !email) return;

        try {
            const url = `/receipts/${receiptId}`;
            const response = await httpService.doRequest(hospitalCode, "GET", url);

            if (response.data) {
                const receiptContent = Buffer.from(response.data.receiptBase64, "base64");
                const mail = {
                    to: email,
                    subject: `medics care ${chargeName} receipt`,
                    body: `Please find the attached payment acknowledgement for ${chargeName}.`,
                    attachments: [
                        {
                            filename: "Payment Acknowledgement.pdf",
                            content: receiptContent,
                            contentType: "application/pdf",
                        },
                    ],
                };

                messenger.sendMail(mail);
            }
        } catch (error) {
            console.error(`Error sending receipt email: ${error.message}`);
        }
    }

    return (req, res, next) => next(); // Return middleware
};