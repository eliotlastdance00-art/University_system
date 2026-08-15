import React, { useEffect, useRef } from 'react';
import { requestForToken, onMessageListener, messagingReady, initMessaging } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { registerDeviceToken } from '../api/notifications';

const NotificationHandler = () => {
  const { user } = useAuth();
  const listenerActive = useRef(false);

  // ─── FCM Token kaydet (login sonrası) ───────────────────────
  useEffect(() => {
    if (!user) return;

    const registerToken = async () => {
      // Wait for the async isSupported() check to finish first.
      // If messaging is not available (HTTP / non-localhost) skip silently.
      await initMessaging();
      if (!messagingReady) return;

      const token = await requestForToken();
      if (token) {
        try {
          await registerDeviceToken({ token, device_type: 'web' });
          console.log('FCM token backend-e ugradyldy.');
        } catch (err) {
          console.error('FCM token ugradylmady:', err);
        }
      }
    };

    registerToken();
  }, [user?.id]); // user.id üýtgände täzeden register et

  // ─── Foreground habarlaşma diňleýji (infinite loop) ─────────
  useEffect(() => {
    if (listenerActive.current) return;
    listenerActive.current = true;

    const listenLoop = async () => {
      // Wait for the async isSupported() check; bail if not available.
      await initMessaging();
      if (!messagingReady) {
        listenerActive.current = false;
        return;
      }

      while (listenerActive.current) {
        try {
          const payload = await onMessageListener();
          const title = payload?.notification?.title || 'Täze habar';
          const body = payload?.notification?.body || '';

          // Browser Notification API arkaly görkez
          if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/vite.svg' });
          } else {
            console.log(`Bildiriş: [${title}] ${body}`);
          }
        } catch (err) {
          // onMessageListener rejects when messaging is unavailable — stop the loop.
          console.warn('Foreground listener stopped:', err.message);
          break;
        }
      }
    };

    listenLoop();

    return () => {
      listenerActive.current = false;
    };
  }, []);

  return null;
};

export default NotificationHandler;
