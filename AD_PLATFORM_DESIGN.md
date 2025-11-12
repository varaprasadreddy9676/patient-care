# 🎯 **COMPREHENSIVE AD MANAGEMENT PLATFORM - DESIGN DOCUMENT**

## **Executive Summary**

Transform the basic advertisement system into a full-featured ad server platform similar to Google Ad Manager or Revive Adserver.

---

## **Current State Analysis**

### **What You Have:**
- ✅ Basic Advertisement model (base64Image, targetUrl, isActive)
- ✅ Simple CRUD controller
- ✅ Frontend carousel component with auto-rotation
- ✅ `/advertisements/list` endpoint for active ads

### **What's Missing:**
- ❌ Advertiser management
- ❌ Campaign management
- ❌ Zone/placement management
- ❌ Advanced targeting (frequency, geo, URL, device)
- ❌ Click/impression tracking
- ❌ Statistics & reporting
- ❌ Self-service dashboard for clients
- ❌ Ad network integration
- ❌ Invocation codes/tags

---

## **System Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                  AD MANAGEMENT PLATFORM                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Advertisers │  │  Campaigns   │  │   Banners    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Zones     │  │  Zone Links  │  │  Invocation  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Targeting   │  │   Tracking   │  │  Statistics  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Ad Selection Engine (Real-time)  │
        └───────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼──────┐        ┌──────▼──────┐
        │  Mobile App  │        │  Dashboard  │
        │  (Zones)     │        │  (Clients)  │
        └──────────────┘        └─────────────┘
```

---

## **Database Schema Design**

### **1. Advertisers Collection**

```javascript
{
  _id: ObjectId,
  name: String,                    // "ABC Hospital", "XYZ Pharma"
  email: String,
  phone: String,
  contactPerson: String,
  billingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  accountType: String,             // 'self-service', 'managed', 'network'
  status: String,                  // 'active', 'inactive', 'suspended'
  creditLimit: Number,             // Budget limit
  logo: String,                    // Base64 or URL
  userId: ObjectId,                // Link to user who can manage this advertiser
  createdAt: Date,
  updatedAt: Date
}
```

### **2. Campaigns Collection**

```javascript
{
  _id: ObjectId,
  advertiserId: ObjectId,          // Reference to Advertiser
  name: String,                    // "Summer Health Checkup 2025"
  description: String,
  campaignType: String,            // 'banner', 'video', 'native', 'text'

  // Scheduling
  startDate: Date,
  endDate: Date,
  timezone: String,

  // Budget & Pricing
  budget: {
    total: Number,
    daily: Number,
    spent: Number
  },
  pricing: {
    model: String,                 // 'CPM', 'CPC', 'CPA', 'flat'
    rate: Number
  },

  // Delivery
  deliveryType: String,            // 'standard', 'accelerated'
  priority: Number,                // 1-10, higher = more priority
  weight: Number,                  // For weighted rotation

  // Targeting
  targeting: {
    // Geo-targeting
    countries: [String],
    regions: [String],
    cities: [String],

    // Device targeting
    devices: [String],             // ['mobile', 'tablet', 'desktop']
    os: [String],                  // ['iOS', 'Android', 'Windows']

    // URL targeting
    urlPatterns: [String],         // ['/home', '/appointment*']
    excludeUrls: [String],

    // User targeting
    userSegments: [String],        // ['new-users', 'returning-users']
    languages: [String],

    // Time targeting
    dayParting: {
      monday: { start: String, end: String },
      tuesday: { start: String, end: String },
      // ... other days
    }
  },

  // Frequency Capping
  frequencyCap: {
    impressions: Number,           // Max impressions per user
    period: String,                // 'hour', 'day', 'week', 'month', 'lifetime'
    clicks: Number
  },

  // Status
  status: String,                  // 'draft', 'active', 'paused', 'completed', 'archived'

  // Stats (cached)
  stats: {
    impressions: Number,
    clicks: Number,
    conversions: Number,
    spend: Number,
    lastUpdated: Date
  },

  createdAt: Date,
  updatedAt: Date
}
```

### **3. Banners Collection**

```javascript
{
  _id: ObjectId,
  campaignId: ObjectId,            // Reference to Campaign
  name: String,                    // "Banner 1 - 728x90"

  // Creative
  type: String,                    // 'image', 'html', 'video', 'text'
  size: {
    width: Number,
    height: Number
  },

  // Image banner
  imageUrl: String,                // URL or base64
  imageFile: {
    url: String,
    size: Number,
    mimeType: String
  },

  // HTML banner
  htmlCode: String,

  // Video banner
  videoUrl: String,
  videoDuration: Number,

  // Text banner
  title: String,
  description: String,

  // Destination
  destinationUrl: String,          // Where click goes
  altText: String,

  // Tracking
  trackingPixels: [{
    type: String,                  // 'impression', 'click', 'conversion'
    url: String
  }],

  // Status
  status: String,                  // 'active', 'paused', 'archived'
  weight: Number,                  // For A/B testing

  // Stats (cached)
  stats: {
    impressions: Number,
    clicks: Number,
    ctr: Number,                   // Click-through rate
    conversions: Number,
    lastUpdated: Date
  },

  createdAt: Date,
  updatedAt: Date
}
```

### **4. Zones Collection**

```javascript
{
  _id: ObjectId,
  name: String,                    // "Home Page Banner", "Sidebar 300x250"
  description: String,

  // Zone configuration
  size: {
    width: Number,
    height: Number,
    type: String                   // 'fixed', 'responsive', 'fluid'
  },

  // Placement
  placement: String,               // 'header', 'sidebar', 'footer', 'inline'
  page: String,                    // '/home', '/appointment-booking'

  // Ad selection
  adTypes: [String],               // ['image', 'html', 'video']
  maxAdsPerPage: Number,           // How many ads to show
  rotationMethod: String,          // 'weighted', 'random', 'sequential'

  // Appearance
  showCloseButton: Boolean,
  backgroundColor: String,
  borderStyle: String,

  // Default content (when no ad available)
  defaultContent: {
    type: String,                  // 'blank', 'house_ad', 'custom'
    html: String
  },

  // Status
  status: String,                  // 'active', 'inactive'

  // Invocation code (generated)
  invocationCode: String,          // Unique code for this zone

  // Stats (cached)
  stats: {
    requests: Number,
    impressions: Number,
    blankImpressions: Number,
    clicks: Number,
    lastUpdated: Date
  },

  createdAt: Date,
  updatedAt: Date
}
```

### **5. Zone-Campaign Links Collection**

```javascript
{
  _id: ObjectId,
  zoneId: ObjectId,                // Reference to Zone
  campaignId: ObjectId,            // Reference to Campaign
  priority: Number,                // Override campaign priority for this zone
  weight: Number,                  // Override weight
  status: String,                  // 'active', 'paused'
  createdAt: Date
}
```

### **6. Impressions Collection** (High-volume, use TTL index)

```javascript
{
  _id: ObjectId,

  // What was shown
  bannerId: ObjectId,
  campaignId: ObjectId,
  advertiserId: ObjectId,
  zoneId: ObjectId,

  // Context
  userId: ObjectId,                // Who saw it (optional)
  sessionId: String,

  // Request details
  requestedAt: Date,
  displayedAt: Date,

  // User info
  ipAddress: String,
  userAgent: String,
  device: String,                  // 'mobile', 'tablet', 'desktop'
  os: String,
  browser: String,

  // Location (from IP)
  geo: {
    country: String,
    region: String,
    city: String,
    lat: Number,
    lng: Number
  },

  // Page info
  pageUrl: String,
  referrer: String,

  // Outcome
  wasBlank: Boolean,               // No ad available
  clicked: Boolean,
  clickedAt: Date,
  converted: Boolean,
  convertedAt: Date,
  conversionValue: Number,

  // TTL - auto-delete after 90 days
  expiresAt: Date
}
```

### **7. Statistics Collection** (Hourly summaries)

```javascript
{
  _id: ObjectId,

  // Dimensions
  hour: Date,                      // Rounded to hour
  advertiserId: ObjectId,
  campaignId: ObjectId,
  bannerId: ObjectId,
  zoneId: ObjectId,

  // Metrics
  requests: Number,
  impressions: Number,
  blankImpressions: Number,
  clicks: Number,
  conversions: Number,

  // Calculated
  ctr: Number,                     // Click-through rate
  conversionRate: Number,
  spend: Number,
  revenue: Number,

  createdAt: Date,
  updatedAt: Date
}
```

### **8. User Frequency Collection** (For frequency capping)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                // Or sessionId for anonymous
  sessionId: String,
  campaignId: ObjectId,

  // Counts
  impressions: Number,
  clicks: Number,

  // Time windows
  lastImpressionAt: Date,
  lastClickAt: Date,

  // Period tracking
  hourlyImpressions: Number,
  dailyImpressions: Number,
  weeklyImpressions: Number,
  monthlyImpressions: Number,

  // TTL - auto-delete after campaign ends + 30 days
  expiresAt: Date
}
```

### **9. Ad Networks Collection** (External networks)

```javascript
{
  _id: ObjectId,
  name: String,                    // "Google AdSense", "Facebook Audience Network"
  type: String,                    // 'adsense', 'facebook', 'custom'

  // Configuration
  config: {
    publisherId: String,
    appId: String,
    apiKey: String,
    adUnitId: String
  },

  // Settings
  priority: Number,
  fillRate: Number,                // Historical fill rate
  minECPM: Number,                 // Minimum eCPM to show

  status: String,                  // 'active', 'inactive'
  createdAt: Date
}
```

---

## **API Endpoints Design**

### **Advertisers API**
```
POST   /api/advertisers              Create advertiser
GET    /api/advertisers              List all advertisers
GET    /api/advertisers/:id          Get advertiser details
PUT    /api/advertisers/:id          Update advertiser
DELETE /api/advertisers/:id          Delete advertiser
GET    /api/advertisers/:id/stats    Get advertiser statistics
```

### **Campaigns API**
```
POST   /api/campaigns                Create campaign
GET    /api/campaigns                List campaigns (filter by advertiser)
GET    /api/campaigns/:id            Get campaign details
PUT    /api/campaigns/:id            Update campaign
DELETE /api/campaigns/:id            Delete campaign
POST   /api/campaigns/:id/pause      Pause campaign
POST   /api/campaigns/:id/resume     Resume campaign
GET    /api/campaigns/:id/stats      Get campaign statistics
POST   /api/campaigns/:id/clone      Clone campaign
```

### **Banners API**
```
POST   /api/banners                  Create banner
GET    /api/banners                  List banners (filter by campaign)
GET    /api/banners/:id              Get banner details
PUT    /api/banners/:id              Update banner
DELETE /api/banners/:id              Delete banner
POST   /api/banners/upload           Upload image/video
GET    /api/banners/:id/stats        Get banner statistics
```

### **Zones API**
```
POST   /api/zones                    Create zone
GET    /api/zones                    List all zones
GET    /api/zones/:id                Get zone details
PUT    /api/zones/:id                Update zone
DELETE /api/zones/:id                Delete zone
GET    /api/zones/:id/code           Get invocation code
POST   /api/zones/:id/link           Link campaign to zone
DELETE /api/zones/:id/link/:linkId   Unlink campaign
GET    /api/zones/:id/stats          Get zone statistics
```

### **Ad Serving API** (Public, high-performance)
```
GET    /api/ads/serve                Serve ad for a zone
POST   /api/ads/impression           Track impression
POST   /api/ads/click                Track click
POST   /api/ads/conversion           Track conversion
```

### **Statistics API**
```
GET    /api/stats/dashboard          Dashboard overview
GET    /api/stats/advertisers/:id    Advertiser stats (date range)
GET    /api/stats/campaigns/:id      Campaign stats (date range)
GET    /api/stats/banners/:id        Banner stats (date range)
GET    /api/stats/zones/:id          Zone stats (date range)
POST   /api/stats/report             Generate custom report
POST   /api/stats/export             Export stats (CSV/Excel)
```

### **Ad Networks API**
```
POST   /api/ad-networks              Add network
GET    /api/ad-networks              List networks
PUT    /api/ad-networks/:id          Update network
DELETE /api/ad-networks/:id          Remove network
```

---

## **Ad Selection Algorithm**

### **Real-time Ad Selection Flow:**

```javascript
// When zone requests an ad:

1. **Identify Zone**
   - Get zone configuration
   - Get zone size, page, placement

2. **Find Eligible Campaigns**
   - Status = 'active'
   - Budget available
   - Within date range
   - Linked to this zone

3. **Apply Targeting Filters**
   - Geo-targeting: Match user location
   - Device targeting: Match user device
   - URL targeting: Match current page
   - Time targeting: Match current time
   - User segment: Match user profile

4. **Check Frequency Caps**
   - Get user impression count for each campaign
   - Filter out campaigns that exceeded cap

5. **Calculate Priorities**
   - Sort by: priority × weight × budget_remaining

6. **Select Banner**
   - Pick top campaign
   - Pick random/weighted banner from campaign
   - If A/B testing: use weight distribution

7. **Check Ad Network Fallback**
   - If no banner found, try ad networks
   - Check network priority and eCPM

8. **Return Ad or Blank**
   - If ad found: return banner
   - If not: return default content or blank

9. **Track Request**
   - Log impression
   - Update user frequency counter
```

### **Priority Calculation Formula:**

```javascript
score = (
  campaign.priority * 100 +
  campaign.weight * 10 +
  (campaign.budget.remaining / campaign.budget.total) * 50
)
```

---

## **Frequency Capping Implementation**

### **Strategy: Redis + MongoDB**

**Redis** (for real-time checks):
```javascript
// Key structure
user:{userId}:campaign:{campaignId}:impressions:hour
user:{userId}:campaign:{campaignId}:impressions:day
user:{userId}:campaign:{campaignId}:clicks:day

// Increment on impression
INCR user:123:campaign:456:impressions:hour
EXPIRE user:123:campaign:456:impressions:hour 3600

// Check before serving
count = GET user:123:campaign:456:impressions:day
if (count >= campaign.frequencyCap.impressions) {
  exclude campaign
}
```

**MongoDB** (for persistence & reporting):
```javascript
// Sync Redis counters to MongoDB every hour
// Used for statistics and long-term tracking
```

---

## **Invocation Code (Tag) Generation**

### **Zone Invocation Code:**

```html
<!-- Simple Image Tag -->
<div id="medics-ad-zone-{zoneId}">
  <img src="https://yourapp.com/api/ads/serve?zone={zoneId}&noscript=1"
       alt="Advertisement" />
</div>

<!-- JavaScript Tag (Advanced) -->
<div id="medics-ad-zone-{zoneId}"></div>
<script async src="https://yourapp.com/ads.js?zone={zoneId}"></script>

<!-- Async Tag with Targeting -->
<script>
  (function() {
    var ad = document.createElement('script');
    ad.async = true;
    ad.src = 'https://yourapp.com/ads.js?zone={zoneId}&page=' +
             encodeURIComponent(window.location.href);
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ad, s);
  })();
</script>
```

---

## **Statistics Processing**

### **Hourly Aggregation (Cron Job):**

```javascript
// Run every hour at :05 (e.g., 1:05, 2:05, 3:05)
async function aggregateStatistics() {
  const lastHour = new Date();
  lastHour.setHours(lastHour.getHours() - 1, 0, 0, 0);

  // Group impressions by dimensions
  const stats = await Impression.aggregate([
    {
      $match: {
        displayedAt: {
          $gte: lastHour,
          $lt: new Date(lastHour.getTime() + 3600000)
        }
      }
    },
    {
      $group: {
        _id: {
          advertiserId: '$advertiserId',
          campaignId: '$campaignId',
          bannerId: '$bannerId',
          zoneId: '$zoneId',
          hour: lastHour
        },
        requests: { $sum: 1 },
        impressions: {
          $sum: { $cond: [{ $eq: ['$wasBlank', false] }, 1, 0] }
        },
        blankImpressions: {
          $sum: { $cond: [{ $eq: ['$wasBlank', true] }, 1, 0] }
        },
        clicks: {
          $sum: { $cond: ['$clicked', 1, 0] }
        },
        conversions: {
          $sum: { $cond: ['$converted', 1, 0] }
        }
      }
    }
  ]);

  // Save to Statistics collection
  for (const stat of stats) {
    await Statistics.create({
      hour: stat._id.hour,
      advertiserId: stat._id.advertiserId,
      campaignId: stat._id.campaignId,
      bannerId: stat._id.bannerId,
      zoneId: stat._id.zoneId,
      requests: stat.requests,
      impressions: stat.impressions,
      blankImpressions: stat.blankImpressions,
      clicks: stat.clicks,
      conversions: stat.conversions,
      ctr: stat.clicks / stat.impressions * 100,
      conversionRate: stat.conversions / stat.clicks * 100
    });
  }

  // Update campaign cached stats
  await updateCampaignStats();
}
```

---

## **Frontend Dashboard Design**

### **Dashboard Pages:**

1. **Overview Dashboard**
   - Total impressions, clicks, CTR (today, this week, this month)
   - Top performing campaigns
   - Budget utilization
   - Zone performance

2. **Advertisers Page**
   - List all advertisers
   - Create/edit advertiser
   - View advertiser stats

3. **Campaigns Page**
   - List campaigns (filterable)
   - Create/edit campaign
   - Campaign wizard (step-by-step)
   - View campaign stats

4. **Banners Page**
   - List banners by campaign
   - Upload/create banner
   - Preview banner
   - A/B test setup

5. **Zones Page**
   - List zones
   - Create/edit zone
   - Get invocation code
   - Link campaigns to zones
   - View zone stats

6. **Reports Page**
   - Custom date range reports
   - Export to CSV/Excel
   - Comparison reports
   - Performance graphs

7. **Settings Page**
   - Ad network configuration
   - User permissions
   - Default settings

---

## **Technology Stack**

### **Backend:**
- ✅ Node.js + Express (existing)
- ✅ MongoDB (existing)
- 🆕 Redis (for frequency capping)
- 🆕 Bull Queue (for async processing)
- 🆕 Node-Cron (for hourly stats)

### **Frontend:**
- ✅ Angular 18 + Ionic (existing)
- 🆕 Chart.js / NgxCharts (for graphs)
- 🆕 AG Grid (for data tables)
- 🆕 Angular Material (for dashboard)

### **Infrastructure:**
- 🆕 CDN for ad assets (Cloudflare/AWS CloudFront)
- 🆕 Load balancer (for ad serving)
- 🆕 Caching layer (Redis)

---

## **Implementation Roadmap**

### **Phase 1: Core Models & API** (3-4 weeks)
- Database schema implementation
- Advertisers CRUD
- Campaigns CRUD
- Banners CRUD
- Zones CRUD
- Zone-Campaign linking

### **Phase 2: Ad Serving Engine** (2-3 weeks)
- Ad selection algorithm
- Targeting logic
- Frequency capping (Redis)
- Impression tracking
- Click tracking
- Invocation code generation

### **Phase 3: Statistics & Reporting** (2 weeks)
- Hourly aggregation cron
- Statistics API
- Dashboard overview
- Campaign reports
- Export functionality

### **Phase 4: Client Dashboard** (4-5 weeks)
- Advertiser management UI
- Campaign creation wizard
- Banner upload & management
- Zone configuration
- Invocation code generator
- Statistics visualization

### **Phase 5: Advanced Features** (2-3 weeks)
- Ad network integration
- Geo-targeting (IP to location)
- A/B testing
- Conversion tracking
- Fraud detection
- Advanced reporting

### **Phase 6: Optimization & Polish** (1-2 weeks)
- Performance optimization
- Caching strategies
- Mobile responsiveness
- User permissions
- Documentation

---

## **Effort Estimate Summary**

| Phase | Duration | Developer Days |
|-------|----------|----------------|
| Phase 1: Core Models & API | 3-4 weeks | 15-20 days |
| Phase 2: Ad Serving Engine | 2-3 weeks | 10-15 days |
| Phase 3: Statistics | 2 weeks | 10 days |
| Phase 4: Client Dashboard | 4-5 weeks | 20-25 days |
| Phase 5: Advanced Features | 2-3 weeks | 10-15 days |
| Phase 6: Optimization | 1-2 weeks | 5-10 days |
| **TOTAL** | **14-19 weeks** | **70-95 days** |

**With 2 developers:** 10-12 weeks (2.5-3 months)
**With 3 developers:** 7-9 weeks (1.5-2 months)

---

## **Key Features Summary**

✅ **Multi-Advertiser Support** - Unlimited advertisers
✅ **Campaign Management** - Create, schedule, budget campaigns
✅ **Banner Management** - Upload, A/B test, multiple formats
✅ **Zone Management** - Define placements with invocation codes
✅ **Advanced Targeting** - Geo, device, URL, time, frequency capping
✅ **Real-time Ad Serving** - Fast ad selection algorithm
✅ **Comprehensive Tracking** - Impressions, clicks, conversions
✅ **Statistics Dashboard** - Hourly summaries, custom reports
✅ **Self-Service Portal** - Clients manage their own ads
✅ **Ad Network Integration** - Fallback to external networks
✅ **Export & Reporting** - CSV, Excel exports

---

**Next Steps:**
1. Review this design document
2. Approve scope & timeline
3. Prioritize features (MVP vs Full)
4. Start Phase 1 implementation

**Created:** 2025-11-12
**Version:** 1.0
