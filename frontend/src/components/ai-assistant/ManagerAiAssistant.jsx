import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from 'framer-motion';
import { Bot, SendHorizonal, X } from 'lucide-react';
import { chatWithAiAssistant, extractAiAssistantError } from '../../services/aiAssistantService';
import MarkdownMessage from './MarkdownMessage';
import useAssistantPlacement from '../guest-assistant/useAssistantPlacement';

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_PROMPTS = [
  'Analyze weekly revenue',
  'Show occupancy insights',
  'Explain cancellations',
  'Recommend pricing actions',
];

const MANAGER_AI_PANEL_EXIT_MS = 280;

const buildInitialMessages = () => [
  {
    role: 'assistant',
    content:
      'Hello! I am Roomi, your hotel management assistant. I can help you analyze revenue, occupancy, cancellations, demand spikes, pricing recommendations, reservations, rooms, guests, and hotel performance.',
    source: 'ROOMI',
  },
];

function TypingDots() {
  return (
    <div className="motion-typing-bubble inline-flex min-w-0 items-center gap-2 rounded-full border border-brand-surface-border bg-white px-4 py-2 text-brand-ink-muted shadow-sm" aria-label="Roomi is thinking">
      <span className="sr-only">Roomi is thinking</span>
      <span className="motion-typing-dot h-1.5 w-1.5 rounded-full bg-brand-primary/55" aria-hidden="true" />
      <span className="motion-typing-dot h-1.5 w-1.5 rounded-full bg-brand-primary/55" aria-hidden="true" />
      <span className="motion-typing-dot h-1.5 w-1.5 rounded-full bg-brand-primary/55" aria-hidden="true" />
    </div>
  );
}

const displaySource = (source) => (source === 'GEMINI_API' ? 'Gemini' : source);

export default function ManagerAiAssistant() {
  const reduceMotion = useReducedMotion();
  const placement = useAssistantPlacement();
  const [open, setOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(buildInitialMessages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState(DEFAULT_PROMPTS);
  const panelCloseTimeoutRef = useRef(null);
  const panelOpenFrameRef = useRef(null);

  const visibleMessages = messages.slice(-12);

  useEffect(() => () => {
    if (panelCloseTimeoutRef.current) {
      clearTimeout(panelCloseTimeoutRef.current);
    }
    if (panelOpenFrameRef.current) {
      const cancelFrame = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : clearTimeout;
      cancelFrame(panelOpenFrameRef.current);
    }
  }, []);

  useEffect(() => {
    if (panelCloseTimeoutRef.current) {
      clearTimeout(panelCloseTimeoutRef.current);
    }
    if (panelOpenFrameRef.current) {
      const cancelFrame = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : clearTimeout;
      cancelFrame(panelOpenFrameRef.current);
    }

    if (open) {
      setPanelMounted(true);
      const requestFrame = typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (callback) => setTimeout(callback, 16);
      panelOpenFrameRef.current = requestFrame(() => {
        setPanelVisible(true);
      });
      return undefined;
    }

    setPanelVisible(false);
    panelCloseTimeoutRef.current = setTimeout(() => {
      setPanelMounted(false);
    }, reduceMotion ? 0 : MANAGER_AI_PANEL_EXIT_MS);

    return undefined;
  }, [open, reduceMotion]);

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

  const assistantWidget = (
    <>
      {panelMounted ? (
        <aside
          className={`motion-assistant-panel motion-roomie-panel-shell fixed bottom-[calc(var(--roomify-mobile-nav-height)+env(safe-area-inset-bottom,0px)+5rem)] ${placement.panelClassName} z-[71] flex h-[min(38rem,calc(100dvh-var(--roomify-mobile-nav-height)-7rem))] w-[min(27rem,calc(100vw-2rem))] min-w-0 flex-col overflow-hidden rounded-[2rem] border border-white/55 bg-white/[0.92] backdrop-blur-xl sm:bottom-28 sm:h-[min(38rem,calc(100vh-8rem))] ${panelVisible ? 'motion-assistant-panel-enter motion-assistant-panel-visible pointer-events-auto' : 'motion-assistant-panel-exit pointer-events-none'}`}
          style={placement.style}
          aria-hidden={!panelVisible}
          data-assistant-side={placement.side}
        >
          <div className={`pointer-events-none absolute -bottom-10 h-28 w-28 rounded-full bg-brand-primary/20 blur-2xl ${placement.side === 'left' ? 'left-4' : 'right-4'}`} aria-hidden="true" />
          <div className="motion-assistant-header-in bg-[linear-gradient(135deg,#1A2B3A_0%,#285477_100%)] px-5 py-4 text-white">
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/60 break-words">
                  Roomi
                </p>
                <h3 className="mt-1 truncate text-xl font-black tracking-tight">Operations Copilot</h3>
                <p className="mt-2 text-sm font-medium text-white/75 break-words">
                  Manager insights, pricing, demand, and performance.
                </p>
              </div>
              <Button variant="unstyled" size="none"
                type="button"
                onClick={() => setOpen(false)}
                className="motion-press rounded-full border border-white/15 bg-white/10 p-2 text-white transition hover:bg-white/20"
                aria-label="Close AI assistant"
              >
                <X className="h-4 w-4 shrink-0" />
              </Button>
            </div>
          </div>

          <div className="motion-assistant-content-stagger min-w-0 flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,rgba(245,242,234,0.65)_0%,rgba(255,255,255,0.88)_100%)] px-4 py-4">
            {visibleMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`motion-message-in flex min-w-0 ${message.role === 'user' ? 'motion-message-user justify-end' : 'motion-message-assistant justify-start'}`}
                style={{ '--motion-index': index }}
              >
                <div
                  className={`min-w-0 max-w-[86%] rounded-[1.4rem] px-4 py-3 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.58)] transition-transform duration-300 [transition-timing-function:var(--ease-spring-soft)] hover:scale-[1.01] ${
                    message.role === 'user'
                      ? 'bg-brand-primary text-white'
                      : 'border border-brand-surface-border bg-white text-brand-ink'
                  }`}
                >
                  <div className="mb-2 flex min-w-0 items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] opacity-70">
                    {message.role === 'assistant' ? <Bot className="h-3.5 w-3.5 shrink-0" /> : <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-current/60" aria-hidden="true" />}
                    <span className="min-w-0 truncate">{message.role === 'assistant' ? 'Roomi' : 'Manager'}</span>
                  </div>
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
              <div className="motion-message-in motion-message-assistant flex min-w-0 justify-start">
                <div className="inline-flex min-w-0 items-center gap-3 rounded-full border border-brand-surface-border bg-white px-3 py-2 shadow-sm">
                  <TypingDots />
                  <span className="text-sm font-medium text-brand-ink-muted">
                    Roomi is thinking...
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="motion-assistant-input-in border-t border-brand-surface-border/70 bg-white/90 px-4 py-4">
            <div className={`assistant-prompt-strip mb-3 min-w-0 gap-2 ${placement.promptClassName}`}>
              {suggestedPrompts.map((prompt) => (
                <Button variant="unstyled" size="none"
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                  className="motion-card-lift shrink-0 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1.5 text-xs font-bold text-brand-primary transition hover:bg-brand-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                  dir="auto"
                >
                  {prompt}
                </Button>
              ))}
            </div>

            {error ? (
              <div className="motion-status-error mb-3 rounded-2xl border border-brand-accent-terracotta/25 bg-brand-accent-terracotta/10 px-3 py-2 text-xs font-medium text-brand-accent-terracotta">
                {error}
              </div>
            ) : null}

            <div className="flex min-w-0 items-end gap-3">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={3}
                placeholder="Ask about demand, pricing, revenue, or cancellations..."
                className="motion-assistant-input min-h-[4.5rem] min-w-0 flex-1 rounded-[1.3rem] border-brand-surface-border bg-white px-4 py-3 text-sm font-medium text-brand-ink shadow-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
              />
              <Button variant="unstyled" size="none"
                type="button"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="motion-assistant-send-button motion-button-press inline-flex min-w-0 h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-2xl bg-brand-primary text-white shadow-[0_14px_32px_-20px_rgba(26,43,58,0.85)] transition hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Send prompt"
              >
                <SendHorizonal className="motion-send-icon h-4 w-4 shrink-0" />
              </Button>
            </div>
          </div>
        </aside>
      ) : null}

      <Button variant="unstyled" size="none"
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`motion-assistant-launcher motion-assistant-launcher-idle motion-assistant-launcher-press motion-roomie-launcher motion-button-press fixed bottom-[calc(var(--roomify-mobile-nav-height)+env(safe-area-inset-bottom,0px)+1rem)] ${placement.launcherClassName} z-[70] inline-flex h-16 w-16 min-w-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1A2B3A_0%,#285477_100%)] text-white shadow-[0_24px_60px_-22px_rgba(15,23,42,0.64),0_0_34px_-18px_rgba(40,84,119,0.95)] transition hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_32px_82px_-26px_rgba(15,23,42,0.72),0_0_48px_-18px_rgba(40,84,119,1)] sm:bottom-6 ${open ? 'rotate-3 scale-[0.96]' : 'motion-panel-pop'}`}
        style={placement.style}
        aria-label={open ? 'Close manager AI assistant' : 'Open manager AI assistant'}
        data-testid="manager-ai-launcher"
        data-assistant-side={placement.side}
      >
        <span className="motion-assistant-icon relative h-7 w-7">
          <Bot className={`absolute inset-0 h-7 w-7 shrink-0 transition duration-300 [transition-timing-function:var(--ease-spring-soft)] ${open ? 'translate-y-1 scale-75 rotate-12 opacity-0' : 'translate-y-0 scale-100 rotate-0 opacity-100'}`} />
          <X className={`absolute inset-0 h-7 w-7 shrink-0 transition duration-300 [transition-timing-function:var(--ease-spring-soft)] ${open ? 'translate-y-0 scale-100 rotate-0 opacity-100' : '-translate-y-1 scale-75 -rotate-12 opacity-0'}`} />
        </span>
        <span className="motion-assistant-status-dot absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 shadow-[0_0_0_5px_rgba(255,255,255,0.16)]" aria-hidden="true" />
      </Button>
    </>
  );

  if (typeof document === 'undefined' || !document.body) {
    return assistantWidget;
  }

  return createPortal(assistantWidget, document.body);
}
