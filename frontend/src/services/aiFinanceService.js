import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

const AI_FINANCE_HISTORY_DAYS = 730;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Resolved at call time so the demo window slides forward with the calendar
// instead of going stale. Matches the 2-year seasonality window the seeder
// populates and the AI service trains on.
export const getDefaultAiFinanceStartDate = () =>
  formatDate(new Date(Date.now() - AI_FINANCE_HISTORY_DAYS * MS_PER_DAY));
export const getDefaultAiFinanceEndDate = () => formatDate(new Date());

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
  start = getDefaultAiFinanceStartDate(),
  end = getDefaultAiFinanceEndDate()
) => {
  const response = await api.get('/ai-finance/revenue-trend', {
    params: { start, end },
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const getOccupancyTrend = async (
  start = getDefaultAiFinanceStartDate(),
  end = getDefaultAiFinanceEndDate()
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

export const getTrainingData = async (
  start = getDefaultAiFinanceStartDate(),
  end = getDefaultAiFinanceEndDate()
) => {
  const response = await api.get('/ai-finance/training-data', {
    params: { start, end },
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const getAiHealth = async () => {
  const response = await api.get('/ai-finance/health');
  return response.data;
};

export const getModelInfo = async () => {
  const response = await api.get('/ai-finance/model-info');
  return response.data;
};

export const getRevenueForecast = async () => {
  const response = await api.get('/ai-finance/revenue-forecast');
  return response.data;
};

export const getPricingRecommendations = async () => {
  const response = await api.get('/ai-finance/pricing-recommendations');
  if (Array.isArray(response.data)) {
    return {
      source: null,
      pricingRecommendations: response.data,
    };
  }
  const payload = response.data && typeof response.data === 'object' ? response.data : {};
  return {
    ...payload,
    pricingRecommendations: Array.isArray(payload.pricingRecommendations)
      ? payload.pricingRecommendations
      : [],
  };
};

export const askAiFinance = async (intent) => {
  const response = await api.post('/ai-finance/ask', { intent });
  return response.data;
};
