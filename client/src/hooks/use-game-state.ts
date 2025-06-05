import { useState, useEffect, useCallback } from "react";
import { WebSocketManager } from "@/lib/websocket";
import type { Game, Move, WSMessage } from "@shared/schema";

export function useGameState(gameId: number, socket: WebSocketManager | null) {
  const [gameState, setGameState] = useState<Game | null>(null);
  const [latestChatMessage, setLatestChatMessage] = useState<any>(null);

  useEffect(() => {
    if (!socket) return;

    const handleGameUpdate = (message: WSMessage) => {
      if (message.type === 'game_update') {
        setGameState(message.game);
      }
    };

    const handleChatMessage = (message: WSMessage) => {
      if (message.type === 'chat_message') {
        setLatestChatMessage(message.message);
      }
    };

    const handleError = (message: WSMessage) => {
      if (message.type === 'error') {
        console.error('WebSocket error:', message.message);
      }
    };

    const handleLobbyUpdate = (message: any) => {
      // This will be handled by the lobby component
      console.log('Lobby update received');
    };

    socket.on('game_update', handleGameUpdate);
    socket.on('chat_message', handleChatMessage);
    socket.on('error', handleError);
    socket.on('lobby_update', handleLobbyUpdate);

    return () => {
      socket.off('game_update', handleGameUpdate);
      socket.off('chat_message', handleChatMessage);
      socket.off('error', handleError);
      socket.off('lobby_update', handleLobbyUpdate);
    };
  }, [socket]);

  const makeMove = useCallback((move: Move) => {
    if (socket && gameId) {
      socket.send({
        type: 'make_move',
        gameId,
        move,
      });
    }
  }, [socket, gameId]);

  const sendChatMessage = useCallback((message: string) => {
    if (socket && gameId) {
      socket.send({
        type: 'send_chat',
        gameId,
        message,
      });
    }
  }, [socket, gameId]);

  return {
    gameState,
    makeMove,
    sendChatMessage,
    latestChatMessage,
  };
}
