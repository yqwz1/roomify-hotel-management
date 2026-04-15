import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const extractNotificationError = (err) =>
  extractApiErrorMessage(err, 'Failed to load notifications.');

export const getNotifications = async (params = {}) => {
  const response = await api.get('/notifications', { params });
  return response.data;
};
