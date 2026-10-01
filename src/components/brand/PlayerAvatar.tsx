import { Check, Crown, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Skeleton } from '../ui/Skeleton'

type PlayerAvatarProps = {
  photoUrl?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  ring?: 'none' | 'gold' | 'green'
  state?: 'normal' | 'winner' | 'eliminated' | 'tbd'
}

const sizes = { sm: 'h-9 w-9 text-xs', md: 'h-14 w-14 text-lg', lg: 'h-24 w-24 text-3xl', xl: 'h-64 w-64 text-6xl md:h-80 md:w-80 md:text-8xl' }

export function PlayerAvatar({ photoUrl, name, size = 'md', ring = 'none', state = 'normal' }: PlayerAvatarProps) {
  const [loaded, setLoaded] = useState(false)
  const initials = name === 'TBD' ? '' : name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const ringClass = ring === 'gold' || state === 'winner' ? 'border-gold shadow-gold' : ring === 'green' ? 'border-live shadow-live' : 'border-warm/10'
  const stateClass = state === 'eliminated' ? 'opacity-50 grayscale' : state === 'winner' ? 'shadow-gold' : ''

  return <div className={`relative shrink-0 overflow-hidden rounded-full border-2 bg-ink ${sizes[size]} ${ringClass} ${stateClass}`} title={name}>
    {photoUrl && <>{!loaded && <Skeleton className="absolute inset-0 rounded-full" />}<img className={`h-full w-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'}`} src={photoUrl} alt={name} loading="lazy" onLoad={() => setLoaded(true)} /></>}
    {!photoUrl && state === 'tbd' && <div className="grid h-full place-items-center text-muted"><UserRound size={size === 'xl' ? 56 : 24} /><span className="sr-only">TBD</span></div>}
    {!photoUrl && state !== 'tbd' && <div className="grid h-full place-items-center font-display text-gold">{initials}</div>}
    {state === 'winner' && <span className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full bg-gold text-ink"><Crown size={13} /></span>}
    {state === 'eliminated' && <span className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full bg-pending text-ink"><Check size={13} /></span>}
  </div>
}
