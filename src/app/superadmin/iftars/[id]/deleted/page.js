'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { ArrowLeft, Loader2, Printer, Trash2 } from 'lucide-react';

export default function DeletedStudentsPage() {
    const { t, isRtl } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const iftarId = params.id;

    const [admin, setAdmin] = useState(null);
    const [deletedStudents, setDeletedStudents] = useState([]);
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

            await fetchDeletedStudents();
        } catch {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }

    async function fetchDeletedStudents() {
        try {
            const res = await fetch(`/api/registrations/deleted?iftarId=${iftarId}`);
            if (res.ok) {
                const data = await res.json();
                setDeletedStudents(data.deletedStudents || []);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    }

    const handlePrint = () => {
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

    return (
        <>
            <Header showLogout onLogout={handleLogout} />
            <main className="container" style={{ paddingBottom: '40px' }}>
                <div className="page-header" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '16px 0',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '24px',
                }}>
                    {/* Back Button Container */}
                    <div style={{ width: '44px', display: 'flex', justifyContent: isRtl ? 'flex-end' : 'flex-start' }} className="hide-print">
                        <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => router.push(`/superadmin/iftars/${iftarId}`)}
                            style={{ width: '40px', height: '40px', padding: 0 }}
                        >
                            <ArrowLeft size={20} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
                        </button>
                    </div>

                    {/* Title Container - Centered */}
                    <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
                        <h1 className="page-title" style={{
                            margin: 0,
                            fontSize: 'clamp(1rem, 4vw, 1.3rem)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}>
                            <Trash2 size={24} style={{ color: 'var(--danger)' }} /> {isRtl ? 'سجل الطلاب المحذوفين' : 'Deleted Students Report'}
                        </h1>
                    </div>

                    {/* Actions Container */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: isRtl ? 'flex-start' : 'flex-end',
                        minWidth: 'auto'
                    }} className="hide-print">
                        <button
                            className="btn btn-primary btn-sm flex items-center gap-1"
                            onClick={handlePrint}
                            style={{ height: '38px', padding: '0 10px', fontSize: '0.85rem' }}
                        >
                            <Printer size={16} /> <span>{t('superadmin.printReport') || 'طباعة / Report'}</span>
                        </button>
                    </div>
                </div>

                <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    {deletedStudents.length === 0 ? (
                        <div className="empty-state py-4">
                            <p className="empty-state-text">{isRtl ? 'لا يوجد طلاب محذوفين.' : 'No deleted students yet.'}</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>{t('admin.studentName') || 'الاسم (Name)'}</th>
                                        <th className="text-center">{isRtl ? 'رقم التلفون' : 'Phone'}</th>
                                        <th className="text-center">{t('admin.registrationTime') || 'تاريخ التسجيل (Reg. Date)'}</th>
                                        <th className="text-center">{isRtl ? 'تاريخ الحذف (Del. Date)' : 'Del. Date'}</th>
                                        <th className="text-center">{isRtl ? 'بواسطة (By)' : 'By'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deletedStudents.map((student, index) => {
                                        const formatDate = (dateString) => {
                                            if (!dateString) return '—';
                                            try {
                                                const d = new Date(dateString);
                                                const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
                                                const local = new Date(utc + (3600000 * 3));
                                                return `${String(local.getDate()).padStart(2, '0')}/${String(local.getMonth() + 1).padStart(2, '0')}/${local.getFullYear()} ${String(local.getHours()).padStart(2, '0')}:${String(local.getMinutes()).padStart(2, '0')}`;
                                            } catch {
                                                return '—';
                                            }
                                        };

                                        return (
                                            <tr key={student.id}>
                                                <td className="text-muted">{index + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{student.student_name || '—'}</td>
                                                <td className="text-center text-muted" style={{ direction: 'ltr' }}>{student.mobile_number || '—'}</td>
                                                <td className="text-center text-muted" style={{ fontSize: '0.85rem' }}>{formatDate(student.registered_at)}</td>
                                                <td className="text-center text-muted" style={{ fontSize: '0.85rem' }}>{formatDate(student.deleted_at)}</td>
                                                <td className="text-center"><span className="badge badge-inactive">{student.deleted_by || '—'}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
