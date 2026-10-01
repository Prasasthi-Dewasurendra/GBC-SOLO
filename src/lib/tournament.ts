export type BracketPlayer = {
  id: string
  name: string
  photo_url?: string | null
}

export type BracketMatch = {
  round: number
  slot: number
  player1_id: string | null
  player2_id: string | null
  best_of: 3 | 5
  status: 'pending' | 'live' | 'done'
  winner_id: string | null
  table_number: number | null
}

export type RandomSource = () => number

function cryptoRandom(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
}

export function shuffle<T>(items: readonly T[], random: RandomSource = cryptoRandom): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

export function raceTarget(bestOf: number): number {
  if (!Number.isInteger(bestOf) || bestOf < 1 || bestOf % 2 === 0) {
    throw new Error('bestOf must be a positive odd number')
  }
  return Math.ceil(bestOf / 2)
}

export function buildBracket(players: readonly BracketPlayer[], random: RandomSource = cryptoRandom): BracketMatch[] {
  if (players.length !== 32) throw new Error('A draw requires exactly 32 players')

  const shuffled = shuffle(players, random)
  const matches: BracketMatch[] = []
  const matchCounts = [16, 8, 4, 2, 1]

  for (let round = 1; round <= 5; round += 1) {
    for (let slot = 0; slot < matchCounts[round - 1]; slot += 1) {
      matches.push({
        round,
        slot,
        player1_id: round === 1 ? shuffled[slot * 2].id : null,
        player2_id: round === 1 ? shuffled[slot * 2 + 1].id : null,
        best_of: round === 5 ? 5 : 3,
        status: 'pending',
        winner_id: null,
        table_number: null,
      })
    }
  }

  return matches
}

export function advance(matches: readonly BracketMatch[], round: number, slot: number, winnerId: string): BracketMatch[] {
  const source = matches.find((match) => match.round === round && match.slot === slot)
  if (!source) throw new Error('Source match not found')
  if (source.player1_id !== winnerId && source.player2_id !== winnerId) throw new Error('Winner must be a player in the source match')
  if (round >= 5) return [...matches]

  const nextRound = round + 1
  const nextSlot = Math.floor(slot / 2)
  const nextMatch = matches.find((match) => match.round === nextRound && match.slot === nextSlot)
  if (!nextMatch) throw new Error('Next-round match not found')

  return matches.map((match) => {
    if (match.round !== nextRound || match.slot !== nextSlot) return match
    return slot % 2 === 0 ? { ...match, player1_id: winnerId } : { ...match, player2_id: winnerId }
  })
}
