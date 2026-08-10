import client from './client';

// ─── ADMIN: CRUD ────────────────────────────────────────────

// POST "" — body: { section_id, subject_id, teacher_id, day, start_time, end_time, room }
export const createTimetable      = (data)     => client.post('/timetables', data);

// GET "" — tüm timetable'lar (admin only)
export const getAllTimetables      = ()         => client.get('/timetables');

// PUT "/{id}" — body: TimetableUpdate (kısmi güncelleme)
export const updateTimetable      = (id, data) => client.put(`/timetables/${id}`, data);

// DELETE "/{id}"
export const deleteTimetable      = (id)       => client.delete(`/timetables/${id}`);

// ─── STUDENT: Group timetable ───────────────────────────────

// GET "/group/{section_id}" — section'ın haftalık programı
export const getGroupTimetable    = (sectionId)       => client.get(`/timetables/group/${sectionId}`);

// GET "/group/{section_id}/day/{day}" — section'ın tek gün programı
// day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"
export const getGroupDayTimetable = (sectionId, day)  => client.get(`/timetables/group/${sectionId}/day/${day}`);

// ─── TEACHER: My timetable ──────────────────────────────────

// GET "/teacher/my" — token'daki öğretmenin haftalık programı
export const getMyTimetable       = ()         => client.get('/timetables/teacher/my');

// GET "/teacher/my/day/{day}" — token'daki öğretmenin tek gün programı
export const getMyDayTimetable    = (day)      => client.get(`/timetables/teacher/my/day/${day}`);
