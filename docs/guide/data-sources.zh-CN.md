[English](data-sources.md) | [日本語](data-sources.ja.md) | 简体中文

# 网络访问与数据来源 — elecdex

elecdex 是面向 Windows、macOS 和 Linux 的桌面终端模拟器兼系统监视器。本页列出它连接的每个地方、发送的内容、频率以及适用的条款。页面本身（渲染进程）没有网络访问权限（`connect-src 'self'`）；下面的每个请求都由主进程发出，且只在某个窗格或设置需要这些数据时进行。没有遥测或使用统计。IP 地址所属国家由内置的 GeoIP 数据库判断，从不使用在线查询服务。

| 数据 | 来源 | 说明 |
| --- | --- | --- |
| 天气（日本） | [日本气象厅](https://www.jma.go.jp/) 预报 JSON：`https://www.jma.go.jp/bosai/forecast/data/forecast/<office code>.json` | 直接以 JSON 读取，而不是从网页抓取。这是 JMA 自己的[预报页面](https://www.jma.go.jp/bosai/forecast/)加载的数据，并非公开文档化的 API，因此解析时较为宽松，获取失败时屏幕上保留最后一次的预报。只在天气窗格显示日本的地点时获取，时间围绕 JMA 的发布时刻（日本时间 0、5、11 和 17 点），使用条件请求。依据 JMA 的[使用条款](https://www.jma.go.jp/jma/kishou/info/coment.html)使用，条款要求注明「出典：気象庁ホームページ（https://www.jma.go.jp/bosai/forecast/）を加工して作成」；窗格中会显示这一署名，并注明该 JSON 所属的预报页面。 |
| 天气（美国） | [National Weather Service](https://www.weather.gov/)（api.weather.gov） | 开放数据。定点查询结果保留一天；预报约每小时请求一次，且只在有窗格显示该地点时请求。 |
| 天气（其他地区） | [MET Norway](https://api.met.no/) Locationforecast 2.0 | [CC BY 4.0](https://api.met.no/doc/License)，在窗格中署名。请求遵循其[服务条款](https://api.met.no/doc/TermsOfService)：可识别的 User-Agent，坐标保留四位小数，在上次响应的 `Expires` 之前不再请求（且至少间隔 30 分钟），使用 If-Modified-Since。 |
| 天气选择器的城市列表 | [GeoNames](https://www.geonames.org/)（人口 50 万及以上的城市，以及各国首都） | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)；内置。在选择器中输入的内容不会发送到任何地方。 |
| 行情报价 | [Yahoo Finance](https://finance.yahoo.com/)，通过 yahoo-finance2 | 非官方 API，未获 Yahoo 认可；报价可能延迟，不构成投资建议（窗格中有注明）。只在行情窗格打开时获取：每分钟一次批量请求（所列市场全部休市时每五分钟一次），每张图表每五分钟（1D）到每小时（6M 及更长）一次。 |
| 地震 | [日本气象厅](https://www.jma.go.jp/) 地震列表 JSON：`https://www.jma.go.jp/bosai/quake/data/list.json` | JMA 自己的[地震页面](https://www.jma.go.jp/bosai/map.html#contents=earthquake_map)加载的数据（约一个月的报告），以 JSON 读取。只在地震窗格可见或地震警报开启时获取：按其 `max-age=60` 的要求每分钟一次，并带 If-None-Match，因此列表未变时返回 304。依据 JMA 的[使用条款](https://www.jma.go.jp/jma/kishou/info/coment.html)使用；窗格中注明「出典：気象庁ホームページ（URL）を加工して作成」，警报中注明 JMA。并非紧急地震速报。 |
| 海啸（日本） | JMA 海啸列表 JSON：`https://www.jma.go.jp/bosai/tsunami/data/list.json` 及其列出的各份报告 | 与地震列表一起检查（通常是空列表，首次请求之后为 304）；新报告的详情只获取一次。计入警报、大海啸警报和注意报；预报和解除不计入。署名方式与地震相同。 |
| 地震（全球） | [USGS](https://earthquake.usgs.gov/) 实时数据源 `summary/4.5_day.geojson` | 公有领域。只在地震窗格或警报使用全球数据源时获取：每分钟一次（按其 `max-age=60`），使用条件请求。 |
| 海啸（全球） | [NOAA 海啸预警中心](https://www.tsunami.gov/)：太平洋（`PHEBAtom.xml`）和国家（`PAAQAtom.xml`）的 Atom 源 | 公有领域。每个源包含该中心的最新公报；计入警报、观察、注意报和威胁信息，信息声明不计入。与 USGS 数据源一起检查，使用条件请求。警报中会提示遵循当地政府的指示。 |
| RSS 订阅源 | 你在 RSS 窗格中列出的订阅源 URL | 由应用获取，从不由页面获取，且只在有窗格列出它们时获取：每 15 分钟一次（或按订阅源的要求，至少每小时一次），使用条件请求（If-None-Match / If-Modified-Since），同时最多两个，每个最大 2 MB，不带 cookie，User-Agent 为 `elecdex/<version>`。标题以纯文本显示；每个订阅源最后的标题保存在应用数据文件夹的 `feeds-cache.json` 中。不会向任何其他网站发送任何东西。 |
| AI 聊天 | 你在 *Settings -> AI* 中列出的提供方：你电脑或局域网中的服务器，或托管 API（Anthropic 通过其[官方 SDK](https://github.com/anthropics/anthropic-sdk-typescript)；其余通过 OpenAI 兼容的 `chat/completions`） | 由应用请求，从不由页面请求，且只在你发送消息、按 **test** 或打开窗格的模型列表时请求——放在布局中的聊天窗格不会调用任何服务。发送的内容是到目前为止的对话（包括你附上的文件）、你的系统提示词和模型名称，只发往你选择的地址，不发往别处；各提供方自己的条款和数据保留政策适用。*unreleased*：Anthropic 方言的请求允许 Claude 使用 Anthropic 的网络搜索（`web_search`，一次回答最多 5 次）；是否搜索由 Claude 决定，搜索在 Anthropic 进行并按次计费，引用的网页按 Anthropic 的要求列在回答下方。不带 cookie，不跟随重定向。API 密钥由操作系统（DPAPI、Keychain、桌面环境的密钥环）加密后存入 `ai-keys.json`，与 `settings.json` 分开，且不会再显示出来；系统无法加密时，密钥只保存在内存中，直到 elecdex 退出。密钥只发往输入它时的地址：更改提供方的地址后，在重新输入密钥之前不会发往任何地方。对于你的电脑和局域网之外的明文 http 地址，会拒绝使用密钥。没有自己的密钥时，Anthropic SDK 会在它惯常的位置查找（`ANTHROPIC_API_KEY`、`ant auth login` 配置）。在 Anthropic 自己的端点上，请求 `claude-opus-5` 和 `claude-fable-5-1` 时会启用服务端回退（`fallbacks: "default"`），这样被其安全分类器拒绝的请求会在同一次调用中改由另一个 Claude 模型重新运行；回答会注明写出它的模型。对话以文件形式保存在应用数据文件夹的 `chats/` 中。 |
| ELEC system | 同样的提供方，按每个席位的指定 | 与 AI 聊天相同，且只在你提交议案（或打开模型列表）时请求：向每个单元发送它的立场、投票说明和议案——第二轮还会发送其他单元的第一轮陈述。每轮三个请求，共一轮或两轮。评议以文件形式保存在应用数据文件夹的 `elec/` 中。 |
| 网页窗格 | 你在 Browser、YouTube 或 X 窗格中打开的网站 | 由应用的沙箱化浏览器视图像普通浏览器一样加载，且只在这类窗格存在时加载；elecdex 本身不向它们发送任何东西。Cookie 和网站数据保存在应用数据文件夹中（`Partitions/web`），直到执行 *sign out of all sites*。YouTube 和 X 依据其各自的条款使用。 |
| 轨道根数 | [CelesTrak](https://celestrak.org/) GP 数据（来自第 18 和第 19 太空防御中队，经由 [Space-Track.org](https://www.space-track.org/)）：`GROUP=stations` 为 OMM JSON，`GROUP=starlink` 为 TLE | 位置在你的电脑上计算；只下载轨道根数。遵循 CelesTrak 的[使用政策](https://celestrak.org/usage-policy.php)：只在 ORBIT 窗格显示该组时获取，空间站最多每天两次，Starlink 最多每天一次（CelesTrak 每两小时更新一次），保存在磁盘上并跨重启保留，使用可识别的 User-Agent，收到非 200 的任何响应后一天内不再请求。在窗格中署名。 |
| Wi-Fi 窗格 | 你自己的网关，以及 `1.1.1.1`（网络状态窗格本来就在 ping 的主机） | 每秒各一次 ping，且只在 Wi-Fi 窗格显示在屏幕上时进行；对互联网的 ping 与网络状态窗格读取的是同一个，因此不会重复询问同一主机。其余一切——信号、信道、连接日志——都从操作系统读取，从不询问外部服务。在 Windows 上网络名称取自连接配置文件，任何需要位置权限的内容（BSSID、扫描）都不读取；在 macOS 上没有定位服务时网络名称保持隐藏，而 elecdex 从不请求该权限。 |
| Ethernet 窗格 | 你自己的网关（从有线网卡自己的地址发出），以及 `1.1.1.1` | 与 Wi-Fi 窗格相同：每秒各一次，只在窗格显示在屏幕上时进行，对互联网的 ping 与 Wi-Fi 窗格和网络状态窗格读取的是同一个。链路、计数器和驱动设置从操作系统读取，从不更改；不读取网卡的 ID 和网络名称。 |
| 更新检查 | [GitHub Releases API](https://docs.github.com/rest/releases/releases#get-the-latest-release) | 启用时（默认）在启动 15 秒后请求一次最新发布的版本，此后每天一次。不下载也不安装任何东西：有新版本时会显示一条通知，点击打开其页面。 |

另见：[指南目录](index.zh-CN.md) · [第三方资源](../../README.zh-CN.md#第三方资源)
