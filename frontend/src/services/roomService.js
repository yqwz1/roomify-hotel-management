import api from './api';
import { localizeKnownServerMessage } from '../utils/localization';

export const extractErrorMessage = (err) => {
  const data = err?.response?.data;
  if (!data) return localizeKnownServerMessage(err?.message ?? 'Unknown error');

  if (data.validationErrors) {
    return localizeKnownServerMessage(
      Object.values(data.validationErrors).join(' · ')
    );
  }

  if (data.message) return localizeKnownServerMessage(data.message);

  return localizeKnownServerMessage(err?.message ?? 'Unknown error');
};

export const getRooms = async (filters = {}) => {
  const params = {};
  if (filters.status) params.status = filters.status;
  if (filters.floor) params.floor = filters.floor;
  if (filters.type) params.type = filters.type;

  const response = await api.get('/rooms', { params });
  return response.data;
};

export const getRoomById = async (id) => {
  const response = await api.get(`/rooms/${id}`);
  return response.data;
};

export const getValidNextStatuses = async (id) => {
  const response = await api.get(`/rooms/${id}/valid-next-statuses`);
  return response.data;
};

export const createRoom = async (data) => {
  const response = await api.post('/rooms', data);
  return response.data;
};

export const updateRoom = async (id, data) => {
  const response = await api.put(`/rooms/${id}`, data);
  return response.data;
};

export const updateRoomStatus = async (id, status) => {
  const response = await api.put(`/rooms/${id}/status`, null, {
    params: { status },
  });
  return response.data;
};

export const deleteRoom = async (id) => {
  await api.delete(`/rooms/${id}`);
};
