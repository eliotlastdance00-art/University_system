import client from './client';

// ─── Profile ───────────────────────────────────────────────

export const getMyProfile     = ()       => client.get('/profile/me');
export const updateMyProfile  = (data)   => client.put('/profile/me', data);
export const updateMyPassword = (newPassword) =>
    client.put('/profile/me/password', { new_password: newPassword });