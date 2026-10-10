import { MatchCard, type MatchCardData } from './MatchCard'
import { getMatchNumber, type BracketMatch, type BracketPlayer } from '../lib/tournament'

type BracketProps = {
  matches: BracketMatch[]
  players: BracketPlayer[]
  onMatchClick?: (match: BracketMatch) => void
  layout?: 'columns' | 'two-halves'
  compact?: boolean
}

export function Bracket({
  matches,
  players,
  onMatchClick,
  layout = 'columns',
}: BracketProps) {
  const playerById = new Map(players.map((player) => [player.id, player]))

  function getCardData(match: BracketMatch): MatchCardData {
    const p1 = match.player1_id ? playerById.get(match.player1_id) : undefined
    const p2 = match.player2_id ? playerById.get(match.player2_id) : undefined
    const matchRow = match as BracketMatch & { p1_racks?: number; p2_racks?: number }
    return {
      ...match,
      match_number: match.match_number ?? getMatchNumber(match.round, match.slot),
      p1_racks: matchRow.p1_racks ?? 0,
      p2_racks: matchRow.p2_racks ?? 0,
      player1: p1 ? { name: p1.name, photo_url: p1.photo_url } : { name: 'TBD' },
      player2: p2 ? { name: p2.name, photo_url: p2.photo_url } : { name: 'TBD' },
    }
  }

  if (layout === 'two-halves') {
    // R16 (round 2): 8 matches. Left = 0,1,2,3; Right = 4,5,6,7
    // QF (round 3): 4 matches. Left = 0,1; Right = 2,3
    // SF (round 4): 2 matches. Left = 0; Right = 1
    // Final (round 5): 1 match. Center = 0
    const r16Left = [0, 1, 2, 3].map((slot) => matches.find((m) => m.round === 2 && m.slot === slot))
    const qfLeft = [0, 1].map((slot) => matches.find((m) => m.round === 3 && m.slot === slot))
    const sfLeft = [0].map((slot) => matches.find((m) => m.round === 4 && m.slot === slot))
    const finalMatch = matches.find((m) => m.round === 5 && m.slot === 0)
    const thirdPlaceMatch = matches.find((m) => m.round === 5 && m.slot === 1)
    const sfRight = [1].map((slot) => matches.find((m) => m.round === 4 && m.slot === slot))
    const qfRight = [2, 3].map((slot) => matches.find((m) => m.round === 3 && m.slot === slot))
    const r16Right = [4, 5, 6, 7].map((slot) => matches.find((m) => m.round === 2 && m.slot === slot))

    return (
      <div className="grid h-full w-full grid-cols-7 items-stretch gap-2.5">
        {/* Left R16 */}
        <div className="flex flex-col justify-between py-1">
          <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">
            R16 Left
          </div>
          {r16Left.map((m, idx) =>
            m ? (
              <MatchCard
                key={m.id ?? `r2-s${m.slot}`}
                match={getCardData(m)}
                variant="compact"
                onClick={onMatchClick ? () => onMatchClick(m) : undefined}
              />
            ) : (
              <div key={`empty-r16-l-${idx}`} className="h-16 rounded border border-white/5" />
            )
          )}
        </div>

        {/* Left QF */}
        <div className="flex flex-col justify-around py-4">
          <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">
            QF Left
          </div>
          {qfLeft.map((m, idx) =>
            m ? (
              <MatchCard
                key={m.id ?? `r3-s${m.slot}`}
                match={getCardData(m)}
                variant="compact"
                onClick={onMatchClick ? () => onMatchClick(m) : undefined}
              />
            ) : (
              <div key={`empty-qf-l-${idx}`} className="h-16 rounded border border-white/5" />
            )
          )}
        </div>

        {/* Left SF */}
        <div className="flex flex-col justify-center py-6">
          <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">
            Semi-Final 1
          </div>
          {sfLeft[0] ? (
            <MatchCard
              match={getCardData(sfLeft[0])}
              variant="compact"
              onClick={onMatchClick ? () => onMatchClick(sfLeft[0]!) : undefined}
            />
          ) : (
            <div className="h-16 rounded border border-white/5" />
          )}
        </div>

        {/* Center Final & Third Place */}
        <div className="flex flex-col justify-center gap-6 py-4">
          <div>
            <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-[#C9A24B]">
              ★ Championship Final ★
            </div>
            {finalMatch ? (
              <MatchCard
                match={getCardData(finalMatch)}
                variant="compact"
                className="border-[#C9A24B] shadow-lg shadow-black"
                onClick={onMatchClick ? () => onMatchClick(finalMatch) : undefined}
              />
            ) : (
              <div className="h-24 rounded border border-[#C9A24B]/30" />
            )}
          </div>
          <div>
            <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3]">
              3rd Place Play-off
            </div>
            {thirdPlaceMatch ? (
              <div className="scale-90 origin-top">
                <MatchCard
                  match={getCardData(thirdPlaceMatch)}
                  variant="compact"
                  onClick={onMatchClick ? () => onMatchClick(thirdPlaceMatch) : undefined}
                />
              </div>
            ) : (
              <div className="h-16 rounded border border-white/5" />
            )}
          </div>
        </div>

        {/* Right SF */}
        <div className="flex flex-col justify-center py-6">
          <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">
            Semi-Final 2
          </div>
          {sfRight[0] ? (
            <MatchCard
              match={getCardData(sfRight[0])}
              variant="compact"
              onClick={onMatchClick ? () => onMatchClick(sfRight[0]!) : undefined}
            />
          ) : (
            <div className="h-16 rounded border border-white/5" />
          )}
        </div>

        {/* Right QF */}
        <div className="flex flex-col justify-around py-4">
          <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">
            QF Right
          </div>
          {qfRight.map((m, idx) =>
            m ? (
              <MatchCard
                key={m.id ?? `r3-s${m.slot}`}
                match={getCardData(m)}
                variant="compact"
                onClick={onMatchClick ? () => onMatchClick(m) : undefined}
              />
            ) : (
              <div key={`empty-qf-r-${idx}`} className="h-16 rounded border border-white/5" />
            )
          )}
        </div>

        {/* Right R16 */}
        <div className="flex flex-col justify-between py-1">
          <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">
            R16 Right
          </div>
          {r16Right.map((m, idx) =>
            m ? (
              <MatchCard
                key={m.id ?? `r2-s${m.slot}`}
                match={getCardData(m)}
                variant="compact"
                onClick={onMatchClick ? () => onMatchClick(m) : undefined}
              />
            ) : (
              <div key={`empty-r16-r-${idx}`} className="h-16 rounded border border-white/5" />
            )
          )}
        </div>
      </div>
    )
  }

  // Default: Column layout for admin draw inspection (all 5 rounds)
  const roundTitles = ['Round 1 (R32)', 'Round of 16', 'Quarter Finals', 'Semi Finals', 'Final']

  return (
    <div className="grid min-w-[1240px] grid-cols-5 gap-4 overflow-x-auto pb-4">
      {roundTitles.map((title, roundIndex) => {
        const round = roundIndex + 1
        const roundMatches = matches.filter((match) => match.round === round).sort((a, b) => a.slot - b.slot)
        return (
          <section className="flex flex-col" key={round}>
            <header className="mb-3 border-b border-white/10 pb-2">
              <p className="text-[10px] uppercase tracking-wider text-[#A3A3A3]">Round {round}</p>
              <h3 className="text-sm font-bold text-[#F5F5F5]">{title}</h3>
            </header>
            <div className="flex flex-1 flex-col justify-around gap-2">
              {roundMatches.map((match) => (
                <MatchCard
                  key={`${match.round}-${match.slot}`}
                  match={getCardData(match)}
                  variant="compact"
                  onClick={onMatchClick ? () => onMatchClick(match) : undefined}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
