import { useId } from 'react'

/** Standard colours: 1/9 yellow, 2/10 blue, 3/11 red, 4/12 purple, 5/13 orange, 6/14 green, 7/15 maroon, 8 black */
const COLORS: Record<number, string> = {
  1: '#F2C230', 2: '#1E4FA8', 3: '#D32F2F', 4: '#5B2C83',
  5: '#F28C28', 6: '#1E7A46', 7: '#7A1F2B', 8: '#141414',
}
export const ballColor = (n: number) => COLORS[n <= 8 ? n : n - 8]
export const ballType = (n: number): 'solid' | 'stripe' | 'eight' =>
  n === 8 ? 'eight' : n < 8 ? 'solid' : 'stripe'
export const SOLIDS = [1, 2, 3, 4, 5, 6, 7]
export const STRIPES = [9, 10, 11, 12, 13, 14, 15]

type Props = { number: number; size?: number | 'sm' | 'md' | 'lg' | 'xl'; className?: string; potted?: boolean }
const SIZES = { sm: 28, md: 44, lg: 64, xl: 88 }

/** Realistic pool ball: 3D shading, specular highlight, white number disc, real stripe band. */
export default function PoolBall({ number, size = 'md', className, potted = false }: Props) {
  const uid = useId().replace(/:/g, '')
  const px = typeof size === 'number' ? size : SIZES[size]
  const type = ballType(number)
  const color = ballColor(number)
  const base = type === 'stripe' ? '#F3EFE4' : color // stripes sit on an ivory ball
  const fs = number > 9 ? 21 : 25

  return (
    <svg
      viewBox="0 0 100 100" width={px} height={px} className={className}
      role="img" aria-label={`${type === 'stripe' ? 'Stripe' : type === 'eight' ? 'Black' : 'Solid'} ball ${number}`}
      style={{
        display: 'block',
        // potted = grey "ghost" skin: still visible, clearly out of play
        filter: potted ? 'grayscale(1) brightness(0.55)' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.55))',
        opacity: potted ? 0.55 : 1,
        transition: 'filter 300ms ease, opacity 300ms ease',
      }}
    >
      <defs>
        <clipPath id={`c${uid}`}><circle cx="50" cy="50" r="48" /></clipPath>
        {/* form shading: light from top-left, dark rim bottom-right */}
        <radialGradient id={`s${uid}`} cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.35" stopColor="#000" stopOpacity="0" />
          <stop offset="0.8" stopColor="#000" stopOpacity="0.42" />
          <stop offset="1" stopColor="#000" stopOpacity="0.7" />
        </radialGradient>
        {/* specular highlight */}
        <radialGradient id={`h${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g clipPath={`url(#c${uid})`}>
        <rect width="100" height="100" fill={base} />
        {type === 'stripe' && <rect x="0" y="22" width="100" height="56" fill={color} />}
        {/* number disc */}
        <circle cx="50" cy="50" r="19" fill="#FAF7EE" />
        <text x="50" y="51" textAnchor="middle" dominantBaseline="central"
          fontFamily="Inter, Arial, sans-serif" fontWeight="800" fontSize={fs} fill="#111">
          {number}
        </text>
        {/* shading on top of everything so the disc and band look curved */}
        <rect width="100" height="100" fill={`url(#s${uid})`} />
        <ellipse cx="34" cy="26" rx="15" ry="9" transform="rotate(-32 34 26)" fill={`url(#h${uid})`} />
      </g>
      <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.2" />
    </svg>
  )
}
