import { Crown, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Skeleton } from '../ui/Skeleton'

type PlayerAvatarProps = {
  photoUrl?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  ring?: 'none' | 'gold' | 'green'
  state?: 'normal' | 'winner' | 'eliminated' | 'tbd'
}

const sizes = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-14 w-14 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-48 w-48 text-4xl md:h-64 md:w-64 md:text-5xl',
}

export function PlayerAvatar({ photoUrl, name, size = 'md', ring = 'none', state = 'normal' }: PlayerAvatarProps) {
  const [loaded, setLoaded] = useState(false)
  const initials = name === 'TBD' ? '' : name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const ringClass =
    ring === 'gold' || state === 'winner'
      ? 'border-[#C9A24B]'
      : ring === 'green'
        ? 'border-[#1E8F63]'
        : 'border-white/10'
  const stateClass = state === 'eliminated' ? 'opacity-40 grayscale' : ''

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border-2 bg-[#0A0A0A] ${sizes[size]} ${ringClass} ${stateClass}`}
      title={name}
    >
      {photoUrl && (
        <>
          {!loaded && <Skeleton className="absolute inset-0 rounded-full" />}
          <img
            className={`h-full w-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'}`}
            src={photoUrl}
            alt={name}
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />
        </>
      )}
      {!photoUrl && state === 'tbd' && (
        <div className="grid h-full place-items-center text-[#A3A3A3]">
          <UserRound size={size === 'xl' ? 56 : 20} />
          <span className="sr-only">TBD</span>
        </div>
      )}
      {!photoUrl && state !== 'tbd' && (
        <div className="grid h-full place-items-center font-sans font-semibold text-[#F5F5F5]">
          {initials}
        </div>
      )}
      {state === 'winner' && (
        <span className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full bg-[#C9A24B] text-[#0A0A0A]">
          <Crown size={13} />
        </span>
      )}
    </div>
  )
}
