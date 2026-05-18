import { translateWithFallback } from './localization';

export const SERVICE_REQUEST_TYPES = [
  'ROOM_CLEANING',
  'FOOD_DELIVERY',
  'MAINTENANCE',
  'LAUNDRY',
  'OTHER',
];

export const SERVICE_REQUEST_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const TYPE_FALLBACKS = {
  ROOM_CLEANING: 'Room Cleaning',
  FOOD_DELIVERY: 'Food Delivery',
  MAINTENANCE: 'Maintenance',
  LAUNDRY: 'Laundry',
  OTHER: 'Other',
};

const PRIORITY_FALLBACKS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

const STATUS_FALLBACKS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export const getServiceRequestTypeLabel = (value, t) =>
  translateWithFallback(
    t,
    `serviceRequestTypes.${String(value ?? '').toLowerCase()}`,
    TYPE_FALLBACKS[value] ?? 'Other'
  );

export const getServiceRequestPriorityLabel = (value, t) =>
  translateWithFallback(
    t,
    `serviceRequestPriorities.${String(value ?? '').toLowerCase()}`,
    PRIORITY_FALLBACKS[value] ?? 'Medium'
  );

export const getServiceRequestStatusLabel = (value, t) =>
  translateWithFallback(
    t,
    `serviceRequestStatuses.${String(value ?? '').toLowerCase()}`,
    STATUS_FALLBACKS[value] ?? 'Pending'
  );

export const getServiceRequestStatusBadgeClassName = (status) => {
  switch (status) {
    case 'COMPLETED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'IN_PROGRESS':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700';
  }
};

export const getServiceRequestPriorityBadgeClassName = (priority) => {
  switch (priority) {
    case 'HIGH':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'LOW':
      return 'border-border bg-muted/80 text-muted-foreground';
    default:
      return 'border-violet-200 bg-violet-50 text-violet-700';
  }
};
