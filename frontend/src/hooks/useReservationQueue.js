import { useEffect, useMemo, useState } from 'react';
import {
  extractReservationError,
  searchReservations,
} from '../services/reservationService';
import {
  createReservationQueueMetrics,
  formatDateInputValue,
  toQueueReservation,
} from '../utils/reservationWorkspace';

export const useReservationQueue = (filters) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const today = useMemo(() => formatDateInputValue(new Date()), []);

  useEffect(() => {
    let ignore = false;

    const loadQueue = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await searchReservations(filters);
        if (ignore) return;
        setReservations(Array.isArray(response) ? response.map(toQueueReservation) : []);
      } catch (err) {
        if (ignore) return;
        setReservations([]);
        setError(extractReservationError(err));
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadQueue();

    return () => {
      ignore = true;
    };
  }, [filters, reloadNonce]);

  const metrics = useMemo(
    () => createReservationQueueMetrics(reservations, today),
    [reservations, today]
  );

  return {
    reservations,
    loading,
    error,
    metrics,
    today,
    reload: () => setReloadNonce((current) => current + 1),
  };
};
