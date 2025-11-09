export interface Advertisement {
  id: string;
  title: string;
  message?: string; // Renamed from description for clarity
  icon?: string; // Ionic icon name (e.g., 'heart-outline', 'calendar-outline')
  mediaType?: 'image' | 'video' | 'icon'; // Type of media to display
  mediaUrl?: string; // URL for image or video
  imageUrl?: string; // Optional image URL (deprecated, use mediaUrl)
  videoUrl?: string; // Optional video URL for video advertisements
  variant: 'promo' | 'tip' | 'reminder' | 'campaign'; // Advertisement type
  ctaLabel: string; // Button text (e.g., 'Book Now', 'Learn More')
  ctaAction?: string; // Route or URL for navigation
  backgroundColor?: string;
  gradient?: string; // CSS gradient background
  textColor?: string;
  isActive: boolean;
  displayOrder: number;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  dismissible?: boolean; // Can be dismissed by user
}

export interface AdvertisementConfig {
  maxAds?: number; // Maximum number of ads to display (0 = no limit)
  category?: string; // Filter ads by category (e.g., 'health', 'promotions')
  layout?: 'single' | 'carousel'; // Layout type: single = vertical stack, carousel = horizontal scroll
  showCarouselDots?: boolean; // Show navigation dots for carousel (default: true)
  autoRotate?: boolean; // Enable automatic rotation in carousel mode (default: false)
  rotationInterval?: number; // Auto-rotation interval in milliseconds (default: 4000ms = 4 seconds)
  dismissible?: boolean; // Allow users to dismiss ads globally (default: false)
}