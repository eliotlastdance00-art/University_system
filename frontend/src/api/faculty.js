import client from './client';

export const getFaculties = () => client.get('/faculties/');
export const getFacultyById = (id) => client.get(`/faculties/${id}`);
export const createFaculty = (data) => client.post('/faculties/', data);
export const updateFaculty = (id, data) => client.put(`/faculties/${id}`, data);
export const deleteFaculty = (id) => client.delete(`/faculties/${id}`);
export const getFacultyDepartments = (id) => client.get(`/faculties/${id}/departments`);
