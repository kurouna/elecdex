import { Biquad, impulseOf } from '../instruments/biquad.js'

/**
 * The guitar's loudspeaker cabinet (docs/plugins.md section 13.9), as a microphone close to one
 * of its four twelve-inch speakers hears it - made from a recipe, never recorded, and played
 * through the page's ConvolverNode. Nothing above five kilohertz or so leaves a guitar
 * speaker: that roll-off, more than the distortion, is what makes an amplified guitar sound
 * like one and not like a fuzz box into a mixing desk.
 *
 * A chain of second-order filters: the closed back's low resonance, a little box dip, the
 * cone's presence peaks, the steep top, and a cone break-up notch; its impulse response is
 * minimum-phase, as a speaker's is. Left and right are the microphone a little apart.
 */

export function cabinetResponse(sampleRate: number): Float32Array[] {
  return [
    { presence: 2400, sheen: 3700, breakup: 6400 },
    { presence: 2650, sheen: 3500, breakup: 7000 },
  ].map(({ presence, sheen, breakup }) => {
    const chain = [
      new Biquad('highpass', 78, 1.1, sampleRate),
      new Biquad('peaking', 115, 1.2, sampleRate, 3),
      new Biquad('peaking', 420, 1, sampleRate, -3),
      new Biquad('peaking', presence, 1.4, sampleRate, 4),
      new Biquad('peaking', sheen, 2.5, sampleRate, 2.5),
      new Biquad('lowpass', 4800, 1.1, sampleRate),
      new Biquad('lowpass', 5200, 0.6, sampleRate),
      new Biquad('peaking', breakup, 3, sampleRate, -8),
    ]
    const response = impulseOf(chain, Math.round(sampleRate * 0.08))
    // Unit energy: the cabinet colours, the amplifier sets the level.
    let energy = 0
    for (const x of response) energy += x * x
    const scale = 1 / Math.sqrt(energy)
    return response.map((x) => x * scale)
  })
}

/**
 * The lead's echo after the cabinet: two repeats a little apart, left and right, each fed back
 * darker, as a tape or an analogue delay does - the space a solo sits in.
 */
export const ECHO = { left: 0.31, right: 0.46, feedback: 0.3, cutoff: 3000, wet: 0.22 } as const
