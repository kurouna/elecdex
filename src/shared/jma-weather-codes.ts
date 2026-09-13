/**
 * JMA forecast weather codes ("天気コード") and what they mean.
 *
 * The forecast JSON carries a text description only for the first three days;
 * the weekly forecast carries codes alone. JMA publishes no machine-readable
 * table of the codes, so this one is kept here, following the telops used on
 * the JMA forecast pages. A code missing from it (JMA adds one occasionally)
 * still renders from its first digit - 1 clear, 2 cloudy, 3 rain, 4 snow.
 *
 * Source of the codes and wording: 気象庁ホームページ (https://www.jma.go.jp/bosai/forecast/).
 */

export const WEATHER_CODES: Readonly<Record<string, string>> = {
  '100': '晴',
  '101': '晴時々曇',
  '102': '晴一時雨',
  '103': '晴時々雨',
  '104': '晴一時雪',
  '105': '晴時々雪',
  '106': '晴一時雨か雪',
  '107': '晴時々雨か雪',
  '108': '晴一時雨か雷雨',
  '110': '晴後時々曇',
  '111': '晴後曇',
  '112': '晴後一時雨',
  '113': '晴後時々雨',
  '114': '晴後雨',
  '115': '晴後一時雪',
  '116': '晴後時々雪',
  '117': '晴後雪',
  '118': '晴後雨か雪',
  '119': '晴後雨か雷雨',
  '120': '晴朝夕一時雨',
  '121': '晴朝の内一時雨',
  '122': '晴夕方一時雨',
  '123': '晴山沿い雷雨',
  '124': '晴山沿い雪',
  '125': '晴午後は雷雨',
  '126': '晴昼頃から雨',
  '127': '晴夕方から雨',
  '128': '晴夜は雨',
  '130': '朝の内霧後晴',
  '131': '晴明け方霧',
  '132': '晴朝夕曇',
  '140': '晴時々雨で雷を伴う',
  '160': '晴一時雪か雨',
  '170': '晴時々雪か雨',
  '181': '晴後雪か雨',
  '200': '曇',
  '201': '曇時々晴',
  '202': '曇一時雨',
  '203': '曇時々雨',
  '204': '曇一時雪',
  '205': '曇時々雪',
  '206': '曇一時雨か雪',
  '207': '曇時々雨か雪',
  '208': '曇一時雨か雷雨',
  '209': '霧',
  '210': '曇後時々晴',
  '211': '曇後晴',
  '212': '曇後一時雨',
  '213': '曇後時々雨',
  '214': '曇後雨',
  '215': '曇後一時雪',
  '216': '曇後時々雪',
  '217': '曇後雪',
  '218': '曇後雨か雪',
  '219': '曇後雨か雷雨',
  '220': '曇朝夕一時雨',
  '221': '曇朝の内一時雨',
  '222': '曇夕方一時雨',
  '223': '曇日中時々晴',
  '224': '曇昼頃から雨',
  '225': '曇夕方から雨',
  '226': '曇夜は雨',
  '228': '曇昼頃から雪',
  '229': '曇夕方から雪',
  '230': '曇夜は雪',
  '231': '曇海上海岸は霧か霧雨',
  '240': '曇時々雨で雷を伴う',
  '250': '曇時々雪で雷を伴う',
  '260': '曇一時雪か雨',
  '270': '曇時々雪か雨',
  '281': '曇後雪か雨',
  '300': '雨',
  '301': '雨時々晴',
  '302': '雨時々止む',
  '303': '雨時々雪',
  '304': '雨か雪',
  '306': '大雨',
  '308': '雨で暴風を伴う',
  '309': '雨一時雪',
  '311': '雨後晴',
  '313': '雨後曇',
  '314': '雨後時々雪',
  '315': '雨後雪',
  '316': '雨か雪後晴',
  '317': '雨か雪後曇',
  '320': '朝の内雨後晴',
  '321': '朝の内雨後曇',
  '322': '雨朝晩一時雪',
  '323': '雨昼頃から晴',
  '324': '雨夕方から晴',
  '325': '雨夜は晴',
  '326': '雨夕方から雪',
  '327': '雨夜は雪',
  '328': '雨一時強く降る',
  '329': '雨一時みぞれ',
  '340': '雪か雨',
  '350': '雨で雷を伴う',
  '361': '雪か雨後晴',
  '371': '雪か雨後曇',
  '400': '雪',
  '401': '雪時々晴',
  '402': '雪時々止む',
  '403': '雪時々雨',
  '405': '大雪',
  '406': '風雪強い',
  '407': '暴風雪',
  '409': '雪一時雨',
  '411': '雪後晴',
  '413': '雪後曇',
  '414': '雪後雨',
  '420': '朝の内雪後晴',
  '421': '朝の内雪後曇',
  '422': '雪昼頃から雨',
  '423': '雪夕方から雨',
  '425': '雪一時強く降る',
  '426': '雪後みぞれ',
  '427': '雪一時みぞれ',
  '450': '雪で雷を伴う',
}

export type Sky = 'clear' | 'cloudy' | 'rain' | 'snow' | 'thunder' | 'fog'

/** How the second condition relates to the first: "時々/一時" or "後/から". */
export type Transition = 'sometimes' | 'later'

export interface WeatherGlyph {
  primary: Sky
  secondary: Sky | null
  transition: Transition | null
  label: string
}

const FAMILY: Record<string, Sky> = { '1': 'clear', '2': 'cloudy', '3': 'rain', '4': 'snow' }
const FAMILY_LABEL: Record<Sky, string> = {
  clear: '晴',
  cloudy: '曇',
  rain: '雨',
  snow: '雪',
  thunder: '雷',
  fog: '霧',
}

/** The first weather word in a fragment of a telop. */
function skyIn(text: string): Sky | null {
  const words: Array<[RegExp, Sky]> = [
    [/雷/, 'thunder'],
    [/雪|みぞれ/, 'snow'],
    [/雨/, 'rain'],
    [/霧/, 'fog'],
    [/曇/, 'cloudy'],
    [/晴/, 'clear'],
  ]
  let best: { at: number; sky: Sky } | null = null
  for (const [re, sky] of words) {
    const at = text.search(re)
    if (at >= 0 && (best === null || at < best.at)) best = { at, sky }
  }
  return best?.sky ?? null
}

/** The second condition in a telop, if it differs from the first. */
function secondaryOf(label: string, tail: string, primary: Sky): Sky | null {
  const found = tail === '' ? null : skyIn(tail)
  if (found !== null && found !== primary) return found
  // "雨で雷を伴う": thunder qualifies the rain rather than following it.
  return /雷/.test(label) && primary !== 'thunder' ? 'thunder' : null
}

/**
 * The icon for a code: a main condition, and optionally a second one with how
 * it relates. Read from the telop wording, so the table above is the only data.
 */
export function glyphFor(code: string): WeatherGlyph {
  const label = WEATHER_CODES[code]
  if (label === undefined) {
    const primary = FAMILY[code.charAt(0)] ?? 'cloudy'
    return { primary, secondary: null, transition: null, label: FAMILY_LABEL[primary] }
  }

  // "朝の内霧後晴": the condition that holds for most of the day comes after.
  const leading = /^(朝の内)(.+?)後(.+)$/.exec(label)
  if (leading) {
    return {
      primary: skyIn(leading[3] ?? '') ?? 'cloudy',
      secondary: skyIn(leading[2] ?? ''),
      transition: 'sometimes',
      label,
    }
  }

  const split =
    /^(.+?)(時々|一時|後|から|朝夕|朝晩|朝の内|夕方|夜は|昼頃|日中|午後|明け方|山沿い|海上)(.*)$/.exec(
      label,
    )
  const head = split?.[1] ?? label
  const tail = split ? `${split[2]}${split[3]}` : ''
  const primary = skyIn(head) ?? FAMILY[code.charAt(0)] ?? 'cloudy'
  const secondary = secondaryOf(label, tail, primary)
  const transition: Transition | null =
    secondary === null ? null : /後|から|夜は/.test(tail) ? 'later' : 'sometimes'
  return { primary, secondary, transition, label }
}
