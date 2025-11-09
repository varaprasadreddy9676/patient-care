// Firebase Messaging Service Worker
// Import and configure the Firebase SDK
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxqKxTeo0vdwIrNwSBCJbnQBqti27V7Os",
  authDomain: "medics-care.firebaseapp.com",
  projectId: "medics-care",
  storageBucket: "medics-care.firebasestorage.app",
  messagingSenderId: "273126110063",
  appId: "1:273126110063:web:554ee145092fce98deae9a",
  measurementId: "G-Y6CG9ECBVD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Extract notification data
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/icon/favicon.png',
    badge: '/assets/icon/favicon.png',
    tag: payload.data?.type || 'default',
    data: payload.data,
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  // Customize notification based on type
  switch(payload.data?.type) {
    case 'appointment':
      notificationOptions.icon = '/assets/icons/appointment-icon.png';
      notificationOptions.body = payload.notification.body || 'New appointment scheduled';
      break;
    case 'prescription':
      notificationOptions.icon = '/assets/icons/prescription-icon.png';
      notificationOptions.body = payload.notification.body || 'New prescription available';
      break;
    case 'bill':
      notificationOptions.icon = '/assets/icons/bill-icon.png';
      notificationOptions.body = payload.notification.body || 'New bill generated';
      break;
    case 'visit':
      notificationOptions.icon = '/assets/icons/visit-icon.png';
      notificationOptions.body = payload.notification.body || 'New visit record added';
      break;
  }

  // Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification clicked: ', event);

  event.notification.close();

  // Handle different notification actions
  if (event.action === 'dismiss') {
    return;
  }

  // Get notification data
  const notificationData = event.notification.data || {};

  // Construct URL based on notification type
  let url = '/home'; // default URL

  switch(notificationData.type) {
    case 'appointment':
      if (notificationData.appointmentId) {
        url = `/appointment-details/${notificationData.appointmentId}`;
      } else {
        url = '/appointments';
      }
      break;
    case 'prescription':
      if (notificationData.prescriptionId) {
        url = `/prescription`;
      } else {
        url = '/prescriptions';
      }
      break;
    case 'bill':
      if (notificationData.billId) {
        url = `/bill-details/${notificationData.billId}`;
      } else {
        url = '/bills';
      }
      break;
    case 'visit':
      if (notificationData.visitId) {
        url = `/visit-details/${notificationData.visitId}`;
      } else {
        url = '/visits';
      }
      break;
    default:
      url = '/home';
  }

  // Open the URL in the client
  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true})
      .then(function(clientList) {
        // If a client is already open, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('localhost') || client.url.includes('medicscare')) {
            client.focus();
            client.postMessage({
              type: 'NAVIGATION',
              url: url,
              data: notificationData
            });
            return client.navigate(url);
          }
        }
        // If no client is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[firebase-messaging-sw.js] Push subscription changed: ', event);

  // You might want to handle this event to update the backend
  // with the new subscription details
});

// Handle install event
self.addEventListener('install', function(event) {
  console.log('[firebase-messaging-sw.js] Service worker installing...');
  self.skipWaiting();
});

// Handle activate event
self.addEventListener('activate', function(event) {
  console.log('[firebase-messaging-sw.js] Service worker activating...');
  event.waitUntil(self.clients.claim());
});

console.log('[firebase-messaging-sw.js] Firebase Messaging service worker loaded');