import type { AiProvider } from '@shared/ai'
import {
  applyElecEvent,
  type Ballot,
  ElecSettingsSchema,
  type ElecView,
  EMPTY_ELEC_VIEW,
  paneElec,
  personaOf,
  readVote,
  resolve,
  resolveSeat,
  type Session,
  secondRoundPrompt,
  sessionMarkdown,
  statementRoom,
  unitSystem,
} from '@shared/elec'
import { SettingsSchema } from '@shared/settings'
import { describe, expect, it } from 'vitest'

describe('reading a vote', () => {
  it('takes the VERDICT and CONFIDENCE lines, and leaves the statement without them', () => {
    const vote = readVote('It is feasible and cheap.\n\nVERDICT: APPROVE\nCONFIDENCE: 82')
    expect(vote).toEqual({
      verdict: 'approve',
      confidence: 82,
      statement: 'It is feasible and cheap.',
    })
  })

  it('reads the line through the markup and the case a model gives it', () => {
    expect(readVote('No.\n**Verdict:** reject').verdict).toBe('reject')
    expect(readVote('- verdict - Abstain\n- confidence: 40').verdict).toBe('abstain')
    expect(readVote('> VERDICT： REJECTED').verdict).toBe('reject')
    expect(readVote('`VERDICT: approve`').verdict).toBe('approve')
  })

  it('reads a Japanese answer that wrote its verdict in Japanese after all', () => {
    expect(readVote('賛成です。\nVERDICT: 承認\nCONFIDENCE: 70').verdict).toBe('approve')
    expect(readVote('判定: 否決').verdict).toBe('reject')
  })

  it('takes the last verdict: one quoted early on is not the vote', () => {
    const text =
      'I was told to end with VERDICT lines.\nVERDICT: REJECT\nOn reflection:\nVERDICT: APPROVE'
    expect(readVote(text).verdict).toBe('approve')
  })

  it('is NO VERDICT, not an abstention, when no line names one', () => {
    expect(readVote('I think it is a good idea.').verdict).toBeNull()
    expect(readVote('VERDICT: maybe').verdict).toBeNull()
    expect(readVote('').verdict).toBeNull()
  })

  it('keeps a confidence within 0 to 100', () => {
    expect(readVote('VERDICT: APPROVE\nCONFIDENCE: 250').confidence).toBe(100)
    expect(readVote('VERDICT: APPROVE').confidence).toBeNull()
  })
})

const ballot = (
  unit: 0 | 1 | 2,
  verdict: Ballot['verdict'],
  extra: Partial<Ballot> = {},
): Ballot => ({
  id: `b${unit}${extra.round ?? 1}`,
  unit,
  round: 1,
  text: '',
  verdict,
  at: 1,
  model: 'm',
  ...extra,
})

describe('the resolution', () => {
  const majority = (ballots: Ballot[]) => resolve({ rule: 'majority', rounds: 1, ballots })
  const unanimous = (ballots: Ballot[]) => resolve({ rule: 'unanimous', rounds: 1, ballots })

  it('is pending until all three have voted', () => {
    expect(majority([ballot(0, 'approve'), ballot(1, 'approve')]).outcome).toBeNull()
  })

  it('by majority: two seats one way decide', () => {
    expect(
      majority([ballot(0, 'approve'), ballot(1, 'approve'), ballot(2, 'reject')]),
    ).toMatchObject({
      outcome: 'approved',
      approve: 2,
      reject: 1,
    })
    expect(majority([ballot(0, 'reject'), ballot(1, 'reject'), ballot(2, 'abstain')]).outcome).toBe(
      'rejected',
    )
    expect(
      majority([ballot(0, 'approve'), ballot(1, 'reject'), ballot(2, 'abstain')]).outcome,
    ).toBe('deadlock')
    // One approval and two abstentions is not a majority of the council.
    expect(
      majority([ballot(0, 'approve'), ballot(1, 'abstain'), ballot(2, 'abstain')]).outcome,
    ).toBe('deadlock')
  })

  it('unanimous: all three approve, and one rejection rejects', () => {
    const all = [ballot(0, 'approve'), ballot(1, 'approve'), ballot(2, 'approve')]
    expect(unanimous(all).outcome).toBe('approved')
    expect(
      unanimous([ballot(0, 'approve'), ballot(1, 'approve'), ballot(2, 'reject')]).outcome,
    ).toBe('rejected')
    expect(
      unanimous([ballot(0, 'approve'), ballot(1, 'approve'), ballot(2, 'abstain')]).outcome,
    ).toBe('no-consensus')
    // A seat whose link failed has not approved.
    expect(unanimous([ballot(0, 'approve'), ballot(1, 'approve'), ballot(2, null)]).outcome).toBe(
      'no-consensus',
    )
  })

  it('counts a failed link and a missing verdict as invalid, apart from abstentions', () => {
    const result = majority([
      ballot(0, 'approve'),
      ballot(1, null),
      ballot(2, 'approve', { stop: 'unreachable' }),
    ])
    expect(result).toMatchObject({ approve: 1, abstain: 0, invalid: 2, outcome: 'no-quorum' })
  })

  it('still counts a verdict written before the answer ran out of room', () => {
    const result = majority([
      ballot(0, 'approve', { stop: 'length' }),
      ballot(1, 'approve'),
      ballot(2, 'reject'),
    ])
    expect(result.outcome).toBe('approved')
  })

  it('is the second round when there are two', () => {
    const ballots = [
      ballot(0, 'reject'),
      ballot(1, 'reject'),
      ballot(2, 'approve'),
      ballot(0, 'approve', { round: 2 }),
      ballot(1, 'approve', { round: 2 }),
      ballot(2, 'approve', { round: 2 }),
    ]
    expect(resolve({ rule: 'majority', rounds: 2, ballots })).toMatchObject({
      outcome: 'approved',
      approve: 3,
      round: 2,
    })
    expect(
      resolve({ rule: 'majority', rounds: 2, ballots: ballots.slice(0, 3) }).outcome,
    ).toBeNull()
  })
})

const LOCAL: AiProvider = {
  id: 'local',
  name: 'Local',
  kind: 'openai',
  baseUrl: 'http://localhost:11434/v1',
  model: 'llama3',
}
const HOSTED: AiProvider = {
  id: 'hosted',
  name: 'Hosted',
  kind: 'anthropic',
  baseUrl: 'https://api.example.com',
  model: 'big',
}

describe('the seats', () => {
  it('ask their own provider and model while it is listed', () => {
    expect(resolveSeat({ provider: 'hosted', model: 'small' }, [LOCAL, HOSTED])).toEqual({
      provider: HOSTED,
      model: 'small',
    })
  })

  it('fall back on the first provider and its own model when theirs is gone or unset', () => {
    expect(resolveSeat({ provider: 'gone', model: 'small' }, [LOCAL, HOSTED])).toEqual({
      provider: LOCAL,
      model: 'llama3',
    })
    expect(resolveSeat({ provider: 'hosted', model: '' }, [LOCAL, HOSTED]).model).toBe('big')
    expect(resolveSeat(undefined, [])).toEqual({ provider: null, model: '' })
  })

  it('take their own standpoint unless the settings give one', () => {
    const settings = ElecSettingsSchema.parse({ personas: ['', '  ', 'Be bold.'] })
    expect(personaOf(settings, 0)).toMatch(/^The scientist/)
    expect(personaOf(settings, 1)).toMatch(/^The guardian/)
    expect(personaOf(settings, 2)).toBe('Be bold.')
    expect(unitSystem(2, 'Be bold.')).toMatch(/VERDICT: APPROVE or REJECT or ABSTAIN/)
    expect(unitSystem(2, 'Be bold.')).toMatch(
      /You are UNIT-3 PATHOS\. Your standpoint:\nBe bold\.$/,
    )
  })
})

describe('the settings', () => {
  it('fall back field by field: a slip in a hand edit costs only that field', () => {
    const parsed = ElecSettingsSchema.parse({
      seats: [{ provider: 'local', model: 'a' }, { provider: 5 }, { model: 'b' }],
      personas: ['only one'],
      rule: 'plurality',
      rounds: 3,
    })
    expect(parsed).toEqual({
      seats: [
        { provider: 'local', model: 'a' },
        { provider: '', model: '' },
        { provider: '', model: 'b' },
      ],
      personas: ['', '', ''],
      rule: 'majority',
      rounds: 1,
    })
  })

  it('never send the rest of settings.json back to its defaults', () => {
    const parsed = SettingsSchema.safeParse({
      theme: 'amber',
      ai: { providers: [LOCAL] },
      elec: 'nonsense',
    })
    expect(parsed.success).toBe(true)
    expect(parsed.data?.theme).toBe('amber')
    expect(parsed.data?.ai.providers).toEqual([LOCAL])
    expect(parsed.data?.elec.rule).toBe('majority')
  })
})

describe('the second round', () => {
  it('gives each unit the others and itself, each cut to its room', () => {
    const long = 'word '.repeat(2000)
    const prompt = secondRoundPrompt(
      'Adopt the plan?',
      { unit: 0, verdict: 'reject', text: 'Too risky.' },
      [
        { unit: 1, verdict: 'approve', text: long },
        { unit: 2, verdict: null, text: null },
      ],
      64,
    )
    expect(prompt).toMatch(/^MOTION:\nAdopt the plan\?/)
    expect(prompt).toContain('[UNIT-2 ETHOS · APPROVE]')
    expect(prompt).toContain('[UNIT-3 PATHOS · NO VOTE]\n(no statement: its link failed)')
    expect(prompt).toContain(
      'Your own statement in the first round:\n\n[UNIT-1 LOGOS · REJECT]\nToo risky.',
    )
    expect(prompt.length).toBeLessThan(1500)
  })

  it("has room for a statement by the provider's window", () => {
    expect(statementRoom(LOCAL)).toBe(800)
    expect(statementRoom({ ...LOCAL, contextTokens: 2048 })).toBe(204)
    // A window is never read as smaller than the chat pane's least (1024).
    expect(statementRoom({ ...LOCAL, contextTokens: 256 })).toBe(102)
    expect(statementRoom(HOSTED)).toBe(800)
  })
})

describe('following a deliberation', () => {
  const run = {
    id: 'r',
    unit: 1 as const,
    round: 1 as const,
    text: 'ab',
    thinking: '',
    provider: 'P',
    model: 'm',
    startedAt: 1,
  }
  const view: ElecView = { session: null, live: { round: 1, runs: [run] } }

  it('appends a delta where it says it goes', () => {
    const next = applyElecEvent(view, {
      type: 'delta',
      sessionId: 's',
      runId: 'r',
      textAt: 2,
      text: 'c',
      thinkingAt: 0,
      thinking: '',
    })
    expect(next).not.toBe('resync')
    expect((next as ElecView).live?.runs[0]?.text).toBe('abc')
  })

  it('asks for a snapshot when a delta does not fit, or its run is not there', () => {
    const delta = {
      type: 'delta' as const,
      sessionId: 's',
      runId: 'r',
      textAt: 5,
      text: 'c',
      thinkingAt: 0,
      thinking: '',
    }
    expect(applyElecEvent(view, delta)).toBe('resync')
    expect(applyElecEvent(EMPTY_ELEC_VIEW, { ...delta, textAt: 2 })).toBe('resync')
  })

  it('trusts nothing in the pane state', () => {
    expect(paneElec({ session: '../../x' })).toEqual({ session: null })
    expect(paneElec(undefined)).toEqual({ session: null })
    const id = '00000000-0000-4000-8000-000000000001'
    expect(paneElec({ session: id })).toEqual({ session: id })
  })
})

describe('export', () => {
  it('writes the motion, the resolution and every statement without its vote lines', () => {
    const session: Session = {
      version: 1,
      id: '00000000-0000-4000-8000-000000000001',
      title: 'Adopt the plan?',
      motion: 'Adopt the plan?',
      createdAt: 1,
      updatedAt: 2,
      rule: 'majority',
      rounds: 1,
      seats: [
        { providerId: 'local', provider: 'Local', model: 'a' },
        { providerId: 'local', provider: 'Local', model: 'b' },
        { providerId: 'local', provider: 'Local', model: 'c' },
      ],
      ballots: [
        ballot(0, 'approve', { text: 'Yes.\nVERDICT: APPROVE' }),
        ballot(1, 'approve', { text: 'Fine.\nVERDICT: APPROVE' }),
        ballot(2, null, { text: '', stop: 'unreachable' }),
      ],
    }
    const markdown = sessionMarkdown(session)
    expect(markdown).toContain(
      '## Resolution\n\nAPPROVED · majority · 2 approve, 0 reject, 0 abstain, 1 invalid',
    )
    expect(markdown).toContain('## Round 1 · UNIT-1 LOGOS · APPROVE\n\n_a_\n\nYes.')
    expect(markdown).toContain('## Round 1 · UNIT-3 PATHOS · INVALID')
    expect(markdown).not.toContain('VERDICT:')
  })
})
