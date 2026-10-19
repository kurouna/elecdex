# アクションパレット 設計

キー 1 つで開き、文字で絞り込んで、ショートカットのアクション・保存レイアウト・プリセット・テーマ・ペイン・
設定のセクションを呼び出すダイアログ（issue 23 の後半）。見た目はモック docs/palette-mock で合意を取る。
このモックの数値と項目は作り物で、注記の一部はこの設計で改めた（§9）。実装済み（2026-10-19）。実装で設計から変えた点は §11。要約は architecture.md §5.24。

方針は利用者の指定（2026-10-19）による。

- 既存コードへの影響は最小限にする。パレットは新しいファイルに置き、既存のファイルには口を 1 つずつ足すだけにする（§4）。
- テストを先に書く。各段階で、先に書いたテストが落ちることを確かめてから実装する（§7）。
- 新たな不具合や退行がないことを確かめる。触れる範囲が広いので、最後に e2e を全部走らせる（§7.6）。
- 見た目と動きは既存の UI/UX にそろえる。ペイン追加のピッカーと同じ形・同じ演出にし、新しいアニメーションは作らない（§3）。

## 0. 決定の記録

| 日付 | 決定 | 経緯 |
|------|------|------|
| 2026-10-19 | パレットを作る。種類は ACTION・LAYOUT・PRESET・THEME・PANE・SETTINGS | issue 23、モックで確認 |
| 2026-10-19 | 疎結合にする。パレットは Workspace を import せず、アクションは Workspace の既存の `run` を通す | 利用者の指定 |
| 2026-10-19 | レビュー（Fable 5.1、コードで確かめた）を反映: フォーカスは実行の前に同期で戻す、リセットの構えは確認が出ないときに、新しいモジュールは形を置いてからテストを書く、テストを足す（開いている間のキー、使える側、beforeEach）、モックをピッカーと同じ大きさと位置にする | 利用者の指示 |
| 2026-10-19 | Q1〜Q6 は下の表の推奨どおり: Ctrl+Shift+P、試し当てなし、RECENT はページのメモリだけ、SETTINGS はセクション単位、PANE はポップアップ優先、ポップアップの上でも開く | 利用者の選択（1 問ずつ確認） |

問いと答え（すべて推奨どおりに決まった）:

| # | 問い | 答え | 理由 |
|---|------|------|------|
| Q1 | 開くキー | Ctrl+Shift+P | 空いている。VS Code・Windows Terminal と同じ。macOS のアプリメニューの登録（Cmd+Z・X・C・V・A と Shift+Cmd+Z）とも重ならない（app-menu.test が確かめる） |
| Q2 | テーマの試し当て（行に止まると当て、Esc で戻す） | 今回は入れない | 当てるには appearance ストアに「設定に書かない適用」の口が要り、テーマの適用（theme-apply.ts）に手が入る。v1 は Enter で `appearance.patch` するだけにする |
| Q3 | RECENT を残す場所 | ページのメモリだけ（再読み込みで消える） | main・設定ファイル・スキーマに手を入れずに済む。残したくなったら後で main のファイルにする |
| Q4 | SETTINGS の粒度 | セクション単位 | 個々の設定は SettingsDialog の中身を知ることになり、結合が強くなる |
| Q5 | PANE の行の置き場所 | ポップアップできるものはポップアップ、それ以外は右に追加、単一のものが既にあればフォーカス | 呼び出しのショートカット（summon）と同じく、配置を崩さない |
| Q6 | ポップアップが出ているときにキーで開くか | 開く（ポップアップは片付く） | 呼び出しのショートカットがポップアップの上でも効くのと同じ扱い。Workspace の `throughDialog` に 1 条件足す |

## 1. 範囲

入れるもの:

- ダイアログ 1 つ（`ActionPalette.svelte`）。開閉、絞り込み、種類の切り替え、↑↓、Enter、Esc。
- 6 種類の項目と、各行の今の割り当てのキー（`actionChord`、利用者の上書きとキーボードの刻印つき）。
- 今使えない行は、ピッカーの使えない行と同じく薄く残し、理由を出す。Enter しても何もしない。
- 取り消せないものは Enter 2 回（§5.4）。
- `palette.open`（Ctrl+Shift+P）を keybindings.ts に足す。

入れないもの:

- テーマの試し当て（Q2）。
- プラグインが項目を足す API。プラグインのペインは PANE に出る（ピッカーと同じ条件）。
- ステータスバーのボタン。キーで開くもの。
- 履歴の保存（Q3）。
- 個々の設定の切り替え（Q4）。

## 2. 見た目と操作

ペイン追加のピッカー（PanePicker.svelte）と同じ骨組みにする。

```
┌ ACTIONS ───────────────────── ↑↓ CHOOSE · TAB KIND · ENTER RUN · ESC CLOSE ┐
│ [ type to find an action, layout, theme, pane or setting                ]  │
│ (ALL 63) (ACTION 24) (LAYOUT n) (PRESET 9) (THEME n) (PANE n) (SETTINGS n)  │
│ RECENT                                                                      │
│ ▌ACTION  BRING THE PANE FORWARD  the focused pane over...   Ctrl+Shift+Z    │
│  ACTION  NEXT TAB                                NOT IN A TAB GROUP  ...    │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Bring the pane forward: the focused pane over the others            3 / 63 │
└─────────────────────────────────────────────────────────────────────────────┘
```

- 見出しは `hud-label`、本体は `shell-frame`。大きさはピッカーと同じ `width: min(46rem, 90vw)`、`max-height: min(34rem, 80vh)` で、画面の中央に置く（背景は `place-items: center`）。幅に応じて列を隠す規則は作らない（ピッカーにもない）。
- 行は 4 列（種類・名前・説明・状態とキー）。選んだ行は左の線と `--accent-faint`、使えない行は `--text-muted`（ピッカーの `.unavailable`）。
- 名前のうち一致した文字に下線を引く（色は `--accent-strong`）。色だけに頼らない。
- 空の入力では RECENT（最大 5）のあと種類ごとの見出し。入力があれば種類をまたいで順位付けし、見出しは出さない。
- フッターは選んだ行が何をするかの 1 行と、件数。
- Tab / Shift+Tab で種類を回す（ピッカーの置き場所と同じ使い方）。PageUp / PageDown で 8 行ずつ動く。
- マウス: 行の上で動かせば選び、クリックで実行。背景の pointerdown で閉じる（ピッカーと同じ）。種類のボタンを押しても、フォーカスは入力欄に置いたまま（押したらフォーカスを入力欄に戻す）。
- パレットが取るキー（↑↓、PageUp/PageDown、Tab、Enter、Esc）は `preventDefault` と `stopPropagation` で止める（ピッカーの `take()`）。文字は入力欄が受けるので、下のシェルには届かない。ショートカットは、開いている間は Workspace の `run` が `dialogOpen` で断る（`THROUGH_DIALOGS` の Quit と全画面を除く）。
- IME の変換中の Enter と ↑↓ は取らない（`event.isComposing || event.keyCode === 229`。AiChatWidget と同じ判定）。

## 3. 演出と見た目の統一（既存のものだけを使う）

| 何 | 使うもの | 既存の手本 |
|----|----------|-----------|
| 開く | `class="crt-on"`、`--crt-duration: 380ms`、`style:--crt-delay={dialogDelay()}` | PanePicker |
| 閉じる | `transition:crtPower`（ビームつきの消灯） | PanePicker |
| 背景 | `transition:backdropShade` | PanePicker |
| 別のダイアログへの受け渡し | パレットを閉じてからアクションがダイアログを開くと、`ui.closedAt` により `dialogDelay` が消える線から開く | ピッカーから設定への切り替え |
| モーション低減 | 上の仕組みが自動で省く（`appearance.reducedMotion`、`--motion-scale`） | 全ダイアログ |
| 音 | ↑↓ で `sfx.play('folder')`、テーマを当てたら `'theme'` | PanePicker、App.svelte の `chooseTheme` |
| Web ペイン | `ui.dialogOpen` に数えるので WebWidget が自分のビューを片付ける（`coverWeb` は要らない） | 全ダイアログ |
| 文字の大きさ | 名前 `--step-0`、説明とフッター `--step--1`、種類・状態・キー `--step--2` | §7 の決まり |
| 色 | 意味のトークンだけ（`--accent`、`--text-muted`、`--danger` など）。明るいテーマは `data-mode="light"` で自動 | tokens.css |

新しい keyframes、`will-change`、`forwards` の fill、独自の rAF は作らない。CSS はピッカーの規則を写して
コンポーネント内に置く。PanePicker 自体には手を入れない（共通化は別の変更にする、§10）。

## 4. 構成

### 4.1 新しく足すファイル

| ファイル | 中身 | 依存 |
|----------|------|------|
| `src/shared/palette.ts` | 純粋。`PaletteKind`、`PaletteItem`、`rankItems`、`UNAVAILABLE_REASON`、`armsFirst` | keybindings.ts、shortcut-applies.ts の型だけ |
| `src/renderer/palette/sources.ts` | 純粋。種類ごとに 1 関数で、ストアではなく普通の値を受けて `PaletteItem[]` を返す | shared、widgets/registry の型、layout/popup.ts の `pickerChoice` |
| `src/renderer/palette/run.ts` | 選んだ項目を実行する。種類ごとに既存の公開メソッドを呼ぶ（§5.3） | ui、layout、appearance、commands |
| `src/renderer/palette/ActionPalette.svelte` | 描くことと、キーとマウスの操作 | 上の 3 つ、crt-transitions、chord の書式 |
| `src/renderer/lib/commands.ts` | Workspace の `run` と `applies` を外へ渡す口。パレットが Workspace を import しないため | keybindings の型だけ |
| `src/renderer/settings-sections.ts` | SettingsDialog の `SECTIONS` を外へ出したもの（純粋な関数） | shared/background.ts |

```ts
// shared/palette.ts
export type PaletteKind = 'action' | 'layout' | 'preset' | 'theme' | 'pane' | 'settings'
export const PALETTE_KINDS: readonly PaletteKind[]
export type PaletteState =
  | { kind: 'ready' }
  | { kind: 'current' } // 使用中のテーマ・レイアウト。Enter しても何もしない
  | { kind: 'off'; reason: string } // 今使えない。理由を出す
export interface PaletteItem {
  key: string // 'action:pane.zoom'、'layout:<id>'、'theme:<id>' … 一意
  kind: PaletteKind
  label: string
  detail: string // 説明の列とフッター
  words: readonly string[] // 名前の外で探す言葉（id、別名）
  chord: string | null // 書式済み。割り当てがなければ null
  note: string | null // 行の右端の言葉（ペイン: pop up・add・on screen · focus）
  state: PaletteState
  arm: boolean // Enter 2 回
}
export function rankItems(
  items: readonly PaletteItem[], query: string, kind: PaletteKind | 'all', recent: readonly string[],
): Array<{ item: PaletteItem; spans: number[]; heading?: PaletteKind | 'recent' }>
```

`commands` は次の形にする。Workspace が渡すまで（テストや起動の途中）は何もしない。

```ts
export interface CommandRunner {
  run(action: KeybindingAction): boolean
  applies(action: KeybindingAction): boolean
}
export const commands: CommandRunner & { provide(runner: CommandRunner): () => void }
```

### 4.2 既存ファイルへの変更（すべて足すだけ）

| ファイル | 変更 | 行数の目安 |
|----------|------|-----------|
| `src/shared/keybindings.ts` | `{ id: 'palette.open', label: 'Find an action', chord: 'Ctrl+Shift+KeyP' }` を 1 行 | 1 |
| `src/renderer/stores/ui.svelte.ts` | `'palette'` を `Overlay` と `CLOSABLE` に、`paletteOpen` と `openPalette` / `closePalette`、`showing` / `hide` / `dialogOpen` に 1 行ずつ | 約 15 |
| `src/renderer/layout/Workspace.svelte` | `ACTIONS` に `'palette.open': () => ui.openPalette()`。`commands.provide({ run: (a) => run(a, false), applies: (a) => shortcutApplies(a, shortcutFacts(layout.focusedPaneId, false)) })` を `$effect` で 1 回（`applies` は `run` を使わない: `run` は開いている間 `dialogOpen` で false になる）。`throughDialog` に `ui.popupOnTop && action === 'palette.open'`（Q6） | 約 12 |
| `src/renderer/App.svelte` | `<ActionPalette />` を `<PanePicker />` の隣に | 2 |
| `src/renderer/SettingsDialog.svelte` | `SECTIONS` を `settingsSections(capabilities)` に置き換える（中身は同じ） | 約 10 |

`shortcutApplies` は変えない。`palette.open` は switch のどれにも当たらないので常に当てはまり、
Web ページに残すキー（`shortcutsLeftToPage`）にも入らない。そのため、Web ペインにフォーカスがあっても
main がキーを取ってページへ送り、Workspace が開く（`web.onShortcut` の既存の経路）。`LeftToPageSchema` の enum は
`KEYBINDING_ACTIONS` から作るので、自動でついてくる。main・preload・設定のスキーマには手を入れない。

## 5. 振る舞い

### 5.1 項目の出どころ（sources.ts）

| 種類 | 出どころ | 除くもの・注意 |
|------|----------|----------------|
| ACTION | `KEYBINDING_ACTIONS`、`effectiveBindings` で書式、`commands.applies` | `scope: 'global'`、`palette.open` 自身、`layout.savedN`（LAYOUT の行になる）、`layout.preset.*`（PRESET の行になる）、この機械にないもの（`availableOn`）。`pane.zoom` は前に出ているペインがあれば戻す（`layout.zoomedPaneId ?? focusedPaneId`）ので、説明は「前に出す、または戻す」 |
| LAYOUT | `layout.savedLayouts`。最初の 10 件は `layout.savedN` のキー | 使用中（`entry.active`）は `current` |
| PRESET | `LAYOUT_PRESETS` と `layoutFromPreset`。キーは `layout.preset.<id>` | 説明は「〜へ移る」か「レイアウトを足す」 |
| THEME | `appearance.catalog.themes`（組み込みと利用者のテーマ） | 使用中は `appearance.theme.id`（実際に当たっているもの）で決める。`settings.theme` はもう無いテーマを指していることがある |
| PANE | `listWidgets()`。ピッカーと同じ絞り込み（`plugins.usable`、`unlisted`） | 置き場所はウィジェットごとに `w.popup ? 'popup' : 'right'` を選び、`pickerChoice(w, placement, existing)` に渡す（Q5）。`pickerChoice` は `popup` の置き場所をポップアップできないウィジェットに `none` で返すので、一律に `popup` を渡さない |
| SETTINGS | `settingsSections(capabilities)` | 開けるのはセクションだけ（Q4） |

ソースはパレットが開いている間だけ（`{#if ui.paletteOpen}` の中の `$derived`）計算する。閉じていれば何もしない。

### 5.2 使えない行と理由

ACTION の行の可否は `commands.applies(id)` で決める。中身は Workspace が `shortcutFacts` を使う
`shortcutApplies` で、キーを押したときと同じ判定になる。理由の文は `UNAVAILABLE_REASON` に、条件つきの
アクションごとに 1 つ置く（例: `tab.next` は `not in a tab group`、`shell.clear` は `only from a shell`）。
すべての事実を false にした `ShortcutFacts` で false になるアクションには、必ず理由がある。これはユニット
テストが確かめる。今後 shortcutApplies に条件を足すと、理由を書くまでテストが落ちる。

判定は、パレットを開く前にフォーカスがあったペインで行う。パレットはペインのフォーカス（`layout.focusedPaneId`）を変えない。

### 5.3 実行の順序（run.ts）

```
Enter
 ├ state が off / current → 何もしない（音もなし）
 ├ arm で、まだ構えていない → 構える（行が --danger、状態列に ENTER AGAIN）。↑↓・入力・Esc で解く
 └ それ以外
    1. recent の先頭に入れる（最大 5、ページのメモリ）
    2. ui.closePalette()        ← dialogOpen が下り、closedAt が付く
    3. 開く前のフォーカスをその場で（同期で）戻し、returnFocus を null にする
    4. 種類ごとに実行
         action   → commands.run(id)            Workspace の run(id, false): dialogOpen と shortcutApplies を通る
         preset   → commands.run('layout.preset.<id>')  キーと同じ経路
         layout   → layout.switchTo(id)          スロットのキーと同じメソッド。シェルがあり、
                                                 layout.confirmSwitch がオンなら今の確認が出る（mayReplace）
         theme    → appearance.patch({ theme }) のあと sfx 'theme'（App.svelte の chooseTheme と同じ）
         pane     → pickerChoice の答え: focus / layout.addPane(w, 'right') / ui.openPopup(w)
         settings → ui.openSettings(section)
```

2 を 4 より先にするのは、`run` が `ui.dialogOpen` のあいだ何もしない（`THROUGH_DIALOGS` 以外）ためと、
次のダイアログが `dialogDelay` で消える線から開くためである。`run` に渡す `editing` は false にする。
パレットから選んだ時点で文字欄のキーと取り合うことはないので、タブのキーを文字欄に残す理由がない。

3 を 4 より先に、同期で行うのは、アクションが動かしたフォーカスを後から奪わないためである。ピッカーは
フォーカスを `$effect` の後始末で戻すので、その後始末は次の flush、つまりアクションの後に走る。そのため
ピッカーは、選んだものがフォーカスを動かすときに `returnFocus = null` にしている（PanePicker.svelte の
`choose`）。パレットはフォーカスを動かすアクションが多い（`shell.focus`、`shell.find`、`focus.next`、
`shell.next`、呼び出し、PANE のフォーカス、`pane.add`）。どれがそうかを数えるのではなく、先に戻して
後始末を空にする。Esc や背景で閉じたときだけ、後始末が戻す。

### 5.4 Enter 2 回（`armsFirst`）

| アクション | 構えるか | 理由 |
|------------|----------|------|
| `app.quit` | 常に | 絞り込んで Enter すると、先頭の行が意図せず走りうる。終わらせると戻せない |
| `shell.clear` | 常に | スクロールバックは戻せない |
| `layout.reset` | `confirmReset` が聞かないとき（シェルが 1 つもない、または `layout.confirmSwitch` がオフ） | 聞くときはダイアログに任せ、2 回聞かない。聞かないときは、1 回の Enter でシェルをすべて終わらせないように構える。ステータスバーとピッカーのリセットボタンは、ダイアログを出さずに 2 回目のクリックで確かめる（`ConfirmButton`）ので、「どちらか 1 回は必ず確かめる」点で揃う |

`armsFirst(action, { anyShell, confirmSwitch })` は純粋な関数にし、表をそのままテストする。
`confirmSwitch` は `appearance.settings.layout.confirmSwitch` から渡す。LAYOUT と PRESET の行は構えない。
キー（Ctrl+Shift+1 など）と同じく、`confirmSwitch` がオフなら確認なしで切り替わる。利用者がそう選んだ設定なので、パレットだけ変えることはしない。

### 5.5 ほかのダイアログとの関係

- パレットはダイアログの 1 つ。開けば他のダイアログ・ポップアップは片付き（`clearFor`）、待っているレイアウト切り替えの問いは「いいえ」で答えられる。開いている間は、他のショートカットは `THROUGH_DIALOGS`（Quit・全画面）を除いて効かない。
- 設定でショートカットを記録している間（`recordingShortcut`）は、既存のとおりキーが届かない。
- パレットが開いている間に Ctrl+Shift+P を押しても何もしない（ピッカーと同じ。閉じるのは Esc）。

## 6. 影響の見積もりと退行の守り

| 触れるもの | 起こりうる退行 | 守り |
|------------|----------------|------|
| `ui.dialogOpen` に 1 つ増える | 他のダイアログの開閉・`closedAt`・ポップアップの扱いが変わる | dialog-motion.test を先に足す（パレットも 1 つのダイアログとして同じ表を満たす）。既存の表はそのまま緑 |
| `KEYBINDING_ACTIONS` に 1 行 | 既存のキーと衝突する。設定のキーボード一覧が崩れる。macOS のメニューと重なる。Web ページに残すキーが変わる | keybindings.test、app-menu.test、shortcut-applies.test、settings.spec（キーの一覧と記録） |
| Workspace の `throughDialog` | ポップアップの上で余計なキーが効く | Workspace の判定を、パレットのキーと呼び出しのキーに限るテスト（e2e、ポップアップの上で Ctrl+Shift+A は効かないまま） |
| SettingsDialog の `SECTIONS` の抽出 | セクションの並びや window の出し分けが変わる | settings-sections のユニットテストを先に書き、抽出前の並びを固定する。settings.spec |
| App.svelte への追加 | アイドル時の負荷 | 閉じていれば `{#if}` で何も描かない。metrics.spec のアイドル予算 |
| 背面タブ・最小化 | 何も購読しないので影響なし | hidden-panes.spec（念のため全体の実行に含む） |

## 7. テスト計画（先に書く）

各段階で次の順に進める。

1. 新しいモジュールは、まず中身のない形だけを置く（型と、空の配列・false・何もしない関数を返す export）。こうすれば、テストの最初の失敗が「モジュールがない」ではなく期待との食い違いになる。
2. テストを書く。
3. 走らせて、落ちることとその理由（期待との食い違い）を確かめ、記録する。
4. 実装する。
5. 緑にする。
6. その段階の既存テストも走らせる。

既存のファイルに足すテスト（keybindings、shortcut-applies、dialog-motion）は、形を置かなくても食い違いで落ちる。

### 7.1 段階 1: 純粋なロジック（tests/unit）

- `palette-rank.test.ts`
  - 空の入力では RECENT が先、次に `PALETTE_KINDS` の順の見出し、項目はソースの順。
  - 種類を指定すれば、その種類だけを出し、RECENT は出さない。
  - 語ごとに名前の部分列で一致する。単語の頭と連続した一致が上に来る。
  - `words` は書いたとおりの部分文字列でだけ一致する（モックで、ゆるい一致は何でも拾った）。
  - 使えない行は下がるが、消えない。同点ならソースの順（安定）。
  - `spans` は名前の中の位置。大文字と小文字は区別しない。
  - 空白だけの入力は空と同じ。1 文字ずつの入力で落ちない。
- `palette-sources.test.ts`
  - ACTION に global・`palette.open`・スロット・プリセットのアクションが入らない。macOS では `window.minimize` が入らない。
  - キーは利用者の上書きで出る。割り当てを外したら `chord: null`。刻印の書式（`formatChord` と labels）。
  - `UNAVAILABLE_REASON` が網羅されている（§5.2）。
  - `armsFirst` の表（§5.4）。`layout.reset` は、シェルなし / シェルあり・確認オン / シェルあり・確認オフの 3 通り。
  - LAYOUT: 11 件目以降はキーなし、使用中は `current`。PRESET: 作ったレイアウトがあれば「移る」。
  - THEME: 使用中は `current`、利用者のテーマも並ぶ。PANE: `pickerChoice` と同じ答え、プラグインは同意済みだけ。
  - key がすべて一意。
- `settings-sections.test.ts`: 今の SettingsDialog と同じ並び。window は `backgroundOffered` のときだけ出る。期待する並びは、抽出前の SettingsDialog.svelte の `SECTIONS` から写す。
- `keybindings.test.ts` に追加: `palette.open` は Ctrl+Shift+P で、他と重ならない。
- `shortcut-applies.test.ts` に追加: `palette.open` はどの事実でも当てはまり、Web ページには残らない。
- `app-menu.test.ts`: 既存のテストが新しいキーも確かめることを確認する（足すものがなければ足さない）。
- `commands.test.ts`: 渡される前は run と applies が false。渡せば呼ばれる。返された解除で元に戻る。2 度目の provide は前のものを置き換える。

### 7.2 段階 2: ストア（tests/component/dialog-motion.test.ts に追加）

- パレットはダイアログである。開けば `dialogOpen`、他のダイアログとポップアップを片付けて `closedAt` を付ける。他のダイアログを開けばパレットが片付く。
- 待っているレイアウト切り替えの問いを「いいえ」で答える。
- 開いていない状態で閉じても `closedAt` は付かない。
- `beforeEach` で閉じるダイアログの一覧に `ui.closePalette()` を足す。足さないと、1 つのテストで開いたままのパレットが次のテストに漏れる。

### 7.3 段階 3: コンポーネント（tests/component/action-palette.test.ts、jsdom）

`window.elecdex` と `commands` を差し替え、モックの引数は `structuredClone` する（CLAUDE.md の作法）。

- 開くと入力欄にフォーカスがある。Esc や背景で閉じると、元の要素に戻る。
- フォーカスを動かすものを実行すると（`commands.run` の差し替えが別の要素にフォーカスを置く。PANE のフォーカスの行も）、flush の後も、開く前の要素にフォーカスが戻らない（§5.3 の 3）。
- 種類のボタンをクリックしても、フォーカスは入力欄のまま。
- パレットが取るキーは `stopPropagation` され、パレットの外の keydown の受け手には届かない。
- 入力で絞り込み、件数とフッターが変わる。一致した文字が `mark` になる。
- ↑↓ は端で回る。PageUp / PageDown。Tab / Shift+Tab で種類を回し、選択は先頭に戻る。
- Enter で、パレットが閉じたあとに（`commands.run` が呼ばれた時点で `ui.dialogOpen` が false）、その id で 1 回だけ実行される。
- 使えない行、使用中の行で Enter しても何も呼ばれない。
- 構える行: 1 回目は呼ばれず ENTER AGAIN と出る。2 回目で呼ばれる。間に ↑↓ や入力があれば解ける。Esc は先に構えを解き、2 回目で閉じる。
- IME の変換中の Enter と ↑↓ は何もしない。
- 背景のクリックで閉じる。中のクリックでは閉じない。
- 種類ごとの実行先（§5.3 の表）がそれぞれ 1 回呼ばれる。テーマのあとに `theme` の音が鳴る。
- 何も一致しなければ「nothing matches」と出て、Enter しても何もしない。

### 7.4 段階 4: つなぎと e2e（tests/e2e）

`palette.spec.ts`（新規）:

- Ctrl+Shift+P で開き、`split right` を選んで Enter すると、Ctrl+Shift+E を押したときと同じ木になる（同じ初期の木から 2 回作って比べる。ペインの id は作るたびに変わるので、木の形とウィジェットだけを比べる）。
- タブグループの外では NEXT TAB が理由つきで薄く、Enter しても木が変わらない。シェルがタブグループの中でフォーカスを持っているときに開けば、NEXT TAB は使え、Enter でタブが移る。
- 開いている間に Ctrl+Shift+E や Ctrl+Shift+W を押しても木は変わらない。入力欄に打った文字は、下のシェルに届かない（シェルの出力に現れない）。
- シェルがあり、`layout.confirmSwitch` がオフのとき、Reset layout は Enter 2 回で初めてリセットする。
- テーマを選ぶと `settings.json` の theme が変わる。Esc では何も変わらない。
- `Settings: keyboard` で設定がそのセクションで開き、消える線から開く（`--crt-delay` が付く）。
- シェルを開いた状態で（`layout.confirmSwitch` は既定のオン）保存レイアウトを選ぶと、今の確認が出る。
- Web ペインにフォーカスがあるとき（スタブのページ）にキーで開き、ビューが片付く。Esc で閉じればビューは再び見える（web.spec.ts の `expectShownOverBody`）。キーボードはワークスペースに残る。ピッカーと同じで、ページにはフォーカスが戻らない（web.spec.ts のピッカーの場合と同じ確かめ方をする）。
- ポップアップの上でキーを押すとパレットが開き、ポップアップは片付く。同じ状態で Ctrl+Shift+A は効かないまま。
- 利用者がキーを付け替えると（settings の keybindings）、新しいキーで開き、行の右端にも新しいキーが出る。

`motion.spec.ts`: 「a dialog powers off as it closes」の表に `action-palette` を足す。開閉の演出とモーション低減は、既存の表がそのまま確かめる。

### 7.5 段階 5: ドキュメント

- architecture.md に §5.24「アクションパレット」（要約と、このファイルへのリンク）。
- decisions.md に 1 行（決定と Q1〜Q6 の答え）。
- README の 3 か国語版のショートカット表に 1 行（同じコミット）。
- CLAUDE.md の「Panes and layout」に短い決まりを 1 つ（パレットは Workspace を import せず、アクションは `commands` から既存の `run` を通す。項目は sources.ts の 1 関数で足す）。

### 7.6 退行の確認（最後に）

- `npm run verify`（biome、型、vitest 全部）と `npm run build`。
- `npx playwright test` を全部走らせる。ダイアログの集合（`dialogOpen`）とキーの一覧は、アプリ全体に効く変更なので、CLAUDE.md の「アプリ全体にかかる変更」として扱う。
- 着手前に main の状態で同じものを一度走らせ、元から落ちるテストがあれば記録しておく。そうすれば、この変更のせいかどうかを分けられる。
- 落ちたテストは「この機械のせいか」（エレックデックスが別に動いていないか、tests/e2e/reporter.ts のログ）を先に確かめる。

## 8. コミットの切り方

段階ごとに 1 コミット（テストと実装を一緒にする。テストだけのコミットは CI を赤にするので作らない）。
落ちることを確かめた記録は、コミットの本文に書く（どのテストが、どういう食い違いで落ちたか）。

1. `feat(palette): pure ranking and sources / 順位付けと項目の純粋なロジック`（段階 1）
2. `feat(palette): the palette as a dialog in the ui store / ui ストアにダイアログとして足す`（段階 2）
3. `feat(palette): the palette dialog / パレットのダイアログ`（段階 3、まだどこにもつないでいない）
4. `feat(palette): open it with Ctrl+Shift+P / Ctrl+Shift+P で開く`（段階 4 と 5。ここで初めて利用者に見える）

## 9. モックからの変更

- `coverWeb` は使わない。ダイアログは `ui.dialogOpen` に数えれば WebWidget が自分のビューを片付ける（モックの注記の誤り）。
- テーマの試し当ては v1 に入れない（Q2）。
- `layout.reset` の構えは、`confirmReset` が聞かないとき（シェルなし、または確認オフ）にする（§5.4）。
- `shell.clear` も構える（モックでは構えていなかった）。
- 開いている間の Ctrl+Shift+P は何もしない（モックでは閉じていた）。
- 大きさと位置はピッカーと同じ（モックは `min(31rem, 86%)` で上寄せ、狭い幅で列を隠していた）。
- 一致の判定: `words` は部分文字列だけにする（モックで直したとおり）。

## 10. 見つかった既存の問題（この変更では直さない）

- PanePicker のキー処理は `isComposing` を見ていない。変換を確定する Enter でペインが足される恐れがある（未確認。Windows の Chromium では変換中の keydown が `key: 'Process'` になり起きない可能性があり、macOS は分からない）。パレットでは最初から避ける（§2）。ピッカーは、手で確かめたうえで、テストつきの別の変更にする。
- ピッカーとパレットの CSS は写しになる。揃えておくための共通化（例: `styles/finder.css`）は、両方ができてから別の変更にする。

## 11. 実装で変えたこと

- `PaletteItem` に `note` を足した。ペインの行の右端に、Enter で何が起きるか（`pickerRowState` の言葉）を出すため。
- 名前の外の一致は、`words` だけでなく種類の名前と `detail` も、書いたとおりの部分文字列で探す（テーマの説明の「light」などで見つかるように）。名前は文字の順。単語の頭で始まる連続した一致がいちばん上。
- shared/palette.ts に純粋な関数を足した: `remember`（RECENT）、`nextKind`（Tab）、`nameParts`（下線の区切り）、`armVerb`（ENTER AGAIN の言葉）、`ACTION_DETAIL`（アクションの説明）。どれもユニットテストがある。
- run.ts は、種類ごとの行き先（`PaletteTargets`）と、それを stores につないだ `storeTargets` に分けた。コンポーネントのテストは `storeTargets` だけを差し替える。
- 一致がないときの文は `nothing matches “…”`、種類を絞っているときは ` in <kind> · tab for every kind` を添える。
- biome の対象から docs/agents-mock と docs/palette-mock を外した（ほかのモックと同じ。HTML のモックが lint を赤にしていた）。
