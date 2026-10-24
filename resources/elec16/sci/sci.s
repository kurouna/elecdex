; Made by e16c from sci/lcd.e16.ts, sci/tokens.e16.ts, sci/numbers.e16.ts, sci/calc.e16.ts, sci/eval.e16.ts, sci/screens.e16.ts, sci/exact.e16.ts, sci/layout.e16.ts, sci/edit.e16.ts: do not edit.

; curX at 0x0100
; curY at 0x0102
; errCode at 0x0104
; errAt at 0x0106
; nsp at 0x0468
; screen at 0x046a
; length at 0x0534
; cursor at 0x0536
; answered at 0x0538
; shifted at 0x053a
; alphaOn at 0x053c
; storing at 0x053e
; recalling at 0x0540
; historyAt at 0x0542
; scrollFrom at 0x0544
; exactShown at 0x055e
; answerLength at 0x0590
; lineAt at 0x0592
; lineLength at 0x0594
; pos at 0x0596
; smallAt at 0x0672
; buf at 0x0674
; bufLength at 0x0676
; slide at 0x0678
; ink at 0x067a
; cursorIndex at 0x067c
; cursorX at 0x067e
; cursorTop at 0x0680
; boxUp at 0x0682
; boxDown at 0x0684
; editLength at 0x0686
; editCursor at 0x0688
nums = 0x0108 ; 864 bytes
line = 0x046c ; 200 bytes
answerText = 0x0546 ; 24 bytes
answerTokens = 0x0560 ; 48 bytes
numberText = 0x0598 ; 32 bytes
argument = 0x05b8 ; 36 bytes
hexText = 0x05dc ; 6 bytes
work = 0x05e2 ; 64 bytes
tmpA = 0x0622 ; 36 bytes
tmpB = 0x0646 ; 36 bytes
one = 0x066a ; 8 bytes

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
  sw zero, 0x0468(zero)
  ; screen = 0
  sw zero, 0x046a(zero)
  ; length = 0
  sw zero, 0x0534(zero)
  ; cursor = 0
  sw zero, 0x0536(zero)
  ; answered = 0
  sw zero, 0x0538(zero)
  ; shifted = 0
  sw zero, 0x053a(zero)
  ; alphaOn = 0
  sw zero, 0x053c(zero)
  ; storing = 0
  sw zero, 0x053e(zero)
  ; recalling = 0
  sw zero, 0x0540(zero)
  ; historyAt = 65535
  li t0, 65535
  sw t0, 0x0542(zero)
  ; scrollFrom = 0
  sw zero, 0x0544(zero)
  ; exactShown = 0
  sw zero, 0x055e(zero)
  ; answerLength = 0
  sw zero, 0x0590(zero)
  ; lineAt = 0
  sw zero, 0x0592(zero)
  ; lineLength = 0
  sw zero, 0x0594(zero)
  ; pos = 0
  sw zero, 0x0596(zero)
  ; smallAt = 0
  sw zero, 0x0672(zero)
  ; buf = 0
  sw zero, 0x0674(zero)
  ; bufLength = 0
  sw zero, 0x0676(zero)
  ; slide = 0
  sw zero, 0x0678(zero)
  ; ink = 0
  sw zero, 0x067a(zero)
  ; cursorIndex = 65535
  li t0, 65535
  sw t0, 0x067c(zero)
  ; cursorX = 0
  sw zero, 0x067e(zero)
  ; cursorTop = 0
  sw zero, 0x0680(zero)
  ; boxUp = 0
  sw zero, 0x0682(zero)
  ; boxDown = 0
  sw zero, 0x0684(zero)
  ; editLength = 0
  sw zero, 0x0686(zero)
  ; editCursor = 0
  sw zero, 0x0688(zero)
  ; nums: 864 bytes of 0
  li t0, 0x0108
  li t1, 864
  mset t0, zero, t1
  ; line: 200 bytes of 0
  li t0, 0x046c
  li t1, 200
  mset t0, zero, t1
  ; answerText: 24 bytes of 0
  li t0, 0x0546
  li t1, 24
  mset t0, zero, t1
  ; answerTokens: 48 bytes of 0
  li t0, 0x0560
  li t1, 48
  mset t0, zero, t1
  ; numberText, argument, hexText, work, tmpA, tmpB, one: 218 bytes of 0
  li t0, 0x0598
  li t1, 218
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

; sci/lcd.e16.ts:161 barDots(x, top) at -O1
;   x in a0
;   top in a1
barDots:
  ; sci/lcd.e16.ts:162  poke16(IO_CURSOR, top * 256 + x)
  slli t0, a1, 8
  add t0, t0, a0
  li t1, 65322
  sw t0, 0(t1)
  ; sci/lcd.e16.ts:163  poke16(IO_CURMODE, BAR_8)
  li t0, 71
  li t1, 65324
  sw t0, 0(t1)
.return:
  ret

; sci/lcd.e16.ts:166 noCursor() at -O1
noCursor:
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
.return:
  ret

; sci/lcd.e16.ts:170 marks(bits) at -O1
;   bits in a0
marks:
  ; sci/lcd.e16.ts:171  poke16(IO_ANNUNCIATORS, bits)
  li t0, 65326
  sw a0, 0(t0)
.return:
  ret

; sci/lcd.e16.ts:177 bigGlyph(index/glyph, x) at -O1
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
  ; sci/lcd.e16.ts:178  const glyph = big_base() + index * BIG_WIDTH * 2
  call big_base
  slli t1, s2, 3
  sub t0, t1, s2
  slli t0, t0, 1
  add s2, a0, t0
  ; sci/lcd.e16.ts:179  for (let c: u16 = 0; c < BIG_WIDTH; c++) {
  li s1, 0 ; c
  j .L3
.L1:
  ; sci/lcd.e16.ts:180  const word = peek16(glyph + c * 2)
  slli t0, s1, 1
  add t0, s2, t0
  lw s0, 0(t0)
  ; sci/lcd.e16.ts:181  poke(VRAM + BIG_BAND * WIDTH + x + c, word & 0xff)
  addi t0, s3, -7424
  add t0, t0, s1
  andi t1, s0, 255
  sb t1, 0(t0)
  ; sci/lcd.e16.ts:182  poke(VRAM + (BIG_BAND + 1) * WIDTH + x + c, word >> 8)
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

; sci/lcd.e16.ts:197 bigNumber(at, length/i, right/x) at -O1
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
  ; sci/lcd.e16.ts:198  let x = right + 1
  addi s1, s1, 1
  ; sci/lcd.e16.ts:199  let i = length
  ; sci/lcd.e16.ts:200  while (i > 0) {
  j .L3
.L1:
  ; sci/lcd.e16.ts:201  i--
  addi s3, s3, -1
  ; sci/lcd.e16.ts:202  const c = peek(at + i)
  add t0, s0, s3
  lbu s2, 0(t0)
  ; sci/lcd.e16.ts:203  if (c === 0x2e) {
  li t0, 46
  bne s2, t0, .L5
  ; sci/lcd.e16.ts:204  x -= 3
  addi s1, s1, -3
  ; sci/lcd.e16.ts:205  bigPoint(x)
  ; sci/lcd.e16.ts:188  const at = VRAM + (BIG_BAND + 1) * WIDTH + x
  addi s2, s1, -7296
  ; sci/lcd.e16.ts:189  poke(at, peek(at) | 0x30)
  lbu t0, 0(s2)
  ori t0, t0, 48
  sb t0, 0(s2)
  ; sci/lcd.e16.ts:190  poke(at + 1, peek(at + 1) | 0x30)
  lbu t0, 1(s2)
  ori t0, t0, 48
  sb t0, 1(s2)
  j .L6
.L5:
  ; sci/lcd.e16.ts:207  x -= BIG_PITCH
  addi s1, s1, -8
  ; sci/lcd.e16.ts:208  bigGlyph(c === 0x2d ? 10 : c - 0x30, x)
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
  ; sci/lcd.e16.ts:211  return x
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/lcd.e16.ts:217 dot(x/at, y) at -O1
;   x/at in a0
;   y in a1
dot:
  ; sci/lcd.e16.ts:218  if (x >= WIDTH || y >= BANDS * 8) return
  li t0, 128
  bgeu a0, t0, .L2
  li t0, 64
  bltu a1, t0, .L1
.L2:
  ; sci/lcd.e16.ts:218  return
  ret
.L1:
  ; sci/lcd.e16.ts:219  const at = VRAM + (y >> 3) * WIDTH + x
  srli t0, a1, 3
  slli t0, t0, 7
  addi t0, t0, -8192
  add a0, t0, a0
  ; sci/lcd.e16.ts:220  poke(at, peek(at) | (1 << (y & 7)))
  lbu t0, 0(a0)
  andi t1, a1, 7
  li t2, 1
  sll t2, t2, t1
  or t0, t0, t2
  sb t0, 0(a0)
.return:
  ret

; sci/lcd.e16.ts:226 glyphAt(c/src, x, y/shift) at -O1
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
  ; sci/lcd.e16.ts:227  const src = font_base() + (c - FIRST_CODE) * 5
  call font_base
  lw t0, 0(sp) ; c/src
  addi t0, t0, -32
  slli t1, t0, 2
  add t0, t1, t0
  add t0, a0, t0
  sw t0, 0(sp) ; c/src
  ; sci/lcd.e16.ts:228  const band = y >> 3
  srli s0, s2, 3
  ; sci/lcd.e16.ts:229  const shift = y & 7
  andi s2, s2, 7
  ; sci/lcd.e16.ts:230  for (let k: u16 = 0; k < 5; k++) {
  li s1, 0 ; k
  j .L3
.L1:
  ; sci/lcd.e16.ts:231  const col = peek(src + k) << shift
  lw t0, 0(sp) ; c/src
  add t0, t0, s1
  lbu t0, 0(t0)
  sll t0, t0, s2
  sw t0, 4(sp) ; col
  ; sci/lcd.e16.ts:232  if (x + k >= WIDTH) return
  lw t0, 2(sp) ; x
  add t0, t0, s1
  li t1, 128
  bltu t0, t1, .L5
  ; sci/lcd.e16.ts:232  return
  j .return
.L5:
  ; sci/lcd.e16.ts:233  if (band < BANDS) {
  li t0, 8
  bgeu s0, t0, .L6
  ; sci/lcd.e16.ts:234  const at = VRAM + band * WIDTH + x + k
  slli t0, s0, 7
  lw t1, 2(sp) ; x
  addi t0, t0, -8192
  add t0, t0, t1
  add s3, t0, s1
  ; sci/lcd.e16.ts:235  poke(at, peek(at) | (col & 0xff))
  lbu t0, 0(s3)
  lw t1, 4(sp) ; col
  andi t1, t1, 255
  or t0, t0, t1
  sb t0, 0(s3)
.L6:
  ; sci/lcd.e16.ts:237  if (shift !== 0 && band + 1 < BANDS) {
  beq s2, zero, .L7
  li t0, 8
  addi t1, s0, 1
  bgeu t1, t0, .L7
  ; sci/lcd.e16.ts:238  const below = VRAM + (band + 1) * WIDTH + x + k
  addi t0, s0, 1
  slli t0, t0, 7
  lw t1, 2(sp) ; x
  addi t0, t0, -8192
  add t0, t0, t1
  add s3, t0, s1
  ; sci/lcd.e16.ts:239  poke(below, peek(below) | (col >> 8))
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

; sci/lcd.e16.ts:245 textAt(at/p, x/left, y) at -O1
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
  ; sci/lcd.e16.ts:246  let p = at
  ; sci/lcd.e16.ts:247  let left = x
  ; sci/lcd.e16.ts:248  while (peek(p) !== 0) {
  j .L3
.L1:
  ; sci/lcd.e16.ts:249  glyphAt(peek(p), left, y)
  lbu a0, 0(s1)
  mv a1, s2
  mv a2, s3
  call glyphAt
  ; sci/lcd.e16.ts:250  left += 6
  addi s2, s2, 6
  ; sci/lcd.e16.ts:251  p++
  addi s1, s1, 1
.L3:
  lbu t0, 0(s1)
  bne t0, zero, .L1
  ; sci/lcd.e16.ts:253  return left
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/lcd.e16.ts:257 textRight(at, y) at -O1
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
  ; sci/lcd.e16.ts:258  let n: u16 = 0
  li s1, 0 ; n
  ; sci/lcd.e16.ts:259  while (peek(at + n) !== 0) n++
  j .L3
.L1:
  ; sci/lcd.e16.ts:259  n++
  addi s1, s1, 1
.L3:
  add t0, s2, s1
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; sci/lcd.e16.ts:260  textAt(at, WIDTH + 1 - n * 6, y)
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

; sci/lcd.e16.ts:264 invertBox(x0, y0/y, x1, y1) at -O1
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
  ; sci/lcd.e16.ts:265  for (let y = y0; y <= y1 && y < BANDS * 8; y++) {
  j .L3
.L1:
  ; sci/lcd.e16.ts:266  const bit = 1 << (y & 7)
  andi t0, a1, 7
  li t1, 1
  sll s3, t1, t0
  ; sci/lcd.e16.ts:267  const row = VRAM + (y >> 3) * WIDTH
  srli t0, a1, 3
  slli t0, t0, 7
  addi s2, t0, -8192
  ; sci/lcd.e16.ts:268  for (let x = x0; x <= x1 && x < WIDTH; x++) poke(row + x, peek(row + x) ^ bit)
  mv s1, a0 ; x
  j .L7
.L5:
  ; sci/lcd.e16.ts:268  poke(row + x, peek(row + x) ^ bit)
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

; sci/lcd.e16.ts:276 band(at) at -O1
;   at in s1
band:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; sci/lcd.e16.ts:277  cls()
  call cls
  ; sci/lcd.e16.ts:278  textAt(at, 1, 1)
  mv a0, s1
  li a1, 1
  li a2, 1
  call textAt
  ; sci/lcd.e16.ts:279  invertBox(0, 0, WIDTH - 1, 8)
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

; sci/lcd.e16.ts:283 lineY(n) at -O1
;   n in a0
lineY:
  ; sci/lcd.e16.ts:284  return 11 + n * 9
  slli t1, a0, 3
  add t0, t1, a0
  addi a0, t0, 11
.return:
  ret

; sci/lcd.e16.ts:288 mark(col, length, n/y) at -O1
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
  ; sci/lcd.e16.ts:289  const y = lineY(n)
  mv a0, s1
  call lineY
  mv s1, a0 ; n/y
  ; sci/lcd.e16.ts:290  invertBox(col * 6, y - 1, col * 6 + length * 6, y + 7)
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

; sci/tokens.e16.ts:61 isMark(t) at -O1
;   t in a0
isMark:
  ; sci/tokens.e16.ts:62  return t >= T_FRAC && t <= T_POWT
  li t0, 22
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L1
  li t0, 26
  sltu t0, t0, a0
  xori t0, t0, 1
.L1:
  mv a0, t0
.return:
  ret

; sci/tokens.e16.ts:66 opensTemplate(t) at -O1
;   t in a0
opensTemplate:
  ; sci/tokens.e16.ts:67  return t === T_FRAC || t === T_ROOT || t === T_POWT
  li t0, 22
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L2
  li t0, 25
  sub t0, a0, t0
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 26
  sub t0, a0, t0
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; sci/tokens.e16.ts:71 isFunction(t) at -O1
;   t in a0
isFunction:
  ; sci/tokens.e16.ts:72  return t >= T_SIN && t <= T_CBRT
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

; sci/tokens.e16.ts:76 isVariable(t) at -O1
;   t in a0
isVariable:
  ; sci/tokens.e16.ts:77  return (t >= 0x41 && t <= 0x46) || t === 0x58 || t === 0x59 || t === 0x4d
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

; sci/tokens.e16.ts:80 isDigit(t) at -O1
;   t in a0
isDigit:
  ; sci/tokens.e16.ts:81  return t >= 0x30 && t <= 0x39
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

; sci/tokens.e16.ts:85 tokenText(t) at -O1
;   t in a0
tokenText:
  ; sci/tokens.e16.ts:86  switch (t) {
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
  li t0, 22
  beq a0, t0, .L18
  li t0, 23
  beq a0, t0, .L19
  li t0, 24
  beq a0, t0, .L20
  li t0, 25
  beq a0, t0, .L21
  li t0, 26
  beq a0, t0, .L22
  li t0, 27
  beq a0, t0, .L23
  j .L1
.L2:
  ; sci/tokens.e16.ts:88  return str('sin(')
  la a0, str_0
  ret
.L3:
  ; sci/tokens.e16.ts:90  return str('cos(')
  la a0, str_1
  ret
.L4:
  ; sci/tokens.e16.ts:92  return str('tan(')
  la a0, str_2
  ret
.L5:
  ; sci/tokens.e16.ts:94  return str('sin\x86(')
  la a0, str_3
  ret
.L6:
  ; sci/tokens.e16.ts:96  return str('cos\x86(')
  la a0, str_4
  ret
.L7:
  ; sci/tokens.e16.ts:98  return str('tan\x86(')
  la a0, str_5
  ret
.L8:
  ; sci/tokens.e16.ts:100  return str('log(')
  la a0, str_6
  ret
.L9:
  ; sci/tokens.e16.ts:102  return str('ln(')
  la a0, str_7
  ret
.L10:
  ; sci/tokens.e16.ts:104  return str('\x83(')
  la a0, str_8
  ret
.L11:
  ; sci/tokens.e16.ts:106  return str('\x85\x83(')
  la a0, str_9
  ret
.L12:
  ; sci/tokens.e16.ts:108  return str('-')
  la a0, str_10
  ret
.L13:
  ; sci/tokens.e16.ts:110  return str('^(')
  la a0, str_11
  ret
.L14:
  ; sci/tokens.e16.ts:112  return str('C')
  la a0, str_12
  ret
.L15:
  ; sci/tokens.e16.ts:114  return str('P')
  la a0, str_13
  ret
.L16:
  ; sci/tokens.e16.ts:116  return str('Ans')
  la a0, str_14
  ret
.L17:
  ; sci/tokens.e16.ts:118  return str('10')
  la a0, str_15
  ret
.L18:
  ; sci/tokens.e16.ts:121  return str('(')
  la a0, str_16
  ret
.L19:
  ; sci/tokens.e16.ts:123  return str(')/(')
  la a0, str_17
  ret
.L20:
  ; sci/tokens.e16.ts:125  return str(')')
  la a0, str_18
  ret
.L21:
  ; sci/tokens.e16.ts:127  return str('\x83(')
  la a0, str_8
  ret
.L22:
  ; sci/tokens.e16.ts:129  return str('^(')
  la a0, str_11
  ret
.L23:
  ; sci/tokens.e16.ts:131  return str('/')
  la a0, str_19
  ret
.L1:
  ; sci/tokens.e16.ts:133  return 0
  li a0, 0
.return:
  ret

; sci/tokens.e16.ts:137 tokenWidth(t/text) at -O1
;   t/text in s1
;   n in s2
tokenWidth:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t/text
  ; sci/tokens.e16.ts:138  if (t >= 0x20) return 1
  li t0, 32
  bltu s1, t0, .L1
  ; sci/tokens.e16.ts:138  return 1
  li a0, 1
  j .return
.L1:
  ; sci/tokens.e16.ts:139  const text = tokenText(t)
  mv a0, s1
  call tokenText
  mv s1, a0 ; t/text
  ; sci/tokens.e16.ts:140  if (text === 0) return 1
  bne s1, zero, .L2
  ; sci/tokens.e16.ts:140  return 1
  li a0, 1
  j .return
.L2:
  ; sci/tokens.e16.ts:141  let n: u16 = 0
  li s2, 0 ; n
  ; sci/tokens.e16.ts:142  while (peek(text + n) !== 0) n++
  j .L5
.L3:
  ; sci/tokens.e16.ts:142  n++
  addi s2, s2, 1
.L5:
  add t0, s1, s2
  lbu t0, 0(t0)
  bne t0, zero, .L3
  ; sci/tokens.e16.ts:143  return n
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/numbers.e16.ts:77 fail(code, at) at -O1
;   code in s1
;   at in s2
fail:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; code
  mv s2, a1 ; at
  ; sci/numbers.e16.ts:78  errCode = code
  sw s1, 0x0104(zero)
  ; sci/numbers.e16.ts:79  errAt = at
  sw s2, 0x0106(zero)
  ; sci/numbers.e16.ts:80  calc_abort()
  call calc_abort
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/numbers.e16.ts:93 copyValue(from, to) at -O1
;   from in s1
;   to in s2
copyValue:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; from
  mv s2, a1 ; to
  ; sci/numbers.e16.ts:94  memcpy(to, from, VALUE_SIZE)
  mv a0, s2
  mv a1, s1
  li a2, 36
  mcpy a0, a1, a2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/numbers.e16.ts:98 copy8(from, to) at -O1
;   from in s1
;   to in s2
copy8:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; from
  mv s2, a1 ; to
  ; sci/numbers.e16.ts:99  memcpy(to, from, 8)
  mv a0, s2
  mv a1, s1
  li a2, 8
  mcpy a0, a1, a2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/numbers.e16.ts:103 inexact(v) at -O1
;   v in a0
inexact:
  ; sci/numbers.e16.ts:104  poke16(v + V_EXACT, 0)
  sw zero, 8(a0)
.return:
  ret

; sci/numbers.e16.ts:107 isExact(v) at -O1
;   v in a0
isExact:
  ; sci/numbers.e16.ts:108  return peek16(v + V_EXACT) !== 0
  lw t0, 8(a0)
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; sci/numbers.e16.ts:133 keepReady() at -O1
;   i in a0
keepReady:
  ; sci/numbers.e16.ts:134  if (peek16(KEEP) === KEEP_MARK) return
  lw t0, 3072(zero)
  li t1, 23588
  bne t0, t1, .L1
  ; sci/numbers.e16.ts:134  return
  ret
.L1:
  ; sci/numbers.e16.ts:135  for (let i: u16 = 0; i < 0x182; i += 2) poke16(KEEP + i, 0)
  li a0, 0 ; i
  j .L4
.L2:
  ; sci/numbers.e16.ts:135  poke16(KEEP + i, 0)
  sw zero, 3072(a0)
  addi a0, a0, 2
.L4:
  li t0, 386
  bltu a0, t0, .L2
  ; sci/numbers.e16.ts:136  poke16(KEEP, KEEP_MARK)
  li t0, 23588
  sw t0, 3072(zero)
.return:
  ret

; sci/numbers.e16.ts:140 varAt(letter) at -O1
;   letter in a0
;   k in a1
varAt:
  ; sci/numbers.e16.ts:141  let k: u16 = 0
  li a1, 0 ; k
  ; sci/numbers.e16.ts:142  if (letter >= 0x41 && letter <= 0x46) k = letter - 0x41
  li t0, 65
  bltu a0, t0, .L1
  li t0, 70
  bltu t0, a0, .L1
  ; sci/numbers.e16.ts:142  k = letter - 0x41
  addi a1, a0, -65
  j .L2
.L1:
  ; sci/numbers.e16.ts:143  if (letter === 0x58) k = 6
  li t0, 88
  bne a0, t0, .L3
  ; sci/numbers.e16.ts:143  k = 6
  li a1, 6 ; k
  j .L4
.L3:
  ; sci/numbers.e16.ts:144  if (letter === 0x59) k = 7
  li t0, 89
  bne a0, t0, .L5
  ; sci/numbers.e16.ts:144  k = 7
  li a1, 7 ; k
  j .L6
.L5:
  ; sci/numbers.e16.ts:145  k = 8
  li a1, 8 ; k
.L6:
.L4:
.L2:
  ; sci/numbers.e16.ts:146  return KEEP_VARS + k * VALUE_SIZE
  slli t1, a1, 5
  slli t0, a1, 2
  add t0, t0, t1
  addi a0, t0, 3120
.return:
  ret

; sci/numbers.e16.ts:155 clearStack() at -O1
clearStack:
  ; sci/numbers.e16.ts:156  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0468(zero)
.return:
  ret

; sci/numbers.e16.ts:160 push(at/n) at -O1
;   at/n in s1
push:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at/n
  ; sci/numbers.e16.ts:161  if (nsp >= addr(nums) + 864) fail(E_STACK, at)
  lw t0, 0x0468(zero)
  li t1, nums+864
  bltu t0, t1, .L1
  ; sci/numbers.e16.ts:161  fail(E_STACK, at)
  li a0, 3
  mv a1, s1
  call fail
.L1:
  ; sci/numbers.e16.ts:162  const n = nsp
  lw s1, 0x0468(zero)
  ; sci/numbers.e16.ts:163  nsp += VALUE_SIZE
  lw t0, 0x0468(zero)
  addi t0, t0, 36
  sw t0, 0x0468(zero)
  ; sci/numbers.e16.ts:164  inexact(n)
  mv a0, s1
  call inexact
  ; sci/numbers.e16.ts:165  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/numbers.e16.ts:168 top() at -O1
top:
  ; sci/numbers.e16.ts:169  return nsp - VALUE_SIZE
  lw t0, 0x0468(zero)
  addi a0, t0, -36
.return:
  ret

; sci/numbers.e16.ts:172 pop() at -O1
pop:
  ; sci/numbers.e16.ts:173  nsp -= VALUE_SIZE
  lw t0, 0x0468(zero)
  addi t0, t0, -36
  sw t0, 0x0468(zero)
.return:
  ret

; sci/numbers.e16.ts:176 isZero(n) at -O1
;   n in a0
isZero:
  ; sci/numbers.e16.ts:177  return peek(n + 2) === 0
  lbu t0, 2(a0)
  sub t0, t0, zero
  seqz a0, t0
.return:
  ret

; sci/numbers.e16.ts:180 isNegative(n) at -O1
;   n in a0
isNegative:
  ; sci/numbers.e16.ts:181  return peek(n) !== 0
  lbu t0, 0(a0)
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; sci/numbers.e16.ts:185 math(op, a, b, at) at -O1
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
  ; sci/numbers.e16.ts:186  poke16(MATH_A, a)
  li t0, 65362
  sw s2, 0(t0)
  ; sci/numbers.e16.ts:187  poke16(MATH_B, b)
  li t0, 65364
  sw s3, 0(t0)
  ; sci/numbers.e16.ts:188  poke16(MATH_OP, op)
  li t0, 65360
  sw s1, 0(t0)
  ; sci/numbers.e16.ts:189  if (peek16(MATH_STATUS) !== 0) fail(E_MATH, at)
  li t0, 65368
  lw t0, 0(t0)
  beq t0, zero, .L1
  ; sci/numbers.e16.ts:189  fail(E_MATH, at)
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

; sci/numbers.e16.ts:193 pushInt(v, at) at -O1
;   v in s3
;   at in s2
;   n in s1
pushInt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  mv s3, a0 ; v
  mv s2, a1 ; at
  ; sci/numbers.e16.ts:194  const n = push(at)
  mv a0, s2
  call push
  mv s1, a0 ; n
  ; sci/numbers.e16.ts:195  poke16(MATH_ARG, v)
  li t0, 65366
  sw s3, 0(t0)
  ; sci/numbers.e16.ts:196  math(M_FROMINT, n, 0, at)
  li a0, 48
  mv a1, s1
  li a2, 0
  mv a3, s2
  call math
  ; sci/numbers.e16.ts:197  exactWhole(n)
  mv a0, s1
  la t0, exactWhole
  li t1, 2
  call far_call
  ; sci/numbers.e16.ts:198  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/numbers.e16.ts:202 binary(op, at) at -O1
;   op in s1
;   at in s0
;   b in s2
;   a in s3
binary:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s1, a0 ; op
  mv s0, a1 ; at
  ; sci/numbers.e16.ts:203  const b = top()
  call top
  mv s2, a0 ; b
  ; sci/numbers.e16.ts:204  pop()
  call pop
  ; sci/numbers.e16.ts:205  const a = top()
  call top
  mv s3, a0 ; a
  ; sci/numbers.e16.ts:206  math(op, a, b, at)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  mv a3, s0
  call math
  ; sci/numbers.e16.ts:207  exactBinary(op, a, b)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  la t0, exactBinary
  li t1, 2
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/numbers.e16.ts:211 isWhole(n/whole, at) at -O1
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
  ; sci/numbers.e16.ts:212  const t = push(at)
  mv a0, s3
  call push
  mv s2, a0 ; t
  ; sci/numbers.e16.ts:213  copy8(n, t)
  mv a0, s1
  mv a1, s2
  call copy8
  ; sci/numbers.e16.ts:214  math(M_FRAC, t, 0, at)
  li a0, 19
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  ; sci/numbers.e16.ts:215  const whole = isZero(t)
  mv a0, s2
  call isZero
  mv s1, a0 ; n/whole
  ; sci/numbers.e16.ts:216  pop()
  call pop
  ; sci/numbers.e16.ts:217  return whole
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/numbers.e16.ts:221 smallWhole(n/v, at) at -O1
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
  ; sci/numbers.e16.ts:222  if (!isWhole(n, at) || isNegative(n)) fail(E_MATH, at)
  mv a0, s1
  mv a1, s2
  call isWhole
  beqz a0, .L2
  mv a0, s1
  call isNegative
  beqz a0, .L1
.L2:
  ; sci/numbers.e16.ts:222  fail(E_MATH, at)
  li a0, 1
  mv a1, s2
  call fail
.L1:
  ; sci/numbers.e16.ts:223  const t = push(at)
  mv a0, s2
  call push
  mv s3, a0 ; t
  ; sci/numbers.e16.ts:224  copy8(n, t)
  mv a0, s1
  mv a1, s3
  call copy8
  ; sci/numbers.e16.ts:225  math(M_TOINT, t, 0, at)
  li a0, 49
  mv a1, s3
  li a2, 0
  mv a3, s2
  call math
  ; sci/numbers.e16.ts:226  pop()
  call pop
  ; sci/numbers.e16.ts:227  const v = peek16(MATH_ARG)
  li t0, 65366
  lw s1, 0(t0)
  ; sci/numbers.e16.ts:228  if (i16(v) < 0 || v > 999) fail(E_MATH, at)
  blt s1, zero, .L4
  li t0, 999
  bgeu t0, s1, .L3
.L4:
  ; sci/numbers.e16.ts:228  fail(E_MATH, at)
  li a0, 1
  mv a1, s2
  call fail
.L3:
  ; sci/numbers.e16.ts:229  return v
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:221 twoD() at -O1
twoD:
  ; sci/calc.e16.ts:222  return peek(KEEP_DISPLAY) === 0
  lbu t0, 3075(zero)
  sub t0, t0, zero
  seqz a0, t0
.return:
  ret

; sci/calc.e16.ts:235 calcCold() at -O1
calcCold:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:236  keepReady()
  call keepReady
  ; sci/calc.e16.ts:237  cls()
  call cls
  ; sci/calc.e16.ts:238  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:239  centre(2, str('ELEC-16 SCI'), 11)
  li a0, 2
  la a1, str_20
  li a2, 11
  call centre
  ; sci/calc.e16.ts:240  centre(4, str('SCI-128'), 7)
  li a0, 4
  la a1, str_21
  li a2, 7
  call centre
  ; sci/calc.e16.ts:241  marks(0)
  ; sci/lcd.e16.ts:171  poke16(IO_ANNUNCIATORS, bits)
  li t0, 65326
  sw zero, 0(t0)
  ; sci/calc.e16.ts:242  pause(700)
  ; sci/calc.e16.ts:252  poke16(IO_TCMP, peek16(IO_TCOUNT) + ms)
  li t0, 65328
  lw t0, 0(t0)
  addi t0, t0, 700
  li t1, 65330
  sw t0, 0(t1)
  ; sci/calc.e16.ts:253  poke16(IO_TCTRL, 1)
  li t0, 1
  li t1, 65332
  sw t0, 0(t1)
  ; sci/calc.e16.ts:254  csrw(CSR_MIE, 3)
  li t0, 3
  csrw 772, t0
  ; sci/calc.e16.ts:255  wfi()
  wfi
  ; sci/calc.e16.ts:256  poke16(IO_TCTRL, 0)
  li t0, 65332
  sw zero, 0(t0)
  ; sci/calc.e16.ts:257  csrw(CSR_MIE, 0)
  csrw 772, zero
  ; sci/calc.e16.ts:243  screen = S_CALC
  sw zero, 0x046a(zero)
  ; sci/calc.e16.ts:244  length = 0
  sw zero, 0x0534(zero)
  ; sci/calc.e16.ts:245  cursor = 0
  sw zero, 0x0536(zero)
  ; sci/calc.e16.ts:246  answered = false
  sw zero, 0x0538(zero)
  ; sci/calc.e16.ts:247  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:261 calcLoop() at -O1
calcLoop:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:262  for (;;) key(getkey())
.L1:
  ; sci/calc.e16.ts:262  key(getkey())
  call getkey
  call key
  j .L1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:266 refuse() at -O1
refuse:
  ; sci/calc.e16.ts:267  poke16(IO_FREQ, 1800)
  li t0, 1800
  li t1, 65344
  sw t0, 0(t1)
  ; sci/calc.e16.ts:268  poke16(IO_DUR, 40)
  li t0, 40
  li t1, 65346
  sw t0, 0(t1)
.return:
  ret

; sci/calc.e16.ts:274 calcError() at -O1
calcError:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:275  screen = S_ERROR
  li t0, 1
  sw t0, 0x046a(zero)
  ; sci/calc.e16.ts:276  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:277  errorScreen(errCode)
  lw a0, 0x0104(zero)
  la t0, errorScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:278  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:282 calcFault(cause, pc) at -O1
;   cause in s1
;   pc in s2
calcFault:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; cause
  mv s2, a1 ; pc
  ; sci/calc.e16.ts:283  screen = S_ERROR
  li t0, 1
  sw t0, 0x046a(zero)
  ; sci/calc.e16.ts:284  length = 0
  sw zero, 0x0534(zero)
  ; sci/calc.e16.ts:285  cursor = 0
  sw zero, 0x0536(zero)
  ; sci/calc.e16.ts:286  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:287  faultScreen(cause, pc)
  mv a0, s1
  mv a1, s2
  la t0, faultScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:288  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:295 calcOn() at -O1
calcOn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:296  if (shifted) {
  lw t0, 0x053a(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:297  shifted = false
  sw zero, 0x053a(zero)
  ; sci/calc.e16.ts:298  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:299  poke16(0xff06, 0)
  li t0, 65286
  sw zero, 0(t0)
  ; sci/calc.e16.ts:300  return
  j .return
.L1:
  ; sci/calc.e16.ts:302  clearLine()
  call clearLine
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:305 clearLine() at -O1
clearLine:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:306  screen = S_CALC
  sw zero, 0x046a(zero)
  ; sci/calc.e16.ts:307  length = 0
  sw zero, 0x0534(zero)
  ; sci/calc.e16.ts:308  cursor = 0
  sw zero, 0x0536(zero)
  ; sci/calc.e16.ts:309  answered = false
  sw zero, 0x0538(zero)
  ; sci/calc.e16.ts:310  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x0542(zero)
  ; sci/calc.e16.ts:311  shifted = false
  sw zero, 0x053a(zero)
  ; sci/calc.e16.ts:312  alphaOn = false
  sw zero, 0x053c(zero)
  ; sci/calc.e16.ts:313  storing = false
  sw zero, 0x053e(zero)
  ; sci/calc.e16.ts:314  recalling = false
  sw zero, 0x0540(zero)
  ; sci/calc.e16.ts:315  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:320 key(k) at -O1
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
  ; sci/calc.e16.ts:321  if (k === K_SHIFT) {
  li t0, 6
  bne s1, t0, .L1
  ; sci/calc.e16.ts:322  shifted = !shifted
  lw t0, 0x053a(zero)
  seqz t0, t0
  sw t0, 0x053a(zero)
  ; sci/calc.e16.ts:323  alphaOn = false
  sw zero, 0x053c(zero)
  ; sci/calc.e16.ts:324  drawMarks()
  call drawMarks
  ; sci/calc.e16.ts:325  return
  j .return
.L1:
  ; sci/calc.e16.ts:327  if (k === K_ALPHA) {
  li t0, 7
  bne s1, t0, .L2
  ; sci/calc.e16.ts:328  alphaOn = !alphaOn
  lw t0, 0x053c(zero)
  seqz t0, t0
  sw t0, 0x053c(zero)
  ; sci/calc.e16.ts:329  shifted = false
  sw zero, 0x053a(zero)
  ; sci/calc.e16.ts:330  drawMarks()
  call drawMarks
  ; sci/calc.e16.ts:331  return
  j .return
.L2:
  ; sci/calc.e16.ts:333  const shift = shifted
  lw s2, 0x053a(zero)
  ; sci/calc.e16.ts:334  const alpha = alphaOn
  lw s3, 0x053c(zero)
  ; sci/calc.e16.ts:335  shifted = false
  sw zero, 0x053a(zero)
  ; sci/calc.e16.ts:336  alphaOn = false
  sw zero, 0x053c(zero)
  ; sci/calc.e16.ts:337  if (screen === S_ERROR) errorKey(k)
  lw t0, 0x046a(zero)
  li t1, 1
  bne t0, t1, .L3
  ; sci/calc.e16.ts:337  errorKey(k)
  mv a0, s1
  call errorKey
  j .L4
.L3:
  ; sci/calc.e16.ts:338  if (screen === S_MENU) {
  lw t0, 0x046a(zero)
  li t1, 2
  bne t0, t1, .L5
  ; sci/calc.e16.ts:339  if (menuKey(k) !== 0) clearLine()
  mv a0, s1
  la t0, menuKey
  li t1, 1
  call far_call
  beq a0, zero, .L7
  ; sci/calc.e16.ts:339  clearLine()
  call clearLine
  j .L7
.L5:
  ; sci/calc.e16.ts:340  if (screen === S_SETUP) {
  lw t0, 0x046a(zero)
  li t1, 3
  bne t0, t1, .L8
  ; sci/calc.e16.ts:341  if (setupKey(k) !== 0) clearLine()
  mv a0, s1
  la t0, setupKey
  li t1, 1
  call far_call
  beq a0, zero, .L10
  ; sci/calc.e16.ts:341  clearLine()
  call clearLine
  j .L10
.L8:
  ; sci/calc.e16.ts:342  calcKey(k, shift, alpha)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call calcKey
.L10:
.L7:
.L4:
  ; sci/calc.e16.ts:343  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:347 errorKey(k) at -O1
;   k in s1
errorKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/calc.e16.ts:348  if (k === K_AC) {
  li t0, 5
  bne s1, t0, .L1
  ; sci/calc.e16.ts:349  clearLine()
  call clearLine
  ; sci/calc.e16.ts:350  return
  j .return
.L1:
  ; sci/calc.e16.ts:352  if (k === K_LEFT || k === K_RIGHT) {
  li t0, 2
  beq s1, t0, .L3
  li t0, 3
  bne s1, t0, .L2
.L3:
  ; sci/calc.e16.ts:353  screen = S_CALC
  sw zero, 0x046a(zero)
  ; sci/calc.e16.ts:354  answered = false
  sw zero, 0x0538(zero)
  ; sci/calc.e16.ts:355  cursor = errAt < length ? errAt : length
  lw t0, 0x0106(zero)
  lw t1, 0x0534(zero)
  bgeu t0, t1, .L4
  lw t0, 0x0106(zero)
  j .L5
.L4:
  lw t0, 0x0534(zero)
.L5:
  sw t0, 0x0536(zero)
  ; sci/calc.e16.ts:356  drawCalc()
  call drawCalc
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:360 calcKey(k, shift, alpha/t) at -O1
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
  ; sci/calc.e16.ts:361  if (storing || recalling) {
  lw t0, 0x053e(zero)
  bnez t0, .L2
  lw t0, 0x0540(zero)
  beqz t0, .L1
.L2:
  ; sci/calc.e16.ts:362  variableKey(k)
  mv a0, s1
  call variableKey
  ; sci/calc.e16.ts:363  return
  j .return
.L1:
  ; sci/calc.e16.ts:365  if (commandKey(k, shift, alpha)) return
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call commandKey
  beqz a0, .L3
  ; sci/calc.e16.ts:365  return
  j .return
.L3:
  ; sci/calc.e16.ts:366  if (!alpha && templateKey(k, shift)) return
  bnez s2, .L4
  mv a0, s1
  mv a1, s3
  call templateKey
  beqz a0, .L4
  ; sci/calc.e16.ts:366  return
  j .return
.L4:
  ; sci/calc.e16.ts:367  const t = alpha ? letterOf(k) : tokenOf(k, shift)
  beqz s2, .L5
  mv a0, s1
  call letterOf
  mv t0, a0
  j .L6
.L5:
  mv a0, s1
  mv a1, s3
  call tokenOf
  mv t0, a0
.L6:
  mv s2, t0 ; alpha/t
  ; sci/calc.e16.ts:368  if (t === 0) {
  bne s2, zero, .L7
  ; sci/calc.e16.ts:369  refuse()
  call refuse
  ; sci/calc.e16.ts:370  return
  j .return
.L7:
  ; sci/calc.e16.ts:372  type(t)
  mv a0, s2
  call type
  ; sci/calc.e16.ts:374  if (shift && (k === K_LOG || k === K_LN)) {
  beqz s3, .L8
  li t0, 20
  beq s1, t0, .L9
  li t0, 21
  bne s1, t0, .L8
.L9:
  ; sci/calc.e16.ts:375  insert(T_POW)
  li a0, 17
  call insert
  ; sci/calc.e16.ts:376  drawCalc()
  call drawCalc
.L8:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:384 templateKey(k, shift/root) at -O1
;   k in s1
;   shift/root in s2
;   fractionKey in s3
templateKey:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift/root
  ; sci/calc.e16.ts:385  const fractionKey = k === K_FRAC && !shift
  li t0, 16
  sub t0, s1, t0
  seqz t0, t0
  mv t1, t0
  beqz t1, .L1
  seqz t0, s2
.L1:
  mv s3, t0 ; fractionKey
  ; sci/calc.e16.ts:386  if (!twoD()) {
  call twoD
  bnez a0, .L2
  ; sci/calc.e16.ts:387  if (fractionKey) type(T_SLASH)
  beqz s3, .L3
  ; sci/calc.e16.ts:387  type(T_SLASH)
  li a0, 27
  call type
.L3:
  ; sci/calc.e16.ts:388  return fractionKey
  mv a0, s3
  j .return
.L2:
  ; sci/calc.e16.ts:390  if (!fractionKey && !makesTemplate(k, shift)) return false
  bnez s3, .L4
  mv a0, s1
  mv a1, s2
  call makesTemplate
  bnez a0, .L4
  ; sci/calc.e16.ts:390  return false
  li a0, 0
  j .return
.L4:
  ; sci/calc.e16.ts:391  const root = k === K_SQ && shift
  li t0, 17
  sub t0, s1, t0
  seqz t0, t0
  mv t1, t0
  beqz t1, .L5
  mv t0, s2
.L5:
  mv s2, t0 ; shift/root
  ; sci/calc.e16.ts:392  if (answered) afresh(fractionKey || k === K_POW)
  lw t0, 0x0538(zero)
  beqz t0, .L6
  ; sci/calc.e16.ts:392  afresh(fractionKey || k === K_POW)
  mv t0, s3
  mv t1, s3
  bnez t1, .L7
  li t0, 19
  sub t0, s1, t0
  seqz t0, t0
.L7:
  mv a0, t0
  call afresh
.L6:
  ; sci/calc.e16.ts:393  if (fractionKey) {
  beqz s3, .L8
  ; sci/calc.e16.ts:394  fraction(addr(line), length, cursor)
  lw a1, 0x0534(zero)
  lw a2, 0x0536(zero)
  la a0, line
  la t0, fraction
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:395  edited()
  call edited
  j .L9
.L8:
  ; sci/calc.e16.ts:396  insertTemplate(k, root)
  mv a0, s1
  mv a1, s2
  call insertTemplate
.L9:
  ; sci/calc.e16.ts:397  if (heightOf(addr(line), length) > LINE_HEIGHT_MAX) {
  lw a1, 0x0534(zero)
  la a0, line
  la t0, heightOf
  li t1, 3
  call far_call
  li t0, 36
  bgeu t0, a0, .L10
  ; sci/calc.e16.ts:398  refuse()
  call refuse
  ; sci/calc.e16.ts:400  deleteAt(addr(line), length, cursor)
  lw a1, 0x0534(zero)
  lw a2, 0x0536(zero)
  la a0, line
  la t0, deleteAt
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:401  edited()
  call edited
.L10:
  ; sci/calc.e16.ts:403  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:404  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:408 makesTemplate(k, shift) at -O1
;   k in a0
;   shift in a1
makesTemplate:
  ; sci/calc.e16.ts:409  if (shift) return k === K_SQ || k === K_LOG || k === K_LN
  beqz a1, .L1
  ; sci/calc.e16.ts:409  return k === K_SQ || k === K_LOG || k === K_LN
  li t0, 17
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L3
  li t0, 20
  sub t0, a0, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 21
  sub t0, a0, t0
  seqz t0, t0
.L2:
  mv a0, t0
  ret
.L1:
  ; sci/calc.e16.ts:410  return k === K_POW
  li t0, 19
  sub t0, a0, t0
  seqz a0, t0
.return:
  ret

; sci/calc.e16.ts:414 edited() at -O1
edited:
  ; sci/calc.e16.ts:415  length = editLength
  lw t0, 0x0686(zero)
  sw t0, 0x0534(zero)
  ; sci/calc.e16.ts:416  cursor = editCursor
  lw t0, 0x0688(zero)
  sw t0, 0x0536(zero)
.return:
  ret

; sci/calc.e16.ts:420 afresh(fromAns) at -O1
;   fromAns in s1
afresh:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; fromAns
  ; sci/calc.e16.ts:421  answered = false
  sw zero, 0x0538(zero)
  ; sci/calc.e16.ts:422  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x0542(zero)
  ; sci/calc.e16.ts:423  length = 0
  sw zero, 0x0534(zero)
  ; sci/calc.e16.ts:424  cursor = 0
  sw zero, 0x0536(zero)
  ; sci/calc.e16.ts:425  if (fromAns) insert(T_ANS)
  beqz s1, .L1
  ; sci/calc.e16.ts:425  insert(T_ANS)
  li a0, 20
  call insert
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:429 insertTemplate(k, root) at -O1
;   k in s1
;   root in s2
insertTemplate:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; root
  ; sci/calc.e16.ts:430  if (k === K_LOG) insert(T_TEN)
  li t0, 20
  bne s1, t0, .L1
  ; sci/calc.e16.ts:430  insert(T_TEN)
  li a0, 21
  call insert
.L1:
  ; sci/calc.e16.ts:431  if (k === K_LN) insert(T_E)
  li t0, 21
  bne s1, t0, .L2
  ; sci/calc.e16.ts:431  insert(T_E)
  li a0, 101
  call insert
.L2:
  ; sci/calc.e16.ts:432  insert(root ? T_ROOT : T_POWT)
  beqz s2, .L3
  li t0, 25
  j .L4
.L3:
  li t0, 26
.L4:
  mv a0, t0
  call insert
  ; sci/calc.e16.ts:433  insert(T_END)
  li a0, 24
  call insert
  ; sci/calc.e16.ts:434  cursor--
  lw t0, 0x0536(zero)
  addi t0, t0, -1
  sw t0, 0x0536(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:438 commandKey(k, shift, alpha) at -O1
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
  ; sci/calc.e16.ts:439  switch (k) {
  li t0, 8
  beq s1, t0, .L2
  li t0, 9
  beq s1, t0, .L3
  li t0, 5
  beq s1, t0, .L4
  li t0, 4
  beq s1, t0, .L5
  li t0, 13
  beq s1, t0, .L6
  li t0, 12
  beq s1, t0, .L7
  li t0, 2
  beq s1, t0, .L8
  li t0, 3
  beq s1, t0, .L9
  beq s1, zero, .L10
  li t0, 1
  beq s1, t0, .L11
  li t0, 14
  beq s1, t0, .L12
  j .L1
.L2:
  ; sci/calc.e16.ts:441  screen = S_MENU
  li t0, 2
  sw t0, 0x046a(zero)
  ; sci/calc.e16.ts:442  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:443  menuScreen()
  la t0, menuScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:444  return true
  li a0, 1
  j .return
.L3:
  ; sci/calc.e16.ts:446  screen = S_SETUP
  li t0, 3
  sw t0, 0x046a(zero)
  ; sci/calc.e16.ts:447  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:448  setupScreen()
  la t0, setupScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:449  return true
  li a0, 1
  j .return
.L4:
  ; sci/calc.e16.ts:451  clearLine()
  call clearLine
  ; sci/calc.e16.ts:452  return true
  li a0, 1
  j .return
.L5:
  ; sci/calc.e16.ts:454  equals(shift)
  mv a0, s2
  call equals
  ; sci/calc.e16.ts:455  return true
  li a0, 1
  j .return
.L6:
  ; sci/calc.e16.ts:457  exactOrDecimal(shift)
  mv a0, s2
  call exactOrDecimal
  ; sci/calc.e16.ts:458  return true
  li a0, 1
  j .return
.L7:
  ; sci/calc.e16.ts:460  recalling = shift
  sw s2, 0x0540(zero)
  ; sci/calc.e16.ts:461  storing = !shift
  seqz t0, s2
  sw t0, 0x053e(zero)
  ; sci/calc.e16.ts:462  return true
  li a0, 1
  j .return
.L8:
.L9:
  ; sci/calc.e16.ts:465  arrow(k === K_LEFT)
  li t0, 2
  sub t0, s1, t0
  seqz a0, t0
  call arrow
  ; sci/calc.e16.ts:466  return true
  li a0, 1
  j .return
.L10:
.L11:
  ; sci/calc.e16.ts:469  history(k === K_UP)
  sub t0, s1, zero
  seqz a0, t0
  call history
  ; sci/calc.e16.ts:470  return true
  li a0, 1
  j .return
.L12:
  ; sci/calc.e16.ts:472  deleteBefore()
  call deleteBefore
  ; sci/calc.e16.ts:473  return true
  li a0, 1
  j .return
.L1:
  ; sci/calc.e16.ts:475  if (k !== K_MPLUS || alpha) return false
  li t0, 37
  bne s1, t0, .L14
  beqz s3, .L13
.L14:
  ; sci/calc.e16.ts:475  return false
  li a0, 0
  j .return
.L13:
  ; sci/calc.e16.ts:476  memoryPlus(shift)
  mv a0, s2
  call memoryPlus
  ; sci/calc.e16.ts:477  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:481 tokenOf(k, shift) at -O1
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
  ; sci/calc.e16.ts:482  const plain = plainToken(k)
  mv a0, s1
  call plainToken
  mv s2, a0 ; plain
  ; sci/calc.e16.ts:483  return plain !== 0 ? plain : faceToken(k, shift)
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

; sci/calc.e16.ts:487 plainToken(k) at -O1
;   k in a0
plainToken:
  ; sci/calc.e16.ts:488  switch (k) {
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
  ; sci/calc.e16.ts:490  return 0x30
  li a0, 48
  ret
.L3:
  ; sci/calc.e16.ts:492  return 0x31
  li a0, 49
  ret
.L4:
  ; sci/calc.e16.ts:494  return 0x32
  li a0, 50
  ret
.L5:
  ; sci/calc.e16.ts:496  return 0x33
  li a0, 51
  ret
.L6:
  ; sci/calc.e16.ts:498  return 0x34
  li a0, 52
  ret
.L7:
  ; sci/calc.e16.ts:500  return 0x35
  li a0, 53
  ret
.L8:
  ; sci/calc.e16.ts:502  return 0x36
  li a0, 54
  ret
.L9:
  ; sci/calc.e16.ts:504  return 0x37
  li a0, 55
  ret
.L10:
  ; sci/calc.e16.ts:506  return 0x38
  li a0, 56
  ret
.L11:
  ; sci/calc.e16.ts:508  return 0x39
  li a0, 57
  ret
.L12:
  ; sci/calc.e16.ts:510  return T_POINT
  li a0, 46
  ret
.L13:
  ; sci/calc.e16.ts:512  return T_PLUS
  li a0, 43
  ret
.L14:
  ; sci/calc.e16.ts:514  return T_MINUS
  li a0, 45
  ret
.L15:
  ; sci/calc.e16.ts:516  return T_TIMES
  li a0, 129
  ret
.L16:
  ; sci/calc.e16.ts:518  return T_DIVIDE
  li a0, 130
  ret
.L17:
  ; sci/calc.e16.ts:520  return T_OPEN
  li a0, 40
  ret
.L18:
  ; sci/calc.e16.ts:522  return T_CLOSE
  li a0, 41
  ret
.L19:
  ; sci/calc.e16.ts:524  return T_ANS
  li a0, 20
  ret
.L1:
  ; sci/calc.e16.ts:526  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:530 faceToken(k, shift) at -O1
;   k in s1
;   shift in s2
faceToken:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift
  ; sci/calc.e16.ts:531  return shift ? shiftFace(k) : capToken(k)
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

; sci/calc.e16.ts:535 capToken(k) at -O1
;   k in a0
capToken:
  ; sci/calc.e16.ts:536  switch (k) {
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
  ; sci/calc.e16.ts:538  return T_NEG
  li a0, 16
  ret
.L3:
  ; sci/calc.e16.ts:540  return T_EXP
  li a0, 135
  ret
.L4:
  ; sci/calc.e16.ts:542  return T_SQUARE
  li a0, 132
  ret
.L5:
  ; sci/calc.e16.ts:544  return T_CUBE
  li a0, 133
  ret
.L6:
  ; sci/calc.e16.ts:546  return T_POW
  li a0, 17
  ret
.L7:
  ; sci/calc.e16.ts:548  return T_LOG
  li a0, 7
  ret
.L8:
  ; sci/calc.e16.ts:550  return T_LN
  li a0, 8
  ret
.L9:
  ; sci/calc.e16.ts:552  return T_SIN
  li a0, 1
  ret
.L10:
  ; sci/calc.e16.ts:554  return T_COS
  li a0, 2
  ret
.L11:
  ; sci/calc.e16.ts:556  return T_TAN
  li a0, 3
  ret
.L12:
  ; sci/calc.e16.ts:558  return T_INVERSE
  li a0, 134
  ret
.L13:
  ; sci/calc.e16.ts:560  return T_NCR
  li a0, 18
  ret
.L1:
  ; sci/calc.e16.ts:562  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:566 shiftFace(k) at -O1
;   k in a0
shiftFace:
  ; sci/calc.e16.ts:567  switch (k) {
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
  ; sci/calc.e16.ts:569  return T_PI
  li a0, 128
  ret
.L3:
  ; sci/calc.e16.ts:571  return T_SQRT
  li a0, 9
  ret
.L4:
  ; sci/calc.e16.ts:573  return T_CBRT
  li a0, 10
  ret
.L5:
  ; sci/calc.e16.ts:575  return T_TEN
  li a0, 21
  ret
.L6:
  ; sci/calc.e16.ts:577  return T_E
  li a0, 101
  ret
.L7:
  ; sci/calc.e16.ts:579  return T_ASIN
  li a0, 4
  ret
.L8:
  ; sci/calc.e16.ts:581  return T_ACOS
  li a0, 5
  ret
.L9:
  ; sci/calc.e16.ts:583  return T_ATAN
  li a0, 6
  ret
.L10:
  ; sci/calc.e16.ts:585  return T_BANG
  li a0, 33
  ret
.L11:
  ; sci/calc.e16.ts:587  return T_NPR
  li a0, 19
  ret
.L1:
  ; sci/calc.e16.ts:589  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:593 letterOf(k) at -O1
;   k in a0
letterOf:
  ; sci/calc.e16.ts:594  switch (k) {
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
  ; sci/calc.e16.ts:596  return 0x41
  li a0, 65
  ret
.L3:
  ; sci/calc.e16.ts:598  return 0x42
  li a0, 66
  ret
.L4:
  ; sci/calc.e16.ts:600  return 0x43
  li a0, 67
  ret
.L5:
  ; sci/calc.e16.ts:602  return 0x44
  li a0, 68
  ret
.L6:
  ; sci/calc.e16.ts:604  return 0x45
  li a0, 69
  ret
.L7:
  ; sci/calc.e16.ts:606  return 0x46
  li a0, 70
  ret
.L8:
  ; sci/calc.e16.ts:608  return 0x58
  li a0, 88
  ret
.L9:
  ; sci/calc.e16.ts:610  return 0x59
  li a0, 89
  ret
.L10:
  ; sci/calc.e16.ts:612  return 0x4d
  li a0, 77
  ret
.L11:
  ; sci/calc.e16.ts:614  return T_E
  li a0, 101
  ret
.L1:
  ; sci/calc.e16.ts:616  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:620 fromAns(t) at -O1
;   t in a0
fromAns:
  ; sci/calc.e16.ts:621  return (
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

; sci/calc.e16.ts:637 type(t) at -O1
;   t in s1
type:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/calc.e16.ts:638  if (answered) {
  lw t0, 0x0538(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:639  answered = false
  sw zero, 0x0538(zero)
  ; sci/calc.e16.ts:640  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x0542(zero)
  ; sci/calc.e16.ts:641  length = 0
  sw zero, 0x0534(zero)
  ; sci/calc.e16.ts:642  cursor = 0
  sw zero, 0x0536(zero)
  ; sci/calc.e16.ts:643  if (fromAns(t)) insert(T_ANS)
  mv a0, s1
  call fromAns
  beqz a0, .L2
  ; sci/calc.e16.ts:643  insert(T_ANS)
  li a0, 20
  call insert
.L2:
.L1:
  ; sci/calc.e16.ts:645  insert(t)
  mv a0, s1
  call insert
  ; sci/calc.e16.ts:646  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:649 insert(t) at -O1
;   t in s1
insert:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/calc.e16.ts:650  if (length >= LINE_MAX) {
  lw t0, 0x0534(zero)
  li t1, 199
  bltu t0, t1, .L1
  ; sci/calc.e16.ts:651  refuse()
  call refuse
  ; sci/calc.e16.ts:652  return
  j .return
.L1:
  ; sci/calc.e16.ts:654  memcpy(addr(line) + cursor + 1, addr(line) + cursor, length - cursor)
  lw t0, 0x0536(zero)
  lw t1, 0x0536(zero)
  lw t2, 0x0534(zero)
  lw t3, 0x0536(zero)
  sub a2, t2, t3
  addi a0, t0, line+1
  addi a1, t1, line
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:655  line[cursor] = t
  lw t0, 0x0536(zero)
  sb s1, line(t0)
  ; sci/calc.e16.ts:656  length++
  lw t0, 0x0534(zero)
  addi t0, t0, 1
  sw t0, 0x0534(zero)
  ; sci/calc.e16.ts:657  cursor++
  lw t0, 0x0536(zero)
  addi t0, t0, 1
  sw t0, 0x0536(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:660 deleteBefore() at -O1
deleteBefore:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:661  if (answered) {
  lw t0, 0x0538(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:662  answered = false
  sw zero, 0x0538(zero)
  ; sci/calc.e16.ts:663  cursor = length
  lw t0, 0x0534(zero)
  sw t0, 0x0536(zero)
.L1:
  ; sci/calc.e16.ts:665  deleteAt(addr(line), length, cursor)
  lw a1, 0x0534(zero)
  lw a2, 0x0536(zero)
  la a0, line
  la t0, deleteAt
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:666  length = editLength
  lw t0, 0x0686(zero)
  sw t0, 0x0534(zero)
  ; sci/calc.e16.ts:667  cursor = editCursor
  lw t0, 0x0688(zero)
  sw t0, 0x0536(zero)
  ; sci/calc.e16.ts:668  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:672 arrow(left) at -O1
;   left in s1
arrow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; left
  ; sci/calc.e16.ts:673  if (answered) {
  lw t0, 0x0538(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:674  answered = false
  sw zero, 0x0538(zero)
  ; sci/calc.e16.ts:675  cursor = left ? length : 0
  beqz s1, .L2
  lw t0, 0x0534(zero)
  j .L3
.L2:
  li t0, 0
.L3:
  sw t0, 0x0536(zero)
  j .L4
.L1:
  ; sci/calc.e16.ts:676  if (left) {
  beqz s1, .L5
  ; sci/calc.e16.ts:677  cursor = cursor > 0 ? cursor - 1 : length
  lw t0, 0x0536(zero)
  bgeu zero, t0, .L6
  lw t0, 0x0536(zero)
  addi t0, t0, -1
  j .L7
.L6:
  lw t0, 0x0534(zero)
.L7:
  sw t0, 0x0536(zero)
  j .L8
.L5:
  ; sci/calc.e16.ts:679  cursor = cursor < length ? cursor + 1 : 0
  lw t0, 0x0536(zero)
  lw t1, 0x0534(zero)
  bgeu t0, t1, .L9
  lw t0, 0x0536(zero)
  addi t0, t0, 1
  j .L10
.L9:
  li t0, 0
.L10:
  sw t0, 0x0536(zero)
.L8:
.L4:
  ; sci/calc.e16.ts:681  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:691 equals(approx) at -O1
;   approx in s1
equals:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; approx
  ; sci/calc.e16.ts:692  if (length === 0) return
  lw t0, 0x0534(zero)
  bne t0, zero, .L1
  ; sci/calc.e16.ts:692  return
  j .return
.L1:
  ; sci/calc.e16.ts:693  clearStack()
  ; sci/numbers.e16.ts:156  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0468(zero)
  ; sci/calc.e16.ts:694  evaluate(addr(line), length)
  lw a1, 0x0534(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/calc.e16.ts:695  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
  ; sci/calc.e16.ts:696  remember()
  call remember
  ; sci/calc.e16.ts:697  answered = true
  li t0, 1
  sw t0, 0x0538(zero)
  ; sci/calc.e16.ts:698  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x0542(zero)
  ; sci/calc.e16.ts:699  exactShown = twoD() && !approx && peek(KEEP_ANSWER) === 0 && !decimalTyped()
  call twoD
  mv t1, a0
  mv t0, a0
  beqz t1, .L4
  seqz t0, s1
.L4:
  mv t1, t0
  beqz t1, .L3
  lbu t0, 3076(zero)
  sub t0, t0, zero
  seqz t0, t0
.L3:
  mv t1, t0
  beqz t1, .L2
  call decimalTyped
  seqz t0, a0
.L2:
  sw t0, 0x055e(zero)
  ; sci/calc.e16.ts:700  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:704 decimalTyped() at -O1
;   i in a0
decimalTyped:
  ; sci/calc.e16.ts:705  for (let i: u16 = 0; i < length; i++) {
  li a0, 0 ; i
  j .L3
.L1:
  ; sci/calc.e16.ts:706  if (line[i] === T_POINT) return true
  lbu t0, line(a0)
  li t1, 46
  bne t0, t1, .L5
  ; sci/calc.e16.ts:706  return true
  li a0, 1
  ret
.L5:
  addi a0, a0, 1
.L3:
  lw t0, 0x0534(zero)
  bltu a0, t0, .L1
  ; sci/calc.e16.ts:708  return false
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:712 exactOrDecimal(shift) at -O1
;   shift in s1
exactOrDecimal:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; shift
  ; sci/calc.e16.ts:713  if (shift || !answered || !twoD() || !hasForm()) {
  bnez s1, .L2
  lw t0, 0x0538(zero)
  beqz t0, .L2
  call twoD
  beqz a0, .L2
  call hasForm
  bnez a0, .L1
.L2:
  ; sci/calc.e16.ts:714  refuse()
  call refuse
  ; sci/calc.e16.ts:715  return
  j .return
.L1:
  ; sci/calc.e16.ts:717  exactShown = !exactShown
  lw t0, 0x055e(zero)
  seqz t0, t0
  sw t0, 0x055e(zero)
  ; sci/calc.e16.ts:718  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:722 hasForm() at -O1
hasForm:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:723  if (!isExact(KEEP_ANS)) return false
  li a0, 3080
  call isExact
  bnez a0, .L1
  ; sci/calc.e16.ts:723  return false
  li a0, 0
  j .return
.L1:
  ; sci/calc.e16.ts:724  return !isZero(KEEP_ANS + V_R) || !isOne(KEEP_ANS + V_Q)
  li a0, 3100
  call isZero
  seqz t0, a0
  mv t1, t0
  bnez t1, .L2
  li a0, 3108
  call isOne
  seqz t0, a0
.L2:
  mv a0, t0
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:727 isOne(n) at -O1
;   n in a0
isOne:
  ; sci/calc.e16.ts:728  return (
  lbu t0, 0(a0)
  sub t0, t0, zero
  seqz t0, t0
  mv t1, t0
  beqz t1, .L4
  lbu t0, 1(a0)
  sub t0, t0, zero
  seqz t0, t0
.L4:
  mv t1, t0
  beqz t1, .L3
  lbu t0, 2(a0)
  li t1, 16
  sub t0, t0, t1
  seqz t0, t0
.L3:
  mv t1, t0
  beqz t1, .L2
  lw t0, 4(a0)
  sub t0, t0, zero
  seqz t0, t0
.L2:
  mv t1, t0
  beqz t1, .L1
  lw t0, 6(a0)
  sub t0, t0, zero
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; sci/calc.e16.ts:738 variableKey(k/letter) at -O1
;   k/letter in s1
;   store in s2
variableKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/letter
  ; sci/calc.e16.ts:739  const store = storing
  lw s2, 0x053e(zero)
  ; sci/calc.e16.ts:740  storing = false
  sw zero, 0x053e(zero)
  ; sci/calc.e16.ts:741  recalling = false
  sw zero, 0x0540(zero)
  ; sci/calc.e16.ts:742  const letter = letterOf(k)
  mv a0, s1
  call letterOf
  mv s1, a0 ; k/letter
  ; sci/calc.e16.ts:743  if (letter === 0 || letter === T_E) {
  beq s1, zero, .L2
  li t0, 101
  bne s1, t0, .L1
.L2:
  ; sci/calc.e16.ts:744  refuse()
  call refuse
  ; sci/calc.e16.ts:745  return
  j .return
.L1:
  ; sci/calc.e16.ts:747  if (store) {
  beqz s2, .L3
  ; sci/calc.e16.ts:748  if (!answered && length > 0) {
  lw t0, 0x0538(zero)
  bnez t0, .L4
  lw t0, 0x0534(zero)
  bgeu zero, t0, .L4
  ; sci/calc.e16.ts:749  clearStack()
  ; sci/numbers.e16.ts:156  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0468(zero)
  ; sci/calc.e16.ts:750  evaluate(addr(line), length)
  lw a1, 0x0534(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/calc.e16.ts:751  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
  ; sci/calc.e16.ts:752  remember()
  call remember
.L4:
  ; sci/calc.e16.ts:754  copyValue(KEEP_ANS, varAt(letter))
  mv a0, s1
  call varAt
  mv a1, a0
  li a0, 3080
  call copyValue
  j .L5
.L3:
  ; sci/calc.e16.ts:756  copyValue(varAt(letter), KEEP_ANS)
  mv a0, s1
  call varAt
  li a1, 3080
  call copyValue
.L5:
  ; sci/calc.e16.ts:758  exactShown = twoD() && peek(KEEP_ANSWER) === 0
  call twoD
  mv t1, a0
  mv t0, a0
  beqz t1, .L6
  lbu t0, 3076(zero)
  sub t0, t0, zero
  seqz t0, t0
.L6:
  sw t0, 0x055e(zero)
  ; sci/calc.e16.ts:759  length = 0
  sw zero, 0x0534(zero)
  ; sci/calc.e16.ts:760  cursor = 0
  sw zero, 0x0536(zero)
  ; sci/calc.e16.ts:761  insert(T_ANS)
  li a0, 20
  call insert
  ; sci/calc.e16.ts:762  answered = true
  li t0, 1
  sw t0, 0x0538(zero)
  ; sci/calc.e16.ts:763  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:767 memoryPlus(minus/op) at -O1
;   minus/op in s1
;   m in s2
memoryPlus:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; minus/op
  ; sci/calc.e16.ts:768  if (!answered) {
  lw t0, 0x0538(zero)
  bnez t0, .L1
  ; sci/calc.e16.ts:769  if (length === 0) {
  lw t0, 0x0534(zero)
  bne t0, zero, .L2
  ; sci/calc.e16.ts:770  length = 0
  sw zero, 0x0534(zero)
  ; sci/calc.e16.ts:771  insert(T_ANS)
  li a0, 20
  call insert
.L2:
  ; sci/calc.e16.ts:773  clearStack()
  ; sci/numbers.e16.ts:156  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0468(zero)
  ; sci/calc.e16.ts:774  evaluate(addr(line), length)
  lw a1, 0x0534(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/calc.e16.ts:775  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
  ; sci/calc.e16.ts:776  remember()
  call remember
.L1:
  ; sci/calc.e16.ts:778  const m = varAt(0x4d)
  li s2, 3408 ; m
  ; sci/calc.e16.ts:779  const op = minus ? M_SUB : M_ADD
  beqz s1, .L3
  li t0, 2
  j .L4
.L3:
  li t0, 1
.L4:
  mv s1, t0 ; minus/op
  ; sci/calc.e16.ts:780  math(op, m, KEEP_ANS, 0)
  mv a0, s1
  mv a1, s2
  li a2, 3080
  li a3, 0
  call math
  ; sci/calc.e16.ts:781  exactBinary(op, m, KEEP_ANS)
  mv a0, s1
  mv a1, s2
  li a2, 3080
  la t0, exactBinary
  li t1, 2
  call far_call
  ; sci/calc.e16.ts:782  answered = true
  li t0, 1
  sw t0, 0x0538(zero)
  ; sci/calc.e16.ts:783  exactShown = twoD() && peek(KEEP_ANSWER) === 0
  call twoD
  mv t1, a0
  mv t0, a0
  beqz t1, .L5
  lbu t0, 3076(zero)
  sub t0, t0, zero
  seqz t0, t0
.L5:
  sw t0, 0x055e(zero)
  ; sci/calc.e16.ts:784  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:790 remember() at -O1
;   count/kept in s1
remember:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/calc.e16.ts:791  const count = peek16(KEEP_HISTORY_COUNT)
  lw s1, 3456(zero)
  ; sci/calc.e16.ts:792  const kept = count < HISTORY_ENTRIES ? count : HISTORY_ENTRIES - 1
  li t0, 10
  bgeu s1, t0, .L1
  mv t0, s1
  j .L2
.L1:
  li t0, 9
.L2:
  mv s1, t0 ; count/kept
  ; sci/calc.e16.ts:793  memcpy(KEEP_HISTORY + HISTORY_SIZE, KEEP_HISTORY, kept * HISTORY_SIZE)
  li t0, 200
  mul a2, s1, t0
  li a0, 3658
  li a1, 3458
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:794  poke(KEEP_HISTORY, length)
  lw t0, 0x0534(zero)
  sb t0, 3458(zero)
  ; sci/calc.e16.ts:795  memcpy(KEEP_HISTORY + 1, addr(line), length)
  lw a2, 0x0534(zero)
  li a0, 3459
  la a1, line
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:796  poke16(KEEP_HISTORY_COUNT, kept + 1)
  addi t0, s1, 1
  sw t0, 3456(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:803 history(older/entry) at -O1
;   older/entry in s1
;   count in s0
;   browsing in s3
;   next in s2
history:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s0, 4(sp)
  sw s3, 6(sp)
  sw s2, 8(sp)
  mv s1, a0 ; older/entry
  ; sci/calc.e16.ts:804  if (!answered && twoD()) {
  lw t0, 0x0538(zero)
  bnez t0, .L1
  call twoD
  beqz a0, .L1
  ; sci/calc.e16.ts:805  vertical(addr(line), length, cursor, older)
  lw a1, 0x0534(zero)
  lw a2, 0x0536(zero)
  la a0, line
  mv a3, s1
  la t0, vertical
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:806  if (editCursor !== 0xffff) {
  lw t0, 0x0688(zero)
  li t1, 65535
  beq t0, t1, .L2
  ; sci/calc.e16.ts:807  cursor = editCursor
  lw t0, 0x0688(zero)
  sw t0, 0x0536(zero)
  ; sci/calc.e16.ts:808  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:809  return
  j .return
.L2:
.L1:
  ; sci/calc.e16.ts:812  const count = peek16(KEEP_HISTORY_COUNT)
  lw s0, 3456(zero)
  ; sci/calc.e16.ts:813  const browsing = historyAt !== 0xffff
  lw t0, 0x0542(zero)
  li t1, 65535
  sub t0, t0, t1
  snez s3, t0
  ; sci/calc.e16.ts:814  if (!answered && length > 0 && !browsing) return
  lw t0, 0x0538(zero)
  bnez t0, .L3
  lw t0, 0x0534(zero)
  bgeu zero, t0, .L3
  bnez s3, .L3
  ; sci/calc.e16.ts:814  return
  j .return
.L3:
  ; sci/calc.e16.ts:815  let next = historyAt
  lw s2, 0x0542(zero)
  ; sci/calc.e16.ts:816  if (older) next = browsing ? historyAt + 1 : 0
  beqz s1, .L4
  ; sci/calc.e16.ts:816  next = browsing ? historyAt + 1 : 0
  beqz s3, .L5
  lw t0, 0x0542(zero)
  addi t0, t0, 1
  j .L6
.L5:
  li t0, 0
.L6:
  mv s2, t0 ; next
  j .L7
.L4:
  ; sci/calc.e16.ts:817  if (browsing && historyAt > 0) next = historyAt - 1
  beqz s3, .L8
  lw t0, 0x0542(zero)
  bgeu zero, t0, .L8
  ; sci/calc.e16.ts:817  next = historyAt - 1
  lw t0, 0x0542(zero)
  addi s2, t0, -1
  j .L9
.L8:
  ; sci/calc.e16.ts:818  return
  j .return
.L9:
.L7:
  ; sci/calc.e16.ts:819  if (next >= count) return
  bltu s2, s0, .L10
  ; sci/calc.e16.ts:819  return
  j .return
.L10:
  ; sci/calc.e16.ts:820  historyAt = next
  sw s2, 0x0542(zero)
  ; sci/calc.e16.ts:821  const entry = KEEP_HISTORY + next * HISTORY_SIZE
  li t0, 200
  mul t0, s2, t0
  addi s1, t0, 3458
  ; sci/calc.e16.ts:822  length = peek(entry)
  lbu t0, 0(s1)
  sw t0, 0x0534(zero)
  ; sci/calc.e16.ts:823  memcpy(addr(line), entry + 1, length)
  lw a2, 0x0534(zero)
  la a0, line
  addi a1, s1, 1
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:824  cursor = length
  lw t0, 0x0534(zero)
  sw t0, 0x0536(zero)
  ; sci/calc.e16.ts:825  answered = false
  sw zero, 0x0538(zero)
  ; sci/calc.e16.ts:826  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/calc.e16.ts:832 drawMarks() at -O1
;   bits in s1
;   angle in s2
drawMarks:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/calc.e16.ts:833  let bits: u16 = 0
  li s1, 0 ; bits
  ; sci/calc.e16.ts:834  if (shifted) bits |= ANN_S
  lw t0, 0x053a(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:834  bits |= ANN_S
  ori s1, s1, 2
.L1:
  ; sci/calc.e16.ts:835  if (alphaOn || storing || recalling) bits |= ANN_A
  lw t0, 0x053c(zero)
  bnez t0, .L3
  lw t0, 0x053e(zero)
  bnez t0, .L3
  lw t0, 0x0540(zero)
  beqz t0, .L2
.L3:
  ; sci/calc.e16.ts:835  bits |= ANN_A
  ori s1, s1, 4
.L2:
  ; sci/calc.e16.ts:836  if (storing) bits |= ANN_STO
  lw t0, 0x053e(zero)
  beqz t0, .L4
  ; sci/calc.e16.ts:836  bits |= ANN_STO
  ori s1, s1, 16
.L4:
  ; sci/calc.e16.ts:837  if (peek(varAt(0x4d) + 2) !== 0) bits |= ANN_M
  lbu t0, 3410(zero)
  beq t0, zero, .L5
  ; sci/calc.e16.ts:837  bits |= ANN_M
  ori s1, s1, 8
.L5:
  ; sci/calc.e16.ts:838  const angle = peek(KEEP_ANGLE)
  lbu s2, 3074(zero)
  ; sci/calc.e16.ts:839  bits |= angle === 1 ? ANN_R : angle === 2 ? ANN_G : ANN_D
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
  ; sci/calc.e16.ts:840  if (twoD()) bits |= ANN_2D
  call twoD
  beqz a0, .L10
  ; sci/calc.e16.ts:840  bits |= ANN_2D
  ori s1, s1, 4096
.L10:
  ; sci/calc.e16.ts:841  if (screen === S_CALC) bits |= historyMarks()
  lw t0, 0x046a(zero)
  bne t0, zero, .L11
  ; sci/calc.e16.ts:841  bits |= historyMarks()
  call historyMarks
  or s1, s1, a0
.L11:
  ; sci/calc.e16.ts:842  marks(bits)
  ; sci/lcd.e16.ts:171  poke16(IO_ANNUNCIATORS, bits)
  li t0, 65326
  sw s1, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:846 historyMarks() at -O1
;   count in a1
;   browsing in a2
;   bits in a0
historyMarks:
  ; sci/calc.e16.ts:847  const count = peek16(KEEP_HISTORY_COUNT)
  lw a1, 3456(zero)
  ; sci/calc.e16.ts:848  const browsing = historyAt !== 0xffff
  lw t0, 0x0542(zero)
  li t1, 65535
  sub t0, t0, t1
  snez a2, t0
  ; sci/calc.e16.ts:849  let bits: u16 = 0
  li a0, 0 ; bits
  ; sci/calc.e16.ts:850  if (browsing ? historyAt + 1 < count : count > 0 && (answered || length === 0)) bits |= ANN_UP
  beqz a2, .L2
  lw t0, 0x0542(zero)
  addi t0, t0, 1
  sltu t0, t0, a1
  j .L3
.L2:
  sltu t0, zero, a1
  mv t1, t0
  beqz t1, .L4
  lw t0, 0x0538(zero)
  mv t1, t0
  bnez t1, .L5
  lw t0, 0x0534(zero)
  sub t0, t0, zero
  seqz t0, t0
.L5:
.L4:
.L3:
  beqz t0, .L1
  ; sci/calc.e16.ts:850  bits |= ANN_UP
  li t0, 8192
  or a0, a0, t0
.L1:
  ; sci/calc.e16.ts:851  if (browsing && historyAt > 0) bits |= ANN_DOWN
  beqz a2, .L6
  lw t0, 0x0542(zero)
  bgeu zero, t0, .L6
  ; sci/calc.e16.ts:851  bits |= ANN_DOWN
  li t0, 16384
  or a0, a0, t0
.L6:
  ; sci/calc.e16.ts:852  return bits
.return:
  ret

; sci/calc.e16.ts:856 drawCalc() at -O1
drawCalc:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:857  cls()
  call cls
  ; sci/calc.e16.ts:858  if (twoD()) drawLine2D()
  call twoD
  beqz a0, .L1
  ; sci/calc.e16.ts:858  drawLine2D()
  call drawLine2D
  j .L2
.L1:
  ; sci/calc.e16.ts:859  drawLine()
  call drawLine
.L2:
  ; sci/calc.e16.ts:860  if (answered) {
  lw t0, 0x0538(zero)
  beqz t0, .L3
  ; sci/calc.e16.ts:861  if (exactShown && hasForm()) drawExact()
  lw t0, 0x055e(zero)
  beqz t0, .L4
  call hasForm
  beqz a0, .L4
  ; sci/calc.e16.ts:861  drawExact()
  call drawExact
  j .L5
.L4:
  ; sci/calc.e16.ts:862  drawAnswer()
  call drawAnswer
.L5:
.L3:
  ; sci/calc.e16.ts:864  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:868 drawLine2D() at -O1
drawLine2D:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:869  setLine(addr(line), length, answered ? 0xffff : cursor)
  lw t1, 0x0534(zero)
  lw t2, 0x0538(zero)
  la t0, line
  beqz t2, .L1
  li t2, 65535
  j .L2
.L1:
  lw t2, 0x0536(zero)
.L2:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  la t0, setLine
  li t1, 3
  call far_call
  ; sci/calc.e16.ts:870  if (answered) noCursor()
  lw t0, 0x0538(zero)
  beqz t0, .L3
  ; sci/calc.e16.ts:870  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  j .L4
.L3:
  ; sci/calc.e16.ts:871  barDots(cursorX, cursorTop)
  lw a0, 0x067e(zero)
  lw a1, 0x0680(zero)
  call barDots
.L4:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:875 drawExact() at -O1
;   fractionOf in s2
;   oneTerm/signOut in s1
drawExact:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; sci/calc.e16.ts:876  answerLength = 0
  sw zero, 0x0590(zero)
  ; sci/calc.e16.ts:877  const p = KEEP_ANS + V_P
  ; sci/calc.e16.ts:878  const r = KEEP_ANS + V_R
  ; sci/calc.e16.ts:879  const q = KEEP_ANS + V_Q
  ; sci/calc.e16.ts:880  const fractionOf = !isOne(q)
  li a0, 3108
  call isOne
  seqz s2, a0
  ; sci/calc.e16.ts:881  const oneTerm = isZero(p) || isZero(r)
  li a0, 3092
  call isZero
  mv t1, a0
  mv t0, a0
  bnez t1, .L1
  li a0, 3100
  call isZero
  mv t0, a0
.L1:
  mv s1, t0 ; oneTerm/signOut
  ; sci/calc.e16.ts:883  const signOut = oneTerm && fractionOf && (isZero(r) ? isNegative(p) : isNegative(r))
  mv t0, s1
  mv t1, s1
  beqz t1, .L3
  mv t0, s2
.L3:
  mv t1, t0
  beqz t1, .L2
  li a0, 3100
  call isZero
  beqz a0, .L4
  li a0, 3092
  call isNegative
  mv t0, a0
  j .L5
.L4:
  li a0, 3100
  call isNegative
  mv t0, a0
.L5:
.L2:
  mv s1, t0 ; oneTerm/signOut
  ; sci/calc.e16.ts:884  if (signOut) answerToken(T_MINUS)
  beqz s1, .L6
  ; sci/calc.e16.ts:884  answerToken(T_MINUS)
  li a0, 45
  call answerToken
.L6:
  ; sci/calc.e16.ts:885  if (fractionOf) answerToken(T_FRAC)
  beqz s2, .L7
  ; sci/calc.e16.ts:885  answerToken(T_FRAC)
  li a0, 22
  call answerToken
.L7:
  ; sci/calc.e16.ts:886  if (!isZero(p) || isZero(r)) answerNumber(p, signOut)
  li a0, 3092
  call isZero
  beqz a0, .L9
  li a0, 3100
  call isZero
  beqz a0, .L8
.L9:
  ; sci/calc.e16.ts:886  answerNumber(p, signOut)
  li a0, 3092
  mv a1, s1
  call answerNumber
.L8:
  ; sci/calc.e16.ts:887  if (!isZero(r)) answerRoot(p, r, signOut)
  li a0, 3100
  call isZero
  bnez a0, .L10
  ; sci/calc.e16.ts:887  answerRoot(p, r, signOut)
  li a0, 3092
  li a1, 3100
  mv a2, s1
  call answerRoot
.L10:
  ; sci/calc.e16.ts:888  if (fractionOf) {
  beqz s2, .L11
  ; sci/calc.e16.ts:889  answerToken(T_SEP)
  li a0, 23
  call answerToken
  ; sci/calc.e16.ts:890  answerNumber(q, false)
  li a0, 3108
  li a1, 0
  call answerNumber
  ; sci/calc.e16.ts:891  answerToken(T_END)
  li a0, 24
  call answerToken
.L11:
  ; sci/calc.e16.ts:893  setAnswer(addr(answerTokens), answerLength)
  lw a1, 0x0590(zero)
  la a0, answerTokens
  la t0, setAnswer
  li t1, 3
  call far_call
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:897 answerRoot(p, r, signOut) at -O1
;   p in s2
;   r in s1
;   signOut in s3
answerRoot:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; p
  mv s1, a1 ; r
  mv s3, a2 ; signOut
  ; sci/calc.e16.ts:898  if (!isZero(p)) answerToken(isNegative(r) ? T_MINUS : T_PLUS)
  mv a0, s2
  call isZero
  bnez a0, .L1
  ; sci/calc.e16.ts:898  answerToken(isNegative(r) ? T_MINUS : T_PLUS)
  mv a0, s1
  call isNegative
  beqz a0, .L2
  li t0, 45
  j .L3
.L2:
  li t0, 43
.L3:
  mv a0, t0
  call answerToken
  j .L4
.L1:
  ; sci/calc.e16.ts:899  if (isNegative(r) && !signOut) answerToken(T_MINUS)
  mv a0, s1
  call isNegative
  beqz a0, .L5
  bnez s3, .L5
  ; sci/calc.e16.ts:899  answerToken(T_MINUS)
  li a0, 45
  call answerToken
.L5:
.L4:
  ; sci/calc.e16.ts:900  if (!isOne(r) && !isMinusOne(r)) answerNumber(r, true)
  mv a0, s1
  call isOne
  bnez a0, .L6
  mv a0, s1
  call isMinusOne
  bnez a0, .L6
  ; sci/calc.e16.ts:900  answerNumber(r, true)
  mv a0, s1
  li a1, 1
  call answerNumber
.L6:
  ; sci/calc.e16.ts:901  answerToken(T_ROOT)
  li a0, 25
  call answerToken
  ; sci/calc.e16.ts:902  answerDigits(peek16(KEEP_ANS + V_S))
  lw a0, 3090(zero)
  call answerDigits
  ; sci/calc.e16.ts:903  answerToken(T_END)
  li a0, 24
  call answerToken
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:906 answerToken(t) at -O1
;   t in a0
answerToken:
  ; sci/calc.e16.ts:907  if (answerLength < 48) {
  lw t0, 0x0590(zero)
  li t1, 48
  bgeu t0, t1, .L1
  ; sci/calc.e16.ts:908  answerTokens[answerLength] = t
  lw t0, 0x0590(zero)
  sb a0, answerTokens(t0)
  ; sci/calc.e16.ts:909  answerLength++
  lw t0, 0x0590(zero)
  addi t0, t0, 1
  sw t0, 0x0590(zero)
.L1:
.return:
  ret

; sci/calc.e16.ts:914 answerNumber(n/count, bare) at -O1
;   n/count in s2
;   bare in s0
;   i in s1
;   c in s3
answerNumber:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  mv s2, a0 ; n/count
  mv s0, a1 ; bare
  ; sci/calc.e16.ts:915  poke16(MATH_ARG, 12)
  li t0, 12
  li t1, 65366
  sw t0, 0(t1)
  ; sci/calc.e16.ts:916  math(M_FORMAT, n, addr(answerText), 0)
  li a0, 57
  mv a1, s2
  la a2, answerText
  li a3, 0
  call math
  ; sci/calc.e16.ts:917  const count = peek16(MATH_ARG)
  li t0, 65366
  lw s2, 0(t0)
  ; sci/calc.e16.ts:918  for (let i: u16 = 0; i < count; i++) {
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/calc.e16.ts:919  const c = answerText[i]
  lbu s3, answerText(s1)
  ; sci/calc.e16.ts:920  if (c === 0x2d) {
  li t0, 45
  bne s3, t0, .L5
  ; sci/calc.e16.ts:921  if (!bare) answerToken(T_MINUS)
  bnez s0, .L7
  ; sci/calc.e16.ts:921  answerToken(T_MINUS)
  li a0, 45
  call answerToken
  j .L7
.L5:
  ; sci/calc.e16.ts:922  answerToken(c)
  mv a0, s3
  call answerToken
.L7:
  addi s1, s1, 1
.L3:
  bltu s1, s2, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/calc.e16.ts:927 answerDigits(v) at -O1
;   v in s1
answerDigits:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/calc.e16.ts:928  if (v >= 10) answerToken(0x30 + div(v, 10))
  li t0, 10
  bltu s1, t0, .L1
  ; sci/calc.e16.ts:928  answerToken(0x30 + div(v, 10))
  li t1, 52429
  mulhu t0, s1, t1
  srli t0, t0, 3
  addi a0, t0, 48
  call answerToken
.L1:
  ; sci/calc.e16.ts:929  answerToken(0x30 + (v % 10))
  li t1, 52429
  mulhu t0, s1, t1
  srli t0, t0, 3
  li t1, 10
  mul t0, t0, t1
  sub t0, s1, t0
  addi a0, t0, 48
  call answerToken
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:932 isMinusOne(n) at -O1
;   n in a0
isMinusOne:
  ; sci/calc.e16.ts:933  return (
  lbu t0, 0(a0)
  sub t0, t0, zero
  snez t0, t0
  mv t1, t0
  beqz t1, .L4
  lbu t0, 1(a0)
  sub t0, t0, zero
  seqz t0, t0
.L4:
  mv t1, t0
  beqz t1, .L3
  lbu t0, 2(a0)
  li t1, 16
  sub t0, t0, t1
  seqz t0, t0
.L3:
  mv t1, t0
  beqz t1, .L2
  lw t0, 4(a0)
  sub t0, t0, zero
  seqz t0, t0
.L2:
  mv t1, t0
  beqz t1, .L1
  lw t0, 6(a0)
  sub t0, t0, zero
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; sci/calc.e16.ts:943 charsTo(n) at -O1
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
  ; sci/calc.e16.ts:944  let c: u16 = 0
  li s2, 0 ; c
  ; sci/calc.e16.ts:945  for (let i: u16 = 0; i < n; i++) c += tokenWidth(line[i])
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/calc.e16.ts:945  c += tokenWidth(line[i])
  lbu a0, line(s1)
  call tokenWidth
  add s2, s2, a0
  addi s1, s1, 1
.L3:
  bltu s1, s3, .L1
  ; sci/calc.e16.ts:946  return c
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:953 drawLine() at -O1
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
  ; sci/calc.e16.ts:954  const at = charsTo(cursor)
  lw a0, 0x0536(zero)
  call charsTo
  mv s1, a0 ; at
  ; sci/calc.e16.ts:955  if (at < scrollFrom) scrollFrom = at - (at % COLS)
  lw t0, 0x0544(zero)
  bgeu s1, t0, .L1
  ; sci/calc.e16.ts:955  scrollFrom = at - (at % COLS)
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
  sw t0, 0x0544(zero)
.L1:
  ; sci/calc.e16.ts:956  if (at >= scrollFrom + LINE_CHARS) scrollFrom = at - (at % COLS) - (LINE_ROWS - 1) * COLS
  lw t0, 0x0544(zero)
  addi t0, t0, 84
  bltu s1, t0, .L2
  ; sci/calc.e16.ts:956  scrollFrom = at - (at % COLS) - (LINE_ROWS - 1) * COLS
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
  sw t0, 0x0544(zero)
.L2:
  ; sci/calc.e16.ts:957  let c: u16 = 0
  li s0, 0 ; c
  ; sci/calc.e16.ts:958  for (let i: u16 = 0; i < length; i++) {
  li s2, 0 ; i/shown
  j .L5
.L3:
  ; sci/calc.e16.ts:959  const t = line[i]
  lbu t0, line(s2)
  sw t0, 0(sp) ; t
  ; sci/calc.e16.ts:960  const text = tokenText(t)
  lw a0, 0(sp)
  call tokenText
  mv s3, a0 ; text/p
  ; sci/calc.e16.ts:961  if (text === 0) {
  bne s3, zero, .L7
  ; sci/calc.e16.ts:962  showChar(t, c)
  lw a0, 0(sp)
  mv a1, s0
  call showChar
  ; sci/calc.e16.ts:963  c++
  addi s0, s0, 1
  j .L8
.L7:
  ; sci/calc.e16.ts:965  let p = text
  ; sci/calc.e16.ts:966  while (peek(p) !== 0) {
  j .L11
.L9:
  ; sci/calc.e16.ts:967  showChar(peek(p), c)
  lbu a0, 0(s3)
  mv a1, s0
  call showChar
  ; sci/calc.e16.ts:968  c++
  addi s0, s0, 1
  ; sci/calc.e16.ts:969  p++
  addi s3, s3, 1
.L11:
  lbu t0, 0(s3)
  bne t0, zero, .L9
.L8:
  addi s2, s2, 1
.L5:
  lw t0, 0x0534(zero)
  bltu s2, t0, .L3
  ; sci/calc.e16.ts:973  if (answered) {
  lw t0, 0x0538(zero)
  beqz t0, .L13
  ; sci/calc.e16.ts:974  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:975  return
  j .return
.L13:
  ; sci/calc.e16.ts:977  const shown = at - scrollFrom
  lw t0, 0x0544(zero)
  sub s2, s1, t0
  ; sci/calc.e16.ts:978  barAt(shown % COLS, div(shown, COLS))
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

; sci/calc.e16.ts:982 showChar(ch, c/shown) at -O1
;   ch in s2
;   c/shown in s1
showChar:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; ch
  mv s1, a1 ; c/shown
  ; sci/calc.e16.ts:983  if (c < scrollFrom || c >= scrollFrom + LINE_CHARS) return
  lw t0, 0x0544(zero)
  bltu s1, t0, .L2
  lw t0, 0x0544(zero)
  addi t0, t0, 84
  bltu s1, t0, .L1
.L2:
  ; sci/calc.e16.ts:983  return
  j .return
.L1:
  ; sci/calc.e16.ts:984  const shown = c - scrollFrom
  lw t0, 0x0544(zero)
  sub s1, s1, t0
  ; sci/calc.e16.ts:985  drawChar(ch, shown % COLS, div(shown, COLS))
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

; sci/calc.e16.ts:992 drawAnswer() at -O1
;   n/exponent in s2
;   mantissa in s3
;   i/right/digits/x in s1
drawAnswer:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; sci/calc.e16.ts:993  clearBand(5)
  li a0, 5
  call clearBand
  ; sci/calc.e16.ts:994  clearBand(6)
  li a0, 6
  call clearBand
  ; sci/calc.e16.ts:995  clearBand(7)
  li a0, 7
  call clearBand
  ; sci/calc.e16.ts:996  poke16(MATH_ARG, 10)
  li t0, 10
  li t1, 65366
  sw t0, 0(t1)
  ; sci/calc.e16.ts:997  math(M_FORMAT, KEEP_ANS, addr(answerText), 0)
  li a0, 57
  li a1, 3080
  la a2, answerText
  li a3, 0
  call math
  ; sci/calc.e16.ts:998  const n = peek16(MATH_ARG)
  li t0, 65366
  lw s2, 0(t0)
  ; sci/calc.e16.ts:999  poke(addr(answerText) + n, 0)
  sb zero, answerText(s2)
  ; sci/calc.e16.ts:1000  let mantissa = n
  mv s3, s2 ; mantissa
  ; sci/calc.e16.ts:1001  for (let i: u16 = 0; i < n; i++) {
  li s1, 0 ; i/right/digits/x
  j .L3
.L1:
  ; sci/calc.e16.ts:1002  if (answerText[i] === 0x45) mantissa = i
  lbu t0, answerText(s1)
  li t1, 69
  bne t0, t1, .L5
  ; sci/calc.e16.ts:1002  mantissa = i
  mv s3, s1 ; mantissa
.L5:
  addi s1, s1, 1
.L3:
  bltu s1, s2, .L1
  ; sci/calc.e16.ts:1004  let right: u16 = 127
  li s1, 127 ; i/right/digits/x
  ; sci/calc.e16.ts:1005  if (mantissa < n) {
  bgeu s3, s2, .L6
  ; sci/calc.e16.ts:1007  const exponent = addr(answerText) + mantissa + 1
  addi s2, s3, answerText+1
  ; sci/calc.e16.ts:1008  let digits: u16 = 0
  li s1, 0 ; i/right/digits/x
  ; sci/calc.e16.ts:1009  while (peek(exponent + digits) !== 0) digits++
  j .L9
.L7:
  ; sci/calc.e16.ts:1009  digits++
  addi s1, s1, 1
.L9:
  add t0, s2, s1
  lbu t0, 0(t0)
  bne t0, zero, .L7
  ; sci/calc.e16.ts:1010  const x = 128 - digits * 6
  slli t1, s1, 2
  slli t0, s1, 1
  add t0, t0, t1
  li t1, 128
  sub s1, t1, t0
  ; sci/calc.e16.ts:1011  textAt(exponent, x, 48)
  mv a0, s2
  mv a1, s1
  li a2, 48
  call textAt
  ; sci/calc.e16.ts:1012  textAt(str('\x8110'), x - 18, 55)
  la a0, str_22
  addi a1, s1, -18
  li a2, 55
  call textAt
  ; sci/calc.e16.ts:1013  right = x - 19
  addi s1, s1, -19
.L6:
  ; sci/calc.e16.ts:1015  bigNumber(addr(answerText), mantissa, right)
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
  .byte 40, 0
str_17:
  .byte 41, 47, 40, 0
str_18:
  .byte 41, 0
str_19:
  .byte 47, 0
str_20:
  .byte 69, 76, 69, 67, 45, 49, 54, 32, 83, 67, 73, 0
str_21:
  .byte 83, 67, 73, 45, 49, 50, 56, 0
str_22:
  .byte 129, 49, 48, 0
  .align 2
e16c_fixed_end:

  .bank 0
  .org 0xc000
; sci/eval.e16.ts:117 tok() at -O1
tok:
  ; sci/eval.e16.ts:118  return pos < lineLength ? peek(lineAt + pos) : 0
  lw t0, 0x0596(zero)
  lw t1, 0x0594(zero)
  bgeu t0, t1, .L1
  lw t0, 0x0592(zero)
  lw t1, 0x0596(zero)
  add t0, t0, t1
  lbu t0, 0(t0)
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
.return:
  ret

; sci/eval.e16.ts:125 evaluate(at, length) at -O1
;   at in s2
;   length in s1
evaluate:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; at
  mv s1, a1 ; length
  ; sci/eval.e16.ts:126  lineAt = at
  sw s2, 0x0592(zero)
  ; sci/eval.e16.ts:127  lineLength = length
  sw s1, 0x0594(zero)
  ; sci/eval.e16.ts:128  pos = 0
  sw zero, 0x0596(zero)
  ; sci/eval.e16.ts:129  poke16(MATH_ANGLE, peek(KEEP_ANGLE))
  lbu t0, 3074(zero)
  li t1, 65372
  sw t0, 0(t1)
  ; sci/eval.e16.ts:130  if (length === 0) fail(E_SYNTAX, 0)
  bne s1, zero, .L1
  ; sci/eval.e16.ts:130  fail(E_SYNTAX, 0)
  li a0, 2
  li a1, 0
  call fail
.L1:
  ; sci/eval.e16.ts:131  sum()
  call sum
  ; sci/eval.e16.ts:132  if (pos < lineLength) fail(E_SYNTAX, pos)
  lw t0, 0x0596(zero)
  lw t1, 0x0594(zero)
  bgeu t0, t1, .L2
  ; sci/eval.e16.ts:132  fail(E_SYNTAX, pos)
  lw a1, 0x0596(zero)
  li a0, 2
  call fail
.L2:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:135 sum() at -O1
;   t in s1
;   at in s2
sum:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:136  prod()
  call prod
  ; sci/eval.e16.ts:137  for (;;) {
.L1:
  ; sci/eval.e16.ts:138  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:139  if (t !== T_PLUS && t !== T_MINUS) return
  li t0, 43
  beq s1, t0, .L5
  li t0, 45
  beq s1, t0, .L5
  ; sci/eval.e16.ts:139  return
  j .return
.L5:
  ; sci/eval.e16.ts:140  const at = pos
  lw s2, 0x0596(zero)
  ; sci/eval.e16.ts:141  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
  ; sci/eval.e16.ts:142  prod()
  call prod
  ; sci/eval.e16.ts:143  binary(t === T_PLUS ? M_ADD : M_SUB, at)
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

; sci/eval.e16.ts:147 prod() at -O1
;   t in s1
;   at in s2
prod:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:148  implied()
  call implied
  ; sci/eval.e16.ts:149  for (;;) {
.L1:
  ; sci/eval.e16.ts:150  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:151  if (t !== T_TIMES && t !== T_DIVIDE) return
  li t0, 129
  beq s1, t0, .L5
  li t0, 130
  beq s1, t0, .L5
  ; sci/eval.e16.ts:151  return
  j .return
.L5:
  ; sci/eval.e16.ts:152  const at = pos
  lw s2, 0x0596(zero)
  ; sci/eval.e16.ts:153  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
  ; sci/eval.e16.ts:154  implied()
  call implied
  ; sci/eval.e16.ts:155  binary(t === T_TIMES ? M_MUL : M_DIV, at)
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

; sci/eval.e16.ts:160 startsValue(t) at -O1
;   t in s1
startsValue:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/eval.e16.ts:161  return (
  mv a0, s1
  call isDigit
  mv t1, a0
  mv t0, a0
  bnez t1, .L11
  li t0, 46
  sub t0, s1, t0
  seqz t0, t0
.L11:
  mv t1, t0
  bnez t1, .L10
  li t0, 135
  sub t0, s1, t0
  seqz t0, t0
.L10:
  mv t1, t0
  bnez t1, .L9
  li t0, 40
  sub t0, s1, t0
  seqz t0, t0
.L9:
  mv t1, t0
  bnez t1, .L8
  li t0, 128
  sub t0, s1, t0
  seqz t0, t0
.L8:
  mv t1, t0
  bnez t1, .L7
  li t0, 101
  sub t0, s1, t0
  seqz t0, t0
.L7:
  mv t1, t0
  bnez t1, .L6
  li t0, 20
  sub t0, s1, t0
  seqz t0, t0
.L6:
  mv t1, t0
  bnez t1, .L5
  li t0, 21
  sub t0, s1, t0
  seqz t0, t0
.L5:
  mv t1, t0
  bnez t1, .L4
  li t0, 22
  sub t0, s1, t0
  seqz t0, t0
.L4:
  mv t1, t0
  bnez t1, .L3
  li t0, 25
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

; sci/eval.e16.ts:177 implied() at -O1
;   at in s1
implied:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/eval.e16.ts:178  comb()
  call comb
  ; sci/eval.e16.ts:179  while (startsValue(tok())) {
  j .L3
.L1:
  ; sci/eval.e16.ts:180  const at = pos
  lw s1, 0x0596(zero)
  ; sci/eval.e16.ts:181  comb()
  call comb
  ; sci/eval.e16.ts:182  binary(M_MUL, at)
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

; sci/eval.e16.ts:186 comb() at -O1
;   t in s1
;   at in s2
comb:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:187  slash()
  call slash
  ; sci/eval.e16.ts:188  for (;;) {
.L1:
  ; sci/eval.e16.ts:189  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:190  if (t !== T_NCR && t !== T_NPR) return
  li t0, 18
  beq s1, t0, .L5
  li t0, 19
  beq s1, t0, .L5
  ; sci/eval.e16.ts:190  return
  j .return
.L5:
  ; sci/eval.e16.ts:191  const at = pos
  lw s2, 0x0596(zero)
  ; sci/eval.e16.ts:192  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
  ; sci/eval.e16.ts:193  slash()
  call slash
  ; sci/eval.e16.ts:194  choose(t === T_NCR, at)
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

; sci/eval.e16.ts:199 slash() at -O1
;   at in s1
slash:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/eval.e16.ts:200  unary()
  call unary
  ; sci/eval.e16.ts:201  while (tok() === T_SLASH) {
  j .L3
.L1:
  ; sci/eval.e16.ts:202  const at = pos
  lw s1, 0x0596(zero)
  ; sci/eval.e16.ts:203  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
  ; sci/eval.e16.ts:204  unary()
  call unary
  ; sci/eval.e16.ts:205  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
.L3:
  call tok
  li t0, 27
  beq a0, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:209 unary() at -O1
;   t/at in s1
unary:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/eval.e16.ts:210  const t = tok()
  call tok
  mv s1, a0 ; t/at
  ; sci/eval.e16.ts:211  if (t === T_NEG || t === T_MINUS) {
  li t0, 16
  beq s1, t0, .L2
  li t0, 45
  bne s1, t0, .L1
.L2:
  ; sci/eval.e16.ts:212  const at = pos
  lw s1, 0x0596(zero)
  ; sci/eval.e16.ts:213  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
  ; sci/eval.e16.ts:214  unary()
  call unary
  ; sci/eval.e16.ts:215  math(M_NEG, top(), 0, at)
  call top
  mv a1, a0
  li a0, 16
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:216  exactNeg(top())
  call top
  la t0, exactNeg
  li t1, 2
  call far_call
  ; sci/eval.e16.ts:217  return
  j .return
.L1:
  ; sci/eval.e16.ts:219  if (t === T_PLUS) {
  li t0, 43
  bne s1, t0, .L3
  ; sci/eval.e16.ts:220  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
  ; sci/eval.e16.ts:221  unary()
  call unary
  ; sci/eval.e16.ts:222  return
  j .return
.L3:
  ; sci/eval.e16.ts:224  post()
  call post
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:227 post() at -O1
;   t in s1
;   at in s2
post:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:228  primary()
  call primary
  ; sci/eval.e16.ts:229  for (;;) {
.L1:
  ; sci/eval.e16.ts:230  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:231  const at = pos
  lw s2, 0x0596(zero)
  ; sci/eval.e16.ts:232  if (t === T_POW || t === T_POWT) {
  li t0, 17
  beq s1, t0, .L6
  li t0, 26
  bne s1, t0, .L5
.L6:
  ; sci/eval.e16.ts:233  powers()
  call powers
  j .L1
.L5:
  ; sci/eval.e16.ts:234  if (t === T_SQUARE) {
  li t0, 132
  bne s1, t0, .L8
  ; sci/eval.e16.ts:235  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
  ; sci/eval.e16.ts:236  raise(2, at)
  li a0, 2
  mv a1, s2
  call raise
  j .L1
.L8:
  ; sci/eval.e16.ts:237  if (t === T_CUBE) {
  li t0, 133
  bne s1, t0, .L10
  ; sci/eval.e16.ts:238  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
  ; sci/eval.e16.ts:239  raise(3, at)
  li a0, 3
  mv a1, s2
  call raise
  j .L1
.L10:
  ; sci/eval.e16.ts:240  if (t === T_INVERSE) {
  li t0, 134
  bne s1, t0, .L12
  ; sci/eval.e16.ts:241  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
  ; sci/eval.e16.ts:242  inverse(at)
  mv a0, s2
  call inverse
  j .L1
.L12:
  ; sci/eval.e16.ts:243  if (t === T_BANG) {
  li t0, 33
  bne s1, t0, .L14
  ; sci/eval.e16.ts:244  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
  ; sci/eval.e16.ts:245  factorial(at)
  mv a0, s2
  call factorial
  j .L1
.L14:
  ; sci/eval.e16.ts:246  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:251 powers() at -O1
;   at in s1
;   template in s2
powers:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:252  const at = pos
  lw s1, 0x0596(zero)
  ; sci/eval.e16.ts:253  const template = tok() === T_POWT
  call tok
  li t0, 26
  sub t0, a0, t0
  seqz s2, t0
  ; sci/eval.e16.ts:254  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
  ; sci/eval.e16.ts:255  sum()
  call sum
  ; sci/eval.e16.ts:256  if (template) expect(T_END)
  beqz s2, .L1
  ; sci/eval.e16.ts:256  expect(T_END)
  li a0, 24
  call expect
  j .L2
.L1:
  ; sci/eval.e16.ts:257  if (tok() === T_CLOSE) pos++
  call tok
  li t0, 41
  bne a0, t0, .L3
  ; sci/eval.e16.ts:257  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
.L3:
.L2:
  ; sci/eval.e16.ts:259  if (tok() === T_POW || tok() === T_POWT) powers()
  call tok
  li t0, 17
  beq a0, t0, .L5
  call tok
  li t0, 26
  bne a0, t0, .L4
.L5:
  ; sci/eval.e16.ts:259  powers()
  call powers
.L4:
  ; sci/eval.e16.ts:260  binary(M_POW, at)
  li a0, 5
  mv a1, s1
  call binary
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:264 expect(t) at -O1
;   t in s1
expect:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/eval.e16.ts:265  if (tok() !== t) fail(E_SYNTAX, pos)
  call tok
  beq a0, s1, .L1
  ; sci/eval.e16.ts:265  fail(E_SYNTAX, pos)
  lw a1, 0x0596(zero)
  li a0, 2
  call fail
.L1:
  ; sci/eval.e16.ts:266  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:269 raise(n, at) at -O1
;   n in s2
;   at in s1
raise:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; n
  mv s1, a1 ; at
  ; sci/eval.e16.ts:270  pushInt(n, at)
  mv a0, s2
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:271  binary(M_POW, at)
  li a0, 5
  mv a1, s1
  call binary
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:275 inverse(at) at -O1
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
  ; sci/eval.e16.ts:276  const x = top()
  call top
  mv s2, a0 ; x
  ; sci/eval.e16.ts:277  const one = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  mv s3, a0 ; one
  ; sci/eval.e16.ts:278  copyValue(x, push(at))
  mv a0, s1
  call push
  mv a1, a0
  mv a0, s2
  call copyValue
  ; sci/eval.e16.ts:279  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:280  copyValue(one, x)
  mv a0, s3
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:281  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/eval.e16.ts:285 factorial(at) at -O1
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
  ; sci/eval.e16.ts:286  const x = top()
  call top
  mv s3, a0 ; x
  ; sci/eval.e16.ts:287  const n = smallWhole(x, at)
  mv a0, s3
  mv a1, s1
  call smallWhole
  mv s0, a0 ; n
  ; sci/eval.e16.ts:288  if (n > 69) fail(E_MATH, at)
  li t0, 69
  bgeu t0, s0, .L1
  ; sci/eval.e16.ts:288  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L1:
  ; sci/eval.e16.ts:289  const f = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  sw a0, 0(sp) ; f
  ; sci/eval.e16.ts:290  for (let k: u16 = 2; k <= n; k++) {
  li s2, 2 ; k
  j .L4
.L2:
  ; sci/eval.e16.ts:291  pushInt(k, at)
  mv a0, s2
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:292  binary(M_MUL, at)
  li a0, 3
  mv a1, s1
  call binary
  addi s2, s2, 1
.L4:
  bgeu s0, s2, .L2
  ; sci/eval.e16.ts:294  copyValue(f, x)
  lw a0, 0(sp)
  mv a1, s3
  call copyValue
  ; sci/eval.e16.ts:295  pop()
  call pop
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  lw s2, 10(sp)
  addi sp, sp, 12
  ret

; sci/eval.e16.ts:299 choose(c, at) at -O1
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
  ; sci/eval.e16.ts:300  const r = top()
  call top
  mv s2, a0 ; r/rv
  ; sci/eval.e16.ts:301  const n = r - VALUE_SIZE
  addi s0, s2, -36
  ; sci/eval.e16.ts:302  const nv = smallWhole(n, at)
  mv a0, s0
  mv a1, s1
  call smallWhole
  sw a0, 0(sp) ; nv
  ; sci/eval.e16.ts:303  const rv = smallWhole(r, at)
  mv a0, s2
  mv a1, s1
  call smallWhole
  mv s2, a0 ; r/rv
  ; sci/eval.e16.ts:304  if (rv > nv) fail(E_MATH, at)
  lw t0, 0(sp) ; nv
  bgeu t0, s2, .L1
  ; sci/eval.e16.ts:304  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L1:
  ; sci/eval.e16.ts:305  const out = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  sw a0, 4(sp) ; out
  ; sci/eval.e16.ts:306  for (let k: u16 = 0; k < rv; k++) {
  li s3, 0 ; k
  j .L4
.L2:
  ; sci/eval.e16.ts:307  pushInt(nv - k, at)
  lw t0, 0(sp) ; nv
  sub a0, t0, s3
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:308  binary(M_MUL, at)
  li a0, 3
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:309  if (c) {
  lw t0, 2(sp) ; c
  beqz t0, .L6
  ; sci/eval.e16.ts:310  pushInt(k + 1, at)
  addi a0, s3, 1
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:311  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
.L6:
  addi s3, s3, 1
.L4:
  bltu s3, s2, .L2
  ; sci/eval.e16.ts:314  copyValue(out, n)
  lw a0, 4(sp)
  mv a1, s0
  call copyValue
  ; sci/eval.e16.ts:315  pop()
  call pop
  ; sci/eval.e16.ts:316  pop()
  call pop
.return:
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  lw s3, 14(sp)
  addi sp, sp, 16
  ret

; sci/eval.e16.ts:319 primary() at -O1
;   t in s1
;   at in s2
primary:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:320  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:321  const at = pos
  lw s2, 0x0596(zero)
  ; sci/eval.e16.ts:322  if (isDigit(t) || t === T_POINT || t === T_EXP) {
  mv a0, s1
  call isDigit
  bnez a0, .L2
  li t0, 46
  beq s1, t0, .L2
  li t0, 135
  bne s1, t0, .L1
.L2:
  ; sci/eval.e16.ts:323  number()
  call number
  ; sci/eval.e16.ts:324  return
  j .return
.L1:
  ; sci/eval.e16.ts:326  if (t === 0) fail(E_SYNTAX, at)
  bne s1, zero, .L3
  ; sci/eval.e16.ts:326  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s2
  call fail
.L3:
  ; sci/eval.e16.ts:327  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
  ; sci/eval.e16.ts:328  if (!constant(t, at)) bracketed(t, at)
  mv a0, s1
  mv a1, s2
  call constant
  bnez a0, .L4
  ; sci/eval.e16.ts:328  bracketed(t, at)
  mv a0, s1
  mv a1, s2
  call bracketed
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:332 constant(t/n, at) at -O1
;   t/n in s1
;   at in s2
constant:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t/n
  mv s2, a1 ; at
  ; sci/eval.e16.ts:333  if (t === T_PI) {
  li t0, 128
  bne s1, t0, .L1
  ; sci/eval.e16.ts:334  math(M_PI, push(at), 0, at)
  mv a0, s2
  call push
  mv a1, a0
  li a0, 32
  li a2, 0
  mv a3, s2
  call math
  j .L2
.L1:
  ; sci/eval.e16.ts:335  if (t === T_E) {
  li t0, 101
  bne s1, t0, .L3
  ; sci/eval.e16.ts:336  const n = pushInt(1, at)
  li a0, 1
  mv a1, s2
  call pushInt
  mv s1, a0 ; t/n
  ; sci/eval.e16.ts:337  math(M_EXP, n, 0, at)
  li a0, 30
  mv a1, s1
  li a2, 0
  mv a3, s2
  call math
  ; sci/eval.e16.ts:338  inexact(n)
  mv a0, s1
  call inexact
  j .L4
.L3:
  ; sci/eval.e16.ts:339  if (t === T_TEN) {
  li t0, 21
  bne s1, t0, .L5
  ; sci/eval.e16.ts:340  pushInt(10, at)
  li a0, 10
  mv a1, s2
  call pushInt
  j .L6
.L5:
  ; sci/eval.e16.ts:341  if (t === T_ANS) {
  li t0, 20
  bne s1, t0, .L7
  ; sci/eval.e16.ts:342  copyValue(KEEP_ANS, push(at))
  mv a0, s2
  call push
  mv a1, a0
  li a0, 3080
  call copyValue
  j .L8
.L7:
  ; sci/eval.e16.ts:343  if (isVariable(t)) {
  mv a0, s1
  call isVariable
  beqz a0, .L9
  ; sci/eval.e16.ts:344  copyValue(varAt(t), push(at))
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
  call copyValue
  j .L10
.L9:
  ; sci/eval.e16.ts:345  return false
  li a0, 0
  j .return
.L10:
.L8:
.L6:
.L4:
.L2:
  ; sci/eval.e16.ts:346  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:350 bracketed(t, at) at -O1
;   t in s1
;   at in s2
bracketed:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t
  mv s2, a1 ; at
  ; sci/eval.e16.ts:351  if (t === T_FRAC) {
  li t0, 22
  bne s1, t0, .L1
  ; sci/eval.e16.ts:352  sum()
  call sum
  ; sci/eval.e16.ts:353  expect(T_SEP)
  li a0, 23
  call expect
  ; sci/eval.e16.ts:354  sum()
  call sum
  ; sci/eval.e16.ts:355  expect(T_END)
  li a0, 24
  call expect
  ; sci/eval.e16.ts:356  binary(M_DIV, at)
  li a0, 4
  mv a1, s2
  call binary
  j .L2
.L1:
  ; sci/eval.e16.ts:357  if (t === T_ROOT) {
  li t0, 25
  bne s1, t0, .L3
  ; sci/eval.e16.ts:358  sum()
  call sum
  ; sci/eval.e16.ts:359  expect(T_END)
  li a0, 24
  call expect
  ; sci/eval.e16.ts:360  math(M_SQR, top(), 0, at)
  call top
  mv a1, a0
  li a0, 21
  li a2, 0
  mv a3, s2
  call math
  ; sci/eval.e16.ts:361  exactSqrt(top())
  call top
  la t0, exactSqrt
  li t1, 2
  call far_call
  j .L4
.L3:
  ; sci/eval.e16.ts:362  if (t === T_OPEN) {
  li t0, 40
  bne s1, t0, .L5
  ; sci/eval.e16.ts:363  sum()
  call sum
  ; sci/eval.e16.ts:364  if (tok() === T_CLOSE) pos++
  call tok
  li t0, 41
  bne a0, t0, .L7
  ; sci/eval.e16.ts:364  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
  j .L7
.L5:
  ; sci/eval.e16.ts:365  if (isFunction(t)) {
  mv a0, s1
  call isFunction
  beqz a0, .L8
  ; sci/eval.e16.ts:366  sum()
  call sum
  ; sci/eval.e16.ts:367  if (tok() === T_CLOSE) pos++
  call tok
  li t0, 41
  bne a0, t0, .L9
  ; sci/eval.e16.ts:367  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
.L9:
  ; sci/eval.e16.ts:368  apply(t, at)
  mv a0, s1
  mv a1, s2
  call apply
  j .L10
.L8:
  ; sci/eval.e16.ts:369  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s2
  call fail
.L10:
.L7:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:376 number() at -O1
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
  ; sci/eval.e16.ts:377  const at = pos
  lw s0, 0x0596(zero)
  ; sci/eval.e16.ts:378  let n: u16 = 0
  li s1, 0 ; n
  ; sci/eval.e16.ts:379  let points: u16 = 0
  li s2, 0 ; points/v
  ; sci/eval.e16.ts:380  let digits: u16 = 0
  li s3, 0 ; digits
  ; sci/eval.e16.ts:381  while (isDigit(tok()) || tok() === T_POINT) {
  j .L3
.L1:
  ; sci/eval.e16.ts:382  if (tok() === T_POINT) points++
  call tok
  li t0, 46
  bne a0, t0, .L5
  ; sci/eval.e16.ts:382  points++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/eval.e16.ts:383  digits++
  addi s3, s3, 1
.L6:
  ; sci/eval.e16.ts:384  if (n < 30) {
  li t0, 30
  bgeu s1, t0, .L7
  ; sci/eval.e16.ts:385  poke(addr(numberText) + n, tok())
  call tok
  sb a0, numberText(s1)
  ; sci/eval.e16.ts:386  n++
  addi s1, s1, 1
.L7:
  ; sci/eval.e16.ts:388  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
.L3:
  call tok
  call isDigit
  bnez a0, .L1
  call tok
  li t0, 46
  beq a0, t0, .L1
  ; sci/eval.e16.ts:390  if (points > 1 || (points === 1 && digits === 0)) fail(E_SYNTAX, at)
  li t0, 1
  bltu t0, s2, .L9
  li t0, 1
  bne s2, t0, .L8
  bne s3, zero, .L8
.L9:
  ; sci/eval.e16.ts:390  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s0
  call fail
.L8:
  ; sci/eval.e16.ts:391  if (tok() === T_EXP) n = exponentPart(digits === 0 ? 0 : n)
  call tok
  li t0, 135
  bne a0, t0, .L10
  ; sci/eval.e16.ts:391  n = exponentPart(digits === 0 ? 0 : n)
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
  ; sci/eval.e16.ts:392  poke(addr(numberText) + n, 0)
  sb zero, numberText(s1)
  ; sci/eval.e16.ts:393  const v = push(at)
  mv a0, s0
  call push
  mv s2, a0 ; points/v
  ; sci/eval.e16.ts:394  poke16(MATH_ARG, n)
  li t0, 65366
  sw s1, 0(t0)
  ; sci/eval.e16.ts:395  math(M_PARSE, v, addr(numberText), at)
  li a0, 56
  mv a1, s2
  la a2, numberText
  mv a3, s0
  call math
  ; sci/eval.e16.ts:396  exactLiteral(v)
  mv a0, s2
  la t0, exactLiteral
  li t1, 2
  call far_call
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/eval.e16.ts:403 exponentPart(n/k) at -O1
;   n/k in s1
exponentPart:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n/k
  ; sci/eval.e16.ts:404  let k = n
  ; sci/eval.e16.ts:405  if (k === 0) {
  bne s1, zero, .L1
  ; sci/eval.e16.ts:406  poke(addr(numberText), 0x31)
  li t0, 49
  sb t0, numberText(zero)
  ; sci/eval.e16.ts:407  k = 1
  li s1, 1 ; n/k
.L1:
  ; sci/eval.e16.ts:409  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
  ; sci/eval.e16.ts:410  poke(addr(numberText) + k, 0x45)
  li t0, 69
  sb t0, numberText(s1)
  ; sci/eval.e16.ts:411  k++
  addi s1, s1, 1
  ; sci/eval.e16.ts:412  if (tok() === T_NEG || tok() === T_MINUS) {
  call tok
  li t0, 16
  beq a0, t0, .L3
  call tok
  li t0, 45
  bne a0, t0, .L2
.L3:
  ; sci/eval.e16.ts:413  poke(addr(numberText) + k, 0x2d)
  li t0, 45
  sb t0, numberText(s1)
  ; sci/eval.e16.ts:414  k++
  addi s1, s1, 1
  ; sci/eval.e16.ts:415  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
.L2:
  ; sci/eval.e16.ts:417  if (!isDigit(tok())) fail(E_SYNTAX, pos)
  call tok
  call isDigit
  bnez a0, .L7
  ; sci/eval.e16.ts:417  fail(E_SYNTAX, pos)
  lw a1, 0x0596(zero)
  li a0, 2
  call fail
  ; sci/eval.e16.ts:418  while (isDigit(tok())) {
  j .L7
.L5:
  ; sci/eval.e16.ts:419  if (k < 31) {
  li t0, 31
  bgeu s1, t0, .L9
  ; sci/eval.e16.ts:420  poke(addr(numberText) + k, tok())
  call tok
  sb a0, numberText(s1)
  ; sci/eval.e16.ts:421  k++
  addi s1, s1, 1
.L9:
  ; sci/eval.e16.ts:423  pos++
  lw t0, 0x0596(zero)
  addi t0, t0, 1
  sw t0, 0x0596(zero)
.L7:
  call tok
  call isDigit
  bnez a0, .L5
  ; sci/eval.e16.ts:425  return k
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:432 apply(f, at) at -O1
;   f in s2
;   at in s3
;   x in s1
apply:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; f
  mv s3, a1 ; at
  ; sci/eval.e16.ts:433  const x = top()
  call top
  mv s1, a0 ; x
  ; sci/eval.e16.ts:434  copyValue(x, addr(argument))
  mv a0, s1
  la a1, argument
  call copyValue
  ; sci/eval.e16.ts:435  if (f === T_SIN) trig(M_SIN, TRIG_SIN, x, at)
  li t0, 1
  bne s2, t0, .L1
  ; sci/eval.e16.ts:435  trig(M_SIN, TRIG_SIN, x, at)
  li a0, 22
  li a1, 0
  mv a2, s1
  mv a3, s3
  call trig
  j .L2
.L1:
  ; sci/eval.e16.ts:436  if (f === T_COS) trig(M_COS, TRIG_COS, x, at)
  li t0, 2
  bne s2, t0, .L3
  ; sci/eval.e16.ts:436  trig(M_COS, TRIG_COS, x, at)
  li a0, 23
  li a1, 1
  mv a2, s1
  mv a3, s3
  call trig
  j .L4
.L3:
  ; sci/eval.e16.ts:437  if (f === T_TAN) trig(M_TAN, TRIG_TAN, x, at)
  li t0, 3
  bne s2, t0, .L5
  ; sci/eval.e16.ts:437  trig(M_TAN, TRIG_TAN, x, at)
  li a0, 24
  li a1, 2
  mv a2, s1
  mv a3, s3
  call trig
  j .L6
.L5:
  ; sci/eval.e16.ts:438  if (f === T_SQRT) {
  li t0, 9
  bne s2, t0, .L7
  ; sci/eval.e16.ts:439  math(M_SQR, x, 0, at)
  li a0, 21
  mv a1, s1
  li a2, 0
  mv a3, s3
  call math
  ; sci/eval.e16.ts:440  exactSqrt(x)
  mv a0, s1
  la t0, exactSqrt
  li t1, 2
  call far_call
  j .L8
.L7:
  ; sci/eval.e16.ts:442  other(f, x, at)
  mv a0, s2
  mv a1, s1
  mv a2, s3
  call other
  ; sci/eval.e16.ts:443  exactWhole(x)
  mv a0, s1
  la t0, exactWhole
  li t1, 2
  call far_call
.L8:
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/eval.e16.ts:448 other(f, x, at) at -O1
;   f in s1
;   x in s2
;   at in s3
other:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; f
  mv s2, a1 ; x
  mv s3, a2 ; at
  ; sci/eval.e16.ts:449  if (f === T_ASIN) math(M_ASN, x, 0, at)
  li t0, 4
  bne s1, t0, .L1
  ; sci/eval.e16.ts:449  math(M_ASN, x, 0, at)
  li a0, 25
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L2
.L1:
  ; sci/eval.e16.ts:450  if (f === T_ACOS) math(M_ACS, x, 0, at)
  li t0, 5
  bne s1, t0, .L3
  ; sci/eval.e16.ts:450  math(M_ACS, x, 0, at)
  li a0, 26
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L4
.L3:
  ; sci/eval.e16.ts:451  if (f === T_ATAN) math(M_ATN, x, 0, at)
  li t0, 6
  bne s1, t0, .L5
  ; sci/eval.e16.ts:451  math(M_ATN, x, 0, at)
  li a0, 27
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L6
.L5:
  ; sci/eval.e16.ts:452  if (f === T_LOG) math(M_LOG, x, 0, at)
  li t0, 7
  bne s1, t0, .L7
  ; sci/eval.e16.ts:452  math(M_LOG, x, 0, at)
  li a0, 29
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L8
.L7:
  ; sci/eval.e16.ts:453  if (f === T_LN) math(M_LN, x, 0, at)
  li t0, 8
  bne s1, t0, .L9
  ; sci/eval.e16.ts:453  math(M_LN, x, 0, at)
  li a0, 28
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L10
.L9:
  ; sci/eval.e16.ts:454  if (f === T_CBRT) cubeRoot(x, at)
  li t0, 10
  bne s1, t0, .L11
  ; sci/eval.e16.ts:454  cubeRoot(x, at)
  mv a0, s2
  mv a1, s3
  call cubeRoot
.L11:
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

; sci/eval.e16.ts:457 trig(op, which, x, at) at -O1
;   op in s2
;   which in s3
;   x in s1
;   at in s0
trig:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  sw s0, 8(sp)
  mv s2, a0 ; op
  mv s3, a1 ; which
  mv s1, a2 ; x
  mv s0, a3 ; at
  ; sci/eval.e16.ts:458  math(op, x, 0, at)
  mv a0, s2
  mv a1, s1
  li a2, 0
  mv a3, s0
  call math
  ; sci/eval.e16.ts:459  exactTrig(which, x, addr(argument))
  mv a0, s3
  mv a1, s1
  la a2, argument
  la t0, exactTrig
  li t1, 2
  call far_call
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/eval.e16.ts:463 cubeRoot(x, at) at -O1
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
  ; sci/eval.e16.ts:464  if (isZero(x)) return
  mv a0, s2
  call isZero
  beqz a0, .L1
  ; sci/eval.e16.ts:464  return
  j .return
.L1:
  ; sci/eval.e16.ts:465  const negative = isNegative(x)
  mv a0, s2
  call isNegative
  mv s3, a0 ; negative
  ; sci/eval.e16.ts:466  if (negative) math(M_NEG, x, 0, at)
  beqz s3, .L2
  ; sci/eval.e16.ts:466  math(M_NEG, x, 0, at)
  li a0, 16
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
.L2:
  ; sci/eval.e16.ts:467  const third = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  mv s0, a0 ; third
  ; sci/eval.e16.ts:468  pushInt(3, at)
  li a0, 3
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:469  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:470  math(M_POW, x, third, at)
  li a0, 5
  mv a1, s2
  mv a2, s0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:471  pop()
  call pop
  ; sci/eval.e16.ts:472  if (negative) math(M_NEG, x, 0, at)
  beqz s3, .L3
  ; sci/eval.e16.ts:472  math(M_NEG, x, 0, at)
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
; sci/screens.e16.ts:21 errorScreen(code) at -O1
;   code in s1
errorScreen:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; code
  ; sci/screens.e16.ts:22  if (code === E_MATH) {
  li t0, 1
  bne s1, t0, .L1
  ; sci/screens.e16.ts:23  band(str('ERR:MATH'))
  la a0, str_23
  call band
  ; sci/screens.e16.ts:24  textAt(str("OUT OF A FUNCTION'S"), 1, lineY(0))
  la a0, str_24
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:25  textAt(str('RANGE, OR /0'), 1, lineY(1))
  la a0, str_25
  li a1, 1
  li a2, 20
  call textAt
  j .L2
.L1:
  ; sci/screens.e16.ts:26  if (code === E_STACK) {
  li t0, 3
  bne s1, t0, .L3
  ; sci/screens.e16.ts:27  band(str('ERR:STACK'))
  la a0, str_26
  call band
  ; sci/screens.e16.ts:28  textAt(str('TOO MANY BRACKETS OR'), 1, lineY(0))
  la a0, str_27
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:29  textAt(str('FUNCTIONS IN A LINE'), 1, lineY(1))
  la a0, str_28
  li a1, 1
  li a2, 20
  call textAt
  j .L4
.L3:
  ; sci/screens.e16.ts:31  band(str('ERR:SYNTAX'))
  la a0, str_29
  call band
  ; sci/screens.e16.ts:32  textAt(str('CANNOT READ THE LINE'), 1, lineY(0))
  la a0, str_30
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:33  textAt(str('AT THE CURSOR'), 1, lineY(1))
  la a0, str_31
  li a1, 1
  li a2, 20
  call textAt
.L4:
.L2:
  ; sci/screens.e16.ts:35  textAt(str('\x8c\x8b:BACK TO THE LINE'), 1, lineY(4))
  la a0, str_32
  li a1, 1
  li a2, 47
  call textAt
  ; sci/screens.e16.ts:36  textAt(str('AC:CLEAR'), 1, lineY(5))
  la a0, str_33
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:42 menuScreen() at -O1
menuScreen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/screens.e16.ts:43  band(str('MENU'))
  la a0, str_34
  call band
  ; sci/screens.e16.ts:44  textAt(str('1:CALC    2:STATS'), 1, lineY(0))
  la a0, str_35
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:45  textAt(str('3:BASE    4:TABLE'), 1, lineY(1))
  la a0, str_36
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:46  textAt(str('5:EQUATION'), 1, lineY(2))
  la a0, str_37
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:47  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_38
  li a1, 1
  li a2, 56
  call textAt
  ; sci/screens.e16.ts:48  mark(0, 6, 0)
  li a0, 0
  li a1, 6
  li a2, 0
  call mark
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/screens.e16.ts:52 menuKey(k) at -O1
;   k in s1
menuKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/screens.e16.ts:53  if (k === K_1 || k === K_AC) return 1
  li t0, 56
  beq s1, t0, .L2
  li t0, 5
  bne s1, t0, .L1
.L2:
  ; sci/screens.e16.ts:53  return 1
  li a0, 1
  j .return
.L1:
  ; sci/screens.e16.ts:54  if (k === K_2 || k === K_3 || k === K_4 || k === K_5) refuse()
  li t0, 57
  beq s1, t0, .L4
  li t0, 58
  beq s1, t0, .L4
  li t0, 48
  beq s1, t0, .L4
  li t0, 49
  bne s1, t0, .L3
.L4:
  ; sci/screens.e16.ts:54  refuse()
  call refuse
.L3:
  ; sci/screens.e16.ts:55  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:64 setupScreen() at -O1
;   angle in s1
setupScreen:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/screens.e16.ts:65  band(str('SETUP'))
  la a0, str_39
  call band
  ; sci/screens.e16.ts:66  textRight(str('1/2'), 1)
  la a0, str_40
  li a1, 1
  call textRight
  ; sci/screens.e16.ts:67  textAt(str('1:2D  2:LINE'), 1, lineY(0))
  la a0, str_41
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:68  textAt(str('3:DEG 4:RAD 5:GRAD'), 1, lineY(1))
  la a0, str_42
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:69  textAt(str('6:EXACT 7:DECIMAL'), 1, lineY(2))
  la a0, str_43
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:70  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_38
  li a1, 1
  li a2, 56
  call textAt
  ; sci/screens.e16.ts:71  if (peek(KEEP_DISPLAY) === 1) mark(6, 6, 0)
  lbu t0, 3075(zero)
  li t1, 1
  bne t0, t1, .L1
  ; sci/screens.e16.ts:71  mark(6, 6, 0)
  li a0, 6
  li a1, 6
  li a2, 0
  call mark
  j .L2
.L1:
  ; sci/screens.e16.ts:72  mark(0, 4, 0)
  li a0, 0
  li a1, 4
  li a2, 0
  call mark
.L2:
  ; sci/screens.e16.ts:73  const angle = peek(KEEP_ANGLE)
  lbu s1, 3074(zero)
  ; sci/screens.e16.ts:74  if (angle === 1) mark(6, 5, 1)
  li t0, 1
  bne s1, t0, .L3
  ; sci/screens.e16.ts:74  mark(6, 5, 1)
  li a0, 6
  li a1, 5
  li a2, 1
  call mark
  j .L4
.L3:
  ; sci/screens.e16.ts:75  if (angle === 2) mark(12, 6, 1)
  li t0, 2
  bne s1, t0, .L5
  ; sci/screens.e16.ts:75  mark(12, 6, 1)
  li a0, 12
  li a1, 6
  li a2, 1
  call mark
  j .L6
.L5:
  ; sci/screens.e16.ts:76  mark(0, 5, 1)
  li a0, 0
  li a1, 5
  li a2, 1
  call mark
.L6:
.L4:
  ; sci/screens.e16.ts:77  if (peek(KEEP_ANSWER) === 1) mark(8, 9, 2)
  lbu t0, 3076(zero)
  li t1, 1
  bne t0, t1, .L7
  ; sci/screens.e16.ts:77  mark(8, 9, 2)
  li a0, 8
  li a1, 9
  li a2, 2
  call mark
  j .L8
.L7:
  ; sci/screens.e16.ts:78  mark(0, 7, 2)
  li a0, 0
  li a1, 7
  li a2, 2
  call mark
.L8:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:82 setupKey(k) at -O1
;   k in s1
setupKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/screens.e16.ts:83  if (k === K_AC) return 1
  li t0, 5
  bne s1, t0, .L1
  ; sci/screens.e16.ts:83  return 1
  li a0, 1
  j .return
.L1:
  ; sci/screens.e16.ts:84  if (setupChoice(k)) setupScreen()
  mv a0, s1
  call setupChoice
  beqz a0, .L2
  ; sci/screens.e16.ts:84  setupScreen()
  call setupScreen
  j .L3
.L2:
  ; sci/screens.e16.ts:85  refuse()
  call refuse
.L3:
  ; sci/screens.e16.ts:86  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:90 setupChoice(k) at -O1
;   k in a0
setupChoice:
  ; sci/screens.e16.ts:91  if (k === K_1 || k === K_2) poke(KEEP_DISPLAY, k === K_1 ? 0 : 1)
  li t0, 56
  beq a0, t0, .L2
  li t0, 57
  bne a0, t0, .L1
.L2:
  ; sci/screens.e16.ts:91  poke(KEEP_DISPLAY, k === K_1 ? 0 : 1)
  li t0, 3075
  mv t1, a0
  li t2, 56
  bne t1, t2, .L3
  li t1, 0
  j .L4
.L3:
  li t1, 1
.L4:
  sb t1, 0(t0)
  j .L5
.L1:
  ; sci/screens.e16.ts:92  if (k === K_3 || k === K_4) poke(KEEP_ANGLE, k === K_3 ? 0 : 1)
  li t0, 58
  beq a0, t0, .L7
  li t0, 48
  bne a0, t0, .L6
.L7:
  ; sci/screens.e16.ts:92  poke(KEEP_ANGLE, k === K_3 ? 0 : 1)
  li t0, 3074
  mv t1, a0
  li t2, 58
  bne t1, t2, .L8
  li t1, 0
  j .L9
.L8:
  li t1, 1
.L9:
  sb t1, 0(t0)
  j .L10
.L6:
  ; sci/screens.e16.ts:93  if (k === K_5) poke(KEEP_ANGLE, 2)
  li t0, 49
  bne a0, t0, .L11
  ; sci/screens.e16.ts:93  poke(KEEP_ANGLE, 2)
  li t0, 2
  sb t0, 3074(zero)
  j .L12
.L11:
  ; sci/screens.e16.ts:94  if (k === K_6 || k === K_7) poke(KEEP_ANSWER, k === K_6 ? 0 : 1)
  li t0, 50
  beq a0, t0, .L14
  li t0, 40
  bne a0, t0, .L13
.L14:
  ; sci/screens.e16.ts:94  poke(KEEP_ANSWER, k === K_6 ? 0 : 1)
  li t0, 3076
  mv t1, a0
  li t2, 50
  bne t1, t2, .L15
  li t1, 0
  j .L16
.L15:
  li t1, 1
.L16:
  sb t1, 0(t0)
  j .L17
.L13:
  ; sci/screens.e16.ts:95  return false
  li a0, 0
  ret
.L17:
.L12:
.L10:
.L5:
  ; sci/screens.e16.ts:96  return true
  li a0, 1
.return:
  ret

; sci/screens.e16.ts:102 faultScreen(cause, pc) at -O1
;   cause in s1
;   pc in s2
faultScreen:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; cause
  mv s2, a1 ; pc
  ; sci/screens.e16.ts:103  if (cause === 0x800f || cause === 3) band(str('BREAK'))
  li t0, 32783
  beq s1, t0, .L2
  li t0, 3
  bne s1, t0, .L1
.L2:
  ; sci/screens.e16.ts:103  band(str('BREAK'))
  la a0, str_44
  call band
  j .L3
.L1:
  ; sci/screens.e16.ts:104  band(str('FAULT'))
  la a0, str_45
  call band
.L3:
  ; sci/screens.e16.ts:105  textAt(str('CAUSE'), 1, lineY(0))
  la a0, str_46
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:106  hexAt(cause, 43, lineY(0))
  mv a0, s1
  li a1, 43
  li a2, 11
  call hexAt
  ; sci/screens.e16.ts:107  textAt(str('AT'), 1, lineY(1))
  la a0, str_47
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:108  hexAt(pc, 43, lineY(1))
  mv a0, s2
  li a1, 43
  li a2, 20
  call hexAt
  ; sci/screens.e16.ts:109  textAt(str('AC:CLEAR'), 1, lineY(5))
  la a0, str_33
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/screens.e16.ts:114 hexAt(v, x, y) at -O1
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
  ; sci/screens.e16.ts:115  for (let s: u16 = 0; s < 4; s++) {
  li s1, 0 ; s
  j .L3
.L1:
  ; sci/screens.e16.ts:116  const d = (v >> (12 - s * 4)) & 15
  slli t0, s1, 2
  li t1, 12
  sub t1, t1, t0
  srl t1, s3, t1
  andi s2, t1, 15
  ; sci/screens.e16.ts:117  hexText[s] = d < 10 ? 0x30 + d : 0x37 + d
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
  ; sci/screens.e16.ts:119  hexText[4] = 0
  sb zero, hexText+4(zero)
  ; sci/screens.e16.ts:120  textAt(addr(hexText), x, y)
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

str_23:
  .byte 69, 82, 82, 58, 77, 65, 84, 72, 0
str_24:
  .byte 79, 85, 84, 32, 79, 70, 32, 65, 32, 70, 85, 78, 67, 84, 73, 79, 78, 39, 83, 0
str_25:
  .byte 82, 65, 78, 71, 69, 44, 32, 79, 82, 32, 47, 48, 0
str_26:
  .byte 69, 82, 82, 58, 83, 84, 65, 67, 75, 0
str_27:
  .byte 84, 79, 79, 32, 77, 65, 78, 89, 32, 66, 82, 65, 67, 75, 69, 84, 83, 32, 79, 82, 0
str_28:
  .byte 70, 85, 78, 67, 84, 73, 79, 78, 83, 32, 73, 78, 32, 65, 32, 76, 73, 78, 69, 0
str_29:
  .byte 69, 82, 82, 58, 83, 89, 78, 84, 65, 88, 0
str_30:
  .byte 67, 65, 78, 78, 79, 84, 32, 82, 69, 65, 68, 32, 84, 72, 69, 32, 76, 73, 78, 69, 0
str_31:
  .byte 65, 84, 32, 84, 72, 69, 32, 67, 85, 82, 83, 79, 82, 0
str_32:
  .byte 140, 139, 58, 66, 65, 67, 75, 32, 84, 79, 32, 84, 72, 69, 32, 76, 73, 78, 69, 0
str_33:
  .byte 65, 67, 58, 67, 76, 69, 65, 82, 0
str_34:
  .byte 77, 69, 78, 85, 0
str_35:
  .byte 49, 58, 67, 65, 76, 67, 32, 32, 32, 32, 50, 58, 83, 84, 65, 84, 83, 0
str_36:
  .byte 51, 58, 66, 65, 83, 69, 32, 32, 32, 32, 52, 58, 84, 65, 66, 76, 69, 0
str_37:
  .byte 53, 58, 69, 81, 85, 65, 84, 73, 79, 78, 0
str_38:
  .byte 65, 67, 58, 66, 65, 67, 75, 0
str_39:
  .byte 83, 69, 84, 85, 80, 0
str_40:
  .byte 49, 47, 50, 0
str_41:
  .byte 49, 58, 50, 68, 32, 32, 50, 58, 76, 73, 78, 69, 0
str_42:
  .byte 51, 58, 68, 69, 71, 32, 52, 58, 82, 65, 68, 32, 53, 58, 71, 82, 65, 68, 0
str_43:
  .byte 54, 58, 69, 88, 65, 67, 84, 32, 55, 58, 68, 69, 67, 73, 77, 65, 76, 0
str_44:
  .byte 66, 82, 69, 65, 75, 0
str_45:
  .byte 70, 65, 85, 76, 84, 0
str_46:
  .byte 67, 65, 85, 83, 69, 0
str_47:
  .byte 65, 84, 0
  .align 2

  .bank 2
  .org 0xc000
; sci/exact.e16.ts:67 w(k) at -O1
;   k in a0
w:
  ; sci/exact.e16.ts:68  return addr(work) + k
  addi a0, a0, work
.return:
  ret

; sci/exact.e16.ts:72 run(op, a, b) at -O1
;   op in a0
;   a in a1
;   b in a2
run:
  ; sci/exact.e16.ts:73  poke16(MATH_A, a)
  li t0, 65362
  sw a1, 0(t0)
  ; sci/exact.e16.ts:74  poke16(MATH_B, b)
  li t0, 65364
  sw a2, 0(t0)
  ; sci/exact.e16.ts:75  poke16(MATH_OP, op)
  li t0, 65360
  sw a0, 0(t0)
  ; sci/exact.e16.ts:76  return peek16(MATH_STATUS) === 0
  li t0, 65368
  lw t0, 0(t0)
  sub t0, t0, zero
  seqz a0, t0
.return:
  ret

; sci/exact.e16.ts:80 op3(op, dst, a, b) at -O1
;   op in s3
;   dst in s1
;   a in s2
;   b in s0
op3:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  mv s3, a0 ; op
  mv s1, a1 ; dst
  mv s2, a2 ; a
  mv s0, a3 ; b
  ; sci/exact.e16.ts:81  if (dst !== a) copy8(a, dst)
  beq s1, s2, .L1
  ; sci/exact.e16.ts:81  copy8(a, dst)
  mv a0, s2
  mv a1, s1
  call copy8
.L1:
  ; sci/exact.e16.ts:82  return run(op, dst, b)
  mv a0, s3
  mv a1, s1
  mv a2, s0
  call run
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/exact.e16.ts:85 setInt(dst, v) at -O1
;   dst in s1
;   v in s2
setInt:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; dst
  mv s2, a1 ; v
  ; sci/exact.e16.ts:86  poke16(MATH_ARG, u16(v))
  li t0, 65366
  sw s2, 0(t0)
  ; sci/exact.e16.ts:87  run(M_FROMINT, dst, 0)
  li a0, 48
  mv a1, s1
  li a2, 0
  call run
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/exact.e16.ts:91 short(n/e) at -O1
;   n/e in s1
short:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n/e
  ; sci/exact.e16.ts:92  if (isZero(n)) return true
  mv a0, s1
  call isZero
  beqz a0, .L1
  ; sci/exact.e16.ts:92  return true
  li a0, 1
  j .return
.L1:
  ; sci/exact.e16.ts:93  const e = peek(n + 1)
  lbu s1, 1(s1)
  ; sci/exact.e16.ts:94  return e < 10 || e >= 128
  sltiu t0, s1, 10
  mv t1, t0
  bnez t1, .L2
  li t0, 128
  sltu t0, s1, t0
  xori t0, t0, 1
.L2:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/exact.e16.ts:97 isWholeDec(n) at -O1
;   n in s1
isWholeDec:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; sci/exact.e16.ts:98  copy8(n, w(W7))
  li a0, 56
  call w
  mv a1, a0
  mv a0, s1
  call copy8
  ; sci/exact.e16.ts:99  run(M_FRAC, w(W7), 0)
  li a0, 56
  call w
  mv a1, a0
  li a0, 19
  li a2, 0
  call run
  ; sci/exact.e16.ts:100  return isZero(w(W7))
  li a0, 56
  call w
  call isZero
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/exact.e16.ts:103 compare(a, b) at -O1
;   a in s1
;   b in s2
compare:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; a
  mv s2, a1 ; b
  ; sci/exact.e16.ts:104  copy8(a, w(W7))
  li a0, 56
  call w
  mv a1, a0
  mv a0, s1
  call copy8
  ; sci/exact.e16.ts:105  run(M_CMP, w(W7), b)
  li a0, 56
  call w
  mv a1, a0
  li a0, 6
  mv a2, s2
  call run
  ; sci/exact.e16.ts:106  return i16(peek16(MATH_RESULT))
  li t0, 65370
  lw a0, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/exact.e16.ts:110 absInto(dst, a) at -O1
;   dst in s1
;   a in s2
absInto:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; dst
  mv s2, a1 ; a
  ; sci/exact.e16.ts:111  copy8(a, dst)
  mv a0, s2
  mv a1, s1
  call copy8
  ; sci/exact.e16.ts:112  if (isNegative(dst)) run(M_NEG, dst, 0)
  mv a0, s1
  call isNegative
  beqz a0, .L1
  ; sci/exact.e16.ts:112  run(M_NEG, dst, 0)
  li a0, 16
  mv a1, s1
  li a2, 0
  call run
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/exact.e16.ts:116 gcd(dst, a, b) at -O1
;   dst in s1
;   a in s2
;   b in s3
gcd:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; dst
  mv s2, a1 ; a
  mv s3, a2 ; b
  ; sci/exact.e16.ts:117  absInto(w(W5), a)
  li a0, 40
  call w
  mv a1, s2
  call absInto
  ; sci/exact.e16.ts:118  absInto(w(W6), b)
  li a0, 48
  call w
  mv a1, s3
  call absInto
  ; sci/exact.e16.ts:119  while (!isZero(w(W6))) {
  j .L3
.L1:
  ; sci/exact.e16.ts:120  copy8(w(W5), w(W7))
  li a0, 40
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 56
  call w
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  ; sci/exact.e16.ts:121  run(M_MOD, w(W7), w(W6))
  li a0, 56
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 48
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 9
  call run
  ; sci/exact.e16.ts:122  copy8(w(W6), w(W5))
  li a0, 48
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 40
  call w
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  ; sci/exact.e16.ts:123  copy8(w(W7), w(W6))
  li a0, 56
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 48
  call w
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
.L3:
  li a0, 48
  call w
  call isZero
  beqz a0, .L1
  ; sci/exact.e16.ts:125  copy8(w(W5), dst)
  li a0, 40
  call w
  mv a1, s1
  call copy8
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/exact.e16.ts:134 setForm(v, p, r, q) at -O1
;   v in s1
;   p in s2
;   r in s3
;   q in s0
setForm:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; v
  mv s2, a1 ; p
  mv s3, a2 ; r
  mv s0, a3 ; q
  ; sci/exact.e16.ts:135  copy8(p, v + V_P)
  mv a0, s2
  addi a1, s1, 12
  call copy8
  ; sci/exact.e16.ts:136  copy8(r, v + V_R)
  mv a0, s3
  addi a1, s1, 20
  call copy8
  ; sci/exact.e16.ts:137  copy8(q, v + V_Q)
  mv a0, s0
  addi a1, s1, 28
  call copy8
  ; sci/exact.e16.ts:138  poke16(v + V_S, 1)
  li t0, 1
  sw t0, 10(s1)
  ; sci/exact.e16.ts:139  poke16(v + V_EXACT, 1)
  li t0, 1
  sw t0, 8(s1)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/exact.e16.ts:146 normalize(v) at -O1
;   v in s2
;   p in s0
;   r in s3
;   q in s1
normalize:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s0, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; v
  ; sci/exact.e16.ts:147  const p = v + V_P
  addi s0, s2, 12
  ; sci/exact.e16.ts:148  const r = v + V_R
  addi s3, s2, 20
  ; sci/exact.e16.ts:149  const q = v + V_Q
  addi s1, s2, 28
  ; sci/exact.e16.ts:150  if (isZero(q)) {
  mv a0, s1
  call isZero
  beqz a0, .L1
  ; sci/exact.e16.ts:151  inexact(v)
  mv a0, s2
  call inexact
  ; sci/exact.e16.ts:152  return
  j .return
.L1:
  ; sci/exact.e16.ts:154  if (isNegative(q)) {
  mv a0, s1
  call isNegative
  beqz a0, .L2
  ; sci/exact.e16.ts:155  run(M_NEG, p, 0)
  li a0, 16
  mv a1, s0
  li a2, 0
  call run
  ; sci/exact.e16.ts:156  run(M_NEG, r, 0)
  li a0, 16
  mv a1, s3
  li a2, 0
  call run
  ; sci/exact.e16.ts:157  run(M_NEG, q, 0)
  li a0, 16
  mv a1, s1
  li a2, 0
  call run
.L2:
  ; sci/exact.e16.ts:159  if (isZero(r)) poke16(v + V_S, 1)
  mv a0, s3
  call isZero
  beqz a0, .L3
  ; sci/exact.e16.ts:159  poke16(v + V_S, 1)
  li t0, 1
  sw t0, 10(s2)
.L3:
  ; sci/exact.e16.ts:160  if (isZero(p) && isZero(r)) {
  mv a0, s0
  call isZero
  beqz a0, .L4
  mv a0, s3
  call isZero
  beqz a0, .L4
  ; sci/exact.e16.ts:161  setInt(q, 1)
  mv a0, s1
  li a1, 1
  call setInt
  j .L5
.L4:
  ; sci/exact.e16.ts:163  gcd(w(W0), p, r)
  li a0, 0
  call w
  mv a1, s0
  mv a2, s3
  call gcd
  ; sci/exact.e16.ts:164  gcd(w(W0), w(W0), q)
  li a0, 0
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 0
  call w
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  mv a2, s1
  call gcd
  ; sci/exact.e16.ts:165  run(M_IDIV, p, w(W0))
  li a0, 0
  call w
  mv a1, s0
  mv a2, a0
  li a0, 8
  call run
  ; sci/exact.e16.ts:166  run(M_IDIV, r, w(W0))
  li a0, 0
  call w
  mv a1, s3
  mv a2, a0
  li a0, 8
  call run
  ; sci/exact.e16.ts:167  run(M_IDIV, q, w(W0))
  li a0, 0
  call w
  mv a1, s1
  mv a2, a0
  li a0, 8
  call run
.L5:
  ; sci/exact.e16.ts:169  if (!short(p) || !short(r) || !short(q)) inexact(v)
  mv a0, s0
  call short
  beqz a0, .L7
  mv a0, s3
  call short
  beqz a0, .L7
  mv a0, s1
  call short
  bnez a0, .L6
.L7:
  ; sci/exact.e16.ts:169  inexact(v)
  mv a0, s2
  call inexact
.L6:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s0, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/exact.e16.ts:173 exactWhole(v) at -O1
;   v in s1
exactWhole:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/exact.e16.ts:174  if (!isWholeDec(v) || !short(v)) {
  mv a0, s1
  call isWholeDec
  beqz a0, .L2
  mv a0, s1
  call short
  bnez a0, .L1
.L2:
  ; sci/exact.e16.ts:175  inexact(v)
  mv a0, s1
  call inexact
  ; sci/exact.e16.ts:176  return
  j .return
.L1:
  ; sci/exact.e16.ts:178  setInt(w(W1), 0)
  li a0, 8
  call w
  li a1, 0
  call setInt
  ; sci/exact.e16.ts:179  setInt(w(W2), 1)
  li a0, 16
  call w
  li a1, 1
  call setInt
  ; sci/exact.e16.ts:180  setForm(v, v, w(W1), w(W2))
  li a0, 8
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  lw a2, 0(sp)
  addi sp, sp, 2
  mv a1, s1
  mv a3, a0
  mv a0, s1
  call setForm
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/exact.e16.ts:184 exactLiteral(v) at -O1
;   v in s1
;   k in s2
exactLiteral:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; v
  ; sci/exact.e16.ts:185  setInt(w(W3), 1)
  li a0, 24
  call w
  li a1, 1
  call setInt
  ; sci/exact.e16.ts:186  setInt(w(W4), 10)
  li a0, 32
  call w
  li a1, 10
  call setInt
  ; sci/exact.e16.ts:187  copy8(v, w(W2))
  li a0, 16
  call w
  mv a1, a0
  mv a0, s1
  call copy8
  ; sci/exact.e16.ts:188  for (let k: u16 = 0; k <= 10; k++) {
  li s2, 0 ; k
  j .L3
.L1:
  ; sci/exact.e16.ts:189  if (isWholeDec(w(W2))) {
  li a0, 16
  call w
  call isWholeDec
  beqz a0, .L5
  ; sci/exact.e16.ts:190  if (!short(w(W2))) break
  li a0, 16
  call w
  call short
  bnez a0, .L6
  ; sci/exact.e16.ts:190  break
  j .L4
.L6:
  ; sci/exact.e16.ts:191  setInt(w(W1), 0)
  li a0, 8
  call w
  li a1, 0
  call setInt
  ; sci/exact.e16.ts:192  setForm(v, w(W2), w(W1), w(W3))
  li a0, 16
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 8
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 24
  call w
  lw a2, 0(sp)
  addi sp, sp, 2
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a3, a0
  mv a0, s1
  call setForm
  ; sci/exact.e16.ts:193  normalize(v)
  mv a0, s1
  call normalize
  ; sci/exact.e16.ts:194  return
  j .return
.L5:
  ; sci/exact.e16.ts:196  run(M_MUL, w(W2), w(W4))
  li a0, 16
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 32
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 3
  call run
  ; sci/exact.e16.ts:197  run(M_MUL, w(W3), w(W4))
  li a0, 24
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 32
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 3
  call run
  addi s2, s2, 1
.L3:
  li t0, 10
  bgeu t0, s2, .L1
.L4:
  ; sci/exact.e16.ts:199  inexact(v)
  mv a0, s1
  call inexact
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/exact.e16.ts:202 exactNeg(v) at -O1
;   v in s1
exactNeg:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/exact.e16.ts:203  if (!isExact(v)) return
  mv a0, s1
  call isExact
  bnez a0, .L1
  ; sci/exact.e16.ts:203  return
  j .return
.L1:
  ; sci/exact.e16.ts:204  run(M_NEG, v + V_P, 0)
  li a0, 16
  addi a1, s1, 12
  li a2, 0
  call run
  ; sci/exact.e16.ts:205  run(M_NEG, v + V_R, 0)
  li a0, 16
  addi a1, s1, 20
  li a2, 0
  call run
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/exact.e16.ts:214 exactBinary(op, a, b) at -O1
;   op in s2
;   a in s1
;   b in s3
exactBinary:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; op
  mv s1, a1 ; a
  mv s3, a2 ; b
  ; sci/exact.e16.ts:215  if (!isExact(a) || !isExact(b)) {
  mv a0, s1
  call isExact
  beqz a0, .L2
  mv a0, s3
  call isExact
  bnez a0, .L1
.L2:
  ; sci/exact.e16.ts:216  inexact(a)
  mv a0, s1
  call inexact
  ; sci/exact.e16.ts:217  return
  j .return
.L1:
  ; sci/exact.e16.ts:219  if (op === M_ADD || op === M_SUB) addSub(a, b, op === M_SUB)
  li t0, 1
  beq s2, t0, .L4
  li t0, 2
  bne s2, t0, .L3
.L4:
  ; sci/exact.e16.ts:219  addSub(a, b, op === M_SUB)
  li t0, 2
  sub t0, s2, t0
  seqz a2, t0
  mv a0, s1
  mv a1, s3
  call addSub
  j .L5
.L3:
  ; sci/exact.e16.ts:220  if (op === M_MUL) mulInto(a, b)
  li t0, 3
  bne s2, t0, .L6
  ; sci/exact.e16.ts:220  mulInto(a, b)
  mv a0, s1
  mv a1, s3
  call mulInto
  j .L7
.L6:
  ; sci/exact.e16.ts:221  if (op === M_DIV) divInto(a, b)
  li t0, 4
  bne s2, t0, .L8
  ; sci/exact.e16.ts:221  divInto(a, b)
  mv a0, s1
  mv a1, s3
  call divInto
  j .L9
.L8:
  ; sci/exact.e16.ts:222  if (op === M_POW) powInto(a, b)
  li t0, 5
  bne s2, t0, .L10
  ; sci/exact.e16.ts:222  powInto(a, b)
  mv a0, s1
  mv a1, s3
  call powInto
  j .L11
.L10:
  ; sci/exact.e16.ts:223  inexact(a)
  mv a0, s1
  call inexact
.L11:
.L9:
.L7:
.L5:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/exact.e16.ts:227 sameRoot(a, b) at -O1
;   a in s1
;   b in s2
sameRoot:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; a
  mv s2, a1 ; b
  ; sci/exact.e16.ts:228  return isZero(a + V_R) || isZero(b + V_R) || peek16(a + V_S) === peek16(b + V_S)
  addi a0, s1, 20
  call isZero
  mv t1, a0
  mv t0, a0
  bnez t1, .L2
  addi a0, s2, 20
  call isZero
  mv t0, a0
.L2:
  mv t1, t0
  bnez t1, .L1
  lw t0, 10(s1)
  lw t1, 10(s2)
  sub t0, t0, t1
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/exact.e16.ts:231 rootOf(a, b) at -O1
;   a in s1
;   b in s2
rootOf:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; a
  mv s2, a1 ; b
  ; sci/exact.e16.ts:232  return isZero(a + V_R) ? peek16(b + V_S) : peek16(a + V_S)
  addi a0, s1, 20
  call isZero
  beqz a0, .L1
  lw t0, 10(s2)
  j .L2
.L1:
  lw t0, 10(s1)
.L2:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/exact.e16.ts:236 addSub(a, b/ok, minus/sum) at -O1
;   a in s1
;   b/ok in s2
;   minus/sum in s3
;   s in s0
addSub:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; a
  mv s2, a1 ; b/ok
  mv s3, a2 ; minus/sum
  ; sci/exact.e16.ts:237  if (!sameRoot(a, b)) {
  mv a0, s1
  mv a1, s2
  call sameRoot
  bnez a0, .L1
  ; sci/exact.e16.ts:238  inexact(a)
  mv a0, s1
  call inexact
  ; sci/exact.e16.ts:239  return
  j .return
.L1:
  ; sci/exact.e16.ts:241  const s = rootOf(a, b)
  mv a0, s1
  mv a1, s2
  call rootOf
  mv s0, a0 ; s
  ; sci/exact.e16.ts:242  const sum = minus ? M_SUB : M_ADD
  beqz s3, .L2
  li t0, 2
  j .L3
.L2:
  li t0, 1
.L3:
  mv s3, t0 ; minus/sum
  ; sci/exact.e16.ts:243  const ok =
  li a0, 8
  call w
  mv a1, a0
  li a0, 3
  addi a2, s1, 12
  addi a3, s2, 28
  call op3
  mv t1, a0
  mv t0, a0
  beqz t1, .L9
  li a0, 16
  call w
  mv a1, a0
  li a0, 3
  addi a2, s2, 12
  addi a3, s1, 28
  call op3
  mv t0, a0
.L9:
  mv t1, t0
  beqz t1, .L8
  li a0, 8
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  mv a0, s3
  call run
  mv t0, a0
.L8:
  mv t1, t0
  beqz t1, .L7
  li a0, 16
  call w
  mv a1, a0
  li a0, 3
  addi a2, s1, 20
  addi a3, s2, 28
  call op3
  mv t0, a0
.L7:
  mv t1, t0
  beqz t1, .L6
  li a0, 24
  call w
  mv a1, a0
  li a0, 3
  addi a2, s2, 20
  addi a3, s1, 28
  call op3
  mv t0, a0
.L6:
  mv t1, t0
  beqz t1, .L5
  li a0, 16
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 24
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  mv a0, s3
  call run
  mv t0, a0
.L5:
  mv t1, t0
  beqz t1, .L4
  li a0, 24
  call w
  mv a1, a0
  li a0, 3
  addi a2, s1, 28
  addi a3, s2, 28
  call op3
  mv t0, a0
.L4:
  mv s2, t0 ; b/ok
  ; sci/exact.e16.ts:251  if (!ok) {
  bnez s2, .L10
  ; sci/exact.e16.ts:252  inexact(a)
  mv a0, s1
  call inexact
  ; sci/exact.e16.ts:253  return
  j .return
.L10:
  ; sci/exact.e16.ts:255  setForm(a, w(W1), w(W2), w(W3))
  li a0, 8
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 24
  call w
  lw a2, 0(sp)
  addi sp, sp, 2
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a3, a0
  mv a0, s1
  call setForm
  ; sci/exact.e16.ts:256  poke16(a + V_S, s)
  sw s0, 10(s1)
  ; sci/exact.e16.ts:257  normalize(a)
  mv a0, s1
  call normalize
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/exact.e16.ts:261 mulInto(a, b/ok) at -O1
;   a in s1
;   b/ok in s2
;   s in s3
mulInto:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; a
  mv s2, a1 ; b/ok
  ; sci/exact.e16.ts:262  if (!sameRoot(a, b)) {
  mv a0, s1
  mv a1, s2
  call sameRoot
  bnez a0, .L1
  ; sci/exact.e16.ts:263  inexact(a)
  mv a0, s1
  call inexact
  ; sci/exact.e16.ts:264  return
  j .return
.L1:
  ; sci/exact.e16.ts:266  const s = rootOf(a, b)
  mv a0, s1
  mv a1, s2
  call rootOf
  mv s3, a0 ; s
  ; sci/exact.e16.ts:267  setInt(w(W4), i16(s))
  li a0, 32
  call w
  mv a1, s3
  call setInt
  ; sci/exact.e16.ts:268  const ok =
  li a0, 8
  call w
  mv a1, a0
  li a0, 3
  addi a2, s1, 12
  addi a3, s2, 12
  call op3
  mv t1, a0
  mv t0, a0
  beqz t1, .L8
  li a0, 16
  call w
  mv a1, a0
  li a0, 3
  addi a2, s1, 20
  addi a3, s2, 20
  call op3
  mv t0, a0
.L8:
  mv t1, t0
  beqz t1, .L7
  li a0, 16
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 32
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 3
  call run
  mv t0, a0
.L7:
  mv t1, t0
  beqz t1, .L6
  li a0, 8
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 1
  call run
  mv t0, a0
.L6:
  mv t1, t0
  beqz t1, .L5
  li a0, 16
  call w
  mv a1, a0
  li a0, 3
  addi a2, s1, 12
  addi a3, s2, 20
  call op3
  mv t0, a0
.L5:
  mv t1, t0
  beqz t1, .L4
  li a0, 24
  call w
  mv a1, a0
  li a0, 3
  addi a2, s2, 12
  addi a3, s1, 20
  call op3
  mv t0, a0
.L4:
  mv t1, t0
  beqz t1, .L3
  li a0, 16
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 24
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 1
  call run
  mv t0, a0
.L3:
  mv t1, t0
  beqz t1, .L2
  li a0, 24
  call w
  mv a1, a0
  li a0, 3
  addi a2, s1, 28
  addi a3, s2, 28
  call op3
  mv t0, a0
.L2:
  mv s2, t0 ; b/ok
  ; sci/exact.e16.ts:277  if (!ok) {
  bnez s2, .L9
  ; sci/exact.e16.ts:278  inexact(a)
  mv a0, s1
  call inexact
  ; sci/exact.e16.ts:279  return
  j .return
.L9:
  ; sci/exact.e16.ts:281  setForm(a, w(W1), w(W2), w(W3))
  li a0, 8
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 24
  call w
  lw a2, 0(sp)
  addi sp, sp, 2
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a3, a0
  mv a0, s1
  call setForm
  ; sci/exact.e16.ts:282  poke16(a + V_S, s)
  sw s3, 10(s1)
  ; sci/exact.e16.ts:283  normalize(a)
  mv a0, s1
  call normalize
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/exact.e16.ts:287 inverseInto(dst, b/ok) at -O1
;   dst in s2
;   b/ok in s1
;   s in s3
inverseInto:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; dst
  mv s1, a1 ; b/ok
  ; sci/exact.e16.ts:288  const s = peek16(b + V_S)
  lw s3, 10(s1)
  ; sci/exact.e16.ts:289  setInt(w(W4), i16(s))
  li a0, 32
  call w
  mv a1, s3
  call setInt
  ; sci/exact.e16.ts:290  const ok =
  li a0, 8
  call w
  mv a1, a0
  li a0, 3
  addi a2, s1, 28
  addi a3, s1, 12
  call op3
  mv t1, a0
  mv t0, a0
  beqz t1, .L6
  li a0, 16
  call w
  mv a1, a0
  li a0, 3
  addi a2, s1, 28
  addi a3, s1, 20
  call op3
  mv t0, a0
.L6:
  mv t1, t0
  beqz t1, .L5
  li a0, 16
  call w
  mv a1, a0
  li a0, 16
  li a2, 0
  call run
  mv t0, a0
.L5:
  mv t1, t0
  beqz t1, .L4
  li a0, 24
  call w
  mv a1, a0
  li a0, 3
  addi a2, s1, 12
  addi a3, s1, 12
  call op3
  mv t0, a0
.L4:
  mv t1, t0
  beqz t1, .L3
  li a0, 0
  call w
  mv a1, a0
  li a0, 3
  addi a2, s1, 20
  addi a3, s1, 20
  call op3
  mv t0, a0
.L3:
  mv t1, t0
  beqz t1, .L2
  li a0, 0
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 32
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 3
  call run
  mv t0, a0
.L2:
  mv t1, t0
  beqz t1, .L1
  li a0, 24
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 0
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 2
  call run
  mv t0, a0
.L1:
  mv s1, t0 ; b/ok
  ; sci/exact.e16.ts:298  if (!ok || isZero(w(W3))) return false
  beqz s1, .L8
  li a0, 24
  call w
  call isZero
  beqz a0, .L7
.L8:
  ; sci/exact.e16.ts:298  return false
  li a0, 0
  j .return
.L7:
  ; sci/exact.e16.ts:299  setForm(dst, w(W1), w(W2), w(W3))
  li a0, 8
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 24
  call w
  lw a2, 0(sp)
  addi sp, sp, 2
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a3, a0
  mv a0, s2
  call setForm
  ; sci/exact.e16.ts:300  poke16(dst + V_S, s)
  sw s3, 10(s2)
  ; sci/exact.e16.ts:301  normalize(dst)
  mv a0, s2
  call normalize
  ; sci/exact.e16.ts:302  return isExact(dst)
  mv a0, s2
  call isExact
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/exact.e16.ts:305 divInto(a, b) at -O1
;   a in s1
;   b in s2
divInto:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; a
  mv s2, a1 ; b
  ; sci/exact.e16.ts:306  if (!inverseInto(addr(tmpB), b)) {
  la a0, tmpB
  mv a1, s2
  call inverseInto
  bnez a0, .L1
  ; sci/exact.e16.ts:307  inexact(a)
  mv a0, s1
  call inexact
  ; sci/exact.e16.ts:308  return
  j .return
.L1:
  ; sci/exact.e16.ts:310  mulInto(a, addr(tmpB))
  mv a0, s1
  la a1, tmpB
  call mulInto
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/exact.e16.ts:314 powInto(a, b/n) at -O1
;   a in s2
;   b/n in s1
;   k in s3
powInto:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; a
  mv s1, a1 ; b/n
  ; sci/exact.e16.ts:315  if (!isZero(b + V_R) || !isWholeDec(b + V_Q) || compare(b + V_Q, oneAt()) !== 0) {
  addi a0, s1, 20
  call isZero
  beqz a0, .L2
  addi a0, s1, 28
  call isWholeDec
  beqz a0, .L2
  call oneAt
  mv a1, a0
  addi a0, s1, 28
  call compare
  beq a0, zero, .L1
.L2:
  ; sci/exact.e16.ts:316  inexact(a)
  mv a0, s2
  call inexact
  ; sci/exact.e16.ts:317  return
  j .return
.L1:
  ; sci/exact.e16.ts:319  copy8(b + V_P, w(W7))
  li a0, 56
  call w
  mv a1, a0
  addi a0, s1, 12
  call copy8
  ; sci/exact.e16.ts:320  run(M_TOINT, w(W7), 0)
  li a0, 56
  call w
  mv a1, a0
  li a0, 49
  li a2, 0
  call run
  ; sci/exact.e16.ts:321  let n = i16(peek16(MATH_ARG))
  li t0, 65366
  lw s1, 0(t0)
  ; sci/exact.e16.ts:322  if (n > 64 || n < -64) {
  li t0, 64
  blt t0, s1, .L4
  li t0, 65472
  bge s1, t0, .L3
.L4:
  ; sci/exact.e16.ts:323  inexact(a)
  mv a0, s2
  call inexact
  ; sci/exact.e16.ts:324  return
  j .return
.L3:
  ; sci/exact.e16.ts:326  memcpy(addr(tmpA), a, VALUE_SIZE)
  la a0, tmpA
  mv a1, s2
  li a2, 36
  mcpy a0, a1, a2
  ; sci/exact.e16.ts:327  if (n < 0) {
  bge s1, zero, .L5
  ; sci/exact.e16.ts:328  if (!inverseInto(addr(tmpA), a)) {
  la a0, tmpA
  mv a1, s2
  call inverseInto
  bnez a0, .L6
  ; sci/exact.e16.ts:329  inexact(a)
  mv a0, s2
  call inexact
  ; sci/exact.e16.ts:330  return
  j .return
.L6:
  ; sci/exact.e16.ts:332  n = -n
  neg s1, s1
.L5:
  ; sci/exact.e16.ts:334  setInt(w(W1), 1)
  li a0, 8
  call w
  li a1, 1
  call setInt
  ; sci/exact.e16.ts:335  setInt(w(W2), 0)
  li a0, 16
  call w
  li a1, 0
  call setInt
  ; sci/exact.e16.ts:336  setForm(a, w(W1), w(W2), w(W1))
  li a0, 8
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 8
  call w
  lw a2, 0(sp)
  addi sp, sp, 2
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a3, a0
  mv a0, s2
  call setForm
  ; sci/exact.e16.ts:337  for (let k: i16 = 0; k < n && isExact(a); k++) mulInto(a, addr(tmpA))
  li s3, 0 ; k
  j .L9
.L7:
  ; sci/exact.e16.ts:337  mulInto(a, addr(tmpA))
  mv a0, s2
  la a1, tmpA
  call mulInto
  addi s3, s3, 1
.L9:
  bge s3, s1, .L11
  mv a0, s2
  call isExact
  bnez a0, .L7
.L11:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/exact.e16.ts:341 oneAt() at -O1
oneAt:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/exact.e16.ts:342  setInt(addr(one), 1)
  la a0, one
  li a1, 1
  call setInt
  ; sci/exact.e16.ts:343  return addr(one)
  la a0, one
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/exact.e16.ts:349 squarefree(s) at -O1
;   s in a0
;   d in a1
squarefree:
  ; sci/exact.e16.ts:350  for (let d: u16 = 2; d * d <= s; d++) {
  li a1, 2 ; d
  j .L3
.L1:
  ; sci/exact.e16.ts:351  if (s % (d * d) === 0) return false
  mul t0, a1, a1
  remu t0, a0, t0
  bne t0, zero, .L5
  ; sci/exact.e16.ts:351  return false
  li a0, 0
  ret
.L5:
  addi a1, a1, 1
.L3:
  mul t0, a1, a1
  bgeu a0, t0, .L1
  ; sci/exact.e16.ts:353  return true
  li a0, 1
.return:
  ret

; sci/exact.e16.ts:357 squareTimes(s) at -O1
;   s in s1
squareTimes:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; s
  ; sci/exact.e16.ts:358  setInt(w(W2), i16(s))
  li a0, 16
  call w
  mv a1, s1
  call setInt
  ; sci/exact.e16.ts:359  copy8(w(W1), w(W3))
  li a0, 8
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 24
  call w
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  ; sci/exact.e16.ts:360  run(M_MOD, w(W3), w(W2))
  li a0, 24
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 9
  call run
  ; sci/exact.e16.ts:361  if (!isZero(w(W3))) return false
  li a0, 24
  call w
  call isZero
  bnez a0, .L1
  ; sci/exact.e16.ts:361  return false
  li a0, 0
  j .return
.L1:
  ; sci/exact.e16.ts:362  copy8(w(W1), w(W3))
  li a0, 8
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 24
  call w
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  ; sci/exact.e16.ts:363  run(M_IDIV, w(W3), w(W2))
  li a0, 24
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 8
  call run
  ; sci/exact.e16.ts:364  copy8(w(W3), w(W4))
  li a0, 24
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 32
  call w
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  ; sci/exact.e16.ts:365  run(M_SQR, w(W4), 0)
  li a0, 32
  call w
  mv a1, a0
  li a0, 21
  li a2, 0
  call run
  ; sci/exact.e16.ts:366  if (!isWholeDec(w(W4))) return false
  li a0, 32
  call w
  call isWholeDec
  bnez a0, .L2
  ; sci/exact.e16.ts:366  return false
  li a0, 0
  j .return
.L2:
  ; sci/exact.e16.ts:367  copy8(w(W4), w(W0))
  li a0, 32
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 0
  call w
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  ; sci/exact.e16.ts:368  run(M_MUL, w(W0), w(W4))
  li a0, 0
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 32
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 3
  call run
  ; sci/exact.e16.ts:369  return compare(w(W0), w(W3)) === 0
  li a0, 0
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 24
  call w
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call compare
  sub t0, a0, zero
  seqz a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/exact.e16.ts:376 exactSqrt(v) at -O1
;   v in s1
;   s in s2
exactSqrt:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; v
  ; sci/exact.e16.ts:377  if (!isExact(v) || !isZero(v + V_R) || isNegative(v + V_P)) {
  mv a0, s1
  call isExact
  beqz a0, .L2
  addi a0, s1, 20
  call isZero
  beqz a0, .L2
  addi a0, s1, 12
  call isNegative
  beqz a0, .L1
.L2:
  ; sci/exact.e16.ts:378  inexact(v)
  mv a0, s1
  call inexact
  ; sci/exact.e16.ts:379  return
  j .return
.L1:
  ; sci/exact.e16.ts:381  if (isZero(v + V_P)) return
  addi a0, s1, 12
  call isZero
  beqz a0, .L3
  ; sci/exact.e16.ts:381  return
  j .return
.L3:
  ; sci/exact.e16.ts:382  if (!op3(M_MUL, w(W1), v + V_P, v + V_Q) || peek(w(W1) + 1) >= 12) {
  li a0, 8
  call w
  mv a1, a0
  li a0, 3
  addi a2, s1, 12
  addi a3, s1, 28
  call op3
  beqz a0, .L5
  li a0, 8
  call w
  lbu t0, 1(a0)
  li t1, 12
  bltu t0, t1, .L4
.L5:
  ; sci/exact.e16.ts:383  inexact(v)
  mv a0, s1
  call inexact
  ; sci/exact.e16.ts:384  return
  j .return
.L4:
  ; sci/exact.e16.ts:386  for (let s: u16 = 1; s < 100; s++) {
  li s2, 1 ; s
  j .L8
.L6:
  ; sci/exact.e16.ts:387  if (!squarefree(s) || !squareTimes(s)) continue
  mv a0, s2
  call squarefree
  beqz a0, .L7
  mv a0, s2
  call squareTimes
  bnez a0, .L10
  ; sci/exact.e16.ts:387  continue
  j .L7
.L10:
  ; sci/exact.e16.ts:388  setInt(w(W2), 0)
  li a0, 16
  call w
  li a1, 0
  call setInt
  ; sci/exact.e16.ts:389  copy8(v + V_Q, w(W3))
  li a0, 24
  call w
  mv a1, a0
  addi a0, s1, 28
  call copy8
  ; sci/exact.e16.ts:390  if (s === 1) setForm(v, w(W4), w(W2), w(W3))
  li t0, 1
  bne s2, t0, .L12
  ; sci/exact.e16.ts:390  setForm(v, w(W4), w(W2), w(W3))
  li a0, 32
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 24
  call w
  lw a2, 0(sp)
  addi sp, sp, 2
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a3, a0
  mv a0, s1
  call setForm
  j .L13
.L12:
  ; sci/exact.e16.ts:392  setForm(v, w(W2), w(W4), w(W3))
  li a0, 16
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 32
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 24
  call w
  lw a2, 0(sp)
  addi sp, sp, 2
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a3, a0
  mv a0, s1
  call setForm
  ; sci/exact.e16.ts:393  poke16(v + V_S, s)
  sw s2, 10(s1)
.L13:
  ; sci/exact.e16.ts:395  normalize(v)
  mv a0, s1
  call normalize
  ; sci/exact.e16.ts:396  return
  j .return
.L7:
  addi s2, s2, 1
.L8:
  li t0, 100
  bltu s2, t0, .L6
  ; sci/exact.e16.ts:398  inexact(v)
  mv a0, s1
  call inexact
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/exact.e16.ts:413 angleIndex(arg/k) at -O1
;   arg/k in s1
;   angle in s2
angleIndex:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; arg/k
  ; sci/exact.e16.ts:414  const angle = peek(KEEP_ANGLE)
  lbu s2, 3074(zero)
  ; sci/exact.e16.ts:415  if (angle === 0) {
  bne s2, zero, .L1
  ; sci/exact.e16.ts:416  if (!isExact(arg) || !isZero(arg + V_R)) return 0xffff
  mv a0, s1
  call isExact
  beqz a0, .L3
  addi a0, s1, 20
  call isZero
  bnez a0, .L2
.L3:
  ; sci/exact.e16.ts:416  return 0xffff
  li a0, 65535
  j .return
.L2:
  ; sci/exact.e16.ts:417  setInt(w(W2), 15)
  li a0, 16
  call w
  li a1, 15
  call setInt
  ; sci/exact.e16.ts:418  if (!op3(M_MUL, w(W1), arg + V_Q, w(W2))) return 0xffff
  li a0, 8
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  addi a2, s1, 28
  mv a3, a0
  li a0, 3
  call op3
  bnez a0, .L4
  ; sci/exact.e16.ts:418  return 0xffff
  li a0, 65535
  j .return
.L4:
  ; sci/exact.e16.ts:419  copy8(arg + V_P, w(W3))
  li a0, 24
  call w
  mv a1, a0
  addi a0, s1, 12
  call copy8
  ; sci/exact.e16.ts:420  run(M_MOD, w(W3), w(W1))
  li a0, 24
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 8
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 9
  call run
  ; sci/exact.e16.ts:421  if (!isZero(w(W3))) return 0xffff
  li a0, 24
  call w
  call isZero
  bnez a0, .L5
  ; sci/exact.e16.ts:421  return 0xffff
  li a0, 65535
  j .return
.L5:
  ; sci/exact.e16.ts:422  copy8(arg + V_P, w(W3))
  li a0, 24
  call w
  mv a1, a0
  addi a0, s1, 12
  call copy8
  ; sci/exact.e16.ts:423  run(M_IDIV, w(W3), w(W1))
  li a0, 24
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 8
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 8
  call run
  j .L6
.L1:
  ; sci/exact.e16.ts:426  copy8(arg, w(W3))
  li a0, 24
  call w
  mv a1, a0
  mv a0, s1
  call copy8
  ; sci/exact.e16.ts:427  if (angle === 1) {
  li t0, 1
  bne s2, t0, .L7
  ; sci/exact.e16.ts:428  setInt(w(W2), 12)
  li a0, 16
  call w
  li a1, 12
  call setInt
  ; sci/exact.e16.ts:429  run(M_MUL, w(W3), w(W2))
  li a0, 24
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 3
  call run
  ; sci/exact.e16.ts:430  run(M_PI, w(W2), 0)
  li a0, 16
  call w
  mv a1, a0
  li a0, 32
  li a2, 0
  call run
  ; sci/exact.e16.ts:431  run(M_DIV, w(W3), w(W2))
  li a0, 24
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 4
  call run
  j .L8
.L7:
  ; sci/exact.e16.ts:433  setInt(w(W2), 3)
  li a0, 16
  call w
  li a1, 3
  call setInt
  ; sci/exact.e16.ts:434  run(M_MUL, w(W3), w(W2))
  li a0, 24
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 3
  call run
  ; sci/exact.e16.ts:435  setInt(w(W2), 50)
  li a0, 16
  call w
  li a1, 50
  call setInt
  ; sci/exact.e16.ts:436  run(M_DIV, w(W3), w(W2))
  li a0, 24
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 4
  call run
.L8:
  ; sci/exact.e16.ts:439  setInt(w(W2), 1)
  li a0, 16
  call w
  li a1, 1
  call setInt
  ; sci/exact.e16.ts:440  setInt(w(W4), 2)
  li a0, 32
  call w
  li a1, 2
  call setInt
  ; sci/exact.e16.ts:441  run(M_DIV, w(W2), w(W4))
  li a0, 16
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 32
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 4
  call run
  ; sci/exact.e16.ts:442  copy8(w(W3), w(W1))
  li a0, 24
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 8
  call w
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  ; sci/exact.e16.ts:443  run(M_ADD, w(W1), w(W2))
  li a0, 8
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 1
  call run
  ; sci/exact.e16.ts:444  run(M_INT, w(W1), 0)
  li a0, 8
  call w
  mv a1, a0
  li a0, 18
  li a2, 0
  call run
  ; sci/exact.e16.ts:445  copy8(w(W3), w(W4))
  li a0, 24
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 32
  call w
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  ; sci/exact.e16.ts:446  run(M_SUB, w(W4), w(W1))
  li a0, 32
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 8
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 2
  call run
  ; sci/exact.e16.ts:447  absInto(w(W4), w(W4))
  li a0, 32
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 32
  call w
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call absInto
  ; sci/exact.e16.ts:448  setInt(w(W2), 1)
  li a0, 16
  call w
  li a1, 1
  call setInt
  ; sci/exact.e16.ts:449  setInt(w(W0), 1000)
  li a0, 0
  call w
  li a1, 1000
  call setInt
  ; sci/exact.e16.ts:450  run(M_DIV, w(W2), w(W0))
  li a0, 16
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 0
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 4
  call run
  ; sci/exact.e16.ts:451  run(M_DIV, w(W2), w(W0))
  li a0, 16
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 0
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 4
  call run
  ; sci/exact.e16.ts:452  run(M_DIV, w(W2), w(W0))
  li a0, 16
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 0
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 4
  call run
  ; sci/exact.e16.ts:453  if (compare(w(W4), w(W2)) > 0) return 0xffff
  li a0, 32
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call compare
  bge zero, a0, .L9
  ; sci/exact.e16.ts:453  return 0xffff
  li a0, 65535
  j .return
.L9:
  ; sci/exact.e16.ts:454  copy8(w(W1), w(W3))
  li a0, 8
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 24
  call w
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
.L6:
  ; sci/exact.e16.ts:456  setInt(w(W2), 24)
  li a0, 16
  call w
  li a1, 24
  call setInt
  ; sci/exact.e16.ts:457  run(M_MOD, w(W3), w(W2))
  li a0, 24
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  li a0, 9
  call run
  ; sci/exact.e16.ts:458  run(M_TOINT, w(W3), 0)
  li a0, 24
  call w
  mv a1, a0
  li a0, 49
  li a2, 0
  call run
  ; sci/exact.e16.ts:459  const k = i16(peek16(MATH_ARG))
  li t0, 65366
  lw s1, 0(t0)
  ; sci/exact.e16.ts:460  return u16(k < 0 ? k + 24 : k)
  bge s1, zero, .L10
  addi t0, s1, 24
  j .L11
.L10:
  mv t0, s1
.L11:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/exact.e16.ts:467 setSmall(p, r, s, q) at -O1
;   p in s1
;   r in s2
;   s in s3
;   q in s0
setSmall:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; p
  mv s2, a1 ; r
  mv s3, a2 ; s
  mv s0, a3 ; q
  ; sci/exact.e16.ts:468  setInt(w(W1), p)
  li a0, 8
  call w
  mv a1, s1
  call setInt
  ; sci/exact.e16.ts:469  setInt(w(W2), r)
  li a0, 16
  call w
  mv a1, s2
  call setInt
  ; sci/exact.e16.ts:470  setInt(w(W3), i16(q))
  li a0, 24
  call w
  mv a1, s0
  call setInt
  ; sci/exact.e16.ts:471  setForm(smallAt, w(W1), w(W2), w(W3))
  lw t0, 0x0672(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 8
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call w
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 24
  call w
  lw a2, 0(sp)
  addi sp, sp, 2
  lw a1, 0(sp)
  addi sp, sp, 2
  lw t2, 0(sp)
  addi sp, sp, 2
  mv a3, a0
  mv a0, t2
  call setForm
  ; sci/exact.e16.ts:472  poke16(smallAt + V_S, s)
  lw t0, 0x0672(zero)
  sw s3, 10(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/exact.e16.ts:476 sinSpecial(k/sign) at -O1
;   k/sign in s2
;   half in s1
sinSpecial:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; k/sign
  ; sci/exact.e16.ts:477  const half = k % 12
  li t1, 43691
  mulhu t0, s2, t1
  srli t0, t0, 3
  li t1, 12
  mul t0, t0, t1
  sub s1, s2, t0
  ; sci/exact.e16.ts:478  const sign: i16 = k >= 12 ? -1 : 1
  li t0, 12
  bltu s2, t0, .L1
  li t0, 65535
  j .L2
.L1:
  li t0, 1
.L2:
  mv s2, t0 ; k/sign
  ; sci/exact.e16.ts:479  switch (half) {
  beq s1, zero, .L4
  li t0, 2
  beq s1, t0, .L5
  li t0, 10
  beq s1, t0, .L6
  li t0, 3
  beq s1, t0, .L7
  li t0, 9
  beq s1, t0, .L8
  li t0, 4
  beq s1, t0, .L9
  li t0, 8
  beq s1, t0, .L10
  li t0, 6
  beq s1, t0, .L11
  j .L3
.L4:
  ; sci/exact.e16.ts:481  setSmall(0, 0, 1, 1)
  li a0, 0
  li a1, 0
  li a2, 1
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:482  return true
  li a0, 1
  j .return
.L5:
.L6:
  ; sci/exact.e16.ts:485  setSmall(sign, 0, 1, 2)
  mv a0, s2
  li a1, 0
  li a2, 1
  li a3, 2
  call setSmall
  ; sci/exact.e16.ts:486  return true
  li a0, 1
  j .return
.L7:
.L8:
  ; sci/exact.e16.ts:489  setSmall(0, sign, 2, 2)
  li a0, 0
  mv a1, s2
  li a2, 2
  li a3, 2
  call setSmall
  ; sci/exact.e16.ts:490  return true
  li a0, 1
  j .return
.L9:
.L10:
  ; sci/exact.e16.ts:493  setSmall(0, sign, 3, 2)
  li a0, 0
  mv a1, s2
  li a2, 3
  li a3, 2
  call setSmall
  ; sci/exact.e16.ts:494  return true
  li a0, 1
  j .return
.L11:
  ; sci/exact.e16.ts:496  setSmall(sign, 0, 1, 1)
  mv a0, s2
  li a1, 0
  li a2, 1
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:497  return true
  li a0, 1
  j .return
.L3:
  ; sci/exact.e16.ts:499  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/exact.e16.ts:503 tanSpecial(k/switch1) at -O1
;   k/switch1 in s1
tanSpecial:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/switch1
  ; sci/exact.e16.ts:504  switch (k % 12) {
  li t1, 43691
  mulhu t0, s1, t1
  srli t0, t0, 3
  li t1, 12
  mul t0, t0, t1
  sub s1, s1, t0
  beq s1, zero, .L2
  li t0, 1
  beq s1, t0, .L3
  li t0, 2
  beq s1, t0, .L4
  li t0, 3
  beq s1, t0, .L5
  li t0, 4
  beq s1, t0, .L6
  li t0, 5
  beq s1, t0, .L7
  li t0, 7
  beq s1, t0, .L8
  li t0, 8
  beq s1, t0, .L9
  li t0, 9
  beq s1, t0, .L10
  li t0, 10
  beq s1, t0, .L11
  li t0, 11
  beq s1, t0, .L12
  j .L1
.L2:
  ; sci/exact.e16.ts:506  setSmall(0, 0, 1, 1)
  li a0, 0
  li a1, 0
  li a2, 1
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:507  return true
  li a0, 1
  j .return
.L3:
  ; sci/exact.e16.ts:509  setSmall(2, -1, 3, 1)
  li a0, 2
  li a1, 65535
  li a2, 3
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:510  return true
  li a0, 1
  j .return
.L4:
  ; sci/exact.e16.ts:512  setSmall(0, 1, 3, 3)
  li a0, 0
  li a1, 1
  li a2, 3
  li a3, 3
  call setSmall
  ; sci/exact.e16.ts:513  return true
  li a0, 1
  j .return
.L5:
  ; sci/exact.e16.ts:515  setSmall(1, 0, 1, 1)
  li a0, 1
  li a1, 0
  li a2, 1
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:516  return true
  li a0, 1
  j .return
.L6:
  ; sci/exact.e16.ts:518  setSmall(0, 1, 3, 1)
  li a0, 0
  li a1, 1
  li a2, 3
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:519  return true
  li a0, 1
  j .return
.L7:
  ; sci/exact.e16.ts:521  setSmall(2, 1, 3, 1)
  li a0, 2
  li a1, 1
  li a2, 3
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:522  return true
  li a0, 1
  j .return
.L8:
  ; sci/exact.e16.ts:524  setSmall(-2, -1, 3, 1)
  li a0, 65534
  li a1, 65535
  li a2, 3
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:525  return true
  li a0, 1
  j .return
.L9:
  ; sci/exact.e16.ts:527  setSmall(0, -1, 3, 1)
  li a0, 0
  li a1, 65535
  li a2, 3
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:528  return true
  li a0, 1
  j .return
.L10:
  ; sci/exact.e16.ts:530  setSmall(-1, 0, 1, 1)
  li a0, 65535
  li a1, 0
  li a2, 1
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:531  return true
  li a0, 1
  j .return
.L11:
  ; sci/exact.e16.ts:533  setSmall(0, -1, 3, 3)
  li a0, 0
  li a1, 65535
  li a2, 3
  li a3, 3
  call setSmall
  ; sci/exact.e16.ts:534  return true
  li a0, 1
  j .return
.L12:
  ; sci/exact.e16.ts:536  setSmall(-2, 1, 3, 1)
  li a0, 65534
  li a1, 1
  li a2, 3
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:537  return true
  li a0, 1
  j .return
.L1:
  ; sci/exact.e16.ts:539  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/exact.e16.ts:546 exactTrig(f, v, arg/k) at -O1
;   f in s3
;   v in s0
;   arg/k in s1
;   found in s2
exactTrig:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  mv s3, a0 ; f
  mv s0, a1 ; v
  mv s1, a2 ; arg/k
  ; sci/exact.e16.ts:547  const k = angleIndex(arg)
  mv a0, s1
  call angleIndex
  mv s1, a0 ; arg/k
  ; sci/exact.e16.ts:548  smallAt = v
  sw s0, 0x0672(zero)
  ; sci/exact.e16.ts:549  let found = false
  li s2, 0 ; found
  ; sci/exact.e16.ts:550  if (k !== 0xffff) {
  li t0, 65535
  beq s1, t0, .L1
  ; sci/exact.e16.ts:551  if (f === TRIG_SIN) found = sinSpecial(k)
  bne s3, zero, .L2
  ; sci/exact.e16.ts:551  found = sinSpecial(k)
  mv a0, s1
  call sinSpecial
  mv s2, a0 ; found
  j .L3
.L2:
  ; sci/exact.e16.ts:552  if (f === TRIG_COS) found = sinSpecial((k + 6) % 24)
  li t0, 1
  bne s3, t0, .L4
  ; sci/exact.e16.ts:552  found = sinSpecial((k + 6) % 24)
  addi t0, s1, 6
  li t2, 43691
  mulhu t1, t0, t2
  srli t1, t1, 4
  li t2, 24
  mul t1, t1, t2
  sub a0, t0, t1
  call sinSpecial
  mv s2, a0 ; found
  j .L5
.L4:
  ; sci/exact.e16.ts:553  found = tanSpecial(k)
  mv a0, s1
  call tanSpecial
  mv s2, a0 ; found
.L5:
.L3:
.L1:
  ; sci/exact.e16.ts:555  if (!found) exactWhole(v)
  bnez s2, .L6
  ; sci/exact.e16.ts:555  exactWhole(v)
  mv a0, s0
  call exactWhole
.L6:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

  .align 2

  .bank 3
  .org 0xc000
; sci/layout.e16.ts:29 tokenAt(i) at -O1
;   i in a0
tokenAt:
  ; sci/layout.e16.ts:30  return peek(buf + i)
  lw t0, 0x0674(zero)
  add t0, t0, a0
  lbu a0, 0(t0)
.return:
  ret

; sci/layout.e16.ts:36 closeOf(i/j) at -O1
;   i/j in s1
;   depth in s2
;   t in s3
closeOf:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i/j
  ; sci/layout.e16.ts:37  let depth: u16 = 0
  li s2, 0 ; depth
  ; sci/layout.e16.ts:38  for (let j = i; j < bufLength; j++) {
  j .L3
.L1:
  ; sci/layout.e16.ts:39  const t = tokenAt(j)
  mv a0, s1
  call tokenAt
  mv s3, a0 ; t
  ; sci/layout.e16.ts:40  if (opensTemplate(t)) depth++
  mv a0, s3
  call opensTemplate
  beqz a0, .L5
  ; sci/layout.e16.ts:40  depth++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/layout.e16.ts:41  if (t === T_END) {
  li t0, 24
  bne s3, t0, .L7
  ; sci/layout.e16.ts:42  depth--
  addi s2, s2, -1
  ; sci/layout.e16.ts:43  if (depth === 0) return j
  bne s2, zero, .L8
  ; sci/layout.e16.ts:43  return j
  mv a0, s1
  j .return
.L8:
.L7:
.L6:
  addi s1, s1, 1
.L3:
  lw t0, 0x0676(zero)
  bltu s1, t0, .L1
  ; sci/layout.e16.ts:46  return bufLength
  lw a0, 0x0676(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/layout.e16.ts:50 sepFrom(i/j) at -O1
;   i/j in s1
;   depth in s2
;   t in s3
sepFrom:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i/j
  ; sci/layout.e16.ts:51  let depth: u16 = 0
  li s2, 0 ; depth
  ; sci/layout.e16.ts:52  for (let j = i; j < bufLength; j++) {
  j .L3
.L1:
  ; sci/layout.e16.ts:53  const t = tokenAt(j)
  mv a0, s1
  call tokenAt
  mv s3, a0 ; t
  ; sci/layout.e16.ts:54  if (opensTemplate(t)) depth++
  mv a0, s3
  call opensTemplate
  beqz a0, .L5
  ; sci/layout.e16.ts:54  depth++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/layout.e16.ts:55  if (t === T_END) depth--
  li t0, 24
  bne s3, t0, .L7
  ; sci/layout.e16.ts:55  depth--
  addi s2, s2, -1
  j .L8
.L7:
  ; sci/layout.e16.ts:56  if (t === T_SEP && depth === 1) return j
  li t0, 23
  bne s3, t0, .L9
  li t0, 1
  bne s2, t0, .L9
  ; sci/layout.e16.ts:56  return j
  mv a0, s1
  j .return
.L9:
.L8:
.L6:
  addi s1, s1, 1
.L3:
  lw t0, 0x0676(zero)
  bltu s1, t0, .L1
  ; sci/layout.e16.ts:58  return bufLength
  lw a0, 0x0676(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/layout.e16.ts:64 measureSeq(from/i, to) at -O1
;   from/i in s1
;   to in 2(sp)
;   width in s3
;   up in s0
;   down in 0(sp)
;   lift in s2
;   t in 4(sp)
measureSeq:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  sw s2, 14(sp)
  mv s1, a0 ; from/i
  sw a1, 2(sp) ; to
  ; sci/layout.e16.ts:65  if (from >= to) {
  lw t0, 2(sp) ; to
  bltu s1, t0, .L1
  ; sci/layout.e16.ts:66  boxUp = 7
  li t0, 7
  sw t0, 0x0682(zero)
  ; sci/layout.e16.ts:67  boxDown = 0
  sw zero, 0x0684(zero)
  ; sci/layout.e16.ts:68  return 6
  li a0, 6
  j .return
.L1:
  ; sci/layout.e16.ts:70  let width: u16 = 0
  li s3, 0 ; width
  ; sci/layout.e16.ts:71  let up: u16 = 7
  li s0, 7 ; up
  ; sci/layout.e16.ts:72  let down: u16 = 0
  sw zero, 0(sp) ; down
  ; sci/layout.e16.ts:73  let lift: u16 = 0
  li s2, 0 ; lift
  ; sci/layout.e16.ts:74  let i = from
  ; sci/layout.e16.ts:75  while (i < to) {
  j .L4
.L2:
  ; sci/layout.e16.ts:76  const t = tokenAt(i)
  mv a0, s1
  call tokenAt
  sw a0, 4(sp) ; t
  ; sci/layout.e16.ts:77  lift = t === T_POWT ? lift + 4 : 0
  li t0, 26
  lw t1, 4(sp) ; t
  bne t1, t0, .L6
  addi t0, s2, 4
  j .L7
.L6:
  li t0, 0
.L7:
  mv s2, t0 ; lift
  ; sci/layout.e16.ts:78  width += measureItem(i)
  mv a0, s1
  call measureItem
  add s3, s3, a0
  ; sci/layout.e16.ts:79  if (boxUp + lift > up) up = boxUp + lift
  lw t0, 0x0682(zero)
  add t0, t0, s2
  bgeu s0, t0, .L8
  ; sci/layout.e16.ts:79  up = boxUp + lift
  lw t0, 0x0682(zero)
  add s0, t0, s2
.L8:
  ; sci/layout.e16.ts:80  if (boxDown > down) down = boxDown
  lw t0, 0x0684(zero)
  lw t1, 0(sp) ; down
  bgeu t1, t0, .L9
  ; sci/layout.e16.ts:80  down = boxDown
  lw t0, 0x0684(zero)
  sw t0, 0(sp) ; down
.L9:
  ; sci/layout.e16.ts:81  i = opensTemplate(t) ? closeOf(i) + 1 : i + 1
  lw a0, 4(sp)
  call opensTemplate
  beqz a0, .L10
  mv a0, s1
  call closeOf
  addi t0, a0, 1
  j .L11
.L10:
  addi t0, s1, 1
.L11:
  mv s1, t0 ; from/i
.L4:
  lw t0, 2(sp) ; to
  bltu s1, t0, .L2
  ; sci/layout.e16.ts:83  boxUp = up
  sw s0, 0x0682(zero)
  ; sci/layout.e16.ts:84  boxDown = down
  lw t0, 0(sp) ; down
  sw t0, 0x0684(zero)
  ; sci/layout.e16.ts:85  return width
  mv a0, s3
.return:
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  lw s2, 14(sp)
  addi sp, sp, 16
  ret

; sci/layout.e16.ts:89 measureItem(i/wb) at -O1
;   i/wb in s2
;   t/sep/wa/reach in s1
;   wa in s3
;   ua in s0
;   da in 0(sp)
measureItem:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s0, 10(sp)
  mv s2, a0 ; i/wb
  ; sci/layout.e16.ts:90  const t = tokenAt(i)
  mv a0, s2
  call tokenAt
  mv s1, a0 ; t/sep/wa/reach
  ; sci/layout.e16.ts:91  if (t === T_FRAC) {
  li t0, 22
  bne s1, t0, .L1
  ; sci/layout.e16.ts:92  const sep = sepFrom(i)
  mv a0, s2
  call sepFrom
  mv s1, a0 ; t/sep/wa/reach
  ; sci/layout.e16.ts:93  const wa = measureSeq(i + 1, sep)
  addi a0, s2, 1
  mv a1, s1
  call measureSeq
  mv s3, a0 ; wa
  ; sci/layout.e16.ts:94  const ua = boxUp
  lw s0, 0x0682(zero)
  ; sci/layout.e16.ts:95  const da = boxDown
  lw t0, 0x0684(zero)
  sw t0, 0(sp) ; da
  ; sci/layout.e16.ts:96  const wb = measureSeq(sep + 1, closeOf(i))
  mv a0, s2
  call closeOf
  mv a1, a0
  addi a0, s1, 1
  call measureSeq
  mv s2, a0 ; i/wb
  ; sci/layout.e16.ts:97  const reach = boxUp + boxDown
  lw t0, 0x0682(zero)
  lw t1, 0x0684(zero)
  add s1, t0, t1
  ; sci/layout.e16.ts:98  boxUp = MID + 2 + da + ua
  lw t0, 0(sp) ; da
  addi t0, t0, 6
  add t0, t0, s0
  sw t0, 0x0682(zero)
  ; sci/layout.e16.ts:99  boxDown = reach > 0 ? reach - 1 : 0
  bgeu zero, s1, .L2
  addi t0, s1, -1
  j .L3
.L2:
  li t0, 0
.L3:
  sw t0, 0x0684(zero)
  ; sci/layout.e16.ts:100  return wider(wa, wb) + 6
  mv a0, s3
  mv a1, s2
  call wider
  addi a0, a0, 6
  j .return
.L1:
  ; sci/layout.e16.ts:102  if (t === T_ROOT) {
  li t0, 25
  bne s1, t0, .L4
  ; sci/layout.e16.ts:103  const wa = measureSeq(i + 1, closeOf(i))
  mv a0, s2
  call closeOf
  mv a1, a0
  addi a0, s2, 1
  call measureSeq
  mv s1, a0 ; t/sep/wa/reach
  ; sci/layout.e16.ts:104  boxUp += 2
  lw t0, 0x0682(zero)
  addi t0, t0, 2
  sw t0, 0x0682(zero)
  ; sci/layout.e16.ts:105  return wa + 6
  addi a0, s1, 6
  j .return
.L4:
  ; sci/layout.e16.ts:107  if (t === T_POWT) {
  li t0, 26
  bne s1, t0, .L5
  ; sci/layout.e16.ts:108  const wa = measureSeq(i + 1, closeOf(i))
  mv a0, s2
  call closeOf
  mv a1, a0
  addi a0, s2, 1
  call measureSeq
  mv s1, a0 ; t/sep/wa/reach
  ; sci/layout.e16.ts:109  boxUp += 4
  lw t0, 0x0682(zero)
  addi t0, t0, 4
  sw t0, 0x0682(zero)
  ; sci/layout.e16.ts:110  boxDown = 0
  sw zero, 0x0684(zero)
  ; sci/layout.e16.ts:111  return wa + 1
  addi a0, s1, 1
  j .return
.L5:
  ; sci/layout.e16.ts:113  boxUp = 7
  li t0, 7
  sw t0, 0x0682(zero)
  ; sci/layout.e16.ts:114  boxDown = 0
  sw zero, 0x0684(zero)
  ; sci/layout.e16.ts:115  return charsOf(t) * 6
  mv a0, s1
  call charsOf
  slli t1, a0, 2
  slli t0, a0, 1
  add a0, t0, t1
.return:
  lw ra, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s0, 10(sp)
  addi sp, sp, 12
  ret

; sci/layout.e16.ts:119 wider(a, b) at -O1
;   a in a0
;   b in a1
wider:
  ; sci/layout.e16.ts:120  if (a > b) return a
  bgeu a1, a0, .L1
  ; sci/layout.e16.ts:120  return a
  ret
.L1:
  ; sci/layout.e16.ts:121  return b
  mv a0, a1
.return:
  ret

; sci/layout.e16.ts:125 charsOf(t/text) at -O1
;   t/text in s1
;   n in s2
charsOf:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t/text
  ; sci/layout.e16.ts:126  const text = t < 0x20 ? tokenText(t) : 0
  li t0, 32
  bgeu s1, t0, .L1
  mv a0, s1
  call tokenText
  mv t0, a0
  j .L2
.L1:
  li t0, 0
.L2:
  mv s1, t0 ; t/text
  ; sci/layout.e16.ts:127  if (text === 0) return 1
  bne s1, zero, .L3
  ; sci/layout.e16.ts:127  return 1
  li a0, 1
  j .return
.L3:
  ; sci/layout.e16.ts:128  let n: u16 = 0
  li s2, 0 ; n
  ; sci/layout.e16.ts:129  while (peek(text + n) !== 0) n++
  j .L6
.L4:
  ; sci/layout.e16.ts:129  n++
  addi s2, s2, 1
.L6:
  add t0, s1, s2
  lbu t0, 0(t0)
  bne t0, zero, .L4
  ; sci/layout.e16.ts:130  return n
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/layout.e16.ts:136 plot(x, y) at -O1
;   x in s1
;   y in s2
plot:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  ; sci/layout.e16.ts:137  if (!ink || x < slide || x - slide >= 128 || y >= 64) return
  lw t0, 0x067a(zero)
  beqz t0, .L2
  lw t0, 0x0678(zero)
  bltu s1, t0, .L2
  lw t0, 0x0678(zero)
  sub t0, s1, t0
  li t1, 128
  bgeu t0, t1, .L2
  li t0, 64
  bltu s2, t0, .L1
.L2:
  ; sci/layout.e16.ts:137  return
  j .return
.L1:
  ; sci/layout.e16.ts:138  dot(x - slide, y)
  lw t0, 0x0678(zero)
  sub a0, s1, t0
  mv a1, s2
  call dot
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/layout.e16.ts:141 hline(x0/x, x1, y) at -O1
;   x0/x in s1
;   x1 in s2
;   y in s3
hline:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; x0/x
  mv s2, a1 ; x1
  mv s3, a2 ; y
  ; sci/layout.e16.ts:142  for (let x = x0; x <= x1; x++) plot(x, y)
  j .L3
.L1:
  ; sci/layout.e16.ts:142  plot(x, y)
  mv a0, s1
  mv a1, s3
  call plot
  addi s1, s1, 1
.L3:
  bgeu s2, s1, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/layout.e16.ts:146 char(c, x, y) at -O1
;   c in s2
;   x in s1
;   y in s3
char:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; c
  mv s1, a1 ; x
  mv s3, a2 ; y
  ; sci/layout.e16.ts:147  if (!ink || x < slide || x - slide > 122) return
  lw t0, 0x067a(zero)
  beqz t0, .L2
  lw t0, 0x0678(zero)
  bltu s1, t0, .L2
  lw t0, 0x0678(zero)
  sub t0, s1, t0
  li t1, 122
  bgeu t1, t0, .L1
.L2:
  ; sci/layout.e16.ts:147  return
  j .return
.L1:
  ; sci/layout.e16.ts:148  glyphAt(c, x - slide, y)
  lw t0, 0x0678(zero)
  sub a1, s1, t0
  mv a0, s2
  mv a2, s3
  call glyphAt
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/layout.e16.ts:152 cursorAt(i, x, foot) at -O1
;   i in a0
;   x in a1
;   foot in a2
cursorAt:
  ; sci/layout.e16.ts:153  if (i !== cursorIndex) return
  lw t0, 0x067c(zero)
  beq a0, t0, .L1
  ; sci/layout.e16.ts:153  return
  ret
.L1:
  ; sci/layout.e16.ts:154  cursorX = x > 0 ? x - 1 : 0
  bgeu zero, a1, .L2
  addi t0, a1, -1
  j .L3
.L2:
  li t0, 0
.L3:
  sw t0, 0x067e(zero)
  ; sci/layout.e16.ts:155  cursorTop = foot - 8
  addi t0, a2, -8
  sw t0, 0x0680(zero)
.return:
  ret

; sci/layout.e16.ts:159 drawSeq(from/i, to, x/lift, foot) at -O1
;   from/i in s2
;   to in 0(sp)
;   x/lift in s3
;   foot in s0
;   k/at in s1
;   t in 2(sp)
drawSeq:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s0, 10(sp)
  sw s1, 12(sp)
  mv s2, a0 ; from/i
  sw a1, 0(sp) ; to
  mv s3, a2 ; x/lift
  mv s0, a3 ; foot
  ; sci/layout.e16.ts:160  cursorAt(from, x, foot)
  mv a0, s2
  mv a1, s3
  mv a2, s0
  call cursorAt
  ; sci/layout.e16.ts:161  if (from >= to) {
  lw t0, 0(sp) ; to
  bltu s2, t0, .L1
  ; sci/layout.e16.ts:163  if (cursorIndex !== from) {
  lw t0, 0x067c(zero)
  beq t0, s2, .L2
  ; sci/layout.e16.ts:164  for (let k: u16 = 0; k < 5; k += 2) {
  li s1, 0 ; k/at
  j .L5
.L3:
  ; sci/layout.e16.ts:165  plot(x + k, foot - 7)
  add a0, s3, s1
  addi a1, s0, -7
  call plot
  ; sci/layout.e16.ts:166  plot(x + k, foot - 1)
  add a0, s3, s1
  addi a1, s0, -1
  call plot
  addi s1, s1, 2
.L5:
  li t0, 5
  bltu s1, t0, .L3
  ; sci/layout.e16.ts:168  for (let k: u16 = 2; k < 6; k += 2) {
  li s1, 2 ; k/at
  j .L9
.L7:
  ; sci/layout.e16.ts:169  plot(x, foot - 7 + k)
  addi t0, s0, -7
  add a1, t0, s1
  mv a0, s3
  call plot
  ; sci/layout.e16.ts:170  plot(x + 4, foot - 7 + k)
  addi t0, s0, -7
  add a1, t0, s1
  addi a0, s3, 4
  call plot
  addi s1, s1, 2
.L9:
  li t0, 6
  bltu s1, t0, .L7
.L2:
  ; sci/layout.e16.ts:173  return x + 6
  addi a0, s3, 6
  j .return
.L1:
  ; sci/layout.e16.ts:175  let at = x
  mv s1, s3 ; k/at
  ; sci/layout.e16.ts:176  let lift: u16 = 0
  li s3, 0 ; x/lift
  ; sci/layout.e16.ts:177  let i = from
  ; sci/layout.e16.ts:178  while (i < to) {
  j .L13
.L11:
  ; sci/layout.e16.ts:179  const t = tokenAt(i)
  mv a0, s2
  call tokenAt
  sw a0, 2(sp) ; t
  ; sci/layout.e16.ts:180  lift = t === T_POWT ? lift + 4 : 0
  li t0, 26
  lw t1, 2(sp) ; t
  bne t1, t0, .L15
  addi t0, s3, 4
  j .L16
.L15:
  li t0, 0
.L16:
  mv s3, t0 ; x/lift
  ; sci/layout.e16.ts:181  at = drawItem(i, at, foot - lift)
  sub a2, s0, s3
  mv a0, s2
  mv a1, s1
  call drawItem
  mv s1, a0 ; k/at
  ; sci/layout.e16.ts:182  i = opensTemplate(t) ? closeOf(i) + 1 : i + 1
  lw a0, 2(sp)
  call opensTemplate
  beqz a0, .L17
  mv a0, s2
  call closeOf
  addi t0, a0, 1
  j .L18
.L17:
  addi t0, s2, 1
.L18:
  mv s2, t0 ; from/i
  ; sci/layout.e16.ts:183  cursorAt(i, at, foot)
  mv a0, s2
  mv a1, s1
  mv a2, s0
  call cursorAt
.L13:
  lw t0, 0(sp) ; to
  bltu s2, t0, .L11
  ; sci/layout.e16.ts:185  return at
  mv a0, s1
.return:
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s0, 10(sp)
  lw s1, 12(sp)
  addi sp, sp, 14
  ret

; sci/layout.e16.ts:188 drawItem(i/text/p, x/at, foot) at -O1
;   i/text/p in s1
;   x/at in s2
;   foot in s0
;   t in s3
drawItem:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s0, 6(sp)
  sw s3, 8(sp)
  mv s1, a0 ; i/text/p
  mv s2, a1 ; x/at
  mv s0, a2 ; foot
  ; sci/layout.e16.ts:189  const t = tokenAt(i)
  mv a0, s1
  call tokenAt
  mv s3, a0 ; t
  ; sci/layout.e16.ts:190  if (t === T_FRAC) return drawFraction(i, x, foot)
  li t0, 22
  bne s3, t0, .L1
  ; sci/layout.e16.ts:190  return drawFraction(i, x, foot)
  mv a0, s1
  mv a1, s2
  mv a2, s0
  call drawFraction
  j .return
.L1:
  ; sci/layout.e16.ts:191  if (t === T_ROOT) return drawRoot(i, x, foot)
  li t0, 25
  bne s3, t0, .L2
  ; sci/layout.e16.ts:191  return drawRoot(i, x, foot)
  mv a0, s1
  mv a1, s2
  mv a2, s0
  call drawRoot
  j .return
.L2:
  ; sci/layout.e16.ts:192  if (t === T_POWT) return drawSeq(i + 1, closeOf(i), x, foot - 4) + 1
  li t0, 26
  bne s3, t0, .L3
  ; sci/layout.e16.ts:192  return drawSeq(i + 1, closeOf(i), x, foot - 4) + 1
  mv a0, s1
  call closeOf
  mv a1, a0
  addi a0, s1, 1
  mv a2, s2
  addi a3, s0, -4
  call drawSeq
  addi a0, a0, 1
  j .return
.L3:
  ; sci/layout.e16.ts:193  const text = t < 0x20 ? tokenText(t) : 0
  li t0, 32
  bgeu s3, t0, .L4
  mv a0, s3
  call tokenText
  mv t0, a0
  j .L5
.L4:
  li t0, 0
.L5:
  mv s1, t0 ; i/text/p
  ; sci/layout.e16.ts:194  if (text === 0) {
  bne s1, zero, .L6
  ; sci/layout.e16.ts:195  char(t, x, foot - 7)
  mv a0, s3
  mv a1, s2
  addi a2, s0, -7
  call char
  ; sci/layout.e16.ts:196  return x + 6
  addi a0, s2, 6
  j .return
.L6:
  ; sci/layout.e16.ts:198  let at = x
  ; sci/layout.e16.ts:199  let p = text
  ; sci/layout.e16.ts:200  while (peek(p) !== 0) {
  j .L9
.L7:
  ; sci/layout.e16.ts:201  char(peek(p), at, foot - 7)
  lbu a0, 0(s1)
  mv a1, s2
  addi a2, s0, -7
  call char
  ; sci/layout.e16.ts:202  at += 6
  addi s2, s2, 6
  ; sci/layout.e16.ts:203  p++
  addi s1, s1, 1
.L9:
  lbu t0, 0(s1)
  bne t0, zero, .L7
  ; sci/layout.e16.ts:205  return at
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s0, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/layout.e16.ts:209 drawFraction(i, x, foot/bar) at -O1
;   i in s3
;   x in s1
;   foot/bar in s2
;   sep in s0
;   end in 2(sp)
;   wa in 4(sp)
;   da in 8(sp)
;   wb in 6(sp)
;   ub in 10(sp)
;   w in 0(sp)
drawFraction:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s3, 14(sp)
  sw s1, 16(sp)
  sw s2, 18(sp)
  sw s0, 20(sp)
  mv s3, a0 ; i
  mv s1, a1 ; x
  mv s2, a2 ; foot/bar
  ; sci/layout.e16.ts:210  const sep = sepFrom(i)
  mv a0, s3
  call sepFrom
  mv s0, a0 ; sep
  ; sci/layout.e16.ts:211  const end = closeOf(i)
  mv a0, s3
  call closeOf
  sw a0, 2(sp) ; end
  ; sci/layout.e16.ts:212  const wa = measureSeq(i + 1, sep)
  addi a0, s3, 1
  mv a1, s0
  call measureSeq
  sw a0, 4(sp) ; wa
  ; sci/layout.e16.ts:213  const da = boxDown
  lw t0, 0x0684(zero)
  sw t0, 8(sp) ; da
  ; sci/layout.e16.ts:214  const wb = measureSeq(sep + 1, end)
  addi a0, s0, 1
  lw a1, 2(sp)
  call measureSeq
  sw a0, 6(sp) ; wb
  ; sci/layout.e16.ts:215  const ub = boxUp
  lw t0, 0x0682(zero)
  sw t0, 10(sp) ; ub
  ; sci/layout.e16.ts:216  const w = wider(wa, wb) + 6
  lw a0, 4(sp)
  lw a1, 6(sp)
  call wider
  addi t0, a0, 6
  sw t0, 0(sp) ; w
  ; sci/layout.e16.ts:217  const bar = foot - MID
  addi s2, s2, -4
  ; sci/layout.e16.ts:218  hline(x + 1, x + w - 3, bar)
  lw t0, 0(sp) ; w
  add t0, s1, t0
  addi a0, s1, 1
  addi a1, t0, -3
  mv a2, s2
  call hline
  ; sci/layout.e16.ts:219  drawSeq(i + 1, sep, x + ((w - wa) >> 1), bar - 2 - da)
  lw t0, 4(sp) ; wa
  lw t1, 0(sp) ; w
  sub t1, t1, t0
  srli t1, t1, 1
  add a2, s1, t1
  lw t0, 8(sp) ; da
  addi t2, s2, -2
  sub a3, t2, t0
  addi a0, s3, 1
  mv a1, s0
  call drawSeq
  ; sci/layout.e16.ts:220  drawSeq(sep + 1, end, x + ((w - wb) >> 1), bar + 2 + ub)
  lw t0, 6(sp) ; wb
  lw t1, 0(sp) ; w
  sub t1, t1, t0
  srli t1, t1, 1
  add a2, s1, t1
  lw t0, 10(sp) ; ub
  addi t2, s2, 2
  add a3, t2, t0
  addi a0, s0, 1
  lw a1, 2(sp)
  call drawSeq
  ; sci/layout.e16.ts:221  return x + w
  lw t0, 0(sp) ; w
  add a0, s1, t0
.return:
  lw ra, 12(sp)
  lw s3, 14(sp)
  lw s1, 16(sp)
  lw s2, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; sci/layout.e16.ts:225 drawRoot(i, x, foot) at -O1
;   i in s0
;   x in s1
;   foot in s2
;   end in 2(sp)
;   wa in 4(sp)
;   top in 0(sp)
;   half in 6(sp)
;   y in s3
drawRoot:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s0, 10(sp)
  sw s1, 12(sp)
  sw s2, 14(sp)
  sw s3, 16(sp)
  mv s0, a0 ; i
  mv s1, a1 ; x
  mv s2, a2 ; foot
  ; sci/layout.e16.ts:226  const end = closeOf(i)
  mv a0, s0
  call closeOf
  sw a0, 2(sp) ; end
  ; sci/layout.e16.ts:227  const wa = measureSeq(i + 1, end)
  addi a0, s0, 1
  lw a1, 2(sp)
  call measureSeq
  sw a0, 4(sp) ; wa
  ; sci/layout.e16.ts:228  const top = foot - boxUp - 2
  lw t0, 0x0682(zero)
  sub t0, s2, t0
  addi t0, t0, -2
  sw t0, 0(sp) ; top
  ; sci/layout.e16.ts:229  plot(x, foot - 4)
  mv a0, s1
  addi a1, s2, -4
  call plot
  ; sci/layout.e16.ts:230  plot(x + 1, foot - 3)
  addi a0, s1, 1
  addi a1, s2, -3
  call plot
  ; sci/layout.e16.ts:231  plot(x + 1, foot - 2)
  addi a0, s1, 1
  addi a1, s2, -2
  call plot
  ; sci/layout.e16.ts:232  plot(x + 2, foot - 1)
  addi a0, s1, 2
  addi a1, s2, -1
  call plot
  ; sci/layout.e16.ts:233  const half = (foot - top) >> 1
  lw t0, 0(sp) ; top
  sub t0, s2, t0
  srli t0, t0, 1
  sw t0, 6(sp) ; half
  ; sci/layout.e16.ts:234  for (let y = top; y < foot; y++) plot(foot - y > half ? x + 3 : x + 4, y)
  lw s3, 0(sp) ; top
  j .L3
.L1:
  ; sci/layout.e16.ts:234  plot(foot - y > half ? x + 3 : x + 4, y)
  sub t0, s2, s3
  lw t1, 6(sp) ; half
  bgeu t1, t0, .L5
  addi t0, s1, 3
  j .L6
.L5:
  addi t0, s1, 4
.L6:
  mv a0, t0
  mv a1, s3
  call plot
  addi s3, s3, 1
.L3:
  bltu s3, s2, .L1
  ; sci/layout.e16.ts:235  hline(x + 4, x + 4 + wa, top)
  lw t0, 4(sp) ; wa
  addi t1, s1, 4
  add a1, t1, t0
  addi a0, s1, 4
  lw a2, 0(sp)
  call hline
  ; sci/layout.e16.ts:236  drawSeq(i + 1, end, x + 5, foot)
  addi a0, s0, 1
  lw a1, 2(sp)
  addi a2, s1, 5
  mv a3, s2
  call drawSeq
  ; sci/layout.e16.ts:237  return x + wa + 6
  lw t0, 4(sp) ; wa
  add t0, s1, t0
  addi a0, t0, 6
.return:
  lw ra, 8(sp)
  lw s0, 10(sp)
  lw s1, 12(sp)
  lw s2, 14(sp)
  lw s3, 16(sp)
  addi sp, sp, 18
  ret

; sci/layout.e16.ts:243 heightOf(at, length) at -O1
;   at in s2
;   length in s1
heightOf:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; at
  mv s1, a1 ; length
  ; sci/layout.e16.ts:244  buf = at
  sw s2, 0x0674(zero)
  ; sci/layout.e16.ts:245  bufLength = length
  sw s1, 0x0676(zero)
  ; sci/layout.e16.ts:246  measureSeq(0, length)
  li a0, 0
  mv a1, s1
  call measureSeq
  ; sci/layout.e16.ts:247  return boxUp + boxDown
  lw t0, 0x0682(zero)
  lw t1, 0x0684(zero)
  add a0, t0, t1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/layout.e16.ts:254 setLine(at/foot, length, cursor) at -O1
;   at/foot in s1
;   length in s2
;   cursor in s3
setLine:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; at/foot
  mv s2, a1 ; length
  mv s3, a2 ; cursor
  ; sci/layout.e16.ts:255  buf = at
  sw s1, 0x0674(zero)
  ; sci/layout.e16.ts:256  bufLength = length
  sw s2, 0x0676(zero)
  ; sci/layout.e16.ts:257  measureSeq(0, length)
  li a0, 0
  mv a1, s2
  call measureSeq
  ; sci/layout.e16.ts:258  const foot = 2 + (boxUp > 7 ? boxUp : 7)
  lw t1, 0x0682(zero)
  li t0, 2
  li t2, 7
  bgeu t2, t1, .L1
  lw t1, 0x0682(zero)
  j .L2
.L1:
  li t1, 7
.L2:
  add s1, t0, t1
  ; sci/layout.e16.ts:259  cursorIndex = cursor
  sw s3, 0x067c(zero)
  ; sci/layout.e16.ts:260  slide = 0
  sw zero, 0x0678(zero)
  ; sci/layout.e16.ts:261  ink = false
  sw zero, 0x067a(zero)
  ; sci/layout.e16.ts:262  drawSeq(0, length, 1, foot)
  li a0, 0
  mv a1, s2
  li a2, 1
  mv a3, s1
  call drawSeq
  ; sci/layout.e16.ts:263  if (cursorX > 124) slide = cursorX - 124
  lw t0, 0x067e(zero)
  li t1, 124
  bgeu t1, t0, .L3
  ; sci/layout.e16.ts:263  slide = cursorX - 124
  lw t0, 0x067e(zero)
  addi t0, t0, -124
  sw t0, 0x0678(zero)
.L3:
  ; sci/layout.e16.ts:264  ink = true
  li t0, 1
  sw t0, 0x067a(zero)
  ; sci/layout.e16.ts:265  drawSeq(0, length, 1, foot)
  li a0, 0
  mv a1, s2
  li a2, 1
  mv a3, s1
  call drawSeq
  ; sci/layout.e16.ts:266  if (cursorX >= slide) cursorX -= slide
  lw t0, 0x067e(zero)
  lw t1, 0x0678(zero)
  bltu t0, t1, .L4
  ; sci/layout.e16.ts:266  cursorX -= slide
  lw t0, 0x067e(zero)
  lw t1, 0x0678(zero)
  sub t0, t0, t1
  sw t0, 0x067e(zero)
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/layout.e16.ts:270 setAnswer(at/w, length) at -O1
;   at/w in s1
;   length in s2
;   foot in s3
setAnswer:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; at/w
  mv s2, a1 ; length
  ; sci/layout.e16.ts:271  buf = at
  sw s1, 0x0674(zero)
  ; sci/layout.e16.ts:272  bufLength = length
  sw s2, 0x0676(zero)
  ; sci/layout.e16.ts:273  const w = measureSeq(0, length)
  li a0, 0
  mv a1, s2
  call measureSeq
  mv s1, a0 ; at/w
  ; sci/layout.e16.ts:274  const foot = 62 - boxDown
  lw t0, 0x0684(zero)
  li t1, 62
  sub s3, t1, t0
  ; sci/layout.e16.ts:275  cursorIndex = 0xffff
  li t0, 65535
  sw t0, 0x067c(zero)
  ; sci/layout.e16.ts:276  slide = 0
  sw zero, 0x0678(zero)
  ; sci/layout.e16.ts:277  ink = true
  li t0, 1
  sw t0, 0x067a(zero)
  ; sci/layout.e16.ts:278  drawSeq(0, length, 128 - w, foot)
  li t0, 128
  sub a2, t0, s1
  li a0, 0
  mv a1, s2
  mv a3, s3
  call drawSeq
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

  .align 2

  .bank 4
  .org 0xc000
; sci/edit.e16.ts:33 openerOf(buf, end/j) at -O1
;   buf in s0
;   end/j in s1
;   depth in s2
;   t in s3
openerOf:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s0, a0 ; buf
  mv s1, a1 ; end/j
  ; sci/edit.e16.ts:34  let depth: u16 = 0
  li s2, 0 ; depth
  ; sci/edit.e16.ts:35  let j = end + 1
  addi s1, s1, 1
  ; sci/edit.e16.ts:36  while (j > 0) {
  j .L3
.L1:
  ; sci/edit.e16.ts:37  j--
  addi s1, s1, -1
  ; sci/edit.e16.ts:38  const t = peek(buf + j)
  add t0, s0, s1
  lbu s3, 0(t0)
  ; sci/edit.e16.ts:39  if (t === T_END) depth++
  li t0, 24
  bne s3, t0, .L5
  ; sci/edit.e16.ts:39  depth++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/edit.e16.ts:40  if (opensTemplate(t)) {
  mv a0, s3
  call opensTemplate
  beqz a0, .L7
  ; sci/edit.e16.ts:41  depth--
  addi s2, s2, -1
  ; sci/edit.e16.ts:42  if (depth === 0) return j
  bne s2, zero, .L8
  ; sci/edit.e16.ts:42  return j
  mv a0, s1
  j .return
.L8:
.L7:
.L6:
.L3:
  bltu zero, s1, .L1
  ; sci/edit.e16.ts:45  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/edit.e16.ts:49 bracketOf(buf, close) at -O1
;   buf in 0(sp)
;   close in s0
;   depth in s1
;   j in s2
;   t in s3
bracketOf:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw a0, 0(sp) ; buf
  mv s0, a1 ; close
  ; sci/edit.e16.ts:50  let depth: u16 = 0
  li s1, 0 ; depth
  ; sci/edit.e16.ts:51  let j = close + 1
  addi s2, s0, 1
  ; sci/edit.e16.ts:52  while (j > 0) {
  j .L3
.L1:
  ; sci/edit.e16.ts:53  j--
  addi s2, s2, -1
  ; sci/edit.e16.ts:54  const t = peek(buf + j)
  lw t0, 0(sp) ; buf
  add t0, t0, s2
  lbu s3, 0(t0)
  ; sci/edit.e16.ts:55  if (t === T_CLOSE) depth++
  li t0, 41
  bne s3, t0, .L5
  ; sci/edit.e16.ts:55  depth++
  addi s1, s1, 1
  j .L6
.L5:
  ; sci/edit.e16.ts:56  if (t === T_OPEN || isFunction(t)) {
  li t0, 40
  beq s3, t0, .L8
  mv a0, s3
  call isFunction
  beqz a0, .L7
.L8:
  ; sci/edit.e16.ts:57  depth--
  addi s1, s1, -1
  ; sci/edit.e16.ts:58  if (depth === 0) return j
  bne s1, zero, .L9
  ; sci/edit.e16.ts:58  return j
  mv a0, s2
  j .return
.L9:
.L7:
.L6:
.L3:
  bltu zero, s2, .L1
  ; sci/edit.e16.ts:61  return close
  mv a0, s0
.return:
  lw ra, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  addi sp, sp, 12
  ret

; sci/edit.e16.ts:66 operandStart(buf/open, cur) at -O1
;   buf/open in s2
;   cur in s0
;   j in s1
;   t in s3
operandStart:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  mv s2, a0 ; buf/open
  mv s0, a1 ; cur
  ; sci/edit.e16.ts:67  let j = pastPostfixes(buf, cur)
  mv a0, s2
  mv a1, s0
  call pastPostfixes
  mv s1, a0 ; j
  ; sci/edit.e16.ts:68  if (j === 0) return cur
  bne s1, zero, .L1
  ; sci/edit.e16.ts:68  return cur
  mv a0, s0
  j .return
.L1:
  ; sci/edit.e16.ts:69  const t = peek(buf + j - 1)
  add t0, s2, s1
  lbu s3, -1(t0)
  ; sci/edit.e16.ts:70  if (isDigit(t) || t === T_POINT) {
  mv a0, s3
  call isDigit
  bnez a0, .L6
  li t0, 46
  bne s3, t0, .L2
  ; sci/edit.e16.ts:71  while (j > 0 && (isDigit(peek(buf + j - 1)) || peek(buf + j - 1) === T_POINT)) j--
  j .L6
.L4:
  ; sci/edit.e16.ts:71  j--
  addi s1, s1, -1
.L6:
  bgeu zero, s1, .L8
  add t0, s2, s1
  lbu a0, -1(t0)
  call isDigit
  bnez a0, .L4
  add t0, s2, s1
  lbu t0, -1(t0)
  li t1, 46
  beq t0, t1, .L4
.L8:
  ; sci/edit.e16.ts:72  return j
  mv a0, s1
  j .return
.L2:
  ; sci/edit.e16.ts:74  if (t === T_PI || t === T_E || t === T_ANS || t === T_TEN || isVariable(t)) return j - 1
  li t0, 128
  beq s3, t0, .L10
  li t0, 101
  beq s3, t0, .L10
  li t0, 20
  beq s3, t0, .L10
  li t0, 21
  beq s3, t0, .L10
  mv a0, s3
  call isVariable
  beqz a0, .L9
.L10:
  ; sci/edit.e16.ts:74  return j - 1
  addi a0, s1, -1
  j .return
.L9:
  ; sci/edit.e16.ts:75  if (t === T_END) return openerOf(buf, j - 1)
  li t0, 24
  bne s3, t0, .L11
  ; sci/edit.e16.ts:75  return openerOf(buf, j - 1)
  mv a0, s2
  addi a1, s1, -1
  call openerOf
  j .return
.L11:
  ; sci/edit.e16.ts:76  if (t === T_CLOSE) {
  li t0, 41
  bne s3, t0, .L12
  ; sci/edit.e16.ts:77  const open = bracketOf(buf, j - 1)
  mv a0, s2
  addi a1, s1, -1
  call bracketOf
  mv s2, a0 ; buf/open
  ; sci/edit.e16.ts:78  return open === j - 1 ? cur : open
  addi t0, s1, -1
  bne s2, t0, .L13
  mv t0, s0
  j .L14
.L13:
  mv t0, s2
.L14:
  mv a0, t0
  j .return
.L12:
  ; sci/edit.e16.ts:80  return cur
  mv a0, s0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/edit.e16.ts:84 pastPostfixes(buf, cur/j) at -O1
;   buf in s3
;   cur/j in s1
;   t in s2
pastPostfixes:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; buf
  mv s1, a1 ; cur/j
  ; sci/edit.e16.ts:85  let j = cur
  ; sci/edit.e16.ts:86  while (j > 0) {
  j .L3
.L1:
  ; sci/edit.e16.ts:87  const t = peek(buf + j - 1)
  add t0, s3, s1
  lbu s2, -1(t0)
  ; sci/edit.e16.ts:88  if (t === T_SQUARE || t === T_CUBE || t === T_INVERSE || t === T_BANG) j--
  li t0, 132
  beq s2, t0, .L6
  li t0, 133
  beq s2, t0, .L6
  li t0, 134
  beq s2, t0, .L6
  li t0, 33
  bne s2, t0, .L5
.L6:
  ; sci/edit.e16.ts:88  j--
  addi s1, s1, -1
  j .L7
.L5:
  ; sci/edit.e16.ts:89  if (t === T_END && peek(buf + openerOf(buf, j - 1)) === T_POWT) j = openerOf(buf, j - 1)
  li t0, 24
  bne s2, t0, .L8
  mv a0, s3
  addi a1, s1, -1
  call openerOf
  add t0, s3, a0
  lbu t0, 0(t0)
  li t1, 26
  bne t0, t1, .L8
  ; sci/edit.e16.ts:89  j = openerOf(buf, j - 1)
  mv a0, s3
  addi a1, s1, -1
  call openerOf
  mv s1, a0 ; cur/j
  j .L9
.L8:
  ; sci/edit.e16.ts:90  return j
  mv a0, s1
  j .return
.L9:
.L7:
.L3:
  bltu zero, s1, .L1
  ; sci/edit.e16.ts:92  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/edit.e16.ts:99 fraction(buf, length, cur) at -O1
;   buf in s2
;   length in s0
;   cur in s1
;   start in s3
fraction:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  mv s2, a0 ; buf
  mv s0, a1 ; length
  mv s1, a2 ; cur
  ; sci/edit.e16.ts:100  const start = operandStart(buf, cur)
  mv a0, s2
  mv a1, s1
  call operandStart
  mv s3, a0 ; start
  ; sci/edit.e16.ts:102  memcpy(buf + cur + 3, buf + cur, length - cur)
  add t0, s2, s1
  add a1, s2, s1
  sub a2, s0, s1
  addi a0, t0, 3
  mcpy a0, a1, a2
  ; sci/edit.e16.ts:103  memcpy(buf + start + 1, buf + start, cur - start)
  add t0, s2, s3
  add a1, s2, s3
  sub a2, s1, s3
  addi a0, t0, 1
  mcpy a0, a1, a2
  ; sci/edit.e16.ts:104  poke(buf + start, T_FRAC)
  add t0, s2, s3
  li t1, 22
  sb t1, 0(t0)
  ; sci/edit.e16.ts:105  poke(buf + cur + 1, T_SEP)
  add t0, s2, s1
  li t1, 23
  sb t1, 1(t0)
  ; sci/edit.e16.ts:106  poke(buf + cur + 2, T_END)
  add t0, s2, s1
  li t1, 24
  sb t1, 2(t0)
  ; sci/edit.e16.ts:107  editLength = length + 3
  addi t0, s0, 3
  sw t0, 0x0686(zero)
  ; sci/edit.e16.ts:108  editCursor = start === cur ? start + 1 : cur + 2
  bne s3, s1, .L1
  addi t0, s3, 1
  j .L2
.L1:
  addi t0, s1, 2
.L2:
  sw t0, 0x0688(zero)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/edit.e16.ts:112 empty(buf, open) at -O1
;   buf in a0
;   open in a1
;   next in a2
empty:
  ; sci/edit.e16.ts:113  const next = peek(buf + open + 1)
  add t0, a0, a1
  lbu a2, 1(t0)
  ; sci/edit.e16.ts:114  if (peek(buf + open) === T_FRAC) return next === T_SEP && peek(buf + open + 2) === T_END
  add t0, a0, a1
  lbu t0, 0(t0)
  li t1, 22
  bne t0, t1, .L1
  ; sci/edit.e16.ts:114  return next === T_SEP && peek(buf + open + 2) === T_END
  li t0, 23
  sub t0, a2, t0
  seqz t0, t0
  mv t1, t0
  beqz t1, .L2
  add t0, a0, a1
  lbu t0, 2(t0)
  li t1, 24
  sub t0, t0, t1
  seqz t0, t0
.L2:
  mv a0, t0
  ret
.L1:
  ; sci/edit.e16.ts:115  return next === T_END
  li t0, 24
  sub t0, a2, t0
  seqz a0, t0
.return:
  ret

; sci/edit.e16.ts:122 deleteAt(buf, length, cur/size) at -O1
;   buf in s3
;   length in s0
;   cur/size in s1
;   t in 0(sp)
;   open in s2
deleteAt:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  mv s3, a0 ; buf
  mv s0, a1 ; length
  mv s1, a2 ; cur/size
  ; sci/edit.e16.ts:123  editLength = length
  sw s0, 0x0686(zero)
  ; sci/edit.e16.ts:124  editCursor = cur
  sw s1, 0x0688(zero)
  ; sci/edit.e16.ts:125  if (cur === 0) return
  bne s1, zero, .L1
  ; sci/edit.e16.ts:125  return
  j .return
.L1:
  ; sci/edit.e16.ts:126  const t = peek(buf + cur - 1)
  add t0, s3, s1
  lbu t0, -1(t0)
  sw t0, 0(sp) ; t
  ; sci/edit.e16.ts:127  let open: u16 = 0xffff
  li s2, 65535 ; open
  ; sci/edit.e16.ts:128  if (opensTemplate(t)) open = cur - 1
  lw a0, 0(sp)
  call opensTemplate
  beqz a0, .L2
  ; sci/edit.e16.ts:128  open = cur - 1
  addi s2, s1, -1
  j .L3
.L2:
  ; sci/edit.e16.ts:129  if (t === T_SEP) open = fractionOf(buf, cur - 1)
  li t0, 23
  lw t1, 0(sp) ; t
  bne t1, t0, .L4
  ; sci/edit.e16.ts:129  open = fractionOf(buf, cur - 1)
  mv a0, s3
  addi a1, s1, -1
  call fractionOf
  mv s2, a0 ; open
  j .L5
.L4:
  ; sci/edit.e16.ts:130  if (t === T_END) {
  li t0, 24
  lw t1, 0(sp) ; t
  bne t1, t0, .L6
  ; sci/edit.e16.ts:131  editCursor = cur - 1
  addi t0, s1, -1
  sw t0, 0x0688(zero)
  ; sci/edit.e16.ts:132  return
  j .return
.L6:
.L5:
.L3:
  ; sci/edit.e16.ts:134  if (open === 0xffff) {
  li t0, 65535
  bne s2, t0, .L7
  ; sci/edit.e16.ts:135  memcpy(buf + cur - 1, buf + cur, length - cur)
  add t0, s3, s1
  add a1, s3, s1
  sub a2, s0, s1
  addi a0, t0, -1
  mcpy a0, a1, a2
  ; sci/edit.e16.ts:136  editLength = length - 1
  addi t0, s0, -1
  sw t0, 0x0686(zero)
  ; sci/edit.e16.ts:137  editCursor = cur - 1
  addi t0, s1, -1
  sw t0, 0x0688(zero)
  ; sci/edit.e16.ts:138  return
  j .return
.L7:
  ; sci/edit.e16.ts:140  if (!empty(buf, open)) {
  mv a0, s3
  mv a1, s2
  call empty
  bnez a0, .L8
  ; sci/edit.e16.ts:141  editCursor = cur - 1
  addi t0, s1, -1
  sw t0, 0x0688(zero)
  ; sci/edit.e16.ts:142  return
  j .return
.L8:
  ; sci/edit.e16.ts:144  const size: u16 = peek(buf + open) === T_FRAC ? 3 : 2
  add t0, s3, s2
  lbu t0, 0(t0)
  li t1, 22
  bne t0, t1, .L9
  li t0, 3
  j .L10
.L9:
  li t0, 2
.L10:
  mv s1, t0 ; cur/size
  ; sci/edit.e16.ts:145  memcpy(buf + open, buf + open + size, length - open - size)
  add a0, s3, s2
  add t1, s3, s2
  add a1, t1, s1
  sub t2, s0, s2
  sub a2, t2, s1
  mcpy a0, a1, a2
  ; sci/edit.e16.ts:146  editLength = length - size
  sub t0, s0, s1
  sw t0, 0x0686(zero)
  ; sci/edit.e16.ts:147  editCursor = open
  sw s2, 0x0688(zero)
.return:
  lw ra, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  addi sp, sp, 12
  ret

; sci/edit.e16.ts:151 fractionOf(buf, sep/j) at -O1
;   buf in s0
;   sep/j in s1
;   depth in s2
;   t in s3
fractionOf:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s0, a0 ; buf
  mv s1, a1 ; sep/j
  ; sci/edit.e16.ts:152  let depth: u16 = 0
  li s2, 0 ; depth
  ; sci/edit.e16.ts:153  let j = sep
  ; sci/edit.e16.ts:154  while (j > 0) {
  j .L3
.L1:
  ; sci/edit.e16.ts:155  j--
  addi s1, s1, -1
  ; sci/edit.e16.ts:156  const t = peek(buf + j)
  add t0, s0, s1
  lbu s3, 0(t0)
  ; sci/edit.e16.ts:157  if (t === T_END) depth++
  li t0, 24
  bne s3, t0, .L5
  ; sci/edit.e16.ts:157  depth++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/edit.e16.ts:158  if (opensTemplate(t)) {
  mv a0, s3
  call opensTemplate
  beqz a0, .L7
  ; sci/edit.e16.ts:159  if (depth === 0) return j
  bne s2, zero, .L8
  ; sci/edit.e16.ts:159  return j
  mv a0, s1
  j .return
.L8:
  ; sci/edit.e16.ts:160  depth--
  addi s2, s2, -1
.L7:
.L6:
.L3:
  bltu zero, s1, .L1
  ; sci/edit.e16.ts:163  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/edit.e16.ts:167 sepAfter(buf, length, open/j) at -O1
;   buf in 0(sp)
;   length in s0
;   open/j in s1
;   depth in s2
;   t in s3
sepAfter:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw a0, 0(sp) ; buf
  mv s0, a1 ; length
  mv s1, a2 ; open/j
  ; sci/edit.e16.ts:168  let depth: u16 = 0
  li s2, 0 ; depth
  ; sci/edit.e16.ts:169  for (let j = open; j < length; j++) {
  j .L3
.L1:
  ; sci/edit.e16.ts:170  const t = peek(buf + j)
  lw t0, 0(sp) ; buf
  add t0, t0, s1
  lbu s3, 0(t0)
  ; sci/edit.e16.ts:171  if (opensTemplate(t)) depth++
  mv a0, s3
  call opensTemplate
  beqz a0, .L5
  ; sci/edit.e16.ts:171  depth++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/edit.e16.ts:172  if (t === T_END) depth--
  li t0, 24
  bne s3, t0, .L7
  ; sci/edit.e16.ts:172  depth--
  addi s2, s2, -1
  j .L8
.L7:
  ; sci/edit.e16.ts:173  if (t === T_SEP && depth === 1) return j
  li t0, 23
  bne s3, t0, .L9
  li t0, 1
  bne s2, t0, .L9
  ; sci/edit.e16.ts:173  return j
  mv a0, s1
  j .return
.L9:
.L8:
.L6:
  addi s1, s1, 1
.L3:
  bltu s1, s0, .L1
  ; sci/edit.e16.ts:175  return length
  mv a0, s0
.return:
  lw ra, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  addi sp, sp, 12
  ret

; sci/edit.e16.ts:179 endAfter(buf, length, sep/j) at -O1
;   buf in 0(sp)
;   length in s3
;   sep/j in s1
;   depth in s2
;   t in s0
endAfter:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s0, 10(sp)
  sw a0, 0(sp) ; buf
  mv s3, a1 ; length
  mv s1, a2 ; sep/j
  ; sci/edit.e16.ts:180  let depth: u16 = 0
  li s2, 0 ; depth
  ; sci/edit.e16.ts:181  for (let j = sep + 1; j < length; j++) {
  addi s1, s1, 1
  j .L3
.L1:
  ; sci/edit.e16.ts:182  const t = peek(buf + j)
  lw t0, 0(sp) ; buf
  add t0, t0, s1
  lbu s0, 0(t0)
  ; sci/edit.e16.ts:183  if (opensTemplate(t)) depth++
  mv a0, s0
  call opensTemplate
  beqz a0, .L5
  ; sci/edit.e16.ts:183  depth++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/edit.e16.ts:184  if (t === T_END) {
  li t0, 24
  bne s0, t0, .L7
  ; sci/edit.e16.ts:185  if (depth === 0) return j
  bne s2, zero, .L8
  ; sci/edit.e16.ts:185  return j
  mv a0, s1
  j .return
.L8:
  ; sci/edit.e16.ts:186  depth--
  addi s2, s2, -1
.L7:
.L6:
  addi s1, s1, 1
.L3:
  bltu s1, s3, .L1
  ; sci/edit.e16.ts:189  return length
  mv a0, s3
.return:
  lw ra, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s0, 10(sp)
  addi sp, sp, 12
  ret

; sci/edit.e16.ts:197 vertical(buf, length, cur/j, up) at -O1
;   buf in s2
;   length in s3
;   cur/j in s1
;   up in s0
vertical:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  sw s0, 8(sp)
  mv s2, a0 ; buf
  mv s3, a1 ; length
  mv s1, a2 ; cur/j
  mv s0, a3 ; up
  ; sci/edit.e16.ts:198  editLength = length
  sw s3, 0x0686(zero)
  ; sci/edit.e16.ts:199  editCursor = 0xffff
  li t0, 65535
  sw t0, 0x0688(zero)
  ; sci/edit.e16.ts:200  const j = partOf(buf, cur)
  mv a0, s2
  mv a1, s1
  call partOf
  mv s1, a0 ; cur/j
  ; sci/edit.e16.ts:201  if (j === 0xffff) return
  li t0, 65535
  bne s1, t0, .L1
  ; sci/edit.e16.ts:201  return
  j .return
.L1:
  ; sci/edit.e16.ts:204  if (peek(buf + j) === T_FRAC) {
  add t0, s2, s1
  lbu t0, 0(t0)
  li t1, 22
  bne t0, t1, .L2
  ; sci/edit.e16.ts:205  if (!up) editCursor = endAfter(buf, length, sepAfter(buf, length, j))
  bnez s0, .L4
  ; sci/edit.e16.ts:205  editCursor = endAfter(buf, length, sepAfter(buf, length, j))
  mv a0, s2
  mv a1, s3
  mv a2, s1
  call sepAfter
  mv a1, s3
  mv a2, a0
  mv a0, s2
  call endAfter
  sw a0, 0x0688(zero)
  j .L4
.L2:
  ; sci/edit.e16.ts:206  if (up) editCursor = j
  beqz s0, .L5
  ; sci/edit.e16.ts:206  editCursor = j
  sw s1, 0x0688(zero)
.L5:
.L4:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/edit.e16.ts:210 partOf(buf, cur/j) at -O1
;   buf in s0
;   cur/j in s1
;   depth in s2
;   t in s3
partOf:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s0, a0 ; buf
  mv s1, a1 ; cur/j
  ; sci/edit.e16.ts:211  let depth: u16 = 0
  li s2, 0 ; depth
  ; sci/edit.e16.ts:212  let j = cur
  ; sci/edit.e16.ts:213  while (j > 0) {
  j .L3
.L1:
  ; sci/edit.e16.ts:214  j--
  addi s1, s1, -1
  ; sci/edit.e16.ts:215  const t = peek(buf + j)
  add t0, s0, s1
  lbu s3, 0(t0)
  ; sci/edit.e16.ts:216  if (t === T_END) depth++
  li t0, 24
  bne s3, t0, .L5
  ; sci/edit.e16.ts:216  depth++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/edit.e16.ts:217  if (opensTemplate(t)) {
  mv a0, s3
  call opensTemplate
  beqz a0, .L7
  ; sci/edit.e16.ts:218  if (depth > 0) depth--
  bgeu zero, s2, .L8
  ; sci/edit.e16.ts:218  depth--
  addi s2, s2, -1
  j .L11
.L8:
  ; sci/edit.e16.ts:219  if (t === T_FRAC) return j
  li t0, 22
  bne s3, t0, .L11
  ; sci/edit.e16.ts:219  return j
  mv a0, s1
  j .return
.L7:
  ; sci/edit.e16.ts:220  if (t === T_SEP && depth === 0) return j
  li t0, 23
  bne s3, t0, .L12
  bne s2, zero, .L12
  ; sci/edit.e16.ts:220  return j
  mv a0, s1
  j .return
.L12:
.L11:
.L6:
.L3:
  bltu zero, s1, .L1
  ; sci/edit.e16.ts:222  return 0xffff
  li a0, 65535
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

  .align 2
