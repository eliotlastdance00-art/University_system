import client from './client';

// All sections (for dropdowns) - limit=100 to get all
export const getSections = (params = {}) => client.get('/sections/', { params: { limit: 100, ...params } });
export const getSectionById = (id) => client.get(`/sections/${id}`);
export const createSection = (data) => client.post('/sections/', data);
export const updateSection = (id, data) => client.put(`/sections/${id}`, data);
export const deleteSection = (id) => client.delete(`/sections/${id}`);
