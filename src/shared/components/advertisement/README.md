# Advertisement Component

A lightweight, high-performance carousel component for displaying advertisements in the MedicsCare application.

## Features

- 🚀 **High Performance**: GPU-accelerated smooth animations
- 📱 **Responsive Design**: Works seamlessly on mobile and desktop
- 🔄 **Auto-rotation**: Automatic carousel rotation with pause on hover
- 🎯 **Touch Gestures**: Swipe navigation on mobile devices
- 🖼️ **Multiple Image Sources**: Supports local files, URLs, and base64 images
- 🌐 **Click Navigation**: Opens links in new tabs on click
- 📊 **Event Emissions**: Track user interactions

## Basic Usage

```html
<!-- Simple usage with default settings -->
<app-advertisement></app-advertisement>

<!-- With custom settings -->
<app-advertisement
  [autoRotate]="true"
  [rotationInterval]="4000"
  [showDots]="true">
</app-advertisement>

<!-- With custom advertisements from server -->
<app-advertisement
  [customAds]="serverAds"
  [autoRotate]="true">
</app-advertisement>
```

## Configuration Options

### AdvertisementConfig Interface

```typescript
export interface AdvertisementConfig {
  maxAds?: number;              // Maximum number of ads to display (0 = no limit)
  category?: string;            // Filter ads by category (e.g., 'health', 'promotions')
  layout?: 'single' | 'carousel';  // Layout type: single = vertical stack, carousel = horizontal scroll
  showCarouselDots?: boolean;   // Show navigation dots for carousel (default: true)
  autoRotate?: boolean;         // Enable automatic rotation in carousel mode (default: false)
  rotationInterval?: number;    // Auto-rotation interval in milliseconds (default: 4000ms = 4 seconds)
  dismissible?: boolean;        // Allow users to dismiss ads globally (default: false)
}
```

## Layout Examples

### Single Layout (Default)
```html
<app-advertisement [config]="{ layout: 'single' }"></app-advertisement>
```
- Displays ads in a vertical stack
- Best for sidebars or main content areas
- Shows all advertisements at once

### Carousel Layout with Auto-Scroll
```html
<app-advertisement 
  [config]="{ 
    layout: 'carousel',
    autoRotate: true,
    rotationInterval: 4000,
    showCarouselDots: true
  }">
</app-advertisement>
```
- Displays ads in a horizontal carousel
- **Auto-scrolls** through advertisements every 4 seconds (configurable)
- **Pauses on hover** for better user experience
- Great for banner areas or featured promotions
- Shows navigation dots for manual control

## Auto-Scroll Configuration

### Basic Auto-Scroll Setup
```typescript
// Component configuration
advertisementConfig: AdvertisementConfig = {
  layout: 'carousel',           // Required for auto-scroll
  autoRotate: true,            // Enable auto-scroll
  rotationInterval: 3000,      // 3 seconds per slide (configurable)
  showCarouselDots: true,      // Show navigation dots
  dismissible: true            // Allow dismissing ads
};
```

### Auto-Scroll Features:
- ⏰ **Configurable timing**: Set any interval (default: 4000ms = 4 seconds)
- ⏸️ **Pause on hover**: Automatically pauses when user hovers over ads
- ▶️ **Resume on leave**: Resumes auto-scroll when mouse leaves the area
- 🎯 **Manual control**: Users can click dots to navigate manually
- 📱 **Responsive**: Works seamlessly on mobile and desktop

### Example: Fast Auto-Scroll
```html
<app-advertisement 
  [config]="{
    layout: 'carousel',
    autoRotate: true,
    rotationInterval: 2000,     // 2 seconds - fast rotation
    showCarouselDots: false     // Hide dots for cleaner look
  }"
  category="promotions">
</app-advertisement>
```

### Example: Slow Auto-Scroll
```html
<app-advertisement 
  [config]="{
    layout: 'carousel',
    autoRotate: true,
    rotationInterval: 8000,     // 8 seconds - slow rotation
    showCarouselDots: true,
    maxAds: 3                   // Limit to 3 ads
  }"
  category="health">
</app-advertisement>
```

## Event Handling

```html
<app-advertisement 
  (advertisementClick)="onAdClick($event)"
  (advertisementsLoaded)="onAdsLoaded($event)">
</app-advertisement>
```

```typescript
onAdClick(advertisement: Advertisement) {
  console.log('Ad clicked:', advertisement.title);
  // Custom handling logic
}

onAdsLoaded(advertisements: Advertisement[]) {
  console.log('Loaded', advertisements.length, 'advertisements');
}
```

## Custom Advertisement Data

```html
<app-advertisement [customAds]="myCustomAds"></app-advertisement>
```

```typescript
myCustomAds: Advertisement[] = [
  {
    id: 'custom-1',
    title: 'Special Offer',
    description: 'Limited time only',
    mediaType: 'image',
    mediaUrl: '/assets/my-ad.jpg',
    targetUrl: '/special-offer',
    isActive: true,
    displayOrder: 1
  }
];
```

## Real-world Examples

### Home Page (Current Implementation)
```typescript
// Component configuration with auto-scroll
advertisementConfig: AdvertisementConfig = {
  layout: 'carousel',
  showCarouselDots: true,
  autoRotate: true,
  rotationInterval: 4000,      // Auto-scroll every 4 seconds
  dismissible: true
};
```

```html
<app-advertisement 
  [config]="advertisementConfig"
  category="health"
  (ctaClick)="onAdvertisementCtaClick($event)"
  (advertisementDismissed)="onAdvertisementDismissed($event)">
</app-advertisement>
```

This configuration provides:
- Auto-scrolling carousel of health-related ads
- 4-second intervals between slides
- Pause on hover functionality
- Dismissible ads for better UX
- Navigation dots for manual control

### Sidebar Promotions
```typescript
sidebarConfig: AdvertisementConfig = {
  layout: 'vertical',
  maxAds: 2,
  showDescription: false,
  category: 'promotions'
};
```

### Header Banner
```typescript
bannerConfig: AdvertisementConfig = {
  layout: 'horizontal',
  maxAds: 1,
  autoRotate: true,
  rotationInterval: 5000
};
```

### Appointment Page Grid
```typescript
appointmentAdsConfig: AdvertisementConfig = {
  layout: 'grid',
  maxAds: 6,
  category: 'services'
};
```

## Styling Customization

The component uses CSS custom properties for easy theming:

```scss
app-advertisement {
  --ad-border-radius: 8px;
  --ad-shadow: 0 2px 4px rgba(0,0,0,0.1);
  --ad-hover-shadow: 0 4px 8px rgba(0,0,0,0.15);
}
```

## API Integration

To connect with real server data, modify the `AdvertisementService`:

```typescript
// In AdvertisementService
async loadAdvertisements(config?: AdvertisementConfig): Promise<Advertisement[]> {
  try {
    // Replace mock data with actual API call
    const response = await this.httpService.get('/api/advertisements', {
      category: config?.category,
      limit: config?.maxAds
    });
    return response.data;
  } catch (error) {
    console.error('Error loading advertisements:', error);
    return [];
  }
}
```

## File Structure

```
src/shared/components/advertisement/
├── advertisement.component.ts      # Main component logic
├── advertisement.component.html    # Template
├── advertisement.component.scss    # Styles
└── README.md                      # This documentation

src/shared/types/
└── advertisement.interface.ts     # TypeScript interfaces

src/services/advertisement/
└── advertisement.service.ts       # Data service
```

## Dependencies

- Angular 18+
- Ionic Angular
- RxJS

## Browser Support

- Chrome 70+
- Firefox 63+
- Safari 12+
- Edge 79+