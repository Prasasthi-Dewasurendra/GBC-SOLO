import type { FinalVM, RackVM } from '../../components/final/FinalScene'
import { replayMatch, endLabel, type EventRow, type Rules, type Slot } from './engine'

type Meta = Pick<FinalVM, 'clubName' | 'clubSub' | 'logoUrl' | 'tournamentName' | 'dateLabel' | 'tagline'>
type Person = { name: string; photoUrl?: string | null }

/** rows = ALL rack_events rows of the Final (ordered or not). firstBreaker = who broke rack 1. */
export function toFinalVM(a: { meta: Meta; p1: Person; p2: Person; rows: EventRow[]; firstBreaker: Slot; rules?: Rules }): FinalVM {
    const m = replayMatch(a.rows, { firstBreaker: a.firstBreaker, raceTo: 3, rules: a.rules })
    const racks: RackVM[] = Array.from({ length: 5 }, (_, i) => {
        const n = i + 1, s = m.racks[i]
        if (!s) return { rackNo: n, status: m.matchWinner ? 'not_required' : 'upcoming', groups: { p1: null, p2: null }, potted: [] }
        return {
            rackNo: n, status: s.phase === 'ended' ? 'done' : 'live', winner: s.winner, endedBy: s.winReason ? endLabel(s.winReason) : null,
            groups: s.groups, potted: s.potted.map(p => p.ball), eightBy: s.eightBy,
        }
    })
    const cur = m.currentRack
    const live = cur && cur.phase !== 'ended' ? cur : null
    return {
        ...a.meta,
        p1: { ...a.p1, racksWon: m.score.p1, atTable: live?.shooter === 1, ballInHand: live?.ballInHand?.slot === 1 },
        p2: { ...a.p2, racksWon: m.score.p2, atTable: live?.shooter === 2, ballInHand: live?.ballInHand?.slot === 2 },
        racks,
    }
}