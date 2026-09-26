<script lang="ts">
import type { GitFile } from '@shared/git'
import type { CardAnchor, CardSize } from '../../lib/hover-card.ts'
import CardRows from '../common/CardRows.svelte'
import HoverCard from '../common/HoverCard.svelte'
import { fileRows, repoFilePath } from './file-card.ts'

/**
 * A changed file in full, while the pointer rests on its row: the row shows its
 * path in the repository, cut to the width; the card shows where it is on this
 * machine, what happened to it, and what the row does when pressed. The frame
 * and its place are every detail card's (HoverCard, architecture.md §7.4).
 */
interface Props {
  file: GitFile
  repoPath: string
  /** The file is a commit's, not the working tree's. */
  commit: boolean
  anchor: CardAnchor
  bounds: CardSize
}

const { file, repoPath, commit, anchor, bounds }: Props = $props()
</script>

<HoverCard {anchor} {bounds} width="30rem" testid="git-file-card">
  <p class="path" data-testid="git-file-card-path">{repoFilePath(repoPath, file.path)}</p>
  <CardRows rows={fileRows(file, repoPath, commit)} />
</HoverCard>

<style>
.path {
  margin: 0;
  color: var(--accent-strong);
  overflow-wrap: anywhere;
}

</style>
