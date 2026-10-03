; ASM DEMO: machine code for the ELEC-16, assembled for the code area (7000).
; From BASIC: LOAD "ASMDEMO.BIN":CALL 28672
;
; On a cleared screen, it fills the last text row with a pattern, written straight into the
; LCD's memory (a byte is a column of eight dots, bit 0 at the top), then says so through the
; ROM's services: ECALL with the service in t0 (3 CLS, 1 PUTS, 4 LOCATE). It leaves the cursor
; on the row under its words, where BASIC's prompt comes back. It keeps ra, s0 and s1 as the
; calling convention asks, and returns with RET.

  .org 0x7000
start:
  addi sp, sp, -6
  sw ra, 4(sp)
  sw s0, 2(sp)
  sw s1, 0(sp)
  ; A clear screen: nothing typed before is left beside what it draws.
  li t0, 3
  ecall
  ; The last text row's band: VRAM + (rows - 1) * width; rows are the height / 8.
  lw s0, -0xe0(zero)        ; FF20: the screen's width in dots
  lw t1, -0xde(zero)        ; FF22: its height
  srli t1, t1, 3
  addi t1, t1, -1
  mul t1, t1, s0
  li t0, 0xe000
  add s1, t0, t1
  li t2, 0
.column:
  ; A diamond a character wide, then a gap: 0x18 0x3C 0x7E 0x3C 0x18 0x00, over and over.
  li t0, 6
  remu t0, t2, t0
  la t1, pattern
  add t1, t1, t0
  lbu t1, 0(t1)
  add t0, s1, t2
  sb t1, 0(t0)
  addi t2, t2, 1
  bltu t2, s0, .column
  ; The words, at the top left.
  li a0, 0
  li a1, 0
  li t0, 4
  ecall
  la a0, words
  li t0, 1
  ecall
  ; The next row, for BASIC's prompt.
  li a0, 0
  li a1, 1
  li t0, 4
  ecall
  lw s1, 0(sp)
  lw s0, 2(sp)
  lw ra, 4(sp)
  addi sp, sp, 6
  ret

pattern:
  .byte 0x18, 0x3c, 0x7e, 0x3c, 0x18, 0x00
words:
  .asciz "DRAWN BY MACHINE CODE"
