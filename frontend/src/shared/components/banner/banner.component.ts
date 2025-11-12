import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { BannerService, Banner } from '../../../services/banner/banner.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class BannerComponent implements OnInit, OnDestroy {
  @Input() location: string = 'home'; // Where banner is displayed (home, appointments, emr, etc.)
  @Input() autoRefresh: boolean = false; // Auto-refresh banner
  @Input() refreshInterval: number = 30000; // 30 seconds

  banner: Banner | null = null;
  loading: boolean = true;
  private refreshTimer: any;
  private scrollListener: any;

  constructor(
    private bannerService: BannerService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    await this.loadBanner();

    // Setup scroll tracking for better analytics
    this.setupScrollTracking();

    // Auto-refresh if enabled
    if (this.autoRefresh && this.refreshInterval > 0) {
      this.refreshTimer = setInterval(() => {
        this.loadBanner();
      }, this.refreshInterval);
    }
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  async loadBanner() {
    this.loading = true;
    try {
      this.banner = await this.bannerService.getBanner(this.location);
    } catch (error) {
      console.error('Error loading banner:', error);
      this.banner = null;
    } finally {
      this.loading = false;
    }
  }

  async onBannerClick() {
    if (!this.banner) return;

    // Get current scroll position for analytics
    const scrollPosition = this.getScrollPercentage();

    // Track the click with all details
    await this.bannerService.trackClick(this.banner, this.location, scrollPosition);

    // Handle navigation based on click behavior
    if (this.banner.clickBehavior === 'external' && this.banner.externalUrl) {
      // Open external URL in system browser or new tab
      window.open(this.banner.externalUrl, '_blank', 'noopener,noreferrer');
    } else if (this.banner.clickBehavior === 'internal' && this.banner.internalRoute) {
      // Navigate to internal route
      this.router.navigate([this.banner.internalRoute]);
    }
  }

  getImageSrc(): string {
    if (!this.banner) return '';

    // Check for base64 image
    if (this.banner.imageBase64) {
      if (this.banner.imageBase64.startsWith('data:image')) {
        return this.banner.imageBase64;
      }
      return `data:image/png;base64,${this.banner.imageBase64}`;
    }

    // Check for image URL
    if (this.banner.imageUrl) {
      return this.banner.imageUrl;
    }

    return '';
  }

  getSafeHtml(): SafeHtml {
    if (!this.banner || !this.banner.richTextContent) return '';
    return this.sanitizer.bypassSecurityTrustHtml(this.banner.richTextContent);
  }

  getBannerClass(): string {
    if (!this.banner) return '';

    const classes = ['banner'];
    classes.push(`banner-${this.banner.size}`);
    classes.push(`banner-${this.banner.contentType}`);

    return classes.join(' ');
  }

  getBannerStyle(): any {
    if (!this.banner) return {};

    const style: any = {};

    if (this.banner.size === 'custom') {
      if (this.banner.customWidth) {
        style.width = `${this.banner.customWidth}px`;
      }
      if (this.banner.customHeight) {
        style.height = `${this.banner.customHeight}px`;
      }
    }

    return style;
  }

  // Video methods
  getYouTubeEmbedUrl(): any {
    if (!this.banner || !this.banner.videoUrl) return '';

    try {
      // Extract video ID from various YouTube URL formats
      const url = this.banner.videoUrl;
      let videoId = '';

      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1]?.split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1]?.split('?')[0];
      }

      if (!videoId) return '';

      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    } catch (error) {
      console.error('Error parsing YouTube URL:', error);
      return '';
    }
  }

  getVimeoEmbedUrl(): any {
    if (!this.banner || !this.banner.videoUrl) return '';

    try {
      // Extract video ID from Vimeo URL
      const url = this.banner.videoUrl;
      let videoId = '';

      if (url.includes('vimeo.com/')) {
        videoId = url.split('vimeo.com/')[1]?.split('?')[0]?.split('/')[0];
      }

      if (!videoId) return '';

      const embedUrl = `https://player.vimeo.com/video/${videoId}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    } catch (error) {
      console.error('Error parsing Vimeo URL:', error);
      return '';
    }
  }

  // GIF methods
  getGifSrc(): string {
    if (!this.banner) return '';

    // Check for GIF URL
    if ((this.banner as any).gifUrl) {
      return (this.banner as any).gifUrl;
    }

    // Check for base64 GIF
    if ((this.banner as any).gifBase64) {
      const gifData = (this.banner as any).gifBase64;
      if (gifData.startsWith('data:image')) {
        return gifData;
      }
      return `data:image/gif;base64,${gifData}`;
    }

    return '';
  }

  // Helper methods for combo banners
  hasImage(): boolean {
    if (!this.banner) return false;
    return !!(this.banner.imageBase64 || this.banner.imageUrl);
  }

  hasVideo(): boolean {
    if (!this.banner) return false;
    return !!((this.banner as any).videoUrl);
  }

  hasGif(): boolean {
    if (!this.banner) return false;
    return !!((this.banner as any).gifUrl || (this.banner as any).gifBase64);
  }

  private getScrollPercentage(): number {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    const scrollableHeight = documentHeight - windowHeight;
    if (scrollableHeight <= 0) return 0;

    return Math.round((scrollTop / scrollableHeight) * 100);
  }

  private setupScrollTracking() {
    // Track scroll position for better click analytics
    this.scrollListener = () => {
      // This is passive - we just need it available when user clicks
    };
    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }
}
