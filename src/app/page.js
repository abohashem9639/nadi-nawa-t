'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Loader2, Moon, Calendar, User, Users, Lock } from 'lucide-react';

export default function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [iftars, setIftars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIftars();
  }, []);

  async function fetchIftars() {
    try {
      const res = await fetch('/api/iftars');
      const data = await res.json();
      setIftars(data.iftars || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="container">
        <div className="page-header">
          <h1 className="page-title">{t('home.title')}</h1>
          <p className="page-subtitle">{t('home.subtitle')}</p>
        </div>

        {loading ? (
          <div className="empty-state">
            <Loader2 className="spinner mx-auto" size={48} color="var(--brand-medium)" />
          </div>
        ) : iftars.length === 0 ? (
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
                  className="iftar-card animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="iftar-card-header">
                    <div>
                      <h3 className="iftar-card-title">{iftar.title}</h3>
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
                      className="btn btn-primary btn-full"
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
          <div className="card mb-5" style={{
            background: 'linear-gradient(145deg, var(--bg-card), rgba(16, 185, 129, 0.05))',
            border: '1px solid rgba(16, 185, 129, 0.1)',
            textAlign: 'center'
          }}>
            <h2 className="section-title" style={{ color: 'var(--brand-primary)', marginBottom: '16px' }}>
              {t('home.clubTitle')}
            </h2>

            <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 16px 0', color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.95rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--brand-primary)', fontSize: '1.2rem' }}>•</span>
                <span>{t('home.clubPoint1')}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--brand-primary)', fontSize: '1.2rem' }}>•</span>
                <span>{t('home.clubPoint2')}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--brand-primary)', fontSize: '1.2rem' }}>•</span>
                <span>{t('home.clubPoint3')}</span>
              </li>
            </ul>
          </div>

          {/* Ghiras-26 Section */}
          <div className="card mb-5" style={{
            background: 'linear-gradient(145deg, var(--bg-card), rgba(16, 185, 129, 0.05))',
            border: '1px solid rgba(16, 185, 129, 0.1)',
            textAlign: 'center'
          }}>
            <h2 className="section-title" style={{ color: 'var(--brand-primary)', marginBottom: '12px' }}>
              {t('home.whatIsGhirasTitle')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '1rem' }}>
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
