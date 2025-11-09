# CleverTap Integration Plan for MedicsCare

## Overview
This document outlines the complete plan for integrating CleverTap SDK while maintaining the ability to switch back to the custom advertisement component or use both simultaneously.

---

## 1. CleverTap SDK Capabilities

### 1.1 Web SDK Features (For Web App)
- **Analytics & User Tracking**
  - Event tracking
  - User profile management
  - Session tracking
  - User identification

- **Engagement Channels**
  - Web Push Notifications (Chrome, Firefox, Safari)
  - Web Pop-ups and Exit Intent
  - Web Native Display (Personalized banners, carousels, custom HTML)
  - Web Inbox (In-app message center)

- **Personalization**
  - Dynamic content based on user behavior
  - A/B testing
  - User segmentation
  - Remote configuration

- **Privacy & Compliance**
  - GDPR compliance settings
  - Privacy controls (opt-out, IP data sharing)
  - Cookie consent management

### 1.2 Mobile SDK Features (For Android/iOS via Capacitor)
- **Push Notifications**
  - Native push notifications for iOS and Android
  - Rich media notifications
  - Deep linking support
  - Push primer (soft ask)

- **In-App Messaging**
  - Interstitials
  - Half-interstitials
  - Alerts
  - Custom templates

- **App Inbox**
  - Message center within the app
  - Read/unread status
  - Rich media support

- **Analytics**
  - Event tracking
  - Screen tracking
  - User properties
  - Custom attributes

- **Personalization**
  - Product Config (remote configuration)
  - Feature Flags
  - Dynamic variables
  - User segmentation

- **Advanced Features**
  - Geofencing
  - Deep linking
  - Attribution tracking
  - Lifecycle events

---

## 2. Integration Architecture

### 2.1 Design Pattern: Strategy Pattern + Adapter Pattern

```
┌─────────────────────────────────────────────────────┐
│         AdvertisementManagerService                  │
│  (Manages which provider to use)                     │
└────────────────────┬────────────────────────────────┘
                     │
                     │ uses
                     ▼
┌─────────────────────────────────────────────────────┐
│       IAdvertisementProvider (Interface)             │
│  - loadAdvertisements()                              │
│  - trackView()                                       │
│  - trackClick()                                      │
│  - initialize()                                      │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌────────────────────┐
│ CustomAdProvider│    │CleverTapAdProvider │
│ (Existing)      │    │   (New)            │
└─────────────────┘    └────────────────────┘
```

### 2.2 Component Architecture

```
┌──────────────────────────────────────────┐
│   Advertisement Component (UI Layer)      │
│   - Display ads                           │
│   - Handle user interactions              │
└──────────────────┬───────────────────────┘
                   │
                   │ uses
                   ▼
┌──────────────────────────────────────────┐
│   AdvertisementManagerService             │
│   - Provider selection logic              │
│   - Fallback handling                     │
└──────────────────┬───────────────────────┘
                   │
                   │ delegates to
                   ▼
┌──────────────────────────────────────────┐
│   Active Provider (Custom or CleverTap)  │
└──────────────────────────────────────────┘
```

---

## 3. Implementation Roadmap

### Phase 1: Setup & Configuration (2-3 days)

#### 3.1 Install Dependencies
```bash
# For Web SDK
npm install clevertap-web-sdk

# For Mobile (Cordova plugin with Capacitor)
npm install @awesome-cordova-plugins/clevertap
npm install https://github.com/CleverTap/clevertap-cordova.git
npx cap sync
```

#### 3.2 Environment Configuration
Add to `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  BASE_URL: 'http://localhost:3081',
  HOSPITAL_ID: null,
  APP_ID: 'medics',

  // CleverTap Configuration
  cleverTap: {
    enabled: false, // Toggle to enable/disable CleverTap
    accountId: 'YOUR_CLEVERTAP_ACCOUNT_ID',
    token: 'YOUR_CLEVERTAP_TOKEN',
    region: 'in1', // or 'eu1', 'us1', 'sg1', 'mec1', 'aps3'
    debugLevel: 3, // 0 = off, 3 = verbose
  },

  // Advertisement Provider Selection
  advertisement: {
    provider: 'custom', // 'custom' | 'clevertap' | 'hybrid'
    fallbackToCustom: true, // Fallback if CleverTap fails
  },
};
```

#### 3.3 CleverTap Initialization

**For Web:**
Create `src/services/clevertap/clevertap-web.service.ts`

**For Mobile:**
Update `capacitor.config.ts` with CleverTap plugin config

---

### Phase 2: Service Layer Implementation (3-4 days)

#### 4.1 Create Abstraction Interface
File: `src/services/advertisement/advertisement-provider.interface.ts`

```typescript
export interface IAdvertisementProvider {
  initialize(): Promise<void>;
  loadAdvertisements(config?: AdvertisementConfig): Promise<Advertisement[]>;
  trackAdvertisementView(ad: Advertisement): void;
  trackAdvertisementClick(ad: Advertisement): void;
  isReady(): boolean;
}
```

#### 4.2 Update Custom Provider
File: `src/services/advertisement/custom-advertisement-provider.service.ts`
- Extract logic from existing AdvertisementService
- Implement IAdvertisementProvider interface

#### 4.3 Create CleverTap Provider
File: `src/services/advertisement/clevertap-advertisement-provider.service.ts`
- Implement IAdvertisementProvider interface
- Wrap CleverTap SDK calls
- Transform CleverTap campaigns to Advertisement interface

#### 4.4 Create Manager Service
File: `src/services/advertisement/advertisement-manager.service.ts`
- Provider selection logic
- Fallback handling
- Error recovery

---

### Phase 3: CleverTap SDK Integration (4-5 days)

#### 5.1 Web SDK Integration

**Step 1: Add to index.html**
```html
<script>
  var clevertap = {
    event:[],
    profile:[],
    account:[],
    onUserLogin:[],
    notifications:[],
    privacy:[]
  };
  clevertap.account.push({
    "id": "YOUR_ACCOUNT_ID",
    "region": "in1"
  });

  (function () {
    var wzrk = document.createElement('script');
    wzrk.type = 'text/javascript';
    wzrk.async = true;
    wzrk.src = 'https://d2r1yp2w7bby2u.cloudfront.net/js/clevertap.min.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wzrk, s);
  })();
</script>
```

**Step 2: Create CleverTap Web Service**
File: `src/services/clevertap/clevertap-web.service.ts`

**Step 3: Web Native Display Setup**
- Define rendering functions for personalization
- Add event listeners for campaign triggers
- Implement custom rendering logic

#### 5.2 Mobile SDK Integration (Capacitor)

**Step 1: Android Configuration**
File: `android/app/src/main/AndroidManifest.xml`
```xml
<meta-data
  android:name="CLEVERTAP_ACCOUNT_ID"
  android:value="YOUR_ACCOUNT_ID"/>
<meta-data
  android:name="CLEVERTAP_TOKEN"
  android:value="YOUR_TOKEN"/>
<meta-data
  android:name="CLEVERTAP_REGION"
  android:value="in1"/>
```

**Step 2: iOS Configuration**
File: `ios/App/App/Info.plist`
```xml
<key>CleverTapAccountID</key>
<string>YOUR_ACCOUNT_ID</string>
<key>CleverTapToken</key>
<string>YOUR_TOKEN</string>
<key>CleverTapRegion</key>
<string>in1</string>
```

**Step 3: Create CleverTap Mobile Service**
File: `src/services/clevertap/clevertap-mobile.service.ts`

**Step 4: Initialize in App Component**
File: `src/app/app.component.ts`

---

### Phase 4: Push Notifications Setup (3-4 days)

#### 6.1 Web Push Notifications

**Requirements:**
- HTTPS domain
- VAPID keys (generate using web-push npm package)
- Service worker file

**Steps:**
1. Generate VAPID keys
2. Upload keys to CleverTap dashboard
3. Add service worker: `src/clevertap_sw.js`
4. Request push permissions
5. Handle push notification events

#### 6.2 Mobile Push Notifications

**Android:**
- Firebase Cloud Messaging (FCM) setup
- Add google-services.json
- Configure FCM sender ID in CleverTap dashboard

**iOS:**
- Apple Push Notification service (APNs) setup
- Upload APNs certificate to CleverTap dashboard
- Request push permissions

---

### Phase 5: User Profile & Analytics (2-3 days)

#### 7.1 User Identification
Integrate with existing authentication service:

File: `src/services/authentication/authentication.service.ts`
```typescript
// On successful login
this.cleverTapService.onUserLogin({
  Identity: user.id,
  Name: user.name,
  Email: user.email,
  Phone: user.phone,
  Gender: user.gender,
  DOB: user.dob,
  // Custom properties
  'Patient Type': user.patientType,
  'Registration Date': user.registrationDate,
});
```

#### 7.2 Event Tracking
Track key user actions:
- Appointment booked
- Prescription viewed
- Bill paid
- Document uploaded
- Profile updated

#### 7.3 Screen Tracking
Automatically track page views in navigation service

---

### Phase 6: Feature Implementation (5-6 days)

#### 8.1 Web Native Display Implementation
- Banner campaigns
- Carousel campaigns
- Custom HTML campaigns
- Key-value pair templates

#### 8.2 App Inbox
- Create inbox UI component
- Integrate with CleverTap App Inbox API
- Show unread count badge

#### 8.3 Product Config / Feature Flags
- Remote configuration for app features
- A/B testing setup
- Dynamic feature toggling

#### 8.4 Deep Linking
- Handle deep links from push notifications
- Route to specific pages based on campaign

---

### Phase 7: Testing & Validation (3-4 days)

#### 9.1 Testing Checklist

**Web Testing:**
- [ ] SDK initialization
- [ ] User profile tracking
- [ ] Event tracking
- [ ] Web push permissions
- [ ] Web Native Display campaigns
- [ ] Pop-ups and exit intent
- [ ] Web inbox

**Mobile Testing (Android):**
- [ ] SDK initialization
- [ ] Push notifications
- [ ] In-app messages
- [ ] App inbox
- [ ] Deep linking
- [ ] Product config
- [ ] Feature flags

**Mobile Testing (iOS):**
- [ ] SDK initialization
- [ ] Push notifications
- [ ] In-app messages
- [ ] App inbox
- [ ] Deep linking
- [ ] Product config
- [ ] Feature flags

**Provider Switching:**
- [ ] Switch from custom to CleverTap
- [ ] Switch from CleverTap to custom
- [ ] Hybrid mode (both providers)
- [ ] Fallback on CleverTap failure
- [ ] Graceful degradation

#### 9.2 Test Devices
Configure test devices in CleverTap dashboard for testing campaigns

---

## 4. File Structure

```
src/
├── services/
│   ├── advertisement/
│   │   ├── advertisement-provider.interface.ts      # NEW
│   │   ├── advertisement-manager.service.ts         # NEW
│   │   ├── custom-advertisement-provider.service.ts # REFACTORED
│   │   ├── clevertap-advertisement-provider.service.ts # NEW
│   │   └── advertisement.service.ts                 # DEPRECATED (keep for backward compat)
│   │
│   ├── clevertap/
│   │   ├── clevertap.service.ts                     # NEW - Main service
│   │   ├── clevertap-web.service.ts                 # NEW - Web specific
│   │   ├── clevertap-mobile.service.ts              # NEW - Mobile specific
│   │   ├── clevertap-user.service.ts                # NEW - User profiles
│   │   ├── clevertap-events.service.ts              # NEW - Event tracking
│   │   ├── clevertap-push.service.ts                # NEW - Push notifications
│   │   ├── clevertap-inbox.service.ts               # NEW - App inbox
│   │   ├── clevertap-config.service.ts              # NEW - Product config/flags
│   │   └── clevertap.types.ts                       # NEW - TypeScript interfaces
│   │
│   └── authentication/
│       └── authentication.service.ts                # UPDATE - Add CleverTap integration
│
├── shared/
│   ├── components/
│   │   ├── advertisement/
│   │   │   ├── advertisement.component.ts           # UPDATE - Use manager service
│   │   │   ├── advertisement.component.html
│   │   │   └── advertisement.component.scss
│   │   │
│   │   └── clevertap-inbox/                         # NEW
│   │       ├── clevertap-inbox.component.ts
│   │       ├── clevertap-inbox.component.html
│   │       └── clevertap-inbox.component.scss
│   │
│   └── types/
│       ├── advertisement.interface.ts               # EXISTING
│       └── clevertap.interface.ts                   # NEW
│
├── environments/
│   ├── environment.ts                               # UPDATE - Add CleverTap config
│   └── environment.prod.ts                          # UPDATE - Add CleverTap config
│
├── app/
│   └── app.component.ts                             # UPDATE - Initialize CleverTap
│
└── assets/
    └── clevertap_sw.js                              # NEW - Service worker for web push
```

---

## 5. API Integration Points

### 5.1 Backend Changes Required

If you want to manage CleverTap campaigns from your backend:

**New API Endpoints:**
```
GET  /api/clevertap/config          # Get CleverTap configuration
POST /api/clevertap/user/profile    # Sync user profile
POST /api/clevertap/events          # Track events via backend
GET  /api/advertisements/active     # Get active campaigns (custom or CT)
```

**Database Schema:**
```sql
-- Track which provider is active per user/session
CREATE TABLE advertisement_providers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  provider VARCHAR(50), -- 'custom' | 'clevertap'
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Store custom advertisement data
CREATE TABLE advertisements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  message TEXT,
  category VARCHAR(100),
  provider VARCHAR(50), -- 'custom' | 'clevertap'
  external_id VARCHAR(255), -- CleverTap campaign ID if applicable
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. Migration Strategy

### 6.1 Phased Rollout

**Week 1-2: Development & Internal Testing**
- Complete Phase 1-3
- Test with development environment
- Use test devices only

**Week 3: Beta Testing**
- Deploy to staging environment
- Enable CleverTap for 10% of users
- Monitor errors and performance

**Week 4: Gradual Rollout**
- 25% of users
- 50% of users
- 75% of users
- 100% rollout

**Week 5: Monitoring & Optimization**
- Monitor CleverTap analytics
- Compare with custom ad performance
- Optimize campaigns

### 6.2 Rollback Plan

If CleverTap integration fails:

1. **Immediate Rollback:**
   ```typescript
   // In environment.ts
   advertisement: {
     provider: 'custom', // Switch back
     fallbackToCustom: true,
   }
   ```

2. **Code-level Fallback:**
   The AdvertisementManagerService will automatically fall back to custom provider if CleverTap fails to initialize

3. **Remove CleverTap:**
   - Set `cleverTap.enabled = false` in environment
   - Custom component continues to work independently

---

## 7. Cost Considerations

### 7.1 CleverTap Pricing Tiers
- **Free Tier:** Up to 1,000 Monthly Active Users (MAU)
- **Startup:** Custom pricing
- **Growth:** Based on MAU and features
- **Enterprise:** Custom pricing

### 7.2 Custom vs CleverTap Comparison

| Feature | Custom Solution | CleverTap |
|---------|----------------|-----------|
| **Cost** | Free (development time only) | Paid (based on MAU) |
| **Maintenance** | High (manual updates needed) | Low (managed service) |
| **Personalization** | Limited | Advanced AI-powered |
| **Analytics** | Basic (need to build) | Advanced built-in |
| **Campaign Management** | Code changes required | No-code dashboard |
| **A/B Testing** | Need to build | Built-in |
| **Push Notifications** | Need to build (Firebase) | Built-in |
| **Segmentation** | Limited | Advanced |
| **Time to Market** | Slower | Faster |

---

## 8. Security & Privacy

### 8.1 GDPR Compliance
```typescript
// User opt-out
CleverTap.setOptOut(true);

// Privacy controls
CleverTap.setOffline(true); // Stop sending data
```

### 8.2 Data Protection
- Don't send sensitive medical data to CleverTap
- Use hashed/anonymized identifiers
- Follow healthcare data regulations (HIPAA if applicable)

### 8.3 Sensitive Data Exclusion
```typescript
// DO NOT send:
// - Medical records
// - Prescription details
// - Payment card information
// - SSN/Aadhaar numbers

// SAFE to send:
// - User name, email, phone (if consented)
// - App usage events
// - Generic preferences
// - Appointment booking counts (not details)
```

---

## 9. Documentation & Training

### 9.1 Developer Documentation
- API reference for advertisement services
- Integration guide for new pages
- Troubleshooting guide
- Testing procedures

### 9.2 Marketing Team Training
- CleverTap dashboard walkthrough
- Campaign creation guide
- Segmentation best practices
- Analytics interpretation

### 9.3 Code Comments
- Add JSDoc comments to all services
- Document configuration options
- Explain provider switching logic

---

## 10. Success Metrics

### 10.1 Technical Metrics
- SDK initialization success rate: > 99%
- Campaign load time: < 500ms
- Error rate: < 0.1%
- Fallback activation rate: < 1%

### 10.2 Business Metrics
- Click-through rate (CTR)
- Conversion rate
- User engagement
- Campaign ROI

### 10.3 Monitoring
- Set up error logging (Sentry, LogRocket, etc.)
- CleverTap dashboard analytics
- Custom analytics events
- Performance monitoring

---

## 11. Next Steps

1. **Approval & Planning**
   - Review this plan with team
   - Get CleverTap account credentials
   - Allocate resources (developers, timeline)

2. **Environment Setup**
   - Create CleverTap account
   - Set up development/staging/production projects
   - Generate API credentials

3. **Start Implementation**
   - Begin with Phase 1: Setup & Configuration
   - Follow the roadmap sequentially
   - Test at each phase

4. **Ongoing Support**
   - Monitor CleverTap integration
   - Optimize campaigns based on analytics
   - Iterate on personalization strategies

---

## Appendix A: CleverTap Dashboard Setup

### A.1 Account Setup
1. Sign up at https://clevertap.com
2. Create new project: "MedicsCare"
3. Get Account ID and Token
4. Configure region (India: in1)

### A.2 Campaign Types to Create
- **Welcome Campaign:** New user onboarding
- **Appointment Reminders:** Push notifications
- **Health Tips:** Daily/weekly content
- **Promotional Offers:** Seasonal campaigns
- **Re-engagement:** Inactive user campaigns

### A.3 Segments to Create
- New users (< 7 days)
- Active users (> 3 sessions/week)
- Inactive users (no activity in 30 days)
- Premium users
- Users with upcoming appointments

---

## Appendix B: Useful Resources

- CleverTap Web SDK: https://developer.clevertap.com/docs/web
- CleverTap Cordova: https://developer.clevertap.com/docs/cordova-quick-start-guide
- Capacitor Documentation: https://capacitorjs.com/docs
- Angular Best Practices: https://angular.io/guide/styleguide
- Ionic Framework: https://ionicframework.com/docs

---

**Document Version:** 1.0
**Last Updated:** 2025-10-07
**Author:** Claude Code
**Status:** Ready for Implementation
