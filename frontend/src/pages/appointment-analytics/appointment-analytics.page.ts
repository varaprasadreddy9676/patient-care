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
  selector: 'app-appointment-analytics',
  templateUrl: './appointment-analytics.page.html',
  styleUrls: ['./appointment-analytics.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AppointmentAnalyticsPage implements OnInit {
  @ViewChild('appointmentsByDayChart', { static: false }) appointmentsByDayChartRef!: ElementRef;
  @ViewChild('appointmentsByStatusChart', { static: false }) appointmentsByStatusChartRef!: ElementRef;
  @ViewChild('appointmentEventsChart', { static: false }) appointmentEventsChartRef!: ElementRef;

  // Date range filters
  dateRange: string = '30';
  startDate: string = '';
  endDate: string = '';

  // Metrics
  totalAppointments: number = 0;
  confirmedAppointments: number = 0;
  cancelledAppointments: number = 0;
  cancellationRate: number = 0;

  // Data
  appointmentData: any = null;

  // Charts
  appointmentsByDayChart: Chart | null = null;
  appointmentsByStatusChart: Chart | null = null;
  appointmentEventsChart: Chart | null = null;

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
      message: 'Loading appointment analytics...'
    });
    await loading.present();

    try {
      this.appointmentData = await this.analyticsService.getAppointmentAnalytics(this.startDate, this.endDate);

      this.totalAppointments = this.appointmentData.totalAppointments;
      this.confirmedAppointments = this.appointmentData.metrics.confirmed;
      this.cancelledAppointments = this.appointmentData.metrics.cancelled;
      this.cancellationRate = this.appointmentData.metrics.cancellationRate;

      this.destroyCharts();

      setTimeout(() => {
        this.createCharts();
      }, 100);
    } catch (error) {
      console.error('Error loading appointment analytics:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to load appointment analytics. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  destroyCharts() {
    if (this.appointmentsByDayChart) {
      this.appointmentsByDayChart.destroy();
      this.appointmentsByDayChart = null;
    }
    if (this.appointmentsByStatusChart) {
      this.appointmentsByStatusChart.destroy();
      this.appointmentsByStatusChart = null;
    }
    if (this.appointmentEventsChart) {
      this.appointmentEventsChart.destroy();
      this.appointmentEventsChart = null;
    }
  }

  createCharts() {
    if (!this.appointmentData) return;

    this.createAppointmentsByDayChart();
    this.createAppointmentsByStatusChart();
    this.createAppointmentEventsChart();
  }

  createAppointmentsByDayChart() {
    if (!this.appointmentsByDayChartRef || !this.appointmentData.appointmentsByDay) return;

    const labels = this.appointmentData.appointmentsByDay.map((d: any) => d._id);
    const data = this.appointmentData.appointmentsByDay.map((d: any) => d.count);

    const ctx = this.appointmentsByDayChartRef.nativeElement.getContext('2d');
    this.appointmentsByDayChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Appointments',
          data: data,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
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
            text: 'Appointment Bookings Over Time'
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

  createAppointmentsByStatusChart() {
    if (!this.appointmentsByStatusChartRef || !this.appointmentData.appointmentsByStatus) return;

    const labels = this.appointmentData.appointmentsByStatus.map((s: any) => s._id || 'Unknown');
    const data = this.appointmentData.appointmentsByStatus.map((s: any) => s.count);

    const ctx = this.appointmentsByStatusChartRef.nativeElement.getContext('2d');
    this.appointmentsByStatusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)',
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
            text: 'Appointments by Status'
          },
          legend: {
            position: 'right'
          }
        }
      }
    });
  }

  createAppointmentEventsChart() {
    if (!this.appointmentEventsChartRef || !this.appointmentData.appointmentEvents) return;

    const labels = this.appointmentData.appointmentEvents.map((e: any) => this.formatEventName(e._id));
    const data = this.appointmentData.appointmentEvents.map((e: any) => e.count);

    const ctx = this.appointmentEventsChartRef.nativeElement.getContext('2d');
    this.appointmentEventsChart = new Chart(ctx, {
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
            text: 'Appointment Events'
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
      .replace('APPOINTMENT_', '')
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  goBack() {
    this.router.navigate(['/app-analytics']);
  }
}
