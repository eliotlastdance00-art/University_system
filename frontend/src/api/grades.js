import client from './client';

// ─── Grades CRUD ───────────────────────────────────────────

export const createGrade  = (data)       => client.post('/grades/', data);
export const getGrade     = (gradeId)    => client.get(`/grades/${gradeId}`);
export const updateGrade  = (gradeId, data) => client.put(`/grades/${gradeId}`, data);
export const deleteGrade  = (gradeId)    => client.delete(`/grades/${gradeId}`);

// ─── Student Grades ────────────────────────────────────────

export const getGradesForStudent = (studentId) => client.get(`/grades/student/${studentId}`);