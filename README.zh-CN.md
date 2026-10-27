<p align="center">
  <img src="./public/elecdex_repo_card.svg" width="800" alt="elecdex - 重建的科幻风终端与系统监视器">
</p>

[![CI](https://github.com/kurouna/elecdex/actions/workflows/ci.yml/badge.svg)](https://github.com/kurouna/elecdex/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/kurouna/elecdex?include_prereleases)](https://github.com/kurouna/elecdex/releases)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Zenn](https://img.shields.io/badge/Zenn-kurouna-blue)](https://zenn.dev/kurouna)
[![X](https://img.shields.io/badge/X-elecxzy-black)](https://x.com/elecxzy)

[English](README.md) | [日本語](README.ja.md) | **简体中文**

# elecdex

一款科幻风格的桌面终端模拟器兼系统监视器。它在当下安全的技术栈上从零重写了
[eDEX-UI](https://github.com/GitSquared/edex-ui)（已于 2021 年归档），支持 Windows、macOS 和 Linux。

<p align="center">
  <a href="https://youtu.be/JlCZzLhp_PM">
    <img src="./docs/screenshots/elecdex-tron.jpg" alt="Tron 主题下的 elecdex：左侧是系统监视器，中间是三个 shell 标签页以及启动器和文件浏览器，右侧是世界视图、行情、天气和日历">
  </a>
  <br>
  ▶ <a href="https://youtu.be/JlCZzLhp_PM">3 分钟介绍视频</a> · <a href="https://youtube.com/shorts/K-Is8LihR1w">短视频（竖屏）</a>
</p>

> **v0.0.47 — 预发布版。** 下文所列功能目前均可使用；构建未经签名。标有 *unreleased* 的内容
> 已在 `main` 上，将随下一个版本发布。
>
> **在 Windows 上开发和使用。** 每次发布都会构建 macOS 和 Linux 版本，但它们只在 GitHub Actions
> 上跑过自动化端到端测试，还没有人长时间亲手使用过，因此 **macOS 和 Linux 尚未经过充分验证**。
> 在这两个平台上可能会遇到不少粗糙之处，发现问题请[反馈](https://github.com/kurouna/elecdex/issues)。
>
> 设计说明：[docs/architecture.md](docs/architecture.md)。每项决策及其理由：
> [docs/decisions.md](docs/decisions.md)。

## 这是什么

elecdex 是一个把终端和系统实时信息放在同一屏幕上、带有科幻终端外观的桌面应用。它是 eDEX-UI（2021 年已归档）的完全重写，基于 Electron 45、Svelte 5 和 TypeScript 7，以 GPL-3.0 发布。

- **终端**：通过 node-pty 在标签页和分屏中运行 PowerShell、bash、zsh 和 fish；借助 shell 集成（OSC 7 / OSC 9;9）跟随每个 shell 的目录，Windows 上也一样。
- **窗格**：40 种内置窗格加上网页窗格（Browser、YouTube、X），排列在一棵会被保存的分屏与标签页树中；10 个布局预设、已保存的布局、操作面板。
- **系统与网络**：CPU、内存、GPU、磁盘、进程、按程序分组的每个 TCP 套接字、Wi-Fi 与以太网诊断；在 Windows 上读取时不会每次启动新进程。
- **外部世界**：天气（日本气象厅、NWS、MET Norway）、市场行情、RSS、地震与海啸、在本地计算的卫星位置（SGP4）、用内置 GeoIP 数据库定位的连接地球视图。
- **工作与 AI**：Git（读取以及 FETCH/PULL/PUSH）、Docker、Log Watch、Claude Code 会话；可连接任何 OpenAI 兼容或 Anthropic 端点的 AI 聊天，密钥由操作系统加密保存。
- **自有的机器**：CHIP-8 模拟器，以及原创的 16 位袖珍电脑 ELEC-16（BASIC、游戏机型号、科学计算器）。
- **安全模型**：页面运行在沙箱中，没有 Node，也没有网络（`connect-src 'self'`）；所有请求都由主进程发出，且只在某个窗格需要时进行；没有遥测。插件运行在沙箱化的 worker 中，只能做被授权的事。

## 布局预设

10 个预设一键切换整个屏幕（**Ctrl+Shift+F1** 到 **F10**）；除 cockpit 和 blank 外，都保留左侧的系统列。每张图都是该预设在不同主题下的样子；详情见[布局预设](docs/guide/presets.zh-CN.md)。

<table>
  <tr>
    <td align="center" width="50%"><a href="docs/guide/presets.zh-CN.md#standard"><img src="./docs/screenshots/elecdex-tron.jpg" alt="Tron 主题下的 standard 预设"></a><br><sub><b>standard</b> · Ctrl+Shift+F1 · 终端、本机与外部世界</sub></td>
    <td align="center" width="50%"><a href="docs/guide/presets.zh-CN.md#network"><img src="./docs/screenshots/elecdex-network.jpg" alt="White 主题下的 network 预设"></a><br><sub><b>network</b> · Ctrl+Shift+F2 · 按程序分组的套接字、Wi-Fi、以太网、地球视图</sub></td>
  </tr>
  <tr>
    <td align="center" width="50%"><a href="docs/guide/presets.zh-CN.md#earth"><img src="./docs/screenshots/elecdex-earth.jpg" alt="Tron 主题下的 earth 预设"></a><br><sub><b>earth</b> · Ctrl+Shift+F3 · 头顶的卫星、脚下的地震、天气</sub></td>
    <td align="center" width="50%"><a href="docs/guide/presets.zh-CN.md#dev"><img src="./docs/screenshots/elecdex-dev.jpg" alt="Phosphor 主题下的 dev 预设"></a><br><sub><b>dev</b> · Ctrl+Shift+F4 · 工作中的 AI 代理、Docker、Git、Log Watch</sub></td>
  </tr>
  <tr>
    <td align="center" width="50%"><a href="docs/guide/presets.zh-CN.md#media"><img src="./docs/screenshots/elecdex-media.jpg" alt="White 主题下的 media 预设"></a><br><sub><b>media</b> · Ctrl+Shift+F5 · 网页窗格、声音频谱、混音器、正在播放</sub></td>
    <td align="center" width="50%"><a href="docs/guide/presets.zh-CN.md#desk"><img src="./docs/screenshots/elecdex-desk.jpg" alt="Black 主题下的 desk 预设"></a><br><sub><b>desk</b> · Ctrl+Shift+F6 · 笔记、任务、计时器、剪贴板、日历、工具</sub></td>
  </tr>
  <tr>
    <td align="center" width="50%"><a href="docs/guide/presets.zh-CN.md#ai"><img src="./docs/screenshots/elecdex-ai.jpg" alt="Business (Dark) 主题下的 ai 预设"></a><br><sub><b>ai</b> · Ctrl+Shift+F7 · 两个 AI 聊天、ELEC 评议、GPU</sub></td>
    <td align="center" width="50%"><a href="docs/guide/presets.zh-CN.md#cockpit"><img src="./docs/screenshots/elecdex-cockpit.jpg" alt="Black 主题下的 cockpit 预设"></a><br><sub><b>cockpit</b> · Ctrl+Shift+F8 · 整台机器集中在一个 CLUSTER 窗格</sub></td>
  </tr>
  <tr>
    <td align="center" width="50%"><a href="docs/guide/presets.zh-CN.md#retro"><img src="./docs/screenshots/elecdex-retro.jpg" alt="Tron 主题下的 retro 预设"></a><br><sub><b>retro</b> · Ctrl+Shift+F9 · CHIP-8、ELEC-16 系列机器与 SCI-128 科学计算器</sub></td>
    <td align="center" width="50%"><a href="docs/guide/presets.zh-CN.md#blank"><img src="./docs/screenshots/elecdex-blank.jpg" alt="Amber 主题下的 blank 预设"></a><br><sub><b>blank</b> · Ctrl+Shift+F10 · 尚无窗格：搭建你自己的布局</sub></td>
  </tr>
</table>

## 窗格

| 分类 | 窗格 | 指南 |
| --- | --- | --- |
| 系统 | Terminal、Clock、System、CPU、Memory、GPU、Disk、Top processes、Cluster、Launcher、Filesystem | [系统窗格](docs/guide/panes-system.zh-CN.md) |
| 网络 | Network status、Network traffic、World view、Connections、Wi-Fi、Ethernet | [网络窗格](docs/guide/panes-network.zh-CN.md) |
| 开发 | AI Agent、Git、Docker、Log Watch | [开发窗格](docs/guide/panes-dev.zh-CN.md) |
| 外部世界 | Orbit、Markets、Weather、RSS、Quakes、地震与海啸提醒 | [外部世界窗格](docs/guide/panes-world.zh-CN.md) |
| AI | AI chat、ELEC system | [AI 窗格](docs/guide/panes-ai.zh-CN.md) |
| 桌面 | Calculator、Notes、Tasks、Timer、Clipboard、Calendar、Utility | [桌面窗格](docs/guide/panes-desk.zh-CN.md) |
| 媒体 | Spectrum、Browser、YouTube、X、Mixer、Now playing | [媒体窗格](docs/guide/panes-media.zh-CN.md) |
| 复古 | CHIP-8、ELEC-16（POCKET、HANDHELD、PLAY-320、SCI-128） | [复古窗格](docs/guide/panes-retro.zh-CN.md) |

## 安装

从 [Releases](https://github.com/kurouna/elecdex/releases) 下载适合你平台的安装包：

| 平台 | 文件 |
| --- | --- |
| Windows x64 / arm64 | `elecdex-win-x64-<version>.exe` / `elecdex-win-arm64-<version>.exe` |
| macOS Apple silicon / Intel | `elecdex-mac-arm64-<version>.dmg` / `elecdex-mac-x64-<version>.dmg` |
| Linux x64 | `elecdex-linux-x86_64-<version>.AppImage` 或 `elecdex-linux-amd64-<version>.deb` |
| Linux arm64 | `elecdex-linux-arm64-<version>.AppImage` 或 `elecdex-linux-arm64-<version>.deb` |

作者日常使用的是 Windows 版本。macOS 和 Linux 版本出自同一个发布工作流，并在 GitHub 的运行器上
通过了端到端测试，但没有经过实际上手测试：请把它们视为尚未充分验证。

### 出现警告时

安装包没有代码签名：证书的费用超出了个人项目的承受能力。因此 Windows 和 macOS 会在首次运行前
发出警告。这些警告的意思是它们不认识发布者，而不是在文件里发现了什么。如果想先核验下载的文件，
发布页列出了每个文件的 SHA-256 校验和。每个安装包都由 GitHub 运行器上的
[发布工作流](.github/workflows/release.yml)从打了标签的源码构建。以下步骤每次安装只需做一次。

**Windows**

1. 浏览器可能会拦下这个下载（"不常下载"）。在 Edge 中，打开该下载的 *⋯* 菜单 → *Keep* →
   *Show more* → *Keep anyway*。在 Chrome 中，选择 *Keep*。
2. 运行 `.exe`。SmartScreen 会显示 **"Windows protected your PC"**：点击 **More info**，然后点击
   **Run anyway**。
3. 安装程序只为当前用户安装，因此不需要管理员权限。

如果 Windows 提示文件已被阻止且没有 *Run anyway*，请右键点击 `.exe` → *Properties* → 勾选
**Unblock** → *OK*，然后再运行一次。

**macOS**（15 Sequoia 及更高版本；更早的版本见最后一步）

1. 打开 `.dmg`，把 **elecdex** 拖到 *Applications*。
2. 从 *Applications* 打开 elecdex。macOS 会提示 **"could not verify 'elecdex' is free of
   malware"**：点击 **Done**（不要点 *Move to Trash*）。
3. 打开 **System Settings → Privacy & Security**，滚动到 *Security*，在关于 elecdex 的那一行旁
   点击 **Open Anyway**。用密码或 Touch ID 确认，然后再点一次 **Open Anyway**。
4. 在 macOS 14 或更早版本上，右键点击应用 → **Open** → **Open** 即可达到同样效果。

如果 macOS 提示的是 **"elecdex is damaged and can't be opened"**，文件其实并没有损坏，拦住它的
是下载时附加的隔离标记。移除该标记后再打开应用：

```bash
xattr -dr com.apple.quarantine /Applications/elecdex.app
```

**Linux**（没有警告，但有两点需要知道）

- **deb**（Debian、Ubuntu）：`sudo apt install ./elecdex-linux-amd64-<version>.deb`。它还会安装
  Ubuntu 24.04 及更高版本所需的 AppArmor 配置文件，否则 Electron 的沙箱无法启动。
- **AppImage**：`chmod +x elecdex-linux-*.AppImage` 后运行。它需要 FUSE 2（`libfuse2`，Ubuntu 24.04
  上为 `libfuse2t64`）。在 Ubuntu 24.04 及更高版本上，它可能会停下并提示 *SUID sandbox helper*，
  因为 AppArmor 在那里阻止了沙箱。这种情况请改用 deb。不要用 `--no-sandbox` 启动：正是沙箱让
  渲染进程无法接触你的文件。

elecdex 以全屏启动。**F11** 退出全屏，**Ctrl+Shift+Q** 退出程序；`--windowed` 以窗口模式启动，
`--no-intro` 跳过启动动画。

### 从源码运行

```bash
git clone https://github.com/kurouna/elecdex.git
cd elecdex
npm ci
npm run dev -- -- --windowed --no-intro
```

`npm ci` 会下载 Electron，并在 macOS 上修复 node-pty；在 Linux 上，请允许 node-pty 的安装脚本以便编译。测试、构建及其他命令见[开发指南](docs/guide/develop.zh-CN.md)。

## 开始使用

| 按键 | 作用 |
| --- | --- |
| Ctrl+Shift+A | 添加窗格（选择器） |
| Ctrl+Shift+F1 … F10 | 切换到布局预设 |
| Ctrl+Shift+G | 已保存的布局 |
| Ctrl+Shift+P | 按名称查找操作、布局、主题或设置（操作面板） |
| Ctrl+Shift+Z | 把有焦点的窗格放大显示在其他窗格之上；再按一次还原 |
| Ctrl+Shift+. | 设置 |
| F11 / Ctrl+Shift+Q | 退出全屏 / 退出应用 |

所有快捷键都可以在 *设置 → Keyboard* 中重新绑定；完整列表见[键盘快捷键](docs/guide/keyboard.zh-CN.md)。

## 文档

| 页面 | 内容 |
| --- | --- |
| [用户指南](docs/guide/index.zh-CN.md) | 下列页面的目录 |
| [布局预设](docs/guide/presets.zh-CN.md) | 10 个预设，逐个窗格说明 |
| [工作区](docs/guide/workspace.zh-CN.md) | 窗格、分屏、标签页、已保存的布局、操作面板、主题与动效、后台运行 |
| [键盘快捷键](docs/guide/keyboard.zh-CN.md) | 全部默认按键、重新绑定、全局快捷键 |
| [主题与设置](docs/guide/themes-settings.zh-CN.md) | 7 个主题、`settings.json` |
| [插件](docs/guide/plugins-use.zh-CN.md) | 安装插件及其能做的事（[API](docs/plugins.md)） |
| [网络访问与数据来源](docs/guide/data-sources.zh-CN.md) | elecdex 连接的所有服务、频率与条款 |
| [开发](docs/guide/develop.zh-CN.md) | 构建、测试、发布，以及为什么要重写 |
| [ELEC-16 使用手册与指南](docs/guide/panes-retro.zh-CN.md#elec-16) | BASIC、E16 机器、e16c、SOFT CARD、PLAY-320、SCI-128，以及带截图的袖珍电脑与科学计算器 HTML 快速指南 |
| [架构](docs/architecture.md) · [决策记录](docs/decisions.md) | 设计以及每个决策和理由（日文） |

## 第三方资源

| 资源 | 来源 | 许可证 |
| --- | --- | --- |
| 显示字体 | [Chakra Petch](https://fonts.google.com/specimen/Chakra+Petch) | SIL OFL 1.1 |
| 界面字体 | [Saira Condensed](https://fonts.google.com/specimen/Saira+Condensed) | SIL OFL 1.1 |
| 等宽字体 | [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | SIL OFL 1.1 |
| ELEC-16 键帽字体 | [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed)、[IBM Plex Sans Condensed](https://fonts.google.com/specimen/IBM+Plex+Sans+Condensed)、[Inter Tight](https://fonts.google.com/specimen/Inter+Tight)、[M PLUS Rounded 1c](https://fonts.google.com/specimen/M+PLUS+Rounded+1c)、[Albert Sans](https://fonts.google.com/specimen/Albert+Sans)；カナ 键的两个字取自 [BIZ UDPGothic](https://fonts.google.com/specimen/BIZ+UDPGothic)、[IBM Plex Sans JP](https://fonts.google.com/specimen/IBM+Plex+Sans+JP)、[Noto Sans JP](https://fonts.google.com/noto/specimen/Noto+Sans+JP) 和 M PLUS Rounded 1c（经由 [Fontsource](https://fontsource.org/)） | SIL OFL 1.1 |
| IP 地理定位 | [`@ip-location-db/geo-whois-asn-country-mmdb`](https://github.com/sapics/ip-location-db)，数据来自 [NRO](https://www.nro.net/) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)（npm 包标注为 CC0-1.0；其附带的 NRO_LICENSE 要求注明 nro.net） |
| 地球的陆地和国家形状 | [Natural Earth](https://www.naturalearthdata.com/)，经由 [world-atlas](https://github.com/topojson/world-atlas) | 公有领域 / ISC（仅构建时使用） |
| 国家代码和时区 | [i18n-iso-countries](https://github.com/michaelwittig/node-i18n-iso-countries)、[countries-and-timezones](https://github.com/manuelmhtr/countries-and-timezones) | MIT（仅构建时使用） |
| README 横幅字体 | [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3) | SIL OFL 1.1（构建时转为 SVG 中的轮廓） |
| 行情数据客户端 | [yahoo-finance2](https://github.com/gadicc/yahoo-finance2) | MIT（打包进主进程） |
| 时区边界（ORBIT） | [timezone-boundary-builder](https://github.com/evansiroky/timezone-boundary-builder) 2026d，基于 OpenStreetMap 数据 | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/)，© OpenStreetMap contributors。由其派生、存放在 `src/renderer/widgets/orbit/tz-lines.json` 中的线条（由 `npm run gen:orbit-map` 生成）同样采用 ODbL；在窗格中署名。 |
| ORBIT 地图的陆地 | [Natural Earth](https://www.naturalearthdata.com/) 50m 陆地数据，经由 world-atlas | 公有领域（"Made with Natural Earth"，在窗格中署名） |
| 轨道外推（SGP4） | [satellite.js](https://github.com/shashwatak/satellite-js) | MIT |
| git 窗格 diff 的语法高亮 | [highlight.js](https://highlightjs.org/) | BSD-3-Clause |
| 计算器的表达式求值器 | [elecxzy](https://github.com/kurouna/elecxzy) `src/utils/calc`，原样复制到 `src/shared/calc/vendor` | MIT |
| CHIP-8 字体 | [Octo](https://github.com/JohnEarnest/Octo) 的 `js/emulator.js`，复制到 `src/shared/chip8/fonts.ts` | MIT |
| CHIP-8 程序 | [chip8Archive](https://github.com/JohnEarnest/chip8Archive)，作者各异，内置于 `resources/chip8/archive` | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)；在窗格中署名 |
| CHIP-8 测试程序（DIAG） | Timendus 的 [chip8-test-suite](https://github.com/Timendus/chip8-test-suite)，连同其 Octo 源码内置于 `resources/chip8/test-suite` | GPL-3.0 |

地理定位数据库是内置的，因此不需要账号、API 密钥或首次运行时下载，IP 查询也永远不会离开本机。

构建应用所用的每个软件包以及上述数据，连同其许可证全文，都列在每个发布版本中可执行文件旁的
`THIRD_PARTY_NOTICES.txt` 里（由 `npm run build` 生成）。

---

## License / ライセンス / 许可证

This software is released under the [GNU General Public License v3.0](./LICENSE), the same license
as eDEX-UI.  
本ソフトウェアは、eDEX-UI と同じ [GNU General Public License v3.0](./LICENSE) のもとで公開されています。  
本软件与 eDEX-UI 一样，依据 [GNU General Public License v3.0](./LICENSE) 发布。

## Acknowledgements / 謝辞 / 致谢

This application is deeply inspired by the design and philosophy of the following pioneering
project. We express our utmost respect and gratitude to its creator and contributors:

本アプリケーションは、以下の先駆的なプロジェクトの設計と哲学に深くインスパイアされています。
この優れたソフトウェアを生み出した開発者およびコミュニティの皆様に、最大限の敬意と謝意を表します。

本应用深受以下开创性项目的设计与理念启发。谨向其作者及所有贡献者致以最崇高的敬意与感谢：

- **[eDEX-UI](https://github.com/GitSquared/edex-ui)**
  - Copyright (c) 2017-2021 Gabriel "Squared" Saillard
  - Created by Gabriel "Squared" Saillard ([gaby.dev](https://gaby.dev))
  - Licensed under the GNU General Public License v3.0

---

<p align="center">Copyright © 2026 elecxzy project</p>
