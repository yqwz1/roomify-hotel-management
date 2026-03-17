import { useState } from 'react';
import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f2ede5] font-sans text-zinc-950">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(146,64,14,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(180,83,9,0.08),transparent_24%),linear-gradient(180deg,#f7f3ed_0%,#f1ece4_100%)]" />
        <AppTopbar onMenuToggle={() => setSidebarOpen((current) => !current)} />

        <main className="relative min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
