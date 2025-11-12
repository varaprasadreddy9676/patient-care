# 🚀 **AD PLATFORM - MVP IMPLEMENTATION PLAN**

## **MVP Scope (Minimum Viable Product)**

Start with core features, iterate based on feedback.

---

## **MVP Features (6-8 weeks)**

### **✅ Must Have (Core)**

1. **Advertiser Management**
   - Create/edit advertisers
   - Basic info (name, contact, logo)

2. **Campaign Management**
   - Create/edit campaigns
   - Set start/end dates
   - Set budget & pricing
   - Status (active/paused)
   - Link to zones

3. **Banner Management**
   - Upload images
   - Set destination URL
   - Multiple banners per campaign

4. **Zone Management**
   - Define zones (name, size, page)
   - Generate invocation code
   - Link campaigns to zones

5. **Ad Serving**
   - Basic ad selection (priority-based)
   - Return banner for zone
   - Simple targeting (by zone)

6. **Tracking**
   - Impressions (when ad shown)
   - Clicks (when ad clicked)

7. **Basic Dashboard**
   - List advertisers/campaigns/banners/zones
   - View basic stats (impressions, clicks, CTR)

### **🔄 Phase 2 (Add Later)**

- Frequency capping
- Geo-targeting
- URL targeting
- Device targeting
- Ad networks
- Conversion tracking
- Advanced reports
- A/B testing

---

## **MVP Database Schema (Simplified)**

### **1. Advertisers**
```javascript
{
  _id, name, email, contactPerson, logo, status,
  userId,  // Who manages this advertiser
  createdAt, updatedAt
}
```

### **2. Campaigns**
```javascript
{
  _id, advertiserId, name, description,
  startDate, endDate,
  budget: { total, spent },
  pricing: { model, rate },
  priority, weight,
  status,
  createdAt, updatedAt
}
```

### **3. Banners**
```javascript
{
  _id, campaignId, name,
  imageUrl,  // Base64 or URL
  destinationUrl,
  size: { width, height },
  status, weight,
  createdAt, updatedAt
}
```

### **4. Zones**
```javascript
{
  _id, name, description,
  size: { width, height },
  page,  // Where it appears
  invocationCode,  // Unique code
  status,
  createdAt, updatedAt
}
```

### **5. ZoneCampaignLinks**
```javascript
{
  _id, zoneId, campaignId,
  priority, status,
  createdAt
}
```

### **6. Impressions**
```javascript
{
  _id,
  bannerId, campaignId, advertiserId, zoneId,
  userId, sessionId,
  displayedAt,
  ipAddress, userAgent,
  pageUrl,
  clicked, clickedAt,
  expiresAt  // TTL index (delete after 90 days)
}
```

---

## **MVP API Endpoints**

### **Advertisers**
```
POST   /api/advertisers
GET    /api/advertisers
GET    /api/advertisers/:id
PUT    /api/advertisers/:id
DELETE /api/advertisers/:id
```

### **Campaigns**
```
POST   /api/campaigns
GET    /api/campaigns
GET    /api/campaigns/:id
PUT    /api/campaigns/:id
DELETE /api/campaigns/:id
POST   /api/campaigns/:id/pause
POST   /api/campaigns/:id/resume
```

### **Banners**
```
POST   /api/banners
GET    /api/banners
GET    /api/banners/:id
PUT    /api/banners/:id
DELETE /api/banners/:id
POST   /api/banners/upload
```

### **Zones**
```
POST   /api/zones
GET    /api/zones
GET    /api/zones/:id
PUT    /api/zones/:id
DELETE /api/zones/:id
POST   /api/zones/:id/link
GET    /api/zones/:id/campaigns
```

### **Ad Serving (Public)**
```
GET    /api/ads/serve?zone={zoneId}
POST   /api/ads/impression
POST   /api/ads/click
```

### **Stats**
```
GET    /api/stats/advertisers/:id
GET    /api/stats/campaigns/:id
GET    /api/stats/banners/:id
GET    /api/stats/zones/:id
```

---

## **MVP Ad Selection Algorithm (Simple)**

```javascript
async function selectAd(zoneId, userId, pageUrl) {
  // 1. Get zone
  const zone = await Zone.findById(zoneId);

  // 2. Get active campaigns linked to this zone
  const links = await ZoneCampaignLink.find({
    zoneId: zoneId,
    status: 'active'
  }).populate('campaignId');

  // 3. Filter active campaigns within date range
  const now = new Date();
  const eligibleCampaigns = links.filter(link => {
    const campaign = link.campaignId;
    return (
      campaign.status === 'active' &&
      campaign.startDate <= now &&
      campaign.endDate >= now &&
      campaign.budget.spent < campaign.budget.total
    );
  });

  if (eligibleCampaigns.length === 0) {
    return null;  // No ad available
  }

  // 4. Sort by priority (highest first)
  eligibleCampaigns.sort((a, b) => {
    return (b.campaignId.priority * b.priority) -
           (a.campaignId.priority * a.priority);
  });

  // 5. Select top campaign
  const selectedCampaign = eligibleCampaigns[0].campaignId;

  // 6. Get active banners from campaign
  const banners = await Banner.find({
    campaignId: selectedCampaign._id,
    status: 'active'
  });

  if (banners.length === 0) {
    return null;
  }

  // 7. Random banner selection
  const selectedBanner = banners[
    Math.floor(Math.random() * banners.length)
  ];

  return {
    banner: selectedBanner,
    campaign: selectedCampaign
  };
}
```

---

## **MVP Dashboard Pages**

### **1. Dashboard (Overview)**
```
/dashboard

Components:
- Total impressions (today, this week, this month)
- Total clicks
- CTR
- Active campaigns count
- Recent impressions chart
```

### **2. Advertisers**
```
/dashboard/advertisers

Features:
- List table (name, contact, status, actions)
- Create button
- Edit modal
- Delete confirmation
```

### **3. Campaigns**
```
/dashboard/campaigns

Features:
- List table (name, advertiser, dates, budget, status)
- Filter by advertiser
- Create button
- Edit modal with tabs:
  - Basic Info
  - Budget & Dates
  - Link to Zones
- Pause/Resume buttons
```

### **4. Banners**
```
/dashboard/banners

Features:
- Grid/list view
- Filter by campaign
- Upload button
- Preview modal
- Edit modal
```

### **5. Zones**
```
/dashboard/zones

Features:
- List table
- Create button
- Edit modal
- "Get Code" button (shows invocation code)
- Link campaigns modal
```

### **6. Statistics**
```
/dashboard/stats

Features:
- Date range picker
- Select advertiser/campaign/zone
- Table with:
  - Impressions
  - Clicks
  - CTR
  - Date breakdown
- Basic line chart
```

---

## **MVP Implementation Tasks**

### **Week 1-2: Backend Core**

**Tasks:**
- [ ] Create database models (Advertiser, Campaign, Banner, Zone, Link, Impression)
- [ ] Add indexes
- [ ] Create API controllers for CRUD
- [ ] Test CRUD endpoints with Postman

**Deliverables:**
- All models created
- All CRUD APIs working
- Postman collection

---

### **Week 3-4: Ad Serving Engine**

**Tasks:**
- [ ] Implement ad selection algorithm
- [ ] Create `/api/ads/serve` endpoint
- [ ] Create `/api/ads/impression` endpoint
- [ ] Create `/api/ads/click` endpoint
- [ ] Generate invocation codes
- [ ] Test ad serving

**Deliverables:**
- Ad serving working
- Click tracking working
- Impression tracking working

---

### **Week 5-6: Statistics & Reports**

**Tasks:**
- [ ] Create statistics aggregation queries
- [ ] Create stats API endpoints
- [ ] Add CTR calculations
- [ ] Test stats APIs

**Deliverables:**
- Stats APIs working
- Accurate impression/click counts

---

### **Week 7-8: Dashboard UI**

**Tasks:**
- [ ] Create dashboard layout (sidebar, header)
- [ ] Advertisers page (list, create, edit, delete)
- [ ] Campaigns page (list, create, edit, delete, pause/resume)
- [ ] Banners page (list, upload, edit, delete)
- [ ] Zones page (list, create, edit, get code)
- [ ] Statistics page (basic table)

**Deliverables:**
- Complete dashboard UI
- All CRUD operations working
- Invocation code copy-paste

---

## **MVP Success Criteria**

✅ Client can create advertiser
✅ Client can create campaign with dates & budget
✅ Client can upload multiple banners
✅ Client can create zones
✅ Client can link campaigns to zones
✅ Client can get invocation code for zone
✅ Ad serves correctly when zone code is used
✅ Impressions are tracked
✅ Clicks are tracked
✅ Client can view stats (impressions, clicks, CTR)

---

## **MVP Effort Estimate**

| Component | Time | Developer Days |
|-----------|------|----------------|
| Backend Models & CRUD | 1.5 weeks | 7-8 days |
| Ad Serving Engine | 1.5 weeks | 7-8 days |
| Statistics | 1 week | 5 days |
| Dashboard UI | 2 weeks | 10 days |
| Testing & Bug Fixes | 1 week | 5 days |
| **TOTAL** | **7-8 weeks** | **34-36 days** |

**With 2 developers:** 5-6 weeks
**With 3 developers:** 4 weeks

---

## **Tech Stack (MVP)**

### **Backend:**
- ✅ Node.js + Express
- ✅ MongoDB + Mongoose
- 🆕 Multer (for image uploads)
- 🆕 Sharp (for image processing)

### **Frontend:**
- ✅ Angular 18 + Ionic
- 🆕 Angular Material (data tables, forms)
- 🆕 Chart.js (basic graphs)
- 🆕 ngx-clipboard (copy invocation code)

---

## **Post-MVP Enhancements**

After MVP is live and validated:

**Phase 2 (2-3 weeks):**
- Frequency capping (Redis)
- Geo-targeting (IP to location service)
- URL targeting
- Device targeting

**Phase 3 (2-3 weeks):**
- A/B testing
- Conversion tracking
- Advanced reports with charts
- Export to CSV/Excel

**Phase 4 (2 weeks):**
- Ad network integration (AdSense, etc.)
- Fraud detection
- User roles & permissions
- Multi-language support

---

## **Quick Start (Next Steps)**

1. **Review MVP scope** - Does it match your needs?
2. **Approve timeline** - 7-8 weeks acceptable?
3. **Assign resources** - How many developers?
4. **Start Week 1** - Database models & CRUD

**Want me to start building the MVP?** I can begin with the database models and API controllers.

---

**Created:** 2025-11-12
**Version:** 1.0 (MVP)
