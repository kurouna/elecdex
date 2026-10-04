// ELECDRILL's palettes (docs/elec16-elecdrill.md): sixteen colours each, every value a multiple
// of 8 so it is exactly an RGB555 colour. Colour 0 is the clear one (slot 0's is the backdrop).
// The order is the rows of art/palettes.png and the game's PAL_ constants; which slot a
// palette goes in is the game's (field.e16.ts).
//
// The blocks' rows share one layout so one set of tiles draws every colour:
//   1 outline, 2-6 the body from shadow to light, 7 the glint, 12-15 text in that colour
// The earths share another, for the dug cells:
//   1-2 shadow, 3-5 the ground, 6-8 pebbles and seams, 9-11 the stratum's own glints

const hex = (s) => {
  const v = Number.parseInt(s.slice(1), 16)
  return [(v >> 16) & 0xf8, (v >> 8) & 0xf8, v & 0xf8]
}
const row = (...colours) => colours.map(hex)

/** A block colour: outline, five body tones, glint, four spare, and its text (edge, three). */
const block = (outline, body, glint, text) =>
  row(
    '#000000',
    outline,
    ...body,
    glint,
    '#000000',
    '#000000',
    '#000000',
    '#000000',
    '#100810',
    ...text,
  )

/** An earth: backdrop, two shadows, three grounds, three pebble tones, three glints, four spare. */
const earth = (back, shadows, ground, pebbles, glints) =>
  row(
    back,
    ...shadows,
    ...ground,
    ...pebbles,
    ...glints,
    '#000000',
    '#000000',
    '#000000',
    '#000000',
  )

export const PALETTES = [
  // The five strata, from the top: loam, clay, slate, magma, crystal.
  {
    name: 'earth1',
    colours: earth(
      '#181008',
      ['#100800', '#281808'],
      ['#382010', '#402818', '#503020'],
      ['#583828', '#704830', '#887058'],
      ['#486028', '#689038', '#a0b858'],
    ),
  },
  {
    name: 'earth2',
    colours: earth(
      '#200808',
      ['#180000', '#300808'],
      ['#481810', '#582018', '#682820'],
      ['#783828', '#985040', '#c08060'],
      ['#c06830', '#e09048', '#f8c070'],
    ),
  },
  {
    name: 'earth3',
    colours: earth(
      '#080c18',
      ['#000008', '#101828'],
      ['#182438', '#202c40', '#283850'],
      ['#384860', '#506078', '#788898'],
      ['#3870a0', '#58a0c8', '#a8e0f0'],
    ),
  },
  {
    name: 'earth4',
    colours: earth(
      '#100404',
      ['#080000', '#180808'],
      ['#200c0c', '#281010', '#301810'],
      ['#402018', '#583020', '#704030'],
      ['#c03000', '#f87000', '#f8d040'],
    ),
  },
  {
    name: 'earth5',
    colours: earth(
      '#100818',
      ['#080010', '#180c28'],
      ['#201038', '#281848', '#302058'],
      ['#403068', '#584888', '#8070b0'],
      ['#7840c8', '#c070f8', '#f0c8f8'],
    ),
  },
  {
    name: 'red',
    colours: block('#380810', ['#801018', '#b81828', '#e03038', '#f86858', '#f8a088'], '#f8f0e0', [
      '#c01820',
      '#f85048',
      '#f8b8a8',
    ]),
  },
  {
    name: 'yellow',
    colours: block('#402000', ['#985000', '#d08800', '#f0b818', '#f8d848', '#f8f088'], '#f8f8e8', [
      '#c08000',
      '#f8c820',
      '#f8f0a0',
    ]),
  },
  {
    name: 'green',
    colours: block('#002010', ['#005828', '#109038', '#30c048', '#70e060', '#b0f890'], '#f0f8e8', [
      '#18a038',
      '#58e058',
      '#c8f8b8',
    ]),
  },
  {
    name: 'blue',
    colours: block('#080830', ['#102878', '#1850b8', '#3080f0', '#60b0f8', '#a0d8f8'], '#f0f8f8', [
      '#2060d0',
      '#58a8f8',
      '#c0e8f8',
    ]),
  },
  {
    // Blocks about to vanish (a white the game pulses), the core at 500 m, gold words.
    name: 'flash',
    colours: row(
      '#000000',
      '#585070',
      '#a098b8',
      '#c8c0d8',
      '#e0d8f0',
      '#f0f0f8',
      '#f8f8f8',
      '#f8f8f8',
      '#300848',
      '#8020b0',
      '#e050f8',
      '#f8c0f8',
      '#281000',
      '#e09010',
      '#f8c830',
      '#f8f0a0',
    ),
  },
  {
    // The machine: outline, steel, glass, warning orange, lamps, white words.
    name: 'panel',
    colours: row(
      '#000000',
      '#080810',
      '#283040',
      '#485868',
      '#7888a0',
      '#b8c8d8',
      '#085060',
      '#18a8c8',
      '#a0f0f8',
      '#f07818',
      '#e02020',
      '#40e060',
      '#081018',
      '#a8b8c8',
      '#d8e0e8',
      '#f8f8f8',
    ),
  },
  {
    // RIVET, the driller: outline, suit orange, face, visor, boots, the drill, the lamp.
    name: 'driller',
    colours: row(
      '#000000',
      '#180810',
      '#a03810',
      '#e06818',
      '#f8a038',
      '#f8d0a0',
      '#d08868',
      '#103058',
      '#3890d8',
      '#f8f8f8',
      '#383848',
      '#686878',
      '#686070',
      '#c8c8d8',
      '#f8e840',
      '#e82838',
    ),
  },
  {
    // Dust, sparks, bubbles and the drill bit.
    name: 'fx',
    colours: row(
      '#000000',
      '#403020',
      '#786048',
      '#b09878',
      '#f07018',
      '#f8d040',
      '#f8f8f8',
      '#303040',
      '#7878a0',
      '#c8c8e0',
      '#38a0e0',
      '#b0e8f8',
      '#281000',
      '#e09010',
      '#f8c830',
      '#f8f0a0',
    ),
  },
  {
    // The title's word: four block colours in three tones each, an outline, white, steel.
    name: 'logo',
    colours: row(
      '#000000',
      '#100820',
      '#901020',
      '#e83038',
      '#f88878',
      '#b07000',
      '#f0c018',
      '#f8f080',
      '#087028',
      '#30c048',
      '#a0f088',
      '#1048a8',
      '#3080f0',
      '#a0d0f8',
      '#f8f8f8',
      '#9098b0',
    ),
  },
]

export function paletteOf(name) {
  const p = PALETTES.find((x) => x.name === name)
  if (p === undefined) throw new Error(`no palette ${name}`)
  return p.colours
}
