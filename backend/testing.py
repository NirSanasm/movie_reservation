import asyncio
import httpx

NUM_USERS = 200
URL = "http://localhost:8000/api/v1/reservation/"


async def attempt_booking(client, user_id):
    try:
        resp = await client.post(
            URL,
            json={
                "screening_id": 34,
                "seat_number": "A4",
                "payment": {
                    "card_number": "4111111111111111",
                    "cvv": "123",
                    "expiry_month": 12,
                    "expiry_year": 2027,
                },
            },
        )

        print(
            f"user={user_id} "
            f"status={resp.status_code} "
            f"content_type={resp.headers.get('content-type')} "
            f"body={resp.text}"
        )

    except Exception as e:
        print(
            f"user={user_id} "
            f"exception_type={type(e).__name__} "
            f"exception={repr(e)}"
        )


async def main():
    async with httpx.AsyncClient(
        timeout=30,
        follow_redirects=True,
    ) as client:

        tasks = [
            attempt_booking(client, user_id)
            for user_id in range(NUM_USERS)
        ]

        await asyncio.gather(*tasks)


if __name__ == "__main__":
    asyncio.run(main())