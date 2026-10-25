[English](develop.md) | [日本語](develop.ja.md) | 简体中文

# 开发 — elecdex

elecdex 是面向 Windows、macOS 和 Linux 的科幻风格终端模拟器兼系统监视器，是用 Electron 45、Svelte 5、TypeScript 7 和 xterm.js 6 从零重写的 eDEX-UI，采用 GPL-3.0 许可。本页面向构建和修改它的人：为什么要重写、技术栈及其版本、如何从源码安装和运行、各项命令、测试的组织方式、设计文档在哪里，以及如何发布。它在 Windows 上开发和使用；macOS 和 Linux 只经过 GitHub Actions 上端到端测试的构建和运行，尚未经过充分的人工验证。

## 本页内容

- [为什么要重写](#为什么要重写)
- [技术栈](#技术栈)
- [入门](#入门)
- [命令](#命令)
- [测试](#测试)
- [源码结构](#源码结构)
- [设计文档与规则](#设计文档与规则)
- [发布流程](#发布流程)

## 为什么要重写

eDEX-UI 被归档时，用其作者的话说，代码库"极需一次彻底的重构"。elecdex 保留了它的理念，抛弃了它的实现：

| eDEX-UI | elecdex |
| --- | --- |
| PTY 通过 localhost WebSocket 隧道传输（端口 3000+） | `MessageChannelMain`，每个会话一个通道；没有监听套接字 |
| `nodeIntegration: true`、`contextIsolation: false`、`@electron/remote` | `sandbox: true`、`contextIsolation: true`，单一的带类型 preload 桥；渲染进程无法访问网络或文件系统 |
| 每个核心 fork 一个 `cluster`；每个组件用自己的定时器轮询 `systeminformation` | 一个 `utilityProcess` 加一个由订阅驱动、无人关注时即停止的调度器；在 Windows 上用一个常驻采样器代替每次读取启动一个 PowerShell（实测监控开销从单核的 144% 降至 14%） |
| 通过轮询 `/proc`、`lsof` 和 `ps` 跟踪 CWD——不支持 Windows | shell 集成（`OSC 7` / `OSC 9;9` / `OSC 133`），因此 Windows 也能用 |
| 五个硬编码的屏幕区域，五个终端标签页 | 持久化的布局树：窗格、分屏和标签页数量不限 |
| 没有打包工具；以后处理方式压缩 | electron-vite（Vite + Rollup） |

与 eDEX-UI 的不同还有：构建后的页面从 `app://elecdex` 而不是 `file://` 提供，内容安全策略为 `connect-src 'self'`；所有网络请求都由主进程发出；主题是经过校验的数据，被转换为 CSS 变量，从不以字符串拼接进 `<style>` 标签。

## 技术栈

Electron 45 · TypeScript 7 (native) · electron-vite 6 / Vite 8 · Svelte 5 (runes) · `@xterm/xterm` 6 · node-pty 1.1 · systeminformation · three · zod 4 · Biome 2 · Vitest 5 · Playwright · electron-builder 26

| 部分 | 包和版本（package.json） |
| --- | --- |
| 运行时 | `electron` 45.0.0；工具需要 Node.js 22 或更高版本（`engines`） |
| 语言 | 类型检查用 TypeScript 7（`@typescript/native` 7.0.2），JavaScript API 用 `typescript` 6.0.3；`strict`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、`erasableSyntaxOnly` |
| 构建 | `electron-vite` 6.0.0、`vite` 8.3.5；页面以压缩形式构建 |
| 界面 | `svelte` 5.57.2（runes）、`svelte-check` 4.7.7 |
| 终端 | `@xterm/xterm` 6、`@xterm/headless` 6、`node-pty` 1.1 |
| 系统读数 | `systeminformation` 5.33，运行在 `utilityProcess` 中；Windows 上是常驻采样器 |
| 地球 | `three` 0.186 |
| 校验 | `zod` 4.6 |
| 插件 | `sucrase` 3.35.1（把 TypeScript 转换为插件 Worker 的模块） |
| AI | `@anthropic-ai/sdk` 1.1.0（首次使用时加载）；其他提供方走 OpenAI 兼容的 HTTP |
| Lint 与格式化 | `@biomejs/biome` 2.6.2（不使用 ESLint 或 Prettier）；认知复杂度不超过 15 |
| 测试 | `vitest` 5.0.5、`jsdom` 30.1.3、`@testing-library/svelte` 5.4.2、`@playwright/test` 1.64.1 |
| 打包 | `electron-builder` 26.15.3 |

库的版本固定为最新发布版；例外记录在 [docs/decisions.md](../decisions.md) 中（例如 `@types/node` 跟随 Electron 的 Node）。

## 入门

```bash
npm ci
npm run dev -- -- --windowed --no-intro   # the second -- hands flags to Electron; npm start is the same
```

| 应用参数 | 作用 |
| --- | --- |
| `--windowed` | 不全屏（默认全屏） |
| `--no-intro` | 跳过启动动画 |

- 在 **Windows 和 macOS** 上不需要原生工具链：node-pty 自带预编译的 N-API 二进制文件，Electron 可以直接加载。
- 在 **Linux** 上，node-pty 会在安装时编译一次（需要 `python3`、`make` 和 C++ 编译器）；npm 11 会先要求批准：`npm install-scripts approve node-pty && npm rebuild node-pty`。
- Electron 二进制文件由本项目的 `postinstall` 脚本下载（Electron 45 自身没有安装脚本，而 electron-vite 不会触发其首次使用时的下载），该脚本还会让 node-pty 在 macOS 上的 `spawn-helper` 具有可执行权限。如果用了 `--ignore-scripts`，请运行一次 `npx install-electron`。`npm run dev` 以 "Electron uninstall" 失败时，原因就在这里。

## 命令

### 构建与检查

```bash
npm run verify       # lint + typecheck + unit/component tests
npm run build        # bundle main / preload / renderer into out/
npm run test:e2e     # Playwright against the built app (run build first)
npm run test:e2e:smoke # a few minutes of the e2e: launch and the mount and lifecycle contracts
npm run test:packaged  # the packaged app from release/ started once (after package)
npm run package      # installers into release/
```

| 命令 | 作用 |
| --- | --- |
| `npm run dev` / `npm start` | electron-vite 开发服务器和应用 |
| `npm run verify` | `biome check .`、类型检查（node、e16c、e2e，以及用 `svelte-check --tsgo` 检查 web）和 `vitest run` |
| `npm run build` | 生产构建到 `out/`，并根据构建所打包的内容生成 `out/THIRD_PARTY_NOTICES.txt` |
| `npx playwright test`（`npm run test:e2e`） | 针对 `out/` 的整套端到端测试，`@perf` 测试最后运行；`--project=e2e` 会排除它们 |
| `npm run test:e2e:smoke` | 启动，以及 mount 和 lifecycle 契约：提交前快速检查（先构建） |
| `npm run package` | 安装包输出到 `release/` |
| `npm run package:dir` | 未打包的应用输出到 `release/win-unpacked`（macOS 或 Linux 为对应目录） |
| `npm run test:packaged` | 通过 CDP 启动一次 `release/` 中打包好的应用（在 `package` 或 `package:dir` 之后） |
| `npm run lint:fix` / `npm run format` | Biome 的修复和格式化 |

单个测试：

```bash
npx vitest run tests/unit/<file>.test.ts
npx playwright test tests/e2e/<folder>/<file>.spec.ts -g "<name>"   # folders: app, workspace, panes, extensions, contracts
```

### 生成器与工具

| 命令 | 生成的内容 |
| --- | --- |
| `npm run gen:icon` | `build/icon.svg` → `build/icon.png` 和 `resources/icons/icon.png` |
| `npm run gen:card` | README 横幅 `public/elecdex_repo_card.svg` |
| `npm run gen:geo` | 地球的陆地点、各国中心点、时区表 |
| `npm run gen:cities` | 天气选择器的城市列表（GeoNames） |
| `npm run gen:orbit-map` | ORBIT 地图：陆地点和时区线（timezone-boundary-builder，ODbL） |
| `npm run gen:chip8` | CHIP-8 程序库和预览，`resources/chip8/programs.json` |
| `npm run gen:elec16` | ELEC-16 的 ROM（经 e16c 编译的 BASIC、汇编）、SOFT CARD 和游戏架 |
| `npm run gen:screenshots` | 在演示配置下生成 README 截图（Windows；先构建） |
| `npm run demo:*` | 在替身数据上运行应用的录屏（Windows；先构建）；每个的制作方法见 [docs/demos.md](../demos.md) |
| `node scripts/log-feed.mjs [file] [--format=…] [--rate=20]` | 用于手动试用 LOG WATCH 的虚构日志 |
| `node scripts/instruments-wav.mjs [dir] [voice]` | 把插件的乐器导出为 WAV 文件来试听 |
| `node scripts/sync-calc.mjs <elecxzy>` | 用 elecxzy 的检出覆盖内置的计算器（`src/shared/calc/vendor`，从不手动编辑） |

## 测试

端到端测试从不连接真实服务，也从不触碰运行它们的机器：天气、行情和更新检查都指向关闭的端口或本地桩服务（JMA 的地震和海啸列表连同天气预报，以及 USGS 和 NOAA 的数据源），RSS 订阅源、AI 提供方、插件主机和网页窗格的网站由本地服务器提供，声音、通知区域图标、登录启动项、套接字表和 API 密钥加密都使用替身。整套测试需要几分钟；发布前会完整运行，平时的改动则运行它可能影响到的测试。

| 文件夹 | 运行器 | 内容 |
| --- | --- | --- |
| `tests/unit/` | Vitest，Node | 纯逻辑、schema，以及由测试守护的规则（生命周期表中包含每个窗格、每个主题都设置了每个变量等） |
| `tests/component/` | Vitest + jsdom + Testing Library | Svelte 组件 |
| `tests/e2e/app/` | Playwright `_electron` | 整个应用：启动、开机动画、设置、退出、单实例、后台、插件隔离、从旧配置升级 |
| `tests/e2e/workspace/` | Playwright | 布局、已保存布局、预设、移动窗格、放大、操作面板 |
| `tests/e2e/panes/` | Playwright | 每个窗格一个 spec |
| `tests/e2e/extensions/` | Playwright | 插件（API 1 和 2、KEYSTREAM）和网页预设 |
| `tests/e2e/contracts/` | Playwright | 覆盖每个窗格、按键、对话框和 IPC 方法的表驱动检查：mount、lifecycle、持久化、动效、主题、快捷键、IPC、故障、署名、无外部请求 |

- Playwright 有两个项目：`e2e`（除 `@perf` 外的全部）和随后运行的 `perf`（空闲预算和 CPU 测量）。
- 桩服务通过 `tests/e2e/support.ts` 设置的环境变量（`STUB_ENV`）启用，例如 `ELECDEX_AUDIO_STUB=1`、`ELECDEX_WIFI_STUB=1` 或 `ELECDEX_DOCKER_STUB=1`。
- 端到端测试套件的设计（每类检查放在哪里以及原因）：[docs/e2e-design.md](../e2e-design.md)（日文）。
- 如果测试之外还有 elecdex 在运行（已安装的应用，或开着的 `npm run dev`），启动和拖动会失败；报告器会把这一情况记录到 `test-results/elecdex-running.log`。

## 源码结构

```
src/shared/     contracts shared by all processes (API types, IPC channel names, schemas, pure logic)
src/main/       app lifecycle, window, IPC handlers, pty, weather, markets, feeds, quakes, launcher,
                audio, plugins, web panes, reminders, running in the background, updates
src/preload/    the one and only contextBridge surface
src/renderer/   Svelte 5 UI: layout tree, widgets, the plugin host, dialogs, design tokens
src/services/   utilityProcess: the metrics collector
examples/       the sample plugins (pomodoro, and KEYSTREAM for API version 2)
tests/          unit (vitest) · component (vitest + jsdom) · e2e (playwright _electron; docs/e2e-design.md)
scripts/        asset generators (icon, banner, globe data, city list, README screenshots)
docs/           architecture.md (the design, in Japanese), decisions.md (the decision log,
                in Japanese), plugins.md, weather-providers.md, elec16.md (the ELEC-16 design),
                elec16-basic.md, elec16-e16.md, elec16-e16c.md, elec16-soft.md, elec16-play-manual.md, elec16-kit.md,
                elec16-sci-manual.md (the ELEC-16 manuals, elec16-sci.md the calculator's design,
                in Japanese)
```

## 设计文档与规则

| 文档 | 内容 |
| --- | --- |
| [docs/architecture.md](../architecture.md) | 设计，按节组织，每个窗格一节（日文） |
| [docs/decisions.md](../decisions.md) | 每项决定及其理由，以及所依据的实测数据（日文） |
| [docs/plugins.md](../plugins.md) | 插件 API（日文） |
| [docs/e2e-design.md](../e2e-design.md) | 端到端测试的设计（日文） |
| [docs/weather-providers.md](../weather-providers.md) | 天气服务及其条款 |
| [docs/palette.md](../palette.md)、[docs/cluster.md](../cluster.md)、[docs/logwatch.md](../logwatch.md) | 操作面板、CLUSTER 窗格和 LOG WATCH 窗格 |
| [docs/elec16.md](../elec16.md)、[docs/emu.md](../emu.md) | ELEC-16 窗格，以及各模拟器共用的基础 |
| [docs/demos.md](../demos.md) | 演示的制作、修改和录制 |
| [docs/guide/data-sources.zh-CN.md](data-sources.zh-CN.md) | 每个网络连接、发送的内容及适用条款 |

改动必须遵守的规则——安全边界、网络在哪里运行、测试可以触碰什么——见 [CLAUDE.md](../../CLAUDE.md)；单个窗格或子系统的规则见 [.claude/rules/](../../.claude/rules)。

## 发布流程

1. 在 `package.json` 中设置 `version`，提交并推送。
2. 给该提交打上 `v<version>` 标签并推送标签：`git tag v0.1.0 && git push origin v0.1.0`。
3. Release 工作流会核对标签与 `package.json` 是否一致，运行 lint、类型检查和单元测试，创建一个带自动生成说明的 GitHub 预发布，并附上 Windows（x64、arm64）、macOS（arm64、x64）和 Linux（AppImage 和 deb，x64 和 arm64）的安装包。
4. 检查预发布，准备好后取消勾选 "Set as a pre-release"。更新检查会忽略预发布，所以只有到那时，正在运行的副本才会提示新版本。

- 工作流（[.github/workflows/release.yml](../../.github/workflows/release.yml)）还会在运行器能运行自己构建产物的情况下，把每个安装包按用户拿到的样子启动一次（交叉构建的 Windows arm64 和 macOS x64 除外）。
- 构建未经签名；各操作系统会显示什么警告以及如何继续，见 README 的 *出现警告时*。
- 维护者的完整清单（打标签前运行整套测试和打包后的应用，发布后检查发布内容）见 [CLAUDE.md](../../CLAUDE.md) 中的 *Releases*。

另见：[键盘与布局](keyboard.zh-CN.md) · [主题与设置](themes-settings.zh-CN.md) · [插件](plugins-use.zh-CN.md)
