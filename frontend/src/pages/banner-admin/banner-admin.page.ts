import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, ModalController } from '@ionic/angular';
import { BannerService } from '../../services/banner/banner.service';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-banner-admin',
  templateUrl: './banner-admin.page.html',
  styleUrls: ['./banner-admin.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class BannerAdminPage implements OnInit {
  banners: any[] = [];
  loading: boolean = true;
  selectedSegment: string = 'list'; // 'list' or 'create'

  // Form data for creating/editing banner
  form: any = {
    title: '',
    description: '',
    contentType: 'image',
    richTextContent: '',
    imageBase64: '',
    imageUrl: '',
    size: 'medium',
    customWidth: null,
    customHeight: null,
    clickBehavior: 'external',
    externalUrl: '',
    internalRoute: '',
    displayLocation: 'all',
    priority: 0,
    isActive: true,
    schedule: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: this.getDatePlusMonths(1),
      startTime: '00:00',
      endTime: '23:59',
      frequency: 'always',
      daysOfWeek: [],
      maxImpressionsPerUser: null,
      maxClicksPerUser: null
    }
  };

  editingBannerId: string | null = null;
  showPreview: boolean = false;

  constructor(
    private bannerService: BannerService,
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    await this.loadBanners();
  }

  async loadBanners() {
    this.loading = true;
    try {
      this.banners = await this.bannerService.getAllBanners();
    } catch (error) {
      console.error('Error loading banners:', error);
      await this.showToast('Error loading banners', 'danger');
    } finally {
      this.loading = false;
    }
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
    if (this.selectedSegment === 'list') {
      this.resetForm();
    }
  }

  resetForm() {
    this.editingBannerId = null;
    this.form = {
      title: '',
      description: '',
      contentType: 'image',
      richTextContent: '',
      imageBase64: '',
      imageUrl: '',
      size: 'medium',
      customWidth: null,
      customHeight: null,
      clickBehavior: 'external',
      externalUrl: '',
      internalRoute: '',
      displayLocation: 'all',
      priority: 0,
      isActive: true,
      schedule: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: this.getDatePlusMonths(1),
        startTime: '00:00',
        endTime: '23:59',
        frequency: 'always',
        daysOfWeek: [],
        maxImpressionsPerUser: null,
        maxClicksPerUser: null
      }
    };
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      this.form.imageBase64 = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async saveBanner() {
    // Validation
    if (!this.form.title) {
      await this.showToast('Please enter a title', 'warning');
      return;
    }

    if (this.form.contentType === 'text' && !this.form.richTextContent) {
      await this.showToast('Please enter text content', 'warning');
      return;
    }

    if ((this.form.contentType === 'image' || this.form.contentType === 'combo') && !this.form.imageBase64 && !this.form.imageUrl) {
      await this.showToast('Please upload an image or enter an image URL', 'warning');
      return;
    }

    try {
      if (this.editingBannerId) {
        // Update existing banner
        await this.bannerService.updateBanner(this.editingBannerId, this.form);
        await this.showToast('Banner updated successfully', 'success');
      } else {
        // Create new banner
        await this.bannerService.createBanner(this.form);
        await this.showToast('Banner created successfully', 'success');
      }

      this.resetForm();
      this.selectedSegment = 'list';
      await this.loadBanners();
    } catch (error: any) {
      console.error('Error saving banner:', error);
      await this.showToast(error.message || 'Error saving banner', 'danger');
    }
  }

  async editBanner(banner: any) {
    this.editingBannerId = banner.id;
    this.form = { ...banner };
    this.selectedSegment = 'create';
  }

  async deleteBanner(banner: any) {
    const alert = await this.alertController.create({
      header: 'Delete Banner',
      message: `Are you sure you want to delete "${banner.title}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              await this.bannerService.deleteBanner(banner.id);
              await this.showToast('Banner deleted successfully', 'success');
              await this.loadBanners();
            } catch (error) {
              console.error('Error deleting banner:', error);
              await this.showToast('Error deleting banner', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async toggleBannerStatus(banner: any) {
    try {
      await this.bannerService.updateBanner(banner.id, {
        ...banner,
        isActive: !banner.isActive
      });
      await this.showToast(`Banner ${banner.isActive ? 'deactivated' : 'activated'}`, 'success');
      await this.loadBanners();
    } catch (error) {
      console.error('Error toggling banner status:', error);
      await this.showToast('Error updating banner', 'danger');
    }
  }

  async viewStatistics(banner: any) {
    // Navigate to statistics page or show modal
    this.router.navigate(['/banner-statistics', banner.id]);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  goToAnalytics() {
    this.router.navigate(['/home/banner-analytics']);
  }

  private getDatePlusMonths(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  // Preview methods
  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  getPreviewImageSrc(): string {
    if (this.form.imageBase64) {
      if (this.form.imageBase64.startsWith('data:image')) {
        return this.form.imageBase64;
      }
      return `data:image/png;base64,${this.form.imageBase64}`;
    }
    if (this.form.imageUrl) {
      return this.form.imageUrl;
    }
    return '';
  }

  getPreviewSafeHtml(): SafeHtml {
    if (!this.form.richTextContent) return '';
    return this.sanitizer.bypassSecurityTrustHtml(this.form.richTextContent);
  }

  getPreviewBannerClass(): string {
    const classes = ['preview-banner'];
    classes.push(`banner-${this.form.size}`);
    classes.push(`banner-${this.form.contentType}`);
    return classes.join(' ');
  }

  getPreviewBannerStyle(): any {
    const style: any = {};
    if (this.form.size === 'custom') {
      if (this.form.customWidth) {
        style.width = `${this.form.customWidth}px`;
      }
      if (this.form.customHeight) {
        style.height = `${this.form.customHeight}px`;
      }
    }
    return style;
  }

  isPreviewAvailable(): boolean {
    if (this.form.contentType === 'text') {
      return !!this.form.richTextContent;
    }
    if (this.form.contentType === 'image') {
      return !!(this.form.imageBase64 || this.form.imageUrl);
    }
    if (this.form.contentType === 'combo') {
      return !!(this.form.richTextContent && (this.form.imageBase64 || this.form.imageUrl));
    }
    return false;
  }
}
