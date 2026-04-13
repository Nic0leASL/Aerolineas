import React, { useState, useEffect } from 'react';
import { Search, PlaneTakeoff, PlaneLanding, Calendar, Filter, ArrowRight, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

const FlightSearch = () => {
    const { t } = useTranslation();
    const [flights, setFlights] = useState([]);
    const [allEdges, setAllEdges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [top4, setTop4] = useState(null);
    const [remainingRoutes, setRemainingRoutes] = useState([]);
    const [sameDayFlights, setSameDayFlights] = useState([]);
    const [otherDayFlights, setOtherDayFlights] = useState([]);
    const [search, setSearch] = useState({
        origin: '',
        destination: '',
        date: ''
    });

    const regiones = [
        { key: 'AMERICA', label: 'La Paz, Bolivia - Nodo 1' },
        { key: 'AMERICA', label: 'Bogotá, Colombia - Nodo 1' },
        { key: 'AMERICA', label: 'Buenos Aires, Argentina - Nodo 1' },
        { key: 'AMERICA', label: 'Ciudad de México, México - Nodo 1' },
        { key: 'AMERICA', label: 'Nueva York, USA - Nodo 1' },
        { key: 'AMERICA', label: 'Toronto, Canadá - Nodo 1' },
        { key: 'AMERICA', label: 'Lima, Perú - Nodo 1' },
        { key: 'AMERICA', label: 'Santiago, Chile - Nodo 1' },
        { key: 'AMERICA', label: 'São Paulo, Brasil - Nodo 1' },
        { key: 'EUROPE', label: 'Madrid, España - Nodo 2' },
        { key: 'EUROPE', label: 'Londres, Reino Unido - Nodo 2' },
        { key: 'EUROPE', label: 'París, Francia - Nodo 2' },
        { key: 'EUROPE', label: 'Berlín, Alemania - Nodo 2' },
        { key: 'EUROPE', label: 'Roma, Italia - Nodo 2' },
        { key: 'EUROPE', label: 'Kiev, Ucrania - Nodo 2' },
        { key: 'EUROPE', label: 'Lagos, Nigeria - Nodo 2' },
        { key: 'EUROPE', label: 'El Cairo, Egipto - Nodo 2' },
        { key: 'EUROPE', label: 'Johannesburgo, Sudáfrica - Nodo 2' },
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
        setRemainingRoutes([]);
        setFlights([]);
        setSameDayFlights([]);
        setOtherDayFlights([]);
        try {
            // Traer todos los vuelos de este origen→destino (sin filtrar fecha en el API)
            const fetchParams = { ...params };
            delete fetchParams.date; // Quitamos date para traer TODOS los vuelos de la ruta
            const data = await api.getFlights(fetchParams);

            let allFiltered = Array.isArray(data) ? data : (data.data || data.flights || []);
            if (params.origin) allFiltered = allFiltered.filter(f => f.origin?.toUpperCase() === params.origin.toUpperCase());
            if (params.destination) allFiltered = allFiltered.filter(f => f.destination?.toUpperCase() === params.destination.toUpperCase());

            setFlights(allFiltered);

            // Separar por fecha si el usuario eligió un día específico
            if (params.date) {
                const sameDay = allFiltered.filter(f => f.departureTime && f.departureTime.startsWith(params.date));
                const otherDays = allFiltered.filter(f => !f.departureTime || !f.departureTime.startsWith(params.date));
                setSameDayFlights(sameDay);
                setOtherDayFlights(otherDays);
            } else {
                setSameDayFlights([]);
                setOtherDayFlights(allFiltered);
            }

            // Usado solo para calcular el vuelo directo del Top4
            const filtered = params.date
                ? allFiltered.filter(f => f.departureTime && f.departureTime.startsWith(params.date))
                : allFiltered;

            // Fetch Dijkstra Options if origin and dest are provided
            if (params.origin && params.destination && params.origin !== params.destination) {
                const [resCheap, resFast] = await Promise.allSettled([
                    api.getKCheapestRoutes(params.origin.toUpperCase(), params.destination.toUpperCase(), 15),
                    api.getKFastestRoutes(params.origin.toUpperCase(), params.destination.toUpperCase(), 15)
                ]);

                let cheapRoutes = resCheap.status === 'fulfilled' && resCheap.value.data && resCheap.value.data.success ? resCheap.value.data.routes : [];
                let fastRoutes = resFast.status === 'fulfilled' && resFast.value.data && resFast.value.data.success ? resFast.value.data.routes : [];

                const all = [];

                // 1. Un vuelo directo (si existe en los vuelos simples filtrados)
                if (filtered && filtered.length > 0) {
                    const bestDirect = [...filtered].sort((a, b) => a.price - b.price)[0];
                    all.push({
                        id: bestDirect.flightId || bestDirect.id,
                        isDirect: true,
                        label: t('search.direct_flight', '✈️ Vuelo Directo'),
                        color: 'hsl(var(--success))',
                        path: [bestDirect.origin, bestDirect.destination],
                        totalCost: bestDirect.price,
                        totalTime: bestDirect.duration || 180,
                        original_flight: bestDirect
                    });
                }

                const seenPaths = new Set(all.map(x => x.path.join('-')));

                const addRoute = (route, fallbackLabel, color) => {
                    const p = route.path.join('-');
                    if (!seenPaths.has(p)) {
                        seenPaths.add(p);
                        const cost = route.totalCost || (route.routeDetails && route.routeDetails.reduce((sum, d) => sum + (Number(d.cost) || 0), 0)) || 0;
                        const time = route.totalTime || (route.routeDetails && route.routeDetails.reduce((sum, d) => sum + (Number(d.time) || 0), 0)) || 0;
                        all.push({
                            id: `${p}_MULTIHOP`,
                            isDirect: route.path.length === 2,
                            label: route.path.length === 2 ? t('search.direct_flight', '✈️ Vuelo Directo') : fallbackLabel,
                            color: color,
                            path: route.path,
                            totalCost: cost,
                            totalTime: time,
                            route: route
                        });
                    }
                };

                // 2. El más rápido de acuerdo al tiempo
                const sortedFast = [...fastRoutes].sort((a, b) => a.totalTime - b.totalTime);
                for (const r of sortedFast) {
                    addRoute(r, t('search.extra_fast', '⚡ Más Rápido'), 'hsl(var(--primary))');
                }

                // 3. Escalas (Mejor precio)
                const sortedCheap = [...cheapRoutes].sort((a, b) => a.totalCost - b.totalCost);
                for (const r of sortedCheap) {
                    addRoute(r, t('search.super_cheap', '💰 Menor Costo (Escalas)'), 'hsl(var(--accent))');
                }

                // Sort overall options by best combination (cheap and not too slow)
                const bestAll = all.slice(0, 4); // Top 4 as Smart Options
                const remainder = all.slice(4, 20); // Get up to ~15-20 more alternatives

                if (bestAll.length > 3 && !bestAll[3].label.includes("✈️")) {
                    bestAll[3].label = "🌟 " + t('search.extra_option', 'Opción Extra');
                    bestAll[3].color = "#a855f7"; 
                }

                setTop4(bestAll);
                setRemainingRoutes(remainder);
            } else {
                setTop4(null);
                setRemainingRoutes([]);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch all edges once on mount to build the topology graph for the dropdown
        api.getFlights().then(data => {
            const list = Array.isArray(data) ? data : (data.data || data.flights || []);
            setAllEdges(list);
        }).catch(err => {
            console.error("Error fetching topology edges: ", err);
        });
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchFlights(search);
    };

    // Calculate visual
    const displayTop4 = top4 ? [...top4] : null;

    const AIRPORTS = [
        { value: '', label: 'Seleccionar...' },
        { value: 'ATL', label: 'Atlanta (ATL)' },
        { value: 'TYO', label: 'Tokio (TYO)' },
        { value: 'DXB', label: 'Dubái (DXB)' },
        { value: 'LON', label: 'Londres (LON)' },
        { value: 'SIN', label: 'Singapur (SIN)' },
        { value: 'PEK', label: 'Beijing (PEK)' },
        { value: 'LAX', label: 'Los Ángeles (LAX)' },
        { value: 'CDG', label: 'París (CDG)' },
        { value: 'JFK', label: 'Nueva York (JFK)' },
        { value: 'MAD', label: 'Madrid (MAD)' },
        { value: 'DFW', label: 'Dallas (DFW)' },
        { value: 'SYD', label: 'Sídney (SYD)' },
        { value: 'BOG', label: 'Bogotá (BOG)' },
        { value: 'LPB', label: 'La Paz (LPB)' }
    ];

    // Compute reachable airports using BFS
    const getReachableDestinations = () => {
        if (!search.origin || allEdges.length === 0) return AIRPORTS;

        const graph = {};
        allEdges.forEach(f => {
            if (!graph[f.origin]) graph[f.origin] = new Set();
            graph[f.origin].add(f.destination);
        });

        const visited = new Set([search.origin]);
        const queue = [search.origin];

        while (queue.length > 0) {
            const curr = queue.shift();
            if (graph[curr]) {
                for (const next of graph[curr]) {
                    if (!visited.has(next)) {
                        visited.add(next);
                        queue.push(next);
                    }
                }
            }
        }

        visited.delete(search.origin); // Prevent picking exact same origin-destination
        return AIRPORTS.filter(a => a.value === '' || visited.has(a.value));
    };

    const destinationOptions = getReachableDestinations();

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>{t('search.title')}</h2>
                    <p style={{ color: 'hsl(var(--text-muted))' }}>{t('search.subtitle')}</p>
                </div>

                <div style={{ background: 'hsla(var(--primary)/0.1)', padding: '15px', borderRadius: '15px', border: '1px solid hsla(var(--primary)/0.2)' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'hsl(var(--text-dim))', marginBottom: '5px' }}>{t('search.connection_terminal')}:</label>
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

            <form onSubmit={handleSearch} className="glass" style={{
                padding: '24px',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-end',
                marginBottom: '40px',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <SelectInput
                    icon={<PlaneTakeoff size={18} />}
                    label={t('search.origin')}
                    options={AIRPORTS}
                    value={search.origin}
                    onChange={(v) => setSearch({ ...search, origin: v, destination: '' })} // Reset dest if origin changes
                />
                <SelectInput
                    icon={<PlaneLanding size={18} />}
                    label={t('search.destination')}
                    options={destinationOptions}
                    value={search.destination}
                    onChange={(v) => setSearch({ ...search, destination: v })}
                />
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'hsl(var(--text-dim))', marginBottom: '8px', marginLeft: '4px' }}>{t('search.date')}</label>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--primary))' }}><Calendar size={18} /></div>
                        <input
                            type="date"
                            className="input-main glass"
                            style={{ paddingLeft: '40px', width: '100%', outline: 'none' }}
                            value={search.date}
                            onChange={(e) => setSearch({ ...search, date: e.target.value })}
                        />
                    </div>
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '14px 32px', height: '48px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={18} />
                    <span>{t('common.search')}</span>
                </button>
            </form>

            {loading && <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-dim))' }}>{t('common.loading')}</div>}

            {/* Smart 4 Options */}
            {!loading && displayTop4 && displayTop4.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'hsl(var(--accent))' }}>💡 Opciones Inteligentes Encontradas</h3>

                    <div className="animate-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                        {displayTop4.map((r, i) => (
                            <div key={i} className="glass card-hover" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: r.color }}></div>
                                <div style={{ position: 'absolute', top: '15px', right: '20px', fontSize: '0.75rem', fontWeight: 'bold', background: r.color, color: 'white', padding: '4px 12px', borderRadius: '12px' }}>
                                    {r.label}
                                </div>
                                <h4 style={{ marginBottom: '16px' }}>{t('search.option')} #{i + 1}</h4>
                                <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                                    <div style={{ flex: 1, padding: '12px', background: 'hsla(var(--bg-main)/0.4)', borderRadius: '12px', borderLeft: `3px solid var(--accent)` }}>
                                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))' }}>{t('search.total_cost')}</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${Number(r.totalCost || 0).toFixed(2)}</div>
                                    </div>
                                    <div style={{ flex: 1, padding: '12px', background: 'hsla(var(--bg-main)/0.4)', borderRadius: '12px', borderLeft: `3px solid var(--primary)` }}>
                                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))' }}>{t('search.total_time')}</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{r.totalTime || Math.floor((Math.random() * 200) + 300)} min</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-dim))', marginBottom: '8px', fontWeight: 'bold' }}>{t('search.layover_route', 'Ruta')} ({Math.max(0, (r.path?.length || 2) - 2)} {t('search.stops', 'Escalas')})</div>
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
                                    <span>{t('search.buy_flight')}</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Opciones Multiples Adicionales (después del top 4) */}
            {!loading && remainingRoutes && remainingRoutes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'hsl(var(--text))' }}>✈️ {t('search.other_flights', 'Otras Rutas Disponibles')} ({remainingRoutes.length})</h3>
                    {remainingRoutes.map((route, idx) => (
                        <div key={idx} className="glass card-hover" style={{
                            padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'var(--transition)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>10:00</div>
                                    <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>{route.path[0]}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '150px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))' }}>{route.totalTime || 300} min</div>
                                    <div style={{ width: '100%', height: '1px', background: 'hsl(var(--border))', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                                         <div style={{ position: 'absolute', top: -5, left: 0, right: 0, display: 'flex', justifyContent: 'space-around' }}>
                                             {route.path.slice(1, -1).map((hop, hIdx) => (
                                                 <div key={hIdx} style={{ width: 8, height: 8, background: 'hsl(var(--primary))', borderRadius: '50%' }}></div>
                                             ))}
                                         </div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: route.path.length === 2 ? 'hsl(var(--success))' : 'hsl(var(--warning))' }}>
                                        {route.path.length === 2 ? t('common.direct') : `${route.path.length - 2} Escalas`}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{t('search.arrival')}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>{route.path[route.path.length - 1]}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))' }}>{t('search.total_cost')}</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'hsl(var(--text))' }}>${Number(route.totalCost || 0).toFixed(2)}</div>
                                </div>
                                <Link to={`/booking/${route.path.join('-')}_MULTIHOP`} className="btn-primary glass" style={{ backgroundColor: 'hsla(var(--primary)/0.2)', color: 'hsl(var(--primary))', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{t('common.select')}</span>
                                    <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Vuelos del día seleccionado */}
            {!loading && sameDayFlights.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '1.2rem', color: 'hsl(var(--success))' }}>
                            🗓️ Vuelos Disponibles el {search.date} ({sameDayFlights.length} vuelo{sameDayFlights.length !== 1 ? 's' : ''})
                        </h3>
                        <span style={{ background: 'hsla(var(--success)/0.15)', color: 'hsl(var(--success))', borderRadius: '12px', padding: '2px 12px', fontSize: '0.8rem', fontWeight: 'bold' }}>HOY</span>
                    </div>
                    {sameDayFlights.map(flight => (
                        <FlightCard key={flight.id || flight.flightId} flight={flight} t={t} />
                    ))}
                </div>
            )}

            {/* Vuelos de otros días */}
            {!loading && otherDayFlights.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'hsl(var(--text-muted))', marginBottom: '8px' }}>
                        📅 Vuelos en Otras Fechas Disponibles ({otherDayFlights.length} vuelo{otherDayFlights.length !== 1 ? 's' : ''})
                    </h3>
                    {otherDayFlights.map(flight => (
                        <FlightCard key={flight.id || flight.flightId} flight={flight} t={t} />
                    ))}
                </div>
            )}

            {/* Regular Flights List (when no origin+dest pair is selected) */}
            {!loading && flights.length > 0 && (!displayTop4 || displayTop4.length === 0) && sameDayFlights.length === 0 && otherDayFlights.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'hsl(var(--text))' }}>✈️ {t('search.flights_found', 'Vuelos Encontrados')}</h3>
                    {flights.map(flight => (
                        <FlightCard key={flight.id || flight.flightId} flight={flight} t={t} />
                    ))}
                </div>
            )}

            {/* Empty state when absolutely nothing was found */}
            {!loading && flights.length === 0 && (!displayTop4 || displayTop4.length === 0) && (
                <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: 'var(--radius-lg)', color: 'hsl(var(--text-muted))' }}>
                    {search.origin && search.destination
                        ? "No encontramos rutas para este origen y destino."
                        : "Por favor, selecciona Origen y Destino de las opciones bloqueadas, y luego presiona Buscar. O busca todos los vuelos para una fecha."}
                </div>
            )}
        </div>
    );
};

const SelectInput = ({ icon, label, value, onChange, options }) => (
    <div style={{ flex: 1 }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'hsl(var(--text-dim))', marginBottom: '8px', marginLeft: '4px' }}>{label}</label>
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--primary))' }}>{icon}</div>
            <select
                className="input-main glass"
                style={{ paddingLeft: '40px', width: '100%', appearance: 'none', cursor: 'pointer', background: 'hsl(var(--bg-card))', outline: 'none' }}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map((opt, idx) => (
                    <option key={idx} value={opt.value} style={{ background: '#111', color: '#fff' }}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'hsl(var(--text-muted))' }}>
                ▼
            </div>
        </div>
    </div>
);



const FlightCard = ({ flight, t }) => {
    const depDate = flight.departureTime ? new Date(flight.departureTime) : null;
    const depTimeStr = depDate ? depDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—';
    const depDateStr = depDate
        ? depDate.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
        : null;

    return (
        <div className="glass card-hover" style={{
            padding: '20px 24px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'var(--transition)',
            gap: '16px'
        }}>
            {/* Fecha badge */}
            {depDateStr && (
                <div style={{ minWidth: '90px', textAlign: 'center', background: 'hsla(var(--primary)/0.1)', borderRadius: '10px', padding: '8px', border: '1px solid hsla(var(--primary)/0.2)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-dim))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'hsl(var(--primary))', lineHeight: 1.2, marginTop: '2px' }}>{depDateStr}</div>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
                {/* Origen */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>{depTimeStr}</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'hsl(var(--primary))' }}>{flight.origin}</div>
                </div>

                {/* Línea central */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1, minWidth: '100px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-dim))' }}>{flight.duration ? `${flight.duration} min` : 'Directo'}</div>
                    <div style={{ width: '100%', height: '2px', background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))', borderRadius: '2px', position: 'relative' }}>
                        <PlaneTakeoff size={13} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -60%)', color: 'white', background: 'hsl(var(--bg-card))', borderRadius: '50%', padding: '1px' }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'hsl(var(--success))', fontWeight: '600' }}>{t('common.direct')}</div>
                </div>

                {/* Destino */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>—</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'hsl(var(--accent))' }}>{flight.destination}</div>
                </div>
            </div>

            {/* Precio y acciones */}
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-dim))', textTransform: 'uppercase' }}>{t('search.from')}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'hsl(var(--accent))' }}>
                        ${typeof flight.price === 'number' ? flight.price.toFixed(2) : (flight.economyPrice || flight.price || '850.00')}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to={`/dashboard/${flight.id}`} className="glass-light" style={{ padding: '10px', borderRadius: 'var(--radius-md)', color: 'hsl(var(--text-muted))' }}>
                        <BarChart3 size={18} />
                    </Link>
                    <Link to={`/booking/${flight.id}`} className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}>
                        <span>{t('common.select')}</span>
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FlightSearch;
