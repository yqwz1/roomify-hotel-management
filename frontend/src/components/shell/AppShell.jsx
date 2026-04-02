import { useState } from 'react';
import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#f2ede5] font-sans text-zinc-950 lg:h-screen lg:overflow-hidden">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-visible lg:overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.82),transparent_26%),radial-gradient(circle_at_top_right,rgba(24,24,27,0.04),transparent_24%),linear-gradient(180deg,#f7f3ed_0%,#f1ece4_100%)]" />
        <AppTopbar onMenuToggle={() => setSidebarOpen((current) => !current)} />

        <main className="relative flex-1 overflow-visible lg:min-h-0 lg:overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
