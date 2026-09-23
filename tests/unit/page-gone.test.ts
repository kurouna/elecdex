import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import { type PageEvents, whenPageGoes } from '../../src/main/ipc/page-gone.js'

/**
 * What every subscribing IPC module needs from a page: to hear when it goes -
 * destroyed, or navigated to a new document (a reload) - and drop what it
 * subscribed. One pair of listeners per page, however many modules follow it:
 * a dozen modules each adding their own passed Node's limit of ten.
 */

const page = (): EventEmitter & PageEvents => new EventEmitter() as EventEmitter & PageEvents

describe('when a page goes', () => {
  it('adds one pair of listeners, however many modules follow the page', () => {
    const sender = page()
    for (let i = 0; i < 15; i += 1) whenPageGoes(sender, {}, () => {})
    expect(sender.listenerCount('destroyed')).toBe(1)
    expect(sender.listenerCount('did-start-navigation')).toBe(1)
  })

  it('tells every module on a reload, but not on an in-page navigation or a frame', () => {
    const sender = page()
    const heard: string[] = []
    const git = {}
    const weather = {}
    whenPageGoes(sender, git, () => heard.push('git'))
    whenPageGoes(sender, weather, () => heard.push('weather'))
    // A module asks again with every subscription: it is told once all the same.
    whenPageGoes(sender, git, () => heard.push('git again'))
    sender.emit('did-start-navigation', { isMainFrame: true, isSameDocument: true })
    sender.emit('did-start-navigation', { isMainFrame: false, isSameDocument: false })
    expect(heard).toEqual([])
    sender.emit('did-start-navigation', { isMainFrame: true, isSameDocument: false })
    expect(heard).toEqual(['git', 'weather'])
    // Still followed after a reload: the new page subscribes on the same WebContents.
    sender.emit('did-start-navigation', { isMainFrame: true, isSameDocument: false })
    expect(heard).toEqual(['git', 'weather', 'git', 'weather'])
  })

  it('tells every module when the page is destroyed', () => {
    const sender = page()
    const heard: string[] = []
    whenPageGoes(sender, {}, () => heard.push('fs'))
    sender.emit('destroyed')
    expect(heard).toEqual(['fs'])
  })
})

describe('the modules that subscribe pages', () => {
  it('all follow a page through whenPageGoes, not listeners of their own', async () => {
    const { readdirSync, readFileSync } = await import('node:fs')
    const path = await import('node:path')
    const root = path.resolve(__dirname, '..', '..', 'src', 'main')
    const own = [
      ...readdirSync(path.join(root, 'ipc')).map((f) => path.join('ipc', f)),
      path.join('metrics', 'broker.ts'),
    ].filter(
      (file) =>
        file !== path.join('ipc', 'page-gone.ts') &&
        readFileSync(path.join(root, file), 'utf8').includes("'did-start-navigation'"),
    )
    expect(own).toEqual([])
  })
})
