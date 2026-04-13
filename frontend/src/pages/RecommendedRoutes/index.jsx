import React, { useState, useEffect } from 'react';
import { 
    Map, Compass, ArrowRight, Clock, Zap, DollarSign, 
    Globe, Layers, ChevronDown, ChevronUp, Plane 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';

const AIRPORTS = {
    ATL: { name: 'Atlanta', country: 'USA', flag: '🇺🇸' },
    PEK: { name: 'Beijing', country: 'China', flag: '🇨🇳' },
    DXB: { name: 'Dubái', country: 'EAU', flag: '🇦🇪' },
    TYO: { name: 'Tokio', country: 'Japón', flag: '🇯🇵' },
    LON: { name: 'Londres', country: 'UK', flag: '🇬🇧' },
    LAX: { name: 'Los Ángeles', country: 'USA', flag: '🇺🇸' },
    PAR: { name: 'París', country: 'Francia', flag: '🇫🇷' },
    FRA: { name: 'Frankfurt', country: 'Alemania', flag: '🇩🇪' },
    IST: { name: 'Estambul', country: 'Turquía', flag: '🇹🇷' },
    SIN: { name: 'Singapur', country: 'Singapur', flag: '🇸🇬' },
    MAD: { name: 'Madrid', country: 'España', flag: '🇪🇸' },
    AMS: { name: 'Ámsterdam', country: 'Países Bajos', flag: '🇳🇱' },
    DFW: { name: 'Dallas', country: 'USA', flag: '🇺🇸' },
    CAN: { name: 'Cantón', country: 'China', flag: '🇨🇳' },
    SAO: { name: 'São Paulo', country: 'Brasil', flag: '🇧🇷' },
};

const AIRPORT_CODES = Object.keys(AIRPORTS);

const RecommendedRoutes = () => {
    const { t } = useTranslation();
    const [origen, setOrigen] = useState('');
    const [destino, setDestino] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeRegion, setActiveRegion] = useState('america');
    const [regionData, setRegionData] = useState(null);
    const [expandedCard, setExpandedCard] = useState(null);

    useEffect(() => {
        loadRegion(activeRegion);
    }, [activeRegion]);

    const loadRegion = async (region) => {
        try {
            const data = await api.getRoutesByRegion(region);
            setRegionData(data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearch = async () => {
        if (!origen || !destino || origen === destino) return;
        setLoading(true);
        try {
            const data = await api.searchRecommendedRoutes(origen, destino);
            setResults(data);
        } catch (err) {
            setResults({ rutas: [], rutasEncontradas: 0, nota: err.message });
        }
        setLoading(false);
    };

    const regionTabs = [
        { key: 'america', label: t('routes.america', 'América'), icon: '🌎', color: 'var(--success)' },
        { key: 'europa', label: t('routes.europe', 'Europa'), icon: '🌍', color: 'var(--primary)' },
        { key: 'asia_medio_oriente', label: t('routes.asia', 'Asia + M. Oriente'), icon: '🌏', color: 'var(--accent)' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <header>
                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-dim))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{t('nav.recommended_routes', 'Catálogo de Rutas')}</div>
                <h1 style={{ fontSize: '2rem', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {t('nav.recommended_routes', 'Rutas Recomendadas con Escalas')}
                </h1>
            </header>

            {/* Search */}
            <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-xl)' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem' }}>
                    <Compass size={20} color="hsl(var(--primary))" />
                    {t('routes.search_with_layovers', 'Buscar Ruta con Escalas')}
                </h3>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-dim))', marginBottom: '6px', textTransform: 'uppercase', marginLeft: '4px' }}>{t('routes.origin', 'Origen')}</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--primary))' }}><Plane size={18} /></div>
                            <select value={origen} onChange={e => setOrigen(e.target.value)} className="input-main glass" style={{ width: '100%', padding: '12px 16px 12px 40px', background: 'hsl(var(--bg-card))', appearance: 'none', border: '1px solid hsla(var(--primary) / 0.2)', borderRadius: '10px', color: 'white', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}>
                                <option value="" style={{ background: '#111', color: '#fff' }}>{t('common.select', 'Seleccionar...')}</option>
                                {AIRPORT_CODES.map(c => <option key={c} value={c} style={{ background: '#111', color: '#fff' }}>{AIRPORTS[c].flag} {c} — {AIRPORTS[c].name}</option>)}
                            </select>
                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'hsl(var(--text-muted))' }}>▼</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '12px' }}>
                        <ArrowRight size={22} color="hsl(var(--primary))" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-dim))', marginBottom: '6px', textTransform: 'uppercase', marginLeft: '4px' }}>{t('routes.destination', 'Destino')}</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--primary))' }}><Plane size={18} style={{ transform: 'rotate(90deg)' }} /></div>
                            <select value={destino} onChange={e => setDestino(e.target.value)} className="input-main glass" style={{ width: '100%', padding: '12px 16px 12px 40px', background: 'hsl(var(--bg-card))', appearance: 'none', border: '1px solid hsla(var(--primary) / 0.2)', borderRadius: '10px', color: 'white', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}>
                                <option value="" style={{ background: '#111', color: '#fff' }}>{t('common.select', 'Seleccionar...')}</option>
                                {AIRPORT_CODES.map(c => <option key={c} value={c} style={{ background: '#111', color: '#fff' }}>{AIRPORTS[c].flag} {c} — {AIRPORTS[c].name}</option>)}
                            </select>
                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'hsl(var(--text-muted))' }}>▼</div>
                        </div>
                    </div>
                    <button onClick={handleSearch} disabled={loading || !origen || !destino} style={{ padding: '12px 28px', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', opacity: (!origen || !destino) ? 0.5 : 1 }}>
                        {loading ? '...' : t('common.search', 'Buscar')}
                    </button>
                </div>

                {results && (
                    <div style={{ marginTop: '24px' }}>
                        {results.rutasEncontradas === 0 ? (
                            <div style={{ padding: '20px', background: 'hsla(var(--warning) / 0.08)', borderRadius: '12px', textAlign: 'center', color: 'hsl(var(--warning))' }}>
                                {results.nota}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {results.rutas.map((ruta, ri) => (
                                    <div key={ri} className="glass-light" style={{ padding: '20px', borderRadius: '14px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dim))', fontWeight: 600, marginBottom: '12px' }}>
                                            {ruta.region} • Hub: {ruta.hub}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                            {ruta.opciones.map((opt, oi) => (
                                                <OptionCard key={oi} option={opt} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Region Tabs */}
            <div style={{ display: 'flex', gap: '12px' }}>
                {regionTabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveRegion(tab.key)} style={{ flex: 1, padding: '14px 20px', borderRadius: '12px', border: activeRegion === tab.key ? `2px solid hsl(${tab.color})` : '2px solid transparent', background: activeRegion === tab.key ? `hsla(${tab.color} / 0.1)` : 'hsla(var(--surface-light) / 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 600, color: activeRegion === tab.key ? `hsl(${tab.color})` : 'hsl(var(--text-muted))', transition: 'all 0.3s ease' }}>
                        <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Region Content */}
            {regionData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-xl)' }}>
                        <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>{regionData.descripcion || regionData.region}</h3>
                        {regionData.hubs && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {regionData.hubs.map(h => (
                                    <span key={h} style={{ padding: '4px 12px', background: 'hsla(var(--primary) / 0.1)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--primary))' }}>
                                        {AIRPORTS[h]?.flag} {h} — {AIRPORTS[h]?.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Route cards from region */}
                    {renderRegionRoutes(regionData, expandedCard, setExpandedCard, t)}
                </div>
            )}
        </div>
    );
};

const renderRegionRoutes = (data, expandedCard, setExpandedCard, t) => {
    const sections = [];

    // desde_ATL
    if (data.desde_ATL) {
        sections.push({ key: 'atl', title: `${t('routes.from', 'Desde')} ${data.desde_ATL.hub} — ${data.desde_ATL.nota}`, rutas: data.desde_ATL.rutas });
    }
    // desde_SAO
    if (data.desde_SAO) {
        sections.push({ key: 'sao', title: `${t('routes.from', 'Desde')} ${data.desde_SAO.hub} — ${data.desde_SAO.nota}`, rutas: data.desde_SAO.rutas });
    }
    // intra_europa
    if (data.intra_europa) {
        sections.push({ key: 'intra', title: t('routes.intra_europe', 'Rutas Intra-Europa (Directas)'), directas: data.intra_europa.rutas_directas });
    }
    // europa_a_asia
    if (data.europa_a_asia) {
        sections.push({ key: 'eu-asia', title: t('routes.eu_asia', 'Europa → Asia / Medio Oriente'), rutas: data.europa_a_asia.rutas });
    }
    // rutas (asia)
    if (data.rutas) {
        sections.push({ key: 'asia', title: data.descripcion || t('routes.routes', 'Rutas'), rutas: data.rutas });
    }

    return sections.map(section => (
        <div key={section.key} className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-xl)' }}>
            <div onClick={() => setExpandedCard(expandedCard === section.key ? null : section.key)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: expandedCard === section.key ? '16px' : 0 }}>
                <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Map size={18} color="hsl(var(--primary))" />
                    {section.title}
                </h3>
                {expandedCard === section.key ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedCard === section.key && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {section.directas ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {section.directas.map((d, i) => (
                                <div key={i} style={{ padding: '12px 16px', background: 'hsla(var(--surface-light) / 0.3)', borderRadius: '10px', fontSize: '0.85rem' }}>
                                    <div style={{ fontWeight: 600 }}>
                                        {AIRPORTS[d.par[0]]?.flag} {d.par[0]} ↔ {AIRPORTS[d.par[1]]?.flag} {d.par[1]}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.75rem', color: 'hsl(var(--text-dim))' }}>
                                        <Clock size={12} /> {d.tiempo}
                                        <span style={{ padding: '2px 8px', background: 'hsla(var(--success) / 0.1)', color: 'hsl(var(--success))', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700 }}>DIRECTO</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : section.rutas ? (
                        section.rutas.map((ruta, ri) => (
                            <div key={ri} style={{ padding: '16px', background: 'hsla(var(--surface-light) / 0.2)', borderRadius: '12px' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Plane size={16} color="hsl(var(--primary))" />
                                    {ruta.origen || ''} → {ruta.destino} 
                                    {ruta.region_destino && <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-dim))', fontWeight: 400 }}>({ruta.region_destino})</span>}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    {ruta.opciones.map((opt, oi) => (
                                        <OptionCard key={oi} option={opt} />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : null}
                </div>
            )}
        </div>
    ));
};

const OptionCard = ({ option }) => {
    if (!option || (option.ruta === null && !option.ruta_desc)) return (
        <div style={{ padding: '14px', background: 'hsla(var(--surface-light) / 0.15)', borderRadius: '10px', opacity: 0.4, textAlign: 'center', fontSize: '0.8rem', color: 'hsl(var(--text-dim))' }}>—</div>
    );

    const typeConfig = {
        rapida: { label: 'Más Rápida', icon: <Zap size={14} />, color: 'var(--success)', bg: 'var(--success)' },
        barata: { label: 'Más Barata', icon: <DollarSign size={14} />, color: 'var(--primary)', bg: 'var(--primary)' },
        alternativa: { label: 'Alternativa', icon: <Layers size={14} />, color: 'var(--accent)', bg: 'var(--accent)' }
    };

    const cfg = typeConfig[option.tipo] || typeConfig.alternativa;
    const routeStr = option.ruta ? option.ruta.join(' → ') : option.ruta_desc || '';

    return (
        <div style={{ padding: '14px', background: `hsla(${cfg.bg} / 0.06)`, border: `1px solid hsla(${cfg.color} / 0.15)`, borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ padding: '3px 8px', background: `hsla(${cfg.bg} / 0.15)`, color: `hsl(${cfg.color})`, borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {cfg.icon} {cfg.label}
                </span>
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>{routeStr}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'hsl(var(--text-dim))' }}>
                <Clock size={12} />
                {option.tiempo_aprox || '—'}
                {option.directo && <span style={{ padding: '2px 6px', background: 'hsla(var(--success) / 0.1)', color: 'hsl(var(--success))', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700 }}>DIRECTO</span>}
                {option.escalas && option.escalas.length > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>· {option.escalas.length} escala(s)</span>}
            </div>
            {option.nota && <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-dim))', fontStyle: 'italic', marginTop: '4px' }}>{option.nota}</div>}
        </div>
    );
};

export default RecommendedRoutes;
