import React, { useEffect, useState } from 'react';
import { requestForToken, onMessageListener } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
// import axios from 'axios'; // Import your API client

const NotificationHandler = () => {
  const [notification, setNotification] = useState({ title: '', body: '' });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      requestForToken().then((token) => {
        if (token) {
          // TODO: Send this token to your backend
          // axios.post('/api/v1/profile/fcm-token', { token });
          console.log("Token generated:", token);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    const listenForMessages = async () => {
      try {
        const payload = await onMessageListener();
        console.log('Foreground notification received:', payload);
        setNotification({
          title: payload.notification.title,
          body: payload.notification.body
        });
        
        // Show an alert or toast here
        alert(`New Notification: ${payload.notification.title} - ${payload.notification.body}`);
      } catch (err) {
        console.log('Failed to listen for messages:', err);
      }
    };

    listenForMessages();
  }, []);

  return null; // This is a background logic component
};

export default NotificationHandler;
