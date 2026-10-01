import { useEffect, useMemo, useState } from 'react'
import { Bracket } from '../components/Bracket'
import { ConnectionBanner } from '../components/ConnectionBanner'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import type { BracketMatch, BracketPlayer } from '../lib/tournament'
import { supabase } from '../lib/supabase'

type DisplayMatch = BracketMatch & {
  id: string
  p1_racks: number
  p2_racks: number
}

type TournamentState = 'registration' | 'drawn' | 'live' | 'finished'
type Scene = 'live' | 'bracket' | 'up-next' | 'champion'

const sceneNames: Record<Scene, string> = {
  live: 'Live match',
  bracket: 'Full bracket',
  'up-next': 'Up next',
  champion: 'Champion',
}

export function DisplayPage() {
  const [players, setPlayers] = useState<BracketPlayer[]>([])
  const [matches, setMatches] = useState<DisplayMatch[]>([])
  const [tournamentState, setTournamentState] = useState<TournamentState>('registration')
  const [liveMatchId, setLiveMatchId] = useState<string | null>(null)
  const [scene, setScene] = useState<Scene>('bracket')
  const [connection, setConnection] = useState('connecting')
  const [error, setError] = useState<string | null>(null)
  const [reveal, setReveal] = useState(false)
  const online = useConnectionStatus()
  const playerById = useMemo(() => new Map(players.map((player) => [player.id, player])), [players])
  const liveMatch = matches.find((match) => match.id === liveMatchId && match.status === 'live') ?? matches.find((match) => match.status === 'live')
  const finalMatch = matches.find((match) => match.round === 5)
  const champion = finalMatch?.winner_id ? playerById.get(finalMatch.winner_id) : undefined

  async function loadDisplay() {
    const [{ data: playerData, error: playerError }, { data: matchData, error: matchError }, { data: tournamentData, error: tournamentError }] = await Promise.all([
      supabase.from('players').select('id, name, photo_url').order('created_at'),
      supabase.from('matches').select('id, round, slot, player1_id, player2_id, p1_racks, p2_racks, best_of, status, winner_id').order('round').order('slot'),
      supabase.from('tournament').select('state, live_match_id').eq('id', 1).single(),
    ])
    if (playerError || matchError || tournamentError) {
      setError(playerError?.message ?? matchError?.message ?? tournamentError?.message ?? 'The display could not load tournament data.')
      return
    }
    setError(null)
    const nextMatches = (matchData ?? []) as DisplayMatch[]
    setPlayers((playerData ?? []) as BracketPlayer[])
    setMatches(nextMatches)
    setTournamentState(tournamentData.state as TournamentState)
    setLiveMatchId(tournamentData.live_match_id)
    if (tournamentData.live_match_id) setScene('live')
    if (tournamentData.state === 'finished') setScene('champion')
    if (!tournamentData.live_match_id && tournamentData.state === 'live') setScene('up-next')
  }

  useEffect(() => {
    void loadDisplay()
    const channel = supabase.channel('public-display')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => { void loadDisplay() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => { void loadDisplay() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament' }, () => { void loadDisplay() })
      .subscribe((status) => {
        setConnection(status === 'SUBSCRIBED' ? 'connected' : status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' ? 'reconnecting' : 'connecting')
      })
    return () => { void supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (matches.length === 0) return
    setReveal(true)
    const revealTimer = window.setTimeout(() => setReveal(false), 5000)
    return () => window.clearTimeout(revealTimer)
  }, [matches.length])

  useEffect(() => {
    if (liveMatch || tournamentState === 'finished') return
    const scenes: Scene[] = ['bracket', 'up-next']
    let index = scenes.indexOf(scene)
    const timer = window.setInterval(() => {
      index = (index + 1) % scenes.length
      setScene(scenes[index])
    }, 12000)
    return () => window.clearInterval(timer)
  }, [liveMatch, scene, tournamentState])

  function nameFor(id: string | null) {
    return id ? playerById.get(id)?.name ?? 'Unknown player' : 'Waiting'
  }

  function photoFor(id: string | null) {
    return id ? playerById.get(id)?.photo_url : null
  }

  async function enterFullscreen() {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
    else await document.exitFullscreen()
  }

  function renderPlayer(id: string | null, racks: number) {
    return <div className="flex min-w-0 flex-1 flex-col items-center gap-4 text-center"><div className="grid h-40 w-40 place-items-center overflow-hidden rounded-full border-4 border-copper/70 bg-white/10 md:h-56 md:w-56">{photoFor(id) ? <img className="h-full w-full object-cover" src={photoFor(id) ?? ''} alt="" /> : <span className="font-display text-6xl text-white/30">{nameFor(id).charAt(0)}</span>}</div><h2 className="max-w-full truncate font-display text-4xl md:text-6xl">{nameFor(id)}</h2><strong className="text-8xl leading-none text-copper md:text-[10rem]">{racks}</strong></div>
  }

  function liveScene() {
    if (!liveMatch) return null
    return <section className="flex min-h-[70vh] flex-col justify-center"><p className="text-center text-sm uppercase tracking-[0.35em] text-copper">{liveMatch.round === 5 ? 'FINAL · Best of 5' : `Round ${liveMatch.round} · Best of 3`}</p><h1 className="mt-4 text-center font-display text-3xl text-white/70">Race to {raceTarget(liveMatch.best_of)}</h1><div className="mt-12 flex items-center gap-4 md:gap-12">{renderPlayer(liveMatch.player1_id, liveMatch.p1_racks)}<span className="font-display text-4xl text-white/30">vs</span>{renderPlayer(liveMatch.player2_id, liveMatch.p2_racks)}</div></section>
  }

  function upNextScene() {
    const upcoming = matches.filter((match) => match.status === 'pending' && match.player1_id && match.player2_id).slice(0, 3)
    return <section className="mx-auto max-w-4xl py-12"><p className="text-sm uppercase tracking-[0.35em] text-copper">Coming up</p><h1 className="mt-3 font-display text-6xl">Up next</h1><div className="mt-10 space-y-4">{upcoming.length ? upcoming.map((match) => <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] px-6 py-5" key={match.id}><span className="text-sm uppercase tracking-[0.2em] text-white/45">{match.round === 5 ? 'Final' : `Round ${match.round}`} · Match {match.slot + 1}</span><strong className="font-display text-3xl">{nameFor(match.player1_id)} <span className="text-copper">vs</span> {nameFor(match.player2_id)}</strong></div>) : <p className="text-xl text-white/50">The next matches will appear when the draw is ready.</p>}</div></section>
  }

  function championScene() {
    return <section className="relative grid min-h-[75vh] place-items-center overflow-hidden text-center"><div className="confetti" aria-hidden="true">{Array.from({ length: 32 }, (_, index) => <i key={index} style={{ '--i': index } as React.CSSProperties} />)}</div><div className="relative z-10">{champion?.photo_url && <img className="mx-auto h-56 w-56 rounded-full border-8 border-copper object-cover shadow-2xl" src={champion.photo_url} alt="" />}<p className="mt-8 text-sm uppercase tracking-[0.4em] text-copper">GBC Solo Champion</p><h1 className="mt-4 font-display text-7xl md:text-9xl">{champion?.name ?? 'Champion'}</h1></div></section>
  }

  return <main className={`min-h-screen bg-ink px-6 py-8 text-chalk ${reveal ? 'draw-reveal' : ''}`}>
    <ConnectionBanner online={online} message="Network offline. Waiting to reconnect..." />
    {connection !== 'connected' && <div className="fixed left-0 right-0 top-0 z-30 bg-copper px-4 py-2 text-center text-sm font-semibold text-ink">{connection === 'reconnecting' ? 'Connection lost. Reconnecting...' : 'Connecting to live tournament data...'}</div>}
    <header className="mx-auto flex max-w-[1600px] items-center justify-between"><div><p className="text-xs uppercase tracking-[0.35em] text-copper">GBC Solo</p><p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/40">{sceneNames[scene]} · {tournamentState}</p></div><button className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white hover:text-ink" onClick={() => void enterFullscreen()}>Fullscreen</button></header>
    <div className="mx-auto max-w-[1600px]">{error && <p className="mt-8 rounded-lg bg-red-500/20 px-4 py-3 text-red-100">{error}</p>}{scene === 'live' && liveScene()}{scene === 'champion' && championScene()}{scene === 'up-next' && upNextScene()}{scene === 'bracket' && <section className="mt-8"><h1 className="font-display text-6xl">Full bracket</h1><div className="mt-8 overflow-x-auto rounded-2xl bg-chalk p-5 text-ink"><Bracket matches={matches} players={players} /></div></section>}{!matches.length && <section className="grid min-h-[70vh] place-items-center text-center"><div><h1 className="font-display text-7xl">Registration open</h1><p className="mt-4 text-xl text-white/50">The tournament bracket will appear here.</p></div></section>}</div>
  </main>
}
