import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const extractAuditLogError = (err) =>
  extractApiErrorMessage(err, 'Failed to load audit logs.');

export const getRecentAuditLogs = async (limit = 10) => {
  const response = await api.get('/audit-logs', {
    params: { limit },
  });
  return response.data;
};
