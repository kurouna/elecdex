; The ELEC-16 SCI ROM, for SCI-128 (docs/elec16-sci.md): reset, the trap handler, the ROM
; services and the calculator's key loop. The calculator is e16c (calc.e16.ts and the files
; beside it, compiled into sci.s by npm run gen:elec16); its evaluation and its other screens
; live in ROM banks 0 and 1, reached through far_call.
;
; Labels are lower case and constants upper case, as in the pocket ROM; calls follow the usual
; E16 convention (a0-a3 and t0-t3 may change, s0-s3, sp and gp are kept).

  .include "io.inc"

; The ROM's work area at the bottom of RAM (0000-00FF); e16c's globals follow it (0100-03FF),
; and what the calculator keeps when the power goes after them (0400 on, numbers.e16.ts).
RETPC    = 0x12     ; where an ECALL service returns to
ERA      = 0x14     ; the caller's ra while an ECALL service runs
CAUSE    = 0x16     ; mcause of the last break or fault
CALC_SP  = 0x18     ; the stack at the key loop: an error or ON comes back to it
REGS     = 0x20     ; 16 words at the last break or fault: pc, then x1 to x15
MPIE     = 0x80     ; mstatus: interrupts on before the trap
BRK_CAUSE = 0x800f  ; mcause of BRK (ON)

STACK_TOP = 0x8000  ; the stack grows down from the top of RAM, above the code area

  .org 0x8000
reset:
  .option nocompress
  j start

; The ROM services at the same addresses as the pocket ROM's, so a program written for both
; (e16c's library) calls the same numbers. What the calculator has no part for answers -1.
  .org 0x8010
services:
  j putc          ; 0  a0: a character (CR a new line, BS back, CLS clear)
  j puts          ; 1  a0: the address of text ended by a zero
  j getkey        ; 2  waits for a key: its code in the matrix
  j cls           ; 3  clears the screen
  j locate        ; 4  a0: column, a1: row
  j puthex        ; 5  a0: a word, as four hex digits
  j newline       ; 6
  j none          ; 7  readline: no keyboard to type a line on
  j none          ; 8  LINK: the calculator has none
SERVICES = 9
  .option compress

start:
  li sp, STACK_TOP
  la t0, trap
  csrw mtvec, t0
  csrwi mie, 0
  call e16c_init
  call calcCold

; The key loop, its stack kept so an error (calc_abort) or ON (calc_on) comes back to it.
calc_main:
  li sp, STACK_TOP
  sw sp, CALC_SP(zero)
  ; The ROM's handler and no interrupts, whatever a program CODE ran had.
  la t0, trap
  csrw mtvec, t0
  csrci mstatus, 8
  call calcLoop
  j calc_main

; An error in the line (numbers.e16.ts fail): the stack back to the key loop's, the fixed ROM's
; bank back in the window, the error shown.
calc_abort:
  lw sp, CALC_SP(zero)
  sw zero, IO_BANK(zero)
  call calcError
  j calc_main

; ON, out of the trap: AC from anywhere, or OFF after SHIFT.
calc_on:
  lw sp, CALC_SP(zero)
  call calcOn
  j calc_main

; A break or a fault in a program CODE ran: a0 the cause, a1 where.
calc_fault:
  lw sp, CALC_SP(zero)
  call calcFault
  j calc_main

; Where a program the pane called (CODE's RUN) comes back: to the key loop, what it drew left.
code_return:
  j calc_main

none:
  li a0, -1
  ret

; Service 2: sleeps until a key is in the FIFO, and takes it. The key line is let on for the
; wait and put back as it was.
getkey:
  csrr t1, mie
  li t0, 1 << IRQ_KEY
  csrs mie, t0
.wait:
  lw t0, IO_KEY_COUNT(zero)
  bnez t0, .take
  wfi
  j .wait
.take:
  lw a0, IO_KEY_DATA(zero)
  csrw mie, t1
  ret

; A function in a ROM bank called from the fixed ROM: t0 its address, t1 its bank; the caller's
; bank back after it (the pocket ROM's far_call).
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

; The font's and the big digits' addresses, for lcd.e16.ts.
font_base:
  la a0, font
  ret

big_base:
  la a0, big_digits
  ret

; ---------------- traps ----------------

; A break, a fault or an ECALL. An ECALL runs its service outside the handler, as in the
; pocket ROM. ON (BRK) goes to calc_on; anything else keeps every register for CORE and goes
; to calc_fault, saying what stopped and where.
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
  ; The fixed ROM's own bank back: an evaluation stopped in bank 0 leaves that in the window.
  sw zero, IO_BANK(zero)
  la t1, calc_fault
  li t2, BRK_CAUSE
  bne t0, t2, .out
  la t1, calc_on
.out:
  lw a0, CAUSE(zero)
  lw a1, REGS(zero)
  ; Out of the handler with interrupts staying off and the ROM's own handler in mtvec.
  li t0, MPIE
  csrc mstatus, t0
  la t0, trap
  csrw mtvec, t0
  csrw mepc, t1
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
  csrr t0, mepc
  sw t0, REGS(zero)
  li t0, 11
  sw t0, CAUSE(zero)
  lw a0, CAUSE(zero)
  lw a1, REGS(zero)
  li t0, MPIE
  csrc mstatus, t0
  la t0, calc_fault
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

big_digits:
  .include "bigdigits.inc"

; Where the hand-written ROM ends.
rom_end:

; The calculator, from e16c.
  .include "sci.s"
