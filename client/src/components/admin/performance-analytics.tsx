import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
} from 'lucide-react'

interface PerformanceData {
  timestamp: number
  lcp: number
  fid: number
  cls: number
  fcp: number
  ttfb: number
  deviceType: 'mobile' | 'desktop' | 'tablet'
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi'
  pageUrl: string
  userId?: string
}

interface PerformanceMetrics {
  metric: string
  current: number
  previous: number
  change: number
  trend: 'up' | 'down' | 'stable'
  rating: 'good' | 'needs-improvement' | 'poor'
}

export const PerformanceAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'mobile' | 'desktop' | 'tablet'>('all')
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPerformanceData = async () => {
      setIsLoading(true)

      // Simulate API call - in real app, this would fetch from your analytics endpoint
      const mockData: PerformanceData[] = Array.from({ length: 100 }, (_, i) => {
        const timestamp = Date.now() - (99 - i) * 60 * 60 * 1000 // Last 100 hours
        const deviceTypes: ('mobile' | 'desktop' | 'tablet')[] = ['mobile', 'desktop', 'tablet']
        const connectionTypes: ('slow-2g' | '2g' | '3g' | '4g' | 'wifi')[] = [
          'slow-2g',
          '2g',
          '3g',
          '4g',
          'wifi',
        ]

        return {
          timestamp,
          lcp: 1500 + Math.random() * 2000,
          fid: 20 + Math.random() * 200,
          cls: Math.random() * 0.3,
          fcp: 800 + Math.random() * 1200,
          ttfb: 100 + Math.random() * 500,
          deviceType: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
          connectionType: connectionTypes[Math.floor(Math.random() * connectionTypes.length)],
          pageUrl: ['/game', '/lobby', '/leaderboard', '/profile'][Math.floor(Math.random() * 4)],
        }
      })

      setPerformanceData(mockData)

      // Calculate metrics
      const currentPeriod = mockData.slice(-24) // Last 24 hours
      const previousPeriod = mockData.slice(-48, -24) // Previous 24 hours

      const calculateAverage = (data: PerformanceData[], key: keyof PerformanceData) => {
        const values = data.map(d => d[key] as number).filter(v => typeof v === 'number')
        return values.reduce((sum, val) => sum + val, 0) / values.length
      }

      const mockMetrics: PerformanceMetrics[] = [
        {
          metric: 'LCP',
          current: calculateAverage(currentPeriod, 'lcp'),
          previous: calculateAverage(previousPeriod, 'lcp'),
          change: 0,
          trend: 'stable',
          rating: 'good',
        },
        {
          metric: 'FID',
          current: calculateAverage(currentPeriod, 'fid'),
          previous: calculateAverage(previousPeriod, 'fid'),
          change: 0,
          trend: 'stable',
          rating: 'good',
        },
        {
          metric: 'CLS',
          current: calculateAverage(currentPeriod, 'cls'),
          previous: calculateAverage(previousPeriod, 'cls'),
          change: 0,
          trend: 'stable',
          rating: 'good',
        },
        {
          metric: 'FCP',
          current: calculateAverage(currentPeriod, 'fcp'),
          previous: calculateAverage(previousPeriod, 'fcp'),
          change: 0,
          trend: 'stable',
          rating: 'good',
        },
      ]

      // Calculate changes and trends
      mockMetrics.forEach(metric => {
        metric.change = ((metric.current - metric.previous) / metric.previous) * 100
        metric.trend = metric.change > 5 ? 'up' : metric.change < -5 ? 'down' : 'stable'

        // Determine rating based on Web Vitals thresholds
        switch (metric.metric) {
          case 'LCP':
            metric.rating =
              metric.current <= 2500
                ? 'good'
                : metric.current <= 4000
                  ? 'needs-improvement'
                  : 'poor'
            break
          case 'FID':
            metric.rating =
              metric.current <= 100 ? 'good' : metric.current <= 300 ? 'needs-improvement' : 'poor'
            break
          case 'CLS':
            metric.rating =
              metric.current <= 0.1 ? 'good' : metric.current <= 0.25 ? 'needs-improvement' : 'poor'
            break
          case 'FCP':
            metric.rating =
              metric.current <= 1800
                ? 'good'
                : metric.current <= 3000
                  ? 'needs-improvement'
                  : 'poor'
            break
        }
      })

      setMetrics(mockMetrics)
      setIsLoading(false)
    }

    fetchPerformanceData()
  }, [timeRange, deviceFilter])

  const filteredData = performanceData.filter(data => {
    if (deviceFilter === 'all') return true
    return data.deviceType === deviceFilter
  })

  const formatValue = (metric: string, value: number) => {
    switch (metric) {
      case 'CLS':
        return value.toFixed(3)
      case 'LCP':
      case 'FID':
      case 'FCP':
        return `${Math.round(value)}ms`
      default:
        return Math.round(value).toString()
    }
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-600 bg-green-100'
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100'
      case 'poor':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') {
      return <TrendingUp className="h-4 w-4 text-red-500" />
    } else if (trend === 'down') {
      return <TrendingDown className="h-4 w-4 text-green-500" />
    }
    return <div className="h-4 w-4" />
  }

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'desktop':
        return <Monitor className="h-4 w-4" />
      case 'tablet':
        return <Tablet className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading performance analytics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Analytics</h2>
          <p className="text-gray-600">Web Vitals and user experience metrics</p>
        </div>

        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={deviceFilter} onValueChange={(value: any) => setDeviceFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(metric => (
          <Card key={metric.metric}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.metric}</CardTitle>
              {getTrendIcon(metric.trend, metric.change)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatValue(metric.metric, metric.current)}</div>
              <div className="flex items-center justify-between mt-2">
                <Badge className={getRatingColor(metric.rating)}>
                  {metric.rating.replace('-', ' ')}
                </Badge>
                <span
                  className={`text-xs ${
                    metric.change > 0
                      ? 'text-red-600'
                      : metric.change < 0
                        ? 'text-green-600'
                        : 'text-gray-600'
                  }`}
                >
                  {metric.change > 0 ? '+' : ''}
                  {metric.change.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Core Web Vitals Trends</CardTitle>
            <CardDescription>Performance metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData.slice(-24)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={value => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={value => new Date(value).toLocaleString()}
                    formatter={(value: number, name: string) => [
                      formatValue(name.toUpperCase(), value),
                      name.toUpperCase(),
                    ]}
                  />
                  <Line type="monotone" dataKey="lcp" stroke="#8884d8" name="lcp" />
                  <Line type="monotone" dataKey="fid" stroke="#82ca9d" name="fid" />
                  <Line type="monotone" dataKey="fcp" stroke="#ffc658" name="fcp" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance by Device Type</CardTitle>
            <CardDescription>Average metrics across device categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      device: 'Mobile',
                      lcp:
                        filteredData
                          .filter(d => d.deviceType === 'mobile')
                          .reduce((sum, d) => sum + d.lcp, 0) /
                          filteredData.filter(d => d.deviceType === 'mobile').length || 0,
                      fid:
                        filteredData
                          .filter(d => d.deviceType === 'mobile')
                          .reduce((sum, d) => sum + d.fid, 0) /
                          filteredData.filter(d => d.deviceType === 'mobile').length || 0,
                    },
                    {
                      device: 'Desktop',
                      lcp:
                        filteredData
                          .filter(d => d.deviceType === 'desktop')
                          .reduce((sum, d) => sum + d.lcp, 0) /
                          filteredData.filter(d => d.deviceType === 'desktop').length || 0,
                      fid:
                        filteredData
                          .filter(d => d.deviceType === 'desktop')
                          .reduce((sum, d) => sum + d.fid, 0) /
                          filteredData.filter(d => d.deviceType === 'desktop').length || 0,
                    },
                    {
                      device: 'Tablet',
                      lcp:
                        filteredData
                          .filter(d => d.deviceType === 'tablet')
                          .reduce((sum, d) => sum + d.lcp, 0) /
                          filteredData.filter(d => d.deviceType === 'tablet').length || 0,
                      fid:
                        filteredData
                          .filter(d => d.deviceType === 'tablet')
                          .reduce((sum, d) => sum + d.fid, 0) /
                          filteredData.filter(d => d.deviceType === 'tablet').length || 0,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="device" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${Math.round(value)}ms`,
                      name.toUpperCase(),
                    ]}
                  />
                  <Bar dataKey="lcp" fill="#8884d8" name="lcp" />
                  <Bar dataKey="fid" fill="#82ca9d" name="fid" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Score Distribution</CardTitle>
          <CardDescription>Distribution of Core Web Vitals scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={filteredData.slice(-50)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="lcp" name="LCP" unit="ms" domain={['dataMin', 'dataMax']} />
                <YAxis dataKey="fid" name="FID" unit="ms" domain={['dataMin', 'dataMax']} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value: number, name: string) => [
                    `${Math.round(value)}ms`,
                    name === 'lcp' ? 'LCP' : 'FID',
                  ]}
                />
                <Scatter dataKey="fid" fill="#8884d8" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Recommendations</CardTitle>
          <CardDescription>Suggestions to improve user experience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics
              .filter(m => m.rating !== 'good')
              .map(metric => (
                <div
                  key={metric.metric}
                  className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg"
                >
                  <div className="flex-shrink-0 mt-1">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-yellow-800">
                      Improve {metric.metric} Performance
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      {metric.metric === 'LCP' &&
                        'Consider optimizing images, reducing server response times, and implementing resource preloading.'}
                      {metric.metric === 'FID' &&
                        'Reduce JavaScript execution time, break up long tasks, and optimize event handlers.'}
                      {metric.metric === 'CLS' &&
                        'Add size attributes to images, avoid inserting content above existing content, and use CSS transforms.'}
                      {metric.metric === 'FCP' &&
                        'Optimize critical rendering path, reduce render-blocking resources, and improve server response times.'}
                    </p>
                  </div>
                </div>
              ))}

            {metrics.every(m => m.rating === 'good') && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="flex-shrink-0">
                  <Zap className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-green-800">Excellent Performance!</h4>
                  <p className="text-sm text-green-700">
                    All Core Web Vitals metrics are meeting the recommended thresholds.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
