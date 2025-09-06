'use client'

import { useState, useEffect } from 'react'
import { isMobileDevice } from '../../lib/utils'

export default function MobileDebugInfo() {
  const [debugInfo, setDebugInfo] = useState({
    userAgent: '',
    screenWidth: 0,
    screenHeight: 0,
    isMobileDevice: false,
    isTouchDevice: false,
    platform: '',
    maxTouchPoints: 0,
    viewPreference: ''
  })

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        isMobileDevice: isMobileDevice(),
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints,
        viewPreference: localStorage.getItem('viewPreference') || 'none'
      })
    }

    updateDebugInfo()
    window.addEventListener('resize', updateDebugInfo)
    
    return () => window.removeEventListener('resize', updateDebugInfo)
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      borderRadius: '5px',
      fontFamily: 'monospace'
    }}>
      <div><strong>Mobile Debug Info:</strong></div>
      <div>Screen: {debugInfo.screenWidth}x{debugInfo.screenHeight}</div>
      <div>Is Mobile: {debugInfo.isMobileDevice ? 'Yes' : 'No'}</div>
      <div>Is Touch: {debugInfo.isTouchDevice ? 'Yes' : 'No'}</div>
      <div>Platform: {debugInfo.platform}</div>
      <div>Touch Points: {debugInfo.maxTouchPoints}</div>
      <div>View Pref: {debugInfo.viewPreference}</div>
      <div style={{ fontSize: '10px', marginTop: '5px', wordBreak: 'break-all' }}>
        UA: {debugInfo.userAgent.substring(0, 50)}...
      </div>
    </div>
  )
}
