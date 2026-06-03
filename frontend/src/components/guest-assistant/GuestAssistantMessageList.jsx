import { motion } from 'framer-motion';
import { Bot, UserRound } from 'lucide-react';
import { formatLocalizedDateTime } from '../../utils/localization';
import { getMessageStatusLabel, selectMessageBody } from '../../utils/guestAssistant';

const BUBBLE_CLASS_BY_ROLE = {
  GUEST: 'ml-auto bg-brand-primary text-white',
  STAFF: 'mr-auto border border-brand-surface-border bg-white text-brand-ink shadow-sm',
  AI: 'mr-auto border border-brand-primary/15 bg-brand-primary/10 text-brand-ink',
};

export default function GuestAssistantMessageList({
  messages = [],
  guestView = false,
  translationMode = 'original',
  typingLabel = '',
  language,
}) {
  return (
    <div className="space-y-3">
      {messages.map((message) => {
        const body = selectMessageBody(message, { guestView, translationMode });
        const isGuest = message.senderRole === 'GUEST';
        const bubbleClass = BUBBLE_CLASS_BY_ROLE[message.senderRole] ?? BUBBLE_CLASS_BY_ROLE.STAFF;

        return (
          <motion.div
            key={message.id}
            className={`flex min-w-0 ${isGuest ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, x: isGuest ? 18 : -18, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={`min-w-0 max-w-[86%] rounded-[1.4rem] px-4 py-3 ${bubbleClass}`}>
              <div className="mb-2 flex min-w-0 items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] opacity-70">
                {message.senderRole === 'AI' ? <Bot className="h-3.5 w-3.5 shrink-0" /> : <UserRound className="h-3.5 w-3.5 shrink-0" />}
                <span className="min-w-0 truncate">{message.senderDisplayName}</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-6">{body}</p>
              <div className="mt-3 flex min-w-0 items-center justify-between gap-3 text-[11px] font-bold opacity-70">
                <span className="min-w-0 truncate">{formatLocalizedDateTime(message.createdAt, language, { timeStyle: 'short' })}</span>
                {isGuest ? <span className="shrink-0 truncate">{getMessageStatusLabel(message)}</span> : null}
              </div>
            </div>
          </motion.div>
        );
      })}

      {typingLabel ? (
        <div className="flex min-w-0 justify-start">
          <div className="flex min-w-0 items-center gap-2 rounded-full border border-brand-surface-border bg-white px-4 py-2 text-xs font-bold text-brand-ink-muted shadow-sm">
            <span>{typingLabel}</span>
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="motion-typing-dot h-1.5 w-1.5 rounded-full bg-brand-primary [animation-delay:-0.2s]" />
              <span className="motion-typing-dot h-1.5 w-1.5 rounded-full bg-brand-primary [animation-delay:-0.1s]" />
              <span className="motion-typing-dot h-1.5 w-1.5 rounded-full bg-brand-primary" />
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
