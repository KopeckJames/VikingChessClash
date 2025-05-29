import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send } from "lucide-react";
import type { ChatMessage } from "@shared/schema";

interface ChatProps {
  gameId: number;
  onSendMessage: (message: string) => void;
}

interface ChatMessageWithSender extends ChatMessage {
  senderName: string;
}

export default function Chat({ gameId, onSendMessage }: ChatProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessageWithSender[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: initialMessages } = useQuery<ChatMessageWithSender[]>({
    queryKey: ['/api/games', gameId, 'chat'],
    enabled: !!gameId,
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addMessage = (newMessage: ChatMessageWithSender) => {
    setMessages(prev => [...prev, newMessage]);
  };

  // Expose addMessage function for parent to call when receiving WebSocket messages
  useEffect(() => {
    (window as any).addChatMessage = addMessage;
    return () => {
      delete (window as any).addChatMessage;
    };
  }, []);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPlayerInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getPlayerColor = (senderId: number) => {
    // Alternate colors based on sender ID
    return senderId % 2 === 0 ? 'from-blue-500 to-blue-700' : 'from-purple-500 to-purple-700';
  };

  return (
    <Card className="bg-white/5 backdrop-blur-lg border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center text-yellow-400">
          <MessageCircle className="w-5 h-5 mr-2" />
          Game Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64 p-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex items-start space-x-2">
                  <div className={`w-8 h-8 bg-gradient-to-br ${getPlayerColor(msg.senderId)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">
                      {getPlayerInitials(msg.senderName)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-white/10 rounded-2xl px-3 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-300">{msg.senderName}</span>
                        <span className="text-xs text-gray-500">{formatTime(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm text-white break-words">{msg.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t border-white/10">
          <div className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
              maxLength={200}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              size="icon"
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-yellow-900"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Press Enter to send</span>
            <span>{message.length}/200</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
