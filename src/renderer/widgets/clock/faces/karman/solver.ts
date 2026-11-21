/**
 * KARMAN's wind tunnel: a 2D incompressible flow by Stam's Stable Fluids, on a grid of W x H
 * cells with a border of one. Pure numbers - no DOM - so it is tested on its own and the face
 * only feeds it obstacles and paints its smoke.
 *
 * Each step: smoke streaks and a faint wobble enter at the left; a "fan" holds the far field at
 * the free stream; vorticity confinement puts back the small swirls the coarse grid smears;
 * the velocity is advected semi-Lagrangian and projected divergence-free (pressure by
 * Gauss-Seidel, a solid cell's pressure taken as its neighbour's); the smoke is advected by
 * BFECC so the streaks stay sharp. The digits are solid cells: velocity zero inside them, so
 * the flow parts round them and sheds a vortex street behind.
 */

export interface TunnelOptions {
  /** The free-stream speed, cells per unit of time. */
  speed?: number
  /** Gauss-Seidel sweeps of the pressure solve. */
  iterations?: number
  /** A streak of smoke every `streak` rows, `streakWidth` rows wide. */
  streak?: number
  streakWidth?: number
  /** Vorticity confinement's strength. */
  confinement?: number
  /** How fast the fan pulls the flow back to the free stream, per step. */
  fan?: number
}

export class Tunnel {
  readonly W: number
  readonly H: number
  readonly speed: number
  readonly iterations: number
  readonly streak: number
  readonly streakWidth: number
  readonly confinement: number
  readonly fan: number
  readonly u: Float32Array
  readonly v: Float32Array
  /** The smoke, 0 (none) to 1. */
  readonly dye: Float32Array
  /** 1 where a cell is solid. */
  readonly solid: Uint8Array
  private readonly u0: Float32Array
  private readonly v0: Float32Array
  private readonly d0: Float32Array
  private readonly p: Float32Array
  private readonly div: Float32Array
  private readonly curl: Float32Array
  private readonly scratch: Float32Array
  /** How far the flow has run, in its own time units: 0 for a tunnel not yet stepped. */
  elapsed = 0

  constructor(W: number, H: number, options: TunnelOptions = {}) {
    this.W = W
    this.H = H
    this.speed = options.speed ?? 1.6
    this.iterations = options.iterations ?? (H > 40 ? 40 : 24)
    this.streak = options.streak ?? (H < 20 ? 3 : 7)
    this.streakWidth = options.streakWidth ?? (H < 20 ? 1 : 2)
    this.confinement = options.confinement ?? 0.7
    this.fan = options.fan ?? 0.04
    const n = (W + 2) * (H + 2)
    this.u = new Float32Array(n).fill(this.speed)
    this.v = new Float32Array(n)
    this.dye = new Float32Array(n)
    this.solid = new Uint8Array(n)
    this.u0 = new Float32Array(n)
    this.v0 = new Float32Array(n)
    this.d0 = new Float32Array(n)
    this.p = new Float32Array(n)
    this.div = new Float32Array(n)
    this.curl = new Float32Array(n)
    this.scratch = new Float32Array(n)
    // The streaks already run the length of the tunnel, so the first frame is a tunnel at work
    // rather than an empty one filling from the left.
    for (let j = 1; j <= H; j++) {
      const on = this.streakAt(j)
      for (let i = 0; i <= W + 1; i++) this.dye[this.ix(i, j)] = on
    }
  }

  /** The index of cell (i, j), border included: i 0..W+1, j 0..H+1. */
  ix(i: number, j: number): number {
    return i + (this.W + 2) * j
  }

  private streakAt(j: number): number {
    return j % this.streak < this.streakWidth ? 1 : 0
  }

  /**
   * Sets the obstacles from a mask of W x H cells, row by row (1 solid). The smoke inside a new
   * obstacle goes, and the flow inside it stops.
   */
  setSolid(mask: ArrayLike<number>): void {
    const { W, H, solid } = this
    solid.fill(0)
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        if (mask[j * W + i]) solid[this.ix(i + 1, j + 1)] = 1
      }
    }
    this.bound(this.u, this.v)
    for (let k = 0; k < solid.length; k++) if (solid[k]) this.dye[k] = 0
  }

  /** The walls slip; the left lets the wind in, the right lets it out; solid cells hold still. */
  private bound(u: Float32Array, v: Float32Array): void {
    const { W, H, solid } = this
    for (let j = 0; j <= H + 1; j++) {
      u[this.ix(0, j)] = this.speed
      v[this.ix(0, j)] = 0
      u[this.ix(W + 1, j)] = u[this.ix(W, j)] ?? 0
      v[this.ix(W + 1, j)] = v[this.ix(W, j)] ?? 0
    }
    for (let i = 0; i <= W + 1; i++) {
      v[this.ix(i, 0)] = 0
      v[this.ix(i, H + 1)] = 0
      u[this.ix(i, 0)] = u[this.ix(i, 1)] ?? 0
      u[this.ix(i, H + 1)] = u[this.ix(i, H)] ?? 0
    }
    for (let k = 0; k < solid.length; k++) {
      if (solid[k]) {
        u[k] = 0
        v[k] = 0
      }
    }
  }

  /** Carries `src` along (u, v) for `dt` into `dst`: each cell looks back where its fluid came from. */
  private advect(
    dst: Float32Array,
    src: Float32Array,
    u: Float32Array,
    v: Float32Array,
    dt: number,
  ): void {
    const { W, H, solid } = this
    const row = W + 2
    for (let j = 1; j <= H; j++) {
      for (let i = 1; i <= W; i++) {
        const k = i + row * j
        if (solid[k]) {
          dst[k] = 0
          continue
        }
        const x = Math.max(0.5, Math.min(W + 0.5, i - dt * (u[k] as number)))
        const y = Math.max(0.5, Math.min(H + 0.5, j - dt * (v[k] as number)))
        const i0 = Math.floor(x)
        const j0 = Math.floor(y)
        const s = x - i0
        const t = y - j0
        const a = i0 + row * j0
        dst[k] =
          (1 - s) * ((1 - t) * (src[a] as number) + t * (src[a + row] as number)) +
          s * ((1 - t) * (src[a + 1] as number) + t * (src[a + row + 1] as number))
      }
    }
  }

  /** The divergence of (u, v) in each fluid cell, by central differences. */
  divergence(out: Float32Array = this.div): Float32Array {
    const { W, H, u, v } = this
    const row = W + 2
    for (let j = 1; j <= H; j++) {
      for (let i = 1; i <= W; i++) {
        const k = i + row * j
        out[k] =
          0.5 *
          ((u[k + 1] as number) -
            (u[k - 1] as number) +
            (v[k + row] as number) -
            (v[k - row] as number))
      }
    }
    return out
  }

  /** Makes the velocity divergence-free: solves for the pressure and takes away its gradient. */
  project(): void {
    this.divergence(this.div)
    this.p.fill(0)
    for (let it = 0; it < this.iterations; it++) {
      this.relaxPressure()
      this.pressureBorder()
    }
    this.subtractGradient()
    this.bound(this.u, this.v)
  }

  /** One Gauss-Seidel sweep of the pressure's Poisson equation. */
  private relaxPressure(): void {
    const { W, H, p, div, solid } = this
    const row = W + 2
    for (let j = 1; j <= H; j++) {
      for (let i = 1; i <= W; i++) {
        const k = i + row * j
        if (solid[k]) continue
        const near =
          this.pressureBeside(k - 1, k) +
          this.pressureBeside(k + 1, k) +
          this.pressureBeside(k - row, k) +
          this.pressureBeside(k + row, k)
        p[k] = (near - (div[k] as number)) / 4
      }
    }
  }

  /** A neighbour's pressure; a solid one's is taken as the cell's own (Neumann): no flow into it. */
  private pressureBeside(n: number, k: number): number {
    return (this.solid[n] ? this.p[k] : this.p[n]) as number
  }

  /** The walls and the inlet pass no flow; the outlet is open, its pressure the far field's. */
  private pressureBorder(): void {
    const { W, H, p } = this
    for (let i = 0; i <= W + 1; i++) {
      p[this.ix(i, 0)] = p[this.ix(i, 1)] as number
      p[this.ix(i, H + 1)] = p[this.ix(i, H)] as number
    }
    for (let j = 0; j <= H + 1; j++) {
      p[this.ix(0, j)] = p[this.ix(1, j)] as number
      p[this.ix(W + 1, j)] = 0
    }
  }

  private subtractGradient(): void {
    const { W, H, u, v, p, solid } = this
    const row = W + 2
    for (let j = 1; j <= H; j++) {
      for (let i = 1; i <= W; i++) {
        const k = i + row * j
        if (solid[k]) continue
        u[k] = (u[k] as number) - 0.5 * ((p[k + 1] as number) - (p[k - 1] as number))
        v[k] = (v[k] as number) - 0.5 * ((p[k + row] as number) - (p[k - row] as number))
      }
    }
  }

  /** Puts back the small swirls the coarse grid smears away. */
  private confine(dt: number): void {
    const { W, H, u, v, curl, solid } = this
    const row = W + 2
    const eps = this.confinement
    for (let j = 1; j <= H; j++) {
      for (let i = 1; i <= W; i++) {
        const k = i + row * j
        curl[k] =
          0.5 *
          ((v[k + 1] as number) -
            (v[k - 1] as number) -
            ((u[k + row] as number) - (u[k - row] as number)))
      }
    }
    for (let j = 2; j < H; j++) {
      for (let i = 2; i < W; i++) {
        const k = i + row * j
        if (solid[k]) continue
        const gx = 0.5 * (Math.abs(curl[k + 1] as number) - Math.abs(curl[k - 1] as number))
        const gy = 0.5 * (Math.abs(curl[k + row] as number) - Math.abs(curl[k - row] as number))
        const len = Math.hypot(gx, gy) + 1e-5
        const c = curl[k] as number
        u[k] = (u[k] as number) + dt * eps * (gy / len) * c
        v[k] = (v[k] as number) - dt * eps * (gx / len) * c
      }
    }
  }

  /** Smoke and a faint wobble at the inlet: the wobble is what starts the shedding. */
  private inflow(): void {
    const { H, dye, v } = this
    for (let j = 1; j <= H; j++) {
      const k = this.ix(1, j)
      const on = this.streakAt(j)
      dye[k] = on
      dye[k - 1] = on
      v[k] = (v[k] as number) + 0.004 * Math.sin(this.elapsed * 3.1 + j * 0.7)
    }
  }

  /**
   * The fan: the far field is pulled back towards the free stream, as a real tunnel's fan holds
   * it - a few Gauss-Seidel sweeps alone let the coarse grid's mean flow stall.
   */
  private blow(): void {
    const { u, solid, speed, fan } = this
    for (let k = 0; k < u.length; k++)
      if (!solid[k]) u[k] = (u[k] as number) + (speed - (u[k] as number)) * fan
  }

  /** The smoke by BFECC: forward, back again, and corrected by half the error before the last pass. */
  private carrySmoke(dt: number): void {
    const { dye, d0, scratch: forward, div: back, u, v } = this
    d0.set(dye)
    // advect writes only the inside; the border keeps the smoke as it is, the inlet's streaks.
    forward.set(d0)
    back.set(d0)
    this.advect(forward, d0, u, v, dt)
    this.advect(back, forward, u, v, -dt)
    for (let k = 0; k < dye.length; k++)
      back[k] = (d0[k] as number) + 0.5 * ((d0[k] as number) - (back[k] as number))
    this.advect(dye, back, u, v, dt)
    // The correction can overshoot; the smoke is kept a share in [0, 1], thinning slowly.
    for (let k = 0; k < dye.length; k++) dye[k] = Math.max(0, Math.min(1, dye[k] as number)) * 0.999
  }

  step(dt: number): void {
    this.elapsed += dt
    this.inflow()
    this.blow()
    this.confine(dt)
    this.u0.set(this.u)
    this.v0.set(this.v)
    this.advect(this.u, this.u0, this.u0, this.v0, dt)
    this.advect(this.v, this.v0, this.u0, this.v0, dt)
    this.bound(this.u, this.v)
    this.project()
    this.carrySmoke(dt)
  }
}

/** The tunnel's grid for a pane, and the pixels one cell stands for. */
export interface Grid {
  cell: number
  W: number
  H: number
}

/**
 * Most cells a tunnel may have. A step costs about its cells times the pressure sweeps, and
 * a zoomed 1920 x 1080 pane at 4 px a cell would be 130 000 cells: capped, it is drawn
 * coarser and stays a few milliseconds a frame.
 */
export const MAX_CELLS = 20_000

/**
 * The grid for a `width` x `height` pane: 3 px cells for a low strip, where a coarser grid
 * would leave the digits a few cells high and shed no street; 4 to 5 px for a bigger pane; and
 * coarser still where that would pass MAX_CELLS.
 */
export function tunnelGrid(width: number, height: number): Grid {
  let cell = height <= 48 ? 3 : height <= 200 ? 4 : 5
  const cells = (width / cell) * (height / cell)
  if (cells > MAX_CELLS) cell *= Math.sqrt(cells / MAX_CELLS)
  return {
    cell,
    W: Math.max(4, Math.round(width / cell)),
    H: Math.max(8, Math.round(height / cell)),
  }
}

/** A mask of W x H cells from an RGBA image's alpha: a cell is solid where it is mostly covered. */
export function maskFromAlpha(
  rgba: ArrayLike<number>,
  W: number,
  H: number,
  threshold = 110,
): Uint8Array {
  const mask = new Uint8Array(W * H)
  for (let k = 0; k < W * H; k++) mask[k] = (rgba[k * 4 + 3] ?? 0) > threshold ? 1 : 0
  return mask
}

/**
 * Paints the smoke into an RGBA image of W x H: the dye colour at up to `strength` opacity,
 * transparent where there is none, so the pane's own ground shows through on every theme.
 */
export function paintSmoke(
  tunnel: Tunnel,
  out: Uint8ClampedArray,
  colour: readonly [number, number, number],
  strength = 0.42,
): void {
  const { W, H, dye } = tunnel
  const [r, g, b] = colour
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const a = Math.min(1, dye[tunnel.ix(i + 1, j + 1)] as number) * strength
      const o = (j * W + i) * 4
      out[o] = r
      out[o + 1] = g
      out[o + 2] = b
      out[o + 3] = a * 255
    }
  }
}
