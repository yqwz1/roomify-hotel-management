import axios from 'axios';
import { localizeKnownServerMessage } from '../utils/localization';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const extractSearchError = (err) => {
  const data = err?.response?.data;
  if (!data) {
    return localizeKnownServerMessage(err?.message ?? 'Search failed. Please try again.');
  }

  if (data.validationErrors) {
    return localizeKnownServerMessage(
      Object.values(data.validationErrors).join(' · ')
    );
  }

  if (data.message) return localizeKnownServerMessage(data.message);

  return localizeKnownServerMessage(err?.message ?? 'Search failed.');
};

export const searchRooms = async (params) => {
  const query = {
    checkIn: params.checkIn,
    checkOut: params.checkOut,
  };

  if (params.roomName) query.roomName = params.roomName;
  if (params.roomType) query.roomType = params.roomType;
  if (params.minPrice) query.minPrice = params.minPrice;
  if (params.maxPrice) query.maxPrice = params.maxPrice;
  if (params.guestCapacity) query.guestCapacity = params.guestCapacity;
  if (params.sortBy) query.sortBy = params.sortBy;
  if (params.sortDirection) query.sortDirection = params.sortDirection;

  const response = await publicApi.get('/rooms/search', { params: query });
  return response.data;
};
