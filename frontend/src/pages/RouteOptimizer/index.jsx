import React, { useState } from 'react';
import {
    Map,
    Search,
    Clock,
    DollarSign,
    ArrowRight,
    Navigation,
    CheckCircle2,
    AlertTriangle,
    PlaneTakeoff,
    PlaneLanding,
    List
} from 'lucide-react';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

const RouteOptimizer = () => {
    const { t } = useTranslation();
    const [routeType, setRouteType] = useState('top4'); // top4, tsp
    const [inputs, setInputs] = useState({
        origin: '',
        destination: '',
        via: '' // For TSP
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const [criterion, setCriterion] = useState('cost'); // cost, time

    const handleSolve = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            let data;
            if (routeType === 'tsp') {
                const destinations = [
                    inputs.origin,
                    ...inputs.via.split(',').filter(s => s.trim()).map(s => s.trim()),
                    inputs.destination
                ].filter(Boolean);

                // Si hay pocos destinos, usar búsqueda exacta para mejor resultado
                const useExact = destinations.length <= 5;
                const tspBody = { destinations, criterion };

                if (useExact) {
                    data = await apiFetch('/tsp/solve-exact', { method: 'POST', body: JSON.stringify(tspBody) });
                } else {
                    data = await api.getTSP(tspBody);
                }

                // Normalizar respuesta para la UI
                data.totalCost = criterion === 'cost' ? data.totalDistance : data.summary?.totalCost;
                data.totalTime = criterion === 'time' ? data.totalDistance : data.summary?.totalTime;
            } else {
                if (routeType === 'top4') {
                    const [resCheap, resFast] = await Promise.allSettled([
                        api.getKCheapestRoutes(inputs.origin, inputs.destination, 2),
                        api.getKFastestRoutes(inputs.origin, inputs.destination, 2)
                    ]);
                    
                    const cheapRoutes = resCheap.status === 'fulfilled' && resCheap.value.success ? resCheap.value.routes.map(r => ({ ...r, label: 'Super Económico', color: 'hsl(var(--success))' })) : [];
                    const fastRoutes = resFast.status === 'fulfilled' && resFast.value.success ? resFast.value.routes.map(r => ({ ...r, label: 'Extra Rápido', color: 'hsl(var(--primary))' })) : [];
                    
                    data = { routes: [...cheapRoutes, ...fastRoutes] };
                }
            }
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <header>
                <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>{t('nav.routes')}</h2>
                <p style={{ color: 'hsl(var(--text-muted))' }}>{t('search.subtitle')}</p>
            </header>

            {/* Strategy Selection */}
            <div style={{ display: 'flex', gap: '12px' }}>
                <StrategyButton active={routeType === 'top4'} onClick={() => setRouteType('top4')} icon={<DollarSign size={18} />} label={'Top 4 Opciones'} />
                <StrategyButton active={routeType === 'tsp'} onClick={() => setRouteType('tsp')} icon={<List size={18} />} label={t('routes.tsp')} />
            </div>

            {/* Form */}
            <form onSubmit={handleSolve} className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: routeType === 'tsp' ? '1fr 2fr 1fr' : '1fr 1fr', gap: '20px' }}>
                    <InputGroup label={t('routes.origin')} value={inputs.origin} onChange={(v) => setInputs({ ...inputs, origin: v })} placeholder="Ej: ATL" />

                    {routeType === 'tsp' && (
                        <InputGroup label={t('routes.via')} value={inputs.via} onChange={(v) => setInputs({ ...inputs, via: v })} placeholder="Ej: TYO, LON, DXB" />
                    )}

                    <InputGroup label={t('routes.destination')} value={inputs.destination} onChange={(v) => setInputs({ ...inputs, destination: v })} placeholder="Ej: AMS" />
                </div>

                <button type="submit" className="btn-primary" style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }} disabled={loading}>
                    <Navigation size={20} />
                    <span>{loading ? t('common.loading') : t('routes.calculate')}</span>
                </button>
            </form>

            {/* Results Section */}
            {error && (
                <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--danger))', color: 'hsl(var(--danger))', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertTriangle size={20} />
                    <span>Error: {error}</span>
                </div>
            )}

            {result && routeType === 'top4' && result.routes && (
                <div className="animate-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                    {result.routes.map((r, i) => (
                        <div key={i} className="glass" style={{ padding: '30px', borderRadius: 'var(--radius-xl)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: r.color }}></div>
                            <div style={{ position: 'absolute', top: '15px', right: '20px', fontSize: '0.75rem', fontWeight: 'bold', background: r.color, color: 'white', padding: '4px 12px', borderRadius: '12px' }}>
                                {r.label}
                            </div>
                            
                            <h3 style={{ marginBottom: '20px' }}>Opción #{i + 1}</h3>
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                                <div style={{ flex: 1 }}><MetricCard label="Costo del Vuelo" value={`$${r.totalCost || 0}`} color="var(--accent)" /></div>
                                <div style={{ flex: 1 }}><MetricCard label="Tiempo del Vuelo" value={`${r.totalTime || 0} min`} color="var(--primary)" /></div>
                            </div>
                            
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-dim))', marginBottom: '16px', fontWeight: 'bold' }}>ESCALAS ( {r.path?.length - 1 || 0} Paradas )</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                                    {r.path?.map((node, idx) => (
                                        <React.Fragment key={idx}>
                                            <div style={{ padding: '8px 16px', background: 'hsla(var(--bg-main)/0.5)', borderRadius: '20px', border: `1px solid ${r.color}`, fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                {node}
                                            </div>
                                            {idx < r.path.length - 1 && <ArrowRight size={16} color="hsl(var(--text-muted))" />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {result && routeType !== 'top4' && !result.routes && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        <MetricCard label="Costo Total" value={`$${result.totalCost || 0}`} color="var(--accent)" />
                        <MetricCard label="Tiempo Total" value={`${result.totalTime || 0} min`} color="var(--primary)" />
                        <MetricCard label="Escalas" value={result.path?.length - 1 || 0} color="var(--success)" />
                    </div>

                    <div className="glass" style={{ padding: '40px', borderRadius: 'var(--radius-xl)' }}>
                        <h3 style={{ marginBottom: '40px', textAlign: 'center' }}>Itinerario Calculado</h3>

                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                            {result.path?.map((node, idx) => (
                                <React.Fragment key={idx}>
                                    <div style={{ padding: '10px 20px', background: 'hsla(var(--primary)/0.1)', borderRadius: '20px', border: '1px solid hsla(var(--primary)/0.4)', fontWeight: 'bold' }}>
                                        {node}
                                    </div>
                                    {idx < result.path.length - 1 && <ArrowRight size={16} color="hsl(var(--text-muted))" />}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StrategyButton = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={active ? 'btn-primary' : 'glass card-hover'} style={{
        flex: 1,
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        border: active ? 'none' : '1px solid hsl(var(--border))',
        background: active ? undefined : 'transparent',
        color: active ? 'white' : 'hsl(var(--text-muted))'
    }}>
        {icon}
        <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{label}</span>
    </button>
);

const InputGroup = ({ label, value, onChange, placeholder }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-dim))', marginLeft: '4px', textTransform: 'uppercase' }}>{label}</label>
        <input
            type="text"
            className="input-main"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            placeholder={placeholder}
        />
    </div>
);

const MetricCard = ({ label, value, color }) => (
    <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', borderLeft: `4px solid ${color}` }}>
        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))', fontWeight: 'bold', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{value}</div>
    </div>
);

export default RouteOptimizer;
