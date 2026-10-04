# ELEC-16 PLAY ゲーム開発の手引き（ゲームキット）

elecdex の ELEC-16 ペインで、PLAY-320 のゲーム（カートリッジ）を作るための手引きです。プログラムは e16c（TypeScript の部分集合）で書き、絵は PNG、曲はテキスト（MML）で用意します。アプリだけで作れ、Node やリポジトリは要りません。

仕組みの詳しい仕様は [elec16-play.md](elec16-play.md)（10 章 ゲームキット、11 章 開発環境）、e16c の言語は [elec16-e16c.md](elec16-e16c.md)、見本のゲームは [elec16-eleclance.md](elec16-eleclance.md) にあります。

## 目次

1. [はじめる](#1-はじめる)
2. [フォルダの形と game.json](#2-フォルダの形と-gamejson)
3. [プログラムの形](#3-プログラムの形)
4. [画面: タイル、背景、スプライト、パレット](#4-画面-タイル背景スプライトパレット)
5. [絵（PNG）](#5-絵png)
6. [音と曲（MML）](#6-音と曲mml)
7. [パッド、点、セーブ、数](#7-パッド点セーブ数)
8. [メモリとバンク](#8-メモリとバンク)
9. [エラーの読み方と困ったとき](#9-エラーの読み方と困ったとき)
10. [ライブラリの一覧](#10-ライブラリの一覧)

## 1. はじめる

1. ELEC-16 ペインのパネルで **TUNE** を開き、モデルを **PLAY-320** にします
2. パネルの **GAMES** を開き、**DEVELOP** の **NEW GAME** を押して、空のフォルダを選びます
3. 雛形（十字で動き、A で撃ち、B で音が鳴る船）がフォルダに書かれ、ビルドされて、ユニットに差さります。起動画面で **START** を押すと始まります
4. フォルダの `main.e16.ts` をエディタ（VS Code など）で開いて直し、**保存**します。ペインが見えていれば自動でビルドし直して差し直すので、もう一度 START を押します

すでにあるゲームのフォルダは **OPEN FOLDER** で開きます。**REBUILD** でいつでも作り直せ、**CLOSE** で閉じます。開けるフォルダはページに 1 つで、アプリを閉じると忘れます。

ビルドが成功すると、GAMES に大きさ（バンク、RAM のコードのバイト数、タイルの数）が出ます。失敗すると「ファイル:行: 内容」が出ます（最大 8 件）。

## 2. フォルダの形と game.json

```
mygame/
  game.json          ゲームの説明（下の表）
  main.e16.ts        プログラム（ファイルはいくつに分けてもよい）
  art/palettes.png   パレット（1 行が 16 色）
  art/ship.png       スプライトの絵
  music/songs.mml    曲と効果音
  assets.e16.ts      ビルドが書く定数（手で直さない）
  compiled.s         ビルドが書くアセンブリ（読むためのもの。手で直さない）
  lib/               エディタのためのライブラリと型の写し（ビルドはアプリのものを使う）
  tsconfig.json      エディタのための設定
```

ビルドが読むのは `game.json` と、そこに書かれたファイルだけです。名前はフォルダの中の相対パスで書き、`..` や絶対パスは使えません。1 ファイル 4 MB、合わせて 16 MB までです。

| 項目 | 中身 |
|---|---|
| `id` | 英大文字、数字、`-` で 16 文字まで。セーブ RAM はこの id ごとに残る。棚では同じ id のビルドを置き換える（アプリに入っているゲームの id は使えない） |
| `name` | 起動画面と棚に出る名前（24 文字まで） |
| `saveBanks` | セーブ RAM のバンク数（0〜4、1 つ 8 KB） |
| `about` | 棚に出る説明 |
| `sources` | e16c のファイル。`{ "file": "boss.e16.ts", "bank": 1 }` で、そのファイルのコードをカートリッジのバンクに置く（8 章） |
| `palettes` | `{ "png": "art/palettes.png", "names": ["ship", "space"] }`。定数 `PAL_名前` が行の番号 |
| `sheets` | `{ "name", "png", "cell": 8/16/32, "palette", "count"?, "tile"? }`。定数 `名前_TILE`、`_BANK`、`_AT`、`_BYTES`、`_FRAMES`、`_STEP` |
| `maps` | `{ "name", "png", "palettes": [{ "palette", "slot" }], "tile"?, "front"? }`。背景の絵。定数 `名前_TILE`、`_TILES_BANK`、`_TILES_AT`、`_TILES_BYTES`、`_MAP_BANK`、`_W`、`_H`、`_ROWS_PER_BANK` |
| `music` | MML のファイル。定数 `SONG_名前_BANK`、`SONG_名前_AT` |
| `tables` | `{ "name", "file" }`。数を並べたテキスト（16 ビットの語）。定数 `名前_BANK`、`_AT`、`_LEN` |

## 3. プログラムの形

`export function main(): void` が入口です。ここから戻ると起動画面に戻ります。決まった形は次のとおりです。

```ts
export function main(): void {
  kitInit()            // ライブラリの表（sin など）。起動の START を「押した」としない
  soundInit()
  poke16(VCTRL, 3)     // モード 1（タイルとスプライト）、表示 ON
  palette(PAL_SPACE, 0)
  palette(PAL_SHIP, 8)
  load(SHIP_BANK, SHIP_AT, SHIP_TILE * 32, SHIP_BYTES)   // 絵を映像メモリへ
  let seen: u16 = 0
  for (;;) {
    seen = frame_wait(seen)   // 次のフレーム（毎秒 60）まで眠る
    sprShow()                 // 前のフレームで作ったスプライトを画面へ
    padRead()
    soundTick()
    if (pressed(B_START)) return
    // ここでゲームを 1 フレーム進め、sprBegin() のあと spr(...) で描く
    sprBegin()
    spr(x, y, SHIP_TILE, S16)
  }
}
```

- 名前は全ファイルで 1 つの名前空間です（`import` は TypeScript とエディタのためで、e16c は読みません）。ライブラリと同じ名前は使えません
- 関数の引数は 4 つまで。浮動小数はなく、16 ビットの `u16`、`i16`、`u8`、`bool` と配列（`words(n)`、`bytes(n)`）です（[elec16-e16c.md](elec16-e16c.md)）
- 位置は 1/16 ドットの単位で持つと、ゆっくりした動きも滑らかに書けます（ELECLANCE の書き方）

## 4. 画面: タイル、背景、スプライト、パレット

- 画面は 320×288。モード 1 は 8×8 の 16 色タイルを使う描画回路で、背景 2 枚（BG0、BG1。それぞれ 64×64 マス）と 128 個のスプライト（8、16、32 ドット）
- **パレット**は 16 本。背景用が slot 0〜7、スプライト用が 8〜15。どの層も色 0 は透明。何も描かれない点は slot 0 の色 0（背景色）
- **スプライトのタイルの語**: `タイル番号 | (パレット << 10) | 反転`。スプライトのパレットの欄は 0〜7 で slot 8〜15 を表す（slot 9 なら `(9 - 8) << 10`）。`FLIP_H`、`FLIP_V`、`BEHIND`（背景より後ろ）
- 先に `spr` したものが前に出ます。1 行に出るのは 32 個まで（番号の若い順）
- 背景の 1 マスは `タイル | (パレット << 10) | 反転 | 前` の語。`cellAt(層, x, y)` がそのマスの映像メモリの番地、`vpoke` で書きます。地図の絵は `mapRow` で 1 行ずつ写します
- 文字は自分のフォントの絵（シート）を作り、`text`、`number` で背景に書きます
- `RASTER` の表と `raster(1)` で、8 行ごとに BG0 の横のずらしを変えられます（波打たせる効果）

## 5. 絵（PNG）

- 8 ビットの PNG（RGB、RGBA、グレー、パレット）。不透明度が半分未満の点は透明
- **色はパレットの色と完全に一致すること**（RGB555 で比べる）。合わない点は「(x, y) is #rrggbb, not in its palette」と場所を示して断ります。勝手に減色はしません
- パレットの絵は幅 16 点で、1 行が 1 本。左端が色 0（透明、または背景色）
- シートは同じ大きさのコマを左上から行ごとに。16×16 なら 1 コマが 4 タイル
- タイルは全部で 1,024 枚。同時に出ないもの（タイトルとボスなど）は `"tile"` で同じ場所を指し、使う前に `load` します

## 6. 音と曲（MML）

16 チャンネル。**0〜11 が曲、12〜15 が効果音**（効果音は曲を止めない）。1 ファイルに `song 名前` で区切って何曲でも書けます。

```
song theme
tempo 6                                # 16 分音符のフレーム数（6 で 150 BPM）
inst lead wave=sq25 vol=12 env=2/250/9/120 vib=3,6 pan=6
define riff = o2 l16 a a > a < a
C0: @lead L o5 l8 a4. g8 a2           # L から繰り返す
C3: [$riff]4
echo C1 = C0 delay 12 vol -6 pan 11    # C0 のこだま
```

- 楽器: `wave`（sq12 sq25 sq50 sq75 tri saw noise tbl0〜7）、`vol`、`env`（アタック ms / ディケイ ms / サステイン 0〜15 / リリース ms）、`slide`、`vib`（深さ, 速さ）、`pan`、`drop`（キックのように音程を毎フレーム落とす）
- チャンネルの中: 音名と長さ、`r` 休み、`o` `<` `>`、`l`、`v`、`@`、`p`、`q`、`k`（移調）、`L`、`[ … ]n`、`$名前`
- 長さはフレームの整数でなければなりません（`tempo 5` の 32 分音符はだめ）
- 繰り返すチャンネルは全部同じ長さにします。ずれるとループのたびに離れていきます
- プログラムからは `play(SONG_X_BANK, SONG_X_AT, true)`（曲）、`false`（効果音）、毎フレーム `soundTick()`

## 7. パッド、点、セーブ、数

- `padRead()` を毎フレーム。`held(B_LEFT)` は押されている間、`pressed(B_A)` は押した瞬間
- 点は 2 語（下 4 桁と上 4 桁）で持ち、`scoreAdd`、`scoreMore`、`scoreShow`
- セーブ RAM（`saveBanks` が 1 以上）は `saveRead(番地)`、`saveWrite(番地, 値)`。電池バックアップと同じく、ゲームの id ごとに残ります
- `sin`、`cos`（256 段で 1 回り、256 倍）、`aim(dx, dy)`（向き）、`rand`、`randBelow(n)`

## 8. メモリとバンク

| 番地 | 中身 |
|---|---|
| 0280–1FFF | 大域変数と配列（`let`、`words`、`bytes`） |
| 2000–6FFF | プログラム（起動のときにカートリッジから写される。20 KB まで） |
| 7000–7FFF | スタック |
| C000–DFFF | バンクの窓（カートリッジのデータ、`bank` を付けたファイルのコード、セーブ RAM） |

- コードが 20 KB を越えると「outside RAM's 2000-6FFF」になります。あまり使わない部分（タイトル、ボスなど）のファイルに `"bank": 1` などを付けて、カートリッジのバンクに置きます
- **バンクに置いたコードは `bank()` を呼ばない**こと。呼ぶと自分の命令が窓から消えます（データを窓から読む関数は RAM のファイルに置く。ライブラリの `load` などは窓を元に戻すので、バンクのコードから呼んでかまいません）
- `compiled.s` に変数の番地（`; 名前 at 0x…`）と全体のアセンブリが出ます。CORE と MEM でたどるときに使えます

## 9. エラーの読み方と困ったとき

| 出るもの | 意味 |
|---|---|
| `main.e16.ts:12: …` | e16c のエラー。行と内容（[elec16-e16c.md](elec16-e16c.md) の決まり） |
| `(x, y) is #…, not in its palette` | 絵の点の色がパレットにない |
| `code at 0x2000-0x…, outside RAM's 2000-6FFF` | コードが 20 KB を越えた（8 章） |
| `… needs tiles past 1024` | タイルが足りない（同時に出ない絵で場所を共有する） |
| `a 1/32 note is not whole frames` | 曲の長さがフレームにならない |
| `… is not a file inside the folder` | game.json の名前がフォルダの外を指している |
| 起動画面に `FAULT 0004 AT C…` | バンクのコードが窓を替えた、または奇数番地の `peek16` |

- 起動画面に戻らずに止まったら、パネルの CORE で止まった番地を見て、`compiled.s` で探します
- 4 MHz なら 1 フレームに使えるのは 66,667 サイクルです。ELECLANCE は平均で約 9,000 サイクルでした

## 10. ライブラリの一覧

`lib/kit.e16.ts`:

| 関数 | 働き |
|---|---|
| `kitInit()` | 表の読み込み。最初に |
| `frame_wait(seen)` | 次のフレームまで眠り、フレームの数を返す |
| `raster(on)`、`RASTER` | 8 行ごとの BG0 の横ずらし |
| `bank(b)` | 窓にバンク b（前のバンクを返す） |
| `vpoke(at, v)`、`vfill(at, v, n)` | 映像メモリに書く |
| `dma(src, dst, len)`、`load(b, src, dst, len)` | 映像メモリへ写す（`load` はカートリッジのデータから。バンクをまたげる） |
| `palette(row, slot)`、`colour(slot, k, rgb)` | パレットを slot へ、1 色を書く |
| `palKeep(row, slot)`、`palMix(slot, rgb, t)`、`mix(a, b, t)` | 色を覚えて、別の色へ混ぜる（明滅、フェード） |
| `cellAt(layer, x, y)`、`mapRow(b, src, layer, y)` | 背景のマスの番地、地図の 1 行 |
| `text(at, s, font)`、`number(at, n, digits, zero)` | 文字と数を背景に |
| `sprBegin()`、`spr(x, y, tile, size)`、`sprShow()`、`sprCount()` | スプライト |
| `padRead()`、`held(mask)`、`pressed(mask)`、`padNow()` | パッド |
| `sin(a)`、`cos(a)`、`aim(dx, dy)`、`rand()`、`randBelow(n)`、`randSeed(s)` | 数 |
| `scoreAdd(at, n)`、`scoreMore(a, b)`、`scoreShow(cell, at, zero)` | 点 |
| `saveRead(off)`、`saveWrite(off, v)` | セーブ RAM |

`lib/sound.e16.ts`: `soundInit()`、`play(bank, at, music)`、`soundTick()`、`musicStop()`、`musicMute(mask)`（曲の一部のチャンネルを黙らせる）、`soundMaster(v)`（全体の音量）。

定数: ボタン `B_UP` … `B_SELECT`、スプライトの大きさ `S8` `S16` `S32` `S_NONE`、`FLIP_H` `FLIP_V` `BEHIND`、映像のレジスタ `VCTRL` `BG0X` など、番地 `MAP0` `MAP1` `OAM` `PALS`。
