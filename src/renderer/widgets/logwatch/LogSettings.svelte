<script lang="ts">
import type { AiProvider } from '@shared/ai'
import {
  ENCODING_NAMES,
  FORMAT_NAMES,
  INITIAL_LINES,
  KEEP_LINES,
  LOG_ENCODINGS,
  LOG_FORMATS,
  type LogEncodingChoice,
  type LogFormat,
} from '@shared/logwatch/types'
import type { LogPaneChoices, TimeMode } from './view.ts'

/**
 * LOG WATCH's settings (docs/logwatch.md §8), opened by the sliders in the corner as every pane's
 * are. The pane's own choices first, then the file's dialect (every pane on it), then what holds
 * for every LOG WATCH pane, then EXPLAIN's provider when the AI settings have any.
 */
interface Props {
  choices: LogPaneChoices
  /** The dialect set for the file, or null when it is detected; and what was detected. */
  format: LogFormat | null
  detected: LogFormat | null
  keepLines: number
  initialLines: number
  providers: readonly AiProvider[]
  onpane: (change: Record<string, unknown>) => void
  onformat: (format: LogFormat | null) => void
  onapp: (change: { keepLines?: number; initialLines?: number }) => void
  onchoose: () => void
}

const {
  choices,
  format,
  detected,
  keepLines,
  initialLines,
  providers,
  onpane,
  onformat,
  onapp,
  onchoose,
}: Props = $props()

const TIMES: { value: TimeMode; label: string }[] = [
  { value: 'abs', label: '12:04:01.231' },
  { value: 'rel', label: '3s ago' },
  { value: 'delta', label: '+0.118' },
]

const short = (n: number): string => (n >= 1000 ? `${n / 1000}k` : String(n))
const provider = $derived(providers.find((p) => p.id === choices.provider) ?? providers[0])
</script>

<div class="settings" data-testid="logwatch-settings">
  <p class="title">this pane</p>
  <div class="group" role="radiogroup" aria-label="time">
    <span>time</span>
    {#each TIMES as time (time.value)}
      <button
        type="button"
        role="radio"
        aria-checked={choices.time === time.value}
        onclick={() => onpane({ time: time.value === 'abs' ? undefined : time.value })}
        data-testid="logwatch-time"
        data-value={time.value}>{time.label}</button
      >
    {/each}
  </div>
  {#each [{ key: 'fold', label: 'fold repeats', on: choices.fold }, { key: 'chart', label: 'chart', on: choices.chart }, { key: 'errorBar', label: 'error bar', on: choices.errorBar }] as toggle (toggle.key)}
    <div class="group" role="radiogroup" aria-label={toggle.label}>
      <span>{toggle.label}</span>
      <button
        type="button"
        role="radio"
        aria-checked={toggle.on}
        onclick={() => onpane({ [toggle.key]: undefined })}
        data-testid="logwatch-{toggle.key}-on">on</button
      ><button
        type="button"
        role="radio"
        aria-checked={!toggle.on}
        onclick={() => onpane({ [toggle.key]: false })}
        data-testid="logwatch-{toggle.key}-off">off</button
      >
    </div>
  {/each}
  <label class="group">
    <span>encoding</span>
    <select
      value={choices.encoding}
      onchange={(event) => {
        const value = event.currentTarget.value as LogEncodingChoice
        onpane({ encoding: value === 'auto' ? undefined : value })
      }}
      data-testid="logwatch-encoding"
    >
      {#each LOG_ENCODINGS as encoding (encoding)}
        <option value={encoding}>{ENCODING_NAMES[encoding]}</option>
      {/each}
    </select>
  </label>

  <p class="title">this file, in every pane</p>
  <label class="group">
    <span>format</span>
    <select
      value={format ?? 'auto'}
      onchange={(event) => {
        const value = event.currentTarget.value
        onformat(value === 'auto' ? null : (value as LogFormat))
      }}
      data-testid="logwatch-format"
    >
      <option value="auto">auto{detected !== null ? ` · ${FORMAT_NAMES[detected]}` : ''}</option>
      {#each LOG_FORMATS as each (each)}
        <option value={each}>{FORMAT_NAMES[each]}</option>
      {/each}
    </select>
  </label>
  <button type="button" class="choose" onclick={onchoose} data-testid="logwatch-change"
    >ANOTHER FILE</button
  >

  <p class="title">every log watch pane</p>
  <div class="group" role="radiogroup" aria-label="lines kept">
    <span>lines kept</span>
    {#each KEEP_LINES as n (n)}
      <button
        type="button"
        role="radio"
        aria-checked={keepLines === n}
        onclick={() => onapp({ keepLines: n })}
        data-testid="logwatch-keep"
        data-value={n}>{short(n)}</button
      >
    {/each}
  </div>
  <div class="group" role="radiogroup" aria-label="lines on opening">
    <span>lines on opening</span>
    {#each INITIAL_LINES as n (n)}
      <button
        type="button"
        role="radio"
        aria-checked={initialLines === n}
        onclick={() => onapp({ initialLines: n })}
        data-testid="logwatch-initial"
        data-value={n}>{short(n)}</button
      >
    {/each}
  </div>

  {#if providers.length > 0}
    <p class="title">explain</p>
    <label class="group">
      <span>provider</span>
      <select
        value={provider?.id ?? ''}
        onchange={(event) => onpane({ provider: event.currentTarget.value, model: undefined })}
        data-testid="logwatch-provider"
      >
        {#each providers as each (each.id)}
          <option value={each.id}>{each.name}</option>
        {/each}
      </select>
    </label>
    <label class="group">
      <span>model</span>
      <input
        type="text"
        value={choices.model}
        placeholder={provider?.model ?? ''}
        spellcheck="false"
        onchange={(event) => onpane({ model: event.currentTarget.value.trim() || undefined })}
        data-testid="logwatch-model"
      />
    </label>
  {/if}
</div>

<style>
.settings {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-4);
  margin-right: 1.6rem;
  padding-bottom: var(--space-1);
  border-bottom: 1px solid var(--panel-rule);
  font-size: var(--step--1);
  text-transform: uppercase;
}

.title {
  flex-basis: 100%;
  margin: var(--space-1) 0 0;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}

.group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.group > span {
  margin-right: var(--space-1);
  color: var(--text-muted);
}

.group button,
.choose {
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  text-transform: none;
  cursor: pointer;
}

.group button[aria-checked='true'] {
  background: var(--accent);
  color: var(--text-inverse);
  border-color: var(--accent);
}

.choose {
  font-family: var(--font-ui);
  letter-spacing: var(--tracking-wide);
}

.choose:hover,
.group button:hover {
  color: var(--text);
}

select,
input {
  border: 1px solid var(--panel-border);
  background: var(--panel-bg-raised);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  text-transform: none;
}

input {
  width: 14rem;
  padding: 0 var(--space-1);
}
</style>
