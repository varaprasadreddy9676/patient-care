# Comprehensive Implementation Guide: selectedFamilyMemberId Filtering

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Data Flow & Relationships](#data-flow--relationships)
3. [Implementation Strategy](#implementation-strategy)
4. [Endpoint-by-Endpoint Analysis](#endpoint-by-endpoint-analysis)
5. [Code Implementation Examples](#code-implementation-examples)
6. [Testing Guidelines](#testing-guidelines)
7. [Rollout Plan](#rollout-plan)

---

## Architecture Overview

### Key Concepts

**Three Types of IDs:**
- **`userId`**: The logged-in user's account ID (owner of the account)
- **`familyMemberId`**: Specific family member ID (could be the user themselves, spouse, child, parent, etc.)
- **`selectedFamilyMemberId`**: The family member currently selected in the UI (passed from frontend)

**Data Storage Patterns:**
1. **Local MongoDB Collections** - Store app-level data with direct `familyMemberId` reference
   - appointments
   - reminders
   - attachments
   - notifications (needs update)

2. **External Hospital Systems** - Store patient medical data with `patientId/MRN`
   - Accessed via `FamilyMemberHospitalAccount` collection which maps:
     - `userId` + `familyMemberId` → `hospitalCode` + `patientId` + `mrn`

### Critical Understanding: FamilyMemberHospitalAccount

```javascript
FamilyMemberHospitalAccount {
    userId: ObjectId,              // Owner of the account
    familyMemberId: ObjectId,      // Which family member
    hospitalCode: String,          // Which hospital
    patientId: String,             // Patient ID in hospital system
    mrn: String,                   // Medical Record Number
    hospitalName: String,
    hospitalId: ObjectId
}
```

**Example Scenario:**
- User "John" (userId: `111`) has account
- John adds wife "Mary" (familyMemberId: `222`)
- Mary visits Hospital A and gets registered → Creates FamilyMemberHospitalAccount:
  ```
  { userId: 111, familyMemberId: 222, hospitalCode: 'HOSP-A', patientId: 'P12345', mrn: 'MRN789' }
  ```
- When fetching Mary's prescriptions from Hospital A, we need:
  - `userId: 111` (to verify John has access)
  - `familyMemberId: 222` (to get only Mary's records)
  - This gives us `patientId: P12345` to query Hospital A's API

---

## Data Flow & Relationships

### Flow Diagram

```
Frontend UI
    ↓
  [User selects family member]
    ↓
API Request: ?userId=111&selectedFamilyMemberId=222
    ↓
Backend Routes
    ↓
┌─────────────────────────────────────────────────┐
│  Two Data Retrieval Patterns:                   │
├─────────────────────────────────────────────────┤
│  Pattern A: Local Collections                   │
│  └→ Direct Query with familyMemberId filter     │
│                                                  │
│  Pattern B: External Hospital Data              │
│  └→ Step 1: Query FamilyMemberHospitalAccount   │
│     - Filter: { userId, familyMemberId }        │
│     - Get: hospitalCode, patientId, mrn         │
│  └→ Step 2: Call Hospital API                   │
│     - Use: hospitalCode + patientId             │
│  └→ Step 3: Return enriched data                │
└─────────────────────────────────────────────────┘
```

---

## Implementation Strategy

### Complexity Categories

#### **🟢 SIMPLE (Complexity: 1/5)** - Direct MongoDB Filter
- **Characteristic**: Data stored locally with `familyMemberId` field already present
- **Change Required**: Add filter condition to existing query
- **Risk**: Very Low
- **Effort**: 5-10 minutes per endpoint

#### **🟡 MODERATE (Complexity: 2/5)** - Schema Update Required
- **Characteristic**: Data stored locally but missing `familyMemberId` field
- **Change Required**: Schema migration + query filter
- **Risk**: Medium (requires data migration consideration)
- **Effort**: 30-60 minutes

#### **🟠 COMPLEX (Complexity: 3/5)** - External Data with Multiple Hospital Accounts
- **Characteristic**: Data from external APIs via FamilyMemberHospitalAccount
- **Change Required**: Filter FamilyMemberHospitalAccount lookup, maintain external API calls
- **Risk**: Medium (need to handle multiple hospitals gracefully)
- **Effort**: 15-30 minutes per endpoint

#### **🔴 VERY COMPLEX (Complexity: 4/5)** - Cross-Document Relationships
- **Characteristic**: Data depends on other filtered resources
- **Change Required**: Ensure parent filtering cascades correctly
- **Risk**: High (logic dependencies)
- **Effort**: 1-2 hours

---

## Endpoint-by-Endpoint Analysis

### 🟢 Category A: SIMPLE - Direct Local Filtering

#### 1. **Appointments** - `/api/appointment`

**Complexity**: 🟢 Simple (1/5)

**Current State:**
- Uses `node-restful` with GET method
- Queries by `userId`
- Schema has: `userId` + `familyMemberId`

**Why Simple:**
- `familyMemberId` field already exists in schema
- Just need to add filter condition

**Implementation Approach:**
```javascript
// Option 1: Modify restful before hook (RECOMMENDED)
rest.before('get', function(req, res, next) {
    const selectedFamilyMemberId = req.query.selectedFamilyMemberId;

    if (selectedFamilyMemberId) {
        // Modify the query to include familyMemberId filter
        req.query.familyMemberId = selectedFamilyMemberId;
    }

    next();
});

// Option 2: Modify restful after hook (ALTERNATIVE)
rest.after('get', function(req, res, next) {
    let data = res.locals.bundle;
    const selectedFamilyMemberId = req.query.selectedFamilyMemberId;

    if (selectedFamilyMemberId && Array.isArray(data)) {
        data = data.filter(item =>
            item.familyMemberId &&
            item.familyMemberId.toString() === selectedFamilyMemberId
        );
    }

    return ResponseHandler.success(res, data);
});
```

**Smart Approach - Option 1 (Before Hook):**
✅ Filters at database level (faster)
✅ Reduces data transfer
✅ Works with pagination

**Files to Modify:**
- `src/controllers/AppointmentController.js` (lines 1130-1133)

**Related Endpoints to Update:**
- `/api/appointment/markasread` (line 846)
- `/api/appointment/unread` (line 876)

---

#### 2. **Reminders** - `/api/reminder`

**Complexity**: 🟢 Simple (1/5)

**Current State:**
- Direct MongoDB query
- Schema has: `userId` + `familyMemberId`

**Why Simple:**
- Field exists, straightforward query modification

**Implementation:**
```javascript
app.get(route, function (req, res, next) {
    var userId = req.query.userId;
    var selectedFamilyMemberId = req.query.selectedFamilyMemberId;

    const query = {
        'userId': mongoose.Types.ObjectId(userId),
        'active': true,
        'remindAt': { $gte: new Date() }
    };

    // Add family member filter if provided
    if (selectedFamilyMemberId) {
        query.familyMemberId = mongoose.Types.ObjectId(selectedFamilyMemberId);
    }

    Reminder.find(query, function (err, reminders) {
        if (err) {
            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message));
        }
        if (!reminders) {
            reminders = [];
        }
        return ResponseHandler.success(res, reminders);
    });
});
```

**Files to Modify:**
- `src/controllers/ReminderController.js` (line 15-39)
- `/api/reminder/markasread` (line 41-71)
- `/api/reminder/unread` (line 74-97)

---

#### 3. **Attachments** - `/api/attachment`

**Complexity**: 🟢 Simple (1/5)

**Current State:**
- Uses `node-restful`
- Schema has: `familyMemberId` (NO userId!)

**Why Simple:**
- Already has familyMemberId field
- Restful automatically supports query parameters

**Implementation:**
```javascript
// The restful endpoint already supports filtering via query params
// Frontend just needs to pass: /api/attachment?familyMemberId=<selectedFamilyMemberId>

// However, for security, we should verify the user owns this family member:
rest.before('get', function(req, res, next) {
    const selectedFamilyMemberId = req.query.familyMemberId || req.query.selectedFamilyMemberId;
    const userId = req.user.id; // From JWT token

    if (selectedFamilyMemberId) {
        // Verify this family member belongs to the logged-in user
        FamilyMember.findOne({
            _id: mongoose.Types.ObjectId(selectedFamilyMemberId),
            userId: mongoose.Types.ObjectId(userId)
        }, function(err, familyMember) {
            if (err || !familyMember) {
                return ResponseHandler.error(res,
                    new AppError(ErrorCodes.UNAUTHORIZED, 'Access denied to this family member'));
            }
            next();
        });
    } else {
        next();
    }
});
```

**Files to Modify:**
- `src/controllers/AttachmentController.js` (add security check at line 20-50)

---

### 🟡 Category B: MODERATE - Schema Update Required

#### 4. **Notifications** - `/api/notification`

**Complexity**: 🟡 Moderate (2/5)

**Current State:**
- Schema has: `userId` only
- Schema MISSING: `familyMemberId`

**Why Moderate:**
- Requires schema update
- Need to update all notification creation points
- May need data migration for existing records

**What Makes It Not Complex:**

**Step 1: Update Schema**
```javascript
// src/models/Notification.js - Add field
familyMemberId: {
    type: mongoose.Schema.ObjectId,
    required: false  // Optional for backward compatibility
}
```

**Step 2: Update All Notification Creation Points**

Search for all places that create notifications:
```bash
# Find all notification creation calls
grep -r "new Notification\|notificationService.scheduleNotification\|notificationService.sendNotification" src/
```

Update each to include familyMemberId:
```javascript
// Before
var notification = {
    'userId': appointment.userId,
    'objectId': appointment._id,
    'title': title,
    'message': message,
    // ...
};

// After
var notification = {
    'userId': appointment.userId,
    'familyMemberId': appointment.familyMemberId,  // ADD THIS
    'objectId': appointment._id,
    'title': title,
    'message': message,
    // ...
};
```

**Step 3: Update Query Endpoint**
```javascript
app.get(route, function (req, res, next) {
    var userId = req.query.userId;
    var selectedFamilyMemberId = req.query.selectedFamilyMemberId;

    const query = {
        userId: mongoose.Types.ObjectId(userId),
        status: { $ne: 'PENDING' }
    };

    // Add family member filter if provided
    if (selectedFamilyMemberId) {
        query.familyMemberId = mongoose.Types.ObjectId(selectedFamilyMemberId);
    }

    Notification.find(query, function (err, nots) {
        if (err) {
            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message));
        }
        return ResponseHandler.success(res, nots);
    });
});
```

**Files to Modify:**
- `src/models/Notification.js` - Add familyMemberId field
- `src/controllers/NotificationController.js` - Update query (line 16-35, 37-65, 67-90)
- `src/controllers/AppointmentController.js` - Update notification creation (lines 557-568, 939-956)
- `src/services/NotificationService.js` - Ensure familyMemberId is saved

**Data Migration Consideration:**
- Existing notifications without familyMemberId will still show (since field is optional)
- Option: Run migration script to populate familyMemberId from related appointments/reminders
- OR: Just handle null familyMemberId gracefully in queries

---

### 🟠 Category C: COMPLEX - External Hospital Data

#### 5. **Prescriptions** - `/api/prescription`

**Complexity**: 🟠 Complex (3/5)

**Current State:**
- Fetches from external hospital APIs
- Uses `FamilyMemberHospitalAccount` to get patientId
- Currently loops through ALL accounts for a userId

**Why Complex:**
- Multiple hospital accounts per user
- External API calls (potential failures)
- Need to aggregate data from multiple hospitals

**What Makes It Not Complex:**

**Smart Approach - Filter at FamilyMemberHospitalAccount Level**

```javascript
app.get(route, async (req, res) => {
    const { userId, selectedFamilyMemberId, activePrescription } = req.query;

    if (!userId) {
        return res.status(400).json({ message: "userId is required" });
    }

    try {
        // SMART CHANGE: Filter by familyMemberId at query level
        const query = { userId };
        if (selectedFamilyMemberId) {
            query.familyMemberId = selectedFamilyMemberId;
        }

        const accounts = await FamilyMemberHospitalAccount.find(query);

        if (!accounts || accounts.length === 0) {
            return res.status(200).json([]);
        }

        // Now fetch prescriptions only for the filtered accounts
        const prescriptions = await Promise.all(
            accounts.map(async (account) => {
                const { hospitalCode, patientId, familyMemberId } = account;

                const familyMember = await FamilyMember.findById(familyMemberId).exec();
                if (!familyMember) return null;

                const body = {
                    patientId,
                    activePrescription: activePrescription === "true",
                    fetchAll: true
                };

                const url = "/prescriptions";

                try {
                    const response = await httpService.doRequest(hospitalCode, "GET", url, body);

                    if (response && response.data) {
                        auditTrailService.log(
                            req,
                            auditTrailService.events.PRESCRIPTION_OPENED,
                            `Prescription opened for ${familyMember.fullName}`
                        );

                        return {
                            patientId,
                            familyMemberId,
                            familyMemberName: familyMember.fullName,
                            familyMemberGender: familyMember.gender,
                            hospitalCode,
                            prescription: response.data,
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching prescriptions for hospitalCode ${hospitalCode}:`, error.message);
                    return null;
                }
            })
        );

        res.status(200).json(prescriptions.filter((item) => item !== null));
    } catch (error) {
        console.error("Error fetching prescriptions:", error);
        res.status(500).json({ message: "Failed to fetch prescriptions", error: error.message });
    }
});
```

**Key Improvement:**
- **Before**: Loop through ALL user's family members' hospital accounts
- **After**: Loop through ONLY selected family member's hospital accounts
- **Performance**: Reduces API calls by N-1 where N = number of family members

**Files to Modify:**
- `src/controllers/PrescriptionController.js` (line 20-81)

---

#### 6. **Visits** - `/api/visit`

**Complexity**: 🟠 Complex (3/5)

**Current State:**
- Fetches from external hospital EMR APIs
- Uses callback-based pattern (older code style)
- Nested loops and callbacks

**Why Complex:**
- Callback hell structure
- Multiple async operations
- Data transformation required

**What Makes It Not Complex:**

**Smart Approach - Modernize + Filter**

```javascript
app.get(route, async function(req, res, next) {
    const { userId, selectedFamilyMemberId } = req.query;

    if (!userId) {
        return ResponseHandler.error(res, new AppError(ErrorCodes.VALIDATION_ERROR, 'userId is required'));
    }

    try {
        // SMART CHANGE: Filter at query level
        const query = { userId };
        if (selectedFamilyMemberId) {
            query.familyMemberId = selectedFamilyMemberId;
        }

        const familyMemberHospitalAccounts = await FamilyMemberHospitalAccount.find(query).exec();

        if (!familyMemberHospitalAccounts || familyMemberHospitalAccounts.length === 0) {
            return ResponseHandler.success(res, []);
        }

        const visits = [];

        // Process each account
        for (const fmha of familyMemberHospitalAccounts) {
            const { hospitalCode, patientId, familyMemberId } = fmha;

            // Get family member details
            const familyMember = await FamilyMember.findById(familyMemberId).exec();
            if (!familyMember) continue;

            const body = { patientId };
            const url = '/emr';

            try {
                // Convert callback-based httpService to Promise
                const response = await new Promise((resolve, reject) => {
                    httpService.doGet(hospitalCode, url, body, resolve, reject);
                });

                if (response && response.data && response.data.visit) {
                    response.data.visit.forEach((visit) => {
                        const pastDatedVisit = isPastDate(visit.visitDate, visit.visitTime);

                        visits.push({
                            familyMemberId: familyMemberId,
                            familyMemberName: familyMember.fullName,
                            familyMemberGender: familyMember.gender,
                            familyMemberDOB: familyMember.dob,
                            patientId: patientId,
                            hospitalCode: hospitalCode,
                            visitId: visit.visitId,
                            visitNumber: visit.visitNumber,
                            visitDate: visit.visitDate,
                            visitTime: visit.visitTime,
                            visitType: visit.visitType,
                            doctorName: visit.doctorName,
                            specialityName: visit.specialityName,
                            consultationCharge: visit.consultationCharge,
                            pastDatedVisit: pastDatedVisit
                        });
                    });
                }

                auditTrailService.log(req, auditTrailService.events.VISIT_FETCHED,
                    `Visit Records fetched for ${familyMember.fullName}`);

            } catch (error) {
                console.error(`Error fetching visits for hospital ${hospitalCode}:`, error);
                auditTrailService.log(req, auditTrailService.events.FAILED_IN_FETCHING_VISIT,
                    `Failed to get Visit Records for patient ${patientId}`);
            }
        }

        // Sort visits by date (most recent first)
        visits.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

        return ResponseHandler.success(res, visits);

    } catch (error) {
        console.error('Error fetching visits:', error);
        return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, error.message));
    }
});

function isPastDate(visitDate, visitTime) {
    const vDate = new Date(visitDate);
    const vTime = visitTime ? visitTime.split(':') : ['00', '00'];
    vDate.setHours(parseInt(vTime[0]), parseInt(vTime[1]));
    return vDate < new Date();
}
```

**Key Improvements:**
1. **Filter at source** - Query FamilyMemberHospitalAccount with familyMemberId
2. **Modernize code** - Use async/await instead of callbacks
3. **Error handling** - Better try-catch blocks
4. **Performance** - Fewer API calls

**Files to Modify:**
- `src/controllers/VisitController.js` (line 62-159)

---

#### 7. **Bills** - `/api/bill`

**Complexity**: 🟠 Complex (3/5)

**Current State:**
- Already using async/await (modern)
- Fetches from external hospital billing APIs
- Handles date range filtering

**Why Complex:**
- Multiple hospital accounts
- External API dependencies
- Complex data aggregation

**What Makes It Not Complex:**

**Smart Approach - Already Good Structure, Just Add Filter**

```javascript
app.get(route, async (req, res) => {
    const { userId, selectedFamilyMemberId, status, fromDate, toDate } = req.query;

    // Validate required parameters
    if (!fromDate || !toDate) {
        return res.status(400).json({ message: "fromDate and toDate are required" });
    }

    try {
        const formatDateTime = (date, time) => `${date} ${time}`;
        const fromDateTime = formatDateTime(fromDate, "00:00:00");
        const toDateTime = formatDateTime(toDate, "23:59:59");

        // SMART CHANGE: Filter at query level
        const query = { userId };
        if (selectedFamilyMemberId) {
            query.familyMemberId = selectedFamilyMemberId;
        }

        const accounts = await FamilyMemberHospitalAccount.find(query);

        if (!accounts || accounts.length === 0) {
            return res.status(200).json([]);
        }

        const bills = [];

        // Process each account sequentially
        for (const account of accounts) {
            const { hospitalCode, patientId, familyMemberId, hospitalName } = account;

            const familyMember = await FamilyMember.findById(familyMemberId).exec();
            if (!familyMember) {
                console.warn(`Family member not found for ID: ${familyMemberId}`);
                continue;
            }

            const hospital = await Hospital.findOne({ code: hospitalCode }).exec();
            if (!hospital) {
                console.warn(`Hospital not found for code: ${hospitalCode}`);
                continue;
            }

            const body = {
                patientId,
                entityCode: hospitalCode,
                fromDateTime,
                toDateTime,
                status,
            };

            try {
                const url = "/bills";
                const response = await httpService.doRequest(hospitalCode, "GET", url, body);

                if (response && response.data && response.data.bills) {
                    bills.push({
                        patientId,
                        familyMemberId,
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
```

**Key Point:**
- Code structure is already good
- Only need to add 3 lines for filtering
- Very minimal change required

**Files to Modify:**
- `src/controllers/BillController.js` (line 23-100)

---

### 📋 Category D: Context-Based (No Direct Changes Needed)

These endpoints are accessed through parent resources (visits/appointments) and inherit the family member context:

#### 8. **EMR** - `/api/emr`
- **Access Pattern**: Requires `hospitalCode` + `patientId` + `visitId`
- **Parent Resource**: Visits (already filtered)
- **Change Required**: None (inherits from visit filtering)

#### 9. **Lab Reports** - `/api/labReports`
- **Access Pattern**: Requires `hospitalCode` + `patientId` + `visitId`
- **Parent Resource**: Visits (already filtered)
- **Change Required**: None

#### 10. **Discharge Summary** - `/api/dischargeSummary`
- **Access Pattern**: Requires `hospitalCode` + `patientId` + `visitId`
- **Parent Resource**: Visits (already filtered)
- **Change Required**: None

#### 11. **Receipt** - `/api/receipt`
- **Access Pattern**: Requires `hospitalCode` + `receiptId`
- **Parent Resource**: Appointments/Bills (already filtered)
- **Change Required**: None

---

## Code Implementation Examples

### Pattern 1: Simple Local Collection Filter (MongoDB)

**Use For:** Appointments, Reminders, Attachments

```javascript
// Generic pattern for any local collection with familyMemberId
app.get(route, async function(req, res) {
    const { userId, selectedFamilyMemberId } = req.query;

    // Build query
    const query = {
        userId: mongoose.Types.ObjectId(userId),
        active: true  // Add any other default filters
    };

    // Add optional family member filter
    if (selectedFamilyMemberId) {
        query.familyMemberId = mongoose.Types.ObjectId(selectedFamilyMemberId);
    }

    try {
        const results = await Model.find(query).exec();
        return ResponseHandler.success(res, results);
    } catch (error) {
        return ResponseHandler.error(res,
            new AppError(ErrorCodes.DATABASE_ERROR, error.message));
    }
});
```

---

### Pattern 2: External Hospital Data Filter (via FamilyMemberHospitalAccount)

**Use For:** Prescriptions, Visits, Bills

```javascript
// Generic pattern for external hospital data
app.get(route, async function(req, res) {
    const { userId, selectedFamilyMemberId, ...otherParams } = req.query;

    // Validate
    if (!userId) {
        return ResponseHandler.error(res,
            new AppError(ErrorCodes.VALIDATION_ERROR, 'userId is required'));
    }

    try {
        // Step 1: Filter FamilyMemberHospitalAccount
        const query = { userId };
        if (selectedFamilyMemberId) {
            query.familyMemberId = selectedFamilyMemberId;
        }

        const accounts = await FamilyMemberHospitalAccount.find(query).exec();

        if (!accounts || accounts.length === 0) {
            return ResponseHandler.success(res, []);
        }

        // Step 2: Fetch data from each hospital
        const results = [];

        for (const account of accounts) {
            const { hospitalCode, patientId, familyMemberId } = account;

            // Get family member details
            const familyMember = await FamilyMember.findById(familyMemberId).exec();
            if (!familyMember) continue;

            // Prepare API request
            const body = {
                patientId,
                ...otherParams  // Pass through other query params
            };

            try {
                // Call external hospital API
                const response = await httpService.doRequest(
                    hospitalCode,
                    "GET",
                    "/api-endpoint",
                    body
                );

                if (response && response.data) {
                    results.push({
                        patientId,
                        familyMemberId,
                        familyMemberName: familyMember.fullName,
                        hospitalCode,
                        data: response.data
                    });
                }
            } catch (error) {
                console.error(`Error fetching from ${hospitalCode}:`, error.message);
                // Continue to next hospital
            }
        }

        return ResponseHandler.success(res, results);

    } catch (error) {
        console.error('Error:', error);
        return ResponseHandler.error(res,
            new AppError(ErrorCodes.DATABASE_ERROR, error.message));
    }
});
```

---

### Pattern 3: Node-Restful Filter (Before Hook)

**Use For:** Any controller using node-restful

```javascript
// Before hook - filters at DB level (RECOMMENDED)
rest.before('get', function(req, res, next) {
    const selectedFamilyMemberId = req.query.selectedFamilyMemberId;

    if (selectedFamilyMemberId) {
        // Add to query - restful will handle the rest
        req.query.familyMemberId = selectedFamilyMemberId;
    }

    // Clean up so it doesn't appear in response
    delete req.query.selectedFamilyMemberId;

    next();
});
```

---

### Pattern 4: Mark as Read with Family Member Filter

**Use For:** markasread endpoints

```javascript
app.get(route + "/markasread", async function(req, res) {
    const { userId, selectedFamilyMemberId } = req.query;

    const query = {
        userId: mongoose.Types.ObjectId(userId),
        read: false
    };

    // Add family member filter if provided
    if (selectedFamilyMemberId) {
        query.familyMemberId = mongoose.Types.ObjectId(selectedFamilyMemberId);
    }

    try {
        const items = await Model.find(query).exec();

        if (items.length > 0) {
            // Update all to read
            await Model.updateMany(
                query,
                { $set: { read: true } }
            );
        }

        auditTrailService.log(req, auditTrailService.events.MARKED_AS_READ,
            `Marked ${items.length} items as read`);

        return ResponseHandler.success(res, null,
            `Marked ${items.length} items as read`);

    } catch (error) {
        return ResponseHandler.error(res,
            new AppError(ErrorCodes.DATABASE_ERROR, error.message));
    }
});
```

---

### Pattern 5: Unread Count with Family Member Filter

**Use For:** unread count endpoints

```javascript
app.get(route + "/unread", async function(req, res) {
    const { userId, selectedFamilyMemberId } = req.query;

    const query = {
        userId: mongoose.Types.ObjectId(userId),
        read: false,
        active: true
    };

    // Add family member filter if provided
    if (selectedFamilyMemberId) {
        query.familyMemberId = mongoose.Types.ObjectId(selectedFamilyMemberId);
    }

    try {
        const count = await Model.countDocuments(query).exec();

        return ResponseHandler.success(res, { count });

    } catch (error) {
        return ResponseHandler.error(res,
            new AppError(ErrorCodes.DATABASE_ERROR, error.message));
    }
});
```

---

## Testing Guidelines

### Unit Testing Checklist

For each endpoint modified, test:

#### ✅ Basic Functionality
- [ ] Without `selectedFamilyMemberId` - returns all family members' data
- [ ] With `selectedFamilyMemberId` - returns only that family member's data
- [ ] With invalid `selectedFamilyMemberId` - returns empty array or error
- [ ] With `selectedFamilyMemberId` not belonging to user - returns 401/403

#### ✅ Edge Cases
- [ ] User with no family members
- [ ] User with multiple family members
- [ ] Family member with no data
- [ ] Family member with data in multiple hospitals

#### ✅ Performance
- [ ] Response time with filter vs without filter
- [ ] Database query count (should not increase)
- [ ] External API call count (should decrease with filter)

### Integration Testing

```javascript
// Example test case
describe('GET /api/appointment', () => {
    it('should filter appointments by selectedFamilyMemberId', async () => {
        const userId = 'user123';
        const familyMember1 = 'family1';
        const familyMember2 = 'family2';

        // Create test data
        await Appointment.create([
            { userId, familyMemberId: familyMember1, /* ... */ },
            { userId, familyMemberId: familyMember2, /* ... */ }
        ]);

        // Test without filter - should return both
        const res1 = await request(app)
            .get('/api/appointment')
            .query({ userId });
        expect(res1.body.data.length).toBe(2);

        // Test with filter - should return one
        const res2 = await request(app)
            .get('/api/appointment')
            .query({ userId, selectedFamilyMemberId: familyMember1 });
        expect(res2.body.data.length).toBe(1);
        expect(res2.body.data[0].familyMemberId).toBe(familyMember1);
    });
});
```

---

## Rollout Plan

### Phase 1: Simple Endpoints (Week 1)
**Goal**: Get quick wins, validate approach

1. ✅ Attachments (already works, just document)
2. ✅ Reminders (simple query change)
3. ✅ Appointments (restful before hook)

**Testing**: Full regression on these 3 endpoints

---

### Phase 2: External Data Endpoints (Week 2)
**Goal**: Handle complex external data sources

4. ✅ Prescriptions
5. ✅ Visits
6. ✅ Bills

**Testing**:
- Test with multiple family members
- Test with multiple hospitals per family member
- Performance testing

---

### Phase 3: Notifications (Week 3)
**Goal**: Handle schema changes carefully

7. ✅ Update Notification schema
8. ✅ Update notification creation in AppointmentController
9. ✅ Update NotificationService
10. ✅ Update notification query endpoints

**Testing**:
- Backward compatibility with existing notifications
- New notifications have familyMemberId
- Filter works correctly

---

### Phase 4: Related Endpoints (Week 4)
**Goal**: Complete the implementation

11. ✅ All "markasread" endpoints
12. ✅ All "unread" endpoints
13. ✅ Security validation (user owns family member)

**Testing**:
- End-to-end testing
- Load testing
- Security testing

---

## Security Considerations

### Important: Always Validate Ownership

```javascript
// Add this middleware to verify user owns the family member
async function validateFamilyMemberAccess(req, res, next) {
    const userId = req.user.id; // From JWT
    const selectedFamilyMemberId = req.query.selectedFamilyMemberId;

    if (selectedFamilyMemberId) {
        try {
            const familyMember = await FamilyMember.findOne({
                _id: mongoose.Types.ObjectId(selectedFamilyMemberId),
                userId: mongoose.Types.ObjectId(userId)
            }).exec();

            if (!familyMember) {
                return ResponseHandler.error(res,
                    new AppError(ErrorCodes.UNAUTHORIZED,
                        'You do not have access to this family member'));
            }
        } catch (error) {
            return ResponseHandler.error(res,
                new AppError(ErrorCodes.DATABASE_ERROR, error.message));
        }
    }

    next();
}

// Use in routes
app.get(route, validateFamilyMemberAccess, async function(req, res) {
    // ... your endpoint logic
});
```

---

## Best Practices Summary

### ✅ DO's

1. **Filter at Query Level** - Not in application code
   ```javascript
   // GOOD
   const query = { userId, familyMemberId };
   Model.find(query);

   // BAD
   const all = await Model.find({ userId });
   const filtered = all.filter(item => item.familyMemberId === selectedFamilyMemberId);
   ```

2. **Make Filter Optional** - Support backward compatibility
   ```javascript
   if (selectedFamilyMemberId) {
       query.familyMemberId = selectedFamilyMemberId;
   }
   ```

3. **Validate Ownership** - Security first
   ```javascript
   // Ensure user owns this family member before querying
   ```

4. **Use async/await** - Modernize callback-based code
   ```javascript
   // GOOD
   const result = await Model.find(query).exec();

   // BAD
   Model.find(query, function(err, result) { ... });
   ```

5. **Handle Errors Gracefully** - Don't let one hospital failure break all
   ```javascript
   for (const account of accounts) {
       try {
           // fetch data
       } catch (error) {
           console.error(error);
           continue; // Continue to next account
       }
   }
   ```

### ❌ DON'Ts

1. **Don't Break Backward Compatibility** - Apps may not send selectedFamilyMemberId initially

2. **Don't Fetch All Then Filter** - Waste of resources

3. **Don't Ignore Security** - Always validate user owns family member

4. **Don't Mix Concerns** - Keep filtering logic separate from business logic

5. **Don't Hardcode** - Use constants for error messages, event names, etc.

---

## Performance Impact Analysis

### Before Implementation (Current State)

**Example: User with 4 family members, each registered at 2 hospitals**

```
Request: GET /api/prescription?userId=123

Backend Processing:
├─ Query FamilyMemberHospitalAccount → Returns 8 records (4 members × 2 hospitals)
├─ Loop through 8 accounts
│  ├─ Fetch from Hospital A for Member 1
│  ├─ Fetch from Hospital B for Member 1
│  ├─ Fetch from Hospital A for Member 2
│  ├─ Fetch from Hospital B for Member 2
│  ├─ Fetch from Hospital A for Member 3
│  ├─ Fetch from Hospital B for Member 3
│  ├─ Fetch from Hospital A for Member 4
│  └─ Fetch from Hospital B for Member 4
└─ Total: 8 external API calls

Response Time: ~3-4 seconds
```

### After Implementation

```
Request: GET /api/prescription?userId=123&selectedFamilyMemberId=member2

Backend Processing:
├─ Query FamilyMemberHospitalAccount → Returns 2 records (1 member × 2 hospitals)
├─ Loop through 2 accounts
│  ├─ Fetch from Hospital A for Member 2
│  └─ Fetch from Hospital B for Member 2
└─ Total: 2 external API calls

Response Time: ~0.5-1 second

Performance Improvement: 75% faster
```

### Database Query Optimization

**Before:**
```javascript
// Fetches all records then filters in code
const all = await Model.find({ userId });
const filtered = all.filter(item => item.familyMemberId === id);
```

**After:**
```javascript
// Filters at database level using index
const filtered = await Model.find({ userId, familyMemberId: id });
```

**Impact:**
- Uses database index on familyMemberId
- Reduces data transfer from DB to app
- Reduces memory usage in Node.js process

---

## Summary Table

| Endpoint | Complexity | Effort | Files | Critical |
|----------|-----------|---------|-------|----------|
| Appointments | 🟢 Simple | 15 min | AppointmentController.js | ⭐⭐⭐ |
| Reminders | 🟢 Simple | 10 min | ReminderController.js | ⭐⭐⭐ |
| Attachments | 🟢 Simple | 5 min | AttachmentController.js | ⭐⭐ |
| Prescriptions | 🟠 Complex | 20 min | PrescriptionController.js | ⭐⭐⭐ |
| Visits | 🟠 Complex | 30 min | VisitController.js | ⭐⭐⭐ |
| Bills | 🟠 Complex | 15 min | BillController.js | ⭐⭐⭐ |
| Notifications | 🟡 Moderate | 60 min | NotificationController.js, Notification.js, AppointmentController.js | ⭐⭐ |
| EMR | N/A | 0 min | None | - |
| Lab Reports | N/A | 0 min | None | - |
| Discharge Summary | N/A | 0 min | None | - |
| Receipt | N/A | 0 min | None | - |

**Total Estimated Effort**: 2.5 hours of actual coding + testing time

---

## Conclusion

The implementation is **straightforward and low-risk** when following this guide:

1. **Simple endpoints** (Appointments, Reminders, Attachments) - Just add query filter
2. **External data endpoints** (Prescriptions, Visits, Bills) - Filter FamilyMemberHospitalAccount lookup
3. **Notifications** - Requires schema update but well-documented approach
4. **Context-based endpoints** - No changes needed

**Key Success Factors:**
- Filter at the earliest point (database query, not application code)
- Make filters optional for backward compatibility
- Always validate user owns the family member (security)
- Handle errors gracefully (don't let one failure break all)
- Test thoroughly with multiple family members and hospitals

**Performance Benefits:**
- 75%+ reduction in external API calls
- Faster response times
- Better user experience
- Reduced server load
