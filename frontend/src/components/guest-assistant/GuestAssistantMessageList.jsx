import { Bot, UserRound } from 'lucide-react';
import { formatLocalizedDateTime } from '../../utils/localization';
import { getMessageStatusLabel, selectMessageBody } from '../../utils/guestAssistant';

const BUBBLE_CLASS_BY_ROLE = {
  GUEST: 'ms-auto bg-brand-primary text-white',
  STAFF: 'me-auto border border-brand-surface-border bg-white text-brand-ink shadow-sm',
  AI: 'me-auto border border-brand-primary/15 bg-brand-primary/10 text-brand-ink',
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
      {messages.map((message, index) => {
        const body = selectMessageBody(message, { guestView, translationMode });
        const isGuest = message.senderRole === 'GUEST';
        const bubbleClass = BUBBLE_CLASS_BY_ROLE[message.senderRole] ?? BUBBLE_CLASS_BY_ROLE.STAFF;

        return (
          <div
            key={message.id}
            className={`motion-message-in flex min-w-0 ${isGuest ? 'motion-message-in-from-end justify-end' : 'motion-message-in-from-start justify-start'}`}
            style={{ '--motion-index': index }}
          >
            <div className={`min-w-0 max-w-[86%] rounded-[1.4rem] px-4 py-3 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.48)] ${bubbleClass}`}>
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
          </div>
        );
      })}

      {typingLabel ? (
        <div className="motion-message-in motion-message-in-from-start flex min-w-0 justify-start">
          <div className="inline-flex min-w-0 items-center gap-2 rounded-full border border-brand-surface-border bg-white px-4 py-2 text-xs font-bold text-brand-ink-muted shadow-sm" aria-label={typingLabel}>
            <span className="sr-only">{typingLabel}</span>
            <span className="motion-typing-dot h-1.5 w-1.5 rounded-full bg-brand-primary/55" aria-hidden="true" />
            <span className="motion-typing-dot h-1.5 w-1.5 rounded-full bg-brand-primary/55" aria-hidden="true" />
            <span className="motion-typing-dot h-1.5 w-1.5 rounded-full bg-brand-primary/55" aria-hidden="true" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
