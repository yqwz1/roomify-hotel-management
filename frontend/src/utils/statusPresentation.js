const DEFAULT_STATUS_PRESENTATION = Object.freeze({
  pill: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  badge: 'border-zinc-200 bg-zinc-50 text-zinc-700',
  dot: 'bg-zinc-500',
});

export const ROOM_STATUSES = new Set([
  'AVAILABLE',
  'OCCUPIED',
  'NEEDS_CLEANING',
  'UNDER_MAINTENANCE',
]);

export const RESERVATION_STATUSES = new Set([
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
]);

export const PAYMENT_STATUSES = new Set([
  'PENDING',
  'UNPAID',
  'PARTIALLY_PAID',
  'PAID',
  'FAILED',
  'PAYMENT_PENDING',
  'PROCESSING',
  'CANCELLED',
  'REFUNDED',
]);

export const STATUS_PRESENTATION = Object.freeze({
  PENDING: {
    pill: 'bg-amber-100 text-amber-950 ring-amber-200',
    badge: 'border-amber-200 bg-amber-50 text-amber-900',
    dot: 'bg-amber-600',
  },
  CONFIRMED: {
    pill: 'bg-sky-100 text-sky-950 ring-sky-200',
    badge: 'border-sky-200 bg-sky-50 text-sky-900',
    dot: 'bg-sky-600',
  },
  CHECKED_IN: {
    pill: 'bg-emerald-100 text-emerald-950 ring-emerald-200',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    dot: 'bg-emerald-600',
  },
  CHECKED_OUT: {
    pill: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
    badge: 'border-zinc-200 bg-zinc-50 text-zinc-700',
    dot: 'bg-zinc-500',
  },
  CANCELLED: {
    pill: 'bg-rose-100 text-rose-950 ring-rose-200',
    badge: 'border-rose-200 bg-rose-50 text-rose-900',
    dot: 'bg-rose-600',
  },
  AVAILABLE: {
    pill: 'bg-emerald-100 text-emerald-950 ring-emerald-200',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    dot: 'bg-emerald-600',
  },
  OCCUPIED: {
    pill: 'bg-indigo-100 text-indigo-950 ring-indigo-200',
    badge: 'border-indigo-200 bg-indigo-50 text-indigo-900',
    dot: 'bg-indigo-600',
  },
  NEEDS_CLEANING: {
    pill: 'bg-amber-100 text-amber-950 ring-amber-200',
    badge: 'border-amber-200 bg-amber-50 text-amber-900',
    dot: 'bg-amber-600',
  },
  UNDER_MAINTENANCE: {
    pill: 'bg-rose-100 text-rose-950 ring-rose-200',
    badge: 'border-rose-200 bg-rose-50 text-rose-900',
    dot: 'bg-rose-600',
  },
  UNPAID: {
    pill: 'bg-rose-100 text-rose-950 ring-rose-200',
    badge: 'border-rose-200 bg-rose-50 text-rose-900',
    dot: 'bg-rose-600',
  },
  PARTIALLY_PAID: {
    pill: 'bg-amber-100 text-amber-950 ring-amber-200',
    badge: 'border-amber-200 bg-amber-50 text-amber-900',
    dot: 'bg-amber-600',
  },
  PAID: {
    pill: 'bg-emerald-100 text-emerald-950 ring-emerald-200',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    dot: 'bg-emerald-600',
  },
  FAILED: {
    pill: 'bg-rose-100 text-rose-950 ring-rose-200',
    badge: 'border-rose-200 bg-rose-50 text-rose-900',
    dot: 'bg-rose-600',
  },
  PAYMENT_PENDING: {
    pill: 'bg-sky-100 text-sky-950 ring-sky-200',
    badge: 'border-sky-200 bg-sky-50 text-sky-900',
    dot: 'bg-sky-600',
  },
  PROCESSING: {
    pill: 'bg-sky-100 text-sky-950 ring-sky-200',
    badge: 'border-sky-200 bg-sky-50 text-sky-900',
    dot: 'bg-sky-600',
  },
  REFUNDED: {
    pill: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
    badge: 'border-zinc-200 bg-zinc-50 text-zinc-700',
    dot: 'bg-zinc-500',
  },
});

const normalizeStatus = (status) => String(status ?? '').trim().toUpperCase();

export const getStatusPresentation = (status) =>
  STATUS_PRESENTATION[normalizeStatus(status)] ?? DEFAULT_STATUS_PRESENTATION;

export const getStatusBadgeClasses = (status) => getStatusPresentation(status).badge;
