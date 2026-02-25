'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Loader2, Moon, Users, Shield } from 'lucide-react';

export default function SuperAdminPage() {
    const { t, isRtl } = useTranslation();
    const router = useRouter();

    const [admin, setAdmin] = useState(null);
    const [iftars, setIftars] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    // Create Iftar Form
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [capacity, setCapacity] = useState('');
    const [gender, setGender] = useState('male');
    const [creating, setCreating] = useState(false);

    const [dialogConfig, setDialogConfig] = useState({ isOpen: false });

    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (!data.authenticated || data.role !== 'superadmin') {
                router.push('/login');
                return;
            }
            setAdmin(data);
            await Promise.all([fetchIftars(), fetchStats()]);
        } catch {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }

    async function fetchIftars() {
        const res = await fetch('/api/iftars?all=true');
        const data = await res.json();
        setIftars(data.iftars || []);
    }

    async function fetchStats() {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setStats(data);
    }

    async function handleCreate(e) {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch('/api/iftars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, date, capacity: parseInt(capacity), gender }),
            });
            if (res.ok) {
                setTitle('');
                setDate('');
                setCapacity('');
                setGender('male');
                await Promise.all([fetchIftars(), fetchStats()]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    }

    async function toggleActive(id) {
        setDialogConfig({
            isOpen: true,
            title: t('superadmin.toggleActive') || 'Toggle Iftar Status',
            message: t('superadmin.toggleIftarConfirm') || 'Are you sure you want to toggle the status of this iftar?',
            type: 'primary',
            onConfirm: async () => {
                await fetch(`/api/iftars/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ toggleActive: true }),
                });
                await fetchIftars();
            }
        });
    }

    async function deleteIftar(id) {
        setDialogConfig({
            isOpen: true,
            title: t('superadmin.delete') || 'Delete',
            message: t('superadmin.deleteConfirm') || 'Are you sure you want to delete this iftar?',
            type: 'danger',
            onConfirm: async () => {
                await fetch(`/api/iftars/${id}`, { method: 'DELETE' });
                await Promise.all([fetchIftars(), fetchStats()]);
            }
        });
    }

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    }

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
                    <h1 className="page-title">{t('superadmin.title')}</h1>
                    <p className="page-subtitle mb-3">{admin?.name}</p>

                    <button
                        className="btn btn-secondary btn-sm flex items-center gap-2"
                        onClick={() => router.push('/superadmin/admins')}
                        style={{ margin: '0 auto', opacity: 0.9 }}
                    >
                        <Shield size={16} /> {isRtl ? 'إدارة المشرفين' : 'Manage Admins'}
                    </button>
                </div>

                {/* Stats */}
                <div className="stats-grid animate-fade-in">
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalIftars || 0}</div>
                        <div className="stat-label">{t('superadmin.totalIftars')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalRegistrations || 0}</div>
                        <div className="stat-label">{t('superadmin.totalRegistrations')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalCheckins || 0}</div>
                        <div className="stat-label">{t('superadmin.totalCheckins')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.todayRegistrations || 0}</div>
                        <div className="stat-label">{t('superadmin.todayRegistrations')}</div>
                    </div>
                </div>

                {/* Create Iftar Form */}
                <div className="card mb-3 animate-slide-up">
                    <h2 className="section-title">{t('superadmin.createIftar')}</h2>
                    <form onSubmit={handleCreate}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">{t('superadmin.iftarTitle')}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={t('superadmin.iftarTitlePlaceholder')}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">{t('superadmin.date')}</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    dir="ltr"
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">{t('superadmin.capacity')}</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="1"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    required
                                    dir="ltr"
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">{t('superadmin.gender')}</label>
                                <select
                                    className="form-select"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                >
                                    <option value="male">{t('superadmin.male')}</option>
                                    <option value="female">{t('superadmin.female')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-2">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={creating}
                            >
                                {creating ? t('superadmin.creating') : t('superadmin.create')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* All Iftars Table */}
                <div className="card animate-slide-up">
                    <h2 className="section-title">{t('superadmin.allIftars')}</h2>

                    {iftars.length === 0 ? (
                        <div className="empty-state">
                            <Moon size={64} color="var(--text-muted)" className="mb-3" style={{ margin: '0 auto' }} />
                            <p className="empty-state-text">No iftars yet</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{t('superadmin.iftarTitle')}</th>
                                        <th>{t('superadmin.date')}</th>
                                        <th>{t('superadmin.gender')}</th>
                                        <th>{t('superadmin.capacity')}</th>
                                        <th>{t('admin.registered')}</th>
                                        <th>{t('admin.checkedIn')}</th>
                                        <th>{t('admin.viewStudents') || 'الطلاب'}</th>
                                        <th>{t('superadmin.toggleActive')}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {iftars.map(iftar => (
                                        <tr key={iftar.id}>
                                            <td style={{ fontWeight: 600 }}>{iftar.title}</td>
                                            <td dir="ltr">{iftar.date}</td>
                                            <td>
                                                <span className={`badge ${iftar.gender === 'male' ? 'badge-male' : 'badge-female'}`}>
                                                    {iftar.gender === 'male' ? t('superadmin.male') : t('superadmin.female')}
                                                </span>
                                            </td>
                                            <td>{iftar.capacity}</td>
                                            <td>{iftar.registered || 0}</td>
                                            <td>{iftar.checkedIn || 0}</td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => router.push(`/admin/students?iftarId=${iftar.id}`)}
                                                    title={t('admin.viewStudents') || 'عرض سجل الطلاب'}
                                                >
                                                    <Users size={16} />
                                                </button>
                                            </td>
                                            <td>
                                                <button
                                                    className={`btn btn-sm ${iftar.is_active ? 'btn-success' : 'btn-secondary'}`}
                                                    onClick={() => toggleActive(iftar.id)}
                                                >
                                                    {iftar.is_active ? t('superadmin.active') : t('superadmin.inactive')}
                                                </button>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => deleteIftar(iftar.id)}
                                                >
                                                    {t('superadmin.delete')}
                                                </button>
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
                onConfirm={dialogConfig.onConfirm}
                onCancel={() => setDialogConfig({ isOpen: false })}
            />
        </>
    );
}
