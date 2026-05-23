import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const extractGuestAssistantError = (err) =>
  extractApiErrorMessage(err, 'Guest assistant request failed. Please try again.');

export const listGuestConversations = async () => {
  const response = await api.get('/guest-assistant/conversations');
  return Array.isArray(response.data) ? response.data : [];
};

export const createGuestConversation = async (payload = {}) => {
  const response = await api.post('/guest-assistant/conversations', payload);
  return response.data;
};

export const getGuestConversation = async (publicId) => {
  const response = await api.get(`/guest-assistant/conversations/${publicId}`);
  return response.data;
};

export const sendGuestConversationMessage = async (publicId, payload) => {
  const response = await api.post(`/guest-assistant/conversations/${publicId}/messages`, payload);
  return response.data;
};

export const runGuestQuickAction = async (publicId, payload) => {
  const response = await api.post(`/guest-assistant/conversations/${publicId}/quick-actions`, payload);
  return response.data;
};

export const markGuestConversationRead = async (publicId) => {
  const response = await api.post(`/guest-assistant/conversations/${publicId}/read`);
  return response.data;
};

export const listStaffGuestConversations = async (params = {}) => {
  const response = await api.get('/staff/guest-assistant/conversations', { params });
  return Array.isArray(response.data) ? response.data : [];
};

export const getStaffGuestConversation = async (publicId) => {
  const response = await api.get(`/staff/guest-assistant/conversations/${publicId}`);
  return response.data;
};

export const sendStaffGuestReply = async (publicId, payload) => {
  const response = await api.post(`/staff/guest-assistant/conversations/${publicId}/messages`, payload);
  return response.data;
};

export const markStaffGuestConversationRead = async (publicId) => {
  const response = await api.post(`/staff/guest-assistant/conversations/${publicId}/read`);
  return response.data;
};

export const resolveStaffGuestConversation = async (publicId) => {
  const response = await api.post(`/staff/guest-assistant/conversations/${publicId}/resolve`);
  return response.data;
};
