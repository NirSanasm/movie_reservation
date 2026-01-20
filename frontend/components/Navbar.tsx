'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isAuthenticated, getStoredUser, removeToken, isAdmin } from '@/lib/auth';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<{ email: string; role: string } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isAuthenticated()) {
            setUser(getStoredUser());
        }
    }, [pathname]);

    const handleLogout = () => {
        removeToken();
        setUser(null);
        router.push('/login');
    };

    const isActive = (path: string) => pathname === path;

    if (!mounted) {
        return (
            <nav style={{
                background: 'rgba(10, 10, 26, 0.9)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(100, 100, 200, 0.2)',
                padding: '16px 0',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', textDecoration: 'none' }}>
                        🎬 MovieHub
                    </Link>
                </div>
            </nav>
        );
    }

    return (
        <nav style={{
            background: 'rgba(10, 10, 26, 0.9)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(100, 100, 200, 0.2)',
            padding: '16px 0',
            position: 'sticky',
            top: 0,
            zIndex: 100,
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🎬 MovieHub
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {user ? (
                        <>
                            <Link href="/screenings" className={`nav-link ${isActive('/screenings') ? 'nav-link-active' : ''}`}>
                                Screenings
                            </Link>
                            <Link href="/reservations" className={`nav-link ${isActive('/reservations') ? 'nav-link-active' : ''}`}>
                                My Tickets
                            </Link>
                            {isAdmin() && (
                                <Link href="/admin" className={`nav-link ${isActive('/admin') ? 'nav-link-active' : ''}`}>
                                    Admin
                                </Link>
                            )}
                            <div style={{ marginLeft: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: 'rgba(229, 229, 229, 0.6)', fontSize: '14px' }}>
                                    {user.email}
                                </span>
                                <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className={`nav-link ${isActive('/login') ? 'nav-link-active' : ''}`}>
                                Login
                            </Link>
                            <Link href="/register" className="btn-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
