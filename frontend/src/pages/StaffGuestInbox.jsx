import { BellRing, Bot, CheckCheck, Loader2, SendHorizonal, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmationToast from '../components/ConfirmationToast';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import GuestAssistantMessageList from '../components/guest-assistant/GuestAssistantMessageList';
import { useAuth } from '../context/AuthProvider';
import useGuestAssistantSocket from '../hooks/useGuestAssistantSocket';
import {
  extractGuestAssistantError,
  getStaffGuestConversation,
  listStaffGuestConversations,
  markStaffGuestConversationRead,
  resolveStaffGuestConversation,
  sendStaffGuestReply,
} from '../services/guestAssistantService';
import {
  mergeConversationList,
  mergeMessagesById,
} from '../utils/guestAssistant';
import { getReservationStatusLabel, translateWithFallback } from '../utils/localization';

const FILTERS = ['ALL', 'ACTIVE', 'PENDING', 'RESOLVED'];

const buildConversationContextLabel = (conversation) => {
  const roomLabel = conversation?.roomNumber
    ? `Room ${conversation.roomNumber}`
    : 'No room assigned';

  if (conversation?.subject) {
    return `${conversation.subject} - ${roomLabel}`;
  }

  return roomLabel;
};

const playStaffSound = () => {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return;
  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 880;
  gain.gain.value = 0.05;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.12);
};

export default function StaffGuestInbox() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState('ACTIVE');
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [detail, setDetail] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const [translationMode, setTranslationMode] = useState('en');
  const [guestTyping, setGuestTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toast, setToast] = useState(null);
  const typingTimeoutRef = useRef(null);
  const selectedConversationIdRef = useRef('');

  const loadConversations = useCallback(async (nextFilter = filter) => {
    setLoadingList(true);
    try {
      const params = nextFilter === 'ALL' ? {} : { status: nextFilter };
      const items = await listStaffGuestConversations(params);
      setConversations(items);
      if (!selectedConversationIdRef.current && items[0]?.publicId) {
        setSelectedConversationId(items[0].publicId);
      }
    } catch (error) {
      setToast({ message: extractGuestAssistantError(error), type: 'error' });
    } finally {
      setLoadingList(false);
    }
  }, [filter]);

  const loadDetail = useCallback(async (publicId, { silent = false } = {}) => {
    if (!publicId) return null;
    if (!silent) setLoadingDetail(true);
    try {
      const response = await getStaffGuestConversation(publicId);
      setDetail(response);
      setConversations((current) => mergeConversationList(current, response.conversation));
      return response;
    } catch (error) {
      setToast({ message: extractGuestAssistantError(error), type: 'error' });
      return null;
    } finally {
      if (!silent) setLoadingDetail(false);
    }
  }, []);

  const handleSocketEvent = useCallback((event) => {
    if (event?.conversation) {
      setConversations((current) => mergeConversationList(current, event.conversation));
    }

    if (event?.eventType === 'TYPING' && event.typingConversationPublicId === selectedConversationIdRef.current) {
      setGuestTyping(Boolean(event.typing && event.typingSenderRole === 'GUEST'));
      return;
    }

    if (!event?.conversation) {
      return;
    }

    if (event.eventType === 'MESSAGE_CREATED' && event.message?.senderRole === 'GUEST' && soundEnabled) {
      playStaffSound();
    }

    if (event.conversation.publicId !== selectedConversationIdRef.current) {
      return;
    }

    setDetail((current) => {
      if (!current) return current;
      const nextMessages = event.message
        ? mergeMessagesById(current.messages, event.message)
        : current.messages;
      return {
        conversation: event.conversation,
        messages: nextMessages,
      };
    });

    if (event.eventType === 'READ_UPDATED' || event.eventType === 'CONVERSATION_RESOLVED') {
      void loadDetail(event.conversation.publicId, { silent: true });
    }
  }, [loadDetail, soundEnabled]);

  const { connected, publishTyping } = useGuestAssistantSocket({
    enabled: Array.isArray(user?.roles) && (user.roles.includes('ROLE_STAFF') || user.roles.includes('ROLE_MANAGER')),
    onEvent: handleSocketEvent,
    onError: (error) => {
      setToast({ message: error?.message || 'Staff inbox connection failed.', type: 'error' });
    },
  });

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    void loadConversations(filter);
  }, [filter, loadConversations]);

  useEffect(() => {
    if (!selectedConversationId) return;
    void loadDetail(selectedConversationId);
  }, [loadDetail, selectedConversationId]);

  useEffect(() => {
    if (!detail?.conversation?.publicId || detail.conversation.unreadStaffCount <= 0) return;

    const markRead = async () => {
      try {
        const response = await markStaffGuestConversationRead(detail.conversation.publicId);
        setDetail(response);
        setConversations((current) => mergeConversationList(current, response.conversation));
      } catch (error) {
        setToast({ message: extractGuestAssistantError(error), type: 'error' });
      }
    };

    void markRead();
  }, [detail]);

  const filteredConversations = useMemo(() => {
    if (filter === 'ALL') return conversations;
    return conversations.filter((conversation) => conversation.status === filter);
  }, [conversations, filter]);

  const handleReply = async () => {
    if (!detail?.conversation?.publicId || !reply.trim()) return;
    setReplying(true);
    try {
      const response = await sendStaffGuestReply(detail.conversation.publicId, {
        body: reply.trim(),
        replyLanguage: translationMode === 'original' ? 'en' : translationMode,
      });
      setReply('');
      setDetail((current) => current ? ({
        conversation: {
          ...current.conversation,
          lastMessagePreview: response.originalBody,
          lastMessageAt: response.createdAt,
          status: 'ACTIVE',
        },
        messages: mergeMessagesById(current.messages, response),
      }) : current);
      publishTyping(detail.conversation.publicId, false);
    } catch (error) {
      setToast({ message: extractGuestAssistantError(error), type: 'error' });
    } finally {
      setReplying(false);
    }
  };

  const handleResolve = async () => {
    if (!detail?.conversation?.publicId) return;
    try {
      const summary = await resolveStaffGuestConversation(detail.conversation.publicId);
      setDetail((current) => current ? ({ ...current, conversation: summary }) : current);
      setConversations((current) => mergeConversationList(current, summary));
    } catch (error) {
      setToast({ message: extractGuestAssistantError(error), type: 'error' });
    }
  };

  const handleTypingChange = (value) => {
    setReply(value);
    if (!detail?.conversation?.publicId) return;
    publishTyping(detail.conversation.publicId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      publishTyping(detail.conversation.publicId, false);
    }, 1200);
  };

  if (loadingList && !conversations.length) {
    return <LoadingState message={translateWithFallback(t, 'staffGuestInbox.loading', 'Loading guest inbox...')} />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={translateWithFallback(t, 'staffGuestInbox.eyebrow', 'Live guest messaging')}
        title={translateWithFallback(t, 'staffGuestInbox.title', 'Guest Assistant Inbox')}
        description={translateWithFallback(t, 'staffGuestInbox.description', 'Monitor guest conversations, continue AI-handled threads, and reply in real time.')}
        meta={[
          `${filteredConversations.length} visible`,
          connected ? 'Realtime connected' : 'Realtime reconnecting',
          detail?.conversation?.staffOnline ? 'Support online' : 'AI fallback ready',
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-ink-hint">
            {translateWithFallback(t, 'staffGuestInbox.snapshot', 'Support snapshot')}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  filter === option
                    ? 'bg-white text-brand-ink'
                    : 'border border-white/15 bg-white/5 text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <DashboardPanel
          title={translateWithFallback(t, 'staffGuestInbox.queueTitle', 'Conversations')}
          description={translateWithFallback(t, 'staffGuestInbox.queueDescription', 'Unread indicators, room context, and AI-handled threads appear here first.')}
        >
          {loadingList ? (
            <LoadingState message={translateWithFallback(t, 'staffGuestInbox.loadingList', 'Refreshing conversations...')} />
          ) : filteredConversations.length === 0 ? (
            <EmptyState
              title={translateWithFallback(t, 'staffGuestInbox.emptyTitle', 'No conversations')}
              message={translateWithFallback(t, 'staffGuestInbox.emptyMessage', 'New guest assistant conversations will appear here automatically.')}
              icon={BellRing}
            />
          ) : (
            <div className="space-y-3">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.publicId}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.publicId)}
                  className={`w-full rounded-[1.35rem] border p-4 text-left transition ${
                    conversation.publicId === detail?.conversation?.publicId
                      ? 'border-brand-primary/30 bg-brand-primary/10'
                      : 'border-brand-surface-border bg-white hover:bg-brand-surface-light'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-brand-ink">
                        {conversation.guestName || 'Guest'}
                      </p>
                      <p className="mt-1 text-xs font-medium text-brand-ink-muted">
                        {conversation.roomNumber ? `Room ${conversation.roomNumber}` : 'No room assigned'}
                      </p>
                    </div>
                    {conversation.unreadStaffCount > 0 ? (
                      <span className="rounded-full bg-brand-danger px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                        {conversation.unreadStaffCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 truncate text-sm font-medium text-brand-ink-muted">
                    {conversation.lastMessagePreview}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-brand-ink-hint">
                    <span className="rounded-full border border-brand-surface-border px-2 py-1">{conversation.status}</span>
                    <span className="rounded-full border border-brand-surface-border px-2 py-1">
                      {conversation.reservationStatus || 'NO_STATUS'}
                    </span>
                    {conversation.aiHandled ? (
                      <span className="rounded-full border border-brand-primary/20 bg-brand-primary/10 px-2 py-1 text-brand-primary">
                        AI Handled
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title={translateWithFallback(t, 'staffGuestInbox.detailTitle', 'Active thread')}
          description={translateWithFallback(t, 'staffGuestInbox.detailDescription', 'Continue the conversation, review translations, and resolve the thread when the request is complete.')}
        >
          {!detail && loadingDetail ? (
            <LoadingState message={translateWithFallback(t, 'staffGuestInbox.loadingThread', 'Loading conversation...')} />
          ) : !detail ? (
            <ErrorState
              title={translateWithFallback(t, 'staffGuestInbox.noSelectionTitle', 'No conversation selected')}
              message={translateWithFallback(t, 'staffGuestInbox.noSelectionMessage', 'Choose a guest conversation from the inbox to reply.')}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-brand-surface-border bg-brand-surface-light p-4">
                <div>
                  <p className="text-lg font-black text-brand-ink">
                    {detail.conversation.guestName || 'Guest'}
                    {detail.conversation.roomNumber ? ` - Room ${detail.conversation.roomNumber}` : ''}
                  </p>
                  <p className="mt-1 text-sm font-medium text-brand-ink-muted">
                    {detail.conversation.assignedStaffName || 'Unassigned'} - {detail.conversation.staffOnline ? 'Support online' : 'AI fallback active'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['original', 'ar', 'en'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTranslationMode(mode)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] transition ${
                        translationMode === mode
                          ? 'border-brand-primary/25 bg-brand-primary/10 text-brand-primary'
                          : 'border-brand-surface-border bg-white text-brand-ink-muted'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSoundEnabled((current) => !current)}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-surface-border bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-brand-ink-muted"
                  >
                    {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                    Alerts
                  </button>
                  <button
                    type="button"
                    onClick={handleResolve}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-white"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Resolve
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-[1.2rem] border border-brand-surface-border bg-white px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                    Guest name
                  </p>
                  <p className="mt-2 text-sm font-bold text-brand-ink">
                    {detail.conversation.guestName || 'Guest'}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-brand-surface-border bg-white px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                    Room number
                  </p>
                  <p className="mt-2 text-sm font-bold text-brand-ink">
                    {detail.conversation.roomNumber ? `Room ${detail.conversation.roomNumber}` : 'No room assigned'}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-brand-surface-border bg-white px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                    Reservation status
                  </p>
                  <p className="mt-2 text-sm font-bold text-brand-ink">
                    {detail.conversation.reservationStatus
                      ? getReservationStatusLabel(detail.conversation.reservationStatus, t)
                      : 'Unknown'}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-brand-surface-border bg-white px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                    Selected room context
                  </p>
                  <p className="mt-2 text-sm font-bold text-brand-ink">
                    {buildConversationContextLabel(detail.conversation)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-brand-surface-border bg-white px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                    Preferred language
                  </p>
                  <p className="mt-2 text-sm font-bold text-brand-ink">
                    {(detail.conversation.preferredLanguage || 'en').toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="max-h-[32rem] overflow-y-auto rounded-[1.4rem] border border-brand-surface-border bg-[linear-gradient(180deg,#F6F2EA_0%,#FFFFFF_100%)] p-4">
                <GuestAssistantMessageList
                  messages={detail.messages}
                  translationMode={translationMode}
                  guestView={false}
                  typingLabel={guestTyping ? 'Guest is typing...' : ''}
                  language={i18n.language}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-brand-ink-muted">
                <span className="inline-flex items-center gap-1 rounded-full border border-brand-surface-border bg-white px-3 py-1.5">
                  <Bot className="h-3.5 w-3.5" />
                  {detail.conversation.aiHandled ? 'AI assisted thread' : 'Human handled thread'}
                </span>
                {detail.conversation.unreadStaffCount > 0 ? (
                  <span className="rounded-full border border-brand-danger/20 bg-brand-danger/10 px-3 py-1.5 text-brand-danger">
                    {detail.conversation.unreadStaffCount} unread guest messages
                  </span>
                ) : null}
              </div>

              <div className="flex items-end gap-3">
                <textarea
                  value={reply}
                  onChange={(event) => handleTypingChange(event.target.value)}
                  rows={3}
                  placeholder={translateWithFallback(t, 'staffGuestInbox.replyPlaceholder', 'Reply to the guest...')}
                  className="min-h-[4.5rem] flex-1 rounded-[1.3rem] border border-brand-surface-border bg-white px-4 py-3 text-sm font-medium text-brand-ink shadow-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                />
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={replying || !reply.trim() || !connected}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-sm transition hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Send reply"
                >
                  {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </DashboardPanel>
      </div>

      <ConfirmationToast
        message={toast?.message ?? null}
        type={toast?.type ?? 'info'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
