'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Loader2, ArrowLeft, UserPlus, Shield, UserX } from 'lucide-react';

export default function SuperAdminManageAdmins() {
    const { t, isRtl } = useTranslation();
    const router = useRouter();

    const [superAdmin, setSuperAdmin] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('male_admin');
    const [creating, setCreating] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

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
            setSuperAdmin(data);
            await fetchAdmins();
        } catch {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }

    async function fetchAdmins() {
        try {
            const res = await fetch('/api/admins');
            if (res.ok) {
                const data = await res.json();
                setAdmins(data.admins || []);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        setCreating(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, name, role }),
            });
            const data = await res.json();

            if (res.ok) {
                setUsername('');
                setPassword('');
                setName('');
                setRole('male_admin');
                await fetchAdmins();
            } else if (data.error === 'username_exists') {
                setErrorMsg(isRtl ? 'اسم المستخدم موجود مسبقاً' : 'Username already exists');
            } else {
                setErrorMsg(isRtl ? 'حدث خطأ أثناء الإنشاء' : 'Error creating admin');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(isRtl ? 'حدث خطأ أثناء الإنشاء' : 'Error creating admin');
        } finally {
            setCreating(false);
        }
    }

    async function deleteAdmin(id, adminName) {
        const confirmMsg = isRtl
            ? `هل أنت متأكد من حذف المشرف ${adminName}؟`
            : `Are you sure you want to delete admin ${adminName}?`;

        if (!confirm(confirmMsg)) return;

        try {
            await fetch(`/api/admins/${id}`, { method: 'DELETE' });
            await fetchAdmins();
        } catch (err) {
            console.error('Error deleting admin:', err);
        }
    }

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
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
                    <h1 className="page-title">{isRtl ? 'إدارة المشرفين' : 'Manage Admins'}</h1>
                    <p className="page-subtitle">{superAdmin?.name}</p>
                </div>

                {/* Create Admin Form */}
                <div className="card mb-4 animate-slide-up">
                    <h2 className="section-title flex items-center gap-2">
                        <UserPlus size={20} /> {isRtl ? 'إضافة مشرف جديد' : 'Add New Admin'}
                    </h2>

                    {errorMsg && (
                        <div className="checkin-result error mb-3" style={{ padding: '10px', fontSize: '0.9rem' }}>
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleCreate}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">{isRtl ? 'اسم المشرف (للعرض)' : 'Display Name'}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={isRtl ? 'مثال: أحمد محمد' : 'e.g. John Doe'}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">{t('login.username') || 'Username'}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="admin_name"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    dir="ltr"
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">{t('login.password') || 'Password'}</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    dir="ltr"
                                    minLength="6"
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">{t('superadmin.gender') || 'Role'}</label>
                                <select
                                    className="form-select"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value="male_admin">{isRtl ? 'مشرف قسم الطلاب' : 'Male Section Admin'}</option>
                                    <option value="female_admin">{isRtl ? 'مشرفة قسم الطالبات' : 'Female Section Admin'}</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-3">
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

                {/* Admins List */}
                <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <h2 className="section-title flex items-center gap-2">
                        <Shield size={20} /> {isRtl ? 'المشرفون الحاليون' : 'Current Admins'}
                    </h2>

                    {admins.length === 0 ? (
                        <div className="empty-state">
                            <p className="empty-state-text">No admins found</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{isRtl ? 'الاسم' : 'Name'}</th>
                                        <th>{t('login.username') || 'Username'}</th>
                                        <th>{t('superadmin.gender') || 'Role'}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admins.map(a => (
                                        <tr key={a.id}>
                                            <td style={{ fontWeight: 600 }}>{a.name}</td>
                                            <td dir="ltr" className="text-muted">{a.username}</td>
                                            <td>
                                                <span className={`badge ${a.role === 'male_admin' ? 'badge-male' : 'badge-female'}`}>
                                                    {a.role === 'male_admin' ? t('home.male') : t('home.female')}
                                                </span>
                                            </td>
                                            <td className="text-right" style={{ textAlign: isRtl ? 'left' : 'right' }}>
                                                <button
                                                    className="btn btn-sm btn-danger btn-icon"
                                                    onClick={() => deleteAdmin(a.id, a.name)}
                                                    title={t('superadmin.delete') || 'Delete'}
                                                >
                                                    <UserX size={16} />
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
        </>
    );
}
