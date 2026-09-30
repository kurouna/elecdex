<script lang="ts">
import { type ChatAttachment, compactCount, fileSize } from '@shared/ai'
import { KIND_TAGS, payloadReadout } from '@shared/ai-attach'
import { crtPower } from '../../lib/crt-transitions.ts'
import type { Reading } from './draft.svelte.ts'

/**
 * A question's files as a row of chips: what goes with it, what each is, and - while it is still
 * being written - a × to leave one out. The composer's row is the PAYLOAD, with its total; a
 * sent question shows the same chips, read only. A chip's whole is its detail card (FileCard),
 * which the pane draws: a chip only reports where it is.
 */
interface Props {
  files: readonly (ChatAttachment & { thumb?: string | undefined })[]
  reading?: readonly Reading[]
  /** The small pictures of sent images, by attachment id. */
  thumbs?: Readonly<Record<string, string>>
  /** A × on each chip, and the payload's head and total. */
  editable?: boolean
  /** Files the chosen provider is not sent, by id: marked. */
  unsent?: ReadonlySet<string>
  onremove?: (id: string) => void
  onhover: (file: ChatAttachment, event: { row: DOMRect; x: number | null } | null) => void
  testid: string
}

const {
  files,
  reading = [],
  thumbs = {},
  editable = false,
  unsent = new Set<string>(),
  onremove,
  onhover,
  testid,
}: Props = $props()

const total = $derived(payloadReadout(files))

const thumbOf = (file: Props['files'][number]): string | undefined => file.thumb ?? thumbs[file.id]

function pointed(file: ChatAttachment, event: PointerEvent): void {
  if (event.pointerType === 'touch') return
  const row = (event.currentTarget as HTMLElement).getBoundingClientRect()
  onhover(file, { row, x: event.clientX })
}

function focused(file: ChatAttachment, event: FocusEvent | MouseEvent): void {
  const row = (event.currentTarget as HTMLElement).getBoundingClientRect()
  onhover(file, { row, x: null })
}
</script>

<div class="payload" class:editable data-testid={testid}>
  {#if editable}
    <span class="head" aria-hidden="true">payload</span>
  {/if}
  <ul aria-label={editable ? 'files to send' : 'attached files'}>
    {#each files as file (file.id)}
      {@const thumb = thumbOf(file)}
      <li
        class="chip"
        class:crt-on={editable}
        class:unsent={unsent.has(file.id)}
        data-kind={file.kind}
        data-testid="aichat-chip"
        transition:crtPower
      >
        <button
          type="button"
          class="face"
          aria-label="{file.name}, {file.kind === 'pdf' ? 'PDF' : file.kind}, {fileSize(file.bytes)}"
          onpointerenter={(e) => pointed(file, e)}
          onpointerleave={() => onhover(file, null)}
          onfocus={(e) => focused(file, e)}
          onblur={() => onhover(file, null)}
          onclick={(e) => focused(file, e)}
        >
          {#if thumb !== undefined}
            <img src={thumb} alt="" />
          {:else}
            <span class="tag">{KIND_TAGS[file.kind]}</span>
          {/if}
          <span class="name">{file.name}</span>
          <span class="size">{fileSize(file.bytes)}</span>
        </button>
        {#if editable && onremove !== undefined}
          <button
            type="button"
            class="drop"
            aria-label="leave out {file.name}"
            title="leave this file out"
            onclick={() => onremove(file.id)}
            data-testid="aichat-chip-remove">×</button
          >
        {/if}
      </li>
    {/each}
    {#each reading as entry (entry.key)}
      <li class="chip reading crt-on" data-testid="aichat-chip-reading" transition:crtPower>
        <span class="face">
          <span class="tag">···</span>
          <span class="name">{entry.name}</span>
          <span class="size">reading</span>
        </span>
      </li>
    {/each}
  </ul>
  {#if editable && files.length > 0}
    <span class="total" title="files · their size · estimated tokens the model reads" data-testid="aichat-payload-total"
      >{total.files} {total.files === 1 ? 'file' : 'files'} · {fileSize(total.bytes)} · ~{compactCount(total.tokens)} tok</span
    >
  {/if}
</div>

<style>
.payload {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.payload.editable {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--panel-border);
  border-bottom: 0;
}

.head,
.total {
  flex: none;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
  user-select: none;
}

.total {
  margin-left: auto;
  font-size: var(--step--1);
  font-family: var(--font-mono);
  letter-spacing: 0;
  text-transform: none;
}

ul {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* A file: its picture or its kind, its name, its size - with the panels' cut corner. */
.chip {
  display: flex;
  align-items: stretch;
  max-width: 100%;
  min-width: 0;
  border: 1px solid var(--accent-dim);
  background: var(--app-bg);
  clip-path: polygon(0 0, calc(100% - 0.35rem) 0, 100% 0.35rem, 100% 100%, 0 100%);
}

.chip.unsent {
  border-color: var(--warn);
}

.chip.reading {
  border-style: dashed;
  color: var(--text-muted);
}

.face {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  min-width: 0;
  padding: 0 var(--space-1) 0 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: default;
}

.face:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: -1px;
}

img {
  flex: none;
  width: 1.5rem;
  height: 1.5rem;
  object-fit: cover;
  border-right: 1px solid var(--accent-dim);
}

.tag {
  flex: none;
  display: flex;
  align-items: center;
  align-self: stretch;
  padding: 0 0.3rem;
  border-right: 1px solid var(--accent-dim);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: 0.06em;
  color: var(--accent);
}

.unsent .tag {
  color: var(--warn);
}

.name {
  min-width: 0;
  max-width: 12rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: var(--step--1);
}

.size {
  flex: none;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-muted);
}

.drop {
  flex: none;
  padding: 0 var(--space-1);
  border: 0;
  border-left: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  cursor: pointer;
}

.drop:hover,
.drop:focus-visible {
  color: var(--warn);
  outline: none;
}
</style>
