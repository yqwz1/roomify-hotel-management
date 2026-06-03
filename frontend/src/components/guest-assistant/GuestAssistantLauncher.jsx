import { AnimatePresence, motion } from 'framer-motion';
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
      className="motion-assistant-glow fixed bottom-[calc(var(--roomify-mobile-nav-height)+env(safe-area-inset-bottom,0px)+1rem)] right-4 z-[70] inline-flex h-16 w-16 min-w-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1A2B3A_0%,#285477_100%)] text-white shadow-[0_24px_60px_-22px_rgba(15,23,42,0.58)] transition hover:-translate-y-1 hover:shadow-[0_30px_76px_-24px_rgba(15,23,42,0.64)] sm:bottom-6 sm:right-6"
      aria-label={open ? 'Close guest assistant' : 'Open guest assistant'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={open ? 'close' : 'chat'}
          initial={{ opacity: 0, rotate: -12, scale: 0.82 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 12, scale: 0.82 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="inline-flex h-7 w-7 items-center justify-center"
        >
          {open ? <X className="h-7 w-7 shrink-0" /> : <MessageCircleMore className="h-7 w-7 shrink-0" />}
        </motion.span>
      </AnimatePresence>
      <span
        className={`motion-status-change absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
          staffOnline ? 'bg-emerald-400' : 'bg-amber-400'
        }`}
        aria-hidden="true"
      />
    </Button>
  );
}
