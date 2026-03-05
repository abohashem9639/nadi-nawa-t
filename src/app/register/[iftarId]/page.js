'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Calendar, User } from 'lucide-react';

export default function RegisterPage() {
    const { t, lang } = useTranslation();
    const params = useParams();
    const router = useRouter();
    const iftarId = params.iftarId;

    const [iftar, setIftar] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [isArqam, setIsArqam] = useState(false);
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
                    isArqam: isArqam
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

    const getLocalizedTitle = (iftarObj) => {
        if (!iftarObj) return '';
        if (lang === 'tr' && iftarObj.title_tr) return iftarObj.title_tr;
        if (lang === 'en' && iftarObj.title_en) return iftarObj.title_en;
        return iftarObj.title; // Default to Arabic
    };

    return (
        <>
            <Header />
            <main className="container">
                <div className="page-header">
                    <h1 className="page-title">{t('register.title')}</h1>
                    {iftar && (
                        <p className="page-subtitle flex items-center justify-center gap-2">
                            {getLocalizedTitle(iftar)} — <Calendar size={14} className="ml-1" /> {iftar.date}
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
                                <p style={{
                                    fontSize: '0.78rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '8px',
                                    lineHeight: '1.6',
                                    background: 'var(--bg-card-hover)',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    borderInlineStart: '3px solid var(--brand-medium)'
                                }}>
                                    {t('register.fullNameNotice') || 'يرجى كتابة الاسم الكامل لتجنب تشابه الأسماء. قد يتم حذف التسجيلات التي تحتوي على اسم أول فقط أو أسماء مكررة.'}
                                </p>
                            </div>

                            <div className="form-group flex-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    id="arqamCheck"
                                    checked={isArqam}
                                    onChange={(e) => setIsArqam(e.target.checked)}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--brand-medium)', cursor: 'pointer' }}
                                />
                                <label htmlFor="arqamCheck" style={{ margin: 0, color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                                    {t('home.areYouArqam') || 'هل أنت من طلاب الأرقم؟'}
                                </label>
                            </div>

                            {result?.type === 'error' && (
                                <div className="checkin-result error mb-2">
                                    {result.message}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary btn-full"
                                disabled={loading || !studentName.trim()}
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
                            <div className="qr-container mt-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div className="qr-wrapper">
                                    <img src={qrDataUrl} alt="QR Code" width={180} height={180} />
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
                                    {studentName}
                                </p>

                                <div style={{
                                    background: 'var(--bg-card-hover)',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    marginTop: '20px',
                                    fontSize: '0.9rem',
                                    color: 'var(--text-primary)',
                                    textAlign: 'right',
                                    border: '1px solid var(--border-color)',
                                    lineHeight: '1.6'
                                }}>
                                    <ul style={{ margin: 0, paddingInlineStart: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <li>{t('register.qrInstruction1')}</li>
                                        <li>{t('register.qrInstruction2')}</li>
                                        <li>{t('register.qrInstruction3')}</li>
                                    </ul>
                                </div>

                                <a
                                    href={qrDataUrl}
                                    download={`nadi-nawa-qr-${iftarId}.png`}
                                    className="btn btn-primary"
                                    style={{ marginTop: '24px', textDecoration: 'none', display: 'flex', justifyContent: 'center', minWidth: '200px' }}
                                >
                                    {t('register.downloadQR') || 'تنزيل الصورة'}
                                </a>
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
