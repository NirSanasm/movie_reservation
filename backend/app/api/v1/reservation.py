from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from app.schemas.user import (
    ReservationCreate, 
    ReservationResponse, 
    ReservationListResponse,
    PaymentResponse
)
from app.database.database import get_db
from sqlalchemy.orm import Session
from app.core.security import get_current_user
from app.models.user import User, Screening, Reservation, Movie
from typing import List
from datetime import datetime
from decimal import Decimal
import uuid
import re
import io
from fpdf import FPDF

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
    
    # Check seat capacity - count active reservations
    active_reservation_count = db.query(Reservation).filter(
        Reservation.screening_id == reservation_data.screening_id,
        Reservation.status == "active"
    ).count()
    
    if active_reservation_count >= screening.total_seats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This screening is fully booked"
        )
    
    # Validate seat number format (e.g., A1, B10, etc.)
    seat_pattern = re.compile(r'^[A-Z]\d{1,2}$')
    if not seat_pattern.match(reservation_data.seat_number.upper()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid seat number format. Use format like A1, B5, C10"
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


def generate_ticket_pdf(reservation, screening, movie, user_email: str) -> bytes:
    """Generate a PDF ticket for a reservation."""
    pdf = FPDF()
    pdf.add_page()
    
    # Header
    pdf.set_font("Helvetica", "B", 24)
    pdf.set_text_color(0, 102, 204)
    pdf.cell(0, 20, "MOVIE TICKET", align="C", ln=True)
    
    # Divider line
    pdf.set_draw_color(0, 102, 204)
    pdf.set_line_width(1)
    pdf.line(20, 35, 190, 35)
    
    pdf.ln(10)
    
    # Ticket details
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 10, f"Movie: {movie.title}", ln=True)
    
    pdf.set_font("Helvetica", "", 12)
    pdf.cell(0, 8, f"Genre: {movie.genre}", ln=True)
    
    pdf.ln(5)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Screening Details:", ln=True)
    
    pdf.set_font("Helvetica", "", 12)
    show_date = screening.show_datetime.strftime("%B %d, %Y")
    show_time = screening.show_datetime.strftime("%I:%M %p")
    pdf.cell(0, 8, f"Date: {show_date}", ln=True)
    pdf.cell(0, 8, f"Time: {show_time}", ln=True)
    
    pdf.ln(5)
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(0, 128, 0)
    pdf.cell(0, 10, f"SEAT: {reservation.seat_number}", ln=True)
    
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "", 12)
    pdf.cell(0, 8, f"Price: ${screening.price}", ln=True)
    
    pdf.ln(10)
    
    # Booking details box
    pdf.set_fill_color(240, 240, 240)
    pdf.rect(20, pdf.get_y(), 170, 35, "F")
    
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_xy(25, pdf.get_y() + 5)
    pdf.cell(0, 6, "BOOKING INFORMATION", ln=True)
    
    pdf.set_font("Helvetica", "", 10)
    pdf.set_x(25)
    pdf.cell(0, 6, f"Booking ID: RES-{reservation.id:06d}", ln=True)
    pdf.set_x(25)
    pdf.cell(0, 6, f"Email: {user_email}", ln=True)
    pdf.set_x(25)
    booked_date = reservation.created_at.strftime("%Y-%m-%d %H:%M") if reservation.created_at else "N/A"
    pdf.cell(0, 6, f"Booked on: {booked_date}", ln=True)
    
    pdf.ln(20)
    
    # Footer
    pdf.set_font("Helvetica", "I", 10)
    pdf.set_text_color(128, 128, 128)
    pdf.cell(0, 6, "Please present this ticket at the entrance.", align="C", ln=True)
    pdf.cell(0, 6, "Thank you for choosing our cinema!", align="C", ln=True)
    
    # For fpdf 1.7.x: output(dest='S') returns a string, encode to bytes
    pdf_string = pdf.output(dest='S')
    return pdf_string.encode('latin-1')


@router.get("/{reservation_id}/ticket")
async def download_ticket(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download a PDF ticket for a reservation.
    Users can only download tickets for their own active reservations.
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
            detail="Cannot download ticket for cancelled reservation"
        )
    
    # Get screening and movie details
    screening = db.query(Screening).filter(
        Screening.id == reservation.screening_id
    ).first()
    
    movie = db.query(Movie).filter(
        Movie.id == screening.movie_id
    ).first()
    
    # Generate PDF
    pdf_bytes = generate_ticket_pdf(reservation, screening, movie, current_user.email)
    
    # Return PDF as downloadable file
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=ticket_RES-{reservation.id:06d}.pdf"
        }
    )
