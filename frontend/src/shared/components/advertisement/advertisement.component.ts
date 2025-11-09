import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Subscription, interval } from 'rxjs';

export interface SimpleAdvertisement {
  id: string;
  imageUrl: string; // Can be a file path OR base64 string
  link?: string;
}

@Component({
  selector: 'app-advertisement',
  templateUrl: './advertisement.component.html',
  styleUrls: ['./advertisement.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class AdvertisementComponent implements OnInit, OnChanges, OnDestroy {
  @Input() autoRotate: boolean = true;
  @Input() rotationInterval: number = 4000;
  @Input() showDots: boolean = true;
  @Input() customAds?: SimpleAdvertisement[]; // Allow passing ads from parent component

  @Output() advertisementClick = new EventEmitter<SimpleAdvertisement>();

  // Advertisements from server (no defaults, will be provided by parent component)
  advertisements: SimpleAdvertisement[] = [];

  currentAdIndex = 0;
  private rotationSubscription?: Subscription;
  private touchStartX = 0;
  private isDragging = false;

  ngOnInit() {
    this.loadAds();
  }

  ngOnChanges(changes: SimpleChanges) {
    // React to changes in customAds input
    if (changes['customAds'] && !changes['customAds'].firstChange) {
      this.loadAds();
    }
  }

  private loadAds() {
    // Use custom ads from server if provided
    if (this.customAds && this.customAds.length > 0) {
      this.advertisements = this.customAds;

      // Restart auto-rotation with new ads
      if (this.autoRotate && this.advertisements.length > 1) {
        this.restartAutoRotation();
      }
    } else {
      this.advertisements = [];
      this.stopAutoRotation();
    }
  }

  ngOnDestroy() {
    this.stopAutoRotation();
  }

  // Helper method to get properly formatted image source
  getImageSrc(ad: SimpleAdvertisement): string {
    // Check if it's already a base64 string or data URI
    if (ad.imageUrl.startsWith('data:image')) {
      return ad.imageUrl;
    }

    // Check if it's a base64 string without the data URI prefix
    if (this.isBase64String(ad.imageUrl)) {
      return `data:image/png;base64,${ad.imageUrl}`;
    }

    // Otherwise, it's a regular file path
    return ad.imageUrl;
  }

  // Check if a string is base64 encoded
  private isBase64String(str: string): boolean {
    // Base64 strings are typically long and contain only valid base64 characters
    if (str.length < 50) return false; // Too short to be an image

    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    return base64Regex.test(str.substring(0, 100)); // Check first 100 chars
  }

  private startAutoRotation() {
    if (this.advertisements.length <= 1) return;

    this.rotationSubscription = interval(this.rotationInterval)
      .subscribe(() => {
        this.nextSlide();
      });
  }

  private stopAutoRotation() {
    if (this.rotationSubscription) {
      this.rotationSubscription.unsubscribe();
      this.rotationSubscription = undefined;
    }
  }

  private restartAutoRotation() {
    this.stopAutoRotation();
    if (this.autoRotate && this.advertisements.length > 1) {
      this.startAutoRotation();
    }
  }

  // Pause auto-rotation on hover
  onMouseEnter() {
    if (this.autoRotate) {
      this.stopAutoRotation();
    }
  }

  // Resume auto-rotation on mouse leave
  onMouseLeave() {
    if (this.autoRotate) {
      this.restartAutoRotation();
    }
  }

  // Navigate to next slide
  nextSlide() {
    if (this.advertisements.length > 1) {
      this.currentAdIndex = (this.currentAdIndex + 1) % this.advertisements.length;
    }
  }

  // Navigate to previous slide
  previousSlide() {
    if (this.advertisements.length > 1) {
      this.currentAdIndex = this.currentAdIndex === 0
        ? this.advertisements.length - 1
        : this.currentAdIndex - 1;
    }
  }

  // Ad click handler
  onAdvertisementClick(ad: SimpleAdvertisement) {
    // Don't open link if user was dragging/swiping
    if (this.isDragging) {
      this.isDragging = false;
      return;
    }

    // Emit event for parent component
    this.advertisementClick.emit(ad);

    // Open link in new tab if available
    if (ad.link) {
      window.open(ad.link, '_blank', 'noopener,noreferrer');
    }
  }

  // Carousel navigation
  goToSlide(index: number) {
    this.currentAdIndex = index;
    this.restartAutoRotation();
  }

  // Helper methods
  trackByAdId(index: number, ad: SimpleAdvertisement): string {
    return ad.id;
  }

  getCarouselTransform(): string {
    const offset = -100 * this.currentAdIndex;
    return `translateX(${offset}%)`;
  }

  // Touch gesture handlers for mobile
  onTouchStart(event: TouchEvent) {
    if (this.advertisements.length <= 1) return;
    this.touchStartX = event.touches[0].clientX;
    this.isDragging = false;
  }

  onTouchEnd(event: TouchEvent) {
    if (this.advertisements.length <= 1) return;

    const touchEndX = event.changedTouches[0].clientX;
    const deltaX = touchEndX - this.touchStartX;
    const minSwipeDistance = 50;

    // Handle swipe gestures
    if (Math.abs(deltaX) > minSwipeDistance) {
      this.isDragging = true; // Mark as dragging to prevent click
      if (deltaX > 0) {
        this.previousSlide();
      } else {
        this.nextSlide();
      }
      this.restartAutoRotation();
    }
  }
}