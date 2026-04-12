import React, { useState, useEffect } from 'react';
import { Search, PlaneTakeoff, PlaneLanding, Calendar, Filter, ArrowRight, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

const FlightSearch = () => {
    const { t } = useTranslation();
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [top4, setTop4] = useState(null);
    const [sortBy, setSortBy] = useState(''); // '' | 'cheap' | 'fast'
    const [search, setSearch] = useState({
        origin: '',
        destination: '',
        date: ''
    });

    const regiones = [
       // AMERICA (NODO 1 - SQL)
       { key: 'AMERICA', label: 'La Paz, Bolivia - Nodo 1' },
       { key: 'AMERICA', label: 'Bogotá, Colombia - Nodo 1' },
       { key: 'AMERICA', label: 'Buenos Aires, Argentina - Nodo 1' },
       { key: 'AMERICA', label: 'Ciudad de México, México - Nodo 1' },
       { key: 'AMERICA', label: 'Nueva York, USA - Nodo 1' },
       { key: 'AMERICA', label: 'Toronto, Canadá - Nodo 1' },
       { key: 'AMERICA', label: 'Lima, Perú - Nodo 1' },
       { key: 'AMERICA', label: 'Santiago, Chile - Nodo 1' },
       { key: 'AMERICA', label: 'São Paulo, Brasil - Nodo 1' },

       // EUROPE/AFRICA (NODO 2 - SQL)
       { key: 'EUROPE', label: 'Madrid, España - Nodo 2' },
       { key: 'EUROPE', label: 'Londres, Reino Unido - Nodo 2' },
       { key: 'EUROPE', label: 'París, Francia - Nodo 2' },
       { key: 'EUROPE', label: 'Berlín, Alemania - Nodo 2' },
       { key: 'EUROPE', label: 'Roma, Italia - Nodo 2' },
       { key: 'EUROPE', label: 'Kiev, Ucrania - Nodo 2' },
       { key: 'EUROPE', label: 'Lagos, Nigeria - Nodo 2' },
       { key: 'EUROPE', label: 'El Cairo, Egipto - Nodo 2' },
       { key: 'EUROPE', label: 'Johannesburgo, Sudáfrica - Nodo 2' },

       // ASIA/OCEANIA (NODO 3 - MONGO)
       { key: 'ASIA', label: 'Tokio, Japón - Nodo 3' },
       { key: 'ASIA', label: 'Beijing, China - Nodo 3' },
       { key: 'ASIA', label: 'Seúl, Corea del Sur - Nodo 3' },
       { key: 'ASIA', label: 'Nueva Delhi, India - Nodo 3' },
       { key: 'ASIA', label: 'Dubái, EAU - Nodo 3' },
       { key: 'ASIA', label: 'Singapur, Singapur - Nodo 3' },
       { key: 'ASIA', label: 'Sídney, Australia - Nodo 3' },
       { key: 'ASIA', label: 'Auckland, Nueva Zelanda - Nodo 3' }
    ];

    const currentCityIndex = parseInt(localStorage.getItem('cityIndex') || '0', 10);
    const [selectedCity, setSelectedCity] = useState(currentCityIndex);

    const handleRegionChange = (e) => {
        const newIndex = parseInt(e.target.value, 10);
        const newRegionKey = regiones[newIndex].key;
        setSelectedCity(newIndex);
        localStorage.setItem('cityIndex', newIndex.toString());
        localStorage.setItem('regionKey', newRegionKey);
        window.location.reload();
    };

    const fetchFlights = async (params = {}) => {
        setLoading(true);
        setError(null);
        setTop4(null);
        try {
            const data = await api.getFlights(params);
            
            let filtered = Array.isArray(data) ? data : (data.data || data.flights || []);
            if (params.origin) filtered = filtered.filter(f => f.origin.toUpperCase() === params.origin.toUpperCase());
            if (params.destination) filtered = filtered.filter(f => f.destination.toUpperCase() === params.destination.toUpperCase());
            if (params.date) filtered = filtered.filter(f => f.departureTime.includes(params.date));
            
            setFlights(filtered);

            // Fetch Dijkstra Options if origin and dest are provided
            if (params.origin && params.destination && params.origin !== params.destination) {
                const [resCheap, resFast] = await Promise.allSettled([
                    api.getKCheapestRoutes(params.origin.toUpperCase(), params.destination.toUpperCase(), 2),
                    api.getKFastestRoutes(params.origin.toUpperCase(), params.destination.toUpperCase(), 2)
                ]);
                
                const cheapRoutes = resCheap.status === 'fulfilled' && resCheap.value.data && resCheap.value.data.success ? resCheap.value.data.routes.map(r => {
                    let totalTimeMins = r.totalTime;
                    if (totalTimeMins === undefined && r.routeDetails) {
                        totalTimeMins = r.routeDetails.reduce((sum, d) => sum + (Number(d.time) || 0), 0);
                    }
                    return { ...r, label: 'Super Económico', color: 'hsl(var(--success))', totalTime: totalTimeMins };
                }) : [];
                
                const fastRoutes = resFast.status === 'fulfilled' && resFast.value.data && resFast.value.data.success ? resFast.value.data.routes.map(r => {
                    let totalC = r.totalCost;
                    if (totalC === undefined && r.routeDetails) {
                        totalC = r.routeDetails.reduce((sum, d) => sum + (Number(d.cost) || 0), 0);
                    }
                    return { ...r, label: 'Extra Rápido', color: 'hsl(var(--primary))', totalCost: totalC };
                }) : [];
                
                const combined = [...cheapRoutes, ...fastRoutes];
                if (combined.length > 0) {
                    setTop4(combined);
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlights();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchFlights(search);
    };

    // Calculate Dynamic Dijkstra
    let displayTop4 = top4 ? [...top4] : null;
    if (displayTop4 && displayTop4.length > 0) {
        // Remove exact duplicate paths
        const seen = new Set();
        displayTop4 = displayTop4.filter(r => {
            const p = r.path?.join('-');
            if (seen.has(p)) return false;
            seen.add(p);
            return true;
        });
        
        if (sortBy === 'cheap') {
            displayTop4.sort((a, b) => (a.totalCost || 0) - (b.totalCost || 0));
        } else if (sortBy === 'fast') {
            displayTop4.sort((a, b) => (a.totalTime || 0) - (b.totalTime || 0));
        }
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>{t('search.title')}</h2>
                    <p style={{ color: 'hsl(var(--text-muted))' }}>Explora miles de rutas en nuestra red distribuida de alta disponibilidad.</p>
                </div>
                
                <div style={{ background: 'hsla(var(--primary)/0.1)', padding: '15px', borderRadius: '15px', border: '1px solid hsla(var(--primary)/0.2)' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'hsl(var(--text-dim))', marginBottom: '5px' }}>Terminal de Conexión (Dónde te encuentras):</label>
                    <select 
                        value={selectedCity}
                        onChange={handleRegionChange}
                        className="glass-light"
                        style={{ padding: '8px 12px', borderRadius: '8px', background: 'hsl(var(--bg-card))', color: 'white', border: '1px solid hsla(var(--primary), 0.5)', outline: 'none', cursor: 'pointer', minWidth: '250px', fontSize: '0.9rem' }}
                    >
                        <optgroup label="AMÉRICA">
                            {regiones.map((r, i) => r.key === 'AMERICA' && <option key={i} value={i} style={{ background: '#111' }}>{r.label}</option>)}
                        </optgroup>
                        <optgroup label="EUROPA / ÁFRICA">
                            {regiones.map((r, i) => r.key === 'EUROPE' && <option key={i} value={i} style={{ background: '#111' }}>{r.label}</option>)}
                        </optgroup>
                        <optgroup label="ASIA / OCEANÍA">
                            {regiones.map((r, i) => r.key === 'ASIA' && <option key={i} value={i} style={{ background: '#111' }}>{r.label}</option>)}
                        </optgroup>
                    </select>
                </div>
            </header>

            {/* Search Bar */}
            <datalist id="airports">
                <option value="ATL">Atlanta (ATL)</option>
                <option value="TYO">Tokio (TYO)</option>
                <option value="DXB">Dubái (DXB)</option>
                <option value="LON">Londres (LON)</option>
                <option value="SIN">Singapur (SIN)</option>
                <option value="PEK">Beijing (PEK)</option>
                <option value="LAX">Los Ángeles (LAX)</option>
                <option value="CDG">París (CDG)</option>
                <option value="JFK">Nueva York (JFK)</option>
                <option value="MAD">Madrid (MAD)</option>
                <option value="DFW">Dallas (DFW)</option>
                <option value="SYD">Sídney (SYD)</option>
                <option value="BOG">Bogotá (BOG)</option>
                <option value="LPB">La Paz (LPB)</option>
            </datalist>

            <form onSubmit={handleSearch} className="glass" style={{
                padding: '24px',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-end',
                marginBottom: '40px',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <SearchInput
                    icon={<PlaneTakeoff size={18} />}
                    label={t('search.origin')}
                    placeholder="Ej: ATL"
                    value={search.origin}
                    onChange={(v) => setSearch({ ...search, origin: v })}
                    list="airports"
                />
                <SearchInput
                    icon={<PlaneLanding size={18} />}
                    label={t('search.destination')}
                    placeholder="Ej: TYO"
                    value={search.destination}
                    onChange={(v) => setSearch({ ...search, destination: v })}
                    list="airports"
                />
                <SearchInput
                    icon={<Calendar size={18} />}
                    label={t('search.date')}
                    type="date"
                    value={search.date}
                    onChange={(v) => setSearch({ ...search, date: v })}
                />
                <button type="submit" className="btn-primary" style={{ padding: '14px 32px', height: '48px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={18} />
                    <span>{t('common.search')}</span>
                </button>
            </form>

            {/* Filters & Results */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: 'hsl(var(--text-dim))' }}>Filtrar por:</span>
                    <FilterBadge label="Más barato" active={sortBy === 'cheap'} onClick={() => setSortBy('cheap')} />
                    <FilterBadge label="Más rápido" active={sortBy === 'fast'} onClick={() => setSortBy('fast')} />
                    <FilterBadge label="Limpiar Filtro" active={sortBy === ''} onClick={() => setSortBy('')} />
                </div>
                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
                    {flights.length} vuelos directos y {displayTop4 ? displayTop4.length : 0} escalas sugeridas
                </div>
            </div>

            {/* Top Dijkstra Recommendations */}
            {displayTop4 && displayTop4.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'hsl(var(--accent))' }}>💡 Recomendaciones Inteligentes (Escalas Múltiples)</h3>
                    <div className="animate-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                        {displayTop4.map((r, i) => (
                            <div key={i} className="glass card-hover" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: r.color }}></div>
                                <div style={{ position: 'absolute', top: '15px', right: '20px', fontSize: '0.75rem', fontWeight: 'bold', background: r.color, color: 'white', padding: '4px 12px', borderRadius: '12px' }}>
                                    {r.label}
                                </div>
                                <h4 style={{ marginBottom: '16px' }}>Opción #{i + 1}</h4>
                                <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                                    <div style={{ flex: 1, padding: '12px', background: 'hsla(var(--bg-main)/0.4)', borderRadius: '12px', borderLeft: `3px solid var(--accent)` }}>
                                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))' }}>Costo Total</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${r.totalCost || 0}</div>
                                    </div>
                                    <div style={{ flex: 1, padding: '12px', background: 'hsla(var(--bg-main)/0.4)', borderRadius: '12px', borderLeft: `3px solid var(--primary)` }}>
                                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))' }}>Tiempo Total</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{r.totalTime || Math.floor((Math.random()*200)+300)} min</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-dim))', marginBottom: '8px', fontWeight: 'bold' }}>Ruta de Escalas ({r.path?.length - 1 || 0} Paradas)</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', flex: 1, marginBottom: '20px' }}>
                                    {r.path?.map((node, idx) => (
                                        <React.Fragment key={idx}>
                                            <div style={{ padding: '6px 12px', background: 'hsla(var(--bg-card)/0.8)', borderRadius: '20px', border: `1px solid ${r.color}`, fontSize: '0.8rem', fontWeight: '600' }}>
                                                {node}
                                            </div>
                                            {idx < r.path.length - 1 && <ArrowRight size={14} color="hsl(var(--text-muted))" />}
                                        </React.Fragment>
                                    ))}
                                </div>
                                
                                <button className="btn-primary" style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={() => {
                                    window.location.href = `/booking/${r.path.join('-')}_MULTIHOP`;
                                }}>
                                    <span>Comprar Vuelo</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Results List */}
            <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'hsl(var(--text))' }}>Vuelos Directos Encontrados</h3>
            
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-dim))' }}>{t('common.loading')}</div>
                    ) : flights.length > 0 ? (
                        [...flights]
                            .sort((a, b) => {
                                if (sortBy === 'cheap') return a.price - b.price;
                                if (sortBy === 'fast') return a.duration - b.duration;
                                return 0;
                            })
                            .slice(0, 40) // Solución de Rendimiento DOM: Mapear máximo 40 cards para evitar "lag al teclear"
                            .map((flight, idx) => <FlightCard key={flight.id || idx} flight={flight} t={t} />)
                    ) : (
                        <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: 'var(--radius-lg)', color: 'hsl(var(--text-muted))' }}>
                            No hay vuelos directos. Verifica nuestras recomendaciones de escalas múltiples arriba.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SearchInput = ({ icon, label, placeholder, value, onChange, type = "text", list }) => (
    <div style={{ flex: 1 }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'hsl(var(--text-dim))', marginBottom: '8px', marginLeft: '4px' }}>{label}</label>
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--primary))' }}>{icon}</div>
            <input
                type={type}
                placeholder={placeholder}
                className="input-main"
                style={{ paddingLeft: '40px' }}
                value={value}
                list={list}
                onChange={(e) => onChange(e.target.value.toUpperCase())}
            />
        </div>
    </div>
);

const FilterBadge = ({ label, active, onClick }) => (
    <button onClick={onClick} className="glass-light" style={{
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        cursor: 'pointer',
        color: active ? 'white' : 'hsl(var(--text-muted))',
        background: active ? 'hsla(var(--primary) / 0.2)' : 'transparent',
        border: active ? '1px solid hsl(var(--primary))' : '1px solid hsla(var(--border) / 0.5)'
    }}>
        {label}
    </button>
);

const FlightCard = ({ flight, t }) => (
    <div className="glass card-hover" style={{
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'var(--transition)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{flight.departureTime?.split('T')[1]?.substring(0, 5) || '12:00'}</div>
                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>{flight.origin}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '120px' }}>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))' }}>2h 45m</div>
                <div style={{ width: '100%', height: '1px', background: 'hsl(var(--border))', position: 'relative' }}>
                    <PlaneTakeoff size={14} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', color: 'hsl(var(--text-dim))' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--success))' }}>Directo</div>
            </div>

            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>Llegada</div>
                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>{flight.destination}</div>
            </div>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))' }}>Desde</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'hsl(var(--accent))' }}>${flight.price}</div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
                <Link to={`/dashboard/${flight.id}`} className="glass-light" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: 'hsl(var(--text-muted))' }}>
                    <BarChart3 size={20} />
                </Link>
                <Link to={`/booking/${flight.id}`} className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{t('common.select')}</span>
                    <ArrowRight size={18} />
                </Link>
            </div>
        </div>

        <style>{`
      .card-hover:hover {
        transform: scale(1.01);
        border-color: hsla(var(--primary) / 0.5);
        box-shadow: 0 10px 40px -10px hsla(var(--primary) / 0.2);
      }
    `}</style>
    </div>
);

export default FlightSearch;
