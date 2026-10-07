import { describe, it, expect } from 'vitest'
import { isSolid, isStripe, is8Ball, isValidBall, getBallColor, getRemainingBalls, isLegal8BallPot } from './balls'

describe('Pool rules engine', () => {
  it('correctly identifies solid balls', () => {
    expect(isSolid(1)).toBe(true)
    expect(isSolid(7)).toBe(true)
    expect(isSolid(8)).toBe(false)
    expect(isSolid(9)).toBe(false)
  })

  it('correctly identifies stripe balls', () => {
    expect(isStripe(9)).toBe(true)
    expect(isStripe(15)).toBe(true)
    expect(isStripe(8)).toBe(false)
    expect(isStripe(7)).toBe(false)
  })

  it('correctly identifies 8 ball', () => {
    expect(is8Ball(8)).toBe(true)
    expect(is8Ball(1)).toBe(false)
    expect(is8Ball(15)).toBe(false)
  })

  it('validates balls correctly', () => {
    expect(isValidBall(1)).toBe(true)
    expect(isValidBall(15)).toBe(true)
    expect(isValidBall(0)).toBe(false)
    expect(isValidBall(16)).toBe(false)
    expect(isValidBall(1.5)).toBe(false)
  })

  it('returns colors properly', () => {
    expect(getBallColor(1)).toBe('#f1c40f') // Yellow
    expect(getBallColor(9)).toBe('#f1c40f') // Yellow (stripe)
    expect(getBallColor(8)).toBe('#000000') // Black
    expect(getBallColor(99)).toBe('#ffffff') // Invalid
  })

  it('calculates remaining balls', () => {
    const remaining = getRemainingBalls([1, 2, 8])
    expect(remaining).toHaveLength(12)
    expect(remaining).not.toContain(1)
    expect(remaining).not.toContain(2)
    expect(remaining).not.toContain(8)
    expect(remaining).toContain(3)
  })

  it('checks if 8 ball pot is legal', () => {
    // Solids player needs to have all solids potted
    expect(isLegal8BallPot([1, 2, 3, 4, 5, 6], 'solid')).toBe(false) // missing 7
    expect(isLegal8BallPot([1, 2, 3, 4, 5, 6, 7], 'solid')).toBe(true)
    
    // Stripes player needs to have all stripes potted
    expect(isLegal8BallPot([9, 10, 11, 12, 13, 14], 'stripe')).toBe(false) // missing 15
    expect(isLegal8BallPot([9, 10, 11, 12, 13, 14, 15], 'stripe')).toBe(true)
  })
})
