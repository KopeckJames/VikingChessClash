import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
} from 'lucide-react'
import { WebVitalsMonitor, MobilePerformanceMonitor } from '@/lib/performance'
import { errorTracker, performanceMonitor } from '@/lib/monitoring'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  responseTime: number
  errorRate: number
  activeUsers: number
  memoryUsage: number
  cpuUsage: number
}

interface PerformanceMetrics {
  timestamp: number
  lcp: number
  fid: number
  cls: number
  fcp: number
  ttfb: number
}

interface ErrorLog {
  id: string
  timestamp: number
  level: 'error' | 'warning' | 'info'
  message: string
  stack?: string
  context?: Record<string, any>
  count: number
}

export const MonitoringDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics[]>([])
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Initialize monitoring
  useEffect(() => {
    const webVitals = new WebVitalsMonitor()
    const mobileMonitor = new MobilePerformanceMonitor()

    // Simulate fetching system health data
    const fetchSystemHealth = async () => {
      try {
        // In a real app, this would be an API call
        const mockHealth: SystemHealth = {
          status: 'healthy',
          uptime: 99.9,
          responseTime: 120,
          errorRate: 0.1,
          activeUsers: 1247,
          memoryUsage: 65,
          cpuUsage: 45,
        }

        setSystemHealth(mockHealth)
      } catch (error) {
        console.error('Failed to fetch system health:', error)
      }
    }

    // Simulate fetching performance data
    const fetchPerformanceData = () => {
      const now = Date.now()
      const mockData: PerformanceMetrics[] = Array.from({ length: 24 }, (_, i) => ({
        timestamp: now - (23 - i) * 60 * 60 * 1000,
        lcp: 1800 + Math.random() * 1000,
        fid: 50 + Math.random() * 100,
        cls: 0.05 + Math.random() * 0.1,
        fcp: 1200 + Math.random() * 800,
        ttfb: 200 + Math.random() * 400,
      }))

      setPerformanceData(mockData)
    }

    // Simulate fetching error logs
    const fetchErrorLogs = () => {
      const mockErrors: ErrorLog[] = [
        {
          id: '1',
          timestamp: Date.now() - 300000,
          level: 'error',
          message: 'WebSocket connection failed',
          context: { url: 'wss://api.example.com/ws' },
          count: 3,
        },
        {
          id: '2',
          timestamp: Date.now() - 600000,
          level: 'warning',
          message: 'Slow API response detected',
          context: { endpoint: '/api/games', responseTime: 3500 },
          count: 1,
        },
        {
          id: '3',
          timestamp: Date.now() - 900000,
          level: 'error',
          message: 'Game state synchronization error',
          context: { gameId: 'game_123', playerId: 'user_456' },
          count: 2,
        },
      ]

      setErrorLogs(mockErrors)
    }

    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchSystemHealth(), fetchPerformanceData(), fetchErrorLogs()])
      setIsLoading(false)
      setLastUpdate(new Date())
    }

    loadData()

    // Set up auto-refresh
    const interval = setInterval(loadData, 30000) // Refresh every 30 seconds

    return () => {
      clearInterval(interval)
      webVitals.disconnect()
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'critical':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const exportData = () => {
    const data = {
      systemHealth,
      performanceData,
      errorLogs,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monitoring-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading monitoring data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600">Last updated: {lastUpdate.toLocaleTimeString()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              {getStatusIcon(systemHealth.status)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant={systemHealth.status === 'healthy' ? 'default' : 'destructive'}>
                  {systemHealth.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">Uptime: {systemHealth.uptime}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.responseTime}ms</div>
              <p className="text-xs text-gray-600">Average response time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.activeUsers.toLocaleString()}</div>
              <p className="text-xs text-gray-600">Currently online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.errorRate}%</div>
              <p className="text-xs text-gray-600">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resource Usage */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Memory Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Used</span>
                  <span>{systemHealth.memoryUsage}%</span>
                </div>
                <Progress value={systemHealth.memoryUsage} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CPU Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Used</span>
                  <span>{systemHealth.cpuUsage}%</span>
                </div>
                <Progress value={systemHealth.cpuUsage} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Monitoring */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Web Vitals Performance</CardTitle>
              <CardDescription>Core Web Vitals metrics over the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} />
                    <YAxis />
                    <Tooltip labelFormatter={value => new Date(value).toLocaleString()} />
                    <Line type="monotone" dataKey="lcp" stroke="#8884d8" name="LCP (ms)" />
                    <Line type="monotone" dataKey="fid" stroke="#82ca9d" name="FID (ms)" />
                    <Line type="monotone" dataKey="fcp" stroke="#ffc658" name="FCP (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Error Logs</CardTitle>
              <CardDescription>Latest errors and warnings from the application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errorLogs.map(error => (
                  <Alert
                    key={error.id}
                    variant={error.level === 'error' ? 'destructive' : 'default'}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="flex items-center justify-between">
                      <span>{error.message}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Count: {error.count}</Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(error.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </AlertTitle>
                    {error.context && (
                      <AlertDescription>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(error.context, null, 2)}
                        </pre>
                      </AlertDescription>
                    )}
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Behavior</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Game Sessions', value: 1247 },
                        { name: 'Tournament Joins', value: 342 },
                        { name: 'Profile Views', value: 856 },
                        { name: 'Chat Messages', value: 2341 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Mobile', value: 65, fill: '#8884d8' },
                          { name: 'Desktop', value: 30, fill: '#82ca9d' },
                          { name: 'Tablet', value: 5, fill: '#ffc658' },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      ></Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
