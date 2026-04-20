export const EMPTY_RESERVATION_LOOKUP_FILTERS = Object.freeze({
  confirmation: '',
  guestName: '',
  status: '',
  checkInDate: '',
  checkOutDate: '',
});

const normalizeLookupValue = (value) => String(value ?? '').trim();

export const normalizeReservationLookupFilters = (filters = {}) => ({
  confirmation: normalizeLookupValue(filters.confirmation),
  guestName: normalizeLookupValue(filters.guestName),
  status: normalizeLookupValue(filters.status),
  checkInDate: normalizeLookupValue(filters.checkInDate),
  checkOutDate: normalizeLookupValue(filters.checkOutDate),
});

export const hasReservationLookupFilters = (filters = {}) =>
  Object.values(normalizeReservationLookupFilters(filters)).some(Boolean);

export const isLikelyConfirmationValue = (value) => {
  const normalized = normalizeLookupValue(value);

  if (!normalized || /\s/.test(normalized)) {
    return false;
  }

  return /[-\d]/.test(normalized);
};

export const buildReservationLookupNavigationState = (filters = {}) => ({
  initialFilters: normalizeReservationLookupFilters(filters),
});

export const readReservationLookupNavigationState = (state = {}) => {
  const initialFilters = normalizeReservationLookupFilters(state?.initialFilters);
  const initialQuery = hasReservationLookupFilters(initialFilters)
    ? ''
    : normalizeLookupValue(state?.initialQuery ?? state?.confirmationNumber);

  return { initialFilters, initialQuery };
};
