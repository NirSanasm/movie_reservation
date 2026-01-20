'use client';

import type { SeatAvailability } from '@/lib/types';

interface SeatSelectorProps {
    seatData: SeatAvailability;
    selectedSeat: string | null;
    onSelectSeat: (seat: string) => void;
}

export default function SeatSelector({ seatData, selectedSeat, onSelectSeat }: SeatSelectorProps) {
    const seatsPerRow = 10;

    // Group seats by row
    const seatsByRow: { [key: string]: string[] } = {};
    seatData.available_seats.concat(seatData.taken_seats).sort().forEach(seat => {
        const row = seat.charAt(0);
        if (!seatsByRow[row]) seatsByRow[row] = [];
        seatsByRow[row].push(seat);
    });

    const rows = Object.keys(seatsByRow).sort();

    return (
        <div>
            {/* Screen indicator */}
            <div style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(124, 58, 237, 0.5) 50%, transparent 100%)',
                height: '4px',
                borderRadius: '4px',
                marginBottom: '8px',
            }} />
            <p style={{
                textAlign: 'center',
                color: 'rgba(229, 229, 229, 0.5)',
                fontSize: '12px',
                marginBottom: '32px',
                letterSpacing: '4px',
                textTransform: 'uppercase',
            }}>
                Screen
            </p>

            {/* Seat grid */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: 'center',
            }}>
                {rows.map(row => (
                    <div key={row} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {/* Row label */}
                        <span style={{
                            width: '24px',
                            textAlign: 'center',
                            color: 'rgba(229, 229, 229, 0.5)',
                            fontSize: '12px',
                            fontWeight: 600,
                        }}>
                            {row}
                        </span>

                        {/* Seats */}
                        {seatsByRow[row].sort((a, b) => {
                            const numA = parseInt(a.slice(1));
                            const numB = parseInt(b.slice(1));
                            return numA - numB;
                        }).map(seat => {
                            const isTaken = seatData.taken_seats.includes(seat);
                            const isSelected = selectedSeat === seat;

                            return (
                                <button
                                    key={seat}
                                    onClick={() => !isTaken && onSelectSeat(seat)}
                                    disabled={isTaken}
                                    className={`seat ${isSelected ? 'seat-selected' :
                                            isTaken ? 'seat-taken' : 'seat-available'
                                        }`}
                                    title={isTaken ? 'Taken' : seat}
                                >
                                    {seat.slice(1)}
                                </button>
                            );
                        })}

                        {/* Row label (right side) */}
                        <span style={{
                            width: '24px',
                            textAlign: 'center',
                            color: 'rgba(229, 229, 229, 0.5)',
                            fontSize: '12px',
                            fontWeight: 600,
                        }}>
                            {row}
                        </span>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                marginTop: '32px',
                flexWrap: 'wrap',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="seat seat-available" style={{ width: '24px', height: '24px', fontSize: '10px', cursor: 'default' }} />
                    <span style={{ color: 'rgba(229, 229, 229, 0.6)', fontSize: '14px' }}>Available</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="seat seat-selected" style={{ width: '24px', height: '24px', fontSize: '10px', cursor: 'default' }} />
                    <span style={{ color: 'rgba(229, 229, 229, 0.6)', fontSize: '14px' }}>Selected</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="seat seat-taken" style={{ width: '24px', height: '24px', fontSize: '10px', cursor: 'default' }} />
                    <span style={{ color: 'rgba(229, 229, 229, 0.6)', fontSize: '14px' }}>Taken</span>
                </div>
            </div>

            {/* Stats */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '32px',
                marginTop: '24px',
                padding: '16px',
                background: 'rgba(30, 30, 60, 0.5)',
                borderRadius: '12px',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                        {seatData.available_count}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(229, 229, 229, 0.5)' }}>Available</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>
                        {seatData.taken_count}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(229, 229, 229, 0.5)' }}>Taken</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'rgba(229, 229, 229, 0.8)' }}>
                        {seatData.total_seats}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(229, 229, 229, 0.5)' }}>Total</div>
                </div>
            </div>
        </div>
    );
}
