def test_list_screenings(client, sample_screening, user_headers):
    response = client.get("/api/v1/screening/", headers=user_headers)

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)

    assert any(
        screening["id"] == sample_screening.id
        for screening in data
    )



def test_get_screening_by_id(client, sample_screening, user_headers):
    response = client.get(
        f"/api/v1/screening/{sample_screening.id}",
        headers=user_headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == sample_screening.id



def test_get_nonexistent_screening(client, user_headers):
    response = client.get(
        "/api/v1/screening/999999999",
        headers=user_headers
    )

    assert response.status_code == 404


def test_get_seat_availability(client, sample_screening, user_headers):
    response = client.get(
        f"/api/v1/screening/{sample_screening.id}/seats",
        headers=user_headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data is not None