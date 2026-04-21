import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const getHotelSettings = async () => {
  const response = await api.get('/hotel-settings');
  return response.data;
};

export const updateHotelSettings = async (payload) => {
  const response = await api.put('/hotel-settings', payload);
  return response.data;
};

export const extractHotelSettingsError = (err) =>
  extractApiErrorMessage(err, 'Unable to save hotel settings right now.');
