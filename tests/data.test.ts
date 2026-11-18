import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PLAYERS, ALL_PLAYERS, contrib, certainty, WEIGHTS } from '../src/lib/data'
import { answer, findPlayers } from '../src/lib/query'

const csv = readFileSync(fileURLToPath(new URL('../../outputs/SUBMISSION_rankings.csv', import.meta.url)), 'utf8').trim().split('\n').slice(1).map((l) => l.split(','))

describe('data mapping matches the submitted rankings CSV', () => {
  it('has exactly 10 unique batters and 10 unique bowlers, ranks 1-10', () => {
    for (const [cat, side] of [['BATTER', 'bat'], ['BOWLER', 'bowl']] as const) {
      const rows = csv.filter((r) => r[0] === cat)
      expect(rows.length).toBe(10)
      expect(PLAYERS[side].map((p) => p.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      expect(new Set(PLAYERS[side].map((p) => p.player_id)).size).toBe(10)
      rows.forEach((r) => {
        const p = PLAYERS[side].find((x) => x.rank === Number(r[1]))!
        expect(p.player_id).toBe(Number(r[2])); expect(p.name).toBe(r[3])
      })
    }
  })
  it('final rating equals 0.60 zH + 0.25 zR + 0.15 zC for every player', () => {
    ALL_PLAYERS.forEach((p) => { const c = contrib(p); expect(c.H + c.R + c.C).toBeCloseTo(p.final, 6) })
  })
  it('batter R is exactly zero (estimated between-player variance zero)', () => { PLAYERS.bat.forEach((p) => expect(p.zR).toBe(0)) })
  it('eligibility floor respected', () => { ALL_PLAYERS.forEach((p) => { expect(p.n_h).toBeGreaterThanOrEqual(36); expect(p.m_h).toBeGreaterThanOrEqual(5) }) })
  it('rank-1 players are stable', () => { expect(certainty(PLAYERS.bat[0])).toBe('stable'); expect(certainty(PLAYERS.bowl[0])).toBe('stable') })
  it('weights sum to one', () => { expect(WEIGHTS.H + WEIGHTS.R + WEIGHTS.C).toBeCloseTo(1, 10) })
})

describe('ask-the-data engine', () => {
  it('finds players by name and compares two', () => {
    expect(findPlayers('compare jasprit bumrah and haris rauf').map((p) => p.name).sort()).toEqual(['Haris Rauf', 'Jasprit Bumrah'])
    const a = answer('Compare Jasprit Bumrah and Haris Rauf')
    expect(a.columns).toEqual(['Measure', 'Jasprit Bumrah', 'Haris Rauf'])
    const row = a.rows.find((r) => r[0] === 'Rank')!; expect(row[1]).toBe(1); expect(row[2]).toBe(2)
  })
  it('ranks batters by raw pressure scoring using real values', () => {
    const a = answer('Who has the highest pressure scoring above expectation among batters?')
    const best = [...PLAYERS.bat].sort((x, y) => y.S_h_raw - x.S_h_raw)[0]
    expect(a.rows[0][0]).toBe(best.name)
  })
  it('does not confuse the two Sharmas', () => {
    expect(findPlayers('Abhishek Sharma').map((p) => p.name)).toEqual(['Abhishek Sharma'])
  })
  it('reports eligible counts', () => { const a = answer('How many players were eligible?'); expect(a.rows.map((r) => r[1])).toEqual([253, 237]) })
})
