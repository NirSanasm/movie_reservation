# 🎬 MovieHub - Movie Reservation System

A full-stack movie reservation application built with **FastAPI** (backend) and **Next.js** (frontend).

![Meta Blue Theme](https://img.shields.io/badge/theme-Meta%20Blue-0866FF)
![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688)
![Next.js](https://img.shields.io/badge/frontend-Next.js%2014-000000)

## ✨ Features

- 🎫 **Movie Screenings** - Browse available movies and showtimes
- 🪑 **Seat Selection** - Interactive seat picker with real-time availability
- 💳 **Fake Payment** - Simulated payment processing (Visa cards starting with 4)
- 📥 **PDF Tickets** - Download printable tickets after booking
- 🔐 **Authentication** - JWT-based user authentication
- 🛡️ **Admin Dashboard** - Manage screenings (admin users only)
- 🔄 **Auto-seeding** - Automatic movie and screening data generation

---

## 🏗️ Project Structure

```
movie_reservation/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   │   ├── health.py
│   │   │   ├── users.py
│   │   │   ├── screening.py
│   │   │   └── reservation.py
│   │   ├── core/            # Config & utilities
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── seed.py      # Auto-seeding logic
│   │   ├── database/
│   │   │   └── database.py
│   │   ├── models/
│   │   │   └── user.py      # SQLAlchemy models
│   │   └── schemas/
│   │       └── user.py      # Pydantic schemas
│   ├── main.py              # FastAPI app entry
│   └── requirements.txt
│
└── frontend/                # Next.js Frontend
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx         # Home page
    │   ├── login/
    │   ├── register/
    │   ├── screenings/
    │   │   └── [id]/        # Booking flow
    │   ├── reservations/    # My tickets
    │   └── admin/           # Admin dashboard
    ├── components/
    │   ├── Navbar.tsx
    │   ├── SeatSelector.tsx
    │   └── PaymentForm.tsx
    └── lib/
        ├── api.ts           # API client
        ├── auth.ts          # Auth utilities
        └── types.ts         # TypeScript types
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (or SQLite for development)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 🔑 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/users/register` | Register new user |
| POST | `/api/v1/users/login` | Login (OAuth2 password flow) |
| GET | `/api/v1/users/me` | Get current user |

### Screenings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/screening/` | List all screenings |
| GET | `/api/v1/screening/{id}` | Get screening details |
| GET | `/api/v1/screening/{id}/seats` | Get seat availability |
| POST | `/api/v1/screening/` | Create screening (admin) |
| DELETE | `/api/v1/screening/{id}` | Delete screening (admin) |

### Reservations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/reservation/` | Create reservation |
| GET | `/api/v1/reservation/` | Get my reservations |
| POST | `/api/v1/reservation/{id}/cancel` | Cancel reservation |
| GET | `/api/v1/reservation/{id}/ticket` | Download PDF ticket |

---

## 🎨 Design

The frontend uses **Meta's color palette**:

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#0866FF` | Buttons, links, accents |
| Background | `#18191A` | Dark theme background |
| Surface | `#242526` | Cards, inputs |
| Text | `#E4E6EB` | Primary text |
| Success | `#31A24C` | Available seats |
| Danger | `#F02849` | Errors, taken seats |

---

## 💳 Test Payment

Use any card number starting with **4** (simulates Visa):
- Card: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits

---

## 📦 Deployment

### Backend (Vercel/Railway)

1. Set environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `SECRET_KEY` - JWT signing key

2. Deploy with:
   ```bash
   vercel --prod
   ```

### Frontend (Vercel)

1. Set environment variable:
   - `NEXT_PUBLIC_API_URL` - Backend API URL

2. Deploy:
   ```bash
   cd frontend
   vercel --prod
   ```

---

## 🔒 Environment Variables

### Backend
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=your-secret-key-here
DEBUG=false
```

### Frontend
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

---

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---


