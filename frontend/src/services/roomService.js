import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const extractErrorMessage = (err) =>
  extractApiErrorMessage(err, 'Room status request failed. Please try again.');

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
    timeout: 20000,
  });
  return response.data;
};

export const deleteRoom = async (id) => {
  await api.delete(`/rooms/${id}`);
};
