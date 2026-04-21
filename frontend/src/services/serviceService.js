import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const extractServiceError = (err) =>
  extractApiErrorMessage(err, 'Failed to load hotel services.');

export const getServices = async () => {
  const response = await api.get('/services');
  return Array.isArray(response.data) ? response.data : [];
};

export const createService = async (payload) => {
  const response = await api.post('/services', payload);
  return response.data;
};

export const updateService = async (id, payload) => {
  const response = await api.put(`/services/${id}`, payload);
  return response.data;
};

export const deleteService = async (id) => {
  await api.delete(`/services/${id}`);
};
