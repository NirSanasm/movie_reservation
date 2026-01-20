'use client';

import { useState } from 'react';
import type { PaymentRequest } from '@/lib/types';

interface PaymentFormProps {
    onSubmit: (payment: PaymentRequest) => void;
    loading: boolean;
    price: string;
}

export default function PaymentForm({ onSubmit, loading, price }: PaymentFormProps) {
    const [cardNumber, setCardNumber] = useState('');
    const [expiryMonth, setExpiryMonth] = useState('');
    const [expiryYear, setExpiryYear] = useState('');
    const [cvv, setCvv] = useState('');
    const [error, setError] = useState('');

    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
        return formatted.slice(0, 19);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const cleanedCard = cardNumber.replace(/\s/g, '');

        if (cleanedCard.length < 13) {
            setError('Please enter a valid card number');
            return;
        }

        if (!cleanedCard.startsWith('4')) {
            setError('For testing, use a card number starting with 4 (e.g., 4111111111111111)');
            return;
        }

        const month = parseInt(expiryMonth);
        const year = parseInt(expiryYear);

        if (month < 1 || month > 12) {
            setError('Invalid expiry month');
            return;
        }

        if (year < 2026 || year > 2040) {
            setError('Invalid expiry year');
            return;
        }

        if (cvv.length < 3) {
            setError('CVV must be 3-4 digits');
            return;
        }

        onSubmit({
            card_number: cleanedCard,
            expiry_month: month,
            expiry_year: year,
            cvv,
        });
    };

    return (
        <div className="glass-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px' }}>
                💳 Payment Details
            </h3>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            <div style={{
                background: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '20px',
                fontSize: '14px',
                color: 'rgba(229, 229, 229, 0.7)',
            }}>
                💡 <strong>Test Mode:</strong> Use card number starting with 4 (e.g., 4111111111111111)
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                    <label className="form-label">Card Number</label>
                    <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        className="input-field"
                        placeholder="4111 1111 1111 1111"
                        maxLength={19}
                        required
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    <div>
                        <label className="form-label">Month</label>
                        <input
                            type="number"
                            value={expiryMonth}
                            onChange={(e) => setExpiryMonth(e.target.value.slice(0, 2))}
                            className="input-field"
                            placeholder="12"
                            min="1"
                            max="12"
                            required
                        />
                    </div>
                    <div>
                        <label className="form-label">Year</label>
                        <input
                            type="number"
                            value={expiryYear}
                            onChange={(e) => setExpiryYear(e.target.value.slice(0, 4))}
                            className="input-field"
                            placeholder="2027"
                            min="2026"
                            max="2040"
                            required
                        />
                    </div>
                    <div>
                        <label className="form-label">CVV</label>
                        <input
                            type="password"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="input-field"
                            placeholder="123"
                            maxLength={4}
                            required
                        />
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: 'rgba(30, 30, 60, 0.5)',
                    borderRadius: '12px',
                    marginBottom: '20px',
                }}>
                    <span style={{ color: 'rgba(229, 229, 229, 0.6)' }}>Total Amount</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>${price}</span>
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
                        <>🎟️ Complete Booking</>
                    )}
                </button>
            </form>
        </div>
    );
}
