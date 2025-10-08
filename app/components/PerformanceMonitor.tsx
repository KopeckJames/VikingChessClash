'use client'

import { useEffect, useState } from 'react'

export default function PerformanceMonitor() {
  const [fps, setFps] = useState(0)
  const [showMonitor, setShowMonitor] = useState(false)

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()

      if (currentTime - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)))
        frameCount = 0
        lastTime = currentTime
      }

      animationId = requestAnimationFrame(measureFPS)
    }

    // Only show monitor in development or when explicitly enabled
    if (process.env.NODE_ENV === 'development' || showMonitor) {
      measureFPS()
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [showMonitor])

  // Show monitor on triple-click
  useEffect(() => {
    let clickCount = 0
    let clickTimer: NodeJS.Timeout

    const handleTripleClick = () => {
      clickCount++

      if (clickCount === 1) {
        clickTimer = setTimeout(() => {
          clickCount = 0
        }, 500)
      } else if (clickCount === 3) {
        clearTimeout(clickTimer)
        setShowMonitor(!showMonitor)
        clickCount = 0
      }
    }

    document.addEventListener('click', handleTripleClick)

    return () => {
      document.removeEventListener('click', handleTripleClick)
      if (clickTimer) clearTimeout(clickTimer)
    }
  }, [showMonitor])

  if (!showMonitor && process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-mono">
      <div>FPS: {fps}</div>
      <div className="text-xs opacity-70">
        {fps >= 60 ? '🟢 Excellent' : fps >= 30 ? '🟡 Good' : '🔴 Poor'}
      </div>
    </div>
  )
}
