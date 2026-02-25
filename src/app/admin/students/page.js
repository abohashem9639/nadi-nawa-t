'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Loader2, ArrowLeft, MessageCircle, CheckCircle2, Circle } from 'lucide-react';

function AdminStudentsContent() {
    const { t, dir } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const iftarId = searchParams.get('iftarId');

    const [admin, setAdmin] = useState(null);
    const [students, setStudents] = useState([]);
    const [iftarTitle, setIftarTitle] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (!data.authenticated || !['superadmin', 'male_admin', 'female_admin'].includes(data.role)) {
                router.push('/login');
                return;
            }
            setAdmin(data);

            if (!iftarId) {
                router.push(data.role === 'superadmin' ? '/superadmin' : '/admin');
                return;
            }

            await fetchStudents();
        } catch {
            router.push('/login');
        }
    }

    async function fetchStudents() {
        try {
            // First fetch the iftar details to get the title
            const allIftarsRes = await fetch('/api/iftars?all=true');
            const allIftarsData = await allIftarsRes.json();
            const currentIftar = allIftarsData.iftars?.find(i => i.id === iftarId);
            if (currentIftar) {
                setIftarTitle(currentIftar.title);
            }

            // Then fetch the registered students for this iftar
            const res = await fetch(`/api/registrations?iftarId=${iftarId}`);
            if (!res.ok) throw new Error('Failed to fetch students');

            const data = await res.json();
            setStudents(data.students || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    }

    // Function to format the phone number for WhatsApp API
    const formatWhatsAppNumber = (number) => {
        // Remove spaces, dashes, plus signs, or any non-numeric characters
        let cleanNumber = number.replace(/\D/g, '');

        // WhatsApp API requires the country code without the '+' sign
        // The mobile_number from the DB already includes the country code (e.g. +90...)
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
                        onClick={() => router.push(admin?.role === 'superadmin' ? '/superadmin' : '/admin')}
                    >
                        <ArrowLeft size={20} style={{ transform: dir === 'rtl' ? 'rotate(180deg)' : 'none' }} />
                    </button>
                    <h1 className="page-title">{t('admin.viewStudents') || 'سجل الطلاب'}</h1>
                    <p className="page-subtitle">{iftarTitle}</p>
                </div>

                <div className="card animate-slide-up">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="section-title mb-0">{t('admin.registered')}: {students.length}</h2>
                        <div className="badge badge-success flex items-center gap-1">
                            <CheckCircle2 size={14} /> {students.filter(s => s.checked_in === 1).length} {t('admin.checkedIn')}
                        </div>
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

export default function AdminStudentsPage() {
    return (
        <Suspense fallback={<div className="empty-state"><Loader2 className="spinner mx-auto" size={48} color="var(--brand-medium)" /></div>}>
            <AdminStudentsContent />
        </Suspense>
    );
}
