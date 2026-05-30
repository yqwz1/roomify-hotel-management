import { useEffect, useRef, useState } from 'react';
import { createGuestAssistantSocket } from '../services/guestAssistantSocket';

export default function useGuestAssistantSocket({ enabled, onEvent, onError }) {
  const clientRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return undefined;
    }

    const client = createGuestAssistantSocket({
      token,
      onEvent,
      onConnect: () => setSocketConnected(true),
      onDisconnect: () => setSocketConnected(false),
      onError,
    });

    clientRef.current = client;
    client.activate();

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [enabled, onError, onEvent]);

  const publishTyping = (conversationPublicId, typing) => {
    const client = clientRef.current;
    if (!client?.connected || !conversationPublicId) return;

    client.publish({
      destination: '/app/guest-assistant.typing',
      body: JSON.stringify({ conversationPublicId, typing }),
    });
  };

  return {
    connected: enabled && socketConnected,
    publishTyping,
  };
}
