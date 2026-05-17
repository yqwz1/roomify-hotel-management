import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const getGuestServiceRequests = async () => {
  const response = await api.get('/guest/service-requests');
  return Array.isArray(response.data) ? response.data : [];
};

export const createGuestServiceRequest = async (payload) => {
  const response = await api.post('/guest/service-requests', payload);
  return response.data;
};

export const getStaffServiceRequests = async () => {
  const response = await api.get('/staff/service-requests');
  return Array.isArray(response.data) ? response.data : [];
};

export const updateStaffServiceRequestStatus = async (id, status) => {
  const response = await api.patch(`/staff/service-requests/${id}`, { status });
  return response.data;
};

export const extractGuestServiceRequestError = (err) =>
  extractApiErrorMessage(
    err,
    'Unable to load or submit service requests right now. Please try again.'
  );

export const extractStaffServiceRequestError = (err) =>
  extractApiErrorMessage(
    err,
    'Unable to load or update service requests right now. Please try again.'
  );
