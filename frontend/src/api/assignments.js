import client from './client';

export const getAssignments = () => client.get('/assignments');
export const getAssignmentById = (id) => client.get(`/assignments/${id}`);
export const createAssignment = (data) => client.post('/assignments', data);
export const updateAssignment = (id, data) => client.put(`/assignments/${id}`, data);
export const deleteAssignment = (id) => client.delete(`/assignments/${id}`);

export const getAssignmentsBySemester = (semester) => client.get(`/assignments/semester/${semester}`);
export const getAssignmentsByGroup = (sectionId) => client.get(`/assignments/group/${sectionId}`);

// Teacher specific
export const getMyAssignments = () => client.get('/assignments/my');
export const getMyAssignmentsBySemester = (semester) => client.get(`/assignments/my/semester/${semester}`);
export const getMySchedule = () => client.get('/assignments/my/schedule');
