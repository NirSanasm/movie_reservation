
def test_screening_returns_movie_information(
    client,
    sample_screening,
    user_headers,
):
    response = client.get(
        f"/api/v1/screening/{sample_screening.id}",
        headers=user_headers
    )

    assert response.status_code == 200

    data = response.json()

    # Adjust "movie" to match your response schema.
    assert data["movie"]["title"] == "Interstellar"
    assert data["movie"]["genre"] == "Sci-Fi"
