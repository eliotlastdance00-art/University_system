import client from './client';

export const getDepartmentsPaginated = (lastId = 0, limit = 10) => 
  client.get('/departments/next', { params: { last_id: lastId, limit } });

export const getDepartmentById = (id) => client.get(`/departments/${id}`);
export const createDepartment = (data) => client.post('/departments/', data);
export const updateDepartment = (id, data) => client.put(`/departments/${id}`, data);
export const deleteDepartment = (id) => client.delete(`/departments/${id}`);

export const getDepartmentPrograms = (id) => client.get(`/departments/${id}/programs`);
export const getDepartmentTeachers = (id) => client.get(`/departments/${id}/teachers`);
export const getDepartmentStudents = (id) => client.get(`/departments/${id}/students`);
