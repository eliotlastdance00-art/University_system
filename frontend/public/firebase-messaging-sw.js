// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the generated config
// Note: You must replace these placeholder values with your actual Firebase config values
// or dynamically load them (since process.env isn't easily available in a service worker without a bundler)
const firebaseConfig = {
  apiKey: "AIzaSyAP0XhYjBhMwNitMcPFX8js8aMsR71YdGQ",
  authDomain: "university-system-8d549.firebaseapp.com",
  projectId: "university-system-8d549",
  storageBucket: "university-system-8d549.firebasestorage.app",
  messagingSenderId: "1065938492216",
  appId: "1:1065938492216:web:3b9e45c6f78119cd6b3fcd",
  
};

firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
