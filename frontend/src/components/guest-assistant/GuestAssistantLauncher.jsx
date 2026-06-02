import { MessageCircleMore, X } from 'lucide-react';

import { Button } from "@/components/ui/button";
export default function GuestAssistantLauncher({
  open,
  staffOnline,
  onClick,
}) {
  return (
    <Button variant="unstyled" size="none"
      type="button"
      onClick={onClick}
      className={`motion-assistant-launcher motion-assistant-launcher-idle motion-assistant-launcher-press motion-roomie-launcher motion-button-press fixed bottom-[calc(var(--roomify-mobile-nav-height)+env(safe-area-inset-bottom,0px)+1rem)] end-4 z-[70] inline-flex h-16 w-16 min-w-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1A2B3A_0%,#285477_100%)] text-white shadow-[0_24px_60px_-22px_rgba(15,23,42,0.64),0_0_34px_-18px_rgba(40,84,119,0.95)] transition hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_32px_82px_-26px_rgba(15,23,42,0.72),0_0_48px_-18px_rgba(40,84,119,1)] sm:bottom-6 sm:end-6 ${open ? 'rotate-3 scale-[0.96]' : 'motion-panel-pop'}`}
      aria-label={open ? 'Close guest assistant' : 'Open guest assistant'}
    >
      <span className="motion-assistant-icon relative h-7 w-7">
        <MessageCircleMore
          className={`absolute inset-0 h-7 w-7 shrink-0 transition duration-300 [transition-timing-function:var(--ease-spring-soft)] ${open ? 'translate-y-1 scale-75 rotate-12 opacity-0' : 'translate-y-0 scale-100 rotate-0 opacity-100'}`}
        />
        <X
          className={`absolute inset-0 h-7 w-7 shrink-0 transition duration-300 [transition-timing-function:var(--ease-spring-soft)] ${open ? 'translate-y-0 scale-100 rotate-0 opacity-100' : '-translate-y-1 scale-75 -rotate-12 opacity-0'}`}
        />
      </span>
      <span
        className={`motion-assistant-status-dot absolute bottom-1 end-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-[0_0_0_5px_rgba(255,255,255,0.16)] ${
          staffOnline ? 'bg-emerald-400' : 'bg-amber-400'
        }`}
        aria-hidden="true"
      />
    </Button>
  );
}
