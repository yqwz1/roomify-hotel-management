import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ConfirmationToast
 * A dismissible toast that auto-hides after `duration` ms.
 * Slides in from top-right corner.
 *
 * Props:
 *   message   {string|null}  – Text to display. Null = hidden.
 *   type?     {string}       – "success" | "error" | "info" (default "success")
 *   duration? {number}       – ms before auto-dismiss (default 4000)
 *   onClose   {Function}     – Called on dismiss or auto-hide.
 */
export default function ConfirmationToast({ message, type = 'success', duration = 4000, onClose }) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!message) { setVisible(false); return; }
        setVisible(true);
        const t = setTimeout(() => { setVisible(false); onClose?.(); }, duration);
        return () => clearTimeout(t);
    }, [message, duration, onClose]);

    if (!message) return null;

    const styles = {
        success: { bar: 'bg-green-500', bg: 'bg-white border-zinc-200', text: 'text-black', icon: '✅' },
        error: { bar: 'bg-red-500', bg: 'bg-white border-zinc-200', text: 'text-black', icon: '❌' },
        info: { bar: 'bg-black', bg: 'bg-white border-zinc-200', text: 'text-black', icon: 'ℹ️' },
    };
    const s = styles[type] ?? styles.success;

    return (
        <div
            role="status"
            aria-live="polite"
            className={`
                fixed top-6 end-6 z-[9999] w-80 rounded-2xl border shadow-2xl
                transition-all duration-300 ease-in-out
                ${s.bg}
                ${visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}
            `}
        >
            {/* Top accent bar */}
            <div className={`h-1.5 w-full rounded-t-2xl ${s.bar}`} />

            <div className="flex items-start gap-3 p-4">
                <span className="mt-0.5 shrink-0 text-lg" aria-hidden="true">{s.icon}</span>
                <p className={`flex-1 text-sm font-medium ${s.text}`}>{message}</p>
                <button
                    onClick={() => { setVisible(false); onClose?.(); }}
                    aria-label={t('dismissToast') || 'Dismiss'}
                    className="shrink-0 rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-black focus:outline-none focus:ring-2 focus:ring-zinc-300"
                >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
