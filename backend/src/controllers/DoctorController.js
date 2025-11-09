var restful = require("node-restful");
var mongoose = require("mongoose");
var httpService = require("../services/HTTPService.js");
const moment = require('moment');
const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');

module.exports = function (app, route) {

  app.get(route + "/freeBooking", async function (req, res, next) {

    const FamilyMemberHospitalAccount = mongoose.model(
      "family_member_hospital_account",
      app.models.familyMemberHospitalAccount
    );
 
    const format2 = "YYYY-MM-DD";

    let familyMember;
    let hospitalCode = req.query.hospitalCode;
    let doctorId = req.query.doctorId;
    let consultationChargeId = req.query.consultationChargeId;
    let familyMemberId = req.query.familyMemberId;
    let specialityCode = req.query.specialityCode;
    let appointmentDate = moment(req.query.appointmentDate).format(format2);

    try {

         familyMember = await FamilyMemberHospitalAccount.findOne({
            hospitalCode: hospitalCode,
            familyMemberId: familyMemberId,
          })
    } catch (error) {

        console.error(error);
        throw error
    }

    let url = "/hospital-charges/" + consultationChargeId;

    let body = {
      entityCode: hospitalCode,
      doctorId: doctorId,
      patientId: familyMember&&familyMember.patientId ? familyMember.patientId: '0', // Not possibly happens but Incase if patient id is not there 
      specialityCode: specialityCode,
      appointmentDate: appointmentDate,
    };

    const callbacks = ResponseHandler.createHTTPServiceCallbacks(res,
      (response) => {
        if (response.data) {
          const data = {
            freeBooking: false, // To be removed later. Kept for backward compatibility
            charge: response.data.charge,
          };
          return ResponseHandler.success(res, data);
        } else {
          return ResponseHandler.error(res, new AppError(ErrorCodes.EXTERNAL_SERVICE_ERROR, "No data received from external service"));
        }
      },
      (error) => {
        console.error("Error: " + error);
        return ResponseHandler.error(res, error, 500);
      }
    );

    httpService.doGet(hospitalCode, url, body, callbacks.success, callbacks.error);
  });

  app.get(route, function (req, res, next) {
    var hospitalCode = req.query.hospitalCode;
    var specialityCode = req.query.specialityCode;
    var id = req.query.id;

    var body = {
      entityCode: hospitalCode,
      specialityCode: specialityCode,
      schedulableOnline: true,
    };

    var url = "/doctors";
    if (id) {
      url += "/" + id;
    }

    const callbacks = ResponseHandler.createHTTPServiceCallbacks(res);

    httpService.doGet(hospitalCode, url, body, callbacks.success, callbacks.error);
  });

  // Return middleware
  return function (req, res, next) {
    next();
  };
};
