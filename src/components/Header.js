'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function Header({ showLogout, onLogout }) {
    const { t, lang, switchLang } = useTranslation();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="header">
            <div className="header-brand">
                <img src="/images/ghiras-logo.png" alt="غراس 26" className="header-logo" />
                <span className="header-title">{t('appName')}</span>
            </div>

            <div className="header-actions">
                {/* Desktop View (Visible on larger screens, hidden on mobile by CSS) */}
                <div className="desktop-actions" style={{ display: 'none' }}>
                    <div className="lang-switcher">
                        <button className={`lang-btn ${lang === 'ar' ? 'active' : ''}`} onClick={() => switchLang('ar')}>عربي</button>
                        <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => switchLang('en')}>EN</button>
                        <button className={`lang-btn ${lang === 'tr' ? 'active' : ''}`} onClick={() => switchLang('tr')}>TR</button>
                    </div>
                </div>

                {/* Mobile Settings Button */}
                <button
                    className="btn btn-secondary btn-sm settings-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{ padding: '8px', fontSize: '1.2rem', borderColor: 'transparent', background: 'transparent' }}
                >
                    ⚙️
                </button>

                {/* Mobile Sliding Menu */}
                {menuOpen && (
                    <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}>
                        <div className="mobile-menu-card" onClick={(e) => e.stopPropagation()}>
                            <div className="mobile-menu-header">
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t('language') || 'Settings'}</h3>
                                <button className="btn-close" onClick={() => setMenuOpen(false)}>✕</button>
                            </div>

                            <div className="mobile-menu-content">
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>اللغة / Language</p>
                                <div className="lang-switcher" style={{ width: '100%', justifyContent: 'space-between', marginBottom: '24px' }}>
                                    <button className={`lang-btn ${lang === 'ar' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => { switchLang('ar'); setMenuOpen(false); }}>عربي</button>
                                    <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => { switchLang('en'); setMenuOpen(false); }}>EN</button>
                                    <button className={`lang-btn ${lang === 'tr' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => { switchLang('tr'); setMenuOpen(false); }}>TR</button>
                                </div>

                                {showLogout && (
                                    <button
                                        className="btn btn-danger btn-full"
                                        onClick={() => { onLogout(); setMenuOpen(false); }}
                                    >
                                        {t('admin.logout') || 'Logout'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
