; DEMO, ELEC-16 PLAY's first cartridge (docs/elec16-play.md section 7): a square on mode 0's
; bitmap, moved by the d-pad and coloured anew by A, which also rings a note of the colour's
; on the sound's channel 0, placed left to right where the square is; START goes back to the
; start screen. It waits for VBLANK each frame and reads the pad then. E16 assembly, built into a .E16G by
; npm run gen:elec16 (shared/elec16/cart-build.ts).

  .include "io.inc"

VPAGE  = 0xf802
VSTAT  = 0xf804
PAD    = 0xf810
PADHIT = 0xf812
WINDOW = 0xe000
CHSEL  = 0xf840
WAVE   = 0xf842
FREQ   = 0xf844
PAN    = 0xf848
ENV    = 0xf84a
KEY    = 0xf84e
A_BIT  = 0x10
START  = 0x400

  .bank 0
  .org 0xc000
start:
  addi sp, sp, -2
  sw ra, 0(sp)
  li t0, 3
  ecall
  li a0, 18
  li a1, 2
  li t0, 4
  ecall
  la a0, title
  li t0, 1
  ecall
  li a0, 7
  li a1, 33
  li t0, 4
  ecall
  la a0, help
  li t0, 1
  ecall
  li s0, 152          ; x, a multiple of four
  li s1, 140          ; y
  li s2, 3            ; the colour
  ; Presses from before the game are not its; what is held now is not pressed in it.
  li t1, PADHIT
  li t2, 0xfff
  sw t2, 0(t1)
  li t1, PAD
  lw t2, 0(t1)
  la t1, last
  sw t2, 0(t1)
  mv a0, s2
  call box
frame:
  li t0, 1 << IRQ_VBLANK
  csrw mie, t0
  wfi
  li t1, VSTAT
  li t2, 1
  sw t2, 0(t1)
  ; The presses: what PADHIT marks that was up at the last frame (one let go again since
  ; counts too), and what is held kept for the next.
  li t1, PADHIT
  lw s3, 0(t1)
  sw s3, 0(t1)
  la t1, last
  lw t2, 0(t1)
  xori t2, t2, -1
  and s3, s3, t2
  li t2, PAD
  lw t2, 0(t2)
  sw t2, 0(t1)
  li t1, START
  and t1, s3, t1
  bnez t1, quit
  li a0, 0
  call box
  andi t1, s3, A_BIT
  beqz t1, .move
  addi s2, s2, 1
  andi s2, s2, 3
  bnez s2, .ring
  li s2, 1
.ring:
  call chime
.move:
  ; The d-pad held moves it: two dots a frame up and down, four across.
  li t1, PAD
  lw t2, 0(t1)
  andi t1, t2, 1
  beqz t1, .down
  addi s1, s1, -2
.down:
  andi t1, t2, 2
  beqz t1, .left
  addi s1, s1, 2
.left:
  andi t1, t2, 4
  beqz t1, .right
  addi s0, s0, -4
.right:
  andi t1, t2, 8
  beqz t1, .held
  addi s0, s0, 4
.held:
  ; Kept on the screen: 0 to 312 across, 16 to 256 down (clear of the words).
  bge s0, zero, .xmax
  li s0, 0
.xmax:
  li t1, 312
  ble s0, t1, .ymin
  mv s0, t1
.ymin:
  li t1, 16
  bge s1, t1, .ymax
  mv s1, t1
.ymax:
  li t1, 256
  ble s1, t1, .draw
  mv s1, t1
.draw:
  mv a0, s2
  call box
  j frame

quit:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; The square at (s0, s1) in colour a0: eight rows of two bytes, each byte through the window
; at its own page (a row may cross one).
box:
  li t3, 0x55
  mul t3, t3, a0
  li a1, 0
.row:
  add t0, s1, a1
  li t1, 80
  mul t0, t0, t1
  srli t1, s0, 2
  add a2, t0, t1
  li a3, 2
.byte:
  srli t1, a2, 12
  li t2, VPAGE
  sw t1, 0(t2)
  andi t1, a2, 0xfff
  li t2, WINDOW
  add t1, t1, t2
  sb t3, 0(t1)
  addi a2, a2, 1
  addi a3, a3, -1
  bnez a3, .byte
  addi a1, a1, 1
  li t1, 8
  blt a1, t1, .row
  ret

; Channel 0 rung: a triangle, struck and dying away (attack 2 ms, decay 400 ms, nothing held,
; release 160 ms), at the colour's note, panned by x (0 to 312 -> 0 to 14).
chime:
  li t1, CHSEL
  sw zero, 0(t1)
  li t1, WAVE
  li t2, 4
  sw t2, 0(t1)
  li t1, ENV
  li t2, 0x80a1
  sw t2, 0(t1)
  la t1, notes
  slli t2, s2, 1
  add t1, t1, t2
  lw t2, 0(t1)
  li t1, FREQ
  sw t2, 0(t1)
  li t1, 3
  mul t2, s0, t1
  srli t2, t2, 6
  li t1, PAN
  sw t2, 0(t1)
  li t1, KEY
  li t2, 1
  sw t2, 0(t1)
  ret

; C6, E6 and G6 in quarters of a hertz, by colour (1 to 3).
notes:
  .word 0, 4186, 5274, 6272

; The game's own word of RAM: the buttons held at the last frame. A cartridge's ROM cannot be
; written, so it lives in RAM, just below the code area.
last = 0x6ffe

title:
  .asciz "ELEC-16 PLAY DEMO"
help:
  .asciz "D-PAD MOVES  A COLOUR  START ENDS"
