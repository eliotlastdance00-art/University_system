import client from './client';

// ─── TEACHER ───────────────────────────────────────────────

export const getLessonStudents = (lessonId)       => client.get(`/attendance/lesson/${lessonId}/students`);
export const bulkCreateAttendance = (lessonId, data) => client.post(`/attendance/lesson/${lessonId}`, data);
export const updateAttendance  = (id, data)        => client.put(`/attendance/${id}`, data);
export const getAttendanceByLesson = (lessonId)    => client.get(`/attendance/lesson/${lessonId}`);
export const getLessonStats    = (lessonId)        => client.get(`/attendance/lesson/${lessonId}/stats`);

// ─── ADMIN ─────────────────────────────────────────────────

export const getAttendanceByStudent = (studentId)  => client.get(`/attendance/student/${studentId}`);
export const getStudentStats   = (studentId)       => client.get(`/attendance/student/${studentId}/stats`);
export const getGroupStats     = (sectionId)       => client.get(`/attendance/group/${sectionId}/stats`);

// ─── STUDENT ────────────────────────────────────────────

// GET "/my/stats" — student kendi attendance statsını JWT token'dan çeker (user.sub kullanılır backend'de)
export const getMyAttendanceStats  = ()            => client.get('/attendance/my/stats');