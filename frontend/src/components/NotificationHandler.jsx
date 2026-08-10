import React, { useEffect, useRef } from 'react';
import { requestForToken, onMessageListener } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { registerDeviceToken } from '../api/notifications';

const NotificationHandler = () => {
  const { user } = useAuth();
  const listenerActive = useRef(false);

  // ─── FCM Token kaydet (login sonrası) ───────────────────────
  useEffect(() => {
    if (!user) return;

    const registerToken = async () => {
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
          console.error('Foreground listener ýalňyşlyk:', err);
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
