import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ManagerAiAssistant from '../ai-assistant/ManagerAiAssistant';
import FloatingGuestAssistant from '../guest-assistant/FloatingGuestAssistant';
import { useAuth } from '../../context/AuthProvider';
import { getPrimaryRole, ROLE_MANAGER } from '../navigation/navConfig';
import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';

export default function AppShell({ children }) {
  const location = useLocation();
  const { user } = useAuth();
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
  const primaryRole = getPrimaryRole(user?.roles ?? []);
  const showManagerAiAssistant = primaryRole === ROLE_MANAGER;

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
    <div className="flex min-h-screen overflow-x-hidden bg-brand-surface font-sans text-brand-ink lg:h-screen lg:overflow-hidden">
      <AppSidebar
        isOpen={sidebarOpen}
        isDesktop={isDesktop}
        onClose={handleSidebarClose}
      />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-visible lg:overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.82),transparent_26%),radial-gradient(circle_at_top_right,rgba(26,43,58,0.04),transparent_24%),linear-gradient(180deg,#F5F2EA_0%,#EFE9DF_100%)]" />
        <AppTopbar
          isSidebarOpen={sidebarOpen}
          onMenuToggle={handleSidebarToggle}
        />

        <main className="relative flex-1 overflow-visible lg:min-h-0 lg:overflow-y-auto">
          {children}
        </main>
        <FloatingGuestAssistant />
        {showManagerAiAssistant ? <ManagerAiAssistant /> : null}
      </div>
    </div>
  );
}
