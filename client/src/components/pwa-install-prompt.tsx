import React, { useState, useEffect } from 'react'
import { Download, X, Smartphone, Monitor, Tablet } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown')

  useEffect(() => {
    // Check if app is already installed/running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://')
      setIsStandalone(isStandaloneMode)
    }

    // Detect platform
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setPlatform('ios')
      } else if (/android/.test(userAgent)) {
        setPlatform('android')
      } else if (/windows|macintosh|linux/.test(userAgent)) {
        setPlatform('desktop')
      }
    }

    checkStandalone()
    detectPlatform()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Check if user has previously dismissed the prompt
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)

      // Show prompt if not dismissed recently (wait 7 days)
      if (!dismissed || daysSinceDismissed > 7) {
        setShowPrompt(true)
      }
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
      }

      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('Error during installation:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  const getPlatformIcon = () => {
    switch (platform) {
      case 'ios':
        return <Smartphone className="h-5 w-5" />
      case 'android':
        return <Smartphone className="h-5 w-5" />
      case 'desktop':
        return <Monitor className="h-5 w-5" />
      default:
        return <Tablet className="h-5 w-5" />
    }
  }

  const getPlatformInstructions = () => {
    switch (platform) {
      case 'ios':
        return (
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">To install on iOS:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Tap the Share button in Safari</li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" to confirm</li>
            </ol>
          </div>
        )
      case 'android':
        return (
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Install for the best experience:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Faster loading times</li>
              <li>Offline gameplay</li>
              <li>Push notifications</li>
              <li>Full-screen experience</li>
            </ul>
          </div>
        )
      case 'desktop':
        return (
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Install as a desktop app:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Quick access from your desktop</li>
              <li>Runs in its own window</li>
              <li>Offline functionality</li>
              <li>Native app experience</li>
            </ul>
          </div>
        )
      default:
        return null
    }
  }

  // Don't show if already in standalone mode or installed
  if (isStandalone || isInstalled) {
    return null
  }

  // Show manual instructions for iOS (no beforeinstallprompt support)
  if (platform === 'ios' && !deferredPrompt) {
    return (
      <Card className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            {getPlatformIcon()}
            Install Viking Chess
            <Badge variant="secondary">iOS</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {getPlatformInstructions()}
          <Button variant="outline" size="sm" onClick={handleDismiss} className="mt-3">
            <X className="h-4 w-4 mr-2" />
            Dismiss
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show install prompt for supported browsers
  if (showPrompt && deferredPrompt) {
    return (
      <Card className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Download className="h-5 w-5" />
            Install Viking Chess
            <Badge variant="secondary" className="capitalize">
              {platform}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {getPlatformInstructions()}
          <div className="flex gap-2 mt-3">
            <Button onClick={handleInstall} size="sm" className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
            <Button variant="outline" size="sm" onClick={handleDismiss}>
              <X className="h-4 w-4 mr-2" />
              Not Now
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}

// Hook for checking PWA installation status
export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const checkInstallStatus = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://')
      setIsInstalled(isStandalone)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    checkInstallStatus()

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice

      setDeferredPrompt(null)
      setIsInstallable(false)

      return choiceResult.outcome === 'accepted'
    } catch (error) {
      console.error('Installation failed:', error)
      return false
    }
  }

  return {
    isInstallable,
    isInstalled,
    install,
  }
}
