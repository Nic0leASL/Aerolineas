import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3, TrendingUp, Users, DollarSign, Plane, PieChart,
    Database, RefreshCw, ArrowRight, Globe, CheckCircle2, AlertCircle,
    Clock, RefreshCcw, MapPin, Navigation, ShieldCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';

const DashboardGlobal = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await api.getDashboardGlobal();
            setData(result.dashboard);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) return <div style={{ padding: '60px', textAlign: 'center', fontSize: '1.1rem', color: 'hsl(var(--text-dim))' }}>Cargando Dashboard Global...</div>;
    if (error) return <div style={{ padding: '60px', textAlign: 'center', color: 'hsl(var(--danger))' }}>Error: {error}</div>;
    if (!data) return null;

    const { resumenGlobal, ingresos, mongoReplication, vuelosPorEstado, topVuelosPorIngresos, presMetrics } = data;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-dim))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{t('nav.dashboard_global', 'Panel Gerencial')}</div>
                    <h1 style={{ fontSize: '2rem', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('nav.dashboard_global', 'Dashboard Global')}</h1>
                </div>
                <button onClick={fetchData} className="glass-light" style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                    <RefreshCw size={16} /> {t('common.refresh', 'Actualizar')}
                </button>
            </header>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                <StatCard icon={<Plane size={22} />} label={t('dashboard.total_flights', 'Total Vuelos')} value={resumenGlobal.totalVuelos?.toLocaleString()} color="var(--primary)" />
                <StatCard icon={<Users size={22} />} label={t('dashboard.seats_sold', 'Asientos Vendidos')} value={resumenGlobal.asientosVendidos?.toLocaleString()} color="var(--success)" sub={`${resumenGlobal.porcentajeOcupacion}% ${t('dashboard.occupancy', 'ocupación')}`} />
                <StatCard icon={<PieChart size={22} />} label={t('dashboard.seats_reserved', 'Reservados')} value={resumenGlobal.asientosReservados?.toLocaleString()} color="var(--warning)" />
                <StatCard icon={<DollarSign size={22} />} label={t('dashboard.total_revenue', 'Ingresos Totales')} value={`$${ingresos.total?.toLocaleString()}`} color="var(--accent)" />
            </div>

            {/* Revenue + Replication */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Revenue by Class */}
                <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-xl)' }}>
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                        <TrendingUp size={20} color="hsl(var(--accent))" />
                        {t('dashboard.revenue_by_class', 'Ingresos por Clase')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <RevenueRow label={t('dashboard.first_class', 'Primera Clase')} count={ingresos.boletosPrimera} amount={ingresos.primeraClase} total={ingresos.total} color="var(--primary)" currency="Bs." />
                        <RevenueRow label={t('dashboard.economy_class', 'Clase Turística')} count={ingresos.boletosTuristica} amount={ingresos.claseTuristica} total={ingresos.total} color="var(--accent)" currency="Bs." />
                    </div>
                    <div style={{ marginTop: '20px', padding: '16px', background: 'hsla(var(--accent) / 0.08)', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))', marginBottom: '4px' }}>{t('dashboard.total_revenue_upper', 'TOTAL INGRESOS')}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'hsl(var(--accent))' }}>{ingresos.moneda} {ingresos.total?.toLocaleString()}</div>
                    </div>
                    
                    {/* Tarifas Aplicadas (Pres Metrics) */}
                    {presMetrics && (
                        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid hsla(var(--surface-light) / 0.3)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-dim))', marginBottom: '12px', fontWeight: 600 }}>Tarifas Aplicadas (Base)</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {presMetrics.tarifasAplicadas.map((t, idx) => (
                                    <div key={idx} style={{ flex: 1, padding: '10px', background: 'hsla(var(--surface-light) / 0.2)', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>{t.clase}</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{t.tarifa}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* MongoDB Replication Status */}
                <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-xl)' }}>
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                        <Database size={20} color="hsl(var(--primary))" />
                        {t('dashboard.replication_status', 'Estado de Replicación (3 Nodos)')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <NodeStatus name={t('dashboard.node1', 'Nodo 1 — SQL Server (Europa)')} status="online" icon={<CheckCircle2 size={16} />} t={t} />
                        <NodeStatus name={t('dashboard.node2', 'Nodo 2 — SQL Server (Asia)')} status="online" icon={<CheckCircle2 size={16} />} t={t} />
                        <NodeStatus name={t('dashboard.node3', 'Nodo 3 — MongoDB (América)')} status={mongoReplication ? 'online' : 'warning'} icon={mongoReplication ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} t={t} />
                    </div>
                    {mongoReplication && (
                        <div style={{ marginTop: '20px', padding: '14px', background: 'hsla(var(--success) / 0.08)', borderRadius: '12px' }}>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))', marginBottom: '8px' }}>{t('dashboard.mongo_tickets', 'MONGO: BOLETOS REPLICADOS')}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                                <div><div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'hsl(var(--success))' }}>{mongoReplication.totalBooked}</div><div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-dim))' }}>{t('common.bought', 'Comprados')}</div></div>
                                <div><div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'hsl(var(--warning))' }}>{mongoReplication.totalReserved}</div><div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-dim))' }}>{t('common.reserved', 'Reservados')}</div></div>
                                <div><div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'hsl(var(--danger))' }}>{mongoReplication.totalCancelled}</div><div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-dim))' }}>{t('common.cancelled', 'Cancelados')}</div></div>
                            </div>
                        </div>
                    )}

                    {/* Sincronización y Consistencia (Métricas Técnicas) */}
                    {presMetrics && (
                        <div style={{ marginTop: '24px' }}>
                            <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--text-dim))', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <RefreshCcw size={14} /> Sincronización y Consistencia
                            </h4>
                            <div style={{ display: 'grid', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'hsla(var(--warning) / 0.05)', border: '1px solid hsla(var(--warning) / 0.1)', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-dim))' }}>Delay Sincronización:</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--warning))' }}>{presMetrics.sincronizacion.delay}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'hsla(var(--success) / 0.05)', border: '1px solid hsla(var(--success) / 0.1)', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-dim))' }}>Conflictos Resueltos (V. Clock):</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--success))' }}>{presMetrics.sincronizacion.conflictosResueltos} bloqueos</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'hsla(var(--primary) / 0.05)', border: '1px solid hsla(var(--primary) / 0.1)', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-dim))' }}>Estado Global:</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--primary))' }}>{presMetrics.sincronizacion.estadoGlobal}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Datos Operativos y Geográficos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Seat Occupancy & Flight Status */}
                <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-xl)' }}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                        <BarChart3 size={20} color="hsl(var(--primary))" />
                        {t('dashboard.global_distribution', 'Distribución Global de Asientos y Vuelos')}
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                        <ProgressBar label={t('dashboard.sold_pct', 'Vendidos')} count={resumenGlobal.asientosVendidos} total={resumenGlobal.totalAsientos} color="var(--success)" />
                        <ProgressBar label={t('dashboard.reserved_pct', 'Reservados')} count={resumenGlobal.asientosReservados} total={resumenGlobal.totalAsientos} color="var(--warning)" />
                        <ProgressBar label={t('dashboard.available', 'Disponibles')} count={resumenGlobal.asientosDisponibles} total={resumenGlobal.totalAsientos} color="var(--primary)" />
                    </div>
                    
                    {/* Estados de Vuelos */}
                    <div style={{ borderTop: '1px solid hsla(var(--surface-light) / 0.3)', paddingTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', textAlign: 'center' }}>
                        <div><div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'hsl(var(--primary))' }}>{vuelosPorEstado.SCHEDULED || 0}</div><div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-dim))' }}>SCHEDULED</div></div>
                        <div><div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'hsl(var(--danger))' }}>{vuelosPorEstado.DELAYED || 0}</div><div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-dim))' }}>DELAYED</div></div>
                        <div><div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'hsl(var(--danger))' }}>{vuelosPorEstado.CANCELLED || 0}</div><div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-dim))' }}>CANCELLED</div></div>
                        <div><div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'hsl(var(--success))' }}>{vuelosPorEstado.IN_FLIGHT || 0}</div><div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-dim))' }}>IN_FLIGHT</div></div>
                        <div><div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>{vuelosPorEstado.LANDED || 0}</div><div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-dim))' }}>LANDED</div></div>
                    </div>
                </div>

                {/* Ubicación de Compra */}
                {presMetrics && (
                    <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-xl)' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                            <MapPin size={20} color="hsl(var(--success))" />
                            Datos Geográficos (Ubicación de Compra)
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {presMetrics.ubicacionCompra.map((l, i) => {
                                const total = presMetrics.ubicacionCompra.reduce((acc, curr) => acc + curr.count, 0);
                                const pct = ((l.count / total) * 100).toFixed(1);
                                return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '80px', fontSize: '0.85rem', fontWeight: 600 }}>{l.pais}</div>
                                        <div style={{ flex: 1, height: '8px', background: 'hsla(var(--surface-light) / 0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: l.color, borderRadius: '4px' }} />
                                        </div>
                                        <div style={{ width: '60px', fontSize: '0.8rem', color: 'hsl(var(--text-dim))', textAlign: 'right' }}>{pct}%</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Flota y Top Rutas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Gestión de Flota y Pasajeros */}
                {presMetrics && (
                    <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-xl)' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                            <Plane size={20} color="hsl(var(--primary))" />
                            Gestión de Flota y Pasajeros
                        </h3>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ flex: 1, padding: '16px', background: 'hsla(var(--primary) / 0.1)', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'hsl(var(--primary))' }}>{presMetrics.flota.total}</div>
                                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))' }}>Aviones Físicos</div>
                            </div>
                            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                                {presMetrics.flota.modelos.map((m, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                        <span style={{ fontWeight: 600 }}>{m.count}x {m.modelo}</span>
                                        <span style={{ color: 'hsl(var(--success))' }}>Operativo</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Lista de Pasajeros Aleatoria */}
                        <div style={{ borderTop: '1px solid hsla(var(--surface-light) / 0.3)', paddingTop: '20px' }}>
                            <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--text-dim))', marginBottom: '12px' }}>Lista de Pasajeros (Acceso Rápido)</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <tbody>
                                    {presMetrics.pasajeros.map((p, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid hsla(var(--surface-light) / 0.1)' }}>
                                            <td style={{ padding: '8px 0', fontWeight: 600 }}>{p.nombre}</td>
                                            <td style={{ padding: '8px 0', color: 'hsl(var(--text-dim))' }}>{p.pasaporte}</td>
                                            <td style={{ padding: '8px 0', color: 'hsl(var(--text-muted))' }}>{p.asiento}</td>
                                            <td style={{ padding: '8px 0', textAlign: 'right', color: p.estado === 'Confirmado' ? 'hsl(var(--success))' : 'hsl(var(--warning))' }}>{p.estado}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Top Flights by Revenue */}
                {topVuelosPorIngresos && topVuelosPorIngresos.length > 0 && (
                    <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-xl)' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                            <TrendingUp size={20} color="hsl(var(--accent))" />
                            {t('dashboard.top_flights', 'Rutas Más Solicitadas (Demanda)')}
                        </h3>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            {topVuelosPorIngresos.slice(0, 8).map((f, i) => (
                                <div key={i} className="card-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'hsla(var(--surface-light) / 0.4)', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsla(var(--primary) / 0.1)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--primary))' }}>{i + 1}</div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f.origin} <ArrowRight size={14} style={{ display: 'inline' }} /> {f.destination}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))' }}>{f.sold} {t('common.sold', 'vendidos')}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 700, color: 'hsl(var(--accent))' }}>Bs. {f.revenue?.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color, sub }) => (
    <div className="glass card-hover" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '18px' }}>
        <div style={{ padding: '14px', background: `hsla(${color} / 0.1)`, color: `hsl(${color})`, borderRadius: '14px', display: 'flex' }}>{icon}</div>
        <div>
            <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-dim))', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{value}</div>
            {sub && <div style={{ fontSize: '0.7rem', color: `hsl(${color})`, fontWeight: 600 }}>{sub}</div>}
        </div>
    </div>
);

const RevenueRow = ({ label, count, amount, total, color, currency = '$' }) => {
    const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <div>
                    <span style={{ fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))', marginLeft: '8px' }}>({count?.toLocaleString()} boletos)</span>
                </div>
                <span style={{ color: `hsl(${color})`, fontWeight: 700 }}>{currency} {amount?.toLocaleString()} ({pct}%)</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'hsla(var(--surface-light) / 0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: `hsl(${color})`, borderRadius: '4px', transition: 'width 0.6s ease' }} />
            </div>
        </div>
    );
};

const ProgressBar = ({ label, count, total, color }) => {
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    return (
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                <span style={{ color: 'hsl(var(--text-muted))' }}>{label}</span>
                <span style={{ fontWeight: 700 }}>{count?.toLocaleString()} ({pct}%)</span>
            </div>
            <div style={{ width: '100%', height: '10px', background: 'hsla(var(--surface-light) / 0.2)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: `hsl(${color})`, boxShadow: `0 0 12px hsla(${color} / 0.4)`, borderRadius: '5px', transition: 'width 0.8s ease' }} />
            </div>
        </div>
    );
};

const NodeStatus = ({ name, status, icon, t }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'hsla(var(--surface-light) / 0.3)', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', fontWeight: 500 }}>
            <Globe size={16} color="hsl(var(--text-dim))" />
            {name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: status === 'online' ? 'hsl(var(--success))' : 'hsl(var(--warning))', fontSize: '0.8rem', fontWeight: 600 }}>
            {icon}
            {status === 'online' ? t('common.online', 'Online') : t('common.pending', 'Pendiente')}
        </div>
    </div>
);

export default DashboardGlobal;
