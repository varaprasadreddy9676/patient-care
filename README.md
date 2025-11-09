# MedicsCare Mobile Application

A comprehensive healthcare mobile application built with Ionic Angular and Capacitor, providing patients with seamless access to medical services, appointment management, prescriptions, and health records.

## 🏥 Overview

MedicsCare is a full-featured healthcare app that connects patients with medical services through an intuitive mobile interface. The application supports multiple user roles including patients, administrators, and system admins, offering a complete healthcare ecosystem.

## ✨ Key Features

### 👤 Authentication & Security
- **Multi-factor Authentication**: OTP verification via SMS
- **Biometric Authentication**: Fingerprint/Face ID login support
- **Role-based Access Control**: Patient, Admin, and System Admin roles
- **Secure Token Management**: JWT-based authentication with automatic refresh

### 📅 Appointment Management
- **Book Appointments**: Schedule consultations with preferred doctors
- **Hospital Preference**: Select and modify preferred healthcare facilities
- **Appointment Tracking**: View upcoming, today's, and past appointments
- **Rescheduling & Cancellation**: Modify or cancel existing appointments
- **Video Consultations**: Support for telemedicine appointments
- **Consent Forms**: Digital consent management

### 💊 Prescription Management
- **Digital Prescriptions**: View and manage prescribed medications
- **Prescription History**: Access historical prescription data
- **Medication Tracking**: Monitor ongoing treatments

### 🏥 Medical Records & EMR
- **Electronic Medical Records**: Complete patient health history
- **Visit Records**: Detailed consultation summaries
- **Medical Attachments**: Upload and manage medical documents
- **Family Member Support**: Manage health records for family members
- **Document Management**: Drag-and-drop file uploads with categorization

### 💳 Payment Integration
- **Multiple Payment Options**: 
  - Razorpay integration for cards/net banking
  - UPI payments (Google Pay, BHIM UPI)
  - Digital wallet support
- **Bill Management**: View and pay medical bills
- **Payment History**: Track all financial transactions
- **Secure Transactions**: PCI-compliant payment processing

### 👨‍👩‍👧‍👦 Family Management
- **Multiple Profiles**: Manage health records for family members
- **Profile Switching**: Easy switching between family member accounts
- **Shared Medical History**: Centralized family health management

### 🔔 Notifications & Reminders
- **Appointment Reminders**: Automated notifications for upcoming appointments
- **Medication Alerts**: Prescription and dosage reminders
- **Health Notifications**: Important health updates and alerts

### 👨‍💼 Administrative Features
- **Audit Trail**: Complete user activity tracking (Admin)
- **User Management**: User information and role management
- **Facility Management**: Hospital and clinic information management
- **Customer Service**: Service request management and support tickets

## 🛠 Technology Stack

### Core Framework
- **Ionic Framework**: 8.3.1
- **Angular**: 18.0.0
- **Capacitor**: 6.1.2 (Native mobile capabilities)
- **TypeScript**: 5.4.0

### UI & Design
- **Angular Material**: 18.2.7 (Material Design components)
- **Ionic Components**: Native mobile UI components
- **SCSS**: Custom styling with theme support
- **HammerJS**: Touch gesture support

### Mobile Features
- **Capacitor Plugins**:
  - Camera (Photo capture)
  - Filesystem (File management)
  - Biometric authentication
  - App preferences
  - Status bar & splash screen
  - Haptic feedback

### Development Tools
- **ESLint**: Code linting and formatting
- **Jasmine + Karma**: Unit testing framework
- **Angular CLI**: Development and build tools

### Third-party Integrations
- **Payment Gateways**: Razorpay, UPI systems
- **Date Management**: Moment.js
- **OTP Input**: ng-otp-input
- **Storage**: Ionic Storage with multiple drivers

## 📱 Application Architecture

### Page-Based Structure
```
src/pages/
├── appointment/          # Appointment booking & management
├── login/               # Authentication flows
├── home/                # Dashboard & main navigation
├── prescription/        # Medication management
├── attachments/         # Document upload & management
├── financials/          # Billing & payments
├── family-member/       # Family profile management
├── emr/                 # Electronic Medical Records
├── visit-records/       # Consultation history
├── user/                # Profile management
├── customer-service/    # Support & service requests
└── audit-trail-admin/   # Administrative functions
```

### Service Architecture
```
src/services/
├── http/                # API communication layer
├── authentication/      # Auth & biometric services
├── storage/             # Local data persistence
├── navigation/          # Route & back button handling
├── payment-gateway/     # Payment processing
├── appointment/         # Appointment business logic
├── users/               # User management
├── utility/             # Common utilities
└── date/                # Date formatting & calculations
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Ionic CLI: `npm install -g @ionic/cli`
- Android Studio (for Android development)
- Capacitor CLI: `npm install -g @capacitor/cli`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd medics-care-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Configure environment variables in:
   # src/environments/environment.ts (development)
   # src/environments/environment.prod.ts (production)
   ```

4. **Run the application**
   ```bash
   # Development server
   npm start
   # or
   ionic serve
   ```

### Development Commands

```bash
# Start development server
npm start

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

## 🏗 Build & Deployment

### Web Build
```bash
npm run build
# Output: www/ directory
```

### Android Build
```bash
# Sync web assets to Android
npx cap sync android

# Build Android APK
npx cap build android

# Open in Android Studio
npx cap open android
```

### Environment Configuration
- **Development**: `localhost:3081` (Local server)
- **Validation**: `validation.medicsprime.in/medicscare-val-server`
- **Production**: `medicsprime.in/medicscare`

## 🔧 Configuration

### Key Settings
- **App ID**: `com.ubq.medicscare`
- **Bundle Size Limits**: 2MB warning, 5MB error
- **Supported Platforms**: Android, iOS, Web
- **Theme**: Azure Blue Material Design

### Environment Variables
```typescript
export const environment = {
  production: boolean,
  BASE_URL: string,        // API server URL
  HOSPITAL_ID: string,     // Hospital identifier
  APP_ID: string          // Application identifier
};
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run tests in CI mode
ng test --watch=false --browsers=ChromeHeadless
```

### Test Structure
- **Component Tests**: `*.spec.ts` files alongside components
- **Service Tests**: Unit tests for business logic
- **E2E Tests**: Integration testing (to be configured)

## 📚 API Integration

### Backend Services
- **Authentication API**: User login, registration, OTP verification
- **Appointment API**: Booking, scheduling, management
- **Payment API**: Transaction processing, bill management
- **EMR API**: Medical records, prescriptions, attachments
- **User Management API**: Profile management, family members

### API Architecture
- **RESTful APIs**: Standard HTTP methods
- **JWT Authentication**: Bearer token authorization
- **Error Handling**: Comprehensive error management
- **Request Interceptors**: Automatic token refresh

## 🔒 Security Features

- **Data Encryption**: Secure local storage
- **API Security**: HTTPS communication
- **Authentication**: Multi-factor authentication
- **Biometric Security**: Device-native authentication
- **Session Management**: Automatic logout on token expiry

## 📱 Mobile Features

- **Offline Support**: Local data caching
- **Push Notifications**: Appointment and health reminders
- **Camera Integration**: Document scanning and upload
- **File Management**: Secure document storage
- **Biometric Authentication**: Fingerprint/Face ID
- **Native Performance**: Capacitor-powered native features

## 👥 Contributing

### Development Guidelines
- Follow Angular style guide
- Use TypeScript strict mode
- Write unit tests for new features
- Follow component-based architecture
- Use Ionic components for UI consistency

### Code Quality
- ESLint configuration enforced
- Pre-commit hooks for code formatting
- Component and service separation
- Reactive programming with RxJS

## 📄 License

This project is proprietary software developed for UBQ MedicsCare healthcare services.

## 📞 Support

For technical support and development queries:
- Review the CLAUDE.md file for development guidance
- Check the Ionic documentation for framework-specific issues
- Consult Angular documentation for framework features

---

**MedicsCare** - Revolutionizing healthcare access through technology 🏥✨