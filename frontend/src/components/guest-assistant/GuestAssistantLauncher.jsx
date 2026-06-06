import { MessageCircleMore } from 'lucide-react';

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
      className="fixed bottom-[calc(var(--roomify-mobile-nav-height)+env(safe-area-inset-bottom,0px)+1rem)] end-4 z-[70] inline-flex h-16 w-16 min-w-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1A2B3A_0%,#285477_100%)] text-white shadow-[0_24px_60px_-22px_rgba(15,23,42,0.58)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-24px_rgba(15,23,42,0.62)] sm:bottom-6 sm:end-6"
      aria-label={open ? 'Close guest assistant' : 'Open guest assistant'}
    >
      <MessageCircleMore className="h-7 w-7 shrink-0" />
      <span
        className={`absolute bottom-1 end-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
          staffOnline ? 'bg-emerald-400' : 'bg-amber-400'
        }`}
        aria-hidden="true"
      />
    </Button>
  );
}
