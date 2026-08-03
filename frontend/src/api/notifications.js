import client from './client';

// ─── Herkes ─────────────────────────────────────────────────

// GET "/" — kendi bildirimlerini getir (token'daki user)
// limit/offset ile sayfalama: ?limit=20&offset=0
export const getMyNotifications    = (limit = 20, offset = 0) =>
  client.get('/notification/', { params: { limit, offset } });

// PATCH "/{notification_id}/read" — bildirimi okundu işaretle
export const markNotificationRead  = (notificationId) =>
  client.patch(`/notification/${notificationId}/read`);

// ─── Admin ──────────────────────────────────────────────────

// POST "/broadcast" — role'e göre toplu bildirim gönder
// body: { title: string, body: string, target_role: string }
// sender_id backend'de JWT'den alınıyor, body'e yazma
export const broadcastNotification = (data) =>
  client.post('/notification/broadcast', data);

// ─── Device token (PWA / mobil push) ───────────────────────

// POST "/register-token" — push notification token kaydet
// body: { token: string, device_type: "web" | "android" | "ios" }
export const registerDeviceToken   = (data) =>
  client.post('/notification/register-token', data);
