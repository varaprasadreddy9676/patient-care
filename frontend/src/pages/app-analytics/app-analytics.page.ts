import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AppAnalyticsService } from '../../services/analytics/app-analytics.service';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables
} from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-app-analytics',
  templateUrl: './app-analytics.page.html',
  styleUrls: ['./app-analytics.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AppAnalyticsPage implements OnInit, OnDestroy {
  @ViewChild('usersChart', { static: false }) usersChartRef!: ElementRef;
  @ViewChild('activeUsersChart', { static: false }) activeUsersChartRef!: ElementRef;
  @ViewChild('eventsChart', { static: false }) eventsChartRef!: ElementRef;
  @ViewChild('categoryChart', { static: false }) categoryChartRef!: ElementRef;
  @ViewChild('contentChart', { static: false }) contentChartRef!: ElementRef;

  // Date range filters
  dateRange: string = '30'; // Default 30 days
  startDate: string = '';
  endDate: string = '';

  // Overview stats
  totalUsers: number = 0;
  newUsers: number = 0;
  activeUsers: number = 0;
  totalEvents: number = 0;
  totalAppointments: number = 0;
  bannerImpressions: number = 0;
  bannerClicks: number = 0;

  // User engagement data
  userEngagementData: any = null;
  contentData: any = null;

  // Charts
  usersChart: Chart | null = null;
  activeUsersChart: Chart | null = null;
  eventsChart: Chart | null = null;
  categoryChart: Chart | null = null;
  contentChart: Chart | null = null;

  isLoading: boolean = false;

  constructor(
    private analyticsService: AppAnalyticsService,
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
    this.loadAnalytics();
  }

  ngOnDestroy() {
    this.destroyCharts();
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

    await this.loadAnalytics();
  }

  async applyCustomDateRange() {
    if (this.startDate && this.endDate) {
      await this.loadAnalytics();
    }
  }

  async loadAnalytics() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Loading analytics...'
    });
    await loading.present();

    try {
      // Load overview
      const overviewData = await this.analyticsService.getOverview(this.startDate, this.endDate);
      this.totalUsers = overviewData.overview.totalUsers;
      this.newUsers = overviewData.overview.newUsers;
      this.activeUsers = overviewData.overview.activeUsers;
      this.totalEvents = overviewData.overview.totalEvents;
      this.totalAppointments = overviewData.overview.totalAppointments;
      this.bannerImpressions = overviewData.overview.bannerImpressions;
      this.bannerClicks = overviewData.overview.bannerClicks;

      // Load user engagement
      this.userEngagementData = await this.analyticsService.getUserEngagement(this.startDate, this.endDate);

      // Load content analytics
      this.contentData = await this.analyticsService.getContentAnalytics(this.startDate, this.endDate);

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
    if (this.usersChart) {
      this.usersChart.destroy();
      this.usersChart = null;
    }
    if (this.activeUsersChart) {
      this.activeUsersChart.destroy();
      this.activeUsersChart = null;
    }
    if (this.eventsChart) {
      this.eventsChart.destroy();
      this.eventsChart = null;
    }
    if (this.categoryChart) {
      this.categoryChart.destroy();
      this.categoryChart = null;
    }
    if (this.contentChart) {
      this.contentChart.destroy();
      this.contentChart = null;
    }
  }

  createCharts() {
    if (!this.userEngagementData) return;

    this.createUsersChart();
    this.createActiveUsersChart();
    this.createEventsChart();
    this.createCategoryChart();
    this.createContentChart();
  }

  createUsersChart() {
    if (!this.usersChartRef || !this.userEngagementData.usersByDay) return;

    const labels = this.userEngagementData.usersByDay.map((d: any) => d._id);
    const data = this.userEngagementData.usersByDay.map((d: any) => d.count);

    const ctx = this.usersChartRef.nativeElement.getContext('2d');
    this.usersChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'New Users',
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'New User Registrations'
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createActiveUsersChart() {
    if (!this.activeUsersChartRef || !this.userEngagementData.activeUsersByDay) return;

    const labels = this.userEngagementData.activeUsersByDay.map((d: any) => d._id);
    const data = this.userEngagementData.activeUsersByDay.map((d: any) => d.uniqueUsers);

    const ctx = this.activeUsersChartRef.nativeElement.getContext('2d');
    this.activeUsersChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Active Users',
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
          title: {
            display: true,
            text: 'Daily Active Users'
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createEventsChart() {
    if (!this.eventsChartRef || !this.userEngagementData.topEvents) return;

    const labels = this.userEngagementData.topEvents.map((e: any) => this.formatEventName(e._id));
    const data = this.userEngagementData.topEvents.map((e: any) => e.count);

    const ctx = this.eventsChartRef.nativeElement.getContext('2d');
    this.eventsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Event Count',
          data: data,
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
          borderColor: 'rgb(255, 159, 64)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          title: {
            display: true,
            text: 'Top 10 Events'
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createCategoryChart() {
    if (!this.categoryChartRef || !this.userEngagementData.eventsByCategory) return;

    const labels = this.userEngagementData.eventsByCategory.map((c: any) => c._id || 'Unknown');
    const data = this.userEngagementData.eventsByCategory.map((c: any) => c.count);

    const ctx = this.categoryChartRef.nativeElement.getContext('2d');
    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Events by Category'
          },
          legend: {
            position: 'right'
          }
        }
      }
    });
  }

  createContentChart() {
    if (!this.contentChartRef || !this.contentData.contentEvents) return;

    const labels = this.contentData.contentEvents.map((e: any) => this.formatEventName(e._id));
    const data = this.contentData.contentEvents.map((e: any) => e.count);

    const ctx = this.contentChartRef.nativeElement.getContext('2d');
    this.contentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Views',
          data: data,
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgb(153, 102, 255)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Content Access Statistics'
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  formatEventName(event: string): string {
    return event
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  goToAppointmentAnalytics() {
    this.router.navigate(['/appointment-analytics']);
  }

  goToSystemHealth() {
    this.router.navigate(['/system-health-analytics']);
  }
}
