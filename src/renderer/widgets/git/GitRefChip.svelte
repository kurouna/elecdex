<script lang="ts">
import type { GitRef } from '@shared/git'
import { REF_MARK } from './rows.ts'

/** A branch, tag, remote or HEAD by a commit: the graph's rows and the commit card draw it alike. */
interface Props {
  ref: GitRef
  testid?: string
}

const { ref, testid }: Props = $props()
</script>

<span class="ref {ref.kind}" class:current={ref.current} data-testid={testid} data-kind={ref.kind}
  >{REF_MARK[ref.kind]}{ref.name}</span
>

<style>
.ref {
  padding: 0 0.3rem;
  border: 1px solid var(--accent-dim);
  color: var(--text);
  font-family: var(--font-ui);
  letter-spacing: 0.06em;
}

.ref.current,
.ref.head {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 22%, transparent);
}

.ref.remote {
  border-style: dashed;
  color: var(--text-muted);
}

.ref.tag {
  border-color: var(--warn);
  color: var(--warn);
}
</style>
