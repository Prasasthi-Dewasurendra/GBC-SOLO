import type { ReactNode } from 'react'

type BadgeProps = { children: ReactNode; tone?: 'live' | 'done' | 'pending' | 'error' }

export function Badge({ children, tone = 'pending' }: BadgeProps) {
  const styles = { live: 'bg-live/15 text-glow border-live/40', done: 'bg-gold/15 text-goldLight border-gold/40', pending: 'bg-pending/15 text-muted border-pending/40', error: 'bg-goldDark/20 text-goldLight border-goldDark/50' }
  return <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone === 'live' ? 'status-live' : ''} ${styles[tone]}`}>{tone === 'live' && <span className="h-1.5 w-1.5 rounded-full bg-glow" />}{children}</span>
}
