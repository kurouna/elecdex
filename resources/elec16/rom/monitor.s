; The machine-code monitor (docs/elec16.md section 6, MON). A command is a letter and hex
; numbers, upper or lower case:
;   D [addr]          dump memory, a screenful; D alone goes on from the last
;   E addr bb bb ...  write bytes into RAM or video memory
;   G addr            call machine code; it returns here with RET
;   R                 the registers at the last break or fault
;   H or ?            the commands
; BRK stops a program and comes back here; so does EBREAK, or a fault, which say where.

monitor:
  la a0, banner
  call puts
  call newline

; The prompt, after anything: a fresh stack, a fresh line.
prompt:
  li sp, STACK_TOP
  call fresh_line
  li a0, 0x2a           ; *
  call putc
  ; A line may be longer than the screen is wide: it goes on below.
  li t0, 1
  sw t0, MONWAIT(zero)
  li a0, LINEBUF
  li a1, LINE_MAX
  call readline
  sw zero, MONWAIT(zero)
  bltz a0, prompt
  call newline
  li s0, LINEBUF
  call skip_spaces
  lbu a0, 0(s0)
  beqz a0, prompt
  call upcase
  addi s0, s0, 1
  li t0, 0x44           ; D
  beq a0, t0, cmd_dump
  li t0, 0x45           ; E
  beq a0, t0, cmd_enter
  li t0, 0x47           ; G
  beq a0, t0, cmd_go
  li t0, 0x52           ; R
  beq a0, t0, cmd_regs
  li t0, 0x48           ; H
  beq a0, t0, cmd_help
  li t0, 0x3f           ; ?
  beq a0, t0, cmd_help
what:
  la a0, huh
  call puts
  j prompt

; A break or a fault, out of the trap handler. BRK at the monitor's own prompt only gives
; a fresh one; anywhere else - a program, even one waiting for a key in a ROM service - it
; says where the machine was. A SHIFT pressed before it is let go.
broken:
  li sp, STACK_TOP
  lw t0, FLAGS(zero)
  andi t0, t0, ~F_SHIFT
  sw t0, FLAGS(zero)
  call annunciate
  call fresh_line
  lw t0, CAUSE(zero)
  li t1, 0x800f         ; the BRK line
  bne t0, t1, .said
  lw t1, MONWAIT(zero)
  bnez t1, prompt
.said:
  li t1, 3              ; EBREAK
  beq t0, t1, .break
  li t1, 0x800f
  beq t0, t1, .break
  la a0, fault
  call puts
  lw a0, CAUSE(zero)
  call puthex
  j .at
.break:
  la a0, stopped
  call puts
.at:
  la a0, at
  call puts
  lw a0, REGS(zero)
  call puthex
  j prompt

; ---------------- commands ----------------

; D [addr]: a screenful of lines, eight bytes and their characters each (four on a narrow
; screen), from addr or from where the last D stopped.
cmd_dump:
  call hex_arg
  bnez a1, .from
  lw a0, DNEXT(zero)
.from:
  mv s1, a0
  lw s2, ROWS(zero)
  addi s2, s2, -1
  li s3, 8
  lw t0, COLS(zero)
  li t1, 39
  bgeu t0, t1, .line
  li s3, 4
.line:
  mv a0, s1
  call puthex
  li a0, 0x3a           ; :
  call putc
  li s0, 0
.byte:
  li a0, 0x20
  call putc
  add t0, s1, s0
  lbu a0, 0(t0)
  call puthex2
  addi s0, s0, 1
  bltu s0, s3, .byte
  li a0, 0x20
  call putc
  li s0, 0
.char:
  add t0, s1, s0
  lbu a0, 0(t0)
  addi t1, a0, -0x20
  sltiu t1, t1, 0x5f
  bnez t1, .shown
  li a0, 0x2e           ; .
.shown:
  call putc
  addi s0, s0, 1
  bltu s0, s3, .char
  call newline
  add s1, s1, s3
  addi s2, s2, -1
  bnez s2, .line
  sw s1, DNEXT(zero)
  j prompt

; E addr bb bb ...: bytes into RAM or video memory (the ROM and I/O are refused). The whole
; line is read first, so one that is wrong anywhere writes nothing.
cmd_enter:
  call hex_arg
  beqz a1, what
  mv s1, a0
  mv s3, s0
.check:
  call hex_arg
  beqz a1, .checked
  ; A byte is two hex digits at most.
  li t0, 0x100
  bgeu a0, t0, what
  j .check
.checked:
  mv s0, s3
  sw s1, DNEXT(zero)
.next:
  call hex_arg
  beqz a1, prompt
  li t0, 0x8000
  bltu s1, t0, .write
  li t0, VRAM
  bltu s1, t0, .rom
  li t0, 0xf800
  bgeu s1, t0, .rom
.write:
  sb a0, 0(s1)
  addi s1, s1, 1
  j .next
.rom:
  la a0, readonly
  call puts
  j prompt

; G addr: calls machine code, which comes back with RET.
cmd_go:
  call hex_arg
  beqz a1, what
  jalr ra, 0(a0)
  j prompt

; R: the registers kept at the last break or fault, four to a line (three on a narrow
; screen).
cmd_regs:
  li s0, 0
  li s1, 4
  lw t0, COLS(zero)
  li t1, 31
  bgeu t0, t1, .reg
  li s1, 3
.reg:
  la t0, reg_names
  slli t1, s0, 1
  add t0, t0, t1
  lbu a0, 0(t0)
  call putc
  la t0, reg_names
  slli t1, s0, 1
  add t0, t0, t1
  lbu a0, 1(t0)
  call putc
  li a0, 0x3d           ; =
  call putc
  slli t0, s0, 1
  lw a0, REGS(t0)
  call puthex
  addi s0, s0, 1
  li t0, 16
  beq s0, t0, .end
  remu t1, s0, s1
  beqz t1, .row
  li a0, 0x20
  call putc
  j .reg
.row:
  call newline
  j .reg
.end:
  call newline
  j prompt

cmd_help:
  la a0, help
  call puts
  j prompt

; ---------------- reading the line ----------------

; Steps s0 over spaces.
skip_spaces:
  lbu t0, 0(s0)
  li t1, 0x20
  bne t0, t1, .done
  addi s0, s0, 1
  j skip_spaces
.done:
  ret

; a0 in upper case, if it is a letter.
upcase:
  addi t0, a0, -0x61
  sltiu t0, t0, 26
  beqz t0, .done
  addi a0, a0, -0x20
.done:
  ret

; The hex number at s0 after any spaces: its value in a0, and in a1 how many digits it had
; (0 when there was none). s0 moves past it. A number not ended by a space or the line's
; end is no number: the command is answered with ?.
hex_arg:
  addi sp, sp, -2
  sw ra, 0(sp)
  call skip_spaces
  li a2, 0
  li a1, 0
.digit:
  lbu a0, 0(s0)
  call upcase
  addi t0, a0, -0x30
  sltiu t1, t0, 10
  bnez t1, .take
  addi t0, a0, -0x41
  sltiu t1, t0, 6
  beqz t1, .done
  addi t0, t0, 10
.take:
  slli a2, a2, 4
  or a2, a2, t0
  addi a1, a1, 1
  addi s0, s0, 1
  j .digit
.done:
  lbu t0, 0(s0)
  beqz t0, .ended
  li t1, 0x20
  bne t0, t1, what
.ended:
  mv a0, a2
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ---------------- writing numbers ----------------

; a0 as four hex digits.
puthex:
  addi sp, sp, -4
  sw ra, 2(sp)
  sw a0, 0(sp)
  srli a0, a0, 8
  call puthex2
  lw a0, 0(sp)
  call puthex2
  lw ra, 2(sp)
  addi sp, sp, 4
  ret

; The low byte of a0 as two hex digits.
puthex2:
  addi sp, sp, -4
  sw ra, 2(sp)
  sw a0, 0(sp)
  srli a0, a0, 4
  call hexdigit
  lw a0, 0(sp)
  call hexdigit
  lw ra, 2(sp)
  addi sp, sp, 4
  ret

; The low four bits of a0 as one hex digit.
hexdigit:
  andi a0, a0, 15
  li t0, 10
  bltu a0, t0, .digit
  addi a0, a0, 0x41 - 0x30 - 10
.digit:
  addi a0, a0, 0x30
  j putc

; ---------------- text ----------------

banner:
  .asciz "ELEC-16 MONITOR 0.1"
huh:
  .asciz "?\n"
fault:
  .asciz "FAULT "
stopped:
  .asciz "BREAK"
at:
  .asciz " AT "
readonly:
  .asciz "?READ ONLY\n"
help:
  .asciz "D [ADDR]  E ADDR BB..  G ADDR  R\n"
reg_names:
  .ascii "PCRASPGPA0A1A2A3T0T1T2T3S0S1S2S3"
  .align 2
