# Banner Management System - Advanced Features Guide

## Overview

This document describes the advanced features added to the banner management system, including analytics dashboard, advanced scheduling, and cloud-based image upload service.

---

## 1. Analytics Dashboard

### Features

The analytics dashboard provides comprehensive insights into banner performance with real-time visualizations and detailed metrics.

### Access

Navigate to: `/home/banner-analytics`

Or click the "Analytics" button in the banner admin page header.

### Dashboard Components

#### Overview Cards
- **Total Impressions**: Aggregate count across all banners
- **Total Clicks**: Total click count
- **Average CTR**: Average click-through rate
- **Active Banners**: Number of currently active banners

#### Filters
- **Banner Selection**: Select specific banner to analyze
- **Date Range**: Preset ranges (7/30/90/180/365 days) or custom range
- **Custom Date Range**: Select specific start and end dates

#### Performance Metrics
Per-banner statistics including:
- Total impressions
- Total clicks
- Click-through rate (CTR)
- Unique users who clicked

#### Visualizations

1. **Daily Impressions Chart**
   - Line chart showing impressions over time
   - Interactive tooltips
   - Responsive design

2. **Daily Clicks Chart**
   - Bar chart showing click patterns
   - Day-by-day breakdown

3. **CTR Trend Chart**
   - Line chart showing CTR percentage over time
   - Helps identify performance trends

4. **Platform Distribution**
   - Doughnut chart showing clicks by platform (iOS/Android/Web)
   - Visual breakdown of user base

5. **Location Distribution**
   - Horizontal bar chart showing clicks by location
   - Identifies which pages drive most engagement

#### Data Table
- Daily breakdown with impressions, clicks, and CTR
- Sortable columns
- Mobile-responsive design

### Technical Implementation

#### Frontend
- **Component**: `frontend/src/pages/banner-analytics/banner-analytics.page.ts`
- **Charts Library**: Chart.js (v4.x)
- **Data Fetching**: Real-time via BannerService

#### Backend
- **Endpoint**: `GET /api/banners/:id/statistics`
- **Data Aggregation**: MongoDB aggregation pipeline
- **Response Format**:
```json
{
  "totalImpressions": 5000,
  "totalClicks": 250,
  "uniqueUsers": 180,
  "ctr": 5.0,
  "dailyStats": [
    {
      "_id": "2025-11-01",
      "impressions": 150,
      "clicks": 8
    }
  ],
  "clicksByLocation": [...],
  "clicksByPlatform": [...]
}
```

---

## 2. Advanced Scheduling

### Features

Enhanced scheduling system with timezone support, recurring patterns, and blackout periods.

### Model Enhancements

#### Timezone Support
```javascript
schedule: {
  timezone: 'America/New_York' // IANA timezone name
}
```

Supported timezones: All IANA timezone names (e.g., 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo')

#### Extended Frequency Options
- `always`: Show whenever active
- `daily`: Show every day within date range
- `weekly`: Show on specific days of week
- `monthly`: Show on specific days of month
- `yearly`: Show on specific months/days
- `specific_days`: Custom day selection

#### Monthly Scheduling
```javascript
schedule: {
  frequency: 'monthly',
  daysOfMonth: [1, 15, 30] // Show on 1st, 15th, and 30th of each month
}
```

#### Yearly Scheduling
```javascript
schedule: {
  frequency: 'yearly',
  monthsOfYear: [12], // December
  daysOfMonth: [25] // 25th day
}
```

### Recurring Patterns

Enable complex recurring schedules:

```javascript
schedule: {
  recurringPattern: {
    enabled: true,
    type: 'weekly', // daily, weekly, monthly, yearly
    interval: 2, // Every 2 weeks
    endType: 'on_date', // never, after_occurrences, on_date
    endDate: '2026-12-31'
  }
}
```

#### Pattern Types
- **Daily**: Repeat every N days
- **Weekly**: Repeat every N weeks
- **Monthly**: Repeat every N months
- **Yearly**: Repeat every N years

#### End Conditions
- **Never**: Pattern continues indefinitely
- **After Occurrences**: Stop after N occurrences
- **On Date**: Stop on specific date

### Blackout Periods

Define when banners should NOT be shown:

#### Blackout Dates
```javascript
schedule: {
  blackoutDates: [
    {
      startDate: '2025-12-24',
      endDate: '2025-12-26',
      reason: 'Holiday period'
    }
  ]
}
```

#### Blackout Times
```javascript
schedule: {
  blackoutTimes: [
    {
      startTime: '00:00',
      endTime: '06:00',
      daysOfWeek: [0, 6], // Sunday and Saturday
      reason: 'Off-peak hours'
    }
  ]
}
```

### Schedule Conflict Detection

#### Endpoint
`POST /api/banners/check-conflicts`

#### Request Body
```json
{
  "schedule": {
    "startDate": "2025-11-01",
    "endDate": "2025-12-31",
    "startTime": "09:00",
    "endTime": "17:00",
    "daysOfWeek": [1, 2, 3, 4, 5]
  },
  "displayLocation": "home",
  "priority": 5,
  "excludeBannerId": "optional-banner-id-to-exclude"
}
```

#### Response
```json
{
  "hasConflicts": true,
  "conflicts": [
    {
      "bannerId": "...",
      "title": "Existing Banner",
      "priority": 10,
      "displayLocation": "home",
      "conflictType": ["higher_priority", "time_overlap", "day_overlap"]
    }
  ],
  "message": "Found 1 potential scheduling conflict(s)"
}
```

#### Conflict Types
- `same_priority`: Banners with same priority (may compete)
- `higher_priority`: Existing banner has higher priority (will override)
- `time_overlap`: Time ranges overlap
- `day_overlap`: Same days of week scheduled

---

## 3. Cloud Image Upload Service

### Features

Integration with Cloudinary for professional image management:
- Cloud-based storage
- Automatic optimization
- Responsive images
- CDN delivery
- Image transformations

### Configuration

#### Environment Variables
Set these in your backend environment:

```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Cloudinary Setup
1. Sign up at [Cloudinary](https://cloudinary.com)
2. Get your credentials from the dashboard
3. Set environment variables
4. Restart the backend server

### Image Upload Endpoint

#### Endpoint
`POST /api/banners/upload-image`

#### Request
Multipart form-data with field name: `image`

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await bannerService.uploadImage(file);
```

#### Response
```json
{
  "cloudinaryImage": {
    "publicId": "banner-images/banner-1699876543210",
    "url": "https://res.cloudinary.com/demo/image/upload/v1699876543/banner-images/banner-1699876543210.jpg",
    "secureUrl": "https://res.cloudinary.com/demo/image/upload/v1699876543/banner-images/banner-1699876543210.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/demo/image/upload/c_fill,h_300,w_400/banner-images/banner-1699876543210.jpg",
    "responsiveUrls": {
      "thumbnail": "...",
      "small": "...",
      "medium": "...",
      "large": "...",
      "original": "..."
    },
    "format": "jpg",
    "width": 1920,
    "height": 1080,
    "uploadedAt": "2025-11-12T10:00:00.000Z"
  },
  "message": "Image uploaded successfully"
}
```

### Image Optimization

#### Automatic Transformations
- **Max dimensions**: 2000x2000px (maintains aspect ratio)
- **Quality**: Auto-optimized (good quality)
- **Format**: Auto-selection (WebP when supported)

#### Responsive URLs
Pre-generated URLs for different screen sizes:
- **Thumbnail**: 400px wide
- **Small**: 640px wide (mobile)
- **Medium**: 1024px wide (tablet)
- **Large**: 1920px wide (desktop)
- **Original**: Full quality

### Image Deletion

#### Endpoint
`DELETE /api/banners/delete-image/:publicId`

#### Request
```javascript
await bannerService.deleteImage('banner-images/banner-1699876543210');
```

#### Response
```json
{
  "deleted": true,
  "message": "Image deleted successfully"
}
```

### Banner Model Integration

#### Cloudinary Fields
```javascript
cloudinaryImage: {
  publicId: 'banner-images/banner-123',
  url: 'https://res.cloudinary.com/...',
  secureUrl: 'https://res.cloudinary.com/...',
  thumbnailUrl: 'https://res.cloudinary.com/...',
  format: 'jpg',
  width: 1920,
  height: 1080,
  uploadedAt: Date
}
```

#### Legacy Support
The system maintains backward compatibility:
- `imageBase64`: Base64 encoded images (legacy)
- `imageUrl`: Direct image URLs (legacy)
- `cloudinaryImage`: New cloud-based images (preferred)

#### Display Priority
1. `cloudinaryImage.secureUrl` (if available)
2. `imageUrl` (fallback)
3. `imageBase64` (legacy fallback)

### File Restrictions

#### Accepted Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

#### Size Limits
- Maximum file size: 10MB
- Recommended: < 2MB for optimal upload speed

#### Validation
- MIME type checking
- File size validation
- Format verification

---

## 4. Frontend Service Integration

### BannerService Methods

#### Upload Image
```typescript
async uploadImage(file: File): Promise<any>
```

#### Delete Image
```typescript
async deleteImage(publicId: string): Promise<any>
```

#### Check Schedule Conflicts
```typescript
async checkScheduleConflicts(scheduleData: any): Promise<any>
```

### Usage Example

```typescript
// Upload image
const file = event.target.files[0];
const result = await this.bannerService.uploadImage(file);
this.form.cloudinaryImage = result.cloudinaryImage;

// Check conflicts
const conflictCheck = await this.bannerService.checkScheduleConflicts({
  schedule: this.form.schedule,
  displayLocation: this.form.displayLocation,
  priority: this.form.priority,
  excludeBannerId: this.editingBannerId
});

if (conflictCheck.hasConflicts) {
  // Show warning to user
  console.warn('Conflicts detected:', conflictCheck.conflicts);
}
```

---

## 5. Best Practices

### Analytics
1. **Regular Monitoring**: Check analytics weekly to identify trends
2. **A/B Testing**: Create multiple banners and compare CTR
3. **Location Analysis**: Identify best-performing pages
4. **Platform Optimization**: Tailor content for specific platforms

### Scheduling
1. **Timezone Awareness**: Always set timezone for multi-region deployments
2. **Conflict Resolution**: Use conflict checker before saving
3. **Priority Management**: Higher priority (10) overrides lower priority (1)
4. **Blackout Planning**: Plan blackouts for maintenance or holidays

### Image Management
1. **Use Cloudinary**: Preferred over base64 for better performance
2. **Optimize Before Upload**: Resize images to reasonable dimensions
3. **Format Selection**: Use WebP for web, fallback to JPEG
4. **CDN Benefits**: Cloudinary automatically uses CDN for fast delivery
5. **Clean Up**: Delete unused images to save storage

### Performance
1. **Image Size**: Keep images under 2MB
2. **Lazy Loading**: Images loaded on-demand
3. **Caching**: Cloudinary provides automatic caching
4. **Responsive Images**: Use appropriate size for device

---

## 6. Migration Guide

### Upgrading Existing Banners

#### From Base64 to Cloudinary
```javascript
// 1. Upload existing base64 image
const file = base64ToFile(banner.imageBase64);
const result = await uploadImage(file);

// 2. Update banner
banner.cloudinaryImage = result.cloudinaryImage;
banner.imageBase64 = null; // Optional: clear legacy field
await updateBanner(banner._id, banner);
```

#### Adding Timezone to Existing Schedules
```javascript
// Update all banners with default timezone
await Banner.updateMany(
  { 'schedule.timezone': { $exists: false } },
  { $set: { 'schedule.timezone': 'UTC' } }
);
```

---

## 7. Troubleshooting

### Analytics Dashboard

**Issue**: Charts not displaying
- **Solution**: Ensure banner has impression/click data
- Check browser console for errors
- Verify date range includes data

**Issue**: No data showing
- **Solution**: Select a banner with activity
- Adjust date range
- Check if banner has been served

### Image Upload

**Issue**: Upload fails
- **Solution**: Check Cloudinary credentials
- Verify environment variables are set
- Check file size (< 10MB)
- Ensure file is valid image format

**Issue**: Images not displaying
- **Solution**: Check Cloudinary public ID is correct
- Verify URL is accessible
- Check CORS settings if cross-domain

### Scheduling

**Issue**: Banner not showing despite active schedule
- **Solution**: Check timezone settings
- Verify current time is within time range
- Check blackout periods
- Review frequency settings (days of week, month, year)

**Issue**: Conflict detection not working
- **Solution**: Ensure all required fields are provided
- Check date format (ISO 8601)
- Verify priority is a number

---

## 8. API Reference Summary

### Analytics
- `GET /api/banners/:id/statistics` - Get banner analytics

### Image Management
- `POST /api/banners/upload-image` - Upload image to Cloudinary
- `DELETE /api/banners/delete-image/:publicId` - Delete image

### Scheduling
- `POST /api/banners/check-conflicts` - Check schedule conflicts

### Banner CRUD
- `GET /api/banners/list` - List all banners with stats
- `GET /api/banners/:id` - Get single banner
- `POST /api/banners` - Create banner
- `PUT /api/banners/:id` - Update banner
- `DELETE /api/banners/:id` - Delete banner

### Display
- `GET /api/banners/serve?location=home&userId=...` - Get banner for display
- `POST /api/banners/impression` - Track impression
- `POST /api/banners/click` - Track click

---

## 9. Future Enhancements

### Planned Features
- [ ] A/B testing framework
- [ ] Automated scheduling recommendations
- [ ] Advanced targeting (user segments, demographics)
- [ ] Multi-language banner support
- [ ] Video banner support
- [ ] Animation support
- [ ] Template library
- [ ] Batch operations
- [ ] Export analytics to CSV/PDF
- [ ] Email notifications for performance milestones

### Suggested Improvements
- Integration with Google Analytics
- Heat map click tracking
- User journey tracking
- Conversion funnel analysis
- Banner performance predictions (ML)

---

## 10. Support & Resources

### Documentation Files
- `BANNER_SYSTEM_GUIDE.md` - Basic system guide
- `BANNER_RESPONSIVE_DESIGN.md` - Responsive design guide
- `BANNER_DISPLAY_LOCATION_GUIDE.md` - Display location guide
- `BANNER_ADVANCED_FEATURES.md` - This document

### External Resources
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [IANA Timezone Database](https://www.iana.org/time-zones)
- [MongoDB Aggregation](https://docs.mongodb.com/manual/aggregation/)

### Code Locations
- Backend Models: `backend/src/models/Banner.js`
- Backend Controller: `backend/src/controllers/BannerController.js`
- Backend Config: `backend/src/config/cloudinary.js`
- Frontend Service: `frontend/src/services/banner/banner.service.ts`
- Banner Admin: `frontend/src/pages/banner-admin/`
- Analytics Dashboard: `frontend/src/pages/banner-analytics/`

---

## Conclusion

The advanced features significantly enhance the banner management system, providing:
- **Data-driven insights** through comprehensive analytics
- **Flexible scheduling** with timezone and blackout support
- **Professional image management** via Cloudinary integration

These features enable better decision-making, improved user experience, and streamlined content management.
