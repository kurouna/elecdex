; The ELEC-16 ROM (docs/elec16.md section 6): reset, the trap handler and the ROM services.
; Phase 2 holds the machine-code monitor; BASIC comes in the banks later.
;
; Labels are lower case - CORE and MEM name code by them - and constants upper case.
; Calls follow the usual E16 convention: arguments and results in a0-a3, t0-t3 and a0-a3
; may change, s0-s3, sp and gp are kept, ra is the return address.

  .include "io.inc"
  .include "ram.inc"

  .org 0x8000
reset:
  .option nocompress
  j start

; The ROM services at fixed addresses, four bytes apart, for a program to call: also what
; ECALL n reaches, with n in t0 (an ECALL keeps every register but a0-a3 and t0-t3).
  .org 0x8010
services:
  j putc          ; 0  a0: a character (CR a new line, BS back, CLS clear)
  j puts          ; 1  a0: the address of text ended by a zero
  j getkey        ; 2  -> a0: the next key's character, waiting for one
  j cls           ; 3  clears the screen
  j locate        ; 4  a0: column, a1: row
  j puthex        ; 5  a0: a word, as four hex digits
  j newline       ; 6
  j readline      ; 7  a0: buffer, a1: most characters -> a0: how many
SERVICES = 8
  .option compress

start:
  li sp, STACK_TOP
  la t0, trap
  csrw mtvec, t0
  li t0, F_CAPS
  sw t0, FLAGS(zero)
  call lcd_init
  ; Keys wake the CPU from WFI; it takes no interrupts (getkey waits in WFI).
  csrwi mie, 1 << IRQ_KEY
  j basic_cold

; ---------------- traps ----------------

; A break, a fault or an ECALL. An ECALL runs its service outside the handler, so BRK can
; still stop a program waiting in it; anything else keeps every register for R and goes
; to the monitor.
trap:
  csrw mscratch, t0
  csrr t0, mcause
  addi t0, t0, -11
  beqz t0, ecall_entry
  ; BRK while BASIC has the machine: a flag BASIC takes between statements, and back.
  ; mcause 0x800F less 15 is 0x8000, which one shift left makes 0 (no exception is 15).
  csrr t0, mcause
  addi t0, t0, -15
  slli t0, t0, 1
  bnez t0, save_all
  lw t0, INBASIC(zero)
  beqz t0, save_all
  li t0, 1
  sw t0, BRKFLAG(zero)
  csrr t0, mscratch
  mret
save_all:
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
  ; Out of the handler, into the monitor.
  la t0, broken
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
  lw ra, ERA(zero)
  j save_all

; Where a service returns, outside the handler: back past the ECALL with the caller's ra.
ecall_return:
  lw ra, ERA(zero)
  lw t3, RETPC(zero)
  jr t3

  .include "lcd.s"
  .include "keys.s"
  .include "monitor.s"

; ---------------- BASIC ----------------
; BASIC is written in e16c's TypeScript (basic/*.e16.ts) and compiled into basic.s by
; npm run gen:elec16. Its prompt loop never returns: an error or BREAK comes back to it
; afresh, the stack as it was at the prompt (BASIC_SP).

basic_cold:
  li sp, STACK_TOP
  sw sp, BASIC_SP(zero)
  call e16c_init
  call basicCold
  j basic_abort

basic_warm:
  li sp, STACK_TOP
  sw sp, BASIC_SP(zero)
  call basicWarm
basic_abort:
  lw sp, BASIC_SP(zero)
  call basicLoop
  j basic_abort

; CALL: machine code at a0, which comes back with RET.
call_at:
  jr a0

; A call into a ROM bank (e16c's code for a function in another bank): t0 the function, t1
; its bank, the arguments in a0-a3 and the answer in a0 as for any call. The caller's bank
; goes back in the window afterwards, so it can call from banked code into another bank.
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

  .align 2
font:
  .include "font.inc"
keytab:
  .include "keys.inc"

; Where the hand-written ROM ends.
rom_end:

; BASIC last: its fixed part ends the fixed ROM (e16c_fixed_end), its banked parts follow in
; their banks.
  .include "basic.s"
