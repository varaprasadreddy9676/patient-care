# 🎯 Analytics Implementation Guide

## Overview
This guide shows how to add event tracking across the MedicsCare app using angulartics2.

## Setup Complete ✅
- ✅ angulartics2 installed
- ✅ AnalyticsService created
- ✅ Configured in main.ts
- ✅ Initialized in app.component.ts

---

## How to Track Events

### Method 1: Inject AnalyticsService (Recommended)

```typescript
import { AnalyticsService } from 'src/services/analytics/analytics.service';

export class YourPage {
  constructor(private analytics: AnalyticsService) {}

  someAction() {
    // Simple tracking
    this.analytics.track('EVENT_NAME', 'category', 'details');

    // With metadata
    this.analytics.track('APPOINTMENT_BOOKED', 'appointment', 'Book Now', {
      doctor: 'Dr. Smith',
      date: '2025-11-15'
    });
  }
}
```

### Method 2: Use Angulartics2 Directly

```typescript
import { Angulartics2 } from 'angulartics2';

export class YourPage {
  constructor(private angulartics2: Angulartics2) {}

  someAction() {
    this.angulartics2.eventTrack.next({
      action: 'EVENT_NAME',
      properties: {
        category: 'category',
        label: 'details'
      }
    });
  }
}
```

---

## Quick Methods

### Page Views (Auto-tracked by Router)
Page views are automatically tracked. No code needed!

### Manual Page Tracking
```typescript
this.analytics.pageView('/custom-page');
```

### Button Clicks
```typescript
bookAppointment() {
  this.analytics.buttonClick('Book Appointment', 'Home Page');
  // ... your code
}
```

### Form Submissions
```typescript
async submitForm() {
  try {
    await this.httpService.post('/api/endpoint', data);
    this.analytics.formSubmit('Registration Form', true);
  } catch (error) {
    this.analytics.formSubmit('Registration Form', false);
  }
}
```

### Errors
```typescript
try {
  // ... code
} catch (error) {
  this.analytics.error('API Call Failed', {
    endpoint: '/api/appointment',
    error: error.message
  });
}
```

### API Calls
```typescript
const startTime = Date.now();
const response = await this.httpService.get('/appointment');
const duration = Date.now() - startTime;

this.analytics.apiCall('/appointment', 'GET', 200, duration);
```

---

## Examples by Feature

### 1. Authentication Flow

**In `sign-in.page.ts`:**

```typescript
import { AnalyticsService } from 'src/services/analytics/analytics.service';

export class SignInPage {
  constructor(private analytics: AnalyticsService) {}

  async getOtp(phoneNumber: string) {
    this.analytics.track('OTP_REQUESTED', 'auth', phoneNumber);

    try {
      const response = await this.httpService.get(getOtpUrl);
      this.analytics.track('OTP_SENT', 'auth', 'Success');
      this.openDialog(response.profileId);
    } catch (error) {
      this.analytics.error('OTP_FAILED', { phone: phoneNumber, error });
    }
  }
}
```

**In `token-verification.page.ts`:**

```typescript
async verifyOTP() {
  this.analytics.track('OTP_VERIFICATION_STARTED', 'auth');

  try {
    const user = await this.httpService.put(verifyOtpURL, this.otpBody());
    this.analytics.track('USER_LOGGED_IN', 'auth', user.phone);
    this.navCtrl.navigateRoot('/home');
  } catch (error) {
    this.analytics.track('OTP_VERIFICATION_FAILED', 'auth', error.message);
  }
}
```

### 2. Appointment Booking

**In `appointment-booking.page.ts`:**

```typescript
import { AnalyticsService } from 'src/services/analytics/analytics.service';

export class AppointmentBookingPage {
  constructor(private analytics: AnalyticsService) {}

  ngOnInit() {
    this.analytics.track('APPOINTMENT_BOOKING_OPENED', 'appointment');
  }

  getConsultationType(event: string) {
    this.analytics.track('CONSULTATION_TYPE_SELECTED', 'appointment', event);
  }

  getCurrentDoctor(doctor: any) {
    this.analytics.track('DOCTOR_SELECTED', 'appointment', doctor.doctorName, {
      doctorId: doctor.doctorId,
      speciality: doctor.specialityName
    });
  }

  onDateSelect() {
    this.analytics.track('APPOINTMENT_DATE_SELECTED', 'appointment',
      this.dateOfAppointment);
  }

  getConsentForm() {
    this.analytics.track('APPOINTMENT_BOOKING_INITIATED', 'appointment',
      'User proceeding to confirmation', {
        hospital: this.hospitalName,
        doctor: this.selectedDoctorData.doctorName,
        date: this.dateOfAppointment,
        type: this.isVideo
      });

    this.router.navigate(['/home/consent-form'], navigationExtras);
  }
}
```

**In `confirm-appointment.page.ts`:**

```typescript
async confirmAppointment() {
  this.analytics.track('APPOINTMENT_CONFIRMATION_STARTED', 'appointment');

  try {
    const response = await this.httpService.post('/appointment', appointmentData);
    this.analytics.track('APPOINTMENT_CONFIRMED', 'appointment', 'Success', {
      appointmentId: response.id,
      doctor: appointmentData.doctorName,
      date: appointmentData.appointmentDate
    });

    this.router.navigate(['/home/appointment-confirmed']);
  } catch (error) {
    this.analytics.error('APPOINTMENT_CONFIRMATION_FAILED', error);
  }
}
```

### 3. Home Page

**In `home.page.ts`:**

```typescript
import { AnalyticsService } from 'src/services/analytics/analytics.service';

export class HomePage {
  constructor(private analytics: AnalyticsService) {}

  ngOnInit() {
    this.analytics.pageView('/home');
  }

  goToNewAppointment() {
    this.analytics.buttonClick('Book Appointment', 'Home Page');
    this.router.navigate(['/home/appointment-booking']);
  }

  goToMedicalRecords() {
    this.analytics.buttonClick('Medical Records', 'Home Page');
    this.router.navigate(['/home/medical-record']);
  }

  goToPrescription() {
    this.analytics.buttonClick('Prescriptions', 'Home Page');
    this.router.navigate(['/home/prescription-visits']);
  }

  goToBills() {
    this.analytics.buttonClick('Bills', 'Home Page');
    this.router.navigate(['/home/bills']);
  }
}
```

### 4. Medical Records (EMR)

**In `visits.page.ts`:**

```typescript
async getVisitRecords() {
  this.analytics.track('EMR_ACCESSED', 'medical_records');

  try {
    const visits = await this.httpService.get(getVisitURL);
    this.analytics.track('EMR_LOADED', 'medical_records', `${visits.length} records`);
  } catch (error) {
    this.analytics.error('EMR_LOAD_FAILED', error);
  }
}

openVisitDetails(visit: any) {
  this.analytics.track('VISIT_RECORD_OPENED', 'medical_records', visit.visitId, {
    doctor: visit.doctorName,
    date: visit.visitDate
  });

  this.router.navigate(['/visit-details', visit.id]);
}
```

### 5. Prescriptions

**In `prescription-visits.page.ts`:**

```typescript
viewPrescription(prescription: any) {
  this.analytics.track('PRESCRIPTION_VIEWED', 'prescription', prescription.id, {
    doctor: prescription.doctorName,
    medicationCount: prescription.medications?.length
  });

  this.router.navigate(['/prescription-detail', prescription.id]);
}

downloadPrescription(prescription: any) {
  this.analytics.track('PRESCRIPTION_DOWNLOADED', 'prescription', prescription.id);
  // ... download logic
}
```

### 6. Family Member Selection

**In `family-member-selector.component.ts`:**

```typescript
async selectMember(member: FamilyMember) {
  this.analytics.track('FAMILY_MEMBER_SELECTED', 'profile', member.fullName, {
    relationship: member.relationshipToUser
  });

  this.globalFamilyMemberService.selectFamilyMember(member);
  this.closeModal();
}
```

### 7. Attachments/Documents

**In `attachment-list.page.ts`:**

```typescript
uploadDocument() {
  this.analytics.buttonClick('Upload Document', 'Attachments');
}

async fileUploaded(file: any) {
  this.analytics.track('DOCUMENT_UPLOADED', 'documents', file.name, {
    fileType: file.type,
    fileSize: file.size
  });
}

viewDocument(doc: any) {
  this.analytics.track('DOCUMENT_VIEWED', 'documents', doc.fileName);
}

deleteDocument(doc: any) {
  this.analytics.track('DOCUMENT_DELETED', 'documents', doc.fileName);
}
```

### 8. Chat (AI)

**In `chat.page.ts`:**

```typescript
ngOnInit() {
  this.analytics.track('CHAT_SESSION_STARTED', 'ai_chat', this.sessionId);
}

sendMessage(message: string) {
  this.analytics.track('CHAT_MESSAGE_SENT', 'ai_chat', 'User sent message');
}

receiveResponse(response: string) {
  this.analytics.track('CHAT_RESPONSE_RECEIVED', 'ai_chat');
}
```

---

## Backend Endpoint (Already Exists)

The backend endpoint `/api/auditTrail/batch` should handle incoming events.

**Update `backend/src/controllers/AuditTrailController.js`:**

```javascript
app.post(route + "/batch", async function (req, res, next) {
    try {
        const { events, sessionId } = req.body;

        if (!events || !Array.isArray(events)) {
            return ResponseHandler.error(res,
                new AppError(ErrorCodes.INVALID_INPUT, 'Events array required'));
        }

        // Prepare audit entries
        const auditEntries = events.map(e => ({
            event: e.event,
            category: e.category || 'user_action',
            details: e.details,
            referenceObject: e.metadata,
            sessionId: e.sessionId,
            userId: e.userId || req.user?._id,
            userName: e.userName || req.user?.firstName,
            phone: e.phone || req.user?.phone,
            page: e.page,
            ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            dateTime: new Date(e.timestamp || Date.now())
        }));

        // Bulk insert (fast!)
        await app.models.auditTrail.insertMany(auditEntries);

        return ResponseHandler.success(res, {
            saved: auditEntries.length
        });

    } catch (error) {
        console.error('Batch tracking error:', error);
        return ResponseHandler.error(res,
            new AppError(ErrorCodes.DATABASE_ERROR, error.message));
    }
});
```

**Update Model `backend/src/models/AuditTrail.js`:**

```javascript
var AuditTrailSchema = new mongoose.Schema({
    event: { type: String, required: true },
    category: { type: String, default: 'user_action' },
    sessionId: String,
    page: String,
    details: String,
    referenceObject: mongoose.Schema.Types.Mixed,
    userId: mongoose.Schema.ObjectId,
    userName: String,
    phone: String,
    ipAddress: String,
    dateTime: { type: Date, default: Date.now }
});

// Add indexes for performance
AuditTrailSchema.index({ userId: 1, dateTime: -1 });
AuditTrailSchema.index({ sessionId: 1 });
AuditTrailSchema.index({ event: 1, category: 1 });
```

---

## Testing

### 1. Check Console
Open browser console and look for:
```
[Analytics] Sent 20 events
```

### 2. Check Network Tab
Look for POST requests to `/api/auditTrail/batch`

### 3. Check Database
Query MongoDB:
```javascript
db.audit_trails.find().sort({ dateTime: -1 }).limit(10)
```

---

## Performance Notes

✅ **Zero UI blocking** - Events queued in memory
✅ **Batched sends** - Sends every 20 events or 10 seconds
✅ **Auto-retry** - Failed events stay in queue
✅ **Memory-safe** - Queue limited to 100 events
✅ **Session tracking** - All events have unique session ID

---

## Implementation Checklist

### Phase 1: Critical Flows ✅
- [x] Analytics service created
- [ ] Sign-in page tracking
- [ ] OTP verification tracking
- [ ] Appointment booking tracking
- [ ] Home page tracking

### Phase 2: Secondary Features
- [ ] EMR tracking
- [ ] Prescription tracking
- [ ] Family member tracking
- [ ] Document upload tracking
- [ ] Chat tracking

### Phase 3: Backend
- [ ] Update batch endpoint
- [ ] Update AuditTrail model
- [ ] Add database indexes
- [ ] Test end-to-end

---

## Quick Start (Next Steps)

1. **Add to Sign-In Page:**
   - Import AnalyticsService
   - Track OTP request/sent/failed

2. **Add to Home Page:**
   - Track page view
   - Track button clicks

3. **Add to Appointment Booking:**
   - Track booking opened
   - Track doctor selected
   - Track date selected
   - Track booking confirmed

4. **Update Backend:**
   - Add batch endpoint
   - Update model with sessionId field

5. **Test:**
   - Check console logs
   - Check network tab
   - Check database

---

## Support

For questions or issues, refer to:
- AnalyticsService: `frontend/src/services/analytics/analytics.service.ts`
- angulartics2 docs: https://github.com/angulartics/angulartics2

---

**Created:** 2025-11-11
**Author:** Development Team
