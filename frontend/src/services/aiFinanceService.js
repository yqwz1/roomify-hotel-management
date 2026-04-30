import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const DEFAULT_AI_FINANCE_START_DATE = '2025-01-01';
export const DEFAULT_AI_FINANCE_END_DATE = '2026-04-27';

export const extractAiFinanceError = (err) =>
  extractApiErrorMessage(err, 'Failed to load AI finance data.');

export const getDataSummary = async () => {
  const response = await api.get('/ai-finance/data-summary');
  return response.data;
};

export const getSummary = async () => {
  const response = await api.get('/ai-finance/summary');
  return response.data;
};

export const getRevenueTrend = async (
  start = DEFAULT_AI_FINANCE_START_DATE,
  end = DEFAULT_AI_FINANCE_END_DATE
) => {
  const response = await api.get('/ai-finance/revenue-trend', {
    params: { start, end },
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const getOccupancyTrend = async (
  start = DEFAULT_AI_FINANCE_START_DATE,
  end = DEFAULT_AI_FINANCE_END_DATE
) => {
  const response = await api.get('/ai-finance/occupancy-trend', {
    params: { start, end },
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const getRoomTypeRevenue = async () => {
  const response = await api.get('/ai-finance/room-type-revenue');
  return Array.isArray(response.data) ? response.data : [];
};

export const getTrainingData = async () => [];

export const getModelInfo = async () => ({
  modelName: '',
  modelVersion: '',
  trainedAt: null,
  metrics: {},
});

export const getRevenueForecast = async () => [];

export const getPricingRecommendations = async () => [];

export const askAiFinance = async () => ({
  answer: '',
  sources: [],
});
