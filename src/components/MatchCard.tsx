import { getMatchNumber } from '../lib/tournament'
import { PlayerAvatar } from './brand/PlayerAvatar'
import { matchKind, roundLabel, raceLabel } from '../lib/matchLabels'
import { Trophy } from 'lucide-react'

export type MatchCardData = {
  id?: string
  round: number
  slot: number
  match_number?: number
  player1_id: string | null
  player2_id: string | null
  player1?: { name: string; photo_url?: string | null }
  player2?: { name: string; photo_url?: string | null }
  p1_racks?: number
  p2_racks?: number
  table_number?: number | null
  best_of: 3 | 5
  status: 'pending' | 'live' | 'done'
  winner_id: string | null
}

type MatchCardProps = {
  match: MatchCardData
  variant?: 'compact' | 'standard' | 'display'
  onClick?: () => void
  className?: string
}

const roundLabels = ['', 'R32', 'R16', 'QF', 'SF', 'FINAL']

export function MatchCard({ match, variant = 'standard', onClick, className = '' }: MatchCardProps) {
  const matchNum = match.match_number ?? getMatchNumber(match.round, match.slot)
  const isLive = match.status === 'live'
  const isDone = match.status === 'done'

  const kind = matchKind(match as any)
  const isFinal = kind === 'final'
  const isThirdPlace = kind === 'third_place'

  const getTbdText = (isPlayer1: boolean) => {
    if (isFinal) return isPlayer1 ? 'Winner of SF 1' : 'Winner of SF 2'
    if (isThirdPlace) return isPlayer1 ? 'Loser of SF 1' : 'Loser of SF 2'
    return 'TBD'
  }

  const p1 = match.player1 ?? { name: match.player1_id ? 'Player 1' : getTbdText(true) }
  const p2 = match.player2 ?? { name: match.player2_id ? 'Player 2' : getTbdText(false) }

  const p1Winner = isDone && Boolean(match.winner_id && match.winner_id === match.player1_id)
  const p2Winner = isDone && Boolean(match.winner_id && match.winner_id === match.player2_id)
  const p1Loser = isDone && !p1Winner && Boolean(match.winner_id)
  const p2Loser = isDone && !p2Winner && Boolean(match.winner_id)

  const cardBorder = isLive
    ? 'border-[#1E8F63]'
    : isFinal
      ? 'border-[#C9A24B]'
      : 'border-white/10'

  const tableText = match.table_number ? `T${match.table_number}` : 'Table TBA'

  if (variant === 'compact') {
    return (
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onClick()
          }
        }}
        className={`w-full rounded-lg border bg-[#121212] p-2.5 text-left transition ${cardBorder} ${
          onClick ? 'cursor-pointer hover:border-white/30' : ''
        } ${className}`}
      >
        <div className="mb-2 flex items-center justify-between gap-1.5 text-[11px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-[#F5F5F5] flex items-center gap-1">
              {isFinal && <Trophy size={10} className="text-[#C9A24B]" />}
              M{matchNum}
            </span>
            <span className="text-[#A3A3A3]">·</span>
            <span className="text-[#A3A3A3] truncate">{roundLabel(match as any)}</span>
            <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-[#A3A3A3]">
              {tableText}
            </span>
          </div>
          <div className="shrink-0 flex items-center gap-1">
            {isLive ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#1E8F63]">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#1E8F63]" />
                LIVE
              </span>
            ) : isDone ? (
              <span className="text-[10px] font-medium text-[#A3A3A3]">DONE</span>
            ) : (
              <span className="text-[10px] text-[#A3A3A3]/60">PENDING</span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <CompactPlayerRow
            name={p1.name}
            photoUrl={p1.photo_url}
            score={match.p1_racks ?? 0}
            isWinner={p1Winner}
            isLoser={p1Loser}
            isDone={isDone}
          />
          <CompactPlayerRow
            name={p2.name}
            photoUrl={p2.photo_url}
            score={match.p2_racks ?? 0}
            isWinner={p2Winner}
            isLoser={p2Loser}
            isDone={isDone}
          />
        </div>
      </div>
    )
  }

  if (variant === 'display') {
    return (
      <div
        className={`w-full rounded-xl border bg-[#121212] p-6 text-left ${cardBorder} ${className}`}
      >
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-bold text-[#F5F5F5]">
              {isFinal && <Trophy size={12} className="text-[#C9A24B]" />}
              M{matchNum}
            </span>
            <span className="text-xs uppercase tracking-wider text-[#A3A3A3]">
              {roundLabel(match as any)}
            </span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-[#F5F5F5]">
              {match.table_number ? `Table ${match.table_number}` : 'Table TBA'}
            </span>
          </div>
          <div>
            {isLive ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#1E8F63]/30 bg-[#1E8F63]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1E8F63]">
                <span className="live-dot h-2 w-2 rounded-full bg-[#1E8F63]" />
                LIVE
              </span>
            ) : isDone ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[#A3A3A3]">
                FINISHED
              </span>
            ) : (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#A3A3A3]/60">
                PENDING
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <DisplayPlayerCol
            name={p1.name}
            photoUrl={p1.photo_url}
            score={match.p1_racks ?? 0}
            isWinner={p1Winner}
            isLoser={p1Loser}
            isDone={isDone}
          />
          <span className="shrink-0 font-serif text-xl italic text-[#A3A3A3]/50">vs</span>
          <DisplayPlayerCol
            name={p2.name}
            photoUrl={p2.photo_url}
            score={match.p2_racks ?? 0}
            isWinner={p2Winner}
            isLoser={p2Loser}
            isDone={isDone}
          />
        </div>

        <div className="mt-4 border-t border-white/5 pt-3 text-center text-[11px] uppercase tracking-widest text-[#A3A3A3]">
          {isFinal ? 'FINAL · Best of 5 · Race to 3' : `${raceLabel(match as any)} (Best of ${match.best_of})`}
        </div>
      </div>
    )
  }

  // Standard variant (for Admin & general views)
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      className={`w-full rounded-xl border bg-[#121212] p-4 text-left transition ${cardBorder} ${
        onClick ? 'cursor-pointer hover:border-white/30' : ''
      } ${className}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded border border-white/20 bg-white/10 px-2 py-0.5 text-xs font-bold text-[#F5F5F5]">
            {isFinal && <Trophy size={12} className="text-[#C9A24B]" />}
            M{matchNum}
          </span>
          <span className="text-xs uppercase tracking-wider text-[#A3A3A3]">
            {roundLabel(match as any)}
          </span>
          <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-[#F5F5F5]">
            {match.table_number ? `Table ${match.table_number}` : 'Table TBA'}
          </span>
        </div>
        <div>
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#1E8F63]">
              <span className="live-dot h-2 w-2 rounded-full bg-[#1E8F63]" />
              LIVE
            </span>
          ) : isDone ? (
            <span className="text-xs font-medium text-[#A3A3A3]">DONE</span>
          ) : (
            <span className="text-xs text-[#A3A3A3]/60">PENDING</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <StandardPlayerRow
          name={p1.name}
          photoUrl={p1.photo_url}
          score={match.p1_racks ?? 0}
          isWinner={p1Winner}
          isLoser={p1Loser}
          isDone={isDone}
        />
        <StandardPlayerRow
          name={p2.name}
          photoUrl={p2.photo_url}
          score={match.p2_racks ?? 0}
          isWinner={p2Winner}
          isLoser={p2Loser}
          isDone={isDone}
        />
      </div>

      <div className="mt-3 text-center text-[10px] uppercase tracking-widest text-[#A3A3A3]">
        {isFinal ? 'FINAL · Best of 5 · Race to 3' : `${raceLabel(match as any)} (Best of ${match.best_of})`}
      </div>
    </div>
  )
}

function CompactPlayerRow({
  name,
  photoUrl,
  score,
  isWinner,
  isLoser,
  isDone,
}: {
  name: string
  photoUrl?: string | null
  score: number
  isWinner: boolean
  isLoser: boolean
  isDone: boolean
}) {
  const isTbd = name === 'TBD'
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded px-1.5 py-1 ${
        isWinner ? 'bg-white/5' : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <PlayerAvatar
          name={name}
          photoUrl={photoUrl}
          size="sm"
          state={isWinner ? 'winner' : isLoser ? 'eliminated' : isTbd ? 'tbd' : 'normal'}
        />
        <span
          className={`truncate text-xs font-medium ${
            isWinner
              ? 'font-semibold text-[#F5F5F5]'
              : isLoser
                ? 'text-[#A3A3A3]'
                : isTbd
                  ? 'text-[#A3A3A3]'
                  : 'text-[#F5F5F5]'
          }`}
          title={name}
        >
          {name}
        </span>
      </div>
      <span
        className={`font-serif text-sm font-bold tabular-nums shrink-0 ${
          isWinner ? 'text-[#C9A24B]' : isDone ? 'text-[#A3A3A3]' : 'text-[#F5F5F5]'
        }`}
      >
        {score}
      </span>
    </div>
  )
}

function StandardPlayerRow({
  name,
  photoUrl,
  score,
  isWinner,
  isLoser,
  isDone,
}: {
  name: string
  photoUrl?: string | null
  score: number
  isWinner: boolean
  isLoser: boolean
  isDone: boolean
}) {
  const isTbd = name === 'TBD'
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg p-2 ${
        isWinner ? 'bg-white/5' : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <PlayerAvatar
          name={name}
          photoUrl={photoUrl}
          size="sm"
          state={isWinner ? 'winner' : isLoser ? 'eliminated' : isTbd ? 'tbd' : 'normal'}
        />
        <span
          className={`truncate text-sm ${
            isWinner
              ? 'font-semibold text-[#F5F5F5]'
              : isLoser
                ? 'text-[#A3A3A3]'
                : isTbd
                  ? 'text-[#A3A3A3]'
                  : 'text-[#F5F5F5]'
          }`}
          title={name}
        >
          {name}
        </span>
      </div>
      <span
        className={`font-serif text-lg font-bold tabular-nums shrink-0 ${
          isWinner ? 'text-[#C9A24B]' : isDone ? 'text-[#A3A3A3]' : 'text-[#F5F5F5]'
        }`}
      >
        {score}
      </span>
    </div>
  )
}

function DisplayPlayerCol({
  name,
  photoUrl,
  score,
  isWinner,
  isLoser,
  isDone,
}: {
  name: string
  photoUrl?: string | null
  score: number
  isWinner: boolean
  isLoser: boolean
  isDone: boolean
}) {
  const isTbd = name === 'TBD'
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col items-center text-center p-3 rounded-xl ${
        isWinner ? 'bg-white/5' : ''
      }`}
    >
      <PlayerAvatar
        name={name}
        photoUrl={photoUrl}
        size="lg"
        state={isWinner ? 'winner' : isLoser ? 'eliminated' : isTbd ? 'tbd' : 'normal'}
      />
      <h3
        className={`mt-3 truncate max-w-full text-base font-semibold ${
          isWinner
            ? 'text-[#F5F5F5]'
            : isLoser
              ? 'text-[#A3A3A3]'
              : isTbd
                ? 'text-[#A3A3A3]'
                : 'text-[#F5F5F5]'
        }`}
        title={name}
      >
        {name}
      </h3>
      <div
        className={`mt-2 font-serif text-4xl font-bold tabular-nums ${
          isWinner ? 'text-[#C9A24B]' : isDone ? 'text-[#A3A3A3]' : 'text-[#F5F5F5]'
        }`}
      >
        {score}
      </div>
    </div>
  )
}
