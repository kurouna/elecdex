import { describe, expect, it } from 'vitest'
import { oneAtATime } from '../../src/renderer/lib/one-at-a-time.js'

describe('a press taken once until its work is done', () => {
  it('lets a second press go while the first is on its way, and takes the next after', async () => {
    // Found in the sweep: a double press made two alarms, two pickers, two EXPLAINs.
    let calls = 0
    let finish = (): void => {}
    const press = oneAtATime(async () => {
      calls += 1
      await new Promise<void>((resolve) => (finish = resolve))
    })
    const first = press()
    void press()
    expect(calls).toBe(1)
    finish()
    await first
    const third = press()
    expect(calls).toBe(2)
    finish()
    await third
  })

  it('takes the next press after one that failed', async () => {
    let calls = 0
    const press = oneAtATime(async () => {
      calls += 1
      throw new Error('no')
    })
    await expect(press()).rejects.toThrow('no')
    await expect(press()).rejects.toThrow('no')
    expect(calls).toBe(2)
  })
})
