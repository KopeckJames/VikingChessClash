export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: any
  actions?: NotificationAction[]
  requireInteraction?: boolean
  silent?: boolean
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export type NotificationType =
  | 'game_move'
  | 'game_invitation'
  | 'game_completed'
  | 'tournament_start'
  | 'tournament_round'
  | 'friend_online'
  | 'achievement_unlocked'
  | 'system_message'

export interface GameNotificationData {
  gameId: string
  opponentName: string
  gameType: 'multiplayer' | 'tournament'
}

export interface TournamentNotificationData {
  tournamentId: string
  tournamentName: string
  round?: number
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null
  private vapidPublicKey =
    'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIUHI-lzKkMpgF6j62dO-hiqll1XFHQJd3P3YkPGmSh4sQVgxUEcE' // Replace with your VAPID key

  async init(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported')
      return false
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', this.registration)

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready

      return true
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return false
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported')
    }

    let permission = Notification.permission

    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    return permission
  }

  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.registration) {
      throw new Error('Service Worker not registered')
    }

    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notification permission denied')
    }

    try {
      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription()

      if (!this.subscription) {
        // Create new subscription
        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
        })
      }

      const subscriptionData: PushSubscriptionData = {
        endpoint: this.subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(this.subscription.getKey('auth')!),
        },
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(subscriptionData)

      return subscriptionData
    } catch (error) {
      console.error('Push subscription failed:', error)
      throw error
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true
    }

    try {
      const success = await this.subscription.unsubscribe()
      if (success) {
        // Remove subscription from server
        await this.removeSubscriptionFromServer()
        this.subscription = null
      }
      return success
    } catch (error) {
      console.error('Push unsubscribe failed:', error)
      return false
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null
    }

    return await this.registration.pushManager.getSubscription()
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission
  }

  // Show local notification (for testing or immediate notifications)
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted')
    }

    if (!this.registration) {
      // Fallback to browser notification
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/generated-icon.png',
        badge: payload.badge || '/generated-icon.png',
        image: payload.image,
        tag: payload.tag,
        data: payload.data,
        requireInteraction: payload.requireInteraction,
        silent: payload.silent,
      })
      return
    }

    // Use service worker notification
    await this.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/generated-icon.png',
      badge: payload.badge || '/generated-icon.png',
      image: payload.image,
      tag: payload.tag,
      data: payload.data,
      actions: payload.actions,
      requireInteraction: payload.requireInteraction,
      silent: payload.silent,
    })
  }

  // Send test notification
  async sendTestNotification(): Promise<void> {
    await this.showLocalNotification({
      title: 'Viking Chess',
      body: 'Push notifications are working!',
      icon: '/generated-icon.png',
      tag: 'test-notification',
    })
  }

  private async sendSubscriptionToServer(subscription: PushSubscriptionData): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      })

      if (!response.ok) {
        throw new Error('Failed to send subscription to server')
      }
    } catch (error) {
      console.error('Failed to send subscription to server:', error)
      // Don't throw here - subscription can still work locally
    }
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server')
      }
    } catch (error) {
      console.error('Failed to remove subscription from server:', error)
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService()

// Notification templates
export const NotificationTemplates = {
  gameMove: (opponentName: string, gameId: string): NotificationPayload => ({
    title: 'Your Turn!',
    body: `${opponentName} has made their move in Viking Chess`,
    icon: '/generated-icon.png',
    tag: `game-move-${gameId}`,
    data: { type: 'game_move', gameId },
    actions: [
      { action: 'view-game', title: 'View Game', icon: '/generated-icon.png' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: true,
  }),

  gameInvitation: (opponentName: string, gameId: string): NotificationPayload => ({
    title: 'Game Invitation',
    body: `${opponentName} has invited you to play Viking Chess`,
    icon: '/generated-icon.png',
    tag: `game-invitation-${gameId}`,
    data: { type: 'game_invitation', gameId },
    actions: [
      { action: 'accept-game', title: 'Accept', icon: '/generated-icon.png' },
      { action: 'decline-game', title: 'Decline' },
    ],
    requireInteraction: true,
  }),

  gameCompleted: (
    result: 'win' | 'loss' | 'draw',
    opponentName: string,
    gameId: string
  ): NotificationPayload => ({
    title: result === 'win' ? 'Victory!' : result === 'loss' ? 'Defeat' : 'Draw',
    body: `Game against ${opponentName} has ended`,
    icon: '/generated-icon.png',
    tag: `game-completed-${gameId}`,
    data: { type: 'game_completed', gameId, result },
    actions: [
      { action: 'view-game', title: 'View Game', icon: '/generated-icon.png' },
      { action: 'rematch', title: 'Rematch' },
    ],
  }),

  tournamentStart: (tournamentName: string, tournamentId: string): NotificationPayload => ({
    title: 'Tournament Starting',
    body: `${tournamentName} is about to begin!`,
    icon: '/generated-icon.png',
    tag: `tournament-start-${tournamentId}`,
    data: { type: 'tournament_start', tournamentId },
    actions: [{ action: 'view-tournament', title: 'View Tournament', icon: '/generated-icon.png' }],
    requireInteraction: true,
  }),

  tournamentRound: (
    tournamentName: string,
    round: number,
    tournamentId: string
  ): NotificationPayload => ({
    title: 'Tournament Round',
    body: `Round ${round} of ${tournamentName} is ready`,
    icon: '/generated-icon.png',
    tag: `tournament-round-${tournamentId}-${round}`,
    data: { type: 'tournament_round', tournamentId, round },
    actions: [{ action: 'view-tournament', title: 'View Tournament', icon: '/generated-icon.png' }],
  }),

  friendOnline: (friendName: string): NotificationPayload => ({
    title: 'Friend Online',
    body: `${friendName} is now online`,
    icon: '/generated-icon.png',
    tag: `friend-online-${friendName}`,
    data: { type: 'friend_online', friendName },
    silent: true,
  }),

  achievementUnlocked: (achievementName: string, description: string): NotificationPayload => ({
    title: 'Achievement Unlocked!',
    body: `${achievementName}: ${description}`,
    icon: '/generated-icon.png',
    tag: `achievement-${achievementName}`,
    data: { type: 'achievement_unlocked', achievementName },
    actions: [
      { action: 'view-achievements', title: 'View Achievements', icon: '/generated-icon.png' },
    ],
  }),
}
