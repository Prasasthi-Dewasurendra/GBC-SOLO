import confetti from 'canvas-confetti'
import { Clock3, Maximize, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Bracket } from '../components/Bracket'
import { MatchCard, type MatchCardData } from '../components/MatchCard'
import { ConnectionBanner } from '../components/ConnectionBanner'
import { LiveBadge } from '../components/brand/LiveBadge'
import { LogoTitle } from '../components/brand/LogoTitle'
import { PlayerAvatar } from '../components/brand/PlayerAvatar'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import type { BracketMatch, BracketPlayer } from '../lib/tournament'
import { supabase } from '../lib/supabase'

type DisplayMatch = BracketMatch & { id: string; p1_racks: number; p2_racks: number }
type TournamentState = 'registration' | 'drawn' | 'live' | 'finished'
type Scene = 'live' | 'bracket' | 'up-next' | 'champion'
const sceneNames: Record<Scene, string> = { live: 'Live match', bracket: 'Full bracket', 'up-next': 'Up next', champion: 'Champion' }

export function DisplayPage() {
  const [players, setPlayers] = useState<BracketPlayer[]>([])
  const [matches, setMatches] = useState<DisplayMatch[]>([])
  const [tournamentState, setTournamentState] = useState<TournamentState>('registration')
  const [scene, setScene] = useState<Scene>('bracket')
  const [connection, setConnection] = useState('connecting')
  const [error, setError] = useState<string | null>(null)
  const [reveal, setReveal] = useState(false)
  const [clock, setClock] = useState(() => new Date())
  const online = useConnectionStatus()
  const playerById = useMemo(() => new Map(players.map((player) => [player.id, player])), [players])
  const liveMatches = matches.filter((match) => match.status === 'live' && match.table_number)
  const finalMatch = matches.find((match) => match.round === 5)
  const champion = finalMatch?.winner_id ? playerById.get(finalMatch.winner_id) : undefined

  async function loadDisplay() {
    const [{ data: playerData, error: playerError }, { data: matchData, error: matchError }, { data: tournamentData, error: tournamentError }] = await Promise.all([
      supabase.from('players').select('id, name, photo_url').order('created_at'),
      supabase.from('matches').select('id, round, slot, player1_id, player2_id, p1_racks, p2_racks, table_number, best_of, status, winner_id').order('round').order('slot'),
      supabase.from('tournament').select('state, live_match_id').eq('id', 1).single(),
    ])
    if (playerError || matchError || tournamentError) { setError(playerError?.message ?? matchError?.message ?? tournamentError?.message ?? 'The display could not load tournament data.'); return }
    setError(null)
    const nextMatches = (matchData ?? []) as DisplayMatch[]
    const nextLiveMatches = nextMatches.filter((match) => match.status === 'live' && match.table_number)
    setPlayers((playerData ?? []) as BracketPlayer[])
    setMatches(nextMatches)
    setTournamentState(tournamentData.state as TournamentState)
    if (nextLiveMatches.length) setScene('live')
    if (tournamentData.state === 'finished') setScene('champion')
    if (!nextLiveMatches.length && tournamentData.state === 'live') setScene('up-next')
  }

  useEffect(() => {
    void loadDisplay()
    const channel = supabase.channel('public-display')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => { void loadDisplay() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => { void loadDisplay() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament' }, () => { void loadDisplay() })
      .subscribe((status) => setConnection(status === 'SUBSCRIBED' ? 'connected' : status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' ? 'reconnecting' : 'connecting'))
    return () => { void supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!matches.length) return
    setReveal(true)
    const timer = window.setTimeout(() => setReveal(false), 5000)
    return () => window.clearTimeout(timer)
  }, [matches.length])

  useEffect(() => {
    if (tournamentState !== 'finished' || !champion) return
    void confetti({ particleCount: 160, spread: 90, origin: { y: 0.55 }, colors: ['#B8902E', '#D4AF37', '#F2D675', '#0F5A3F', '#34D399'] })
  }, [tournamentState, champion])

  useEffect(() => {
    if (liveMatches.length || tournamentState === 'finished') return
    const scenes: Scene[] = ['bracket', 'up-next']
    let index = scenes.indexOf(scene)
    const timer = window.setInterval(() => { index = (index + 1) % scenes.length; setScene(scenes[index]) }, 12000)
    return () => window.clearInterval(timer)
  }, [liveMatches.length, scene, tournamentState])

  function nameFor(id: string | null) { return id ? playerById.get(id)?.name ?? 'Unknown player' : 'TBD' }
  function photoFor(id: string | null) { return id ? playerById.get(id)?.photo_url : null }
  async function enterFullscreen() { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen() }

  function asCard(match: DisplayMatch): MatchCardData {
    return { ...match, player1: match.player1_id ? playerById.get(match.player1_id) : { name: 'TBD' }, player2: match.player2_id ? playerById.get(match.player2_id) : { name: 'TBD' } }
  }

  function renderPlayer(id: string | null, racks: number) {
    return <div className="flex min-w-0 flex-1 flex-col items-center gap-5 text-center"><PlayerAvatar photoUrl={photoFor(id)} name={nameFor(id)} size="xl" ring="green" state={id ? 'normal' : 'tbd'} /><h2 className="max-w-full truncate font-display text-5xl text-warm md:text-7xl" title={nameFor(id)}>{nameFor(id)}</h2><strong className="font-display text-8xl leading-none tabular-nums text-goldLight md:text-[10rem]">{racks}</strong></div>
  }

  function liveScene() {
    if (!liveMatches.length) return null
    return <section className="flex min-h-[calc(100vh-8rem)] flex-col justify-center"><div className="flex items-center justify-center gap-3"><LiveBadge /><Badge tone="live">{liveMatches.length} tables live</Badge></div><h1 className="mt-5 text-center font-display text-4xl text-muted">Live matches</h1><div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">{liveMatches.map((match) => <div className="relative" key={match.id}><span className="absolute left-4 top-4 z-10 rounded-full border border-gold/30 bg-ink/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-goldLight">Table {match.table_number}</span><MatchCard match={asCard(match)} variant="display" /></div>)}</div></section>
  }

  function upNextScene() {
    const upcoming = matches.filter((match) => match.status === 'pending' && match.player1_id && match.player2_id).slice(0, 3)
    return <section className="mx-auto max-w-6xl py-12"><p className="text-xs uppercase tracking-[0.35em] text-gold">Coming up</p><h1 className="mt-3 font-display text-7xl">Up next</h1><div className="mt-10 grid gap-5">{upcoming.length ? upcoming.map((match) => <MatchCard key={match.id} match={asCard(match)} variant="display" />) : <p className="text-xl text-muted">The next matches will appear when the draw is ready.</p>}</div></section>
  }

  function championScene() {
    return <section className="grid min-h-[calc(100vh-8rem)] place-items-center text-center"><div className="relative z-10">{champion?.photo_url ? <img className="mx-auto h-80 w-80 rounded-full border-8 border-gold object-cover shadow-gold" src={champion.photo_url} alt={champion.name} /> : <PlayerAvatar name={champion?.name ?? 'Champion'} size="xl" ring="gold" state="winner" />}<Trophy className="mx-auto mt-8 text-goldLight" size={52} /><p className="mt-5 text-sm uppercase tracking-[0.5em] text-gold">Champion</p><h1 className="gold-text mt-3 font-display text-7xl md:text-9xl">{champion?.name ?? 'Champion'}</h1></div></section>
  }

  return <main className={`min-h-screen overflow-hidden bg-felt-gradient px-6 py-5 text-warm ${reveal ? 'draw-reveal' : ''}`}><ConnectionBanner online={online} message="Network offline. Waiting to reconnect..." />{connection !== 'connected' && <div className="fixed left-0 right-0 top-9 z-30 bg-goldDark px-4 py-2 text-center text-xs font-semibold text-warm">{connection === 'reconnecting' ? 'Realtime reconnecting...' : 'Connecting to tournament data...'}</div>}<header className="mx-auto flex max-w-[1800px] items-center justify-between border-b border-gold/20 pb-4"><LogoTitle /><div className="hidden items-center gap-3 text-muted md:flex"><Clock3 size={17} className="text-gold" /><span className="tabular-nums">{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><span className="text-gold/40">·</span><span className="text-xs uppercase tracking-[0.2em]">{sceneNames[scene]}</span></div><button className="inline-flex items-center gap-2 rounded-xl border border-gold/25 px-3 py-2 text-sm text-goldLight transition hover:bg-gold/10" onClick={() => void enterFullscreen()}><Maximize size={16} /> Fullscreen</button></header><div className="mx-auto max-w-[1800px]">{error && <p className="mt-5 rounded-xl border border-goldDark/50 bg-goldDark/15 px-4 py-3 text-goldLight">{error}</p>}{scene === 'live' && liveScene()}{scene === 'champion' && championScene()}{scene === 'up-next' && upNextScene()}{scene === 'bracket' && <section className="mt-8"><div className="mb-5 flex items-end justify-between"><div><p className="text-xs uppercase tracking-[0.35em] text-gold">Tournament bracket</p><h1 className="font-display text-6xl">Full bracket</h1></div><Badge tone={tournamentState === 'live' ? 'live' : 'pending'}>{tournamentState}</Badge></div><Card className="overflow-hidden bg-surface/60 p-5"><div className="overflow-x-auto"><Bracket matches={matches} players={players} /></div></Card></section>}{!matches.length && <section className="grid min-h-[calc(100vh-9rem)] place-items-center text-center"><div><LogoTitle /><h1 className="gold-text mt-10 font-display text-7xl">Registration open</h1><p className="mt-4 text-xl text-muted">The tournament bracket will appear here.</p></div></section>}</div></main>
}
