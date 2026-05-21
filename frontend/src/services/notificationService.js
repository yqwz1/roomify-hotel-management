import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const extractNotificationError = (err) =>
  extractApiErrorMessage(err, 'Failed to load notifications.');

export const extractEmailDeliveryError = (err) =>
  extractApiErrorMessage(err, 'Failed to load email deliveries.');

export const getNotifications = async (params = {}) => {
  const response = await api.get('/notifications', { params });
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data?.unreadCount ?? 0;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markNotificationAsUnread = async (id) => {
  const response = await api.patch(`/notifications/${id}/unread`);
  return response.data;
};

export const getEmailDeliveries = async (params = {}) => {
  const response = await api.get('/notifications/email-deliveries', { params });
  return response.data;
};

export const getEmailDeliveryStats = async () => {
  const response = await api.get('/notifications/email-deliveries/stats');
  return response.data;
};

export const retryEmailDelivery = async (id) => {
  const response = await api.post(`/notifications/email-deliveries/${id}/retry`);
  return response.data;
};
