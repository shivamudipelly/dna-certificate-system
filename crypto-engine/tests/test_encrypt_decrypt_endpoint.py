from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.services.crypto_orchestrator import crypto_orchestrator

client = TestClient(app)

class TestEndpointWorkflows:
    def setup_method(self):
        self.headers = {"x-api-key": settings.ENGINE_API_KEY}
        self.payload = {
            "name": "Jane Doe",
            "roll": "CS404",
            "degree": "BSc Computer Science",
            "cgpa": 3.99,
            "year": 2026
        }

    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_full_encryption_decryption_workflow(self):
        # 1. Encrypt Data
        response = client.post("/encrypt", json={"data": self.payload}, headers=self.headers)
        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        
        dna_sequence = result["dna_payload"]
        chaotic_seed = result["chaotic_seed"]
        
        assert isinstance(dna_sequence, str)
        assert len(dna_sequence) >= 1000 # Minimum length requirement generated computationally
        assert isinstance(chaotic_seed, str)
        
        # 2. Decrypt Back to Json
        decrypt_res = client.post(
            "/decrypt",
             json={"dna_payload": dna_sequence, "chaotic_seed": chaotic_seed}, 
             headers=self.headers
        )
        assert decrypt_res.status_code == 200
        decrypt_data = decrypt_res.json()
        
        assert decrypt_data["success"] is True
        assert decrypt_data["data"]["name"] == self.payload["name"]
        assert decrypt_data["data"]["roll"] == self.payload["roll"]

    def test_authentication_denied(self):
        # Make request without header
        response = client.post("/encrypt", json={"data": self.payload})
        assert response.status_code == 401

        # Make request with wrong header string
        response = client.post("/encrypt", json={"data": self.payload}, headers={"x-api-key": "fake-key"})
        assert response.status_code == 401

    def test_tamper_detection(self):
        # Corrupt the DNA block to catch explicit 403 blocks mapping
        response = client.post("/decrypt", json={"dna_payload": "AATTCG", "chaotic_seed": "0.5"}, headers=self.headers)
        
        assert response.status_code == 403
        assert response.json()["error"] == "TAMPERED"

    def test_large_payload_rejection(self):
        large_text = "A" * 15000 # > 10kb
        response = client.post("/encrypt", json={"data": {"text": large_text}}, headers=self.headers)
        assert response.status_code == 413
        assert response.json()["error"] == "Request body size exceeds the 10KB limit"
