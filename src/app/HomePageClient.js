'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Moon, Calendar, User, Users, Globe } from 'lucide-react';

export default function HomePageClient({ iftars }) {
    const { t, switchLang, lang } = useTranslation();
    const router = useRouter();
    const [showLangModal, setShowLangModal] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem('ghiras_lang_selected')) {
            setShowLangModal(true);
        }
    }, []);

    const handleSelectLanguage = (selectedLang) => {
        switchLang(selectedLang);
        localStorage.setItem('ghiras_lang_selected', 'true');
        setShowLangModal(false);
    };

    const getLocalizedTitle = (iftar) => {
        if (lang === 'tr' && iftar.title_tr) return iftar.title_tr;
        if (lang === 'en' && iftar.title_en) return iftar.title_en;
        return iftar.title; // Default to Arabic
    };

    return (
        <>
            {showLangModal && (
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <div className="result-modal primary" style={{ padding: '30px 20px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                        <Globe size={48} color="var(--brand-primary)" style={{ margin: '0 auto 16px' }} />
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
                            Select Language
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            اختر لغتك المفضلة <br /> Lütfen dil seçin
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button className="btn btn-primary btn-full" onClick={() => handleSelectLanguage('ar')}>
                                العربية
                            </button>
                            <button className="btn btn-primary btn-full" onClick={() => handleSelectLanguage('tr')}>
                                Türkçe
                            </button>
                            <button className="btn btn-primary btn-full" onClick={() => handleSelectLanguage('en')}>
                                English
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Header />
            <main className="container">
                <div className="page-header">
                    <h1 className="page-title">{t('home.title')}</h1>
                    <p className="page-subtitle">{t('home.subtitle')}</p>
                </div>

                {iftars.length === 0 ? (
                    <div className="empty-state animate-fade-in">
                        <Moon size={64} color="var(--text-muted)" className="mb-3" style={{ margin: '0 auto' }} />
                        <p className="empty-state-text">{t('home.noIftars')}</p>
                    </div>
                ) : (
                    <div className="iftar-grid">
                        {iftars.map((iftar, index) => {
                            const fillPercent = iftar.capacity > 0
                                ? Math.round((iftar.registered / iftar.capacity) * 100)
                                : 0;
                            const isFull = iftar.registered >= iftar.capacity;
                            const remaining = iftar.capacity - iftar.registered;

                            return (
                                <div
                                    key={iftar.id}
                                    className={`iftar-card animate-slide-up ${iftar.gender === 'female' ? 'iftar-card-female' : ''}`}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="iftar-card-header">
                                        <div>
                                            <h3 className="iftar-card-title">{getLocalizedTitle(iftar)}</h3>
                                            <p className="iftar-card-date flex items-center gap-1 mt-1">
                                                <Calendar size={14} /> {iftar.date}
                                            </p>
                                        </div>
                                        <span className={`badge ${iftar.gender === 'male' ? 'badge-male' : 'badge-female'} flex items-center gap-1`}>
                                            <User size={14} /> {iftar.gender === 'male' ? t('home.male') : t('home.female')}
                                        </span>
                                    </div>

                                    <div className="iftar-card-info flex items-center gap-2">
                                        <span className="iftar-card-capacity flex items-center gap-1">
                                            <Users size={14} /> {remaining > 0 ? `${remaining} ${t('home.seatsRemaining')}` : t('home.full')}
                                        </span>
                                        <span>{iftar.registered} / {iftar.capacity}</span>
                                    </div>

                                    <div className="progress-bar">
                                        <div
                                            className={`progress-fill ${fillPercent >= 100 ? 'full' : fillPercent >= 80 ? 'warning' : ''}`}
                                            style={{ width: `${Math.min(fillPercent, 100)}%` }}
                                        />
                                    </div>

                                    {!isFull ? (
                                        <button
                                            className={`btn btn-full ${iftar.gender === 'female' ? 'btn-female' : 'btn-primary'}`}
                                            onClick={() => router.push(`/register/${iftar.id}`)}
                                        >
                                            {t('home.register')}
                                        </button>
                                    ) : (
                                        <button className="btn btn-secondary btn-full" disabled>
                                            {t('home.full')}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Informational Sections */}
                <div className="info-sections animate-slide-up" style={{ animationDelay: '0.3s', marginTop: '60px' }}>

                    {/* Nadi Nawa Section */}
                    <div className="card mb-4 mt-5" style={{
                        background: 'linear-gradient(145deg, var(--bg-card), rgba(16, 185, 129, 0.05))',
                        border: '1px solid rgba(16, 185, 129, 0.1)',
                        textAlign: 'center',
                        padding: '24px 20px'
                    }}>
                        <h2 className="section-title" style={{ color: 'var(--brand-primary)', marginBottom: '24px' }}>
                            {t('home.clubTitle')}
                        </h2>

                        <ul style={{ listStyleType: 'none', padding: 0, margin: '0 auto', maxWidth: '400px', color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1rem', textAlign: 'right' }}>
                            <li style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                                <span style={{ color: 'var(--brand-primary)', fontSize: '1.2rem', lineHeight: '1' }}>•</span>
                                <span>{t('home.clubPoint1')}</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                                <span style={{ color: 'var(--brand-primary)', fontSize: '1.2rem', lineHeight: '1' }}>•</span>
                                <span>{t('home.clubPoint2')}</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                                <span style={{ color: 'var(--brand-primary)', fontSize: '1.2rem', lineHeight: '1' }}>•</span>
                                <span>{t('home.clubPoint3')}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Ghiras-26 Section */}
                    <div className="card mb-5" style={{
                        background: 'linear-gradient(145deg, var(--bg-card), rgba(16, 185, 129, 0.05))',
                        border: '1px solid rgba(16, 185, 129, 0.1)',
                        textAlign: 'center',
                        padding: '24px 20px'
                    }}>
                        <h2 className="section-title" style={{ color: 'var(--brand-primary)', marginBottom: '16px' }}>
                            {t('home.whatIsGhirasTitle')}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1rem', textAlign: 'justify', textAlignLast: 'center' }}>
                            {t('home.ghirasDesc')}
                        </p>
                    </div>

                    {/* Follow Button */}
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <a
                            href="https://linktr.ee/NadiNawa"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ display: 'inline-block', minWidth: '200px' }}
                        >
                            {t('home.followUs')}
                        </a>
                    </div>

                </div>

            </main>
        </>
    );
}
