import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { SOCKET_TOPIC, WS_URL } from '../config/endpoints';
import { storage } from '../utils/storage';

function toSockJsUrl(url) {
  return url.replace(/^ws/, 'http');
}

export const createTrackingSocket = async ({ tripId, onCoordinate, onError }) => {
  const token = await storage.getToken();
  const client = new Client({
    webSocketFactory: () => new SockJS(toSockJsUrl(WS_URL)),
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 5000,
    onConnect: () => {
      client.subscribe(SOCKET_TOPIC(tripId), (message) => {
        if (!message.body) return;

        try {
          onCoordinate?.(JSON.parse(message.body));
        } catch (error) {
          onError?.(error);
        }
      });
    },
    onStompError: (frame) => onError?.(frame),
    onWebSocketError: (event) => onError?.(event),
    onWebSocketClose: (event) => onError?.(event),
  });

  client.activate();
  return client;
};
