"use client"

import { useState, useEffect, useRef } from 'react'
import { DollarSign, Package, CheckCircle, Clock, Truck, RefreshCw } from 'lucide-react'
import styles from './AdminMetrics.module.css'

interface AdminMetricsProps {
  token: string | null
  user: any
}

const getMetricIcon = (metric: string) => {
  switch (metric.toLowerCase()) {
    case 'revenue': return <DollarSign size={20} className={styles.metricIcon} />
    case 'orders': return <Package size={20} className={styles.metricIcon} />
    case 'completed': return <CheckCircle size={20} className={styles.metricIcon} />
    case 'processing': return <Clock size={20} className={styles.metricIcon} />
    case 'shipped': return <Truck size={20} className={styles.metricIcon} />
    default: return <Package size={20} className={styles.metricIcon} />
  }
}

const MetricsSkeleton = () => (
  <div className={styles.metricsRow}>
    {[...Array(4)].map((_, i) => (
      <div key={i} className={`${styles.metricCard} ${styles.skeleton}`}>
        <div className={styles.skeletonIcon} />
        <div className={styles.skeletonTextWrapper}>
          <div className={styles.skeletonText} />
          <div className={styles.skeletonValue} />
        </div>
      </div>
    ))}
  </div>
);

export default function AdminMetrics({ token, user }: AdminMetricsProps) {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'today'|'week'|'month'|'year'|'all'>('week')
  const [activeMetricDot, setActiveMetricDot] = useState(0)
  const metricsRowRef = useRef<HTMLDivElement>(null)

  const fetchMetrics = async (p: string = period) => {
    if (user?.role !== 'admin' || !token) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/metrics?period=${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch metrics. Please try again.')
      }
      const data = await response.json()
      setMetrics(data)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [user, token])

  useEffect(() => {
    const metricsRow = metricsRowRef.current
    if (!metricsRow || loading) return

    const handleScroll = () => {
      if (metricsRow.scrollWidth === 0) return
      const itemWidth = metricsRow.scrollWidth / (metrics?.statusCounts?.length + 2 || 1)
      const scrollPosition = metricsRow.scrollLeft
      const activeIndex = Math.round(scrollPosition / itemWidth)
      setActiveMetricDot(activeIndex)
    }

    metricsRow.addEventListener('scroll', handleScroll)
    handleScroll() 
    return () => {
      metricsRow.removeEventListener('scroll', handleScroll)
    }
  }, [metrics, loading])

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value as 'today'|'week'|'month'|'year'|'all'
    setPeriod(newPeriod)
    fetchMetrics(newPeriod)
  }

  const handleRetry = () => {
    fetchMetrics(period)
  }

  return (
    <div className={styles.metricsSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Admin Metrics</h2>
        <div className={styles.periodSelector}>
          <select value={period} onChange={handlePeriodChange} className={styles.periodSelect} disabled={loading}>
            <option value="today">Today</option>
            <option value="week">Last 7d</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
            <option value="all">All</option>
          </select>
          <button onClick={() => fetchMetrics()} className={styles.refreshButton} disabled={loading}>
            <RefreshCw size={16} className={loading ? styles.refreshing : ''} />
          </button>
        </div>
      </div>
      
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
              <div className={styles.metricCard}>
                {getMetricIcon('revenue')}
                <div className={styles.metricText}>
                  <h3 className={styles.metricTitle}>Revenue</h3>
                  <p className={styles.metricValue}>₹{metrics?.revenue ? metrics.revenue.toFixed(2) : '0.00'}</p>
                </div>
              </div>
              <div className={styles.metricCard}>
                {getMetricIcon('orders')}
                <div className={styles.metricText}>
                  <h3 className={styles.metricTitle}>Orders</h3>
                  <p className={styles.metricValue}>{metrics?.totalOrders || '0'}</p>
                </div>
              </div>
              {metrics?.statusCounts?.map((sc: any) => (
                <div key={sc.status} className={styles.metricCard}>
                  {getMetricIcon(sc.status)}
                  <div className={styles.metricText}>
                    <h3 className={styles.metricTitle}>{sc.status}</h3>
                    <p className={styles.metricValue}>{sc._count.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.scrollIndicator}>
            {[0, 1, ...(metrics?.statusCounts?.map((_: any, i: number) => i + 2) || [])].map((i) => (
              <div 
                key={i} 
                className={`${styles.scrollDot} ${activeMetricDot === i ? styles.activeDot : ''}`}
                onClick={() => {
                  if (metricsRowRef.current) {
                    const itemWidth = metricsRowRef.current.scrollWidth / (metrics?.statusCounts?.length + 2 || 1)
                    metricsRowRef.current.scrollTo({ left: itemWidth * i, behavior: 'smooth' })
                  }
                }}
              ></div>
            ))}
          </div>
        </>
      )}
    </div>
  )
} 