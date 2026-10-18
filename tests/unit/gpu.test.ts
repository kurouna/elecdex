import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { engineFigures, memoryFraction } from '@shared/gpu'
import { afterEach, describe, expect, it } from 'vitest'
import { chartPoints, memoryText } from '../../src/renderer/widgets/monitor/gpu-view.js'
import { NO_GPU, vendorName } from '../../src/services/metrics/gpu/common.js'
import { linuxGpuInfo, linuxGpuUsage, readSysfsGpus } from '../../src/services/metrics/gpu/linux.js'
import { gpuStubFrom, stubGpuInfo, stubGpuUsage } from '../../src/services/metrics/gpu/stub.js'
import {
  GPU_SOURCE,
  GPU_SOURCE_ENV,
  GPU_STEP,
  parseGpuRows,
  primaryGpu,
  windowsGpuInfo,
  windowsGpuUsage,
} from '../../src/services/metrics/gpu/windows.js'
import { parseSamplerLine } from '../../src/services/metrics/windows-sampler.js'

const GIB = 1024 ** 3

/** Two adapters as the sampler writes them: the processor's graphics, and a card. */
const ROWS = [
  {
    luid: 'luid_0x00000000_0x0000fb9f',
    n: 'AMD Radeon(TM) Graphics',
    ven: 0x1002,
    ded: 0.5 * GIB,
    shr: 8 * GIB,
    load: 12,
    g: 12,
    cp: 1,
    du: 0.4 * GIB,
    su: 0.5 * GIB,
  },
  {
    luid: 'luid_0x00000000_0x00011111',
    n: 'NVIDIA GeForce RTX 4070',
    ven: 0x10de,
    ded: 12 * GIB,
    shr: 16 * GIB,
    load: 87.5,
    g: 40,
    c: 87.5,
    cp: 3,
    v: 0,
    du: 10 * GIB,
    su: 1 * GIB,
  },
]

describe('the Windows GPU reading', () => {
  it('is parsed from the sampler line, one bare object or many', () => {
    const many = parseSamplerLine(JSON.stringify({ t: 'gpu', data: ROWS }))
    expect(many?.kind).toBe('gpu')
    const one = parseSamplerLine(JSON.stringify({ t: 'gpu', data: ROWS[0] }))
    expect(one?.kind === 'gpu' && one.data).toHaveLength(1)
    // A machine without counters: an empty reading, which is still a reading.
    const none = parseSamplerLine(JSON.stringify({ t: 'gpu', data: [] }))
    expect(none).toEqual({ kind: 'gpu', data: [] })
  })

  it('keeps loads in 0-100, and what was not said as null', () => {
    const [row] = parseGpuRows([{ luid: 'x', n: '  Card  ', load: 140, g: -3, du: 'a lot' }])
    expect(row).toMatchObject({ n: 'Card', load: 100, g: 0, c: null, du: null, ded: 0 })
  })

  it('shows the adapter with the most memory of its own: the card, not the processor’s graphics', () => {
    const rows = parseGpuRows(ROWS)
    expect(primaryGpu(rows)?.n).toBe('NVIDIA GeForce RTX 4070')
    expect(primaryGpu([])).toBeNull()
    expect(windowsGpuUsage(rows)).toEqual({
      name: 'NVIDIA GeForce RTX 4070',
      load: 87.5,
      engines: { graphics: 40, compute: 87.5, copy: 3, video: 0 },
      vramUsed: 10 * GIB,
      vramTotal: 12 * GIB,
      sharedUsed: 1 * GIB,
      sharedTotal: 16 * GIB,
    })
  })

  it('lists every adapter by name and maker, and says none on a machine without them', () => {
    expect(windowsGpuInfo(parseGpuRows(ROWS)).adapters.map((a) => [a.name, a.vendor])).toEqual([
      ['AMD Radeon(TM) Graphics', 'AMD'],
      ['NVIDIA GeForce RTX 4070', 'NVIDIA'],
    ])
    expect(windowsGpuUsage([])).toEqual(NO_GPU)
    // Without DXGI the counters' adapters are nameless, of unknown size.
    const nameless = windowsGpuUsage(parseGpuRows([{ luid: 'x', du: 1e9 }]))
    expect(nameless).toMatchObject({ name: 'GPU', vramUsed: 1e9, vramTotal: null })
  })

  it('names the makers by PCI vendor id', () => {
    expect(vendorName(0x8086)).toBe('Intel')
    expect(vendorName(0x1234)).toBe('')
  })

  it('keeps the C# out of the script, and the step reading only while wanted', () => {
    // The C# is handed over in the environment: in the script it took the command line past
    // Windows' 32,767 characters.
    expect(GPU_SOURCE).toContain('class ElecdexGpu')
    expect(GPU_STEP).not.toContain('using System')
    expect(GPU_STEP).toMatch(/^\s*if \(\$want\.ContainsKey\('gpu'\)\)/)
    // Opened on a pool thread: never on the sampler's own loop.
    expect(GPU_SOURCE).toContain('ThreadPool.QueueUserWorkItem')
  })
})

describe.runIf(process.platform === 'win32')('the Windows GPU rows, compiled', () => {
  // The C#'s rows from made-up adapters, counters and loads: compiled as the sampler does.
  const SCRIPT = `
    Add-Type -TypeDefinition $env:${GPU_SOURCE_ENV}
    function Card($luid, $ded) {
      $a = New-Object 'ElecdexGpu+Adapter'; $a.Luid = $luid; $a.Name = 'Card'; $a.Dedicated = $ded; $a
    }
    $none = New-Object 'System.Collections.Generic.List[ElecdexGpu+Adapter]'
    $two = New-Object 'System.Collections.Generic.List[ElecdexGpu+Adapter]'
    $two.Add((Card 'luid_igpu' 1)); $two.Add((Card 'luid_dgpu' 8))
    # The software renderer's memory counters, which DXGI's list leaves out.
    $mem = New-Object 'System.Collections.Generic.Dictionary[string,double[]]'
    $mem['luid_sw'] = [double[]](1, 2)
    $loads = New-Object 'System.Collections.Generic.Dictionary[string,System.Collections.Generic.Dictionary[string,double]]'
    $igpu = New-Object 'System.Collections.Generic.Dictionary[string,double]'
    $igpu['load'] = 12; $loads['luid_igpu'] = $igpu
    @{
      listedNone = @([ElecdexGpu]::Rows($none, $true, $null, $mem))
      unlisted = @([ElecdexGpu]::Rows($none, $false, $null, $mem))
      idle = @([ElecdexGpu]::Rows($two, $true, $loads, $mem))
      first = @([ElecdexGpu]::Rows($two, $true, $null, $mem))
    } | ConvertTo-Json -Depth 4 -Compress
  `
  const rows = (): Record<string, unknown[]> =>
    JSON.parse(
      execFileSync(
        'powershell.exe',
        ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', SCRIPT],
        {
          env: { ...process.env, [GPU_SOURCE_ENV]: GPU_SOURCE },
          encoding: 'utf8',
        },
      ),
    )

  it('reads no GPU from the software renderer, and an idle card as 0, not unknown', () => {
    const out = rows()
    // Found in review: with DXGI's list empty (a VM), the software renderer's counters came back
    // as a nameless "GPU". Only without DXGI are the counters' own adapters used.
    expect(windowsGpuUsage(parseGpuRows(out.listedNone))).toEqual(NO_GPU)
    expect(parseGpuRows(out.unlisted).map((r) => r.luid)).toEqual(['luid_sw'])
    // Found in review: a laptop's card that no process used had no load at all, drawn as --.
    const idle = parseGpuRows(out.idle)
    expect(idle.map((r) => [r.luid, r.load])).toEqual([
      ['luid_igpu', 12],
      ['luid_dgpu', 0],
    ])
    expect(windowsGpuUsage(idle).load).toBe(0)
    // The first reading after opening still has no load: there is nothing to difference yet.
    expect(parseGpuRows(out.first).map((r) => r.load)).toEqual([null, null])
  }, 60_000)
})

describe('the Linux GPU reading', () => {
  let root = ''
  afterEach(() => {
    if (root !== '') rmSync(root, { recursive: true, force: true })
  })

  function card(name: string, files: Record<string, string>): void {
    const dir = join(root, name, 'device')
    mkdirSync(dir, { recursive: true })
    for (const [file, text] of Object.entries(files)) writeFileSync(join(dir, file), text)
  }

  it('reads amdgpu’s files, and leaves out a card that says nothing and the connectors', async () => {
    root = mkdtempSync(join(tmpdir(), 'elecdex-drm-'))
    card('card0', { vendor: '0x8086\n' })
    card('card1', {
      vendor: '0x1002\n',
      gpu_busy_percent: '37\n',
      mem_info_vram_used: String(3 * GIB),
      mem_info_vram_total: String(8 * GIB),
      mem_info_gtt_used: String(GIB),
      mem_info_gtt_total: String(16 * GIB),
    })
    mkdirSync(join(root, 'card1-DP-1'))
    const gpus = await readSysfsGpus(root)
    expect(gpus.map((gpu) => gpu.card)).toEqual(['card1'])
    expect(linuxGpuUsage(gpus)).toEqual({
      name: 'AMD card1',
      load: 37,
      engines: { graphics: null, compute: null, copy: null, video: null },
      vramUsed: 3 * GIB,
      vramTotal: 8 * GIB,
      sharedUsed: GIB,
      sharedTotal: 16 * GIB,
    })
    expect(linuxGpuInfo(gpus).adapters).toEqual([
      { name: 'AMD card1', vendor: 'AMD', dedicated: 8 * GIB, shared: 16 * GIB },
    ])
  })

  it('takes an empty or blank file for no reading, not for 0', async () => {
    root = mkdtempSync(join(tmpdir(), 'elecdex-drm-'))
    // Found in review: Number('') is 0, so an empty file read as idle and empty memory.
    card('card0', { gpu_busy_percent: '\n' })
    card('card1', { gpu_busy_percent: '5\n', mem_info_vram_used: '', mem_info_vram_total: ' \n' })
    const gpus = await readSysfsGpus(root)
    expect(gpus.map((gpu) => gpu.card)).toEqual(['card1'])
    expect(gpus[0]).toMatchObject({ busy: 5, vramUsed: null, vramTotal: null })
  })

  it('says none where there is no DRM folder at all', async () => {
    const gpus = await readSysfsGpus(join(tmpdir(), 'elecdex-no-such-drm'))
    expect(gpus).toEqual([])
    expect(linuxGpuUsage(gpus)).toEqual(NO_GPU)
  })
})

describe('the made-up GPU', () => {
  it('is chosen only by its known names', () => {
    expect(gpuStubFrom('1')).toBe('1')
    expect(gpuStubFrom('demo')).toBe('demo')
    expect(gpuStubFrom('none')).toBe('none')
    expect(gpuStubFrom(undefined)).toBeNull()
    expect(gpuStubFrom('yes')).toBeNull()
  })

  it('stays in a known range, and says none for a machine without', () => {
    for (let at = 0; at < 60_000; at += 5000) {
      const usage = stubGpuUsage('1', at)
      expect(usage.load).toBeGreaterThanOrEqual(20)
      expect(usage.load).toBeLessThanOrEqual(40)
    }
    expect(stubGpuUsage('none', 0)).toEqual(NO_GPU)
    expect(stubGpuInfo('none').adapters).toEqual([])
    expect(stubGpuInfo('demo').adapters[0]?.name).toBe(stubGpuUsage('demo', 0).name)
  })
})

describe('the GPU pane’s words', () => {
  it('writes memory as a share and amounts, and dashes for what is not known', () => {
    expect(memoryFraction(3, 12)).toBe(0.25)
    expect(memoryFraction(13, 12)).toBe(1)
    expect(memoryFraction(null, 12)).toBeNull()
    expect(memoryFraction(3, 0)).toBeNull()
    expect(memoryText(null, 12)).toBe('--')
    expect(memoryText(1024 ** 3, null)).toMatch(/^1\.0 GiB$/i)
  })

  it('charts memory from a sample that has no load yet', () => {
    const first = { ...stubGpuUsage('1', 0), load: null, vramUsed: 2 * GIB, vramTotal: 8 * GIB }
    expect(chartPoints(first)).toEqual({ load: null, vram: 25 })
    expect(chartPoints({ ...first, load: 40, vramTotal: null })).toEqual({ load: 40, vram: null })
  })

  it('lists the engine kinds reported, in a fixed order, none on Linux', () => {
    const usage = windowsGpuUsage(parseGpuRows(ROWS))
    expect(engineFigures(usage).map((e) => `${e.label} ${e.value}`)).toEqual([
      '3D 40',
      'COMPUTE 87.5',
      'COPY 3',
      'VIDEO 0',
    ])
    expect(engineFigures(NO_GPU)).toEqual([])
    expect(engineFigures(null)).toEqual([])
  })
})
