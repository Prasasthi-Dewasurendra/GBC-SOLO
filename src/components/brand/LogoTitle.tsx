import { CircleDot } from 'lucide-react'
import { useState } from 'react'

export function LogoTitle({ compact = false }: { compact?: boolean }) {
  const [logoFailed, setLogoFailed] = useState(false)

  return <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-gold/60 bg-feltDeep">{logoFailed ? <CircleDot className="text-gold" size={18} /> : <img className="h-full w-full object-contain p-1" src="/galle-billiards-club-logo.png" alt="" onError={() => setLogoFailed(true)} />}</span><div><p className="text-[10px] uppercase tracking-[0.28em] text-gold">Galle Billiards Club</p>{!compact && <p className="text-sm font-semibold tracking-wide text-warm">Tournament Manager</p>}</div></div>
}
