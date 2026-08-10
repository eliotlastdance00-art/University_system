import client from './client';

// GET "/" — tüm akademik yıllar
export const getAcademicYears    = ()           => client.get('/academic_years/');

// POST "/" — yeni akademik yıl oluştur
// body: { name: string, start_date: string, end_date: string, is_active?: bool }
export const createAcademicYear  = (data)       => client.post('/academic_years/', data);

// PUT "/{id}" — akademik yılı güncelle
// body: Academic_yearUpdate (kısmi olabilir)
export const updateAcademicYear  = (id, data)   => client.put(`/academic_years/${id}`, data);

// NOT: Backend'de DELETE endpoint'i yok — silme işlemi yapılmıyor
