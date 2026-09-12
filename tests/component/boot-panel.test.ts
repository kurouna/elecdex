import type { AppInfo } from '@shared/api'
import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import BootPanel from '../../src/renderer/boot/BootPanel.svelte'

const info: AppInfo = {
  name: 'elecdex',
  version: '0.0.1',
  platform: 'linux',
  arch: 'x64',
  isPackaged: false,
  versions: { electron: '44.3.0', chrome: '142.0.0.0', node: '24.0.0', v8: '14.2' },
}

describe('BootPanel', () => {
  it('shows a pending state until info arrives', () => {
    render(BootPanel, { props: { info: null, error: null } })
    expect(screen.queryByTestId('boot-info')).toBeNull()
    expect(screen.getByText(/querying main process/i)).toBeTruthy()
  })

  it('renders the build and runtime rows once info arrives', () => {
    render(BootPanel, { props: { info, error: null } })
    const list = screen.getByTestId('boot-info')
    expect(list.textContent).toContain('elecdex 0.0.1 (dev)')
    expect(list.textContent).toContain('linux x64')
    expect(list.textContent).toContain('44.3.0')
  })

  it('surfaces a bridge error instead of the rows', () => {
    render(BootPanel, { props: { info: null, error: 'no handler registered' } })
    expect(screen.getByTestId('boot-error').textContent).toContain('no handler registered')
    expect(screen.queryByTestId('boot-info')).toBeNull()
  })
})
