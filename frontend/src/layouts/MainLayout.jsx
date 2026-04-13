/**
 * MainLayout.jsx
 * Ticket #19: Shell component with Sidebar and Topbar
 */

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Plane,
    Search,
    Ticket,
    Map,
    BarChart2,
    Settings,
    Bell,
    User,
    Globe,
    Route,
    ChevronDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MainLayout = ({ children }) => {
    const { t, i18n } = useTranslation();

    const languages = [
        { code: 'es', label: 'Español', flag: '🇪🇸' },
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'pt', label: 'Português', flag: '🇧🇷' },
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
        { code: 'zh', label: '中文', flag: '🇨🇳' },
        { code: 'ja', label: '日本語', flag: '🇯🇵' },
        { code: 'ar', label: 'العربية', flag: '🇦🇪' },
        { code: 'tr', label: 'Türkçe', flag: '🇹🇷' }
    ];

    const [showLangMenu, setShowLangMenu] = useState(false);

    const changeLanguage = (code) => {
        i18n.changeLanguage(code);
        setShowLangMenu(false);
    };

    const currentLang = languages.find(l => i18n.language.startsWith(l.code)) || languages[0];

    const regiones = [
        // AMERICA (NODO 1 - SQL)
        { key: 'AMERICA', label: 'La Paz, Bolivia', tz: 'America/La_Paz' },
        { key: 'AMERICA', label: 'Bogotá, Colombia', tz: 'America/Bogota' },
        { key: 'AMERICA', label: 'Buenos Aires, Argentina', tz: 'America/Argentina/Buenos_Aires' },
        { key: 'AMERICA', label: 'Ciudad de México, México', tz: 'America/Mexico_City' },
        { key: 'AMERICA', label: 'Nueva York, USA', tz: 'America/New_York' },
        { key: 'AMERICA', label: 'Toronto, Canadá', tz: 'America/Toronto' },
        { key: 'AMERICA', label: 'Lima, Perú', tz: 'America/Lima' },
        { key: 'AMERICA', label: 'Santiago, Chile', tz: 'America/Santiago' },
        { key: 'AMERICA', label: 'São Paulo, Brasil', tz: 'America/Sao_Paulo' },

        // EUROPE/AFRICA (NODO 2 - SQL)
        { key: 'EUROPE', label: 'Madrid, España', tz: 'Europe/Madrid' },
        { key: 'EUROPE', label: 'Londres, Reino Unido', tz: 'Europe/London' },
        { key: 'EUROPE', label: 'París, Francia', tz: 'Europe/Paris' },
        { key: 'EUROPE', label: 'Berlín, Alemania', tz: 'Europe/Berlin' },
        { key: 'EUROPE', label: 'Roma, Italia', tz: 'Europe/Rome' },
        { key: 'EUROPE', label: 'Kiev, Ucrania', tz: 'Europe/Kyiv' },
        { key: 'EUROPE', label: 'Lagos, Nigeria', tz: 'Africa/Lagos' },
        { key: 'EUROPE', label: 'El Cairo, Egipto', tz: 'Africa/Cairo' },
        { key: 'EUROPE', label: 'Johannesburgo, Sudáfrica', tz: 'Africa/Johannesburg' },

        // ASIA/OCEANIA (NODO 3 - MONGO)
        { key: 'ASIA', label: 'Tokio, Japón', tz: 'Asia/Tokyo' },
        { key: 'ASIA', label: 'Beijing, China', tz: 'Asia/Shanghai' },
        { key: 'ASIA', label: 'Seúl, Corea del Sur', tz: 'Asia/Seoul' },
        { key: 'ASIA', label: 'Nueva Delhi, India', tz: 'Asia/Kolkata' },
        { key: 'ASIA', label: 'Dubái, EAU', tz: 'Asia/Dubai' },
        { key: 'ASIA', label: 'Singapur, Singapur', tz: 'Asia/Singapore' },
        { key: 'ASIA', label: 'Sídney, Australia', tz: 'Australia/Sydney' },
        { key: 'ASIA', label: 'Auckland, Nueva Zelanda', tz: 'Pacific/Auckland' }
    ];

    const currentCityIndex = parseInt(localStorage.getItem('cityIndex') || '0', 10);
    const [selectedCity, setSelectedCity] = useState(currentCityIndex);
    const [localTime, setLocalTime] = useState('');

    useEffect(() => {
        const regionData = regiones[selectedCity] || regiones[0];

        const tick = () => {
            const formatter = new Intl.DateTimeFormat('es-BO', {
                timeZone: regionData.tz,
                dateStyle: 'medium',
                timeStyle: 'medium'
            });
            setLocalTime(formatter.format(new Date()));
        };

        tick();
        const intervalId = setInterval(tick, 1000);
        return () => clearInterval(intervalId);
    }, [selectedCity]);

    const handleRegionChange = (e) => {
        const newIndex = parseInt(e.target.value, 10);
        const newRegionKey = regiones[newIndex].key;

        setSelectedCity(newIndex);
        localStorage.setItem('cityIndex', newIndex.toString());
        localStorage.setItem('regionKey', newRegionKey); // Keep for the API to read
        // Add small loading effect or reload
        window.location.reload();
    };

    // Configurar metadatos del Nodo para la UI
    const activeRegionKey = regiones[selectedCity]?.key || 'AMERICA';
    const nodeMapping = {
        'AMERICA': 'Nodo 1 (Américas) [SQL Server]',
        'EUROPE': 'Nodo 2 (Europa/África) [SQL Server]',
        'ASIA': 'Nodo 3 (Asia/Oceanía) [MongoDB]'
    };

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
                    <div style={{ padding: '8px', background: 'hsl(var(--primary))', borderRadius: '10px' }}>
                        <Plane size={24} color="white" />
                    </div>
                    <h2 className="text-gradient" style={{ fontSize: '1.25rem' }}>SkyNet v3</h2>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <SideItem to="/" icon={<Map size={18} />} label={t('nav.dashboard')} />
                    <SideItem to="/flights" icon={<Search size={18} />} label={t('nav.flights')} />
                    {/* <SideItem to="/bookings" icon={<Ticket size={18} />} label={t('nav.bookings')} /> */}
                    <SideItem to="/dashboard-global" icon={<BarChart2 size={18} />} label={t('nav.dashboard_global')} />
                    <SideItem to="/rutas-recomendadas" icon={<Route size={18} />} label={t('nav.recommended_routes')} />
                </nav>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <SideItem to="/settings" icon={<Settings size={18} />} label={t('nav.settings')} />
                </div>
            </aside>

            {/* Main Area */}
            <div className="content-wrapper">
                <header className="topbar" style={{ position: 'relative', zIndex: 1000 }}>
                    <div className="status-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--text-muted))', fontSize: '0.875rem', fontWeight: 'bold' }}>
                        <div style={{ width: '8px', height: '8px', background: 'hsl(var(--success))', borderRadius: '50%', boxShadow: '0 0 8px hsl(var(--success))' }}></div>
                        {nodeMapping[activeRegionKey]} Online
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '6px 15px', background: 'hsla(var(--primary) / 0.15)', borderRadius: '8px', fontSize: '0.9rem', minWidth: '170px', textAlign: 'center', border: '1px solid hsla(var(--primary)/0.3)' }}>
                            {localTime}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowLangMenu(!showLangMenu)}
                                className="glass-light"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    color: 'hsl(var(--text-muted))',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                <span style={{ fontSize: '1rem' }}>{currentLang.flag}</span>
                                {currentLang.code.toUpperCase()}
                                <ChevronDown size={14} />
                            </button>
                            {showLangMenu && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '8px',
                                    backgroundColor: '#0f172a', /* Solid dark blue/slate color */
                                    border: '1px solid hsla(var(--primary) / 0.5)',
                                    borderRadius: '12px',
                                    padding: '6px',
                                    minWidth: '180px',
                                    zIndex: 9999,
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
                                }}>
                                    {languages.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => changeLanguage(lang.code)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                width: '100%',
                                                padding: '10px 14px',
                                                border: 'none',
                                                background: i18n.language.startsWith(lang.code) ? 'hsla(var(--primary) / 0.15)' : 'transparent',
                                                color: i18n.language.startsWith(lang.code) ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: i18n.language.startsWith(lang.code) ? 700 : 500,
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.target.style.background = 'hsla(var(--primary) / 0.08)'}
                                            onMouseLeave={e => e.target.style.background = i18n.language.startsWith(lang.code) ? 'hsla(var(--primary) / 0.15)' : 'transparent'}
                                        >
                                            <span style={{ fontSize: '1.1rem' }}>{lang.flag}</span>
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="glass-light" style={{ padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                            <Bell size={18} color="hsl(var(--text-muted))" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 12px', borderRadius: 'var(--radius-md)' }} className="glass-light">
                            <div style={{ fontSize: '0.875rem', textAlign: 'right' }}>
                                <div style={{ fontWeight: '600' }}>Alexander S.</div>
                                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Administrador</div>
                            </div>
                            <User size={20} color="hsl(var(--primary))" />
                        </div>
                    </div>
                </header>

                <main className="main-content">
                    <div className="animate-fade">
                        {children}
                    </div>
                </main>
            </div>

            <style>{`
        .side-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          color: hsl(var(--text-muted));
          text-decoration: none;
          font-weight: 500;
          transition: var(--transition);
        }
        .side-item:hover {
          color: white;
          background: hsla(210 40% 98% / 0.05);
        }
        .side-item.active {
          color: white;
          background: hsla(var(--primary) / 0.1);
          border-left: 3px solid hsl(var(--primary));
        }
      `}</style>
        </div>
    );
};

const SideItem = ({ to, icon, label }) => (
    <NavLink to={to} className={({ isActive }) => `side-item ${isActive ? 'active' : ''}`}>
        {icon}
        <span>{label}</span>
    </NavLink>
);

export default MainLayout;

