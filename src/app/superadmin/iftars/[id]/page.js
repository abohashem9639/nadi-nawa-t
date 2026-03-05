'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { ArrowLeft, CheckCircle2, Circle, Loader2, Users, Printer, Trash2, Search, FileText, Trash } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SuperAdminIftarDetailsPage() {
    const { t, isRtl } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const iftarId = params.id;

    const [admin, setAdmin] = useState(null);
    const [iftar, setIftar] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deletedStudents, setDeletedStudents] = useState([]);

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

            await Promise.all([fetchIftarDetails(), fetchStudents(), fetchDeletedStudents()]);
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



    const downloadStatsPDF = () => {
        try {
            console.log("Starting Stats PDF generation for:", iftarId);

            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            // Title
            doc.setFontSize(18);
            doc.text("Statistics & Student Records", 105, 20, { align: 'center' });

            // Subtitles
            doc.setFontSize(12);
            doc.text(`Iftar: ${iftar?.title || '—'}`, 105, 28, { align: 'center' });
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 34, { align: 'center' });

            // 1. Summary Statistics Table
            const summaryTableOptions = {
                startY: 42,
                head: [['Statistic', 'Value']],
                body: [
                    ['Total Capacity', iftar?.capacity || 0],
                    ['Registered Students', totalRegistered],
                    ['Arqam Students', iftar?.arqamCount || 0],
                    ['Checked In (Attended)', `${checkedIn} (${attendancePercent}%)`],
                    ['Absent (Remaining)', `${absent} (${absentPercent}%)`]
                ],
                theme: 'grid',
                headStyles: { fillColor: [166, 110, 41] },
                styles: { fontSize: 10, cellPadding: 3 },
                margin: { left: 40, right: 40 }
            };

            try {
                autoTable(doc, summaryTableOptions);
            } catch (err) {
                if (typeof doc.autoTable === 'function') {
                    doc.autoTable(summaryTableOptions);
                }
            }

            // 2. Student Records Table
            const filteredStudents = students.filter(student =>
                student.student_name.toLowerCase().includes(searchQuery.toLowerCase())
            );

            const tableData = filteredStudents.map((s, i) => {
                const formatDate = (date) => {
                    if (!date) return '—';
                    try {
                        const d = new Date(date);
                        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
                        const local = new Date(utc + (3600000 * 3));
                        const day = String(local.getDate()).padStart(2, '0');
                        const month = String(local.getMonth() + 1).padStart(2, '0');
                        const hours = String(local.getHours()).padStart(2, '0');
                        const mins = String(local.getMinutes()).padStart(2, '0');
                        return `${day}/${month} ${hours}:${mins}`;
                    } catch { return '—'; }
                };
                return [
                    i + 1,
                    s.student_name || '—',
                    formatDate(s.registered_at),
                    s.checked_in === 1 ? 'Present' : 'Absent'
                ];
            });

            const recordsTableOptions = {
                startY: doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 12 : 100,
                head: [['#', 'Student Name', 'Registration Time', 'Status']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [166, 110, 41] },
                styles: { fontSize: 8, cellPadding: 2 }
            };

            try {
                autoTable(doc, recordsTableOptions);
            } catch (err) {
                if (typeof doc.autoTable === 'function') {
                    doc.autoTable(recordsTableOptions);
                }
            }

            doc.save(`stats_report_${iftarId}.pdf`);
            console.log("Stats PDF download triggered");
        } catch (error) {
            console.error("Stats PDF generation failed:", error);
            alert("Error generating PDF: " + (error.message || "Unknown error"));
        }
    };

    const handleDeleteStudent = (studentId, studentName) => {
        setDialogConfig({
            isOpen: true,
            title: t('superadmin.deleteStudent') || 'حذف الطالب',
            message: `${t('superadmin.deleteStudentConfirm') || 'هل أنت متأكد أنك تريد حذف هذا الطالب من القائمة نهائياً؟'}\n${studentName}`,
            type: 'danger',
            onConfirm: async () => {
                setDialogConfig({ isOpen: false });
                try {
                    const res = await fetch(`/api/registrations/${studentId}`, {
                        method: 'DELETE'
                    });
                    if (res.ok) {
                        await Promise.all([fetchIftarDetails(), fetchStudents(), fetchDeletedStudents()]);
                    } else {
                        alert(t('register.error') || 'Error deleting student');
                    }
                } catch (err) {
                    console.error("Error deleting student:", err);
                    alert(t('register.error') || 'Error deleting student');
                }
            }
        });
    };

    const downloadDeletedPDF = () => {
        try {
            console.log("Starting PDF generation for:", iftarId);
            if (!deletedStudents || deletedStudents.length === 0) {
                alert("No deleted students to export.");
                return;
            }

            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            doc.setFontSize(18);
            doc.text("Deleted Students Report", 105, 20, { align: 'center' });

            doc.setFontSize(12);
            doc.text(`Iftar: ${iftar?.title || '—'}`, 105, 28, { align: 'center' });
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 34, { align: 'center' });

            const tableData = deletedStudents.map((s, i) => {
                const formatDate = (date) => {
                    if (!date) return '—';
                    try {
                        const d = new Date(date);
                        return d.toLocaleString();
                    } catch { return '—'; }
                };
                return [
                    i + 1,
                    s.student_name || '—',
                    s.mobile_number || '—',
                    formatDate(s.registered_at),
                    formatDate(s.deleted_at),
                    s.deleted_by || '—'
                ];
            });

            // Robust autoTable call
            try {
                autoTable(doc, {
                    startY: 42,
                    head: [['#', 'Name', 'Phone', 'Reg. Date', 'Del. Date', 'By']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [166, 110, 41] },
                    styles: { fontSize: 8, cellPadding: 2 }
                });
            } catch (innerError) {
                console.error("autoTable function call failed, trying doc.autoTable", innerError);
                if (typeof doc.autoTable === 'function') {
                    doc.autoTable({
                        startY: 42,
                        head: [['#', 'Name', 'Phone', 'Reg. Date', 'Del. Date', 'By']],
                        body: tableData,
                        theme: 'striped',
                        headStyles: { fillColor: [166, 110, 41] },
                        styles: { fontSize: 8, cellPadding: 2 }
                    });
                } else {
                    throw new Error("autoTable plugin not found");
                }
            }

            console.log("Saving PDF...");
            doc.save(`deleted_students_${iftarId}.pdf`);
            console.log("PDF download triggered");
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Error generating PDF: " + (error.message || "Unknown error"));
        }
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

    const nameCounts = {};
    const latestRegistrationId = {};
    students.forEach(s => {
        nameCounts[s.student_name] = (nameCounts[s.student_name] || 0) + 1;
        latestRegistrationId[s.student_name] = s.id; // Because students are sorted by date ASC, the last id is the latest
    });
    const duplicateStudentsCount = students.filter(s => nameCounts[s.student_name] > 1).length;

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
                    position: 'relative'
                }}>
                    {/* Back Button Container */}
                    <div style={{ width: '44px', display: 'flex', justifyContent: isRtl ? 'flex-end' : 'flex-start' }}>
                        <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => router.push('/superadmin')}
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
                            textOverflow: 'ellipsis'
                        }}>
                            {t('superadmin.stats') || 'Statistics'}
                        </h1>
                        <p className="page-subtitle" style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>{iftar?.title}</p>
                    </div>

                    {/* Actions Container */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: isRtl ? 'flex-start' : 'flex-end',
                        minWidth: 'auto'
                    }} className="hide-print">
                        {deletedStudents.length > 0 && (
                            <button
                                className="btn btn-secondary btn-sm flex items-center gap-1"
                                style={{
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    color: '#ef4444',
                                    borderColor: 'rgba(239, 68, 68, 0.2)',
                                    height: '38px',
                                    padding: '0 10px',
                                    fontSize: '0.85rem'
                                }}
                                onClick={downloadDeletedPDF}
                            >
                                <Trash2 size={16} /> <span>{isRtl ? 'المحذوفين' : 'Deleted'}</span>
                            </button>
                        )}
                        <button
                            className="btn btn-primary btn-sm flex items-center gap-1"
                            onClick={downloadStatsPDF}
                            style={{ height: '38px', padding: '0 10px', fontSize: '0.85rem' }}
                        >
                            <Printer size={16} /> <span>{t('superadmin.printReport') || 'Report'}</span>
                        </button>
                    </div>
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
                            <div className="stat-card" style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--brand-medium)', borderWidth: '2px' }}>
                                <div className="stat-value" style={{ color: 'var(--brand-medium)' }}>{iftar.arqamCount || 0}</div>
                                <div className="stat-label flex items-center justify-center gap-1">
                                    <Users size={14} /> {t('home.arqamStudents') || 'طلاب الأرقم'}
                                </div>
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
                    <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
                        <h2 className="section-title mb-0 flex items-center gap-2">
                            <Users size={20} /> سجل الطلاب
                            {duplicateStudentsCount > 0 && (
                                <span className="badge hide-print" style={{ background: 'var(--warning)', color: '#fff', fontSize: '0.8rem', padding: '2px 8px' }}>
                                    {duplicateStudentsCount} مكرر
                                </span>
                            )}
                        </h2>
                        <div className="search-container hide-print" style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                            <Search size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRtl ? 'right' : 'left']: '12px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder={t('admin.searchStudent') || 'بحث عن طالب...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ padding: isRtl ? '8px 36px 8px 12px' : '8px 12px 8px 36px', height: '40px', fontSize: '0.9rem' }}
                            />
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
                                        <th className="text-center">{t('admin.registrationTime') || 'وقت التسجيل'}</th>
                                        <th className="text-center">{t('admin.checkedIn') || 'الحضور'}</th>
                                        <th className="text-center hide-print">{t('superadmin.delete') || 'حذف'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students
                                        .filter(student => student.student_name.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((student, index) => {
                                            const isDuplicate = nameCounts[student.student_name] > 1;
                                            const isLatest = isDuplicate && latestRegistrationId[student.student_name] === student.id;
                                            const isOldDuplicate = isDuplicate && !isLatest;

                                            let rowBg = 'transparent';
                                            let badgeColor = '';
                                            let badgeText = '';

                                            if (isOldDuplicate) {
                                                rowBg = 'var(--danger-bg)';
                                                badgeColor = 'var(--danger)';
                                                badgeText = '(نسخة قديمة - تُحذف)';
                                            } else if (isLatest) {
                                                rowBg = 'var(--success-bg)';
                                                badgeColor = 'var(--success)';
                                                badgeText = '(النسخة الأحدث - تُحفظ)';
                                            }

                                            return (
                                                <tr key={student.id} style={{ backgroundColor: rowBg }}>
                                                    <td className="text-muted">{index + 1}</td>
                                                    <td style={{ fontWeight: student.checked_in ? 600 : 400 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {student.student_name}
                                                            {isDuplicate && <span className="hide-print" style={{ color: badgeColor, fontSize: '0.8rem', fontWeight: 'bold' }}>{badgeText}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="text-center text-muted" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                        {student.registered_at ? (() => {
                                                            const d = new Date(student.registered_at);
                                                            const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
                                                            const local = new Date(utc + (3600000 * 3));
                                                            const day = String(local.getDate()).padStart(2, '0');
                                                            const month = String(local.getMonth() + 1).padStart(2, '0');
                                                            const hours = String(local.getHours()).padStart(2, '0');
                                                            const mins = String(local.getMinutes()).padStart(2, '0');
                                                            return `${day}/${month} ${hours}:${mins}`;
                                                        })() : '—'}
                                                    </td>
                                                    <td className="text-center">
                                                        {student.checked_in === 1 ? (
                                                            <CheckCircle2 size={20} className="text-emerald-500 mx-auto" />
                                                        ) : (
                                                            <Circle size={20} className="text-slate-300 mx-auto" />
                                                        )}
                                                    </td>
                                                    <td className="text-center hide-print">
                                                        <button
                                                            className="btn btn-sm btn-icon"
                                                            style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '6px', margin: '0 auto', display: 'flex' }}
                                                            onClick={() => handleDeleteStudent(student.id, student.student_name)}
                                                            title={t('superadmin.deleteStudent') || 'حذف الطالب'}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
