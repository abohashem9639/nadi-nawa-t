'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useTranslation } from '@/lib/i18n/LanguageContext';

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
            <div className="empty-state-icon">⏳</div>
          </div>
        ) : iftars.length === 0 ? (
          <div className="empty-state animate-fade-in">
            <div className="empty-state-icon">🌙</div>
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
                      <p className="iftar-card-date">📅 {iftar.date}</p>
                    </div>
                    <span className={`badge ${iftar.gender === 'male' ? 'badge-male' : 'badge-female'}`}>
                      {iftar.gender === 'male' ? `🧑 ${t('home.male')}` : `👩 ${t('home.female')}`}
                    </span>
                  </div>

                  <div className="iftar-card-info">
                    <span className="iftar-card-capacity">
                      🪑 {remaining > 0 ? `${remaining} ${t('home.seatsRemaining')}` : t('home.full')}
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

        <div className="text-center mt-4 mb-3">
          <a href="/login" className="btn btn-secondary btn-sm" style={{ opacity: 0.6 }}>
            🔐 {t('login.title')}
          </a>
        </div>
      </main>
    </>
  );
}
