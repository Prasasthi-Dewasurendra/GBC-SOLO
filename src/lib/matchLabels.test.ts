import { describe, expect, it } from 'vitest'
import { matchKind, roundLabel, raceLabel } from './matchLabels'

describe('matchLabels', () => {
  it('identifies match kind correctly', () => {
    expect(matchKind({ round: 5, slot: 0 })).toBe('final')
    expect(matchKind({ round: 5, slot: 1 })).toBe('third_place')
    expect(matchKind({ round: 1, slot: 0 })).toBe('normal')
    expect(matchKind({ round: 4, slot: 0, kind: 'third_place' })).toBe('third_place')
  })

  it('provides correct round labels', () => {
    expect(roundLabel({ round: 5, slot: 0 })).toBe('FINAL')
    expect(roundLabel({ round: 5, slot: 1 })).toBe('3rd Place Play-off')
    expect(roundLabel({ round: 1, slot: 0 })).toBe('Round of 32')
    expect(roundLabel({ round: 2, slot: 0 })).toBe('Round of 16')
    expect(roundLabel({ round: 3, slot: 0 })).toBe('Quarter Final')
    expect(roundLabel({ round: 4, slot: 0 })).toBe('Semi Final')
  })

  it('provides correct race labels', () => {
    expect(raceLabel({ round: 5, slot: 0 })).toBe('Best of 5')
    expect(raceLabel({ round: 5, slot: 1, best_of: 3 })).toBe('Race to 2')
    expect(raceLabel({ round: 1, slot: 0, best_of: 3 })).toBe('Race to 2')
  })
})
