import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { Button } from "@/components/ui/button";
/**
 * ErrorBanner
 * Displays a dismissible error alert strip.
 * Renders nothing when `message` is falsy.
 *
 * Props:
 *   message  {string|null}  – The error text to display.
 *   onClose  {Function}     – Called when the user dismisses the banner.
 */
export default function ErrorBanner({ message, onClose }) {
    const { t } = useTranslation();
    if (!message) return null;

    return (
        <div
            role="alert"
            className="motion-error-in flex min-w-0 items-center gap-3 rounded-2xl border border-brand-danger/30 bg-white px-5 py-3 text-brand-ink shadow-sm sm:rounded-full"
        >
            {/* Icon */}
            <span className="mt-0.5 shrink-0 text-lg break-words" aria-hidden="true">⚠️</span>

            {/* Message */}
            <p className="min-w-0 flex-1 break-words text-sm font-bold">{message}</p>

            {/* Close button */}
            {onClose && (
                <Button variant="unstyled" size="none"
                    onClick={onClose}
                    aria-label={t('dismissError')}
                    className="shrink-0 rounded-full p-1 text-brand-danger transition hover:bg-brand-danger/10 hover:text-brand-danger focus:outline-none focus:ring-2 focus:ring-brand-danger/40"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </Button>
            )}
        </div>
    );
}

ErrorBanner.propTypes = {
    message: PropTypes.string,
    onClose: PropTypes.func,
};
