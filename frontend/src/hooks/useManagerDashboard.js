import { useCallback, useEffect, useState } from 'react';
import {
  extractDashboardError,
  getDashboardMetrics,
  getOccupancyTrend,
  getRevenueTrend,
  getRoomTypeDistribution,
} from '../services/dashboardService';

export const useManagerDashboard = ({ startDate, endDate }) => {
  const [metrics, setMetrics] = useState(null);
  const [occupancyTrend, setOccupancyTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [roomTypeDistribution, setRoomTypeDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadDashboard = async () => {
      if (!startDate || !endDate) return;

      setLoading(true);
      setError(null);

      try {
        const [nextMetrics, nextOccupancy, nextRevenue, nextDistribution] = await Promise.all([
          getDashboardMetrics({ startDate, endDate }),
          getOccupancyTrend({ startDate, endDate }),
          getRevenueTrend({ startDate, endDate }),
          getRoomTypeDistribution(),
        ]);

        if (ignore) return;

        setMetrics(nextMetrics);
        setOccupancyTrend(Array.isArray(nextOccupancy) ? nextOccupancy : []);
        setRevenueTrend(Array.isArray(nextRevenue) ? nextRevenue : []);
        setRoomTypeDistribution(Array.isArray(nextDistribution) ? nextDistribution : []);
      } catch (err) {
        if (ignore) return;
        setError(extractDashboardError(err));
        setMetrics(null);
        setOccupancyTrend([]);
        setRevenueTrend([]);
        setRoomTypeDistribution([]);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [endDate, reloadToken, startDate]);

  return {
    metrics,
    occupancyTrend,
    revenueTrend,
    roomTypeDistribution,
    loading,
    error,
    reload,
  };
};
