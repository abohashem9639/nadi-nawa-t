'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { ArrowLeft, CheckCircle2, Circle, Loader2, Users, Printer } from 'lucide-react';

export default function SuperAdminIftarDetailsPage() {
    const { t, isRtl } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const iftarId = params.id;

    const [admin, setAdmin] = useState(null);
    const [iftar, setIftar] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [dialogConfig, setDialogConfig] = useState({ isOpen: false });

    useEffect(() => {
        checkAuth();
    }, [iftarId]);

    async function checkAuth() {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (!data.authenticated || data.role !== 'superadmin') {
                router.push('/login');
                return;
            }
            setAdmin(data);

            if (!iftarId) {
                router.push('/superadmin');
                return;
            }

            await Promise.all([fetchIftarDetails(), fetchStudents()]);
        } catch {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }

    async function fetchIftarDetails() {
        try {
            const res = await fetch(`/api/stats/${iftarId}`);
            if (res.ok) {
                const data = await res.json();
                setIftar(data.iftar);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function fetchStudents() {
        try {
            // Using the shared api for fetching students 
            const res = await fetch(`/api/registrations?iftarId=${iftarId}`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data.students || []);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    }

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    }

    const printReport = () => {
        window.print();
    };

    if (loading) {
        return (
            <>
                <Header showLogout onLogout={handleLogout} />
                <div className="empty-state">
                    <Loader2 className="spinner mx-auto" size={48} color="var(--brand-medium)" />
                </div>
            </>
        );
    }

    // Calculations for percentages
    const totalRegistered = iftar?.registered || 0;
    const checkedIn = iftar?.checkedIn || 0;
    const absent = Math.max(0, totalRegistered - checkedIn);
    const attendancePercent = totalRegistered > 0 ? Math.round((checkedIn / totalRegistered) * 100) : 0;
    const absentPercent = totalRegistered > 0 ? Math.round((absent / totalRegistered) * 100) : 0;

    return (
        <>
            <Header showLogout onLogout={handleLogout} />
            <main className="container" style={{ paddingBottom: '40px' }}>
                <div className="page-header" style={{ position: 'relative' }}>
                    <button
                        className="btn btn-secondary btn-icon"
                        style={{ position: 'absolute', [isRtl ? 'right' : 'left']: 0, top: '50%', transform: 'translateY(-50%)' }}
                        onClick={() => router.push('/superadmin')}
                    >
                        <ArrowLeft size={20} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
                    </button>
                    <button
                        className="btn btn-primary btn-sm flex items-center gap-2"
                        style={{ position: 'absolute', [isRtl ? 'left' : 'right']: 0, top: '50%', transform: 'translateY(-50%)' }}
                        onClick={printReport}
                    >
                        <Printer size={16} /> <span className="hide-mobile">{t('superadmin.printReport') || 'تحميل التقرير (PDF)'}</span>
                    </button>
                    <h1 className="page-title">{t('superadmin.stats') || 'تفاصيل الإفطار والإحصائيات'}</h1>
                    <p className="page-subtitle">{iftar?.title}</p>
                </div>

                {iftar && (
                    <div className="card mb-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="section-title mb-0">{t('superadmin.stats') || 'الإحصائيات'}</h2>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-value">{iftar.capacity}</div>
                                <div className="stat-label">{t('admin.capacity') || 'السعة الإجمالية'}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{totalRegistered}</div>
                                <div className="stat-label">{t('admin.registered') || 'المسجلين'}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">
                                    {checkedIn} <span style={{ fontSize: '1.2rem', color: 'var(--success)' }}>({attendancePercent}%)</span>
                                </div>
                                <div className="stat-label">{t('admin.checkedIn') || 'الحاضرين'}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">
                                    {absent} <span style={{ fontSize: '1.2rem', color: 'var(--danger)' }}>({absentPercent}%)</span>
                                </div>
                                <div className="stat-label">{t('admin.remaining') || 'الغياب'}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="section-title mb-0 flex items-center gap-2">
                            <Users size={20} /> سجل الطلاب
                        </h2>
                    </div>

                    {students.length === 0 ? (
                        <div className="empty-state py-4">
                            <p className="empty-state-text">No students registered yet.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>{t('admin.studentName') || 'الاسم'}</th>
                                        <th className="text-center">{t('admin.checkedIn') || 'الحضور'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => (
                                        <tr key={student.id}>
                                            <td className="text-muted">{index + 1}</td>
                                            <td style={{ fontWeight: student.checked_in ? 600 : 400 }}>
                                                {student.student_name}
                                            </td>
                                            <td className="text-center">
                                                {student.checked_in === 1 ? (
                                                    <CheckCircle2 size={20} className="text-emerald-500 mx-auto" />
                                                ) : (
                                                    <Circle size={20} className="text-slate-300 mx-auto" />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
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
