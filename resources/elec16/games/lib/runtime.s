; The game kit's runtime (docs/elec16-play.md section 10), written once for every game made
; with e16c: the cartridge's entry, which copies the game's code into RAM and starts it there,
; the interrupt handler (VBLANK counted, LINE stepping the raster table), the wait for the next
; frame and far_call. The kit's builder (shared/elec16/kit/build.ts) assembles it with the
; game's e16c output and defines IMAGE_BANK, IMAGE_LEN and ROM_TRAP.
;
; RAM:  0000-01FF the PLAY ROM's      0200-027F this runtime's (RT_*)
;       0280-1FFF the game's globals    2000-6FFF its code (IMAGE_AT)    7000-7FFF the stack
;
; Code in RAM may switch the bank window as it likes; code in a cartridge bank (an e16c file
; given a bank) runs in the window, and reaches another bank only through far_call.

  .include "io.inc"

IMAGE_AT    = 0x2000
COPIER_AT   = 0x7000
STACK_TOP   = 0x8000

RT_RA       = 0x0200   ; where the game returns to: the ROM's start screen
RT_FRAME    = 0x0202   ; VBLANKs counted by the handler
RT_RASTER   = 0x0204   ; nonzero: LINE steps BG0X through RT_TABLE every 8 lines
RT_K        = 0x0206   ; the next band of the raster table
RT_T1       = 0x0208   ; the handler's own room
RT_TABLE    = 0x0210   ; 36 words: BG0X for each band of 8 lines

VSTAT       = 0xf804
BG0X        = 0xf820
LINECMP     = 0xf82a
BANDS       = 36

; ---------------- the cartridge's entry, in its bank 0 ----------------

  .bank 0
  .org 0xc000
start:
  sw ra, RT_RA(zero)
  ; The copier runs from RAM: it moves the window under itself.
  li a0, COPIER_AT
  la a1, copier
  li a2, copier_end - copier
  mcpy a0, a1, a2
  li t0, COPIER_AT
  jr t0

; Copies IMAGE_LEN bytes from IMAGE_BANK on to IMAGE_AT, a bank at a time, and starts the
; game. It is copied before it runs, so it jumps only by offsets and loads addresses whole.
copier:
  li a0, IMAGE_AT
  li t3, IMAGE_BANK
  li t2, IMAGE_LEN
.next:
  sw t3, IO_BANK(zero)
  li a1, 0xc000
  li a2, 0x2000
  bltu a2, t2, .whole
  mv a2, t2
.whole:
  sub t2, t2, a2
  mcpy a0, a1, a2
  addi t3, t3, 1
  bnez t2, .next
  la t0, game_main
  jr t0
copier_end:

; ---------------- in RAM ----------------

  .org IMAGE_AT
game_main:
  li sp, STACK_TOP
  call e16c_init
  sw zero, RT_RASTER(zero)
  sw zero, RT_FRAME(zero)
  li t0, 0xffff
  li t1, LINECMP
  sw t0, 0(t1)
  li t0, 3
  li t1, VSTAT
  sw t0, 0(t1)
  la t0, irq
  csrw mtvec, t0
  li t0, (1 << IRQ_VBLANK) | (1 << IRQ_LINE)
  csrw mie, t0
  csrsi mstatus, 8
  call main
; The game is over: the ROM's handler back, no line enabled, to the start screen.
game_exit:
  csrci mstatus, 8
  csrw mie, zero
  li t0, ROM_TRAP
  csrw mtvec, t0
  lw ra, RT_RA(zero)
  ret

; VBLANK counts a frame and starts the raster table again; LINE steps it. Anything else - a
; break, a fault, an ECALL - goes to the ROM's handler with every register as it was.
irq:
  csrw mscratch, t0
  csrr t0, mcause
  sw t1, RT_T1(zero)
  li t1, 0x8000 + IRQ_LINE
  beq t0, t1, .line
  li t1, 0x8000 + IRQ_VBLANK
  beq t0, t1, .vblank
  lw t1, RT_T1(zero)
  csrr t0, mscratch
  j ROM_TRAP
.vblank:
  li t0, VSTAT
  li t1, 1
  sw t1, 0(t0)
  lw t1, RT_FRAME(zero)
  addi t1, t1, 1
  sw t1, RT_FRAME(zero)
  lw t1, RT_RASTER(zero)
  beqz t1, .done
  ; Band 0 from the frame's start, then LINE at line 8 for band 1.
  lw t1, RT_TABLE(zero)
  li t0, BG0X
  sw t1, 0(t0)
  li t1, 1
  sw t1, RT_K(zero)
  li t1, 8
  li t0, LINECMP
  sw t1, 0(t0)
  li t0, VSTAT
  li t1, 2
  sw t1, 0(t0)
  j .done
.line:
  li t0, VSTAT
  li t1, 2
  sw t1, 0(t0)
  lw t0, RT_K(zero)
  slli t1, t0, 1
  lw t1, RT_TABLE(t1)
  sw t1, -0x7e0(zero)     ; BG0X
  addi t0, t0, 1
  sw t0, RT_K(zero)
  slli t0, t0, 3
  li t1, BANDS * 8
  bltu t0, t1, .set
  li t0, 0xffff
.set:
  sw t0, -0x7d6(zero)     ; LINECMP
.done:
  lw t1, RT_T1(zero)
  csrr t0, mscratch
  mret

; frame_wait(seen): sleeps until the frame count is not `seen`, and answers it. Interrupts are
; held off between the look and the WFI, so a VBLANK that comes between them still wakes it.
frame_wait:
  csrci mstatus, 8
.look:
  lw t0, RT_FRAME(zero)
  bne t0, a0, .got
  wfi
  csrsi mstatus, 8
  csrci mstatus, 8
  j .look
.got:
  csrsi mstatus, 8
  mv a0, t0
  ret

; raster(on): the LINE steps through RT_TABLE from the next frame, or stop at once.
raster:
  sw a0, RT_RASTER(zero)
  bnez a0, .on
  li t0, 0xffff
  sw t0, -0x7d6(zero)     ; LINECMP
.on:
  ret

; A call into a cartridge bank (e16c's code for a function in another bank): t0 the
; function, t1 its bank, the arguments in a0-a3 and the answer in a0. The caller's bank goes
; back in the window afterwards.
far_call:
  addi sp, sp, -4
  sw ra, 2(sp)
  lw t2, IO_BANK(zero)
  sw t2, 0(sp)
  sw t1, IO_BANK(zero)
  jalr ra, 0(t0)
  lw t2, 0(sp)
  sw t2, IO_BANK(zero)
  lw ra, 2(sp)
  addi sp, sp, 4
  ret
