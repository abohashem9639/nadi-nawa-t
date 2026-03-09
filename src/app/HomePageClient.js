'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Moon, Calendar, User, Users, Globe, Star, Send, CheckCircle } from 'lucide-react';

export default function HomePageClient({ iftars }) {
    const { t, switchLang, lang } = useTranslation();
    const router = useRouter();
    const [showLangModal, setShowLangModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    const [submittingRating, setSubmittingRating] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('ghiras_rating_submitted')) {
            setRatingSubmitted(true);
        }
    }, []);

    async function handleRatingSubmit() {
        if (rating === 0) return;
        setSubmittingRating(true);
        try {
            const res = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stars: rating, comment: comment.trim() || null }),
            });
            if (res.ok) {
                setRatingSubmitted(true);
                localStorage.setItem('ghiras_rating_submitted', 'true');
            }
        } catch (err) {
            console.error('Rating submit error:', err);
        } finally {
            setSubmittingRating(false);
        }
    }

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
                {/* ===== Iftar Completion Announcement ===== */}
                <div className="animate-slide-up" style={{
                    maxWidth: '680px',
                    margin: '0 auto',
                    paddingTop: '32px',
                }}>
                    {/* Hero Image */}
                    <div style={{
                        borderRadius: '20px 20px 0 0',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                        lineHeight: 0,
                    }}>
                        <img
                            src="/images/iftar-completion.png"
                            alt="٢٠ يوماً.. ٢٠ إفطاراً.. غراسٌ واحد!"
                            style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                            }}
                        />
                    </div>

                    {/* Message Card */}
                    <div style={{
                        background: 'linear-gradient(180deg, #0c2e3c 0%, #0a1f2e 100%)',
                        borderRadius: '0 0 20px 20px',
                        padding: '40px 32px 36px',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(16, 185, 129, 0.15)',
                        borderTop: 'none',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Decorative glow */}
                        <div style={{
                            position: 'absolute',
                            top: '-60px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '300px',
                            height: '120px',
                            background: 'radial-gradient(ellipse, rgba(16,185,129,0.15) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />

                        {/* Title */}
                        <h2 style={{
                            textAlign: 'center',
                            fontSize: '1.6rem',
                            fontWeight: '700',
                            color: '#10b981',
                            marginBottom: '24px',
                            lineHeight: '1.8',
                            position: 'relative',
                        }}>
                            {t('completion.title')} 🌱
                        </h2>

                        {/* Divider */}
                        <div style={{
                            width: '80px',
                            height: '3px',
                            background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                            margin: '0 auto 28px',
                            borderRadius: '2px',
                        }} />

                        {/* Body Text */}
                        <div style={{
                            color: '#cbd5e1',
                            fontSize: '1.02rem',
                            lineHeight: '2',
                            textAlign: 'justify',
                        }}>
                            <p style={{ marginBottom: '16px' }}>
                                {t('completion.body1_pre')}<strong style={{ color: '#34d399' }}>{t('completion.body1_highlight')}</strong>{t('completion.body1_post')}
                            </p>
                            <p style={{ marginBottom: '16px' }}>
                                {t('completion.body2')}
                            </p>
                            <p style={{ marginBottom: '0' }}>
                                {t('completion.body3')}
                            </p>
                        </div>

                        {/* Divider */}
                        <div style={{
                            width: '80px',
                            height: '3px',
                            background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                            margin: '28px auto 24px',
                            borderRadius: '2px',
                        }} />

                        {/* Closing Tagline */}
                        <p style={{
                            textAlign: 'center',
                            fontSize: '1.15rem',
                            fontWeight: '600',
                            color: '#10b981',
                            lineHeight: '1.8',
                            margin: 0,
                        }}>
                            {t('completion.tagline')} 🌾
                        </p>

                        {/* Developer Credit */}
                        <div style={{
                            marginTop: '32px',
                            paddingTop: '20px',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            textAlign: 'center',
                            color: 'rgba(148,163,184,0.6)',
                            fontSize: '0.78rem',
                            lineHeight: '1.7',
                            direction: 'rtl',
                        }}>
                            <p style={{ margin: 0 }}>{t('completion.devCredit')}</p>
                            <p style={{ margin: '4px 0 0', color: 'rgba(148,163,184,0.45)' }}>{t('completion.devName')}</p>
                        </div>
                    </div>
                </div>

                {/* Rating Section */}
                <div className="animate-slide-up" style={{
                    maxWidth: '680px',
                    margin: '40px auto 0',
                }}>
                    <div style={{
                        background: 'linear-gradient(145deg, var(--bg-card), rgba(16, 185, 129, 0.04))',
                        border: '1px solid rgba(16, 185, 129, 0.12)',
                        borderRadius: '16px',
                        padding: '32px 24px',
                        textAlign: 'center',
                    }}>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: '8px',
                        }}>
                            {t('rating.title')}
                        </h3>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem',
                            marginBottom: '24px',
                        }}>
                            {t('rating.subtitle')}
                        </p>

                        {!ratingSubmitted ? (
                            <>
                                {/* Stars */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    marginBottom: '20px',
                                    direction: 'ltr',
                                }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                transition: 'transform 0.2s ease',
                                                transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                                            }}
                                            aria-label={`${star} stars`}
                                        >
                                            <Star
                                                size={36}
                                                fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'}
                                                color={(hoverRating || rating) >= star ? '#f59e0b' : 'var(--text-muted)'}
                                                strokeWidth={1.5}
                                            />
                                        </button>
                                    ))}
                                </div>

                                {/* Comment */}
                                <div style={{ marginBottom: '20px' }}>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder={t('rating.commentPlaceholder')}
                                        maxLength={500}
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-input)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.6',
                                            resize: 'vertical',
                                            fontFamily: 'inherit',
                                            outline: 'none',
                                            transition: 'border-color 0.2s',
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                                    />
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleRatingSubmit}
                                    disabled={rating === 0 || submittingRating}
                                    className="btn btn-primary"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        minWidth: '180px',
                                        justifyContent: 'center',
                                        opacity: rating === 0 ? 0.5 : 1,
                                    }}
                                >
                                    <Send size={16} />
                                    {submittingRating ? t('rating.submitting') : t('rating.submit')}
                                </button>
                            </>
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '16px 0',
                            }}>
                                <CheckCircle size={48} color="#10b981" />
                                <p style={{
                                    color: '#10b981',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    margin: 0,
                                }}>
                                    {t('rating.thankYou')}
                                </p>
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.85rem',
                                    margin: 0,
                                }}>
                                    {t('rating.thankYouMsg')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

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
