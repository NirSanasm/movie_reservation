'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isAuthenticated } from '@/lib/auth';

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLoggedIn(isAuthenticated());
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center top, rgba(124, 58, 237, 0.15) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '24px',
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #fff 0%, #f472b6 50%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Your Movie Experience
            </span>
            <br />
            <span style={{ color: 'rgba(229, 229, 229, 0.9)' }}>
              Starts Here
            </span>
          </h1>

          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(229, 229, 229, 0.6)',
            maxWidth: '600px',
            margin: '0 auto 40px',
            lineHeight: 1.6,
          }}>
            Book your favorite seats for the latest blockbusters.
            Easy reservations, instant tickets.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {mounted && loggedIn ? (
              <>
                <Link href="/screenings" className="btn-primary" style={{ fontSize: '1.1rem', padding: '16px 32px' }}>
                  🎬 Browse Screenings
                </Link>
                <Link href="/reservations" className="btn-secondary" style={{ fontSize: '1.1rem', padding: '16px 32px' }}>
                  🎟️ My Tickets
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className="btn-primary" style={{ fontSize: '1.1rem', padding: '16px 32px' }}>
                  Get Started Free
                </Link>
                <Link href="/login" className="btn-secondary" style={{ fontSize: '1.1rem', padding: '16px 32px' }}>
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '48px',
            color: 'rgba(229, 229, 229, 0.9)',
          }}>
            Why Choose MovieHub?
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {[
              {
                icon: '🎯',
                title: 'Choose Your Seat',
                description: 'Interactive seat map lets you pick the perfect spot for your movie experience.',
              },
              {
                icon: '⚡',
                title: 'Instant Booking',
                description: 'Quick and secure payment processing. Get your digital ticket in seconds.',
              },
              {
                icon: '📱',
                title: 'Digital Tickets',
                description: 'Download your PDF ticket instantly. No printing needed.',
              },
            ].map((feature, index) => (
              <div key={index} className="glass-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'rgba(229, 229, 229, 0.6)', lineHeight: 1.6 }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '80px 0',
        background: 'linear-gradient(180deg, transparent 0%, rgba(124, 58, 237, 0.1) 100%)',
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '16px',
          }}>
            Ready for the Show?
          </h2>
          <p style={{
            color: 'rgba(229, 229, 229, 0.6)',
            marginBottom: '32px',
            fontSize: '1.1rem',
          }}>
            Join thousands of movie lovers booking their seats with MovieHub.
          </p>
          <Link href={mounted && loggedIn ? '/screenings' : '/register'} className="btn-primary" style={{
            fontSize: '1.1rem',
            padding: '16px 40px',
          }}>
            {mounted && loggedIn ? 'Browse Now' : 'Create Account'}
          </Link>
        </div>
      </section>
    </div>
  );
}
