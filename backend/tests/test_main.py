from fastapi.testclient import TestClient
from ..main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/docs")
    assert response.status_code == 200

def test_create_user():
    # This might fail if user already exists, so we use a random email
    import random
    email = f"test{random.randint(1, 10000)}@example.com"
    response = client.post(
        "/users/",
        json={"email": email, "password": "password", "full_name": "Test User"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert "id" in data

def test_login():
    # Create user first
    import random
    email = f"login{random.randint(1, 10000)}@example.com"
    client.post(
        "/users/",
        json={"email": email, "password": "password", "full_name": "Login User"},
    )
    
    response = client.post(
        "/token",
        data={"username": email, "password": "password"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
