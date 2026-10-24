'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { screeningsApi } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import type { Screening } from '@/lib/types';

export default function ScreeningsPage() {
    const router = useRouter();
    const [screenings, setScreenings] = useState<Screening[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }

        loadScreenings();
    }, [router]);

    const loadScreenings = async () => {
        try {
            const data = await screeningsApi.getAll();
            setScreenings(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load screenings');
        } finally {
            setLoading(false);
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
                <p style={{ marginTop: '16px', color: 'rgba(229, 229, 229, 0.6)' }}>Loading screenings...</p>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in" style={{ padding: '40px 20px' }}>
            <h1 className="page-title">🎬 Available Screenings</h1>

            {error && (
                <div className="alert alert-error">{error}</div>
            )}

            {screenings.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎭</div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>No Screenings Available</h2>
                    <p style={{ color: 'rgba(229, 229, 229, 0.6)' }}>
                        Check back later for upcoming movie screenings.
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '24px',
                }}>
                    {screenings.map((screening) => {
                        const { date, time } = formatDate(screening.show_datetime);
                        return (
                            <Link
                                key={screening.id}
                                href={`/screenings/${screening.id}`}
                                style={{ textDecoration: 'none' }}
                            >
                                <div className="glass-card" style={{ height: '100%', cursor: 'pointer' }}>
                                    {/* Movie poster image or fallback */}
                                    <div style={{
                                        height: '200px',
                                        borderRadius: '12px',
                                        marginBottom: '16px',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        {screening.movie?.poster_url ? (
                                            <img
                                                src={screening.movie.poster_url}
                                                alt={screening.movie.title || `Movie #${screening.movie_id}`}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '3rem' }}>🎬</span>
                                        )}
                                        {screening.movie?.genre && (
                                            <span style={{
                                                position: 'absolute',
                                                top: '12px',
                                                right: '12px',
                                                background: 'rgba(0, 0, 0, 0.75)',
                                                backdropFilter: 'blur(8px)',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: '#fff',
                                            }}>
                                                {screening.movie.genre}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px', color: 'white' }}>
                                                {screening.movie?.title || `Movie #${screening.movie_id}`}
                                            </h3>
                                            <p style={{ color: 'rgba(229, 229, 229, 0.6)', fontSize: '14px' }}>
                                                Screening #{screening.id}
                                            </p>
                                        </div>
                                        <span style={{
                                            background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                        }}>
                                            ${screening.price}
                                        </span>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        gap: '16px',
                                        color: 'rgba(229, 229, 229, 0.8)',
                                        fontSize: '14px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            📅 {date}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            🕐 {time}
                                        </div>
                                    </div>

                                    <div style={{
                                        marginTop: '16px',
                                        paddingTop: '16px',
                                        borderTop: '1px solid rgba(100, 100, 200, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}>
                                        <span style={{ color: 'rgba(229, 229, 229, 0.6)', fontSize: '14px' }}>
                                            🪑 {screening.total_seats} seats
                                        </span>
                                        <span style={{ color: '#7c3aed', fontWeight: 600, fontSize: '14px' }}>
                                            Book Now →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
