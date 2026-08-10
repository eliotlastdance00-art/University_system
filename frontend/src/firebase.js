import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

let messaging = null;
// Resolved to true/false after the async check; lets consumers await it.
export let messagingReady = false;

export const initMessaging = async () => {
  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
      messagingReady = true;
      return true;
    }
    console.warn("Firebase Messaging requires HTTPS or localhost — push notifications disabled.");
    return false;
  } catch (err) {
    console.warn("Firebase Messaging initialization error:", err);
    return false;
  }
};

// Fire-and-forget on module load; components should await requestForToken
// which itself guards on messaging being non-null.
const _ready = initMessaging();

export const requestForToken = async () => {
  await _ready; // ensure init finished before checking messaging
  if (!messaging) return null;
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });
    if (currentToken) {
      return currentToken;
    }
    console.log('No registration token available. Request permission to generate one.');
    return null;
  } catch (err) {
    console.log('An error occurred while retrieving token:', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve, reject) => {
    // Reject immediately if messaging is not available so that the
    // while-loop in NotificationHandler can break cleanly instead of
    // hanging forever on an unresolvable promise.
    if (!messaging) {
      reject(new Error("Firebase Messaging not available"));
      return;
    }
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

