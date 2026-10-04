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
LASTPAD  = 0x1c     ; the buttons held at the start screen's last look
BRKFLAG  = 0x1e     ; BASIC's in the pocket ROM: always 0 here, for link.s

; The pad (shared/elec16/pad.ts) and the cartridge (shared/elec16/cartridge.ts).
IO_PAD      = -0x7f0   ; F810: the buttons held
IO_PAD_HIT  = -0x7ee   ; F812: those that went down or up since cleared
PAD_START   = 0x400
IO_DMACTRL  = -0x7ca   ; F836: 0 stops a DMA under way
CART_BANK   = 0x100

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
  j none          ; 2  getkey: no keyboard (the pad is read at F810)
  j cls           ; 3  clears the screen
  j locate        ; 4  a0: column, a1: row
  j puthex        ; 5  a0: a word, as four hex digits
  j newline       ; 6
  j none          ; 7  readline: no keyboard
  j link          ; 8  LINK: as the pocket ROM's (link.s)
SERVICES = 9
  .option compress

start:
  li sp, STACK_TOP
  la t0, trap
  csrw mtvec, t0
  csrwi mie, 0
  call e16c_init
  li a0, 0
  li a1, 0
  j boot

; The start screen, with what stopped the last program (a0: mcause, a1: its pc; 0 for none),
; then asleep until START is pressed (the pad's line wakes it) or BRK. START loads the game in
; the slot through LINK's CART and starts it (startPressed, play.e16.ts); when it cannot, the
; start screen says why and waits again.
boot:
  li sp, STACK_TOP
  ; The ROM's handler and no interrupts, whatever a game had: one stopped by BRK or a fault
  ; left its own handler in mtvec, in RAM the next program may overwrite.
  la t0, trap
  csrw mtvec, t0
  csrci mstatus, 8
  ; The screen as the ROM draws it - mode 0, its palette - whatever a game left it as, and
  ; no note of the game's left sounding.
  addi sp, sp, -4
  sw a0, 0(sp)
  sw a1, 2(sp)
  call screenInit
  call soundOff
  lw a0, 0(sp)
  lw a1, 2(sp)
  addi sp, sp, 4
  call bootScreen
idle:
  li t0, 1 << IRQ_PAD
  csrw mie, t0
  li t1, IO_PAD
  lw t0, 0(t1)
  sw t0, LASTPAD(zero)
idle_sleep:
  wfi
  ; A press is a button marked in PADHIT that was up at the last look: one pressed and let go
  ; before the ROM looked counts too (a key tapped on the PC is often both in one frame).
  li t1, IO_PAD_HIT
  lw t0, 0(t1)
  sw t0, 0(t1)
  lw t2, LASTPAD(zero)
  xori t2, t2, -1
  and t0, t0, t2
  li t1, IO_PAD
  lw t2, 0(t1)
  sw t2, LASTPAD(zero)
  li t2, PAD_START
  and t0, t0, t2
  beqz t0, idle_sleep
  call startPressed
  j idle
idle_end:

; A game started at a0, its entry, with its ROM's first bank in the window and a fresh stack;
; it comes back to the start screen when it returns. No line is left enabled for it.
start_game:
  li sp, STACK_TOP
  csrwi mie, 0
  li t0, CART_BANK
  sw t0, IO_BANK(zero)
  la ra, game_return
  jr a0

game_return:
  li a0, 0
  li a1, 0
  j boot

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
  ; A LINK request out belonged to what stopped: its answer must not land in RAM later. Nor
  ; is a copy it started into video memory left going.
  li t0, LINK_CANCEL
  sw t0, IO_LINK_CMD(zero)
  li t0, IO_DMACTRL
  sw zero, 0(t0)
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

  .include "link.s"

  .align 2
font:
  .include "font.inc"

; Where the hand-written ROM ends.
rom_end:

; The screen and the start screen, from e16c.
  .include "play.s"
