import { useTranslation } from 'react-i18next';
import {
  getReservationStatusLabel,
  getRoomStatusLabel,
} from '../utils/localization';
import {
  getStatusPresentation,
  RESERVATION_STATUSES,
  ROOM_STATUSES,
} from '../utils/statusPresentation';

/**
 * StatusPill
 * Displays a reservation status as a colored badge.
 *
 * Props:
 *   status  {string}  – "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED"
 *   size?   {string}  – "sm" | "md" (default "md")
 */

export default function StatusPill({ status, size = 'md' }) {
    const { t } = useTranslation();
    const cfg = getStatusPresentation(status);
    const normalizedStatus = String(status ?? '').trim().toUpperCase();
    const label = RESERVATION_STATUSES.has(normalizedStatus)
        ? getReservationStatusLabel(normalizedStatus, t)
        : ROOM_STATUSES.has(normalizedStatus)
            ? getRoomStatusLabel(normalizedStatus, t)
            : status;

    const textSize = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${cfg.pill} ${textSize}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
            {label}
        </span>
    );
}
