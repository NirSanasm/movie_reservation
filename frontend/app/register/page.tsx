'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { setToken, setStoredUser } from '@/lib/auth';

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'user' | 'admin'>('user');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            // Register the user
            await authApi.register({ email, password, role });

            // Auto-login after registration
            const loginResponse = await authApi.login(email, password);
            setToken(loginResponse.access_token);

            // Fetch and store user info
            const user = await authApi.getCurrentUser();
            setStoredUser({ id: user.id, email: user.email, role: user.role });

            router.push('/screenings');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container animate-fade-in" style={{
            minHeight: 'calc(100vh - 200px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
        }}>
            <div className="glass-card" style={{ maxWidth: '440px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        marginBottom: '8px',
                        background: 'linear-gradient(135deg, #fff 0%, #f472b6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        Create Account
                    </h1>
                    <p style={{ color: 'rgba(229, 229, 229, 0.6)' }}>
                        Join MovieHub and start booking
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input-field"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '28px' }}>
                        <label className="form-label">Account Type</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setRole('user')}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: role === 'user' ? '2px solid #7c3aed' : '1px solid rgba(100, 100, 200, 0.2)',
                                    background: role === 'user' ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                                    color: role === 'user' ? 'white' : 'rgba(229, 229, 229, 0.6)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                👤 User
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('admin')}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: role === 'admin' ? '2px solid #7c3aed' : '1px solid rgba(100, 100, 200, 0.2)',
                                    background: role === 'admin' ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                                    color: role === 'admin' ? 'white' : 'rgba(229, 229, 229, 0.6)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                🛡️ Admin
                            </button>
                        </div>
                        <p style={{ fontSize: '12px', color: 'rgba(229, 229, 229, 0.4)', marginTop: '8px' }}>
                            Admins can manage screenings and movies
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: '100%', fontSize: '1rem', padding: '14px' }}
                    >
                        {loading ? (
                            <span className="spinner" />
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <p style={{
                    textAlign: 'center',
                    marginTop: '24px',
                    color: 'rgba(229, 229, 229, 0.6)',
                }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: 600 }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
