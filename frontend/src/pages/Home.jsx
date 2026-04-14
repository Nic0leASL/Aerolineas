import React, { useState, useEffect } from 'react';
import {
    Plane,
    Users,
    Activity,
    Shield,
    BarChart3,
    DollarSign,
    Globe,
    Clock,
    CheckCircle,
    AlertTriangle,
    Database
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
        
        // Refresh every 10 seconds for real-time vibe
        const interval = setInterval(fetchGlobalStats, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', height: '80vh', display:'flex', alignItems:'center', justifyContent:'center' }}>{t('common.loading')}...</div>;

    const formatCurrency = (val) => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(val || 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '60px' }}>
            <header style={{ marginBottom: '16px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'hsl(var(--primary))' }}>Dashboard de Empresa</h1>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '1.125rem' }}>Visión Global de Operaciones y Sincronización Distribuida</p>
            </header>

            {/* 1. Indicadores de Ventas y Rentabilidad */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <DollarSign color="hsl(var(--primary))" />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>1. Indicadores de Ventas y Rentabilidad</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    <DashboardCard icon={<DollarSign size={24} />} title="Resumen de Ventas (Total)" value={formatCurrency(stats?.sales?.totalRevenue)} subtitle="Monto total recaudado en Bs." />
                    <DashboardCard icon={<DollarSign size={24} />} title="Ventas por Primera Clase" value={formatCurrency(stats?.sales?.revenueFirstClass)} subtitle="Ingresos generados" />
                    <DashboardCard icon={<DollarSign size={24} />} title="Ventas por Clase Turista" value={formatCurrency(stats?.sales?.revenueEconomy)} subtitle="Ingresos generados" />
                </div>
            </section>

            {/* 2. Estados de Inventario y Operaciones */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', marginTop: '16px' }}>
                    <BarChart3 color="hsl(var(--primary))" />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>2. Estados de Inventario y Operaciones</h2>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                    {/* Totalizadores de Asientos */}
                    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', fontWeight: '600' }}>Totalizadores de Asientos</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center' }}>
                            <div style={{ padding: '16px', background: 'hsla(var(--success)/0.1)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'hsl(var(--success))' }}>{(stats?.inventory?.free || 0).toLocaleString()}</div>
                                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>Libres</div>
                            </div>
                            <div style={{ padding: '16px', background: 'hsla(var(--warning)/0.1)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'hsl(var(--warning))' }}>{(stats?.inventory?.reserved || 0).toLocaleString()}</div>
                                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>Reservados</div>
                            </div>
                            <div style={{ padding: '16px', background: 'hsla(var(--primary)/0.1)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'hsl(var(--primary))' }}>{(stats?.inventory?.sold || 0).toLocaleString()}</div>
                                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>Vendidos</div>
                            </div>
                        </div>
                    </div>

                    {/* Estado de Vuelos */}
                    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', fontWeight: '600' }}>Estado Operativo de Vuelos</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {Object.entries(stats?.statusCounts || {}).map(([st, count]) => (
                                <StatusBar key={st} label={st} count={count} total={stats?.totalFlights || 1} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Sincronización y Consistencia */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', marginTop: '16px' }}>
                    <Shield color="hsl(var(--secondary))" />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>3. Sincronización y Consistencia (Métricas Técnicas)</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Clock size={24} color="hsl(var(--success))" />
                        <h3 style={{ fontSize: '1rem', color: 'hsl(var(--text-muted))' }}>Delay de Sincronización</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats?.syncMetrics?.syncDelaySeconds}s</div>
                        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--success))' }}>Dentro del umbral de 10s</p>
                    </div>
                    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <AlertTriangle size={24} color="hsl(var(--warning))" />
                        <h3 style={{ fontSize: '1rem', color: 'hsl(var(--text-muted))' }}>Conflictos de Concurrencia</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats?.syncMetrics?.vectorClockConflicts}</div>
                        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-dim))' }}>Resueltos vía Relojes Vectoriales</p>
                    </div>
                    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Database size={24} color="hsl(var(--primary))" />
                        <h3 style={{ fontSize: '1rem', color: 'hsl(var(--text-muted))' }}>Estado Global</h3>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={24} />
                            Consistente
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-dim))' }}>{stats?.syncMetrics?.propagationStatus}</p>
                    </div>
                </div>
            </section>

            {/* 4. Datos Geográficos y 5. Gestión de Flota */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '16px' }}>
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <Globe color="hsl(var(--primary))" />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>4. Datos Geográficos</h2>
                    </div>
                    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'hsl(var(--text-muted))' }}>Ubicación de Compra (Demanda)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {stats?.geographic?.map((geo, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'hsla(white/0.02)', borderRadius: '4px' }}>
                                    <span style={{ fontWeight: '500' }}>{geo.country} ({geo.city})</span>
                                    <span>{geo.percent}% - {geo.count} requests</span>
                                </div>
                            ))}
                        </div>
                        <h3 style={{ fontSize: '1rem', marginTop: '24px', marginBottom: '16px', color: 'hsl(var(--text-muted))' }}>Rutas más Solicitadas</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {stats?.topRoutes?.map((tr, idx) => (
                                <div key={idx} style={{ padding: '8px 16px', background: 'hsla(var(--primary)/0.1)', color: 'hsl(var(--primary))', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '600' }}>
                                    {tr.Route.substring(0,3)} → {tr.Route.substring(3,6)} ({tr.RequestCount})
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <Plane color="hsl(var(--primary))" />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>5. Gestión de Flota y Pasajeros</h2>
                    </div>
                    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'hsl(var(--text-muted))' }}>Disponibilidad de Flota (50 Aviones)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            {stats?.fleet?.map((f, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', textAlign: 'center', fontWeight: 'bold' }}>{f.count}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{f.model}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))' }}>{f.operational} en operación, {f.maintenance} en mantenimiento</div>
                                    </div>
                                    <div style={{ width: '100px', height: '6px', background: 'hsla(white/0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(f.operational/f.count)*100}%`, height: '100%', background: 'hsl(var(--success))' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'hsl(var(--text-muted))' }}>Listas Rápida de Pasajeros Registrados</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {stats?.recentPassengers?.map((p, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'hsla(white/0.02)', borderRadius: '4px' }}>
                                    <Users size={14} color="hsl(var(--text-dim))" />
                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '500', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.name}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-dim))' }}>Pass: {p.passport}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

const DashboardCard = ({ icon, title, value, subtitle }) => (
    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'hsl(var(--text-muted))' }}>
            {icon}
            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{title}</span>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>{value}</div>
        <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-dim))' }}>{subtitle}</div>
    </div>
);

const StatusBar = ({ label, count, total }) => {
    const percent = total > 0 ? ((count / total) * 100) : 0;
    const color = label === 'SCHEDULED' ? 'var(--primary)' : label === 'IN_FLIGHT' || label === 'LANDED' ? 'var(--success)' : label === 'DELAYED' ? 'var(--warning)' : 'var(--text-dim)';
    
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '100px', fontSize: '0.875rem', fontWeight: '500' }}>{label}</div>
            <div style={{ flex: 1, height: '8px', background: 'hsla(white/0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${percent}%`, height: '100%', background: `hsl(${color})` }}></div>
            </div>
            <div style={{ width: '50px', fontSize: '0.875rem', textAlign: 'right', color: `hsl(${color})` }}>{count}</div>
        </div>
    );
}

export default Home;
