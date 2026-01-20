'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { reservationsApi, screeningsApi } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import type { Reservation, Screening } from '@/lib/types';

export default function ReservationsPage() {
    const router = useRouter();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [screenings, setScreenings] = useState<{ [key: number]: Screening }>({});
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }

        loadReservations();
    }, [router]);

    const loadReservations = async () => {
        try {
            const data = await reservationsApi.getMyReservations();
            setReservations(data);

            // Load screening details for each reservation
            const screeningIds = [...new Set(data.map(r => r.screening_id))];
            const screeningData: { [key: number]: Screening } = {};

            await Promise.all(
                screeningIds.map(async (id) => {
                    try {
                        const screening = await screeningsApi.getById(id);
                        screeningData[id] = screening;
                    } catch {
                        // Screening might be deleted
                    }
                })
            );

            setScreenings(screeningData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load reservations');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (reservationId: number) => {
        if (!confirm('Are you sure you want to cancel this reservation?')) return;

        setActionLoading(reservationId);
        try {
            await reservationsApi.cancel(reservationId);
            // Refresh the list
            await loadReservations();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to cancel reservation');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDownloadTicket = async (reservationId: number) => {
        setActionLoading(reservationId);
        try {
            await reservationsApi.downloadTicket(reservationId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to download ticket');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: '16px', color: 'rgba(229, 229, 229, 0.6)' }}>Loading reservations...</p>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in" style={{ padding: '40px 20px' }}>
            <h1 className="page-title">🎟️ My Tickets</h1>

            {error && (
                <div className="alert alert-error">{error}</div>
            )}

            {reservations.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎫</div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>No Reservations Yet</h2>
                    <p style={{ color: 'rgba(229, 229, 229, 0.6)', marginBottom: '24px' }}>
                        Book your first movie and your tickets will appear here.
                    </p>
                    <Link href="/screenings" className="btn-primary">
                        Browse Screenings
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reservations.map((reservation) => {
                        const screening = screenings[reservation.screening_id];
                        const showtime = screening ? formatDate(screening.show_datetime) : null;
                        const isActive = reservation.status === 'active';

                        return (
                            <div key={reservation.id} className="glass-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                            <span className={`badge ${isActive ? 'badge-active' : 'badge-cancelled'}`}>
                                                {reservation.status}
                                            </span>
                                            <span style={{ color: 'rgba(229, 229, 229, 0.5)', fontSize: '14px' }}>
                                                Reservation #{reservation.id}
                                            </span>
                                        </div>

                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>
                                            🎬 Movie #{reservation.screening_id} - Screening
                                        </h3>

                                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', color: 'rgba(229, 229, 229, 0.7)', fontSize: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                🪑 Seat: <strong style={{ color: '#7c3aed' }}>{reservation.seat_number}</strong>
                                            </div>
                                            {showtime && (
                                                <>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        📅 {showtime.date}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        🕐 {showtime.time}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {reservation.created_at && (
                                            <p style={{ marginTop: '12px', fontSize: '12px', color: 'rgba(229, 229, 229, 0.4)' }}>
                                                Booked on {new Date(reservation.created_at).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    {isActive && (
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => handleDownloadTicket(reservation.id)}
                                                disabled={actionLoading === reservation.id}
                                                className="btn-primary"
                                                style={{ padding: '10px 16px', fontSize: '14px' }}
                                            >
                                                {actionLoading === reservation.id ? (
                                                    <span className="spinner" style={{ width: '16px', height: '16px' }} />
                                                ) : (
                                                    <>📥 Download</>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleCancel(reservation.id)}
                                                disabled={actionLoading === reservation.id}
                                                className="btn-danger"
                                                style={{ padding: '10px 16px', fontSize: '14px' }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
