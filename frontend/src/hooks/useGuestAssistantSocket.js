import { useEffect, useRef, useState } from 'react';
import { createGuestAssistantSocket } from '../services/guestAssistantSocket';

export default function useGuestAssistantSocket({ enabled, onEvent, onError }) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return undefined;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setConnected(false);
      return undefined;
    }

    const client = createGuestAssistantSocket({
      token,
      onEvent,
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onError,
    });

    clientRef.current = client;
    client.activate();

    return () => {
      setConnected(false);
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
    connected,
    publishTyping,
  };
}
