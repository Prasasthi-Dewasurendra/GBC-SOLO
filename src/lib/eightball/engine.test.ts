import { describe, it, expect } from 'vitest'
import { applyEvent, newRack, replayMatch, replayRack, isOpenTable, onTheEight, pottedBalls, breakDecision, needsGroupChoice, SOLIDS, STRIPES, type RackEvent, type EventRow } from './engine'
import { toFinalVM } from './toFinalVM'

const run = (evs: RackEvent[], breaker: 1 | 2 = 1) => replayRack(1, breaker, evs)
const brk = (o: Partial<Extract<RackEvent, { type: 'BREAK' }>> = {}): RackEvent => ({ type: 'BREAK', by: 1, pottedBalls: [], legal: true, ...o })
const shot = (by: 1 | 2, pottedBalls: number[], o: any = {}): RackEvent => ({ type: 'SHOT', by, pottedBalls, ...o })

describe('break', () => {
    it('break pots never assign groups; breaker continues', () => {
        const s = run([brk({ pottedBalls: [3, 12] })])
        expect(isOpenTable(s)).toBe(true); expect(s.shooter).toBe(1); expect(pottedBalls(s)).toEqual([3, 12])
    })
    it('no pot, legal: turn passes', () => expect(run([brk()]).shooter).toBe(2))
    it('scratch: opponent gets ball in hand behind the head string', () => {
        const s = run([brk({ pottedBalls: [2], scratch: true })])
        expect(s.shooter).toBe(2); expect(s.ballInHand).toEqual({ slot: 2, zone: 'behind_head_string' }); expect(s.fouls.p1).toBe(1)
    })
    it('illegal break: accept table or re-rack', () => {
        const ev = brk({ legal: false }); expect(breakDecision(ev as any)).toBe('illegal_choice')
        expect(run([{ ...ev, illegalChoice: 'accept' } as any]).shooter).toBe(2)
        expect(run([{ ...ev, illegalChoice: 'rerack' } as any]).phase).toBe('break')
    })
    it('8 on the break: respot continues, rerack resets', () => {
        expect(breakDecision(brk({ pottedBalls: [8] }) as any)).toBe('eight_choice')
        const a = run([brk({ pottedBalls: [8, 4], eightChoice: 'respot' })]); expect(pottedBalls(a)).toEqual([4]); expect(a.phase).toBe('play')
        expect(run([brk({ pottedBalls: [8], eightChoice: 'rerack' })]).potted).toEqual([])
    })
})

describe('groups', () => {
    it('first legal pot after the break assigns groups', () => {
        const s = run([brk({ pottedBalls: [12] }), shot(1, [3])])
        expect(s.groups).toEqual({ p1: 'solids', p2: 'stripes' }); expect(s.shooter).toBe(1)
    })
    it('player 2 potting a stripe makes player 2 stripes', () => {
        const s = run([brk(), shot(2, [10])]); expect(s.groups).toEqual({ p1: 'solids', p2: 'stripes' })
    })
    it('both groups in one shot needs a choice', () => {
        expect(needsGroupChoice(run([brk()]), [2, 11])).toBe(true)
        const s = run([brk(), shot(2, [2, 11], { chosenGroup: 'stripes' })]); expect(s.groups.p2).toBe('stripes')
    })
    it('a foul shot never assigns groups, gives ball in hand', () => {
        const s = run([brk(), shot(2, [5], { foul: 'scratch' })])
        expect(isOpenTable(s)).toBe(true); expect(s.shooter).toBe(1); expect(s.ballInHand?.slot).toBe(1)
    })
})

describe('turns', () => {
    it('only opponent ball potted: turn passes, ball stays down', () => {
        const s = run([brk({ pottedBalls: [1] }), shot(1, [3]), shot(1, [10])])
        expect(s.shooter).toBe(2); expect(pottedBalls(s)).toContain(10)
    })
    it('own + opponent ball in one shot: turn continues', () => expect(run([brk({ pottedBalls: [1] }), shot(1, [3]), shot(1, [4, 10])]).shooter).toBe(1))
    it('miss passes the turn', () => expect(run([brk({ pottedBalls: [1] }), shot(1, [])]).shooter).toBe(2))
})

describe('8-ball', () => {
    const cleared = [brk({ pottedBalls: [9] }), shot(1, [1]), shot(1, [2]), shot(1, [3]), shot(1, [4]), shot(1, [5]), shot(1, [6]), shot(1, [7])]
    it('unlocks the 8 only after the whole group is down', () => {
        expect(onTheEight(run(cleared), 1)).toBe(true); expect(onTheEight(run(cleared), 2)).toBe(false)
    })
    it('legal 8 wins the rack', () => {
        const s = run([...cleared, shot(1, [8])]); expect(s.winner).toBe(1); expect(s.winReason).toBe('eight_ball'); expect(s.phase).toBe('ended')
    })
    it('8 before clearing the group loses', () => {
        const s = run([brk({ pottedBalls: [9] }), shot(1, [1]), shot(1, [8])]); expect(s.winner).toBe(2); expect(s.winReason).toBe('eight_early')
    })
    it('8 on the same shot as the last ball loses', () => {
        const s = run([brk({ pottedBalls: [9] }), shot(1, [1]), shot(1, [2]), shot(1, [3]), shot(1, [4]), shot(1, [5]), shot(1, [6]), shot(1, [7, 8])])
        expect(s.winner).toBe(2)
    })
    it('8 with a scratch loses; 8 off the table loses', () => {
        expect(run([...cleared, shot(1, [8], { foul: 'scratch' })]).winReason).toBe('opponent_foul_on_eight')
        expect(run([...cleared, shot(1, [], { eightOffTable: true })]).winner).toBe(2)
    })
    it('opponent potting my balls counts: group clears when all 7 are down by anyone', () => {
        const s = run([brk({ pottedBalls: [9] }), shot(1, [1]), shot(2, [2, 3, 4, 5, 6, 7], { foul: 'other' })]); expect(onTheEight(s, 1)).toBe(true)
    })
    it('forfeit / award / swap / rerack', () => {
        expect(run([{ type: 'FORFEIT', loser: 1 }]).winner).toBe(2)
        expect(run([{ type: 'AWARD', winner: 1 }]).winReason).toBe('manual')
        expect(run([brk({ pottedBalls: [9] }), shot(1, [1]), { type: 'SWAP_GROUPS' }]).groups.p1).toBe('stripes')
        expect(run([brk({ pottedBalls: [9] }), { type: 'RERACK' }]).potted).toEqual([])
    })
})

describe('match', () => {
    const mk = (rack_no: number, evs: RackEvent[]): EventRow[] => evs.map((e, i) => ({ rack_no, seq: i + 1, type: e.type, payload: e }))
    const win1 = [brk({ pottedBalls: [9] }), shot(1, [1]), shot(1, [2]), shot(1, [3]), shot(1, [4]), shot(1, [5]), shot(1, [6]), shot(1, [7]), shot(1, [8])]
    const win2 = (by: 1 | 2) => win1.map(e => (e.type === 'SHOT' ? { ...e, by } : { ...e, by })) as RackEvent[]
    it('alternates the breaker; best of 5 ends at 3', () => {
        const rows = [...mk(1, win1), ...mk(2, [{ type: 'AWARD', winner: 2 }]), ...mk(3, [{ type: 'AWARD', winner: 1 }]), ...mk(4, [{ type: 'AWARD', winner: 1 }])]
        const m = replayMatch(rows, { firstBreaker: 1, raceTo: 3 })
        expect(m.score).toEqual({ p1: 3, p2: 1 }); expect(m.matchWinner).toBe(1); expect(m.racks.map(r => r.breaker)).toEqual([1, 2, 1, 2])
    })
    it('undo = drop the last event', () => {
        const full = mk(1, win1), undone = full.slice(0, -1)
        expect(replayMatch(full, { firstBreaker: 1 }).score.p1).toBe(1); expect(replayMatch(undone, { firstBreaker: 1 }).score.p1).toBe(0)
    })
    it('toFinalVM builds 5 rack rows from events', () => {
        const vm = toFinalVM({
            meta: { clubName: 'G', clubSub: 'B', tournamentName: 'T', dateLabel: 'd', tagline: 't' }, p1: { name: 'A' }, p2: { name: 'B' },
            rows: [...mk(1, win1), ...mk(2, [brk({ by: 2, pottedBalls: [3] })])], firstBreaker: 1
        })
        expect(vm.racks.map(r => r.status)).toEqual(['done', 'live', 'upcoming', 'upcoming', 'upcoming'])
        expect(vm.racks[0].groups).toEqual({ p1: 'solids', p2: 'stripes' }); expect(vm.p1.racksWon).toBe(1); expect(vm.p2.atTable).toBe(true) // player 2 breaks rack 2 and potted, so keeps the table
        expect(vm.racks[1].potted).toEqual([3]); expect(vm.racks[1].groups.p1).toBeNull()
    })
})