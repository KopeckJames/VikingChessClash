import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle,
  Send,
  Smile,
  X,
  ChevronDown,
  Volume2,
  VolumeX,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatNotifications } from '@/hooks/use-chat-notifications'
import { useChatSwipeGestures } from '@/hooks/use-swipe-gestures'
import type { ChatMessage } from '@shared/schema'

interface ChatMessageWithSender extends ChatMessage {
  senderName: string
}

interface MobileChatProps {
  gameId: number
  currentUserId: number
  onSendMessage: (message: string) => void
  newMessage?: ChatMessageWithSender | null
  className?: string
}

// Emoji picker data
const EMOJI_CATEGORIES = {
  Smileys: [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '🙃',
    '😉',
    '😌',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
    '😋',
    '😛',
    '😝',
    '😜',
    '🤪',
    '🤨',
    '🧐',
    '🤓',
    '😎',
    '🤩',
    '🥳',
  ],
  Gestures: [
    '👍',
    '👎',
    '👌',
    '🤞',
    '✌️',
    '🤟',
    '🤘',
    '🤙',
    '👈',
    '👉',
    '👆',
    '🖕',
    '👇',
    '☝️',
    '👋',
    '🤚',
    '🖐️',
    '✋',
    '🖖',
    '👏',
    '🙌',
    '🤲',
    '🤝',
    '🙏',
  ],
  Games: [
    '♔',
    '♕',
    '♖',
    '♗',
    '♘',
    '♙',
    '♚',
    '♛',
    '♜',
    '♝',
    '♞',
    '♟',
    '🎯',
    '🎲',
    '🃏',
    '🎮',
    '🕹️',
    '🎪',
    '🎭',
    '🎨',
    '🎬',
    '🎤',
    '🎧',
    '🎼',
    '🎵',
    '🎶',
    '🎹',
    '🥁',
    '🎷',
    '🎺',
    '🎸',
    '🪕',
  ],
}

export default function MobileChat({
  gameId,
  currentUserId,
  onSendMessage,
  newMessage,
  className,
}: MobileChatProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessageWithSender[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isTyping, setIsTyping] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastMessageRef = useRef<number>(0)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize chat notifications
  const { notifyNewMessage } = useChatNotifications(currentUserId, {
    soundEnabled,
    browserNotifications: true,
    toastNotifications: true,
    vibrationEnabled: true,
  })

  // Initialize swipe gestures
  const { ref: swipeRef } = useChatSwipeGestures(() => setIsOpen(false))

  const { data: initialMessages } = useQuery<ChatMessageWithSender[]>({
    queryKey: [`/api/games/${gameId}/chat`],
    enabled: !!gameId,
  })

  // Initialize messages
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages)
      lastMessageRef.current = initialMessages.length
    }
  }, [initialMessages])

  // Handle new messages
  useEffect(() => {
    if (newMessage && newMessage.id !== messages[messages.length - 1]?.id) {
      setMessages(prev => [...prev, newMessage])

      // Update unread count if chat is closed
      if (!isOpen && newMessage.senderId !== currentUserId) {
        setUnreadCount(prev => prev + 1)
      }

      // Trigger notifications
      notifyNewMessage(newMessage, isOpen)
    }
  }, [newMessage, messages, isOpen, currentUserId, notifyNewMessage])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isOpen])

  // Clear unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
    }
  }, [isOpen])

  const handleSendMessage = useCallback(() => {
    if (message.trim()) {
      onSendMessage(message.trim())
      setMessage('')
      setIsTyping(false)

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [message, onSendMessage])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }
    },
    [handleSendMessage]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value)

      // Handle typing indicator
      if (!isTyping) {
        setIsTyping(true)
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
      }, 2000)
    },
    [isTyping]
  )

  const addEmoji = useCallback((emoji: string) => {
    setMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }, [])

  const formatTime = useCallback((date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }, [])

  const getPlayerInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [])

  const getPlayerColor = useCallback((senderId: number) => {
    const colors = [
      'from-blue-500 to-blue-700',
      'from-purple-500 to-purple-700',
      'from-green-500 to-green-700',
      'from-red-500 to-red-700',
      'from-yellow-500 to-yellow-700',
      'from-pink-500 to-pink-700',
    ]
    return colors[senderId % colors.length]
  }, [])

  const isOwnMessage = useCallback(
    (senderId: number) => {
      return senderId === currentUserId
    },
    [currentUserId]
  )

  return (
    <div className={cn('fixed bottom-4 right-4 z-50', className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="relative bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg rounded-full w-14 h-14 p-0"
          >
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent
          side="bottom"
          className="h-[80vh] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-t border-white/20 rounded-t-3xl"
          ref={swipeRef}
        >
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-white flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-blue-400" />
                Game Chat
              </SheetTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                <div className="w-8 h-1 bg-white/30 rounded-full mx-auto" />
              </div>
            </div>
          </SheetHeader>

          <div className="flex flex-col h-full">
            {/* Messages Area */}
            <ScrollArea className="flex-1 px-2" ref={scrollRef}>
              <div className="space-y-3 pb-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isOwn = isOwnMessage(msg.senderId)
                    const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex items-end space-x-2 animate-in slide-in-from-bottom-2 duration-300',
                          isOwn ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                        )}
                      >
                        {/* Avatar */}
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            showAvatar ? 'visible' : 'invisible',
                            isOwn
                              ? 'bg-gradient-to-br from-green-500 to-green-700'
                              : `bg-gradient-to-br ${getPlayerColor(msg.senderId)}`
                          )}
                        >
                          <span className="text-white text-xs font-bold">
                            {getPlayerInitials(msg.senderName)}
                          </span>
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={cn(
                            'max-w-[75%] rounded-2xl px-4 py-2 shadow-lg',
                            isOwn
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-br-md'
                              : 'bg-white/10 backdrop-blur-sm text-white rounded-bl-md border border-white/20'
                          )}
                        >
                          {showAvatar && !isOwn && (
                            <div className="text-xs font-medium text-gray-300 mb-1">
                              {msg.senderName}
                            </div>
                          )}
                          <p className="text-sm break-words leading-relaxed">{msg.message}</p>
                          <div
                            className={cn(
                              'text-xs mt-1 opacity-70',
                              isOwn ? 'text-right text-green-100' : 'text-left text-gray-400'
                            )}
                          >
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <div className="flex space-x-1">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                    <span>Someone is typing...</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-t-2xl p-4 mb-2">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-medium">Add Emoji</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-white/70 hover:text-white hover:bg-white/10 p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3 max-h-32 overflow-y-auto">
                  {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                    <div key={category}>
                      <h4 className="text-xs text-gray-400 mb-2 font-medium">{category}</h4>
                      <div className="grid grid-cols-8 gap-2">
                        {emojis.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => addEmoji(emoji)}
                            className="text-xl hover:bg-white/10 rounded-lg p-1 transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="bg-white/5 backdrop-blur-sm border-t border-white/20 p-4 rounded-t-2xl">
              <div className="flex items-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-white/70 hover:text-white hover:bg-white/10 p-2 mb-1"
                >
                  <Smile className="w-5 h-5" />
                </Button>

                <div className="flex-1">
                  <Input
                    ref={inputRef}
                    value={message}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 rounded-2xl px-4 py-3 text-base resize-none min-h-[44px]"
                    maxLength={500}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1 px-2">
                    <span>Tap to type • Swipe down to close</span>
                    <span>{message.length}/500</span>
                  </div>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full w-12 h-12 p-0 mb-1 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
