'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { screeningsApi } from '@/lib/api';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import type { Screening, ScreeningCreate } from '@/lib/types';

export default function AdminPage() {
    const router = useRouter();
    const [screenings, setScreenings] = useState<Screening[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [movieId, setMovieId] = useState('1');
    const [showDatetime, setShowDatetime] = useState('');
    const [totalSeats, setTotalSeats] = useState('100');
    const [price, setPrice] = useState('10.00');
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }

        if (!isAdmin()) {
            router.push('/');
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

    const handleCreateScreening = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setError('');
        setSuccess('');

        try {
            const newScreening: ScreeningCreate = {
                movie_id: parseInt(movieId),
                show_datetime: new Date(showDatetime).toISOString(),
                total_seats: parseInt(totalSeats),
                price: price,
            };

            await screeningsApi.create(newScreening);
            setSuccess('Screening created successfully!');
            setShowForm(false);
            setMovieId('1');
            setShowDatetime('');
            setTotalSeats('100');
            setPrice('10.00');
            await loadScreenings();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create screening');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteScreening = async (id: number) => {
        if (!confirm('Are you sure you want to delete this screening?')) return;

        setActionLoading(id);
        setError('');
        setSuccess('');

        try {
            await screeningsApi.delete(id);
            setSuccess('Screening deleted successfully!');
            await loadScreenings();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete screening');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: '16px', color: 'rgba(229, 229, 229, 0.6)' }}>Loading admin panel...</p>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in" style={{ padding: '40px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>🛡️ Admin Dashboard</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={showForm ? 'btn-secondary' : 'btn-primary'}
                >
                    {showForm ? 'Cancel' : '+ Add Screening'}
                </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Create Screening Form */}
            {showForm && (
                <div className="glass-card animate-fade-in" style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px' }}>
                        ➕ Create New Screening
                    </h2>
                    <form onSubmit={handleCreateScreening}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            <div>
                                <label className="form-label">Movie ID</label>
                                <input
                                    type="number"
                                    value={movieId}
                                    onChange={(e) => setMovieId(e.target.value)}
                                    className="input-field"
                                    min="1"
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">Show Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={showDatetime}
                                    onChange={(e) => setShowDatetime(e.target.value)}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">Total Seats</label>
                                <input
                                    type="number"
                                    value={totalSeats}
                                    onChange={(e) => setTotalSeats(e.target.value)}
                                    className="input-field"
                                    min="1"
                                    max="500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">Price ($)</label>
                                <input
                                    type="text"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="input-field"
                                    pattern="[0-9]+(\.[0-9]{1,2})?"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={formLoading}
                            style={{ marginTop: '20px' }}
                        >
                            {formLoading ? <span className="spinner" /> : 'Create Screening'}
                        </button>
                    </form>
                </div>
            )}

            {/* Screenings Table */}
            <div className="glass-card">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px' }}>
                    📋 Manage Screenings ({screenings.length})
                </h2>

                {screenings.length === 0 ? (
                    <p style={{ color: 'rgba(229, 229, 229, 0.6)', textAlign: 'center', padding: '40px 0' }}>
                        No screenings found. Create one above.
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(100, 100, 200, 0.2)' }}>
                                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'rgba(229, 229, 229, 0.6)', fontWeight: 500 }}>ID</th>
                                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'rgba(229, 229, 229, 0.6)', fontWeight: 500 }}>Movie</th>
                                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'rgba(229, 229, 229, 0.6)', fontWeight: 500 }}>Date & Time</th>
                                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'rgba(229, 229, 229, 0.6)', fontWeight: 500 }}>Seats</th>
                                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'rgba(229, 229, 229, 0.6)', fontWeight: 500 }}>Price</th>
                                    <th style={{ textAlign: 'right', padding: '12px 8px', color: 'rgba(229, 229, 229, 0.6)', fontWeight: 500 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {screenings.map((screening) => (
                                    <tr key={screening.id} style={{ borderBottom: '1px solid rgba(100, 100, 200, 0.1)' }}>
                                        <td style={{ padding: '16px 8px' }}>#{screening.id}</td>
                                        <td style={{ padding: '16px 8px' }}>Movie #{screening.movie_id}</td>
                                        <td style={{ padding: '16px 8px' }}>{formatDate(screening.show_datetime)}</td>
                                        <td style={{ padding: '16px 8px' }}>{screening.total_seats}</td>
                                        <td style={{ padding: '16px 8px' }}>${screening.price}</td>
                                        <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDeleteScreening(screening.id)}
                                                disabled={actionLoading === screening.id}
                                                className="btn-danger"
                                                style={{ padding: '8px 12px', fontSize: '13px' }}
                                            >
                                                {actionLoading === screening.id ? (
                                                    <span className="spinner" style={{ width: '14px', height: '14px' }} />
                                                ) : (
                                                    '🗑️ Delete'
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
