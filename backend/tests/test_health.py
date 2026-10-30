import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from main import app

def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200