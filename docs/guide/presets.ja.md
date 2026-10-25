[English](presets.md) | 日本語 | [简体中文](presets.zh-CN.md)

# レイアウトプリセット — elecdex

elecdex は SF 風のデスクトップ向けターミナルエミュレーター兼システムモニターで、eDEX-UI を Electron・Svelte・
TypeScript で作り直したものです。このページでは、作業ごとのペインをキー一つ（**Ctrl+Shift+F1**〜**F10**）で画面に
並べる 10 個の **レイアウトプリセット**（standard、network、earth、dev、media、desk、ai、cockpit、retro、blank）に
ついて、それぞれの中身、プリセットが保存レイアウトになる仕組み、各プリセットが見せる機能を説明します。elecdex は
Windows・macOS・Linux で動きます。開発と利用は Windows で行っており、macOS と Linux は GitHub Actions の自動テストで
動かしただけなので、十分には検証されていません。

## このページの内容

- [10 個のプリセットの一覧](#10-個のプリセットの一覧)
- [プリセットの仕組み](#プリセットの仕組み)
- [standard](#standard)
- [network](#network)
- [earth](#earth)
- [dev](#dev)
- [media](#media)
- [desk](#desk)
- [ai](#ai)
- [cockpit](#cockpit)
- [retro](#retro)
- [blank](#blank)

ペインは作業ごとに並べ替えられます。10 個のレイアウトプリセットが、その作業に合うペインをキー一つ
（Ctrl+Shift+F1〜F10）で画面に並べます。cockpit と blank 以外のどのプリセットも左端にシステムの列を持つので、
切り替えても計器はそのままで、舞台だけが替わります。最後の blank はペインが一つもない、自分で組み立てるための
レイアウトです。以下では機能を、それを見せるプリセットごとにまとめました。どの画像も、そのプリセットを別々の
テーマで写したものです。

## 10 個のプリセットの一覧

**システムの列** は既定のレイアウトの左の列で、これを持つどのプリセットでも同じです。上から時計、
[system](panes-system.ja.md#system)、[CPU](panes-system.ja.md#cpu)、[memory](panes-system.ja.md#memory)、
[disk](panes-system.ja.md#disk)、top processes、network status、network traffic で、ウィンドウの幅の 18% を占めます。

| キー | プリセット | ペイン（システムの列のほか） | 画像のテーマ |
| --- | --- | --- | --- |
| Ctrl+Shift+F1 | [standard](#standard) | [Terminal](panes-system.ja.md#terminal) のタブ 3 つ、[Launcher](panes-system.ja.md#launcher) と [Filesystem](panes-system.ja.md#filesystem)、[World view](panes-network.ja.md#world-view)・[Markets](panes-world.ja.md#markets)・[Weather](panes-world.ja.md#weather)・[Calendar](panes-desk.ja.md#calendar) | Tron |
| Ctrl+Shift+F2 | [network](#network) | [World view](panes-network.ja.md#world-view) の下に [Connections](panes-network.ja.md#connections)、[Wi-Fi](panes-network.ja.md#wi-fi) の下に [Ethernet](panes-network.ja.md#ethernet) | White |
| Ctrl+Shift+F3 | [earth](#earth) | [Orbit](panes-world.ja.md#orbit) の下に [Terminal](panes-system.ja.md#terminal)、[World view](panes-network.ja.md#world-view)・[Quakes](panes-world.ja.md#quakes)・[Weather](panes-world.ja.md#weather) | Tron |
| Ctrl+Shift+F4 | [dev](#dev) | [AI Agent](panes-dev.ja.md#ai-agent)、[Docker](panes-dev.ja.md#docker) とシェルのタブ、[Clipboard](panes-desk.ja.md#clipboard)・[Timer](panes-desk.ja.md#timer)・シェルのタブ、[Git](panes-dev.ja.md#git)・[AI chat](panes-ai.ja.md#ai-chat)・[Log Watch](panes-dev.ja.md#log-watch) のタブ | Phosphor |
| Ctrl+Shift+F5 | [media](#media) | YouTube (TV)（[Web ペイン](panes-media.ja.md#browser-youtube-and-x)）、[Now playing](panes-media.ja.md#now-playing)・[Spectrum](panes-media.ja.md#spectrum)・[Mixer](panes-media.ja.md#mixer)、X と [RSS](panes-world.ja.md#rss) のタブ | White |
| Ctrl+Shift+F6 | [desk](#desk) | [Notes](panes-desk.ja.md#notes)、[Timer](panes-desk.ja.md#timer) と [Calculator](panes-desk.ja.md#calculator)、[Tasks](panes-desk.ja.md#tasks) の下に [Clipboard](panes-desk.ja.md#clipboard)、[Calendar](panes-desk.ja.md#calendar) の下に [Utility](panes-desk.ja.md#utility) と [ELEC-16](panes-retro.ja.md#elec-16) SCI のタブ | Black |
| Ctrl+Shift+F7 | [ai](#ai) | 上下に 2 つの [AI chat](panes-ai.ja.md#ai-chat)、[ELEC system](panes-ai.ja.md#elec-system) の下に [GPU](panes-system.ja.md#gpu) | Business (Dark) |
| Ctrl+Shift+F8 | [cockpit](#cockpit) | システムの列なし。[Cluster](panes-system.ja.md#cluster) の下に [Terminal](panes-system.ja.md#terminal)、[Wi-Fi](panes-network.ja.md#wi-fi) の下に [Ethernet](panes-network.ja.md#ethernet) | Black |
| Ctrl+Shift+F9 | [retro](#retro) | [ELEC-16](panes-retro.ja.md#elec-16)・ELEC-16 SCI・[CHIP-8](panes-retro.ja.md#chip-8) をタブにした 1 つのペイン、その下に 16 バンドの [Spectrum](panes-media.ja.md#spectrum) | Tron |
| Ctrl+Shift+F10 | [blank](#blank) | なし | Amber |

## プリセットの仕組み

| | |
| --- | --- |
| 場所 | LAYOUTS ダイアログ（**Ctrl+Shift+G**、またはステータスバーの *layouts*）の、保存レイアウトの一覧の下にあるプリセットの棚。**Ctrl+Shift+F1**〜**F10**。アクションパレット（**Ctrl+Shift+P**）の PRESET の行（同じキーの操作を通る） |
| 保存先 | `layouts.json`。作った元のプリセットを覚えている保存レイアウトとして |
| 設定 | *Settings → General → Layouts* の *ask before switching layout*（既定はオン）。キーは *Settings → Keyboard* |

プリセットは **雛形** で、2 種類目のレイアウトではありません。

- **プリセットを選ぶと、そこから作った保存レイアウトを一覧に足し、そこへ切り替えます。** 以後は普通の保存
  レイアウトで、番号キー（一覧での位置に応じて Ctrl+Shift+1〜9 と 0）を持ち、作業に追従します。ワークスペースに
  加えた変更はそのレイアウトに残るので、戻ってくると離れたときのままです。
- **もう一度選ぶと、そのレイアウトに戻ります。** 新しく足すことはありません。レイアウトは作った元のプリセットだけを
  覚えているので、同じプリセットが二重に足されることはありません。
- **↺ でレイアウトをプリセットの形に戻します。** 名前と一覧での位置は保たれます。
- プリセットと同じ名前のレイアウトをすでに持っていれば、新しいものには番号が付きます（`desk 2`）。
- 各プリセットには専用のキー **Ctrl+Shift+F1**〜**F10**（棚の順）があり、どこからでも同じことをします。作った
  レイアウトがあればそこへ、なければ足して切り替えます。キーは位置ではなくプリセットに結び付くので、プリセットが
  増えても、変更したキーは同じプリセットに残ります。素の F キーは tasks ペイン（F2 で編集）や、シェルの中の
  htop・mc のようなプログラムが使うので、Ctrl+Shift を付けています。
- **新しくインストールすると 10 個すべてが** Ctrl+Shift+1〜0 に入り、standard が使用中になります。新しい
  インストールとは `layout.json` も `layouts.json` もない状態です。既存の保存レイアウトの一覧に自動で足すことは
  ありません。棚から足してください。
- 保存できるレイアウトは最大 20 件で、一覧がいっぱいのときは 1 件消すまでプリセットを足せません。
- プリセットが何かをオンにすることはありません。Starlink や地震の警報などは自分でオンにするものです。
- どのレイアウトでも、適用するとワークスペースが置き換わり、置き換えられるペインのシェルは終了します。シェルが
  開いている間は先に確認します（[保存レイアウト](workspace.ja.md#保存レイアウト) を参照）。

LAYOUTS ダイアログ:

<p align="center">
  <img src="../screenshots/elecdex-layouts.jpg" alt="Tron テーマの standard レイアウトの上に開いたレイアウトダイアログ：保存レイアウトとしてのプリセット（1〜9 が見え、0 の blank はその下。それぞれに配置の縮図）、その下にプリセットの棚（縮図、一覧での位置、キー Ctrl+Shift+F1〜F10。blank は空の枠）">
  <br><sub>レイアウト（Ctrl+Shift+G） · Tron</sub>
</p>

- 一覧の各行と棚の各カードには、ペインの配置の縮図が描かれます。違いが目に入るよう、システムの列は薄く描きます。
- カードにはプリセットの状態が出ます。**on 3**（そこから作ったレイアウトがそのキーにある）、**kept**（保存
  レイアウトの中にあるが、先頭 10 件の外）、**in this one**（いま作業中のレイアウト）、**+ add**（まだない）。
  カードの下にはそのプリセットのキーが出ます。
- 棚は 1 行で、横にスクロールします。マウスホイールでも動きます。**Tab** で一覧から棚へ、**←** / **→** で
  カードを移り、**↑** で一覧へ戻ります。1920x1080 の設計サイズでは 10 枚が 1 行に収まります。
- 選んだ行やカードは 3 回（100 ms ずつ）点滅してからダイアログが消灯し、切り替えが始まります。モーションを
  減らす設定ではすぐに切り替わります。

どのプリセットも、1920x1080 ではすべてのペインが、1366x768 では舞台のペインが最小サイズ以上になります（ユニット
テストで確かめています）。設計: [architecture.md §5.6](../architecture.md)。

## standard

*このマシン、シェル、そして外の世界。*

| | |
| --- | --- |
| キー | **Ctrl+Shift+F1** |
| ペイン | システムの列。[Terminal](panes-system.ja.md#terminal) のタブ 3 つの下に [Launcher](panes-system.ja.md#launcher) と [Filesystem](panes-system.ja.md#filesystem)。右に [World view](panes-network.ja.md#world-view)・[Markets](panes-world.ja.md#markets)・[Weather](panes-world.ja.md#weather)・[Calendar](panes-desk.ja.md#calendar) |
| 画像 | Tron |

elecdex を最初に開いたときの配置です。

<p align="center">
  <a href="https://youtu.be/JlCZzLhp_PM">
    <img src="../screenshots/elecdex-tron.jpg" alt="Tron テーマの elecdex：左にシステムモニター、中央にシェルのタブ 3 つとランチャーとファイルブラウザー、右にワールドビュー、マーケット、天気、カレンダー">
  </a>
  <br><sub>standard · Tron</sub>
  <br>
  ▶ <a href="https://youtu.be/JlCZzLhp_PM">3 分の紹介動画</a> · <a href="https://youtube.com/shorts/K-Is8LihR1w">Shorts（縦長）</a>
</p>

- **[ターミナル](panes-system.ja.md#terminal)** — 本物のシェル（PowerShell（入っていれば 7）、bash、zsh、fish）を、
  タブと分割で好きなだけ開けます。シェル統合により作業ディレクトリと終了コードが Windows でも伝わり、ペインを移動
  したりリロードしたりしてもセッションのスクロールバックは残ります。次の起動では各ペインが最後のフォルダで始まり、
  新しく開くペインは設定のフォルダで始まります。起動時はシェルにフォーカスがあり、テキストを選択するとコピー、
  右クリックで貼り付けです。Ctrl+Shift+F でスクロールバック内を検索でき、シェルが出力した URL は Ctrl+クリック
  （Mac は ⌘+クリック）でブラウザーで開けます。
- **システムモニター** — タイムゾーン付きの時計、バッテリーゲージ付きの[システムストリップ](panes-system.ja.md#system)、
  コアごとの [CPU](panes-system.ja.md#cpu)（グラフまたはバー）、[メモリ](panes-system.ja.md#memory)とスワップの推移、
  読み書きの動きが見える[ディスク](panes-system.ja.md#disk)、上位プロセス、ネットワークの状態と通信量、
  [GPU](panes-system.ja.md#gpu) の負荷とビデオメモリ。既定のレイアウトのアイドル時の負荷は 1 コアの約 13% です。
- **ファイルとアプリ** — シェルに追従する[ファイルブラウザー](panes-system.ja.md#filesystem)（クリックで `cd`、
  またはパスを挿入）と、スタートメニュー（ストアアプリなどのパッケージアプリも含む）、`/Applications` または
  `.desktop` エントリーに自分で追加したものを加え、よく使う順に並べる[ランチャー](panes-system.ja.md#launcher)。
- **天気・マーケット・カレンダー** — 世界中どこでも見られる[天気予報](panes-world.ja.md#weather)（日本は気象庁、
  米国は National Weather Service、それ以外は MET Norway）、Yahoo Finance の
  [マーケットボード](panes-world.ja.md#markets)（非公式で、遅れることがあり、投資助言ではありません）、日本の祝日も
  表示できる月表示の[カレンダー](panes-desk.ja.md#calendar)。

## network

*このマシンの通信相手。*

| | |
| --- | --- |
| キー | **Ctrl+Shift+F2** |
| ペイン | システムの列。[World view](panes-network.ja.md#world-view) の下に [Connections](panes-network.ja.md#connections)（2 対 1、舞台の 5 分の 3）。その横に [Wi-Fi](panes-network.ja.md#wi-fi) の下に [Ethernet](panes-network.ja.md#ethernet)（半分ずつ） |
| 画像 | White |

<p align="center">
  <img src="../screenshots/elecdex-network.jpg" alt="White テーマの network プリセット：左にシステムの列、接続先への弧を描く白いワールドビューの地球儀と、その下にプログラムごとのソケット（firefox、code、elecdex、thunderbird）を一覧する connections ペイン。右に、Wi-Fi ペインとその下の Ethernet ペイン。どちらも架空の回線で、PC からインターネットまでの区間がすべて正常（1 分幅のタイムライン付き、有線は 1 Gb/s 全二重）">
  <br><sub>network · White</sub>
</p>

- **[ワールドビュー](panes-network.ja.md#world-view)と[接続](panes-network.ja.md#connections)** — このマシンの接続先を
  示す地球儀と、すべての TCP ソケットを保持しているプログラムごとに一覧するペイン。どちらも同梱の GeoIP データ
  ベースで位置を求めるので、オンラインで問い合わせることはありません。ソケットの一覧は地球儀の下にあります。
- **[Wi-Fi](panes-network.ja.md#wi-fi) と [Ethernet](panes-network.ja.md#ethernet)** — 上下に並び、無線とケーブルの
  どの区間で問題が起きているかを示します。
- ネットワークの状態と通信量はシステムの列にあるので、このプリセットにシェルはありません。

## earth

*頭上と足もと。*

| | |
| --- | --- |
| キー | **Ctrl+Shift+F3** |
| ペイン | システムの列。[Orbit](panes-world.ja.md#orbit) の下に [Terminal](panes-system.ja.md#terminal)。その横に [World view](panes-network.ja.md#world-view)・[Quakes](panes-world.ja.md#quakes)・[Weather](panes-world.ja.md#weather) |
| 画像 | Tron |

<p align="center">
  <img src="../screenshots/elecdex-earth.jpg" alt="Tron テーマの earth プリセット：世界地図、時刻が切り替わる線、9 都市の時計、ISS とその地上軌跡、天宮、淡い点で描いた Starlink 衛星とその 1 基のカードを表示する ORBIT ペイン。横にワールドビュー、日本の最近の地震を一覧する地震ペイン、天気。地図の下にシェル">
  <br><sub>earth · Tron</sub>
</p>

- **[Orbit](panes-world.ja.md#orbit)** — 管制室の正面スクリーンです。夜の側、時刻が切り替わる線と各地域の時刻を
  描いた世界地図に、ISS と天宮の現在位置と地上軌跡、選んだ都市の上空を次に通過する時刻、管制室の GMT 通算日時計を
  囲む世界の時計を表示します。求めに応じて Starlink 衛星群も表示します。軌道要素は CelesTrak のものです。
- **[地震と津波](panes-world.ja.md#earthquake-and-tsunami-alerts)** — 日本（気象庁）または世界（USGS と NOAA）を
  対象に、選んだ震度やマグニチュードでの警報（既定ではオフ）、発表中は常に見える津波警報、最近の地震を一覧する
  [地震ペイン](panes-world.ja.md#quakes)、地球儀上の震央表示を提供します。警報は出典を示し、緊急地震速報ではありません。
  津波については地元の自治体の指示に従ってください。
- このプリセットは Starlink も地震の警報もオンにしません。どちらも自分でオンにするものです。

## dev

*作業中のエージェント、動かしているコンテナ、変えているリポジトリ。*

| | |
| --- | --- |
| キー | **Ctrl+Shift+F4** |
| ペイン | システムの列。[AI Agent](panes-dev.ja.md#ai-agent)、その下に [Docker](panes-dev.ja.md#docker)（後ろにシェルのタブ）、その下に [Clipboard](panes-desk.ja.md#clipboard)（後ろに [Timer](panes-desk.ja.md#timer) とシェル）。右に全高の [Git](panes-dev.ja.md#git)（後ろに [AI chat](panes-ai.ja.md#ai-chat) と [Log Watch](panes-dev.ja.md#log-watch)） |
| 画像 | Phosphor |

<p align="center">
  <a href="https://youtu.be/eLKHc9nyWgc">
    <img src="../screenshots/elecdex-dev.jpg" alt="Phosphor テーマの dev プリセット：2 つの Claude Code セッション（1 つはサブエージェントが作業中で、その下にそのサブエージェントが起動したサブエージェントがぶら下がり、テストがバックグラウンドで実行中）と変更したファイルを表示する AI AGENT ペイン、その下に架空のコンテナを Compose のプロジェクト（ledger と shop）ごとにヘルス・ポート・使用量とともに並べる DOCKER ペイン、その後ろにシェルのタブ。さらに下に架空のコピーを並べたクリップボード履歴、その後ろにタイマーとシェルのタブ。右に同じチェックアウトを表示する GIT ペイン（passes.ts の差分と、ポインターを置いたコミットのカード付きのコミットグラフ）、その後ろに AI チャットと LOG WATCH のタブ">
  </a>
  <br><sub>dev · Phosphor</sub>
  <br>
  ▶ <a href="https://youtu.be/eLKHc9nyWgc">dev レイアウトの使い方の動画</a>（1 分）· <a href="https://youtu.be/YLxHhQ7wAyE">英語版</a>
</p>

- **[AI Agent](panes-dev.ja.md#ai-agent)** *(実験的)* — このコンピューターで作業中の Claude Code セッションを表示
  します。それぞれが今何をしているか、どれだけの量を抱えているか、そのサブエージェントとバックグラウンドタスク、
  変更した各ファイルの差分を、このマシン上の Claude Code 自身の記録から読み取ります。
- **[Git](panes-dev.ja.md#git)** — 選んだリポジトリを表示します。変更されたファイル、構文を色分けした各ファイルの
  差分、ブランチとタグを含むコミットグラフを、変更に合わせて最新に保ちます。隣のペインで AI エージェントの作業を
  見守れます。FETCH と、fast-forward のみの PULL、強制しない PUSH ができます。ペインは 1 リポジトリにつき 1 つ
  です。差分に高さが要るので、全高を使います。
- **[Docker](panes-dev.ja.md#docker)** — このコンピューターの Docker エンジンのコンテナを Compose のプロジェクト
  ごとに表示します。動いているか、正常か、公開ポート（クリックでブラウザーで開きます）、それぞれが使っている量。
  行から起動・停止・再起動・一時停止ができます。
- **[Log Watch](panes-dev.ja.md#log-watch)** — 増えていくログファイルを追います。レベルの色分け、スタックトレースの
  折りたたみ、繰り返しの数え上げ、初めて見るパターンの NEW、エラーの急増のランプ、そして選んだ行を AI の設定の
  モデルに説明させる **EXPLAIN**。
- ほかはタブで手元に置いています。Docker の後ろにシェル、足もとに[クリップボード履歴](panes-desk.ja.md#clipboard)と
  [タイマー](panes-desk.ja.md#timer)ともう一つのシェル、GIT の後ろに [AI チャット](panes-ai.ja.md#ai-chat)と Log Watch。
- 手前に出しているのは見えている間だけ読むペイン（Docker エンジンとクリップボード）なので、新しい dev
  レイアウトでもすぐに動いているところが見えます。

## media

*観て、眺めて、音を見る。*

| | |
| --- | --- |
| キー | **Ctrl+Shift+F5** |
| ペイン | システムの列。YouTube (TV) の下に [Now playing](panes-media.ja.md#now-playing)・[Spectrum](panes-media.ja.md#spectrum)・[Mixer](panes-media.ja.md#mixer) を横に並べる。横に X と [RSS](panes-world.ja.md#rss) のタブ（X が手前） |
| 画像 | White |

<p align="center">
  <img src="../screenshots/elecdex-media.jpg" alt="White テーマの media プリセット：撮影用に用意した代わりのページ（テレビの動画ホーム画面風とタイムライン風。チャンネルもアカウントも絵も架空）を表示する YouTube (TV) ペインと X ペイン、X の後ろに RSS のタブ。テレビの下に、架空の曲とそのために描いたジャケットを出す now playing ペイン、蛍光管シアンの 16 バンドのスペクトラム、master・Music Player・Web Browser のストリップを持つミキサー">
  <br><sub>media · White — Web ペインには撮影用に用意した代わりのページを表示しています</sub>
</p>

- **[Web ペイン](panes-media.ja.md#browser-youtube-and-x)** — ブラウザー、YouTube、X を、必要なときに追加するペインで
  表示します。テーマの色で（設定によってはサイト本来の色で）描かれ、サイトごとのサインインは 1 つを共有します。
- **[スペクトラム](panes-media.ja.md#spectrum)と[ミキサー](panes-media.ja.md#mixer)** — コンピューターが再生している
  音のスペクトラムアナライザーを、1990 年代のカーステレオの表示のように（蛍光管のシアンかアンバー、LED、または
  テーマの色で）描きます。システム音量と、音を出している各アプリの音量を調整するミキサーもあります。
- **[Now playing](panes-media.ja.md#now-playing)** — プレーヤーが再生しているものを、Windows 自身のメディア表示が
  知っているとおりに表示します。アート、曲名・アーティスト・アルバム、いまどこか、そして前へ・再生／一時停止・
  次へ。**Windows のみ対応で、macOS と Linux はまだサポートしていません。**
- **[RSS](panes-world.ja.md#rss)** — 登録した RSS・Atom フィードの見出しを新しい順に表示します。

## desk

*書く、数える、時間を計る。*

| | |
| --- | --- |
| キー | **Ctrl+Shift+F6** |
| ペイン | システムの列。3 列: [Notes](panes-desk.ja.md#notes) の下に [Timer](panes-desk.ja.md#timer) と [Calculator](panes-desk.ja.md#calculator)、[Tasks](panes-desk.ja.md#tasks) の下に [Clipboard](panes-desk.ja.md#clipboard)、[Calendar](panes-desk.ja.md#calendar) の下に [Utility](panes-desk.ja.md#utility)（横のタブに ELEC-16 SCI）。シェルなし |
| 画像 | Black |

<p align="center">
  <img src="../screenshots/elecdex-desk.jpg" alt="Black テーマの desk プリセット：リリースのチェックリストを書いたメモペインとその下のタイマーと電卓、期限をメーターで描くタスクペインとその下の架空のコピーを並べたクリップボード履歴、3 か月のカレンダーとその下に Utility ペインのタブの前に出した関数電卓 ELEC-16 SCI。sin(45)+1/2 を正確な形 (1+√2)/2 で答えている">
  <br><sub>desk · Black</sub>
</p>

- **デスク系ペイン** — 入力して使う[電卓](panes-desk.ja.md#calculator)（全角数字や 3百万 も入力どおりに読み、
  テープ表示と、貼り付けた数値の列を集計する機能付き）、自動で保存されるプレーンな[メモ](panes-desk.ja.md#notes)、
  期限をメーターで描き、ペインを開いているかどうかに関係なく知らせる[タスク](panes-desk.ja.md#tasks)、そして
  [タイマー](panes-desk.ja.md#timer)。タイマーには、ラップがスペクトラムのように積み上がるストップウォッチ、その横で
  動くカウントダウン、一日の決まった時刻のためのアラームがあります。タスクの下には、画面に出ている間にコピーした
  ものを並べ、クリックでクリップボードへ戻せる[クリップボード履歴](panes-desk.ja.md#clipboard)、カレンダーの下には
  [Utility ペイン](panes-desk.ja.md#utility)（スリープの抑止、QR コード、エンコードとハッシュ）があり、そのタブの
  後ろに関数電卓 [ELEC-16 SCI](panes-retro.ja.md#elec-16) があります。
- クリップボードペインは見えている間だけクリップボードを読むので、タブに重ねず画面に出しています。Utility ペインは
  カレンダーの下にあり、QR コードが正方形を取れ、AWAKE の保持が目に入ります。

## ai

*2 つの会話と評議会、それを動かす GPU。*

| | |
| --- | --- |
| キー | **Ctrl+Shift+F7** |
| ペイン | システムの列。上下に 2 つの [AI chat](panes-ai.ja.md#ai-chat)。右のいちばん広い列に [ELEC system](panes-ai.ja.md#elec-system)、その下に [GPU](panes-system.ja.md#gpu) |
| 画像 | Business (Dark) |

<p align="center">
  <img src="../screenshots/elecdex-ai.jpg" alt="Business (Dark) テーマの ai プリセット（回答はすべて撮影用に用意した代役によるもの）：上下に並んだ 2 つの AI チャットペイン。上は Ollama で、Node.js でフォルダーを監視する方法への、コードブロック付きの回答と、届きつつある 2 つ目の回答（見出しに RX と経過秒数・文字数）。下は LM Studio で、git pull --ff-only が何を拒むかへの回答。右に ELEC system ペイン：LOGOS と PATHOS は APPROVE で緑に点灯し、REJECT で少数となった ETHOS、議決の帯は APPROVED 2-1-0-0。その下に GPU ペイン：架空のアダプタの負荷とビデオメモリの 1 分間の推移、エンジンごとの負荷、VRAM と共有メモリの棒">
  <br><sub>ai · Business (Dark) — 回答は撮影用に用意した代役のもの</sub>
</p>

- **[AI チャット](panes-ai.ja.md#ai-chat)** — 自分で動かす言語モデル（Ollama、LM Studio、llama.cpp など、OpenAI の
  チャット API を話すもの）や、API キーを持っているサービス（Anthropic、OpenAI、Gemini、OpenRouter）と会話でき
  ます。回答はストリーミングで届き、推論部分は折りたたまれます。キーは OS によって暗号化されてページには渡らず、
  会話はこのコンピューターの中にとどまります。テキストファイル・画像・PDF を質問に添えられます。**+** で選ぶか、
  ペインにドロップするか、画像を貼り付けます。画像は送る前に小さく描き直すので、カメラがファイルに書き込んだ情報
  （撮影場所など）は外に出ません。
- **[GPU](panes-system.ja.md#gpu)** — 評議会の下に、GPU の負荷と GPU 自身のメモリの埋まり具合。この機械で動かす
  モデルが頼るものです。
- どちらの AI ペインも送信したときにだけプロバイダーに問い合わせるので、それまでこのプリセットは何も消費しません。

<p align="center">
  <img src="../screenshots/elecdex-elec.jpg" alt="Tron テーマで、中央の列いっぱいに ELEC system ペイン：六角形のコアを囲む三角形に同じ大きさの 3 枚のプレート。LOGOS と PATHOS は APPROVE で緑に点灯し、REJECT で少数となった ETHOS は暗い赤で後ろに下がり、議決の帯は APPROVED 2-1-0-0、その下に 3 つの意見">
  <br><sub>ELEC system · Tron</sub>
</p>

- **[ELEC system](panes-ai.ja.md#elec-system)** — はい／いいえで答える議題を 3 つのモデルの評議会にかけます。
  LOGOS（論理）、ETHOS（倫理）、PATHOS（感情）がそれぞれの立場から判断して APPROVE、REJECT、ABSTAIN のいずれかに
  投票し、ペインが多数決または全会一致で議決します。各席は AI チャットのプロバイダーを使います。3 席すべてが同じ
  モデルでも構いません。

## cockpit

*機械のすべてを 1 枚に、シェルと 2 つのリンク。*

| | |
| --- | --- |
| キー | **Ctrl+Shift+F8** |
| ペイン | システムの列なし。列の位置に [Cluster](panes-system.ja.md#cluster)、その下に [Terminal](panes-system.ja.md#terminal)。その横に [Wi-Fi](panes-network.ja.md#wi-fi) の下に [Ethernet](panes-network.ja.md#ethernet) |
| 画像 | Black |

<p align="center">
  <img src="../screenshots/elecdex-cockpit.jpg" alt="Black テーマ（淡い地に黒に近い文字と走査線）の cockpit プリセット：左上、システムの列の代わりに CLUSTER ペイン。ALL SYSTEMS NOMINAL と並ぶ警告灯の行、日付の上の時計、その横に 5 つずつ 2 行でメモリ・VRAM・スワップ・いちばん埋まっているディスク・接続先の数・いちばん重いプログラム・電源・稼働時間・リンクの通信量・アドレス、その下に OS・メーカー・モデル・筐体・CPU・架空の GPU・AWAKE の行。その下に CPU の 1 分間の折れ線、16 コアの棒、メモリ・GPU・ディスク I/O・ネットワークの受信と送信・PING の折れ線とピークと平均。その下にシェル。右に、Wi-Fi ペインとその下の Ethernet ペイン（どちらも架空のリンク）">
  <br><sub>cockpit · Black</sub>
</p>

- **[クラスター](panes-system.ja.md#cluster)** — 車の計器盤のように、機械の様子を 1 枚のペインにまとめます。警告灯と
  いちばん重い異常の言葉、時計と日付、CPU・メモリ・GPU・ディスク I/O・ネットワーク・PING の 1 分間、余裕があれば
  コアごとの負荷、そのほかの値をひと目で。全画面から細い列まで、大きさに合わせて組み替わります。
- cockpit は、ペインを持つプリセットのうち唯一システムの列を持ちません。Cluster ペインが列の役目を果たし、それ
  以上のことを示すためです。1600x900 でも、Cluster はいちばん広い組み方ですべてのコアを出せる大きさがあります。
- 画像の [Wi-Fi](panes-network.ja.md#wi-fi) と [Ethernet](panes-network.ja.md#ethernet) は架空のリンクです。

## retro

*elecdex の 2 台の機械と、その音。*

| | |
| --- | --- |
| キー | **Ctrl+Shift+F9** |
| ペイン | システムの列。[ELEC-16](panes-retro.ja.md#elec-16)・ELEC-16 SCI・[CHIP-8](panes-retro.ja.md#chip-8) をタブにした 1 つのペイン（ELEC-16 が手前）、その下に 16 バンドの [Spectrum](panes-media.ja.md#spectrum) |
| 画像 | Tron（手前は ELEC-16 SCI） |

タブの後ろの機械は、見えていない間は一時停止します。

<p align="center">
  <img src="../screenshots/elecdex-retro.jpg" alt="Tron テーマの retro プリセット：左にシステムの列、右に ELEC-16、その関数電卓 ELEC-16 SCI、CHIP-8 をタブにした 1 つのペイン。手前は関数電卓で SLATE の本体、液晶に sin(45)+1/2 を正確な形 (1+√2)/2 で答え、その下に関数のキーと数字のキー。横にパネルの CORE でレジスタと動いている ROM のコード。その下に 16 バンドのスペクトラム">
  <br><sub>retro · Tron · 手前は ELEC-16 SCI</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-chip8.jpg" alt="Amber テーマで、中央の列いっぱいに CHIP-8 ペイン：T8NKS のタイトル画面（向かい合う 2 台の戦車をアンバーの 4 段の濃淡で描いたもの）と、その横のキーパッド、レジスタ、プログラムカウンタの前後のコード">
  <br><sub>CHIP-8 · Amber</sub>
</p>

- **[CHIP-8](panes-retro.ja.md#chip-8)** — CHIP-8・SUPER-CHIP・XO-CHIP のプログラムを elecdex 自前の機械で動かし
  ます。chip8Archive のゲーム・ビジュアルノベル・おもちゃ 104 本（どれも画面の見本つき）、手元のプログラムの
  ファイル、セーブ、画面の横にレジスタ・メモリ・コード。

<p align="center">
  <img src="../screenshots/elecdex-elec16.jpg" alt="中央の列に CLASSIC スキンの ELEC-16 ペイン：名前板に ELEC-16 と 16-BIT POCKET COMPUTER のある黒いポケコン、正弦波を描く緑がかった灰色の液晶、赤い BRK キーのあるキーボード、その横にレジスタとコードを出す CORE">
  <br><sub>ELEC-16 · CLASSIC スキン</sub>
</p>

<table>
  <tr>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-alloy.jpg" alt="ALLOY：ヘアラインの金属に彫った名前板の文字、琥珀の線 1 本、沈んだ黒い鍵盤の板に黒いキー"><br><sub>ALLOY</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-graphite.jpg" alt="GRAPHITE：黒鉛色の梨地の本体、明るい文字キー、白に近いテンキー、濃い機能キーと赤い BRK"><br><sub>GRAPHITE</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-neo.jpg" alt="NEO：冷たい明るい灰の本体、切り欠きに収まった低いキー、紙のような画面、コバルトの ENTER"><br><sub>NEO</sub></td>
  </tr>
  <tr>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-mochi.jpg" alt="MOCHI：桜色に白い水玉、ミント・クリーム・レモン・ラベンダーの艶のあるキー、プラム色の画面"><br><sub>MOCHI</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-glass.jpg" alt="暗いテーマの GLASS：縁が光る暗いガラスの本体、奥に見える基板、ガラスのキー"><br><sub>GLASS</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-glass-light.jpg" alt="明るいテーマの GLASS：同じガラスが明るくなり、ENTER はアクセントの青"><br><sub>GLASS · 明るいテーマ</sub></td>
  </tr>
</table>

<p align="center">
  <img src="../screenshots/elecdex-play-air.jpg" alt="Phosphor テーマで、グラファイトの横長の本体の PLAY-320 にした ELEC-16 ペイン：画面に ELECAIRCOMBAT のコックピット、シーカー円の中に赤いロックの枠と ENGAGE の付いたエース GANNET、そこで炸裂するミサイル、下にレーダー、スコア、損傷の計器と点いた LCK 灯；横の CORE には動いている E16 のレジスタとプログラムカウンタのコード">
  <br><sub>ELEC-16 PLAY（PLAY-320）· ELECAIRCOMBAT · Phosphor · 横に CORE</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-play.jpg" alt="Business (Dark) テーマで、コーラルの縦長の本体の PLAY-320 にした ELEC-16 ペイン：カラーの画面に ELECLANCE、小さな敵のあいだで自機が LANCE をまっすぐ撃ち上げ、左右のパネルにスコア、CHAIN、SHIP、BOMB、VOLT、横の GAMES にはスロットの ELECLANCE、3 本のゲームの棚、DEVELOP">
  <br><sub>ELEC-16 PLAY（PLAY-320）· ELECLANCE · Business (Dark)</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-play-drill.jpg" alt="Business (Light) テーマで、画面だけを出す PLAY-320 にした ELEC-16 ペイン：ELECDRILL の赤、黄、緑、青のブロックの井戸、34 m の掘り手とその上で光る 3 CHAIN、左右に深さのゲージ、AIR のタンク、DRILLERS、CHAIN；横の MEM には E16 のメモリの 16 進">
  <br><sub>ELEC-16 PLAY（PLAY-320）· ELECDRILL · Business (Light) · 画面だけ、横に MEM</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-play-fighter.jpg" alt="Tron テーマで、画面だけを出す PLAY-320 にした ELEC-16 ペイン：ELECFIGHTER の最初の試合、GRID のステージで、青いワイヤーと塗りの S4 OUTBOX のパンチが火花とともに赤い S2 RUSH に当たる。後ろに摩天楼と遠近の床、上に体力のバーと TIME。横の GAMES の差し口に ELECFIGHTER">
  <br><sub>ELEC-16 PLAY（PLAY-320）· ELECFIGHTER · Tron · 画面だけ、横に GAMES</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-sci.jpg" alt="Business (Light) テーマで、チョークのような白い縦長の本体の SCI-128 にした ELEC-16 ペイン：2D 表示で sin(45)+1/2 を打ち、分数は教科書の形で組まれ、下に答えが正確な形 (1+√2)/2 で出ている。橙の SHIFT 面と ALPHA の字のあるキー、黒い十字キー、赤い DEL と AC、青い =。横の CORE に E16 のレジスタとコード">
  <br><sub>ELEC-16 SCI（SCI-128）· CHALK · Business (Light)</sub>
</p>

- **[ELEC-16](panes-retro.ja.md#elec-16)** — elecdex が独自に設計した 16 ビットのポケコン。自前の RISC の CPU、ROM の
  BASIC と機械語モニタ、液晶とキーボード、記憶カード、TypeScript をその機械語にコンパイルする CODE 画面、そして
  AI と話す LINK。**PLAY-320** にすると、カートリッジ、スプライト、音 16 チャンネルのゲーム機になり、ELECLANCE、
  ELECAIRCOMBAT、ELECDRILL と 1 対 1 の対戦格闘 ELECFIGHTER の 4 本のゲームと、ゲームを作るキットが付きます。
  **ELEC-16 SCI**（retro と desk のタブにもある）として選ぶと関数電卓になります。式は教科書の形で組まれ、答えは
  分数や根号のまま残り、統計、進数、関数の表、方程式、複素数、行列、プログラムのモードと、物理定数、単位の換算、
  Σ・微分・積分があります。
- retro と desk の ELEC-16 SCI のタブは、ピッカーの *elec-16 sci* の行と同じく、新しい SCI-128 の機体で始まります。
  誰かの BASIC のプログラムを消して電卓にすることはありません。本体に場所を取らせるため、パネルは畳んであります。

## blank

*まだ何もない、自分で組み立てる。*

| | |
| --- | --- |
| キー | **Ctrl+Shift+F10** |
| ペイン | なし |
| 画像 | Amber（最初のペインを選ぶピッカーを開いたところ） |
| 状態 | v0.0.44 でリリース |

<p align="center">
  <img src="../screenshots/elecdex-blank.jpg" alt="Amber テーマの blank プリセット：ペインが一つもないワークスペースの上に、ペイン追加のピッカーが開き、すべてのウィジェットが説明つきで並ぶ。上部に配置の選択（右、下、新しいタブ、ポップアップ）">
  <br><sub>blank · Amber · 最初のペインを選ぶピッカー</sub>
</p>

- **blank** — ペインが一つもないレイアウトです。*no panes in this layout* の下の **+ add pane**
  （または Ctrl+Shift+A）でピッカーが開き、最初に選んだペインが画面いっぱいに入ります。そこから分割し、タブを
  足し、ペインをドラッグして組み立てます。どのレイアウトでも、最後のペインを閉じると同じように空になります。
- 空のレイアウトでは、ピッカーでどの配置を選んでいても最初のペインが画面いっぱいに入り、分割と新しいタブのキー
  （Ctrl+Shift+E、Ctrl+Shift+O、Ctrl+Shift+T）は最初のペインとしてシェルを入れます。
- そこからの組み立て方: [ワークスペース](workspace.ja.md)。
