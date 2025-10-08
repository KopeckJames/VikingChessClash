/**
 * Real-time alerting system for monitoring critical issues
 */

export interface Alert {
  id: string
  type: 'error' | 'warning' | 'info' | 'critical'
  title: string
  message: string
  timestamp: number
  source: string
  metadata?: Record<string, any>
  acknowledged?: boolean
  resolved?: boolean
}

export interface AlertRule {
  id: string
  name: string
  condition: (data: any) => boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  cooldown: number // milliseconds
  enabled: boolean
  lastTriggered?: number
}

/**
 * Alert manager for handling system alerts
 */
export class AlertManager {
  private alerts: Map<string, Alert> = new Map()
  private rules: Map<string, AlertRule> = new Map()
  private subscribers: Set<(alert: Alert) => void> = new Set()
  private maxAlerts = 1000

  constructor() {
    this.initializeDefaultRules()
  }

  /**
   * Initialize default alerting rules
   */
  private initializeDefaultRules() {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: data => data.errorRate > 5, // 5% error rate
        severity: 'high',
        cooldown: 300000, // 5 minutes
        enabled: true,
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        condition: data => data.responseTime > 2000, // 2 seconds
        severity: 'medium',
        cooldown: 180000, // 3 minutes
        enabled: true,
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        condition: data => data.memoryUsage > 90, // 90%
        severity: 'high',
        cooldown: 600000, // 10 minutes
        enabled: true,
      },
      {
        id: 'websocket-disconnections',
        name: 'WebSocket Disconnections',
        condition: data => data.wsDisconnections > 10, // 10 disconnections per minute
        severity: 'medium',
        cooldown: 120000, // 2 minutes
        enabled: true,
      },
      {
        id: 'game-sync-errors',
        name: 'Game Synchronization Errors',
        condition: data => data.gameSyncErrors > 5, // 5 sync errors per minute
        severity: 'high',
        cooldown: 300000, // 5 minutes
        enabled: true,
      },
      {
        id: 'poor-web-vitals',
        name: 'Poor Web Vitals',
        condition: data => data.lcp > 4000 || data.fid > 300 || data.cls > 0.25,
        severity: 'medium',
        cooldown: 900000, // 15 minutes
        enabled: true,
      },
    ]

    defaultRules.forEach(rule => this.rules.set(rule.id, rule))
  }

  /**
   * Add a new alert
   */
  addAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Alert {
    const fullAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }

    this.alerts.set(fullAlert.id, fullAlert)

    // Maintain max alerts limit
    if (this.alerts.size > this.maxAlerts) {
      const oldestAlert = Array.from(this.alerts.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      )[0]
      this.alerts.delete(oldestAlert.id)
    }

    // Notify subscribers
    this.notifySubscribers(fullAlert)

    // Send to external services if configured
    this.sendToExternalServices(fullAlert)

    return fullAlert
  }

  /**
   * Check data against alert rules
   */
  checkRules(data: Record<string, any>) {
    const now = Date.now()

    this.rules.forEach(rule => {
      if (!rule.enabled) return

      // Check cooldown
      if (rule.lastTriggered && now - rule.lastTriggered < rule.cooldown) {
        return
      }

      // Evaluate condition
      try {
        if (rule.condition(data)) {
          this.triggerRule(rule, data)
          rule.lastTriggered = now
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.name}:`, error)
      }
    })
  }

  /**
   * Trigger an alert rule
   */
  private triggerRule(rule: AlertRule, data: Record<string, any>) {
    const alertType = this.severityToAlertType(rule.severity)

    this.addAlert({
      type: alertType,
      title: rule.name,
      message: this.generateAlertMessage(rule, data),
      source: 'alert-rule',
      metadata: {
        ruleId: rule.id,
        severity: rule.severity,
        data: data,
      },
    })
  }

  /**
   * Convert severity to alert type
   */
  private severityToAlertType(severity: string): Alert['type'] {
    switch (severity) {
      case 'critical':
        return 'critical'
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
        return 'info'
      default:
        return 'info'
    }
  }

  /**
   * Generate alert message based on rule and data
   */
  private generateAlertMessage(rule: AlertRule, data: Record<string, any>): string {
    switch (rule.id) {
      case 'high-error-rate':
        return `Error rate is ${data.errorRate}%, exceeding the 5% threshold`
      case 'slow-response-time':
        return `Response time is ${data.responseTime}ms, exceeding the 2000ms threshold`
      case 'high-memory-usage':
        return `Memory usage is ${data.memoryUsage}%, exceeding the 90% threshold`
      case 'websocket-disconnections':
        return `${data.wsDisconnections} WebSocket disconnections detected in the last minute`
      case 'game-sync-errors':
        return `${data.gameSyncErrors} game synchronization errors detected in the last minute`
      case 'poor-web-vitals':
        return `Poor Web Vitals detected: LCP=${data.lcp}ms, FID=${data.fid}ms, CLS=${data.cls}`
      default:
        return `Alert triggered for rule: ${rule.name}`
    }
  }

  /**
   * Subscribe to alerts
   */
  subscribe(callback: (alert: Alert) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(alert: Alert) {
    this.subscribers.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        console.error('Error notifying alert subscriber:', error)
      }
    })
  }

  /**
   * Send alert to external services
   */
  private async sendToExternalServices(alert: Alert) {
    // Send to webhook if configured
    const webhookUrl = import.meta.env.VITE_ALERT_WEBHOOK_URL
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert,
            timestamp: new Date().toISOString(),
            source: 'viking-chess-app',
          }),
        })
      } catch (error) {
        console.error('Failed to send alert to webhook:', error)
      }
    }

    // Send push notification for critical alerts
    if (alert.type === 'critical' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        registration.showNotification(`Critical Alert: ${alert.title}`, {
          body: alert.message,
          icon: '/generated-icon.png',
          badge: '/generated-icon.png',
          tag: `alert-${alert.id}`,
          requireInteraction: true,
          actions: [
            { action: 'acknowledge', title: 'Acknowledge' },
            { action: 'view', title: 'View Details' },
          ],
        })
      } catch (error) {
        console.error('Failed to send push notification:', error)
      }
    }
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, userId?: string) {
    const alert = this.alerts.get(alertId)
    if (alert) {
      alert.acknowledged = true
      alert.metadata = {
        ...alert.metadata,
        acknowledgedBy: userId,
        acknowledgedAt: Date.now(),
      }
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, userId?: string) {
    const alert = this.alerts.get(alertId)
    if (alert) {
      alert.resolved = true
      alert.metadata = {
        ...alert.metadata,
        resolvedBy: userId,
        resolvedAt: Date.now(),
      }
    }
  }

  /**
   * Get all alerts
   */
  getAlerts(filters?: {
    type?: Alert['type']
    acknowledged?: boolean
    resolved?: boolean
    limit?: number
  }): Alert[] {
    let alerts = Array.from(this.alerts.values())

    if (filters) {
      if (filters.type) {
        alerts = alerts.filter(alert => alert.type === filters.type)
      }
      if (filters.acknowledged !== undefined) {
        alerts = alerts.filter(alert => alert.acknowledged === filters.acknowledged)
      }
      if (filters.resolved !== undefined) {
        alerts = alerts.filter(alert => alert.resolved === filters.resolved)
      }
      if (filters.limit) {
        alerts = alerts.slice(0, filters.limit)
      }
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get alert statistics
   */
  getAlertStats(): {
    total: number
    byType: Record<Alert['type'], number>
    acknowledged: number
    resolved: number
    active: number
  } {
    const alerts = Array.from(this.alerts.values())

    const stats = {
      total: alerts.length,
      byType: {
        error: 0,
        warning: 0,
        info: 0,
        critical: 0,
      } as Record<Alert['type'], number>,
      acknowledged: 0,
      resolved: 0,
      active: 0,
    }

    alerts.forEach(alert => {
      stats.byType[alert.type]++
      if (alert.acknowledged) stats.acknowledged++
      if (alert.resolved) stats.resolved++
      if (!alert.resolved) stats.active++
    })

    return stats
  }

  /**
   * Add or update an alert rule
   */
  setRule(rule: AlertRule) {
    this.rules.set(rule.id, rule)
  }

  /**
   * Remove an alert rule
   */
  removeRule(ruleId: string) {
    this.rules.delete(ruleId)
  }

  /**
   * Get all alert rules
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values())
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(maxAge: number = 7 * 24 * 60 * 60 * 1000) {
    // 7 days
    const cutoff = Date.now() - maxAge

    Array.from(this.alerts.entries()).forEach(([id, alert]) => {
      if (alert.timestamp < cutoff && alert.resolved) {
        this.alerts.delete(id)
      }
    })
  }
}

/**
 * Browser notification manager
 */
export class NotificationManager {
  private permission: NotificationPermission = 'default'

  constructor() {
    this.checkPermission()
  }

  private async checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    const permission = await Notification.requestPermission()
    this.permission = permission
    return permission === 'granted'
  }

  async showNotification(alert: Alert) {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) return
    }

    const notification = new Notification(alert.title, {
      body: alert.message,
      icon: '/generated-icon.png',
      badge: '/generated-icon.png',
      tag: `alert-${alert.id}`,
      requireInteraction: alert.type === 'critical',
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
      // Navigate to monitoring dashboard
      window.location.href = '/admin/monitoring'
    }

    // Auto-close after 10 seconds for non-critical alerts
    if (alert.type !== 'critical') {
      setTimeout(() => notification.close(), 10000)
    }
  }
}

/**
 * Global alert manager instance
 */
export const alertManager = new AlertManager()
export const notificationManager = new NotificationManager()
