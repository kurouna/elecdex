[English](panes-system.md) | [日本語](panes-system.ja.md) | 简体中文

# 系统窗格 — elecdex

elecdex 是一款面向 Windows、macOS 和 Linux 的科幻风格终端模拟器兼系统监视器，是用 Electron 对 eDEX-UI 的重写。本页介绍关于这台机器本身的窗格：shell（终端）、时钟、系统、CPU、内存、GPU、磁盘、占用最高的进程、Cluster 仪表盘、启动器和文件浏览器。每个窗格都说明它在哪个平台上读取什么、多久读取一次，以及从不读取什么。elecdex 在 Windows 上开发和使用；macOS 和 Linux 只在 GitHub Actions 的自动测试中构建和运行过，未经充分的手动验证，因此关于这两个平台的说明描述的是代码，而不是长期使用的结果。

本页内容：

- [默认布局](#默认布局)
- [读取方式](#读取方式)
- [Terminal](#terminal)
- [Clock](#clock)
- [System](#system)
- [CPU](#cpu)
- [Memory](#memory)
- [GPU](#gpu)
- [Disk](#disk)
- [Top processes](#top-processes)
- [Cluster](#cluster)
- [Launcher](#launcher)
- [Filesystem](#filesystem)

同一栏中的网络状态和网络流量窗格见[网络窗格](panes-network.zh-CN.md)。

## 默认布局

默认布局按窗格的用途编排：

| 栏 | 窗格 |
| --- | --- |
| 左侧，这台机器 | [时钟](#clock)、[系统](#system)、[CPU](#cpu)、[内存](#memory)、[磁盘](#disk)、[占用最高的进程](#top-processes)、[网络状态](panes-network.zh-CN.md#network-status)和[网络流量](panes-network.zh-CN.md#network-traffic) |
| 中间，工作 | 三个 [终端](#terminal) 标签页，下面是[启动器](#launcher)和[文件浏览器](#filesystem) |
| 右侧，外面的世界 | [世界视图](panes-network.zh-CN.md#world-view)、行情、天气和日历（[外部世界窗格](panes-world.zh-CN.md)） |

<p align="center">
  <img src="../screenshots/elecdex-tron.jpg" alt="Tron 主题下的 elecdex：左侧是系统监视器，中间是三个 shell 标签页以及启动器和文件浏览器，右侧是世界视图、行情、天气和日历">
  <br><sub>默认布局（standard 预设），Tron 主题</sub>
</p>

- 左侧这一栏是**系统栏**。除 [cockpit](presets.zh-CN.md#cockpit) 和 [blank](presets.zh-CN.md#blank) 外，所有[预设](presets.zh-CN.md)都以相同的宽度和高度把它放在左侧，因此切换预设只改变其余部分，仪表留在原处。cockpit 用 [Cluster](#cluster) 窗格代替这一栏。
- 每个窗格都是布局中的普通节点：可以移动、关闭，或从选择器（**Ctrl+Shift+A**）重新添加。见[工作区](workspace.zh-CN.md)。
- 默认布局空闲时在 Windows 上约占单核的 13%（在 i5-1335U 上测得；[decisions.md](../decisions.md)「Windows の収集方法」）。

## 读取方式

除 Terminal、Clock、Launcher 和 Filesystem 外，本页的窗格都从一个采集器（`src/services/metrics`，运行在独立的 Electron utility process 中）读取**指标源**。

- **订阅按引用计数。** 只要至少有一个窗格订阅，指标源才会被读取；两个窗格读取同一个源也只读取一次。最后一个订阅者离开后，读取停止。
- **只在可见时。** 位于后台标签页或已最小化窗口中的窗格，只保留它绘制成曲线的那些源（以便回来时曲线不断开），其余的源在窗格再次可见之前都会放开。
- **Windows 上不为每次读取启动进程。** systeminformation 在 Windows 上的大多数调用都会启动新的 PowerShell、`wmic` 或 `ping.exe`。按全系统测量，这样做仅默认布局的监视就要约占单核的 144%。elecdex 改为保留**一个常驻的 PowerShell**（`WindowsSampler`），让它循环读取 .NET 和 Win32 API（IP Helper、进程表、ICMP、`SystemInformation.PowerStatus`、性能计数器），每次读取写出一行 JSON。这样同一布局测得为 13.6%。采样器只读取采集器最近请求过的种类，因此在窗口收起、只有曲线在采样时，不会读取进程表、套接字表或 ping。它每秒检查父进程，应用被强制结束后不会残留。
- **不变的信息只读一次。** CPU 型号、操作系统版本以及机器的制造商和型号在应用运行期间不会变化，因此每个采集器只采集一次，不做轮询。

各指标源的周期（来自 `src/services/metrics/sources.ts`）：

| 指标源 | 周期 | 使用的窗格 |
| --- | --- | --- |
| `cpu.load` | 1 秒 | CPU、Cluster |
| `cpu.speed` | 2 秒 | CPU |
| `cpu.temperature` | 5 秒（Windows 上从不读取） | CPU |
| `cpu.info`、`os.info`、`hardware.system`、`gpu.info` | 一次 | 系统、CPU、Cluster |
| `mem.usage` | 1 秒 | 内存、Cluster |
| `mem.swap` | 10 秒 | 内存、Cluster |
| `gpu.usage` | 1 秒 | GPU、Cluster |
| `disk.io` | 2 秒 | 磁盘、Cluster |
| `disk.volumes` | 30 秒 | 磁盘、Cluster |
| `proc.list` | Windows 上 5 秒，其他平台 3 秒 | 占用最高的进程、CPU（任务数）、Cluster |
| `os.uptime` | 5 秒 | 系统、Cluster |
| `power.battery` | 30 秒 | 系统、Cluster |

## Terminal

| | |
| --- | --- |
| 位置 | standard（三个标签页）、earth、dev（两个）、cockpit；选择器名称 *terminal*；**Ctrl+Shift+S** 聚焦 shell（没有时添加一个）。可以打开任意多个 |
| 读取 | 运行你的 shell 的伪终端（node-pty；Windows 上为 ConPTY） |
| 平台 | Windows：已安装 PowerShell 7 时用它，否则用 Windows PowerShell。macOS、Linux：`$SHELL` 中的 shell（bash、zsh 和 fish 可跟随文件夹） |
| 设置 | *Settings → General → Terminal*：起始文件夹、响铃、字号、粘贴确认（`settings.json` 中的 `terminal.*`） |

<p align="center">
  <img src="../screenshots/pane-terminal.jpg" alt="单独的终端窗格：显示 shell 完整路径的 TERMINAL 标题、以文件夹命名的标签页，以及 PowerShell 提示符">
  <br><sub>终端</sub>
</p>

### 标签页与标题

- 窗格标题为 **TERMINAL**，并显示所选 shell 的完整路径。
- 每个标签页以其所在文件夹命名（主目录也用它自己的名字），只有当两个标签页名字相同时才会加上上级文件夹。悬停时显示 shell 和完整路径。
- 已退出的 shell 会在其标签页上注明，并附上退出码；按任意键即在原文件夹重新启动。
- 后台标签页里的 shell 有输出时，其标签页会显示一个点，切换过去后消失。
- 把窗格移到布局中的其他位置，或重新加载页面，会话都会保留回滚内容：窗格会重新连接到正在运行的 shell。

### 运行哪个 shell

| 平台 | shell | 选择方式 |
| --- | --- | --- |
| Windows | PowerShell 7（`pwsh`） | 若存在 `%ProgramFiles%\PowerShell\7\pwsh.exe`（安装程序）或 `%LOCALAPPDATA%\Microsoft\WindowsApps\pwsh.exe`（Microsoft Store 别名）就使用它；无法启动时改用 Windows PowerShell |
| Windows | Windows PowerShell | 未安装 PowerShell 7 时 |
| macOS、Linux | `$SHELL` | bash、zsh 和 fish 会注入 shell 集成；其他 shell 在没有集成的情况下运行 |

- 没有选择 shell 的设置，页面也不能指定 shell 或其参数：由主进程根据环境决定。不搜索 PATH，也不导入登录 shell 的环境。
- shell 会得到 `TERM=xterm-256color`、`COLORTERM=truecolor` 和 `TERM_PROGRAM=elecdex`。

### 如何跟随 shell 的文件夹（shell 集成）

eDEX-UI 每秒轮询 `/proc/<pid>/cwd`、`lsof` 和 `ps`，在 Windows 上无法跟随文件夹。elecdex 让每个 shell 在每次提示符后**通过终端转义序列报告其文件夹**，不做任何轮询。

| 序列 | 发送者 | 含义 |
| --- | --- | --- |
| `OSC 7 ; file://<host><path> ST` | bash、zsh、fish | 当前文件夹。路径按 UTF-8 字节逐个百分号编码，因此非 ASCII 的文件夹名不会损坏 |
| `OSC 9 ; 9 ; "<path>" ST` | PowerShell | 当前文件夹，带引号，与 Windows Terminal 读取的格式相同。PowerShell 发送 `ProviderPath`，因此用 `New-PSDrive` 创建的驱动器也会报告为实际路径。在非文件系统的提供程序（如 `HKLM:\`）中不发送 |
| `OSC 133 ; A/B/C/D ST` | 四者皆是 | 提示符开始、输入开始、命令开始、带退出码的命令结束 |

- **脚本如何加载。** bash 使用 `--init-file`（脚本随后会读入你自己的 `.bashrc`），zsh 使用临时的 `ZDOTDIR`（你的 `.zshrc` 会被读回；该文件夹在 elecdex 退出时删除），fish 在 `XDG_DATA_DIRS` 中多加一项（其 `vendor_conf.d` 在你的配置之后加载），PowerShell 使用 `-NoExit -Command`，脚本通过环境变量传入。不更改 PowerShell 的执行策略，也不运行脚本文件。
- **接受什么。** 这些序列由主进程取出（xterm.js 看不到）。OSC 7 只在主机为空、`localhost` 或本机名称时接受，因此 `ssh` 会话中的文件夹会被忽略。OSC 9;9 只接受绝对路径。其他 OSC 9 序列（进度、通知）原样通过。
- **拒绝什么。** 含控制字符的路径，以及以两个分隔符开头的路径（网络共享如 `\\server\share`、`\\?\` 或 `//host`）会被丢弃。任何程序的输出都能携带这些序列，而跟随共享会让 Windows 向该服务器提交你的 NTLM 凭据。因此位于网络共享中的 shell 不会被跟随：其标签页显示 *network share*，[Filesystem](#filesystem) 窗格回到主目录。
- 启动后 10 秒内没有收到序列，就视为该 shell 没有集成：不跟随文件夹，也不会改为轮询。
- 报告的文件夹作为 `cwd` 保存在窗格状态中，并保存在 `layout.json` 和已保存的布局里，因此**下次启动或应用布局时恢复的窗格，会从它最后所在的文件夹启动**。

### 起始文件夹

新的 shell 窗格（来自选择器、新标签页、拆分或预设）从 *Settings → General → Terminal* 中设置的文件夹（`terminal.startDirectory`）启动：

- 为空（默认）表示主目录；路径开头的 `~` 代表主目录。
- 已不存在的文件夹或位于网络共享中的文件夹会回退到主目录。
- 文件夹的检查不会阻塞主进程。若 1.5 秒内没有回应（例如无法访问的驱动器），shell 就从回退文件夹启动。保存了 `cwd` 的窗格在使用起始文件夹之前也要经过同样的检查。

### 搜索、链接、粘贴和响铃

- **Ctrl+Shift+F** 在窗格上方打开搜索栏：匹配项用主题色标出并计数，Enter 和 Shift+Enter 在其间跳转，Escape 关闭；**Aa**、**ab** 和 **.*** 分别切换区分大小写、全字匹配和正则表达式。搜索跳到的匹配项不会被复制。
- shell 输出的 URL 是链接（OSC 8 超链接也是），按 Ctrl+单击（macOS 上为 ⌘+单击）会在浏览器中打开。
- 与 PuTTY 或 Windows Terminal 一样，选中文本即复制，右键粘贴；Ctrl+C 仍是 shell 的中断。
- 粘贴多行文本前会先确认（每个换行都会执行一条命令），也可以选择不再询问（`terminal.confirmPaste`）。含有制表符和换行以外的控制字符的文本也会确认。
- 程序可以用 OSC 52 写入剪贴板；读取剪贴板的请求不会得到回应。
- 响铃（BEL）时窗格边缘闪烁并发出声音，每 0.5 秒最多一次。可在 *Settings → General → Terminal* 中选择两者、其一或都关闭（`terminal.bell`：`both`、`flash`、`sound`、`off`）。
- **Ctrl+Shift+K** 清除回滚缓冲区；**Ctrl+Shift+=** 和 **Ctrl+Shift+-** 放大或缩小所有 shell 的字号（`terminal.fontSize`，8 到 32 px，默认 13）；字号也在设置中。

快捷键按默认绑定书写；可在 *Settings → Keyboard* 中重新绑定（[键盘快捷键](keyboard.zh-CN.md)）。

### 细节

- 终端使用 xterm.js 6 及其 WebGL 渲染器。隐藏标签页中的 shell 在显示之前不占用 WebGL 上下文；Chromium 同时只允许约 16 个。
- 从不调整隐藏窗格的大小，也不把过渡中的尺寸发送给 shell，因为 ConPTY 每次调整大小都会重新折行回滚内容。
- 终端窗格不能弹出到工作区上方（*▣ pop up*）：shell 需要在布局中有位置。
- 设计：[architecture.md §6](../architecture.md#6-ターミナル設計)（日文）。

## Clock

| | |
| --- | --- |
| 位置 | 系统栏（最上方）；选择器名称 *clock* |
| 读取 | 页面中的系统时钟和时区 |
| 更新 | 每秒一次，在整秒边界上；只在窗格可见时 |

- 以大号数字显示 24 小时制的 `HH:MM:SS`，每个数字占固定宽度的格子，时间不会抖动。数字变化时会滚动，只有变化的那一位会动。
- 旁边是时区缩写（如 `JST`）；悬停可看到完整的 IANA 时区名。
- 它在共享的整秒边界上走动，而不是用自己的定时器，因此不会落后于系统时钟。在后台标签页或窗口最小化时不走动，一旦可见立即显示正确时间。
- 该窗格没有标题栏；拖动其顶部的线条来移动它。
- 可以放大（**Ctrl+Shift+Z**）铺满窗口，也可以从选择器弹出。

## System

| | |
| --- | --- |
| 位置 | 系统栏；选择器名称 *system* |
| 读取 | `os.info`、`hardware.system`（一次）、`os.uptime`（5 秒）、`power.battery`（30 秒） |
| 平台 | Windows：操作系统版本来自注册表（`reg query`，一次），电源来自采样器。macOS、Linux：systeminformation |

<p align="center">
  <img src="../screenshots/pane-sysinfo.jpg" alt="单独的系统窗格：日期和星期、运行时间、操作系统类型、电池计量、完整的操作系统版本和架构，以及机器的制造商、型号和机箱">
  <br><sub>系统</sub>
</p>

- 日期和星期、运行时间、操作系统类型，以及带电池计量的电源（绿色，低于 20% 时变红）。
- 完整的操作系统版本和架构（就像 `uname` 或 `winver` 显示的那样）。
- 机器的制造商、型号和机箱类型。
- 应用运行期间不会变化的信息只读取一次，不做轮询。
- 与网络状态窗格一样，没有 ⤢ 按钮：只有几个数值的窗格铺满窗口并无益处。

## CPU

| | |
| --- | --- |
| 位置 | 系统栏；选择器名称 *cpu* |
| 读取 | `cpu.info`（一次）、`cpu.load`（1 秒）、`cpu.speed`（2 秒）、`cpu.temperature`（5 秒，Windows 上不读）、`proc.list`（任务数） |
| 更新 | 负载在后台标签页中也继续采样，曲线不会断开；其余只在可见时 |

<p align="center">
  <img src="../screenshots/pane-cpu.jpg" alt="单独的 CPU 窗格：两张各核心平均负载的曲线图，以及核心数、最低和最高频率、任务数一行">
  <br><sub>CPU</sub>
</p>

- 两张各核心平均负载的曲线图（核心分成两半），或像任务管理器那样每个逻辑核心一根柱。在窗格中切换，选择保存在窗格状态中。
- 曲线下方是温度（读不到时显示核心数）、最低和最高频率，以及任务数。
- Windows 上不读取温度：无特权的进程从 WMI 得不到任何结果，每次询问还要花约 400 ms。
- 窗格副标题是 CPU 型号。

## Memory

| | |
| --- | --- |
| 位置 | 系统栏；选择器名称 *memory* |
| 读取 | `mem.usage`（1 秒）、`mem.swap`（10 秒）；两者在后台标签页中都继续采样 |
| 平台 | 已用内存在所有平台都来自 Node 的 `os` 模块（不启动进程）。交换区：Windows 来自采样器（页面文件每 30 秒通过 WMI 读取）；macOS 和 Linux 来自 systeminformation |

<p align="center">
  <img src="../screenshots/pane-memory.jpg" alt="单独的内存窗格：过去一分钟的内存和交换区使用比例，以及当前用量的柱">
  <br><sub>内存</sub>
</p>

- 过去一分钟内存和交换区的使用比例，与 CPU 曲线同步滚动（两者都每秒读取），并以柱状显示当前用量。
- eDEX-UI 每 1.5 秒查询一次完整的内存统计，在 Windows 上每次都会启动一个进程。elecdex 只对交换区这样查询，而且间隔更长。

## GPU

| | |
| --- | --- |
| 位置 | ai 预设（ELEC system 窗格下方）；选择器名称 *gpu* |
| 读取 | `gpu.usage`（1 秒，在后台标签页中继续采样） |
| 平台 | Windows：通过采样器读取 WDDM 性能计数器。Linux：只读 amdgpu 驱动的 sysfs 文件。macOS，以及使用 NVIDIA 或 Intel 显卡的 Linux：不读取 |
| 隐私 | `gpu.info` 和 `gpu.usage` 属于可以授予插件的读数 |

<p align="center">
  <img src="../screenshots/pane-gpu.jpg" alt="单独的 GPU 窗格：过去一分钟的 GPU 负载和显存使用比例，3D、计算、复制、视频各引擎的负载，以及显存和共享内存的柱">
  <br><sub>GPU</sub>
</p>

- 显示过去一分钟 GPU 的负载和它自身显存（VRAM）的使用比例（显存为较淡的线）、各类引擎（3D、计算、复制、视频）的负载，并以柱状显示当前显存和共享内存的用量。
- 显示的是自身显存最大的适配器（处理器集成显卡之外另有独立显卡时即为独立显卡）。
- 负载与任务管理器的算法相同：按引擎汇总各进程，取最忙的引擎。
- 读不到时，窗格显示 **NO GPU READING ON THIS MACHINE**，Cluster 窗格则不显示 GPU 通道、显存警示灯和栏位，而不是把它们画成暗的。

| 平台 | 读取方式 |
| --- | --- |
| Windows | 常驻采样器读取 `GPU Engine` 和 `GPU Adapter Memory` 性能计数器。引擎表每个进程 × 引擎一行（数百行），因此由只编译一次的 C# 汇总。适配器的名称和显存大小通过 DXGI 只读一次（WMI 的 `AdapterRAM` 最大只到 4 GB）。计数器首次打开需要 0.5 到 5 秒，因此在线程池中打开，不会阻塞采样器的循环。测得开销约为单核的 0.3% |
| Linux | 只读 amdgpu 的 sysfs 文件：`gpu_busy_percent`、`mem_info_vram_*`、`mem_info_gtt_*`。NVIDIA（nvidia-smi 或 NVML）和 Intel 每次读取都需要启动进程，因此不读 |
| macOS | 不读：除了每次启动进程（`ioreg`）之外没有办法 |

- 没有窗格订阅时，采样器的 GPU 读取会在 15 秒内失效并停止。
- 设计：[architecture.md §5.22](../architecture.md#522-gpu-ペインgpu-の負荷と-vram)（日文）。

## Disk

| | |
| --- | --- |
| 位置 | 系统栏；选择器名称 *disk* |
| 读取 | `disk.volumes`（30 秒）、`disk.io`（2 秒）；只在可见时 |
| 平台 | Windows：采样器（`DriveInfo` 以及 `PhysicalDisk(_Total)` 性能计数器）。Linux：`df` 和 `/proc/diskstats`。macOS：只有 `df`，没有读写速率 |

<p align="center">
  <img src="../screenshots/pane-disk.jpg" alt="单独的磁盘窗格：上方是读写速率和繁忙程度，下方每个卷一根柱，显示已用空间与总容量">
  <br><sub>磁盘</sub>
</p>

- 每个卷一根柱，显示已用空间与总容量（90% 起为琥珀色，97% 起为红色），附剩余空间、文件系统以及是否为可移动或网络卷。
- 上方是读写速率和磁盘繁忙程度。macOS 上不显示，因为那里唯一的读取方式是 `ioreg`，每次都要启动进程。
- Windows 上只列出固定驱动器和可移动驱动器，不列网络驱动器，因为无法访问的共享可能阻塞数秒。
- 在 Linux 和 macOS 上，排除 `tmpfs`、`squashfs`、`/snap`、`/run`、`/boot/efi` 以及 macOS 的系统卷，同一 APFS 容器中的卷只显示一次。
- 放大（**Ctrl+Shift+Z**）时，它以居中的面板出现，而不是铺满整个窗口。

## Top processes

| | |
| --- | --- |
| 位置 | 系统栏；选择器名称 *top processes* |
| 读取 | `proc.list`：Windows 上每 5 秒（采样器的进程表），其他平台每 3 秒（systeminformation）；只在可见时 |

- 标题为 `PID | NAME | CPU | MEM` 的表格，列出最忙的程序，能放下多少行就显示多少行（最多 12 行）。
- 同一程序的进程按名称合并为一行，因此浏览器是一项而不是四十项。按 CPU、再按内存排序。
- CPU 是占整台机器（全部核心）的比例；内存是占物理内存的比例。
- 放大时以居中的面板出现。

## Cluster

| | |
| --- | --- |
| 位置 | cockpit 预设（左上，代替系统栏）；选择器名称 *cluster dashboard* |
| 读取 | 只读其他窗格已在读取的源（CPU、内存、GPU、流量、磁盘、ping、网络接口、交换区、卷、连接对象、进程、电池、运行时间、不变的信息），以及 AWAKE 的状态、开启地震提醒时的地震列表 |
| 更新 | 每个数值到达即绘制。在后台标签页中保留四个绘制曲线的 1 秒源和只采集一次的源，其余放开 |
| 隐私 | 不读取套接字表，也不读取 Wi-Fi 窗格和 Ethernet 窗格的源 |
| 设置 | 无 |

<p align="center">
  <img src="../screenshots/pane-cluster.jpg" alt="单独的仪表盘窗格：一排警示灯和消息行、时钟和日期、两排各五个数值、机器规格一行，以及 CPU、各核心、内存、GPU、磁盘 I/O、网络下行与上行和 ping 的通道">
  <br><sub>仪表盘（cluster）</sub>
</p>

像汽车的仪表盘一样，把整台机器放进一个窗格。

- **警示灯。** LINK、PING、CPU、MEM、VRAM（仅限能读取 GPU 的机器）、DISK、BATT（仅限有电池的机器）、AWAKE 和 QUAKE（仅在开启地震提醒时）。不适用的灯不显示，而不是显示为暗。灯要在同一级别持续 10 秒后才亮；PING 在同一级别出现两次应答后亮起，只计最近 15 秒内的应答；链路断开时 LINK 立即亮起。读数回落后灯立即熄灭。旁边的**消息行**用文字说出亮着的灯中最严重的一项，并说明还有几项（`+N MORE`）；其卡片列出全部亮着的灯。
- **GPU 忙碌不会点亮任何灯。** GPU 100% 只是在工作，让模型变慢的是显存用满。
- 警示灯下方是**时钟和日期**。
- **通道。** CPU、内存、磁盘 I/O、网络下行与上行和 PING 六条通道（能读取 GPU 的机器在内存下方再加一条 GPU，共七条），用折线显示最近一分钟，并附峰值与平均值。CPU、内存、GPU 和磁盘为 0–100%，网络（上下行共用一个刻度）和 PING 按最近一分钟缩放，刻度上限写在通道里。每收到一个 CPU 读数就无动画地重绘一次，通道不会自己滚动。有空间时，CPU 下方会显示每个核心当前的负载。
- **数值。** 两排各五个：内存和显存的用量、交换区、最满的磁盘、连接对象数、最忙的程序、电源、运行时间、链路累计流量和 IPv4 地址（及网络接口）。
- **规格行。** 有空间时，以系统栏同样的说法列出操作系统、制造商、型号、机箱、CPU 和 GPU，以及 AWAKE 的设置。不显示主机名。
- **链路**指持有默认路由的那一块网卡（有线或 Wi-Fi 中通往互联网的那一个），不是两者相加；其累计流量从该网卡连接时算起。
- 每个数值都能打开详情卡片，显示行里放不下的内容。
- 它会按大小以五种方式排布（wide、medium、short、compact、narrow），从全屏到窄栏都能用。
- 全屏时空闲约占单核的 10–15%，比并排放置 CPU、内存、流量和磁盘窗格更省（这四个加时钟为 24.1%，在 Windows 11、1920×1080 下测得）。

级别（来自 `src/shared/cluster.ts`；数字、柱、核心、警示灯和消息行都遵循同一个判断）：

| 读数 | 注意 | 危险 |
| --- | --- | --- |
| CPU、内存 | 85% | 95% |
| 显存 | 90% | 97% |
| 最满的卷 | 90% | 95% |
| 磁盘 I/O 繁忙程度 | 90% | - |
| Ping | 150 ms | 无应答 |
| 电池（放电中） | 20% | 10% |

- 读不到磁盘繁忙程度的机器（macOS）上，磁盘 I/O 通道会注明这一点，DISK 灯不据此判断。
- 在注意色的黄色接近底色的 Amber 主题中，注意和危险的数字还会带上 ▲ 和 ◆。
- 设计：[cluster.md](../cluster.md) 和 [architecture.md §5.20](../architecture.md#520-cluster-ペイン1-枚のダッシュボード)（日文）。

## Launcher

| | |
| --- | --- |
| 位置 | standard 预设（shell 下方）；选择器名称 *launcher*；**Ctrl+Shift+L** 搜索启动器（布局中没有时会弹出一个到工作区上方） |
| 读取 | Windows：开始菜单文件夹（所有用户和当前用户）以及 shell 列出的打包应用。macOS：`/Applications`、`/System/Applications`、`~/Applications` 中的 `.app`。Linux：XDG 应用目录中的 `.desktop` 文件。再加上你自己的条目 |
| 设置 | `settings.json` 中的 `launcher.items` 和 `launcher.showSystem`（窗格的 **EDIT LIST** 按钮会打开它） |

<p align="center">
  <img src="../screenshots/pane-launcher.jpg" alt="单独的启动器窗格：筛选框下是以主题强调色绘制的应用图标网格">
  <br><sub>启动器</sub>
</p>

- 平台的应用加上你自己的条目，最常用的在前：elecdex 统计成功启动的次数并按此排序。在还没有启动过任何东西之前，你自己的条目排在前面。
- 输入即可筛选，Enter 启动第一个匹配项。
- 图标采用主题的强调色，悬停时显示原本的颜色（Business 主题下始终如此）。只为滚动到可见范围的图块获取图标。
- 在 Windows 上，图标由 Windows shell 绘制，应用名称与开始菜单中显示的一致——包括没有快捷方式的打包应用（Teams、Outlook、Terminal）。
- 页面按主进程自己列表中的不透明 id 请求启动，从不使用路径或命令，因此即使页面被攻破，也无法运行列表之外的东西。
- 弹出的启动器在启动了某个程序后自动消失。

在 `launcher.items` 下添加条目：

```json
"launcher": {
  "showSystem": true,
  "items": [
    { "name": "Project notes", "target": "C:\\Users\\me\\notes.md" },
    { "name": "Docs", "target": "https://github.com/kurouna/elecdex" },
    { "name": "Node REPL", "target": "C:\\Program Files\\nodejs\\node.exe", "args": ["-i"] }
  ]
}
```

| 键 | 含义 |
| --- | --- |
| `showSystem` | 是否列出平台自己的应用（默认 `true`） |
| `items[].name` | 显示名称，最多 80 个字符 |
| `items[].target` | http(s) URL，或程序、文档、文件夹、快捷方式的路径 |
| `items[].args` | 可选。有它时，以这些参数把 target 作为程序运行 |

最多保留 200 个条目。

## Filesystem

| | |
| --- | --- |
| 位置 | standard 预设（启动器旁边）；选择器名称 *filesystem* |
| 读取 | 最近聚焦的 shell 的文件夹（由 [shell 集成](#如何跟随-shell-的文件夹shell-集成)报告）；只在窗格可见时监视变化 |

<p align="center">
  <img src="../screenshots/pane-filesystem.jpg" alt="单独的文件系统窗格：以文件夹和文件图标的网格显示所跟随 shell 的文件夹">
  <br><sub>文件系统</sub>
</p>

- 以网格显示所跟随 shell 的目录。点击文件夹即 `cd` 进去（命令输入到该 shell 并执行）；点击文件则在提示符处输入它加了引号的路径，供下一条命令使用。
- 在 Windows 上也能跟随 `cd`，这是 eDEX-UI 做不到的。
- 没有可跟随的 shell，或 shell 不报告文件夹时，它会自行浏览，并标为 **detached**。
- **drives** 图块列出各驱动器及其可用空间。
- 位于网络共享中的 shell 不会被跟随：窗格回到主目录。出于[终端](#如何跟随-shell-的文件夹shell-集成)一节所述的原因，主进程拒绝列出和监视共享路径。
- 文件系统窗格不能弹出：它跟随的是布局中的 shell。
