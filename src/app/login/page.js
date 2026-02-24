'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function LoginPage() {
    const { t } = useTranslation();
    const router = useRouter();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (data.success) {
                if (data.role === 'superadmin') {
                    router.push('/superadmin');
                } else {
                    router.push('/admin');
                }
            } else {
                setError(t('login.error'));
            }
        } catch (err) {
            setError(t('login.error'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-container">
            <div className="login-card card animate-slide-up">
                <div className="login-logo">
                    <img src="/images/ghiras-logo.png" alt="غراس 26" style={{ height: '80px' }} />
                    <h1 className="page-title" style={{ fontSize: '1.5rem', marginTop: '16px' }}>
                        {t('login.title')}
                    </h1>
                    <p className="page-subtitle">{t('login.subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">{t('login.username')}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            dir="ltr"
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('login.password')}</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            dir="ltr"
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <div className="checkin-result error mb-2" style={{ padding: '12px', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                    >
                        {loading ? t('login.submitting') : t('login.submit')}
                    </button>
                </form>

                <div className="text-center mt-3">
                    <a href="/" className="btn btn-secondary btn-sm" style={{ opacity: 0.7 }}>
                        🏠
                    </a>
                </div>
            </div>
        </div>
    );
}
