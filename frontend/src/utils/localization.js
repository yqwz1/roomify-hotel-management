import i18n from '../i18n';

const interpolateFallback = (fallback, options) => {
  if (typeof fallback !== 'string' || !options || typeof options !== 'object') {
    return fallback;
  }

  return fallback.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, token) =>
    Object.prototype.hasOwnProperty.call(options, token) ? String(options[token]) : ''
  );
};

export const translateWithFallback = (t, key, fallback, options) => {
  const value = t(key, options);
  return value === key ? interpolateFallback(fallback, options) : value;
};

export const getLocale = (language = i18n.language) =>
  language?.startsWith('ar') ? 'ar-SA' : 'en-US';

const toDate = (value) => {
  if (!value) return null;

  const normalized = String(value);
  const date = new Date(
    normalized.length === 10 ? `${normalized}T12:00:00` : normalized
  );

  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatLocalizedDate = (value, language = i18n.language, options = {}) => {
  const date = toDate(value);
  if (!date) return '-';

  return new Intl.DateTimeFormat(getLocale(language), options).format(date);
};

export const formatLocalizedDateTime = (
  value,
  language = i18n.language,
  options = { dateStyle: 'medium', timeStyle: 'short' }
) => {
  const date = toDate(value);
  if (!date) return '-';

  return new Intl.DateTimeFormat(getLocale(language), options).format(date);
};

export const formatLocalizedCurrency = (
  value,
  language = i18n.language,
  options = {}
) =>
  new Intl.NumberFormat(getLocale(language), {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(Number(value ?? 0));

export const formatLocalizedNumber = (value, language = i18n.language, options = {}) =>
  new Intl.NumberFormat(getLocale(language), options).format(Number(value ?? 0));

const humanizeStatus = (status) =>
  String(status ?? '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const ROOM_STATUS_KEYS = {
  AVAILABLE: 'statusAvailable',
  OCCUPIED: 'statusOccupied',
  NEEDS_CLEANING: 'statusNeedsCleaning',
  UNDER_MAINTENANCE: 'statusUnderMaintenance',
};

const RESERVATION_STATUS_KEYS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checkedIn',
  CHECKED_OUT: 'checkedOut',
  CANCELLED: 'cancelled',
};

const ROLE_CODE_KEYS = {
  ROLE_ADMIN: 'roleAdmin',
  ROLE_MANAGER: 'roleManager',
  ROLE_STAFF: 'roleStaff',
  ROLE_GUEST: 'roleGuest',
};

const INVOICE_DELIVERY_STATUS_KEYS = {
  IDLE: 'invoiceDeliveryStatusIdle',
  LOADING: 'invoiceDeliveryStatusLoading',
  ATTEMPT: 'invoiceDeliveryStatusAttempt',
  SENT: 'invoiceDeliveryStatusSent',
  FAILED: 'invoiceDeliveryStatusFailed',
  ERROR: 'invoiceDeliveryStatusError',
  UNKNOWN: 'invoiceDeliveryStatusUnknown',
};

const PAYMENT_STATUS_KEYS = {
  PENDING: 'paymentStatusPending',
  UNPAID: 'paymentStatusUnpaid',
  PARTIALLY_PAID: 'paymentStatusPartiallyPaid',
  PAID: 'paymentStatusPaid',
  FAILED: 'paymentStatusFailed',
  PAYMENT_PENDING: 'paymentStatusPending',
};

const KNOWN_VALUE_KEYS = {
  'Standard Room': 'roomTypeValueStandard',
  'Deluxe Room': 'roomTypeValueDeluxe',
  Suite: 'roomTypeValueSuite',
  'Family Room': 'roomTypeValueFamily',
  Deluxe: 'roomTypeValueDeluxeShort',
  WiFi: 'amenityWifi',
  TV: 'amenityTv',
  AC: 'amenityAc',
  'Air Conditioning': 'amenityAirConditioning',
  'Mini Bar': 'amenityMiniBar',
  Safe: 'amenitySafe',
  Balcony: 'amenityBalcony',
  Breakfast: 'amenityBreakfast',
  'Ocean View': 'amenityOceanView',
  'Room Service': 'amenityRoomService',
  Jacuzzi: 'amenityJacuzzi',
  'Extra Beds': 'amenityExtraBeds',
  'Kids Area': 'amenityKidsArea',
  'Front Desk': 'departmentFrontDesk',
  Housekeeping: 'departmentHousekeeping',
  Maintenance: 'departmentMaintenance',
  Reservations: 'departmentReservations',
  Finance: 'departmentFinance',
  Unassigned: 'unassigned',
  Standard: 'roomTypeValueStandardShort',
  'Room charge': 'invoiceLineRoomCharge',
  'Room Charge': 'invoiceLineRoomCharge',
  'Service charges': 'invoiceLineServiceCharges',
  'Service Charges': 'invoiceLineServiceCharges',
  VAT: 'invoiceLineVat',
  Discount: 'invoiceLineDiscount',
  Discounts: 'invoiceLineDiscount',
  'Balance due': 'invoiceLineBalanceDue',
  'Outstanding balance': 'invoiceLineOutstandingBalance',
  'Total paid': 'invoiceLineTotalPaid',
};

const SERVER_MESSAGE_KEYS = {
  'Search failed. Please try again.': 'errors.searchFailed',
  'Search failed.': 'errors.searchFailedShort',
  'Reservation request failed. Please try again.': 'errors.reservationRequestFailed',
  'Something went wrong. Please try again.': 'errors.generic',
  'Unknown error': 'errors.unknown',
  'Failed to fetch room types': 'errors.fetchRoomTypes',
  'Failed to create room type': 'errors.createRoomType',
  'Failed to update room type': 'errors.updateRoomType',
  'Failed to delete room type': 'errors.deleteRoomType',
  'Cannot delete this Room Type because it is assigned to rooms.': 'errors.deleteRoomTypeAssigned',
  'Failed to fetch staff': 'errors.fetchStaff',
  'Failed to create staff': 'errors.createStaff',
  'Failed to update staff': 'errors.updateStaff',
  'Failed to activate staff': 'errors.activateStaff',
  'Failed to deactivate staff': 'errors.deactivateStaff',
  'Failed to unlock staff account': 'errors.unlockStaff',
  'You cannot deactivate your own account': 'errors.deactivateOwnAccount',
  'Invalid reservation identifier': 'errors.invalidReservationIdentifier',
};

export const getRoomStatusLabel = (status, t) =>
  translateWithFallback(t, ROOM_STATUS_KEYS[status], humanizeStatus(status));

export const getReservationStatusLabel = (status, t) =>
  translateWithFallback(t, RESERVATION_STATUS_KEYS[status], humanizeStatus(status));

export const getRoleCodeLabel = (role, t) =>
  translateWithFallback(
    t,
    ROLE_CODE_KEYS[role],
    String(role ?? '-')
      .replace(/^ROLE_/, '')
      .toLowerCase()
      .replace(/\b\w/g, (segment) => segment.toUpperCase())
  );

export const getInvoiceDeliveryStatusLabel = (status, t) =>
  translateWithFallback(t, INVOICE_DELIVERY_STATUS_KEYS[status], humanizeStatus(status));

export const getPaymentStatusLabel = (status, t) =>
  translateWithFallback(t, PAYMENT_STATUS_KEYS[status], humanizeStatus(status));

const translateKnownLineItemPrefix = (normalized, t, pattern, key) => {
  const match = normalized.match(pattern);
  if (!match) return null;

  const translated = translateWithFallback(t, key, normalized);
  const suffix = match[1] ?? '';
  return `${translated}${suffix}`;
};

export const translateBillLineItemLabel = (label, t) => {
  const normalized = String(label ?? '').trim();
  if (!normalized) return '-';

  const exactKey = KNOWN_VALUE_KEYS[normalized];
  if (exactKey) {
    return translateWithFallback(t, exactKey, normalized);
  }

  const roomChargeMatch = normalized.match(/^Room Charge(?:\s*\((.+)\))?$/i);
  if (roomChargeMatch) {
    const details = roomChargeMatch[1];
    if (!details) {
      return translateWithFallback(t, 'invoiceLineRoomCharge', normalized);
    }

    const parsedStayDetails = details.match(/^(\d+)\s+night(?:s)?\s+x\s+(.+)$/i);
    if (parsedStayDetails) {
      const [, count, rate] = parsedStayDetails;
      return translateWithFallback(
        t,
        'checkoutPage.roomChargeLabel',
        `${translateWithFallback(t, 'invoiceLineRoomCharge', 'Room charge')} (${details})`,
        { count: Number(count), rate }
      );
    }

    return `${translateWithFallback(t, 'invoiceLineRoomCharge', 'Room charge')} (${details})`;
  }

  const vatMatch = normalized.match(/^VAT(?:\s*\((.+)\))?$/i);
  if (vatMatch) {
    const details = vatMatch[1];
    if (!details) {
      return translateWithFallback(t, 'invoiceLineVat', normalized);
    }

    const parsedRate = details.replace(/%/g, '').trim();
    if (parsedRate) {
      return translateWithFallback(
        t,
        'checkoutPage.vatLabel',
        `${translateWithFallback(t, 'invoiceLineVat', 'VAT')} (${details})`,
        { rate: parsedRate }
      );
    }

    return `${translateWithFallback(t, 'invoiceLineVat', 'VAT')} (${details})`;
  }

  return (
    translateKnownLineItemPrefix(
      normalized,
      t,
      /^Additional Service Charges(.*)$/i,
      'invoiceLineServiceCharges'
    ) ??
    translateKnownLineItemPrefix(normalized, t, /^Service Charges?(.*)$/i, 'invoiceLineServiceCharges') ??
    translateKnownLineItemPrefix(normalized, t, /^Discounts?(.*)$/i, 'invoiceLineDiscount') ??
    translateKnownLineItemPrefix(normalized, t, /^Balance Due(.*)$/i, 'invoiceLineBalanceDue') ??
    translateKnownLineItemPrefix(
      normalized,
      t,
      /^Outstanding Balance(.*)$/i,
      'invoiceLineOutstandingBalance'
    ) ??
    translateKnownLineItemPrefix(normalized, t, /^Total Paid(.*)$/i, 'invoiceLineTotalPaid') ??
    normalized
  );
};

export const translateKnownValue = (value, t) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) return '-';

  const key = KNOWN_VALUE_KEYS[normalized];
  return key ? translateWithFallback(t, key, normalized) : normalized;
};

export const localizeKnownServerMessage = (message, t = i18n.t.bind(i18n)) => {
  const normalized = String(message ?? '').trim();
  if (!normalized) return normalized;

  const key = SERVER_MESSAGE_KEYS[normalized];
  return key ? t(key) : normalized;
};

export const getBooleanLabel = (value, t) =>
  value ? translateWithFallback(t, 'common.yes', 'Yes') : translateWithFallback(t, 'common.no', 'No');

export const getCommonLabel = (key, t, fallback, options) =>
  translateWithFallback(t, `common.${key}`, fallback, options);
