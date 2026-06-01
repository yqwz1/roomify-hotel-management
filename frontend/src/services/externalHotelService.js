import axios from 'axios';
import { localizeKnownServerMessage } from '../utils/localization';

const externalHotelApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

export const extractExternalHotelError = (err) => {
  const data = err?.response?.data;
  if (data?.message) return localizeKnownServerMessage(data.message);
  return localizeKnownServerMessage(err?.message ?? 'External hotel search failed.');
};

export const searchExternalHotels = async (params = {}) => {
  const query = {};
  if (params.query?.trim()) query.query = params.query.trim();
  if (params.city?.trim()) query.city = params.city.trim();
  if (params.lat) query.lat = params.lat;
  if (params.lng) query.lng = params.lng;

  const response = await externalHotelApi.get('/external-hotels/search', { params: query });
  return response.data;
};

export const getExternalHotelDetails = async (placeId) => {
  const response = await externalHotelApi.get(`/external-hotels/${encodeURIComponent(placeId)}`);
  return response.data;
};

export const getExternalHotelPhotoUrl = (placeId, photoName) => {
  if (!photoName) return '';
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/$/, '');
  const encodedPlaceId = encodeURIComponent(placeId);
  const encodedPhotoName = encodeURIComponent(photoName);
  return `${baseUrl}/external-hotels/${encodedPlaceId}/photo?photoName=${encodedPhotoName}`;
};
