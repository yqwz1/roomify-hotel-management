import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_THEME_ID,
  ROOMIFY_THEMES,
  THEME_STORAGE_KEY,
  getThemeById,
  isKnownThemeId,
} from './themeConfig';

const ThemeContext = createContext(null);

const getInitialThemeId = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_ID;
  }

  const storedThemeId = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isKnownThemeId(storedThemeId) ? storedThemeId : DEFAULT_THEME_ID;
};

const applyThemeToDocument = (themeId) => {
  if (typeof document === 'undefined') {
    return;
  }

  const theme = getThemeById(themeId);
  const darkThemes = new Set(['midnight-emerald', 'aurora-violet', 'graphite-copper']);
  document.documentElement.dataset.theme = theme.id;
  document.documentElement.style.colorScheme = darkThemes.has(theme.id) ? 'dark' : 'light';

  const themeColor = theme.preview[0] ?? '#061622';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
};

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(getInitialThemeId);

  useEffect(() => {
    applyThemeToDocument(themeId);
    window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
  }, [themeId]);

  const value = useMemo(() => {
    const selectedTheme = getThemeById(themeId);

    return {
      themeId,
      selectedTheme,
      themes: ROOMIFY_THEMES,
      setThemeId: (nextThemeId) => {
        if (isKnownThemeId(nextThemeId)) {
          setThemeId(nextThemeId);
        }
      },
    };
  }, [themeId]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export { DEFAULT_THEME_ID, THEME_STORAGE_KEY };
