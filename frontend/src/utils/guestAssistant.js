export const QUICK_ACTION_OPTIONS = [
  { id: 'ROOM_SERVICE', label: 'Room Service' },
  { id: 'HOUSEKEEPING', label: 'Housekeeping' },
  { id: 'MAINTENANCE', label: 'Maintenance' },
];

const CHECKED_IN_STATUS = 'CHECKED_IN';
const CHECKED_OUT_STATUS = 'CHECKED_OUT';
const CANCELLED_STATUS = 'CANCELLED';
const COMPLETED_STATUS = 'COMPLETED';
const ROOM_ASSISTANT_SUBJECT = 'Guest Assistant';

export const normalizeGuestReservationStatus = (reservation) =>
  String(reservation?.status ?? '').trim().toUpperCase();

export const isGuestActiveReservation = (reservation) => {
  const status = normalizeGuestReservationStatus(reservation);
  if (!status) {
    return false;
  }

  if (
    status === CHECKED_OUT_STATUS
    || status === CANCELLED_STATUS
    || status === COMPLETED_STATUS
  ) {
    return false;
  }

  if (!reservation?.checkOutDate) {
    return false;
  }

  const checkout = new Date(`${reservation.checkOutDate}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return !Number.isNaN(checkout.getTime()) && checkout >= today;
};

export const isGuestCheckedInReservation = (reservation) =>
  normalizeGuestReservationStatus(reservation) === CHECKED_IN_STATUS
  && Boolean(reservation?.roomId)
  && Boolean(reservation?.roomNumber);

export const isGuestCheckedOutReservation = (reservation) =>
  normalizeGuestReservationStatus(reservation) === CHECKED_OUT_STATUS;

export const getGuestReservationRoomTypeLabel = (reservation) => {
  const roomType = reservation?.roomType?.name
    ?? reservation?.roomTypeName
    ?? reservation?.roomType
    ?? reservation?.room?.roomType?.name
    ?? reservation?.room?.roomTypeName
    ?? reservation?.roomTypeLabel
    ?? '';

  return typeof roomType === 'string' ? roomType.trim() : '';
};

export const buildGuestReservationRoomContextLabel = (reservation) => {
  if (!reservation?.roomNumber) {
    return getGuestReservationRoomTypeLabel(reservation) || 'Room';
  }

  const roomLabel = `Room ${reservation.roomNumber}`;
  const roomTypeLabel = getGuestReservationRoomTypeLabel(reservation);

  return roomTypeLabel ? `${roomLabel} - ${roomTypeLabel}` : roomLabel;
};

export const buildGuestAssistantConversationSubject = (reservation) =>
  getGuestReservationRoomTypeLabel(reservation) || ROOM_ASSISTANT_SUBJECT;

export const getGuestAssistantReservationAccess = (reservations = []) => {
  const allReservations = Array.isArray(reservations) ? reservations : [];
  const activeReservations = allReservations.filter(isGuestActiveReservation);
  const checkedInReservations = allReservations.filter(isGuestCheckedInReservation);
  const checkedOutReservations = allReservations.filter(isGuestCheckedOutReservation);
  const pendingReservations = allReservations.filter(
    (reservation) =>
      !isGuestCheckedInReservation(reservation) && !isGuestCheckedOutReservation(reservation)
  );

  return {
    allReservations,
    activeReservations,
    checkedInReservations,
    checkedOutReservations,
    pendingReservations,
    hasCheckedInReservations: checkedInReservations.length > 0,
    hasCheckedOutReservations: checkedOutReservations.length > 0,
    hasAnyReservations: activeReservations.length > 0,
    requiresCheckIn: activeReservations.length > 0 && checkedInReservations.length === 0 && pendingReservations.length > 0,
    checkedOutOnly:
      activeReservations.length === 0
      && checkedOutReservations.length > 0
      && pendingReservations.length === 0,
  };
};

export const getLanguageCode = (language) => {
  if (!language) return 'en';
  const normalized = String(language).trim().toLowerCase();
  if (normalized.startsWith('ar')) return 'ar';
  if (normalized.startsWith('fr')) return 'fr';
  if (normalized.startsWith('tr')) return 'tr';
  return 'en';
};

export const sortConversations = (items = []) =>
  [...items].sort((left, right) => new Date(right.lastMessageAt) - new Date(left.lastMessageAt));

export const mergeConversationList = (items = [], nextConversation) => {
  if (!nextConversation?.publicId) return sortConversations(items);
  const nextItems = items.some((item) => item.publicId === nextConversation.publicId)
    ? items.map((item) => (item.publicId === nextConversation.publicId ? nextConversation : item))
    : [nextConversation, ...items];
  return sortConversations(nextItems);
};

export const mergeMessagesById = (messages = [], nextMessage) => {
  if (!nextMessage?.id) return messages;
  const hasExisting = messages.some((message) => message.id === nextMessage.id);
  const nextMessages = hasExisting
    ? messages.map((message) => (message.id === nextMessage.id ? nextMessage : message))
    : [...messages, nextMessage];
  return nextMessages.sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
};

export const selectMessageBody = (message, { guestView = false, translationMode = 'original' } = {}) => {
  if (!message) return '';
  if (guestView && message.guestLocalizedBody) {
    return message.guestLocalizedBody;
  }
  if (translationMode === 'ar' && message.arabicTranslation) {
    return message.arabicTranslation;
  }
  if (translationMode === 'en' && message.englishTranslation) {
    return message.englishTranslation;
  }
  return message.originalBody;
};

export const getMessageStatusLabel = (message) => {
  if (!message?.messageStatus) return '';
  return message.messageStatus.toLowerCase();
};

export const buildConversationLabel = (conversation) => {
  if (!conversation) return 'Guest Assistant';
  const roomLabel = conversation.roomNumber ? `Room ${conversation.roomNumber}` : 'Hotel support';
  if (conversation.subject) {
    return `${conversation.subject} - ${roomLabel}`;
  }
  return roomLabel;
};
