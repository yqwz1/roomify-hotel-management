import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const extractDashboardError = (err) =>
  extractApiErrorMessage(err, 'Dashboard request failed. Please try again.');

export const getDashboardMetrics = async ({ startDate, endDate }) => {
  const response = await api.get('/dashboard/metrics', {
    params: { startDate, endDate },
  });
  return response.data;
};

export const getOccupancyTrend = async ({ startDate, endDate }) => {
  const response = await api.get('/dashboard/trends/occupancy', {
    params: { startDate, endDate },
  });
  return response.data;
};

export const getRevenueTrend = async ({ startDate, endDate }) => {
  const response = await api.get('/dashboard/trends/revenue', {
    params: { startDate, endDate },
  });
  return response.data;
};

export const getRoomTypeDistribution = async () => {
  const response = await api.get('/dashboard/room-type-distribution');
  return response.data;
};

export const exportDashboardReport = async (payload) => {
  const response = await api.post('/dashboard/reports/export', payload);
  return response.data;
};
