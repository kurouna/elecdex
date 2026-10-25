[English](index.md) | [日本語](index.ja.md) | 简体中文

# 用户指南 — elecdex

elecdex 是面向 Windows、macOS 和 Linux 的科幻风格桌面终端模拟器兼系统监视器，是 eDEX-UI 基于 Electron 45、Svelte 5 和 TypeScript 7 的完全重写，以 GPL-3.0 发布。本指南逐一说明每个窗格和功能：显示什么、数据从哪里来、多久更新一次、绝不读取或发送什么，以及在各平台上的差异。elecdex 在 Windows 上开发和使用；macOS 和 Linux 版本仅由 CI 测试，尚未经过充分的手动验证。

## 从这里开始

| 页面 | 内容 |
| --- | --- |
| [布局预设](presets.zh-CN.md) | 10 个预设（standard、network、earth、dev、media、desk、ai、cockpit、retro、blank）、按键 Ctrl+Shift+F1 到 F10，以及每个预设中的窗格 |
| [工作区](workspace.zh-CN.md) | 窗格、分屏与标签页、移动与关闭、把窗格放到前面、弹出窗格、已保存的布局、操作面板、动效与声音、后台运行 |
| [键盘快捷键](keyboard.zh-CN.md) | 全部默认按键、如何重新绑定，以及全局显示/隐藏快捷键 |
| [主题与设置](themes-settings.zh-CN.md) | 7 个主题与 `settings.json` |

## 窗格

| 页面 | 窗格 |
| --- | --- |
| [系统窗格](panes-system.zh-CN.md) | Terminal、Clock、System、CPU、Memory、GPU、Disk、Top processes、Cluster、Launcher、Filesystem |
| [网络窗格](panes-network.zh-CN.md) | Network status、Network traffic、World view、Connections、Wi-Fi、Ethernet |
| [开发窗格](panes-dev.zh-CN.md) | AI Agent、Git、Docker、Log Watch |
| [外部世界窗格](panes-world.zh-CN.md) | Orbit、Markets、Weather、RSS、Quakes、地震与海啸提醒 |
| [AI 窗格](panes-ai.zh-CN.md) | AI chat、ELEC system |
| [桌面窗格](panes-desk.zh-CN.md) | Calculator、Notes、Tasks、Timer、Clipboard、Calendar、Utility |
| [媒体窗格](panes-media.zh-CN.md) | Spectrum、Browser、YouTube、X、Mixer、Now playing |
| [复古窗格](panes-retro.zh-CN.md) | CHIP-8、ELEC-16（POCKET、HANDHELD、PLAY-320、SCI-128） |

## 扩展、隐私与开发

| 页面 | 内容 |
| --- | --- |
| [插件](plugins-use.zh-CN.md) | 安装插件、插件请求的权限、示例；API 见 [plugins.md](../plugins.md) |
| [网络访问与数据来源](data-sources.zh-CN.md) | elecdex 连接的每个服务、发送的内容、频率与条款 |
| [开发](develop.zh-CN.md) | 构建、测试与发布 elecdex，以及为什么要重写 |

## 使用手册与设计文档

- ELEC-16（日文）：[BASIC](../elec16-basic.md)、[E16 机器](../elec16-e16.md)、[e16c 与 CODE](../elec16-e16c.md)、[SOFT CARD](../elec16-soft.md)、[PLAY-320](../elec16-play-manual.md)、[SCI-128](../elec16-sci-manual.md)；HTML 快速指南：[袖珍电脑](../elec16-guide/pocket.html)、[科学计算器](../elec16-guide/sci.html)（GitHub 会把 HTML 文件显示为源代码，请在本地检出后打开）
- [架构](../architecture.md) 与 [决策记录](../decisions.md)（日文）：设计，以及每个决策的理由与实测数据
- [插件 API](../plugins.md)
