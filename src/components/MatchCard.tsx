import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { PlayerAvatar } from './brand/PlayerAvatar'
import { Badge } from './ui/Badge'

export type MatchCardData = {
  id?: string
  round: number
  slot: number
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

type MatchCardProps = { match: MatchCardData; variant?: 'compact' | 'standard' | 'display'; onClick?: () => void }

const roundNames = ['', 'R32', 'R16', 'Quarter Final', 'Semi Final', 'FINAL']

export function MatchCard({ match, variant = 'standard', onClick }: MatchCardProps) {
  const display = variant === 'display'
  const compact = variant === 'compact'
  const p1 = match.player1 ?? { name: match.player1_id ? 'Player 1' : 'TBD' }
  const p2 = match.player2 ?? { name: match.player2_id ? 'Player 2' : 'TBD' }
  const p1Winner = Boolean(match.winner_id && match.winner_id === match.player1_id)
  const p2Winner = Boolean(match.winner_id && match.winner_id === match.player2_id)
  const statusTone = match.status === 'live' ? 'live' : match.status === 'done' ? 'done' : 'pending'
  const cardClass = match.round === 5 ? 'border-gold/70 shadow-gold' : match.status === 'live' ? 'border-live/60 shadow-live' : 'border-gold/20'

  return <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }} onClick={onClick} className={`glass-card w-full rounded-2xl border p-3 text-left transition ${cardClass} ${onClick ? 'cursor-pointer' : 'cursor-default'} ${display ? 'p-5' : ''}`}>
    <div className="mb-3 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="rounded-full border border-gold/25 bg-gold/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-goldLight">{roundNames[match.round]}</span>{match.table_number && <span className="rounded-full border border-live/30 bg-live/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-glow">Table {match.table_number}</span>}{match.round === 5 && <Trophy className="text-gold" size={15} />}</div><Badge tone={statusTone}>{match.status === 'live' ? 'Playing' : match.status}</Badge></div>
    <div className={`flex items-center gap-3 ${compact ? 'flex-col items-stretch' : ''}`}>
      <PlayerLine name={p1.name} photoUrl={p1.photo_url} score={match.p1_racks ?? 0} winner={p1Winner} tbd={p1.name === 'TBD'} display={display} />
      <span className="shrink-0 font-display text-lg text-muted/50">vs</span>
      <PlayerLine name={p2.name} photoUrl={p2.photo_url} score={match.p2_racks ?? 0} winner={p2Winner} tbd={p2.name === 'TBD'} display={display} />
    </div>
    <div className="mt-3 text-center text-[10px] uppercase tracking-[0.16em] text-muted">{match.round === 5 ? 'Final · Best of 5 · Race to 3' : 'Best of 3 · Race to 2'}</div>
  </motion.button>
}

function PlayerLine({ name, photoUrl, score, winner, tbd, display }: { name: string; photoUrl?: string | null; score: number; winner: boolean; tbd: boolean; display: boolean }) {
  return <div className={`flex min-w-0 flex-1 items-center gap-2 ${winner ? 'text-goldLight' : tbd ? 'text-muted' : 'text-warm'}`}><PlayerAvatar photoUrl={photoUrl} name={name} size={display ? 'lg' : 'sm'} ring={winner ? 'gold' : 'none'} state={winner ? 'winner' : tbd ? 'tbd' : 'normal'} /><span className={`min-w-0 flex-1 truncate font-semibold ${display ? 'text-2xl' : 'text-sm'}`} title={name}>{name}</span><motion.strong key={score} initial={{ scale: 1.35, color: '#F2D675' }} animate={{ scale: 1 }} className={`font-display tabular-nums ${display ? 'text-4xl' : 'text-2xl'}`}>{score}</motion.strong></div>
}
