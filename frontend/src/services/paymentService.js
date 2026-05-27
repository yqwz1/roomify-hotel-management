import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const extractPaymentError = (err) =>
  extractApiErrorMessage(err, 'Payment request failed. Please try again.');

export const createPayment = async (payload) => {
  const response = await api.post('/payments', payload);
  return response.data;
};

export const payGuestReservation = async (confirmationNumber, payload) => {
  const response = await api.post(`/guest/reservations/${confirmationNumber}/pay`, payload);
  return response.data;
};

export const getPaymentByReservation = async (reservationId) => {
  const response = await api.get(`/payments/by-reservation/${reservationId}`);
  return response.data;
};

export const getPaymentReceipt = async (paymentId) => {
  const response = await api.get(`/payments/receipt/${paymentId}`);
  return response.data;
};

export const listPayments = async (status) => {
  const config = status && status !== 'ALL' ? { params: { status } } : undefined;
  const response = await api.get('/payments', config);
  return Array.isArray(response.data) ? response.data : [];
};

export const refundPayment = async (paymentId, reason) => {
  const response = await api.post(`/payments/mock/${paymentId}/refund`, { reason });
  return response.data;
};
