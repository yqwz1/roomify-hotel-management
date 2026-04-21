import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const getGuestReservations = async () => {
  const response = await api.get('/guest/reservations');
  return Array.isArray(response.data) ? response.data : [];
};

export const extractGuestReservationError = (err) =>
  extractApiErrorMessage(
    err,
    'Unable to load your stay details right now. Please try again.'
  );
