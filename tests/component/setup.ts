import '@testing-library/svelte/vitest'
import { afterEach } from 'vitest'
import { forgetGonePanes } from '../../src/renderer/lib/pane-memory.ts'

// What panes keep in memory past a remount (what was typed) would otherwise carry from one
// test into the next, a filter left typed hiding the next test's rows.
afterEach(() => forgetGonePanes(new Set()))
