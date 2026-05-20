import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const extractAiAssistantError = (err) =>
  extractApiErrorMessage(err, 'Failed to get an answer from the AI assistant.');

export const chatWithAiAssistant = async ({ message, history = [] }) => {
  const response = await api.post(
    '/ai-assistant/chat',
    { message, history },
    { timeout: 20000 }
  );
  return response.data;
};
