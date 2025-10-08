import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TouchButton } from '@/components/ui/touch-button'
import {
  MessageCircle,
  Send,
  Users,
  Crown,
  Trophy,
  Smile,
  MoreVertical,
  Flag,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  senderRole?: 'participant' | 'organizer' | 'moderator'
  message: string
  messageType: 'text' | 'system' | 'announcement'
  timestamp: string
  isEdited?: boolean
}

interface TournamentChatProps {
  tournamentId: string
  messages: ChatMessage[]
  currentUserId: string
  onSendMessage: (message: string) => void
  onReportMessage?: (messageId: string) => void
  isSending?: boolean
  className?: string
}

export function TournamentChat({
  tournamentId,
  messages,
  currentUserId,
  onSendMessage,
  onReportMessage,
  isSending = false,
  className,
}: TournamentChatProps) {
  const [newMessage, setNewMessage] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (newMessage.trim() && !isSending) {
      onSendMessage(newMessage.trim())
      setNewMessage('')
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'organizer':
        return <Crown className="w-3 h-3 text-yellow-400" />
      case 'moderator':
        return <Trophy className="w-3 h-3 text-blue-400" />
      default:
        return null
    }
  }

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'organizer':
        return (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 text-xs">
            Organizer
          </Badge>
        )
      case 'moderator':
        return (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
            Moderator
          </Badge>
        )
      default:
        return null
    }
  }

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = message.senderId === currentUserId
    const isSystemMessage = message.messageType === 'system'
    const isAnnouncement = message.messageType === 'announcement'

    if (isSystemMessage) {
      return (
        <div key={message.id} className="flex justify-center my-2">
          <div className="bg-gray-700/50 text-gray-300 text-xs px-3 py-1 rounded-full">
            {message.message}
          </div>
        </div>
      )
    }

    if (isAnnouncement) {
      return (
        <div key={message.id} className="my-3">
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">Tournament Announcement</span>
            </div>
            <p className="text-sm text-white">{message.message}</p>
            <p className="text-xs text-gray-400 mt-1">{formatTime(message.timestamp)}</p>
          </div>
        </div>
      )
    }

    return (
      <div
        key={message.id}
        className={cn('flex space-x-2 mb-3', isOwnMessage && 'flex-row-reverse space-x-reverse')}
      >
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.senderAvatar} alt={message.senderName} />
          <AvatarFallback className="text-xs">
            {message.senderName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className={cn('flex-1 max-w-[80%]', isOwnMessage && 'flex flex-col items-end')}>
          <div
            className={cn(
              'flex items-center space-x-2 mb-1',
              isOwnMessage && 'flex-row-reverse space-x-reverse'
            )}
          >
            <span className="text-sm font-medium text-white">{message.senderName}</span>
            {getRoleIcon(message.senderRole)}
            {getRoleBadge(message.senderRole)}
            <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
          </div>

          <div
            className={cn(
              'rounded-lg px-3 py-2 text-sm',
              isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'
            )}
          >
            <p className="break-words">{message.message}</p>
            {message.isEdited && <span className="text-xs opacity-70 italic">(edited)</span>}
          </div>

          {!isOwnMessage && onReportMessage && (
            <TouchButton
              variant="ghost"
              size="sm"
              className="mt-1 h-6 px-2 text-xs text-gray-400 hover:text-red-400"
              onClick={() => onReportMessage(message.id)}
            >
              <Flag className="w-3 h-3 mr-1" />
              Report
            </TouchButton>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('bg-white/5 backdrop-blur-lg border-white/10 flex flex-col', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Tournament Chat
          </div>
          <div className="flex items-center space-x-2">
            <TouchButton
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className={cn('h-8 w-8 p-0', isMuted ? 'text-red-400' : 'text-gray-400')}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </TouchButton>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
              <Users className="w-3 h-3 mr-1" />
              {messages.filter(m => m.messageType !== 'system').length > 0
                ? new Set(messages.filter(m => m.messageType !== 'system').map(m => m.senderId))
                    .size
                : 0}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4 max-h-96">
          <div className="space-y-1">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map(renderMessage)
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/10">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              maxLength={500}
              disabled={isSending}
            />

            <TouchButton
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4"
            >
              <Send className="w-4 h-4" />
            </TouchButton>
          </div>

          <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
            <span>Press Enter to send</span>
            <span>{newMessage.length}/500</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TournamentChat
