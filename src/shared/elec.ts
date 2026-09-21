import { z } from 'zod'
import {
  AI_LIMITS,
  AI_PROVIDER_ID,
  type AiProvider,
  CHAT_ID,
  CHAT_STOPS,
  type ChatStop,
  chatTitle,
  clipToTokens,
  contextWindow,
} from './ai.js'

/**
 * The ELEC system pane (docs/architecture.md section 5.8): a council of three
 * units, each a model given a standpoint of its own, that votes on a motion.
 *
 * The units ask the providers of the AI settings; what is here is the pure part
 * both sides share - the units and their standpoints, the contract a unit answers
 * by, reading its vote, and the resolution the votes add up to.
 */

export const ELEC_LIMITS = {
  /** Deliberations kept; a new one is refused past this rather than an old one dropped. */
  sessions: 200,
  /** Characters in a motion. */
  motion: 4000,
  /** Characters in a standpoint. */
  persona: 2000,
  /** Characters kept of a unit's statement (its answer, reasoning apart). */
  text: 100_000,
  /**
   * Tokens of another unit's statement passed on in the second round, at most -
   * less where the provider's window is small (`statementRoom`).
   */
  statement: 800,
} as const

/** The three seats, in order: their names are part of what each is told. */
export const ELEC_UNITS = [
  {
    code: 'UNIT-1',
    name: 'LOGOS',
    persona:
      'The scientist. Weigh evidence, feasibility, cost and risk. Trust what can be measured or reasoned out, and distrust wishful thinking.',
  },
  {
    code: 'UNIT-2',
    name: 'ETHOS',
    persona:
      'The guardian. Weigh duty, fairness and the people the decision touches, now and later. Ask who bears the consequences, and whether it is right.',
  },
  {
    code: 'UNIT-3',
    name: 'PATHOS',
    persona:
      'The heart. Weigh feeling, desire, intuition and what the decision means to the person who lives with it. Trust the gut where the numbers are silent.',
  },
] as const

export const ELEC_UNIT_COUNT = ELEC_UNITS.length
export type UnitIndex = 0 | 1 | 2
export const UNIT_INDICES: readonly UnitIndex[] = [0, 1, 2]

export const ELEC_RULES = ['majority', 'unanimous'] as const
export type ElecRule = (typeof ELEC_RULES)[number]
export const ELEC_ROUNDS = [1, 2] as const
export type ElecRounds = (typeof ELEC_ROUNDS)[number]

/** A seat's link: a provider id of the AI settings and a model. Empty for "the first provider's own". */
export const ElecSeatSchema = z.object({
  provider: z.string().max(40).catch(''),
  model: z.string().max(120).catch(''),
})
export type ElecSeat = z.infer<typeof ElecSeatSchema>

const EMPTY_SEATS: ElecSeat[] = [
  { provider: '', model: '' },
  { provider: '', model: '' },
  { provider: '', model: '' },
]

/**
 * Settings (`elec`). Every field falls back on its own: settings.json is edited by
 * hand, and a slip here must not send the whole file back to its defaults.
 */
export const ElecSettingsSchema = z.object({
  seats: z.array(ElecSeatSchema).length(ELEC_UNIT_COUNT).catch(EMPTY_SEATS),
  /** Empty for the unit's own standpoint (`ELEC_UNITS`). */
  personas: z
    .array(z.string().max(ELEC_LIMITS.persona))
    .length(ELEC_UNIT_COUNT)
    .catch(['', '', '']),
  rule: z.enum(ELEC_RULES).catch('majority'),
  rounds: z.union([z.literal(1), z.literal(2)]).catch(1),
})
export type ElecSettings = z.infer<typeof ElecSettingsSchema>

export const defaultElecSettings = (): ElecSettings => ({
  seats: EMPTY_SEATS.map((seat) => ({ ...seat })),
  personas: ['', '', ''],
  rule: 'majority',
  rounds: 1,
})

/** A seat as it will be asked: a listed provider and a model, or why it cannot be. */
export interface ResolvedSeat {
  provider: AiProvider | null
  model: string
}

/**
 * The provider a seat asks: its own while it is listed, else the first one; and the
 * model: its own for its own provider, else that provider's default. Like the chat
 * pane, a seat whose provider was removed still has somewhere to go.
 */
export function resolveSeat(
  seat: ElecSeat | undefined,
  providers: readonly AiProvider[],
): ResolvedSeat {
  const provider = providers.find((p) => p.id === seat?.provider) ?? providers[0] ?? null
  if (provider === null) return { provider: null, model: '' }
  const own = provider.id === seat?.provider ? (seat?.model ?? '') : ''
  return { provider, model: own !== '' ? own : provider.model }
}

export function personaOf(settings: ElecSettings, unit: UnitIndex): string {
  const own = settings.personas[unit]?.trim() ?? ''
  return own === '' ? ELEC_UNITS[unit].persona : own
}

export const unitLabel = (unit: UnitIndex): string =>
  `${ELEC_UNITS[unit].code} ${ELEC_UNITS[unit].name}`

// ---- The contract a unit answers by ----

export const ELEC_CONTRACT = [
  'You are one of the three units of the ELEC system, a council that decides on a motion by vote.',
  'Judge the motion from your own standpoint, given below.',
  'Write a short statement - at most 120 words - in the language the motion is written in.',
  'Then end with exactly these two lines, in English whatever the language of the statement:',
  'VERDICT: APPROVE or REJECT or ABSTAIN',
  'CONFIDENCE: a whole number from 0 to 100',
  'Abstain only when the motion cannot be answered yes or no, and say why.',
].join('\n')

/** What a unit is told before the motion: the contract, and who it is. */
export function unitSystem(unit: UnitIndex, persona: string): string {
  return `${ELEC_CONTRACT}\n\nYou are ${unitLabel(unit)}. Your standpoint:\n${persona}`
}

/** How many tokens of another unit's statement fit what a provider reads (`contextWindow`). */
export function statementRoom(provider: Pick<AiProvider, 'baseUrl' | 'contextTokens'>): number {
  const window = contextWindow(provider)
  if (window === 0) return ELEC_LIMITS.statement
  // Two statements and one's own in a tenth of the window each, the rest for the motion and the answer.
  return Math.max(64, Math.min(ELEC_LIMITS.statement, Math.floor(window / 10)))
}

/** A unit's statement as another reads it in the second round. */
export interface Heard {
  unit: UnitIndex
  verdict: Verdict | null
  /** Unset when the unit said nothing that counts (its link failed). */
  text: string | null
}

/**
 * The second round's question: the motion, what the others said in the first,
 * and what this unit said - each cut to its room, so three statements never
 * outgrow a small local window.
 */
export function secondRoundPrompt(
  motion: string,
  own: Heard | undefined,
  others: readonly Heard[],
  room: number,
): string {
  const told = (heard: Heard): string => {
    const head = `[${unitLabel(heard.unit)} · ${heard.verdict === null ? 'NO VOTE' : heard.verdict.toUpperCase()}]`
    const body =
      heard.text === null ? '(no statement: its link failed)' : clipToTokens(heard.text, room)
    return `${head}\n${body}`
  }
  return [
    `MOTION:\n${motion}`,
    `The other units' statements in the first round:\n\n${others.map(told).join('\n\n')}`,
    ...(own === undefined ? [] : [`Your own statement in the first round:\n\n${told(own)}`]),
    'Consider what they said and vote again. You may keep your verdict or change it.',
  ].join('\n\n')
}

export const firstRoundPrompt = (motion: string): string => `MOTION:\n${motion}`

// ---- Reading a vote ----

export const VERDICTS = ['approve', 'reject', 'abstain'] as const
export type Verdict = (typeof VERDICTS)[number]

const VERDICT_WORDS: Record<string, Verdict> = {
  approve: 'approve',
  approved: 'approve',
  yes: 'approve',
  承認: 'approve',
  賛成: 'approve',
  reject: 'reject',
  rejected: 'reject',
  no: 'reject',
  否決: 'reject',
  反対: 'reject',
  abstain: 'abstain',
  abstained: 'abstain',
  棄権: 'abstain',
}

/** "VERDICT: APPROVE", "**Verdict:** reject", "verdict - 承認" - the line, wherever a model's markup left it. */
const VERDICT_LINE =
  /^[\s>*_#`-]*(?:verdict|判定|評決)[\s*_`]*[:：\-–—]?[\s*_`]*([a-z]+|承認|賛成|否決|反対|棄権)/i
const CONFIDENCE_LINE = /^[\s>*_#`-]*(?:confidence|確信度)[\s*_`]*[:：\-–—]?[\s*_`]*(\d{1,3})/i

export interface ReadVote {
  verdict: Verdict | null
  confidence: number | null
  /** The statement without the lines the vote was read from. */
  statement: string
}

/**
 * The vote at the end of an answer: the last VERDICT line that names one (a model
 * that quotes the contract early on has not voted yet), and the last CONFIDENCE.
 * No verdict is NO VERDICT - an invalid vote, never an abstention.
 */
export function readVote(text: string): ReadVote {
  const lines = text.split('\n')
  let verdict: Verdict | null = null
  let confidence: number | null = null
  const drop = new Set<number>()
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i] ?? ''
    const v: RegExpExecArray | null = verdict === null ? VERDICT_LINE.exec(line) : null
    const word: string | undefined = v?.[1]?.toLowerCase()
    if (word !== undefined && VERDICT_WORDS[word] !== undefined) {
      verdict = VERDICT_WORDS[word]
      drop.add(i)
      continue
    }
    const c: RegExpExecArray | null = confidence === null ? CONFIDENCE_LINE.exec(line) : null
    if (c?.[1] !== undefined) {
      confidence = Math.min(100, Number(c[1]))
      drop.add(i)
    }
  }
  const statement = lines
    .filter((_, i) => !drop.has(i))
    .join('\n')
    .trim()
  return { verdict, confidence, statement }
}

// ---- A deliberation ----

export const SESSION_VERSION = 1
export const SESSION_ID = CHAT_ID

/** Ways a ballot fails to count, whatever it says: the link failed, or the user stopped it. */
const VOID_STOPS = new Set<ChatStop>(['stopped', 'refusal', 'error', 'unreachable'])

export const BallotSchema = z.object({
  id: z.string().min(1).max(64),
  unit: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  round: z.union([z.literal(1), z.literal(2)]),
  /** The answer as the model wrote it, vote lines included. */
  text: z.string().max(ELEC_LIMITS.text),
  thinking: z.string().max(ELEC_LIMITS.text).optional(),
  /** Null: no vote could be read (NO VERDICT), or the ballot is void. */
  verdict: z.enum(VERDICTS).nullable(),
  /** Shown, never counted. */
  confidence: z.number().int().min(0).max(100).optional(),
  at: z.number().int().nonnegative(),
  ms: z.number().int().nonnegative().optional(),
  model: z.string().max(120),
  usage: z
    .object({ input: z.number().int().nonnegative(), output: z.number().int().nonnegative() })
    .optional(),
  stop: z.enum(CHAT_STOPS).optional(),
  error: z.string().max(600).optional(),
})
export type Ballot = z.infer<typeof BallotSchema>

/** A seat as it was when the motion was put: later changes to the settings do not rewrite it. */
export const SessionSeatSchema = z.object({
  providerId: z.string().regex(AI_PROVIDER_ID),
  provider: z.string().max(40),
  model: z.string().min(1).max(120),
})
export type SessionSeat = z.infer<typeof SessionSeatSchema>

export const SessionSchema = z.object({
  version: z.literal(SESSION_VERSION).default(SESSION_VERSION),
  id: z.string().regex(SESSION_ID),
  title: z.string().max(AI_LIMITS.title),
  motion: z.string().min(1).max(ELEC_LIMITS.motion),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  rule: z.enum(ELEC_RULES),
  rounds: z.union([z.literal(1), z.literal(2)]),
  seats: z.array(SessionSeatSchema).length(ELEC_UNIT_COUNT),
  ballots: z.array(BallotSchema).max(ELEC_UNIT_COUNT * 2),
})
export type Session = z.infer<typeof SessionSchema>

/** Whether a ballot is a vote at all: a verdict read from an answer that was not cut off by a failure. */
export const countsAsVote = (ballot: Ballot): boolean =>
  ballot.verdict !== null && (ballot.stop === undefined || !VOID_STOPS.has(ballot.stop))

export type Outcome = 'approved' | 'rejected' | 'deadlock' | 'no-consensus' | 'no-quorum'

export interface Resolution {
  /** Null while the last round is still being voted. */
  outcome: Outcome | null
  approve: number
  reject: number
  abstain: number
  /** Ballots that do not count: a link that failed, or no verdict. */
  invalid: number
  /** The round these figures are of. */
  round: ElecRounds
}

/**
 * What the votes add up to - computed, never stored, so the ballots are the one
 * record. The last round's ballot is each unit's vote. Fewer than two valid votes
 * is no quorum. Majority: two of the three seats one way. Unanimous: all three
 * approve; one rejection rejects.
 */
export function resolve(session: Pick<Session, 'rule' | 'rounds' | 'ballots'>): Resolution {
  const round = session.rounds
  const final = session.ballots.filter((b) => b.round === round)
  const tally: Resolution = { outcome: null, approve: 0, reject: 0, abstain: 0, invalid: 0, round }
  for (const ballot of final) {
    if (!countsAsVote(ballot) || ballot.verdict === null) tally.invalid += 1
    else tally[ballot.verdict] += 1
  }
  if (final.length < ELEC_UNIT_COUNT) return tally
  const valid = tally.approve + tally.reject + tally.abstain
  if (valid < 2) return { ...tally, outcome: 'no-quorum' }
  if (session.rule === 'unanimous') {
    if (tally.approve === ELEC_UNIT_COUNT) return { ...tally, outcome: 'approved' }
    return { ...tally, outcome: tally.reject > 0 ? 'rejected' : 'no-consensus' }
  }
  if (tally.approve >= 2) return { ...tally, outcome: 'approved' }
  if (tally.reject >= 2) return { ...tally, outcome: 'rejected' }
  return { ...tally, outcome: 'deadlock' }
}

export const OUTCOME_WORDS: Record<Outcome, string> = {
  approved: 'approved',
  rejected: 'rejected',
  deadlock: 'deadlock',
  'no-consensus': 'no consensus',
  'no-quorum': 'quorum not met',
}

export interface SessionSummary {
  id: string
  title: string
  updatedAt: number
  outcome: Outcome | null
}

export const sessionSummaryOf = (session: Session): SessionSummary => ({
  id: session.id,
  title: session.title,
  updatedAt: session.updatedAt,
  outcome: resolve(session).outcome,
})

export const sessionTitle = (motion: string): string => chatTitle(motion)

// ---- Following one: a snapshot, then deltas ----

/** A unit's answer being written. */
export interface ElecRun {
  id: string
  unit: UnitIndex
  round: ElecRounds
  text: string
  thinking: string
  provider: string
  model: string
  startedAt: number
}

/** A deliberation in progress: the round being voted, and the answers being written for it. */
export interface ElecLive {
  round: ElecRounds
  runs: ElecRun[]
}

export type ElecEvent =
  | { type: 'snapshot'; sessionId: string; session: Session | null; live: ElecLive | null }
  | {
      type: 'delta'
      sessionId: string
      runId: string
      textAt: number
      text: string
      thinkingAt: number
      thinking: string
    }

export interface ElecView {
  session: Session | null
  live: ElecLive | null
}

export const EMPTY_ELEC_VIEW: ElecView = { session: null, live: null }

/** The view after an event, or 'resync' when a delta does not fit what the page holds. */
export function applyElecEvent(view: ElecView, event: ElecEvent): ElecView | 'resync' {
  if (event.type === 'snapshot') return { session: event.session, live: event.live }
  const live = view.live
  const run = live?.runs.find((r) => r.id === event.runId)
  if (live === null || run === undefined) return 'resync'
  if (run.text.length !== event.textAt || run.thinking.length !== event.thinkingAt) return 'resync'
  const next = { ...run, text: run.text + event.text, thinking: run.thinking + event.thinking }
  return {
    session: view.session,
    live: { ...live, runs: live.runs.map((r) => (r.id === run.id ? next : r)) },
  }
}

export type ElecSubmitResult = { ok: true; sessionId: string } | { ok: false; error: string }

/** What the page puts to main: the motion only. The seats, rule and rounds are main's to read from the settings. */
export function elecMotion(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const motion = raw.trim()
  return motion === '' ? null : motion.slice(0, ELEC_LIMITS.motion)
}

/** The pane's own choice: which deliberation it shows. */
export function paneElec(raw: Record<string, unknown> | undefined): { session: string | null } {
  const session = raw?.session
  return { session: typeof session === 'string' && SESSION_ID.test(session) ? session : null }
}

/** A deliberation as a markdown document, for "export". */
export function sessionMarkdown(session: Session): string {
  const result = resolve(session)
  const parts = [
    `# ${session.title === '' ? 'untitled' : session.title}`,
    `## Motion\n\n${session.motion}`,
    `## Resolution\n\n${result.outcome === null ? 'pending' : OUTCOME_WORDS[result.outcome].toUpperCase()} · ${session.rule} · ${result.approve} approve, ${result.reject} reject, ${result.abstain} abstain, ${result.invalid} invalid`,
  ]
  for (const ballot of [...session.ballots].sort((a, b) => a.round - b.round || a.unit - b.unit)) {
    const seat = session.seats[ballot.unit]
    const vote =
      countsAsVote(ballot) && ballot.verdict !== null ? ballot.verdict.toUpperCase() : 'INVALID'
    parts.push(
      `## Round ${ballot.round} · ${unitLabel(ballot.unit)} · ${vote}\n\n_${seat?.model ?? ballot.model}_\n\n${readVote(ballot.text).statement}`,
    )
  }
  return `${parts.join('\n\n')}\n`
}
