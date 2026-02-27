'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Loader2, ArrowLeft, UserPlus, Shield, UserX, Key, X } from 'lucide-react';

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

    const [dialogConfig, setDialogConfig] = useState({ isOpen: false });

    // Edit Password state
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [updateError, setUpdateError] = useState('');
    const [updateSuccess, setUpdateSuccess] = useState('');

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

        setDialogConfig({
            isOpen: true,
            title: t('superadmin.delete') || 'Delete',
            message: confirmMsg,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await fetch(`/api/admins/${id}`, { method: 'DELETE' });
                    await fetchAdmins();
                } catch (err) {
                    console.error('Error deleting admin:', err);
                }
            }
        });
    }

    async function handleUpdatePassword(e) {
        e.preventDefault();
        setIsUpdatingPassword(true);
        setUpdateError('');
        setUpdateSuccess('');

        try {
            const res = await fetch(`/api/admins/${editingAdmin.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });
            const data = await res.json();

            if (res.ok) {
                setUpdateSuccess(isRtl ? 'تم تغيير كلمة المرور بنجاح' : 'Password updated successfully');
                setNewPassword('');
                setTimeout(() => {
                    setEditingAdmin(null);
                    setUpdateSuccess('');
                }, 2000);
            } else {
                setUpdateError(data.error === 'invalid_password'
                    ? (isRtl ? 'كلمة المرور غير صالحة (الحد الأدنى 6 أحرف)' : 'Invalid password (min 6 chars)')
                    : (isRtl ? 'حدث خطأ أثناء تغيير كلمة المرور' : 'Error updating password'));
            }
        } catch (err) {
            console.error(err);
            setUpdateError(isRtl ? 'حدث خطأ أثناء تغيير كلمة المرور' : 'Error updating password');
        } finally {
            setIsUpdatingPassword(false);
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
                                            <td className="text-right" style={{ textAlign: isRtl ? 'left' : 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn btn-sm btn-icon"
                                                    style={{ background: 'var(--brand-medium)', color: '#fff' }}
                                                    onClick={() => {
                                                        setEditingAdmin(a);
                                                        setNewPassword('');
                                                        setUpdateError('');
                                                        setUpdateSuccess('');
                                                    }}
                                                    title={t('login.password') || 'Change Password'}
                                                >
                                                    <Key size={16} />
                                                </button>
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

            <ConfirmDialog
                isOpen={dialogConfig.isOpen}
                title={dialogConfig.title}
                message={dialogConfig.message}
                type={dialogConfig.type}
                onConfirm={dialogConfig.onConfirm}
                onCancel={() => setDialogConfig({ isOpen: false })}
            />

            {/* Change Password Modal */}
            {editingAdmin && (
                <div className="dialog-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="dialog-content animate-scale" style={{ maxWidth: '400px', width: '90%', background: 'var(--bg-card)' }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="mb-0" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                                {isRtl ? 'تغيير كلمة المرور' : 'Change Password'} - {editingAdmin.name}
                            </h3>
                            <button className="btn-icon" onClick={() => setEditingAdmin(null)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {updateSuccess && (
                            <div className="checkin-result success mb-3" style={{ padding: '10px', fontSize: '0.9rem' }}>
                                {updateSuccess}
                            </div>
                        )}
                        {updateError && (
                            <div className="checkin-result error mb-3" style={{ padding: '10px', fontSize: '0.9rem' }}>
                                {updateError}
                            </div>
                        )}

                        <form onSubmit={handleUpdatePassword}>
                            <div className="form-group">
                                <label className="form-label">{isRtl ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    dir="ltr"
                                    minLength="6"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="flex gap-2" style={{ marginTop: '20px' }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1, background: 'var(--brand-medium)', borderColor: 'var(--brand-medium)', color: '#fff' }}
                                    disabled={isUpdatingPassword}
                                >
                                    {isUpdatingPassword ? <Loader2 size={16} className="spinner" /> : (isRtl ? 'حفظ' : 'Save')}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                    disabled={isUpdatingPassword}
                                    onClick={() => setEditingAdmin(null)}
                                >
                                    {t('superadmin.cancel') || 'Cancel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
