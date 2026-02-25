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

      </main>
    </>
  );
}
