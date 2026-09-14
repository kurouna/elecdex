import { spawn } from 'node:child_process'
import type { MixerCommand } from '@shared/audio'
import { parseWindowsLine } from './mixer-parse.js'
import type { MixerBackend } from './mixer-service.js'

/**
 * The Windows mixer: Core Audio through one long-lived PowerShell, as the metrics
 * sampler does - never a process per reading.
 *
 * The loop (C#, compiled once at start) reads the default output device's volume
 * and mute and its audio sessions every second, grouped by app as Windows' own
 * volume mixer groups them, and the peak meters ten times a second. It writes one
 * JSON line per reading and takes commands on stdin, one per line
 * ("volume<TAB>id<TAB>0.54", "mute<TAB>id<TAB>1"), which it applies to every
 * session of that app. It ends when stdin closes, so it cannot outlive elecdex.
 */

const SOURCE = String.raw`
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
  int EnumAudioEndpoints(int flow, int mask, out IntPtr devices);
  int GetDefaultAudioEndpoint(int flow, int role, out IMMDevice device);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
  int Activate(ref Guid iid, int context, IntPtr parameters, [MarshalAs(UnmanagedType.IUnknown)] out object activated);
  int OpenPropertyStore(int access, out IPropertyStore store);
}
[StructLayout(LayoutKind.Sequential)] struct PropertyKey { public Guid FormatId; public int PropertyId; }
[StructLayout(LayoutKind.Explicit)] struct PropVariant { [FieldOffset(0)] public short Type; [FieldOffset(8)] public IntPtr Pointer; }
[Guid("886d8eeb-8cf2-4446-8d02-cdba1dbdcf99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IPropertyStore {
  int GetCount(out int count);
  int GetAt(int index, out PropertyKey key);
  int GetValue(ref PropertyKey key, out PropVariant value);
}
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumerator {}
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
  int RegisterControlChangeNotify(IntPtr n); int UnregisterControlChangeNotify(IntPtr n);
  int GetChannelCount(out int count);
  int SetMasterVolumeLevel(float db, ref Guid context);
  int SetMasterVolumeLevelScalar(float level, ref Guid context);
  int GetMasterVolumeLevel(out float db);
  int GetMasterVolumeLevelScalar(out float level);
  int SetChannelVolumeLevel(int c, float db, ref Guid context);
  int SetChannelVolumeLevelScalar(int c, float level, ref Guid context);
  int GetChannelVolumeLevel(int c, out float db);
  int GetChannelVolumeLevelScalar(int c, out float level);
  int SetMute([MarshalAs(UnmanagedType.Bool)] bool mute, ref Guid context);
  int GetMute([MarshalAs(UnmanagedType.Bool)] out bool mute);
}
[Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioMeterInformation { int GetPeakValue(out float peak); }
[Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionManager2 {
  int GetAudioSessionControl(IntPtr a, int b, out IntPtr c);
  int GetSimpleAudioVolume(IntPtr a, int b, out IntPtr c);
  int GetSessionEnumerator(out IAudioSessionEnumerator sessions);
}
[Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionEnumerator {
  int GetCount(out int count);
  int GetSession(int index, out IAudioSessionControl2 session);
}
[Guid("bfb7ff88-7239-4fc9-8fa2-07c950be9c6d"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionControl2 {
  int GetState(out int state);
  int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string name);
  int SetDisplayName(IntPtr a, IntPtr b); int GetIconPath(out IntPtr a); int SetIconPath(IntPtr a, IntPtr b);
  int GetGroupingParam(out Guid g); int SetGroupingParam(ref Guid g, IntPtr c);
  int RegisterAudioSessionNotification(IntPtr n); int UnregisterAudioSessionNotification(IntPtr n);
  int GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string id);
  int GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string id);
  int GetProcessId(out uint pid);
  [PreserveSig] int IsSystemSoundsSession();
}
[Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface ISimpleAudioVolume {
  int SetMasterVolume(float level, ref Guid context);
  int GetMasterVolume(out float level);
  int SetMute([MarshalAs(UnmanagedType.Bool)] bool mute, ref Guid context);
  int GetMute([MarshalAs(UnmanagedType.Bool)] out bool mute);
}

public static class ElecdexMixer {
  class App { public string Id; public string Name; public List<IAudioSessionControl2> Sessions = new List<IAudioSessionControl2>(); }

  static readonly ConcurrentQueue<string> commands = new ConcurrentQueue<string>();
  static volatile bool inputClosed;
  static StreamWriter output;
  static Guid context = Guid.Empty;
  static IAudioEndpointVolume endpoint;
  static IAudioMeterInformation endpointMeter;
  static string device;
  static List<App> apps = new List<App>();

  public static void Run() {
    output = new StreamWriter(Console.OpenStandardOutput(), new UTF8Encoding(false));
    output.AutoFlush = true;
    var reader = new Thread(() => {
      try {
        var input = new StreamReader(Console.OpenStandardInput(), new UTF8Encoding(false));
        string line;
        while ((line = input.ReadLine()) != null) commands.Enqueue(line);
      } catch {}
      inputClosed = true;
    });
    reader.IsBackground = true;
    reader.Start();

    int tick = 0;
    bool fresh = true;
    while (!inputClosed) {
      string command;
      while (commands.TryDequeue(out command)) {
        try { Apply(command); } catch {}
        fresh = true;
      }
      if (fresh || tick % 10 == 0) {
        try { Refresh(); WriteState(); } catch (Exception e) { Write("{\"t\":\"error\",\"message\":" + Json(e.Message) + "}"); }
        fresh = false;
      }
      try { WritePeaks(); } catch {}
      Thread.Sleep(100);
      tick++;
    }
  }

  /** The COM objects the current readings came from, released when replaced. */
  static List<object> held = new List<object>();

  static T Keep<T>(List<object> created, T value) {
    if (value != null) created.Add(value);
    return value;
  }

  static void Release(List<object> objects) {
    foreach (var item in objects) {
      try { if (item != null && Marshal.IsComObject(item)) Marshal.ReleaseComObject(item); } catch {}
    }
  }

  // Runs every second for as long as a mixer pane shows: everything it creates is
  // released when the next reading replaces it, or at once if the reading fails.
  static void Refresh() {
    var created = new List<object>();
    try {
      var enumerator = Keep(created, (IMMDeviceEnumerator)(new MMDeviceEnumerator()));
      IMMDevice speakers;
      Marshal.ThrowExceptionForHR(enumerator.GetDefaultAudioEndpoint(0, 1, out speakers));
      Keep(created, speakers);
      var nextDevice = FriendlyName(speakers);
      object activated;
      var iid = typeof(IAudioEndpointVolume).GUID;
      Marshal.ThrowExceptionForHR(speakers.Activate(ref iid, 23, IntPtr.Zero, out activated));
      var nextEndpoint = Keep(created, (IAudioEndpointVolume)activated);
      iid = typeof(IAudioMeterInformation).GUID;
      Marshal.ThrowExceptionForHR(speakers.Activate(ref iid, 23, IntPtr.Zero, out activated));
      var nextMeter = Keep(created, (IAudioMeterInformation)activated);
      iid = typeof(IAudioSessionManager2).GUID;
      Marshal.ThrowExceptionForHR(speakers.Activate(ref iid, 23, IntPtr.Zero, out activated));
      var manager = Keep(created, (IAudioSessionManager2)activated);
      IAudioSessionEnumerator sessions;
      Marshal.ThrowExceptionForHR(manager.GetSessionEnumerator(out sessions));
      Keep(created, sessions);
      var nextApps = ReadApps(sessions, created);
      var previous = held;
      device = nextDevice;
      endpoint = nextEndpoint;
      endpointMeter = nextMeter;
      apps = nextApps;
      held = created;
      Release(previous);
    } catch {
      Release(created);
      throw;
    }
  }

  static List<App> ReadApps(IAudioSessionEnumerator sessions, List<object> created) {
    int count;
    sessions.GetCount(out count);
    var byId = new Dictionary<string, App>();
    var next = new List<App>();
    var live = new HashSet<uint>();
    for (int i = 0; i < count; i++) {
      IAudioSessionControl2 session;
      sessions.GetSession(i, out session);
      Keep(created, session);
      int state;
      session.GetState(out state);
      if (state == 2) continue; // expired
      uint pid;
      session.GetProcessId(out pid);
      live.Add(pid);
      bool system = session.IsSystemSoundsSession() == 0;
      var names = system ? null : ProcessNames(pid);
      string id = system ? "app:system" : "app:" + names[0];
      App app;
      if (!byId.TryGetValue(id, out app)) {
        app = new App { Id = id, Name = system ? "System sounds" : names[1] };
        byId[id] = app;
        next.Add(app);
      }
      app.Sessions.Add(session);
    }
    // Forget processes that are gone, so a new process given a reused id is looked up again.
    foreach (var pid in new List<uint>(processNames.Keys)) {
      if (!live.Contains(pid)) processNames.Remove(pid);
    }
    next.Sort((a, b) => string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase));
    return next;
  }

  [DllImport("ole32.dll")]
  static extern int PropVariantClear(ref PropVariant value);

  static string FriendlyName(IMMDevice device) {
    IPropertyStore store = null;
    try {
      device.OpenPropertyStore(0, out store);
      var key = new PropertyKey { FormatId = new Guid("a45c254e-df1c-4efd-8020-67d146a850e0"), PropertyId = 14 };
      PropVariant value;
      store.GetValue(ref key, out value);
      try {
        return value.Type == 31 ? Marshal.PtrToStringUni(value.Pointer) : null;
      } finally {
        // The string belongs to the caller: without this, a leak every second.
        PropVariantClear(ref value);
      }
    } catch {
      return null;
    } finally {
      if (store != null) Marshal.ReleaseComObject(store);
    }
  }

  /** Per process id: the grouping key (process name) and the name to show (its description). */
  static readonly Dictionary<uint, string[]> processNames = new Dictionary<uint, string[]>();

  static string[] ProcessNames(uint pid) {
    string[] names;
    if (processNames.TryGetValue(pid, out names)) return names;
    try {
      using (var process = Process.GetProcessById((int)pid)) {
        var key = process.ProcessName.ToLowerInvariant();
        var shown = process.ProcessName;
        try {
          var description = process.MainModule.FileVersionInfo.FileDescription;
          if (!string.IsNullOrWhiteSpace(description)) shown = description.Trim();
        } catch {}
        names = new[] { key, shown };
      }
    } catch {
      names = new[] { "pid" + pid, "pid " + pid };
    }
    processNames[pid] = names;
    return names;
  }

  static void Apply(string line) {
    var parts = line.Split('\t');
    if (parts.Length != 3) return;
    bool volume = parts[0] == "volume";
    if (!volume && parts[0] != "mute") return;
    float level = 0;
    if (volume && !float.TryParse(parts[2], NumberStyles.Float, CultureInfo.InvariantCulture, out level)) return;
    level = Math.Max(0f, Math.Min(1f, level));
    bool mute = parts[2] == "1";
    if (parts[1] == "master") {
      if (endpoint == null) return;
      if (volume) endpoint.SetMasterVolumeLevelScalar(level, ref context); else endpoint.SetMute(mute, ref context);
      return;
    }
    foreach (var app in apps) {
      if (app.Id != parts[1]) continue;
      foreach (var session in app.Sessions) {
        var simple = (ISimpleAudioVolume)session;
        if (volume) simple.SetMasterVolume(level, ref context); else simple.SetMute(mute, ref context);
      }
    }
  }

  static void WriteState() {
    var json = new StringBuilder("{\"t\":\"state\",\"device\":");
    json.Append(device == null ? "null" : Json(device)).Append(",\"master\":");
    float level;
    bool mute;
    endpoint.GetMasterVolumeLevelScalar(out level);
    endpoint.GetMute(out mute);
    Channel(json, "master", "Master", level, mute);
    json.Append(",\"apps\":[");
    bool first = true;
    foreach (var app in apps) {
      var simple = (ISimpleAudioVolume)app.Sessions[0];
      simple.GetMasterVolume(out level);
      simple.GetMute(out mute);
      if (!first) json.Append(',');
      first = false;
      Channel(json, app.Id, app.Name, level, mute);
    }
    Write(json.Append("]}").ToString());
  }

  static void WritePeaks() {
    if (endpointMeter == null) return;
    var json = new StringBuilder("{\"t\":\"peaks\",\"p\":{");
    float peak;
    endpointMeter.GetPeakValue(out peak);
    json.Append("\"master\":").Append(Number(peak));
    foreach (var app in apps) {
      float loudest = 0;
      foreach (var session in app.Sessions) {
        try { ((IAudioMeterInformation)session).GetPeakValue(out peak); loudest = Math.Max(loudest, peak); } catch {}
      }
      json.Append(',').Append(Json(app.Id)).Append(':').Append(Number(loudest));
    }
    Write(json.Append("}}").ToString());
  }

  static void Channel(StringBuilder json, string id, string name, float level, bool mute) {
    json.Append("{\"id\":").Append(Json(id)).Append(",\"name\":").Append(Json(name))
      .Append(",\"volume\":").Append(Number(level)).Append(",\"muted\":").Append(mute ? "true" : "false").Append('}');
  }

  static string Number(float value) { return value.ToString("0.###", CultureInfo.InvariantCulture); }

  static string Json(string text) {
    var json = new StringBuilder("\"");
    foreach (var c in text) {
      if (c == '"' || c == '\\') json.Append('\\').Append(c);
      else if (c < ' ') json.Append("\\u").Append(((int)c).ToString("x4"));
      else json.Append(c);
    }
    return json.Append('"').ToString();
  }

  static void Write(string line) { output.WriteLine(line); }
}
`

// The C# is passed in a single-quoted here-string, so PowerShell expands nothing in it.
const SCRIPT = `$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
${SOURCE}
'@
[ElecdexMixer]::Run()
`

/** A run that ends while wanted is started again after this long. */
const RESTART_MS = 5000

export function windowsMixerBackend(): MixerBackend {
  let child: ReturnType<typeof spawn> | null = null
  let restart: ReturnType<typeof setTimeout> | null = null
  let running = false

  const launch = (events: Parameters<MixerBackend['start']>[0]): void => {
    const proc = spawn(
      'powershell.exe',
      ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', SCRIPT],
      {
        windowsHide: true,
      },
    )
    child = proc
    let buffer = ''
    let stderr = ''
    proc.stdout.setEncoding('utf8')
    proc.stdout.on('data', (chunk: string) => {
      buffer += chunk
      let newline = buffer.indexOf('\n')
      while (newline !== -1) {
        const line = parseWindowsLine(buffer.slice(0, newline).trim())
        buffer = buffer.slice(newline + 1)
        newline = buffer.indexOf('\n')
        if (line?.t === 'state') events.state(line.state)
        else if (line?.t === 'peaks') events.peaks(line.peaks)
        else if (line?.t === 'error')
          events.state({
            support: 'full',
            device: null,
            master: null,
            apps: [],
            error: line.message,
          })
      }
    })
    proc.stderr.setEncoding('utf8')
    proc.stderr.on('data', (chunk: string) => {
      stderr = (stderr + chunk).slice(-500)
    })
    proc.on('error', () => {})
    proc.on('close', (code) => {
      if (child !== proc) return
      child = null
      if (!running) return
      events.state({
        support: 'full',
        device: null,
        master: null,
        apps: [],
        error: `the Windows mixer stopped (${stderr.trim().split('\n').pop() || `code ${code}`})`,
      })
      restart = setTimeout(() => {
        restart = null
        if (running) launch(events)
      }, RESTART_MS)
    })
  }

  return {
    start: (events) => {
      if (running) return
      running = true
      launch(events)
    },
    stop: () => {
      running = false
      if (restart) clearTimeout(restart)
      restart = null
      const proc = child
      child = null
      // Closing stdin ends the loop; killing makes sure.
      proc?.stdin?.end()
      proc?.kill()
    },
    apply: (command: MixerCommand) => {
      const value = command.t === 'volume' ? command.volume.toFixed(3) : command.muted ? '1' : '0'
      child?.stdin?.write(`${command.t}\t${command.id}\t${value}\n`)
    },
  }
}
