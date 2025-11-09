const constants = require('./config/constants');

const BASE_URL = constants.BASE_URL;

module.exports = {

    [BASE_URL + '/signup']: require('./controllers/SignUp'),
    [BASE_URL + '/signin']: require('./controllers/SignIn'),
    [BASE_URL + '/city']: require('./controllers/CityController'),
    [BASE_URL + '/user']: require('./controllers/UserController'),
    [BASE_URL + '/auditTrail']: require('./controllers/AuditTrailController'),
    [BASE_URL + '/facilityInformation']: require('./controllers/FacilityInformationController'),
    [BASE_URL + '/configuration']: require('./controllers/ConfigurationController'),
    [BASE_URL + '/app']: require('./controllers/AppController'),

    [BASE_URL + '/familyMember']: require('./controllers/FamilyMemberController'),
    [BASE_URL + '/familyMemberHospitalAccount']: require('./controllers/FamilyMemberHospitalAccountController'),

    [BASE_URL + '/hospital']: require('./controllers/HospitalController'),
    [BASE_URL + '/speciality*']: require('./controllers/SpecialityController'),
    [BASE_URL + '/doctor*']: require('./controllers/DoctorController'),
    [BASE_URL + '/appointment*']: require('./controllers/AppointmentController'),
    [BASE_URL + '/prescription']: require('./controllers/PrescriptionController'),
    [BASE_URL + '/prescription/ready']: require('./controllers/PrescriptionController'),
    [BASE_URL + '/visit*']: require('./controllers/VisitController'),
    [BASE_URL + '/emr']: require('./controllers/EMRController'),
    [BASE_URL + '/notification']: require('./controllers/NotificationController'),
    [BASE_URL + '/reminder']: require('./controllers/ReminderController'),
    [BASE_URL + '/attachment']: require('./controllers/AttachmentController'),
    [BASE_URL + '/customerIssue']: require('./controllers/CustomerIssueController'),
    [BASE_URL + '/customerReportedIssue']: require('./controllers/CustomerReportedIssuesController'),
    [BASE_URL + '/receipt']: require('./controllers/ReceiptController'),
    [BASE_URL + '/consentFormMaster']: require('./controllers/ConsentFormMasterController'),
    [BASE_URL + '/consentFormRecording']: require('./controllers/ConsentFormRecordingController'),
    [BASE_URL + '/hospitalPolicy']: require('./controllers/HospitalPolicyController'),
    [BASE_URL + '/bill']: require('./controllers/BillController'),
    [BASE_URL + '/dischargeSummary']: require('./controllers/DischargeSummaryController'),
    [BASE_URL + '/labReports']: require('./controllers/LabReportController'),
    [BASE_URL + '/externalLabReports']: require('./controllers/ExternalLabReportController'),
    [BASE_URL + '/location']: require('./controllers/LocationController'),
    [BASE_URL + '/token']: require('./controllers/AuthController'),

    // Advertisement endpoints
    [BASE_URL + '/advertisements']: require('./controllers/AdvertisementController'),

    // AI Chat System
    [BASE_URL + '/v1/chat']: require('./controllers/ChatController'),

    // Patient Assessment
    [BASE_URL + '/patient-assessment']: require('./controllers/PatientAssessmentController')

};