# Banner Management System - Complete Guide

## Overview

A comprehensive banner/advertisement management system with rich content support, scheduling, meticulous click tracking, and admin dashboard.

## Features

### Content Types
- **Text Only**: Rich HTML text content with customizable styling
- **Image Only**: Banner with image (base64 or URL)
- **Combo**: Combined text and image banner

### Scheduling
- **Date Range**: Start and end dates
- **Time Range**: Start and end times (e.g., show only 9 AM - 6 PM)
- **Frequency**: Always, Daily, Weekly, Specific Days of Week
- **Frequency Capping**: Max impressions/clicks per user

### Click Behavior
- **External Links**: Open external URLs in new tab
- **Internal Navigation**: Navigate to app pages (e.g., /appointments, /home)

### Banner Sizes
- **Small**: 120px height
- **Medium**: 200px height (default)
- **Large**: 300px height
- **Custom**: Specify exact width x height in pixels

### Display Settings
- **Location Targeting**: Show on specific pages (home, appointments, emr) or all pages
- **Priority**: Higher priority banners shown first
- **Active/Inactive**: Toggle banner visibility

### Analytics & Tracking
- **Impressions**: Track every time banner is shown
- **Clicks**: Meticulously track clicks with:
  - User information
  - Session and device IDs
  - Time on page before click
  - Scroll position when clicked
  - Device type and platform (iOS/Android/Web)
  - IP address
  - User agent
- **Statistics**:
  - Click-through rate (CTR)
  - Clicks/impressions by day
  - Clicks by location
  - Clicks by platform
  - Unique users

## Architecture

### Backend Models

**Banner Model** (`backend/src/models/Banner.js`)
- Stores banner configuration, content, scheduling, and aggregate statistics
- Indexes for efficient querying by active status, schedule, and location

**BannerClick Model** (`backend/src/models/BannerClick.js`)
- Stores every click with detailed tracking information
- Used for detailed analytics and reporting

**BannerImpression Model** (`backend/src/models/BannerImpression.js`)
- Stores every impression (when banner is shown)
- TTL index: Auto-deletes after 90 days to save space
- Used for frequency capping and analytics

### Backend API

**Banner Controller** (`backend/src/controllers/BannerController.js`)

**Endpoints:**

1. **GET `/api/banners/serve`** - Get banner to display
   - Query params: `location`, `userId`, `sessionId`
   - Returns: Banner matching schedule, location, and frequency caps
   - Logic:
     - Filters by active status and location
     - Checks date/time schedule
     - Checks frequency (daily, weekly, specific days)
     - Applies frequency capping per user
     - Returns highest priority eligible banner

2. **POST `/api/banners/impression`** - Track impression
   - Body: `bannerId`, `userId`, `sessionId`, `deviceId`, `displayLocation`, `platform`
   - Creates impression record
   - Increments banner's totalImpressions counter

3. **POST `/api/banners/click`** - Track click (meticulous)
   - Body: All click details (user, device, time, scroll position, etc.)
   - Creates detailed click record
   - Increments banner's totalClicks counter
   - Marks impression as clicked

4. **GET `/api/banners/:id/statistics`** - Get banner statistics
   - Returns: Comprehensive analytics including CTR, clicks/impressions by day, location, platform

5. **GET `/api/banners/list`** - List all banners with stats
   - Returns: All banners with basic statistics

6. **POST `/api/banners`** - Create new banner
7. **PUT `/api/banners/:id`** - Update banner
8. **DELETE `/api/banners/:id`** - Delete banner
9. **GET `/api/banners/:id`** - Get single banner

### Frontend Services

**BannerService** (`frontend/src/services/banner/banner.service.ts`)

**Methods:**

- `getBanner(location)` - Fetch banner for specific location
  - Automatically tracks impression
  - Returns Banner object or null

- `trackClick(banner, location, scrollPosition)` - Track click with full details
  - Captures time on page, scroll position, device info
  - Fire-and-forget (doesn't block UI)

- `getAllBanners()` - Get all banners (admin)
- `createBanner(banner)` - Create banner (admin)
- `updateBanner(bannerId, banner)` - Update banner (admin)
- `deleteBanner(bannerId)` - Delete banner (admin)
- `getBannerStatistics(bannerId)` - Get statistics (admin)

### Frontend Components

**BannerComponent** (`frontend/src/shared/components/banner/`)

**Usage:**

```html
<!-- Home page -->
<app-banner location="home"></app-banner>

<!-- Appointments page -->
<app-banner location="appointments"></app-banner>

<!-- With auto-refresh every 30 seconds -->
<app-banner location="home" [autoRefresh]="true" [refreshInterval]="30000"></app-banner>
```

**Features:**
- Automatically loads appropriate banner for location
- Tracks impressions on load
- Tracks clicks with full analytics
- Handles external/internal navigation
- Responsive design
- Loading skeleton
- Auto-refresh support

**BannerAdminPage** (`frontend/src/pages/banner-admin/`)

**Features:**
- List all banners with statistics
- Create new banners with rich form
- Edit existing banners
- Delete banners (with confirmation)
- Toggle active/inactive status
- Upload images or use image URLs
- Set scheduling and frequency
- Configure click behavior
- View basic statistics

**Access:** Navigate to `/banner-admin` (route needs to be added to routing)

## Setup Instructions

### 1. Backend Setup

Models are already registered in `backend/src/models/index.js`

Routes are already registered in `backend/src/routes.js`

No additional setup needed!

### 2. Frontend Setup

**Add Banner Component to Pages:**

```typescript
// In any page.ts file
import { BannerComponent } from '../../shared/components/banner/banner.component';

@Component({
  imports: [
    // ... other imports
    BannerComponent
  ]
})
```

**In Template:**

```html
<!-- Show banner for current page -->
<app-banner [location]="'home'"></app-banner>
```

### 3. Add Admin Route

Add to `frontend/src/app/app.routes.ts`:

```typescript
{
  path: 'banner-admin',
  loadComponent: () => import('./pages/banner-admin/banner-admin.page').then(m => m.BannerAdminPage)
}
```

## Usage Examples

### Creating a Banner (Admin)

1. Navigate to `/banner-admin`
2. Click "Create" tab
3. Fill in form:
   - **Title**: "Summer Sale 2024"
   - **Content Type**: "combo" (text + image)
   - **Image**: Upload image
   - **Text Content**: `<h2>50% OFF</h2><p>All appointments this month!</p>`
   - **Size**: "medium"
   - **Click Behavior**: "internal"
   - **Internal Route**: "/appointments"
   - **Display Location**: "home"
   - **Priority**: 10
   - **Schedule**:
     - Start: 2024-06-01
     - End: 2024-06-30
     - Time: 09:00 - 18:00
     - Frequency: "daily"
   - **Max Impressions Per User**: 5
   - **Max Clicks Per User**: 2
4. Click "Create Banner"

### Displaying Banners

**Home Page** (`frontend/src/pages/home/home.page.html`):

```html
<ion-content>
  <!-- Existing content -->

  <!-- Add banner -->
  <app-banner location="home"></app-banner>

  <!-- More content -->
</ion-content>
```

**Import in Component:**

```typescript
import { BannerComponent } from '../../shared/components/banner/banner.component';

@Component({
  imports: [BannerComponent, /* other imports */]
})
export class HomePage {}
```

### Tracking in Custom Components

If you need manual control:

```typescript
import { BannerService } from '../../services/banner/banner.service';

constructor(private bannerService: BannerService) {}

async loadBanner() {
  const banner = await this.bannerService.getBanner('appointments');
  if (banner) {
    this.currentBanner = banner;
    // Banner impression already tracked automatically
  }
}

async handleBannerClick(banner: Banner) {
  await this.bannerService.trackClick(banner, 'appointments', 50);

  // Navigate manually
  if (banner.clickBehavior === 'internal') {
    this.router.navigate([banner.internalRoute]);
  }
}
```

## Best Practices

### Performance

1. **Impression Tracking**: Fire-and-forget, doesn't block UI
2. **Click Tracking**: Async, doesn't impact navigation
3. **TTL Index**: Old impressions auto-delete after 90 days
4. **Batch Updates**: Use `insertMany` for impressions
5. **Indexes**: Efficient queries on bannerId, userId, dates

### Scheduling Logic

1. **Priority First**: Higher priority banners shown first
2. **Frequency Capping**: Respects max impressions/clicks per user
3. **Time Windows**: Only shows during specified hours
4. **Day of Week**: Can restrict to specific days (e.g., weekends only)

### Analytics

1. **Detailed Tracking**: Every click has full context
2. **Session Tracking**: Link clicks to user sessions
3. **CTR Calculation**: Automatically calculated in statistics
4. **Time-based Charts**: Daily breakdowns for last 30 days
5. **Platform Analytics**: See which platforms get most clicks

### Content Guidelines

**Text Content:**
- Use semantic HTML (`<h1>`, `<h2>`, `<p>`)
- Keep text concise (2-3 lines max)
- Use contrasting colors for readability

**Images:**
- Recommended: 1200x400px for large, 800x250px for medium, 600x150px for small
- Optimize images (< 100KB for best performance)
- Use JPG for photos, PNG for graphics with transparency

**Click Targets:**
- External URLs: Include https://
- Internal routes: Use Angular routes (e.g., `/appointments`, `/home`)

## API Reference

### Banner Object

```typescript
{
  id: string;
  title: string;
  description?: string;
  contentType: 'text' | 'image' | 'combo';
  richTextContent?: string;
  imageBase64?: string;
  imageUrl?: string;
  size: 'small' | 'medium' | 'large' | 'custom';
  customWidth?: number;
  customHeight?: number;
  clickBehavior: 'external' | 'internal';
  externalUrl?: string;
  internalRoute?: string;
  displayLocation: 'home' | 'appointments' | 'emr' | 'all';
  priority: number;
  isActive: boolean;
  schedule: {
    startDate: Date;
    endDate: Date;
    startTime?: string; // HH:MM
    endTime?: string;   // HH:MM
    frequency: 'always' | 'daily' | 'weekly' | 'specific_days';
    daysOfWeek?: number[]; // 0=Sunday, 6=Saturday
    maxImpressionsPerUser?: number;
    maxClicksPerUser?: number;
  };
  totalImpressions: number;
  totalClicks: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Troubleshooting

### Banner Not Showing

1. Check banner is **Active**
2. Verify current date/time is within schedule range
3. Check frequency settings (e.g., if set to weekdays, won't show on weekend)
4. Verify displayLocation matches page location
5. Check if user has exceeded maxImpressions or maxClicks

### Click Not Tracked

1. Check browser console for errors
2. Verify backend `/api/banners/click` endpoint is accessible
3. Check network tab for failed requests
4. Verify bannerId is being passed correctly

### Low CTR

1. Review banner design and messaging
2. Check if click target is clear
3. Verify schedule doesn't restrict showing times
4. Consider A/B testing different content types

## Future Enhancements

Possible additions (not implemented yet):

- [ ] A/B testing framework
- [ ] Conversion tracking (track if user completed action after click)
- [ ] Geo-targeting by IP address
- [ ] Device targeting (show different banners for mobile vs desktop)
- [ ] Budget/cost tracking
- [ ] Banner templates library
- [ ] Drag-and-drop visual editor
- [ ] Real-time statistics dashboard
- [ ] Email notifications for banner performance
- [ ] Export statistics to CSV/PDF

## Support

For issues or questions about the banner system:

1. Check backend logs: `backend/logs/`
2. Check browser console for frontend errors
3. Verify database connection and models are registered
4. Test API endpoints with Postman/curl

## Summary

The banner system provides:

✅ Rich content support (text, image, combo)
✅ Flexible scheduling (dates, times, frequencies)
✅ Meticulous click tracking (15+ data points per click)
✅ Frequency capping per user
✅ Admin dashboard for management
✅ Comprehensive analytics
✅ Easy integration with existing pages
✅ Robust and performant (using MongoDB only, no Redis needed)

The system is production-ready and can handle high traffic with proper indexing and TTL management for old data.
