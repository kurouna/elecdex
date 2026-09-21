import type { Ballot, Session } from '@shared/elec'
import { describe, expect, it } from 'vitest'
import { councilLog } from '../../src/renderer/widgets/elec/log.js'

const session = (ballots: Ballot[], extra: Partial<Session> = {}): Session => ({
  version: 1,
  id: '3f3a0000-0000-4000-8000-000000000001',
  title: 'Ship it?',
  motion: 'Ship it?',
  createdAt: 1000,
  updatedAt: 1000,
  rule: 'majority',
  rounds: 1,
  seats: [
    { providerId: 'l', provider: 'L', model: 'a' },
    { providerId: 'l', provider: 'L', model: 'b' },
    { providerId: 'l', provider: 'L', model: 'c' },
  ],
  ballots,
  ...extra,
})

const ballot = (unit: 0 | 1 | 2, at: number, ms: number, extra: Partial<Ballot> = {}): Ballot => ({
  id: `b${unit}`,
  unit,
  round: 1,
  text: '',
  verdict: 'approve',
  at,
  ms,
  model: 'm',
  ...extra,
})

const texts = (lines: { text: string }[]) => lines.map((l) => l.text)

describe('the council log', () => {
  it('shows the council powered off, waiting for a motion', () => {
    const lines = councilLog(
      null,
      null,
      [
        { unit: 0, model: 'qwen3' },
        { unit: 1, model: '' },
        { unit: 2, model: 'qwen3' },
      ],
      true,
    )
    expect(texts(lines)).toEqual([
      'ELEC SYSTEM · CORE ONLINE',
      'UNIT-1 LOGOS · qwen3 · POWER OFF',
      'UNIT-2 ETHOS · NO MODEL',
      'UNIT-3 PATHOS · qwen3 · POWER OFF',
      'AWAITING MOTION',
    ])
    expect(texts(councilLog(null, null, [], false))).toContain('NO LINK · SET UP A PROVIDER')
  })

  it('reads a deliberation off its ballots, in the order things happened', () => {
    const lines = councilLog(
      session([
        ballot(1, 5000, 3000, { verdict: 'reject', confidence: 60 }),
        ballot(0, 3000, 1500, { confidence: 80 }),
        ballot(2, 6000, 1500),
      ]),
      null,
      [],
      true,
    )
    expect(texts(lines)).toEqual([
      'MOTION #3F3A FILED',
      'RULE MAJORITY · 1 ROUND',
      'POWER ON · 3 UNITS',
      'UNIT-1 LOGOS · TX',
      'UNIT-2 ETHOS · TX',
      'UNIT-1 LOGOS · VOTE APPROVE 80%',
      'UNIT-3 PATHOS · TX',
      'UNIT-2 ETHOS · VOTE REJECT 60%',
      'UNIT-3 PATHOS · VOTE APPROVE',
      'RESOLUTION · APPROVED 2·1·0·0',
    ])
    expect(lines.at(-1)).toMatchObject({ at: 6000, tone: 'ok' })
  })

  it('says what is being written now, without a time of its own', () => {
    const lines = councilLog(
      session([ballot(0, 3000, 1500, { stop: 'unreachable', verdict: null })]),
      {
        round: 1,
        runs: [
          {
            id: 'r',
            unit: 1,
            round: 1,
            text: '',
            thinking: 'hmm',
            provider: 'L',
            model: 'b',
            startedAt: 3100,
          },
        ],
      },
      [],
      true,
    )
    expect(texts(lines).slice(-3)).toEqual([
      'UNIT-1 LOGOS · NO CARRIER',
      'UNIT-2 ETHOS · TX',
      'UNIT-2 ETHOS · RX · REASONING',
    ])
    expect(lines.at(-1)?.at).toBeNull()
  })

  it('marks the second round, a seat never asked, and a deliberation that never ended', () => {
    const lines = councilLog(
      session(
        [
          ballot(0, 3000, 1000),
          ballot(0, 8000, 1000, { id: 'r2', round: 2 }),
          ballot(1, 9000, 0, { round: 2, stop: 'stopped', verdict: null, ms: undefined as never }),
        ],
        { rounds: 2 },
      ),
      null,
      [],
      true,
    )
    const shown = texts(lines)
    expect(shown).toContain('ROUND 2 · STATEMENTS EXCHANGED')
    expect(shown.indexOf('ROUND 2 · STATEMENTS EXCHANGED')).toBeGreaterThan(
      shown.indexOf('UNIT-1 LOGOS · VOTE APPROVE'),
    )
    expect(shown.filter((t) => t === 'UNIT-2 ETHOS · TX')).toHaveLength(0)
    expect(shown).toContain('UNIT-2 ETHOS · STOPPED')
    expect(shown.at(-1)).toBe('LINK LOST · INTERRUPTED')
  })
})
