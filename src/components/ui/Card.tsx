import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & { tone?: 'default' | 'gold' | 'live' }

export function Card({ className = '', tone = 'default', ...props }: CardProps) {
  const toneClass = tone === 'gold' ? 'border-gold/40 shadow-gold' : tone === 'live' ? 'border-live/50 shadow-live' : 'border-gold/20'
  return <div className={`glass-card rounded-2xl border ${toneClass} ${className}`} {...props} />
}
