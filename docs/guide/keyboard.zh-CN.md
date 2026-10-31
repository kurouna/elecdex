[English](keyboard.md) | [日本語](keyboard.ja.md) | 简体中文

# 键盘与布局 — elecdex

elecdex 是面向 Windows、macOS 和 Linux 的科幻风格终端模拟器兼系统监视器，是对 eDEX-UI 的重写。本页按用途列出所有键盘快捷键，附上默认按键和它在 `settings.json` 中的 id，并说明如何重新绑定快捷键、冲突和全局显示/隐藏快捷键如何工作，以及如何用鼠标组织工作区：移动窗格、放大窗格、已保存布局、预设、标签组和弹出窗格。macOS 和 Linux 只经过自动化测试的构建和运行，尚未经过充分的人工验证。

## 本页内容

- [按用途分类的快捷键](#按用途分类的快捷键)
- [其他键盘布局上的按键](#其他键盘布局上的按键)
- [快捷键与 shell](#快捷键与-shell)
- [重新绑定快捷键](#重新绑定快捷键)
- [冲突](#冲突)
- [全局快捷键](#全局快捷键)
- [在后台运行](#在后台运行)
- [状态栏与窗口角落](#状态栏与窗口角落)
- [移动窗格](#移动窗格)
- [放大窗格](#放大窗格)
- [已保存布局](#已保存布局)
- [预设](#预设)
- [标签组](#标签组)
- [弹出](#弹出)

## 按用途分类的快捷键

下面列出的都是默认按键。除分隔条按键和 Escape 外，都可以在 *Settings → Keyboard* 中重新绑定（见[重新绑定快捷键](#重新绑定快捷键)）。*Action* 列是设置列表和操作面板中显示的名称，*id* 是 `settings.json` 中 `keybindings` 使用的键。在 macOS 上，组合中的 Ctrl 也匹配 Cmd。

在当前状态下不起作用的快捷键（见下面的 *生效条件*）不会占用按键：按键会继续传给当前窗格。例如左右没有相邻窗格时，Ctrl+Shift+← / → 仍会传给 shell，PSReadLine 用它按词选择。

### 窗格

| 按键 | Action | id | 操作 |
| --- | --- | --- | --- |
| Ctrl+Shift+A | Add a pane | `pane.add` | 打开添加窗格的选择器：任意组件，放在当前窗格右侧、下方或作为其旁边的标签页（或弹出） |
| Ctrl+Shift+E | Split right | `pane.splitRight` | 把当前窗格（若是标签页：整个标签组）向右分屏 |
| Ctrl+Shift+O | Split down | `pane.splitDown` | 把当前窗格（若是标签页：整个标签组）向下分屏 |
| Ctrl+Shift+T | New tab | `pane.newTab` | 在当前窗格旁新建标签页 |
| Ctrl+Shift+W | Close pane | `pane.close` | 关闭当前窗格（或点击悬停时出现的 × 按钮）；有窗格被放大时，关闭该窗格 |
| Ctrl+Shift+Z | Bring the pane forward | `pane.zoom` | 把当前窗格放大到工作区之上，再次按下恢复原位（Escape 也可以）。只对能放大的窗格生效 |

### 焦点与标签页

| 按键 | Action | id | 生效条件 |
| --- | --- | --- | --- |
| Ctrl+Shift+] | Focus next pane | `focus.next` | 始终 |
| Ctrl+Shift+[ | Focus previous pane | `focus.previous` | 始终 |
| Ctrl+Shift+← | Focus the pane to the left | `focus.left` | 该方向有窗格（相邻且至少共享该边的一部分；取最近的，多个相接时取共享最长的），且键盘不在文本框中 |
| Ctrl+Shift+→ | Focus the pane to the right | `focus.right` | 同上 |
| Ctrl+Shift+↑ | Focus the pane above | `focus.up` | 同上 |
| Ctrl+Shift+↓ | Focus the pane below | `focus.down` | 同上 |
| Ctrl+Tab | Next tab | `tab.next` | 当前窗格在标签组中（例如 shell 的标签页）。v0.0.48 及以前为 Ctrl+Shift+→，现在在文本框中也有效 |
| Ctrl+Shift+Tab | Previous tab | `tab.previous` | 同上。v0.0.48 及以前为 Ctrl+Shift+← |
| Ctrl+Alt+Shift+→ | Next shell pane | `shell.next` | 在 shell 中，且有另一个 shell 窗格（或 shell 标签组）可去 |
| Ctrl+Alt+Shift+← | Previous shell pane | `shell.previous` | 同上 |

### 布局与预设

| 按键 | Action | id | 操作 |
| --- | --- | --- | --- |
| Ctrl+Shift+G | Saved layouts | `layout.saved` | 打开布局对话框：给当前排布命名保存，或回到某个布局 |
| Ctrl+Shift+1 … 9、0 | Apply the 1st … 10th saved layout | `layout.saved1` … `layout.saved10` | 应用前十个已保存布局，顺序与对话框中的列表一致（0 为第十个）。对应位置为空时，按键交给当前窗格 |
| Ctrl+Shift+F1 … F10 | Go to the standard … blank preset | `layout.preset.standard` … `layout.preset.blank` | 切换到预设：F1 standard、F2 network、F3 earth、F4 dev、F5 media、F6 desk、F7 ai、F8 cockpit、F9 retro、F10 blank |
| Ctrl+Shift+Backspace | Reset layout | `layout.reset` | 重置为默认布局（有 shell 打开时，与切换布局一样先询问） |

预设的按键绑定在预设的 id 上，而不是它的位置上，所以你改过的按键始终对应同一个预设。

### Shell

| 按键 | Action | id | 操作 |
| --- | --- | --- | --- |
| Ctrl+Shift+S | Focus the shell | `shell.focus` | 聚焦到所选标签页中的 shell（若没有 shell 窗格则添加一个） |
| Ctrl+Shift+F | Search the shell | `shell.find` | 在 shell 的回滚缓冲区中查找（Enter / Shift+Enter 下一个和上一个，Escape 关闭）。有可搜索的 shell 时生效 |
| Ctrl+Shift+K | Clear the shell's scrollback | `shell.clear` | 清除当前 shell 的回滚缓冲区，无法撤销。只能在 shell 中使用 |
| Ctrl+Shift+= | Larger type in the shells | `shell.fontBigger` | 放大所有 shell 的字号。有 shell 打开时生效 |
| Ctrl+Shift+- | Smaller type in the shells | `shell.fontSmaller` | 缩小所有 shell 的字号 |

字号保存在 `settings.json` 的 `terminal.fontSize` 中：默认 13 px，范围 8 到 32。

### 查找与打开

| 按键 | Action | id | 操作 |
| --- | --- | --- | --- |
| Ctrl+Shift+P | Find an action | `palette.open` | 操作面板：输入文字查找并执行所有快捷键操作、已保存布局、预设、主题、窗格和设置分区，并显示各自的按键；无法撤销的操作需按两次 Enter |
| Ctrl+Shift+L | Search the launcher | `launcher.focus` | 搜索启动器（若布局中没有，则在工作区上方弹出一个） |
| Ctrl+Shift+U | Open the utility pane | `utility.focus` | 实用工具窗格（有多个时每按一次切换到下一个）；布局中没有时弹出，再按一次关闭 |
| Ctrl+Shift+. | Open settings | `settings.open` | 设置对话框 |

在操作面板中，↑ ↓ 选择，Tab 和 Shift+Tab 切换行的种类，PageUp 和 PageDown 每次移动 8 行，Enter 执行，Escape 关闭。当前无法执行的行仍留在列表中，变暗并注明原因（例如 *not in a tab group*）。设计见 [docs/palette.md](../palette.md)（日文）。

在 Linux 上，IBus 可能占用 Ctrl+Shift+U 用于按编码输入字符，按键可能在 elecdex 收到之前就被拿走：此时请改绑 *Open the utility pane*。

### 窗口与应用

| 按键 | Action | id | 平台 |
| --- | --- | --- | --- |
| F11 | Toggle fullscreen | `window.fullscreen` | 全部 |
| Ctrl+Shift+M | Minimize window | `window.minimize` | Windows、Linux（macOS 不会最小化全屏窗口） |
| Ctrl+Shift+Q | Quit | `app.quit` | 全部。即使关闭窗口只会把 elecdex 隐藏到通知区域，此键也会退出。先以 yes / no 确认，键盘焦点在 no 上（Enter 和 Escape 不会退出） |
| Ctrl+Alt+Shift+E | Show or hide elecdex | `window.toggle` | 在任何应用中都有效。默认关闭，需在 *Settings → Window* 中开启；Wayland 会话中不可用 |

### 不能重新绑定的按键

| 按键 | 位置 | 操作 |
| --- | --- | --- |
| 分隔条上的方向键 | 两个窗格之间 | 调整大小（按住 Shift 步长更大） |
| 双击分隔条 | 两个窗格之间 | 让两侧的两个窗格平分空间 |
| Escape | 被放大的窗格 | 放回原位 |
| Escape | 对话框、操作面板、弹出窗格、拖动中 | 关闭或取消 |

## 其他键盘布局上的按键

快捷键按物理按键保存（`KeyboardEvent.code`，例如 `Ctrl+Shift+KeyA`），因此在任何键盘布局上都是同一位置的键。本页按美式键盘的字符书写按键。日文键盘上 Ctrl+Shift+= 即 Ctrl+Shift+^，Ctrl+Shift+[ / ] 即 Ctrl+Shift+@ / [。应用内的列表和提示会按你的键盘显示。

## 快捷键与 shell

- elecdex 启动时焦点在 shell 上。
- 在 shell 中，选中文本即复制，右键粘贴，与 PuTTY 或 Windows Terminal 相同；Ctrl+C 仍是 shell 的中断键。
- 搜索栏跳到的匹配项不会被复制——只有你自己选中的内容才会。
- 快捷键会在当前 shell 收到按键之前被截取。因此每个组合都必须包含 Ctrl 或 Alt（macOS 上为 Cmd），或者是功能键：其他所有按键，无论单独按还是加 Shift，都会传给 shell。
- 对话框打开时，除 *Quit* 和 *Toggle fullscreen* 外，快捷键都不起作用，以免对话框背后在看不见的情况下发生变化。在弹出窗格之上，召唤窗格的快捷键和操作面板的快捷键也有效。
- 网页窗格拥有键盘时，主进程会从页面中取出快捷键并执行；此时不起作用的快捷键留给页面（例如网页用 Ctrl+Shift+= 放大）。

## 重新绑定快捷键

| | |
| --- | --- |
| 位置 | *Settings → Keyboard*（Ctrl+Shift+.） |
| 设置 | `settings.json` 中的 `keybindings`：操作 id → 按键，或 `null` 表示不绑定 |

![Tron 主题下的设置对话框，键盘部分，列出每个快捷键的操作和按键](../screenshots/elecdex-settings.jpg)

1. 打开 *Settings → Keyboard*。
2. 点击某个快捷键的按键，会显示 *press keys…*。
3. 按下新的按键。Escape 取消录制。

- 按键必须包含 Ctrl（macOS 上为 Cmd）、Alt 或功能键（F1 到 F24）。其他按键会被拒绝，并提示 *use Ctrl, Alt or a function key - the shell needs the rest*。
- *clear* 移除一个快捷键（显示为 *none*）；*default* 把单个快捷键恢复为默认；*reset all shortcuts* 恢复列表中的所有默认值，但不会动全局显示/隐藏快捷键。
- 应用中的提示按当前的绑定显示按键，而不是默认按键。
- `settings.json` 中只写入改过的快捷键；与默认相同的按键会被去掉。无法使用的按键，或本版本不认识的操作 id，会被忽略，而不会让整个文件失效。最多保存 64 个覆盖项。

```json
{
  "keybindings": {
    "app.quit": null,
    "utility.focus": "Ctrl+Alt+KeyU"
  }
}
```

## 冲突

- 已被占用的组合会在 *Settings → Keyboard* 中以 *in use by* 加另一个操作的名称标出。
- 两个应用内操作使用相同按键时，列表中靠前的那个拥有它。
- 全局显示/隐藏快捷键是例外。它开启时，操作系统会先把按键交给 elecdex 的窗口快捷键，因此使用相同按键的应用内快捷键会被标出（*taken by the system-wide shortcut*）并失效。它关闭时不占用任何按键，也不参与冲突。

## 全局快捷键

| | |
| --- | --- |
| 位置 | *Settings → Window* 中它的开关旁边；默认 Ctrl+Alt+Shift+E |
| 平台 | Windows、macOS，以及 X11 下的 Linux。Wayland 会话会独占全局快捷键，因此该选项会注明这一点 |
| 设置 | `window.globalShortcut`（默认 `false`）；按键是 `keybindings` 中的 `window.toggle` |

- 它在任何应用中都有效，所以只有在你开启时，主进程才向操作系统注册它。
- 只接受字母、数字和功能键（操作系统按字符命名标点键，其位置随键盘布局变化）。其他按键会被拒绝，并提示 *use a letter, a digit or a function key*。
- 如果其他应用已经占用了这组按键，它会被重新关闭并附上说明。
- *reset all shortcuts* 不会动它；在录制快捷键时它会让出按键，因此它本身也可以被录制。
- elecdex 在前台时按下它会把 elecdex 收起；在其他地方按下则把 elecdex 调到前台。

## 在后台运行

| | |
| --- | --- |
| 位置 | *Settings → Window* |
| 设置 | `window.trayIcon`、`window.minimizeToTray`、`window.closeToTray`、`window.globalShortcut`、`window.startInBackground`：默认都是 `false` |
| 平台 | 各不相同，见下表。elecdex 只提供这台机器实际能做到的 |

*Settings → Window* 中有窗口之外的图标——位于通知区域、菜单栏或托盘——单击它打开 elecdex，右键菜单可以打开设置或退出；以及 *launch elecdex when you sign in*，如果系统把它关掉了，设置里也会显示为已关闭。其余选项取决于机器：

| | Windows | macOS | Linux |
| --- | --- | --- | --- |
| 最小化 / 关闭到图标 | 是 | 否——关闭窗口本来就会让 elecdex 继续运行，可以从 Dock 回来 | 桌面环境有地方放图标时可用 |
| 全局显示/隐藏快捷键 | 是 | 是 | X11 下可用；Wayland 会话会独占这些按键，因此该选项会注明这一点 |
| 登录时启动 | Run 键条目，卸载时删除 | 应用的登录项（macOS 可能要求你允许） | `~/.config/autostart/elecdex.desktop` |
| *start in the background* | 是 | 否——登录项不接受参数 | 是 |

- 每个选项在你开启之前都是关闭的。是否在登录时启动不保存在 `settings.json` 中：由平台保存，你也可以在平台那边关掉它。
- 无论如何，再次启动 elecdex 都会把正在运行的那个调出来，所以窗口永远不会找不回来。
- macOS 和 Linux 两列只经过 CI 的构建和测试，尚未经过充分的人工验证。

## 状态栏与窗口角落

- 把指针移到屏幕底边会出现状态栏。左侧为每个已保存布局提供一个编号按钮（编号就是应用它的按键），另有添加窗格、已保存布局、重置布局、设置、主题、声音和退出按钮。
- 在 Windows 和 Linux 的全屏模式下，把指针移到右上角会降下最小化、退出全屏和关闭按钮；若设置为在通知区域继续运行，关闭会把 elecdex 放到那里，否则询问后退出。

## 移动窗格

- 拖动窗格的标题（没有标题的窗格，比如时钟，就拖它顶部的横线），放到另一个窗格上：它会被放在那个窗格旁边、离指针最近的一侧。
- 放下时按住 Ctrl（macOS 上为 Cmd），则会把它作为标签页加入那个窗格，位置由指针在标签条上的位置决定。在标签页所在的组上按住同样的 Ctrl 则可以调整顺序。
- shell 标签页可以单独拖出，拖动标签组的标题栏会移动整个组。
- Escape 取消拖动。
- 移动后的 shell 保留其会话。

## 放大窗格

| | |
| --- | --- |
| 位置 | Ctrl+Shift+Z，或窗格右上角 × 旁边的 ⤢ 按钮 |
| 设置 | 无；不保存任何东西 |

- 放大的窗格会覆盖窗口的大部分，盖在其他窗格之上，其他窗格则在遮罩后面保持原位。
- 标签组也有同样的角，其 × 会关闭组内所有标签页；标签页自己的 × 只关闭该标签页。标签页会连同其所在的组一起放大，所以组里其他标签页仍可切换。
- 放大后无益的窗格不参与：系统条和网络状态根本没有 ⤢，计算器、计时器、混音器、正在播放、磁盘和进程列表则以面板形式出现在中间，而不是铺满整个窗口。
- 放大期间，窗格外侧会围上一圈边框——比 shell 的切角边框大一号，四角带有括角；边框画在窗格之外，因此窗格仍可使用分给它的全部空间。角上只有 ⤡，Ctrl+Shift+W 可关闭它。
- 按 Escape、再按一次快捷键、点击按钮或点击遮罩即可放回。
- 不会重新排布，也不会保存任何东西：shell 保留其会话，网页窗格保留其页面，应用启动时每个窗格都在原位。

## 已保存布局

![Tron 主题下 standard 布局之上的布局对话框：预设作为已保存布局，可见编号 1 到 9，每个都有其排布的缩略图；下方是预设的架子及其按键 Ctrl+Shift+F1 到 F10](../screenshots/elecdex-layouts.jpg)

| | |
| --- | --- |
| 位置 | Ctrl+Shift+G，或状态栏中的 *layouts*；前十个对应 Ctrl+Shift+1 到 9 和 0，以及状态栏的编号按钮 |
| 文件 | 应用数据文件夹中的 `layouts.json`（已保存布局）和 `layout.json`（实时排布）；见[主题与设置](themes-settings.zh-CN.md#布局文件) |
| 设置 | `layout.confirmSwitch`（默认 `true`）：*Settings → General → Layouts* |

- 布局会跟随你的工作：当前所在的布局会被标记，你对工作区做的任何改动都会保存到其中，所以回来时一切都和离开时一样。
- 重置布局不会影响任何已保存布局，之后的排布不属于任何布局，直到你保存它或应用某个布局。
- 在对话框中可以重命名布局，也可以上下移动——它在列表中的位置*就是*它的数字键。最多保存十二个。
- 应用一个布局会替换整个工作区，被替换窗格中的 shell 会结束，就和关闭这些窗格一样；有 shell 打开时会先询问你，询问中也提供了不再询问的方法（*Settings → General → Layouts*）。
- 旧的排布像显像管一样断电，新的排布逐个窗格点亮，和启动时一样——减少动效时则完全没有动画。
- **把 `layouts.json` 复制到另一台电脑，你的排布就跟着过去了。** 它不含任何本机专属信息。对话框中的 *layouts.json* 按钮会在文件管理器中显示它。

## 预设

布局对话框的列表下方有十个预设，每个都画成其窗格的小地图。

| 预设 | 按键 | 窗格 |
| --- | --- | --- |
| **standard** | Ctrl+Shift+F1 | 默认布局 |
| **network** | Ctrl+Shift+F2 | 地球下方是连接，旁边是 Wi-Fi，其下是 Ethernet |
| **earth** | Ctrl+Shift+F3 | ORBIT、地球、地震和天气 |
| **dev** | Ctrl+Shift+F4 | AI AGENT；Docker 和 shell；剪贴板、计时器和 shell；GIT、AI 聊天和 Log Watch（每组都是标签页） |
| **media** | Ctrl+Shift+F5 | YouTube (TV)，下方是正在播放、频谱和混音器，X 和 RSS 作为标签页 |
| **desk** | Ctrl+Shift+F6 | 记事、计时器、计算器、任务、日历、剪贴板和实用工具 |
| **ai** | Ctrl+Shift+F7 | 上下两个 AI 聊天，以及位于 GPU 窗格之上的 ELEC system |
| **cockpit** | Ctrl+Shift+F8 | 以 CLUSTER 面板取代系统栏，下方一个 shell，右侧上方是 Wi-Fi、下方是 Ethernet |
| **retro** | Ctrl+Shift+F9 | ELEC-16 和 CHIP-8 作为一个窗格的标签页，下方是 16 段频谱 |
| **blank** | Ctrl+Shift+F10 | 没有窗格，由你自己添加 |

- 除 cockpit 和 blank 外，每个预设都把系统栏留在左侧，所以切换时换的是舞台，仪表仍在原处。
- 选择一个预设会用它新建一个布局并切换过去——此后它就是你的布局之一，跟随你的工作——再次选择它会回到那个布局，而不会再新建一个；↺ 把它恢复为预设原样。
- 每个预设的按键在任何地方都能做同样的事。
- 全新安装时，这十个预设会占据 Ctrl+Shift+1 到 0；已有的列表不会被追加。

## 标签组

- 标签组可以容纳任何窗格，不只是 shell，因此偶尔用到的窗格可以和 shell 共用一个位置，而不必单独占地方——比如把 RSS 或天气放在 shell 标签页后面。
- 要把窗格放进组里，可以按住 Ctrl 拖到组上（见[移动窗格](#移动窗格)）；或者聚焦组中的某个窗格，打开选择器（Ctrl+Shift+A 或状态栏的添加按钮），在选择组件前先选 **⧉ new tab**。
- 点击标签即可切换；后台标签页中的 shell 会继续运行，切回来时会话和屏幕内容都还在。
- 组不能嵌套：一个标签页只容纳一个窗格。

## 弹出

- 在添加窗格的选择器中选 **▣ pop up**，组件会以只带 × 的框显示在工作区上方，而不放进布局：布局保持不变，也不会保存；按 Escape、点 × 或点框外即可关闭。
- 除 shell、计时器（关闭后倒计时无法响铃）和文件浏览器外，所有内置窗格都可以弹出；网页和插件不行。
- 在弹出窗格中所做的选择，在应用退出前再次弹出时仍会保留。
- 布局中没有启动器时，Ctrl+Shift+L 也会这样打开它，启动器在启动了程序之后自动关闭。Ctrl+Shift+U 也会这样打开实用工具窗格。

另见：[主题与设置](themes-settings.zh-CN.md) · [插件](plugins-use.zh-CN.md) · [开发](develop.zh-CN.md)
