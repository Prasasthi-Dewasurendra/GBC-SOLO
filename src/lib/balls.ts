export function isSolid(ball: number): boolean {
  return ball >= 1 && ball <= 7
}

export function isStripe(ball: number): boolean {
  return ball >= 9 && ball <= 15
}

export function is8Ball(ball: number): boolean {
  return ball === 8
}

export function isValidBall(ball: number): boolean {
  return Number.isInteger(ball) && ball >= 1 && ball <= 15
}

export function getBallColor(ball: number): string {
  if (!isValidBall(ball)) return '#ffffff'

  // Standard pool ball colors
  const colors: Record<number, string> = {
    1: '#f1c40f', // Yellow
    2: '#3498db', // Blue
    3: '#e74c3c', // Red
    4: '#8e44ad', // Purple
    5: '#e67e22', // Orange
    6: '#2ecc71', // Green
    7: '#7f8c8d', // Maroon/Brown
    8: '#000000', // Black
  }

  if (ball <= 8) return colors[ball]
  return colors[ball - 8]
}

export function getRemainingBalls(pottedBalls: number[]): number[] {
  const allBalls = Array.from({ length: 15 }, (_, i) => i + 1)
  return allBalls.filter(b => !pottedBalls.includes(b))
}

export function isLegal8BallPot(pottedBalls: number[], playerType: 'solid' | 'stripe'): boolean {
  const remaining = getRemainingBalls(pottedBalls)
  if (playerType === 'solid') {
    return !remaining.some(isSolid)
  } else {
    return !remaining.some(isStripe)
  }
}
