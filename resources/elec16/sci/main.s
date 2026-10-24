; The ELEC-16 SCI ROM, for SCI-128 (docs/elec16-sci.md): reset, the trap handler, the ROM
; services and, for now (S2), a start screen that names the keys pressed - the calculator
; itself comes in S3. The screen is the 128 x 64 LCD in the E000 window, drawn by sci.e16.ts
; (e16c, compiled into sci.s by npm run gen:elec16).
;
; Labels are lower case and constants upper case, as in the pocket ROM; calls follow the usual
; E16 convention (a0-a3 and t0-t3 may change, s0-s3, sp and gp are kept).

  .include "io.inc"

; The ROM's work area at the bottom of RAM (0000-00FF); e16c's globals follow it (0100-01FF).
RETPC    = 0x12     ; where an ECALL service returns to
ERA      = 0x14     ; the caller's ra while an ECALL service runs
CAUSE    = 0x16     ; mcause of the last break or fault
REGS     = 0x20     ; 16 words at the last break or fault: pc, then x1 to x15
MPIE     = 0x80     ; mstatus: interrupts on before the trap

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
  li a0, 0
  li a1, 0
  j boot

; The start screen, with what stopped the last program (a0: mcause, a1: its pc; 0 for none),
; then asleep until a key is pressed (the key line wakes it) or BRK (ON).
boot:
  li sp, STACK_TOP
  ; The ROM's handler and no interrupts, whatever a program had: one stopped by BRK or a
  ; fault left its own handler in mtvec, in RAM the next program may overwrite.
  la t0, trap
  csrw mtvec, t0
  csrci mstatus, 8
  call bootScreen
idle:
  li t0, 1 << IRQ_KEY
  csrw mie, t0
idle_sleep:
  wfi
  lw t0, IO_KEY_COUNT(zero)
  beqz t0, idle_sleep
  lw a0, IO_KEY_DATA(zero)
  call keyPressed
  j idle_sleep
idle_end:

; Where a program the pane called (CODE's RUN) comes back: what it drew stays on the screen,
; and ON brings the start screen back.
code_return:
  li sp, STACK_TOP
  j idle

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

; The font's address and the keys' names, for sci.e16.ts.
font_base:
  la a0, font
  ret

names_base:
  la a0, key_names
  ret

; ---------------- traps ----------------

; A break, a fault or an ECALL. An ECALL runs its service outside the handler, as in the
; pocket ROM; anything else keeps every register for CORE and goes to the start screen,
; saying what stopped and where - except ON at the start screen, which only draws it again.
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
  ; To the start screen with the cause and the pc - or with neither when it only slept there
  ; (ON at the start screen, or after a program came back). Where it was tells, not a flag:
  ; the pane calls a program without the ROM.
  lw a0, CAUSE(zero)
  lw a1, REGS(zero)
  la t0, idle_sleep
  bltu a1, t0, .say
  la t0, idle_end
  bgeu a1, t0, .say
  li a0, 0
  li a1, 0
.say:
  ; Out to the start screen with interrupts staying off and the ROM's own handler in mtvec:
  ; MRET would let them back on as the program had them, into its handler in RAM, before
  ; boot could put the ROM's back.
  li t0, MPIE
  csrc mstatus, t0
  la t0, trap
  csrw mtvec, t0
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
  ; As .say does.
  li t0, MPIE
  csrc mstatus, t0
  la t0, trap
  csrw mtvec, t0
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

key_names:
  .include "scikeys.inc"

; Where the hand-written ROM ends.
rom_end:

; The screen and the start screen, from e16c.
  .include "sci.s"
