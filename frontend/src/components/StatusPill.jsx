import { useTranslation } from 'react-i18next';
import { getReservationStatusLabel } from '../utils/localization';

/**
 * StatusPill
 * Displays a reservation status as a colored badge.
 *
 * Props:
 *   status  {string}  – "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED"
 *   size?   {string}  – "sm" | "md" (default "md")
 */

const CONFIG = {
    PENDING: { label: 'Pending', classes: 'bg-zinc-100 text-black ring-zinc-200', dot: 'bg-black' },
    CONFIRMED: { label: 'Confirmed', classes: 'bg-black text-white ring-black', dot: 'bg-white' },
    CHECKED_IN: { label: 'Checked In', classes: 'bg-white text-black ring-zinc-300', dot: 'bg-black' },
    CHECKED_OUT: { label: 'Checked Out', classes: 'bg-zinc-50 text-zinc-500 ring-zinc-200', dot: 'bg-zinc-400' },
    CANCELLED: { label: 'Cancelled', classes: 'bg-red-50 text-red-900 ring-red-200', dot: 'bg-red-500' },
};

export default function StatusPill({ status, size = 'md' }) {
    const { t } = useTranslation();
    const cfg = CONFIG[status] ?? {
        label: status,
        classes: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
        dot: 'bg-zinc-400',
    };

    const textSize = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${cfg.classes} ${textSize}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
            {getReservationStatusLabel(status, t) || cfg.label}
        </span>
    );
}
