import type { ReactNode } from 'react'

type BadgeProps = { children: ReactNode; tone?: 'live' | 'done' | 'pending' | 'error' | 'success' }

export function Badge({ children, tone = 'pending' }: BadgeProps) {
  if (tone === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1E8F63]/30 bg-[#1E8F63]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#1E8F63]">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#1E8F63]" />
        {children}
      </span>
    )
  }

  if (tone === 'success') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1E8F63]/30 bg-[#1E8F63]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#1E8F63]">
        {children}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#A3A3A3]">
      {children}
    </span>
  )
}
