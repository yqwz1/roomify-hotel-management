import { useState } from 'react';
import { Bot, MessageSquare, SendHorizonal, Sparkles, X } from 'lucide-react';
import { chatWithAiAssistant, extractAiAssistantError } from '../../services/aiAssistantService';
import MarkdownMessage from './MarkdownMessage';

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_PROMPTS = [
  'Analyze weekly revenue',
  'Show occupancy insights',
  'Explain cancellations',
  'Recommend pricing actions',
];

const buildInitialMessages = () => [
  {
    role: 'assistant',
    content:
      'Hello! I am Roomie, your hotel management assistant. I can help you analyze revenue, occupancy, cancellations, demand spikes, pricing recommendations, reservations, rooms, guests, and hotel performance.',
    source: 'ROOMIE',
  },
];

function TypingDots() {
  return (
    <div className="flex min-w-0 items-center gap-1 text-brand-ink-muted">
      <span className="h-2 w-2 animate-bounce rounded-full bg-brand-primary [animation-delay:-0.25s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-brand-primary [animation-delay:-0.12s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-brand-primary" />
    </div>
  );
}

const displaySource = (source) => (source === 'GEMINI_API' ? 'Gemini' : source);

export default function ManagerAiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(buildInitialMessages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState(DEFAULT_PROMPTS);

  const visibleMessages = messages.slice(-12);

  const sendMessage = async (prompt) => {
    const message = String(prompt || input).trim();
    if (!message || loading) return;

    const nextMessages = [...messages, { role: 'user', content: message }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await chatWithAiAssistant({
        message,
        history: nextMessages,
      });
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: response?.answer || 'No answer was returned.',
          source: response?.source,
          dataSources: response?.dataSources,
          fallbackUsed: response?.fallbackUsed,
        },
      ]);
      if (Array.isArray(response?.suggestedPrompts) && response.suggestedPrompts.length > 0) {
        setSuggestedPrompts(response.suggestedPrompts);
      }
    } catch (err) {
      setError(extractAiAssistantError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open ? (
        <div className="fixed bottom-[calc(var(--roomify-mobile-nav-height)+env(safe-area-inset-bottom,0px)+5rem)] end-4 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-[1.75rem] border border-brand-surface-border bg-white shadow-[0_24px_80px_-28px_rgba(15,23,42,0.45)] sm:bottom-24 sm:end-6">
          <div className="flex min-w-0 items-center justify-between rounded-t-[1.75rem] bg-[linear-gradient(135deg,#1A2B3A_0%,#285477_100%)] px-5 py-4 text-white">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-white/60 break-words">
                Roomie
              </p>
              <h3 className="mt-1 text-lg font-black tracking-tight break-words">Operations Copilot</h3>
            </div>
            <Button variant="unstyled" size="none"
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/15 bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Close AI assistant"
            >
              <X className="h-4 w-4 shrink-0" />
            </Button>
          </div>

          <div className="max-h-[28rem] space-y-4 overflow-y-auto px-4 py-4">
            {visibleMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-[1.35rem] px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-brand-primary text-white'
                      : 'border border-brand-surface-border bg-brand-surface-light text-brand-ink'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <MarkdownMessage content={message.content} />
                  ) : (
                    <p className="text-sm leading-6 break-words">{message.content}</p>
                  )}
                  {message.role === 'assistant' && message.source ? (
                    <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brand-ink-muted break-words">
                      Explanation by: {displaySource(message.source)}
                      {message.fallbackUsed ? ' fallback' : ''}
                      {Array.isArray(message.dataSources) && message.dataSources.length > 0 ? (
                        <span className="block normal-case tracking-normal">
                          Data source: {message.dataSources.filter((source) => source !== 'GEMINI_EXPLANATION').join(', ') || 'Gemini'}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex min-w-0 justify-start">
                <div className="flex min-w-0 items-center gap-3 rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                  <TypingDots />
                  <span className="text-sm font-medium text-brand-ink-muted">
                    Roomie is thinking...
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-brand-surface-border px-4 py-4">
            <div className="mb-3 flex min-w-0 flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <Button variant="unstyled" size="none"
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                  className="rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1.5 text-xs font-bold text-brand-primary transition hover:bg-brand-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {prompt}
                </Button>
              ))}
            </div>

            {error ? (
              <div className="mb-3 rounded-2xl border border-brand-accent-terracotta/25 bg-brand-accent-terracotta/10 px-3 py-2 text-xs font-medium text-brand-accent-terracotta">
                {error}
              </div>
            ) : null}

            <div className="flex min-w-0 items-end gap-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={3}
                placeholder="Ask about demand, pricing, revenue, or cancellations..."
                className="min-h-[4.5rem] min-w-0 flex-1 rounded-[1.25rem] border-brand-surface-border bg-white px-4 py-3 text-sm text-brand-ink shadow-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
              <Button variant="unstyled" size="none"
                type="button"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="inline-flex min-w-0 h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-sm transition hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Send prompt"
              >
                <SendHorizonal className="h-4 w-4 shrink-0" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Button variant="unstyled" size="none"
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-[calc(var(--roomify-mobile-nav-height)+env(safe-area-inset-bottom,0px)+1rem)] end-4 z-50 inline-flex min-w-0 items-center gap-3 rounded-full bg-[linear-gradient(135deg,#1A2B3A_0%,#285477_100%)] px-4 py-3 text-white shadow-[0_22px_50px_-22px_rgba(15,23,42,0.55)] transition hover:translate-y-[-1px] hover:shadow-[0_28px_60px_-24px_rgba(15,23,42,0.55)] sm:bottom-6 sm:end-6"
      >
        <span className="inline-flex min-w-0 h-10 w-10 items-center justify-center rounded-full bg-white/10">
          {open ? <X className="h-5 w-5 shrink-0" /> : <Bot className="h-5 w-5 shrink-0" />}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block text-[0.65rem] font-black uppercase tracking-[0.22em] text-white/60 break-words">
            Manager Only
          </span>
          <span className="mt-1 flex min-w-0 items-center gap-2 text-sm font-black tracking-tight break-words">
            <MessageSquare className="h-4 w-4 shrink-0" />
            Ask Roomie
            <Sparkles className="h-3.5 w-3.5 text-brand-accent-gold shrink-0" />
          </span>
        </span>
      </Button>
    </>
  );
}
