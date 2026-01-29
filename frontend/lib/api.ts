// API client for communicating with FastAPI backend

import { getToken, removeToken } from './auth';
import type {
    User,
    UserCreate,
    AuthResponse,
    Screening,
    ScreeningCreate,
    SeatAvailability,
    ReservationCreate,
    Reservation,
    Movie
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FetchOptions extends RequestInit {
    skipAuth?: boolean;
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Add Authorization header if authenticated
    if (!skipAuth) {
        const token = getToken();
        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401) {
            removeToken();
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }

        const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(error.detail || 'An error occurred');
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

// Auth API
export const authApi = {
    register: (data: UserCreate) =>
        fetchApi<User>('/api/v1/users/register', {
            method: 'POST',
            body: JSON.stringify(data),
            skipAuth: true,
        }),

    login: async (email: string, password: string) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}/api/v1/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Login failed' }));
            throw new Error(error.detail || 'Login failed');
        }

        return response.json() as Promise<AuthResponse>;
    },

    getCurrentUser: () => fetchApi<User>('/api/v1/users/me'),
};

// Movies API
export const moviesApi = {
    getAll: () => fetchApi<Movie[]>('/api/v1/movies/', { skipAuth: true }),
};

// Screenings API
export const screeningsApi = {
    getAll: () => fetchApi<Screening[]>('/api/v1/screening/'),

    getById: (id: number) => fetchApi<Screening>(`/api/v1/screening/${id}`),

    getSeatAvailability: (id: number) =>
        fetchApi<SeatAvailability>(`/api/v1/screening/${id}/seats`),

    create: (data: ScreeningCreate) =>
        fetchApi<Screening>('/api/v1/screening/', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        fetchApi<void>(`/api/v1/screening/${id}`, {
            method: 'DELETE',
        }),
};

// Reservations API
export const reservationsApi = {
    create: (data: ReservationCreate) =>
        fetchApi<Reservation>('/api/v1/reservation/', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getMyReservations: () =>
        fetchApi<Reservation[]>('/api/v1/reservation/'),

    getById: (id: number) =>
        fetchApi<Reservation>(`/api/v1/reservation/${id}`),

    cancel: (id: number) =>
        fetchApi<Reservation>(`/api/v1/reservation/${id}/cancel`, {
            method: 'POST',
        }),

    downloadTicket: async (id: number) => {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/v1/reservation/${id}/ticket`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Download failed:', errorText);
            throw new Error('Failed to download ticket');
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/pdf')) {
            const text = await response.text();
            console.error('Unexpected response:', text);
            throw new Error('Invalid ticket format received');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket-${id}.pdf`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        // Cleanup after a short delay
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);
    },
};
