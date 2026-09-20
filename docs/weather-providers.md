# 天気ペインの複数データソース化（設計と決定）

状態: **実装済み**（2026-09-13）。対象: `src/shared/weather-report.ts`（共通モデル）・`src/shared/weather-sources.ts`（各ソースの変換）・`src/shared/weather-places.ts`（地点検索）・`src/main/weather/point-forecasts.ts`（MET・NWS の取得）・`src/main/ipc/weather.ts`・`WeatherWidget.svelte`・`LocationPicker.svelte`。

## 1. 目的

- 既定を MET Norway（ノルウェー気象研究所）の Locationforecast 2.0 にし、全世界の天気を表示する。既定の地点はニューヨーク。
- 日本の地点を選んだときは、これまでどおり気象庁の予報を使う。
- ペインはデータソースを意識しない。取得・解釈・更新間隔・出典はプロバイダーの中に閉じ、ペインは共通の形だけを描く。
- 米国は任意で米国国立気象局（NWS API）も使えるようにする。

## 2. 結論: 1 つのペイン + プロバイダー層で両立できる

3 つのデータは粒度が違うが、ペインが表示するもの（今の天気、日ごとの天気・最高/最低・降水）には共通の形で落とせる。違いは「ある項目・ない項目」なので、共通モデルの該当フィールドを省略可能にして、ペインは値があるものだけを描けばよい。**別ペインに分ける必要はない。**

| 項目 | 気象庁 | MET Norway | NWS |
|---|---|---|---|
| 範囲 | 日本（予報区・地域） | 全世界（緯度経度） | 米国のみ（緯度経度 → 格子） |
| 時間の粒度 | 3 日分の天気文と 6 時間ごとの降水確率、週間 7 日 | 1 時間ごと（約 2.5 日）→ 6 時間ごと（約 9 日）、時刻は UTC | 12 時間ごとの昼/夜（7 日）、1 時間ごと |
| 天気の分類 | 天気コード（100 番台…）と日本語の文 | `symbol_code`（`lightrainshowers_day` など約 80 種） | アイコン URL と短い英文（"Chance Showers"） |
| 最高 / 最低気温 | 日ごと（観測点） | 6 時間ごとの max/min から日ごとに集計 | 昼の最高・夜の最低 |
| 降水 | **確率**（6 時間ブロック） | **量**（mm）。確率は北欧域のみで、例えばニューヨークでは無し（2026-09-13 に実データで確認） | **確率**（期間ごと） |
| 現在の気温 | 無し | 有り（instant） | 有り（hourly の先頭） |
| 発表・更新 | 0/5/11/17 時（JST） | `Expires` ヘッダ（約 30 分）と `Last-Modified` | 約 1 時間ごと |
| 利用条件 | 出典「気象庁ホームページ（URL）を加工して作成」 | CC BY 4.0（出典・ライセンスへのリンク・加工の明示）。連絡先入り User-Agent 必須、座標は小数 4 桁まで、`Expires` 前の再取得禁止、`If-Modified-Since` 必須、"Yr" の名称・ロゴ使用不可 | パブリックドメイン相当のオープンデータ。User-Agent 必須、`/points` の結果はキャッシュ可 |

## 3. 共通モデル（`src/shared/weather-report.ts`）

```ts
type Sky = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'heavyRain'
         | 'showers' | 'thunder' | 'sleet' | 'snow' | 'heavySnow'

interface WeatherLocation {
  id: string                 // 'jma:130000:130010' | 'met:40.7128,-74.0060' | 'nws:40.7128,-74.0060'
  name: string               // 'New York' / '東京地方'
  country: string            // ISO 3166 alpha-2
  timeZone: string           // IANA。日ごとの集計と表示に使う
  lat: number | null
  lon: number | null
}

interface WeatherReport {
  location: WeatherLocation
  source: { id: 'jma' | 'met' | 'nws'; name: string; credit: string; url: string; licenseUrl?: string }
  issuedAt: string | null    // 発表時刻（ISO）。MET はモデル更新時刻
  now: { temp: number | null; sky: Sky | null; text: string | null; isDay: boolean } | null
  days: Array<{
    date: string             // 地点のタイムゾーンでの YYYY-MM-DD
    sky: Sky | null
    text: string | null      // 気象庁の天気文 / NWS の shortForecast。MET は null
    tempMin: number | null
    tempMax: number | null
    pop: number | null       // 降水確率 %（MET は通常 null）
    precipMm: number | null  // 降水量（気象庁は null）
    blocks: Array<{ start: string; pop: number | null; precipMm: number | null }> | null  // 6 時間ブロック
    wind: string | null
  }>
}

interface WeatherUpdate { locationId: string; report: WeatherReport | null; fetchedAt: number | null; error: string | null }
```

- 天気の分類はペイン側の `Sky`（現在の `SkyIcon` の描き分けと同じ粒度）に統一し、各プロバイダーが自分のコードから写像する。気象庁コード表（既存 `jma-weather-codes.ts`）、MET の `symbol_code`（接尾辞 `_day`/`_night`/`_polartwilight` を外した本体）、NWS のアイコン URL のキーワード（`rain`、`tsra`、`sct` など）を、それぞれ純関数の対応表にして単体テストする。
- ペインの降水行は「確率があれば %、無ければ mm」を表示する。

## 4. プロバイダー（main プロセス）

```ts
interface WeatherProvider {
  id: 'jma' | 'met' | 'nws'
  covers(location: WeatherLocation): boolean
  fetch(location, cached: CacheEntry | null): Promise<{ report; validators; nextCheckAt: number } | { notModified: true; nextCheckAt: number }>
}
```

- **JmaProvider**: 既存の取得・解釈（0/5/11/17 時の発表に合わせた確認、ETag）をそのまま包み、`ForecastSummary` から `WeatherReport` へ変換するだけにする。
- **MetProvider**: `locationforecast/2.0/complete`。座標は小数 4 桁に丸める。`If-Modified-Since` に前回の `Last-Modified` をそのまま送り、次回は `Expires` 以降（最短 30 分）に、全利用者が同時刻に集中しないよう数十秒のゆらぎを足す。1 時間/6 時間ごとの時系列を地点のタイムゾーンで日ごとに集計（最高/最低は `air_temperature_max/min`、天気は日中の `next_6_hours` のうち最も強い現象、降水量は合計）。
- **NwsProvider**: `/points/{lat},{lon}` の結果（`forecast`・`forecastHourly` の URL とタイムゾーン）を 1 日キャッシュし、予報は 1 時間ごと。昼/夜の期間を日ごとに組にする。米国外は 404 なので `covers` は国コード US のときだけ真。
- 共通の `WeatherService` がこれまでの購読の参照カウント・失敗時のバックオフ・ディスクキャッシュ（`weather-cache.json` を `locationId` キーに拡張）を持ち、プロバイダーごとに次の確認時刻だけを任せる。
- User-Agent は `elecdex/<version> github.com/kurouna/elecdex`（MET・NWS とも連絡先を含む形を要求）。
- テストは既存と同様に `ELECDEX_JMA_BASE_URL`・`ELECDEX_MET_BASE_URL`・`ELECDEX_NWS_BASE_URL` を閉じたポートかローカルスタブに向け、外部に接続しない。

## 5. 地点の選び方

- **都市の一覧を同梱**する: GeoNames の `cities15000` から人口 50 万以上の都市と各国の首都（約 1,200 件、名前・国・緯度経度・タイムゾーン、数十 KB）を生成スクリプトで作る。GeoNames は CC BY 4.0 なので出典を記載する。オンラインのジオコーディングは使わない（入力した地名を外部に送らないため）。
- 設定パネル: 「都市を検索」（英語名・国で絞り込み）と「緯度経度を直接入力」。日本の都市を選んだ場合は、気象庁の予報区（既存の府県予報区と一次細分区域の選択）に切り替わり、最寄りの予報区が初期選択される（予報区の代表地点の座標を同梱）。
- **データソースの自動選択**: 日本 → 気象庁、米国 → NWS（設定で MET に切り替え可）、それ以外 → MET。設定パネルに「source: auto / MET Norway」を置く。
- 既定: ニューヨーク（40.7128, -74.0060、America/New_York）。自動選択なら NWS になるので、**既定で MET を見せたい場合は「米国も MET」を既定にする**（要判断、§8）。
- 既存の layout.json の `{ office, area }` は `jma:<office>:<area>` の地点として読み替え、日本を選んでいた人の表示は変わらない。

## 6. ペインの表示

- 見出しの右: 地点名 · 発表/更新時刻。下端の出典はプロバイダーの `credit` をそのまま表示（MET は「Weather data: MET Norway, CC BY 4.0」とライセンスへのリンク、NWS は「Source: National Weather Service」、気象庁は現行の文言）。
- 今日: `now` があれば現在の気温と天気、無ければ（気象庁）今日の最高/最低と天気文。
- 週間: 日付・天気アイコン・最高/最低・降水（確率 % か量 mm）。表示日数は幅に合わせる（現行どおり）。
- 気温は摂氏。米国の地点では設定で華氏にできるようにする（NWS は華氏で返すので変換する）。
- 日付と曜日の表記は地点のタイムゾーンで、文言は英語に統一（気象庁の天気文だけは日本語のまま）。

## 7. 実装の段取り

1. 共通モデル・`Sky` への写像表（3 ソース）と単体テスト。
2. `WeatherService` をプロバイダー方式に変更し、気象庁をプロバイダー化（表示が変わらないことを既存の e2e で確認）。
3. MET プロバイダー（集計・キャッシュ・`Expires` 準拠）とスタブを使う e2e。
4. 都市一覧の生成スクリプトと設定パネル（検索・緯度経度・ソース選択）、既存レイアウトの移行。
5. NWS プロバイダー。
6. ドキュメント（README の Data sources、architecture.md §16）。

## 8. 決定と、設計からの変更

1. **米国の既定ソース**: NWS（設定で MET Norway にも切り替え可）。既定の地点ニューヨークは NWS で表示する。
2. **都市一覧**: 人口 50 万以上 + 各国の首都 = 1,323 件（82 kB）。選びやすさのため、ペイン追加と同じ形のポップアップ（LocationPicker）で検索する。
3. **気温の単位**: ペインごとに °C / °F を切り替え。未設定なら米国の地点は °F、それ以外は °C。
4. 共通モデルの `SkyGlyph` は既存の気象庁アイコンの形（主・副・「/」か「→」）をそのまま使い、SkyIcon は描画だけを担う。
5. 日本の都市は GeoNames の都道府県名から府県の予報区（北海道は石狩・空知・後志の 016000、鹿児島 460100、沖縄本島 471000）に対応付ける。気象庁の予報区一覧も検索に並べる。
6. 緯度経度を直接入力した地点のタイムゾーンは、システムのタイムゾーンとする（オフラインで緯度経度からタイムゾーンを求めるデータを同梱しないため）。
7. MET の日ごとの天気は、06〜18 時に始まる 6 時間予報のうち最も荒れた天気（雷 > 雪 > 雨 > 曇り > 霧 > 晴れ）。降水量は重ならない期間（1 時間、無ければ 6 時間）を合計する。
8. NWS の `/points` が返す予報 URL は、設定したサーバーと同じオリジンのときだけ辿る。
