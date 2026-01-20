'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { screeningsApi, reservationsApi } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import SeatSelector from '@/components/SeatSelector';
import PaymentForm from '@/components/PaymentForm';
import type { Screening, SeatAvailability, PaymentRequest } from '@/lib/types';

export default function ScreeningDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [screening, setScreening] = useState<Screening | null>(null);
    const [seatData, setSeatData] = useState<SeatAvailability | null>(null);
    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }

        loadScreeningData();
    }, [resolvedParams.id, router]);

    const loadScreeningData = async () => {
        try {
            const screeningId = parseInt(resolvedParams.id);
            const [screeningData, seats] = await Promise.all([
                screeningsApi.getById(screeningId),
                screeningsApi.getSeatAvailability(screeningId),
            ]);
            setScreening(screeningData);
            setSeatData(seats);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load screening');
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async (payment: PaymentRequest) => {
        if (!selectedSeat || !screening) return;

        setBookingLoading(true);
        setError('');

        try {
            await reservationsApi.create({
                screening_id: screening.id,
                seat_number: selectedSeat,
                payment,
            });
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: '16px', color: 'rgba(229, 229, 229, 0.6)' }}>Loading screening...</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="container animate-fade-in" style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Booking Confirmed!</h1>
                    <p style={{ color: 'rgba(229, 229, 229, 0.6)', marginBottom: '24px' }}>
                        Your ticket for seat <strong style={{ color: '#7c3aed' }}>{selectedSeat}</strong> has been reserved.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <Link href="/reservations" className="btn-primary">
                            View My Tickets
                        </Link>
                        <Link href="/screenings" className="btn-secondary">
                            Book Another
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!screening || !seatData) {
        return (
            <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Screening Not Found</h1>
                    <Link href="/screenings" className="btn-primary">
                        Back to Screenings
                    </Link>
                </div>
            </div>
        );
    }

    const { date, time } = formatDate(screening.show_datetime);

    return (
        <div className="container animate-fade-in" style={{ padding: '40px 20px' }}>
            <Link href="/screenings" style={{ color: 'rgba(229, 229, 229, 0.6)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                ← Back to Screenings
            </Link>

            {error && (
                <div className="alert alert-error">{error}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                {/* Screening Info */}
                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
                                🎬 Movie #{screening.movie_id}
                            </h1>
                            <p style={{ color: 'rgba(229, 229, 229, 0.6)' }}>Screening #{screening.id}</p>
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${screening.price}</div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>per seat</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', marginTop: '20px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(229, 229, 229, 0.8)' }}>
                            📅 {date}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(229, 229, 229, 0.8)' }}>
                            🕐 {time}
                        </div>
                    </div>
                </div>

                {/* Seat Selection */}
                <div className="glass-card">
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>
                        🪑 Select Your Seat
                    </h2>
                    <SeatSelector
                        seatData={seatData}
                        selectedSeat={selectedSeat}
                        onSelectSeat={setSelectedSeat}
                    />
                </div>

                {/* Payment (only show when seat is selected) */}
                {selectedSeat && (
                    <div className="animate-fade-in">
                        <div style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>✅</span>
                            <span>
                                Selected seat: <strong style={{ color: 'var(--success)' }}>{selectedSeat}</strong>
                            </span>
                        </div>

                        <PaymentForm
                            onSubmit={handleBooking}
                            loading={bookingLoading}
                            price={screening.price}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
