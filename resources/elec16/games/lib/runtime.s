; The game kit's runtime (docs/elec16-play.md section 10), written once for every game made
; with e16c: the cartridge's entry, which copies the game's code into RAM and starts it there,
; the interrupt handlers (VBLANK counted, LINE stepping the raster table - and, for raster(2),
; the game's table of lines), the wait for the next frame and far_call. The kit's builder (shared/elec16/kit/build.ts) assembles it with the
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
RT_RASTER   = 0x0204   ; nonzero: LINE steps BG0X through RT_TABLE every 8 lines (2: then lines)
RT_K        = 0x0206   ; the next band of the raster table
RT_T1       = 0x0208   ; the handler's own room
RT_LTAB     = 0x020a   ; raster(2): the game's table, a BG0X word for each line from RT_LFROM
RT_LFROM    = 0x020c   ; raster(2): the first line BG0X is written for, 8 to 287
RT_LTO      = 0x020e   ; raster(2): the last, RT_LFROM to 287
RT_TABLE    = 0x0210   ; 36 words: BG0X for each band of 8 lines
RT_LP       = 0x0258   ; raster(2): RT_LTAB less two bytes a line above RT_LFROM, this frame's

VSTAT       = 0xf804
BG0X        = 0xf820
LINECMP     = 0xf82a
LINE        = 0xf82c
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
  ; LINE only while raster(1): otherwise it is the game's to read in VSTAT.
  li t0, 1 << IRQ_VBLANK
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
  ; Not stepping the table (raster(0) on the way): LINECMP is left as the game has it.
  lw t1, RT_RASTER(zero)
  beqz t1, .done
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

; raster(on): the LINE steps through RT_TABLE from the next frame (1; 2 to RT_LFROM, then
; the game's lines to RT_LTO), or stops at once - its line no longer enabled, LINE (and
; LINECMP) left to the game. raster(2) takes the LINE with handlers of its own, irq_lines and
; irq_each, so the bands of raster(1) cost what they always have. A change of mode takes a
; frame to settle: called while a frame is drawn, the rest of it may keep the last value.
raster:
  sw a0, RT_RASTER(zero)
  la t0, irq
  li t1, 2
  bne a0, t1, .vector
  la t0, irq_lines
.vector:
  csrw mtvec, t0
  li t0, 1 << IRQ_LINE
  bnez a0, .on
  csrc mie, t0
  li t0, 0xffff
  sw t0, -0x7d6(zero)     ; LINECMP
  ret
.on:
  csrs mie, t0
  ret

; raster_lines(table, from, to): raster(2)'s lines - BG0X from the word at `table` on line
; `from` and the next word each line down to `to` - from the next frame. Written whole before
; `from` comes, the game may give another table each frame (one drawn, one being made).
raster_lines:
  sw a0, RT_LTAB(zero)
  sw a1, RT_LFROM(zero)
  sw a2, RT_LTO(zero)
  ret

; raster(2)'s handler for the bands. VBLANK, and anything else, is irq's; LINE steps the bands
; as irq does down to RT_LFROM, then hands the LINE to irq_each for the lines.
irq_lines:
  csrw mscratch, t0
  csrr t0, mcause
  sw t1, RT_T1(zero)
  li t1, 0x8000 + IRQ_LINE
  bne t0, t1, .other
  li t1, 2
  sw t1, -0x7fc(zero)     ; VSTAT: LINE seen
  lw t0, RT_K(zero)
  slli t1, t0, 1
  lw t1, RT_TABLE(t1)
  sw t1, -0x7e0(zero)     ; BG0X
  addi t0, t0, 1
  sw t0, RT_K(zero)
  slli t0, t0, 3
  lw t1, RT_LFROM(zero)
  bltu t0, t1, .next
  ; The bands end: the lines from RT_LFROM, through this frame's table, by irq_each.
  slli t0, t1, 1
  lw t1, RT_LTAB(zero)
  sub t1, t1, t0
  sw t1, RT_LP(zero)
  la t0, irq_each
  csrw mtvec, t0
  ; Lines from 8, the first LINE: they begin on the line this LINE came on, which a LINECMP
  ; set to it now would never see again - irq_each takes it at once.
  lw t0, RT_K(zero)
  addi t0, t0, -1
  slli t0, t0, 3
  lw t1, RT_LFROM(zero)
  bgeu t0, t1, .now
  lw t0, RT_LFROM(zero)
.next:
  sw t0, -0x7d6(zero)     ; LINECMP
  lw t1, RT_T1(zero)
  csrr t0, mscratch
  mret
.now:
  lw t1, RT_T1(zero)
  csrr t0, mscratch
  j irq_each
.other:
  lw t1, RT_T1(zero)
  csrr t0, mscratch
  j irq

; raster(2)'s handler for the lines, RT_LFROM to RT_LTO: BG0X from the game's table each line,
; then irq_lines again for the next frame. A line is found by reading LINE, so a handler held up
; past a line takes up again on the next. Anything else goes to irq_lines (and on to irq) with
; irq_lines put back, as the end of the lines would.
irq_each:
  csrw mscratch, t0
  csrr t0, mcause
  sw t1, RT_T1(zero)
  li t1, 0x8000 + IRQ_LINE
  bne t0, t1, .other
  li t1, 2
  sw t1, -0x7fc(zero)     ; VSTAT: LINE seen
  lw t0, -0x7d4(zero)     ; LINE
  lw t1, RT_LP(zero)
  add t1, t1, t0
  add t1, t1, t0
  lw t1, 0(t1)
  sw t1, -0x7e0(zero)     ; BG0X
  addi t0, t0, 1
  lw t1, RT_LTO(zero)
  bltu t1, t0, .end
  sw t0, -0x7d6(zero)     ; LINECMP
  lw t1, RT_T1(zero)
  csrr t0, mscratch
  mret
.end:
  li t0, 0xffff
  sw t0, -0x7d6(zero)     ; LINECMP
  la t0, irq_lines
  csrw mtvec, t0
  lw t1, RT_T1(zero)
  csrr t0, mscratch
  mret
.other:
  la t1, irq_lines
  csrw mtvec, t1
  lw t1, RT_T1(zero)
  csrr t0, mscratch
  j irq_lines

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
