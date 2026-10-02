import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & { tone?: 'default' | 'gold' | 'live' }

export function Card({ className = '', tone = 'default', ...props }: CardProps) {
  const toneClass = tone === 'gold' ? 'border-gold/50' : tone === 'live' ? 'border-live/60' : 'border-border'
  return <div className={`glass-card rounded-xl border ${toneClass} ${className}`} {...props} />
}
