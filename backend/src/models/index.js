module.exports = {

  facilityInformation: require("./FacilityInformation.js"),
  city: require("./City.js"),
  user: require("./User.js"),
  auditTrail: require("./AuditTrail.js"),
  configuration: require("./Configuration.js"),
  messageLog: require("./MessageLog.js"),
  familyMember: require("./FamilyMember.js"),
  familyMemberHospitalAccount: require("./FamilyMemberHospitalAccount.js"),
  hospital: require("./Hospital.js"),
  location: require("./Location.js"),
  hospitalResourceDetails: require("./HospitalResourceDetails.js"),
  appointment: require("./Appointment.js"),
  notification: require("./Notification.js"),
  reminder: require("./Reminder.js"),
  customerIssue: require("./CustomerIssue.js"),
  customerReportedIssues: require("./CustomerReportedIssues.js"),
  consentFormMaster: require("./ConsentFormMaster.js"),
  consentFormRecording: require("./ConsentFormRecording.js"),
  familyMemberAttachment: require("./FamilyMemberAttachment.js"),
  hospitalPolicy: require("./HospitalPolicy.js"),
  bill: require("./Bill.js"),

  // AI Chat System Models
  chatSession: require("./ChatSession.js"),
  chatMessage: require("./ChatMessage.js"),
  chatIdempotency: require("./ChatIdempotency.js"),

  // Advertisement Model
  advertisement: require("./Advertisement.js"),
};
