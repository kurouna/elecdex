import { STOP_CODES } from '@shared/ai'
import {
  type Ballot,
  countsAsVote,
  type ElecLive,
  OUTCOME_WORDS,
  resolve,
  type Session,
  type UnitIndex,
  unitLabel,
} from '@shared/elec'

/**
 * The console in the stage's corner: what the council has done, a line an event, read off
 * the deliberation as it stands. Nothing is recorded for it - the ballots carry their times
 * (`at`, and `ms` back to when the unit was asked), the answers being written their start -
 * so a pane opened on an old deliberation shows the same log as the one that watched it.
 */

export type LogTone = 'ok' | 'danger' | 'info' | 'warn' | 'accent'

export interface LogLine {
  /** Epoch ms; null for what is happening now and has no moment of its own yet. */
  at: number | null
  text: string
  tone?: LogTone
}

/** What each seat is before any motion: its unit and the model it would ask, or that it has none. */
export interface StandbySeat {
  unit: UnitIndex
  model: string
}

const VERDICT_TONES: Record<string, LogTone> = { approve: 'ok', reject: 'danger', abstain: 'info' }

function ballotLines(ballot: Ballot): LogLine[] {
  const who = unitLabel(ballot.unit)
  const lines: LogLine[] = []
  // A seat that was never asked (the deliberation stopped first) has no moment it was asked.
  if (ballot.ms !== undefined) lines.push({ at: ballot.at - ballot.ms, text: `${who} · TX` })
  if (countsAsVote(ballot) && ballot.verdict !== null) {
    const confidence = ballot.confidence === undefined ? '' : ` ${ballot.confidence}%`
    lines.push({
      at: ballot.at,
      text: `${who} · VOTE ${ballot.verdict.toUpperCase()}${confidence}`,
      tone: VERDICT_TONES[ballot.verdict] ?? 'accent',
    })
  } else {
    const why = ballot.stop === undefined ? 'NO VERDICT' : STOP_CODES[ballot.stop].toUpperCase()
    lines.push({ at: ballot.at, text: `${who} · ${why}`, tone: 'warn' })
  }
  return lines
}

function standbyLog(seats: readonly StandbySeat[], linked: boolean): LogLine[] {
  if (!linked) {
    return [
      { at: null, text: 'ELEC SYSTEM · CORE ONLINE' },
      { at: null, text: 'NO LINK · SET UP A PROVIDER', tone: 'warn' },
    ]
  }
  return [
    { at: null, text: 'ELEC SYSTEM · CORE ONLINE' },
    ...seats.map((seat): LogLine => {
      const who = unitLabel(seat.unit)
      return seat.model === ''
        ? { at: null, text: `${who} · NO MODEL`, tone: 'warn' }
        : { at: null, text: `${who} · ${seat.model} · POWER OFF` }
    }),
    { at: null, text: 'AWAITING MOTION', tone: 'accent' },
  ]
}

/** When the second round began: the first of its units to be asked, done or still writing. */
function secondRound(session: Session, live: ElecLive | null): LogLine[] {
  const starts = [
    ...session.ballots.filter((b) => b.round === 2).map((b) => b.at - (b.ms ?? 0)),
    ...(live?.round === 2 ? live.runs.map((r) => r.startedAt) : []),
  ]
  if (starts.length === 0) return []
  return [{ at: Math.min(...starts), text: 'ROUND 2 · STATEMENTS EXCHANGED', tone: 'accent' }]
}

/** The answers being written: asked when they started, and receiving now once anything came. */
function runLines(live: ElecLive | null): { timed: LogLine[]; now: LogLine[] } {
  const timed: LogLine[] = []
  const now: LogLine[] = []
  for (const run of live?.runs ?? []) {
    const who = unitLabel(run.unit)
    timed.push({ at: run.startedAt, text: `${who} · TX` })
    if (run.text === '' && run.thinking === '') continue
    const reasoning = run.text === '' ? ' · REASONING' : ''
    now.push({ at: null, text: `${who} · RX${reasoning}`, tone: 'accent' })
  }
  return { timed, now }
}

/** How it ended: the resolution with its tally, or that it never came to one. */
function ending(session: Session): LogLine {
  const result = resolve(session)
  if (result.outcome === null) return { at: null, text: 'LINK LOST · INTERRUPTED', tone: 'warn' }
  const tally = `${result.approve}·${result.reject}·${result.abstain}·${result.invalid}`
  const tone: LogTone =
    result.outcome === 'approved' ? 'ok' : result.outcome === 'rejected' ? 'danger' : 'warn'
  return {
    at: Math.max(session.createdAt, ...session.ballots.map((b) => b.at)),
    text: `RESOLUTION · ${OUTCOME_WORDS[result.outcome].toUpperCase()} ${tally}`,
    tone,
  }
}

/** The log of a deliberation, oldest first; before any, the council on standby. */
export function councilLog(
  session: Session | null,
  live: ElecLive | null,
  standby: readonly StandbySeat[],
  linked: boolean,
): LogLine[] {
  if (session === null) return standbyLog(standby, linked)
  const sign = session.id.slice(0, 4).toUpperCase()
  const rounds = session.rounds === 1 ? '1 ROUND' : `${session.rounds} ROUNDS`
  const runs = runLines(live)
  const timed: LogLine[] = [
    { at: session.createdAt, text: `MOTION #${sign} FILED` },
    { at: session.createdAt, text: `RULE ${session.rule.toUpperCase()} · ${rounds}` },
    { at: session.createdAt, text: 'POWER ON · 3 UNITS', tone: 'accent' },
    ...secondRound(session, live),
    ...session.ballots.flatMap(ballotLines),
    ...runs.timed,
  ]
  // Stable: lines of one moment keep the order they were written in.
  timed.sort((a, b) => (a.at ?? 0) - (b.at ?? 0))
  return live !== null ? [...timed, ...runs.now] : [...timed, ending(session)]
}
