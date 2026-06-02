import { MessageCircleMore, X } from 'lucide-react';

import { Button } from "@/components/ui/button";
export default function GuestAssistantLauncher({
  open,
  unreadCount,
  staffOnline,
  onClick,
}) {
  return (
    <Button variant="unstyled" size="none"
      type="button"
      onClick={onClick}
      className={`motion-press fixed bottom-[calc(var(--roomify-mobile-nav-height)+env(safe-area-inset-bottom,0px)+1rem)] end-4 z-[70] inline-flex h-16 w-16 min-w-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1A2B3A_0%,#285477_100%)] text-white shadow-[0_24px_60px_-22px_rgba(15,23,42,0.58)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-24px_rgba(15,23,42,0.62)] sm:bottom-6 sm:end-6 ${open ? 'rotate-3 scale-[0.96]' : 'motion-panel-pop'}`}
      aria-label={open ? 'Close guest assistant' : 'Open guest assistant'}
    >
      <span className="relative h-7 w-7">
        <MessageCircleMore
          className={`absolute inset-0 h-7 w-7 shrink-0 transition duration-200 ${open ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}`}
        />
        <X
          className={`absolute inset-0 h-7 w-7 shrink-0 transition duration-200 ${open ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
        />
      </span>
      <span
        className={`absolute bottom-1 end-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-[0_0_0_5px_rgba(255,255,255,0.16)] ${
          staffOnline ? 'bg-emerald-400' : 'bg-amber-400'
        }`}
        aria-hidden="true"
      />
      {unreadCount > 0 ? (
        <span className="motion-status-error absolute -start-1 -top-1 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-brand-danger px-1.5 text-[11px] font-black text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </Button>
  );
}
