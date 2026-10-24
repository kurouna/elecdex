; Made by e16c from sci/lcd.e16.ts, sci/tokens.e16.ts, sci/numbers.e16.ts, sci/calc.e16.ts, sci/eval.e16.ts, sci/screens.e16.ts, sci/exact.e16.ts, sci/layout.e16.ts, sci/edit.e16.ts, sci/display.e16.ts, sci/solve.e16.ts: do not edit.

; curX at 0x0100
; curY at 0x0102
; errCode at 0x0104
; errAt at 0x0106
; nsp at 0x0468
; screen at 0x048e
; length at 0x0558
; cursor at 0x055a
; answered at 0x055c
; shifted at 0x055e
; alphaOn at 0x0560
; storing at 0x0562
; recalling at 0x0564
; hyp at 0x0566
; found at 0x0568
; historyAt at 0x056a
; scrollFrom at 0x056c
; shown at 0x056e
; lineAt at 0x0570
; lineLength at 0x0572
; pos at 0x0574
; page at 0x05ba
; asking at 0x05bc
; smallAt at 0x0656
; buf at 0x0658
; bufLength at 0x065a
; slide at 0x065c
; ink at 0x065e
; cursorIndex at 0x0660
; cursorX at 0x0662
; cursorTop at 0x0664
; boxUp at 0x0666
; boxDown at 0x0668
; editLength at 0x066a
; editCursor at 0x066c
; textLength at 0x068e
; answerLength at 0x06e8
; askingAt at 0x06ea
; askingLength at 0x06ec
; finding at 0x06ee
; entryLength at 0x0718
nums = 0x0108 ; 864 bytes
diffValue = 0x046a ; 36 bytes
line = 0x0490 ; 200 bytes
numberText = 0x0576 ; 32 bytes
argument = 0x0596 ; 36 bytes
digitText = 0x05be ; 2 bytes
hexText = 0x05c0 ; 6 bytes
work = 0x05c6 ; 64 bytes
tmpA = 0x0606 ; 36 bytes
tmpB = 0x062a ; 36 bytes
one = 0x064e ; 8 bytes
text = 0x066e ; 32 bytes
scratch = 0x0690 ; 8 bytes
spare = 0x0698 ; 8 bytes
unit = 0x06a0 ; 8 bytes
degreePart = 0x06a8 ; 8 bytes
minutePart = 0x06b0 ; 8 bytes
answerTokens = 0x06b8 ; 48 bytes
entry = 0x06f0 ; 40 bytes
x = 0x071a ; 36 bytes
fx = 0x073e ; 36 bytes
step = 0x0762 ; 36 bytes
ahead = 0x0786 ; 36 bytes
small = 0x07aa ; 36 bytes
xText = 0x07ce ; 16 bytes

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
  sw zero, 0x048e(zero)
  ; length = 0
  sw zero, 0x0558(zero)
  ; cursor = 0
  sw zero, 0x055a(zero)
  ; answered = 0
  sw zero, 0x055c(zero)
  ; shifted = 0
  sw zero, 0x055e(zero)
  ; alphaOn = 0
  sw zero, 0x0560(zero)
  ; storing = 0
  sw zero, 0x0562(zero)
  ; recalling = 0
  sw zero, 0x0564(zero)
  ; hyp = 0
  sw zero, 0x0566(zero)
  ; found = 0
  sw zero, 0x0568(zero)
  ; historyAt = 65535
  li t0, 65535
  sw t0, 0x056a(zero)
  ; scrollFrom = 0
  sw zero, 0x056c(zero)
  ; shown = 0
  sw zero, 0x056e(zero)
  ; lineAt = 0
  sw zero, 0x0570(zero)
  ; lineLength = 0
  sw zero, 0x0572(zero)
  ; pos = 0
  sw zero, 0x0574(zero)
  ; page = 0
  sw zero, 0x05ba(zero)
  ; asking = 0
  sw zero, 0x05bc(zero)
  ; smallAt = 0
  sw zero, 0x0656(zero)
  ; buf = 0
  sw zero, 0x0658(zero)
  ; bufLength = 0
  sw zero, 0x065a(zero)
  ; slide = 0
  sw zero, 0x065c(zero)
  ; ink = 0
  sw zero, 0x065e(zero)
  ; cursorIndex = 65535
  li t0, 65535
  sw t0, 0x0660(zero)
  ; cursorX = 0
  sw zero, 0x0662(zero)
  ; cursorTop = 0
  sw zero, 0x0664(zero)
  ; boxUp = 0
  sw zero, 0x0666(zero)
  ; boxDown = 0
  sw zero, 0x0668(zero)
  ; editLength = 0
  sw zero, 0x066a(zero)
  ; editCursor = 0
  sw zero, 0x066c(zero)
  ; textLength = 0
  sw zero, 0x068e(zero)
  ; answerLength = 0
  sw zero, 0x06e8(zero)
  ; askingAt = 0
  sw zero, 0x06ea(zero)
  ; askingLength = 0
  sw zero, 0x06ec(zero)
  ; finding = 0
  sw zero, 0x06ee(zero)
  ; entryLength = 0
  sw zero, 0x0718(zero)
  ; nums: 864 bytes of 0
  li t0, 0x0108
  li t1, 864
  mset t0, zero, t1
  ; diffValue: 36 bytes of 0
  li t0, 0x046a
  li t1, 36
  mset t0, zero, t1
  ; line: 200 bytes of 0
  li t0, 0x0490
  li t1, 200
  mset t0, zero, t1
  ; numberText, argument: 68 bytes of 0
  li t0, 0x0576
  li t1, 68
  mset t0, zero, t1
  ; digitText, hexText, work, tmpA, tmpB, one: 152 bytes of 0
  li t0, 0x05be
  li t1, 152
  mset t0, zero, t1
  ; text: 32 bytes of 0
  li t0, 0x066e
  li t1, 32
  mset t0, zero, t1
  ; scratch, spare, unit, degreePart, minutePart, answerTokens: 88 bytes of 0
  li t0, 0x0690
  li t1, 88
  mset t0, zero, t1
  ; entry: 40 bytes of 0
  li t0, 0x06f0
  li t1, 40
  mset t0, zero, t1
  ; x, fx, step, ahead, small, xText: 196 bytes of 0
  li t0, 0x071a
  li t1, 196
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

; sci/tokens.e16.ts:99 opensTemplate(t) at -O1
;   t in a0
opensTemplate:
  ; sci/tokens.e16.ts:100  return t === T_FRAC || t === T_ROOT || t === T_POWT || t === T_MIXED || t === T_XROOT
  li t0, 22
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L4
  li t0, 25
  sub t0, a0, t0
  seqz t0, t0
.L4:
  mv t1, t0
  bnez t1, .L3
  li t0, 26
  sub t0, a0, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 28
  sub t0, a0, t0
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 30
  sub t0, a0, t0
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; sci/tokens.e16.ts:104 isSeparator(t) at -O1
;   t in a0
isSeparator:
  ; sci/tokens.e16.ts:105  return t === T_SEP || t === T_MSEP || t === T_MDIV || t === T_XSEP
  li t0, 23
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L3
  li t0, 29
  sub t0, a0, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 31
  sub t0, a0, t0
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 11
  sub t0, a0, t0
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; sci/tokens.e16.ts:109 isFunction(t) at -O1
;   t in a0
isFunction:
  ; sci/tokens.e16.ts:110  return (t >= T_SIN && t <= T_CBRT) || (t >= T_SINH && t <= T_REC)
  li t0, 1
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L2
  li t0, 10
  sltu t0, t0, a0
  xori t0, t0, 1
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 224
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L3
  li t0, 236
  sltu t0, t0, a0
  xori t0, t0, 1
.L3:
.L1:
  mv a0, t0
.return:
  ret

; sci/tokens.e16.ts:114 takesTwo(t) at -O1
;   t in a0
takesTwo:
  ; sci/tokens.e16.ts:115  return t === T_GCD || t === T_LCM || t === T_POL || t === T_REC
  li t0, 231
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L3
  li t0, 232
  sub t0, a0, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 235
  sub t0, a0, t0
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 236
  sub t0, a0, t0
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; sci/tokens.e16.ts:119 isVariable(t) at -O1
;   t in a0
isVariable:
  ; sci/tokens.e16.ts:120  return (t >= 0x41 && t <= 0x46) || t === 0x58 || t === 0x59 || t === 0x4d
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

; sci/tokens.e16.ts:123 isDigit(t) at -O1
;   t in a0
isDigit:
  ; sci/tokens.e16.ts:124  return t >= 0x30 && t <= 0x39
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

; sci/tokens.e16.ts:128 tokenText(t) at -O1
;   t in s1
tokenText:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/tokens.e16.ts:129  if (t >= T_SINH) return namedText(t)
  li t0, 224
  bltu s1, t0, .L1
  ; sci/tokens.e16.ts:129  return namedText(t)
  mv a0, s1
  call namedText
  j .return
.L1:
  ; sci/tokens.e16.ts:130  switch (t) {
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
  li t0, 6
  beq s1, t0, .L8
  li t0, 7
  beq s1, t0, .L9
  li t0, 8
  beq s1, t0, .L10
  li t0, 9
  beq s1, t0, .L11
  li t0, 10
  beq s1, t0, .L12
  li t0, 16
  beq s1, t0, .L13
  li t0, 17
  beq s1, t0, .L14
  li t0, 18
  beq s1, t0, .L15
  li t0, 19
  beq s1, t0, .L16
  li t0, 20
  beq s1, t0, .L17
  li t0, 21
  beq s1, t0, .L18
  li t0, 22
  beq s1, t0, .L19
  li t0, 23
  beq s1, t0, .L20
  li t0, 24
  beq s1, t0, .L21
  li t0, 25
  beq s1, t0, .L22
  li t0, 26
  beq s1, t0, .L23
  li t0, 27
  beq s1, t0, .L24
  li t0, 28
  beq s1, t0, .L25
  li t0, 29
  beq s1, t0, .L26
  li t0, 31
  beq s1, t0, .L27
  li t0, 30
  beq s1, t0, .L28
  li t0, 11
  beq s1, t0, .L29
  j .L2
.L3:
  ; sci/tokens.e16.ts:132  return str('sin(')
  la a0, str_0
  j .return
.L4:
  ; sci/tokens.e16.ts:134  return str('cos(')
  la a0, str_1
  j .return
.L5:
  ; sci/tokens.e16.ts:136  return str('tan(')
  la a0, str_2
  j .return
.L6:
  ; sci/tokens.e16.ts:138  return str('sin\x86(')
  la a0, str_3
  j .return
.L7:
  ; sci/tokens.e16.ts:140  return str('cos\x86(')
  la a0, str_4
  j .return
.L8:
  ; sci/tokens.e16.ts:142  return str('tan\x86(')
  la a0, str_5
  j .return
.L9:
  ; sci/tokens.e16.ts:144  return str('log(')
  la a0, str_6
  j .return
.L10:
  ; sci/tokens.e16.ts:146  return str('ln(')
  la a0, str_7
  j .return
.L11:
  ; sci/tokens.e16.ts:148  return str('\x83(')
  la a0, str_8
  j .return
.L12:
  ; sci/tokens.e16.ts:150  return str('\x85\x83(')
  la a0, str_9
  j .return
.L13:
  ; sci/tokens.e16.ts:152  return str('-')
  la a0, str_10
  j .return
.L14:
  ; sci/tokens.e16.ts:154  return str('^(')
  la a0, str_11
  j .return
.L15:
  ; sci/tokens.e16.ts:156  return str('C')
  la a0, str_12
  j .return
.L16:
  ; sci/tokens.e16.ts:158  return str('P')
  la a0, str_13
  j .return
.L17:
  ; sci/tokens.e16.ts:160  return str('Ans')
  la a0, str_14
  j .return
.L18:
  ; sci/tokens.e16.ts:162  return str('10')
  la a0, str_15
  j .return
.L19:
  ; sci/tokens.e16.ts:165  return str('(')
  la a0, str_16
  j .return
.L20:
  ; sci/tokens.e16.ts:167  return str(')/(')
  la a0, str_17
  j .return
.L21:
  ; sci/tokens.e16.ts:169  return str(')')
  la a0, str_18
  j .return
.L22:
  ; sci/tokens.e16.ts:171  return str('\x83(')
  la a0, str_8
  j .return
.L23:
  ; sci/tokens.e16.ts:173  return str('^(')
  la a0, str_11
  j .return
.L24:
  ; sci/tokens.e16.ts:175  return str('/')
  la a0, str_19
  j .return
.L25:
  ; sci/tokens.e16.ts:177  return str('(')
  la a0, str_16
  j .return
.L26:
  ; sci/tokens.e16.ts:179  return str(' ')
  la a0, str_20
  j .return
.L27:
  ; sci/tokens.e16.ts:181  return str('/')
  la a0, str_19
  j .return
.L28:
  ; sci/tokens.e16.ts:183  return str('(')
  la a0, str_16
  j .return
.L29:
  ; sci/tokens.e16.ts:185  return str(')\x83(')
  la a0, str_21
  j .return
.L2:
  ; sci/tokens.e16.ts:187  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/tokens.e16.ts:191 namedText(t) at -O1
;   t in a0
namedText:
  ; sci/tokens.e16.ts:192  switch (t) {
  li t0, 224
  beq a0, t0, .L2
  li t0, 225
  beq a0, t0, .L3
  li t0, 226
  beq a0, t0, .L4
  li t0, 227
  beq a0, t0, .L5
  li t0, 228
  beq a0, t0, .L6
  li t0, 229
  beq a0, t0, .L7
  li t0, 230
  beq a0, t0, .L8
  li t0, 231
  beq a0, t0, .L9
  li t0, 232
  beq a0, t0, .L10
  li t0, 233
  beq a0, t0, .L11
  li t0, 234
  beq a0, t0, .L12
  li t0, 235
  beq a0, t0, .L13
  li t0, 236
  beq a0, t0, .L14
  li t0, 237
  beq a0, t0, .L15
  j .L1
.L2:
  ; sci/tokens.e16.ts:194  return str('sinh(')
  la a0, str_22
  ret
.L3:
  ; sci/tokens.e16.ts:196  return str('cosh(')
  la a0, str_23
  ret
.L4:
  ; sci/tokens.e16.ts:198  return str('tanh(')
  la a0, str_24
  ret
.L5:
  ; sci/tokens.e16.ts:200  return str('sinh\x86(')
  la a0, str_25
  ret
.L6:
  ; sci/tokens.e16.ts:202  return str('cosh\x86(')
  la a0, str_26
  ret
.L7:
  ; sci/tokens.e16.ts:204  return str('tanh\x86(')
  la a0, str_27
  ret
.L8:
  ; sci/tokens.e16.ts:206  return str('Abs(')
  la a0, str_28
  ret
.L9:
  ; sci/tokens.e16.ts:208  return str('gcd(')
  la a0, str_29
  ret
.L10:
  ; sci/tokens.e16.ts:210  return str('lcm(')
  la a0, str_30
  ret
.L11:
  ; sci/tokens.e16.ts:212  return str('Int(')
  la a0, str_31
  ret
.L12:
  ; sci/tokens.e16.ts:214  return str('Rnd(')
  la a0, str_32
  ret
.L13:
  ; sci/tokens.e16.ts:216  return str('Pol(')
  la a0, str_33
  ret
.L14:
  ; sci/tokens.e16.ts:218  return str('Rec(')
  la a0, str_34
  ret
.L15:
  ; sci/tokens.e16.ts:220  return str('Ran#')
  la a0, str_35
  ret
.L1:
  ; sci/tokens.e16.ts:222  return 0
  li a0, 0
.return:
  ret

; sci/tokens.e16.ts:226 tokenWidth(t/text) at -O1
;   t/text in s1
;   n in s2
tokenWidth:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t/text
  ; sci/tokens.e16.ts:227  const text = tokenText(t)
  mv a0, s1
  call tokenText
  mv s1, a0 ; t/text
  ; sci/tokens.e16.ts:228  if (text === 0) return 1
  bne s1, zero, .L1
  ; sci/tokens.e16.ts:228  return 1
  li a0, 1
  j .return
.L1:
  ; sci/tokens.e16.ts:229  let n: u16 = 0
  li s2, 0 ; n
  ; sci/tokens.e16.ts:230  while (peek(text + n) !== 0) n++
  j .L4
.L2:
  ; sci/tokens.e16.ts:230  n++
  addi s2, s2, 1
.L4:
  add t0, s1, s2
  lbu t0, 0(t0)
  bne t0, zero, .L2
  ; sci/tokens.e16.ts:231  return n
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/numbers.e16.ts:88 fail(code, at) at -O1
;   code in s1
;   at in s2
fail:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; code
  mv s2, a1 ; at
  ; sci/numbers.e16.ts:89  errCode = code
  sw s1, 0x0104(zero)
  ; sci/numbers.e16.ts:90  errAt = at
  sw s2, 0x0106(zero)
  ; sci/numbers.e16.ts:91  calc_abort()
  call calc_abort
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/numbers.e16.ts:104 copyValue(from, to) at -O1
;   from in s1
;   to in s2
copyValue:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; from
  mv s2, a1 ; to
  ; sci/numbers.e16.ts:105  memcpy(to, from, VALUE_SIZE)
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

; sci/numbers.e16.ts:109 copy8(from, to) at -O1
;   from in s1
;   to in s2
copy8:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; from
  mv s2, a1 ; to
  ; sci/numbers.e16.ts:110  memcpy(to, from, 8)
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

; sci/numbers.e16.ts:114 inexact(v) at -O1
;   v in a0
inexact:
  ; sci/numbers.e16.ts:115  poke16(v + V_EXACT, 0)
  sw zero, 8(a0)
.return:
  ret

; sci/numbers.e16.ts:118 isExact(v) at -O1
;   v in a0
isExact:
  ; sci/numbers.e16.ts:119  return peek16(v + V_EXACT) !== 0
  lw t0, 8(a0)
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; sci/numbers.e16.ts:152 keepReady() at -O1
;   i in a0
keepReady:
  ; sci/numbers.e16.ts:153  if (peek16(KEEP) === KEEP_MARK) return
  lw t0, 3072(zero)
  li t1, 23588
  bne t0, t1, .L1
  ; sci/numbers.e16.ts:153  return
  ret
.L1:
  ; sci/numbers.e16.ts:154  for (let i: u16 = 0; i < 0x182; i += 2) poke16(KEEP + i, 0)
  li a0, 0 ; i
  j .L4
.L2:
  ; sci/numbers.e16.ts:154  poke16(KEEP + i, 0)
  sw zero, 3072(a0)
  addi a0, a0, 2
.L4:
  li t0, 386
  bltu a0, t0, .L2
  ; sci/numbers.e16.ts:155  poke16(KEEP, KEEP_MARK)
  li t0, 23588
  sw t0, 3072(zero)
.return:
  ret

; sci/numbers.e16.ts:159 varAt(letter) at -O1
;   letter in a0
;   k in a1
varAt:
  ; sci/numbers.e16.ts:160  let k: u16 = 0
  li a1, 0 ; k
  ; sci/numbers.e16.ts:161  if (letter >= 0x41 && letter <= 0x46) k = letter - 0x41
  li t0, 65
  bltu a0, t0, .L1
  li t0, 70
  bltu t0, a0, .L1
  ; sci/numbers.e16.ts:161  k = letter - 0x41
  addi a1, a0, -65
  j .L2
.L1:
  ; sci/numbers.e16.ts:162  if (letter === 0x58) k = 6
  li t0, 88
  bne a0, t0, .L3
  ; sci/numbers.e16.ts:162  k = 6
  li a1, 6 ; k
  j .L4
.L3:
  ; sci/numbers.e16.ts:163  if (letter === 0x59) k = 7
  li t0, 89
  bne a0, t0, .L5
  ; sci/numbers.e16.ts:163  k = 7
  li a1, 7 ; k
  j .L6
.L5:
  ; sci/numbers.e16.ts:164  k = 8
  li a1, 8 ; k
.L6:
.L4:
.L2:
  ; sci/numbers.e16.ts:165  return KEEP_VARS + k * VALUE_SIZE
  slli t1, a1, 5
  slli t0, a1, 2
  add t0, t0, t1
  addi a0, t0, 3120
.return:
  ret

; sci/numbers.e16.ts:174 clearStack() at -O1
clearStack:
  ; sci/numbers.e16.ts:175  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0468(zero)
.return:
  ret

; sci/numbers.e16.ts:179 push(at/n) at -O1
;   at/n in s1
push:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at/n
  ; sci/numbers.e16.ts:180  if (nsp >= addr(nums) + 864) fail(E_STACK, at)
  lw t0, 0x0468(zero)
  li t1, nums+864
  bltu t0, t1, .L1
  ; sci/numbers.e16.ts:180  fail(E_STACK, at)
  li a0, 3
  mv a1, s1
  call fail
.L1:
  ; sci/numbers.e16.ts:181  const n = nsp
  lw s1, 0x0468(zero)
  ; sci/numbers.e16.ts:182  nsp += VALUE_SIZE
  lw t0, 0x0468(zero)
  addi t0, t0, 36
  sw t0, 0x0468(zero)
  ; sci/numbers.e16.ts:183  inexact(n)
  mv a0, s1
  call inexact
  ; sci/numbers.e16.ts:184  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/numbers.e16.ts:187 top() at -O1
top:
  ; sci/numbers.e16.ts:188  return nsp - VALUE_SIZE
  lw t0, 0x0468(zero)
  addi a0, t0, -36
.return:
  ret

; sci/numbers.e16.ts:191 pop() at -O1
pop:
  ; sci/numbers.e16.ts:192  nsp -= VALUE_SIZE
  lw t0, 0x0468(zero)
  addi t0, t0, -36
  sw t0, 0x0468(zero)
.return:
  ret

; sci/numbers.e16.ts:195 isZero(n) at -O1
;   n in a0
isZero:
  ; sci/numbers.e16.ts:196  return peek(n + 2) === 0
  lbu t0, 2(a0)
  sub t0, t0, zero
  seqz a0, t0
.return:
  ret

; sci/numbers.e16.ts:199 isNegative(n) at -O1
;   n in a0
isNegative:
  ; sci/numbers.e16.ts:200  return peek(n) !== 0
  lbu t0, 0(a0)
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; sci/numbers.e16.ts:204 math(op, a, b, at) at -O1
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
  ; sci/numbers.e16.ts:205  poke16(MATH_A, a)
  li t0, 65362
  sw s2, 0(t0)
  ; sci/numbers.e16.ts:206  poke16(MATH_B, b)
  li t0, 65364
  sw s3, 0(t0)
  ; sci/numbers.e16.ts:207  poke16(MATH_OP, op)
  li t0, 65360
  sw s1, 0(t0)
  ; sci/numbers.e16.ts:208  if (peek16(MATH_STATUS) !== 0) fail(E_MATH, at)
  li t0, 65368
  lw t0, 0(t0)
  beq t0, zero, .L1
  ; sci/numbers.e16.ts:208  fail(E_MATH, at)
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

; sci/numbers.e16.ts:215 shownDigits() at -O1
;   n in a0
;   format in a1
shownDigits:
  ; sci/numbers.e16.ts:216  const n = peek(KEEP_DIGITS)
  lbu a0, 3078(zero)
  ; sci/numbers.e16.ts:217  const format = peek(KEEP_FORMAT)
  lbu a1, 3077(zero)
  ; sci/numbers.e16.ts:218  if (format === FORMAT_FIX) return u16(-i16(n))
  li t0, 1
  bne a1, t0, .L1
  ; sci/numbers.e16.ts:218  return u16(-i16(n))
  neg a0, a0
  ret
.L1:
  ; sci/numbers.e16.ts:219  if (format === FORMAT_EXP && n > 0) return n
  li t0, 2
  bne a1, t0, .L2
  bgeu zero, a0, .L2
  ; sci/numbers.e16.ts:219  return n
  ret
.L2:
  ; sci/numbers.e16.ts:220  return 10
  li a0, 10
.return:
  ret

; sci/numbers.e16.ts:227 pushInt(v, at) at -O1
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
  ; sci/numbers.e16.ts:228  const n = push(at)
  mv a0, s2
  call push
  mv s1, a0 ; n
  ; sci/numbers.e16.ts:229  poke16(MATH_ARG, v)
  li t0, 65366
  sw s3, 0(t0)
  ; sci/numbers.e16.ts:230  math(M_FROMINT, n, 0, at)
  li a0, 48
  mv a1, s1
  li a2, 0
  mv a3, s2
  call math
  ; sci/numbers.e16.ts:231  exactWhole(n)
  mv a0, s1
  la t0, exactWhole
  li t1, 2
  call far_call
  ; sci/numbers.e16.ts:232  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/numbers.e16.ts:236 binary(op, at) at -O1
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
  ; sci/numbers.e16.ts:237  const b = top()
  call top
  mv s2, a0 ; b
  ; sci/numbers.e16.ts:238  pop()
  call pop
  ; sci/numbers.e16.ts:239  const a = top()
  call top
  mv s3, a0 ; a
  ; sci/numbers.e16.ts:240  math(op, a, b, at)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  mv a3, s0
  call math
  ; sci/numbers.e16.ts:241  exactBinary(op, a, b)
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

; sci/numbers.e16.ts:245 isWhole(n/whole, at) at -O1
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
  ; sci/numbers.e16.ts:246  const t = push(at)
  mv a0, s3
  call push
  mv s2, a0 ; t
  ; sci/numbers.e16.ts:247  copy8(n, t)
  mv a0, s1
  mv a1, s2
  call copy8
  ; sci/numbers.e16.ts:248  math(M_FRAC, t, 0, at)
  li a0, 19
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  ; sci/numbers.e16.ts:249  const whole = isZero(t)
  mv a0, s2
  call isZero
  mv s1, a0 ; n/whole
  ; sci/numbers.e16.ts:250  pop()
  call pop
  ; sci/numbers.e16.ts:251  return whole
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/numbers.e16.ts:255 smallWhole(n/v, at) at -O1
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
  ; sci/numbers.e16.ts:256  if (!isWhole(n, at) || isNegative(n)) fail(E_MATH, at)
  mv a0, s1
  mv a1, s2
  call isWhole
  beqz a0, .L2
  mv a0, s1
  call isNegative
  beqz a0, .L1
.L2:
  ; sci/numbers.e16.ts:256  fail(E_MATH, at)
  li a0, 1
  mv a1, s2
  call fail
.L1:
  ; sci/numbers.e16.ts:257  const t = push(at)
  mv a0, s2
  call push
  mv s3, a0 ; t
  ; sci/numbers.e16.ts:258  copy8(n, t)
  mv a0, s1
  mv a1, s3
  call copy8
  ; sci/numbers.e16.ts:259  math(M_TOINT, t, 0, at)
  li a0, 49
  mv a1, s3
  li a2, 0
  mv a3, s2
  call math
  ; sci/numbers.e16.ts:260  pop()
  call pop
  ; sci/numbers.e16.ts:261  const v = peek16(MATH_ARG)
  li t0, 65366
  lw s1, 0(t0)
  ; sci/numbers.e16.ts:262  if (i16(v) < 0 || v > 999) fail(E_MATH, at)
  blt s1, zero, .L4
  li t0, 999
  bgeu t0, s1, .L3
.L4:
  ; sci/numbers.e16.ts:262  fail(E_MATH, at)
  li a0, 1
  mv a1, s2
  call fail
.L3:
  ; sci/numbers.e16.ts:263  return v
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:245 twoD() at -O1
twoD:
  ; sci/calc.e16.ts:246  return peek(KEEP_DISPLAY) === 0
  lbu t0, 3075(zero)
  sub t0, t0, zero
  seqz a0, t0
.return:
  ret

; sci/calc.e16.ts:259 calcCold() at -O1
calcCold:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:260  keepReady()
  call keepReady
  ; sci/calc.e16.ts:261  cls()
  call cls
  ; sci/calc.e16.ts:262  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:263  centre(2, str('ELEC-16 SCI'), 11)
  li a0, 2
  la a1, str_36
  li a2, 11
  call centre
  ; sci/calc.e16.ts:264  centre(4, str('SCI-128'), 7)
  li a0, 4
  la a1, str_37
  li a2, 7
  call centre
  ; sci/calc.e16.ts:265  marks(0)
  ; sci/lcd.e16.ts:171  poke16(IO_ANNUNCIATORS, bits)
  li t0, 65326
  sw zero, 0(t0)
  ; sci/calc.e16.ts:266  pause(700)
  ; sci/calc.e16.ts:276  poke16(IO_TCMP, peek16(IO_TCOUNT) + ms)
  li t0, 65328
  lw t0, 0(t0)
  addi t0, t0, 700
  li t1, 65330
  sw t0, 0(t1)
  ; sci/calc.e16.ts:277  poke16(IO_TCTRL, 1)
  li t0, 1
  li t1, 65332
  sw t0, 0(t1)
  ; sci/calc.e16.ts:278  csrw(CSR_MIE, 3)
  li t0, 3
  csrw 772, t0
  ; sci/calc.e16.ts:279  wfi()
  wfi
  ; sci/calc.e16.ts:280  poke16(IO_TCTRL, 0)
  li t0, 65332
  sw zero, 0(t0)
  ; sci/calc.e16.ts:281  csrw(CSR_MIE, 0)
  csrw 772, zero
  ; sci/calc.e16.ts:267  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:268  length = 0
  sw zero, 0x0558(zero)
  ; sci/calc.e16.ts:269  cursor = 0
  sw zero, 0x055a(zero)
  ; sci/calc.e16.ts:270  answered = false
  sw zero, 0x055c(zero)
  ; sci/calc.e16.ts:271  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:285 calcLoop() at -O1
calcLoop:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:286  for (;;) key(getkey())
.L1:
  ; sci/calc.e16.ts:286  key(getkey())
  call getkey
  call key
  j .L1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:290 refuse() at -O1
refuse:
  ; sci/calc.e16.ts:291  poke16(IO_FREQ, 1800)
  li t0, 1800
  li t1, 65344
  sw t0, 0(t1)
  ; sci/calc.e16.ts:292  poke16(IO_DUR, 40)
  li t0, 40
  li t1, 65346
  sw t0, 0(t1)
.return:
  ret

; sci/calc.e16.ts:298 calcError() at -O1
calcError:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:299  screen = S_ERROR
  li t0, 1
  sw t0, 0x048e(zero)
  ; sci/calc.e16.ts:300  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:301  errorScreen(errCode)
  lw a0, 0x0104(zero)
  la t0, errorScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:302  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:306 calcFault(cause, pc) at -O1
;   cause in s1
;   pc in s2
calcFault:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; cause
  mv s2, a1 ; pc
  ; sci/calc.e16.ts:307  screen = S_ERROR
  li t0, 1
  sw t0, 0x048e(zero)
  ; sci/calc.e16.ts:308  length = 0
  sw zero, 0x0558(zero)
  ; sci/calc.e16.ts:309  cursor = 0
  sw zero, 0x055a(zero)
  ; sci/calc.e16.ts:310  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:311  faultScreen(cause, pc)
  mv a0, s1
  mv a1, s2
  la t0, faultScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:312  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:319 calcOn() at -O1
calcOn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:320  if (shifted) {
  lw t0, 0x055e(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:321  shifted = false
  sw zero, 0x055e(zero)
  ; sci/calc.e16.ts:322  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:323  poke16(0xff06, 0)
  li t0, 65286
  sw zero, 0(t0)
  ; sci/calc.e16.ts:324  return
  j .return
.L1:
  ; sci/calc.e16.ts:326  clearLine()
  call clearLine
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:329 clearLine() at -O1
clearLine:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:330  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:331  length = 0
  sw zero, 0x0558(zero)
  ; sci/calc.e16.ts:332  cursor = 0
  sw zero, 0x055a(zero)
  ; sci/calc.e16.ts:333  answered = false
  sw zero, 0x055c(zero)
  ; sci/calc.e16.ts:334  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x056a(zero)
  ; sci/calc.e16.ts:335  shifted = false
  sw zero, 0x055e(zero)
  ; sci/calc.e16.ts:336  alphaOn = false
  sw zero, 0x0560(zero)
  ; sci/calc.e16.ts:337  storing = false
  sw zero, 0x0562(zero)
  ; sci/calc.e16.ts:338  recalling = false
  sw zero, 0x0564(zero)
  ; sci/calc.e16.ts:339  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:344 key(k) at -O1
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
  ; sci/calc.e16.ts:345  if (k === K_SHIFT) {
  li t0, 6
  bne s1, t0, .L1
  ; sci/calc.e16.ts:346  shifted = !shifted
  lw t0, 0x055e(zero)
  seqz t0, t0
  sw t0, 0x055e(zero)
  ; sci/calc.e16.ts:347  alphaOn = false
  sw zero, 0x0560(zero)
  ; sci/calc.e16.ts:348  drawMarks()
  call drawMarks
  ; sci/calc.e16.ts:349  return
  j .return
.L1:
  ; sci/calc.e16.ts:351  if (k === K_ALPHA) {
  li t0, 7
  bne s1, t0, .L2
  ; sci/calc.e16.ts:352  alphaOn = !alphaOn
  lw t0, 0x0560(zero)
  seqz t0, t0
  sw t0, 0x0560(zero)
  ; sci/calc.e16.ts:353  shifted = false
  sw zero, 0x055e(zero)
  ; sci/calc.e16.ts:354  drawMarks()
  call drawMarks
  ; sci/calc.e16.ts:355  return
  j .return
.L2:
  ; sci/calc.e16.ts:357  const shift = shifted
  lw s2, 0x055e(zero)
  ; sci/calc.e16.ts:358  const alpha = alphaOn
  lw s3, 0x0560(zero)
  ; sci/calc.e16.ts:359  shifted = false
  sw zero, 0x055e(zero)
  ; sci/calc.e16.ts:360  alphaOn = false
  sw zero, 0x0560(zero)
  ; sci/calc.e16.ts:361  if (screen === S_ERROR) errorKey(k)
  lw t0, 0x048e(zero)
  li t1, 1
  bne t0, t1, .L3
  ; sci/calc.e16.ts:361  errorKey(k)
  mv a0, s1
  call errorKey
  j .L4
.L3:
  ; sci/calc.e16.ts:362  if (screen === S_MENU) {
  lw t0, 0x048e(zero)
  li t1, 2
  bne t0, t1, .L5
  ; sci/calc.e16.ts:363  if (menuKey(k) !== 0) clearLine()
  mv a0, s1
  la t0, menuKey
  li t1, 1
  call far_call
  beq a0, zero, .L7
  ; sci/calc.e16.ts:363  clearLine()
  call clearLine
  j .L7
.L5:
  ; sci/calc.e16.ts:364  if (screen === S_SETUP) {
  lw t0, 0x048e(zero)
  li t1, 3
  bne t0, t1, .L8
  ; sci/calc.e16.ts:365  if (setupKey(k) !== 0) clearLine()
  mv a0, s1
  la t0, setupKey
  li t1, 1
  call far_call
  beq a0, zero, .L10
  ; sci/calc.e16.ts:365  clearLine()
  call clearLine
  j .L10
.L8:
  ; sci/calc.e16.ts:366  if (screen === S_FUNC) funcChosen(funcKey(k))
  lw t0, 0x048e(zero)
  li t1, 4
  bne t0, t1, .L11
  ; sci/calc.e16.ts:366  funcChosen(funcKey(k))
  mv a0, s1
  la t0, funcKey
  li t1, 1
  call far_call
  call funcChosen
  j .L12
.L11:
  ; sci/calc.e16.ts:367  if (screen === S_ASK) asked(k, shift)
  lw t0, 0x048e(zero)
  li t1, 5
  bne t0, t1, .L13
  ; sci/calc.e16.ts:367  asked(k, shift)
  mv a0, s1
  mv a1, s2
  call asked
  j .L14
.L13:
  ; sci/calc.e16.ts:368  calcKey(k, shift, alpha)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call calcKey
.L14:
.L12:
.L10:
.L7:
.L4:
  ; sci/calc.e16.ts:369  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:373 errorKey(k) at -O1
;   k in s1
errorKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/calc.e16.ts:374  if (k === K_AC) {
  li t0, 5
  bne s1, t0, .L1
  ; sci/calc.e16.ts:375  clearLine()
  call clearLine
  ; sci/calc.e16.ts:376  return
  j .return
.L1:
  ; sci/calc.e16.ts:378  if (k === K_LEFT || k === K_RIGHT) {
  li t0, 2
  beq s1, t0, .L3
  li t0, 3
  bne s1, t0, .L2
.L3:
  ; sci/calc.e16.ts:379  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:380  answered = false
  sw zero, 0x055c(zero)
  ; sci/calc.e16.ts:381  cursor = errAt < length ? errAt : length
  lw t0, 0x0106(zero)
  lw t1, 0x0558(zero)
  bgeu t0, t1, .L4
  lw t0, 0x0106(zero)
  j .L5
.L4:
  lw t0, 0x0558(zero)
.L5:
  sw t0, 0x055a(zero)
  ; sci/calc.e16.ts:382  drawCalc()
  call drawCalc
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:387 funcChosen(t) at -O1
;   t in s1
funcChosen:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/calc.e16.ts:388  if (t === 0) return
  bne s1, zero, .L1
  ; sci/calc.e16.ts:388  return
  j .return
.L1:
  ; sci/calc.e16.ts:389  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:390  if (t === 1) drawCalc()
  li t0, 1
  bne s1, t0, .L2
  ; sci/calc.e16.ts:390  drawCalc()
  call drawCalc
  j .L3
.L2:
  ; sci/calc.e16.ts:391  type(t)
  mv a0, s1
  call type
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:395 asked(k/r, shift/t) at -O1
;   k/r in s1
;   shift/t in s2
asked:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/r
  mv s2, a1 ; shift/t
  ; sci/calc.e16.ts:396  const t = k === K_DEL || k === K_EQ || k === K_AC ? 0 : tokenOf(k, shift)
  li t0, 14
  beq s1, t0, .L3
  li t0, 4
  beq s1, t0, .L3
  li t0, 5
  bne s1, t0, .L1
.L3:
  li t0, 0
  j .L2
.L1:
  mv a0, s1
  mv a1, s2
  call tokenOf
  mv t0, a0
.L2:
  mv s2, t0 ; shift/t
  ; sci/calc.e16.ts:397  const r = askKey(k === K_EQ, k === K_DEL, k === K_AC, t)
  li t0, 4
  sub t0, s1, t0
  seqz a0, t0
  li t1, 14
  sub t1, s1, t1
  seqz a1, t1
  li t2, 5
  sub t2, s1, t2
  seqz a2, t2
  mv a3, s2
  la t0, askKey
  li t1, 6
  call far_call
  mv s1, a0 ; k/r
  ; sci/calc.e16.ts:398  if (r === ASK_BACK) {
  li t0, 1
  bne s1, t0, .L4
  ; sci/calc.e16.ts:399  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:400  drawCalc()
  call drawCalc
  j .L5
.L4:
  ; sci/calc.e16.ts:401  if (r === ASK_DONE) {
  li t0, 2
  bne s1, t0, .L6
  ; sci/calc.e16.ts:402  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:403  answered = true
  li t0, 1
  sw t0, 0x055c(zero)
  ; sci/calc.e16.ts:404  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x056a(zero)
  ; sci/calc.e16.ts:405  shown = found ? SHOW_FOUND : firstShown(formFirst(false))
  lw t0, 0x0568(zero)
  beqz t0, .L7
  li t0, 6
  j .L8
.L7:
  li a0, 0
  call formFirst
  la t0, firstShown
  li t1, 5
  call far_call
  mv t0, a0
.L8:
  sw t0, 0x056e(zero)
  ; sci/calc.e16.ts:406  drawCalc()
  call drawCalc
.L6:
.L5:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:410 calcKey(k, shift, alpha/t) at -O1
;   k in s1
;   shift in s3
;   alpha/t in s2
;   wasHyp in s0
calcKey:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; k
  mv s3, a1 ; shift
  mv s2, a2 ; alpha/t
  ; sci/calc.e16.ts:411  if (storing || recalling) {
  lw t0, 0x0562(zero)
  bnez t0, .L2
  lw t0, 0x0564(zero)
  beqz t0, .L1
.L2:
  ; sci/calc.e16.ts:412  variableKey(k)
  mv a0, s1
  call variableKey
  ; sci/calc.e16.ts:413  return
  j .return
.L1:
  ; sci/calc.e16.ts:415  const wasHyp = hyp
  lw s0, 0x0566(zero)
  ; sci/calc.e16.ts:416  hyp = false
  sw zero, 0x0566(zero)
  ; sci/calc.e16.ts:417  if (commandKey(k, shift, alpha)) return
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call commandKey
  beqz a0, .L3
  ; sci/calc.e16.ts:417  return
  j .return
.L3:
  ; sci/calc.e16.ts:418  if (!alpha && templateKey(k, shift)) return
  bnez s2, .L4
  mv a0, s1
  mv a1, s3
  call templateKey
  beqz a0, .L4
  ; sci/calc.e16.ts:418  return
  j .return
.L4:
  ; sci/calc.e16.ts:419  if (!alpha && !shift && k === K_DMS) {
  bnez s2, .L5
  bnez s3, .L5
  li t0, 25
  bne s1, t0, .L5
  ; sci/calc.e16.ts:420  dmsMark()
  call dmsMark
  ; sci/calc.e16.ts:421  return
  j .return
.L5:
  ; sci/calc.e16.ts:423  const t = alpha ? letterOf(k) : wasHyp ? hypToken(k, shift) : tokenOf(k, shift)
  beqz s2, .L6
  mv a0, s1
  call letterOf
  mv t0, a0
  j .L7
.L6:
  beqz s0, .L8
  mv a0, s1
  mv a1, s3
  call hypToken
  mv t0, a0
  j .L9
.L8:
  mv a0, s1
  mv a1, s3
  call tokenOf
  mv t0, a0
.L9:
.L7:
  mv s2, t0 ; alpha/t
  ; sci/calc.e16.ts:424  if (t === 0) {
  bne s2, zero, .L10
  ; sci/calc.e16.ts:425  refuse()
  call refuse
  ; sci/calc.e16.ts:426  return
  j .return
.L10:
  ; sci/calc.e16.ts:428  type(t)
  mv a0, s2
  call type
  ; sci/calc.e16.ts:430  if (shift && (k === K_LOG || k === K_LN)) {
  beqz s3, .L11
  li t0, 20
  beq s1, t0, .L12
  li t0, 21
  bne s1, t0, .L11
.L12:
  ; sci/calc.e16.ts:431  insert(T_POW)
  li a0, 17
  call insert
  ; sci/calc.e16.ts:432  drawCalc()
  call drawCalc
.L11:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/calc.e16.ts:440 templateKey(k, shift) at -O1
;   k in s1
;   shift in s2
templateKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift
  ; sci/calc.e16.ts:441  if (shift && (k === K_FRAC || k === K_POW)) {
  beqz s2, .L1
  li t0, 16
  beq s1, t0, .L2
  li t0, 19
  bne s1, t0, .L1
.L2:
  ; sci/calc.e16.ts:442  wrapped(k === K_FRAC ? T_MIXED : T_XROOT)
  li t0, 16
  bne s1, t0, .L3
  li t0, 28
  j .L4
.L3:
  li t0, 30
.L4:
  mv a0, t0
  call wrapped
  ; sci/calc.e16.ts:443  return true
  li a0, 1
  j .return
.L1:
  ; sci/calc.e16.ts:445  return plainTemplate(k, shift)
  mv a0, s1
  mv a1, s2
  call plainTemplate
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:449 plainTemplate(k, shift/root) at -O1
;   k in s1
;   shift/root in s2
;   fractionKey in s3
plainTemplate:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift/root
  ; sci/calc.e16.ts:450  const fractionKey = k === K_FRAC && !shift
  li t0, 16
  sub t0, s1, t0
  seqz t0, t0
  mv t1, t0
  beqz t1, .L1
  seqz t0, s2
.L1:
  mv s3, t0 ; fractionKey
  ; sci/calc.e16.ts:451  if (!twoD()) {
  call twoD
  bnez a0, .L2
  ; sci/calc.e16.ts:452  if (fractionKey) type(T_SLASH)
  beqz s3, .L3
  ; sci/calc.e16.ts:452  type(T_SLASH)
  li a0, 27
  call type
.L3:
  ; sci/calc.e16.ts:453  return fractionKey
  mv a0, s3
  j .return
.L2:
  ; sci/calc.e16.ts:455  if (!fractionKey && !makesTemplate(k, shift)) return false
  bnez s3, .L4
  mv a0, s1
  mv a1, s2
  call makesTemplate
  bnez a0, .L4
  ; sci/calc.e16.ts:455  return false
  li a0, 0
  j .return
.L4:
  ; sci/calc.e16.ts:456  const root = k === K_SQ && shift
  li t0, 17
  sub t0, s1, t0
  seqz t0, t0
  mv t1, t0
  beqz t1, .L5
  mv t0, s2
.L5:
  mv s2, t0 ; shift/root
  ; sci/calc.e16.ts:457  if (answered) afresh(fractionKey || k === K_POW)
  lw t0, 0x055c(zero)
  beqz t0, .L6
  ; sci/calc.e16.ts:457  afresh(fractionKey || k === K_POW)
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
  ; sci/calc.e16.ts:458  if (fractionKey) {
  beqz s3, .L8
  ; sci/calc.e16.ts:459  wrap(addr(line), length, cursor, T_FRAC)
  lw a1, 0x0558(zero)
  lw a2, 0x055a(zero)
  la a0, line
  li a3, 22
  la t0, wrap
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:460  edited()
  call edited
  j .L9
.L8:
  ; sci/calc.e16.ts:461  insertTemplate(k, root)
  mv a0, s1
  mv a1, s2
  call insertTemplate
.L9:
  ; sci/calc.e16.ts:462  tallEnough()
  call tallEnough
  ; sci/calc.e16.ts:463  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:464  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:468 wrapped(opener) at -O1
;   opener in s1
wrapped:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; opener
  ; sci/calc.e16.ts:469  if (answered) afresh(false)
  lw t0, 0x055c(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:469  afresh(false)
  li a0, 0
  call afresh
.L1:
  ; sci/calc.e16.ts:470  if (length + 4 > LINE_MAX) {
  lw t0, 0x0558(zero)
  li t1, 199
  addi t0, t0, 4
  bgeu t1, t0, .L2
  ; sci/calc.e16.ts:471  refuse()
  call refuse
  ; sci/calc.e16.ts:472  return
  j .return
.L2:
  ; sci/calc.e16.ts:474  wrap(addr(line), length, cursor, opener)
  lw a1, 0x0558(zero)
  lw a2, 0x055a(zero)
  la a0, line
  mv a3, s1
  la t0, wrap
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:475  edited()
  call edited
  ; sci/calc.e16.ts:476  tallEnough()
  call tallEnough
  ; sci/calc.e16.ts:477  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:481 tallEnough() at -O1
tallEnough:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:482  if (!twoD() || heightOf(addr(line), length) <= LINE_HEIGHT_MAX) return
  call twoD
  beqz a0, .L2
  lw a1, 0x0558(zero)
  la a0, line
  la t0, heightOf
  li t1, 3
  call far_call
  li t0, 36
  bltu t0, a0, .L1
.L2:
  ; sci/calc.e16.ts:482  return
  j .return
.L1:
  ; sci/calc.e16.ts:483  refuse()
  call refuse
  ; sci/calc.e16.ts:484  deleteAt(addr(line), length, cursor)
  lw a1, 0x0558(zero)
  lw a2, 0x055a(zero)
  la a0, line
  la t0, deleteAt
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:485  edited()
  call edited
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:492 dmsMark() at -O1
;   marks in s1
;   j in s2
;   t in s3
dmsMark:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; sci/calc.e16.ts:493  if (answered) {
  lw t0, 0x055c(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:494  shown = shown === SHOW_DMS ? firstShown(formFirst(false)) : SHOW_DMS
  lw t0, 0x056e(zero)
  li t1, 4
  bne t0, t1, .L2
  li a0, 0
  call formFirst
  la t0, firstShown
  li t1, 5
  call far_call
  mv t0, a0
  j .L3
.L2:
  li t0, 4
.L3:
  sw t0, 0x056e(zero)
  ; sci/calc.e16.ts:495  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:496  return
  j .return
.L1:
  ; sci/calc.e16.ts:498  let marks: u16 = 0
  li s1, 0 ; marks
  ; sci/calc.e16.ts:499  let j = cursor
  lw s2, 0x055a(zero)
  ; sci/calc.e16.ts:500  while (j > 0) {
  j .L6
.L4:
  ; sci/calc.e16.ts:501  const t = line[j - 1]
  lbu s3, line-1(s2)
  ; sci/calc.e16.ts:502  if (t === T_DEG || t === T_MIN || t === T_SEC) marks++
  li t0, 136
  beq s3, t0, .L9
  li t0, 137
  beq s3, t0, .L9
  li t0, 138
  bne s3, t0, .L8
.L9:
  ; sci/calc.e16.ts:502  marks++
  addi s1, s1, 1
  j .L10
.L8:
  ; sci/calc.e16.ts:503  if (!isDigit(t) && t !== T_POINT) break
  mv a0, s3
  call isDigit
  bnez a0, .L11
  li t0, 46
  beq s3, t0, .L11
  ; sci/calc.e16.ts:503  break
  j .L7
.L11:
.L10:
  ; sci/calc.e16.ts:504  j--
  addi s2, s2, -1
.L6:
  bltu zero, s2, .L4
.L7:
  ; sci/calc.e16.ts:506  if (marks > 2 || j === cursor) {
  li t0, 2
  bltu t0, s1, .L13
  lw t0, 0x055a(zero)
  bne s2, t0, .L12
.L13:
  ; sci/calc.e16.ts:507  refuse()
  call refuse
  ; sci/calc.e16.ts:508  return
  j .return
.L12:
  ; sci/calc.e16.ts:510  type(marks === 0 ? T_DEG : marks === 1 ? T_MIN : T_SEC)
  bne s1, zero, .L14
  li t0, 136
  j .L15
.L14:
  li t0, 1
  bne s1, t0, .L16
  li t0, 137
  j .L17
.L16:
  li t0, 138
.L17:
.L15:
  mv a0, t0
  call type
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:514 makesTemplate(k, shift) at -O1
;   k in a0
;   shift in a1
makesTemplate:
  ; sci/calc.e16.ts:515  if (shift) return k === K_SQ || k === K_LOG || k === K_LN
  beqz a1, .L1
  ; sci/calc.e16.ts:515  return k === K_SQ || k === K_LOG || k === K_LN
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
  ; sci/calc.e16.ts:516  return k === K_POW
  li t0, 19
  sub t0, a0, t0
  seqz a0, t0
.return:
  ret

; sci/calc.e16.ts:520 edited() at -O1
edited:
  ; sci/calc.e16.ts:521  length = editLength
  lw t0, 0x066a(zero)
  sw t0, 0x0558(zero)
  ; sci/calc.e16.ts:522  cursor = editCursor
  lw t0, 0x066c(zero)
  sw t0, 0x055a(zero)
.return:
  ret

; sci/calc.e16.ts:526 afresh(fromAns) at -O1
;   fromAns in s1
afresh:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; fromAns
  ; sci/calc.e16.ts:527  answered = false
  sw zero, 0x055c(zero)
  ; sci/calc.e16.ts:528  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x056a(zero)
  ; sci/calc.e16.ts:529  length = 0
  sw zero, 0x0558(zero)
  ; sci/calc.e16.ts:530  cursor = 0
  sw zero, 0x055a(zero)
  ; sci/calc.e16.ts:531  if (fromAns) insert(T_ANS)
  beqz s1, .L1
  ; sci/calc.e16.ts:531  insert(T_ANS)
  li a0, 20
  call insert
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:535 insertTemplate(k, root) at -O1
;   k in s1
;   root in s2
insertTemplate:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; root
  ; sci/calc.e16.ts:536  if (k === K_LOG) insert(T_TEN)
  li t0, 20
  bne s1, t0, .L1
  ; sci/calc.e16.ts:536  insert(T_TEN)
  li a0, 21
  call insert
.L1:
  ; sci/calc.e16.ts:537  if (k === K_LN) insert(T_E)
  li t0, 21
  bne s1, t0, .L2
  ; sci/calc.e16.ts:537  insert(T_E)
  li a0, 101
  call insert
.L2:
  ; sci/calc.e16.ts:538  insert(root ? T_ROOT : T_POWT)
  beqz s2, .L3
  li t0, 25
  j .L4
.L3:
  li t0, 26
.L4:
  mv a0, t0
  call insert
  ; sci/calc.e16.ts:539  insert(T_END)
  li a0, 24
  call insert
  ; sci/calc.e16.ts:540  cursor--
  lw t0, 0x055a(zero)
  addi t0, t0, -1
  sw t0, 0x055a(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:544 commandKey(k, shift, alpha) at -O1
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
  ; sci/calc.e16.ts:545  switch (k) {
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
  li t0, 11
  beq s1, t0, .L7
  li t0, 32
  beq s1, t0, .L8
  li t0, 26
  beq s1, t0, .L9
  li t0, 12
  beq s1, t0, .L10
  li t0, 2
  beq s1, t0, .L11
  li t0, 3
  beq s1, t0, .L12
  beq s1, zero, .L13
  li t0, 1
  beq s1, t0, .L14
  li t0, 14
  beq s1, t0, .L15
  li t0, 25
  beq s1, t0, .L16
  j .L1
.L2:
  ; sci/calc.e16.ts:547  screen = S_MENU
  li t0, 2
  sw t0, 0x048e(zero)
  ; sci/calc.e16.ts:548  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:549  menuScreen()
  la t0, menuScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:550  return true
  li a0, 1
  j .return
.L3:
  ; sci/calc.e16.ts:552  screen = S_SETUP
  li t0, 3
  sw t0, 0x048e(zero)
  ; sci/calc.e16.ts:553  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:554  setupScreen()
  la t0, setupScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:555  return true
  li a0, 1
  j .return
.L4:
  ; sci/calc.e16.ts:557  clearLine()
  call clearLine
  ; sci/calc.e16.ts:558  return true
  li a0, 1
  j .return
.L5:
  ; sci/calc.e16.ts:560  equals(shift)
  mv a0, s2
  call equals
  ; sci/calc.e16.ts:561  return true
  li a0, 1
  j .return
.L6:
  ; sci/calc.e16.ts:563  exactOrDecimal(shift)
  mv a0, s2
  call exactOrDecimal
  ; sci/calc.e16.ts:564  return true
  li a0, 1
  j .return
.L7:
  ; sci/calc.e16.ts:566  screen = S_FUNC
  li t0, 4
  sw t0, 0x048e(zero)
  ; sci/calc.e16.ts:567  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:568  funcScreen()
  la t0, funcScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:569  return true
  li a0, 1
  j .return
.L8:
  ; sci/calc.e16.ts:571  solveKey(shift)
  mv a0, s2
  call solveKey
  ; sci/calc.e16.ts:572  return true
  li a0, 1
  j .return
.L9:
  ; sci/calc.e16.ts:574  hyp = !shift
  seqz t0, s2
  sw t0, 0x0566(zero)
  ; sci/calc.e16.ts:575  if (shift) refuse()
  beqz s2, .L17
  ; sci/calc.e16.ts:575  refuse()
  call refuse
.L17:
  ; sci/calc.e16.ts:576  return true
  li a0, 1
  j .return
.L10:
  ; sci/calc.e16.ts:578  recalling = shift
  sw s2, 0x0564(zero)
  ; sci/calc.e16.ts:579  storing = !shift
  seqz t0, s2
  sw t0, 0x0562(zero)
  ; sci/calc.e16.ts:580  return true
  li a0, 1
  j .return
.L11:
.L12:
  ; sci/calc.e16.ts:583  arrow(k === K_LEFT)
  li t0, 2
  sub t0, s1, t0
  seqz a0, t0
  call arrow
  ; sci/calc.e16.ts:584  return true
  li a0, 1
  j .return
.L13:
.L14:
  ; sci/calc.e16.ts:587  history(k === K_UP)
  sub t0, s1, zero
  seqz a0, t0
  call history
  ; sci/calc.e16.ts:588  return true
  li a0, 1
  j .return
.L15:
  ; sci/calc.e16.ts:590  deleteBefore()
  call deleteBefore
  ; sci/calc.e16.ts:591  return true
  li a0, 1
  j .return
.L16:
  ; sci/calc.e16.ts:593  if (!shift) return false
  bnez s2, .L18
  ; sci/calc.e16.ts:593  return false
  li a0, 0
  j .return
.L18:
  ; sci/calc.e16.ts:594  if (answered) dmsMark()
  lw t0, 0x055c(zero)
  beqz t0, .L19
  ; sci/calc.e16.ts:594  dmsMark()
  call dmsMark
  j .L20
.L19:
  ; sci/calc.e16.ts:595  refuse()
  call refuse
.L20:
  ; sci/calc.e16.ts:596  return true
  li a0, 1
  j .return
.L1:
  ; sci/calc.e16.ts:598  if (k !== K_MPLUS || alpha) return false
  li t0, 37
  bne s1, t0, .L22
  beqz s3, .L21
.L22:
  ; sci/calc.e16.ts:598  return false
  li a0, 0
  j .return
.L21:
  ; sci/calc.e16.ts:599  memoryPlus(shift)
  mv a0, s2
  call memoryPlus
  ; sci/calc.e16.ts:600  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:604 tokenOf(k, shift) at -O1
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
  ; sci/calc.e16.ts:605  const plain = plainToken(k)
  mv a0, s1
  call plainToken
  mv s2, a0 ; plain
  ; sci/calc.e16.ts:606  return plain !== 0 ? plain : faceToken(k, shift)
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

; sci/calc.e16.ts:610 plainToken(k) at -O1
;   k in a0
plainToken:
  ; sci/calc.e16.ts:611  switch (k) {
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
  li t0, 36
  beq a0, t0, .L17
  li t0, 15
  beq a0, t0, .L18
  j .L1
.L2:
  ; sci/calc.e16.ts:613  return 0x30
  li a0, 48
  ret
.L3:
  ; sci/calc.e16.ts:615  return 0x31
  li a0, 49
  ret
.L4:
  ; sci/calc.e16.ts:617  return 0x32
  li a0, 50
  ret
.L5:
  ; sci/calc.e16.ts:619  return 0x33
  li a0, 51
  ret
.L6:
  ; sci/calc.e16.ts:621  return 0x34
  li a0, 52
  ret
.L7:
  ; sci/calc.e16.ts:623  return 0x35
  li a0, 53
  ret
.L8:
  ; sci/calc.e16.ts:625  return 0x36
  li a0, 54
  ret
.L9:
  ; sci/calc.e16.ts:627  return 0x37
  li a0, 55
  ret
.L10:
  ; sci/calc.e16.ts:629  return 0x38
  li a0, 56
  ret
.L11:
  ; sci/calc.e16.ts:631  return 0x39
  li a0, 57
  ret
.L12:
  ; sci/calc.e16.ts:633  return T_POINT
  li a0, 46
  ret
.L13:
  ; sci/calc.e16.ts:635  return T_PLUS
  li a0, 43
  ret
.L14:
  ; sci/calc.e16.ts:637  return T_MINUS
  li a0, 45
  ret
.L15:
  ; sci/calc.e16.ts:639  return T_TIMES
  li a0, 129
  ret
.L16:
  ; sci/calc.e16.ts:641  return T_DIVIDE
  li a0, 130
  ret
.L17:
  ; sci/calc.e16.ts:643  return T_CLOSE
  li a0, 41
  ret
.L18:
  ; sci/calc.e16.ts:645  return T_ANS
  li a0, 20
  ret
.L1:
  ; sci/calc.e16.ts:647  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:651 faceToken(k, shift) at -O1
;   k in s1
;   shift in s2
faceToken:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift
  ; sci/calc.e16.ts:652  return shift ? shiftFace(k) : capToken(k)
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

; sci/calc.e16.ts:656 capToken(k) at -O1
;   k in a0
capToken:
  ; sci/calc.e16.ts:657  switch (k) {
  li t0, 35
  beq a0, t0, .L2
  li t0, 24
  beq a0, t0, .L3
  li t0, 22
  beq a0, t0, .L4
  li t0, 17
  beq a0, t0, .L5
  li t0, 18
  beq a0, t0, .L6
  li t0, 19
  beq a0, t0, .L7
  li t0, 20
  beq a0, t0, .L8
  li t0, 21
  beq a0, t0, .L9
  li t0, 27
  beq a0, t0, .L10
  li t0, 28
  beq a0, t0, .L11
  li t0, 29
  beq a0, t0, .L12
  li t0, 33
  beq a0, t0, .L13
  li t0, 34
  beq a0, t0, .L14
  j .L1
.L2:
  ; sci/calc.e16.ts:659  return T_OPEN
  li a0, 40
  ret
.L3:
  ; sci/calc.e16.ts:661  return T_NEG
  li a0, 16
  ret
.L4:
  ; sci/calc.e16.ts:663  return T_EXP
  li a0, 135
  ret
.L5:
  ; sci/calc.e16.ts:665  return T_SQUARE
  li a0, 132
  ret
.L6:
  ; sci/calc.e16.ts:667  return T_CUBE
  li a0, 133
  ret
.L7:
  ; sci/calc.e16.ts:669  return T_POW
  li a0, 17
  ret
.L8:
  ; sci/calc.e16.ts:671  return T_LOG
  li a0, 7
  ret
.L9:
  ; sci/calc.e16.ts:673  return T_LN
  li a0, 8
  ret
.L10:
  ; sci/calc.e16.ts:675  return T_SIN
  li a0, 1
  ret
.L11:
  ; sci/calc.e16.ts:677  return T_COS
  li a0, 2
  ret
.L12:
  ; sci/calc.e16.ts:679  return T_TAN
  li a0, 3
  ret
.L13:
  ; sci/calc.e16.ts:681  return T_INVERSE
  li a0, 134
  ret
.L14:
  ; sci/calc.e16.ts:683  return T_NCR
  li a0, 18
  ret
.L1:
  ; sci/calc.e16.ts:685  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:689 shiftFace(k) at -O1
;   k in a0
shiftFace:
  ; sci/calc.e16.ts:690  switch (k) {
  li t0, 24
  beq a0, t0, .L2
  li t0, 35
  beq a0, t0, .L3
  li t0, 22
  beq a0, t0, .L4
  li t0, 17
  beq a0, t0, .L5
  li t0, 18
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
  ; sci/calc.e16.ts:692  return T_ABS
  li a0, 230
  ret
.L3:
  ; sci/calc.e16.ts:694  return T_COMMA
  li a0, 44
  ret
.L4:
  ; sci/calc.e16.ts:696  return T_PI
  li a0, 128
  ret
.L5:
  ; sci/calc.e16.ts:698  return T_SQRT
  li a0, 9
  ret
.L6:
  ; sci/calc.e16.ts:700  return T_CBRT
  li a0, 10
  ret
.L7:
  ; sci/calc.e16.ts:702  return T_TEN
  li a0, 21
  ret
.L8:
  ; sci/calc.e16.ts:704  return T_E
  li a0, 101
  ret
.L9:
  ; sci/calc.e16.ts:706  return T_ASIN
  li a0, 4
  ret
.L10:
  ; sci/calc.e16.ts:708  return T_ACOS
  li a0, 5
  ret
.L11:
  ; sci/calc.e16.ts:710  return T_ATAN
  li a0, 6
  ret
.L12:
  ; sci/calc.e16.ts:712  return T_BANG
  li a0, 33
  ret
.L13:
  ; sci/calc.e16.ts:714  return T_NPR
  li a0, 19
  ret
.L1:
  ; sci/calc.e16.ts:716  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:720 hypToken(k, shift) at -O1
;   k in a0
;   shift in a1
hypToken:
  ; sci/calc.e16.ts:721  if (k === K_SIN) return shift ? T_ASINH : T_SINH
  li t0, 27
  bne a0, t0, .L1
  ; sci/calc.e16.ts:721  return shift ? T_ASINH : T_SINH
  beqz a1, .L2
  li t0, 227
  j .L3
.L2:
  li t0, 224
.L3:
  mv a0, t0
  ret
.L1:
  ; sci/calc.e16.ts:722  if (k === K_COS) return shift ? T_ACOSH : T_COSH
  li t0, 28
  bne a0, t0, .L4
  ; sci/calc.e16.ts:722  return shift ? T_ACOSH : T_COSH
  beqz a1, .L5
  li t0, 228
  j .L6
.L5:
  li t0, 225
.L6:
  mv a0, t0
  ret
.L4:
  ; sci/calc.e16.ts:723  if (k === K_TAN) return shift ? T_ATANH : T_TANH
  li t0, 29
  bne a0, t0, .L7
  ; sci/calc.e16.ts:723  return shift ? T_ATANH : T_TANH
  beqz a1, .L8
  li t0, 229
  j .L9
.L8:
  li t0, 226
.L9:
  mv a0, t0
  ret
.L7:
  ; sci/calc.e16.ts:724  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:728 letterOf(k) at -O1
;   k in a0
letterOf:
  ; sci/calc.e16.ts:729  switch (k) {
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
  ; sci/calc.e16.ts:731  return 0x41
  li a0, 65
  ret
.L3:
  ; sci/calc.e16.ts:733  return 0x42
  li a0, 66
  ret
.L4:
  ; sci/calc.e16.ts:735  return 0x43
  li a0, 67
  ret
.L5:
  ; sci/calc.e16.ts:737  return 0x44
  li a0, 68
  ret
.L6:
  ; sci/calc.e16.ts:739  return 0x45
  li a0, 69
  ret
.L7:
  ; sci/calc.e16.ts:741  return 0x46
  li a0, 70
  ret
.L8:
  ; sci/calc.e16.ts:743  return 0x58
  li a0, 88
  ret
.L9:
  ; sci/calc.e16.ts:745  return 0x59
  li a0, 89
  ret
.L10:
  ; sci/calc.e16.ts:747  return 0x4d
  li a0, 77
  ret
.L11:
  ; sci/calc.e16.ts:749  return T_E
  li a0, 101
  ret
.L1:
  ; sci/calc.e16.ts:751  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:755 fromAns(t) at -O1
;   t in a0
fromAns:
  ; sci/calc.e16.ts:756  return (
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

; sci/calc.e16.ts:772 type(t) at -O1
;   t in s1
type:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/calc.e16.ts:773  if (answered) {
  lw t0, 0x055c(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:774  answered = false
  sw zero, 0x055c(zero)
  ; sci/calc.e16.ts:775  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x056a(zero)
  ; sci/calc.e16.ts:776  length = 0
  sw zero, 0x0558(zero)
  ; sci/calc.e16.ts:777  cursor = 0
  sw zero, 0x055a(zero)
  ; sci/calc.e16.ts:778  if (fromAns(t)) insert(T_ANS)
  mv a0, s1
  call fromAns
  beqz a0, .L2
  ; sci/calc.e16.ts:778  insert(T_ANS)
  li a0, 20
  call insert
.L2:
.L1:
  ; sci/calc.e16.ts:780  insert(t)
  mv a0, s1
  call insert
  ; sci/calc.e16.ts:781  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:784 insert(t) at -O1
;   t in s1
insert:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/calc.e16.ts:785  if (length >= LINE_MAX) {
  lw t0, 0x0558(zero)
  li t1, 199
  bltu t0, t1, .L1
  ; sci/calc.e16.ts:786  refuse()
  call refuse
  ; sci/calc.e16.ts:787  return
  j .return
.L1:
  ; sci/calc.e16.ts:789  memcpy(addr(line) + cursor + 1, addr(line) + cursor, length - cursor)
  lw t0, 0x055a(zero)
  lw t1, 0x055a(zero)
  lw t2, 0x0558(zero)
  lw t3, 0x055a(zero)
  sub a2, t2, t3
  addi a0, t0, line+1
  addi a1, t1, line
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:790  line[cursor] = t
  lw t0, 0x055a(zero)
  sb s1, line(t0)
  ; sci/calc.e16.ts:791  length++
  lw t0, 0x0558(zero)
  addi t0, t0, 1
  sw t0, 0x0558(zero)
  ; sci/calc.e16.ts:792  cursor++
  lw t0, 0x055a(zero)
  addi t0, t0, 1
  sw t0, 0x055a(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:795 deleteBefore() at -O1
deleteBefore:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:796  if (answered) {
  lw t0, 0x055c(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:797  answered = false
  sw zero, 0x055c(zero)
  ; sci/calc.e16.ts:798  cursor = length
  lw t0, 0x0558(zero)
  sw t0, 0x055a(zero)
.L1:
  ; sci/calc.e16.ts:800  deleteAt(addr(line), length, cursor)
  lw a1, 0x0558(zero)
  lw a2, 0x055a(zero)
  la a0, line
  la t0, deleteAt
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:801  length = editLength
  lw t0, 0x066a(zero)
  sw t0, 0x0558(zero)
  ; sci/calc.e16.ts:802  cursor = editCursor
  lw t0, 0x066c(zero)
  sw t0, 0x055a(zero)
  ; sci/calc.e16.ts:803  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:807 arrow(left) at -O1
;   left in s1
arrow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; left
  ; sci/calc.e16.ts:808  if (answered) {
  lw t0, 0x055c(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:809  answered = false
  sw zero, 0x055c(zero)
  ; sci/calc.e16.ts:810  cursor = left ? length : 0
  beqz s1, .L2
  lw t0, 0x0558(zero)
  j .L3
.L2:
  li t0, 0
.L3:
  sw t0, 0x055a(zero)
  j .L4
.L1:
  ; sci/calc.e16.ts:811  if (left) {
  beqz s1, .L5
  ; sci/calc.e16.ts:812  cursor = cursor > 0 ? cursor - 1 : length
  lw t0, 0x055a(zero)
  bgeu zero, t0, .L6
  lw t0, 0x055a(zero)
  addi t0, t0, -1
  j .L7
.L6:
  lw t0, 0x0558(zero)
.L7:
  sw t0, 0x055a(zero)
  j .L8
.L5:
  ; sci/calc.e16.ts:814  cursor = cursor < length ? cursor + 1 : 0
  lw t0, 0x055a(zero)
  lw t1, 0x0558(zero)
  bgeu t0, t1, .L9
  lw t0, 0x055a(zero)
  addi t0, t0, 1
  j .L10
.L9:
  li t0, 0
.L10:
  sw t0, 0x055a(zero)
.L8:
.L4:
  ; sci/calc.e16.ts:816  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:826 equals(approx) at -O1
;   approx in s2
;   first in s1
equals:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; approx
  ; sci/calc.e16.ts:827  if (length === 0) return
  lw t0, 0x0558(zero)
  bne t0, zero, .L1
  ; sci/calc.e16.ts:827  return
  j .return
.L1:
  ; sci/calc.e16.ts:828  clearStack()
  ; sci/numbers.e16.ts:175  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0468(zero)
  ; sci/calc.e16.ts:829  evaluate(addr(line), length)
  lw a1, 0x0558(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/calc.e16.ts:830  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
  ; sci/calc.e16.ts:831  remember()
  call remember
  ; sci/calc.e16.ts:832  answered = true
  li t0, 1
  sw t0, 0x055c(zero)
  ; sci/calc.e16.ts:833  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x056a(zero)
  ; sci/calc.e16.ts:834  found = false
  sw zero, 0x0568(zero)
  ; sci/calc.e16.ts:835  const first = line[0]
  lbu s1, line(zero)
  ; sci/calc.e16.ts:836  if (first === T_POL || first === T_REC) shown = SHOW_PAIR
  li t0, 235
  beq s1, t0, .L3
  li t0, 236
  bne s1, t0, .L2
.L3:
  ; sci/calc.e16.ts:836  shown = SHOW_PAIR
  li t0, 5
  sw t0, 0x056e(zero)
  j .L4
.L2:
  ; sci/calc.e16.ts:837  shown = firstShown(formFirst(approx))
  mv a0, s2
  call formFirst
  la t0, firstShown
  li t1, 5
  call far_call
  sw a0, 0x056e(zero)
.L4:
  ; sci/calc.e16.ts:838  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:842 formFirst(approx) at -O1
;   approx in s1
formFirst:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; approx
  ; sci/calc.e16.ts:843  return twoD() && !approx && peek(KEEP_ANSWER) === 0 && !decimalTyped()
  call twoD
  mv t1, a0
  mv t0, a0
  beqz t1, .L3
  seqz t0, s1
.L3:
  mv t1, t0
  beqz t1, .L2
  lbu t0, 3076(zero)
  sub t0, t0, zero
  seqz t0, t0
.L2:
  mv t1, t0
  beqz t1, .L1
  call decimalTyped
  seqz t0, a0
.L1:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:847 solveKey(find) at -O1
;   find in s1
solveKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; find
  ; sci/calc.e16.ts:848  if (answered) {
  lw t0, 0x055c(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:849  answered = false
  sw zero, 0x055c(zero)
  ; sci/calc.e16.ts:850  cursor = length
  lw t0, 0x0558(zero)
  sw t0, 0x055a(zero)
.L1:
  ; sci/calc.e16.ts:852  if (length === 0) {
  lw t0, 0x0558(zero)
  bne t0, zero, .L2
  ; sci/calc.e16.ts:853  refuse()
  call refuse
  ; sci/calc.e16.ts:854  return
  j .return
.L2:
  ; sci/calc.e16.ts:856  found = find
  sw s1, 0x0568(zero)
  ; sci/calc.e16.ts:857  screen = S_ASK
  li t0, 5
  sw t0, 0x048e(zero)
  ; sci/calc.e16.ts:858  askStart(addr(line), length, find)
  lw a1, 0x0558(zero)
  la a0, line
  mv a2, s1
  la t0, askStart
  li t1, 6
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:862 decimalTyped() at -O1
;   i in a0
decimalTyped:
  ; sci/calc.e16.ts:863  for (let i: u16 = 0; i < length; i++) {
  li a0, 0 ; i
  j .L3
.L1:
  ; sci/calc.e16.ts:864  if (line[i] === T_POINT) return true
  lbu t0, line(a0)
  li t1, 46
  bne t0, t1, .L5
  ; sci/calc.e16.ts:864  return true
  li a0, 1
  ret
.L5:
  addi a0, a0, 1
.L3:
  lw t0, 0x0558(zero)
  bltu a0, t0, .L1
  ; sci/calc.e16.ts:866  return false
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:873 exactOrDecimal(shift) at -O1
;   shift in s1
exactOrDecimal:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; shift
  ; sci/calc.e16.ts:874  if (!answered || shown === SHOW_PAIR) {
  lw t0, 0x055c(zero)
  beqz t0, .L2
  lw t0, 0x056e(zero)
  li t1, 5
  bne t0, t1, .L1
.L2:
  ; sci/calc.e16.ts:875  refuse()
  call refuse
  ; sci/calc.e16.ts:876  return
  j .return
.L1:
  ; sci/calc.e16.ts:878  if (shift) shown = SHOW_ENG
  beqz s1, .L3
  ; sci/calc.e16.ts:878  shown = SHOW_ENG
  li t0, 3
  sw t0, 0x056e(zero)
  j .L4
.L3:
  ; sci/calc.e16.ts:879  if (twoD() && hasForm()) shown = nextShown(shown)
  call twoD
  beqz a0, .L5
  la t0, hasForm
  li t1, 5
  call far_call
  beqz a0, .L5
  ; sci/calc.e16.ts:879  shown = nextShown(shown)
  lw a0, 0x056e(zero)
  la t0, nextShown
  li t1, 5
  call far_call
  sw a0, 0x056e(zero)
  j .L6
.L5:
  ; sci/calc.e16.ts:880  if (shown !== SHOW_DECIMAL && shown !== SHOW_FOUND) shown = SHOW_DECIMAL
  lw t0, 0x056e(zero)
  beq t0, zero, .L7
  lw t0, 0x056e(zero)
  li t1, 6
  beq t0, t1, .L7
  ; sci/calc.e16.ts:880  shown = SHOW_DECIMAL
  sw zero, 0x056e(zero)
  j .L8
.L7:
  ; sci/calc.e16.ts:882  refuse()
  call refuse
  ; sci/calc.e16.ts:883  return
  j .return
.L8:
.L6:
.L4:
  ; sci/calc.e16.ts:885  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:889 variableKey(k/letter) at -O1
;   k/letter in s1
;   store in s2
variableKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/letter
  ; sci/calc.e16.ts:890  const store = storing
  lw s2, 0x0562(zero)
  ; sci/calc.e16.ts:891  storing = false
  sw zero, 0x0562(zero)
  ; sci/calc.e16.ts:892  recalling = false
  sw zero, 0x0564(zero)
  ; sci/calc.e16.ts:893  const letter = letterOf(k)
  mv a0, s1
  call letterOf
  mv s1, a0 ; k/letter
  ; sci/calc.e16.ts:894  if (letter === 0 || letter === T_E) {
  beq s1, zero, .L2
  li t0, 101
  bne s1, t0, .L1
.L2:
  ; sci/calc.e16.ts:895  refuse()
  call refuse
  ; sci/calc.e16.ts:896  return
  j .return
.L1:
  ; sci/calc.e16.ts:898  if (store) {
  beqz s2, .L3
  ; sci/calc.e16.ts:899  if (!answered && length > 0) {
  lw t0, 0x055c(zero)
  bnez t0, .L4
  lw t0, 0x0558(zero)
  bgeu zero, t0, .L4
  ; sci/calc.e16.ts:900  clearStack()
  ; sci/numbers.e16.ts:175  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0468(zero)
  ; sci/calc.e16.ts:901  evaluate(addr(line), length)
  lw a1, 0x0558(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/calc.e16.ts:902  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
  ; sci/calc.e16.ts:903  remember()
  call remember
.L4:
  ; sci/calc.e16.ts:905  copyValue(KEEP_ANS, varAt(letter))
  mv a0, s1
  call varAt
  mv a1, a0
  li a0, 3080
  call copyValue
  j .L5
.L3:
  ; sci/calc.e16.ts:907  copyValue(varAt(letter), KEEP_ANS)
  mv a0, s1
  call varAt
  li a1, 3080
  call copyValue
.L5:
  ; sci/calc.e16.ts:909  shown = firstShown(formFirst(false))
  li a0, 0
  call formFirst
  la t0, firstShown
  li t1, 5
  call far_call
  sw a0, 0x056e(zero)
  ; sci/calc.e16.ts:910  found = false
  sw zero, 0x0568(zero)
  ; sci/calc.e16.ts:911  length = 0
  sw zero, 0x0558(zero)
  ; sci/calc.e16.ts:912  cursor = 0
  sw zero, 0x055a(zero)
  ; sci/calc.e16.ts:913  insert(T_ANS)
  li a0, 20
  call insert
  ; sci/calc.e16.ts:914  answered = true
  li t0, 1
  sw t0, 0x055c(zero)
  ; sci/calc.e16.ts:915  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:919 memoryPlus(minus/op) at -O1
;   minus/op in s1
;   m in s2
memoryPlus:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; minus/op
  ; sci/calc.e16.ts:920  if (!answered) {
  lw t0, 0x055c(zero)
  bnez t0, .L1
  ; sci/calc.e16.ts:921  if (length === 0) {
  lw t0, 0x0558(zero)
  bne t0, zero, .L2
  ; sci/calc.e16.ts:922  length = 0
  sw zero, 0x0558(zero)
  ; sci/calc.e16.ts:923  insert(T_ANS)
  li a0, 20
  call insert
.L2:
  ; sci/calc.e16.ts:925  clearStack()
  ; sci/numbers.e16.ts:175  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0468(zero)
  ; sci/calc.e16.ts:926  evaluate(addr(line), length)
  lw a1, 0x0558(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/calc.e16.ts:927  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
  ; sci/calc.e16.ts:928  remember()
  call remember
.L1:
  ; sci/calc.e16.ts:930  const m = varAt(0x4d)
  li s2, 3408 ; m
  ; sci/calc.e16.ts:931  const op = minus ? M_SUB : M_ADD
  beqz s1, .L3
  li t0, 2
  j .L4
.L3:
  li t0, 1
.L4:
  mv s1, t0 ; minus/op
  ; sci/calc.e16.ts:932  math(op, m, KEEP_ANS, 0)
  mv a0, s1
  mv a1, s2
  li a2, 3080
  li a3, 0
  call math
  ; sci/calc.e16.ts:933  exactBinary(op, m, KEEP_ANS)
  mv a0, s1
  mv a1, s2
  li a2, 3080
  la t0, exactBinary
  li t1, 2
  call far_call
  ; sci/calc.e16.ts:934  answered = true
  li t0, 1
  sw t0, 0x055c(zero)
  ; sci/calc.e16.ts:935  shown = firstShown(formFirst(false))
  li a0, 0
  call formFirst
  la t0, firstShown
  li t1, 5
  call far_call
  sw a0, 0x056e(zero)
  ; sci/calc.e16.ts:936  found = false
  sw zero, 0x0568(zero)
  ; sci/calc.e16.ts:937  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:943 remember() at -O1
;   count/kept in s1
remember:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/calc.e16.ts:944  const count = peek16(KEEP_HISTORY_COUNT)
  lw s1, 3456(zero)
  ; sci/calc.e16.ts:945  const kept = count < HISTORY_ENTRIES ? count : HISTORY_ENTRIES - 1
  li t0, 10
  bgeu s1, t0, .L1
  mv t0, s1
  j .L2
.L1:
  li t0, 9
.L2:
  mv s1, t0 ; count/kept
  ; sci/calc.e16.ts:946  memcpy(KEEP_HISTORY + HISTORY_SIZE, KEEP_HISTORY, kept * HISTORY_SIZE)
  li t0, 200
  mul a2, s1, t0
  li a0, 3658
  li a1, 3458
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:947  poke(KEEP_HISTORY, length)
  lw t0, 0x0558(zero)
  sb t0, 3458(zero)
  ; sci/calc.e16.ts:948  memcpy(KEEP_HISTORY + 1, addr(line), length)
  lw a2, 0x0558(zero)
  li a0, 3459
  la a1, line
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:949  poke16(KEEP_HISTORY_COUNT, kept + 1)
  addi t0, s1, 1
  sw t0, 3456(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:956 history(older/entry) at -O1
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
  ; sci/calc.e16.ts:957  if (!answered && twoD()) {
  lw t0, 0x055c(zero)
  bnez t0, .L1
  call twoD
  beqz a0, .L1
  ; sci/calc.e16.ts:958  vertical(addr(line), length, cursor, older)
  lw a1, 0x0558(zero)
  lw a2, 0x055a(zero)
  la a0, line
  mv a3, s1
  la t0, vertical
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:959  if (editCursor !== 0xffff) {
  lw t0, 0x066c(zero)
  li t1, 65535
  beq t0, t1, .L2
  ; sci/calc.e16.ts:960  cursor = editCursor
  lw t0, 0x066c(zero)
  sw t0, 0x055a(zero)
  ; sci/calc.e16.ts:961  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:962  return
  j .return
.L2:
.L1:
  ; sci/calc.e16.ts:965  const count = peek16(KEEP_HISTORY_COUNT)
  lw s0, 3456(zero)
  ; sci/calc.e16.ts:966  const browsing = historyAt !== 0xffff
  lw t0, 0x056a(zero)
  li t1, 65535
  sub t0, t0, t1
  snez s3, t0
  ; sci/calc.e16.ts:967  if (!answered && length > 0 && !browsing) return
  lw t0, 0x055c(zero)
  bnez t0, .L3
  lw t0, 0x0558(zero)
  bgeu zero, t0, .L3
  bnez s3, .L3
  ; sci/calc.e16.ts:967  return
  j .return
.L3:
  ; sci/calc.e16.ts:968  let next = historyAt
  lw s2, 0x056a(zero)
  ; sci/calc.e16.ts:969  if (older) next = browsing ? historyAt + 1 : 0
  beqz s1, .L4
  ; sci/calc.e16.ts:969  next = browsing ? historyAt + 1 : 0
  beqz s3, .L5
  lw t0, 0x056a(zero)
  addi t0, t0, 1
  j .L6
.L5:
  li t0, 0
.L6:
  mv s2, t0 ; next
  j .L7
.L4:
  ; sci/calc.e16.ts:970  if (browsing && historyAt > 0) next = historyAt - 1
  beqz s3, .L8
  lw t0, 0x056a(zero)
  bgeu zero, t0, .L8
  ; sci/calc.e16.ts:970  next = historyAt - 1
  lw t0, 0x056a(zero)
  addi s2, t0, -1
  j .L9
.L8:
  ; sci/calc.e16.ts:971  return
  j .return
.L9:
.L7:
  ; sci/calc.e16.ts:972  if (next >= count) return
  bltu s2, s0, .L10
  ; sci/calc.e16.ts:972  return
  j .return
.L10:
  ; sci/calc.e16.ts:973  historyAt = next
  sw s2, 0x056a(zero)
  ; sci/calc.e16.ts:974  const entry = KEEP_HISTORY + next * HISTORY_SIZE
  li t0, 200
  mul t0, s2, t0
  addi s1, t0, 3458
  ; sci/calc.e16.ts:975  length = peek(entry)
  lbu t0, 0(s1)
  sw t0, 0x0558(zero)
  ; sci/calc.e16.ts:976  memcpy(addr(line), entry + 1, length)
  lw a2, 0x0558(zero)
  la a0, line
  addi a1, s1, 1
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:977  cursor = length
  lw t0, 0x0558(zero)
  sw t0, 0x055a(zero)
  ; sci/calc.e16.ts:978  answered = false
  sw zero, 0x055c(zero)
  ; sci/calc.e16.ts:979  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/calc.e16.ts:985 drawMarks() at -O1
;   bits in s1
;   angle/format in s2
drawMarks:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/calc.e16.ts:986  let bits: u16 = 0
  li s1, 0 ; bits
  ; sci/calc.e16.ts:987  if (shifted) bits |= ANN_S
  lw t0, 0x055e(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:987  bits |= ANN_S
  ori s1, s1, 2
.L1:
  ; sci/calc.e16.ts:988  if (alphaOn || storing || recalling) bits |= ANN_A
  lw t0, 0x0560(zero)
  bnez t0, .L3
  lw t0, 0x0562(zero)
  bnez t0, .L3
  lw t0, 0x0564(zero)
  beqz t0, .L2
.L3:
  ; sci/calc.e16.ts:988  bits |= ANN_A
  ori s1, s1, 4
.L2:
  ; sci/calc.e16.ts:989  if (storing) bits |= ANN_STO
  lw t0, 0x0562(zero)
  beqz t0, .L4
  ; sci/calc.e16.ts:989  bits |= ANN_STO
  ori s1, s1, 16
.L4:
  ; sci/calc.e16.ts:990  if (peek(varAt(0x4d) + 2) !== 0) bits |= ANN_M
  lbu t0, 3410(zero)
  beq t0, zero, .L5
  ; sci/calc.e16.ts:990  bits |= ANN_M
  ori s1, s1, 8
.L5:
  ; sci/calc.e16.ts:991  const angle = peek(KEEP_ANGLE)
  lbu s2, 3074(zero)
  ; sci/calc.e16.ts:992  bits |= angle === 1 ? ANN_R : angle === 2 ? ANN_G : ANN_D
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
  ; sci/calc.e16.ts:993  if (twoD()) bits |= ANN_2D
  call twoD
  beqz a0, .L10
  ; sci/calc.e16.ts:993  bits |= ANN_2D
  ori s1, s1, 4096
.L10:
  ; sci/calc.e16.ts:994  if (hyp) bits |= ANN_HYP
  lw t0, 0x0566(zero)
  beqz t0, .L11
  ; sci/calc.e16.ts:994  bits |= ANN_HYP
  ori s1, s1, 32
.L11:
  ; sci/calc.e16.ts:995  const format = peek(KEEP_FORMAT)
  lbu s2, 3077(zero)
  ; sci/calc.e16.ts:996  if (format === FORMAT_FIX) bits |= ANN_FIX
  li t0, 1
  bne s2, t0, .L12
  ; sci/calc.e16.ts:996  bits |= ANN_FIX
  ori s1, s1, 1024
  j .L13
.L12:
  ; sci/calc.e16.ts:997  if (format === FORMAT_EXP) bits |= ANN_EXP
  li t0, 2
  bne s2, t0, .L14
  ; sci/calc.e16.ts:997  bits |= ANN_EXP
  ori s1, s1, 2048
.L14:
.L13:
  ; sci/calc.e16.ts:998  if (screen === S_CALC) bits |= historyMarks()
  lw t0, 0x048e(zero)
  bne t0, zero, .L15
  ; sci/calc.e16.ts:998  bits |= historyMarks()
  call historyMarks
  or s1, s1, a0
.L15:
  ; sci/calc.e16.ts:999  marks(bits)
  ; sci/lcd.e16.ts:171  poke16(IO_ANNUNCIATORS, bits)
  li t0, 65326
  sw s1, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:1003 historyMarks() at -O1
;   count in a1
;   browsing in a2
;   bits in a0
historyMarks:
  ; sci/calc.e16.ts:1004  const count = peek16(KEEP_HISTORY_COUNT)
  lw a1, 3456(zero)
  ; sci/calc.e16.ts:1005  const browsing = historyAt !== 0xffff
  lw t0, 0x056a(zero)
  li t1, 65535
  sub t0, t0, t1
  snez a2, t0
  ; sci/calc.e16.ts:1006  let bits: u16 = 0
  li a0, 0 ; bits
  ; sci/calc.e16.ts:1007  if (browsing ? historyAt + 1 < count : count > 0 && (answered || length === 0)) bits |= ANN_UP
  beqz a2, .L2
  lw t0, 0x056a(zero)
  addi t0, t0, 1
  sltu t0, t0, a1
  j .L3
.L2:
  sltu t0, zero, a1
  mv t1, t0
  beqz t1, .L4
  lw t0, 0x055c(zero)
  mv t1, t0
  bnez t1, .L5
  lw t0, 0x0558(zero)
  sub t0, t0, zero
  seqz t0, t0
.L5:
.L4:
.L3:
  beqz t0, .L1
  ; sci/calc.e16.ts:1007  bits |= ANN_UP
  li t0, 8192
  or a0, a0, t0
.L1:
  ; sci/calc.e16.ts:1008  if (browsing && historyAt > 0) bits |= ANN_DOWN
  beqz a2, .L6
  lw t0, 0x056a(zero)
  bgeu zero, t0, .L6
  ; sci/calc.e16.ts:1008  bits |= ANN_DOWN
  li t0, 16384
  or a0, a0, t0
.L6:
  ; sci/calc.e16.ts:1009  return bits
.return:
  ret

; sci/calc.e16.ts:1013 drawCalc() at -O1
drawCalc:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:1014  cls()
  call cls
  ; sci/calc.e16.ts:1015  if (twoD()) drawLine2D()
  call twoD
  beqz a0, .L1
  ; sci/calc.e16.ts:1015  drawLine2D()
  call drawLine2D
  j .L2
.L1:
  ; sci/calc.e16.ts:1016  drawLine()
  call drawLine
.L2:
  ; sci/calc.e16.ts:1017  if (answered) drawAnswerAs(shown)
  lw t0, 0x055c(zero)
  beqz t0, .L3
  ; sci/calc.e16.ts:1017  drawAnswerAs(shown)
  lw a0, 0x056e(zero)
  la t0, drawAnswerAs
  li t1, 5
  call far_call
.L3:
  ; sci/calc.e16.ts:1018  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:1022 drawLine2D() at -O1
drawLine2D:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:1023  setLine(addr(line), length, answered ? 0xffff : cursor)
  lw t1, 0x0558(zero)
  lw t2, 0x055c(zero)
  la t0, line
  beqz t2, .L1
  li t2, 65535
  j .L2
.L1:
  lw t2, 0x055a(zero)
.L2:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  la t0, setLine
  li t1, 3
  call far_call
  ; sci/calc.e16.ts:1024  if (answered) noCursor()
  lw t0, 0x055c(zero)
  beqz t0, .L3
  ; sci/calc.e16.ts:1024  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  j .L4
.L3:
  ; sci/calc.e16.ts:1025  barDots(cursorX, cursorTop)
  lw a0, 0x0662(zero)
  lw a1, 0x0664(zero)
  call barDots
.L4:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:1029 charsTo(n) at -O1
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
  ; sci/calc.e16.ts:1030  let c: u16 = 0
  li s2, 0 ; c
  ; sci/calc.e16.ts:1031  for (let i: u16 = 0; i < n; i++) c += tokenWidth(line[i])
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/calc.e16.ts:1031  c += tokenWidth(line[i])
  lbu a0, line(s1)
  call tokenWidth
  add s2, s2, a0
  addi s1, s1, 1
.L3:
  bltu s1, s3, .L1
  ; sci/calc.e16.ts:1032  return c
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:1039 drawLine() at -O1
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
  ; sci/calc.e16.ts:1040  const at = charsTo(cursor)
  lw a0, 0x055a(zero)
  call charsTo
  mv s1, a0 ; at
  ; sci/calc.e16.ts:1041  if (at < scrollFrom) scrollFrom = at - (at % COLS)
  lw t0, 0x056c(zero)
  bgeu s1, t0, .L1
  ; sci/calc.e16.ts:1041  scrollFrom = at - (at % COLS)
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
  sw t0, 0x056c(zero)
.L1:
  ; sci/calc.e16.ts:1042  if (at >= scrollFrom + LINE_CHARS) scrollFrom = at - (at % COLS) - (LINE_ROWS - 1) * COLS
  lw t0, 0x056c(zero)
  addi t0, t0, 84
  bltu s1, t0, .L2
  ; sci/calc.e16.ts:1042  scrollFrom = at - (at % COLS) - (LINE_ROWS - 1) * COLS
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
  sw t0, 0x056c(zero)
.L2:
  ; sci/calc.e16.ts:1043  let c: u16 = 0
  li s0, 0 ; c
  ; sci/calc.e16.ts:1044  for (let i: u16 = 0; i < length; i++) {
  li s2, 0 ; i/shown
  j .L5
.L3:
  ; sci/calc.e16.ts:1045  const t = line[i]
  lbu t0, line(s2)
  sw t0, 0(sp) ; t
  ; sci/calc.e16.ts:1046  const text = tokenText(t)
  lw a0, 0(sp)
  call tokenText
  mv s3, a0 ; text/p
  ; sci/calc.e16.ts:1047  if (text === 0) {
  bne s3, zero, .L7
  ; sci/calc.e16.ts:1048  showChar(t, c)
  lw a0, 0(sp)
  mv a1, s0
  call showChar
  ; sci/calc.e16.ts:1049  c++
  addi s0, s0, 1
  j .L8
.L7:
  ; sci/calc.e16.ts:1051  let p = text
  ; sci/calc.e16.ts:1052  while (peek(p) !== 0) {
  j .L11
.L9:
  ; sci/calc.e16.ts:1053  showChar(peek(p), c)
  lbu a0, 0(s3)
  mv a1, s0
  call showChar
  ; sci/calc.e16.ts:1054  c++
  addi s0, s0, 1
  ; sci/calc.e16.ts:1055  p++
  addi s3, s3, 1
.L11:
  lbu t0, 0(s3)
  bne t0, zero, .L9
.L8:
  addi s2, s2, 1
.L5:
  lw t0, 0x0558(zero)
  bltu s2, t0, .L3
  ; sci/calc.e16.ts:1059  if (answered) {
  lw t0, 0x055c(zero)
  beqz t0, .L13
  ; sci/calc.e16.ts:1060  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:1061  return
  j .return
.L13:
  ; sci/calc.e16.ts:1063  const shown = at - scrollFrom
  lw t0, 0x056c(zero)
  sub s2, s1, t0
  ; sci/calc.e16.ts:1064  barAt(shown % COLS, div(shown, COLS))
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

; sci/calc.e16.ts:1068 showChar(ch, c/shown) at -O1
;   ch in s2
;   c/shown in s1
showChar:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; ch
  mv s1, a1 ; c/shown
  ; sci/calc.e16.ts:1069  if (c < scrollFrom || c >= scrollFrom + LINE_CHARS) return
  lw t0, 0x056c(zero)
  bltu s1, t0, .L2
  lw t0, 0x056c(zero)
  addi t0, t0, 84
  bltu s1, t0, .L1
.L2:
  ; sci/calc.e16.ts:1069  return
  j .return
.L1:
  ; sci/calc.e16.ts:1070  const shown = c - scrollFrom
  lw t0, 0x056c(zero)
  sub s1, s1, t0
  ; sci/calc.e16.ts:1071  drawChar(ch, shown % COLS, div(shown, COLS))
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
  .byte 32, 0
str_21:
  .byte 41, 131, 40, 0
str_22:
  .byte 115, 105, 110, 104, 40, 0
str_23:
  .byte 99, 111, 115, 104, 40, 0
str_24:
  .byte 116, 97, 110, 104, 40, 0
str_25:
  .byte 115, 105, 110, 104, 134, 40, 0
str_26:
  .byte 99, 111, 115, 104, 134, 40, 0
str_27:
  .byte 116, 97, 110, 104, 134, 40, 0
str_28:
  .byte 65, 98, 115, 40, 0
str_29:
  .byte 103, 99, 100, 40, 0
str_30:
  .byte 108, 99, 109, 40, 0
str_31:
  .byte 73, 110, 116, 40, 0
str_32:
  .byte 82, 110, 100, 40, 0
str_33:
  .byte 80, 111, 108, 40, 0
str_34:
  .byte 82, 101, 99, 40, 0
str_35:
  .byte 82, 97, 110, 35, 0
str_36:
  .byte 69, 76, 69, 67, 45, 49, 54, 32, 83, 67, 73, 0
str_37:
  .byte 83, 67, 73, 45, 49, 50, 56, 0
  .align 2
e16c_fixed_end:

  .bank 0
  .org 0xc000
; sci/eval.e16.ts:159 tok() at -O1
tok:
  ; sci/eval.e16.ts:160  return pos < lineLength ? peek(lineAt + pos) : 0
  lw t0, 0x0574(zero)
  lw t1, 0x0572(zero)
  bgeu t0, t1, .L1
  lw t0, 0x0570(zero)
  lw t1, 0x0574(zero)
  add t0, t0, t1
  lbu t0, 0(t0)
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
.return:
  ret

; sci/eval.e16.ts:167 evaluate(at, length) at -O1
;   at in s2
;   length in s1
evaluate:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; at
  mv s1, a1 ; length
  ; sci/eval.e16.ts:168  lineAt = at
  sw s2, 0x0570(zero)
  ; sci/eval.e16.ts:169  lineLength = length
  sw s1, 0x0572(zero)
  ; sci/eval.e16.ts:170  pos = 0
  sw zero, 0x0574(zero)
  ; sci/eval.e16.ts:171  poke16(MATH_ANGLE, peek(KEEP_ANGLE))
  lbu t0, 3074(zero)
  li t1, 65372
  sw t0, 0(t1)
  ; sci/eval.e16.ts:172  if (length === 0) fail(E_SYNTAX, 0)
  bne s1, zero, .L1
  ; sci/eval.e16.ts:172  fail(E_SYNTAX, 0)
  li a0, 2
  li a1, 0
  call fail
.L1:
  ; sci/eval.e16.ts:173  sum()
  call sum
  ; sci/eval.e16.ts:174  if (pos < lineLength) fail(E_SYNTAX, pos)
  lw t0, 0x0574(zero)
  lw t1, 0x0572(zero)
  bgeu t0, t1, .L2
  ; sci/eval.e16.ts:174  fail(E_SYNTAX, pos)
  lw a1, 0x0574(zero)
  li a0, 2
  call fail
.L2:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:177 sum() at -O1
;   t in s1
;   at in s2
sum:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:178  prod()
  call prod
  ; sci/eval.e16.ts:179  for (;;) {
.L1:
  ; sci/eval.e16.ts:180  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:181  if (t !== T_PLUS && t !== T_MINUS) return
  li t0, 43
  beq s1, t0, .L5
  li t0, 45
  beq s1, t0, .L5
  ; sci/eval.e16.ts:181  return
  j .return
.L5:
  ; sci/eval.e16.ts:182  const at = pos
  lw s2, 0x0574(zero)
  ; sci/eval.e16.ts:183  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
  ; sci/eval.e16.ts:184  prod()
  call prod
  ; sci/eval.e16.ts:185  binary(t === T_PLUS ? M_ADD : M_SUB, at)
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

; sci/eval.e16.ts:189 prod() at -O1
;   t in s1
;   at in s2
prod:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:190  implied()
  call implied
  ; sci/eval.e16.ts:191  for (;;) {
.L1:
  ; sci/eval.e16.ts:192  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:193  if (t !== T_TIMES && t !== T_DIVIDE) return
  li t0, 129
  beq s1, t0, .L5
  li t0, 130
  beq s1, t0, .L5
  ; sci/eval.e16.ts:193  return
  j .return
.L5:
  ; sci/eval.e16.ts:194  const at = pos
  lw s2, 0x0574(zero)
  ; sci/eval.e16.ts:195  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
  ; sci/eval.e16.ts:196  implied()
  call implied
  ; sci/eval.e16.ts:197  binary(t === T_TIMES ? M_MUL : M_DIV, at)
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

; sci/eval.e16.ts:202 startsValue(t) at -O1
;   t in s1
startsValue:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/eval.e16.ts:203  return (
  mv a0, s1
  call isDigit
  mv t1, a0
  mv t0, a0
  bnez t1, .L14
  li t0, 46
  sub t0, s1, t0
  seqz t0, t0
.L14:
  mv t1, t0
  bnez t1, .L13
  li t0, 135
  sub t0, s1, t0
  seqz t0, t0
.L13:
  mv t1, t0
  bnez t1, .L12
  li t0, 40
  sub t0, s1, t0
  seqz t0, t0
.L12:
  mv t1, t0
  bnez t1, .L11
  li t0, 128
  sub t0, s1, t0
  seqz t0, t0
.L11:
  mv t1, t0
  bnez t1, .L10
  li t0, 101
  sub t0, s1, t0
  seqz t0, t0
.L10:
  mv t1, t0
  bnez t1, .L9
  li t0, 20
  sub t0, s1, t0
  seqz t0, t0
.L9:
  mv t1, t0
  bnez t1, .L8
  li t0, 21
  sub t0, s1, t0
  seqz t0, t0
.L8:
  mv t1, t0
  bnez t1, .L7
  li t0, 22
  sub t0, s1, t0
  seqz t0, t0
.L7:
  mv t1, t0
  bnez t1, .L6
  li t0, 25
  sub t0, s1, t0
  seqz t0, t0
.L6:
  mv t1, t0
  bnez t1, .L5
  li t0, 28
  sub t0, s1, t0
  seqz t0, t0
.L5:
  mv t1, t0
  bnez t1, .L4
  li t0, 30
  sub t0, s1, t0
  seqz t0, t0
.L4:
  mv t1, t0
  bnez t1, .L3
  li t0, 237
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

; sci/eval.e16.ts:222 implied() at -O1
;   at in s1
implied:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/eval.e16.ts:223  comb()
  call comb
  ; sci/eval.e16.ts:224  while (startsValue(tok())) {
  j .L3
.L1:
  ; sci/eval.e16.ts:225  const at = pos
  lw s1, 0x0574(zero)
  ; sci/eval.e16.ts:226  comb()
  call comb
  ; sci/eval.e16.ts:227  binary(M_MUL, at)
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

; sci/eval.e16.ts:231 comb() at -O1
;   t in s1
;   at in s2
comb:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:232  slash()
  call slash
  ; sci/eval.e16.ts:233  for (;;) {
.L1:
  ; sci/eval.e16.ts:234  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:235  if (t !== T_NCR && t !== T_NPR) return
  li t0, 18
  beq s1, t0, .L5
  li t0, 19
  beq s1, t0, .L5
  ; sci/eval.e16.ts:235  return
  j .return
.L5:
  ; sci/eval.e16.ts:236  const at = pos
  lw s2, 0x0574(zero)
  ; sci/eval.e16.ts:237  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
  ; sci/eval.e16.ts:238  slash()
  call slash
  ; sci/eval.e16.ts:239  choose(t === T_NCR, at)
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

; sci/eval.e16.ts:244 slash() at -O1
;   at in s1
slash:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/eval.e16.ts:245  unary()
  call unary
  ; sci/eval.e16.ts:246  while (tok() === T_SLASH) {
  j .L3
.L1:
  ; sci/eval.e16.ts:247  const at = pos
  lw s1, 0x0574(zero)
  ; sci/eval.e16.ts:248  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
  ; sci/eval.e16.ts:249  unary()
  call unary
  ; sci/eval.e16.ts:250  binary(M_DIV, at)
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

; sci/eval.e16.ts:254 unary() at -O1
;   t/at in s1
unary:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/eval.e16.ts:255  const t = tok()
  call tok
  mv s1, a0 ; t/at
  ; sci/eval.e16.ts:256  if (t === T_NEG || t === T_MINUS) {
  li t0, 16
  beq s1, t0, .L2
  li t0, 45
  bne s1, t0, .L1
.L2:
  ; sci/eval.e16.ts:257  const at = pos
  lw s1, 0x0574(zero)
  ; sci/eval.e16.ts:258  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
  ; sci/eval.e16.ts:259  unary()
  call unary
  ; sci/eval.e16.ts:260  math(M_NEG, top(), 0, at)
  call top
  mv a1, a0
  li a0, 16
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:261  exactNeg(top())
  call top
  la t0, exactNeg
  li t1, 2
  call far_call
  ; sci/eval.e16.ts:262  return
  j .return
.L1:
  ; sci/eval.e16.ts:264  if (t === T_PLUS) {
  li t0, 43
  bne s1, t0, .L3
  ; sci/eval.e16.ts:265  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
  ; sci/eval.e16.ts:266  unary()
  call unary
  ; sci/eval.e16.ts:267  return
  j .return
.L3:
  ; sci/eval.e16.ts:269  post()
  call post
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:272 post() at -O1
;   t in s1
;   at in s2
post:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:273  primary()
  call primary
  ; sci/eval.e16.ts:274  for (;;) {
.L1:
  ; sci/eval.e16.ts:275  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:276  const at = pos
  lw s2, 0x0574(zero)
  ; sci/eval.e16.ts:277  if (t === T_POW || t === T_POWT) {
  li t0, 17
  beq s1, t0, .L6
  li t0, 26
  bne s1, t0, .L5
.L6:
  ; sci/eval.e16.ts:278  powers()
  call powers
  j .L1
.L5:
  ; sci/eval.e16.ts:279  if (t === T_SQUARE) {
  li t0, 132
  bne s1, t0, .L8
  ; sci/eval.e16.ts:280  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
  ; sci/eval.e16.ts:281  raise(2, at)
  li a0, 2
  mv a1, s2
  call raise
  j .L1
.L8:
  ; sci/eval.e16.ts:282  if (t === T_CUBE) {
  li t0, 133
  bne s1, t0, .L10
  ; sci/eval.e16.ts:283  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
  ; sci/eval.e16.ts:284  raise(3, at)
  li a0, 3
  mv a1, s2
  call raise
  j .L1
.L10:
  ; sci/eval.e16.ts:285  if (t === T_INVERSE) {
  li t0, 134
  bne s1, t0, .L12
  ; sci/eval.e16.ts:286  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
  ; sci/eval.e16.ts:287  inverse(at)
  mv a0, s2
  call inverse
  j .L1
.L12:
  ; sci/eval.e16.ts:288  if (t === T_BANG) {
  li t0, 33
  bne s1, t0, .L14
  ; sci/eval.e16.ts:289  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
  ; sci/eval.e16.ts:290  factorial(at)
  mv a0, s2
  call factorial
  j .L1
.L14:
  ; sci/eval.e16.ts:291  if (t === T_PERCENT) {
  li t0, 37
  bne s1, t0, .L16
  ; sci/eval.e16.ts:292  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
  ; sci/eval.e16.ts:293  pushInt(100, at)
  li a0, 100
  mv a1, s2
  call pushInt
  ; sci/eval.e16.ts:294  binary(M_DIV, at)
  li a0, 4
  mv a1, s2
  call binary
  j .L1
.L16:
  ; sci/eval.e16.ts:295  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:300 powers() at -O1
;   at in s1
;   template in s2
powers:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:301  const at = pos
  lw s1, 0x0574(zero)
  ; sci/eval.e16.ts:302  const template = tok() === T_POWT
  call tok
  li t0, 26
  sub t0, a0, t0
  seqz s2, t0
  ; sci/eval.e16.ts:303  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
  ; sci/eval.e16.ts:304  sum()
  call sum
  ; sci/eval.e16.ts:305  if (template) expect(T_END)
  beqz s2, .L1
  ; sci/eval.e16.ts:305  expect(T_END)
  li a0, 24
  call expect
  j .L2
.L1:
  ; sci/eval.e16.ts:306  if (tok() === T_CLOSE) pos++
  call tok
  li t0, 41
  bne a0, t0, .L3
  ; sci/eval.e16.ts:306  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
.L3:
.L2:
  ; sci/eval.e16.ts:308  if (tok() === T_POW || tok() === T_POWT) powers()
  call tok
  li t0, 17
  beq a0, t0, .L5
  call tok
  li t0, 26
  bne a0, t0, .L4
.L5:
  ; sci/eval.e16.ts:308  powers()
  call powers
.L4:
  ; sci/eval.e16.ts:309  binary(M_POW, at)
  li a0, 5
  mv a1, s1
  call binary
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:313 expect(t) at -O1
;   t in s1
expect:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/eval.e16.ts:314  if (tok() !== t) fail(E_SYNTAX, pos)
  call tok
  beq a0, s1, .L1
  ; sci/eval.e16.ts:314  fail(E_SYNTAX, pos)
  lw a1, 0x0574(zero)
  li a0, 2
  call fail
.L1:
  ; sci/eval.e16.ts:315  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:318 raise(n, at) at -O1
;   n in s2
;   at in s1
raise:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; n
  mv s1, a1 ; at
  ; sci/eval.e16.ts:319  pushInt(n, at)
  mv a0, s2
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:320  binary(M_POW, at)
  li a0, 5
  mv a1, s1
  call binary
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:324 inverse(at) at -O1
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
  ; sci/eval.e16.ts:325  const x = top()
  call top
  mv s2, a0 ; x
  ; sci/eval.e16.ts:326  const one = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  mv s3, a0 ; one
  ; sci/eval.e16.ts:327  copyValue(x, push(at))
  mv a0, s1
  call push
  mv a1, a0
  mv a0, s2
  call copyValue
  ; sci/eval.e16.ts:328  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:329  copyValue(one, x)
  mv a0, s3
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:330  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/eval.e16.ts:334 factorial(at) at -O1
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
  ; sci/eval.e16.ts:335  const x = top()
  call top
  mv s3, a0 ; x
  ; sci/eval.e16.ts:336  const n = smallWhole(x, at)
  mv a0, s3
  mv a1, s1
  call smallWhole
  mv s0, a0 ; n
  ; sci/eval.e16.ts:337  if (n > 69) fail(E_MATH, at)
  li t0, 69
  bgeu t0, s0, .L1
  ; sci/eval.e16.ts:337  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L1:
  ; sci/eval.e16.ts:338  const f = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  sw a0, 0(sp) ; f
  ; sci/eval.e16.ts:339  for (let k: u16 = 2; k <= n; k++) {
  li s2, 2 ; k
  j .L4
.L2:
  ; sci/eval.e16.ts:340  pushInt(k, at)
  mv a0, s2
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:341  binary(M_MUL, at)
  li a0, 3
  mv a1, s1
  call binary
  addi s2, s2, 1
.L4:
  bgeu s0, s2, .L2
  ; sci/eval.e16.ts:343  copyValue(f, x)
  lw a0, 0(sp)
  mv a1, s3
  call copyValue
  ; sci/eval.e16.ts:344  pop()
  call pop
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  lw s2, 10(sp)
  addi sp, sp, 12
  ret

; sci/eval.e16.ts:348 choose(c, at) at -O1
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
  ; sci/eval.e16.ts:349  const r = top()
  call top
  mv s2, a0 ; r/rv
  ; sci/eval.e16.ts:350  const n = r - VALUE_SIZE
  addi s0, s2, -36
  ; sci/eval.e16.ts:351  const nv = smallWhole(n, at)
  mv a0, s0
  mv a1, s1
  call smallWhole
  sw a0, 0(sp) ; nv
  ; sci/eval.e16.ts:352  const rv = smallWhole(r, at)
  mv a0, s2
  mv a1, s1
  call smallWhole
  mv s2, a0 ; r/rv
  ; sci/eval.e16.ts:353  if (rv > nv) fail(E_MATH, at)
  lw t0, 0(sp) ; nv
  bgeu t0, s2, .L1
  ; sci/eval.e16.ts:353  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L1:
  ; sci/eval.e16.ts:354  const out = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  sw a0, 4(sp) ; out
  ; sci/eval.e16.ts:355  for (let k: u16 = 0; k < rv; k++) {
  li s3, 0 ; k
  j .L4
.L2:
  ; sci/eval.e16.ts:356  pushInt(nv - k, at)
  lw t0, 0(sp) ; nv
  sub a0, t0, s3
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:357  binary(M_MUL, at)
  li a0, 3
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:358  if (c) {
  lw t0, 2(sp) ; c
  beqz t0, .L6
  ; sci/eval.e16.ts:359  pushInt(k + 1, at)
  addi a0, s3, 1
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:360  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
.L6:
  addi s3, s3, 1
.L4:
  bltu s3, s2, .L2
  ; sci/eval.e16.ts:363  copyValue(out, n)
  lw a0, 4(sp)
  mv a1, s0
  call copyValue
  ; sci/eval.e16.ts:364  pop()
  call pop
  ; sci/eval.e16.ts:365  pop()
  call pop
.return:
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  lw s3, 14(sp)
  addi sp, sp, 16
  ret

; sci/eval.e16.ts:368 primary() at -O1
;   t in s1
;   at in s2
primary:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:369  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:370  const at = pos
  lw s2, 0x0574(zero)
  ; sci/eval.e16.ts:371  if (isDigit(t) || t === T_POINT || t === T_EXP) {
  mv a0, s1
  call isDigit
  bnez a0, .L2
  li t0, 46
  beq s1, t0, .L2
  li t0, 135
  bne s1, t0, .L1
.L2:
  ; sci/eval.e16.ts:372  number()
  call number
  ; sci/eval.e16.ts:373  return
  j .return
.L1:
  ; sci/eval.e16.ts:375  if (t === 0) fail(E_SYNTAX, at)
  bne s1, zero, .L3
  ; sci/eval.e16.ts:375  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s2
  call fail
.L3:
  ; sci/eval.e16.ts:376  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
  ; sci/eval.e16.ts:377  if (!constant(t, at)) bracketed(t, at)
  mv a0, s1
  mv a1, s2
  call constant
  bnez a0, .L4
  ; sci/eval.e16.ts:377  bracketed(t, at)
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

; sci/eval.e16.ts:381 constant(t/n, at) at -O1
;   t/n in s1
;   at in s2
constant:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t/n
  mv s2, a1 ; at
  ; sci/eval.e16.ts:382  if (t === T_PI) {
  li t0, 128
  bne s1, t0, .L1
  ; sci/eval.e16.ts:383  math(M_PI, push(at), 0, at)
  mv a0, s2
  call push
  mv a1, a0
  li a0, 32
  li a2, 0
  mv a3, s2
  call math
  j .L2
.L1:
  ; sci/eval.e16.ts:384  if (t === T_E) {
  li t0, 101
  bne s1, t0, .L3
  ; sci/eval.e16.ts:385  const n = pushInt(1, at)
  li a0, 1
  mv a1, s2
  call pushInt
  mv s1, a0 ; t/n
  ; sci/eval.e16.ts:386  math(M_EXP, n, 0, at)
  li a0, 30
  mv a1, s1
  li a2, 0
  mv a3, s2
  call math
  ; sci/eval.e16.ts:387  inexact(n)
  mv a0, s1
  call inexact
  j .L4
.L3:
  ; sci/eval.e16.ts:388  if (t === T_TEN) {
  li t0, 21
  bne s1, t0, .L5
  ; sci/eval.e16.ts:389  pushInt(10, at)
  li a0, 10
  mv a1, s2
  call pushInt
  j .L6
.L5:
  ; sci/eval.e16.ts:390  if (t === T_ANS) {
  li t0, 20
  bne s1, t0, .L7
  ; sci/eval.e16.ts:391  copyValue(KEEP_ANS, push(at))
  mv a0, s2
  call push
  mv a1, a0
  li a0, 3080
  call copyValue
  j .L8
.L7:
  ; sci/eval.e16.ts:392  if (isVariable(t)) {
  mv a0, s1
  call isVariable
  beqz a0, .L9
  ; sci/eval.e16.ts:393  copyValue(varAt(t), push(at))
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
  ; sci/eval.e16.ts:394  if (t === T_RAN) {
  li t0, 237
  bne s1, t0, .L11
  ; sci/eval.e16.ts:395  math(M_RND, push(at), 0, at)
  mv a0, s2
  call push
  mv a1, a0
  li a0, 31
  li a2, 0
  mv a3, s2
  call math
  j .L12
.L11:
  ; sci/eval.e16.ts:396  return false
  li a0, 0
  j .return
.L12:
.L10:
.L8:
.L6:
.L4:
.L2:
  ; sci/eval.e16.ts:397  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:401 bracketed(t, at) at -O1
;   t in s1
;   at in s2
bracketed:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t
  mv s2, a1 ; at
  ; sci/eval.e16.ts:402  if (template(t, at)) return
  mv a0, s1
  mv a1, s2
  call template
  beqz a0, .L1
  ; sci/eval.e16.ts:402  return
  j .return
.L1:
  ; sci/eval.e16.ts:403  if (t === T_OPEN) {
  li t0, 40
  bne s1, t0, .L2
  ; sci/eval.e16.ts:404  sum()
  call sum
  ; sci/eval.e16.ts:405  if (tok() === T_CLOSE) pos++
  call tok
  li t0, 41
  bne a0, t0, .L4
  ; sci/eval.e16.ts:405  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
  j .L4
.L2:
  ; sci/eval.e16.ts:406  if (isFunction(t)) {
  mv a0, s1
  call isFunction
  beqz a0, .L5
  ; sci/eval.e16.ts:407  sum()
  call sum
  ; sci/eval.e16.ts:408  if (takesTwo(t)) {
  mv a0, s1
  call takesTwo
  beqz a0, .L6
  ; sci/eval.e16.ts:409  expect(T_COMMA)
  li a0, 44
  call expect
  ; sci/eval.e16.ts:410  sum()
  call sum
.L6:
  ; sci/eval.e16.ts:412  if (tok() === T_CLOSE) pos++
  call tok
  li t0, 41
  bne a0, t0, .L7
  ; sci/eval.e16.ts:412  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
.L7:
  ; sci/eval.e16.ts:413  if (takesTwo(t)) applyTwo(t, at)
  mv a0, s1
  call takesTwo
  beqz a0, .L8
  ; sci/eval.e16.ts:413  applyTwo(t, at)
  mv a0, s1
  mv a1, s2
  call applyTwo
  j .L10
.L8:
  ; sci/eval.e16.ts:414  apply(t, at)
  mv a0, s1
  mv a1, s2
  call apply
  j .L10
.L5:
  ; sci/eval.e16.ts:415  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s2
  call fail
.L10:
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:419 template(t, at) at -O1
;   t in s1
;   at in s2
template:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t
  mv s2, a1 ; at
  ; sci/eval.e16.ts:420  if (t === T_MIXED) {
  li t0, 28
  bne s1, t0, .L1
  ; sci/eval.e16.ts:421  mixed(at)
  mv a0, s2
  call mixed
  ; sci/eval.e16.ts:422  return true
  li a0, 1
  j .return
.L1:
  ; sci/eval.e16.ts:424  if (t === T_XROOT) {
  li t0, 30
  bne s1, t0, .L2
  ; sci/eval.e16.ts:425  sum()
  call sum
  ; sci/eval.e16.ts:426  expect(T_XSEP)
  li a0, 11
  call expect
  ; sci/eval.e16.ts:427  sum()
  call sum
  ; sci/eval.e16.ts:428  expect(T_END)
  li a0, 24
  call expect
  ; sci/eval.e16.ts:429  anyRoot(at)
  mv a0, s2
  call anyRoot
  ; sci/eval.e16.ts:430  return true
  li a0, 1
  j .return
.L2:
  ; sci/eval.e16.ts:432  if (t === T_FRAC) {
  li t0, 22
  bne s1, t0, .L3
  ; sci/eval.e16.ts:433  sum()
  call sum
  ; sci/eval.e16.ts:434  expect(T_SEP)
  li a0, 23
  call expect
  ; sci/eval.e16.ts:435  sum()
  call sum
  ; sci/eval.e16.ts:436  expect(T_END)
  li a0, 24
  call expect
  ; sci/eval.e16.ts:437  binary(M_DIV, at)
  li a0, 4
  mv a1, s2
  call binary
  j .L4
.L3:
  ; sci/eval.e16.ts:438  if (t === T_ROOT) {
  li t0, 25
  bne s1, t0, .L5
  ; sci/eval.e16.ts:439  sum()
  call sum
  ; sci/eval.e16.ts:440  expect(T_END)
  li a0, 24
  call expect
  ; sci/eval.e16.ts:441  math(M_SQR, top(), 0, at)
  call top
  mv a1, a0
  li a0, 21
  li a2, 0
  mv a3, s2
  call math
  ; sci/eval.e16.ts:442  exactSqrt(top())
  call top
  la t0, exactSqrt
  li t1, 2
  call far_call
  j .L6
.L5:
  ; sci/eval.e16.ts:443  return false
  li a0, 0
  j .return
.L6:
.L4:
  ; sci/eval.e16.ts:444  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:448 mixed(at) at -O1
;   at in s1
mixed:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; sci/eval.e16.ts:449  sum()
  call sum
  ; sci/eval.e16.ts:450  expect(T_MSEP)
  li a0, 29
  call expect
  ; sci/eval.e16.ts:451  sum()
  call sum
  ; sci/eval.e16.ts:452  expect(T_MDIV)
  li a0, 31
  call expect
  ; sci/eval.e16.ts:453  sum()
  call sum
  ; sci/eval.e16.ts:454  expect(T_END)
  li a0, 24
  call expect
  ; sci/eval.e16.ts:455  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:456  binary(isNegative(top() - VALUE_SIZE) ? M_SUB : M_ADD, at)
  call top
  addi a0, a0, -36
  call isNegative
  beqz a0, .L1
  li t0, 2
  j .L2
.L1:
  li t0, 1
.L2:
  mv a0, t0
  mv a1, s1
  call binary
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:463 anyRoot(at) at -O1
;   at in s1
;   x in s2
;   n in s3
;   negative in 0(sp)
;   two/power in s0
anyRoot:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s0, 10(sp)
  mv s1, a0 ; at
  ; sci/eval.e16.ts:464  const x = top()
  call top
  mv s2, a0 ; x
  ; sci/eval.e16.ts:465  const n = x - VALUE_SIZE
  addi s3, s2, -36
  ; sci/eval.e16.ts:466  const negative = isNegative(x)
  mv a0, s2
  call isNegative
  sw a0, 0(sp) ; negative
  ; sci/eval.e16.ts:467  if (negative) {
  lw t0, 0(sp) ; negative
  beqz t0, .L1
  ; sci/eval.e16.ts:468  if ((smallWhole(n, at) & 1) === 0) fail(E_MATH, at)
  mv a0, s3
  mv a1, s1
  call smallWhole
  andi t0, a0, 1
  bne t0, zero, .L2
  ; sci/eval.e16.ts:468  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L2:
  ; sci/eval.e16.ts:469  math(M_NEG, x, 0, at)
  li a0, 16
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
.L1:
  ; sci/eval.e16.ts:471  const two = pushInt(2, at)
  li a0, 2
  mv a1, s1
  call pushInt
  mv s0, a0 ; two/power
  ; sci/eval.e16.ts:472  math(M_CMP, n, two, at)
  li a0, 6
  mv a1, s3
  mv a2, s0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:473  pop()
  call pop
  ; sci/eval.e16.ts:474  if (peek16(MATH_RESULT) === 0) {
  li t0, 65370
  lw t0, 0(t0)
  bne t0, zero, .L3
  ; sci/eval.e16.ts:475  math(M_SQR, x, 0, at)
  li a0, 21
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:476  exactSqrt(x)
  mv a0, s2
  la t0, exactSqrt
  li t1, 2
  call far_call
  j .L4
.L3:
  ; sci/eval.e16.ts:478  const power = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  mv s0, a0 ; two/power
  ; sci/eval.e16.ts:479  copyValue(n, push(at))
  mv a0, s1
  call push
  mv a1, a0
  mv a0, s3
  call copyValue
  ; sci/eval.e16.ts:480  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:481  math(M_POW, x, power, at)
  li a0, 5
  mv a1, s2
  mv a2, s0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:482  pop()
  call pop
  ; sci/eval.e16.ts:483  exactWhole(x)
  mv a0, s2
  la t0, exactWhole
  li t1, 2
  call far_call
.L4:
  ; sci/eval.e16.ts:485  if (negative) {
  lw t0, 0(sp) ; negative
  beqz t0, .L5
  ; sci/eval.e16.ts:486  math(M_NEG, x, 0, at)
  li a0, 16
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:487  exactNeg(x)
  mv a0, s2
  la t0, exactNeg
  li t1, 2
  call far_call
.L5:
  ; sci/eval.e16.ts:489  copyValue(x, n)
  mv a0, s2
  mv a1, s3
  call copyValue
  ; sci/eval.e16.ts:490  pop()
  call pop
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s0, 10(sp)
  addi sp, sp, 12
  ret

; sci/eval.e16.ts:497 number() at -O1
;   at in s3
;   n in s1
;   points/v in s2
;   digits in s0
number:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  ; sci/eval.e16.ts:498  const at = pos
  lw s3, 0x0574(zero)
  ; sci/eval.e16.ts:499  let n: u16 = 0
  li s1, 0 ; n
  ; sci/eval.e16.ts:500  let points: u16 = 0
  li s2, 0 ; points/v
  ; sci/eval.e16.ts:501  let digits: u16 = 0
  li s0, 0 ; digits
  ; sci/eval.e16.ts:502  while (isDigit(tok()) || tok() === T_POINT) {
  j .L3
.L1:
  ; sci/eval.e16.ts:503  if (tok() === T_POINT) points++
  call tok
  li t0, 46
  bne a0, t0, .L5
  ; sci/eval.e16.ts:503  points++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/eval.e16.ts:504  digits++
  addi s0, s0, 1
.L6:
  ; sci/eval.e16.ts:505  if (n < 30) {
  li t0, 30
  bgeu s1, t0, .L7
  ; sci/eval.e16.ts:506  poke(addr(numberText) + n, tok())
  call tok
  sb a0, numberText(s1)
  ; sci/eval.e16.ts:507  n++
  addi s1, s1, 1
.L7:
  ; sci/eval.e16.ts:509  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
.L3:
  call tok
  call isDigit
  bnez a0, .L1
  call tok
  li t0, 46
  beq a0, t0, .L1
  ; sci/eval.e16.ts:511  if (points > 1 || (points === 1 && digits === 0)) fail(E_SYNTAX, at)
  li t0, 1
  bltu t0, s2, .L9
  li t0, 1
  bne s2, t0, .L8
  bne s0, zero, .L8
.L9:
  ; sci/eval.e16.ts:511  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s3
  call fail
.L8:
  ; sci/eval.e16.ts:512  if (tok() === T_EXP) n = exponentPart(digits === 0 ? 0 : n)
  call tok
  li t0, 135
  bne a0, t0, .L10
  ; sci/eval.e16.ts:512  n = exponentPart(digits === 0 ? 0 : n)
  bne s0, zero, .L11
  li t0, 0
  j .L12
.L11:
  mv t0, s1
.L12:
  mv a0, t0
  call exponentPart
  mv s1, a0 ; n
.L10:
  ; sci/eval.e16.ts:513  poke(addr(numberText) + n, 0)
  sb zero, numberText(s1)
  ; sci/eval.e16.ts:514  const v = push(at)
  mv a0, s3
  call push
  mv s2, a0 ; points/v
  ; sci/eval.e16.ts:515  poke16(MATH_ARG, n)
  li t0, 65366
  sw s1, 0(t0)
  ; sci/eval.e16.ts:516  math(M_PARSE, v, addr(numberText), at)
  li a0, 56
  mv a1, s2
  la a2, numberText
  mv a3, s3
  call math
  ; sci/eval.e16.ts:517  exactLiteral(v)
  mv a0, s2
  la t0, exactLiteral
  li t1, 2
  call far_call
  ; sci/eval.e16.ts:518  if (tok() === T_DEG) minutes(at)
  call tok
  li t0, 136
  bne a0, t0, .L13
  ; sci/eval.e16.ts:518  minutes(at)
  mv a0, s3
  call minutes
.L13:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/eval.e16.ts:522 minutes(at) at -O1
;   at in s1
minutes:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; sci/eval.e16.ts:523  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
  ; sci/eval.e16.ts:524  if (startsNumber(tok())) sixtieth(T_MIN, 60, at)
  call tok
  call startsNumber
  beqz a0, .L1
  ; sci/eval.e16.ts:524  sixtieth(T_MIN, 60, at)
  li a0, 137
  li a1, 60
  mv a2, s1
  call sixtieth
.L1:
  ; sci/eval.e16.ts:525  if (startsNumber(tok())) sixtieth(T_SEC, 3600, at)
  call tok
  call startsNumber
  beqz a0, .L2
  ; sci/eval.e16.ts:525  sixtieth(T_SEC, 3600, at)
  li a0, 138
  li a1, 3600
  mv a2, s1
  call sixtieth
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:529 sixtieth(mark, parts, at) at -O1
;   mark in s2
;   parts in s3
;   at in s1
sixtieth:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; mark
  mv s3, a1 ; parts
  mv s1, a2 ; at
  ; sci/eval.e16.ts:530  number()
  call number
  ; sci/eval.e16.ts:531  expect(mark)
  mv a0, s2
  call expect
  ; sci/eval.e16.ts:532  pushInt(parts, at)
  mv a0, s3
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:533  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:534  binary(M_ADD, at)
  li a0, 1
  mv a1, s1
  call binary
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/eval.e16.ts:537 startsNumber(t) at -O1
;   t in s1
startsNumber:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/eval.e16.ts:538  return isDigit(t) || t === T_POINT
  mv a0, s1
  call isDigit
  mv t1, a0
  mv t0, a0
  bnez t1, .L1
  li t0, 46
  sub t0, s1, t0
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:545 exponentPart(n/k) at -O1
;   n/k in s1
exponentPart:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n/k
  ; sci/eval.e16.ts:546  let k = n
  ; sci/eval.e16.ts:547  if (k === 0) {
  bne s1, zero, .L1
  ; sci/eval.e16.ts:548  poke(addr(numberText), 0x31)
  li t0, 49
  sb t0, numberText(zero)
  ; sci/eval.e16.ts:549  k = 1
  li s1, 1 ; n/k
.L1:
  ; sci/eval.e16.ts:551  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
  ; sci/eval.e16.ts:552  poke(addr(numberText) + k, 0x45)
  li t0, 69
  sb t0, numberText(s1)
  ; sci/eval.e16.ts:553  k++
  addi s1, s1, 1
  ; sci/eval.e16.ts:554  if (tok() === T_NEG || tok() === T_MINUS) {
  call tok
  li t0, 16
  beq a0, t0, .L3
  call tok
  li t0, 45
  bne a0, t0, .L2
.L3:
  ; sci/eval.e16.ts:555  poke(addr(numberText) + k, 0x2d)
  li t0, 45
  sb t0, numberText(s1)
  ; sci/eval.e16.ts:556  k++
  addi s1, s1, 1
  ; sci/eval.e16.ts:557  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
.L2:
  ; sci/eval.e16.ts:559  if (!isDigit(tok())) fail(E_SYNTAX, pos)
  call tok
  call isDigit
  bnez a0, .L7
  ; sci/eval.e16.ts:559  fail(E_SYNTAX, pos)
  lw a1, 0x0574(zero)
  li a0, 2
  call fail
  ; sci/eval.e16.ts:560  while (isDigit(tok())) {
  j .L7
.L5:
  ; sci/eval.e16.ts:561  if (k < 31) {
  li t0, 31
  bgeu s1, t0, .L9
  ; sci/eval.e16.ts:562  poke(addr(numberText) + k, tok())
  call tok
  sb a0, numberText(s1)
  ; sci/eval.e16.ts:563  k++
  addi s1, s1, 1
.L9:
  ; sci/eval.e16.ts:565  pos++
  lw t0, 0x0574(zero)
  addi t0, t0, 1
  sw t0, 0x0574(zero)
.L7:
  call tok
  call isDigit
  bnez a0, .L5
  ; sci/eval.e16.ts:567  return k
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:574 apply(f, at) at -O1
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
  ; sci/eval.e16.ts:575  const x = top()
  call top
  mv s1, a0 ; x
  ; sci/eval.e16.ts:576  copyValue(x, addr(argument))
  mv a0, s1
  la a1, argument
  call copyValue
  ; sci/eval.e16.ts:577  if (f === T_SIN) trig(M_SIN, TRIG_SIN, x, at)
  li t0, 1
  bne s2, t0, .L1
  ; sci/eval.e16.ts:577  trig(M_SIN, TRIG_SIN, x, at)
  li a0, 22
  li a1, 0
  mv a2, s1
  mv a3, s3
  call trig
  j .L2
.L1:
  ; sci/eval.e16.ts:578  if (f === T_COS) trig(M_COS, TRIG_COS, x, at)
  li t0, 2
  bne s2, t0, .L3
  ; sci/eval.e16.ts:578  trig(M_COS, TRIG_COS, x, at)
  li a0, 23
  li a1, 1
  mv a2, s1
  mv a3, s3
  call trig
  j .L4
.L3:
  ; sci/eval.e16.ts:579  if (f === T_TAN) trig(M_TAN, TRIG_TAN, x, at)
  li t0, 3
  bne s2, t0, .L5
  ; sci/eval.e16.ts:579  trig(M_TAN, TRIG_TAN, x, at)
  li a0, 24
  li a1, 2
  mv a2, s1
  mv a3, s3
  call trig
  j .L6
.L5:
  ; sci/eval.e16.ts:580  if (f === T_SQRT) {
  li t0, 9
  bne s2, t0, .L7
  ; sci/eval.e16.ts:581  math(M_SQR, x, 0, at)
  li a0, 21
  mv a1, s1
  li a2, 0
  mv a3, s3
  call math
  ; sci/eval.e16.ts:582  exactSqrt(x)
  mv a0, s1
  la t0, exactSqrt
  li t1, 2
  call far_call
  j .L8
.L7:
  ; sci/eval.e16.ts:584  other(f, x, at)
  mv a0, s2
  mv a1, s1
  mv a2, s3
  call other
  ; sci/eval.e16.ts:585  exactWhole(x)
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

; sci/eval.e16.ts:590 other(f, x, at) at -O1
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
  ; sci/eval.e16.ts:591  if (f >= T_SINH) {
  li t0, 224
  bltu s1, t0, .L1
  ; sci/eval.e16.ts:592  named(f, x, at)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call named
  ; sci/eval.e16.ts:593  return
  j .return
.L1:
  ; sci/eval.e16.ts:595  if (f === T_ASIN) math(M_ASN, x, 0, at)
  li t0, 4
  bne s1, t0, .L2
  ; sci/eval.e16.ts:595  math(M_ASN, x, 0, at)
  li a0, 25
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L3
.L2:
  ; sci/eval.e16.ts:596  if (f === T_ACOS) math(M_ACS, x, 0, at)
  li t0, 5
  bne s1, t0, .L4
  ; sci/eval.e16.ts:596  math(M_ACS, x, 0, at)
  li a0, 26
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L5
.L4:
  ; sci/eval.e16.ts:597  if (f === T_ATAN) math(M_ATN, x, 0, at)
  li t0, 6
  bne s1, t0, .L6
  ; sci/eval.e16.ts:597  math(M_ATN, x, 0, at)
  li a0, 27
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L7
.L6:
  ; sci/eval.e16.ts:598  if (f === T_LOG) math(M_LOG, x, 0, at)
  li t0, 7
  bne s1, t0, .L8
  ; sci/eval.e16.ts:598  math(M_LOG, x, 0, at)
  li a0, 29
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L9
.L8:
  ; sci/eval.e16.ts:599  if (f === T_LN) math(M_LN, x, 0, at)
  li t0, 8
  bne s1, t0, .L10
  ; sci/eval.e16.ts:599  math(M_LN, x, 0, at)
  li a0, 28
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L11
.L10:
  ; sci/eval.e16.ts:600  if (f === T_CBRT) cubeRoot(x, at)
  li t0, 10
  bne s1, t0, .L12
  ; sci/eval.e16.ts:600  cubeRoot(x, at)
  mv a0, s2
  mv a1, s3
  call cubeRoot
.L12:
.L11:
.L9:
.L7:
.L5:
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/eval.e16.ts:604 named(f, x, at) at -O1
;   f in s1
;   x in s2
;   at in s3
named:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; f
  mv s2, a1 ; x
  mv s3, a2 ; at
  ; sci/eval.e16.ts:605  if (f === T_SINH) math(M_SINH, x, 0, at)
  li t0, 224
  bne s1, t0, .L1
  ; sci/eval.e16.ts:605  math(M_SINH, x, 0, at)
  li a0, 33
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L2
.L1:
  ; sci/eval.e16.ts:606  if (f === T_COSH) math(M_COSH, x, 0, at)
  li t0, 225
  bne s1, t0, .L3
  ; sci/eval.e16.ts:606  math(M_COSH, x, 0, at)
  li a0, 34
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L4
.L3:
  ; sci/eval.e16.ts:607  if (f === T_TANH) math(M_TANH, x, 0, at)
  li t0, 226
  bne s1, t0, .L5
  ; sci/eval.e16.ts:607  math(M_TANH, x, 0, at)
  li a0, 35
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L6
.L5:
  ; sci/eval.e16.ts:608  if (f === T_ASINH) math(M_ASNH, x, 0, at)
  li t0, 227
  bne s1, t0, .L7
  ; sci/eval.e16.ts:608  math(M_ASNH, x, 0, at)
  li a0, 36
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L8
.L7:
  ; sci/eval.e16.ts:609  if (f === T_ACOSH) math(M_ACSH, x, 0, at)
  li t0, 228
  bne s1, t0, .L9
  ; sci/eval.e16.ts:609  math(M_ACSH, x, 0, at)
  li a0, 37
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L10
.L9:
  ; sci/eval.e16.ts:610  if (f === T_ATANH) math(M_ATNH, x, 0, at)
  li t0, 229
  bne s1, t0, .L11
  ; sci/eval.e16.ts:610  math(M_ATNH, x, 0, at)
  li a0, 38
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L12
.L11:
  ; sci/eval.e16.ts:611  wholeOrRounded(f, x, at)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call wholeOrRounded
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

; sci/eval.e16.ts:615 wholeOrRounded(f/one, x, at) at -O1
;   f/one in s2
;   x in s1
;   at in s3
wholeOrRounded:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; f/one
  mv s1, a1 ; x
  mv s3, a2 ; at
  ; sci/eval.e16.ts:616  if (f === T_INT) {
  li t0, 233
  bne s2, t0, .L1
  ; sci/eval.e16.ts:617  const one = pushInt(1, at)
  li a0, 1
  mv a1, s3
  call pushInt
  mv s2, a0 ; f/one
  ; sci/eval.e16.ts:618  math(M_IDIV, x, one, at)
  li a0, 8
  mv a1, s1
  mv a2, s2
  mv a3, s3
  call math
  ; sci/eval.e16.ts:619  pop()
  call pop
  j .L2
.L1:
  ; sci/eval.e16.ts:620  if (f === T_RND) {
  li t0, 234
  bne s2, t0, .L3
  ; sci/eval.e16.ts:621  poke16(MATH_ARG, shownDigits())
  call shownDigits
  li t0, 65366
  sw a0, 0(t0)
  ; sci/eval.e16.ts:622  math(M_RNDTO, x, 0, at)
  li a0, 40
  mv a1, s1
  li a2, 0
  mv a3, s3
  call math
  ; sci/eval.e16.ts:623  exactLiteral(x)
  mv a0, s1
  la t0, exactLiteral
  li t1, 2
  call far_call
  j .L4
.L3:
  ; sci/eval.e16.ts:624  if (f === T_ABS && isNegative(x)) {
  li t0, 230
  bne s2, t0, .L5
  mv a0, s1
  call isNegative
  beqz a0, .L5
  ; sci/eval.e16.ts:625  math(M_NEG, x, 0, at)
  li a0, 16
  mv a1, s1
  li a2, 0
  mv a3, s3
  call math
  ; sci/eval.e16.ts:626  exactNeg(x)
  mv a0, s1
  la t0, exactNeg
  li t1, 2
  call far_call
.L5:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/eval.e16.ts:633 applyTwo(f, at) at -O1
;   f in s0
;   at in s1
;   b in s2
;   a in s3
applyTwo:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s0, a0 ; f
  mv s1, a1 ; at
  ; sci/eval.e16.ts:634  const b = top()
  call top
  mv s2, a0 ; b
  ; sci/eval.e16.ts:635  const a = b - VALUE_SIZE
  addi s3, s2, -36
  ; sci/eval.e16.ts:636  if (f === T_POL) polar(a, b, at)
  li t0, 235
  bne s0, t0, .L1
  ; sci/eval.e16.ts:636  polar(a, b, at)
  mv a0, s3
  mv a1, s2
  mv a2, s1
  call polar
  j .L2
.L1:
  ; sci/eval.e16.ts:637  if (f === T_REC) rectangular(a, b, at)
  li t0, 236
  bne s0, t0, .L3
  ; sci/eval.e16.ts:637  rectangular(a, b, at)
  mv a0, s3
  mv a1, s2
  mv a2, s1
  call rectangular
  j .L4
.L3:
  ; sci/eval.e16.ts:639  whole(a, at)
  mv a0, s3
  mv a1, s1
  call whole
  ; sci/eval.e16.ts:640  whole(b, at)
  mv a0, s2
  mv a1, s1
  call whole
  ; sci/eval.e16.ts:641  if (f === T_GCD) gcdInto(a, b, at)
  li t0, 231
  bne s0, t0, .L5
  ; sci/eval.e16.ts:641  gcdInto(a, b, at)
  mv a0, s3
  mv a1, s2
  mv a2, s1
  call gcdInto
  j .L6
.L5:
  ; sci/eval.e16.ts:642  lcm(a, b, at)
  mv a0, s3
  mv a1, s2
  mv a2, s1
  call lcm
.L6:
  ; sci/eval.e16.ts:643  exactWhole(a)
  mv a0, s3
  la t0, exactWhole
  li t1, 2
  call far_call
.L4:
.L2:
  ; sci/eval.e16.ts:645  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/eval.e16.ts:649 whole(v, at) at -O1
;   v in s2
;   at in s1
;   t in s3
whole:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; v
  mv s1, a1 ; at
  ; sci/eval.e16.ts:650  const t = push(at)
  mv a0, s1
  call push
  mv s3, a0 ; t
  ; sci/eval.e16.ts:651  copyValue(v, t)
  mv a0, s2
  mv a1, s3
  call copyValue
  ; sci/eval.e16.ts:652  math(M_FRAC, t, 0, at)
  li a0, 19
  mv a1, s3
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:653  if (!isZero(t)) fail(E_MATH, at)
  mv a0, s3
  call isZero
  bnez a0, .L1
  ; sci/eval.e16.ts:653  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L1:
  ; sci/eval.e16.ts:654  pop()
  call pop
  ; sci/eval.e16.ts:655  if (isNegative(v)) math(M_NEG, v, 0, at)
  mv a0, s2
  call isNegative
  beqz a0, .L2
  ; sci/eval.e16.ts:655  math(M_NEG, v, 0, at)
  li a0, 16
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
.L2:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/eval.e16.ts:659 gcdInto(a, b, at) at -O1
;   a in s3
;   b in s1
;   at in s0
;   t in s2
gcdInto:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s0, 6(sp)
  sw s2, 8(sp)
  mv s3, a0 ; a
  mv s1, a1 ; b
  mv s0, a2 ; at
  ; sci/eval.e16.ts:660  const t = push(at)
  mv a0, s0
  call push
  mv s2, a0 ; t
  ; sci/eval.e16.ts:661  while (!isZero(b)) {
  j .L3
.L1:
  ; sci/eval.e16.ts:662  copyValue(a, t)
  mv a0, s3
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:663  math(M_MOD, t, b, at)
  li a0, 9
  mv a1, s2
  mv a2, s1
  mv a3, s0
  call math
  ; sci/eval.e16.ts:664  copyValue(b, a)
  mv a0, s1
  mv a1, s3
  call copyValue
  ; sci/eval.e16.ts:665  copyValue(t, b)
  mv a0, s2
  mv a1, s1
  call copyValue
.L3:
  mv a0, s1
  call isZero
  beqz a0, .L1
  ; sci/eval.e16.ts:667  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/eval.e16.ts:671 lcm(a, b, at) at -O1
;   a in s2
;   b in s0
;   at in s3
;   product in s1
lcm:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s0, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; a
  mv s0, a1 ; b
  mv s3, a2 ; at
  ; sci/eval.e16.ts:672  const product = push(at)
  mv a0, s3
  call push
  mv s1, a0 ; product
  ; sci/eval.e16.ts:673  copyValue(a, product)
  mv a0, s2
  mv a1, s1
  call copyValue
  ; sci/eval.e16.ts:674  math(M_MUL, product, b, at)
  li a0, 3
  mv a1, s1
  mv a2, s0
  mv a3, s3
  call math
  ; sci/eval.e16.ts:675  if (isZero(product)) {
  mv a0, s1
  call isZero
  beqz a0, .L1
  ; sci/eval.e16.ts:676  copyValue(product, a)
  mv a0, s1
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:677  pop()
  call pop
  ; sci/eval.e16.ts:678  return
  j .return
.L1:
  ; sci/eval.e16.ts:680  gcdInto(a, b, at)
  mv a0, s2
  mv a1, s0
  mv a2, s3
  call gcdInto
  ; sci/eval.e16.ts:681  math(M_DIV, product, a, at)
  li a0, 4
  mv a1, s1
  mv a2, s2
  mv a3, s3
  call math
  ; sci/eval.e16.ts:682  copyValue(product, a)
  mv a0, s1
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:683  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s0, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/eval.e16.ts:687 polar(a, b, at) at -O1
;   a in s2
;   b in s0
;   at in s1
;   r in s3
;   y2 in 0(sp)
polar:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s2, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  mv s2, a0 ; a
  mv s0, a1 ; b
  mv s1, a2 ; at
  ; sci/eval.e16.ts:688  const r = push(at)
  mv a0, s1
  call push
  mv s3, a0 ; r
  ; sci/eval.e16.ts:689  copyValue(a, r)
  mv a0, s2
  mv a1, s3
  call copyValue
  ; sci/eval.e16.ts:690  math(M_MUL, r, a, at)
  li a0, 3
  mv a1, s3
  mv a2, s2
  mv a3, s1
  call math
  ; sci/eval.e16.ts:691  const y2 = push(at)
  mv a0, s1
  call push
  sw a0, 0(sp) ; y2
  ; sci/eval.e16.ts:692  copyValue(b, y2)
  mv a0, s0
  lw a1, 0(sp)
  call copyValue
  ; sci/eval.e16.ts:693  math(M_MUL, y2, b, at)
  li a0, 3
  lw a1, 0(sp)
  mv a2, s0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:694  math(M_ADD, r, y2, at)
  li a0, 1
  mv a1, s3
  lw a2, 0(sp)
  mv a3, s1
  call math
  ; sci/eval.e16.ts:695  pop()
  call pop
  ; sci/eval.e16.ts:696  math(M_SQR, r, 0, at)
  li a0, 21
  mv a1, s3
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:698  math(M_ATN2, b, a, at)
  li a0, 39
  mv a1, s0
  mv a2, s2
  mv a3, s1
  call math
  ; sci/eval.e16.ts:699  copyValue(r, a)
  mv a0, s3
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:700  pop()
  call pop
  ; sci/eval.e16.ts:701  pair(a, b)
  mv a0, s2
  mv a1, s0
  call pair
.return:
  lw ra, 2(sp)
  lw s2, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  addi sp, sp, 12
  ret

; sci/eval.e16.ts:705 rectangular(a, b, at) at -O1
;   a in s2
;   b in s3
;   at in s1
;   x in s0
rectangular:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  sw s0, 8(sp)
  mv s2, a0 ; a
  mv s3, a1 ; b
  mv s1, a2 ; at
  ; sci/eval.e16.ts:706  const x = push(at)
  mv a0, s1
  call push
  mv s0, a0 ; x
  ; sci/eval.e16.ts:707  copyValue(b, x)
  mv a0, s3
  mv a1, s0
  call copyValue
  ; sci/eval.e16.ts:708  math(M_COS, x, 0, at)
  li a0, 23
  mv a1, s0
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:709  math(M_MUL, x, a, at)
  li a0, 3
  mv a1, s0
  mv a2, s2
  mv a3, s1
  call math
  ; sci/eval.e16.ts:710  math(M_SIN, b, 0, at)
  li a0, 22
  mv a1, s3
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:711  math(M_MUL, b, a, at)
  li a0, 3
  mv a1, s3
  mv a2, s2
  mv a3, s1
  call math
  ; sci/eval.e16.ts:712  copyValue(x, a)
  mv a0, s0
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:713  pop()
  call pop
  ; sci/eval.e16.ts:714  pair(a, b)
  mv a0, s2
  mv a1, s3
  call pair
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/eval.e16.ts:718 pair(first, second) at -O1
;   first in s1
;   second in s2
pair:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; first
  mv s2, a1 ; second
  ; sci/eval.e16.ts:719  inexact(first)
  mv a0, s1
  call inexact
  ; sci/eval.e16.ts:720  inexact(second)
  mv a0, s2
  call inexact
  ; sci/eval.e16.ts:721  copyValue(first, varAt(0x58))
  mv a0, s1
  li a1, 3336
  call copyValue
  ; sci/eval.e16.ts:722  copyValue(second, varAt(0x59))
  mv a0, s2
  li a1, 3372
  call copyValue
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:725 trig(op, which, x, at) at -O1
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
  ; sci/eval.e16.ts:726  math(op, x, 0, at)
  mv a0, s2
  mv a1, s1
  li a2, 0
  mv a3, s0
  call math
  ; sci/eval.e16.ts:727  exactTrig(which, x, addr(argument))
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

; sci/eval.e16.ts:731 cubeRoot(x, at) at -O1
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
  ; sci/eval.e16.ts:732  if (isZero(x)) return
  mv a0, s2
  call isZero
  beqz a0, .L1
  ; sci/eval.e16.ts:732  return
  j .return
.L1:
  ; sci/eval.e16.ts:733  const negative = isNegative(x)
  mv a0, s2
  call isNegative
  mv s3, a0 ; negative
  ; sci/eval.e16.ts:734  if (negative) math(M_NEG, x, 0, at)
  beqz s3, .L2
  ; sci/eval.e16.ts:734  math(M_NEG, x, 0, at)
  li a0, 16
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
.L2:
  ; sci/eval.e16.ts:735  const third = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  mv s0, a0 ; third
  ; sci/eval.e16.ts:736  pushInt(3, at)
  li a0, 3
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:737  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:738  math(M_POW, x, third, at)
  li a0, 5
  mv a1, s2
  mv a2, s0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:739  pop()
  call pop
  ; sci/eval.e16.ts:740  if (negative) math(M_NEG, x, 0, at)
  beqz s3, .L3
  ; sci/eval.e16.ts:740  math(M_NEG, x, 0, at)
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
; sci/screens.e16.ts:50 errorScreen(code) at -O1
;   code in s1
errorScreen:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; code
  ; sci/screens.e16.ts:51  if (code === E_MATH) {
  li t0, 1
  bne s1, t0, .L1
  ; sci/screens.e16.ts:52  band(str('ERR:MATH'))
  la a0, str_38
  call band
  ; sci/screens.e16.ts:53  textAt(str("OUT OF A FUNCTION'S"), 1, lineY(0))
  la a0, str_39
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:54  textAt(str('RANGE, OR /0'), 1, lineY(1))
  la a0, str_40
  li a1, 1
  li a2, 20
  call textAt
  j .L2
.L1:
  ; sci/screens.e16.ts:55  if (code === E_FIND) {
  li t0, 4
  bne s1, t0, .L3
  ; sci/screens.e16.ts:56  band(str('ERR:FIND'))
  la a0, str_41
  call band
  ; sci/screens.e16.ts:57  textAt(str('NO X WAS FOUND FROM'), 1, lineY(0))
  la a0, str_42
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:58  textAt(str('THE X IT STARTED AT'), 1, lineY(1))
  la a0, str_43
  li a1, 1
  li a2, 20
  call textAt
  j .L4
.L3:
  ; sci/screens.e16.ts:59  if (code === E_STACK) {
  li t0, 3
  bne s1, t0, .L5
  ; sci/screens.e16.ts:60  band(str('ERR:STACK'))
  la a0, str_44
  call band
  ; sci/screens.e16.ts:61  textAt(str('TOO MANY BRACKETS OR'), 1, lineY(0))
  la a0, str_45
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:62  textAt(str('FUNCTIONS IN A LINE'), 1, lineY(1))
  la a0, str_46
  li a1, 1
  li a2, 20
  call textAt
  j .L6
.L5:
  ; sci/screens.e16.ts:64  band(str('ERR:SYNTAX'))
  la a0, str_47
  call band
  ; sci/screens.e16.ts:65  textAt(str('CANNOT READ THE LINE'), 1, lineY(0))
  la a0, str_48
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:66  textAt(str('AT THE CURSOR'), 1, lineY(1))
  la a0, str_49
  li a1, 1
  li a2, 20
  call textAt
.L6:
.L4:
.L2:
  ; sci/screens.e16.ts:68  textAt(str('\x8c\x8b:BACK TO THE LINE'), 1, lineY(4))
  la a0, str_50
  li a1, 1
  li a2, 47
  call textAt
  ; sci/screens.e16.ts:69  textAt(str('AC:CLEAR'), 1, lineY(5))
  la a0, str_51
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:75 menuScreen() at -O1
menuScreen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/screens.e16.ts:76  band(str('MENU'))
  la a0, str_52
  call band
  ; sci/screens.e16.ts:77  textAt(str('1:CALC    2:STATS'), 1, lineY(0))
  la a0, str_53
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:78  textAt(str('3:BASE    4:TABLE'), 1, lineY(1))
  la a0, str_54
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:79  textAt(str('5:EQUATION'), 1, lineY(2))
  la a0, str_55
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:80  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_56
  li a1, 1
  li a2, 56
  call textAt
  ; sci/screens.e16.ts:81  mark(0, 6, 0)
  li a0, 0
  li a1, 6
  li a2, 0
  call mark
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/screens.e16.ts:85 menuKey(k) at -O1
;   k in s1
menuKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/screens.e16.ts:86  if (k === K_1 || k === K_AC) return 1
  li t0, 56
  beq s1, t0, .L2
  li t0, 5
  bne s1, t0, .L1
.L2:
  ; sci/screens.e16.ts:86  return 1
  li a0, 1
  j .return
.L1:
  ; sci/screens.e16.ts:87  if (k === K_2 || k === K_3 || k === K_4 || k === K_5) refuse()
  li t0, 57
  beq s1, t0, .L4
  li t0, 58
  beq s1, t0, .L4
  li t0, 48
  beq s1, t0, .L4
  li t0, 49
  bne s1, t0, .L3
.L4:
  ; sci/screens.e16.ts:87  refuse()
  call refuse
.L3:
  ; sci/screens.e16.ts:88  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:98 setupScreen() at -O1
setupScreen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/screens.e16.ts:99  page = 0
  sw zero, 0x05ba(zero)
  ; sci/screens.e16.ts:100  asking = 0
  sw zero, 0x05bc(zero)
  ; sci/screens.e16.ts:101  drawSetup()
  call drawSetup
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/screens.e16.ts:110 drawSetup() at -O1
drawSetup:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/screens.e16.ts:111  cls()
  call cls
  ; sci/screens.e16.ts:112  band(str('SETUP'))
  la a0, str_57
  call band
  ; sci/screens.e16.ts:113  textRight(page === 0 ? str('1/2') : str('2/2'), 1)
  lw t0, 0x05ba(zero)
  bne t0, zero, .L1
  la t0, str_58
  j .L2
.L1:
  la t0, str_59
.L2:
  mv a0, t0
  li a1, 1
  call textRight
  ; sci/screens.e16.ts:114  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_56
  li a1, 1
  li a2, 56
  call textAt
  ; sci/screens.e16.ts:115  if (page === 1) {
  lw t0, 0x05ba(zero)
  li t1, 1
  bne t0, t1, .L3
  ; sci/screens.e16.ts:116  textAt(str('1:a/b  2:a b/c'), 1, lineY(0))
  la a0, str_60
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:117  if (peek(KEEP_MIXED) === 1) mark(7, 7, 0)
  lbu t0, 3079(zero)
  li t1, 1
  bne t0, t1, .L4
  ; sci/screens.e16.ts:117  mark(7, 7, 0)
  li a0, 7
  li a1, 7
  li a2, 0
  call mark
  j .L5
.L4:
  ; sci/screens.e16.ts:118  mark(0, 5, 0)
  li a0, 0
  li a1, 5
  li a2, 0
  call mark
.L5:
  ; sci/screens.e16.ts:119  return
  j .return
.L3:
  ; sci/screens.e16.ts:121  textAt(str('1:2D  2:LINE'), 1, lineY(0))
  la a0, str_61
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:122  textAt(str('3:DEG 4:RAD 5:GRAD'), 1, lineY(1))
  la a0, str_62
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:123  textAt(str('6:EXACT 7:DECIMAL'), 1, lineY(2))
  la a0, str_63
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:124  textAt(str('8:FIX 9:EXP 0:AUTO'), 1, lineY(3))
  la a0, str_64
  li a1, 1
  li a2, 38
  call textAt
  ; sci/screens.e16.ts:125  marksOfPage1()
  call marksOfPage1
  ; sci/screens.e16.ts:126  drawDigits()
  call drawDigits
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/screens.e16.ts:129 marksOfPage1() at -O1
;   angle/shape in s1
marksOfPage1:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/screens.e16.ts:130  if (peek(KEEP_DISPLAY) === 1) mark(6, 6, 0)
  lbu t0, 3075(zero)
  li t1, 1
  bne t0, t1, .L1
  ; sci/screens.e16.ts:130  mark(6, 6, 0)
  li a0, 6
  li a1, 6
  li a2, 0
  call mark
  j .L2
.L1:
  ; sci/screens.e16.ts:131  mark(0, 4, 0)
  li a0, 0
  li a1, 4
  li a2, 0
  call mark
.L2:
  ; sci/screens.e16.ts:132  const angle = peek(KEEP_ANGLE)
  lbu s1, 3074(zero)
  ; sci/screens.e16.ts:133  if (angle === 1) mark(6, 5, 1)
  li t0, 1
  bne s1, t0, .L3
  ; sci/screens.e16.ts:133  mark(6, 5, 1)
  li a0, 6
  li a1, 5
  li a2, 1
  call mark
  j .L4
.L3:
  ; sci/screens.e16.ts:134  if (angle === 2) mark(12, 6, 1)
  li t0, 2
  bne s1, t0, .L5
  ; sci/screens.e16.ts:134  mark(12, 6, 1)
  li a0, 12
  li a1, 6
  li a2, 1
  call mark
  j .L6
.L5:
  ; sci/screens.e16.ts:135  mark(0, 5, 1)
  li a0, 0
  li a1, 5
  li a2, 1
  call mark
.L6:
.L4:
  ; sci/screens.e16.ts:136  if (peek(KEEP_ANSWER) === 1) mark(8, 9, 2)
  lbu t0, 3076(zero)
  li t1, 1
  bne t0, t1, .L7
  ; sci/screens.e16.ts:136  mark(8, 9, 2)
  li a0, 8
  li a1, 9
  li a2, 2
  call mark
  j .L8
.L7:
  ; sci/screens.e16.ts:137  mark(0, 7, 2)
  li a0, 0
  li a1, 7
  li a2, 2
  call mark
.L8:
  ; sci/screens.e16.ts:138  const shape = peek(KEEP_FORMAT)
  lbu s1, 3077(zero)
  ; sci/screens.e16.ts:139  if (shape === FORMAT_FIX) mark(0, 5, 3)
  li t0, 1
  bne s1, t0, .L9
  ; sci/screens.e16.ts:139  mark(0, 5, 3)
  li a0, 0
  li a1, 5
  li a2, 3
  call mark
  j .L10
.L9:
  ; sci/screens.e16.ts:140  if (shape === FORMAT_EXP) mark(6, 5, 3)
  li t0, 2
  bne s1, t0, .L11
  ; sci/screens.e16.ts:140  mark(6, 5, 3)
  li a0, 6
  li a1, 5
  li a2, 3
  call mark
  j .L12
.L11:
  ; sci/screens.e16.ts:141  mark(12, 6, 3)
  li a0, 12
  li a1, 6
  li a2, 3
  call mark
.L12:
.L10:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:145 drawDigits() at -O1
;   shape in s1
drawDigits:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/screens.e16.ts:146  const shape = asking !== 0 ? asking : peek(KEEP_FORMAT)
  lw t0, 0x05bc(zero)
  beq t0, zero, .L1
  lw t0, 0x05bc(zero)
  j .L2
.L1:
  lbu t0, 3077(zero)
.L2:
  mv s1, t0 ; shape
  ; sci/screens.e16.ts:147  if (shape === FORMAT_AUTO) return
  bne s1, zero, .L3
  ; sci/screens.e16.ts:147  return
  j .return
.L3:
  ; sci/screens.e16.ts:148  textAt(shape === FORMAT_FIX ? str('FIX') : str('EXP'), 1, lineY(4))
  li t0, 1
  bne s1, t0, .L4
  la t0, str_65
  j .L5
.L4:
  la t0, str_66
.L5:
  mv a0, t0
  li a1, 1
  li a2, 47
  call textAt
  ; sci/screens.e16.ts:149  if (asking !== 0) textAt(str('0-9?'), 25, lineY(4))
  lw t0, 0x05bc(zero)
  beq t0, zero, .L6
  ; sci/screens.e16.ts:149  textAt(str('0-9?'), 25, lineY(4))
  la a0, str_67
  li a1, 25
  li a2, 47
  call textAt
  j .L7
.L6:
  ; sci/screens.e16.ts:151  digitText[0] = 0x30 + peek(KEEP_DIGITS)
  lbu t0, 3078(zero)
  addi t0, t0, 48
  sb t0, digitText(zero)
  ; sci/screens.e16.ts:152  digitText[1] = 0
  sb zero, digitText+1(zero)
  ; sci/screens.e16.ts:153  textAt(addr(digitText), 25, lineY(4))
  la a0, digitText
  li a1, 25
  li a2, 47
  call textAt
.L7:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:160 setupKey(k/d) at -O1
;   k/d in s1
setupKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/d
  ; sci/screens.e16.ts:161  if (k === K_AC) return 1
  li t0, 5
  bne s1, t0, .L1
  ; sci/screens.e16.ts:161  return 1
  li a0, 1
  j .return
.L1:
  ; sci/screens.e16.ts:162  if (asking !== 0) {
  lw t0, 0x05bc(zero)
  beq t0, zero, .L2
  ; sci/screens.e16.ts:163  const d = digitOf(k)
  mv a0, s1
  call digitOf
  mv s1, a0 ; k/d
  ; sci/screens.e16.ts:164  if (d === 0xffff) {
  li t0, 65535
  bne s1, t0, .L3
  ; sci/screens.e16.ts:165  refuse()
  call refuse
  ; sci/screens.e16.ts:166  return 0
  li a0, 0
  j .return
.L3:
  ; sci/screens.e16.ts:168  poke(KEEP_FORMAT, asking)
  lw t0, 0x05bc(zero)
  sb t0, 3077(zero)
  ; sci/screens.e16.ts:169  poke(KEEP_DIGITS, d)
  sb s1, 3078(zero)
  ; sci/screens.e16.ts:170  asking = 0
  sw zero, 0x05bc(zero)
  j .L4
.L2:
  ; sci/screens.e16.ts:171  if (k === K_DOWN || k === K_UP) page = k === K_DOWN ? 1 : 0
  li t0, 1
  beq s1, t0, .L6
  bne s1, zero, .L5
.L6:
  ; sci/screens.e16.ts:171  page = k === K_DOWN ? 1 : 0
  li t0, 1
  bne s1, t0, .L7
  li t0, 1
  j .L8
.L7:
  li t0, 0
.L8:
  sw t0, 0x05ba(zero)
  j .L9
.L5:
  ; sci/screens.e16.ts:172  if (!setupChoice(k)) {
  mv a0, s1
  call setupChoice
  bnez a0, .L10
  ; sci/screens.e16.ts:173  refuse()
  call refuse
  ; sci/screens.e16.ts:174  return 0
  li a0, 0
  j .return
.L10:
.L9:
.L4:
  ; sci/screens.e16.ts:176  drawSetup()
  call drawSetup
  ; sci/screens.e16.ts:177  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:181 setupChoice(k) at -O1
;   k in s1
setupChoice:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/screens.e16.ts:182  if (page === 1) return mixedChoice(k)
  lw t0, 0x05ba(zero)
  li t1, 1
  bne t0, t1, .L1
  ; sci/screens.e16.ts:182  return mixedChoice(k)
  mv a0, s1
  call mixedChoice
  j .return
.L1:
  ; sci/screens.e16.ts:183  switch (k) {
  li t0, 56
  beq s1, t0, .L3
  li t0, 57
  beq s1, t0, .L4
  li t0, 58
  beq s1, t0, .L5
  li t0, 48
  beq s1, t0, .L6
  li t0, 49
  beq s1, t0, .L7
  li t0, 50
  beq s1, t0, .L8
  li t0, 40
  beq s1, t0, .L9
  li t0, 41
  beq s1, t0, .L10
  li t0, 42
  beq s1, t0, .L11
  li t0, 59
  beq s1, t0, .L12
  j .L2
.L3:
.L4:
  ; sci/screens.e16.ts:186  poke(KEEP_DISPLAY, k === K_1 ? 0 : 1)
  li t0, 3075
  mv t1, s1
  li t2, 56
  bne t1, t2, .L13
  li t1, 0
  j .L14
.L13:
  li t1, 1
.L14:
  sb t1, 0(t0)
  ; sci/screens.e16.ts:187  return true
  li a0, 1
  j .return
.L5:
.L6:
.L7:
  ; sci/screens.e16.ts:191  poke(KEEP_ANGLE, k === K_3 ? 0 : k === K_4 ? 1 : 2)
  li t0, 3074
  mv t1, s1
  li t2, 58
  bne t1, t2, .L15
  li t1, 0
  j .L16
.L15:
  mv t1, s1
  li t2, 48
  bne t1, t2, .L17
  li t1, 1
  j .L18
.L17:
  li t1, 2
.L18:
.L16:
  sb t1, 0(t0)
  ; sci/screens.e16.ts:192  return true
  li a0, 1
  j .return
.L8:
.L9:
  ; sci/screens.e16.ts:195  poke(KEEP_ANSWER, k === K_6 ? 0 : 1)
  li t0, 3076
  mv t1, s1
  li t2, 50
  bne t1, t2, .L19
  li t1, 0
  j .L20
.L19:
  li t1, 1
.L20:
  sb t1, 0(t0)
  ; sci/screens.e16.ts:196  return true
  li a0, 1
  j .return
.L10:
.L11:
  ; sci/screens.e16.ts:199  asking = k === K_8 ? FORMAT_FIX : FORMAT_EXP
  li t0, 41
  bne s1, t0, .L21
  li t0, 1
  j .L22
.L21:
  li t0, 2
.L22:
  sw t0, 0x05bc(zero)
  ; sci/screens.e16.ts:200  return true
  li a0, 1
  j .return
.L12:
  ; sci/screens.e16.ts:202  poke(KEEP_FORMAT, FORMAT_AUTO)
  sb zero, 3077(zero)
  ; sci/screens.e16.ts:203  return true
  li a0, 1
  j .return
.L2:
  ; sci/screens.e16.ts:205  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:209 mixedChoice(k) at -O1
;   k in a0
mixedChoice:
  ; sci/screens.e16.ts:210  if (k !== K_1 && k !== K_2) return false
  li t0, 56
  beq a0, t0, .L1
  li t0, 57
  beq a0, t0, .L1
  ; sci/screens.e16.ts:210  return false
  li a0, 0
  ret
.L1:
  ; sci/screens.e16.ts:211  poke(KEEP_MIXED, k === K_1 ? 0 : 1)
  li t0, 3079
  mv t1, a0
  li t2, 56
  bne t1, t2, .L2
  li t1, 0
  j .L3
.L2:
  li t1, 1
.L3:
  sb t1, 0(t0)
  ; sci/screens.e16.ts:212  return true
  li a0, 1
.return:
  ret

; sci/screens.e16.ts:218 funcScreen() at -O1
funcScreen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/screens.e16.ts:219  cls()
  call cls
  ; sci/screens.e16.ts:220  band(str('FUNC'))
  la a0, str_68
  call band
  ; sci/screens.e16.ts:221  textAt(str('1:gcd   2:lcm'), 1, lineY(0))
  la a0, str_69
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:222  textAt(str('3:Int   4:Rnd'), 1, lineY(1))
  la a0, str_70
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:223  textAt(str('5:Ran#  6:%'), 1, lineY(2))
  la a0, str_71
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:224  textAt(str('7:Pol   8:Rec'), 1, lineY(3))
  la a0, str_72
  li a1, 1
  li a2, 38
  call textAt
  ; sci/screens.e16.ts:225  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_56
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/screens.e16.ts:229 funcKey(k/t) at -O1
;   k/t in s1
funcKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/t
  ; sci/screens.e16.ts:230  if (k === K_AC) return 1
  li t0, 5
  bne s1, t0, .L1
  ; sci/screens.e16.ts:230  return 1
  li a0, 1
  j .return
.L1:
  ; sci/screens.e16.ts:231  const t = funcToken(digitOf(k))
  mv a0, s1
  call digitOf
  call funcToken
  mv s1, a0 ; k/t
  ; sci/screens.e16.ts:232  if (t === 0) refuse()
  bne s1, zero, .L2
  ; sci/screens.e16.ts:232  refuse()
  call refuse
.L2:
  ; sci/screens.e16.ts:233  return t
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:237 funcToken(d) at -O1
;   d in a0
funcToken:
  ; sci/screens.e16.ts:238  switch (d) {
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
  j .L1
.L2:
  ; sci/screens.e16.ts:240  return T_GCD
  li a0, 231
  ret
.L3:
  ; sci/screens.e16.ts:242  return T_LCM
  li a0, 232
  ret
.L4:
  ; sci/screens.e16.ts:244  return T_INT
  li a0, 233
  ret
.L5:
  ; sci/screens.e16.ts:246  return T_RND
  li a0, 234
  ret
.L6:
  ; sci/screens.e16.ts:248  return T_RAN
  li a0, 237
  ret
.L7:
  ; sci/screens.e16.ts:250  return T_PERCENT
  li a0, 37
  ret
.L8:
  ; sci/screens.e16.ts:252  return T_POL
  li a0, 235
  ret
.L9:
  ; sci/screens.e16.ts:254  return T_REC
  li a0, 236
  ret
.L1:
  ; sci/screens.e16.ts:256  return 0
  li a0, 0
.return:
  ret

; sci/screens.e16.ts:260 digitOf(k) at -O1
;   k in a0
digitOf:
  ; sci/screens.e16.ts:261  if (k === K_0) return 0
  li t0, 59
  bne a0, t0, .L1
  ; sci/screens.e16.ts:261  return 0
  li a0, 0
  ret
.L1:
  ; sci/screens.e16.ts:262  if (k === K_1) return 1
  li t0, 56
  bne a0, t0, .L2
  ; sci/screens.e16.ts:262  return 1
  li a0, 1
  ret
.L2:
  ; sci/screens.e16.ts:263  if (k === K_2) return 2
  li t0, 57
  bne a0, t0, .L3
  ; sci/screens.e16.ts:263  return 2
  li a0, 2
  ret
.L3:
  ; sci/screens.e16.ts:264  if (k === K_3) return 3
  li t0, 58
  bne a0, t0, .L4
  ; sci/screens.e16.ts:264  return 3
  li a0, 3
  ret
.L4:
  ; sci/screens.e16.ts:265  if (k >= K_4 && k <= K_6) return 4 + k - K_4
  li t0, 48
  bltu a0, t0, .L5
  li t0, 50
  bltu t0, a0, .L5
  ; sci/screens.e16.ts:265  return 4 + k - K_4
  addi a0, a0, -44
  ret
.L5:
  ; sci/screens.e16.ts:266  if (k >= K_7 && k <= K_9) return 7 + k - K_7
  li t0, 40
  bltu a0, t0, .L6
  li t0, 42
  bltu t0, a0, .L6
  ; sci/screens.e16.ts:266  return 7 + k - K_7
  addi a0, a0, -33
  ret
.L6:
  ; sci/screens.e16.ts:267  return 0xffff
  li a0, 65535
.return:
  ret

; sci/screens.e16.ts:273 faultScreen(cause, pc) at -O1
;   cause in s1
;   pc in s2
faultScreen:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; cause
  mv s2, a1 ; pc
  ; sci/screens.e16.ts:274  if (cause === 0x800f || cause === 3) band(str('BREAK'))
  li t0, 32783
  beq s1, t0, .L2
  li t0, 3
  bne s1, t0, .L1
.L2:
  ; sci/screens.e16.ts:274  band(str('BREAK'))
  la a0, str_73
  call band
  j .L3
.L1:
  ; sci/screens.e16.ts:275  band(str('FAULT'))
  la a0, str_74
  call band
.L3:
  ; sci/screens.e16.ts:276  textAt(str('CAUSE'), 1, lineY(0))
  la a0, str_75
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:277  hexAt(cause, 43, lineY(0))
  mv a0, s1
  li a1, 43
  li a2, 11
  call hexAt
  ; sci/screens.e16.ts:278  textAt(str('AT'), 1, lineY(1))
  la a0, str_76
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:279  hexAt(pc, 43, lineY(1))
  mv a0, s2
  li a1, 43
  li a2, 20
  call hexAt
  ; sci/screens.e16.ts:280  textAt(str('AC:CLEAR'), 1, lineY(5))
  la a0, str_51
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/screens.e16.ts:285 hexAt(v, x, y) at -O1
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
  ; sci/screens.e16.ts:286  for (let s: u16 = 0; s < 4; s++) {
  li s1, 0 ; s
  j .L3
.L1:
  ; sci/screens.e16.ts:287  const d = (v >> (12 - s * 4)) & 15
  slli t0, s1, 2
  li t1, 12
  sub t1, t1, t0
  srl t1, s3, t1
  andi s2, t1, 15
  ; sci/screens.e16.ts:288  hexText[s] = d < 10 ? 0x30 + d : 0x37 + d
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
  ; sci/screens.e16.ts:290  hexText[4] = 0
  sb zero, hexText+4(zero)
  ; sci/screens.e16.ts:291  textAt(addr(hexText), x, y)
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

str_38:
  .byte 69, 82, 82, 58, 77, 65, 84, 72, 0
str_39:
  .byte 79, 85, 84, 32, 79, 70, 32, 65, 32, 70, 85, 78, 67, 84, 73, 79, 78, 39, 83, 0
str_40:
  .byte 82, 65, 78, 71, 69, 44, 32, 79, 82, 32, 47, 48, 0
str_41:
  .byte 69, 82, 82, 58, 70, 73, 78, 68, 0
str_42:
  .byte 78, 79, 32, 88, 32, 87, 65, 83, 32, 70, 79, 85, 78, 68, 32, 70, 82, 79, 77, 0
str_43:
  .byte 84, 72, 69, 32, 88, 32, 73, 84, 32, 83, 84, 65, 82, 84, 69, 68, 32, 65, 84, 0
str_44:
  .byte 69, 82, 82, 58, 83, 84, 65, 67, 75, 0
str_45:
  .byte 84, 79, 79, 32, 77, 65, 78, 89, 32, 66, 82, 65, 67, 75, 69, 84, 83, 32, 79, 82, 0
str_46:
  .byte 70, 85, 78, 67, 84, 73, 79, 78, 83, 32, 73, 78, 32, 65, 32, 76, 73, 78, 69, 0
str_47:
  .byte 69, 82, 82, 58, 83, 89, 78, 84, 65, 88, 0
str_48:
  .byte 67, 65, 78, 78, 79, 84, 32, 82, 69, 65, 68, 32, 84, 72, 69, 32, 76, 73, 78, 69, 0
str_49:
  .byte 65, 84, 32, 84, 72, 69, 32, 67, 85, 82, 83, 79, 82, 0
str_50:
  .byte 140, 139, 58, 66, 65, 67, 75, 32, 84, 79, 32, 84, 72, 69, 32, 76, 73, 78, 69, 0
str_51:
  .byte 65, 67, 58, 67, 76, 69, 65, 82, 0
str_52:
  .byte 77, 69, 78, 85, 0
str_53:
  .byte 49, 58, 67, 65, 76, 67, 32, 32, 32, 32, 50, 58, 83, 84, 65, 84, 83, 0
str_54:
  .byte 51, 58, 66, 65, 83, 69, 32, 32, 32, 32, 52, 58, 84, 65, 66, 76, 69, 0
str_55:
  .byte 53, 58, 69, 81, 85, 65, 84, 73, 79, 78, 0
str_56:
  .byte 65, 67, 58, 66, 65, 67, 75, 0
str_57:
  .byte 83, 69, 84, 85, 80, 0
str_58:
  .byte 49, 47, 50, 0
str_59:
  .byte 50, 47, 50, 0
str_60:
  .byte 49, 58, 97, 47, 98, 32, 32, 50, 58, 97, 32, 98, 47, 99, 0
str_61:
  .byte 49, 58, 50, 68, 32, 32, 50, 58, 76, 73, 78, 69, 0
str_62:
  .byte 51, 58, 68, 69, 71, 32, 52, 58, 82, 65, 68, 32, 53, 58, 71, 82, 65, 68, 0
str_63:
  .byte 54, 58, 69, 88, 65, 67, 84, 32, 55, 58, 68, 69, 67, 73, 77, 65, 76, 0
str_64:
  .byte 56, 58, 70, 73, 88, 32, 57, 58, 69, 88, 80, 32, 48, 58, 65, 85, 84, 79, 0
str_65:
  .byte 70, 73, 88, 0
str_66:
  .byte 69, 88, 80, 0
str_67:
  .byte 48, 45, 57, 63, 0
str_68:
  .byte 70, 85, 78, 67, 0
str_69:
  .byte 49, 58, 103, 99, 100, 32, 32, 32, 50, 58, 108, 99, 109, 0
str_70:
  .byte 51, 58, 73, 110, 116, 32, 32, 32, 52, 58, 82, 110, 100, 0
str_71:
  .byte 53, 58, 82, 97, 110, 35, 32, 32, 54, 58, 37, 0
str_72:
  .byte 55, 58, 80, 111, 108, 32, 32, 32, 56, 58, 82, 101, 99, 0
str_73:
  .byte 66, 82, 69, 65, 75, 0
str_74:
  .byte 70, 65, 85, 76, 84, 0
str_75:
  .byte 67, 65, 85, 83, 69, 0
str_76:
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
  lw t0, 0x0656(zero)
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
  lw t0, 0x0656(zero)
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
  sw s0, 0x0656(zero)
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
; sci/layout.e16.ts:39 tokenAt(i) at -O1
;   i in a0
tokenAt:
  ; sci/layout.e16.ts:40  return peek(buf + i)
  lw t0, 0x0658(zero)
  add t0, t0, a0
  lbu a0, 0(t0)
.return:
  ret

; sci/layout.e16.ts:46 closeOf(i/j) at -O1
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
  ; sci/layout.e16.ts:47  let depth: u16 = 0
  li s2, 0 ; depth
  ; sci/layout.e16.ts:48  for (let j = i; j < bufLength; j++) {
  j .L3
.L1:
  ; sci/layout.e16.ts:49  const t = tokenAt(j)
  mv a0, s1
  call tokenAt
  mv s3, a0 ; t
  ; sci/layout.e16.ts:50  if (opensTemplate(t)) depth++
  mv a0, s3
  call opensTemplate
  beqz a0, .L5
  ; sci/layout.e16.ts:50  depth++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/layout.e16.ts:51  if (t === T_END) {
  li t0, 24
  bne s3, t0, .L7
  ; sci/layout.e16.ts:52  depth--
  addi s2, s2, -1
  ; sci/layout.e16.ts:53  if (depth === 0) return j
  bne s2, zero, .L8
  ; sci/layout.e16.ts:53  return j
  mv a0, s1
  j .return
.L8:
.L7:
.L6:
  addi s1, s1, 1
.L3:
  lw t0, 0x065a(zero)
  bltu s1, t0, .L1
  ; sci/layout.e16.ts:56  return bufLength
  lw a0, 0x065a(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/layout.e16.ts:60 partEnd(from/j) at -O1
;   from/j in s1
;   depth in s2
;   t in s3
partEnd:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; from/j
  ; sci/layout.e16.ts:61  let depth: u16 = 0
  li s2, 0 ; depth
  ; sci/layout.e16.ts:62  for (let j = from; j < bufLength; j++) {
  j .L3
.L1:
  ; sci/layout.e16.ts:63  const t = tokenAt(j)
  mv a0, s1
  call tokenAt
  mv s3, a0 ; t
  ; sci/layout.e16.ts:64  if (opensTemplate(t)) depth++
  mv a0, s3
  call opensTemplate
  beqz a0, .L5
  ; sci/layout.e16.ts:64  depth++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/layout.e16.ts:65  if (depth === 0 && (t === T_END || isSeparator(t))) return j
  bne s2, zero, .L7
  li t0, 24
  beq s3, t0, .L8
  mv a0, s3
  call isSeparator
  beqz a0, .L7
.L8:
  ; sci/layout.e16.ts:65  return j
  mv a0, s1
  j .return
.L7:
  ; sci/layout.e16.ts:66  if (t === T_END) depth--
  li t0, 24
  bne s3, t0, .L10
  ; sci/layout.e16.ts:66  depth--
  addi s2, s2, -1
.L10:
.L6:
  addi s1, s1, 1
.L3:
  lw t0, 0x065a(zero)
  bltu s1, t0, .L1
  ; sci/layout.e16.ts:68  return bufLength
  lw a0, 0x065a(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/layout.e16.ts:74 measureSeq(from/i, to) at -O1
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
  ; sci/layout.e16.ts:75  if (from >= to) {
  lw t0, 2(sp) ; to
  bltu s1, t0, .L1
  ; sci/layout.e16.ts:76  boxUp = 7
  li t0, 7
  sw t0, 0x0666(zero)
  ; sci/layout.e16.ts:77  boxDown = 0
  sw zero, 0x0668(zero)
  ; sci/layout.e16.ts:78  return 6
  li a0, 6
  j .return
.L1:
  ; sci/layout.e16.ts:80  let width: u16 = 0
  li s3, 0 ; width
  ; sci/layout.e16.ts:81  let up: u16 = 7
  li s0, 7 ; up
  ; sci/layout.e16.ts:82  let down: u16 = 0
  sw zero, 0(sp) ; down
  ; sci/layout.e16.ts:83  let lift: u16 = 0
  li s2, 0 ; lift
  ; sci/layout.e16.ts:84  let i = from
  ; sci/layout.e16.ts:85  while (i < to) {
  j .L4
.L2:
  ; sci/layout.e16.ts:86  const t = tokenAt(i)
  mv a0, s1
  call tokenAt
  sw a0, 4(sp) ; t
  ; sci/layout.e16.ts:87  lift = t === T_POWT ? lift + 4 : 0
  li t0, 26
  lw t1, 4(sp) ; t
  bne t1, t0, .L6
  addi t0, s2, 4
  j .L7
.L6:
  li t0, 0
.L7:
  mv s2, t0 ; lift
  ; sci/layout.e16.ts:88  width += measureItem(i)
  mv a0, s1
  call measureItem
  add s3, s3, a0
  ; sci/layout.e16.ts:89  if (boxUp + lift > up) up = boxUp + lift
  lw t0, 0x0666(zero)
  add t0, t0, s2
  bgeu s0, t0, .L8
  ; sci/layout.e16.ts:89  up = boxUp + lift
  lw t0, 0x0666(zero)
  add s0, t0, s2
.L8:
  ; sci/layout.e16.ts:90  if (boxDown > down) down = boxDown
  lw t0, 0x0668(zero)
  lw t1, 0(sp) ; down
  bgeu t1, t0, .L9
  ; sci/layout.e16.ts:90  down = boxDown
  lw t0, 0x0668(zero)
  sw t0, 0(sp) ; down
.L9:
  ; sci/layout.e16.ts:91  i = opensTemplate(t) ? closeOf(i) + 1 : i + 1
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
  ; sci/layout.e16.ts:93  boxUp = up
  sw s0, 0x0666(zero)
  ; sci/layout.e16.ts:94  boxDown = down
  lw t0, 0(sp) ; down
  sw t0, 0x0668(zero)
  ; sci/layout.e16.ts:95  return width
  mv a0, s3
.return:
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  lw s2, 14(sp)
  addi sp, sp, 16
  ret

; sci/layout.e16.ts:99 measureItem(i) at -O1
;   i in s2
;   t/sep/wa in s1
measureItem:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; i
  ; sci/layout.e16.ts:100  const t = tokenAt(i)
  mv a0, s2
  call tokenAt
  mv s1, a0 ; t/sep/wa
  ; sci/layout.e16.ts:101  if (t === T_FRAC) {
  li t0, 22
  bne s1, t0, .L1
  ; sci/layout.e16.ts:102  const sep = partEnd(i + 1)
  addi a0, s2, 1
  call partEnd
  mv s1, a0 ; t/sep/wa
  ; sci/layout.e16.ts:103  return measureFraction(i + 1, sep, partEnd(sep + 1))
  addi a0, s1, 1
  call partEnd
  mv a1, s1
  mv a2, a0
  addi a0, s2, 1
  call measureFraction
  j .return
.L1:
  ; sci/layout.e16.ts:105  if (t === T_MIXED) return measureMixed(i)
  li t0, 28
  bne s1, t0, .L2
  ; sci/layout.e16.ts:105  return measureMixed(i)
  mv a0, s2
  call measureMixed
  j .return
.L2:
  ; sci/layout.e16.ts:106  if (t === T_XROOT) return measureAnyRoot(i)
  li t0, 30
  bne s1, t0, .L3
  ; sci/layout.e16.ts:106  return measureAnyRoot(i)
  mv a0, s2
  call measureAnyRoot
  j .return
.L3:
  ; sci/layout.e16.ts:107  if (t === T_ROOT) {
  li t0, 25
  bne s1, t0, .L4
  ; sci/layout.e16.ts:108  const wa = measureSeq(i + 1, closeOf(i))
  mv a0, s2
  call closeOf
  mv a1, a0
  addi a0, s2, 1
  call measureSeq
  mv s1, a0 ; t/sep/wa
  ; sci/layout.e16.ts:109  boxUp += 2
  lw t0, 0x0666(zero)
  addi t0, t0, 2
  sw t0, 0x0666(zero)
  ; sci/layout.e16.ts:110  return wa + 6
  addi a0, s1, 6
  j .return
.L4:
  ; sci/layout.e16.ts:112  if (t === T_POWT) {
  li t0, 26
  bne s1, t0, .L5
  ; sci/layout.e16.ts:113  const wa = measureSeq(i + 1, closeOf(i))
  mv a0, s2
  call closeOf
  mv a1, a0
  addi a0, s2, 1
  call measureSeq
  mv s1, a0 ; t/sep/wa
  ; sci/layout.e16.ts:114  boxUp += 4
  lw t0, 0x0666(zero)
  addi t0, t0, 4
  sw t0, 0x0666(zero)
  ; sci/layout.e16.ts:115  boxDown = 0
  sw zero, 0x0668(zero)
  ; sci/layout.e16.ts:116  return wa + 1
  addi a0, s1, 1
  j .return
.L5:
  ; sci/layout.e16.ts:118  boxUp = 7
  li t0, 7
  sw t0, 0x0666(zero)
  ; sci/layout.e16.ts:119  boxDown = 0
  sw zero, 0x0668(zero)
  ; sci/layout.e16.ts:120  return charsOf(t) * 6
  mv a0, s1
  call charsOf
  slli t1, a0, 2
  slli t0, a0, 1
  add a0, t0, t1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/layout.e16.ts:124 measureFraction(from/wa, sep/wb, end/reach) at -O1
;   from/wa in s3
;   sep/wb in s1
;   end/reach in s2
;   ua in s0
;   da in 0(sp)
measureFraction:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s0, 10(sp)
  mv s3, a0 ; from/wa
  mv s1, a1 ; sep/wb
  mv s2, a2 ; end/reach
  ; sci/layout.e16.ts:125  const wa = measureSeq(from, sep)
  mv a0, s3
  mv a1, s1
  call measureSeq
  mv s3, a0 ; from/wa
  ; sci/layout.e16.ts:126  const ua = boxUp
  lw s0, 0x0666(zero)
  ; sci/layout.e16.ts:127  const da = boxDown
  lw t0, 0x0668(zero)
  sw t0, 0(sp) ; da
  ; sci/layout.e16.ts:128  const wb = measureSeq(sep + 1, end)
  addi a0, s1, 1
  mv a1, s2
  call measureSeq
  mv s1, a0 ; sep/wb
  ; sci/layout.e16.ts:129  const reach = boxUp + boxDown
  lw t0, 0x0666(zero)
  lw t1, 0x0668(zero)
  add s2, t0, t1
  ; sci/layout.e16.ts:130  boxUp = MID + 2 + da + ua
  lw t0, 0(sp) ; da
  addi t0, t0, 6
  add t0, t0, s0
  sw t0, 0x0666(zero)
  ; sci/layout.e16.ts:131  boxDown = reach > 0 ? reach - 1 : 0
  bgeu zero, s2, .L1
  addi t0, s2, -1
  j .L2
.L1:
  li t0, 0
.L2:
  sw t0, 0x0668(zero)
  ; sci/layout.e16.ts:132  return wider(wa, wb) + 6
  mv a0, s3
  mv a1, s1
  call wider
  addi a0, a0, 6
.return:
  lw ra, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s0, 10(sp)
  addi sp, sp, 12
  ret

; sci/layout.e16.ts:136 measureMixed(i/ww) at -O1
;   i/ww in s2
;   msep/wf in s1
;   mdiv in s3
;   wu in s0
;   wd in 0(sp)
measureMixed:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s0, 10(sp)
  mv s2, a0 ; i/ww
  ; sci/layout.e16.ts:137  const msep = partEnd(i + 1)
  addi a0, s2, 1
  call partEnd
  mv s1, a0 ; msep/wf
  ; sci/layout.e16.ts:138  const mdiv = partEnd(msep + 1)
  addi a0, s1, 1
  call partEnd
  mv s3, a0 ; mdiv
  ; sci/layout.e16.ts:139  const ww = measureSeq(i + 1, msep)
  addi a0, s2, 1
  mv a1, s1
  call measureSeq
  mv s2, a0 ; i/ww
  ; sci/layout.e16.ts:140  const wu = boxUp
  lw s0, 0x0666(zero)
  ; sci/layout.e16.ts:141  const wd = boxDown
  lw t0, 0x0668(zero)
  sw t0, 0(sp) ; wd
  ; sci/layout.e16.ts:142  const wf = measureFraction(msep + 1, mdiv, partEnd(mdiv + 1))
  addi a0, s3, 1
  call partEnd
  mv a1, s3
  mv a2, a0
  addi a0, s1, 1
  call measureFraction
  mv s1, a0 ; msep/wf
  ; sci/layout.e16.ts:143  boxUp = wider(wu, boxUp)
  lw a1, 0x0666(zero)
  mv a0, s0
  call wider
  sw a0, 0x0666(zero)
  ; sci/layout.e16.ts:144  boxDown = wider(wd, boxDown)
  lw a1, 0x0668(zero)
  lw a0, 0(sp)
  call wider
  sw a0, 0x0668(zero)
  ; sci/layout.e16.ts:145  return ww + 1 + wf
  addi t0, s2, 1
  add a0, t0, s1
.return:
  lw ra, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s0, 10(sp)
  addi sp, sp, 12
  ret

; sci/layout.e16.ts:151 measureAnyRoot(i/wi) at -O1
;   i/wi in s2
;   xsep/wb in s1
;   iu in s3
measureAnyRoot:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; i/wi
  ; sci/layout.e16.ts:152  const xsep = partEnd(i + 1)
  addi a0, s2, 1
  call partEnd
  mv s1, a0 ; xsep/wb
  ; sci/layout.e16.ts:153  const wi = measureSeq(i + 1, xsep)
  addi a0, s2, 1
  mv a1, s1
  call measureSeq
  mv s2, a0 ; i/wi
  ; sci/layout.e16.ts:154  const iu = boxUp + INDEX_LIFT
  lw t0, 0x0666(zero)
  addi s3, t0, 5
  ; sci/layout.e16.ts:155  const wb = measureSeq(xsep + 1, partEnd(xsep + 1))
  addi a0, s1, 1
  call partEnd
  mv a1, a0
  addi a0, s1, 1
  call measureSeq
  mv s1, a0 ; xsep/wb
  ; sci/layout.e16.ts:156  boxUp = wider(boxUp + 2, iu)
  lw t0, 0x0666(zero)
  addi a0, t0, 2
  mv a1, s3
  call wider
  sw a0, 0x0666(zero)
  ; sci/layout.e16.ts:157  return wi + wb + 4
  add t0, s2, s1
  addi a0, t0, 4
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/layout.e16.ts:161 wider(a, b) at -O1
;   a in a0
;   b in a1
wider:
  ; sci/layout.e16.ts:162  if (a > b) return a
  bgeu a1, a0, .L1
  ; sci/layout.e16.ts:162  return a
  ret
.L1:
  ; sci/layout.e16.ts:163  return b
  mv a0, a1
.return:
  ret

; sci/layout.e16.ts:167 charsOf(t/text) at -O1
;   t/text in s1
;   n in s2
charsOf:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t/text
  ; sci/layout.e16.ts:168  const text = tokenText(t)
  mv a0, s1
  call tokenText
  mv s1, a0 ; t/text
  ; sci/layout.e16.ts:169  if (text === 0) return 1
  bne s1, zero, .L1
  ; sci/layout.e16.ts:169  return 1
  li a0, 1
  j .return
.L1:
  ; sci/layout.e16.ts:170  let n: u16 = 0
  li s2, 0 ; n
  ; sci/layout.e16.ts:171  while (peek(text + n) !== 0) n++
  j .L4
.L2:
  ; sci/layout.e16.ts:171  n++
  addi s2, s2, 1
.L4:
  add t0, s1, s2
  lbu t0, 0(t0)
  bne t0, zero, .L2
  ; sci/layout.e16.ts:172  return n
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/layout.e16.ts:178 plot(x, y) at -O1
;   x in s1
;   y in s2
plot:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  ; sci/layout.e16.ts:179  if (!ink || x < slide || x - slide >= 128 || y >= 64) return
  lw t0, 0x065e(zero)
  beqz t0, .L2
  lw t0, 0x065c(zero)
  bltu s1, t0, .L2
  lw t0, 0x065c(zero)
  sub t0, s1, t0
  li t1, 128
  bgeu t0, t1, .L2
  li t0, 64
  bltu s2, t0, .L1
.L2:
  ; sci/layout.e16.ts:179  return
  j .return
.L1:
  ; sci/layout.e16.ts:180  dot(x - slide, y)
  lw t0, 0x065c(zero)
  sub a0, s1, t0
  mv a1, s2
  call dot
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/layout.e16.ts:183 hline(x0/x, x1, y) at -O1
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
  ; sci/layout.e16.ts:184  for (let x = x0; x <= x1; x++) plot(x, y)
  j .L3
.L1:
  ; sci/layout.e16.ts:184  plot(x, y)
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

; sci/layout.e16.ts:188 char(c, x, y) at -O1
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
  ; sci/layout.e16.ts:189  if (!ink || x < slide || x - slide > 122) return
  lw t0, 0x065e(zero)
  beqz t0, .L2
  lw t0, 0x065c(zero)
  bltu s1, t0, .L2
  lw t0, 0x065c(zero)
  sub t0, s1, t0
  li t1, 122
  bgeu t1, t0, .L1
.L2:
  ; sci/layout.e16.ts:189  return
  j .return
.L1:
  ; sci/layout.e16.ts:190  glyphAt(c, x - slide, y)
  lw t0, 0x065c(zero)
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

; sci/layout.e16.ts:194 cursorAt(i, x, foot) at -O1
;   i in a0
;   x in a1
;   foot in a2
cursorAt:
  ; sci/layout.e16.ts:195  if (i !== cursorIndex) return
  lw t0, 0x0660(zero)
  beq a0, t0, .L1
  ; sci/layout.e16.ts:195  return
  ret
.L1:
  ; sci/layout.e16.ts:196  cursorX = x > 0 ? x - 1 : 0
  bgeu zero, a1, .L2
  addi t0, a1, -1
  j .L3
.L2:
  li t0, 0
.L3:
  sw t0, 0x0662(zero)
  ; sci/layout.e16.ts:197  cursorTop = foot - 8
  addi t0, a2, -8
  sw t0, 0x0664(zero)
.return:
  ret

; sci/layout.e16.ts:201 drawSeq(from/i, to, x/lift, foot) at -O1
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
  ; sci/layout.e16.ts:202  cursorAt(from, x, foot)
  mv a0, s2
  mv a1, s3
  mv a2, s0
  call cursorAt
  ; sci/layout.e16.ts:203  if (from >= to) {
  lw t0, 0(sp) ; to
  bltu s2, t0, .L1
  ; sci/layout.e16.ts:205  if (cursorIndex !== from) {
  lw t0, 0x0660(zero)
  beq t0, s2, .L2
  ; sci/layout.e16.ts:206  for (let k: u16 = 0; k < 5; k += 2) {
  li s1, 0 ; k/at
  j .L5
.L3:
  ; sci/layout.e16.ts:207  plot(x + k, foot - 7)
  add a0, s3, s1
  addi a1, s0, -7
  call plot
  ; sci/layout.e16.ts:208  plot(x + k, foot - 1)
  add a0, s3, s1
  addi a1, s0, -1
  call plot
  addi s1, s1, 2
.L5:
  li t0, 5
  bltu s1, t0, .L3
  ; sci/layout.e16.ts:210  for (let k: u16 = 2; k < 6; k += 2) {
  li s1, 2 ; k/at
  j .L9
.L7:
  ; sci/layout.e16.ts:211  plot(x, foot - 7 + k)
  addi t0, s0, -7
  add a1, t0, s1
  mv a0, s3
  call plot
  ; sci/layout.e16.ts:212  plot(x + 4, foot - 7 + k)
  addi t0, s0, -7
  add a1, t0, s1
  addi a0, s3, 4
  call plot
  addi s1, s1, 2
.L9:
  li t0, 6
  bltu s1, t0, .L7
.L2:
  ; sci/layout.e16.ts:215  return x + 6
  addi a0, s3, 6
  j .return
.L1:
  ; sci/layout.e16.ts:217  let at = x
  mv s1, s3 ; k/at
  ; sci/layout.e16.ts:218  let lift: u16 = 0
  li s3, 0 ; x/lift
  ; sci/layout.e16.ts:219  let i = from
  ; sci/layout.e16.ts:220  while (i < to) {
  j .L13
.L11:
  ; sci/layout.e16.ts:221  const t = tokenAt(i)
  mv a0, s2
  call tokenAt
  sw a0, 2(sp) ; t
  ; sci/layout.e16.ts:222  lift = t === T_POWT ? lift + 4 : 0
  li t0, 26
  lw t1, 2(sp) ; t
  bne t1, t0, .L15
  addi t0, s3, 4
  j .L16
.L15:
  li t0, 0
.L16:
  mv s3, t0 ; x/lift
  ; sci/layout.e16.ts:223  at = drawItem(i, at, foot - lift)
  sub a2, s0, s3
  mv a0, s2
  mv a1, s1
  call drawItem
  mv s1, a0 ; k/at
  ; sci/layout.e16.ts:224  i = opensTemplate(t) ? closeOf(i) + 1 : i + 1
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
  ; sci/layout.e16.ts:225  cursorAt(i, at, foot)
  mv a0, s2
  mv a1, s1
  mv a2, s0
  call cursorAt
.L13:
  lw t0, 0(sp) ; to
  bltu s2, t0, .L11
  ; sci/layout.e16.ts:227  return at
  mv a0, s1
.return:
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s0, 10(sp)
  lw s1, 12(sp)
  addi sp, sp, 14
  ret

; sci/layout.e16.ts:230 drawItem(i/text/p, x/at, foot) at -O1
;   i/text/p in s1
;   x/at in s2
;   foot in s3
;   t in s0
drawItem:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; i/text/p
  mv s2, a1 ; x/at
  mv s3, a2 ; foot
  ; sci/layout.e16.ts:231  const t = tokenAt(i)
  mv a0, s1
  call tokenAt
  mv s0, a0 ; t
  ; sci/layout.e16.ts:232  if (t === T_FRAC) {
  li t0, 22
  bne s0, t0, .L1
  ; sci/layout.e16.ts:233  return drawFraction(i + 1, partEnd(i + 1), x, foot)
  addi a0, s1, 1
  call partEnd
  mv a1, a0
  addi a0, s1, 1
  mv a2, s2
  mv a3, s3
  call drawFraction
  j .return
.L1:
  ; sci/layout.e16.ts:235  if (t === T_MIXED) return drawMixed(i, x, foot)
  li t0, 28
  bne s0, t0, .L2
  ; sci/layout.e16.ts:235  return drawMixed(i, x, foot)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call drawMixed
  j .return
.L2:
  ; sci/layout.e16.ts:236  if (t === T_XROOT) return drawAnyRoot(i, x, foot)
  li t0, 30
  bne s0, t0, .L3
  ; sci/layout.e16.ts:236  return drawAnyRoot(i, x, foot)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call drawAnyRoot
  j .return
.L3:
  ; sci/layout.e16.ts:237  if (t === T_ROOT) return drawRoot(i + 1, closeOf(i), x, foot)
  li t0, 25
  bne s0, t0, .L4
  ; sci/layout.e16.ts:237  return drawRoot(i + 1, closeOf(i), x, foot)
  mv a0, s1
  call closeOf
  mv a1, a0
  addi a0, s1, 1
  mv a2, s2
  mv a3, s3
  call drawRoot
  j .return
.L4:
  ; sci/layout.e16.ts:238  if (t === T_POWT) return drawSeq(i + 1, closeOf(i), x, foot - 4) + 1
  li t0, 26
  bne s0, t0, .L5
  ; sci/layout.e16.ts:238  return drawSeq(i + 1, closeOf(i), x, foot - 4) + 1
  mv a0, s1
  call closeOf
  mv a1, a0
  addi a0, s1, 1
  mv a2, s2
  addi a3, s3, -4
  call drawSeq
  addi a0, a0, 1
  j .return
.L5:
  ; sci/layout.e16.ts:239  const text = tokenText(t)
  mv a0, s0
  call tokenText
  mv s1, a0 ; i/text/p
  ; sci/layout.e16.ts:240  if (text === 0) {
  bne s1, zero, .L6
  ; sci/layout.e16.ts:241  char(t, x, foot - 7)
  mv a0, s0
  mv a1, s2
  addi a2, s3, -7
  call char
  ; sci/layout.e16.ts:242  return x + 6
  addi a0, s2, 6
  j .return
.L6:
  ; sci/layout.e16.ts:244  let at = x
  ; sci/layout.e16.ts:245  let p = text
  ; sci/layout.e16.ts:246  while (peek(p) !== 0) {
  j .L9
.L7:
  ; sci/layout.e16.ts:247  char(peek(p), at, foot - 7)
  lbu a0, 0(s1)
  mv a1, s2
  addi a2, s3, -7
  call char
  ; sci/layout.e16.ts:248  at += 6
  addi s2, s2, 6
  ; sci/layout.e16.ts:249  p++
  addi s1, s1, 1
.L9:
  lbu t0, 0(s1)
  bne t0, zero, .L7
  ; sci/layout.e16.ts:251  return at
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/layout.e16.ts:258 drawFraction(from, sep, x, foot/bar) at -O1
;   from in 0(sp)
;   sep in s1
;   x in s2
;   foot/bar in s3
;   end in 2(sp)
;   wa in 4(sp)
;   da in 8(sp)
;   wb in 6(sp)
;   ub in 10(sp)
;   w in s0
drawFraction:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s1, 14(sp)
  sw s2, 16(sp)
  sw s3, 18(sp)
  sw s0, 20(sp)
  sw a0, 0(sp) ; from
  mv s1, a1 ; sep
  mv s2, a2 ; x
  mv s3, a3 ; foot/bar
  ; sci/layout.e16.ts:259  const end = partEnd(sep + 1)
  addi a0, s1, 1
  call partEnd
  sw a0, 2(sp) ; end
  ; sci/layout.e16.ts:260  const wa = measureSeq(from, sep)
  lw a0, 0(sp)
  mv a1, s1
  call measureSeq
  sw a0, 4(sp) ; wa
  ; sci/layout.e16.ts:261  const da = boxDown
  lw t0, 0x0668(zero)
  sw t0, 8(sp) ; da
  ; sci/layout.e16.ts:262  const wb = measureSeq(sep + 1, end)
  addi a0, s1, 1
  lw a1, 2(sp)
  call measureSeq
  sw a0, 6(sp) ; wb
  ; sci/layout.e16.ts:263  const ub = boxUp
  lw t0, 0x0666(zero)
  sw t0, 10(sp) ; ub
  ; sci/layout.e16.ts:264  const w = wider(wa, wb) + 6
  lw a0, 4(sp)
  lw a1, 6(sp)
  call wider
  addi s0, a0, 6
  ; sci/layout.e16.ts:265  const bar = foot - MID
  addi s3, s3, -4
  ; sci/layout.e16.ts:266  hline(x + 1, x + w - 3, bar)
  add t0, s2, s0
  addi a0, s2, 1
  addi a1, t0, -3
  mv a2, s3
  call hline
  ; sci/layout.e16.ts:267  drawSeq(from, sep, x + ((w - wa) >> 1), bar - 2 - da)
  lw t0, 4(sp) ; wa
  sub t0, s0, t0
  srli t0, t0, 1
  add a2, s2, t0
  lw t1, 8(sp) ; da
  addi t2, s3, -2
  sub a3, t2, t1
  lw a0, 0(sp)
  mv a1, s1
  call drawSeq
  ; sci/layout.e16.ts:268  drawSeq(sep + 1, end, x + ((w - wb) >> 1), bar + 2 + ub)
  lw t0, 6(sp) ; wb
  sub t0, s0, t0
  srli t0, t0, 1
  add a2, s2, t0
  lw t1, 10(sp) ; ub
  addi t2, s3, 2
  add a3, t2, t1
  addi a0, s1, 1
  lw a1, 2(sp)
  call drawSeq
  ; sci/layout.e16.ts:269  return x + w
  add a0, s2, s0
.return:
  lw ra, 12(sp)
  lw s1, 14(sp)
  lw s2, 16(sp)
  lw s3, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; sci/layout.e16.ts:272 drawMixed(i/after, x, foot) at -O1
;   i/after in s1
;   x in s0
;   foot in s3
;   msep in s2
;   mdiv in 0(sp)
drawMixed:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s1, 4(sp)
  sw s0, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  mv s1, a0 ; i/after
  mv s0, a1 ; x
  mv s3, a2 ; foot
  ; sci/layout.e16.ts:273  const msep = partEnd(i + 1)
  addi a0, s1, 1
  call partEnd
  mv s2, a0 ; msep
  ; sci/layout.e16.ts:274  const mdiv = partEnd(msep + 1)
  addi a0, s2, 1
  call partEnd
  sw a0, 0(sp) ; mdiv
  ; sci/layout.e16.ts:275  const after = drawSeq(i + 1, msep, x, foot)
  addi a0, s1, 1
  mv a1, s2
  mv a2, s0
  mv a3, s3
  call drawSeq
  mv s1, a0 ; i/after
  ; sci/layout.e16.ts:276  return drawFraction(msep + 1, mdiv, after + 1, foot)
  addi a0, s2, 1
  lw a1, 0(sp)
  addi a2, s1, 1
  mv a3, s3
  call drawFraction
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  addi sp, sp, 12
  ret

; sci/layout.e16.ts:279 drawAnyRoot(i/after, x, foot) at -O1
;   i/after in s1
;   x in s0
;   foot in s3
;   xsep in s2
drawAnyRoot:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s0, 4(sp)
  sw s3, 6(sp)
  sw s2, 8(sp)
  mv s1, a0 ; i/after
  mv s0, a1 ; x
  mv s3, a2 ; foot
  ; sci/layout.e16.ts:280  const xsep = partEnd(i + 1)
  addi a0, s1, 1
  call partEnd
  mv s2, a0 ; xsep
  ; sci/layout.e16.ts:281  const after = drawSeq(i + 1, xsep, x, foot - INDEX_LIFT)
  addi a0, s1, 1
  mv a1, s2
  mv a2, s0
  addi a3, s3, -5
  call drawSeq
  mv s1, a0 ; i/after
  ; sci/layout.e16.ts:282  return drawRoot(xsep + 1, partEnd(xsep + 1), after - 2, foot)
  addi a0, s2, 1
  call partEnd
  mv a1, a0
  addi a0, s2, 1
  addi a2, s1, -2
  mv a3, s3
  call drawRoot
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/layout.e16.ts:286 drawRoot(from, end, x, foot) at -O1
;   from in 0(sp)
;   end in 2(sp)
;   x in s1
;   foot in s2
;   wa in 4(sp)
;   top in s0
;   half in 6(sp)
;   y in s3
drawRoot:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s0, 14(sp)
  sw s3, 16(sp)
  sw a0, 0(sp) ; from
  sw a1, 2(sp) ; end
  mv s1, a2 ; x
  mv s2, a3 ; foot
  ; sci/layout.e16.ts:287  const wa = measureSeq(from, end)
  lw a0, 0(sp)
  lw a1, 2(sp)
  call measureSeq
  sw a0, 4(sp) ; wa
  ; sci/layout.e16.ts:288  const top = foot - boxUp - 2
  lw t0, 0x0666(zero)
  sub t0, s2, t0
  addi s0, t0, -2
  ; sci/layout.e16.ts:289  plot(x, foot - 4)
  mv a0, s1
  addi a1, s2, -4
  call plot
  ; sci/layout.e16.ts:290  plot(x + 1, foot - 3)
  addi a0, s1, 1
  addi a1, s2, -3
  call plot
  ; sci/layout.e16.ts:291  plot(x + 1, foot - 2)
  addi a0, s1, 1
  addi a1, s2, -2
  call plot
  ; sci/layout.e16.ts:292  plot(x + 2, foot - 1)
  addi a0, s1, 2
  addi a1, s2, -1
  call plot
  ; sci/layout.e16.ts:293  const half = (foot - top) >> 1
  sub t0, s2, s0
  srli t0, t0, 1
  sw t0, 6(sp) ; half
  ; sci/layout.e16.ts:294  for (let y = top; y < foot; y++) plot(foot - y > half ? x + 3 : x + 4, y)
  mv s3, s0 ; y
  j .L3
.L1:
  ; sci/layout.e16.ts:294  plot(foot - y > half ? x + 3 : x + 4, y)
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
  ; sci/layout.e16.ts:295  hline(x + 4, x + 4 + wa, top)
  lw t0, 4(sp) ; wa
  addi t1, s1, 4
  add a1, t1, t0
  addi a0, s1, 4
  mv a2, s0
  call hline
  ; sci/layout.e16.ts:296  drawSeq(from, end, x + 5, foot)
  lw a0, 0(sp)
  lw a1, 2(sp)
  addi a2, s1, 5
  mv a3, s2
  call drawSeq
  ; sci/layout.e16.ts:297  return x + wa + 6
  lw t0, 4(sp) ; wa
  add t0, s1, t0
  addi a0, t0, 6
.return:
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s0, 14(sp)
  lw s3, 16(sp)
  addi sp, sp, 18
  ret

; sci/layout.e16.ts:303 heightOf(at, length) at -O1
;   at in s2
;   length in s1
heightOf:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; at
  mv s1, a1 ; length
  ; sci/layout.e16.ts:304  buf = at
  sw s2, 0x0658(zero)
  ; sci/layout.e16.ts:305  bufLength = length
  sw s1, 0x065a(zero)
  ; sci/layout.e16.ts:306  measureSeq(0, length)
  li a0, 0
  mv a1, s1
  call measureSeq
  ; sci/layout.e16.ts:307  return boxUp + boxDown
  lw t0, 0x0666(zero)
  lw t1, 0x0668(zero)
  add a0, t0, t1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/layout.e16.ts:314 setLine(at/foot, length, cursor) at -O1
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
  ; sci/layout.e16.ts:315  buf = at
  sw s1, 0x0658(zero)
  ; sci/layout.e16.ts:316  bufLength = length
  sw s2, 0x065a(zero)
  ; sci/layout.e16.ts:317  measureSeq(0, length)
  li a0, 0
  mv a1, s2
  call measureSeq
  ; sci/layout.e16.ts:318  const foot = 2 + (boxUp > 7 ? boxUp : 7)
  lw t1, 0x0666(zero)
  li t0, 2
  li t2, 7
  bgeu t2, t1, .L1
  lw t1, 0x0666(zero)
  j .L2
.L1:
  li t1, 7
.L2:
  add s1, t0, t1
  ; sci/layout.e16.ts:319  cursorIndex = cursor
  sw s3, 0x0660(zero)
  ; sci/layout.e16.ts:320  slide = 0
  sw zero, 0x065c(zero)
  ; sci/layout.e16.ts:321  ink = false
  sw zero, 0x065e(zero)
  ; sci/layout.e16.ts:322  drawSeq(0, length, 1, foot)
  li a0, 0
  mv a1, s2
  li a2, 1
  mv a3, s1
  call drawSeq
  ; sci/layout.e16.ts:323  if (cursorX > 124) slide = cursorX - 124
  lw t0, 0x0662(zero)
  li t1, 124
  bgeu t1, t0, .L3
  ; sci/layout.e16.ts:323  slide = cursorX - 124
  lw t0, 0x0662(zero)
  addi t0, t0, -124
  sw t0, 0x065c(zero)
.L3:
  ; sci/layout.e16.ts:324  ink = true
  li t0, 1
  sw t0, 0x065e(zero)
  ; sci/layout.e16.ts:325  drawSeq(0, length, 1, foot)
  li a0, 0
  mv a1, s2
  li a2, 1
  mv a3, s1
  call drawSeq
  ; sci/layout.e16.ts:326  if (cursorX >= slide) cursorX -= slide
  lw t0, 0x0662(zero)
  lw t1, 0x065c(zero)
  bltu t0, t1, .L4
  ; sci/layout.e16.ts:326  cursorX -= slide
  lw t0, 0x0662(zero)
  lw t1, 0x065c(zero)
  sub t0, t0, t1
  sw t0, 0x0662(zero)
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/layout.e16.ts:330 setAnswer(at/w, length) at -O1
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
  ; sci/layout.e16.ts:331  buf = at
  sw s1, 0x0658(zero)
  ; sci/layout.e16.ts:332  bufLength = length
  sw s2, 0x065a(zero)
  ; sci/layout.e16.ts:333  const w = measureSeq(0, length)
  li a0, 0
  mv a1, s2
  call measureSeq
  mv s1, a0 ; at/w
  ; sci/layout.e16.ts:334  const foot = 62 - boxDown
  lw t0, 0x0668(zero)
  li t1, 62
  sub s3, t1, t0
  ; sci/layout.e16.ts:335  cursorIndex = 0xffff
  li t0, 65535
  sw t0, 0x0660(zero)
  ; sci/layout.e16.ts:336  slide = 0
  sw zero, 0x065c(zero)
  ; sci/layout.e16.ts:337  ink = true
  li t0, 1
  sw t0, 0x065e(zero)
  ; sci/layout.e16.ts:338  drawSeq(0, length, 128 - w, foot)
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
; sci/edit.e16.ts:39 openerOf(buf, end/j) at -O1
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
  ; sci/edit.e16.ts:40  let depth: u16 = 0
  li s2, 0 ; depth
  ; sci/edit.e16.ts:41  let j = end + 1
  addi s1, s1, 1
  ; sci/edit.e16.ts:42  while (j > 0) {
  j .L3
.L1:
  ; sci/edit.e16.ts:43  j--
  addi s1, s1, -1
  ; sci/edit.e16.ts:44  const t = peek(buf + j)
  add t0, s0, s1
  lbu s3, 0(t0)
  ; sci/edit.e16.ts:45  if (t === T_END) depth++
  li t0, 24
  bne s3, t0, .L5
  ; sci/edit.e16.ts:45  depth++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/edit.e16.ts:46  if (opensTemplate(t)) {
  mv a0, s3
  call opensTemplate
  beqz a0, .L7
  ; sci/edit.e16.ts:47  depth--
  addi s2, s2, -1
  ; sci/edit.e16.ts:48  if (depth === 0) return j
  bne s2, zero, .L8
  ; sci/edit.e16.ts:48  return j
  mv a0, s1
  j .return
.L8:
.L7:
.L6:
.L3:
  bltu zero, s1, .L1
  ; sci/edit.e16.ts:51  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/edit.e16.ts:55 bracketOf(buf, close) at -O1
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
  ; sci/edit.e16.ts:56  let depth: u16 = 0
  li s1, 0 ; depth
  ; sci/edit.e16.ts:57  let j = close + 1
  addi s2, s0, 1
  ; sci/edit.e16.ts:58  while (j > 0) {
  j .L3
.L1:
  ; sci/edit.e16.ts:59  j--
  addi s2, s2, -1
  ; sci/edit.e16.ts:60  const t = peek(buf + j)
  lw t0, 0(sp) ; buf
  add t0, t0, s2
  lbu s3, 0(t0)
  ; sci/edit.e16.ts:61  if (t === T_CLOSE) depth++
  li t0, 41
  bne s3, t0, .L5
  ; sci/edit.e16.ts:61  depth++
  addi s1, s1, 1
  j .L6
.L5:
  ; sci/edit.e16.ts:62  if (t === T_OPEN || isFunction(t)) {
  li t0, 40
  beq s3, t0, .L8
  mv a0, s3
  call isFunction
  beqz a0, .L7
.L8:
  ; sci/edit.e16.ts:63  depth--
  addi s1, s1, -1
  ; sci/edit.e16.ts:64  if (depth === 0) return j
  bne s1, zero, .L9
  ; sci/edit.e16.ts:64  return j
  mv a0, s2
  j .return
.L9:
.L7:
.L6:
.L3:
  bltu zero, s2, .L1
  ; sci/edit.e16.ts:67  return close
  mv a0, s0
.return:
  lw ra, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  addi sp, sp, 12
  ret

; sci/edit.e16.ts:72 operandStart(buf/open, cur) at -O1
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
  ; sci/edit.e16.ts:73  let j = pastPostfixes(buf, cur)
  mv a0, s2
  mv a1, s0
  call pastPostfixes
  mv s1, a0 ; j
  ; sci/edit.e16.ts:74  if (j === 0) return cur
  bne s1, zero, .L1
  ; sci/edit.e16.ts:74  return cur
  mv a0, s0
  j .return
.L1:
  ; sci/edit.e16.ts:75  const t = peek(buf + j - 1)
  add t0, s2, s1
  lbu s3, -1(t0)
  ; sci/edit.e16.ts:76  if (isDigit(t) || t === T_POINT) {
  mv a0, s3
  call isDigit
  bnez a0, .L6
  li t0, 46
  bne s3, t0, .L2
  ; sci/edit.e16.ts:77  while (j > 0 && (isDigit(peek(buf + j - 1)) || peek(buf + j - 1) === T_POINT)) j--
  j .L6
.L4:
  ; sci/edit.e16.ts:77  j--
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
  ; sci/edit.e16.ts:78  return j
  mv a0, s1
  j .return
.L2:
  ; sci/edit.e16.ts:80  if (t === T_PI || t === T_E || t === T_ANS || t === T_TEN || isVariable(t)) return j - 1
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
  ; sci/edit.e16.ts:80  return j - 1
  addi a0, s1, -1
  j .return
.L9:
  ; sci/edit.e16.ts:81  if (t === T_END) return openerOf(buf, j - 1)
  li t0, 24
  bne s3, t0, .L11
  ; sci/edit.e16.ts:81  return openerOf(buf, j - 1)
  mv a0, s2
  addi a1, s1, -1
  call openerOf
  j .return
.L11:
  ; sci/edit.e16.ts:82  if (t === T_CLOSE) {
  li t0, 41
  bne s3, t0, .L12
  ; sci/edit.e16.ts:83  const open = bracketOf(buf, j - 1)
  mv a0, s2
  addi a1, s1, -1
  call bracketOf
  mv s2, a0 ; buf/open
  ; sci/edit.e16.ts:84  return open === j - 1 ? cur : open
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
  ; sci/edit.e16.ts:86  return cur
  mv a0, s0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/edit.e16.ts:90 pastPostfixes(buf, cur/j) at -O1
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
  ; sci/edit.e16.ts:91  let j = cur
  ; sci/edit.e16.ts:92  while (j > 0) {
  j .L3
.L1:
  ; sci/edit.e16.ts:93  const t = peek(buf + j - 1)
  add t0, s3, s1
  lbu s2, -1(t0)
  ; sci/edit.e16.ts:94  if (t === T_SQUARE || t === T_CUBE || t === T_INVERSE || t === T_BANG) j--
  li t0, 132
  beq s2, t0, .L6
  li t0, 133
  beq s2, t0, .L6
  li t0, 134
  beq s2, t0, .L6
  li t0, 33
  bne s2, t0, .L5
.L6:
  ; sci/edit.e16.ts:94  j--
  addi s1, s1, -1
  j .L7
.L5:
  ; sci/edit.e16.ts:95  if (t === T_END && peek(buf + openerOf(buf, j - 1)) === T_POWT) j = openerOf(buf, j - 1)
  li t0, 24
  bne s2, t0, .L8
  mv a0, s3
  addi a1, s1, -1
  call openerOf
  add t0, s3, a0
  lbu t0, 0(t0)
  li t1, 26
  bne t0, t1, .L8
  ; sci/edit.e16.ts:95  j = openerOf(buf, j - 1)
  mv a0, s3
  addi a1, s1, -1
  call openerOf
  mv s1, a0 ; cur/j
  j .L9
.L8:
  ; sci/edit.e16.ts:96  return j
  mv a0, s1
  j .return
.L9:
.L7:
.L3:
  bltu zero, s1, .L1
  ; sci/edit.e16.ts:98  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/edit.e16.ts:106 wrap(buf/after, length, cur, opener) at -O1
;   buf/after in s1
;   length in 0(sp)
;   cur in s2
;   opener in s0
;   start in s3
;   size in 2(sp)
wrap:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s0, 10(sp)
  sw s3, 12(sp)
  mv s1, a0 ; buf/after
  sw a1, 0(sp) ; length
  mv s2, a2 ; cur
  mv s0, a3 ; opener
  ; sci/edit.e16.ts:107  const start = operandStart(buf, cur)
  mv a0, s1
  mv a1, s2
  call operandStart
  mv s3, a0 ; start
  ; sci/edit.e16.ts:108  const size = marksOf(opener)
  mv a0, s0
  call marksOf
  sw a0, 2(sp) ; size
  ; sci/edit.e16.ts:109  memcpy(buf + cur + size, buf + cur, length - cur)
  add t0, s1, s2
  lw t1, 2(sp) ; size
  add a0, t0, t1
  add a1, s1, s2
  lw t2, 0(sp) ; length
  sub a2, t2, s2
  mcpy a0, a1, a2
  ; sci/edit.e16.ts:110  memcpy(buf + start + 1, buf + start, cur - start)
  add t0, s1, s3
  add a1, s1, s3
  sub a2, s2, s3
  addi a0, t0, 1
  mcpy a0, a1, a2
  ; sci/edit.e16.ts:111  poke(buf + start, opener)
  add t0, s1, s3
  sb s0, 0(t0)
  ; sci/edit.e16.ts:112  const after = buf + cur + 1
  add t0, s1, s2
  addi s1, t0, 1
  ; sci/edit.e16.ts:113  if (opener === T_MIXED) {
  li t0, 28
  bne s0, t0, .L1
  ; sci/edit.e16.ts:114  poke(after, T_MSEP)
  li t0, 29
  sb t0, 0(s1)
  ; sci/edit.e16.ts:115  poke(after + 1, T_MDIV)
  li t0, 31
  sb t0, 1(s1)
  ; sci/edit.e16.ts:116  poke(after + 2, T_END)
  li t0, 24
  sb t0, 2(s1)
  j .L2
.L1:
  ; sci/edit.e16.ts:118  poke(after, opener === T_XROOT ? T_XSEP : T_SEP)
  mv t0, s1
  mv t1, s0
  li t2, 30
  bne t1, t2, .L3
  li t1, 11
  j .L4
.L3:
  li t1, 23
.L4:
  sb t1, 0(t0)
  ; sci/edit.e16.ts:119  poke(after + 1, T_END)
  li t0, 24
  sb t0, 1(s1)
.L2:
  ; sci/edit.e16.ts:121  editLength = length + size
  lw t0, 2(sp) ; size
  lw t1, 0(sp) ; length
  add t1, t1, t0
  sw t1, 0x066a(zero)
  ; sci/edit.e16.ts:122  editCursor = start === cur ? start + 1 : cur + 2
  bne s3, s2, .L5
  addi t0, s3, 1
  j .L6
.L5:
  addi t0, s2, 2
.L6:
  sw t0, 0x066c(zero)
.return:
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s0, 10(sp)
  lw s3, 12(sp)
  addi sp, sp, 14
  ret

; sci/edit.e16.ts:126 marksOf(opener) at -O1
;   opener in a0
marksOf:
  ; sci/edit.e16.ts:127  if (opener === T_MIXED) return 4
  li t0, 28
  bne a0, t0, .L1
  ; sci/edit.e16.ts:127  return 4
  li a0, 4
  ret
.L1:
  ; sci/edit.e16.ts:128  if (opener === T_FRAC || opener === T_XROOT) return 3
  li t0, 22
  beq a0, t0, .L3
  li t0, 30
  bne a0, t0, .L2
.L3:
  ; sci/edit.e16.ts:128  return 3
  li a0, 3
  ret
.L2:
  ; sci/edit.e16.ts:129  return 2
  li a0, 2
.return:
  ret

; sci/edit.e16.ts:133 empty(buf, open/j) at -O1
;   buf in s2
;   open/j in s1
;   last in s3
empty:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; buf
  mv s1, a1 ; open/j
  ; sci/edit.e16.ts:134  const last = open + marksOf(peek(buf + open)) - 1
  add t0, s2, s1
  lbu a0, 0(t0)
  call marksOf
  add t0, s1, a0
  addi s3, t0, -1
  ; sci/edit.e16.ts:135  for (let j = open + 1; j < last; j++) {
  addi s1, s1, 1
  j .L3
.L1:
  ; sci/edit.e16.ts:136  if (!isSeparator(peek(buf + j))) return false
  add t0, s2, s1
  lbu a0, 0(t0)
  call isSeparator
  bnez a0, .L5
  ; sci/edit.e16.ts:136  return false
  li a0, 0
  j .return
.L5:
  addi s1, s1, 1
.L3:
  bltu s1, s3, .L1
  ; sci/edit.e16.ts:138  return peek(buf + last) === T_END
  add t0, s2, s3
  lbu t0, 0(t0)
  li t1, 24
  sub t0, t0, t1
  seqz a0, t0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/edit.e16.ts:145 deleteAt(buf, length, cur/size) at -O1
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
  ; sci/edit.e16.ts:146  editLength = length
  sw s0, 0x066a(zero)
  ; sci/edit.e16.ts:147  editCursor = cur
  sw s1, 0x066c(zero)
  ; sci/edit.e16.ts:148  if (cur === 0) return
  bne s1, zero, .L1
  ; sci/edit.e16.ts:148  return
  j .return
.L1:
  ; sci/edit.e16.ts:149  const t = peek(buf + cur - 1)
  add t0, s3, s1
  lbu t0, -1(t0)
  sw t0, 0(sp) ; t
  ; sci/edit.e16.ts:150  let open: u16 = 0xffff
  li s2, 65535 ; open
  ; sci/edit.e16.ts:151  if (opensTemplate(t)) open = cur - 1
  lw a0, 0(sp)
  call opensTemplate
  beqz a0, .L2
  ; sci/edit.e16.ts:151  open = cur - 1
  addi s2, s1, -1
  j .L3
.L2:
  ; sci/edit.e16.ts:152  if (isSeparator(t)) open = fractionOf(buf, cur - 1)
  lw a0, 0(sp)
  call isSeparator
  beqz a0, .L4
  ; sci/edit.e16.ts:152  open = fractionOf(buf, cur - 1)
  mv a0, s3
  addi a1, s1, -1
  call fractionOf
  mv s2, a0 ; open
  j .L5
.L4:
  ; sci/edit.e16.ts:153  if (t === T_END) {
  li t0, 24
  lw t1, 0(sp) ; t
  bne t1, t0, .L6
  ; sci/edit.e16.ts:154  editCursor = cur - 1
  addi t0, s1, -1
  sw t0, 0x066c(zero)
  ; sci/edit.e16.ts:155  return
  j .return
.L6:
.L5:
.L3:
  ; sci/edit.e16.ts:157  if (open === 0xffff) {
  li t0, 65535
  bne s2, t0, .L7
  ; sci/edit.e16.ts:158  memcpy(buf + cur - 1, buf + cur, length - cur)
  add t0, s3, s1
  add a1, s3, s1
  sub a2, s0, s1
  addi a0, t0, -1
  mcpy a0, a1, a2
  ; sci/edit.e16.ts:159  editLength = length - 1
  addi t0, s0, -1
  sw t0, 0x066a(zero)
  ; sci/edit.e16.ts:160  editCursor = cur - 1
  addi t0, s1, -1
  sw t0, 0x066c(zero)
  ; sci/edit.e16.ts:161  return
  j .return
.L7:
  ; sci/edit.e16.ts:163  if (!empty(buf, open)) {
  mv a0, s3
  mv a1, s2
  call empty
  bnez a0, .L8
  ; sci/edit.e16.ts:164  editCursor = cur - 1
  addi t0, s1, -1
  sw t0, 0x066c(zero)
  ; sci/edit.e16.ts:165  return
  j .return
.L8:
  ; sci/edit.e16.ts:167  const size = marksOf(peek(buf + open))
  add t0, s3, s2
  lbu a0, 0(t0)
  call marksOf
  mv s1, a0 ; cur/size
  ; sci/edit.e16.ts:168  memcpy(buf + open, buf + open + size, length - open - size)
  add a0, s3, s2
  add t1, s3, s2
  add a1, t1, s1
  sub t2, s0, s2
  sub a2, t2, s1
  mcpy a0, a1, a2
  ; sci/edit.e16.ts:169  editLength = length - size
  sub t0, s0, s1
  sw t0, 0x066a(zero)
  ; sci/edit.e16.ts:170  editCursor = open
  sw s2, 0x066c(zero)
.return:
  lw ra, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  addi sp, sp, 12
  ret

; sci/edit.e16.ts:174 fractionOf(buf, sep/j) at -O1
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
  ; sci/edit.e16.ts:175  let depth: u16 = 0
  li s2, 0 ; depth
  ; sci/edit.e16.ts:176  let j = sep
  ; sci/edit.e16.ts:177  while (j > 0) {
  j .L3
.L1:
  ; sci/edit.e16.ts:178  j--
  addi s1, s1, -1
  ; sci/edit.e16.ts:179  const t = peek(buf + j)
  add t0, s0, s1
  lbu s3, 0(t0)
  ; sci/edit.e16.ts:180  if (t === T_END) depth++
  li t0, 24
  bne s3, t0, .L5
  ; sci/edit.e16.ts:180  depth++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/edit.e16.ts:181  if (opensTemplate(t)) {
  mv a0, s3
  call opensTemplate
  beqz a0, .L7
  ; sci/edit.e16.ts:182  if (depth === 0) return j
  bne s2, zero, .L8
  ; sci/edit.e16.ts:182  return j
  mv a0, s1
  j .return
.L8:
  ; sci/edit.e16.ts:183  depth--
  addi s2, s2, -1
.L7:
.L6:
.L3:
  bltu zero, s1, .L1
  ; sci/edit.e16.ts:186  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/edit.e16.ts:190 sepAfter(buf, length, open/j) at -O1
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
  ; sci/edit.e16.ts:191  let depth: u16 = 0
  li s2, 0 ; depth
  ; sci/edit.e16.ts:192  for (let j = open; j < length; j++) {
  j .L3
.L1:
  ; sci/edit.e16.ts:193  const t = peek(buf + j)
  lw t0, 0(sp) ; buf
  add t0, t0, s1
  lbu s3, 0(t0)
  ; sci/edit.e16.ts:194  if (opensTemplate(t)) depth++
  mv a0, s3
  call opensTemplate
  beqz a0, .L5
  ; sci/edit.e16.ts:194  depth++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/edit.e16.ts:195  if (t === T_END) depth--
  li t0, 24
  bne s3, t0, .L7
  ; sci/edit.e16.ts:195  depth--
  addi s2, s2, -1
  j .L8
.L7:
  ; sci/edit.e16.ts:196  if (t === T_SEP && depth === 1) return j
  li t0, 23
  bne s3, t0, .L9
  li t0, 1
  bne s2, t0, .L9
  ; sci/edit.e16.ts:196  return j
  mv a0, s1
  j .return
.L9:
.L8:
.L6:
  addi s1, s1, 1
.L3:
  bltu s1, s0, .L1
  ; sci/edit.e16.ts:198  return length
  mv a0, s0
.return:
  lw ra, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  addi sp, sp, 12
  ret

; sci/edit.e16.ts:202 endAfter(buf, length, sep/j) at -O1
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
  ; sci/edit.e16.ts:203  let depth: u16 = 0
  li s2, 0 ; depth
  ; sci/edit.e16.ts:204  for (let j = sep + 1; j < length; j++) {
  addi s1, s1, 1
  j .L3
.L1:
  ; sci/edit.e16.ts:205  const t = peek(buf + j)
  lw t0, 0(sp) ; buf
  add t0, t0, s1
  lbu s0, 0(t0)
  ; sci/edit.e16.ts:206  if (opensTemplate(t)) depth++
  mv a0, s0
  call opensTemplate
  beqz a0, .L5
  ; sci/edit.e16.ts:206  depth++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/edit.e16.ts:207  if (t === T_END) {
  li t0, 24
  bne s0, t0, .L7
  ; sci/edit.e16.ts:208  if (depth === 0) return j
  bne s2, zero, .L8
  ; sci/edit.e16.ts:208  return j
  mv a0, s1
  j .return
.L8:
  ; sci/edit.e16.ts:209  depth--
  addi s2, s2, -1
.L7:
.L6:
  addi s1, s1, 1
.L3:
  bltu s1, s3, .L1
  ; sci/edit.e16.ts:212  return length
  mv a0, s3
.return:
  lw ra, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s0, 10(sp)
  addi sp, sp, 12
  ret

; sci/edit.e16.ts:220 vertical(buf, length, cur/j, up) at -O1
;   buf in s2
;   length in s3
;   cur/j in s1
;   up in 0(sp)
;   t in s0
vertical:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s0, 10(sp)
  mv s2, a0 ; buf
  mv s3, a1 ; length
  mv s1, a2 ; cur/j
  sw a3, 0(sp) ; up
  ; sci/edit.e16.ts:221  editLength = length
  sw s3, 0x066a(zero)
  ; sci/edit.e16.ts:222  editCursor = 0xffff
  li t0, 65535
  sw t0, 0x066c(zero)
  ; sci/edit.e16.ts:223  const j = partOf(buf, cur)
  mv a0, s2
  mv a1, s1
  call partOf
  mv s1, a0 ; cur/j
  ; sci/edit.e16.ts:224  if (j === 0xffff) return
  li t0, 65535
  bne s1, t0, .L1
  ; sci/edit.e16.ts:224  return
  j .return
.L1:
  ; sci/edit.e16.ts:227  const t = peek(buf + j)
  add t0, s2, s1
  lbu s0, 0(t0)
  ; sci/edit.e16.ts:228  if (t === T_FRAC) {
  li t0, 22
  bne s0, t0, .L2
  ; sci/edit.e16.ts:229  if (!up) editCursor = endAfter(buf, length, sepAfter(buf, length, j))
  lw t0, 0(sp) ; up
  bnez t0, .L4
  ; sci/edit.e16.ts:229  editCursor = endAfter(buf, length, sepAfter(buf, length, j))
  mv a0, s2
  mv a1, s3
  mv a2, s1
  call sepAfter
  mv a1, s3
  mv a2, a0
  mv a0, s2
  call endAfter
  sw a0, 0x066c(zero)
  j .L4
.L2:
  ; sci/edit.e16.ts:230  if (t === T_MSEP) {
  li t0, 29
  bne s0, t0, .L5
  ; sci/edit.e16.ts:231  if (!up) editCursor = endAfter(buf, length, j)
  lw t0, 0(sp) ; up
  bnez t0, .L7
  ; sci/edit.e16.ts:231  editCursor = endAfter(buf, length, j)
  mv a0, s2
  mv a1, s3
  mv a2, s1
  call endAfter
  sw a0, 0x066c(zero)
  j .L7
.L5:
  ; sci/edit.e16.ts:232  if (up && (t === T_SEP || t === T_MDIV)) editCursor = j
  lw t0, 0(sp) ; up
  beqz t0, .L8
  li t0, 23
  beq s0, t0, .L9
  li t0, 31
  bne s0, t0, .L8
.L9:
  ; sci/edit.e16.ts:232  editCursor = j
  sw s1, 0x066c(zero)
.L8:
.L7:
.L4:
.return:
  lw ra, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s0, 10(sp)
  addi sp, sp, 12
  ret

; sci/edit.e16.ts:236 partOf(buf, cur/j) at -O1
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
  ; sci/edit.e16.ts:237  let depth: u16 = 0
  li s2, 0 ; depth
  ; sci/edit.e16.ts:238  let j = cur
  ; sci/edit.e16.ts:239  while (j > 0) {
  j .L3
.L1:
  ; sci/edit.e16.ts:240  j--
  addi s1, s1, -1
  ; sci/edit.e16.ts:241  const t = peek(buf + j)
  add t0, s0, s1
  lbu s3, 0(t0)
  ; sci/edit.e16.ts:242  if (t === T_END) depth++
  li t0, 24
  bne s3, t0, .L5
  ; sci/edit.e16.ts:242  depth++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/edit.e16.ts:243  if (opensTemplate(t)) {
  mv a0, s3
  call opensTemplate
  beqz a0, .L7
  ; sci/edit.e16.ts:244  if (depth > 0) depth--
  bgeu zero, s2, .L8
  ; sci/edit.e16.ts:244  depth--
  addi s2, s2, -1
  j .L11
.L8:
  ; sci/edit.e16.ts:245  if (t === T_FRAC) return j
  li t0, 22
  bne s3, t0, .L11
  ; sci/edit.e16.ts:245  return j
  mv a0, s1
  j .return
.L7:
  ; sci/edit.e16.ts:246  if (isSeparator(t) && depth === 0) return j
  mv a0, s3
  call isSeparator
  beqz a0, .L12
  bne s2, zero, .L12
  ; sci/edit.e16.ts:246  return j
  mv a0, s1
  j .return
.L12:
.L11:
.L6:
.L3:
  bltu zero, s1, .L1
  ; sci/edit.e16.ts:248  return 0xffff
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

  .bank 5
  .org 0xc000
; sci/display.e16.ts:88 hasForm() at -O1
hasForm:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:89  if (!isExact(KEEP_ANS)) return false
  li a0, 3080
  call isExact
  bnez a0, .L1
  ; sci/display.e16.ts:89  return false
  li a0, 0
  j .return
.L1:
  ; sci/display.e16.ts:90  return !isZero(KEEP_ANS + V_R) || !isOne(KEEP_ANS + V_Q)
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

; sci/display.e16.ts:94 mixable() at -O1
mixable:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:95  if (!hasForm() || !isZero(KEEP_ANS + V_R)) return false
  call hasForm
  beqz a0, .L2
  li a0, 3100
  call isZero
  bnez a0, .L1
.L2:
  ; sci/display.e16.ts:95  return false
  li a0, 0
  j .return
.L1:
  ; sci/display.e16.ts:96  copy(KEEP_ANS + V_P, addr(scratch))
  li a0, 3092
  la a1, scratch
  call copy
  ; sci/display.e16.ts:97  math(M_ABS, addr(scratch), 0, 0)
  li a0, 17
  la a1, scratch
  li a2, 0
  li a3, 0
  call math
  ; sci/display.e16.ts:98  math(M_SUB, addr(scratch), KEEP_ANS + V_Q, 0)
  li a0, 2
  la a1, scratch
  li a2, 3108
  li a3, 0
  call math
  ; sci/display.e16.ts:99  return !isNegative(addr(scratch)) && !isZero(addr(scratch))
  la a0, scratch
  call isNegative
  seqz t0, a0
  mv t1, t0
  beqz t1, .L3
  la a0, scratch
  call isZero
  seqz t0, a0
.L3:
  mv a0, t0
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/display.e16.ts:103 firstShown(form) at -O1
;   form in s1
firstShown:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; form
  ; sci/display.e16.ts:104  if (!form || !hasForm()) return SHOW_DECIMAL
  beqz s1, .L2
  call hasForm
  bnez a0, .L1
.L2:
  ; sci/display.e16.ts:104  return SHOW_DECIMAL
  li a0, 0
  j .return
.L1:
  ; sci/display.e16.ts:105  if (peek(KEEP_MIXED) !== 0 && mixable()) return SHOW_MIXED
  lbu t0, 3079(zero)
  beq t0, zero, .L3
  call mixable
  beqz a0, .L3
  ; sci/display.e16.ts:105  return SHOW_MIXED
  li a0, 2
  j .return
.L3:
  ; sci/display.e16.ts:106  return SHOW_FORM
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:110 nextShown(shown) at -O1
;   shown in s1
nextShown:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; shown
  ; sci/display.e16.ts:111  if (shown === SHOW_FORM) return mixable() ? SHOW_MIXED : SHOW_DECIMAL
  li t0, 1
  bne s1, t0, .L1
  ; sci/display.e16.ts:111  return mixable() ? SHOW_MIXED : SHOW_DECIMAL
  call mixable
  beqz a0, .L2
  li t0, 2
  j .L3
.L2:
  li t0, 0
.L3:
  mv a0, t0
  j .return
.L1:
  ; sci/display.e16.ts:112  if (shown === SHOW_MIXED) return SHOW_DECIMAL
  li t0, 2
  bne s1, t0, .L4
  ; sci/display.e16.ts:112  return SHOW_DECIMAL
  li a0, 0
  j .return
.L4:
  ; sci/display.e16.ts:113  return SHOW_FORM
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:119 drawAnswerAs(shown) at -O1
;   shown in s1
drawAnswerAs:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; shown
  ; sci/display.e16.ts:120  if (shown === SHOW_FORM) drawForm()
  li t0, 1
  bne s1, t0, .L1
  ; sci/display.e16.ts:120  drawForm()
  call drawForm
  j .L2
.L1:
  ; sci/display.e16.ts:121  if (shown === SHOW_MIXED) showMixed()
  li t0, 2
  bne s1, t0, .L3
  ; sci/display.e16.ts:121  showMixed()
  call showMixed
  j .L4
.L3:
  ; sci/display.e16.ts:122  if (shown === SHOW_DMS) drawDms()
  li t0, 4
  bne s1, t0, .L5
  ; sci/display.e16.ts:122  drawDms()
  call drawDms
  j .L6
.L5:
  ; sci/display.e16.ts:123  if (shown === SHOW_PAIR) drawPair()
  li t0, 5
  bne s1, t0, .L7
  ; sci/display.e16.ts:123  drawPair()
  call drawPair
  j .L8
.L7:
  ; sci/display.e16.ts:125  if (shown === SHOW_ENG) engText(KEEP_ANS)
  li t0, 3
  bne s1, t0, .L9
  ; sci/display.e16.ts:125  engText(KEEP_ANS)
  li a0, 3080
  call engText
  j .L10
.L9:
  ; sci/display.e16.ts:126  decimalText(KEEP_ANS)
  li a0, 3080
  call decimalText
.L10:
  ; sci/display.e16.ts:127  drawDecimal()
  call drawDecimal
  ; sci/display.e16.ts:128  if (shown === SHOW_FOUND) drawFound()
  li t0, 6
  bne s1, t0, .L11
  ; sci/display.e16.ts:128  drawFound()
  call drawFound
.L11:
.L8:
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:133 drawDecimal() at -O1
;   mantissa in s2
;   i/right/exponent in s1
;   digits/x in s3
drawDecimal:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  ; sci/display.e16.ts:134  let mantissa = textLength
  lw s2, 0x068e(zero)
  ; sci/display.e16.ts:135  for (let i: u16 = 0; i < textLength; i++) {
  li s1, 0 ; i/right/exponent
  j .L3
.L1:
  ; sci/display.e16.ts:136  if (text[i] === 0x45) mantissa = i
  lbu t0, text(s1)
  li t1, 69
  bne t0, t1, .L5
  ; sci/display.e16.ts:136  mantissa = i
  mv s2, s1 ; mantissa
.L5:
  addi s1, s1, 1
.L3:
  lw t0, 0x068e(zero)
  bltu s1, t0, .L1
  ; sci/display.e16.ts:138  let right: u16 = 127
  li s1, 127 ; i/right/exponent
  ; sci/display.e16.ts:139  if (mantissa < textLength) {
  lw t0, 0x068e(zero)
  bgeu s2, t0, .L6
  ; sci/display.e16.ts:140  const exponent = addr(text) + mantissa + 1
  addi s1, s2, text+1
  ; sci/display.e16.ts:141  const digits = textLength - mantissa - 1
  lw t0, 0x068e(zero)
  sub t0, t0, s2
  addi s3, t0, -1
  ; sci/display.e16.ts:142  const x = 128 - digits * 6
  slli t1, s3, 2
  slli t0, s3, 1
  add t0, t0, t1
  li t1, 128
  sub s3, t1, t0
  ; sci/display.e16.ts:143  textAt(exponent, x, 48)
  mv a0, s1
  mv a1, s3
  li a2, 48
  call textAt
  ; sci/display.e16.ts:144  textAt(str('\x8110'), x - 18, 55)
  la a0, str_77
  addi a1, s3, -18
  li a2, 55
  call textAt
  ; sci/display.e16.ts:145  right = x - 19
  addi s1, s3, -19
.L6:
  ; sci/display.e16.ts:147  bigNumber(addr(text), mantissa, right)
  la a0, text
  mv a1, s2
  mv a2, s1
  call bigNumber
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/display.e16.ts:151 drawPair() at -O1
drawPair:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:152  textAt(str('X='), 1, 46)
  la a0, str_78
  li a1, 1
  li a2, 46
  call textAt
  ; sci/display.e16.ts:153  decimalText(varAt(0x58))
  li a0, 3336
  call decimalText
  ; sci/display.e16.ts:154  textRight(addr(text), 46)
  la a0, text
  li a1, 46
  call textRight
  ; sci/display.e16.ts:155  textAt(str('Y='), 1, 55)
  la a0, str_79
  li a1, 1
  li a2, 55
  call textAt
  ; sci/display.e16.ts:156  decimalText(varAt(0x59))
  li a0, 3372
  call decimalText
  ; sci/display.e16.ts:157  textRight(addr(text), 55)
  la a0, text
  li a1, 55
  call textRight
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/display.e16.ts:161 drawFound() at -O1
drawFound:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:162  textAt(str('X='), 1, 55)
  la a0, str_78
  li a1, 1
  li a2, 55
  call textAt
  ; sci/display.e16.ts:163  textAt(str('DIFF='), 1, 37)
  la a0, str_80
  li a1, 1
  li a2, 37
  call textAt
  ; sci/display.e16.ts:164  decimalText(addr(diffValue))
  la a0, diffValue
  call decimalText
  ; sci/display.e16.ts:165  textRight(addr(text), 37)
  la a0, text
  li a1, 37
  call textRight
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/display.e16.ts:169 drawDms() at -O1
drawDms:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:170  dmsText(KEEP_ANS)
  li a0, 3080
  call dmsText
  ; sci/display.e16.ts:171  textRight(addr(text), 55)
  la a0, text
  li a1, 55
  call textRight
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/display.e16.ts:177 drawForm() at -O1
;   fractionOf in s2
;   oneTerm/signOut in s1
drawForm:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; sci/display.e16.ts:178  answerLength = 0
  sw zero, 0x06e8(zero)
  ; sci/display.e16.ts:179  const p = KEEP_ANS + V_P
  ; sci/display.e16.ts:180  const r = KEEP_ANS + V_R
  ; sci/display.e16.ts:181  const q = KEEP_ANS + V_Q
  ; sci/display.e16.ts:182  const fractionOf = !isOne(q)
  li a0, 3108
  call isOne
  seqz s2, a0
  ; sci/display.e16.ts:183  const oneTerm = isZero(p) || isZero(r)
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
  ; sci/display.e16.ts:185  const signOut = oneTerm && fractionOf && (isZero(r) ? isNegative(p) : isNegative(r))
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
  ; sci/display.e16.ts:186  if (signOut) answerToken(T_MINUS)
  beqz s1, .L6
  ; sci/display.e16.ts:186  answerToken(T_MINUS)
  li a0, 45
  call answerToken
.L6:
  ; sci/display.e16.ts:187  if (fractionOf) answerToken(T_FRAC)
  beqz s2, .L7
  ; sci/display.e16.ts:187  answerToken(T_FRAC)
  li a0, 22
  call answerToken
.L7:
  ; sci/display.e16.ts:188  if (!isZero(p) || isZero(r)) answerNumber(p, signOut)
  li a0, 3092
  call isZero
  beqz a0, .L9
  li a0, 3100
  call isZero
  beqz a0, .L8
.L9:
  ; sci/display.e16.ts:188  answerNumber(p, signOut)
  li a0, 3092
  mv a1, s1
  call answerNumber
.L8:
  ; sci/display.e16.ts:189  if (!isZero(r)) answerRoot(p, r, signOut)
  li a0, 3100
  call isZero
  bnez a0, .L10
  ; sci/display.e16.ts:189  answerRoot(p, r, signOut)
  li a0, 3092
  li a1, 3100
  mv a2, s1
  call answerRoot
.L10:
  ; sci/display.e16.ts:190  if (fractionOf) {
  beqz s2, .L11
  ; sci/display.e16.ts:191  answerToken(T_SEP)
  li a0, 23
  call answerToken
  ; sci/display.e16.ts:192  answerNumber(q, false)
  li a0, 3108
  li a1, 0
  call answerNumber
  ; sci/display.e16.ts:193  answerToken(T_END)
  li a0, 24
  call answerToken
.L11:
  ; sci/display.e16.ts:195  setAnswer(addr(answerTokens), answerLength)
  lw a1, 0x06e8(zero)
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

; sci/display.e16.ts:199 showMixed() at -O1
showMixed:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:200  answerLength = 0
  sw zero, 0x06e8(zero)
  ; sci/display.e16.ts:201  const p = KEEP_ANS + V_P
  ; sci/display.e16.ts:202  const q = KEEP_ANS + V_Q
  ; sci/display.e16.ts:203  if (isNegative(p)) answerToken(T_MINUS)
  li a0, 3092
  call isNegative
  beqz a0, .L1
  ; sci/display.e16.ts:203  answerToken(T_MINUS)
  li a0, 45
  call answerToken
.L1:
  ; sci/display.e16.ts:204  copy(p, addr(scratch))
  li a0, 3092
  la a1, scratch
  call copy
  ; sci/display.e16.ts:205  math(M_ABS, addr(scratch), 0, 0)
  li a0, 17
  la a1, scratch
  li a2, 0
  li a3, 0
  call math
  ; sci/display.e16.ts:206  copy(addr(scratch), addr(spare))
  la a0, scratch
  la a1, spare
  call copy
  ; sci/display.e16.ts:207  math(M_IDIV, addr(scratch), q, 0)
  li a0, 8
  la a1, scratch
  li a2, 3108
  li a3, 0
  call math
  ; sci/display.e16.ts:208  math(M_MOD, addr(spare), q, 0)
  li a0, 9
  la a1, spare
  li a2, 3108
  li a3, 0
  call math
  ; sci/display.e16.ts:209  answerToken(T_MIXED)
  li a0, 28
  call answerToken
  ; sci/display.e16.ts:210  answerNumber(addr(scratch), true)
  la a0, scratch
  li a1, 1
  call answerNumber
  ; sci/display.e16.ts:211  answerToken(T_MSEP)
  li a0, 29
  call answerToken
  ; sci/display.e16.ts:212  answerNumber(addr(spare), true)
  la a0, spare
  li a1, 1
  call answerNumber
  ; sci/display.e16.ts:213  answerToken(T_MDIV)
  li a0, 31
  call answerToken
  ; sci/display.e16.ts:214  answerNumber(q, true)
  li a0, 3108
  li a1, 1
  call answerNumber
  ; sci/display.e16.ts:215  answerToken(T_END)
  li a0, 24
  call answerToken
  ; sci/display.e16.ts:216  setAnswer(addr(answerTokens), answerLength)
  lw a1, 0x06e8(zero)
  la a0, answerTokens
  la t0, setAnswer
  li t1, 3
  call far_call
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/display.e16.ts:220 answerRoot(p/s, r, signOut) at -O1
;   p/s in s1
;   r in s2
;   signOut in s3
answerRoot:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; p/s
  mv s2, a1 ; r
  mv s3, a2 ; signOut
  ; sci/display.e16.ts:221  if (!isZero(p)) answerToken(isNegative(r) ? T_MINUS : T_PLUS)
  mv a0, s1
  call isZero
  bnez a0, .L1
  ; sci/display.e16.ts:221  answerToken(isNegative(r) ? T_MINUS : T_PLUS)
  mv a0, s2
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
  ; sci/display.e16.ts:222  if (isNegative(r) && !signOut) answerToken(T_MINUS)
  mv a0, s2
  call isNegative
  beqz a0, .L5
  bnez s3, .L5
  ; sci/display.e16.ts:222  answerToken(T_MINUS)
  li a0, 45
  call answerToken
.L5:
.L4:
  ; sci/display.e16.ts:223  if (!isOne(r) && !isMinusOne(r)) answerNumber(r, true)
  mv a0, s2
  call isOne
  bnez a0, .L6
  mv a0, s2
  call isMinusOne
  bnez a0, .L6
  ; sci/display.e16.ts:223  answerNumber(r, true)
  mv a0, s2
  li a1, 1
  call answerNumber
.L6:
  ; sci/display.e16.ts:224  answerToken(T_ROOT)
  li a0, 25
  call answerToken
  ; sci/display.e16.ts:225  const s = peek16(KEEP_ANS + V_S)
  lw s1, 3090(zero)
  ; sci/display.e16.ts:226  if (s >= 10) answerToken(0x30 + div(s, 10))
  li t0, 10
  bltu s1, t0, .L7
  ; sci/display.e16.ts:226  answerToken(0x30 + div(s, 10))
  li t1, 52429
  mulhu t0, s1, t1
  srli t0, t0, 3
  addi a0, t0, 48
  call answerToken
.L7:
  ; sci/display.e16.ts:227  answerToken(0x30 + (s % 10))
  li t1, 52429
  mulhu t0, s1, t1
  srli t0, t0, 3
  li t1, 10
  mul t0, t0, t1
  sub t0, s1, t0
  addi a0, t0, 48
  call answerToken
  ; sci/display.e16.ts:228  answerToken(T_END)
  li a0, 24
  call answerToken
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/display.e16.ts:231 answerToken(t) at -O1
;   t in a0
answerToken:
  ; sci/display.e16.ts:232  if (answerLength < 48) {
  lw t0, 0x06e8(zero)
  li t1, 48
  bgeu t0, t1, .L1
  ; sci/display.e16.ts:233  answerTokens[answerLength] = t
  lw t0, 0x06e8(zero)
  sb a0, answerTokens(t0)
  ; sci/display.e16.ts:234  answerLength++
  lw t0, 0x06e8(zero)
  addi t0, t0, 1
  sw t0, 0x06e8(zero)
.L1:
.return:
  ret

; sci/display.e16.ts:239 answerNumber(n/i, bare) at -O1
;   n/i in s1
;   bare in s3
;   c in s2
answerNumber:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; n/i
  mv s3, a1 ; bare
  ; sci/display.e16.ts:240  format(n, 12)
  mv a0, s1
  li a1, 12
  call format
  ; sci/display.e16.ts:241  for (let i: u16 = 0; i < textLength; i++) {
  li s1, 0 ; n/i
  j .L3
.L1:
  ; sci/display.e16.ts:242  const c = text[i]
  lbu s2, text(s1)
  ; sci/display.e16.ts:243  if (c === 0x2d) {
  li t0, 45
  bne s2, t0, .L5
  ; sci/display.e16.ts:244  if (!bare) answerToken(T_MINUS)
  bnez s3, .L7
  ; sci/display.e16.ts:244  answerToken(T_MINUS)
  li a0, 45
  call answerToken
  j .L7
.L5:
  ; sci/display.e16.ts:245  answerToken(c)
  mv a0, s2
  call answerToken
.L7:
  addi s1, s1, 1
.L3:
  lw t0, 0x068e(zero)
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/display.e16.ts:249 isOne(n) at -O1
;   n in s1
isOne:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; sci/display.e16.ts:250  return peek(n) === 0 && isUnit(n)
  lbu t0, 0(s1)
  sub t0, t0, zero
  seqz t0, t0
  mv t1, t0
  beqz t1, .L1
  mv a0, s1
  call isUnit
  mv t0, a0
.L1:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:253 isMinusOne(n) at -O1
;   n in s1
isMinusOne:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; sci/display.e16.ts:254  return peek(n) !== 0 && isUnit(n)
  lbu t0, 0(s1)
  sub t0, t0, zero
  snez t0, t0
  mv t1, t0
  beqz t1, .L1
  mv a0, s1
  call isUnit
  mv t0, a0
.L1:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:258 isUnit(n) at -O1
;   n in a0
isUnit:
  ; sci/display.e16.ts:259  return peek(n + 1) === 0 && peek(n + 2) === 0x10 && peek16(n + 4) === 0 && peek16(n + 6) === 0
  lbu t0, 1(a0)
  sub t0, t0, zero
  seqz t0, t0
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

; sci/display.e16.ts:265 format(v, digits) at -O1
;   v in s1
;   digits in s2
format:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; v
  mv s2, a1 ; digits
  ; sci/display.e16.ts:266  poke16(MATH_ARG, digits)
  li t0, 65366
  sw s2, 0(t0)
  ; sci/display.e16.ts:267  math(M_FORMAT, v, addr(text), 0)
  li a0, 57
  mv a1, s1
  la a2, text
  li a3, 0
  call math
  ; sci/display.e16.ts:268  textLength = peek16(MATH_ARG)
  li t0, 65366
  lw t0, 0(t0)
  sw t0, 0x068e(zero)
  ; sci/display.e16.ts:269  text[textLength] = 0
  lw t0, 0x068e(zero)
  sb zero, text(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/display.e16.ts:273 rounded(v, digits) at -O1
;   v in s1
;   digits in s2
rounded:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; v
  mv s2, a1 ; digits
  ; sci/display.e16.ts:274  copy(v, addr(scratch))
  mv a0, s1
  la a1, scratch
  call copy
  ; sci/display.e16.ts:275  poke16(MATH_ARG, digits)
  li t0, 65366
  sw s2, 0(t0)
  ; sci/display.e16.ts:276  math(M_RNDTO, addr(scratch), 0, 0)
  li a0, 40
  la a1, scratch
  li a2, 0
  li a3, 0
  call math
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/display.e16.ts:280 exponentOf(v/e) at -O1
;   v/e in a0
exponentOf:
  ; sci/display.e16.ts:281  const e = peek(v + 1)
  lbu a0, 1(a0)
  ; sci/display.e16.ts:282  return e >= 128 ? i16(e) - 256 : i16(e)
  li t0, 128
  bltu a0, t0, .L1
  addi t0, a0, -256
  j .L2
.L1:
  mv t0, a0
.L2:
  mv a0, t0
.return:
  ret

; sci/display.e16.ts:290 decimalText(v) at -O1
;   v in s1
;   shape in s3
;   n in s2
decimalText:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; v
  ; sci/display.e16.ts:291  const shape = peek(KEEP_FORMAT)
  lbu s3, 3077(zero)
  ; sci/display.e16.ts:292  const n = peek(KEEP_DIGITS)
  lbu s2, 3078(zero)
  ; sci/display.e16.ts:293  if (shape === FORMAT_FIX) fixText(v, n)
  li t0, 1
  bne s3, t0, .L1
  ; sci/display.e16.ts:293  fixText(v, n)
  mv a0, s1
  mv a1, s2
  call fixText
  j .L2
.L1:
  ; sci/display.e16.ts:294  if (shape === FORMAT_EXP) expText(v, n === 0 ? 10 : n, false)
  li t0, 2
  bne s3, t0, .L3
  ; sci/display.e16.ts:294  expText(v, n === 0 ? 10 : n, false)
  mv t0, s1
  mv t1, s2
  li t2, 0
  bne t1, t2, .L4
  li t1, 10
  j .L5
.L4:
  mv t1, s2
.L5:
  mv a0, t0
  mv a1, t1
  li a2, 0
  call expText
  j .L6
.L3:
  ; sci/display.e16.ts:295  autoText(v)
  mv a0, s1
  call autoText
.L6:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/display.e16.ts:298 autoText(v) at -O1
;   v in s2
;   e/places in s1
autoText:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; v
  ; sci/display.e16.ts:299  const e = exponentOf(v)
  mv a0, s2
  call exponentOf
  mv s1, a0 ; e/places
  ; sci/display.e16.ts:300  if (isZero(v) || e < -9 || e > 9) {
  mv a0, s2
  call isZero
  bnez a0, .L2
  li t0, 65527
  blt s1, t0, .L2
  li t0, 9
  bge t0, s1, .L1
.L2:
  ; sci/display.e16.ts:301  format(v, 10)
  mv a0, s2
  li a1, 10
  call format
  ; sci/display.e16.ts:302  return
  j .return
.L1:
  ; sci/display.e16.ts:304  const places: i16 = e >= 0 ? 9 - e : 9
  blt s1, zero, .L3
  li t0, 9
  sub t0, t0, s1
  j .L4
.L3:
  li t0, 9
.L4:
  mv s1, t0 ; e/places
  ; sci/display.e16.ts:305  rounded(v, u16(-places))
  neg a1, s1
  mv a0, s2
  call rounded
  ; sci/display.e16.ts:306  format(addr(scratch), 12)
  la a0, scratch
  li a1, 12
  call format
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/display.e16.ts:309 fixText(v/point, n) at -O1
;   v/point in s2
;   n in s3
;   i in s1
fixText:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; v/point
  mv s3, a1 ; n
  ; sci/display.e16.ts:310  rounded(v, u16(-i16(n)))
  neg a1, s3
  mv a0, s2
  call rounded
  ; sci/display.e16.ts:311  format(addr(scratch), 12)
  la a0, scratch
  li a1, 12
  call format
  ; sci/display.e16.ts:313  let point = textLength
  lw s2, 0x068e(zero)
  ; sci/display.e16.ts:314  for (let i: u16 = 0; i < textLength; i++) {
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/display.e16.ts:315  if (text[i] === 0x45) return
  lbu t0, text(s1)
  li t1, 69
  bne t0, t1, .L5
  ; sci/display.e16.ts:315  return
  j .return
.L5:
  ; sci/display.e16.ts:316  if (text[i] === 0x2e) point = i
  lbu t0, text(s1)
  li t1, 46
  bne t0, t1, .L6
  ; sci/display.e16.ts:316  point = i
  mv s2, s1 ; v/point
.L6:
  addi s1, s1, 1
.L3:
  lw t0, 0x068e(zero)
  bltu s1, t0, .L1
  ; sci/display.e16.ts:318  if (n === 0) return
  bne s3, zero, .L7
  ; sci/display.e16.ts:318  return
  j .return
.L7:
  ; sci/display.e16.ts:319  if (point === textLength) addChar(0x2e)
  lw t0, 0x068e(zero)
  bne s2, t0, .L11
  ; sci/display.e16.ts:319  addChar(0x2e)
  li a0, 46
  call addChar
  ; sci/display.e16.ts:320  while (textLength - point - 1 < n) addChar(0x30)
  j .L11
.L9:
  ; sci/display.e16.ts:320  addChar(0x30)
  li a0, 48
  call addChar
.L11:
  lw t0, 0x068e(zero)
  sub t0, t0, s2
  addi t0, t0, -1
  bltu t0, s3, .L9
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/display.e16.ts:327 expText(v/w, digits, eng) at -O1
;   v/w in s2
;   digits in s0
;   eng in 2(sp)
;   e in s3
;   shift in 0(sp)
;   k in s1
;   pair in 4(sp)
expText:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s0, 10(sp)
  sw s3, 12(sp)
  sw s1, 14(sp)
  mv s2, a0 ; v/w
  mv s0, a1 ; digits
  sw a2, 2(sp) ; eng
  ; sci/display.e16.ts:328  textLength = 0
  sw zero, 0x068e(zero)
  ; sci/display.e16.ts:329  rounded(v, digits)
  mv a0, s2
  mv a1, s0
  call rounded
  ; sci/display.e16.ts:330  const w = addr(scratch)
  la s2, scratch
  ; sci/display.e16.ts:331  if (isNegative(w)) addChar(0x2d)
  mv a0, s2
  call isNegative
  beqz a0, .L1
  ; sci/display.e16.ts:331  addChar(0x2d)
  li a0, 45
  call addChar
.L1:
  ; sci/display.e16.ts:332  const e = exponentOf(w)
  mv a0, s2
  call exponentOf
  mv s3, a0 ; e
  ; sci/display.e16.ts:333  let shift: i16 = 0
  sw zero, 0(sp) ; shift
  ; sci/display.e16.ts:334  if (eng) shift = e >= 0 ? e % 3 : (3 - (-e % 3)) % 3
  lw t0, 2(sp) ; eng
  beqz t0, .L2
  ; sci/display.e16.ts:334  shift = e >= 0 ? e % 3 : (3 - (-e % 3)) % 3
  blt s3, zero, .L3
  li t0, 3
  rem t0, s3, t0
  j .L4
.L3:
  neg t0, s3
  li t1, 3
  rem t0, t0, t1
  li t1, 3
  sub t1, t1, t0
  li t0, 3
  rem t0, t1, t0
.L4:
  sw t0, 0(sp) ; shift
.L2:
  ; sci/display.e16.ts:335  for (let k: u16 = 0; k < digits; k++) {
  li s1, 0 ; k
  j .L7
.L5:
  ; sci/display.e16.ts:336  const pair = peek(w + 2 + (k >> 1))
  srli t0, s1, 1
  addi t1, s2, 2
  add t1, t1, t0
  lbu t1, 0(t1)
  sw t1, 4(sp) ; pair
  ; sci/display.e16.ts:337  addChar(0x30 + ((k & 1) === 0 ? pair >> 4 : pair & 15))
  andi t1, s1, 1
  li t0, 48
  li t2, 0
  bne t1, t2, .L9
  lw t1, 4(sp) ; pair
  srli t1, t1, 4
  j .L10
.L9:
  lw t1, 4(sp) ; pair
  andi t1, t1, 15
.L10:
  add a0, t0, t1
  call addChar
  ; sci/display.e16.ts:338  if (i16(k) === shift && k + 1 < digits) addChar(0x2e)
  lw t0, 0(sp) ; shift
  bne s1, t0, .L11
  addi t0, s1, 1
  bgeu t0, s0, .L11
  ; sci/display.e16.ts:338  addChar(0x2e)
  li a0, 46
  call addChar
.L11:
  addi s1, s1, 1
.L7:
  bltu s1, s0, .L5
  ; sci/display.e16.ts:340  if (eng) trimZeros()
  lw t0, 2(sp) ; eng
  beqz t0, .L12
  ; sci/display.e16.ts:340  trimZeros()
  call trimZeros
.L12:
  ; sci/display.e16.ts:341  addChar(0x45)
  li a0, 69
  call addChar
  ; sci/display.e16.ts:342  numberChars(e - shift)
  lw t0, 0(sp) ; shift
  sub a0, s3, t0
  call numberChars
.return:
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s0, 10(sp)
  lw s3, 12(sp)
  lw s1, 14(sp)
  addi sp, sp, 16
  ret

; sci/display.e16.ts:346 engText(v) at -O1
;   v in s1
engText:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/display.e16.ts:347  if (isZero(v)) {
  mv a0, s1
  call isZero
  beqz a0, .L1
  ; sci/display.e16.ts:348  format(v, 10)
  mv a0, s1
  li a1, 10
  call format
  ; sci/display.e16.ts:349  return
  j .return
.L1:
  ; sci/display.e16.ts:351  expText(v, 10, true)
  mv a0, s1
  li a1, 10
  li a2, 1
  call expText
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:355 trimZeros() at -O1
;   point in a1
;   i in a0
trimZeros:
  ; sci/display.e16.ts:356  let point = textLength
  lw a1, 0x068e(zero)
  ; sci/display.e16.ts:357  for (let i: u16 = 0; i < textLength; i++) {
  li a0, 0 ; i
  j .L3
.L1:
  ; sci/display.e16.ts:358  if (text[i] === 0x2e) point = i
  lbu t0, text(a0)
  li t1, 46
  bne t0, t1, .L5
  ; sci/display.e16.ts:358  point = i
  mv a1, a0 ; point
.L5:
  addi a0, a0, 1
.L3:
  lw t0, 0x068e(zero)
  bltu a0, t0, .L1
  ; sci/display.e16.ts:360  if (point === textLength) return
  lw t0, 0x068e(zero)
  bne a1, t0, .L9
  ; sci/display.e16.ts:360  return
  ret
  ; sci/display.e16.ts:361  while (textLength > point + 1 && text[textLength - 1] === 0x30) textLength--
.L7:
  ; sci/display.e16.ts:361  textLength--
  lw t0, 0x068e(zero)
  addi t0, t0, -1
  sw t0, 0x068e(zero)
.L9:
  lw t0, 0x068e(zero)
  addi t1, a1, 1
  bgeu t1, t0, .L11
  lw t0, 0x068e(zero)
  lbu t0, text-1(t0)
  li t1, 48
  beq t0, t1, .L7
.L11:
  ; sci/display.e16.ts:362  if (textLength === point + 1) textLength--
  lw t0, 0x068e(zero)
  addi t1, a1, 1
  bne t0, t1, .L12
  ; sci/display.e16.ts:362  textLength--
  lw t0, 0x068e(zero)
  addi t0, t0, -1
  sw t0, 0x068e(zero)
.L12:
  ; sci/display.e16.ts:363  text[textLength] = 0
  lw t0, 0x068e(zero)
  sb zero, text(t0)
.return:
  ret

; sci/display.e16.ts:367 numberChars(n/k) at -O1
;   n/k in s1
numberChars:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n/k
  ; sci/display.e16.ts:368  let k = n
  ; sci/display.e16.ts:369  if (k < 0) {
  bge s1, zero, .L1
  ; sci/display.e16.ts:370  addChar(0x2d)
  li a0, 45
  call addChar
  ; sci/display.e16.ts:371  k = -k
  neg s1, s1
.L1:
  ; sci/display.e16.ts:373  if (k >= 10) addChar(0x30 + div(u16(k), 10))
  li t0, 10
  blt s1, t0, .L2
  ; sci/display.e16.ts:373  addChar(0x30 + div(u16(k), 10))
  li t1, 52429
  mulhu t0, s1, t1
  srli t0, t0, 3
  addi a0, t0, 48
  call addChar
.L2:
  ; sci/display.e16.ts:374  addChar(0x30 + (u16(k) % 10))
  li t1, 52429
  mulhu t0, s1, t1
  srli t0, t0, 3
  li t1, 10
  mul t0, t0, t1
  sub t0, s1, t0
  addi a0, t0, 48
  call addChar
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:377 addChar(c) at -O1
;   c in a0
addChar:
  ; sci/display.e16.ts:378  if (textLength < 31) {
  lw t0, 0x068e(zero)
  li t1, 31
  bgeu t0, t1, .L1
  ; sci/display.e16.ts:379  text[textLength] = c
  lw t0, 0x068e(zero)
  sb a0, text(t0)
  ; sci/display.e16.ts:380  textLength++
  lw t0, 0x068e(zero)
  addi t0, t0, 1
  sw t0, 0x068e(zero)
  ; sci/display.e16.ts:381  text[textLength] = 0
  lw t0, 0x068e(zero)
  sb zero, text(t0)
.L1:
.return:
  ret

; sci/display.e16.ts:388 dmsText(v) at -O1
;   v in s1
dmsText:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/display.e16.ts:389  if (exponentOf(v) > 9) {
  mv a0, s1
  call exponentOf
  li t0, 9
  bge t0, a0, .L1
  ; sci/display.e16.ts:390  decimalText(v)
  mv a0, s1
  call decimalText
  ; sci/display.e16.ts:391  return
  j .return
.L1:
  ; sci/display.e16.ts:393  setDigits(1)
  li a0, 1
  call setDigits
  ; sci/display.e16.ts:394  copy(v, addr(degreePart))
  mv a0, s1
  la a1, degreePart
  call copy
  ; sci/display.e16.ts:395  math(M_ABS, addr(degreePart), 0, 0)
  li a0, 17
  la a1, degreePart
  li a2, 0
  li a3, 0
  call math
  ; sci/display.e16.ts:397  copy(addr(degreePart), addr(minutePart))
  la a0, degreePart
  la a1, minutePart
  call copy
  ; sci/display.e16.ts:398  math(M_IDIV, addr(degreePart), addr(unit), 0)
  li a0, 8
  la a1, degreePart
  la a2, unit
  li a3, 0
  call math
  ; sci/display.e16.ts:399  math(M_SUB, addr(minutePart), addr(degreePart), 0)
  li a0, 2
  la a1, minutePart
  la a2, degreePart
  li a3, 0
  call math
  ; sci/display.e16.ts:400  sixty(addr(minutePart))
  la a0, minutePart
  call sixty
  ; sci/display.e16.ts:401  copy(addr(minutePart), addr(spare))
  la a0, minutePart
  la a1, spare
  call copy
  ; sci/display.e16.ts:402  math(M_IDIV, addr(minutePart), addr(unit), 0)
  li a0, 8
  la a1, minutePart
  la a2, unit
  li a3, 0
  call math
  ; sci/display.e16.ts:403  math(M_SUB, addr(spare), addr(minutePart), 0)
  li a0, 2
  la a1, spare
  la a2, minutePart
  li a3, 0
  call math
  ; sci/display.e16.ts:404  sixty(addr(spare))
  la a0, spare
  call sixty
  ; sci/display.e16.ts:405  poke16(MATH_ARG, u16(-2))
  li t0, 65534
  li t1, 65366
  sw t0, 0(t1)
  ; sci/display.e16.ts:406  math(M_RNDTO, addr(spare), 0, 0)
  li a0, 40
  la a1, spare
  li a2, 0
  li a3, 0
  call math
  ; sci/display.e16.ts:407  textLength = 0
  sw zero, 0x068e(zero)
  ; sci/display.e16.ts:408  if (isNegative(v)) addChar(0x2d)
  mv a0, s1
  call isNegative
  beqz a0, .L2
  ; sci/display.e16.ts:408  addChar(0x2d)
  li a0, 45
  call addChar
.L2:
  ; sci/display.e16.ts:409  part(addr(degreePart), T_DEG)
  la a0, degreePart
  li a1, 136
  call part
  ; sci/display.e16.ts:410  part(addr(minutePart), T_MIN)
  la a0, minutePart
  li a1, 137
  call part
  ; sci/display.e16.ts:411  part(addr(spare), T_SEC)
  la a0, spare
  li a1, 138
  call part
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:415 sixty(n) at -O1
;   n in s1
sixty:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; sci/display.e16.ts:416  setDigits(60)
  li a0, 60
  call setDigits
  ; sci/display.e16.ts:417  math(M_MUL, n, addr(unit), 0)
  li a0, 3
  mv a1, s1
  la a2, unit
  li a3, 0
  call math
  ; sci/display.e16.ts:418  setDigits(1)
  li a0, 1
  call setDigits
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:422 part(n, mark) at -O1
;   n in s2
;   mark in s3
;   at in s1
;   before in s0
part:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  sw s0, 8(sp)
  mv s2, a0 ; n
  mv s3, a1 ; mark
  ; sci/display.e16.ts:423  const at = textLength
  lw s1, 0x068e(zero)
  ; sci/display.e16.ts:424  const before = addr(text) + at
  addi s0, s1, text
  ; sci/display.e16.ts:425  poke16(MATH_ARG, 10)
  li t0, 10
  li t1, 65366
  sw t0, 0(t1)
  ; sci/display.e16.ts:426  math(M_FORMAT, n, before, 0)
  li a0, 57
  mv a1, s2
  mv a2, s0
  li a3, 0
  call math
  ; sci/display.e16.ts:427  textLength = at + peek16(MATH_ARG)
  li t0, 65366
  lw t0, 0(t0)
  add t0, s1, t0
  sw t0, 0x068e(zero)
  ; sci/display.e16.ts:428  addChar(mark)
  mv a0, s3
  call addChar
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/display.e16.ts:432 setDigits(n) at -O1
;   n in a0
;   k in a1
setDigits:
  ; sci/display.e16.ts:433  for (let k: u16 = 0; k < 8; k++) unit[k] = 0
  li a1, 0 ; k
  j .L3
.L1:
  ; sci/display.e16.ts:433  unit[k] = 0
  sb zero, unit(a1)
  addi a1, a1, 1
.L3:
  li t0, 8
  bltu a1, t0, .L1
  ; sci/display.e16.ts:434  if (n >= 10) {
  li t0, 10
  bltu a0, t0, .L5
  ; sci/display.e16.ts:435  unit[1] = 1
  li t0, 1
  sb t0, unit+1(zero)
  ; sci/display.e16.ts:436  unit[2] = (div(n, 10) << 4) | (n % 10)
  li t1, 52429
  mulhu t0, a0, t1
  srli t0, t0, 3
  slli t0, t0, 4
  li t2, 52429
  mulhu t1, a0, t2
  srli t1, t1, 3
  li t2, 10
  mul t1, t1, t2
  sub t1, a0, t1
  or t0, t0, t1
  sb t0, unit+2(zero)
  j .L6
.L5:
  ; sci/display.e16.ts:437  unit[2] = n << 4
  slli t0, a0, 4
  sb t0, unit+2(zero)
.L6:
.return:
  ret

; sci/display.e16.ts:440 copy(from, to) at -O1
;   from in a0
;   to in a1
;   k in a2
copy:
  ; sci/display.e16.ts:441  for (let k: u16 = 0; k < 8; k++) poke(to + k, peek(from + k))
  li a2, 0 ; k
  j .L3
.L1:
  ; sci/display.e16.ts:441  poke(to + k, peek(from + k))
  add t0, a1, a2
  add t1, a0, a2
  lbu t1, 0(t1)
  sb t1, 0(t0)
  addi a2, a2, 1
.L3:
  li t0, 8
  bltu a2, t0, .L1
.return:
  ret

str_77:
  .byte 129, 49, 48, 0
str_78:
  .byte 88, 61, 0
str_79:
  .byte 89, 61, 0
str_80:
  .byte 68, 73, 70, 70, 61, 0
  .align 2

  .bank 6
  .org 0xc000
; sci/solve.e16.ts:69 askStart(at, length, find) at -O1
;   at in s1
;   length in s2
;   find in s3
askStart:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; at
  mv s2, a1 ; length
  mv s3, a2 ; find
  ; sci/solve.e16.ts:70  askingAt = at
  sw s1, 0x06ea(zero)
  ; sci/solve.e16.ts:71  askingLength = length
  sw s2, 0x06ec(zero)
  ; sci/solve.e16.ts:72  finding = find
  sw s3, 0x06ee(zero)
  ; sci/solve.e16.ts:73  entryLength = 0
  sw zero, 0x0718(zero)
  ; sci/solve.e16.ts:74  drawAsk()
  call drawAsk
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/solve.e16.ts:78 askKey(isEquals, isDelete, isClear, t) at -O1
;   isEquals in s2
;   isDelete in s3
;   isClear in s0
;   t in s1
askKey:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; isEquals
  mv s3, a1 ; isDelete
  mv s0, a2 ; isClear
  mv s1, a3 ; t
  ; sci/solve.e16.ts:79  if (isClear) return ASK_BACK
  beqz s0, .L1
  ; sci/solve.e16.ts:79  return ASK_BACK
  li a0, 1
  j .return
.L1:
  ; sci/solve.e16.ts:80  if (isEquals) {
  beqz s2, .L2
  ; sci/solve.e16.ts:81  finish()
  call finish
  ; sci/solve.e16.ts:82  return ASK_DONE
  li a0, 2
  j .return
.L2:
  ; sci/solve.e16.ts:84  if (isDelete) {
  beqz s3, .L3
  ; sci/solve.e16.ts:85  if (entryLength > 0) entryLength--
  lw t0, 0x0718(zero)
  bgeu zero, t0, .L5
  ; sci/solve.e16.ts:85  entryLength--
  lw t0, 0x0718(zero)
  addi t0, t0, -1
  sw t0, 0x0718(zero)
  j .L5
.L3:
  ; sci/solve.e16.ts:86  if (t !== 0 && entryLength < 40) {
  beq s1, zero, .L6
  lw t0, 0x0718(zero)
  li t1, 40
  bgeu t0, t1, .L6
  ; sci/solve.e16.ts:87  entry[entryLength] = t
  lw t0, 0x0718(zero)
  sb s1, entry(t0)
  ; sci/solve.e16.ts:88  entryLength++
  lw t0, 0x0718(zero)
  addi t0, t0, 1
  sw t0, 0x0718(zero)
.L6:
.L5:
  ; sci/solve.e16.ts:90  drawAsk()
  call drawAsk
  ; sci/solve.e16.ts:91  return ASK_STAY
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/solve.e16.ts:95 drawAsk() at -O1
;   col in s1
;   i in s2
drawAsk:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/solve.e16.ts:96  cls()
  call cls
  ; sci/solve.e16.ts:97  band(finding ? str('FIND X') : str('f(X)'))
  lw t0, 0x06ee(zero)
  beqz t0, .L1
  la t0, str_81
  j .L2
.L1:
  la t0, str_82
.L2:
  mv a0, t0
  call band
  ; sci/solve.e16.ts:98  textAt(str('X?'), 1, lineY(0))
  la a0, str_83
  li a1, 1
  li a2, 11
  call textAt
  ; sci/solve.e16.ts:99  formatInto(varAt(X))
  li a0, 3336
  call formatInto
  ; sci/solve.e16.ts:100  textRight(addr(xText), lineY(1))
  la a0, xText
  li a1, 20
  call textRight
  ; sci/solve.e16.ts:101  let col: u16 = 0
  li s1, 0 ; col
  ; sci/solve.e16.ts:102  for (let i: u16 = 0; i < entryLength; i++) col = shownAt(entry[i], col)
  li s2, 0 ; i
  j .L5
.L3:
  ; sci/solve.e16.ts:102  col = shownAt(entry[i], col)
  lbu a0, entry(s2)
  mv a1, s1
  call shownAt
  mv s1, a0 ; col
  addi s2, s2, 1
.L5:
  lw t0, 0x0718(zero)
  bltu s2, t0, .L3
  ; sci/solve.e16.ts:103  textAt(str('=:GO   AC:BACK'), 1, lineY(5))
  la a0, str_84
  li a1, 1
  li a2, 56
  call textAt
  ; sci/solve.e16.ts:104  barAt(col < 21 ? col : 20, 4)
  li t0, 21
  bgeu s1, t0, .L7
  mv t0, s1
  j .L8
.L7:
  li t0, 20
.L8:
  mv a0, t0
  li a1, 4
  call barAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/solve.e16.ts:108 shownAt(t, col/c) at -O1
;   t in s3
;   col/c in s1
;   s/p in s2
shownAt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; t
  mv s1, a1 ; col/c
  ; sci/solve.e16.ts:109  const s = tokenText(t)
  mv a0, s3
  call tokenText
  mv s2, a0 ; s/p
  ; sci/solve.e16.ts:110  if (s === 0) {
  bne s2, zero, .L1
  ; sci/solve.e16.ts:111  if (col < 21) glyphAt(t, col * 6, 32)
  li t0, 21
  bgeu s1, t0, .L2
  ; sci/solve.e16.ts:111  glyphAt(t, col * 6, 32)
  slli t1, s1, 2
  slli t0, s1, 1
  add a1, t0, t1
  mv a0, s3
  li a2, 32
  call glyphAt
.L2:
  ; sci/solve.e16.ts:112  return col + 1
  addi a0, s1, 1
  j .return
.L1:
  ; sci/solve.e16.ts:114  let c = col
  ; sci/solve.e16.ts:115  let p = s
  ; sci/solve.e16.ts:116  while (peek(p) !== 0) {
  j .L5
.L3:
  ; sci/solve.e16.ts:117  if (c < 21) glyphAt(peek(p), c * 6, 32)
  li t0, 21
  bgeu s1, t0, .L7
  ; sci/solve.e16.ts:117  glyphAt(peek(p), c * 6, 32)
  lbu a0, 0(s2)
  slli t2, s1, 2
  slli t1, s1, 1
  add a1, t1, t2
  li a2, 32
  call glyphAt
.L7:
  ; sci/solve.e16.ts:118  c++
  addi s1, s1, 1
  ; sci/solve.e16.ts:119  p++
  addi s2, s2, 1
.L5:
  lbu t0, 0(s2)
  bne t0, zero, .L3
  ; sci/solve.e16.ts:121  return c
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/solve.e16.ts:126 formatInto(v) at -O1
;   v in s1
formatInto:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/solve.e16.ts:127  poke16(MATH_ARG, 10)
  li t0, 10
  li t1, 65366
  sw t0, 0(t1)
  ; sci/solve.e16.ts:128  math(M_FORMAT, v, addr(xText), 0)
  li a0, 57
  mv a1, s1
  la a2, xText
  li a3, 0
  call math
  ; sci/solve.e16.ts:129  xText[peek16(MATH_ARG)] = 0
  li t0, 65366
  lw t0, 0(t0)
  sb zero, xText(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/solve.e16.ts:133 finish() at -O1
finish:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:134  noCursor()
  call noCursor
  ; sci/solve.e16.ts:135  if (entryLength > 0) {
  lw t0, 0x0718(zero)
  bgeu zero, t0, .L1
  ; sci/solve.e16.ts:136  clearStack()
  call clearStack
  ; sci/solve.e16.ts:137  evaluate(addr(entry), entryLength)
  lw a1, 0x0718(zero)
  la a0, entry
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/solve.e16.ts:138  copyValue(top(), varAt(X))
  call top
  li a1, 3336
  call copyValue
.L1:
  ; sci/solve.e16.ts:140  if (finding) newton()
  lw t0, 0x06ee(zero)
  beqz t0, .L2
  ; sci/solve.e16.ts:140  newton()
  call newton
  j .L3
.L2:
  ; sci/solve.e16.ts:142  evalWith(varAt(X))
  li a0, 3336
  call evalWith
  ; sci/solve.e16.ts:143  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
.L3:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:148 evalWith(v) at -O1
;   v in s1
evalWith:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/solve.e16.ts:149  copyValue(v, varAt(X))
  mv a0, s1
  li a1, 3336
  call copyValue
  ; sci/solve.e16.ts:150  clearStack()
  call clearStack
  ; sci/solve.e16.ts:151  evaluate(askingAt, askingLength)
  lw a0, 0x06ea(zero)
  lw a1, 0x06ec(zero)
  la t0, evaluate
  li t1, 0
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/solve.e16.ts:159 newton() at -O1
;   settled in s1
;   k in s2
newton:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/solve.e16.ts:160  copyValue(varAt(X), addr(x))
  li a0, 3336
  la a1, x
  call copyValue
  ; sci/solve.e16.ts:161  inexact(addr(x))
  la a0, x
  call inexact
  ; sci/solve.e16.ts:162  let settled = false
  li s1, 0 ; settled
  ; sci/solve.e16.ts:163  for (let k: u16 = 0; k < STEPS && !settled; k++) settled = newtonStep()
  li s2, 0 ; k
  j .L3
.L1:
  ; sci/solve.e16.ts:163  settled = newtonStep()
  call newtonStep
  mv s1, a0 ; settled
  addi s2, s2, 1
.L3:
  li t0, 60
  bgeu s2, t0, .L5
  beqz s1, .L1
.L5:
  ; sci/solve.e16.ts:164  copyValue(addr(x), varAt(X))
  la a0, x
  li a1, 3336
  call copyValue
  ; sci/solve.e16.ts:165  if (!settled) fail(E_FIND, 0)
  bnez s1, .L6
  ; sci/solve.e16.ts:165  fail(E_FIND, 0)
  li a0, 4
  li a1, 0
  call fail
.L6:
  ; sci/solve.e16.ts:166  evalWith(addr(x))
  la a0, x
  call evalWith
  ; sci/solve.e16.ts:167  copyValue(top(), addr(diffValue))
  call top
  la a1, diffValue
  call copyValue
  ; sci/solve.e16.ts:168  copyValue(addr(x), varAt(X))
  la a0, x
  li a1, 3336
  call copyValue
  ; sci/solve.e16.ts:169  copyValue(addr(x), KEEP_ANS)
  la a0, x
  li a1, 3080
  call copyValue
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/solve.e16.ts:173 newtonStep() at -O1
newtonStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:174  evalWith(addr(x))
  la a0, x
  call evalWith
  ; sci/solve.e16.ts:175  copyValue(top(), addr(fx))
  call top
  la a1, fx
  call copyValue
  ; sci/solve.e16.ts:176  if (isZero(addr(fx))) return true
  la a0, fx
  call isZero
  beqz a0, .L1
  ; sci/solve.e16.ts:176  return true
  li a0, 1
  j .return
.L1:
  ; sci/solve.e16.ts:178  copyValue(addr(x), addr(step))
  la a0, x
  la a1, step
  call copyValue
  ; sci/solve.e16.ts:179  math(M_ABS, addr(step), 0, 0)
  li a0, 17
  la a1, step
  li a2, 0
  li a3, 0
  call math
  ; sci/solve.e16.ts:180  setConstant(0, 0x10)
  li a0, 0
  li a1, 16
  call setConstant
  ; sci/solve.e16.ts:181  math(M_CMP, addr(step), addr(small), 0)
  li a0, 6
  la a1, step
  la a2, small
  li a3, 0
  call math
  ; sci/solve.e16.ts:182  if (peek16(MATH_RESULT) === 0xffff) setOneInStep()
  li t0, 65370
  lw t0, 0(t0)
  li t1, 65535
  bne t0, t1, .L2
  ; sci/solve.e16.ts:182  setOneInStep()
  call setOneInStep
.L2:
  ; sci/solve.e16.ts:183  setMillionth()
  call setMillionth
  ; sci/solve.e16.ts:184  math(M_MUL, addr(step), addr(small), 0)
  li a0, 3
  la a1, step
  la a2, small
  li a3, 0
  call math
  ; sci/solve.e16.ts:185  slope()
  call slope
  ; sci/solve.e16.ts:186  if (isZero(addr(ahead))) fail(E_FIND, 0)
  la a0, ahead
  call isZero
  beqz a0, .L3
  ; sci/solve.e16.ts:186  fail(E_FIND, 0)
  li a0, 4
  li a1, 0
  call fail
.L3:
  ; sci/solve.e16.ts:188  math(M_DIV, addr(fx), addr(ahead), 0)
  li a0, 4
  la a1, fx
  la a2, ahead
  li a3, 0
  call math
  ; sci/solve.e16.ts:189  math(M_SUB, addr(x), addr(fx), 0)
  li a0, 2
  la a1, x
  la a2, fx
  li a3, 0
  call math
  ; sci/solve.e16.ts:190  return smallStep()
  call smallStep
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:194 slope() at -O1
slope:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:195  copyValue(addr(x), addr(ahead))
  la a0, x
  la a1, ahead
  call copyValue
  ; sci/solve.e16.ts:196  math(M_ADD, addr(ahead), addr(step), 0)
  li a0, 1
  la a1, ahead
  la a2, step
  li a3, 0
  call math
  ; sci/solve.e16.ts:197  evalWith(addr(ahead))
  la a0, ahead
  call evalWith
  ; sci/solve.e16.ts:198  copyValue(top(), addr(ahead))
  call top
  la a1, ahead
  call copyValue
  ; sci/solve.e16.ts:199  copyValue(addr(x), addr(small))
  la a0, x
  la a1, small
  call copyValue
  ; sci/solve.e16.ts:200  math(M_SUB, addr(small), addr(step), 0)
  li a0, 2
  la a1, small
  la a2, step
  li a3, 0
  call math
  ; sci/solve.e16.ts:201  evalWith(addr(small))
  la a0, small
  call evalWith
  ; sci/solve.e16.ts:202  math(M_SUB, addr(ahead), top(), 0)
  call top
  la a1, ahead
  mv a2, a0
  li a0, 2
  li a3, 0
  call math
  ; sci/solve.e16.ts:203  math(M_DIV, addr(ahead), addr(step), 0)
  li a0, 4
  la a1, ahead
  la a2, step
  li a3, 0
  call math
  ; sci/solve.e16.ts:204  setHalf()
  call setHalf
  ; sci/solve.e16.ts:205  math(M_MUL, addr(ahead), addr(small), 0)
  li a0, 3
  la a1, ahead
  la a2, small
  li a3, 0
  call math
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:209 smallStep() at -O1
smallStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:210  math(M_ABS, addr(fx), 0, 0)
  li a0, 17
  la a1, fx
  li a2, 0
  li a3, 0
  call math
  ; sci/solve.e16.ts:211  copyValue(addr(x), addr(step))
  la a0, x
  la a1, step
  call copyValue
  ; sci/solve.e16.ts:212  math(M_ABS, addr(step), 0, 0)
  li a0, 17
  la a1, step
  li a2, 0
  li a3, 0
  call math
  ; sci/solve.e16.ts:213  setTiny()
  call setTiny
  ; sci/solve.e16.ts:214  if (isNegative(addr(step)) || exponentBelowZero(addr(step))) {
  la a0, step
  call isNegative
  bnez a0, .L2
  ; sci/solve.e16.ts:224  return peek(v + 1) >= 128
  lbu t0, step+1(zero)
  li t1, 128
  bltu t0, t1, .L1
.L2:
  ; sci/solve.e16.ts:215  math(M_CMP, addr(fx), addr(small), 0)
  li a0, 6
  la a1, fx
  la a2, small
  li a3, 0
  call math
  j .L3
.L1:
  ; sci/solve.e16.ts:217  math(M_MUL, addr(step), addr(small), 0)
  li a0, 3
  la a1, step
  la a2, small
  li a3, 0
  call math
  ; sci/solve.e16.ts:218  math(M_CMP, addr(fx), addr(step), 0)
  li a0, 6
  la a1, fx
  la a2, step
  li a3, 0
  call math
.L3:
  ; sci/solve.e16.ts:220  return peek16(MATH_RESULT) !== 1
  li t0, 65370
  lw t0, 0(t0)
  li t1, 1
  sub t0, t0, t1
  snez a0, t0
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:229 setConstant(exponent, digits) at -O1
;   exponent in a0
;   digits in a1
;   k in a2
setConstant:
  ; sci/solve.e16.ts:230  for (let k: u16 = 0; k < VALUE_SIZE; k++) small[k] = 0
  li a2, 0 ; k
  j .L3
.L1:
  ; sci/solve.e16.ts:230  small[k] = 0
  sb zero, small(a2)
  addi a2, a2, 1
.L3:
  li t0, 36
  bltu a2, t0, .L1
  ; sci/solve.e16.ts:231  small[1] = exponent
  sb a0, small+1(zero)
  ; sci/solve.e16.ts:232  small[2] = digits
  sb a1, small+2(zero)
.return:
  ret

; sci/solve.e16.ts:236 setMillionth() at -O1
setMillionth:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:237  setConstant(0xfa, 0x10)
  li a0, 250
  li a1, 16
  call setConstant
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:241 setHalf() at -O1
setHalf:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:242  setConstant(0xff, 0x50)
  li a0, 255
  li a1, 80
  call setConstant
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:246 setTiny() at -O1
setTiny:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:247  setConstant(0xf5, 0x10)
  li a0, 245
  li a1, 16
  call setConstant
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:251 setOneInStep() at -O1
;   k in a0
setOneInStep:
  ; sci/solve.e16.ts:252  for (let k: u16 = 0; k < VALUE_SIZE; k++) step[k] = 0
  li a0, 0 ; k
  j .L3
.L1:
  ; sci/solve.e16.ts:252  step[k] = 0
  sb zero, step(a0)
  addi a0, a0, 1
.L3:
  li t0, 36
  bltu a0, t0, .L1
  ; sci/solve.e16.ts:253  step[2] = 0x10
  li t0, 16
  sb t0, step+2(zero)
.return:
  ret

str_81:
  .byte 70, 73, 78, 68, 32, 88, 0
str_82:
  .byte 102, 40, 88, 41, 0
str_83:
  .byte 88, 63, 0
str_84:
  .byte 61, 58, 71, 79, 32, 32, 32, 65, 67, 58, 66, 65, 67, 75, 0
  .align 2
