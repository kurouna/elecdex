<script lang="ts">
import { GMD_CAPS, GMD_PRICE_USD } from '@shared/aws/billing'
import { dayText } from '@shared/aws/facts'
import { TILE } from '@shared/aws/inventory'
import type { ResourcesView } from '@shared/aws/types'
import { afterBlink } from '../../lib/blink.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { gmdText, shownName } from './resources-view.ts'

/**
 * RESOURCES' part of ⚙ (docs/aws.md §14.4a, §14.7): ELSEWHERE's weekly sweep, GetMetricData
 * (paid, ON by default under a monthly cap) and what is kept off LOOKS FORGOTTEN. All three
 * are the account's, as main keeps them, so every pane on the account follows a change.
 */
interface Props {
  res: ResourcesView
  boardKey: string
  masked: boolean
}

const { res, boardKey, masked }: Props = $props()

function sweep(on: boolean): void {
  sfx.play('panel')
  void window.elecdex.aws.sweep(boardKey, on ? 'on' : 'off')
}

/** The cap goes with every press: one of `GMD_CAPS`, as the account's own always is. */
function metricData(on: boolean, cap: number = res.gmd.cap): void {
  sfx.play('panel')
  void window.elecdex.aws.metricData(boardKey, { on, cap: cap as (typeof GMD_CAPS)[number] })
}

/** Taking a mark off puts the row back in LOOKS FORGOTTEN: the press blinks first. */
function unkeep(button: HTMLElement, key: string): void {
  afterBlink(button, () => {
    sfx.play('folder')
    void window.elecdex.aws.keep(boardKey, key, false)
  })
}

const capWords = (cap: number) =>
  `${(cap / 1000).toLocaleString('en-US')}k · $${(cap * GMD_PRICE_USD).toFixed(2)}`
</script>

<div class="opt"><span>ELSEWHERE (the other regions, weekly)</span>
  <span class="seg"><button type="button" class="tool" class:on={res.elsewhere.on} onclick={() => sweep(true)} data-testid="aws-sweep-on">on</button><button type="button" class="tool" class:on={!res.elsewhere.on} onclick={() => sweep(false)} data-testid="aws-sweep-off">off</button></span>
</div>
<div class="opt"><span>GetMetricData (paid)</span>
  <span class="seg"><button type="button" class="tool" class:on={res.gmd.on} onclick={() => metricData(true)} data-testid="aws-gmd-on">on</button><button type="button" class="tool" class:on={!res.gmd.on} onclick={() => metricData(false)} data-testid="aws-gmd-off">off</button></span>
</div>
<div class="opt"><span>Monthly cap, metrics</span>
  <span class="seg">{#each GMD_CAPS as cap (cap)}<button type="button" class="tool" class:on={res.gmd.cap === cap} onclick={() => metricData(res.gmd.on, cap)} data-testid="aws-gmd-cap-{cap}">{capWords(cap)}</button>{/each}</span>
</div>
<p data-testid="aws-gmd-line">{gmdText(res.gmd)}{#if res.gmd.capReached} · <b class="warn">GMD CAP REACHED</b>: quiet is judged by list-metrics' 14 days until the month ends{/if}. Off: only the free reads judge, over 14 days. Quiet means {res.quietDays} days. ELSEWHERE read {dayText(res.elsewhere.readAt)}.</p>
<div class="opt"><span>Kept off LOOKS FORGOTTEN ({res.kept.length})</span></div>
{#each res.kept as mark (mark.key)}
  <div class="kept" data-testid="aws-kept">
    <span class="svc">{TILE[mark.service]?.label ?? mark.service}</span>
    <span class="mono">{shownName(mark.name, masked)}</span>
    <span class="dim">{dayText(mark.at)}{mark.usd > 0 ? ` · ≈ $${mark.usd.toFixed(2)}/mo` : ''}</span>
    <button type="button" class="tool" aria-label="show it in LOOKS FORGOTTEN again" onclick={(e) => unkeep(e.currentTarget, mark.key)} data-testid="aws-unkeep">UN-KEEP</button>
  </div>
{:else}
  <p>Nothing kept. A row's keep takes it off the list; one whose ≈ $ more than doubles comes back.</p>
{/each}

<style>
.kept { display: grid; grid-template-columns: 6rem minmax(0, 1fr) auto auto; gap: 0.5rem; align-items: center; margin: 0.15rem 0; font-size: var(--step--1); }
.kept .svc { font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kept .mono { font-family: var(--font-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dim { color: var(--text-dim); white-space: nowrap; }
.warn { color: var(--warn); }
</style>
