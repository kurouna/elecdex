; The ELEC-16 PLAY ROM, for PLAY-320 (docs/elec16-play.md): reset, the trap handler, the ROM
; services and the start screen. No BASIC and no monitor: a program comes from the pane
; (CODE's RUN calls it) or, from G4, from a cartridge. The screen is mode 0's bitmap, drawn by
; play.e16.ts (e16c, compiled into play.s by npm run gen:elec16).
;
; Labels are lower case and constants upper case, as in the pocket ROM; calls follow the usual
; E16 convention (a0-a3 and t0-t3 may change, s0-s3, sp and gp are kept).

  .include "io.inc"

; The ROM's work area at the bottom of RAM (0000-00FF); e16c's globals follow it (0100-01FF).
RETPC    = 0x12     ; where an ECALL service returns to
ERA      = 0x14     ; the caller's ra while an ECALL service runs
CAUSE    = 0x16     ; mcause of the last break or fault
REGS     = 0x20     ; 16 words at the last break or fault: pc, then x1 to x15

STACK_TOP = 0x8000  ; the stack grows down from the top of RAM, above the code area

  .org 0x8000
reset:
  .option nocompress
  j start

; The ROM services at the same addresses as the pocket ROM's, so a program written for both
; (e16c's library) calls the same numbers. What PLAY-320 has no part for answers -1.
  .org 0x8010
services:
  j putc          ; 0  a0: a character (CR a new line, BS back, CLS clear)
  j puts          ; 1  a0: the address of text ended by a zero
  j none          ; 2  getkey: no keyboard (the pad is G3)
  j cls           ; 3  clears the screen
  j locate        ; 4  a0: column, a1: row
  j puthex        ; 5  a0: a word, as four hex digits
  j newline       ; 6
  j none          ; 7  readline: no keyboard
  j none          ; 8  LINK (G4)
SERVICES = 9
  .option compress

start:
  li sp, STACK_TOP
  la t0, trap
  csrw mtvec, t0
  csrwi mie, 0
  call e16c_init
  call screenInit
  li a0, 0
  li a1, 0
  j boot

; The start screen, with what stopped the last program (a0: mcause, a1: its pc; 0 for none),
; then asleep until BRK. Nothing but BRK wakes it: no line is enabled.
boot:
  li sp, STACK_TOP
  call bootScreen
idle:
  csrwi mie, 0
idle_sleep:
  wfi
  j idle_sleep
idle_end:

; Where a program the pane called (CODE's RUN) comes back: what it drew stays on the screen,
; and BRK brings the start screen back.
code_return:
  li sp, STACK_TOP
  j idle

none:
  li a0, -1
  ret

; The font's address, for play.e16.ts.
font_base:
  la a0, font
  ret

; ---------------- traps ----------------

; A break, a fault or an ECALL. An ECALL runs its service outside the handler, as in the
; pocket ROM; anything else keeps every register for CORE and goes to the start screen,
; saying what stopped and where - except BRK at the start screen, which only draws it again.
trap:
  csrw mscratch, t0
  csrr t0, mcause
  addi t0, t0, -11
  beqz t0, ecall_entry
  sw ra, REGS + 2(zero)
  sw sp, REGS + 4(zero)
  sw gp, REGS + 6(zero)
  sw a0, REGS + 8(zero)
  sw a1, REGS + 10(zero)
  sw a2, REGS + 12(zero)
  sw a3, REGS + 14(zero)
  csrr t0, mscratch
  sw t0, REGS + 16(zero)
  sw t1, REGS + 18(zero)
  sw t2, REGS + 20(zero)
  sw t3, REGS + 22(zero)
  sw s0, REGS + 24(zero)
  sw s1, REGS + 26(zero)
  sw s2, REGS + 28(zero)
  sw s3, REGS + 30(zero)
  csrr t0, mepc
  sw t0, REGS(zero)
  csrr t0, mcause
  sw t0, CAUSE(zero)
  ; A LINK request out belonged to what stopped: its answer must not land in RAM later.
  li t0, LINK_CANCEL
  sw t0, IO_LINK_CMD(zero)
  ; Out of the handler, to the start screen with the cause and the pc - or with neither when
  ; it only slept there (BRK at the start screen, or after a program came back). Where it
  ; was tells, not a flag: the pane calls a program without the ROM.
  lw a0, CAUSE(zero)
  lw a1, REGS(zero)
  la t0, idle_sleep
  bltu a1, t0, .say
  la t0, idle_end
  bgeu a1, t0, .say
  li a0, 0
  li a1, 0
.say:
  la t0, boot
  csrw mepc, t0
  mret

ecall_entry:
  csrr t0, mepc
  addi t0, t0, 4
  sw t0, RETPC(zero)
  sw ra, ERA(zero)
  csrr t0, mscratch
  sltiu ra, t0, SERVICES
  beqz ra, .unknown
  slli t0, t0, 2
  la ra, services
  add t0, t0, ra
  csrw mepc, t0
  la ra, ecall_return
  csrr t0, mscratch
  mret
.unknown:
  ; An ECALL with no such service stops the program, as a fault does.
  lw ra, ERA(zero)
  csrr t0, mscratch
  sw t0, REGS + 16(zero)
  csrr t0, mepc
  sw t0, REGS(zero)
  li t0, 11
  sw t0, CAUSE(zero)
  lw a0, CAUSE(zero)
  lw a1, REGS(zero)
  la t0, boot
  csrw mepc, t0
  mret

; Where a service returns, outside the handler: back past the ECALL with the caller's ra.
ecall_return:
  lw ra, ERA(zero)
  lw t3, RETPC(zero)
  jr t3

  .align 2
font:
  .include "font.inc"

; Where the hand-written ROM ends.
rom_end:

; The screen and the start screen, from e16c.
  .include "play.s"
