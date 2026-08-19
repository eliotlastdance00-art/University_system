# Gelişmiş Ders Programı (Timetable) Analizi ve Yeni Mimari

Bu doküman, basit bir "boşluk bul ve yerleştir" mantığından çıkarak, gerçek bir üniversitenin ihtiyaç duyduğu **kompleks ders programı oluşturma** sürecini iki aşamalı olarak analiz etmektedir.

---

## BÖLÜM 1: İlk Analiz (Belirttiğin İhtiyaçlar)

Kaldığımız yerden senin belirttiğin vizyonla sistemi analiz ettiğimizde şu 4 temel zorunluluk ortaya çıkıyor:

### 1. Sabit Zaman Dilimleri (Paralar ve Arakezmeler)
Ders programı jeneratörü zamanı rastgele hesaplayamaz. Zaman blokları (paralar) üniversitenin ziline göre koda sabitlenmelidir (Hardcoded veya Config tablosu).
*   **1 Para = 80 Dakika.**
*   Sabah (İrden) Başlangıç: **09:00**, Bitiş: **14:40**
*   **Slot Matematiği:** 09:00 ile 14:40 arası toplam 340 dakikadır. 4 tane 80 dakikalık "para" (320 dk) ve aralara toplam 20 dakikalık "arakezme" (mola) sığar.
    *   *1. Para:* 09:00 - 10:20 (10 dk mola)
    *   *2. Para:* 10:30 - 11:50 (30 dk mola)
    *   *3. Para:* 12:20 - 13:40 (10 dk mola)
    *   *4. Para:* 14:10 - 15:30 
*   **Algoritma Mantığı:** Algoritma artık saati rastgele 1 saat ileri atarak değil, doğrudan "Para 1, Para 2, Para 3" isimli hazır slotlara yerleştirme yapacak.

### 2. Derslik (Room) Kapasiteleri ve Yönetimi
Derslikler algoritma anında havadan gelemez. Veritabanında bir `rooms` (Derslikler) tablosu olmalıdır.
*   **Parametreler:** `id`, `name` (örn: A-101), `capacity` (örn: 50 kişi).
*   **Algoritma Mantığı:** İlk başta tüm derslikler "BOŞ" olarak hafızaya alınır. Bir derse (assignment) yer aranırken sadece saatin boş olması yetmez; **Öğrenci Sayısı <= Oda Kapasitesi** formülü sağlanmalıdır.

### 3. Birleşen Sınıflar (Lecture ve 4 Section Birleşimi)
Bazı teorik dersler (Lecture) amfilerde işlenir ve 1. Kurstaki (Yıldaki) 4 section tek bir hocadan aynı anda dersi dinler.
*   **Algoritma Mantığı:** Veritabanında atamalar tutulurken, bu 4 section'ın ayrı ayrı atanması hatadır (Hoca aynı anda 4 farklı sınıfta olamaz). Ortak dersler için "Grup Ataması" yapılmalı veya bu 4 assignment tek bir "Lecture ID" altında birleştirilmelidir. Oda seçerken de `Kapasite >= (Sec1 + Sec2 + Sec3 + Sec4)` olmalıdır.

### 4. Üniversite Geneli vs. Kurs (Yıl) Geneli Üretim
Büyük kurslar günde 3-4 para okuyabilirken küçükler 2 para okuyabilir. Üretim fakülte/kurs bazlı yapılabilir ancak **Öğretmenler ve Derslikler tüm üniversitenin ortak malıdır**.
*   **Algoritma Mantığı:** Program sadece 1 kurs için üretilirse, başka bir kursun programı üretilirken ortak öğretmen çakışabilir. Bu yüzden Timetable Generator **tüm üniversiteyi (veya fakülteyi) aynı anda** hesaplamalı, ancak yoğunluğa göre (büyük kurslara öncelik vererek) atama yapmalıdır.

---

## BÖLÜM 2: Yeniden Düşünme (Neler Eksik? Neleri Unuttuk?)

*Dokümanı baştan sona okuyup üniversite dinamiklerini tekrar düşündüğümde, mimaride patlamaya yol açacak şu KÖR NOKTALARI (eksikleri) tespit ettim:*

### Eksik 1: Haftalık Ders Saati (Bir ders sadece 1 Para mıdır?)
Biz şu an algoritmayı "Her ders haftada 1 kez (1 para) okutulur" gibi kurduk. Ancak bir Matematik dersi haftada 2 veya 3 para olabilir! 
*   **Çözüm:** `subjects` tablosunda `weekly_paras` (Haftalık Para Sayısı) diye bir kolon olmalı. Jeneratör bir atamayı (assignment) bitirdiğinde, eğer o ders haftada 3 paraysa, ona haftada 3 farklı slot bulana kadar devam etmeli.

### Eksik 2: Peş Peşe Ders Mantığı (Blok Ders)
Eğer bir ders haftada 2 paraysa, bunlar Pazartesi sabah ve Cuma akşam mı olmalı? Genelde hayır. Üniversitelerde 2 paralık dersler aynı gün peş peşe (Blok) işlenir.
*   **Çözüm:** Algoritmaya "Consecutive" (Peş peşe) zekası eklenmeli. 2 paralık ders yerleştirilirken algoritma `(Pazartesi 1. Para)` ve `(Pazartesi 2. Para)` boş mu diye ikisini tek paket olarak aramalı.

### Eksik 3: Öğretmenlerin Çalışma Günleri (Müsaitlik)
Üniversitede bazı hocalar dışarıdan (part-time) gelir. Sadece Salı ve Çarşamba günleri okulda olabilirler.
*   **Çözüm:** `teacher_availabilities` (Hoca müsaitlik) tablosu kurulmalı. Jeneratör bir hocaya Perşembe günü ders yazmadan önce "Bu hoca Perşembe okulda mı?" diye kontrol etmeli.

### Eksik 4: Derslik Tipleri (Sadece kapasite yetmez)
Bilgisayar Programlama dersi 30 kişidir. B-102 numaralı Tarih sınıfı da 40 kişiliktir (kapasite yetiyor). Ama bilgisayar dersi normal sınıfta yapılamaz!
*   **Çözüm:** Odalara `room_type` (Normal, PC Lab, Fizik Lab, Çizim Atölyesi vb.) eklenmeli. Derslere de `required_room_type` eklenmeli. Jeneratör kapasiteyle birlikte **oda tipini** de eşleştirmeli.

### Eksik 5: Öğrencilerin "Pencere" (Boşluk) Sorunu
Programı tamamen makineye bırakırsak; 1. Kurslara sabah 1. paraya ders koyar, 2. ve 3. parayı boş bırakır, 4. paraya tekrar ders koyar. Öğrenci gün ortasında saatlerce boş bekler.
*   **Çözüm:** Yumuşak kısıtlar (Soft Constraints) eklenmeli. Öğrencinin günlük dersleri "kompakt" (boşluksuz, arka arkaya) olmaya zorlanmalı.

---

## BÖLÜM 3: Yeni Algoritma Mimari Özeti

Eğer bu gerçekçi sisteme geçersek jeneratörümüz (`generator.py`) şu sırayla çalışacak:

1. **Ön Yükleme:** Sadece atamalar değil; `rooms` (Kapasite ve Tip ile), `teacher_availabilities` ve `courses/sections` bellek (RAM) üzerine alınır.
2. **Gruplama (Lectures):** Önce "Ortak" alınacak dersler (Lectures) bulunur. Bu 4 section sanal olarak tek bir dev sınıf (örn: 150 kişi) haline getirilir.
3. **Sıralama (Zorluk Derecesi):** Yerleştirmesi en zor olanlardan başlanır! (Kapasitesi en az olan laboratuvar dersleri ve part-time hocaların dersleri önce yerleştirilir).
4. **Slot Tarama:** 80 dakikalık 4 para dilimi üzerinden arama yapılır. Peş peşe olması gereken dersler (2 para) blok olarak oturtulur.
5. **Kapasite ve Tip Doğrulaması:** Seçilen odanın tipi dersin gereksinimine uyuyor mu? Kapasite öğrenci sayısını (veya birleşen 4 sınıfın toplamını) kaldırıyor mu?
6. **Kayıt:** Tüm kurallar sağlanırsa taslak (Draft) oluşturulur.
