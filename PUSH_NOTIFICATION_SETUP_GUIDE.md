# Complete Push Notification Setup Guide

## 📋 Prerequisites
- Firebase account
- Google account
- For iOS: Mac computer, Xcode, Apple Developer account ($99/year)
- For Android: Physical Android device or Android Studio emulator
- Node.js and npm installed

---

## 🔥 Step 1: Firebase Project Setup (Required for All Platforms)

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `medicscare-app` (or similar)
4. Enable Google Analytics (optional but recommended)
5. Click "Create project"
6. Wait for project to initialize (1-2 minutes)

### 1.2 Get Firebase Configuration
1. In Firebase Console, go to **Project Settings** (⚙️ icon)
2. Under "Your apps", click the web icon (`</>`)
3. App nickname: `MedicsCare Web`
4. Click "Register app"
5. **COPY the firebaseConfig object** - you'll need this later
6. Click "Continue to console"

### 1.3 Enable Cloud Messaging
1. In Firebase Console, go to **Cloud Messaging** (under "Build")
2. Make sure "Cloud Messaging API" is enabled
3. For web: Go to **Project Settings → Cloud Messaging → Web Push certificates**
4. Click "Generate key pair"
5. **COPY the VAPID public key** - you'll need this for web

---

## 🌐 Step 2: Web Push Notification Setup

### 2.1 Create Service Worker
Create this file in your project root:

**`public/firebase-messaging-sw.js`**
```javascript
// Import and configure the Firebase SDK
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Your web app's Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/icon/favicon.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

### 2.2 Update Firebase Configuration
Update `src/environments/firebase.config.ts` with your actual Firebase config:

```typescript
export const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id",
  measurementId: "your-measurement-id" // optional
};
```

### 2.3 Update VAPID Key
In `src/services/push-notification.service.ts`, replace the placeholder:

```typescript
// Find this line in initWebPush method:
const vapidKey = 'YOUR_WEB_PUSH_CERTIFICATE_KEY';

// Replace with your actual VAPID key from Firebase Console
const vapidKey = 'your-actual-vapid-key-here';
```

### 2.4 Update angular.json for Service Worker
Add the service worker to your build configuration:

**`angular.json`** (find your project → architect → build → options):
```json
{
  "options": {
    "serviceWorker": true,
    "ngswConfigPath": "ngsw-config.json"
  }
}
```

### 2.5 Test Web Push Notifications
```bash
# Build the app
ng build --configuration=development

# Serve with HTTPS (required for push notifications)
npx serve -s www -l 4200 --ssl-cert localhost.pem --ssl-key localhost-key.pem

# OR use a simple HTTPS server:
npx http-server www -S -C localhost.pem -K localhost-key.pem -p 4200
```

**Note:** For local HTTPS, you can generate certificates:
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout localhost-key.pem -out localhost.pem
```

---

## 🤖 Step 3: Android Push Notification Setup

### 3.1 Add Android App to Firebase
1. In Firebase Console, go to **Project Settings**
2. Click "Add app" → Android icon
3. **Package name:** `com.ubq.medicscare` (from `android/app/build.gradle`)
4. **App nickname:** `MedicsCare Android`
5. Click "Register app"

### 3.2 Download google-services.json
1. Firebase will generate `google-services.json`
2. **Download this file**
3. Place it in: `android/app/google-services.json`

### 3.3 Add Firebase SDK to Android (Already Done)
The implementation already includes:
- ✅ Firebase messaging dependency in `android/app/build.gradle`
- ✅ Google services plugin in `android/build.gradle`
- ✅ Permissions in `AndroidManifest.xml`

### 3.4 Test on Android Device/Emulator
```bash
# Connect Android device or start emulator
# Enable USB debugging on device

# Build and run
npx cap run android

# OR build APK
npx cap build android
# Then install APK manually
```

### 3.5 Troubleshooting Android
If build fails:
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx cap run android
```

---

## 🍎 Step 4: iOS Push Notification Setup

### 4.1 Install Xcode
1. Install **Xcode** from Mac App Store (8GB+ download)
2. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```

### 4.2 Set Up Apple Developer Account
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Enroll in Apple Developer Program ($99/year)
3. Sign in with your Apple ID

### 4.3 Create App ID in Apple Developer Portal
1. Go to **Certificates, Identifiers & Profiles**
2. Click "Identifiers" → "App IDs" → "+"
3. **Description:** `MedicsCare App`
4. **Bundle ID:** `com.ubq.medicscare` (must match Android package name)
5. Check **Push Notifications** capability
6. Click "Continue" → "Register"

### 4.4 Create Push Notification Certificate
1. In App ID details, click "Configure" next to Push Notifications
2. Under "Development SSL Certificate", click "Create Certificate"
3. **IMPORTANT:** Follow these steps exactly:
   - Open **Keychain Access** on Mac
   - **Keychain Access → Certificate Assistant → Request a Certificate From a Certificate Authority**
   - **User Email Address:** Your email
   - **Common Name:** `MedicsCare Push Certificate`
   - **Requested to:** `Saved to disk`
   - Save as `CertificateSigningRequest.certSigningRequest`
4. Upload this file to Apple Developer Portal
5. Download the generated certificate (.cer file)
6. **Double-click** to install in Keychain Access
7. Export as .p12 file:
   - In Keychain Access, find the certificate
   - Right-click → Export
   - Save as `push_certificate.p12`
   - Set a password (remember it!)

### 4.5 Add iOS App to Firebase
1. In Firebase Console, go to **Project Settings**
2. Click "Add app" → iOS icon
3. **Bundle ID:** `com.ubq.medicscare`
4. **App nickname:** `MedicsCare iOS`
5. Click "Register app"

### 4.6 Download GoogleService-Info.plist
1. Firebase will generate `GoogleService-Info.plist`
2. **Download this file**
3. Place it in: `ios/App/App/GoogleService-Info.plist`

### 4.7 Configure Push Notifications in Xcode
1. Open Xcode project:
   ```bash
   open ios/App/App.xcworkspace
   ```
2. Select your app target (top left, under "PROJECT")
3. Go to **Signing & Capabilities** tab
4. Click "+ Capability"
5. Add **Push Notifications**
6. Click "+ Capability" again
7. Add **Background Modes**
8. Check **Remote notifications**

### 4.8 Install iOS Dependencies
```bash
# Navigate to iOS directory
cd ios/App

# Install CocoaPods dependencies
pod install

# Go back to project root
cd ../..
```

### 4.9 Upload APNs Certificate to Firebase
1. In Firebase Console → Project Settings → Cloud Messaging
2. Under "Apple app configuration", click "Upload"
3. Select your .p12 certificate file
4. Enter the certificate password
5. Certificate type: Development (for testing) or Production (for App Store)

### 4.10 Test on iOS Device
```bash
# Connect physical iPhone/iPad (required - simulator doesn't support push)
# Trust your computer on the device

# Build and run
npx cap run ios

# OR open in Xcode and run from there
open ios/App/App.xcworkspace
```

---

## 🧪 Step 5: Testing Push Notifications

### 5.1 Test via Firebase Console
1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. **Notification title:** "Test Message"
4. **Notification text:** "This is a test push notification"
5. **Target:** Send to specific device token
6. Paste your device token (from browser console logs)
7. Click "Send test message"

### 5.2 Find Your Device Token
After logging into the app, check browser console:
```javascript
// Look for these logs:
"Push registration success, token: fcmtoken_here..."
"Web push token: fcmtoken_here..."
```

### 5.3 Test via Backend API (if implemented)
```bash
curl -X POST "https://your-api-domain.com/api/push/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "userId": "your-user-id",
    "title": "Test Notification",
    "body": "This is a test from backend",
    "data": {
      "type": "appointment",
      "appointmentId": "123"
    }
  }'
```

---

## 🚨 Common Issues and Solutions

### Web Issues
- **"Service Worker not found"**: Ensure `firebase-messaging-sw.js` is in `public/` folder
- **"VAPID key invalid"**: Double-check VAPID key from Firebase Console
- **"HTTPS required"**: Use HTTPS for web push (localhost works with ngrok)

### Android Issues
- **"google-services.json not found"**: Place file in `android/app/` directory
- **"Device token not registered"**: Check network connection and API endpoints
- **"Permission denied"**: Ensure app has notification permissions

### iOS Issues
- **"Certificate invalid"**: Re-create APNs certificate
- **"No device token"**: Ensure physical device (not simulator)
- **"Push not received"**: Check device notification settings

### Firebase Issues
- **"Project not found"**: Verify firebaseConfig values
- **"Invalid credentials"**: Regenerate API keys if needed
- **"Quota exceeded"**: Check Firebase usage limits

---

## ✅ Final Verification Checklist

- [ ] Firebase project created
- [ ] Firebase config values updated in `firebase.config.ts`
- [ ] VAPID key added to push service
- [ ] Service worker file created
- [ ] `google-services.json` placed in `android/app/`
- [ ] `GoogleService-Info.plist` placed in `ios/App/App/`
- [ ] APNs certificate uploaded to Firebase
- [ ] iOS push capabilities enabled in Xcode
- [ ] CocoaPods installed for iOS
- [ ] App builds successfully for all target platforms
- [ ] Device token appears in console logs
- [ ] Test notifications are received

This setup guide provides everything needed to get push notifications working across all three platforms!