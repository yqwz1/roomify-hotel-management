import { localizeKnownServerMessage } from './localization';

export const extractApiErrorMessage = (
  err,
  fallbackMessage = 'Something went wrong. Please try again.'
) => {
  const data = err?.response?.data;
  if (!data) return localizeKnownServerMessage(err?.message ?? fallbackMessage);

  if (data.validationErrors && typeof data.validationErrors === 'object') {
    const messages = Object.values(data.validationErrors).filter(Boolean);
    if (messages.length) {
      return localizeKnownServerMessage(messages.join(' · '));
    }
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return localizeKnownServerMessage(data.message);
  }

  if (typeof data.error === 'string' && data.error.trim()) {
    return localizeKnownServerMessage(data.error);
  }

  return localizeKnownServerMessage(err?.message ?? fallbackMessage);
};
