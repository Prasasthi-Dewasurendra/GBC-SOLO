import { MatchCard, type MatchCardData } from './MatchCard'
import { getMatchNumber, type BracketMatch, type BracketPlayer } from '../lib/tournament'
import { Chip } from '../display/ui'

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
      player1: p1 ? { name: p1.name, photo_url: p1.photo_url } : layout === 'two-halves' ? undefined : { name: 'TBD' },
      player2: p2 ? { name: p2.name, photo_url: p2.photo_url } : layout === 'two-halves' ? undefined : { name: 'TBD' },
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
      <div className="display-bracket">
        {/* Left R16 */}
        <div className="display-bracket__column display-bracket__column--outer">
          <div className="display-bracket__round-label">
            R16 Left
          </div>
          {r16Left.map((m, idx) =>
            m ? (
              <MatchCard
                key={m.id ?? `r2-s${m.slot}`}
                match={getCardData(m)}
                variant={layout === 'two-halves' ? 'display' : 'compact'}
                onClick={onMatchClick ? () => onMatchClick(m) : undefined}
              />
            ) : (
              <div key={`empty-r16-l-${idx}`} className="display-bracket__empty" />
            )
          )}
        </div>

        {/* Left QF */}
        <div className="display-bracket__column display-bracket__column--inner">
          <div className="display-bracket__round-label">
            QF Left
          </div>
          {qfLeft.map((m, idx) =>
            m ? (
              <MatchCard
                key={m.id ?? `r3-s${m.slot}`}
                match={getCardData(m)}
                variant={layout === 'two-halves' ? 'display' : 'compact'}
                onClick={onMatchClick ? () => onMatchClick(m) : undefined}
              />
            ) : (
              <div key={`empty-qf-l-${idx}`} className="display-bracket__empty" />
            )
          )}
        </div>

        {/* Left SF */}
        <div className="display-bracket__column display-bracket__column--semi">
          <div className="display-bracket__round-label">
            Semi-Final 1
          </div>
          {sfLeft[0] ? (
            <MatchCard
              match={getCardData(sfLeft[0])}
              variant={layout === 'two-halves' ? 'display' : 'compact'}
              onClick={onMatchClick ? () => onMatchClick(sfLeft[0]!) : undefined}
            />
          ) : (
            <div className="display-bracket__empty" />
          )}
        </div>

        {/* Center Final & Third Place */}
        <div className="display-bracket__column display-bracket__column--final">
          <div>
            <div className="display-bracket__final-label">
              Championship Final
            </div>
            {finalMatch ? (
              <MatchCard
                match={getCardData(finalMatch)}
                variant={layout === 'two-halves' ? 'display' : 'compact'}
                onClick={onMatchClick ? () => onMatchClick(finalMatch) : undefined}
              />
            ) : (
              <div className="display-bracket__empty display-bracket__empty--final" />
            )}
          </div>
          <div>
            <div className="display-bracket__round-label">
              <Chip>3rd Place Play-off</Chip>
            </div>
            {thirdPlaceMatch ? (
              <div className="display-bracket__third-place">
                <MatchCard
                  match={getCardData(thirdPlaceMatch)}
                  variant={layout === 'two-halves' ? 'display' : 'compact'}
                  onClick={onMatchClick ? () => onMatchClick(thirdPlaceMatch) : undefined}
                />
              </div>
            ) : (
              <div className="display-bracket__empty" />
            )}
          </div>
        </div>

        {/* Right SF */}
        <div className="display-bracket__column display-bracket__column--semi">
          <div className="display-bracket__round-label">
            Semi-Final 2
          </div>
          {sfRight[0] ? (
            <MatchCard
              match={getCardData(sfRight[0])}
              variant={layout === 'two-halves' ? 'display' : 'compact'}
              onClick={onMatchClick ? () => onMatchClick(sfRight[0]!) : undefined}
            />
          ) : (
            <div className="display-bracket__empty" />
          )}
        </div>

        {/* Right QF */}
        <div className="display-bracket__column display-bracket__column--inner">
          <div className="display-bracket__round-label">
            QF Right
          </div>
          {qfRight.map((m, idx) =>
            m ? (
              <MatchCard
                key={m.id ?? `r3-s${m.slot}`}
                match={getCardData(m)}
                variant={layout === 'two-halves' ? 'display' : 'compact'}
                onClick={onMatchClick ? () => onMatchClick(m) : undefined}
              />
            ) : (
              <div key={`empty-qf-r-${idx}`} className="display-bracket__empty" />
            )
          )}
        </div>

        {/* Right R16 */}
        <div className="display-bracket__column display-bracket__column--outer">
          <div className="display-bracket__round-label">
            R16 Right
          </div>
          {r16Right.map((m, idx) =>
            m ? (
              <MatchCard
                key={m.id ?? `r2-s${m.slot}`}
                match={getCardData(m)}
                variant={layout === 'two-halves' ? 'display' : 'compact'}
                onClick={onMatchClick ? () => onMatchClick(m) : undefined}
              />
            ) : (
              <div key={`empty-r16-r-${idx}`} className="display-bracket__empty" />
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
