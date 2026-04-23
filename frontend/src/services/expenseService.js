import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const extractExpenseError = (err) =>
  extractApiErrorMessage(err, 'Failed to load expenses.');

const buildParams = (filters = {}) => {
  const params = {};

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.category) params.category = filters.category;
  if (filters.vendor) params.vendor = filters.vendor;

  return params;
};

export const getExpenses = async (filters = {}) => {
  const response = await api.get('/expenses', {
    params: buildParams(filters),
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const getExpenseSummary = async (filters = {}) => {
  const response = await api.get('/expenses/summary', {
    params: buildParams(filters),
  });
  return response.data;
};

export const getExpense = async (id) => {
  const response = await api.get(`/expenses/${id}`);
  return response.data;
};

export const createExpense = async (payload) => {
  const response = await api.post('/expenses', payload);
  return response.data;
};

export const updateExpense = async (id, payload) => {
  const response = await api.put(`/expenses/${id}`, payload);
  return response.data;
};

export const deleteExpense = async (id) => {
  await api.delete(`/expenses/${id}`);
};
