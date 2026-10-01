import { describe, expect, it } from 'vitest'
import { advance, buildBracket, raceTarget, shuffle, type BracketPlayer } from './tournament'

const players: BracketPlayer[] = Array.from({ length: 32 }, (_, index) => ({ id: `p${index + 1}`, name: `Player ${index + 1}` }))

function predictableRandom() {
  return 0
}

describe('raceTarget', () => {
  it('returns the first-to target for each match format', () => {
    expect(raceTarget(3)).toBe(2)
    expect(raceTarget(5)).toBe(3)
  })
})

describe('shuffle', () => {
  it('returns every item once without changing the original array', () => {
    const original = [1, 2, 3, 4]
    const result = shuffle(original, predictableRandom)
    expect(result).toHaveLength(original.length)
    expect([...result].sort()).toEqual(original)
    expect(original).toEqual([1, 2, 3, 4])
  })
})

describe('buildBracket', () => {
  it('creates 31 matches and pairs all 32 players in round one', () => {
    const bracket = buildBracket(players, predictableRandom)
    expect(bracket).toHaveLength(31)
    expect(bracket.filter((match) => match.round === 1)).toHaveLength(16)
    expect(bracket.filter((match) => match.round === 5)[0].best_of).toBe(5)
    expect(bracket.filter((match) => match.round < 5).every((match) => match.best_of === 3)).toBe(true)
    expect(bracket.filter((match) => match.round === 1).flatMap((match) => [match.player1_id, match.player2_id])).toHaveLength(32)
  })

  it('rejects a player list that is not exactly 32', () => {
    expect(() => buildBracket(players.slice(0, 31), predictableRandom)).toThrow('exactly 32')
  })
})

describe('advance', () => {
  it('places an even-slot winner in player one of the next match', () => {
    const bracket = buildBracket(players, predictableRandom)
    const advanced = advance(bracket, 1, 0, bracket[0].player1_id!)
    expect(advanced.find((match) => match.round === 2 && match.slot === 0)?.player1_id).toBe('p2')
  })

  it('places an odd-slot winner in player two of the next match', () => {
    const bracket = buildBracket(players, predictableRandom)
    const source = bracket.find((match) => match.round === 1 && match.slot === 1)!
    const advanced = advance(bracket, 1, 1, source.player2_id!)
    expect(advanced.find((match) => match.round === 2 && match.slot === 0)?.player2_id).toBe(source.player2_id)
  })
})
