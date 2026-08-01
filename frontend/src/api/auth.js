import client from './client';

export const login = (email, password) =>
  client.post('/auth/login', { email, password });

export const verifyOtp = (email, otp) =>
  client.post('/auth/verify-otp', { email, otp });

export const refreshToken = (refresh_token) =>
  client.post('/auth/refresh', null, { params: { refresh_token } });

export const logout = (refresh_token) =>
  client.post('/auth/logout', null, { params: { refresh_token } });
