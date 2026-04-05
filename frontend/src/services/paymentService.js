import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const extractPaymentError = (err) =>
  extractApiErrorMessage(err, 'Payment request failed. Please try again.');

export const createPayment = async (payload) => {
  const response = await api.post('/payments', payload);
  return response.data;
};
