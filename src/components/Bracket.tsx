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
    <div className="grid min-w-[980px] grid-cols-5 gap-3 overflow-x-auto pb-3">
      {roundNames.map((roundName, roundIndex) => {
        const round = roundIndex + 1
        const roundMatches = matches.filter((match) => match.round === round)
        return <section className="flex min-h-[560px] flex-col" key={round}>
          <header className="mb-3 border-b border-ink/10 pb-2"><p className="text-xs uppercase tracking-[0.24em] text-felt">Round {round}</p><h3 className="font-display text-2xl">{roundName}</h3></header>
          <div className="flex flex-1 flex-col justify-around gap-2">
            {roundMatches.map((match) => {
              const player1 = match.player1_id ? playerById.get(match.player1_id) : undefined
              const player2 = match.player2_id ? playerById.get(match.player2_id) : undefined
              return <button className="w-full rounded-lg border border-ink/10 bg-white/75 p-2 text-left shadow-sm transition hover:border-copper hover:shadow-md disabled:cursor-default" key={`${match.round}-${match.slot}`} onClick={() => onMatchClick?.(match)} disabled={!onMatchClick}>
                <div className={`flex items-center gap-2 border-b border-ink/10 pb-1 ${match.winner_id === match.player1_id && match.winner_id ? 'font-bold text-felt' : ''}`}>
                  {player1?.photo_url ? <img className="h-7 w-7 rounded object-cover" src={player1.photo_url} alt="" /> : <span className="grid h-7 w-7 place-items-center rounded bg-ink/10 text-xs">{player1?.name.charAt(0) ?? '-'}</span>}
                  <span className="truncate text-xs">{player1?.name ?? 'Waiting'}</span>
                </div>
                <div className={`flex items-center gap-2 pt-1 ${match.winner_id === match.player2_id && match.winner_id ? 'font-bold text-felt' : ''}`}>
                  {player2?.photo_url ? <img className="h-7 w-7 rounded object-cover" src={player2.photo_url} alt="" /> : <span className="grid h-7 w-7 place-items-center rounded bg-ink/10 text-xs">{player2?.name.charAt(0) ?? '-'}</span>}
                  <span className="truncate text-xs">{player2?.name ?? 'Waiting'}</span>
                </div>
              </button>
            })}
          </div>
        </section>
      })}
    </div>
  )
}
