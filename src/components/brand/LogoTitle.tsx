import { CircleDot } from 'lucide-react'

export function LogoTitle({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full border border-gold/60 bg-feltDeep"><CircleDot className="text-gold" size={18} /></span><div><p className="text-[10px] uppercase tracking-[0.28em] text-gold">GBC Solo</p>{!compact && <p className="text-sm font-semibold tracking-wide text-warm">Tournament Club</p>}</div></div>
}
