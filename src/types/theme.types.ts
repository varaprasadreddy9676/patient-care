/**
 * MedicsCare Theme System Type Definitions
 * Professional enterprise theme management for healthcare applications
 */

export type ThemeMode = 'light' | 'dark' | 'auto';

export type ThemeName = 'medicscare-light' | 'medicscare-dark' | 'custom-high-contrast';

export interface ThemeColors {
  // Primary Brand Colors
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;  // Main brand color
    600: string;
    700: string;
    800: string;
    900: string;
  };

  // Neutral Colors
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };

  // Semantic Colors
  success: {
    50: string;
    100: string;
    500: string;
    600: string;
  };

  warning: {
    50: string;
    100: string;
    500: string;
    600: string;
  };

  error: {
    50: string;
    100: string;
    500: string;
    600: string;
  };

  info: {
    50: string;
    100: string;
    500: string;
    600: string;
  };
}

export interface MedicalColors {
  // Patient Status Colors
  patient: {
    active: string;
    inactive: string;
    pending: string;
    critical: string;
  };

  // Appointment Status Colors
  appointment: {
    booked: string;
    confirmed: string;
    inProgress: string;
    completed: string;
    cancelled: string;
    noShow: string;
  };

  // Bill Payment Status Colors
  bill: {
    paid: string;
    pending: string;
    overdue: string;
    partial: string;
    refunded: string;
  };

  // Medical Record Status Colors
  record: {
    draft: string;
    finalized: string;
    amended: string;
    archived: string;
  };

  // Department/Specialty Colors
  department: {
    general: string;
    emergency: string;
    cardiology: string;
    pediatrics: string;
    orthopedics: string;
    neurology: string;
  };
}

export interface ThemeTypography {
  // Font Families
  fontFamily: {
    primary: string;
    secondary: string;
    mono: string;
  };

  // Font Sizes
  fontSize: {
    display: {
      xl: string;
      lg: string;
      md: string;
      sm: string;
    };
    heading: {
      xl: string;
      lg: string;
      md: string;
      sm: string;
      xs: string;
    };
    body: {
      xl: string;
      lg: string;
      md: string;
      sm: string;
      xs: string;
    };
  };

  // Font Weights
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };

  // Line Heights
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
}

export interface ThemeShadows {
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeZIndex {
  base: number;
    dropdown: number;
    sticky: number;
    fixed: number;
    modalBackdrop: number;
    modal: number;
    popover: number;
    tooltip: number;
    notification: number;
}

export interface ThemeBorderRadius {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ThemeConfig {
  name: ThemeName;
  mode: ThemeMode;
  colors: ThemeColors;
  medicalColors: MedicalColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  shadows: ThemeShadows;
  zIndex: ThemeZIndex;
  borderRadius: ThemeBorderRadius;
}

export interface ThemeToken {
  category: 'color' | 'medical' | 'typography' | 'spacing' | 'shadow' | 'z-index' | 'border-radius';
  subcategory: string;
  variant?: string;
  value: string;
  description?: string;
}

export interface ThemePalette {
  [key: string]: ThemeConfig;
}

// Utility Types for Theme Service
export type ThemeChangeEvent = {
  theme: ThemeName;
  mode: ThemeMode;
  previousTheme?: ThemeName;
  previousMode?: ThemeMode;
};

export type ThemeStorageData = {
  currentTheme: ThemeName;
  currentMode: ThemeMode;
  customSettings?: Record<string, any>;
};

// CSS Variable Mapping Types
export interface CSSVariableMapping {
  [tokenName: string]: string;
}

// Medical Context Types for Component Theming
export interface MedicalThemeContext {
  patientStatus: 'active' | 'inactive' | 'pending' | 'critical';
  appointmentStatus: 'booked' | 'confirmed' | 'inProgress' | 'completed' | 'cancelled' | 'noShow';
  billStatus: 'paid' | 'pending' | 'overdue' | 'partial' | 'refunded';
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

// Component Theme Props
export interface ThemedComponentProps {
  theme?: ThemeName;
  mode?: ThemeMode;
  medicalContext?: MedicalThemeContext;
  className?: string;
}

// Export all types as a namespace for easier importing
export namespace MedicsCareTheme {
  export type { ThemeColors, MedicalColors, ThemeTypography, ThemeConfig };
  export type { ThemeMode, ThemeName, ThemeToken, ThemePalette };
  export type { ThemeChangeEvent, ThemeStorageData, CSSVariableMapping };
  export type { MedicalThemeContext, ThemedComponentProps };
}