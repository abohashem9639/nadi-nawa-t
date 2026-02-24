'use client';

import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function Header({ showLogout, onLogout }) {
    const { t, lang, switchLang } = useTranslation();

    return (
        <header className="header">
            <div className="header-brand">
                <img src="/images/ghiras-logo.png" alt="غراس 26" className="header-logo" />
                <span className="header-title">{t('appName')}</span>
            </div>

            <div className="header-actions">
                <div className="lang-switcher">
                    <button
                        className={`lang-btn ${lang === 'ar' ? 'active' : ''}`}
                        onClick={() => switchLang('ar')}
                    >
                        عربي
                    </button>
                    <button
                        className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                        onClick={() => switchLang('en')}
                    >
                        EN
                    </button>
                    <button
                        className={`lang-btn ${lang === 'tr' ? 'active' : ''}`}
                        onClick={() => switchLang('tr')}
                    >
                        TR
                    </button>
                </div>

                {showLogout && (
                    <button className="btn btn-secondary btn-sm" onClick={onLogout}>
                        {t('admin.logout')}
                    </button>
                )}
            </div>
        </header>
    );
}
