import api from './api';
import { extractApiErrorMessage } from '../utils/apiError';

export const extractAiAssistantError = (err) =>
  extractApiErrorMessage(err, 'Failed to get an answer from the AI assistant.');

const isSeededAssistantGreeting = (message) => {
  const content = String(message?.content || '').toLowerCase();
  return message?.role === 'assistant'
    && content.includes('roomie')
    && content.includes('hotel management assistant');
};

export const normalizeAiAssistantHistory = (history = []) =>
  history
    .filter((message) => message && !isSeededAssistantGreeting(message))
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').trim(),
    }))
    .filter((message) =>
      (message.role === 'user' || message.role === 'assistant') && message.content
    );

export const chatWithAiAssistant = async ({ message, history = [] }) => {
  const response = await api.post(
    '/ai-assistant/chat',
    { message, history: normalizeAiAssistantHistory(history) },
    { timeout: 120000 }
  );
  return response.data;
};
