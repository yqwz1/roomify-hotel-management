/**
 * StatusPill
 * Displays a reservation status as a colored badge.
 *
 * Props:
 *   status  {string}  – "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED"
 *   size?   {string}  – "sm" | "md" (default "md")
 */

const CONFIG = {
    PENDING: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-800 ring-yellow-300', dot: 'bg-yellow-500' },
    CONFIRMED: { label: 'Confirmed', classes: 'bg-blue-100 text-blue-800 ring-blue-300', dot: 'bg-blue-500' },
    CHECKED_IN: { label: 'Checked In', classes: 'bg-green-100 text-green-800 ring-green-300', dot: 'bg-green-500' },
    CHECKED_OUT: { label: 'Checked Out', classes: 'bg-gray-100 text-gray-700 ring-gray-300', dot: 'bg-gray-500' },
    CANCELLED: { label: 'Cancelled', classes: 'bg-red-100 text-red-700 ring-red-300', dot: 'bg-red-500' },
};

export default function StatusPill({ status, size = 'md' }) {
    const cfg = CONFIG[status] ?? {
        label: status,
        classes: 'bg-gray-100 text-gray-600 ring-gray-200',
        dot: 'bg-gray-400',
    };

    const textSize = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${cfg.classes} ${textSize}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
            {cfg.label}
        </span>
    );
}
