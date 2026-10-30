
def test_double_booking_rejected(
    client,
    user_headers,
    sample_screening,
):
    # Use the same screening and seat for both requests.
    payload = {
        "screening_id": sample_screening.id,
        "seat_number": "A1",
        "payment": {
            "card_number": "4111111111111111",
            "cvv": "123",
            "expiry_month": 12,
            "expiry_year": 2027,
        },
    }

    # First booking: should succeed.
    first_response = client.post(
        "/api/v1/reservation/",
        json=payload,
        headers=user_headers,
    )

    assert first_response.status_code == 201

    # Second booking: same user, same screening, same seat.
    second_response = client.post(
        "/api/v1/reservation/",
        json=payload,
        headers=user_headers,
    )

    assert second_response.status_code == 409
