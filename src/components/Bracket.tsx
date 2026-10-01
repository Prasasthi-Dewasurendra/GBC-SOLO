import { MatchCard, type MatchCardData } from './MatchCard'
import type { BracketMatch, BracketPlayer } from '../lib/tournament'

type BracketProps = {
  matches: BracketMatch[]
  players: BracketPlayer[]
  onMatchClick?: (match: BracketMatch) => void
}

const roundNames = ['R32', 'R16', 'QF', 'SF', 'Final']

export function Bracket({ matches, players, onMatchClick }: BracketProps) {
  const playerById = new Map(players.map((player) => [player.id, player]))

  return (
    <div className="grid min-w-[1220px] grid-cols-5 gap-4 overflow-x-auto pb-3">
      {roundNames.map((roundName, roundIndex) => {
        const round = roundIndex + 1
        const roundMatches = matches.filter((match) => match.round === round)
        return <section className="relative flex min-h-[680px] flex-col" key={round}>
          <header className="mb-4 border-b border-gold/20 pb-3"><p className="text-[10px] uppercase tracking-[0.24em] text-gold">Round {round}</p><h3 className="font-display text-2xl text-warm">{roundName}</h3></header>
          <div className="flex flex-1 flex-col justify-around gap-2">
            {roundMatches.map((match) => {
              const player1 = match.player1_id ? playerById.get(match.player1_id) : undefined
              const player2 = match.player2_id ? playerById.get(match.player2_id) : undefined
              const cardMatch: MatchCardData = { ...match, player1: player1 ? { name: player1.name, photo_url: player1.photo_url } : { name: 'TBD' }, player2: player2 ? { name: player2.name, photo_url: player2.photo_url } : { name: 'TBD' } }
              return <MatchCard key={`${match.round}-${match.slot}`} match={cardMatch} variant="compact" onClick={onMatchClick ? () => onMatchClick(match) : undefined} />
            })}
          </div>
        </section>
      })}
    </div>
  )
}
