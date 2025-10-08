import { useEffect, useState } from 'react'
import { pushNotificationService } from '../lib/push-notifications'
import { offlineGameStore } from '../lib/offline-store'

export function usePWAInit() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializePWA = async () => {
      try {
        // Initialize offline game store
        await offlineGameStore.init()
        console.log('Offline game store initialized')

        // Initialize push notification service (don't throw on failure)
        try {
          const pushSupported = pushNotificationService.isSupported()
          if (pushSupported) {
            await pushNotificationService.init()
            console.log('Push notification service initialized')
          }
        } catch (pushError) {
          console.warn('Push notifications not available:', pushError)
          // Don't fail PWA init if push notifications fail
        }

        // Register service worker update listener
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'NAVIGATE') {
              // Handle navigation messages from service worker
              window.location.href = event.data.url
            }
          })

          // Listen for service worker updates
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service worker updated, reloading page...')
            window.location.reload()
          })
        }

        setIsInitialized(true)
      } catch (error) {
        console.error('PWA initialization failed:', error)
        setError(error instanceof Error ? error.message : 'PWA initialization failed')
      }
    }

    initializePWA()
  }, [])

  return { isInitialized, error }
}

// Hook for handling PWA updates
export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        setUpdateAvailable(true)
      }
    }

    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        handleUpdate(registration)

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true)
              }
            })
          }
        })
      }
    })
  }, [])

  const applyUpdate = async () => {
    if (!('serviceWorker' in navigator)) return

    setIsUpdating(true)

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })

        // Wait for the new service worker to take control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })
      }
    } catch (error) {
      console.error('Failed to apply update:', error)
      setIsUpdating(false)
    }
  }

  return { updateAvailable, isUpdating, applyUpdate }
}
