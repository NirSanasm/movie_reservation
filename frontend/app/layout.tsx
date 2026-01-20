import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MovieHub - Book Your Movie Experience',
  description: 'Reserve seats for the latest movie screenings',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 80px)' }}>
          {children}
        </main>
        <footer style={{
          borderTop: '1px solid rgba(100, 100, 200, 0.2)',
          padding: '24px 0',
          textAlign: 'center',
          color: 'rgba(229, 229, 229, 0.5)',
          fontSize: '14px',
        }}>
          <div className="container">
            © 2026 MovieHub. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
