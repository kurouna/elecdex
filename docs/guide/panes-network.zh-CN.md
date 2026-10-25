[English](panes-network.md) | [日本語](panes-network.ja.md) | 简体中文

# 网络窗格 — elecdex

elecdex 是一款面向 Windows、macOS 和 Linux 的科幻风格终端模拟器兼系统监视器，是用 Electron 对 eDEX-UI 的重写。本页介绍关于本机网络的窗格：网络状态、网络流量、显示连接去向的世界视图、列出每个 TCP 套接字的表格（Connections），以及两个链路诊断窗格 Wi-Fi 和 Ethernet。每个窗格都说明它在哪个平台上读取什么、多久读取一次，以及从不读取什么：不在线查询任何地址（对端由内置的 GeoIP 数据库定位），也不读取任何需要操作系统定位权限的内容（没有 Wi-Fi 的 BSSID，也不扫描）。elecdex 在 Windows 上开发和使用；macOS 和 Linux 只在 GitHub Actions 的自动测试中构建和运行过，未经充分的手动验证。

本页内容：

- [网络读数的读取方式](#网络读数的读取方式)
- [Network status](#network-status)
- [Network traffic](#network-traffic)
- [World view](#world-view)
- [Connections](#connections)
- [Wi-Fi](#wi-fi)
- [Ethernet](#ethernet)

系统栏中的其他窗格见[系统窗格](panes-system.zh-CN.md)。elecdex 连接的所有主机都列在[网络访问与数据来源](data-sources.zh-CN.md)中。

## 网络读数的读取方式

- 页面（渲染进程）没有网络访问权限。本页的所有读数都由运行在独立 utility process 中的指标采集器读取，而且只在有窗格订阅时（[系统窗格：读取方式](panes-system.zh-CN.md#读取方式)）。
- 在 Windows 上，频繁的读数来自一个常驻的 PowerShell（`WindowsSampler`），它循环读取 .NET 和 Win32 API（IP Helper、ICMP、WLAN API、性能计数器）——从不为每次读取启动进程。
- **一次 ping 供三个窗格使用。** 对互联网的 ping 发往 `1.1.1.1`。网络状态、Wi-Fi 和 Ethernet 三个窗格读取同一次往返，因此从不重复询问同一主机。只有网络状态时每 5 秒一次；Wi-Fi 或 Ethernet 窗格显示在屏幕上时每秒一次。ping 由采集器发出，从不由主进程发出。
- **私有读数。** 套接字表（`net.sockets`）、Wi-Fi 读数（`net.wifi`、`net.wifi.events`）和 Ethernet 读数（`net.ethernet`）永远不能授予插件：它们说明了这台机器去过哪里、在和什么通信。网络状态、流量和按国家统计的连接数可以授予。

| 指标源 | 周期 | 使用的窗格 |
| --- | --- | --- |
| `net.interface` | Windows 上 5 秒，其他平台 30 秒 | 网络状态、Cluster |
| `net.ping` | 5 秒（Wi-Fi 或 Ethernet 在屏幕上时每秒一次，共用） | 网络状态、网络流量、世界视图、Cluster |
| `net.throughput` | 1 秒，后台标签页中也继续采样 | 网络流量、Cluster |
| `net.connections` | 5 秒 | 世界视图、Cluster |
| `net.sockets` | Windows 上 5 秒，其他平台 3 秒；只在可见时 | 连接 |
| `net.wifi` / `net.wifi.events` | 1 秒 / 5 秒；只在可见时 | Wi-Fi |
| `net.ethernet` | 1 秒；只在可见时 | Ethernet |

## Network status

| | |
| --- | --- |
| 位置 | 系统栏（除 cockpit 和 blank 外的所有预设）；选择器名称 *network status* |
| 读取 | `net.interface`（持有默认路由的网卡）和 `net.ping` |
| 平台 | Windows：采样器（网络接口用 IP Helper，ping 用 ICMP）。macOS、Linux：systeminformation，或正在运行的 Wi-Fi 或 Ethernet 窗格的 ping |

- 三个数值：**STATE**、网络接口的 **IPV4** 地址，以及到 `1.1.1.1` 的 **PING**（毫秒）。副标题是网络接口的名称。
- **ONLINE** 表示网络接口已启用*并且* ping 的目标有应答：网络接口可能已启用但没有通往外部的路由，此时显示 **OFFLINE**。尚无读数时为 **UNKNOWN**。
- 没有默认路由时，Windows 会退而选择任何有地址的真实网卡（从不选回环），并显示为 down。
- 没有 ⤢ 按钮：只有几个数值的窗格铺满窗口并无益处。
- elecdex 在 Windows 上从不调用 systeminformation 的 Wi-Fi 函数或网络接口列表：它们会运行 `netsh wlan`，而 Windows 11 把它视为位置访问并弹出权限对话框。

## Network traffic

| | |
| --- | --- |
| 位置 | 系统栏（除 cockpit 和 blank 外的所有预设）；选择器名称 *network traffic* |
| 读取 | `net.throughput`（1 秒，后台标签页中也继续采样）和 `net.ping` |
| 平台 | Windows：采样器读取的网卡字节计数（持有默认路由的网卡）。macOS、Linux：systeminformation 对默认网络接口的统计 |

- 累计流量（`OUT` 和 `IN`），以及一张以 MB/s 标注的曲线图：上传在坐标轴上方，下载在下方镜像显示，共用一个由较大方向决定的刻度。
- 在其他标签页之后或窗口收起时，流量仍继续采样，因此窗格再次可见时曲线不会断开；窗格上写的累计值只在可见时更新。

## World view

| | |
| --- | --- |
| 位置 | standard、network 和 earth 预设；选择器名称 *world view* |
| 读取 | `net.connections`（5 秒）：已建立的 TCP 连接中的公网对端，用内置的 GeoIP 数据库按国家定位 |
| 平台 | Windows：采样器的 TCP 表。Linux：`/proc/net/tcp` 和 `/proc/net/tcp6`。macOS：`netstat -anp tcp` |
| 隐私 | 不向任何地方发送地址。从不询问操作系统的定位服务 |

<p align="center">
  <img src="../screenshots/pane-globe.jpg" alt="单独的世界视图窗格：由陆地点阵构成的旋转地球，从本机所在国家到各连接对端国家的弧线，以及连接数和国家数">
  <br><sub>世界视图</sub>
</p>

- 在旋转的地球上按国家显示连接，并列出连接数、国家数，以及连接最多的六个国家。
- **"你在这里"**是系统时区所在的国家（时区无法对应国家时则用区域设置的国家，并标为 *approx.*）。从不询问操作系统的定位服务，因为那会弹出权限请求；eDEX-UI 则是向在线 IP 查询服务询问。两者都得不到国家时，窗格会一次性显示 *location unavailable*，连接仍照常显示。
- 当地震列表因其他原因正在保持更新时（开启了地震提醒，或地震窗格可见），地震会标在地球上；地球本身从不让应用去获取它。见[外部世界窗格](panes-world.zh-CN.md)。
- 地球占用一个 WebGL 上下文，窗格关闭时归还。它在共享的 10 fps 帧循环上绘制，而不是用自己的定时器；窗格或窗口隐藏时不绘制，开启减少动态效果时保持静止。
- 窗格中显示的署名：**GeoIP: NRO, CC BY 4.0 · map: Natural Earth**。数据库为 [`@ip-location-db/geo-whois-asn-country-mmdb`](https://github.com/sapics/ip-location-db)，数据来自 [NRO](https://www.nro.net/)，采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。

## Connections

| | |
| --- | --- |
| 位置 | network 预设（世界视图下方）；选择器名称 *connections*；可以打开多个 |
| 读取 | `net.sockets`：内核的 TCP 表以及持有每个套接字的进程；国家来自同一个内置 GeoIP 数据库 |
| 更新 | Windows 上每 5 秒（采样器自己的周期），其他平台每 3 秒；只在窗格显示在屏幕上时（在后台标签页中什么都不读） |
| 平台 | Windows：采样器中的 `GetExtendedTcpTable`。Linux：`/proc/net/tcp*`，所属进程来自 `/proc/<pid>/fd`。macOS：`netstat`，无法给出所属进程 |
| 隐私 | 不做任何在线查询；从不访问监听程序的端口；该读数永远不能授予插件 |

<p align="center">
  <img src="../screenshots/pane-connections.jpg" alt="单独的连接窗格：顶部是国家条，下面按持有它们的程序分组列出 TCP 套接字，每行有本地端口、对端、服务和国家">
  <br><sub>连接</sub>
</p>

- 本机持有的每个 TCP 套接字，按持有它的程序分组：本地端口、对端、该端口通常用于什么服务，以及对端所在的国家。顶部的条汇总对端所在的国家。
- **ACTIVE** 和 **LISTENING** 在连接和监听中的套接字——也就是这台机器敞开的门——之间切换。筛选框可以缩小显示的行。
- 在两次读取之间打开又关闭的连接仍会以删除线画出一次，因此短暂的连接也不会隐形。
- **MASK** 会隐藏每个地址的后半部分，便于截图或共享屏幕。
- 监听中的程序会说明它在提供什么服务，这是从它的命令行判断的——`node` 会显示为 `vite · my-app`。每个监听进程的命令行只读一次，只保留由它得出的工具和项目，从不保留命令行本身，因为参数中可能带有令牌。从不连接那个端口。
- 发送给页面的行最多 240 行。

| 平台 | 表 | 所属进程 |
| --- | --- | --- |
| Windows | 在常驻采样器中由 C# 调用 `GetExtendedTcpTable`（iphlpapi） | 进程 ID，用采样器在同一周期读取的进程表命名 |
| Linux | `/proc/net/tcp` 和 `/proc/net/tcp6`，不启动进程 | 把套接字的 inode 与 `/proc/<pid>/fd` 的链接对照；只查表中出现的 inode，并在两次读取之间缓存 |
| macOS | `netstat -an -p tcp` | 无法得知，窗格会注明。用 `lsof` 每次读取都要多启动一个进程、花几百毫秒 |

## Wi-Fi

| | |
| --- | --- |
| 位置 | network 预设（Ethernet 上方）、cockpit 预设（右栏）；选择器名称 *Wi-Fi status*；标题 WI-FI |
| 读取 | 从操作系统读取无线网卡的链路和计数器，每秒对网关和 `1.1.1.1` 各 ping 一次，操作系统的连接日志（Windows） |
| 更新 | 每秒一次，只在窗格显示在屏幕上时；隐藏时什么都不读（时间线上留下空白） |
| 平台 | Windows：通过采样器使用 WLAN API 和 WinRT。Linux 和 macOS：只对解析器做过单元测试，未在真机上使用 |
| 隐私 | 不读取任何需要定位权限的内容：没有 BSSID，也不扫描周围的网络。不提供给插件。**MASK** 隐藏网络名称和地址 |

<p align="center">
  <img src="../screenshots/pane-wifi.jpg" alt="单独的 Wi-Fi 窗格：从 PC 经无线电和网关到互联网的路径及判定、信号仪表和频段图、信号、重传、往返时间和丢包的时间线，以及日志">
  <br><sub>Wi-Fi</sub>
</p>

无线连接在哪里出了问题：通话卡顿，或列车上的 Wi-Fi 反复掉线时用来找原因。

- **路径。** 从本机到互联网的路径被逐段测量：无线电的信号与重传、每秒对网关和互联网各一次 ping、本机自己发送的流量。窗格指出出问题的那一段并给出依据的数值：

  | 判定 | 含义 |
  | --- | --- |
  | RADIO | 本机与接入点之间信号弱或重传多 |
  | LOCAL LINK | 网关应答慢、不稳定或丢失 ping |
  | UPSTREAM | 网关之外的路径慢、不稳定或丢包 |
  | UPSTREAM LOST | 接入点有回应、更远处没有（网关有应答时连续四次丢失互联网 ping），比如列车进了隧道 |
  | OWN UPLOAD | 本机自己的上传（500 kB/s 以上）挤占了自己的通话，往返时间随之上升 |
  | SIGN-IN NEEDED | 强制门户正在等待登录 |

  它还会估算通话质量（**MOS**），依据是简化的 ITU-T G.107 E-model。这是语音质量的估计，不是测量值。
- **无线电。** 信号仪表、标出所在信道与 DFS 范围的 2.4、5、6 GHz 频段图、标准与 PHY 速率。
- **时间线。** 1 到 60 分钟，带十字准线：信号、重传、往返时间、丢包、流量和事件。窗格没有观察的时段画上斜线并标注 *NOT WATCHED*。
- **日志。** 系统记录的过去一天的断线及其原因（Windows）、接入点的切换，以及帧计数器。因为不读取 BSSID，接入点的切换是根据保持连接时信道的变化推断的。断线间隔几乎固定时会显示"每 N 分钟"（可能是服务的连接时长上限）。
- **MASK** 隐藏网络名称和地址；**COPY** 把最近几分钟的报告放到剪贴板。
- **说明卡片。** 指针停在任何一项上，都会说明它是什么、据以判断的阈值以及当前读数；判定下方的图例说明其余各项的读法。
- **宽屏。** 在宽屏上放大（**Ctrl+Shift+Z**）时窗格分为两栏，站点之间的连线上画出该段最近一分钟的曲线，日志上方以横条显示过去一天的连接。
- **多个网卡。** 有多个无线网卡时，页眉下方的小标签用来选择跟随哪一个，网关 ping 与历史各自独立（最多 ping 四个网关）。
- 历史由页面保存最多 60 分钟，因此移动窗格后仍在。

判定的阈值（`WIFI_LIMITS`，按最近一分钟判断，先怀疑离本机近的一段，因为近处的问题会出现在其后的每一段上）：

| 数值 | 注意 | 差 |
| --- | --- | --- |
| 信号（RSSI） | -67 dBm | -75 dBm |
| 重传（仅在每秒发送 100 帧以上时显示） | 15% | 30% |
| 网关往返时间 | 20 ms | 60 ms |
| 网关抖动 | 10 ms | 30 ms |
| 网关丢包 | 1% | 5% |
| 互联网往返时间 | 120 ms | 250 ms |
| 互联网抖动 | 30 ms | 60 ms |
| 互联网丢包 | 1% | 5% |

从不应答 ping 的网关不计为丢包。

各平台的读取方式：

| 平台 | 读取内容 |
| --- | --- |
| Windows | 通过常驻采样器：SSID 来自 WinRT 的 `WlanConnectionProfileDetails.GetConnectedSsid`（微软指出的无需定位权限的替代 API）；认证、加密、连通性（强制门户为 `ConstrainedInternetAccess`）和按流量计费来自 WinRT 的连接配置文件；RSSI、信道、无线开关、后台扫描和媒体流模式来自 `wlanapi` 的各个 opcode；标准、链路质量、速率、频率和 MLO 来自实时连接质量 opcode（Windows 11 24H2 起）；重传等帧计数器来自 `WLAN_STATISTICS`；地址、网关、DNS、MTU 和 DHCP 租约来自 .NET。链路和 ping 每秒一次；配置文件和地址只在连接变化时以及每 10 秒读取。`Microsoft-Windows-WLAN-AutoConfig/Operational` 日志（事件 8001、8002、8003：连接、失败、断开）首次读取过去 24 小时，之后每 5 秒只读新记录；不需要管理员权限，只有指定的字段离开脚本 |
| Linux | `iw`、`/proc/net/wireless`、`/sys/class/net`；每个目标一个常驻的 `ping -i 1`。不读取操作系统日志：日志只有窗格看到的内容 |
| macOS | `system_profiler`，每 10 秒；每个目标一个常驻的 `ping`。从 macOS 14.4 起，没有定位服务时网络名称会被隐藏（`<redacted>`），而 elecdex 从不请求定位服务。不读取操作系统日志 |

- **Windows 上从不调用：** `WlanGetNetworkBssList`、`WlanGetAvailableNetworkList`、`WlanScan` 和 `WlanQueryInterface` 的 opcode 7（当前连接）。从 Windows 11 24H2 起，它们需要定位权限并会弹出对话框。单元测试确保采样器脚本中没有它们。macOS 上从不使用 CoreWLAN。
- 对网关的 ping 从网卡自己的地址发出（Windows 用 `IcmpSendEcho2Ex`，Linux 用 `ping -I`，macOS 用 `ping -S`），因此同一路由器上的有线和 Wi-Fi 能区分开。
- 测得的开销（i5-1335U，1920×1080）：读取 Wi-Fi 时，采样器从单核的 1.25% 增至 2.11%，页面比在同一位置放一个时钟多约 1.3%。
- 设计：[architecture.md §5.12](../architecture.md#512-wi-fi-ペイン)（日文）。

## Ethernet

| | |
| --- | --- |
| 位置 | network 预设（Wi-Fi 下方）、cockpit 预设（右栏，Wi-Fi 下方）；选择器名称 *Ethernet status*；标题 ETHERNET |
| 读取 | 从操作系统读取有线网卡的状态、速度、双工、计数器和驱动设置；每秒对网关（从网卡自己的地址）和 `1.1.1.1` 各 ping 一次 |
| 更新 | 每秒一次，只在窗格显示在屏幕上时（时间线上留下空白） |
| 平台 | Windows：通过采样器使用 IP Helper。Linux：sysfs 文件。macOS：`ifconfig` 和 `netstat`，每 10 秒。在 Linux 和 macOS 上只用测试数据运行过 |
| 隐私 | 驱动设置只读不改。网卡的 GUID 和设备 ID、连接配置文件的名称、DNS 后缀和 DHCP 服务器不会离开读取脚本。不提供给插件 |

<p align="center">
  <img src="../screenshots/pane-ethernet.jpg" alt="单独的 Ethernet 窗格：从 PC 经链路和网关到互联网的路径及判定、以阶梯显示速度并列出驱动设置的链路面板，以及时间线">
  <br><sub>Ethernet</sub>
</p>

有线版的 Wi-Fi 窗格：逐段（**PC、LINK、GATEWAY、INTERNET**）指出有线连接在哪里出了问题。

- **判断什么。** 有线故障很少让流量中断，而是让它变慢，所以按变慢的原因判断链路：
  - 从曾有的速度下降（1 Gb/s 降到 100 Mb/s，线缆一对断开）；
  - 半双工；
  - CRC 错误，按十分钟内的数量*和*比例；
  - 一分钟内恢复的断开（在 Windows 和 Linux 上，还会根据系统自己的计数发现一秒以内的断开）；
  - 广播风暴；
  - 其他机器占用网卡的地址（Windows 的 Tcpip 日志，最近一天）。
- **BELOW MAX。** 一直低于网卡上限的链路是对端的问题，只作标注。
- **链路面板**以阶梯（10M 到 10G）显示速度并标出网卡上限，显示双向的链路占用，以及驱动的设置——EEE、Green Ethernet、Gigabit Lite、巨帧、流控——只读不改。阶梯和速度只按速度的判定着色。节能设置只有在开启时见到断开或降速，才会变黄。
- **网关**的 ping 从有线网卡自己的地址发出，因此同一路由器上的有线和 Wi-Fi 能区分开。互联网经由 Wi-Fi 或 VPN 时，INTERNET 站点显示 *via Wi-Fi* 或 *via VPN*，不作判断。
- **日志。** 没有哪个系统日志会记录所有驱动的有线断开，所以日志只有窗格在屏幕上时看到的事（LINK LOST、CONNECTED、SPEED、DUPLEX、UPSTREAM LOST 与 BACK、SIGN-IN、CRC ERRORS、BROADCAST），外加来自 Windows 日志的 ADDRESS CONFLICT。在 Linux 上，窗格没有观察期间的断开会根据 `carrier_down_count` 记为一行。
- **MASK**、**COPY**、说明卡片、时间线和放大后的两栏都与 Wi-Fi 窗格相同。COPY 的报告总是隐藏 MAC 和 IPv6 地址；开启 MASK 时其他地址也会隐藏。
- **问题会说出来。** 读取不到的东西（拒绝应答的驱动、打不开的日志等）会以通知提示一次，并可复制用于报告的文字。窗格继续使用能读到的内容。

阈值（`ETHER_LIMITS`；往返按最近一分钟，链路计数器按最近十分钟）：

| 数值 | 注意 | 差 |
| --- | --- | --- |
| 速度 | 低于这块网卡之前出现过的速度 | 10 Mb/s，或半双工 |
| CRC 错误（10 分钟） | 5 个且 0.01% | 20 个且 0.1% |
| 一分钟内恢复的断开（10 分钟） | 2 | 4 |
| 每秒广播帧（30 秒中位数） | 300 | 3000 |
| 网关往返时间 | 5 ms | 20 ms |
| 网关抖动 | 5 ms | 15 ms |
| 网关丢包 | 3% | 10% |
| 互联网 | 与 Wi-Fi 相同：120 / 250 ms，抖动 30 / 60 ms，丢包 1 / 5% | |

- 多播只显示、不判断（IPTV 每秒超过 1,000 帧）。丢弃和未知协议属于本机一侧，标为 `host`，不判断。
- 链路已启用但没有地址时，先等 45 秒（交换机端口的生成树）再视为故障。
- 在 Linux 上，接在 480 Mb/s 端口上的 USB 网卡若流量在 250 到 350 Mb/s 之间持平 20 秒，会被标为可能接在 USB 2.0 端口上。

各平台的读取方式：

| 平台 | 读取内容 |
| --- | --- |
| Windows | 通过常驻采样器，可见时每秒一次：`GetIfTable2` 中类型 6、物理介质 14、属于硬件接口且不是过滤器的行（一块物理网卡，而不是虚拟行和过滤器行），由只编译一次的 C# 读取状态、速度和计数器。地址、连通性和默认路由的网络接口（`GetBestInterface`）在网卡变化时以及每 10 秒读取。双工、总线和驱动设置（`*SpeedDuplex`、`*EEE`、`*FlowControl`、`*JumboPacket`，以及 Realtek 和 Intel 的节能关键字）在网卡出现时和每次链路启用时，在采样器的另一个运行空间中**按关键字**读取（显示名称会被驱动翻译），从不在采样器的循环上读取。只有两个系统来源，且只在窗格可见时：NDIS 的断开事件（`MSNdis_StatusMediaDisconnect`，无需管理员权限）只按网卡计数、从不解析内容，用于一秒以内的断开；System 日志的 Tcpip 4199 事件（地址冲突）只保留时间和是哪个有线地址，从不保留另一台机器的 MAC |
| Linux | 只读 sysfs：`carrier`、`operstate`（dormant 表示 802.1X）、`speed`、`duplex`、`carrier_down_count`、`statistics/` 中的计数器（CRC、帧和长度错误、丢弃、多播、冲突），以及上级 USB 设备的速度。读不到网卡的最高速度、EEE 和广播数 |
| macOS | `ifconfig` 的 media 行（速度、双工、流控、energy-efficient Ethernet）、`netstat -I -b` 和 `route -n get default`，因为每次都要启动进程，所以每 10 秒读取一次，其间使用上一次的结果 |

**限制（尚未确认）**（architecture.md §5.23.1）：

- 还没有在插着网线的状态下使用过，因此速度、计数器和阈值未在真实故障上验证，窗格可见时采样器的开销也未测量。
- 不读取自动协商和实际生效的流控，只读驱动的设置。一秒以内断开的计数也未在真实的拔插中试过。
- 以厂商自有的 `*SpeedDuplex` 值表示 2.5 / 5 Gb/s 的驱动，其值会被忽略，网卡上限可能显示偏低。还没有在 2.5G 或 5G 网卡上试过。
- Windows 无法识别 USB 2.0 端口；这项检查仅限 Linux。
- 窗格关闭期间的断开在 Windows 和 macOS 上无从得知（在 Windows 上会读取最近一天的地址冲突）。
- 在 Linux 和 macOS 上只用测试数据运行过：解析器做了单元测试，GitHub Actions 上的端到端测试用替身数据通过。

设计：[architecture.md §5.23](../architecture.md#523-ethernet-ペイン有線-lan-の経路診断)（日文）及其样稿 [ethernet-mock](../ethernet-mock/index.html)。
