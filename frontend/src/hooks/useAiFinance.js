import { useCallback, useEffect, useState } from 'react';
import {
  getDefaultAiFinanceEndDate,
  getDefaultAiFinanceStartDate,
  askAiFinance as requestAiFinanceInsight,
  extractAiFinanceError,
  getAiHealth,
  getDataSummary,
  getDemandHeatmap,
  getElasticityForecasts,
  getModelInfo,
  getOccupancyTrend,
  getPricingRecommendations,
  getRevenueForecast,
  getRevenueTrend,
  getRoomTypeRevenue,
  getSummary,
} from '../services/aiFinanceService';

const emptyState = {
  dataSummary: null,
  summary: null,
  revenueTrend: [],
  occupancyTrend: [],
  roomTypeRevenue: [],
  aiHealth: null,
  modelInfo: null,
  revenueForecast: null,
  pricingRecommendationsResponse: null,
  pricingRecommendations: [],
  elasticityForecasts: [],
  demandHeatmap: [],
};

const settleValue = (result, fallback) =>
  result.status === 'fulfilled' ? result.value : fallback;

export const useAiFinance = ({
  start = getDefaultAiFinanceStartDate(),
  end = getDefaultAiFinanceEndDate(),
  demandMonth,
  demandRoomTypeId,
} = {}) => {
  const [dataSummary, setDataSummary] = useState(emptyState.dataSummary);
  const [summary, setSummary] = useState(emptyState.summary);
  const [revenueTrend, setRevenueTrend] = useState(emptyState.revenueTrend);
  const [occupancyTrend, setOccupancyTrend] = useState(emptyState.occupancyTrend);
  const [roomTypeRevenue, setRoomTypeRevenue] = useState(emptyState.roomTypeRevenue);
  const [aiHealth, setAiHealth] = useState(emptyState.aiHealth);
  const [modelInfo, setModelInfo] = useState(emptyState.modelInfo);
  const [revenueForecast, setRevenueForecast] = useState(emptyState.revenueForecast);
  const [pricingRecommendationsResponse, setPricingRecommendationsResponse] = useState(
    emptyState.pricingRecommendationsResponse
  );
  const [pricingRecommendations, setPricingRecommendations] = useState(
    emptyState.pricingRecommendations
  );
  const [elasticityForecasts, setElasticityForecasts] = useState(emptyState.elasticityForecasts);
  const [demandHeatmap, setDemandHeatmap] = useState(emptyState.demandHeatmap);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finalAiLoading, setFinalAiLoading] = useState(true);
  const [finalAiError, setFinalAiError] = useState(null);
  const [finalAiErrors, setFinalAiErrors] = useState({});
  const [askResponse, setAskResponse] = useState(null);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [finalAiRefreshToken, setFinalAiRefreshToken] = useState(0);
  const [demandHeatmapLoading, setDemandHeatmapLoading] = useState(true);
  const [demandHeatmapError, setDemandHeatmapError] = useState(null);

  const refresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
    setFinalAiRefreshToken((value) => value + 1);
  }, []);

  const refreshFinalAiData = useCallback(() => {
    setFinalAiRefreshToken((value) => value + 1);
  }, []);

  const askAiFinance = useCallback(async (intent) => {
    setAskLoading(true);
    setAskError(null);

    try {
      const response = await requestAiFinanceInsight(intent);
      setAskResponse(response);
      return response;
    } catch (err) {
      const message = extractAiFinanceError(err);
      setAskError(message);
      setAskResponse(null);
      return null;
    } finally {
      setAskLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadAiFinance = async () => {
      setLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        getDataSummary(),
        getSummary(),
        getRevenueTrend(start, end),
        getOccupancyTrend(start, end),
        getRoomTypeRevenue(),
      ]);

      if (ignore) return;

      setDataSummary(settleValue(results[0], null));
      setSummary(settleValue(results[1], null));
      setRevenueTrend(settleValue(results[2], []));
      setOccupancyTrend(settleValue(results[3], []));
      setRoomTypeRevenue(settleValue(results[4], []));

      const failures = results.filter((result) => result.status === 'rejected');
      if (failures.length > 0) {
        setError(
          failures
            .map((failure) => extractAiFinanceError(failure.reason))
            .filter(Boolean)
            .join(' ')
        );
      }

      setLoading(false);
    };

    loadAiFinance();

    return () => {
      ignore = true;
    };
  }, [end, refreshToken, start]);

  useEffect(() => {
    let ignore = false;

    const loadFinalAiData = async () => {
      setFinalAiLoading(true);
      setFinalAiError(null);
      setFinalAiErrors({});

      const results = await Promise.allSettled([
        getAiHealth(),
        getModelInfo(),
        getRevenueForecast(),
        getPricingRecommendations(),
        getElasticityForecasts(),
      ]);

      if (ignore) return;

      const nextAiHealth = settleValue(results[0], null);
      const nextModelInfo = settleValue(results[1], null);
      const nextRevenueForecast = settleValue(results[2], null);
      const nextPricingResponse = settleValue(results[3], null);
      const nextElasticityForecasts = settleValue(results[4], []);

      setAiHealth(nextAiHealth);
      setModelInfo(nextModelInfo);
      setRevenueForecast(nextRevenueForecast);
      setPricingRecommendationsResponse(nextPricingResponse);
      setPricingRecommendations(
        Array.isArray(nextPricingResponse?.pricingRecommendations)
          ? nextPricingResponse.pricingRecommendations
          : []
      );
      setElasticityForecasts(Array.isArray(nextElasticityForecasts) ? nextElasticityForecasts : []);

      const errorMap = {};
      const labels = ['AI health', 'model info', 'revenue forecast', 'pricing recommendations', 'elasticity'];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          errorMap[labels[index]] = extractAiFinanceError(result.reason);
        }
      });

      if (Object.keys(errorMap).length > 0) {
        setFinalAiErrors(errorMap);
        setFinalAiError(Object.values(errorMap).filter(Boolean).join(' '));
      }

      setFinalAiLoading(false);
    };

    loadFinalAiData();

    return () => {
      ignore = true;
    };
  }, [finalAiRefreshToken]);

  useEffect(() => {
    let ignore = false;

    const loadDemandHeatmap = async () => {
      setDemandHeatmapLoading(true);
      setDemandHeatmapError(null);

      try {
        const data = await getDemandHeatmap(demandMonth, demandRoomTypeId);
        if (!ignore) {
          setDemandHeatmap(data);
        }
      } catch (err) {
        if (!ignore) {
          setDemandHeatmap([]);
          setDemandHeatmapError(extractAiFinanceError(err));
        }
      } finally {
        if (!ignore) {
          setDemandHeatmapLoading(false);
        }
      }
    };

    loadDemandHeatmap();

    return () => {
      ignore = true;
    };
  }, [demandMonth, demandRoomTypeId, refreshToken]);

  const isAiFallback = Boolean(
    aiHealth?.status === 'DOWN' ||
      revenueForecast?.source === 'SAFE_DEMO_FALLBACK' ||
      pricingRecommendationsResponse?.source === 'SAFE_DEMO_FALLBACK' ||
      revenueForecast?.warning ||
      pricingRecommendationsResponse?.warning
  );

  return {
    loading,
    error,
    finalAiLoading,
    finalAiError,
    finalAiErrors,
    dataSummary,
    summary,
    revenueTrend,
    occupancyTrend,
    roomTypeRevenue,
    aiHealth,
    modelInfo,
    revenueForecast,
    pricingRecommendations,
    pricingRecommendationsResponse,
    elasticityForecasts,
    demandHeatmap,
    demandHeatmapLoading,
    demandHeatmapError,
    askResponse,
    askLoading,
    askError,
    isAiFallback,
    refresh,
    refreshFinalAiData,
    askAiFinance,
  };
};
