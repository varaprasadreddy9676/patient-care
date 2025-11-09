/**
 * MedicsCare Theme Demo Component
 *
 * This component demonstrates the theme system functionality including:
 * - Theme switching between light and dark modes
 * - Medical context styling
 * - Color palette display
 * - Typography system showcase
 *
 * Use this component to verify theme system integration during development.
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ThemeService, ThemeName, ThemeMode } from '../../services/theme/theme.service';
import { MedicalThemeContext } from '../../types/theme.types';

@Component({
  selector: 'app-theme-demo',
  templateUrl: './theme-demo.component.html',
  styleUrls: ['./theme-demo.component.scss']
})
export class ThemeDemoComponent implements OnInit, OnDestroy {
  // Theme state
  currentTheme: ThemeName = 'medicscare-light';
  currentMode: ThemeMode = 'auto';
  isDarkMode = false;
  isHighContrast = false;

  // Demo data
  availableThemes: ThemeName[] = ['medicscare-light', 'medicscare-dark'];
  availableModes: ThemeMode[] = ['light', 'dark', 'auto'];

  // Medical context demo
  patientStatuses: Array<{ value: MedicalThemeContext['patientStatus'], label: string }> = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
    { value: 'critical', label: 'Critical' }
  ];

  appointmentStatuses: Array<{ value: MedicalThemeContext['appointmentStatus'], label: string }> = [
    { value: 'booked', label: 'Booked' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'inProgress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'noShow', label: 'No Show' }
  ];

  billStatuses: Array<{ value: MedicalThemeContext['billStatus'], label: string }> = [
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'partial', label: 'Partial' },
    { value: 'refunded', label: 'Refunded' }
  ];

  urgencyLevels: Array<{ value: MedicalThemeContext['urgency'], label: string }> = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  // Color palette for demo
  colorPalette = [
    { name: 'Primary', class: 'bg-primary-500' },
    { name: 'Success', class: 'bg-success' },
    { name: 'Warning', class: 'bg-warning' },
    { name: 'Error', class: 'bg-error' },
    { name: 'Info', class: 'bg-info' },
    { name: 'Neutral', class: 'bg-secondary' }
  ];

  medicalColors = [
    { name: 'Patient Active', class: 'patient-active' },
    { name: 'Patient Critical', class: 'patient-critical' },
    { name: 'Appointment Confirmed', class: 'appointment-confirmed' },
    { name: 'Appointment Completed', class: 'appointment-completed' },
    { name: 'Bill Paid', class: 'bill-paid' },
    { name: 'Bill Overdue', class: 'bill-overdue' }
  ];

  // Typography samples
  typographySamples = [
    { class: 'text-display-xl', text: 'Display XL - Hero Title', description: '48px, Bold' },
    { class: 'text-heading-xl', text: 'Heading XL - Page Title', description: '24px, Semibold' },
    { class: 'text-heading-md', text: 'Heading MD - Card Title', description: '18px, Semibold' },
    { class: 'text-body-lg', text: 'Body LG - Default text', description: '16px, Regular' },
    { class: 'text-body-md', text: 'Body MD - Secondary text', description: '14px, Regular' },
    { class: 'text-body-sm', text: 'Body SM - Caption text', description: '13px, Regular' }
  ];

  private subscriptions: Subscription[] = [];

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    const themeSub = this.themeService.getThemeState$().subscribe(state => {
      this.currentTheme = state.theme;
      this.currentMode = state.mode;
      this.isDarkMode = state.effectiveTheme === 'medicscare-dark';
      this.isHighContrast = state.isHighContrast;
    });

    this.subscriptions.push(themeSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ===================================
  // 🎨 THEME CONTROL METHODS
  // ===================================

  async setTheme(theme: ThemeName): Promise<void> {
    await this.themeService.setTheme(theme, this.currentMode);
  }

  async setMode(mode: ThemeMode): Promise<void> {
    await this.themeService.setTheme(this.currentTheme, mode);
  }

  async toggleDarkMode(): Promise<void> {
    await this.themeService.toggleDarkMode();
  }

  async toggleHighContrast(): Promise<void> {
    await this.themeService.setHighContrast(!this.isHighContrast);
  }

  // ===================================
  // 🏥 MEDICAL CONTEXT METHODS
  // ===================================

  setPatientContext(status: MedicalThemeContext['patientStatus']): void {
    this.themeService.setPatientContext(status);
  }

  setAppointmentContext(status: MedicalThemeContext['appointmentStatus']): void {
    this.themeService.setAppointmentContext(status);
  }

  setBillContext(status: MedicalThemeContext['billStatus']): void {
    this.themeService.setBillContext(status);
  }

  setUrgencyContext(level: MedicalThemeContext['urgency']): void {
    this.themeService.setUrgencyContext(level);
  }

  clearMedicalContext(): void {
    this.themeService.clearMedicalContext();
  }

  // ===================================
  // 🔍 UTILITY METHODS
  // ===================================

  getCSSVariable(variableName: string): string {
    return this.themeService.getCSSVariable(variableName) || 'Not found';
  }

  getThemeInfo(): string {
    return `Theme: ${this.currentTheme} | Mode: ${this.currentMode} | Dark: ${this.isDarkMode} | High Contrast: ${this.isHighContrast}`;
  }

  // Method to get current medical context
  getCurrentMedicalContext(): string {
    const state = this.themeService.getCurrentThemeState();
    const context = state.medicalContext;

    if (!context) return 'None';

    const parts: string[] = [];
    if (context.patientStatus) parts.push(`Patient: ${context.patientStatus}`);
    if (context.appointmentStatus) parts.push(`Appointment: ${context.appointmentStatus}`);
    if (context.billStatus) parts.push(`Bill: ${context.billStatus}`);
    if (context.urgency) parts.push(`Urgency: ${context.urgency}`);

    return parts.join(' | ');
  }
}