
import logging
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1 import health, users, screening, reservation
from app.core.seed import seed_initial_data, weekly_screening_task


# -------------------------------------------------
# Logging
# -------------------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# -------------------------------------------------
# Application lifespan
# -------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""

    logger.info(
        f"Starting {settings.APP_NAME} v{settings.APP_VERSION}"
    )

    background_task = None

    if settings.TESTING:
        # Do not seed data or start background jobs during tests.
        logger.info("Testing mode enabled. Skipping startup tasks.")

    else:
        # Production/development startup
        logger.info("Seeding initial movie and screening data...")
        seed_initial_data()

        # Start weekly screening background task
        background_task = asyncio.create_task(
            weekly_screening_task()
        )

        logger.info("Started weekly screening background task")

    try:
        yield

    finally:
        # Application shutdown
        logger.info(f"Shutting down {settings.APP_NAME}")

        if background_task is not None:
            background_task.cancel()

            try:
                await background_task
            except asyncio.CancelledError:
                logger.info("Background task cancelled")


# -------------------------------------------------
# FastAPI application
# -------------------------------------------------

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)


# -------------------------------------------------
# CORS
# -------------------------------------------------

ALLOWED_ORIGINS = [
    "https://movie-reservation-f2pv.vercel.app",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


# -------------------------------------------------
# Routers
# -------------------------------------------------

app.include_router(health.router)
app.include_router(users.router, prefix="/api/v1")
app.include_router(screening.router, prefix="/api/v1")
app.include_router(reservation.router, prefix="/api/v1")


# -------------------------------------------------
# Root endpoint
# -------------------------------------------------

@app.get("/")
async def root():
    return {
        "message": "Welcome to FastAPI",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# -------------------------------------------------
# Run application
# -------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
