// TypeScript interfaces matching the FastAPI backend schemas

export interface User {
    id: number;
    email: string;
    role: 'user' | 'admin';
    created_at?: string;
}

export interface UserCreate {
    email: string;
    password: string;
    role?: 'user' | 'admin';
}

export interface UserLogin {
    username: string; // OAuth2 uses 'username' field for email
    password: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface Movie {
    id: number;
    title: string;
    description: string;
    poster_url: string;
    genre: string;
    created_at?: string;
}

export interface Screening {
    id: number;
    movie_id: number;
    show_datetime: string;
    total_seats: number;
    price: string;
    created_at?: string;
    movie?: Movie;
}

export interface ScreeningCreate {
    movie_id: number;
    show_datetime: string;
    total_seats?: number;
    price?: string;
}

export interface SeatAvailability {
    screening_id: number;
    total_seats: number;
    available_count: number;
    taken_count: number;
    taken_seats: string[];
    available_seats: string[];
}

export interface PaymentRequest {
    card_number: string;
    expiry_month: number;
    expiry_year: number;
    cvv: string;
}

export interface PaymentResponse {
    transaction_id: string;
    status: string;
    amount: string;
    message: string;
}

export interface ReservationCreate {
    screening_id: number;
    seat_number: string;
    payment: PaymentRequest;
}

export interface Reservation {
    id: number;
    screening_id: number;
    user_id: number;
    seat_number: string;
    status: 'active' | 'cancelled';
    created_at?: string;
    cancelled_at?: string;
    payment_info?: PaymentResponse;
}

export interface ApiError {
    detail: string;
}
