from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


if settings.TESTING:
    if not settings.TEST_DATABASE_URL:
        raise RuntimeError(
            "TEST_DATABASE_URL is required when TESTING is enabled"
        )

    database_url = settings.TEST_DATABASE_URL

else:
    database_url = settings.DATABASE_URL


engine = create_engine(
    database_url,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True
)

Base = declarative_base()


async def get_async_database():
    pass


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
