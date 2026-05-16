import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const getGuestServices = async () => {
  const response = await api.get('/guest/services');
  return Array.isArray(response.data) ? response.data : [];
};

export const extractGuestServicesError = (err) =>
  extractApiErrorMessage(
    err,
    'Unable to load available hotel services right now. Please try again.'
  );
