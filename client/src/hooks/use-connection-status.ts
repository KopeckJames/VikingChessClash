import { useState, useEffect } from 'react'

export interface ConnectionStatus {
  isOnline: boolean
  isConnecting: boolean
  lastOnline: Date | null
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown'
  downlink: number
  rtt: number
}

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(() => ({
    isOnline: navigator.onLine,
    isConnecting: false,
    lastOnline: navigator.onLine ? new Date() : null,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
  }))

  useEffect(() => {
    const updateConnectionInfo = () => {
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection

      setStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        lastOnline: navigator.onLine ? new Date() : prev.lastOnline,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
      }))
    }

    const handleOnline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        isConnecting: false,
        lastOnline: new Date(),
      }))
    }

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnecting: false,
      }))
    }

    const handleConnectionChange = () => {
      updateConnectionInfo()
    }

    // Initial connection info
    updateConnectionInfo()

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)

      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [])

  // Test connection with a lightweight request
  const testConnection = async (): Promise<boolean> => {
    if (!navigator.onLine) return false

    setStatus(prev => ({ ...prev, isConnecting: true }))

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      })

      clearTimeout(timeoutId)

      const isConnected = response.ok

      setStatus(prev => ({
        ...prev,
        isOnline: isConnected,
        isConnecting: false,
        lastOnline: isConnected ? new Date() : prev.lastOnline,
      }))

      return isConnected
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnecting: false,
      }))
      return false
    }
  }

  return {
    ...status,
    testConnection,
  }
}

// Hook for simple online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
