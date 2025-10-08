import { Switch, Route } from 'wouter'
import { queryClient } from './lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { AccessibleLayout } from '@/components/layout/accessible-layout'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { PWAUpdateNotification } from '@/components/pwa-update-notification'
import { usePWAInit } from '@/hooks/use-pwa-init'
import { initializeMonitoring } from '@/lib/monitoring'
import { initializePerformanceMonitoring } from '@/lib/performance'
import { useEffect } from 'react'
import Home from '@/pages/home'
import Auth from '@/pages/auth'
import Lobby from '@/pages/lobby'
import Game from '@/pages/game-simple'
import Leaderboard from '@/pages/leaderboard'
import Learning from '@/pages/learning'
import AdminMonitoring from '@/pages/admin/monitoring'
import NotFound from '@/pages/not-found'

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/lobby" component={Lobby} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/learning" component={Learning} />
      <Route path="/game/:id" component={Game} />
      <Route path="/admin/monitoring" component={AdminMonitoring} />
      <Route component={NotFound} />
    </Switch>
  )
}

function App() {
  const { isInitialized, error } = usePWAInit()

  // Initialize monitoring and performance tracking
  useEffect(() => {
    initializeMonitoring()
    initializePerformanceMonitoring()
  }, [])

  if (error) {
    console.error('PWA initialization error:', error)
    // Continue anyway - PWA features are optional
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="viking-chess-theme">
        <TooltipProvider>
          <AccessibleLayout>
            <PWAInstallPrompt />
            <PWAUpdateNotification />
            <Toaster />
            <Router />
          </AccessibleLayout>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
