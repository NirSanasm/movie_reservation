from pydantic import BaseModel, EmailStr
from typing import Optional


class UserBase(BaseModel):
    """Base user schema."""
    
    username: str
    email: EmailStr


class UserCreate(UserBase):
    """User creation schema."""
    
    password: str


class UserResponse(UserBase):
    """User response schema."""
    
    id: int
    
    class Config:
        from_attributes = True
