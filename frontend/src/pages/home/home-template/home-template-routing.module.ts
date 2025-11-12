import { Routes } from '@angular/router';

export const homeTemplateRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('../home.page').then((m) => m.HomePage),
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'appointment-list',
    loadComponent: () =>
      import('../../appointment/appointment-list/appointment-list.page').then(
        (m) => m.AppointmentListPage
      ),
  },
  {
    path: 'appointment-booking',
    loadComponent: () =>
      import(
        '../../appointment/appointment-booking/appointment-booking.page'
      ).then((m) => m.AppointmentBookingPage),
  },
  // NW
  {
    path: 'appointment-details',
    loadComponent: () =>
      import(
        '../../appointment/appointment-details/appointment-details.page'
      ).then((m) => m.AppointmentDetailsPage),
  },
  {
    path: 'hospital-preference',
    loadComponent: () =>
      import(
        '../../appointment/hospital-preference/hospital-preference.page'
      ).then((m) => m.HospitalPreferencePage),
  },
  {
    path: 'family-member-list',
    loadComponent: () =>
      import(
        '../../family-member/family-member-list/family-member-list.page'
      ).then((m) => m.FamilyMemberListPage),
  },
  {
    path: 'family-member-form',
    loadComponent: () =>
      import(
        '../../family-member/family-member-form/family-member-form.page'
      ).then((m) => m.FamilyMemberFormPage),
  },
  {
    path: 'sign-up-confirmation',
    loadComponent: () =>
      import('../../login/sign-up-confirmation/sign-up-confirmation.page').then(
        (m) => m.SignUpConfirmationPage
      ),
  },
  {
    path: 'audit-trail',
    loadComponent: () =>
      import('../../audit-trail-admin/audit-trail/audit-trail.page').then(
        (m) => m.AuditTrailPage
      ),
  },
  {
    path: 'banner-admin',
    loadComponent: () =>
      import('../../banner-admin/banner-admin.page').then(
        (m) => m.BannerAdminPage
      ),
  },
  {
    path: 'banner-analytics',
    loadComponent: () =>
      import('../../banner-analytics/banner-analytics.page').then(
        (m) => m.BannerAnalyticsPage
      ),
  },
  {
    path: 'select-patient',
    loadComponent: () =>
      import('../../appointment/select-patient/select-patient.page').then(
        (m) => m.SelectPatientPage
      ),
  },
  {
    path: 'prescription',
    loadComponent: () =>
      import('../../prescription/prescription.page').then(
        (m) => m.PrescriptionPage
      ),
  },
  {
    path: 'prescription-visits',
    loadComponent: () =>
      import('../../prescription/prescription-visits/prescription-visits.page').then(
        (m) => m.PrescriptionVisitsPage
      ),
  },
  {
    path: 'prescription-visit-detail',
    loadComponent: () =>
      import('../../prescription/prescription-visit-detail/prescription-visit-detail.page').then(
        (m) => m.PrescriptionVisitDetailPage
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('../../user/profile-overview/profile-overview.page').then(
        (m) => m.ProfileOverviewPage
      ),
  },
  {
    path: 'profile-edit',
    loadComponent: () =>
      import('../../user/profile-edition/profile-edition.page').then(
        (m) => m.ProfileEditionPage
      ),
  },
  {
    path: 'emr',
    loadComponent: () =>
      import('../../visit-records/emr/emr.page').then((m) => m.EmrPage),
  },
  {
    path: 'reminder',
    loadComponent: () =>
      import('../../reminder/reminder.page').then((m) => m.ReminderPage),
  },

  // NW
  {
    path: 'hospital-list',
    loadComponent: () =>
      import(
        '../../hospital-modification/hospital-list/hospital-list.page'
      ).then((m) => m.HospitalListPage),
  },
  // NW
  {
    path: 'modify-hospital',
    loadComponent: () =>
      import(
        '../../hospital-modification/modify-hospital/modify-hospital.page'
      ).then((m) => m.ModifyHospitalPage),
  },

  {
    path: 'attachment-list',
    loadComponent: () =>
      import('../../attachments/attachment-list/attachment-list.page').then(
        (m) => m.AttachmentListPage
      ),
  },

  {
    path: 'report-attachment-list',
    loadComponent: () =>
      import(
        '../../attachments/report-attachment-list/report-attachment-list.page'
      ).then((m) => m.ReportAttachmentListPage),
  },

  {
    path: 'service-requests',
    loadComponent: () =>
      import(
        '../../customer-service/service-requests/service-requests.page'
      ).then((m) => m.ServiceRequestsPage),
  },
  {
    path: 'new-service-request',
    loadComponent: () =>
      import(
        '../../customer-service/new-service-request/new-service-request.page'
      ).then((m) => m.NewServiceRequestPage),
  },


  {
    path: 'profiles',
    loadComponent: () =>
      import('../../user/profiles/profiles.component').then(
        (m) => m.RecordsComponent
      ),
  },
  // NW
  {
    path: 'medical-attachment',
    // tslint:disable-next-line:max-line-length
    loadComponent: () =>
      import(
        '../../visit-records/medical-attachments/medical-attachments.page'
      ).then((m) => m.MedicalAttachmentsPage),
  },

  {
    path: 'consent-form',
    loadComponent: () =>
      import('../../appointment/consent-form/consent-form.page').then(
        (m) => m.ConsentFormPage
      ),
  },
  {
    path: 'confirm-appointment',
    loadComponent: () =>
      import(
        '../../appointment/confirm-appointment/confirm-appointment.page'
      ).then((m) => m.ConfirmAppointmentPage),
  },
  {
    path: 'appointment-confirmed',
    loadComponent: () =>
      import(
        '../../appointment/appointment-confirmed/appointment-confirmed.page'
      ).then((m) => m.AppointmentConfirmedPage),
  },
  {
    path: 'bills',
    loadComponent: () =>
      import('../../financials/bills/bills.page').then((m) => m.BillsPage),
  },
  {
    path: 'bill-details',
    loadComponent: () =>
      import('../../financials/bill-details/bill-details.page').then(
        (m) => m.BillDetailsPage
      ),
  },
  {
    path: 'chat-history',
    loadComponent: () =>
      import('../../chat-history/chat-history.page').then(
        (m) => m.ChatHistoryPage
      ),
  },
  {
    path: 'facility-information',
    loadComponent: () =>
      import('../../facility-information/facility-information.page').then(
        (m) => m.FacilityInformationPage
      ),
  },

  // NW
  {
    path: 'facility-information-template',
    loadComponent: () =>
      import(
        '../../facility-information-template/facility-information-template.page'
      ).then((m) => m.FacilityInformationTemplatePage),
  },
  {
    path: 'edit-facility-information',
    loadComponent: () =>
      import(
        '../../edit-facility-information/edit-facility-information.page'
      ).then((m) => m.EditFacilityInformationPage),
  },
  {
    path: 'family-member-attachment-list',
    loadComponent: () =>
      import(
        '../../attachments/family-member-attachment-list/family-member-attachment-list.page'
      ).then((m) => m.FamilyMemberAttachmentListPage),
  },
  {
    path: 'medical-record',
    loadComponent: () =>
      import(
        '../../emr/visits/visits.page'
      ).then((m) => m.visitsPage),
  },
  {
    path: 'emr-visit-details',
    loadComponent: () => import('../../emr/visit-details/visit-details.page').then(m => m.visitDetailsPage)
  },
  {
    path: 'emr-visit-summary',
    loadComponent: () => import('../../emr/visit-summary/visit-summary.page').then(m => m.VisitSummaryPage)
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];
