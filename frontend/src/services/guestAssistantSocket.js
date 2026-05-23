import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const createGuestAssistantSocket = ({
  token,
  onEvent,
  onConnect,
  onDisconnect,
  onError,
}) => {
  const client = new Client({
    webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_WS_URL || ''}/ws/guest-assistant`),
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      client.subscribe('/user/queue/assistant-events', (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          onEvent?.(payload);
        } catch (error) {
          onError?.(error);
        }
      });
      onConnect?.(client);
    },
    onStompError: (frame) => {
      onError?.(new Error(frame.headers?.message || 'Guest assistant socket failed.'));
    },
    onWebSocketClose: () => {
      onDisconnect?.();
    },
  });

  return client;
};
