import client from './client';

// All subjects (for dropdowns)
export const getSubjects = () => client.get('/subjects/');
export const getSubjectById = (id) => client.get(`/subjects/${id}`);
export const createSubject = (data) => client.post('/subjects/', data);
export const updateSubject = (id, data) => client.put(`/subjects/${id}`, data);
export const deleteSubject = (id) => client.delete(`/subjects/${id}`);
