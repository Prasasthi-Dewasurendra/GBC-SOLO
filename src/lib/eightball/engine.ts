/* 8-BALL RULES ENGINE (pure TypeScript, no React, no Supabase).
   State is never stored: it is REPLAYED from an append-only list of events.
   UNDO = delete the last event row. Both /admin and /display call the same code. */

export type Slot = 1 | 2
export type Group = 'solids' | 'stripes'
export const SOLIDS = [1, 2, 3, 4, 5, 6, 7]
export const STRIPES = [9, 10, 11, 12, 13, 14, 15]
export const ALL_BALLS = [...SOLIDS, 8, ...STRIPES]
export const other = (s: Slot): Slot => (s === 1 ? 2 : 1)
export const groupOf = (b: number): Group | 'eight' => (b === 8 ? 'eight' : b < 8 ? 'solids' : 'stripes')
export const ballsOf = (g: Group) => (g === 'solids' ? SOLIDS : STRIPES)
export const isCleared = (g: Group | null, potted: number[]) => !!g && ballsOf(g).every(b => potted.includes(b))

/* Club switches: change here, nowhere else. */
export type Rules = {
    eightOnBreak: 'respot_or_rerack' | 'win' | 'loss'
    foulGivesBallInHand: 'anywhere' | 'kitchen'
    breakerNextRack: 'alternate' | 'winner' | 'loser'
}
export const DEFAULT_RULES: Rules = { eightOnBreak: 'respot_or_rerack', foulGivesBallInHand: 'anywhere', breakerNextRack: 'alternate' }

export type FoulType = 'scratch' | 'wrong_first_contact' | 'no_cushion' | 'ball_off_table' | 'other'
export type WinReason = 'eight_ball' | 'opponent_foul_on_eight' | 'eight_early' | 'eight_off_table' | 'forfeit' | 'manual'

export type RackEvent =
    | { type: 'BREAK'; by: Slot; pottedBalls: number[]; scratch?: boolean; legal?: boolean; eightChoice?: 'respot' | 'rerack'; illegalChoice?: 'accept' | 'rerack' }
    | { type: 'SHOT'; by: Slot; pottedBalls: number[]; foul?: FoulType | null; eightOffTable?: boolean; chosenGroup?: Group }
    | { type: 'SWAP_GROUPS' }
    | { type: 'FORFEIT'; loser: Slot }
    | { type: 'AWARD'; winner: Slot }
    | { type: 'RERACK' }

export type RackState = {
    rackNo: number
    breaker: Slot
    shooter: Slot
    phase: 'break' | 'play' | 'ended'
    potted: { ball: number; by: Slot }[]        // every ball down this rack, by whoever potted it
    groups: { p1: Group | null; p2: Group | null } // null = table open
    ballInHand: null | { slot: Slot; zone: 'anywhere' | 'behind_head_string' }
    fouls: { p1: number; p2: number }
    winner: Slot | null
    winReason: WinReason | null
    eightBy: Slot | null
}

export const newRack = (rackNo: number, breaker: Slot): RackState => ({
    rackNo, breaker, shooter: breaker, phase: 'break', potted: [],
    groups: { p1: null, p2: null }, ballInHand: null, fouls: { p1: 0, p2: 0 },
    winner: null, winReason: null, eightBy: null,
})

export const pottedBalls = (s: RackState) => s.potted.map(p => p.ball)
export const onTable = (s: RackState) => ALL_BALLS.filter(b => !pottedBalls(s).includes(b))
export const groupOfSlot = (s: RackState, slot: Slot) => (slot === 1 ? s.groups.p1 : s.groups.p2)
export const isOpenTable = (s: RackState) => !s.groups.p1 && !s.groups.p2
/** Is this player allowed to aim at the 8 right now? */
export const onTheEight = (s: RackState, slot: Slot) => isCleared(groupOfSlot(s, slot), pottedBalls(s))

/** What the UI must ask BEFORE it sends the event. */
export function breakDecision(ev: Extract<RackEvent, { type: 'BREAK' }>, rules = DEFAULT_RULES): 'eight_choice' | 'illegal_choice' | null {
    if (ev.pottedBalls.includes(8) && rules.eightOnBreak === 'respot_or_rerack') return 'eight_choice'
    if (ev.legal === false && ev.pottedBalls.length === 0) return 'illegal_choice'
    return null
}
export function needsGroupChoice(s: RackState, pots: number[]) {
    if (!isOpenTable(s)) return false
    const gs = new Set(pots.filter(b => b !== 8).map(groupOf))
    return gs.size === 2
}

const clone = (s: RackState): RackState => JSON.parse(JSON.stringify(s))
const setGroup = (s: RackState, slot: Slot, g: Group) => {
    const opp: Group = g === 'solids' ? 'stripes' : 'solids'
    s.groups = slot === 1 ? { p1: g, p2: opp } : { p1: opp, p2: g }
}
const end = (s: RackState, winner: Slot, reason: WinReason) => { s.phase = 'ended'; s.winner = winner; s.winReason = reason; s.ballInHand = null }

export function applyEvent(prev: RackState, ev: RackEvent, rules: Rules = DEFAULT_RULES): RackState {
    if (ev.type === 'RERACK') return newRack(prev.rackNo, prev.breaker)
    const s = clone(prev)
    if (s.phase === 'ended') return s

    switch (ev.type) {
        case 'SWAP_GROUPS': {
            const { p1, p2 } = s.groups; s.groups = { p1: p2, p2: p1 }; return s
        }
        case 'FORFEIT': end(s, other(ev.loser), 'forfeit'); return s
        case 'AWARD': end(s, ev.winner, 'manual'); return s

        case 'BREAK': {
            const by = ev.by, opp = other(by)
            let pots = [...ev.pottedBalls]
            if (pots.includes(8)) {
                if (rules.eightOnBreak === 'win') { s.potted.push(...pots.map(ball => ({ ball, by }))); s.eightBy = by; end(s, ev.scratch ? opp : by, ev.scratch ? 'eight_early' : 'eight_ball'); return s }
                if (rules.eightOnBreak === 'loss') { s.potted.push(...pots.map(ball => ({ ball, by }))); s.eightBy = by; end(s, opp, 'eight_early'); return s }
                if (ev.eightChoice === 'rerack') return newRack(prev.rackNo, prev.breaker)
                pots = pots.filter(b => b !== 8) // re-spotted: the 8 goes back on the table
            }
            s.phase = 'play'
            if (ev.legal === false && pots.length === 0) {
                if (ev.illegalChoice === 'rerack') return newRack(prev.rackNo, prev.breaker)
                s.shooter = opp; return s // opponent accepts the table
            }
            s.potted.push(...pots.map(ball => ({ ball, by }))) // break pots NEVER assign groups
            if (ev.scratch) {
                s.fouls[by === 1 ? 'p1' : 'p2']++
                s.ballInHand = { slot: opp, zone: 'behind_head_string' }; s.shooter = opp
            } else s.shooter = pots.length > 0 ? by : opp
            return s
        }

        case 'SHOT': {
            const by = ev.by, opp = other(by)
            const before = pottedBalls(s)
            const mine = groupOfSlot(s, by)
            s.phase = 'play'; s.shooter = by; s.ballInHand = null
            const pots = ev.pottedBalls
            const eight = pots.includes(8) || !!ev.eightOffTable

            if (eight) {
                const foul = !!ev.foul || !!ev.eightOffTable
                const legal = !!mine && isCleared(mine, before) && !foul // group must be cleared BEFORE this shot
                s.potted.push(...pots.filter(b => b !== 8).map(ball => ({ ball, by })), { ball: 8, by })
                s.eightBy = by
                end(s, legal ? by : opp, legal ? 'eight_ball' : ev.eightOffTable ? 'eight_off_table' : foul ? 'opponent_foul_on_eight' : 'eight_early')
                return s
            }

            s.potted.push(...pots.map(ball => ({ ball, by })))
            if (ev.foul) { // foul: no group assignment, turn passes, ball in hand
                s.fouls[by === 1 ? 'p1' : 'p2']++
                s.ballInHand = { slot: opp, zone: rules.foulGivesBallInHand }; s.shooter = opp
                return s
            }
            if (isOpenTable(s) && pots.length > 0) {
                const gs = [...new Set(pots.map(groupOf))] as Group[]
                setGroup(s, by, gs.length === 1 ? gs[0] : ev.chosenGroup ?? (groupOf(pots[0]) as Group))
            }
            const g = groupOfSlot(s, by)
            s.shooter = pots.some(b => groupOf(b) === g) ? by : opp // continue only after potting own group
            return s
        }
    }
}

/* ---------- replay a whole rack / a whole match from stored event rows ---------- */
export type EventRow = { rack_no: number; seq: number; type: RackEvent['type']; payload: any }
export const rowToEvent = (r: EventRow): RackEvent => ({ ...(r.payload ?? {}), type: r.type }) as RackEvent

export function replayRack(rackNo: number, breaker: Slot, events: RackEvent[], rules = DEFAULT_RULES) {
    return events.reduce((s, e) => applyEvent(s, e, rules), newRack(rackNo, breaker))
}

export function replayMatch(rows: EventRow[], o: { firstBreaker: Slot; raceTo?: number; rules?: Rules }) {
    const rules = o.rules ?? DEFAULT_RULES, raceTo = o.raceTo ?? 3
    const sorted = [...rows].sort((a, b) => a.rack_no - b.rack_no || a.seq - b.seq)
    const racks: RackState[] = []
    const score = { p1: 0, p2: 0 }
    let breaker = o.firstBreaker
    let matchWinner: Slot | null = null
    for (let n = 1; n <= raceTo * 2 - 1; n++) {
        const s = replayRack(n, breaker, sorted.filter(r => r.rack_no === n).map(rowToEvent), rules)
        racks.push(s)
        if (s.phase !== 'ended') break
        score[s.winner === 1 ? 'p1' : 'p2']++
        if (score.p1 >= raceTo || score.p2 >= raceTo) { matchWinner = score.p1 >= raceTo ? 1 : 2; break }
        breaker = rules.breakerNextRack === 'winner' ? s.winner! : rules.breakerNextRack === 'loser' ? other(s.winner!) : other(s.breaker)
    }
    return { racks, score, matchWinner, currentRack: racks[racks.length - 1] }
}

export const endLabel = (r: WinReason | null) =>
    ({ eight_ball: '8 BALL', opponent_foul_on_eight: 'FOUL ON 8', eight_early: '8 EARLY', eight_off_table: '8 OFF TABLE', forfeit: 'FORFEIT', manual: 'AWARDED' } as const)[r ?? 'manual'] ?? ''

/** Plain-English sentence for the confirm dialog. */
export function explainEnd(s: RackState, names: { p1: string; p2: string }) {
    if (s.phase !== 'ended' || !s.winner) return ''
    const w = s.winner === 1 ? names.p1 : names.p2, l = s.winner === 1 ? names.p2 : names.p1
    switch (s.winReason) {
        case 'eight_ball': return `${w} cleared the group and potted the 8, so ${w} wins the rack.`
        case 'eight_early': return `${l} potted the 8 before clearing the group, so ${w} wins the rack.`
        case 'opponent_foul_on_eight': return `${l} fouled while potting the 8, so ${w} wins the rack.`
        case 'eight_off_table': return `${l} knocked the 8 off the table, so ${w} wins the rack.`
        case 'forfeit': return `${l} forfeited the rack, so ${w} wins.`
        default: return `${w} was awarded the rack.`
    }
}