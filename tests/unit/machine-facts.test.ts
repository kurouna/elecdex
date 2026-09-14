import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: {}, screen: {} }))

const { gpuDevices, switchNames, upInterfaces } = await import('../../src/main/machine-facts.js')

describe('machine facts', () => {
  it('keeps switch names and never their values, which may be paths', () => {
    expect(
      switchNames([
        'out/main/index.js',
        '--windowed',
        '--user-data-dir=/home/someone/x',
        '--windowed',
        '-x',
        '--no-intro',
      ]),
    ).toEqual(['--windowed', '--user-data-dir', '--no-intro'])
  })

  it('lists interfaces with an address beyond loopback, by name only', () => {
    expect(
      upInterfaces({
        'Wi-Fi': [{ internal: false }],
        'Loopback Pseudo-Interface 1': [{ internal: true }],
        vEthernet: [{ internal: true }, { internal: false }],
        down: [],
      }),
    ).toEqual(['Wi-Fi', 'vEthernet'])
  })

  it('reads the GPUs from Electron basic GPU info, dropping entries without ids', () => {
    expect(
      gpuDevices({
        gpuDevice: [
          {
            vendorId: 32902,
            deviceId: 42913,
            deviceString: 'Intel(R) Iris(R) Xe Graphics',
            driverVersion: '32.0',
          },
          { vendorId: 0, deviceId: 0 },
          { vendorId: 4318, deviceId: 10116 },
        ],
      }),
    ).toEqual([
      { vendorId: 32902, deviceId: 42913, name: 'Intel(R) Iris(R) Xe Graphics', driver: '32.0' },
      { vendorId: 4318, deviceId: 10116, name: '', driver: '' },
    ])
    expect(gpuDevices(null)).toEqual([])
    expect(gpuDevices({ gpuDevice: 'nope' })).toEqual([])
  })
})
