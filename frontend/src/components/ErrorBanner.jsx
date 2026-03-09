import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

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
            className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 shadow-sm"
        >
            {/* Icon */}
            <span className="mt-0.5 shrink-0 text-lg" aria-hidden="true">⚠️</span>

            {/* Message */}
            <p className="flex-1 text-sm font-medium">{message}</p>

            {/* Close button */}
            {onClose && (
                <button
                    onClick={onClose}
                    aria-label={t('dismissError') || 'Dismiss error'}
                    className="shrink-0 rounded p-0.5 text-red-600 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            )}
        </div>
    );
}

ErrorBanner.propTypes = {
    message: PropTypes.string,
    onClose: PropTypes.func,
};
