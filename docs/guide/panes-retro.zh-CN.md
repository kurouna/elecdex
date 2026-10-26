[English](panes-retro.md) | [日本語](panes-retro.ja.md) | 简体中文

# 复古机器：CHIP-8 与 ELEC-16 — elecdex

elecdex 是用 Electron 重写 eDEX-UI 而成的科幻风格终端模拟器兼系统监视器。本页介绍它的两个模拟器窗格：**CHIP-8** 用为 elecdex 编写的虚拟机运行 CHIP-8、SUPER-CHIP 和 XO-CHIP 程序；**ELEC-16** 是 elecdex 自行设计的 16 位袖珍电脑，CPU、ROM、BASIC 和机器码监视器全部自己编写，还可以变成游戏机 **PLAY-320** 或函数计算器 **ELEC-16 SCI（SCI-128）**。两者都在沙箱中的 2D canvas 上运行，自身不使用网络，不可见时暂停，适用于 Windows、macOS 和 Linux。elecdex 在 Windows 上开发和使用；macOS 和 Linux 只经过 GitHub Actions 上的测试构建和运行，手动验证不足。

<p align="center">
  <img src="../screenshots/elecdex-retro.jpg" alt="Tron 主题下的 retro 预设：左侧是系统栏；右侧一个窗格把 ELEC-16、函数计算器 ELEC-16 SCI 和 CHIP-8 作为标签页，前面是 SLATE 机身的计算器，液晶以精确形式 (1+√2)/2 回答 sin(45)+1/2，下面是两排函数键和数字键，旁边面板的 CORE 显示寄存器和正在运行的 ROM 代码；下方是 16 频段的频谱">
  <br><sub>retro · Tron · 前面是 ELEC-16 SCI</sub>
</p>

## 本页内容

- [retro 预设](#retro-预设)
- [CHIP-8](#chip-8)
- [ELEC-16](#elec-16)
- [PLAY-320](#play-320)
- [ELEC-16 SCI](#elec-16-sci)
- [说明书与指南](#说明书与指南)
- [设计文档](#设计文档)

## retro 预设

| | |
|---|---|
| 打开方式 | Ctrl+Shift+F9，或 LAYOUTS 对话框 |
| 窗格 | 左侧是系统栏；一个窗格把 ELEC-16、ELEC-16 SCI 和 CHIP-8 作为标签页；其下是 16 频段的 [频谱](panes-media.zh-CN.md#spectrum) |

选择预设会添加一个保存的布局，之后随你的工作而变化。desk 预设中 utility 窗格旁也有一个 ELEC-16 SCI 标签页。两台机器都可以从窗格选择器（Ctrl+Shift+A）添加多个，用 Ctrl+Shift+Z 置于前面时画面会放大。两者都不会弹出在工作区上方：每打开一个对话框弹出窗口就会关闭，正在运行的机器会因此停下。快捷键可在 *Settings → Keyboard* 中重新绑定。所有预设见 [presets.zh-CN.md](presets.zh-CN.md#retro)。

## CHIP-8

<p align="center">
  <img src="../screenshots/elecdex-chip8.jpg" alt="Amber 主题下占满中间一列的 CHIP-8 窗格：T8NKS 的标题画面，两辆相对的坦克以四级琥珀色绘制，旁边是键盘、寄存器和程序计数器前后的代码">
  <br><sub>CHIP-8 · Amber</sub>
</p>

| | |
|---|---|
| 打开方式 | retro 预设（标签页）；选择器："chip-8"；可放多个，可置于前面 |
| 读取内容 | 自带的程序库，以及你通过 main 的文件选择器导入的程序文件 |
| 更新 | 只在运行中且窗格可见时运行；不可见时暂停 |
| 平台 | Windows、macOS、Linux（macOS 和 Linux 未经手动验证） |
| 隐私 | 不使用网络；页面从不拿到文件路径 |
| 设置 | *Settings → General → chip-8*：show the core（默认开启）、buzzer volume（默认 50%，界面音效关闭时不发声）；速度和兼容模式在 TUNE 中按程序设置 |

### 虚拟机

- 为 elecdex 用 TypeScript 编写的 CHIP-8、SUPER-CHIP 和 XO-CHIP 虚拟机，画在 2D canvas 上（从不使用 WASM 或 eval）。在三种机型上都通过了 Timendus 的 chip8-test-suite。
- 以 Octo 为基准：每种机型都执行所有指令，机型只决定内存（4 KB，XO-CHIP 为 64 KB）和兼容模式的默认值。遇到任何机型都没有的指令时以 HALT 停止，并显示位置。

### 程序库

- chip8Archive（CC0）的 104 个程序（游戏、视觉小说、节奏游戏、小玩具以及 Octojam 的标题画面，均注明作者），以及测试集的 8 个程序（DIAG）。
- 按种类分的标签页：ACTION、PUZZLE、STORY、MUSIC、TOYS、SHOWCASE、DIAG 和 IMPORTED；加了星标后还会出现 ★ 标签页。搜索覆盖整个程序库。三种机型可以显示或隐藏。
- 每一行都带有屏幕预览，是在构建程序库时用同一台虚拟机运行该程序 10 秒生成的。
- 指针停留在行上会打开详情卡片：完整说明、机型和屏幕、速度、兼容模式、按键、日期、旋转和许可证。
- 你操作程序库时，选中的程序会在详情旁自动演示；30 秒内没有指针、按键或搜索输入即停止。
- 列表与详情之间的分界线可以拖动，双击恢复到一半。

### 游玩

- 屏幕以整数个屏幕像素绘制每个点，带有荧光余辉和点与点之间的网格。两者都可关闭，FIT 可让画面填满窗格。颜色使用主题色（THEME）或作者的配色（ORIGINAL）。
- 键盘按位置对应 1234 / QWER / ASDF / ZXCV。与 Octo 一样，方向键和空格键也会按下 5 7 8 9 和 6。
- 只有窗格获得焦点时才接收按键，且不接收与 Ctrl、Alt 或系统键的组合、Tab、Esc 和功能键。按下窗格中的按钮后，焦点会回到虚拟机。
- **P** 暂停，暂停时 **Enter** 前进一帧。

### 面板

- **CORE** 显示寄存器、栈以及程序计数器前后的代码，**STEP** 执行一条指令，**FRAME** 执行一帧。
- **MEM** 显示程序计数器或 I 附近的内存，并把从 I 开始的字节画成精灵。
- **TUNE** 设置速度和兼容模式（VIP、SCHIP、XO，或逐项设置）。设置为该程序保存，在所有窗格中生效；**OWN** 恢复程序自己的设置。
- **SAVE** 可为每个程序保存三个状态，各带屏幕预览。

### 存档与导入

- 窗格不可见时自动暂停，回来后仍保持暂停；在布局中移动后从原处继续。
- 离开时的状态保存为 AUTO，在停止游玩时写入，从不按定时器写入。即使重启后，**LOAD** 也会变成 **CONTINUE**（**NEW** 则从头开始）。
- **+ IMPORT** 通过 main 的文件选择器导入你自己的程序文件（`.ch8`、`.c8`、`.sc8`、`.xo8`、`.bin` 或任意文件，最大 65,024 字节）：
  - 根据程序能执行到的指令推断机型；
  - 预览的生成方式与程序库相同；
  - 名称和机型之后都可以修改。更改机型会丢弃其调整和存档。
  - **REMOVE**（按两次）连同调整、星标和存档一起删除文件。
- 加了 ★ 的程序会集中到 ★ 标签页。
- 你保留的内容归 main 管理，位于 elecdex 的用户数据文件夹中（`chip8/library.json`、导入的文件和存档），从不放进可以带到其他电脑的布局中。

<p align="center">
  <img src="../screenshots/pane-chip8.jpg" alt="单独的 CHIP-8 窗格：程序的屏幕，旁边是键盘和 CORE 面板">
  <br><sub>CHIP-8</sub>
</p>

## ELEC-16

<p align="center">
  <img src="../screenshots/elecdex-elec16.jpg" alt="中间一列中 CLASSIC 外观的 ELEC-16 窗格：名牌上写着 ELEC-16 和 16-BIT POCKET COMPUTER 的深色袖珍电脑，灰绿色液晶正在画正弦波，键盘上有红色的 BRK 键，旁边的 CORE 显示寄存器和代码">
  <br><sub>ELEC-16 · CLASSIC 外观</sub>
</p>

| | |
|---|---|
| 打开方式 | retro 预设（ELEC-16 和 ELEC-16 SCI 标签页）；desk 预设（ELEC-16 SCI）；选择器："elec-16" 和 "elec-16 sci"；可放多个，可置于前面 |
| 读取内容 | 除了通过 main 的文件选择器导入的内容，不读取机器之外的任何东西；LINK 只有在你打开后才会连到 AI |
| 更新 | 只在开机、未休眠且可见时运行；在提示符处休眠；液晶每秒最多绘制 30 次 |
| 平台 | Windows、macOS、Linux（macOS 和 Linux 未经手动验证） |
| 隐私 | 用户的代码只作为机器码运行，绝不作为 JavaScript 运行；API 密钥从不到达页面或机器；LINK 只发送问题，且只在有人按键之后 |
| 设置 | *Settings → General → elec-16*：buzzer volume、skin of a new pane；每台机器在面板的 TUNE 和 LINK 中设置 |

这是为 elecdex 设计的 16 位袖珍电脑，并非仿制任何真实机型。CPU（E16，混用 32 位和 16 位指令的 RISC）、ROM、字体和 BASIC 全部自行编写。窗格的标签页显示机器的种类：ELEC-16 POCKET、HANDHELD、PLAY 或 SCI。

### 机型

机型在面板的 TUNE 中选择。更改后机器会重新启动。

| 机型 | 屏幕 | 文字 | 开机进入 |
|---|---|---|---|
| POCKET-32 | 240×32，1 位 | 40 列 4 行 | BASIC |
| POCKET-48（默认） | 240×48，1 位 | 40 列 6 行 | BASIC |
| POCKET-64 | 240×64，1 位 | 40 列 8 行 | BASIC |
| HANDHELD-160 | 160×144，四级灰度 | 26 列 18 行 | BASIC |
| PLAY-320 | 320×288，彩色 | — | 启动画面（[PLAY-320](#play-320)） |
| SCI-128 | 128×64，1 位 | 21 列 8 行 | 计算器（[ELEC-16 SCI](#elec-16-sci)） |

- 在 POCKET 和 HANDHELD 机型之间切换时 RAM 保留。
- 切换到或离开 PLAY-320、SCI-128 时 RAM 会被清除，因此 TUNE 需要按两次确认。

### 机器

| 部分 | |
|---|---|
| CPU | E16：16 位 RISC，16 个寄存器，混用 32 位和 16 位指令 |
| 时钟 | 默认 4 MHz；每台机器可在 TUNE 中选 1、2、4、8、16、32 MHz 或 MAX。计时器和时钟按主机时间走，因此无论什么速度 `WAIT` 和 `TIME$` 都不会走偏 |
| 内存 | 32 KB RAM，有电池备份（开机时 BASIC 可用 26,622 字节）；7000–7BFF（3 KB）为机器码区 |
| 其他 | 蜂鸣器、计时器、时钟、十进制浮点运算单元、存储卡 |

### BASIC 与监视器

- 开机进入 **BASIC**：输入 `3*4+SIN 30` 即得答案，加上行号就成为程序（`LIST`、`RUN`、`AUTO`、`RENUM`）。
- 支持字符串、数组、`DATA`、声音（`BEEP`）、点、线和圆（`PSET`、`LINE`、`CIRCLE`）、时钟（`TIME$`）以及存储卡上的文件（`SAVE`、`LOAD`、`FILES`、`OPEN`）。
- 方言是自己的；没有照搬任何厂商的 ROM、说明书文字或方言。
- `MON` 打开机器码监视器：转储、写入、运行、反汇编、断点。
- **BRK**（红色键，PC 上为 Pause）总能让机器停下来。

### 按键与 PASTE

- 窗格获得焦点时可以用 PC 键盘输入。KANA 模式下按 JIS 假名布局输入假名。
- 窗格不接收 Esc、Tab、功能键以及与 Ctrl、Alt 或系统键的组合，这些留给应用。
- **PASTE**（或在机器上右键单击）把剪贴板的文字作为按键敲进去。无法输入的字符会被跳过并计数。不接收 Ctrl+V。

### 液晶与外观

- 液晶默认为 240×48，逐点绘制，带有真实液晶的点阴影、缓慢消退的残影和对比度；按机器的分辨率绘制，再清晰地放大到整数个屏幕像素。
- 机身要么整体绘制，要么不画：FULL（机身和键盘）、COMPACT（液晶和一排按键）或只有 LCD，根据窗格大小自动选择，也可在 TUNE 中固定。从不拉伸。
- 十三种外观可以替换机身：ELEC、PLAIN、TRON、BUSINESS LIGHT、BUSINESS DARK、CLASSIC、IVORY、NIGHT、ALLOY、GRAPHITE、NEO、MOCHI 和 GLASS。PLAIN 不画机身，而是当前主题下应用自己的扁平样子。
- 其中五种用光影画出立体感，键帽也各用自己的字体：
  - **ALLOY**：拉丝金属配黑色键盘底板；
  - **GRAPHITE**：石墨色磨砂外壳配近白色数字键区；
  - **NEO**：低键程按键和纸一样的屏幕的现代袖珍电脑；
  - **MOCHI**：樱花色加波点、糖釉般的粉彩按键的可爱款；
  - **GLASS**：能看到内部电路板的透明玻璃机身，随主题的明暗和强调色变化。
- 都不是任何真实产品的复制。

<table>
  <tr>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-alloy.jpg" alt="ALLOY：拉丝金属上压印的名牌文字，一条琥珀色线，下沉的黑色底板上的黑色按键"><br><sub>ALLOY</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-graphite.jpg" alt="GRAPHITE：石墨色磨砂外壳，浅色按键，近白色数字键区，深色功能键和红色 BRK"><br><sub>GRAPHITE</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-neo.jpg" alt="NEO：冷调浅灰外壳，嵌在各自凹槽中的低键程按键，纸一样的屏幕，钴蓝色 ENTER"><br><sub>NEO</sub></td>
  </tr>
  <tr>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-mochi.jpg" alt="MOCHI：樱花粉配白色波点，薄荷、奶油、柠檬和薰衣草色的糖釉粉彩按键，梅子色屏幕"><br><sub>MOCHI</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-glass.jpg" alt="深色主题下的 GLASS：边缘发光的深色玻璃机身，深处可见电路板，玻璃按键"><br><sub>GLASS</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-glass-light.jpg" alt="浅色主题下的 GLASS：同样的玻璃变为浅色，ENTER 带强调色的蓝"><br><sub>GLASS・浅色主题</sub></td>
  </tr>
</table>

### 单元、电池备份与存储卡

- 每台机器是由 main 保管的 **单元**；窗格只保存单元的 id 和显示选项。
- 单元的 RAM 由电池备份，重启后仍在。备份在窗格隐藏或关闭、机器关机或页面离开时写入，从不按定时器写入。
- 同一时间只有一个窗格运行一台单元。第二个窗格会提供 **MOVE HERE**（接管）或 **NEW UNIT**。
- 存储卡保存单元的文件：名称最多 8+3 个大写字母和数字，每个文件 32 KB，每张卡 256 KB。
- 面板的存储卡视图可以 **IMPORT** 和 **EXPORT** `.bas`（文本）、`.asm`（由 main 汇编为 `.BIN`）、二进制和数据文件，全部经过 main 的文件选择器。
- 自动关机（默认 10 分钟，或 30 分钟，或从不）只在机器等待按键时计时；RAM 保留。

### 面板

| 标签页 | |
|---|---|
| CORE | 寄存器和代码，带断点、STEP 和 HALT |
| MEM | 内存，跟随 PC、SP、VRAM 或任意地址 |
| FILES | 存储卡和 SOFT CARD；LOAD ▸ 替你敲入 `LOAD` 那一行 |
| TUNE | PASTE、时钟（1 至 32 MHz、MAX）、机型和液晶、机身绘制方式、对比度、残影、外观、自动关机 |
| LINK | LINK 整体和每项服务的开关、AI 提供方、已发送数、上一次失败的原因 |
| GAMES | 仅 PLAY-320：卡槽和游戏架 |

机器上方的条带有 CPU 指示灯（running、asleep、off）、SND、KEYS（焦点）、暂停、BRK、POWER、RESET（让 CPU 重新开始；RAM 保留）、PANEL 和 CODE。

### SOFT CARD

SOFT CARD 附带十三个程序，以只读方式叠加在每台单元的存储卡上：

| 程序 | |
|---|---|
| SINEWAVE | 正弦波 |
| BOUNCE | 弹跳的球 |
| CLOCK | 时钟 |
| MAZE | 迷宫 |
| PRIMES | 质数 |
| HITBLOW | 猜数字 |
| LANDER | 登月 |
| CANNON | 用大炮打靶 |
| BIORHYTH | 生物节律 |
| UNITS | 单位换算 |
| CHAT | 通过 LINK 与 AI 聊天 |
| ASMDEMO.BIN | 机器码示例 |
| TICKER.BIN | 机器码的滚动文字 |

- 在 BASIC 中：`FILES "SOFT"` 列出，`LOAD "PRIMES"` 读入。
- 在面板的 FILES 中选中程序，也会显示其用法。
- 如果你在自己的存储卡上保存了同名文件，读取的是那个文件。

### LINK

- **LINK** 让程序与 elecdex 的 AI 设置中的 AI 对话，提供方和密钥与 [AI 聊天](panes-ai.zh-CN.md#ai-chat)窗格相同。
  - `ASK Q$,A$` 提出问题并取回回答：用英语回答，用假名提问则用假名回答（液晶没有汉字）。
  - `ASK TYPE` 选择回答方式：普通、老师、BASIC 顾问、问答、故事、诗、占卜、词典、翻译、网页搜索、天气。
  - `ASK NEW` 开始新的对话。
- **在你打开之前什么也不发送**（面板的 LINK）。LINK 整体默认开启，AI 服务默认关闭，CART（PLAY-320 的卡带，只在应用内部完成）默认开启。
- 只发送问题以及该单元最近的对话；对话只保存在 main 的内存中，从不写入磁盘。机器内存的其他部分不会发送。
- 在有人按键之前，程序不能再次发送；PASTE 敲入的按键不计。每台单元一次一个请求，180 秒超时。
- 回答只以液晶字符的形式到达机器。搜索和天气也由模型回答（在提供方一侧进行网页搜索），这台电脑上不运行任何东西。
- API 密钥加密保存在 main 中。也可以选择没有密钥的提供方（本地模型）。

### CODE

- **CODE** 把用 TypeScript 子集（e16c）写的程序以三级优化编译成机器码，并排显示各自的字节数和周期数。
- **RUN ▸** 把它放进机器运行；**LOAD ▸** 把它放进去供监视器使用。SAVE TO CARD 将其保存为 `.BIN`。
- 编译器在页面的 Worker 中运行。用户的代码只作为机器码运行，绝不会作为 JavaScript 运行。
- CODE 适用于所有机型；在 PLAY-320 和 SCI-128 上，RUN 从启动画面或计算器直接调用程序。

### 开销

- 在提示符处等待时 CPU 休眠，窗格的负担与暂停的窗格相当。
- 不可见时停止并写入电池备份。回来时，原本在提示符处休眠的机器直接继续，原本在运行的机器以暂停状态回来。
- 在 Windows 上实测（整个应用，按一个核心计）：在提示符处休眠约 7%；4 MHz 下每帧都改写画面约 23–28%；32 MHz 约 40%。

<p align="center">
  <img src="../screenshots/pane-elec16.jpg" alt="单独的 ELEC-16 窗格：袖珍电脑的机身和液晶，旁边是面板">
  <br><sub>ELEC-16</sub>
</p>

## PLAY-320

<p align="center">
  <img src="../screenshots/elecdex-play-air.jpg" alt="Phosphor 主题下变成横式石墨色机身 PLAY-320 的 ELEC-16 窗格：屏幕上是 ELECAIRCOMBAT 的驾驶舱，导引圈中的王牌 GANNET 被红色锁定框框住，上方显示 ENGAGE，一枚导弹在它身上爆炸，下方是雷达、分数和损伤面板，LCK 灯亮着；旁边的 CORE 显示 E16 的寄存器和运行中的程序计数器处的代码">
  <br><sub>ELEC-16 PLAY（PLAY-320）· ELECAIRCOMBAT · Phosphor · 旁边是 CORE</sub>
</p>

| | |
|---|---|
| 打开方式 | 在 ELEC-16 窗格的 TUNE 中把机型设为 PLAY-320（名牌为 ELEC-16 PLAY） |
| 读取内容 | main 的游戏架上的卡带；你自己的卡带通过 main 的文件选择器或 GAMES ▸ DEVELOP |
| 更新 | 运行中且可见时每秒 60 帧 |
| 平台 | Windows、macOS、Linux（macOS 和 Linux 未经手动验证） |
| 隐私 | 不使用网络：CART 服务只在应用内部完成 |
| 设置 | TUNE：扩展 RAM、机身、颜色、时钟；LINK：CART |

### 游戏机

| 部分 | |
|---|---|
| 屏幕 | 320×288，从 32,768 色（RGB555）中选取的调色板，每秒 60 帧 |
| 图形 | 图块引擎：两层可滚动背景、128 个精灵、16 组调色板、行中断和 DMA |
| 声音 | 16 个立体声声道，带包络、滑音和波形表 |
| 内存 | 32 KB RAM，以及在 TUNE 中选择的最多 512 KB 扩展 RAM |
| 卡带 | ROM 最大 1 MB，存档 RAM 最大 32 KB（按游戏保存） |
| 启动 | 启动画面；没有 BASIC、没有监视器、不会自动关机 |
| 机身 | 竖式或横式，12 个按钮（十字键、A、B、X、Y、L、R、START、SELECT），颜色为 graphite、ivory 或 coral，也可以只显示屏幕 |

### 操作

| PC 按键 | 按钮 |
|---|---|
| 方向键 | 十字键 |
| Z / X / S / A | A / B / X / Y |
| Q / W | L / R |
| Enter / 右 Shift | START / SELECT |
| Pause | BRK |

- 标准布局的游戏手柄也可以使用，按按钮位置对应，左摇杆也可用。
- 按键和游戏手柄只在窗格获得焦点且可见时才到达机器。

### 玩游戏

- 在面板的 **GAMES** 中从架子上插入卡带，按 **START** 开始玩。CODE 也可以在上面运行程序。
- 架子上附带四款自己的游戏：
  - **ELECLANCE**：纵版射击，有 LANCE 激光、炸弹、OVERDRIVE 和两个头目（[说明](../elec16-eleclance.md)，日文）；
  - **ELECAIRCOMBAT**：驾驶舱视角的一对一空战。每帧重绘天空和海面使地平线倾斜，原创敌机以 17 个方向 × 8 种旋转 × 7 种大小预先绘制并从卡带读取，用机炮、锁定导弹和干扰弹对战五名王牌（[说明](../elec16-elecaircombat.md)，日文）；
  - **ELECDRILL**：向下挖掘的方块解谜。同色相连的方块一起消失，失去支撑的方块摇晃后落下，四个同色落在一起便连锁消除；注意空气，穿过五个地层直达 500 米深的核心（[说明](../elec16-elecdrill.md)，日文）；
  - **ELECFIGHTER**：回合制的一对一格斗，交战的是没有名字的人形槽位，即工业格斗模拟器的训练用躯体。由低多边形模型预先绘制的线框加平涂的人，以轻击与重击、按高度区分的防御、投技与拆投、连段、反击和冲刺，对战四个各有头脑的对战程序（[说明](../elec16-elecfighter.md)，日文）。
- 玩法见 [PLAY-320 使用说明书](../elec16-play-manual.md)（日文）。
- 卡带的 ROM 从不放进电池备份：页面按内容的哈希从架子上重新插入。架子上已没有同一款游戏时，游戏机回到启动画面。

<p align="center">
  <img src="../screenshots/elecdex-play.jpg" alt="Business (Dark) 主题下变成竖式珊瑚色机身 PLAY-320 的 ELEC-16 窗格：彩色屏幕上是 ELECLANCE，飞船在小型敌机之间向正上方发射 LANCE，侧面板显示分数、CHAIN、SHIP、BOMB 和 VOLT；旁边的 GAMES 中卡槽里是 ELECLANCE，下面是三款游戏的架子和 DEVELOP">
  <br><sub>ELEC-16 PLAY（PLAY-320）· ELECLANCE · Business (Dark)</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-play-drill.jpg" alt="Business (Light) 主题下只显示屏幕的 PLAY-320 的 ELEC-16 窗格：ELECDRILL 的红、黄、绿、蓝方块之井，34 米深处的挖掘者头上亮着 3 CHAIN，两侧是深度计、AIR 气罐、DRILLERS 和 CHAIN 面板；旁边的 MEM 以十六进制显示 E16 的内存">
  <br><sub>ELEC-16 PLAY（PLAY-320）· ELECDRILL · Business (Light) · 只显示屏幕，旁边是 MEM</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-play-fighter.jpg" alt="Tron 主题下只显示屏幕的 PLAY-320 的 ELEC-16 窗格：ELECFIGHTER 在 GRID 场地的第一战，蓝色线框加平涂的 S4 OUTBOX 一拳打中红色的 S2 RUSH，迸出火花，背后是城市天际线和透视地面，上方是体力条和 TIME；旁边的 GAMES 中卡槽里是 ELECFIGHTER">
  <br><sub>ELEC-16 PLAY（PLAY-320）· ELECFIGHTER · Tron · 只显示屏幕，旁边是 GAMES</sub>
</p>

### 制作游戏

- 游戏用 e16c 编写，并通过可导入 PNG 图像和文本乐谱的游戏工具包制作。
- **GAMES ▸ DEVELOP** 打开游戏文件夹；选择空文件夹则从模板新建一个游戏。
- 应用会在内部构建并插入卡槽，每次保存文件都会重新构建。不需要 Node 或代码仓库。
- main 只读取该文件夹中由游戏的 `game.json` 指名的文件，只写回 `assets.e16.ts` 和 `compiled.s`。构建在页面的 Worker 中进行。
- 构建后游戏不会自行开始：START 需要人来按。
- 参见 [游戏开发指南](../elec16-kit.md)（日文）。

## ELEC-16 SCI

<p align="center">
  <img src="../screenshots/elecdex-sci.jpg" alt="Business (Light) 主题下变成竖式粉笔白机身 SCI-128 计算器的 ELEC-16 窗格：以 2D 输入的 sin(45)+1/2，分数像教科书一样排版，下方是精确形式的答案 (1+√2)/2；按键带橙色的 SHIFT 面和 ALPHA 字母，深色光标键，红色的 DEL 和 AC，蓝色的 =；旁边的 CORE 显示 E16 的寄存器和代码">
  <br><sub>ELEC-16 SCI（SCI-128）· CHALK · Business (Light)</sub>
</p>

| | |
|---|---|
| 打开方式 | retro 和 desk 预设（标签页）；选择器："elec-16 sci"，会新建一个单元（SCI 1、SCI 2 …）打开，不会清除任何人的 BASIC |
| 读取内容 | 不读取机器之外的任何东西 |
| 更新 | 等待按键时休眠；自动关机与袖珍电脑机型相同 |
| 平台 | Windows、macOS、Linux（macOS 和 Linux 未经手动验证） |
| 设置 | TUNE：机身（SLATE、CHALK、PLAIN）、时钟、自动关机、FULL / SIMPLE / COMPACT / LCD |

一台自行设计的函数计算器，机型 SCI-128，128×64 液晶，竖长机身：SLATE、CHALK，或使用主题颜色的 PLAIN。PLAIN 与袖珍电脑的 PLAIN 一样不画机身，只有液晶和用面板细线框起的按键 *(unreleased)*。SIMPLE 只显示液晶和数字键（0-9、.、EXP、ANS、DEL、AC、+ − × ÷、=），像普通计算器一样使用；AUTO 不会选它 *(unreleased)*。用词是它自己的，不使用任何厂商的名称、写法或按键布局。

### 输入与答案

- 算式以 2D（分数、根号、乘方像教科书一样排版，竖线光标可进入其中）或单行输入。
- 答案尽可能以分数和 `(p + r√s)/q` 的精确形式保留（sin 45° 是 √2/2，1/3+1/6 是 1/2）；按 F⇄D 以大号数字显示小数。
- 变量、Ans、M、历史。
- **FUNC**：gcd、lcm、%（500+25% 是 625）、int、round、rand、dice、coin、pol、rec，以及在算式中使用 STATS 的结果和估计值。
- 另有：常数计算、角度换算、改写输入、度分秒、双曲函数、f(x) 和 FIND X。

### 模式

| 模式 | |
|---|---|
| STATS | 单变量和六种回归（直线、二次、指数、对数、幂、倒数），最多 40 行 |
| BASE | 32 位 HEX、DEC、OCT、BIN、五进制和 AND、OR、XOR、XNOR |
| TABLE | 最多 30 行的 f(X) 表 |
| EQUATION | 二元和三元联立、带精确解或复数解的二次方程、三次方程 |
| CPLX | 复数，a + bi 和 r∠θ |
| MATRIX | 最多 3×3 的矩阵和向量：行列式、逆矩阵、转置、内积、外积 |
| PROG | 带输入、输出、条件和跳转的 4 个程序 |

- **CONST** 输入 20 个物理常数（CODATA 2022）。
- **CONV** 在 20 组单位之间换算。
- **Σ、d/dx、∫** 对 X 的算式求和、求导和积分。和保持精确形式：Σ(1/X,1,4) 是 25/12。
- v0.0.44 新增：
  - `mod` 和 Π；
  - →PRIME（把答案分解为质因数之积：360 是 2³×3²×5）；
  - SI 词头（47k×220p；再按一次 ENG 显示 10.34μ）；
  - 正态分布（nlow、nmid、nup、→z）；
  - EQUATION 的二次和三次不等式（X²−X−6>0 是 X<−2 和 3<X）。

### 按键与面板

- 从 PC 输入：数字、`+ - * / ^ ( ) .`、Enter（=）、Backspace（DEL）、Delete（AC）和方向键。
- 字母键输入函数：`s` SIN、`c` COS、`t` TAN、`l` LN、`g` LOG、`r` √、`f` a/b、`e` EXP、`!` x!。按住 Shift 输入字母则输入该键的 SHIFT 面。
- 面板有 CORE、MEM 和 TUNE；没有 FILES、GAMES、LINK 和 PASTE。
- 屏幕和其他机型一样可供屏幕阅读器读出。
- 参见 [SCI-128 使用说明书](../elec16-sci-manual.md)（日文）。

## 说明书与指南

说明书均为日文。

| 文档 | |
|---|---|
| [BASIC](../elec16-basic.md) | ELEC-16 BASIC |
| [E16 机器码与监视器](../elec16-e16.md) | 指令集、汇编器、监视器、ROM 服务 |
| [e16c（CODE 的 TypeScript）](../elec16-e16c.md) | TypeScript 子集和 CODE 画面 |
| [SOFT CARD 的程序](../elec16-soft.md) | 每个程序的运行和玩法 |
| [PLAY-320](../elec16-play-manual.md) | 游戏机使用说明书 |
| [PLAY-320 的游戏开发](../elec16-kit.md) | 游戏工具包和 GAMES ▸ DEVELOP |
| [ELECLANCE](../elec16-eleclance.md)、[ELECAIRCOMBAT](../elec16-elecaircombat.md)、[ELECDRILL](../elec16-elecdrill.md)、[ELECFIGHTER](../elec16-elecfighter.md) | 四款游戏 |
| [SCI-128](../elec16-sci-manual.md) | 函数计算器使用说明书 |
| [pocket.html](../elec16-guide/pocket.html)、[sci.html](../elec16-guide/sci.html) | 袖珍电脑和函数计算器的 HTML 快速指南 |

- 在 GitHub 上 HTML 文件会显示为源代码。请在本地取得仓库后用浏览器打开快速指南。
- 在机器中，在 FILES 里选中程序也会显示其用法。

## 设计文档

以下为日文：

- [architecture.md §5.18 CHIP-8](../architecture.md#518-chip-8-ペインchip-8super-chipxo-chip-を遊ぶ)
- [architecture.md §5.19 ELEC-16](../architecture.md#519-elec-16-ペイン16-ビットポケコン設計済み作成中)
- [emu.md](../emu.md)：各模拟器共享的基础
- [elec16.md](../elec16.md)：机器、ROM、e16c、窗格、存储、LINK
- [elec16-play.md](../elec16-play.md)：PLAY-320 机型
- [elec16-sci.md](../elec16-sci.md)：SCI-128 机型
