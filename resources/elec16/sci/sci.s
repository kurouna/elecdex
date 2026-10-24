; Made by e16c from sci/lcd.e16.ts, sci/tokens.e16.ts, sci/numbers.e16.ts, sci/calc.e16.ts, sci/eval.e16.ts, sci/screens.e16.ts, sci/exact.e16.ts, sci/layout.e16.ts, sci/edit.e16.ts, sci/display.e16.ts, sci/solve.e16.ts, sci/stats.e16.ts, sci/base.e16.ts, sci/grid.e16.ts, sci/table.e16.ts, sci/equation.e16.ts, sci/extras.e16.ts: do not edit.

; curX at 0x0100
; curY at 0x0102
; errCode at 0x0104
; errAt at 0x0106
; nsp at 0x0468
; screen at 0x048e
; mode at 0x0490
; length at 0x055a
; cursor at 0x055c
; answered at 0x055e
; shifted at 0x0560
; alphaOn at 0x0562
; storing at 0x0564
; recalling at 0x0566
; overwrite at 0x0568
; hyp at 0x056a
; found at 0x056c
; historyAt at 0x056e
; scrollFrom at 0x0570
; shown at 0x0572
; lineAt at 0x0574
; lineLength at 0x0576
; pos at 0x0578
; percentEnd at 0x057a
; page at 0x05c0
; asking at 0x05c2
; clearing at 0x05c6
; funcPage at 0x05c8
; smallAt at 0x0664
; buf at 0x0666
; bufLength at 0x0668
; slide at 0x066a
; ink at 0x066c
; cursorIndex at 0x066e
; cursorX at 0x0670
; cursorTop at 0x0672
; boxUp at 0x0674
; boxDown at 0x0676
; editLength at 0x0678
; editCursor at 0x067a
; textLength at 0x069c
; answerLength at 0x06f6
; trimmed at 0x06f8
; askingAt at 0x06fa
; askingLength at 0x06fc
; finding at 0x06fe
; askedFor at 0x0700
; target at 0x0702
; label at 0x0704
; entryLength at 0x072e
; phase at 0x07f4
; resultPage at 0x07f6
; high at 0x0810
; baseFuncPage at 0x0812
; lineFrom at 0x0814
; count at 0x0816
; basePos at 0x0818
; gridKind at 0x085e
; gridRows at 0x0860
; gridCols at 0x0862
; row at 0x0864
; col at 0x0866
; firstRow at 0x0868
; cellLength at 0x088a
; tableNow at 0x08aa
; rangeAsked at 0x08ac
; rows at 0x08ae
; chosen at 0x08b0
; first at 0x08b2
; eqPhase at 0x08f0
; vertex at 0x08f2
; answers at 0x08f4
; unique at 0x08f6
; constOp at 0x08f8
nums = 0x0108 ; 864 bytes
diffValue = 0x046a ; 36 bytes
line = 0x0492 ; 200 bytes
numberText = 0x057c ; 32 bytes
argument = 0x059c ; 36 bytes
digitText = 0x05c4 ; 2 bytes
funcPageText = 0x05ca ; 4 bytes
hexText = 0x05ce ; 6 bytes
work = 0x05d4 ; 64 bytes
tmpA = 0x0614 ; 36 bytes
tmpB = 0x0638 ; 36 bytes
one = 0x065c ; 8 bytes
text = 0x067c ; 32 bytes
scratch = 0x069e ; 8 bytes
spare = 0x06a6 ; 8 bytes
unit = 0x06ae ; 8 bytes
degreePart = 0x06b6 ; 8 bytes
minutePart = 0x06be ; 8 bytes
answerTokens = 0x06c6 ; 48 bytes
entry = 0x0706 ; 40 bytes
x = 0x0730 ; 36 bytes
fx = 0x0754 ; 36 bytes
step = 0x0778 ; 36 bytes
ahead = 0x079c ; 36 bytes
small = 0x07c0 ; 36 bytes
xText = 0x07e4 ; 16 bytes
titleText = 0x07f8 ; 16 bytes
countChars = 0x0808 ; 8 bytes
TWO32 = 0x081a ; 8 bytes
TWO31 = 0x0822 ; 8 bytes
left = 0x082a ; 4 bytes
right = 0x082e ; 4 bytes
bits = 0x0832 ; 4 bytes
baseText = 0x0836 ; 40 bytes
cellEntry = 0x086a ; 32 bytes
cellText = 0x088c ; 24 bytes
freqText = 0x08a4 ; 5 bytes
savedX = 0x08b4 ; 36 bytes
tableCell = 0x08d8 ; 24 bytes

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
  ; mode = 0
  sw zero, 0x0490(zero)
  ; length = 0
  sw zero, 0x055a(zero)
  ; cursor = 0
  sw zero, 0x055c(zero)
  ; answered = 0
  sw zero, 0x055e(zero)
  ; shifted = 0
  sw zero, 0x0560(zero)
  ; alphaOn = 0
  sw zero, 0x0562(zero)
  ; storing = 0
  sw zero, 0x0564(zero)
  ; recalling = 0
  sw zero, 0x0566(zero)
  ; overwrite = 0
  sw zero, 0x0568(zero)
  ; hyp = 0
  sw zero, 0x056a(zero)
  ; found = 0
  sw zero, 0x056c(zero)
  ; historyAt = 65535
  li t0, 65535
  sw t0, 0x056e(zero)
  ; scrollFrom = 0
  sw zero, 0x0570(zero)
  ; shown = 0
  sw zero, 0x0572(zero)
  ; lineAt = 0
  sw zero, 0x0574(zero)
  ; lineLength = 0
  sw zero, 0x0576(zero)
  ; pos = 0
  sw zero, 0x0578(zero)
  ; percentEnd = 65535
  li t0, 65535
  sw t0, 0x057a(zero)
  ; page = 0
  sw zero, 0x05c0(zero)
  ; asking = 0
  sw zero, 0x05c2(zero)
  ; clearing = 0
  sw zero, 0x05c6(zero)
  ; funcPage = 0
  sw zero, 0x05c8(zero)
  ; smallAt = 0
  sw zero, 0x0664(zero)
  ; buf = 0
  sw zero, 0x0666(zero)
  ; bufLength = 0
  sw zero, 0x0668(zero)
  ; slide = 0
  sw zero, 0x066a(zero)
  ; ink = 0
  sw zero, 0x066c(zero)
  ; cursorIndex = 65535
  li t0, 65535
  sw t0, 0x066e(zero)
  ; cursorX = 0
  sw zero, 0x0670(zero)
  ; cursorTop = 0
  sw zero, 0x0672(zero)
  ; boxUp = 0
  sw zero, 0x0674(zero)
  ; boxDown = 0
  sw zero, 0x0676(zero)
  ; editLength = 0
  sw zero, 0x0678(zero)
  ; editCursor = 0
  sw zero, 0x067a(zero)
  ; textLength = 0
  sw zero, 0x069c(zero)
  ; answerLength = 0
  sw zero, 0x06f6(zero)
  ; trimmed = 0
  sw zero, 0x06f8(zero)
  ; askingAt = 0
  sw zero, 0x06fa(zero)
  ; askingLength = 0
  sw zero, 0x06fc(zero)
  ; finding = 0
  sw zero, 0x06fe(zero)
  ; askedFor = 0
  sw zero, 0x0700(zero)
  ; target = 0
  sw zero, 0x0702(zero)
  ; label = 0
  sw zero, 0x0704(zero)
  ; entryLength = 0
  sw zero, 0x072e(zero)
  ; phase = 0
  sw zero, 0x07f4(zero)
  ; resultPage = 0
  sw zero, 0x07f6(zero)
  ; high = 0
  sw zero, 0x0810(zero)
  ; baseFuncPage = 0
  sw zero, 0x0812(zero)
  ; lineFrom = 0
  sw zero, 0x0814(zero)
  ; count = 0
  sw zero, 0x0816(zero)
  ; basePos = 0
  sw zero, 0x0818(zero)
  ; gridKind = 0
  sw zero, 0x085e(zero)
  ; gridRows = 0
  sw zero, 0x0860(zero)
  ; gridCols = 0
  sw zero, 0x0862(zero)
  ; row = 0
  sw zero, 0x0864(zero)
  ; col = 0
  sw zero, 0x0866(zero)
  ; firstRow = 0
  sw zero, 0x0868(zero)
  ; cellLength = 0
  sw zero, 0x088a(zero)
  ; tableNow = 0
  sw zero, 0x08aa(zero)
  ; rangeAsked = 0
  sw zero, 0x08ac(zero)
  ; rows = 0
  sw zero, 0x08ae(zero)
  ; chosen = 0
  sw zero, 0x08b0(zero)
  ; first = 0
  sw zero, 0x08b2(zero)
  ; eqPhase = 0
  sw zero, 0x08f0(zero)
  ; vertex = 0
  sw zero, 0x08f2(zero)
  ; answers = 0
  sw zero, 0x08f4(zero)
  ; unique = 1
  li t0, 1
  sw t0, 0x08f6(zero)
  ; constOp = 0
  sw zero, 0x08f8(zero)
  ; nums: 864 bytes of 0
  li t0, 0x0108
  li t1, 864
  mset t0, zero, t1
  ; diffValue: 36 bytes of 0
  li t0, 0x046a
  li t1, 36
  mset t0, zero, t1
  ; line: 200 bytes of 0
  li t0, 0x0492
  li t1, 200
  mset t0, zero, t1
  ; numberText, argument: 68 bytes of 0
  li t0, 0x057c
  li t1, 68
  mset t0, zero, t1
  ; digitText: 2 bytes of 0
  li t0, 0x05c4
  li t1, 2
  mset t0, zero, t1
  ; funcPageText, hexText, work, tmpA, tmpB, one: 154 bytes of 0
  li t0, 0x05ca
  li t1, 154
  mset t0, zero, t1
  ; text: 32 bytes of 0
  li t0, 0x067c
  li t1, 32
  mset t0, zero, t1
  ; scratch, spare, unit, degreePart, minutePart, answerTokens: 88 bytes of 0
  li t0, 0x069e
  li t1, 88
  mset t0, zero, t1
  ; entry: 40 bytes of 0
  li t0, 0x0706
  li t1, 40
  mset t0, zero, t1
  ; x, fx, step, ahead, small, xText: 196 bytes of 0
  li t0, 0x0730
  li t1, 196
  mset t0, zero, t1
  ; titleText, countChars: 24 bytes of 0
  li t0, 0x07f8
  li t1, 24
  mset t0, zero, t1
  ; TWO32, TWO31, left, right, bits, baseText: 68 bytes of 0
  li t0, 0x081a
  li t1, 68
  mset t0, zero, t1
  ; cellEntry: 32 bytes of 0
  li t0, 0x086a
  li t1, 32
  mset t0, zero, t1
  ; cellText, freqText: 30 bytes of 0
  li t0, 0x088c
  li t1, 30
  mset t0, zero, t1
  ; savedX, tableCell: 60 bytes of 0
  li t0, 0x08b4
  li t1, 60
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
  ; sci/lcd.e16.ts:277  bandWith(at, 0)
  mv a0, s1
  li a1, 0
  call bandWith
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/lcd.e16.ts:284 bandWith(at, right) at -O1
;   at in s2
;   right in s1
bandWith:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; at
  mv s1, a1 ; right
  ; sci/lcd.e16.ts:285  cls()
  call cls
  ; sci/lcd.e16.ts:286  textAt(at, 1, 1)
  mv a0, s2
  li a1, 1
  li a2, 1
  call textAt
  ; sci/lcd.e16.ts:287  if (right !== 0) textRight(right, 1)
  beq s1, zero, .L1
  ; sci/lcd.e16.ts:287  textRight(right, 1)
  mv a0, s1
  li a1, 1
  call textRight
.L1:
  ; sci/lcd.e16.ts:288  invertBox(0, 0, WIDTH - 1, 8)
  li a0, 0
  li a1, 0
  li a2, 127
  li a3, 8
  call invertBox
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/lcd.e16.ts:292 lineY(n) at -O1
;   n in a0
lineY:
  ; sci/lcd.e16.ts:293  return 11 + n * 9
  slli t1, a0, 3
  add t0, t1, a0
  addi a0, t0, 11
.return:
  ret

; sci/lcd.e16.ts:297 mark(col, length, n/y) at -O1
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
  ; sci/lcd.e16.ts:298  const y = lineY(n)
  mv a0, s1
  call lineY
  mv s1, a0 ; n/y
  ; sci/lcd.e16.ts:299  invertBox(col * 6, y - 1, col * 6 + length * 6, y + 7)
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

; sci/tokens.e16.ts:124 isStatValue(t) at -O1
;   t in a0
isStatValue:
  ; sci/tokens.e16.ts:125  return (t >= T_STAT_N && t <= 0x9f) || (t >= 0xf4 && t <= T_STAT_LAST) || t === T_STAT_C
  li t0, 151
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L3
  li t0, 159
  sltu t0, t0, a0
  xori t0, t0, 1
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 244
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L4
  li t0, 249
  sltu t0, t0, a0
  xori t0, t0, 1
.L4:
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 252
  sub t0, a0, t0
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; sci/tokens.e16.ts:129 statIndex(t) at -O1
;   t in a0
statIndex:
  ; sci/tokens.e16.ts:130  if (t === T_STAT_C) return 15
  li t0, 252
  bne a0, t0, .L1
  ; sci/tokens.e16.ts:130  return 15
  li a0, 15
  ret
.L1:
  ; sci/tokens.e16.ts:131  return t <= 0x9f ? t - T_STAT_N : t - 0xf4 + 9
  li t0, 159
  bltu t0, a0, .L2
  addi t0, a0, -151
  j .L3
.L2:
  addi t0, a0, -235
.L3:
  mv a0, t0
.return:
  ret

; sci/tokens.e16.ts:135 opensTemplate(t) at -O1
;   t in a0
opensTemplate:
  ; sci/tokens.e16.ts:136  return t === T_FRAC || t === T_ROOT || t === T_POWT || t === T_MIXED || t === T_XROOT
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

; sci/tokens.e16.ts:140 isSeparator(t) at -O1
;   t in a0
isSeparator:
  ; sci/tokens.e16.ts:141  return t === T_SEP || t === T_MSEP || t === T_MDIV || t === T_XSEP
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

; sci/tokens.e16.ts:145 isFunction(t) at -O1
;   t in a0
isFunction:
  ; sci/tokens.e16.ts:146  return (
  li t0, 1
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L5
  li t0, 10
  sltu t0, t0, a0
  xori t0, t0, 1
.L5:
  mv t1, t0
  bnez t1, .L4
  li t0, 224
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L6
  li t0, 236
  sltu t0, t0, a0
  xori t0, t0, 1
.L6:
.L4:
  mv t1, t0
  bnez t1, .L3
  li t0, 250
  sub t0, a0, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 251
  sub t0, a0, t0
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 253
  sub t0, a0, t0
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; sci/tokens.e16.ts:156 takesTwo(t) at -O1
;   t in a0
takesTwo:
  ; sci/tokens.e16.ts:157  return t === T_GCD || t === T_LCM || t === T_POL || t === T_REC
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

; sci/tokens.e16.ts:161 isVariable(t) at -O1
;   t in a0
isVariable:
  ; sci/tokens.e16.ts:162  return (t >= 0x41 && t <= 0x46) || t === 0x58 || t === 0x59 || t === 0x4d
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

; sci/tokens.e16.ts:165 isDigit(t) at -O1
;   t in a0
isDigit:
  ; sci/tokens.e16.ts:166  return t >= 0x30 && t <= 0x39
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

; sci/tokens.e16.ts:170 tokenText(t) at -O1
;   t in s1
tokenText:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/tokens.e16.ts:171  if (t >= T_SINH) return namedText(t)
  li t0, 224
  bltu s1, t0, .L1
  ; sci/tokens.e16.ts:171  return namedText(t)
  mv a0, s1
  call namedText
  j .return
.L1:
  ; sci/tokens.e16.ts:172  if (isStatValue(t)) return statText(t)
  mv a0, s1
  call isStatValue
  beqz a0, .L2
  ; sci/tokens.e16.ts:172  return statText(t)
  mv a0, s1
  call statText
  j .return
.L2:
  ; sci/tokens.e16.ts:173  switch (t) {
  li t0, 1
  beq s1, t0, .L4
  li t0, 2
  beq s1, t0, .L5
  li t0, 3
  beq s1, t0, .L6
  li t0, 4
  beq s1, t0, .L7
  li t0, 5
  beq s1, t0, .L8
  li t0, 6
  beq s1, t0, .L9
  li t0, 7
  beq s1, t0, .L10
  li t0, 8
  beq s1, t0, .L11
  li t0, 9
  beq s1, t0, .L12
  li t0, 10
  beq s1, t0, .L13
  li t0, 16
  beq s1, t0, .L14
  li t0, 17
  beq s1, t0, .L15
  li t0, 18
  beq s1, t0, .L16
  li t0, 19
  beq s1, t0, .L17
  li t0, 20
  beq s1, t0, .L18
  li t0, 21
  beq s1, t0, .L19
  li t0, 22
  beq s1, t0, .L20
  li t0, 23
  beq s1, t0, .L21
  li t0, 24
  beq s1, t0, .L22
  li t0, 25
  beq s1, t0, .L23
  li t0, 26
  beq s1, t0, .L24
  li t0, 27
  beq s1, t0, .L25
  li t0, 12
  beq s1, t0, .L26
  li t0, 13
  beq s1, t0, .L27
  li t0, 14
  beq s1, t0, .L28
  li t0, 28
  beq s1, t0, .L29
  li t0, 29
  beq s1, t0, .L30
  li t0, 31
  beq s1, t0, .L31
  li t0, 30
  beq s1, t0, .L32
  li t0, 11
  beq s1, t0, .L33
  j .L3
.L4:
  ; sci/tokens.e16.ts:175  return str('sin(')
  la a0, str_0
  j .return
.L5:
  ; sci/tokens.e16.ts:177  return str('cos(')
  la a0, str_1
  j .return
.L6:
  ; sci/tokens.e16.ts:179  return str('tan(')
  la a0, str_2
  j .return
.L7:
  ; sci/tokens.e16.ts:181  return str('sin\x86(')
  la a0, str_3
  j .return
.L8:
  ; sci/tokens.e16.ts:183  return str('cos\x86(')
  la a0, str_4
  j .return
.L9:
  ; sci/tokens.e16.ts:185  return str('tan\x86(')
  la a0, str_5
  j .return
.L10:
  ; sci/tokens.e16.ts:187  return str('log(')
  la a0, str_6
  j .return
.L11:
  ; sci/tokens.e16.ts:189  return str('ln(')
  la a0, str_7
  j .return
.L12:
  ; sci/tokens.e16.ts:191  return str('\x83(')
  la a0, str_8
  j .return
.L13:
  ; sci/tokens.e16.ts:193  return str('\x85\x83(')
  la a0, str_9
  j .return
.L14:
  ; sci/tokens.e16.ts:195  return str('-')
  la a0, str_10
  j .return
.L15:
  ; sci/tokens.e16.ts:197  return str('^(')
  la a0, str_11
  j .return
.L16:
  ; sci/tokens.e16.ts:199  return str('C')
  la a0, str_12
  j .return
.L17:
  ; sci/tokens.e16.ts:201  return str('P')
  la a0, str_13
  j .return
.L18:
  ; sci/tokens.e16.ts:203  return str('Ans')
  la a0, str_14
  j .return
.L19:
  ; sci/tokens.e16.ts:205  return str('10')
  la a0, str_15
  j .return
.L20:
  ; sci/tokens.e16.ts:208  return str('(')
  la a0, str_16
  j .return
.L21:
  ; sci/tokens.e16.ts:210  return str(')/(')
  la a0, str_17
  j .return
.L22:
  ; sci/tokens.e16.ts:212  return str(')')
  la a0, str_18
  j .return
.L23:
  ; sci/tokens.e16.ts:214  return str('\x83(')
  la a0, str_8
  j .return
.L24:
  ; sci/tokens.e16.ts:216  return str('^(')
  la a0, str_11
  j .return
.L25:
  ; sci/tokens.e16.ts:218  return str('/')
  la a0, str_19
  j .return
.L26:
  ; sci/tokens.e16.ts:220  return str('dice')
  la a0, str_20
  j .return
.L27:
  ; sci/tokens.e16.ts:222  return str('coin')
  la a0, str_21
  j .return
.L28:
  ; sci/tokens.e16.ts:224  return str('rint')
  la a0, str_22
  j .return
.L29:
  ; sci/tokens.e16.ts:226  return str('(')
  la a0, str_16
  j .return
.L30:
  ; sci/tokens.e16.ts:228  return str(' ')
  la a0, str_23
  j .return
.L31:
  ; sci/tokens.e16.ts:230  return str('/')
  la a0, str_19
  j .return
.L32:
  ; sci/tokens.e16.ts:232  return str('(')
  la a0, str_16
  j .return
.L33:
  ; sci/tokens.e16.ts:234  return str(')\x83(')
  la a0, str_24
  j .return
.L3:
  ; sci/tokens.e16.ts:236  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/tokens.e16.ts:241 namedText(t) at -O1
;   t in s1
namedText:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/tokens.e16.ts:242  switch (t) {
  li t0, 224
  beq s1, t0, .L2
  li t0, 225
  beq s1, t0, .L3
  li t0, 226
  beq s1, t0, .L4
  li t0, 227
  beq s1, t0, .L5
  li t0, 228
  beq s1, t0, .L6
  li t0, 229
  beq s1, t0, .L7
  li t0, 230
  beq s1, t0, .L8
  li t0, 231
  beq s1, t0, .L9
  li t0, 232
  beq s1, t0, .L10
  li t0, 233
  beq s1, t0, .L11
  li t0, 234
  beq s1, t0, .L12
  li t0, 235
  beq s1, t0, .L13
  li t0, 236
  beq s1, t0, .L14
  li t0, 237
  beq s1, t0, .L15
  j .L1
.L2:
  ; sci/tokens.e16.ts:244  return str('sinh(')
  la a0, str_25
  j .return
.L3:
  ; sci/tokens.e16.ts:246  return str('cosh(')
  la a0, str_26
  j .return
.L4:
  ; sci/tokens.e16.ts:248  return str('tanh(')
  la a0, str_27
  j .return
.L5:
  ; sci/tokens.e16.ts:250  return str('sinh\x86(')
  la a0, str_28
  j .return
.L6:
  ; sci/tokens.e16.ts:252  return str('cosh\x86(')
  la a0, str_29
  j .return
.L7:
  ; sci/tokens.e16.ts:254  return str('tanh\x86(')
  la a0, str_30
  j .return
.L8:
  ; sci/tokens.e16.ts:256  return str('abs(')
  la a0, str_31
  j .return
.L9:
  ; sci/tokens.e16.ts:258  return str('gcd(')
  la a0, str_32
  j .return
.L10:
  ; sci/tokens.e16.ts:260  return str('lcm(')
  la a0, str_33
  j .return
.L11:
  ; sci/tokens.e16.ts:262  return str('int(')
  la a0, str_34
  j .return
.L12:
  ; sci/tokens.e16.ts:264  return str('round(')
  la a0, str_35
  j .return
.L13:
  ; sci/tokens.e16.ts:266  return str('pol(')
  la a0, str_36
  j .return
.L14:
  ; sci/tokens.e16.ts:268  return str('rec(')
  la a0, str_37
  j .return
.L15:
  ; sci/tokens.e16.ts:270  return str('rand')
  la a0, str_38
  j .return
.L1:
  ; sci/tokens.e16.ts:272  return logicText(t)
  mv a0, s1
  call logicText
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/tokens.e16.ts:276 logicText(t) at -O1
;   t in s1
logicText:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/tokens.e16.ts:277  switch (t) {
  li t0, 238
  beq s1, t0, .L2
  li t0, 239
  beq s1, t0, .L3
  li t0, 240
  beq s1, t0, .L4
  li t0, 241
  beq s1, t0, .L5
  li t0, 242
  beq s1, t0, .L6
  li t0, 243
  beq s1, t0, .L7
  li t0, 250
  beq s1, t0, .L8
  li t0, 251
  beq s1, t0, .L9
  li t0, 253
  beq s1, t0, .L10
  j .L1
.L2:
  ; sci/tokens.e16.ts:279  return str(' AND ')
  la a0, str_39
  j .return
.L3:
  ; sci/tokens.e16.ts:281  return str(' OR ')
  la a0, str_40
  j .return
.L4:
  ; sci/tokens.e16.ts:283  return str(' XOR ')
  la a0, str_41
  j .return
.L5:
  ; sci/tokens.e16.ts:285  return str(' XNOR ')
  la a0, str_42
  j .return
.L6:
  ; sci/tokens.e16.ts:287  return str('not(')
  la a0, str_43
  j .return
.L7:
  ; sci/tokens.e16.ts:289  return str('neg(')
  la a0, str_44
  j .return
.L8:
  ; sci/tokens.e16.ts:291  return str('x\x89(')
  la a0, str_45
  j .return
.L9:
  ; sci/tokens.e16.ts:293  return str('y\x89(')
  la a0, str_46
  j .return
.L10:
  ; sci/tokens.e16.ts:295  return str('x\x93\x89(')
  la a0, str_47
  j .return
.L1:
  ; sci/tokens.e16.ts:297  return isStatValue(t) ? statText(t) : 0
  mv a0, s1
  call isStatValue
  beqz a0, .L11
  mv a0, s1
  call statText
  mv t0, a0
  j .L12
.L11:
  li t0, 0
.L12:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/tokens.e16.ts:301 statText(t/switch1) at -O1
;   t/switch1 in s1
statText:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t/switch1
  ; sci/tokens.e16.ts:302  switch (statIndex(t)) {
  mv a0, s1
  call statIndex
  mv s1, a0 ; t/switch1
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
  li t0, 11
  beq s1, t0, .L13
  li t0, 12
  beq s1, t0, .L14
  li t0, 13
  beq s1, t0, .L15
  li t0, 15
  beq s1, t0, .L16
  j .L1
.L2:
  ; sci/tokens.e16.ts:304  return str('n')
  la a0, str_48
  j .return
.L3:
  ; sci/tokens.e16.ts:306  return str('\x95')
  la a0, str_49
  j .return
.L4:
  ; sci/tokens.e16.ts:308  return str('\x91x')
  la a0, str_50
  j .return
.L5:
  ; sci/tokens.e16.ts:310  return str('sx')
  la a0, str_51
  j .return
.L6:
  ; sci/tokens.e16.ts:312  return str('\x96')
  la a0, str_52
  j .return
.L7:
  ; sci/tokens.e16.ts:314  return str('\x91y')
  la a0, str_53
  j .return
.L8:
  ; sci/tokens.e16.ts:316  return str('sy')
  la a0, str_54
  j .return
.L9:
  ; sci/tokens.e16.ts:318  return str('\x90x')
  la a0, str_55
  j .return
.L10:
  ; sci/tokens.e16.ts:320  return str('\x90x\x84')
  la a0, str_56
  j .return
.L11:
  ; sci/tokens.e16.ts:322  return str('\x90y')
  la a0, str_57
  j .return
.L12:
  ; sci/tokens.e16.ts:324  return str('\x90y\x84')
  la a0, str_58
  j .return
.L13:
  ; sci/tokens.e16.ts:326  return str('\x90xy')
  la a0, str_59
  j .return
.L14:
  ; sci/tokens.e16.ts:328  return str('r')
  la a0, str_60
  j .return
.L15:
  ; sci/tokens.e16.ts:330  return str('a')
  la a0, str_61
  j .return
.L16:
  ; sci/tokens.e16.ts:332  return str('c')
  la a0, str_62
  j .return
.L1:
  ; sci/tokens.e16.ts:334  return str('b')
  la a0, str_63
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/tokens.e16.ts:338 tokenWidth(t/text) at -O1
;   t/text in s1
;   n in s2
tokenWidth:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t/text
  ; sci/tokens.e16.ts:339  const text = tokenText(t)
  mv a0, s1
  call tokenText
  mv s1, a0 ; t/text
  ; sci/tokens.e16.ts:340  if (text === 0) return 1
  bne s1, zero, .L1
  ; sci/tokens.e16.ts:340  return 1
  li a0, 1
  j .return
.L1:
  ; sci/tokens.e16.ts:341  let n: u16 = 0
  li s2, 0 ; n
  ; sci/tokens.e16.ts:342  while (peek(text + n) !== 0) n++
  j .L4
.L2:
  ; sci/tokens.e16.ts:342  n++
  addi s2, s2, 1
.L4:
  add t0, s1, s2
  lbu t0, 0(t0)
  bne t0, zero, .L2
  ; sci/tokens.e16.ts:343  return n
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/numbers.e16.ts:91 fail(code, at) at -O1
;   code in s1
;   at in s2
fail:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; code
  mv s2, a1 ; at
  ; sci/numbers.e16.ts:92  errCode = code
  sw s1, 0x0104(zero)
  ; sci/numbers.e16.ts:93  errAt = at
  sw s2, 0x0106(zero)
  ; sci/numbers.e16.ts:94  calc_abort()
  call calc_abort
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/numbers.e16.ts:107 copyValue(from, to) at -O1
;   from in s1
;   to in s2
copyValue:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; from
  mv s2, a1 ; to
  ; sci/numbers.e16.ts:108  memcpy(to, from, VALUE_SIZE)
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

; sci/numbers.e16.ts:112 copy8(from, to) at -O1
;   from in s1
;   to in s2
copy8:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; from
  mv s2, a1 ; to
  ; sci/numbers.e16.ts:113  memcpy(to, from, 8)
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

; sci/numbers.e16.ts:117 inexact(v) at -O1
;   v in a0
inexact:
  ; sci/numbers.e16.ts:118  poke16(v + V_EXACT, 0)
  sw zero, 8(a0)
.return:
  ret

; sci/numbers.e16.ts:121 isExact(v) at -O1
;   v in a0
isExact:
  ; sci/numbers.e16.ts:122  return peek16(v + V_EXACT) !== 0
  lw t0, 8(a0)
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; sci/numbers.e16.ts:155 contrastBack() at -O1
;   kept in a0
contrastBack:
  ; sci/numbers.e16.ts:156  const kept = peek(KEEP_CONTRAST)
  lbu a0, 3117(zero)
  ; sci/numbers.e16.ts:157  if (kept !== 0) poke16(IO_CONTRAST, kept - 1)
  beq a0, zero, .L1
  ; sci/numbers.e16.ts:157  poke16(IO_CONTRAST, kept - 1)
  addi t0, a0, -1
  li t1, 65320
  sw t0, 0(t1)
.L1:
.return:
  ret

; sci/numbers.e16.ts:203 modesReady() at -O1
;   i in a0
modesReady:
  ; sci/numbers.e16.ts:204  if (peek16(MODES) === MODES_MARK) return
  lw t0, 5632(zero)
  li t1, 23606
  bne t0, t1, .L1
  ; sci/numbers.e16.ts:204  return
  ret
.L1:
  ; sci/numbers.e16.ts:205  for (let i: u16 = 0; i < MODES_END - MODES; i += 2) poke16(MODES + i, 0)
  li a0, 0 ; i
  j .L4
.L2:
  ; sci/numbers.e16.ts:205  poke16(MODES + i, 0)
  sw zero, 5632(a0)
  addi a0, a0, 2
.L4:
  li t0, 2816
  bltu a0, t0, .L2
  ; sci/numbers.e16.ts:206  poke16(MODES, MODES_MARK)
  li t0, 23606
  sw t0, 5632(zero)
  ; sci/numbers.e16.ts:207  poke(BASE_RADIX, 1)
  li t0, 1
  sb t0, 5639(zero)
.return:
  ret

; sci/numbers.e16.ts:211 keepReady() at -O1
;   i in a0
keepReady:
  ; sci/numbers.e16.ts:212  if (peek16(KEEP) === KEEP_MARK) return
  lw t0, 3072(zero)
  li t1, 23588
  bne t0, t1, .L1
  ; sci/numbers.e16.ts:212  return
  ret
.L1:
  ; sci/numbers.e16.ts:213  for (let i: u16 = 0; i < 0x182; i += 2) poke16(KEEP + i, 0)
  li a0, 0 ; i
  j .L4
.L2:
  ; sci/numbers.e16.ts:213  poke16(KEEP + i, 0)
  sw zero, 3072(a0)
  addi a0, a0, 2
.L4:
  li t0, 386
  bltu a0, t0, .L2
  ; sci/numbers.e16.ts:214  poke16(KEEP, KEEP_MARK)
  li t0, 23588
  sw t0, 3072(zero)
.return:
  ret

; sci/numbers.e16.ts:218 varAt(letter) at -O1
;   letter in a0
;   k in a1
varAt:
  ; sci/numbers.e16.ts:219  let k: u16 = 0
  li a1, 0 ; k
  ; sci/numbers.e16.ts:220  if (letter >= 0x41 && letter <= 0x46) k = letter - 0x41
  li t0, 65
  bltu a0, t0, .L1
  li t0, 70
  bltu t0, a0, .L1
  ; sci/numbers.e16.ts:220  k = letter - 0x41
  addi a1, a0, -65
  j .L2
.L1:
  ; sci/numbers.e16.ts:221  if (letter === 0x58) k = 6
  li t0, 88
  bne a0, t0, .L3
  ; sci/numbers.e16.ts:221  k = 6
  li a1, 6 ; k
  j .L4
.L3:
  ; sci/numbers.e16.ts:222  if (letter === 0x59) k = 7
  li t0, 89
  bne a0, t0, .L5
  ; sci/numbers.e16.ts:222  k = 7
  li a1, 7 ; k
  j .L6
.L5:
  ; sci/numbers.e16.ts:223  k = 8
  li a1, 8 ; k
.L6:
.L4:
.L2:
  ; sci/numbers.e16.ts:224  return KEEP_VARS + k * VALUE_SIZE
  slli t1, a1, 5
  slli t0, a1, 2
  add t0, t0, t1
  addi a0, t0, 3120
.return:
  ret

; sci/numbers.e16.ts:233 clearStack() at -O1
clearStack:
  ; sci/numbers.e16.ts:234  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0468(zero)
.return:
  ret

; sci/numbers.e16.ts:238 push(at/n) at -O1
;   at/n in s1
push:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at/n
  ; sci/numbers.e16.ts:239  if (nsp >= addr(nums) + 864) fail(E_STACK, at)
  lw t0, 0x0468(zero)
  li t1, nums+864
  bltu t0, t1, .L1
  ; sci/numbers.e16.ts:239  fail(E_STACK, at)
  li a0, 3
  mv a1, s1
  call fail
.L1:
  ; sci/numbers.e16.ts:240  const n = nsp
  lw s1, 0x0468(zero)
  ; sci/numbers.e16.ts:241  nsp += VALUE_SIZE
  lw t0, 0x0468(zero)
  addi t0, t0, 36
  sw t0, 0x0468(zero)
  ; sci/numbers.e16.ts:242  inexact(n)
  mv a0, s1
  call inexact
  ; sci/numbers.e16.ts:243  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/numbers.e16.ts:246 top() at -O1
top:
  ; sci/numbers.e16.ts:247  return nsp - VALUE_SIZE
  lw t0, 0x0468(zero)
  addi a0, t0, -36
.return:
  ret

; sci/numbers.e16.ts:250 pop() at -O1
pop:
  ; sci/numbers.e16.ts:251  nsp -= VALUE_SIZE
  lw t0, 0x0468(zero)
  addi t0, t0, -36
  sw t0, 0x0468(zero)
.return:
  ret

; sci/numbers.e16.ts:254 isZero(n) at -O1
;   n in a0
isZero:
  ; sci/numbers.e16.ts:255  return peek(n + 2) === 0
  lbu t0, 2(a0)
  sub t0, t0, zero
  seqz a0, t0
.return:
  ret

; sci/numbers.e16.ts:258 isNegative(n) at -O1
;   n in a0
isNegative:
  ; sci/numbers.e16.ts:259  return peek(n) !== 0
  lbu t0, 0(a0)
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; sci/numbers.e16.ts:263 math(op, a, b, at) at -O1
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
  ; sci/numbers.e16.ts:264  poke16(MATH_A, a)
  li t0, 65362
  sw s2, 0(t0)
  ; sci/numbers.e16.ts:265  poke16(MATH_B, b)
  li t0, 65364
  sw s3, 0(t0)
  ; sci/numbers.e16.ts:266  poke16(MATH_OP, op)
  li t0, 65360
  sw s1, 0(t0)
  ; sci/numbers.e16.ts:267  if (peek16(MATH_STATUS) !== 0) fail(E_MATH, at)
  li t0, 65368
  lw t0, 0(t0)
  beq t0, zero, .L1
  ; sci/numbers.e16.ts:267  fail(E_MATH, at)
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

; sci/numbers.e16.ts:274 shownDigits() at -O1
;   n in a0
;   format in a1
shownDigits:
  ; sci/numbers.e16.ts:275  const n = peek(KEEP_DIGITS)
  lbu a0, 3078(zero)
  ; sci/numbers.e16.ts:276  const format = peek(KEEP_FORMAT)
  lbu a1, 3077(zero)
  ; sci/numbers.e16.ts:277  if (format === FORMAT_FIX) return u16(-i16(n))
  li t0, 1
  bne a1, t0, .L1
  ; sci/numbers.e16.ts:277  return u16(-i16(n))
  neg a0, a0
  ret
.L1:
  ; sci/numbers.e16.ts:278  if (format === FORMAT_EXP && n > 0) return n
  li t0, 2
  bne a1, t0, .L2
  bgeu zero, a0, .L2
  ; sci/numbers.e16.ts:278  return n
  ret
.L2:
  ; sci/numbers.e16.ts:279  return 10
  li a0, 10
.return:
  ret

; sci/numbers.e16.ts:286 pushInt(v, at) at -O1
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
  ; sci/numbers.e16.ts:287  const n = push(at)
  mv a0, s2
  call push
  mv s1, a0 ; n
  ; sci/numbers.e16.ts:288  poke16(MATH_ARG, v)
  li t0, 65366
  sw s3, 0(t0)
  ; sci/numbers.e16.ts:289  math(M_FROMINT, n, 0, at)
  li a0, 48
  mv a1, s1
  li a2, 0
  mv a3, s2
  call math
  ; sci/numbers.e16.ts:290  exactWhole(n)
  mv a0, s1
  la t0, exactWhole
  li t1, 2
  call far_call
  ; sci/numbers.e16.ts:291  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/numbers.e16.ts:295 binary(op, at) at -O1
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
  ; sci/numbers.e16.ts:296  const b = top()
  call top
  mv s2, a0 ; b
  ; sci/numbers.e16.ts:297  pop()
  call pop
  ; sci/numbers.e16.ts:298  const a = top()
  call top
  mv s3, a0 ; a
  ; sci/numbers.e16.ts:299  math(op, a, b, at)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  mv a3, s0
  call math
  ; sci/numbers.e16.ts:300  exactBinary(op, a, b)
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

; sci/numbers.e16.ts:304 isWhole(n/whole, at) at -O1
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
  ; sci/numbers.e16.ts:305  const t = push(at)
  mv a0, s3
  call push
  mv s2, a0 ; t
  ; sci/numbers.e16.ts:306  copy8(n, t)
  mv a0, s1
  mv a1, s2
  call copy8
  ; sci/numbers.e16.ts:307  math(M_FRAC, t, 0, at)
  li a0, 19
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  ; sci/numbers.e16.ts:308  const whole = isZero(t)
  mv a0, s2
  call isZero
  mv s1, a0 ; n/whole
  ; sci/numbers.e16.ts:309  pop()
  call pop
  ; sci/numbers.e16.ts:310  return whole
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/numbers.e16.ts:314 smallWhole(n/v, at) at -O1
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
  ; sci/numbers.e16.ts:315  if (!isWhole(n, at) || isNegative(n)) fail(E_MATH, at)
  mv a0, s1
  mv a1, s2
  call isWhole
  beqz a0, .L2
  mv a0, s1
  call isNegative
  beqz a0, .L1
.L2:
  ; sci/numbers.e16.ts:315  fail(E_MATH, at)
  li a0, 1
  mv a1, s2
  call fail
.L1:
  ; sci/numbers.e16.ts:316  const t = push(at)
  mv a0, s2
  call push
  mv s3, a0 ; t
  ; sci/numbers.e16.ts:317  copy8(n, t)
  mv a0, s1
  mv a1, s3
  call copy8
  ; sci/numbers.e16.ts:318  math(M_TOINT, t, 0, at)
  li a0, 49
  mv a1, s3
  li a2, 0
  mv a3, s2
  call math
  ; sci/numbers.e16.ts:319  pop()
  call pop
  ; sci/numbers.e16.ts:320  const v = peek16(MATH_ARG)
  li t0, 65366
  lw s1, 0(t0)
  ; sci/numbers.e16.ts:321  if (i16(v) < 0 || v > 999) fail(E_MATH, at)
  blt s1, zero, .L4
  li t0, 999
  bgeu t0, s1, .L3
.L4:
  ; sci/numbers.e16.ts:321  fail(E_MATH, at)
  li a0, 1
  mv a1, s2
  call fail
.L3:
  ; sci/numbers.e16.ts:322  return v
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:290 twoD() at -O1
twoD:
  ; sci/calc.e16.ts:291  return peek(KEEP_DISPLAY) === 0 && mode !== MODE_BASE
  lbu t0, 3075(zero)
  sub t0, t0, zero
  seqz t0, t0
  mv t1, t0
  beqz t1, .L1
  lw t0, 0x0490(zero)
  li t1, 2
  sub t0, t0, t1
  snez t0, t0
.L1:
  mv a0, t0
.return:
  ret

; sci/calc.e16.ts:304 calcCold() at -O1
calcCold:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:305  keepReady()
  call keepReady
  ; sci/calc.e16.ts:306  modesReady()
  call modesReady
  ; sci/calc.e16.ts:307  contrastBack()
  call contrastBack
  ; sci/calc.e16.ts:308  cls()
  call cls
  ; sci/calc.e16.ts:309  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:310  centre(2, str('ELEC-16 SCI'), 11)
  li a0, 2
  la a1, str_64
  li a2, 11
  call centre
  ; sci/calc.e16.ts:311  centre(4, str('SCI-128'), 7)
  li a0, 4
  la a1, str_65
  li a2, 7
  call centre
  ; sci/calc.e16.ts:312  marks(0)
  ; sci/lcd.e16.ts:171  poke16(IO_ANNUNCIATORS, bits)
  li t0, 65326
  sw zero, 0(t0)
  ; sci/calc.e16.ts:313  pause(700)
  ; sci/calc.e16.ts:386  poke16(IO_TCMP, peek16(IO_TCOUNT) + ms)
  li t0, 65328
  lw t0, 0(t0)
  addi t0, t0, 700
  li t1, 65330
  sw t0, 0(t1)
  ; sci/calc.e16.ts:387  poke16(IO_TCTRL, 1)
  li t0, 1
  li t1, 65332
  sw t0, 0(t1)
  ; sci/calc.e16.ts:388  csrw(CSR_MIE, 3)
  li t0, 3
  csrw 772, t0
  ; sci/calc.e16.ts:389  wfi()
  wfi
  ; sci/calc.e16.ts:390  poke16(IO_TCTRL, 0)
  li t0, 65332
  sw zero, 0(t0)
  ; sci/calc.e16.ts:391  csrw(CSR_MIE, 0)
  csrw 772, zero
  ; sci/calc.e16.ts:314  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:315  length = 0
  sw zero, 0x055a(zero)
  ; sci/calc.e16.ts:316  cursor = 0
  sw zero, 0x055c(zero)
  ; sci/calc.e16.ts:317  answered = false
  sw zero, 0x055e(zero)
  ; sci/calc.e16.ts:318  mode = peek(KEEP_MODE)
  lbu t0, 3116(zero)
  sw t0, 0x0490(zero)
  ; sci/calc.e16.ts:319  if (mode > MODE_EQN) mode = MODE_CALC
  li t1, 4
  bgeu t1, t0, .L1
  ; sci/calc.e16.ts:319  mode = MODE_CALC
  sw zero, 0x0490(zero)
.L1:
  ; sci/calc.e16.ts:320  loadLine()
  call loadLine
  ; sci/calc.e16.ts:321  startMode()
  call startMode
  ; sci/calc.e16.ts:322  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:328 enterMode(m) at -O1
;   m in s1
enterMode:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; m
  ; sci/calc.e16.ts:329  saveLine()
  call saveLine
  ; sci/calc.e16.ts:330  mode = m
  sw s1, 0x0490(zero)
  ; sci/calc.e16.ts:331  poke(KEEP_MODE, m)
  sb s1, 3116(zero)
  ; sci/calc.e16.ts:332  loadLine()
  call loadLine
  ; sci/calc.e16.ts:333  answered = false
  sw zero, 0x055e(zero)
  ; sci/calc.e16.ts:334  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x056e(zero)
  ; sci/calc.e16.ts:335  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:336  startMode()
  call startMode
  ; sci/calc.e16.ts:337  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:341 lineSlot() at -O1
lineSlot:
  ; sci/calc.e16.ts:342  if (mode === MODE_BASE) return BASE_LINE
  lw t0, 0x0490(zero)
  li t1, 2
  bne t0, t1, .L1
  ; sci/calc.e16.ts:342  return BASE_LINE
  li a0, 8192
  ret
.L1:
  ; sci/calc.e16.ts:343  if (mode === MODE_TABLE) return TABLE_LINE
  lw t0, 0x0490(zero)
  li t1, 3
  bne t0, t1, .L2
  ; sci/calc.e16.ts:343  return TABLE_LINE
  li a0, 7168
  ret
.L2:
  ; sci/calc.e16.ts:344  return CALC_LINE
  li a0, 7936
.return:
  ret

; sci/calc.e16.ts:348 lineMax() at -O1
lineMax:
  ; sci/calc.e16.ts:349  if (mode === MODE_BASE) return 99
  lw t0, 0x0490(zero)
  li t1, 2
  bne t0, t1, .L1
  ; sci/calc.e16.ts:349  return 99
  li a0, 99
  ret
.L1:
  ; sci/calc.e16.ts:350  if (mode === MODE_TABLE) return 197
  lw t0, 0x0490(zero)
  li t1, 3
  bne t0, t1, .L2
  ; sci/calc.e16.ts:350  return 197
  li a0, 197
  ret
.L2:
  ; sci/calc.e16.ts:351  return LINE_MAX
  li a0, 199
.return:
  ret

; sci/calc.e16.ts:354 saveLine() at -O1
;   slot in s1
saveLine:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/calc.e16.ts:355  const slot = lineSlot()
  call lineSlot
  mv s1, a0 ; slot
  ; sci/calc.e16.ts:356  poke(slot, length)
  lw t0, 0x055a(zero)
  sb t0, 0(s1)
  ; sci/calc.e16.ts:357  poke(slot + 1, cursor)
  lw t0, 0x055c(zero)
  sb t0, 1(s1)
  ; sci/calc.e16.ts:358  memcpy(slot + 2, addr(line), length)
  lw a2, 0x055a(zero)
  addi a0, s1, 2
  la a1, line
  mcpy a0, a1, a2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:361 loadLine() at -O1
;   slot in s1
loadLine:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/calc.e16.ts:362  const slot = lineSlot()
  call lineSlot
  mv s1, a0 ; slot
  ; sci/calc.e16.ts:363  length = peek(slot)
  lbu t0, 0(s1)
  sw t0, 0x055a(zero)
  ; sci/calc.e16.ts:364  cursor = peek(slot + 1)
  lbu t0, 1(s1)
  sw t0, 0x055c(zero)
  ; sci/calc.e16.ts:365  if (length > lineMax() || cursor > length) {
  lw t0, 0x055a(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  call lineMax
  lw t0, 0(sp)
  addi sp, sp, 2
  bltu a0, t0, .L2
  lw t0, 0x055c(zero)
  lw t1, 0x055a(zero)
  bgeu t1, t0, .L1
.L2:
  ; sci/calc.e16.ts:366  length = 0
  sw zero, 0x055a(zero)
  ; sci/calc.e16.ts:367  cursor = 0
  sw zero, 0x055c(zero)
.L1:
  ; sci/calc.e16.ts:369  memcpy(addr(line), slot + 2, length)
  lw a2, 0x055a(zero)
  la a0, line
  addi a1, s1, 2
  mcpy a0, a1, a2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:373 startMode() at -O1
startMode:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:374  if (mode === MODE_EQN) eqnStart()
  lw t0, 0x0490(zero)
  li t1, 4
  bne t0, t1, .L1
  ; sci/calc.e16.ts:374  eqnStart()
  la t0, eqnStart
  li t1, 11
  call far_call
  j .L2
.L1:
  ; sci/calc.e16.ts:375  if (mode === MODE_STATS) statsStart()
  lw t0, 0x0490(zero)
  li t1, 1
  bne t0, t1, .L3
  ; sci/calc.e16.ts:375  statsStart()
  la t0, statsStart
  li t1, 7
  call far_call
  j .L4
.L3:
  ; sci/calc.e16.ts:376  if (mode === MODE_TABLE) tableReset()
  lw t0, 0x0490(zero)
  li t1, 3
  bne t0, t1, .L5
  ; sci/calc.e16.ts:376  tableReset()
  la t0, tableReset
  li t1, 10
  call far_call
.L5:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:380 ownScreen() at -O1
ownScreen:
  ; sci/calc.e16.ts:381  return mode === MODE_STATS || mode === MODE_EQN
  lw t0, 0x0490(zero)
  li t1, 1
  sub t0, t0, t1
  seqz t0, t0
  mv t1, t0
  bnez t1, .L1
  lw t0, 0x0490(zero)
  li t1, 4
  sub t0, t0, t1
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; sci/calc.e16.ts:395 calcLoop() at -O1
calcLoop:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:396  for (;;) key(getkey())
.L1:
  ; sci/calc.e16.ts:396  key(getkey())
  call getkey
  call key
  j .L1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:400 refuse() at -O1
refuse:
  ; sci/calc.e16.ts:401  poke16(IO_FREQ, 1800)
  li t0, 1800
  li t1, 65344
  sw t0, 0(t1)
  ; sci/calc.e16.ts:402  poke16(IO_DUR, 40)
  li t0, 40
  li t1, 65346
  sw t0, 0(t1)
.return:
  ret

; sci/calc.e16.ts:408 calcError() at -O1
calcError:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:409  screen = S_ERROR
  li t0, 1
  sw t0, 0x048e(zero)
  ; sci/calc.e16.ts:410  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:411  errorScreen(errCode)
  lw a0, 0x0104(zero)
  la t0, errorScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:412  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:416 calcFault(cause, pc) at -O1
;   cause in s1
;   pc in s2
calcFault:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; cause
  mv s2, a1 ; pc
  ; sci/calc.e16.ts:417  screen = S_ERROR
  li t0, 1
  sw t0, 0x048e(zero)
  ; sci/calc.e16.ts:418  length = 0
  sw zero, 0x055a(zero)
  ; sci/calc.e16.ts:419  cursor = 0
  sw zero, 0x055c(zero)
  ; sci/calc.e16.ts:420  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:421  faultScreen(cause, pc)
  mv a0, s1
  mv a1, s2
  la t0, faultScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:422  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:429 calcOn() at -O1
calcOn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:430  if (shifted) {
  lw t0, 0x0560(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:431  shifted = false
  sw zero, 0x0560(zero)
  ; sci/calc.e16.ts:432  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:433  poke16(0xff06, 0)
  li t0, 65286
  sw zero, 0(t0)
  ; sci/calc.e16.ts:434  return
  j .return
.L1:
  ; sci/calc.e16.ts:436  clearLine()
  call clearLine
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:439 clearLine() at -O1
clearLine:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:440  if (ownScreen()) {
  call ownScreen
  beqz a0, .L1
  ; sci/calc.e16.ts:441  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:442  shifted = false
  sw zero, 0x0560(zero)
  ; sci/calc.e16.ts:443  alphaOn = false
  sw zero, 0x0562(zero)
  ; sci/calc.e16.ts:444  if (mode === MODE_STATS) statsReset()
  lw t0, 0x0490(zero)
  li t1, 1
  bne t0, t1, .L2
  ; sci/calc.e16.ts:444  statsReset()
  la t0, statsReset
  li t1, 7
  call far_call
  j .L3
.L2:
  ; sci/calc.e16.ts:445  eqnReset()
  la t0, eqnReset
  li t1, 11
  call far_call
.L3:
  ; sci/calc.e16.ts:446  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:447  return
  j .return
.L1:
  ; sci/calc.e16.ts:449  if (mode === MODE_TABLE) tableReset()
  lw t0, 0x0490(zero)
  li t1, 3
  bne t0, t1, .L4
  ; sci/calc.e16.ts:449  tableReset()
  la t0, tableReset
  li t1, 10
  call far_call
.L4:
  ; sci/calc.e16.ts:451  dropConstant()
  la t0, dropConstant
  li t1, 10
  call far_call
  ; sci/calc.e16.ts:452  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:453  length = 0
  sw zero, 0x055a(zero)
  ; sci/calc.e16.ts:454  cursor = 0
  sw zero, 0x055c(zero)
  ; sci/calc.e16.ts:455  answered = false
  sw zero, 0x055e(zero)
  ; sci/calc.e16.ts:456  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x056e(zero)
  ; sci/calc.e16.ts:457  shifted = false
  sw zero, 0x0560(zero)
  ; sci/calc.e16.ts:458  alphaOn = false
  sw zero, 0x0562(zero)
  ; sci/calc.e16.ts:459  storing = false
  sw zero, 0x0564(zero)
  ; sci/calc.e16.ts:460  recalling = false
  sw zero, 0x0566(zero)
  ; sci/calc.e16.ts:461  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:466 key(k) at -O1
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
  ; sci/calc.e16.ts:467  if (k === K_SHIFT) {
  li t0, 6
  bne s1, t0, .L1
  ; sci/calc.e16.ts:468  shifted = !shifted
  lw t0, 0x0560(zero)
  seqz t0, t0
  sw t0, 0x0560(zero)
  ; sci/calc.e16.ts:469  alphaOn = false
  sw zero, 0x0562(zero)
  ; sci/calc.e16.ts:470  drawMarks()
  call drawMarks
  ; sci/calc.e16.ts:471  return
  j .return
.L1:
  ; sci/calc.e16.ts:473  if (k === K_ALPHA) {
  li t0, 7
  bne s1, t0, .L2
  ; sci/calc.e16.ts:474  alphaOn = !alphaOn
  lw t0, 0x0562(zero)
  seqz t0, t0
  sw t0, 0x0562(zero)
  ; sci/calc.e16.ts:475  shifted = false
  sw zero, 0x0560(zero)
  ; sci/calc.e16.ts:476  drawMarks()
  call drawMarks
  ; sci/calc.e16.ts:477  return
  j .return
.L2:
  ; sci/calc.e16.ts:479  const shift = shifted
  lw s2, 0x0560(zero)
  ; sci/calc.e16.ts:480  const alpha = alphaOn
  lw s3, 0x0562(zero)
  ; sci/calc.e16.ts:481  shifted = false
  sw zero, 0x0560(zero)
  ; sci/calc.e16.ts:482  alphaOn = false
  sw zero, 0x0562(zero)
  ; sci/calc.e16.ts:483  dispatch(k, shift, alpha)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call dispatch
  ; sci/calc.e16.ts:484  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:488 dispatch(k, shift, alpha) at -O1
;   k in s1
;   shift in s2
;   alpha in s3
dispatch:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift
  mv s3, a2 ; alpha
  ; sci/calc.e16.ts:489  if (screen === S_ERROR) errorKey(k)
  lw t0, 0x048e(zero)
  li t1, 1
  bne t0, t1, .L1
  ; sci/calc.e16.ts:489  errorKey(k)
  mv a0, s1
  call errorKey
  j .L2
.L1:
  ; sci/calc.e16.ts:490  if (screen === S_MENU) chosenMode(menuKey(k))
  lw t0, 0x048e(zero)
  li t1, 2
  bne t0, t1, .L3
  ; sci/calc.e16.ts:490  chosenMode(menuKey(k))
  mv a0, s1
  la t0, menuKey
  li t1, 1
  call far_call
  call chosenMode
  j .L4
.L3:
  ; sci/calc.e16.ts:491  if (screen === S_SETUP) {
  lw t0, 0x048e(zero)
  li t1, 3
  bne t0, t1, .L5
  ; sci/calc.e16.ts:492  if (setupKey(k) !== 0) clearLine()
  mv a0, s1
  la t0, setupKey
  li t1, 1
  call far_call
  beq a0, zero, .L7
  ; sci/calc.e16.ts:492  clearLine()
  call clearLine
  j .L7
.L5:
  ; sci/calc.e16.ts:493  if (screen === S_FUNC) funcChosen(mode === MODE_BASE ? baseFuncKey(k) : funcKey(k))
  lw t0, 0x048e(zero)
  li t1, 4
  bne t0, t1, .L8
  ; sci/calc.e16.ts:493  funcChosen(mode === MODE_BASE ? baseFuncKey(k) : funcKey(k))
  lw t0, 0x0490(zero)
  li t1, 2
  bne t0, t1, .L9
  mv a0, s1
  la t0, baseFuncKey
  li t1, 8
  call far_call
  mv t0, a0
  j .L10
.L9:
  mv a0, s1
  la t0, funcKey
  li t1, 1
  call far_call
  mv t0, a0
.L10:
  mv a0, t0
  call funcChosen
  j .L11
.L8:
  ; sci/calc.e16.ts:494  if (screen === S_ASK) asked(k, shift)
  lw t0, 0x048e(zero)
  li t1, 5
  bne t0, t1, .L12
  ; sci/calc.e16.ts:494  asked(k, shift)
  mv a0, s1
  mv a1, s2
  call asked
  j .L13
.L12:
  ; sci/calc.e16.ts:495  if (k === K_SETUP && shift) angleKey()
  li t0, 9
  bne s1, t0, .L14
  beqz s2, .L14
  ; sci/calc.e16.ts:495  angleKey()
  call angleKey
  j .L15
.L14:
  ; sci/calc.e16.ts:496  if (k === K_MENU || k === K_SETUP) openScreen(k)
  li t0, 8
  beq s1, t0, .L17
  li t0, 9
  bne s1, t0, .L16
.L17:
  ; sci/calc.e16.ts:496  openScreen(k)
  mv a0, s1
  call openScreen
  j .L18
.L16:
  ; sci/calc.e16.ts:497  modeKey(k, shift, alpha)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call modeKey
.L18:
.L15:
.L13:
.L11:
.L7:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:501 modeKey(k, shift, alpha) at -O1
;   k in s1
;   shift in s2
;   alpha in s3
modeKey:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift
  mv s3, a2 ; alpha
  ; sci/calc.e16.ts:502  if (mode === MODE_STATS) statsKey(k, shift)
  lw t0, 0x0490(zero)
  li t1, 1
  bne t0, t1, .L1
  ; sci/calc.e16.ts:502  statsKey(k, shift)
  mv a0, s1
  mv a1, s2
  la t0, statsKey
  li t1, 7
  call far_call
  j .L2
.L1:
  ; sci/calc.e16.ts:503  if (mode === MODE_EQN) eqnKey(k, shift)
  lw t0, 0x0490(zero)
  li t1, 4
  bne t0, t1, .L3
  ; sci/calc.e16.ts:503  eqnKey(k, shift)
  mv a0, s1
  mv a1, s2
  la t0, eqnKey
  li t1, 11
  call far_call
  j .L4
.L3:
  ; sci/calc.e16.ts:504  if (mode === MODE_TABLE && tablePhase() === TABLE_VIEW) tableKey(k)
  lw t0, 0x0490(zero)
  li t1, 3
  bne t0, t1, .L5
  la t0, tablePhase
  li t1, 10
  call far_call
  li t0, 2
  bne a0, t0, .L5
  ; sci/calc.e16.ts:504  tableKey(k)
  mv a0, s1
  la t0, tableKey
  li t1, 10
  call far_call
  j .L6
.L5:
  ; sci/calc.e16.ts:506  calcKey(k, shift, alpha)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call calcKey
  ; sci/calc.e16.ts:507  return
  j .return
.L6:
.L4:
.L2:
  ; sci/calc.e16.ts:509  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:516 angleKey() at -O1
angleKey:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:517  if (mode !== MODE_CALC) {
  lw t0, 0x0490(zero)
  beq t0, zero, .L1
  ; sci/calc.e16.ts:518  refuse()
  call refuse
  ; sci/calc.e16.ts:519  return
  j .return
.L1:
  ; sci/calc.e16.ts:521  if (!answered && length > 0) equals(false)
  lw t0, 0x055e(zero)
  bnez t0, .L2
  lw t0, 0x055a(zero)
  bgeu zero, t0, .L2
  ; sci/calc.e16.ts:521  equals(false)
  li a0, 0
  call equals
.L2:
  ; sci/calc.e16.ts:522  nextAngle()
  la t0, nextAngle
  li t1, 10
  call far_call
  ; sci/calc.e16.ts:523  answered = true
  li t0, 1
  sw t0, 0x055e(zero)
  ; sci/calc.e16.ts:524  shown = SHOW_DECIMAL
  sw zero, 0x0572(zero)
  ; sci/calc.e16.ts:525  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:529 openScreen(k) at -O1
;   k in s1
openScreen:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/calc.e16.ts:530  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:531  if (k === K_MENU) {
  li t0, 8
  bne s1, t0, .L1
  ; sci/calc.e16.ts:532  screen = S_MENU
  li t0, 2
  sw t0, 0x048e(zero)
  ; sci/calc.e16.ts:533  menuScreen(mode)
  lw a0, 0x0490(zero)
  la t0, menuScreen
  li t1, 1
  call far_call
  j .L2
.L1:
  ; sci/calc.e16.ts:535  screen = S_SETUP
  li t0, 3
  sw t0, 0x048e(zero)
  ; sci/calc.e16.ts:536  setupScreen()
  la t0, setupScreen
  li t1, 1
  call far_call
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:541 chosenMode(m) at -O1
;   m in s1
chosenMode:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; m
  ; sci/calc.e16.ts:542  if (m === 0) return
  bne s1, zero, .L1
  ; sci/calc.e16.ts:542  return
  j .return
.L1:
  ; sci/calc.e16.ts:543  if (m === 0xff) {
  li t0, 255
  bne s1, t0, .L2
  ; sci/calc.e16.ts:544  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:545  drawCalc()
  call drawCalc
  j .L3
.L2:
  ; sci/calc.e16.ts:546  enterMode(m - 1)
  addi a0, s1, -1
  call enterMode
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:550 errorKey(k) at -O1
;   k in s1
errorKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/calc.e16.ts:551  if (k === K_AC) {
  li t0, 5
  bne s1, t0, .L1
  ; sci/calc.e16.ts:552  clearLine()
  call clearLine
  ; sci/calc.e16.ts:553  return
  j .return
.L1:
  ; sci/calc.e16.ts:555  if ((k === K_LEFT || k === K_RIGHT) && ownScreen()) {
  li t0, 2
  beq s1, t0, .L3
  li t0, 3
  bne s1, t0, .L2
.L3:
  call ownScreen
  beqz a0, .L2
  ; sci/calc.e16.ts:556  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:557  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:558  return
  j .return
.L2:
  ; sci/calc.e16.ts:560  if (k === K_LEFT || k === K_RIGHT) {
  li t0, 2
  beq s1, t0, .L5
  li t0, 3
  bne s1, t0, .L4
.L5:
  ; sci/calc.e16.ts:561  if (mode === MODE_TABLE) tableReset()
  lw t0, 0x0490(zero)
  li t1, 3
  bne t0, t1, .L6
  ; sci/calc.e16.ts:561  tableReset()
  la t0, tableReset
  li t1, 10
  call far_call
.L6:
  ; sci/calc.e16.ts:562  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:563  answered = false
  sw zero, 0x055e(zero)
  ; sci/calc.e16.ts:564  cursor = errAt < length ? errAt : length
  lw t0, 0x0106(zero)
  lw t1, 0x055a(zero)
  bgeu t0, t1, .L7
  lw t0, 0x0106(zero)
  j .L8
.L7:
  lw t0, 0x055a(zero)
.L8:
  sw t0, 0x055c(zero)
  ; sci/calc.e16.ts:565  drawCalc()
  call drawCalc
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:573 baseKey(k/t, shift, alpha) at -O1
;   k/t in s1
;   shift in s2
;   alpha in s3
baseKey:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k/t
  mv s2, a1 ; shift
  mv s3, a2 ; alpha
  ; sci/calc.e16.ts:574  if (baseCommand(k)) {
  mv a0, s1
  la t0, baseCommand
  li t1, 8
  call far_call
  beqz a0, .L1
  ; sci/calc.e16.ts:575  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:576  return
  j .return
.L1:
  ; sci/calc.e16.ts:578  if (k === K_FUNC) {
  li t0, 11
  bne s1, t0, .L2
  ; sci/calc.e16.ts:579  screen = S_FUNC
  li t0, 4
  sw t0, 0x048e(zero)
  ; sci/calc.e16.ts:580  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:581  baseFuncScreen()
  la t0, baseFuncScreen
  li t1, 8
  call far_call
  ; sci/calc.e16.ts:582  return
  j .return
.L2:
  ; sci/calc.e16.ts:584  if (editKey(k) && commandKey(k, shift, alpha)) return
  mv a0, s1
  call editKey
  beqz a0, .L3
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call commandKey
  beqz a0, .L3
  ; sci/calc.e16.ts:584  return
  j .return
.L3:
  ; sci/calc.e16.ts:585  const t = baseToken(k)
  mv a0, s1
  la t0, baseToken
  li t1, 8
  call far_call
  mv s1, a0 ; k/t
  ; sci/calc.e16.ts:586  if (t === 0) refuse()
  bne s1, zero, .L4
  ; sci/calc.e16.ts:586  refuse()
  call refuse
  j .L5
.L4:
  ; sci/calc.e16.ts:587  type(t)
  mv a0, s1
  call type
.L5:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:591 editKey(k) at -O1
;   k in a0
editKey:
  ; sci/calc.e16.ts:592  return (
  li t0, 4
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L6
  li t0, 5
  sub t0, a0, t0
  seqz t0, t0
.L6:
  mv t1, t0
  bnez t1, .L5
  li t0, 14
  sub t0, a0, t0
  seqz t0, t0
.L5:
  mv t1, t0
  bnez t1, .L4
  li t0, 2
  sub t0, a0, t0
  seqz t0, t0
.L4:
  mv t1, t0
  bnez t1, .L3
  li t0, 3
  sub t0, a0, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  sub t0, a0, zero
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 1
  sub t0, a0, t0
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; sci/calc.e16.ts:604 tableAsked(r) at -O1
;   r in s1
tableAsked:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; r
  ; sci/calc.e16.ts:605  if (r === ASK_DONE && tableNext()) {
  li t0, 2
  bne s1, t0, .L1
  la t0, tableNext
  li t1, 10
  call far_call
  beqz a0, .L1
  ; sci/calc.e16.ts:606  askRange(tableAsking(), rangeAt(tableAsking()))
  la t0, tableAsking
  li t1, 10
  call far_call
  addi sp, sp, -2
  sw a0, 0(sp)
  la t0, tableAsking
  li t1, 10
  call far_call
  la t0, rangeAt
  li t1, 10
  call far_call
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  la t0, askRange
  li t1, 6
  call far_call
  ; sci/calc.e16.ts:607  return
  j .return
.L1:
  ; sci/calc.e16.ts:609  if (r === ASK_BACK) tableReset()
  li t0, 1
  bne s1, t0, .L2
  ; sci/calc.e16.ts:609  tableReset()
  la t0, tableReset
  li t1, 10
  call far_call
.L2:
  ; sci/calc.e16.ts:610  if (r !== ASK_STAY) {
  beq s1, zero, .L3
  ; sci/calc.e16.ts:611  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:612  drawCalc()
  call drawCalc
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:617 funcChosen(t) at -O1
;   t in s1
funcChosen:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/calc.e16.ts:618  if (t === 0) return
  bne s1, zero, .L1
  ; sci/calc.e16.ts:618  return
  j .return
.L1:
  ; sci/calc.e16.ts:619  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:620  if (t === 1) drawCalc()
  li t0, 1
  bne s1, t0, .L2
  ; sci/calc.e16.ts:620  drawCalc()
  call drawCalc
  j .L3
.L2:
  ; sci/calc.e16.ts:621  type(t)
  mv a0, s1
  call type
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:625 asked(k/r, shift/t) at -O1
;   k/r in s1
;   shift/t in s2
asked:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/r
  mv s2, a1 ; shift/t
  ; sci/calc.e16.ts:626  const t = k === K_DEL || k === K_EQ || k === K_AC ? 0 : tokenOf(k, shift)
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
  ; sci/calc.e16.ts:627  const r = askKey(k === K_EQ, k === K_DEL, k === K_AC, t)
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
  ; sci/calc.e16.ts:628  if (mode === MODE_TABLE) {
  lw t0, 0x0490(zero)
  li t1, 3
  bne t0, t1, .L4
  ; sci/calc.e16.ts:629  tableAsked(r)
  mv a0, s1
  call tableAsked
  ; sci/calc.e16.ts:630  return
  j .return
.L4:
  ; sci/calc.e16.ts:632  if (r === ASK_BACK) {
  li t0, 1
  bne s1, t0, .L5
  ; sci/calc.e16.ts:633  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:634  drawCalc()
  call drawCalc
  j .L6
.L5:
  ; sci/calc.e16.ts:635  if (r === ASK_DONE) {
  li t0, 2
  bne s1, t0, .L7
  ; sci/calc.e16.ts:636  screen = S_CALC
  sw zero, 0x048e(zero)
  ; sci/calc.e16.ts:637  answered = true
  li t0, 1
  sw t0, 0x055e(zero)
  ; sci/calc.e16.ts:638  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x056e(zero)
  ; sci/calc.e16.ts:639  shown = found ? SHOW_FOUND : firstShown(formFirst(false))
  lw t0, 0x056c(zero)
  beqz t0, .L8
  li t0, 6
  j .L9
.L8:
  li a0, 0
  call formFirst
  la t0, firstShown
  li t1, 5
  call far_call
  mv t0, a0
.L9:
  sw t0, 0x0572(zero)
  ; sci/calc.e16.ts:640  drawCalc()
  call drawCalc
.L7:
.L6:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:644 calcKey(k, shift, alpha/t) at -O1
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
  ; sci/calc.e16.ts:645  if (storing || recalling) {
  lw t0, 0x0564(zero)
  bnez t0, .L2
  lw t0, 0x0566(zero)
  beqz t0, .L1
.L2:
  ; sci/calc.e16.ts:646  variableKey(k)
  mv a0, s1
  call variableKey
  ; sci/calc.e16.ts:647  return
  j .return
.L1:
  ; sci/calc.e16.ts:649  if (mode === MODE_BASE) {
  lw t0, 0x0490(zero)
  li t1, 2
  bne t0, t1, .L3
  ; sci/calc.e16.ts:650  baseKey(k, shift, alpha)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call baseKey
  ; sci/calc.e16.ts:651  return
  j .return
.L3:
  ; sci/calc.e16.ts:653  const wasHyp = hyp
  lw s0, 0x056a(zero)
  ; sci/calc.e16.ts:654  hyp = false
  sw zero, 0x056a(zero)
  ; sci/calc.e16.ts:655  if (commandKey(k, shift, alpha)) return
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call commandKey
  beqz a0, .L4
  ; sci/calc.e16.ts:655  return
  j .return
.L4:
  ; sci/calc.e16.ts:656  if (!alpha && templateKey(k, shift)) return
  bnez s2, .L5
  mv a0, s1
  mv a1, s3
  call templateKey
  beqz a0, .L5
  ; sci/calc.e16.ts:656  return
  j .return
.L5:
  ; sci/calc.e16.ts:657  if (!alpha && !shift && k === K_DMS) {
  bnez s2, .L6
  bnez s3, .L6
  li t0, 25
  bne s1, t0, .L6
  ; sci/calc.e16.ts:658  dmsMark()
  call dmsMark
  ; sci/calc.e16.ts:659  return
  j .return
.L6:
  ; sci/calc.e16.ts:661  const t = alpha ? letterOf(k) : wasHyp ? hypToken(k, shift) : tokenOf(k, shift)
  beqz s2, .L7
  mv a0, s1
  call letterOf
  mv t0, a0
  j .L8
.L7:
  beqz s0, .L9
  mv a0, s1
  mv a1, s3
  call hypToken
  mv t0, a0
  j .L10
.L9:
  mv a0, s1
  mv a1, s3
  call tokenOf
  mv t0, a0
.L10:
.L8:
  mv s2, t0 ; alpha/t
  ; sci/calc.e16.ts:662  if (t === 0) {
  bne s2, zero, .L11
  ; sci/calc.e16.ts:663  refuse()
  call refuse
  ; sci/calc.e16.ts:664  return
  j .return
.L11:
  ; sci/calc.e16.ts:666  type(t)
  mv a0, s2
  call type
  ; sci/calc.e16.ts:668  if (shift && (k === K_LOG || k === K_LN)) {
  beqz s3, .L12
  li t0, 20
  beq s1, t0, .L13
  li t0, 21
  bne s1, t0, .L12
.L13:
  ; sci/calc.e16.ts:669  insert(T_POW)
  li a0, 17
  call insert
  ; sci/calc.e16.ts:670  drawCalc()
  call drawCalc
.L12:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/calc.e16.ts:678 templateKey(k, shift) at -O1
;   k in s1
;   shift in s2
templateKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift
  ; sci/calc.e16.ts:679  if (shift && (k === K_FRAC || k === K_POW)) {
  beqz s2, .L1
  li t0, 16
  beq s1, t0, .L2
  li t0, 19
  bne s1, t0, .L1
.L2:
  ; sci/calc.e16.ts:680  wrapped(k === K_FRAC ? T_MIXED : T_XROOT)
  li t0, 16
  bne s1, t0, .L3
  li t0, 28
  j .L4
.L3:
  li t0, 30
.L4:
  mv a0, t0
  call wrapped
  ; sci/calc.e16.ts:681  return true
  li a0, 1
  j .return
.L1:
  ; sci/calc.e16.ts:683  return plainTemplate(k, shift)
  mv a0, s1
  mv a1, s2
  call plainTemplate
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:687 plainTemplate(k, shift/root) at -O1
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
  ; sci/calc.e16.ts:688  const fractionKey = k === K_FRAC && !shift
  li t0, 16
  sub t0, s1, t0
  seqz t0, t0
  mv t1, t0
  beqz t1, .L1
  seqz t0, s2
.L1:
  mv s3, t0 ; fractionKey
  ; sci/calc.e16.ts:689  if (!twoD()) {
  call twoD
  bnez a0, .L2
  ; sci/calc.e16.ts:690  if (fractionKey) type(T_SLASH)
  beqz s3, .L3
  ; sci/calc.e16.ts:690  type(T_SLASH)
  li a0, 27
  call type
.L3:
  ; sci/calc.e16.ts:691  return fractionKey
  mv a0, s3
  j .return
.L2:
  ; sci/calc.e16.ts:693  if (!fractionKey && !makesTemplate(k, shift)) return false
  bnez s3, .L4
  mv a0, s1
  mv a1, s2
  call makesTemplate
  bnez a0, .L4
  ; sci/calc.e16.ts:693  return false
  li a0, 0
  j .return
.L4:
  ; sci/calc.e16.ts:694  const root = k === K_ROOT && !shift
  li t0, 18
  sub t0, s1, t0
  seqz t0, t0
  mv t1, t0
  beqz t1, .L5
  seqz t0, s2
.L5:
  mv s2, t0 ; shift/root
  ; sci/calc.e16.ts:695  if (answered) afresh(fractionKey || k === K_POW)
  lw t0, 0x055e(zero)
  beqz t0, .L6
  ; sci/calc.e16.ts:695  afresh(fractionKey || k === K_POW)
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
  ; sci/calc.e16.ts:696  if (fractionKey) {
  beqz s3, .L8
  ; sci/calc.e16.ts:697  wrap(addr(line), length, cursor, T_FRAC)
  lw a1, 0x055a(zero)
  lw a2, 0x055c(zero)
  la a0, line
  li a3, 22
  la t0, wrap
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:698  edited()
  call edited
  j .L9
.L8:
  ; sci/calc.e16.ts:699  insertTemplate(k, root)
  mv a0, s1
  mv a1, s2
  call insertTemplate
.L9:
  ; sci/calc.e16.ts:700  tallEnough()
  call tallEnough
  ; sci/calc.e16.ts:701  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:702  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:706 wrapped(opener) at -O1
;   opener in s1
wrapped:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; opener
  ; sci/calc.e16.ts:707  if (answered) afresh(false)
  lw t0, 0x055e(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:707  afresh(false)
  li a0, 0
  call afresh
.L1:
  ; sci/calc.e16.ts:708  if (length + 4 > lineMax()) {
  lw t0, 0x055a(zero)
  addi t0, t0, 4
  addi sp, sp, -2
  sw t0, 0(sp)
  call lineMax
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu a0, t0, .L2
  ; sci/calc.e16.ts:709  refuse()
  call refuse
  ; sci/calc.e16.ts:710  return
  j .return
.L2:
  ; sci/calc.e16.ts:712  wrap(addr(line), length, cursor, opener)
  lw a1, 0x055a(zero)
  lw a2, 0x055c(zero)
  la a0, line
  mv a3, s1
  la t0, wrap
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:713  edited()
  call edited
  ; sci/calc.e16.ts:714  tallEnough()
  call tallEnough
  ; sci/calc.e16.ts:715  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:719 tallEnough() at -O1
tallEnough:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:720  if (!twoD() || heightOf(addr(line), length) <= LINE_HEIGHT_MAX) return
  call twoD
  beqz a0, .L2
  lw a1, 0x055a(zero)
  la a0, line
  la t0, heightOf
  li t1, 3
  call far_call
  li t0, 36
  bltu t0, a0, .L1
.L2:
  ; sci/calc.e16.ts:720  return
  j .return
.L1:
  ; sci/calc.e16.ts:721  refuse()
  call refuse
  ; sci/calc.e16.ts:722  deleteAt(addr(line), length, cursor)
  lw a1, 0x055a(zero)
  lw a2, 0x055c(zero)
  la a0, line
  la t0, deleteAt
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:723  edited()
  call edited
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:730 dmsMark() at -O1
;   marks in s1
;   j in s2
;   t in s3
dmsMark:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; sci/calc.e16.ts:731  if (answered) {
  lw t0, 0x055e(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:732  shown = shown === SHOW_DMS ? firstShown(formFirst(false)) : SHOW_DMS
  lw t0, 0x0572(zero)
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
  sw t0, 0x0572(zero)
  ; sci/calc.e16.ts:733  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:734  return
  j .return
.L1:
  ; sci/calc.e16.ts:736  let marks: u16 = 0
  li s1, 0 ; marks
  ; sci/calc.e16.ts:737  let j = cursor
  lw s2, 0x055c(zero)
  ; sci/calc.e16.ts:738  while (j > 0) {
  j .L6
.L4:
  ; sci/calc.e16.ts:739  const t = line[j - 1]
  lbu s3, line-1(s2)
  ; sci/calc.e16.ts:740  if (t === T_DEG || t === T_MIN || t === T_SEC) marks++
  li t0, 136
  beq s3, t0, .L9
  li t0, 137
  beq s3, t0, .L9
  li t0, 138
  bne s3, t0, .L8
.L9:
  ; sci/calc.e16.ts:740  marks++
  addi s1, s1, 1
  j .L10
.L8:
  ; sci/calc.e16.ts:741  if (!isDigit(t) && t !== T_POINT) break
  mv a0, s3
  call isDigit
  bnez a0, .L11
  li t0, 46
  beq s3, t0, .L11
  ; sci/calc.e16.ts:741  break
  j .L7
.L11:
.L10:
  ; sci/calc.e16.ts:742  j--
  addi s2, s2, -1
.L6:
  bltu zero, s2, .L4
.L7:
  ; sci/calc.e16.ts:744  if (marks > 2 || j === cursor) {
  li t0, 2
  bltu t0, s1, .L13
  lw t0, 0x055c(zero)
  bne s2, t0, .L12
.L13:
  ; sci/calc.e16.ts:745  refuse()
  call refuse
  ; sci/calc.e16.ts:746  return
  j .return
.L12:
  ; sci/calc.e16.ts:748  type(marks === 0 ? T_DEG : marks === 1 ? T_MIN : T_SEC)
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

; sci/calc.e16.ts:756 makesTemplate(k, shift) at -O1
;   k in a0
;   shift in a1
makesTemplate:
  ; sci/calc.e16.ts:757  if (shift) return k === K_LOG || k === K_LN
  beqz a1, .L1
  ; sci/calc.e16.ts:757  return k === K_LOG || k === K_LN
  li t0, 20
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L2
  li t0, 21
  sub t0, a0, t0
  seqz t0, t0
.L2:
  mv a0, t0
  ret
.L1:
  ; sci/calc.e16.ts:758  return k === K_POW || k === K_ROOT
  li t0, 19
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L3
  li t0, 18
  sub t0, a0, t0
  seqz t0, t0
.L3:
  mv a0, t0
.return:
  ret

; sci/calc.e16.ts:762 edited() at -O1
edited:
  ; sci/calc.e16.ts:763  length = editLength
  lw t0, 0x0678(zero)
  sw t0, 0x055a(zero)
  ; sci/calc.e16.ts:764  cursor = editCursor
  lw t0, 0x067a(zero)
  sw t0, 0x055c(zero)
.return:
  ret

; sci/calc.e16.ts:768 afresh(fromAns) at -O1
;   fromAns in s1
afresh:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; fromAns
  ; sci/calc.e16.ts:769  answered = false
  sw zero, 0x055e(zero)
  ; sci/calc.e16.ts:770  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x056e(zero)
  ; sci/calc.e16.ts:771  length = 0
  sw zero, 0x055a(zero)
  ; sci/calc.e16.ts:772  cursor = 0
  sw zero, 0x055c(zero)
  ; sci/calc.e16.ts:773  if (fromAns) insert(T_ANS)
  beqz s1, .L1
  ; sci/calc.e16.ts:773  insert(T_ANS)
  li a0, 20
  call insert
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:777 insertTemplate(k, root) at -O1
;   k in s1
;   root in s2
insertTemplate:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; root
  ; sci/calc.e16.ts:778  if (k === K_LOG) insert(T_TEN)
  li t0, 20
  bne s1, t0, .L1
  ; sci/calc.e16.ts:778  insert(T_TEN)
  li a0, 21
  call insert
.L1:
  ; sci/calc.e16.ts:779  if (k === K_LN) insert(T_E)
  li t0, 21
  bne s1, t0, .L2
  ; sci/calc.e16.ts:779  insert(T_E)
  li a0, 101
  call insert
.L2:
  ; sci/calc.e16.ts:780  insert(root ? T_ROOT : T_POWT)
  beqz s2, .L3
  li t0, 25
  j .L4
.L3:
  li t0, 26
.L4:
  mv a0, t0
  call insert
  ; sci/calc.e16.ts:781  insert(T_END)
  li a0, 24
  call insert
  ; sci/calc.e16.ts:782  cursor--
  lw t0, 0x055c(zero)
  addi t0, t0, -1
  sw t0, 0x055c(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:786 commandKey(k, shift, alpha) at -O1
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
  ; sci/calc.e16.ts:787  switch (k) {
  li t0, 5
  beq s1, t0, .L2
  li t0, 4
  beq s1, t0, .L3
  li t0, 13
  beq s1, t0, .L4
  li t0, 11
  beq s1, t0, .L5
  li t0, 32
  beq s1, t0, .L6
  li t0, 26
  beq s1, t0, .L7
  li t0, 12
  beq s1, t0, .L8
  li t0, 2
  beq s1, t0, .L9
  li t0, 3
  beq s1, t0, .L10
  beq s1, zero, .L11
  li t0, 1
  beq s1, t0, .L12
  li t0, 14
  beq s1, t0, .L13
  li t0, 25
  beq s1, t0, .L14
  j .L1
.L2:
  ; sci/calc.e16.ts:789  clearLine()
  call clearLine
  ; sci/calc.e16.ts:790  return true
  li a0, 1
  j .return
.L3:
  ; sci/calc.e16.ts:792  if (mode === MODE_TABLE) tableRange()
  lw t0, 0x0490(zero)
  li t1, 3
  bne t0, t1, .L15
  ; sci/calc.e16.ts:792  tableRange()
  call tableRange
  j .L16
.L15:
  ; sci/calc.e16.ts:793  equals(shift)
  mv a0, s2
  call equals
.L16:
  ; sci/calc.e16.ts:794  return true
  li a0, 1
  j .return
.L4:
  ; sci/calc.e16.ts:796  exactOrDecimal(shift)
  mv a0, s2
  call exactOrDecimal
  ; sci/calc.e16.ts:797  return true
  li a0, 1
  j .return
.L5:
  ; sci/calc.e16.ts:799  screen = S_FUNC
  li t0, 4
  sw t0, 0x048e(zero)
  ; sci/calc.e16.ts:800  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:801  funcScreen()
  la t0, funcScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:802  return true
  li a0, 1
  j .return
.L6:
  ; sci/calc.e16.ts:804  solveKey(shift)
  mv a0, s2
  call solveKey
  ; sci/calc.e16.ts:805  return true
  li a0, 1
  j .return
.L7:
  ; sci/calc.e16.ts:807  hyp = !shift
  seqz t0, s2
  sw t0, 0x056a(zero)
  ; sci/calc.e16.ts:808  if (shift) refuse()
  beqz s2, .L17
  ; sci/calc.e16.ts:808  refuse()
  call refuse
.L17:
  ; sci/calc.e16.ts:809  return true
  li a0, 1
  j .return
.L8:
  ; sci/calc.e16.ts:811  recalling = shift
  sw s2, 0x0566(zero)
  ; sci/calc.e16.ts:812  storing = !shift
  seqz t0, s2
  sw t0, 0x0564(zero)
  ; sci/calc.e16.ts:813  return true
  li a0, 1
  j .return
.L9:
.L10:
  ; sci/calc.e16.ts:816  arrow(k === K_LEFT)
  li t0, 2
  sub t0, s1, t0
  seqz a0, t0
  call arrow
  ; sci/calc.e16.ts:817  return true
  li a0, 1
  j .return
.L11:
.L12:
  ; sci/calc.e16.ts:820  history(k === K_UP)
  sub t0, s1, zero
  seqz a0, t0
  call history
  ; sci/calc.e16.ts:821  return true
  li a0, 1
  j .return
.L13:
  ; sci/calc.e16.ts:824  if (shift) {
  beqz s2, .L18
  ; sci/calc.e16.ts:825  overwrite = !overwrite
  lw t0, 0x0568(zero)
  seqz t0, t0
  sw t0, 0x0568(zero)
  ; sci/calc.e16.ts:826  drawCalc()
  call drawCalc
  j .L19
.L18:
  ; sci/calc.e16.ts:827  deleteBefore()
  call deleteBefore
.L19:
  ; sci/calc.e16.ts:828  return true
  li a0, 1
  j .return
.L14:
  ; sci/calc.e16.ts:830  if (!shift) return false
  bnez s2, .L20
  ; sci/calc.e16.ts:830  return false
  li a0, 0
  j .return
.L20:
  ; sci/calc.e16.ts:831  if (answered) dmsMark()
  lw t0, 0x055e(zero)
  beqz t0, .L21
  ; sci/calc.e16.ts:831  dmsMark()
  call dmsMark
  j .L22
.L21:
  ; sci/calc.e16.ts:832  refuse()
  call refuse
.L22:
  ; sci/calc.e16.ts:833  return true
  li a0, 1
  j .return
.L1:
  ; sci/calc.e16.ts:835  if (k !== K_MPLUS || alpha) return false
  li t0, 37
  bne s1, t0, .L24
  beqz s3, .L23
.L24:
  ; sci/calc.e16.ts:835  return false
  li a0, 0
  j .return
.L23:
  ; sci/calc.e16.ts:836  memoryPlus(shift)
  mv a0, s2
  call memoryPlus
  ; sci/calc.e16.ts:837  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:841 tokenOf(k, shift) at -O1
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
  ; sci/calc.e16.ts:842  const plain = plainToken(k)
  mv a0, s1
  call plainToken
  mv s2, a0 ; plain
  ; sci/calc.e16.ts:843  return plain !== 0 ? plain : faceToken(k, shift)
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

; sci/calc.e16.ts:847 plainToken(k) at -O1
;   k in a0
plainToken:
  ; sci/calc.e16.ts:848  switch (k) {
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
  ; sci/calc.e16.ts:850  return 0x30
  li a0, 48
  ret
.L3:
  ; sci/calc.e16.ts:852  return 0x31
  li a0, 49
  ret
.L4:
  ; sci/calc.e16.ts:854  return 0x32
  li a0, 50
  ret
.L5:
  ; sci/calc.e16.ts:856  return 0x33
  li a0, 51
  ret
.L6:
  ; sci/calc.e16.ts:858  return 0x34
  li a0, 52
  ret
.L7:
  ; sci/calc.e16.ts:860  return 0x35
  li a0, 53
  ret
.L8:
  ; sci/calc.e16.ts:862  return 0x36
  li a0, 54
  ret
.L9:
  ; sci/calc.e16.ts:864  return 0x37
  li a0, 55
  ret
.L10:
  ; sci/calc.e16.ts:866  return 0x38
  li a0, 56
  ret
.L11:
  ; sci/calc.e16.ts:868  return 0x39
  li a0, 57
  ret
.L12:
  ; sci/calc.e16.ts:870  return T_POINT
  li a0, 46
  ret
.L13:
  ; sci/calc.e16.ts:872  return T_PLUS
  li a0, 43
  ret
.L14:
  ; sci/calc.e16.ts:874  return T_MINUS
  li a0, 45
  ret
.L15:
  ; sci/calc.e16.ts:876  return T_TIMES
  li a0, 129
  ret
.L16:
  ; sci/calc.e16.ts:878  return T_DIVIDE
  li a0, 130
  ret
.L17:
  ; sci/calc.e16.ts:880  return T_CLOSE
  li a0, 41
  ret
.L18:
  ; sci/calc.e16.ts:882  return T_ANS
  li a0, 20
  ret
.L1:
  ; sci/calc.e16.ts:884  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:888 faceToken(k, shift) at -O1
;   k in s1
;   shift in s2
faceToken:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift
  ; sci/calc.e16.ts:889  return shift ? shiftFace(k) : capToken(k)
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

; sci/calc.e16.ts:893 capToken(k) at -O1
;   k in a0
capToken:
  ; sci/calc.e16.ts:894  switch (k) {
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
  ; sci/calc.e16.ts:896  return T_OPEN
  li a0, 40
  ret
.L3:
  ; sci/calc.e16.ts:898  return T_NEG
  li a0, 16
  ret
.L4:
  ; sci/calc.e16.ts:900  return T_EXP
  li a0, 135
  ret
.L5:
  ; sci/calc.e16.ts:902  return T_SQUARE
  li a0, 132
  ret
.L6:
  ; sci/calc.e16.ts:904  return T_SQRT
  li a0, 9
  ret
.L7:
  ; sci/calc.e16.ts:906  return T_POW
  li a0, 17
  ret
.L8:
  ; sci/calc.e16.ts:908  return T_LOG
  li a0, 7
  ret
.L9:
  ; sci/calc.e16.ts:910  return T_LN
  li a0, 8
  ret
.L10:
  ; sci/calc.e16.ts:912  return T_SIN
  li a0, 1
  ret
.L11:
  ; sci/calc.e16.ts:914  return T_COS
  li a0, 2
  ret
.L12:
  ; sci/calc.e16.ts:916  return T_TAN
  li a0, 3
  ret
.L13:
  ; sci/calc.e16.ts:918  return T_INVERSE
  li a0, 134
  ret
.L14:
  ; sci/calc.e16.ts:920  return T_NCR
  li a0, 18
  ret
.L1:
  ; sci/calc.e16.ts:922  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:926 shiftFace(k) at -O1
;   k in a0
shiftFace:
  ; sci/calc.e16.ts:927  switch (k) {
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
  ; sci/calc.e16.ts:929  return T_ABS
  li a0, 230
  ret
.L3:
  ; sci/calc.e16.ts:931  return T_COMMA
  li a0, 44
  ret
.L4:
  ; sci/calc.e16.ts:933  return T_PI
  li a0, 128
  ret
.L5:
  ; sci/calc.e16.ts:935  return T_CUBE
  li a0, 133
  ret
.L6:
  ; sci/calc.e16.ts:937  return T_CBRT
  li a0, 10
  ret
.L7:
  ; sci/calc.e16.ts:939  return T_TEN
  li a0, 21
  ret
.L8:
  ; sci/calc.e16.ts:941  return T_E
  li a0, 101
  ret
.L9:
  ; sci/calc.e16.ts:943  return T_ASIN
  li a0, 4
  ret
.L10:
  ; sci/calc.e16.ts:945  return T_ACOS
  li a0, 5
  ret
.L11:
  ; sci/calc.e16.ts:947  return T_ATAN
  li a0, 6
  ret
.L12:
  ; sci/calc.e16.ts:949  return T_BANG
  li a0, 33
  ret
.L13:
  ; sci/calc.e16.ts:951  return T_NPR
  li a0, 19
  ret
.L1:
  ; sci/calc.e16.ts:953  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:957 hypToken(k, shift) at -O1
;   k in a0
;   shift in a1
hypToken:
  ; sci/calc.e16.ts:958  if (k === K_SIN) return shift ? T_ASINH : T_SINH
  li t0, 27
  bne a0, t0, .L1
  ; sci/calc.e16.ts:958  return shift ? T_ASINH : T_SINH
  beqz a1, .L2
  li t0, 227
  j .L3
.L2:
  li t0, 224
.L3:
  mv a0, t0
  ret
.L1:
  ; sci/calc.e16.ts:959  if (k === K_COS) return shift ? T_ACOSH : T_COSH
  li t0, 28
  bne a0, t0, .L4
  ; sci/calc.e16.ts:959  return shift ? T_ACOSH : T_COSH
  beqz a1, .L5
  li t0, 228
  j .L6
.L5:
  li t0, 225
.L6:
  mv a0, t0
  ret
.L4:
  ; sci/calc.e16.ts:960  if (k === K_TAN) return shift ? T_ATANH : T_TANH
  li t0, 29
  bne a0, t0, .L7
  ; sci/calc.e16.ts:960  return shift ? T_ATANH : T_TANH
  beqz a1, .L8
  li t0, 229
  j .L9
.L8:
  li t0, 226
.L9:
  mv a0, t0
  ret
.L7:
  ; sci/calc.e16.ts:961  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:965 letterOf(k) at -O1
;   k in a0
letterOf:
  ; sci/calc.e16.ts:966  switch (k) {
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
  ; sci/calc.e16.ts:968  return 0x41
  li a0, 65
  ret
.L3:
  ; sci/calc.e16.ts:970  return 0x42
  li a0, 66
  ret
.L4:
  ; sci/calc.e16.ts:972  return 0x43
  li a0, 67
  ret
.L5:
  ; sci/calc.e16.ts:974  return 0x44
  li a0, 68
  ret
.L6:
  ; sci/calc.e16.ts:976  return 0x45
  li a0, 69
  ret
.L7:
  ; sci/calc.e16.ts:978  return 0x46
  li a0, 70
  ret
.L8:
  ; sci/calc.e16.ts:980  return 0x58
  li a0, 88
  ret
.L9:
  ; sci/calc.e16.ts:982  return 0x59
  li a0, 89
  ret
.L10:
  ; sci/calc.e16.ts:984  return 0x4d
  li a0, 77
  ret
.L11:
  ; sci/calc.e16.ts:986  return T_E
  li a0, 101
  ret
.L1:
  ; sci/calc.e16.ts:988  return 0
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:992 fromAns(t) at -O1
;   t in a0
fromAns:
  ; sci/calc.e16.ts:993  return (
  li t0, 43
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L11
  li t0, 45
  sub t0, a0, t0
  seqz t0, t0
.L11:
  mv t1, t0
  bnez t1, .L10
  li t0, 129
  sub t0, a0, t0
  seqz t0, t0
.L10:
  mv t1, t0
  bnez t1, .L9
  li t0, 130
  sub t0, a0, t0
  seqz t0, t0
.L9:
  mv t1, t0
  bnez t1, .L8
  li t0, 17
  sub t0, a0, t0
  seqz t0, t0
.L8:
  mv t1, t0
  bnez t1, .L7
  li t0, 132
  sub t0, a0, t0
  seqz t0, t0
.L7:
  mv t1, t0
  bnez t1, .L6
  li t0, 133
  sub t0, a0, t0
  seqz t0, t0
.L6:
  mv t1, t0
  bnez t1, .L5
  li t0, 134
  sub t0, a0, t0
  seqz t0, t0
.L5:
  mv t1, t0
  bnez t1, .L4
  li t0, 33
  sub t0, a0, t0
  seqz t0, t0
.L4:
  mv t1, t0
  bnez t1, .L3
  li t0, 18
  sub t0, a0, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 19
  sub t0, a0, t0
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 238
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L12
  li t0, 241
  sltu t0, t0, a0
  xori t0, t0, 1
.L12:
.L1:
  mv a0, t0
.return:
  ret

; sci/calc.e16.ts:1010 type(t) at -O1
;   t in s1
type:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/calc.e16.ts:1011  if (answered) {
  lw t0, 0x055e(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:1012  answered = false
  sw zero, 0x055e(zero)
  ; sci/calc.e16.ts:1013  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x056e(zero)
  ; sci/calc.e16.ts:1014  length = 0
  sw zero, 0x055a(zero)
  ; sci/calc.e16.ts:1015  cursor = 0
  sw zero, 0x055c(zero)
  ; sci/calc.e16.ts:1016  if (fromAns(t)) insert(T_ANS)
  mv a0, s1
  call fromAns
  beqz a0, .L2
  ; sci/calc.e16.ts:1016  insert(T_ANS)
  li a0, 20
  call insert
.L2:
.L1:
  ; sci/calc.e16.ts:1018  insert(t)
  mv a0, s1
  call insert
  ; sci/calc.e16.ts:1019  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:1022 insert(t) at -O1
;   t in s1
insert:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/calc.e16.ts:1024  if (overwrite && cursor < length && overwritable(t) && overwritable(line[cursor])) {
  lw t0, 0x0568(zero)
  beqz t0, .L1
  lw t0, 0x055c(zero)
  lw t1, 0x055a(zero)
  bgeu t0, t1, .L1
  mv a0, s1
  call overwritable
  beqz a0, .L1
  lw t0, 0x055c(zero)
  lbu a0, line(t0)
  call overwritable
  beqz a0, .L1
  ; sci/calc.e16.ts:1025  line[cursor] = t
  lw t0, 0x055c(zero)
  sb s1, line(t0)
  ; sci/calc.e16.ts:1026  cursor++
  lw t0, 0x055c(zero)
  addi t0, t0, 1
  sw t0, 0x055c(zero)
  ; sci/calc.e16.ts:1027  return
  j .return
.L1:
  ; sci/calc.e16.ts:1029  if (length >= lineMax()) {
  lw t0, 0x055a(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  call lineMax
  lw t0, 0(sp)
  addi sp, sp, 2
  bltu t0, a0, .L2
  ; sci/calc.e16.ts:1030  refuse()
  call refuse
  ; sci/calc.e16.ts:1031  return
  j .return
.L2:
  ; sci/calc.e16.ts:1033  memcpy(addr(line) + cursor + 1, addr(line) + cursor, length - cursor)
  lw t0, 0x055c(zero)
  lw t1, 0x055c(zero)
  lw t2, 0x055a(zero)
  lw t3, 0x055c(zero)
  sub a2, t2, t3
  addi a0, t0, line+1
  addi a1, t1, line
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:1034  line[cursor] = t
  lw t0, 0x055c(zero)
  sb s1, line(t0)
  ; sci/calc.e16.ts:1035  length++
  lw t0, 0x055a(zero)
  addi t0, t0, 1
  sw t0, 0x055a(zero)
  ; sci/calc.e16.ts:1036  cursor++
  lw t0, 0x055c(zero)
  addi t0, t0, 1
  sw t0, 0x055c(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:1040 overwritable(t) at -O1
;   t in s1
overwritable:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/calc.e16.ts:1041  return !opensTemplate(t) && !isSeparator(t) && t !== T_END
  mv a0, s1
  call opensTemplate
  seqz t0, a0
  mv t1, t0
  beqz t1, .L2
  mv a0, s1
  call isSeparator
  seqz t0, a0
.L2:
  mv t1, t0
  beqz t1, .L1
  li t0, 24
  sub t0, s1, t0
  snez t0, t0
.L1:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:1044 deleteBefore() at -O1
deleteBefore:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:1045  if (answered) {
  lw t0, 0x055e(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:1046  answered = false
  sw zero, 0x055e(zero)
  ; sci/calc.e16.ts:1047  cursor = length
  lw t0, 0x055a(zero)
  sw t0, 0x055c(zero)
.L1:
  ; sci/calc.e16.ts:1049  deleteAt(addr(line), length, cursor)
  lw a1, 0x055a(zero)
  lw a2, 0x055c(zero)
  la a0, line
  la t0, deleteAt
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:1050  length = editLength
  lw t0, 0x0678(zero)
  sw t0, 0x055a(zero)
  ; sci/calc.e16.ts:1051  cursor = editCursor
  lw t0, 0x067a(zero)
  sw t0, 0x055c(zero)
  ; sci/calc.e16.ts:1052  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:1056 arrow(left) at -O1
;   left in s1
arrow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; left
  ; sci/calc.e16.ts:1057  if (answered) {
  lw t0, 0x055e(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:1058  answered = false
  sw zero, 0x055e(zero)
  ; sci/calc.e16.ts:1059  cursor = left ? length : 0
  beqz s1, .L2
  lw t0, 0x055a(zero)
  j .L3
.L2:
  li t0, 0
.L3:
  sw t0, 0x055c(zero)
  j .L4
.L1:
  ; sci/calc.e16.ts:1060  if (left) {
  beqz s1, .L5
  ; sci/calc.e16.ts:1061  cursor = cursor > 0 ? cursor - 1 : length
  lw t0, 0x055c(zero)
  bgeu zero, t0, .L6
  lw t0, 0x055c(zero)
  addi t0, t0, -1
  j .L7
.L6:
  lw t0, 0x055a(zero)
.L7:
  sw t0, 0x055c(zero)
  j .L8
.L5:
  ; sci/calc.e16.ts:1063  cursor = cursor < length ? cursor + 1 : 0
  lw t0, 0x055c(zero)
  lw t1, 0x055a(zero)
  bgeu t0, t1, .L9
  lw t0, 0x055c(zero)
  addi t0, t0, 1
  j .L10
.L9:
  li t0, 0
.L10:
  sw t0, 0x055c(zero)
.L8:
.L4:
  ; sci/calc.e16.ts:1065  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:1075 equals(approx) at -O1
;   approx in s2
;   made/first in s1
equals:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; approx
  ; sci/calc.e16.ts:1076  if (length === 0) return
  lw t0, 0x055a(zero)
  bne t0, zero, .L1
  ; sci/calc.e16.ts:1076  return
  j .return
.L1:
  ; sci/calc.e16.ts:1078  if (mode === MODE_CALC) {
  lw t0, 0x0490(zero)
  bne t0, zero, .L2
  ; sci/calc.e16.ts:1079  const made = withConstant(addr(line), length)
  lw a1, 0x055a(zero)
  la a0, line
  la t0, withConstant
  li t1, 10
  call far_call
  mv s1, a0 ; made/first
  ; sci/calc.e16.ts:1080  if (made !== 0xffff) {
  li t0, 65535
  beq s1, t0, .L3
  ; sci/calc.e16.ts:1081  length = made
  sw s1, 0x055a(zero)
  ; sci/calc.e16.ts:1082  cursor = made
  sw s1, 0x055c(zero)
.L3:
.L2:
  ; sci/calc.e16.ts:1085  clearStack()
  ; sci/numbers.e16.ts:234  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0468(zero)
  ; sci/calc.e16.ts:1086  if (mode === MODE_BASE) baseEvaluate(addr(line), length)
  lw t0, 0x0490(zero)
  li t1, 2
  bne t0, t1, .L4
  ; sci/calc.e16.ts:1086  baseEvaluate(addr(line), length)
  lw a1, 0x055a(zero)
  la a0, line
  la t0, baseEvaluate
  li t1, 8
  call far_call
  j .L5
.L4:
  ; sci/calc.e16.ts:1087  evaluate(addr(line), length)
  lw a1, 0x055a(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
.L5:
  ; sci/calc.e16.ts:1088  if (mode === MODE_CALC) noteConstant(addr(line), length)
  lw t0, 0x0490(zero)
  bne t0, zero, .L6
  ; sci/calc.e16.ts:1088  noteConstant(addr(line), length)
  lw a1, 0x055a(zero)
  la a0, line
  la t0, noteConstant
  li t1, 10
  call far_call
.L6:
  ; sci/calc.e16.ts:1089  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
  ; sci/calc.e16.ts:1090  remember()
  call remember
  ; sci/calc.e16.ts:1091  answered = true
  li t0, 1
  sw t0, 0x055e(zero)
  ; sci/calc.e16.ts:1092  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x056e(zero)
  ; sci/calc.e16.ts:1093  found = false
  sw zero, 0x056c(zero)
  ; sci/calc.e16.ts:1094  const first = line[0]
  lbu s1, line(zero)
  ; sci/calc.e16.ts:1095  if (first === T_POL || first === T_REC) shown = SHOW_PAIR
  li t0, 235
  beq s1, t0, .L8
  li t0, 236
  bne s1, t0, .L7
.L8:
  ; sci/calc.e16.ts:1095  shown = SHOW_PAIR
  li t0, 5
  sw t0, 0x0572(zero)
  j .L9
.L7:
  ; sci/calc.e16.ts:1096  shown = firstShown(formFirst(approx))
  mv a0, s2
  call formFirst
  la t0, firstShown
  li t1, 5
  call far_call
  sw a0, 0x0572(zero)
.L9:
  ; sci/calc.e16.ts:1097  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:1101 formFirst(approx) at -O1
;   approx in s1
formFirst:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; approx
  ; sci/calc.e16.ts:1102  return twoD() && !approx && peek(KEEP_ANSWER) === 0 && !decimalTyped()
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

; sci/calc.e16.ts:1106 tableRange() at -O1
tableRange:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:1107  if (length === 0) {
  lw t0, 0x055a(zero)
  bne t0, zero, .L1
  ; sci/calc.e16.ts:1108  refuse()
  call refuse
  ; sci/calc.e16.ts:1109  return
  j .return
.L1:
  ; sci/calc.e16.ts:1111  tableAskFrom()
  la t0, tableAskFrom
  li t1, 10
  call far_call
  ; sci/calc.e16.ts:1112  screen = S_ASK
  li t0, 5
  sw t0, 0x048e(zero)
  ; sci/calc.e16.ts:1113  askRange(0, rangeAt(0))
  li a0, 0
  li a1, 7368
  la t0, askRange
  li t1, 6
  call far_call
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:1117 solveKey(find) at -O1
;   find in s1
solveKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; find
  ; sci/calc.e16.ts:1118  if (answered) {
  lw t0, 0x055e(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:1119  answered = false
  sw zero, 0x055e(zero)
  ; sci/calc.e16.ts:1120  cursor = length
  lw t0, 0x055a(zero)
  sw t0, 0x055c(zero)
.L1:
  ; sci/calc.e16.ts:1122  if (length === 0) {
  lw t0, 0x055a(zero)
  bne t0, zero, .L2
  ; sci/calc.e16.ts:1123  refuse()
  call refuse
  ; sci/calc.e16.ts:1124  return
  j .return
.L2:
  ; sci/calc.e16.ts:1126  found = find
  sw s1, 0x056c(zero)
  ; sci/calc.e16.ts:1127  screen = S_ASK
  li t0, 5
  sw t0, 0x048e(zero)
  ; sci/calc.e16.ts:1128  askStart(addr(line), length, find)
  lw a1, 0x055a(zero)
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

; sci/calc.e16.ts:1132 decimalTyped() at -O1
;   i in a0
decimalTyped:
  ; sci/calc.e16.ts:1133  for (let i: u16 = 0; i < length; i++) {
  li a0, 0 ; i
  j .L3
.L1:
  ; sci/calc.e16.ts:1134  if (line[i] === T_POINT) return true
  lbu t0, line(a0)
  li t1, 46
  bne t0, t1, .L5
  ; sci/calc.e16.ts:1134  return true
  li a0, 1
  ret
.L5:
  addi a0, a0, 1
.L3:
  lw t0, 0x055a(zero)
  bltu a0, t0, .L1
  ; sci/calc.e16.ts:1136  return false
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:1143 exactOrDecimal(shift) at -O1
;   shift in s1
exactOrDecimal:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; shift
  ; sci/calc.e16.ts:1144  if (!answered || shown === SHOW_PAIR) {
  lw t0, 0x055e(zero)
  beqz t0, .L2
  lw t0, 0x0572(zero)
  li t1, 5
  bne t0, t1, .L1
.L2:
  ; sci/calc.e16.ts:1145  refuse()
  call refuse
  ; sci/calc.e16.ts:1146  return
  j .return
.L1:
  ; sci/calc.e16.ts:1148  if (shift) shown = SHOW_ENG
  beqz s1, .L3
  ; sci/calc.e16.ts:1148  shown = SHOW_ENG
  li t0, 3
  sw t0, 0x0572(zero)
  j .L4
.L3:
  ; sci/calc.e16.ts:1149  if (twoD() && hasForm()) shown = nextShown(shown)
  call twoD
  beqz a0, .L5
  la t0, hasForm
  li t1, 5
  call far_call
  beqz a0, .L5
  ; sci/calc.e16.ts:1149  shown = nextShown(shown)
  lw a0, 0x0572(zero)
  la t0, nextShown
  li t1, 5
  call far_call
  sw a0, 0x0572(zero)
  j .L6
.L5:
  ; sci/calc.e16.ts:1150  if (shown !== SHOW_DECIMAL && shown !== SHOW_FOUND) shown = SHOW_DECIMAL
  lw t0, 0x0572(zero)
  beq t0, zero, .L7
  lw t0, 0x0572(zero)
  li t1, 6
  beq t0, t1, .L7
  ; sci/calc.e16.ts:1150  shown = SHOW_DECIMAL
  sw zero, 0x0572(zero)
  j .L8
.L7:
  ; sci/calc.e16.ts:1152  refuse()
  call refuse
  ; sci/calc.e16.ts:1153  return
  j .return
.L8:
.L6:
.L4:
  ; sci/calc.e16.ts:1155  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:1159 variableKey(k/letter) at -O1
;   k/letter in s1
;   store in s2
variableKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/letter
  ; sci/calc.e16.ts:1160  const store = storing
  lw s2, 0x0564(zero)
  ; sci/calc.e16.ts:1161  storing = false
  sw zero, 0x0564(zero)
  ; sci/calc.e16.ts:1162  recalling = false
  sw zero, 0x0566(zero)
  ; sci/calc.e16.ts:1163  const letter = letterOf(k)
  mv a0, s1
  call letterOf
  mv s1, a0 ; k/letter
  ; sci/calc.e16.ts:1164  if (letter === 0 || letter === T_E) {
  beq s1, zero, .L2
  li t0, 101
  bne s1, t0, .L1
.L2:
  ; sci/calc.e16.ts:1165  refuse()
  call refuse
  ; sci/calc.e16.ts:1166  return
  j .return
.L1:
  ; sci/calc.e16.ts:1168  if (store) {
  beqz s2, .L3
  ; sci/calc.e16.ts:1169  if (!answered && length > 0) {
  lw t0, 0x055e(zero)
  bnez t0, .L4
  lw t0, 0x055a(zero)
  bgeu zero, t0, .L4
  ; sci/calc.e16.ts:1170  clearStack()
  ; sci/numbers.e16.ts:234  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0468(zero)
  ; sci/calc.e16.ts:1171  evaluate(addr(line), length)
  lw a1, 0x055a(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/calc.e16.ts:1172  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
  ; sci/calc.e16.ts:1173  remember()
  call remember
.L4:
  ; sci/calc.e16.ts:1175  copyValue(KEEP_ANS, varAt(letter))
  mv a0, s1
  call varAt
  mv a1, a0
  li a0, 3080
  call copyValue
  j .L5
.L3:
  ; sci/calc.e16.ts:1177  copyValue(varAt(letter), KEEP_ANS)
  mv a0, s1
  call varAt
  li a1, 3080
  call copyValue
.L5:
  ; sci/calc.e16.ts:1179  shown = firstShown(formFirst(false))
  li a0, 0
  call formFirst
  la t0, firstShown
  li t1, 5
  call far_call
  sw a0, 0x0572(zero)
  ; sci/calc.e16.ts:1180  found = false
  sw zero, 0x056c(zero)
  ; sci/calc.e16.ts:1181  length = 0
  sw zero, 0x055a(zero)
  ; sci/calc.e16.ts:1182  cursor = 0
  sw zero, 0x055c(zero)
  ; sci/calc.e16.ts:1183  insert(T_ANS)
  li a0, 20
  call insert
  ; sci/calc.e16.ts:1184  answered = true
  li t0, 1
  sw t0, 0x055e(zero)
  ; sci/calc.e16.ts:1185  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:1189 memoryPlus(minus/op) at -O1
;   minus/op in s1
;   m in s2
memoryPlus:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; minus/op
  ; sci/calc.e16.ts:1190  if (!answered) {
  lw t0, 0x055e(zero)
  bnez t0, .L1
  ; sci/calc.e16.ts:1191  if (length === 0) {
  lw t0, 0x055a(zero)
  bne t0, zero, .L2
  ; sci/calc.e16.ts:1192  length = 0
  sw zero, 0x055a(zero)
  ; sci/calc.e16.ts:1193  insert(T_ANS)
  li a0, 20
  call insert
.L2:
  ; sci/calc.e16.ts:1195  clearStack()
  ; sci/numbers.e16.ts:234  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0468(zero)
  ; sci/calc.e16.ts:1196  evaluate(addr(line), length)
  lw a1, 0x055a(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/calc.e16.ts:1197  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
  ; sci/calc.e16.ts:1198  remember()
  call remember
.L1:
  ; sci/calc.e16.ts:1200  const m = varAt(0x4d)
  li s2, 3408 ; m
  ; sci/calc.e16.ts:1201  const op = minus ? M_SUB : M_ADD
  beqz s1, .L3
  li t0, 2
  j .L4
.L3:
  li t0, 1
.L4:
  mv s1, t0 ; minus/op
  ; sci/calc.e16.ts:1202  math(op, m, KEEP_ANS, 0)
  mv a0, s1
  mv a1, s2
  li a2, 3080
  li a3, 0
  call math
  ; sci/calc.e16.ts:1203  exactBinary(op, m, KEEP_ANS)
  mv a0, s1
  mv a1, s2
  li a2, 3080
  la t0, exactBinary
  li t1, 2
  call far_call
  ; sci/calc.e16.ts:1204  answered = true
  li t0, 1
  sw t0, 0x055e(zero)
  ; sci/calc.e16.ts:1205  shown = firstShown(formFirst(false))
  li a0, 0
  call formFirst
  la t0, firstShown
  li t1, 5
  call far_call
  sw a0, 0x0572(zero)
  ; sci/calc.e16.ts:1206  found = false
  sw zero, 0x056c(zero)
  ; sci/calc.e16.ts:1207  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:1213 remember() at -O1
;   entries/kept in s1
;   at in s2
;   size in s3
;   count in s0
remember:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  ; sci/calc.e16.ts:1214  const entries = historyEntries()
  call historyEntries
  mv s1, a0 ; entries/kept
  ; sci/calc.e16.ts:1215  if (entries === 0) return
  bne s1, zero, .L1
  ; sci/calc.e16.ts:1215  return
  j .return
.L1:
  ; sci/calc.e16.ts:1216  const at = historyAt_()
  call historyAt_
  mv s2, a0 ; at
  ; sci/calc.e16.ts:1217  const size = historySize()
  call historySize
  mv s3, a0 ; size
  ; sci/calc.e16.ts:1218  const count = peek16(historyCount())
  call historyCount
  lw s0, 0(a0)
  ; sci/calc.e16.ts:1219  const kept = count < entries ? count : entries - 1
  bgeu s0, s1, .L2
  mv t0, s0
  j .L3
.L2:
  addi t0, s1, -1
.L3:
  mv s1, t0 ; entries/kept
  ; sci/calc.e16.ts:1220  memcpy(at + size, at, kept * size)
  add a0, s2, s3
  mul a2, s1, s3
  mv a1, s2
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:1221  poke(at, length)
  lw t0, 0x055a(zero)
  sb t0, 0(s2)
  ; sci/calc.e16.ts:1222  memcpy(at + 1, addr(line), length)
  lw a2, 0x055a(zero)
  addi a0, s2, 1
  la a1, line
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:1223  poke16(historyCount(), kept + 1)
  call historyCount
  addi t0, s1, 1
  sw t0, 0(a0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/calc.e16.ts:1228 historyEntries() at -O1
historyEntries:
  ; sci/calc.e16.ts:1229  if (mode === MODE_CALC) return HISTORY_ENTRIES
  lw t0, 0x0490(zero)
  bne t0, zero, .L1
  ; sci/calc.e16.ts:1229  return HISTORY_ENTRIES
  li a0, 10
  ret
.L1:
  ; sci/calc.e16.ts:1230  return mode === MODE_BASE ? 5 : 0
  lw t0, 0x0490(zero)
  li t1, 2
  bne t0, t1, .L2
  li t0, 5
  j .L3
.L2:
  li t0, 0
.L3:
  mv a0, t0
.return:
  ret

; sci/calc.e16.ts:1233 historyAt_() at -O1
historyAt_:
  ; sci/calc.e16.ts:1234  return mode === MODE_BASE ? BASE_HISTORY : KEEP_HISTORY
  lw t0, 0x0490(zero)
  li t1, 2
  bne t0, t1, .L1
  li t0, 6658
  j .L2
.L1:
  li t0, 3458
.L2:
  mv a0, t0
.return:
  ret

; sci/calc.e16.ts:1237 historySize() at -O1
historySize:
  ; sci/calc.e16.ts:1238  return mode === MODE_BASE ? 100 : HISTORY_SIZE
  lw t0, 0x0490(zero)
  li t1, 2
  bne t0, t1, .L1
  li t0, 100
  j .L2
.L1:
  li t0, 200
.L2:
  mv a0, t0
.return:
  ret

; sci/calc.e16.ts:1241 historyCount() at -O1
historyCount:
  ; sci/calc.e16.ts:1242  return mode === MODE_BASE ? BASE_HISTORY_COUNT : KEEP_HISTORY_COUNT
  lw t0, 0x0490(zero)
  li t1, 2
  bne t0, t1, .L1
  li t0, 6656
  j .L2
.L1:
  li t0, 3456
.L2:
  mv a0, t0
.return:
  ret

; sci/calc.e16.ts:1249 history(older/entry) at -O1
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
  ; sci/calc.e16.ts:1250  if (!answered && twoD()) {
  lw t0, 0x055e(zero)
  bnez t0, .L1
  call twoD
  beqz a0, .L1
  ; sci/calc.e16.ts:1251  vertical(addr(line), length, cursor, older)
  lw a1, 0x055a(zero)
  lw a2, 0x055c(zero)
  la a0, line
  mv a3, s1
  la t0, vertical
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:1252  if (editCursor !== 0xffff) {
  lw t0, 0x067a(zero)
  li t1, 65535
  beq t0, t1, .L2
  ; sci/calc.e16.ts:1253  cursor = editCursor
  lw t0, 0x067a(zero)
  sw t0, 0x055c(zero)
  ; sci/calc.e16.ts:1254  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:1255  return
  j .return
.L2:
.L1:
  ; sci/calc.e16.ts:1258  const count = historyEntries() === 0 ? 0 : peek16(historyCount())
  call historyEntries
  bne a0, zero, .L3
  li t0, 0
  j .L4
.L3:
  call historyCount
  lw t0, 0(a0)
.L4:
  mv s0, t0 ; count
  ; sci/calc.e16.ts:1259  const browsing = historyAt !== 0xffff
  lw t0, 0x056e(zero)
  li t1, 65535
  sub t0, t0, t1
  snez s3, t0
  ; sci/calc.e16.ts:1260  if (!answered && length > 0 && !browsing) return
  lw t0, 0x055e(zero)
  bnez t0, .L5
  lw t0, 0x055a(zero)
  bgeu zero, t0, .L5
  bnez s3, .L5
  ; sci/calc.e16.ts:1260  return
  j .return
.L5:
  ; sci/calc.e16.ts:1261  let next = historyAt
  lw s2, 0x056e(zero)
  ; sci/calc.e16.ts:1262  if (older) next = browsing ? historyAt + 1 : 0
  beqz s1, .L6
  ; sci/calc.e16.ts:1262  next = browsing ? historyAt + 1 : 0
  beqz s3, .L7
  lw t0, 0x056e(zero)
  addi t0, t0, 1
  j .L8
.L7:
  li t0, 0
.L8:
  mv s2, t0 ; next
  j .L9
.L6:
  ; sci/calc.e16.ts:1263  if (browsing && historyAt > 0) next = historyAt - 1
  beqz s3, .L10
  lw t0, 0x056e(zero)
  bgeu zero, t0, .L10
  ; sci/calc.e16.ts:1263  next = historyAt - 1
  lw t0, 0x056e(zero)
  addi s2, t0, -1
  j .L11
.L10:
  ; sci/calc.e16.ts:1264  return
  j .return
.L11:
.L9:
  ; sci/calc.e16.ts:1265  if (next >= count) return
  bltu s2, s0, .L12
  ; sci/calc.e16.ts:1265  return
  j .return
.L12:
  ; sci/calc.e16.ts:1266  historyAt = next
  sw s2, 0x056e(zero)
  ; sci/calc.e16.ts:1267  const entry = historyAt_() + next * historySize()
  call historyAt_
  addi sp, sp, -2
  sw a0, 0(sp)
  call historySize
  mul t0, s2, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  add s1, t1, t0
  ; sci/calc.e16.ts:1268  length = peek(entry)
  lbu t0, 0(s1)
  sw t0, 0x055a(zero)
  ; sci/calc.e16.ts:1269  memcpy(addr(line), entry + 1, length)
  lw a2, 0x055a(zero)
  la a0, line
  addi a1, s1, 1
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:1270  cursor = length
  lw t0, 0x055a(zero)
  sw t0, 0x055c(zero)
  ; sci/calc.e16.ts:1271  answered = false
  sw zero, 0x055e(zero)
  ; sci/calc.e16.ts:1272  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/calc.e16.ts:1278 drawMarks() at -O1
;   bits in s1
;   angle/format in s2
drawMarks:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/calc.e16.ts:1279  let bits: u16 = 0
  li s1, 0 ; bits
  ; sci/calc.e16.ts:1280  if (shifted) bits |= ANN_S
  lw t0, 0x0560(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:1280  bits |= ANN_S
  ori s1, s1, 2
.L1:
  ; sci/calc.e16.ts:1281  if (alphaOn || storing || recalling) bits |= ANN_A
  lw t0, 0x0562(zero)
  bnez t0, .L3
  lw t0, 0x0564(zero)
  bnez t0, .L3
  lw t0, 0x0566(zero)
  beqz t0, .L2
.L3:
  ; sci/calc.e16.ts:1281  bits |= ANN_A
  ori s1, s1, 4
.L2:
  ; sci/calc.e16.ts:1282  if (storing) bits |= ANN_STO
  lw t0, 0x0564(zero)
  beqz t0, .L4
  ; sci/calc.e16.ts:1282  bits |= ANN_STO
  ori s1, s1, 16
.L4:
  ; sci/calc.e16.ts:1283  if (peek(varAt(0x4d) + 2) !== 0) bits |= ANN_M
  lbu t0, 3410(zero)
  beq t0, zero, .L5
  ; sci/calc.e16.ts:1283  bits |= ANN_M
  ori s1, s1, 8
.L5:
  ; sci/calc.e16.ts:1284  const angle = peek(KEEP_ANGLE)
  lbu s2, 3074(zero)
  ; sci/calc.e16.ts:1285  bits |= angle === 1 ? ANN_R : angle === 2 ? ANN_G : ANN_D
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
  ; sci/calc.e16.ts:1286  if (twoD()) bits |= ANN_2D
  call twoD
  beqz a0, .L10
  ; sci/calc.e16.ts:1286  bits |= ANN_2D
  ori s1, s1, 4096
.L10:
  ; sci/calc.e16.ts:1287  if (mode === MODE_STATS) bits |= ANN_STAT
  lw t0, 0x0490(zero)
  li t1, 1
  bne t0, t1, .L11
  ; sci/calc.e16.ts:1287  bits |= ANN_STAT
  ori s1, s1, 64
.L11:
  ; sci/calc.e16.ts:1288  if (hyp) bits |= ANN_HYP
  lw t0, 0x056a(zero)
  beqz t0, .L12
  ; sci/calc.e16.ts:1288  bits |= ANN_HYP
  ori s1, s1, 32
.L12:
  ; sci/calc.e16.ts:1289  const format = peek(KEEP_FORMAT)
  lbu s2, 3077(zero)
  ; sci/calc.e16.ts:1290  if (format === FORMAT_FIX) bits |= ANN_FIX
  li t0, 1
  bne s2, t0, .L13
  ; sci/calc.e16.ts:1290  bits |= ANN_FIX
  ori s1, s1, 1024
  j .L14
.L13:
  ; sci/calc.e16.ts:1291  if (format === FORMAT_EXP) bits |= ANN_EXP
  li t0, 2
  bne s2, t0, .L15
  ; sci/calc.e16.ts:1291  bits |= ANN_EXP
  ori s1, s1, 2048
.L15:
.L14:
  ; sci/calc.e16.ts:1292  if (screen === S_CALC) bits |= historyMarks()
  lw t0, 0x048e(zero)
  bne t0, zero, .L16
  ; sci/calc.e16.ts:1292  bits |= historyMarks()
  call historyMarks
  or s1, s1, a0
.L16:
  ; sci/calc.e16.ts:1293  marks(bits)
  ; sci/lcd.e16.ts:171  poke16(IO_ANNUNCIATORS, bits)
  li t0, 65326
  sw s1, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:1297 historyMarks() at -O1
;   count in s2
;   browsing in s3
;   bits in s1
historyMarks:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; sci/calc.e16.ts:1298  const count = historyEntries() === 0 ? 0 : peek16(historyCount())
  call historyEntries
  bne a0, zero, .L1
  li t0, 0
  j .L2
.L1:
  call historyCount
  lw t0, 0(a0)
.L2:
  mv s2, t0 ; count
  ; sci/calc.e16.ts:1299  const browsing = historyAt !== 0xffff
  lw t0, 0x056e(zero)
  li t1, 65535
  sub t0, t0, t1
  snez s3, t0
  ; sci/calc.e16.ts:1300  let bits: u16 = 0
  li s1, 0 ; bits
  ; sci/calc.e16.ts:1301  if (browsing ? historyAt + 1 < count : count > 0 && (answered || length === 0)) bits |= ANN_UP
  beqz s3, .L4
  lw t0, 0x056e(zero)
  addi t0, t0, 1
  sltu t0, t0, s2
  j .L5
.L4:
  sltu t0, zero, s2
  mv t1, t0
  beqz t1, .L6
  lw t0, 0x055e(zero)
  mv t1, t0
  bnez t1, .L7
  lw t0, 0x055a(zero)
  sub t0, t0, zero
  seqz t0, t0
.L7:
.L6:
.L5:
  beqz t0, .L3
  ; sci/calc.e16.ts:1301  bits |= ANN_UP
  li t0, 8192
  or s1, s1, t0
.L3:
  ; sci/calc.e16.ts:1302  if (browsing && historyAt > 0) bits |= ANN_DOWN
  beqz s3, .L8
  lw t0, 0x056e(zero)
  bgeu zero, t0, .L8
  ; sci/calc.e16.ts:1302  bits |= ANN_DOWN
  li t0, 16384
  or s1, s1, t0
.L8:
  ; sci/calc.e16.ts:1303  return bits
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:1307 footMarks() at -O1
footMarks:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:1308  if (answered && mode === MODE_CALC && constantKept()) textAt(str('K'), 1, 56)
  lw t0, 0x055e(zero)
  beqz t0, .L1
  lw t0, 0x0490(zero)
  bne t0, zero, .L1
  la t0, constantKept
  li t1, 10
  call far_call
  beqz a0, .L1
  ; sci/calc.e16.ts:1308  textAt(str('K'), 1, 56)
  la a0, str_66
  li a1, 1
  li a2, 56
  call textAt
.L1:
  ; sci/calc.e16.ts:1309  if (!answered && overwrite) textAt(str('OVR'), 1, 56)
  lw t0, 0x055e(zero)
  bnez t0, .L2
  lw t0, 0x0568(zero)
  beqz t0, .L2
  ; sci/calc.e16.ts:1309  textAt(str('OVR'), 1, 56)
  la a0, str_67
  li a1, 1
  li a2, 56
  call textAt
.L2:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:1313 drawCalc() at -O1
drawCalc:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:1314  if (mode === MODE_BASE) {
  lw t0, 0x0490(zero)
  li t1, 2
  bne t0, t1, .L1
  ; sci/calc.e16.ts:1315  baseDraw()
  la t0, baseDraw
  li t1, 8
  call far_call
  ; sci/calc.e16.ts:1316  drawMarks()
  call drawMarks
  ; sci/calc.e16.ts:1317  return
  j .return
.L1:
  ; sci/calc.e16.ts:1319  if (ownScreen() || (mode === MODE_TABLE && tablePhase() === TABLE_VIEW)) {
  call ownScreen
  bnez a0, .L3
  lw t0, 0x0490(zero)
  li t1, 3
  bne t0, t1, .L2
  la t0, tablePhase
  li t1, 10
  call far_call
  li t0, 2
  bne a0, t0, .L2
.L3:
  ; sci/calc.e16.ts:1320  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:1321  if (mode === MODE_STATS) statsDraw()
  lw t0, 0x0490(zero)
  li t1, 1
  bne t0, t1, .L4
  ; sci/calc.e16.ts:1321  statsDraw()
  la t0, statsDraw
  li t1, 7
  call far_call
  j .L5
.L4:
  ; sci/calc.e16.ts:1322  if (mode === MODE_EQN) eqnDraw()
  lw t0, 0x0490(zero)
  li t1, 4
  bne t0, t1, .L6
  ; sci/calc.e16.ts:1322  eqnDraw()
  la t0, eqnDraw
  li t1, 11
  call far_call
  j .L7
.L6:
  ; sci/calc.e16.ts:1323  tableDraw()
  la t0, tableDraw
  li t1, 10
  call far_call
.L7:
.L5:
  ; sci/calc.e16.ts:1324  drawMarks()
  call drawMarks
  ; sci/calc.e16.ts:1325  return
  j .return
.L2:
  ; sci/calc.e16.ts:1327  cls()
  call cls
  ; sci/calc.e16.ts:1328  if (twoD()) drawLine2D()
  call twoD
  beqz a0, .L8
  ; sci/calc.e16.ts:1328  drawLine2D()
  call drawLine2D
  j .L9
.L8:
  ; sci/calc.e16.ts:1329  drawLine()
  call drawLine
.L9:
  ; sci/calc.e16.ts:1330  if (answered) drawAnswerAs(shown)
  lw t0, 0x055e(zero)
  beqz t0, .L10
  ; sci/calc.e16.ts:1330  drawAnswerAs(shown)
  lw a0, 0x0572(zero)
  la t0, drawAnswerAs
  li t1, 5
  call far_call
.L10:
  ; sci/calc.e16.ts:1331  footMarks()
  call footMarks
  ; sci/calc.e16.ts:1332  if (mode === MODE_TABLE) {
  lw t0, 0x0490(zero)
  li t1, 3
  bne t0, t1, .L11
  ; sci/calc.e16.ts:1333  textAt(str('TABLE f(X)'), 1, 47)
  la a0, str_68
  li a1, 1
  li a2, 47
  call textAt
  ; sci/calc.e16.ts:1334  textAt(str('=:START,END,STEP'), 1, 56)
  la a0, str_69
  li a1, 1
  li a2, 56
  call textAt
.L11:
  ; sci/calc.e16.ts:1336  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:1340 drawLine2D() at -O1
drawLine2D:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:1341  setLine(addr(line), length, answered ? 0xffff : cursor)
  lw t1, 0x055a(zero)
  lw t2, 0x055e(zero)
  la t0, line
  beqz t2, .L1
  li t2, 65535
  j .L2
.L1:
  lw t2, 0x055c(zero)
.L2:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  la t0, setLine
  li t1, 3
  call far_call
  ; sci/calc.e16.ts:1342  if (answered) noCursor()
  lw t0, 0x055e(zero)
  beqz t0, .L3
  ; sci/calc.e16.ts:1342  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  j .L4
.L3:
  ; sci/calc.e16.ts:1343  barDots(cursorX, cursorTop)
  lw a0, 0x0670(zero)
  lw a1, 0x0672(zero)
  call barDots
.L4:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:1347 charsTo(n) at -O1
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
  ; sci/calc.e16.ts:1348  let c: u16 = 0
  li s2, 0 ; c
  ; sci/calc.e16.ts:1349  for (let i: u16 = 0; i < n; i++) c += tokenWidth(line[i])
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/calc.e16.ts:1349  c += tokenWidth(line[i])
  lbu a0, line(s1)
  call tokenWidth
  add s2, s2, a0
  addi s1, s1, 1
.L3:
  bltu s1, s3, .L1
  ; sci/calc.e16.ts:1350  return c
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:1357 drawLine() at -O1
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
  ; sci/calc.e16.ts:1358  const at = charsTo(cursor)
  lw a0, 0x055c(zero)
  call charsTo
  mv s1, a0 ; at
  ; sci/calc.e16.ts:1359  if (at < scrollFrom) scrollFrom = at - (at % COLS)
  lw t0, 0x0570(zero)
  bgeu s1, t0, .L1
  ; sci/calc.e16.ts:1359  scrollFrom = at - (at % COLS)
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
  sw t0, 0x0570(zero)
.L1:
  ; sci/calc.e16.ts:1360  if (at >= scrollFrom + LINE_CHARS) scrollFrom = at - (at % COLS) - (LINE_ROWS - 1) * COLS
  lw t0, 0x0570(zero)
  addi t0, t0, 84
  bltu s1, t0, .L2
  ; sci/calc.e16.ts:1360  scrollFrom = at - (at % COLS) - (LINE_ROWS - 1) * COLS
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
  sw t0, 0x0570(zero)
.L2:
  ; sci/calc.e16.ts:1361  let c: u16 = 0
  li s0, 0 ; c
  ; sci/calc.e16.ts:1362  for (let i: u16 = 0; i < length; i++) {
  li s2, 0 ; i/shown
  j .L5
.L3:
  ; sci/calc.e16.ts:1363  const t = line[i]
  lbu t0, line(s2)
  sw t0, 0(sp) ; t
  ; sci/calc.e16.ts:1364  const text = tokenText(t)
  lw a0, 0(sp)
  call tokenText
  mv s3, a0 ; text/p
  ; sci/calc.e16.ts:1365  if (text === 0) {
  bne s3, zero, .L7
  ; sci/calc.e16.ts:1366  showChar(t, c)
  lw a0, 0(sp)
  mv a1, s0
  call showChar
  ; sci/calc.e16.ts:1367  c++
  addi s0, s0, 1
  j .L8
.L7:
  ; sci/calc.e16.ts:1369  let p = text
  ; sci/calc.e16.ts:1370  while (peek(p) !== 0) {
  j .L11
.L9:
  ; sci/calc.e16.ts:1371  showChar(peek(p), c)
  lbu a0, 0(s3)
  mv a1, s0
  call showChar
  ; sci/calc.e16.ts:1372  c++
  addi s0, s0, 1
  ; sci/calc.e16.ts:1373  p++
  addi s3, s3, 1
.L11:
  lbu t0, 0(s3)
  bne t0, zero, .L9
.L8:
  addi s2, s2, 1
.L5:
  lw t0, 0x055a(zero)
  bltu s2, t0, .L3
  ; sci/calc.e16.ts:1377  if (answered) {
  lw t0, 0x055e(zero)
  beqz t0, .L13
  ; sci/calc.e16.ts:1378  noCursor()
  ; sci/lcd.e16.ts:167  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:1379  return
  j .return
.L13:
  ; sci/calc.e16.ts:1381  const shown = at - scrollFrom
  lw t0, 0x0570(zero)
  sub s2, s1, t0
  ; sci/calc.e16.ts:1382  barAt(shown % COLS, div(shown, COLS))
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

; sci/calc.e16.ts:1386 showChar(ch, c/shown) at -O1
;   ch in s2
;   c/shown in s1
showChar:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; ch
  mv s1, a1 ; c/shown
  ; sci/calc.e16.ts:1387  if (c < scrollFrom || c >= scrollFrom + LINE_CHARS) return
  lw t0, 0x0570(zero)
  bltu s1, t0, .L2
  lw t0, 0x0570(zero)
  addi t0, t0, 84
  bltu s1, t0, .L1
.L2:
  ; sci/calc.e16.ts:1387  return
  j .return
.L1:
  ; sci/calc.e16.ts:1388  const shown = c - scrollFrom
  lw t0, 0x0570(zero)
  sub s1, s1, t0
  ; sci/calc.e16.ts:1389  drawChar(ch, shown % COLS, div(shown, COLS))
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
  .byte 100, 105, 99, 101, 0
str_21:
  .byte 99, 111, 105, 110, 0
str_22:
  .byte 114, 105, 110, 116, 0
str_23:
  .byte 32, 0
str_24:
  .byte 41, 131, 40, 0
str_25:
  .byte 115, 105, 110, 104, 40, 0
str_26:
  .byte 99, 111, 115, 104, 40, 0
str_27:
  .byte 116, 97, 110, 104, 40, 0
str_28:
  .byte 115, 105, 110, 104, 134, 40, 0
str_29:
  .byte 99, 111, 115, 104, 134, 40, 0
str_30:
  .byte 116, 97, 110, 104, 134, 40, 0
str_31:
  .byte 97, 98, 115, 40, 0
str_32:
  .byte 103, 99, 100, 40, 0
str_33:
  .byte 108, 99, 109, 40, 0
str_34:
  .byte 105, 110, 116, 40, 0
str_35:
  .byte 114, 111, 117, 110, 100, 40, 0
str_36:
  .byte 112, 111, 108, 40, 0
str_37:
  .byte 114, 101, 99, 40, 0
str_38:
  .byte 114, 97, 110, 100, 0
str_39:
  .byte 32, 65, 78, 68, 32, 0
str_40:
  .byte 32, 79, 82, 32, 0
str_41:
  .byte 32, 88, 79, 82, 32, 0
str_42:
  .byte 32, 88, 78, 79, 82, 32, 0
str_43:
  .byte 110, 111, 116, 40, 0
str_44:
  .byte 110, 101, 103, 40, 0
str_45:
  .byte 120, 137, 40, 0
str_46:
  .byte 121, 137, 40, 0
str_47:
  .byte 120, 147, 137, 40, 0
str_48:
  .byte 110, 0
str_49:
  .byte 149, 0
str_50:
  .byte 145, 120, 0
str_51:
  .byte 115, 120, 0
str_52:
  .byte 150, 0
str_53:
  .byte 145, 121, 0
str_54:
  .byte 115, 121, 0
str_55:
  .byte 144, 120, 0
str_56:
  .byte 144, 120, 132, 0
str_57:
  .byte 144, 121, 0
str_58:
  .byte 144, 121, 132, 0
str_59:
  .byte 144, 120, 121, 0
str_60:
  .byte 114, 0
str_61:
  .byte 97, 0
str_62:
  .byte 99, 0
str_63:
  .byte 98, 0
str_64:
  .byte 69, 76, 69, 67, 45, 49, 54, 32, 83, 67, 73, 0
str_65:
  .byte 83, 67, 73, 45, 49, 50, 56, 0
str_66:
  .byte 75, 0
str_67:
  .byte 79, 86, 82, 0
str_68:
  .byte 84, 65, 66, 76, 69, 32, 102, 40, 88, 41, 0
str_69:
  .byte 61, 58, 83, 84, 65, 82, 84, 44, 69, 78, 68, 44, 83, 84, 69, 80, 0
  .align 2
e16c_fixed_end:

  .bank 0
  .org 0xc000
; sci/eval.e16.ts:170 tok() at -O1
tok:
  ; sci/eval.e16.ts:171  return pos < lineLength ? peek(lineAt + pos) : 0
  lw t0, 0x0578(zero)
  lw t1, 0x0576(zero)
  bgeu t0, t1, .L1
  lw t0, 0x0574(zero)
  lw t1, 0x0578(zero)
  add t0, t0, t1
  lbu t0, 0(t0)
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
.return:
  ret

; sci/eval.e16.ts:178 evaluate(at, length) at -O1
;   at in s2
;   length in s1
evaluate:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; at
  mv s1, a1 ; length
  ; sci/eval.e16.ts:179  lineAt = at
  sw s2, 0x0574(zero)
  ; sci/eval.e16.ts:180  lineLength = length
  sw s1, 0x0576(zero)
  ; sci/eval.e16.ts:181  pos = 0
  sw zero, 0x0578(zero)
  ; sci/eval.e16.ts:182  percentEnd = 0xffff
  li t0, 65535
  sw t0, 0x057a(zero)
  ; sci/eval.e16.ts:183  poke16(MATH_ANGLE, peek(KEEP_ANGLE))
  lbu t0, 3074(zero)
  li t1, 65372
  sw t0, 0(t1)
  ; sci/eval.e16.ts:184  if (length === 0) fail(E_SYNTAX, 0)
  bne s1, zero, .L1
  ; sci/eval.e16.ts:184  fail(E_SYNTAX, 0)
  li a0, 2
  li a1, 0
  call fail
.L1:
  ; sci/eval.e16.ts:185  sum()
  call sum
  ; sci/eval.e16.ts:186  if (pos < lineLength) fail(E_SYNTAX, pos)
  lw t0, 0x0578(zero)
  lw t1, 0x0576(zero)
  bgeu t0, t1, .L2
  ; sci/eval.e16.ts:186  fail(E_SYNTAX, pos)
  lw a1, 0x0578(zero)
  li a0, 2
  call fail
.L2:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:189 sum() at -O1
;   t in s1
;   at in s2
sum:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:190  prod()
  call prod
  ; sci/eval.e16.ts:191  for (;;) {
.L1:
  ; sci/eval.e16.ts:192  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:193  if (t !== T_PLUS && t !== T_MINUS) return
  li t0, 43
  beq s1, t0, .L5
  li t0, 45
  beq s1, t0, .L5
  ; sci/eval.e16.ts:193  return
  j .return
.L5:
  ; sci/eval.e16.ts:194  const at = pos
  lw s2, 0x0578(zero)
  ; sci/eval.e16.ts:195  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
  ; sci/eval.e16.ts:196  prod()
  call prod
  ; sci/eval.e16.ts:197  if (percentEnd === pos) ofLeft(at)
  lw t0, 0x057a(zero)
  lw t1, 0x0578(zero)
  bne t0, t1, .L6
  ; sci/eval.e16.ts:197  ofLeft(at)
  mv a0, s2
  call ofLeft
.L6:
  ; sci/eval.e16.ts:198  binary(t === T_PLUS ? M_ADD : M_SUB, at)
  li t0, 43
  bne s1, t0, .L7
  li t0, 1
  j .L8
.L7:
  li t0, 2
.L8:
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

; sci/eval.e16.ts:207 ofLeft(at) at -O1
;   at in s1
ofLeft:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; sci/eval.e16.ts:208  copyValue(top() - VALUE_SIZE, push(at))
  call top
  addi a0, a0, -36
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  call push
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copyValue
  ; sci/eval.e16.ts:209  binary(M_MUL, at)
  li a0, 3
  mv a1, s1
  call binary
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:212 prod() at -O1
;   t in s1
;   at in s2
prod:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:213  implied()
  call implied
  ; sci/eval.e16.ts:214  for (;;) {
.L1:
  ; sci/eval.e16.ts:215  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:216  if (t !== T_TIMES && t !== T_DIVIDE) return
  li t0, 129
  beq s1, t0, .L5
  li t0, 130
  beq s1, t0, .L5
  ; sci/eval.e16.ts:216  return
  j .return
.L5:
  ; sci/eval.e16.ts:217  const at = pos
  lw s2, 0x0578(zero)
  ; sci/eval.e16.ts:218  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
  ; sci/eval.e16.ts:219  implied()
  call implied
  ; sci/eval.e16.ts:220  binary(t === T_TIMES ? M_MUL : M_DIV, at)
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

; sci/eval.e16.ts:225 startsValue(t) at -O1
;   t in s1
startsValue:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/eval.e16.ts:226  return (
  mv a0, s1
  call isDigit
  mv t1, a0
  mv t0, a0
  bnez t1, .L18
  li t0, 46
  sub t0, s1, t0
  seqz t0, t0
.L18:
  mv t1, t0
  bnez t1, .L17
  li t0, 135
  sub t0, s1, t0
  seqz t0, t0
.L17:
  mv t1, t0
  bnez t1, .L16
  li t0, 40
  sub t0, s1, t0
  seqz t0, t0
.L16:
  mv t1, t0
  bnez t1, .L15
  li t0, 128
  sub t0, s1, t0
  seqz t0, t0
.L15:
  mv t1, t0
  bnez t1, .L14
  li t0, 101
  sub t0, s1, t0
  seqz t0, t0
.L14:
  mv t1, t0
  bnez t1, .L13
  li t0, 20
  sub t0, s1, t0
  seqz t0, t0
.L13:
  mv t1, t0
  bnez t1, .L12
  li t0, 21
  sub t0, s1, t0
  seqz t0, t0
.L12:
  mv t1, t0
  bnez t1, .L11
  li t0, 22
  sub t0, s1, t0
  seqz t0, t0
.L11:
  mv t1, t0
  bnez t1, .L10
  li t0, 25
  sub t0, s1, t0
  seqz t0, t0
.L10:
  mv t1, t0
  bnez t1, .L9
  li t0, 28
  sub t0, s1, t0
  seqz t0, t0
.L9:
  mv t1, t0
  bnez t1, .L8
  li t0, 30
  sub t0, s1, t0
  seqz t0, t0
.L8:
  mv t1, t0
  bnez t1, .L7
  li t0, 237
  sub t0, s1, t0
  seqz t0, t0
.L7:
  mv t1, t0
  bnez t1, .L6
  mv a0, s1
  call isStatValue
  mv t0, a0
.L6:
  mv t1, t0
  bnez t1, .L5
  li t0, 12
  sub t0, s1, t0
  seqz t0, t0
.L5:
  mv t1, t0
  bnez t1, .L4
  li t0, 13
  sub t0, s1, t0
  seqz t0, t0
.L4:
  mv t1, t0
  bnez t1, .L3
  li t0, 14
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

; sci/eval.e16.ts:249 implied() at -O1
;   at in s1
implied:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/eval.e16.ts:250  comb()
  call comb
  ; sci/eval.e16.ts:251  while (startsValue(tok())) {
  j .L3
.L1:
  ; sci/eval.e16.ts:252  const at = pos
  lw s1, 0x0578(zero)
  ; sci/eval.e16.ts:253  comb()
  call comb
  ; sci/eval.e16.ts:254  binary(M_MUL, at)
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

; sci/eval.e16.ts:258 comb() at -O1
;   t in s1
;   at in s2
comb:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:259  slash()
  call slash
  ; sci/eval.e16.ts:260  for (;;) {
.L1:
  ; sci/eval.e16.ts:261  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:262  if (t !== T_NCR && t !== T_NPR) return
  li t0, 18
  beq s1, t0, .L5
  li t0, 19
  beq s1, t0, .L5
  ; sci/eval.e16.ts:262  return
  j .return
.L5:
  ; sci/eval.e16.ts:263  const at = pos
  lw s2, 0x0578(zero)
  ; sci/eval.e16.ts:264  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
  ; sci/eval.e16.ts:265  slash()
  call slash
  ; sci/eval.e16.ts:266  choose(t === T_NCR, at)
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

; sci/eval.e16.ts:271 slash() at -O1
;   at in s1
slash:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/eval.e16.ts:272  unary()
  call unary
  ; sci/eval.e16.ts:273  while (tok() === T_SLASH) {
  j .L3
.L1:
  ; sci/eval.e16.ts:274  const at = pos
  lw s1, 0x0578(zero)
  ; sci/eval.e16.ts:275  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
  ; sci/eval.e16.ts:276  unary()
  call unary
  ; sci/eval.e16.ts:277  binary(M_DIV, at)
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

; sci/eval.e16.ts:281 unary() at -O1
;   t/at in s1
unary:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/eval.e16.ts:282  const t = tok()
  call tok
  mv s1, a0 ; t/at
  ; sci/eval.e16.ts:283  if (t === T_NEG || t === T_MINUS) {
  li t0, 16
  beq s1, t0, .L2
  li t0, 45
  bne s1, t0, .L1
.L2:
  ; sci/eval.e16.ts:284  const at = pos
  lw s1, 0x0578(zero)
  ; sci/eval.e16.ts:285  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
  ; sci/eval.e16.ts:286  unary()
  call unary
  ; sci/eval.e16.ts:287  math(M_NEG, top(), 0, at)
  call top
  mv a1, a0
  li a0, 16
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:288  exactNeg(top())
  call top
  la t0, exactNeg
  li t1, 2
  call far_call
  ; sci/eval.e16.ts:289  return
  j .return
.L1:
  ; sci/eval.e16.ts:291  if (t === T_PLUS) {
  li t0, 43
  bne s1, t0, .L3
  ; sci/eval.e16.ts:292  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
  ; sci/eval.e16.ts:293  unary()
  call unary
  ; sci/eval.e16.ts:294  return
  j .return
.L3:
  ; sci/eval.e16.ts:296  post()
  call post
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:299 post() at -O1
;   t in s1
;   at in s2
post:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:300  primary()
  call primary
  ; sci/eval.e16.ts:301  for (;;) {
.L1:
  ; sci/eval.e16.ts:302  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:303  const at = pos
  lw s2, 0x0578(zero)
  ; sci/eval.e16.ts:304  if (t === T_POW || t === T_POWT) {
  li t0, 17
  beq s1, t0, .L6
  li t0, 26
  bne s1, t0, .L5
.L6:
  ; sci/eval.e16.ts:305  powers()
  call powers
  j .L1
.L5:
  ; sci/eval.e16.ts:306  if (t === T_SQUARE) {
  li t0, 132
  bne s1, t0, .L8
  ; sci/eval.e16.ts:307  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
  ; sci/eval.e16.ts:308  raise(2, at)
  li a0, 2
  mv a1, s2
  call raise
  j .L1
.L8:
  ; sci/eval.e16.ts:309  if (t === T_CUBE) {
  li t0, 133
  bne s1, t0, .L10
  ; sci/eval.e16.ts:310  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
  ; sci/eval.e16.ts:311  raise(3, at)
  li a0, 3
  mv a1, s2
  call raise
  j .L1
.L10:
  ; sci/eval.e16.ts:312  if (t === T_INVERSE) {
  li t0, 134
  bne s1, t0, .L12
  ; sci/eval.e16.ts:313  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
  ; sci/eval.e16.ts:314  inverse(at)
  mv a0, s2
  call inverse
  j .L1
.L12:
  ; sci/eval.e16.ts:315  if (t === T_BANG) {
  li t0, 33
  bne s1, t0, .L14
  ; sci/eval.e16.ts:316  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
  ; sci/eval.e16.ts:317  factorial(at)
  mv a0, s2
  call factorial
  j .L1
.L14:
  ; sci/eval.e16.ts:318  if (t === T_PERCENT) {
  li t0, 37
  bne s1, t0, .L16
  ; sci/eval.e16.ts:319  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
  ; sci/eval.e16.ts:320  pushInt(100, at)
  li a0, 100
  mv a1, s2
  call pushInt
  ; sci/eval.e16.ts:321  binary(M_DIV, at)
  li a0, 4
  mv a1, s2
  call binary
  ; sci/eval.e16.ts:322  percentEnd = pos
  lw t0, 0x0578(zero)
  sw t0, 0x057a(zero)
  j .L1
.L16:
  ; sci/eval.e16.ts:323  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:328 powers() at -O1
;   at in s1
;   template in s2
powers:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:329  const at = pos
  lw s1, 0x0578(zero)
  ; sci/eval.e16.ts:330  const template = tok() === T_POWT
  call tok
  li t0, 26
  sub t0, a0, t0
  seqz s2, t0
  ; sci/eval.e16.ts:331  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
  ; sci/eval.e16.ts:332  sum()
  call sum
  ; sci/eval.e16.ts:333  if (template) expect(T_END)
  beqz s2, .L1
  ; sci/eval.e16.ts:333  expect(T_END)
  li a0, 24
  call expect
  j .L2
.L1:
  ; sci/eval.e16.ts:334  if (tok() === T_CLOSE) pos++
  call tok
  li t0, 41
  bne a0, t0, .L3
  ; sci/eval.e16.ts:334  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
.L3:
.L2:
  ; sci/eval.e16.ts:336  if (tok() === T_POW || tok() === T_POWT) powers()
  call tok
  li t0, 17
  beq a0, t0, .L5
  call tok
  li t0, 26
  bne a0, t0, .L4
.L5:
  ; sci/eval.e16.ts:336  powers()
  call powers
.L4:
  ; sci/eval.e16.ts:337  binary(M_POW, at)
  li a0, 5
  mv a1, s1
  call binary
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:341 expect(t) at -O1
;   t in s1
expect:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/eval.e16.ts:342  if (tok() !== t) fail(E_SYNTAX, pos)
  call tok
  beq a0, s1, .L1
  ; sci/eval.e16.ts:342  fail(E_SYNTAX, pos)
  lw a1, 0x0578(zero)
  li a0, 2
  call fail
.L1:
  ; sci/eval.e16.ts:343  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:346 raise(n, at) at -O1
;   n in s2
;   at in s1
raise:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; n
  mv s1, a1 ; at
  ; sci/eval.e16.ts:347  pushInt(n, at)
  mv a0, s2
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:348  binary(M_POW, at)
  li a0, 5
  mv a1, s1
  call binary
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:352 inverse(at) at -O1
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
  ; sci/eval.e16.ts:353  const x = top()
  call top
  mv s2, a0 ; x
  ; sci/eval.e16.ts:354  const one = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  mv s3, a0 ; one
  ; sci/eval.e16.ts:355  copyValue(x, push(at))
  mv a0, s1
  call push
  mv a1, a0
  mv a0, s2
  call copyValue
  ; sci/eval.e16.ts:356  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:357  copyValue(one, x)
  mv a0, s3
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:358  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/eval.e16.ts:362 factorial(at) at -O1
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
  ; sci/eval.e16.ts:363  const x = top()
  call top
  mv s3, a0 ; x
  ; sci/eval.e16.ts:364  const n = smallWhole(x, at)
  mv a0, s3
  mv a1, s1
  call smallWhole
  mv s0, a0 ; n
  ; sci/eval.e16.ts:365  if (n > 69) fail(E_MATH, at)
  li t0, 69
  bgeu t0, s0, .L1
  ; sci/eval.e16.ts:365  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L1:
  ; sci/eval.e16.ts:366  const f = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  sw a0, 0(sp) ; f
  ; sci/eval.e16.ts:367  for (let k: u16 = 2; k <= n; k++) {
  li s2, 2 ; k
  j .L4
.L2:
  ; sci/eval.e16.ts:368  pushInt(k, at)
  mv a0, s2
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:369  binary(M_MUL, at)
  li a0, 3
  mv a1, s1
  call binary
  addi s2, s2, 1
.L4:
  bgeu s0, s2, .L2
  ; sci/eval.e16.ts:371  copyValue(f, x)
  lw a0, 0(sp)
  mv a1, s3
  call copyValue
  ; sci/eval.e16.ts:372  pop()
  call pop
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  lw s2, 10(sp)
  addi sp, sp, 12
  ret

; sci/eval.e16.ts:376 choose(c, at) at -O1
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
  ; sci/eval.e16.ts:377  const r = top()
  call top
  mv s2, a0 ; r/rv
  ; sci/eval.e16.ts:378  const n = r - VALUE_SIZE
  addi s0, s2, -36
  ; sci/eval.e16.ts:379  const nv = smallWhole(n, at)
  mv a0, s0
  mv a1, s1
  call smallWhole
  sw a0, 0(sp) ; nv
  ; sci/eval.e16.ts:380  const rv = smallWhole(r, at)
  mv a0, s2
  mv a1, s1
  call smallWhole
  mv s2, a0 ; r/rv
  ; sci/eval.e16.ts:381  if (rv > nv) fail(E_MATH, at)
  lw t0, 0(sp) ; nv
  bgeu t0, s2, .L1
  ; sci/eval.e16.ts:381  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L1:
  ; sci/eval.e16.ts:382  const out = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  sw a0, 4(sp) ; out
  ; sci/eval.e16.ts:383  for (let k: u16 = 0; k < rv; k++) {
  li s3, 0 ; k
  j .L4
.L2:
  ; sci/eval.e16.ts:384  pushInt(nv - k, at)
  lw t0, 0(sp) ; nv
  sub a0, t0, s3
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:385  binary(M_MUL, at)
  li a0, 3
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:386  if (c) {
  lw t0, 2(sp) ; c
  beqz t0, .L6
  ; sci/eval.e16.ts:387  pushInt(k + 1, at)
  addi a0, s3, 1
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:388  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
.L6:
  addi s3, s3, 1
.L4:
  bltu s3, s2, .L2
  ; sci/eval.e16.ts:391  copyValue(out, n)
  lw a0, 4(sp)
  mv a1, s0
  call copyValue
  ; sci/eval.e16.ts:392  pop()
  call pop
  ; sci/eval.e16.ts:393  pop()
  call pop
.return:
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  lw s3, 14(sp)
  addi sp, sp, 16
  ret

; sci/eval.e16.ts:396 primary() at -O1
;   t in s1
;   at in s2
primary:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:397  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:398  const at = pos
  lw s2, 0x0578(zero)
  ; sci/eval.e16.ts:399  if (isDigit(t) || t === T_POINT || t === T_EXP) {
  mv a0, s1
  call isDigit
  bnez a0, .L2
  li t0, 46
  beq s1, t0, .L2
  li t0, 135
  bne s1, t0, .L1
.L2:
  ; sci/eval.e16.ts:400  number()
  call number
  ; sci/eval.e16.ts:401  return
  j .return
.L1:
  ; sci/eval.e16.ts:403  if (t === 0) fail(E_SYNTAX, at)
  bne s1, zero, .L3
  ; sci/eval.e16.ts:403  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s2
  call fail
.L3:
  ; sci/eval.e16.ts:404  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
  ; sci/eval.e16.ts:405  if (!constant(t, at)) bracketed(t, at)
  mv a0, s1
  mv a1, s2
  call constant
  bnez a0, .L4
  ; sci/eval.e16.ts:405  bracketed(t, at)
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

; sci/eval.e16.ts:409 constant(t/n, at) at -O1
;   t/n in s1
;   at in s2
constant:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t/n
  mv s2, a1 ; at
  ; sci/eval.e16.ts:410  if (t === T_PI) {
  li t0, 128
  bne s1, t0, .L1
  ; sci/eval.e16.ts:411  math(M_PI, push(at), 0, at)
  mv a0, s2
  call push
  mv a1, a0
  li a0, 32
  li a2, 0
  mv a3, s2
  call math
  j .L2
.L1:
  ; sci/eval.e16.ts:412  if (t === T_E) {
  li t0, 101
  bne s1, t0, .L3
  ; sci/eval.e16.ts:413  const n = pushInt(1, at)
  li a0, 1
  mv a1, s2
  call pushInt
  mv s1, a0 ; t/n
  ; sci/eval.e16.ts:414  math(M_EXP, n, 0, at)
  li a0, 30
  mv a1, s1
  li a2, 0
  mv a3, s2
  call math
  ; sci/eval.e16.ts:415  inexact(n)
  mv a0, s1
  call inexact
  j .L4
.L3:
  ; sci/eval.e16.ts:416  if (t === T_TEN) {
  li t0, 21
  bne s1, t0, .L5
  ; sci/eval.e16.ts:417  pushInt(10, at)
  li a0, 10
  mv a1, s2
  call pushInt
  j .L6
.L5:
  ; sci/eval.e16.ts:418  if (t === T_ANS) {
  li t0, 20
  bne s1, t0, .L7
  ; sci/eval.e16.ts:419  copyValue(KEEP_ANS, push(at))
  mv a0, s2
  call push
  mv a1, a0
  li a0, 3080
  call copyValue
  j .L8
.L7:
  ; sci/eval.e16.ts:420  if (isVariable(t)) {
  mv a0, s1
  call isVariable
  beqz a0, .L9
  ; sci/eval.e16.ts:421  copyValue(varAt(t), push(at))
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
  ; sci/eval.e16.ts:422  if (t === T_RAN) {
  li t0, 237
  bne s1, t0, .L11
  ; sci/eval.e16.ts:423  math(M_RND, push(at), 0, at)
  mv a0, s2
  call push
  mv a1, a0
  li a0, 31
  li a2, 0
  mv a3, s2
  call math
  j .L12
.L11:
  ; sci/eval.e16.ts:424  if (isStatValue(t)) {
  mv a0, s1
  call isStatValue
  beqz a0, .L13
  ; sci/eval.e16.ts:425  statValue(statIndex(t), push(at))
  mv a0, s1
  call statIndex
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  call push
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  la t0, statValue
  li t1, 7
  call far_call
  j .L14
.L13:
  ; sci/eval.e16.ts:426  if (t === T_DICE || t === T_COIN || t === T_RINT) {
  li t0, 12
  beq s1, t0, .L16
  li t0, 13
  beq s1, t0, .L16
  li t0, 14
  bne s1, t0, .L15
.L16:
  ; sci/eval.e16.ts:427  randomWhole(t, at)
  mv a0, s1
  mv a1, s2
  call randomWhole
  j .L17
.L15:
  ; sci/eval.e16.ts:428  return false
  li a0, 0
  j .return
.L17:
.L14:
.L12:
.L10:
.L8:
.L6:
.L4:
.L2:
  ; sci/eval.e16.ts:429  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:433 bracketed(t, at) at -O1
;   t in s1
;   at in s2
bracketed:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t
  mv s2, a1 ; at
  ; sci/eval.e16.ts:434  if (template(t, at)) return
  mv a0, s1
  mv a1, s2
  call template
  beqz a0, .L1
  ; sci/eval.e16.ts:434  return
  j .return
.L1:
  ; sci/eval.e16.ts:435  if (t === T_OPEN) {
  li t0, 40
  bne s1, t0, .L2
  ; sci/eval.e16.ts:436  sum()
  call sum
  ; sci/eval.e16.ts:437  if (tok() === T_CLOSE) pos++
  call tok
  li t0, 41
  bne a0, t0, .L4
  ; sci/eval.e16.ts:437  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
  j .L4
.L2:
  ; sci/eval.e16.ts:438  if (isFunction(t)) {
  mv a0, s1
  call isFunction
  beqz a0, .L5
  ; sci/eval.e16.ts:439  sum()
  call sum
  ; sci/eval.e16.ts:440  if (takesTwo(t)) {
  mv a0, s1
  call takesTwo
  beqz a0, .L6
  ; sci/eval.e16.ts:441  expect(T_COMMA)
  li a0, 44
  call expect
  ; sci/eval.e16.ts:442  sum()
  call sum
.L6:
  ; sci/eval.e16.ts:444  if (tok() === T_CLOSE) pos++
  call tok
  li t0, 41
  bne a0, t0, .L7
  ; sci/eval.e16.ts:444  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
.L7:
  ; sci/eval.e16.ts:445  if (takesTwo(t)) applyTwo(t, at)
  mv a0, s1
  call takesTwo
  beqz a0, .L8
  ; sci/eval.e16.ts:445  applyTwo(t, at)
  mv a0, s1
  mv a1, s2
  call applyTwo
  j .L10
.L8:
  ; sci/eval.e16.ts:446  apply(t, at)
  mv a0, s1
  mv a1, s2
  call apply
  j .L10
.L5:
  ; sci/eval.e16.ts:447  fail(E_SYNTAX, at)
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

; sci/eval.e16.ts:451 randomWhole(t, at) at -O1
;   t in s0
;   at in s1
;   v in s2
;   k/one in s3
randomWhole:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s0, a0 ; t
  mv s1, a1 ; at
  ; sci/eval.e16.ts:452  const v = push(at)
  mv a0, s1
  call push
  mv s2, a0 ; v
  ; sci/eval.e16.ts:453  math(M_RND, v, 0, at)
  li a0, 31
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:454  const k = pushInt(t === T_DICE ? 6 : t === T_COIN ? 2 : 100, at)
  li t0, 12
  bne s0, t0, .L1
  li t0, 6
  j .L2
.L1:
  li t0, 13
  bne s0, t0, .L3
  li t0, 2
  j .L4
.L3:
  li t0, 100
.L4:
.L2:
  mv a0, t0
  mv a1, s1
  call pushInt
  mv s3, a0 ; k/one
  ; sci/eval.e16.ts:455  math(M_MUL, v, k, at)
  li a0, 3
  mv a1, s2
  mv a2, s3
  mv a3, s1
  call math
  ; sci/eval.e16.ts:456  pop()
  call pop
  ; sci/eval.e16.ts:457  const one = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  mv s3, a0 ; k/one
  ; sci/eval.e16.ts:458  math(M_IDIV, v, one, at)
  li a0, 8
  mv a1, s2
  mv a2, s3
  mv a3, s1
  call math
  ; sci/eval.e16.ts:459  if (t === T_DICE) math(M_ADD, v, one, at)
  li t0, 12
  bne s0, t0, .L5
  ; sci/eval.e16.ts:459  math(M_ADD, v, one, at)
  li a0, 1
  mv a1, s2
  mv a2, s3
  mv a3, s1
  call math
.L5:
  ; sci/eval.e16.ts:460  pop()
  call pop
  ; sci/eval.e16.ts:461  exactWhole(v)
  mv a0, s2
  la t0, exactWhole
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

; sci/eval.e16.ts:465 template(t, at) at -O1
;   t in s1
;   at in s2
template:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t
  mv s2, a1 ; at
  ; sci/eval.e16.ts:466  if (t === T_MIXED) {
  li t0, 28
  bne s1, t0, .L1
  ; sci/eval.e16.ts:467  mixed(at)
  mv a0, s2
  call mixed
  ; sci/eval.e16.ts:468  return true
  li a0, 1
  j .return
.L1:
  ; sci/eval.e16.ts:470  if (t === T_XROOT) {
  li t0, 30
  bne s1, t0, .L2
  ; sci/eval.e16.ts:471  sum()
  call sum
  ; sci/eval.e16.ts:472  expect(T_XSEP)
  li a0, 11
  call expect
  ; sci/eval.e16.ts:473  sum()
  call sum
  ; sci/eval.e16.ts:474  expect(T_END)
  li a0, 24
  call expect
  ; sci/eval.e16.ts:475  anyRoot(at)
  mv a0, s2
  call anyRoot
  ; sci/eval.e16.ts:476  return true
  li a0, 1
  j .return
.L2:
  ; sci/eval.e16.ts:478  if (t === T_FRAC) {
  li t0, 22
  bne s1, t0, .L3
  ; sci/eval.e16.ts:479  sum()
  call sum
  ; sci/eval.e16.ts:480  expect(T_SEP)
  li a0, 23
  call expect
  ; sci/eval.e16.ts:481  sum()
  call sum
  ; sci/eval.e16.ts:482  expect(T_END)
  li a0, 24
  call expect
  ; sci/eval.e16.ts:483  binary(M_DIV, at)
  li a0, 4
  mv a1, s2
  call binary
  j .L4
.L3:
  ; sci/eval.e16.ts:484  if (t === T_ROOT) {
  li t0, 25
  bne s1, t0, .L5
  ; sci/eval.e16.ts:485  sum()
  call sum
  ; sci/eval.e16.ts:486  expect(T_END)
  li a0, 24
  call expect
  ; sci/eval.e16.ts:487  math(M_SQR, top(), 0, at)
  call top
  mv a1, a0
  li a0, 21
  li a2, 0
  mv a3, s2
  call math
  ; sci/eval.e16.ts:488  exactSqrt(top())
  call top
  la t0, exactSqrt
  li t1, 2
  call far_call
  j .L6
.L5:
  ; sci/eval.e16.ts:489  return false
  li a0, 0
  j .return
.L6:
.L4:
  ; sci/eval.e16.ts:490  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:494 mixed(at) at -O1
;   at in s1
mixed:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; sci/eval.e16.ts:495  sum()
  call sum
  ; sci/eval.e16.ts:496  expect(T_MSEP)
  li a0, 29
  call expect
  ; sci/eval.e16.ts:497  sum()
  call sum
  ; sci/eval.e16.ts:498  expect(T_MDIV)
  li a0, 31
  call expect
  ; sci/eval.e16.ts:499  sum()
  call sum
  ; sci/eval.e16.ts:500  expect(T_END)
  li a0, 24
  call expect
  ; sci/eval.e16.ts:501  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:502  binary(isNegative(top() - VALUE_SIZE) ? M_SUB : M_ADD, at)
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

; sci/eval.e16.ts:509 anyRoot(at) at -O1
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
  ; sci/eval.e16.ts:510  const x = top()
  call top
  mv s2, a0 ; x
  ; sci/eval.e16.ts:511  const n = x - VALUE_SIZE
  addi s3, s2, -36
  ; sci/eval.e16.ts:512  const negative = isNegative(x)
  mv a0, s2
  call isNegative
  sw a0, 0(sp) ; negative
  ; sci/eval.e16.ts:513  if (negative) {
  lw t0, 0(sp) ; negative
  beqz t0, .L1
  ; sci/eval.e16.ts:514  if ((smallWhole(n, at) & 1) === 0) fail(E_MATH, at)
  mv a0, s3
  mv a1, s1
  call smallWhole
  andi t0, a0, 1
  bne t0, zero, .L2
  ; sci/eval.e16.ts:514  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L2:
  ; sci/eval.e16.ts:515  math(M_NEG, x, 0, at)
  li a0, 16
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
.L1:
  ; sci/eval.e16.ts:517  const two = pushInt(2, at)
  li a0, 2
  mv a1, s1
  call pushInt
  mv s0, a0 ; two/power
  ; sci/eval.e16.ts:518  math(M_CMP, n, two, at)
  li a0, 6
  mv a1, s3
  mv a2, s0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:519  pop()
  call pop
  ; sci/eval.e16.ts:520  if (peek16(MATH_RESULT) === 0) {
  li t0, 65370
  lw t0, 0(t0)
  bne t0, zero, .L3
  ; sci/eval.e16.ts:521  math(M_SQR, x, 0, at)
  li a0, 21
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:522  exactSqrt(x)
  mv a0, s2
  la t0, exactSqrt
  li t1, 2
  call far_call
  j .L4
.L3:
  ; sci/eval.e16.ts:524  const power = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  mv s0, a0 ; two/power
  ; sci/eval.e16.ts:525  copyValue(n, push(at))
  mv a0, s1
  call push
  mv a1, a0
  mv a0, s3
  call copyValue
  ; sci/eval.e16.ts:526  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:527  math(M_POW, x, power, at)
  li a0, 5
  mv a1, s2
  mv a2, s0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:528  pop()
  call pop
  ; sci/eval.e16.ts:529  exactWhole(x)
  mv a0, s2
  la t0, exactWhole
  li t1, 2
  call far_call
.L4:
  ; sci/eval.e16.ts:531  if (negative) {
  lw t0, 0(sp) ; negative
  beqz t0, .L5
  ; sci/eval.e16.ts:532  math(M_NEG, x, 0, at)
  li a0, 16
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:533  exactNeg(x)
  mv a0, s2
  la t0, exactNeg
  li t1, 2
  call far_call
.L5:
  ; sci/eval.e16.ts:535  copyValue(x, n)
  mv a0, s2
  mv a1, s3
  call copyValue
  ; sci/eval.e16.ts:536  pop()
  call pop
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s0, 10(sp)
  addi sp, sp, 12
  ret

; sci/eval.e16.ts:543 number() at -O1
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
  ; sci/eval.e16.ts:544  const at = pos
  lw s3, 0x0578(zero)
  ; sci/eval.e16.ts:545  let n: u16 = 0
  li s1, 0 ; n
  ; sci/eval.e16.ts:546  let points: u16 = 0
  li s2, 0 ; points/v
  ; sci/eval.e16.ts:547  let digits: u16 = 0
  li s0, 0 ; digits
  ; sci/eval.e16.ts:548  while (isDigit(tok()) || tok() === T_POINT) {
  j .L3
.L1:
  ; sci/eval.e16.ts:549  if (tok() === T_POINT) points++
  call tok
  li t0, 46
  bne a0, t0, .L5
  ; sci/eval.e16.ts:549  points++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/eval.e16.ts:550  digits++
  addi s0, s0, 1
.L6:
  ; sci/eval.e16.ts:551  if (n < 30) {
  li t0, 30
  bgeu s1, t0, .L7
  ; sci/eval.e16.ts:552  poke(addr(numberText) + n, tok())
  call tok
  sb a0, numberText(s1)
  ; sci/eval.e16.ts:553  n++
  addi s1, s1, 1
.L7:
  ; sci/eval.e16.ts:555  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
.L3:
  call tok
  call isDigit
  bnez a0, .L1
  call tok
  li t0, 46
  beq a0, t0, .L1
  ; sci/eval.e16.ts:557  if (points > 1 || (points === 1 && digits === 0)) fail(E_SYNTAX, at)
  li t0, 1
  bltu t0, s2, .L9
  li t0, 1
  bne s2, t0, .L8
  bne s0, zero, .L8
.L9:
  ; sci/eval.e16.ts:557  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s3
  call fail
.L8:
  ; sci/eval.e16.ts:558  if (tok() === T_EXP) n = exponentPart(digits === 0 ? 0 : n)
  call tok
  li t0, 135
  bne a0, t0, .L10
  ; sci/eval.e16.ts:558  n = exponentPart(digits === 0 ? 0 : n)
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
  ; sci/eval.e16.ts:559  poke(addr(numberText) + n, 0)
  sb zero, numberText(s1)
  ; sci/eval.e16.ts:560  const v = push(at)
  mv a0, s3
  call push
  mv s2, a0 ; points/v
  ; sci/eval.e16.ts:561  poke16(MATH_ARG, n)
  li t0, 65366
  sw s1, 0(t0)
  ; sci/eval.e16.ts:562  math(M_PARSE, v, addr(numberText), at)
  li a0, 56
  mv a1, s2
  la a2, numberText
  mv a3, s3
  call math
  ; sci/eval.e16.ts:563  exactLiteral(v)
  mv a0, s2
  la t0, exactLiteral
  li t1, 2
  call far_call
  ; sci/eval.e16.ts:564  if (tok() === T_DEG) minutes(at)
  call tok
  li t0, 136
  bne a0, t0, .L13
  ; sci/eval.e16.ts:564  minutes(at)
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

; sci/eval.e16.ts:568 minutes(at) at -O1
;   at in s1
minutes:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; sci/eval.e16.ts:569  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
  ; sci/eval.e16.ts:570  if (startsNumber(tok())) sixtieth(T_MIN, 60, at)
  call tok
  call startsNumber
  beqz a0, .L1
  ; sci/eval.e16.ts:570  sixtieth(T_MIN, 60, at)
  li a0, 137
  li a1, 60
  mv a2, s1
  call sixtieth
.L1:
  ; sci/eval.e16.ts:571  if (startsNumber(tok())) sixtieth(T_SEC, 3600, at)
  call tok
  call startsNumber
  beqz a0, .L2
  ; sci/eval.e16.ts:571  sixtieth(T_SEC, 3600, at)
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

; sci/eval.e16.ts:575 sixtieth(mark, parts, at) at -O1
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
  ; sci/eval.e16.ts:576  number()
  call number
  ; sci/eval.e16.ts:577  expect(mark)
  mv a0, s2
  call expect
  ; sci/eval.e16.ts:578  pushInt(parts, at)
  mv a0, s3
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:579  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:580  binary(M_ADD, at)
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

; sci/eval.e16.ts:583 startsNumber(t) at -O1
;   t in s1
startsNumber:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/eval.e16.ts:584  return isDigit(t) || t === T_POINT
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

; sci/eval.e16.ts:591 exponentPart(n/k) at -O1
;   n/k in s1
exponentPart:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n/k
  ; sci/eval.e16.ts:592  let k = n
  ; sci/eval.e16.ts:593  if (k === 0) {
  bne s1, zero, .L1
  ; sci/eval.e16.ts:594  poke(addr(numberText), 0x31)
  li t0, 49
  sb t0, numberText(zero)
  ; sci/eval.e16.ts:595  k = 1
  li s1, 1 ; n/k
.L1:
  ; sci/eval.e16.ts:597  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
  ; sci/eval.e16.ts:598  poke(addr(numberText) + k, 0x45)
  li t0, 69
  sb t0, numberText(s1)
  ; sci/eval.e16.ts:599  k++
  addi s1, s1, 1
  ; sci/eval.e16.ts:600  if (tok() === T_NEG || tok() === T_MINUS) {
  call tok
  li t0, 16
  beq a0, t0, .L3
  call tok
  li t0, 45
  bne a0, t0, .L2
.L3:
  ; sci/eval.e16.ts:601  poke(addr(numberText) + k, 0x2d)
  li t0, 45
  sb t0, numberText(s1)
  ; sci/eval.e16.ts:602  k++
  addi s1, s1, 1
  ; sci/eval.e16.ts:603  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
.L2:
  ; sci/eval.e16.ts:605  if (!isDigit(tok())) fail(E_SYNTAX, pos)
  call tok
  call isDigit
  bnez a0, .L7
  ; sci/eval.e16.ts:605  fail(E_SYNTAX, pos)
  lw a1, 0x0578(zero)
  li a0, 2
  call fail
  ; sci/eval.e16.ts:606  while (isDigit(tok())) {
  j .L7
.L5:
  ; sci/eval.e16.ts:607  if (k < 31) {
  li t0, 31
  bgeu s1, t0, .L9
  ; sci/eval.e16.ts:608  poke(addr(numberText) + k, tok())
  call tok
  sb a0, numberText(s1)
  ; sci/eval.e16.ts:609  k++
  addi s1, s1, 1
.L9:
  ; sci/eval.e16.ts:611  pos++
  lw t0, 0x0578(zero)
  addi t0, t0, 1
  sw t0, 0x0578(zero)
.L7:
  call tok
  call isDigit
  bnez a0, .L5
  ; sci/eval.e16.ts:613  return k
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:620 apply(f, at) at -O1
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
  ; sci/eval.e16.ts:621  const x = top()
  call top
  mv s1, a0 ; x
  ; sci/eval.e16.ts:622  copyValue(x, addr(argument))
  mv a0, s1
  la a1, argument
  call copyValue
  ; sci/eval.e16.ts:623  if (f === T_SIN) trig(M_SIN, TRIG_SIN, x, at)
  li t0, 1
  bne s2, t0, .L1
  ; sci/eval.e16.ts:623  trig(M_SIN, TRIG_SIN, x, at)
  li a0, 22
  li a1, 0
  mv a2, s1
  mv a3, s3
  call trig
  j .L2
.L1:
  ; sci/eval.e16.ts:624  if (f === T_COS) trig(M_COS, TRIG_COS, x, at)
  li t0, 2
  bne s2, t0, .L3
  ; sci/eval.e16.ts:624  trig(M_COS, TRIG_COS, x, at)
  li a0, 23
  li a1, 1
  mv a2, s1
  mv a3, s3
  call trig
  j .L4
.L3:
  ; sci/eval.e16.ts:625  if (f === T_TAN) trig(M_TAN, TRIG_TAN, x, at)
  li t0, 3
  bne s2, t0, .L5
  ; sci/eval.e16.ts:625  trig(M_TAN, TRIG_TAN, x, at)
  li a0, 24
  li a1, 2
  mv a2, s1
  mv a3, s3
  call trig
  j .L6
.L5:
  ; sci/eval.e16.ts:626  if (f === T_SQRT) {
  li t0, 9
  bne s2, t0, .L7
  ; sci/eval.e16.ts:627  math(M_SQR, x, 0, at)
  li a0, 21
  mv a1, s1
  li a2, 0
  mv a3, s3
  call math
  ; sci/eval.e16.ts:628  exactSqrt(x)
  mv a0, s1
  la t0, exactSqrt
  li t1, 2
  call far_call
  j .L8
.L7:
  ; sci/eval.e16.ts:630  other(f, x, at)
  mv a0, s2
  mv a1, s1
  mv a2, s3
  call other
  ; sci/eval.e16.ts:631  exactWhole(x)
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

; sci/eval.e16.ts:636 other(f, x, at) at -O1
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
  ; sci/eval.e16.ts:637  if (f >= T_SINH) {
  li t0, 224
  bltu s1, t0, .L1
  ; sci/eval.e16.ts:638  named(f, x, at)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call named
  ; sci/eval.e16.ts:639  return
  j .return
.L1:
  ; sci/eval.e16.ts:641  if (f === T_ASIN) math(M_ASN, x, 0, at)
  li t0, 4
  bne s1, t0, .L2
  ; sci/eval.e16.ts:641  math(M_ASN, x, 0, at)
  li a0, 25
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L3
.L2:
  ; sci/eval.e16.ts:642  if (f === T_ACOS) math(M_ACS, x, 0, at)
  li t0, 5
  bne s1, t0, .L4
  ; sci/eval.e16.ts:642  math(M_ACS, x, 0, at)
  li a0, 26
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L5
.L4:
  ; sci/eval.e16.ts:643  if (f === T_ATAN) math(M_ATN, x, 0, at)
  li t0, 6
  bne s1, t0, .L6
  ; sci/eval.e16.ts:643  math(M_ATN, x, 0, at)
  li a0, 27
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L7
.L6:
  ; sci/eval.e16.ts:644  if (f === T_LOG) math(M_LOG, x, 0, at)
  li t0, 7
  bne s1, t0, .L8
  ; sci/eval.e16.ts:644  math(M_LOG, x, 0, at)
  li a0, 29
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L9
.L8:
  ; sci/eval.e16.ts:645  if (f === T_LN) math(M_LN, x, 0, at)
  li t0, 8
  bne s1, t0, .L10
  ; sci/eval.e16.ts:645  math(M_LN, x, 0, at)
  li a0, 28
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L11
.L10:
  ; sci/eval.e16.ts:646  if (f === T_CBRT) cubeRoot(x, at)
  li t0, 10
  bne s1, t0, .L12
  ; sci/eval.e16.ts:646  cubeRoot(x, at)
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

; sci/eval.e16.ts:650 named(f, x, at) at -O1
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
  ; sci/eval.e16.ts:651  if (f === T_XEST || f === T_YEST || f === T_X2EST) {
  li t0, 250
  beq s1, t0, .L2
  li t0, 251
  beq s1, t0, .L2
  li t0, 253
  bne s1, t0, .L1
.L2:
  ; sci/eval.e16.ts:653  statEstimate(f === T_YEST ? EST_Y : f === T_XEST ? EST_X : EST_X2, x)
  li t0, 251
  bne s1, t0, .L3
  li t0, 0
  j .L4
.L3:
  li t0, 250
  bne s1, t0, .L5
  li t0, 1
  j .L6
.L5:
  li t0, 2
.L6:
.L4:
  mv a0, t0
  mv a1, s2
  la t0, statEstimate
  li t1, 7
  call far_call
  ; sci/eval.e16.ts:654  return
  j .return
.L1:
  ; sci/eval.e16.ts:656  if (f === T_SINH) math(M_SINH, x, 0, at)
  li t0, 224
  bne s1, t0, .L7
  ; sci/eval.e16.ts:656  math(M_SINH, x, 0, at)
  li a0, 33
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L8
.L7:
  ; sci/eval.e16.ts:657  if (f === T_COSH) math(M_COSH, x, 0, at)
  li t0, 225
  bne s1, t0, .L9
  ; sci/eval.e16.ts:657  math(M_COSH, x, 0, at)
  li a0, 34
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L10
.L9:
  ; sci/eval.e16.ts:658  if (f === T_TANH) math(M_TANH, x, 0, at)
  li t0, 226
  bne s1, t0, .L11
  ; sci/eval.e16.ts:658  math(M_TANH, x, 0, at)
  li a0, 35
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L12
.L11:
  ; sci/eval.e16.ts:659  if (f === T_ASINH) math(M_ASNH, x, 0, at)
  li t0, 227
  bne s1, t0, .L13
  ; sci/eval.e16.ts:659  math(M_ASNH, x, 0, at)
  li a0, 36
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L14
.L13:
  ; sci/eval.e16.ts:660  if (f === T_ACOSH) math(M_ACSH, x, 0, at)
  li t0, 228
  bne s1, t0, .L15
  ; sci/eval.e16.ts:660  math(M_ACSH, x, 0, at)
  li a0, 37
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L16
.L15:
  ; sci/eval.e16.ts:661  if (f === T_ATANH) math(M_ATNH, x, 0, at)
  li t0, 229
  bne s1, t0, .L17
  ; sci/eval.e16.ts:661  math(M_ATNH, x, 0, at)
  li a0, 38
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L18
.L17:
  ; sci/eval.e16.ts:662  wholeOrRounded(f, x, at)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call wholeOrRounded
.L18:
.L16:
.L14:
.L12:
.L10:
.L8:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/eval.e16.ts:666 wholeOrRounded(f/one, x, at) at -O1
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
  ; sci/eval.e16.ts:667  if (f === T_INT) {
  li t0, 233
  bne s2, t0, .L1
  ; sci/eval.e16.ts:668  const one = pushInt(1, at)
  li a0, 1
  mv a1, s3
  call pushInt
  mv s2, a0 ; f/one
  ; sci/eval.e16.ts:669  math(M_IDIV, x, one, at)
  li a0, 8
  mv a1, s1
  mv a2, s2
  mv a3, s3
  call math
  ; sci/eval.e16.ts:670  pop()
  call pop
  j .L2
.L1:
  ; sci/eval.e16.ts:671  if (f === T_RND) {
  li t0, 234
  bne s2, t0, .L3
  ; sci/eval.e16.ts:672  poke16(MATH_ARG, shownDigits())
  call shownDigits
  li t0, 65366
  sw a0, 0(t0)
  ; sci/eval.e16.ts:673  math(M_RNDTO, x, 0, at)
  li a0, 40
  mv a1, s1
  li a2, 0
  mv a3, s3
  call math
  ; sci/eval.e16.ts:674  exactLiteral(x)
  mv a0, s1
  la t0, exactLiteral
  li t1, 2
  call far_call
  j .L4
.L3:
  ; sci/eval.e16.ts:675  if (f === T_ABS && isNegative(x)) {
  li t0, 230
  bne s2, t0, .L5
  mv a0, s1
  call isNegative
  beqz a0, .L5
  ; sci/eval.e16.ts:676  math(M_NEG, x, 0, at)
  li a0, 16
  mv a1, s1
  li a2, 0
  mv a3, s3
  call math
  ; sci/eval.e16.ts:677  exactNeg(x)
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

; sci/eval.e16.ts:684 applyTwo(f, at) at -O1
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
  ; sci/eval.e16.ts:685  const b = top()
  call top
  mv s2, a0 ; b
  ; sci/eval.e16.ts:686  const a = b - VALUE_SIZE
  addi s3, s2, -36
  ; sci/eval.e16.ts:687  if (f === T_POL) polar(a, b, at)
  li t0, 235
  bne s0, t0, .L1
  ; sci/eval.e16.ts:687  polar(a, b, at)
  mv a0, s3
  mv a1, s2
  mv a2, s1
  call polar
  j .L2
.L1:
  ; sci/eval.e16.ts:688  if (f === T_REC) rectangular(a, b, at)
  li t0, 236
  bne s0, t0, .L3
  ; sci/eval.e16.ts:688  rectangular(a, b, at)
  mv a0, s3
  mv a1, s2
  mv a2, s1
  call rectangular
  j .L4
.L3:
  ; sci/eval.e16.ts:690  whole(a, at)
  mv a0, s3
  mv a1, s1
  call whole
  ; sci/eval.e16.ts:691  whole(b, at)
  mv a0, s2
  mv a1, s1
  call whole
  ; sci/eval.e16.ts:692  if (f === T_GCD) gcdInto(a, b, at)
  li t0, 231
  bne s0, t0, .L5
  ; sci/eval.e16.ts:692  gcdInto(a, b, at)
  mv a0, s3
  mv a1, s2
  mv a2, s1
  call gcdInto
  j .L6
.L5:
  ; sci/eval.e16.ts:693  lcm(a, b, at)
  mv a0, s3
  mv a1, s2
  mv a2, s1
  call lcm
.L6:
  ; sci/eval.e16.ts:694  exactWhole(a)
  mv a0, s3
  la t0, exactWhole
  li t1, 2
  call far_call
.L4:
.L2:
  ; sci/eval.e16.ts:696  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/eval.e16.ts:700 whole(v, at) at -O1
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
  ; sci/eval.e16.ts:701  const t = push(at)
  mv a0, s1
  call push
  mv s3, a0 ; t
  ; sci/eval.e16.ts:702  copyValue(v, t)
  mv a0, s2
  mv a1, s3
  call copyValue
  ; sci/eval.e16.ts:703  math(M_FRAC, t, 0, at)
  li a0, 19
  mv a1, s3
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:704  if (!isZero(t)) fail(E_MATH, at)
  mv a0, s3
  call isZero
  bnez a0, .L1
  ; sci/eval.e16.ts:704  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L1:
  ; sci/eval.e16.ts:705  pop()
  call pop
  ; sci/eval.e16.ts:706  if (isNegative(v)) math(M_NEG, v, 0, at)
  mv a0, s2
  call isNegative
  beqz a0, .L2
  ; sci/eval.e16.ts:706  math(M_NEG, v, 0, at)
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

; sci/eval.e16.ts:710 gcdInto(a, b, at) at -O1
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
  ; sci/eval.e16.ts:711  const t = push(at)
  mv a0, s0
  call push
  mv s2, a0 ; t
  ; sci/eval.e16.ts:712  while (!isZero(b)) {
  j .L3
.L1:
  ; sci/eval.e16.ts:713  copyValue(a, t)
  mv a0, s3
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:714  math(M_MOD, t, b, at)
  li a0, 9
  mv a1, s2
  mv a2, s1
  mv a3, s0
  call math
  ; sci/eval.e16.ts:715  copyValue(b, a)
  mv a0, s1
  mv a1, s3
  call copyValue
  ; sci/eval.e16.ts:716  copyValue(t, b)
  mv a0, s2
  mv a1, s1
  call copyValue
.L3:
  mv a0, s1
  call isZero
  beqz a0, .L1
  ; sci/eval.e16.ts:718  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/eval.e16.ts:722 lcm(a, b, at) at -O1
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
  ; sci/eval.e16.ts:723  const product = push(at)
  mv a0, s3
  call push
  mv s1, a0 ; product
  ; sci/eval.e16.ts:724  copyValue(a, product)
  mv a0, s2
  mv a1, s1
  call copyValue
  ; sci/eval.e16.ts:725  math(M_MUL, product, b, at)
  li a0, 3
  mv a1, s1
  mv a2, s0
  mv a3, s3
  call math
  ; sci/eval.e16.ts:726  if (isZero(product)) {
  mv a0, s1
  call isZero
  beqz a0, .L1
  ; sci/eval.e16.ts:727  copyValue(product, a)
  mv a0, s1
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:728  pop()
  call pop
  ; sci/eval.e16.ts:729  return
  j .return
.L1:
  ; sci/eval.e16.ts:731  gcdInto(a, b, at)
  mv a0, s2
  mv a1, s0
  mv a2, s3
  call gcdInto
  ; sci/eval.e16.ts:732  math(M_DIV, product, a, at)
  li a0, 4
  mv a1, s1
  mv a2, s2
  mv a3, s3
  call math
  ; sci/eval.e16.ts:733  copyValue(product, a)
  mv a0, s1
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:734  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s0, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/eval.e16.ts:738 polar(a, b, at) at -O1
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
  ; sci/eval.e16.ts:739  const r = push(at)
  mv a0, s1
  call push
  mv s3, a0 ; r
  ; sci/eval.e16.ts:740  copyValue(a, r)
  mv a0, s2
  mv a1, s3
  call copyValue
  ; sci/eval.e16.ts:741  math(M_MUL, r, a, at)
  li a0, 3
  mv a1, s3
  mv a2, s2
  mv a3, s1
  call math
  ; sci/eval.e16.ts:742  const y2 = push(at)
  mv a0, s1
  call push
  sw a0, 0(sp) ; y2
  ; sci/eval.e16.ts:743  copyValue(b, y2)
  mv a0, s0
  lw a1, 0(sp)
  call copyValue
  ; sci/eval.e16.ts:744  math(M_MUL, y2, b, at)
  li a0, 3
  lw a1, 0(sp)
  mv a2, s0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:745  math(M_ADD, r, y2, at)
  li a0, 1
  mv a1, s3
  lw a2, 0(sp)
  mv a3, s1
  call math
  ; sci/eval.e16.ts:746  pop()
  call pop
  ; sci/eval.e16.ts:747  math(M_SQR, r, 0, at)
  li a0, 21
  mv a1, s3
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:749  math(M_ATN2, b, a, at)
  li a0, 39
  mv a1, s0
  mv a2, s2
  mv a3, s1
  call math
  ; sci/eval.e16.ts:750  copyValue(r, a)
  mv a0, s3
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:751  pop()
  call pop
  ; sci/eval.e16.ts:752  pair(a, b)
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

; sci/eval.e16.ts:756 rectangular(a, b, at) at -O1
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
  ; sci/eval.e16.ts:757  const x = push(at)
  mv a0, s1
  call push
  mv s0, a0 ; x
  ; sci/eval.e16.ts:758  copyValue(b, x)
  mv a0, s3
  mv a1, s0
  call copyValue
  ; sci/eval.e16.ts:759  math(M_COS, x, 0, at)
  li a0, 23
  mv a1, s0
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:760  math(M_MUL, x, a, at)
  li a0, 3
  mv a1, s0
  mv a2, s2
  mv a3, s1
  call math
  ; sci/eval.e16.ts:761  math(M_SIN, b, 0, at)
  li a0, 22
  mv a1, s3
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:762  math(M_MUL, b, a, at)
  li a0, 3
  mv a1, s3
  mv a2, s2
  mv a3, s1
  call math
  ; sci/eval.e16.ts:763  copyValue(x, a)
  mv a0, s0
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:764  pop()
  call pop
  ; sci/eval.e16.ts:765  pair(a, b)
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

; sci/eval.e16.ts:769 pair(first, second) at -O1
;   first in s1
;   second in s2
pair:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; first
  mv s2, a1 ; second
  ; sci/eval.e16.ts:770  inexact(first)
  mv a0, s1
  call inexact
  ; sci/eval.e16.ts:771  inexact(second)
  mv a0, s2
  call inexact
  ; sci/eval.e16.ts:772  copyValue(first, varAt(0x58))
  mv a0, s1
  li a1, 3336
  call copyValue
  ; sci/eval.e16.ts:773  copyValue(second, varAt(0x59))
  mv a0, s2
  li a1, 3372
  call copyValue
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:776 trig(op, which, x, at) at -O1
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
  ; sci/eval.e16.ts:777  math(op, x, 0, at)
  mv a0, s2
  mv a1, s1
  li a2, 0
  mv a3, s0
  call math
  ; sci/eval.e16.ts:778  exactTrig(which, x, addr(argument))
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

; sci/eval.e16.ts:782 cubeRoot(x, at) at -O1
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
  ; sci/eval.e16.ts:783  if (isZero(x)) return
  mv a0, s2
  call isZero
  beqz a0, .L1
  ; sci/eval.e16.ts:783  return
  j .return
.L1:
  ; sci/eval.e16.ts:784  const negative = isNegative(x)
  mv a0, s2
  call isNegative
  mv s3, a0 ; negative
  ; sci/eval.e16.ts:785  if (negative) math(M_NEG, x, 0, at)
  beqz s3, .L2
  ; sci/eval.e16.ts:785  math(M_NEG, x, 0, at)
  li a0, 16
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
.L2:
  ; sci/eval.e16.ts:786  const third = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  mv s0, a0 ; third
  ; sci/eval.e16.ts:787  pushInt(3, at)
  li a0, 3
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:788  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:789  math(M_POW, x, third, at)
  li a0, 5
  mv a1, s2
  mv a2, s0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:790  pop()
  call pop
  ; sci/eval.e16.ts:791  if (negative) math(M_NEG, x, 0, at)
  beqz s3, .L3
  ; sci/eval.e16.ts:791  math(M_NEG, x, 0, at)
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
; sci/screens.e16.ts:80 errorScreen(code) at -O1
;   code in s1
errorScreen:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; code
  ; sci/screens.e16.ts:81  if (code === E_MATH) {
  li t0, 1
  bne s1, t0, .L1
  ; sci/screens.e16.ts:82  band(str('ERR:MATH'))
  la a0, str_70
  call band
  ; sci/screens.e16.ts:83  textAt(str("OUT OF A FUNCTION'S"), 1, lineY(0))
  la a0, str_71
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:84  textAt(str('RANGE, OR /0'), 1, lineY(1))
  la a0, str_72
  li a1, 1
  li a2, 20
  call textAt
  j .L2
.L1:
  ; sci/screens.e16.ts:85  if (code === E_FIND) {
  li t0, 4
  bne s1, t0, .L3
  ; sci/screens.e16.ts:86  band(str('ERR:FIND'))
  la a0, str_73
  call band
  ; sci/screens.e16.ts:87  textAt(str('NO X WAS FOUND FROM'), 1, lineY(0))
  la a0, str_74
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:88  textAt(str('THE X IT STARTED AT'), 1, lineY(1))
  la a0, str_75
  li a1, 1
  li a2, 20
  call textAt
  j .L4
.L3:
  ; sci/screens.e16.ts:89  if (code === E_RANGE) {
  li t0, 5
  bne s1, t0, .L5
  ; sci/screens.e16.ts:90  band(str('ERR:RANGE'))
  la a0, str_76
  call band
  ; sci/screens.e16.ts:91  textAt(str('1-30 ROWS FROM START'), 1, lineY(0))
  la a0, str_77
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:92  textAt(str('TO END BY STEP'), 1, lineY(1))
  la a0, str_78
  li a1, 1
  li a2, 20
  call textAt
  j .L6
.L5:
  ; sci/screens.e16.ts:93  if (code === E_STACK) {
  li t0, 3
  bne s1, t0, .L7
  ; sci/screens.e16.ts:94  band(str('ERR:STACK'))
  la a0, str_79
  call band
  ; sci/screens.e16.ts:95  textAt(str('TOO MANY BRACKETS OR'), 1, lineY(0))
  la a0, str_80
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:96  textAt(str('FUNCTIONS IN A LINE'), 1, lineY(1))
  la a0, str_81
  li a1, 1
  li a2, 20
  call textAt
  j .L8
.L7:
  ; sci/screens.e16.ts:98  band(str('ERR:SYNTAX'))
  la a0, str_82
  call band
  ; sci/screens.e16.ts:99  textAt(str('CANNOT READ THE LINE'), 1, lineY(0))
  la a0, str_83
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:100  textAt(str('AT THE CURSOR'), 1, lineY(1))
  la a0, str_84
  li a1, 1
  li a2, 20
  call textAt
.L8:
.L6:
.L4:
.L2:
  ; sci/screens.e16.ts:102  textAt(str('\x8c\x8b:BACK TO THE LINE'), 1, lineY(4))
  la a0, str_85
  li a1, 1
  li a2, 47
  call textAt
  ; sci/screens.e16.ts:103  textAt(str('AC:CLEAR'), 1, lineY(5))
  la a0, str_86
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:109 menuScreen(mode) at -O1
;   mode in s1
menuScreen:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; mode
  ; sci/screens.e16.ts:110  cls()
  call cls
  ; sci/screens.e16.ts:111  band(str('MENU'))
  la a0, str_87
  call band
  ; sci/screens.e16.ts:112  textAt(str('1:CALC    2:STATS'), 1, lineY(0))
  la a0, str_88
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:113  textAt(str('3:BASE    4:TABLE'), 1, lineY(1))
  la a0, str_89
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:114  textAt(str('5:EQUATION'), 1, lineY(2))
  la a0, str_90
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:115  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_91
  li a1, 1
  li a2, 56
  call textAt
  ; sci/screens.e16.ts:116  if (mode === 0) mark(0, 6, 0)
  bne s1, zero, .L1
  ; sci/screens.e16.ts:116  mark(0, 6, 0)
  li a0, 0
  li a1, 6
  li a2, 0
  call mark
  j .L2
.L1:
  ; sci/screens.e16.ts:117  if (mode === 1) mark(10, 7, 0)
  li t0, 1
  bne s1, t0, .L3
  ; sci/screens.e16.ts:117  mark(10, 7, 0)
  li a0, 10
  li a1, 7
  li a2, 0
  call mark
  j .L4
.L3:
  ; sci/screens.e16.ts:118  if (mode === 2) mark(0, 6, 1)
  li t0, 2
  bne s1, t0, .L5
  ; sci/screens.e16.ts:118  mark(0, 6, 1)
  li a0, 0
  li a1, 6
  li a2, 1
  call mark
  j .L6
.L5:
  ; sci/screens.e16.ts:119  if (mode === 3) mark(10, 7, 1)
  li t0, 3
  bne s1, t0, .L7
  ; sci/screens.e16.ts:119  mark(10, 7, 1)
  li a0, 10
  li a1, 7
  li a2, 1
  call mark
  j .L8
.L7:
  ; sci/screens.e16.ts:120  mark(0, 10, 2)
  li a0, 0
  li a1, 10
  li a2, 2
  call mark
.L8:
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:124 menuKey(k/d) at -O1
;   k/d in s1
menuKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/d
  ; sci/screens.e16.ts:125  if (k === K_AC) return 0xff
  li t0, 5
  bne s1, t0, .L1
  ; sci/screens.e16.ts:125  return 0xff
  li a0, 255
  j .return
.L1:
  ; sci/screens.e16.ts:126  const d = digitOf(k)
  mv a0, s1
  call digitOf
  mv s1, a0 ; k/d
  ; sci/screens.e16.ts:127  if (d >= 1 && d <= 5) return d
  li t0, 1
  bltu s1, t0, .L2
  li t0, 5
  bltu t0, s1, .L2
  ; sci/screens.e16.ts:127  return d
  mv a0, s1
  j .return
.L2:
  ; sci/screens.e16.ts:128  refuse()
  call refuse
  ; sci/screens.e16.ts:129  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:139 setupScreen() at -O1
setupScreen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/screens.e16.ts:140  page = 0
  sw zero, 0x05c0(zero)
  ; sci/screens.e16.ts:141  asking = 0
  sw zero, 0x05c2(zero)
  ; sci/screens.e16.ts:142  drawSetup()
  call drawSetup
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/screens.e16.ts:151 drawSetup() at -O1
drawSetup:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/screens.e16.ts:152  cls()
  call cls
  ; sci/screens.e16.ts:153  bandWith(str('SETUP'), page === 0 ? str('1/2') : str('2/2'))
  lw t1, 0x05c0(zero)
  la t0, str_92
  li t2, 0
  bne t1, t2, .L1
  la t1, str_93
  j .L2
.L1:
  la t1, str_94
.L2:
  mv a0, t0
  mv a1, t1
  call bandWith
  ; sci/screens.e16.ts:154  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_91
  li a1, 1
  li a2, 56
  call textAt
  ; sci/screens.e16.ts:155  if (page === 1) {
  lw t0, 0x05c0(zero)
  li t1, 1
  bne t0, t1, .L3
  ; sci/screens.e16.ts:156  textAt(str('1:a/b  2:a b/c'), 1, lineY(0))
  la a0, str_95
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:157  if (peek(KEEP_MIXED) === 1) mark(7, 7, 0)
  lbu t0, 3079(zero)
  li t1, 1
  bne t0, t1, .L4
  ; sci/screens.e16.ts:157  mark(7, 7, 0)
  li a0, 7
  li a1, 7
  li a2, 0
  call mark
  j .L5
.L4:
  ; sci/screens.e16.ts:158  mark(0, 5, 0)
  li a0, 0
  li a1, 5
  li a2, 0
  call mark
.L5:
  ; sci/screens.e16.ts:159  textAt(str('CONTRAST'), 1, lineY(2))
  la a0, str_96
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:160  contrastBar()
  call contrastBar
  ; sci/screens.e16.ts:161  textAt(clearing ? str('=:CLEAR ALL?') : str('3:CLEAR MEMORY'), 1, lineY(3))
  lw t0, 0x05c6(zero)
  beqz t0, .L6
  la t0, str_97
  j .L7
.L6:
  la t0, str_98
.L7:
  mv a0, t0
  li a1, 1
  li a2, 38
  call textAt
  ; sci/screens.e16.ts:162  textAt(str('\x8c\x8b:CONTRAST'), 1, lineY(4))
  la a0, str_99
  li a1, 1
  li a2, 47
  call textAt
  ; sci/screens.e16.ts:163  return
  j .return
.L3:
  ; sci/screens.e16.ts:165  textAt(str('1:2D  2:LINE'), 1, lineY(0))
  la a0, str_100
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:166  textAt(str('3:DEG 4:RAD 5:GRAD'), 1, lineY(1))
  la a0, str_101
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:167  textAt(str('6:EXACT 7:DECIMAL'), 1, lineY(2))
  la a0, str_102
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:168  textAt(str('8:FIX 9:EXP 0:AUTO'), 1, lineY(3))
  la a0, str_103
  li a1, 1
  li a2, 38
  call textAt
  ; sci/screens.e16.ts:169  marksOfPage1()
  call marksOfPage1
  ; sci/screens.e16.ts:170  drawDigits()
  call drawDigits
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/screens.e16.ts:173 marksOfPage1() at -O1
;   angle/shape in s1
marksOfPage1:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/screens.e16.ts:174  if (peek(KEEP_DISPLAY) === 1) mark(6, 6, 0)
  lbu t0, 3075(zero)
  li t1, 1
  bne t0, t1, .L1
  ; sci/screens.e16.ts:174  mark(6, 6, 0)
  li a0, 6
  li a1, 6
  li a2, 0
  call mark
  j .L2
.L1:
  ; sci/screens.e16.ts:175  mark(0, 4, 0)
  li a0, 0
  li a1, 4
  li a2, 0
  call mark
.L2:
  ; sci/screens.e16.ts:176  const angle = peek(KEEP_ANGLE)
  lbu s1, 3074(zero)
  ; sci/screens.e16.ts:177  if (angle === 1) mark(6, 5, 1)
  li t0, 1
  bne s1, t0, .L3
  ; sci/screens.e16.ts:177  mark(6, 5, 1)
  li a0, 6
  li a1, 5
  li a2, 1
  call mark
  j .L4
.L3:
  ; sci/screens.e16.ts:178  if (angle === 2) mark(12, 6, 1)
  li t0, 2
  bne s1, t0, .L5
  ; sci/screens.e16.ts:178  mark(12, 6, 1)
  li a0, 12
  li a1, 6
  li a2, 1
  call mark
  j .L6
.L5:
  ; sci/screens.e16.ts:179  mark(0, 5, 1)
  li a0, 0
  li a1, 5
  li a2, 1
  call mark
.L6:
.L4:
  ; sci/screens.e16.ts:180  if (peek(KEEP_ANSWER) === 1) mark(8, 9, 2)
  lbu t0, 3076(zero)
  li t1, 1
  bne t0, t1, .L7
  ; sci/screens.e16.ts:180  mark(8, 9, 2)
  li a0, 8
  li a1, 9
  li a2, 2
  call mark
  j .L8
.L7:
  ; sci/screens.e16.ts:181  mark(0, 7, 2)
  li a0, 0
  li a1, 7
  li a2, 2
  call mark
.L8:
  ; sci/screens.e16.ts:182  const shape = peek(KEEP_FORMAT)
  lbu s1, 3077(zero)
  ; sci/screens.e16.ts:183  if (shape === FORMAT_FIX) mark(0, 5, 3)
  li t0, 1
  bne s1, t0, .L9
  ; sci/screens.e16.ts:183  mark(0, 5, 3)
  li a0, 0
  li a1, 5
  li a2, 3
  call mark
  j .L10
.L9:
  ; sci/screens.e16.ts:184  if (shape === FORMAT_EXP) mark(6, 5, 3)
  li t0, 2
  bne s1, t0, .L11
  ; sci/screens.e16.ts:184  mark(6, 5, 3)
  li a0, 6
  li a1, 5
  li a2, 3
  call mark
  j .L12
.L11:
  ; sci/screens.e16.ts:185  mark(12, 6, 3)
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

; sci/screens.e16.ts:189 contrastBar() at -O1
;   now in 0(sp)
;   y in s3
;   k in s1
;   x in s0
;   row in s2
contrastBar:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  sw s0, 8(sp)
  sw s2, 10(sp)
  ; sci/screens.e16.ts:190  const now = peek16(IO_CONTRAST)
  li t0, 65320
  lw t0, 0(t0)
  sw t0, 0(sp) ; now
  ; sci/screens.e16.ts:191  const y = lineY(2)
  li s3, 29 ; y
  ; sci/screens.e16.ts:192  for (let k: u16 = 0; k < 16; k++) {
  li s1, 0 ; k
  j .L3
.L1:
  ; sci/screens.e16.ts:193  const x = 56 + k * 4
  slli t0, s1, 2
  addi s0, t0, 56
  ; sci/screens.e16.ts:194  for (let row: u16 = k <= now ? 0 : 6; row < 7; row++) {
  lw t0, 0(sp) ; now
  bltu t0, s1, .L5
  li t0, 0
  j .L6
.L5:
  li t0, 6
.L6:
  mv s2, t0 ; row
  j .L9
.L7:
  ; sci/screens.e16.ts:195  dot(x, y + row)
  add a1, s3, s2
  mv a0, s0
  call dot
  ; sci/screens.e16.ts:196  dot(x + 1, y + row)
  add a1, s3, s2
  addi a0, s0, 1
  call dot
  addi s2, s2, 1
.L9:
  li t0, 7
  bltu s2, t0, .L7
  addi s1, s1, 1
.L3:
  li t0, 16
  bltu s1, t0, .L1
.return:
  lw ra, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s0, 8(sp)
  lw s2, 10(sp)
  addi sp, sp, 12
  ret

; sci/screens.e16.ts:202 contrastStep(up/next) at -O1
;   up/next in s1
;   now in s2
contrastStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; up/next
  ; sci/screens.e16.ts:203  const now = peek16(IO_CONTRAST)
  li t0, 65320
  lw s2, 0(t0)
  ; sci/screens.e16.ts:204  if (up ? now >= 15 : now === 0) {
  beqz s1, .L2
  li t0, 15
  sltu t0, s2, t0
  xori t0, t0, 1
  j .L3
.L2:
  sub t0, s2, zero
  seqz t0, t0
.L3:
  beqz t0, .L1
  ; sci/screens.e16.ts:205  refuse()
  call refuse
  ; sci/screens.e16.ts:206  return
  j .return
.L1:
  ; sci/screens.e16.ts:208  const next = up ? now + 1 : now - 1
  beqz s1, .L4
  addi t0, s2, 1
  j .L5
.L4:
  addi t0, s2, -1
.L5:
  mv s1, t0 ; up/next
  ; sci/screens.e16.ts:209  poke16(IO_CONTRAST, next)
  li t0, 65320
  sw s1, 0(t0)
  ; sci/screens.e16.ts:210  poke(KEEP_CONTRAST, next + 1)
  addi t0, s1, 1
  sb t0, 3117(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/screens.e16.ts:214 drawDigits() at -O1
;   shape in s1
drawDigits:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/screens.e16.ts:215  const shape = asking !== 0 ? asking : peek(KEEP_FORMAT)
  lw t0, 0x05c2(zero)
  beq t0, zero, .L1
  lw t0, 0x05c2(zero)
  j .L2
.L1:
  lbu t0, 3077(zero)
.L2:
  mv s1, t0 ; shape
  ; sci/screens.e16.ts:216  if (shape === FORMAT_AUTO) return
  bne s1, zero, .L3
  ; sci/screens.e16.ts:216  return
  j .return
.L3:
  ; sci/screens.e16.ts:217  if (shape === FORMAT_AUTO2) {
  li t0, 3
  bne s1, t0, .L4
  ; sci/screens.e16.ts:218  textAt(str('AUTO2'), 1, lineY(4))
  la a0, str_104
  li a1, 1
  li a2, 47
  call textAt
  ; sci/screens.e16.ts:219  return
  j .return
.L4:
  ; sci/screens.e16.ts:221  textAt(shape === FORMAT_FIX ? str('FIX') : str('EXP'), 1, lineY(4))
  li t0, 1
  bne s1, t0, .L5
  la t0, str_105
  j .L6
.L5:
  la t0, str_106
.L6:
  mv a0, t0
  li a1, 1
  li a2, 47
  call textAt
  ; sci/screens.e16.ts:222  if (asking !== 0) textAt(str('0-9?'), 25, lineY(4))
  lw t0, 0x05c2(zero)
  beq t0, zero, .L7
  ; sci/screens.e16.ts:222  textAt(str('0-9?'), 25, lineY(4))
  la a0, str_107
  li a1, 25
  li a2, 47
  call textAt
  j .L8
.L7:
  ; sci/screens.e16.ts:224  digitText[0] = 0x30 + peek(KEEP_DIGITS)
  lbu t0, 3078(zero)
  addi t0, t0, 48
  sb t0, digitText(zero)
  ; sci/screens.e16.ts:225  digitText[1] = 0
  sb zero, digitText+1(zero)
  ; sci/screens.e16.ts:226  textAt(addr(digitText), 25, lineY(4))
  la a0, digitText
  li a1, 25
  li a2, 47
  call textAt
.L8:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:233 setupKey(k/d) at -O1
;   k/d in s1
setupKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/d
  ; sci/screens.e16.ts:234  if (clearing) {
  lw t0, 0x05c6(zero)
  beqz t0, .L1
  ; sci/screens.e16.ts:236  clearing = false
  sw zero, 0x05c6(zero)
  ; sci/screens.e16.ts:237  if (k === K_EQ) clearMemory()
  li t0, 4
  bne s1, t0, .L2
  ; sci/screens.e16.ts:237  clearMemory()
  call clearMemory
.L2:
  ; sci/screens.e16.ts:238  drawSetup()
  call drawSetup
  ; sci/screens.e16.ts:239  return 0
  li a0, 0
  j .return
.L1:
  ; sci/screens.e16.ts:241  if (k === K_AC) return 1
  li t0, 5
  bne s1, t0, .L3
  ; sci/screens.e16.ts:241  return 1
  li a0, 1
  j .return
.L3:
  ; sci/screens.e16.ts:242  if (asking !== 0) {
  lw t0, 0x05c2(zero)
  beq t0, zero, .L4
  ; sci/screens.e16.ts:243  const d = digitOf(k)
  mv a0, s1
  call digitOf
  mv s1, a0 ; k/d
  ; sci/screens.e16.ts:244  if (d === 0xffff) {
  li t0, 65535
  bne s1, t0, .L5
  ; sci/screens.e16.ts:245  refuse()
  call refuse
  ; sci/screens.e16.ts:246  return 0
  li a0, 0
  j .return
.L5:
  ; sci/screens.e16.ts:248  poke(KEEP_FORMAT, asking)
  lw t0, 0x05c2(zero)
  sb t0, 3077(zero)
  ; sci/screens.e16.ts:249  poke(KEEP_DIGITS, d)
  sb s1, 3078(zero)
  ; sci/screens.e16.ts:250  asking = 0
  sw zero, 0x05c2(zero)
  j .L6
.L4:
  ; sci/screens.e16.ts:251  if (k === K_DOWN || k === K_UP) page = k === K_DOWN ? 1 : 0
  li t0, 1
  beq s1, t0, .L8
  bne s1, zero, .L7
.L8:
  ; sci/screens.e16.ts:251  page = k === K_DOWN ? 1 : 0
  li t0, 1
  bne s1, t0, .L9
  li t0, 1
  j .L10
.L9:
  li t0, 0
.L10:
  sw t0, 0x05c0(zero)
  j .L11
.L7:
  ; sci/screens.e16.ts:252  if (page === 1 && (k === K_LEFT || k === K_RIGHT)) contrastStep(k === K_RIGHT)
  lw t0, 0x05c0(zero)
  li t1, 1
  bne t0, t1, .L12
  li t0, 2
  beq s1, t0, .L13
  li t0, 3
  bne s1, t0, .L12
.L13:
  ; sci/screens.e16.ts:252  contrastStep(k === K_RIGHT)
  li t0, 3
  sub t0, s1, t0
  seqz a0, t0
  call contrastStep
  j .L14
.L12:
  ; sci/screens.e16.ts:253  if (!setupChoice(k)) {
  mv a0, s1
  call setupChoice
  bnez a0, .L15
  ; sci/screens.e16.ts:254  refuse()
  call refuse
  ; sci/screens.e16.ts:255  return 0
  li a0, 0
  j .return
.L15:
.L14:
.L11:
.L6:
  ; sci/screens.e16.ts:257  drawSetup()
  call drawSetup
  ; sci/screens.e16.ts:258  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:262 setupChoice(k) at -O1
;   k in s1
setupChoice:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/screens.e16.ts:263  if (page === 1) return mixedChoice(k)
  lw t0, 0x05c0(zero)
  li t1, 1
  bne t0, t1, .L1
  ; sci/screens.e16.ts:263  return mixedChoice(k)
  mv a0, s1
  call mixedChoice
  j .return
.L1:
  ; sci/screens.e16.ts:264  switch (k) {
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
  ; sci/screens.e16.ts:267  poke(KEEP_DISPLAY, k === K_1 ? 0 : 1)
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
  ; sci/screens.e16.ts:268  return true
  li a0, 1
  j .return
.L5:
.L6:
.L7:
  ; sci/screens.e16.ts:272  poke(KEEP_ANGLE, k === K_3 ? 0 : k === K_4 ? 1 : 2)
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
  ; sci/screens.e16.ts:273  return true
  li a0, 1
  j .return
.L8:
.L9:
  ; sci/screens.e16.ts:276  poke(KEEP_ANSWER, k === K_6 ? 0 : 1)
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
  ; sci/screens.e16.ts:277  return true
  li a0, 1
  j .return
.L10:
.L11:
  ; sci/screens.e16.ts:280  asking = k === K_8 ? FORMAT_FIX : FORMAT_EXP
  li t0, 41
  bne s1, t0, .L21
  li t0, 1
  j .L22
.L21:
  li t0, 2
.L22:
  sw t0, 0x05c2(zero)
  ; sci/screens.e16.ts:281  return true
  li a0, 1
  j .return
.L12:
  ; sci/screens.e16.ts:283  poke(KEEP_FORMAT, peek(KEEP_FORMAT) === FORMAT_AUTO ? FORMAT_AUTO2 : FORMAT_AUTO)
  lbu t1, 3077(zero)
  li t0, 3077
  li t2, 0
  bne t1, t2, .L23
  li t1, 3
  j .L24
.L23:
  li t1, 0
.L24:
  sb t1, 0(t0)
  ; sci/screens.e16.ts:284  return true
  li a0, 1
  j .return
.L2:
  ; sci/screens.e16.ts:286  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:290 mixedChoice(k) at -O1
;   k in a0
mixedChoice:
  ; sci/screens.e16.ts:291  if (k === K_3) {
  li t0, 58
  bne a0, t0, .L1
  ; sci/screens.e16.ts:292  clearing = true
  li t0, 1
  sw t0, 0x05c6(zero)
  ; sci/screens.e16.ts:293  return true
  li a0, 1
  ret
.L1:
  ; sci/screens.e16.ts:295  if (k !== K_1 && k !== K_2) return false
  li t0, 56
  beq a0, t0, .L2
  li t0, 57
  beq a0, t0, .L2
  ; sci/screens.e16.ts:295  return false
  li a0, 0
  ret
.L2:
  ; sci/screens.e16.ts:296  poke(KEEP_MIXED, k === K_1 ? 0 : 1)
  li t0, 3079
  mv t1, a0
  li t2, 56
  bne t1, t2, .L3
  li t1, 0
  j .L4
.L3:
  li t1, 1
.L4:
  sb t1, 0(t0)
  ; sci/screens.e16.ts:297  return true
  li a0, 1
.return:
  ret

; sci/screens.e16.ts:304 clearMemory() at -O1
;   i in a0
clearMemory:
  ; sci/screens.e16.ts:305  for (let i: u16 = 0; i < VALUE_SIZE; i++) poke(KEEP_ANS + i, 0)
  li a0, 0 ; i
  j .L3
.L1:
  ; sci/screens.e16.ts:305  poke(KEEP_ANS + i, 0)
  sb zero, 3080(a0)
  addi a0, a0, 1
.L3:
  li t0, 36
  bltu a0, t0, .L1
  ; sci/screens.e16.ts:306  for (let i: u16 = 0; i < 9 * VALUE_SIZE; i++) poke(KEEP_VARS + i, 0)
  li a0, 0 ; i
  j .L7
.L5:
  ; sci/screens.e16.ts:306  poke(KEEP_VARS + i, 0)
  sb zero, 3120(a0)
  addi a0, a0, 1
.L7:
  li t0, 324
  bltu a0, t0, .L5
  ; sci/screens.e16.ts:307  poke16(STATS_COUNT, 0)
  sw zero, 5634(zero)
.return:
  ret

; sci/screens.e16.ts:321 funcScreen() at -O1
funcScreen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/screens.e16.ts:322  funcPage = 0
  sw zero, 0x05c8(zero)
  ; sci/screens.e16.ts:323  drawFuncPage()
  call drawFuncPage
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/screens.e16.ts:328 drawFuncPage() at -O1
drawFuncPage:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/screens.e16.ts:329  cls()
  call cls
  ; sci/screens.e16.ts:330  funcPageText[0] = 0x31 + funcPage
  lw t0, 0x05c8(zero)
  addi t0, t0, 49
  sb t0, funcPageText(zero)
  ; sci/screens.e16.ts:331  funcPageText[1] = 0x2f
  li t0, 47
  sb t0, funcPageText+1(zero)
  ; sci/screens.e16.ts:332  funcPageText[2] = 0x30 + FUNC_PAGES
  li t0, 52
  sb t0, funcPageText+2(zero)
  ; sci/screens.e16.ts:333  funcPageText[3] = 0
  sb zero, funcPageText+3(zero)
  ; sci/screens.e16.ts:334  bandWith(funcTitle(), addr(funcPageText))
  ; sci/screens.e16.ts:358  if (funcPage === 0) return str('FUNC')
  lw t0, 0x05c8(zero)
  bne t0, zero, .I1.L1
  ; sci/screens.e16.ts:358  return str('FUNC')
  la t0, str_123
  j .I1_end
.I1.L1:
  ; sci/screens.e16.ts:359  return funcPage === 1 ? str('FUNC RANDOM') : str('FUNC STATS')
  lw t0, 0x05c8(zero)
  li t1, 1
  bne t0, t1, .I1.L2
  la t0, str_124
  j .I1_end
.I1.L2:
  la t0, str_125
.I1_end:
  mv a0, t0
  la a1, funcPageText
  call bandWith
  ; sci/screens.e16.ts:335  if (funcPage === 0) {
  lw t0, 0x05c8(zero)
  bne t0, zero, .L1
  ; sci/screens.e16.ts:336  textAt(str('1:gcd(   2:lcm('), 1, lineY(0))
  la a0, str_108
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:337  textAt(str('3:%      4:int('), 1, lineY(1))
  la a0, str_109
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:338  textAt(str('5:round( 6:pol('), 1, lineY(2))
  la a0, str_110
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:339  textAt(str('7:rec('), 1, lineY(3))
  la a0, str_111
  li a1, 1
  li a2, 38
  call textAt
  j .L2
.L1:
  ; sci/screens.e16.ts:340  if (funcPage === 1) {
  lw t0, 0x05c8(zero)
  li t1, 1
  bne t0, t1, .L3
  ; sci/screens.e16.ts:341  textAt(str('1:rand   2:dice'), 1, lineY(0))
  la a0, str_112
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:342  textAt(str('3:coin   4:rint'), 1, lineY(1))
  la a0, str_113
  li a1, 1
  li a2, 20
  call textAt
  j .L4
.L3:
  ; sci/screens.e16.ts:343  if (funcPage === 2) {
  lw t0, 0x05c8(zero)
  li t1, 2
  bne t0, t1, .L5
  ; sci/screens.e16.ts:344  textAt(str('1:n    2:\x95    3:\x91x'), 1, lineY(0))
  la a0, str_114
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:345  textAt(str('4:sx   5:\x96    6:\x91y'), 1, lineY(1))
  la a0, str_115
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:346  textAt(str('7:sy   8:r    9:a'), 1, lineY(2))
  la a0, str_116
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:347  textAt(str('0:b'), 1, lineY(3))
  la a0, str_117
  li a1, 1
  li a2, 38
  call textAt
  j .L6
.L5:
  ; sci/screens.e16.ts:349  textAt(str('1:\x90x   2:\x90x\x84'), 1, lineY(0))
  la a0, str_118
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:350  textAt(str('3:\x90y   4:\x90y\x84'), 1, lineY(1))
  la a0, str_119
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:351  textAt(str('5:\x90xy  6:x\x89(  7:y\x89('), 1, lineY(2))
  la a0, str_120
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:352  textAt(str('8:c    9:x\x93\x89('), 1, lineY(3))
  la a0, str_121
  li a1, 1
  li a2, 38
  call textAt
.L6:
.L4:
.L2:
  ; sci/screens.e16.ts:354  textAt(str('\x8d\x8e:PAGE AC:BACK'), 1, lineY(5))
  la a0, str_122
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/screens.e16.ts:363 funcKey(k/t) at -O1
;   k/t in s1
funcKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/t
  ; sci/screens.e16.ts:364  if (k === K_AC) return 1
  li t0, 5
  bne s1, t0, .L1
  ; sci/screens.e16.ts:364  return 1
  li a0, 1
  j .return
.L1:
  ; sci/screens.e16.ts:365  if (k === K_DOWN || k === K_UP) {
  li t0, 1
  beq s1, t0, .L3
  bne s1, zero, .L2
.L3:
  ; sci/screens.e16.ts:366  if (k === K_DOWN && funcPage + 1 < FUNC_PAGES) funcPage++
  li t0, 1
  bne s1, t0, .L4
  lw t0, 0x05c8(zero)
  li t1, 4
  addi t0, t0, 1
  bgeu t0, t1, .L4
  ; sci/screens.e16.ts:366  funcPage++
  lw t0, 0x05c8(zero)
  addi t0, t0, 1
  sw t0, 0x05c8(zero)
  j .L5
.L4:
  ; sci/screens.e16.ts:367  if (k === K_UP && funcPage > 0) funcPage--
  bne s1, zero, .L6
  lw t0, 0x05c8(zero)
  bgeu zero, t0, .L6
  ; sci/screens.e16.ts:367  funcPage--
  lw t0, 0x05c8(zero)
  addi t0, t0, -1
  sw t0, 0x05c8(zero)
  j .L7
.L6:
  ; sci/screens.e16.ts:368  refuse()
  call refuse
.L7:
.L5:
  ; sci/screens.e16.ts:369  drawFuncPage()
  call drawFuncPage
  ; sci/screens.e16.ts:370  return 0
  li a0, 0
  j .return
.L2:
  ; sci/screens.e16.ts:372  const t = pageToken(digitOf(k))
  mv a0, s1
  call digitOf
  call pageToken
  mv s1, a0 ; k/t
  ; sci/screens.e16.ts:373  if (t === 0) refuse()
  bne s1, zero, .L8
  ; sci/screens.e16.ts:373  refuse()
  call refuse
.L8:
  ; sci/screens.e16.ts:374  return t
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:377 pageToken(d) at -O1
;   d in s1
pageToken:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; d
  ; sci/screens.e16.ts:378  if (funcPage === 0) return funcToken(d)
  lw t0, 0x05c8(zero)
  bne t0, zero, .L1
  ; sci/screens.e16.ts:378  return funcToken(d)
  mv a0, s1
  call funcToken
  j .return
.L1:
  ; sci/screens.e16.ts:379  if (funcPage === 1) return randomToken(d)
  lw t0, 0x05c8(zero)
  li t1, 1
  bne t0, t1, .L2
  ; sci/screens.e16.ts:379  return randomToken(d)
  mv a0, s1
  call randomToken
  j .return
.L2:
  ; sci/screens.e16.ts:380  return funcPage === 2 ? statToken(d) : sumToken(d)
  lw t0, 0x05c8(zero)
  li t1, 2
  bne t0, t1, .L3
  mv a0, s1
  call statToken
  mv t0, a0
  j .L4
.L3:
  mv a0, s1
  call sumToken
  mv t0, a0
.L4:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:384 funcToken(d) at -O1
;   d in a0
funcToken:
  ; sci/screens.e16.ts:385  switch (d) {
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
  j .L1
.L2:
  ; sci/screens.e16.ts:387  return T_GCD
  li a0, 231
  ret
.L3:
  ; sci/screens.e16.ts:389  return T_LCM
  li a0, 232
  ret
.L4:
  ; sci/screens.e16.ts:391  return T_PERCENT
  li a0, 37
  ret
.L5:
  ; sci/screens.e16.ts:393  return T_INT
  li a0, 233
  ret
.L6:
  ; sci/screens.e16.ts:395  return T_RND
  li a0, 234
  ret
.L7:
  ; sci/screens.e16.ts:397  return T_POL
  li a0, 235
  ret
.L8:
  ; sci/screens.e16.ts:399  return T_REC
  li a0, 236
  ret
.L1:
  ; sci/screens.e16.ts:401  return 0
  li a0, 0
.return:
  ret

; sci/screens.e16.ts:405 randomToken(d) at -O1
;   d in a0
randomToken:
  ; sci/screens.e16.ts:406  switch (d) {
  li t0, 1
  beq a0, t0, .L2
  li t0, 2
  beq a0, t0, .L3
  li t0, 3
  beq a0, t0, .L4
  li t0, 4
  beq a0, t0, .L5
  j .L1
.L2:
  ; sci/screens.e16.ts:408  return T_RAN
  li a0, 237
  ret
.L3:
  ; sci/screens.e16.ts:410  return T_DICE
  li a0, 12
  ret
.L4:
  ; sci/screens.e16.ts:412  return T_COIN
  li a0, 13
  ret
.L5:
  ; sci/screens.e16.ts:414  return T_RINT
  li a0, 14
  ret
.L1:
  ; sci/screens.e16.ts:416  return 0
  li a0, 0
.return:
  ret

; sci/screens.e16.ts:420 statToken(d) at -O1
;   d in s1
statToken:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; d
  ; sci/screens.e16.ts:421  if (d >= 1 && d <= 7) return statTokenOf(d - 1)
  li t0, 1
  bltu s1, t0, .L1
  li t0, 7
  bltu t0, s1, .L1
  ; sci/screens.e16.ts:421  return statTokenOf(d - 1)
  addi a0, s1, -1
  call statTokenOf
  j .return
.L1:
  ; sci/screens.e16.ts:422  if (d === 8 || d === 9) return statTokenOf(d + 4)
  li t0, 8
  beq s1, t0, .L3
  li t0, 9
  bne s1, t0, .L2
.L3:
  ; sci/screens.e16.ts:422  return statTokenOf(d + 4)
  addi a0, s1, 4
  call statTokenOf
  j .return
.L2:
  ; sci/screens.e16.ts:423  return d === 0 ? statTokenOf(14) : 0
  bne s1, zero, .L4
  li t0, 249
  j .L5
.L4:
  li t0, 0
.L5:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:427 sumToken(d) at -O1
;   d in s1
sumToken:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; d
  ; sci/screens.e16.ts:428  if (d >= 1 && d <= 5) return statTokenOf(d + 6)
  li t0, 1
  bltu s1, t0, .L1
  li t0, 5
  bltu t0, s1, .L1
  ; sci/screens.e16.ts:428  return statTokenOf(d + 6)
  addi a0, s1, 6
  call statTokenOf
  j .return
.L1:
  ; sci/screens.e16.ts:429  if (d === 6) return T_XEST
  li t0, 6
  bne s1, t0, .L2
  ; sci/screens.e16.ts:429  return T_XEST
  li a0, 250
  j .return
.L2:
  ; sci/screens.e16.ts:430  if (d === 7) return T_YEST
  li t0, 7
  bne s1, t0, .L3
  ; sci/screens.e16.ts:430  return T_YEST
  li a0, 251
  j .return
.L3:
  ; sci/screens.e16.ts:431  if (d === 8) return T_STAT_C
  li t0, 8
  bne s1, t0, .L4
  ; sci/screens.e16.ts:431  return T_STAT_C
  li a0, 252
  j .return
.L4:
  ; sci/screens.e16.ts:432  return d === 9 ? T_X2EST : 0
  li t0, 9
  bne s1, t0, .L5
  li t0, 253
  j .L6
.L5:
  li t0, 0
.L6:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:436 statTokenOf(k) at -O1
;   k in a0
statTokenOf:
  ; sci/screens.e16.ts:437  return k <= 8 ? T_STAT_N + k : 0xf4 + k - 9
  li t0, 8
  bltu t0, a0, .L1
  addi t0, a0, 151
  j .L2
.L1:
  addi t0, a0, 235
.L2:
  mv a0, t0
.return:
  ret

; sci/screens.e16.ts:441 digitOf(k) at -O1
;   k in a0
digitOf:
  ; sci/screens.e16.ts:442  if (k === K_0) return 0
  li t0, 59
  bne a0, t0, .L1
  ; sci/screens.e16.ts:442  return 0
  li a0, 0
  ret
.L1:
  ; sci/screens.e16.ts:443  if (k === K_1) return 1
  li t0, 56
  bne a0, t0, .L2
  ; sci/screens.e16.ts:443  return 1
  li a0, 1
  ret
.L2:
  ; sci/screens.e16.ts:444  if (k === K_2) return 2
  li t0, 57
  bne a0, t0, .L3
  ; sci/screens.e16.ts:444  return 2
  li a0, 2
  ret
.L3:
  ; sci/screens.e16.ts:445  if (k === K_3) return 3
  li t0, 58
  bne a0, t0, .L4
  ; sci/screens.e16.ts:445  return 3
  li a0, 3
  ret
.L4:
  ; sci/screens.e16.ts:446  if (k >= K_4 && k <= K_6) return 4 + k - K_4
  li t0, 48
  bltu a0, t0, .L5
  li t0, 50
  bltu t0, a0, .L5
  ; sci/screens.e16.ts:446  return 4 + k - K_4
  addi a0, a0, -44
  ret
.L5:
  ; sci/screens.e16.ts:447  if (k >= K_7 && k <= K_9) return 7 + k - K_7
  li t0, 40
  bltu a0, t0, .L6
  li t0, 42
  bltu t0, a0, .L6
  ; sci/screens.e16.ts:447  return 7 + k - K_7
  addi a0, a0, -33
  ret
.L6:
  ; sci/screens.e16.ts:448  return 0xffff
  li a0, 65535
.return:
  ret

; sci/screens.e16.ts:454 faultScreen(cause, pc) at -O1
;   cause in s1
;   pc in s2
faultScreen:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; cause
  mv s2, a1 ; pc
  ; sci/screens.e16.ts:455  if (cause === 0x800f || cause === 3) band(str('BREAK'))
  li t0, 32783
  beq s1, t0, .L2
  li t0, 3
  bne s1, t0, .L1
.L2:
  ; sci/screens.e16.ts:455  band(str('BREAK'))
  la a0, str_126
  call band
  j .L3
.L1:
  ; sci/screens.e16.ts:456  band(str('FAULT'))
  la a0, str_127
  call band
.L3:
  ; sci/screens.e16.ts:457  textAt(str('CAUSE'), 1, lineY(0))
  la a0, str_128
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:458  hexAt(cause, 43, lineY(0))
  mv a0, s1
  li a1, 43
  li a2, 11
  call hexAt
  ; sci/screens.e16.ts:459  textAt(str('AT'), 1, lineY(1))
  la a0, str_129
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:460  hexAt(pc, 43, lineY(1))
  mv a0, s2
  li a1, 43
  li a2, 20
  call hexAt
  ; sci/screens.e16.ts:461  textAt(str('AC:CLEAR'), 1, lineY(5))
  la a0, str_86
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/screens.e16.ts:466 hexAt(v, x, y) at -O1
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
  ; sci/screens.e16.ts:467  for (let s: u16 = 0; s < 4; s++) {
  li s1, 0 ; s
  j .L3
.L1:
  ; sci/screens.e16.ts:468  const d = (v >> (12 - s * 4)) & 15
  slli t0, s1, 2
  li t1, 12
  sub t1, t1, t0
  srl t1, s3, t1
  andi s2, t1, 15
  ; sci/screens.e16.ts:469  hexText[s] = d < 10 ? 0x30 + d : 0x37 + d
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
  ; sci/screens.e16.ts:471  hexText[4] = 0
  sb zero, hexText+4(zero)
  ; sci/screens.e16.ts:472  textAt(addr(hexText), x, y)
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

str_70:
  .byte 69, 82, 82, 58, 77, 65, 84, 72, 0
str_71:
  .byte 79, 85, 84, 32, 79, 70, 32, 65, 32, 70, 85, 78, 67, 84, 73, 79, 78, 39, 83, 0
str_72:
  .byte 82, 65, 78, 71, 69, 44, 32, 79, 82, 32, 47, 48, 0
str_73:
  .byte 69, 82, 82, 58, 70, 73, 78, 68, 0
str_74:
  .byte 78, 79, 32, 88, 32, 87, 65, 83, 32, 70, 79, 85, 78, 68, 32, 70, 82, 79, 77, 0
str_75:
  .byte 84, 72, 69, 32, 88, 32, 73, 84, 32, 83, 84, 65, 82, 84, 69, 68, 32, 65, 84, 0
str_76:
  .byte 69, 82, 82, 58, 82, 65, 78, 71, 69, 0
str_77:
  .byte 49, 45, 51, 48, 32, 82, 79, 87, 83, 32, 70, 82, 79, 77, 32, 83, 84, 65, 82, 84, 0
str_78:
  .byte 84, 79, 32, 69, 78, 68, 32, 66, 89, 32, 83, 84, 69, 80, 0
str_79:
  .byte 69, 82, 82, 58, 83, 84, 65, 67, 75, 0
str_80:
  .byte 84, 79, 79, 32, 77, 65, 78, 89, 32, 66, 82, 65, 67, 75, 69, 84, 83, 32, 79, 82, 0
str_81:
  .byte 70, 85, 78, 67, 84, 73, 79, 78, 83, 32, 73, 78, 32, 65, 32, 76, 73, 78, 69, 0
str_82:
  .byte 69, 82, 82, 58, 83, 89, 78, 84, 65, 88, 0
str_83:
  .byte 67, 65, 78, 78, 79, 84, 32, 82, 69, 65, 68, 32, 84, 72, 69, 32, 76, 73, 78, 69, 0
str_84:
  .byte 65, 84, 32, 84, 72, 69, 32, 67, 85, 82, 83, 79, 82, 0
str_85:
  .byte 140, 139, 58, 66, 65, 67, 75, 32, 84, 79, 32, 84, 72, 69, 32, 76, 73, 78, 69, 0
str_86:
  .byte 65, 67, 58, 67, 76, 69, 65, 82, 0
str_87:
  .byte 77, 69, 78, 85, 0
str_88:
  .byte 49, 58, 67, 65, 76, 67, 32, 32, 32, 32, 50, 58, 83, 84, 65, 84, 83, 0
str_89:
  .byte 51, 58, 66, 65, 83, 69, 32, 32, 32, 32, 52, 58, 84, 65, 66, 76, 69, 0
str_90:
  .byte 53, 58, 69, 81, 85, 65, 84, 73, 79, 78, 0
str_91:
  .byte 65, 67, 58, 66, 65, 67, 75, 0
str_92:
  .byte 83, 69, 84, 85, 80, 0
str_93:
  .byte 49, 47, 50, 0
str_94:
  .byte 50, 47, 50, 0
str_95:
  .byte 49, 58, 97, 47, 98, 32, 32, 50, 58, 97, 32, 98, 47, 99, 0
str_96:
  .byte 67, 79, 78, 84, 82, 65, 83, 84, 0
str_97:
  .byte 61, 58, 67, 76, 69, 65, 82, 32, 65, 76, 76, 63, 0
str_98:
  .byte 51, 58, 67, 76, 69, 65, 82, 32, 77, 69, 77, 79, 82, 89, 0
str_99:
  .byte 140, 139, 58, 67, 79, 78, 84, 82, 65, 83, 84, 0
str_100:
  .byte 49, 58, 50, 68, 32, 32, 50, 58, 76, 73, 78, 69, 0
str_101:
  .byte 51, 58, 68, 69, 71, 32, 52, 58, 82, 65, 68, 32, 53, 58, 71, 82, 65, 68, 0
str_102:
  .byte 54, 58, 69, 88, 65, 67, 84, 32, 55, 58, 68, 69, 67, 73, 77, 65, 76, 0
str_103:
  .byte 56, 58, 70, 73, 88, 32, 57, 58, 69, 88, 80, 32, 48, 58, 65, 85, 84, 79, 0
str_104:
  .byte 65, 85, 84, 79, 50, 0
str_105:
  .byte 70, 73, 88, 0
str_106:
  .byte 69, 88, 80, 0
str_107:
  .byte 48, 45, 57, 63, 0
str_108:
  .byte 49, 58, 103, 99, 100, 40, 32, 32, 32, 50, 58, 108, 99, 109, 40, 0
str_109:
  .byte 51, 58, 37, 32, 32, 32, 32, 32, 32, 52, 58, 105, 110, 116, 40, 0
str_110:
  .byte 53, 58, 114, 111, 117, 110, 100, 40, 32, 54, 58, 112, 111, 108, 40, 0
str_111:
  .byte 55, 58, 114, 101, 99, 40, 0
str_112:
  .byte 49, 58, 114, 97, 110, 100, 32, 32, 32, 50, 58, 100, 105, 99, 101, 0
str_113:
  .byte 51, 58, 99, 111, 105, 110, 32, 32, 32, 52, 58, 114, 105, 110, 116, 0
str_114:
  .byte 49, 58, 110, 32, 32, 32, 32, 50, 58, 149, 32, 32, 32, 32, 51, 58, 145, 120, 0
str_115:
  .byte 52, 58, 115, 120, 32, 32, 32, 53, 58, 150, 32, 32, 32, 32, 54, 58, 145, 121, 0
str_116:
  .byte 55, 58, 115, 121, 32, 32, 32, 56, 58, 114, 32, 32, 32, 32, 57, 58, 97, 0
str_117:
  .byte 48, 58, 98, 0
str_118:
  .byte 49, 58, 144, 120, 32, 32, 32, 50, 58, 144, 120, 132, 0
str_119:
  .byte 51, 58, 144, 121, 32, 32, 32, 52, 58, 144, 121, 132, 0
str_120:
  .byte 53, 58, 144, 120, 121, 32, 32, 54, 58, 120, 137, 40, 32, 32, 55, 58, 121, 137, 40, 0
str_121:
  .byte 56, 58, 99, 32, 32, 32, 32, 57, 58, 120, 147, 137, 40, 0
str_122:
  .byte 141, 142, 58, 80, 65, 71, 69, 32, 65, 67, 58, 66, 65, 67, 75, 0
str_123:
  .byte 70, 85, 78, 67, 0
str_124:
  .byte 70, 85, 78, 67, 32, 82, 65, 78, 68, 79, 77, 0
str_125:
  .byte 70, 85, 78, 67, 32, 83, 84, 65, 84, 83, 0
str_126:
  .byte 66, 82, 69, 65, 75, 0
str_127:
  .byte 70, 65, 85, 76, 84, 0
str_128:
  .byte 67, 65, 85, 83, 69, 0
str_129:
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
  lw t0, 0x0664(zero)
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
  lw t0, 0x0664(zero)
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
  sw s0, 0x0664(zero)
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
  lw t0, 0x0666(zero)
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
  lw t0, 0x0668(zero)
  bltu s1, t0, .L1
  ; sci/layout.e16.ts:56  return bufLength
  lw a0, 0x0668(zero)
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
  lw t0, 0x0668(zero)
  bltu s1, t0, .L1
  ; sci/layout.e16.ts:68  return bufLength
  lw a0, 0x0668(zero)
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
  sw t0, 0x0674(zero)
  ; sci/layout.e16.ts:77  boxDown = 0
  sw zero, 0x0676(zero)
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
  lw t0, 0x0674(zero)
  add t0, t0, s2
  bgeu s0, t0, .L8
  ; sci/layout.e16.ts:89  up = boxUp + lift
  lw t0, 0x0674(zero)
  add s0, t0, s2
.L8:
  ; sci/layout.e16.ts:90  if (boxDown > down) down = boxDown
  lw t0, 0x0676(zero)
  lw t1, 0(sp) ; down
  bgeu t1, t0, .L9
  ; sci/layout.e16.ts:90  down = boxDown
  lw t0, 0x0676(zero)
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
  sw s0, 0x0674(zero)
  ; sci/layout.e16.ts:94  boxDown = down
  lw t0, 0(sp) ; down
  sw t0, 0x0676(zero)
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
  lw t0, 0x0674(zero)
  addi t0, t0, 2
  sw t0, 0x0674(zero)
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
  lw t0, 0x0674(zero)
  addi t0, t0, 4
  sw t0, 0x0674(zero)
  ; sci/layout.e16.ts:115  boxDown = 0
  sw zero, 0x0676(zero)
  ; sci/layout.e16.ts:116  return wa + 1
  addi a0, s1, 1
  j .return
.L5:
  ; sci/layout.e16.ts:118  boxUp = 7
  li t0, 7
  sw t0, 0x0674(zero)
  ; sci/layout.e16.ts:119  boxDown = 0
  sw zero, 0x0676(zero)
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
  lw s0, 0x0674(zero)
  ; sci/layout.e16.ts:127  const da = boxDown
  lw t0, 0x0676(zero)
  sw t0, 0(sp) ; da
  ; sci/layout.e16.ts:128  const wb = measureSeq(sep + 1, end)
  addi a0, s1, 1
  mv a1, s2
  call measureSeq
  mv s1, a0 ; sep/wb
  ; sci/layout.e16.ts:129  const reach = boxUp + boxDown
  lw t0, 0x0674(zero)
  lw t1, 0x0676(zero)
  add s2, t0, t1
  ; sci/layout.e16.ts:130  boxUp = MID + 2 + da + ua
  lw t0, 0(sp) ; da
  addi t0, t0, 6
  add t0, t0, s0
  sw t0, 0x0674(zero)
  ; sci/layout.e16.ts:131  boxDown = reach > 0 ? reach - 1 : 0
  bgeu zero, s2, .L1
  addi t0, s2, -1
  j .L2
.L1:
  li t0, 0
.L2:
  sw t0, 0x0676(zero)
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
  lw s0, 0x0674(zero)
  ; sci/layout.e16.ts:141  const wd = boxDown
  lw t0, 0x0676(zero)
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
  lw a1, 0x0674(zero)
  mv a0, s0
  call wider
  sw a0, 0x0674(zero)
  ; sci/layout.e16.ts:144  boxDown = wider(wd, boxDown)
  lw a1, 0x0676(zero)
  lw a0, 0(sp)
  call wider
  sw a0, 0x0676(zero)
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
  lw t0, 0x0674(zero)
  addi s3, t0, 5
  ; sci/layout.e16.ts:155  const wb = measureSeq(xsep + 1, partEnd(xsep + 1))
  addi a0, s1, 1
  call partEnd
  mv a1, a0
  addi a0, s1, 1
  call measureSeq
  mv s1, a0 ; xsep/wb
  ; sci/layout.e16.ts:156  boxUp = wider(boxUp + 2, iu)
  lw t0, 0x0674(zero)
  addi a0, t0, 2
  mv a1, s3
  call wider
  sw a0, 0x0674(zero)
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
  lw t0, 0x066c(zero)
  beqz t0, .L2
  lw t0, 0x066a(zero)
  bltu s1, t0, .L2
  lw t0, 0x066a(zero)
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
  lw t0, 0x066a(zero)
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
  lw t0, 0x066c(zero)
  beqz t0, .L2
  lw t0, 0x066a(zero)
  bltu s1, t0, .L2
  lw t0, 0x066a(zero)
  sub t0, s1, t0
  li t1, 122
  bgeu t1, t0, .L1
.L2:
  ; sci/layout.e16.ts:189  return
  j .return
.L1:
  ; sci/layout.e16.ts:190  glyphAt(c, x - slide, y)
  lw t0, 0x066a(zero)
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
  lw t0, 0x066e(zero)
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
  sw t0, 0x0670(zero)
  ; sci/layout.e16.ts:197  cursorTop = foot - 8
  addi t0, a2, -8
  sw t0, 0x0672(zero)
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
  lw t0, 0x066e(zero)
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
  lw t0, 0x0676(zero)
  sw t0, 8(sp) ; da
  ; sci/layout.e16.ts:262  const wb = measureSeq(sep + 1, end)
  addi a0, s1, 1
  lw a1, 2(sp)
  call measureSeq
  sw a0, 6(sp) ; wb
  ; sci/layout.e16.ts:263  const ub = boxUp
  lw t0, 0x0674(zero)
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
  lw t0, 0x0674(zero)
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
  sw s2, 0x0666(zero)
  ; sci/layout.e16.ts:305  bufLength = length
  sw s1, 0x0668(zero)
  ; sci/layout.e16.ts:306  measureSeq(0, length)
  li a0, 0
  mv a1, s1
  call measureSeq
  ; sci/layout.e16.ts:307  return boxUp + boxDown
  lw t0, 0x0674(zero)
  lw t1, 0x0676(zero)
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
  sw s1, 0x0666(zero)
  ; sci/layout.e16.ts:316  bufLength = length
  sw s2, 0x0668(zero)
  ; sci/layout.e16.ts:317  measureSeq(0, length)
  li a0, 0
  mv a1, s2
  call measureSeq
  ; sci/layout.e16.ts:318  const foot = 2 + (boxUp > 7 ? boxUp : 7)
  lw t1, 0x0674(zero)
  li t0, 2
  li t2, 7
  bgeu t2, t1, .L1
  lw t1, 0x0674(zero)
  j .L2
.L1:
  li t1, 7
.L2:
  add s1, t0, t1
  ; sci/layout.e16.ts:319  cursorIndex = cursor
  sw s3, 0x066e(zero)
  ; sci/layout.e16.ts:320  slide = 0
  sw zero, 0x066a(zero)
  ; sci/layout.e16.ts:321  ink = false
  sw zero, 0x066c(zero)
  ; sci/layout.e16.ts:322  drawSeq(0, length, 1, foot)
  li a0, 0
  mv a1, s2
  li a2, 1
  mv a3, s1
  call drawSeq
  ; sci/layout.e16.ts:323  if (cursorX > 124) slide = cursorX - 124
  lw t0, 0x0670(zero)
  li t1, 124
  bgeu t1, t0, .L3
  ; sci/layout.e16.ts:323  slide = cursorX - 124
  lw t0, 0x0670(zero)
  addi t0, t0, -124
  sw t0, 0x066a(zero)
.L3:
  ; sci/layout.e16.ts:324  ink = true
  li t0, 1
  sw t0, 0x066c(zero)
  ; sci/layout.e16.ts:325  drawSeq(0, length, 1, foot)
  li a0, 0
  mv a1, s2
  li a2, 1
  mv a3, s1
  call drawSeq
  ; sci/layout.e16.ts:326  if (cursorX >= slide) cursorX -= slide
  lw t0, 0x0670(zero)
  lw t1, 0x066a(zero)
  bltu t0, t1, .L4
  ; sci/layout.e16.ts:326  cursorX -= slide
  lw t0, 0x0670(zero)
  lw t1, 0x066a(zero)
  sub t0, t0, t1
  sw t0, 0x0670(zero)
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/layout.e16.ts:330 setTokensAt(at/w, length, foot) at -O1
;   at/w in s1
;   length in s2
;   foot in s3
setTokensAt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; at/w
  mv s2, a1 ; length
  mv s3, a2 ; foot
  ; sci/layout.e16.ts:331  buf = at
  sw s1, 0x0666(zero)
  ; sci/layout.e16.ts:332  bufLength = length
  sw s2, 0x0668(zero)
  ; sci/layout.e16.ts:333  const w = measureSeq(0, length)
  li a0, 0
  mv a1, s2
  call measureSeq
  mv s1, a0 ; at/w
  ; sci/layout.e16.ts:334  cursorIndex = 0xffff
  li t0, 65535
  sw t0, 0x066e(zero)
  ; sci/layout.e16.ts:335  slide = 0
  sw zero, 0x066a(zero)
  ; sci/layout.e16.ts:336  ink = true
  li t0, 1
  sw t0, 0x066c(zero)
  ; sci/layout.e16.ts:337  drawSeq(0, length, 128 - w, foot)
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

; sci/layout.e16.ts:341 setAnswer(at/w, length) at -O1
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
  ; sci/layout.e16.ts:342  buf = at
  sw s1, 0x0666(zero)
  ; sci/layout.e16.ts:343  bufLength = length
  sw s2, 0x0668(zero)
  ; sci/layout.e16.ts:344  const w = measureSeq(0, length)
  li a0, 0
  mv a1, s2
  call measureSeq
  mv s1, a0 ; at/w
  ; sci/layout.e16.ts:345  const foot = 62 - boxDown
  lw t0, 0x0676(zero)
  li t1, 62
  sub s3, t1, t0
  ; sci/layout.e16.ts:346  cursorIndex = 0xffff
  li t0, 65535
  sw t0, 0x066e(zero)
  ; sci/layout.e16.ts:347  slide = 0
  sw zero, 0x066a(zero)
  ; sci/layout.e16.ts:348  ink = true
  li t0, 1
  sw t0, 0x066c(zero)
  ; sci/layout.e16.ts:349  drawSeq(0, length, 128 - w, foot)
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
  sw t1, 0x0678(zero)
  ; sci/edit.e16.ts:122  editCursor = start === cur ? start + 1 : cur + 2
  bne s3, s2, .L5
  addi t0, s3, 1
  j .L6
.L5:
  addi t0, s2, 2
.L6:
  sw t0, 0x067a(zero)
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
  sw s0, 0x0678(zero)
  ; sci/edit.e16.ts:147  editCursor = cur
  sw s1, 0x067a(zero)
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
  sw t0, 0x067a(zero)
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
  sw t0, 0x0678(zero)
  ; sci/edit.e16.ts:160  editCursor = cur - 1
  addi t0, s1, -1
  sw t0, 0x067a(zero)
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
  sw t0, 0x067a(zero)
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
  sw t0, 0x0678(zero)
  ; sci/edit.e16.ts:170  editCursor = open
  sw s2, 0x067a(zero)
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
  sw s3, 0x0678(zero)
  ; sci/edit.e16.ts:222  editCursor = 0xffff
  li t0, 65535
  sw t0, 0x067a(zero)
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
  sw a0, 0x067a(zero)
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
  sw a0, 0x067a(zero)
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
  sw s1, 0x067a(zero)
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
; sci/display.e16.ts:89 hasForm() at -O1
hasForm:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:90  if (!isExact(KEEP_ANS)) return false
  li a0, 3080
  call isExact
  bnez a0, .L1
  ; sci/display.e16.ts:90  return false
  li a0, 0
  j .return
.L1:
  ; sci/display.e16.ts:91  return !isZero(KEEP_ANS + V_R) || !isOne(KEEP_ANS + V_Q)
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

; sci/display.e16.ts:95 mixable() at -O1
mixable:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:96  if (!hasForm() || !isZero(KEEP_ANS + V_R)) return false
  call hasForm
  beqz a0, .L2
  li a0, 3100
  call isZero
  bnez a0, .L1
.L2:
  ; sci/display.e16.ts:96  return false
  li a0, 0
  j .return
.L1:
  ; sci/display.e16.ts:97  copy(KEEP_ANS + V_P, addr(scratch))
  li a0, 3092
  la a1, scratch
  call copy
  ; sci/display.e16.ts:98  math(M_ABS, addr(scratch), 0, 0)
  li a0, 17
  la a1, scratch
  li a2, 0
  li a3, 0
  call math
  ; sci/display.e16.ts:99  math(M_SUB, addr(scratch), KEEP_ANS + V_Q, 0)
  li a0, 2
  la a1, scratch
  li a2, 3108
  li a3, 0
  call math
  ; sci/display.e16.ts:100  return !isNegative(addr(scratch)) && !isZero(addr(scratch))
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

; sci/display.e16.ts:104 firstShown(form) at -O1
;   form in s1
firstShown:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; form
  ; sci/display.e16.ts:105  if (!form || !hasForm()) return SHOW_DECIMAL
  beqz s1, .L2
  call hasForm
  bnez a0, .L1
.L2:
  ; sci/display.e16.ts:105  return SHOW_DECIMAL
  li a0, 0
  j .return
.L1:
  ; sci/display.e16.ts:106  if (peek(KEEP_MIXED) !== 0 && mixable()) return SHOW_MIXED
  lbu t0, 3079(zero)
  beq t0, zero, .L3
  call mixable
  beqz a0, .L3
  ; sci/display.e16.ts:106  return SHOW_MIXED
  li a0, 2
  j .return
.L3:
  ; sci/display.e16.ts:107  return SHOW_FORM
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:111 nextShown(shown) at -O1
;   shown in s1
nextShown:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; shown
  ; sci/display.e16.ts:112  if (shown === SHOW_FORM) return mixable() ? SHOW_MIXED : SHOW_DECIMAL
  li t0, 1
  bne s1, t0, .L1
  ; sci/display.e16.ts:112  return mixable() ? SHOW_MIXED : SHOW_DECIMAL
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
  ; sci/display.e16.ts:113  if (shown === SHOW_MIXED) return SHOW_DECIMAL
  li t0, 2
  bne s1, t0, .L4
  ; sci/display.e16.ts:113  return SHOW_DECIMAL
  li a0, 0
  j .return
.L4:
  ; sci/display.e16.ts:114  return SHOW_FORM
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:120 drawAnswerAs(shown) at -O1
;   shown in s1
drawAnswerAs:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; shown
  ; sci/display.e16.ts:121  if (shown === SHOW_FORM) drawForm()
  li t0, 1
  bne s1, t0, .L1
  ; sci/display.e16.ts:121  drawForm()
  call drawForm
  j .L2
.L1:
  ; sci/display.e16.ts:122  if (shown === SHOW_MIXED) showMixed()
  li t0, 2
  bne s1, t0, .L3
  ; sci/display.e16.ts:122  showMixed()
  call showMixed
  j .L4
.L3:
  ; sci/display.e16.ts:123  if (shown === SHOW_DMS) drawDms()
  li t0, 4
  bne s1, t0, .L5
  ; sci/display.e16.ts:123  drawDms()
  call drawDms
  j .L6
.L5:
  ; sci/display.e16.ts:124  if (shown === SHOW_PAIR) drawPair()
  li t0, 5
  bne s1, t0, .L7
  ; sci/display.e16.ts:124  drawPair()
  call drawPair
  j .L8
.L7:
  ; sci/display.e16.ts:126  if (shown === SHOW_ENG) engText(KEEP_ANS)
  li t0, 3
  bne s1, t0, .L9
  ; sci/display.e16.ts:126  engText(KEEP_ANS)
  li a0, 3080
  call engText
  j .L10
.L9:
  ; sci/display.e16.ts:127  decimalText(KEEP_ANS)
  li a0, 3080
  call decimalText
.L10:
  ; sci/display.e16.ts:128  drawDecimal()
  call drawDecimal
  ; sci/display.e16.ts:129  if (shown === SHOW_FOUND) drawFound()
  li t0, 6
  bne s1, t0, .L11
  ; sci/display.e16.ts:129  drawFound()
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

; sci/display.e16.ts:134 drawDecimal() at -O1
;   mantissa in s2
;   i/right/exponent in s1
;   digits/x in s3
drawDecimal:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  ; sci/display.e16.ts:135  let mantissa = textLength
  lw s2, 0x069c(zero)
  ; sci/display.e16.ts:136  for (let i: u16 = 0; i < textLength; i++) {
  li s1, 0 ; i/right/exponent
  j .L3
.L1:
  ; sci/display.e16.ts:137  if (text[i] === 0x45) mantissa = i
  lbu t0, text(s1)
  li t1, 69
  bne t0, t1, .L5
  ; sci/display.e16.ts:137  mantissa = i
  mv s2, s1 ; mantissa
.L5:
  addi s1, s1, 1
.L3:
  lw t0, 0x069c(zero)
  bltu s1, t0, .L1
  ; sci/display.e16.ts:139  let right: u16 = 127
  li s1, 127 ; i/right/exponent
  ; sci/display.e16.ts:140  if (mantissa < textLength) {
  lw t0, 0x069c(zero)
  bgeu s2, t0, .L6
  ; sci/display.e16.ts:141  const exponent = addr(text) + mantissa + 1
  addi s1, s2, text+1
  ; sci/display.e16.ts:142  const digits = textLength - mantissa - 1
  lw t0, 0x069c(zero)
  sub t0, t0, s2
  addi s3, t0, -1
  ; sci/display.e16.ts:143  const x = 128 - digits * 6
  slli t1, s3, 2
  slli t0, s3, 1
  add t0, t0, t1
  li t1, 128
  sub s3, t1, t0
  ; sci/display.e16.ts:144  textAt(exponent, x, 48)
  mv a0, s1
  mv a1, s3
  li a2, 48
  call textAt
  ; sci/display.e16.ts:145  textAt(str('\x8110'), x - 18, 55)
  la a0, str_130
  addi a1, s3, -18
  li a2, 55
  call textAt
  ; sci/display.e16.ts:146  right = x - 19
  addi s1, s3, -19
.L6:
  ; sci/display.e16.ts:148  bigNumber(addr(text), mantissa, right)
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

; sci/display.e16.ts:152 drawPair() at -O1
drawPair:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:153  textAt(str('X='), 1, 46)
  la a0, str_131
  li a1, 1
  li a2, 46
  call textAt
  ; sci/display.e16.ts:154  decimalText(varAt(0x58))
  li a0, 3336
  call decimalText
  ; sci/display.e16.ts:155  textRight(addr(text), 46)
  la a0, text
  li a1, 46
  call textRight
  ; sci/display.e16.ts:156  textAt(str('Y='), 1, 55)
  la a0, str_132
  li a1, 1
  li a2, 55
  call textAt
  ; sci/display.e16.ts:157  decimalText(varAt(0x59))
  li a0, 3372
  call decimalText
  ; sci/display.e16.ts:158  textRight(addr(text), 55)
  la a0, text
  li a1, 55
  call textRight
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/display.e16.ts:162 drawFound() at -O1
drawFound:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:163  textAt(str('X='), 1, 55)
  la a0, str_131
  li a1, 1
  li a2, 55
  call textAt
  ; sci/display.e16.ts:164  textAt(str('DIFF='), 1, 37)
  la a0, str_133
  li a1, 1
  li a2, 37
  call textAt
  ; sci/display.e16.ts:165  decimalText(addr(diffValue))
  la a0, diffValue
  call decimalText
  ; sci/display.e16.ts:166  textRight(addr(text), 37)
  la a0, text
  li a1, 37
  call textRight
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/display.e16.ts:170 drawDms() at -O1
drawDms:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:171  dmsText(KEEP_ANS)
  li a0, 3080
  call dmsText
  ; sci/display.e16.ts:172  textRight(addr(text), 55)
  la a0, text
  li a1, 55
  call textRight
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/display.e16.ts:178 drawForm() at -O1
drawForm:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:179  answerLength = 0
  sw zero, 0x06f6(zero)
  ; sci/display.e16.ts:180  formTokens(KEEP_ANS)
  li a0, 3080
  call formTokens
  ; sci/display.e16.ts:181  setAnswer(addr(answerTokens), answerLength)
  lw a1, 0x06f6(zero)
  la a0, answerTokens
  la t0, setAnswer
  li t1, 3
  call far_call
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/display.e16.ts:185 formTokens(v/q) at -O1
;   v/q in s1
;   p in s3
;   r in s2
;   fractionOf in 0(sp)
;   oneTerm/signOut in s0
formTokens:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  sw s2, 8(sp)
  sw s0, 10(sp)
  mv s1, a0 ; v/q
  ; sci/display.e16.ts:186  const p = v + V_P
  addi s3, s1, 12
  ; sci/display.e16.ts:187  const r = v + V_R
  addi s2, s1, 20
  ; sci/display.e16.ts:188  const q = v + V_Q
  addi s1, s1, 28
  ; sci/display.e16.ts:189  const fractionOf = !isOne(q)
  mv a0, s1
  call isOne
  seqz t0, a0
  sw t0, 0(sp) ; fractionOf
  ; sci/display.e16.ts:190  const oneTerm = isZero(p) || isZero(r)
  mv a0, s3
  call isZero
  mv t1, a0
  mv t0, a0
  bnez t1, .L1
  mv a0, s2
  call isZero
  mv t0, a0
.L1:
  mv s0, t0 ; oneTerm/signOut
  ; sci/display.e16.ts:192  const signOut = oneTerm && fractionOf && (isZero(r) ? isNegative(p) : isNegative(r))
  mv t0, s0
  mv t1, s0
  beqz t1, .L3
  lw t0, 0(sp)
.L3:
  mv t1, t0
  beqz t1, .L2
  mv a0, s2
  call isZero
  beqz a0, .L4
  mv a0, s3
  call isNegative
  mv t0, a0
  j .L5
.L4:
  mv a0, s2
  call isNegative
  mv t0, a0
.L5:
.L2:
  mv s0, t0 ; oneTerm/signOut
  ; sci/display.e16.ts:193  if (signOut) answerToken(T_MINUS)
  beqz s0, .L6
  ; sci/display.e16.ts:193  answerToken(T_MINUS)
  li a0, 45
  call answerToken
.L6:
  ; sci/display.e16.ts:194  if (fractionOf) answerToken(T_FRAC)
  lw t0, 0(sp) ; fractionOf
  beqz t0, .L7
  ; sci/display.e16.ts:194  answerToken(T_FRAC)
  li a0, 22
  call answerToken
.L7:
  ; sci/display.e16.ts:195  if (!isZero(p) || isZero(r)) answerNumber(p, signOut)
  mv a0, s3
  call isZero
  beqz a0, .L9
  mv a0, s2
  call isZero
  beqz a0, .L8
.L9:
  ; sci/display.e16.ts:195  answerNumber(p, signOut)
  mv a0, s3
  mv a1, s0
  call answerNumber
.L8:
  ; sci/display.e16.ts:196  if (!isZero(r)) answerRoot(p, r, signOut)
  mv a0, s2
  call isZero
  bnez a0, .L10
  ; sci/display.e16.ts:196  answerRoot(p, r, signOut)
  mv a0, s3
  mv a1, s2
  mv a2, s0
  call answerRoot
.L10:
  ; sci/display.e16.ts:197  if (fractionOf) {
  lw t0, 0(sp) ; fractionOf
  beqz t0, .L11
  ; sci/display.e16.ts:198  answerToken(T_SEP)
  li a0, 23
  call answerToken
  ; sci/display.e16.ts:199  answerNumber(q, false)
  mv a0, s1
  li a1, 0
  call answerNumber
  ; sci/display.e16.ts:200  answerToken(T_END)
  li a0, 24
  call answerToken
.L11:
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  lw s0, 10(sp)
  addi sp, sp, 12
  ret

; sci/display.e16.ts:205 formOf(v) at -O1
;   v in s1
formOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/display.e16.ts:206  return isExact(v) && (!isZero(v + V_R) || !isOne(v + V_Q))
  mv a0, s1
  call isExact
  mv t1, a0
  mv t0, a0
  beqz t1, .L1
  addi a0, s1, 20
  call isZero
  seqz t0, a0
  mv t1, t0
  bnez t1, .L2
  addi a0, s1, 28
  call isOne
  seqz t0, a0
.L2:
.L1:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:213 drawValueAt(v, foot, twoD) at -O1
;   v in s1
;   foot in s2
;   twoD in s3
drawValueAt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; v
  mv s2, a1 ; foot
  mv s3, a2 ; twoD
  ; sci/display.e16.ts:214  if (twoD && formOf(v)) {
  beqz s3, .L1
  mv a0, s1
  call formOf
  beqz a0, .L1
  ; sci/display.e16.ts:215  answerLength = 0
  sw zero, 0x06f6(zero)
  ; sci/display.e16.ts:216  formTokens(v)
  mv a0, s1
  call formTokens
  ; sci/display.e16.ts:217  setTokensAt(addr(answerTokens), answerLength, foot)
  lw a1, 0x06f6(zero)
  la a0, answerTokens
  mv a2, s2
  la t0, setTokensAt
  li t1, 3
  call far_call
  ; sci/display.e16.ts:218  return
  j .return
.L1:
  ; sci/display.e16.ts:220  decimalText(v)
  mv a0, s1
  call decimalText
  ; sci/display.e16.ts:221  textRight(addr(text), foot - 7)
  la a0, text
  addi a1, s2, -7
  call textRight
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/display.e16.ts:228 drawComplexAt(re, im, minus, foot) at -O1
;   re in s1
;   im in s2
;   minus in s0
;   foot in 0(sp)
;   exact in s3
drawComplexAt:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  sw s3, 10(sp)
  mv s1, a0 ; re
  mv s2, a1 ; im
  mv s0, a2 ; minus
  sw a3, 0(sp) ; foot
  ; sci/display.e16.ts:229  answerLength = 0
  sw zero, 0x06f6(zero)
  ; sci/display.e16.ts:230  const exact = isExact(re) && isExact(im)
  mv a0, s1
  call isExact
  mv t1, a0
  mv t0, a0
  beqz t1, .L1
  mv a0, s2
  call isExact
  mv t0, a0
.L1:
  mv s3, t0 ; exact
  ; sci/display.e16.ts:231  if (!isZero(re)) {
  mv a0, s1
  call isZero
  bnez a0, .L2
  ; sci/display.e16.ts:232  if (exact) formTokens(re)
  beqz s3, .L3
  ; sci/display.e16.ts:232  formTokens(re)
  mv a0, s1
  call formTokens
  j .L4
.L3:
  ; sci/display.e16.ts:233  shortNumber(re)
  mv a0, s1
  call shortNumber
.L4:
.L2:
  ; sci/display.e16.ts:235  if (minus) answerToken(T_MINUS)
  beqz s0, .L5
  ; sci/display.e16.ts:235  answerToken(T_MINUS)
  li a0, 45
  call answerToken
  j .L6
.L5:
  ; sci/display.e16.ts:236  if (!isZero(re)) answerToken(T_PLUS)
  mv a0, s1
  call isZero
  bnez a0, .L7
  ; sci/display.e16.ts:236  answerToken(T_PLUS)
  li a0, 43
  call answerToken
.L7:
.L6:
  ; sci/display.e16.ts:237  if (!exact || !isOne(im)) {
  beqz s3, .L9
  mv a0, s2
  call isOne
  bnez a0, .L8
.L9:
  ; sci/display.e16.ts:238  if (exact) formTokens(im)
  beqz s3, .L10
  ; sci/display.e16.ts:238  formTokens(im)
  mv a0, s2
  call formTokens
  j .L11
.L10:
  ; sci/display.e16.ts:239  shortNumber(im)
  mv a0, s2
  call shortNumber
.L11:
.L8:
  ; sci/display.e16.ts:241  answerToken(0x69)
  li a0, 105
  call answerToken
  ; sci/display.e16.ts:242  setTokensAt(addr(answerTokens), answerLength, foot)
  lw a1, 0x06f6(zero)
  la a0, answerTokens
  lw a2, 0(sp)
  la t0, setTokensAt
  li t1, 3
  call far_call
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  lw s3, 10(sp)
  addi sp, sp, 12
  ret

; sci/display.e16.ts:246 shortNumber(v/i) at -O1
;   v/i in s1
shortNumber:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v/i
  ; sci/display.e16.ts:247  format(v, 6)
  mv a0, s1
  li a1, 6
  call format
  ; sci/display.e16.ts:248  for (let i: u16 = 0; i < textLength; i++) answerToken(text[i] === 0x2d ? T_MINUS : text[i])
  li s1, 0 ; v/i
  j .L3
.L1:
  ; sci/display.e16.ts:248  answerToken(text[i] === 0x2d ? T_MINUS : text[i])
  lbu t0, text(s1)
  li t1, 45
  bne t0, t1, .L5
  li t0, 45
  j .L6
.L5:
  lbu t0, text(s1)
.L6:
  mv a0, t0
  call answerToken
  addi s1, s1, 1
.L3:
  lw t0, 0x069c(zero)
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:252 showMixed() at -O1
showMixed:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:253  answerLength = 0
  sw zero, 0x06f6(zero)
  ; sci/display.e16.ts:254  const p = KEEP_ANS + V_P
  ; sci/display.e16.ts:255  const q = KEEP_ANS + V_Q
  ; sci/display.e16.ts:256  if (isNegative(p)) answerToken(T_MINUS)
  li a0, 3092
  call isNegative
  beqz a0, .L1
  ; sci/display.e16.ts:256  answerToken(T_MINUS)
  li a0, 45
  call answerToken
.L1:
  ; sci/display.e16.ts:257  copy(p, addr(scratch))
  li a0, 3092
  la a1, scratch
  call copy
  ; sci/display.e16.ts:258  math(M_ABS, addr(scratch), 0, 0)
  li a0, 17
  la a1, scratch
  li a2, 0
  li a3, 0
  call math
  ; sci/display.e16.ts:259  copy(addr(scratch), addr(spare))
  la a0, scratch
  la a1, spare
  call copy
  ; sci/display.e16.ts:260  math(M_IDIV, addr(scratch), q, 0)
  li a0, 8
  la a1, scratch
  li a2, 3108
  li a3, 0
  call math
  ; sci/display.e16.ts:261  math(M_MOD, addr(spare), q, 0)
  li a0, 9
  la a1, spare
  li a2, 3108
  li a3, 0
  call math
  ; sci/display.e16.ts:262  answerToken(T_MIXED)
  li a0, 28
  call answerToken
  ; sci/display.e16.ts:263  answerNumber(addr(scratch), true)
  la a0, scratch
  li a1, 1
  call answerNumber
  ; sci/display.e16.ts:264  answerToken(T_MSEP)
  li a0, 29
  call answerToken
  ; sci/display.e16.ts:265  answerNumber(addr(spare), true)
  la a0, spare
  li a1, 1
  call answerNumber
  ; sci/display.e16.ts:266  answerToken(T_MDIV)
  li a0, 31
  call answerToken
  ; sci/display.e16.ts:267  answerNumber(q, true)
  li a0, 3108
  li a1, 1
  call answerNumber
  ; sci/display.e16.ts:268  answerToken(T_END)
  li a0, 24
  call answerToken
  ; sci/display.e16.ts:269  setAnswer(addr(answerTokens), answerLength)
  lw a1, 0x06f6(zero)
  la a0, answerTokens
  la t0, setAnswer
  li t1, 3
  call far_call
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/display.e16.ts:273 answerRoot(p, r, signOut) at -O1
;   p in s3
;   r in s1
;   signOut in s0
;   s in s2
answerRoot:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s0, 6(sp)
  sw s2, 8(sp)
  mv s3, a0 ; p
  mv s1, a1 ; r
  mv s0, a2 ; signOut
  ; sci/display.e16.ts:275  const s = peek16(r - V_R + V_S)
  lw s2, -10(s1)
  ; sci/display.e16.ts:276  if (!isZero(p)) answerToken(isNegative(r) ? T_MINUS : T_PLUS)
  mv a0, s3
  call isZero
  bnez a0, .L1
  ; sci/display.e16.ts:276  answerToken(isNegative(r) ? T_MINUS : T_PLUS)
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
  ; sci/display.e16.ts:277  if (isNegative(r) && !signOut) answerToken(T_MINUS)
  mv a0, s1
  call isNegative
  beqz a0, .L5
  bnez s0, .L5
  ; sci/display.e16.ts:277  answerToken(T_MINUS)
  li a0, 45
  call answerToken
.L5:
.L4:
  ; sci/display.e16.ts:278  if (!isOne(r) && !isMinusOne(r)) answerNumber(r, true)
  mv a0, s1
  call isOne
  bnez a0, .L6
  mv a0, s1
  call isMinusOne
  bnez a0, .L6
  ; sci/display.e16.ts:278  answerNumber(r, true)
  mv a0, s1
  li a1, 1
  call answerNumber
.L6:
  ; sci/display.e16.ts:279  answerToken(T_ROOT)
  li a0, 25
  call answerToken
  ; sci/display.e16.ts:280  if (s >= 10) answerToken(0x30 + div(s, 10))
  li t0, 10
  bltu s2, t0, .L7
  ; sci/display.e16.ts:280  answerToken(0x30 + div(s, 10))
  li t1, 52429
  mulhu t0, s2, t1
  srli t0, t0, 3
  addi a0, t0, 48
  call answerToken
.L7:
  ; sci/display.e16.ts:281  answerToken(0x30 + (s % 10))
  li t1, 52429
  mulhu t0, s2, t1
  srli t0, t0, 3
  li t1, 10
  mul t0, t0, t1
  sub t0, s2, t0
  addi a0, t0, 48
  call answerToken
  ; sci/display.e16.ts:282  answerToken(T_END)
  li a0, 24
  call answerToken
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/display.e16.ts:285 answerToken(t) at -O1
;   t in a0
answerToken:
  ; sci/display.e16.ts:286  if (answerLength < 48) {
  lw t0, 0x06f6(zero)
  li t1, 48
  bgeu t0, t1, .L1
  ; sci/display.e16.ts:287  answerTokens[answerLength] = t
  lw t0, 0x06f6(zero)
  sb a0, answerTokens(t0)
  ; sci/display.e16.ts:288  answerLength++
  lw t0, 0x06f6(zero)
  addi t0, t0, 1
  sw t0, 0x06f6(zero)
.L1:
.return:
  ret

; sci/display.e16.ts:293 answerNumber(n/i, bare) at -O1
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
  ; sci/display.e16.ts:294  format(n, 12)
  mv a0, s1
  li a1, 12
  call format
  ; sci/display.e16.ts:295  for (let i: u16 = 0; i < textLength; i++) {
  li s1, 0 ; n/i
  j .L3
.L1:
  ; sci/display.e16.ts:296  const c = text[i]
  lbu s2, text(s1)
  ; sci/display.e16.ts:297  if (c === 0x2d) {
  li t0, 45
  bne s2, t0, .L5
  ; sci/display.e16.ts:298  if (!bare) answerToken(T_MINUS)
  bnez s3, .L7
  ; sci/display.e16.ts:298  answerToken(T_MINUS)
  li a0, 45
  call answerToken
  j .L7
.L5:
  ; sci/display.e16.ts:299  answerToken(c)
  mv a0, s2
  call answerToken
.L7:
  addi s1, s1, 1
.L3:
  lw t0, 0x069c(zero)
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/display.e16.ts:303 isOne(n) at -O1
;   n in s1
isOne:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; sci/display.e16.ts:304  return peek(n) === 0 && isUnit(n)
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

; sci/display.e16.ts:307 isMinusOne(n) at -O1
;   n in s1
isMinusOne:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; sci/display.e16.ts:308  return peek(n) !== 0 && isUnit(n)
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

; sci/display.e16.ts:312 isUnit(n) at -O1
;   n in a0
isUnit:
  ; sci/display.e16.ts:313  return peek(n + 1) === 0 && peek(n + 2) === 0x10 && peek16(n + 4) === 0 && peek16(n + 6) === 0
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

; sci/display.e16.ts:319 format(v, digits) at -O1
;   v in s1
;   digits in s2
format:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; v
  mv s2, a1 ; digits
  ; sci/display.e16.ts:320  poke16(MATH_ARG, digits)
  li t0, 65366
  sw s2, 0(t0)
  ; sci/display.e16.ts:321  math(M_FORMAT, v, addr(text), 0)
  li a0, 57
  mv a1, s1
  la a2, text
  li a3, 0
  call math
  ; sci/display.e16.ts:322  textLength = peek16(MATH_ARG)
  li t0, 65366
  lw t0, 0(t0)
  sw t0, 0x069c(zero)
  ; sci/display.e16.ts:323  text[textLength] = 0
  lw t0, 0x069c(zero)
  sb zero, text(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/display.e16.ts:327 rounded(v, digits) at -O1
;   v in s1
;   digits in s2
rounded:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; v
  mv s2, a1 ; digits
  ; sci/display.e16.ts:328  copy(v, addr(scratch))
  mv a0, s1
  la a1, scratch
  call copy
  ; sci/display.e16.ts:329  poke16(MATH_ARG, digits)
  li t0, 65366
  sw s2, 0(t0)
  ; sci/display.e16.ts:330  math(M_RNDTO, addr(scratch), 0, 0)
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

; sci/display.e16.ts:334 exponentOf(v/e) at -O1
;   v/e in a0
exponentOf:
  ; sci/display.e16.ts:335  const e = peek(v + 1)
  lbu a0, 1(a0)
  ; sci/display.e16.ts:336  return e >= 128 ? i16(e) - 256 : i16(e)
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

; sci/display.e16.ts:344 decimalText(v) at -O1
;   v in s1
;   shape in s2
;   n in s3
decimalText:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; v
  ; sci/display.e16.ts:345  const shape = peek(KEEP_FORMAT)
  lbu s2, 3077(zero)
  ; sci/display.e16.ts:346  const n = peek(KEEP_DIGITS)
  lbu s3, 3078(zero)
  ; sci/display.e16.ts:347  if (shape === FORMAT_FIX) fixText(v, n)
  li t0, 1
  bne s2, t0, .L1
  ; sci/display.e16.ts:347  fixText(v, n)
  mv a0, s1
  mv a1, s3
  call fixText
  j .L2
.L1:
  ; sci/display.e16.ts:348  if (shape === FORMAT_EXP) expText(v, n === 0 ? 10 : n, false)
  li t0, 2
  bne s2, t0, .L3
  ; sci/display.e16.ts:348  expText(v, n === 0 ? 10 : n, false)
  mv t0, s1
  mv t1, s3
  li t2, 0
  bne t1, t2, .L4
  li t1, 10
  j .L5
.L4:
  mv t1, s3
.L5:
  mv a0, t0
  mv a1, t1
  li a2, 0
  call expText
  j .L6
.L3:
  ; sci/display.e16.ts:349  autoText(v, shape === FORMAT_AUTO2)
  li t0, 3
  sub t0, s2, t0
  seqz a1, t0
  mv a0, s1
  call autoText
.L6:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/display.e16.ts:353 textOf(v) at -O1
;   v in s1
textOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/display.e16.ts:354  decimalText(v)
  mv a0, s1
  call decimalText
  ; sci/display.e16.ts:355  return addr(text)
  la a0, text
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:359 autoText(v, small/places) at -O1
;   v in s1
;   small/places in s3
;   e in s2
autoText:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; v
  mv s3, a1 ; small/places
  ; sci/display.e16.ts:360  const e = exponentOf(v)
  mv a0, s1
  call exponentOf
  mv s2, a0 ; e
  ; sci/display.e16.ts:361  if (small && !isZero(v) && e < -2) {
  beqz s3, .L1
  mv a0, s1
  call isZero
  bnez a0, .L1
  li t0, 65534
  bge s2, t0, .L1
  ; sci/display.e16.ts:362  trimmed = true
  li t0, 1
  sw t0, 0x06f8(zero)
  ; sci/display.e16.ts:363  expText(v, 10, false)
  mv a0, s1
  li a1, 10
  li a2, 0
  call expText
  ; sci/display.e16.ts:364  trimmed = false
  sw zero, 0x06f8(zero)
  ; sci/display.e16.ts:365  return
  j .return
.L1:
  ; sci/display.e16.ts:367  if (isZero(v) || e < -9 || e > 9) {
  mv a0, s1
  call isZero
  bnez a0, .L3
  li t0, 65527
  blt s2, t0, .L3
  li t0, 9
  bge t0, s2, .L2
.L3:
  ; sci/display.e16.ts:368  format(v, 10)
  mv a0, s1
  li a1, 10
  call format
  ; sci/display.e16.ts:369  return
  j .return
.L2:
  ; sci/display.e16.ts:371  const places: i16 = e >= 0 ? 9 - e : 9
  blt s2, zero, .L4
  li t0, 9
  sub t0, t0, s2
  j .L5
.L4:
  li t0, 9
.L5:
  mv s3, t0 ; small/places
  ; sci/display.e16.ts:372  rounded(v, u16(-places))
  neg a1, s3
  mv a0, s1
  call rounded
  ; sci/display.e16.ts:373  format(addr(scratch), 12)
  la a0, scratch
  li a1, 12
  call format
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/display.e16.ts:376 fixText(v/point, n) at -O1
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
  ; sci/display.e16.ts:377  rounded(v, u16(-i16(n)))
  neg a1, s3
  mv a0, s2
  call rounded
  ; sci/display.e16.ts:378  format(addr(scratch), 12)
  la a0, scratch
  li a1, 12
  call format
  ; sci/display.e16.ts:380  let point = textLength
  lw s2, 0x069c(zero)
  ; sci/display.e16.ts:381  for (let i: u16 = 0; i < textLength; i++) {
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/display.e16.ts:382  if (text[i] === 0x45) return
  lbu t0, text(s1)
  li t1, 69
  bne t0, t1, .L5
  ; sci/display.e16.ts:382  return
  j .return
.L5:
  ; sci/display.e16.ts:383  if (text[i] === 0x2e) point = i
  lbu t0, text(s1)
  li t1, 46
  bne t0, t1, .L6
  ; sci/display.e16.ts:383  point = i
  mv s2, s1 ; v/point
.L6:
  addi s1, s1, 1
.L3:
  lw t0, 0x069c(zero)
  bltu s1, t0, .L1
  ; sci/display.e16.ts:385  if (n === 0) return
  bne s3, zero, .L7
  ; sci/display.e16.ts:385  return
  j .return
.L7:
  ; sci/display.e16.ts:386  if (point === textLength) addChar(0x2e)
  lw t0, 0x069c(zero)
  bne s2, t0, .L11
  ; sci/display.e16.ts:386  addChar(0x2e)
  li a0, 46
  call addChar
  ; sci/display.e16.ts:387  while (textLength - point - 1 < n) addChar(0x30)
  j .L11
.L9:
  ; sci/display.e16.ts:387  addChar(0x30)
  li a0, 48
  call addChar
.L11:
  lw t0, 0x069c(zero)
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

; sci/display.e16.ts:394 expText(v/w, digits, eng) at -O1
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
  ; sci/display.e16.ts:395  textLength = 0
  sw zero, 0x069c(zero)
  ; sci/display.e16.ts:396  rounded(v, digits)
  mv a0, s2
  mv a1, s0
  call rounded
  ; sci/display.e16.ts:397  const w = addr(scratch)
  la s2, scratch
  ; sci/display.e16.ts:398  if (isNegative(w)) addChar(0x2d)
  mv a0, s2
  call isNegative
  beqz a0, .L1
  ; sci/display.e16.ts:398  addChar(0x2d)
  li a0, 45
  call addChar
.L1:
  ; sci/display.e16.ts:399  const e = exponentOf(w)
  mv a0, s2
  call exponentOf
  mv s3, a0 ; e
  ; sci/display.e16.ts:400  let shift: i16 = 0
  sw zero, 0(sp) ; shift
  ; sci/display.e16.ts:401  if (eng) shift = e >= 0 ? e % 3 : (3 - (-e % 3)) % 3
  lw t0, 2(sp) ; eng
  beqz t0, .L2
  ; sci/display.e16.ts:401  shift = e >= 0 ? e % 3 : (3 - (-e % 3)) % 3
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
  ; sci/display.e16.ts:402  for (let k: u16 = 0; k < digits; k++) {
  li s1, 0 ; k
  j .L7
.L5:
  ; sci/display.e16.ts:403  const pair = peek(w + 2 + (k >> 1))
  srli t0, s1, 1
  addi t1, s2, 2
  add t1, t1, t0
  lbu t1, 0(t1)
  sw t1, 4(sp) ; pair
  ; sci/display.e16.ts:404  addChar(0x30 + ((k & 1) === 0 ? pair >> 4 : pair & 15))
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
  ; sci/display.e16.ts:405  if (i16(k) === shift && k + 1 < digits) addChar(0x2e)
  lw t0, 0(sp) ; shift
  bne s1, t0, .L11
  addi t0, s1, 1
  bgeu t0, s0, .L11
  ; sci/display.e16.ts:405  addChar(0x2e)
  li a0, 46
  call addChar
.L11:
  addi s1, s1, 1
.L7:
  bltu s1, s0, .L5
  ; sci/display.e16.ts:407  if (eng || trimmed) trimZeros()
  lw t0, 2(sp) ; eng
  bnez t0, .L13
  lw t0, 0x06f8(zero)
  beqz t0, .L12
.L13:
  ; sci/display.e16.ts:407  trimZeros()
  call trimZeros
.L12:
  ; sci/display.e16.ts:408  addChar(0x45)
  li a0, 69
  call addChar
  ; sci/display.e16.ts:409  numberChars(e - shift)
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

; sci/display.e16.ts:416 engText(v) at -O1
;   v in s1
engText:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/display.e16.ts:417  if (isZero(v)) {
  mv a0, s1
  call isZero
  beqz a0, .L1
  ; sci/display.e16.ts:418  format(v, 10)
  mv a0, s1
  li a1, 10
  call format
  ; sci/display.e16.ts:419  return
  j .return
.L1:
  ; sci/display.e16.ts:421  expText(v, 10, true)
  mv a0, s1
  li a1, 10
  li a2, 1
  call expText
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:425 trimZeros() at -O1
;   point in a1
;   i in a0
trimZeros:
  ; sci/display.e16.ts:426  let point = textLength
  lw a1, 0x069c(zero)
  ; sci/display.e16.ts:427  for (let i: u16 = 0; i < textLength; i++) {
  li a0, 0 ; i
  j .L3
.L1:
  ; sci/display.e16.ts:428  if (text[i] === 0x2e) point = i
  lbu t0, text(a0)
  li t1, 46
  bne t0, t1, .L5
  ; sci/display.e16.ts:428  point = i
  mv a1, a0 ; point
.L5:
  addi a0, a0, 1
.L3:
  lw t0, 0x069c(zero)
  bltu a0, t0, .L1
  ; sci/display.e16.ts:430  if (point === textLength) return
  lw t0, 0x069c(zero)
  bne a1, t0, .L9
  ; sci/display.e16.ts:430  return
  ret
  ; sci/display.e16.ts:431  while (textLength > point + 1 && text[textLength - 1] === 0x30) textLength--
.L7:
  ; sci/display.e16.ts:431  textLength--
  lw t0, 0x069c(zero)
  addi t0, t0, -1
  sw t0, 0x069c(zero)
.L9:
  lw t0, 0x069c(zero)
  addi t1, a1, 1
  bgeu t1, t0, .L11
  lw t0, 0x069c(zero)
  lbu t0, text-1(t0)
  li t1, 48
  beq t0, t1, .L7
.L11:
  ; sci/display.e16.ts:432  if (textLength === point + 1) textLength--
  lw t0, 0x069c(zero)
  addi t1, a1, 1
  bne t0, t1, .L12
  ; sci/display.e16.ts:432  textLength--
  lw t0, 0x069c(zero)
  addi t0, t0, -1
  sw t0, 0x069c(zero)
.L12:
  ; sci/display.e16.ts:433  text[textLength] = 0
  lw t0, 0x069c(zero)
  sb zero, text(t0)
.return:
  ret

; sci/display.e16.ts:437 numberChars(n/k) at -O1
;   n/k in s1
numberChars:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n/k
  ; sci/display.e16.ts:438  let k = n
  ; sci/display.e16.ts:439  if (k < 0) {
  bge s1, zero, .L1
  ; sci/display.e16.ts:440  addChar(0x2d)
  li a0, 45
  call addChar
  ; sci/display.e16.ts:441  k = -k
  neg s1, s1
.L1:
  ; sci/display.e16.ts:443  if (k >= 10) addChar(0x30 + div(u16(k), 10))
  li t0, 10
  blt s1, t0, .L2
  ; sci/display.e16.ts:443  addChar(0x30 + div(u16(k), 10))
  li t1, 52429
  mulhu t0, s1, t1
  srli t0, t0, 3
  addi a0, t0, 48
  call addChar
.L2:
  ; sci/display.e16.ts:444  addChar(0x30 + (u16(k) % 10))
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

; sci/display.e16.ts:447 addChar(c) at -O1
;   c in a0
addChar:
  ; sci/display.e16.ts:448  if (textLength < 31) {
  lw t0, 0x069c(zero)
  li t1, 31
  bgeu t0, t1, .L1
  ; sci/display.e16.ts:449  text[textLength] = c
  lw t0, 0x069c(zero)
  sb a0, text(t0)
  ; sci/display.e16.ts:450  textLength++
  lw t0, 0x069c(zero)
  addi t0, t0, 1
  sw t0, 0x069c(zero)
  ; sci/display.e16.ts:451  text[textLength] = 0
  lw t0, 0x069c(zero)
  sb zero, text(t0)
.L1:
.return:
  ret

; sci/display.e16.ts:458 dmsText(v) at -O1
;   v in s1
dmsText:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/display.e16.ts:459  if (exponentOf(v) > 9) {
  mv a0, s1
  call exponentOf
  li t0, 9
  bge t0, a0, .L1
  ; sci/display.e16.ts:460  decimalText(v)
  mv a0, s1
  call decimalText
  ; sci/display.e16.ts:461  return
  j .return
.L1:
  ; sci/display.e16.ts:463  setDigits(1)
  li a0, 1
  call setDigits
  ; sci/display.e16.ts:464  copy(v, addr(degreePart))
  mv a0, s1
  la a1, degreePart
  call copy
  ; sci/display.e16.ts:465  math(M_ABS, addr(degreePart), 0, 0)
  li a0, 17
  la a1, degreePart
  li a2, 0
  li a3, 0
  call math
  ; sci/display.e16.ts:467  copy(addr(degreePart), addr(minutePart))
  la a0, degreePart
  la a1, minutePart
  call copy
  ; sci/display.e16.ts:468  math(M_IDIV, addr(degreePart), addr(unit), 0)
  li a0, 8
  la a1, degreePart
  la a2, unit
  li a3, 0
  call math
  ; sci/display.e16.ts:469  math(M_SUB, addr(minutePart), addr(degreePart), 0)
  li a0, 2
  la a1, minutePart
  la a2, degreePart
  li a3, 0
  call math
  ; sci/display.e16.ts:470  sixty(addr(minutePart))
  la a0, minutePart
  call sixty
  ; sci/display.e16.ts:471  copy(addr(minutePart), addr(spare))
  la a0, minutePart
  la a1, spare
  call copy
  ; sci/display.e16.ts:472  math(M_IDIV, addr(minutePart), addr(unit), 0)
  li a0, 8
  la a1, minutePart
  la a2, unit
  li a3, 0
  call math
  ; sci/display.e16.ts:473  math(M_SUB, addr(spare), addr(minutePart), 0)
  li a0, 2
  la a1, spare
  la a2, minutePart
  li a3, 0
  call math
  ; sci/display.e16.ts:474  sixty(addr(spare))
  la a0, spare
  call sixty
  ; sci/display.e16.ts:475  poke16(MATH_ARG, u16(-2))
  li t0, 65534
  li t1, 65366
  sw t0, 0(t1)
  ; sci/display.e16.ts:476  math(M_RNDTO, addr(spare), 0, 0)
  li a0, 40
  la a1, spare
  li a2, 0
  li a3, 0
  call math
  ; sci/display.e16.ts:477  textLength = 0
  sw zero, 0x069c(zero)
  ; sci/display.e16.ts:478  if (isNegative(v)) addChar(0x2d)
  mv a0, s1
  call isNegative
  beqz a0, .L2
  ; sci/display.e16.ts:478  addChar(0x2d)
  li a0, 45
  call addChar
.L2:
  ; sci/display.e16.ts:479  part(addr(degreePart), T_DEG)
  la a0, degreePart
  li a1, 136
  call part
  ; sci/display.e16.ts:480  part(addr(minutePart), T_MIN)
  la a0, minutePart
  li a1, 137
  call part
  ; sci/display.e16.ts:481  part(addr(spare), T_SEC)
  la a0, spare
  li a1, 138
  call part
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:485 sixty(n) at -O1
;   n in s1
sixty:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; sci/display.e16.ts:486  setDigits(60)
  li a0, 60
  call setDigits
  ; sci/display.e16.ts:487  math(M_MUL, n, addr(unit), 0)
  li a0, 3
  mv a1, s1
  la a2, unit
  li a3, 0
  call math
  ; sci/display.e16.ts:488  setDigits(1)
  li a0, 1
  call setDigits
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:492 part(n, mark) at -O1
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
  ; sci/display.e16.ts:493  const at = textLength
  lw s1, 0x069c(zero)
  ; sci/display.e16.ts:494  const before = addr(text) + at
  addi s0, s1, text
  ; sci/display.e16.ts:495  poke16(MATH_ARG, 10)
  li t0, 10
  li t1, 65366
  sw t0, 0(t1)
  ; sci/display.e16.ts:496  math(M_FORMAT, n, before, 0)
  li a0, 57
  mv a1, s2
  mv a2, s0
  li a3, 0
  call math
  ; sci/display.e16.ts:497  textLength = at + peek16(MATH_ARG)
  li t0, 65366
  lw t0, 0(t0)
  add t0, s1, t0
  sw t0, 0x069c(zero)
  ; sci/display.e16.ts:498  addChar(mark)
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

; sci/display.e16.ts:502 setDigits(n) at -O1
;   n in a0
;   k in a1
setDigits:
  ; sci/display.e16.ts:503  for (let k: u16 = 0; k < 8; k++) unit[k] = 0
  li a1, 0 ; k
  j .L3
.L1:
  ; sci/display.e16.ts:503  unit[k] = 0
  sb zero, unit(a1)
  addi a1, a1, 1
.L3:
  li t0, 8
  bltu a1, t0, .L1
  ; sci/display.e16.ts:504  if (n >= 10) {
  li t0, 10
  bltu a0, t0, .L5
  ; sci/display.e16.ts:505  unit[1] = 1
  li t0, 1
  sb t0, unit+1(zero)
  ; sci/display.e16.ts:506  unit[2] = (div(n, 10) << 4) | (n % 10)
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
  ; sci/display.e16.ts:507  unit[2] = n << 4
  slli t0, a0, 4
  sb t0, unit+2(zero)
.L6:
.return:
  ret

; sci/display.e16.ts:510 copy(from, to) at -O1
;   from in a0
;   to in a1
;   k in a2
copy:
  ; sci/display.e16.ts:511  for (let k: u16 = 0; k < 8; k++) poke(to + k, peek(from + k))
  li a2, 0 ; k
  j .L3
.L1:
  ; sci/display.e16.ts:511  poke(to + k, peek(from + k))
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

str_130:
  .byte 129, 49, 48, 0
str_131:
  .byte 88, 61, 0
str_132:
  .byte 89, 61, 0
str_133:
  .byte 68, 73, 70, 70, 61, 0
  .align 2

  .bank 6
  .org 0xc000
; sci/solve.e16.ts:76 askStart(at, length, find) at -O1
;   at in s2
;   length in s3
;   find in s1
askStart:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; at
  mv s3, a1 ; length
  mv s1, a2 ; find
  ; sci/solve.e16.ts:77  askingAt = at
  sw s2, 0x06fa(zero)
  ; sci/solve.e16.ts:78  askingLength = length
  sw s3, 0x06fc(zero)
  ; sci/solve.e16.ts:79  finding = find
  sw s1, 0x06fe(zero)
  ; sci/solve.e16.ts:80  askedFor = find ? FOR_FIND : FOR_FX
  beqz s1, .L1
  li t0, 1
  j .L2
.L1:
  li t0, 0
.L2:
  sw t0, 0x0700(zero)
  ; sci/solve.e16.ts:81  target = varAt(X)
  li t0, 3336
  sw t0, 0x0702(zero)
  ; sci/solve.e16.ts:82  label = str('X?')
  la t0, str_134
  sw t0, 0x0704(zero)
  ; sci/solve.e16.ts:83  entryLength = 0
  sw zero, 0x072e(zero)
  ; sci/solve.e16.ts:84  drawAsk()
  call drawAsk
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/solve.e16.ts:88 askRange(k, into) at -O1
;   k in s1
;   into in s2
askRange:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; into
  ; sci/solve.e16.ts:89  askedFor = FOR_TABLE
  li t0, 2
  sw t0, 0x0700(zero)
  ; sci/solve.e16.ts:90  target = into
  sw s2, 0x0702(zero)
  ; sci/solve.e16.ts:91  label = k === 0 ? str('START?') : k === 1 ? str('END?') : str('STEP?')
  bne s1, zero, .L1
  la t0, str_135
  j .L2
.L1:
  li t0, 1
  bne s1, t0, .L3
  la t0, str_136
  j .L4
.L3:
  la t0, str_137
.L4:
.L2:
  sw t0, 0x0704(zero)
  ; sci/solve.e16.ts:92  entryLength = 0
  sw zero, 0x072e(zero)
  ; sci/solve.e16.ts:93  drawAsk()
  call drawAsk
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/solve.e16.ts:97 askKey(isEquals, isDelete, isClear, t) at -O1
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
  ; sci/solve.e16.ts:98  if (isClear) return ASK_BACK
  beqz s0, .L1
  ; sci/solve.e16.ts:98  return ASK_BACK
  li a0, 1
  j .return
.L1:
  ; sci/solve.e16.ts:99  if (isEquals) {
  beqz s2, .L2
  ; sci/solve.e16.ts:100  finish()
  call finish
  ; sci/solve.e16.ts:101  return ASK_DONE
  li a0, 2
  j .return
.L2:
  ; sci/solve.e16.ts:103  if (isDelete) {
  beqz s3, .L3
  ; sci/solve.e16.ts:104  if (entryLength > 0) entryLength--
  lw t0, 0x072e(zero)
  bgeu zero, t0, .L5
  ; sci/solve.e16.ts:104  entryLength--
  lw t0, 0x072e(zero)
  addi t0, t0, -1
  sw t0, 0x072e(zero)
  j .L5
.L3:
  ; sci/solve.e16.ts:105  if (t !== 0 && entryLength < 40) {
  beq s1, zero, .L6
  lw t0, 0x072e(zero)
  li t1, 40
  bgeu t0, t1, .L6
  ; sci/solve.e16.ts:106  entry[entryLength] = t
  lw t0, 0x072e(zero)
  sb s1, entry(t0)
  ; sci/solve.e16.ts:107  entryLength++
  lw t0, 0x072e(zero)
  addi t0, t0, 1
  sw t0, 0x072e(zero)
.L6:
.L5:
  ; sci/solve.e16.ts:109  drawAsk()
  call drawAsk
  ; sci/solve.e16.ts:110  return ASK_STAY
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/solve.e16.ts:114 drawAsk() at -O1
;   col in s1
;   i in s2
drawAsk:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/solve.e16.ts:115  cls()
  call cls
  ; sci/solve.e16.ts:116  band(askedFor === FOR_TABLE ? str('TABLE') : finding ? str('FIND X') : str('f(X)'))
  lw t0, 0x0700(zero)
  li t1, 2
  bne t0, t1, .L1
  la t0, str_138
  j .L2
.L1:
  lw t0, 0x06fe(zero)
  beqz t0, .L3
  la t0, str_139
  j .L4
.L3:
  la t0, str_140
.L4:
.L2:
  mv a0, t0
  call band
  ; sci/solve.e16.ts:117  textAt(label, 1, lineY(0))
  lw a0, 0x0704(zero)
  li a1, 1
  li a2, 11
  call textAt
  ; sci/solve.e16.ts:118  formatInto(target)
  lw a0, 0x0702(zero)
  call formatInto
  ; sci/solve.e16.ts:119  textRight(addr(xText), lineY(1))
  la a0, xText
  li a1, 20
  call textRight
  ; sci/solve.e16.ts:120  let col: u16 = 0
  li s1, 0 ; col
  ; sci/solve.e16.ts:121  for (let i: u16 = 0; i < entryLength; i++) col = shownAt(entry[i], col)
  li s2, 0 ; i
  j .L7
.L5:
  ; sci/solve.e16.ts:121  col = shownAt(entry[i], col)
  lbu a0, entry(s2)
  mv a1, s1
  call shownAt
  mv s1, a0 ; col
  addi s2, s2, 1
.L7:
  lw t0, 0x072e(zero)
  bltu s2, t0, .L5
  ; sci/solve.e16.ts:122  textAt(str('=:GO   AC:BACK'), 1, lineY(5))
  la a0, str_141
  li a1, 1
  li a2, 56
  call textAt
  ; sci/solve.e16.ts:123  barAt(col < 21 ? col : 20, 4)
  li t0, 21
  bgeu s1, t0, .L9
  mv t0, s1
  j .L10
.L9:
  li t0, 20
.L10:
  mv a0, t0
  li a1, 4
  call barAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/solve.e16.ts:127 shownAt(t, col/c) at -O1
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
  ; sci/solve.e16.ts:128  const s = tokenText(t)
  mv a0, s3
  call tokenText
  mv s2, a0 ; s/p
  ; sci/solve.e16.ts:129  if (s === 0) {
  bne s2, zero, .L1
  ; sci/solve.e16.ts:130  if (col < 21) glyphAt(t, col * 6, 32)
  li t0, 21
  bgeu s1, t0, .L2
  ; sci/solve.e16.ts:130  glyphAt(t, col * 6, 32)
  slli t1, s1, 2
  slli t0, s1, 1
  add a1, t0, t1
  mv a0, s3
  li a2, 32
  call glyphAt
.L2:
  ; sci/solve.e16.ts:131  return col + 1
  addi a0, s1, 1
  j .return
.L1:
  ; sci/solve.e16.ts:133  let c = col
  ; sci/solve.e16.ts:134  let p = s
  ; sci/solve.e16.ts:135  while (peek(p) !== 0) {
  j .L5
.L3:
  ; sci/solve.e16.ts:136  if (c < 21) glyphAt(peek(p), c * 6, 32)
  li t0, 21
  bgeu s1, t0, .L7
  ; sci/solve.e16.ts:136  glyphAt(peek(p), c * 6, 32)
  lbu a0, 0(s2)
  slli t2, s1, 2
  slli t1, s1, 1
  add a1, t1, t2
  li a2, 32
  call glyphAt
.L7:
  ; sci/solve.e16.ts:137  c++
  addi s1, s1, 1
  ; sci/solve.e16.ts:138  p++
  addi s2, s2, 1
.L5:
  lbu t0, 0(s2)
  bne t0, zero, .L3
  ; sci/solve.e16.ts:140  return c
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/solve.e16.ts:145 formatInto(v) at -O1
;   v in s1
formatInto:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/solve.e16.ts:146  poke16(MATH_ARG, 10)
  li t0, 10
  li t1, 65366
  sw t0, 0(t1)
  ; sci/solve.e16.ts:147  math(M_FORMAT, v, addr(xText), 0)
  li a0, 57
  mv a1, s1
  la a2, xText
  li a3, 0
  call math
  ; sci/solve.e16.ts:148  xText[peek16(MATH_ARG)] = 0
  li t0, 65366
  lw t0, 0(t0)
  sb zero, xText(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/solve.e16.ts:152 finish() at -O1
finish:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:153  noCursor()
  call noCursor
  ; sci/solve.e16.ts:154  if (entryLength > 0) {
  lw t0, 0x072e(zero)
  bgeu zero, t0, .L1
  ; sci/solve.e16.ts:155  clearStack()
  call clearStack
  ; sci/solve.e16.ts:156  evaluate(addr(entry), entryLength)
  lw a1, 0x072e(zero)
  la a0, entry
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/solve.e16.ts:157  copyValue(top(), target)
  call top
  lw a1, 0x0702(zero)
  call copyValue
.L1:
  ; sci/solve.e16.ts:159  if (askedFor === FOR_TABLE) return
  lw t0, 0x0700(zero)
  li t1, 2
  bne t0, t1, .L2
  ; sci/solve.e16.ts:159  return
  j .return
.L2:
  ; sci/solve.e16.ts:160  if (finding) newton()
  lw t0, 0x06fe(zero)
  beqz t0, .L3
  ; sci/solve.e16.ts:160  newton()
  call newton
  j .L4
.L3:
  ; sci/solve.e16.ts:162  evalWith(varAt(X))
  li a0, 3336
  call evalWith
  ; sci/solve.e16.ts:163  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
.L4:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:168 evalWith(v) at -O1
;   v in s1
evalWith:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/solve.e16.ts:169  copyValue(v, varAt(X))
  mv a0, s1
  li a1, 3336
  call copyValue
  ; sci/solve.e16.ts:170  clearStack()
  call clearStack
  ; sci/solve.e16.ts:171  evaluate(askingAt, askingLength)
  lw a0, 0x06fa(zero)
  lw a1, 0x06fc(zero)
  la t0, evaluate
  li t1, 0
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/solve.e16.ts:179 newton() at -O1
;   settled in s1
;   k in s2
newton:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/solve.e16.ts:180  copyValue(varAt(X), addr(x))
  li a0, 3336
  la a1, x
  call copyValue
  ; sci/solve.e16.ts:181  inexact(addr(x))
  la a0, x
  call inexact
  ; sci/solve.e16.ts:182  let settled = false
  li s1, 0 ; settled
  ; sci/solve.e16.ts:183  for (let k: u16 = 0; k < STEPS && !settled; k++) settled = newtonStep()
  li s2, 0 ; k
  j .L3
.L1:
  ; sci/solve.e16.ts:183  settled = newtonStep()
  call newtonStep
  mv s1, a0 ; settled
  addi s2, s2, 1
.L3:
  li t0, 60
  bgeu s2, t0, .L5
  beqz s1, .L1
.L5:
  ; sci/solve.e16.ts:184  copyValue(addr(x), varAt(X))
  la a0, x
  li a1, 3336
  call copyValue
  ; sci/solve.e16.ts:185  if (!settled) fail(E_FIND, 0)
  bnez s1, .L6
  ; sci/solve.e16.ts:185  fail(E_FIND, 0)
  li a0, 4
  li a1, 0
  call fail
.L6:
  ; sci/solve.e16.ts:186  evalWith(addr(x))
  la a0, x
  call evalWith
  ; sci/solve.e16.ts:187  copyValue(top(), addr(diffValue))
  call top
  la a1, diffValue
  call copyValue
  ; sci/solve.e16.ts:188  copyValue(addr(x), varAt(X))
  la a0, x
  li a1, 3336
  call copyValue
  ; sci/solve.e16.ts:189  copyValue(addr(x), KEEP_ANS)
  la a0, x
  li a1, 3080
  call copyValue
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/solve.e16.ts:193 newtonStep() at -O1
newtonStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:194  evalWith(addr(x))
  la a0, x
  call evalWith
  ; sci/solve.e16.ts:195  copyValue(top(), addr(fx))
  call top
  la a1, fx
  call copyValue
  ; sci/solve.e16.ts:196  if (isZero(addr(fx))) return true
  la a0, fx
  call isZero
  beqz a0, .L1
  ; sci/solve.e16.ts:196  return true
  li a0, 1
  j .return
.L1:
  ; sci/solve.e16.ts:198  copyValue(addr(x), addr(step))
  la a0, x
  la a1, step
  call copyValue
  ; sci/solve.e16.ts:199  math(M_ABS, addr(step), 0, 0)
  li a0, 17
  la a1, step
  li a2, 0
  li a3, 0
  call math
  ; sci/solve.e16.ts:200  setConstant(0, 0x10)
  li a0, 0
  li a1, 16
  call setConstant
  ; sci/solve.e16.ts:201  math(M_CMP, addr(step), addr(small), 0)
  li a0, 6
  la a1, step
  la a2, small
  li a3, 0
  call math
  ; sci/solve.e16.ts:202  if (peek16(MATH_RESULT) === 0xffff) setOneInStep()
  li t0, 65370
  lw t0, 0(t0)
  li t1, 65535
  bne t0, t1, .L2
  ; sci/solve.e16.ts:202  setOneInStep()
  call setOneInStep
.L2:
  ; sci/solve.e16.ts:203  setMillionth()
  call setMillionth
  ; sci/solve.e16.ts:204  math(M_MUL, addr(step), addr(small), 0)
  li a0, 3
  la a1, step
  la a2, small
  li a3, 0
  call math
  ; sci/solve.e16.ts:205  slope()
  call slope
  ; sci/solve.e16.ts:206  if (isZero(addr(ahead))) fail(E_FIND, 0)
  la a0, ahead
  call isZero
  beqz a0, .L3
  ; sci/solve.e16.ts:206  fail(E_FIND, 0)
  li a0, 4
  li a1, 0
  call fail
.L3:
  ; sci/solve.e16.ts:208  math(M_DIV, addr(fx), addr(ahead), 0)
  li a0, 4
  la a1, fx
  la a2, ahead
  li a3, 0
  call math
  ; sci/solve.e16.ts:209  math(M_SUB, addr(x), addr(fx), 0)
  li a0, 2
  la a1, x
  la a2, fx
  li a3, 0
  call math
  ; sci/solve.e16.ts:210  return smallStep()
  call smallStep
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:214 slope() at -O1
slope:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:215  copyValue(addr(x), addr(ahead))
  la a0, x
  la a1, ahead
  call copyValue
  ; sci/solve.e16.ts:216  math(M_ADD, addr(ahead), addr(step), 0)
  li a0, 1
  la a1, ahead
  la a2, step
  li a3, 0
  call math
  ; sci/solve.e16.ts:217  evalWith(addr(ahead))
  la a0, ahead
  call evalWith
  ; sci/solve.e16.ts:218  copyValue(top(), addr(ahead))
  call top
  la a1, ahead
  call copyValue
  ; sci/solve.e16.ts:219  copyValue(addr(x), addr(small))
  la a0, x
  la a1, small
  call copyValue
  ; sci/solve.e16.ts:220  math(M_SUB, addr(small), addr(step), 0)
  li a0, 2
  la a1, small
  la a2, step
  li a3, 0
  call math
  ; sci/solve.e16.ts:221  evalWith(addr(small))
  la a0, small
  call evalWith
  ; sci/solve.e16.ts:222  math(M_SUB, addr(ahead), top(), 0)
  call top
  la a1, ahead
  mv a2, a0
  li a0, 2
  li a3, 0
  call math
  ; sci/solve.e16.ts:223  math(M_DIV, addr(ahead), addr(step), 0)
  li a0, 4
  la a1, ahead
  la a2, step
  li a3, 0
  call math
  ; sci/solve.e16.ts:224  setHalf()
  call setHalf
  ; sci/solve.e16.ts:225  math(M_MUL, addr(ahead), addr(small), 0)
  li a0, 3
  la a1, ahead
  la a2, small
  li a3, 0
  call math
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:229 smallStep() at -O1
smallStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:230  math(M_ABS, addr(fx), 0, 0)
  li a0, 17
  la a1, fx
  li a2, 0
  li a3, 0
  call math
  ; sci/solve.e16.ts:231  copyValue(addr(x), addr(step))
  la a0, x
  la a1, step
  call copyValue
  ; sci/solve.e16.ts:232  math(M_ABS, addr(step), 0, 0)
  li a0, 17
  la a1, step
  li a2, 0
  li a3, 0
  call math
  ; sci/solve.e16.ts:233  setTiny()
  call setTiny
  ; sci/solve.e16.ts:234  if (isNegative(addr(step)) || exponentBelowZero(addr(step))) {
  la a0, step
  call isNegative
  bnez a0, .L2
  ; sci/solve.e16.ts:244  return peek(v + 1) >= 128
  lbu t0, step+1(zero)
  li t1, 128
  bltu t0, t1, .L1
.L2:
  ; sci/solve.e16.ts:235  math(M_CMP, addr(fx), addr(small), 0)
  li a0, 6
  la a1, fx
  la a2, small
  li a3, 0
  call math
  j .L3
.L1:
  ; sci/solve.e16.ts:237  math(M_MUL, addr(step), addr(small), 0)
  li a0, 3
  la a1, step
  la a2, small
  li a3, 0
  call math
  ; sci/solve.e16.ts:238  math(M_CMP, addr(fx), addr(step), 0)
  li a0, 6
  la a1, fx
  la a2, step
  li a3, 0
  call math
.L3:
  ; sci/solve.e16.ts:240  return peek16(MATH_RESULT) !== 1
  li t0, 65370
  lw t0, 0(t0)
  li t1, 1
  sub t0, t0, t1
  snez a0, t0
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:249 setConstant(exponent, digits) at -O1
;   exponent in a0
;   digits in a1
;   k in a2
setConstant:
  ; sci/solve.e16.ts:250  for (let k: u16 = 0; k < VALUE_SIZE; k++) small[k] = 0
  li a2, 0 ; k
  j .L3
.L1:
  ; sci/solve.e16.ts:250  small[k] = 0
  sb zero, small(a2)
  addi a2, a2, 1
.L3:
  li t0, 36
  bltu a2, t0, .L1
  ; sci/solve.e16.ts:251  small[1] = exponent
  sb a0, small+1(zero)
  ; sci/solve.e16.ts:252  small[2] = digits
  sb a1, small+2(zero)
.return:
  ret

; sci/solve.e16.ts:256 setMillionth() at -O1
setMillionth:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:257  setConstant(0xfa, 0x10)
  li a0, 250
  li a1, 16
  call setConstant
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:261 setHalf() at -O1
setHalf:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:262  setConstant(0xff, 0x50)
  li a0, 255
  li a1, 80
  call setConstant
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:266 setTiny() at -O1
setTiny:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:267  setConstant(0xf5, 0x10)
  li a0, 245
  li a1, 16
  call setConstant
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:271 setOneInStep() at -O1
;   k in a0
setOneInStep:
  ; sci/solve.e16.ts:272  for (let k: u16 = 0; k < VALUE_SIZE; k++) step[k] = 0
  li a0, 0 ; k
  j .L3
.L1:
  ; sci/solve.e16.ts:272  step[k] = 0
  sb zero, step(a0)
  addi a0, a0, 1
.L3:
  li t0, 36
  bltu a0, t0, .L1
  ; sci/solve.e16.ts:273  step[2] = 0x10
  li t0, 16
  sb t0, step+2(zero)
.return:
  ret

str_134:
  .byte 88, 63, 0
str_135:
  .byte 83, 84, 65, 82, 84, 63, 0
str_136:
  .byte 69, 78, 68, 63, 0
str_137:
  .byte 83, 84, 69, 80, 63, 0
str_138:
  .byte 84, 65, 66, 76, 69, 0
str_139:
  .byte 70, 73, 78, 68, 32, 88, 0
str_140:
  .byte 102, 40, 88, 41, 0
str_141:
  .byte 61, 58, 71, 79, 32, 32, 32, 65, 67, 58, 66, 65, 67, 75, 0
  .align 2

  .bank 7
  .org 0xc000
; sci/stats.e16.ts:94 statsStart() at -O1
statsStart:
  ; sci/stats.e16.ts:95  phase = PH_TYPE
  sw zero, 0x07f4(zero)
.return:
  ret

; sci/stats.e16.ts:99 statsReset() at -O1
statsReset:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/stats.e16.ts:100  phase = PH_GRID
  li t0, 1
  sw t0, 0x07f4(zero)
  ; sci/stats.e16.ts:101  gridOpen(GRID_STATS, 0, 0)
  li a0, 0
  li a1, 0
  li a2, 0
  la t0, gridOpen
  li t1, 9
  call far_call
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/stats.e16.ts:104 statKind() at -O1
;   t in a0
statKind:
  ; sci/stats.e16.ts:105  const t = peek(STATS_TYPE)
  lbu a0, 5636(zero)
  ; sci/stats.e16.ts:106  return t <= KIND_INV ? t : KIND_1VAR
  li t0, 6
  bltu t0, a0, .L1
  mv t0, a0
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
.return:
  ret

; sci/stats.e16.ts:109 twoVar() at -O1
twoVar:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/stats.e16.ts:110  return statKind() !== KIND_1VAR
  call statKind
  sub t0, a0, zero
  snez a0, t0
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/stats.e16.ts:115 statsKey(k/r, shift) at -O1
;   k/r in s1
;   shift in s2
statsKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/r
  mv s2, a1 ; shift
  ; sci/stats.e16.ts:116  if (phase === PH_TYPE) typeKey(k)
  lw t0, 0x07f4(zero)
  bne t0, zero, .L1
  ; sci/stats.e16.ts:116  typeKey(k)
  mv a0, s1
  call typeKey
  j .L2
.L1:
  ; sci/stats.e16.ts:117  if (phase === PH_FUNC) statsFuncKey(k)
  lw t0, 0x07f4(zero)
  li t1, 2
  bne t0, t1, .L3
  ; sci/stats.e16.ts:117  statsFuncKey(k)
  mv a0, s1
  call statsFuncKey
  j .L4
.L3:
  ; sci/stats.e16.ts:118  if (phase === PH_RESULT) resultKey(k)
  lw t0, 0x07f4(zero)
  li t1, 3
  bne t0, t1, .L5
  ; sci/stats.e16.ts:118  resultKey(k)
  mv a0, s1
  call resultKey
  j .L6
.L5:
  ; sci/stats.e16.ts:119  if (k === K_FUNC) phase = PH_FUNC
  li t0, 11
  bne s1, t0, .L7
  ; sci/stats.e16.ts:119  phase = PH_FUNC
  li t0, 2
  sw t0, 0x07f4(zero)
  j .L8
.L7:
  ; sci/stats.e16.ts:121  const r = gridKey(k, shift)
  mv a0, s1
  mv a1, s2
  la t0, gridKey
  li t1, 9
  call far_call
  mv s1, a0 ; k/r
  ; sci/stats.e16.ts:122  if (r === GRID_DONE) {
  li t0, 1
  bne s1, t0, .L9
  ; sci/stats.e16.ts:123  if (peek16(STATS_COUNT) === 0) refuse()
  lw t0, 5634(zero)
  bne t0, zero, .L10
  ; sci/stats.e16.ts:123  refuse()
  call refuse
  j .L12
.L10:
  ; sci/stats.e16.ts:125  workOut()
  call workOut
  ; sci/stats.e16.ts:126  resultPage = 0
  sw zero, 0x07f6(zero)
  ; sci/stats.e16.ts:127  phase = PH_RESULT
  li t0, 3
  sw t0, 0x07f4(zero)
  j .L12
.L9:
  ; sci/stats.e16.ts:129  if (r === GRID_AC) refuse()
  li t0, 2
  bne s1, t0, .L13
  ; sci/stats.e16.ts:129  refuse()
  call refuse
.L13:
.L12:
.L8:
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:134 typeKey(k) at -O1
;   k in s1
;   t in s2
typeKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  ; sci/stats.e16.ts:135  const t = typeOfKey(k)
  mv a0, s1
  call typeOfKey
  mv s2, a0 ; t
  ; sci/stats.e16.ts:136  if (t !== 0xffff) {
  li t0, 65535
  beq s2, t0, .L1
  ; sci/stats.e16.ts:137  poke(STATS_TYPE, t)
  sb s2, 5636(zero)
  ; sci/stats.e16.ts:138  statsReset()
  call statsReset
  j .L2
.L1:
  ; sci/stats.e16.ts:139  if (k === K_8) poke(STATS_FREQ, peek(STATS_FREQ) === 0 ? 1 : 0)
  li t0, 41
  bne s1, t0, .L3
  ; sci/stats.e16.ts:139  poke(STATS_FREQ, peek(STATS_FREQ) === 0 ? 1 : 0)
  lbu t1, 5637(zero)
  li t0, 5637
  li t2, 0
  bne t1, t2, .L4
  li t1, 1
  j .L5
.L4:
  li t1, 0
.L5:
  sb t1, 0(t0)
  j .L6
.L3:
  ; sci/stats.e16.ts:140  if (k === K_AC) statsReset()
  li t0, 5
  bne s1, t0, .L7
  ; sci/stats.e16.ts:140  statsReset()
  call statsReset
  j .L8
.L7:
  ; sci/stats.e16.ts:141  refuse()
  call refuse
.L8:
.L6:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:144 typeOfKey(k) at -O1
;   k in a0
typeOfKey:
  ; sci/stats.e16.ts:145  if (k === K_1) return KIND_1VAR
  li t0, 56
  bne a0, t0, .L1
  ; sci/stats.e16.ts:145  return KIND_1VAR
  li a0, 0
  ret
.L1:
  ; sci/stats.e16.ts:146  if (k === K_2) return KIND_LINE
  li t0, 57
  bne a0, t0, .L2
  ; sci/stats.e16.ts:146  return KIND_LINE
  li a0, 1
  ret
.L2:
  ; sci/stats.e16.ts:147  if (k === K_3) return KIND_QUAD
  li t0, 58
  bne a0, t0, .L3
  ; sci/stats.e16.ts:147  return KIND_QUAD
  li a0, 2
  ret
.L3:
  ; sci/stats.e16.ts:148  if (k === K_4) return KIND_EXP
  li t0, 48
  bne a0, t0, .L4
  ; sci/stats.e16.ts:148  return KIND_EXP
  li a0, 3
  ret
.L4:
  ; sci/stats.e16.ts:149  if (k === K_5) return KIND_LOG
  li t0, 49
  bne a0, t0, .L5
  ; sci/stats.e16.ts:149  return KIND_LOG
  li a0, 4
  ret
.L5:
  ; sci/stats.e16.ts:150  if (k === K_6) return KIND_PWR
  li t0, 50
  bne a0, t0, .L6
  ; sci/stats.e16.ts:150  return KIND_PWR
  li a0, 5
  ret
.L6:
  ; sci/stats.e16.ts:151  return k === K_7 ? KIND_INV : 0xffff
  li t0, 40
  bne a0, t0, .L7
  li t0, 6
  j .L8
.L7:
  li t0, 65535
.L8:
  mv a0, t0
.return:
  ret

; sci/stats.e16.ts:155 statsFuncKey(k) at -O1
;   k in s1
statsFuncKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/stats.e16.ts:156  phase = PH_GRID
  li t0, 1
  sw t0, 0x07f4(zero)
  ; sci/stats.e16.ts:157  if (k === K_1) newRow(gridRow())
  li t0, 56
  bne s1, t0, .L1
  ; sci/stats.e16.ts:157  newRow(gridRow())
  la t0, gridRow
  li t1, 9
  call far_call
  la t0, newRow
  li t1, 9
  call far_call
  j .L2
.L1:
  ; sci/stats.e16.ts:158  if (k === K_2) deleteRow()
  li t0, 57
  bne s1, t0, .L3
  ; sci/stats.e16.ts:158  deleteRow()
  la t0, deleteRow
  li t1, 9
  call far_call
  j .L4
.L3:
  ; sci/stats.e16.ts:159  if (k === K_3) clearRows()
  li t0, 58
  bne s1, t0, .L5
  ; sci/stats.e16.ts:159  clearRows()
  la t0, clearRows
  li t1, 9
  call far_call
  j .L6
.L5:
  ; sci/stats.e16.ts:160  if (k === K_4) phase = PH_TYPE
  li t0, 48
  bne s1, t0, .L7
  ; sci/stats.e16.ts:160  phase = PH_TYPE
  sw zero, 0x07f4(zero)
  j .L8
.L7:
  ; sci/stats.e16.ts:161  if (k !== K_AC) {
  li t0, 5
  beq s1, t0, .L9
  ; sci/stats.e16.ts:162  refuse()
  call refuse
  ; sci/stats.e16.ts:163  phase = PH_FUNC
  li t0, 2
  sw t0, 0x07f4(zero)
.L9:
.L8:
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/stats.e16.ts:167 resultKey(k) at -O1
;   k in s1
;   pages in s2
resultKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  ; sci/stats.e16.ts:168  const pages: u16 = twoVar() ? 3 : 1
  call twoVar
  beqz a0, .L1
  li t0, 3
  j .L2
.L1:
  li t0, 1
.L2:
  mv s2, t0 ; pages
  ; sci/stats.e16.ts:169  if (k === K_DOWN && resultPage + 1 < pages) resultPage++
  li t0, 1
  bne s1, t0, .L3
  lw t0, 0x07f6(zero)
  addi t0, t0, 1
  bgeu t0, s2, .L3
  ; sci/stats.e16.ts:169  resultPage++
  lw t0, 0x07f6(zero)
  addi t0, t0, 1
  sw t0, 0x07f6(zero)
  j .L4
.L3:
  ; sci/stats.e16.ts:170  if (k === K_UP && resultPage > 0) resultPage--
  bne s1, zero, .L5
  lw t0, 0x07f6(zero)
  bgeu zero, t0, .L5
  ; sci/stats.e16.ts:170  resultPage--
  lw t0, 0x07f6(zero)
  addi t0, t0, -1
  sw t0, 0x07f6(zero)
  j .L6
.L5:
  ; sci/stats.e16.ts:171  if (k === K_AC) phase = PH_GRID
  li t0, 5
  bne s1, t0, .L7
  ; sci/stats.e16.ts:171  phase = PH_GRID
  li t0, 1
  sw t0, 0x07f4(zero)
  j .L8
.L7:
  ; sci/stats.e16.ts:172  refuse()
  call refuse
.L8:
.L6:
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:177 statsDraw() at -O1
statsDraw:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/stats.e16.ts:178  cls()
  call cls
  ; sci/stats.e16.ts:179  if (phase === PH_TYPE) drawType()
  lw t0, 0x07f4(zero)
  bne t0, zero, .L1
  ; sci/stats.e16.ts:179  drawType()
  call drawType
  j .L2
.L1:
  ; sci/stats.e16.ts:180  if (phase === PH_FUNC) drawFunc()
  lw t0, 0x07f4(zero)
  li t1, 2
  bne t0, t1, .L3
  ; sci/stats.e16.ts:180  drawFunc()
  call drawFunc
  j .L4
.L3:
  ; sci/stats.e16.ts:181  if (phase === PH_RESULT) drawResults()
  lw t0, 0x07f4(zero)
  li t1, 3
  bne t0, t1, .L5
  ; sci/stats.e16.ts:181  drawResults()
  call drawResults
  j .L6
.L5:
  ; sci/stats.e16.ts:183  countText()
  call countText
  ; sci/stats.e16.ts:184  bandWith(kindTitle(str('STATS '), 0), addr(countChars))
  la a0, str_142
  li a1, 0
  call kindTitle
  la a1, countChars
  call bandWith
  ; sci/stats.e16.ts:185  gridDraw()
  la t0, gridDraw
  li t1, 9
  call far_call
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/stats.e16.ts:192 kindTitle(before, after) at -O1
;   before in s2
;   after in s3
;   n in s1
kindTitle:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; before
  mv s3, a1 ; after
  ; sci/stats.e16.ts:193  let n: u16 = 0
  li s1, 0 ; n
  ; sci/stats.e16.ts:194  if (before !== 0) n = copyText(before, n)
  beq s2, zero, .L1
  ; sci/stats.e16.ts:194  n = copyText(before, n)
  mv a0, s2
  mv a1, s1
  call copyText
  mv s1, a0 ; n
.L1:
  ; sci/stats.e16.ts:195  n = copyText(kindName(statKind()), n)
  call statKind
  call kindName
  mv a1, s1
  call copyText
  mv s1, a0 ; n
  ; sci/stats.e16.ts:196  if (after !== 0) n = copyText(after, n)
  beq s3, zero, .L2
  ; sci/stats.e16.ts:196  n = copyText(after, n)
  mv a0, s3
  mv a1, s1
  call copyText
  mv s1, a0 ; n
.L2:
  ; sci/stats.e16.ts:197  titleText[n] = 0
  sb zero, titleText(s1)
  ; sci/stats.e16.ts:198  return addr(titleText)
  la a0, titleText
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/stats.e16.ts:201 copyText(from/p, n/k) at -O1
;   from/p in a0
;   n/k in a1
copyText:
  ; sci/stats.e16.ts:202  let k = n
  ; sci/stats.e16.ts:203  let p = from
  ; sci/stats.e16.ts:204  while (peek(p) !== 0 && k < 15) {
  j .L3
.L1:
  ; sci/stats.e16.ts:205  titleText[k] = peek(p)
  lbu t0, 0(a0)
  sb t0, titleText(a1)
  ; sci/stats.e16.ts:206  k++
  addi a1, a1, 1
  ; sci/stats.e16.ts:207  p++
  addi a0, a0, 1
.L3:
  lbu t0, 0(a0)
  beq t0, zero, .L5
  li t0, 15
  bltu a1, t0, .L1
.L5:
  ; sci/stats.e16.ts:209  return k
  mv a0, a1
.return:
  ret

; sci/stats.e16.ts:212 kindName(t) at -O1
;   t in a0
kindName:
  ; sci/stats.e16.ts:213  switch (t) {
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
  j .L1
.L2:
  ; sci/stats.e16.ts:215  return str('LINE')
  la a0, str_143
  ret
.L3:
  ; sci/stats.e16.ts:217  return str('QUAD')
  la a0, str_144
  ret
.L4:
  ; sci/stats.e16.ts:219  return str('EXP')
  la a0, str_145
  ret
.L5:
  ; sci/stats.e16.ts:221  return str('LOG')
  la a0, str_146
  ret
.L6:
  ; sci/stats.e16.ts:223  return str('PWR')
  la a0, str_147
  ret
.L7:
  ; sci/stats.e16.ts:225  return str('INV')
  la a0, str_148
  ret
.L1:
  ; sci/stats.e16.ts:227  return str('1-VAR')
  la a0, str_149
.return:
  ret

; sci/stats.e16.ts:233 countText() at -O1
;   n in a0
;   i in a1
countText:
  ; sci/stats.e16.ts:234  const n = peek16(STATS_COUNT)
  lw a0, 5634(zero)
  ; sci/stats.e16.ts:235  countChars[0] = 0x6e
  li t0, 110
  sb t0, countChars(zero)
  ; sci/stats.e16.ts:236  countChars[1] = 0x3d
  li t0, 61
  sb t0, countChars+1(zero)
  ; sci/stats.e16.ts:237  let i: u16 = 2
  li a1, 2 ; i
  ; sci/stats.e16.ts:238  if (n >= 10) {
  li t0, 10
  bltu a0, t0, .L1
  ; sci/stats.e16.ts:239  countChars[i] = 0x30 + (n >= 40 ? 4 : n >= 30 ? 3 : n >= 20 ? 2 : 1)
  addi t0, a1, countChars
  li t1, 48
  mv t2, a0
  li t3, 40
  bltu t2, t3, .L2
  li t2, 4
  j .L3
.L2:
  mv t2, a0
  li t3, 30
  bltu t2, t3, .L4
  li t2, 3
  j .L5
.L4:
  mv t2, a0
  li t3, 20
  bltu t2, t3, .L6
  li t2, 2
  j .L7
.L6:
  li t2, 1
.L7:
.L5:
.L3:
  add t1, t1, t2
  sb t1, 0(t0)
  ; sci/stats.e16.ts:240  i++
  addi a1, a1, 1
.L1:
  ; sci/stats.e16.ts:242  countChars[i] = 0x30 + (n % 10)
  li t1, 52429
  mulhu t0, a0, t1
  srli t0, t0, 3
  li t1, 10
  mul t0, t0, t1
  sub t0, a0, t0
  addi t0, t0, 48
  sb t0, countChars(a1)
  ; sci/stats.e16.ts:243  countChars[i + 1] = 0
  sb zero, countChars+1(a1)
.return:
  ret

; sci/stats.e16.ts:246 drawType() at -O1
drawType:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/stats.e16.ts:247  band(str('STATS'))
  la a0, str_150
  call band
  ; sci/stats.e16.ts:248  textAt(str('1:1-VAR 2:LINE'), 1, lineY(0))
  la a0, str_151
  li a1, 1
  li a2, 11
  call textAt
  ; sci/stats.e16.ts:249  textAt(str('3:QUAD 4:EXP 5:LOG'), 1, lineY(1))
  la a0, str_152
  li a1, 1
  li a2, 20
  call textAt
  ; sci/stats.e16.ts:250  textAt(str('6:PWR 7:INV'), 1, lineY(2))
  la a0, str_153
  li a1, 1
  li a2, 29
  call textAt
  ; sci/stats.e16.ts:251  textAt(str('8:FREQ'), 1, lineY(3))
  la a0, str_154
  li a1, 1
  li a2, 38
  call textAt
  ; sci/stats.e16.ts:252  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_155
  li a1, 1
  li a2, 56
  call textAt
  ; sci/stats.e16.ts:253  markKind(statKind())
  call statKind
  call markKind
  ; sci/stats.e16.ts:254  if (peek(STATS_FREQ) !== 0) mark(0, 6, 3)
  lbu t0, 5637(zero)
  beq t0, zero, .L1
  ; sci/stats.e16.ts:254  mark(0, 6, 3)
  li a0, 0
  li a1, 6
  li a2, 3
  call mark
.L1:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/stats.e16.ts:258 markKind(t) at -O1
;   t in s1
markKind:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/stats.e16.ts:259  switch (t) {
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
  j .L1
.L2:
  ; sci/stats.e16.ts:261  mark(0, 7, 0)
  li a0, 0
  li a1, 7
  li a2, 0
  call mark
  ; sci/stats.e16.ts:262  return
  j .return
.L3:
  ; sci/stats.e16.ts:264  mark(8, 6, 0)
  li a0, 8
  li a1, 6
  li a2, 0
  call mark
  ; sci/stats.e16.ts:265  return
  j .return
.L4:
  ; sci/stats.e16.ts:267  mark(0, 6, 1)
  li a0, 0
  li a1, 6
  li a2, 1
  call mark
  ; sci/stats.e16.ts:268  return
  j .return
.L5:
  ; sci/stats.e16.ts:270  mark(7, 5, 1)
  li a0, 7
  li a1, 5
  li a2, 1
  call mark
  ; sci/stats.e16.ts:271  return
  j .return
.L6:
  ; sci/stats.e16.ts:273  mark(13, 5, 1)
  li a0, 13
  li a1, 5
  li a2, 1
  call mark
  ; sci/stats.e16.ts:274  return
  j .return
.L7:
  ; sci/stats.e16.ts:276  mark(0, 5, 2)
  li a0, 0
  li a1, 5
  li a2, 2
  call mark
  ; sci/stats.e16.ts:277  return
  j .return
.L1:
  ; sci/stats.e16.ts:279  mark(6, 5, 2)
  li a0, 6
  li a1, 5
  li a2, 2
  call mark
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/stats.e16.ts:282 drawFunc() at -O1
drawFunc:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/stats.e16.ts:283  band(str('FUNC'))
  la a0, str_156
  call band
  ; sci/stats.e16.ts:284  textAt(str('1:INSERT ROW'), 1, lineY(0))
  la a0, str_157
  li a1, 1
  li a2, 11
  call textAt
  ; sci/stats.e16.ts:285  textAt(str('2:DELETE ROW'), 1, lineY(1))
  la a0, str_158
  li a1, 1
  li a2, 20
  call textAt
  ; sci/stats.e16.ts:286  textAt(str('3:CLEAR ALL'), 1, lineY(2))
  la a0, str_159
  li a1, 1
  li a2, 29
  call textAt
  ; sci/stats.e16.ts:287  textAt(str('4:KIND'), 1, lineY(3))
  la a0, str_160
  li a1, 1
  li a2, 38
  call textAt
  ; sci/stats.e16.ts:288  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_155
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/stats.e16.ts:334 at(k) at -O1
;   k in a0
at:
  ; sci/stats.e16.ts:335  return STATS_WORK + k * 8
  slli t0, a0, 3
  li t1, 9472
  add a0, t1, t0
.return:
  ret

; sci/stats.e16.ts:338 isValid(k) at -O1
;   k in a0
isValid:
  ; sci/stats.e16.ts:339  return peek(STATS_WORK + SLOTS * 8 + k) !== 0
  li t0, 9824
  add t0, t0, a0
  lbu t0, 0(t0)
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; sci/stats.e16.ts:342 setValid(k, yes) at -O1
;   k in a0
;   yes in a1
setValid:
  ; sci/stats.e16.ts:343  poke(STATS_WORK + SLOTS * 8 + k, yes ? 1 : 0)
  li t0, 9824
  add t0, t0, a0
  mv t1, a1
  beqz t1, .L1
  li t1, 1
  j .L2
.L1:
  li t1, 0
.L2:
  sb t1, 0(t0)
.return:
  ret

; sci/stats.e16.ts:347 sop(op, dst, a, b) at -O1
;   op in s2
;   dst in s1
;   a in s3
;   b in s0
sop:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s2, a0 ; op
  mv s1, a1 ; dst
  mv s3, a2 ; a
  mv s0, a3 ; b
  ; sci/stats.e16.ts:348  copy8(at(a), at(dst))
  mv a0, s3
  call at
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  call at
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  ; sci/stats.e16.ts:349  math(op, at(dst), at(b), 0)
  mv a0, s1
  call at
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s0
  call at
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  mv a0, s2
  li a3, 0
  call math
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/stats.e16.ts:352 zero(k) at -O1
;   k in s2
;   i in s1
zero:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; k
  ; sci/stats.e16.ts:353  for (let i: u16 = 0; i < 8; i++) poke(at(k) + i, 0)
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/stats.e16.ts:353  poke(at(k) + i, 0)
  mv a0, s2
  call at
  add t0, a0, s1
  sb zero, 0(t0)
  addi s1, s1, 1
.L3:
  li t0, 8
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:356 setWhole(k, v) at -O1
;   k in s1
;   v in s2
setWhole:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; v
  ; sci/stats.e16.ts:357  poke16(MATH_ARG, v)
  li t0, 65366
  sw s2, 0(t0)
  ; sci/stats.e16.ts:358  math(M_FROMINT, at(k), 0, 0)
  mv a0, s1
  call at
  mv a1, a0
  li a0, 48
  li a2, 0
  li a3, 0
  call math
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:362 workOut() at -O1
;   k/n in s1
;   r in s2
workOut:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/stats.e16.ts:363  for (let k: u16 = 0; k < SLOTS; k++) {
  li s1, 0 ; k/n
  j .L3
.L1:
  ; sci/stats.e16.ts:364  zero(k)
  mv a0, s1
  call zero
  ; sci/stats.e16.ts:365  setValid(k, true)
  mv a0, s1
  li a1, 1
  call setValid
  addi s1, s1, 1
.L3:
  li t0, 44
  bltu s1, t0, .L1
  ; sci/stats.e16.ts:367  const n = peek16(STATS_COUNT)
  lw s1, 5634(zero)
  ; sci/stats.e16.ts:368  for (let r: u16 = 0; r < n; r++) addRow(STATS_DATA + r * 24)
  li s2, 0 ; r
  j .L7
.L5:
  ; sci/stats.e16.ts:368  addRow(STATS_DATA + r * 24)
  slli t1, s2, 4
  slli t0, s2, 3
  add t0, t0, t1
  addi a0, t0, 5648
  call addRow
  addi s2, s2, 1
.L7:
  bltu s2, s1, .L5
  ; sci/stats.e16.ts:369  means(S_X, S_XX, R_MX)
  li a0, 1
  li a1, 2
  li a2, 6
  call means
  ; sci/stats.e16.ts:370  setValid(R_C, false)
  li a0, 15
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:371  if (!twoVar()) return
  call twoVar
  bnez a0, .L9
  ; sci/stats.e16.ts:371  return
  j .return
.L9:
  ; sci/stats.e16.ts:372  means(S_Y, S_YY, R_MY)
  li a0, 3
  li a1, 4
  li a2, 9
  call means
  ; sci/stats.e16.ts:373  if (statKind() === KIND_QUAD) fitQuadratic()
  call statKind
  li t0, 2
  bne a0, t0, .L10
  ; sci/stats.e16.ts:373  fitQuadratic()
  call fitQuadratic
  j .L11
.L10:
  ; sci/stats.e16.ts:374  fitLine()
  call fitLine
.L11:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:378 addRow(row) at -O1
;   row in s1
addRow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; row
  ; sci/stats.e16.ts:379  if (peek(STATS_FREQ) !== 0) copy8(row + 16, at(FREQ))
  lbu t0, 5637(zero)
  beq t0, zero, .L1
  ; sci/stats.e16.ts:379  copy8(row + 16, at(FREQ))
  addi a0, s1, 16
  li a1, 9704
  call copy8
  j .L2
.L1:
  ; sci/stats.e16.ts:380  setWhole(FREQ, 1)
  li a0, 29
  li a1, 1
  call setWhole
.L2:
  ; sci/stats.e16.ts:381  math(M_ADD, at(S_N), at(FREQ), 0)
  li a0, 1
  li a1, 9472
  li a2, 9704
  li a3, 0
  call math
  ; sci/stats.e16.ts:382  addWeighted(row, S_X)
  mv a0, s1
  li a1, 1
  call addWeighted
  ; sci/stats.e16.ts:383  copy8(row, at(T1))
  mv a0, s1
  li a1, 9680
  call copy8
  ; sci/stats.e16.ts:384  math(M_MUL, at(T1), row, 0)
  li a0, 3
  li a1, 9680
  mv a2, s1
  li a3, 0
  call math
  ; sci/stats.e16.ts:385  addWeighted(at(T1), S_XX)
  li a0, 9680
  li a1, 2
  call addWeighted
  ; sci/stats.e16.ts:386  addWeighted(row + 8, S_Y)
  addi a0, s1, 8
  li a1, 3
  call addWeighted
  ; sci/stats.e16.ts:387  copy8(row + 8, at(T1))
  addi a0, s1, 8
  li a1, 9680
  call copy8
  ; sci/stats.e16.ts:388  math(M_MUL, at(T1), row + 8, 0)
  li a0, 3
  li a1, 9680
  addi a2, s1, 8
  li a3, 0
  call math
  ; sci/stats.e16.ts:389  addWeighted(at(T1), S_YY)
  li a0, 9680
  li a1, 4
  call addWeighted
  ; sci/stats.e16.ts:390  copy8(row, at(T1))
  mv a0, s1
  li a1, 9680
  call copy8
  ; sci/stats.e16.ts:391  math(M_MUL, at(T1), row + 8, 0)
  li a0, 3
  li a1, 9680
  addi a2, s1, 8
  li a3, 0
  call math
  ; sci/stats.e16.ts:392  addWeighted(at(T1), S_XY)
  li a0, 9680
  li a1, 5
  call addWeighted
  ; sci/stats.e16.ts:393  if (twoVar()) fitRow(row)
  call twoVar
  beqz a0, .L3
  ; sci/stats.e16.ts:393  fitRow(row)
  mv a0, s1
  call fitRow
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/stats.e16.ts:397 addWeighted(v, sum) at -O1
;   v in s1
;   sum in s2
addWeighted:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; v
  mv s2, a1 ; sum
  ; sci/stats.e16.ts:398  copy8(v, at(T2))
  mv a0, s1
  li a1, 9688
  call copy8
  ; sci/stats.e16.ts:399  math(M_MUL, at(T2), at(FREQ), 0)
  li a0, 3
  li a1, 9688
  li a2, 9704
  li a3, 0
  call math
  ; sci/stats.e16.ts:400  math(M_ADD, at(sum), at(T2), 0)
  mv a0, s2
  call at
  mv a1, a0
  li a0, 1
  li a2, 9688
  li a3, 0
  call math
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:407 fitRow(row) at -O1
;   row in s2
;   t in s1
fitRow:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; row
  ; sci/stats.e16.ts:408  const t = statKind()
  call statKind
  mv s1, a0 ; t
  ; sci/stats.e16.ts:409  copy8(row, at(U))
  mv a0, s2
  li a1, 9712
  call copy8
  ; sci/stats.e16.ts:410  copy8(row + 8, at(V))
  addi a0, s2, 8
  li a1, 9720
  call copy8
  ; sci/stats.e16.ts:411  if (t === KIND_LOG || t === KIND_PWR) math(M_LN, at(U), 0, 0)
  li t0, 4
  beq s1, t0, .L2
  li t0, 5
  bne s1, t0, .L1
.L2:
  ; sci/stats.e16.ts:411  math(M_LN, at(U), 0, 0)
  li a0, 28
  li a1, 9712
  li a2, 0
  li a3, 0
  call math
.L1:
  ; sci/stats.e16.ts:412  if (t === KIND_INV) {
  li t0, 6
  bne s1, t0, .L3
  ; sci/stats.e16.ts:413  setWhole(T3, 1)
  li a0, 28
  li a1, 1
  call setWhole
  ; sci/stats.e16.ts:414  math(M_DIV, at(T3), at(U), 0)
  li a0, 4
  li a1, 9696
  li a2, 9712
  li a3, 0
  call math
  ; sci/stats.e16.ts:415  copy8(at(T3), at(U))
  li a0, 9696
  li a1, 9712
  call copy8
.L3:
  ; sci/stats.e16.ts:417  if (t === KIND_EXP || t === KIND_PWR) math(M_LN, at(V), 0, 0)
  li t0, 3
  beq s1, t0, .L5
  li t0, 5
  bne s1, t0, .L4
.L5:
  ; sci/stats.e16.ts:417  math(M_LN, at(V), 0, 0)
  li a0, 28
  li a1, 9720
  li a2, 0
  li a3, 0
  call math
.L4:
  ; sci/stats.e16.ts:418  addWeighted(at(U), F_U)
  li a0, 9712
  li a1, 16
  call addWeighted
  ; sci/stats.e16.ts:419  addWeighted(at(V), F_V)
  li a0, 9720
  li a1, 18
  call addWeighted
  ; sci/stats.e16.ts:420  sop(M_MUL, T1, U, U)
  li a0, 3
  li a1, 26
  li a2, 30
  li a3, 30
  call sop
  ; sci/stats.e16.ts:421  addWeighted(at(T1), F_UU)
  li a0, 9680
  li a1, 17
  call addWeighted
  ; sci/stats.e16.ts:422  sop(M_MUL, T1, V, V)
  li a0, 3
  li a1, 26
  li a2, 31
  li a3, 31
  call sop
  ; sci/stats.e16.ts:423  addWeighted(at(T1), F_VV)
  li a0, 9680
  li a1, 19
  call addWeighted
  ; sci/stats.e16.ts:424  sop(M_MUL, T1, U, V)
  li a0, 3
  li a1, 26
  li a2, 30
  li a3, 31
  call sop
  ; sci/stats.e16.ts:425  addWeighted(at(T1), F_UV)
  li a0, 9680
  li a1, 20
  call addWeighted
  ; sci/stats.e16.ts:426  if (t === KIND_QUAD) quadRow(row)
  li t0, 2
  bne s1, t0, .L6
  ; sci/stats.e16.ts:426  quadRow(row)
  mv a0, s2
  call quadRow
.L6:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:429 quadRow(row) at -O1
;   row in s1
quadRow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; row
  ; sci/stats.e16.ts:430  copy8(row, at(T1))
  mv a0, s1
  li a1, 9680
  call copy8
  ; sci/stats.e16.ts:431  math(M_MUL, at(T1), row, 0)
  li a0, 3
  li a1, 9680
  mv a2, s1
  li a3, 0
  call math
  ; sci/stats.e16.ts:432  math(M_MUL, at(T1), row, 0)
  li a0, 3
  li a1, 9680
  mv a2, s1
  li a3, 0
  call math
  ; sci/stats.e16.ts:433  addWeighted(at(T1), Q_X3)
  li a0, 9680
  li a1, 23
  call addWeighted
  ; sci/stats.e16.ts:434  math(M_MUL, at(T1), row, 0)
  li a0, 3
  li a1, 9680
  mv a2, s1
  li a3, 0
  call math
  ; sci/stats.e16.ts:435  addWeighted(at(T1), Q_X4)
  li a0, 9680
  li a1, 24
  call addWeighted
  ; sci/stats.e16.ts:436  copy8(row, at(T1))
  mv a0, s1
  li a1, 9680
  call copy8
  ; sci/stats.e16.ts:437  math(M_MUL, at(T1), row, 0)
  li a0, 3
  li a1, 9680
  mv a2, s1
  li a3, 0
  call math
  ; sci/stats.e16.ts:438  math(M_MUL, at(T1), row + 8, 0)
  li a0, 3
  li a1, 9680
  addi a2, s1, 8
  li a3, 0
  call math
  ; sci/stats.e16.ts:439  addWeighted(at(T1), Q_X2Y)
  li a0, 9680
  li a1, 25
  call addWeighted
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/stats.e16.ts:446 means(sum, squares, mean) at -O1
;   sum in s0
;   squares in 0(sp)
;   mean in s1
;   sd in s3
;   sample in s2
means:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  mv s0, a0 ; sum
  sw a1, 0(sp) ; squares
  mv s1, a2 ; mean
  ; sci/stats.e16.ts:448  const sd = mean + 1
  addi s3, s1, 1
  ; sci/stats.e16.ts:449  const sample = mean + 2
  addi s2, s1, 2
  ; sci/stats.e16.ts:450  if (isZero(at(S_N)) || isNegative(at(S_N))) {
  li a0, 9472
  call isZero
  bnez a0, .L2
  li a0, 9472
  call isNegative
  beqz a0, .L1
.L2:
  ; sci/stats.e16.ts:451  setValid(mean, false)
  mv a0, s1
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:452  setValid(sd, false)
  mv a0, s3
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:453  setValid(sample, false)
  mv a0, s2
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:454  return
  j .return
.L1:
  ; sci/stats.e16.ts:456  sop(M_DIV, mean, sum, S_N)
  li a0, 4
  mv a1, s1
  mv a2, s0
  li a3, 0
  call sop
  ; sci/stats.e16.ts:457  sop(M_DIV, T1, squares, S_N)
  li a0, 4
  li a1, 26
  lw a2, 0(sp)
  li a3, 0
  call sop
  ; sci/stats.e16.ts:458  sop(M_MUL, T2, mean, mean)
  li a0, 3
  li a1, 27
  mv a2, s1
  mv a3, s1
  call sop
  ; sci/stats.e16.ts:459  math(M_SUB, at(T1), at(T2), 0)
  li a0, 2
  li a1, 9680
  li a2, 9688
  li a3, 0
  call math
  ; sci/stats.e16.ts:460  if (isNegative(at(T1))) zero(T1)
  li a0, 9680
  call isNegative
  beqz a0, .L3
  ; sci/stats.e16.ts:460  zero(T1)
  li a0, 26
  call zero
.L3:
  ; sci/stats.e16.ts:461  sop(M_SQR, sd, T1, T1)
  li a0, 21
  mv a1, s3
  li a2, 26
  li a3, 26
  call sop
  ; sci/stats.e16.ts:463  copy8(at(S_N), at(T2))
  li a0, 9472
  li a1, 9688
  call copy8
  ; sci/stats.e16.ts:464  setWhole(T3, 1)
  li a0, 28
  li a1, 1
  call setWhole
  ; sci/stats.e16.ts:465  math(M_SUB, at(T2), at(T3), 0)
  li a0, 2
  li a1, 9688
  li a2, 9696
  li a3, 0
  call math
  ; sci/stats.e16.ts:466  if (isZero(at(T2)) || isNegative(at(T2))) {
  li a0, 9688
  call isZero
  bnez a0, .L5
  li a0, 9688
  call isNegative
  beqz a0, .L4
.L5:
  ; sci/stats.e16.ts:467  setValid(sample, false)
  mv a0, s2
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:468  return
  j .return
.L4:
  ; sci/stats.e16.ts:470  math(M_MUL, at(T1), at(S_N), 0)
  li a0, 3
  li a1, 9680
  li a2, 9472
  li a3, 0
  call math
  ; sci/stats.e16.ts:471  math(M_DIV, at(T1), at(T2), 0)
  li a0, 4
  li a1, 9680
  li a2, 9688
  li a3, 0
  call math
  ; sci/stats.e16.ts:472  sop(M_SQR, sample, T1, T1)
  li a0, 21
  mv a1, s2
  li a2, 26
  li a3, 26
  call sop
.return:
  lw ra, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  addi sp, sp, 12
  ret

; sci/stats.e16.ts:479 fitLine() at -O1
;   t in s1
fitLine:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/stats.e16.ts:480  if (isZero(at(S_N))) {
  li a0, 9472
  call isZero
  beqz a0, .L1
  ; sci/stats.e16.ts:481  setValid(R_R, false)
  li a0, 12
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:482  setValid(R_A, false)
  li a0, 13
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:483  setValid(R_B, false)
  li a0, 14
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:484  return
  j .return
.L1:
  ; sci/stats.e16.ts:486  sop(M_DIV, F_MU, F_U, S_N)
  li a0, 4
  li a1, 21
  li a2, 16
  li a3, 0
  call sop
  ; sci/stats.e16.ts:487  sop(M_DIV, F_MV, F_V, S_N)
  li a0, 4
  li a1, 22
  li a2, 18
  li a3, 0
  call sop
  ; sci/stats.e16.ts:488  spread(F_UV, F_MU, F_MV, T1)
  li a0, 20
  li a1, 21
  li a2, 22
  li a3, 26
  call spread
  ; sci/stats.e16.ts:489  spread(F_UU, F_MU, F_MU, T2)
  li a0, 17
  li a1, 21
  li a2, 21
  li a3, 27
  call spread
  ; sci/stats.e16.ts:490  spread(F_VV, F_MV, F_MV, T3)
  li a0, 19
  li a1, 22
  li a2, 22
  li a3, 28
  call spread
  ; sci/stats.e16.ts:491  if (isZero(at(T2))) {
  li a0, 9688
  call isZero
  beqz a0, .L2
  ; sci/stats.e16.ts:492  setValid(R_B, false)
  li a0, 14
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:493  setValid(R_A, false)
  li a0, 13
  li a1, 0
  call setValid
  j .L3
.L2:
  ; sci/stats.e16.ts:495  sop(M_DIV, R_B, T1, T2)
  li a0, 4
  li a1, 14
  li a2, 26
  li a3, 27
  call sop
  ; sci/stats.e16.ts:496  sop(M_MUL, FREQ, R_B, F_MU)
  li a0, 3
  li a1, 29
  li a2, 14
  li a3, 21
  call sop
  ; sci/stats.e16.ts:497  sop(M_SUB, R_A, F_MV, FREQ)
  li a0, 2
  li a1, 13
  li a2, 22
  li a3, 29
  call sop
  ; sci/stats.e16.ts:498  const t = statKind()
  call statKind
  mv s1, a0 ; t
  ; sci/stats.e16.ts:499  if (t === KIND_EXP || t === KIND_PWR) math(M_EXP, at(R_A), 0, 0)
  li t0, 3
  beq s1, t0, .L5
  li t0, 5
  bne s1, t0, .L4
.L5:
  ; sci/stats.e16.ts:499  math(M_EXP, at(R_A), 0, 0)
  li a0, 30
  li a1, 9576
  li a2, 0
  li a3, 0
  call math
.L4:
.L3:
  ; sci/stats.e16.ts:501  math(M_MUL, at(T2), at(T3), 0)
  li a0, 3
  li a1, 9688
  li a2, 9696
  li a3, 0
  call math
  ; sci/stats.e16.ts:502  if (isZero(at(T2)) || isNegative(at(T2))) {
  li a0, 9688
  call isZero
  bnez a0, .L7
  li a0, 9688
  call isNegative
  beqz a0, .L6
.L7:
  ; sci/stats.e16.ts:503  setValid(R_R, false)
  li a0, 12
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:504  return
  j .return
.L6:
  ; sci/stats.e16.ts:506  math(M_SQR, at(T2), 0, 0)
  li a0, 21
  li a1, 9688
  li a2, 0
  li a3, 0
  call math
  ; sci/stats.e16.ts:507  sop(M_DIV, R_R, T1, T2)
  li a0, 4
  li a1, 12
  li a2, 26
  li a3, 27
  call sop
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/stats.e16.ts:511 spread(sums, mean1, mean2, dst) at -O1
;   sums in s2
;   mean1 in s3
;   mean2 in s0
;   dst in s1
spread:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; sums
  mv s3, a1 ; mean1
  mv s0, a2 ; mean2
  mv s1, a3 ; dst
  ; sci/stats.e16.ts:512  sop(M_MUL, dst, mean1, mean2)
  li a0, 3
  mv a1, s1
  mv a2, s3
  mv a3, s0
  call sop
  ; sci/stats.e16.ts:513  math(M_MUL, at(dst), at(S_N), 0)
  mv a0, s1
  call at
  mv a1, a0
  li a0, 3
  li a2, 9472
  li a3, 0
  call math
  ; sci/stats.e16.ts:514  copy8(at(sums), at(FREQ))
  mv a0, s2
  call at
  li a1, 9704
  call copy8
  ; sci/stats.e16.ts:515  math(M_SUB, at(FREQ), at(dst), 0)
  mv a0, s1
  call at
  li a1, 9704
  mv a2, a0
  li a0, 2
  li a3, 0
  call math
  ; sci/stats.e16.ts:516  copy8(at(FREQ), at(dst))
  mv a0, s1
  call at
  mv a1, a0
  li a0, 9704
  call copy8
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/stats.e16.ts:520 qcell(r, c) at -O1
;   r in a0
;   c in a1
qcell:
  ; sci/stats.e16.ts:521  return QM + r * 4 + c
  slli t0, a0, 2
  addi t0, t0, 32
  add a0, t0, a1
.return:
  ret

; sci/stats.e16.ts:529 fitQuadratic() at -O1
;   k/i in s1
;   i in s2
fitQuadratic:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/stats.e16.ts:530  setValid(R_R, false)
  li a0, 12
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:531  copy8(at(S_N), at(qcell(0, 0)))
  li a0, 9472
  li a1, 9728
  call copy8
  ; sci/stats.e16.ts:532  copy8(at(S_X), at(qcell(0, 1)))
  li a0, 9480
  li a1, 9736
  call copy8
  ; sci/stats.e16.ts:533  copy8(at(S_XX), at(qcell(0, 2)))
  li a0, 9488
  li a1, 9744
  call copy8
  ; sci/stats.e16.ts:534  copy8(at(S_Y), at(qcell(0, 3)))
  li a0, 9496
  li a1, 9752
  call copy8
  ; sci/stats.e16.ts:535  copy8(at(S_X), at(qcell(1, 0)))
  li a0, 9480
  li a1, 9760
  call copy8
  ; sci/stats.e16.ts:536  copy8(at(S_XX), at(qcell(1, 1)))
  li a0, 9488
  li a1, 9768
  call copy8
  ; sci/stats.e16.ts:537  copy8(at(Q_X3), at(qcell(1, 2)))
  li a0, 9656
  li a1, 9776
  call copy8
  ; sci/stats.e16.ts:538  copy8(at(S_XY), at(qcell(1, 3)))
  li a0, 9512
  li a1, 9784
  call copy8
  ; sci/stats.e16.ts:539  copy8(at(S_XX), at(qcell(2, 0)))
  li a0, 9488
  li a1, 9792
  call copy8
  ; sci/stats.e16.ts:540  copy8(at(Q_X3), at(qcell(2, 1)))
  li a0, 9656
  li a1, 9800
  call copy8
  ; sci/stats.e16.ts:541  copy8(at(Q_X4), at(qcell(2, 2)))
  li a0, 9664
  li a1, 9808
  call copy8
  ; sci/stats.e16.ts:542  copy8(at(Q_X2Y), at(qcell(2, 3)))
  li a0, 9672
  li a1, 9816
  call copy8
  ; sci/stats.e16.ts:543  for (let k: u16 = 0; k < 3; k++) {
  li s1, 0 ; k/i
  j .L3
.L1:
  ; sci/stats.e16.ts:544  if (isZero(at(qcell(k, k)))) {
  mv a0, s1
  mv a1, s1
  call qcell
  call at
  call isZero
  beqz a0, .L5
  ; sci/stats.e16.ts:545  setValid(R_A, false)
  li a0, 13
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:546  setValid(R_B, false)
  li a0, 14
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:547  return
  j .return
.L5:
  ; sci/stats.e16.ts:549  for (let i = k + 1; i < 3; i++) clearBelow(i, k)
  addi s2, s1, 1
  j .L8
.L6:
  ; sci/stats.e16.ts:549  clearBelow(i, k)
  mv a0, s2
  mv a1, s1
  call clearBelow
  addi s2, s2, 1
.L8:
  li t0, 3
  bltu s2, t0, .L6
  addi s1, s1, 1
.L3:
  li t0, 3
  bltu s1, t0, .L1
  ; sci/stats.e16.ts:551  for (let i: u16 = 3; i > 0; i--) quadBack(i - 1)
  li s1, 3 ; k/i
  j .L12
.L10:
  ; sci/stats.e16.ts:551  quadBack(i - 1)
  addi a0, s1, -1
  call quadBack
  addi s1, s1, -1
.L12:
  bltu zero, s1, .L10
  ; sci/stats.e16.ts:552  setValid(R_C, true)
  li a0, 15
  li a1, 1
  call setValid
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:556 clearBelow(i, k) at -O1
;   i in s3
;   k in s1
;   c in s2
clearBelow:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; i
  mv s1, a1 ; k
  ; sci/stats.e16.ts:557  sop(M_DIV, T3, qcell(i, k), qcell(k, k))
  mv a0, s3
  mv a1, s1
  call qcell
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  mv a1, s1
  call qcell
  lw a2, 0(sp)
  addi sp, sp, 2
  li a1, 28
  mv a3, a0
  li a0, 4
  call sop
  ; sci/stats.e16.ts:558  for (let c = k; c < 4; c++) {
  mv s2, s1 ; c
  j .L3
.L1:
  ; sci/stats.e16.ts:559  sop(M_MUL, T1, qcell(k, c), T3)
  mv a0, s1
  mv a1, s2
  call qcell
  li a1, 26
  mv a2, a0
  li a0, 3
  li a3, 28
  call sop
  ; sci/stats.e16.ts:560  math(M_SUB, at(qcell(i, c)), at(T1), 0)
  mv a0, s3
  mv a1, s2
  call qcell
  call at
  mv a1, a0
  li a0, 2
  li a2, 9680
  li a3, 0
  call math
  addi s2, s2, 1
.L3:
  li t0, 4
  bltu s2, t0, .L1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/stats.e16.ts:565 quadBack(i) at -O1
;   i in s1
;   j in s2
quadBack:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  ; sci/stats.e16.ts:566  copy8(at(qcell(i, 3)), at(T2))
  mv a0, s1
  li a1, 3
  call qcell
  call at
  li a1, 9688
  call copy8
  ; sci/stats.e16.ts:567  for (let j = i + 1; j < 3; j++) {
  addi s2, s1, 1
  j .L3
.L1:
  ; sci/stats.e16.ts:568  sop(M_MUL, T1, qcell(i, j), R_A + j)
  mv a0, s1
  mv a1, s2
  call qcell
  li a1, 26
  mv a2, a0
  li a0, 3
  addi a3, s2, 13
  call sop
  ; sci/stats.e16.ts:569  math(M_SUB, at(T2), at(T1), 0)
  li a0, 2
  li a1, 9688
  li a2, 9680
  li a3, 0
  call math
  addi s2, s2, 1
.L3:
  li t0, 3
  bltu s2, t0, .L1
  ; sci/stats.e16.ts:571  math(M_DIV, at(T2), at(qcell(i, i)), 0)
  mv a0, s1
  mv a1, s1
  call qcell
  call at
  li a1, 9688
  mv a2, a0
  li a0, 4
  li a3, 0
  call math
  ; sci/stats.e16.ts:572  copy8(at(T2), at(R_A + i))
  addi a0, s1, 13
  call at
  mv a1, a0
  li a0, 9688
  call copy8
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:577 drawResults() at -O1
;   pages/i in s1
;   arrow/item in s2
drawResults:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/stats.e16.ts:578  const pages: u16 = twoVar() ? 3 : 1
  call twoVar
  beqz a0, .L1
  li t0, 3
  j .L2
.L1:
  li t0, 1
.L2:
  mv s1, t0 ; pages/i
  ; sci/stats.e16.ts:579  let arrow: u16 = 0
  li s2, 0 ; arrow/item
  ; sci/stats.e16.ts:580  if (resultPage + 1 < pages) arrow = str('\x8e')
  lw t0, 0x07f6(zero)
  addi t0, t0, 1
  bgeu t0, s1, .L3
  ; sci/stats.e16.ts:580  arrow = str('\x8e')
  la s2, str_161
  j .L4
.L3:
  ; sci/stats.e16.ts:581  if (resultPage > 0) arrow = str('\x8d')
  lw t0, 0x07f6(zero)
  bgeu zero, t0, .L5
  ; sci/stats.e16.ts:581  arrow = str('\x8d')
  la s2, str_162
.L5:
.L4:
  ; sci/stats.e16.ts:582  bandWith(kindTitle(0, str(' RESULT')), arrow)
  li a0, 0
  la a1, str_163
  call kindTitle
  mv a1, s2
  call bandWith
  ; sci/stats.e16.ts:583  for (let i: u16 = 0; i < 6; i++) {
  li s1, 0 ; pages/i
  j .L8
.L6:
  ; sci/stats.e16.ts:584  const item = itemOf(resultPage, i)
  lw a0, 0x07f6(zero)
  mv a1, s1
  call itemOf
  mv s2, a0 ; arrow/item
  ; sci/stats.e16.ts:585  if (item !== 0xffff) resultLine(item, i)
  li t0, 65535
  beq s2, t0, .L10
  ; sci/stats.e16.ts:585  resultLine(item, i)
  mv a0, s2
  mv a1, s1
  call resultLine
.L10:
  addi s1, s1, 1
.L8:
  li t0, 6
  bltu s1, t0, .L6
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:590 itemOf(page, n) at -O1
;   page in s2
;   n in s1
itemOf:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; page
  mv s1, a1 ; n
  ; sci/stats.e16.ts:591  if (!twoVar()) return page === 0 ? pick1(n) : 0xffff
  call twoVar
  bnez a0, .L1
  ; sci/stats.e16.ts:591  return page === 0 ? pick1(n) : 0xffff
  bne s2, zero, .L2
  mv a0, s1
  call pick1
  mv t0, a0
  j .L3
.L2:
  li t0, 65535
.L3:
  mv a0, t0
  j .return
.L1:
  ; sci/stats.e16.ts:592  if (page === 0) return pick2(n)
  bne s2, zero, .L4
  ; sci/stats.e16.ts:592  return pick2(n)
  mv a0, s1
  call pick2
  j .return
.L4:
  ; sci/stats.e16.ts:593  if (page === 1) return n < 5 ? pickSpread(n) : 0xffff
  li t0, 1
  bne s2, t0, .L5
  ; sci/stats.e16.ts:593  return n < 5 ? pickSpread(n) : 0xffff
  li t0, 5
  bgeu s1, t0, .L6
  mv a0, s1
  call pickSpread
  mv t0, a0
  j .L7
.L6:
  li t0, 65535
.L7:
  mv a0, t0
  j .return
.L5:
  ; sci/stats.e16.ts:594  return n < 5 ? S_X + pickSum(n) : 0xffff
  li t0, 5
  bgeu s1, t0, .L8
  ; sci/stats.e16.ts:647  return n
  addi t0, s1, 1
  j .L9
.L8:
  li t0, 65535
.L9:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:597 pick1(n) at -O1
;   n in a0
pick1:
  ; sci/stats.e16.ts:598  switch (n) {
  beq a0, zero, .L2
  li t0, 1
  beq a0, t0, .L3
  li t0, 2
  beq a0, t0, .L4
  li t0, 3
  beq a0, t0, .L5
  li t0, 4
  beq a0, t0, .L6
  j .L1
.L2:
  ; sci/stats.e16.ts:600  return S_N
  li a0, 0
  ret
.L3:
  ; sci/stats.e16.ts:602  return R_MX
  li a0, 6
  ret
.L4:
  ; sci/stats.e16.ts:604  return R_SDX
  li a0, 7
  ret
.L5:
  ; sci/stats.e16.ts:606  return R_SX
  li a0, 8
  ret
.L6:
  ; sci/stats.e16.ts:608  return S_X
  li a0, 1
  ret
.L1:
  ; sci/stats.e16.ts:610  return S_XX
  li a0, 2
.return:
  ret

; sci/stats.e16.ts:614 pick2(n) at -O1
;   n in a0
pick2:
  ; sci/stats.e16.ts:615  switch (n) {
  beq a0, zero, .L2
  li t0, 1
  beq a0, t0, .L3
  li t0, 2
  beq a0, t0, .L4
  li t0, 3
  beq a0, t0, .L5
  li t0, 4
  beq a0, t0, .L6
  j .L1
.L2:
  ; sci/stats.e16.ts:617  return S_N
  li a0, 0
  ret
.L3:
  ; sci/stats.e16.ts:619  return R_MX
  li a0, 6
  ret
.L4:
  ; sci/stats.e16.ts:621  return R_MY
  li a0, 9
  ret
.L5:
  ; sci/stats.e16.ts:623  return R_R
  li a0, 12
  ret
.L6:
  ; sci/stats.e16.ts:625  return R_A
  li a0, 13
  ret
.L1:
  ; sci/stats.e16.ts:627  return R_B
  li a0, 14
.return:
  ret

; sci/stats.e16.ts:631 pickSpread(n) at -O1
;   n in a0
pickSpread:
  ; sci/stats.e16.ts:632  switch (n) {
  beq a0, zero, .L2
  li t0, 1
  beq a0, t0, .L3
  li t0, 2
  beq a0, t0, .L4
  li t0, 3
  beq a0, t0, .L5
  j .L1
.L2:
  ; sci/stats.e16.ts:634  return R_C
  li a0, 15
  ret
.L3:
  ; sci/stats.e16.ts:636  return R_SDX
  li a0, 7
  ret
.L4:
  ; sci/stats.e16.ts:638  return R_SX
  li a0, 8
  ret
.L5:
  ; sci/stats.e16.ts:640  return R_SDY
  li a0, 10
  ret
.L1:
  ; sci/stats.e16.ts:642  return R_SY
  li a0, 11
.return:
  ret

; sci/stats.e16.ts:650 resultLine(item, row) at -O1
;   item in s1
;   row in s2
resultLine:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; item
  mv s2, a1 ; row
  ; sci/stats.e16.ts:651  textAt(nameOf(item), 1, lineY(row))
  mv a0, s1
  call nameOf
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  call lineY
  lw t0, 0(sp)
  addi sp, sp, 2
  li a1, 1
  mv a2, a0
  mv a0, t0
  call textAt
  ; sci/stats.e16.ts:652  if (!isValid(item)) textRight(str('-'), lineY(row))
  mv a0, s1
  call isValid
  bnez a0, .L1
  ; sci/stats.e16.ts:652  textRight(str('-'), lineY(row))
  mv a0, s2
  call lineY
  mv a1, a0
  la a0, str_164
  call textRight
  j .L2
.L1:
  ; sci/stats.e16.ts:653  textRight(textOf(at(item)), lineY(row))
  mv a0, s1
  call at
  la t0, textOf
  li t1, 5
  call far_call
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  call lineY
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call textRight
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:657 nameOf(item) at -O1
;   item in a0
nameOf:
  ; sci/stats.e16.ts:658  switch (item) {
  beq a0, zero, .L2
  li t0, 6
  beq a0, t0, .L3
  li t0, 9
  beq a0, t0, .L4
  li t0, 7
  beq a0, t0, .L5
  li t0, 8
  beq a0, t0, .L6
  li t0, 10
  beq a0, t0, .L7
  li t0, 11
  beq a0, t0, .L8
  li t0, 1
  beq a0, t0, .L9
  li t0, 2
  beq a0, t0, .L10
  li t0, 3
  beq a0, t0, .L11
  li t0, 4
  beq a0, t0, .L12
  li t0, 5
  beq a0, t0, .L13
  li t0, 12
  beq a0, t0, .L14
  li t0, 13
  beq a0, t0, .L15
  li t0, 15
  beq a0, t0, .L16
  j .L1
.L2:
  ; sci/stats.e16.ts:660  return str('n=')
  la a0, str_165
  ret
.L3:
  ; sci/stats.e16.ts:662  return str('\x95=')
  la a0, str_166
  ret
.L4:
  ; sci/stats.e16.ts:664  return str('\x96=')
  la a0, str_167
  ret
.L5:
  ; sci/stats.e16.ts:666  return str('\x91x=')
  la a0, str_168
  ret
.L6:
  ; sci/stats.e16.ts:668  return str('sx=')
  la a0, str_169
  ret
.L7:
  ; sci/stats.e16.ts:670  return str('\x91y=')
  la a0, str_170
  ret
.L8:
  ; sci/stats.e16.ts:672  return str('sy=')
  la a0, str_171
  ret
.L9:
  ; sci/stats.e16.ts:674  return str('\x90x=')
  la a0, str_172
  ret
.L10:
  ; sci/stats.e16.ts:676  return str('\x90x\x84=')
  la a0, str_173
  ret
.L11:
  ; sci/stats.e16.ts:678  return str('\x90y=')
  la a0, str_174
  ret
.L12:
  ; sci/stats.e16.ts:680  return str('\x90y\x84=')
  la a0, str_175
  ret
.L13:
  ; sci/stats.e16.ts:682  return str('\x90xy=')
  la a0, str_176
  ret
.L14:
  ; sci/stats.e16.ts:684  return str('r=')
  la a0, str_177
  ret
.L15:
  ; sci/stats.e16.ts:686  return str('a=')
  la a0, str_178
  ret
.L16:
  ; sci/stats.e16.ts:688  return str('c=')
  la a0, str_179
  ret
.L1:
  ; sci/stats.e16.ts:690  return str('b=')
  la a0, str_180
.return:
  ret

; sci/stats.e16.ts:700 statValue(k/item, dst) at -O1
;   k/item in s1
;   dst in s2
;   ofY in s3
statValue:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k/item
  mv s2, a1 ; dst
  ; sci/stats.e16.ts:701  const item = statItem(k)
  mv a0, s1
  call statItem
  mv s1, a0 ; k/item
  ; sci/stats.e16.ts:702  const ofY =
  li t0, 9
  sub t0, s1, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L4
  li t0, 10
  sub t0, s1, t0
  seqz t0, t0
.L4:
  mv t1, t0
  bnez t1, .L3
  li t0, 11
  sub t0, s1, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 3
  sltu t0, s1, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L5
  li t0, 5
  sltu t0, t0, s1
  xori t0, t0, 1
.L5:
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 12
  sltu t0, s1, t0
  xori t0, t0, 1
.L1:
  mv s3, t0 ; ofY
  ; sci/stats.e16.ts:704  if (peek16(STATS_COUNT) === 0 || (ofY && !twoVar())) fail(E_MATH, 0)
  lw t0, 5634(zero)
  beq t0, zero, .L7
  beqz s3, .L6
  call twoVar
  bnez a0, .L6
.L7:
  ; sci/stats.e16.ts:704  fail(E_MATH, 0)
  li a0, 1
  li a1, 0
  call fail
.L6:
  ; sci/stats.e16.ts:705  workOut()
  call workOut
  ; sci/stats.e16.ts:706  if (!isValid(item)) fail(E_MATH, 0)
  mv a0, s1
  call isValid
  bnez a0, .L8
  ; sci/stats.e16.ts:706  fail(E_MATH, 0)
  li a0, 1
  li a1, 0
  call fail
.L8:
  ; sci/stats.e16.ts:707  copy8(at(item), dst)
  mv a0, s1
  call at
  mv a1, s2
  call copy8
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/stats.e16.ts:710 statItem(k) at -O1
;   k in a0
statItem:
  ; sci/stats.e16.ts:711  switch (k) {
  beq a0, zero, .L2
  li t0, 1
  beq a0, t0, .L3
  li t0, 2
  beq a0, t0, .L4
  li t0, 3
  beq a0, t0, .L5
  li t0, 4
  beq a0, t0, .L6
  li t0, 5
  beq a0, t0, .L7
  li t0, 6
  beq a0, t0, .L8
  li t0, 7
  beq a0, t0, .L9
  li t0, 8
  beq a0, t0, .L10
  li t0, 9
  beq a0, t0, .L11
  li t0, 10
  beq a0, t0, .L12
  li t0, 11
  beq a0, t0, .L13
  li t0, 12
  beq a0, t0, .L14
  li t0, 13
  beq a0, t0, .L15
  li t0, 15
  beq a0, t0, .L16
  j .L1
.L2:
  ; sci/stats.e16.ts:713  return S_N
  li a0, 0
  ret
.L3:
  ; sci/stats.e16.ts:715  return R_MX
  li a0, 6
  ret
.L4:
  ; sci/stats.e16.ts:717  return R_SDX
  li a0, 7
  ret
.L5:
  ; sci/stats.e16.ts:719  return R_SX
  li a0, 8
  ret
.L6:
  ; sci/stats.e16.ts:721  return R_MY
  li a0, 9
  ret
.L7:
  ; sci/stats.e16.ts:723  return R_SDY
  li a0, 10
  ret
.L8:
  ; sci/stats.e16.ts:725  return R_SY
  li a0, 11
  ret
.L9:
  ; sci/stats.e16.ts:727  return S_X
  li a0, 1
  ret
.L10:
  ; sci/stats.e16.ts:729  return S_XX
  li a0, 2
  ret
.L11:
  ; sci/stats.e16.ts:731  return S_Y
  li a0, 3
  ret
.L12:
  ; sci/stats.e16.ts:733  return S_YY
  li a0, 4
  ret
.L13:
  ; sci/stats.e16.ts:735  return S_XY
  li a0, 5
  ret
.L14:
  ; sci/stats.e16.ts:737  return R_R
  li a0, 12
  ret
.L15:
  ; sci/stats.e16.ts:739  return R_A
  li a0, 13
  ret
.L16:
  ; sci/stats.e16.ts:741  return R_C
  li a0, 15
  ret
.L1:
  ; sci/stats.e16.ts:743  return R_B
  li a0, 14
.return:
  ret

; sci/stats.e16.ts:756 statEstimate(which, v) at -O1
;   which in s2
;   v in s3
;   t in s1
statEstimate:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; which
  mv s3, a1 ; v
  ; sci/stats.e16.ts:757  const t = statKind()
  call statKind
  mv s1, a0 ; t
  ; sci/stats.e16.ts:758  if (peek16(STATS_COUNT) === 0 || t === KIND_1VAR) fail(E_MATH, 0)
  lw t0, 5634(zero)
  beq t0, zero, .L2
  bne s1, zero, .L1
.L2:
  ; sci/stats.e16.ts:758  fail(E_MATH, 0)
  li a0, 1
  li a1, 0
  call fail
.L1:
  ; sci/stats.e16.ts:759  workOut()
  call workOut
  ; sci/stats.e16.ts:760  if (!isValid(R_A) || !isValid(R_B)) fail(E_MATH, 0)
  li a0, 13
  call isValid
  beqz a0, .L4
  li a0, 14
  call isValid
  bnez a0, .L3
.L4:
  ; sci/stats.e16.ts:760  fail(E_MATH, 0)
  li a0, 1
  li a1, 0
  call fail
.L3:
  ; sci/stats.e16.ts:761  copy8(v, at(U))
  mv a0, s3
  li a1, 9712
  call copy8
  ; sci/stats.e16.ts:762  if (t === KIND_QUAD) quadEstimate(which)
  li t0, 2
  bne s1, t0, .L5
  ; sci/stats.e16.ts:762  quadEstimate(which)
  mv a0, s2
  call quadEstimate
  j .L6
.L5:
  ; sci/stats.e16.ts:763  if (which === EST_X2) fail(E_MATH, 0)
  li t0, 2
  bne s2, t0, .L7
  ; sci/stats.e16.ts:763  fail(E_MATH, 0)
  li a0, 1
  li a1, 0
  call fail
  j .L8
.L7:
  ; sci/stats.e16.ts:764  if (which === EST_Y) yOf(t)
  bne s2, zero, .L9
  ; sci/stats.e16.ts:764  yOf(t)
  mv a0, s1
  call yOf
  j .L10
.L9:
  ; sci/stats.e16.ts:765  xOf(t)
  mv a0, s1
  call xOf
.L10:
.L8:
.L6:
  ; sci/stats.e16.ts:766  copy8(at(U), v)
  li a0, 9712
  mv a1, s3
  call copy8
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/stats.e16.ts:770 yOf(t) at -O1
;   t in s1
yOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/stats.e16.ts:771  if (t === KIND_LOG) math(M_LN, at(U), 0, 0)
  li t0, 4
  bne s1, t0, .L1
  ; sci/stats.e16.ts:771  math(M_LN, at(U), 0, 0)
  li a0, 28
  li a1, 9712
  li a2, 0
  li a3, 0
  call math
.L1:
  ; sci/stats.e16.ts:772  if (t === KIND_INV) {
  li t0, 6
  bne s1, t0, .L2
  ; sci/stats.e16.ts:773  setWhole(T1, 1)
  li a0, 26
  li a1, 1
  call setWhole
  ; sci/stats.e16.ts:774  math(M_DIV, at(T1), at(U), 0)
  li a0, 4
  li a1, 9680
  li a2, 9712
  li a3, 0
  call math
  ; sci/stats.e16.ts:775  copy8(at(T1), at(U))
  li a0, 9680
  li a1, 9712
  call copy8
.L2:
  ; sci/stats.e16.ts:777  if (t === KIND_PWR) {
  li t0, 5
  bne s1, t0, .L3
  ; sci/stats.e16.ts:778  copy8(at(U), at(T1))
  li a0, 9712
  li a1, 9680
  call copy8
  ; sci/stats.e16.ts:779  copy8(at(R_B), at(U))
  li a0, 9584
  li a1, 9712
  call copy8
  ; sci/stats.e16.ts:780  math(M_POW, at(T1), at(U), 0)
  li a0, 5
  li a1, 9680
  li a2, 9712
  li a3, 0
  call math
  ; sci/stats.e16.ts:781  sop(M_MUL, U, T1, R_A)
  li a0, 3
  li a1, 30
  li a2, 26
  li a3, 13
  call sop
  ; sci/stats.e16.ts:782  return
  j .return
.L3:
  ; sci/stats.e16.ts:784  math(M_MUL, at(U), at(R_B), 0)
  li a0, 3
  li a1, 9712
  li a2, 9584
  li a3, 0
  call math
  ; sci/stats.e16.ts:785  if (t === KIND_EXP) {
  li t0, 3
  bne s1, t0, .L4
  ; sci/stats.e16.ts:786  math(M_EXP, at(U), 0, 0)
  li a0, 30
  li a1, 9712
  li a2, 0
  li a3, 0
  call math
  ; sci/stats.e16.ts:787  math(M_MUL, at(U), at(R_A), 0)
  li a0, 3
  li a1, 9712
  li a2, 9576
  li a3, 0
  call math
  j .L5
.L4:
  ; sci/stats.e16.ts:788  math(M_ADD, at(U), at(R_A), 0)
  li a0, 1
  li a1, 9712
  li a2, 9576
  li a3, 0
  call math
.L5:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/stats.e16.ts:792 xOf(t) at -O1
;   t in s1
xOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/stats.e16.ts:793  if (t === KIND_EXP || t === KIND_PWR) {
  li t0, 3
  beq s1, t0, .L2
  li t0, 5
  bne s1, t0, .L1
.L2:
  ; sci/stats.e16.ts:794  math(M_DIV, at(U), at(R_A), 0)
  li a0, 4
  li a1, 9712
  li a2, 9576
  li a3, 0
  call math
  ; sci/stats.e16.ts:795  if (t === KIND_EXP) {
  li t0, 3
  bne s1, t0, .L3
  ; sci/stats.e16.ts:796  math(M_LN, at(U), 0, 0)
  li a0, 28
  li a1, 9712
  li a2, 0
  li a3, 0
  call math
  ; sci/stats.e16.ts:797  math(M_DIV, at(U), at(R_B), 0)
  li a0, 4
  li a1, 9712
  li a2, 9584
  li a3, 0
  call math
  j .L4
.L3:
  ; sci/stats.e16.ts:799  setWhole(T1, 1)
  li a0, 26
  li a1, 1
  call setWhole
  ; sci/stats.e16.ts:800  math(M_DIV, at(T1), at(R_B), 0)
  li a0, 4
  li a1, 9680
  li a2, 9584
  li a3, 0
  call math
  ; sci/stats.e16.ts:801  math(M_POW, at(U), at(T1), 0)
  li a0, 5
  li a1, 9712
  li a2, 9680
  li a3, 0
  call math
.L4:
  ; sci/stats.e16.ts:803  return
  j .return
.L1:
  ; sci/stats.e16.ts:805  math(M_SUB, at(U), at(R_A), 0)
  li a0, 2
  li a1, 9712
  li a2, 9576
  li a3, 0
  call math
  ; sci/stats.e16.ts:806  if (t === KIND_INV) {
  li t0, 6
  bne s1, t0, .L5
  ; sci/stats.e16.ts:807  copy8(at(R_B), at(T1))
  li a0, 9584
  li a1, 9680
  call copy8
  ; sci/stats.e16.ts:808  math(M_DIV, at(T1), at(U), 0)
  li a0, 4
  li a1, 9680
  li a2, 9712
  li a3, 0
  call math
  ; sci/stats.e16.ts:809  copy8(at(T1), at(U))
  li a0, 9680
  li a1, 9712
  call copy8
  ; sci/stats.e16.ts:810  return
  j .return
.L5:
  ; sci/stats.e16.ts:812  math(M_DIV, at(U), at(R_B), 0)
  li a0, 4
  li a1, 9712
  li a2, 9584
  li a3, 0
  call math
  ; sci/stats.e16.ts:813  if (t === KIND_LOG) math(M_EXP, at(U), 0, 0)
  li t0, 4
  bne s1, t0, .L6
  ; sci/stats.e16.ts:813  math(M_EXP, at(U), 0, 0)
  li a0, 30
  li a1, 9712
  li a2, 0
  li a3, 0
  call math
.L6:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/stats.e16.ts:817 quadEstimate(which) at -O1
;   which in s1
quadEstimate:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; which
  ; sci/stats.e16.ts:818  if (which === EST_Y) {
  bne s1, zero, .L1
  ; sci/stats.e16.ts:819  sop(M_MUL, T1, U, R_C)
  li a0, 3
  li a1, 26
  li a2, 30
  li a3, 15
  call sop
  ; sci/stats.e16.ts:820  math(M_ADD, at(T1), at(R_B), 0)
  li a0, 1
  li a1, 9680
  li a2, 9584
  li a3, 0
  call math
  ; sci/stats.e16.ts:821  math(M_MUL, at(T1), at(U), 0)
  li a0, 3
  li a1, 9680
  li a2, 9712
  li a3, 0
  call math
  ; sci/stats.e16.ts:822  math(M_ADD, at(T1), at(R_A), 0)
  li a0, 1
  li a1, 9680
  li a2, 9576
  li a3, 0
  call math
  ; sci/stats.e16.ts:823  copy8(at(T1), at(U))
  li a0, 9680
  li a1, 9712
  call copy8
  ; sci/stats.e16.ts:824  return
  j .return
.L1:
  ; sci/stats.e16.ts:826  if (isZero(at(R_C))) fail(E_MATH, 0)
  li a0, 9592
  call isZero
  beqz a0, .L2
  ; sci/stats.e16.ts:826  fail(E_MATH, 0)
  li a0, 1
  li a1, 0
  call fail
.L2:
  ; sci/stats.e16.ts:828  sop(M_SUB, T1, R_A, U)
  li a0, 2
  li a1, 26
  li a2, 13
  li a3, 30
  call sop
  ; sci/stats.e16.ts:829  math(M_MUL, at(T1), at(R_C), 0)
  li a0, 3
  li a1, 9680
  li a2, 9592
  li a3, 0
  call math
  ; sci/stats.e16.ts:830  setWhole(T2, 4)
  li a0, 27
  li a1, 4
  call setWhole
  ; sci/stats.e16.ts:831  math(M_MUL, at(T1), at(T2), 0)
  li a0, 3
  li a1, 9680
  li a2, 9688
  li a3, 0
  call math
  ; sci/stats.e16.ts:832  sop(M_MUL, T2, R_B, R_B)
  li a0, 3
  li a1, 27
  li a2, 14
  li a3, 14
  call sop
  ; sci/stats.e16.ts:833  math(M_SUB, at(T2), at(T1), 0)
  li a0, 2
  li a1, 9688
  li a2, 9680
  li a3, 0
  call math
  ; sci/stats.e16.ts:834  math(M_SQR, at(T2), 0, 0)
  li a0, 21
  li a1, 9688
  li a2, 0
  li a3, 0
  call math
  ; sci/stats.e16.ts:835  copy8(at(R_B), at(U))
  li a0, 9584
  li a1, 9712
  call copy8
  ; sci/stats.e16.ts:836  math(M_NEG, at(U), 0, 0)
  li a0, 16
  li a1, 9712
  li a2, 0
  li a3, 0
  call math
  ; sci/stats.e16.ts:837  if (which === EST_X) math(M_ADD, at(U), at(T2), 0)
  li t0, 1
  bne s1, t0, .L3
  ; sci/stats.e16.ts:837  math(M_ADD, at(U), at(T2), 0)
  li a0, 1
  li a1, 9712
  li a2, 9688
  li a3, 0
  call math
  j .L4
.L3:
  ; sci/stats.e16.ts:838  math(M_SUB, at(U), at(T2), 0)
  li a0, 2
  li a1, 9712
  li a2, 9688
  li a3, 0
  call math
.L4:
  ; sci/stats.e16.ts:839  sop(M_ADD, T1, R_C, R_C)
  li a0, 1
  li a1, 26
  li a2, 15
  li a3, 15
  call sop
  ; sci/stats.e16.ts:840  math(M_DIV, at(U), at(T1), 0)
  li a0, 4
  li a1, 9712
  li a2, 9680
  li a3, 0
  call math
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

str_142:
  .byte 83, 84, 65, 84, 83, 32, 0
str_143:
  .byte 76, 73, 78, 69, 0
str_144:
  .byte 81, 85, 65, 68, 0
str_145:
  .byte 69, 88, 80, 0
str_146:
  .byte 76, 79, 71, 0
str_147:
  .byte 80, 87, 82, 0
str_148:
  .byte 73, 78, 86, 0
str_149:
  .byte 49, 45, 86, 65, 82, 0
str_150:
  .byte 83, 84, 65, 84, 83, 0
str_151:
  .byte 49, 58, 49, 45, 86, 65, 82, 32, 50, 58, 76, 73, 78, 69, 0
str_152:
  .byte 51, 58, 81, 85, 65, 68, 32, 52, 58, 69, 88, 80, 32, 53, 58, 76, 79, 71, 0
str_153:
  .byte 54, 58, 80, 87, 82, 32, 55, 58, 73, 78, 86, 0
str_154:
  .byte 56, 58, 70, 82, 69, 81, 0
str_155:
  .byte 65, 67, 58, 66, 65, 67, 75, 0
str_156:
  .byte 70, 85, 78, 67, 0
str_157:
  .byte 49, 58, 73, 78, 83, 69, 82, 84, 32, 82, 79, 87, 0
str_158:
  .byte 50, 58, 68, 69, 76, 69, 84, 69, 32, 82, 79, 87, 0
str_159:
  .byte 51, 58, 67, 76, 69, 65, 82, 32, 65, 76, 76, 0
str_160:
  .byte 52, 58, 75, 73, 78, 68, 0
str_161:
  .byte 142, 0
str_162:
  .byte 141, 0
str_163:
  .byte 32, 82, 69, 83, 85, 76, 84, 0
str_164:
  .byte 45, 0
str_165:
  .byte 110, 61, 0
str_166:
  .byte 149, 61, 0
str_167:
  .byte 150, 61, 0
str_168:
  .byte 145, 120, 61, 0
str_169:
  .byte 115, 120, 61, 0
str_170:
  .byte 145, 121, 61, 0
str_171:
  .byte 115, 121, 61, 0
str_172:
  .byte 144, 120, 61, 0
str_173:
  .byte 144, 120, 132, 61, 0
str_174:
  .byte 144, 121, 61, 0
str_175:
  .byte 144, 121, 132, 61, 0
str_176:
  .byte 144, 120, 121, 61, 0
str_177:
  .byte 114, 61, 0
str_178:
  .byte 97, 61, 0
str_179:
  .byte 99, 61, 0
str_180:
  .byte 98, 61, 0
  .align 2

  .bank 8
  .org 0xc000
; sci/base.e16.ts:99 radix() at -O1
radix:
  ; sci/base.e16.ts:100  return peek(BASE_RADIX)
  lbu a0, 5639(zero)
.return:
  ret

; sci/base.e16.ts:103 radixValue(r) at -O1
;   r in a0
radixValue:
  ; sci/base.e16.ts:104  if (r === HEX) return 16
  bne a0, zero, .L1
  ; sci/base.e16.ts:104  return 16
  li a0, 16
  ret
.L1:
  ; sci/base.e16.ts:105  if (r === BIN) return 2
  li t0, 3
  bne a0, t0, .L2
  ; sci/base.e16.ts:105  return 2
  li a0, 2
  ret
.L2:
  ; sci/base.e16.ts:106  if (r === PEN) return 5
  li t0, 4
  bne a0, t0, .L3
  ; sci/base.e16.ts:106  return 5
  li a0, 5
  ret
.L3:
  ; sci/base.e16.ts:107  return r === 1 ? 10 : 8
  li t0, 1
  bne a0, t0, .L4
  li t0, 10
  j .L5
.L4:
  li t0, 8
.L5:
  mv a0, t0
.return:
  ret

; sci/base.e16.ts:113 baseToken(k) at -O1
;   k in s1
;   d/l in s2
baseToken:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  ; sci/base.e16.ts:114  const d = baseDigit(k)
  mv a0, s1
  call baseDigit
  mv s2, a0 ; d/l
  ; sci/base.e16.ts:115  if (d !== 0xffff) return d < radixValue(radix()) ? 0x30 + d : 0
  li t0, 65535
  beq s2, t0, .L1
  ; sci/base.e16.ts:115  return d < radixValue(radix()) ? 0x30 + d : 0
  call radix
  call radixValue
  bgeu s2, a0, .L2
  addi t0, s2, 48
  j .L3
.L2:
  li t0, 0
.L3:
  mv a0, t0
  j .return
.L1:
  ; sci/base.e16.ts:116  if (radix() === HEX) {
  call radix
  bne a0, zero, .L4
  ; sci/base.e16.ts:117  const l = letterOf(k)
  mv a0, s1
  call letterOf
  mv s2, a0 ; d/l
  ; sci/base.e16.ts:118  if (l >= 0x41 && l <= 0x46) return l
  li t0, 65
  bltu s2, t0, .L5
  li t0, 70
  bltu t0, s2, .L5
  ; sci/base.e16.ts:118  return l
  mv a0, s2
  j .return
.L5:
.L4:
  ; sci/base.e16.ts:120  switch (k) {
  li t0, 24
  beq s1, t0, .L7
  li t0, 51
  beq s1, t0, .L8
  li t0, 52
  beq s1, t0, .L9
  li t0, 43
  beq s1, t0, .L10
  li t0, 44
  beq s1, t0, .L11
  li t0, 35
  beq s1, t0, .L12
  li t0, 36
  beq s1, t0, .L13
  li t0, 15
  beq s1, t0, .L14
  j .L6
.L7:
  ; sci/base.e16.ts:122  return T_MINUS
  li a0, 45
  j .return
.L8:
  ; sci/base.e16.ts:124  return T_PLUS
  li a0, 43
  j .return
.L9:
  ; sci/base.e16.ts:126  return T_MINUS
  li a0, 45
  j .return
.L10:
  ; sci/base.e16.ts:128  return T_TIMES
  li a0, 129
  j .return
.L11:
  ; sci/base.e16.ts:130  return T_DIVIDE
  li a0, 130
  j .return
.L12:
  ; sci/base.e16.ts:132  return T_OPEN
  li a0, 40
  j .return
.L13:
  ; sci/base.e16.ts:134  return T_CLOSE
  li a0, 41
  j .return
.L14:
  ; sci/base.e16.ts:136  return T_ANS
  li a0, 20
  j .return
.L6:
  ; sci/base.e16.ts:138  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/base.e16.ts:141 baseDigit(k) at -O1
;   k in a0
baseDigit:
  ; sci/base.e16.ts:142  if (k === K_0) return 0
  li t0, 59
  bne a0, t0, .L1
  ; sci/base.e16.ts:142  return 0
  li a0, 0
  ret
.L1:
  ; sci/base.e16.ts:143  if (k === K_1) return 1
  li t0, 56
  bne a0, t0, .L2
  ; sci/base.e16.ts:143  return 1
  li a0, 1
  ret
.L2:
  ; sci/base.e16.ts:144  if (k === K_2) return 2
  li t0, 57
  bne a0, t0, .L3
  ; sci/base.e16.ts:144  return 2
  li a0, 2
  ret
.L3:
  ; sci/base.e16.ts:145  if (k === K_3) return 3
  li t0, 58
  bne a0, t0, .L4
  ; sci/base.e16.ts:145  return 3
  li a0, 3
  ret
.L4:
  ; sci/base.e16.ts:146  if (k >= K_4 && k <= K_6) return 4 + k - K_4
  li t0, 48
  bltu a0, t0, .L5
  li t0, 50
  bltu t0, a0, .L5
  ; sci/base.e16.ts:146  return 4 + k - K_4
  addi a0, a0, -44
  ret
.L5:
  ; sci/base.e16.ts:147  if (k >= K_7 && k <= K_9) return 7 + k - K_7
  li t0, 40
  bltu a0, t0, .L6
  li t0, 42
  bltu t0, a0, .L6
  ; sci/base.e16.ts:147  return 7 + k - K_7
  addi a0, a0, -33
  ret
.L6:
  ; sci/base.e16.ts:148  return 0xffff
  li a0, 65535
.return:
  ret

; sci/base.e16.ts:152 baseCommand(k) at -O1
;   k in s1
baseCommand:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/base.e16.ts:153  if (k === K_FD) {
  li t0, 13
  bne s1, t0, .L1
  ; sci/base.e16.ts:154  poke(BASE_RADIX, radix() + 1 < RADIXES ? radix() + 1 : 0)
  call radix
  li t0, 5639
  addi t1, a0, 1
  li t2, 5
  bgeu t1, t2, .L2
  addi sp, sp, -2
  sw t0, 0(sp)
  call radix
  lw t0, 0(sp)
  addi sp, sp, 2
  addi t1, a0, 1
  j .L3
.L2:
  li t1, 0
.L3:
  sb t1, 0(t0)
  ; sci/base.e16.ts:155  return true
  li a0, 1
  j .return
.L1:
  ; sci/base.e16.ts:157  if (answered && (k === K_UP || k === K_DOWN)) {
  lw t0, 0x055e(zero)
  beqz t0, .L4
  beq s1, zero, .L5
  li t0, 1
  bne s1, t0, .L4
.L5:
  ; sci/base.e16.ts:158  high = k === K_UP
  sub t0, s1, zero
  seqz t0, t0
  sw t0, 0x0810(zero)
  ; sci/base.e16.ts:159  return true
  li a0, 1
  j .return
.L4:
  ; sci/base.e16.ts:161  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/base.e16.ts:167 baseFuncKey(k/d/t) at -O1
;   k/d/t in s1
baseFuncKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/d/t
  ; sci/base.e16.ts:168  if (k === K_AC) return 1
  li t0, 5
  bne s1, t0, .L1
  ; sci/base.e16.ts:168  return 1
  li a0, 1
  j .return
.L1:
  ; sci/base.e16.ts:169  if (k === K_DOWN || k === K_UP) {
  li t0, 1
  beq s1, t0, .L3
  bne s1, zero, .L2
.L3:
  ; sci/base.e16.ts:170  baseFuncPage = k === K_DOWN ? 1 : 0
  li t0, 1
  bne s1, t0, .L4
  li t0, 1
  j .L5
.L4:
  li t0, 0
.L5:
  sw t0, 0x0812(zero)
  ; sci/base.e16.ts:171  drawBaseFunc()
  call drawBaseFunc
  ; sci/base.e16.ts:172  return 0
  li a0, 0
  j .return
.L2:
  ; sci/base.e16.ts:174  const d = baseDigit(k)
  mv a0, s1
  call baseDigit
  mv s1, a0 ; k/d/t
  ; sci/base.e16.ts:175  if (baseFuncPage === 0 && d >= 1 && d <= RADIXES) {
  lw t0, 0x0812(zero)
  bne t0, zero, .L6
  li t0, 1
  bltu s1, t0, .L6
  li t0, 5
  bltu t0, s1, .L6
  ; sci/base.e16.ts:176  poke(BASE_RADIX, d - 1)
  addi t0, s1, -1
  sb t0, 5639(zero)
  ; sci/base.e16.ts:177  return 1
  li a0, 1
  j .return
.L6:
  ; sci/base.e16.ts:179  const t = baseFuncPage === 1 ? logicOf(d) : 0
  lw t0, 0x0812(zero)
  li t1, 1
  bne t0, t1, .L7
  mv a0, s1
  call logicOf
  mv t0, a0
  j .L8
.L7:
  li t0, 0
.L8:
  mv s1, t0 ; k/d/t
  ; sci/base.e16.ts:180  if (t === 0) refuse()
  bne s1, zero, .L9
  ; sci/base.e16.ts:180  refuse()
  call refuse
.L9:
  ; sci/base.e16.ts:181  return t
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/base.e16.ts:184 logicOf(d) at -O1
;   d in a0
logicOf:
  ; sci/base.e16.ts:185  if (d === 1) return T_AND
  li t0, 1
  bne a0, t0, .L1
  ; sci/base.e16.ts:185  return T_AND
  li a0, 238
  ret
.L1:
  ; sci/base.e16.ts:186  if (d === 2) return T_OR
  li t0, 2
  bne a0, t0, .L2
  ; sci/base.e16.ts:186  return T_OR
  li a0, 239
  ret
.L2:
  ; sci/base.e16.ts:187  if (d === 3) return T_XOR
  li t0, 3
  bne a0, t0, .L3
  ; sci/base.e16.ts:187  return T_XOR
  li a0, 240
  ret
.L3:
  ; sci/base.e16.ts:188  if (d === 4) return T_XNOR
  li t0, 4
  bne a0, t0, .L4
  ; sci/base.e16.ts:188  return T_XNOR
  li a0, 241
  ret
.L4:
  ; sci/base.e16.ts:189  if (d === 5) return T_NOT
  li t0, 5
  bne a0, t0, .L5
  ; sci/base.e16.ts:189  return T_NOT
  li a0, 242
  ret
.L5:
  ; sci/base.e16.ts:190  return d === 6 ? T_BNEG : 0
  li t0, 6
  bne a0, t0, .L6
  li t0, 243
  j .L7
.L6:
  li t0, 0
.L7:
  mv a0, t0
.return:
  ret

; sci/base.e16.ts:193 baseFuncScreen() at -O1
baseFuncScreen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/base.e16.ts:194  baseFuncPage = 0
  sw zero, 0x0812(zero)
  ; sci/base.e16.ts:195  drawBaseFunc()
  call drawBaseFunc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/base.e16.ts:198 drawBaseFunc() at -O1
drawBaseFunc:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/base.e16.ts:199  cls()
  call cls
  ; sci/base.e16.ts:200  bandWith(str('FUNC'), baseFuncPage === 0 ? str('1/2') : str('2/2'))
  lw t1, 0x0812(zero)
  la t0, str_181
  li t2, 0
  bne t1, t2, .L1
  la t1, str_182
  j .L2
.L1:
  la t1, str_183
.L2:
  mv a0, t0
  mv a1, t1
  call bandWith
  ; sci/base.e16.ts:201  if (baseFuncPage === 0) {
  lw t0, 0x0812(zero)
  bne t0, zero, .L3
  ; sci/base.e16.ts:202  textAt(str('1:HEX 2:DEC 3:OCT'), 1, lineY(0))
  la a0, str_184
  li a1, 1
  li a2, 11
  call textAt
  ; sci/base.e16.ts:203  textAt(str('4:BIN 5:PEN'), 1, lineY(1))
  la a0, str_185
  li a1, 1
  li a2, 20
  call textAt
  j .L4
.L3:
  ; sci/base.e16.ts:205  textAt(str('1:AND 2:OR 3:XOR'), 1, lineY(0))
  la a0, str_186
  li a1, 1
  li a2, 11
  call textAt
  ; sci/base.e16.ts:206  textAt(str('4:XNOR 5:not( 6:neg('), 1, lineY(1))
  la a0, str_187
  li a1, 1
  li a2, 20
  call textAt
.L4:
  ; sci/base.e16.ts:208  textAt(str('\x8d\x8e:PAGE AC:BACK'), 1, lineY(5))
  la a0, str_188
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/base.e16.ts:218 peekToken() at -O1
peekToken:
  ; sci/base.e16.ts:219  return basePos < count ? peek(lineFrom + basePos) : 0
  lw t0, 0x0818(zero)
  lw t1, 0x0816(zero)
  bgeu t0, t1, .L1
  lw t0, 0x0814(zero)
  lw t1, 0x0818(zero)
  add t0, t0, t1
  lbu t0, 0(t0)
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
.return:
  ret

; sci/base.e16.ts:226 constants() at -O1
constants:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/base.e16.ts:227  setNumber(addr(TWO32), 0x4294, 0x9672, 0x9600)
  la a0, TWO32
  li a1, 17044
  li a2, 38514
  li a3, 38400
  call setNumber
  ; sci/base.e16.ts:228  setNumber(addr(TWO31), 0x2147, 0x4836, 0x4800)
  la a0, TWO31
  li a1, 8519
  li a2, 18486
  li a3, 18432
  call setNumber
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/base.e16.ts:232 setNumber(n, a, b, c) at -O1
;   n in a0
;   a in a1
;   b in a2
;   c in a3
setNumber:
  ; sci/base.e16.ts:233  poke(n, 0)
  sb zero, 0(a0)
  ; sci/base.e16.ts:234  poke(n + 1, 9)
  li t0, 9
  sb t0, 1(a0)
  ; sci/base.e16.ts:235  poke(n + 2, a >> 8)
  srli t0, a1, 8
  sb t0, 2(a0)
  ; sci/base.e16.ts:236  poke(n + 3, a & 0xff)
  andi t0, a1, 255
  sb t0, 3(a0)
  ; sci/base.e16.ts:237  poke(n + 4, b >> 8)
  srli t0, a2, 8
  sb t0, 4(a0)
  ; sci/base.e16.ts:238  poke(n + 5, b & 0xff)
  andi t0, a2, 255
  sb t0, 5(a0)
  ; sci/base.e16.ts:239  poke(n + 6, c >> 8)
  srli t0, a3, 8
  sb t0, 6(a0)
  ; sci/base.e16.ts:240  poke(n + 7, c & 0xff)
  andi t0, a3, 255
  sb t0, 7(a0)
.return:
  ret

; sci/base.e16.ts:244 baseEvaluate(from, size) at -O1
;   from in s2
;   size in s1
baseEvaluate:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; from
  mv s1, a1 ; size
  ; sci/base.e16.ts:245  lineFrom = from
  sw s2, 0x0814(zero)
  ; sci/base.e16.ts:246  count = size
  sw s1, 0x0816(zero)
  ; sci/base.e16.ts:247  basePos = 0
  sw zero, 0x0818(zero)
  ; sci/base.e16.ts:248  constants()
  call constants
  ; sci/base.e16.ts:249  if (size === 0) fail(E_SYNTAX, 0)
  bne s1, zero, .L1
  ; sci/base.e16.ts:249  fail(E_SYNTAX, 0)
  li a0, 2
  li a1, 0
  call fail
.L1:
  ; sci/base.e16.ts:250  either()
  call either
  ; sci/base.e16.ts:251  if (basePos < count) fail(E_SYNTAX, basePos)
  lw t0, 0x0818(zero)
  lw t1, 0x0816(zero)
  bgeu t0, t1, .L2
  ; sci/base.e16.ts:251  fail(E_SYNTAX, basePos)
  lw a1, 0x0818(zero)
  li a0, 2
  call fail
.L2:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/base.e16.ts:255 either() at -O1
;   t in s1
;   where in s2
either:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/base.e16.ts:256  both()
  call both
  ; sci/base.e16.ts:257  for (;;) {
.L1:
  ; sci/base.e16.ts:258  const t = peekToken()
  call peekToken
  mv s1, a0 ; t
  ; sci/base.e16.ts:259  if (t !== T_OR && t !== T_XOR && t !== T_XNOR) return
  li t0, 239
  beq s1, t0, .L5
  li t0, 240
  beq s1, t0, .L5
  li t0, 241
  beq s1, t0, .L5
  ; sci/base.e16.ts:259  return
  j .return
.L5:
  ; sci/base.e16.ts:260  const where = basePos
  lw s2, 0x0818(zero)
  ; sci/base.e16.ts:261  basePos++
  lw t0, 0x0818(zero)
  addi t0, t0, 1
  sw t0, 0x0818(zero)
  ; sci/base.e16.ts:262  both()
  call both
  ; sci/base.e16.ts:263  logic(t, where)
  mv a0, s1
  mv a1, s2
  call logic
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/base.e16.ts:267 both() at -O1
;   where in s1
both:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/base.e16.ts:268  sum32()
  call sum32
  ; sci/base.e16.ts:269  while (peekToken() === T_AND) {
  j .L3
.L1:
  ; sci/base.e16.ts:270  const where = basePos
  lw s1, 0x0818(zero)
  ; sci/base.e16.ts:271  basePos++
  lw t0, 0x0818(zero)
  addi t0, t0, 1
  sw t0, 0x0818(zero)
  ; sci/base.e16.ts:272  sum32()
  call sum32
  ; sci/base.e16.ts:273  logic(T_AND, where)
  li a0, 238
  mv a1, s1
  call logic
.L3:
  call peekToken
  li t0, 238
  beq a0, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/base.e16.ts:277 sum32() at -O1
;   t in s1
;   where in s2
sum32:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/base.e16.ts:278  prod32()
  call prod32
  ; sci/base.e16.ts:279  for (;;) {
.L1:
  ; sci/base.e16.ts:280  const t = peekToken()
  call peekToken
  mv s1, a0 ; t
  ; sci/base.e16.ts:281  if (t !== T_PLUS && t !== T_MINUS) return
  li t0, 43
  beq s1, t0, .L5
  li t0, 45
  beq s1, t0, .L5
  ; sci/base.e16.ts:281  return
  j .return
.L5:
  ; sci/base.e16.ts:282  const where = basePos
  lw s2, 0x0818(zero)
  ; sci/base.e16.ts:283  basePos++
  lw t0, 0x0818(zero)
  addi t0, t0, 1
  sw t0, 0x0818(zero)
  ; sci/base.e16.ts:284  prod32()
  call prod32
  ; sci/base.e16.ts:285  arithmetic(t === T_PLUS ? M_ADD : M_SUB, where)
  li t0, 43
  bne s1, t0, .L6
  li t0, 1
  j .L7
.L6:
  li t0, 2
.L7:
  mv a0, t0
  mv a1, s2
  call arithmetic
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/base.e16.ts:289 prod32() at -O1
;   t in s1
;   where in s2
prod32:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/base.e16.ts:290  sign32()
  call sign32
  ; sci/base.e16.ts:291  for (;;) {
.L1:
  ; sci/base.e16.ts:292  const t = peekToken()
  call peekToken
  mv s1, a0 ; t
  ; sci/base.e16.ts:293  if (t !== T_TIMES && t !== T_DIVIDE) return
  li t0, 129
  beq s1, t0, .L5
  li t0, 130
  beq s1, t0, .L5
  ; sci/base.e16.ts:293  return
  j .return
.L5:
  ; sci/base.e16.ts:294  const where = basePos
  lw s2, 0x0818(zero)
  ; sci/base.e16.ts:295  basePos++
  lw t0, 0x0818(zero)
  addi t0, t0, 1
  sw t0, 0x0818(zero)
  ; sci/base.e16.ts:296  sign32()
  call sign32
  ; sci/base.e16.ts:297  arithmetic(t === T_TIMES ? M_MUL : M_IDIV, where)
  li t0, 129
  bne s1, t0, .L6
  li t0, 3
  j .L7
.L6:
  li t0, 8
.L7:
  mv a0, t0
  mv a1, s2
  call arithmetic
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/base.e16.ts:301 sign32() at -O1
;   where in s1
sign32:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/base.e16.ts:302  if (peekToken() === T_MINUS) {
  call peekToken
  li t0, 45
  bne a0, t0, .L1
  ; sci/base.e16.ts:303  const where = basePos
  lw s1, 0x0818(zero)
  ; sci/base.e16.ts:304  basePos++
  lw t0, 0x0818(zero)
  addi t0, t0, 1
  sw t0, 0x0818(zero)
  ; sci/base.e16.ts:305  sign32()
  call sign32
  ; sci/base.e16.ts:306  math(M_NEG, top(), 0, where)
  call top
  mv a1, a0
  li a0, 16
  li a2, 0
  mv a3, s1
  call math
  ; sci/base.e16.ts:307  wrap32(top(), where)
  call top
  mv a1, s1
  call wrap32
  ; sci/base.e16.ts:308  return
  j .return
.L1:
  ; sci/base.e16.ts:310  primary32()
  call primary32
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/base.e16.ts:313 primary32() at -O1
;   t in s1
;   where in s2
primary32:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/base.e16.ts:314  const t = peekToken()
  call peekToken
  mv s1, a0 ; t
  ; sci/base.e16.ts:315  const where = basePos
  lw s2, 0x0818(zero)
  ; sci/base.e16.ts:316  if (isDigitOf(t)) {
  mv a0, s1
  call isDigitOf
  beqz a0, .L1
  ; sci/base.e16.ts:317  number32()
  call number32
  ; sci/base.e16.ts:318  return
  j .return
.L1:
  ; sci/base.e16.ts:320  basePos++
  lw t0, 0x0818(zero)
  addi t0, t0, 1
  sw t0, 0x0818(zero)
  ; sci/base.e16.ts:321  if (t === T_ANS) {
  li t0, 20
  bne s1, t0, .L2
  ; sci/base.e16.ts:322  copy8(KEEP_ANS, push(where))
  mv a0, s2
  call push
  mv a1, a0
  li a0, 3080
  call copy8
  ; sci/base.e16.ts:323  wrap32(top(), where)
  call top
  mv a1, s2
  call wrap32
  j .L3
.L2:
  ; sci/base.e16.ts:324  if (t === T_OPEN || t === T_NOT || t === T_BNEG) {
  li t0, 40
  beq s1, t0, .L5
  li t0, 242
  beq s1, t0, .L5
  li t0, 243
  bne s1, t0, .L4
.L5:
  ; sci/base.e16.ts:325  either()
  call either
  ; sci/base.e16.ts:326  if (peekToken() === T_CLOSE) basePos++
  call peekToken
  li t0, 41
  bne a0, t0, .L6
  ; sci/base.e16.ts:326  basePos++
  lw t0, 0x0818(zero)
  addi t0, t0, 1
  sw t0, 0x0818(zero)
.L6:
  ; sci/base.e16.ts:327  if (t === T_NOT) logic(T_NOT, where)
  li t0, 242
  bne s1, t0, .L7
  ; sci/base.e16.ts:327  logic(T_NOT, where)
  li a0, 242
  mv a1, s2
  call logic
  j .L10
.L7:
  ; sci/base.e16.ts:328  if (t === T_BNEG) {
  li t0, 243
  bne s1, t0, .L10
  ; sci/base.e16.ts:329  math(M_NEG, top(), 0, where)
  call top
  mv a1, a0
  li a0, 16
  li a2, 0
  mv a3, s2
  call math
  ; sci/base.e16.ts:330  wrap32(top(), where)
  call top
  mv a1, s2
  call wrap32
  j .L10
.L4:
  ; sci/base.e16.ts:332  fail(E_SYNTAX, where)
  li a0, 2
  mv a1, s2
  call fail
.L10:
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/base.e16.ts:336 digitValue(t) at -O1
;   t in a0
digitValue:
  ; sci/base.e16.ts:337  if (t >= 0x30 && t <= 0x39) return t - 0x30
  li t0, 48
  bltu a0, t0, .L1
  li t0, 57
  bltu t0, a0, .L1
  ; sci/base.e16.ts:337  return t - 0x30
  addi a0, a0, -48
  ret
.L1:
  ; sci/base.e16.ts:338  if (t >= 0x41 && t <= 0x46) return t - 0x37
  li t0, 65
  bltu a0, t0, .L2
  li t0, 70
  bltu t0, a0, .L2
  ; sci/base.e16.ts:338  return t - 0x37
  addi a0, a0, -55
  ret
.L2:
  ; sci/base.e16.ts:339  return 0xffff
  li a0, 65535
.return:
  ret

; sci/base.e16.ts:342 isDigitOf(t/d) at -O1
;   t/d in s1
isDigitOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t/d
  ; sci/base.e16.ts:343  const d = digitValue(t)
  mv a0, s1
  call digitValue
  mv s1, a0 ; t/d
  ; sci/base.e16.ts:344  return d !== 0xffff && d < radixValue(radix())
  li t0, 65535
  sub t0, s1, t0
  snez t0, t0
  mv t1, t0
  beqz t1, .L1
  call radix
  call radixValue
  sltu t0, s1, a0
.L1:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/base.e16.ts:348 number32() at -O1
;   where in s1
;   n in s3
;   base in s0
;   digit in s2
number32:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s2, 8(sp)
  ; sci/base.e16.ts:349  const where = basePos
  lw s1, 0x0818(zero)
  ; sci/base.e16.ts:350  const n = pushInt(0, where)
  li a0, 0
  mv a1, s1
  call pushInt
  mv s3, a0 ; n
  ; sci/base.e16.ts:351  const base = pushInt(radixValue(radix()), where)
  call radix
  call radixValue
  mv a1, s1
  call pushInt
  mv s0, a0 ; base
  ; sci/base.e16.ts:352  const digit = push(where)
  mv a0, s1
  call push
  mv s2, a0 ; digit
  ; sci/base.e16.ts:353  while (isDigitOf(peekToken())) {
  j .L3
.L1:
  ; sci/base.e16.ts:354  copy8(base, digit)
  mv a0, s0
  mv a1, s2
  call copy8
  ; sci/base.e16.ts:355  math(M_MUL, n, digit, where)
  li a0, 3
  mv a1, s3
  mv a2, s2
  mv a3, s1
  call math
  ; sci/base.e16.ts:356  setDigit(digit, digitValue(peekToken()))
  call peekToken
  call digitValue
  mv a1, a0
  mv a0, s2
  call setDigit
  ; sci/base.e16.ts:357  math(M_ADD, n, digit, where)
  li a0, 1
  mv a1, s3
  mv a2, s2
  mv a3, s1
  call math
  ; sci/base.e16.ts:358  wrap32(n, where)
  mv a0, s3
  mv a1, s1
  call wrap32
  ; sci/base.e16.ts:359  basePos++
  lw t0, 0x0818(zero)
  addi t0, t0, 1
  sw t0, 0x0818(zero)
.L3:
  call peekToken
  call isDigitOf
  bnez a0, .L1
  ; sci/base.e16.ts:361  pop()
  call pop
  ; sci/base.e16.ts:362  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/base.e16.ts:366 setDigit(n, v) at -O1
;   n in a0
;   v in a1
;   k in a2
setDigit:
  ; sci/base.e16.ts:367  for (let k: u16 = 0; k < 8; k++) poke(n + k, 0)
  li a2, 0 ; k
  j .L3
.L1:
  ; sci/base.e16.ts:367  poke(n + k, 0)
  add t0, a0, a2
  sb zero, 0(t0)
  addi a2, a2, 1
.L3:
  li t0, 8
  bltu a2, t0, .L1
  ; sci/base.e16.ts:368  if (v >= 10) {
  li t0, 10
  bltu a1, t0, .L5
  ; sci/base.e16.ts:369  poke(n + 1, 1)
  li t0, 1
  sb t0, 1(a0)
  ; sci/base.e16.ts:371  poke(n + 2, v + 6)
  addi t0, a1, 6
  sb t0, 2(a0)
  j .L6
.L5:
  ; sci/base.e16.ts:372  poke(n + 2, v << 4)
  slli t0, a1, 4
  sb t0, 2(a0)
.L6:
.return:
  ret

; sci/base.e16.ts:376 arithmetic(op, where) at -O1
;   op in s0
;   where in s1
;   b in s2
;   a in s3
arithmetic:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s0, a0 ; op
  mv s1, a1 ; where
  ; sci/base.e16.ts:377  const b = top()
  call top
  mv s2, a0 ; b
  ; sci/base.e16.ts:378  const a = b - VALUE_SIZE
  addi s3, s2, -36
  ; sci/base.e16.ts:379  math(op, a, b, where)
  mv a0, s0
  mv a1, s3
  mv a2, s2
  mv a3, s1
  call math
  ; sci/base.e16.ts:380  wrap32(a, where)
  mv a0, s3
  mv a1, s1
  call wrap32
  ; sci/base.e16.ts:381  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/base.e16.ts:385 wrap32(v, where) at -O1
;   v in s1
;   where in s2
;   t in s3
wrap32:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; v
  mv s2, a1 ; where
  ; sci/base.e16.ts:386  math(M_MOD, v, addr(TWO32), where)
  li a0, 9
  mv a1, s1
  la a2, TWO32
  mv a3, s2
  call math
  ; sci/base.e16.ts:387  if (isNegative(v)) math(M_ADD, v, addr(TWO32), where)
  mv a0, s1
  call isNegative
  beqz a0, .L1
  ; sci/base.e16.ts:387  math(M_ADD, v, addr(TWO32), where)
  li a0, 1
  mv a1, s1
  la a2, TWO32
  mv a3, s2
  call math
.L1:
  ; sci/base.e16.ts:388  const t = push(where)
  mv a0, s2
  call push
  mv s3, a0 ; t
  ; sci/base.e16.ts:389  copy8(v, t)
  mv a0, s1
  mv a1, s3
  call copy8
  ; sci/base.e16.ts:390  math(M_SUB, t, addr(TWO31), where)
  li a0, 2
  mv a1, s3
  la a2, TWO31
  mv a3, s2
  call math
  ; sci/base.e16.ts:391  if (!isNegative(t)) math(M_SUB, v, addr(TWO32), where)
  mv a0, s3
  call isNegative
  bnez a0, .L2
  ; sci/base.e16.ts:391  math(M_SUB, v, addr(TWO32), where)
  li a0, 2
  mv a1, s1
  la a2, TWO32
  mv a3, s2
  call math
.L2:
  ; sci/base.e16.ts:392  pop()
  call pop
  ; sci/base.e16.ts:393  exactWhole(v)
  mv a0, s1
  la t0, exactWhole
  li t1, 2
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/base.e16.ts:400 logic(t, where) at -O1
;   t in s0
;   where in s3
;   b/k in s1
;   k/a in s2
logic:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  mv s0, a0 ; t
  mv s3, a1 ; where
  ; sci/base.e16.ts:401  const b = top()
  call top
  mv s1, a0 ; b/k
  ; sci/base.e16.ts:402  if (t === T_NOT) {
  li t0, 242
  bne s0, t0, .L1
  ; sci/base.e16.ts:403  math(M_TOI32, b, addr(left), where)
  li a0, 42
  mv a1, s1
  la a2, left
  mv a3, s3
  call math
  ; sci/base.e16.ts:404  for (let k: u16 = 0; k < 4; k++) left[k] = ~left[k] & 0xff
  li s2, 0 ; k/a
  j .L4
.L2:
  ; sci/base.e16.ts:404  left[k] = ~left[k] & 0xff
  lbu t0, left(s2)
  not t0, t0
  andi t0, t0, 255
  sb t0, left(s2)
  addi s2, s2, 1
.L4:
  li t0, 4
  bltu s2, t0, .L2
  ; sci/base.e16.ts:405  math(M_FROMI32, b, addr(left), where)
  li a0, 41
  mv a1, s1
  la a2, left
  mv a3, s3
  call math
  ; sci/base.e16.ts:406  exactWhole(b)
  mv a0, s1
  la t0, exactWhole
  li t1, 2
  call far_call
  ; sci/base.e16.ts:407  return
  j .return
.L1:
  ; sci/base.e16.ts:409  const a = b - VALUE_SIZE
  addi s2, s1, -36
  ; sci/base.e16.ts:410  math(M_TOI32, a, addr(left), where)
  li a0, 42
  mv a1, s2
  la a2, left
  mv a3, s3
  call math
  ; sci/base.e16.ts:411  math(M_TOI32, b, addr(right), where)
  li a0, 42
  mv a1, s1
  la a2, right
  mv a3, s3
  call math
  ; sci/base.e16.ts:412  for (let k: u16 = 0; k < 4; k++) left[k] = bitsOf(t, left[k], right[k])
  li s1, 0 ; b/k
  j .L8
.L6:
  ; sci/base.e16.ts:412  left[k] = bitsOf(t, left[k], right[k])
  lbu a1, left(s1)
  lbu a2, right(s1)
  mv a0, s0
  call bitsOf
  sb a0, left(s1)
  addi s1, s1, 1
.L8:
  li t0, 4
  bltu s1, t0, .L6
  ; sci/base.e16.ts:413  math(M_FROMI32, a, addr(left), where)
  li a0, 41
  mv a1, s2
  la a2, left
  mv a3, s3
  call math
  ; sci/base.e16.ts:414  exactWhole(a)
  mv a0, s2
  la t0, exactWhole
  li t1, 2
  call far_call
  ; sci/base.e16.ts:415  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/base.e16.ts:418 bitsOf(t, a, b) at -O1
;   t in a0
;   a in a1
;   b in a2
bitsOf:
  ; sci/base.e16.ts:419  if (t === T_AND) return a & b
  li t0, 238
  bne a0, t0, .L1
  ; sci/base.e16.ts:419  return a & b
  and a0, a1, a2
  ret
.L1:
  ; sci/base.e16.ts:420  if (t === T_OR) return a | b
  li t0, 239
  bne a0, t0, .L2
  ; sci/base.e16.ts:420  return a | b
  or a0, a1, a2
  ret
.L2:
  ; sci/base.e16.ts:421  if (t === T_XOR) return a ^ b
  li t0, 240
  bne a0, t0, .L3
  ; sci/base.e16.ts:421  return a ^ b
  xor a0, a1, a2
  ret
.L3:
  ; sci/base.e16.ts:422  return ~(a ^ b) & 0xff
  xor t0, a1, a2
  not t0, t0
  andi a0, t0, 255
.return:
  ret

; sci/base.e16.ts:431 baseDraw() at -O1
;   n in s2
;   r in s1
baseDraw:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; sci/base.e16.ts:432  cls()
  call cls
  ; sci/base.e16.ts:433  bandWith(str('BASE 32'), radixName(radix()))
  call radix
  call radixName
  mv a1, a0
  la a0, str_189
  call bandWith
  ; sci/base.e16.ts:434  drawLine32()
  call drawLine32
  ; sci/base.e16.ts:435  if (!answered) return
  lw t0, 0x055e(zero)
  bnez t0, .L1
  ; sci/base.e16.ts:435  return
  j .return
.L1:
  ; sci/base.e16.ts:436  noCursor()
  call noCursor
  ; sci/base.e16.ts:437  constants()
  call constants
  ; sci/base.e16.ts:438  math(M_TOI32, KEEP_ANS, addr(bits), 0)
  li a0, 42
  li a1, 3080
  la a2, bits
  li a3, 0
  call math
  ; sci/base.e16.ts:439  radixText(radix())
  call radix
  call radixText
  ; sci/base.e16.ts:440  textRight(addr(baseText), lineY(1))
  la a0, baseText
  li a1, 20
  call textRight
  ; sci/base.e16.ts:442  let n: u16 = 2
  li s2, 2 ; n
  ; sci/base.e16.ts:443  for (let r: u16 = 0; r < 4; r++) {
  li s1, 0 ; r
  j .L4
.L2:
  ; sci/base.e16.ts:444  if (r === radix()) continue
  call radix
  bne s1, a0, .L6
  ; sci/base.e16.ts:444  continue
  j .L3
.L6:
  ; sci/base.e16.ts:445  textAt(r === BIN ? binName() : radixName(r), 1, lineY(n))
  li t0, 3
  bne s1, t0, .L7
  ; sci/base.e16.ts:462  return high ? str('BIN\x8e') : str('BIN\x8d')
  lw t0, 0x0810(zero)
  beqz t0, .I1.L1
  la t0, str_195
  j .L8
.I1.L1:
  la t0, str_196
  j .L8
.L7:
  mv a0, s1
  call radixName
  mv t0, a0
.L8:
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s2
  call lineY
  lw t0, 0(sp)
  addi sp, sp, 2
  li a1, 1
  mv a2, a0
  mv a0, t0
  call textAt
  ; sci/base.e16.ts:446  radixText(r)
  mv a0, s1
  call radixText
  ; sci/base.e16.ts:447  textRight(addr(baseText), lineY(n))
  mv a0, s2
  call lineY
  mv a1, a0
  la a0, baseText
  call textRight
  ; sci/base.e16.ts:448  n++
  addi s2, s2, 1
.L3:
  addi s1, s1, 1
.L4:
  li t0, 4
  bltu s1, t0, .L2
  ; sci/base.e16.ts:450  if (radix() !== PEN) dots()
  call radix
  li t0, 4
  beq a0, t0, .L9
  ; sci/base.e16.ts:450  dots()
  call dots
.L9:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/base.e16.ts:453 radixName(r) at -O1
;   r in a0
radixName:
  ; sci/base.e16.ts:454  if (r === HEX) return str('HEX')
  bne a0, zero, .L1
  ; sci/base.e16.ts:454  return str('HEX')
  la a0, str_190
  ret
.L1:
  ; sci/base.e16.ts:455  if (r === 1) return str('DEC')
  li t0, 1
  bne a0, t0, .L2
  ; sci/base.e16.ts:455  return str('DEC')
  la a0, str_191
  ret
.L2:
  ; sci/base.e16.ts:456  if (r === 2) return str('OCT')
  li t0, 2
  bne a0, t0, .L3
  ; sci/base.e16.ts:456  return str('OCT')
  la a0, str_192
  ret
.L3:
  ; sci/base.e16.ts:457  return r === PEN ? str('PEN') : str('BIN')
  li t0, 4
  bne a0, t0, .L4
  la t0, str_193
  j .L5
.L4:
  la t0, str_194
.L5:
  mv a0, t0
.return:
  ret

; sci/base.e16.ts:466 drawLine32() at -O1
;   chars/end in s2
;   cursorAt in s3
;   i/from in s1
;   c in s0
drawLine32:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  sw s0, 8(sp)
  ; sci/base.e16.ts:467  let chars: u16 = 0
  li s2, 0 ; chars/end
  ; sci/base.e16.ts:468  let cursorAt: u16 = 0
  li s3, 0 ; cursorAt
  ; sci/base.e16.ts:469  for (let i: u16 = 0; i < length; i++) {
  li s1, 0 ; i/from
  j .L3
.L1:
  ; sci/base.e16.ts:470  if (i === cursor) cursorAt = chars
  lw t0, 0x055c(zero)
  bne s1, t0, .L5
  ; sci/base.e16.ts:470  cursorAt = chars
  mv s3, s2 ; cursorAt
.L5:
  ; sci/base.e16.ts:471  chars = into(line[i], chars)
  lbu a0, line(s1)
  mv a1, s2
  call into
  mv s2, a0 ; chars/end
  addi s1, s1, 1
.L3:
  lw t0, 0x055a(zero)
  bltu s1, t0, .L1
  ; sci/base.e16.ts:473  if (cursor >= length) cursorAt = chars
  lw t0, 0x055c(zero)
  lw t1, 0x055a(zero)
  bltu t0, t1, .L6
  ; sci/base.e16.ts:473  cursorAt = chars
  mv s3, s2 ; cursorAt
.L6:
  ; sci/base.e16.ts:474  const from = cursorAt > 20 ? cursorAt - 20 : 0
  li t0, 20
  bgeu t0, s3, .L7
  addi t0, s3, -20
  j .L8
.L7:
  li t0, 0
.L8:
  mv s1, t0 ; i/from
  ; sci/base.e16.ts:475  const end = chars - from > 21 ? from + 21 : chars
  sub t0, s2, s1
  li t1, 21
  bgeu t1, t0, .L9
  addi t0, s1, 21
  j .L10
.L9:
  mv t0, s2
.L10:
  mv s2, t0 ; chars/end
  ; sci/base.e16.ts:476  for (let c = from; c < end; c++) glyphAt(baseText[c], (c - from) * 6 + 1, lineY(0))
  mv s0, s1 ; c
  j .L13
.L11:
  ; sci/base.e16.ts:476  glyphAt(baseText[c], (c - from) * 6 + 1, lineY(0))
  lbu a0, baseText(s0)
  sub t1, s0, s1
  slli t2, t1, 2
  slli t1, t1, 1
  add t1, t1, t2
  addi a1, t1, 1
  li a2, 11
  call glyphAt
  addi s0, s0, 1
.L13:
  bltu s0, s2, .L11
  ; sci/base.e16.ts:477  if (!answered) barDots((cursorAt - from) * 6, lineY(0) - 1)
  lw t0, 0x055e(zero)
  bnez t0, .L15
  ; sci/base.e16.ts:477  barDots((cursorAt - from) * 6, lineY(0) - 1)
  sub t0, s3, s1
  slli t1, t0, 2
  slli t0, t0, 1
  add a0, t0, t1
  li a1, 10
  call barDots
.L15:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/base.e16.ts:481 into(t, n/k) at -O1
;   t in s3
;   n/k in s1
;   s/p in s2
into:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; t
  mv s1, a1 ; n/k
  ; sci/base.e16.ts:482  const s = tokenText(t)
  mv a0, s3
  call tokenText
  mv s2, a0 ; s/p
  ; sci/base.e16.ts:483  if (s === 0) {
  bne s2, zero, .L1
  ; sci/base.e16.ts:484  if (n < 40) baseText[n] = t
  li t0, 40
  bgeu s1, t0, .L2
  ; sci/base.e16.ts:484  baseText[n] = t
  sb s3, baseText(s1)
.L2:
  ; sci/base.e16.ts:485  return n + 1
  addi a0, s1, 1
  j .return
.L1:
  ; sci/base.e16.ts:487  let k = n
  ; sci/base.e16.ts:488  let p = s
  ; sci/base.e16.ts:489  while (peek(p) !== 0) {
  j .L5
.L3:
  ; sci/base.e16.ts:490  if (k < 40) baseText[k] = peek(p)
  li t0, 40
  bgeu s1, t0, .L7
  ; sci/base.e16.ts:490  baseText[k] = peek(p)
  lbu t0, 0(s2)
  sb t0, baseText(s1)
.L7:
  ; sci/base.e16.ts:491  k++
  addi s1, s1, 1
  ; sci/base.e16.ts:492  p++
  addi s2, s2, 1
.L5:
  lbu t0, 0(s2)
  bne t0, zero, .L3
  ; sci/base.e16.ts:494  return k
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/base.e16.ts:498 radixText(r/first) at -O1
;   r/first in s1
;   width in 0(sp)
;   digits in s3
;   k in s2
;   d in s0
radixText:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  sw s2, 8(sp)
  sw s0, 10(sp)
  mv s1, a0 ; r/first
  ; sci/base.e16.ts:499  if (r === PEN) {
  li t0, 4
  bne s1, t0, .L1
  ; sci/base.e16.ts:500  penText()
  call penText
  ; sci/base.e16.ts:501  return
  j .return
.L1:
  ; sci/base.e16.ts:503  if (r === 1) {
  li t0, 1
  bne s1, t0, .L2
  ; sci/base.e16.ts:504  poke16(MATH_ARG, 10)
  li t0, 10
  li t1, 65366
  sw t0, 0(t1)
  ; sci/base.e16.ts:505  math(M_FORMAT, KEEP_ANS, addr(baseText), 0)
  li a0, 57
  li a1, 3080
  la a2, baseText
  li a3, 0
  call math
  ; sci/base.e16.ts:506  baseText[peek16(MATH_ARG)] = 0
  li t0, 65366
  lw t0, 0(t0)
  sb zero, baseText(t0)
  ; sci/base.e16.ts:507  return
  j .return
.L2:
  ; sci/base.e16.ts:509  const width: u16 = r === HEX ? 4 : r === BIN ? 1 : 3
  bne s1, zero, .L3
  li t0, 4
  j .L4
.L3:
  li t0, 3
  bne s1, t0, .L5
  li t0, 1
  j .L6
.L5:
  li t0, 3
.L6:
.L4:
  sw t0, 0(sp) ; width
  ; sci/base.e16.ts:510  const digits: u16 = r === HEX ? 8 : r === BIN ? 16 : 11
  bne s1, zero, .L7
  li t0, 8
  j .L8
.L7:
  li t0, 3
  bne s1, t0, .L9
  li t0, 16
  j .L10
.L9:
  li t0, 11
.L10:
.L8:
  mv s3, t0 ; digits
  ; sci/base.e16.ts:511  const first: u16 = r === BIN && high ? 16 : 0
  li t0, 3
  bne s1, t0, .L11
  lw t0, 0x0810(zero)
  beqz t0, .L11
  li t0, 16
  j .L12
.L11:
  li t0, 0
.L12:
  mv s1, t0 ; r/first
  ; sci/base.e16.ts:512  for (let k: u16 = 0; k < digits; k++) {
  li s2, 0 ; k
  j .L15
.L13:
  ; sci/base.e16.ts:513  const d = field(first + (digits - 1 - k) * width, width)
  addi t0, s3, -1
  sub t0, t0, s2
  lw t1, 0(sp) ; width
  mul t0, t0, t1
  add a0, s1, t0
  lw a1, 0(sp)
  call field
  mv s0, a0 ; d
  ; sci/base.e16.ts:514  baseText[k] = d < 10 ? 0x30 + d : 0x37 + d
  addi t0, s2, baseText
  mv t1, s0
  li t2, 10
  bgeu t1, t2, .L17
  addi t1, s0, 48
  j .L18
.L17:
  addi t1, s0, 55
.L18:
  sb t1, 0(t0)
  addi s2, s2, 1
.L15:
  bltu s2, s3, .L13
  ; sci/base.e16.ts:516  baseText[digits] = 0
  sb zero, baseText(s3)
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  lw s0, 10(sp)
  addi sp, sp, 12
  ret

; sci/base.e16.ts:523 penText() at -O1
;   k in s1
penText:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/base.e16.ts:524  const left = WORK + 64
  ; sci/base.e16.ts:525  const five = WORK + 72
  ; sci/base.e16.ts:526  const digit = WORK + 80
  ; sci/base.e16.ts:527  copy8(KEEP_ANS, left)
  li a0, 3080
  li a1, 10048
  call copy8
  ; sci/base.e16.ts:528  if (isNegative(left)) math(M_ADD, left, addr(TWO32), 0)
  li a0, 10048
  call isNegative
  beqz a0, .L1
  ; sci/base.e16.ts:528  math(M_ADD, left, addr(TWO32), 0)
  li a0, 1
  li a1, 10048
  la a2, TWO32
  li a3, 0
  call math
.L1:
  ; sci/base.e16.ts:529  setDigit(five, 5)
  li a0, 10056
  li a1, 5
  call setDigit
  ; sci/base.e16.ts:530  for (let k: u16 = 14; k > 0; k--) {
  li s1, 14 ; k
  j .L4
.L2:
  ; sci/base.e16.ts:531  copy8(left, digit)
  li a0, 10048
  li a1, 10064
  call copy8
  ; sci/base.e16.ts:532  math(M_MOD, digit, five, 0)
  li a0, 9
  li a1, 10064
  li a2, 10056
  li a3, 0
  call math
  ; sci/base.e16.ts:533  baseText[k - 1] = 0x30 + (peek(digit + 2) >> 4)
  li t0, 10066
  lbu t0, 0(t0)
  srli t0, t0, 4
  addi t0, t0, 48
  sb t0, baseText-1(s1)
  ; sci/base.e16.ts:534  math(M_IDIV, left, five, 0)
  li a0, 8
  li a1, 10048
  li a2, 10056
  li a3, 0
  call math
  addi s1, s1, -1
.L4:
  bltu zero, s1, .L2
  ; sci/base.e16.ts:536  baseText[14] = 0
  sb zero, baseText+14(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/base.e16.ts:540 field(from, width) at -O1
;   from in a0
;   width in a1
;   v in a3
;   k in a2
;   b in s1
field:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; sci/base.e16.ts:541  let v: u16 = 0
  li a3, 0 ; v
  ; sci/base.e16.ts:542  for (let k: u16 = 0; k < width; k++) {
  li a2, 0 ; k
  j .L3
.L1:
  ; sci/base.e16.ts:543  const b = from + k
  add s1, a0, a2
  ; sci/base.e16.ts:544  if (b < 32 && ((bits[b >> 3] >> (b & 7)) & 1) !== 0) v |= 1 << k
  li t0, 32
  bgeu s1, t0, .L5
  srli t0, s1, 3
  lbu t0, bits(t0)
  andi t1, s1, 7
  srl t0, t0, t1
  andi t0, t0, 1
  beq t0, zero, .L5
  ; sci/base.e16.ts:544  v |= 1 << k
  li t0, 1
  sll t0, t0, a2
  or a3, a3, t0
.L5:
  addi a2, a2, 1
.L3:
  bltu a2, a1, .L1
  ; sci/base.e16.ts:546  return v
  mv a0, a3
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; sci/base.e16.ts:550 dots() at -O1
;   first in s0
;   b in s1
;   x in 0(sp)
;   on/y in s2
;   dx in s3
dots:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  ; sci/base.e16.ts:551  const first: u16 = high ? 16 : 0
  lw t0, 0x0810(zero)
  beqz t0, .L1
  li t0, 16
  j .L2
.L1:
  li t0, 0
.L2:
  mv s0, t0 ; first
  ; sci/base.e16.ts:552  for (let b: u16 = 0; b < 16; b++) {
  li s1, 0 ; b
  j .L5
.L3:
  ; sci/base.e16.ts:553  const x = 122 - b * 7 - (b >= 8 ? 2 : 0)
  slli t1, s1, 3
  sub t0, t1, s1
  li t1, 122
  sub t0, t1, t0
  mv t1, s1
  li t2, 8
  bltu t1, t2, .L7
  li t1, 2
  j .L8
.L7:
  li t1, 0
.L8:
  sub t0, t0, t1
  sw t0, 0(sp) ; x
  ; sci/base.e16.ts:554  const on = field(first + b, 1) === 1
  add a0, s0, s1
  li a1, 1
  call field
  li t0, 1
  sub t0, a0, t0
  seqz s2, t0
  ; sci/base.e16.ts:555  for (let y: u16 = on ? 57 : 62; y <= 62; y++) {
  beqz s2, .L9
  li t0, 57
  j .L10
.L9:
  li t0, 62
.L10:
  mv s2, t0 ; on/y
  j .L13
.L11:
  ; sci/base.e16.ts:556  for (let dx: u16 = 0; dx < 5; dx++) dot(x + dx, y)
  li s3, 0 ; dx
  j .L17
.L15:
  ; sci/base.e16.ts:556  dot(x + dx, y)
  lw t0, 0(sp) ; x
  add a0, t0, s3
  mv a1, s2
  call dot
  addi s3, s3, 1
.L17:
  li t0, 5
  bltu s3, t0, .L15
  addi s2, s2, 1
.L13:
  li t0, 62
  bgeu t0, s2, .L11
  addi s1, s1, 1
.L5:
  li t0, 16
  bltu s1, t0, .L3
.return:
  lw ra, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  addi sp, sp, 12
  ret

str_181:
  .byte 70, 85, 78, 67, 0
str_182:
  .byte 49, 47, 50, 0
str_183:
  .byte 50, 47, 50, 0
str_184:
  .byte 49, 58, 72, 69, 88, 32, 50, 58, 68, 69, 67, 32, 51, 58, 79, 67, 84, 0
str_185:
  .byte 52, 58, 66, 73, 78, 32, 53, 58, 80, 69, 78, 0
str_186:
  .byte 49, 58, 65, 78, 68, 32, 50, 58, 79, 82, 32, 51, 58, 88, 79, 82, 0
str_187:
  .byte 52, 58, 88, 78, 79, 82, 32, 53, 58, 110, 111, 116, 40, 32, 54, 58, 110, 101, 103, 40, 0
str_188:
  .byte 141, 142, 58, 80, 65, 71, 69, 32, 65, 67, 58, 66, 65, 67, 75, 0
str_189:
  .byte 66, 65, 83, 69, 32, 51, 50, 0
str_190:
  .byte 72, 69, 88, 0
str_191:
  .byte 68, 69, 67, 0
str_192:
  .byte 79, 67, 84, 0
str_193:
  .byte 80, 69, 78, 0
str_194:
  .byte 66, 73, 78, 0
str_195:
  .byte 66, 73, 78, 142, 0
str_196:
  .byte 66, 73, 78, 141, 0
  .align 2

  .bank 9
  .org 0xc000
; sci/grid.e16.ts:64 gridOpen(which, rows, cols) at -O1
;   which in s1
;   rows in s2
;   cols in s3
gridOpen:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; which
  mv s2, a1 ; rows
  mv s3, a2 ; cols
  ; sci/grid.e16.ts:65  gridKind = which
  sw s1, 0x085e(zero)
  ; sci/grid.e16.ts:66  gridRows = rows
  sw s2, 0x0860(zero)
  ; sci/grid.e16.ts:67  gridCols = which === GRID_STATS ? statsCols() : cols
  bne s1, zero, .L1
  call statsCols
  mv t0, a0
  j .L2
.L1:
  mv t0, s3
.L2:
  sw t0, 0x0862(zero)
  ; sci/grid.e16.ts:68  row = 0
  sw zero, 0x0864(zero)
  ; sci/grid.e16.ts:69  col = 0
  sw zero, 0x0866(zero)
  ; sci/grid.e16.ts:70  firstRow = 0
  sw zero, 0x0868(zero)
  ; sci/grid.e16.ts:71  cellLength = 0
  sw zero, 0x088a(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/grid.e16.ts:75 statsCols() at -O1
;   n in a0
statsCols:
  ; sci/grid.e16.ts:76  let n: u16 = 1
  li a0, 1 ; n
  ; sci/grid.e16.ts:77  if (peek(STATS_TYPE) !== 0) n++
  lbu t0, 5636(zero)
  beq t0, zero, .L1
  ; sci/grid.e16.ts:77  n++
  addi a0, a0, 1
.L1:
  ; sci/grid.e16.ts:78  if (peek(STATS_FREQ) !== 0) n++
  lbu t0, 5637(zero)
  beq t0, zero, .L2
  ; sci/grid.e16.ts:78  n++
  addi a0, a0, 1
.L2:
  ; sci/grid.e16.ts:79  return n
.return:
  ret

; sci/grid.e16.ts:83 gridRow() at -O1
gridRow:
  ; sci/grid.e16.ts:84  return row
  lw a0, 0x0864(zero)
.return:
  ret

; sci/grid.e16.ts:88 rowsNow() at -O1
;   n in a0
rowsNow:
  ; sci/grid.e16.ts:89  if (gridKind !== GRID_STATS) return gridRows
  lw t0, 0x085e(zero)
  beq t0, zero, .L1
  ; sci/grid.e16.ts:89  return gridRows
  lw a0, 0x0860(zero)
  ret
.L1:
  ; sci/grid.e16.ts:90  const n = peek16(STATS_COUNT)
  lw a0, 5634(zero)
  ; sci/grid.e16.ts:91  return n < STATS_ROWS ? n + 1 : n
  li t0, 40
  bgeu a0, t0, .L2
  addi t0, a0, 1
  j .L3
.L2:
  mv t0, a0
.L3:
  mv a0, t0
.return:
  ret

; sci/grid.e16.ts:95 dataColumn(c) at -O1
;   c in a0
dataColumn:
  ; sci/grid.e16.ts:96  if (c === 0) return 0
  bne a0, zero, .L1
  ; sci/grid.e16.ts:96  return 0
  li a0, 0
  ret
.L1:
  ; sci/grid.e16.ts:97  if (c === 1 && peek(STATS_TYPE) !== 0) return 1
  li t0, 1
  bne a0, t0, .L2
  lbu t0, 5636(zero)
  beq t0, zero, .L2
  ; sci/grid.e16.ts:97  return 1
  li a0, 1
  ret
.L2:
  ; sci/grid.e16.ts:98  return 2
  li a0, 2
.return:
  ret

; sci/grid.e16.ts:102 cellAt(r, c) at -O1
;   r in s1
;   c in s2
cellAt:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; r
  mv s2, a1 ; c
  ; sci/grid.e16.ts:103  if (gridKind === GRID_STATS) return STATS_DATA + (r * 3 + dataColumn(c)) * 8
  lw t0, 0x085e(zero)
  bne t0, zero, .L1
  ; sci/grid.e16.ts:103  return STATS_DATA + (r * 3 + dataColumn(c)) * 8
  slli t1, s1, 1
  add t0, t1, s1
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s2
  call dataColumn
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  slli t0, t0, 3
  addi a0, t0, 5648
  j .return
.L1:
  ; sci/grid.e16.ts:104  return EQN_COEFFS + (r * gridCols + c) * VALUE_SIZE
  lw t0, 0x0862(zero)
  mul t0, s1, t0
  add t0, t0, s2
  slli t1, t0, 5
  slli t0, t0, 2
  add t0, t0, t1
  addi a0, t0, 7488
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/grid.e16.ts:108 edge(c) at -O1
;   c in a0
edge:
  ; sci/grid.e16.ts:109  return INDEX_WIDTH + div(c * (128 - INDEX_WIDTH), gridCols)
  li t0, 115
  mul t0, a0, t0
  lw t1, 0x0862(zero)
  divu t0, t0, t1
  addi a0, t0, 13
.return:
  ret

; sci/grid.e16.ts:115 gridKey(k/t, shift) at -O1
;   k/t in s1
;   shift in s2
gridKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/t
  mv s2, a1 ; shift
  ; sci/grid.e16.ts:116  if (k === K_AC || k === K_DEL) return clearKey(k === K_AC)
  li t0, 5
  beq s1, t0, .L2
  li t0, 14
  bne s1, t0, .L1
.L2:
  ; sci/grid.e16.ts:116  return clearKey(k === K_AC)
  li t0, 5
  sub t0, s1, t0
  seqz a0, t0
  call clearKey
  j .return
.L1:
  ; sci/grid.e16.ts:117  if (k === K_EQ) {
  li t0, 4
  bne s1, t0, .L3
  ; sci/grid.e16.ts:118  if (cellLength === 0) return GRID_DONE
  lw t0, 0x088a(zero)
  bne t0, zero, .L4
  ; sci/grid.e16.ts:118  return GRID_DONE
  li a0, 1
  j .return
.L4:
  ; sci/grid.e16.ts:119  commit()
  call commit
  ; sci/grid.e16.ts:120  advance()
  call advance
  ; sci/grid.e16.ts:121  return GRID_STAY
  li a0, 0
  j .return
.L3:
  ; sci/grid.e16.ts:123  if (k === K_UP || k === K_DOWN || k === K_LEFT || k === K_RIGHT) {
  beq s1, zero, .L6
  li t0, 1
  beq s1, t0, .L6
  li t0, 2
  beq s1, t0, .L6
  li t0, 3
  bne s1, t0, .L5
.L6:
  ; sci/grid.e16.ts:124  if (cellLength > 0) commit()
  lw t0, 0x088a(zero)
  bgeu zero, t0, .L7
  ; sci/grid.e16.ts:124  commit()
  call commit
.L7:
  ; sci/grid.e16.ts:125  move(k)
  mv a0, s1
  call move
  ; sci/grid.e16.ts:126  return GRID_STAY
  li a0, 0
  j .return
.L5:
  ; sci/grid.e16.ts:128  const t = tokenOf(k, shift)
  mv a0, s1
  mv a1, s2
  call tokenOf
  mv s1, a0 ; k/t
  ; sci/grid.e16.ts:129  if (t === 0 || cellLength >= 32) refuse()
  beq s1, zero, .L9
  lw t0, 0x088a(zero)
  li t1, 32
  bltu t0, t1, .L8
.L9:
  ; sci/grid.e16.ts:129  refuse()
  call refuse
  j .L10
.L8:
  ; sci/grid.e16.ts:131  cellEntry[cellLength] = t
  lw t0, 0x088a(zero)
  sb s1, cellEntry(t0)
  ; sci/grid.e16.ts:132  cellLength++
  lw t0, 0x088a(zero)
  addi t0, t0, 1
  sw t0, 0x088a(zero)
.L10:
  ; sci/grid.e16.ts:134  return GRID_STAY
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/grid.e16.ts:138 clearKey(all) at -O1
;   all in s1
clearKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; all
  ; sci/grid.e16.ts:139  if (all) {
  beqz s1, .L1
  ; sci/grid.e16.ts:140  if (cellLength === 0) return GRID_AC
  lw t0, 0x088a(zero)
  bne t0, zero, .L2
  ; sci/grid.e16.ts:140  return GRID_AC
  li a0, 2
  j .return
.L2:
  ; sci/grid.e16.ts:141  cellLength = 0
  sw zero, 0x088a(zero)
  j .L3
.L1:
  ; sci/grid.e16.ts:142  if (cellLength > 0) cellLength--
  lw t0, 0x088a(zero)
  bgeu zero, t0, .L4
  ; sci/grid.e16.ts:142  cellLength--
  lw t0, 0x088a(zero)
  addi t0, t0, -1
  sw t0, 0x088a(zero)
  j .L5
.L4:
  ; sci/grid.e16.ts:143  refuse()
  call refuse
.L5:
.L3:
  ; sci/grid.e16.ts:144  return GRID_STAY
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/grid.e16.ts:147 move(k) at -O1
;   k in s1
move:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/grid.e16.ts:148  if (k === K_UP && row > 0) row--
  bne s1, zero, .L1
  lw t0, 0x0864(zero)
  bgeu zero, t0, .L1
  ; sci/grid.e16.ts:148  row--
  lw t0, 0x0864(zero)
  addi t0, t0, -1
  sw t0, 0x0864(zero)
  j .L2
.L1:
  ; sci/grid.e16.ts:149  if (k === K_DOWN && row + 1 < rowsNow()) row++
  li t0, 1
  bne s1, t0, .L3
  lw t0, 0x0864(zero)
  addi t0, t0, 1
  addi sp, sp, -2
  sw t0, 0(sp)
  call rowsNow
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu t0, a0, .L3
  ; sci/grid.e16.ts:149  row++
  lw t0, 0x0864(zero)
  addi t0, t0, 1
  sw t0, 0x0864(zero)
  j .L4
.L3:
  ; sci/grid.e16.ts:150  if (k === K_LEFT && col > 0) col--
  li t0, 2
  bne s1, t0, .L5
  lw t0, 0x0866(zero)
  bgeu zero, t0, .L5
  ; sci/grid.e16.ts:150  col--
  lw t0, 0x0866(zero)
  addi t0, t0, -1
  sw t0, 0x0866(zero)
  j .L6
.L5:
  ; sci/grid.e16.ts:151  if (k === K_RIGHT && col + 1 < gridCols) col++
  li t0, 3
  bne s1, t0, .L7
  lw t0, 0x0866(zero)
  lw t1, 0x0862(zero)
  addi t0, t0, 1
  bgeu t0, t1, .L7
  ; sci/grid.e16.ts:151  col++
  lw t0, 0x0866(zero)
  addi t0, t0, 1
  sw t0, 0x0866(zero)
  j .L8
.L7:
  ; sci/grid.e16.ts:152  refuse()
  call refuse
.L8:
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/grid.e16.ts:156 advance() at -O1
advance:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/grid.e16.ts:157  if (gridKind === GRID_STATS) {
  lw t0, 0x085e(zero)
  bne t0, zero, .L1
  ; sci/grid.e16.ts:158  if (row + 1 < rowsNow()) row++
  lw t0, 0x0864(zero)
  addi t0, t0, 1
  addi sp, sp, -2
  sw t0, 0(sp)
  call rowsNow
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu t0, a0, .L3
  ; sci/grid.e16.ts:158  row++
  lw t0, 0x0864(zero)
  addi t0, t0, 1
  sw t0, 0x0864(zero)
  j .L3
.L1:
  ; sci/grid.e16.ts:159  if (col + 1 < gridCols) col++
  lw t0, 0x0866(zero)
  lw t1, 0x0862(zero)
  addi t0, t0, 1
  bgeu t0, t1, .L4
  ; sci/grid.e16.ts:159  col++
  lw t0, 0x0866(zero)
  addi t0, t0, 1
  sw t0, 0x0866(zero)
  j .L5
.L4:
  ; sci/grid.e16.ts:160  if (row + 1 < gridRows) {
  lw t0, 0x0864(zero)
  lw t1, 0x0860(zero)
  addi t0, t0, 1
  bgeu t0, t1, .L6
  ; sci/grid.e16.ts:161  row++
  lw t0, 0x0864(zero)
  addi t0, t0, 1
  sw t0, 0x0864(zero)
  ; sci/grid.e16.ts:162  col = 0
  sw zero, 0x0866(zero)
.L6:
.L5:
.L3:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/grid.e16.ts:167 commit() at -O1
;   count in s1
commit:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/grid.e16.ts:168  clearStack()
  call clearStack
  ; sci/grid.e16.ts:169  evaluate(addr(cellEntry), cellLength)
  lw a1, 0x088a(zero)
  la a0, cellEntry
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/grid.e16.ts:170  cellLength = 0
  sw zero, 0x088a(zero)
  ; sci/grid.e16.ts:171  if (gridKind !== GRID_STATS) {
  lw t0, 0x085e(zero)
  beq t0, zero, .L1
  ; sci/grid.e16.ts:172  copyValue(top(), cellAt(row, col))
  call top
  lw t0, 0x0864(zero)
  lw a1, 0x0866(zero)
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, t0
  call cellAt
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copyValue
  ; sci/grid.e16.ts:173  return
  j .return
.L1:
  ; sci/grid.e16.ts:175  const count = peek16(STATS_COUNT)
  lw s1, 5634(zero)
  ; sci/grid.e16.ts:176  if (row === count) newRow(row)
  lw t0, 0x0864(zero)
  bne t0, s1, .L2
  ; sci/grid.e16.ts:176  newRow(row)
  lw a0, 0x0864(zero)
  call newRow
.L2:
  ; sci/grid.e16.ts:177  copy8(top(), cellAt(row, col))
  call top
  lw t0, 0x0864(zero)
  lw a1, 0x0866(zero)
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, t0
  call cellAt
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/grid.e16.ts:183 newRow(r/at) at -O1
;   r/at in s2
;   count in s3
;   i in s1
newRow:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; r/at
  ; sci/grid.e16.ts:184  const count = peek16(STATS_COUNT)
  lw s3, 5634(zero)
  ; sci/grid.e16.ts:185  if (count >= STATS_ROWS) {
  li t0, 40
  bltu s3, t0, .L1
  ; sci/grid.e16.ts:186  refuse()
  call refuse
  ; sci/grid.e16.ts:187  return
  j .return
.L1:
  ; sci/grid.e16.ts:189  const at = STATS_DATA + r * 24
  slli t1, s2, 4
  slli t0, s2, 3
  add t0, t0, t1
  addi s2, t0, 5648
  ; sci/grid.e16.ts:190  for (let i = STATS_DATA + count * 24 + 23; i >= at + 24; i--) poke(i, peek(i - 24))
  slli t1, s3, 4
  slli t0, s3, 3
  add t0, t0, t1
  addi s1, t0, 5671
  j .L4
.L2:
  ; sci/grid.e16.ts:190  poke(i, peek(i - 24))
  lbu t0, -24(s1)
  sb t0, 0(s1)
  addi s1, s1, -1
.L4:
  addi t0, s2, 24
  bgeu s1, t0, .L2
  ; sci/grid.e16.ts:191  for (let i: u16 = 0; i < 24; i++) poke(at + i, 0)
  li s1, 0 ; i
  j .L8
.L6:
  ; sci/grid.e16.ts:191  poke(at + i, 0)
  add t0, s2, s1
  sb zero, 0(t0)
  addi s1, s1, 1
.L8:
  li t0, 24
  bltu s1, t0, .L6
  ; sci/grid.e16.ts:193  poke(at + 18, 0x10)
  li t0, 16
  sb t0, 18(s2)
  ; sci/grid.e16.ts:194  poke16(STATS_COUNT, count + 1)
  addi t0, s3, 1
  sw t0, 5634(zero)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/grid.e16.ts:198 deleteRow() at -O1
;   count in s2
;   at/i in s1
deleteRow:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; sci/grid.e16.ts:199  const count = peek16(STATS_COUNT)
  lw s2, 5634(zero)
  ; sci/grid.e16.ts:200  if (row >= count) {
  lw t0, 0x0864(zero)
  bltu t0, s2, .L1
  ; sci/grid.e16.ts:201  refuse()
  call refuse
  ; sci/grid.e16.ts:202  return
  j .return
.L1:
  ; sci/grid.e16.ts:204  const at = STATS_DATA + row * 24
  lw t0, 0x0864(zero)
  slli t1, t0, 4
  slli t0, t0, 3
  add t0, t0, t1
  addi s1, t0, 5648
  ; sci/grid.e16.ts:205  for (let i = at; i < STATS_DATA + (count - 1) * 24; i++) poke(i, peek(i + 24))
  j .L4
.L2:
  ; sci/grid.e16.ts:205  poke(i, peek(i + 24))
  lbu t0, 24(s1)
  sb t0, 0(s1)
  addi s1, s1, 1
.L4:
  addi t0, s2, -1
  slli t1, t0, 4
  slli t0, t0, 3
  add t0, t0, t1
  addi t0, t0, 5648
  bltu s1, t0, .L2
  ; sci/grid.e16.ts:206  poke16(STATS_COUNT, count - 1)
  addi t0, s2, -1
  sw t0, 5634(zero)
  ; sci/grid.e16.ts:207  if (row > 0 && row >= count - 1) row--
  lw t0, 0x0864(zero)
  bgeu zero, t0, .L6
  lw t0, 0x0864(zero)
  addi t1, s2, -1
  bltu t0, t1, .L6
  ; sci/grid.e16.ts:207  row--
  lw t0, 0x0864(zero)
  addi t0, t0, -1
  sw t0, 0x0864(zero)
.L6:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/grid.e16.ts:211 clearRows() at -O1
clearRows:
  ; sci/grid.e16.ts:212  poke16(STATS_COUNT, 0)
  sw zero, 5634(zero)
  ; sci/grid.e16.ts:213  row = 0
  sw zero, 0x0864(zero)
  ; sci/grid.e16.ts:214  firstRow = 0
  sw zero, 0x0868(zero)
.return:
  ret

; sci/grid.e16.ts:220 gridDraw() at -O1
;   c/x/count in s1
;   y/k in s2
gridDraw:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/grid.e16.ts:221  if (row < firstRow) firstRow = row
  lw t0, 0x0864(zero)
  lw t1, 0x0868(zero)
  bgeu t0, t1, .L1
  ; sci/grid.e16.ts:221  firstRow = row
  lw t0, 0x0864(zero)
  sw t0, 0x0868(zero)
.L1:
  ; sci/grid.e16.ts:222  if (row >= firstRow + SHOWN_ROWS) firstRow = row - SHOWN_ROWS + 1
  lw t0, 0x0864(zero)
  lw t1, 0x0868(zero)
  addi t1, t1, 5
  bltu t0, t1, .L2
  ; sci/grid.e16.ts:222  firstRow = row - SHOWN_ROWS + 1
  lw t0, 0x0864(zero)
  addi t0, t0, -4
  sw t0, 0x0868(zero)
.L2:
  ; sci/grid.e16.ts:223  for (let c: u16 = 0; c < gridCols; c++) head(c)
  li s1, 0 ; c/x/count
  j .L5
.L3:
  ; sci/grid.e16.ts:223  head(c)
  mv a0, s1
  call head
  addi s1, s1, 1
.L5:
  lw t0, 0x0862(zero)
  bltu s1, t0, .L3
  ; sci/grid.e16.ts:224  for (let x: u16 = 0; x < 128; x++) dot(x, 19)
  li s1, 0 ; c/x/count
  j .L9
.L7:
  ; sci/grid.e16.ts:224  dot(x, 19)
  mv a0, s1
  li a1, 19
  call dot
  addi s1, s1, 1
.L9:
  li t0, 128
  bltu s1, t0, .L7
  ; sci/grid.e16.ts:225  for (let c: u16 = 0; c < gridCols; c++) {
  li s1, 0 ; c/x/count
  j .L13
.L11:
  ; sci/grid.e16.ts:226  for (let y: u16 = 10; y < 64; y++) dot(edge(c), y)
  li s2, 10 ; y/k
  j .L17
.L15:
  ; sci/grid.e16.ts:226  dot(edge(c), y)
  mv a0, s1
  call edge
  mv a1, s2
  call dot
  addi s2, s2, 1
.L17:
  li t0, 64
  bltu s2, t0, .L15
  addi s1, s1, 1
.L13:
  lw t0, 0x0862(zero)
  bltu s1, t0, .L11
  ; sci/grid.e16.ts:228  const count = rowsNow()
  call rowsNow
  mv s1, a0 ; c/x/count
  ; sci/grid.e16.ts:229  for (let k: u16 = 0; k < SHOWN_ROWS && firstRow + k < count; k++)
  li s2, 0 ; y/k
  j .L21
.L19:
  ; sci/grid.e16.ts:230  drawRow(firstRow + k, 21 + 9 * k)
  lw t0, 0x0868(zero)
  add a0, t0, s2
  li t1, 9
  mul t1, t1, s2
  addi a1, t1, 21
  call drawRow
  addi s2, s2, 1
.L21:
  li t0, 5
  bgeu s2, t0, .L23
  lw t0, 0x0868(zero)
  add t0, t0, s2
  bltu t0, s1, .L19
.L23:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/grid.e16.ts:234 head(c/name) at -O1
;   c/name in s1
;   left/x in s2
;   right in s3
;   width in s0
head:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; c/name
  ; sci/grid.e16.ts:235  const left = edge(c)
  mv a0, s1
  call edge
  mv s2, a0 ; left/x
  ; sci/grid.e16.ts:236  const right = c + 1 < gridCols ? edge(c + 1) : 128
  lw t0, 0x0862(zero)
  addi t1, s1, 1
  bgeu t1, t0, .L1
  addi a0, s1, 1
  call edge
  mv t0, a0
  j .L2
.L1:
  li t0, 128
.L2:
  mv s3, t0 ; right
  ; sci/grid.e16.ts:237  const name = headOf(c)
  mv a0, s1
  call headOf
  mv s1, a0 ; c/name
  ; sci/grid.e16.ts:238  const width = name === 0x46 ? 24 : 6
  li t0, 70
  bne s1, t0, .L3
  li t0, 24
  j .L4
.L3:
  li t0, 6
.L4:
  mv s0, t0 ; width
  ; sci/grid.e16.ts:239  const x = left + ((right - left - width) >> 1)
  sub t0, s3, s2
  sub t0, t0, s0
  srli t0, t0, 1
  add s2, s2, t0
  ; sci/grid.e16.ts:240  if (name === 0x46) textAt(freqName(), x, lineY(0))
  li t0, 70
  bne s1, t0, .L5
  ; sci/grid.e16.ts:240  textAt(freqName(), x, lineY(0))
  call freqName
  mv a1, s2
  li a2, 11
  call textAt
  j .L6
.L5:
  ; sci/grid.e16.ts:241  glyphAt(name, x, lineY(0))
  mv a0, s1
  mv a1, s2
  li a2, 11
  call glyphAt
.L6:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/grid.e16.ts:246 freqName() at -O1
freqName:
  ; sci/grid.e16.ts:247  freqText[0] = 0x46
  li t0, 70
  sb t0, freqText(zero)
  ; sci/grid.e16.ts:248  freqText[1] = 0x52
  li t0, 82
  sb t0, freqText+1(zero)
  ; sci/grid.e16.ts:249  freqText[2] = 0x45
  li t0, 69
  sb t0, freqText+2(zero)
  ; sci/grid.e16.ts:250  freqText[3] = 0x51
  li t0, 81
  sb t0, freqText+3(zero)
  ; sci/grid.e16.ts:251  freqText[4] = 0
  sb zero, freqText+4(zero)
  ; sci/grid.e16.ts:252  return addr(freqText)
  la a0, freqText
.return:
  ret

; sci/grid.e16.ts:256 headOf(c/d) at -O1
;   c/d in s1
headOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c/d
  ; sci/grid.e16.ts:257  if (gridKind !== GRID_STATS) return 0x61 + c
  lw t0, 0x085e(zero)
  beq t0, zero, .L1
  ; sci/grid.e16.ts:257  return 0x61 + c
  addi a0, s1, 97
  j .return
.L1:
  ; sci/grid.e16.ts:258  const d = dataColumn(c)
  mv a0, s1
  call dataColumn
  mv s1, a0 ; c/d
  ; sci/grid.e16.ts:259  return d === 0 ? 0x58 : d === 1 ? 0x59 : 0x46
  bne s1, zero, .L2
  li t0, 88
  j .L3
.L2:
  li t0, 1
  bne s1, t0, .L4
  li t0, 89
  j .L5
.L4:
  li t0, 70
.L5:
.L3:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/grid.e16.ts:263 drawRow(r, y) at -O1
;   r in s3
;   y in s2
;   filled in 2(sp)
;   c in s1
;   right in s0
;   chosen in 0(sp)
drawRow:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s2, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv s3, a0 ; r
  mv s2, a1 ; y
  ; sci/grid.e16.ts:264  rowNumber(r + 1)
  addi a0, s3, 1
  call rowNumber
  ; sci/grid.e16.ts:265  textAt(addr(cellText), 1, y)
  la a0, cellText
  li a1, 1
  mv a2, s2
  call textAt
  ; sci/grid.e16.ts:266  const filled = gridKind !== GRID_STATS || r < peek16(STATS_COUNT)
  lw t0, 0x085e(zero)
  sub t0, t0, zero
  snez t0, t0
  mv t1, t0
  bnez t1, .L1
  lw t0, 5634(zero)
  sltu t0, s3, t0
.L1:
  sw t0, 2(sp) ; filled
  ; sci/grid.e16.ts:267  for (let c: u16 = 0; c < gridCols; c++) {
  li s1, 0 ; c
  j .L4
.L2:
  ; sci/grid.e16.ts:268  const right = c + 1 < gridCols ? edge(c + 1) : 128
  lw t0, 0x0862(zero)
  addi t1, s1, 1
  bgeu t1, t0, .L6
  addi a0, s1, 1
  call edge
  mv t0, a0
  j .L7
.L6:
  li t0, 128
.L7:
  mv s0, t0 ; right
  ; sci/grid.e16.ts:269  const chosen = r === row && c === col
  lw t0, 0x0864(zero)
  sub t0, s3, t0
  seqz t0, t0
  mv t1, t0
  beqz t1, .L8
  lw t0, 0x0866(zero)
  sub t0, s1, t0
  seqz t0, t0
.L8:
  sw t0, 0(sp) ; chosen
  ; sci/grid.e16.ts:270  if (chosen && cellLength > 0) entryText(right, y)
  lw t0, 0(sp) ; chosen
  beqz t0, .L9
  lw t0, 0x088a(zero)
  bgeu zero, t0, .L9
  ; sci/grid.e16.ts:270  entryText(right, y)
  mv a0, s0
  mv a1, s2
  call entryText
  j .L10
.L9:
  ; sci/grid.e16.ts:271  if (filled) cellValue(cellAt(r, c), right, y)
  lw t0, 2(sp) ; filled
  beqz t0, .L11
  ; sci/grid.e16.ts:271  cellValue(cellAt(r, c), right, y)
  mv a0, s3
  mv a1, s1
  call cellAt
  mv a1, s0
  mv a2, s2
  call cellValue
.L11:
.L10:
  ; sci/grid.e16.ts:272  if (chosen) invertBox(edge(c) + 1, y - 1, right - 1, y + 7)
  lw t0, 0(sp) ; chosen
  beqz t0, .L12
  ; sci/grid.e16.ts:272  invertBox(edge(c) + 1, y - 1, right - 1, y + 7)
  mv a0, s1
  call edge
  addi a0, a0, 1
  addi a1, s2, -1
  addi a2, s0, -1
  addi a3, s2, 7
  call invertBox
.L12:
  addi s1, s1, 1
.L4:
  lw t0, 0x0862(zero)
  bltu s1, t0, .L2
.return:
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; sci/grid.e16.ts:276 rowNumber(n) at -O1
;   n in a0
;   i in a1
rowNumber:
  ; sci/grid.e16.ts:277  let i: u16 = 0
  li a1, 0 ; i
  ; sci/grid.e16.ts:278  if (n >= 10) {
  li t0, 10
  bltu a0, t0, .L1
  ; sci/grid.e16.ts:279  cellText[0] = 0x30 + div(n, 10)
  li t1, 52429
  mulhu t0, a0, t1
  srli t0, t0, 3
  addi t0, t0, 48
  sb t0, cellText(zero)
  ; sci/grid.e16.ts:280  i = 1
  li a1, 1 ; i
.L1:
  ; sci/grid.e16.ts:282  cellText[i] = 0x30 + (n % 10)
  li t1, 52429
  mulhu t0, a0, t1
  srli t0, t0, 3
  li t1, 10
  mul t0, t0, t1
  sub t0, a0, t0
  addi t0, t0, 48
  sb t0, cellText(a1)
  ; sci/grid.e16.ts:283  cellText[i + 1] = 0
  sb zero, cellText+1(a1)
.return:
  ret

; sci/grid.e16.ts:287 cellValue(v, right, y) at -O1
;   v in 0(sp)
;   right in s3
;   y in 2(sp)
;   room in s0
;   digits in s1
;   length in s2
cellValue:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw a0, 0(sp) ; v
  mv s3, a1 ; right
  sw a2, 2(sp) ; y
  ; sci/grid.e16.ts:288  const room = div(right - 3 - edgeLeft(right), 6)
  mv a0, s3
  call edgeLeft
  addi t0, s3, -3
  sub t0, t0, a0
  li t1, 43691
  mulhu t0, t0, t1
  srli s0, t0, 2
  ; sci/grid.e16.ts:289  let digits = room
  mv s1, s0 ; digits
  ; sci/grid.e16.ts:290  if (digits > 10) digits = 10
  li t0, 10
  bgeu t0, s1, .L1
  ; sci/grid.e16.ts:290  digits = 10
  li s1, 10 ; digits
.L1:
  ; sci/grid.e16.ts:291  let length: u16 = 99
  li s2, 99 ; length
  ; sci/grid.e16.ts:293  while (length > room && digits > 0) {
  j .L4
.L2:
  ; sci/grid.e16.ts:294  poke16(MATH_ARG, digits)
  li t0, 65366
  sw s1, 0(t0)
  ; sci/grid.e16.ts:295  math(M_FORMAT, v, addr(cellText), 0)
  li a0, 57
  lw a1, 0(sp)
  la a2, cellText
  li a3, 0
  call math
  ; sci/grid.e16.ts:296  length = peek16(MATH_ARG)
  li t0, 65366
  lw s2, 0(t0)
  ; sci/grid.e16.ts:297  digits--
  addi s1, s1, -1
.L4:
  bgeu s0, s2, .L6
  bltu zero, s1, .L2
.L6:
  ; sci/grid.e16.ts:299  cellText[length] = 0
  sb zero, cellText(s2)
  ; sci/grid.e16.ts:300  textAt(addr(cellText), right - 1 - length * 6, y)
  slli t1, s2, 2
  slli t0, s2, 1
  add t0, t0, t1
  addi t1, s3, -1
  sub a1, t1, t0
  la a0, cellText
  lw a2, 2(sp)
  call textAt
.return:
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  addi sp, sp, 14
  ret

; sci/grid.e16.ts:304 edgeLeft(right) at -O1
;   right in s2
;   c in s1
;   r in s3
edgeLeft:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; right
  ; sci/grid.e16.ts:305  for (let c: u16 = 0; c < gridCols; c++) {
  li s1, 0 ; c
  j .L3
.L1:
  ; sci/grid.e16.ts:306  const r = c + 1 < gridCols ? edge(c + 1) : 128
  lw t0, 0x0862(zero)
  addi t1, s1, 1
  bgeu t1, t0, .L5
  addi a0, s1, 1
  call edge
  mv t0, a0
  j .L6
.L5:
  li t0, 128
.L6:
  mv s3, t0 ; r
  ; sci/grid.e16.ts:307  if (r === right) return edge(c)
  bne s3, s2, .L7
  ; sci/grid.e16.ts:307  return edge(c)
  mv a0, s1
  call edge
  j .return
.L7:
  addi s1, s1, 1
.L3:
  lw t0, 0x0862(zero)
  bltu s1, t0, .L1
  ; sci/grid.e16.ts:309  return INDEX_WIDTH
  li a0, 13
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/grid.e16.ts:313 entryText(right, y) at -O1
;   right in s3
;   y in s0
;   n in s2
;   i/room/from in s1
entryText:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  mv s3, a0 ; right
  mv s0, a1 ; y
  ; sci/grid.e16.ts:314  let n: u16 = 0
  li s2, 0 ; n
  ; sci/grid.e16.ts:315  for (let i: u16 = 0; i < cellLength && n < 23; i++) n = charsInto(cellEntry[i], n)
  li s1, 0 ; i/room/from
  j .L3
.L1:
  ; sci/grid.e16.ts:315  n = charsInto(cellEntry[i], n)
  lbu a0, cellEntry(s1)
  mv a1, s2
  call charsInto
  mv s2, a0 ; n
  addi s1, s1, 1
.L3:
  lw t0, 0x088a(zero)
  bgeu s1, t0, .L5
  li t0, 23
  bltu s2, t0, .L1
.L5:
  ; sci/grid.e16.ts:316  const room = div(right - 2 - edgeLeft(right), 6)
  mv a0, s3
  call edgeLeft
  addi t0, s3, -2
  sub t0, t0, a0
  li t1, 43691
  mulhu t0, t0, t1
  srli s1, t0, 2
  ; sci/grid.e16.ts:317  const from = n > room ? n - room : 0
  bgeu s1, s2, .L6
  sub t0, s2, s1
  j .L7
.L6:
  li t0, 0
.L7:
  mv s1, t0 ; i/room/from
  ; sci/grid.e16.ts:318  cellText[n] = 0
  sb zero, cellText(s2)
  ; sci/grid.e16.ts:319  textAt(addr(cellText) + from, right - 1 - (n - from) * 6, y)
  sub t0, s2, s1
  slli t1, t0, 2
  slli t0, t0, 1
  add t0, t0, t1
  addi t1, s3, -1
  sub a1, t1, t0
  addi a0, s1, cellText
  mv a2, s0
  call textAt
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/grid.e16.ts:322 charsInto(t, n/k) at -O1
;   t in s3
;   n/k in s1
;   s/p in s2
charsInto:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; t
  mv s1, a1 ; n/k
  ; sci/grid.e16.ts:323  const s = tokenText(t)
  mv a0, s3
  call tokenText
  mv s2, a0 ; s/p
  ; sci/grid.e16.ts:324  if (s === 0) {
  bne s2, zero, .L1
  ; sci/grid.e16.ts:325  cellText[n] = t
  sb s3, cellText(s1)
  ; sci/grid.e16.ts:326  return n + 1
  addi a0, s1, 1
  j .return
.L1:
  ; sci/grid.e16.ts:328  let k = n
  ; sci/grid.e16.ts:329  let p = s
  ; sci/grid.e16.ts:330  while (peek(p) !== 0 && k < 23) {
  j .L4
.L2:
  ; sci/grid.e16.ts:331  cellText[k] = peek(p)
  lbu t0, 0(s2)
  sb t0, cellText(s1)
  ; sci/grid.e16.ts:332  k++
  addi s1, s1, 1
  ; sci/grid.e16.ts:333  p++
  addi s2, s2, 1
.L4:
  lbu t0, 0(s2)
  beq t0, zero, .L6
  li t0, 23
  bltu s1, t0, .L2
.L6:
  ; sci/grid.e16.ts:335  return k
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

  .align 2

  .bank 10
  .org 0xc000
; sci/table.e16.ts:60 tablePhase() at -O1
tablePhase:
  ; sci/table.e16.ts:61  return tableNow
  lw a0, 0x08aa(zero)
.return:
  ret

; sci/table.e16.ts:65 tableReset() at -O1
tableReset:
  ; sci/table.e16.ts:66  tableNow = TABLE_EDIT
  sw zero, 0x08aa(zero)
.return:
  ret

; sci/table.e16.ts:70 rangeAt(k) at -O1
;   k in a0
rangeAt:
  ; sci/table.e16.ts:71  return TABLE_RANGE + k * VALUE_SIZE
  slli t1, a0, 5
  slli t0, a0, 2
  add t0, t0, t1
  addi a0, t0, 7368
.return:
  ret

; sci/table.e16.ts:75 tableAskFrom() at -O1
tableAskFrom:
  ; sci/table.e16.ts:76  tableNow = TABLE_ASK
  li t0, 1
  sw t0, 0x08aa(zero)
  ; sci/table.e16.ts:77  rangeAsked = 0
  sw zero, 0x08ac(zero)
.return:
  ret

; sci/table.e16.ts:80 tableAsking() at -O1
tableAsking:
  ; sci/table.e16.ts:81  return rangeAsked
  lw a0, 0x08ac(zero)
.return:
  ret

; sci/table.e16.ts:85 tableNext() at -O1
tableNext:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/table.e16.ts:86  rangeAsked++
  lw t0, 0x08ac(zero)
  addi t0, t0, 1
  sw t0, 0x08ac(zero)
  ; sci/table.e16.ts:87  if (rangeAsked < 3) return true
  li t1, 3
  bgeu t0, t1, .L1
  ; sci/table.e16.ts:87  return true
  li a0, 1
  j .return
.L1:
  ; sci/table.e16.ts:88  countRows()
  call countRows
  ; sci/table.e16.ts:89  chosen = 0
  sw zero, 0x08b0(zero)
  ; sci/table.e16.ts:90  first = 0
  sw zero, 0x08b2(zero)
  ; sci/table.e16.ts:91  tableNow = TABLE_VIEW
  li t0, 2
  sw t0, 0x08aa(zero)
  ; sci/table.e16.ts:92  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/table.e16.ts:96 countRows() at -O1
;   n/count in s1
;   one in s2
countRows:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/table.e16.ts:97  if (isZero(rangeAt(2))) fail(E_RANGE, 0)
  li a0, 7440
  call isZero
  beqz a0, .L1
  ; sci/table.e16.ts:97  fail(E_RANGE, 0)
  li a0, 5
  li a1, 0
  call fail
.L1:
  ; sci/table.e16.ts:98  clearStack()
  call clearStack
  ; sci/table.e16.ts:99  const n = push(0)
  li a0, 0
  call push
  mv s1, a0 ; n/count
  ; sci/table.e16.ts:100  copyValue(rangeAt(1), n)
  li a0, 7404
  mv a1, s1
  call copyValue
  ; sci/table.e16.ts:101  math(M_SUB, n, rangeAt(0), 0)
  li a0, 2
  mv a1, s1
  li a2, 7368
  li a3, 0
  call math
  ; sci/table.e16.ts:102  math(M_DIV, n, rangeAt(2), 0)
  li a0, 4
  mv a1, s1
  li a2, 7440
  li a3, 0
  call math
  ; sci/table.e16.ts:103  if (isNegative(n)) fail(E_RANGE, 0)
  mv a0, s1
  call isNegative
  beqz a0, .L2
  ; sci/table.e16.ts:103  fail(E_RANGE, 0)
  li a0, 5
  li a1, 0
  call fail
.L2:
  ; sci/table.e16.ts:104  const one = pushInt(1, 0)
  li a0, 1
  li a1, 0
  call pushInt
  mv s2, a0 ; one
  ; sci/table.e16.ts:105  math(M_IDIV, n, one, 0)
  li a0, 8
  mv a1, s1
  mv a2, s2
  li a3, 0
  call math
  ; sci/table.e16.ts:107  math(M_TOINT, n, 0, 0)
  li a0, 49
  mv a1, s1
  li a2, 0
  li a3, 0
  call math
  ; sci/table.e16.ts:108  const count = peek16(MATH_ARG) + 1
  li t0, 65366
  lw t0, 0(t0)
  addi s1, t0, 1
  ; sci/table.e16.ts:109  pop()
  call pop
  ; sci/table.e16.ts:110  pop()
  call pop
  ; sci/table.e16.ts:111  if (count > 30) fail(E_RANGE, 0)
  li t0, 30
  bgeu t0, s1, .L3
  ; sci/table.e16.ts:111  fail(E_RANGE, 0)
  li a0, 5
  li a1, 0
  call fail
.L3:
  ; sci/table.e16.ts:112  rows = count
  sw s1, 0x08ae(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/table.e16.ts:116 tableKey(k) at -O1
;   k in s1
tableKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/table.e16.ts:117  if (k === K_UP && chosen > 0) chosen--
  bne s1, zero, .L1
  lw t0, 0x08b0(zero)
  bgeu zero, t0, .L1
  ; sci/table.e16.ts:117  chosen--
  lw t0, 0x08b0(zero)
  addi t0, t0, -1
  sw t0, 0x08b0(zero)
  j .L2
.L1:
  ; sci/table.e16.ts:118  if (k === K_DOWN && chosen + 1 < rows) chosen++
  li t0, 1
  bne s1, t0, .L3
  lw t0, 0x08b0(zero)
  lw t1, 0x08ae(zero)
  addi t0, t0, 1
  bgeu t0, t1, .L3
  ; sci/table.e16.ts:118  chosen++
  lw t0, 0x08b0(zero)
  addi t0, t0, 1
  sw t0, 0x08b0(zero)
  j .L4
.L3:
  ; sci/table.e16.ts:119  if (k === K_AC) tableNow = TABLE_EDIT
  li t0, 5
  bne s1, t0, .L5
  ; sci/table.e16.ts:119  tableNow = TABLE_EDIT
  sw zero, 0x08aa(zero)
  j .L6
.L5:
  ; sci/table.e16.ts:120  refuse()
  call refuse
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/table.e16.ts:127 tableDraw() at -O1
;   x/y/k in s1
tableDraw:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/table.e16.ts:128  cls()
  call cls
  ; sci/table.e16.ts:129  band(str('TABLE'))
  la a0, str_197
  call band
  ; sci/table.e16.ts:130  if (chosen < first) first = chosen
  lw t0, 0x08b0(zero)
  lw t1, 0x08b2(zero)
  bgeu t0, t1, .L1
  ; sci/table.e16.ts:130  first = chosen
  lw t0, 0x08b0(zero)
  sw t0, 0x08b2(zero)
.L1:
  ; sci/table.e16.ts:131  if (chosen >= first + 5) first = chosen - 4
  lw t0, 0x08b0(zero)
  lw t1, 0x08b2(zero)
  addi t1, t1, 5
  bltu t0, t1, .L2
  ; sci/table.e16.ts:131  first = chosen - 4
  lw t0, 0x08b0(zero)
  addi t0, t0, -4
  sw t0, 0x08b2(zero)
.L2:
  ; sci/table.e16.ts:132  textAt(str('X'), 33, lineY(0))
  la a0, str_198
  li a1, 33
  li a2, 11
  call textAt
  ; sci/table.e16.ts:133  textAt(str('f(X)'), 81, lineY(0))
  la a0, str_199
  li a1, 81
  li a2, 11
  call textAt
  ; sci/table.e16.ts:134  for (let x: u16 = 0; x < 128; x++) dot(x, 19)
  li s1, 0 ; x/y/k
  j .L5
.L3:
  ; sci/table.e16.ts:134  dot(x, 19)
  mv a0, s1
  li a1, 19
  call dot
  addi s1, s1, 1
.L5:
  li t0, 128
  bltu s1, t0, .L3
  ; sci/table.e16.ts:135  for (let y: u16 = 10; y < 64; y++) {
  li s1, 10 ; x/y/k
  j .L9
.L7:
  ; sci/table.e16.ts:136  dot(13, y)
  li a0, 13
  mv a1, s1
  call dot
  ; sci/table.e16.ts:137  dot(SPLIT, y)
  li a0, 58
  mv a1, s1
  call dot
  addi s1, s1, 1
.L9:
  li t0, 64
  bltu s1, t0, .L7
  ; sci/table.e16.ts:139  copyValue(varAt(VAR_X), addr(savedX))
  li a0, 3336
  la a1, savedX
  call copyValue
  ; sci/table.e16.ts:140  for (let k: u16 = 0; k < 5 && first + k < rows; k++) drawTableRow(first + k, 21 + 9 * k)
  li s1, 0 ; x/y/k
  j .L13
.L11:
  ; sci/table.e16.ts:140  drawTableRow(first + k, 21 + 9 * k)
  lw t0, 0x08b2(zero)
  add a0, t0, s1
  li t1, 9
  mul t1, t1, s1
  addi a1, t1, 21
  call drawTableRow
  addi s1, s1, 1
.L13:
  li t0, 5
  bgeu s1, t0, .L15
  lw t0, 0x08b2(zero)
  add t0, t0, s1
  lw t1, 0x08ae(zero)
  bltu t0, t1, .L11
.L15:
  ; sci/table.e16.ts:141  copyValue(addr(savedX), varAt(VAR_X))
  la a0, savedX
  li a1, 3336
  call copyValue
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/table.e16.ts:145 drawTableRow(r, y) at -O1
;   r in s3
;   y in s1
;   x in s2
drawTableRow:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; r
  mv s1, a1 ; y
  ; sci/table.e16.ts:146  numberAt(r + 1, y)
  addi a0, s3, 1
  mv a1, s1
  call numberAt
  ; sci/table.e16.ts:148  clearStack()
  call clearStack
  ; sci/table.e16.ts:149  const x = pushInt(r, 0)
  mv a0, s3
  li a1, 0
  call pushInt
  mv s2, a0 ; x
  ; sci/table.e16.ts:150  math(M_MUL, x, rangeAt(2), 0)
  li a0, 3
  mv a1, s2
  li a2, 7440
  li a3, 0
  call math
  ; sci/table.e16.ts:151  math(M_ADD, x, rangeAt(0), 0)
  li a0, 1
  mv a1, s2
  li a2, 7368
  li a3, 0
  call math
  ; sci/table.e16.ts:152  copyValue(x, varAt(VAR_X))
  mv a0, s2
  li a1, 3336
  call copyValue
  ; sci/table.e16.ts:153  fitted(x, SPLIT, y)
  mv a0, s2
  li a1, 58
  mv a2, s1
  call fitted
  ; sci/table.e16.ts:154  clearStack()
  call clearStack
  ; sci/table.e16.ts:155  evaluate(addr(line), length)
  lw a1, 0x055a(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/table.e16.ts:156  fitted(top(), 128, y)
  call top
  li a1, 128
  mv a2, s1
  call fitted
  ; sci/table.e16.ts:157  if (r === chosen) invertBox(SPLIT + 1, y - 1, 127, y + 7)
  lw t0, 0x08b0(zero)
  bne s3, t0, .L1
  ; sci/table.e16.ts:157  invertBox(SPLIT + 1, y - 1, 127, y + 7)
  li a0, 59
  addi a1, s1, -1
  li a2, 127
  addi a3, s1, 7
  call invertBox
.L1:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/table.e16.ts:160 numberAt(n, y) at -O1
;   n in s1
;   y in s3
;   i in s2
numberAt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; n
  mv s3, a1 ; y
  ; sci/table.e16.ts:161  let i: u16 = 0
  li s2, 0 ; i
  ; sci/table.e16.ts:162  if (n >= 10) {
  li t0, 10
  bltu s1, t0, .L1
  ; sci/table.e16.ts:163  tableCell[0] = 0x30 + div(n, 10)
  li t1, 52429
  mulhu t0, s1, t1
  srli t0, t0, 3
  addi t0, t0, 48
  sb t0, tableCell(zero)
  ; sci/table.e16.ts:164  i = 1
  li s2, 1 ; i
.L1:
  ; sci/table.e16.ts:166  tableCell[i] = 0x30 + (n % 10)
  li t1, 52429
  mulhu t0, s1, t1
  srli t0, t0, 3
  li t1, 10
  mul t0, t0, t1
  sub t0, s1, t0
  addi t0, t0, 48
  sb t0, tableCell(s2)
  ; sci/table.e16.ts:167  tableCell[i + 1] = 0
  sb zero, tableCell+1(s2)
  ; sci/table.e16.ts:168  textAt(addr(tableCell), 1, y)
  la a0, tableCell
  li a1, 1
  mv a2, s3
  call textAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/table.e16.ts:172 fitted(v, right, y) at -O1
;   v in 0(sp)
;   right in s3
;   y in 2(sp)
;   room in s0
;   digits in s1
;   size in s2
fitted:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw a0, 0(sp) ; v
  mv s3, a1 ; right
  sw a2, 2(sp) ; y
  ; sci/table.e16.ts:173  const room = div(right - 3 - (right === 128 ? SPLIT : 13), 6)
  addi t0, s3, -3
  mv t1, s3
  li t2, 128
  bne t1, t2, .L1
  li t1, 58
  j .L2
.L1:
  li t1, 13
.L2:
  sub t0, t0, t1
  li t1, 43691
  mulhu t0, t0, t1
  srli s0, t0, 2
  ; sci/table.e16.ts:174  let digits = room
  mv s1, s0 ; digits
  ; sci/table.e16.ts:175  if (digits > 10) digits = 10
  li t0, 10
  bgeu t0, s1, .L3
  ; sci/table.e16.ts:175  digits = 10
  li s1, 10 ; digits
.L3:
  ; sci/table.e16.ts:176  let size: u16 = 99
  li s2, 99 ; size
  ; sci/table.e16.ts:177  while (size > room && digits > 0) {
  j .L6
.L4:
  ; sci/table.e16.ts:178  poke16(MATH_ARG, digits)
  li t0, 65366
  sw s1, 0(t0)
  ; sci/table.e16.ts:179  math(M_FORMAT, v, addr(tableCell), 0)
  li a0, 57
  lw a1, 0(sp)
  la a2, tableCell
  li a3, 0
  call math
  ; sci/table.e16.ts:180  size = peek16(MATH_ARG)
  li t0, 65366
  lw s2, 0(t0)
  ; sci/table.e16.ts:181  digits--
  addi s1, s1, -1
.L6:
  bgeu s0, s2, .L8
  bltu zero, s1, .L4
.L8:
  ; sci/table.e16.ts:183  tableCell[size] = 0
  sb zero, tableCell(s2)
  ; sci/table.e16.ts:184  textAt(addr(tableCell), right - 1 - size * 6, y)
  slli t1, s2, 2
  slli t0, s2, 1
  add t0, t0, t1
  addi t1, s3, -1
  sub a1, t1, t0
  la a0, tableCell
  lw a2, 2(sp)
  call textAt
.return:
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  addi sp, sp, 14
  ret

; sci/extras.e16.ts:25 nextAngle() at -O1
;   unit in s1
nextAngle:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/extras.e16.ts:26  const unit = peek(KEEP_ANGLE)
  lbu s1, 3074(zero)
  ; sci/extras.e16.ts:27  const k = WORK
  ; sci/extras.e16.ts:28  if (unit === 0) {
  bne s1, zero, .L1
  ; sci/extras.e16.ts:29  math(M_PI, k, 0, 0)
  li a0, 32
  li a1, 9984
  li a2, 0
  li a3, 0
  call math
  ; sci/extras.e16.ts:30  math(M_MUL, KEEP_ANS, k, 0)
  li a0, 3
  li a1, 3080
  li a2, 9984
  li a3, 0
  call math
  ; sci/extras.e16.ts:31  wholeAt(k, 180)
  li a0, 9984
  li a1, 180
  call wholeAt
  ; sci/extras.e16.ts:32  math(M_DIV, KEEP_ANS, k, 0)
  li a0, 4
  li a1, 3080
  li a2, 9984
  li a3, 0
  call math
  j .L2
.L1:
  ; sci/extras.e16.ts:33  if (unit === 1) {
  li t0, 1
  bne s1, t0, .L3
  ; sci/extras.e16.ts:34  wholeAt(k, 200)
  li a0, 9984
  li a1, 200
  call wholeAt
  ; sci/extras.e16.ts:35  math(M_MUL, KEEP_ANS, k, 0)
  li a0, 3
  li a1, 3080
  li a2, 9984
  li a3, 0
  call math
  ; sci/extras.e16.ts:36  math(M_PI, k, 0, 0)
  li a0, 32
  li a1, 9984
  li a2, 0
  li a3, 0
  call math
  ; sci/extras.e16.ts:37  math(M_DIV, KEEP_ANS, k, 0)
  li a0, 4
  li a1, 3080
  li a2, 9984
  li a3, 0
  call math
  j .L4
.L3:
  ; sci/extras.e16.ts:39  wholeAt(k, 9)
  li a0, 9984
  li a1, 9
  call wholeAt
  ; sci/extras.e16.ts:40  math(M_MUL, KEEP_ANS, k, 0)
  li a0, 3
  li a1, 3080
  li a2, 9984
  li a3, 0
  call math
  ; sci/extras.e16.ts:41  wholeAt(k, 10)
  li a0, 9984
  li a1, 10
  call wholeAt
  ; sci/extras.e16.ts:42  math(M_DIV, KEEP_ANS, k, 0)
  li a0, 4
  li a1, 3080
  li a2, 9984
  li a3, 0
  call math
.L4:
.L2:
  ; sci/extras.e16.ts:44  inexact(KEEP_ANS)
  li a0, 3080
  call inexact
  ; sci/extras.e16.ts:45  poke(KEEP_ANGLE, unit >= 2 ? 0 : unit + 1)
  li t0, 3074
  mv t1, s1
  li t2, 2
  bltu t1, t2, .L5
  li t1, 0
  j .L6
.L5:
  addi t1, s1, 1
.L6:
  sb t1, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/extras.e16.ts:48 wholeAt(at, v) at -O1
;   at in s1
;   v in s2
wholeAt:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; at
  mv s2, a1 ; v
  ; sci/extras.e16.ts:49  poke16(MATH_ARG, v)
  li t0, 65366
  sw s2, 0(t0)
  ; sci/extras.e16.ts:50  math(M_FROMINT, at, 0, 0)
  li a0, 48
  mv a1, s1
  li a2, 0
  li a3, 0
  call math
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/extras.e16.ts:63 constantKept() at -O1
constantKept:
  ; sci/extras.e16.ts:64  return constOp !== 0
  lw t0, 0x08f8(zero)
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; sci/extras.e16.ts:71 operator(t) at -O1
;   t in a0
operator:
  ; sci/extras.e16.ts:72  return t === T_PLUS || t === T_MINUS || t === T_TIMES || t === T_DIVIDE
  li t0, 43
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L3
  li t0, 45
  sub t0, a0, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 129
  sub t0, a0, t0
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 130
  sub t0, a0, t0
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; sci/extras.e16.ts:76 numberLength(at, from, length) at -O1
;   at in a0
;   from in a1
;   length in a2
;   n in a3
;   numberChar.t in s1
numberLength:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; sci/extras.e16.ts:77  let n: u16 = 0
  li a3, 0 ; n
  ; sci/extras.e16.ts:78  while (from + n < length && numberChar(peek(at + from + n))) n++
  j .L3
.L1:
  ; sci/extras.e16.ts:78  n++
  addi a3, a3, 1
.L3:
  add t0, a1, a3
  bgeu t0, a2, .L5
  add t0, a0, a1
  add t0, t0, a3
  lbu s1, 0(t0)
  ; sci/extras.e16.ts:68  return (t >= 0x30 && t <= 0x39) || t === T_POINT
  li t0, 48
  sltu t0, s1, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .I1.L2
  li t0, 57
  sltu t0, t0, s1
  xori t0, t0, 1
.I1.L2:
  mv t1, t0
  bnez t1, .I1_end
  li t0, 46
  sub t0, s1, t0
  seqz t0, t0
.I1_end:
  bnez t0, .L1
.L5:
  ; sci/extras.e16.ts:79  return n
  mv a0, a3
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; sci/extras.e16.ts:86 noteConstant(at, length/from) at -O1
;   at in s0
;   length/from in s3
;   first/size in s1
;   op/i in s2
;   second in 0(sp)
noteConstant:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s0, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  mv s0, a0 ; at
  mv s3, a1 ; length/from
  ; sci/extras.e16.ts:87  const first = numberLength(at, 0, length)
  mv a0, s0
  li a1, 0
  mv a2, s3
  call numberLength
  mv s1, a0 ; first/size
  ; sci/extras.e16.ts:88  if (first === length && length > 0 && constOp !== 0) return
  bne s1, s3, .L1
  bgeu zero, s3, .L1
  lw t0, 0x08f8(zero)
  beq t0, zero, .L1
  ; sci/extras.e16.ts:88  return
  j .return
.L1:
  ; sci/extras.e16.ts:89  constOp = 0
  sw zero, 0x08f8(zero)
  ; sci/extras.e16.ts:90  if (first === 0 || first >= length) return
  beq s1, zero, .L3
  bltu s1, s3, .L2
.L3:
  ; sci/extras.e16.ts:90  return
  j .return
.L2:
  ; sci/extras.e16.ts:91  const op = peek(at + first)
  add t0, s0, s1
  lbu s2, 0(t0)
  ; sci/extras.e16.ts:92  const second = numberLength(at, first + 1, length)
  mv a0, s0
  addi a1, s1, 1
  mv a2, s3
  call numberLength
  sw a0, 0(sp) ; second
  ; sci/extras.e16.ts:93  if (!operator(op) || second === 0 || first + 1 + second !== length) return
  mv a0, s2
  call operator
  beqz a0, .L5
  lw t0, 0(sp) ; second
  beq t0, zero, .L5
  lw t0, 0(sp) ; second
  addi t1, s1, 1
  add t1, t1, t0
  beq t1, s3, .L4
.L5:
  ; sci/extras.e16.ts:93  return
  j .return
.L4:
  ; sci/extras.e16.ts:94  constOp = op
  sw s2, 0x08f8(zero)
  ; sci/extras.e16.ts:96  const from: u16 = op === T_TIMES ? 0 : first + 1
  li t0, 129
  bne s2, t0, .L6
  li t0, 0
  j .L7
.L6:
  addi t0, s1, 1
.L7:
  mv s3, t0 ; length/from
  ; sci/extras.e16.ts:97  const size: u16 = op === T_TIMES ? first : second
  li t0, 129
  bne s2, t0, .L8
  mv t0, s1
  j .L9
.L8:
  lw t0, 0(sp)
.L9:
  mv s1, t0 ; first/size
  ; sci/extras.e16.ts:98  if (size > 24) {
  li t0, 24
  bgeu t0, s1, .L10
  ; sci/extras.e16.ts:99  constOp = 0
  sw zero, 0x08f8(zero)
  ; sci/extras.e16.ts:100  return
  j .return
.L10:
  ; sci/extras.e16.ts:102  poke(CONST, size)
  li t0, 10000
  sb s1, 0(t0)
  ; sci/extras.e16.ts:103  for (let i: u16 = 0; i < size; i++) poke(CONST + 1 + i, peek(at + from + i))
  li s2, 0 ; op/i
  j .L13
.L11:
  ; sci/extras.e16.ts:103  poke(CONST + 1 + i, peek(at + from + i))
  li t0, 10001
  add t0, t0, s2
  add t1, s0, s3
  add t1, t1, s2
  lbu t1, 0(t1)
  sb t1, 0(t0)
  addi s2, s2, 1
.L13:
  bltu s2, s1, .L11
.return:
  lw ra, 2(sp)
  lw s0, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  addi sp, sp, 12
  ret

; sci/extras.e16.ts:110 withConstant(at, length) at -O1
;   at in s3
;   length in s2
;   size in s0
;   i in s1
withConstant:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s3, a0 ; at
  mv s2, a1 ; length
  ; sci/extras.e16.ts:111  if (constOp === 0 || length === 0 || numberLength(at, 0, length) !== length) return 0xffff
  lw t0, 0x08f8(zero)
  beq t0, zero, .L2
  beq s2, zero, .L2
  mv a0, s3
  li a1, 0
  mv a2, s2
  call numberLength
  beq a0, s2, .L1
.L2:
  ; sci/extras.e16.ts:111  return 0xffff
  li a0, 65535
  j .return
.L1:
  ; sci/extras.e16.ts:112  const size = peek(CONST)
  li t0, 10000
  lbu s0, 0(t0)
  ; sci/extras.e16.ts:113  if (length + 1 + size > 190) return 0xffff
  addi t0, s2, 1
  add t0, t0, s0
  li t1, 190
  bgeu t1, t0, .L3
  ; sci/extras.e16.ts:113  return 0xffff
  li a0, 65535
  j .return
.L3:
  ; sci/extras.e16.ts:114  if (constOp === T_TIMES) {
  lw t0, 0x08f8(zero)
  li t1, 129
  bne t0, t1, .L4
  ; sci/extras.e16.ts:116  for (let i = length; i > 0; i--) poke(at + i + size, peek(at + i - 1))
  mv s1, s2 ; i
  j .L7
.L5:
  ; sci/extras.e16.ts:116  poke(at + i + size, peek(at + i - 1))
  add t0, s3, s1
  add t0, t0, s0
  add t1, s3, s1
  lbu t1, -1(t1)
  sb t1, 0(t0)
  addi s1, s1, -1
.L7:
  bltu zero, s1, .L5
  ; sci/extras.e16.ts:117  for (let i: u16 = 0; i < size; i++) poke(at + i, peek(CONST + 1 + i))
  li s1, 0 ; i
  j .L11
.L9:
  ; sci/extras.e16.ts:117  poke(at + i, peek(CONST + 1 + i))
  add t0, s3, s1
  li t1, 10001
  add t1, t1, s1
  lbu t1, 0(t1)
  sb t1, 0(t0)
  addi s1, s1, 1
.L11:
  bltu s1, s0, .L9
  ; sci/extras.e16.ts:118  poke(at + size, T_TIMES)
  add t0, s3, s0
  li t1, 129
  sb t1, 0(t0)
  j .L13
.L4:
  ; sci/extras.e16.ts:120  poke(at + length, constOp)
  add t0, s3, s2
  lw t1, 0x08f8(zero)
  sb t1, 0(t0)
  ; sci/extras.e16.ts:121  for (let i: u16 = 0; i < size; i++) poke(at + length + 1 + i, peek(CONST + 1 + i))
  li s1, 0 ; i
  j .L16
.L14:
  ; sci/extras.e16.ts:121  poke(at + length + 1 + i, peek(CONST + 1 + i))
  add t0, s3, s2
  addi t0, t0, 1
  add t0, t0, s1
  li t1, 10001
  add t1, t1, s1
  lbu t1, 0(t1)
  sb t1, 0(t0)
  addi s1, s1, 1
.L16:
  bltu s1, s0, .L14
.L13:
  ; sci/extras.e16.ts:123  return length + 1 + size
  addi t0, s2, 1
  add a0, t0, s0
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/extras.e16.ts:127 dropConstant() at -O1
dropConstant:
  ; sci/extras.e16.ts:128  constOp = 0
  sw zero, 0x08f8(zero)
.return:
  ret

str_197:
  .byte 84, 65, 66, 76, 69, 0
str_198:
  .byte 88, 0
str_199:
  .byte 102, 40, 88, 41, 0
  .align 2

  .bank 11
  .org 0xc000
; sci/equation.e16.ts:61 kind() at -O1
kind:
  ; sci/equation.e16.ts:62  return peek(EQN_TYPE)
  lbu a0, 5638(zero)
.return:
  ret

; sci/equation.e16.ts:71 colsOf(k) at -O1
;   k in a0
colsOf:
  ; sci/equation.e16.ts:72  return k === 1 || k === 3 ? 3 : 4
  li t0, 1
  beq a0, t0, .L3
  li t0, 3
  bne a0, t0, .L1
.L3:
  li t0, 3
  j .L2
.L1:
  li t0, 4
.L2:
  mv a0, t0
.return:
  ret

; sci/equation.e16.ts:75 coeff(r, c) at -O1
;   r in s1
;   c in s2
coeff:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; r
  mv s2, a1 ; c
  ; sci/equation.e16.ts:76  return EQN_COEFFS + (r * colsOf(kind()) + c) * VALUE_SIZE
  call kind
  call colsOf
  mul t0, s1, a0
  add t0, t0, s2
  slli t1, t0, 5
  slli t0, t0, 2
  add t0, t0, t1
  addi a0, t0, 7488
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/equation.e16.ts:79 rootAt(k) at -O1
;   k in a0
rootAt:
  ; sci/equation.e16.ts:80  return ROOTS + k * VALUE_SIZE
  slli t1, a0, 5
  slli t0, a0, 2
  add t0, t0, t1
  li t1, 8448
  add a0, t1, t0
.return:
  ret

; sci/equation.e16.ts:83 imAt(k) at -O1
;   k in a0
imAt:
  ; sci/equation.e16.ts:84  return IMAGINARY + k * VALUE_SIZE
  slli t1, a0, 5
  slli t0, a0, 2
  add t0, t0, t1
  li t1, 8556
  add a0, t1, t0
.return:
  ret

; sci/equation.e16.ts:90 eqnStart() at -O1
eqnStart:
  ; sci/equation.e16.ts:91  eqPhase = EQ_TYPE
  sw zero, 0x08f0(zero)
.return:
  ret

; sci/equation.e16.ts:95 eqnReset() at -O1
;   rowsOf.k in s1
eqnReset:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/equation.e16.ts:96  if (kind() === 0) {
  call kind
  bne a0, zero, .L1
  ; sci/equation.e16.ts:97  eqPhase = EQ_TYPE
  sw zero, 0x08f0(zero)
  ; sci/equation.e16.ts:98  return
  j .return
.L1:
  ; sci/equation.e16.ts:100  eqPhase = EQ_GRID
  li t0, 1
  sw t0, 0x08f0(zero)
  ; sci/equation.e16.ts:101  gridOpen(GRID_EQN, rowsOf(kind()), colsOf(kind()))
  call kind
  mv s1, a0 ; rowsOf.k
  ; sci/equation.e16.ts:67  if (k === 1) return 2
  li t0, 1
  mv t1, s1
  li t2, 1
  bne t1, t2, .I1.L1
  ; sci/equation.e16.ts:67  return 2
  li t1, 2
  j .I1_end
.I1.L1:
  ; sci/equation.e16.ts:68  return k === 2 ? 3 : 1
  mv t1, s1
  li t2, 2
  bne t1, t2, .I1.L2
  li t1, 3
  j .I1_end
.I1.L2:
  li t1, 1
.I1_end:
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  call kind
  call colsOf
  lw a1, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  mv a0, t1
  la t0, gridOpen
  li t1, 9
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/equation.e16.ts:104 eqnKey(k/r, shift) at -O1
;   k/r in s1
;   shift in s2
eqnKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/r
  mv s2, a1 ; shift
  ; sci/equation.e16.ts:105  if (eqPhase === EQ_TYPE) eqTypeKey(k)
  lw t0, 0x08f0(zero)
  bne t0, zero, .L1
  ; sci/equation.e16.ts:105  eqTypeKey(k)
  mv a0, s1
  call eqTypeKey
  j .L2
.L1:
  ; sci/equation.e16.ts:106  if (eqPhase === EQ_RESULT) eqResultKey(k)
  lw t0, 0x08f0(zero)
  li t1, 2
  bne t0, t1, .L3
  ; sci/equation.e16.ts:106  eqResultKey(k)
  mv a0, s1
  call eqResultKey
  j .L4
.L3:
  ; sci/equation.e16.ts:108  const r = gridKey(k, shift)
  mv a0, s1
  mv a1, s2
  la t0, gridKey
  li t1, 9
  call far_call
  mv s1, a0 ; k/r
  ; sci/equation.e16.ts:109  if (r === GRID_DONE) {
  li t0, 1
  bne s1, t0, .L5
  ; sci/equation.e16.ts:110  solve()
  call solve
  ; sci/equation.e16.ts:111  vertex = false
  sw zero, 0x08f2(zero)
  ; sci/equation.e16.ts:112  eqPhase = EQ_RESULT
  li t0, 2
  sw t0, 0x08f0(zero)
  j .L6
.L5:
  ; sci/equation.e16.ts:113  if (r === GRID_AC) eqPhase = EQ_TYPE
  li t0, 2
  bne s1, t0, .L7
  ; sci/equation.e16.ts:113  eqPhase = EQ_TYPE
  sw zero, 0x08f0(zero)
.L7:
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/equation.e16.ts:118 eqTypeKey(k/i) at -O1
;   k/i in s1
;   chosen in s2
eqTypeKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/i
  ; sci/equation.e16.ts:119  const chosen = typeOf(k)
  mv a0, s1
  call typeOf
  mv s2, a0 ; chosen
  ; sci/equation.e16.ts:120  if (chosen !== 0) {
  beq s2, zero, .L1
  ; sci/equation.e16.ts:121  if (chosen !== kind()) {
  call kind
  beq s2, a0, .L2
  ; sci/equation.e16.ts:122  poke(EQN_TYPE, chosen)
  sb s2, 5638(zero)
  ; sci/equation.e16.ts:123  for (let i: u16 = 0; i < 12; i++) zeroValue(EQN_COEFFS + i * VALUE_SIZE)
  li s1, 0 ; k/i
  j .L5
.L3:
  ; sci/equation.e16.ts:123  zeroValue(EQN_COEFFS + i * VALUE_SIZE)
  slli t1, s1, 5
  slli t0, s1, 2
  add t0, t0, t1
  addi a0, t0, 7488
  call zeroValue
  addi s1, s1, 1
.L5:
  li t0, 12
  bltu s1, t0, .L3
.L2:
  ; sci/equation.e16.ts:125  eqnReset()
  call eqnReset
  j .L7
.L1:
  ; sci/equation.e16.ts:126  if (k === K_AC && kind() !== 0) eqnReset()
  li t0, 5
  bne s1, t0, .L8
  call kind
  beq a0, zero, .L8
  ; sci/equation.e16.ts:126  eqnReset()
  call eqnReset
  j .L9
.L8:
  ; sci/equation.e16.ts:127  refuse()
  call refuse
.L9:
.L7:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/equation.e16.ts:131 typeOf(k) at -O1
;   k in a0
typeOf:
  ; sci/equation.e16.ts:132  if (k === K_1) return 1
  li t0, 56
  bne a0, t0, .L1
  ; sci/equation.e16.ts:132  return 1
  li a0, 1
  ret
.L1:
  ; sci/equation.e16.ts:133  if (k === K_2) return 2
  li t0, 57
  bne a0, t0, .L2
  ; sci/equation.e16.ts:133  return 2
  li a0, 2
  ret
.L2:
  ; sci/equation.e16.ts:134  if (k === K_3) return 3
  li t0, 58
  bne a0, t0, .L3
  ; sci/equation.e16.ts:134  return 3
  li a0, 3
  ret
.L3:
  ; sci/equation.e16.ts:135  return k === K_4 ? 4 : 0
  li t0, 48
  bne a0, t0, .L4
  li t0, 4
  j .L5
.L4:
  li t0, 0
.L5:
  mv a0, t0
.return:
  ret

; sci/equation.e16.ts:138 eqResultKey(k) at -O1
;   k in s1
eqResultKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/equation.e16.ts:139  if (k === K_AC) eqPhase = EQ_GRID
  li t0, 5
  bne s1, t0, .L1
  ; sci/equation.e16.ts:139  eqPhase = EQ_GRID
  li t0, 1
  sw t0, 0x08f0(zero)
  j .L2
.L1:
  ; sci/equation.e16.ts:140  if (kind() === 3 && (k === K_DOWN || k === K_UP)) vertex = k === K_DOWN
  call kind
  li t0, 3
  bne a0, t0, .L3
  li t0, 1
  beq s1, t0, .L4
  bne s1, zero, .L3
.L4:
  ; sci/equation.e16.ts:140  vertex = k === K_DOWN
  li t0, 1
  sub t0, s1, t0
  seqz t0, t0
  sw t0, 0x08f2(zero)
  j .L5
.L3:
  ; sci/equation.e16.ts:141  refuse()
  call refuse
.L5:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/equation.e16.ts:145 zeroValue(v) at -O1
;   v in s2
;   i in s1
zeroValue:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; v
  ; sci/equation.e16.ts:146  for (let i: u16 = 0; i < VALUE_SIZE; i++) poke(v + i, 0)
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/equation.e16.ts:146  poke(v + i, 0)
  add t0, s2, s1
  sb zero, 0(t0)
  addi s1, s1, 1
.L3:
  li t0, 36
  bltu s1, t0, .L1
  ; sci/equation.e16.ts:147  exactWhole(v)
  mv a0, s2
  la t0, exactWhole
  li t1, 2
  call far_call
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/equation.e16.ts:152 eqnDraw() at -O1
eqnDraw:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/equation.e16.ts:153  cls()
  call cls
  ; sci/equation.e16.ts:154  if (eqPhase === EQ_TYPE) eqDrawType()
  lw t0, 0x08f0(zero)
  bne t0, zero, .L1
  ; sci/equation.e16.ts:154  eqDrawType()
  call eqDrawType
  j .L2
.L1:
  ; sci/equation.e16.ts:155  if (eqPhase === EQ_GRID) {
  lw t0, 0x08f0(zero)
  li t1, 1
  bne t0, t1, .L3
  ; sci/equation.e16.ts:156  band(titleOf(kind()))
  call kind
  call titleOf
  call band
  ; sci/equation.e16.ts:157  gridDraw()
  la t0, gridDraw
  li t1, 9
  call far_call
  j .L4
.L3:
  ; sci/equation.e16.ts:158  eqDrawResults()
  call eqDrawResults
.L4:
.L2:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/equation.e16.ts:161 titleOf(k) at -O1
;   k in a0
titleOf:
  ; sci/equation.e16.ts:162  if (k === 1) return str('aX+bY=c')
  li t0, 1
  bne a0, t0, .L1
  ; sci/equation.e16.ts:162  return str('aX+bY=c')
  la a0, str_200
  ret
.L1:
  ; sci/equation.e16.ts:163  if (k === 2) return str('aX+bY+cZ=d')
  li t0, 2
  bne a0, t0, .L2
  ; sci/equation.e16.ts:163  return str('aX+bY+cZ=d')
  la a0, str_201
  ret
.L2:
  ; sci/equation.e16.ts:164  if (k === 3) return str('aX\x84+bX+c=0')
  li t0, 3
  bne a0, t0, .L3
  ; sci/equation.e16.ts:164  return str('aX\x84+bX+c=0')
  la a0, str_202
  ret
.L3:
  ; sci/equation.e16.ts:165  return str('aX\x85+bX\x84+cX+d=0')
  la a0, str_203
.return:
  ret

; sci/equation.e16.ts:168 eqDrawType() at -O1
;   k in s1
eqDrawType:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/equation.e16.ts:169  band(str('EQUATION'))
  la a0, str_204
  call band
  ; sci/equation.e16.ts:170  textAt(str('1:aX+bY=c'), 1, lineY(0))
  la a0, str_205
  li a1, 1
  li a2, 11
  call textAt
  ; sci/equation.e16.ts:171  textAt(str('2:aX+bY+cZ=d'), 1, lineY(1))
  la a0, str_206
  li a1, 1
  li a2, 20
  call textAt
  ; sci/equation.e16.ts:172  textAt(str('3:aX\x84+bX+c=0'), 1, lineY(2))
  la a0, str_207
  li a1, 1
  li a2, 29
  call textAt
  ; sci/equation.e16.ts:173  textAt(str('4:aX\x85+bX\x84+cX+d=0'), 1, lineY(3))
  la a0, str_208
  li a1, 1
  li a2, 38
  call textAt
  ; sci/equation.e16.ts:174  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_209
  li a1, 1
  li a2, 56
  call textAt
  ; sci/equation.e16.ts:175  const k = kind()
  call kind
  mv s1, a0 ; k
  ; sci/equation.e16.ts:176  if (k !== 0) mark(0, 2, k - 1)
  beq s1, zero, .L1
  ; sci/equation.e16.ts:176  mark(0, 2, k - 1)
  li a0, 0
  li a1, 2
  addi a2, s1, -1
  call mark
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/equation.e16.ts:180 eqDrawResults() at -O1
;   twoD in s2
;   k in s1
;   foot in s3
eqDrawResults:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  ; sci/equation.e16.ts:181  const twoD = peek(KEEP_DISPLAY) === 0
  lbu t0, 3075(zero)
  sub t0, t0, zero
  seqz s2, t0
  ; sci/equation.e16.ts:182  if (!unique) {
  lw t0, 0x08f6(zero)
  bnez t0, .L1
  ; sci/equation.e16.ts:183  band(titleOf(kind()))
  call kind
  call titleOf
  call band
  ; sci/equation.e16.ts:184  textAt(str('NO ONE SOLUTION:'), 1, lineY(0))
  la a0, str_210
  li a1, 1
  li a2, 11
  call textAt
  ; sci/equation.e16.ts:185  textAt(str('NONE, OR MANY'), 1, lineY(1))
  la a0, str_211
  li a1, 1
  li a2, 20
  call textAt
  ; sci/equation.e16.ts:186  textAt(str('AC:EDIT'), 1, lineY(5))
  la a0, str_212
  li a1, 1
  li a2, 56
  call textAt
  ; sci/equation.e16.ts:187  return
  j .return
.L1:
  ; sci/equation.e16.ts:189  if (vertex) {
  lw t0, 0x08f2(zero)
  beqz t0, .L2
  ; sci/equation.e16.ts:190  textAt(str('VERTEX'), 1, 0)
  la a0, str_213
  li a1, 1
  li a2, 0
  call textAt
  ; sci/equation.e16.ts:191  textAt(str('X='), 1, 21)
  la a0, str_214
  li a1, 1
  li a2, 21
  call textAt
  ; sci/equation.e16.ts:192  drawValueAt(VERTEX, 28, twoD)
  li a0, 8664
  li a1, 28
  mv a2, s2
  la t0, drawValueAt
  li t1, 5
  call far_call
  ; sci/equation.e16.ts:193  textAt(str('Y='), 1, 42)
  la a0, str_215
  li a1, 1
  li a2, 42
  call textAt
  ; sci/equation.e16.ts:194  drawValueAt(VERTEX + VALUE_SIZE, 49, twoD)
  li a0, 8700
  li a1, 49
  mv a2, s2
  la t0, drawValueAt
  li t1, 5
  call far_call
  ; sci/equation.e16.ts:195  textAt(str('\x8d:ROOTS  AC:EDIT'), 1, 56)
  la a0, str_216
  li a1, 1
  li a2, 56
  call textAt
  ; sci/equation.e16.ts:196  return
  j .return
.L2:
  ; sci/equation.e16.ts:198  for (let k: u16 = 0; k < answers; k++) {
  li s1, 0 ; k
  j .L5
.L3:
  ; sci/equation.e16.ts:199  const foot = 14 + 21 * k
  li t0, 21
  mul t0, t0, s1
  addi s3, t0, 14
  ; sci/equation.e16.ts:200  textAt(labelOf(k), 1, foot - 7)
  mv a0, s1
  call labelOf
  li a1, 1
  addi a2, s3, -7
  call textAt
  ; sci/equation.e16.ts:201  if (isZero(imAt(k))) drawValueAt(rootAt(k), foot, twoD)
  mv a0, s1
  call imAt
  call isZero
  beqz a0, .L7
  ; sci/equation.e16.ts:201  drawValueAt(rootAt(k), foot, twoD)
  mv a0, s1
  call rootAt
  mv a1, s3
  mv a2, s2
  la t0, drawValueAt
  li t1, 5
  call far_call
  j .L8
.L7:
  ; sci/equation.e16.ts:202  complexAt(k, foot)
  mv a0, s1
  mv a1, s3
  call complexAt
.L8:
  addi s1, s1, 1
.L5:
  lw t0, 0x08f4(zero)
  bltu s1, t0, .L3
  ; sci/equation.e16.ts:204  if (kind() === 3) textAt(str('\x8e:VERTEX  AC:EDIT'), 1, 56)
  call kind
  li t0, 3
  bne a0, t0, .L9
  ; sci/equation.e16.ts:204  textAt(str('\x8e:VERTEX  AC:EDIT'), 1, 56)
  la a0, str_217
  li a1, 1
  li a2, 56
  call textAt
.L9:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/equation.e16.ts:208 complexAt(k, foot) at -O1
;   k in s1
;   foot in s3
;   minus in s2
complexAt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; k
  mv s3, a1 ; foot
  ; sci/equation.e16.ts:209  const minus = isNegative(imAt(k))
  mv a0, s1
  call imAt
  call isNegative
  mv s2, a0 ; minus
  ; sci/equation.e16.ts:210  copyValue(imAt(k), E1)
  mv a0, s1
  call imAt
  li a1, 9168
  call copyValue
  ; sci/equation.e16.ts:211  if (minus) vneg(E1)
  beqz s2, .L1
  ; sci/equation.e16.ts:211  vneg(E1)
  li a0, 9168
  call vneg
.L1:
  ; sci/equation.e16.ts:212  drawComplexAt(rootAt(k), E1, minus, foot)
  mv a0, s1
  call rootAt
  li a1, 9168
  mv a2, s2
  mv a3, s3
  la t0, drawComplexAt
  li t1, 5
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/equation.e16.ts:215 labelOf(k) at -O1
;   k in s1
labelOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/equation.e16.ts:216  if (kind() <= 2) return k === 0 ? str('X=') : k === 1 ? str('Y=') : str('Z=')
  call kind
  li t0, 2
  bltu t0, a0, .L1
  ; sci/equation.e16.ts:216  return k === 0 ? str('X=') : k === 1 ? str('Y=') : str('Z=')
  bne s1, zero, .L2
  la t0, str_214
  j .L3
.L2:
  li t0, 1
  bne s1, t0, .L4
  la t0, str_215
  j .L5
.L4:
  la t0, str_218
.L5:
.L3:
  mv a0, t0
  j .return
.L1:
  ; sci/equation.e16.ts:217  return k === 0 ? str('X1=') : k === 1 ? str('X2=') : str('X3=')
  bne s1, zero, .L6
  la t0, str_219
  j .L7
.L6:
  li t0, 1
  bne s1, t0, .L8
  la t0, str_220
  j .L9
.L8:
  la t0, str_221
.L9:
.L7:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/equation.e16.ts:223 vop(op, a, b) at -O1
;   op in s1
;   a in s2
;   b in s3
vop:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; op
  mv s2, a1 ; a
  mv s3, a2 ; b
  ; sci/equation.e16.ts:224  math(op, a, b, 0)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  li a3, 0
  call math
  ; sci/equation.e16.ts:225  exactBinary(op, a, b)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  la t0, exactBinary
  li t1, 2
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/equation.e16.ts:228 vneg(a) at -O1
;   a in s1
vneg:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; a
  ; sci/equation.e16.ts:229  math(M_NEG, a, 0, 0)
  li a0, 16
  mv a1, s1
  li a2, 0
  li a3, 0
  call math
  ; sci/equation.e16.ts:230  exactNeg(a)
  mv a0, s1
  la t0, exactNeg
  li t1, 2
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/equation.e16.ts:233 solve() at -O1
;   k in s1
solve:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/equation.e16.ts:234  unique = true
  li t0, 1
  sw t0, 0x08f6(zero)
  ; sci/equation.e16.ts:235  for (let k: u16 = 0; k < 3; k++) zeroValue(imAt(k))
  li s1, 0 ; k
  j .L3
.L1:
  ; sci/equation.e16.ts:235  zeroValue(imAt(k))
  mv a0, s1
  call imAt
  call zeroValue
  addi s1, s1, 1
.L3:
  li t0, 3
  bltu s1, t0, .L1
  ; sci/equation.e16.ts:236  const k = kind()
  call kind
  mv s1, a0 ; k
  ; sci/equation.e16.ts:237  if (k <= 2) linear(k + 1)
  li t0, 2
  bltu t0, s1, .L5
  ; sci/equation.e16.ts:237  linear(k + 1)
  addi a0, s1, 1
  call linear
  j .L6
.L5:
  ; sci/equation.e16.ts:238  if (k === 3) {
  li t0, 3
  bne s1, t0, .L7
  ; sci/equation.e16.ts:239  quadratic(coeff(0, 0), coeff(0, 1), coeff(0, 2), 0)
  li a0, 0
  li a1, 0
  call coeff
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 0
  li a1, 1
  call coeff
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 0
  li a1, 2
  call coeff
  lw a1, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  mv a0, t1
  li a3, 0
  call quadratic
  ; sci/equation.e16.ts:240  answers = 2
  li t0, 2
  sw t0, 0x08f4(zero)
  ; sci/equation.e16.ts:241  vertexOf()
  call vertexOf
  j .L8
.L7:
  ; sci/equation.e16.ts:242  cubic()
  call cubic
.L8:
.L6:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/equation.e16.ts:247 cell(r, c, n) at -O1
;   r in a0
;   c in a1
;   n in a2
cell:
  ; sci/equation.e16.ts:248  return MATRIX + (r * (n + 1) + c) * VALUE_SIZE
  addi t0, a2, 1
  mul t0, a0, t0
  add t0, t0, a1
  slli t1, t0, 5
  slli t0, t0, 2
  add t0, t0, t1
  li t1, 8736
  add a0, t1, t0
.return:
  ret

; sci/equation.e16.ts:251 linear(n) at -O1
;   n in s3
;   r/k/i in s1
;   c/p/i in s2
linear:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; n
  ; sci/equation.e16.ts:252  answers = n
  sw s3, 0x08f4(zero)
  ; sci/equation.e16.ts:253  for (let r: u16 = 0; r < n; r++) {
  li s1, 0 ; r/k/i
  j .L3
.L1:
  ; sci/equation.e16.ts:254  for (let c: u16 = 0; c <= n; c++) copyValue(coeff(r, c), cell(r, c, n))
  li s2, 0 ; c/p/i
  j .L7
.L5:
  ; sci/equation.e16.ts:254  copyValue(coeff(r, c), cell(r, c, n))
  mv a0, s1
  mv a1, s2
  call coeff
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call cell
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copyValue
  addi s2, s2, 1
.L7:
  bgeu s3, s2, .L5
  addi s1, s1, 1
.L3:
  bltu s1, s3, .L1
  ; sci/equation.e16.ts:256  for (let k: u16 = 0; k < n; k++) {
  li s1, 0 ; r/k/i
  j .L11
.L9:
  ; sci/equation.e16.ts:257  const p = pivotRow(k, n)
  mv a0, s1
  mv a1, s3
  call pivotRow
  mv s2, a0 ; c/p/i
  ; sci/equation.e16.ts:258  if (isZero(cell(p, k, n))) {
  mv a0, s2
  mv a1, s1
  mv a2, s3
  call cell
  call isZero
  beqz a0, .L13
  ; sci/equation.e16.ts:259  unique = false
  sw zero, 0x08f6(zero)
  ; sci/equation.e16.ts:260  return
  j .return
.L13:
  ; sci/equation.e16.ts:262  if (p !== k) swapRows(p, k, n)
  beq s2, s1, .L14
  ; sci/equation.e16.ts:262  swapRows(p, k, n)
  mv a0, s2
  mv a1, s1
  mv a2, s3
  call swapRows
.L14:
  ; sci/equation.e16.ts:263  for (let i = k + 1; i < n; i++) eliminate(i, k, n)
  addi s2, s1, 1
  j .L17
.L15:
  ; sci/equation.e16.ts:263  eliminate(i, k, n)
  mv a0, s2
  mv a1, s1
  mv a2, s3
  call eliminate
  addi s2, s2, 1
.L17:
  bltu s2, s3, .L15
  addi s1, s1, 1
.L11:
  bltu s1, s3, .L9
  ; sci/equation.e16.ts:265  for (let i = n; i > 0; i--) backSubstitute(i - 1, n)
  mv s1, s3 ; r/k/i
  j .L21
.L19:
  ; sci/equation.e16.ts:265  backSubstitute(i - 1, n)
  addi a0, s1, -1
  mv a1, s3
  call backSubstitute
  addi s1, s1, -1
.L21:
  bltu zero, s1, .L19
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/equation.e16.ts:269 pivotRow(k, n) at -O1
;   k in s2
;   n in s3
;   best in s0
;   i in s1
pivotRow:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; k
  mv s3, a1 ; n
  ; sci/equation.e16.ts:270  let best = k
  mv s0, s2 ; best
  ; sci/equation.e16.ts:271  for (let i = k + 1; i < n; i++) {
  addi s1, s2, 1
  j .L3
.L1:
  ; sci/equation.e16.ts:272  copyValue(cell(i, k, n), E1)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call cell
  li a1, 9168
  call copyValue
  ; sci/equation.e16.ts:273  math(M_ABS, E1, 0, 0)
  li a0, 17
  li a1, 9168
  li a2, 0
  li a3, 0
  call math
  ; sci/equation.e16.ts:274  copyValue(cell(best, k, n), E2)
  mv a0, s0
  mv a1, s2
  mv a2, s3
  call cell
  li a1, 9204
  call copyValue
  ; sci/equation.e16.ts:275  math(M_ABS, E2, 0, 0)
  li a0, 17
  li a1, 9204
  li a2, 0
  li a3, 0
  call math
  ; sci/equation.e16.ts:276  math(M_CMP, E1, E2, 0)
  li a0, 6
  li a1, 9168
  li a2, 9204
  li a3, 0
  call math
  ; sci/equation.e16.ts:277  if (peekResult() === 1) best = i
  call peekResult
  li t0, 1
  bne a0, t0, .L5
  ; sci/equation.e16.ts:277  best = i
  mv s0, s1 ; best
.L5:
  addi s1, s1, 1
.L3:
  bltu s1, s3, .L1
  ; sci/equation.e16.ts:279  return best
  mv a0, s0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/equation.e16.ts:282 peekResult() at -O1
peekResult:
  ; sci/equation.e16.ts:283  return peek(MATH_RESULT) | (peek(MATH_RESULT + 1) << 8)
  li t0, 65370
  lbu t0, 0(t0)
  li t1, 65371
  lbu t1, 0(t1)
  slli t1, t1, 8
  or a0, t0, t1
.return:
  ret

; sci/equation.e16.ts:286 swapRows(a, b, n) at -O1
;   a in s3
;   b in s0
;   n in s2
;   c in s1
swapRows:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  mv s3, a0 ; a
  mv s0, a1 ; b
  mv s2, a2 ; n
  ; sci/equation.e16.ts:287  for (let c: u16 = 0; c <= n; c++) {
  li s1, 0 ; c
  j .L3
.L1:
  ; sci/equation.e16.ts:288  copyValue(cell(a, c, n), E1)
  mv a0, s3
  mv a1, s1
  mv a2, s2
  call cell
  li a1, 9168
  call copyValue
  ; sci/equation.e16.ts:289  copyValue(cell(b, c, n), cell(a, c, n))
  mv a0, s0
  mv a1, s1
  mv a2, s2
  call cell
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s3
  mv a1, s1
  mv a2, s2
  call cell
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copyValue
  ; sci/equation.e16.ts:290  copyValue(E1, cell(b, c, n))
  mv a0, s0
  mv a1, s1
  mv a2, s2
  call cell
  mv a1, a0
  li a0, 9168
  call copyValue
  addi s1, s1, 1
.L3:
  bgeu s2, s1, .L1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/equation.e16.ts:295 eliminate(i, k, n) at -O1
;   i in s0
;   k in s1
;   n in s2
;   c in s3
eliminate:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s0, a0 ; i
  mv s1, a1 ; k
  mv s2, a2 ; n
  ; sci/equation.e16.ts:296  copyValue(cell(i, k, n), E3)
  mv a0, s0
  mv a1, s1
  mv a2, s2
  call cell
  li a1, 9240
  call copyValue
  ; sci/equation.e16.ts:297  vop(M_DIV, E3, cell(k, k, n))
  mv a0, s1
  mv a1, s1
  mv a2, s2
  call cell
  li a1, 9240
  mv a2, a0
  li a0, 4
  call vop
  ; sci/equation.e16.ts:298  for (let c = k; c <= n; c++) {
  mv s3, s1 ; c
  j .L3
.L1:
  ; sci/equation.e16.ts:299  copyValue(cell(k, c, n), E1)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call cell
  li a1, 9168
  call copyValue
  ; sci/equation.e16.ts:300  vop(M_MUL, E1, E3)
  li a0, 3
  li a1, 9168
  li a2, 9240
  call vop
  ; sci/equation.e16.ts:301  vop(M_SUB, cell(i, c, n), E1)
  mv a0, s0
  mv a1, s3
  mv a2, s2
  call cell
  mv a1, a0
  li a0, 2
  li a2, 9168
  call vop
  addi s3, s3, 1
.L3:
  bgeu s2, s3, .L1
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/equation.e16.ts:306 backSubstitute(i, n) at -O1
;   i in s1
;   n in s2
;   j in s3
backSubstitute:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i
  mv s2, a1 ; n
  ; sci/equation.e16.ts:307  copyValue(cell(i, n, n), E2)
  mv a0, s1
  mv a1, s2
  mv a2, s2
  call cell
  li a1, 9204
  call copyValue
  ; sci/equation.e16.ts:308  for (let j = i + 1; j < n; j++) {
  addi s3, s1, 1
  j .L3
.L1:
  ; sci/equation.e16.ts:309  copyValue(cell(i, j, n), E1)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call cell
  li a1, 9168
  call copyValue
  ; sci/equation.e16.ts:310  vop(M_MUL, E1, rootAt(j))
  mv a0, s3
  call rootAt
  li a1, 9168
  mv a2, a0
  li a0, 3
  call vop
  ; sci/equation.e16.ts:311  vop(M_SUB, E2, E1)
  li a0, 2
  li a1, 9204
  li a2, 9168
  call vop
  addi s3, s3, 1
.L3:
  bltu s3, s2, .L1
  ; sci/equation.e16.ts:313  vop(M_DIV, E2, cell(i, i, n))
  mv a0, s1
  mv a1, s1
  mv a2, s2
  call cell
  li a1, 9204
  mv a2, a0
  li a0, 4
  call vop
  ; sci/equation.e16.ts:314  copyValue(E2, rootAt(i))
  mv a0, s1
  call rootAt
  mv a1, a0
  li a0, 9204
  call copyValue
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/equation.e16.ts:321 quadratic(a/complex, b, c, first) at -O1
;   a/complex in s2
;   b in s3
;   c in s0
;   first in s1
quadratic:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; a/complex
  mv s3, a1 ; b
  mv s0, a2 ; c
  mv s1, a3 ; first
  ; sci/equation.e16.ts:322  if (isZero(a)) fail(E_MATH, 0)
  mv a0, s2
  call isZero
  beqz a0, .L1
  ; sci/equation.e16.ts:322  fail(E_MATH, 0)
  li a0, 1
  li a1, 0
  call fail
.L1:
  ; sci/equation.e16.ts:323  copyValue(b, E1)
  mv a0, s3
  li a1, 9168
  call copyValue
  ; sci/equation.e16.ts:324  vop(M_MUL, E1, b)
  li a0, 3
  li a1, 9168
  mv a2, s3
  call vop
  ; sci/equation.e16.ts:325  copyValue(a, E2)
  mv a0, s2
  li a1, 9204
  call copyValue
  ; sci/equation.e16.ts:326  vop(M_MUL, E2, c)
  li a0, 3
  li a1, 9204
  mv a2, s0
  call vop
  ; sci/equation.e16.ts:327  eqSmall(E3, 4)
  li a0, 9240
  li a1, 4
  call eqSmall
  ; sci/equation.e16.ts:328  vop(M_MUL, E2, E3)
  li a0, 3
  li a1, 9204
  li a2, 9240
  call vop
  ; sci/equation.e16.ts:329  vop(M_SUB, E1, E2)
  li a0, 2
  li a1, 9168
  li a2, 9204
  call vop
  ; sci/equation.e16.ts:331  copyValue(a, E2)
  mv a0, s2
  li a1, 9204
  call copyValue
  ; sci/equation.e16.ts:332  eqSmall(E3, 2)
  li a0, 9240
  li a1, 2
  call eqSmall
  ; sci/equation.e16.ts:333  vop(M_MUL, E2, E3)
  li a0, 3
  li a1, 9204
  li a2, 9240
  call vop
  ; sci/equation.e16.ts:334  copyValue(b, E3)
  mv a0, s3
  li a1, 9240
  call copyValue
  ; sci/equation.e16.ts:335  vneg(E3)
  li a0, 9240
  call vneg
  ; sci/equation.e16.ts:336  const complex = isNegative(E1)
  li a0, 9168
  call isNegative
  mv s2, a0 ; a/complex
  ; sci/equation.e16.ts:337  if (complex) vneg(E1)
  beqz s2, .L2
  ; sci/equation.e16.ts:337  vneg(E1)
  li a0, 9168
  call vneg
.L2:
  ; sci/equation.e16.ts:338  math(M_SQR, E1, 0, 0)
  li a0, 21
  li a1, 9168
  li a2, 0
  li a3, 0
  call math
  ; sci/equation.e16.ts:339  exactSqrt(E1)
  li a0, 9168
  la t0, exactSqrt
  li t1, 2
  call far_call
  ; sci/equation.e16.ts:340  if (complex) {
  beqz s2, .L3
  ; sci/equation.e16.ts:341  complexRoots(first)
  mv a0, s1
  call complexRoots
  ; sci/equation.e16.ts:342  return
  j .return
.L3:
  ; sci/equation.e16.ts:344  copyValue(E3, rootAt(first))
  mv a0, s1
  call rootAt
  mv a1, a0
  li a0, 9240
  call copyValue
  ; sci/equation.e16.ts:345  vop(M_ADD, rootAt(first), E1)
  mv a0, s1
  call rootAt
  mv a1, a0
  li a0, 1
  li a2, 9168
  call vop
  ; sci/equation.e16.ts:346  vop(M_DIV, rootAt(first), E2)
  mv a0, s1
  call rootAt
  mv a1, a0
  li a0, 4
  li a2, 9204
  call vop
  ; sci/equation.e16.ts:347  copyValue(E3, rootAt(first + 1))
  addi a0, s1, 1
  call rootAt
  mv a1, a0
  li a0, 9240
  call copyValue
  ; sci/equation.e16.ts:348  vop(M_SUB, rootAt(first + 1), E1)
  addi a0, s1, 1
  call rootAt
  mv a1, a0
  li a0, 2
  li a2, 9168
  call vop
  ; sci/equation.e16.ts:349  vop(M_DIV, rootAt(first + 1), E2)
  addi a0, s1, 1
  call rootAt
  mv a1, a0
  li a0, 4
  li a2, 9204
  call vop
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/equation.e16.ts:353 complexRoots(first) at -O1
;   first in s1
complexRoots:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; first
  ; sci/equation.e16.ts:354  copyValue(E3, rootAt(first))
  mv a0, s1
  call rootAt
  mv a1, a0
  li a0, 9240
  call copyValue
  ; sci/equation.e16.ts:355  vop(M_DIV, rootAt(first), E2)
  mv a0, s1
  call rootAt
  mv a1, a0
  li a0, 4
  li a2, 9204
  call vop
  ; sci/equation.e16.ts:356  copyValue(rootAt(first), rootAt(first + 1))
  mv a0, s1
  call rootAt
  addi sp, sp, -2
  sw a0, 0(sp)
  addi a0, s1, 1
  call rootAt
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copyValue
  ; sci/equation.e16.ts:357  if (isNegative(E2)) vneg(E2)
  li a0, 9204
  call isNegative
  beqz a0, .L1
  ; sci/equation.e16.ts:357  vneg(E2)
  li a0, 9204
  call vneg
.L1:
  ; sci/equation.e16.ts:358  copyValue(E1, imAt(first))
  mv a0, s1
  call imAt
  mv a1, a0
  li a0, 9168
  call copyValue
  ; sci/equation.e16.ts:359  vop(M_DIV, imAt(first), E2)
  mv a0, s1
  call imAt
  mv a1, a0
  li a0, 4
  li a2, 9204
  call vop
  ; sci/equation.e16.ts:360  copyValue(imAt(first), imAt(first + 1))
  mv a0, s1
  call imAt
  addi sp, sp, -2
  sw a0, 0(sp)
  addi a0, s1, 1
  call imAt
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copyValue
  ; sci/equation.e16.ts:361  vneg(imAt(first + 1))
  addi a0, s1, 1
  call imAt
  call vneg
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/equation.e16.ts:365 vertexOf() at -O1
vertexOf:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/equation.e16.ts:366  const x = VERTEX
  ; sci/equation.e16.ts:367  const y = VERTEX + VALUE_SIZE
  ; sci/equation.e16.ts:368  copyValue(coeff(0, 1), x)
  li a0, 0
  li a1, 1
  call coeff
  li a1, 8664
  call copyValue
  ; sci/equation.e16.ts:369  vneg(x)
  li a0, 8664
  call vneg
  ; sci/equation.e16.ts:370  copyValue(coeff(0, 0), E1)
  li a0, 0
  li a1, 0
  call coeff
  li a1, 9168
  call copyValue
  ; sci/equation.e16.ts:371  eqSmall(E2, 2)
  li a0, 9204
  li a1, 2
  call eqSmall
  ; sci/equation.e16.ts:372  vop(M_MUL, E1, E2)
  li a0, 3
  li a1, 9168
  li a2, 9204
  call vop
  ; sci/equation.e16.ts:373  vop(M_DIV, x, E1)
  li a0, 4
  li a1, 8664
  li a2, 9168
  call vop
  ; sci/equation.e16.ts:375  copyValue(x, y)
  li a0, 8664
  li a1, 8700
  call copyValue
  ; sci/equation.e16.ts:376  vop(M_MUL, y, coeff(0, 0))
  li a0, 0
  li a1, 0
  call coeff
  li a1, 8700
  mv a2, a0
  li a0, 3
  call vop
  ; sci/equation.e16.ts:377  vop(M_ADD, y, coeff(0, 1))
  li a0, 0
  li a1, 1
  call coeff
  li a1, 8700
  mv a2, a0
  li a0, 1
  call vop
  ; sci/equation.e16.ts:378  vop(M_MUL, y, x)
  li a0, 3
  li a1, 8700
  li a2, 8664
  call vop
  ; sci/equation.e16.ts:379  vop(M_ADD, y, coeff(0, 2))
  li a0, 0
  li a1, 2
  call coeff
  li a1, 8700
  mv a2, a0
  li a0, 1
  call vop
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/equation.e16.ts:383 eqSmall(v, n) at -O1
;   v in s2
;   n in s3
;   i in s1
eqSmall:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; v
  mv s3, a1 ; n
  ; sci/equation.e16.ts:384  for (let i: u16 = 0; i < VALUE_SIZE; i++) poke(v + i, 0)
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/equation.e16.ts:384  poke(v + i, 0)
  add t0, s2, s1
  sb zero, 0(t0)
  addi s1, s1, 1
.L3:
  li t0, 36
  bltu s1, t0, .L1
  ; sci/equation.e16.ts:385  poke(v + 2, n << 4)
  slli t0, s3, 4
  sb t0, 2(s2)
  ; sci/equation.e16.ts:386  exactWhole(v)
  mv a0, s2
  la t0, exactWhole
  li t1, 2
  call far_call
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/equation.e16.ts:393 cubic() at -O1
;   a in s1
cubic:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/equation.e16.ts:394  answers = 3
  li t0, 3
  sw t0, 0x08f4(zero)
  ; sci/equation.e16.ts:395  const a = coeff(0, 0)
  li a0, 0
  li a1, 0
  call coeff
  mv s1, a0 ; a
  ; sci/equation.e16.ts:396  if (isZero(a)) fail(E_MATH, 0)
  mv a0, s1
  call isZero
  beqz a0, .L1
  ; sci/equation.e16.ts:396  fail(E_MATH, 0)
  li a0, 1
  li a1, 0
  call fail
.L1:
  ; sci/equation.e16.ts:397  halve()
  call halve
  ; sci/equation.e16.ts:399  copyValue(rootAt(0), E4)
  li a0, 8448
  li a1, 9276
  call copyValue
  ; sci/equation.e16.ts:400  poke16Arg(0)
  ; sci/equation.e16.ts:421  poke(MATH_ARG, v & 0xff)
  li t0, 65366
  sb zero, 0(t0)
  ; sci/equation.e16.ts:422  poke(MATH_ARG + 1, v >> 8)
  li t0, 65367
  sb zero, 0(t0)
  ; sci/equation.e16.ts:401  math(M_RNDTO, E4, 0, 0)
  li a0, 40
  li a1, 9276
  li a2, 0
  li a3, 0
  call math
  ; sci/equation.e16.ts:402  exactWhole(E4)
  li a0, 9276
  la t0, exactWhole
  li t1, 2
  call far_call
  ; sci/equation.e16.ts:403  cubicAt(E4, E1)
  li a0, 9276
  li a1, 9168
  call cubicAt
  ; sci/equation.e16.ts:404  if (isZero(E1)) copyValue(E4, rootAt(0))
  li a0, 9168
  call isZero
  beqz a0, .L2
  ; sci/equation.e16.ts:404  copyValue(E4, rootAt(0))
  li a0, 9276
  li a1, 8448
  call copyValue
  j .L3
.L2:
  ; sci/equation.e16.ts:405  inexact(rootAt(0))
  li a0, 8448
  call inexact
.L3:
  ; sci/equation.e16.ts:407  const qa = MATRIX
  ; sci/equation.e16.ts:408  const qb = qa + VALUE_SIZE
  ; sci/equation.e16.ts:409  const qc = qb + VALUE_SIZE
  ; sci/equation.e16.ts:410  copyValue(a, qa)
  mv a0, s1
  li a1, 8736
  call copyValue
  ; sci/equation.e16.ts:411  copyValue(a, qb)
  mv a0, s1
  li a1, 8772
  call copyValue
  ; sci/equation.e16.ts:412  vop(M_MUL, qb, rootAt(0))
  li a0, 3
  li a1, 8772
  li a2, 8448
  call vop
  ; sci/equation.e16.ts:413  vop(M_ADD, qb, coeff(0, 1))
  li a0, 0
  li a1, 1
  call coeff
  li a1, 8772
  mv a2, a0
  li a0, 1
  call vop
  ; sci/equation.e16.ts:414  copyValue(qb, qc)
  li a0, 8772
  li a1, 8808
  call copyValue
  ; sci/equation.e16.ts:415  vop(M_MUL, qc, rootAt(0))
  li a0, 3
  li a1, 8808
  li a2, 8448
  call vop
  ; sci/equation.e16.ts:416  vop(M_ADD, qc, coeff(0, 2))
  li a0, 0
  li a1, 2
  call coeff
  li a1, 8808
  mv a2, a0
  li a0, 1
  call vop
  ; sci/equation.e16.ts:417  quadratic(qa, qb, qc, 1)
  li a0, 8736
  li a1, 8772
  li a2, 8808
  li a3, 1
  call quadratic
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/equation.e16.ts:426 cubicAt(x, out) at -O1
;   x in s3
;   out in s2
;   c in s1
cubicAt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  mv s3, a0 ; x
  mv s2, a1 ; out
  ; sci/equation.e16.ts:427  copyValue(coeff(0, 0), out)
  li a0, 0
  li a1, 0
  call coeff
  mv a1, s2
  call copyValue
  ; sci/equation.e16.ts:428  for (let c: u16 = 1; c < 4; c++) {
  li s1, 1 ; c
  j .L3
.L1:
  ; sci/equation.e16.ts:429  vop(M_MUL, out, x)
  li a0, 3
  mv a1, s2
  mv a2, s3
  call vop
  ; sci/equation.e16.ts:430  vop(M_ADD, out, coeff(0, c))
  li a0, 0
  mv a1, s1
  call coeff
  mv a1, s2
  mv a2, a0
  li a0, 1
  call vop
  addi s1, s1, 1
.L3:
  li t0, 4
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/equation.e16.ts:438 halve() at -O1
;   c/k in s1
halve:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/equation.e16.ts:439  const lo = MATRIX
  ; sci/equation.e16.ts:440  const hi = lo + VALUE_SIZE
  ; sci/equation.e16.ts:441  const mid = hi + VALUE_SIZE
  ; sci/equation.e16.ts:442  const flo = mid + VALUE_SIZE
  ; sci/equation.e16.ts:443  eqSmall(hi, 1)
  li a0, 8772
  li a1, 1
  call eqSmall
  ; sci/equation.e16.ts:444  for (let c: u16 = 1; c < 4; c++) {
  li s1, 1 ; c/k
  j .L3
.L1:
  ; sci/equation.e16.ts:445  copyValue(coeff(0, c), E1)
  li a0, 0
  mv a1, s1
  call coeff
  li a1, 9168
  call copyValue
  ; sci/equation.e16.ts:446  math(M_DIV, E1, coeff(0, 0), 0)
  li a0, 0
  li a1, 0
  call coeff
  li a1, 9168
  mv a2, a0
  li a0, 4
  li a3, 0
  call math
  ; sci/equation.e16.ts:447  math(M_ABS, E1, 0, 0)
  li a0, 17
  li a1, 9168
  li a2, 0
  li a3, 0
  call math
  ; sci/equation.e16.ts:448  eqSmall(E2, 1)
  li a0, 9204
  li a1, 1
  call eqSmall
  ; sci/equation.e16.ts:449  math(M_ADD, E1, E2, 0)
  li a0, 1
  li a1, 9168
  li a2, 9204
  li a3, 0
  call math
  ; sci/equation.e16.ts:450  math(M_CMP, E1, hi, 0)
  li a0, 6
  li a1, 9168
  li a2, 8772
  li a3, 0
  call math
  ; sci/equation.e16.ts:451  if (peekResult() === 1) copyValue(E1, hi)
  call peekResult
  li t0, 1
  bne a0, t0, .L5
  ; sci/equation.e16.ts:451  copyValue(E1, hi)
  li a0, 9168
  li a1, 8772
  call copyValue
.L5:
  addi s1, s1, 1
.L3:
  li t0, 4
  bltu s1, t0, .L1
  ; sci/equation.e16.ts:453  copyValue(hi, lo)
  li a0, 8772
  li a1, 8736
  call copyValue
  ; sci/equation.e16.ts:454  math(M_NEG, lo, 0, 0)
  li a0, 16
  li a1, 8736
  li a2, 0
  li a3, 0
  call math
  ; sci/equation.e16.ts:455  inexact(lo)
  li a0, 8736
  call inexact
  ; sci/equation.e16.ts:456  inexact(hi)
  li a0, 8772
  call inexact
  ; sci/equation.e16.ts:457  cubicAt(lo, flo)
  li a0, 8736
  li a1, 8844
  call cubicAt
  ; sci/equation.e16.ts:458  for (let k: u16 = 0; k < 80; k++) {
  li s1, 0 ; c/k
  j .L8
.L6:
  ; sci/equation.e16.ts:459  copyValue(lo, mid)
  li a0, 8736
  li a1, 8808
  call copyValue
  ; sci/equation.e16.ts:460  math(M_ADD, mid, hi, 0)
  li a0, 1
  li a1, 8808
  li a2, 8772
  li a3, 0
  call math
  ; sci/equation.e16.ts:461  eqSmall(E2, 2)
  li a0, 9204
  li a1, 2
  call eqSmall
  ; sci/equation.e16.ts:462  math(M_DIV, mid, E2, 0)
  li a0, 4
  li a1, 8808
  li a2, 9204
  li a3, 0
  call math
  ; sci/equation.e16.ts:463  inexact(mid)
  li a0, 8808
  call inexact
  ; sci/equation.e16.ts:464  cubicAt(mid, E3)
  li a0, 8808
  li a1, 9240
  call cubicAt
  ; sci/equation.e16.ts:465  if (isZero(E3)) break
  li a0, 9240
  call isZero
  beqz a0, .L10
  ; sci/equation.e16.ts:465  break
  j .L9
.L10:
  ; sci/equation.e16.ts:466  if (isNegative(E3) === isNegative(flo)) copyValue(mid, lo)
  li a0, 9240
  call isNegative
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 8844
  call isNegative
  lw t0, 0(sp)
  addi sp, sp, 2
  bne t0, a0, .L11
  ; sci/equation.e16.ts:466  copyValue(mid, lo)
  li a0, 8808
  li a1, 8736
  call copyValue
  j .L12
.L11:
  ; sci/equation.e16.ts:467  copyValue(mid, hi)
  li a0, 8808
  li a1, 8772
  call copyValue
.L12:
  addi s1, s1, 1
.L8:
  li t0, 80
  bltu s1, t0, .L6
.L9:
  ; sci/equation.e16.ts:469  copyValue(mid, rootAt(0))
  li a0, 8808
  li a1, 8448
  call copyValue
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

str_200:
  .byte 97, 88, 43, 98, 89, 61, 99, 0
str_201:
  .byte 97, 88, 43, 98, 89, 43, 99, 90, 61, 100, 0
str_202:
  .byte 97, 88, 132, 43, 98, 88, 43, 99, 61, 48, 0
str_203:
  .byte 97, 88, 133, 43, 98, 88, 132, 43, 99, 88, 43, 100, 61, 48, 0
str_204:
  .byte 69, 81, 85, 65, 84, 73, 79, 78, 0
str_205:
  .byte 49, 58, 97, 88, 43, 98, 89, 61, 99, 0
str_206:
  .byte 50, 58, 97, 88, 43, 98, 89, 43, 99, 90, 61, 100, 0
str_207:
  .byte 51, 58, 97, 88, 132, 43, 98, 88, 43, 99, 61, 48, 0
str_208:
  .byte 52, 58, 97, 88, 133, 43, 98, 88, 132, 43, 99, 88, 43, 100, 61, 48, 0
str_209:
  .byte 65, 67, 58, 66, 65, 67, 75, 0
str_210:
  .byte 78, 79, 32, 79, 78, 69, 32, 83, 79, 76, 85, 84, 73, 79, 78, 58, 0
str_211:
  .byte 78, 79, 78, 69, 44, 32, 79, 82, 32, 77, 65, 78, 89, 0
str_212:
  .byte 65, 67, 58, 69, 68, 73, 84, 0
str_213:
  .byte 86, 69, 82, 84, 69, 88, 0
str_214:
  .byte 88, 61, 0
str_215:
  .byte 89, 61, 0
str_216:
  .byte 141, 58, 82, 79, 79, 84, 83, 32, 32, 65, 67, 58, 69, 68, 73, 84, 0
str_217:
  .byte 142, 58, 86, 69, 82, 84, 69, 88, 32, 32, 65, 67, 58, 69, 68, 73, 84, 0
str_218:
  .byte 90, 61, 0
str_219:
  .byte 88, 49, 61, 0
str_220:
  .byte 88, 50, 61, 0
str_221:
  .byte 88, 51, 61, 0
  .align 2
