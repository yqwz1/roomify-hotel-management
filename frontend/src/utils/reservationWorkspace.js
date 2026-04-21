import { ReservationStatus } from '../domain/reservations/statusRules';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getReservationStatusLabel,
  translateWithFallback,
} from './localization';

export const RESERVATION_WORKSPACE_SELECTED_PARAM = 'selected';

export const formatDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const normalizeWorkspaceValue = (value) => String(value ?? '').trim();

export const normalizeReservationWorkspaceFilters = (filters = {}) => ({
  queueTab: normalizeWorkspaceValue(filters.queueTab),
  confirmation: normalizeWorkspaceValue(filters.confirmation),
  guestName: normalizeWorkspaceValue(filters.guestName),
  status: normalizeWorkspaceValue(filters.status),
  checkInDate: normalizeWorkspaceValue(filters.checkInDate),
  checkOutDate: normalizeWorkspaceValue(filters.checkOutDate),
});

export const buildReservationWorkspaceTabDefaults = (tabId, today) => {
  switch (tabId) {
    case 'departures':
      return {
        queueTab: 'departures',
        confirmation: '',
        guestName: '',
        status: '',
        checkInDate: '',
        checkOutDate: today,
      };
    case 'inHouse':
      return {
        queueTab: 'inHouse',
        confirmation: '',
        guestName: '',
        status: '',
        checkInDate: '',
        checkOutDate: '',
      };
    case 'all':
      return {
        queueTab: 'all',
        confirmation: '',
        guestName: '',
        status: '',
        checkInDate: '',
        checkOutDate: '',
      };
    case 'arrivals':
    default:
      return {
        queueTab: 'arrivals',
        confirmation: '',
        guestName: '',
        status: '',
        checkInDate: today,
        checkOutDate: '',
      };
  }
};

export const createReservationWorkspaceFiltersFromSearchParams = (searchParams, today) => {
  const hasParams = Array.from(searchParams.keys()).length > 0;
  const requestedTab =
    normalizeWorkspaceValue(searchParams.get('queueTab')) || (hasParams ? 'all' : 'arrivals');
  const defaults = buildReservationWorkspaceTabDefaults(requestedTab, today);

  return {
    ...defaults,
    confirmation: normalizeWorkspaceValue(searchParams.get('confirmation')),
    guestName: normalizeWorkspaceValue(searchParams.get('guestName')),
    status: normalizeWorkspaceValue(searchParams.get('status')),
    checkInDate: normalizeWorkspaceValue(searchParams.get('checkInDate')) || defaults.checkInDate,
    checkOutDate:
      normalizeWorkspaceValue(searchParams.get('checkOutDate')) || defaults.checkOutDate,
  };
};

export const buildReservationWorkspaceSearchParams = (filters, selected = '') => {
  const params = new URLSearchParams();
  const normalized = normalizeReservationWorkspaceFilters(filters);

  Object.entries(normalized).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const normalizedSelected = normalizeWorkspaceValue(selected);
  if (normalizedSelected) {
    params.set(RESERVATION_WORKSPACE_SELECTED_PARAM, normalizedSelected);
  }

  return params;
};

export const areReservationWorkspaceFiltersEqual = (left = {}, right = {}) =>
  ['queueTab', 'confirmation', 'guestName', 'status', 'checkInDate', 'checkOutDate'].every(
    (key) => normalizeWorkspaceValue(left[key]) === normalizeWorkspaceValue(right[key])
  );

export const countReservationWorkspaceFilters = (filters) =>
  ['confirmation', 'guestName', 'status', 'checkInDate', 'checkOutDate'].filter((key) =>
    Boolean(normalizeWorkspaceValue(filters[key]))
  ).length;

export const getReservationWorkspaceTabLabel = (queueTab, t) => {
  switch (queueTab) {
    case 'inHouse':
      return t('staffDashboardPage.tabs.inHouse');
    case 'departures':
      return t('staffDashboardPage.tabs.departures');
    case 'all':
      return t('staffDashboardPage.tabs.all');
    case 'arrivals':
    default:
      return t('staffDashboardPage.tabs.arrivals');
  }
};

export const buildReservationWorkspaceFilterChips = (filters, t, language) => {
  const chips = [
    {
      key: 'queueTab',
      label: translateWithFallback(t, 'staffDashboardPage.activeQueue', 'Queue'),
      value: getReservationWorkspaceTabLabel(filters.queueTab || 'arrivals', t),
      ltr: false,
    },
  ];

  if (normalizeWorkspaceValue(filters.confirmation)) {
    chips.push({
      key: 'confirmation',
      label: t('confirmationNumber'),
      value: normalizeWorkspaceValue(filters.confirmation),
      ltr: true,
    });
  }

  if (normalizeWorkspaceValue(filters.guestName)) {
    chips.push({
      key: 'guestName',
      label: t('guestName'),
      value: normalizeWorkspaceValue(filters.guestName),
      ltr: false,
    });
  }

  if (normalizeWorkspaceValue(filters.status)) {
    chips.push({
      key: 'status',
      label: t('status'),
      value: getReservationStatusLabel(normalizeWorkspaceValue(filters.status), t),
      ltr: false,
    });
  }

  if (normalizeWorkspaceValue(filters.checkInDate)) {
    chips.push({
      key: 'checkInDate',
      label: t('checkInDate'),
      value: formatLocalizedDate(filters.checkInDate, language, { dateStyle: 'medium' }),
      ltr: false,
    });
  }

  if (normalizeWorkspaceValue(filters.checkOutDate)) {
    chips.push({
      key: 'checkOutDate',
      label: t('checkOutDate'),
      value: formatLocalizedDate(filters.checkOutDate, language, { dateStyle: 'medium' }),
      ltr: false,
    });
  }

  return chips;
};

export const toQueueReservation = (reservation) => ({
  id: reservation?.id ?? null,
  confirmationNumber: reservation?.confirmationNumber,
  status: reservation?.status,
  guestName: reservation?.guestName ?? reservation?.guest?.name,
  guestEmail: reservation?.guestEmail ?? reservation?.guest?.email,
  roomNumber: reservation?.roomNumber ?? reservation?.room?.roomNumber,
  roomTypeName: reservation?.roomTypeName ?? reservation?.room?.roomTypeName,
  checkInDate: reservation?.checkInDate ?? reservation?.dates?.checkIn,
  checkOutDate: reservation?.checkOutDate ?? reservation?.dates?.checkOut,
  nights: reservation?.nights ?? reservation?.dates?.nights ?? 0,
  totalPrice: reservation?.totalPrice ?? reservation?.pricing?.totalPrice ?? 0,
  outstandingBalance: reservation?.outstandingBalance,
});

export const getReservationWorkspaceActionLabel = (reservation, today, t) => {
  if (reservation.status === ReservationStatus.CONFIRMED) {
    return t('staffDashboardPage.queueActionArrivals');
  }

  if (
    reservation.status === ReservationStatus.CHECKED_IN &&
    reservation.checkOutDate === today
  ) {
    return t('staffDashboardPage.queueActionDepartures');
  }

  if (reservation.status === ReservationStatus.CHECKED_IN) {
    return t('staffDashboardPage.queueActionInHouse');
  }

  if (reservation.status === ReservationStatus.PENDING) {
    return t('staffDashboardPage.queueActionPending');
  }

  return t('staffDashboardPage.queueActionReview');
};

export const buildReservationWorkspaceQueueContext = (searchParams, t, language) => {
  const queueTab = normalizeWorkspaceValue(searchParams.get('queueTab'));
  const confirmation = normalizeWorkspaceValue(searchParams.get('confirmation'));
  const guestName = normalizeWorkspaceValue(searchParams.get('guestName'));
  const status = normalizeWorkspaceValue(searchParams.get('status'));
  const checkInDate = normalizeWorkspaceValue(searchParams.get('checkInDate'));
  const checkOutDate = normalizeWorkspaceValue(searchParams.get('checkOutDate'));

  const items = [];

  if (queueTab) {
    items.push({
      label: t('reservationDetailsPage.queueContextFocus'),
      value: getReservationWorkspaceTabLabel(queueTab, t),
    });
  }

  if (confirmation) {
    items.push({
      label: t('confirmationNumber'),
      value: confirmation,
      ltr: true,
    });
  }

  if (guestName) {
    items.push({
      label: t('guestName'),
      value: guestName,
      ltr: false,
    });
  }

  if (status) {
    items.push({
      label: t('status'),
      value: getReservationStatusLabel(status, t),
      ltr: false,
    });
  }

  if (checkInDate) {
    items.push({
      label: t('checkInDate'),
      value: formatLocalizedDate(checkInDate, language, { dateStyle: 'medium' }),
      ltr: false,
    });
  }

  if (checkOutDate) {
    items.push({
      label: t('checkOutDate'),
      value: formatLocalizedDate(checkOutDate, language, { dateStyle: 'medium' }),
      ltr: false,
    });
  }

  return items;
};

export const createReservationQueueMetrics = (reservations, today) => {
  const arrivalsReady = reservations.filter(
    (reservation) => reservation.status === ReservationStatus.CONFIRMED
  ).length;
  const departuresToday = reservations.filter(
    (reservation) =>
      reservation.status === ReservationStatus.CHECKED_IN && reservation.checkOutDate === today
  ).length;
  const balancesDue = reservations.filter(
    (reservation) => Number(reservation.outstandingBalance ?? 0) > 0
  ).length;

  return {
    visibleCount: reservations.length,
    arrivalsReady,
    departuresToday,
    balancesDue,
  };
};

export const formatReservationWorkspaceMoney = (value, language) =>
  formatLocalizedCurrency(value, language);
