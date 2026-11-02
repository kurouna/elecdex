# ランチャーの表示を速くする: 設計案（A+B+C、D は見送り）

状態: 実装済み（2026-11-02、2398985e）。Fable 5.1 のレビューと利用者の判断（アイコンなしは残さない）を反映済み（第 3 版）。

## 目的

Windows で起動するたびに、ランチャーの最初のアイコンが出るまで直列で約 2 秒かかっている。

1. `launcher.list` が初回スキャン（フォルダ走査と PowerShell。約 1.3 秒、decisions.md）を待つ。
2. 見えているタイルごとに `launcher.icon` を呼び、PowerShell を起動する（`Add-Type` のコンパイル込みで約 0.6 秒）。

どちらのキャッシュもメモリにしかないので、毎回の起動で払い直している。2 回目以降の起動では、一覧とアイコンが IPC 1 往復で出るようにする。初回の速さは変えない。

## A. アイコンをディスクに残す（main）

**新規 `src/main/launcher/icon-store.ts`: `IconStore`**

- 置き場所は `userData/launcher-icons/<id>.png`。id は 16 桁の hex（`idOf`）なので、ファイル名として安全。
- 1 つの JSON にまとめず、アイコンごとのファイルにする。JsonStore は main で同期的に書くので、1 MB 近い JSON を新しいアイコンのたびに書き直すことになるのを避ける。
- `get(id, target): Promise<string | null>`
  1. メモリにあれば返す（今の `Map`。上限 1000 件）。
  2. ディスクにあり、**30 日以内**なら `fsp.readFile` で読む。PNG の署名を確かめて data URL で返す。
  3. それ以外は取り出す（Windows: `IconBatcher`、無ければ `electronIcon`）。結果は `fsp.writeFile` で一時ファイルに書き、`replaceFile` で置く。
- **期限切れはその場で取り直す**。裏で取り直すことも、mtime の確認もしない。取り直すのは月に 1 回、ランチャーを表示したとき（PowerShell 1 回）。タイマーは持たない。
  - `.lnk` の mtime 確認は外した。アプリを更新しても普通はショートカットが書き換わらないので、ほとんど何も検出できない。
  - 7 日ごとに裏で取り直す案も外した。C のストアはリロードまで古い data URL を持ち続けるので、取り直したアイコンが画面に出ない。
- **ディスクに残すのは、そのプラットフォームの本来の取り方で得たアイコンだけ**（Windows ならシェル、それ以外なら `getFileIcon`）。次のものはメモリにだけ置き、elecdex を次に起動したときに取り直す（利用者の判断、2026-11-02）。
  - **アイコンなし**。インストールの途中で取りに行った場合などに、モノグラムのまま残り続けないようにする。
  - **Windows で、シェルが答えなかったときの `getFileIcon` の代わりのアイコン**。汎用のアイコンになりやすく（decisions.md）、ディスクに残すと 30 日間それが出続ける。
  - コスト: 該当するタイルが見えたときだけ、起動ごとに PowerShell が 1 回走る（約 0.6 秒）。キャッシュにあるほかのアイコンは待たない。アイコンは 1 件ずつ IPC で問い合わせるので（D を見送った理由の一つ）。該当する項目はまれな見込み（PIDL 経由のアイコンは既存の 83 件すべてで取れた。decisions.md）。
  - **既存の問題の修正**: `IconBatcher` は、実行の失敗（タイムアウト、PowerShell がブロックされたとき）にもバッチの全ファイルに null を返す（windows-icons.ts:218-223）。これを「アイコンなし」と区別する（失敗は reject）。上の方針ではどちらもディスクに残らないので、誤ったキャッシュは生まれない。それでも、失敗をアイコンなしとして扱わないことを単体テストで固定する。
- **掃除**: 一覧の再スキャンが成功したら、カタログ（ユーザーの項目 + システム）に無い id のファイルを消す。スキャンが失敗したときは消さない。
- URL の項目は今どおりストアの手前で null を返し（ipc/launcher.ts:95）、ファイルを作らない。
- `electronIcon` と `iconSource` を ipc/launcher.ts からここへ移す。書き込みに失敗してもアイコンは返す（ログに残すだけ）。
- 全プラットフォームで同じ経路を使う。macOS と Linux では得もないが損もない。
- **変更**: ipc/launcher.ts、windows-icons.ts（`IconBatcher` の失敗の扱いと、24-25 行のコメント「アプリ終了までのキャッシュ」）、ipc/launcher.ts:48 のコメント。

## B. 一覧をディスクに残す（main）

- `launcher-catalog.json` を JsonStore で持つ: `{ version: 1, platform, entries: CatalogEntry[] }`。
  - zod の上限: 2000 件、`target` ≤ 1024、`args` ≤ 32 個 × 1024、`exec` ≤ 2048。
  - platform か version が違う、または壊れているファイルは使わず、初回スキャンに戻る。
- `SystemCache` のオプションに `initial?: T[]` と `onScanned?(entries)` を足す。
  - `initial` があれば、初回の `get()` はそれをすぐ返し、必ず裏で再スキャンする。保存時刻は持たない（`#at = 0` から始める。別のセッションの時計を信じない）。
  - `onScanned` は、中身が変わったときだけ保存する。id はターゲットと引数のハッシュなので、今の `sameList`（id・名前・グループ）で足りる。ただし Linux の `exec` だけは同じ id のまま変わり得るので、比較に加える。
  - 書き込みは JsonStore の同期書き込みのまま。約 50 KB を、変わったときだけ、多くても 1 分に 1 回なので問題にならない。
- **安全性**: 起動対象が userData のファイルから来るが、同じ場所の settings.json の `launcher.items` と信頼の境界は変わらない。起動時の検査もそのまま効く。アンインストールされたアプリは再スキャンが終わるまで一瞬残る。起動すると OS のエラーが status に出る。
- **変更**: system-cache.ts、ipc/launcher.ts、新規 `src/main/launcher/catalog-file.ts`（スキーマ）。

## C. アイコンをページ全体で共有する（renderer）

- 新規 `src/renderer/widgets/launcher/icons.svelte.ts`。モジュールに 1 つ、`SvelteMap<string, string | null>` と、問い合わせ中の id の Set を持つ。
- LauncherWidget はローカルの `icons` をやめてこれを読む。ポップアップを開き直したときや移動で再マウントしたときに、モノグラムが一瞬出なくなる。`{...icons}` のコピーも無くなる。
- 持つのは答えだけで、main 側の購読は無いので、`refCounted`・`whenPageGoes`・lifecycle の契約は対象外。
- IntersectionObserver に `rootMargin: '0px 0px 50% 0px'` を足す。最初のバッチが 64 件を超えると 2 回目の PowerShell に回るが、見えているタイルが DOM の順で先に送られる。

## D. まとめて取る IPC → **見送りを提案**

C でオブジェクトのコピーが無くなると、残るのは 1 ms に満たない invoke が約 64 回だけで、どれも main の 20 ms のバッチで既にまとめられている。逆に、次のマイナスがある。

- 1 回の呼び出しが、いちばん遅い id に合わせて返る。新しいアプリが 1 つ入っただけで、キャッシュにあるアイコンもすべて 0.6 秒待つことになる（悪化）。
- preload の面が変わるので、コミット前に全スイートが必須になる。api.ts・ipc-table.ts・文書も変わる。

`launcher.icon` はそのまま残す。

## テスト

| 段 | 内容 |
|---|---|
| unit `launcher-icon-store.test.ts`（新規） | ディスクにあれば取り出さない。無ければ取り出して書く。アイコンなしと Windows の代わりのアイコンは書かず、同じ起動の中ではメモリから返し、新しいストア（次の起動）では取り直す。PNG でないファイルは取り直す。30 日を過ぎたら取り直す。取り出しの失敗では何も書かない。掃除はスキャンが失敗したときにはしない。書き込みに失敗してもアイコンは返る |
| unit `windows-icons.test.ts`（拡張） | 失敗した実行は null ではなく reject する。シェルが返す null とは区別する |
| unit `launcher-system-cache.test.ts`（拡張） | `initial` があればスキャンを待たずに返し、必ず裏で再スキャンする。変わったときだけ `onScanned` |
| unit `launcher-catalog-file.test.ts`（新規） | platform・version の違い、上限を超えたもの、壊れたファイルは使わない |
| component `launcher-widget.test.ts`（拡張） | 再マウントしても main に聞き直さず、最初からアイコンが出る |
| e2e `launcher.spec.ts`（追加） | `relaunch()` で同じ userData に 2 回起動する。1 回目にアイコンが出たあと、2 回目もタイルとアイコンが出る。`launcher-icons/` の mtime が変わらず、`launcher-catalog.json` がある。時間は測らない（CI の速さに左右される e2e は入れないという利用者の判断）。実機の Start Menu を読む既存のテストと同じ skip 条件 |
| e2e `contracts/panes.ts` | ランチャーの行の「main が持つもの」に書き足す必要があるか確かめる |
| 計測 | 一時的に `console.time` と `performance.mark` を入れて、本番ビルドで 1 回測る。初回、2 回目の起動、ポップアップの開き直しで、マウントから最初のアイコンまで。数値は decisions.md に書き、計測のコードは残さない |

コミット前に実行するもの: `npm run verify`、`npm run build`、`npm run test:e2e:smoke`、launcher.spec、contracts（lifecycle・ipc）。D を見送れば preload の面は変わらないので、全スイートは不要。

## 文書（同じコミットで）

- docs/decisions.md に 1 行（設計と実測値。D を見送った理由も）。
- architecture.md の userData の一覧に `launcher-catalog.json` と `launcher-icons/` を加える。
- docs/guide/panes-system.md（.ja / .zh-CN）の Launcher の表に「Stores」の行を足す。

## 含めないもの

- PowerShell の常駐、出力を 1 行ずつ返す、`powershell.ts` への分離、起動処理の分離。
