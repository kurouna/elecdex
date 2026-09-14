import { render } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import BatteryGauge from '../../src/renderer/widgets/monitor/BatteryGauge.svelte'

/**
 * The bolt beside the battery. It used to be drawn over the charge only while
 * charging: lost in the fill at this size, and missing altogether on mains at
 * full charge, which Windows reports as plugged in but not charging.
 */
describe('BatteryGauge', () => {
  const gauge = (props: { charging: boolean; plugged: boolean }) =>
    render(BatteryGauge, { props: { percent: 99, low: false, ...props } })

  it('shows a bolt beside the battery while power is connected, charging or not', () => {
    for (const props of [
      { charging: true, plugged: true },
      { charging: false, plugged: true },
    ]) {
      const { getByTestId, queryByTestId, unmount } = gauge(props)
      expect(queryByTestId('battery-bolt')).not.toBeNull()
      expect(getByTestId('battery-gauge').classList.contains('plugged')).toBe(true)
      // Beside the battery, left of its outline, not over the charge.
      expect(getByTestId('battery-gauge').querySelector('svg')?.getAttribute('viewBox')).toBe(
        '-9 0 35 12',
      )
      unmount()
    }
  })

  it('has no bolt on battery power', () => {
    const { getByTestId, queryByTestId } = gauge({ charging: false, plugged: false })
    expect(queryByTestId('battery-bolt')).toBeNull()
    expect(getByTestId('battery-gauge').getAttribute('aria-label')).toBe('battery 99%')
  })

  it('says which in its label', () => {
    expect(
      gauge({ charging: true, plugged: true })
        .getByTestId('battery-gauge')
        .getAttribute('aria-label'),
    ).toBe('battery 99%, charging')
  })

  it('says plugged in when not charging', () => {
    expect(
      gauge({ charging: false, plugged: true })
        .getByTestId('battery-gauge')
        .getAttribute('aria-label'),
    ).toBe('battery 99%, plugged in')
  })
})
