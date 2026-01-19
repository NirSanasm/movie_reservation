from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import ScreeningAdd, ScreeningResponse
from app.database.database import get_db
from sqlalchemy.orm import Session
from app.core.security import get_current_user, get_current_admin_user
from app.models.user import User, Movie, Screening
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