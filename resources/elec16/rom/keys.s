; The keyboard: keys from the FIFO turned into characters through the key table (keys.inc,
; two bytes a key code: its character, and with SHIFT). SHIFT is a key that holds for the
; next one; CAPS stays until pressed again. A letter is upper case when CAPS or SHIFT is on
; but not both; with SHIFT, a key with a symbol on its face gives the symbol.

; Waits for a key and gives its character in a0. SHIFT and CAPS are taken here.
getkey:
  addi sp, sp, -2
  sw ra, 0(sp)
.wait:
  lw t0, BRKFLAG(zero)
  bnez t0, .brk
  lw t0, IO_KEY_COUNT(zero)
  bnez t0, .read
  wfi
  j .wait
.brk:
  ; BRK while BASIC waited: taken here, given as a key.
  sw zero, BRKFLAG(zero)
  li a0, K_BRK
  lw ra, 0(sp)
  addi sp, sp, 2
  ret
.read:
  lw t0, IO_KEY_DATA(zero)
  li t1, KEY_CODES
  bgeu t0, t1, .wait
  slli t0, t0, 1
  la t1, keytab
  add t0, t0, t1
  lbu a0, 0(t0)
  beqz a0, .wait
  lbu a1, 1(t0)
  lw t2, FLAGS(zero)
  li t1, K_SHIFT
  beq a0, t1, .shift
  li t1, K_CAPS
  beq a0, t1, .caps
  andi t3, t2, F_SHIFT
  beqz t3, .letter
  beqz a1, .letter
  mv a0, a1
.letter:
  ; a to z: upper case when exactly one of CAPS and SHIFT is on.
  addi t1, a0, -0x61
  sltiu t1, t1, 26
  beqz t1, .plain
  srli t3, t2, 1
  xor t3, t3, t2
  andi t3, t3, 1
  beqz t3, .plain
  addi a0, a0, -0x20
.plain:
  andi t2, t2, ~F_SHIFT
  sw t2, FLAGS(zero)
  call annunciate
  lw ra, 0(sp)
  addi sp, sp, 2
  ret
.shift:
  xori t2, t2, F_SHIFT
  j .flags
.caps:
  xori t2, t2, F_CAPS
.flags:
  sw t2, FLAGS(zero)
  call annunciate
  j .wait

; Shows SHIFT and CAPS above the dots, with MON.
annunciate:
  lw t0, FLAGS(zero)
  lw t1, ANNMODE(zero)
  andi t2, t0, F_SHIFT
  beqz t2, .caps
  ori t1, t1, ANN_SHIFT
.caps:
  andi t2, t0, F_CAPS
  beqz t2, .show
  ori t1, t1, ANN_CAPS
.show:
  sw t1, IO_ANNUNCIATORS(zero)
  ret

; Reads a line into the buffer at a0, at most a1 characters, echoing it; BS rubs out.
; Gives the length in a0, the text ended by a zero; -1 when CLS was pressed (the screen is
; cleared and the line given up), -2 when BRK was (in BASIC), -3 when MODE was (the line
; given up, the screen left as it is).
readline:
  addi sp, sp, -8
  sw ra, 6(sp)
  sw s0, 4(sp)
  sw s1, 2(sp)
  sw s2, 0(sp)
  mv s0, a0
  mv s1, a1
  li s2, 0
  li t0, 6              ; a blinking block
  sw t0, IO_CURSOR_MODE(zero)
.loop:
  call getkey
  li t0, K_ENTER
  beq a0, t0, .done
  li t0, K_BS
  beq a0, t0, .back
  li t0, K_CLS
  beq a0, t0, .clear
  li t0, K_BRK
  beq a0, t0, .stop
  li t0, K_MODE
  beq a0, t0, .mode
  li t0, 0x20
  bltu a0, t0, .loop
  bgeu s2, s1, .loop
  add t0, s0, s2
  sb a0, 0(t0)
  addi s2, s2, 1
  call putc
  j .loop
.back:
  beqz s2, .loop
  addi s2, s2, -1
  call back
  j .loop
.clear:
  call cls
  li s2, -1
  j .done
.mode:
  li s2, -3
  j .done
.stop:
  ; BRK: the line is given up, the screen left as it is.
  li s2, -2
.done:
  sw zero, IO_CURSOR_MODE(zero)
  bltz s2, .out
  add t0, s0, s2
  sb zero, 0(t0)
.out:
  mv a0, s2
  lw s2, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw ra, 6(sp)
  addi sp, sp, 8
  ret
