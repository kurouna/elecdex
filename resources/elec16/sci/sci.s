; Made by e16c from sci/lcd.e16.ts, sci/tokens.e16.ts, sci/numbers.e16.ts, sci/calc.e16.ts, sci/eval.e16.ts, sci/screens.e16.ts: do not edit.

; curX at 0x0100
; curY at 0x0102
; errCode at 0x0104
; errAt at 0x0106
; nsp at 0x01c8
; screen at 0x01ca
; length at 0x0294
; cursor at 0x0296
; answered at 0x0298
; shifted at 0x029a
; alphaOn at 0x029c
; storing at 0x029e
; recalling at 0x02a0
; historyAt at 0x02a2
; scrollFrom at 0x02a4
; lineAt at 0x02be
; lineLength at 0x02c0
; pos at 0x02c2
nums = 0x0108 ; 192 bytes
line = 0x01cc ; 200 bytes
answerText = 0x02a6 ; 24 bytes
numberText = 0x02c4 ; 32 bytes
hexText = 0x02e4 ; 6 bytes

e16c_init:
  ; curX = 0
  sw zero, 0x0100(zero)
  ; curY = 0
  sw zero, 0x0102(zero)
  ; errCode = 0
  sw zero, 0x0104(zero)
  ; errAt = 0
  sw zero, 0x0106(zero)
  ; nsp = 0
  sw zero, 0x01c8(zero)
  ; screen = 0
  sw zero, 0x01ca(zero)
  ; length = 0
  sw zero, 0x0294(zero)
  ; cursor = 0
  sw zero, 0x0296(zero)
  ; answered = 0
  sw zero, 0x0298(zero)
  ; shifted = 0
  sw zero, 0x029a(zero)
  ; alphaOn = 0
  sw zero, 0x029c(zero)
  ; storing = 0
  sw zero, 0x029e(zero)
  ; recalling = 0
  sw zero, 0x02a0(zero)
  ; historyAt = 65535
  li t0, 65535
  sw t0, 0x02a2(zero)
  ; scrollFrom = 0
  sw zero, 0x02a4(zero)
  ; lineAt = 0
  sw zero, 0x02be(zero)
  ; lineLength = 0
  sw zero, 0x02c0(zero)
  ; pos = 0
  sw zero, 0x02c2(zero)
  ; nums: 192 bytes of 0
  li t0, 0x0108
  li t1, 192
  mset t0, zero, t1
  ; line: 200 bytes of 0
  li t0, 0x01cc
  li t1, 200
  mset t0, zero, t1
  ; answerText: 24 bytes of 0
  li t0, 0x02a6
  li t1, 24
  mset t0, zero, t1
  ; numberText, hexText: 38 bytes of 0
  li t0, 0x02c4
  li t1, 38
  mset t0, zero, t1
  ret

; sci/lcd.e16.ts:51 cls() at -O1
cls:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/lcd.e16.ts:52  memset(VRAM, 0, WIDTH * BANDS)
  li a0, 57344
  li a1, 0
  li a2, 1024
  mset a0, a1, a2
  ; sci/lcd.e16.ts:53  curX = 0
  sw zero, 0x0100(zero)
  ; sci/lcd.e16.ts:54  curY = 0
  sw zero, 0x0102(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/lcd.e16.ts:58 drawChar(c, column/at, row) at -O1
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
  ; sci/lcd.e16.ts:59  const at = VRAM + row * WIDTH + column * 6
  slli t0, s3, 7
  slli t2, s1, 2
  slli t1, s1, 1
  add t1, t1, t2
  addi t0, t0, -8192
  add s1, t0, t1
  ; sci/lcd.e16.ts:60  memcpy(at, font_base() + (c - FIRST_CODE) * 5, 5)
  call font_base
  addi t0, s2, -32
  slli t1, t0, 2
  add t0, t1, t0
  add a1, a0, t0
  mv a0, s1
  li a2, 5
  mcpy a0, a1, a2
  ; sci/lcd.e16.ts:61  poke(at + 5, 0)
  sb zero, 5(s1)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/lcd.e16.ts:70 newline() at -O1
newline:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/lcd.e16.ts:71  curX = 0
  sw zero, 0x0100(zero)
  ; sci/lcd.e16.ts:72  if (curY + 1 < ROWS) {
  lw t0, 0x0102(zero)
  li t1, 8
  addi t0, t0, 1
  bgeu t0, t1, .L1
  ; sci/lcd.e16.ts:73  curY++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; sci/lcd.e16.ts:74  return
  j .return
.L1:
  ; sci/lcd.e16.ts:76  scroll()
  ; sci/lcd.e16.ts:66  memcpy(VRAM, VRAM + WIDTH, WIDTH * (BANDS - 1))
  li a0, 57344
  li a1, 57472
  li a2, 896
  mcpy a0, a1, a2
  ; sci/lcd.e16.ts:67  memset(VRAM + WIDTH * (BANDS - 1), 0, WIDTH)
  li a0, 58240
  li a1, 0
  li a2, 128
  mset a0, a1, a2
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/lcd.e16.ts:79 putc(c) at -O1
;   c in s1
putc:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; sci/lcd.e16.ts:80  if (c === CH_CR) {
  li t0, 13
  bne s1, t0, .L1
  ; sci/lcd.e16.ts:81  newline()
  call newline
  ; sci/lcd.e16.ts:82  return
  j .return
.L1:
  ; sci/lcd.e16.ts:84  if (c === CH_CLS) {
  li t0, 12
  bne s1, t0, .L2
  ; sci/lcd.e16.ts:85  cls()
  call cls
  ; sci/lcd.e16.ts:86  return
  j .return
.L2:
  ; sci/lcd.e16.ts:88  if (c === CH_BS) {
  li t0, 8
  bne s1, t0, .L3
  ; sci/lcd.e16.ts:89  if (curX > 0) curX--
  lw t0, 0x0100(zero)
  bgeu zero, t0, .L4
  ; sci/lcd.e16.ts:89  curX--
  lw t0, 0x0100(zero)
  addi t0, t0, -1
  sw t0, 0x0100(zero)
.L4:
  ; sci/lcd.e16.ts:90  return
  j .return
.L3:
  ; sci/lcd.e16.ts:92  if (c < FIRST_CODE) return
  li t0, 32
  bgeu s1, t0, .L5
  ; sci/lcd.e16.ts:92  return
  j .return
.L5:
  ; sci/lcd.e16.ts:93  drawChar(c, curX, curY)
  lw a1, 0x0100(zero)
  lw a2, 0x0102(zero)
  mv a0, s1
  call drawChar
  ; sci/lcd.e16.ts:94  curX++
  lw t0, 0x0100(zero)
  addi t0, t0, 1
  sw t0, 0x0100(zero)
  ; sci/lcd.e16.ts:95  if (curX >= COLS) newline()
  li t1, 21
  bltu t0, t1, .L6
  ; sci/lcd.e16.ts:95  newline()
  call newline
.L6:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/lcd.e16.ts:98 puts(at/p) at -O1
;   at/p in s1
puts:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at/p
  ; sci/lcd.e16.ts:99  let p = at
  ; sci/lcd.e16.ts:100  while (peek(p) !== 0) {
  j .L3
.L1:
  ; sci/lcd.e16.ts:101  putc(peek(p))
  lbu a0, 0(s1)
  call putc
  ; sci/lcd.e16.ts:102  p++
  addi s1, s1, 1
.L3:
  lbu t0, 0(s1)
  bne t0, zero, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/lcd.e16.ts:106 locate(column, row) at -O1
;   column in a0
;   row in a1
locate:
  ; sci/lcd.e16.ts:107  curX = column < COLS ? column : COLS - 1
  li t0, 21
  bgeu a0, t0, .L1
  mv t0, a0
  j .L2
.L1:
  li t0, 20
.L2:
  sw t0, 0x0100(zero)
  ; sci/lcd.e16.ts:108  curY = row < ROWS ? row : ROWS - 1
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

; sci/lcd.e16.ts:111 puthex(v) at -O1
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
  ; sci/lcd.e16.ts:112  for (let s: u16 = 0; s < 4; s++) {
  li s1, 0 ; s
  j .L3
.L1:
  ; sci/lcd.e16.ts:113  const d = (v >> (12 - s * 4)) & 15
  slli t0, s1, 2
  li t1, 12
  sub t1, t1, t0
  srl t1, s3, t1
  andi s2, t1, 15
  ; sci/lcd.e16.ts:114  putc(d < 10 ? 0x30 + d : 0x37 + d)
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

; sci/lcd.e16.ts:119 putDecimal(v) at -O1
;   v in s1
putDecimal:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/lcd.e16.ts:120  if (v >= 10) putDecimal(div(v, 10))
  li t0, 10
  bltu s1, t0, .L1
  ; sci/lcd.e16.ts:120  putDecimal(div(v, 10))
  li t1, 52429
  mulhu t0, s1, t1
  srli a0, t0, 3
  call putDecimal
.L1:
  ; sci/lcd.e16.ts:121  putc(0x30 + (v % 10))
  li t1, 52429
  mulhu t0, s1, t1
  srli t0, t0, 3
  li t1, 10
  mul t0, t0, t1
  sub t0, s1, t0
  addi a0, t0, 48
  call putc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/lcd.e16.ts:125 clearBand(band) at -O1
;   band in s1
clearBand:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; band
  ; sci/lcd.e16.ts:126  memset(VRAM + band * WIDTH, 0, WIDTH)
  slli t0, s1, 7
  addi a0, t0, -8192
  li a1, 0
  li a2, 128
  mset a0, a1, a2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/lcd.e16.ts:130 invert(band, x0/x, x1) at -O1
;   band in a0
;   x0/x in a1
;   x1 in a2
;   at in a3
invert:
  ; sci/lcd.e16.ts:131  for (let x = x0; x <= x1 && x < WIDTH; x++) {
  j .L3
.L1:
  ; sci/lcd.e16.ts:132  const at = VRAM + band * WIDTH + x
  slli t0, a0, 7
  addi t0, t0, -8192
  add a3, t0, a1
  ; sci/lcd.e16.ts:133  poke(at, peek(at) ^ 0xff)
  lbu t0, 0(a3)
  xori t0, t0, 255
  sb t0, 0(a3)
  addi a1, a1, 1
.L3:
  bltu a2, a1, .L5
  li t0, 128
  bltu a1, t0, .L1
.L5:
.return:
  ret

; sci/lcd.e16.ts:138 centre(row, at, length) at -O1
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
  ; sci/lcd.e16.ts:139  locate((COLS - length) >> 1, row)
  li t0, 21
  sub t0, t0, s3
  srli a0, t0, 1
  mv a1, s1
  call locate
  ; sci/lcd.e16.ts:140  puts(at)
  mv a0, s2
  call puts
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/lcd.e16.ts:144 title(at) at -O1
;   at in s1
title:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; sci/lcd.e16.ts:145  clearBand(0)
  li a0, 0
  call clearBand
  ; sci/lcd.e16.ts:146  locate(0, 0)
  li a0, 0
  li a1, 0
  call locate
  ; sci/lcd.e16.ts:147  puts(at)
  mv a0, s1
  call puts
  ; sci/lcd.e16.ts:148  invert(0, 0, WIDTH - 1)
  li a0, 0
  li a1, 0
  li a2, 127
  call invert
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/lcd.e16.ts:154 barAt(column/x, row) at -O1
;   column/x in a0
;   row in a1
barAt:
  ; sci/lcd.e16.ts:155  const x = column === 0 ? 0 : column * 6 - 1
  bne a0, zero, .L1
  li t0, 0
  j .L2
.L1:
  slli t1, a0, 2
  slli t0, a0, 1
  add t0, t0, t1
  addi t0, t0, -1
.L2:
  mv a0, t0 ; column/x
  ; sci/lcd.e16.ts:156  poke16(IO_CURSOR, row * 8 * 256 + x)
  slli t0, a1, 3
  slli t0, t0, 8
  add t0, t0, a0
  li t1, 65322
  sw t0, 0(t1)
  ; sci/lcd.e16.ts:157  poke16(IO_CURMODE, BAR_8)
  li t0, 71
  li t1, 65324
  sw t0, 0(t1)
.return:
  ret

; sci/lcd.e16.ts:160 noCursor() at -O1
noCursor:
  ; sci/lcd.e16.ts:161  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
.return:
  ret

; sci/lcd.e16.ts:164 marks(bits) at -O1
;   bits in a0
marks:
  ; sci/lcd.e16.ts:165  poke16(IO_ANNUNCIATORS, bits)
  li t0, 65326
  sw a0, 0(t0)
.return:
  ret

; sci/lcd.e16.ts:171 bigGlyph(index/glyph, x) at -O1
;   index/glyph in s2
;   x in s3
;   c in s1
;   word in s0
bigGlyph:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  sw s0, 8(sp)
  mv s2, a0 ; index/glyph
  mv s3, a1 ; x
  ; sci/lcd.e16.ts:172  const glyph = big_base() + index * BIG_WIDTH * 2
  call big_base
  slli t1, s2, 3
  sub t0, t1, s2
  slli t0, t0, 1
  add s2, a0, t0
  ; sci/lcd.e16.ts:173  for (let c: u16 = 0; c < BIG_WIDTH; c++) {
  li s1, 0 ; c
  j .L3
.L1:
  ; sci/lcd.e16.ts:174  const word = peek16(glyph + c * 2)
  slli t0, s1, 1
  add t0, s2, t0
  lw s0, 0(t0)
  ; sci/lcd.e16.ts:175  poke(VRAM + BIG_BAND * WIDTH + x + c, word & 0xff)
  addi t0, s3, -7424
  add t0, t0, s1
  andi t1, s0, 255
  sb t1, 0(t0)
  ; sci/lcd.e16.ts:176  poke(VRAM + (BIG_BAND + 1) * WIDTH + x + c, word >> 8)
  addi t0, s3, -7296
  add t0, t0, s1
  srli t1, s0, 8
  sb t1, 0(t0)
  addi s1, s1, 1
.L3:
  li t0, 7
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/lcd.e16.ts:191 bigNumber(at, length/i, right/x) at -O1
;   at in s0
;   length/i in s3
;   right/x in s1
;   c/bigPoint.at in s2
bigNumber:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  mv s0, a0 ; at
  mv s3, a1 ; length/i
  mv s1, a2 ; right/x
  ; sci/lcd.e16.ts:192  let x = right + 1
  addi s1, s1, 1
  ; sci/lcd.e16.ts:193  let i = length
  ; sci/lcd.e16.ts:194  while (i > 0) {
  j .L3
.L1:
  ; sci/lcd.e16.ts:195  i--
  addi s3, s3, -1
  ; sci/lcd.e16.ts:196  const c = peek(at + i)
  add t0, s0, s3
  lbu s2, 0(t0)
  ; sci/lcd.e16.ts:197  if (c === 0x2e) {
  li t0, 46
  bne s2, t0, .L5
  ; sci/lcd.e16.ts:198  x -= 3
  addi s1, s1, -3
  ; sci/lcd.e16.ts:199  bigPoint(x)
  ; sci/lcd.e16.ts:182  const at = VRAM + (BIG_BAND + 1) * WIDTH + x
  addi s2, s1, -7296
  ; sci/lcd.e16.ts:183  poke(at, peek(at) | 0x30)
  lbu t0, 0(s2)
  ori t0, t0, 48
  sb t0, 0(s2)
  ; sci/lcd.e16.ts:184  poke(at + 1, peek(at + 1) | 0x30)
  lbu t0, 1(s2)
  ori t0, t0, 48
  sb t0, 1(s2)
  j .L6
.L5:
  ; sci/lcd.e16.ts:201  x -= BIG_PITCH
  addi s1, s1, -8
  ; sci/lcd.e16.ts:202  bigGlyph(c === 0x2d ? 10 : c - 0x30, x)
  li t0, 45
  bne s2, t0, .L7
  li t0, 10
  j .L8
.L7:
  addi t0, s2, -48
.L8:
  mv a0, t0
  mv a1, s1
  call bigGlyph
.L6:
.L3:
  bltu zero, s3, .L1
  ; sci/lcd.e16.ts:205  return x
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/lcd.e16.ts:211 glyphAt(c/src, x, y/shift) at -O1
;   c/src in 0(sp)
;   x in 2(sp)
;   y/shift in s2
;   band in s0
;   k in s1
;   col in 4(sp)
;   at/below in s3
glyphAt:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s0, 10(sp)
  sw s1, 12(sp)
  sw s3, 14(sp)
  sw a0, 0(sp) ; c/src
  sw a1, 2(sp) ; x
  mv s2, a2 ; y/shift
  ; sci/lcd.e16.ts:212  const src = font_base() + (c - FIRST_CODE) * 5
  call font_base
  lw t0, 0(sp) ; c/src
  addi t0, t0, -32
  slli t1, t0, 2
  add t0, t1, t0
  add t0, a0, t0
  sw t0, 0(sp) ; c/src
  ; sci/lcd.e16.ts:213  const band = y >> 3
  srli s0, s2, 3
  ; sci/lcd.e16.ts:214  const shift = y & 7
  andi s2, s2, 7
  ; sci/lcd.e16.ts:215  for (let k: u16 = 0; k < 5; k++) {
  li s1, 0 ; k
  j .L3
.L1:
  ; sci/lcd.e16.ts:216  const col = peek(src + k) << shift
  lw t0, 0(sp) ; c/src
  add t0, t0, s1
  lbu t0, 0(t0)
  sll t0, t0, s2
  sw t0, 4(sp) ; col
  ; sci/lcd.e16.ts:217  if (x + k >= WIDTH) return
  lw t0, 2(sp) ; x
  add t0, t0, s1
  li t1, 128
  bltu t0, t1, .L5
  ; sci/lcd.e16.ts:217  return
  j .return
.L5:
  ; sci/lcd.e16.ts:218  if (band < BANDS) {
  li t0, 8
  bgeu s0, t0, .L6
  ; sci/lcd.e16.ts:219  const at = VRAM + band * WIDTH + x + k
  slli t0, s0, 7
  lw t1, 2(sp) ; x
  addi t0, t0, -8192
  add t0, t0, t1
  add s3, t0, s1
  ; sci/lcd.e16.ts:220  poke(at, peek(at) | (col & 0xff))
  lbu t0, 0(s3)
  lw t1, 4(sp) ; col
  andi t1, t1, 255
  or t0, t0, t1
  sb t0, 0(s3)
.L6:
  ; sci/lcd.e16.ts:222  if (shift !== 0 && band + 1 < BANDS) {
  beq s2, zero, .L7
  li t0, 8
  addi t1, s0, 1
  bgeu t1, t0, .L7
  ; sci/lcd.e16.ts:223  const below = VRAM + (band + 1) * WIDTH + x + k
  addi t0, s0, 1
  slli t0, t0, 7
  lw t1, 2(sp) ; x
  addi t0, t0, -8192
  add t0, t0, t1
  add s3, t0, s1
  ; sci/lcd.e16.ts:224  poke(below, peek(below) | (col >> 8))
  lbu t0, 0(s3)
  lw t1, 4(sp) ; col
  srli t1, t1, 8
  or t0, t0, t1
  sb t0, 0(s3)
.L7:
  addi s1, s1, 1
.L3:
  li t0, 5
  bltu s1, t0, .L1
.return:
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s0, 10(sp)
  lw s1, 12(sp)
  lw s3, 14(sp)
  addi sp, sp, 16
  ret

; sci/lcd.e16.ts:230 textAt(at/p, x/left, y) at -O1
;   at/p in s1
;   x/left in s2
;   y in s3
textAt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; at/p
  mv s2, a1 ; x/left
  mv s3, a2 ; y
  ; sci/lcd.e16.ts:231  let p = at
  ; sci/lcd.e16.ts:232  let left = x
  ; sci/lcd.e16.ts:233  while (peek(p) !== 0) {
  j .L3
.L1:
  ; sci/lcd.e16.ts:234  glyphAt(peek(p), left, y)
  lbu a0, 0(s1)
  mv a1, s2
  mv a2, s3
  call glyphAt
  ; sci/lcd.e16.ts:235  left += 6
  addi s2, s2, 6
  ; sci/lcd.e16.ts:236  p++
  addi s1, s1, 1
.L3:
  lbu t0, 0(s1)
  bne t0, zero, .L1
  ; sci/lcd.e16.ts:238  return left
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/lcd.e16.ts:242 textRight(at, y) at -O1
;   at in s2
;   y in s3
;   n in s1
textRight:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; at
  mv s3, a1 ; y
  ; sci/lcd.e16.ts:243  let n: u16 = 0
  li s1, 0 ; n
  ; sci/lcd.e16.ts:244  while (peek(at + n) !== 0) n++
  j .L3
.L1:
  ; sci/lcd.e16.ts:244  n++
  addi s1, s1, 1
.L3:
  add t0, s2, s1
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; sci/lcd.e16.ts:245  textAt(at, WIDTH + 1 - n * 6, y)
  slli t1, s1, 2
  slli t0, s1, 1
  add t0, t0, t1
  li t1, 129
  sub a1, t1, t0
  mv a0, s2
  mv a2, s3
  call textAt
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/lcd.e16.ts:249 invertBox(x0, y0/y, x1, y1) at -O1
;   x0 in a0
;   y0/y in a1
;   x1 in a2
;   y1 in a3
;   bit in s3
;   row in s2
;   x in s1
invertBox:
  addi sp, sp, -6
  sw s3, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; sci/lcd.e16.ts:250  for (let y = y0; y <= y1 && y < BANDS * 8; y++) {
  j .L3
.L1:
  ; sci/lcd.e16.ts:251  const bit = 1 << (y & 7)
  andi t0, a1, 7
  li t1, 1
  sll s3, t1, t0
  ; sci/lcd.e16.ts:252  const row = VRAM + (y >> 3) * WIDTH
  srli t0, a1, 3
  slli t0, t0, 7
  addi s2, t0, -8192
  ; sci/lcd.e16.ts:253  for (let x = x0; x <= x1 && x < WIDTH; x++) poke(row + x, peek(row + x) ^ bit)
  mv s1, a0 ; x
  j .L7
.L5:
  ; sci/lcd.e16.ts:253  poke(row + x, peek(row + x) ^ bit)
  add t0, s2, s1
  add t1, s2, s1
  lbu t1, 0(t1)
  xor t1, t1, s3
  sb t1, 0(t0)
  addi s1, s1, 1
.L7:
  bltu a2, s1, .L9
  li t0, 128
  bltu s1, t0, .L5
.L9:
  addi a1, a1, 1
.L3:
  bltu a3, a1, .L10
  li t0, 64
  bltu a1, t0, .L1
.L10:
.return:
  lw s3, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/lcd.e16.ts:261 band(at) at -O1
;   at in s1
band:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; sci/lcd.e16.ts:262  cls()
  call cls
  ; sci/lcd.e16.ts:263  textAt(at, 1, 1)
  mv a0, s1
  li a1, 1
  li a2, 1
  call textAt
  ; sci/lcd.e16.ts:264  invertBox(0, 0, WIDTH - 1, 8)
  li a0, 0
  li a1, 0
  li a2, 127
  li a3, 8
  call invertBox
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/lcd.e16.ts:268 lineY(n) at -O1
;   n in a0
lineY:
  ; sci/lcd.e16.ts:269  return 11 + n * 9
  slli t1, a0, 3
  add t0, t1, a0
  addi a0, t0, 11
.return:
  ret

; sci/lcd.e16.ts:273 mark(col, length, n/y) at -O1
;   col in s2
;   length in s3
;   n/y in s1
mark:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; col
  mv s3, a1 ; length
  mv s1, a2 ; n/y
  ; sci/lcd.e16.ts:274  const y = lineY(n)
  mv a0, s1
  call lineY
  mv s1, a0 ; n/y
  ; sci/lcd.e16.ts:275  invertBox(col * 6, y - 1, col * 6 + length * 6, y + 7)
  slli t1, s2, 2
  slli t0, s2, 1
  add a0, t0, t1
  slli t2, s2, 2
  slli t1, s2, 1
  add t1, t1, t2
  slli t3, s3, 2
  slli t2, s3, 1
  add t2, t2, t3
  add a2, t1, t2
  addi a1, s1, -1
  addi a3, s1, 7
  call invertBox
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/tokens.e16.ts:47 isFunction(t) at -O1
;   t in a0
isFunction:
  ; sci/tokens.e16.ts:48  return t >= T_SIN && t <= T_CBRT
  li t0, 1
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L1
  li t0, 10
  sltu t0, t0, a0
  xori t0, t0, 1
.L1:
  mv a0, t0
.return:
  ret

; sci/tokens.e16.ts:52 isVariable(t) at -O1
;   t in a0
isVariable:
  ; sci/tokens.e16.ts:53  return (t >= 0x41 && t <= 0x46) || t === 0x58 || t === 0x59 || t === 0x4d
  li t0, 65
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L4
  li t0, 70
  sltu t0, t0, a0
  xori t0, t0, 1
.L4:
  mv t1, t0
  bnez t1, .L3
  li t0, 88
  sub t0, a0, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 89
  sub t0, a0, t0
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 77
  sub t0, a0, t0
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; sci/tokens.e16.ts:56 isDigit(t) at -O1
;   t in a0
isDigit:
  ; sci/tokens.e16.ts:57  return t >= 0x30 && t <= 0x39
  li t0, 48
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L1
  li t0, 57
  sltu t0, t0, a0
  xori t0, t0, 1
.L1:
  mv a0, t0
.return:
  ret

; sci/tokens.e16.ts:61 tokenText(t) at -O1
;   t in a0
tokenText:
  ; sci/tokens.e16.ts:62  switch (t) {
  li t0, 1
  beq a0, t0, .L2
  li t0, 2
  beq a0, t0, .L3
  li t0, 3
  beq a0, t0, .L4
  li t0, 4
  beq a0, t0, .L5
  li t0, 5
  beq a0, t0, .L6
  li t0, 6
  beq a0, t0, .L7
  li t0, 7
  beq a0, t0, .L8
  li t0, 8
  beq a0, t0, .L9
  li t0, 9
  beq a0, t0, .L10
  li t0, 10
  beq a0, t0, .L11
  li t0, 16
  beq a0, t0, .L12
  li t0, 17
  beq a0, t0, .L13
  li t0, 18
  beq a0, t0, .L14
  li t0, 19
  beq a0, t0, .L15
  li t0, 20
  beq a0, t0, .L16
  li t0, 21
  beq a0, t0, .L17
  j .L1
.L2:
  ; sci/tokens.e16.ts:64  return str('sin(')
  la a0, str_0
  ret
.L3:
  ; sci/tokens.e16.ts:66  return str('cos(')
  la a0, str_1
  ret
.L4:
  ; sci/tokens.e16.ts:68  return str('tan(')
  la a0, str_2
  ret
.L5:
  ; sci/tokens.e16.ts:70  return str('sin\x86(')
  la a0, str_3
  ret
.L6:
  ; sci/tokens.e16.ts:72  return str('cos\x86(')
  la a0, str_4
  ret
.L7:
  ; sci/tokens.e16.ts:74  return str('tan\x86(')
  la a0, str_5
  ret
.L8:
  ; sci/tokens.e16.ts:76  return str('log(')
  la a0, str_6
  ret
.L9:
  ; sci/tokens.e16.ts:78  return str('ln(')
  la a0, str_7
  ret
.L10:
  ; sci/tokens.e16.ts:80  return str('\x83(')
  la a0, str_8
  ret
.L11:
  ; sci/tokens.e16.ts:82  return str('\x85\x83(')
  la a0, str_9
  ret
.L12:
  ; sci/tokens.e16.ts:84  return str('-')
  la a0, str_10
  ret
.L13:
  ; sci/tokens.e16.ts:86  return str('^(')
  la a0, str_11
  ret
.L14:
  ; sci/tokens.e16.ts:88  return str('C')
  la a0, str_12
  ret
.L15:
  ; sci/tokens.e16.ts:90  return str('P')
  la a0, str_13
  ret
.L16:
  ; sci/tokens.e16.ts:92  return str('Ans')
  la a0, str_14
  ret
.L17:
  ; sci/tokens.e16.ts:94  return str('10')
  la a0, str_15
  ret
.L1:
  ; sci/tokens.e16.ts:96  return 0
  li a0, 0
.return:
  ret

; sci/tokens.e16.ts:100 tokenWidth(t/text) at -O1
;   t/text in s1
;   n in s2
tokenWidth:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t/text
  ; sci/tokens.e16.ts:101  if (t >= 0x20) return 1
  li t0, 32
  bltu s1, t0, .L1
  ; sci/tokens.e16.ts:101  return 1
  li a0, 1
  j .return
.L1:
  ; sci/tokens.e16.ts:102  const text = tokenText(t)
  mv a0, s1
  call tokenText
  mv s1, a0 ; t/text
  ; sci/tokens.e16.ts:103  if (text === 0) return 1
  bne s1, zero, .L2
  ; sci/tokens.e16.ts:103  return 1
  li a0, 1
  j .return
.L2:
  ; sci/tokens.e16.ts:104  let n: u16 = 0
  li s2, 0 ; n
  ; sci/tokens.e16.ts:105  while (peek(text + n) !== 0) n++
  j .L5
.L3:
  ; sci/tokens.e16.ts:105  n++
  addi s2, s2, 1
.L5:
  add t0, s1, s2
  lbu t0, 0(t0)
  bne t0, zero, .L3
  ; sci/tokens.e16.ts:106  return n
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/numbers.e16.ts:68 fail(code, at) at -O1
;   code in s1
;   at in s2
fail:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; code
  mv s2, a1 ; at
  ; sci/numbers.e16.ts:69  errCode = code
  sw s1, 0x0104(zero)
  ; sci/numbers.e16.ts:70  errAt = at
  sw s2, 0x0106(zero)
  ; sci/numbers.e16.ts:71  calc_abort()
  call calc_abort
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/numbers.e16.ts:92 keepReady() at -O1
;   i in a0
keepReady:
  ; sci/numbers.e16.ts:93  if (peek16(KEEP) === KEEP_MARK) return
  lw t0, 1024(zero)
  li t1, 23574
  bne t0, t1, .L1
  ; sci/numbers.e16.ts:93  return
  ret
.L1:
  ; sci/numbers.e16.ts:94  for (let i: u16 = 0; i < 0x60; i += 2) poke16(KEEP + i, 0)
  li a0, 0 ; i
  j .L4
.L2:
  ; sci/numbers.e16.ts:94  poke16(KEEP + i, 0)
  sw zero, 1024(a0)
  addi a0, a0, 2
.L4:
  li t0, 96
  bltu a0, t0, .L2
  ; sci/numbers.e16.ts:95  poke16(KEEP_ANGLE, 0)
  sw zero, 1026(zero)
  ; sci/numbers.e16.ts:96  poke16(KEEP_HISTORY_COUNT, 0)
  sw zero, 1118(zero)
  ; sci/numbers.e16.ts:97  poke16(KEEP, KEEP_MARK)
  li t0, 23574
  sw t0, 1024(zero)
.return:
  ret

; sci/numbers.e16.ts:101 varAt(letter) at -O1
;   letter in a0
;   k in a1
varAt:
  ; sci/numbers.e16.ts:102  let k: u16 = 0
  li a1, 0 ; k
  ; sci/numbers.e16.ts:103  if (letter >= 0x41 && letter <= 0x46) k = letter - 0x41
  li t0, 65
  bltu a0, t0, .L1
  li t0, 70
  bltu t0, a0, .L1
  ; sci/numbers.e16.ts:103  k = letter - 0x41
  addi a1, a0, -65
  j .L2
.L1:
  ; sci/numbers.e16.ts:104  if (letter === 0x58) k = 6
  li t0, 88
  bne a0, t0, .L3
  ; sci/numbers.e16.ts:104  k = 6
  li a1, 6 ; k
  j .L4
.L3:
  ; sci/numbers.e16.ts:105  if (letter === 0x59) k = 7
  li t0, 89
  bne a0, t0, .L5
  ; sci/numbers.e16.ts:105  k = 7
  li a1, 7 ; k
  j .L6
.L5:
  ; sci/numbers.e16.ts:106  k = 8
  li a1, 8 ; k
.L6:
.L4:
.L2:
  ; sci/numbers.e16.ts:107  return KEEP_VARS + k * 8
  slli t0, a1, 3
  addi a0, t0, 1040
.return:
  ret

; sci/numbers.e16.ts:115 clearStack() at -O1
clearStack:
  ; sci/numbers.e16.ts:116  nsp = addr(nums)
  la t0, nums
  sw t0, 0x01c8(zero)
.return:
  ret

; sci/numbers.e16.ts:120 push(at/n) at -O1
;   at/n in s1
push:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at/n
  ; sci/numbers.e16.ts:121  if (nsp >= addr(nums) + 192) fail(E_STACK, at)
  lw t0, 0x01c8(zero)
  li t1, nums+192
  bltu t0, t1, .L1
  ; sci/numbers.e16.ts:121  fail(E_STACK, at)
  li a0, 3
  mv a1, s1
  call fail
.L1:
  ; sci/numbers.e16.ts:122  const n = nsp
  lw s1, 0x01c8(zero)
  ; sci/numbers.e16.ts:123  nsp += 8
  lw t0, 0x01c8(zero)
  addi t0, t0, 8
  sw t0, 0x01c8(zero)
  ; sci/numbers.e16.ts:124  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/numbers.e16.ts:127 top() at -O1
top:
  ; sci/numbers.e16.ts:128  return nsp - 8
  lw t0, 0x01c8(zero)
  addi a0, t0, -8
.return:
  ret

; sci/numbers.e16.ts:131 pop() at -O1
pop:
  ; sci/numbers.e16.ts:132  nsp -= 8
  lw t0, 0x01c8(zero)
  addi t0, t0, -8
  sw t0, 0x01c8(zero)
.return:
  ret

; sci/numbers.e16.ts:135 copy8(from, to) at -O1
;   from in a0
;   to in a1
copy8:
  ; sci/numbers.e16.ts:136  poke16(to, peek16(from))
  lw t0, 0(a0)
  sw t0, 0(a1)
  ; sci/numbers.e16.ts:137  poke16(to + 2, peek16(from + 2))
  lw t0, 2(a0)
  sw t0, 2(a1)
  ; sci/numbers.e16.ts:138  poke16(to + 4, peek16(from + 4))
  lw t0, 4(a0)
  sw t0, 4(a1)
  ; sci/numbers.e16.ts:139  poke16(to + 6, peek16(from + 6))
  lw t0, 6(a0)
  sw t0, 6(a1)
.return:
  ret

; sci/numbers.e16.ts:142 isZero(n) at -O1
;   n in a0
isZero:
  ; sci/numbers.e16.ts:143  return peek(n + 2) === 0
  lbu t0, 2(a0)
  sub t0, t0, zero
  seqz a0, t0
.return:
  ret

; sci/numbers.e16.ts:146 isNegative(n) at -O1
;   n in a0
isNegative:
  ; sci/numbers.e16.ts:147  return peek(n) !== 0
  lbu t0, 0(a0)
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; sci/numbers.e16.ts:151 math(op, a, b, at) at -O1
;   op in s1
;   a in s2
;   b in s3
;   at in s0
math:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; op
  mv s2, a1 ; a
  mv s3, a2 ; b
  mv s0, a3 ; at
  ; sci/numbers.e16.ts:152  poke16(MATH_A, a)
  li t0, 65362
  sw s2, 0(t0)
  ; sci/numbers.e16.ts:153  poke16(MATH_B, b)
  li t0, 65364
  sw s3, 0(t0)
  ; sci/numbers.e16.ts:154  poke16(MATH_OP, op)
  li t0, 65360
  sw s1, 0(t0)
  ; sci/numbers.e16.ts:155  if (peek16(MATH_STATUS) !== 0) fail(E_MATH, at)
  li t0, 65368
  lw t0, 0(t0)
  beq t0, zero, .L1
  ; sci/numbers.e16.ts:155  fail(E_MATH, at)
  li a0, 1
  mv a1, s0
  call fail
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/numbers.e16.ts:159 pushInt(v, at) at -O1
;   v in s3
;   at in s1
;   n in s2
pushInt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; v
  mv s1, a1 ; at
  ; sci/numbers.e16.ts:160  const n = push(at)
  mv a0, s1
  call push
  mv s2, a0 ; n
  ; sci/numbers.e16.ts:161  poke16(MATH_ARG, v)
  li t0, 65366
  sw s3, 0(t0)
  ; sci/numbers.e16.ts:162  math(M_FROMINT, n, 0, at)
  li a0, 48
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
  ; sci/numbers.e16.ts:163  return n
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/numbers.e16.ts:167 binary(op, at) at -O1
;   op in s1
;   at in s2
;   b in s3
binary:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; op
  mv s2, a1 ; at
  ; sci/numbers.e16.ts:168  const b = top()
  call top
  mv s3, a0 ; b
  ; sci/numbers.e16.ts:169  pop()
  call pop
  ; sci/numbers.e16.ts:170  math(op, top(), b, at)
  call top
  mv a1, a0
  mv a0, s1
  mv a2, s3
  mv a3, s2
  call math
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/numbers.e16.ts:174 isWhole(n/whole, at) at -O1
;   n/whole in s1
;   at in s3
;   t in s2
isWhole:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; n/whole
  mv s3, a1 ; at
  ; sci/numbers.e16.ts:175  const t = push(at)
  mv a0, s3
  call push
  mv s2, a0 ; t
  ; sci/numbers.e16.ts:176  copy8(n, t)
  mv a0, s1
  mv a1, s2
  call copy8
  ; sci/numbers.e16.ts:177  math(M_FRAC, t, 0, at)
  li a0, 19
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  ; sci/numbers.e16.ts:178  const whole = isZero(t)
  mv a0, s2
  call isZero
  mv s1, a0 ; n/whole
  ; sci/numbers.e16.ts:179  pop()
  call pop
  ; sci/numbers.e16.ts:180  return whole
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/numbers.e16.ts:184 smallWhole(n/v, at) at -O1
;   n/v in s1
;   at in s2
;   t in s3
smallWhole:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; n/v
  mv s2, a1 ; at
  ; sci/numbers.e16.ts:185  if (!isWhole(n, at) || isNegative(n)) fail(E_MATH, at)
  mv a0, s1
  mv a1, s2
  call isWhole
  beqz a0, .L2
  mv a0, s1
  call isNegative
  beqz a0, .L1
.L2:
  ; sci/numbers.e16.ts:185  fail(E_MATH, at)
  li a0, 1
  mv a1, s2
  call fail
.L1:
  ; sci/numbers.e16.ts:186  const t = push(at)
  mv a0, s2
  call push
  mv s3, a0 ; t
  ; sci/numbers.e16.ts:187  copy8(n, t)
  mv a0, s1
  mv a1, s3
  call copy8
  ; sci/numbers.e16.ts:188  math(M_TOINT, t, 0, at)
  li a0, 49
  mv a1, s3
  li a2, 0
  mv a3, s2
  call math
  ; sci/numbers.e16.ts:189  pop()
  call pop
  ; sci/numbers.e16.ts:190  const v = peek16(MATH_ARG)
  li t0, 65366
  lw s1, 0(t0)
  ; sci/numbers.e16.ts:191  if (i16(v) < 0 || v > 999) fail(E_MATH, at)
  blt s1, zero, .L4
  li t0, 999
  bgeu t0, s1, .L3
.L4:
  ; sci/numbers.e16.ts:191  fail(E_MATH, at)
  li a0, 1
  mv a1, s2
  call fail
.L3:
  ; sci/numbers.e16.ts:192  return v
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:202 calcCold() at -O1
calcCold:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:203  keepReady()
  call keepReady
  ; sci/calc.e16.ts:204  cls()
  call cls
  ; sci/calc.e16.ts:205  noCursor()
  ; sci/lcd.e16.ts:161  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:206  centre(2, str('ELEC-16 SCI'), 11)
  li a0, 2
  la a1, str_16
  li a2, 11
  call centre
  ; sci/calc.e16.ts:207  centre(4, str('SCI-128'), 7)
  li a0, 4
  la a1, str_17
  li a2, 7
  call centre
  ; sci/calc.e16.ts:208  marks(0)
  ; sci/lcd.e16.ts:165  poke16(IO_ANNUNCIATORS, bits)
  li t0, 65326
  sw zero, 0(t0)
  ; sci/calc.e16.ts:209  pause(700)
  ; sci/calc.e16.ts:219  poke16(IO_TCMP, peek16(IO_TCOUNT) + ms)
  li t0, 65328
  lw t0, 0(t0)
  addi t0, t0, 700
  li t1, 65330
  sw t0, 0(t1)
  ; sci/calc.e16.ts:220  poke16(IO_TCTRL, 1)
  li t0, 1
  li t1, 65332
  sw t0, 0(t1)
  ; sci/calc.e16.ts:221  csrw(CSR_MIE, 3)
  li t0, 3
  csrw 772, t0
  ; sci/calc.e16.ts:222  wfi()
  wfi
  ; sci/calc.e16.ts:223  poke16(IO_TCTRL, 0)
  li t0, 65332
  sw zero, 0(t0)
  ; sci/calc.e16.ts:224  csrw(CSR_MIE, 0)
  csrw 772, zero
  ; sci/calc.e16.ts:210  screen = S_CALC
  sw zero, 0x01ca(zero)
  ; sci/calc.e16.ts:211  length = 0
  sw zero, 0x0294(zero)
  ; sci/calc.e16.ts:212  cursor = 0
  sw zero, 0x0296(zero)
  ; sci/calc.e16.ts:213  answered = false
  sw zero, 0x0298(zero)
  ; sci/calc.e16.ts:214  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:228 calcLoop() at -O1
calcLoop:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:229  for (;;) key(getkey())
.L1:
  ; sci/calc.e16.ts:229  key(getkey())
  call getkey
  call key
  j .L1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:233 refuse() at -O1
refuse:
  ; sci/calc.e16.ts:234  poke16(IO_FREQ, 1800)
  li t0, 1800
  li t1, 65344
  sw t0, 0(t1)
  ; sci/calc.e16.ts:235  poke16(IO_DUR, 40)
  li t0, 40
  li t1, 65346
  sw t0, 0(t1)
.return:
  ret

; sci/calc.e16.ts:241 calcError() at -O1
calcError:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:242  screen = S_ERROR
  li t0, 1
  sw t0, 0x01ca(zero)
  ; sci/calc.e16.ts:243  noCursor()
  ; sci/lcd.e16.ts:161  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:244  errorScreen(errCode)
  lw a0, 0x0104(zero)
  la t0, errorScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:245  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:249 calcFault(cause, pc) at -O1
;   cause in s1
;   pc in s2
calcFault:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; cause
  mv s2, a1 ; pc
  ; sci/calc.e16.ts:250  screen = S_ERROR
  li t0, 1
  sw t0, 0x01ca(zero)
  ; sci/calc.e16.ts:251  length = 0
  sw zero, 0x0294(zero)
  ; sci/calc.e16.ts:252  cursor = 0
  sw zero, 0x0296(zero)
  ; sci/calc.e16.ts:253  noCursor()
  ; sci/lcd.e16.ts:161  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:254  faultScreen(cause, pc)
  mv a0, s1
  mv a1, s2
  la t0, faultScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:255  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:262 calcOn() at -O1
calcOn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:263  if (shifted) {
  lw t0, 0x029a(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:264  shifted = false
  sw zero, 0x029a(zero)
  ; sci/calc.e16.ts:265  noCursor()
  ; sci/lcd.e16.ts:161  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:266  poke16(0xff06, 0)
  li t0, 65286
  sw zero, 0(t0)
  ; sci/calc.e16.ts:267  return
  j .return
.L1:
  ; sci/calc.e16.ts:269  clearLine()
  call clearLine
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:272 clearLine() at -O1
clearLine:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:273  screen = S_CALC
  sw zero, 0x01ca(zero)
  ; sci/calc.e16.ts:274  length = 0
  sw zero, 0x0294(zero)
  ; sci/calc.e16.ts:275  cursor = 0
  sw zero, 0x0296(zero)
  ; sci/calc.e16.ts:276  answered = false
  sw zero, 0x0298(zero)
  ; sci/calc.e16.ts:277  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x02a2(zero)
  ; sci/calc.e16.ts:278  shifted = false
  sw zero, 0x029a(zero)
  ; sci/calc.e16.ts:279  alphaOn = false
  sw zero, 0x029c(zero)
  ; sci/calc.e16.ts:280  storing = false
  sw zero, 0x029e(zero)
  ; sci/calc.e16.ts:281  recalling = false
  sw zero, 0x02a0(zero)
  ; sci/calc.e16.ts:282  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:287 key(k) at -O1
;   k in s1
;   shift in s2
;   alpha in s3
key:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  ; sci/calc.e16.ts:288  if (k === K_SHIFT) {
  li t0, 6
  bne s1, t0, .L1
  ; sci/calc.e16.ts:289  shifted = !shifted
  lw t0, 0x029a(zero)
  seqz t0, t0
  sw t0, 0x029a(zero)
  ; sci/calc.e16.ts:290  alphaOn = false
  sw zero, 0x029c(zero)
  ; sci/calc.e16.ts:291  drawMarks()
  call drawMarks
  ; sci/calc.e16.ts:292  return
  j .return
.L1:
  ; sci/calc.e16.ts:294  if (k === K_ALPHA) {
  li t0, 7
  bne s1, t0, .L2
  ; sci/calc.e16.ts:295  alphaOn = !alphaOn
  lw t0, 0x029c(zero)
  seqz t0, t0
  sw t0, 0x029c(zero)
  ; sci/calc.e16.ts:296  shifted = false
  sw zero, 0x029a(zero)
  ; sci/calc.e16.ts:297  drawMarks()
  call drawMarks
  ; sci/calc.e16.ts:298  return
  j .return
.L2:
  ; sci/calc.e16.ts:300  const shift = shifted
  lw s2, 0x029a(zero)
  ; sci/calc.e16.ts:301  const alpha = alphaOn
  lw s3, 0x029c(zero)
  ; sci/calc.e16.ts:302  shifted = false
  sw zero, 0x029a(zero)
  ; sci/calc.e16.ts:303  alphaOn = false
  sw zero, 0x029c(zero)
  ; sci/calc.e16.ts:304  if (screen === S_ERROR) errorKey(k)
  lw t0, 0x01ca(zero)
  li t1, 1
  bne t0, t1, .L3
  ; sci/calc.e16.ts:304  errorKey(k)
  mv a0, s1
  call errorKey
  j .L4
.L3:
  ; sci/calc.e16.ts:305  if (screen === S_MENU) {
  lw t0, 0x01ca(zero)
  li t1, 2
  bne t0, t1, .L5
  ; sci/calc.e16.ts:306  if (menuKey(k) !== 0) clearLine()
  mv a0, s1
  la t0, menuKey
  li t1, 1
  call far_call
  beq a0, zero, .L7
  ; sci/calc.e16.ts:306  clearLine()
  call clearLine
  j .L7
.L5:
  ; sci/calc.e16.ts:307  if (screen === S_SETUP) {
  lw t0, 0x01ca(zero)
  li t1, 3
  bne t0, t1, .L8
  ; sci/calc.e16.ts:308  if (setupKey(k) !== 0) clearLine()
  mv a0, s1
  la t0, setupKey
  li t1, 1
  call far_call
  beq a0, zero, .L10
  ; sci/calc.e16.ts:308  clearLine()
  call clearLine
  j .L10
.L8:
  ; sci/calc.e16.ts:309  calcKey(k, shift, alpha)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call calcKey
.L10:
.L7:
.L4:
  ; sci/calc.e16.ts:310  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:314 errorKey(k) at -O1
;   k in s1
errorKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/calc.e16.ts:315  if (k === K_AC) {
  li t0, 5
  bne s1, t0, .L1
  ; sci/calc.e16.ts:316  clearLine()
  call clearLine
  ; sci/calc.e16.ts:317  return
  j .return
.L1:
  ; sci/calc.e16.ts:319  if (k === K_LEFT || k === K_RIGHT) {
  li t0, 2
  beq s1, t0, .L3
  li t0, 3
  bne s1, t0, .L2
.L3:
  ; sci/calc.e16.ts:320  screen = S_CALC
  sw zero, 0x01ca(zero)
  ; sci/calc.e16.ts:321  answered = false
  sw zero, 0x0298(zero)
  ; sci/calc.e16.ts:322  cursor = errAt < length ? errAt : length
  lw t0, 0x0106(zero)
  lw t1, 0x0294(zero)
  bgeu t0, t1, .L4
  lw t0, 0x0106(zero)
  j .L5
.L4:
  lw t0, 0x0294(zero)
.L5:
  sw t0, 0x0296(zero)
  ; sci/calc.e16.ts:323  drawCalc()
  call drawCalc
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:327 calcKey(k, shift, alpha/t) at -O1
;   k in s1
;   shift in s3
;   alpha/t in s2
calcKey:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; k
  mv s3, a1 ; shift
  mv s2, a2 ; alpha/t
  ; sci/calc.e16.ts:328  if (storing || recalling) {
  lw t0, 0x029e(zero)
  bnez t0, .L2
  lw t0, 0x02a0(zero)
  beqz t0, .L1
.L2:
  ; sci/calc.e16.ts:329  variableKey(k)
  mv a0, s1
  call variableKey
  ; sci/calc.e16.ts:330  return
  j .return
.L1:
  ; sci/calc.e16.ts:332  if (commandKey(k, shift, alpha)) return
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call commandKey
  beqz a0, .L3
  ; sci/calc.e16.ts:332  return
  j .return
.L3:
  ; sci/calc.e16.ts:333  const t = alpha ? letterOf(k) : tokenOf(k, shift)
  beqz s2, .L4
  mv a0, s1
  call letterOf
  mv t0, a0
  j .L5
.L4:
  mv a0, s1
  mv a1, s3
  call tokenOf
  mv t0, a0
.L5:
  mv s2, t0 ; alpha/t
  ; sci/calc.e16.ts:334  if (t === 0) {
  bne s2, zero, .L6
  ; sci/calc.e16.ts:335  refuse()
  call refuse
  ; sci/calc.e16.ts:336  return
  j .return
.L6:
  ; sci/calc.e16.ts:338  type(t)
  mv a0, s2
  call type
  ; sci/calc.e16.ts:340  if (shift && (k === K_LOG || k === K_LN)) {
  beqz s3, .L7
  li t0, 20
  beq s1, t0, .L8
  li t0, 21
  bne s1, t0, .L7
.L8:
  ; sci/calc.e16.ts:341  insert(T_POW)
  li a0, 17
  call insert
  ; sci/calc.e16.ts:342  drawCalc()
  call drawCalc
.L7:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:347 commandKey(k, shift, alpha) at -O1
;   k in s1
;   shift in s2
;   alpha in s3
commandKey:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift
  mv s3, a2 ; alpha
  ; sci/calc.e16.ts:348  switch (k) {
  li t0, 8
  beq s1, t0, .L2
  li t0, 9
  beq s1, t0, .L3
  li t0, 5
  beq s1, t0, .L4
  li t0, 4
  beq s1, t0, .L5
  li t0, 12
  beq s1, t0, .L6
  li t0, 2
  beq s1, t0, .L7
  li t0, 3
  beq s1, t0, .L8
  beq s1, zero, .L9
  li t0, 1
  beq s1, t0, .L10
  li t0, 14
  beq s1, t0, .L11
  j .L1
.L2:
  ; sci/calc.e16.ts:350  screen = S_MENU
  li t0, 2
  sw t0, 0x01ca(zero)
  ; sci/calc.e16.ts:351  noCursor()
  ; sci/lcd.e16.ts:161  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:352  menuScreen()
  la t0, menuScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:353  return true
  li a0, 1
  j .return
.L3:
  ; sci/calc.e16.ts:355  screen = S_SETUP
  li t0, 3
  sw t0, 0x01ca(zero)
  ; sci/calc.e16.ts:356  noCursor()
  ; sci/lcd.e16.ts:161  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:357  setupScreen()
  la t0, setupScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:358  return true
  li a0, 1
  j .return
.L4:
  ; sci/calc.e16.ts:360  clearLine()
  call clearLine
  ; sci/calc.e16.ts:361  return true
  li a0, 1
  j .return
.L5:
  ; sci/calc.e16.ts:363  equals()
  call equals
  ; sci/calc.e16.ts:364  return true
  li a0, 1
  j .return
.L6:
  ; sci/calc.e16.ts:366  recalling = shift
  sw s2, 0x02a0(zero)
  ; sci/calc.e16.ts:367  storing = !shift
  seqz t0, s2
  sw t0, 0x029e(zero)
  ; sci/calc.e16.ts:368  return true
  li a0, 1
  j .return
.L7:
.L8:
  ; sci/calc.e16.ts:371  arrow(k === K_LEFT)
  li t0, 2
  sub t0, s1, t0
  seqz a0, t0
  call arrow
  ; sci/calc.e16.ts:372  return true
  li a0, 1
  j .return
.L9:
.L10:
  ; sci/calc.e16.ts:375  history(k === K_UP)
  sub t0, s1, zero
  seqz a0, t0
  call history
  ; sci/calc.e16.ts:376  return true
  li a0, 1
  j .return
.L11:
  ; sci/calc.e16.ts:378  deleteBefore()
  call deleteBefore
  ; sci/calc.e16.ts:379  return true
  li a0, 1
  j .return
.L1:
  ; sci/calc.e16.ts:381  if (k !== K_MPLUS || alpha) return false
  li t0, 37
  bne s1, t0, .L13
  beqz s3, .L12
.L13:
  ; sci/calc.e16.ts:381  return false
  li a0, 0
  j .return
.L12:
  ; sci/calc.e16.ts:382  memoryPlus(shift)
  mv a0, s2
  call memoryPlus
  ; sci/calc.e16.ts:383  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:387 tokenOf(k, shift) at -O1
;   k in s1
;   shift in s3
;   plain in s2
tokenOf:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; k
  mv s3, a1 ; shift
  ; sci/calc.e16.ts:388  const plain = plainToken(k)
  mv a0, s1
  call plainToken
  mv s2, a0 ; plain
  ; sci/calc.e16.ts:389  return plain !== 0 ? plain : faceToken(k, shift)
  beq s2, zero, .L1
  mv t0, s2
  j .L2
.L1:
  mv a0, s1
  mv a1, s3
  call faceToken
  mv t0, a0
.L2:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:393 plainToken(k) at -O1
;   k in a0
plainToken:
  ; sci/calc.e16.ts:394  switch (k) {
  li t0, 59
  beq a0, t0, .L2
  li t0, 56
  beq a0, t0, .L3
  li t0, 57
  beq a0, t0, .L4
  li t0, 58
  beq a0, t0, .L5
  li t0, 48
  beq a0, t0, .L6
  li t0, 49
  beq a0, t0, .L7
  li t0, 50
  beq a0, t0, .L8
  li t0, 40
  beq a0, t0, .L9
  li t0, 41
  beq a0, t0, .L10
  li t0, 42
  beq a0, t0, .L11
  li t0, 60
  beq a0, t0, .L12
  li t0, 51
  beq a0, t0, .L13
  li t0, 52
  beq a0, t0, .L14
  li t0, 43
  beq a0, t0, .L15
  li t0, 44
  beq a0, t0, .L16
  li t0, 35
  beq a0, t0, .L17
  li t0, 36
  beq a0, t0, .L18
  li t0, 15
  beq a0, t0, .L19
  j .L1
.L2:
  ; sci/calc.e16.ts:396  return 0x30
  li a0, 48
  ret
.L3:
  ; sci/calc.e16.ts:398  return 0x31
  li a0, 49
  ret
.L4:
  ; sci/calc.e16.ts:400  return 0x32
  li a0, 50
  ret
.L5:
  ; sci/calc.e16.ts:402  return 0x33
  li a0, 51
  ret
.L6:
  ; sci/calc.e16.ts:404  return 0x34
  li a0, 52
  ret
.L7:
  ; sci/calc.e16.ts:406  return 0x35
  li a0, 53
  ret
.L8:
  ; sci/calc.e16.ts:408  return 0x36
  li a0, 54
  ret
.L9:
  ; sci/calc.e16.ts:410  return 0x37
  li a0, 55
  ret
.L10:
  ; sci/calc.e16.ts:412  return 0x38
  li a0, 56
  ret
.L11:
  ; sci/calc.e16.ts:414  return 0x39
  li a0, 57
  ret
.L12:
  ; sci/calc.e16.ts:416  return T_POINT
  li a0, 46
  ret
.L13:
  ; sci/calc.e16.ts:418  return T_PLUS
  li a0, 43
  ret
.L14:
  ; sci/calc.e16.ts:420  return T_MINUS
  li a0, 45
  ret
.L15:
  ; sci/calc.e16.ts:422  return T_TIMES
  li a0, 129
  ret
.L16:
  ; sci/calc.e16.ts:424  return T_DIVIDE
  li a0, 130
  ret
.L17:
  ; sci/calc.e16.ts:426  return T_OPEN
  li a0, 40
  ret
.L18:
  ; sci/calc.e16.ts:428  return T_CLOSE
  li a0, 41
  ret
.L19:
  ; sci/calc.e16.ts:430  return T_ANS
  li a0, 20
  ret
.L1:
  ; sci/calc.e16.ts:432  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:436 faceToken(k, shift) at -O1
;   k in s1
;   shift in s2
faceToken:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift
  ; sci/calc.e16.ts:437  return shift ? shiftFace(k) : capToken(k)
  beqz s2, .L1
  mv a0, s1
  call shiftFace
  mv t0, a0
  j .L2
.L1:
  mv a0, s1
  call capToken
  mv t0, a0
.L2:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:441 capToken(k) at -O1
;   k in a0
capToken:
  ; sci/calc.e16.ts:442  switch (k) {
  li t0, 24
  beq a0, t0, .L2
  li t0, 22
  beq a0, t0, .L3
  li t0, 17
  beq a0, t0, .L4
  li t0, 18
  beq a0, t0, .L5
  li t0, 19
  beq a0, t0, .L6
  li t0, 20
  beq a0, t0, .L7
  li t0, 21
  beq a0, t0, .L8
  li t0, 27
  beq a0, t0, .L9
  li t0, 28
  beq a0, t0, .L10
  li t0, 29
  beq a0, t0, .L11
  li t0, 33
  beq a0, t0, .L12
  li t0, 34
  beq a0, t0, .L13
  j .L1
.L2:
  ; sci/calc.e16.ts:444  return T_NEG
  li a0, 16
  ret
.L3:
  ; sci/calc.e16.ts:446  return T_EXP
  li a0, 135
  ret
.L4:
  ; sci/calc.e16.ts:448  return T_SQUARE
  li a0, 132
  ret
.L5:
  ; sci/calc.e16.ts:450  return T_CUBE
  li a0, 133
  ret
.L6:
  ; sci/calc.e16.ts:452  return T_POW
  li a0, 17
  ret
.L7:
  ; sci/calc.e16.ts:454  return T_LOG
  li a0, 7
  ret
.L8:
  ; sci/calc.e16.ts:456  return T_LN
  li a0, 8
  ret
.L9:
  ; sci/calc.e16.ts:458  return T_SIN
  li a0, 1
  ret
.L10:
  ; sci/calc.e16.ts:460  return T_COS
  li a0, 2
  ret
.L11:
  ; sci/calc.e16.ts:462  return T_TAN
  li a0, 3
  ret
.L12:
  ; sci/calc.e16.ts:464  return T_INVERSE
  li a0, 134
  ret
.L13:
  ; sci/calc.e16.ts:466  return T_NCR
  li a0, 18
  ret
.L1:
  ; sci/calc.e16.ts:468  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:472 shiftFace(k) at -O1
;   k in a0
shiftFace:
  ; sci/calc.e16.ts:473  switch (k) {
  li t0, 22
  beq a0, t0, .L2
  li t0, 17
  beq a0, t0, .L3
  li t0, 18
  beq a0, t0, .L4
  li t0, 20
  beq a0, t0, .L5
  li t0, 21
  beq a0, t0, .L6
  li t0, 27
  beq a0, t0, .L7
  li t0, 28
  beq a0, t0, .L8
  li t0, 29
  beq a0, t0, .L9
  li t0, 33
  beq a0, t0, .L10
  li t0, 34
  beq a0, t0, .L11
  j .L1
.L2:
  ; sci/calc.e16.ts:475  return T_PI
  li a0, 128
  ret
.L3:
  ; sci/calc.e16.ts:477  return T_SQRT
  li a0, 9
  ret
.L4:
  ; sci/calc.e16.ts:479  return T_CBRT
  li a0, 10
  ret
.L5:
  ; sci/calc.e16.ts:481  return T_TEN
  li a0, 21
  ret
.L6:
  ; sci/calc.e16.ts:483  return T_E
  li a0, 101
  ret
.L7:
  ; sci/calc.e16.ts:485  return T_ASIN
  li a0, 4
  ret
.L8:
  ; sci/calc.e16.ts:487  return T_ACOS
  li a0, 5
  ret
.L9:
  ; sci/calc.e16.ts:489  return T_ATAN
  li a0, 6
  ret
.L10:
  ; sci/calc.e16.ts:491  return T_BANG
  li a0, 33
  ret
.L11:
  ; sci/calc.e16.ts:493  return T_NPR
  li a0, 19
  ret
.L1:
  ; sci/calc.e16.ts:495  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:499 letterOf(k) at -O1
;   k in a0
letterOf:
  ; sci/calc.e16.ts:500  switch (k) {
  li t0, 24
  beq a0, t0, .L2
  li t0, 25
  beq a0, t0, .L3
  li t0, 26
  beq a0, t0, .L4
  li t0, 27
  beq a0, t0, .L5
  li t0, 28
  beq a0, t0, .L6
  li t0, 29
  beq a0, t0, .L7
  li t0, 35
  beq a0, t0, .L8
  li t0, 36
  beq a0, t0, .L9
  li t0, 37
  beq a0, t0, .L10
  li t0, 22
  beq a0, t0, .L11
  j .L1
.L2:
  ; sci/calc.e16.ts:502  return 0x41
  li a0, 65
  ret
.L3:
  ; sci/calc.e16.ts:504  return 0x42
  li a0, 66
  ret
.L4:
  ; sci/calc.e16.ts:506  return 0x43
  li a0, 67
  ret
.L5:
  ; sci/calc.e16.ts:508  return 0x44
  li a0, 68
  ret
.L6:
  ; sci/calc.e16.ts:510  return 0x45
  li a0, 69
  ret
.L7:
  ; sci/calc.e16.ts:512  return 0x46
  li a0, 70
  ret
.L8:
  ; sci/calc.e16.ts:514  return 0x58
  li a0, 88
  ret
.L9:
  ; sci/calc.e16.ts:516  return 0x59
  li a0, 89
  ret
.L10:
  ; sci/calc.e16.ts:518  return 0x4d
  li a0, 77
  ret
.L11:
  ; sci/calc.e16.ts:520  return T_E
  li a0, 101
  ret
.L1:
  ; sci/calc.e16.ts:522  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:526 fromAns(t) at -O1
;   t in a0
fromAns:
  ; sci/calc.e16.ts:527  return (
  li t0, 43
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L10
  li t0, 45
  sub t0, a0, t0
  seqz t0, t0
.L10:
  mv t1, t0
  bnez t1, .L9
  li t0, 129
  sub t0, a0, t0
  seqz t0, t0
.L9:
  mv t1, t0
  bnez t1, .L8
  li t0, 130
  sub t0, a0, t0
  seqz t0, t0
.L8:
  mv t1, t0
  bnez t1, .L7
  li t0, 17
  sub t0, a0, t0
  seqz t0, t0
.L7:
  mv t1, t0
  bnez t1, .L6
  li t0, 132
  sub t0, a0, t0
  seqz t0, t0
.L6:
  mv t1, t0
  bnez t1, .L5
  li t0, 133
  sub t0, a0, t0
  seqz t0, t0
.L5:
  mv t1, t0
  bnez t1, .L4
  li t0, 134
  sub t0, a0, t0
  seqz t0, t0
.L4:
  mv t1, t0
  bnez t1, .L3
  li t0, 33
  sub t0, a0, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 18
  sub t0, a0, t0
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 19
  sub t0, a0, t0
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; sci/calc.e16.ts:543 type(t) at -O1
;   t in s1
type:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/calc.e16.ts:544  if (answered) {
  lw t0, 0x0298(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:545  answered = false
  sw zero, 0x0298(zero)
  ; sci/calc.e16.ts:546  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x02a2(zero)
  ; sci/calc.e16.ts:547  length = 0
  sw zero, 0x0294(zero)
  ; sci/calc.e16.ts:548  cursor = 0
  sw zero, 0x0296(zero)
  ; sci/calc.e16.ts:549  if (fromAns(t)) insert(T_ANS)
  mv a0, s1
  call fromAns
  beqz a0, .L2
  ; sci/calc.e16.ts:549  insert(T_ANS)
  li a0, 20
  call insert
.L2:
.L1:
  ; sci/calc.e16.ts:551  insert(t)
  mv a0, s1
  call insert
  ; sci/calc.e16.ts:552  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:555 insert(t) at -O1
;   t in s1
insert:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/calc.e16.ts:556  if (length >= LINE_MAX) {
  lw t0, 0x0294(zero)
  li t1, 199
  bltu t0, t1, .L1
  ; sci/calc.e16.ts:557  refuse()
  call refuse
  ; sci/calc.e16.ts:558  return
  j .return
.L1:
  ; sci/calc.e16.ts:560  memcpy(addr(line) + cursor + 1, addr(line) + cursor, length - cursor)
  lw t0, 0x0296(zero)
  lw t1, 0x0296(zero)
  lw t2, 0x0294(zero)
  lw t3, 0x0296(zero)
  sub a2, t2, t3
  addi a0, t0, line+1
  addi a1, t1, line
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:561  line[cursor] = t
  lw t0, 0x0296(zero)
  sb s1, line(t0)
  ; sci/calc.e16.ts:562  length++
  lw t0, 0x0294(zero)
  addi t0, t0, 1
  sw t0, 0x0294(zero)
  ; sci/calc.e16.ts:563  cursor++
  lw t0, 0x0296(zero)
  addi t0, t0, 1
  sw t0, 0x0296(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:566 deleteBefore() at -O1
deleteBefore:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:567  if (answered) {
  lw t0, 0x0298(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:568  answered = false
  sw zero, 0x0298(zero)
  ; sci/calc.e16.ts:569  cursor = length
  lw t0, 0x0294(zero)
  sw t0, 0x0296(zero)
.L1:
  ; sci/calc.e16.ts:571  if (cursor > 0) {
  lw t0, 0x0296(zero)
  bgeu zero, t0, .L2
  ; sci/calc.e16.ts:572  memcpy(addr(line) + cursor - 1, addr(line) + cursor, length - cursor)
  lw t0, 0x0296(zero)
  lw t1, 0x0296(zero)
  lw t2, 0x0294(zero)
  lw t3, 0x0296(zero)
  sub a2, t2, t3
  addi a0, t0, line-1
  addi a1, t1, line
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:573  length--
  lw t0, 0x0294(zero)
  addi t0, t0, -1
  sw t0, 0x0294(zero)
  ; sci/calc.e16.ts:574  cursor--
  lw t0, 0x0296(zero)
  addi t0, t0, -1
  sw t0, 0x0296(zero)
.L2:
  ; sci/calc.e16.ts:576  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:580 arrow(left) at -O1
;   left in s1
arrow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; left
  ; sci/calc.e16.ts:581  if (answered) {
  lw t0, 0x0298(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:582  answered = false
  sw zero, 0x0298(zero)
  ; sci/calc.e16.ts:583  cursor = left ? length : 0
  beqz s1, .L2
  lw t0, 0x0294(zero)
  j .L3
.L2:
  li t0, 0
.L3:
  sw t0, 0x0296(zero)
  j .L4
.L1:
  ; sci/calc.e16.ts:584  if (left) {
  beqz s1, .L5
  ; sci/calc.e16.ts:585  cursor = cursor > 0 ? cursor - 1 : length
  lw t0, 0x0296(zero)
  bgeu zero, t0, .L6
  lw t0, 0x0296(zero)
  addi t0, t0, -1
  j .L7
.L6:
  lw t0, 0x0294(zero)
.L7:
  sw t0, 0x0296(zero)
  j .L8
.L5:
  ; sci/calc.e16.ts:587  cursor = cursor < length ? cursor + 1 : 0
  lw t0, 0x0296(zero)
  lw t1, 0x0294(zero)
  bgeu t0, t1, .L9
  lw t0, 0x0296(zero)
  addi t0, t0, 1
  j .L10
.L9:
  li t0, 0
.L10:
  sw t0, 0x0296(zero)
.L8:
.L4:
  ; sci/calc.e16.ts:589  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:595 equals() at -O1
equals:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:596  if (length === 0) return
  lw t0, 0x0294(zero)
  bne t0, zero, .L1
  ; sci/calc.e16.ts:596  return
  j .return
.L1:
  ; sci/calc.e16.ts:597  clearStack()
  ; sci/numbers.e16.ts:116  nsp = addr(nums)
  la t0, nums
  sw t0, 0x01c8(zero)
  ; sci/calc.e16.ts:598  evaluate(addr(line), length)
  lw a1, 0x0294(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/calc.e16.ts:599  copy8(top(), KEEP_ANS)
  call top
  li a1, 1032
  call copy8
  ; sci/calc.e16.ts:600  remember()
  call remember
  ; sci/calc.e16.ts:601  answered = true
  li t0, 1
  sw t0, 0x0298(zero)
  ; sci/calc.e16.ts:602  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x02a2(zero)
  ; sci/calc.e16.ts:603  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:607 variableKey(k/letter) at -O1
;   k/letter in s1
;   store in s2
variableKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/letter
  ; sci/calc.e16.ts:608  const store = storing
  lw s2, 0x029e(zero)
  ; sci/calc.e16.ts:609  storing = false
  sw zero, 0x029e(zero)
  ; sci/calc.e16.ts:610  recalling = false
  sw zero, 0x02a0(zero)
  ; sci/calc.e16.ts:611  const letter = letterOf(k)
  mv a0, s1
  call letterOf
  mv s1, a0 ; k/letter
  ; sci/calc.e16.ts:612  if (letter === 0 || letter === T_E) {
  beq s1, zero, .L2
  li t0, 101
  bne s1, t0, .L1
.L2:
  ; sci/calc.e16.ts:613  refuse()
  call refuse
  ; sci/calc.e16.ts:614  return
  j .return
.L1:
  ; sci/calc.e16.ts:616  if (store) {
  beqz s2, .L3
  ; sci/calc.e16.ts:617  if (!answered && length > 0) {
  lw t0, 0x0298(zero)
  bnez t0, .L4
  lw t0, 0x0294(zero)
  bgeu zero, t0, .L4
  ; sci/calc.e16.ts:618  clearStack()
  ; sci/numbers.e16.ts:116  nsp = addr(nums)
  la t0, nums
  sw t0, 0x01c8(zero)
  ; sci/calc.e16.ts:619  evaluate(addr(line), length)
  lw a1, 0x0294(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/calc.e16.ts:620  copy8(top(), KEEP_ANS)
  call top
  li a1, 1032
  call copy8
  ; sci/calc.e16.ts:621  remember()
  call remember
.L4:
  ; sci/calc.e16.ts:623  copy8(KEEP_ANS, varAt(letter))
  mv a0, s1
  call varAt
  mv a1, a0
  li a0, 1032
  call copy8
  j .L5
.L3:
  ; sci/calc.e16.ts:625  copy8(varAt(letter), KEEP_ANS)
  mv a0, s1
  call varAt
  li a1, 1032
  call copy8
.L5:
  ; sci/calc.e16.ts:627  length = 0
  sw zero, 0x0294(zero)
  ; sci/calc.e16.ts:628  cursor = 0
  sw zero, 0x0296(zero)
  ; sci/calc.e16.ts:629  insert(T_ANS)
  li a0, 20
  call insert
  ; sci/calc.e16.ts:630  answered = true
  li t0, 1
  sw t0, 0x0298(zero)
  ; sci/calc.e16.ts:631  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:635 memoryPlus(minus) at -O1
;   minus in s1
;   m in s2
memoryPlus:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; minus
  ; sci/calc.e16.ts:636  if (!answered) {
  lw t0, 0x0298(zero)
  bnez t0, .L1
  ; sci/calc.e16.ts:637  if (length === 0) {
  lw t0, 0x0294(zero)
  bne t0, zero, .L2
  ; sci/calc.e16.ts:638  length = 0
  sw zero, 0x0294(zero)
  ; sci/calc.e16.ts:639  insert(T_ANS)
  li a0, 20
  call insert
.L2:
  ; sci/calc.e16.ts:641  clearStack()
  ; sci/numbers.e16.ts:116  nsp = addr(nums)
  la t0, nums
  sw t0, 0x01c8(zero)
  ; sci/calc.e16.ts:642  evaluate(addr(line), length)
  lw a1, 0x0294(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/calc.e16.ts:643  copy8(top(), KEEP_ANS)
  call top
  li a1, 1032
  call copy8
  ; sci/calc.e16.ts:644  remember()
  call remember
.L1:
  ; sci/calc.e16.ts:646  const m = varAt(0x4d)
  li s2, 1104 ; m
  ; sci/calc.e16.ts:647  math(minus ? M_SUB : M_ADD, m, KEEP_ANS, 0)
  beqz s1, .L3
  li t0, 2
  j .L4
.L3:
  li t0, 1
.L4:
  mv a0, t0
  mv a1, s2
  li a2, 1032
  li a3, 0
  call math
  ; sci/calc.e16.ts:648  answered = true
  li t0, 1
  sw t0, 0x0298(zero)
  ; sci/calc.e16.ts:649  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:655 remember() at -O1
;   count/kept in s1
remember:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/calc.e16.ts:656  const count = peek16(KEEP_HISTORY_COUNT)
  lw s1, 1118(zero)
  ; sci/calc.e16.ts:657  const kept = count < HISTORY_ENTRIES ? count : HISTORY_ENTRIES - 1
  li t0, 10
  bgeu s1, t0, .L1
  mv t0, s1
  j .L2
.L1:
  li t0, 9
.L2:
  mv s1, t0 ; count/kept
  ; sci/calc.e16.ts:658  memcpy(KEEP_HISTORY + HISTORY_SIZE, KEEP_HISTORY, kept * HISTORY_SIZE)
  li t0, 200
  mul a2, s1, t0
  li a0, 1320
  li a1, 1120
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:659  poke(KEEP_HISTORY, length)
  lw t0, 0x0294(zero)
  sb t0, 1120(zero)
  ; sci/calc.e16.ts:660  memcpy(KEEP_HISTORY + 1, addr(line), length)
  lw a2, 0x0294(zero)
  li a0, 1121
  la a1, line
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:661  poke16(KEEP_HISTORY_COUNT, kept + 1)
  addi t0, s1, 1
  sw t0, 1118(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:668 history(older/entry) at -O1
;   older/entry in s2
;   count in s0
;   browsing in s3
;   next in s1
history:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s0, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; older/entry
  ; sci/calc.e16.ts:669  const count = peek16(KEEP_HISTORY_COUNT)
  lw s0, 1118(zero)
  ; sci/calc.e16.ts:670  const browsing = historyAt !== 0xffff
  lw t0, 0x02a2(zero)
  li t1, 65535
  sub t0, t0, t1
  snez s3, t0
  ; sci/calc.e16.ts:671  if (!answered && length > 0 && !browsing) return
  lw t0, 0x0298(zero)
  bnez t0, .L1
  lw t0, 0x0294(zero)
  bgeu zero, t0, .L1
  bnez s3, .L1
  ; sci/calc.e16.ts:671  return
  j .return
.L1:
  ; sci/calc.e16.ts:672  let next = historyAt
  lw s1, 0x02a2(zero)
  ; sci/calc.e16.ts:673  if (older) next = browsing ? historyAt + 1 : 0
  beqz s2, .L2
  ; sci/calc.e16.ts:673  next = browsing ? historyAt + 1 : 0
  beqz s3, .L3
  lw t0, 0x02a2(zero)
  addi t0, t0, 1
  j .L4
.L3:
  li t0, 0
.L4:
  mv s1, t0 ; next
  j .L5
.L2:
  ; sci/calc.e16.ts:674  if (browsing && historyAt > 0) next = historyAt - 1
  beqz s3, .L6
  lw t0, 0x02a2(zero)
  bgeu zero, t0, .L6
  ; sci/calc.e16.ts:674  next = historyAt - 1
  lw t0, 0x02a2(zero)
  addi s1, t0, -1
  j .L7
.L6:
  ; sci/calc.e16.ts:675  return
  j .return
.L7:
.L5:
  ; sci/calc.e16.ts:676  if (next >= count) return
  bltu s1, s0, .L8
  ; sci/calc.e16.ts:676  return
  j .return
.L8:
  ; sci/calc.e16.ts:677  historyAt = next
  sw s1, 0x02a2(zero)
  ; sci/calc.e16.ts:678  const entry = KEEP_HISTORY + next * HISTORY_SIZE
  li t0, 200
  mul t0, s1, t0
  addi s2, t0, 1120
  ; sci/calc.e16.ts:679  length = peek(entry)
  lbu t0, 0(s2)
  sw t0, 0x0294(zero)
  ; sci/calc.e16.ts:680  memcpy(addr(line), entry + 1, length)
  lw a2, 0x0294(zero)
  la a0, line
  addi a1, s2, 1
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:681  cursor = length
  lw t0, 0x0294(zero)
  sw t0, 0x0296(zero)
  ; sci/calc.e16.ts:682  answered = false
  sw zero, 0x0298(zero)
  ; sci/calc.e16.ts:683  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s0, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/calc.e16.ts:689 drawMarks() at -O1
;   bits in s1
;   angle in s2
drawMarks:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/calc.e16.ts:690  let bits: u16 = 0
  li s1, 0 ; bits
  ; sci/calc.e16.ts:691  if (shifted) bits |= ANN_S
  lw t0, 0x029a(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:691  bits |= ANN_S
  ori s1, s1, 2
.L1:
  ; sci/calc.e16.ts:692  if (alphaOn || storing || recalling) bits |= ANN_A
  lw t0, 0x029c(zero)
  bnez t0, .L3
  lw t0, 0x029e(zero)
  bnez t0, .L3
  lw t0, 0x02a0(zero)
  beqz t0, .L2
.L3:
  ; sci/calc.e16.ts:692  bits |= ANN_A
  ori s1, s1, 4
.L2:
  ; sci/calc.e16.ts:693  if (storing) bits |= ANN_STO
  lw t0, 0x029e(zero)
  beqz t0, .L4
  ; sci/calc.e16.ts:693  bits |= ANN_STO
  ori s1, s1, 16
.L4:
  ; sci/calc.e16.ts:694  if (peek(varAt(0x4d) + 2) !== 0) bits |= ANN_M
  lbu t0, 1106(zero)
  beq t0, zero, .L5
  ; sci/calc.e16.ts:694  bits |= ANN_M
  ori s1, s1, 8
.L5:
  ; sci/calc.e16.ts:695  const angle = peek(KEEP_ANGLE)
  lbu s2, 1026(zero)
  ; sci/calc.e16.ts:696  bits |= angle === 1 ? ANN_R : angle === 2 ? ANN_G : ANN_D
  mv t0, s1
  mv t1, s2
  li t2, 1
  bne t1, t2, .L6
  li t1, 256
  j .L7
.L6:
  mv t1, s2
  li t2, 2
  bne t1, t2, .L8
  li t1, 512
  j .L9
.L8:
  li t1, 128
.L9:
.L7:
  or s1, t0, t1
  ; sci/calc.e16.ts:697  if (screen === S_CALC) bits |= historyMarks()
  lw t0, 0x01ca(zero)
  bne t0, zero, .L10
  ; sci/calc.e16.ts:697  bits |= historyMarks()
  call historyMarks
  or s1, s1, a0
.L10:
  ; sci/calc.e16.ts:698  marks(bits)
  ; sci/lcd.e16.ts:165  poke16(IO_ANNUNCIATORS, bits)
  li t0, 65326
  sw s1, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:702 historyMarks() at -O1
;   count in a1
;   browsing in a2
;   bits in a0
historyMarks:
  ; sci/calc.e16.ts:703  const count = peek16(KEEP_HISTORY_COUNT)
  lw a1, 1118(zero)
  ; sci/calc.e16.ts:704  const browsing = historyAt !== 0xffff
  lw t0, 0x02a2(zero)
  li t1, 65535
  sub t0, t0, t1
  snez a2, t0
  ; sci/calc.e16.ts:705  let bits: u16 = 0
  li a0, 0 ; bits
  ; sci/calc.e16.ts:706  if (browsing ? historyAt + 1 < count : count > 0 && (answered || length === 0)) bits |= ANN_UP
  beqz a2, .L2
  lw t0, 0x02a2(zero)
  addi t0, t0, 1
  sltu t0, t0, a1
  j .L3
.L2:
  sltu t0, zero, a1
  mv t1, t0
  beqz t1, .L4
  lw t0, 0x0298(zero)
  mv t1, t0
  bnez t1, .L5
  lw t0, 0x0294(zero)
  sub t0, t0, zero
  seqz t0, t0
.L5:
.L4:
.L3:
  beqz t0, .L1
  ; sci/calc.e16.ts:706  bits |= ANN_UP
  li t0, 8192
  or a0, a0, t0
.L1:
  ; sci/calc.e16.ts:707  if (browsing && historyAt > 0) bits |= ANN_DOWN
  beqz a2, .L6
  lw t0, 0x02a2(zero)
  bgeu zero, t0, .L6
  ; sci/calc.e16.ts:707  bits |= ANN_DOWN
  li t0, 16384
  or a0, a0, t0
.L6:
  ; sci/calc.e16.ts:708  return bits
.return:
  ret

; sci/calc.e16.ts:712 drawCalc() at -O1
drawCalc:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:713  cls()
  call cls
  ; sci/calc.e16.ts:714  drawLine()
  call drawLine
  ; sci/calc.e16.ts:715  if (answered) drawAnswer()
  lw t0, 0x0298(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:715  drawAnswer()
  call drawAnswer
.L1:
  ; sci/calc.e16.ts:716  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:720 charsTo(n) at -O1
;   n in s3
;   c in s2
;   i in s1
charsTo:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  mv s3, a0 ; n
  ; sci/calc.e16.ts:721  let c: u16 = 0
  li s2, 0 ; c
  ; sci/calc.e16.ts:722  for (let i: u16 = 0; i < n; i++) c += tokenWidth(line[i])
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/calc.e16.ts:722  c += tokenWidth(line[i])
  lbu a0, line(s1)
  call tokenWidth
  add s2, s2, a0
  addi s1, s1, 1
.L3:
  bltu s1, s3, .L1
  ; sci/calc.e16.ts:723  return c
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:730 drawLine() at -O1
;   at in s1
;   c in s0
;   i/shown in s2
;   t in 0(sp)
;   text/p in s3
drawLine:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s1, 4(sp)
  sw s0, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  ; sci/calc.e16.ts:731  const at = charsTo(cursor)
  lw a0, 0x0296(zero)
  call charsTo
  mv s1, a0 ; at
  ; sci/calc.e16.ts:732  if (at < scrollFrom) scrollFrom = at - (at % COLS)
  lw t0, 0x02a4(zero)
  bgeu s1, t0, .L1
  ; sci/calc.e16.ts:732  scrollFrom = at - (at % COLS)
  li t1, 34329
  mulhu t1, s1, t1
  sub t0, s1, t1
  srli t0, t0, 1
  add t0, t0, t1
  srli t0, t0, 4
  li t1, 21
  mul t0, t0, t1
  sub t0, s1, t0
  sub t0, s1, t0
  sw t0, 0x02a4(zero)
.L1:
  ; sci/calc.e16.ts:733  if (at >= scrollFrom + LINE_CHARS) scrollFrom = at - (at % COLS) - (LINE_ROWS - 1) * COLS
  lw t0, 0x02a4(zero)
  addi t0, t0, 84
  bltu s1, t0, .L2
  ; sci/calc.e16.ts:733  scrollFrom = at - (at % COLS) - (LINE_ROWS - 1) * COLS
  li t1, 34329
  mulhu t1, s1, t1
  sub t0, s1, t1
  srli t0, t0, 1
  add t0, t0, t1
  srli t0, t0, 4
  li t1, 21
  mul t0, t0, t1
  sub t0, s1, t0
  sub t0, s1, t0
  addi t0, t0, -63
  sw t0, 0x02a4(zero)
.L2:
  ; sci/calc.e16.ts:734  let c: u16 = 0
  li s0, 0 ; c
  ; sci/calc.e16.ts:735  for (let i: u16 = 0; i < length; i++) {
  li s2, 0 ; i/shown
  j .L5
.L3:
  ; sci/calc.e16.ts:736  const t = line[i]
  lbu t0, line(s2)
  sw t0, 0(sp) ; t
  ; sci/calc.e16.ts:737  const text = tokenText(t)
  lw a0, 0(sp)
  call tokenText
  mv s3, a0 ; text/p
  ; sci/calc.e16.ts:738  if (text === 0) {
  bne s3, zero, .L7
  ; sci/calc.e16.ts:739  showChar(t, c)
  lw a0, 0(sp)
  mv a1, s0
  call showChar
  ; sci/calc.e16.ts:740  c++
  addi s0, s0, 1
  j .L8
.L7:
  ; sci/calc.e16.ts:742  let p = text
  ; sci/calc.e16.ts:743  while (peek(p) !== 0) {
  j .L11
.L9:
  ; sci/calc.e16.ts:744  showChar(peek(p), c)
  lbu a0, 0(s3)
  mv a1, s0
  call showChar
  ; sci/calc.e16.ts:745  c++
  addi s0, s0, 1
  ; sci/calc.e16.ts:746  p++
  addi s3, s3, 1
.L11:
  lbu t0, 0(s3)
  bne t0, zero, .L9
.L8:
  addi s2, s2, 1
.L5:
  lw t0, 0x0294(zero)
  bltu s2, t0, .L3
  ; sci/calc.e16.ts:750  if (answered) {
  lw t0, 0x0298(zero)
  beqz t0, .L13
  ; sci/calc.e16.ts:751  noCursor()
  ; sci/lcd.e16.ts:161  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:752  return
  j .return
.L13:
  ; sci/calc.e16.ts:754  const shown = at - scrollFrom
  lw t0, 0x02a4(zero)
  sub s2, s1, t0
  ; sci/calc.e16.ts:755  barAt(shown % COLS, div(shown, COLS))
  li t1, 34329
  mulhu t1, s2, t1
  sub t0, s2, t1
  srli t0, t0, 1
  add t0, t0, t1
  srli t0, t0, 4
  li t1, 21
  mul t0, t0, t1
  sub a0, s2, t0
  li t2, 34329
  mulhu t2, s2, t2
  sub t1, s2, t2
  srli t1, t1, 1
  add t1, t1, t2
  srli a1, t1, 4
  call barAt
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  addi sp, sp, 12
  ret

; sci/calc.e16.ts:759 showChar(ch, c/shown) at -O1
;   ch in s2
;   c/shown in s1
showChar:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; ch
  mv s1, a1 ; c/shown
  ; sci/calc.e16.ts:760  if (c < scrollFrom || c >= scrollFrom + LINE_CHARS) return
  lw t0, 0x02a4(zero)
  bltu s1, t0, .L2
  lw t0, 0x02a4(zero)
  addi t0, t0, 84
  bltu s1, t0, .L1
.L2:
  ; sci/calc.e16.ts:760  return
  j .return
.L1:
  ; sci/calc.e16.ts:761  const shown = c - scrollFrom
  lw t0, 0x02a4(zero)
  sub s1, s1, t0
  ; sci/calc.e16.ts:762  drawChar(ch, shown % COLS, div(shown, COLS))
  li t1, 34329
  mulhu t1, s1, t1
  sub t0, s1, t1
  srli t0, t0, 1
  add t0, t0, t1
  srli t0, t0, 4
  li t1, 21
  mul t0, t0, t1
  sub a1, s1, t0
  li t2, 34329
  mulhu t2, s1, t2
  sub t1, s1, t2
  srli t1, t1, 1
  add t1, t1, t2
  srli a2, t1, 4
  mv a0, s2
  call drawChar
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:769 drawAnswer() at -O1
;   n/exponent in s2
;   mantissa in s3
;   i/right/digits/x in s1
drawAnswer:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; sci/calc.e16.ts:770  clearBand(5)
  li a0, 5
  call clearBand
  ; sci/calc.e16.ts:771  clearBand(6)
  li a0, 6
  call clearBand
  ; sci/calc.e16.ts:772  clearBand(7)
  li a0, 7
  call clearBand
  ; sci/calc.e16.ts:773  poke16(MATH_ARG, 10)
  li t0, 10
  li t1, 65366
  sw t0, 0(t1)
  ; sci/calc.e16.ts:774  math(M_FORMAT, KEEP_ANS, addr(answerText), 0)
  li a0, 57
  li a1, 1032
  la a2, answerText
  li a3, 0
  call math
  ; sci/calc.e16.ts:775  const n = peek16(MATH_ARG)
  li t0, 65366
  lw s2, 0(t0)
  ; sci/calc.e16.ts:776  poke(addr(answerText) + n, 0)
  sb zero, answerText(s2)
  ; sci/calc.e16.ts:777  let mantissa = n
  mv s3, s2 ; mantissa
  ; sci/calc.e16.ts:778  for (let i: u16 = 0; i < n; i++) {
  li s1, 0 ; i/right/digits/x
  j .L3
.L1:
  ; sci/calc.e16.ts:779  if (answerText[i] === 0x45) mantissa = i
  lbu t0, answerText(s1)
  li t1, 69
  bne t0, t1, .L5
  ; sci/calc.e16.ts:779  mantissa = i
  mv s3, s1 ; mantissa
.L5:
  addi s1, s1, 1
.L3:
  bltu s1, s2, .L1
  ; sci/calc.e16.ts:781  let right: u16 = 127
  li s1, 127 ; i/right/digits/x
  ; sci/calc.e16.ts:782  if (mantissa < n) {
  bgeu s3, s2, .L6
  ; sci/calc.e16.ts:784  const exponent = addr(answerText) + mantissa + 1
  addi s2, s3, answerText+1
  ; sci/calc.e16.ts:785  let digits: u16 = 0
  li s1, 0 ; i/right/digits/x
  ; sci/calc.e16.ts:786  while (peek(exponent + digits) !== 0) digits++
  j .L9
.L7:
  ; sci/calc.e16.ts:786  digits++
  addi s1, s1, 1
.L9:
  add t0, s2, s1
  lbu t0, 0(t0)
  bne t0, zero, .L7
  ; sci/calc.e16.ts:787  const x = 128 - digits * 6
  slli t1, s1, 2
  slli t0, s1, 1
  add t0, t0, t1
  li t1, 128
  sub s1, t1, t0
  ; sci/calc.e16.ts:788  textAt(exponent, x, 48)
  mv a0, s2
  mv a1, s1
  li a2, 48
  call textAt
  ; sci/calc.e16.ts:789  textAt(str('\x8110'), x - 18, 55)
  la a0, str_18
  addi a1, s1, -18
  li a2, 55
  call textAt
  ; sci/calc.e16.ts:790  right = x - 19
  addi s1, s1, -19
.L6:
  ; sci/calc.e16.ts:792  bigNumber(addr(answerText), mantissa, right)
  la a0, answerText
  mv a1, s3
  mv a2, s1
  call bigNumber
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

str_0:
  .byte 115, 105, 110, 40, 0
str_1:
  .byte 99, 111, 115, 40, 0
str_2:
  .byte 116, 97, 110, 40, 0
str_3:
  .byte 115, 105, 110, 134, 40, 0
str_4:
  .byte 99, 111, 115, 134, 40, 0
str_5:
  .byte 116, 97, 110, 134, 40, 0
str_6:
  .byte 108, 111, 103, 40, 0
str_7:
  .byte 108, 110, 40, 0
str_8:
  .byte 131, 40, 0
str_9:
  .byte 133, 131, 40, 0
str_10:
  .byte 45, 0
str_11:
  .byte 94, 40, 0
str_12:
  .byte 67, 0
str_13:
  .byte 80, 0
str_14:
  .byte 65, 110, 115, 0
str_15:
  .byte 49, 48, 0
str_16:
  .byte 69, 76, 69, 67, 45, 49, 54, 32, 83, 67, 73, 0
str_17:
  .byte 83, 67, 73, 45, 49, 50, 56, 0
str_18:
  .byte 129, 49, 48, 0
  .align 2
e16c_fixed_end:

  .bank 0
  .org 0xc000
; sci/eval.e16.ts:99 tok() at -O1
tok:
  ; sci/eval.e16.ts:100  return pos < lineLength ? peek(lineAt + pos) : 0
  lw t0, 0x02c2(zero)
  lw t1, 0x02c0(zero)
  bgeu t0, t1, .L1
  lw t0, 0x02be(zero)
  lw t1, 0x02c2(zero)
  add t0, t0, t1
  lbu t0, 0(t0)
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
.return:
  ret

; sci/eval.e16.ts:107 evaluate(at, length) at -O1
;   at in s2
;   length in s1
evaluate:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; at
  mv s1, a1 ; length
  ; sci/eval.e16.ts:108  lineAt = at
  sw s2, 0x02be(zero)
  ; sci/eval.e16.ts:109  lineLength = length
  sw s1, 0x02c0(zero)
  ; sci/eval.e16.ts:110  pos = 0
  sw zero, 0x02c2(zero)
  ; sci/eval.e16.ts:111  poke16(MATH_ANGLE, peek(KEEP_ANGLE))
  lbu t0, 1026(zero)
  li t1, 65372
  sw t0, 0(t1)
  ; sci/eval.e16.ts:112  if (length === 0) fail(E_SYNTAX, 0)
  bne s1, zero, .L1
  ; sci/eval.e16.ts:112  fail(E_SYNTAX, 0)
  li a0, 2
  li a1, 0
  call fail
.L1:
  ; sci/eval.e16.ts:113  sum()
  call sum
  ; sci/eval.e16.ts:114  if (pos < lineLength) fail(E_SYNTAX, pos)
  lw t0, 0x02c2(zero)
  lw t1, 0x02c0(zero)
  bgeu t0, t1, .L2
  ; sci/eval.e16.ts:114  fail(E_SYNTAX, pos)
  lw a1, 0x02c2(zero)
  li a0, 2
  call fail
.L2:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:117 sum() at -O1
;   t in s1
;   at in s2
sum:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:118  prod()
  call prod
  ; sci/eval.e16.ts:119  for (;;) {
.L1:
  ; sci/eval.e16.ts:120  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:121  if (t !== T_PLUS && t !== T_MINUS) return
  li t0, 43
  beq s1, t0, .L5
  li t0, 45
  beq s1, t0, .L5
  ; sci/eval.e16.ts:121  return
  j .return
.L5:
  ; sci/eval.e16.ts:122  const at = pos
  lw s2, 0x02c2(zero)
  ; sci/eval.e16.ts:123  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
  ; sci/eval.e16.ts:124  prod()
  call prod
  ; sci/eval.e16.ts:125  binary(t === T_PLUS ? M_ADD : M_SUB, at)
  li t0, 43
  bne s1, t0, .L6
  li t0, 1
  j .L7
.L6:
  li t0, 2
.L7:
  mv a0, t0
  mv a1, s2
  call binary
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:129 prod() at -O1
;   t in s1
;   at in s2
prod:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:130  implied()
  call implied
  ; sci/eval.e16.ts:131  for (;;) {
.L1:
  ; sci/eval.e16.ts:132  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:133  if (t !== T_TIMES && t !== T_DIVIDE) return
  li t0, 129
  beq s1, t0, .L5
  li t0, 130
  beq s1, t0, .L5
  ; sci/eval.e16.ts:133  return
  j .return
.L5:
  ; sci/eval.e16.ts:134  const at = pos
  lw s2, 0x02c2(zero)
  ; sci/eval.e16.ts:135  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
  ; sci/eval.e16.ts:136  implied()
  call implied
  ; sci/eval.e16.ts:137  binary(t === T_TIMES ? M_MUL : M_DIV, at)
  li t0, 129
  bne s1, t0, .L6
  li t0, 3
  j .L7
.L6:
  li t0, 4
.L7:
  mv a0, t0
  mv a1, s2
  call binary
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:142 startsValue(t) at -O1
;   t in s1
startsValue:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/eval.e16.ts:143  return (
  mv a0, s1
  call isDigit
  mv t1, a0
  mv t0, a0
  bnez t1, .L9
  li t0, 46
  sub t0, s1, t0
  seqz t0, t0
.L9:
  mv t1, t0
  bnez t1, .L8
  li t0, 135
  sub t0, s1, t0
  seqz t0, t0
.L8:
  mv t1, t0
  bnez t1, .L7
  li t0, 40
  sub t0, s1, t0
  seqz t0, t0
.L7:
  mv t1, t0
  bnez t1, .L6
  li t0, 128
  sub t0, s1, t0
  seqz t0, t0
.L6:
  mv t1, t0
  bnez t1, .L5
  li t0, 101
  sub t0, s1, t0
  seqz t0, t0
.L5:
  mv t1, t0
  bnez t1, .L4
  li t0, 20
  sub t0, s1, t0
  seqz t0, t0
.L4:
  mv t1, t0
  bnez t1, .L3
  li t0, 21
  sub t0, s1, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  mv a0, s1
  call isFunction
  mv t0, a0
.L2:
  mv t1, t0
  bnez t1, .L1
  mv a0, s1
  call isVariable
  mv t0, a0
.L1:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:157 implied() at -O1
;   at in s1
implied:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/eval.e16.ts:158  comb()
  call comb
  ; sci/eval.e16.ts:159  while (startsValue(tok())) {
  j .L3
.L1:
  ; sci/eval.e16.ts:160  const at = pos
  lw s1, 0x02c2(zero)
  ; sci/eval.e16.ts:161  comb()
  call comb
  ; sci/eval.e16.ts:162  binary(M_MUL, at)
  li a0, 3
  mv a1, s1
  call binary
.L3:
  call tok
  call startsValue
  bnez a0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:166 comb() at -O1
;   t in s1
;   at in s2
comb:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:167  unary()
  call unary
  ; sci/eval.e16.ts:168  for (;;) {
.L1:
  ; sci/eval.e16.ts:169  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:170  if (t !== T_NCR && t !== T_NPR) return
  li t0, 18
  beq s1, t0, .L5
  li t0, 19
  beq s1, t0, .L5
  ; sci/eval.e16.ts:170  return
  j .return
.L5:
  ; sci/eval.e16.ts:171  const at = pos
  lw s2, 0x02c2(zero)
  ; sci/eval.e16.ts:172  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
  ; sci/eval.e16.ts:173  unary()
  call unary
  ; sci/eval.e16.ts:174  choose(t === T_NCR, at)
  li t0, 18
  sub t0, s1, t0
  seqz a0, t0
  mv a1, s2
  call choose
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:178 unary() at -O1
;   t/at in s1
unary:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/eval.e16.ts:179  const t = tok()
  call tok
  mv s1, a0 ; t/at
  ; sci/eval.e16.ts:180  if (t === T_NEG || t === T_MINUS) {
  li t0, 16
  beq s1, t0, .L2
  li t0, 45
  bne s1, t0, .L1
.L2:
  ; sci/eval.e16.ts:181  const at = pos
  lw s1, 0x02c2(zero)
  ; sci/eval.e16.ts:182  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
  ; sci/eval.e16.ts:183  unary()
  call unary
  ; sci/eval.e16.ts:184  math(M_NEG, top(), 0, at)
  call top
  mv a1, a0
  li a0, 16
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:185  return
  j .return
.L1:
  ; sci/eval.e16.ts:187  if (t === T_PLUS) {
  li t0, 43
  bne s1, t0, .L3
  ; sci/eval.e16.ts:188  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
  ; sci/eval.e16.ts:189  unary()
  call unary
  ; sci/eval.e16.ts:190  return
  j .return
.L3:
  ; sci/eval.e16.ts:192  post()
  call post
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:195 post() at -O1
;   t in s1
;   at in s2
post:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:196  primary()
  call primary
  ; sci/eval.e16.ts:197  for (;;) {
.L1:
  ; sci/eval.e16.ts:198  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:199  const at = pos
  lw s2, 0x02c2(zero)
  ; sci/eval.e16.ts:200  if (t === T_POW) {
  li t0, 17
  bne s1, t0, .L5
  ; sci/eval.e16.ts:201  powers()
  call powers
  j .L1
.L5:
  ; sci/eval.e16.ts:202  if (t === T_SQUARE) {
  li t0, 132
  bne s1, t0, .L7
  ; sci/eval.e16.ts:203  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
  ; sci/eval.e16.ts:204  raise(2, at)
  li a0, 2
  mv a1, s2
  call raise
  j .L1
.L7:
  ; sci/eval.e16.ts:205  if (t === T_CUBE) {
  li t0, 133
  bne s1, t0, .L9
  ; sci/eval.e16.ts:206  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
  ; sci/eval.e16.ts:207  raise(3, at)
  li a0, 3
  mv a1, s2
  call raise
  j .L1
.L9:
  ; sci/eval.e16.ts:208  if (t === T_INVERSE) {
  li t0, 134
  bne s1, t0, .L11
  ; sci/eval.e16.ts:209  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
  ; sci/eval.e16.ts:210  inverse(at)
  mv a0, s2
  call inverse
  j .L1
.L11:
  ; sci/eval.e16.ts:211  if (t === T_BANG) {
  li t0, 33
  bne s1, t0, .L13
  ; sci/eval.e16.ts:212  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
  ; sci/eval.e16.ts:213  factorial(at)
  mv a0, s2
  call factorial
  j .L1
.L13:
  ; sci/eval.e16.ts:214  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:219 powers() at -O1
;   at in s1
powers:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/eval.e16.ts:220  const at = pos
  lw s1, 0x02c2(zero)
  ; sci/eval.e16.ts:221  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
  ; sci/eval.e16.ts:222  sum()
  call sum
  ; sci/eval.e16.ts:223  if (tok() === T_CLOSE) pos++
  call tok
  li t0, 41
  bne a0, t0, .L1
  ; sci/eval.e16.ts:223  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
.L1:
  ; sci/eval.e16.ts:225  if (tok() === T_POW) powers()
  call tok
  li t0, 17
  bne a0, t0, .L2
  ; sci/eval.e16.ts:225  powers()
  call powers
.L2:
  ; sci/eval.e16.ts:226  binary(M_POW, at)
  li a0, 5
  mv a1, s1
  call binary
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:229 raise(n, at) at -O1
;   n in s2
;   at in s1
raise:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; n
  mv s1, a1 ; at
  ; sci/eval.e16.ts:230  pushInt(n, at)
  mv a0, s2
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:231  binary(M_POW, at)
  li a0, 5
  mv a1, s1
  call binary
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:235 inverse(at) at -O1
;   at in s1
;   x in s2
;   one in s3
inverse:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; at
  ; sci/eval.e16.ts:236  const x = top()
  call top
  mv s2, a0 ; x
  ; sci/eval.e16.ts:237  const one = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  mv s3, a0 ; one
  ; sci/eval.e16.ts:238  math(M_DIV, one, x, at)
  li a0, 4
  mv a1, s3
  mv a2, s2
  mv a3, s1
  call math
  ; sci/eval.e16.ts:239  copy8(one, x)
  mv a0, s3
  mv a1, s2
  call copy8
  ; sci/eval.e16.ts:240  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/eval.e16.ts:244 factorial(at) at -O1
;   at in s1
;   x in s3
;   n in s0
;   f in 0(sp)
;   k in s2
factorial:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  sw s2, 10(sp)
  mv s1, a0 ; at
  ; sci/eval.e16.ts:245  const x = top()
  call top
  mv s3, a0 ; x
  ; sci/eval.e16.ts:246  const n = smallWhole(x, at)
  mv a0, s3
  mv a1, s1
  call smallWhole
  mv s0, a0 ; n
  ; sci/eval.e16.ts:247  if (n > 69) fail(E_MATH, at)
  li t0, 69
  bgeu t0, s0, .L1
  ; sci/eval.e16.ts:247  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L1:
  ; sci/eval.e16.ts:248  const f = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  sw a0, 0(sp) ; f
  ; sci/eval.e16.ts:249  for (let k: u16 = 2; k <= n; k++) {
  li s2, 2 ; k
  j .L4
.L2:
  ; sci/eval.e16.ts:250  pushInt(k, at)
  mv a0, s2
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:251  binary(M_MUL, at)
  li a0, 3
  mv a1, s1
  call binary
  addi s2, s2, 1
.L4:
  bgeu s0, s2, .L2
  ; sci/eval.e16.ts:253  copy8(f, x)
  lw a0, 0(sp)
  mv a1, s3
  call copy8
  ; sci/eval.e16.ts:254  pop()
  call pop
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  lw s2, 10(sp)
  addi sp, sp, 12
  ret

; sci/eval.e16.ts:258 choose(c, at) at -O1
;   c in 2(sp)
;   at in s1
;   r/rv in s2
;   n in s0
;   nv in 0(sp)
;   out in 4(sp)
;   k in s3
choose:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  sw s3, 14(sp)
  sw a0, 2(sp) ; c
  mv s1, a1 ; at
  ; sci/eval.e16.ts:259  const r = top()
  call top
  mv s2, a0 ; r/rv
  ; sci/eval.e16.ts:260  const n = r - 8
  addi s0, s2, -8
  ; sci/eval.e16.ts:261  const nv = smallWhole(n, at)
  mv a0, s0
  mv a1, s1
  call smallWhole
  sw a0, 0(sp) ; nv
  ; sci/eval.e16.ts:262  const rv = smallWhole(r, at)
  mv a0, s2
  mv a1, s1
  call smallWhole
  mv s2, a0 ; r/rv
  ; sci/eval.e16.ts:263  if (rv > nv) fail(E_MATH, at)
  lw t0, 0(sp) ; nv
  bgeu t0, s2, .L1
  ; sci/eval.e16.ts:263  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L1:
  ; sci/eval.e16.ts:264  const out = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  sw a0, 4(sp) ; out
  ; sci/eval.e16.ts:265  for (let k: u16 = 0; k < rv; k++) {
  li s3, 0 ; k
  j .L4
.L2:
  ; sci/eval.e16.ts:266  pushInt(nv - k, at)
  lw t0, 0(sp) ; nv
  sub a0, t0, s3
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:267  binary(M_MUL, at)
  li a0, 3
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:268  if (c) {
  lw t0, 2(sp) ; c
  beqz t0, .L6
  ; sci/eval.e16.ts:269  pushInt(k + 1, at)
  addi a0, s3, 1
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:270  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
.L6:
  addi s3, s3, 1
.L4:
  bltu s3, s2, .L2
  ; sci/eval.e16.ts:273  copy8(out, n)
  lw a0, 4(sp)
  mv a1, s0
  call copy8
  ; sci/eval.e16.ts:274  pop()
  call pop
  ; sci/eval.e16.ts:275  pop()
  call pop
.return:
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  lw s3, 14(sp)
  addi sp, sp, 16
  ret

; sci/eval.e16.ts:278 primary() at -O1
;   t/n in s1
;   at in s2
primary:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:279  const t = tok()
  call tok
  mv s1, a0 ; t/n
  ; sci/eval.e16.ts:280  const at = pos
  lw s2, 0x02c2(zero)
  ; sci/eval.e16.ts:281  if (isDigit(t) || t === T_POINT || t === T_EXP) {
  mv a0, s1
  call isDigit
  bnez a0, .L2
  li t0, 46
  beq s1, t0, .L2
  li t0, 135
  bne s1, t0, .L1
.L2:
  ; sci/eval.e16.ts:282  number()
  call number
  ; sci/eval.e16.ts:283  return
  j .return
.L1:
  ; sci/eval.e16.ts:285  if (t === 0) fail(E_SYNTAX, at)
  bne s1, zero, .L3
  ; sci/eval.e16.ts:285  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s2
  call fail
.L3:
  ; sci/eval.e16.ts:286  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
  ; sci/eval.e16.ts:287  if (t === T_PI) {
  li t0, 128
  bne s1, t0, .L4
  ; sci/eval.e16.ts:288  math(M_PI, push(at), 0, at)
  mv a0, s2
  call push
  mv a1, a0
  li a0, 32
  li a2, 0
  mv a3, s2
  call math
  j .L5
.L4:
  ; sci/eval.e16.ts:289  if (t === T_E) {
  li t0, 101
  bne s1, t0, .L6
  ; sci/eval.e16.ts:290  const n = pushInt(1, at)
  li a0, 1
  mv a1, s2
  call pushInt
  mv s1, a0 ; t/n
  ; sci/eval.e16.ts:291  math(M_EXP, n, 0, at)
  li a0, 30
  mv a1, s1
  li a2, 0
  mv a3, s2
  call math
  j .L7
.L6:
  ; sci/eval.e16.ts:292  if (t === T_TEN) {
  li t0, 21
  bne s1, t0, .L8
  ; sci/eval.e16.ts:293  pushInt(10, at)
  li a0, 10
  mv a1, s2
  call pushInt
  j .L9
.L8:
  ; sci/eval.e16.ts:294  if (t === T_ANS) {
  li t0, 20
  bne s1, t0, .L10
  ; sci/eval.e16.ts:295  copy8(KEEP_ANS, push(at))
  mv a0, s2
  call push
  mv a1, a0
  li a0, 1032
  call copy8
  j .L11
.L10:
  ; sci/eval.e16.ts:296  if (isVariable(t)) {
  mv a0, s1
  call isVariable
  beqz a0, .L12
  ; sci/eval.e16.ts:297  copy8(varAt(t), push(at))
  mv a0, s1
  call varAt
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  call push
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  j .L13
.L12:
  ; sci/eval.e16.ts:298  if (t === T_OPEN) {
  li t0, 40
  bne s1, t0, .L14
  ; sci/eval.e16.ts:299  sum()
  call sum
  ; sci/eval.e16.ts:300  if (tok() === T_CLOSE) pos++
  call tok
  li t0, 41
  bne a0, t0, .L16
  ; sci/eval.e16.ts:300  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
  j .L16
.L14:
  ; sci/eval.e16.ts:301  if (isFunction(t)) {
  mv a0, s1
  call isFunction
  beqz a0, .L17
  ; sci/eval.e16.ts:302  sum()
  call sum
  ; sci/eval.e16.ts:303  if (tok() === T_CLOSE) pos++
  call tok
  li t0, 41
  bne a0, t0, .L18
  ; sci/eval.e16.ts:303  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
.L18:
  ; sci/eval.e16.ts:304  apply(t, at)
  mv a0, s1
  mv a1, s2
  call apply
  j .L19
.L17:
  ; sci/eval.e16.ts:305  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s2
  call fail
.L19:
.L16:
.L13:
.L11:
.L9:
.L7:
.L5:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:312 number() at -O1
;   at in s0
;   n in s1
;   points/v in s2
;   digits in s3
number:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  ; sci/eval.e16.ts:313  const at = pos
  lw s0, 0x02c2(zero)
  ; sci/eval.e16.ts:314  let n: u16 = 0
  li s1, 0 ; n
  ; sci/eval.e16.ts:315  let points: u16 = 0
  li s2, 0 ; points/v
  ; sci/eval.e16.ts:316  let digits: u16 = 0
  li s3, 0 ; digits
  ; sci/eval.e16.ts:317  while (isDigit(tok()) || tok() === T_POINT) {
  j .L3
.L1:
  ; sci/eval.e16.ts:318  if (tok() === T_POINT) points++
  call tok
  li t0, 46
  bne a0, t0, .L5
  ; sci/eval.e16.ts:318  points++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/eval.e16.ts:319  digits++
  addi s3, s3, 1
.L6:
  ; sci/eval.e16.ts:320  if (n < 30) {
  li t0, 30
  bgeu s1, t0, .L7
  ; sci/eval.e16.ts:321  poke(addr(numberText) + n, tok())
  call tok
  sb a0, numberText(s1)
  ; sci/eval.e16.ts:322  n++
  addi s1, s1, 1
.L7:
  ; sci/eval.e16.ts:324  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
.L3:
  call tok
  call isDigit
  bnez a0, .L1
  call tok
  li t0, 46
  beq a0, t0, .L1
  ; sci/eval.e16.ts:326  if (points > 1 || (points === 1 && digits === 0)) fail(E_SYNTAX, at)
  li t0, 1
  bltu t0, s2, .L9
  li t0, 1
  bne s2, t0, .L8
  bne s3, zero, .L8
.L9:
  ; sci/eval.e16.ts:326  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s0
  call fail
.L8:
  ; sci/eval.e16.ts:327  if (tok() === T_EXP) n = exponentPart(digits === 0 ? 0 : n)
  call tok
  li t0, 135
  bne a0, t0, .L10
  ; sci/eval.e16.ts:327  n = exponentPart(digits === 0 ? 0 : n)
  bne s3, zero, .L11
  li t0, 0
  j .L12
.L11:
  mv t0, s1
.L12:
  mv a0, t0
  call exponentPart
  mv s1, a0 ; n
.L10:
  ; sci/eval.e16.ts:328  poke(addr(numberText) + n, 0)
  sb zero, numberText(s1)
  ; sci/eval.e16.ts:329  const v = push(at)
  mv a0, s0
  call push
  mv s2, a0 ; points/v
  ; sci/eval.e16.ts:330  poke16(MATH_ARG, n)
  li t0, 65366
  sw s1, 0(t0)
  ; sci/eval.e16.ts:331  math(M_PARSE, v, addr(numberText), at)
  li a0, 56
  mv a1, s2
  la a2, numberText
  mv a3, s0
  call math
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/eval.e16.ts:338 exponentPart(n/k) at -O1
;   n/k in s1
exponentPart:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n/k
  ; sci/eval.e16.ts:339  let k = n
  ; sci/eval.e16.ts:340  if (k === 0) {
  bne s1, zero, .L1
  ; sci/eval.e16.ts:341  poke(addr(numberText), 0x31)
  li t0, 49
  sb t0, numberText(zero)
  ; sci/eval.e16.ts:342  k = 1
  li s1, 1 ; n/k
.L1:
  ; sci/eval.e16.ts:344  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
  ; sci/eval.e16.ts:345  poke(addr(numberText) + k, 0x45)
  li t0, 69
  sb t0, numberText(s1)
  ; sci/eval.e16.ts:346  k++
  addi s1, s1, 1
  ; sci/eval.e16.ts:347  if (tok() === T_NEG || tok() === T_MINUS) {
  call tok
  li t0, 16
  beq a0, t0, .L3
  call tok
  li t0, 45
  bne a0, t0, .L2
.L3:
  ; sci/eval.e16.ts:348  poke(addr(numberText) + k, 0x2d)
  li t0, 45
  sb t0, numberText(s1)
  ; sci/eval.e16.ts:349  k++
  addi s1, s1, 1
  ; sci/eval.e16.ts:350  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
.L2:
  ; sci/eval.e16.ts:352  if (!isDigit(tok())) fail(E_SYNTAX, pos)
  call tok
  call isDigit
  bnez a0, .L7
  ; sci/eval.e16.ts:352  fail(E_SYNTAX, pos)
  lw a1, 0x02c2(zero)
  li a0, 2
  call fail
  ; sci/eval.e16.ts:353  while (isDigit(tok())) {
  j .L7
.L5:
  ; sci/eval.e16.ts:354  if (k < 31) {
  li t0, 31
  bgeu s1, t0, .L9
  ; sci/eval.e16.ts:355  poke(addr(numberText) + k, tok())
  call tok
  sb a0, numberText(s1)
  ; sci/eval.e16.ts:356  k++
  addi s1, s1, 1
.L9:
  ; sci/eval.e16.ts:358  pos++
  lw t0, 0x02c2(zero)
  addi t0, t0, 1
  sw t0, 0x02c2(zero)
.L7:
  call tok
  call isDigit
  bnez a0, .L5
  ; sci/eval.e16.ts:360  return k
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:364 apply(f, at) at -O1
;   f in s1
;   at in s2
;   x in s3
apply:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; f
  mv s2, a1 ; at
  ; sci/eval.e16.ts:365  const x = top()
  call top
  mv s3, a0 ; x
  ; sci/eval.e16.ts:366  if (f === T_SIN) math(M_SIN, x, 0, at)
  li t0, 1
  bne s1, t0, .L1
  ; sci/eval.e16.ts:366  math(M_SIN, x, 0, at)
  li a0, 22
  mv a1, s3
  li a2, 0
  mv a3, s2
  call math
  j .L2
.L1:
  ; sci/eval.e16.ts:367  if (f === T_COS) math(M_COS, x, 0, at)
  li t0, 2
  bne s1, t0, .L3
  ; sci/eval.e16.ts:367  math(M_COS, x, 0, at)
  li a0, 23
  mv a1, s3
  li a2, 0
  mv a3, s2
  call math
  j .L4
.L3:
  ; sci/eval.e16.ts:368  if (f === T_TAN) math(M_TAN, x, 0, at)
  li t0, 3
  bne s1, t0, .L5
  ; sci/eval.e16.ts:368  math(M_TAN, x, 0, at)
  li a0, 24
  mv a1, s3
  li a2, 0
  mv a3, s2
  call math
  j .L6
.L5:
  ; sci/eval.e16.ts:369  if (f === T_ASIN) math(M_ASN, x, 0, at)
  li t0, 4
  bne s1, t0, .L7
  ; sci/eval.e16.ts:369  math(M_ASN, x, 0, at)
  li a0, 25
  mv a1, s3
  li a2, 0
  mv a3, s2
  call math
  j .L8
.L7:
  ; sci/eval.e16.ts:370  if (f === T_ACOS) math(M_ACS, x, 0, at)
  li t0, 5
  bne s1, t0, .L9
  ; sci/eval.e16.ts:370  math(M_ACS, x, 0, at)
  li a0, 26
  mv a1, s3
  li a2, 0
  mv a3, s2
  call math
  j .L10
.L9:
  ; sci/eval.e16.ts:371  if (f === T_ATAN) math(M_ATN, x, 0, at)
  li t0, 6
  bne s1, t0, .L11
  ; sci/eval.e16.ts:371  math(M_ATN, x, 0, at)
  li a0, 27
  mv a1, s3
  li a2, 0
  mv a3, s2
  call math
  j .L12
.L11:
  ; sci/eval.e16.ts:372  if (f === T_LOG) math(M_LOG, x, 0, at)
  li t0, 7
  bne s1, t0, .L13
  ; sci/eval.e16.ts:372  math(M_LOG, x, 0, at)
  li a0, 29
  mv a1, s3
  li a2, 0
  mv a3, s2
  call math
  j .L14
.L13:
  ; sci/eval.e16.ts:373  if (f === T_LN) math(M_LN, x, 0, at)
  li t0, 8
  bne s1, t0, .L15
  ; sci/eval.e16.ts:373  math(M_LN, x, 0, at)
  li a0, 28
  mv a1, s3
  li a2, 0
  mv a3, s2
  call math
  j .L16
.L15:
  ; sci/eval.e16.ts:374  if (f === T_SQRT) math(M_SQR, x, 0, at)
  li t0, 9
  bne s1, t0, .L17
  ; sci/eval.e16.ts:374  math(M_SQR, x, 0, at)
  li a0, 21
  mv a1, s3
  li a2, 0
  mv a3, s2
  call math
  j .L18
.L17:
  ; sci/eval.e16.ts:375  if (f === T_CBRT) cubeRoot(x, at)
  li t0, 10
  bne s1, t0, .L19
  ; sci/eval.e16.ts:375  cubeRoot(x, at)
  mv a0, s3
  mv a1, s2
  call cubeRoot
.L19:
.L18:
.L16:
.L14:
.L12:
.L10:
.L8:
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/eval.e16.ts:379 cubeRoot(x, at) at -O1
;   x in s2
;   at in s1
;   negative in s3
;   third in s0
cubeRoot:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s2, a0 ; x
  mv s1, a1 ; at
  ; sci/eval.e16.ts:380  if (isZero(x)) return
  mv a0, s2
  call isZero
  beqz a0, .L1
  ; sci/eval.e16.ts:380  return
  j .return
.L1:
  ; sci/eval.e16.ts:381  const negative = isNegative(x)
  mv a0, s2
  call isNegative
  mv s3, a0 ; negative
  ; sci/eval.e16.ts:382  if (negative) math(M_NEG, x, 0, at)
  beqz s3, .L2
  ; sci/eval.e16.ts:382  math(M_NEG, x, 0, at)
  li a0, 16
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
.L2:
  ; sci/eval.e16.ts:383  const third = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  mv s0, a0 ; third
  ; sci/eval.e16.ts:384  pushInt(3, at)
  li a0, 3
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:385  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:386  math(M_POW, x, third, at)
  li a0, 5
  mv a1, s2
  mv a2, s0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:387  pop()
  call pop
  ; sci/eval.e16.ts:388  if (negative) math(M_NEG, x, 0, at)
  beqz s3, .L3
  ; sci/eval.e16.ts:388  math(M_NEG, x, 0, at)
  li a0, 16
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
.L3:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

  .align 2

  .bank 1
  .org 0xc000
; sci/screens.e16.ts:13 errorScreen(code) at -O1
;   code in s1
errorScreen:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; code
  ; sci/screens.e16.ts:14  if (code === E_MATH) {
  li t0, 1
  bne s1, t0, .L1
  ; sci/screens.e16.ts:15  band(str('ERR:MATH'))
  la a0, str_19
  call band
  ; sci/screens.e16.ts:16  textAt(str("OUT OF A FUNCTION'S"), 1, lineY(0))
  la a0, str_20
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:17  textAt(str('RANGE, OR /0'), 1, lineY(1))
  la a0, str_21
  li a1, 1
  li a2, 20
  call textAt
  j .L2
.L1:
  ; sci/screens.e16.ts:18  if (code === E_STACK) {
  li t0, 3
  bne s1, t0, .L3
  ; sci/screens.e16.ts:19  band(str('ERR:STACK'))
  la a0, str_22
  call band
  ; sci/screens.e16.ts:20  textAt(str('TOO MANY BRACKETS OR'), 1, lineY(0))
  la a0, str_23
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:21  textAt(str('FUNCTIONS IN A LINE'), 1, lineY(1))
  la a0, str_24
  li a1, 1
  li a2, 20
  call textAt
  j .L4
.L3:
  ; sci/screens.e16.ts:23  band(str('ERR:SYNTAX'))
  la a0, str_25
  call band
  ; sci/screens.e16.ts:24  textAt(str('CANNOT READ THE LINE'), 1, lineY(0))
  la a0, str_26
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:25  textAt(str('AT THE CURSOR'), 1, lineY(1))
  la a0, str_27
  li a1, 1
  li a2, 20
  call textAt
.L4:
.L2:
  ; sci/screens.e16.ts:27  textAt(str('\x8c\x8b:BACK TO THE LINE'), 1, lineY(4))
  la a0, str_28
  li a1, 1
  li a2, 47
  call textAt
  ; sci/screens.e16.ts:28  textAt(str('AC:CLEAR'), 1, lineY(5))
  la a0, str_29
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:34 menuScreen() at -O1
menuScreen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/screens.e16.ts:35  band(str('MENU'))
  la a0, str_30
  call band
  ; sci/screens.e16.ts:36  textAt(str('1:CALC    2:STATS'), 1, lineY(0))
  la a0, str_31
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:37  textAt(str('3:BASE    4:TABLE'), 1, lineY(1))
  la a0, str_32
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:38  textAt(str('5:EQUATION'), 1, lineY(2))
  la a0, str_33
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:39  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_34
  li a1, 1
  li a2, 56
  call textAt
  ; sci/screens.e16.ts:40  mark(0, 6, 0)
  li a0, 0
  li a1, 6
  li a2, 0
  call mark
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/screens.e16.ts:44 menuKey(k) at -O1
;   k in s1
menuKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/screens.e16.ts:45  if (k === K_1 || k === K_AC) return 1
  li t0, 56
  beq s1, t0, .L2
  li t0, 5
  bne s1, t0, .L1
.L2:
  ; sci/screens.e16.ts:45  return 1
  li a0, 1
  j .return
.L1:
  ; sci/screens.e16.ts:46  if (k === K_2 || k === K_3 || k === K_4 || k === K_5) refuse()
  li t0, 57
  beq s1, t0, .L4
  li t0, 58
  beq s1, t0, .L4
  li t0, 48
  beq s1, t0, .L4
  li t0, 49
  bne s1, t0, .L3
.L4:
  ; sci/screens.e16.ts:46  refuse()
  call refuse
.L3:
  ; sci/screens.e16.ts:47  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:53 setupScreen() at -O1
;   angle in s1
setupScreen:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/screens.e16.ts:54  band(str('SETUP'))
  la a0, str_35
  call band
  ; sci/screens.e16.ts:55  textRight(str('1/2'), 1)
  la a0, str_36
  li a1, 1
  call textRight
  ; sci/screens.e16.ts:56  textAt(str('3:DEG 4:RAD 5:GRAD'), 1, lineY(0))
  la a0, str_37
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:57  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_34
  li a1, 1
  li a2, 56
  call textAt
  ; sci/screens.e16.ts:58  const angle = peek(KEEP_ANGLE)
  lbu s1, 1026(zero)
  ; sci/screens.e16.ts:59  if (angle === 1) mark(6, 5, 0)
  li t0, 1
  bne s1, t0, .L1
  ; sci/screens.e16.ts:59  mark(6, 5, 0)
  li a0, 6
  li a1, 5
  li a2, 0
  call mark
  j .L2
.L1:
  ; sci/screens.e16.ts:60  if (angle === 2) mark(12, 6, 0)
  li t0, 2
  bne s1, t0, .L3
  ; sci/screens.e16.ts:60  mark(12, 6, 0)
  li a0, 12
  li a1, 6
  li a2, 0
  call mark
  j .L4
.L3:
  ; sci/screens.e16.ts:61  mark(0, 5, 0)
  li a0, 0
  li a1, 5
  li a2, 0
  call mark
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:65 setupKey(k) at -O1
;   k in s1
setupKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/screens.e16.ts:66  if (k === K_AC) return 1
  li t0, 5
  bne s1, t0, .L1
  ; sci/screens.e16.ts:66  return 1
  li a0, 1
  j .return
.L1:
  ; sci/screens.e16.ts:67  if (k === K_3 || k === K_4 || k === K_5) {
  li t0, 58
  beq s1, t0, .L3
  li t0, 48
  beq s1, t0, .L3
  li t0, 49
  bne s1, t0, .L2
.L3:
  ; sci/screens.e16.ts:68  poke(KEEP_ANGLE, k === K_3 ? 0 : k === K_4 ? 1 : 2)
  li t0, 1026
  mv t1, s1
  li t2, 58
  bne t1, t2, .L4
  li t1, 0
  j .L5
.L4:
  mv t1, s1
  li t2, 48
  bne t1, t2, .L6
  li t1, 1
  j .L7
.L6:
  li t1, 2
.L7:
.L5:
  sb t1, 0(t0)
  ; sci/screens.e16.ts:69  setupScreen()
  call setupScreen
  ; sci/screens.e16.ts:70  return 0
  li a0, 0
  j .return
.L2:
  ; sci/screens.e16.ts:72  refuse()
  call refuse
  ; sci/screens.e16.ts:73  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:79 faultScreen(cause, pc) at -O1
;   cause in s1
;   pc in s2
faultScreen:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; cause
  mv s2, a1 ; pc
  ; sci/screens.e16.ts:80  if (cause === 0x800f || cause === 3) band(str('BREAK'))
  li t0, 32783
  beq s1, t0, .L2
  li t0, 3
  bne s1, t0, .L1
.L2:
  ; sci/screens.e16.ts:80  band(str('BREAK'))
  la a0, str_38
  call band
  j .L3
.L1:
  ; sci/screens.e16.ts:81  band(str('FAULT'))
  la a0, str_39
  call band
.L3:
  ; sci/screens.e16.ts:82  textAt(str('CAUSE'), 1, lineY(0))
  la a0, str_40
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:83  hexAt(cause, 43, lineY(0))
  mv a0, s1
  li a1, 43
  li a2, 11
  call hexAt
  ; sci/screens.e16.ts:84  textAt(str('AT'), 1, lineY(1))
  la a0, str_41
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:85  hexAt(pc, 43, lineY(1))
  mv a0, s2
  li a1, 43
  li a2, 20
  call hexAt
  ; sci/screens.e16.ts:86  textAt(str('AC:CLEAR'), 1, lineY(5))
  la a0, str_29
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/screens.e16.ts:91 hexAt(v, x, y) at -O1
;   v in s3
;   x in s0
;   y in 0(sp)
;   s in s1
;   d in s2
hexAt:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  mv s3, a0 ; v
  mv s0, a1 ; x
  sw a2, 0(sp) ; y
  ; sci/screens.e16.ts:92  for (let s: u16 = 0; s < 4; s++) {
  li s1, 0 ; s
  j .L3
.L1:
  ; sci/screens.e16.ts:93  const d = (v >> (12 - s * 4)) & 15
  slli t0, s1, 2
  li t1, 12
  sub t1, t1, t0
  srl t1, s3, t1
  andi s2, t1, 15
  ; sci/screens.e16.ts:94  hexText[s] = d < 10 ? 0x30 + d : 0x37 + d
  addi t0, s1, hexText
  mv t1, s2
  li t2, 10
  bgeu t1, t2, .L5
  addi t1, s2, 48
  j .L6
.L5:
  addi t1, s2, 55
.L6:
  sb t1, 0(t0)
  addi s1, s1, 1
.L3:
  li t0, 4
  bltu s1, t0, .L1
  ; sci/screens.e16.ts:96  hexText[4] = 0
  sb zero, hexText+4(zero)
  ; sci/screens.e16.ts:97  textAt(addr(hexText), x, y)
  la a0, hexText
  mv a1, s0
  lw a2, 0(sp)
  call textAt
.return:
  lw ra, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  addi sp, sp, 12
  ret

str_19:
  .byte 69, 82, 82, 58, 77, 65, 84, 72, 0
str_20:
  .byte 79, 85, 84, 32, 79, 70, 32, 65, 32, 70, 85, 78, 67, 84, 73, 79, 78, 39, 83, 0
str_21:
  .byte 82, 65, 78, 71, 69, 44, 32, 79, 82, 32, 47, 48, 0
str_22:
  .byte 69, 82, 82, 58, 83, 84, 65, 67, 75, 0
str_23:
  .byte 84, 79, 79, 32, 77, 65, 78, 89, 32, 66, 82, 65, 67, 75, 69, 84, 83, 32, 79, 82, 0
str_24:
  .byte 70, 85, 78, 67, 84, 73, 79, 78, 83, 32, 73, 78, 32, 65, 32, 76, 73, 78, 69, 0
str_25:
  .byte 69, 82, 82, 58, 83, 89, 78, 84, 65, 88, 0
str_26:
  .byte 67, 65, 78, 78, 79, 84, 32, 82, 69, 65, 68, 32, 84, 72, 69, 32, 76, 73, 78, 69, 0
str_27:
  .byte 65, 84, 32, 84, 72, 69, 32, 67, 85, 82, 83, 79, 82, 0
str_28:
  .byte 140, 139, 58, 66, 65, 67, 75, 32, 84, 79, 32, 84, 72, 69, 32, 76, 73, 78, 69, 0
str_29:
  .byte 65, 67, 58, 67, 76, 69, 65, 82, 0
str_30:
  .byte 77, 69, 78, 85, 0
str_31:
  .byte 49, 58, 67, 65, 76, 67, 32, 32, 32, 32, 50, 58, 83, 84, 65, 84, 83, 0
str_32:
  .byte 51, 58, 66, 65, 83, 69, 32, 32, 32, 32, 52, 58, 84, 65, 66, 76, 69, 0
str_33:
  .byte 53, 58, 69, 81, 85, 65, 84, 73, 79, 78, 0
str_34:
  .byte 65, 67, 58, 66, 65, 67, 75, 0
str_35:
  .byte 83, 69, 84, 85, 80, 0
str_36:
  .byte 49, 47, 50, 0
str_37:
  .byte 51, 58, 68, 69, 71, 32, 52, 58, 82, 65, 68, 32, 53, 58, 71, 82, 65, 68, 0
str_38:
  .byte 66, 82, 69, 65, 75, 0
str_39:
  .byte 70, 65, 85, 76, 84, 0
str_40:
  .byte 67, 65, 85, 83, 69, 0
str_41:
  .byte 65, 84, 0
  .align 2
