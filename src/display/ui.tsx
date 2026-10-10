import { Check, Clock3, Maximize, Trophy, User } from 'lucide-react'
import { motion } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'
import { displayTheme } from './theme'

type PhotoSize = 'sm' | 'md' | 'lg' | 'xl'
type PhotoState = 'normal' | 'winner' | 'loser' | 'tbd'

const photoSizes: Record<PhotoSize, number> = {
  sm: displayTheme.sizes.photoSm,
  md: displayTheme.sizes.photoMd,
  lg: displayTheme.sizes.photoLg,
  xl: displayTheme.sizes.photoXl,
}

export function PhotoFrame({
  src,
  name,
  size = 'md',
  aspect = 'square',
  state = 'normal',
  showWinnerBadge = true,
}: {
  src?: string | null
  name: string
  size?: PhotoSize
  aspect?: 'square' | 'portrait'
  state?: PhotoState
  showWinnerBadge?: boolean
}) {
  const dimension = photoSizes[size]
  const style = { '--photo-size': `${dimension}px` } as CSSProperties

  return (
    <div className={`display-photo display-photo--${size} display-photo--${aspect} display-photo--${state}`} style={style}>
      {state === 'tbd' ? (
        <span className="display-photo__tbd">TBD</span>
      ) : src ? (
        <img src={src} alt={name} />
      ) : (
        <User aria-hidden="true" strokeWidth={1.5} />
      )}
      {state === 'winner' && showWinnerBadge && <span className="display-photo__winner"><Check size={20} strokeWidth={1.5} /></span>}
    </div>
  )
}

export function Chip({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'final' }) {
  return <span className={`display-chip${variant === 'final' ? ' display-chip--final' : ''}`}>{children}</span>
}

export function StatusBadge({ status }: { status: 'live' | 'done' | 'pending' }) {
  if (status === 'live') return <span className="display-status display-status--live"><i />LIVE</span>
  if (status === 'done') return <span className="display-status"><Check size={20} strokeWidth={1.5} />DONE</span>
  return <span className="display-status display-status--pending">Upcoming</span>
}

export function Score({ value, tone = 'live', size = 'regular' }: { value: number; tone?: 'live' | 'winner' | 'loser'; size?: 'regular' | 'large' }) {
  return (
    <motion.span
      key={value}
      className={`display-score display-score--${tone} display-score--${size}`}
      initial={{ opacity: 0.55, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {value}
    </motion.span>
  )
}

export function DisplayHeader({
  title,
  date,
  onFullscreen,
  live = true,
}: {
  title: string
  date: string
  onFullscreen: () => void
  live?: boolean
}) {
  return (
    <header className="display-header">
      <div className="display-header__brand">
        <ClubMark />
        <div>
          <p className="display-header__club">Galle Billiards Club</p>
          <p className="display-header__subline">SOLO Tournament</p>
        </div>
      </div>
      <h1 className="display-header__title">{title}</h1>
      <div className="display-header__right">
        <span className="display-header__date">{date}</span>
        {live && <StatusBadge status="live" />}
        <button className="display-icon-button" onClick={onFullscreen} title="Toggle fullscreen" aria-label="Toggle fullscreen">
          <Maximize size={20} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  )
}

export function Clock({ value }: { value: Date }) {
  return <span className="display-clock"><Clock3 size={20} strokeWidth={1.5} />{value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
}

export function Divider({ final = false }: { final?: boolean }) {
  return <div className={`display-divider${final ? ' display-divider--final' : ''}`} />
}

export function MatchPlayer({
  name,
  photo,
  score,
  state = 'normal',
  size = 'sm',
}: {
  name: string
  photo?: string | null
  score?: number
  state?: PhotoState
  size?: PhotoSize
}) {
  return (
    <div className={`display-player display-player--${state}`}>
      <PhotoFrame src={photo} name={name} size={size} state={state} showWinnerBadge={false} />
      <span className="display-player__identity">
        {state === 'winner' && <span className="display-player__winner-check"><Check size={20} strokeWidth={1.5} /></span>}
        <span className="display-player__name" title={name}>{name}</span>
      </span>
      {score !== undefined && <Score value={score} tone={state === 'winner' ? 'winner' : state === 'loser' ? 'loser' : 'live'} />}
    </div>
  )
}

export function FinalMark() {
  return <Trophy aria-hidden="true" size={24} strokeWidth={1.5} className="display-final-mark" />
}

export function ClubMark() {
  return <img className="display-club-mark" src="/galle-billiards-club-logo.png" alt="Galle Billiards Club logo" />
}