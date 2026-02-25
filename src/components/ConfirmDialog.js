import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText, cancelText, type = 'danger', hideCancel = false }) {
    const { t, isRtl } = useTranslation();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className={`result-modal ${type}`} onClick={(e) => e.stopPropagation()} style={{ padding: '24px 20px' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)' }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '1rem', lineHeight: '1.5' }}>{message}</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    {!hideCancel && (
                        <button
                            className="btn btn-secondary"
                            onClick={onCancel}
                            style={{ flex: 1 }}
                        >
                            {cancelText || t('admin.cancel') || 'Cancel'}
                        </button>
                    )}
                    <button
                        className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => { onConfirm(); onCancel(); }}
                        style={{ flex: 1 }}
                    >
                        {confirmText || t('admin.confirm') || 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
}
