/**
 * The calculator, as the rest of elecdex sees it.
 *
 * Everything imports from here - the calculator pane, the notes pane's evaluate
 * at the caret, the timer's duration field - and nothing reaches into
 * `calc/vendor`, which is a copy of elecxzy's calculator that is replaced whole at
 * each sync (see vendor/README.md). Keeping the seam at this file is what lets
 * that copy stay unedited: anything elecdex needs differently is added in the
 * wrapper modules beside it.
 *
 * It is pure logic with no platform of its own, so main, the metrics service and
 * the renderer can all use it.
 */

export {
  bitNibbles,
  CALC_MAX_INPUT,
  CALC_MAX_VARS,
  type CalcLineOutcome,
  type CalcOutcome,
  type CalcValue,
  calcValue,
  evaluate,
  evaluateAt,
  evaluateLine,
} from './evaluate.js'
export { CALC_EXAMPLES, CALC_FUNCTIONS, CALC_HELP, type HelpGroup } from './help.js'
export { TALLY_MAX_NUMBERS, type TallyReport, tally } from './tally.js'
