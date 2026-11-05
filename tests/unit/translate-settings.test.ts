import { describe, expect, it } from 'vitest'
import { applySettingsPatch, SettingsSchema } from '../../src/shared/settings'

const base = () => SettingsSchema.parse({})

describe('translate settings', () => {
  it('has the defaults of docs/translate.md §8.2', () => {
    expect(base().translate).toEqual({
      modelId: 'plamo3-2b-q4km',
      ctx: 16384,
      device: 'auto',
      idleMinutes: 10,
      live: true,
      saveHistory: true,
    })
  })

  it('takes a patch of its own keys', () => {
    const next = applySettingsPatch(base(), {
      translate: { ctx: 8192, device: 'cpu', live: false },
    })
    expect(next?.translate).toMatchObject({
      ctx: 8192,
      device: 'cpu',
      live: false,
      idleMinutes: 10,
    })
  })

  it('never lets a patch carry where the engine comes from', () => {
    // These live in main's translate/engine.json, set only through main's picker and TEST.
    const next = applySettingsPatch(base(), {
      translate: {
        source: 'own',
        own: { path: 'C:/evil.exe', build: 99999 },
        external: { origin: 'http://attacker.example' },
        consents: { 'plamo3-2b-q4km': { at: 'x' } },
      },
    })
    expect(next?.translate).toEqual(base().translate)
    expect(JSON.stringify(next)).not.toMatch(/evil|attacker/)
  })

  it('falls back from values it does not know', () => {
    const next = applySettingsPatch(base(), {
      translate: { modelId: 'plamo3-99b-q9', ctx: 12345, idleMinutes: 7, device: 'tpu' },
    })
    expect(next?.translate).toEqual(base().translate)
  })
})
