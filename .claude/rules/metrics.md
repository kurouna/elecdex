---
paths:
  - "src/services/*.ts"
  - "src/services/metrics/*.ts"
  - "src/services/metrics/sockets/**"
  - "src/services/metrics/gpu/**"
  - "src/main/metrics/**"
  - "src/shared/sockets.ts"
  - "src/shared/gpu.ts"
  - "src/shared/metrics.ts"
  - "src/renderer/widgets/connections/**"
  - "src/renderer/widgets/monitor/**"
  - "src/renderer/widgets/globe/**"
  - "tests/unit/sockets*"
  - "tests/unit/gpu*"
  - "tests/unit/sampler-demand*"
  - "tests/unit/windows-sampler*"
  - "tests/e2e/panes/connections.spec.ts"
  - "tests/e2e/panes/cpu.spec.ts"
  - "tests/e2e/panes/metrics.spec.ts"
  - "tests/e2e/panes/globe.spec.ts"
  - "src/renderer/stores/metrics.svelte.ts"
  - "tests/unit/net-connections*"
  - "tests/unit/globe-geo*"
  - "tests/e2e/support/cpu.ts"
  - "tests/component/connections-*"
  - "tests/component/pane-metrics*"
---

# The metrics collector: sockets and the GPU

The connections pane's socket table and the GPU reading (architecture.md §5.22), both read in the
collector (src/services/metrics) without a process per reading.
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **The connections pane reads the kernel, not the network** (src/services/metrics/sockets/, one
  file per platform behind `RawSocket`). Peers are placed with the bundled GeoIP database, never a
  lookup service. `net.sockets` is the one reading a plugin can never be granted: every metric
  source goes into `PLUGIN_METRIC_SOURCE_IDS` or `PRIVATE_METRIC_SOURCE_IDS` deliberately (a
  unit test checks).
- **The GPU is read without a process per reading** (§5.22, services/metrics/gpu/). Windows: the
  sampler's `gpu` kind, WDDM's performance counters summed in C# compiled once and opened on a
  pool thread (never on the sampler's loop), handed over in `ELECDEX_GPU_SOURCE` (in the script it
  passed the command line's limit). Linux: amdgpu's sysfs only; macOS and other drivers read
  nothing. Where it cannot be read, `gpu.usage`'s `name` is null: the pane says so and CLUSTER
  leaves out its lane, VRAM lamp, slot and spec item - never drawn dark. No lamp on GPU load (user
  decision 2026-10-17).
