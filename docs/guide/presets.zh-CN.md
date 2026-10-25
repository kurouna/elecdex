[English](presets.md) | [日本語](presets.ja.md) | 简体中文

# 布局预设 — elecdex

elecdex 是一款科幻风格的桌面终端模拟器兼系统监视器，用 Electron、Svelte 和 TypeScript 重写了 eDEX-UI。本页介绍它的
十个**布局预设**——standard、network、earth、dev、media、desk、ai、cockpit、retro 和 blank——每个都用一个按键
（**Ctrl+Shift+F1** 到 **F10**）把某类工作所需的窗格摆上屏幕：每个预设包含什么、预设如何变成已保存布局，以及每个预设
展示的功能。elecdex 可在 Windows、macOS 和 Linux 上运行；它在 Windows 上开发和使用，macOS 和 Linux 只在 GitHub
Actions 的自动化测试中运行过，因此尚未经过充分验证。

## 本页内容

- [十个预设一览](#十个预设一览)
- [预设如何工作](#预设如何工作)
- [standard](#standard)
- [network](#network)
- [earth](#earth)
- [dev](#dev)
- [media](#media)
- [desk](#desk)
- [ai](#ai)
- [cockpit](#cockpit)
- [retro](#retro)
- [blank](#blank)

窗格按你正在做的事来编排：十个布局预设各用一个按键就能把合适的窗格摆上屏幕——Ctrl+Shift+F1 到 F10——而且除
cockpit 和 blank 外，每个预设都把系统栏留在左侧，所以切换时换的是舞台，仪表仍在原处。最后的 blank 一个窗格也没有，
用来逐个添加、搭出你自己的布局。下面的功能按展示它们的预设分组，每张图都是该预设配上不同的主题。

## 十个预设一览

**系统栏**是默认布局的左栏，在每个带它的预设里都一样：从上到下依次是时钟、[system](panes-system.zh-CN.md#system)、
[CPU](panes-system.zh-CN.md#cpu)、[memory](panes-system.zh-CN.md#memory)、[disk](panes-system.zh-CN.md#disk)、top processes、
network status 和 network traffic，占窗口宽度的 18%。

| 按键 | 预设 | 窗格（系统栏之外） | 截图的主题 |
| --- | --- | --- | --- |
| Ctrl+Shift+F1 | [standard](#standard) | 三个 [Terminal](panes-system.zh-CN.md#terminal) 标签页；[Launcher](panes-system.zh-CN.md#launcher) 与 [Filesystem](panes-system.zh-CN.md#filesystem)；[World view](panes-network.zh-CN.md#world-view)、[Markets](panes-world.zh-CN.md#markets)、[Weather](panes-world.zh-CN.md#weather)、[Calendar](panes-desk.zh-CN.md#calendar) | Tron |
| Ctrl+Shift+F2 | [network](#network) | [World view](panes-network.zh-CN.md#world-view) 下方是 [Connections](panes-network.zh-CN.md#connections)；[Wi-Fi](panes-network.zh-CN.md#wi-fi) 下方是 [Ethernet](panes-network.zh-CN.md#ethernet) | White |
| Ctrl+Shift+F3 | [earth](#earth) | [Orbit](panes-world.zh-CN.md#orbit) 下方是 [Terminal](panes-system.zh-CN.md#terminal)；[World view](panes-network.zh-CN.md#world-view)、[Quakes](panes-world.zh-CN.md#quakes)、[Weather](panes-world.zh-CN.md#weather) | Tron |
| Ctrl+Shift+F4 | [dev](#dev) | [AI Agent](panes-dev.zh-CN.md#ai-agent)；[Docker](panes-dev.zh-CN.md#docker) 与一个 shell 的标签页；[Clipboard](panes-desk.zh-CN.md#clipboard)、[Timer](panes-desk.zh-CN.md#timer) 与一个 shell 的标签页；[Git](panes-dev.zh-CN.md#git)、[AI chat](panes-ai.zh-CN.md#ai-chat) 与 [Log Watch](panes-dev.zh-CN.md#log-watch) 的标签页 | Phosphor |
| Ctrl+Shift+F5 | [media](#media) | YouTube (TV)（[网页窗格](panes-media.zh-CN.md#browser-youtube-and-x)）；[Now playing](panes-media.zh-CN.md#now-playing)、[Spectrum](panes-media.zh-CN.md#spectrum)、[Mixer](panes-media.zh-CN.md#mixer)；X 与 [RSS](panes-world.zh-CN.md#rss) 的标签页 | White |
| Ctrl+Shift+F6 | [desk](#desk) | [Notes](panes-desk.zh-CN.md#notes)；[Timer](panes-desk.zh-CN.md#timer) 与 [Calculator](panes-desk.zh-CN.md#calculator)；[Tasks](panes-desk.zh-CN.md#tasks) 下方是 [Clipboard](panes-desk.zh-CN.md#clipboard)；[Calendar](panes-desk.zh-CN.md#calendar) 下方是 [Utility](panes-desk.zh-CN.md#utility) 与 [ELEC-16](panes-retro.zh-CN.md#elec-16) SCI 的标签页 | Black |
| Ctrl+Shift+F7 | [ai](#ai) | 上下两个 [AI chat](panes-ai.zh-CN.md#ai-chat)；[ELEC system](panes-ai.zh-CN.md#elec-system) 下方是 [GPU](panes-system.zh-CN.md#gpu) | Business (Dark) |
| Ctrl+Shift+F8 | [cockpit](#cockpit) | 没有系统栏：[Cluster](panes-system.zh-CN.md#cluster) 下方是 [Terminal](panes-system.zh-CN.md#terminal)；[Wi-Fi](panes-network.zh-CN.md#wi-fi) 下方是 [Ethernet](panes-network.zh-CN.md#ethernet) | Black |
| Ctrl+Shift+F9 | [retro](#retro) | 把 [ELEC-16](panes-retro.zh-CN.md#elec-16)、ELEC-16 SCI 和 [CHIP-8](panes-retro.zh-CN.md#chip-8) 作为标签页的一个窗格；其下是 16 段的 [Spectrum](panes-media.zh-CN.md#spectrum) | Tron |
| Ctrl+Shift+F10 | [blank](#blank) | 无 | Amber |

## 预设如何工作

| | |
| --- | --- |
| 位置 | LAYOUTS 对话框（**Ctrl+Shift+G**，或状态栏中的 *layouts*）：已保存布局列表下方的预设架子；**Ctrl+Shift+F1** 到 **F10**；操作面板（**Ctrl+Shift+P**）中的 PRESET 行（走与按键相同的路径） |
| 保存位置 | `layouts.json`，作为记得自己来自哪个预设的已保存布局 |
| 设置 | *Settings → General → Layouts* → *ask before switching layout*（默认开启）；按键在 *Settings → Keyboard* |

预设是**模板**，而不是第二种布局：

- **选择一个预设，会添加一个由它生成的已保存布局并切换过去。** 从此它就是你的已保存布局之一：它有数字键
  （按在列表中的位置对应 Ctrl+Shift+1 到 9 和 0），并跟随你的工作——你对工作区做的任何改动都保存在其中，回来时
  一切如你离开时一样。
- **再次选择它会回到那个布局**，而不是再添加一个。布局只记得自己来自哪个预设，因此同一个预设不会被添加两次。
- **↺ 把布局恢复为它的预设**，名称和在列表中的位置保持不变。
- 如果你已经有一个与预设同名的自建布局，新建的会加上编号（`desk 2`）。
- 每个预设都有自己的按键 **Ctrl+Shift+F1** 到 **F10**（按架子的顺序），在任何地方都做同样的事：有由它生成的布局就
  转到那里，没有就添加一个。按键绑定的是预设而不是位置，所以以后增加预设时，你重新绑定的按键仍留在同一个预设上。
  按键带 Ctrl+Shift，是因为裸的 F 键属于任务窗格（F2 编辑）和 shell 中的程序，例如 htop 或 mc。
- **新安装会一次得到全部十个**，放在 Ctrl+Shift+1 到 0 上，standard 为当前布局。新安装指 `layout.json` 和
  `layouts.json` 都不存在。已有的已保存布局列表绝不会被自动添加：请从架子上添加预设。
- 最多保存 20 个布局；列表满时，要先删除一个才能添加预设。
- 预设不会开启任何东西：Starlink、地震警报之类仍由你自己决定是否开启。
- 应用任何布局都会替换工作区，被替换的窗格中的 shell 会结束；有 shell 打开时会先询问（见
  [已保存布局](workspace.zh-CN.md#已保存布局)）。

LAYOUTS 对话框：

<p align="center">
  <img src="../screenshots/elecdex-layouts.jpg" alt="Tron 主题下 standard 布局之上的布局对话框：预设作为已保存布局，可见编号 1 到 9（编号 0 的 blank 在更下方），每个都有其排布的缩略图；下方是预设的架子，列出各预设的缩略图、所在位置以及对应按键 Ctrl+Shift+F1 到 F10（blank 是空框）">
  <br><sub>布局 (Ctrl+Shift+G) · Tron</sub>
</p>

- 列表的每一行和架子上的每张卡片都画有窗格排布的缩略图；系统栏画得较淡，以便突出差异。
- 卡片显示预设的状态：**on 3**（由它生成的布局在该数字键上）、**kept**（在你的布局中，但在前十个之外）、
  **in this one**（就是你当前所在的布局）或 **+ add**（尚未添加）。卡片下方显示该预设的按键。
- 架子只有一行，可横向滚动，鼠标滚轮也能滚动它。**Tab** 从列表移到架子，**←** / **→** 在卡片间移动，**↑** 回到
  列表。在 1920x1080 的设计尺寸下，十张卡片排得下一行。
- 选中的行或卡片会闪烁三次（每次 100 ms），然后对话框断电、开始切换。减少动效时立即切换。

在 1920x1080 下，每个预设的所有窗格都不小于其最小尺寸；在 1366x768 下，舞台上的窗格也不小于最小尺寸（由单元测试
检查）。设计说明：[architecture.md §5.6](../architecture.md)（日文）。

## standard

*这台机器、它的 shell，以及外面的世界。*

| | |
| --- | --- |
| 按键 | **Ctrl+Shift+F1** |
| 窗格 | 系统栏；三个 [Terminal](panes-system.zh-CN.md#terminal) 标签页，下方是 [Launcher](panes-system.zh-CN.md#launcher) 和 [Filesystem](panes-system.zh-CN.md#filesystem)；右侧是 [World view](panes-network.zh-CN.md#world-view)、[Markets](panes-world.zh-CN.md#markets)、[Weather](panes-world.zh-CN.md#weather) 和 [Calendar](panes-desk.zh-CN.md#calendar) |
| 截图 | Tron |

elecdex 启动时的默认布局。

<p align="center">
  <a href="https://youtu.be/JlCZzLhp_PM">
    <img src="../screenshots/elecdex-tron.jpg" alt="Tron 主题下的 elecdex：左侧是系统监视器，中间是三个 shell 标签页以及启动器和文件浏览器，右侧是世界视图、行情、天气和日历">
  </a>
  <br><sub>standard · Tron</sub>
  <br>
  ▶ <a href="https://youtu.be/JlCZzLhp_PM">观看 3 分钟导览</a> · <a href="https://youtube.com/shorts/K-Is8LihR1w">Shorts（竖屏）</a>
</p>

- **[终端](panes-system.zh-CN.md#terminal)** — 真正的 shell（PowerShell（已安装时为 7）、bash、zsh、fish），标签页和分屏
  数量不限。shell 集成会报告工作目录和退出码，Windows 上也一样；窗格被移动或重新加载后，会话的回滚缓冲区依然保留。
  下次启动时每个窗格都回到它最后所在的文件夹；新打开的窗格从设置指定的文件夹开始。启动时焦点在 shell 上；选中文本
  即复制，右键粘贴。Ctrl+Shift+F 在回滚缓冲区中查找文本，shell 输出的 URL 按 Ctrl+单击（Mac 上为 ⌘+单击）会在
  浏览器中打开。
- **系统监视器** — 带时区的时钟、带电池计量的[系统条](panes-system.zh-CN.md#system)、按核心显示的
  [CPU](panes-system.zh-CN.md#cpu)（曲线图或柱状图）、随时间变化的[内存](panes-system.zh-CN.md#memory)和交换区、带读写活动的
  [磁盘](panes-system.zh-CN.md#disk)、占用最高的进程、网络状态和流量，以及 [GPU](panes-system.zh-CN.md#gpu) 的负载和显存。
  默认布局空闲时约占单核的 13%。
- **文件与应用** — 跟随 shell 的[文件浏览器](panes-system.zh-CN.md#filesystem)（点击即可 `cd` 或插入路径），以及一个
  [启动器](panes-system.zh-CN.md#launcher)，列出开始菜单（包括 Store 等打包应用）、`/Applications` 或 `.desktop` 条目以及
  你自己添加的项，最常用的排在最前。
- **天气、行情与日历** — 任意地点的[天气预报](panes-world.zh-CN.md#weather)（日本用 JMA，美国用 National Weather
  Service，其他地区用 MET Norway）、来自 Yahoo Finance 的[行情看板](panes-world.zh-CN.md#markets)（非官方，可能有延迟，
  不构成投资建议），以及可选显示日本节假日的月[日历](panes-desk.zh-CN.md#calendar)。

## network

*这台机器在和谁通信。*

| | |
| --- | --- |
| 按键 | **Ctrl+Shift+F2** |
| 窗格 | 系统栏；[World view](panes-network.zh-CN.md#world-view) 下方是 [Connections](panes-network.zh-CN.md#connections)（二比一，占舞台的五分之三）；旁边是 [Wi-Fi](panes-network.zh-CN.md#wi-fi) 下方的 [Ethernet](panes-network.zh-CN.md#ethernet)（各占一半） |
| 截图 | White |

<p align="center">
  <img src="../screenshots/elecdex-network.jpg" alt="White 主题下的 network 预设：左侧是系统栏，白色的世界视图地球上有弧线连向各连接的去处，下方是按程序列出套接字的连接窗格——firefox、code、elecdex、thunderbird；右侧是 Wi-Fi 窗格和其下的 Ethernet 窗格，都显示虚构的链路，从电脑到互联网各段都正常，带一分钟的时间线，有线为 1 Gb/s 全双工">
  <br><sub>network · White</sub>
</p>

- **[世界视图](panes-network.zh-CN.md#world-view)与[连接](panes-network.zh-CN.md#connections)** — 一个显示本机连接去向的
  地球，以及一个按持有程序列出每个 TCP 套接字的窗格，两者都用内置的 GeoIP 数据库定位，不做任何在线查询。套接字
  列表位于地球下方。
- **[Wi-Fi](panes-network.zh-CN.md#wi-fi) 与 [Ethernet](panes-network.zh-CN.md#ethernet)** — 上下排列，逐段指出无线和有线
  连接在哪里出了问题。
- 网络状态和流量已在系统栏中，因此这个预设没有 shell。

## earth

*头顶与脚下。*

| | |
| --- | --- |
| 按键 | **Ctrl+Shift+F3** |
| 窗格 | 系统栏；[Orbit](panes-world.zh-CN.md#orbit) 下方是一个 [Terminal](panes-system.zh-CN.md#terminal)；旁边是 [World view](panes-network.zh-CN.md#world-view)、[Quakes](panes-world.zh-CN.md#quakes) 和 [Weather](panes-world.zh-CN.md#weather) |
| 截图 | Tron |

<p align="center">
  <img src="../screenshots/elecdex-earth.jpg" alt="Tron 主题下的 earth 预设：ORBIT 窗格显示世界地图、时区线和九座城市的时钟，ISS 及其星下点轨迹、天宫、以暗淡小点表示的 Starlink 卫星和其中一颗的信息卡；旁边是世界视图、列出日本近期地震的地震窗格和天气；地图下方是一个 shell">
  <br><sub>earth · Tron</sub>
</p>

- **[Orbit](panes-world.zh-CN.md#orbit)** — 任务控制中心的主屏幕：一张带夜半球的世界地图，标出时钟变化的分界线和各时区
  的钟点；ISS 和天宫此刻的位置及其星下点轨迹；它们下一次飞过你所选城市的时间；以及环绕任务控制 GMT 年积日时钟的
  世界各地时钟。可按需显示 Starlink 星座。轨道根数来自 CelesTrak。
- **[地震与海啸](panes-world.zh-CN.md#earthquake-and-tsunami-alerts)** — 针对日本（JMA）或全球（USGS 和 NOAA）：按你
  选择的震度或震级发出警报（默认关闭）；海啸警报在生效期间始终可见；[地震窗格](panes-world.zh-CN.md#quakes)列出近期
  地震，并在地球上标出震中。警报会注明来源，且不是地震预警；遇到海啸时请听从当地政府的指示。
- 这个预设既不开启 Starlink，也不开启地震警报：两者都由你自己决定。

## dev

*工作中的 AI 代理、它们运行的容器，以及它们修改的仓库。*

| | |
| --- | --- |
| 按键 | **Ctrl+Shift+F4** |
| 窗格 | 系统栏；[AI Agent](panes-dev.zh-CN.md#ai-agent)，其下是 [Docker](panes-dev.zh-CN.md#docker)（后面有一个 shell 标签页），再下是 [Clipboard](panes-desk.zh-CN.md#clipboard)（后面有 [Timer](panes-desk.zh-CN.md#timer) 和一个 shell）；右侧是全高的 [Git](panes-dev.zh-CN.md#git)（后面有 [AI chat](panes-ai.zh-CN.md#ai-chat) 和 [Log Watch](panes-dev.zh-CN.md#log-watch)） |
| 截图 | Phosphor |

<p align="center">
  <a href="https://youtu.be/YLxHhQ7wAyE">
    <img src="../screenshots/elecdex-dev.jpg" alt="Phosphor 主题下的 dev 预设：AI AGENT 窗格显示两个 Claude Code 会话，其中一个正忙，有子代理在工作、其下挂着它自己启动的子代理、测试在后台运行，并列出它修改的文件；下面是 DOCKER 窗格，按 Compose 项目（ledger 和 shop）列出虚构的容器及其健康状态、端口和占用；其后是一个 shell 标签页；再下面是虚构复制内容的剪贴板历史，其后是计时器和 shell 的标签页；右侧的 GIT 窗格打开同一个检出，显示 passes.ts 的 diff，以及提交图和鼠标悬停处某个提交的卡片，其后是 AI 聊天和 LOG WATCH 标签页">
  </a>
  <br><sub>dev · Phosphor</sub>
  <br>
  ▶ <a href="https://youtu.be/YLxHhQ7wAyE">dev 布局使用演示视频</a>（1 分钟，英文字幕）
</p>

- **[AI Agent](panes-dev.zh-CN.md#ai-agent)** *（实验性）* — 你电脑上正在工作的 Claude Code 会话：每个会话此刻在做
  什么、上下文里装了多少、它的子代理和后台任务，以及它改动的每个文件的 diff——都读取自本机上 Claude Code 自己的
  记录。
- **[Git](panes-dev.zh-CN.md#git)** — 你选择的仓库：改动的文件、每个文件带语法高亮的 diff，以及带分支和标签的提交图，
  随改动实时更新——可以在旁边的窗格里看着 AI 代理干活。可以 FETCH、仅快进的 PULL，以及从不强制的 PUSH。每个仓库
  一个窗格。diff 需要高度，因此它占满全高。
- **[Docker](panes-dev.zh-CN.md#docker)** — 你电脑上 Docker 引擎的容器，按 Compose 项目分组：运行与否、健康与否、公开
  的端口（点击在浏览器中打开）以及各自的资源占用；在行上即可启动、停止、重启和暂停。
- **[Log Watch](panes-dev.zh-CN.md#log-watch)** — 跟随不断增长的日志文件：按级别着色、折叠堆栈跟踪、合并重复行、为
  首次出现的模式标记 NEW、错误激增时点亮指示灯，并可用 **EXPLAIN** 让 AI 设置中的模型解释所选的行。
- 其余的以标签页放在手边：Docker 后面是一个 shell，底部是[剪贴板历史](panes-desk.zh-CN.md#clipboard)、
  [计时器](panes-desk.zh-CN.md#timer)和另一个 shell，GIT 后面是 [AI 聊天](panes-ai.zh-CN.md#ai-chat)和 Log Watch。
- 放在前面的是只在可见时读取的窗格（Docker 引擎和剪贴板），因此新建的 dev 布局一打开就能看到它们在工作。

## media

*看视频、刷信息流、看见声音。*

| | |
| --- | --- |
| 按键 | **Ctrl+Shift+F5** |
| 窗格 | 系统栏；YouTube (TV)，其下一行是 [Now playing](panes-media.zh-CN.md#now-playing)、[Spectrum](panes-media.zh-CN.md#spectrum) 和 [Mixer](panes-media.zh-CN.md#mixer)；侧边是 X 和 [RSS](panes-world.zh-CN.md#rss) 的标签页，X 在前 |
| 截图 | White |

<p align="center">
  <img src="../screenshots/elecdex-media.jpg" alt="White 主题下的 media 预设：YouTube (TV) 窗格和 X 窗格，各自显示为截图制作的替身页面——仿电视视频首页和社交时间线的样式，频道、账号和图片均为虚构——X 后面还有一个 RSS 标签页；电视下方是正在播放窗格（虚构的曲目和为它画的封面）、荧光青色的 16 段频谱，以及带主音量、Music Player 和 Web Browser 通道的混音器">
  <br><sub>media · White — 网页窗格显示的是为截图制作的替身页面</sub>
</p>

- **[网页窗格](panes-media.zh-CN.md#browser-youtube-and-x)** — 浏览器、YouTube 和 X，需要时再添加为窗格，按主题配色绘制（也可
  通过设置保留网站自己的配色），每个网站共用一处登录。
- **[频谱](panes-media.zh-CN.md#spectrum)与[混音器](panes-media.zh-CN.md#mixer)** — 一个显示电脑正在播放的声音的频谱分析仪，
  画成 1990 年代汽车音响显示屏的样子（荧光青、荧光琥珀、LED 或主题色），以及一个调节系统音量和各个发声应用的
  混音器。
- **[正在播放](panes-media.zh-CN.md#now-playing)** — 播放器正在播放的内容，与 Windows 自带的媒体浮层所知的一致：封面、
  标题、艺术家和专辑、播放到哪里，以及上一首、播放／暂停和下一首。**仅支持 Windows，暂不支持 macOS 和 Linux。**
- **[RSS](panes-world.zh-CN.md#rss)** — 你所列 RSS 和 Atom 订阅源的标题，最新的在前。

## desk

*写字、计算和掌握时间。*

| | |
| --- | --- |
| 按键 | **Ctrl+Shift+F6** |
| 窗格 | 系统栏；三栏：[Notes](panes-desk.zh-CN.md#notes) 下方是 [Timer](panes-desk.zh-CN.md#timer) 和 [Calculator](panes-desk.zh-CN.md#calculator)；[Tasks](panes-desk.zh-CN.md#tasks) 下方是 [Clipboard](panes-desk.zh-CN.md#clipboard)；[Calendar](panes-desk.zh-CN.md#calendar) 下方是 [Utility](panes-desk.zh-CN.md#utility)，旁边的标签页是 ELEC-16 SCI。没有 shell |
| 截图 | Black |

<p align="center">
  <img src="../screenshots/elecdex-desk.jpg" alt="Black 主题下的 desk 预设：记事窗格里是一份发布检查清单，下面是计时器和计算器；任务窗格把截止时间画成仪表，下面是虚构复制内容的剪贴板历史；三个月的日历，下面是切到实用工具窗格标签页前面的函数计算器 ELEC-16 SCI，以精确形式 (1+√2)/2 回答 sin(45)+1/2">
  <br><sub>desk · Black</sub>
</p>

- **桌面窗格** — 一个直接输入的[计算器](panes-desk.zh-CN.md#calculator)（全角数字和 3百万 这样的写法按原样识别，带纸带
  记录，还能对粘贴进来的一列数字做统计）；会自动保存的纯文本[记事](panes-desk.zh-CN.md#notes)；截止时间画成仪表、无论
  窗格是否打开都会提醒的[任务](panes-desk.zh-CN.md#tasks)；以及一个[计时器](panes-desk.zh-CN.md#timer)：秒表的分段像频谱一样
  堆叠，倒计时在旁边同时运行，还有围绕一天作息的闹钟。任务下方是[剪贴板历史](panes-desk.zh-CN.md#clipboard)：列出它显示
  在屏幕上时你复制的内容，点一下即可放回剪贴板；日历下方是[实用工具窗格](panes-desk.zh-CN.md#utility)（阻止休眠、
  二维码、编码与哈希），它的标签页后面是函数计算器 [ELEC-16 SCI](panes-retro.zh-CN.md#elec-16)。
- 剪贴板窗格只在可见时读取剪贴板，所以放在屏幕上而不是标签页里。实用工具窗格在日历下方，二维码能得到正方形的空间，
  AWAKE 的保持状态也一直在视线内。

## ai

*两段对话、一个评议会，以及运行它们的 GPU。*

| | |
| --- | --- |
| 按键 | **Ctrl+Shift+F7** |
| 窗格 | 系统栏；上下两个 [AI chat](panes-ai.zh-CN.md#ai-chat)；右侧空间最大的一栏是 [ELEC system](panes-ai.zh-CN.md#elec-system)，其下是 [GPU](panes-system.zh-CN.md#gpu) |
| 截图 | Business (Dark) |

<p align="center">
  <img src="../screenshots/elecdex-ai.jpg" alt="Business (Dark) 主题下的 ai 预设（所有回答都来自为截图准备的替身）：上下排列的两个 AI 聊天窗格。上面的连接 Ollama，关于在 Node.js 中监视文件夹的提问得到了带代码块的回答，第二个回答正在到达，其标题显示 RX 以及到目前为止的秒数和字符数；下面的连接 LM Studio，回答 git pull --ff-only 会拒绝做什么。右侧是 ELEC system 窗格：LOGOS 和 PATHOS 以绿色亮起并显示 APPROVE，投了 REJECT 的 ETHOS 被多数否决，决议条显示 APPROVED 2-1-0-0；其下是 GPU 窗格：一个虚构适配器最近一分钟的负载和显存曲线、各引擎的负载，以及显存和共享内存的柱">
  <br><sub>ai · Business (Dark) — 回答来自为截图准备的替身</sub>
</p>

- **[AI 聊天](panes-ai.zh-CN.md#ai-chat)** — 与你自己运行的语言模型对话（Ollama、LM Studio、llama.cpp——任何支持 OpenAI
  chat API 的服务），或与你持有 API 密钥的服务对话（Anthropic、OpenAI、Gemini、OpenRouter）。回答以流式到达，推理
  过程默认折叠；密钥由操作系统加密，永远不会传到页面；对话保存在你的电脑上。提问时可以附上文本文件、图片和 PDF：
  用 **+** 选择、拖放到窗格上，或粘贴图片。图片在发送前会被缩小并重新绘制，所以相机写入文件的信息（例如拍摄地点）
  不会被发送出去。
- **[GPU](panes-system.zh-CN.md#gpu)** — 评议会下方，显示 GPU 的负载和它自身显存的占用：在本机运行的模型所依赖的东西。
- 两种 AI 窗格都只在你发送时才询问提供方，所以在那之前这个预设不产生任何开销。

<p align="center">
  <img src="../screenshots/elecdex-elec.jpg" alt="Tron 主题，ELEC system 窗格占满中间一栏：三块大小相同的面板呈三角形围绕一个六边形核心，LOGOS 和 PATHOS 以绿色亮起并显示 APPROVE，投了 REJECT 而被多数否决的 ETHOS 以暗红色退后，决议条显示 APPROVED 2-1-0-0，下方是三份陈述">
  <br><sub>ELEC system · Tron</sub>
</p>

- **[ELEC system](panes-ai.zh-CN.md#elec-system)** — 把一个是非题形式的议案交给由三个模型组成的评议会：LOGOS（逻辑）、
  ETHOS（伦理）和 PATHOS（情感）各自从自己的立场评判，投票 APPROVE、REJECT 或 ABSTAIN，窗格按多数决或全体一致作出
  决议。席位使用 AI 聊天的提供方——三个席位都用同一个模型也可以。

## cockpit

*整台机器放进一个面板，再加上 shell 和两条链路。*

| | |
| --- | --- |
| 按键 | **Ctrl+Shift+F8** |
| 窗格 | 没有系统栏：[Cluster](panes-system.zh-CN.md#cluster) 在系统栏的位置，下方是一个 [Terminal](panes-system.zh-CN.md#terminal)；旁边是 [Wi-Fi](panes-network.zh-CN.md#wi-fi) 下方的 [Ethernet](panes-network.zh-CN.md#ethernet) |
| 截图 | Black |

<p align="center">
  <img src="../screenshots/elecdex-cockpit.jpg" alt="Black 主题（浅色底、近黑文字和扫描线）下的 cockpit 预设：左上方以 CLUSTER 面板取代系统栏——一排警示灯和 ALL SYSTEMS NOMINAL，日期上方的时钟，旁边两排各五个数值：内存、显存、交换区、最满的磁盘、连接对象数、最忙的程序、电源、运行时间、链路累计流量和地址，其下一行是操作系统、制造商、型号、机箱、CPU、虚构的 GPU 和 AWAKE；再下面是 CPU 最近一分钟的折线、十六个核心各一根柱，以及内存、GPU、磁盘 I/O、网络下行与上行和 PING 的折线及其峰值与平均值；其下是一个 shell；右侧上方是 Wi-Fi 面板，下方是 Ethernet 面板，都是虚构的链路">
  <br><sub>cockpit · Black</sub>
</p>

- **[仪表盘](panes-system.zh-CN.md#cluster)** — 像汽车的仪表盘一样，把整台机器放进一个面板：警示灯和用文字说明的最严重
  问题、时钟与日期、CPU・内存・GPU・磁盘 I/O・网络・PING 的最近一分钟、有空间时每个核心的负载，以及其余数值一目
  了然。它会按大小重新排布，从全屏到窄窄的一列都可以。
- cockpit 是唯一一个有窗格却没有系统栏的预设：Cluster 窗格承担了系统栏的职责，而且做得更多。在 1600x900 下，它也
  足够大，可以按最宽的方式排布并显示每个核心。
- 截图中的 [Wi-Fi](panes-network.zh-CN.md#wi-fi) 和 [Ethernet](panes-network.zh-CN.md#ethernet) 都是虚构的链路。

## retro

*elecdex 自己的两台机器，以及声音。*

| | |
| --- | --- |
| 按键 | **Ctrl+Shift+F9** |
| 窗格 | 系统栏；把 [ELEC-16](panes-retro.zh-CN.md#elec-16)、ELEC-16 SCI 和 [CHIP-8](panes-retro.zh-CN.md#chip-8) 作为标签页的一个窗格（ELEC-16 在前）；其下是 16 段的 [Spectrum](panes-media.zh-CN.md#spectrum) |
| 截图 | Tron（前面是 ELEC-16 SCI） |

标签页后面的机器在看不见时会暂停。

<p align="center">
  <img src="../screenshots/elecdex-retro.jpg" alt="Tron 主题的 retro 预设：左侧是系统栏；右侧是一个把 ELEC-16、它的函数计算器 ELEC-16 SCI 和 CHIP-8 作为标签页的窗格，前面是函数计算器的 SLATE 机身，液晶以精确形式 (1+√2)/2 回答 sin(45)+1/2，下面是函数键和数字键，旁边是面板的 CORE，显示寄存器和正在运行的 ROM 代码；下方是 16 段的频谱">
  <br><sub>retro · Tron · 前面是 ELEC-16 SCI</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-chip8.jpg" alt="Amber 主题，CHIP-8 窗格占满中间一栏：T8NKS 的标题画面（两辆相对的坦克，用琥珀色的四级深浅绘制），旁边是键盘、寄存器以及程序计数器前后的代码">
  <br><sub>CHIP-8 · Amber</sub>
</p>

- **[CHIP-8](panes-retro.zh-CN.md#chip-8)** — 用 elecdex 自己的虚拟机运行 CHIP-8、SUPER-CHIP 和 XO-CHIP 程序：
  chip8Archive 的 104 个游戏、视觉小说和小玩具（每个都带屏幕预览）、你自己的程序文件、存档，以及屏幕旁的寄存器、
  内存和代码。

<p align="center">
  <img src="../screenshots/elecdex-elec16.jpg" alt="中间一栏是 CLASSIC 外观的 ELEC-16 窗格：铭牌上写着 ELEC-16 和 16-BIT POCKET COMPUTER 的黑色袖珍电脑，灰绿色液晶上画着正弦波，键盘上有红色的 BRK 键，旁边的 CORE 显示寄存器和代码">
  <br><sub>ELEC-16 · CLASSIC 外观</sub>
</p>

<table>
  <tr>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-alloy.jpg" alt="ALLOY：拉丝金属、压印的铭牌文字、一条琥珀色细线、下沉的黑色键盘底板上的黑色按键"><br><sub>ALLOY</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-graphite.jpg" alt="GRAPHITE：石墨色磨砂机身、浅色字母键、近白色数字键区、深色功能键和红色 BRK"><br><sub>GRAPHITE</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-neo.jpg" alt="NEO：冷调浅灰机身、嵌在各自开孔中的低键程按键、纸一样的屏幕、钴蓝色 ENTER"><br><sub>NEO</sub></td>
  </tr>
  <tr>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-mochi.jpg" alt="MOCHI：樱花粉加白色波点，薄荷、奶油、柠檬、薰衣草色的糖釉按键，梅子色屏幕"><br><sub>MOCHI</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-glass.jpg" alt="深色主题下的 GLASS：边缘发光的深色玻璃机身、内部可见的电路板、玻璃按键"><br><sub>GLASS</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-glass-light.jpg" alt="浅色主题下的 GLASS：同样的玻璃变得明亮，ENTER 为强调色的蓝"><br><sub>GLASS · 浅色主题</sub></td>
  </tr>
</table>

<p align="center">
  <img src="../screenshots/elecdex-play-air.jpg" alt="Phosphor 主题，变成石墨色横向机身 PLAY-320 的 ELEC-16 窗格：屏幕上是 ELECAIRCOMBAT 的驾驶舱，导引头圆圈中带红色锁定框和 ENGAGE 的王牌 GANNET，导弹在它身上爆炸，下方是雷达、分数和损伤仪表，LCK 灯亮着；旁边的 CORE 显示正在运行的 E16 的寄存器和程序计数器处的代码">
  <br><sub>ELEC-16 PLAY（PLAY-320）· ELECAIRCOMBAT · Phosphor · 旁边是 CORE</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-play.jpg" alt="Business (Dark) 主题，变成珊瑚色纵向机身 PLAY-320 的 ELEC-16 窗格：彩色屏幕上是 ELECLANCE，自机在小型敌机之间笔直向上发射 LANCE，左右面板显示分数、CHAIN、SHIP、BOMB 和 VOLT，旁边的 GAMES 中有卡槽里的 ELECLANCE、三款游戏的游戏架和 DEVELOP">
  <br><sub>ELEC-16 PLAY（PLAY-320）· ELECLANCE · Business (Dark)</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-play-drill.jpg" alt="Business (Light) 主题，只显示屏幕的 PLAY-320 的 ELEC-16 窗格：ELECDRILL 的红、黄、绿、蓝方块竖井，34 m 处的钻探者，他上方亮起的 3 CHAIN，两侧是深度计、AIR 气罐、DRILLERS 和 CHAIN；旁边的 MEM 以十六进制显示 E16 的内存">
  <br><sub>ELEC-16 PLAY（PLAY-320）· ELECDRILL · Business (Light) · 只显示屏幕，旁边是 MEM</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-play-fighter.jpg" alt="Tron 主题，只显示屏幕的 PLAY-320 的 ELEC-16 窗格：ELECFIGHTER 的第一场对战，GRID 舞台上，蓝色线框加平涂的 S4 OUTBOX 一拳带着火花打中红色的 S2 RUSH，背后是天际线和透视的地面，上方是体力条和 TIME；旁边的 GAMES 卡槽里插着 ELECFIGHTER">
  <br><sub>ELEC-16 PLAY（PLAY-320）· ELECFIGHTER · Tron · 只显示屏幕，旁边是 GAMES</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-sci.jpg" alt="Business (Light) 主题，变成 SCI-128 计算器的 ELEC-16 窗格，竖长的粉笔白机身：在 2D 显示中输入 sin(45)+1/2，分数像教科书一样排版，下方以精确形式 (1+√2)/2 给出答案；按键上有橙色的 SHIFT 面和 ALPHA 字母，深色的方向键，红色的 DEL 和 AC，蓝色的 =；旁边的 CORE 显示 E16 的寄存器和代码">
  <br><sub>ELEC-16 SCI（SCI-128）· CHALK · Business (Light)</sub>
</p>

- **[ELEC-16](panes-retro.zh-CN.md#elec-16)** — elecdex 自行设计的 16 位袖珍电脑：自己的 RISC CPU、ROM 中的 BASIC 和机器码
  监视器、液晶和键盘、存储卡、把 TypeScript 编译成它的机器码的 CODE 画面，以及与 AI 对话的 LINK。变成 **PLAY-320**
  后，它是一台带卡带、精灵和 16 个声道的游戏机，附带纵版射击游戏 ELECLANCE、空战游戏 ELECAIRCOMBAT、方块解谜
  ELECDRILL、一对一格斗游戏 ELECFIGHTER 四款游戏和制作游戏的工具包。选作 **ELEC-16 SCI**（也是 retro 和 desk 中的
  标签页）时，它是一台函数计算器：算式像教科书一样排版，答案保留分数和根号，并有统计、进制、函数表、方程、复数、
  矩阵和程序模式，以及物理常数、单位换算、Σ、微分和积分。
- retro 和 desk 中的 ELEC-16 SCI 标签页与选择器中的 *elec-16 sci* 行一样，从一台新的 SCI-128 机器开始，不会为了做
  计算器而清掉任何人的 BASIC 程序；它的面板是折叠的，好让机身有足够的空间。

## blank

*什么都还没有，由你来搭。*

| | |
| --- | --- |
| 按键 | **Ctrl+Shift+F10** |
| 窗格 | 无 |
| 截图 | Amber，为第一个窗格打开了选择器 |
| 状态 | 于 v0.0.44 发布 |

<p align="center">
  <img src="../screenshots/elecdex-blank.jpg" alt="Amber 主题下的 blank 预设：没有任何窗格的工作区上打开了添加窗格的选择器，列出每个小部件及其说明，顶部是放置方式（右侧、下方、新标签页、弹出）">
  <br><sub>blank · Amber · 为第一个窗格打开的选择器</sub>
</p>

- **blank** — 一个窗格也没有的布局：*no panes in this layout* 下方的 **+ add pane**（或
  Ctrl+Shift+A）会打开选择器，选中的第一个窗格铺满整个屏幕；之后再拆分、加标签页、拖动窗格。任何布局关闭最后一个
  窗格后，也会像这样变空。
- 在空布局中，无论选择器选的是哪种放置方式，第一个窗格都会铺满屏幕；拆分和新标签页的按键（Ctrl+Shift+E、
  Ctrl+Shift+O、Ctrl+Shift+T）会放入一个 shell 作为第一个窗格。
- 之后如何排布窗格：见[工作区](workspace.zh-CN.md)。
