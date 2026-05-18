import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';

export default function AppShell({ children }) {
  const location = useLocation();
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarState, setMobileSidebarState] = useState({
    isOpen: false,
    locationKey: '',
  });
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return true;
    }

    return window.matchMedia('(min-width: 1024px)').matches;
  });

  const mobileSidebarOpen =
    mobileSidebarState.isOpen && mobileSidebarState.locationKey === location.key;
  const sidebarOpen = isDesktop ? desktopSidebarOpen : mobileSidebarOpen;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event) => setIsDesktop(event.matches);

    setIsDesktop(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (!isDesktop && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDesktop, sidebarOpen]);

  const handleSidebarToggle = () => {
    if (isDesktop) {
      setDesktopSidebarOpen((current) => !current);
      return;
    }

    setMobileSidebarState((current) => ({
      isOpen: !(current.isOpen && current.locationKey === location.key),
      locationKey: location.key,
    }));
  };

  const handleSidebarClose = () => {
    if (isDesktop) {
      return;
    }

    setMobileSidebarState((current) => ({
      ...current,
      isOpen: false,
    }));
  };

  return (
    <div className="theme-app-shell-background flex min-h-screen overflow-x-hidden font-sans text-zinc-950 lg:h-screen lg:overflow-hidden">
      <AppSidebar
        isOpen={sidebarOpen}
        isDesktop={isDesktop}
        onClose={handleSidebarClose}
      />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-visible lg:overflow-hidden">
        <div className="theme-app-shell-overlay pointer-events-none absolute inset-0" />
        <AppTopbar
          isSidebarOpen={sidebarOpen}
          onMenuToggle={handleSidebarToggle}
        />

        <main className="relative flex-1 overflow-visible lg:min-h-0 lg:overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
