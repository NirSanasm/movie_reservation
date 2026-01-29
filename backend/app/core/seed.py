"""
Seed data and background tasks for the movie reservation system.
"""
import asyncio
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.user import Movie, Screening

logger = logging.getLogger(__name__)

# Dummy movie posters from picsum.photos (free placeholder images)
DUMMY_MOVIES = [
    {
        "title": "The Dark Knight Returns",
        "description": "A gripping action thriller about a hero's return to save the city from chaos.",
        "poster_url": "https://picsum.photos/seed/movie1/400/600",
        "genre": "Action"
    },
    {
        "title": "Love in Paris",
        "description": "A romantic tale of two strangers who meet under the Eiffel Tower.",
        "poster_url": "https://picsum.photos/seed/movie2/400/600",
        "genre": "Romance"
    },
    {
        "title": "Galaxy Warriors",
        "description": "An epic space adventure across the universe to save humanity.",
        "poster_url": "https://picsum.photos/seed/movie3/400/600",
        "genre": "Sci-Fi"
    },
    {
        "title": "The Haunted Manor",
        "description": "A chilling horror story set in an ancient mansion with dark secrets.",
        "poster_url": "https://picsum.photos/seed/movie4/400/600",
        "genre": "Horror"
    },
    {
        "title": "Comedy Night Live",
        "description": "A hilarious ensemble comedy that will keep you laughing.",
        "poster_url": "https://picsum.photos/seed/movie5/400/600",
        "genre": "Comedy"
    },
]


def seed_movies(db: Session) -> list[Movie]:
    """Seed the database with dummy movies if none exist."""
    existing_movies = db.query(Movie).count()
    if existing_movies > 0:
        logger.info(f"Movies already exist ({existing_movies}), skipping seed")
        return db.query(Movie).all()
    
    movies = []
    for movie_data in DUMMY_MOVIES:
        movie = Movie(**movie_data)
        db.add(movie)
        movies.append(movie)
    
    db.commit()
    for movie in movies:
        db.refresh(movie)
    
    logger.info(f"Seeded {len(movies)} dummy movies")
    return movies


def create_weekly_screenings(db: Session) -> list[Screening]:
    """Create screenings for the next 7 days if none exist for upcoming dates."""
    now = datetime.utcnow()
    
    # Check if there are any future screenings
    future_screenings = db.query(Screening).filter(
        Screening.show_datetime > now
    ).count()
    
    if future_screenings >= 5:
        logger.info(f"Already have {future_screenings} future screenings, skipping creation")
        return []
    
    # Get all movies
    movies = db.query(Movie).all()
    if not movies:
        logger.warning("No movies found, cannot create screenings")
        return []
    
    screenings = []
    showtimes = ["10:00", "14:00", "18:00", "21:00"]
    prices = [Decimal("10.00"), Decimal("12.50"), Decimal("15.00"), Decimal("12.50")]
    
    # Create screenings for the next 7 days
    for day_offset in range(1, 8):
        date = now + timedelta(days=day_offset)
        
        for i, movie in enumerate(movies):
            # Each movie gets one showtime per day, rotating through showtimes
            showtime_idx = (day_offset + i) % len(showtimes)
            hour, minute = map(int, showtimes[showtime_idx].split(":"))
            
            show_datetime = date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            # Check if this screening already exists
            existing = db.query(Screening).filter(
                Screening.movie_id == movie.id,
                Screening.show_datetime == show_datetime
            ).first()
            
            if existing:
                continue
            
            screening = Screening(
                movie_id=movie.id,
                show_datetime=show_datetime,
                total_seats=100,
                price=prices[showtime_idx]
            )
            db.add(screening)
            screenings.append(screening)
    
    if screenings:
        db.commit()
        logger.info(f"Created {len(screenings)} new screenings for the week")
    
    return screenings


def seed_initial_data():
    """Seed initial data on application startup."""
    db = SessionLocal()
    try:
        # Seed movies
        movies = seed_movies(db)
        
        # Create weekly screenings
        create_weekly_screenings(db)
        
        logger.info("Initial data seeding complete")
    except Exception as e:
        logger.error(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()


async def weekly_screening_task():
    """Background task that creates new screenings weekly."""
    while True:
        try:
            # Wait 24 hours before checking again
            await asyncio.sleep(24 * 60 * 60)  # 24 hours
            
            db = SessionLocal()
            try:
                create_weekly_screenings(db)
            finally:
                db.close()
                
        except asyncio.CancelledError:
            logger.info("Weekly screening task cancelled")
            break
        except Exception as e:
            logger.error(f"Error in weekly screening task: {e}")
            # Wait a bit before retrying on errors
            await asyncio.sleep(60)
