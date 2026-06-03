import { QUICK_ACTION_OPTIONS } from '../../utils/guestAssistant';

import { Button } from "@/components/ui/button";
export default function GuestAssistantQuickActions({ disabled = false, onAction }) {
  if (!QUICK_ACTION_OPTIONS.length) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-wrap justify-end gap-2">
      {QUICK_ACTION_OPTIONS.map((action) => (
        <Button variant="unstyled" size="none"
          key={action.id}
          type="button"
          disabled={disabled}
          onClick={() => onAction?.(action.id)}
          className="rounded-full border border-brand-primary/15 bg-brand-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-brand-primary transition hover:bg-brand-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
