'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function AdminPage() {
    const { t } = useTranslation();
    const router = useRouter();

    const [admin, setAdmin] = useState(null);
    const [iftar, setIftar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanResult, setScanResult] = useState(null);
    const [scannerActive, setScannerActive] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [manualToken, setManualToken] = useState('');
    const scannerRef = useRef(null);
    const html5QrRef = useRef(null);

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
            await fetchTodayIftar(data.role === 'male_admin' ? 'male' : 'female');
        } catch {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }

    async function fetchTodayIftar(gender) {
        const res = await fetch(`/api/iftars?gender=${gender}`);
        const data = await res.json();
        if (data.iftars && data.iftars.length > 0) {
            setIftar(data.iftars[0]);
        }
    }

    async function handleCheckin(qrToken) {
        if (isScanning || showModal) return; // Prevent double scans

        setIsScanning(true);
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
                    message = t('admin.statusSuccess');
                    break;
                case 'already_checked_in':
                    type = 'warning';
                    message = t('admin.statusAlready');
                    break;
                case 'wrong_section':
                    type = 'error';
                    message = t('admin.statusWrongSection');
                    break;
                case 'not_found':
                default:
                    type = 'error';
                    message = t('admin.statusNotFound');
                    break;
            }

            setScanResult({
                type,
                message,
                studentName: data.studentName || '',
            });

            // Refresh iftar counts
            const genderFilter = admin.role === 'male_admin' ? 'male' : 'female';
            await fetchTodayIftar(genderFilter);

            setIsScanning(false);
            setShowModal(true);

            if (html5QrRef.current) {
                html5QrRef.current.pause(true);
            }

        } catch (err) {
            console.error(err);
            setScanResult({ type: 'error', message: t('admin.statusNotFound') });
            setIsScanning(false);
            setShowModal(true);
            if (html5QrRef.current) {
                html5QrRef.current.pause(true);
            }
        }
    }

    function closeResultModal() {
        setShowModal(false);
        setScanResult(null);
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
                        fps: 10,
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
                alert('Camera setup failed or denied. Please ensure camera permissions are granted.');
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

    function handleManualSubmit(e) {
        e.preventDefault();
        if (manualToken.trim()) {
            handleCheckin(manualToken.trim());
            setManualToken('');
        }
    }

    async function handleLogout() {
        stopScanner();
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    }

    if (loading) {
        return (
            <>
                <Header />
                <div className="empty-state"><div className="empty-state-icon">⏳</div></div>
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

                {!iftar ? (
                    <div className="empty-state animate-fade-in">
                        <div className="empty-state-icon">🌙</div>
                        <p className="empty-state-text">{t('admin.noIftar')}</p>
                    </div>
                ) : (
                    <>
                        {/* Today's Iftar Info */}
                        <div className="card mb-3 animate-slide-up">
                            <h2 className="section-title">{t('admin.todayIftar')}</h2>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>{iftar.title}</h3>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-value">{iftar.capacity}</div>
                                    <div className="stat-label">{t('admin.capacity')}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{iftar.registered || 0}</div>
                                    <div className="stat-label">{t('admin.registered')}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{iftar.checkedIn || 0}</div>
                                    <div className="stat-label">{t('admin.checkedIn')}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{Math.max(0, (iftar.registered || 0) - (iftar.checkedIn || 0))}</div>
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
                                        📷 {t('admin.scanQR')}
                                    </button>
                                ) : (
                                    <button className="btn btn-danger" onClick={stopScanner}>
                                        ⏹ Stop
                                    </button>
                                )}
                            </div>

                            <div className="scanner-area" style={{ display: scannerActive ? 'block' : 'none' }}>
                                <div id="qr-reader" ref={scannerRef}></div>
                                {isScanning && (
                                    <div className="scanner-loading">
                                        <div className="spinner"></div>
                                        <div className="scanner-loading-text">{t('admin.checkingIn') || 'جاري التحقق...'}</div>
                                    </div>
                                )}
                            </div>

                            {/* Manual Token Input */}
                            <div className="mt-3">
                                <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Manual Token..."
                                        value={manualToken}
                                        onChange={(e) => setManualToken(e.target.value)}
                                        dir="ltr"
                                        style={{ flex: 1 }}
                                    />
                                    <button type="submit" className="btn btn-primary btn-sm">
                                        ✓
                                    </button>
                                </form>
                            </div>
                        </div>
                        {/* Result Modal Overlay */}
                        {showModal && scanResult && (
                            <div className="modal-overlay">
                                <div className={`result-modal ${scanResult.type}`}>
                                    <div className="modal-icon">
                                        {scanResult.type === 'success' ? '✅' : scanResult.type === 'warning' ? '⚠️' : '❌'}
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
        </>
    );
}
