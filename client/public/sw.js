// Service Worker for Viking Chess PWA
const CACHE_NAME = 'viking-chess-v1'
const OFFLINE_URL = '/offline.html'

// Files to cache for offline functionality
const STATIC_CACHE_URLS = ['/', '/offline.html', '/generated-icon.png', '/manifest.json']

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...')

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static resources')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...')

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        // Ensure the service worker takes control of all pages immediately
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse
      }

      // Try to fetch from network
      return fetch(event.request)
        .then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone the response for caching
          const responseToCache = response.clone()

          // Cache the response for future use
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // If network fails and we're requesting a page, show offline page
          if (event.request.destination === 'document') {
            return caches.match(OFFLINE_URL)
          }

          // For other resources, just fail
          throw new Error('Network unavailable and resource not cached')
        })
    })
  )
})

// Push event - handle push notifications
self.addEventListener('push', event => {
  console.log('Push notification received:', event)

  let notificationData = {
    title: 'Viking Chess',
    body: 'You have a new notification',
    icon: '/generated-icon.png',
    badge: '/generated-icon.png',
    tag: 'default',
    data: {},
  }

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json()
      notificationData = { ...notificationData, ...pushData }
    } catch (error) {
      console.error('Error parsing push data:', error)
      notificationData.body = event.data.text() || notificationData.body
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    image: notificationData.image,
    tag: notificationData.tag,
    data: notificationData.data,
    actions: notificationData.actions || [],
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    vibrate: notificationData.vibrate || [200, 100, 200],
    timestamp: Date.now(),
  }

  event.waitUntil(self.registration.showNotification(notificationData.title, notificationOptions))
})

// Notification click event - handle notification interactions
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event)

  const notification = event.notification
  const action = event.action
  const data = notification.data || {}

  // Close the notification
  notification.close()

  // Handle different actions
  event.waitUntil(handleNotificationClick(action, data))
})

// Notification close event
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event)

  const data = event.notification.data || {}

  // Track notification dismissal if needed
  if (data.trackDismissal) {
    // Send analytics or tracking data
    fetch('/api/notifications/dismissed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: data.id, timestamp: Date.now() }),
    }).catch(console.error)
  }
})

// Handle notification click actions
async function handleNotificationClick(action, data) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

  // Find existing client or open new one
  const client = clients.find(c => c.url.includes(self.location.origin))

  let targetUrl = '/'

  // Determine target URL based on action and data
  switch (action) {
    case 'view-game':
      if (data.gameId) {
        targetUrl = `/game/${data.gameId}`
      }
      break

    case 'accept-game':
      if (data.gameId) {
        targetUrl = `/game/${data.gameId}?action=accept`
      }
      break

    case 'decline-game':
      if (data.gameId) {
        // Handle game decline - could send API request
        try {
          await fetch(`/api/games/${data.gameId}/decline`, { method: 'POST' })
        } catch (error) {
          console.error('Failed to decline game:', error)
        }
        return // Don't open window for decline
      }
      break

    case 'rematch':
      if (data.gameId) {
        targetUrl = `/game/${data.gameId}?action=rematch`
      }
      break

    case 'view-tournament':
      if (data.tournamentId) {
        targetUrl = `/tournaments/${data.tournamentId}`
      }
      break

    case 'view-achievements':
      targetUrl = '/profile?tab=achievements'
      break

    case 'dismiss':
      return // Just close notification

    default:
      // Default click (no action) - determine URL from notification type
      switch (data.type) {
        case 'game_move':
        case 'game_invitation':
        case 'game_completed':
          if (data.gameId) {
            targetUrl = `/game/${data.gameId}`
          }
          break

        case 'tournament_start':
        case 'tournament_round':
          if (data.tournamentId) {
            targetUrl = `/tournaments/${data.tournamentId}`
          }
          break

        case 'friend_online':
          targetUrl = '/friends'
          break

        case 'achievement_unlocked':
          targetUrl = '/profile?tab=achievements'
          break

        default:
          targetUrl = '/'
      }
  }

  if (client) {
    // Focus existing window and navigate
    await client.focus()
    if (client.navigate) {
      await client.navigate(targetUrl)
    } else {
      // Fallback: send message to client to navigate
      client.postMessage({
        type: 'NAVIGATE',
        url: targetUrl,
      })
    }
  } else {
    // Open new window
    await self.clients.openWindow(targetUrl)
  }
}

// Background sync event (for future use)
self.addEventListener('sync', event => {
  console.log('Background sync:', event.tag)

  if (event.tag === 'sync-game-moves') {
    event.waitUntil(syncGameMoves())
  }
})

// Sync offline game moves when connection is restored
async function syncGameMoves() {
  try {
    // This would sync any pending offline moves
    // Implementation depends on offline storage structure
    console.log('Syncing offline game moves...')

    // Example: Get pending moves from IndexedDB and send to server
    // const pendingMoves = await getPendingMoves();
    // for (const move of pendingMoves) {
    //   await fetch('/api/games/sync-move', {
    //     method: 'POST',
    //     body: JSON.stringify(move)
    //   });
    // }
  } catch (error) {
    console.error('Failed to sync game moves:', error)
  }
}

// Message event - handle messages from main thread
self.addEventListener('message', event => {
  console.log('Service Worker received message:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
  console.log('Periodic sync:', event.tag)

  if (event.tag === 'check-game-updates') {
    event.waitUntil(checkGameUpdates())
  }
})

async function checkGameUpdates() {
  try {
    // Check for game updates in the background
    const response = await fetch('/api/games/check-updates')
    const updates = await response.json()

    // Show notifications for any updates
    for (const update of updates) {
      await self.registration.showNotification(update.title, {
        body: update.body,
        icon: '/generated-icon.png',
        tag: update.tag,
        data: update.data,
      })
    }
  } catch (error) {
    console.error('Failed to check game updates:', error)
  }
}
