export const ReservationStatus = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
  CANCELLED: 'CANCELLED',
})

export const isReservationStatus = (value) =>
  Object.values(ReservationStatus).includes(value)

// Backend rules (ReservationService):
// - check-in: only CONFIRMED
// - cancel: blocked for CHECKED_IN / CHECKED_OUT
// - modify: blocked for CANCELLED / CHECKED_IN / CHECKED_OUT
// - check-out: only CHECKED_IN (plus invoiceFinalized + outstandingBalance==0 enforced server-side)
export const reservationStatusRules = Object.freeze({
  canCheckIn: (status) => status === ReservationStatus.CONFIRMED,
  canCancel: (status) =>
    status === ReservationStatus.PENDING || status === ReservationStatus.CONFIRMED,
  canModify: (status) =>
    status === ReservationStatus.PENDING || status === ReservationStatus.CONFIRMED,
  canCheckOut: (status) => status === ReservationStatus.CHECKED_IN,
  isReadOnly: (status) =>
    status === ReservationStatus.CANCELLED || status === ReservationStatus.CHECKED_OUT,
})

export const normalizeReservationStatusLabel = (status) =>
  String(status ?? '').replaceAll('_', ' ')

