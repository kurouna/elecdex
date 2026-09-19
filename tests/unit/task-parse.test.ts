import { ALL_DAY_HOUR, parseTask } from '@shared/task-parse'
import { describe, expect, it } from 'vitest'

/**
 * Reading a deadline out of what was typed.
 *
 * The cases that matter here are the ones where the parser must *not* act: a
 * number that is part of the task, a word that only looks like a weekday, a
 * phrase in the middle of a sentence. A quick-add that quietly eats part of a
 * task is worse than one that understands nothing, because nobody finds out
 * until the task is needed.
 */

/** Wednesday, 16 September 2026, 10:00 local. */
const NOW = new Date(2026, 8, 16, 10, 0, 0, 0).getTime()

const at = (result: { due?: number }): Date | null =>
  result.due === undefined ? null : new Date(result.due)

describe('parseTask', () => {
  it('leaves a line with no date alone', () => {
    const parsed = parseTask('write the release notes', NOW)
    expect(parsed).toMatchObject({ title: 'write the release notes', repeat: 'none' })
    expect(parsed.due).toBeUndefined()
    expect(parsed.matched).toEqual([])
  })

  it('reads 明日 with a time', () => {
    const parsed = parseTask('歯医者 明日 9:00', NOW)
    expect(parsed.title).toBe('歯医者')
    expect(at(parsed)?.getDate()).toBe(17)
    expect(at(parsed)?.getHours()).toBe(9)
    expect(parsed.allDay).toBe(false)
  })

  it('reads 明後日 rather than seeing 明日 inside it', () => {
    expect(at(parseTask('掃除 明後日', NOW))?.getDate()).toBe(18)
  })

  it('reads an English day and time', () => {
    const parsed = parseTask('review fri 18:30', NOW)
    expect(parsed.title).toBe('review')
    // Friday is the 18th, two days after Wednesday the 16th.
    expect(at(parsed)?.getDate()).toBe(18)
    expect(at(parsed)?.getHours()).toBe(18)
    expect(at(parsed)?.getMinutes()).toBe(30)
  })

  it('reads am and pm', () => {
    expect(at(parseTask('standup 9am', NOW))?.getHours()).toBe(9)
    expect(at(parseTask('call 9pm', NOW))?.getHours()).toBe(21)
    expect(at(parseTask('midnight 12am', NOW))?.getHours()).toBe(0)
  })

  it('takes a bare time that has gone by as tomorrow', () => {
    // 09:00 is behind 10:00, so it means the next one.
    expect(at(parseTask('coffee 9:00', NOW))?.getDate()).toBe(17)
    expect(at(parseTask('coffee 11:00', NOW))?.getDate()).toBe(16)
  })

  it('reads an offset', () => {
    expect(at(parseTask('tea 30分後', NOW))?.getHours()).toBe(10)
    expect(at(parseTask('tea 30分後', NOW))?.getMinutes()).toBe(30)
    expect(at(parseTask('ping in 2 h', NOW))?.getHours()).toBe(12)
  })

  it('gives a date with no time the all-day hour', () => {
    const parsed = parseTask('recycling 明日', NOW)
    expect(parsed.allDay).toBe(true)
    expect(at(parsed)?.getHours()).toBe(ALL_DAY_HOUR)
  })

  it('reads a repeat, and starts it at the next all-day hour', () => {
    const parsed = parseTask('毎週 掃除', NOW)
    expect(parsed).toMatchObject({ title: '掃除', repeat: 'weekly', allDay: true })
    expect(at(parsed)?.getDate()).toBe(17)
  })

  it('reads a calendar date, and rolls one already past into next year', () => {
    expect(at(parseTask('支払い 12月25日', NOW))?.getMonth()).toBe(11)
    const past = parseTask('支払い 1/5', NOW)
    expect(at(past)?.getFullYear()).toBe(2027)
  })

  it('does not read a phrase out of the middle of a sentence', () => {
    const parsed = parseTask('ask mon about the invoice', NOW)
    expect(parsed.title).toBe('ask mon about the invoice')
    expect(parsed.due).toBeUndefined()
  })

  it('does not take a weekday out of a longer word', () => {
    const parsed = parseTask('check the monitor', NOW)
    expect(parsed.title).toBe('check the monitor')
    expect(parsed.due).toBeUndefined()
  })

  it('gives the line back when the date was the whole of it', () => {
    // Otherwise a task called "tomorrow" would be added with no title at all.
    const parsed = parseTask('明日', NOW)
    expect(parsed.title).toBe('明日')
    expect(parsed.due).toBeUndefined()
  })

  it('reports what it understood, so the pane can show it back', () => {
    const parsed = parseTask('review fri 18:30', NOW)
    expect(parsed.matched).toContain('fri')
    expect(parsed.matched).toContain('18:30')
  })

  it('refuses an impossible clock time rather than inventing one', () => {
    const parsed = parseTask('order 99:99', NOW)
    expect(parsed.due).toBeUndefined()
    expect(parsed.title).toContain('99:99')
  })
})
