export interface RackState {
  groups: { p1: 'solids' | 'stripes' | null; p2: 'solids' | 'stripes' | null }
  onTable: number[]
  potted: { ball: number; by: 1 | 2; shotNo: number }[]
  winner_slot?: 1 | 2 | null
  win_reason?: string | null
}

export function displayBalls(state: RackState) {
  const isPotted = (ball: number) => !state.onTable.includes(ball) || state.potted.some(p => p.ball === ball)
  
  if (!state.groups.p1 || !state.groups.p2) {
    return {
      p1: null,
      p2: null,
      openTable: true,
      openBalls: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(b => ({ ball: b, status: isPotted(b) ? 'potted' : 'on_table' }))
    }
  }

  const p1Group = state.groups.p1 === 'solids' ? [1,2,3,4,5,6,7] : [9,10,11,12,13,14,15]
  const p2Group = state.groups.p2 === 'solids' ? [1,2,3,4,5,6,7] : [9,10,11,12,13,14,15]

  return {
    p1: p1Group.map(b => ({ ball: b, status: isPotted(b) ? 'potted' : 'on_table' })),
    p2: p2Group.map(b => ({ ball: b, status: isPotted(b) ? 'potted' : 'on_table' })),
    openTable: false,
    openBalls: []
  }
}

export function eightSlot(state: RackState, slot: 1 | 2) {
  const group = slot === 1 ? state.groups.p1 : state.groups.p2
  if (!group) return 'locked'

  const groupBalls = group === 'solids' ? [1,2,3,4,5,6,7] : [9,10,11,12,13,14,15]
  const isCleared = groupBalls.every(b => !state.onTable.includes(b))

  if (state.winner_slot === slot && state.win_reason === 'eight_ball') return 'potted_win'
  if (state.winner_slot && state.winner_slot !== slot && state.win_reason === 'eight_ball') return 'potted_loss'
  if (state.winner_slot) return 'hidden' // other win reasons

  return isCleared ? 'unlocked' : 'locked'
}
