/**
 * What the calculator pane's help sheet says, and the names it says it about.
 *
 * The vendor exports its constants but not its function table, so the functions
 * are written out here. `calc-wrapper.test.ts` calls every one of them, so a
 * sync that renames or drops one fails the suite instead of leaving the sheet
 * quietly wrong - and `evaluate.ts` takes the same list for the names an
 * assignment may not shadow, so the two cannot disagree.
 */

/** Every function the evaluator knows, with how many arguments it takes. */
export const CALC_FUNCTIONS: readonly { name: string; args: number }[] = [
  { name: 'sqrt', args: 1 },
  { name: 'cbrt', args: 1 },
  { name: 'abs', args: 1 },
  { name: 'exp', args: 1 },
  { name: 'sign', args: 1 },
  { name: 'pow', args: 2 },
  { name: 'ln', args: 1 },
  { name: 'log', args: 1 },
  { name: 'log2', args: 1 },
  { name: 'log10', args: 1 },
  { name: 'sin', args: 1 },
  { name: 'cos', args: 1 },
  { name: 'tan', args: 1 },
  { name: 'asin', args: 1 },
  { name: 'acos', args: 1 },
  { name: 'atan', args: 1 },
  { name: 'atan2', args: 2 },
  { name: 'sinh', args: 1 },
  { name: 'cosh', args: 1 },
  { name: 'tanh', args: 1 },
  { name: 'rad', args: 1 },
  { name: 'deg', args: 1 },
  { name: 'floor', args: 1 },
  { name: 'ceil', args: 1 },
  { name: 'trunc', args: 1 },
  { name: 'round', args: 1 },
  { name: 'min', args: 2 },
  { name: 'max', args: 2 },
  { name: 'hypot', args: 2 },
  { name: 'avg', args: 2 },
  { name: 'sum', args: 2 },
  { name: 'fact', args: 1 },
  { name: 'gcd', args: 2 },
  { name: 'lcm', args: 2 },
  { name: 'and', args: 2 },
  { name: 'or', args: 2 },
  { name: 'xor', args: 2 },
  { name: 'not', args: 1 },
  { name: 'shl', args: 2 },
  { name: 'shr', args: 2 },
]

export interface HelpGroup {
  title: string
  /** Each entry is shown as `name` with its note dimmed beside it. */
  items: readonly { name: string; note: string }[]
}

export const CALC_HELP: readonly HelpGroup[] = [
  {
    title: 'typing',
    items: [
      { name: '１＋２ · 3×4 · ６÷２', note: 'full width and × ÷ are read as typed' },
      { name: '3百万 · 5千', note: 'a magnitude after digits counts' },
      { name: 'ans', note: 'the answer before this one' },
      { name: 'rate = 0.08', note: 'keeps a name in the register row' },
    ],
  },
  {
    title: 'operators',
    items: [
      { name: '+ - * / %', note: 'divide by zero is an error, not infinity' },
      { name: '^', note: 'power, right to left; -2^2 is -4' },
      { name: '!', note: 'factorial, up to 170' },
      { name: '& | ~ << >>', note: '32-bit; xor is a function' },
    ],
  },
  {
    title: 'functions',
    items: [
      { name: 'sqrt cbrt abs exp sign pow', note: '' },
      { name: 'ln log(x, base) log2 log10', note: 'log alone is base 10' },
      { name: 'sin cos tan asin acos atan', note: 'radians: sin(rad(30))' },
      { name: 'rad deg', note: 'degrees to radians and back' },
      { name: 'round(x, digits) floor ceil trunc', note: '' },
      { name: 'min max sum avg hypot', note: 'any number of arguments' },
      { name: 'gcd lcm fact', note: '' },
      { name: 'and or xor not shl shr', note: '' },
    ],
  },
  {
    title: 'constants',
    items: [
      { name: 'pi e tau phi', note: '' },
      { name: 'percent permille bp', note: '4800 * 12 * percent' },
      { name: 'k thousand million billion trillion', note: '' },
      { name: 'man oku cho', note: '万 億 兆' },
      { name: 'kb mb gb tb · kib mib gib tib', note: '2 * tb / (512 * gib)' },
      { name: 'minute hour day week', note: 'in seconds' },
      { name: 'tsubo', note: 'in square metres' },
    ],
  },
]

/**
 * Lines the sheet offers as worked examples, and the test evaluates.
 *
 * Note the explicit `*` before a constant: the grammar has no implicit
 * multiplication, so "2tb" is not a number followed by a unit - it is a
 * mistake, and the sheet must not teach it.
 */
export const CALC_EXAMPLES: readonly string[] = [
  '1920 * 1080',
  '2 * tb / (512 * gib)',
  '3百万 / 12',
  '4800 * 12 * percent',
  'sin(rad(30))',
  'round(2 / 3, 4)',
  '(1 << 20) / kib',
]
