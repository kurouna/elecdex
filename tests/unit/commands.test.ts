import type { KeybindingAction } from '@shared/keybindings'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type CommandRunner, commands } from '../../src/renderer/lib/commands.js'

/**
 * The way the action palette reaches the workspace's shortcuts without importing it
 * (docs/palette.md section 4.1).
 */

const runner = (answer: boolean): CommandRunner & { calls: KeybindingAction[] } => {
  const calls: KeybindingAction[] = []
  return {
    calls,
    run: vi.fn((action: KeybindingAction) => {
      calls.push(action)
      return answer
    }),
    applies: vi.fn(() => answer),
  }
}

let release: (() => void) | null = null
afterEach(() => {
  release?.()
  release = null
})

describe('commands', () => {
  it('does nothing before the workspace hands over its runner', () => {
    expect(commands.run('pane.splitRight')).toBe(false)
    expect(commands.applies('pane.splitRight')).toBe(false)
  })

  it('passes each call to the runner handed over, with its answer', () => {
    const one = runner(true)
    release = commands.provide(one)
    expect(commands.run('pane.splitRight')).toBe(true)
    expect(commands.applies('tab.next')).toBe(true)
    expect(one.calls).toEqual(['pane.splitRight'])
    expect(one.applies).toHaveBeenCalledWith('tab.next')
  })

  it('takes a second runner in place of the first, and goes quiet once it is released', () => {
    const first = runner(true)
    const second = runner(false)
    const releaseFirst = commands.provide(first)
    release = commands.provide(second)
    expect(commands.run('pane.close')).toBe(false)
    expect(first.calls).toEqual([])
    expect(second.calls).toEqual(['pane.close'])
    // The first one going (a workspace unmounted late) does not take the second away.
    releaseFirst()
    expect(commands.applies('pane.close')).toBe(false)
    expect(second.applies).toHaveBeenCalled()
    release()
    release = null
    expect(commands.run('pane.close')).toBe(false)
    expect(second.calls).toEqual(['pane.close'])
  })
})
