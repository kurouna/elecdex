import { type LaunchItem, LOGIN_ITEM_NAME } from '@shared/background'
import type { RunKey } from './windows.js'

/**
 * An in-memory Run key for the end-to-end tests, which must never write the
 * real one. It stands in for the platform's store whichever platform the tests
 * run on: what is under test is the behaviour around the entry, not the
 * registry.
 */
export class StubRunKey implements RunKey {
  available = true
  entry: LaunchItem | null = null
  /** How often it was written: a write on every start or setting would show here. */
  writes = 0

  items(): LaunchItem[] {
    return this.entry ? [this.entry] : []
  }

  write({ on, args, enabled }: { on: boolean; args: string[]; enabled: boolean }): void {
    this.writes += 1
    this.entry = on
      ? { name: LOGIN_ITEM_NAME, path: process.execPath, args, scope: 'user', enabled }
      : null
  }

  /** What Task Manager's switch does. */
  setEnabled(enabled: boolean): void {
    if (this.entry) this.entry = { ...this.entry, enabled }
  }
}
