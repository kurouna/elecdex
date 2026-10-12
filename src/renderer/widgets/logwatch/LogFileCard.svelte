<script lang="ts">
import type { LogEncodingChoice, LogFileRef, LogStatus } from '@shared/logwatch/types'
import type { CardAnchor, CardSize } from '../../lib/hover-card.ts'
import CardRows from '../common/CardRows.svelte'
import HoverCard from '../common/HoverCard.svelte'
import { fileCardRows } from './view.ts'

/**
 * The file the pane follows, as a whole (docs/logwatch.md §9): its full path - or the folder and
 * the pattern, and the newest file it is reading - how it is read, and that a click on the name
 * chooses another.
 */
interface Props {
  file: LogFileRef
  status: LogStatus | null
  encoding: LogEncodingChoice
  anchor: CardAnchor
  bounds: CardSize
}

const { file, status, encoding, anchor, bounds }: Props = $props()
</script>

<HoverCard {anchor} {bounds} width="min(34rem, 92%)" testid="logwatch-file-card">
  <p class="head">
    <span class="name">{file.name}</span>
    <span>{file.pattern === null ? 'one file' : 'the newest like this'}</span>
  </p>
  <CardRows rows={fileCardRows(file, status, encoding)} />
  <p class="foot">click the name to choose another file</p>
</HoverCard>

<style>
p {
  margin: 0;
}

.head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}

.name {
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.foot {
  margin-top: 0.35rem;
  padding-top: 0.3rem;
  border-top: 1px solid var(--panel-rule);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}
</style>
