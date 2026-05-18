export const THEME_MODE_STORAGE_KEY = 'theme-mode';
export const THEME_MODE_OLD = 'old';
export const THEME_MODE_NEW = 'new';
export const THEME_MODE_CHANGE_EVENT = 'roomify-theme-mode-change';

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const normalizeThemeMode = (value) =>
  value === THEME_MODE_NEW ? THEME_MODE_NEW : THEME_MODE_OLD;

export const getStoredThemeMode = () => {
  if (!isBrowser()) {
    return THEME_MODE_OLD;
  }

  return normalizeThemeMode(window.localStorage.getItem(THEME_MODE_STORAGE_KEY));
};

export const applyThemeMode = (themeMode) => {
  if (!isBrowser()) {
    return THEME_MODE_OLD;
  }

  const normalized = normalizeThemeMode(themeMode);
  document.documentElement.setAttribute('data-theme', normalized);
  window.localStorage.setItem(THEME_MODE_STORAGE_KEY, normalized);
  return normalized;
};

export const initializeThemeMode = () => {
  if (!isBrowser()) {
    return THEME_MODE_OLD;
  }

  document.documentElement.setAttribute('data-theme', THEME_MODE_OLD);
  const saved = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);

  if (saved) {
    return applyThemeMode(saved);
  }

  return THEME_MODE_OLD;
};

export const toggleThemeMode = () => {
  const nextThemeMode =
    getStoredThemeMode() === THEME_MODE_NEW ? THEME_MODE_OLD : THEME_MODE_NEW;
  const normalized = applyThemeMode(nextThemeMode);

  if (isBrowser()) {
    window.dispatchEvent(
      new CustomEvent(THEME_MODE_CHANGE_EVENT, {
        detail: normalized,
      })
    );
  }

  return normalized;
};
