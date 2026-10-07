import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayerAvatar } from './brand/PlayerAvatar'

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
  racksData?: any[] // We will mock this if not provided
}

const SOLIDS = [1, 2, 3, 4, 5, 6, 7]
const STRIPES = [9, 10, 11, 12, 13, 14, 15]

function PoolBall({ num, size = 'md' }: { num: number; size?: 'sm' | 'md' | 'lg' }) {
  const isSolid = num >= 1 && num <= 7
  const isStripe = num >= 9 && num <= 15
  const is8 = num === 8

  const colors: Record<number, string> = {
    1: '#F4D03F', 2: '#3498DB', 3: '#E74C3C', 4: '#8E44AD', 5: '#E67E22', 6: '#2ECC71', 7: '#7B241C',
    8: '#111111',
    9: '#F4D03F', 10: '#3498DB', 11: '#E74C3C', 12: '#8E44AD', 13: '#E67E22', 14: '#2ECC71', 15: '#7B241C'
  }

  const s = size === 'sm' ? 24 : size === 'md' ? 36 : 48
  const fontSize = size === 'sm' ? 10 : size === 'md' ? 14 : 18

  return (
    <div
      style={{
        width: s, height: s,
        borderRadius: '50%',
        backgroundColor: isStripe ? '#FFFFFF' : colors[num],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset -2px -2px 6px rgba(0,0,0,0.5), 1px 1px 3px rgba(0,0,0,0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {isStripe && (
        <div style={{ position: 'absolute', width: '100%', height: '40%', top: '30%', backgroundColor: colors[num] }} />
      )}
      <div style={{
        width: s * 0.5, height: s * 0.5, backgroundColor: '#FFF', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2
      }}>
        <span style={{ color: '#000', fontSize, fontWeight: 'bold', lineHeight: 1 }}>{num}</span>
      </div>
    </div>
  )
}

export function FinalScene({ p1Name, p2Name, p1Photo, p2Photo, p1Racks, p2Racks, date = '10 OCT 2026' }: FinalSceneProps) {
  // We'll mock the racks data to match the mockup
  const mockRacks = [
    { rack: 1, p1Balls: [1,2,3,4,5,6], p2Balls: [7,8], winner: 1, label: '6 REDS' },
    { rack: 2, p1Balls: [7,8], p2Balls: [1,2,3,4,5,6], winner: 2, label: '8 BALL' },
    { rack: 3, p1Balls: [1,2,3,4,5,6], p2Balls: [7,8], winner: 1, label: '6 REDS' },
    { rack: 4, p1Balls: [7,8], p2Balls: [1,2,3,4,5,6], winner: 2, label: '8 BALL' },
    { rack: 5, p1Balls: [1,2,3,4,5,6], p2Balls: [7,8], winner: 1, label: '6 REDS' }
  ]

  return (
    <div className="w-full h-full bg-[#0A0A0A] flex flex-col font-sans relative overflow-hidden" style={{ minHeight: '1080px', minWidth: '1920px' }}>
      
      {/* HEADER */}
      <header className="h-[110px] w-full border-b border-white/10 flex items-center justify-between px-12 relative">
        <div className="flex items-center gap-4 text-[#C9A24B]">
          {/* Logo mock */}
          <div className="w-16 h-16 border-2 border-[#C9A24B] flex flex-wrap p-2 rotate-45">
            <div className="w-3 h-3 rounded-full bg-[#C9A24B] m-0.5" />
            <div className="w-3 h-3 rounded-full bg-[#C9A24B] m-0.5" />
            <div className="w-3 h-3 rounded-full border border-[#C9A24B] m-0.5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-[0.2em] uppercase leading-tight">Galle<br/>Billiards Club</h1>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 text-center flex flex-col items-center">
          <div className="flex items-center gap-4">
            <div className="w-16 h-[1px] bg-[#C9A24B]" />
            <h2 className="text-2xl font-bold tracking-[0.4em] text-[#F5F5F5]">FINAL</h2>
            <div className="w-16 h-[1px] bg-[#C9A24B]" />
          </div>
          <p className="text-sm tracking-[0.4em] text-[#A3A3A3] mt-2">TOURNAMENT</p>
        </div>

        <div className="text-sm tracking-[0.25em] text-[#A3A3A3] flex items-center gap-4">
          <span>{date}</span>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 flex px-12 py-10 justify-between">
        
        {/* PLAYER 1 */}
        <div className="w-[300px] flex flex-col items-center">
          <div className="w-full h-[360px] rounded-2xl border border-[#C9A24B]/50 overflow-hidden bg-[#121212] relative">
            {p1Photo ? (
              <img src={p1Photo} className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-[#A3A3A3] text-4xl font-bold bg-[#0B2A20] relative">
                 <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-white flex items-center justify-center">
                   <div className="w-6 h-6 rounded-full bg-black" />
                 </div>
               </div>
            )}
          </div>
          <h2 className="mt-8 text-[32px] font-bold tracking-[0.15em] text-[#F5F5F5] uppercase text-center">{p1Name}</h2>
          
          <div className="mt-8 relative w-[180px] h-[120px] flex flex-col items-center justify-center">
            {/* Hexagon shape border mock */}
            <div className="absolute inset-0 border border-[#C9A24B] opacity-50" style={{ clipPath: 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)' }} />
            <span className="font-serif text-[64px] font-bold text-[#C9A24B] tabular-nums leading-none mb-2">{p1Racks}</span>
            <span className="text-[11px] tracking-[0.2em] text-[#A3A3A3] uppercase">Racks Won</span>
          </div>
        </div>

        {/* CENTER */}
        <div className="flex-1 flex flex-col items-center px-12">
          {/* SCORES */}
          <div className="flex items-center gap-6 mb-8">
            <div className="w-[200px] h-[160px] rounded-2xl border border-[#C9A24B]/30 bg-[#121212] flex items-center justify-center">
              <motion.span key={p1Racks} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-serif text-[120px] font-bold text-[#C9A24B] tabular-nums leading-none">
                {p1Racks}
              </motion.span>
            </div>
            <div className="w-[1px] h-[100px] bg-[#C9A24B]/30" />
            <div className="w-[200px] h-[160px] rounded-2xl border border-[#C9A24B]/30 bg-[#121212] flex items-center justify-center">
              <motion.span key={p2Racks} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-serif text-[120px] font-bold text-[#C9A24B] tabular-nums leading-none">
                {p2Racks}
              </motion.span>
            </div>
          </div>
          
          <div className="text-sm tracking-[0.4em] text-[#A3A3A3] mb-8">R A C K S</div>

          {/* RACK HISTORY */}
          <div className="w-full max-w-[1000px] flex flex-col gap-4">
            {mockRacks.map((rack, idx) => (
              <div key={idx} className="h-[90px] w-full rounded-[14px] border border-white/10 bg-[#101010] flex items-center px-6 relative">
                
                {/* P1 Side */}
                <div className="flex-1 flex items-center gap-6">
                  {rack.winner === 1 ? (
                    <div className="w-8 h-8 rounded-full bg-[#1E8F63] flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-white/20" />
                  )}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {rack.p1Balls.map(b => <PoolBall key={b} num={b} size="sm" />)}
                    </div>
                    <div className="text-[#A3A3A3]/60 text-[10px] tracking-widest pl-1">
                      {rack.p1Balls.join(', ')}
                    </div>
                  </div>
                </div>

                {/* Center Label */}
                <div className="w-[120px] flex flex-col items-center justify-center px-4 shrink-0 border-x border-white/10">
                  <span className="text-[11px] tracking-[0.2em] text-[#F5F5F5]">RACK {rack.rack}</span>
                  <span className="text-[9px] tracking-widest text-[#A3A3A3] mt-1">({rack.label})</span>
                </div>

                {/* P2 Side */}
                <div className="flex-1 flex items-center justify-end gap-6">
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      {rack.p2Balls.map(b => <PoolBall key={b} num={b} size="sm" />)}
                    </div>
                    <div className="text-[#A3A3A3]/60 text-[10px] tracking-widest pr-1">
                      {rack.p2Balls.join(', ')}
                    </div>
                  </div>
                  {rack.winner === 2 ? (
                    <div className="w-8 h-8 rounded-full bg-[#1E8F63] flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-white/20" />
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* PLAYER 2 */}
        <div className="w-[300px] flex flex-col items-center">
          <div className="w-full h-[360px] rounded-2xl border border-[#C9A24B]/50 overflow-hidden bg-[#121212] relative">
            {p2Photo ? (
              <img src={p2Photo} className="w-full h-full object-cover" style={{transform: 'scaleX(-1)'}} />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-[#A3A3A3] text-4xl font-bold bg-[#0B2A20] relative">
                 <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-white flex items-center justify-center">
                   <div className="w-6 h-6 rounded-full bg-black" />
                 </div>
               </div>
            )}
          </div>
          <h2 className="mt-8 text-[32px] font-bold tracking-[0.15em] text-[#F5F5F5] uppercase text-center">{p2Name}</h2>
          
          <div className="mt-8 relative w-[180px] h-[120px] flex flex-col items-center justify-center">
            {/* Hexagon shape border mock */}
            <div className="absolute inset-0 border border-[#C9A24B] opacity-50" style={{ clipPath: 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)' }} />
            <span className="font-serif text-[64px] font-bold text-[#C9A24B] tabular-nums leading-none mb-2">{p2Racks}</span>
            <span className="text-[11px] tracking-[0.2em] text-[#A3A3A3] uppercase">Racks Won</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="w-full h-[60px] flex items-center justify-center gap-6 absolute bottom-6 text-[#A3A3A3] text-[11px] tracking-[0.3em] uppercase">
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
