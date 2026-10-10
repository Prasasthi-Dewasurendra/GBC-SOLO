import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bracket } from '../components/Bracket'
import { FinalScene } from '../components/final/FinalScene'
import { FitScreen } from '../components/FitScreen'
import { getMatchNumber, type BracketMatch, type BracketPlayer } from '../lib/tournament'
import { supabase } from '../lib/supabase'
import { matchKind, roundLabel, raceLabel } from '../lib/matchLabels'
import { Chip, ClubMark, DisplayHeader, MatchPlayer, PhotoFrame, Score, StatusBadge } from '../display/ui'
import { displayCssVars, displayTheme } from '../display/theme'
import '../display/display.css'

type DisplayMatch = BracketMatch & {
  id: string
  p1_racks: number
  p2_racks: number
  rack_winners: number[]
}
type TournamentState = 'registration' | 'drawn' | 'live' | 'finished'

export function DisplayPage() {
  const [players, setPlayers] = useState<BracketPlayer[]>([])
  const [matches, setMatches] = useState<DisplayMatch[]>([])
  const [tournamentState, setTournamentState] = useState<TournamentState>('registration')
  const [activeRotatedScene, setActiveRotatedScene] = useState<'bracket' | 'tables'>('bracket')
  const [clock, setClock] = useState(() => new Date())
  const prevLiveMatchesCountRef = useRef(0)
  const sceneLockUntilRef = useRef<number>(0)

  const playerById = useMemo(() => new Map(players.map((player) => [player.id, player])), [players])
  const roundOneMatches = useMemo(
    () => matches.filter((match) => match.round === 1).sort((a, b) => a.slot - b.slot),
    [matches]
  )
  const roundOneComplete = useMemo(
    () => roundOneMatches.length === 16 && roundOneMatches.every((match) => match.status === 'done'),
    [roundOneMatches]
  )
  const finalMatch = useMemo(() => matches.find((match) => match.round === 5), [matches])
  const champion = useMemo(
    () => (finalMatch?.status === 'done' && finalMatch?.winner_id ? playerById.get(finalMatch.winner_id) : null),
    [finalMatch, playerById]
  )
  const runnerUp = useMemo(
    () => (finalMatch?.status === 'done' && finalMatch?.winner_id
      ? playerById.get(finalMatch.winner_id === finalMatch.player1_id ? finalMatch.player2_id! : finalMatch.player1_id!)
      : null),
    [finalMatch, playerById]
  )
  const thirdPlaceMatch = useMemo(() => matches.find((match) => matchKind(match as any) === 'third_place'), [matches])
  const thirdPlace = useMemo(
    () => (thirdPlaceMatch?.status === 'done' && thirdPlaceMatch?.winner_id ? playerById.get(thirdPlaceMatch.winner_id) : null),
    [thirdPlaceMatch, playerById]
  )

  async function loadData() {
    const [{ data: playerData }, { data: matchData }, { data: tournamentData }] = await Promise.all([
      supabase.from('players').select('id, name, photo_url').order('created_at'),
      supabase
        .from('matches')
        .select('id, round, slot, match_number, player1_id, player2_id, p1_racks, p2_racks, rack_winners, table_number, best_of, status, winner_id')
        .order('round')
        .order('slot'),
      supabase.from('tournament').select('state, live_match_id').eq('id', 1).single(),
    ])

    if (playerData) setPlayers(playerData as BracketPlayer[])
    if (tournamentData) setTournamentState(tournamentData.state as TournamentState)
    if (matchData) {
      const enriched = (matchData as DisplayMatch[]).map((match) => ({
        ...match,
        match_number: match.match_number ?? getMatchNumber(match.round, match.slot),
      }))
      const isR1Done = enriched.filter((match) => match.round === 1).length === 16 && enriched.filter((match) => match.round === 1).every((match) => match.status === 'done')
      const postR1LiveCount = enriched.filter((match) => match.round > 1 && match.status === 'live').length
      if (isR1Done && postR1LiveCount > prevLiveMatchesCountRef.current) {
        setActiveRotatedScene('tables')
        sceneLockUntilRef.current = Date.now() + 30000
      }
      prevLiveMatchesCountRef.current = postR1LiveCount
      setMatches(enriched)
    }
  }

  useEffect(() => {
    void loadData()
    const channel = supabase
      .channel('display-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => { void loadData() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => { void loadData() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament' }, () => { void loadData() })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (champion) {
      void confetti({ particleCount: 90, spread: 75, origin: { y: 0.55 }, colors: [displayTheme.colors.gold, displayTheme.colors.text, displayTheme.colors.confettiWhite] })
    }
  }, [champion])

  useEffect(() => {
    if (!roundOneComplete || champion) return
    const interval = window.setInterval(() => {
      if (Date.now() < sceneLockUntilRef.current) {
        setActiveRotatedScene('tables')
        return
      }
      setActiveRotatedScene((previous) => previous === 'bracket' ? 'tables' : 'bracket')
    }, 20000)
    return () => window.clearInterval(interval)
  }, [roundOneComplete, champion])

  function nameFor(id: string | null) {
    return id ? playerById.get(id)?.name ?? 'Unknown player' : 'TBD'
  }

  function photoFor(id: string | null) {
    return id ? playerById.get(id)?.photo_url : null
  }

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => {})
    } else {
      await document.exitFullscreen().catch(() => {})
    }
  }

  const dateText = clock.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const clockText = clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const shell = (content: React.ReactNode, sceneKey: string) => (
    <FitScreen>
      <main className="display-root" style={displayCssVars}>
        <AnimatePresence initial={false}>
          <motion.div
            className="display-scene-motion"
            key={sceneKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </main>
    </FitScreen>
  )

  if (tournamentState === 'registration' || matches.length === 0) {
    return shell(
      <section className="display-scene display-waiting">
        <DisplayHeader title="Tournament" date={clockText} onFullscreen={() => void toggleFullscreen()} live={false} />
        <div className="display-waiting__center">
          <ClubMark />
          <h2 className="display-serif display-waiting__title">Galle Billiards Club SOLO Tournament</h2>
          <p className="display-waiting__sub">Draw coming soon · {players.length} of 32 players registered</p>
          <div className="display-waiting__roster">
            {players.slice(0, 32).map((player) => (
              <div key={player.id} className="display-waiting__person">
                <PhotoFrame src={player.photo_url} name={player.name} size="sm" />
                <span title={player.name}>{player.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>,
      'waiting'
    )
  }

  if (champion) {
    return shell(
      <section className="display-scene display-champion">
        <DisplayHeader title="Tournament Champion" date={dateText} onFullscreen={() => void toggleFullscreen()} live={false} />
        <div className="display-champion__body">
          <PhotoFrame src={champion.photo_url} name={champion.name} size="xl" state="winner" />
          <p className="display-champion__label">Champion</p>
          <h2 className="display-serif display-champion__name" title={champion.name}>{champion.name}</h2>
          <div className="display-champion__podium">
            {runnerUp && <Placement player={runnerUp} label="Runner-up" />}
            {thirdPlace && <Placement player={thirdPlace} label="Third place" />}
          </div>
        </div>
      </section>,
      'champion'
    )
  }

  if (!roundOneComplete) {
    return shell(
      <section className="display-scene">
        <DisplayHeader title="Round 1" date={clockText} onFullscreen={() => void toggleFullscreen()} />
        <div className="display-round-tables">
          {[1, 2, 3, 4].map((table) => {
            const liveOnTable = matches.find((match) => match.status === 'live' && match.table_number === table)
            return <div key={table} className={`display-round-tables__item${liveOnTable ? ' display-round-tables__item--live' : ''}`}>
              <span>Table {table}</span>{liveOnTable ? <StatusBadge status="live" /> : <span>Available</span>}
            </div>
          })}
        </div>
        <div className="display-round-grid">
          {roundOneMatches.map((match) => (
            <RoundOneCard key={match.id} match={match} p1={playerById.get(match.player1_id ?? '')} p2={playerById.get(match.player2_id ?? '')} />
          ))}
        </div>
      </section>,
      'round-one'
    )
  }

  const liveSpecialMatch = matches.find((match) => match.status === 'live' && matchKind(match as any) === 'final')
  const finalPending = finalMatch?.status === 'pending' && finalMatch.player1_id && finalMatch.player2_id
  const showFinalBanner = finalPending && thirdPlaceMatch?.status === 'done'

  return shell(
    <section className="display-scene">
      <DisplayHeader
        title={liveSpecialMatch ? 'Championship Final' : activeRotatedScene === 'bracket' ? 'Championship Bracket' : 'Club Tables'}
        date={liveSpecialMatch ? dateText : clockText}
        onFullscreen={() => void toggleFullscreen()}
      />
      <div className="display-postround-content">
        {showFinalBanner && !liveSpecialMatch && activeRotatedScene === 'bracket' && <div className="display-final-up-next"><Chip variant="final">Final up next</Chip></div>}
        {liveSpecialMatch ? (
          <FinalScene
            matchId={liveSpecialMatch.id}
            p1Name={nameFor(liveSpecialMatch.player1_id)}
            p2Name={nameFor(liveSpecialMatch.player2_id)}
            p1Photo={photoFor(liveSpecialMatch.player1_id) ?? undefined}
            p2Photo={photoFor(liveSpecialMatch.player2_id) ?? undefined}
            p1Racks={liveSpecialMatch.p1_racks}
            p2Racks={liveSpecialMatch.p2_racks}
            bestOf={liveSpecialMatch.best_of}
            date={dateText}
            rackWinners={liveSpecialMatch.rack_winners}
          />
        ) : activeRotatedScene === 'bracket' ? (
          <Bracket matches={matches.filter((match) => match.round > 1)} players={players} layout="two-halves" />
        ) : (
          <div className="display-tables-grid">
            {[1, 2, 3, 4].map((tableNum) => {
              const liveMatch = matches.find((match) => match.status === 'live' && match.table_number === tableNum)
              const nextPending = !liveMatch ? matches.find((match) => match.status === 'pending' && match.table_number === tableNum && match.player1_id && match.player2_id) : null
              return <TablePanel key={tableNum} table={tableNum} match={liveMatch ?? nextPending} isLive={Boolean(liveMatch)} nameFor={nameFor} photoFor={photoFor} />
            })}
          </div>
        )}
      </div>
    </section>,
    liveSpecialMatch ? 'final' : activeRotatedScene
  )
}

function Placement({ player, label }: { player: BracketPlayer; label: string }) {
  return <div className="display-champion__place">
    <PhotoFrame src={player.photo_url} name={player.name} size="sm" />
    <div><p className="display-champion__place-label">{label}</p><p className="display-champion__place-name" title={player.name}>{player.name}</p></div>
  </div>
}

function RoundOneCard({ match, p1, p2 }: { match: DisplayMatch; p1?: BracketPlayer; p2?: BracketPlayer }) {
  const done = match.status === 'done'
  const p1Winner = done && match.winner_id === match.player1_id
  const p2Winner = done && match.winner_id === match.player2_id
  return <article className={`display-match-card${match.status === 'live' ? ' display-match-card--live' : ''}`}>
    <div className="display-match-card__top">
      <div className="display-match-card__chips"><span className="display-match-card__number">M{match.match_number}</span><Chip>{match.table_number ? `Table ${match.table_number}` : 'Table TBA'}</Chip></div>
      <StatusBadge status={match.status} />
    </div>
    <div className="display-match-card__rows">
      <MatchPlayer name={p1?.name ?? 'TBD'} photo={p1?.photo_url} score={match.p1_racks} state={p1Winner ? 'winner' : done ? 'loser' : p1 ? 'normal' : 'tbd'} />
      <MatchPlayer name={p2?.name ?? 'TBD'} photo={p2?.photo_url} score={match.p2_racks} state={p2Winner ? 'winner' : done ? 'loser' : p2 ? 'normal' : 'tbd'} />
    </div>
  </article>
}

function TablePanel({ table, match, isLive, nameFor, photoFor }: {
  table: number
  match: DisplayMatch | null | undefined
  isLive: boolean
  nameFor: (id: string | null) => string
  photoFor: (id: string | null) => string | null | undefined
}) {
  return <article className={`display-table-card${isLive ? ' display-table-card--live' : ''}`}>
    <header className="display-table-card__header">
      <div className="display-table-card__heading"><strong>Table {table}</strong>{match && <><Chip>{roundLabel(match as any)}</Chip><Chip>M{match.match_number}</Chip></>}</div>
      {isLive ? <StatusBadge status="live" /> : match ? <span className="display-status">Up next</span> : <span className="display-status">Table available</span>}
    </header>
    {match ? <div className="display-table-card__players">
      <div className="display-table-card__player"><PhotoFrame src={photoFor(match.player1_id)} name={nameFor(match.player1_id)} size="md" state={match.player1_id ? 'normal' : 'tbd'} /><span className="display-player__name" title={nameFor(match.player1_id)}>{nameFor(match.player1_id)}</span></div>
      <div className="display-table-card__vs"><Score value={match.p1_racks} /><span> : </span><Score value={match.p2_racks} /></div>
      <div className="display-table-card__player"><PhotoFrame src={photoFor(match.player2_id)} name={nameFor(match.player2_id)} size="md" state={match.player2_id ? 'normal' : 'tbd'} /><span className="display-player__name" title={nameFor(match.player2_id)}>{nameFor(match.player2_id)}</span></div>
    </div> : <div className="display-table-card__state">Table available</div>}
    <footer className="display-table-card__footer">{match ? `${roundLabel(match as any)} · ${raceLabel(match as any)} · Best of ${match.best_of}` : 'No match assigned'}</footer>
  </article>
}