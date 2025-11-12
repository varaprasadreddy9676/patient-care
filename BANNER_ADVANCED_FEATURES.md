# Banner Management System - Advanced Features Guide

## Overview

This document describes the advanced features added to the banner management system, including analytics dashboard, advanced scheduling, and video/GIF support.

---

## 1. Analytics Dashboard

### Access

Navigate to: `/home/banner-analytics`

Or click the "Analytics" button in the banner admin page header.

### Features

- **Overview Cards**: Total impressions, clicks, average CTR, and active banners count
- **Interactive Charts**: 5 visualizations using Chart.js
  - Daily impressions (line chart)
  - Daily clicks (bar chart)
  - CTR trends (line chart)
  - Platform distribution (doughnut chart - iOS/Android/Web)
  - Location distribution (bar chart - home/appointments/emr)
- **Date Filters**: 7, 30, 90, 180, 365 days, or custom range
- **Daily Breakdown Table**: View impressions, clicks, and CTR per day
- **Fully Responsive**: Works on mobile, tablet, and desktop

### API Endpoint
`GET /api/banners/:id/statistics`

Returns combined analytics data including daily stats, platform breakdown, and location breakdown.

---

## 2. Advanced Scheduling

### Timezone Support

Set timezone for accurate scheduling across regions:
```javascript
schedule: {
  timezone: 'America/New_York' // IANA timezone name
}
```

### Extended Frequency Options

- **always**: Show whenever active
- **daily**: Show every day within date range
- **weekly**: Show on specific days of week
- **monthly**: Show on specific days of month (NEW)
- **yearly**: Show on specific months/days (NEW)
- **specific_days**: Custom day selection

### Monthly Scheduling Example
```javascript
schedule: {
  frequency: 'monthly',
  daysOfMonth: [1, 15, 30] // Show on 1st, 15th, and 30th of each month
}
```

### Yearly Scheduling Example
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

### Blackout Periods

Define when banners should NOT be shown:

**Blackout Dates:**
```javascript
schedule: {
  blackoutDates: [{
    startDate: '2025-12-24',
    endDate: '2025-12-26',
    reason: 'Holiday period'
  }]
}
```

**Blackout Times:**
```javascript
schedule: {
  blackoutTimes: [{
    startTime: '00:00',
    endTime: '06:00',
    daysOfWeek: [0, 6], // Sunday and Saturday
    reason: 'Off-peak hours'
  }]
}
```

### Schedule Conflict Detection

Check for conflicts before saving:

**Endpoint**: `POST /api/banners/check-conflicts`

**Request:**
```json
{
  "schedule": {
    "startDate": "2025-11-01",
    "endDate": "2025-12-31",
    "startTime": "09:00",
    "endTime": "17:00"
  },
  "displayLocation": "home",
  "priority": 5,
  "excludeBannerId": "optional-id-when-editing"
}
```

**Response:**
```json
{
  "hasConflicts": true,
  "conflicts": [{
    "bannerId": "...",
    "title": "Existing Banner",
    "priority": 10,
    "conflictType": ["higher_priority", "time_overlap"]
  }]
}
```

**Conflict Types:**
- `same_priority`: Banners with same priority may compete
- `higher_priority`: Existing banner will override
- `time_overlap`: Time ranges overlap
- `day_overlap`: Same days scheduled

---

## 3. Video and GIF Support

### Content Types

The system now supports 5 content types:
- **text**: Text-only banners
- **image**: Image banners (Base64 or URL)
- **video**: Video banners (YouTube, Vimeo, or direct MP4/WebM)
- **gif**: GIF animations
- **combo**: Combination of text + image/video/gif

### Video Banners

**YouTube Example:**
```javascript
{
  contentType: 'video',
  videoUrl: 'https://www.youtube.com/watch?v=VIDEO_ID',
  videoType: 'youtube',
  videoThumbnail: 'https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg'
}
```

**Vimeo Example:**
```javascript
{
  contentType: 'video',
  videoUrl: 'https://vimeo.com/VIDEO_ID',
  videoType: 'vimeo',
  videoThumbnail: 'https://...thumbnail.jpg'
}
```

**Direct Video (MP4/WebM):**
```javascript
{
  contentType: 'video',
  videoUrl: 'https://yourdomain.com/videos/banner-video.mp4',
  videoType: 'direct',
  videoThumbnail: 'https://yourdomain.com/thumbnails/video-thumb.jpg'
}
```

### GIF Banners

**GIF from URL:**
```javascript
{
  contentType: 'gif',
  gifUrl: 'https://yourdomain.com/animations/banner.gif'
}
```

**GIF from Base64:**
```javascript
{
  contentType: 'gif',
  gifBase64: 'data:image/gif;base64,...'
}
```

### Model Fields

```javascript
// Video fields
videoUrl: String           // YouTube, Vimeo, or direct video URL
videoType: String          // 'youtube', 'vimeo', or 'direct'
videoThumbnail: String     // Thumbnail image URL

// GIF fields
gifUrl: String             // GIF URL
gifBase64: String          // Base64 encoded GIF
```

---

## 4. API Reference

### Analytics
- `GET /api/banners/:id/statistics` - Get banner analytics with daily breakdown

### Scheduling
- `POST /api/banners/check-conflicts` - Check for schedule conflicts

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

## 5. Best Practices

### Analytics
1. Check analytics weekly to identify trends
2. Compare CTR across different banners
3. Identify best-performing pages
4. Optimize content for specific platforms

### Scheduling
1. Always set timezone for multi-region deployments
2. Use conflict checker before saving
3. Higher priority (10) overrides lower priority (1)
4. Plan blackouts for maintenance or holidays

### Media Content
1. **Images**: Use imageUrl for better performance than base64
2. **Videos**:
   - Use YouTube/Vimeo for better streaming
   - For direct videos, keep files under 10MB
   - Always provide a thumbnail
3. **GIFs**:
   - Keep file size under 2MB for performance
   - Consider using video format instead for large animations

---

## 6. File Locations

### Backend
- Model: `backend/src/models/Banner.js`
- Controller: `backend/src/controllers/BannerController.js`

### Frontend
- Service: `frontend/src/services/banner/banner.service.ts`
- Analytics Dashboard: `frontend/src/pages/banner-analytics/`
- Banner Admin: `frontend/src/pages/banner-admin/`
- Banner Component: `frontend/src/shared/components/banner/`

### Documentation
- Basic Guide: `BANNER_SYSTEM_GUIDE.md`
- Responsive Design: `BANNER_RESPONSIVE_DESIGN.md`
- Display Locations: `BANNER_DISPLAY_LOCATION_GUIDE.md`
- Advanced Features: `BANNER_ADVANCED_FEATURES.md` (this file)

---

## 7. What's Included

✅ **Analytics Dashboard** - Real-time performance metrics with 5 visualizations
✅ **Advanced Scheduling** - Timezone, recurring patterns, blackout periods
✅ **Video Support** - YouTube, Vimeo, direct MP4/WebM
✅ **GIF Support** - Animated GIFs via URL or Base64
✅ **Conflict Detection** - Check for scheduling conflicts
✅ **Responsive Design** - Works on all devices
✅ **No External Services Required** - Everything self-contained

---

## 8. Future Enhancements

Possible additions:
- A/B testing framework
- Video auto-play settings
- GIF loop control
- Animated banners
- Banner templates library
- Multi-language support
- Email notifications for milestones

---

## Support

For issues or questions, refer to:
- `BANNER_SYSTEM_GUIDE.md` - Basic system guide
- `BANNER_RESPONSIVE_DESIGN.md` - Responsive design guide
- Backend Controller - Check schedule logic and API endpoints
- Frontend Service - Check integration methods

---

**Last Updated**: November 12, 2025
**Version**: 2.0.0 (Simplified Advanced Features)
