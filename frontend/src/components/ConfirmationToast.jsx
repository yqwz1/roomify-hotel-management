import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from "@/components/ui/button";
/**
 * ConfirmationToast
 * A dismissible toast that auto-hides after `duration` ms.
 *
 * Props:
 *   message   {string|null}  Text to display. Null = hidden.
 *   type?     {string}       "success" | "error" | "info" (default "success")
 *   duration? {number}       ms before auto-dismiss (default 4000)
 *   onClose   {Function}     Called on dismiss or auto-hide.
 */
export default function ConfirmationToast({ message, type = 'success', duration = 4000, onClose }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!message) return undefined;

    const timeoutId = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timeoutId);
  }, [duration, message, onClose]);

  if (!message) return null;

  const styles = {
    success: { bar: 'bg-brand-success', bg: 'bg-white border-brand-surface-border', text: 'text-brand-ink', icon: 'OK' },
    error: { bar: 'bg-brand-danger/50', bg: 'bg-white border-brand-surface-border', text: 'text-brand-ink', icon: '!' },
    info: { bar: 'bg-brand-ink', bg: 'bg-white border-brand-surface-border', text: 'text-brand-ink', icon: 'i' },
  };

  const tone = styles[type] ?? styles.success;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        motion-toast-in fixed end-3 top-6 z-[9999] w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border shadow-2xl sm:end-6 sm:w-80
        ${tone.bg}
      `}
    >
      <div className={`h-1.5 w-full rounded-t-2xl ${tone.bar}`} />

      <div className="flex min-w-0 items-start gap-3 p-4">
        <span className="mt-0.5 shrink-0 text-sm font-black break-words" aria-hidden="true">
          {tone.icon}
        </span>
        <p className={`min-w-0 flex-1 break-words text-sm font-medium ${tone.text}`}>{message}</p>
        <Button variant="unstyled" size="none"
          type="button"
          onClick={() => onClose?.()}
          aria-label={t('dismissToast')}
          className="shrink-0 rounded-full p-1 text-brand-ink-hint transition hover:bg-brand-primary-tint hover:text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}
