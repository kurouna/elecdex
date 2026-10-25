[English](panes-media.md) | [日本語](panes-media.ja.md) | 简体中文

# 媒体窗格 — elecdex

elecdex 是用 Electron 重写 eDEX-UI 而成的科幻风格终端模拟器兼系统监视器。本页介绍它的媒体窗格：**频谱**（Spectrum，电脑正在播放的声音的频谱分析仪）、网页窗格 **Browser、YouTube 和 X**、**混音器**（Mixer，系统和各个应用的音量）以及 **正在播放**（Now playing，当前的媒体会话，带上一首、播放／暂停和下一首）。说明每个窗格在 Windows、macOS 和 Linux 上读取什么、何时读取，以及绝不读取或发送什么。elecdex 在 Windows 上开发和使用；macOS 和 Linux 只经过 GitHub Actions 上的测试构建和运行，手动验证不足。

<p align="center">
  <img src="../screenshots/elecdex-media.jpg" alt="White 主题下的 media 预设：YouTube (TV) 窗格和 X 窗格，各自显示为截图制作的替身页面（仿电视视频首页和社交时间线，频道、账号和图片均为虚构），X 后面有一个 RSS 标签页；电视下方是显示虚构曲目和为其绘制的封面的 now playing 窗格、荧光青色的 16 频段频谱，以及带有 master、Music Player 和 Web Browser 推子条的混音器">
  <br><sub>media · White — 网页窗格显示的是为截图制作的替身页面</sub>
</p>

## 本页内容

- [media 预设](#media-预设)
- [Spectrum](#spectrum)
- [Browser, YouTube and X](#browser-youtube-and-x)
- [Mixer](#mixer)
- [Now playing](#now-playing)
- [设计文档](#设计文档)

## media 预设

| | |
|---|---|
| 打开方式 | Ctrl+Shift+F5，或 LAYOUTS 对话框 |
| 窗格 | YouTube (TV)，其下一排是正在播放、频谱和混音器；X 和 RSS 作为标签页；左侧是系统栏 |

预设是模板：选择后会添加一个保存的布局，之后随你的工作而变化。这些窗格都不在默认布局中，也都可以从窗格选择器（Ctrl+Shift+A）添加。快捷键可在 *Settings → Keyboard* 中重新绑定。所有预设见 [presets.zh-CN.md](presets.zh-CN.md#media)。

## Spectrum

<p align="center">
  <img src="../screenshots/pane-spectrum.jpg" alt="单独的频谱窗格：荧光青色的分段列和峰值，下方是频段标签">
  <br><sub>频谱</sub>
</p>

| | |
|---|---|
| 打开方式 | media 和 retro 预设；选择器："spectrum"；可以弹出在工作区上方，也可以置于前面 |
| 读取内容 | 系统的声音输出（回环采集），只有电平 |
| 更新 | 只在窗格显示在屏幕上时；有声音时每秒 20 帧，静音时不绘制 |
| 平台 | Windows：已测试。macOS：同样的屏幕采集途径，需要屏幕录制权限，未测试。Linux：PulseAudio 或 PipeWire 上的 `parec`（pulseaudio-utils） |
| 隐私 | 采集在一个独立的隐藏窗口中进行，只有电平数据会传到窗格；不录制任何东西 |
| 设置 | 窗格中的设置按钮：样式、频段数、图案、峰值保持 |

### 使用方法

- 从选择器添加。它以 7、10、16 或 31 个频段显示系统的声音输出，每个频段是一列分段并带峰值保持，样子像 1990 年代汽车音响的显示屏。
- 设置按钮可以选择：
  - 样式：VFD 青色（默认）、VFD 琥珀色、LED 或主题色；
  - 频段数：7、10、16 或 31；
  - 图案：柱状、镜像或仅显示峰值；
  - 峰值保持。
- VFD 和 LED 画在自己的深色玻璃上，所以在浅色主题下看起来也一样。所有选择都保存在窗格状态中。
- *no sound* 这类简短状态放在设置按钮所在的那一行，不会盖住柱子；较长的原因（无法采集、监视源被静音）显示在显示区上方。

### 声音如何采集

- **Windows 和 macOS**：Chromium 只能通过带回环音频的屏幕采集取得正在播放的声音。elecdex 不把这个权限交给工作区。采集在一个独立的隐藏窗口（`main/audio/capture-window.ts`）中进行：它有自己的仅存于内存的会话（只有这个会话允许屏幕采集）、只能报告帧和状态的 preload，以及没有网络的页面。采集附带的视频轨道会立即停止。
- 隐藏页面把 4096 点 FFT 汇总成 20 Hz 到 20 kHz 之间 60 个对数分布的频点，每秒发送 20 次。静音持续 2.5 秒后停止发送，读取降到每秒 10 次。main 只接受来自该窗口的消息，检查其形式后再转给订阅的窗格。
- 窗格把频点合并为频段。31 个频段是 20 Hz 到 20 kHz 的 ISO 1/3 倍频程。
- **Linux**：Electron 在 Linux 上没有回环采集，因此由 main 运行 `parec --device=@DEFAULT_MONITOR@`，录制默认输出的监视源（绝不录默认输入，也就是麦克风），并按与隐藏页面相同的步骤自行分析。
  - 如果系统设置中监视源的音量被调低，会自动补偿，使柱状显示的就是实际播放的声音。
  - 监视源被静音时，窗格会报告，并显示一个 **unmute monitor** 按钮。只有点击这个按钮才会改变系统设置：main 取消监视源的静音并把音量设为 100%。
  - 缺少 `parec` 或它停止时，窗格会说明原因；重新打开窗格会再试一次。

### 开销与限制

- 窗格在其他标签页后面、被关闭或窗口最小化时不监听，隐藏的采集窗口也随之停止。
- 在 i5-1335U 上实测：播放声音时约占三分之一个核心，显示在屏幕上但静音时约十分之一。
- macOS 的回环采集未经测试。

## Browser, YouTube and X

<p align="center">
  <img src="../screenshots/pane-web.jpg" alt="单独的 Browser、YouTube 和 X 窗格，显示替身页面">
  <br><sub>Browser、YouTube 和 X・替身页面</sub>
</p>

| | |
|---|---|
| 打开方式 | media 预设（YouTube (TV) 和 X）；选择器："browser"、"youtube (tv)"、"x"；每种都可以放多个，也可以置于前面 |
| 读取内容 | 网站本身，由 main 拥有的独立浏览器视图显示 |
| 更新 | 在标签页后面和窗口最小化时页面仍继续运行，视频会继续播放 |
| 平台 | Windows、macOS、Linux（macOS 和 Linux 未经手动验证） |
| 隐私 | 无法访问 elecdex；不能使用摄像头、麦克风、位置或通知；不能下载；只允许 http(s)；所有网页窗格每个网站共用一处登录，与应用的其余部分隔离 |
| 设置 | *Settings → General → tint pages in the theme's colour*（默认关闭）；*Settings → General → sign out of all sites*；每个窗格的 ◐ 按钮 |

### 三种窗格

- **Browser** 带有地址栏，可以打开任何 http(s) 页面。
- **YouTube (TV)** 打开 YouTube 的客厅界面（`youtube.com/tv`），用方向键操作。之所以提供这个 YouTube 窗格，是因为它可以登录：它会显示一个代码，在手机上访问 yt.be/activate 输入即可。Google 拒绝从嵌入式浏览器登录（"this browser or app may not be secure"）。elecdex 使用 Google 为电视提供的设备登录方式，不会把窗格伪装成 Chrome。
- **X** 打开 x.com。
- YouTube (TV) 和 X 停留在各自的网站内。指向其他网站的链接只在你亲自点开时（在窗格中点击或按键后的几秒内，一次按下一个标签页）才交给默认浏览器；页面自己想跳出网站时会被留在原处。
- 以前的 YouTube 窗格（桌面版网站）因为无法登录，不再出现在选择器中；保存的布局如果指名它，仍会照常打开。

### 使用网页窗格

- 每个窗格都有后退、前进、重新加载（网站类窗格还有主页）和 *open in your browser* 按钮。对 YouTube (TV) 的视频使用 *open in your browser*，会交出该视频的观看页面。
- 右键菜单：后退、前进、重新加载、剪切、粘贴（仅输入框）、复制、全选、复制链接、在默认浏览器中打开链接。
- 每个窗格在重启后记住所在页面。记住的页面若在该窗格的网站之外，则打开网站首页。
- 移动窗格或改变其所在的标签组都不会重新加载页面。
- 页面获得键盘焦点时应用快捷键仍然有效，其他按键都交给页面。当时按下也不会有任何作用的快捷键（例如标签组之外的标签切换键）会交给页面。
- 指针位于页面上方时，状态栏和全屏窗口控制按钮不会出现。请使用快捷键，或把指针移到另一个窗格。
- 视频的全屏按钮会铺满 elecdex 的窗口。窗格被隐藏之前，页面会先退出全屏。

### 颜色

- 页面默认以其自身的配色显示。
- 地址栏右侧的 ◐ 按钮会让该窗格的页面改用主题色绘制，所见即所得。
- *Settings → General → tint pages in the theme's colour* 是尚未使用自己按钮的窗格的默认值。Business 主题下从不着色。
- 页面会得知主题的明暗（`prefers-color-scheme`）；没有自行声明颜色的页面会得到相应的默认颜色，所以在深色主题下文字也能读清。

### 页面能做什么、不能做什么

- 页面由一个独立的、沙箱化的浏览器视图（Electron 的 `WebContentsView`）绘制在窗格之上，从不使用 iframe 或 `<webview>`。它没有 preload，无法访问 elecdex；工作区自身的安全设置保持不变。
- 权限只有写入剪贴板（复制链接）和全屏。摄像头、麦克风、位置、通知和其他一切都被拒绝。
- 所有下载都会被取消。只打开 http、https 和 `about:blank`；`file:`、`javascript:` 等即使在地址栏中输入也会被拒绝。
- User-Agent 中去掉了 Electron 和 elecdex 的标记。拼写检查关闭，因此不会下载词典。
- Google 或 Apple 的登录窗口作为同一会话中的子窗口打开，每个窗格最多一个，随窗格关闭。

### 登录与网站数据

- 所有网页窗格共用一个会话（`persist:web`），应用的其他部分不使用它。登录 YouTube 一次，所有 YouTube 窗格以及在 Browser 窗格中打开的 youtube.com 都会处于登录状态。
- 由于会话共用，同一网站的两个账号不能并排使用。
- *Settings → General → sign out of all sites* 会删除这个会话的网站数据。

### 标签页后面与对话框之下

- 网页窗格是"只在可见时读取"规则的例外：页面在其他标签页后面和窗口最小化时都会继续播放。绘制和视频解码也在继续，所以长时间放着的后台标签页仍会占用 CPU 和 GPU。
- 当对话框、通知或正在拖动的窗格位于页面上方时，会用该页面的一张静止画面代替页面。

## Mixer

<p align="center">
  <img src="../screenshots/pane-mixer.jpg" alt="单独的混音器窗格：master 推子条和正在发声的应用的推子条，各有推子、静音按钮和峰值表">
  <br><sub>混音器</sub>
</p>

| | |
|---|---|
| 打开方式 | media 预设；选择器："mixer"；可以弹出在工作区上方，也可以以固定大小置于前面 |
| 读取内容 | 输出设备的音量和静音；在 Windows 和 Linux 上还有每个正在发声的应用 |
| 更新 | 只在窗格显示在屏幕上时。Windows：状态每秒一次，峰值每 0.1 秒一次；macOS 和 Linux：每 2 秒一次 |
| 平台 | Windows：主音量、应用、峰值表。macOS：只有主音量。Linux：主音量和应用 |
| 设置 | 无 |

- 每条推子条有推子和静音按钮，Windows 上还有峰值表。应用按进程名归并，与 Windows 自带的音量合成器相同。
- 读取方式：
  - **Windows**：一个常驻的 PowerShell 运行读取 Core Audio 的循环。窗格不再需要时它就结束。
  - **macOS**：AppleScript，只有主音量。
  - **Linux**：`pactl`（PulseAudio 或 PipeWire；需要 PulseAudio 16 或更高版本的 pactl）读取并更改默认输出设备和各个应用。缺少 pactl 或它太旧、无法输出 JSON 时，主音量改用 WirePlumber 的 `wpctl`。两者都没有时窗格会说明；工具出错时显示其错误的第一行。
- 更改会立即反映在屏幕上，尚未跟上的读取不会把推子拉回原处。
- 在 i5-1335U 上实测：约占一个核心的 5%，其中 PowerShell 占 1.3%。

## Now playing

<p align="center">
  <img src="../screenshots/pane-nowplaying.jpg" alt="单独的正在播放窗格：为虚构曲目绘制的封面旁边是标题、艺术家和专辑，下面是进度条以及上一首、播放／暂停和下一首按钮">
  <br><sub>正在播放</sub>
</p>

| | |
|---|---|
| 打开方式 | media 预设；选择器："now playing"；可以弹出在工作区上方，也可以以固定大小置于前面 |
| 读取内容 | Windows 视为当前的媒体会话（System Media Transport Controls） |
| 更新 | 每秒两次，只在窗格显示在屏幕上时；在其他标签页后面、窗口最小化或收起时什么都不读 |
| 平台 | **仅支持 Windows。** 暂不支持 macOS 和 Linux：窗格会显示 UNSUPPORTED |
| 隐私 | 不写入磁盘或日志；插件无法访问；从不改变音量 |
| 设置 | 无 |

### 显示的内容

- Windows 视为当前的媒体会话：Spotify、正在播放 YouTube 的浏览器、媒体播放器，以及任何把播放内容告诉系统的播放器。没有当前会话时，取第一个正在播放的会话。
- 封面、标题、艺术家、专辑和应用名，以及曲目播放到哪里。播放器只是偶尔报告位置；两次报告之间由窗格每秒往前数，不会超过结尾。没有长度的流不显示进度条。
- 指示灯：PLAYING、PAUSED、NO SESSION、STANDBY 或 UNSUPPORTED。
- elecdex 自己的网页窗格在播放时，应用名显示为 `elecdex`。
- 把指针停在封面上（或用键盘移到封面）会打开一张卡片：放大的封面，完整的标题、艺术家和专辑，播放器的名称和 Windows id、长度、封面的原始尺寸，以及其他播放器的数量。

### 可以按什么

- 上一首、播放／暂停和下一首，各自只在播放器接受时才提供。播放器拒绝时，窗格会在按钮旁说明 3 秒。
- 播放器接受改变播放位置时，进度条带有可拖动的滑块，也可用 ← →（5 秒）和 Home / End。新位置在松开时只发送一次。不接受时，进度条只是一条没有滑块的进度表，不会显得可以拖动。
- 页面只能按这几个按钮和改变位置，从不改变音量（那是混音器的职责），而且只在显示窗格时。
- 播放／暂停没有绑定快捷键；获得焦点的按钮可用空格或 Enter 按下。

### 读取方式

- main 通过一个常驻的 PowerShell 读取会话。第一个窗格显示时启动，最后一个窗格消失 15 秒后关闭，所以移动窗格不会让它重新启动。在 i5-1335U 上实测：约 0.6 秒得到第一个回答，之后每次读取约 1 ms。
- 封面在读取进程中缩小，作为经过检查的 JPEG 交给页面。卡片用的较大封面在卡片打开之前一直放在 main 的内存中。不向磁盘写入任何东西。
- 正在播放不是指标源，也不在插件 API 中。
- macOS：Apple 的媒体接口是非公开的，而且已不再回应未签名的进程，因此没有读取器。Linux（D-Bus 上的 MPRIS）尚未实现。

## 设计文档

以下为日文：

- [architecture.md §5.4 网页窗格](../architecture.md#54-web-ペインブラウザ--youtube--x)
- [architecture.md §5.15 NOW PLAYING](../architecture.md#515-now-playing-ペイン再生中のメディア)
- [decisions.md](../decisions.md)：频谱与混音器（v0.0.4）、用 `parec` 在 Linux 上采集（v0.0.5）、监视源音量，以及实测开销
