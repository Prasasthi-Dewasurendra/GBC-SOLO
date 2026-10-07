import confetti from 'canvas-confetti'
import { Clock3, Maximize, Trophy } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bracket } from '../components/Bracket'
import { PlayerAvatar } from '../components/brand/PlayerAvatar'
import { RackDisplay } from '../components/RackDisplay'
import { raceTarget, getMatchNumber, type BracketMatch, type BracketPlayer } from '../lib/tournament'
import { supabase } from '../lib/supabase'

type DisplayMatch = BracketMatch & {
  id: string
  p1_racks: number
  p2_racks: number
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

  const playerById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players])

  const roundOneMatches = useMemo(
    () => matches.filter((m) => m.round === 1).sort((a, b) => a.slot - b.slot),
    [matches]
  )
  const roundOneComplete = useMemo(
    () => roundOneMatches.length === 16 && roundOneMatches.every((m) => m.status === 'done'),
    [roundOneMatches]
  )

  const finalMatch = useMemo(() => matches.find((m) => m.round === 5), [matches])
  const champion = useMemo(
    () => (finalMatch?.status === 'done' && finalMatch?.winner_id ? playerById.get(finalMatch.winner_id) : null),
    [finalMatch, playerById]
  )

  async function loadData() {
    const [{ data: playerData }, { data: matchData }, { data: tournamentData }] = await Promise.all([
      supabase.from('players').select('id, name, photo_url').order('created_at'),
      supabase
        .from('matches')
        .select('id, round, slot, match_number, player1_id, player2_id, p1_racks, p2_racks, table_number, best_of, status, winner_id')
        .order('round')
        .order('slot'),
      supabase.from('tournament').select('state, live_match_id').eq('id', 1).single(),
    ])

    if (playerData) setPlayers(playerData as BracketPlayer[])
    if (tournamentData) setTournamentState(tournamentData.state as TournamentState)
    if (matchData) {
      const enriched = (matchData as DisplayMatch[]).map((m) => ({
        ...m,
        match_number: m.match_number ?? getMatchNumber(m.round, m.slot),
      }))

      // Check if a match went live after Round 1
      const isR1Done = enriched.filter((m) => m.round === 1).length === 16 && enriched.filter((m) => m.round === 1).every((m) => m.status === 'done')
      const postR1LiveCount = enriched.filter((m) => m.round > 1 && m.status === 'live').length

      if (isR1Done && postR1LiveCount > prevLiveMatchesCountRef.current) {
        // Trigger Scene C for at least 30 seconds
        setActiveRotatedScene('tables')
        sceneLockUntilRef.current = Date.now() + 30000
      }
      prevLiveMatchesCountRef.current = postR1LiveCount
      setMatches(enriched)
    }
  }

  // Realtime subscription
  useEffect(() => {
    void loadData()
    const channel = supabase
      .channel('display-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        void loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        void loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament' }, () => {
        void loadData()
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  // Clock timer
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  // Confetti on champion
  useEffect(() => {
    if (champion) {
      void confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.55 },
        colors: ['#C9A24B', '#F5F5F5', '#FFFFFF'],
      })
    }
  }, [champion])

  // Post Round 1 rotation: rotate Scene B (Bracket) and Scene C (Tables) every 20 seconds
  useEffect(() => {
    if (!roundOneComplete || champion) return

    const interval = window.setInterval(() => {
      // If locked into Scene C due to match going live, wait until timer expires
      if (Date.now() < sceneLockUntilRef.current) {
        setActiveRotatedScene('tables')
        return
      }

      setActiveRotatedScene((prev) => (prev === 'bracket' ? 'tables' : 'bracket'))
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

  // -------------------------------------------------------------
  // WAITING / REGISTRATION SCENE (before draw confirmed)
  // -------------------------------------------------------------
  if (tournamentState === 'registration' || matches.length === 0) {
    return (
      <main className="h-screen w-screen overflow-hidden bg-[#0A0A0A] p-8 text-[#F5F5F5] flex flex-col justify-between select-none">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-wide text-[#F5F5F5]">
              Galle Billiards Club SOLO Tournament
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#A3A3A3]">
              Player Registration & Warmup
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-[#A3A3A3]">
            <Clock3 size={16} />
            <span className="font-mono tabular-nums">
              {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button
              onClick={() => void toggleFullscreen()}
              className="rounded p-1 text-[#A3A3A3] hover:text-[#F5F5F5]"
            >
              <Maximize size={16} />
            </button>
          </div>
        </header>

        <section className="my-auto flex flex-col items-center text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-widest text-[#A3A3A3]">
            Registration Active · 32 Players Single Elimination
          </div>
          <h2 className="font-serif text-6xl font-bold text-[#F5F5F5]">Tournament Draw Imminent</h2>
          <p className="mt-3 text-lg text-[#A3A3A3]">
            {players.length} / 32 players registered. Matches will begin once the draw is confirmed.
          </p>

          <div className="mt-10 grid max-w-6xl grid-cols-8 gap-4">
            {players.slice(0, 32).map((player, idx) => (
              <div key={player.id} className="flex flex-col items-center">
                <PlayerAvatar name={player.name} photoUrl={player.photo_url} size="md" />
                <span className="mt-2 truncate max-w-[100px] text-xs font-medium text-[#A3A3A3]" title={player.name}>
                  {player.name}
                </span>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 32 - players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center opacity-30">
                <div className="h-14 w-14 rounded-full border border-dashed border-white/20 bg-white/5 flex items-center justify-center text-xs">
                  {players.length + i + 1}
                </div>
                <span className="mt-2 text-xs text-[#A3A3A3]">Waiting</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="text-center text-xs uppercase tracking-widest text-[#A3A3A3]/60">
          Official Club Broadcast Display · 1920x1080
        </footer>
      </main>
    )
  }

  // -------------------------------------------------------------
  // SCENE D: CHAMPION (Final complete)
  // -------------------------------------------------------------
  if (champion) {
    return (
      <main className="h-screen w-screen overflow-hidden bg-[#0A0A0A] p-10 text-[#F5F5F5] flex flex-col items-center justify-center text-center relative select-none">
        <button
          onClick={() => void toggleFullscreen()}
          className="absolute right-6 top-6 rounded p-2 text-[#A3A3A3] hover:text-[#F5F5F5]"
        >
          <Maximize size={18} />
        </button>

        <div className="relative z-10 flex flex-col items-center">
          <Trophy size={64} className="text-[#C9A24B] mb-4 animate-bounce" />
          <div className="rounded-full border-4 border-[#C9A24B] p-2 bg-[#121212]">
            {champion.photo_url ? (
              <img
                src={champion.photo_url}
                alt={champion.name}
                className="h-64 w-64 rounded-full object-cover"
              />
            ) : (
              <div className="h-64 w-64 rounded-full bg-[#121212] flex items-center justify-center font-serif text-7xl text-[#F5F5F5]">
                {champion.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.4em] text-[#C9A24B]">
            Tournament Champion
          </p>
          <h1 className="mt-3 font-serif text-7xl font-bold tracking-tight text-[#F5F5F5] md:text-8xl">
            {champion.name}
          </h1>
          <p className="mt-4 text-base text-[#A3A3A3]">
            Galle Billiards Club SOLO Tournament Winner
          </p>
        </div>
      </main>
    )
  }

  // -------------------------------------------------------------
  // SCENE A: ROUND 1 GRID (16 matches, 4x4 grid, fixed until R1 finishes)
  // -------------------------------------------------------------
  if (!roundOneComplete) {
    return (
      <main className="h-screen w-screen overflow-hidden bg-[#0A0A0A] p-4 text-[#F5F5F5] flex flex-col select-none">
        {/* Header Bar */}
        <header className="flex shrink-0 items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-2xl font-bold tracking-wide text-[#F5F5F5]">
              Galle Billiards Club SOLO Tournament
            </h1>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-[#A3A3A3]">
              Round 1 - Best of 3
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1E8F63]/30 bg-[#1E8F63]/10 px-3 py-1 text-xs font-semibold text-[#1E8F63]">
              <span className="live-dot h-2 w-2 rounded-full bg-[#1E8F63]" />
              LIVE
            </span>
          </div>

          {/* Table Chips: T1..T4 */}
          <div className="hidden lg:flex items-center gap-2">
            {[1, 2, 3, 4].map((t) => {
              const liveOnTable = matches.find((m) => m.status === 'live' && m.table_number === t)
              return (
                <div
                  key={t}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${
                    liveOnTable
                      ? 'border-[#1E8F63] bg-[#1E8F63]/10 text-[#1E8F63]'
                      : 'border-white/10 bg-white/5 text-[#A3A3A3]'
                  }`}
                >
                  <span className="font-bold">T{t}:</span>
                  {liveOnTable ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#1E8F63]" />
                      M{liveOnTable.match_number} LIVE
                    </span>
                  ) : (
                    <span>Free</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Clock & Fullscreen */}
          <div className="flex items-center gap-3 text-xs text-[#A3A3A3]">
            <Clock3 size={15} />
            <span className="font-mono tabular-nums text-sm">
              {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button
              onClick={() => void toggleFullscreen()}
              className="rounded p-1 text-[#A3A3A3] hover:text-[#F5F5F5]"
            >
              <Maximize size={15} />
            </button>
          </div>
        </header>

        {/* 4x4 Grid of Round 1 Cards */}
        <div className="grid flex-1 grid-cols-4 grid-rows-4 gap-3 min-h-0">
          {roundOneMatches.map((match) => {
            const p1 = playerById.get(match.player1_id ?? '')
            const p2 = playerById.get(match.player2_id ?? '')
            const isLive = match.status === 'live'
            const isDone = match.status === 'done'

            const p1Winner = isDone && match.winner_id === match.player1_id
            const p2Winner = isDone && match.winner_id === match.player2_id

            return (
              <div
                key={match.id}
                className={`rounded-lg border bg-[#121212] p-2.5 flex flex-col justify-between ${
                  isLive ? 'border-[#1E8F63]' : 'border-white/10'
                }`}
              >
                {/* Card Top: Match Number, Table badge, Status */}
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#F5F5F5]">M{match.match_number}</span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-[#A3A3A3]">
                      {match.table_number ? `T${match.table_number}` : 'Table TBA'}
                    </span>
                  </div>
                  <div>
                    {isLive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E8F63]">
                        <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#1E8F63]" />
                        LIVE
                      </span>
                    ) : isDone ? (
                      <span className="text-[10px] font-semibold text-[#A3A3A3]">DONE</span>
                    ) : (
                      <span className="text-[10px] text-[#A3A3A3]/60">PENDING</span>
                    )}
                  </div>
                </div>

                {/* Player 1 Row */}
                <div
                  className={`flex items-center justify-between gap-2.5 rounded px-2 py-1 ${
                    p1Winner ? 'bg-white/5' : ''
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#0A0A0A]">
                      {p1?.photo_url ? (
                        <img
                          src={p1.photo_url}
                          alt={nameFor(match.player1_id)}
                          className={`h-full w-full object-cover ${
                            isDone && !p1Winner ? 'opacity-40 grayscale' : ''
                          }`}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-sm text-[#A3A3A3]">
                          {nameFor(match.player1_id).slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span
                      className={`truncate text-xl font-semibold tracking-tight ${
                        p1Winner
                          ? 'text-[#F5F5F5]'
                          : isDone
                            ? 'text-[#A3A3A3]'
                            : 'text-[#F5F5F5]'
                      }`}
                      title={nameFor(match.player1_id)}
                    >
                      {nameFor(match.player1_id)}
                    </span>
                  </div>
                  <span
                    className={`font-serif text-3xl font-bold tabular-nums shrink-0 ${
                      p1Winner ? 'text-[#C9A24B]' : isDone ? 'text-[#A3A3A3]' : 'text-[#F5F5F5]'
                    }`}
                  >
                    {match.p1_racks}
                  </span>
                </div>

                {/* Player 2 Row */}
                <div
                  className={`flex items-center justify-between gap-2.5 rounded px-2 py-1 ${
                    p2Winner ? 'bg-white/5' : ''
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#0A0A0A]">
                      {p2?.photo_url ? (
                        <img
                          src={p2.photo_url}
                          alt={nameFor(match.player2_id)}
                          className={`h-full w-full object-cover ${
                            isDone && !p2Winner ? 'opacity-40 grayscale' : ''
                          }`}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-sm text-[#A3A3A3]">
                          {nameFor(match.player2_id).slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span
                      className={`truncate text-xl font-semibold tracking-tight ${
                        p2Winner
                          ? 'text-[#F5F5F5]'
                          : isDone
                            ? 'text-[#A3A3A3]'
                            : 'text-[#F5F5F5]'
                      }`}
                      title={nameFor(match.player2_id)}
                    >
                      {nameFor(match.player2_id)}
                    </span>
                  </div>
                  <span
                    className={`font-serif text-3xl font-bold tabular-nums shrink-0 ${
                      p2Winner ? 'text-[#C9A24B]' : isDone ? 'text-[#A3A3A3]' : 'text-[#F5F5F5]'
                    }`}
                  >
                    {match.p2_racks}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    )
  }

  // -------------------------------------------------------------
  // POST-ROUND 1 ROTATION OR FINAL / THIRD PLACE SCENE
  // -------------------------------------------------------------
  const liveSpecialMatch = matches.find((m) => m.status === 'live' && (m.round === 5 || m.round === 6))

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#0A0A0A] p-4 text-[#F5F5F5] flex flex-col select-none transition-opacity duration-300">
      {/* Header Bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center gap-4">
          <h1 className="font-serif text-2xl font-bold tracking-wide text-[#F5F5F5]">
            Galle Billiards Club SOLO Tournament
          </h1>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-[#A3A3A3]">
            {liveSpecialMatch ? (liveSpecialMatch.round === 5 ? 'Championship Final' : 'Third Place Playoff') : activeRotatedScene === 'bracket' ? 'Championship Bracket' : 'Live Club Tables'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border-[#1E8F63]/30 bg-[#1E8F63]/10 px-3 py-1 text-xs font-semibold text-[#1E8F63]">
            <span className="live-dot h-2 w-2 rounded-full bg-[#1E8F63]" />
            LIVE
          </span>
        </div>

        {/* Scene Indicator / Rotation info */}
        <div className="flex items-center gap-3 text-xs text-[#A3A3A3]">
          {!liveSpecialMatch && (
            <span className="rounded border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wider text-[#A3A3A3]">
              Auto-rotating: {activeRotatedScene === 'bracket' ? 'Bracket' : 'Tables'} (20s)
            </span>
          )}
          <Clock3 size={15} />
          <span className="font-mono tabular-nums text-sm">
            {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={() => void toggleFullscreen()}
            className="rounded p-1 text-[#A3A3A3] hover:text-[#F5F5F5]"
          >
            <Maximize size={15} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 min-h-0 flex flex-col">
        {liveSpecialMatch ? (
          <RackDisplay 
            matchId={liveSpecialMatch.id}
            player1Id={liveSpecialMatch.player1_id!}
            player2Id={liveSpecialMatch.player2_id!}
            p1Name={nameFor(liveSpecialMatch.player1_id)}
            p2Name={nameFor(liveSpecialMatch.player2_id)}
            p1Photo={photoFor(liveSpecialMatch.player1_id) ?? undefined}
            p2Photo={photoFor(liveSpecialMatch.player2_id) ?? undefined}
            p1Racks={liveSpecialMatch.p1_racks}
            p2Racks={liveSpecialMatch.p2_racks}
            bestOf={liveSpecialMatch.best_of}
            title={liveSpecialMatch.round === 5 ? 'Championship Final' : 'Third Place Playoff'}
          />
        ) : activeRotatedScene === 'bracket' ? (
          // Scene B: Knockout Bracket (two-halves meeting in centre)
          <div className="flex-1 min-h-0 py-1">
            <Bracket
              matches={matches.filter((m) => m.round > 1)}
              players={players}
              layout="two-halves"
            />
          </div>
        ) : (
          // Scene C: Tables (4 Cards: Table 1 to Table 4)
          <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-4">
            {[1, 2, 3, 4].map((tableNum) => {
              const liveMatch = matches.find(
                (m) => m.status === 'live' && m.table_number === tableNum
              )
              const nextPending = !liveMatch
                ? matches.find(
                    (m) => m.status === 'pending' && m.table_number === tableNum && m.player1_id && m.player2_id
                  )
                : null

              const matchToShow = liveMatch ?? nextPending
              const isLive = Boolean(liveMatch)
              const isUpNext = Boolean(!liveMatch && nextPending)
              const isFinal = matchToShow?.round === 5

              const p1 = matchToShow?.player1_id ? playerById.get(matchToShow.player1_id) : null
              const p2 = matchToShow?.player2_id ? playerById.get(matchToShow.player2_id) : null

              const borderClass = isLive
                ? 'border-[#1E8F63]'
                : isFinal
                  ? 'border-[#C9A24B]'
                  : 'border-white/10'

              return (
                <div
                  key={tableNum}
                  className={`rounded-xl border bg-[#121212] p-5 flex flex-col justify-between ${borderClass}`}
                >
                  {/* Table Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-2xl font-bold text-[#F5F5F5]">
                        Table {tableNum}
                      </span>
                      {matchToShow && (
                        <>
                          <span className="rounded bg-white/10 px-2.5 py-0.5 text-xs font-bold text-[#F5F5F5]">
                            M{matchToShow.match_number}
                          </span>
                          <span className="text-xs uppercase tracking-wider text-[#A3A3A3]">
                            {matchToShow.round === 5
                              ? 'Championship Final'
                              : matchToShow.round === 4
                                ? 'Semi Final'
                                : matchToShow.round === 3
                                  ? 'Quarter Final'
                                  : 'Round of 16'}
                          </span>
                        </>
                      )}
                    </div>

                    <div>
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1E8F63]/30 bg-[#1E8F63]/10 px-3 py-1 text-xs font-bold text-[#1E8F63]">
                          <span className="live-dot h-2 w-2 rounded-full bg-[#1E8F63]" />
                          LIVE MATCH
                        </span>
                      ) : isUpNext ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
                          Up next
                        </span>
                      ) : (
                        <span className="text-xs uppercase tracking-wider text-[#A3A3A3]">
                          Table available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Match Body */}
                  {matchToShow ? (
                    <div className="my-auto flex items-center justify-between gap-6 px-6">
                      {/* Player 1 */}
                      <div className="flex flex-1 flex-col items-center text-center min-w-0">
                        <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-white/10 bg-[#0A0A0A]">
                          {p1?.photo_url ? (
                            <img
                              src={p1.photo_url}
                              alt={nameFor(matchToShow.player1_id)}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-bold text-2xl text-[#A3A3A3]">
                              {nameFor(matchToShow.player1_id).slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <h3
                          className="mt-3 truncate max-w-full text-2xl font-bold text-[#F5F5F5]"
                          title={nameFor(matchToShow.player1_id)}
                        >
                          {nameFor(matchToShow.player1_id)}
                        </h3>
                        <div className="mt-2 font-serif text-6xl font-bold tabular-nums text-[#F5F5F5]">
                          {matchToShow.p1_racks}
                        </div>
                      </div>

                      {/* VS divider */}
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-serif text-2xl italic text-[#A3A3A3]/40">vs</span>
                        <span className="mt-2 text-xs uppercase tracking-widest text-[#A3A3A3]">
                          {matchToShow.round === 5 ? 'Race to 3' : 'Race to 2'}
                        </span>
                      </div>

                      {/* Player 2 */}
                      <div className="flex flex-1 flex-col items-center text-center min-w-0">
                        <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-white/10 bg-[#0A0A0A]">
                          {p2?.photo_url ? (
                            <img
                              src={p2.photo_url}
                              alt={nameFor(matchToShow.player2_id)}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-bold text-2xl text-[#A3A3A3]">
                              {nameFor(matchToShow.player2_id).slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <h3
                          className="mt-3 truncate max-w-full text-2xl font-bold text-[#F5F5F5]"
                          title={nameFor(matchToShow.player2_id)}
                        >
                          {nameFor(matchToShow.player2_id)}
                        </h3>
                        <div className="mt-2 font-serif text-6xl font-bold tabular-nums text-[#F5F5F5]">
                          {matchToShow.p2_racks}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="my-auto py-12 text-center text-[#A3A3A3]">
                      <p className="text-xl font-medium">Table available</p>
                      <p className="mt-1 text-xs text-[#A3A3A3]/60">
                        Assign matches from tournament control
                      </p>
                    </div>
                  )}

                  {/* Table Footer */}
                  <div className="border-t border-white/5 pt-2 text-center text-[11px] uppercase tracking-widest text-[#A3A3A3]">
                    {matchToShow?.round === 5 ? 'FINAL - Best of 5' : 'Race to 2 (Best of 3)'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
