import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorMessage component for displaying error messages
 * @param {Object} props - Component props
 * @param {string} props.message - Error message to display
 * @param {Function} props.onDismiss - Optional callback when error is dismissed
 */
const ErrorMessage = ({ message, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(true);

    if (!message || !isVisible) return null;

    const handleDismiss = () => {
        setIsVisible(false);
        if (onDismiss) {
            onDismiss();
        }
    };

    return (
        <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative flex items-start gap-3"
            role="alert"
        >
            <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                />
            </svg>
            <div className="flex-1">
                <p className="font-medium text-sm">{message}</p>
            </div>
            {onDismiss && (
                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
                    aria-label="Dismiss error"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
};

ErrorMessage.propTypes = {
    message: PropTypes.string,
    onDismiss: PropTypes.func
};

export default ErrorMessage;
