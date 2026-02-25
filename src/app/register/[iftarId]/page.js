'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Calendar, User, Search, ChevronDown } from 'lucide-react';
import countries from '@/lib/countries.json';

// --- Custom Country Selector ---
function CountrySelector({ selectedCode, onSelect, lang }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    // Quick helpers
    const getCountryName = (c) => {
        if (lang === 'en') return c.nameEn;
        if (lang === 'tr') return c.nameTr;
        return c.nameAr;
    };

    const selectedCountry = countries.find(c => c.code === selectedCode) || countries.find(c => c.code === 'TR');

    const filtered = countries.filter(c => {
        const term = search.toLowerCase();
        return c.dialCode.includes(term) || getCountryName(c).toLowerCase().includes(term);
    });

    return (
        <div style={{ position: 'relative', width: '135px', flexShrink: 0 }}>
            {/* Overlay to close dropdown when clicking outside */}
            {isOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    onClick={() => { setIsOpen(false); setSearch(''); }}
                />
            )}

            <div
                className="form-input"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 8px', userSelect: 'none' }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} dir="ltr">
                    {selectedCountry.flag} {selectedCountry.dialCode}
                </span>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0,
                    width: '280px', zIndex: 50, background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                    marginTop: '4px', boxShadow: 'var(--shadow-md)',
                    maxHeight: '300px', display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={16} color="var(--text-muted)" />
                        <input
                            type="text"
                            autoFocus
                            placeholder={lang === 'ar' ? 'البحث عن دولة...' : (lang === 'tr' ? 'Ülke ara...' : 'Search country...')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                border: 'none', background: 'transparent', color: 'var(--text-primary)',
                                outline: 'none', flex: 1, fontSize: '0.9rem'
                            }}
                        />
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
                        {filtered.length > 0 ? filtered.map(c => (
                            <div
                                key={c.code}
                                onClick={() => { onSelect(c.code); setIsOpen(false); setSearch(''); }}
                                style={{
                                    padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                    borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <span style={{ fontSize: '1.2rem' }}>{c.flag}</span>
                                <span dir="ltr" style={{ fontWeight: 600, width: '45px', color: 'var(--brand-dark)' }}>{c.dialCode}</span>
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                                    {getCountryName(c)}
                                </span>
                            </div>
                        )) : (
                            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
// ------------------------------

export default function RegisterPage() {
    const { t, lang } = useTranslation();
    const params = useParams();
    const router = useRouter();
    const iftarId = params.iftarId;

    const [iftar, setIftar] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [selectedCountryCode, setSelectedCountryCode] = useState('TR');
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
            const selectedCountry = countries.find(c => c.code === selectedCountryCode) || countries.find(c => c.code === 'TR');
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    iftarId,
                    studentName: studentName.trim(),
                    mobileNumber: `${selectedCountry.dialCode}${mobileNumber.trim()}`,
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

    const selectedCountry = countries.find(c => c.code === selectedCountryCode) || countries.find(c => c.code === 'TR');
    const getCountryName = (c) => {
        if (lang === 'en') return c.nameEn;
        if (lang === 'tr') return c.nameTr;
        return c.nameAr;
    };
    const examplePrefix = lang === 'ar' ? 'مثال:' : lang === 'tr' ? 'Örn:' : 'e.g.';

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
                                    <CountrySelector
                                        selectedCode={selectedCountryCode}
                                        onSelect={setSelectedCountryCode}
                                        lang={lang}
                                    />
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder={selectedCountry.example ? `${selectedCountry.example} :${examplePrefix}` : t('register.mobilePlaceholder')}
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
                            <div className="qr-container mt-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div className="qr-wrapper">
                                    <img src={qrDataUrl} alt="QR Code" width={280} height={280} />
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
                                    {studentName}
                                </p>
                                <a
                                    href={qrDataUrl}
                                    download={`nadi-nawa-qr-${iftarId}.png`}
                                    className="btn btn-primary"
                                    style={{ marginTop: '16px', textDecoration: 'none', display: 'flex', justifyContent: 'center', minWidth: '200px' }}
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
