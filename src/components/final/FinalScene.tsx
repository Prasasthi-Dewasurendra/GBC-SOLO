import { Check } from 'lucide-react'
import { Chip, PhotoFrame, Score, StatusBadge } from '../../display/ui'
import '../../display/display.css'

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

export function FinalScene({ p1Name, p2Name, p1Photo, p2Photo, p1Racks, p2Racks, bestOf = 5, rackWinners = [] }: FinalSceneProps) {
  const target = Math.ceil(bestOf / 2)
  const isComplete = p1Racks >= target || p2Racks >= target
  const p1Tone = p1Racks >= target || (isComplete && p1Racks > p2Racks) ? 'winner' : isComplete ? 'loser' : 'live'
  const p2Tone = p2Racks >= target || (isComplete && p2Racks > p1Racks) ? 'winner' : isComplete ? 'loser' : 'live'

  return <section className="display-final">
    <div className="display-final__players">
      <div className="display-final__player">
        <PhotoFrame src={p1Photo} name={p1Name} size="xl" state={p1Tone === 'winner' ? 'winner' : p1Tone === 'loser' ? 'loser' : 'normal'} />
        <h2 title={p1Name}>{p1Name}</h2>
      </div>
      <div className="display-final__center">
        <StatusBadge status={isComplete ? 'done' : 'live'} />
        <div className="display-final__scoreboard">
          <div className="display-final__score-box"><Score value={p1Racks} tone={p1Tone} size="large" /></div>
          <span className="display-final__colon">:</span>
          <div className="display-final__score-box"><Score value={p2Racks} tone={p2Tone} size="large" /></div>
        </div>
        <Chip variant="final">Best of {bestOf} · First to {target}</Chip>
      </div>
      <div className="display-final__player">
        <PhotoFrame src={p2Photo} name={p2Name} size="xl" state={p2Tone === 'winner' ? 'winner' : p2Tone === 'loser' ? 'loser' : 'normal'} />
        <h2 title={p2Name}>{p2Name}</h2>
      </div>
    </div>
    <div className="display-final__racks">
      {Array.from({ length: bestOf }).map((_, index) => {
        const rackNumber = index + 1
        const winner = rackWinners[index]
        const isCurrent = index === rackWinners.length && !isComplete
        const isUpcoming = index > rackWinners.length && !isComplete
        const isUnused = index >= rackWinners.length && isComplete
        return <div key={rackNumber} className="display-final__rack">
          <span className="display-final__rack-label">Rack {rackNumber}</span>
          {winner ? <span className="display-final__rack-result"><Check size={20} strokeWidth={1.5} /><span>{winner === 1 ? p1Name : p2Name}</span></span>
            : isCurrent ? <span className="display-final__rack-live">Live</span>
              : isUnused ? <span className="display-final__rack-muted">Not needed</span>
                : isUpcoming ? <span className="display-final__rack-muted">Upcoming</span>
                  : <span className="display-final__rack-muted">Upcoming</span>}
        </div>
      })}
    </div>
  </section>
}