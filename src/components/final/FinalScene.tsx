import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'

interface FinalSceneProps {
  matchId: string
  p1Name: string
  p2Name: string
  p1Photo?: string
  p2Photo?: string
  p1Racks: number
  p2Racks: number
  bestOf: number
  date?: string
  rackWinners?: number[]
}

export function FinalScene({ p1Name, p2Name, p1Photo, p2Photo, p1Racks, p2Racks, bestOf = 5, date = '10 OCT 2026', rackWinners = [] }: FinalSceneProps) {
  const raceTarget = Math.ceil(bestOf / 2)
  const isComplete = p1Racks >= raceTarget || p2Racks >= raceTarget

  const getFirstName = (name: string) => name.split(' ')[0]

  return (
    <div className="w-full h-full bg-[#0A0A0A] flex flex-col font-sans relative overflow-hidden text-[#F5F5F5]">

      {/* HEADER */}
      <header className="h-[110px] w-full border-b border-white/10 flex items-center justify-between px-12 relative shrink-0">
        <div className="flex items-center gap-4 text-[#C9A24B]">
          <div className="w-16 h-16 border-2 border-[#C9A24B] flex flex-wrap p-2 rotate-45">
            <div className="w-3 h-3 rounded-full bg-[#C9A24B] m-0.5" />
            <div className="w-3 h-3 rounded-full bg-[#C9A24B] m-0.5" />
            <div className="w-3 h-3 rounded-full border border-[#C9A24B] m-0.5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-[0.2em] uppercase leading-tight">Galle<br />Billiards Club</h1>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 text-center flex flex-col items-center">
          <div className="flex items-center gap-4">
            <div className="w-16 h-[1px] bg-[#C9A24B]" />
            <h2 className="text-2xl font-bold tracking-[0.4em] text-[#F5F5F5]">FINAL</h2>
            <div className="w-16 h-[1px] bg-[#C9A24B]" />
          </div>
          <p className="text-sm tracking-[0.4em] text-[#A3A3A3] mt-2 uppercase">
            {!isComplete ? (
              <span className="inline-flex items-center gap-2 text-[#1E8F63]">
                <span className="live-dot h-2 w-2 rounded-full bg-[#1E8F63]" /> LIVE MATCH
              </span>
            ) : (
              'CHAMPIONSHIP CONCLUDED'
            )}
          </p>
        </div>

        <div className="text-sm tracking-[0.25em] text-[#A3A3A3] flex items-center gap-4">
          <span>{date}</span>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 flex px-12 py-10 justify-between items-center min-h-0">

        {/* PLAYER 1 */}
        <div className="w-[320px] flex flex-col items-center">
          <div className="w-[280px] h-[360px] rounded-2xl border border-[#C9A24B]/50 overflow-hidden bg-[#121212] relative">
            {p1Photo ? (
              <img src={p1Photo} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#A3A3A3] text-6xl font-bold bg-[#0B2A20]">
                {p1Name.slice(0, 2).toUpperCase()}
              </div>
            )}
            {p1Racks >= raceTarget && (
              <div className="absolute top-4 right-4 bg-[#C9A24B] text-[#0A0A0A] p-2 rounded-full shadow-lg">
                <Trophy size={24} />
              </div>
            )}
          </div>
          <h2 className="mt-8 text-4xl font-bold tracking-[0.1em] text-[#F5F5F5] uppercase text-center leading-tight">
            {p1Name}
          </h2>
        </div>

        {/* CENTER */}
        <div className="flex-1 flex flex-col items-center px-12 justify-center max-w-[800px]">
          <div className="text-sm tracking-[0.3em] text-[#A3A3A3] mb-6 uppercase text-center">
            Best of {bestOf} <span className="mx-2">·</span> First to {raceTarget}
          </div>

          {/* SCORES */}
          <div className="flex items-center gap-8 mb-12">
            <div className={`w-[220px] h-[220px] rounded-3xl border-2 flex items-center justify-center transition-colors ${p1Racks >= raceTarget ? 'border-[#C9A24B] bg-[#C9A24B]/10 shadow-[0_0_30px_rgba(201,162,75,0.2)]' : 'border-[#C9A24B]/30 bg-[#121212]'}`}>
              <motion.span key={p1Racks} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-serif text-[140px] font-bold text-[#C9A24B] tabular-nums leading-none">
                {p1Racks}
              </motion.span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="w-[2px] h-[60px] bg-[#C9A24B]/30" />
              <span className="font-serif text-3xl italic text-[#A3A3A3]/40">vs</span>
              <div className="w-[2px] h-[60px] bg-[#C9A24B]/30" />
            </div>
            <div className={`w-[220px] h-[220px] rounded-3xl border-2 flex items-center justify-center transition-colors ${p2Racks >= raceTarget ? 'border-[#C9A24B] bg-[#C9A24B]/10 shadow-[0_0_30px_rgba(201,162,75,0.2)]' : 'border-[#C9A24B]/30 bg-[#121212]'}`}>
              <motion.span key={p2Racks} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-serif text-[140px] font-bold text-[#C9A24B] tabular-nums leading-none">
                {p2Racks}
              </motion.span>
            </div>
          </div>

          {/* RACK TILES */}
          <div className="w-full grid grid-cols-5 gap-3">
            {Array.from({ length: bestOf }).map((_, i) => {
              const rackNo = i + 1
              const winner = rackWinners[i]
              const isCurrent = i === rackWinners.length && !isComplete
              const isFuture = i > rackWinners.length && !isComplete
              const isNotNeeded = i >= rackWinners.length && isComplete

              return (
                <div key={rackNo} className={`h-[100px] rounded-xl border flex flex-col items-center justify-center transition-colors relative ${winner ? 'border-[#1E8F63]/50 bg-[#1E8F63]/10' : isCurrent ? 'border-[#C9A24B] bg-[#C9A24B]/5' : isNotNeeded ? 'border-white/5 bg-white/5 opacity-40' : 'border-white/10 bg-[#121212]'}`}>
                  <span className={`text-[10px] tracking-[0.2em] font-bold mb-2 uppercase ${winner ? 'text-[#1E8F63]' : isCurrent ? 'text-[#C9A24B]' : 'text-[#A3A3A3]'}`}>
                    Rack {rackNo}
                  </span>
                  
                  {winner ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-[#1E8F63] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-xs font-semibold text-[#F5F5F5] uppercase tracking-wider text-center px-1">
                        {winner === 1 ? getFirstName(p1Name) : getFirstName(p2Name)}
                      </span>
                    </div>
                  ) : isCurrent ? (
                    <span className="text-[11px] font-bold text-[#C9A24B] uppercase tracking-widest animate-pulse">Live</span>
                  ) : isNotNeeded ? (
                    <span className="text-[9px] uppercase tracking-wider text-[#A3A3A3]/60 text-center">Not<br/>Needed</span>
                  ) : (
                    <span className="text-[9px] uppercase tracking-wider text-[#A3A3A3]/60">Upcoming</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* PLAYER 2 */}
        <div className="w-[320px] flex flex-col items-center">
          <div className="w-[280px] h-[360px] rounded-2xl border border-[#C9A24B]/50 overflow-hidden bg-[#121212] relative">
            {p2Photo ? (
              <img src={p2Photo} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#A3A3A3] text-6xl font-bold bg-[#0B2A20]">
                {p2Name.slice(0, 2).toUpperCase()}
              </div>
            )}
            {p2Racks >= raceTarget && (
              <div className="absolute top-4 left-4 bg-[#C9A24B] text-[#0A0A0A] p-2 rounded-full shadow-lg">
                <Trophy size={24} />
              </div>
            )}
          </div>
          <h2 className="mt-8 text-4xl font-bold tracking-[0.1em] text-[#F5F5F5] uppercase text-center leading-tight">
            {p2Name}
          </h2>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="w-full h-[60px] flex items-center justify-center gap-6 absolute bottom-0 bg-gradient-to-t from-black/80 to-transparent text-[#A3A3A3] text-[11px] tracking-[0.3em] uppercase shrink-0 pb-4">
        <div className="w-12 h-[1px] bg-[#C9A24B]/50" />
        <span>SKILL</span>
        <span className="mx-2">/</span>
        <span>STRATEGY</span>
        <span className="mx-2">/</span>
        <span>CHAMPION</span>
        <div className="w-12 h-[1px] bg-[#C9A24B]/50" />
      </footer>
    </div>
  )
}
