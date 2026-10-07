import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getBallColor } from '../lib/balls'
import { PlayerAvatar } from './brand/PlayerAvatar'

type Event = { ball: number; player_id: string }

export function RackDisplay({ matchId, player1Id, player2Id, p1Name, p2Name, p1Photo, p2Photo, p1Racks, p2Racks, bestOf, title }: { 
  matchId: string; player1Id: string; player2Id: string; p1Name: string; p2Name: string; p1Photo?: string; p2Photo?: string; p1Racks: number; p2Racks: number; bestOf: number; title: string 
}) {
  const [rack, setRack] = useState<{ id: string; events: Event[], rack_number: number } | null>(null)

  async function loadRack() {
    const { data } = await supabase
      .from('racks')
      .select('id, events, rack_number')
      .eq('match_id', matchId)
      .eq('status', 'playing')
      .order('rack_number', { ascending: false })
      .limit(1)
      .single()
    setRack(data || null)
  }

  useEffect(() => {
    void loadRack()
    const channel = supabase.channel(`rack-display-${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'racks', filter: `match_id=eq.${matchId}` }, () => {
        void loadRack()
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [matchId])

  const p1Potted = rack?.events.filter(e => e.player_id === player1Id).map(e => e.ball) || []
  const p2Potted = rack?.events.filter(e => e.player_id === player2Id).map(e => e.ball) || []

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative p-8">
      <div className="absolute top-10 text-center">
        <h2 className="text-xl uppercase tracking-[0.3em] text-[#C9A24B] font-bold">{title}</h2>
        <p className="mt-2 text-[#A3A3A3] text-sm uppercase tracking-widest">Best of {bestOf} · Race to {Math.ceil(bestOf / 2)}</p>
        {rack && <p className="mt-4 inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono">RACK {rack.rack_number}</p>}
      </div>

      <div className="w-full max-w-5xl flex items-center justify-between gap-12 mt-20">
        {/* Player 1 */}
        <div className="flex-1 flex flex-col items-center text-center">
          <div className="relative">
            <PlayerAvatar name={p1Name} photoUrl={p1Photo} size="lg" />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#121212] border-2 border-white/20 rounded-lg px-4 py-1 font-serif text-3xl font-bold">
              {p1Racks}
            </div>
          </div>
          <h3 className="mt-8 text-4xl font-bold text-[#F5F5F5] truncate max-w-full">{p1Name}</h3>
          
          {/* Balls Potted */}
          <div className="mt-12 h-16 flex gap-3 justify-center">
            {p1Potted.map((b, i) => (
              <div key={i} style={{ backgroundColor: getBallColor(b) }} className="w-12 h-12 rounded-full border-2 border-[#121212] shadow-xl flex items-center justify-center font-bold text-white text-lg">
                {b}
              </div>
            ))}
            {p1Potted.length === 0 && <span className="text-[#A3A3A3] text-sm uppercase tracking-widest mt-3">No Balls Potted</span>}
          </div>
        </div>

        <div className="font-serif text-5xl italic text-[#A3A3A3]/20 flex-shrink-0">vs</div>

        {/* Player 2 */}
        <div className="flex-1 flex flex-col items-center text-center">
          <div className="relative">
            <PlayerAvatar name={p2Name} photoUrl={p2Photo} size="lg" />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#121212] border-2 border-white/20 rounded-lg px-4 py-1 font-serif text-3xl font-bold">
              {p2Racks}
            </div>
          </div>
          <h3 className="mt-8 text-4xl font-bold text-[#F5F5F5] truncate max-w-full">{p2Name}</h3>
          
          {/* Balls Potted */}
          <div className="mt-12 h-16 flex gap-3 justify-center">
            {p2Potted.map((b, i) => (
              <div key={i} style={{ backgroundColor: getBallColor(b) }} className="w-12 h-12 rounded-full border-2 border-[#121212] shadow-xl flex items-center justify-center font-bold text-white text-lg">
                {b}
              </div>
            ))}
            {p2Potted.length === 0 && <span className="text-[#A3A3A3] text-sm uppercase tracking-widest mt-3">No Balls Potted</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
