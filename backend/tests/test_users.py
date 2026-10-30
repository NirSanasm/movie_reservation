
def test_login_success(client, db_session, sample_user):
    payload = {
        "username": "testuser@example.com",  
        "password": "TestPassword123!"      
    }

    response = client.post(
        "/api/v1/users/token",
        data=payload,
    )

    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert data["token_type"].lower() == "bearer"


def test_login_wrong_password(client, sample_user):
    response = client.post(
        "/api/v1/users/token",
        data={
            "username": "testuser@example.com",
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401


def test_get_current_user_without_token(client):
    response = client.get("/api/v1/users/me")

    assert response.status_code == 401


def test_get_current_user_with_token(client, user_headers):
    response = client.get(
        "/api/v1/users/me",
        headers=user_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["email"] == "testuser@example.com"
