; SCROLL, ELEC-16 PLAY's second cartridge (docs/elec16-play.md section 4): mode 1, the tile
; engine. A field of stars over a brick wall, scrolled sideways - the stars at half the
; speed, split from the wall at line 144 by the LINE interrupt - under a band that stays put
; (BG1), and a ship (a 16 x 16 sprite) the d-pad moves. START goes back to the start screen.
; The tiles and palettes go to video memory by DMA from the cartridge's own ROM. Built by the
; tests (shared/elec16/cart-build.ts): a test cartridge, not on the shelf since 2026-10-06.

  .include "io.inc"

VCTRL   = 0xf800
VPAGE   = 0xf802
VSTAT   = 0xf804
PAD     = 0xf810
PADHIT  = 0xf812
BG0X    = 0xf820
LINECMP = 0xf82a
DMASRC  = 0xf830
WINDOW  = 0xe000
SPLIT   = 144
START   = 0x400
; The game's own RAM, above the ROM's (0000-01FF), in reach of an absolute load: what was
; held at the last frame, the scroll, and the ship's place.
last    = 0x0300
scroll  = 0x0302
shipx   = 0x0304
shipy   = 0x0306

  .bank 0
  .org 0xc000
start:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; Palettes 0 and 1 (backgrounds), 8 (sprites), and twenty tiles from 0.
  la a0, palettes
  li a1, 0xc400
  li a2, 64
  call dma
  la a0, sprite_palette
  li a1, 0xc500
  li a2, 32
  call dma
  la a0, tiles
  li a1, 0
  li a2, 640
  call dma
  call maps
  call sprites
  li t0, VCTRL
  li t1, 3            ; on, mode 1
  sw t1, 0(t0)
  li t0, LINECMP
  li t1, SPLIT
  sw t1, 0(t0)
  li t0, 152
  sw t0, shipx(zero)
  li t0, 200
  sw t0, shipy(zero)
  sw zero, scroll(zero)
  li t1, PADHIT
  li t2, 0xfff
  sw t2, 0(t1)
  li t1, PAD
  lw t2, 0(t1)
  sw t2, last(zero)

frame:
  li t0, 1 << IRQ_VBLANK
  csrw mie, t0
  wfi
  ; A frame begins: VBLANK taken, and a LINE left from the frame before let go with it, so
  ; the wait for this frame's LINE waits for this frame's.
  li t1, VSTAT
  li t2, 3
  sw t2, 0(t1)
  ; The top of the frame: the stars at half the scroll.
  lw t0, scroll(zero)
  srli t0, t0, 1
  li t1, BG0X
  sw t0, 0(t1)
  ; START pressed (marked, and up at the last frame) ends it.
  li t1, PADHIT
  lw t0, 0(t1)
  sw t0, 0(t1)
  lw t2, last(zero)
  xori t2, t2, -1
  and t0, t0, t2
  li t1, PAD
  lw t2, 0(t1)
  sw t2, last(zero)
  li t1, START
  and t0, t0, t1
  bnez t0, quit
  ; The d-pad held moves the ship two dots a frame.
  lw a0, shipx(zero)
  lw a1, shipy(zero)
  andi t1, t2, 1
  beqz t1, .down
  addi a1, a1, -2
.down:
  andi t1, t2, 2
  beqz t1, .left
  addi a1, a1, 2
.left:
  andi t1, t2, 4
  beqz t1, .right
  addi a0, a0, -2
.right:
  andi t1, t2, 8
  beqz t1, .moved
  addi a0, a0, 2
.moved:
  sw a0, shipx(zero)
  sw a1, shipy(zero)
  ; Sprite 0's X and Y, in the table at C000 (page 12 of video memory).
  li t0, VPAGE
  li t1, 12
  sw t1, 0(t0)
  li t0, WINDOW
  sw a0, 0(t0)
  sw a1, 2(t0)
  lw t0, scroll(zero)
  addi t0, t0, 2
  andi t0, t0, 511
  sw t0, scroll(zero)
  ; Down to line 144: the wall at the whole scroll.
  li t0, 1 << IRQ_LINE
  csrw mie, t0
  wfi
  li t1, VSTAT
  li t2, 2
  sw t2, 0(t1)
  lw t0, scroll(zero)
  li t1, BG0X
  sw t0, 0(t1)
  j frame

quit:
  csrwi mie, 0
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; a2 bytes from a0 (this ROM, in the window) to video memory at a1. The CPU waits for it.
dma:
  li t0, DMASRC
  sw a0, 0(t0)
  sw a1, 2(t0)
  sw a2, 4(t0)
  li t1, 1
  sw t1, 6(t0)
  ret

; A word a1 into video memory at a0, through the window at its page.
vpoke:
  srli t0, a0, 12
  li t1, VPAGE
  sw t0, 0(t1)
  li t1, 0xfff
  and t0, a0, t1
  li t1, WINDOW
  add t0, t0, t1
  sw a1, 0(t0)
  ret

; BG0: stars in the top 18 rows, the wall below; BG1: the band, five rows of tile 8 in
; palette 1, the rest clear.
maps:
  addi sp, sp, -2
  sw ra, 0(sp)
  li s0, 0
.cell:
  srli t2, s0, 6        ; the row
  li a1, 2
  li t1, 18
  blt t2, t1, .bg0
  li a1, 1
.bg0:
  slli a0, s0, 1
  li t1, 0x8000
  add a0, a0, t1
  call vpoke
  srli t2, s0, 6
  li a1, 0
  li t1, 5
  bge t2, t1, .bg1
  li a1, 8 | (1 << 10)
.bg1:
  slli a0, s0, 1
  li t1, 0xa000
  add a0, a0, t1
  call vpoke
  addi s0, s0, 1
  li t1, 4096
  blt s0, t1, .cell
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; Every sprite hidden (size 3) but 0, the ship: 16 x 16 from tile 16, sprite palette 8.
sprites:
  addi sp, sp, -2
  sw ra, 0(sp)
  li s0, 1
.hide:
  slli a0, s0, 3
  li t1, 0xc006
  add a0, a0, t1
  li a1, 3
  call vpoke
  addi s0, s0, 1
  li t1, 128
  blt s0, t1, .hide
  li a0, 0xc004
  li a1, 16
  call vpoke
  li a0, 0xc006
  li a1, 1
  call vpoke
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

  .include "art.inc"
