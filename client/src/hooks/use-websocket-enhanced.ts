import { useEffect, useRef, useState, useCallback } from 'react'
import { WSMessage } from '@shared/schema'

interface WebSocketConfig {
  url: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
}

interface WebSocketState {
  isConnected: boolean
  isReconnecting: boolean
  reconnectAttempts: number
  lastError: string | null
}

export function useWebSocketEnhanced(config: WebSocketConfig) {
  const {
    url,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 30000,
  } = config

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isReconnecting: false,
    reconnectAttempts: 0,
    lastError: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageHandlersRef = useRef<Map<string, (data: any) => void>>(new Map())
  const messageQueueRef = useRef<string[]>([])

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback(
    (attempt: number) => {
      return Math.min(reconnectInterval * Math.pow(2, attempt), 30000)
    },
    [reconnectInterval]
  )

  // Send heartbeat ping
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }))
    }
  }, [])

  // Start heartbeat timer
  const startHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current)
    }
    heartbeatTimeoutRef.current = setInterval(sendHeartbeat, heartbeatInterval)
  }, [sendHeartbeat, heartbeatInterval])

  // Stop heartbeat timer
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current)
      heartbeatTimeoutRef.current = null
    }
  }, [])

  // Process queued messages
  const processMessageQueue = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && messageQueueRef.current.length > 0) {
      const messages = [...messageQueueRef.current]
      messageQueueRef.current = []

      messages.forEach(message => {
        wsRef.current?.send(message)
      })
    }
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    try {
      setState(prev => ({ ...prev, isReconnecting: true, lastError: null }))

      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setState(prev => ({
          ...prev,
          isConnected: true,
          isReconnecting: false,
          reconnectAttempts: 0,
          lastError: null,
        }))

        startHeartbeat()
        processMessageQueue()
      }

      ws.onmessage = event => {
        try {
          const message: WSMessage = JSON.parse(event.data)

          // Handle pong responses
          if (message.type === 'pong') {
            return
          }

          // Call registered message handlers
          const handler = messageHandlersRef.current.get(message.type)
          if (handler) {
            handler(message)
          }

          // Call generic message handler
          const genericHandler = messageHandlersRef.current.get('*')
          if (genericHandler) {
            genericHandler(message)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = event => {
        console.log('WebSocket disconnected:', event.code, event.reason)

        setState(prev => ({ ...prev, isConnected: false }))
        stopHeartbeat()

        // Attempt reconnection if not manually closed
        if (event.code !== 1000 && state.reconnectAttempts < maxReconnectAttempts) {
          const delay = getReconnectDelay(state.reconnectAttempts)

          setState(prev => ({
            ...prev,
            isReconnecting: true,
            reconnectAttempts: prev.reconnectAttempts + 1,
          }))

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else {
          setState(prev => ({
            ...prev,
            isReconnecting: false,
            lastError: event.code === 1000 ? null : 'Connection failed',
          }))
        }
      }

      ws.onerror = error => {
        console.error('WebSocket error:', error)
        setState(prev => ({
          ...prev,
          lastError: 'Connection error',
          isConnected: false,
        }))
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setState(prev => ({
        ...prev,
        lastError: 'Failed to connect',
        isReconnecting: false,
      }))
    }
  }, [
    url,
    state.reconnectAttempts,
    maxReconnectAttempts,
    getReconnectDelay,
    startHeartbeat,
    processMessageQueue,
    stopHeartbeat,
  ])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    stopHeartbeat()

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
      wsRef.current = null
    }

    setState({
      isConnected: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      lastError: null,
    })
  }, [stopHeartbeat])

  // Send message with queuing support
  const sendMessage = useCallback((message: WSMessage) => {
    const messageStr = JSON.stringify(message)

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(messageStr)
    } else {
      // Queue message for when connection is restored
      messageQueueRef.current.push(messageStr)

      // Limit queue size to prevent memory issues
      if (messageQueueRef.current.length > 100) {
        messageQueueRef.current.shift()
      }
    }
  }, [])

  // Register message handler
  const onMessage = useCallback((type: string, handler: (data: any) => void) => {
    messageHandlersRef.current.set(type, handler)

    // Return cleanup function
    return () => {
      messageHandlersRef.current.delete(type)
    }
  }, [])

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    setState(prev => ({ ...prev, reconnectAttempts: 0 }))
    connect()
  }, [connect])

  // Initialize connection on mount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      stopHeartbeat()
    }
  }, [stopHeartbeat])

  return {
    ...state,
    sendMessage,
    onMessage,
    connect,
    disconnect,
    reconnect,
    queuedMessageCount: messageQueueRef.current.length,
  }
}

// Convenience hooks for specific message types
export function useGameWebSocket(gameId: number, userId: number) {
  const ws = useWebSocketEnhanced({
    url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
  })

  const joinGame = useCallback(() => {
    ws.sendMessage({ type: 'join_game', gameId, userId })
  }, [ws, gameId, userId])

  const makeMove = useCallback(
    (move: any) => {
      ws.sendMessage({ type: 'make_move', gameId, move })
    },
    [ws, gameId]
  )

  const sendChat = useCallback(
    (message: string) => {
      ws.sendMessage({ type: 'send_chat', gameId, message })
    },
    [ws, gameId]
  )

  const resignGame = useCallback(() => {
    ws.sendMessage({ type: 'resign_game', gameId, userId })
  }, [ws, gameId, userId])

  const spectateGame = useCallback(() => {
    ws.sendMessage({ type: 'spectate_game', gameId, userId })
  }, [ws, gameId, userId])

  // Auto-join game when connected
  useEffect(() => {
    if (ws.isConnected) {
      joinGame()
    }
  }, [ws.isConnected, joinGame])

  return {
    ...ws,
    joinGame,
    makeMove,
    sendChat,
    resignGame,
    spectateGame,
  }
}

export function useLobbyWebSocket(userId: number) {
  const ws = useWebSocketEnhanced({
    url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
  })

  const joinLobby = useCallback(() => {
    ws.sendMessage({ type: 'join_lobby', userId })
  }, [ws, userId])

  // Auto-join lobby when connected
  useEffect(() => {
    if (ws.isConnected) {
      joinLobby()
    }
  }, [ws.isConnected, joinLobby])

  return {
    ...ws,
    joinLobby,
  }
}
