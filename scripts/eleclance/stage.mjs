// ELECLANCE's stage script (docs/elec16-eleclance.md section 5): what comes when the screen's top
// reaches each row of the stage picture (rows from its top; the stage scrolls from the bottom
// up). Written as text, four numbers a line - row, kind, x, parameter - for the kit's `tables`.
// Kinds 1-8 are foes (foes.e16.ts), 20 the scroll's speed, 21 BASTION, 22 ZENITH, 23 a pickup.

const MOTE = 1
const DART = 2
const PIKE = 3
const HALBERD = 4
const WARDEN = 5
const ROCK = 6
const TURRET = 8
const SPEED = 20
const MIDBOSS = 21
const BOSS = 22
const PICKUP = 23

const lines = []
const at = (row, kind, x, p = 0, note = '') => lines.push({ row, kind, x, p, note })

/** Motes curving in from a side (1 left, 2 right) at height `y`, one a row. */
const curve = (row, side, y, n) => {
  for (let k = 0; k < n; k++) at(row - k, MOTE, side === 1 ? 40 : 280, side | (y << 8))
}
/** Motes falling and swaying, across the field from x0 by step. */
const rain = (row, x0, step, n) => {
  for (let k = 0; k < n; k++) at(row - (k >> 1), MOTE, x0 + k * step)
}

// The launch: a few motes to learn on.
at(566, MOTE, 110, 0, 'the launch')
at(562, MOTE, 160)
at(558, MOTE, 210)
curve(552, 1, 40, 5)

// The nebula: formations, darts, pikes, the first halberd.
curve(540, 2, 64, 5)
at(530, DART, 80, 0, 'the nebula')
at(530, DART, 240)
at(527, DART, 120)
at(527, DART, 200)
at(520, PIKE, 112, 40)
at(518, PIKE, 208, 60)
rain(510, 70, 30, 7)
at(500, HALBERD, 160)
at(486, DART, 60)
at(486, DART, 260)
at(483, DART, 100)
at(483, DART, 220)
curve(470, 1, 30, 6)
curve(462, 2, 50, 6)
at(450, PIKE, 90, 30)
at(450, PIKE, 230, 30)
at(447, PIKE, 160, 70)
at(440, PICKUP, 160, 0)
at(430, HALBERD, 110)
rain(426, 150, 24, 5)

// The belt: rocks that break, a warden, darts between.
at(410, ROCK, 100, 0, 'the belt')
at(406, ROCK, 220)
at(402, ROCK, 160)
at(396, WARDEN, 160)
at(380, DART, 70)
at(379, DART, 250)
at(378, DART, 110)
at(377, DART, 210)
at(372, ROCK, 80)
at(370, ROCK, 240)
at(366, ROCK, 150)
at(356, HALBERD, 210)
at(350, PIKE, 90, 50)
at(350, PIKE, 230, 50)
curve(340, 1, 40, 5)
curve(338, 2, 70, 5)
at(330, ROCK, 120)
at(328, ROCK, 200)

// The approach: BASTION holds the stage on its arena until it falls.
at(312, MIDBOSS, 0, 0, 'BASTION')

// The station: faster, turrets on the trench's floor, the heaviest waves.
at(252, SPEED, 16, 0, 'the station')
at(248, TURRET, 130)
at(248, TURRET, 190)
at(240, DART, 90)
at(240, DART, 230)
at(236, TURRET, 110)
at(236, TURRET, 210)
curve(228, 1, 30, 6)
at(220, HALBERD, 160)
at(210, TURRET, 120)
at(210, TURRET, 200)
at(208, TURRET, 160)
rain(200, 80, 32, 6)
at(190, WARDEN, 160)
at(180, TURRET, 100)
at(180, TURRET, 220)
curve(170, 2, 40, 6)
at(160, HALBERD, 100)
at(160, HALBERD, 220)
at(150, TURRET, 130)
at(150, TURRET, 190)
at(140, DART, 70)
at(140, DART, 250)
at(139, DART, 120)
at(139, DART, 200)
at(130, PIKE, 90, 40)
at(130, PIKE, 160, 70)
at(130, PIKE, 230, 40)
at(120, PICKUP, 160, 1)
curve(110, 1, 50, 6)
curve(110, 2, 30, 6)
at(100, HALBERD, 110)
at(98, HALBERD, 210)
at(90, TURRET, 120)
at(90, TURRET, 200)
rain(80, 70, 30, 7)

// Beyond the station: the scroll slows, the warning, ZENITH.
at(72, SPEED, 8, 0, 'beyond')
at(66, BOSS, 0, 0, 'ZENITH')

/** The script as text, rows from the bottom of the stage to its top, then the end mark. */
export function stageScript() {
  const sorted = lines.slice().sort((a, b) => b.row - a.row)
  const text = [
    '# ELECLANCE stage script: row kind x parameter (scripts/eleclance/stage.mjs wrote it).',
    "# Rows from the stage picture's top; a line runs when the screen's top reaches its row.",
    '# Kinds: 1 mote, 2 dart, 3 pike, 4 halberd, 5 warden, 6 rock, 8 turret,',
    '#        20 speed (x sixteenths a frame), 21 BASTION, 22 ZENITH, 23 pickup (p 0 bomb, 1 ship).',
    "# A parameter's high byte is where a foe comes in (a row of the screen), 0 for above it.",
  ]
  for (const l of sorted) {
    text.push(`${l.row} ${l.kind} ${l.x} ${l.p}${l.note ? `  # ${l.note}` : ''}`)
  }
  text.push('65535 0 0 0')
  return `${text.join('\n')}\n`
}
