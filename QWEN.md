# MedicsCare Application Context

## Project Overview

MedicsCare is a comprehensive healthcare mobile application built with **Ionic Angular** and **Capacitor**, providing patients with seamless access to medical services, appointment management, prescriptions, and health records. It's a full-featured healthcare app that connects patients with medical services through an intuitive mobile interface and supports multiple user roles including patients, administrators, and system admins.

## Technology Stack

- **Framework**: Ionic 8.3.1 with Angular 18.0.0
- **Native Mobile**: Capacitor 6.1.2
- **Language**: TypeScript 5.4.0
- **UI Components**: Angular Material 18.2.7 with Ionic components
- **Design Theme**: Azure Blue Material Design with SCSS styling
- **Testing**: Jasmine + Karma for unit testing
- **Package Manager**: npm

## Core Features

### Authentication & Security
- Multi-factor authentication with OTP verification via SMS
- Biometric authentication (fingerprint/Face ID)
- Role-based access control (Patient, Admin, System Admin)
- JWT-based token management with automatic refresh

### Healthcare Management
- **Appointment System**: Book, reschedule, and cancel appointments with video consultation support
- **Prescription Management**: Digital prescriptions and medication tracking
- **EMR System**: Electronic Medical Records with visit records and document management
- **Family Member Support**: Manage health records for multiple family members

### Payments & Billing
- Multiple payment options (Razorpay, UPI, digital wallets)
- Bill management and payment history
- PCI-compliant transaction processing

### Mobile-Specific Features
- Camera integration for document scanning
- File management with secure document storage
- Push notifications for appointments and medications
- Offline support with local data caching

## Project Structure

```
src/
├── app/                    # Main app module and routing
├── pages/                  # Application pages (20+ directories)
│   ├── appointment/        # Appointment booking & management
│   ├── login/              # Authentication flows
│   ├── home/               # Dashboard & main navigation
│   ├── prescription/       # Medication management
│   ├── attachments/        # Document upload & management
│   ├── financials/         # Billing & payments
│   ├── family-member/      # Family profile management
│   ├── emr/                # Electronic Medical Records
│   ├── visit-records/      # Consultation history
│   ├── user/               # Profile management
│   ├── customer-service/   # Support & service requests
│   └── audit-trail-admin/  # Administrative functions
├── services/               # Business logic and API integration
│   ├── http/               # API communication layer
│   ├── authentication/     # Auth & biometric services
│   ├── storage/            # Local data persistence
│   ├── navigation/         # Route & back button handling
│   ├── payment-gateway/    # Payment processing
│   ├── appointment/        # Appointment business logic
│   ├── users/              # User management
│   ├── utility/            # Common utilities
│   └── date/               # Date formatting & calculations
├── assets/                 # Static assets and images
├── environments/           # Environment configuration files
├── theme/                  # SCSS theme files
└── global.scss             # Global styles
```

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm start
# or
ionic serve

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Build for Android
npx cap build android

# Run on Android device
npx cap run android

# Sync Capacitor
npx cap sync
```

## Configuration

### Environment Variables
- `production`: boolean flag
- `BASE_URL`: API server URL
- `HOSPITAL_ID`: Hospital identifier
- `APP_ID`: Application identifier

### Application Bundle
- **App ID**: `com.ubq.medicscare`
- **Bundle Size Limits**: 2MB warning, 5MB error
- **Supported Platforms**: Android, iOS, Web

## Mobile Platform Details

The app uses Capacitor for native functionality, including:
- Camera plugin for photo capture
- Filesystem plugin for file management
- Biometric authentication
- App preferences and settings
- Status bar and splash screen management
- Haptic feedback

## API Integration

The application integrates with multiple backend services:
- Authentication API for user management
- Appointment API for scheduling
- Payment API for transaction processing
- EMR API for medical records and prescriptions
- User Management API for profile management

APIs use RESTful patterns with JWT authentication and automatic token refresh mechanisms.

## Security Features

- Data encryption for secure local storage
- HTTPS communication for API calls
- Multi-factor authentication system
- Device-native biometric security
- Session management with automatic logout on token expiry

## Development Guidelines

- Follow Angular style guide and TypeScript strict mode
- Component-based architecture with proper separation of concerns
- Use Ionic components for UI consistency
- Write unit tests for new features
- Use reactive programming with RxJS observables
- Follow ESLint configuration for code quality

## Directory-Specific Notes

- **src/pages/**: Each directory represents a major feature area of the app (appointment, prescription, emr, etc.)
- **src/services/**: Organized by functionality (http, authentication, users, etc.)
- Multiple guide files in the root directory provide standards for development: color standardization, component library, form standards, mobile UX, spacing/layout, and typography