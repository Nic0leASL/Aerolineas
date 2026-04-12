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
    Globe
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MainLayout = ({ children }) => {
    const { t, i18n } = useTranslation();

    const toggleLanguage = () => {
        const nextLng = i18n.language.startsWith('es') ? 'en' : 'es';
        i18n.changeLanguage(nextLng);
    };

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
                    <SideItem to="/bookings" icon={<Ticket size={18} />} label={t('nav.bookings')} />
                    <SideItem to="/routes" icon={<BarChart2 size={18} />} label={t('nav.routes')} />
                </nav>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <SideItem to="/settings" icon={<Settings size={18} />} label={t('nav.settings')} />
                </div>
            </aside>

            {/* Main Area */}
            <div className="content-wrapper">
                <header className="topbar">
                    <div className="status-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--text-muted))', fontSize: '0.875rem', fontWeight: 'bold' }}>
                        <div style={{ width: '8px', height: '8px', background: 'hsl(var(--success))', borderRadius: '50%', boxShadow: '0 0 8px hsl(var(--success))' }}></div>
                        {nodeMapping[activeRegionKey]} Online
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Estoy comprando desde:</span>
                        <select 
                            value={selectedCity}
                            onChange={handleRegionChange}
                            className="glass-light"
                            style={{ padding: '6px 12px', borderRadius: '8px', background: 'hsl(var(--bg-card))', color: 'white', border: '1px solid hsla(var(--primary), 0.5)', outline: 'none', cursor: 'pointer', maxWidth: '300px', fontSize: '0.9rem' }}
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

                        <div style={{ padding: '6px 15px', background: 'hsla(var(--primary) / 0.15)', borderRadius: '8px', fontSize: '0.9rem', minWidth: '170px', textAlign: 'center', border: '1px solid hsla(var(--primary)/0.3)' }}>
                            {localTime}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button
                            onClick={toggleLanguage}
                            className="glass-light"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                color: 'hsl(var(--text-muted))',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                            }}
                        >
                            <Globe size={16} />
                            {i18n.language.toUpperCase().substring(0, 2)}
                        </button>
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

