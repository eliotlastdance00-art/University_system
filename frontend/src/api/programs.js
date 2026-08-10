import client from './client';

// GET "/" — tüm programlar
export const getPrograms        = ()           => client.get('/programs/');

// GET "/{id}" — tek program detayı
export const getProgramById     = (id)         => client.get(`/programs/${id}`);

// POST "/" — yeni program oluştur
// body: ProgramCreate (name, department_id vb.)
export const createProgram      = (data)       => client.post('/programs/', data);

// PUT "/{id}" — programı güncelle
// body: ProgramUpdate
export const updateProgram      = (id, data)   => client.put(`/programs/${id}`, data);

// DELETE "/{id}" — programı sil
export const deleteProgram      = (id)         => client.delete(`/programs/${id}`);

// GET "/{id}/cohorts" — programa ait cohort listesi
export const getProgramCohorts  = (id)         => client.get(`/programs/${id}/cohorts`);
