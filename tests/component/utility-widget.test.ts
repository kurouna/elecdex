import { type AwakeRequest, type AwakeState, RELEASED } from '@shared/utility'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: UtilityWidget } = await import(
  '../../src/renderer/widgets/utility/UtilityWidget.svelte'
)
const { awake } = await import('../../src/renderer/stores/awake.svelte.ts')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')

/**
 * The UTILITY pane: a switch of tools over one pane state. AWAKE shows and
 * changes main's hold, and the other tools say while it holds; QR opens a
 * sealed password only while its Wi-Fi code is on screen; CODEC answers as the
 * input changes and copies through main.
 */

const released: AwakeState = { ...RELEASED, held: false, onBattery: false }
const set = vi.fn(async (request: AwakeRequest): Promise<AwakeState> => {
  if (request.level === 'off') return released
  const now = Date.now()
  return {
    level: request.level,
    until: request.forMs === null ? null : now + request.forMs,
    since: now,
    held: true,
    onBattery: false,
  }
})
const seal = vi.fn(async (secret: string) => `v1:${btoa(secret)}` as string | null)
const unseal = vi.fn(async (_sealed: string) => 'correct horse' as string | null)
const copy = vi.fn(async (_what: unknown) => true)

beforeEach(() => {
  set.mockClear()
  seal.mockClear()
  unseal.mockClear()
  copy.mockClear()
  awake.state = released
  // The code's frame is measured to size the code; jsdom has no observer.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('elecdex', {
    utility: {
      awake: { set, extend: vi.fn(), state: vi.fn(async () => released), onChange: () => () => {} },
      seal,
      unseal,
      copy,
    },
    layout: { save: vi.fn(async () => {}) },
  })
})

afterEach(async () => {
  cleanup()
  vi.useRealTimers()
  await layout.flush()
  vi.unstubAllGlobals()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

async function mount(state: Record<string, unknown> = {}, visible = true) {
  const view = render(UtilityWidget, {
    props: { paneId: 'u1', title: 'utility', props: {}, state, active: true, visible },
  })
  await settle()
  return view
}

describe('AWAKE', () => {
  it('shows nothing held, and asks main for a level for the length the pane chose', async () => {
    await mount({ awakeFor: 1_800_000 })
    expect(screen.getByTestId('awake-state').textContent).toBe('RELEASED')
    expect(screen.getByTestId('awake-face').textContent).toBe('OFF')
    await fireEvent.click(screen.getByText('SYSTEM'))
    await settle()
    expect(set).toHaveBeenCalledWith({ level: 'system', forMs: 1_800_000 })
    expect(screen.getByTestId('awake-state').textContent).toBe('HOLD · SYSTEM')
    expect(screen.getByTestId('awake-face').textContent).toMatch(/^00:(29:5\d|30:00)$/)
  })

  it('offers +30M only for a hold with an end', async () => {
    await mount()
    const extend = screen.getByTestId('awake-extend') as HTMLButtonElement
    expect(extend.disabled).toBe(true)
    awake.state = { level: 'display', until: null, since: Date.now(), held: true, onBattery: false }
    await settle()
    expect(extend.disabled).toBe(true)
    awake.state = { ...awake.state, until: Date.now() + 60_000 }
    await settle()
    expect(extend.disabled).toBe(false)
  })

  it('says when the system did not take the request, and when on battery', async () => {
    await mount()
    awake.state = { level: 'system', until: null, since: Date.now(), held: false, onBattery: true }
    await settle()
    expect(screen.getByTestId('awake-state').textContent).toBe('NO HOLD')
    expect(screen.getByTestId('awake-battery')).toBeTruthy()
  })

  it('is said beside the switch while another tool is shown', async () => {
    await mount({ module: 'codec' })
    expect(screen.queryByTestId('utility-hold-aside')).toBeNull()
    awake.state = { level: 'display', until: null, since: Date.now(), held: true, onBattery: false }
    await settle()
    expect(screen.getByTestId('utility-hold-aside').textContent).toContain('display · ∞')
  })
})

describe('QR', () => {
  const wifi = { module: 'qr', qrKind: 'wifi', wifiSsid: 'lab', wifiSealed: 'v1:c2VjcmV0' }

  it('opens a sealed password only while its Wi-Fi code is on screen, and veils the code', async () => {
    const view = await mount(wifi, false)
    expect(unseal).not.toHaveBeenCalled()
    await view.rerender({ visible: true })
    await settle()
    expect(unseal).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('qr-seal').textContent).toBe('saved, sealed by the system')
    expect(screen.getByTestId('qr-reveal')).toBeTruthy()
    // The field never holds the saved password: it is a placeholder's dots.
    expect((screen.getByTestId('qr-password') as HTMLInputElement).value).toBe('')
  })

  it('says when a sealed password was sealed on another machine', async () => {
    unseal.mockResolvedValueOnce(null)
    await mount(wifi)
    expect(screen.getByTestId('qr-seal').textContent).toMatch(/ANOTHER MACHINE/)
    expect(screen.queryByTestId('qr-reveal')).toBeNull()
  })

  it('lets go of a password forgotten while it was being sealed', async () => {
    vi.useFakeTimers()
    let finish: (sealed: string | null) => void = () => {}
    seal.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)))
    await mount({ module: 'qr', qrKind: 'wifi', wifiSsid: 'lab' })
    await fireEvent.input(screen.getByTestId('qr-password'), { target: { value: 'pw' } })
    vi.advanceTimersByTime(400)
    expect(seal).toHaveBeenCalledWith('pw')
    await fireEvent.click(screen.getByTestId('qr-forget'))
    finish('v1:cHc=')
    await settle()
    expect(screen.queryByTestId('qr-seal')).toBeNull()
    expect(screen.queryByTestId('qr-reveal')).toBeNull()
  })

  it('reads the room a text takes, and says when it does not fit', async () => {
    await mount({ module: 'qr', qrText: 'x'.repeat(1300), qrEcc: 'H' })
    expect(screen.getByTestId('qr-over').textContent).toBe('OVER CAPACITY')
    expect(screen.getByTestId('qr-figures').textContent?.trim()).toBe('1300/1273 B')
  })
})

describe('CODEC', () => {
  it('answers as the input changes and copies the answer through main', async () => {
    await mount({ module: 'codec' })
    await fireEvent.input(screen.getByTestId('codec-input'), { target: { value: 'elecdex' } })
    await settle()
    expect(screen.getByTestId('codec-output').textContent).toBe('ZWxlY2RleA==')
    await fireEvent.click(screen.getByTestId('codec-copy'))
    await settle()
    expect(copy).toHaveBeenCalledWith({ kind: 'text', text: 'ZWxlY2RleA==' })
  })

  it('keeps the input of a pane that is mounted again, and says what is wrong', async () => {
    const first = await mount({ module: 'codec', codecOp: 'unb64' })
    await fireEvent.input(screen.getByTestId('codec-input'), { target: { value: '!!' } })
    await settle()
    expect(screen.getByTestId('codec-error').textContent).toBe('not Base64')
    first.unmount()
    await mount({ module: 'codec', codecOp: 'unb64' })
    expect((screen.getByTestId('codec-input') as HTMLTextAreaElement).value).toBe('!!')
  })
})
