import asyncio
import httpx
import time
from collections import Counter
from datetime import datetime, timezone

from app.database.database import SessionLocal
from app.models.user import Screening, Reservation

NUM_USERS = 50
URL = "http://localhost:8000/api/v1/reservation/"


def get_test_target():
    """Find a valid upcoming screening and an available seat to test."""
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        screening = db.query(Screening).filter(Screening.show_datetime > now).first()
        if not screening:
            raise RuntimeError("No upcoming screenings found in database.")

        # Find existing active reservations for this screening
        reserved_seats = {
            r.seat_number
            for r in db.query(Reservation.seat_number).filter(
                Reservation.screening_id == screening.id,
                Reservation.status == "active"
            ).all()
        }

        # Pick an unreserved seat
        target_seat = None
        for row in ["A", "B", "C", "D", "E"]:
            for num in range(1, 11):
                seat = f"{row}{num}"
                if seat not in reserved_seats:
                    target_seat = seat
                    break
            if target_seat:
                break

        if not target_seat:
            raise RuntimeError(f"All seats booked for screening {screening.id}")

        return screening.id, target_seat
    finally:
        db.close()


async def attempt_booking(client: httpx.AsyncClient, user_id: int, screening_id: int, seat_number: str):
    payload = {
        "screening_id": screening_id,
        "seat_number": seat_number,
        "payment": {
            "card_number": "4111111111111111",
            "cvv": "123",
            "expiry_month": 12,
            "expiry_year": 2027,
        },
    }
    try:
        resp = await client.post(URL, json=payload)
        return {
            "user_id": user_id,
            "status": resp.status_code,
            "body": resp.text,
            "error": None
        }
    except Exception as e:
        return {
            "user_id": user_id,
            "status": None,
            "body": None,
            "error": f"{type(e).__name__}: {e}"
        }


async def main():
    screening_id, seat_number = get_test_target()
    print(f"==================================================")
    print(f"DOUBLE BOOKING CONCURRENCY TEST")
    print(f"Target Screening ID: {screening_id}")
    print(f"Target Seat Number : {seat_number}")
    print(f"Concurrent Users   : {NUM_USERS}")
    print(f"Endpoint           : {URL}")
    print(f"==================================================\n")

    start_time = time.time()
    limits = httpx.Limits(max_connections=100, max_keepalive_connections=50)
    async with httpx.AsyncClient(timeout=30.0, limits=limits) as client:
        tasks = [
            attempt_booking(client, user_id, screening_id, seat_number)
            for user_id in range(NUM_USERS)
        ]
        results = await asyncio.gather(*tasks)

    duration = time.time() - start_time
    status_counts = Counter(r["status"] for r in results)

    print(f"\n--- Results Summary ({duration:.2f}s) ---")
    for status_code, count in sorted(status_counts.items(), key=lambda x: str(x[0])):
        label = {
            201: "201 CREATED (Success)",
            409: "409 CONFLICT (Seat already booked)",
            500: "500 SERVER ERROR (Unhandled crash)",
        }.get(status_code, f"{status_code}")
        print(f"  [{label}]: {count}")

    # Check for client exceptions
    exceptions = [r for r in results if r["error"] is not None]
    if exceptions:
        print(f"  [Client Exceptions]: {len(exceptions)}")
        for exc in exceptions[:3]:
            print(f"    - User {exc['user_id']}: {exc['error']}")

    # Direct database verification
    db = SessionLocal()
    try:
        db_bookings = db.query(Reservation).filter(
            Reservation.screening_id == screening_id,
            Reservation.seat_number == seat_number,
            Reservation.status == "active"
        ).all()
        print(f"\n--- Database Integrity Verification ---")
        print(f"  Active bookings in DB for {seat_number}: {len(db_bookings)}")
        if len(db_bookings) == 1:
            print(f"  >>> SUCCESS: Exactly ONE booking exists. NO DOUBLE BOOKING! <<<")
        elif len(db_bookings) == 0:
            print(f"  >>> WARNING: No booking succeeded. Check server logs. <<<")
        else:
            print(f"  >>> FAILED: DOUBLE BOOKING OCCURRED! Found {len(db_bookings)} reservations! <<<")
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())