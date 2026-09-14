import {
  clockTime,
  describeQuake,
  intensityLabel,
  magnitudeLabel,
  type QuakeAlert,
  type QuakeLanguage,
  sourceCredit,
} from './quakes.js'
import { tsunamiLevelLabel, tsunamiSummary } from './tsunami.js'

/** The system notifications for an alert: the tsunami first, then each earthquake. */
export function notificationsFor(
  payload: QuakeAlert,
  language: QuakeLanguage,
): Array<{ title: string; body: string }> {
  const list: Array<{ title: string; body: string }> = []
  const { tsunami } = payload
  if (tsunami !== null) {
    list.push({
      title: `${tsunamiLevelLabel(tsunami.level, language)} · ${clockTime(tsunami.issuedAt)}`,
      body: [tsunamiSummary(tsunami, language), sourceCredit(tsunami.source, language)].join('\n'),
    })
  }
  for (const quake of payload.quakes) {
    const strength =
      quake.maxIntensity !== null
        ? intensityLabel(quake.maxIntensity, language)
        : magnitudeLabel(quake.magnitude)
    list.push({
      title: `${language === 'ja' ? '地震情報' : 'Earthquake'} ${clockTime(quake.at)} · ${strength}`,
      body: [describeQuake(quake, language), sourceCredit(quake.source, language)].join('\n'),
    })
  }
  return list
}
