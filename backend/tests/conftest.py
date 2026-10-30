# backend/tests/conftest.py
import sys
import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

# Load environment variables from .env
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Set these BEFORE importing the application or its database module.
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

if not TEST_DATABASE_URL:
    raise RuntimeError(
        "Set TEST_DATABASE_URL to a dedicated test database "
        "before running tests."
    )

os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["TESTING"] = "1"


import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone


from app.database.database import Base, engine, get_db
from app.core.security import get_password_hash
from main import app


from app.models.user import User, Movie, Screening


TestSessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    join_transaction_mode="create_savepoint",
)


@pytest.fixture(scope="session", autouse=True)
def create_test_tables():
    """Create the schema once for the test session."""
    Base.metadata.create_all(bind=engine)

    yield

    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def db_session():
    """Give each test a database transaction to roll back."""
    connection = engine.connect()
    transaction = connection.begin()

    session = TestSessionLocal(bind=connection)

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db_session):
    """Provide a FastAPI client using the test database session."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_db, None)



@pytest.fixture
def sample_user(db_session):
    user = User(
        email="testuser@example.com",
        password_hash=get_password_hash("TestPassword123!")
    )

    db_session.add(user)
    db_session.flush()

    return user



@pytest.fixture
def admin_user(db_session):
    user = User(
        email="admin@example.com",
        hashed_password=get_password_hash("AdminPassword123!"),
        is_admin=True,
    )

    db_session.add(user)
    db_session.flush()

    return user

@pytest.fixture
def sample_movie(db_session):
    movie = Movie(
        title="Interstellar",
        genre="Sci-Fi",
        description="A science fiction movie about space and time.",
        poster_url="https://example.com/interstellar.jpg",
    )

    db_session.add(movie)
    db_session.flush()

    return movie

@pytest.fixture
def sample_screening(db_session, sample_movie):
    screening = Screening(
        movie_id=sample_movie.id,
        show_datetime=datetime(
            2027, 1, 15, 18, 30,
            tzinfo=timezone.utc,
        ),
        total_seats=100,
        price=250.0,
    )

    db_session.add(screening)
    db_session.flush()

    return screening

@pytest.fixture
def user_headers(client, sample_user):
    response = client.post(
        "/api/v1/users/token",
        data={
            "username": "testuser@example.com",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    return {
        "Authorization": f"Bearer {token}"
    }


