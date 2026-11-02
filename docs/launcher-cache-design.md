# ランチャーの表示を速くする: 設計（A+B+C、D は見送り）

状態: 実装済み（2026-11-02、2398985e）。Fable 5.1 のレビューと、利用者の判断（アイコンなしはディスクに残さない）を反映した第 3 版を実装した。以下は実装に合わせて書き直したもの。判断と実測値は decisions.md にもある。

## 目的

Windows では起動するたびに、ランチャーの最初のアイコンが出るまでに直列で約 5 秒かかっていた（ページの開始から数えた実測。下の「結果」）。

1. `launcher.list` が初回スキャン（フォルダ走査と PowerShell。約 1.3 秒、decisions.md）を待つ。
2. 見えているタイルごとに `launcher.icon` を呼び、PowerShell を起動する（`Add-Type` のコンパイルを含む）。

どちらのキャッシュもメモリにしかなかったので、毎回の起動で払い直していた。2 回目以降の起動では、一覧とアイコンが IPC 1 往復で出るようにする。初回の速さは変えない。

## A. アイコンをディスクに残す（main）

**`src/main/launcher/icon-store.ts`: `IconStore`**

- 置き場所は `userData/launcher-icons/<id>.png`。id は 16 桁の hex（`idOf`）。それ以外の形の id ではファイルを読み書きしない。
- 1 つの JSON にまとめず、アイコンごとのファイルにする。JsonStore は main で同期的に書くので、1 MB 近い JSON を新しいアイコンのたびに書き直すことになるのを避ける。
- `get(id, target): Promise<string | null>`。同時に来た同じ id の要求は 1 回の取り出しを共有する。
  1. メモリにあれば返す（`Map`。上限 `ICON_MEMORY_LIMIT` = 1000 件。超えた分は毎回ディスクから読む）。
  2. ディスクにあり、**30 日以内**（`ICON_MAX_AGE_MS`。ファイルの mtime で判定）なら `fsp.readFile` で読む。PNG の署名を確かめて data URL で返す。
  3. それ以外は、注入された `draw(target)` で取り出す。`{ icon, keep }` が返る。`keep` のときだけ `fsp.writeFile` で一時ファイル（`<id>.png.tmp`）に書き、`replaceFile` で置く。
  4. `draw` が throw したときは何も覚えず null を返す。次の要求で取り直す。
- 取り出し方（`drawIcon`）は `ipc/launcher.ts` にある。Electron に依存する `electronIcon`・`iconSource` もそこに残した（`IconStore` を Electron なしで単体テストできるように）。
  - Windows: `IconBatcher`（シェル）が返したアイコンは `keep: true`。シェルが null を返したとき、または実行が失敗したときは、`electronIcon` を `keep: false` で返す。パッケージアプリ（`shell:AppsFolder\…`）は null。
  - Windows 以外: `electronIcon`。null でなければ `keep: true`。
- **期限切れはその場で取り直す**。裏での取り直しも、mtime の確認もしない。取り直すのは月に 1 回、ランチャーを表示したとき（PowerShell 1 回）。タイマーは持たない。
  - `.lnk` の mtime 確認は外した。アプリを更新しても普通はショートカットが書き換わらないので、ほとんど何も検出できない。
  - 7 日ごとに裏で取り直す案も外した。C のストアはリロードまで古い data URL を持ち続けるので、取り直したアイコンが画面に出ない。
- **ディスクに残すのは、そのプラットフォーム本来の取り方で得たアイコンだけ**。次のものはメモリにだけ置き、elecdex を次に起動したときに取り直す（利用者の判断、2026-11-02）。
  - **アイコンなし**。インストールの途中で取りに行った場合などに、モノグラムのまま残り続けないようにする。
  - **Windows で、シェルが答えなかったときの `getFileIcon` の代わりのアイコン**。汎用のアイコンになりやすく（decisions.md）、ディスクに残すと 30 日間それが出続ける。
  - コスト: 該当するタイルが見えたときだけ、起動ごとに PowerShell が 1 回走る。アイコンは 1 件ずつ IPC で問い合わせるので（D を見送った理由の一つ）、キャッシュにあるほかのアイコンは待たない。
- **既存の問題の修正**: `IconBatcher` は、実行の失敗（タイムアウト、PowerShell がブロックされたとき）にも、バッチの全ファイルに null を返していた。今は失敗した実行のバッチを reject し、シェルが返す null（アイコンなし）と区別する。
- **掃除**（`prune(ids)`）: スキャンが成功するたびに（`onScanned`）、カタログ（ユーザーの項目 + システム）に無い id の `<id>.png` を消す。ほかのファイルには触れない。スキャンが失敗したときは `onScanned` が呼ばれないので、消さない。
- URL の項目は、ストアの手前で null を返す（ipc/launcher.ts）。ファイルは作らない。
- 書き込みに失敗してもアイコンは返す（ログに残すだけ）。全プラットフォームで同じ経路を使う。

## B. 一覧をディスクに残す（main）

- `launcher-catalog.json` を JsonStore で持つ: `{ version: 1, platform, entries }`（`src/main/launcher/catalog-file.ts`）。
  - zod の上限: 2000 件。id は 16 桁の hex。`source` は `'system'` のみ。`name` ≤ 512、`target` ≤ 1024、`args` ≤ 32 個 × 1024、`exec` ≤ 2048。
  - version が違うものや壊れたものは、JsonStore が `.bak` に退避して空の既定値になる。platform が違うもの、または空の一覧は `savedCatalog` が null を返し、初回スキャンを待つ。
- `SystemCache` のオプションに、次の 2 つを足した。
  - `initial?: () => T[] | null`: 最初の `get()` で 1 回だけ呼ぶ（起動時ではなく、ランチャーが一覧を求めたときにファイルを読む）。一覧があればすぐ返し、`#at` を `-Infinity` にして、必ず裏で再スキャンする。保存時刻は持たない（別のセッションの時計を信じない）。
  - `onScanned?: (entries, changed) => void`: スキャンが成功するたびに呼ぶ。`changed` は、直前の一覧（保存されていた一覧を含む）と `JSON.stringify` で比べて違うか。直前が無ければ true。保存はこれが true のときだけ。Linux の `exec` のように、パネルに見えない中身の違いもここで拾う。パネルへの `launcher:changed`（`onChange`）の条件は従来どおり（id・名前・グループ）。
  - 書き込みは JsonStore の同期書き込みのまま。約 50 KB を、変わったときだけ、多くても 1 分に 1 回。保存に失敗しても一覧は返す（ログに残すだけ）。
- **安全性**: 起動対象が userData のファイルから来るが、同じ場所の settings.json の `launcher.items` と信頼の境界は変わらない。起動時の検査もそのまま効く。アンインストールされたアプリは、再スキャンが終わるまで一瞬残る。起動すると OS のエラーが status に出る。

## C. アイコンをページ全体で共有する（renderer）

- `src/renderer/widgets/launcher/icons.svelte.ts`。モジュールに 1 つ、`SvelteMap<string, string | null>` と、問い合わせ中の id の Set を持つ。
  - `launcherIcon(id)`: 持っているアイコン（無ければ null）。
  - `requestLauncherIcon(id)`: 持っておらず問い合わせ中でもなければ、`launcher.icon` で聞く。IPC が失敗したら、次にまた聞ける。
  - `forgetLauncherIcons()`: テスト用。
- LauncherWidget はローカルの `icons` をやめてこれを読む（`{#each}` の中の `{@const icon = launcherIcon(entry.id)}`）。ポップアップを開き直したときや移動で再マウントしたときに、モノグラムが一瞬出なくなる。`{...icons}` のコピーも無くなる。
- 持つのは答えだけで、main 側の購読は無いので、`refCounted`・`whenPageGoes`・lifecycle の契約は対象外。リロードで空に戻る。
- IntersectionObserver に `rootMargin: '0px 0px 50% 0px'` を足し、下へペイン半分を先読みする。

## D. まとめて取る IPC → **見送り**

C でオブジェクトのコピーが無くなると、残るのは 1 ms に満たない invoke が約 64 回だけで、どれも main の 20 ms のバッチで既にまとめられている。逆に、次のマイナスがある。

- 1 回の呼び出しが、いちばん遅い id に合わせて返る。新しいアプリが 1 つ入っただけで、キャッシュにあるアイコンもすべて PowerShell 1 回分待つことになる（悪化）。
- preload の面が変わるので、コミット前に全スイートが必須になる。api.ts・ipc-table.ts・文書も変わる。

`launcher.icon` はそのまま残した。

## 同じコミットで直したもの: 暗いアクセントのテーマのアイコン

実装の確認中に利用者が見つけた、以前からの問題。Paper と Black ではアイコンがすべて黒い形になっていた。アイコンはグレースケールをアクセントの上に乗算で重ねるので、ほぼ黒のアクセント（明度 7 %・4 %）では陰影が消える。

- `iconLook(theme)`（shared/theme.ts）が `color`・`tinted`・`ink` を返し、appearance が `data-icons` に入れる。アクセントの明度が `INK_ACCENT_MAX_LIGHTNESS`（25）未満なら `ink`。
- `ink` では、グレースケールのアイコンをスクリーンで重ねる（LauncherWidget の CSS。ホバーの規則より前に置く）。
- 判定はアクセントで行うので、ユーザーテーマにも効く。Web ペインのテーマ色付け（`web.tint`、既定 off）も同じ乗算の方式だが、今回は触れていない。

## テスト

| 段 | 内容 |
|---|---|
| unit `launcher-icon-store.test.ts` | 一度取り出して書いたアイコンは、次の起動（新しいストア）で取り出さずに読む。同時の要求は 1 回の取り出しを共有し、その後はメモリから返す。アイコンなしと代わりのアイコン（`keep: false`）は書かず、次の起動で取り直す。取り出しの失敗では何も書かず、次の要求で取り直す。30 日を過ぎたものと PNG でないファイルは取り直す。entry id でない id ではファイルを作らない。掃除はリストに無い `.png` だけを消す。書き込みに失敗してもアイコンは返る |
| unit `windows-icons.test.ts` | 失敗した実行は reject し、次の要求で取り直す。シェルが返す null はそのまま null |
| unit `launcher-system-cache.test.ts` | 保存された一覧をスキャンを待たずに返し、必ず裏で再スキャンする（同時の要求は 1 回のスキャンを共有、ファイルは最初の要求で 1 回だけ読む）。同じ一覧なら `changed: false` で `onChange` なし。保存が無い最初のスキャンは `changed: true`。パネルに見えない違い（`exec`）は保存するが `onChange` は送らない |
| unit `launcher-catalog-file.test.ts` | 保存した一覧（`exec` の有無とも）を戻せる。platform の違いと空の一覧は null。version・id・`source`・件数・`args` の上限を超えたものはスキーマが拒む |
| unit `theme.test.ts` | `iconLook`: Paper・Black は `ink`、TRON・White・Amber は `tinted`、Business は `color`。暗いアクセントのユーザーテーマも `ink` |
| component `launcher-widget.test.ts` | 一度もらったアイコンは、再マウントしたとき main に聞き直さず、最初のタイルと一緒に出る（旧コードで失敗することを確認） |
| e2e `launcher.spec.ts` | `relaunch()` で同じ userData に 2 回起動する。1 回目にアイコンが出て `launcher-catalog.json` と `launcher-icons/` ができ、2 回目もアイコンが出て、1 回目のファイルの mtime が変わらない。時間は測らない（CI の速さに左右される e2e は入れないという利用者の判断）。Paper と Black で、アイコンがスクリーンで重なる |
| e2e `contracts/panes.ts` | 確かめた結果、変更なし。ランチャーは main 側の購読を持たず、残すのはファイルだけ |

コミット前に実行したもの: `npm run verify`（6737 件）、`npm run build`、`npm run test:e2e:smoke`（16 件）、launcher.spec と contracts（61 件）、暗いアクセントの修正の後に launcher.spec（13 件）。preload の面は変わらないので、全スイートは実行していない。

## 結果（実測）

本番ビルド、1920×1080 の `--windowed`、ランチャー 1 枚のレイアウト。Playwright の一回きりのスクリプトで、ページの開始から最初のタイル / 最初のアイコンが出るまで（`performance.now()`）を 3 回測った。リポジトリには入れていない。ポップアップの開き直しは測っていない（コンポーネントテストで、main に聞かないことだけ確かめた）。

| | 最初のタイル | 最初のアイコン |
|---|---|---|
| 変更前（毎回） | 2.6〜3.3 s | 4.9〜5.2 s |
| 変更後・初回 | 2.8 s | 5.4 s |
| 変更後・2 回目以降 | 0.52〜0.55 s | 0.53〜0.56 s |

初回のアイコンは約 0.2 秒遅い。先読みで最初のバッチのパスが増えたためと見ているが、確かめていない。

## 文書（同じコミットで）

- docs/decisions.md に 2 行（キャッシュの設計と実測値、D を見送った理由。暗いアクセントのアイコン）。
- architecture.md の userData の一覧に `launcher-catalog.json` と `launcher-icons/` を加えた。
- docs/guide/panes-system（3 言語）の Launcher の表に「保存するもの」の行を足し、先読みの説明を直した（*unreleased*）。
- docs/guide/themes-settings（3 言語）の `effects.iconTint` の行に、暗いアクセントの描き方を足した（*unreleased*）。

## 含めないもの

- PowerShell の常駐、出力を 1 行ずつ返す、`powershell.ts` への分離、起動処理の分離。
- Web ペインのテーマ色付けの、暗いアクセントへの対応。
