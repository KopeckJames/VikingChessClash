import type { WSMessage } from "@shared/schema";

export class WebSocketManager {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageQueue: string[] = [];
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          
          // Send queued messages
          while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (message && this.socket?.readyState === WebSocket.OPEN) {
              this.socket.send(message);
            }
          }
          
          resolve(this.socket);
        };

        this.socket.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.socket.onclose = () => {
          console.log('WebSocket disconnected');
          this.socket = null;
          this.attemptReconnect();
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: WSMessage) {
    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach(listener => listener(message));
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  send(message: WSMessage) {
    const messageStr = JSON.stringify(message);
    
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(messageStr);
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(messageStr);
    }
  }

  on(messageType: string, listener: (data: any) => void) {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, new Set());
    }
    this.listeners.get(messageType)!.add(listener);
  }

  off(messageType: string, listener: (data: any) => void) {
    const listeners = this.listeners.get(messageType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}
