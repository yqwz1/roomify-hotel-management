import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const getGuestProfile = async () => {
  const response = await api.get('/guest/profile');
  return response.data;
};

export const updateGuestProfile = async (payload) => {
  const response = await api.put('/guest/profile', payload);
  return response.data;
};

export const getGuestReservations = async () => {
  const response = await api.get('/guest/reservations');
  return Array.isArray(response.data) ? response.data : [];
};

export const getGuestReservationByConfirmation = async (confirmationNumber) => {
  const response = await api.get(`/guest/reservations/${confirmationNumber}`);
  return response.data;
};

export const createGuestReservation = async (payload) => {
  const response = await api.post('/guest/reservations', payload);
  return response.data;
};

export const modifyGuestReservation = async (confirmationNumber, payload) => {
  const response = await api.put(`/guest/reservations/${confirmationNumber}`, payload);
  return response.data;
};

export const cancelGuestReservation = async (confirmationNumber, cancellationReason) => {
  const trimmedReason = String(cancellationReason ?? '').trim();
  const payload = trimmedReason ? { cancellationReason: trimmedReason } : {};
  const response = await api.post(`/guest/reservations/${confirmationNumber}/cancel`, payload);
  return response.data;
};

export const extractGuestReservationError = (err) =>
  extractApiErrorMessage(
    err,
    'Unable to load your stay details right now. Please try again.'
  );
