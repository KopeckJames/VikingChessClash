import React from 'react'
import { Wifi, WifiOff, Loader2, Signal, SignalHigh, SignalLow, SignalMedium } from 'lucide-react'
import { useConnectionStatus } from '../hooks/use-connection-status'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface ConnectionStatusProps {
  showDetails?: boolean
  className?: string
}

export function ConnectionStatus({ showDetails = false, className = '' }: ConnectionStatusProps) {
  const {
    isOnline,
    isConnecting,
    lastOnline,
    connectionType,
    effectiveType,
    downlink,
    rtt,
    testConnection,
  } = useConnectionStatus()

  const getSignalIcon = () => {
    if (isConnecting) return <Loader2 className="h-4 w-4 animate-spin" />
    if (!isOnline) return <WifiOff className="h-4 w-4" />

    // Show signal strength based on connection quality
    if (effectiveType === 'slow-2g' || effectiveType === '2g' || rtt > 1000) {
      return <SignalLow className="h-4 w-4" />
    } else if (effectiveType === '3g' || rtt > 500) {
      return <SignalMedium className="h-4 w-4" />
    } else {
      return <SignalHigh className="h-4 w-4" />
    }
  }

  const getStatusColor = () => {
    if (isConnecting) return 'bg-yellow-500'
    if (!isOnline) return 'bg-red-500'

    if (effectiveType === 'slow-2g' || effectiveType === '2g' || rtt > 1000) {
      return 'bg-orange-500'
    } else if (effectiveType === '3g' || rtt > 500) {
      return 'bg-yellow-500'
    } else {
      return 'bg-green-500'
    }
  }

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...'
    if (!isOnline) return 'Offline'

    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'Slow Connection'
    } else if (effectiveType === '3g') {
      return 'Moderate Connection'
    } else if (effectiveType === '4g') {
      return 'Fast Connection'
    } else {
      return 'Online'
    }
  }

  const formatLastOnline = () => {
    if (!lastOnline) return 'Never'

    const now = new Date()
    const diff = now.getTime() - lastOnline.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const connectionDetails = (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span>Status:</span>
        <span className={isOnline ? 'text-green-600' : 'text-red-600'}>{getStatusText()}</span>
      </div>
      {connectionType !== 'unknown' && (
        <div className="flex justify-between">
          <span>Type:</span>
          <span className="capitalize">{connectionType}</span>
        </div>
      )}
      {effectiveType !== 'unknown' && (
        <div className="flex justify-between">
          <span>Speed:</span>
          <span className="uppercase">{effectiveType}</span>
        </div>
      )}
      {downlink > 0 && (
        <div className="flex justify-between">
          <span>Bandwidth:</span>
          <span>{downlink} Mbps</span>
        </div>
      )}
      {rtt > 0 && (
        <div className="flex justify-between">
          <span>Latency:</span>
          <span>{rtt}ms</span>
        </div>
      )}
      <div className="flex justify-between">
        <span>Last Online:</span>
        <span>{formatLastOnline()}</span>
      </div>
      {!isOnline && (
        <Button
          size="sm"
          variant="outline"
          onClick={testConnection}
          disabled={isConnecting}
          className="w-full mt-2"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Wifi className="h-3 w-3 mr-2" />
              Test Connection
            </>
          )}
        </Button>
      )}
    </div>
  )

  if (showDetails) {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          {getSignalIcon()}
          <span className="font-medium">{getStatusText()}</span>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        </div>
        {connectionDetails}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={isOnline ? 'default' : 'destructive'}
            className={`flex items-center gap-1 cursor-help ${className}`}
          >
            {getSignalIcon()}
            <span className="hidden sm:inline">{getStatusText()}</span>
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-64">
          {connectionDetails}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Compact version for mobile
export function ConnectionStatusCompact({ className = '' }: { className?: string }) {
  const { isOnline, isConnecting } = useConnectionStatus()

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {isConnecting ? (
        <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
      ) : isOnline ? (
        <Wifi className="h-3 w-3 text-green-500" />
      ) : (
        <WifiOff className="h-3 w-3 text-red-500" />
      )}
    </div>
  )
}
