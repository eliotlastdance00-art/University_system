
# 🎓 Advanced Timetable Generator — İlerleme Raporu

> **Proje:** University System — Ders Programı Oluşturucu  
> **Başlangıç:** 2026-08-19  
> **Son Güncelleme:** 2026-08-19 15:52  
> **Durum:** 🟡 DEVAM EDİYOR

---

## 📋 GENEL BAKIŞ

Mevcut basit Greedy algoritmasını, gerçek üniversite ihtiyaçlarını karşılayan **advanced CSP (Constraint Satisfaction Problem)** tabanlı bir jeneratöre dönüştürüyoruz.

---

## ✅ TAMAMLANAN AŞAMALAR

### Aşama 0: Analiz & Planlama
- [x] Mevcut tüm dosyaların okunması (generator, service, repository, router, schemas, exceptions)
- [x] Veritabanı şemasının (schema.sql) tam incelenmesi
- [x] Workflow MD dosyasının okunması
- [x] Mimari analiz dokümanının (timetable_advanced_architecture.md) okunması
- [x] Eksiklerin tam listesinin çıkarılması

### Aşama 1: Veritabanı Altyapısı (SQL)
- [x] `rooms` tablosu oluşturuldu (kapasite + tip + bina + kat + is_active)
- [x] `time_slots` tablosu oluşturuldu (4 adet 80dk para dilimi)
- [x] `teacher_availabilities` tablosu oluşturuldu (hoca müsaitlik)
- [x] `lecture_groups` + `lecture_group_members` tabloları oluşturuldu (birleşen sınıflar)
- [x] `subjects` tablosuna `weekly_hours` + `required_room_type` kolonları eklendi
- [x] `timetable` ve `timetable_drafts` tablolarına `room_id` FK eklendi
- [x] Örnek derslik verisi (10 oda) eklendi
- [x] SQL migration dosyası: `database/migrations/002_advanced_timetable.sql`

---

## 🔨 ŞU AN YAPILAN AŞAMALAR

### Aşama 2: Advanced Generator Kodlaması
- [x] `generator.py` — Tamamen yeniden yazıldı (Advanced CSP + Backtracking)
- [x] `repository.py` — Yeni tablolar için CRUD eklendi (rooms, time_slots, teacher_avail, lecture_groups)
- [x] `schemas.py` — Yeni Pydantic şemaları eklendi
- [x] `router.py` — Rooms CRUD + Availability endpointleri eklendi
- [x] `service.py` — Yeni iş mantıkları eklendi
- [x] `exceptions.py` — Yeni exception'lar eklendi

### Aşama 3: Rooms Domain
- [x] RoomsRepository (CRUD)
- [x] RoomsService
- [x] Rooms Router (admin endpointleri)
- [x] Rooms Schemas (Create, Update, Response)

---

## ❌ EKSİKLER / YAPILACAKLAR

### Aşama 4: Test & Doğrulama
- [ ] Worker üzerinden tam entegrasyon testi
- [ ] Çakışma senaryoları testi (teacher, section, room)
- [ ] Kapasite yetersizliği testi
- [ ] Lecture group (birleşen sınıf) testi
- [ ] Backtracking performans testi (büyük veri ile)

### Aşama 5: Soft Constraints (Opsiyonel İyileştirmeler)
- [ ] Öğrenci "pencere" (boşluk) minimizasyonu
- [ ] Hocaların ders dağılımı dengesi (günlük max ders)
- [ ] Sabah/öğlen tercihi (preference tablosu)

### Aşama 6: Frontend Entegrasyonu
- [ ] Timetable grid view (haftalık görünüm)
- [ ] Drag & drop manual düzenleme
- [ ] PDF/Excel export

---

## 🏗️ MİMARİ DETAYLAR

### Eski Sistem vs. Yeni Sistem Karşılaştırması

| Özellik | ESKİ | YENİ |
|---------|------|------|
| Algoritma | Greedy (tek geçiş) | CSP + Backtracking |
| Zaman Dilimi | 1 saat (09-16) | 80dk para (4 blok) |
| Odalar | Hardcoded string | DB tablosu (kapasite + tip) |
| Oda Kapasitesi | Kontrol yok | Öğrenci sayısı ≤ Kapasite |
| Oda Tipi | Yok | Normal/Lab/Amfi eşleştirme |
| Haftalık Saat | Her ders 1 slot | weekly_hours (1-4 para) |
| Peş Peşe Ders | Yok | Blok yerleştirme |
| Hoca Müsaitlik | Yok | teacher_availabilities tablosu |
| Birleşen Sınıf | Yok | lecture_groups sistemi |
| Backtracking | Yok | Geri izleme + alternatif arama |
| Sıralama | Sırasız | Zorluk derecesine göre (MRV) |

### Algoritma Akışı (Yeni)

```
1. VERİ YÜKLEME
   ├── Assignments (aktif dönem)
   ├── Rooms (kapasite + tip)
   ├── Time Slots (4 para)
   ├── Teacher Availabilities
   ├── Section Capacities
   └── Lecture Groups

2. ÖN İŞLEME
   ├── Lecture group birleştirme (toplam kapasite hesaplama)
   ├── weekly_hours'a göre slot ihtiyaçları çıkarma
   └── MRV sıralama (en kısıtlı → en az kısıtlı)

3. CSP + BACKTRACKING
   ├── Her ders için uygun (gün, para, oda) üçlüsü ara
   ├── HARD CONSTRAINTS kontrol:
   │   ├── Öğretmen çakışması
   │   ├── Section çakışması  
   │   ├── Oda çakışması
   │   ├── Oda kapasitesi ≥ öğrenci sayısı
   │   ├── Oda tipi == ders gereksinimi
   │   ├── Hoca müsaitliği (availability)
   │   └── Blok ders ardışıklığı
   ├── Başarılı → Ata ve sonraki derse geç
   └── Başarısız → Backtrack (önceki atamayı geri al, alternatif dene)

4. SONUÇ
   ├── Tüm dersler atandı → COMPLETED + drafts tablosuna yaz
   └── Çözüm bulunamadı → FAILED + detaylı hata mesajı
```

---

## 📁 DEĞİŞEN / EKLENEN DOSYALAR

| Dosya | Durum | Açıklama |
|-------|-------|----------|
| `database/migrations/002_advanced_timetable.sql` | ✅ YENİ | rooms, time_slots, teacher_availabilities, lecture_groups tabloları |
| `app/academic/timetable/generator.py` | ✅ YENİDEN YAZILDI | Advanced CSP + Backtracking algoritması |
| `app/academic/timetable/repository.py` | ✅ GÜNCELLENDİ | Rooms, TimeSlots, Availability CRUD eklendi |
| `app/academic/timetable/schemas.py` | ✅ GÜNCELLENDİ | Room, TimeSlot, Availability şemaları eklendi |
| `app/academic/timetable/router.py` | ✅ GÜNCELLENDİ | Room CRUD + Availability endpointleri eklendi |
| `app/academic/timetable/service.py` | ✅ GÜNCELLENDİ | Room service + Advanced generation logic |
| `app/academic/timetable/exceptions.py` | ✅ GÜNCELLENDİ | Yeni exception sınıfları eklendi |

---

## ⚠️ ÖNEMLİ NOTLAR

1. **schema.sql tutarsızlığı:** `timetable` tablosunda kolon `subject_assignment_id` ama kod `assignment_id` kullanıyor. Kodun kullandığı `assignment_id` standardını takip ediyoruz.
2. **room kolonu:** Geriye uyumluluk için eski string `room` kolonu korunuyor, yeni `room_id` FK eklendi. Generator artık `room_id` kullanıyor.
3. **SQL migration:** `002_advanced_timetable.sql` dosyasını veritabanında manuel çalıştırman gerekiyor.
4. **Teacher availabilities boşsa:** Eğer bir hocanın hiç availability kaydı yoksa, hoca TÜM günlerde müsait kabul edilir (backward compat).
