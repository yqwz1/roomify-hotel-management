export const getDataSummary = async () => ({
  totalReservations: 0,
  totalRevenue: 0,
  totalExpenses: 0,
  occupancyRate: 0,
  roomTypeCount: 0,
});

export const getSummary = async () => ({
  status: 'placeholder',
  generatedAt: null,
  message: '',
});

export const getRevenueTrend = async () => [];

export const getOccupancyTrend = async () => [];

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
