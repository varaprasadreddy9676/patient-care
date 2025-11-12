import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { BannerService } from '../../services/banner/banner.service';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables
} from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-banner-analytics',
  templateUrl: './banner-analytics.page.html',
  styleUrls: ['./banner-analytics.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class BannerAnalyticsPage implements OnInit {
  @ViewChild('impressionsChart', { static: false }) impressionsChartRef!: ElementRef;
  @ViewChild('clicksChart', { static: false }) clicksChartRef!: ElementRef;
  @ViewChild('ctrChart', { static: false }) ctrChartRef!: ElementRef;
  @ViewChild('platformChart', { static: false }) platformChartRef!: ElementRef;
  @ViewChild('locationChart', { static: false }) locationChartRef!: ElementRef;

  banners: any[] = [];
  selectedBannerId: string = '';
  selectedBanner: any = null;
  analyticsData: any = null;

  // Date range filters
  dateRange: string = '30'; // Default 30 days
  startDate: string = '';
  endDate: string = '';

  // Overview stats
  totalImpressions: number = 0;
  totalClicks: number = 0;
  averageCTR: number = 0;
  activeBanners: number = 0;

  // Charts
  impressionsChart: Chart | null = null;
  clicksChart: Chart | null = null;
  ctrChart: Chart | null = null;
  platformChart: Chart | null = null;
  locationChart: Chart | null = null;

  isLoading: boolean = false;

  constructor(
    private bannerService: BannerService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private router: Router
  ) {
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    this.endDate = end.toISOString().split('T')[0];
    this.startDate = start.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadBanners();
  }

  async loadBanners() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Loading banners...'
    });
    await loading.present();

    try {
      this.banners = await this.bannerService.getAllBanners();
      this.calculateOverviewStats();

      // If we have banners, load analytics for the first one
      if (this.banners.length > 0) {
        this.selectedBannerId = this.banners[0]._id;
        await this.loadBannerAnalytics();
      }
    } catch (error) {
      console.error('Error loading banners:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to load banner data. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  calculateOverviewStats() {
    this.totalImpressions = this.banners.reduce((sum, b) => sum + (b.totalImpressions || 0), 0);
    this.totalClicks = this.banners.reduce((sum, b) => sum + (b.totalClicks || 0), 0);
    this.activeBanners = this.banners.filter(b => b.isActive).length;
    this.averageCTR = this.totalImpressions > 0
      ? (this.totalClicks / this.totalImpressions) * 100
      : 0;
  }

  async onBannerChange() {
    if (this.selectedBannerId) {
      await this.loadBannerAnalytics();
    }
  }

  async onDateRangeChange() {
    if (this.dateRange === 'custom') {
      return; // User will manually select dates
    }

    const end = new Date();
    const start = new Date();

    switch(this.dateRange) {
      case '7':
        start.setDate(start.getDate() - 7);
        break;
      case '30':
        start.setDate(start.getDate() - 30);
        break;
      case '90':
        start.setDate(start.getDate() - 90);
        break;
      case '180':
        start.setDate(start.getDate() - 180);
        break;
      case '365':
        start.setDate(start.getDate() - 365);
        break;
    }

    this.endDate = end.toISOString().split('T')[0];
    this.startDate = start.toISOString().split('T')[0];

    if (this.selectedBannerId) {
      await this.loadBannerAnalytics();
    }
  }

  async applyCustomDateRange() {
    if (this.selectedBannerId && this.startDate && this.endDate) {
      await this.loadBannerAnalytics();
    }
  }

  async loadBannerAnalytics() {
    if (!this.selectedBannerId) return;

    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Loading analytics...'
    });
    await loading.present();

    try {
      this.analyticsData = await this.bannerService.getBannerStatistics(this.selectedBannerId);
      this.selectedBanner = this.banners.find(b => b._id === this.selectedBannerId);

      // Destroy existing charts
      this.destroyCharts();

      // Wait for view to update
      setTimeout(() => {
        this.createCharts();
      }, 100);
    } catch (error) {
      console.error('Error loading analytics:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to load analytics data. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  destroyCharts() {
    if (this.impressionsChart) {
      this.impressionsChart.destroy();
      this.impressionsChart = null;
    }
    if (this.clicksChart) {
      this.clicksChart.destroy();
      this.clicksChart = null;
    }
    if (this.ctrChart) {
      this.ctrChart.destroy();
      this.ctrChart = null;
    }
    if (this.platformChart) {
      this.platformChart.destroy();
      this.platformChart = null;
    }
    if (this.locationChart) {
      this.locationChart.destroy();
      this.locationChart = null;
    }
  }

  createCharts() {
    if (!this.analyticsData) return;

    this.createImpressionsChart();
    this.createClicksChart();
    this.createCTRChart();
    this.createPlatformChart();
    this.createLocationChart();
  }

  createImpressionsChart() {
    if (!this.impressionsChartRef || !this.analyticsData.dailyStats) return;

    const labels = this.analyticsData.dailyStats.map((d: any) => d._id);
    const data = this.analyticsData.dailyStats.map((d: any) => d.impressions);

    const ctx = this.impressionsChartRef.nativeElement.getContext('2d');
    this.impressionsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Impressions',
          data: data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Daily Impressions'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  createClicksChart() {
    if (!this.clicksChartRef || !this.analyticsData.dailyStats) return;

    const labels = this.analyticsData.dailyStats.map((d: any) => d._id);
    const data = this.analyticsData.dailyStats.map((d: any) => d.clicks);

    const ctx = this.clicksChartRef.nativeElement.getContext('2d');
    this.clicksChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Clicks',
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Daily Clicks'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  createCTRChart() {
    if (!this.ctrChartRef || !this.analyticsData.dailyStats) return;

    const labels = this.analyticsData.dailyStats.map((d: any) => d._id);
    const data = this.analyticsData.dailyStats.map((d: any) => {
      return d.impressions > 0 ? ((d.clicks / d.impressions) * 100).toFixed(2) : 0;
    });

    const ctx = this.ctrChartRef.nativeElement.getContext('2d');
    this.ctrChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'CTR (%)',
          data: data,
          borderColor: 'rgb(255, 159, 64)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Click-Through Rate (CTR)'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  }

  createPlatformChart() {
    if (!this.platformChartRef || !this.analyticsData.clicksByPlatform) return;

    const labels = this.analyticsData.clicksByPlatform.map((p: any) => p._id || 'Unknown');
    const data = this.analyticsData.clicksByPlatform.map((p: any) => p.count);

    const ctx = this.platformChartRef.nativeElement.getContext('2d');
    this.platformChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: 'Clicks by Platform',
          data: data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 206, 86)',
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)',
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Clicks by Platform'
          }
        }
      }
    });
  }

  createLocationChart() {
    if (!this.locationChartRef || !this.analyticsData.clicksByLocation) return;

    const labels = this.analyticsData.clicksByLocation.map((l: any) => {
      const locationMap: any = {
        'home': 'Home',
        'appointments': 'Appointments',
        'emr': 'EMR',
        'all': 'All Pages'
      };
      return locationMap[l._id] || l._id;
    });
    const data = this.analyticsData.clicksByLocation.map((l: any) => l.count);

    const ctx = this.locationChartRef.nativeElement.getContext('2d');
    this.locationChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Clicks by Location',
          data: data,
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          borderColor: 'rgb(153, 102, 255)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Clicks by Location'
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  goBack() {
    this.router.navigate(['/home/banner-admin']);
  }

  ngOnDestroy() {
    this.destroyCharts();
  }
}
