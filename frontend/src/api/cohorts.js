import client from './client';

// GET "" — tüm cohort'lar
export const getCohorts         = ()           => client.get('/cohorts');

// GET "/{id}" — tek cohort detayı
export const getCohortById      = (id)         => client.get(`/cohorts/${id}`);

// POST "" — yeni cohort oluştur
// body: ChCreate (name, program_id, academic_year_id vb.)
export const createCohort       = (data)       => client.post('/cohorts', data);

// PUT "/{id}" — cohort'u güncelle
// body: ChUpdate
export const updateCohort       = (id, data)   => client.put(`/cohorts/${id}`, data);

// DELETE "/{id}" — cohort'u sil
export const deleteCohort       = (id)         => client.delete(`/cohorts/${id}`);

// GET "/{id}/sections" — cohort'a ait section listesi
export const getCohortSections  = (id)         => client.get(`/cohorts/${id}/sections`);
