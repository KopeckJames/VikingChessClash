import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { MonitoringDashboard } from '@/components/admin/monitoring-dashboard'
import { PerformanceAnalytics } from '@/components/admin/performance-analytics'
import {
  AlertTriangle,
  CheckCircle,
  Bell,
  BellOff,
  Settings,
  Activity,
  BarChart3,
  Shield,
  Users,
} from 'lucide-react'
import { alertManager, notificationManager, Alert as AlertType } from '@/lib/alerting'

const AdminMonitoringPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertType[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Subscribe to alerts
    const unsubscribe = alertManager.subscribe(alert => {
      setAlerts(prev => [alert, ...prev.slice(0, 49)]) // Keep last 50 alerts

      // Show browser notification for critical alerts
      if (alert.type === 'critical' && notificationsEnabled) {
        notificationManager.showNotification(alert)
      }
    })

    // Load existing alerts
    setAlerts(alertManager.getAlerts({ limit: 50 }))

    // Check notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }

    return unsubscribe
  }, [notificationsEnabled])

  const handleEnableNotifications = async () => {
    const granted = await notificationManager.requestPermission()
    setNotificationsEnabled(granted)
  }

  const handleAcknowledgeAlert = (alertId: string) => {
    alertManager.acknowledgeAlert(alertId, 'admin-user')
    setAlerts(prev =>
      prev.map(alert => (alert.id === alertId ? { ...alert, acknowledged: true } : alert))
    )
  }

  const handleResolveAlert = (alertId: string) => {
    alertManager.resolveAlert(alertId, 'admin-user')
    setAlerts(prev =>
      prev.map(alert => (alert.id === alertId ? { ...alert, resolved: true } : alert))
    )
  }

  const getAlertIcon = (type: AlertType['type']) => {
    switch (type) {
      case 'critical':
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getAlertVariant = (type: AlertType['type']) => {
    switch (type) {
      case 'critical':
      case 'error':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const activeAlerts = alerts.filter(alert => !alert.resolved)
  const criticalAlerts = activeAlerts.filter(alert => alert.type === 'critical')

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600">Monitor system health, performance, and user activity</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={notificationsEnabled ? 'default' : 'outline'}
            onClick={handleEnableNotifications}
            disabled={notificationsEnabled}
          >
            {notificationsEnabled ? (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Notifications On
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4 mr-2" />
                Enable Notifications
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      {activeAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Critical Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{criticalAlerts.length}</div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{activeAlerts.length}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">
                Total Alerts (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{alerts.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Alerts */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest system alerts requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activeAlerts.slice(0, 10).map(alert => (
                <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <AlertTitle className="text-sm">{alert.title}</AlertTitle>
                        <AlertDescription className="text-xs">{alert.message}</AlertDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {alert.source}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Ack
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Monitoring Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <MonitoringDashboard />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceAnalytics />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Monitoring</CardTitle>
              <CardDescription>Security events and threat detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Security monitoring features coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>User behavior and engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                User analytics features coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminMonitoringPage
