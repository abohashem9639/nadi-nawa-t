'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Loader2, ArrowLeft, Users, CheckCircle2, Circle, MessageCircle } from 'lucide-react';

export default function SuperAdminIftarDetailsPage() {
    const { t, dir } = useTranslation();
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
                        style={{ position: 'absolute', [dir === 'rtl' ? 'right' : 'left']: 0, top: '50%', transform: 'translateY(-50%)' }}
                        onClick={() => router.push('/superadmin')}
                    >
                        <ArrowLeft size={20} style={{ transform: dir === 'rtl' ? 'rotate(180deg)' : 'none' }} />
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
                                                <a
                                                    href={`https://wa.me/${formatWhatsAppNumber(student.mobile_number)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm"
                                                    style={{ backgroundColor: '#25D366', color: 'white', borderColor: '#25D366', padding: '6px' }}
                                                    title="Mesaage on WhatsApp"
                                                >
                                                    <MessageCircle size={18} />
                                                </a>
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
