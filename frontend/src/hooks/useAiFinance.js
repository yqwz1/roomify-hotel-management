import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_AI_FINANCE_END_DATE,
  DEFAULT_AI_FINANCE_START_DATE,
  extractAiFinanceError,
  getDataSummary,
  getOccupancyTrend,
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
};

const settleValue = (result, fallback) =>
  result.status === 'fulfilled' ? result.value : fallback;

export const useAiFinance = ({
  start = DEFAULT_AI_FINANCE_START_DATE,
  end = DEFAULT_AI_FINANCE_END_DATE,
} = {}) => {
  const [dataSummary, setDataSummary] = useState(emptyState.dataSummary);
  const [summary, setSummary] = useState(emptyState.summary);
  const [revenueTrend, setRevenueTrend] = useState(emptyState.revenueTrend);
  const [occupancyTrend, setOccupancyTrend] = useState(emptyState.occupancyTrend);
  const [roomTypeRevenue, setRoomTypeRevenue] = useState(emptyState.roomTypeRevenue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
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

  return {
    loading,
    error,
    dataSummary,
    summary,
    revenueTrend,
    occupancyTrend,
    roomTypeRevenue,
    refresh,
  };
};
