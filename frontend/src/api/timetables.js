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


// ─── ADVANCED TIMETABLE GENERATION (TASKS) ──────────────────

export const generateTimetable    = (data)     => client.post('/timetables/tasks/generate', data);
export const getGenerationTasks   = ()         => client.get('/timetables/tasks');
export const getTaskDrafts        = (taskId)   => client.get(`/timetables/tasks/${taskId}/drafts`);
export const applyTaskDrafts      = (taskId)   => client.post(`/timetables/tasks/${taskId}/apply`);
export const deleteGenerationTask = (taskId)   => client.delete(`/timetables/tasks/${taskId}`);


// ─── ROOMS ──────────────────────────────────────────────────

export const getRooms             = (activeOnly = false) => client.get(`/timetables/rooms?active_only=${activeOnly}`);
export const createRoom           = (data)     => client.post('/timetables/rooms', data);
export const getRoomById          = (id)       => client.get(`/timetables/rooms/${id}`);
export const updateRoom           = (id, data) => client.put(`/timetables/rooms/${id}`, data);
export const deleteRoom           = (id)       => client.delete(`/timetables/rooms/${id}`);


// ─── LECTURE GROUPS ─────────────────────────────────────────

export const getLectureGroups     = ()         => client.get('/timetables/lecture-groups');
export const createLectureGroup   = (data)     => client.post('/timetables/lecture-groups', data);
export const deleteLectureGroup   = (id)       => client.delete(`/timetables/lecture-groups/${id}`);


// ─── TEACHER AVAILABILITY ───────────────────────────────────

export const getAvailability      = (userId)   => client.get(`/timetables/availability/${userId}`);
export const setAvailability      = (data)     => client.post('/timetables/availability', data);
export const bulkSetAvailability  = (data)     => client.post('/timetables/availability/bulk', data);
export const deleteAvailability   = (userId, day) => client.delete(`/timetables/availability/${userId}${day ? `?day=${day}` : ''}`);


// ─── TIME SLOTS ─────────────────────────────────────────────

export const getTimeSlots         = ()         => client.get('/timetables/time-slots');
