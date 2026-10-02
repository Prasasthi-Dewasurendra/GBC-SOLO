import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & { tone?: 'default' | 'gold' | 'live' }

export function Card({ className = '', tone = 'default', ...props }: CardProps) {
  const toneClass =
    tone === 'gold'
      ? 'border-[#C9A24B]'
      : tone === 'live'
        ? 'border-[#1E8F63]'
        : 'border-white/10'
  return <div className={`glass-card rounded-xl border ${toneClass} ${className}`} {...props} />
}
