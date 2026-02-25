'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Calendar, User } from 'lucide-react';

export default function RegisterPage() {
    const { t } = useTranslation();
    const params = useParams();
    const router = useRouter();
    const iftarId = params.iftarId;

    const [iftar, setIftar] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [countryCode, setCountryCode] = useState('+90');
    const [mobileNumber, setMobileNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // { type: 'success'|'error', qrToken, message }
    const [qrDataUrl, setQrDataUrl] = useState(null);

    useEffect(() => {
        fetchIftar();
    }, []);

    async function fetchIftar() {
        try {
            const res = await fetch('/api/iftars');
            const data = await res.json();
            const found = data.iftars?.find(i => i.id === iftarId);
            setIftar(found);
        } catch (err) {
            console.error(err);
        }
    }

    async function generateQR(token) {
        try {
            const QRCode = (await import('qrcode')).default;
            const url = await QRCode.toDataURL(token, {
                width: 280,
                margin: 2,
                color: {
                    dark: '#1a2236',
                    light: '#ffffff',
                },
            });
            setQrDataUrl(url);
        } catch (err) {
            console.error('QR generation error:', err);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    iftarId,
                    studentName: studentName.trim(),
                    mobileNumber: `${countryCode}${mobileNumber.trim()}`,
                }),
            });

            const data = await res.json();

            if (res.status === 201) {
                setResult({ type: 'success', message: t('register.success') });
                await generateQR(data.qrToken);
            } else if (data.error === 'already_registered') {
                setResult({ type: 'warning', message: t('register.alreadyRegistered') });
                await generateQR(data.qrToken);
            } else if (data.error === 'already_registered_other') {
                setResult({ type: 'error', message: t('register.alreadyRegisteredOther') || 'You are already registered for a different Iftar. You can only register for one.' });
            } else if (data.error === 'full') {
                setResult({ type: 'error', message: t('register.full') });
            } else {
                setResult({ type: 'error', message: t('register.error') });
            }
        } catch (err) {
            setResult({ type: 'error', message: t('register.error') });
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Header />
            <main className="container">
                <div className="page-header">
                    <h1 className="page-title">{t('register.title')}</h1>
                    {iftar && (
                        <p className="page-subtitle flex items-center justify-center gap-2">
                            {iftar.title} — <Calendar size={14} className="ml-1" /> {iftar.date}
                            <span className={`badge ${iftar.gender === 'male' ? 'badge-male' : 'badge-female'} flex items-center gap-1`} style={{ marginInlineStart: '12px' }}>
                                <User size={14} /> {iftar.gender === 'male' ? t('home.male') : t('home.female')}
                            </span>
                        </p>
                    )}
                </div>

                {/* Registration Form */}
                {!result?.type || result.type === 'error' ? (
                    <div className="card animate-slide-up" style={{ maxWidth: '500px', margin: '0 auto' }}>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">{t('register.name')}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={t('register.namePlaceholder')}
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('register.mobile')}</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select
                                        className="form-select"
                                        style={{ width: '100px', flexShrink: 0, padding: '12px 8px' }}
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        dir="ltr"
                                    >
                                        <option value="+90">🇹🇷 +90</option>
                                        <option value="+966">🇸🇦 +966</option>
                                        <option value="+962">🇯🇴 +962</option>
                                        <option value="+20">🇪🇬 +20</option>
                                        <option value="+970">🇵🇸 +970</option>
                                        <option value="+963">🇸🇾 +963</option>
                                        <option value="+961">🇱🇧 +961</option>
                                        <option value="+964">🇮🇶 +964</option>
                                        <option value="+213">🇩🇿 +213</option>
                                        <option value="+212">🇲🇦 +212</option>
                                        <option value="+216">🇹🇳 +216</option>
                                        <option value="+965">🇰🇼 +965</option>
                                        <option value="+974">🇶🇦 +974</option>
                                        <option value="+971">🇦🇪 +971</option>
                                    </select>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder={t('register.mobilePlaceholder')}
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                        required
                                        dir="ltr"
                                        style={{ textAlign: 'left', flex: 1 }}
                                    />
                                </div>
                            </div>

                            {result?.type === 'error' && (
                                <div className="checkin-result error mb-2">
                                    {result.message}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary btn-full"
                                disabled={loading || !studentName.trim() || !mobileNumber.trim()}
                            >
                                {loading ? t('register.submitting') : t('register.submit')}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* QR Code Result */
                    <div className="card animate-slide-up" style={{ maxWidth: '500px', margin: '0 auto' }}>
                        <div className={`checkin-result ${result.type === 'success' ? 'success' : 'warning'}`}>
                            {result.message}
                        </div>

                        <p className="text-center mt-2" style={{ color: 'var(--text-secondary)' }}>
                            {t('register.successMsg')}
                        </p>

                        {qrDataUrl && (
                            <div className="qr-container mt-2">
                                <div className="qr-wrapper">
                                    <img src={qrDataUrl} alt="QR Code" width={280} height={280} />
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {studentName}
                                </p>
                            </div>
                        )}

                        <div className="text-center mt-3">
                            <button
                                className="btn btn-secondary"
                                onClick={() => router.push('/')}
                            >
                                {t('register.back')}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
