'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { ScanLine, StopCircle, CheckCircle2, AlertTriangle, XCircle, Moon, Loader2, Users } from 'lucide-react';

export default function AdminPage() {
    const { t } = useTranslation();
    const router = useRouter();

    const [admin, setAdmin] = useState(null);
    const [iftars, setIftars] = useState([]);
    const [selectedIftarId, setSelectedIftarId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanResult, setScanResult] = useState(null);
    const [scannerActive, setScannerActive] = useState(false);
    const [dialogConfig, setDialogConfig] = useState({ isOpen: false });
    const [isScanning, setIsScanning] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const scannerRef = useRef(null);
    const html5QrRef = useRef(null);
    const isScanningRef = useRef(false); // Ref for immediate sync logic in callbacks

    useEffect(() => {
        checkAuth();
        return () => {
            stopScanner();
        };
    }, []);

    async function checkAuth() {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (!data.authenticated || !['male_admin', 'female_admin'].includes(data.role)) {
                router.push('/login');
                return;
            }
            setAdmin(data);
            await fetchTodayIftars(data.role === 'male_admin' ? 'male' : 'female');
        } catch {
            router.push('/login');
            setLoading(false);
        }
    }

    async function fetchTodayIftars(gender) {
        try {
            const res = await fetch(`/api/iftars?gender=${gender}`);
            const data = await res.json();
            if (data.iftars) {
                setIftars(data.iftars);
                if (data.iftars.length === 1) {
                    setSelectedIftarId(data.iftars[0].id);
                }
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleCheckin(qrToken) {
        // Prevent multiple scans
        if (isScanningRef.current || showModal) return;

        // Lock the scanner immediately
        isScanningRef.current = true;
        setIsScanning(true);

        // Pause the camera feed instantly to prevent further callbacks
        if (html5QrRef.current) {
            try { html5QrRef.current.pause(true); } catch { }
        }

        const gender = admin.role === 'male_admin' ? 'male' : 'female';

        try {
            const res = await fetch('/api/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrToken, adminGender: gender }),
            });
            const data = await res.json();

            let type = 'error';
            let message = '';

            switch (data.status) {
                case 'success':
                    type = 'success';
                    message = t('admin.checkinSuccess');
                    break;
                case 'already_checked_in':
                    type = 'warning';
                    message = t('admin.checkinAlready');
                    break;
                case 'wrong_section':
                    type = 'error';
                    message = t('admin.checkinWrongSection');
                    break;
                case 'not_found':
                default:
                    type = 'error';
                    message = t('admin.checkinNotFound');
                    break;
            }

            setScanResult({
                type,
                message,
                studentName: data.studentName || '',
            });

            setIsScanning(false);
            setShowModal(true);

            // Refresh iftar counts in background (do not block UI)
            const genderFilter = admin.role === 'male_admin' ? 'male' : 'female';
            fetchTodayIftars(genderFilter).catch(console.error);
        } catch (err) {
            console.error(err);
            setScanResult({ type: 'error', message: t('admin.checkinNotFound') });
            setIsScanning(false);
            setShowModal(true);
        }
    }

    function closeResultModal() {
        setShowModal(false);
        setScanResult(null);
        isScanningRef.current = false;
        if (html5QrRef.current) {
            try { html5QrRef.current.resume(); } catch { }
        }
    }

    function startScanner() {
        setScannerActive(true);

        // Wait a short tick for React to render the div as visible (display: block)
        setTimeout(async () => {
            try {
                const { Html5Qrcode } = await import('html5-qrcode');

                if (html5QrRef.current) {
                    try { await html5QrRef.current.clear(); } catch { }
                }

                const scanner = new Html5Qrcode('qr-reader');
                html5QrRef.current = scanner;

                await scanner.start(
                    { facingMode: 'environment' }, // Force rear camera
                    {
                        fps: 30, // Increased for faster scanning
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        handleCheckin(decodedText);
                    },
                    (error) => {
                        // ignore errors during scan
                    }
                );
            } catch (err) {
                console.error('Scanner error:', err);
                setDialogConfig({
                    isOpen: true,
                    title: 'Camera Error',
                    message: 'Camera setup failed or denied. Please ensure camera permissions are granted.',
                    type: 'danger',
                    hideCancel: true,
                    onConfirm: () => setDialogConfig({ isOpen: false })
                });
                setScannerActive(false);
            }
        }, 100);
    }

    async function stopScanner() {
        if (html5QrRef.current) {
            try {
                // Must stop streaming before clearing
                await html5QrRef.current.stop();
                html5QrRef.current.clear();
            } catch (err) {
                console.error('Error stopping scanner', err);
            }
            html5QrRef.current = null;
        }
        setScannerActive(false);
    }

    async function handleLogout() {
        stopScanner();
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    }

    const iftar = iftars.find(i => i.id === selectedIftarId);

    if (loading) {
        return (
            <>
                <Header />
                <div className="empty-state">
                    <Loader2 className="spinner mx-auto" size={48} color="var(--brand-medium)" />
                </div>
            </>
        );
    }

    return (
        <>
            <Header showLogout onLogout={handleLogout} />
            <main className="container" style={{ paddingBottom: '40px' }}>
                <div className="page-header">
                    <h1 className="page-title">{t('admin.title')}</h1>
                    <p className="page-subtitle">{admin?.name}</p>
                </div>

                {!selectedIftarId ? (
                    iftars.length === 0 ? (
                        <div className="empty-state animate-fade-in">
                            <Moon size={64} color="var(--text-muted)" className="mb-3" style={{ margin: '0 auto' }} />
                            <p className="empty-state-text">{t('admin.noIftar')}</p>
                        </div>
                    ) : (
                        <div className="campaign-list animate-slide-up">
                            <h2 className="section-title mb-4">{t('admin.selectCampaign') || 'اختر حملة اليوم'}</h2>
                            {iftars.map(camp => (
                                <div key={camp.id} className="card mb-3" onClick={() => setSelectedIftarId(camp.id)} style={{ cursor: 'pointer', border: '1px solid var(--border-color)', transition: 'border-color 0.2s', padding: '20px' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--text-primary)' }}>{camp.title}</h3>
                                    <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        <span><strong>{t('admin.capacity')}:</strong> {camp.capacity}</span>
                                        <span><strong>{t('admin.registered')}:</strong> {camp.registered || 0}</span>
                                    </div>
                                    <div style={{ marginTop: '12px', color: 'var(--brand-primary)', fontWeight: '500', fontSize: '0.9rem' }}>
                                        {t('admin.viewCampaign') || 'عرض الحملة ومسح الـ QR'} &rarr;
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <>
                        <button className="btn btn-secondary mb-4" onClick={() => setSelectedIftarId(null)} style={{ padding: '8px 16px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            &larr; {t('admin.backToList') || 'العودة للقائمة'}
                        </button>

                        {/* Today's Iftar Info */}
                        <div className="card mb-3 animate-slide-up">
                            <h2 className="section-title">{t('admin.todayIftar')}</h2>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>{iftar?.title}</h3>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-value">{iftar?.capacity}</div>
                                    <div className="stat-label">{t('admin.capacity')}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{iftar?.registered || 0}</div>
                                    <div className="stat-label">{t('admin.registered')}</div>
                                </div>
                                <div className="stat-card" style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--brand-primary)', borderWidth: '2px' }}>
                                    <div className="stat-value" style={{ color: 'var(--brand-primary)' }}>{iftar?.arqamCount || 0}</div>
                                    <div className="stat-label flex items-center justify-center gap-1">
                                        <Users size={14} /> {t('home.arqamStudents') || 'طلاب الأرقم'}
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{iftar?.checkedIn || 0}</div>
                                    <div className="stat-label">{t('admin.checkedIn')}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{Math.max(0, (iftar?.registered || 0) - (iftar?.checkedIn || 0))}</div>
                                    <div className="stat-label">{t('admin.remaining')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Removes old inline Check-in Result string */}

                        {/* QR Scanner */}
                        <div className="card mb-3 animate-slide-up">
                            <h2 className="section-title">{t('admin.scanQR')}</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                {t('admin.scanPrompt')}
                            </p>

                            <div className="text-center mb-2">
                                {!scannerActive ? (
                                    <button className="btn btn-primary" onClick={startScanner}>
                                        <ScanLine size={20} /> {t('admin.scanQR')}
                                    </button>
                                ) : (
                                    <button className="btn btn-danger" onClick={stopScanner}>
                                        <StopCircle size={20} /> Stop
                                    </button>
                                )}
                            </div>

                            <div className="scanner-area" style={{ display: scannerActive ? 'block' : 'none' }}>
                                <div id="qr-reader" ref={scannerRef}></div>
                                {isScanning && (
                                    <div className="scanner-loading">
                                        <Loader2 className="spinner" size={40} color="var(--brand-medium)" />
                                        <div className="scanner-loading-text">{t('admin.checkingIn') || 'جاري التحقق...'}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Result Modal Overlay */}
                        {showModal && scanResult && (
                            <div className="modal-overlay">
                                <div className={`result-modal ${scanResult.type}`}>
                                    <div className="modal-icon flex justify-center mb-3">
                                        {scanResult.type === 'success' ? <CheckCircle2 size={64} className="text-emerald-500" color="var(--success)" /> :
                                            scanResult.type === 'warning' ? <AlertTriangle size={64} className="text-amber-500" color="var(--warning)" /> :
                                                <XCircle size={64} className="text-red-500" color="var(--danger)" />}
                                    </div>

                                    {scanResult.studentName && (
                                        <div className="modal-student">{scanResult.studentName}</div>
                                    )}

                                    <div className="modal-message">{scanResult.message}</div>

                                    <button
                                        className="btn btn-primary btn-full mt-3"
                                        onClick={closeResultModal}
                                    >
                                        {t('admin.btnContinue') || 'متابعة'}
                                    </button>
                                </div>
                            </div>
                        )}

                    </>
                )}
            </main>

            <ConfirmDialog
                isOpen={dialogConfig.isOpen}
                title={dialogConfig.title}
                message={dialogConfig.message}
                type={dialogConfig.type}
                hideCancel={dialogConfig.hideCancel}
                onConfirm={dialogConfig.onConfirm}
                onCancel={() => setDialogConfig({ isOpen: false })}
            />
        </>
    );
}
