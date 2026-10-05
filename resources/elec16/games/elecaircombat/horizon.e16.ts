// ELECAIRCOMBAT's sky and sea on BG0 (docs/elec16-elecaircombat.md section 4), in cartridge
// bank 6 (it runs once a frame, through far_call): where the horizon lies, from the player's
// axes, and every sky row rewritten from it - each cell's tile chosen by its centre's distance
// from the horizon (horizon.txt, made tile words in sky.e16.ts's hBand), rows that did not
// change left alone. The rows are one piece of assembly: a row of the sky is up to 40 table
// reads, and a steep bank has every row's cells differ.
import { asm, i16, u16, words } from '../../../../src/shared/e16c/builtins'
import { aim, cos, sin } from '../lib/kit.e16'
import { HORIZON_TILE } from './assets.e16'
import { abs16, muldiv, mulq, V_PF, V_PR, V_PU, vget } from './math.e16'
import { cockpitOn, hBand, hPart, RANGE, SKY_ROWS } from './sky.e16'

/** The horizon on the screen, as the HUD reads it too: its normal (x 256) and distance. */
export let hNX: i16 = 0
export let hNY: i16 = -256
/** The horizon's distance from the boresight in 32nds of a point (the sky positive). */
export let hC: i16 = 0
/** The length of the up axes' part across the screen (Q14): small looking straight up or down. */
export let hL: i16 = 16384

/**
 * Where the horizon lies, from the player's axes: the sky is where a point's direction has the
 * world's up in it, (x - CX) R.z + (CY - y) U.z + FOCAL F.z > 0, a line on the screen.
 */
export function horizonFind(): void {
  const rz = vget(V_PR + 2)
  const uz = vget(V_PU + 2)
  const fz = vget(V_PF + 2)
  const a = aim(rz >> 6, -uz >> 6)
  hNX = cos(a)
  hNY = sin(a)
  hL = mulq(rz, hNX * 64) + mulq(-uz, hNY * 64)
  const far: i16 = 19200
  if (hL < 64 || u16(abs16(fz)) > u16(hL) * 3) hC = fz > 0 ? far : -far
  else {
    const c = i16(muldiv(u16(abs16(fz)), 6144, u16(hL)))
    hC = fz < 0 ? -c : c
  }
  partialIn((a + 64) & 255)
}

/** The horizon's tiles for the normal at angle `b` (0: the sky straight up) into the table. */
function partialIn(b: u16): void {
  let flips: u16 = 0
  let bc = b
  if (b > 192) {
    bc = 256 - b
    flips = 0x2000
  } else if (b > 128) {
    bc = b - 128
    flips = 0x6000
  } else if (b > 64) {
    bc = 128 - b
    flips = 0x4000
  }
  const row = ((bc + 2) >> 2) * 13
  let o: u16 = 0
  while (o < 13) {
    hBand[RANGE - 6 + o] = (HORIZON_TILE + hPart[row + o]) | flips
    o++
  }
}

/** The rows' loop's state: row, end, the row's first distance, the steps across and down. */
const skyArgs = words(6)

/** BG0's sky rows for this frame. */
export function skyDraw(): void {
  horizonFind()
  const nx = hNX
  const ny = hNY
  const across = 39 * nx
  // Row 0 is under the canopy's bow wherever the cockpit is shown.
  const r: u16 = cockpitOn ? 1 : 0
  skyArgs[0] = r
  skyArgs[1] = cockpitOn ? SKY_ROWS : 36
  // The distance at each row's first cell: a step of `ny` from row to row, `nx` along it.
  skyArgs[2] = u16((((i16(r * 2) - 27) * ny - across) >> 1) + hC)
  skyArgs[3] = u16(nx)
  skyArgs[4] = u16(ny)
  skyArgs[5] = u16(across)
  skyRows()
}

/**
 * Every row from `skyArgs`: its ends' tiles read (straight from the table when both are within
 * it, held to its ends when not); one tile across is a quick fill, or nothing when the row
 * already is; else cell by cell, eight at once where the eight's ends are one tile (the table
 * runs in order, so all eight are). Each row written goes to BG0 by DMA.
 */
function skyRows(): void {
  asm`
.sr_row:
    li t3, skyArgs
    lw a0, 4(t3)
    lw a1, 6(t3)
    lw t0, 10(t3)
    add t1, a0, t0
    li t2, 12760
    bge a0, t2, .sr_far
    bge t1, t2, .sr_far
    li t2, -12760
    bge t2, a0, .sr_far
    bge t2, t1, .sr_far
    li t3, hBand + 800
    srai t2, a0, 5
    slli t2, t2, 1
    add t2, t2, t3
    lw t2, 0(t2)
    srai t0, t1, 5
    slli t0, t0, 1
    add t0, t0, t3
    lw t0, 0(t0)
    bne t2, t0, .sr_near
    j .sr_one
.sr_far:
    srai t2, a0, 5
    li t3, 400
    min t2, t2, t3
    li t3, -400
    max t2, t2, t3
    slli t2, t2, 1
    li t3, hBand + 800
    add t2, t2, t3
    lw t2, 0(t2)
    srai t0, t1, 5
    li t3, 400
    min t0, t0, t3
    li t3, -400
    max t0, t0, t3
    slli t0, t0, 1
    li t3, hBand + 800
    add t0, t0, t3
    lw t0, 0(t0)
    bne t2, t0, .sr_clamped
.sr_one:
    li t3, skyArgs
    lw t1, 0(t3)
    slli t1, t1, 1
    li t3, hRowWas
    add t1, t1, t3
    lw t3, 0(t1)
    beq t3, t2, .sr_next
    sw t2, 0(t1)
    li t0, hRow
    li t1, 40
.sr_fill:
    sw t2, 0(t0)
    addi t0, t0, 2
    addi t1, t1, -1
    bnez t1, .sr_fill
    j .sr_dma
.sr_near:
    li t3, skyArgs
    lw t1, 0(t3)
    slli t1, t1, 1
    li t3, hRowWas
    add t1, t1, t3
    li t3, -1
    sw t3, 0(t1)
    li a2, hRow
    li a3, 5
.rn_seg:
    srai t0, a0, 5
    slli t0, t0, 1
    lw t2, hBand + 800(t0)
    slli t3, a1, 3
    sub t3, t3, a1
    add t3, t3, a0
    srai t3, t3, 5
    slli t3, t3, 1
    lw t3, hBand + 800(t3)
    bne t2, t3, .rn_cells
    sw t2, 0(a2)
    sw t2, 2(a2)
    sw t2, 4(a2)
    sw t2, 6(a2)
    sw t2, 8(a2)
    sw t2, 10(a2)
    sw t2, 12(a2)
    sw t2, 14(a2)
    slli t0, a1, 3
    add a0, a0, t0
    j .rn_next
.rn_cells:
    srai t0, a0, 5
    slli t0, t0, 1
    lw t0, hBand + 800(t0)
    sw t0, 0(a2)
    add a0, a0, a1
    srai t0, a0, 5
    slli t0, t0, 1
    lw t0, hBand + 800(t0)
    sw t0, 2(a2)
    add a0, a0, a1
    srai t0, a0, 5
    slli t0, t0, 1
    lw t0, hBand + 800(t0)
    sw t0, 4(a2)
    add a0, a0, a1
    srai t0, a0, 5
    slli t0, t0, 1
    lw t0, hBand + 800(t0)
    sw t0, 6(a2)
    add a0, a0, a1
    srai t0, a0, 5
    slli t0, t0, 1
    lw t0, hBand + 800(t0)
    sw t0, 8(a2)
    add a0, a0, a1
    srai t0, a0, 5
    slli t0, t0, 1
    lw t0, hBand + 800(t0)
    sw t0, 10(a2)
    add a0, a0, a1
    srai t0, a0, 5
    slli t0, t0, 1
    lw t0, hBand + 800(t0)
    sw t0, 12(a2)
    add a0, a0, a1
    srai t0, a0, 5
    slli t0, t0, 1
    lw t0, hBand + 800(t0)
    sw t0, 14(a2)
    add a0, a0, a1
.rn_next:
    addi a2, a2, 16
    addi a3, a3, -1
    bnez a3, .rn_seg
    j .sr_dma
.sr_clamped:
    li t3, skyArgs
    lw t1, 0(t3)
    slli t1, t1, 1
    li t3, hRowWas
    add t1, t1, t3
    li t3, -1
    sw t3, 0(t1)
    li a2, hRow
    li a3, 5
    li t1, hBand + 800
.rc_seg:
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t2, 0(t0)
    slli t3, a1, 3
    sub t3, t3, a1
    add t3, t3, a0
    srai t3, t3, 5
    li t0, 400
    min t3, t3, t0
    li t0, -400
    max t3, t3, t0
    slli t3, t3, 1
    add t3, t3, t1
    lw t3, 0(t3)
    bne t2, t3, .rc_cells
    sw t2, 0(a2)
    sw t2, 2(a2)
    sw t2, 4(a2)
    sw t2, 6(a2)
    sw t2, 8(a2)
    sw t2, 10(a2)
    sw t2, 12(a2)
    sw t2, 14(a2)
    slli t0, a1, 3
    add a0, a0, t0
    j .rc_next
.rc_cells:
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 0(a2)
    add a0, a0, a1
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 2(a2)
    add a0, a0, a1
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 4(a2)
    add a0, a0, a1
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 6(a2)
    add a0, a0, a1
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 8(a2)
    add a0, a0, a1
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 10(a2)
    add a0, a0, a1
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 12(a2)
    add a0, a0, a1
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 14(a2)
    add a0, a0, a1
.rc_next:
    addi a2, a2, 16
    addi a3, a3, -1
    bnez a3, .rc_seg
.sr_dma:
    li t0, 0xf830
    li t1, hRow
    sw t1, 0(t0)
    li t3, skyArgs
    lw t1, 0(t3)
    slli t1, t1, 7
    li t2, 0x8000
    add t1, t1, t2
    sw t1, 2(t0)
    li t1, 80
    sw t1, 4(t0)
    li t1, 1
    sw t1, 6(t0)
.sr_next:
    li t3, skyArgs
    lw t0, 4(t3)
    lw t1, 8(t3)
    add t0, t0, t1
    sw t0, 4(t3)
    lw t0, 0(t3)
    addi t0, t0, 1
    sw t0, 0(t3)
    lw t1, 2(t3)
    blt t0, t1, .sr_row
  `
}
