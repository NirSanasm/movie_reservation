
def test_register_user_success(client, db_session):
    payload = {
        "email": "newuser@example.com",
        "password": "StrongPassword123!",
    }

    response = client.post(
        "/api/v1/users/register",
        json=payload,
    )

    # Assuming your registration endpoint returns 201.
    assert response.status_code == 201

    data = response.json()

    assert data["email"] == payload["email"]




def test_register_duplicate_email(client, sample_user):
    payload = {
        "email": "testuser@example.com",
        "password": "AnotherPassword123!",
    }

    response = client.post(
        "/api/v1/users/register",
        json=payload,
    )

    assert response.status_code == 400


def test_register_invalid_email(client):
    response = client.post(
        "/api/v1/users/register",
        json={
            "email": "invalid-email",
            "password": "StrongPassword123!",
        },
    )

    assert response.status_code == 422



