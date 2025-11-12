import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
  selector: 'app-system-health-analytics',
  templateUrl: './system-health-analytics.page.html',
  styleUrls: ['./system-health-analytics.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class SystemHealthAnalyticsPage implements OnInit {
  @ViewChild('errorsByDayChart', { static: false }) errorsByDayChartRef!: ElementRef;
  @ViewChild('errorEventsChart', { static: false }) errorEventsChartRef!: ElementRef;
  @ViewChild('failedOpsChart', { static: false }) failedOpsChartRef!: ElementRef;

  // Date range filters
  dateRange: string = '30';
  startDate: string = '';
  endDate: string = '';

  // Metrics
  totalEvents: number = 0;
  totalErrors: number = 0;
  successRate: number = 0;

  // Data
  healthData: any = null;

  // Charts
  errorsByDayChart: Chart | null = null;
  errorEventsChart: Chart | null = null;
  failedOpsChart: Chart | null = null;

  isLoading: boolean = false;

  constructor(
    private analyticsService: AppAnalyticsService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private router: Router
  ) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    this.endDate = end.toISOString().split('T')[0];
    this.startDate = start.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadAnalytics();
  }

  async onDateRangeChange() {
    if (this.dateRange === 'custom') {
      return;
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
      message: 'Loading system health data...'
    });
    await loading.present();

    try {
      this.healthData = await this.analyticsService.getSystemHealth(this.startDate, this.endDate);

      this.totalEvents = this.healthData.metrics.totalEvents;
      this.totalErrors = this.healthData.metrics.totalErrors;
      this.successRate = this.healthData.metrics.successRate;

      this.destroyCharts();

      setTimeout(() => {
        this.createCharts();
      }, 100);
    } catch (error) {
      console.error('Error loading system health:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to load system health data. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  destroyCharts() {
    if (this.errorsByDayChart) {
      this.errorsByDayChart.destroy();
      this.errorsByDayChart = null;
    }
    if (this.errorEventsChart) {
      this.errorEventsChart.destroy();
      this.errorEventsChart = null;
    }
    if (this.failedOpsChart) {
      this.failedOpsChart.destroy();
      this.failedOpsChart = null;
    }
  }

  createCharts() {
    if (!this.healthData) return;

    this.createErrorsByDayChart();
    this.createErrorEventsChart();
    this.createFailedOpsChart();
  }

  createErrorsByDayChart() {
    if (!this.errorsByDayChartRef || !this.healthData.errorsByDay) return;

    const labels = this.healthData.errorsByDay.map((d: any) => d._id);
    const data = this.healthData.errorsByDay.map((d: any) => d.count);

    const ctx = this.errorsByDayChartRef.nativeElement.getContext('2d');
    this.errorsByDayChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Errors',
          data: data,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
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
            text: 'Error Trends Over Time'
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

  createErrorEventsChart() {
    if (!this.errorEventsChartRef || !this.healthData.errorEvents || this.healthData.errorEvents.length === 0) return;

    const labels = this.healthData.errorEvents.map((e: any) => this.formatEventName(e._id));
    const data = this.healthData.errorEvents.map((e: any) => e.count);

    const ctx = this.errorEventsChartRef.nativeElement.getContext('2d');
    this.errorEventsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Count',
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
            text: 'Error Events'
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

  createFailedOpsChart() {
    if (!this.failedOpsChartRef || !this.healthData.failedOperations || this.healthData.failedOperations.length === 0) return;

    const labels = this.healthData.failedOperations.map((o: any) => this.formatEventName(o._id));
    const data = this.healthData.failedOperations.map((o: any) => o.count);

    const ctx = this.failedOpsChartRef.nativeElement.getContext('2d');
    this.failedOpsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Count',
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
            text: 'Failed Operations'
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
    this.router.navigate(['/app-analytics']);
  }
}
