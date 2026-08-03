import client from './client';

// ─── ADMIN ─────────────────────────────────────────────────

export const getAllLessons      = ()              => client.get('/lessons/');
export const getLessonsByDate   = (date)           => client.get(`/lessons/date/${date}`);
export const getLessonsByTimetable = (timetableId) => client.get(`/lessons/timetable/${timetableId}`);

// ─── TEACHER ───────────────────────────────────────────────

export const startLesson   = (timetableId)   => client.post(`/lessons/${timetableId}/start`);
export const cancelLesson  = (id, data)      => client.put(`/lessons/${id}/cancel`, data);
export const getMyLessonHistory = ()         => client.get('/lessons/my/history');
export const getMyLessonStats   = ()         => client.get('/lessons/my/stats');