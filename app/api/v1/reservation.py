from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import (
    ReservationCreate, 
    ReservationResponse, 
    ReservationListResponse,
    PaymentResponse
)
from app.database.database import get_db
from sqlalchemy.orm import Session
from app.core.security import get_current_user
from app.models.user import User, Screening, Reservation
from typing import List
from datetime import datetime
from decimal import Decimal
import uuid
import re

router = APIRouter(prefix="/reservation", tags=["reservation"])


def process_fake_payment(card_number: str, amount: Decimal) -> PaymentResponse:
    """
    Process a fake payment.
    Accepts cards starting with '4' (simulated Visa).
    Returns a fake transaction response.
    """
    # Remove spaces and dashes from card number
    clean_card = re.sub(r'[\s-]', '', card_number)
    
    # Validate card number format (16 digits)
    if not re.match(r'^\d{16}$', clean_card):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid card number format. Must be 16 digits."
        )
    
    # Simulate Visa validation (starts with 4)
    if not clean_card.startswith('4'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment declined. Only Visa cards (starting with 4) are accepted."
        )
    
    # Generate fake transaction
    transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
    
    return PaymentResponse(
        transaction_id=transaction_id,
        status="success",
        amount=amount,
        message="Payment processed successfully (simulated)"
    )


@router.post("/", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    reservation_data: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new reservation with fake payment.
    Requires authentication.
    """
    # Check if screening exists
    screening = db.query(Screening).filter(
        Screening.id == reservation_data.screening_id
    ).first()
    
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening not found"
        )
    
    # Check if screening is in the future
    if screening.show_datetime < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reserve seats for past screenings"
        )
    
    # Check if seat is already reserved
    existing_reservation = db.query(Reservation).filter(
        Reservation.screening_id == reservation_data.screening_id,
        Reservation.seat_number == reservation_data.seat_number,
        Reservation.status == "active"
    ).first()
    
    if existing_reservation:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Seat {reservation_data.seat_number} is already reserved"
        )
    
    # Process fake payment
    payment_response = process_fake_payment(
        reservation_data.payment.card_number,
        screening.price
    )
    
    # Create reservation
    db_reservation = Reservation(
        screening_id=reservation_data.screening_id,
        user_id=current_user.id,
        seat_number=reservation_data.seat_number,
        status="active"
    )
    
    db.add(db_reservation)
    db.commit()
    db.refresh(db_reservation)
    
    # Return response with payment info
    return ReservationResponse(
        id=db_reservation.id,
        screening_id=db_reservation.screening_id,
        user_id=db_reservation.user_id,
        seat_number=db_reservation.seat_number,
        status=db_reservation.status,
        created_at=db_reservation.created_at,
        cancelled_at=db_reservation.cancelled_at,
        payment_info=payment_response
    )


@router.get("/", response_model=List[ReservationListResponse])
async def get_my_reservations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all reservations for the current user.
    """
    reservations = db.query(Reservation).filter(
        Reservation.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return reservations


@router.get("/{reservation_id}", response_model=ReservationListResponse)
async def get_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific reservation by ID.
    Users can only view their own reservations.
    """
    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id,
        Reservation.user_id == current_user.id
    ).first()
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    
    return reservation


@router.post("/{reservation_id}/cancel", response_model=ReservationListResponse)
async def cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancel a reservation.
    Users can only cancel their own reservations.
    """
    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id,
        Reservation.user_id == current_user.id
    ).first()
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    
    if reservation.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservation is already cancelled"
        )
    
    # Update reservation status
    reservation.status = "cancelled"
    reservation.cancelled_at = datetime.utcnow()
    
    db.commit()
    db.refresh(reservation)
    
    return reservation
