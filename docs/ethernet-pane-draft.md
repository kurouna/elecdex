# 有線 LAN ペイン 設計案（草稿）

architecture.md の §5.23 として入れる前提の草稿。実装に入るときに architecture.md へ移し、決まったことは
decisions.md に記録して、このファイルは消す。見た目はモック [ethernet-mock/index.html](ethernet-mock/index.html)
（ブラウザで開くだけで動く。値はすべて作り物。上のボタンで 16 の場合・3 つの大きさ・5 つのテーマを切り替える。
`?scenario=crc&size=preset&tab=link` のように URL でも開ける）。比べるための Wi-Fi ペインの実画面は
[ethernet-mock/ref-wifi-forward.png](ethernet-mock/ref-wifi-forward.png) と
[ethernet-mock/ref-wifi-narrow.png](ethernet-mock/ref-wifi-narrow.png)（`train` スタブ）。

## 0. 決定の記録

| 日付 | 決定 | 経緯 |
|------|------|------|
| 2026-10-18 | Wi-Fi ペインとは別のペイン（ETHERNET）にし、経路の帯・タイムライン・ログ・説明カードを共有する | 利用者の決定。LINK ペインへの統合案は採らない |
| 2026-10-18 | 設計とモックを 3 つの観点（Wi-Fi との UX の統一、有線の診断の正しさ、見た目と UI の規約）でレビューし、§6 のとおり直した | 利用者の依頼 |

## 1. この PC で確かめたこと（2026-10-18）

この PC（HP Pavilion TP01、Windows 11 26H2）の有線は Realtek Gaming GbE（RTL8168、PCIe）1 枚で、ケーブルは
挿さっていない（Disconnected）。リンク中の値（速度・二重・カウンタの増え方）と負荷はまだ測っていない。
ケーブルを挿して測ることが実装の最初の仕事。どれも管理者権限なしで、設定は何も変えずに確かめた。

- **.NET の型では選べない**: `NetworkInterfaceType` が `Ethernet` の行は 19 あり、物理は 1 枚だけ。残りはフィルタ層
  （`-WFP ... LightWeight Filter-0000`、`-QoS Packet Scheduler-0000`）、Up の仮想（`ローカル エリア接続* 10〜12`）、
  Bluetooth PAN、カーネルデバッガー。`Get-NetAdapter -Physical` は Wi-Fi と有線の 2 枚だけを返した。
  `MIB_IF_ROW2` では有線が Type 6・`PhysicalMediumType` 14、`HardwareInterface` と `ConnectorPresent` が立つ
- **二重**: 切れている有線の `MediaDuplexState` は 0（unknown）。Wi-Fi は 1（half）を返す。half の判定は
  「有線で、リンク中で、値がちょうど 1」のときだけにする
- **詳細設定**: `Get-NetAdapterAdvancedProperty`（CIM）は 1 回目 1,298 ms、2 回目 29 ms。同じ値はネットワーク
  アダプタのクラスキー（`HKLM\SYSTEM\CurrentControlSet\Control\Class\{4d36e972-…}\NNNN`）から管理者なしで
  読め、PowerShell で約 80 ms（CIM の立ち上がりがない）。標準のキーワード（`*` で始まる）に `*SpeedDuplex`
  （`Ndi\params\*SpeedDuplex\enum` が選べる値 0,1,2,3,4,6 を持つ：最大 6 = 1.0 Gbps フル＝このアダプタの能力）、
  `*EEE`、`*FlowControl`、`*JumboPacket`、`*PriorityVLANTag`、`*WakeOnMagicPacket`。Realtek 独自の省電力に
  `EnableGreenEthernet`（有効）、`GigaLite`（有効：1 Gb/s の代わりに 500 Mb/s でリンクする）、`AutoDisableGigabit`、
  `PowerSavingMode`（有効）、`AdvancedEEE`。表示名は日本語に訳されているので、**キーワードで読む**
- **バス**: `Get-NetAdapterHardwareInfo` が PCIe 2.5 GT/s x1 を返す。`ComponentID` の頭（`PCI` / `USB`）でバスが分かる
- **統計**: `Get-NetAdapterStatistics`（CIM）と `MIB_IF_ROW2` の両方にエラーと破棄、ブロードキャストと
  マルチキャストがある。ただし `MIB_IF_ROW2` のパケット数は非ユニキャスト（`InNUcastPkts`＝ブロードキャスト＋
  マルチキャスト）で、ブロードキャストだけのものは**バイト数**（`InBroadcastOctets`）しかない
- **NDIS の WMI**: `root\wmi` の `MSNdis_StatusLinkState`・`MSNdis_StatusMediaConnect`・`MSNdis_StatusMediaDisconnect`
  のイベントを管理者なしで購読できた。`MSNdis_LinkState`（`AutoNegotiationFlags`、`PauseFunctions`）は
  インスタンスは列挙できたが、値の取り出しはまだ確かめていない
- **ログ**: 有線のリンクの断を、メーカーによらず記録する場所はなかった。`NetworkProfile/Operational` の
  10000 / 10001 はネットワークプロファイルの GUID と名前を持つだけで、どのアダプタかを書かない。
  `Dhcp-Client/Admin` は SSID と MAC を書いていて、有線の断の記録ではない。`Wired-AutoConfig/Operational`
  （802.1X）は 0 件、`dot3svc` は停止。ドライバの System ログ（この PC は `rt640x64`）はメーカーごとに番号が違う

## 2. 節の本文（architecture.md §5.23 に入れるもの）

### 5.23 ETHERNET ペイン（有線 LAN の経路診断）

有線で繋いでいるとき、どこで問題が起きているかを示す。Wi-Fi ペイン（§5.12）の有線版で、目的も同じ：通話や
配信の品質が悪いとき、自分か、ケーブル・ポート・アダプタか、ルーターか、回線かを切り分ける。有線の故障は
「繋がってはいるが、時々おかしい」形で出る。

- 見ている間に 1 Gb/s から 100 Mb/s へ落ちる（ケーブルの 1 対の断、ポートの不良）
- CRC エラー（ケーブルやコネクタの劣化、ノイズ）
- 二重の不一致（片方を固定、片方を自動。PC は full と言い、相手が half に落ちて、CRC エラーが増える）
- 数分おきのリンクの断（EEE・Green Ethernet、USB アダプタやドックの再接続、スイッチのポート）
- ブロードキャストの嵐（スイッチのループ。LAN 全体が遅くなる）
- 802.1X の認証待ち、スパニングツリーの待ち（リンクは上がったのにアドレスが来ない）
- USB 接続のアダプタ（ドックを含む）の、バス側の上限

ピッカー名は "Ethernet status"、見出しは ETHERNET。既定のレイアウトには入れない。

- **取れるもの / 取らないもの**: 有線には位置情報の許可の問題はない。それでも §5.12 と同じく、読み取りごとに
  プロセスを起こさず、名前を指定したフィールドだけをスクリプトから出す。次は**読まない**：802.1X の認証の中身、
  LLDP・CDP（隣のスイッチの名前とポート。Windows のクライアントには受け手がなく、パケットを捕まえる必要が
  ある）、ケーブル診断（TDR。ドライバ固有で、測る間リンクが切れる）、PoE（PC からは読めない）、ドライバの
  System ログ。**設定は一切変えない**（省電力が原因らしくても、どの設定かを示すだけ）。
- **アダプタの選び方**: Windows は `GetIfTable2` の `MIB_IF_ROW2` で `Type = 6`（ethernetCsmacd）、
  `PhysicalMediumType = 14`（802.3）、`InterfaceAndOperStatusFlags` の `HardwareInterface` が立ち、
  `FilterInterface` が立たない行。Hyper-V の vEthernet、WSL、Docker、VPN、フィルタ層はこれで落ちる。
  テザリング（RNDIS、Apple Mobile Device Ethernet）はドライバの説明で除く。USB・Thunderbolt のアダプタと
  ドックは物理として残る。Linux は `/sys/class/net/<if>` の `type` が 1、`wireless/` がない、
  `/sys/devices/virtual/` の下でない、`bridge/` `bonding/` がない、`device/driver` が `rndis_host`・`cdc_ether`・
  `cdc_ncm`・`ipheth` でないもの。macOS は `networksetup -listallhardwareports` の Ethernet・Thunderbolt
  Ethernet・USB LAN（Thunderbolt Bridge = `bridge0` と裸の「Thunderbolt n」は除く。ペインが開いたときと 60 秒ごと）。
- **Windows の読み取り**（サンプラーの種類 `ether`）:
  - **毎秒**: 一度だけコンパイルする C# で、選んだアダプタの LUID ごとに `GetIfEntry2`（iphlpapi）を呼ぶ
    （`GetIfTable2` は表が変わったときだけ）。出すのは `OperStatus`・`MediaConnectState`、`ReceiveLinkSpeed`・
    `TransmitLinkSpeed`、`MediaDuplexState`、`InterfaceAndOperStatusFlags` の `NotAuthenticated`、
    `InOctets`・`OutOctets`、`InUcastPkts`・`InNUcastPkts`・`OutUcastPkts`・`OutNUcastPkts`、`InBroadcastOctets`、
    `InErrors`・`OutErrors`、`InDiscards`・`OutDiscards`、`InUnknownProtos`。Wi-Fi の C# と同じアセンブリに入れる
  - **リンクの変化**: ペインが見えている間だけ、同じ C# で NDIS の WMI イベント（`MSNdis_StatusLinkState`、
    `MediaConnect`、`MediaDisconnect`）を購読する。毎秒の読み取りでは 1 秒未満の断（EEE の相性で起きる）を
    見落とすため。管理者もプロセスも要らないことは確かめた（§1）
  - **接続が変わったときと 10 秒ごと**: アドレス・ゲートウェイ・DNS・MTU・DHCP のリース（§5.12 の .NET のコードを
    共用）、WinRT の接続プロファイルの疎通（キャプティブポータル）、既定の経路がどのインターフェースか
    （`GetBestRoute2`：VPN や Wi-Fi が既定なら、インターネットの往復はこのアダプタの値ではない）
  - **ペインが初めて見えたときと、リンクが上がるたび**: アダプタの説明を**クラスキーから**読む（CIM の 1.3 秒の
    立ち上がりを避ける）。`*SpeedDuplex`（今の値と、`enum` の最大＝能力。標準の値 0〜6 は表で、2.5G・5G は
    メーカーの値なので `SPEED_DUPLEX_VALUES` の表に足す）、`*EEE`、`*FlowControl`、`*JumboPacket`、
    `*PriorityVLANTag` と `VlanID`、`*WakeOnMagicPacket`、そしてメーカーの省電力の表（`POWER_KEYWORDS`：
    Realtek の `EnableGreenEthernet`・`GigaLite`・`AutoDisableGigabit`・`PowerSavingMode`・`AdvancedEEE`、Intel の
    `ReduceSpeedOnPowerDown`・`*SSIdleTimeout` など。足すときは実機の名前を確かめる）。値は**正規化した語**
    （on / off / auto / 1 Gb/s full など）にして出し、ドライバの訳語は出さない。ドライバの提供元・版・日付、
    バス（`ComponentID` の頭だけと PCIe の速度・幅）、`SupportedStatistics`（ドライバが埋めないカウンタは 0 では
    なく —）もこのとき。`MSNdis_LinkState` の自動ネゴシエーションと実際のフロー制御は、値が取れると確かめられた
    ら足す
  - 新しい PowerShell は起こさない。コンパイルの時間と、イベント購読の負荷を測って decisions.md に残す
- **Linux**: `/sys/class/net/<if>/` の `carrier`、`operstate`（`dormant` は 802.1X の認証待ち）、`speed`・`duplex`
  （切れている間は -1 か EINVAL）、`carrier_down_count`（4.16 から。ないときは `carrier_changes` の半分：
  見ていなかった間の断も分かる）、`mtu`、`statistics/` の `rx_bytes`・`tx_bytes`・`rx_packets`・`tx_packets`・
  `multicast`・`rx_crc_errors`・`rx_frame_errors`・`rx_length_errors`・`rx_dropped`・`rx_missed_errors`・`tx_errors`・
  `tx_dropped`・`collisions`、`device` の `subsystem`（pci / usb）、USB なら親の USB 機器の `speed`
  （480 / 5000 / 10000）。ファイルを読むだけ。能力・自動ネゴシエーション・EEE は ethtool の ioctl が要るので
  読まない（`no-capability`）。ブロードキャストだけの数はないので、嵐の判定は `multicast` を除いた
  非ユニキャストでは**しない**（`no-broadcast`）。
- **macOS**: `ifconfig <if>` の `media:`（`autoselect (1000baseT <full-duplex,flow-control,energy-efficient-ethernet>)`
  から速度・二重・フロー制御・EEE）と `status:`、`netstat -I <if> -b` の Ierrs・Oerrs・Coll（プロセスを起こすので
  10 秒ごと）。バイト数は既存の通信量のソースから。ブロードキャストの数はない（`no-broadcast`）。
- **ログ**: どの OS でも、有線のリンクの断を OS のログからは読まない（§1）。イベントはペインが見たもの。
  見ていなかった間のことは Linux の `carrier_down_count` の増分だけが分かり、「見ていない間に 2 回」とログに
  1 行出す。Windows ではもう一つだけ、System ログの Tcpip 4199（IP アドレスの重複）を、Wi-Fi のログと同じ
  5 秒ごとの読み取りで読む。出すのは時刻と「重複した」という事実だけで、相手の MAC は出さない。
- **ping の共有と、アダプタごとの往復**: 往復の数は増やさない。サンプラーの `probe` を「接続中の Wi-Fi と有線の
  アダプタ、合わせて最大 4 枚のゲートウェイ」に広げ（`WlanGateways` → `LinkGateways`）、Wi-Fi か ETHERNET の
  どちらかが見えていれば毎秒、ネットワーク状態だけなら従来どおり 5 秒ごと。インターネット側の往復は 1 つで
  三つのペインが読む。**ゲートウェイの往復は `IcmpSendEcho2Ex` でアダプタ自身の IPv4 を送信元にして打つ**。
  .NET の `Ping` は送信元を選べないので、Wi-Fi と有線が同じルーターに繋がっていると、往復は既定の経路の側だけを
  通り、両方の値として数えてしまう。往復は（インターフェース、ゲートウェイ）で持つ。ICMP の往復は 1 ms より
  細かく測れないので、表示は Wi-Fi と同じく整数の ms、1 ms 未満は `<1 ms`。Linux / macOS の `PingStream` は
  `-I <if>` で同じことをする。これは Wi-Fi ペインの往復の打ち方も変える（同じルーターに両方で繋いだときの値が
  正しくなる）ので、共通化のコミットで Wi-Fi のテストも直す。
- **ソース**: `net.ethernet`（毎秒）と `net.ethernet.events`（5 秒ごと）。どちらも `keepWhileHidden` に入れない。
  プラグインに出すかは未決（§5）。案は出さない（`PRIVATE_METRIC_SOURCE_IDS`）。
- **スクリプトから出さないもの**: `ComponentID` のベンダー ID・機種 ID、インターフェースの GUID（id は LUID の
  番号から作る）、接続ごとの DNS サフィックス、DHCP サーバー、有線の接続プロファイルの名前（会社のドメイン名の
  ことが多い）、802.1X の ID、重複した相手の MAC。MAC・IP・ゲートウェイ・DNS は MASK で隠し、COPY の
  レポートでは MAC と IPv6 を常に隠す。
- **診断**（`diagnoseEthernet`、純粋関数）: 経路を PC → LINK → GATEWAY → INTERNET に分ける。往復は直近 1 分、
  リンクのカウンタは直近 10 分で見る。リンクが切れていた秒の往復は、ゲートウェイとインターネットの数字に
  入れない（それは LINK のせい）。先に止める条件：アダプタなし、`NO CARRIER`（ケーブルなし）、`LINK LOST`
  （今まさに切れた）、`AUTH`（リンクは上がったが `NotAuthenticated`。認証の中身は読まない）、リンクはあるが
  アドレスがない、キャプティブポータル、上りの喪失。アドレスがないときは、上がってから 45 秒は待つ
  （スパニングツリーの待ち）。TCP/IP が物理アダプタから外れて仮想スイッチやブリッジに付いているなら、DHCP の
  失敗ではなく「仮想スイッチにつながっている」と言う。そのあと **Wi-Fi の `judgeSegments` と同じ順**：
  bad の区間を近い順に、なければ warn の区間を近い順に。
  - **LINK**（`ETHER_LIMITS`）:
    - **速度**: 見ている間に、このアダプタで前に見た速度より下がった（ダウンシフト）は warn。10 Mb/s は bad。
      アダプタの能力より低いまま変わらない速度（2.5G のアダプタに 1G のルーター、ONU の 100M のポート）は
      直せないことが多いので**判定にしない**。速度の下に `BELOW MAX` と書くだけ。前に見た速度は main が
      アダプタごとに覚える（メモリだけ）。速度の段は 10M・100M・500M（Gigabit Lite）・1G・2.5G・5G・10G で、
      段にない値も表示できる
    - **二重**: 有線でリンク中に値がちょうど half なら bad。unknown は half にしない。不一致は PC 側が full と
      言うことが多いので、「速度と二重を固定している ＋ CRC エラー」で根拠に「相手が半二重かもしれない」と出す。
      Linux で全二重なのに `collisions` が増えるのも不一致の印
    - **CRC エラー**: 判定に使うのは受信の `InErrors`（Linux は `rx_crc_errors + rx_frame_errors +
      rx_length_errors`）だけ。破棄（`InDiscards`・`rx_dropped`・`rx_missed_errors`）と未知のプロトコルは
      この機械の側の数なので、詳細に `host` と付けて出し、判定しない。件数と割合の両方で：warn は 10 分で
      5 件以上かつ 0.01% 以上、bad は 20 件以上かつ 0.1% 以上（1,000 パケットに 1 件で bad になるのを避ける）。
      超えたらイベント。RSC や LSO でパケット数（分母）がまとめられて割合が膨らまないかは、実機で確かめる
    - **リンクの断**: 下がって 60 秒以内に戻ったもの。スリープからの復帰の前後、`AdminStatus` が down
      （利用者が無効にした）、ケーブルの抜き差しやドックの付け外し（60 秒より長い）は数えない。10 分で 2 回は
      warn、4 回以上は bad。間隔が一定なら「〜分ごと」と出す（`regularInterval`）。省電力の設定が on で、
      速度が自動なら、根拠に「power saving on」と添える
    - **ブロードキャストの嵐**: 受信の `InBroadcastOctets` の毎秒の増分を 60 バイト（ARP の大きさ）で割った
      ものを、毎秒のブロードキャストの数とみなす（多めに出る側に倒れる）。直近 30 秒の**中央値**が毎秒 300 で
      warn、3,000 で bad（中央値なので、10 秒のネットワークスキャンでは鳴らない）。「ループかもしれない」と
      言うのは、ゲートウェイの損失か遅延も上がっているときだけ。マルチキャスト（mDNS、SSDP、IPv6 の ND、
      IPTV は毎秒 1,000 を超える）は別に出し、**判定しない**
    - **バス**: USB のアダプタで、受信の量が 20 秒以上 250〜350 Mb/s の間で ±5% に張り付いていたら、情報の行で
      「USB 2.0 のポートかもしれない」と出す。Windows は USB の速度が読めないので判定にしない。Linux は親の
      USB の速度が 480 なら判定にする（warn）。回線の契約の上限でも同じ形になるので、言い方は「かもしれない」
  - **GATEWAY**: 家庭のルーターは ICMP を後回しにしたり間引いたりするので、遅延は厳しく、揺れと損失は緩く：
    RTT（中央値）warn 5 / bad 20 ms、ジッタ warn 5 / bad 15 ms、損失 warn 3%（1 分に 2 回）/ bad 10%。
    一度も応答しないゲートウェイは損失とみなさない（§5.12 と同じ）。実機で測ってから決める
  - **自分の上り**とインターネット側は Wi-Fi と同じ値（`PATH_LIMITS`）。MOS も同じ推定式
  - **既定の経路でないとき**: インターネットへの往復が VPN や Wi-Fi を通るなら、INTERNET の局は `via VPN` /
    `via Wi-Fi`（`not judged`）として判定から外し、LINK と GATEWAY だけを判定する。MOS も出さない
  - 判定の語は Wi-Fi と揃える（CLEAR、LOCAL、OWN UPLOAD、UPSTREAM、UPSTREAM LOST、SIGN-IN）。有線だけの
    語は `LINK`（根拠の文が速度・二重・CRC・断・嵐のどれかを言う）、`LINK LOST`、`NO CARRIER`、`AUTH`
- **画面**（モックのとおり。Wi-Fi ペインと同じ骨組みで、中段だけが違う）:
  - **見出し行**: ポートの形のアイコン（ケーブルがあると緑の端子）、アダプタの短い名前（Wi-Fi の SSID の位置）、
    状態（Wi-Fi と同じ語の組：ONLINE・NO CARRIER・NO ADAPTER・LOCAL ONLY・SIGN-IN に、有線だけの
    AUTHENTICATING）、MOS、MASK、COPY。上りの喪失でも状態は ONLINE のまま（Wi-Fi と同じ）。右肩に原因の語と
    `1 Gb/s · full · PCIe`
  - **経路の帯**: PC → LINK → GATEWAY → INTERNET。LINK の局は `1 Gb/s full` と `crc 0`（または `crc 0.32%`）。
    PC と LINK の間の線には直近 1 分の**リンクの使用率**（通信量 ÷ リンク速度）のスパークライン（Wi-Fi は信号）。
    線にラベルは付けず、PC の局の説明カードで言う。判定の 1 行、凡例（値は実データ、☒ lost の見本も）、GW と
    NET のリボンは Wi-Fi と同じ。ケーブルがないとき、リボンは空（ping をしないので lost にはしない）
  - **LINK パネル**（Wi-Fi の電波の位置）: 左に**速度の段**（7 段、今の速度まで点き、能力の上限に `max`、能力の
    先は破線）と大きな速度の数字、その下に**等級の語**（BEST・BELOW MAX・DOWNSHIFTED・HALF DUPLEX・10 Mb/s。
    Wi-Fi のゲージの GOOD に当たる）と `FULL DUPLEX · AUTO`。**この段と数字は速度と二重の判定の色だけで
    塗る**（CRC や断が原因でも、1 Gb/s は普通の色のまま）。右に規格の六角形（中は `1G` の一語、
    `1000BASE-T` は上の見出しに。Wi-Fi の `6` と `Wi-Fi 6` と同じ形）と使用率の ↓↑ のバー、その下に数の行
    （`crc`・`drops /10 min`・`broadcast /s`・`multicast /s`。原因になっている数には、その色の下地を敷く：パネルの
    中の「原因の局」）、札（EEE・GREEN・GIGA LITE・POWER SAVE・JUMBO・FLOW・VLAN・WOL。on / off を明るさで。
    省電力の札は、注意の行が出ているときだけ警告色）、最後に 1 行の注意か情報。注意は Wi-Fi の
    `background scan on` と同じ形で、**省電力が on、速度が自動、かつ断かダウンシフトを見たときだけ**
    `power saving on: the link may sleep or slow when idle`（札がどれかは言っているので繰り返さない）。1 行に
    収め、場所は空でも取っておく（場合によってパネルがずれないように）。USB の張り付きは情報の行（ⓘ、薄い色）
  - **タイムライン**: LINK（速度の段の帯。ふだんは斜線の薄い帯、前に見た速度より下がった所だけ警告色で塗る、
    断は赤の斜線）、L2（CRC エラーを赤、ブロードキャストを黄で、同じ毎秒の目盛りに積む。目盛りの床は嵐の
    warn 線で、静かな LAN はほとんど何も描かない）、RTT（天井はデータに合わせて 20・50・100・150・250・500 ms
    の段）、LOSS、TRAFFIC（通信量がリンク速度の 7 割を超えたら、目盛りをリンク速度にして天井の線を引く）、
    EVENTS。高さが 180px 未満では LOSS を RTT の下端の印にたたむ。凡例は Wi-Fi の internet・gateway・up・down に
    fell・crc・link lost を足す。タブの中では TIMELINE の見出しを出さない（Wi-Fi の `titled`）。窓、クロスヘア、
    見ていなかった区間の斜線と `NOT WATCHED` は §5.12 と同じ。**レーン名と目盛りの文字は HTML で
    `--step--2`**（SVG を引き伸ばすので、文字を SVG に入れると歪み、小さくなる）
  - **ログ**: Wi-Fi と同じ語と印：LINK LOST ▼（右に `down 3s`）、CONNECTED ▲（`1 Gb/s full · auto-negotiated`）、
    SPEED ◆、UPSTREAM LOST ◌、UPSTREAM BACK ●、それに CRC ERRORS ◆、BROADCAST ◆（判定の理由がログにも
    残るように）。右端に同じ種類の前回からの間隔（`+2m`）。見出しは `LOG  12 events, while watched`（説明カードで
    OS のログがないことを言う）。24 時間の帯の代わりに、見ていた区間の帯（断は赤）。行がなければ空のまま
    （Wi-Fi と同じ）
  - **詳細**: 左は L2・L3（アダプタ、ドライバ、バス、リンク、設定の速度と二重、省電力、MTU・ジャンボ・フロー制御、
    VLAN、802.1X、アドレス、IPv6、ゲートウェイ、DNS、DHCP、MAC、経路、エコーの相手）。リンクがない間、L3 は —。
    右はカウンタの表（rx / tx packets、rx broadcast、rx multicast、rx crc errors、tx errors、そして `host` と付けた
    rx / tx discards と unknown protos。合計と毎分）。棒は Detail.svelte と同じ規則：パケットは多いほうの方向に
    対して、問題の数はパケットに対する割合で、bad で半分。ドライバが埋めないカウンタは —
  - **前面**: Wi-Fi と同じ 2 列（上は 1.35 : 1 で経路と LINK パネル、下はタイムラインを全幅に、その下にログと
    詳細を 1.2 : 1）。**狭い枠**: 縦に、経路 → リボン → LINK パネル → タイムライン → ログ → 詳細（Wi-Fi と同じ順）。
    **network プリセットの 620×455**: 経路・判定・リボンの下に TIMELINE・LINK・LOG・DETAIL のタブ（ケーブルが
    ないときは LINK のタブを出さない）
  - **説明カード**: §5.12 と同じ仕組みで、`data-hint` ごとに `hints.ts` のカード。しきい値は `ETHER_LIMITS` から
    引用する。用意するカード：mos、station-pc / link / gateway / internet、cause、ribbons、speed、standard、
    util、crc、drops、broadcast、multicast、power、jumbo、adapter-chip、lane-link、lane-l2、lane-rtt、lane-loss、
    lane-traffic、lane-events、event-*（種類ごと）、watched、not-watched、f-*（詳細の項目ごと：DHCP、route、
    802.1X、echo host など）。単体テストがマークアップのすべての `data-hint` にカードがあることを確かめる
  - 原因の局を塗りつぶして 1.18 倍、MASK、COPY のレポート、文字の大きさの段（読むものは `--step--1` 以上、
    ラベルは `--step--2`、それより小さいものはない）は §5.12 と同じ。テーマの色はトークンだけ。amber や green の
    テーマでは警告色がアクセントに近いので、ふだんの帯は斜線、警告だけを塗りにして見分ける
- **複数のアダプタ**: 内蔵とドックが両方あることがあるので、§5.12 と同じくチップで切り替え、履歴もアダプタごと。
  アダプタが一枚もなければ、名前は —、状態は NO ADAPTER、本文は `NO WIRED ADAPTER`（Wi-Fi と同じ形）。

## 3. 共通化する範囲

二つ目の利用者ができた今、Wi-Fi ペインの部品を切り出す。**Wi-Fi ペインの見た目と判定は変えず、既存の
テストがそのまま通ることを切り出しの完了条件にする**（例外は送信元を指定した往復で、これは Wi-Fi も正しく
なる）。切り出しは ETHERNET を作る前に、単独のコミットで。

- **shared/netpath.ts**（純粋関数）: `ProbeStats`・`probeStats`、`mosEstimate`・`mosOf`、`Health` と
  `over`・`under`・`worse`、`correlation`、GATEWAY・自分の上り・INTERNET の区間の判定と `upstreamGone`、
  `judgeSegments` の順序、`PATH_LIMITS`（インターネットと上り）、`DIAGNOSIS_WINDOW_MS`、`bucketize`・`pointAt`、
  `Stretch`、`regularInterval`・`latencySpikes`、`maskAddress`、窓（`PATH_WINDOWS`）、`pushPoint`、
  `culpritStation` の形、往復の ms の書き方。shared/wifi.ts には無線に特有のもの（電波、帯域、チャネル、規格、
  再送、SSID）だけが残る。shared/ethernet.ts は速度の段と等級、二重、CRC、断、嵐、省電力の札と注意の条件
- **サンプラー**: `probe` の往復（送信元を指定する形に）と、アドレスを読む .NET のコード
- **ページ**（widgets/netpath/ へ）: `PathStrip`（2 局目の名前とスパークラインの値を引数に）、`Timeline`（レーンの
  定義を引数に）、`EventLog`（種類と印を引数に）、`HintCard`（カードの表を引数に）、`draw.ts` のリボン・
  スパークライン・パレット、`history.svelte.ts`（点の型を引数にした、アダプタごとの 60 分）、段組み（`pathSections`）、
  見出し行（名前・状態・MOS・MASK・COPY）
- **切り出さないもの**: `RadioPanel`（ETHERNET は `LinkPanel`）、`Detail` の中身、各 OS の読み取り、
  説明カードの文言、スタブ

## 4. テスト

- 単体: `ethernet.test.ts`（判定の順、CRC の件数と割合、破棄を数えないこと、断の数え方と除外、速度の
  ダウンシフトと BELOW MAX、unknown を half にしないこと、嵐の中央値と 30 秒、マルチキャストを数えないこと、
  省電力の注意を出す条件、既定の経路でないとき、レポートで隠すもの）、`ethernet-hints.test.ts`（カードの網羅と
  しきい値の引用）、`ethernet-readers.test.ts`（行の選び方：§1 の 19 行を固定データにして物理 1 枚だけが残る
  こと、テザリングを除くこと、クラスキーの値の正規化、sysfs、ifconfig の media 行）、`netpath.test.ts`（切り
  出した関数。wifi.test.ts から移す）。metric source の振り分けのテストと `hidden-panes.spec.ts` の一覧に入れる
- スタブ `ELECDEX_ETHER_STUB`（support.ts の `STUB_ENV` に `1`）: モックの 16 の場合をそのまま値にする。
  `1`（1 Gb/s で安定）、`partner`、`downshift`、`flapping`、`crc`、`mismatch`、`half`、`storm`、`multicast`、
  `router`、`upstream`、`vpn`、`usb`、`auth`、`unplugged`、`none`、`dual`、`demo`
- e2e: `ethernet.spec.ts`（判定が LINK を指すこと、ダウンシフトと断のイベント、見えていない間は読まない、MASK と
  COPY）と、Wi-Fi ペインと同時に開いても probe の往復が増えないこと
- 負荷: ケーブルを挿した実機で、サンプラーとページの増分を測ってここに書く

## 5. 未決事項（利用者に確かめる）

1. `net.ethernet` をプラグインに出すか（案は出さない）
2. network プリセットに入れるか（入れればプリセットの木と三つの README のスクリーンショットが変わる）
3. ゲートウェイと嵐のしきい値は、実機で測ってから決めてよいか
4. Tcpip 4199（IP アドレスの重複）を読むか（System ログを読む種類が一つ増える）

## 6. レビューで直したこと（2026-10-18）

3 体のレビュー（Wi-Fi との UX の統一、有線の診断の正しさ、見た目と UI の規約）の指摘を、次のとおり整理して
設計とモックに入れた。

| 観点 | 直したこと |
|------|------------|
| 判定の正しさ | エラーは CRC だけで判定し、破棄は `host` として判定しない。件数と割合の両方を要る形に。嵐はブロードキャストだけ（バイト数から）、中央値で 30 秒、マルチキャストは判定しない。能力より低いだけの速度は判定せず、見ている間のダウンシフトだけを warn。500M の段を足した。unknown を half にしない。不一致は「固定 ＋ CRC」で言う。断は 60 秒以内に戻ったものだけ、2 / 4 回。判定の順を Wi-Fi の `judgeSegments` に揃えた（LINK の warn が GATEWAY の bad を隠していた）。リンクが切れていた秒の往復を除く |
| 取得 | 詳細設定は CIM ではなくクラスキーから。リンクの変化は NDIS の WMI イベントで。ゲートウェイの往復は送信元を指定（同じルーターに Wi-Fi と有線で繋ぐと区別できなかった）。802.1X は `NotAuthenticated`、STP の 45 秒、仮想スイッチ。VPN・Wi-Fi が既定の経路のとき。Linux の `carrier_down_count` と USB の速度、テザリングの除外。macOS の Thunderbolt Bridge の除外と media の EEE・フロー制御 |
| UX の統一 | NO ADAPTER と NO CARRIER を Wi-Fi と同じ形と語に（ケーブルなしでは LINK パネルを出さず、L3 は —、リボンは空）。ログの語を LINK LOST / CONNECTED に、右端の間隔の列を戻した。上りの喪失でも状態は ONLINE。凡例に up・down と lost を戻した。タブの中では TIMELINE の見出しを出さない。詳細の棒を Detail.svelte の規則に。往復は整数の ms。六角形は一語に。等級の語を足した |
| 見た目と規約 | 速度の段と数字を、速度の判定の色だけで塗る（CRC が原因なのに 1 Gb/s が赤かった）。原因の数に下地を敷く。省電力の札は注意が出ているときだけ警告色。注意は 1 行。SVG の 8〜10px の文字をやめ、レーン名と目盛りを HTML の `--step--2` に。目盛りの重なりを解消（リンク速度の天井と ↓ の目盛りを一つに）。RTT の天井をデータに合わせた。L2 のレーンで嵐が見えるように。amber でふだんの帯と警告を見分けられるように。business の状態色を tokens.css の値に。狭い枠のはみ出しを直した |
| 採らなかったもの | MOS・MASK・COPY を NO ADAPTER で隠す案（Wi-Fi は出したままなので揃えた）。前面のペインの枠（面取り・角の目盛り・⤡）はモックでは仮のもので、実装ではペインの枠をそのまま使う |
