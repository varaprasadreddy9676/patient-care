# Banner Display Location System - Integration Guide

## Overview

This document explains how the **Display Location** feature works in the Banner Management System and clarifies the important distinction between **configuring a location** and **actually displaying banners**.

---

## How Display Location Works

### Backend Configuration

When you create a banner in the admin interface, you select a **Display Location**:

- **Home**: Banner configured for home page
- **Appointments**: Banner configured for appointments page
- **EMR**: Banner configured for EMR/medical records page
- **All**: Banner configured to be available on all pages

### Important Clarification ⚠️

**The Display Location setting determines WHERE a banner CAN be shown, but it does NOT automatically make the banner appear on those pages.**

Think of it like this:
- **Display Location = "home"**: The banner is *eligible* to appear on the home page
- **Display Location = "all"**: The banner is *eligible* to appear on any page that requests banners

### Backend Filtering Logic

The backend API (`/api/banners/serve?location=home`) filters banners like this:

```javascript
// Find banners that match the requested location OR have displayLocation='all'
const banners = await Banner.find({
    isActive: true,
    $or: [
        { displayLocation: location },     // Exact match (e.g., 'home')
        { displayLocation: 'all' }         // OR banners marked 'all'
    ]
}).sort({ priority: -1 });
```

**Example:**
- Request: `GET /api/banners/serve?location=home`
- Returns: All banners with `displayLocation='home'` OR `displayLocation='all'`

---

## Current Integration Status

### ✅ Pages with Banner Integration

The banner component has been integrated into the following pages:

#### 1. **Home Page**
**File:** `frontend/src/pages/home/home.page.html`

```html
<!-- New Banner System (placed right under header) -->
<app-banner
  location="home"
  [autoRefresh]="false">
</app-banner>
```

**Behavior:**
- Displays banners with `displayLocation='home'` OR `displayLocation='all'`
- Automatically tracks impressions when banner loads
- Tracks clicks when user taps/clicks banner
- Handles navigation to external URL or internal route

---

#### 2. **Appointment List Page**
**File:** `frontend/src/pages/appointment/appointment-list/appointment-list.page.html`

```html
<!-- Banner for Appointments Page -->
<app-banner
  location="appointments"
  [autoRefresh]="false">
</app-banner>
```

**Behavior:**
- Displays banners with `displayLocation='appointments'` OR `displayLocation='all'`
- Same tracking and navigation features as home page

---

#### 3. **EMR (Medical Records) Page**
**File:** `frontend/src/pages/visit-records/emr/emr.page.html`

```html
<!-- Banner for EMR Page -->
<app-banner
  location="emr"
  [autoRefresh]="false">
</app-banner>
```

**Behavior:**
- Displays banners with `displayLocation='emr'` OR `displayLocation='all'`
- Same tracking and navigation features as other pages

---

### ❌ What "All Pages" Does NOT Mean

When you select **"All Pages"** in the admin interface:

- ❌ It does NOT automatically inject the banner into every page in the application
- ❌ It does NOT magically appear on pages that don't have `<app-banner>` added
- ❌ It does NOT override the need for manual integration

### ✅ What "All Pages" DOES Mean

When you select **"All Pages"**:

- ✅ The banner becomes **eligible** to appear on ANY page that has integrated the banner component
- ✅ It will be returned by the API no matter which `location` parameter is used
- ✅ It provides flexibility to show the same banner across multiple pages without creating duplicates

**Example Scenario:**

You create a banner:
- **Title:** "Special Summer Offer"
- **Display Location:** "All"

This banner will appear on:
- ✅ Home page (because home page has `<app-banner location="home">`)
- ✅ Appointments page (because appointments page has `<app-banner location="appointments">`)
- ✅ EMR page (because EMR page has `<app-banner location="emr">`)

---

## How to Add Banners to Additional Pages

If you want banners to appear on additional pages, follow these steps:

### Step 1: Import the BannerComponent

In your page's TypeScript file (e.g., `my-page.page.ts`):

```typescript
import { BannerComponent } from 'src/shared/components/banner/banner.component';

@Component({
  selector: 'app-my-page',
  templateUrl: './my-page.page.html',
  styleUrls: ['./my-page.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    // ... other imports
    BannerComponent,  // Add this
  ],
})
export class MyPage {
  // ...
}
```

### Step 2: Add the Banner Component to Your HTML

In your page's HTML file (e.g., `my-page.page.html`):

```html
<ion-content>
  <!-- Your page header -->
  <header>
    <h1>My Page Title</h1>
  </header>

  <!-- Add banner component -->
  <app-banner
    location="mypage"
    [autoRefresh]="false">
  </app-banner>

  <!-- Rest of your content -->
  <div class="content">
    <!-- ... -->
  </div>
</ion-content>
```

**Important Notes:**
- The `location` parameter should match one of the backend enum values OR be a new custom location
- Set `[autoRefresh]="true"` if you want the banner to refresh automatically (useful for long-lived pages)
- Set `refreshInterval` in milliseconds if using auto-refresh (default: 30000 = 30 seconds)

### Step 3: (Optional) Add New Location to Backend

If you want to create a new display location (e.g., "prescription", "billing"):

#### 3.1 Update Backend Model

Edit `backend/src/models/Banner.js`:

```javascript
displayLocation: {
  type: String,
  enum: ['home', 'appointments', 'emr', 'prescription', 'billing', 'all'],
  default: 'all'
}
```

#### 3.2 Update Frontend Admin Form

Edit `frontend/src/pages/banner-admin/banner-admin.page.html`:

```html
<ion-item>
  <ion-label>Display Location</ion-label>
  <ion-select [(ngModel)]="form.displayLocation" name="displayLocation">
    <ion-select-option value="all">All Pages</ion-select-option>
    <ion-select-option value="home">Home Only</ion-select-option>
    <ion-select-option value="appointments">Appointments Only</ion-select-option>
    <ion-select-option value="emr">EMR Only</ion-select-option>
    <ion-select-option value="prescription">Prescription Only</ion-select-option>
    <ion-select-option value="billing">Billing Only</ion-select-option>
  </ion-select>
</ion-item>
```

---

## Implementation Patterns

### Pattern 1: Page-Specific Banners

**Use Case:** You want different banners for different sections of your app.

**Setup:**
- Create banner with `displayLocation='home'` → Only appears on home page
- Create banner with `displayLocation='appointments'` → Only appears on appointments page

**Example:**
```
Banner A: "Book Your Annual Checkup" (displayLocation='home')
Banner B: "Don't Miss Your Appointment" (displayLocation='appointments')
```

### Pattern 2: Global Banners

**Use Case:** You want the same banner to appear everywhere.

**Setup:**
- Create banner with `displayLocation='all'` → Appears on all integrated pages

**Example:**
```
Banner: "Holiday Hours: Clinic Closed Dec 25-26" (displayLocation='all')
```

### Pattern 3: Multi-Location Banners

**Use Case:** You want a banner on 2 specific pages but not everywhere.

**Setup (Current Limitation):**
- Unfortunately, you need to create 2 separate banners with identical content
- Banner A: `displayLocation='home'`
- Banner B: `displayLocation='appointments'`

**Future Enhancement:**
- Consider allowing multiple location selection (e.g., `displayLocation: ['home', 'appointments']`)

---

## Testing Display Locations

### Test Scenario 1: Home-Only Banner

**Steps:**
1. Create banner with `displayLocation='home'`
2. Activate the banner
3. Navigate to home page → ✅ Banner appears
4. Navigate to appointments page → ❌ Banner does NOT appear
5. Navigate to EMR page → ❌ Banner does NOT appear

### Test Scenario 2: All-Pages Banner

**Steps:**
1. Create banner with `displayLocation='all'`
2. Activate the banner
3. Navigate to home page → ✅ Banner appears
4. Navigate to appointments page → ✅ Banner appears
5. Navigate to EMR page → ✅ Banner appears

### Test Scenario 3: Mixed Banners

**Steps:**
1. Create Banner A with `displayLocation='home'`
2. Create Banner B with `displayLocation='all'`
3. Navigate to home page → ✅ Banner A appears (or Banner B if higher priority)
4. Navigate to appointments page → ✅ Only Banner B appears

**Priority Logic:**
- If multiple banners are eligible, the one with highest `priority` value is shown
- If priorities are equal, the most recently created banner is shown

---

## Frequency Capping and Display Location

**Important:** Display location filtering happens BEFORE frequency capping.

**Example:**

Banner Settings:
- `displayLocation='appointments'`
- `maxImpressionsPerUser=3`

User Journey:
1. User views home page → Banner NOT shown (location doesn't match)
2. User views appointments page → Banner shown (impression count: 1)
3. User navigates away and returns to appointments → Banner shown (impression count: 2)
4. User returns again → Banner shown (impression count: 3)
5. User returns again → Banner NOT shown (frequency cap reached)

**Key Point:** The frequency cap only applies to pages where the banner is actually displayed.

---

## Auto-Refresh Feature

The banner component supports auto-refreshing, useful for long-lived pages:

```html
<app-banner
  location="home"
  [autoRefresh]="true"
  [refreshInterval]="60000">
</app-banner>
```

**Parameters:**
- `autoRefresh`: Enable/disable auto-refresh (default: `false`)
- `refreshInterval`: Milliseconds between refreshes (default: `30000` = 30 seconds)

**Use Cases:**
- Dashboard pages users keep open for long periods
- Monitoring pages
- Admin interfaces

**Note:** Each refresh counts as a new impression for analytics.

---

## Common Questions

### Q: Why doesn't "All Pages" show the banner everywhere?

**A:** Because the banner component must be manually added to each page. "All Pages" means the banner is *eligible* to appear on any page that has the component, but it doesn't automatically inject itself.

### Q: Can I add banners to login/signup pages?

**A:** Yes, technically you can add the `<app-banner>` component to any page. However, consider whether it's appropriate from a UX perspective. Login pages should typically be distraction-free.

### Q: How do I add banners to a shared layout?

**A:** If you have a shared header or layout component used across multiple pages, you can add the banner there:

```html
<!-- shared-header.component.html -->
<header>
  <h1>{{ pageTitle }}</h1>
</header>

<!-- Add banner once, appears on all pages using this header -->
<app-banner
  [location]="currentLocation"
  [autoRefresh]="false">
</app-banner>
```

You'll need to pass the `currentLocation` dynamically based on the current page.

### Q: Can I show multiple banners on one page?

**A:** Currently, the banner component shows only the highest-priority eligible banner. To show multiple banners, you would need to either:
1. Implement a carousel (modify the component to accept multiple banners)
2. Add multiple `<app-banner>` components with different IDs/logic

### Q: What happens if no banners match the location?

**A:** The banner component will display nothing (gracefully hidden). No error is shown to the user.

---

## Summary

| Feature | How It Works |
|---------|--------------|
| **Display Location Setting** | Backend filter that determines which banners are *eligible* for a page |
| **"All Pages"** | Banner is eligible for any page that has `<app-banner>`, not literally all pages |
| **Integration Required** | Must manually add `<app-banner>` to each page's HTML |
| **Current Integration** | Home, Appointments, EMR pages have banners integrated |
| **API Filtering** | Returns banners matching requested location OR displayLocation='all' |
| **Frequency Capping** | Applied AFTER location filtering, per-user basis |

---

## Next Steps

To make the banner system truly available on "all pages," you have two options:

### Option 1: Add to Specific Pages (Recommended)
- Identify key pages where banners make sense
- Manually integrate `<app-banner>` on each page
- Use appropriate `location` parameter

### Option 2: Add to Shared Layout (Advanced)
- Create or use existing shared layout component
- Add single `<app-banner>` component
- Pass dynamic location based on current route
- Requires router integration

**Recommendation:** Start with Option 1 (specific pages) for better control and UX, then consider Option 2 if needed.
