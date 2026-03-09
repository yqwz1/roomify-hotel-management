import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

/**
 * DateRangePicker
 * Controlled component for selecting a check-in and check-out date.
 * Shows an inline error when check-out is before check-in.
 *
 * Props:
 *   checkIn           {string}    – ISO date string (YYYY-MM-DD) for check-in.
 *   checkOut          {string}    – ISO date string (YYYY-MM-DD) for check-out.
 *   onCheckInChange   {Function}  – (value: string) => void
 *   onCheckOutChange  {Function}  – (value: string) => void
 */
export default function DateRangePicker({ checkIn, checkOut, onCheckInChange, onCheckOutChange }) {
    const { t } = useTranslation();
    // Minimum selectable date is today
    const today = new Date().toISOString().split('T')[0];

    const isInvalid = checkIn && checkOut && checkOut < checkIn;

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            {/* Check-In */}
            <div className="flex flex-col gap-1">
                <label htmlFor="check-in-date" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('checkInLabel') || 'Check-In'}
                </label>
                <input
                    id="check-in-date"
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={(e) => onCheckInChange(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
            </div>

            {/* Arrow separator */}
            <span className="hidden self-center text-gray-400 sm:block" aria-hidden="true">→</span>

            {/* Check-Out */}
            <div className="flex flex-col gap-1">
                <label htmlFor="check-out-date" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('checkOutLabel') || 'Check-Out'}
                </label>
                <input
                    id="check-out-date"
                    type="date"
                    value={checkOut}
                    min={checkIn || today}
                    onChange={(e) => onCheckOutChange(e.target.value)}
                    className={`rounded-lg border bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:outline-none focus:ring-2 ${isInvalid
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                        }`}
                />
            </div>

            {/* Validation message */}
            {isInvalid && (
                <p className="text-xs font-medium text-red-600 sm:self-end sm:pb-2" role="alert">
                    {t('checkoutAfterCheckin')}
                </p>
            )}
        </div>
    );
}

DateRangePicker.propTypes = {
    checkIn: PropTypes.string,
    checkOut: PropTypes.string,
    onCheckInChange: PropTypes.func.isRequired,
    onCheckOutChange: PropTypes.func.isRequired,
};
