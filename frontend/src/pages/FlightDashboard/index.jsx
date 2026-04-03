import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Users,
    DollarSign,
    Percent,
    LayoutDashboard,
    ArrowLeft,
    PieChart,
    BarChart3,
    TrendingUp
} from 'lucide-react';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

const FlightDashboard = () => {
    const { flightId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [flight, setFlight] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFlightData = async () => {
            try {
                const data = await api.getFlight(flightId);
                setFlight(data);
            } catch (error) {
                console.error("Error fetching flight stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFlightData();
    }, [flightId]);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('common.loading')}</div>;
    if (!flight) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('common.error')}</div>;
    if (!flight.seats) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('common.no_data')}</div>;

    // Calculate Stats
    const totalSeats = Object.keys(flight.seats).length;
    const occupiedSeats = Object.values(flight.seats).filter(s => s.status === 'BOOKED').length;
    const reservedSeats = Object.values(flight.seats).filter(s => s.status === 'RESERVED').length;
    const availableSeats = totalSeats - occupiedSeats - reservedSeats;
    const occupancyRate = ((occupiedSeats / totalSeats) * 100).toFixed(1);

    const revenueByClass = Object.values(flight.seats).reduce((acc, seat) => {
        if (seat.status === 'BOOKED') {
            const cls = seat.seatType || 'Unknown';
            acc[cls] = (acc[cls] || 0) + (seat.price || 0);
        }
        return acc;
    }, {});

    const totalRevenue = Object.values(revenueByClass).reduce((a, b) => a + b, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button onClick={() => navigate(-1)} className="glass-light" style={{ padding: '10px', borderRadius: '50%' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-dim))', fontWeight: '600' }}>
                        {flight.origin} → {flight.destination}
                    </div>
                    <h2 style={{ fontSize: '2rem' }}>{flight.flightNumber} - {t('nav.dashboard')}</h2>
                </div>
            </header>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                <StatCard icon={<Percent size={20} />} label="Ocupación" value={`${occupancyRate}%`} color="hsl(var(--primary))" />
                <StatCard icon={<Users size={20} />} label="Vendidos" value={occupiedSeats} color="hsl(var(--success))" />
                <StatCard icon={<PieChart size={20} />} label="Reservados" value={reservedSeats} color="hsl(var(--warning))" />
                <StatCard icon={<DollarSign size={20} />} label="Ingresos" value={`$${totalRevenue.toLocaleString()}`} color="hsl(var(--accent))" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* Occupancy Chart (SVG/CSS) */}
                <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <BarChart3 size={20} color="hsl(var(--primary))" />
                        Estado de Asientos
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <ProgressBar label="Vendidos" count={occupiedSeats} total={totalSeats} color="var(--success)" />
                        <ProgressBar label="Reservados" count={reservedSeats} total={totalSeats} color="var(--warning)" />
                        <ProgressBar label="Disponibles" count={availableSeats} total={totalSeats} color="var(--primary)" />
                    </div>
                </div>

                {/* Revenue Chart */}
                <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <TrendingUp size={20} color="hsl(var(--accent))" />
                        Ingresos por Clase
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {Object.entries(revenueByClass).map(([cls, rev]) => (
                            <div key={cls} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'hsla(white / 0.03)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontWeight: '600' }}>{cls}</div>
                                <div style={{ color: 'hsl(var(--accent))', fontWeight: '700' }}>${rev.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className="glass card-hover" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ padding: '12px', background: `hsla(${color.replace('hsl(', '').replace(')', '')} / 0.1)`, color, borderRadius: '12px' }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))', fontWeight: 'bold', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{value}</div>
        </div>
    </div>
);

const ProgressBar = ({ label, count, total, color }) => {
    const percentage = ((count / total) * 100).toFixed(1);
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px' }}>
                <span style={{ color: 'hsl(var(--text-muted))' }}>{label}</span>
                <span style={{ fontWeight: '600' }}>{count} ({percentage}%)</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'hsla(white / 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${percentage}%`, height: '100%', background: `hsl(${color})`, boxShadow: `0 0 10px hsla(${color} / 0.3)` }} />
            </div>
        </div>
    );
};

export default FlightDashboard;
