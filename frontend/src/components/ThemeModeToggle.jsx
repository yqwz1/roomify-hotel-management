import { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getStoredThemeMode,
  THEME_MODE_CHANGE_EVENT,
  THEME_MODE_NEW,
  toggleThemeMode,
} from '../utils/themeMode';
import { translateWithFallback } from '../utils/localization';
import { useTranslation } from 'react-i18next';

export default function ThemeModeToggle({ className = '', variant = 'outline' }) {
  const { t } = useTranslation();
  const [themeMode, setThemeMode] = useState(getStoredThemeMode);

  useEffect(() => {
    const handleThemeModeChange = (event) => {
      setThemeMode(event?.detail === THEME_MODE_NEW ? THEME_MODE_NEW : getStoredThemeMode());
    };

    window.addEventListener(THEME_MODE_CHANGE_EVENT, handleThemeModeChange);
    return () => window.removeEventListener(THEME_MODE_CHANGE_EVENT, handleThemeModeChange);
  }, []);

  const handleToggle = () => {
    setThemeMode(toggleThemeMode());
  };

  const isNewTheme = themeMode === THEME_MODE_NEW;
  const label = isNewTheme
    ? translateWithFallback(t, 'themeMode.old', 'Old Theme')
    : translateWithFallback(t, 'themeMode.new', 'New Theme');

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleToggle}
      className={className}
      aria-label={label}
      title={label}
    >
      <Palette className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
