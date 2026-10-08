import type { FinalVM, RackVM } from './FinalScene'

const S = [1, 2, 3, 4, 5, 6, 7], T = [9, 10, 11, 12, 13, 14, 15]
const base = {
    clubName: 'GALLE', clubSub: 'Billiards Club', logoUrl: '',
    tournamentName: 'Knockout Tournament', dateLabel: '10 Oct 2026', tagline: 'Skill / Strategy / Champion',
}
const up = (n: number): RackVM => ({ rackNo: n, status: 'upcoming', groups: { p1: null, p2: null }, potted: [] })
const done = (n: number, w: 1 | 2, endedBy = '8 BALL'): RackVM => ({
    rackNo: n, status: 'done', winner: w, endedBy, eightBy: w,
    groups: w === 1 ? { p1: 'solids', p2: 'stripes' } : { p1: 'stripes', p2: 'solids' },
    potted: [...(w === 1 ? S : T), ...(w === 1 ? [9, 10, 11] : [1, 2, 3]), 8],
})
const players = (a: number, b: number, o: Partial<FinalVM['p1']> = {}) => ({
    p1: { name: 'Dilan Perera', racksWon: a, atTable: true, ...o }, p2: { name: 'Kavin Sandaru', racksWon: b },
})
const live = (n: number, g1: 'solids' | 'stripes' | null, potted: number[]): RackVM => ({
    rackNo: n, status: 'live', potted, groups: { p1: g1, p2: g1 ? (g1 === 'solids' ? 'stripes' : 'solids') : null },
})

export const fixtures: Record<string, FinalVM> = {
    open: { ...base, ...players(0, 0), racks: [live(1, null, [4]), up(2), up(3), up(4), up(5)] },
    assigned: { ...base, ...players(1, 1), racks: [done(1, 1), done(2, 2), live(3, 'solids', [1, 2, 3, 9, 10, 4]), up(4), up(5)] },
    aOnEight: { ...base, ...players(1, 1, { ballInHand: false }), racks: [done(1, 1), done(2, 2), live(3, 'solids', [...S, 9, 10]), up(4), up(5)] },
    bothOnEight: { ...base, ...players(1, 1), racks: [done(1, 1), done(2, 2), live(3, 'solids', [...S, ...T]), up(4), up(5)] },
    rackWon: { ...base, ...players(2, 1), racks: [done(1, 1), done(2, 2), { ...done(3, 1), potted: [...S, 9, 10, 8] }, up(4), up(5)] },
    final32: {
        ...base, ...players(3, 2), racks: [done(1, 1), done(2, 2), done(3, 1), done(4, 2), done(5, 1)],
        p1: { name: 'Mohamed Abdulrahman Al-Khalifa', racksWon: 3 }, p2: { name: 'Kavin Sandaru', racksWon: 2 },
    },
}