#!/usr/bin/env node

/**
 * Push Notification Testing Script
 *
 * This script helps test push notification functionality after setup.
 * Run with: node test-push-notifications.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔔 Push Notification Setup Validator\n');

// Check if required files exist
const requiredFiles = [
  'src/services/push-notification.service.ts',
  'src/environments/firebase.config.ts',
  'public/firebase-messaging-sw.js',
  'android/app/src/main/AndroidManifest.xml',
  'android/app/build.gradle'
];

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Check Firebase configuration
console.log('\n🔥 Checking Firebase configuration...');
try {
  const firebaseConfig = fs.readFileSync('src/environments/firebase.config.ts', 'utf8');

  if (firebaseConfig.includes('YOUR_API_KEY')) {
    console.log('❌ Firebase config contains placeholder values');
  } else {
    console.log('✅ Firebase config appears to be configured');
  }
} catch (error) {
  console.log('❌ Could not read Firebase config');
}

// Check service worker
console.log('\n🌐 Checking service worker...');
try {
  const serviceWorker = fs.readFileSync('public/firebase-messaging-sw.js', 'utf8');

  if (serviceWorker.includes('your-api-key-here')) {
    console.log('❌ Service worker contains placeholder Firebase config');
  } else {
    console.log('✅ Service worker appears to be configured');
  }
} catch (error) {
  console.log('❌ Could not read service worker');
}

// Check Android configuration
console.log('\n🤖 Checking Android configuration...');
if (fs.existsSync('android/app/google-services.json')) {
  console.log('✅ google-services.json exists');
} else {
  console.log('❌ google-services.json missing - Android push will not work');
}

// Check iOS configuration
console.log('\n🍎 Checking iOS configuration...');
if (fs.existsSync('ios/App/App/GoogleService-Info.plist')) {
  console.log('✅ GoogleService-Info.plist exists');
} else {
  console.log('❌ GoogleService-Info.plist missing - iOS push will not work');
}

// Check VAPID key configuration
console.log('\n🔑 Checking VAPID key configuration...');
try {
  const pushService = fs.readFileSync('src/services/push-notification.service.ts', 'utf8');

  if (pushService.includes('YOUR_WEB_PUSH_CERTIFICATE_KEY')) {
    console.log('❌ VAPID key not configured - Web push will not work');
  } else {
    console.log('✅ VAPID key appears to be configured');
  }
} catch (error) {
  console.log('❌ Could not read push notification service');
}

console.log('\n📋 Next Steps:');
console.log('1. Set up Firebase project at https://console.firebase.google.com/');
console.log('2. Get Firebase configuration values');
console.log('3. Download google-services.json for Android');
console.log('4. Download GoogleService-Info.plist for iOS');
console.log('5. Get VAPID key for web push notifications');
console.log('6. Test on real devices (not simulators for push)');
console.log('\n📖 For detailed setup instructions, see: PUSH_NOTIFICATION_SETUP_GUIDE.md');

// Test build
console.log('\n🏗️  Testing build...');
const { exec } = require('child_process');

exec('ng build --configuration=development', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Build failed:', error.message);
  } else {
    console.log('✅ Build successful');
  }

  console.log('\n🎯 Setup validation complete!');
});