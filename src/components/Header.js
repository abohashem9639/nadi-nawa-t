'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Settings, X, LogOut, Globe } from 'lucide-react';

export default function Header({ showLogout, onLogout }) {
    const { t, lang, switchLang } = useTranslation();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="header">
            <div className="header-brand">
                <img src="/images/nadi-nawa-logo.png" alt="نادي نواة" className="header-logo" />
                <div className="header-quote-container">
                    <span className="header-quote">من النواة انطلقنا، شباب مثقف على الحق اجتمع</span>
                </div>
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
                    style={{ padding: '8px', borderColor: 'transparent', background: 'transparent' }}
                >
                    <Settings size={22} color="var(--text-primary)" />
                </button>

                {/* Mobile Sliding Menu */}
                {menuOpen && (
                    <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}>
                        <div className="mobile-menu-card" onClick={(e) => e.stopPropagation()}>
                            <div className="mobile-menu-header">
                                <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Settings size={20} /> {t('language') || 'Settings'}
                                </h3>
                                <button className="btn-close" onClick={() => setMenuOpen(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="mobile-menu-content">
                                <div style={{ marginBottom: '24px' }}>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                        <Globe size={16} /> اللغة / Language
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                        <button className={`btn btn-sm ${lang === 'ar' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '12px 0' }} onClick={() => { switchLang('ar'); setMenuOpen(false); }}>عربي</button>
                                        <button className={`btn btn-sm ${lang === 'en' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '12px 0' }} onClick={() => { switchLang('en'); setMenuOpen(false); }}>EN</button>
                                        <button className={`btn btn-sm ${lang === 'tr' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '12px 0' }} onClick={() => { switchLang('tr'); setMenuOpen(false); }}>TR</button>
                                    </div>
                                </div>

                                {showLogout && (
                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                                        <button
                                            className="btn btn-danger btn-full"
                                            onClick={() => { onLogout(); setMenuOpen(false); }}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
                                        >
                                            <LogOut size={20} /> {t('admin.logout') || 'Logout'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
