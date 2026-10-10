import React, { useEffect, useState, useRef } from 'react'
import { displayTheme } from '../display/theme'

export function FitScreen({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onResize = () => {
      const s = Math.min(
        window.innerWidth / displayTheme.sizes.canvasWidth,
        window.innerHeight / displayTheme.sizes.canvasHeight
      )
      setScale(s)
    }
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: displayTheme.colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        ref={containerRef}
        style={{
          width: displayTheme.sizes.canvasWidth,
          height: displayTheme.sizes.canvasHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          background: displayTheme.colors.bg,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}
