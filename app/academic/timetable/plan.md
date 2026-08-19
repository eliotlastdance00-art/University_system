# Timetable Domain - Advanced Generation Architecture & Plan

Bu doküman, sistemdeki "Ders Programı (Timetable) Oluşturma" işlevinin gelişmiş bir asenkron arka plan görev mimarisine (Background Task Architecture) geçirilmesi için hazırlanmış bir yol haritasıdır.

## 1. Sistem Mimarisi ve Algoritma Mantığı

*   **Problem:** Ders programı oluşturmak bir CSP (Constraint Satisfaction Problem - Kısıt Sağlama Problemi) olduğu için HTTP istekleri üzerinden senkron olarak (anında) yapılamaz. Bu durum API'nin Timeout'a (zaman aşımı) düşmesine neden olur.
*   **Çözüm:** Asenkron Task Queue (Görev Kuyruğu) mimarisi.
*   **Kullanılacak Teknolojiler:**
    *   **Worker:** Projemiz `aiomysql` ve tamamen async tabanlı olduğu için **ARQ** (Redis tabanlı Python async task queue) veya projenin mevcut durumuna göre **Celery** kullanılacaktır. Hafifliği ve async doğası gereği ARQ birinci tercihtir. (Redis gerektirir).
    *   **Algoritma:** İlk etapta kısıtları (hocanın boş vakti, sınıf çakışmaları vb.) kontrol eden bir Heuristik veya Backtracking (Geri İzleme) algoritması kullanılacaktır.
*   **İş Akışı (Workflow):**
    1. Admin `POST /generate` endpoint'ine istek atarak süreci başlatır.
    2. API, görevi veritabanına `PENDING` statüsünde kaydeder, Redis kuyruğuna işi atar ve kullanıcıya anında bir `task_id` döner.
    3. Arka planda çalışan Worker, bu görevi çeker ve statüsünü `PROCESSING` yapar.
    4. Worker algoritmayı çalıştırarak uygun ders programı kombinasyonlarını hesaplar.
    5. Oluşturulan yeni program asıl canlı tabloya **yazılmaz**. Bunun yerine geçici `timetable_drafts` tablosuna kaydedilir.
    6. Görev statüsü `COMPLETED` olarak işaretlenir.
    7. Admin `GET /tasks/{task_id}/draft` ile oluşturulan taslağı inceleyebilir.
    8. Eğer admin sonucu beğenirse `POST /tasks/{task_id}/apply` ucu tetiklenir ve taslak veriler canlı `timetable` tablosuna aktarılarak program yayınlanmış olur.

---

## 2. Veritabanı Şema (Database Schema) Tasarımı

Sistemin düzgün çalışması için iki yeni tabloya/yapıya ihtiyaç vardır:

**Tablo 1: `timetable_generation_tasks`**
*   `id` (PK, Int veya UUID)
*   `status` (ENUM: 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')
*   `parameters` (JSON - örn: hangi bölümler/dönemler için çalıştırıldığı)
*   `error_message` (TEXT, Nullable)
*   `created_by` (FK -> users.id, görevi başlatan admin)
*   `created_at`, `updated_at`, `completed_at` (Tarih ve zaman takibi)

**Tablo 2: `timetable_drafts`**
*   Canlı `timetable` tablosu ile tamamen aynı kolonlara sahip olacaktır.
*   Ek olarak: `task_id` (FK -> `timetable_generation_tasks.id`)
*   *(id, task_id, assignment_id, day, start_time, end_time, created_at)*

---

## 3. Uygulama Planı (Yapılacaklar Listesi)

Aşağıdaki adımlar sırasıyla uygulanacaktır:

### Aşama 1: Veritabanı Altyapısının Kurulması
- [x] `timetable_generation_tasks` tablosunun SQL şemasının oluşturulması/koda eklenmesi.
- [x] `timetable_drafts` tablosunun SQL şemasının oluşturulması/koda eklenmesi.
- [x] İlgili Pydantic şemalarının (`schemas.py`) güncellenmesi ve eklenmesi.
- [x] `repository.py` içerisine Task ve Draft tabloları için CRUD operasyonlarının eklenmesi.

### Aşama 2: Worker (Kuyruk) Altyapısı
- [x] Gerekli paketlerin kurulması (örn. `pip install arq redis`).
- [x] `app/worker.py` dosyasının oluşturulması ve Redis bağlantı ayarlarının yapılması.
- [x] Dummy (Test amaçlı) bir async background task yazılarak worker sisteminin çalıştığının teyit edilmesi.

### Aşama 3: API Endpoint'lerinin Hazırlanması (`router.py` & `service.py`)
- [x] `POST /timetable/tasks/generate` (Görevi oluşturur, kuyruğa atar)
- [x] `GET /timetable/tasks` (Sistemdeki geçmiş tüm oluşturma görevlerini listeler)
- [x] `GET /timetable/tasks/{task_id}` (Belirli bir görevin o anki `status` bilgisini döner)
- [x] `GET /timetable/tasks/{task_id}/draft` (İşlem bitmişse oluşan taslak programı getirir)
- [x] `POST /timetable/tasks/{task_id}/apply` (Taslağı canlı `timetable` tablosuna aktarır)
- [x] `DELETE /timetable/tasks/{task_id}` (İşlemi ve oluşturulan taslağı iptal edip çöpe atar)

### Aşama 4: Timetable Generator Algoritması (Core Logic)
- [ ] `timetable/generator.py` dosyasının oluşturulması.
- [ ] Gerekli verilerin (Hocalar, Dersler, Gruplar/Sectionlar, Aktif Assignments) veritabanından toplu olarak çekilmesi.
- [ ] **Algoritma Kısıtlarının Yazılması:**
  - [ ] *Kısıt 1:* Bir hocaya aynı gün ve saatte birden fazla ders atanamaz.
  - [ ] *Kısıt 2:* Bir öğrenci grubuna (section) aynı saatte birden fazla ders atanamaz.
  - [ ] *Kısıt 3:* Atanan ders saati aralığı belirlenen mesai saatleri içinde olmalıdır.
- [ ] Algoritmanın tüm listeyi başarıyla atadığında statüyü `COMPLETED` yapması ve taslak tabloya kaydetmesi.

### Aşama 5: Test ve Optimizasyon
- [ ] Worker üzerinden algoritmanın tam entegre bir şekilde asenkron çalıştırılması.
- [ ] Çakışma durumlarında veya kısıtların karşılanamadığı durumlarda sistemin nasıl davrandığının (Örn: `FAILED` statüsüne geçme) testi.
- [ ] Canlı verilerle (veya Mock datalarla) uçtan uca senaryo testi.
