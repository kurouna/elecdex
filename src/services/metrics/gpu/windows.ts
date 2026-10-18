import type { GpuAdapter, GpuInfo, GpuUsage } from '@shared/metrics'
import { NO_GPU, vendorName } from './common.js'

/**
 * GPU load and memory on Windows, read by the long-lived sampler
 * (windows-sampler.ts), never by a process per reading.
 *
 * WDDM keeps two performance counter sets every GPU driver feeds: "GPU Engine"
 * (a utilisation counter per process and engine) and "GPU Adapter Memory" (the
 * dedicated and shared memory in use per adapter). Task Manager reads the same.
 * The adapters' names and memory sizes come from DXGI once: WMI's AdapterRAM
 * stops at 4 GB, and DXGI's LUID is what names an adapter in the counters.
 *
 * The engine table is large - one row per process and engine, about 450 on a
 * machine with a browser open - so it is read and summed in C#, compiled once
 * the first time the GPU is wanted: walked in PowerShell, the same sum took
 * ~31 ms a second, in C# 2-4 ms (measured with AMD Radeon graphics,
 * docs/decisions.md). Opening the counter set takes 0.5-5 s, once, off the loop.
 */

/**
 * The C# the sampler compiles, the first time a GPU reading is wanted.
 * `Start()` opens the counters off the sampler's loop; `Read()` gives a row per
 * adapter, with the loads since the last call (none on the first). It reaches the
 * sampler in `GPU_SOURCE_ENV`, not in its script, which it would take past the
 * command line's limit.
 */
export const GPU_SOURCE_ENV = 'ELECDEX_GPU_SOURCE'

export const GPU_SOURCE = `
using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;

public static class ElecdexGpu {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  struct Desc1 {
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string Description;
    public uint VendorId, DeviceId, SubSysId, Revision;
    public UIntPtr DedicatedVideoMemory, DedicatedSystemMemory, SharedSystemMemory;
    public uint LuidLow;
    public int LuidHigh;
    public uint Flags;
  }

  // Only the methods called are declared with their shapes; the rest hold their vtable slots.
  [ComImport, Guid("29038f61-3839-4626-91fd-086879011a05"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IDXGIAdapter1 {
    void SetPrivateData(); void SetPrivateDataInterface(); void GetPrivateData(); void GetParent();
    void EnumOutputs(); void GetDesc(); void CheckInterfaceSupport();
    [PreserveSig] int GetDesc1(out Desc1 desc);
  }

  [ComImport, Guid("770aae78-f26f-4dba-a829-253c83d1b387"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IDXGIFactory1 {
    void SetPrivateData(); void SetPrivateDataInterface(); void GetPrivateData(); void GetParent();
    void EnumAdapters(); void MakeWindowAssociation(); void GetWindowAssociation(); void CreateSwapChain(); void CreateSoftwareAdapter();
    [PreserveSig] int EnumAdapters1(uint index, out IDXGIAdapter1 adapter);
  }

  [DllImport("dxgi.dll")]
  static extern int CreateDXGIFactory1(ref Guid riid, [MarshalAs(UnmanagedType.Interface)] out IDXGIFactory1 factory);

  public class Adapter {
    public string Luid;
    public string Name = "";
    public uint Vendor;
    public ulong Dedicated, Shared;
  }

  static List<Adapter> adapters = new List<Adapter>();
  // Whether DXGI answered: if it did, its list is the hardware, even when that is none.
  static bool listed = false;
  static PerformanceCounterCategory engines, memory;
  static Dictionary<string, CounterSample> before = new Dictionary<string, CounterSample>();

  static string LuidKey(uint high, uint low) {
    return string.Format("luid_0x{0:x8}_0x{1:x8}", high, low);
  }

  // The hardware adapters; Microsoft's software renderer (flag 2) is left out.
  static List<Adapter> Enumerate() {
    List<Adapter> list = new List<Adapter>();
    try {
      Guid iid = typeof(IDXGIFactory1).GUID;
      IDXGIFactory1 factory;
      if (CreateDXGIFactory1(ref iid, out factory) != 0) return list;
      listed = true;
      for (uint i = 0; i < 16; i++) {
        IDXGIAdapter1 a;
        if (factory.EnumAdapters1(i, out a) != 0) break;
        Desc1 d;
        if (a.GetDesc1(out d) == 0 && (d.Flags & 2) == 0) {
          Adapter row = new Adapter();
          row.Luid = LuidKey((uint)d.LuidHigh, d.LuidLow);
          row.Name = d.Description ?? "";
          row.Vendor = d.VendorId;
          row.Dedicated = d.DedicatedVideoMemory.ToUInt64();
          row.Shared = d.SharedSystemMemory.ToUInt64();
          list.Add(row);
        }
        Marshal.ReleaseComObject(a);
      }
      Marshal.ReleaseComObject(factory);
    } catch { }
    return list;
  }

  // "pid_12_luid_0x00000000_0x0000fb9f_phys_0_eng_3_engtype_3D": its adapter, its engine, the engine's kind.
  static bool Parse(string instance, out string luid, out string engine, out string kind) {
    luid = engine = kind = null;
    string lower = instance.ToLowerInvariant();
    int l = lower.IndexOf("luid_");
    int t = lower.IndexOf("_engtype_");
    if (l < 0 || t < l) return false;
    int p = lower.IndexOf("_phys_", l);
    if (p < 0 || p > t) return false;
    luid = lower.Substring(l, p - l);
    engine = lower.Substring(l, t - l);
    kind = lower.Substring(t + 9);
    return true;
  }

  static string KindOf(string kind) {
    if (kind.StartsWith("3d")) return "g";
    if (kind.Contains("compute")) return "c";
    if (kind.StartsWith("copy")) return "cp";
    if (kind.StartsWith("video")) return "v";
    return null;
  }

  static void Raise(Dictionary<string, double> into, string key, double value) {
    double was;
    into[key] = into.TryGetValue(key, out was) ? Math.Max(was, value) : value;
  }

  // Each engine's processes summed, as Task Manager does; then the busiest engine per adapter, and per kind.
  // Null the first time: a load is the difference between two readings.
  static Dictionary<string, Dictionary<string, double>> Loads() {
    InstanceDataCollection now = engines.ReadCategory()["Utilization Percentage"];
    Dictionary<string, CounterSample> next = new Dictionary<string, CounterSample>();
    Dictionary<string, double> perEngine = new Dictionary<string, double>();
    Dictionary<string, string> engineKind = new Dictionary<string, string>();
    Dictionary<string, string> engineLuid = new Dictionary<string, string>();
    bool primed = before.Count > 0;
    if (now != null) {
      foreach (InstanceData item in now.Values) {
        string luid, engine, kind;
        if (!Parse(item.InstanceName, out luid, out engine, out kind)) continue;
        next[item.InstanceName] = item.Sample;
        double sum;
        perEngine.TryGetValue(engine, out sum);
        CounterSample was;
        if (before.TryGetValue(item.InstanceName, out was)) sum += CounterSample.Calculate(was, item.Sample);
        perEngine[engine] = sum;
        engineKind[engine] = kind;
        engineLuid[engine] = luid;
      }
    }
    before = next;
    if (!primed) return null;
    Dictionary<string, Dictionary<string, double>> result = new Dictionary<string, Dictionary<string, double>>();
    foreach (KeyValuePair<string, double> e in perEngine) {
      string luid = engineLuid[e.Key];
      Dictionary<string, double> a;
      if (!result.TryGetValue(luid, out a)) { a = new Dictionary<string, double>(); result[luid] = a; }
      double load = Math.Min(100, Math.Max(0, e.Value));
      Raise(a, "load", load);
      string k = KindOf(engineKind[e.Key]);
      if (k != null) Raise(a, k, load);
    }
    return result;
  }

  static Dictionary<string, double[]> Memory() {
    Dictionary<string, double[]> result = new Dictionary<string, double[]>();
    InstanceDataCollectionCollection all = memory.ReadCategory();
    InstanceDataCollection dedicated = all["Dedicated Usage"];
    InstanceDataCollection shared = all["Shared Usage"];
    if (dedicated == null) return result;
    foreach (InstanceData item in dedicated.Values) {
      string name = item.InstanceName.ToLowerInvariant();
      int p = name.IndexOf("_phys_");
      string luid = p < 0 ? name : name.Substring(0, p);
      double[] m;
      if (!result.TryGetValue(luid, out m)) { m = new double[2]; result[luid] = m; }
      m[0] += item.RawValue;
      InstanceData s = shared == null ? null : shared[item.InstanceName];
      if (s != null) m[1] += s.RawValue;
    }
    return result;
  }

  // 0 opening, 1 open, 2 no GPU counters here.
  static volatile int state = 0;

  // Opened on a pool thread: the first read of the engine table took 0.5-5 s, which on the
  // sampler's own loop would hold up every other reading as long.
  public static void Start() {
    System.Threading.ThreadPool.QueueUserWorkItem(delegate {
      try {
        adapters = Enumerate();
        engines = new PerformanceCounterCategory("GPU Engine");
        memory = new PerformanceCounterCategory("GPU Adapter Memory");
        Loads();
        state = 1;
      } catch { state = 2; }
    });
  }

  // Forgets the last engine reading: wanted again after a gap, the first load would span the gap.
  public static void Reset() {
    if (state != 1) return;
    before = new Dictionary<string, CounterSample>();
    try { Loads(); } catch { }
  }

  // Null while still opening; no rows where the system has no GPU counters.
  public static object[] Read() {
    if (state == 0) return null;
    if (state == 2) return new object[0];
    Dictionary<string, Dictionary<string, double>> loads = null;
    Dictionary<string, double[]> mem = null;
    try { loads = Loads(); } catch { }
    try { mem = Memory(); } catch { }
    return Rows(adapters, listed, loads, mem);
  }

  // A row per adapter. Without DXGI the adapters are the counters' own, nameless and of unknown
  // size; with it, only its hardware ones (found in review: on a machine with none, the software
  // renderer's counters came back as a nameless GPU). An adapter no process uses has engines at
  // rest: load 0 once there are loads, not none (the card of a laptop running on its other GPU).
  public static object[] Rows(List<Adapter> list, bool dxgi, Dictionary<string, Dictionary<string, double>> loads, Dictionary<string, double[]> mem) {
    if (!dxgi && list.Count == 0 && mem != null) {
      list = new List<Adapter>();
      foreach (string luid in mem.Keys) { Adapter a = new Adapter(); a.Luid = luid; list.Add(a); }
    }
    List<object> rows = new List<object>();
    foreach (Adapter a in list) {
      Hashtable row = new Hashtable();
      row["luid"] = a.Luid;
      row["n"] = a.Name;
      row["ven"] = a.Vendor;
      row["ded"] = (double)a.Dedicated;
      row["shr"] = (double)a.Shared;
      Dictionary<string, double> l;
      if (loads != null) row["load"] = 0.0;
      if (loads != null && loads.TryGetValue(a.Luid, out l)) foreach (KeyValuePair<string, double> kv in l) row[kv.Key] = kv.Value;
      double[] m;
      if (mem != null && mem.TryGetValue(a.Luid, out m)) { row["du"] = m[0]; row["su"] = m[1]; }
      rows.Add(row);
    }
    return rows.ToArray();
  }
}
`

/**
 * The sampler's GPU step, every tick while wanted. Compiled the first time (~0.3 s,
 * once) and opened in the background; readings start once it is open. A machine
 * without GPU counters says so with an empty reading each tick.
 */
export const GPU_STEP = `
  if ($want.ContainsKey('gpu')) {
    if ($gpuMode -eq 'unset') {
      try {
        Add-Type -TypeDefinition $gpuSource
        [ElecdexGpu]::Start()
        $gpuMode = 'on'
      } catch { $gpuMode = 'none' }
    } elseif ($gpuMode -eq 'none') {
      Emit 'gpu' @()
    } elseif ($fresh.ContainsKey('gpu')) {
      [ElecdexGpu]::Reset()
    } else {
      $gpuRows = [ElecdexGpu]::Read()
      if ($null -ne $gpuRows) { Emit 'gpu' @($gpuRows) }
    }
  }
`

/** One adapter as the sampler writes it: loads 0-100, memory in bytes. */
export interface RawGpu {
  luid: string
  n: string
  ven: number
  ded: number
  shr: number
  /** The busiest engine; absent on the first reading after the counters were opened. */
  load: number | null
  g: number | null
  c: number | null
  cp: number | null
  v: number | null
  du: number | null
  su: number | null
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const finite = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const orNull = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null
const percent = (v: unknown): number | null => {
  const n = orNull(v)
  return n === null ? null : Math.min(100, Math.max(0, n))
}

/** The sampler's `gpu` rows, checked: anything else in them is dropped. */
export function parseGpuRows(data: unknown): RawGpu[] {
  const rows = Array.isArray(data) ? data : data == null ? [] : [data]
  return rows.filter(isRecord).map((r) => ({
    luid: typeof r.luid === 'string' ? r.luid : '',
    n: typeof r.n === 'string' ? r.n.trim().slice(0, 128) : '',
    ven: finite(r.ven),
    ded: Math.max(0, finite(r.ded)),
    shr: Math.max(0, finite(r.shr)),
    load: percent(r.load),
    g: percent(r.g),
    c: percent(r.c),
    cp: percent(r.cp),
    v: percent(r.v),
    du: orNull(r.du),
    su: orNull(r.su),
  }))
}

const adapterOf = (row: RawGpu): GpuAdapter => ({
  name: row.n || 'GPU',
  vendor: vendorName(row.ven),
  dedicated: row.ded,
  shared: row.shr,
})

export const windowsGpuInfo = (rows: readonly RawGpu[]): GpuInfo => ({
  adapters: rows.map(adapterOf),
})

/**
 * The adapter shown: the one with the most memory of its own - the card, on a
 * machine that has one beside the processor's graphics - the first of equals.
 */
export function primaryGpu<T extends { ded: number }>(rows: readonly T[]): T | null {
  let best: T | null = null
  for (const row of rows) if (best === null || row.ded > best.ded) best = row
  return best
}

export function windowsGpuUsage(rows: readonly RawGpu[]): GpuUsage {
  const row = primaryGpu(rows)
  if (row === null) return NO_GPU
  const known = (total: number): number | null => (total > 0 ? total : null)
  return {
    name: adapterOf(row).name,
    load: row.load,
    // An engine kind the adapter has none of is reported as nothing, not as idle.
    engines: { graphics: row.g, compute: row.c, copy: row.cp, video: row.v },
    vramUsed: row.du,
    vramTotal: known(row.ded),
    sharedUsed: row.su,
    sharedTotal: known(row.shr),
  }
}
