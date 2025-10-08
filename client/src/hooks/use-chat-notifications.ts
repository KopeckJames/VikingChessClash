import { useEffect, useCallback, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ChatNotificationOptions {
  soundEnabled?: boolean
  browserNotifications?: boolean
  toastNotifications?: boolean
  vibrationEnabled?: boolean
}

interface ChatMessage {
  id: number
  senderId: number
  senderName: string
  message: string
  createdAt: Date
}

export function useChatNotifications(currentUserId: number, options: ChatNotificationOptions = {}) {
  const {
    soundEnabled = true,
    browserNotifications = true,
    toastNotifications = true,
    vibrationEnabled = true,
  } = options

  const { toast } = useToast()
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default')

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)

      if (Notification.permission === 'default' && browserNotifications) {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission)
        })
      }
    }
  }, [browserNotifications])

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return

    try {
      // Create audio context for better mobile support
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create a simple beep sound
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (error) {
      // Fallback: try to play a system sound
      console.log('🔔 Chat notification')
    }
  }, [soundEnabled])

  // Trigger vibration
  const triggerVibration = useCallback(() => {
    if (!vibrationEnabled || !navigator.vibrate) return

    // Short vibration pattern for chat message
    navigator.vibrate([100, 50, 100])
  }, [vibrationEnabled])

  // Show browser notification
  const showBrowserNotification = useCallback(
    (message: ChatMessage) => {
      if (!browserNotifications || notificationPermission !== 'granted') return

      const notification = new Notification(`${message.senderName} in Viking Chess`, {
        body:
          message.message.length > 100
            ? message.message.substring(0, 100) + '...'
            : message.message,
        icon: '/favicon.ico',
        tag: `chat-${message.id}`,
        badge: '/favicon.ico',
        timestamp: new Date(message.createdAt).getTime(),
        requireInteraction: false,
        silent: !soundEnabled,
      })

      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      // Handle notification click
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    },
    [browserNotifications, notificationPermission, soundEnabled]
  )

  // Show toast notification
  const showToastNotification = useCallback(
    (message: ChatMessage) => {
      if (!toastNotifications) return

      toast({
        title: `💬 ${message.senderName}`,
        description:
          message.message.length > 80 ? message.message.substring(0, 80) + '...' : message.message,
        duration: 3000,
      })
    },
    [toastNotifications, toast]
  )

  // Main notification function
  const notifyNewMessage = useCallback(
    (message: ChatMessage, isChatVisible: boolean = false) => {
      // Don't notify for own messages
      if (message.senderId === currentUserId) return

      // Don't notify if chat is visible (user is actively viewing)
      if (isChatVisible) return

      // Play sound
      playNotificationSound()

      // Trigger vibration on mobile
      triggerVibration()

      // Show browser notification if page is not visible
      if (document.hidden || document.visibilityState === 'hidden') {
        showBrowserNotification(message)
      } else {
        // Show toast notification if page is visible
        showToastNotification(message)
      }
    },
    [
      currentUserId,
      playNotificationSound,
      triggerVibration,
      showBrowserNotification,
      showToastNotification,
    ]
  )

  // Check if notifications are supported
  const isNotificationSupported = 'Notification' in window
  const isVibrationSupported = 'vibrate' in navigator

  return {
    notifyNewMessage,
    notificationPermission,
    isNotificationSupported,
    isVibrationSupported,
    requestNotificationPermission: () => {
      if ('Notification' in window) {
        return Notification.requestPermission().then(permission => {
          setNotificationPermission(permission)
          return permission
        })
      }
      return Promise.resolve('denied' as NotificationPermission)
    },
  }
}
