; Made by e16c from sci/sci.e16.ts: do not edit.

; curX at 0x0100
; curY at 0x0102
; shifted at 0x0104
; alphaOn at 0x0106

e16c_init:
  ; curX = 0
  sw zero, 0x0100(zero)
  ; curY = 0
  sw zero, 0x0102(zero)
  ; shifted = 0
  sw zero, 0x0104(zero)
  ; alphaOn = 0
  sw zero, 0x0106(zero)
  ret

; sci/sci.e16.ts:54 cls() at -O1
cls:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/sci.e16.ts:55  memset(VRAM, 0, WIDTH * BANDS)
  li a0, 57344
  li a1, 0
  li a2, 1024
  mset a0, a1, a2
  ; sci/sci.e16.ts:56  curX = 0
  sw zero, 0x0100(zero)
  ; sci/sci.e16.ts:57  curY = 0
  sw zero, 0x0102(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/sci.e16.ts:60 drawChar(c, column/at, row) at -O1
;   c in s2
;   column/at in s1
;   row in s3
drawChar:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; c
  mv s1, a1 ; column/at
  mv s3, a2 ; row
  ; sci/sci.e16.ts:61  const at = VRAM + row * WIDTH + column * 6
  slli t0, s3, 7
  slli t2, s1, 2
  slli t1, s1, 1
  add t1, t1, t2
  addi t0, t0, -8192
  add s1, t0, t1
  ; sci/sci.e16.ts:62  memcpy(at, font_base() + (c - FIRST_CODE) * 5, 5)
  call font_base
  addi t0, s2, -32
  slli t1, t0, 2
  add t0, t1, t0
  add a1, a0, t0
  mv a0, s1
  li a2, 5
  mcpy a0, a1, a2
  ; sci/sci.e16.ts:63  poke(at + 5, 0)
  sb zero, 5(s1)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/sci.e16.ts:72 newline() at -O1
newline:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/sci.e16.ts:73  curX = 0
  sw zero, 0x0100(zero)
  ; sci/sci.e16.ts:74  if (curY + 1 < ROWS) {
  lw t0, 0x0102(zero)
  li t1, 8
  addi t0, t0, 1
  bgeu t0, t1, .L1
  ; sci/sci.e16.ts:75  curY++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; sci/sci.e16.ts:76  return
  j .return
.L1:
  ; sci/sci.e16.ts:78  scroll()
  ; sci/sci.e16.ts:68  memcpy(VRAM, VRAM + WIDTH, WIDTH * (BANDS - 1))
  li a0, 57344
  li a1, 57472
  li a2, 896
  mcpy a0, a1, a2
  ; sci/sci.e16.ts:69  memset(VRAM + WIDTH * (BANDS - 1), 0, WIDTH)
  li a0, 58240
  li a1, 0
  li a2, 128
  mset a0, a1, a2
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/sci.e16.ts:81 putc(c) at -O1
;   c in s1
putc:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; sci/sci.e16.ts:82  if (c === CH_CR) {
  li t0, 13
  bne s1, t0, .L1
  ; sci/sci.e16.ts:83  newline()
  call newline
  ; sci/sci.e16.ts:84  return
  j .return
.L1:
  ; sci/sci.e16.ts:86  if (c === CH_CLS) {
  li t0, 12
  bne s1, t0, .L2
  ; sci/sci.e16.ts:87  cls()
  call cls
  ; sci/sci.e16.ts:88  return
  j .return
.L2:
  ; sci/sci.e16.ts:90  if (c === CH_BS) {
  li t0, 8
  bne s1, t0, .L3
  ; sci/sci.e16.ts:91  if (curX > 0) curX--
  lw t0, 0x0100(zero)
  bgeu zero, t0, .L4
  ; sci/sci.e16.ts:91  curX--
  lw t0, 0x0100(zero)
  addi t0, t0, -1
  sw t0, 0x0100(zero)
.L4:
  ; sci/sci.e16.ts:92  return
  j .return
.L3:
  ; sci/sci.e16.ts:94  if (c < FIRST_CODE) return
  li t0, 32
  bgeu s1, t0, .L5
  ; sci/sci.e16.ts:94  return
  j .return
.L5:
  ; sci/sci.e16.ts:95  drawChar(c, curX, curY)
  lw a1, 0x0100(zero)
  lw a2, 0x0102(zero)
  mv a0, s1
  call drawChar
  ; sci/sci.e16.ts:96  curX++
  lw t0, 0x0100(zero)
  addi t0, t0, 1
  sw t0, 0x0100(zero)
  ; sci/sci.e16.ts:97  if (curX >= COLS) newline()
  li t1, 21
  bltu t0, t1, .L6
  ; sci/sci.e16.ts:97  newline()
  call newline
.L6:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/sci.e16.ts:100 puts(at/p) at -O1
;   at/p in s1
puts:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at/p
  ; sci/sci.e16.ts:101  let p = at
  ; sci/sci.e16.ts:102  while (peek(p) !== 0) {
  j .L3
.L1:
  ; sci/sci.e16.ts:103  putc(peek(p))
  lbu a0, 0(s1)
  call putc
  ; sci/sci.e16.ts:104  p++
  addi s1, s1, 1
.L3:
  lbu t0, 0(s1)
  bne t0, zero, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/sci.e16.ts:108 locate(column, row) at -O1
;   column in a0
;   row in a1
locate:
  ; sci/sci.e16.ts:109  curX = column < COLS ? column : COLS - 1
  li t0, 21
  bgeu a0, t0, .L1
  mv t0, a0
  j .L2
.L1:
  li t0, 20
.L2:
  sw t0, 0x0100(zero)
  ; sci/sci.e16.ts:110  curY = row < ROWS ? row : ROWS - 1
  li t0, 8
  bgeu a1, t0, .L3
  mv t0, a1
  j .L4
.L3:
  li t0, 7
.L4:
  sw t0, 0x0102(zero)
.return:
  ret

; sci/sci.e16.ts:113 puthex(v) at -O1
;   v in s3
;   s in s1
;   d in s2
puthex:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; v
  ; sci/sci.e16.ts:114  for (let s: u16 = 0; s < 4; s++) {
  li s1, 0 ; s
  j .L3
.L1:
  ; sci/sci.e16.ts:115  const d = (v >> (12 - s * 4)) & 15
  slli t0, s1, 2
  li t1, 12
  sub t1, t1, t0
  srl t1, s3, t1
  andi s2, t1, 15
  ; sci/sci.e16.ts:116  putc(d < 10 ? 0x30 + d : 0x37 + d)
  li t0, 10
  bgeu s2, t0, .L5
  addi t0, s2, 48
  j .L6
.L5:
  addi t0, s2, 55
.L6:
  mv a0, t0
  call putc
  addi s1, s1, 1
.L3:
  li t0, 4
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/sci.e16.ts:121 clearRow(row) at -O1
;   row in s1
clearRow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; row
  ; sci/sci.e16.ts:122  memset(VRAM + row * WIDTH, 0, WIDTH)
  slli t0, s1, 7
  addi a0, t0, -8192
  li a1, 0
  li a2, 128
  mset a0, a1, a2
  ; sci/sci.e16.ts:123  locate(0, row)
  li a0, 0
  mv a1, s1
  call locate
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/sci.e16.ts:127 centre(row, at, length) at -O1
;   row in s1
;   at in s2
;   length in s3
centre:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; row
  mv s2, a1 ; at
  mv s3, a2 ; length
  ; sci/sci.e16.ts:128  locate((COLS - length) >> 1, row)
  li t0, 21
  sub t0, t0, s3
  srli a0, t0, 1
  mv a1, s1
  call locate
  ; sci/sci.e16.ts:129  puts(at)
  mv a0, s2
  call puts
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/sci.e16.ts:133 marks() at -O1
;   bits in a0
marks:
  ; sci/sci.e16.ts:134  let bits: u16 = ANN_D
  li a0, 128 ; bits
  ; sci/sci.e16.ts:135  if (shifted !== 0) bits |= ANN_S
  lw t0, 0x0104(zero)
  beq t0, zero, .L1
  ; sci/sci.e16.ts:135  bits |= ANN_S
  ori a0, a0, 2
.L1:
  ; sci/sci.e16.ts:136  if (alphaOn !== 0) bits |= ANN_A
  lw t0, 0x0106(zero)
  beq t0, zero, .L2
  ; sci/sci.e16.ts:136  bits |= ANN_A
  ori a0, a0, 4
.L2:
  ; sci/sci.e16.ts:137  poke16(IO_ANNUNCIATORS, bits)
  li t0, 65326
  sw a0, 0(t0)
.return:
  ret

; sci/sci.e16.ts:142 bootScreen(cause, pc) at -O1
;   cause in s1
;   pc in s2
bootScreen:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; cause
  mv s2, a1 ; pc
  ; sci/sci.e16.ts:143  cls()
  call cls
  ; sci/sci.e16.ts:144  shifted = 0
  sw zero, 0x0104(zero)
  ; sci/sci.e16.ts:145  alphaOn = 0
  sw zero, 0x0106(zero)
  ; sci/sci.e16.ts:146  marks()
  call marks
  ; sci/sci.e16.ts:147  centre(1, str('ELEC-16 SCI'), 11)
  li a0, 1
  la a1, str_0
  li a2, 11
  call centre
  ; sci/sci.e16.ts:148  centre(2, str('SCI-128'), 7)
  li a0, 2
  la a1, str_1
  li a2, 7
  call centre
  ; sci/sci.e16.ts:149  centre(4, str('PRESS A KEY'), 11)
  li a0, 4
  la a1, str_2
  li a2, 11
  call centre
  ; sci/sci.e16.ts:150  if (cause === 0) return
  bne s1, zero, .L1
  ; sci/sci.e16.ts:150  return
  j .return
.L1:
  ; sci/sci.e16.ts:151  locate(0, ROWS - 1)
  li a0, 0
  li a1, 7
  call locate
  ; sci/sci.e16.ts:153  if (cause === 0x800f || cause === 3) {
  li t0, 32783
  beq s1, t0, .L3
  li t0, 3
  bne s1, t0, .L2
.L3:
  ; sci/sci.e16.ts:154  puts(str('BREAK AT '))
  la a0, str_3
  call puts
  j .L4
.L2:
  ; sci/sci.e16.ts:156  puts(str('FAULT '))
  la a0, str_4
  call puts
  ; sci/sci.e16.ts:157  puthex(cause)
  mv a0, s1
  call puthex
  ; sci/sci.e16.ts:158  puts(str(' AT '))
  la a0, str_5
  call puts
.L4:
  ; sci/sci.e16.ts:160  puthex(pc)
  mv a0, s2
  call puthex
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/sci.e16.ts:167 keyPressed(code) at -O1
;   code in s1
;   name in s0
;   i in s2
;   c in s3
keyPressed:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s1, a0 ; code
  ; sci/sci.e16.ts:168  if (code === KEY_SHIFT) {
  li t0, 6
  bne s1, t0, .L1
  ; sci/sci.e16.ts:169  shifted = shifted !== 0 ? 0 : 1
  lw t0, 0x0104(zero)
  beq t0, zero, .L2
  li t0, 0
  j .L3
.L2:
  li t0, 1
.L3:
  sw t0, 0x0104(zero)
  ; sci/sci.e16.ts:170  alphaOn = 0
  sw zero, 0x0106(zero)
  ; sci/sci.e16.ts:171  marks()
  call marks
  ; sci/sci.e16.ts:172  return
  j .return
.L1:
  ; sci/sci.e16.ts:174  if (code === KEY_ALPHA) {
  li t0, 7
  bne s1, t0, .L4
  ; sci/sci.e16.ts:175  alphaOn = alphaOn !== 0 ? 0 : 1
  lw t0, 0x0106(zero)
  beq t0, zero, .L5
  li t0, 0
  j .L6
.L5:
  li t0, 1
.L6:
  sw t0, 0x0106(zero)
  ; sci/sci.e16.ts:176  shifted = 0
  sw zero, 0x0104(zero)
  ; sci/sci.e16.ts:177  marks()
  call marks
  ; sci/sci.e16.ts:178  return
  j .return
.L4:
  ; sci/sci.e16.ts:180  clearRow(5)
  li a0, 5
  call clearRow
  ; sci/sci.e16.ts:181  puts(str('KEY '))
  la a0, str_6
  call puts
  ; sci/sci.e16.ts:182  if (shifted !== 0) puts(str('S '))
  lw t0, 0x0104(zero)
  beq t0, zero, .L7
  ; sci/sci.e16.ts:182  puts(str('S '))
  la a0, str_7
  call puts
.L7:
  ; sci/sci.e16.ts:183  if (alphaOn !== 0) puts(str('A '))
  lw t0, 0x0106(zero)
  beq t0, zero, .L8
  ; sci/sci.e16.ts:183  puts(str('A '))
  la a0, str_8
  call puts
.L8:
  ; sci/sci.e16.ts:184  const name = names_base() + code * NAME_LENGTH
  call names_base
  slli t1, s1, 2
  slli t0, s1, 1
  add t0, t0, t1
  add s0, a0, t0
  ; sci/sci.e16.ts:185  for (let i: u16 = 0; i < NAME_LENGTH; i++) {
  li s2, 0 ; i
  j .L11
.L9:
  ; sci/sci.e16.ts:186  const c = peek(name + i)
  add t0, s0, s2
  lbu s3, 0(t0)
  ; sci/sci.e16.ts:187  if (c === 0) break
  bne s3, zero, .L13
  ; sci/sci.e16.ts:187  break
  j .L12
.L13:
  ; sci/sci.e16.ts:188  putc(c)
  mv a0, s3
  call putc
  addi s2, s2, 1
.L11:
  li t0, 6
  bltu s2, t0, .L9
.L12:
  ; sci/sci.e16.ts:190  putc(0x20)
  li a0, 32
  call putc
  ; sci/sci.e16.ts:191  puthex(code)
  mv a0, s1
  call puthex
  ; sci/sci.e16.ts:192  shifted = 0
  sw zero, 0x0104(zero)
  ; sci/sci.e16.ts:193  alphaOn = 0
  sw zero, 0x0106(zero)
  ; sci/sci.e16.ts:194  marks()
  call marks
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

str_0:
  .byte 69, 76, 69, 67, 45, 49, 54, 32, 83, 67, 73, 0
str_1:
  .byte 83, 67, 73, 45, 49, 50, 56, 0
str_2:
  .byte 80, 82, 69, 83, 83, 32, 65, 32, 75, 69, 89, 0
str_3:
  .byte 66, 82, 69, 65, 75, 32, 65, 84, 32, 0
str_4:
  .byte 70, 65, 85, 76, 84, 32, 0
str_5:
  .byte 32, 65, 84, 32, 0
str_6:
  .byte 75, 69, 89, 32, 0
str_7:
  .byte 83, 32, 0
str_8:
  .byte 65, 32, 0
  .align 2
e16c_fixed_end:
