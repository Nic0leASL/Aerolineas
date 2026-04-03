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
    const [search, setSearch] = useState({
        origin: '',
        destination: '',
        date: ''
    });

    const fetchFlights = async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getFlights(params);
            setFlights(data.data || data.flights || []);
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

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>{t('search.title')}</h2>
                <p style={{ color: 'hsl(var(--text-muted))' }}>Explora miles de rutas en nuestra red distribuida de alta disponibilidad.</p>
            </header>

            {/* Search Bar */}
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
                />
                <SearchInput
                    icon={<PlaneLanding size={18} />}
                    label={t('search.destination')}
                    placeholder="Ej: TYO"
                    value={search.destination}
                    onChange={(v) => setSearch({ ...search, destination: v })}
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
                    <FilterBadge label="Más barato" active />
                    <FilterBadge label="Más rápido" />
                    <FilterBadge label="Directo" />
                </div>
                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
                    {flights.length} resultados encontrados
                </div>
            </div>

            {/* Results List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-dim))' }}>{t('common.loading')}</div>
                ) : flights.length > 0 ? (
                    flights.map(flight => <FlightCard key={flight.id} flight={flight} t={t} />)
                ) : (
                    <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: 'var(--radius-lg)', color: 'hsl(var(--text-muted))' }}>
                        {t('search.no_results')}
                    </div>
                )}
            </div>
        </div>
    );
};

const SearchInput = ({ icon, label, placeholder, value, onChange, type = "text" }) => (
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
                onChange={(e) => onChange(e.target.value.toUpperCase())}
            />
        </div>
    </div>
);

const FilterBadge = ({ label, active }) => (
    <button className="glass-light" style={{
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '0.75rem',
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
