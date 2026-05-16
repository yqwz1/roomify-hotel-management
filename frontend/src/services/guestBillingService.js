import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const recordGuestReservationPayment = async (confirmationNumber, amount) => {
  const response = await api.post(`/guest/reservations/${confirmationNumber}/bill/payments`, {
    amount,
  });
  return response.data;
};

export const extractGuestBillingError = (err) =>
  extractApiErrorMessage(err, 'Unable to process your payment right now. Please try again.');
