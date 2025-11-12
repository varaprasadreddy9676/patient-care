# Banner Admin - UI Enhancements

## Overview

This document describes the admin enhancements implemented for the banner management system, including route protection, search/filter, bulk operations, and video/GIF support.

---

## ✅ HIGH PRIORITY (Implemented)

### 1. Admin Service (`frontend/src/services/admin/admin.service.ts`)

**Purpose**: Check if current user has admin role

**Features**:
- Observable `isAdmin$` for reactive UI updates
- Async `checkAdminStatus()` method
- Support for multiple role formats:
  - `user.roles.admin === true`
  - `user.roles.includes('admin')`
  - `user.isAdmin === true`
- `refreshAdminStatus()` - call after login/logout

**Usage**:
```typescript
constructor(private adminService: AdminService) {}

async ngOnInit() {
  const isAdmin = await this.adminService.checkAdminStatus();

  // Or subscribe to changes
  this.adminService.isAdmin$.subscribe(isAdmin => {
    this.showAdminMenu = isAdmin;
  });
}
```

---

### 2. Admin Route Guard (`frontend/src/guards/admin.guard.ts`)

**Purpose**: Protect admin routes from unauthorized access

**Features**:
- Checks if user is authenticated and has admin role
- Shows friendly "Access Denied" alert
- Redirects to /home if not admin
- Already applied to banner-admin and banner-analytics routes

**Protected Routes**:
- `/home/banner-admin` - Banner management page
- `/home/banner-analytics` - Analytics dashboard

**User Experience**:
- Non-admin tries to access → Alert shown → Redirected to home
- Admin accesses → Allowed through

---

### 3. Backend Methods (Added to `banner-admin.page.ts`)

#### Search & Filter

**Properties Added**:
```typescript
searchTerm: string = '';
filterStatus: string = 'all'; // 'all', 'active', 'inactive'
filterLocation: string = 'all'; // 'all', 'home', 'appointments', 'emr'
filteredBanners: any[] = [];
```

**Methods Added**:
- `applyFilters()` - Apply all active filters
- `onSearchChange()` - Called when search term changes
- `onFilterChange()` - Called when filter selection changes
- `clearFilters()` - Reset all filters

**How it works**:
1. Searches banner title and description
2. Filters by active/inactive status
3. Filters by display location
4. Updates `filteredBanners` array

#### Bulk Operations

**Properties Added**:
```typescript
selectedBanners: Set<string> = new Set();
selectAll: boolean = false;
```

**Methods Added**:
- `toggleSelectAll()` - Select/deselect all visible banners
- `toggleSelectBanner(bannerId)` - Toggle individual banner selection
- `updateSelectAllState()` - Update "select all" checkbox state
- `bulkActivate()` - Activate selected banners
- `bulkDeactivate()` - Deactivate selected banners
- `bulkDelete()` - Delete selected banners
- `performBulkOperation(isActive)` - Execute activation/deactivation
- `performBulkDelete()` - Execute deletion

**Features**:
- Select individual banners with checkboxes
- Select all visible banners with master checkbox
- Bulk activate/deactivate/delete
- Confirmation alerts before bulk operations
- Progress indicators during operations
- Success/error toast messages

---

### 4. Video & GIF Support (Added to form)

**New Form Fields**:
```typescript
form: {
  // ...existing fields...
  videoUrl: '',           // YouTube, Vimeo, or direct video URL
  videoType: 'direct',    // 'youtube', 'vimeo', or 'direct'
  videoThumbnail: '',     // Thumbnail image URL
  gifUrl: '',             // GIF URL
  gifBase64: ''           // Base64 encoded GIF
}
```

**Supported Video Types**:
1. **YouTube**: `videoType: 'youtube'`, `videoUrl: 'https://www.youtube.com/watch?v=VIDEO_ID'`
2. **Vimeo**: `videoType: 'vimeo'`, `videoUrl: 'https://vimeo.com/VIDEO_ID'`
3. **Direct**: `videoType: 'direct'`, `videoUrl: 'https://yourdomain.com/video.mp4'`

**GIF Options**:
1. **URL**: `gifUrl: 'https://yourdomain.com/animation.gif'`
2. **Base64**: `gifBase64: 'data:image/gif;base64,...'`

---

## 📋 TO-DO: HTML Template Updates

To complete the implementation, add these UI elements to `banner-admin.page.html`:

### 1. Search & Filter Bar (Add before banner list)

```html
<!-- Search and Filter Section -->
<div class="search-filter-section">
  <ion-searchbar
    [(ngModel)]="searchTerm"
    (ionInput)="onSearchChange()"
    placeholder="Search banners..."
    debounce="300"
  ></ion-searchbar>

  <div class="filter-controls">
    <ion-item>
      <ion-label>Status</ion-label>
      <ion-select [(ngModel)]="filterStatus" (ionChange)="onFilterChange()">
        <ion-select-option value="all">All</ion-select-option>
        <ion-select-option value="active">Active</ion-select-option>
        <ion-select-option value="inactive">Inactive</ion-select-option>
      </ion-select>
    </ion-item>

    <ion-item>
      <ion-label>Location</ion-label>
      <ion-select [(ngModel)]="filterLocation" (ionChange)="onFilterChange()">
        <ion-select-option value="all">All Locations</ion-select-option>
        <ion-select-option value="home">Home</ion-select-option>
        <ion-select-option value="appointments">Appointments</ion-select-option>
        <ion-select-option value="emr">EMR</ion-select-option>
      </ion-select>
    </ion-item>

    <ion-button fill="clear" (click)="clearFilters()">
      <ion-icon name="close-circle" slot="start"></ion-icon>
      Clear Filters
    </ion-button>
  </div>

  <div class="results-info">
    Showing {{ filteredBanners.length }} of {{ banners.length }} banners
  </div>
</div>
```

### 2. Bulk Operations Toolbar (Add after search/filter)

```html
<!-- Bulk Operations Toolbar -->
<div class="bulk-operations-toolbar" *ngIf="selectedBanners.size > 0">
  <div class="selection-info">
    {{ selectedBanners.size }} banner(s) selected
  </div>
  <div class="bulk-actions">
    <ion-button size="small" (click)="bulkActivate()">
      <ion-icon name="checkmark-circle" slot="start"></ion-icon>
      Activate
    </ion-button>
    <ion-button size="small" (click)="bulkDeactivate()">
      <ion-icon name="close-circle" slot="start"></ion-icon>
      Deactivate
    </ion-button>
    <ion-button size="small" color="danger" (click)="bulkDelete()">
      <ion-icon name="trash" slot="start"></ion-icon>
      Delete
    </ion-button>
  </div>
</div>
```

### 3. Select All Checkbox (Add to list header)

```html
<!-- Before the banner list items -->
<ion-item lines="full">
  <ion-checkbox
    slot="start"
    [(ngModel)]="selectAll"
    (ionChange)="toggleSelectAll()"
  ></ion-checkbox>
  <ion-label>
    <strong>Select All</strong>
  </ion-label>
</ion-item>
```

### 4. Selection Checkboxes (Add to each banner item)

```html
<!-- In each banner list item -->
<ion-item *ngFor="let banner of filteredBanners" lines="full">
  <ion-checkbox
    slot="start"
    [checked]="selectedBanners.has(banner._id)"
    (ionChange)="toggleSelectBanner(banner._id)"
  ></ion-checkbox>

  <!-- ...existing banner display content... -->
</ion-item>
```

### 5. Video Fields in Form (Add after image fields)

```html
<!-- Video Upload Section -->
<div *ngIf="form.contentType === 'video' || form.contentType === 'combo'">
  <h3>Video Settings</h3>

  <ion-item>
    <ion-label position="stacked">Video Type</ion-label>
    <ion-select [(ngModel)]="form.videoType">
      <ion-select-option value="youtube">YouTube</ion-select-option>
      <ion-select-option value="vimeo">Vimeo</ion-select-option>
      <ion-select-option value="direct">Direct (MP4/WebM)</ion-select-option>
    </ion-select>
  </ion-item>

  <ion-item>
    <ion-label position="stacked">Video URL</ion-label>
    <ion-input
      type="url"
      [(ngModel)]="form.videoUrl"
      placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
    ></ion-input>
  </ion-item>

  <ion-item>
    <ion-label position="stacked">Video Thumbnail URL (Optional)</ion-label>
    <ion-input
      type="url"
      [(ngModel)]="form.videoThumbnail"
      placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"
    ></ion-input>
  </ion-item>

  <ion-note color="medium">
    <p><strong>YouTube:</strong> Use URL like https://www.youtube.com/watch?v=VIDEO_ID</p>
    <p><strong>Vimeo:</strong> Use URL like https://vimeo.com/VIDEO_ID</p>
    <p><strong>Direct:</strong> Use direct MP4/WebM URL from your server</p>
  </ion-note>
</div>
```

### 6. GIF Fields in Form (Add after video fields)

```html
<!-- GIF Upload Section -->
<div *ngIf="form.contentType === 'gif' || form.contentType === 'combo'">
  <h3>GIF Settings</h3>

  <ion-item>
    <ion-label position="stacked">GIF URL</ion-label>
    <ion-input
      type="url"
      [(ngModel)]="form.gifUrl"
      placeholder="https://yourdomain.com/animations/banner.gif"
    ></ion-input>
  </ion-item>

  <ion-note color="medium">
    <p>Or upload GIF as Base64 (for small files only)</p>
  </ion-note>

  <ion-item>
    <ion-label>Upload GIF File</ion-label>
    <input
      type="file"
      accept="image/gif"
      (change)="onGifFileSelected($event)"
    />
  </ion-item>
</div>
```

### 7. Update Content Type Select

```html
<ion-item>
  <ion-label position="stacked">Content Type</ion-label>
  <ion-select [(ngModel)]="form.contentType">
    <ion-select-option value="text">Text Only</ion-select-option>
    <ion-select-option value="image">Image</ion-select-option>
    <ion-select-option value="video">Video</ion-select-option>
    <ion-select-option value="gif">GIF Animation</ion-select-option>
    <ion-select-option value="combo">Combo (Text + Media)</ion-select-option>
  </ion-select>
</ion-item>
```

---

## 🎨 CSS Styles (Add to `banner-admin.page.scss`)

```scss
// Search and Filter Section
.search-filter-section {
  padding: 1rem;
  background: var(--ion-color-light);
  border-bottom: 1px solid var(--ion-color-light-shade);

  .filter-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .results-info {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: var(--ion-color-medium);
  }
}

// Bulk Operations Toolbar
.bulk-operations-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--ion-color-primary-tint);
  border-bottom: 1px solid var(--ion-color-primary-shade);

  .selection-info {
    font-weight: 500;
    color: var(--ion-color-primary-contrast);
  }

  .bulk-actions {
    display: flex;
    gap: 0.5rem;
  }
}

// Video/GIF sections
.video-preview,
.gif-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--ion-color-light);
  border-radius: 8px;

  img, video {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
  }
}

// Responsive
@media (max-width: 768px) {
  .filter-controls {
    grid-template-columns: 1fr !important;
  }

  .bulk-operations-toolbar {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;

    .bulk-actions {
      justify-content: space-around;
    }
  }
}
```

---

## 💡 Additional Methods Needed (Add to TypeScript)

### Handle GIF File Upload

```typescript
async onGifFileSelected(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.includes('gif')) {
    await this.showToast('Please select a GIF file', 'danger');
    return;
  }

  // Check file size (max 2MB for performance)
  if (file.size > 2 * 1024 * 1024) {
    await this.showToast('GIF file too large. Please keep under 2MB', 'warning');
    return;
  }

  // Convert to base64
  const reader = new FileReader();
  reader.onload = (e: any) => {
    this.form.gifBase64 = e.target.result;
    this.showToast('GIF uploaded successfully', 'success');
  };
  reader.readAsDataURL(file);
}
```

---

## ✅ What's Already Working

1. **Admin Service** - Fully functional, ready to use
2. **Route Guards** - Banner admin routes are protected
3. **Search Logic** - Backend methods ready
4. **Filter Logic** - Backend methods ready
5. **Bulk Operations Logic** - Backend methods ready
6. **Video/GIF Form Fields** - Backend properties ready

## ⚠️ What Needs HTML Updates

1. Add search bar to template
2. Add filter dropdowns to template
3. Add bulk operations toolbar to template
4. Add checkboxes to banner list items
5. Add video fields section to form
6. Add GIF fields section to form
7. Update content type dropdown
8. Add CSS styles

---

## 🚀 Quick Start for Admins

### Step 1: Make Yourself Admin

```javascript
// MongoDB shell
db.users.updateOne(
  { phone: "YOUR_PHONE" },
  { $set: { "roles.admin": true } }
)
```

### Step 2: Logout and Login Again

This refreshes your user session with the admin role.

### Step 3: Access Banner Admin

Navigate to `/home/banner-admin` - you'll now have access!

### Step 4: Complete HTML Updates (Optional)

Add the HTML snippets above to `banner-admin.page.html` to enable:
- Search and filter UI
- Bulk operations toolbar
- Video/GIF upload fields

---

## 📊 Benefits Summary

| Feature | Benefit |
|---------|---------|
| Route Guards | ✅ Secure - only admins access admin pages |
| Admin Service | ✅ Easy to check admin status anywhere |
| Search | ✅ Quickly find banners by title/description |
| Filters | ✅ View only active/inactive or specific locations |
| Bulk Operations | ✅ Manage multiple banners at once |
| Video Support | ✅ YouTube, Vimeo, or direct videos |
| GIF Support | ✅ Animated banners |

---

**Version**: 2.2.0 (Admin Enhancements)
**Last Updated**: November 12, 2025
**Status**: Backend complete, HTML templates need updates
