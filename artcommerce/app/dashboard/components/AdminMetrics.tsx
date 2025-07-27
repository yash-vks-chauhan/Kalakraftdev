"use client"

import { useState, useEffect, useRef, useMemo, memo } from 'react'
import { DollarSign, Package, CheckCircle, Clock, Truck, RefreshCw, TrendingUp, AlertCircle, Users } from 'lucide-react'
import styles from './AdminMetrics.module.css'

interface AdminMetricsProps {
  token: string | null
  user: any
}

// Memoized metric icon component for performance
const MetricIcon = memo(({ metric }: { metric: string }) => {
  const getIcon = (metricType: string) => {
    switch (metricType.toLowerCase()) {
      case 'revenue': return <DollarSign size={20} className={styles.metricIcon} />
      case 'orders': return <Package size={20} className={styles.metricIcon} />
      case 'completed': return <CheckCircle size={20} className={styles.metricIcon} />
      case 'processing': return <Clock size={20} className={styles.metricIcon} />
      case 'shipped': return <Truck size={20} className={styles.metricIcon} />
      case 'trending': return <TrendingUp size={20} className={styles.metricIcon} />
      case 'alerts': return <AlertCircle size={20} className={styles.metricIcon} />
      case 'customers': return <Users size={20} className={styles.metricIcon} />
      default: return <Package size={20} className={styles.metricIcon} />
    }
  }
  
  return getIcon(metric)
})

MetricIcon.displayName = 'MetricIcon'

const MetricsSkeleton = memo(() => (
  <div className={styles.metricsRow}>
    {[...Array(3)].map((_, i) => (
      <div key={i} className={`${styles.metricCard} ${styles.skeleton}`}>
        <div className={styles.skeletonIcon} />
        <div className={styles.skeletonTextWrapper}>
          <div className={styles.skeletonText} />
          <div className={styles.skeletonValue} />
        </div>
      </div>
    ))}
  </div>
))

MetricsSkeleton.displayName = 'MetricsSkeleton'

// Smart metric selection based on context
const useContextualMetrics = (user: any) => {
  return useMemo(() => {
    const hour = new Date().getHours()
    const dayOfWeek = new Date().getDay()
    
    // Weekend metrics (focus on customer activity)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        priority: ['orders', 'customers', 'revenue'],
        showTrends: true,
        refreshInterval: 60000 // Less frequent on weekends
      }
    }
    
    // Morning metrics (overnight activity)
    if (hour >= 6 && hour < 12) {
      return {
        priority: ['orders', 'processing', 'alerts'],
        showTrends: true,
        refreshInterval: 30000
      }
    }
    
    // Afternoon metrics (active business hours)
    if (hour >= 12 && hour < 18) {
      return {
        priority: ['processing', 'shipped', 'customers'],
        showTrends: false,
        refreshInterval: 15000
      }
    }
    
    // Evening metrics (end of day summary)
    return {
      priority: ['revenue', 'completed', 'trending'],
      showTrends: true,
      refreshInterval: 45000
    }
  }, [user?.id])
}

export default function AdminMetrics({ token, user }: AdminMetricsProps) {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'today'|'week'|'month'|'year'|'all'>('week')
  const [activeMetricDot, setActiveMetricDot] = useState(0)
  const [isExpanded, setIsExpanded] = useState(true)
  const metricsRowRef = useRef<HTMLDivElement>(null)
  
  // Smart contextual metrics
  const contextualConfig = useContextualMetrics(user)

  // Enhanced insights with trends
  const insights = useMemo(() => {
    if (!metrics) return []
    
    const insights = []
    
    // Revenue trend insight
    if (metrics.revenue > 0) {
      const trend = metrics.revenueTrend || 0
      insights.push({
        type: trend > 0 ? 'positive' : 'neutral',
        icon: 'trending',
        label: 'Revenue Trend',
        value: `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`,
        description: 'vs last period'
      })
    }
    
    // Alert insight
    if (metrics.alerts > 0) {
      insights.push({
        type: 'warning',
        icon: 'alerts',
        label: 'Alerts',
        value: metrics.alerts,
        description: 'require attention'
      })
    }
    
    return insights
  }, [metrics])

  const fetchMetrics = async (p: string = period) => {
    if (user?.role !== 'admin' || !token) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/metrics?period=${p}&context=smart`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch metrics. Please try again.')
      }
      const data = await response.json()
      
      // Add mock trend data for demo
      data.revenueTrend = Math.random() * 20 - 5 // -5% to +15%
      data.alerts = Math.floor(Math.random() * 5) // 0-4 alerts
      
      setMetrics(data)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // Smart refresh with contextual intervals
  useEffect(() => {
    if (!user?.role || user.role !== 'admin') return
    
    fetchMetrics()
    
    const interval = setInterval(() => {
      fetchMetrics()
    }, contextualConfig.refreshInterval)
    
    return () => clearInterval(interval)
  }, [user, token, contextualConfig.refreshInterval])

  useEffect(() => {
    const metricsRow = metricsRowRef.current
    if (!metricsRow || loading) return

    const handleScroll = () => {
      if (metricsRow.scrollWidth === 0) return
      const totalItems = (metrics?.statusCounts?.length || 0) + insights.length + 2
      const itemWidth = metricsRow.scrollWidth / totalItems
      const scrollPosition = metricsRow.scrollLeft
      const activeIndex = Math.round(scrollPosition / itemWidth)
      setActiveMetricDot(activeIndex)
    }

    metricsRow.addEventListener('scroll', handleScroll)
    handleScroll() 
    return () => {
      metricsRow.removeEventListener('scroll', handleScroll)
    }
  }, [metrics, loading, insights])

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value as 'today'|'week'|'month'|'year'|'all'
    setPeriod(newPeriod)
    fetchMetrics(newPeriod)
  }

  const handleRetry = () => {
    fetchMetrics(period)
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  // Filter metrics based on contextual priority
  const prioritizedStatusCounts = useMemo(() => {
    if (!metrics?.statusCounts) return []
    
    return metrics.statusCounts
      .filter((sc: any) => contextualConfig.priority.includes(sc.status.toLowerCase()))
      .sort((a: any, b: any) => {
        const aIndex = contextualConfig.priority.indexOf(a.status.toLowerCase())
        const bIndex = contextualConfig.priority.indexOf(b.status.toLowerCase())
        return aIndex - bIndex
      })
  }, [metrics?.statusCounts, contextualConfig.priority])

  if (user?.role !== 'admin') return null

  return (
    <div className={`${styles.metricsSection} ${!isExpanded ? styles.collapsed : ''}`}>
      <div className={styles.sectionHeader} onClick={toggleExpanded}>
        <h2 className={styles.sectionTitle}>
          Smart Metrics
          <span className={styles.contextIndicator}>
            {contextualConfig.priority[0]} focus
          </span>
        </h2>
        <div className={styles.periodSelector}>
          <select 
            value={period} 
            onChange={handlePeriodChange} 
            className={styles.periodSelect} 
            disabled={loading}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="today">Today</option>
            <option value="week">Last 7d</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
            <option value="all">All</option>
          </select>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              fetchMetrics()
            }} 
            className={styles.refreshButton} 
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? styles.refreshing : ''} />
          </button>
        </div>
      </div>
      
      <div className={`${styles.metricsContent} ${isExpanded ? styles.expanded : ''}`}>
        {loading ? (
          <MetricsSkeleton />
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button onClick={handleRetry} className={styles.retryButton}>Retry</button>
          </div>
        ) : (
          <>
            <div className={styles.metricsScrollContainer}>
              <div className={styles.metricsRow} ref={metricsRowRef}>
                {/* Core Metrics */}
                <div className={`${styles.metricCard} ${styles.primaryMetric}`}>
                  <MetricIcon metric="revenue" />
                  <div className={styles.metricText}>
                    <h3 className={styles.metricTitle}>Revenue</h3>
                    <p className={styles.metricValue}>₹{metrics?.revenue ? metrics.revenue.toFixed(2) : '0.00'}</p>
                  </div>
                </div>
                
                <div className={`${styles.metricCard} ${styles.primaryMetric}`}>
                  <MetricIcon metric="orders" />
                  <div className={styles.metricText}>
                    <h3 className={styles.metricTitle}>Orders</h3>
                    <p className={styles.metricValue}>{metrics?.totalOrders || '0'}</p>
                  </div>
                </div>

                {/* Contextual Status Metrics */}
                {prioritizedStatusCounts.map((sc: any) => (
                  <div key={sc.status} className={styles.metricCard}>
                    <MetricIcon metric={sc.status} />
                    <div className={styles.metricText}>
                      <h3 className={styles.metricTitle}>{sc.status}</h3>
                      <p className={styles.metricValue}>{sc._count.status}</p>
                    </div>
                  </div>
                ))}

                {/* Smart Insights */}
                {contextualConfig.showTrends && insights.map((insight, index) => (
                  <div key={`insight-${index}`} className={`${styles.metricCard} ${styles.insightCard} ${styles[insight.type]}`}>
                    <MetricIcon metric={insight.icon} />
                    <div className={styles.metricText}>
                      <h3 className={styles.metricTitle}>{insight.label}</h3>
                      <p className={styles.metricValue}>{insight.value}</p>
                      <span className={styles.metricDescription}>{insight.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.scrollIndicator}>
              {[0, 1, ...prioritizedStatusCounts.map((_: any, i: number) => i + 2), ...(contextualConfig.showTrends ? insights.map((_: any, i: number) => i + prioritizedStatusCounts.length + 2) : [])].map((i) => (
                <div 
                  key={i} 
                  className={`${styles.scrollDot} ${activeMetricDot === i ? styles.activeDot : ''}`}
                  onClick={() => {
                    if (metricsRowRef.current) {
                      const totalItems = prioritizedStatusCounts.length + insights.length + 2
                      const itemWidth = metricsRowRef.current.scrollWidth / totalItems
                      metricsRowRef.current.scrollTo({ left: itemWidth * i, behavior: 'smooth' })
                    }
                  }}
                ></div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
} 