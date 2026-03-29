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
                <label htmlFor="check-in-date" className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                    {t('checkInLabel')}
                </label>
                <input
                    id="check-in-date"
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={(e) => onCheckInChange(e.target.value)}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-black transition-all focus:bg-white focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5"
                />
            </div>

            {/* Arrow separator */}
            <span className="hidden self-center text-zinc-300 sm:block mb-3" aria-hidden="true">→</span>

            {/* Check-Out */}
            <div className="flex flex-col gap-1">
                <label htmlFor="check-out-date" className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                    {t('checkOutLabel')}
                </label>
                <input
                    id="check-out-date"
                    type="date"
                    value={checkOut}
                    min={checkIn || today}
                    onChange={(e) => onCheckOutChange(e.target.value)}
                    className={`rounded-full border bg-zinc-50 px-4 py-3 text-sm font-medium text-black transition-all focus:bg-white focus:outline-none focus:ring-2 ${isInvalid
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                            : 'border-zinc-200 focus:border-black focus:ring-black/5'
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
