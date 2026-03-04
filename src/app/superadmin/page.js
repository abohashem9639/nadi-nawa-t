'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Loader2, Moon, Users, Shield, Edit2, Settings, Printer } from 'lucide-react';

export default function SuperAdminPage() {
    const { t, isRtl, lang } = useTranslation();
    const router = useRouter();

    const [admin, setAdmin] = useState(null);
    const [iftars, setIftars] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    // Create Iftar Form
    const [title, setTitle] = useState({ ar: '', tr: '', en: '' });
    const [date, setDate] = useState('');
    const [capacity, setCapacity] = useState('');
    const [gender, setGender] = useState('male');
    const [creating, setCreating] = useState(false);

    const [dialogConfig, setDialogConfig] = useState({ isOpen: false });
    const [editCapacityModal, setEditCapacityModal] = useState({ isOpen: false, iftarId: null, currentCapacity: '', newCapacity: '', title: '' });
    const [editTitleModal, setEditTitleModal] = useState({ isOpen: false, iftarId: null, currentTitle: '', newTitle: { ar: '', tr: '', en: '' } });

    // Edit Profile Form
    const [editProfileModal, setEditProfileModal] = useState({ isOpen: false });
    const [profileUsername, setProfileUsername] = useState('');
    const [profilePassword, setProfilePassword] = useState('');
    const [updatingProfile, setUpdatingProfile] = useState(false);

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
            setProfileUsername(data.username || '');
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
                body: JSON.stringify({ title: title.ar, title_tr: title.tr, title_en: title.en, date, capacity: parseInt(capacity), gender }),
            });
            if (res.ok) {
                setTitle({ ar: '', tr: '', en: '' });
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

    async function handleSaveCapacity(e) {
        e.preventDefault();
        try {
            const res = await fetch(`/api/iftars/${editCapacityModal.iftarId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ capacity: parseInt(editCapacityModal.newCapacity) })
            });

            if (res.ok) {
                setEditCapacityModal({ isOpen: false, iftarId: null, currentCapacity: '', newCapacity: '', title: '' });
                fetchIftars();
            } else {
                setDialogConfig({
                    isOpen: true,
                    title: 'Error',
                    message: 'Failed to update capacity',
                    type: 'danger',
                    onConfirm: () => { }
                });
            }
        } catch (error) {
            console.error('Error updating capacity:', error);
        }
    }

    async function handleSaveTitle(e) {
        e.preventDefault();
        try {
            await fetch(`/api/iftars/${editTitleModal.iftarId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editTitleModal.newTitle.ar, title_tr: editTitleModal.newTitle.tr, title_en: editTitleModal.newTitle.en }),
            });
            setEditTitleModal({ isOpen: false, iftarId: null, currentTitle: '', newTitle: { ar: '', tr: '', en: '' } });
            await fetchIftars();
        } catch (error) {
            console.error('Error updating title:', error);
        }
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

    async function handleUpdateProfile(e) {
        e.preventDefault();
        setUpdatingProfile(true);
        try {
            const res = await fetch('/api/admins/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: profileUsername,
                    password: profilePassword
                })
            });

            if (res.ok) {
                setDialogConfig({
                    isOpen: true,
                    title: 'Success',
                    message: t('superadmin.profileUpdateSuccess') || 'Profile updated successfully',
                    type: 'success',
                    onConfirm: () => {
                        setEditProfileModal({ isOpen: false });
                        setProfilePassword('');
                        checkAuth(); // refresh admin name if changed
                    }
                });
            } else {
                setDialogConfig({
                    isOpen: true,
                    title: 'Error',
                    message: t('superadmin.profileUpdateError') || 'Error updating profile',
                    type: 'danger',
                    onConfirm: () => { }
                });
            }
        } catch (error) {
            console.error('Profile update error:', error);
        } finally {
            setUpdatingProfile(false);
        }
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

    const getLocalizedTitle = (iftar) => {
        if (lang === 'tr' && iftar.title_tr) return iftar.title_tr;
        if (lang === 'en' && iftar.title_en) return iftar.title_en;
        return iftar.title; // Default to Arabic
    };

    const renderTable = (data, emptyMessage) => {
        if (data.length === 0) {
            return (
                <div className="empty-state">
                    <Moon size={64} color="var(--text-muted)" className="mb-3" style={{ margin: '0 auto' }} />
                    <p className="empty-state-text">{emptyMessage}</p>
                </div>
            );
        }

        return (
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>{t('superadmin.iftarTitle')}</th>
                            <th>{t('superadmin.date')}</th>
                            <th>{t('superadmin.gender')}</th>
                            <th>{t('superadmin.capacity')}</th>
                            <th>{t('home.arqamStudents') || 'طلاب الأرقم'}</th>
                            <th>{t('admin.registered')}</th>
                            <th>{t('admin.checkedIn')}</th>
                            <th>{t('admin.viewStudents') || 'الطلاب'}</th>
                            <th>{t('superadmin.toggleActive')}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(iftar => (
                            <tr key={iftar.id}>
                                <td style={{ fontWeight: 600 }}>
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}
                                        onClick={() => setEditTitleModal({ isOpen: true, iftarId: iftar.id, currentTitle: getLocalizedTitle(iftar), newTitle: { ar: iftar.title || '', tr: iftar.title_tr || '', en: iftar.title_en || '' } })}
                                        title={isRtl ? 'تعديل العنوان' : 'Edit Title'}
                                    >
                                        {getLocalizedTitle(iftar)}
                                        <Edit2 size={14} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                                    </div>
                                </td>
                                <td dir="ltr">{iftar.date}</td>
                                <td>
                                    <span className={`badge ${iftar.gender === 'male' ? 'badge-male' : 'badge-female'}`}>
                                        {iftar.gender === 'male' ? t('superadmin.male') : t('superadmin.female')}
                                    </span>
                                </td>
                                <td>
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--brand-primary)', fontWeight: 500 }}
                                        onClick={() => setEditCapacityModal({ isOpen: true, iftarId: iftar.id, currentCapacity: iftar.capacity, newCapacity: iftar.capacity, title: iftar.title })}
                                        title={t('superadmin.editCapacity')}
                                    >
                                        {iftar.capacity}
                                        <Edit2 size={14} />
                                    </div>
                                </td>
                                <td>{iftar.arqamCount || 0}</td>
                                <td>{iftar.registered || 0}</td>
                                <td>{iftar.checkedIn || 0}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => router.push(`/superadmin/iftars/${iftar.id}`)}
                                            title={t('admin.viewStudents') || 'عرض سجل الطلاب'}
                                        >
                                            <Users size={16} />
                                        </button>
                                        {/* Temporarily hidden PDF Report button
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => router.push(`/superadmin/iftars/${iftar.id}`)}
                                            title={t('superadmin.printReport') || 'تحميل التقرير (PDF)'}
                                        >
                                            <Printer size={16} />
                                        </button>
                                        */}
                                    </div>
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
        );
    };

    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const localDate = new Date(utc + (3600000 * 3));
    const effectiveDate = new Date(localDate.getTime() + (4.5 * 3600000)); // Shift boundary to 19:30
    const todayStr = effectiveDate.toISOString().split('T')[0];

    const currentIftarsList = iftars.filter(iftar => iftar.date >= todayStr);
    const pastIftarsList = iftars.filter(iftar => iftar.date < todayStr);

    return (
        <>
            <Header showLogout onLogout={handleLogout} />
            <main className="container" style={{ paddingBottom: '40px' }}>
                <div className="page-header">
                    <h1 className="page-title">{t('superadmin.title')}</h1>
                    <p className="page-subtitle mb-3">{admin?.name}</p>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-secondary btn-sm flex items-center gap-2"
                            onClick={() => router.push('/superadmin/admins')}
                            style={{ opacity: 0.9 }}
                        >
                            <Shield size={16} /> {isRtl ? 'إدارة المشرفين' : 'Manage Admins'}
                        </button>

                        <button
                            className="btn btn-secondary btn-sm flex items-center gap-2"
                            onClick={() => setEditProfileModal({ isOpen: true })}
                            style={{ opacity: 0.9 }}
                        >
                            <Settings size={16} /> {t('superadmin.editProfile') || 'Edit Profile'}
                        </button>
                    </div>
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
                                <label className="form-label">العنوان (عربي)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="مثال: إفطار الأسبوع الأول"
                                    value={title.ar}
                                    onChange={(e) => setTitle({ ...title, ar: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Başlık (Türkçe)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Örn: İlk Hafta İftarı"
                                    value={title.tr}
                                    onChange={(e) => setTitle({ ...title, tr: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Title (English)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g: First Week Iftar"
                                    value={title.en}
                                    onChange={(e) => setTitle({ ...title, en: e.target.value })}
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

                {/* Current & Upcoming Iftars Table */}
                <div className="card animate-slide-up mb-4">
                    <h2 className="section-title">{t('superadmin.currentIftars') || 'الحملات الحالية والقادمة'}</h2>
                    {renderTable(currentIftarsList, t('superadmin.noCurrentIftars') || 'لا يوجد حملات حالية')}
                </div>

                {/* Past Iftars Table */}
                <div className="card animate-slide-up">
                    <h2 className="section-title">{t('superadmin.pastIftars') || 'الحملات السابقة'}</h2>
                    {renderTable(pastIftarsList, t('superadmin.noPastIftars') || 'لا يوجد حملات سابقة')}
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

            {/* Edit Profile Modal */}
            {editProfileModal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in" style={{ padding: '24px', maxWidth: '400px', width: '90%' }}>
                        <h3 className="section-title mb-3">{t('superadmin.editProfile') || 'Edit Profile'}</h3>
                        <form onSubmit={handleUpdateProfile}>
                            <div className="form-group">
                                <label className="form-label">{t('superadmin.newUsername') || 'New Username'}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={profileUsername}
                                    onChange={(e) => setProfileUsername(e.target.value)}
                                    required
                                    dir="ltr"
                                />
                            </div>
                            <div className="form-group mb-4">
                                <label className="form-label">{t('superadmin.newPassword') || 'New Password'}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={t('superadmin.leaveBlankPassword') || 'Leave blank to keep current'}
                                    value={profilePassword}
                                    onChange={(e) => setProfilePassword(e.target.value)}
                                    dir="ltr"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-full"
                                    onClick={() => {
                                        setEditProfileModal({ isOpen: false });
                                        setProfilePassword('');
                                    }}
                                >
                                    {t('superadmin.cancel') || 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-full"
                                    disabled={updatingProfile}
                                >
                                    {updatingProfile ? <Loader2 size={18} className="spinner" /> : (t('superadmin.save') || 'Save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editCapacityModal.isOpen && (
                <div className="modal-overlay" onClick={() => setEditCapacityModal({ isOpen: false, iftarId: null, currentCapacity: '', newCapacity: '', title: '' })}>
                    <div className="result-modal primary" onClick={(e) => e.stopPropagation()} style={{ padding: '24px 20px', maxWidth: '400px', width: '90%' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                            {t('superadmin.editCapacity')}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                            {editCapacityModal.title}
                        </p>
                        <form onSubmit={handleSaveCapacity}>
                            <div className="form-group">
                                <label className="form-label">{t('superadmin.newCapacity')}</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="1"
                                    value={editCapacityModal.newCapacity}
                                    onChange={(e) => setEditCapacityModal({ ...editCapacityModal, newCapacity: e.target.value })}
                                    required
                                    dir="ltr"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setEditCapacityModal({ isOpen: false, iftarId: null, currentCapacity: '', newCapacity: '', title: '' })}
                                    style={{ flex: 1 }}
                                >
                                    {t('superadmin.cancel') || 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    {t('superadmin.save') || 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editTitleModal.isOpen && (
                <div className="modal-overlay" onClick={() => setEditTitleModal({ isOpen: false, iftarId: null, currentTitle: '', newTitle: { ar: '', tr: '', en: '' } })}>
                    <div className="result-modal primary" onClick={(e) => e.stopPropagation()} style={{ padding: '24px 20px', maxWidth: '400px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                            {isRtl ? 'تعديل عنوان الإفطار' : 'Edit Iftar Title'}
                        </h3>

                        <form onSubmit={handleSaveTitle}>
                            <div className="form-group">
                                <label className="form-label">العنوان (عربي)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editTitleModal.newTitle.ar}
                                    onChange={(e) => setEditTitleModal({ ...editTitleModal, newTitle: { ...editTitleModal.newTitle, ar: e.target.value } })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Başlık (Türkçe)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editTitleModal.newTitle.tr}
                                    onChange={(e) => setEditTitleModal({ ...editTitleModal, newTitle: { ...editTitleModal.newTitle, tr: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Title (English)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editTitleModal.newTitle.en}
                                    onChange={(e) => setEditTitleModal({ ...editTitleModal, newTitle: { ...editTitleModal.newTitle, en: e.target.value } })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setEditTitleModal({ isOpen: false, iftarId: null, currentTitle: '', newTitle: { ar: '', tr: '', en: '' } })}
                                    style={{ flex: 1 }}
                                >
                                    {t('superadmin.cancel') || 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    {t('superadmin.save') || 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
