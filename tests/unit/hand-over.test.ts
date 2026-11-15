import { afterEach, describe, expect, it, vi } from 'vitest'
import { handOver, provideSummoner, takeHandOver } from '../../src/renderer/lib/hand-over.svelte.js'

describe('handing text to another pane', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does nothing without a workspace to call the pane up', () => {
    expect(handOver('translate', 'text')).toBe(false)
    expect(takeHandOver('translate')).toBeNull()
  })

  it('calls the widget up and gives it the text once, to it alone', () => {
    const called: string[] = []
    const off = provideSummoner((widget) => called.push(widget))
    expect(handOver('translate', 'Headline\n\nSummary')).toBe(true)
    expect(called).toEqual(['translate'])
    expect(takeHandOver('aichat')).toBeNull()
    expect(takeHandOver('translate')).toBe('Headline\n\nSummary')
    expect(takeHandOver('translate')).toBeNull()
    off()
    expect(handOver('translate', 'again')).toBe(false)
  })

  it('lets a stale hand-over go: a pane mounting later is not given it', () => {
    vi.useFakeTimers()
    const off = provideSummoner(() => {})
    handOver('aichat', 'old')
    vi.advanceTimersByTime(2001)
    expect(takeHandOver('aichat')).toBeNull()
    off()
  })

  it('keeps the newest summoner when an older one lets go late', () => {
    const first: string[] = []
    const second: string[] = []
    const offFirst = provideSummoner((w) => first.push(w))
    const offSecond = provideSummoner((w) => second.push(w))
    offFirst()
    handOver('translate', 'x')
    expect(first).toEqual([])
    expect(second).toEqual(['translate'])
    offSecond()
    takeHandOver('translate')
  })
})
