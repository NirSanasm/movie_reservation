# FastAPI Backend Boilerplate

A production-ready FastAPI boilerplate with SQLAlchemy ORM, JWT authentication, and modular project structure.

## Features

- ✅ FastAPI with async support
- ✅ SQLAlchemy ORM with PostgreSQL
- ✅ JWT authentication
- ✅ Pydantic schemas for validation
- ✅ CORS middleware
- ✅ Environment configuration
- ✅ Modular project structure
- ✅ Database models and migrations ready
- ✅ Health check endpoint
- ✅ User registration and authentication

## Project Structure

```
fastapi_boilerplate/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── health.py
│   │       └── users.py
│   ├── core/
│   │   ├── config.py         # Settings and configuration
│   │   └── security.py       # JWT and password utilities
│   ├── database/
│   │   └── database.py       # Database session and engine
│   ├── models/
│   │   └── user.py          # SQLAlchemy models
│   └── schemas/
│       └── user.py          # Pydantic schemas
├── main.py                   # Application entry point
├── requirements.txt
├── .env.example
└── README.md
```

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd fastapi_boilerplate
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your settings:

```bash
cp .env.example .env
```

Update `.env` with your database URL and secret key:

```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SECRET_KEY=your-super-secret-key-change-in-production
```

### 3. Database Setup

Create database tables automatically on first run, or run migrations if using Alembic.

### 4. Run the Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload
```

Server will start at `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /health
```

### User Registration
```
POST /api/v1/users/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password"
}
```

### Get Current User
```
GET /api/v1/users/me
Headers: Authorization: Bearer {token}
```

## Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Development

### Adding New Routes

1. Create a new router file in `app/api/v1/`
2. Define your routes using `APIRouter`
3. Include the router in `main.py`:

```python
from app.api.v1 import your_router
app.include_router(your_router.router, prefix="/api/v1")
```

### Adding New Models

1. Create a new model file in `app/models/`
2. Define your SQLAlchemy model inheriting from `Base`
3. Import in `app/models/__init__.py`

### Adding New Schemas

1. Create schema files in `app/schemas/`
2. Define Pydantic models for request/response validation
3. Use in your route handlers

## Database Migrations (Optional)

To add Alembic for migrations:

```bash
pip install alembic
alembic init migrations
```

## Production Deployment

Before deploying to production:

1. Set `DEBUG=False` in `.env`
2. Use a strong `SECRET_KEY`
3. Configure a proper database (PostgreSQL recommended)
4. Use an ASGI server like Gunicorn with Uvicorn workers:

```bash
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

## Dependencies

- **fastapi**: Web framework
- **uvicorn**: ASGI server
- **sqlalchemy**: ORM
- **psycopg2-binary**: PostgreSQL adapter
- **python-jose**: JWT handling
- **passlib**: Password hashing
- **pydantic**: Data validation
- **python-dotenv**: Environment variables

## License

MIT
