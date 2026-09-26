<script lang="ts">
import {
  parseRgb,
  QR_CAPACITY,
  QR_QUIET,
  type QrColours,
  qrColours,
  qrPayload,
  qrPixels,
  utf8Length,
} from '@shared/qr'
import {
  QR_ECC,
  QR_KINDS,
  type QrKind,
  UTILITY_LIMITS,
  type UtilityPane,
  WIFI_AUTH,
} from '@shared/utility'
import { CopyFlag } from '../../lib/copied.svelte.ts'
import { qrBuild } from '../../lib/qr-code.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'

/**
 * QR (docs/architecture.md section 5.16): a code for a text, an address or a
 * Wi-Fi network, made in the page with no network.
 *
 * It is drawn in the theme's colours, always dark modules on a light ground
 * (`qrColours`), one module to a whole number of the screen's pixels. The
 * Wi-Fi password is kept in pane state only as main sealed it, opened only
 * while the Wi-Fi code is shown; a code with a password in it is veiled until
 * REVEAL, and again whenever the pane goes out of sight.
 */
interface Props {
  paneId: string
  pane: UtilityPane
  visible: boolean
}

const { paneId, pane, visible }: Props = $props()

const KIND_LABELS: Record<QrKind, string> = { text: 'TEXT', url: 'URL', wifi: 'WI-FI' }
const AUTH_LABELS = { WPA: 'WPA', WEP: 'WEP', nopass: 'OPEN' } as const
/** How much of a code each level can lose and still be read. */
const ECC_LOSS = { L: '7%', M: '15%', Q: '25%', H: '30%' } as const

function save(change: Partial<Record<keyof UtilityPane, unknown>>): void {
  widgetState.patch(paneId, change)
}

// ---- the Wi-Fi password ----

/** What is typed into the field now; the saved password never goes into it. */
let typed = $state('')
/** The saved password, as main unsealed it. */
let saved = $state('')
let showTyped = $state(false)
/** Where the saved password stands, for the line under the field. */
let sealState = $state<'none' | 'opening' | 'saved' | 'foreign' | 'unsaved'>('none')

const wifi = $derived(pane.qrKind === 'wifi')
const needsPassword = $derived(wifi && pane.wifiAuth !== 'nopass')
const password = $derived(typed !== '' ? typed : saved)

// Opened only while the Wi-Fi code is on screen: on macOS the first opening asks the Keychain.
let opened: string | null = null
$effect(() => {
  const sealed = pane.wifiSealed
  if (!visible || !wifi || sealed === null || sealed === opened) return
  opened = sealed
  sealState = 'opening'
  void window.elecdex.utility.unseal(sealed).then((plain) => {
    if (opened !== sealed) return
    saved = plain ?? ''
    sealState = plain === null ? 'foreign' : 'saved'
  })
})

let sealTimer: ReturnType<typeof setTimeout> | undefined
function onPassword(value: string): void {
  typed = value.slice(0, UTILITY_LIMITS.password)
  clearTimeout(sealTimer)
  if (typed === '') return
  // Sealed once the typing stops, not on every key.
  sealTimer = setTimeout(() => {
    const plain = typed
    void window.elecdex.utility.seal(plain).then((sealed) => {
      // Typed over or forgotten meanwhile: this one is not what the field says any more.
      if (typed !== plain) return
      if (sealed === null) {
        sealState = 'unsaved'
        save({ wifiSealed: undefined })
        return
      }
      opened = sealed
      saved = plain
      sealState = 'saved'
      save({ wifiSealed: sealed })
    })
  }, 400)
}

function forget(): void {
  clearTimeout(sealTimer)
  typed = ''
  saved = ''
  opened = null
  sealState = 'none'
  save({ wifiSealed: undefined })
  sfx.play('collapse')
}

$effect(() => () => clearTimeout(sealTimer))

const SEAL_WORDS = {
  none: '',
  opening: 'opening…',
  saved: 'saved, sealed by the system',
  foreign: 'SEALED ON ANOTHER MACHINE: type it again',
  unsaved: 'NOT SAVED · NO KEYRING: kept until elecdex quits',
} as const

// ---- the code ----

const payload = $derived(qrPayload(pane, password))
const built = $derived(qrBuild(payload, pane.qrEcc))

/** A code with a password in it waits for REVEAL, and waits again once it is out of sight. */
let revealed = $state(false)
$effect(() => {
  if (!visible) revealed = false
})
const veiled = $derived(needsPassword && password !== '' && !revealed)

let plate = $state<HTMLElement | null>(null)
let canvas = $state<HTMLCanvasElement | null>(null)
let boxWidth = $state(0)
let boxHeight = $state(0)

/** The theme's colours as the canvas reads them, again whenever the theme changes. */
function themeColours(): QrColours {
  void appearance.revision
  if (plate === null) return qrColours({ accent: null, ground: null, text: null })
  const style = getComputedStyle(plate)
  const probe = document.createElement('canvas').getContext('2d')
  const read = (name: string) => {
    const value = style.getPropertyValue(name).trim()
    if (probe === null || value === '') return null
    probe.fillStyle = '#000'
    probe.fillStyle = value
    return parseRgb(String(probe.fillStyle))
  }
  return qrColours({ accent: read('--accent'), ground: read('--app-bg'), text: read('--text') })
}

const colours = $derived(themeColours())

$effect(() => {
  const el = canvas
  if (el === null) return
  const ctx = el.getContext('2d')
  if (ctx === null) return
  if (built.kind !== 'code' || veiled || boxWidth === 0) {
    el.width = 0
    el.height = 0
    return
  }
  const ratio = window.devicePixelRatio || 1
  const modules = built.code.size + QR_QUIET * 2
  // A whole number of device pixels to a module: a fraction blurs the edges a reader looks for.
  const scale = Math.max(1, Math.floor((Math.min(boxWidth, boxHeight) * ratio) / modules))
  const { width, data } = qrPixels(built.code, colours, scale)
  el.width = width
  el.height = width
  el.style.width = `${width / ratio}px`
  el.style.height = `${width / ratio}px`
  ctx.putImageData(new ImageData(data, width, width), 0, 0)
})

const bytes = $derived(utf8Length(payload))
/** The version, level and size when there is a code, and always the bytes against the room. */
const figures = $derived.by(() => {
  const room = `${bytes}/${QR_CAPACITY[pane.qrEcc]} B`
  if (built.kind !== 'code') return room
  const { version, size } = built.code
  return `v${version} · ${pane.qrEcc} · ${size}×${size} · ${room}`
})

// ---- COPY ----

const copied = new CopyFlag()
$effect(() => () => copied.dispose())

/** The code as a PNG, eight pixels to a module, in the colours it is drawn in. */
async function copy(): Promise<void> {
  if (built.kind !== 'code') return
  const { width, data: pixels } = qrPixels(built.code, colours, 8)
  const out = document.createElement('canvas')
  out.width = width
  out.height = width
  out.getContext('2d')?.putImageData(new ImageData(pixels, width, width), 0, 0)
  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png'))
  if (blob === null) return
  const data = new Uint8Array(await blob.arrayBuffer())
  if (await copied.through('qr', () => window.elecdex.utility.copy({ kind: 'png', data })))
    sfx.play('folder')
}
</script>

<div class="qr" data-testid="qr">
  <div class="fields">
    <div class="u-row">
      <span class="u-label">KIND</span>
      <span class="u-chips">
        {#each QR_KINDS as kind (kind)}
          <button
            type="button"
            class="u-chip"
            class:on={pane.qrKind === kind}
            aria-pressed={pane.qrKind === kind}
            onclick={() => save({ qrKind: kind })}
            data-testid="qr-kind"
            data-kind={kind}>{KIND_LABELS[kind]}</button
          >
        {/each}
      </span>
    </div>

    {#if pane.qrKind === 'text'}
      <textarea
        class="input"
        rows="4"
        maxlength={UTILITY_LIMITS.qrText}
        spellcheck="false"
        placeholder="text to put in the code"
        aria-label="text"
        value={pane.qrText}
        oninput={(e) => save({ qrText: e.currentTarget.value || undefined })}
        data-testid="qr-text"
      ></textarea>
    {:else if pane.qrKind === 'url'}
      <input
        class="input"
        spellcheck="false"
        maxlength={UTILITY_LIMITS.qrText}
        placeholder="example.com/page"
        aria-label="address"
        value={pane.qrUrl}
        oninput={(e) => save({ qrUrl: e.currentTarget.value || undefined })}
        data-testid="qr-url"
      />
    {:else}
      <input
        class="input"
        spellcheck="false"
        maxlength={UTILITY_LIMITS.ssid}
        placeholder="network name (SSID)"
        aria-label="network name"
        value={pane.wifiSsid}
        oninput={(e) => save({ wifiSsid: e.currentTarget.value || undefined })}
        data-testid="qr-ssid"
      />
      <div class="u-row">
        <span class="u-label">SECURITY</span>
        <span class="u-chips">
          {#each WIFI_AUTH as auth (auth)}
            <button
              type="button"
              class="u-chip"
              class:on={pane.wifiAuth === auth}
              aria-pressed={pane.wifiAuth === auth}
              onclick={() => save({ wifiAuth: auth })}
              data-testid="qr-auth"
              data-auth={auth}>{AUTH_LABELS[auth]}</button
            >
          {/each}
        </span>
        <button
          type="button"
          class="u-chip"
          class:on={pane.wifiHidden}
          aria-pressed={pane.wifiHidden}
          title="the network does not announce its name"
          onclick={() => save({ wifiHidden: pane.wifiHidden ? undefined : true })}
          data-testid="qr-hidden">HIDDEN</button
        >
      </div>
      {#if needsPassword}
        <div class="secret">
          <input
            class="input"
            type={showTyped ? 'text' : 'password'}
            autocomplete="off"
            spellcheck="false"
            maxlength={UTILITY_LIMITS.password}
            placeholder={saved !== '' ? '•••••••• saved' : 'password'}
            aria-label="password"
            value={typed}
            oninput={(e) => onPassword(e.currentTarget.value)}
            data-testid="qr-password"
          />
          <button
            type="button"
            class="u-chip"
            class:on={showTyped}
            aria-pressed={showTyped}
            title="show what is being typed"
            onclick={() => (showTyped = !showTyped)}>SHOW</button
          >
          <button
            type="button"
            class="u-chip"
            disabled={password === '' && pane.wifiSealed === null}
            title="forget the saved password"
            onclick={forget}
            data-testid="qr-forget">FORGET</button
          >
        </div>
        {#if SEAL_WORDS[sealState] !== ''}
          <span
            class="seal"
            class:warn={sealState === 'foreign' || sealState === 'unsaved'}
            data-testid="qr-seal">{SEAL_WORDS[sealState]}</span
          >
        {/if}
      {/if}
    {/if}

    <div class="u-row">
      <span class="u-label">ECC</span>
      <span class="u-chips">
        {#each QR_ECC as ecc (ecc)}
          <button
            type="button"
            class="u-chip"
            class:on={pane.qrEcc === ecc}
            aria-pressed={pane.qrEcc === ecc}
            title={`error correction ${ecc}: ${ECC_LOSS[ecc]} of the code may be lost`}
            onclick={() => save({ qrEcc: ecc === 'M' ? undefined : ecc })}
            data-testid="qr-ecc"
            data-ecc={ecc}>{ecc}</button
          >
        {/each}
      </span>
    </div>
  </div>

  <div class="stage">
    <div class="plate" bind:this={plate} bind:clientWidth={boxWidth} bind:clientHeight={boxHeight}>
      <canvas bind:this={canvas} data-testid="qr-canvas" data-modules={built.kind === 'code' ? built.code.size : 0}></canvas>
      {#if built.kind === 'empty'}
        <span class="empty">{wifi ? 'name the network' : 'type or paste'}</span>
      {:else if built.kind === 'over'}
        <span class="empty warn" data-testid="qr-over">OVER CAPACITY</span>
      {:else if veiled}
        <button type="button" class="veil" onclick={() => (revealed = true)} data-testid="qr-reveal">
          <b>REVEAL</b><span>the code holds the password</span>
        </button>
      {/if}
    </div>
    <div class="foot">
      <span class="figures" class:warn={built.kind === 'over'} data-testid="qr-figures">
        {figures}
      </span>
      <button
        type="button"
        class="u-chip"
        disabled={built.kind !== 'code'}
        onclick={() => void copy()}
        data-testid="qr-copy">{copied.key === 'qr' ? 'COPIED' : 'COPY'}</button
      >
    </div>
  </div>
</div>

<style>
.qr {
  container-type: inline-size;
  display: grid;
  flex: 1;
  grid-template-columns: 1fr;
  grid-template-rows: auto minmax(10rem, 1fr);
  gap: var(--space-2);
  min-height: 0;
}

@container (min-width: 30rem) {
  .qr {
    grid-template-columns: minmax(12rem, 1fr) minmax(10rem, 1fr);
    grid-template-rows: 1fr;
  }
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
  overflow-y: auto;
}

.input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.25rem 0.4rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  resize: vertical;
}

.input:focus {
  border-color: var(--accent);
  outline: none;
}

.secret {
  display: flex;
  gap: 0.3rem;
}

.seal {
  font-size: var(--step--2);
  color: var(--text-muted);
}

.warn {
  color: var(--warn);
}

.stage {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  min-height: 0;
}

/* The code's frame: corner brackets in the HUD's manner, the code in the middle. */
.plate {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 8rem;
  overflow: hidden;
  background:
    linear-gradient(var(--accent), var(--accent)) top left / 0.8rem 1px,
    linear-gradient(var(--accent), var(--accent)) top left / 1px 0.8rem,
    linear-gradient(var(--accent), var(--accent)) top right / 0.8rem 1px,
    linear-gradient(var(--accent), var(--accent)) top right / 1px 0.8rem,
    linear-gradient(var(--accent), var(--accent)) bottom left / 0.8rem 1px,
    linear-gradient(var(--accent), var(--accent)) bottom left / 1px 0.8rem,
    linear-gradient(var(--accent), var(--accent)) bottom right / 0.8rem 1px,
    linear-gradient(var(--accent), var(--accent)) bottom right / 1px 0.8rem;
  background-repeat: no-repeat;
}

canvas {
  image-rendering: pixelated;
}

.empty {
  position: absolute;
  font-family: var(--font-display);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}

.veil {
  position: absolute;
  inset: 0.8rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  border: 1px dashed var(--accent-dim);
  background: var(--accent-faint);
  color: var(--text-muted);
  font-size: var(--step--1);
  cursor: pointer;
}

.veil b {
  font-family: var(--font-display);
  font-size: var(--step-0);
  font-weight: 400;
  letter-spacing: var(--tracking-wider);
  color: var(--accent-strong);
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.figures {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
