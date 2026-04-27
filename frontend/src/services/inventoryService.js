import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const extractInventoryError = (err) =>
  extractApiErrorMessage(err, 'Failed to load inventory data.');

const buildDateParams = (filters = {}) => {
  const params = {};
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  return params;
};

export const getInventoryItems = async ({ activeOnly = false } = {}) => {
  const response = await api.get('/inventory/items', {
    params: { activeOnly },
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const createInventoryItem = async (payload) => {
  const response = await api.post('/inventory/items', payload);
  return response.data;
};

export const updateInventoryItem = async (id, payload) => {
  const response = await api.put(`/inventory/items/${id}`, payload);
  return response.data;
};

export const restockInventoryItem = async (id, payload) => {
  const response = await api.post(`/inventory/items/${id}/restock`, payload);
  return response.data;
};

export const adjustInventoryItem = async (id, payload) => {
  const response = await api.post(`/inventory/items/${id}/adjust`, payload);
  return response.data;
};

export const getInventoryTransactions = async (filters = {}) => {
  const response = await api.get('/inventory/transactions', {
    params: buildDateParams(filters),
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const getInventoryUsageRecords = async (filters = {}) => {
  const response = await api.get('/inventory/usage-records', {
    params: buildDateParams(filters),
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const getInventorySummary = async (filters = {}) => {
  const response = await api.get('/inventory/summary', {
    params: buildDateParams(filters),
  });
  return response.data;
};

export const getServiceUsageTemplates = async () => {
  const response = await api.get('/inventory/templates');
  return Array.isArray(response.data) ? response.data : [];
};

export const createServiceUsageTemplate = async (payload) => {
  const response = await api.post('/inventory/templates', payload);
  return response.data;
};

export const updateServiceUsageTemplate = async (id, payload) => {
  const response = await api.put(`/inventory/templates/${id}`, payload);
  return response.data;
};

export const previewRoomService = async (roomId, payload = {}) => {
  const response = await api.post(`/rooms/${roomId}/service-preview`, payload);
  return response.data;
};

export const completeRoomService = async (roomId, payload) => {
  const response = await api.post(`/rooms/${roomId}/complete-service`, payload);
  return response.data;
};

export const getInventoryRoomTypes = async () => {
  const response = await api.get('/room-types');
  return Array.isArray(response.data) ? response.data : [];
};
