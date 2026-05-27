export function registerServiceWorker() {
  if (import.meta.env.DEV || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Keep registration failure silent so the web app still works normally.
    });
  });
}
