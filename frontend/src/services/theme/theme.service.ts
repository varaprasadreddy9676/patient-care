/**
 * MedicsCare Theme Service
 * Enterprise theme management for healthcare applications
 *
 * Provides centralized theme control with:
 * - Light/dark mode support
 * - Medical context awareness
 * - Persistent user preferences
 * - Accessibility features
 * - Real-time theme switching
 */

import { Injectable, Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import { Platform } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';

import {
  ThemeName,
  ThemeMode,
  ThemeConfig,
  ThemeChangeEvent,
  ThemeStorageData,
  MedicalThemeContext,
  MedicsCareTheme
} from '../../types/theme.types';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Constants
  private readonly STORAGE_KEY = 'medicscare-theme';
  private readonly THEME_ATTRIBUTE = 'data-theme';
  private readonly CONTRAST_ATTRIBUTE = 'data-contrast';

  // Internal state
  private currentTheme$ = new BehaviorSubject<ThemeName>('medicscare-light');
  private currentMode$ = new BehaviorSubject<ThemeMode>('auto');
  private medicalContext$ = new BehaviorSubject<MedicalThemeContext | null>(null);
  private isHighContrast$ = new BehaviorSubject<boolean>(false);

  // Cache for theme configurations
  private themeConfigs: Map<ThemeName, ThemeConfig> = new Map();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private platform: Platform,
  ) {
    this.initializeThemeSystem();
  }

  // ===================================
  // 🎨 THEME INITIALIZATION
  // ===================================

  private async initializeThemeSystem(): Promise<void> {
    try {
      // Wait for platform to be ready
      await this.platform.ready();

      // Load saved preferences
      const savedData = await this.loadThemeFromStorage();

      // Detect system preference if in auto mode
      const systemPreference = this.detectSystemThemePreference();

      // Apply initial theme
      const initialTheme = savedData?.currentTheme || 'medicscare-light';
      const initialMode = savedData?.currentMode || 'auto';

      await this.setTheme(initialTheme, initialMode, false); // No save for initial load

      // Apply high contrast if detected
      if (this.detectHighContrastPreference()) {
        await this.setHighContrast(true);
      }

      // Listen for system preference changes
      this.setupSystemPreferenceListeners();

    } catch (error) {
      // // console.error('ThemeService: Failed to initialize theme system', error);
      // Fallback to light theme
      await this.setTheme('medicscare-light', 'light', false);
    }
  }

  // ===================================
  // 🔧 PUBLIC THEME METHODS
  // ===================================

  /**
   * Set the active theme and mode
   */
  async setTheme(theme: ThemeName, mode: ThemeMode = 'auto', save: boolean = true): Promise<void> {
    try {
      const previousTheme = this.currentTheme$.value;
      const previousMode = this.currentMode$.value;

      // Update internal state
      this.currentTheme$.next(theme);
      this.currentMode$.next(mode);

      // Apply theme to DOM
      this.applyThemeToDOM(theme, mode);

      // Save preference if requested
      if (save) {
        await this.saveThemeToStorage({ currentTheme: theme, currentMode: mode });
      }

      // Emit change event
      const changeEvent: ThemeChangeEvent = {
        theme,
        mode,
        previousTheme,
        previousMode
      };

      this.emitThemeChange(changeEvent);

    } catch (error) {
      // // console.error('ThemeService: Failed to set theme', error);
      throw error;
    }
  }

  /**
   * Toggle between light and dark modes
   */
  async toggleDarkMode(): Promise<ThemeMode> {
    const currentMode = this.currentMode$.value;
    const newMode = currentMode === 'light' ? 'dark' : 'light';

    await this.setTheme(this.currentTheme$.value, newMode);
    return newMode;
  }

  /**
   * Enable or disable high contrast mode
   */
  async setHighContrast(enabled: boolean): Promise<void> {
    this.isHighContrast$.next(enabled);

    if (enabled) {
      this.document.documentElement.setAttribute(this.CONTRAST_ATTRIBUTE, 'high');
    } else {
      this.document.documentElement.removeAttribute(this.CONTRAST_ATTRIBUTE);
    }
  }

  /**
   * Set medical context for theme-aware styling
   */
  setMedicalContext(context: MedicalThemeContext): void {
    this.medicalContext$.next(context);

    // Apply context classes to body for CSS targeting
    const body = this.document.body;

    // Remove existing context classes
    body.classList.remove(
      'patient-active', 'patient-inactive', 'patient-pending', 'patient-critical',
      'appointment-booked', 'appointment-confirmed', 'appointment-in-progress',
      'appointment-completed', 'appointment-cancelled', 'appointment-no-show'
    );

    // Add new context classes based on current context
    if (context.patientStatus) {
      body.classList.add(`patient-${context.patientStatus}`);
    }
    if (context.appointmentStatus) {
      const appointmentClass = `appointment-${context.appointmentStatus.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      body.classList.add(appointmentClass);
    }
    if (context.billStatus) {
      const billClass = `bill-${context.billStatus.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      body.classList.add(billClass);
    }
    if (context.urgency) {
      body.classList.add(`urgency-${context.urgency}`);
    }
  }

  /**
   * Clear medical context
   */
  clearMedicalContext(): void {
    this.medicalContext$.next(null);

    // Remove all context classes from body
    const body = this.document.body;
    body.className = body.className.replace(/\b(patient-|appointment-|bill-|urgency-)\S+/g, '');
  }

  // ===================================
  // 📊 THEME STATE OBSERVABLES
  // ===================================

  /**
   * Get current theme name as observable
   */
  getCurrentTheme$(): Observable<ThemeName> {
    return this.currentTheme$.asObservable();
  }

  /**
   * Get current theme mode as observable
   */
  getCurrentMode$(): Observable<ThemeMode> {
    return this.currentMode$.asObservable();
  }

  /**
   * Get medical context as observable
   */
  getMedicalContext$(): Observable<MedicalThemeContext | null> {
    return this.medicalContext$.asObservable();
  }

  /**
   * Get high contrast state as observable
   */
  getHighContrast$(): Observable<boolean> {
    return this.isHighContrast$.asObservable();
  }

  /**
   * Get effective theme (resolves auto mode) as observable
   */
  getEffectiveTheme$(): Observable<ThemeName> {
    return this.currentMode$.pipe(
      map(mode => {
        if (mode === 'auto') {
          return this.detectSystemThemePreference() === 'dark' ? 'medicscare-dark' : 'medicscare-light';
        }
        return mode === 'dark' ? 'medicscare-dark' : 'medicscare-light';
      })
    );
  }

  /**
   * Get current theme state as a single observable
   */
  getThemeState$(): Observable<{
    theme: ThemeName;
    mode: ThemeMode;
    effectiveTheme: ThemeName;
    isHighContrast: boolean;
    medicalContext: MedicalThemeContext | null;
  }> {
    return new Observable(observer => {
      const updateState = () => {
        const mode = this.currentMode$.value;
        const effectiveTheme = mode === 'auto'
          ? (this.detectSystemThemePreference() === 'dark' ? 'medicscare-dark' : 'medicscare-light')
          : (mode === 'dark' ? 'medicscare-dark' : 'medicscare-light');

        observer.next({
          theme: this.currentTheme$.value,
          mode,
          effectiveTheme,
          isHighContrast: this.isHighContrast$.value,
          medicalContext: this.medicalContext$.value
        });
      };

      // Subscribe to all relevant observables
      const subscriptions = [
        this.currentTheme$.subscribe(updateState),
        this.currentMode$.subscribe(updateState),
        this.isHighContrast$.subscribe(updateState),
        this.medicalContext$.subscribe(updateState)
      ];

      // Initial state
      updateState();

      // Cleanup
      return () => {
        subscriptions.forEach(sub => sub.unsubscribe());
      };
    });
  }

  // ===================================
  // 🎯 THEME UTILITY METHODS
  // ===================================

  /**
   * Get current theme state synchronously
   */
  getCurrentThemeState(): {
    theme: ThemeName;
    mode: ThemeMode;
    effectiveTheme: ThemeName;
    isHighContrast: boolean;
    medicalContext: MedicalThemeContext | null;
  } {
    const mode = this.currentMode$.value;
    const effectiveTheme = mode === 'auto'
      ? (this.detectSystemThemePreference() === 'dark' ? 'medicscare-dark' : 'medicscare-light')
      : (mode === 'dark' ? 'medicscare-dark' : 'medicscare-light');

    return {
      theme: this.currentTheme$.value,
      mode,
      effectiveTheme,
      isHighContrast: this.isHighContrast$.value,
      medicalContext: this.medicalContext$.value
    };
  }

  /**
   * Check if dark mode is currently active
   */
  isDarkMode(): boolean {
    const state = this.getCurrentThemeState();
    return state.effectiveTheme === 'medicscare-dark';
  }

  /**
   * Check if high contrast mode is active
   */
  isHighContrastMode(): boolean {
    return this.isHighContrast$.value;
  }

  /**
   * Get CSS custom property value
   */
  getCSSVariable(propertyName: string): string | null {
    return getComputedStyle(this.document.documentElement)
      .getPropertyValue(`--${propertyName}`)
      .trim() || null;
  }

  /**
   * Set CSS custom property value (for runtime customization)
   */
  setCSSVariable(propertyName: string, value: string): void {
    this.document.documentElement.style.setProperty(`--${propertyName}`, value);
  }

  // ===================================
  // 🔄 PERSISTENCE METHODS
  // ===================================

  private async loadThemeFromStorage(): Promise<ThemeStorageData | null> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEY });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      // // console.error('ThemeService: Failed to load theme from storage', error);
      return null;
    }
  }

  private async saveThemeToStorage(data: ThemeStorageData): Promise<void> {
    try {
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(data)
      });
    } catch (error) {
      // // console.error('ThemeService: Failed to save theme to storage', error);
    }
  }

  // ===================================
  // 🎨 DOM MANIPULATION METHODS
  // ===================================

  private applyThemeToDOM(theme: ThemeName, mode: ThemeMode): void {
    const root = this.document.documentElement;

    // Apply theme attribute
    root.setAttribute(this.THEME_ATTRIBUTE, theme.replace('medicscare-', ''));

    // For auto mode, let CSS media queries handle the rest
    if (mode === 'auto') {
      root.removeAttribute('data-force-theme');
    } else {
      root.setAttribute('data-force-theme', mode);
    }

    // Apply theme-specific class for additional styling
    root.className = root.className.replace(/\btheme-\S+/g, '');
    root.classList.add(`theme-${theme.replace('medicscare-', '')}`);
  }

  // ===================================
  // 🖥️ SYSTEM PREFERENCE DETECTION
  // ===================================

  private detectSystemThemePreference(): 'light' | 'dark' {
    if (this.platform.is('capacitor')) {
      // Native platform detection (can be enhanced with Capacitor plugins)
      return 'light'; // Default for now
    } else {
      // Web platform detection
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  }

  private detectHighContrastPreference(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  private setupSystemPreferenceListeners(): void {
    if (!this.platform.is('capacitor')) {
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.currentMode$.value === 'auto') {
          // Re-apply theme to let CSS media queries take effect
          this.applyThemeToDOM(this.currentTheme$.value, 'auto');
        }
      });

      // Listen for high contrast changes
      const contrastQuery = window.matchMedia('(prefers-contrast: high)');
      contrastQuery.addEventListener('change', (e) => {
        this.setHighContrast(e.matches);
      });
    }
  }

  // ===================================
  // 📡 EVENT EMISSION
  // ===================================

  private emitThemeChange(event: ThemeChangeEvent): void {
    // Create a custom event for global listeners
    const customEvent = new CustomEvent('themechange', { detail: event });
    this.document.dispatchEvent(customEvent);
  }

  // ===================================
  // 🏥 MEDICAL CONTEXT UTILITIES
  // ===================================

  /**
   * Apply patient status styling context
   */
  setPatientContext(status: 'active' | 'inactive' | 'pending' | 'critical'): void {
    const currentContext = this.medicalContext$.value || {} as MedicalThemeContext;
    this.setMedicalContext({ ...currentContext, patientStatus: status });
  }

  /**
   * Apply appointment status styling context
   */
  setAppointmentContext(status: MedicalThemeContext['appointmentStatus']): void {
    const currentContext = this.medicalContext$.value || {} as MedicalThemeContext;
    this.setMedicalContext({ ...currentContext, appointmentStatus: status });
  }

  /**
   * Apply bill status styling context
   */
  setBillContext(status: MedicalThemeContext['billStatus']): void {
    const currentContext = this.medicalContext$.value || {} as MedicalThemeContext;
    this.setMedicalContext({ ...currentContext, billStatus: status });
  }

  /**
   * Apply urgency level styling context
   */
  setUrgencyContext(level: MedicalThemeContext['urgency']): void {
    const currentContext = this.medicalContext$.value || {} as MedicalThemeContext;
    this.setMedicalContext({ ...currentContext, urgency: level });
  }
}