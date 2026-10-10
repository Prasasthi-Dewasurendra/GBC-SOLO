export function matchKind(m: { round: number, slot: number, kind?: string }): 'third_place' | 'final' | 'normal' {
  if (m.kind === 'third_place' || (m.round === 5 && m.slot === 1)) return 'third_place'
  if (m.kind === 'final' || (m.round === 5 && m.slot === 0)) return 'final'
  return 'normal'
}

export function roundLabel(m: { round: number, slot: number, kind?: string }): string {
  const kind = matchKind(m)
  if (kind === 'third_place') return '3rd Place Play-off'
  if (kind === 'final') return 'FINAL'
  
  switch (m.round) {
    case 1: return 'Round of 32'
    case 2: return 'Round of 16'
    case 3: return 'Quarter Final'
    case 4: return 'Semi Final'
    default: return ''
  }
}

export function raceLabel(m: { round: number, slot: number, best_of?: number, kind?: string }): string {
  if (m.best_of === 5 || matchKind(m) === 'final') return 'Best of 5'
  return 'Race to 2'
}
