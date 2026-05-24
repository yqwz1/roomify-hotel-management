const trimTrailingSlash = (value) => value?.replace(/\/+$/, '') ?? '';

const rawApiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_URL?.trim());
const rawWebSocketBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_WS_URL?.trim());

export const API_BASE_URL = rawApiBaseUrl || '/api';

export const API_WS_BASE_URL = (() => {
  if (rawWebSocketBaseUrl) {
    return rawWebSocketBaseUrl;
  }

  if (/^https?:\/\//.test(API_BASE_URL)) {
    return new URL(API_BASE_URL).origin;
  }

  return '';
})();
