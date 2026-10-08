import React, { useEffect, useState, useRef } from 'react'

export function FitScreen({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onResize = () => {
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080)
      setScale(s)
    }
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        ref={containerRef}
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          background: '#0A0A0A',
          position: 'relative'
        }}
      >
        {children}
      </div>
    </div>
  )
}
