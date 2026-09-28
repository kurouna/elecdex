import type { ElecdexPlugin } from '../elecdex-plugin'
import { type Settings, startGame } from './app'
import { bindRecords } from './records'

/**
 * KEYSTREAM: a rhythm game on the keyboard. Letters fall down lanes that stand over the keys
 * that play them; type each as it reaches the line and it plays the melody, while the game
 * plays the band around it. Every key always plays the same note, so the keyboard is an
 * instrument you learn by playing.
 *
 * The sample for plugin API version 2: a canvas block drawn in the worker (ctx.surface,
 * ctx.animate, ctx.theme), the keys of a focused pane (ctx.keys) and elecdex's synthesiser
 * (ctx.sound). Install it from Settings -> Plugins -> install from a folder.
 */

export default {
  apiVersion: 2,
  id: 'keystream',
  title: 'keystream',
  description:
    'A rhythm game: type the falling letters to play the melody, while the band plays the rest.',
  permissions: { keys: true, sound: true },
  settings: [
    {
      key: 'lead',
      type: 'select',
      label: 'Lead tone',
      default: 'epiano',
      options: [
        { value: 'epiano', label: 'E.PIANO' },
        { value: 'piano', label: 'PIANO' },
        { value: 'guitar', label: 'GUITAR' },
        { value: 'lead', label: 'SYNTH LEAD' },
        { value: 'chip', label: 'CHIP' },
      ],
    },
    { key: 'volume', type: 'number', label: 'Volume (%)', default: 80, min: 0, max: 100, step: 5 },
    {
      key: 'offset',
      type: 'number',
      label: 'Timing offset (ms)',
      description: 'Positive when your keys land late, negative when early.',
      default: 0,
      min: -150,
      max: 150,
      step: 5,
    },
    {
      key: 'guide',
      type: 'boolean',
      label: 'Guide melody',
      description: 'Plays your part quietly underneath, to learn a track by.',
      default: false,
    },
  ],
  minSize: { w: 520, h: 340 },
  zoom: 'full',
  multiple: false,

  service(ctx) {
    bindRecords(ctx.storage)
  },

  view: (ctx) => startGame(ctx),
} satisfies ElecdexPlugin<Settings>
