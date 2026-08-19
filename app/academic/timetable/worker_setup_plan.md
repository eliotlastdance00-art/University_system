# Aşama 2: Worker (Kuyruk) Altyapısı Kurulum Planı

Ders programı (Timetable) oluşturma işlemi ağır bir işlem olduğu için FastAPI'nin HTTP döngüsünü bloklamadan (Timeout'a düşürmeden) arka planda yapılmalıdır. Bunun için **Görev Kuyruğu (Task Queue)** mimarisi kuracağız.

## 1. Neden ARQ ve Redis Kullanıyoruz? (Teknoloji Seçimi)
*   **Redis:** Kuyruktaki görevleri (Task'leri) RAM üzerinde tutan çok hızlı bir bellek içi veri yapısıdır.
*   **ARQ:** Python için Redis tabanlı ve **tamamen `asyncio` destekli** hafif bir worker kütüphanesidir.
*   *Neden Celery değil?* Projemiz halihazırda `aiomysql` ve `FastAPI` (yani tamamen async) kullanıyor. Celery aslen senkron çalışmak üzere tasarlandığı için async fonksiyonları çalıştırmak zordur. `arq` ise doğrudan `async/await` mimarisiyle çalışır, çok daha hafif ve projemizin yapısına %100 uygundur.

## 2. Neler Yapılacak? (Adım Adım)

### Adım 1: Bağımlılıkların (Dependencies) Eklenmesi
*   `requirements.txt` dosyasına `arq` kütüphanesini ekleyeceğiz. (ARQ, Redis bağlantısı için gerekli paketi kendi içinde barındırır).

### Adım 2: Docker Altyapısının Güncellenmesi
Mevcut `docker-compose.yml` dosyanızda sadece MySQL ve FastAPI (app) bulunuyor (muhtemelen). Aşağıdaki eklemeleri yapacağız:
1.  **Redis Servisi:** `redis:alpine` imajını kullanarak bir kuyruk sunucusu ayağa kaldıracağız.
2.  **Worker Servisi:** FastAPI uygulamanızın kodlarını çalıştıracak, ancak HTTP portu dinlemek yerine sadece arkaplanda görev bekleyecek ikinci bir Python (arq) servisi tanımlayacağız.

### Adım 3: `app/worker.py` Dosyasının Oluşturulması
Ana dizinde veya `timetable` altında bir `worker.py` oluşturacağız. Bu dosya ARQ tarafından çalıştırılacak:
*   Başlarken (`startup`) veritabanı bağlantı havuzunu (pool) ve Redis havuzunu oluşturacak.
*   Kapanırken (`shutdown`) bağlantıları temizleyecek.
*   `generate_timetable_task(ctx, task_id, parameters)` adında asıl ağır işi yapacak async fonksiyonu tanımlayacak.

### Adım 4: FastAPI'den Görevin Kuyruğa Atılması (`service.py`)
Admin "Oluştur" butonuna bastığında API şu adımları izleyecek:
1.  Veritabanına `PENDING` durumunda bir task kaydı açacak (`repository.create_task`).
2.  Redis bağlantısını kullanarak: `await redis.enqueue_job("generate_timetable_task", task_id, params)` koduyla işi worker'a fırlatacak.
3.  Kullanıcıya hemen HTTP 200 ile `task_id`'yi dönecek (Bekletmeden!).

---

Bu plan doğrultusunda sırasıyla `requirements.txt`, `docker-compose.yml` ve `app/worker.py` dosyalarında geliştirmeye başlayabiliriz.
