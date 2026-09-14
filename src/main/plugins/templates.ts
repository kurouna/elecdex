import pomodoroIndex from '../../../examples/plugins/pomodoro/index.ts?raw'
import pomodoroText from '../../../examples/plugins/pomodoro/text.ts?raw'
import pomodoroTimer from '../../../examples/plugins/pomodoro/timer.ts?raw'
import pomodoroView from '../../../examples/plugins/pomodoro/view.ts?raw'
import api from '../../shared/plugin-api.ts?raw'

/**
 * What elecdex writes into the plugins folder, bundled into main at build time: the type
 * definitions, from the same file the host's own types come from, and the sample plugin,
 * from examples/plugins in the repository.
 */

export const PLUGIN_TYPES = api

export const PLUGIN_SAMPLE: Readonly<Record<string, string>> = {
  'pomodoro/index.ts': pomodoroIndex,
  'pomodoro/text.ts': pomodoroText,
  'pomodoro/timer.ts': pomodoroTimer,
  'pomodoro/view.ts': pomodoroView,
}
