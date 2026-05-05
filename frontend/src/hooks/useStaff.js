import { useCallback, useState } from 'react';
import * as staffService from '../services/staffService';
import { extractApiErrorMessage } from '../utils/apiError';

export const useStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStaff = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await staffService.getStaff(filters);
      setStaff(data);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Failed to fetch staff'));
    } finally {
      setLoading(false);
    }
  }, []);

  const createStaff = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const newStaff = await staffService.createStaff(data);
      setStaff((prev) => [...prev, newStaff]);
      return { success: true, data: newStaff };
    } catch (err) {
      return {
        success: false,
        error: extractApiErrorMessage(err, 'Failed to create staff'),
        validationErrors: err.response?.data?.validationErrors,
      };
    } finally {
      setLoading(false);
    }
  };

  const updateStaff = async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const updatedStaff = await staffService.updateStaff(id, data);
      setStaff((prev) => prev.map((staffMember) => (staffMember.id === id ? updatedStaff : staffMember)));
      return { success: true, data: updatedStaff };
    } catch (err) {
      return {
        success: false,
        error: extractApiErrorMessage(err, 'Failed to update staff'),
        validationErrors: err.response?.data?.validationErrors,
      };
    } finally {
      setLoading(false);
    }
  };

  const activateStaff = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const updatedStaff = await staffService.activateStaff(id);
      setStaff((prev) => prev.map((staffMember) => (staffMember.id === id ? updatedStaff : staffMember)));
      return { success: true, data: updatedStaff };
    } catch (err) {
      return {
        success: false,
        error: extractApiErrorMessage(err, 'Failed to activate staff'),
      };
    } finally {
      setLoading(false);
    }
  };

  const deactivateStaff = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const updatedStaff = await staffService.deactivateStaff(id);
      setStaff((prev) => prev.map((staffMember) => (staffMember.id === id ? updatedStaff : staffMember)));
      return { success: true, data: updatedStaff };
    } catch (err) {
      if (err.response?.status === 409) {
        return {
          success: false,
          error: extractApiErrorMessage(err, 'You cannot deactivate your own account'),
        };
      }

      return {
        success: false,
        error: extractApiErrorMessage(err, 'Failed to deactivate staff'),
      };
    } finally {
      setLoading(false);
    }
  };

  const unlockStaff = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const updatedStaff = await staffService.unlockStaff(id);
      setStaff((prev) => prev.map((staffMember) => (staffMember.id === id ? updatedStaff : staffMember)));
      return { success: true, data: updatedStaff };
    } catch (err) {
      return {
        success: false,
        error: extractApiErrorMessage(err, 'Failed to unlock staff account'),
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    staff,
    loading,
    error,
    fetchStaff,
    createStaff,
    updateStaff,
    activateStaff,
    deactivateStaff,
    unlockStaff,
  };
};
