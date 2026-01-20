from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import ScreeningAdd, ScreeningResponse, SeatAvailabilityResponse
from app.database.database import get_db
from sqlalchemy.orm import Session
from app.core.security import get_current_user, get_current_admin_user
from app.models.user import User, Movie, Screening, Reservation
from typing import List

router = APIRouter(prefix="/screening", tags=["screening"])


@router.get("/", response_model=List[ScreeningResponse])
async def get_all_screenings(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all screenings.
    Available to all authenticated users.
    """
    screenings = db.query(Screening).offset(skip).limit(limit).all()
    return screenings


@router.get("/{screening_id}", response_model=ScreeningResponse)
async def get_screening_by_id(
    screening_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific screening by ID.
    Available to all authenticated users.
    """
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening not found"
        )
    return screening


def generate_seat_layout(total_seats: int) -> list[str]:
    """
    Generate seat labels for a theater.
    Format: Row letter (A-Z) + Seat number (1-10)
    Example: A1, A2, ..., A10, B1, B2, ...
    """
    seats = []
    seats_per_row = 10
    row_count = (total_seats + seats_per_row - 1) // seats_per_row
    
    for row_idx in range(min(row_count, 26)):  # Max 26 rows (A-Z)
        row_letter = chr(65 + row_idx)  # A=65 in ASCII
        for seat_num in range(1, seats_per_row + 1):
            if len(seats) >= total_seats:
                break
            seats.append(f"{row_letter}{seat_num}")
    
    return seats


@router.get("/{screening_id}/seats", response_model=SeatAvailabilityResponse)
async def get_seat_availability(
    screening_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get seat availability for a specific screening.
    Returns list of available and taken seats.
    """
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening not found"
        )
    
    # Get all active reservations for this screening
    active_reservations = db.query(Reservation).filter(
        Reservation.screening_id == screening_id,
        Reservation.status == "active"
    ).all()
    
    taken_seats = [r.seat_number for r in active_reservations]
    
    # Generate all possible seats based on total_seats
    all_seats = generate_seat_layout(screening.total_seats)
    
    # Calculate available seats
    available_seats = [seat for seat in all_seats if seat not in taken_seats]
    
    return SeatAvailabilityResponse(
        screening_id=screening_id,
        total_seats=screening.total_seats,
        available_count=len(available_seats),
        taken_count=len(taken_seats),
        taken_seats=taken_seats,
        available_seats=available_seats
    )


@router.post("/", response_model=ScreeningResponse, status_code=status.HTTP_201_CREATED)
async def create_screening(
    screening: ScreeningAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Create a new screening.
    Admin only.
    """
    # Verify the movie exists
    movie = db.query(Movie).filter(Movie.id == screening.movie_id).first()
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found"
        )
    
    # Create DB model from schema
    db_screening = Screening(**screening.dict())
    db.add(db_screening)
    db.commit()
    db.refresh(db_screening)
    return db_screening


@router.delete("/{screening_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_screening(
    screening_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Delete a screening.
    Admin only.
    """
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening not found"
        )
    
    db.delete(screening)
    db.commit()
    return None