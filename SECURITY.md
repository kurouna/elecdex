# Security policy

**English** | [日本語](#セキュリティポリシー) | [简体中文](#安全策略)

## Supported versions

elecdex is a pre-release. Only the latest release is supported: fixes land on `main` and ship
with the next release, never as a patch to an older one.

## Reporting a vulnerability

Report it privately through GitHub: the **Security** tab of this repository →
**Report a vulnerability**. Please do not open a public issue, discussion or pull request for it.

Say which version and platform, what an attacker can do, and how to reproduce it. elecdex is
maintained by one person; reports are answered as soon as possible.

## What counts

elecdex's security model is described in the README (*What it is*) and in
[docs/architecture.md](docs/architecture.md) (in Japanese). A report is in scope when something
gets past it, for example:

- the page (the sandboxed renderer) reaching Node, the file system or the network, or a channel
  of `window.elecdex` accepting input main does not validate;
- a plugin doing more than the permissions it was granted;
- a web pane's page reaching elecdex's own API or another pane;
- a stored API key leaving the OS's encrypted store, or sent anywhere but its own provider;
- a request to the network made when no pane needs it, or to a service the guide does not name
  ([docs/guide/data-sources.md](docs/guide/data-sources.md));
- the launcher, the git pane or any other pane running a program or a transport it should refuse.

Out of scope: what a command you type into a shell pane does, the operating system's warning about
the unsigned builds, and faults in the third-party services elecdex reads.

---

## セキュリティポリシー

### 対象のバージョン

elecdex はプレリリースです。対象は最新のリリースだけで、修正は `main` に入り、次のリリースで配布します。古いリリースへの修正版は出しません。

### 脆弱性の報告

GitHub で非公開のまま報告してください。このリポジトリの **Security** タブ → **Report a vulnerability** です。公開の Issue、Discussion、プルリクエストには書かないでください。

バージョンとプラットフォーム、攻撃者に何ができるか、再現の手順を書いてください。elecdex は 1 人で開発しています。できるだけ早く返事をします。

### 対象になるもの

elecdex のセキュリティモデルは README の「elecdex とは」と [docs/architecture.md](docs/architecture.md) に書いてあります。これをすり抜けるものが対象です。たとえば次のものです。

- 画面（サンドボックスのレンダラー）が Node、ファイルシステム、ネットワークに届く。`window.elecdex` のチャネルが、メインプロセスの検証していない入力を受け付ける
- プラグインが、許可された権限を超えたことをする
- Web ペインのページが、elecdex 自身の API や他のペインに届く
- 保存した API キーが OS の暗号化された保存先から出る、または自分のプロバイダー以外に送られる
- どのペインもデータを必要としていないのに通信する、またはガイド（[docs/guide/data-sources.ja.md](docs/guide/data-sources.ja.md)）に書いていないサービスに通信する
- ランチャー、Git ペインなどのペインが、断るべきプログラムや転送方式を実行する

対象外: シェルのペインに自分で打ったコマンドの結果、署名のないビルドに OS が出す警告、elecdex が読む外部サービス側の不具合。

---

## 安全策略

### 支持的版本

elecdex 目前是预发布版。只支持最新版本：修复会合入 `main`，随下一个版本发布，不会为旧版本单独发布补丁。

### 报告漏洞

请通过 GitHub 私下报告：本仓库的 **Security** 标签页 → **Report a vulnerability**。请不要在公开的 Issue、Discussion 或拉取请求中提及。

请写明版本和平台、攻击者能做什么，以及复现步骤。elecdex 由一个人维护，会尽快回复。

### 适用范围

elecdex 的安全模型见 README 的“elecdex 是什么”一节和 [docs/architecture.md](docs/architecture.md)（日文）。能绕过它的问题都在范围内，例如：

- 页面（沙箱中的渲染进程）能访问 Node、文件系统或网络，或 `window.elecdex` 的某个通道接受了主进程未校验的输入；
- 插件做了超出所授权限的事；
- 网页窗格中的页面能访问 elecdex 自身的 API 或其他窗格；
- 保存的 API 密钥离开了操作系统的加密存储，或被发送到其对应服务商以外的地方；
- 没有窗格需要数据时仍发起网络请求，或请求了指南（[docs/guide/data-sources.zh-CN.md](docs/guide/data-sources.zh-CN.md)）未列出的服务；
- 启动器、Git 窗格等窗格运行了本应拒绝的程序或传输方式。

不在范围内：你在 shell 窗格中自己输入的命令的结果、操作系统对未签名构建给出的警告，以及 elecdex 读取的第三方服务自身的故障。
