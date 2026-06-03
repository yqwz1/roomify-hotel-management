import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, SendHorizonal, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import ConfirmationToast from '../ConfirmationToast';
import { useAuth } from '../../context/AuthProvider';
import useGuestAssistantSocket from '../../hooks/useGuestAssistantSocket';
import {
  createGuestConversation,
  extractGuestAssistantError,
  getGuestConversation,
  listGuestConversations,
  markGuestConversationRead,
  runGuestQuickAction,
  sendGuestConversationMessage,
} from '../../services/guestAssistantService';
import { getGuestReservations } from '../../services/guestReservationService';
import {
  buildConversationLabel,
  buildGuestAssistantConversationSubject,
  buildGuestReservationRoomContextLabel,
  getGuestAssistantReservationAccess,
  getLanguageCode,
  isGuestCheckedInReservation,
  mergeConversationList,
  mergeMessagesById,
} from '../../utils/guestAssistant';
import { translateWithFallback } from '../../utils/localization';
import GuestAssistantLauncher from './GuestAssistantLauncher';
import GuestAssistantMessageList from './GuestAssistantMessageList';
import GuestAssistantQuickActions from './GuestAssistantQuickActions';

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
export default function FloatingGuestAssistant() {
  const { user, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const isGuest = Array.isArray(user?.roles) && user.roles.includes('ROLE_GUEST');
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [selectedReservationId, setSelectedReservationId] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [reservationLoading, setReservationLoading] = useState(true);
  const [staffTyping, setStaffTyping] = useState(false);
  const [toast, setToast] = useState(null);
  const typingTimeoutRef = useRef(null);
  const activeConversationIdRef = useRef('');

  const reservationAccess = useMemo(
    () => getGuestAssistantReservationAccess(reservations),
    [reservations]
  );
  const checkedInReservations = reservationAccess.checkedInReservations;

  const findConversationReservation = useCallback(
    (conversation) => {
      if (!conversation) return null;
      const roomId = conversation.roomId != null ? String(conversation.roomId) : '';
      const reservationId =
        conversation.reservationId != null ? String(conversation.reservationId) : '';
      const roomNumber = String(conversation.roomNumber ?? '').trim();

      return (
        reservations.find((reservation) =>
          (roomId && String(reservation.roomId ?? '') === roomId)
          || (reservationId && String(reservation.id ?? '') === reservationId)
          || (roomNumber && String(reservation.roomNumber ?? '') === roomNumber)
        ) ?? null
      );
    },
    [reservations]
  );

  const findConversationForReservation = useCallback(
    (reservation) => {
      if (!reservation) return null;
      const roomId = String(reservation.roomId ?? '');
      const reservationId = String(reservation.id ?? '');
      const roomNumber = String(reservation.roomNumber ?? '').trim();

      return (
        conversations.find((conversation) =>
          (roomId && String(conversation.roomId ?? '') === roomId)
          || (reservationId && String(conversation.reservationId ?? '') === reservationId)
          || (roomNumber && String(conversation.roomNumber ?? '') === roomNumber)
        ) ?? null
      );
    },
    [conversations]
  );

  const selectedReservation = useMemo(() => {
    if (checkedInReservations.length === 1) {
      return checkedInReservations[0];
    }
    return checkedInReservations.find((reservation) => String(reservation.id ?? '') === String(selectedReservationId ?? '')) ?? null;
  }, [checkedInReservations, selectedReservationId]);

  const loadConversationDetail = useCallback(async (publicId, { silent = false } = {}) => {
    if (!publicId) return null;
    if (!silent) setLoading(true);
    try {
      const response = await getGuestConversation(publicId);
      setDetail(response);
      setConversations((current) => mergeConversationList(current, response.conversation));
      return response;
    } catch (error) {
      setToast({ message: extractGuestAssistantError(error), type: 'error' });
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const ensureConversationForReservation = useCallback(
    async (reservation) => {
      if (!reservation || !isGuestCheckedInReservation(reservation)) {
        return null;
      }

      const existingConversation = findConversationForReservation(reservation);
      if (existingConversation?.publicId) {
        setSelectedReservationId(String(reservation.id ?? ''));
        setActiveConversationId(existingConversation.publicId);
        return loadConversationDetail(existingConversation.publicId);
      }

      setLoading(true);
      try {
        const response = await createGuestConversation({
          reservationId: reservation.id,
          roomId: reservation.roomId,
          preferredLanguage: getLanguageCode(i18n.language),
          subject: buildGuestAssistantConversationSubject(reservation),
        });
        setSelectedReservationId(String(reservation.id ?? ''));
        setDetail(response);
        setActiveConversationId(response.conversation.publicId);
        setConversations((current) => mergeConversationList(current, response.conversation));
        return response;
      } catch (error) {
        setToast({ message: extractGuestAssistantError(error), type: 'error' });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [findConversationForReservation, i18n.language, loadConversationDetail]
  );

  const handleSocketEvent = useCallback((event) => {
    if (event?.conversation) {
      setConversations((current) => mergeConversationList(current, event.conversation));
    }

    if (event?.eventType === 'PRESENCE') {
      setConversations((current) => current.map((conversation) => ({
        ...conversation,
        staffOnline: event.staffOnline ?? conversation.staffOnline,
        onlineStaffCount: event.onlineStaffCount ?? conversation.onlineStaffCount,
      })));
      setDetail((current) => current ? ({
        ...current,
        conversation: {
          ...current.conversation,
          staffOnline: event.staffOnline ?? current.conversation.staffOnline,
          onlineStaffCount: event.onlineStaffCount ?? current.conversation.onlineStaffCount,
        },
      }) : current);
      return;
    }

    if (event?.eventType === 'TYPING' && event.typingConversationPublicId === activeConversationIdRef.current) {
      setStaffTyping(Boolean(event.typing && event.typingSenderRole !== 'GUEST'));
      return;
    }

    if (!event?.conversation || event.conversation.publicId !== activeConversationIdRef.current) {
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

    if (event?.eventType === 'READ_UPDATED' || event?.eventType === 'CONVERSATION_RESOLVED') {
      void loadConversationDetail(event.conversation.publicId, { silent: true });
    }
  }, [loadConversationDetail]);

  const { publishTyping } = useGuestAssistantSocket({
    enabled: isAuthenticated && isGuest,
    onEvent: handleSocketEvent,
    onError: (error) => {
      setToast({ message: error?.message || 'Guest assistant connection failed.', type: 'error' });
    },
  });

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isGuest) return undefined;
    let ignore = false;

    const load = async () => {
      setConversationLoading(true);
      try {
        const items = await listGuestConversations();
        if (ignore) return;
        setConversations(items);
      } catch (error) {
        if (!ignore) {
          setToast({ message: extractGuestAssistantError(error), type: 'error' });
        }
      } finally {
        if (!ignore) {
          setConversationLoading(false);
        }
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, isGuest]);

  useEffect(() => {
    if (!isAuthenticated || !isGuest) return undefined;
    let ignore = false;

    const loadReservations = async () => {
      setReservationLoading(true);
      try {
        const items = await getGuestReservations();
        if (ignore) return;
        setReservations(Array.isArray(items) ? items : []);
      } catch (error) {
        if (!ignore) {
          setToast({ message: extractGuestAssistantError(error), type: 'error' });
        }
      } finally {
        if (!ignore) {
          setReservationLoading(false);
        }
      }
    };

    void loadReservations();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, isGuest]);

  useEffect(() => {
    if (!open || !isGuest) return;
    if (reservationLoading || conversationLoading) return;

    if (checkedInReservations.length === 0) {
      if (selectedReservationId) {
        setSelectedReservationId('');
      }
      setDetail(null);
      setActiveConversationId('');
      return;
    }

    if (checkedInReservations.length === 1) {
      const onlyReservation = checkedInReservations[0];
      const onlyReservationId = String(onlyReservation.id ?? '');
      const matchedConversation = findConversationForReservation(onlyReservation);
      if (selectedReservationId !== onlyReservationId) {
        setSelectedReservationId(onlyReservationId);
      }
      if (matchedConversation?.publicId === activeConversationId) {
        return;
      }
      void ensureConversationForReservation(onlyReservation);
      return;
    }

    if (!selectedReservation) {
      if (selectedReservationId) {
        setSelectedReservationId('');
      }
      setDetail(null);
      setActiveConversationId('');
      return;
    }

    const matchedConversation = findConversationForReservation(selectedReservation);
    if (matchedConversation?.publicId === activeConversationId) {
      return;
    }

    void ensureConversationForReservation(selectedReservation);
  }, [
    activeConversationId,
    checkedInReservations,
    ensureConversationForReservation,
    findConversationForReservation,
    isGuest,
    open,
    conversationLoading,
    reservationLoading,
    selectedReservation,
    selectedReservationId,
  ]);

  useEffect(() => {
    if (!open || !isGuest || reservationLoading || loading || !activeConversationId) return;
    if (detail?.conversation?.publicId === activeConversationId) return;

    void loadConversationDetail(activeConversationId);
  }, [
    activeConversationId,
    detail?.conversation?.publicId,
    isGuest,
    loadConversationDetail,
    open,
    loading,
    reservationLoading,
  ]);

  useEffect(() => {
    if (!open || !detail?.conversation?.publicId || detail.conversation.unreadGuestCount <= 0) return;

    const syncRead = async () => {
      try {
        const response = await markGuestConversationRead(detail.conversation.publicId);
        setDetail(response);
        setConversations((current) => mergeConversationList(current, response.conversation));
      } catch (error) {
        setToast({ message: extractGuestAssistantError(error), type: 'error' });
      }
    };

    void syncRead();
  }, [detail, open]);

  const visibleConversations = useMemo(
    () => conversations.filter((conversation) => isGuestCheckedInReservation(findConversationReservation(conversation))),
    [conversations, findConversationReservation]
  );

  const activeConversation = detail?.conversation
    ?? visibleConversations.find((conversation) => conversation.publicId === activeConversationId)
    ?? null;
  const activeReservation = findConversationReservation(activeConversation);
  const roomSelectionRequired = checkedInReservations.length > 1 && !selectedReservation;
  const currentConversationReady = Boolean(activeConversation?.publicId)
    && isGuestCheckedInReservation(activeReservation)
    && !roomSelectionRequired;
  const assistantMessagingLocked = roomSelectionRequired
    || !reservationAccess.hasCheckedInReservations
    || !currentConversationReady;
  const assistantBlockedByNoStay = !reservationAccess.hasCheckedInReservations;
  const assistantStatusText = reservationLoading
    ? translateWithFallback(t, 'guestAssistant.loading', 'Loading assistant...')
    : assistantBlockedByNoStay
      ? translateWithFallback(
          t,
          'guestAssistant.noActiveStay',
          'Room services are available only during an active stay.'
        )
      : roomSelectionRequired
        ? translateWithFallback(
            t,
            'guestAssistant.roomSelectionRequired',
            'Choose a room to start the conversation.'
          )
        : activeConversation?.staffOnline
          ? translateWithFallback(
              t,
              'guestAssistant.online',
              '{{count}} staff online',
              { count: activeConversation?.onlineStaffCount ?? 0 }
            )
          : translateWithFallback(
              t,
              'guestAssistant.offline',
              'Staff offline, AI assistant available'
            );

  const roomSelectorTitle = translateWithFallback(
    t,
    'guestAssistant.selectRoomTitle',
    'Choose the room you are speaking from'
  );
  const showRoomSelector = checkedInReservations.length > 1;
  const normalizedInput = input.trim();
  const selectedRoomLabel = selectedReservation
    ? buildGuestReservationRoomContextLabel(selectedReservation)
    : roomSelectorTitle;

  const handleSelectReservation = async (reservation) => {
    if (!reservation) return;
    setSelectedReservationId(String(reservation.id ?? ''));
    await ensureConversationForReservation(reservation);
  };

  const handleSendMessage = async () => {
    if (!normalizedInput) return;
    if (assistantBlockedByNoStay || roomSelectionRequired) {
      setToast({
        message: assistantStatusText,
        type: 'info',
      });
      return;
    }
    if (sending) return;

    let targetConversationPublicId = activeConversation?.publicId ?? '';
    const targetReservation = selectedReservation
      ?? activeReservation
      ?? (checkedInReservations.length === 1 ? checkedInReservations[0] : null);
    let ensuredConversation = null;

    setSending(true);
    try {
      if (!targetConversationPublicId && targetReservation) {
        ensuredConversation = await ensureConversationForReservation(targetReservation);
        targetConversationPublicId = ensuredConversation?.conversation?.publicId ?? '';
      }

      if (!targetConversationPublicId) {
        throw new Error(assistantStatusText);
      }

      const response = await sendGuestConversationMessage(targetConversationPublicId, {
        body: normalizedInput,
        detectedLanguage: getLanguageCode(i18n.language),
      });

      const nextConversation = (activeConversation ?? ensuredConversation?.conversation)
        ? {
            ...(activeConversation ?? ensuredConversation?.conversation),
            lastMessagePreview: response.originalBody,
            lastMessageAt: response.createdAt,
          }
        : null;

      setInput('');
      setDetail((current) => current ? ({
        conversation: {
          ...current.conversation,
          lastMessagePreview: response.originalBody,
          lastMessageAt: response.createdAt,
        },
        messages: mergeMessagesById(current.messages, response),
      }) : current);
      if (nextConversation) {
        setConversations((current) => mergeConversationList(current, nextConversation));
      }
      publishTyping(targetConversationPublicId, false);
    } catch (error) {
      setToast({ message: extractGuestAssistantError(error), type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleQuickAction = async (action) => {
    if (!activeConversation?.publicId) return;
    if (assistantMessagingLocked) {
      setToast({
        message: assistantStatusText,
        type: 'info',
      });
      return;
    }
    setSending(true);
    try {
      const response = await runGuestQuickAction(activeConversation.publicId, {
        action,
        detectedLanguage: getLanguageCode(i18n.language),
      });
      setDetail(response);
      setConversations((current) => mergeConversationList(current, response.conversation));
      setToast({
        message: translateWithFallback(t, 'guestAssistant.quickActionSuccess', 'Request sent to the guest assistant.'),
        type: 'success',
      });
    } catch (error) {
      setToast({ message: extractGuestAssistantError(error), type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleTypingChange = (value) => {
    setInput(value);
    if (!activeConversation?.publicId || assistantMessagingLocked) return;
    publishTyping(activeConversation.publicId, true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      publishTyping(activeConversation.publicId, false);
    }, 1200);
  };

  if (!isAuthenticated || !isGuest) {
    return null;
  }

  const assistantWidget = (
    <>
      <GuestAssistantLauncher
        open={open}
        staffOnline={Boolean(activeConversation?.staffOnline && !assistantMessagingLocked)}
        onClick={() => setOpen((current) => !current)}
      />

      <AnimatePresence>
        {open ? (
          <motion.aside
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-[calc(var(--roomify-mobile-nav-height)+env(safe-area-inset-bottom,0px)+5rem)] right-4 z-[71] flex h-[min(42rem,calc(100dvh-10rem-var(--roomify-mobile-nav-height)))] w-[min(27rem,calc(100vw-2rem))] min-w-0 origin-bottom-right flex-col overflow-hidden rounded-[2rem] border border-white/50 bg-white/85 shadow-[0_36px_100px_-34px_rgba(15,23,42,0.62)] backdrop-blur-xl sm:bottom-28 sm:right-6 sm:h-[min(42rem,calc(100vh-7rem))]"
            style={{ left: 'auto' }}
            data-assistant-side="right"
          >
            <div className="pointer-events-none absolute -top-8 right-4 h-28 w-28 rounded-full bg-brand-primary/20 blur-3xl" aria-hidden="true" />
            <div className="relative bg-[linear-gradient(135deg,#1A2B3A_0%,#285477_100%)] px-5 py-4 text-white">
              <div className="flex min-w-0 items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/60 break-words">
                    {translateWithFallback(t, 'guestAssistant.eyebrow', 'Roomify Concierge')}
                  </p>
                  <h3 className="mt-1 truncate text-xl font-black tracking-tight">
                    {currentConversationReady
                      ? buildConversationLabel(activeConversation)
                      : selectedRoomLabel}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-white/75 break-words">
                    {assistantStatusText}
                  </p>
                </div>
                <Button variant="unstyled" size="none"
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-white/15 bg-white/10 p-2 text-white transition hover:bg-white/20"
                  aria-label="Close guest assistant"
                >
                  <X className="h-4 w-4 shrink-0" />
                </Button>
              </div>
            </div>

            <div className="relative border-b border-brand-surface-border/70 bg-white/70 px-4 py-3">
              {showRoomSelector ? (
                <div className="space-y-3">
                  <div className="rounded-[1.25rem] border border-brand-surface-border bg-white p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                      {roomSelectorTitle}
                    </p>
                    <NativeSelect
                      value={selectedReservationId}
                      onChange={(event) => {
                        const reservation = checkedInReservations.find(
                          (item) => String(item.id ?? '') === String(event.target.value ?? '')
                        );
                        if (reservation) {
                          void handleSelectReservation(reservation);
                        }
                      }}
                      className="mt-3 h-12 w-full rounded-[1rem] border border-brand-surface-border bg-white px-4 text-sm font-medium text-brand-ink outline-none transition focus:border-brand-primary"
                    >
                      <option value="">
                        {translateWithFallback(
                          t,
                          'guestAssistant.selectRoomPlaceholder',
                          'Select a room'
                        )}
                      </option>
                      {checkedInReservations.map((reservation) => (
                        <option
                          key={`${reservation.id}-${reservation.roomId}`}
                          value={reservation.id}
                        >
                          {buildGuestReservationRoomContextLabel(reservation)}
                        </option>
                      ))}
                    </NativeSelect>
                    <p className="mt-2 text-xs font-medium text-brand-ink-muted break-words">
                      {translateWithFallback(
                        t,
                        'guestAssistant.roomSelectionHint',
                        'Choose the room you are speaking from before sending messages.'
                      )}
                    </p>
                  </div>
                  {visibleConversations.length > 0 ? (
                    <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
                      {visibleConversations.map((conversation) => (
                        <Button variant="unstyled" size="none"
                          key={conversation.publicId}
                          type="button"
                          onClick={() => {
                            setActiveConversationId(conversation.publicId);
                            void loadConversationDetail(conversation.publicId);
                          }}
                          className={`min-w-[10rem] rounded-2xl border px-3 py-2 text-start transition ${
                            conversation.publicId === activeConversation?.publicId
                              ? 'border-brand-primary/25 bg-brand-primary/10'
                              : 'border-brand-surface-border bg-white'
                          }`}
                        >
                          <p className="truncate text-sm font-black text-brand-ink">
                            {buildConversationLabel(conversation)}
                          </p>
                          <p className="mt-1 truncate text-xs font-medium text-brand-ink-muted">
                            {conversation.lastMessagePreview || 'Start a conversation'}
                          </p>
                          {conversation.unreadGuestCount > 0 ? (
                            <span className="mt-2 inline-flex min-w-0 rounded-full bg-brand-danger px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white break-words">
                              {conversation.unreadGuestCount} new
                            </span>
                          ) : null}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : checkedInReservations.length > 0 && visibleConversations.length > 0 ? (
                <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
                  {visibleConversations.map((conversation) => (
                    <Button variant="unstyled" size="none"
                      key={conversation.publicId}
                      type="button"
                      onClick={() => {
                        setActiveConversationId(conversation.publicId);
                        void loadConversationDetail(conversation.publicId);
                      }}
                      className={`min-w-[10rem] rounded-2xl border px-3 py-2 text-start transition ${
                        conversation.publicId === activeConversation?.publicId
                          ? 'border-brand-primary/25 bg-brand-primary/10'
                          : 'border-brand-surface-border bg-white'
                      }`}
                    >
                      <p className="truncate text-sm font-black text-brand-ink">
                        {buildConversationLabel(conversation)}
                      </p>
                      <p className="mt-1 truncate text-xs font-medium text-brand-ink-muted">
                        {conversation.lastMessagePreview || 'Start a conversation'}
                      </p>
                      {conversation.unreadGuestCount > 0 ? (
                        <span className="mt-2 inline-flex min-w-0 rounded-full bg-brand-danger px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white break-words">
                          {conversation.unreadGuestCount} new
                        </span>
                      ) : null}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative border-b border-brand-surface-border/70 bg-white/70 px-4 py-3">
              {assistantBlockedByNoStay ? (
                <div className="mb-3 rounded-[1.15rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                  {assistantStatusText}
                </div>
              ) : null}
              <GuestAssistantQuickActions
                disabled={sending || assistantMessagingLocked}
                onAction={handleQuickAction}
              />
            </div>

            <div className="relative min-w-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(245,242,234,0.65)_0%,rgba(255,255,255,0.88)_100%)] px-4 py-4">
              {loading && !detail ? (
                <div className="flex min-w-0 h-full items-center justify-center text-sm font-medium text-brand-ink-muted">
                  <Loader2 className="me-2 h-4 w-4 animate-spin shrink-0" />
                  {translateWithFallback(t, 'guestAssistant.loading', 'Loading assistant...')}
                </div>
              ) : (
                <GuestAssistantMessageList
                  messages={detail?.messages ?? []}
                  guestView
                  translationMode="guest"
                  typingLabel={staffTyping ? 'Staff is typing...' : ''}
                  language={i18n.language}
                />
              )}
            </div>

            <div className="relative border-t border-brand-surface-border/70 bg-white/90 px-4 py-4">
              <div className="relative flex min-w-0 items-end gap-3">
                <Textarea
                  value={input}
                  onChange={(event) => handleTypingChange(event.target.value)}
                  disabled={assistantMessagingLocked || sending}
                  rows={3}
                  placeholder={translateWithFallback(t, 'guestAssistant.placeholder', 'Write a message to the hotel team...')}
                  className="min-h-[4.5rem] min-w-0 flex-1 rounded-[1.3rem] border-brand-surface-border bg-white px-4 py-3 text-sm font-medium text-brand-ink shadow-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 disabled:bg-brand-surface-light"
                />
                <Button variant="unstyled" size="none"
                  type="button"
                  onClick={handleSendMessage}
                  disabled={sending || !normalizedInput || assistantMessagingLocked}
                  className="pointer-events-auto relative z-10 inline-flex min-w-0 h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-2xl bg-brand-primary text-white shadow-sm transition hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Send guest assistant message"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <SendHorizonal className="h-4 w-4 shrink-0" />}
                </Button>
              </div>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <ConfirmationToast
        message={toast?.message ?? null}
        type={toast?.type ?? 'info'}
        onClose={() => setToast(null)}
      />
    </>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(assistantWidget, document.body);
  }

  return assistantWidget;
}
