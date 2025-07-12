import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket() {
  const { partner, isAuthenticated } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !partner) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Connecting to WebSocket for real-time tracking:', wsUrl);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected for partner:', partner._id);
      
      // Send partner connection message
      ws.current?.send(JSON.stringify({
        type: 'partner_connect',
        partnerId: partner._id
      }));
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Real-time message received:', message.type);
        setLastMessage(message);
        
        // Handle different message types
        if (message.type === 'order_update') {
          window.dispatchEvent(new CustomEvent('order_update', { detail: message }));
        }
        
        if (message.type === 'partner_location_update') {
          window.dispatchEvent(new CustomEvent('partner_location_update', { detail: message }));
        }
        
        if (message.type === 'order_status_update') {
          window.dispatchEvent(new CustomEvent('order_status_update', { detail: message }));
        }
        
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [isAuthenticated, partner]);

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}
