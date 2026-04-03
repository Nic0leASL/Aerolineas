/**
 * MainLayout.jsx
 * Ticket #19: Shell component with Sidebar and Topbar
 */

import React from 'react';
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
                    <div className="status-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--text-muted))', fontSize: '0.875rem' }}>
                        <div style={{ width: '8px', height: '8px', background: 'hsl(var(--success))', borderRadius: '50%' }}></div>
                        Nodo Antigravity (ID: 1) Online
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

