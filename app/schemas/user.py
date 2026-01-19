from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema."""
    
    email: EmailStr
    role: str = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserCreate(UserBase):
    """User creation schema."""
    
    password: str


class UserResponse(UserBase):
    """User response schema."""
    
    id: int
    

    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """User update schema."""
    
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None


class MoviesAdd(BaseModel):
    """Movies add schema."""
    
    title: str
    description: str
    poster_url: str
    genre: str 
   

class MoviesResponse(MoviesAdd):
    """Movies response schema."""
    
    id: int
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


from decimal import Decimal


class ScreeningAdd(BaseModel):
    """Screening add schema."""
    
    movie_id: int
    show_datetime: datetime
    total_seats: int = 100
    price: Decimal = Decimal("10.00")


class ScreeningResponse(ScreeningAdd):
    """Screening response schema."""
    
    id: int
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Payment Schemas (Fake Payment Simulation)
class PaymentRequest(BaseModel):
    """Fake payment request schema."""
    
    card_number: str
    expiry_month: int
    expiry_year: int
    cvv: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "card_number": "4111111111111111",
                "expiry_month": 12,
                "expiry_year": 2027,
                "cvv": "123"
            }
        }


class PaymentResponse(BaseModel):
    """Fake payment response schema."""
    
    transaction_id: str
    status: str
    amount: Decimal
    message: str


# Reservation Schemas
class ReservationCreate(BaseModel):
    """Reservation creation schema with payment."""
    
    screening_id: int
    seat_number: str
    payment: PaymentRequest


class ReservationResponse(BaseModel):
    """Reservation response schema."""
    
    id: int
    screening_id: int
    user_id: int
    seat_number: str
    status: str
    created_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    payment_info: Optional[PaymentResponse] = None
    
    class Config:
        from_attributes = True


class ReservationListResponse(BaseModel):
    """Reservation list item response (without payment info)."""
    
    id: int
    screening_id: int
    user_id: int
    seat_number: str
    status: str
    created_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
