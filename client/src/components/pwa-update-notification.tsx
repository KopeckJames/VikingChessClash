import React from 'react'
import { RefreshCw, Download } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { usePWAUpdate } from '../hooks/use-pwa-init'

export function PWAUpdateNotification() {
  const { updateAvailable, isUpdating, applyUpdate } = usePWAUpdate()

  if (!updateAvailable) {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Update Available
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              A new version of Viking Chess is ready to install.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={applyUpdate}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Update Now
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
                className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
