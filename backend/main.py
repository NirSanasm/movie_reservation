import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.database import Base, engine
from app.api.v1 import health, users, screening, reservation
from app.core.seed import seed_initial_data, weekly_screening_task

# Create database tables
Base.metadata.create_all(bind=engine)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Background task reference
background_task = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    global background_task
    
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Seed initial data (movies and screenings)
    seed_initial_data()
    
    # Start background task for weekly screening creation
    background_task = asyncio.create_task(weekly_screening_task())
    logger.info("Started weekly screening background task")
    
    yield
    
    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME}")
    if background_task:
        background_task.cancel()
        try:
            await background_task
        except asyncio.CancelledError:
            pass


# Initialize FastAPI app with lifespan
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://movie-reservation-f2pv.vercel.app",
        "http://localhost:3000",  # Keep for local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(users.router, prefix="/api/v1")
app.include_router(screening.router, prefix="/api/v1")
app.include_router(reservation.router, prefix="/api/v1")

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to FastAPI",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
