from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database.database import Base


from sqlalchemy import ForeignKey, Numeric, CheckConstraint


class User(Base):
    """User model."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default='user')
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("role IN ('user', 'admin')", name="valid_role"),
    )


class Movie(Base):
    """Movie model."""

    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String)
    poster_url = Column(String(500))
    genre = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)







class Screening(Base):
    """Screening model."""

    __tablename__ = "screenings"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False)
    show_datetime = Column(DateTime, nullable=False)
    total_seats = Column(Integer, nullable=False, default=100)
    price = Column(Numeric(10, 2), nullable=False, default=10.00)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("total_seats > 0", name="valid_seats"),
    )


from sqlalchemy import UniqueConstraint


class Reservation(Base):
    """Reservation model."""

    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(Integer, ForeignKey("screenings.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    seat_number = Column(String(10), nullable=False)
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    cancelled_at = Column(DateTime, nullable=True)

    __table_args__ = (
        CheckConstraint("status IN ('active', 'cancelled')", name="valid_status"),
        UniqueConstraint("screening_id", "seat_number", "status", name="unique_active_seat"),
    )


from sqlalchemy import Index

Index("idx_screenings_movie_datetime", Screening.movie_id, Screening.show_datetime)
Index("idx_screenings_datetime", Screening.show_datetime)
Index("idx_reservations_user", Reservation.user_id)
Index("idx_reservations_screening", Reservation.screening_id)
Index("idx_reservations_status", Reservation.screening_id, Reservation.status)
