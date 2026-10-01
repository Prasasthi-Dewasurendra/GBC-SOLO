import { CircleDot } from 'lucide-react'

export function LogoTitle({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full border border-gold/50 bg-feltDeep shadow-gold"><CircleDot className="text-gold" size={20} /></span><div><p className="text-[10px] uppercase tracking-[0.35em] text-gold">GBC Solo</p>{!compact && <p className="font-display text-lg text-warm">Tournament Club</p>}</div></div>
}
