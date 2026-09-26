<script lang="ts">
import type { AgentFile, AgentSession, AgentTask } from '@shared/agents'
import { type CardAnchor, type CardRow, type CardSize, cardTime } from '../../lib/hover-card.ts'
import CardRows from '../common/CardRows.svelte'
import HoverCard from '../common/HoverCard.svelte'
import { agentFilePath, fileRows, sessionRows, taskRows } from './cards.ts'

/**
 * The whole of a session, a task or a changed file of the AGENT pane, while the
 * pointer rests on it: what the one-line row has no room for. The frame and its
 * place are every detail card's (HoverCard, architecture.md §7.4); the words
 * come from cards.ts. What an agent wrote is its text: drawn as text.
 */
export type AgentDetail =
  | { kind: 'session'; session: AgentSession }
  | { kind: 'task'; session: AgentSession; task: AgentTask }
  | { kind: 'file'; session: AgentSession; file: AgentFile }

interface Props {
  detail: AgentDetail
  now: number
  anchor: CardAnchor
  bounds: CardSize
}

const { detail, now, anchor, bounds }: Props = $props()

const heading = $derived.by((): { title: string; sub: string | null; rows: CardRow[] } => {
  if (detail.kind === 'session') {
    const { session } = detail
    return { title: session.title, sub: session.cwd, rows: sessionRows(session, now, cardTime) }
  }
  if (detail.kind === 'task') {
    return { title: detail.task.title, sub: null, rows: taskRows(detail.task, now, cardTime) }
  }
  return {
    title: agentFilePath(detail.session.cwd, detail.file.path),
    sub: null,
    rows: [...fileRows(detail.file), { label: 'CLICK', value: 'shows its diff', muted: true }],
  }
})
</script>

<HoverCard {anchor} {bounds} width="30rem" testid="agent-detail" data-kind={detail.kind}>
  <p class="title" class:path={detail.kind === 'file'} data-testid="agent-detail-title">{heading.title}</p>
  {#if heading.sub !== null}<p class="sub" data-testid="agent-detail-sub">{heading.sub}</p>{/if}
  <CardRows rows={heading.rows} />
</HoverCard>

<style>
p {
  margin: 0;
}

.title {
  font-weight: 600;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* A path: every character of it matters, none of it is a heading. */
.title.path {
  font-weight: 400;
  color: var(--accent-strong);
}

.sub {
  margin-top: 0.1rem;
  color: var(--text-muted);
  overflow-wrap: anywhere;
}

</style>
