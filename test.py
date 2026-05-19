from fastapi.testclient import TestClient
from app.main import app # Kendi FastAPI uygulamanı içe aktarıyorsun

# Test istemcisini oluşturuyoruz
client = TestClient(app)

def test_saglik_kontrolu():
    # API'ye sanal bir GET isteği atıyoruz
    response = client.get("/University_system/v1/departments/")
    
    # Sonuçları doğruluyoruz (Assertion)
    assert response.status_code == 200
    assert response.json() == {"durum": "sistem ayakta"}