import { describe, expect, it } from 'vitest'
import { refCounted } from '../../src/renderer/lib/ref-counted.js'

/**
 * What the stores and shared clocks start for their first user and stop after
 * their last. A release called twice - a component torn down and its effect
 * cleaned up again - must count once, or it stops what another user still needs.
 */

describe('something shared by its users', () => {
  it('starts for the first user and stops after the last', () => {
    const events: string[] = []
    const use = refCounted(() => {
      events.push('start')
      return () => events.push('stop')
    })
    const a = use()
    const b = use()
    expect(events).toEqual(['start'])
    a()
    expect(events).toEqual(['start'])
    b()
    expect(events).toEqual(['start', 'stop'])
    use()()
    expect(events).toEqual(['start', 'stop', 'start', 'stop'])
  })

  it('counts a release once, however often it is called', () => {
    const events: string[] = []
    const use = refCounted(() => {
      events.push('start')
      return () => events.push('stop')
    })
    const a = use()
    const b = use()
    a()
    a()
    // b still uses it: a second release of a must not have stopped it.
    expect(events).toEqual(['start'])
    b()
    expect(events).toEqual(['start', 'stop'])
  })
})
