import { useState, useEffect, useRef } from "react";
import { WebSocketManager } from "@/lib/websocket";

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const wsManagerRef = useRef<WebSocketManager | null>(null);

  useEffect(() => {
    const wsManager = new WebSocketManager();
    wsManagerRef.current = wsManager;

    wsManager.connect()
      .then(() => {
        setIsConnected(true);
      })
      .catch((error) => {
        console.error('WebSocket connection failed:', error);
        setIsConnected(false);
      });

    // Monitor connection status
    const checkConnection = setInterval(() => {
      setIsConnected(wsManager.isConnected);
    }, 1000);

    return () => {
      clearInterval(checkConnection);
      wsManager.disconnect();
    };
  }, []);

  return {
    socket: wsManagerRef.current,
    isConnected,
  };
}
