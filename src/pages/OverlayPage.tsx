import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getBallColor } from '../lib/balls'
import { type BracketMatch } from '../lib/tournament'

type MatchRow = BracketMatch & {
  id: string
  p1_racks: number
  p2_racks: number
}

export function OverlayPage() {
  const [match, setMatch] = useState<MatchRow | null>(null)
  const [rack, setRack] = useState<{ events: { ball: number; player_id: string }[] } | null>(null)
  const [players, setPlayers] = useState<Map<string, { name: string; photo_url: string | null }>>(new Map())

  async function load() {
    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'live')
      .in('round', [5, 6])
      .limit(1)
      .single()
      
    if (matchData) {
      setMatch(matchData as MatchRow)
      
      const { data: rackData } = await supabase
        .from('racks')
        .select('events')
        .eq('match_id', matchData.id)
        .eq('status', 'playing')
        .order('rack_number', { ascending: false })
        .limit(1)
        .single()
      setRack(rackData || null)
    } else {
      setMatch(null)
      setRack(null)
    }

    const { data: playerData } = await supabase.from('players').select('id, name, photo_url')
    if (playerData) {
      setPlayers(new Map(playerData.map(p => [p.id, p])))
    }
  }

  useEffect(() => {
    void load()
    const channel = supabase.channel('overlay-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => { void load() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'racks' }, () => { void load() })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [])

  if (!match) return null // Hide overlay if no Final/ThirdPlace match is live

  const p1 = players.get(match.player1_id || '')
  const p2 = players.get(match.player2_id || '')

  const p1Potted = rack?.events.filter(e => e.player_id === match.player1_id).map(e => e.ball) || []
  const p2Potted = rack?.events.filter(e => e.player_id === match.player2_id).map(e => e.ball) || []

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent pointer-events-none flex items-end justify-center pb-12">
      {/* Overlay Bar */}
      <div className="bg-[#0A0A0A]/90 backdrop-blur-md border-t-2 border-[#C9A24B] shadow-2xl rounded-xl px-8 py-4 flex items-center justify-between gap-12 w-[1200px]">
        
        {/* Player 1 Side */}
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <div className="font-serif text-5xl font-bold text-[#C9A24B]">{match.p1_racks}</div>
          <div className="flex flex-col flex-1 min-w-0">
            <h3 className="text-[#F5F5F5] font-bold text-2xl truncate uppercase tracking-wide">{p1?.name || 'TBD'}</h3>
            <div className="flex gap-1 mt-1">
              {p1Potted.map((b, i) => (
                <div key={i} style={{ backgroundColor: getBallColor(b) }} className="w-6 h-6 rounded-full border border-black text-[10px] flex items-center justify-center text-white font-bold">
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Info */}
        <div className="flex flex-col items-center flex-shrink-0">
          <span className="text-xs text-[#C9A24B] font-bold tracking-[0.3em] uppercase">{match.round === 5 ? 'Final' : '3rd Place'}</span>
          <span className="text-[#F5F5F5] text-sm uppercase tracking-widest mt-1">Race to {Math.ceil(match.best_of / 2)}</span>
        </div>

        {/* Player 2 Side */}
        <div className="flex items-center gap-6 flex-1 min-w-0 justify-end text-right">
          <div className="flex flex-col items-end flex-1 min-w-0">
            <h3 className="text-[#F5F5F5] font-bold text-2xl truncate uppercase tracking-wide">{p2?.name || 'TBD'}</h3>
            <div className="flex gap-1 mt-1 justify-end">
              {p2Potted.map((b, i) => (
                <div key={i} style={{ backgroundColor: getBallColor(b) }} className="w-6 h-6 rounded-full border border-black text-[10px] flex items-center justify-center text-white font-bold">
                  {b}
                </div>
              ))}
            </div>
          </div>
          <div className="font-serif text-5xl font-bold text-[#C9A24B]">{match.p2_racks}</div>
        </div>
        
      </div>
    </div>
  )
}
