import React, { useState, useEffect } from 'react';
import {
    Plane,
    Users,
    Activity,
    Shield,
    BarChart3,
    DollarSign
} from 'lucide-react';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

const Home = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGlobalStats = async () => {
            try {
                const data = await api.getStats();
                setStats(data);
            } catch (error) {
                console.error("Error fetching global stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGlobalStats();
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('common.loading')}</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <header>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{t('home.title')}</h1>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '1.125rem' }}>{t('home.subtitle')}</p>
            </header>

            {/* Visión Institucional de Aerolíneas Rafael Pabón */}
            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '32px', padding: '32px', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg, hsla(var(--primary) / 0.1) 0%, hsla(var(--accent) / 0.05) 100%)' }}>
                <div style={{ flex: '0 0 160px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px hsla(var(--primary) / 0.3)' }}>
                        <Plane size={64} color="white" />
                    </div>
                </div>
                <div style={{ flex: '1' }}>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '16px', color: 'hsl(var(--primary))' }}>Aerolíneas Rafael Pabón</h2>
                    <p style={{ fontSize: '1.125rem', lineHeight: '1.7', color: 'hsl(var(--text-dim))' }}>
                        Aerolíneas Rafael Pabon, opera vuelos a múltiples destinos alrededor del mundo. La aerolínea ha decidido
                        implementar un sistema de reservas en línea distribuido para manejar las operaciones de reserva, venta y
                        anulación de boletos aéreos. Este sistema debe asegurar la consistencia y sincronización entre los diferentes
                        nodos distribuidos para evitar la sobreventa de boletos y garantizar una experiencia de usuario fluida y precisa.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                        <span style={{ fontSize: '0.875rem', padding: '6px 16px', background: 'hsla(var(--primary) / 0.1)', color: 'hsl(var(--primary))', borderRadius: '20px', fontWeight: '600' }}>Sistema CP (Consistencia Estricta)</span>
                        <span style={{ fontSize: '0.875rem', padding: '6px 16px', background: 'hsla(var(--success) / 0.1)', color: 'hsl(var(--success))', borderRadius: '20px', fontWeight: '600' }}>Cero Retrasos / Cero Cancelaciones</span>
                    </div>
                </div>
            </div>

            {/* Global Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                <DashboardCard
                    icon={<Plane size={24} />}
                    label={t('home.stats.active_flights')}
                    value={stats?.totalFlights || 0}
                    trend="+12%"
                />
                <DashboardCard
                    icon={<Users size={24} />}
                    label={t('home.stats.passengers')}
                    value={stats?.totalBooked || 0}
                    trend="+5.4%"
                />
                <DashboardCard
                    icon={<Activity size={24} />}
                    label="Ocupación Promedio"
                    value={`${stats?.avgOccupancy || 0}%`}
                    trend="Estable"
                />
                <DashboardCard
                    icon={<DollarSign size={24} />}
                    label="Ingresos Totales"
                    value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
                    trend="+18.2%"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                {/* Flight Status Distribution */}
                <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
                    <h3 style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <BarChart3 size={20} color="hsl(var(--primary))" />
                        Distribución de Estados
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {Object.entries(stats?.statusCounts || {}).map(([status, count]) => (
                            <StatusRow
                                key={status}
                                status={status}
                                count={count}
                                total={stats?.totalFlights || 1}
                            />
                        ))}
                    </div>
                </div>

                {/* System Health */}
                <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
                    <h3 style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Shield size={20} color="hsl(var(--success))" />
                        Estado del Clúster
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <NodeHealth name="Nodo 1 (Principal)" status="Online" latency="12ms" />
                        <NodeHealth name="Nodo 2" status="Online" latency="15ms" />
                        <NodeHealth name="Nodo 3" status="Online" latency="22ms" />
                        <div style={{ marginTop: 'auto', padding: '16px', background: 'hsla(var(--primary) / 0.05)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                            <div style={{ fontWeight: '700', marginBottom: '4px', color: 'hsl(var(--primary))' }}>Sincronización</div>
                            <div style={{ color: 'hsl(var(--text-muted))' }}>Vector Clocks activos. Consistencia eventual garantizada.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardCard = ({ icon, label, value, trend }) => (
    <div className="glass card-hover" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ color: 'hsl(var(--primary))', marginBottom: '20px' }}>{icon}</div>
        <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-dim))', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{label}</div>
        <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--success))', fontWeight: '600' }}>{trend} vs ayer</div>
        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05 }}>{icon}</div>
    </div>
);

const StatusRow = ({ status, count, total }) => {
    const percentage = ((count / total) * 100).toFixed(1);
    const getColor = (s) => {
        if (s === 'SCHEDULED') return 'var(--primary)';
        if (s === 'BOARDING' || s === 'IN_FLIGHT') return 'var(--success)';
        if (s === 'DELAYED') return 'var(--warning)';
        return 'var(--text-dim)';
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                <span style={{ fontWeight: '600' }}>{status}</span>
                <span style={{ color: 'hsl(var(--text-muted))' }}>{count} ({percentage}%)</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'hsla(white / 0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${percentage}%`, height: '100%', background: `hsl(${getColor(status)})` }} />
            </div>
        </div>
    );
};

const NodeHealth = ({ name, status, latency }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', background: 'hsl(var(--success))', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{name}</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))' }}>{latency}</div>
    </div>
);

export default Home;
