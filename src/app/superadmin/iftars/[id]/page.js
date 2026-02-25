'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Loader2, ArrowLeft, Users, CheckCircle2, Circle, UserX, UserCheck } from 'lucide-react';

export default function SuperAdminIftarDetailsPage() {
    const { t, isRtl } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const iftarId = params.id;

    const [admin, setAdmin] = useState(null);
    const [iftar, setIftar] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const formatWhatsAppNumber = (number) => {
        let cleanNumber = number.replace(/\D/g, '');
        return cleanNumber;
    };

    async function blockStudent(mobileNumber, action) {
        if (!confirm(t(action === 'ban' ? 'admin.banConfirm' : 'admin.unbanConfirm') || 'Are you sure?')) return;
        try {
            const res = await fetch('/api/ban', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobileNumber, action })
            });
            if (res.ok) {
                fetchStudents(); // Refresh
            } else {
                alert(t('admin.banError') || 'Error occurred');
            }
        } catch (error) {
            console.error(error);
            alert(t('admin.banError') || 'Error occurred');
        }
    }

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
                                <div className="stat-value">{iftar.registered}</div>
                                <div className="stat-label">{t('admin.registered') || 'المسجلين'}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{iftar.checkedIn}</div>
                                <div className="stat-label">{t('admin.checkedIn') || 'الحاضرين'}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{Math.max(0, iftar.registered - iftar.checkedIn)}</div>
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
                                        <th>{t('register.mobile') || 'رقم الجوال'}</th>
                                        <th className="text-center">{t('admin.checkedIn') || 'الحضور'}</th>
                                        <th className="text-center">WhatsApp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => (
                                        <tr key={student.id}>
                                            <td className="text-muted">{index + 1}</td>
                                            <td style={{ fontWeight: student.checked_in ? 600 : 400 }}>
                                                {student.student_name}
                                            </td>
                                            <td dir="ltr" className="text-muted">
                                                {student.mobile_number}
                                            </td>
                                            <td className="text-center">
                                                {student.checked_in === 1 ? (
                                                    <CheckCircle2 size={20} className="text-emerald-500 mx-auto" />
                                                ) : (
                                                    <Circle size={20} className="text-slate-300 mx-auto" />
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <div className="flex justify-center gap-2">
                                                    <a
                                                        href={`https://wa.me/${formatWhatsAppNumber(student.mobile_number)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-sm"
                                                        style={{ backgroundColor: '#25D366', color: 'white', borderColor: '#25D366', padding: '6px' }}
                                                        title="WhatsApp"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path fillRule="evenodd" clipRule="evenodd" d="M12.0135 1.5C6.21633 1.5 1.5 6.22234 1.5 12.0268C1.5 13.9114 1.99653 15.6841 2.86877 17.2081L1.5034 22.1837L6.56839 20.854C8.0435 21.6563 9.77197 22.1154 11.6094 22.1154C17.4087 22.1154 22.1265 17.394 22.1265 11.5875C22.1265 5.78311 17.4087 1.5 12.0135 1.5ZM17.4565 15.4377C17.218 16.1098 16.2736 16.6853 15.5562 16.8378C15.0617 16.9427 14.3314 17.027 11.7582 15.961C8.46194 14.5956 6.33152 11.2384 6.16664 11.0206C6.00282 10.8016 4.8091 9.2154 4.8091 7.57508C4.8091 5.93475 5.64283 5.13885 5.9723 4.80053C6.23933 4.5262 6.671 4.40742 7.08253 4.40742C7.21527 4.40742 7.3323 4.41285 7.43399 4.41774C7.74239 4.43265 7.89669 4.45331 8.09914 4.94523C8.34685 5.54636 8.9554 7.03433 9.02983 7.18683C9.10425 7.34042 9.17066 7.52655 9.07923 7.71268C8.98779 7.89882 8.91336 8.01928 8.76435 8.19293C8.61639 8.36658 8.45524 8.54673 8.31828 8.68331C8.16928 8.83582 8.01188 8.99591 8.18553 9.29437C8.35811 9.59392 8.95111 10.5619 9.82436 11.3392C10.9531 12.3444 11.8596 12.6688 12.1818 12.8055C12.5029 12.941 12.8752 12.9204 13.0858 12.6936C13.2964 12.4667 13.918 11.7421 14.1668 11.2951C14.4145 10.8491 14.6622 10.9099 15.0346 11.0454C15.4059 11.182 17.3888 12.1583 17.7854 12.3568C18.182 12.5554 18.4468 12.6552 18.5462 12.8163C18.6445 12.9774 18.6445 13.7337 18.406 14.4068H18.4071L17.4565 15.4377Z" fill="currentColor" />
                                                        </svg>
                                                    </a>
                                                    {student.is_banned === 1 ? (
                                                        <button
                                                            className="btn btn-sm"
                                                            style={{ backgroundColor: '#64748b', color: 'white', borderColor: '#64748b', padding: '6px' }}
                                                            onClick={() => blockStudent(student.mobile_number, 'unban')}
                                                            title={t('admin.unbanStudent') || "إلغاء الحظر"}
                                                        >
                                                            <UserCheck size={18} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="btn btn-sm"
                                                            style={{ backgroundColor: '#ef4444', color: 'white', borderColor: '#ef4444', padding: '6px' }}
                                                            onClick={() => blockStudent(student.mobile_number, 'ban')}
                                                            title={t('admin.banStudent') || "حظر"}
                                                        >
                                                            <UserX size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
