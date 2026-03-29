import { useCallback, useState } from 'react';
import api from '../services/api';
import { localizeKnownServerMessage } from '../utils/localization';

export const useRoomTypes = () => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRoomTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/room-types');
      setRoomTypes(response.data);
    } catch (err) {
      setError(localizeKnownServerMessage(err.response?.data?.message || 'Failed to fetch room types'));
    } finally {
      setLoading(false);
    }
  }, []);

  const createRoomType = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...data,
        amenities: Array.isArray(data.amenities) ? data.amenities.join(',') : data.amenities,
      };

      const response = await api.post('/room-types', payload);
      setRoomTypes((prev) => [...prev, response.data]);
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: localizeKnownServerMessage(err.response?.data?.message || 'Failed to create room type'),
        validationErrors: err.response?.data?.validationErrors,
      };
    } finally {
      setLoading(false);
    }
  };

  const updateRoomType = async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...data,
        amenities: Array.isArray(data.amenities) ? data.amenities.join(',') : data.amenities,
      };

      const response = await api.put(`/room-types/${id}`, payload);
      setRoomTypes((prev) => prev.map((roomType) => (roomType.id === id ? response.data : roomType)));
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: localizeKnownServerMessage(err.response?.data?.message || 'Failed to update room type'),
        validationErrors: err.response?.data?.validationErrors,
      };
    } finally {
      setLoading(false);
    }
  };

  const deleteRoomType = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/room-types/${id}`);
      setRoomTypes((prev) => prev.filter((roomType) => roomType.id !== id));
      return { success: true };
    } catch (err) {
      if (err.response?.status === 409) {
        return {
          success: false,
          error: localizeKnownServerMessage(
            'Cannot delete this Room Type because it is assigned to rooms.'
          ),
        };
      }

      return {
        success: false,
        error: localizeKnownServerMessage(err.response?.data?.message || 'Failed to delete room type'),
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    roomTypes,
    loading,
    error,
    fetchRoomTypes,
    createRoomType,
    updateRoomType,
    deleteRoomType,
  };
};
