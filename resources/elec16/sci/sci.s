; Made by e16c from sci/lcd.e16.ts, sci/tokens.e16.ts, sci/numbers.e16.ts, sci/calc.e16.ts, sci/eval.e16.ts, sci/calculus.e16.ts, sci/screens.e16.ts, sci/exact.e16.ts, sci/layout.e16.ts, sci/edit.e16.ts, sci/display.e16.ts, sci/solve.e16.ts, sci/stats.e16.ts, sci/base.e16.ts, sci/grid.e16.ts, sci/table.e16.ts, sci/equation.e16.ts, sci/extras.e16.ts, sci/draw.e16.ts, sci/keymap.e16.ts, sci/consts.e16.ts, sci/cplx.e16.ts, sci/matrix.e16.ts, sci/matview.e16.ts, sci/prog.e16.ts: do not edit.

; curX at 0x0100
; curY at 0x0102
; errCode at 0x0104
; errAt at 0x0106
; errBase at 0x0108
; xTaken at 0x012e
; nsp at 0x0490
; screen at 0x04b6
; mode at 0x04b8
; length at 0x0582
; cursor at 0x0584
; answered at 0x0586
; shifted at 0x0588
; alphaOn at 0x058a
; storing at 0x058c
; recalling at 0x058e
; alphaKey at 0x0590
; overwrite at 0x0592
; hyp at 0x0594
; found at 0x0596
; historyAt at 0x0598
; shown at 0x059a
; lineAt at 0x059c
; lineLength at 0x059e
; pos at 0x05a0
; percentEnd at 0x05a2
; readFrom at 0x05c4
; readLength at 0x05c6
; exponentEnd at 0x05c8
; integrating at 0x0606
; page at 0x0618
; asking at 0x061a
; clearing at 0x061e
; funcPage at 0x0620
; smallAt at 0x06bc
; buf at 0x06be
; bufLength at 0x06c0
; slide at 0x06c2
; ink at 0x06c4
; cursorIndex at 0x06c6
; cursorX at 0x06c8
; cursorTop at 0x06ca
; boxUp at 0x06cc
; boxDown at 0x06ce
; editLength at 0x06d0
; editCursor at 0x06d2
; textLength at 0x06f4
; answerLength at 0x074e
; trimmed at 0x0750
; askingAt at 0x0752
; askingLength at 0x0754
; finding at 0x0756
; askedFor at 0x0758
; target at 0x075a
; label at 0x075c
; entryLength at 0x0786
; phase at 0x084c
; resultPage at 0x084e
; high at 0x0868
; baseFuncPage at 0x086a
; lineFrom at 0x086c
; count at 0x086e
; basePos at 0x0870
; gridKind at 0x08b6
; gridRows at 0x08b8
; gridCols at 0x08ba
; row at 0x08bc
; col at 0x08be
; firstRow at 0x08c0
; cellLength at 0x08e2
; gridBase at 0x08fc
; tableNow at 0x0904
; rangeAsked at 0x0906
; rows at 0x0908
; chosen at 0x090a
; first at 0x090c
; eqPhase at 0x090e
; vertex at 0x0910
; answers at 0x0912
; unique at 0x0914
; constOp at 0x0916
; scrollFrom at 0x0918
; constPage at 0x0932
; convPage at 0x0934
; convDone at 0x0936
; cFrom at 0x093c
; cLength at 0x093e
; cPos at 0x0940
; cDepth at 0x0942
; polarShown at 0x0964
; mFrom at 0x096c
; mLength at 0x096e
; mPos at 0x0970
; mDepth at 0x0972
; matrixAnswer at 0x0974
; mAt at 0x0976
; matNow at 0x0978
; editing at 0x097a
; rowsAsked at 0x097c
; matFuncPage at 0x0980
; progNow at 0x0982
; runFrom at 0x099c
; runLength at 0x099e
; promptLength at 0x09c8
; promptShift at 0x09e2
; promptAlpha at 0x09e4
xKept = 0x010a ; 36 bytes
nums = 0x0130 ; 864 bytes
diffValue = 0x0492 ; 36 bytes
line = 0x04ba ; 200 bytes
numberText = 0x05a4 ; 32 bytes
argument = 0x05ca ; 36 bytes
opened = 0x05ee ; 24 bytes
nodeChars = 0x0608 ; 16 bytes
digitText = 0x061c ; 2 bytes
funcPageText = 0x0622 ; 4 bytes
hexText = 0x0626 ; 6 bytes
work = 0x062c ; 64 bytes
tmpA = 0x066c ; 36 bytes
tmpB = 0x0690 ; 36 bytes
one = 0x06b4 ; 8 bytes
text = 0x06d4 ; 32 bytes
scratch = 0x06f6 ; 8 bytes
spare = 0x06fe ; 8 bytes
unit = 0x0706 ; 8 bytes
degreePart = 0x070e ; 8 bytes
minutePart = 0x0716 ; 8 bytes
answerTokens = 0x071e ; 48 bytes
entry = 0x075e ; 40 bytes
x = 0x0788 ; 36 bytes
fx = 0x07ac ; 36 bytes
step = 0x07d0 ; 36 bytes
ahead = 0x07f4 ; 36 bytes
small = 0x0818 ; 36 bytes
xText = 0x083c ; 16 bytes
titleText = 0x0850 ; 16 bytes
countChars = 0x0860 ; 8 bytes
TWO32 = 0x0872 ; 8 bytes
TWO31 = 0x087a ; 8 bytes
left = 0x0882 ; 4 bytes
right = 0x0886 ; 4 bytes
bits = 0x088a ; 4 bytes
baseText = 0x088e ; 40 bytes
cellEntry = 0x08c2 ; 32 bytes
cellText = 0x08e4 ; 24 bytes
freqText = 0x08fe ; 5 bytes
fieldText = 0x091a ; 24 bytes
pageChars = 0x0938 ; 4 bytes
cText = 0x0944 ; 32 bytes
eleven = 0x0966 ; 6 bytes
sizeText = 0x097e ; 2 bytes
listText = 0x0984 ; 24 bytes
promptLine = 0x09a0 ; 40 bytes
promptText = 0x09ca ; 24 bytes
nameText = 0x09e6 ; 4 bytes

e16c_init:
  ; curX = 0
  sw zero, 0x0100(zero)
  ; curY = 0
  sw zero, 0x0102(zero)
  ; errCode = 0
  sw zero, 0x0104(zero)
  ; errAt = 0
  sw zero, 0x0106(zero)
  ; errBase = 0
  sw zero, 0x0108(zero)
  ; xTaken = 0
  sw zero, 0x012e(zero)
  ; nsp = 0
  sw zero, 0x0490(zero)
  ; screen = 0
  sw zero, 0x04b6(zero)
  ; mode = 0
  sw zero, 0x04b8(zero)
  ; length = 0
  sw zero, 0x0582(zero)
  ; cursor = 0
  sw zero, 0x0584(zero)
  ; answered = 0
  sw zero, 0x0586(zero)
  ; shifted = 0
  sw zero, 0x0588(zero)
  ; alphaOn = 0
  sw zero, 0x058a(zero)
  ; storing = 0
  sw zero, 0x058c(zero)
  ; recalling = 0
  sw zero, 0x058e(zero)
  ; alphaKey = 0
  sw zero, 0x0590(zero)
  ; overwrite = 0
  sw zero, 0x0592(zero)
  ; hyp = 0
  sw zero, 0x0594(zero)
  ; found = 0
  sw zero, 0x0596(zero)
  ; historyAt = 65535
  li t0, 65535
  sw t0, 0x0598(zero)
  ; shown = 0
  sw zero, 0x059a(zero)
  ; lineAt = 0
  sw zero, 0x059c(zero)
  ; lineLength = 0
  sw zero, 0x059e(zero)
  ; pos = 0
  sw zero, 0x05a0(zero)
  ; percentEnd = 65535
  li t0, 65535
  sw t0, 0x05a2(zero)
  ; readFrom = 0
  sw zero, 0x05c4(zero)
  ; readLength = 0
  sw zero, 0x05c6(zero)
  ; exponentEnd = 0
  sw zero, 0x05c8(zero)
  ; integrating = 0
  sw zero, 0x0606(zero)
  ; page = 0
  sw zero, 0x0618(zero)
  ; asking = 0
  sw zero, 0x061a(zero)
  ; clearing = 0
  sw zero, 0x061e(zero)
  ; funcPage = 0
  sw zero, 0x0620(zero)
  ; smallAt = 0
  sw zero, 0x06bc(zero)
  ; buf = 0
  sw zero, 0x06be(zero)
  ; bufLength = 0
  sw zero, 0x06c0(zero)
  ; slide = 0
  sw zero, 0x06c2(zero)
  ; ink = 0
  sw zero, 0x06c4(zero)
  ; cursorIndex = 65535
  li t0, 65535
  sw t0, 0x06c6(zero)
  ; cursorX = 0
  sw zero, 0x06c8(zero)
  ; cursorTop = 0
  sw zero, 0x06ca(zero)
  ; boxUp = 0
  sw zero, 0x06cc(zero)
  ; boxDown = 0
  sw zero, 0x06ce(zero)
  ; editLength = 0
  sw zero, 0x06d0(zero)
  ; editCursor = 0
  sw zero, 0x06d2(zero)
  ; textLength = 0
  sw zero, 0x06f4(zero)
  ; answerLength = 0
  sw zero, 0x074e(zero)
  ; trimmed = 0
  sw zero, 0x0750(zero)
  ; askingAt = 0
  sw zero, 0x0752(zero)
  ; askingLength = 0
  sw zero, 0x0754(zero)
  ; finding = 0
  sw zero, 0x0756(zero)
  ; askedFor = 0
  sw zero, 0x0758(zero)
  ; target = 0
  sw zero, 0x075a(zero)
  ; label = 0
  sw zero, 0x075c(zero)
  ; entryLength = 0
  sw zero, 0x0786(zero)
  ; phase = 0
  sw zero, 0x084c(zero)
  ; resultPage = 0
  sw zero, 0x084e(zero)
  ; high = 0
  sw zero, 0x0868(zero)
  ; baseFuncPage = 0
  sw zero, 0x086a(zero)
  ; lineFrom = 0
  sw zero, 0x086c(zero)
  ; count = 0
  sw zero, 0x086e(zero)
  ; basePos = 0
  sw zero, 0x0870(zero)
  ; gridKind = 0
  sw zero, 0x08b6(zero)
  ; gridRows = 0
  sw zero, 0x08b8(zero)
  ; gridCols = 0
  sw zero, 0x08ba(zero)
  ; row = 0
  sw zero, 0x08bc(zero)
  ; col = 0
  sw zero, 0x08be(zero)
  ; firstRow = 0
  sw zero, 0x08c0(zero)
  ; cellLength = 0
  sw zero, 0x08e2(zero)
  ; gridBase = 0
  sw zero, 0x08fc(zero)
  ; tableNow = 0
  sw zero, 0x0904(zero)
  ; rangeAsked = 0
  sw zero, 0x0906(zero)
  ; rows = 0
  sw zero, 0x0908(zero)
  ; chosen = 0
  sw zero, 0x090a(zero)
  ; first = 0
  sw zero, 0x090c(zero)
  ; eqPhase = 0
  sw zero, 0x090e(zero)
  ; vertex = 0
  sw zero, 0x0910(zero)
  ; answers = 0
  sw zero, 0x0912(zero)
  ; unique = 1
  li t0, 1
  sw t0, 0x0914(zero)
  ; constOp = 0
  sw zero, 0x0916(zero)
  ; scrollFrom = 0
  sw zero, 0x0918(zero)
  ; constPage = 0
  sw zero, 0x0932(zero)
  ; convPage = 0
  sw zero, 0x0934(zero)
  ; convDone = 0
  sw zero, 0x0936(zero)
  ; cFrom = 0
  sw zero, 0x093c(zero)
  ; cLength = 0
  sw zero, 0x093e(zero)
  ; cPos = 0
  sw zero, 0x0940(zero)
  ; cDepth = 0
  sw zero, 0x0942(zero)
  ; polarShown = 0
  sw zero, 0x0964(zero)
  ; mFrom = 0
  sw zero, 0x096c(zero)
  ; mLength = 0
  sw zero, 0x096e(zero)
  ; mPos = 0
  sw zero, 0x0970(zero)
  ; mDepth = 0
  sw zero, 0x0972(zero)
  ; matrixAnswer = 0
  sw zero, 0x0974(zero)
  ; mAt = 0
  sw zero, 0x0976(zero)
  ; matNow = 0
  sw zero, 0x0978(zero)
  ; editing = 0
  sw zero, 0x097a(zero)
  ; rowsAsked = 0
  sw zero, 0x097c(zero)
  ; matFuncPage = 0
  sw zero, 0x0980(zero)
  ; progNow = 0
  sw zero, 0x0982(zero)
  ; runFrom = 0
  sw zero, 0x099c(zero)
  ; runLength = 0
  sw zero, 0x099e(zero)
  ; promptLength = 0
  sw zero, 0x09c8(zero)
  ; promptShift = 0
  sw zero, 0x09e2(zero)
  ; promptAlpha = 0
  sw zero, 0x09e4(zero)
  ; xKept: 36 bytes of 0
  li t0, 0x010a
  li t1, 36
  mset t0, zero, t1
  ; nums: 864 bytes of 0
  li t0, 0x0130
  li t1, 864
  mset t0, zero, t1
  ; diffValue: 36 bytes of 0
  li t0, 0x0492
  li t1, 36
  mset t0, zero, t1
  ; line: 200 bytes of 0
  li t0, 0x04ba
  li t1, 200
  mset t0, zero, t1
  ; numberText: 32 bytes of 0
  li t0, 0x05a4
  li t1, 32
  mset t0, zero, t1
  ; argument, opened: 60 bytes of 0
  li t0, 0x05ca
  li t1, 60
  mset t0, zero, t1
  ; nodeChars: 16 bytes of 0
  li t0, 0x0608
  li t1, 16
  mset t0, zero, t1
  ; digitText: 2 bytes of 0
  li t0, 0x061c
  li t1, 2
  mset t0, zero, t1
  ; funcPageText, hexText, work, tmpA, tmpB, one: 154 bytes of 0
  li t0, 0x0622
  li t1, 154
  mset t0, zero, t1
  ; text: 32 bytes of 0
  li t0, 0x06d4
  li t1, 32
  mset t0, zero, t1
  ; scratch, spare, unit, degreePart, minutePart, answerTokens: 88 bytes of 0
  li t0, 0x06f6
  li t1, 88
  mset t0, zero, t1
  ; entry: 40 bytes of 0
  li t0, 0x075e
  li t1, 40
  mset t0, zero, t1
  ; x, fx, step, ahead, small, xText: 196 bytes of 0
  li t0, 0x0788
  li t1, 196
  mset t0, zero, t1
  ; titleText, countChars: 24 bytes of 0
  li t0, 0x0850
  li t1, 24
  mset t0, zero, t1
  ; TWO32, TWO31, left, right, bits, baseText: 68 bytes of 0
  li t0, 0x0872
  li t1, 68
  mset t0, zero, t1
  ; cellEntry: 32 bytes of 0
  li t0, 0x08c2
  li t1, 32
  mset t0, zero, t1
  ; cellText: 24 bytes of 0
  li t0, 0x08e4
  li t1, 24
  mset t0, zero, t1
  ; freqText: 6 bytes of 0
  li t0, 0x08fe
  li t1, 6
  mset t0, zero, t1
  ; fieldText: 24 bytes of 0
  li t0, 0x091a
  li t1, 24
  mset t0, zero, t1
  ; pageChars: 4 bytes of 0
  li t0, 0x0938
  li t1, 4
  mset t0, zero, t1
  ; cText: 32 bytes of 0
  li t0, 0x0944
  li t1, 32
  mset t0, zero, t1
  ; eleven: 6 bytes of 0
  li t0, 0x0966
  li t1, 6
  mset t0, zero, t1
  ; sizeText: 2 bytes of 0
  li t0, 0x097e
  li t1, 2
  mset t0, zero, t1
  ; listText: 24 bytes of 0
  li t0, 0x0984
  li t1, 24
  mset t0, zero, t1
  ; promptLine: 40 bytes of 0
  li t0, 0x09a0
  li t1, 40
  mset t0, zero, t1
  ; promptText: 24 bytes of 0
  li t0, 0x09ca
  li t1, 24
  mset t0, zero, t1
  ; nameText: 4 bytes of 0
  li t0, 0x09e6
  li t1, 4
  mset t0, zero, t1
  ret

; sci/lcd.e16.ts:50 cls() at -O1
cls:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/lcd.e16.ts:51  memset(VRAM, 0, WIDTH * BANDS)
  li a0, 57344
  li a1, 0
  li a2, 1024
  mset a0, a1, a2
  ; sci/lcd.e16.ts:52  curX = 0
  sw zero, 0x0100(zero)
  ; sci/lcd.e16.ts:53  curY = 0
  sw zero, 0x0102(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/lcd.e16.ts:57 drawChar(c, column/at, row) at -O1
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
  ; sci/lcd.e16.ts:58  const at = VRAM + row * WIDTH + column * 6
  slli t0, s3, 7
  slli t2, s1, 2
  slli t1, s1, 1
  add t1, t1, t2
  addi t0, t0, -8192
  add s1, t0, t1
  ; sci/lcd.e16.ts:59  memcpy(at, font_base() + (c - FIRST_CODE) * 5, 5)
  call font_base
  addi t0, s2, -32
  slli t1, t0, 2
  add t0, t1, t0
  add a1, a0, t0
  mv a0, s1
  li a2, 5
  mcpy a0, a1, a2
  ; sci/lcd.e16.ts:60  poke(at + 5, 0)
  sb zero, 5(s1)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/lcd.e16.ts:69 newline() at -O1
newline:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/lcd.e16.ts:70  curX = 0
  sw zero, 0x0100(zero)
  ; sci/lcd.e16.ts:71  if (curY + 1 < ROWS) {
  lw t0, 0x0102(zero)
  li t1, 8
  addi t0, t0, 1
  bgeu t0, t1, .L1
  ; sci/lcd.e16.ts:72  curY++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; sci/lcd.e16.ts:73  return
  j .return
.L1:
  ; sci/lcd.e16.ts:75  scroll()
  ; sci/lcd.e16.ts:65  memcpy(VRAM, VRAM + WIDTH, WIDTH * (BANDS - 1))
  li a0, 57344
  li a1, 57472
  li a2, 896
  mcpy a0, a1, a2
  ; sci/lcd.e16.ts:66  memset(VRAM + WIDTH * (BANDS - 1), 0, WIDTH)
  li a0, 58240
  li a1, 0
  li a2, 128
  mset a0, a1, a2
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/lcd.e16.ts:78 putc(c) at -O1
;   c in s1
putc:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; sci/lcd.e16.ts:79  if (c === CH_CR) {
  li t0, 13
  bne s1, t0, .L1
  ; sci/lcd.e16.ts:80  newline()
  call newline
  ; sci/lcd.e16.ts:81  return
  j .return
.L1:
  ; sci/lcd.e16.ts:83  if (c === CH_CLS) {
  li t0, 12
  bne s1, t0, .L2
  ; sci/lcd.e16.ts:84  cls()
  call cls
  ; sci/lcd.e16.ts:85  return
  j .return
.L2:
  ; sci/lcd.e16.ts:87  if (c === CH_BS) {
  li t0, 8
  bne s1, t0, .L3
  ; sci/lcd.e16.ts:88  if (curX > 0) curX--
  lw t0, 0x0100(zero)
  bgeu zero, t0, .L4
  ; sci/lcd.e16.ts:88  curX--
  lw t0, 0x0100(zero)
  addi t0, t0, -1
  sw t0, 0x0100(zero)
.L4:
  ; sci/lcd.e16.ts:89  return
  j .return
.L3:
  ; sci/lcd.e16.ts:91  if (c < FIRST_CODE) return
  li t0, 32
  bgeu s1, t0, .L5
  ; sci/lcd.e16.ts:91  return
  j .return
.L5:
  ; sci/lcd.e16.ts:92  drawChar(c, curX, curY)
  lw a1, 0x0100(zero)
  lw a2, 0x0102(zero)
  mv a0, s1
  call drawChar
  ; sci/lcd.e16.ts:93  curX++
  lw t0, 0x0100(zero)
  addi t0, t0, 1
  sw t0, 0x0100(zero)
  ; sci/lcd.e16.ts:94  if (curX >= COLS) newline()
  li t1, 21
  bltu t0, t1, .L6
  ; sci/lcd.e16.ts:94  newline()
  call newline
.L6:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/lcd.e16.ts:97 puts(at/p) at -O1
;   at/p in s1
puts:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at/p
  ; sci/lcd.e16.ts:98  let p = at
  ; sci/lcd.e16.ts:99  while (peek(p) !== 0) {
  j .L3
.L1:
  ; sci/lcd.e16.ts:100  putc(peek(p))
  lbu a0, 0(s1)
  call putc
  ; sci/lcd.e16.ts:101  p++
  addi s1, s1, 1
.L3:
  lbu t0, 0(s1)
  bne t0, zero, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/lcd.e16.ts:105 locate(column, row) at -O1
;   column in a0
;   row in a1
locate:
  ; sci/lcd.e16.ts:106  curX = column < COLS ? column : COLS - 1
  li t0, 21
  bgeu a0, t0, .L1
  mv t0, a0
  j .L2
.L1:
  li t0, 20
.L2:
  sw t0, 0x0100(zero)
  ; sci/lcd.e16.ts:107  curY = row < ROWS ? row : ROWS - 1
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

; sci/lcd.e16.ts:110 puthex(v) at -O1
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
  ; sci/lcd.e16.ts:111  for (let s: u16 = 0; s < 4; s++) {
  li s1, 0 ; s
  j .L3
.L1:
  ; sci/lcd.e16.ts:112  const d = (v >> (12 - s * 4)) & 15
  slli t0, s1, 2
  li t1, 12
  sub t1, t1, t0
  srl t1, s3, t1
  andi s2, t1, 15
  ; sci/lcd.e16.ts:113  putc(d < 10 ? 0x30 + d : 0x37 + d)
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

; sci/lcd.e16.ts:118 centre(row, at, length) at -O1
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
  ; sci/lcd.e16.ts:119  locate((COLS - length) >> 1, row)
  li t0, 21
  sub t0, t0, s3
  srli a0, t0, 1
  mv a1, s1
  call locate
  ; sci/lcd.e16.ts:120  puts(at)
  mv a0, s2
  call puts
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/lcd.e16.ts:126 barAt(column/x, row) at -O1
;   column/x in a0
;   row in a1
barAt:
  ; sci/lcd.e16.ts:127  const x = column === 0 ? 0 : column * 6 - 1
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
  ; sci/lcd.e16.ts:128  poke16(IO_CURSOR, row * 8 * 256 + x)
  slli t0, a1, 3
  slli t0, t0, 8
  add t0, t0, a0
  li t1, 65322
  sw t0, 0(t1)
  ; sci/lcd.e16.ts:129  poke16(IO_CURMODE, BAR_8)
  li t0, 71
  li t1, 65324
  sw t0, 0(t1)
.return:
  ret

; sci/lcd.e16.ts:133 barDots(x, top) at -O1
;   x in a0
;   top in a1
barDots:
  ; sci/lcd.e16.ts:134  poke16(IO_CURSOR, top * 256 + x)
  slli t0, a1, 8
  add t0, t0, a0
  li t1, 65322
  sw t0, 0(t1)
  ; sci/lcd.e16.ts:135  poke16(IO_CURMODE, BAR_8)
  li t0, 71
  li t1, 65324
  sw t0, 0(t1)
.return:
  ret

; sci/lcd.e16.ts:138 noCursor() at -O1
noCursor:
  ; sci/lcd.e16.ts:139  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
.return:
  ret

; sci/lcd.e16.ts:142 marks(bits) at -O1
;   bits in a0
marks:
  ; sci/lcd.e16.ts:143  poke16(IO_ANNUNCIATORS, bits)
  li t0, 65326
  sw a0, 0(t0)
.return:
  ret

; sci/lcd.e16.ts:149 bigGlyph(index/glyph, x) at -O1
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
  ; sci/lcd.e16.ts:150  const glyph = big_base() + index * BIG_WIDTH * 2
  call big_base
  slli t1, s2, 3
  sub t0, t1, s2
  slli t0, t0, 1
  add s2, a0, t0
  ; sci/lcd.e16.ts:151  for (let c: u16 = 0; c < BIG_WIDTH; c++) {
  li s1, 0 ; c
  j .L3
.L1:
  ; sci/lcd.e16.ts:152  const word = peek16(glyph + c * 2)
  slli t0, s1, 1
  add t0, s2, t0
  lw s0, 0(t0)
  ; sci/lcd.e16.ts:153  poke(VRAM + BIG_BAND * WIDTH + x + c, word & 0xff)
  addi t0, s3, -7424
  add t0, t0, s1
  andi t1, s0, 255
  sb t1, 0(t0)
  ; sci/lcd.e16.ts:154  poke(VRAM + (BIG_BAND + 1) * WIDTH + x + c, word >> 8)
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

; sci/lcd.e16.ts:169 bigNumber(at, length/i, right/x) at -O1
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
  ; sci/lcd.e16.ts:170  let x = right + 1
  addi s1, s1, 1
  ; sci/lcd.e16.ts:171  let i = length
  ; sci/lcd.e16.ts:172  while (i > 0) {
  j .L3
.L1:
  ; sci/lcd.e16.ts:173  i--
  addi s3, s3, -1
  ; sci/lcd.e16.ts:174  const c = peek(at + i)
  add t0, s0, s3
  lbu s2, 0(t0)
  ; sci/lcd.e16.ts:175  if (c === 0x2e) {
  li t0, 46
  bne s2, t0, .L5
  ; sci/lcd.e16.ts:176  x -= 3
  addi s1, s1, -3
  ; sci/lcd.e16.ts:177  bigPoint(x)
  ; sci/lcd.e16.ts:160  const at = VRAM + (BIG_BAND + 1) * WIDTH + x
  addi s2, s1, -7296
  ; sci/lcd.e16.ts:161  poke(at, peek(at) | 0x30)
  lbu t0, 0(s2)
  ori t0, t0, 48
  sb t0, 0(s2)
  ; sci/lcd.e16.ts:162  poke(at + 1, peek(at + 1) | 0x30)
  lbu t0, 1(s2)
  ori t0, t0, 48
  sb t0, 1(s2)
  j .L6
.L5:
  ; sci/lcd.e16.ts:179  x -= BIG_PITCH
  addi s1, s1, -8
  ; sci/lcd.e16.ts:180  bigGlyph(c === 0x2d ? 10 : c - 0x30, x)
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
  ; sci/lcd.e16.ts:183  return x
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/lcd.e16.ts:189 dot(x/at, y) at -O1
;   x/at in a0
;   y in a1
dot:
  ; sci/lcd.e16.ts:190  if (x >= WIDTH || y >= BANDS * 8) return
  li t0, 128
  bgeu a0, t0, .L2
  li t0, 64
  bltu a1, t0, .L1
.L2:
  ; sci/lcd.e16.ts:190  return
  ret
.L1:
  ; sci/lcd.e16.ts:191  const at = VRAM + (y >> 3) * WIDTH + x
  srli t0, a1, 3
  slli t0, t0, 7
  addi t0, t0, -8192
  add a0, t0, a0
  ; sci/lcd.e16.ts:192  poke(at, peek(at) | (1 << (y & 7)))
  lbu t0, 0(a0)
  andi t1, a1, 7
  li t2, 1
  sll t2, t2, t1
  or t0, t0, t2
  sb t0, 0(a0)
.return:
  ret

; sci/lcd.e16.ts:198 glyphAt(c/src, x, y/shift) at -O1
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
  ; sci/lcd.e16.ts:199  const src = font_base() + (c - FIRST_CODE) * 5
  call font_base
  lw t0, 0(sp) ; c/src
  addi t0, t0, -32
  slli t1, t0, 2
  add t0, t1, t0
  add t0, a0, t0
  sw t0, 0(sp) ; c/src
  ; sci/lcd.e16.ts:200  const band = y >> 3
  srli s0, s2, 3
  ; sci/lcd.e16.ts:201  const shift = y & 7
  andi s2, s2, 7
  ; sci/lcd.e16.ts:202  for (let k: u16 = 0; k < 5; k++) {
  li s1, 0 ; k
  j .L3
.L1:
  ; sci/lcd.e16.ts:203  const col = peek(src + k) << shift
  lw t0, 0(sp) ; c/src
  add t0, t0, s1
  lbu t0, 0(t0)
  sll t0, t0, s2
  sw t0, 4(sp) ; col
  ; sci/lcd.e16.ts:204  if (x + k >= WIDTH) return
  lw t0, 2(sp) ; x
  add t0, t0, s1
  li t1, 128
  bltu t0, t1, .L5
  ; sci/lcd.e16.ts:204  return
  j .return
.L5:
  ; sci/lcd.e16.ts:205  if (band < BANDS) {
  li t0, 8
  bgeu s0, t0, .L6
  ; sci/lcd.e16.ts:206  const at = VRAM + band * WIDTH + x + k
  slli t0, s0, 7
  lw t1, 2(sp) ; x
  addi t0, t0, -8192
  add t0, t0, t1
  add s3, t0, s1
  ; sci/lcd.e16.ts:207  poke(at, peek(at) | (col & 0xff))
  lbu t0, 0(s3)
  lw t1, 4(sp) ; col
  andi t1, t1, 255
  or t0, t0, t1
  sb t0, 0(s3)
.L6:
  ; sci/lcd.e16.ts:209  if (shift !== 0 && band + 1 < BANDS) {
  beq s2, zero, .L7
  li t0, 8
  addi t1, s0, 1
  bgeu t1, t0, .L7
  ; sci/lcd.e16.ts:210  const below = VRAM + (band + 1) * WIDTH + x + k
  addi t0, s0, 1
  slli t0, t0, 7
  lw t1, 2(sp) ; x
  addi t0, t0, -8192
  add t0, t0, t1
  add s3, t0, s1
  ; sci/lcd.e16.ts:211  poke(below, peek(below) | (col >> 8))
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

; sci/lcd.e16.ts:217 textAt(at/p, x/left, y) at -O1
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
  ; sci/lcd.e16.ts:218  let p = at
  ; sci/lcd.e16.ts:219  let left = x
  ; sci/lcd.e16.ts:220  while (peek(p) !== 0) {
  j .L3
.L1:
  ; sci/lcd.e16.ts:221  glyphAt(peek(p), left, y)
  lbu a0, 0(s1)
  mv a1, s2
  mv a2, s3
  call glyphAt
  ; sci/lcd.e16.ts:222  left += 6
  addi s2, s2, 6
  ; sci/lcd.e16.ts:223  p++
  addi s1, s1, 1
.L3:
  lbu t0, 0(s1)
  bne t0, zero, .L1
  ; sci/lcd.e16.ts:225  return left
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/lcd.e16.ts:229 textRight(at, y) at -O1
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
  ; sci/lcd.e16.ts:230  let n: u16 = 0
  li s1, 0 ; n
  ; sci/lcd.e16.ts:231  while (peek(at + n) !== 0) n++
  j .L3
.L1:
  ; sci/lcd.e16.ts:231  n++
  addi s1, s1, 1
.L3:
  add t0, s2, s1
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; sci/lcd.e16.ts:232  textAt(at, WIDTH + 1 - n * 6, y)
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

; sci/lcd.e16.ts:236 invertBox(x0, y0/y, x1, y1) at -O1
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
  ; sci/lcd.e16.ts:237  for (let y = y0; y <= y1 && y < BANDS * 8; y++) {
  j .L3
.L1:
  ; sci/lcd.e16.ts:238  const bit = 1 << (y & 7)
  andi t0, a1, 7
  li t1, 1
  sll s3, t1, t0
  ; sci/lcd.e16.ts:239  const row = VRAM + (y >> 3) * WIDTH
  srli t0, a1, 3
  slli t0, t0, 7
  addi s2, t0, -8192
  ; sci/lcd.e16.ts:240  for (let x = x0; x <= x1 && x < WIDTH; x++) poke(row + x, peek(row + x) ^ bit)
  mv s1, a0 ; x
  j .L7
.L5:
  ; sci/lcd.e16.ts:240  poke(row + x, peek(row + x) ^ bit)
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

; sci/lcd.e16.ts:248 band(at) at -O1
;   at in s1
band:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; sci/lcd.e16.ts:249  bandWith(at, 0)
  mv a0, s1
  li a1, 0
  call bandWith
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/lcd.e16.ts:256 bandWith(at, right) at -O1
;   at in s2
;   right in s1
bandWith:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; at
  mv s1, a1 ; right
  ; sci/lcd.e16.ts:257  cls()
  call cls
  ; sci/lcd.e16.ts:258  textAt(at, 1, 1)
  mv a0, s2
  li a1, 1
  li a2, 1
  call textAt
  ; sci/lcd.e16.ts:259  if (right !== 0) textRight(right, 1)
  beq s1, zero, .L1
  ; sci/lcd.e16.ts:259  textRight(right, 1)
  mv a0, s1
  li a1, 1
  call textRight
.L1:
  ; sci/lcd.e16.ts:260  invertBox(0, 0, WIDTH - 1, 8)
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

; sci/lcd.e16.ts:264 lineY(n) at -O1
;   n in a0
lineY:
  ; sci/lcd.e16.ts:265  return 11 + n * 9
  slli t1, a0, 3
  add t0, t1, a0
  addi a0, t0, 11
.return:
  ret

; sci/lcd.e16.ts:269 mark(col, length, n/y) at -O1
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
  ; sci/lcd.e16.ts:270  const y = lineY(n)
  mv a0, s1
  call lineY
  mv s1, a0 ; n/y
  ; sci/lcd.e16.ts:271  invertBox(col * 6, y - 1, col * 6 + length * 6, y + 7)
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

; sci/tokens.e16.ts:167 isConstant(t) at -O1
;   t in a0
isConstant:
  ; sci/tokens.e16.ts:168  return t >= T_CONST && t <= T_CONST_LAST
  li t0, 192
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L1
  li t0, 211
  sltu t0, t0, a0
  xori t0, t0, 1
.L1:
  mv a0, t0
.return:
  ret

; sci/tokens.e16.ts:172 isStatValue(t) at -O1
;   t in a0
isStatValue:
  ; sci/tokens.e16.ts:173  return (t >= T_STAT_N && t <= 0x9f) || (t >= 0xf4 && t <= T_STAT_LAST) || t === T_STAT_C
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

; sci/tokens.e16.ts:177 statIndex(t) at -O1
;   t in a0
statIndex:
  ; sci/tokens.e16.ts:178  if (t === T_STAT_C) return 15
  li t0, 252
  bne a0, t0, .L1
  ; sci/tokens.e16.ts:178  return 15
  li a0, 15
  ret
.L1:
  ; sci/tokens.e16.ts:179  return t <= 0x9f ? t - T_STAT_N : t - 0xf4 + 9
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

; sci/tokens.e16.ts:183 opensTemplate(t) at -O1
;   t in a0
opensTemplate:
  ; sci/tokens.e16.ts:184  return t === T_FRAC || t === T_ROOT || t === T_POWT || t === T_MIXED || t === T_XROOT
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

; sci/tokens.e16.ts:188 isSeparator(t) at -O1
;   t in a0
isSeparator:
  ; sci/tokens.e16.ts:189  return t === T_SEP || t === T_MSEP || t === T_MDIV || t === T_XSEP
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

; sci/tokens.e16.ts:193 isFunction(t) at -O1
;   t in a0
isFunction:
  ; sci/tokens.e16.ts:194  return (
  li t0, 1
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L6
  li t0, 10
  sltu t0, t0, a0
  xori t0, t0, 1
.L6:
  mv t1, t0
  bnez t1, .L5
  li t0, 224
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L7
  li t0, 236
  sltu t0, t0, a0
  xori t0, t0, 1
.L7:
.L5:
  mv t1, t0
  bnez t1, .L4
  li t0, 160
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L8
  li t0, 171
  sltu t0, t0, a0
  xori t0, t0, 1
.L8:
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

; sci/tokens.e16.ts:205 takesTwo(t) at -O1
;   t in a0
takesTwo:
  ; sci/tokens.e16.ts:206  return t === T_GCD || t === T_LCM || t === T_POL || t === T_REC
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

; sci/tokens.e16.ts:210 isVariable(t) at -O1
;   t in a0
isVariable:
  ; sci/tokens.e16.ts:211  return (t >= 0x41 && t <= 0x46) || t === 0x58 || t === 0x59 || t === 0x4d
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

; sci/tokens.e16.ts:214 isDigit(t) at -O1
;   t in a0
isDigit:
  ; sci/tokens.e16.ts:215  return t >= 0x30 && t <= 0x39
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

; sci/tokens.e16.ts:219 tokenText(t) at -O1
;   t in s1
tokenText:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/tokens.e16.ts:221  if (t >= T_DERIV || isStatValue(t)) return extName(t)
  li t0, 160
  bgeu s1, t0, .L2
  mv a0, s1
  call isStatValue
  beqz a0, .L1
.L2:
  ; sci/tokens.e16.ts:221  return extName(t)
  mv a0, s1
  la t0, extName
  li t1, 10
  call far_call
  j .return
.L1:
  ; sci/tokens.e16.ts:222  switch (t) {
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
  ; sci/tokens.e16.ts:224  return str('sin(')
  la a0, str_0
  j .return
.L5:
  ; sci/tokens.e16.ts:226  return str('cos(')
  la a0, str_1
  j .return
.L6:
  ; sci/tokens.e16.ts:228  return str('tan(')
  la a0, str_2
  j .return
.L7:
  ; sci/tokens.e16.ts:230  return str('sin\x86(')
  la a0, str_3
  j .return
.L8:
  ; sci/tokens.e16.ts:232  return str('cos\x86(')
  la a0, str_4
  j .return
.L9:
  ; sci/tokens.e16.ts:234  return str('tan\x86(')
  la a0, str_5
  j .return
.L10:
  ; sci/tokens.e16.ts:236  return str('log(')
  la a0, str_6
  j .return
.L11:
  ; sci/tokens.e16.ts:238  return str('ln(')
  la a0, str_7
  j .return
.L12:
  ; sci/tokens.e16.ts:240  return str('\x83(')
  la a0, str_8
  j .return
.L13:
  ; sci/tokens.e16.ts:242  return str('\x85\x83(')
  la a0, str_9
  j .return
.L14:
  ; sci/tokens.e16.ts:244  return str('-')
  la a0, str_10
  j .return
.L15:
  ; sci/tokens.e16.ts:246  return str('^(')
  la a0, str_11
  j .return
.L16:
  ; sci/tokens.e16.ts:248  return str('C')
  la a0, str_12
  j .return
.L17:
  ; sci/tokens.e16.ts:250  return str('P')
  la a0, str_13
  j .return
.L18:
  ; sci/tokens.e16.ts:252  return str('Ans')
  la a0, str_14
  j .return
.L19:
  ; sci/tokens.e16.ts:254  return str('10')
  la a0, str_15
  j .return
.L20:
  ; sci/tokens.e16.ts:257  return str('(')
  la a0, str_16
  j .return
.L21:
  ; sci/tokens.e16.ts:259  return str(')/(')
  la a0, str_17
  j .return
.L22:
  ; sci/tokens.e16.ts:261  return str(')')
  la a0, str_18
  j .return
.L23:
  ; sci/tokens.e16.ts:263  return str('\x83(')
  la a0, str_8
  j .return
.L24:
  ; sci/tokens.e16.ts:265  return str('^(')
  la a0, str_11
  j .return
.L25:
  ; sci/tokens.e16.ts:267  return str('/')
  la a0, str_19
  j .return
.L26:
  ; sci/tokens.e16.ts:269  return str('dice')
  la a0, str_20
  j .return
.L27:
  ; sci/tokens.e16.ts:271  return str('coin')
  la a0, str_21
  j .return
.L28:
  ; sci/tokens.e16.ts:273  return str('rint')
  la a0, str_22
  j .return
.L29:
  ; sci/tokens.e16.ts:275  return str('(')
  la a0, str_16
  j .return
.L30:
  ; sci/tokens.e16.ts:277  return str(' ')
  la a0, str_23
  j .return
.L31:
  ; sci/tokens.e16.ts:279  return str('/')
  la a0, str_19
  j .return
.L32:
  ; sci/tokens.e16.ts:281  return str('(')
  la a0, str_16
  j .return
.L33:
  ; sci/tokens.e16.ts:283  return str(')\x83(')
  la a0, str_24
  j .return
.L3:
  ; sci/tokens.e16.ts:285  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/numbers.e16.ts:98 errFrom(base) at -O1
;   base in a0
errFrom:
  ; sci/numbers.e16.ts:99  errBase = base
  sw a0, 0x0108(zero)
.return:
  ret

; sci/numbers.e16.ts:103 fail(code, at) at -O1
;   code in s1
;   at in s2
fail:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; code
  mv s2, a1 ; at
  ; sci/numbers.e16.ts:104  errCode = code
  sw s1, 0x0104(zero)
  ; sci/numbers.e16.ts:105  errAt = (errBase & ERR_PINNED) !== 0 ? errBase & 0x7fff : at + errBase
  lw t0, 0x0108(zero)
  li t1, 32768
  and t0, t0, t1
  beq t0, zero, .L1
  lw t0, 0x0108(zero)
  li t1, 32767
  and t0, t0, t1
  j .L2
.L1:
  lw t0, 0x0108(zero)
  add t0, s2, t0
.L2:
  sw t0, 0x0106(zero)
  ; sci/numbers.e16.ts:106  errBase = 0
  sw zero, 0x0108(zero)
  ; sci/numbers.e16.ts:107  calc_abort()
  call calc_abort
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/numbers.e16.ts:117 holdX() at -O1
holdX:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/numbers.e16.ts:118  if (xTaken === 0) copyValue(varAt(0x58), addr(xKept))
  lw t0, 0x012e(zero)
  bne t0, zero, .L1
  ; sci/numbers.e16.ts:118  copyValue(varAt(0x58), addr(xKept))
  li a0, 3336
  la a1, xKept
  call copyValue
.L1:
  ; sci/numbers.e16.ts:119  xTaken++
  lw t0, 0x012e(zero)
  addi t0, t0, 1
  sw t0, 0x012e(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/numbers.e16.ts:122 releaseX() at -O1
releaseX:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/numbers.e16.ts:123  xTaken--
  lw t0, 0x012e(zero)
  addi t0, t0, -1
  sw t0, 0x012e(zero)
  ; sci/numbers.e16.ts:124  if (xTaken === 0) copyValue(addr(xKept), varAt(0x58))
  bne t0, zero, .L1
  ; sci/numbers.e16.ts:124  copyValue(addr(xKept), varAt(0x58))
  la a0, xKept
  li a1, 3336
  call copyValue
.L1:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/numbers.e16.ts:128 xBack() at -O1
xBack:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/numbers.e16.ts:129  if (xTaken === 0) return
  lw t0, 0x012e(zero)
  bne t0, zero, .L1
  ; sci/numbers.e16.ts:129  return
  j .return
.L1:
  ; sci/numbers.e16.ts:130  xTaken = 0
  sw zero, 0x012e(zero)
  ; sci/numbers.e16.ts:131  copyValue(addr(xKept), varAt(0x58))
  la a0, xKept
  li a1, 3336
  call copyValue
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/numbers.e16.ts:144 copyValue(from, to) at -O1
;   from in s1
;   to in s2
copyValue:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; from
  mv s2, a1 ; to
  ; sci/numbers.e16.ts:145  memcpy(to, from, VALUE_SIZE)
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

; sci/numbers.e16.ts:149 copy8(from, to) at -O1
;   from in s1
;   to in s2
copy8:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; from
  mv s2, a1 ; to
  ; sci/numbers.e16.ts:150  memcpy(to, from, 8)
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

; sci/numbers.e16.ts:154 inexact(v) at -O1
;   v in a0
inexact:
  ; sci/numbers.e16.ts:155  poke16(v + V_EXACT, 0)
  sw zero, 8(a0)
.return:
  ret

; sci/numbers.e16.ts:158 isExact(v) at -O1
;   v in a0
isExact:
  ; sci/numbers.e16.ts:159  return peek16(v + V_EXACT) !== 0
  lw t0, 8(a0)
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; sci/numbers.e16.ts:257 varAt(letter) at -O1
;   letter in a0
;   k in a1
varAt:
  ; sci/numbers.e16.ts:258  let k: u16 = 0
  li a1, 0 ; k
  ; sci/numbers.e16.ts:259  if (letter >= 0x41 && letter <= 0x46) k = letter - 0x41
  li t0, 65
  bltu a0, t0, .L1
  li t0, 70
  bltu t0, a0, .L1
  ; sci/numbers.e16.ts:259  k = letter - 0x41
  addi a1, a0, -65
  j .L2
.L1:
  ; sci/numbers.e16.ts:260  if (letter === 0x58) k = 6
  li t0, 88
  bne a0, t0, .L3
  ; sci/numbers.e16.ts:260  k = 6
  li a1, 6 ; k
  j .L4
.L3:
  ; sci/numbers.e16.ts:261  if (letter === 0x59) k = 7
  li t0, 89
  bne a0, t0, .L5
  ; sci/numbers.e16.ts:261  k = 7
  li a1, 7 ; k
  j .L6
.L5:
  ; sci/numbers.e16.ts:262  k = 8
  li a1, 8 ; k
.L6:
.L4:
.L2:
  ; sci/numbers.e16.ts:263  return KEEP_VARS + k * VALUE_SIZE
  slli t1, a1, 5
  slli t0, a1, 2
  add t0, t0, t1
  addi a0, t0, 3120
.return:
  ret

; sci/numbers.e16.ts:272 clearStack() at -O1
clearStack:
  ; sci/numbers.e16.ts:273  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0490(zero)
.return:
  ret

; sci/numbers.e16.ts:277 push(at/n) at -O1
;   at/n in s1
push:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at/n
  ; sci/numbers.e16.ts:278  if (nsp >= addr(nums) + 864) fail(E_STACK, at)
  lw t0, 0x0490(zero)
  li t1, nums+864
  bltu t0, t1, .L1
  ; sci/numbers.e16.ts:278  fail(E_STACK, at)
  li a0, 3
  mv a1, s1
  call fail
.L1:
  ; sci/numbers.e16.ts:279  const n = nsp
  lw s1, 0x0490(zero)
  ; sci/numbers.e16.ts:280  nsp += VALUE_SIZE
  lw t0, 0x0490(zero)
  addi t0, t0, 36
  sw t0, 0x0490(zero)
  ; sci/numbers.e16.ts:281  inexact(n)
  mv a0, s1
  call inexact
  ; sci/numbers.e16.ts:282  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/numbers.e16.ts:285 top() at -O1
top:
  ; sci/numbers.e16.ts:286  return nsp - VALUE_SIZE
  lw t0, 0x0490(zero)
  addi a0, t0, -36
.return:
  ret

; sci/numbers.e16.ts:289 pop() at -O1
pop:
  ; sci/numbers.e16.ts:290  nsp -= VALUE_SIZE
  lw t0, 0x0490(zero)
  addi t0, t0, -36
  sw t0, 0x0490(zero)
.return:
  ret

; sci/numbers.e16.ts:293 isZero(n) at -O1
;   n in a0
isZero:
  ; sci/numbers.e16.ts:294  return peek(n + 2) === 0
  lbu t0, 2(a0)
  sub t0, t0, zero
  seqz a0, t0
.return:
  ret

; sci/numbers.e16.ts:297 isNegative(n) at -O1
;   n in a0
isNegative:
  ; sci/numbers.e16.ts:298  return peek(n) !== 0
  lbu t0, 0(a0)
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; sci/numbers.e16.ts:302 math(op, a, b, at) at -O1
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
  ; sci/numbers.e16.ts:303  poke16(MATH_A, a)
  li t0, 65362
  sw s2, 0(t0)
  ; sci/numbers.e16.ts:304  poke16(MATH_B, b)
  li t0, 65364
  sw s3, 0(t0)
  ; sci/numbers.e16.ts:305  poke16(MATH_OP, op)
  li t0, 65360
  sw s1, 0(t0)
  ; sci/numbers.e16.ts:306  if (peek16(MATH_STATUS) !== 0) fail(E_MATH, at)
  li t0, 65368
  lw t0, 0(t0)
  beq t0, zero, .L1
  ; sci/numbers.e16.ts:306  fail(E_MATH, at)
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

; sci/numbers.e16.ts:313 wholeInto(dst, v) at -O1
;   dst in s1
;   v in s2
wholeInto:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; dst
  mv s2, a1 ; v
  ; sci/numbers.e16.ts:314  poke16(MATH_ARG, v)
  li t0, 65366
  sw s2, 0(t0)
  ; sci/numbers.e16.ts:315  math(M_FROMINT, dst, 0, 0)
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

; sci/numbers.e16.ts:319 pushInt(v, at) at -O1
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
  ; sci/numbers.e16.ts:320  const n = push(at)
  mv a0, s2
  call push
  mv s1, a0 ; n
  ; sci/numbers.e16.ts:321  poke16(MATH_ARG, v)
  li t0, 65366
  sw s3, 0(t0)
  ; sci/numbers.e16.ts:322  math(M_FROMINT, n, 0, at)
  li a0, 48
  mv a1, s1
  li a2, 0
  mv a3, s2
  call math
  ; sci/numbers.e16.ts:323  exactWhole(n)
  mv a0, s1
  la t0, exactWhole
  li t1, 2
  call far_call
  ; sci/numbers.e16.ts:324  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:266 twoD() at -O1
twoD:
  ; sci/calc.e16.ts:267  return peek(KEEP_DISPLAY) === 0 && mode !== MODE_BASE && mode < MODE_CPLX
  lbu t0, 3075(zero)
  sub t0, t0, zero
  seqz t0, t0
  mv t1, t0
  beqz t1, .L2
  lw t0, 0x04b8(zero)
  li t1, 2
  sub t0, t0, t1
  snez t0, t0
.L2:
  mv t1, t0
  beqz t1, .L1
  lw t0, 0x04b8(zero)
  sltiu t0, t0, 5
.L1:
  mv a0, t0
.return:
  ret

; sci/calc.e16.ts:276 calcCold() at -O1
calcCold:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:277  powerOn()
  la t0, powerOn
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:278  screen = S_CALC
  sw zero, 0x04b6(zero)
  ; sci/calc.e16.ts:279  length = 0
  sw zero, 0x0582(zero)
  ; sci/calc.e16.ts:280  cursor = 0
  sw zero, 0x0584(zero)
  ; sci/calc.e16.ts:281  answered = false
  sw zero, 0x0586(zero)
  ; sci/calc.e16.ts:282  mode = peek(KEEP_MODE)
  lbu t0, 3116(zero)
  sw t0, 0x04b8(zero)
  ; sci/calc.e16.ts:283  if (mode > MODE_PROG) mode = MODE_CALC
  li t1, 7
  bgeu t1, t0, .L1
  ; sci/calc.e16.ts:283  mode = MODE_CALC
  sw zero, 0x04b8(zero)
.L1:
  ; sci/calc.e16.ts:284  loadLine()
  call loadLine
  ; sci/calc.e16.ts:285  startMode()
  call startMode
  ; sci/calc.e16.ts:286  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:292 enterMode(m) at -O1
;   m in s1
enterMode:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; m
  ; sci/calc.e16.ts:293  saveLine()
  call saveLine
  ; sci/calc.e16.ts:294  mode = m
  sw s1, 0x04b8(zero)
  ; sci/calc.e16.ts:295  poke(KEEP_MODE, m)
  sb s1, 3116(zero)
  ; sci/calc.e16.ts:296  loadLine()
  call loadLine
  ; sci/calc.e16.ts:297  answered = false
  sw zero, 0x0586(zero)
  ; sci/calc.e16.ts:298  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x0598(zero)
  ; sci/calc.e16.ts:299  screen = S_CALC
  sw zero, 0x04b6(zero)
  ; sci/calc.e16.ts:300  forget()
  call forget
  ; sci/calc.e16.ts:301  startMode()
  call startMode
  ; sci/calc.e16.ts:302  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:309 forget() at -O1
forget:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:310  shifted = false
  sw zero, 0x0588(zero)
  ; sci/calc.e16.ts:311  alphaOn = false
  sw zero, 0x058a(zero)
  ; sci/calc.e16.ts:312  storing = false
  sw zero, 0x058c(zero)
  ; sci/calc.e16.ts:313  recalling = false
  sw zero, 0x058e(zero)
  ; sci/calc.e16.ts:314  hyp = false
  sw zero, 0x0594(zero)
  ; sci/calc.e16.ts:315  dropConstant()
  la t0, dropConstant
  li t1, 10
  call far_call
  ; sci/calc.e16.ts:316  errFrom(0)
  ; sci/numbers.e16.ts:99  errBase = base
  sw zero, 0x0108(zero)
  ; sci/calc.e16.ts:317  xBack()
  call xBack
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:321 lineSlot() at -O1
lineSlot:
  ; sci/calc.e16.ts:322  if (mode === MODE_BASE) return BASE_LINE
  lw t0, 0x04b8(zero)
  li t1, 2
  bne t0, t1, .L1
  ; sci/calc.e16.ts:322  return BASE_LINE
  li a0, 8192
  ret
.L1:
  ; sci/calc.e16.ts:323  if (mode === MODE_TABLE) return TABLE_LINE
  lw t0, 0x04b8(zero)
  li t1, 3
  bne t0, t1, .L2
  ; sci/calc.e16.ts:323  return TABLE_LINE
  li a0, 7168
  ret
.L2:
  ; sci/calc.e16.ts:324  if (mode === MODE_CPLX) return CPLX_LINE
  lw t0, 0x04b8(zero)
  li t1, 5
  bne t0, t1, .L3
  ; sci/calc.e16.ts:324  return CPLX_LINE
  li a0, 10242
  ret
.L3:
  ; sci/calc.e16.ts:325  if (mode === MODE_MATRIX) return MATRIX_LINE
  lw t0, 0x04b8(zero)
  li t1, 6
  bne t0, t1, .L4
  ; sci/calc.e16.ts:325  return MATRIX_LINE
  li a0, 10368
  ret
.L4:
  ; sci/calc.e16.ts:326  if (mode === MODE_PROG) return PROGRAMS + peek(PROG_CHOSEN) * PROGRAM_SIZE
  lw t0, 0x04b8(zero)
  li t1, 7
  bne t0, t1, .L5
  ; sci/calc.e16.ts:326  return PROGRAMS + peek(PROG_CHOSEN) * PROGRAM_SIZE
  li t0, 11264
  lbu t0, 0(t0)
  li t1, 202
  mul t0, t0, t1
  li t1, 11266
  add a0, t1, t0
  ret
.L5:
  ; sci/calc.e16.ts:327  return CALC_LINE
  li a0, 7936
.return:
  ret

; sci/calc.e16.ts:331 lineMax() at -O1
lineMax:
  ; sci/calc.e16.ts:332  if (mode === MODE_BASE || mode === MODE_CPLX || mode === MODE_MATRIX) return 99
  lw t0, 0x04b8(zero)
  li t1, 2
  beq t0, t1, .L2
  lw t0, 0x04b8(zero)
  li t1, 5
  beq t0, t1, .L2
  lw t0, 0x04b8(zero)
  li t1, 6
  bne t0, t1, .L1
.L2:
  ; sci/calc.e16.ts:332  return 99
  li a0, 99
  ret
.L1:
  ; sci/calc.e16.ts:333  if (mode === MODE_TABLE) return 197
  lw t0, 0x04b8(zero)
  li t1, 3
  bne t0, t1, .L3
  ; sci/calc.e16.ts:333  return 197
  li a0, 197
  ret
.L3:
  ; sci/calc.e16.ts:334  return LINE_MAX
  li a0, 199
.return:
  ret

; sci/calc.e16.ts:337 saveLine() at -O1
;   slot in s1
saveLine:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/calc.e16.ts:338  const slot = lineSlot()
  call lineSlot
  mv s1, a0 ; slot
  ; sci/calc.e16.ts:339  poke(slot, length)
  lw t0, 0x0582(zero)
  sb t0, 0(s1)
  ; sci/calc.e16.ts:340  poke(slot + 1, cursor)
  lw t0, 0x0584(zero)
  sb t0, 1(s1)
  ; sci/calc.e16.ts:341  memcpy(slot + 2, addr(line), length)
  lw a2, 0x0582(zero)
  addi a0, s1, 2
  la a1, line
  mcpy a0, a1, a2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:344 loadLine() at -O1
;   slot in s1
loadLine:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/calc.e16.ts:345  const slot = lineSlot()
  call lineSlot
  mv s1, a0 ; slot
  ; sci/calc.e16.ts:346  length = peek(slot)
  lbu t0, 0(s1)
  sw t0, 0x0582(zero)
  ; sci/calc.e16.ts:347  cursor = peek(slot + 1)
  lbu t0, 1(s1)
  sw t0, 0x0584(zero)
  ; sci/calc.e16.ts:348  if (length > lineMax() || cursor > length) {
  lw t0, 0x0582(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  call lineMax
  lw t0, 0(sp)
  addi sp, sp, 2
  bltu a0, t0, .L2
  lw t0, 0x0584(zero)
  lw t1, 0x0582(zero)
  bgeu t1, t0, .L1
.L2:
  ; sci/calc.e16.ts:349  length = 0
  sw zero, 0x0582(zero)
  ; sci/calc.e16.ts:350  cursor = 0
  sw zero, 0x0584(zero)
.L1:
  ; sci/calc.e16.ts:352  memcpy(addr(line), slot + 2, length)
  lw a2, 0x0582(zero)
  la a0, line
  addi a1, s1, 2
  mcpy a0, a1, a2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:356 startMode() at -O1
startMode:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:357  if (mode === MODE_EQN) eqnStart()
  lw t0, 0x04b8(zero)
  li t1, 4
  bne t0, t1, .L1
  ; sci/calc.e16.ts:357  eqnStart()
  la t0, eqnStart
  li t1, 11
  call far_call
  j .L2
.L1:
  ; sci/calc.e16.ts:358  if (mode === MODE_STATS) statsStart()
  lw t0, 0x04b8(zero)
  li t1, 1
  bne t0, t1, .L3
  ; sci/calc.e16.ts:358  statsStart()
  la t0, statsStart
  li t1, 7
  call far_call
  j .L4
.L3:
  ; sci/calc.e16.ts:359  if (mode === MODE_TABLE) tableReset()
  lw t0, 0x04b8(zero)
  li t1, 3
  bne t0, t1, .L5
  ; sci/calc.e16.ts:359  tableReset()
  la t0, tableReset
  li t1, 10
  call far_call
  j .L6
.L5:
  ; sci/calc.e16.ts:360  if (mode === MODE_MATRIX) matStart()
  lw t0, 0x04b8(zero)
  li t1, 6
  bne t0, t1, .L7
  ; sci/calc.e16.ts:360  matStart()
  la t0, matStart
  li t1, 4
  call far_call
  j .L8
.L7:
  ; sci/calc.e16.ts:361  if (mode === MODE_PROG) progList()
  lw t0, 0x04b8(zero)
  li t1, 7
  bne t0, t1, .L9
  ; sci/calc.e16.ts:361  progList()
  la t0, progList
  li t1, 5
  call far_call
.L9:
.L8:
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:365 ownScreen() at -O1
ownScreen:
  ; sci/calc.e16.ts:366  return mode === MODE_STATS || mode === MODE_EQN
  lw t0, 0x04b8(zero)
  li t1, 1
  sub t0, t0, t1
  seqz t0, t0
  mv t1, t0
  bnez t1, .L1
  lw t0, 0x04b8(zero)
  li t1, 4
  sub t0, t0, t1
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; sci/calc.e16.ts:370 calcLoop() at -O1
calcLoop:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:371  for (;;) key(getkey())
.L1:
  ; sci/calc.e16.ts:371  key(getkey())
  call getkey
  call key
  j .L1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:375 refuse() at -O1
refuse:
  ; sci/calc.e16.ts:376  poke16(IO_FREQ, 1800)
  li t0, 1800
  li t1, 65344
  sw t0, 0(t1)
  ; sci/calc.e16.ts:377  poke16(IO_DUR, 40)
  li t0, 40
  li t1, 65346
  sw t0, 0(t1)
.return:
  ret

; sci/calc.e16.ts:383 calcError() at -O1
calcError:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:384  screen = S_ERROR
  li t0, 1
  sw t0, 0x04b6(zero)
  ; sci/calc.e16.ts:386  xBack()
  call xBack
  ; sci/calc.e16.ts:387  noCursor()
  ; sci/lcd.e16.ts:139  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:388  errorScreen(errCode)
  lw a0, 0x0104(zero)
  la t0, errorScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:389  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:393 calcFault(cause, pc) at -O1
;   cause in s1
;   pc in s2
calcFault:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; cause
  mv s2, a1 ; pc
  ; sci/calc.e16.ts:394  screen = S_ERROR
  li t0, 1
  sw t0, 0x04b6(zero)
  ; sci/calc.e16.ts:395  length = 0
  sw zero, 0x0582(zero)
  ; sci/calc.e16.ts:396  cursor = 0
  sw zero, 0x0584(zero)
  ; sci/calc.e16.ts:397  noCursor()
  ; sci/lcd.e16.ts:139  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:398  faultScreen(cause, pc)
  mv a0, s1
  mv a1, s2
  la t0, faultScreen
  li t1, 1
  call far_call
  ; sci/calc.e16.ts:399  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:406 calcOn() at -O1
calcOn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:407  if (shifted) {
  lw t0, 0x0588(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:408  shifted = false
  sw zero, 0x0588(zero)
  ; sci/calc.e16.ts:409  noCursor()
  ; sci/lcd.e16.ts:139  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:410  poke16(0xff06, 0)
  li t0, 65286
  sw zero, 0(t0)
  ; sci/calc.e16.ts:411  return
  j .return
.L1:
  ; sci/calc.e16.ts:413  clearLine()
  call clearLine
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:416 clearLine() at -O1
clearLine:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:417  forget()
  call forget
  ; sci/calc.e16.ts:418  screen = S_CALC
  sw zero, 0x04b6(zero)
  ; sci/calc.e16.ts:419  if (ownScreen()) {
  call ownScreen
  beqz a0, .L1
  ; sci/calc.e16.ts:420  if (mode === MODE_STATS) statsReset()
  lw t0, 0x04b8(zero)
  li t1, 1
  bne t0, t1, .L2
  ; sci/calc.e16.ts:420  statsReset()
  la t0, statsReset
  li t1, 7
  call far_call
  j .L3
.L2:
  ; sci/calc.e16.ts:421  eqnReset()
  la t0, eqnReset
  li t1, 11
  call far_call
.L3:
  ; sci/calc.e16.ts:422  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:423  return
  j .return
.L1:
  ; sci/calc.e16.ts:425  if (mode === MODE_TABLE) tableReset()
  lw t0, 0x04b8(zero)
  li t1, 3
  bne t0, t1, .L4
  ; sci/calc.e16.ts:425  tableReset()
  la t0, tableReset
  li t1, 10
  call far_call
.L4:
  ; sci/calc.e16.ts:426  if (mode === MODE_MATRIX) matStart()
  lw t0, 0x04b8(zero)
  li t1, 6
  bne t0, t1, .L5
  ; sci/calc.e16.ts:426  matStart()
  la t0, matStart
  li t1, 4
  call far_call
.L5:
  ; sci/calc.e16.ts:428  if (mode === MODE_PROG) progList()
  lw t0, 0x04b8(zero)
  li t1, 7
  bne t0, t1, .L6
  ; sci/calc.e16.ts:428  progList()
  la t0, progList
  li t1, 5
  call far_call
  j .L7
.L6:
  ; sci/calc.e16.ts:430  length = 0
  sw zero, 0x0582(zero)
  ; sci/calc.e16.ts:431  cursor = 0
  sw zero, 0x0584(zero)
.L7:
  ; sci/calc.e16.ts:433  answered = false
  sw zero, 0x0586(zero)
  ; sci/calc.e16.ts:434  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x0598(zero)
  ; sci/calc.e16.ts:435  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:440 key(k) at -O1
;   k in s1
;   shift in s3
;   alpha in s2
key:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; k
  ; sci/calc.e16.ts:441  if (k === K_SHIFT) {
  li t0, 6
  bne s1, t0, .L1
  ; sci/calc.e16.ts:442  shifted = !shifted
  lw t0, 0x0588(zero)
  seqz t0, t0
  sw t0, 0x0588(zero)
  ; sci/calc.e16.ts:443  alphaOn = false
  sw zero, 0x058a(zero)
  ; sci/calc.e16.ts:444  drawMarks()
  call drawMarks
  ; sci/calc.e16.ts:445  return
  j .return
.L1:
  ; sci/calc.e16.ts:447  if (k === K_ALPHA) {
  li t0, 7
  bne s1, t0, .L2
  ; sci/calc.e16.ts:448  alphaOn = !alphaOn
  lw t0, 0x058a(zero)
  seqz t0, t0
  sw t0, 0x058a(zero)
  ; sci/calc.e16.ts:449  shifted = false
  sw zero, 0x0588(zero)
  ; sci/calc.e16.ts:450  drawMarks()
  call drawMarks
  ; sci/calc.e16.ts:451  return
  j .return
.L2:
  ; sci/calc.e16.ts:453  const shift = shifted
  lw s3, 0x0588(zero)
  ; sci/calc.e16.ts:454  const alpha = alphaOn
  lw s2, 0x058a(zero)
  ; sci/calc.e16.ts:455  shifted = false
  sw zero, 0x0588(zero)
  ; sci/calc.e16.ts:456  alphaOn = false
  sw zero, 0x058a(zero)
  ; sci/calc.e16.ts:457  alphaKey = alpha
  sw s2, 0x0590(zero)
  ; sci/calc.e16.ts:458  dispatch(k, shift, alpha)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call dispatch
  ; sci/calc.e16.ts:460  if (mode === MODE_PROG) saveLine()
  lw t0, 0x04b8(zero)
  li t1, 7
  bne t0, t1, .L3
  ; sci/calc.e16.ts:460  saveLine()
  call saveLine
.L3:
  ; sci/calc.e16.ts:461  drawMarks()
  call drawMarks
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:465 dispatch(k, shift, alpha) at -O1
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
  ; sci/calc.e16.ts:466  if (screen !== S_CALC) screenKey(k, shift)
  lw t0, 0x04b6(zero)
  beq t0, zero, .L1
  ; sci/calc.e16.ts:466  screenKey(k, shift)
  mv a0, s1
  mv a1, s2
  call screenKey
  j .L2
.L1:
  ; sci/calc.e16.ts:467  if (k === K_SETUP && shift) angleKey()
  li t0, 9
  bne s1, t0, .L3
  beqz s2, .L3
  ; sci/calc.e16.ts:467  angleKey()
  call angleKey
  j .L4
.L3:
  ; sci/calc.e16.ts:468  if (k === K_MENU && shift) convOpen()
  li t0, 8
  bne s1, t0, .L5
  beqz s2, .L5
  ; sci/calc.e16.ts:468  convOpen()
  call convOpen
  j .L6
.L5:
  ; sci/calc.e16.ts:469  if (k === K_MENU || k === K_SETUP) openScreen(k)
  li t0, 8
  beq s1, t0, .L8
  li t0, 9
  bne s1, t0, .L7
.L8:
  ; sci/calc.e16.ts:469  openScreen(k)
  mv a0, s1
  call openScreen
  j .L9
.L7:
  ; sci/calc.e16.ts:470  modeKey(k, shift, alpha)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call modeKey
.L9:
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

; sci/calc.e16.ts:474 screenKey(k, shift) at -O1
;   k in s1
;   shift in s2
screenKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift
  ; sci/calc.e16.ts:475  if (screen === S_ERROR) errorKey(k)
  lw t0, 0x04b6(zero)
  li t1, 1
  bne t0, t1, .L1
  ; sci/calc.e16.ts:475  errorKey(k)
  mv a0, s1
  call errorKey
  j .L2
.L1:
  ; sci/calc.e16.ts:476  if (screen === S_MENU) chosenMode(menuKey(k))
  lw t0, 0x04b6(zero)
  li t1, 2
  bne t0, t1, .L3
  ; sci/calc.e16.ts:476  chosenMode(menuKey(k))
  mv a0, s1
  la t0, menuKey
  li t1, 1
  call far_call
  call chosenMode
  j .L4
.L3:
  ; sci/calc.e16.ts:477  if (screen === S_SETUP) {
  lw t0, 0x04b6(zero)
  li t1, 3
  bne t0, t1, .L5
  ; sci/calc.e16.ts:478  if (setupKey(k) !== 0) clearLine()
  mv a0, s1
  la t0, setupKey
  li t1, 1
  call far_call
  beq a0, zero, .L7
  ; sci/calc.e16.ts:478  clearLine()
  call clearLine
  j .L7
.L5:
  ; sci/calc.e16.ts:479  if (screen === S_FUNC) funcChosen(mode === MODE_BASE ? baseFuncKey(k) : funcKey(k))
  lw t0, 0x04b6(zero)
  li t1, 4
  bne t0, t1, .L8
  ; sci/calc.e16.ts:479  funcChosen(mode === MODE_BASE ? baseFuncKey(k) : funcKey(k))
  lw t0, 0x04b8(zero)
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
  ; sci/calc.e16.ts:480  if (screen === S_ASK) asked(k, shift)
  lw t0, 0x04b6(zero)
  li t1, 5
  bne t0, t1, .L12
  ; sci/calc.e16.ts:480  asked(k, shift)
  mv a0, s1
  mv a1, s2
  call asked
  j .L13
.L12:
  ; sci/calc.e16.ts:481  if (screen === S_CONST) funcChosen(constKey(k))
  lw t0, 0x04b6(zero)
  li t1, 6
  bne t0, t1, .L14
  ; sci/calc.e16.ts:481  funcChosen(constKey(k))
  mv a0, s1
  la t0, constKey
  li t1, 10
  call far_call
  call funcChosen
  j .L15
.L14:
  ; sci/calc.e16.ts:482  convChosen(convKey(k))
  mv a0, s1
  la t0, convKey
  li t1, 10
  call far_call
  call convChosen
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
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:486 modeKey(k, shift, alpha) at -O1
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
  ; sci/calc.e16.ts:487  if (mode === MODE_STATS) statsKey(k, shift)
  lw t0, 0x04b8(zero)
  li t1, 1
  bne t0, t1, .L1
  ; sci/calc.e16.ts:487  statsKey(k, shift)
  mv a0, s1
  mv a1, s2
  la t0, statsKey
  li t1, 7
  call far_call
  j .L2
.L1:
  ; sci/calc.e16.ts:488  if (mode === MODE_EQN) {
  lw t0, 0x04b8(zero)
  li t1, 4
  bne t0, t1, .L3
  ; sci/calc.e16.ts:489  if (eqnKey(k, shift)) {
  mv a0, s1
  mv a1, s2
  la t0, eqnKey
  li t1, 11
  call far_call
  beqz a0, .L5
  ; sci/calc.e16.ts:490  enterMode(MODE_CALC)
  li a0, 0
  call enterMode
  ; sci/calc.e16.ts:491  return
  j .return
.L3:
  ; sci/calc.e16.ts:493  if (mode === MODE_TABLE && tablePhase() === TABLE_VIEW) tableKey(k)
  lw t0, 0x04b8(zero)
  li t1, 3
  bne t0, t1, .L6
  la t0, tablePhase
  li t1, 10
  call far_call
  li t0, 2
  bne a0, t0, .L6
  ; sci/calc.e16.ts:493  tableKey(k)
  mv a0, s1
  la t0, tableKey
  li t1, 10
  call far_call
  j .L7
.L6:
  ; sci/calc.e16.ts:494  if (mode === MODE_MATRIX && matPhase() !== MAT_LINE) matKey(k, shift)
  lw t0, 0x04b8(zero)
  li t1, 6
  bne t0, t1, .L8
  la t0, matPhase
  li t1, 4
  call far_call
  beq a0, zero, .L8
  ; sci/calc.e16.ts:494  matKey(k, shift)
  mv a0, s1
  mv a1, s2
  la t0, matKey
  li t1, 4
  call far_call
  j .L9
.L8:
  ; sci/calc.e16.ts:495  if (mode === MODE_PROG && progPhase() === PROG_LIST) {
  lw t0, 0x04b8(zero)
  li t1, 7
  bne t0, t1, .L10
  la t0, progPhase
  li t1, 5
  call far_call
  bne a0, zero, .L10
  ; sci/calc.e16.ts:496  progChosen(progListKey(k))
  mv a0, s1
  la t0, progListKey
  li t1, 5
  call far_call
  call progChosen
  ; sci/calc.e16.ts:497  return
  j .return
.L10:
  ; sci/calc.e16.ts:499  calcKey(k, shift, alpha)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call calcKey
  ; sci/calc.e16.ts:500  return
  j .return
.L9:
.L7:
.L5:
.L2:
  ; sci/calc.e16.ts:502  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:509 angleKey() at -O1
angleKey:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:510  if (mode !== MODE_CALC) {
  lw t0, 0x04b8(zero)
  beq t0, zero, .L1
  ; sci/calc.e16.ts:511  refuse()
  call refuse
  ; sci/calc.e16.ts:512  return
  j .return
.L1:
  ; sci/calc.e16.ts:514  if (!answered && length > 0) equals(false)
  lw t0, 0x0586(zero)
  bnez t0, .L2
  lw t0, 0x0582(zero)
  bgeu zero, t0, .L2
  ; sci/calc.e16.ts:514  equals(false)
  li a0, 0
  call equals
.L2:
  ; sci/calc.e16.ts:515  nextAngle()
  la t0, nextAngle
  li t1, 10
  call far_call
  ; sci/calc.e16.ts:516  answered = true
  li t0, 1
  sw t0, 0x0586(zero)
  ; sci/calc.e16.ts:517  shown = SHOW_DECIMAL
  sw zero, 0x059a(zero)
  ; sci/calc.e16.ts:518  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:522 progChosen(p) at -O1
;   p in s1
progChosen:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; p
  ; sci/calc.e16.ts:523  if (p === 0) return
  bne s1, zero, .L1
  ; sci/calc.e16.ts:523  return
  j .return
.L1:
  ; sci/calc.e16.ts:524  if (p === 0xff) {
  li t0, 255
  bne s1, t0, .L2
  ; sci/calc.e16.ts:525  enterMode(MODE_CALC)
  li a0, 0
  call enterMode
  ; sci/calc.e16.ts:526  return
  j .return
.L2:
  ; sci/calc.e16.ts:528  poke(PROG_CHOSEN, p - 1)
  addi t0, s1, -1
  li t1, 11264
  sb t0, 0(t1)
  ; sci/calc.e16.ts:529  loadLine()
  call loadLine
  ; sci/calc.e16.ts:530  answered = false
  sw zero, 0x0586(zero)
  ; sci/calc.e16.ts:531  progEdit()
  la t0, progEdit
  li t1, 5
  call far_call
  ; sci/calc.e16.ts:532  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:536 convOpen() at -O1
convOpen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:537  if (mode !== MODE_CALC) {
  lw t0, 0x04b8(zero)
  beq t0, zero, .L1
  ; sci/calc.e16.ts:538  refuse()
  call refuse
  ; sci/calc.e16.ts:539  return
  j .return
.L1:
  ; sci/calc.e16.ts:541  if (!answered && length > 0) equals(false)
  lw t0, 0x0586(zero)
  bnez t0, .L2
  lw t0, 0x0582(zero)
  bgeu zero, t0, .L2
  ; sci/calc.e16.ts:541  equals(false)
  li a0, 0
  call equals
.L2:
  ; sci/calc.e16.ts:542  screen = S_CONV
  li t0, 7
  sw t0, 0x04b6(zero)
  ; sci/calc.e16.ts:543  noCursor()
  ; sci/lcd.e16.ts:139  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:544  convScreen()
  la t0, convScreen
  li t1, 10
  call far_call
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:548 convChosen(r) at -O1
;   r in s1
convChosen:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; r
  ; sci/calc.e16.ts:549  if (r === 0) return
  bne s1, zero, .L1
  ; sci/calc.e16.ts:549  return
  j .return
.L1:
  ; sci/calc.e16.ts:550  screen = S_CALC
  sw zero, 0x04b6(zero)
  ; sci/calc.e16.ts:551  if (r === 2) {
  li t0, 2
  bne s1, t0, .L2
  ; sci/calc.e16.ts:552  answered = true
  li t0, 1
  sw t0, 0x0586(zero)
  ; sci/calc.e16.ts:553  found = false
  sw zero, 0x0596(zero)
  ; sci/calc.e16.ts:554  shown = SHOW_CONV
  li t0, 7
  sw t0, 0x059a(zero)
.L2:
  ; sci/calc.e16.ts:556  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:560 openScreen(k) at -O1
;   k in s1
openScreen:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/calc.e16.ts:561  noCursor()
  ; sci/lcd.e16.ts:139  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:562  if (k === K_MENU) {
  li t0, 8
  bne s1, t0, .L1
  ; sci/calc.e16.ts:563  screen = S_MENU
  li t0, 2
  sw t0, 0x04b6(zero)
  ; sci/calc.e16.ts:564  menuScreen(mode)
  lw a0, 0x04b8(zero)
  la t0, menuScreen
  li t1, 1
  call far_call
  j .L2
.L1:
  ; sci/calc.e16.ts:566  screen = S_SETUP
  li t0, 3
  sw t0, 0x04b6(zero)
  ; sci/calc.e16.ts:567  setupScreen()
  la t0, setupScreen
  li t1, 1
  call far_call
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:572 chosenMode(m) at -O1
;   m in s1
chosenMode:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; m
  ; sci/calc.e16.ts:573  if (m === 0) return
  bne s1, zero, .L1
  ; sci/calc.e16.ts:573  return
  j .return
.L1:
  ; sci/calc.e16.ts:574  if (m === 0xff) {
  li t0, 255
  bne s1, t0, .L2
  ; sci/calc.e16.ts:575  screen = S_CALC
  sw zero, 0x04b6(zero)
  ; sci/calc.e16.ts:576  drawCalc()
  call drawCalc
  j .L3
.L2:
  ; sci/calc.e16.ts:577  enterMode(m - 1)
  addi a0, s1, -1
  call enterMode
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:581 errorKey(k) at -O1
;   k in s1
;   grid in s2
errorKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  ; sci/calc.e16.ts:583  const grid = mode === MODE_MATRIX && matPhase() !== MAT_LINE
  lw t0, 0x04b8(zero)
  li t1, 6
  sub t0, t0, t1
  seqz t0, t0
  mv t1, t0
  beqz t1, .L1
  la t0, matPhase
  li t1, 4
  call far_call
  sub t0, a0, zero
  snez t0, t0
.L1:
  mv s2, t0 ; grid
  ; sci/calc.e16.ts:584  if (k === K_AC && !grid) {
  li t0, 5
  bne s1, t0, .L2
  bnez s2, .L2
  ; sci/calc.e16.ts:585  clearLine()
  call clearLine
  ; sci/calc.e16.ts:586  return
  j .return
.L2:
  ; sci/calc.e16.ts:588  if ((k === K_LEFT || k === K_RIGHT || k === K_AC) && (ownScreen() || grid)) {
  li t0, 2
  beq s1, t0, .L4
  li t0, 3
  beq s1, t0, .L4
  li t0, 5
  bne s1, t0, .L3
.L4:
  call ownScreen
  bnez a0, .L5
  beqz s2, .L3
.L5:
  ; sci/calc.e16.ts:589  screen = S_CALC
  sw zero, 0x04b6(zero)
  ; sci/calc.e16.ts:590  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:591  return
  j .return
.L3:
  ; sci/calc.e16.ts:593  if (k === K_LEFT || k === K_RIGHT) {
  li t0, 2
  beq s1, t0, .L7
  li t0, 3
  bne s1, t0, .L6
.L7:
  ; sci/calc.e16.ts:594  if (mode === MODE_TABLE) tableReset()
  lw t0, 0x04b8(zero)
  li t1, 3
  bne t0, t1, .L8
  ; sci/calc.e16.ts:594  tableReset()
  la t0, tableReset
  li t1, 10
  call far_call
.L8:
  ; sci/calc.e16.ts:595  screen = S_CALC
  sw zero, 0x04b6(zero)
  ; sci/calc.e16.ts:596  answered = false
  sw zero, 0x0586(zero)
  ; sci/calc.e16.ts:597  cursor = errAt < length ? errAt : length
  lw t0, 0x0106(zero)
  lw t1, 0x0582(zero)
  bgeu t0, t1, .L9
  lw t0, 0x0106(zero)
  j .L10
.L9:
  lw t0, 0x0582(zero)
.L10:
  sw t0, 0x0584(zero)
  ; sci/calc.e16.ts:598  drawCalc()
  call drawCalc
.L6:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:606 baseKey(k/t, shift, alpha) at -O1
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
  ; sci/calc.e16.ts:607  if (baseCommand(k)) {
  mv a0, s1
  la t0, baseCommand
  li t1, 8
  call far_call
  beqz a0, .L1
  ; sci/calc.e16.ts:608  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:609  return
  j .return
.L1:
  ; sci/calc.e16.ts:611  if (k === K_FUNC) {
  li t0, 11
  bne s1, t0, .L2
  ; sci/calc.e16.ts:613  if (shift) refuse()
  beqz s2, .L3
  ; sci/calc.e16.ts:613  refuse()
  call refuse
  j .L4
.L3:
  ; sci/calc.e16.ts:615  screen = S_FUNC
  li t0, 4
  sw t0, 0x04b6(zero)
  ; sci/calc.e16.ts:616  noCursor()
  ; sci/lcd.e16.ts:139  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:617  baseFuncScreen()
  la t0, baseFuncScreen
  li t1, 8
  call far_call
.L4:
  ; sci/calc.e16.ts:619  return
  j .return
.L2:
  ; sci/calc.e16.ts:621  if (editKey(k) && commandKey(k, shift, alpha)) return
  mv a0, s1
  call editKey
  beqz a0, .L5
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call commandKey
  beqz a0, .L5
  ; sci/calc.e16.ts:621  return
  j .return
.L5:
  ; sci/calc.e16.ts:622  const t = baseToken(k)
  mv a0, s1
  la t0, baseToken
  li t1, 8
  call far_call
  mv s1, a0 ; k/t
  ; sci/calc.e16.ts:623  if (t === 0) refuse()
  bne s1, zero, .L6
  ; sci/calc.e16.ts:623  refuse()
  call refuse
  j .L7
.L6:
  ; sci/calc.e16.ts:624  type(t)
  mv a0, s1
  call type
.L7:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:633 v2Key(k, shift, alpha) at -O1
;   k in s1
;   shift in s2
;   alpha in s3
v2Key:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift
  mv s3, a2 ; alpha
  ; sci/calc.e16.ts:634  if (k === K_STO && mode === MODE_PROG && !shift && !alpha) type(T_STORE)
  li t0, 12
  bne s1, t0, .L1
  lw t0, 0x04b8(zero)
  li t1, 7
  bne t0, t1, .L1
  bnez s2, .L1
  bnez s3, .L1
  ; sci/calc.e16.ts:634  type(T_STORE)
  li a0, 148
  call type
  j .L2
.L1:
  ; sci/calc.e16.ts:635  if (k === K_STO || k === K_FX || (k === K_MPLUS && !alpha)) refuse()
  li t0, 12
  beq s1, t0, .L4
  li t0, 32
  beq s1, t0, .L4
  li t0, 37
  bne s1, t0, .L3
  bnez s3, .L3
.L4:
  ; sci/calc.e16.ts:635  refuse()
  call refuse
  j .L5
.L3:
  ; sci/calc.e16.ts:636  if (alpha || mode === MODE_TABLE || mode === MODE_PROG) return false
  bnez s3, .L7
  lw t0, 0x04b8(zero)
  li t1, 3
  beq t0, t1, .L7
  lw t0, 0x04b8(zero)
  li t1, 7
  bne t0, t1, .L6
.L7:
  ; sci/calc.e16.ts:636  return false
  li a0, 0
  j .return
.L6:
  ; sci/calc.e16.ts:637  if (unread(k, shift)) refuse()
  mv a0, s1
  mv a1, s2
  call unread
  beqz a0, .L9
  ; sci/calc.e16.ts:637  refuse()
  call refuse
  j .L10
.L9:
  ; sci/calc.e16.ts:638  return mode === MODE_CPLX && cplxKey(k, shift)
  lw t0, 0x04b8(zero)
  li t1, 5
  sub t0, t0, t1
  seqz t0, t0
  mv t1, t0
  beqz t1, .L11
  mv a0, s1
  mv a1, s2
  call cplxKey
  mv t0, a0
.L11:
  mv a0, t0
  j .return
.L10:
.L5:
.L2:
  ; sci/calc.e16.ts:639  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:643 cplxKey(k, shift) at -O1
;   k in s1
;   shift in s2
cplxKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift
  ; sci/calc.e16.ts:644  if (k === K_HYP) type(shift ? T_POLAR : T_I)
  li t0, 26
  bne s1, t0, .L1
  ; sci/calc.e16.ts:644  type(shift ? T_POLAR : T_I)
  beqz s2, .L2
  li t0, 176
  j .L3
.L2:
  li t0, 105
.L3:
  mv a0, t0
  call type
  j .L4
.L1:
  ; sci/calc.e16.ts:645  if (k !== K_FD) return false
  li t0, 13
  beq s1, t0, .L5
  ; sci/calc.e16.ts:645  return false
  li a0, 0
  j .return
.L5:
  ; sci/calc.e16.ts:646  if (answered && !shift) {
  lw t0, 0x0586(zero)
  beqz t0, .L7
  bnez s2, .L7
  ; sci/calc.e16.ts:647  cplxTurn()
  la t0, cplxTurn
  li t1, 6
  call far_call
  ; sci/calc.e16.ts:648  drawCalc()
  call drawCalc
  j .L8
.L7:
  ; sci/calc.e16.ts:649  refuse()
  call refuse
.L8:
.L4:
  ; sci/calc.e16.ts:650  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:654 unread(k, shift) at -O1
;   k in a0
;   shift in a1
unread:
  ; sci/calc.e16.ts:655  if (k === K_NCR || k === K_DMS) return true
  li t0, 34
  beq a0, t0, .L2
  li t0, 25
  bne a0, t0, .L1
.L2:
  ; sci/calc.e16.ts:655  return true
  li a0, 1
  ret
.L1:
  ; sci/calc.e16.ts:656  if (shift && (k === K_FRAC || k === K_POW || k === K_INV || k === K_ROOT)) return true
  beqz a1, .L3
  li t0, 16
  beq a0, t0, .L4
  li t0, 19
  beq a0, t0, .L4
  li t0, 33
  beq a0, t0, .L4
  li t0, 18
  bne a0, t0, .L3
.L4:
  ; sci/calc.e16.ts:656  return true
  li a0, 1
  ret
.L3:
  ; sci/calc.e16.ts:657  return k === K_HYP && mode === MODE_MATRIX
  li t0, 26
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  beqz t1, .L5
  lw t0, 0x04b8(zero)
  li t1, 6
  sub t0, t0, t1
  seqz t0, t0
.L5:
  mv a0, t0
.return:
  ret

; sci/calc.e16.ts:661 editKey(k) at -O1
;   k in a0
editKey:
  ; sci/calc.e16.ts:662  return (
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

; sci/calc.e16.ts:674 tableAsked(r) at -O1
;   r in s1
tableAsked:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; r
  ; sci/calc.e16.ts:675  if (r === ASK_DONE && tableNext()) {
  li t0, 2
  bne s1, t0, .L1
  la t0, tableNext
  li t1, 10
  call far_call
  beqz a0, .L1
  ; sci/calc.e16.ts:676  askRange(tableAsking(), rangeAt(tableAsking()))
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
  ; sci/calc.e16.ts:677  return
  j .return
.L1:
  ; sci/calc.e16.ts:679  if (r === ASK_BACK) tableReset()
  li t0, 1
  bne s1, t0, .L2
  ; sci/calc.e16.ts:679  tableReset()
  la t0, tableReset
  li t1, 10
  call far_call
.L2:
  ; sci/calc.e16.ts:680  if (r !== ASK_STAY) {
  beq s1, zero, .L3
  ; sci/calc.e16.ts:681  screen = S_CALC
  sw zero, 0x04b6(zero)
  ; sci/calc.e16.ts:682  drawCalc()
  call drawCalc
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:690 funcChosen(t) at -O1
;   t in s1
funcChosen:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/calc.e16.ts:691  if (t === 0) return
  bne s1, zero, .L1
  ; sci/calc.e16.ts:691  return
  j .return
.L1:
  ; sci/calc.e16.ts:692  screen = S_CALC
  sw zero, 0x04b6(zero)
  ; sci/calc.e16.ts:693  if (t === 0xfe) {
  li t0, 254
  bne s1, t0, .L2
  ; sci/calc.e16.ts:694  length = 0
  sw zero, 0x0582(zero)
  ; sci/calc.e16.ts:695  cursor = 0
  sw zero, 0x0584(zero)
  ; sci/calc.e16.ts:696  answered = false
  sw zero, 0x0586(zero)
.L2:
  ; sci/calc.e16.ts:698  if (t === 1 || t >= 0xfe) drawCalc()
  li t0, 1
  beq s1, t0, .L4
  li t0, 254
  bltu s1, t0, .L3
.L4:
  ; sci/calc.e16.ts:698  drawCalc()
  call drawCalc
  j .L5
.L3:
  ; sci/calc.e16.ts:699  type(t)
  mv a0, s1
  call type
.L5:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:703 asked(k/r, shift/t) at -O1
;   k/r in s1
;   shift/t in s2
asked:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/r
  mv s2, a1 ; shift/t
  ; sci/calc.e16.ts:704  const t = k === K_DEL || k === K_EQ || k === K_AC ? 0 : alphaKey ? letterOf(k) : tokenOf(k, shift)
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
  lw t0, 0x0590(zero)
  beqz t0, .L4
  mv a0, s1
  la t0, letterOf
  li t1, 4
  call far_call
  mv t0, a0
  j .L5
.L4:
  mv a0, s1
  mv a1, s2
  la t0, tokenOf
  li t1, 4
  call far_call
  mv t0, a0
.L5:
.L2:
  mv s2, t0 ; shift/t
  ; sci/calc.e16.ts:705  const r = askKey(k === K_EQ, k === K_DEL, k === K_AC, t)
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
  ; sci/calc.e16.ts:706  if (mode === MODE_TABLE) {
  lw t0, 0x04b8(zero)
  li t1, 3
  bne t0, t1, .L6
  ; sci/calc.e16.ts:707  tableAsked(r)
  mv a0, s1
  call tableAsked
  ; sci/calc.e16.ts:708  return
  j .return
.L6:
  ; sci/calc.e16.ts:710  if (r === ASK_BACK) {
  li t0, 1
  bne s1, t0, .L7
  ; sci/calc.e16.ts:711  screen = S_CALC
  sw zero, 0x04b6(zero)
  ; sci/calc.e16.ts:712  drawCalc()
  call drawCalc
  j .L8
.L7:
  ; sci/calc.e16.ts:713  if (r === ASK_DONE) {
  li t0, 2
  bne s1, t0, .L9
  ; sci/calc.e16.ts:714  screen = S_CALC
  sw zero, 0x04b6(zero)
  ; sci/calc.e16.ts:715  answered = true
  li t0, 1
  sw t0, 0x0586(zero)
  ; sci/calc.e16.ts:716  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x0598(zero)
  ; sci/calc.e16.ts:717  shown = found ? SHOW_FOUND : firstShown(formFirst(false))
  lw t0, 0x0596(zero)
  beqz t0, .L10
  li t0, 6
  j .L11
.L10:
  li a0, 0
  call formFirst
  la t0, firstShown
  li t1, 5
  call far_call
  mv t0, a0
.L11:
  sw t0, 0x059a(zero)
  ; sci/calc.e16.ts:718  drawCalc()
  call drawCalc
.L9:
.L8:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:722 calcKey(k, shift, alpha) at -O1
;   k in s1
;   shift in s2
;   alpha in s3
calcKey:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift
  mv s3, a2 ; alpha
  ; sci/calc.e16.ts:723  if (storing || recalling) variableKey(k)
  lw t0, 0x058c(zero)
  bnez t0, .L2
  lw t0, 0x058e(zero)
  beqz t0, .L1
.L2:
  ; sci/calc.e16.ts:723  variableKey(k)
  mv a0, s1
  call variableKey
  j .L3
.L1:
  ; sci/calc.e16.ts:724  if (mode === MODE_BASE) baseKey(k, shift, alpha)
  lw t0, 0x04b8(zero)
  li t1, 2
  bne t0, t1, .L4
  ; sci/calc.e16.ts:724  baseKey(k, shift, alpha)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call baseKey
  j .L5
.L4:
  ; sci/calc.e16.ts:725  if ((mode < MODE_CPLX && mode !== MODE_TABLE) || !v2Key(k, shift, alpha))
  lw t0, 0x04b8(zero)
  li t1, 5
  bgeu t0, t1, .L8
  lw t0, 0x04b8(zero)
  li t1, 3
  bne t0, t1, .L7
.L8:
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call v2Key
  bnez a0, .L6
.L7:
  ; sci/calc.e16.ts:726  lineKey(k, shift, alpha)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call lineKey
.L6:
.L5:
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:730 lineKey(k, shift, alpha/t) at -O1
;   k in s1
;   shift in s3
;   alpha/t in s2
;   wasHyp in s0
lineKey:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; k
  mv s3, a1 ; shift
  mv s2, a2 ; alpha/t
  ; sci/calc.e16.ts:731  const wasHyp = hyp
  lw s0, 0x0594(zero)
  ; sci/calc.e16.ts:732  hyp = false
  sw zero, 0x0594(zero)
  ; sci/calc.e16.ts:733  if (commandKey(k, shift, alpha)) return
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call commandKey
  beqz a0, .L1
  ; sci/calc.e16.ts:733  return
  j .return
.L1:
  ; sci/calc.e16.ts:734  if (!alpha && templateKey(k, shift)) return
  bnez s2, .L2
  mv a0, s1
  mv a1, s3
  call templateKey
  beqz a0, .L2
  ; sci/calc.e16.ts:734  return
  j .return
.L2:
  ; sci/calc.e16.ts:735  if (!alpha && !shift && k === K_DMS) {
  bnez s2, .L3
  bnez s3, .L3
  li t0, 25
  bne s1, t0, .L3
  ; sci/calc.e16.ts:736  dmsMark()
  call dmsMark
  ; sci/calc.e16.ts:737  return
  j .return
.L3:
  ; sci/calc.e16.ts:739  const t = alpha ? letterOf(k) : wasHyp ? hypToken(k, shift) : tokenOf(k, shift)
  beqz s2, .L4
  mv a0, s1
  la t0, letterOf
  li t1, 4
  call far_call
  mv t0, a0
  j .L5
.L4:
  beqz s0, .L6
  mv a0, s1
  mv a1, s3
  la t0, hypToken
  li t1, 4
  call far_call
  mv t0, a0
  j .L7
.L6:
  mv a0, s1
  mv a1, s3
  la t0, tokenOf
  li t1, 4
  call far_call
  mv t0, a0
.L7:
.L5:
  mv s2, t0 ; alpha/t
  ; sci/calc.e16.ts:740  if (t === 0) {
  bne s2, zero, .L8
  ; sci/calc.e16.ts:741  refuse()
  call refuse
  ; sci/calc.e16.ts:742  return
  j .return
.L8:
  ; sci/calc.e16.ts:744  type(t)
  mv a0, s2
  call type
  ; sci/calc.e16.ts:746  if (shift && (k === K_LOG || k === K_LN)) {
  beqz s3, .L9
  li t0, 20
  beq s1, t0, .L10
  li t0, 21
  bne s1, t0, .L9
.L10:
  ; sci/calc.e16.ts:747  insert(T_POW)
  li a0, 17
  call insert
  ; sci/calc.e16.ts:748  drawCalc()
  call drawCalc
.L9:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/calc.e16.ts:756 templateKey(k, shift) at -O1
;   k in s1
;   shift in s2
templateKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift
  ; sci/calc.e16.ts:757  if (shift && (k === K_FRAC || k === K_POW)) {
  beqz s2, .L1
  li t0, 16
  beq s1, t0, .L2
  li t0, 19
  bne s1, t0, .L1
.L2:
  ; sci/calc.e16.ts:758  wrapped(k === K_FRAC ? T_MIXED : T_XROOT)
  li t0, 16
  bne s1, t0, .L3
  li t0, 28
  j .L4
.L3:
  li t0, 30
.L4:
  mv a0, t0
  call wrapped
  ; sci/calc.e16.ts:759  return true
  li a0, 1
  j .return
.L1:
  ; sci/calc.e16.ts:761  return plainTemplate(k, shift)
  mv a0, s1
  mv a1, s2
  call plainTemplate
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:765 plainTemplate(k, shift/root) at -O1
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
  ; sci/calc.e16.ts:766  const fractionKey = k === K_FRAC && !shift
  li t0, 16
  sub t0, s1, t0
  seqz t0, t0
  mv t1, t0
  beqz t1, .L1
  seqz t0, s2
.L1:
  mv s3, t0 ; fractionKey
  ; sci/calc.e16.ts:767  if (!twoD()) {
  call twoD
  bnez a0, .L2
  ; sci/calc.e16.ts:768  if (fractionKey) type(T_SLASH)
  beqz s3, .L3
  ; sci/calc.e16.ts:768  type(T_SLASH)
  li a0, 27
  call type
.L3:
  ; sci/calc.e16.ts:769  return fractionKey
  mv a0, s3
  j .return
.L2:
  ; sci/calc.e16.ts:771  if (!fractionKey && !makesTemplate(k, shift)) return false
  bnez s3, .L4
  mv a0, s1
  mv a1, s2
  call makesTemplate
  bnez a0, .L4
  ; sci/calc.e16.ts:771  return false
  li a0, 0
  j .return
.L4:
  ; sci/calc.e16.ts:773  if (length + 3 > lineMax()) {
  lw t0, 0x0582(zero)
  addi t0, t0, 3
  addi sp, sp, -2
  sw t0, 0(sp)
  call lineMax
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu a0, t0, .L5
  ; sci/calc.e16.ts:774  refuse()
  call refuse
  ; sci/calc.e16.ts:775  return true
  li a0, 1
  j .return
.L5:
  ; sci/calc.e16.ts:777  const root = k === K_ROOT && !shift
  li t0, 18
  sub t0, s1, t0
  seqz t0, t0
  mv t1, t0
  beqz t1, .L6
  seqz t0, s2
.L6:
  mv s2, t0 ; shift/root
  ; sci/calc.e16.ts:778  if (answered) afresh(fractionKey || k === K_POW)
  lw t0, 0x0586(zero)
  beqz t0, .L7
  ; sci/calc.e16.ts:778  afresh(fractionKey || k === K_POW)
  mv t0, s3
  mv t1, s3
  bnez t1, .L8
  li t0, 19
  sub t0, s1, t0
  seqz t0, t0
.L8:
  mv a0, t0
  call afresh
.L7:
  ; sci/calc.e16.ts:779  if (fractionKey) {
  beqz s3, .L9
  ; sci/calc.e16.ts:780  wrap(addr(line), length, cursor, T_FRAC)
  lw a1, 0x0582(zero)
  lw a2, 0x0584(zero)
  la a0, line
  li a3, 22
  la t0, wrap
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:781  edited()
  call edited
  j .L10
.L9:
  ; sci/calc.e16.ts:782  insertTemplate(k, root)
  mv a0, s1
  mv a1, s2
  call insertTemplate
.L10:
  ; sci/calc.e16.ts:783  tallEnough()
  call tallEnough
  ; sci/calc.e16.ts:784  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:785  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:789 wrapped(opener) at -O1
;   opener in s1
wrapped:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; opener
  ; sci/calc.e16.ts:790  if (answered) afresh(false)
  lw t0, 0x0586(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:790  afresh(false)
  li a0, 0
  call afresh
.L1:
  ; sci/calc.e16.ts:791  if (length + 4 > lineMax()) {
  lw t0, 0x0582(zero)
  addi t0, t0, 4
  addi sp, sp, -2
  sw t0, 0(sp)
  call lineMax
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu a0, t0, .L2
  ; sci/calc.e16.ts:792  refuse()
  call refuse
  ; sci/calc.e16.ts:793  return
  j .return
.L2:
  ; sci/calc.e16.ts:795  wrap(addr(line), length, cursor, opener)
  lw a1, 0x0582(zero)
  lw a2, 0x0584(zero)
  la a0, line
  mv a3, s1
  la t0, wrap
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:796  edited()
  call edited
  ; sci/calc.e16.ts:797  tallEnough()
  call tallEnough
  ; sci/calc.e16.ts:798  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:802 tallEnough() at -O1
tallEnough:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:803  if (!twoD() || heightOf(addr(line), length) <= LINE_HEIGHT_MAX) return
  call twoD
  beqz a0, .L2
  lw a1, 0x0582(zero)
  la a0, line
  la t0, heightOf
  li t1, 3
  call far_call
  li t0, 36
  bltu t0, a0, .L1
.L2:
  ; sci/calc.e16.ts:803  return
  j .return
.L1:
  ; sci/calc.e16.ts:804  refuse()
  call refuse
  ; sci/calc.e16.ts:805  deleteAt(addr(line), length, cursor)
  lw a1, 0x0582(zero)
  lw a2, 0x0584(zero)
  la a0, line
  la t0, deleteAt
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:806  edited()
  call edited
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:813 dmsMark() at -O1
;   marks in s1
;   j in s2
;   t in s3
dmsMark:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; sci/calc.e16.ts:814  if (answered) {
  lw t0, 0x0586(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:815  shown = shown === SHOW_DMS ? firstShown(formFirst(false)) : SHOW_DMS
  lw t0, 0x059a(zero)
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
  sw t0, 0x059a(zero)
  ; sci/calc.e16.ts:816  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:817  return
  j .return
.L1:
  ; sci/calc.e16.ts:819  let marks: u16 = 0
  li s1, 0 ; marks
  ; sci/calc.e16.ts:820  let j = cursor
  lw s2, 0x0584(zero)
  ; sci/calc.e16.ts:821  while (j > 0) {
  j .L6
.L4:
  ; sci/calc.e16.ts:822  const t = line[j - 1]
  lbu s3, line-1(s2)
  ; sci/calc.e16.ts:823  if (t === T_DEG || t === T_MIN || t === T_SEC) marks++
  li t0, 136
  beq s3, t0, .L9
  li t0, 137
  beq s3, t0, .L9
  li t0, 138
  bne s3, t0, .L8
.L9:
  ; sci/calc.e16.ts:823  marks++
  addi s1, s1, 1
  j .L10
.L8:
  ; sci/calc.e16.ts:824  if (!isDigit(t) && t !== T_POINT) break
  mv a0, s3
  call isDigit
  bnez a0, .L11
  li t0, 46
  beq s3, t0, .L11
  ; sci/calc.e16.ts:824  break
  j .L7
.L11:
.L10:
  ; sci/calc.e16.ts:825  j--
  addi s2, s2, -1
.L6:
  bltu zero, s2, .L4
.L7:
  ; sci/calc.e16.ts:827  if (marks > 2 || j === cursor) {
  li t0, 2
  bltu t0, s1, .L13
  lw t0, 0x0584(zero)
  bne s2, t0, .L12
.L13:
  ; sci/calc.e16.ts:828  refuse()
  call refuse
  ; sci/calc.e16.ts:829  return
  j .return
.L12:
  ; sci/calc.e16.ts:831  type(marks === 0 ? T_DEG : marks === 1 ? T_MIN : T_SEC)
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

; sci/calc.e16.ts:839 makesTemplate(k, shift) at -O1
;   k in a0
;   shift in a1
makesTemplate:
  ; sci/calc.e16.ts:840  if (shift) return k === K_LOG || k === K_LN
  beqz a1, .L1
  ; sci/calc.e16.ts:840  return k === K_LOG || k === K_LN
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
  ; sci/calc.e16.ts:841  return k === K_POW || k === K_ROOT
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

; sci/calc.e16.ts:845 edited() at -O1
edited:
  ; sci/calc.e16.ts:846  length = editLength
  lw t0, 0x06d0(zero)
  sw t0, 0x0582(zero)
  ; sci/calc.e16.ts:847  cursor = editCursor
  lw t0, 0x06d2(zero)
  sw t0, 0x0584(zero)
.return:
  ret

; sci/calc.e16.ts:854 afresh(fromAns) at -O1
;   fromAns in s1
afresh:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; fromAns
  ; sci/calc.e16.ts:855  answered = false
  sw zero, 0x0586(zero)
  ; sci/calc.e16.ts:856  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x0598(zero)
  ; sci/calc.e16.ts:857  if (mode === MODE_PROG) {
  lw t0, 0x04b8(zero)
  li t1, 7
  bne t0, t1, .L1
  ; sci/calc.e16.ts:858  cursor = length
  lw t0, 0x0582(zero)
  sw t0, 0x0584(zero)
  ; sci/calc.e16.ts:859  return
  j .return
.L1:
  ; sci/calc.e16.ts:861  length = 0
  sw zero, 0x0582(zero)
  ; sci/calc.e16.ts:862  cursor = 0
  sw zero, 0x0584(zero)
  ; sci/calc.e16.ts:863  if (fromAns) insert(T_ANS)
  beqz s1, .L2
  ; sci/calc.e16.ts:863  insert(T_ANS)
  li a0, 20
  call insert
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:867 insertTemplate(k, root) at -O1
;   k in s1
;   root in s2
insertTemplate:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; root
  ; sci/calc.e16.ts:868  if (k === K_LOG) insert(T_TEN)
  li t0, 20
  bne s1, t0, .L1
  ; sci/calc.e16.ts:868  insert(T_TEN)
  li a0, 21
  call insert
.L1:
  ; sci/calc.e16.ts:869  if (k === K_LN) insert(T_E)
  li t0, 21
  bne s1, t0, .L2
  ; sci/calc.e16.ts:869  insert(T_E)
  li a0, 101
  call insert
.L2:
  ; sci/calc.e16.ts:870  insert(root ? T_ROOT : T_POWT)
  beqz s2, .L3
  li t0, 25
  j .L4
.L3:
  li t0, 26
.L4:
  mv a0, t0
  call insert
  ; sci/calc.e16.ts:871  insert(T_END)
  li a0, 24
  call insert
  ; sci/calc.e16.ts:872  cursor--
  lw t0, 0x0584(zero)
  addi t0, t0, -1
  sw t0, 0x0584(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:876 commandKey(k, shift, alpha) at -O1
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
  ; sci/calc.e16.ts:877  switch (k) {
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
  ; sci/calc.e16.ts:879  clearLine()
  call clearLine
  ; sci/calc.e16.ts:880  return true
  li a0, 1
  j .return
.L3:
  ; sci/calc.e16.ts:882  if (mode === MODE_TABLE) tableRange()
  lw t0, 0x04b8(zero)
  li t1, 3
  bne t0, t1, .L15
  ; sci/calc.e16.ts:882  tableRange()
  call tableRange
  j .L16
.L15:
  ; sci/calc.e16.ts:883  equals(shift)
  mv a0, s2
  call equals
.L16:
  ; sci/calc.e16.ts:884  return true
  li a0, 1
  j .return
.L4:
  ; sci/calc.e16.ts:886  exactOrDecimal(shift)
  mv a0, s2
  call exactOrDecimal
  ; sci/calc.e16.ts:887  return true
  li a0, 1
  j .return
.L5:
  ; sci/calc.e16.ts:890  screen = shift ? S_CONST : S_FUNC
  beqz s2, .L17
  li t0, 6
  j .L18
.L17:
  li t0, 4
.L18:
  sw t0, 0x04b6(zero)
  ; sci/calc.e16.ts:891  noCursor()
  ; sci/lcd.e16.ts:139  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; sci/calc.e16.ts:892  if (shift) constScreen()
  beqz s2, .L19
  ; sci/calc.e16.ts:892  constScreen()
  la t0, constScreen
  li t1, 10
  call far_call
  j .L20
.L19:
  ; sci/calc.e16.ts:893  funcScreen()
  la t0, funcScreen
  li t1, 1
  call far_call
.L20:
  ; sci/calc.e16.ts:894  return true
  li a0, 1
  j .return
.L6:
  ; sci/calc.e16.ts:896  solveKey(shift)
  mv a0, s2
  call solveKey
  ; sci/calc.e16.ts:897  return true
  li a0, 1
  j .return
.L7:
  ; sci/calc.e16.ts:899  hyp = !shift
  seqz t0, s2
  sw t0, 0x0594(zero)
  ; sci/calc.e16.ts:900  if (shift) refuse()
  beqz s2, .L21
  ; sci/calc.e16.ts:900  refuse()
  call refuse
.L21:
  ; sci/calc.e16.ts:901  return true
  li a0, 1
  j .return
.L8:
  ; sci/calc.e16.ts:903  recalling = shift
  sw s2, 0x058e(zero)
  ; sci/calc.e16.ts:904  storing = !shift
  seqz t0, s2
  sw t0, 0x058c(zero)
  ; sci/calc.e16.ts:905  return true
  li a0, 1
  j .return
.L9:
.L10:
  ; sci/calc.e16.ts:908  arrow(k === K_LEFT)
  li t0, 2
  sub t0, s1, t0
  seqz a0, t0
  call arrow
  ; sci/calc.e16.ts:909  return true
  li a0, 1
  j .return
.L11:
.L12:
  ; sci/calc.e16.ts:912  history(k === K_UP)
  sub t0, s1, zero
  seqz a0, t0
  call history
  ; sci/calc.e16.ts:913  return true
  li a0, 1
  j .return
.L13:
  ; sci/calc.e16.ts:916  if (shift) {
  beqz s2, .L22
  ; sci/calc.e16.ts:917  overwrite = !overwrite
  lw t0, 0x0592(zero)
  seqz t0, t0
  sw t0, 0x0592(zero)
  ; sci/calc.e16.ts:918  drawCalc()
  call drawCalc
  j .L23
.L22:
  ; sci/calc.e16.ts:919  deleteBefore()
  call deleteBefore
.L23:
  ; sci/calc.e16.ts:920  return true
  li a0, 1
  j .return
.L14:
  ; sci/calc.e16.ts:922  if (!shift) return false
  bnez s2, .L24
  ; sci/calc.e16.ts:922  return false
  li a0, 0
  j .return
.L24:
  ; sci/calc.e16.ts:923  if (answered) dmsMark()
  lw t0, 0x0586(zero)
  beqz t0, .L25
  ; sci/calc.e16.ts:923  dmsMark()
  call dmsMark
  j .L26
.L25:
  ; sci/calc.e16.ts:924  refuse()
  call refuse
.L26:
  ; sci/calc.e16.ts:925  return true
  li a0, 1
  j .return
.L1:
  ; sci/calc.e16.ts:927  if (k !== K_MPLUS || alpha) return false
  li t0, 37
  bne s1, t0, .L28
  beqz s3, .L27
.L28:
  ; sci/calc.e16.ts:927  return false
  li a0, 0
  j .return
.L27:
  ; sci/calc.e16.ts:928  memoryPlus(shift)
  mv a0, s2
  call memoryPlus
  ; sci/calc.e16.ts:929  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calc.e16.ts:933 fromAns(t) at -O1
;   t in a0
fromAns:
  ; sci/calc.e16.ts:934  return (
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

; sci/calc.e16.ts:951 type(t) at -O1
;   t in s1
type:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/calc.e16.ts:952  if (answered) afresh(fromAns(t))
  lw t0, 0x0586(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:952  afresh(fromAns(t))
  mv a0, s1
  call fromAns
  call afresh
.L1:
  ; sci/calc.e16.ts:953  insert(t)
  mv a0, s1
  call insert
  ; sci/calc.e16.ts:954  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:957 insert(t) at -O1
;   t in s1
insert:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/calc.e16.ts:959  if (overwrite && cursor < length && overwritable(t) && overwritable(line[cursor])) {
  lw t0, 0x0592(zero)
  beqz t0, .L1
  lw t0, 0x0584(zero)
  lw t1, 0x0582(zero)
  bgeu t0, t1, .L1
  mv a0, s1
  call overwritable
  beqz a0, .L1
  lw t0, 0x0584(zero)
  lbu a0, line(t0)
  call overwritable
  beqz a0, .L1
  ; sci/calc.e16.ts:960  line[cursor] = t
  lw t0, 0x0584(zero)
  sb s1, line(t0)
  ; sci/calc.e16.ts:961  cursor++
  lw t0, 0x0584(zero)
  addi t0, t0, 1
  sw t0, 0x0584(zero)
  ; sci/calc.e16.ts:962  return
  j .return
.L1:
  ; sci/calc.e16.ts:964  if (length >= lineMax()) {
  lw t0, 0x0582(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  call lineMax
  lw t0, 0(sp)
  addi sp, sp, 2
  bltu t0, a0, .L2
  ; sci/calc.e16.ts:965  refuse()
  call refuse
  ; sci/calc.e16.ts:966  return
  j .return
.L2:
  ; sci/calc.e16.ts:968  memcpy(addr(line) + cursor + 1, addr(line) + cursor, length - cursor)
  lw t0, 0x0584(zero)
  lw t1, 0x0584(zero)
  lw t2, 0x0582(zero)
  lw t3, 0x0584(zero)
  sub a2, t2, t3
  addi a0, t0, line+1
  addi a1, t1, line
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:969  line[cursor] = t
  lw t0, 0x0584(zero)
  sb s1, line(t0)
  ; sci/calc.e16.ts:970  length++
  lw t0, 0x0582(zero)
  addi t0, t0, 1
  sw t0, 0x0582(zero)
  ; sci/calc.e16.ts:971  cursor++
  lw t0, 0x0584(zero)
  addi t0, t0, 1
  sw t0, 0x0584(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:975 overwritable(t) at -O1
;   t in s1
overwritable:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/calc.e16.ts:976  return !opensTemplate(t) && !isSeparator(t) && t !== T_END
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

; sci/calc.e16.ts:979 deleteBefore() at -O1
deleteBefore:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:980  if (answered) {
  lw t0, 0x0586(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:981  answered = false
  sw zero, 0x0586(zero)
  ; sci/calc.e16.ts:982  cursor = length
  lw t0, 0x0582(zero)
  sw t0, 0x0584(zero)
.L1:
  ; sci/calc.e16.ts:984  deleteAt(addr(line), length, cursor)
  lw a1, 0x0582(zero)
  lw a2, 0x0584(zero)
  la a0, line
  la t0, deleteAt
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:985  edited()
  call edited
  ; sci/calc.e16.ts:986  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:990 arrow(left) at -O1
;   left in s1
arrow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; left
  ; sci/calc.e16.ts:991  if (answered) {
  lw t0, 0x0586(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:992  answered = false
  sw zero, 0x0586(zero)
  ; sci/calc.e16.ts:993  cursor = left ? length : 0
  beqz s1, .L2
  lw t0, 0x0582(zero)
  j .L3
.L2:
  li t0, 0
.L3:
  sw t0, 0x0584(zero)
  j .L4
.L1:
  ; sci/calc.e16.ts:994  if (left) {
  beqz s1, .L5
  ; sci/calc.e16.ts:995  cursor = cursor > 0 ? cursor - 1 : length
  lw t0, 0x0584(zero)
  bgeu zero, t0, .L6
  lw t0, 0x0584(zero)
  addi t0, t0, -1
  j .L7
.L6:
  lw t0, 0x0582(zero)
.L7:
  sw t0, 0x0584(zero)
  j .L8
.L5:
  ; sci/calc.e16.ts:997  cursor = cursor < length ? cursor + 1 : 0
  lw t0, 0x0584(zero)
  lw t1, 0x0582(zero)
  bgeu t0, t1, .L9
  lw t0, 0x0584(zero)
  addi t0, t0, 1
  j .L10
.L9:
  li t0, 0
.L10:
  sw t0, 0x0584(zero)
.L8:
.L4:
  ; sci/calc.e16.ts:999  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:1009 equals(approx) at -O1
;   approx in s2
;   made in s1
equals:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; approx
  ; sci/calc.e16.ts:1010  if (length === 0) return
  lw t0, 0x0582(zero)
  bne t0, zero, .L1
  ; sci/calc.e16.ts:1010  return
  j .return
.L1:
  ; sci/calc.e16.ts:1012  if (mode === MODE_CALC) {
  lw t0, 0x04b8(zero)
  bne t0, zero, .L2
  ; sci/calc.e16.ts:1013  const made = withConstant(addr(line), length)
  lw a1, 0x0582(zero)
  la a0, line
  la t0, withConstant
  li t1, 10
  call far_call
  mv s1, a0 ; made
  ; sci/calc.e16.ts:1014  if (made !== 0xffff) {
  li t0, 65535
  beq s1, t0, .L3
  ; sci/calc.e16.ts:1015  length = made
  sw s1, 0x0582(zero)
  ; sci/calc.e16.ts:1016  cursor = made
  sw s1, 0x0584(zero)
.L3:
.L2:
  ; sci/calc.e16.ts:1019  clearStack()
  ; sci/numbers.e16.ts:273  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0490(zero)
  ; sci/calc.e16.ts:1020  if (mode === MODE_BASE) baseEvaluate(addr(line), length)
  lw t0, 0x04b8(zero)
  li t1, 2
  bne t0, t1, .L4
  ; sci/calc.e16.ts:1020  baseEvaluate(addr(line), length)
  lw a1, 0x0582(zero)
  la a0, line
  la t0, baseEvaluate
  li t1, 8
  call far_call
  j .L5
.L4:
  ; sci/calc.e16.ts:1021  if (mode === MODE_CPLX) cplxEvaluate(addr(line), length)
  lw t0, 0x04b8(zero)
  li t1, 5
  bne t0, t1, .L6
  ; sci/calc.e16.ts:1021  cplxEvaluate(addr(line), length)
  lw a1, 0x0582(zero)
  la a0, line
  la t0, cplxEvaluate
  li t1, 6
  call far_call
  j .L7
.L6:
  ; sci/calc.e16.ts:1022  if (mode === MODE_MATRIX) matEvaluate(addr(line), length)
  lw t0, 0x04b8(zero)
  li t1, 6
  bne t0, t1, .L8
  ; sci/calc.e16.ts:1022  matEvaluate(addr(line), length)
  lw a1, 0x0582(zero)
  la a0, line
  la t0, matEvaluate
  li t1, 9
  call far_call
  j .L9
.L8:
  ; sci/calc.e16.ts:1023  if (mode === MODE_PROG) progRun(addr(line), length)
  lw t0, 0x04b8(zero)
  li t1, 7
  bne t0, t1, .L10
  ; sci/calc.e16.ts:1023  progRun(addr(line), length)
  lw a1, 0x0582(zero)
  la a0, line
  la t0, progRun
  li t1, 5
  call far_call
  j .L11
.L10:
  ; sci/calc.e16.ts:1024  evaluate(addr(line), length)
  lw a1, 0x0582(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
.L11:
.L9:
.L7:
.L5:
  ; sci/calc.e16.ts:1025  if (mode === MODE_CALC) noteConstant(addr(line), length)
  lw t0, 0x04b8(zero)
  bne t0, zero, .L12
  ; sci/calc.e16.ts:1025  noteConstant(addr(line), length)
  lw a1, 0x0582(zero)
  la a0, line
  la t0, noteConstant
  li t1, 10
  call far_call
.L12:
  ; sci/calc.e16.ts:1026  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
  ; sci/calc.e16.ts:1027  remember()
  call remember
  ; sci/calc.e16.ts:1028  answered = true
  li t0, 1
  sw t0, 0x0586(zero)
  ; sci/calc.e16.ts:1029  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x0598(zero)
  ; sci/calc.e16.ts:1030  found = false
  sw zero, 0x0596(zero)
  ; sci/calc.e16.ts:1032  if (pairLine(addr(line), length)) shown = SHOW_PAIR
  lw a1, 0x0582(zero)
  la a0, line
  la t0, pairLine
  li t1, 5
  call far_call
  beqz a0, .L13
  ; sci/calc.e16.ts:1032  shown = SHOW_PAIR
  li t0, 5
  sw t0, 0x059a(zero)
  j .L14
.L13:
  ; sci/calc.e16.ts:1033  shown = firstShown(formFirst(approx))
  mv a0, s2
  call formFirst
  la t0, firstShown
  li t1, 5
  call far_call
  sw a0, 0x059a(zero)
.L14:
  ; sci/calc.e16.ts:1034  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:1038 formFirst(approx) at -O1
;   approx in s1
formFirst:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; approx
  ; sci/calc.e16.ts:1039  return twoD() && !approx && peek(KEEP_ANSWER) === 0 && !decimalTyped()
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

; sci/calc.e16.ts:1043 tableRange() at -O1
tableRange:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:1044  if (length === 0) {
  lw t0, 0x0582(zero)
  bne t0, zero, .L1
  ; sci/calc.e16.ts:1045  refuse()
  call refuse
  ; sci/calc.e16.ts:1046  return
  j .return
.L1:
  ; sci/calc.e16.ts:1048  tableAskFrom()
  la t0, tableAskFrom
  li t1, 10
  call far_call
  ; sci/calc.e16.ts:1049  screen = S_ASK
  li t0, 5
  sw t0, 0x04b6(zero)
  ; sci/calc.e16.ts:1050  askRange(0, rangeAt(0))
  li a0, 0
  li a1, 7368
  la t0, askRange
  li t1, 6
  call far_call
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:1054 solveKey(find) at -O1
;   find in s1
solveKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; find
  ; sci/calc.e16.ts:1055  if (answered) {
  lw t0, 0x0586(zero)
  beqz t0, .L1
  ; sci/calc.e16.ts:1056  answered = false
  sw zero, 0x0586(zero)
  ; sci/calc.e16.ts:1057  cursor = length
  lw t0, 0x0582(zero)
  sw t0, 0x0584(zero)
.L1:
  ; sci/calc.e16.ts:1059  if (length === 0) {
  lw t0, 0x0582(zero)
  bne t0, zero, .L2
  ; sci/calc.e16.ts:1060  refuse()
  call refuse
  ; sci/calc.e16.ts:1061  return
  j .return
.L2:
  ; sci/calc.e16.ts:1063  found = find
  sw s1, 0x0596(zero)
  ; sci/calc.e16.ts:1064  screen = S_ASK
  li t0, 5
  sw t0, 0x04b6(zero)
  ; sci/calc.e16.ts:1065  askStart(addr(line), length, find)
  lw a1, 0x0582(zero)
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

; sci/calc.e16.ts:1069 decimalTyped() at -O1
;   i in a0
decimalTyped:
  ; sci/calc.e16.ts:1070  for (let i: u16 = 0; i < length; i++) {
  li a0, 0 ; i
  j .L3
.L1:
  ; sci/calc.e16.ts:1071  if (line[i] === T_POINT) return true
  lbu t0, line(a0)
  li t1, 46
  bne t0, t1, .L5
  ; sci/calc.e16.ts:1071  return true
  li a0, 1
  ret
.L5:
  addi a0, a0, 1
.L3:
  lw t0, 0x0582(zero)
  bltu a0, t0, .L1
  ; sci/calc.e16.ts:1073  return false
  li a0, 0
.return:
  ret

; sci/calc.e16.ts:1080 exactOrDecimal(shift) at -O1
;   shift in s1
exactOrDecimal:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; shift
  ; sci/calc.e16.ts:1081  if (!answered || shown === SHOW_PAIR) {
  lw t0, 0x0586(zero)
  beqz t0, .L2
  lw t0, 0x059a(zero)
  li t1, 5
  bne t0, t1, .L1
.L2:
  ; sci/calc.e16.ts:1082  refuse()
  call refuse
  ; sci/calc.e16.ts:1083  return
  j .return
.L1:
  ; sci/calc.e16.ts:1085  if (shift) shown = SHOW_ENG
  beqz s1, .L3
  ; sci/calc.e16.ts:1085  shown = SHOW_ENG
  li t0, 3
  sw t0, 0x059a(zero)
  j .L4
.L3:
  ; sci/calc.e16.ts:1086  if (twoD() && hasForm()) shown = nextShown(shown)
  call twoD
  beqz a0, .L5
  la t0, hasForm
  li t1, 5
  call far_call
  beqz a0, .L5
  ; sci/calc.e16.ts:1086  shown = nextShown(shown)
  lw a0, 0x059a(zero)
  la t0, nextShown
  li t1, 5
  call far_call
  sw a0, 0x059a(zero)
  j .L6
.L5:
  ; sci/calc.e16.ts:1087  if (shown !== SHOW_DECIMAL && shown !== SHOW_FOUND) shown = SHOW_DECIMAL
  lw t0, 0x059a(zero)
  beq t0, zero, .L7
  lw t0, 0x059a(zero)
  li t1, 6
  beq t0, t1, .L7
  ; sci/calc.e16.ts:1087  shown = SHOW_DECIMAL
  sw zero, 0x059a(zero)
  j .L8
.L7:
  ; sci/calc.e16.ts:1089  refuse()
  call refuse
  ; sci/calc.e16.ts:1090  return
  j .return
.L8:
.L6:
.L4:
  ; sci/calc.e16.ts:1092  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calc.e16.ts:1096 variableKey(k/letter) at -O1
;   k/letter in s1
;   store in s2
variableKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/letter
  ; sci/calc.e16.ts:1097  const store = storing
  lw s2, 0x058c(zero)
  ; sci/calc.e16.ts:1098  storing = false
  sw zero, 0x058c(zero)
  ; sci/calc.e16.ts:1099  recalling = false
  sw zero, 0x058e(zero)
  ; sci/calc.e16.ts:1100  const letter = letterOf(k)
  mv a0, s1
  la t0, letterOf
  li t1, 4
  call far_call
  mv s1, a0 ; k/letter
  ; sci/calc.e16.ts:1101  if (letter === 0 || letter === T_E) {
  beq s1, zero, .L2
  li t0, 101
  bne s1, t0, .L1
.L2:
  ; sci/calc.e16.ts:1102  refuse()
  call refuse
  ; sci/calc.e16.ts:1103  return
  j .return
.L1:
  ; sci/calc.e16.ts:1105  if (store) {
  beqz s2, .L3
  ; sci/calc.e16.ts:1106  if (!answered && length > 0) {
  lw t0, 0x0586(zero)
  bnez t0, .L4
  lw t0, 0x0582(zero)
  bgeu zero, t0, .L4
  ; sci/calc.e16.ts:1107  clearStack()
  ; sci/numbers.e16.ts:273  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0490(zero)
  ; sci/calc.e16.ts:1108  evaluate(addr(line), length)
  lw a1, 0x0582(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/calc.e16.ts:1109  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
  ; sci/calc.e16.ts:1110  remember()
  call remember
.L4:
  ; sci/calc.e16.ts:1112  copyValue(KEEP_ANS, varAt(letter))
  mv a0, s1
  call varAt
  mv a1, a0
  li a0, 3080
  call copyValue
  j .L5
.L3:
  ; sci/calc.e16.ts:1114  copyValue(varAt(letter), KEEP_ANS)
  mv a0, s1
  call varAt
  li a1, 3080
  call copyValue
.L5:
  ; sci/calc.e16.ts:1116  shown = firstShown(formFirst(false))
  li a0, 0
  call formFirst
  la t0, firstShown
  li t1, 5
  call far_call
  sw a0, 0x059a(zero)
  ; sci/calc.e16.ts:1117  found = false
  sw zero, 0x0596(zero)
  ; sci/calc.e16.ts:1118  length = 0
  sw zero, 0x0582(zero)
  ; sci/calc.e16.ts:1119  cursor = 0
  sw zero, 0x0584(zero)
  ; sci/calc.e16.ts:1120  insert(T_ANS)
  li a0, 20
  call insert
  ; sci/calc.e16.ts:1121  answered = true
  li t0, 1
  sw t0, 0x0586(zero)
  ; sci/calc.e16.ts:1122  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:1126 memoryPlus(minus/op) at -O1
;   minus/op in s1
;   m in s2
memoryPlus:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; minus/op
  ; sci/calc.e16.ts:1127  if (!answered) {
  lw t0, 0x0586(zero)
  bnez t0, .L1
  ; sci/calc.e16.ts:1128  if (length === 0) insert(T_ANS)
  lw t0, 0x0582(zero)
  bne t0, zero, .L2
  ; sci/calc.e16.ts:1128  insert(T_ANS)
  li a0, 20
  call insert
.L2:
  ; sci/calc.e16.ts:1129  clearStack()
  ; sci/numbers.e16.ts:273  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0490(zero)
  ; sci/calc.e16.ts:1130  evaluate(addr(line), length)
  lw a1, 0x0582(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/calc.e16.ts:1131  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
  ; sci/calc.e16.ts:1132  remember()
  call remember
.L1:
  ; sci/calc.e16.ts:1134  const m = varAt(0x4d)
  li s2, 3408 ; m
  ; sci/calc.e16.ts:1135  const op = minus ? M_SUB : M_ADD
  beqz s1, .L3
  li t0, 2
  j .L4
.L3:
  li t0, 1
.L4:
  mv s1, t0 ; minus/op
  ; sci/calc.e16.ts:1136  math(op, m, KEEP_ANS, 0)
  mv a0, s1
  mv a1, s2
  li a2, 3080
  li a3, 0
  call math
  ; sci/calc.e16.ts:1137  exactBinary(op, m, KEEP_ANS)
  mv a0, s1
  mv a1, s2
  li a2, 3080
  la t0, exactBinary
  li t1, 2
  call far_call
  ; sci/calc.e16.ts:1138  answered = true
  li t0, 1
  sw t0, 0x0586(zero)
  ; sci/calc.e16.ts:1139  shown = firstShown(formFirst(false))
  li a0, 0
  call formFirst
  la t0, firstShown
  li t1, 5
  call far_call
  sw a0, 0x059a(zero)
  ; sci/calc.e16.ts:1140  found = false
  sw zero, 0x0596(zero)
  ; sci/calc.e16.ts:1141  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calc.e16.ts:1147 remember() at -O1
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
  ; sci/calc.e16.ts:1148  const entries = historyEntries()
  call historyEntries
  mv s1, a0 ; entries/kept
  ; sci/calc.e16.ts:1149  if (entries === 0) return
  bne s1, zero, .L1
  ; sci/calc.e16.ts:1149  return
  j .return
.L1:
  ; sci/calc.e16.ts:1150  const at = historyAt_()
  call historyAt_
  mv s2, a0 ; at
  ; sci/calc.e16.ts:1151  const size = historySize()
  call historySize
  mv s3, a0 ; size
  ; sci/calc.e16.ts:1152  const count = peek16(historyCount())
  call historyCount
  lw s0, 0(a0)
  ; sci/calc.e16.ts:1153  const kept = count < entries ? count : entries - 1
  bgeu s0, s1, .L2
  mv t0, s0
  j .L3
.L2:
  addi t0, s1, -1
.L3:
  mv s1, t0 ; entries/kept
  ; sci/calc.e16.ts:1154  memcpy(at + size, at, kept * size)
  add a0, s2, s3
  mul a2, s1, s3
  mv a1, s2
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:1155  poke(at, length)
  lw t0, 0x0582(zero)
  sb t0, 0(s2)
  ; sci/calc.e16.ts:1156  memcpy(at + 1, addr(line), length)
  lw a2, 0x0582(zero)
  addi a0, s2, 1
  la a1, line
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:1157  poke16(historyCount(), kept + 1)
  call historyCount
  addi t0, s1, 1
  sw t0, 0(a0)
  ; sci/calc.e16.ts:1159  historyAt = 0xffff
  li t0, 65535
  sw t0, 0x0598(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/calc.e16.ts:1164 historyEntries() at -O1
historyEntries:
  ; sci/calc.e16.ts:1165  if (mode === MODE_CALC) return HISTORY_ENTRIES
  lw t0, 0x04b8(zero)
  bne t0, zero, .L1
  ; sci/calc.e16.ts:1165  return HISTORY_ENTRIES
  li a0, 10
  ret
.L1:
  ; sci/calc.e16.ts:1166  return mode === MODE_BASE ? 5 : 0
  lw t0, 0x04b8(zero)
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

; sci/calc.e16.ts:1169 historyAt_() at -O1
historyAt_:
  ; sci/calc.e16.ts:1170  return mode === MODE_BASE ? BASE_HISTORY : KEEP_HISTORY
  lw t0, 0x04b8(zero)
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

; sci/calc.e16.ts:1173 historySize() at -O1
historySize:
  ; sci/calc.e16.ts:1174  return mode === MODE_BASE ? 100 : HISTORY_SIZE
  lw t0, 0x04b8(zero)
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

; sci/calc.e16.ts:1177 historyCount() at -O1
historyCount:
  ; sci/calc.e16.ts:1178  return mode === MODE_BASE ? BASE_HISTORY_COUNT : KEEP_HISTORY_COUNT
  lw t0, 0x04b8(zero)
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

; sci/calc.e16.ts:1185 history(older/entry) at -O1
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
  ; sci/calc.e16.ts:1186  if (!answered && twoD()) {
  lw t0, 0x0586(zero)
  bnez t0, .L1
  call twoD
  beqz a0, .L1
  ; sci/calc.e16.ts:1187  vertical(addr(line), length, cursor, older)
  lw a1, 0x0582(zero)
  lw a2, 0x0584(zero)
  la a0, line
  mv a3, s1
  la t0, vertical
  li t1, 4
  call far_call
  ; sci/calc.e16.ts:1188  if (editCursor !== 0xffff) {
  lw t0, 0x06d2(zero)
  li t1, 65535
  beq t0, t1, .L2
  ; sci/calc.e16.ts:1189  cursor = editCursor
  lw t0, 0x06d2(zero)
  sw t0, 0x0584(zero)
  ; sci/calc.e16.ts:1190  drawCalc()
  call drawCalc
  ; sci/calc.e16.ts:1191  return
  j .return
.L2:
.L1:
  ; sci/calc.e16.ts:1194  const count = historyEntries() === 0 ? 0 : peek16(historyCount())
  call historyEntries
  bne a0, zero, .L3
  li t0, 0
  j .L4
.L3:
  call historyCount
  lw t0, 0(a0)
.L4:
  mv s0, t0 ; count
  ; sci/calc.e16.ts:1195  const browsing = historyAt !== 0xffff
  lw t0, 0x0598(zero)
  li t1, 65535
  sub t0, t0, t1
  snez s3, t0
  ; sci/calc.e16.ts:1196  if (!answered && length > 0 && !browsing) return
  lw t0, 0x0586(zero)
  bnez t0, .L5
  lw t0, 0x0582(zero)
  bgeu zero, t0, .L5
  bnez s3, .L5
  ; sci/calc.e16.ts:1196  return
  j .return
.L5:
  ; sci/calc.e16.ts:1197  let next = historyAt
  lw s2, 0x0598(zero)
  ; sci/calc.e16.ts:1198  if (older) next = browsing ? historyAt + 1 : 0
  beqz s1, .L6
  ; sci/calc.e16.ts:1198  next = browsing ? historyAt + 1 : 0
  beqz s3, .L7
  lw t0, 0x0598(zero)
  addi t0, t0, 1
  j .L8
.L7:
  li t0, 0
.L8:
  mv s2, t0 ; next
  j .L9
.L6:
  ; sci/calc.e16.ts:1199  if (browsing && historyAt > 0) next = historyAt - 1
  beqz s3, .L10
  lw t0, 0x0598(zero)
  bgeu zero, t0, .L10
  ; sci/calc.e16.ts:1199  next = historyAt - 1
  lw t0, 0x0598(zero)
  addi s2, t0, -1
  j .L11
.L10:
  ; sci/calc.e16.ts:1200  return
  j .return
.L11:
.L9:
  ; sci/calc.e16.ts:1201  if (next >= count) return
  bltu s2, s0, .L12
  ; sci/calc.e16.ts:1201  return
  j .return
.L12:
  ; sci/calc.e16.ts:1202  historyAt = next
  sw s2, 0x0598(zero)
  ; sci/calc.e16.ts:1203  const entry = historyAt_() + next * historySize()
  call historyAt_
  addi sp, sp, -2
  sw a0, 0(sp)
  call historySize
  mul t0, s2, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  add s1, t1, t0
  ; sci/calc.e16.ts:1204  length = peek(entry)
  lbu t0, 0(s1)
  sw t0, 0x0582(zero)
  ; sci/calc.e16.ts:1205  memcpy(addr(line), entry + 1, length)
  lw a2, 0x0582(zero)
  la a0, line
  addi a1, s1, 1
  mcpy a0, a1, a2
  ; sci/calc.e16.ts:1206  cursor = length
  lw t0, 0x0582(zero)
  sw t0, 0x0584(zero)
  ; sci/calc.e16.ts:1207  answered = false
  sw zero, 0x0586(zero)
  ; sci/calc.e16.ts:1208  drawCalc()
  call drawCalc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/calc.e16.ts:1214 drawCalc() at -O1
drawCalc:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:1215  drawScreen()
  la t0, drawScreen
  li t1, 3
  call far_call
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/calc.e16.ts:1219 drawMarks() at -O1
drawMarks:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/calc.e16.ts:1220  drawAnnunciators()
  la t0, drawAnnunciators
  li t1, 3
  call far_call
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
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
  .align 2
e16c_fixed_end:

  .bank 0
  .org 0xc000
; sci/eval.e16.ts:187 tok() at -O1
tok:
  ; sci/eval.e16.ts:188  return pos < lineLength ? peek(lineAt + pos) : 0
  lw t0, 0x05a0(zero)
  lw t1, 0x059e(zero)
  bgeu t0, t1, .L1
  lw t0, 0x059c(zero)
  lw t1, 0x05a0(zero)
  add t0, t0, t1
  lbu t0, 0(t0)
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
.return:
  ret

; sci/eval.e16.ts:192 evalToken(i) at -O1
;   i in a0
evalToken:
  ; sci/eval.e16.ts:193  return i < lineLength ? peek(lineAt + i) : 0
  lw t0, 0x059e(zero)
  bgeu a0, t0, .L1
  lw t0, 0x059c(zero)
  add t0, t0, a0
  lbu t0, 0(t0)
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
.return:
  ret

; sci/eval.e16.ts:197 evalSum(from) at -O1
;   from in s1
evalSum:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; from
  ; sci/eval.e16.ts:198  pos = from
  sw s1, 0x05a0(zero)
  ; sci/eval.e16.ts:199  sum()
  call sum
  ; sci/eval.e16.ts:200  return pos
  lw a0, 0x05a0(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:207 evaluate(at, length) at -O1
;   at in s2
;   length in s1
evaluate:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; at
  mv s1, a1 ; length
  ; sci/eval.e16.ts:208  lineAt = at
  sw s2, 0x059c(zero)
  ; sci/eval.e16.ts:209  lineLength = length
  sw s1, 0x059e(zero)
  ; sci/eval.e16.ts:210  pos = 0
  sw zero, 0x05a0(zero)
  ; sci/eval.e16.ts:211  percentEnd = 0xffff
  li t0, 65535
  sw t0, 0x05a2(zero)
  ; sci/eval.e16.ts:212  poke16(MATH_ANGLE, peek(KEEP_ANGLE))
  lbu t0, 3074(zero)
  li t1, 65372
  sw t0, 0(t1)
  ; sci/eval.e16.ts:213  integralReset()
  la t0, integralReset
  li t1, 8
  call far_call
  ; sci/eval.e16.ts:214  if (length === 0) fail(E_SYNTAX, 0)
  bne s1, zero, .L1
  ; sci/eval.e16.ts:214  fail(E_SYNTAX, 0)
  li a0, 2
  li a1, 0
  call fail
.L1:
  ; sci/eval.e16.ts:215  compared()
  call compared
  ; sci/eval.e16.ts:216  if (pos < lineLength) fail(E_SYNTAX, pos)
  lw t0, 0x05a0(zero)
  lw t1, 0x059e(zero)
  bgeu t0, t1, .L2
  ; sci/eval.e16.ts:216  fail(E_SYNTAX, pos)
  lw a1, 0x05a0(zero)
  li a0, 2
  call fail
.L2:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:220 isComparison(t) at -O1
;   t in a0
isComparison:
  ; sci/eval.e16.ts:221  return t === T_EQUAL || t === T_LESS || t === T_MORE || (t >= T_NE && t <= T_GE)
  li t0, 61
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L3
  li t0, 60
  sub t0, a0, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 62
  sub t0, a0, t0
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 185
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L4
  li t0, 187
  sltu t0, t0, a0
  xori t0, t0, 1
.L4:
.L1:
  mv a0, t0
.return:
  ret

; sci/eval.e16.ts:225 compared() at -O1
;   t in s3
;   at in s0
;   b/c in s1
;   holds in s2
compared:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  ; sci/eval.e16.ts:226  sum()
  call sum
  ; sci/eval.e16.ts:227  const t = tok()
  call tok
  mv s3, a0 ; t
  ; sci/eval.e16.ts:228  if (!isComparison(t)) return
  mv a0, s3
  call isComparison
  bnez a0, .L1
  ; sci/eval.e16.ts:228  return
  j .return
.L1:
  ; sci/eval.e16.ts:229  const at = pos
  lw s0, 0x05a0(zero)
  ; sci/eval.e16.ts:230  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
  ; sci/eval.e16.ts:231  sum()
  call sum
  ; sci/eval.e16.ts:232  const b = top()
  call top
  mv s1, a0 ; b/c
  ; sci/eval.e16.ts:233  math(M_CMP, b - VALUE_SIZE, b, at)
  li a0, 6
  addi a1, s1, -36
  mv a2, s1
  mv a3, s0
  call math
  ; sci/eval.e16.ts:234  const c = i16(peek16(MATH_RESULT))
  li t0, 65370
  lw s1, 0(t0)
  ; sci/eval.e16.ts:235  let holds = false
  li s2, 0 ; holds
  ; sci/eval.e16.ts:236  if (t === T_EQUAL) holds = c === 0
  li t0, 61
  bne s3, t0, .L2
  ; sci/eval.e16.ts:236  holds = c === 0
  sub t0, s1, zero
  seqz s2, t0
  j .L3
.L2:
  ; sci/eval.e16.ts:237  if (t === T_NE) holds = c !== 0
  li t0, 185
  bne s3, t0, .L4
  ; sci/eval.e16.ts:237  holds = c !== 0
  sub t0, s1, zero
  snez s2, t0
  j .L5
.L4:
  ; sci/eval.e16.ts:238  if (t === T_LESS) holds = c < 0
  li t0, 60
  bne s3, t0, .L6
  ; sci/eval.e16.ts:238  holds = c < 0
  slti s2, s1, 0
  j .L7
.L6:
  ; sci/eval.e16.ts:239  if (t === T_MORE) holds = c > 0
  li t0, 62
  bne s3, t0, .L8
  ; sci/eval.e16.ts:239  holds = c > 0
  slt s2, zero, s1
  j .L9
.L8:
  ; sci/eval.e16.ts:240  if (t === T_LE) holds = c <= 0
  li t0, 186
  bne s3, t0, .L10
  ; sci/eval.e16.ts:240  holds = c <= 0
  slt t0, zero, s1
  xori s2, t0, 1
  j .L11
.L10:
  ; sci/eval.e16.ts:241  holds = c >= 0
  slt t0, s1, zero
  xori s2, t0, 1
.L11:
.L9:
.L7:
.L5:
.L3:
  ; sci/eval.e16.ts:242  pop()
  call pop
  ; sci/eval.e16.ts:243  pop()
  call pop
  ; sci/eval.e16.ts:244  pushInt(holds ? 1 : 0, at)
  beqz s2, .L12
  li t0, 1
  j .L13
.L12:
  li t0, 0
.L13:
  mv a0, t0
  mv a1, s0
  call pushInt
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/eval.e16.ts:247 sum() at -O1
;   t in s1
;   at in s2
sum:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:248  prod()
  call prod
  ; sci/eval.e16.ts:249  for (;;) {
.L1:
  ; sci/eval.e16.ts:250  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:251  if (t !== T_PLUS && t !== T_MINUS) return
  li t0, 43
  beq s1, t0, .L5
  li t0, 45
  beq s1, t0, .L5
  ; sci/eval.e16.ts:251  return
  j .return
.L5:
  ; sci/eval.e16.ts:252  const at = pos
  lw s2, 0x05a0(zero)
  ; sci/eval.e16.ts:253  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
  ; sci/eval.e16.ts:254  prod()
  call prod
  ; sci/eval.e16.ts:255  if (percentEnd === pos) ofLeft(at)
  lw t0, 0x05a2(zero)
  lw t1, 0x05a0(zero)
  bne t0, t1, .L6
  ; sci/eval.e16.ts:255  ofLeft(at)
  mv a0, s2
  call ofLeft
.L6:
  ; sci/eval.e16.ts:256  binary(t === T_PLUS ? M_ADD : M_SUB, at)
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

; sci/eval.e16.ts:265 ofLeft(at) at -O1
;   at in s1
ofLeft:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; sci/eval.e16.ts:266  copyValue(top() - VALUE_SIZE, push(at))
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
  ; sci/eval.e16.ts:267  binary(M_MUL, at)
  li a0, 3
  mv a1, s1
  call binary
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:270 prod() at -O1
;   t in s1
;   at in s2
prod:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:271  implied()
  call implied
  ; sci/eval.e16.ts:272  for (;;) {
.L1:
  ; sci/eval.e16.ts:273  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:274  if (t !== T_TIMES && t !== T_DIVIDE) return
  li t0, 129
  beq s1, t0, .L5
  li t0, 130
  beq s1, t0, .L5
  ; sci/eval.e16.ts:274  return
  j .return
.L5:
  ; sci/eval.e16.ts:275  const at = pos
  lw s2, 0x05a0(zero)
  ; sci/eval.e16.ts:276  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
  ; sci/eval.e16.ts:277  implied()
  call implied
  ; sci/eval.e16.ts:278  binary(t === T_TIMES ? M_MUL : M_DIV, at)
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

; sci/eval.e16.ts:283 startsValue(t) at -O1
;   t in s1
startsValue:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/eval.e16.ts:284  return (
  mv a0, s1
  call isDigit
  mv t1, a0
  mv t0, a0
  bnez t1, .L19
  li t0, 46
  sub t0, s1, t0
  seqz t0, t0
.L19:
  mv t1, t0
  bnez t1, .L18
  li t0, 135
  sub t0, s1, t0
  seqz t0, t0
.L18:
  mv t1, t0
  bnez t1, .L17
  li t0, 40
  sub t0, s1, t0
  seqz t0, t0
.L17:
  mv t1, t0
  bnez t1, .L16
  li t0, 128
  sub t0, s1, t0
  seqz t0, t0
.L16:
  mv t1, t0
  bnez t1, .L15
  li t0, 101
  sub t0, s1, t0
  seqz t0, t0
.L15:
  mv t1, t0
  bnez t1, .L14
  li t0, 20
  sub t0, s1, t0
  seqz t0, t0
.L14:
  mv t1, t0
  bnez t1, .L13
  li t0, 21
  sub t0, s1, t0
  seqz t0, t0
.L13:
  mv t1, t0
  bnez t1, .L12
  li t0, 22
  sub t0, s1, t0
  seqz t0, t0
.L12:
  mv t1, t0
  bnez t1, .L11
  li t0, 25
  sub t0, s1, t0
  seqz t0, t0
.L11:
  mv t1, t0
  bnez t1, .L10
  li t0, 28
  sub t0, s1, t0
  seqz t0, t0
.L10:
  mv t1, t0
  bnez t1, .L9
  li t0, 30
  sub t0, s1, t0
  seqz t0, t0
.L9:
  mv t1, t0
  bnez t1, .L8
  li t0, 237
  sub t0, s1, t0
  seqz t0, t0
.L8:
  mv t1, t0
  bnez t1, .L7
  mv a0, s1
  call isStatValue
  mv t0, a0
.L7:
  mv t1, t0
  bnez t1, .L6
  li t0, 12
  sub t0, s1, t0
  seqz t0, t0
.L6:
  mv t1, t0
  bnez t1, .L5
  li t0, 13
  sub t0, s1, t0
  seqz t0, t0
.L5:
  mv t1, t0
  bnez t1, .L4
  li t0, 14
  sub t0, s1, t0
  seqz t0, t0
.L4:
  mv t1, t0
  bnez t1, .L3
  mv a0, s1
  call isConstant
  mv t0, a0
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

; sci/eval.e16.ts:308 implied() at -O1
;   at in s1
implied:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/eval.e16.ts:309  comb()
  call comb
  ; sci/eval.e16.ts:310  while (startsValue(tok())) {
  j .L3
.L1:
  ; sci/eval.e16.ts:311  const at = pos
  lw s1, 0x05a0(zero)
  ; sci/eval.e16.ts:312  comb()
  call comb
  ; sci/eval.e16.ts:313  binary(M_MUL, at)
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

; sci/eval.e16.ts:317 comb() at -O1
;   t in s1
;   at in s2
comb:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:318  slash()
  call slash
  ; sci/eval.e16.ts:319  for (;;) {
.L1:
  ; sci/eval.e16.ts:320  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:321  if (t !== T_NCR && t !== T_NPR) return
  li t0, 18
  beq s1, t0, .L5
  li t0, 19
  beq s1, t0, .L5
  ; sci/eval.e16.ts:321  return
  j .return
.L5:
  ; sci/eval.e16.ts:322  const at = pos
  lw s2, 0x05a0(zero)
  ; sci/eval.e16.ts:323  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
  ; sci/eval.e16.ts:324  slash()
  call slash
  ; sci/eval.e16.ts:325  choose(t === T_NCR, at)
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

; sci/eval.e16.ts:330 slash() at -O1
;   at in s1
slash:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/eval.e16.ts:331  unary()
  call unary
  ; sci/eval.e16.ts:332  while (tok() === T_SLASH) {
  j .L3
.L1:
  ; sci/eval.e16.ts:333  const at = pos
  lw s1, 0x05a0(zero)
  ; sci/eval.e16.ts:334  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
  ; sci/eval.e16.ts:335  unary()
  call unary
  ; sci/eval.e16.ts:336  binary(M_DIV, at)
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

; sci/eval.e16.ts:340 unary() at -O1
;   t/at in s1
unary:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/eval.e16.ts:341  const t = tok()
  call tok
  mv s1, a0 ; t/at
  ; sci/eval.e16.ts:342  if (t === T_NEG || t === T_MINUS) {
  li t0, 16
  beq s1, t0, .L2
  li t0, 45
  bne s1, t0, .L1
.L2:
  ; sci/eval.e16.ts:343  const at = pos
  lw s1, 0x05a0(zero)
  ; sci/eval.e16.ts:344  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
  ; sci/eval.e16.ts:345  unary()
  call unary
  ; sci/eval.e16.ts:346  math(M_NEG, top(), 0, at)
  call top
  mv a1, a0
  li a0, 16
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:347  exactNeg(top())
  call top
  la t0, exactNeg
  li t1, 2
  call far_call
  ; sci/eval.e16.ts:348  return
  j .return
.L1:
  ; sci/eval.e16.ts:350  if (t === T_PLUS) {
  li t0, 43
  bne s1, t0, .L3
  ; sci/eval.e16.ts:351  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
  ; sci/eval.e16.ts:352  unary()
  call unary
  ; sci/eval.e16.ts:353  return
  j .return
.L3:
  ; sci/eval.e16.ts:355  post()
  call post
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:358 post() at -O1
;   t in s1
;   at in s2
post:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:359  primary()
  call primary
  ; sci/eval.e16.ts:360  for (;;) {
.L1:
  ; sci/eval.e16.ts:361  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:362  const at = pos
  lw s2, 0x05a0(zero)
  ; sci/eval.e16.ts:363  if (t === T_POW || t === T_POWT) {
  li t0, 17
  beq s1, t0, .L6
  li t0, 26
  bne s1, t0, .L5
.L6:
  ; sci/eval.e16.ts:364  powers()
  call powers
  j .L1
.L5:
  ; sci/eval.e16.ts:365  if (t === T_SQUARE) {
  li t0, 132
  bne s1, t0, .L8
  ; sci/eval.e16.ts:366  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
  ; sci/eval.e16.ts:367  raise(2, at)
  li a0, 2
  mv a1, s2
  call raise
  j .L1
.L8:
  ; sci/eval.e16.ts:368  if (t === T_CUBE) {
  li t0, 133
  bne s1, t0, .L10
  ; sci/eval.e16.ts:369  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
  ; sci/eval.e16.ts:370  raise(3, at)
  li a0, 3
  mv a1, s2
  call raise
  j .L1
.L10:
  ; sci/eval.e16.ts:371  if (t === T_INVERSE) {
  li t0, 134
  bne s1, t0, .L12
  ; sci/eval.e16.ts:372  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
  ; sci/eval.e16.ts:373  inverse(at)
  mv a0, s2
  call inverse
  j .L1
.L12:
  ; sci/eval.e16.ts:374  if (t === T_BANG) {
  li t0, 33
  bne s1, t0, .L14
  ; sci/eval.e16.ts:375  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
  ; sci/eval.e16.ts:376  factorial(at)
  mv a0, s2
  call factorial
  j .L1
.L14:
  ; sci/eval.e16.ts:377  if (t === T_PERCENT) {
  li t0, 37
  bne s1, t0, .L16
  ; sci/eval.e16.ts:378  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
  ; sci/eval.e16.ts:379  pushInt(100, at)
  li a0, 100
  mv a1, s2
  call pushInt
  ; sci/eval.e16.ts:380  binary(M_DIV, at)
  li a0, 4
  mv a1, s2
  call binary
  ; sci/eval.e16.ts:381  percentEnd = pos
  lw t0, 0x05a0(zero)
  sw t0, 0x05a2(zero)
  j .L1
.L16:
  ; sci/eval.e16.ts:382  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:387 powers() at -O1
;   at in s1
;   template in s2
powers:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:388  const at = pos
  lw s1, 0x05a0(zero)
  ; sci/eval.e16.ts:389  const template = tok() === T_POWT
  call tok
  li t0, 26
  sub t0, a0, t0
  seqz s2, t0
  ; sci/eval.e16.ts:390  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
  ; sci/eval.e16.ts:391  sum()
  call sum
  ; sci/eval.e16.ts:392  if (template) expect(T_END)
  beqz s2, .L1
  ; sci/eval.e16.ts:392  expect(T_END)
  li a0, 24
  call expect
  j .L2
.L1:
  ; sci/eval.e16.ts:393  if (tok() === T_CLOSE) pos++
  call tok
  li t0, 41
  bne a0, t0, .L3
  ; sci/eval.e16.ts:393  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
.L3:
.L2:
  ; sci/eval.e16.ts:395  if (tok() === T_POW || tok() === T_POWT) powers()
  call tok
  li t0, 17
  beq a0, t0, .L5
  call tok
  li t0, 26
  bne a0, t0, .L4
.L5:
  ; sci/eval.e16.ts:395  powers()
  call powers
.L4:
  ; sci/eval.e16.ts:396  binary(M_POW, at)
  li a0, 5
  mv a1, s1
  call binary
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:400 expect(t) at -O1
;   t in s1
expect:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/eval.e16.ts:401  if (tok() !== t) fail(E_SYNTAX, pos)
  call tok
  beq a0, s1, .L1
  ; sci/eval.e16.ts:401  fail(E_SYNTAX, pos)
  lw a1, 0x05a0(zero)
  li a0, 2
  call fail
.L1:
  ; sci/eval.e16.ts:402  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/eval.e16.ts:405 raise(n, at) at -O1
;   n in s2
;   at in s1
raise:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; n
  mv s1, a1 ; at
  ; sci/eval.e16.ts:406  pushInt(n, at)
  mv a0, s2
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:407  binary(M_POW, at)
  li a0, 5
  mv a1, s1
  call binary
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:411 inverse(at) at -O1
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
  ; sci/eval.e16.ts:412  const x = top()
  call top
  mv s2, a0 ; x
  ; sci/eval.e16.ts:413  const one = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  mv s3, a0 ; one
  ; sci/eval.e16.ts:414  copyValue(x, push(at))
  mv a0, s1
  call push
  mv a1, a0
  mv a0, s2
  call copyValue
  ; sci/eval.e16.ts:415  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:416  copyValue(one, x)
  mv a0, s3
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:417  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/eval.e16.ts:421 factorial(at) at -O1
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
  ; sci/eval.e16.ts:422  const x = top()
  call top
  mv s3, a0 ; x
  ; sci/eval.e16.ts:423  const n = smallWhole(x, at)
  mv a0, s3
  mv a1, s1
  call smallWhole
  mv s0, a0 ; n
  ; sci/eval.e16.ts:424  if (n > 69) fail(E_MATH, at)
  li t0, 69
  bgeu t0, s0, .L1
  ; sci/eval.e16.ts:424  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L1:
  ; sci/eval.e16.ts:425  const f = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  sw a0, 0(sp) ; f
  ; sci/eval.e16.ts:426  for (let k: u16 = 2; k <= n; k++) {
  li s2, 2 ; k
  j .L4
.L2:
  ; sci/eval.e16.ts:427  pushInt(k, at)
  mv a0, s2
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:428  binary(M_MUL, at)
  li a0, 3
  mv a1, s1
  call binary
  addi s2, s2, 1
.L4:
  bgeu s0, s2, .L2
  ; sci/eval.e16.ts:430  copyValue(f, x)
  lw a0, 0(sp)
  mv a1, s3
  call copyValue
  ; sci/eval.e16.ts:431  pop()
  call pop
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  lw s2, 10(sp)
  addi sp, sp, 12
  ret

; sci/eval.e16.ts:435 choose(c, at) at -O1
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
  ; sci/eval.e16.ts:436  const r = top()
  call top
  mv s2, a0 ; r/rv
  ; sci/eval.e16.ts:437  const n = r - VALUE_SIZE
  addi s0, s2, -36
  ; sci/eval.e16.ts:438  const nv = smallWhole(n, at)
  mv a0, s0
  mv a1, s1
  call smallWhole
  sw a0, 0(sp) ; nv
  ; sci/eval.e16.ts:439  const rv = smallWhole(r, at)
  mv a0, s2
  mv a1, s1
  call smallWhole
  mv s2, a0 ; r/rv
  ; sci/eval.e16.ts:440  if (rv > nv) fail(E_MATH, at)
  lw t0, 0(sp) ; nv
  bgeu t0, s2, .L1
  ; sci/eval.e16.ts:440  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L1:
  ; sci/eval.e16.ts:441  const out = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  sw a0, 4(sp) ; out
  ; sci/eval.e16.ts:442  for (let k: u16 = 0; k < rv; k++) {
  li s3, 0 ; k
  j .L4
.L2:
  ; sci/eval.e16.ts:443  pushInt(nv - k, at)
  lw t0, 0(sp) ; nv
  sub a0, t0, s3
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:444  binary(M_MUL, at)
  li a0, 3
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:445  if (c) {
  lw t0, 2(sp) ; c
  beqz t0, .L6
  ; sci/eval.e16.ts:446  pushInt(k + 1, at)
  addi a0, s3, 1
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:447  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
.L6:
  addi s3, s3, 1
.L4:
  bltu s3, s2, .L2
  ; sci/eval.e16.ts:450  copyValue(out, n)
  lw a0, 4(sp)
  mv a1, s0
  call copyValue
  ; sci/eval.e16.ts:451  pop()
  call pop
  ; sci/eval.e16.ts:452  pop()
  call pop
.return:
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  lw s3, 14(sp)
  addi sp, sp, 16
  ret

; sci/eval.e16.ts:455 primary() at -O1
;   t in s1
;   at in s2
primary:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:456  const t = tok()
  call tok
  mv s1, a0 ; t
  ; sci/eval.e16.ts:457  const at = pos
  lw s2, 0x05a0(zero)
  ; sci/eval.e16.ts:458  if (isDigit(t) || t === T_POINT || t === T_EXP) {
  mv a0, s1
  call isDigit
  bnez a0, .L2
  li t0, 46
  beq s1, t0, .L2
  li t0, 135
  bne s1, t0, .L1
.L2:
  ; sci/eval.e16.ts:459  number()
  call number
  ; sci/eval.e16.ts:460  return
  j .return
.L1:
  ; sci/eval.e16.ts:462  if (t === 0) fail(E_SYNTAX, at)
  bne s1, zero, .L3
  ; sci/eval.e16.ts:462  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s2
  call fail
.L3:
  ; sci/eval.e16.ts:463  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
  ; sci/eval.e16.ts:464  if (!constant(t, at)) bracketed(t, at)
  mv a0, s1
  mv a1, s2
  call constant
  bnez a0, .L4
  ; sci/eval.e16.ts:464  bracketed(t, at)
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

; sci/eval.e16.ts:468 constant(t/n, at) at -O1
;   t/n in s1
;   at in s2
constant:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t/n
  mv s2, a1 ; at
  ; sci/eval.e16.ts:469  if (t === T_PI) {
  li t0, 128
  bne s1, t0, .L1
  ; sci/eval.e16.ts:470  math(M_PI, push(at), 0, at)
  mv a0, s2
  call push
  mv a1, a0
  li a0, 32
  li a2, 0
  mv a3, s2
  call math
  j .L2
.L1:
  ; sci/eval.e16.ts:471  if (t === T_E) {
  li t0, 101
  bne s1, t0, .L3
  ; sci/eval.e16.ts:472  const n = pushInt(1, at)
  li a0, 1
  mv a1, s2
  call pushInt
  mv s1, a0 ; t/n
  ; sci/eval.e16.ts:473  math(M_EXP, n, 0, at)
  li a0, 30
  mv a1, s1
  li a2, 0
  mv a3, s2
  call math
  ; sci/eval.e16.ts:474  inexact(n)
  mv a0, s1
  call inexact
  j .L4
.L3:
  ; sci/eval.e16.ts:475  if (t === T_TEN) {
  li t0, 21
  bne s1, t0, .L5
  ; sci/eval.e16.ts:476  pushInt(10, at)
  li a0, 10
  mv a1, s2
  call pushInt
  j .L6
.L5:
  ; sci/eval.e16.ts:477  if (t === T_ANS) {
  li t0, 20
  bne s1, t0, .L7
  ; sci/eval.e16.ts:478  copyValue(KEEP_ANS, push(at))
  mv a0, s2
  call push
  mv a1, a0
  li a0, 3080
  call copyValue
  j .L8
.L7:
  ; sci/eval.e16.ts:479  if (isVariable(t)) {
  mv a0, s1
  call isVariable
  beqz a0, .L9
  ; sci/eval.e16.ts:480  copyValue(varAt(t), push(at))
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
  ; sci/eval.e16.ts:481  if (t === T_RAN) {
  li t0, 237
  bne s1, t0, .L11
  ; sci/eval.e16.ts:482  math(M_RND, push(at), 0, at)
  mv a0, s2
  call push
  mv a1, a0
  li a0, 31
  li a2, 0
  mv a3, s2
  call math
  j .L12
.L11:
  ; sci/eval.e16.ts:483  if (isStatValue(t)) {
  mv a0, s1
  call isStatValue
  beqz a0, .L13
  ; sci/eval.e16.ts:484  statValue(statIndex(t), push(at))
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
  ; sci/eval.e16.ts:485  if (t === T_DICE || t === T_COIN || t === T_RINT) {
  li t0, 12
  beq s1, t0, .L16
  li t0, 13
  beq s1, t0, .L16
  li t0, 14
  bne s1, t0, .L15
.L16:
  ; sci/eval.e16.ts:486  randomWhole(t, at)
  mv a0, s1
  mv a1, s2
  call randomWhole
  j .L17
.L15:
  ; sci/eval.e16.ts:487  if (isConstant(t)) {
  mv a0, s1
  call isConstant
  beqz a0, .L18
  ; sci/eval.e16.ts:488  constValue(t, push(at))
  mv a0, s2
  call push
  mv a1, a0
  mv a0, s1
  la t0, constValue
  li t1, 10
  call far_call
  j .L19
.L18:
  ; sci/eval.e16.ts:489  return false
  li a0, 0
  j .return
.L19:
.L17:
.L14:
.L12:
.L10:
.L8:
.L6:
.L4:
.L2:
  ; sci/eval.e16.ts:490  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:494 bracketed(t, at) at -O1
;   t in s1
;   at in s2
bracketed:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t
  mv s2, a1 ; at
  ; sci/eval.e16.ts:495  if (template(t, at)) return
  mv a0, s1
  mv a1, s2
  call template
  beqz a0, .L1
  ; sci/eval.e16.ts:495  return
  j .return
.L1:
  ; sci/eval.e16.ts:496  if (t === T_OPEN) {
  li t0, 40
  bne s1, t0, .L2
  ; sci/eval.e16.ts:497  sum()
  call sum
  ; sci/eval.e16.ts:498  if (tok() === T_CLOSE) pos++
  call tok
  li t0, 41
  bne a0, t0, .L4
  ; sci/eval.e16.ts:498  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
  j .L4
.L2:
  ; sci/eval.e16.ts:499  if (t === T_DERIV || t === T_INTEG || t === T_SIGMA) {
  li t0, 160
  beq s1, t0, .L6
  li t0, 161
  beq s1, t0, .L6
  li t0, 162
  bne s1, t0, .L5
.L6:
  ; sci/eval.e16.ts:500  pos = calculus(t, pos, at)
  lw a1, 0x05a0(zero)
  mv a0, s1
  mv a2, s2
  la t0, calculus
  li t1, 8
  call far_call
  sw a0, 0x05a0(zero)
  j .L7
.L5:
  ; sci/eval.e16.ts:501  if (isFunction(t)) {
  mv a0, s1
  call isFunction
  beqz a0, .L8
  ; sci/eval.e16.ts:502  sum()
  call sum
  ; sci/eval.e16.ts:503  if (takesTwo(t)) {
  mv a0, s1
  call takesTwo
  beqz a0, .L9
  ; sci/eval.e16.ts:504  expect(T_COMMA)
  li a0, 44
  call expect
  ; sci/eval.e16.ts:505  sum()
  call sum
.L9:
  ; sci/eval.e16.ts:507  if (tok() === T_CLOSE) pos++
  call tok
  li t0, 41
  bne a0, t0, .L10
  ; sci/eval.e16.ts:507  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
.L10:
  ; sci/eval.e16.ts:508  if (takesTwo(t)) applyTwo(t, at)
  mv a0, s1
  call takesTwo
  beqz a0, .L11
  ; sci/eval.e16.ts:508  applyTwo(t, at)
  mv a0, s1
  mv a1, s2
  call applyTwo
  j .L13
.L11:
  ; sci/eval.e16.ts:509  apply(t, at)
  mv a0, s1
  mv a1, s2
  call apply
  j .L13
.L8:
  ; sci/eval.e16.ts:510  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s2
  call fail
.L13:
.L7:
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:514 randomWhole(t, at) at -O1
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
  ; sci/eval.e16.ts:515  const v = push(at)
  mv a0, s1
  call push
  mv s2, a0 ; v
  ; sci/eval.e16.ts:516  math(M_RND, v, 0, at)
  li a0, 31
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:517  const k = pushInt(t === T_DICE ? 6 : t === T_COIN ? 2 : 100, at)
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
  ; sci/eval.e16.ts:518  math(M_MUL, v, k, at)
  li a0, 3
  mv a1, s2
  mv a2, s3
  mv a3, s1
  call math
  ; sci/eval.e16.ts:519  pop()
  call pop
  ; sci/eval.e16.ts:520  const one = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  mv s3, a0 ; k/one
  ; sci/eval.e16.ts:521  math(M_IDIV, v, one, at)
  li a0, 8
  mv a1, s2
  mv a2, s3
  mv a3, s1
  call math
  ; sci/eval.e16.ts:522  if (t === T_DICE) math(M_ADD, v, one, at)
  li t0, 12
  bne s0, t0, .L5
  ; sci/eval.e16.ts:522  math(M_ADD, v, one, at)
  li a0, 1
  mv a1, s2
  mv a2, s3
  mv a3, s1
  call math
.L5:
  ; sci/eval.e16.ts:523  pop()
  call pop
  ; sci/eval.e16.ts:524  exactWhole(v)
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

; sci/eval.e16.ts:528 template(t, at) at -O1
;   t in s1
;   at in s2
template:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t
  mv s2, a1 ; at
  ; sci/eval.e16.ts:529  if (t === T_MIXED) {
  li t0, 28
  bne s1, t0, .L1
  ; sci/eval.e16.ts:530  mixed(at)
  mv a0, s2
  call mixed
  ; sci/eval.e16.ts:531  return true
  li a0, 1
  j .return
.L1:
  ; sci/eval.e16.ts:533  if (t === T_XROOT) {
  li t0, 30
  bne s1, t0, .L2
  ; sci/eval.e16.ts:534  sum()
  call sum
  ; sci/eval.e16.ts:535  expect(T_XSEP)
  li a0, 11
  call expect
  ; sci/eval.e16.ts:536  sum()
  call sum
  ; sci/eval.e16.ts:537  expect(T_END)
  li a0, 24
  call expect
  ; sci/eval.e16.ts:538  anyRoot(at)
  mv a0, s2
  call anyRoot
  ; sci/eval.e16.ts:539  return true
  li a0, 1
  j .return
.L2:
  ; sci/eval.e16.ts:541  if (t === T_FRAC) {
  li t0, 22
  bne s1, t0, .L3
  ; sci/eval.e16.ts:542  sum()
  call sum
  ; sci/eval.e16.ts:543  expect(T_SEP)
  li a0, 23
  call expect
  ; sci/eval.e16.ts:544  sum()
  call sum
  ; sci/eval.e16.ts:545  expect(T_END)
  li a0, 24
  call expect
  ; sci/eval.e16.ts:546  binary(M_DIV, at)
  li a0, 4
  mv a1, s2
  call binary
  j .L4
.L3:
  ; sci/eval.e16.ts:547  if (t === T_ROOT) {
  li t0, 25
  bne s1, t0, .L5
  ; sci/eval.e16.ts:548  sum()
  call sum
  ; sci/eval.e16.ts:549  expect(T_END)
  li a0, 24
  call expect
  ; sci/eval.e16.ts:550  math(M_SQR, top(), 0, at)
  call top
  mv a1, a0
  li a0, 21
  li a2, 0
  mv a3, s2
  call math
  ; sci/eval.e16.ts:551  exactSqrt(top())
  call top
  la t0, exactSqrt
  li t1, 2
  call far_call
  j .L6
.L5:
  ; sci/eval.e16.ts:552  return false
  li a0, 0
  j .return
.L6:
.L4:
  ; sci/eval.e16.ts:553  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:557 mixed(at) at -O1
;   at in s1
mixed:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; sci/eval.e16.ts:558  sum()
  call sum
  ; sci/eval.e16.ts:559  expect(T_MSEP)
  li a0, 29
  call expect
  ; sci/eval.e16.ts:560  sum()
  call sum
  ; sci/eval.e16.ts:561  expect(T_MDIV)
  li a0, 31
  call expect
  ; sci/eval.e16.ts:562  sum()
  call sum
  ; sci/eval.e16.ts:563  expect(T_END)
  li a0, 24
  call expect
  ; sci/eval.e16.ts:564  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:565  binary(isNegative(top() - VALUE_SIZE) ? M_SUB : M_ADD, at)
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

; sci/eval.e16.ts:572 anyRoot(at) at -O1
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
  ; sci/eval.e16.ts:573  const x = top()
  call top
  mv s2, a0 ; x
  ; sci/eval.e16.ts:574  const n = x - VALUE_SIZE
  addi s3, s2, -36
  ; sci/eval.e16.ts:575  const negative = isNegative(x)
  mv a0, s2
  call isNegative
  sw a0, 0(sp) ; negative
  ; sci/eval.e16.ts:576  if (negative) {
  lw t0, 0(sp) ; negative
  beqz t0, .L1
  ; sci/eval.e16.ts:577  if ((smallWhole(n, at) & 1) === 0) fail(E_MATH, at)
  mv a0, s3
  mv a1, s1
  call smallWhole
  andi t0, a0, 1
  bne t0, zero, .L2
  ; sci/eval.e16.ts:577  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L2:
  ; sci/eval.e16.ts:578  math(M_NEG, x, 0, at)
  li a0, 16
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
.L1:
  ; sci/eval.e16.ts:580  const two = pushInt(2, at)
  li a0, 2
  mv a1, s1
  call pushInt
  mv s0, a0 ; two/power
  ; sci/eval.e16.ts:581  math(M_CMP, n, two, at)
  li a0, 6
  mv a1, s3
  mv a2, s0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:582  pop()
  call pop
  ; sci/eval.e16.ts:583  if (peek16(MATH_RESULT) === 0) {
  li t0, 65370
  lw t0, 0(t0)
  bne t0, zero, .L3
  ; sci/eval.e16.ts:584  math(M_SQR, x, 0, at)
  li a0, 21
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:585  exactSqrt(x)
  mv a0, s2
  la t0, exactSqrt
  li t1, 2
  call far_call
  j .L4
.L3:
  ; sci/eval.e16.ts:587  const power = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  mv s0, a0 ; two/power
  ; sci/eval.e16.ts:588  copyValue(n, push(at))
  mv a0, s1
  call push
  mv a1, a0
  mv a0, s3
  call copyValue
  ; sci/eval.e16.ts:589  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:590  math(M_POW, x, power, at)
  li a0, 5
  mv a1, s2
  mv a2, s0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:591  pop()
  call pop
  ; sci/eval.e16.ts:592  exactWhole(x)
  mv a0, s2
  la t0, exactWhole
  li t1, 2
  call far_call
.L4:
  ; sci/eval.e16.ts:594  if (negative) {
  lw t0, 0(sp) ; negative
  beqz t0, .L5
  ; sci/eval.e16.ts:595  math(M_NEG, x, 0, at)
  li a0, 16
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:596  exactNeg(x)
  mv a0, s2
  la t0, exactNeg
  li t1, 2
  call far_call
.L5:
  ; sci/eval.e16.ts:598  copyValue(x, n)
  mv a0, s2
  mv a1, s3
  call copyValue
  ; sci/eval.e16.ts:599  pop()
  call pop
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s0, 10(sp)
  addi sp, sp, 12
  ret

; sci/eval.e16.ts:603 number() at -O1
;   at in s1
;   v in s2
number:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/eval.e16.ts:604  const at = pos
  lw s1, 0x05a0(zero)
  ; sci/eval.e16.ts:605  const v = push(at)
  mv a0, s1
  call push
  mv s2, a0 ; v
  ; sci/eval.e16.ts:606  pos = readNumber(lineAt, lineLength, pos, v)
  lw a0, 0x059c(zero)
  lw a1, 0x059e(zero)
  lw a2, 0x05a0(zero)
  mv a3, s2
  call readNumber
  sw a0, 0x05a0(zero)
  ; sci/eval.e16.ts:607  exactLiteral(v)
  mv a0, s2
  la t0, exactLiteral
  li t1, 2
  call far_call
  ; sci/eval.e16.ts:608  if (tok() === T_DEG) minutes(at)
  call tok
  li t0, 136
  bne a0, t0, .L1
  ; sci/eval.e16.ts:608  minutes(at)
  mv a0, s1
  call minutes
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:615 readToken(i) at -O1
;   i in a0
readToken:
  ; sci/eval.e16.ts:616  return i < readLength ? peek(readFrom + i) : 0
  lw t0, 0x05c6(zero)
  bgeu a0, t0, .L1
  lw t0, 0x05c4(zero)
  add t0, t0, a0
  lbu t0, 0(t0)
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
.return:
  ret

; sci/eval.e16.ts:625 readNumber(line/i, length/n, from, dst) at -O1
;   line/i in s1
;   length/n in s2
;   from in s3
;   dst in 0(sp)
;   points in s0
readNumber:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s0, 10(sp)
  mv s1, a0 ; line/i
  mv s2, a1 ; length/n
  mv s3, a2 ; from
  sw a3, 0(sp) ; dst
  ; sci/eval.e16.ts:626  readFrom = line
  sw s1, 0x05c4(zero)
  ; sci/eval.e16.ts:627  readLength = length
  sw s2, 0x05c6(zero)
  ; sci/eval.e16.ts:628  let i = from
  mv s1, s3 ; line/i
  ; sci/eval.e16.ts:629  let n: u16 = 0
  li s2, 0 ; length/n
  ; sci/eval.e16.ts:630  let points: u16 = 0
  li s0, 0 ; points
  ; sci/eval.e16.ts:631  while (isDigit(readToken(i)) || readToken(i) === T_POINT) {
  j .L3
.L1:
  ; sci/eval.e16.ts:632  if (readToken(i) === T_POINT) points++
  mv a0, s1
  call readToken
  li t0, 46
  bne a0, t0, .L5
  ; sci/eval.e16.ts:632  points++
  addi s0, s0, 1
.L5:
  ; sci/eval.e16.ts:634  if (n >= 30) fail(E_SYNTAX, from)
  li t0, 30
  bltu s2, t0, .L6
  ; sci/eval.e16.ts:634  fail(E_SYNTAX, from)
  li a0, 2
  mv a1, s3
  call fail
.L6:
  ; sci/eval.e16.ts:635  numberText[n] = readToken(i)
  mv a0, s1
  call readToken
  sb a0, numberText(s2)
  ; sci/eval.e16.ts:636  n++
  addi s2, s2, 1
  ; sci/eval.e16.ts:637  i++
  addi s1, s1, 1
.L3:
  mv a0, s1
  call readToken
  call isDigit
  bnez a0, .L1
  mv a0, s1
  call readToken
  li t0, 46
  beq a0, t0, .L1
  ; sci/eval.e16.ts:639  if (points > 1 || (points === 1 && i - from === 1)) fail(E_SYNTAX, from)
  li t0, 1
  bltu t0, s0, .L8
  li t0, 1
  bne s0, t0, .L7
  sub t0, s1, s3
  li t1, 1
  bne t0, t1, .L7
.L8:
  ; sci/eval.e16.ts:639  fail(E_SYNTAX, from)
  li a0, 2
  mv a1, s3
  call fail
.L7:
  ; sci/eval.e16.ts:640  if (readToken(i) === T_EXP) {
  mv a0, s1
  call readToken
  li t0, 135
  bne a0, t0, .L9
  ; sci/eval.e16.ts:641  i = exponentPart(i + 1, n)
  addi a0, s1, 1
  mv a1, s2
  call exponentPart
  mv s1, a0 ; line/i
  ; sci/eval.e16.ts:642  n = exponentEnd
  lw s2, 0x05c8(zero)
.L9:
  ; sci/eval.e16.ts:644  poke16(MATH_ARG, n)
  li t0, 65366
  sw s2, 0(t0)
  ; sci/eval.e16.ts:645  math(M_PARSE, dst, addr(numberText), from)
  li a0, 56
  lw a1, 0(sp)
  la a2, numberText
  mv a3, s3
  call math
  ; sci/eval.e16.ts:646  return i
  mv a0, s1
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s0, 10(sp)
  addi sp, sp, 12
  ret

; sci/eval.e16.ts:653 minutes(at) at -O1
;   at in s1
minutes:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; sci/eval.e16.ts:654  pos++
  lw t0, 0x05a0(zero)
  addi t0, t0, 1
  sw t0, 0x05a0(zero)
  ; sci/eval.e16.ts:655  if (startsNumber(tok())) sixtieth(T_MIN, 60, at)
  call tok
  call startsNumber
  beqz a0, .L1
  ; sci/eval.e16.ts:655  sixtieth(T_MIN, 60, at)
  li a0, 137
  li a1, 60
  mv a2, s1
  call sixtieth
.L1:
  ; sci/eval.e16.ts:656  if (startsNumber(tok())) sixtieth(T_SEC, 3600, at)
  call tok
  call startsNumber
  beqz a0, .L2
  ; sci/eval.e16.ts:656  sixtieth(T_SEC, 3600, at)
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

; sci/eval.e16.ts:660 sixtieth(mark, parts, at) at -O1
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
  ; sci/eval.e16.ts:661  number()
  call number
  ; sci/eval.e16.ts:662  expect(mark)
  mv a0, s2
  call expect
  ; sci/eval.e16.ts:663  pushInt(parts, at)
  mv a0, s3
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:664  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:665  binary(M_ADD, at)
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

; sci/eval.e16.ts:668 startsNumber(t) at -O1
;   t in s1
startsNumber:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/eval.e16.ts:669  return isDigit(t) || t === T_POINT
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

; sci/eval.e16.ts:676 exponentPart(i, n/k) at -O1
;   i in s3
;   n/k in s1
;   j in s2
exponentPart:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; i
  mv s1, a1 ; n/k
  ; sci/eval.e16.ts:677  let k = n
  ; sci/eval.e16.ts:678  let j = i
  mv s2, s3 ; j
  ; sci/eval.e16.ts:679  if (k === 0) {
  bne s1, zero, .L1
  ; sci/eval.e16.ts:680  numberText[0] = 0x31
  li t0, 49
  sb t0, numberText(zero)
  ; sci/eval.e16.ts:681  k = 1
  li s1, 1 ; n/k
.L1:
  ; sci/eval.e16.ts:683  numberText[k] = 0x45
  li t0, 69
  sb t0, numberText(s1)
  ; sci/eval.e16.ts:684  k++
  addi s1, s1, 1
  ; sci/eval.e16.ts:685  if (readToken(j) === T_NEG || readToken(j) === T_MINUS) {
  mv a0, s2
  call readToken
  li t0, 16
  beq a0, t0, .L3
  mv a0, s2
  call readToken
  li t0, 45
  bne a0, t0, .L2
.L3:
  ; sci/eval.e16.ts:686  numberText[k] = 0x2d
  li t0, 45
  sb t0, numberText(s1)
  ; sci/eval.e16.ts:687  k++
  addi s1, s1, 1
  ; sci/eval.e16.ts:688  j++
  addi s2, s2, 1
.L2:
  ; sci/eval.e16.ts:690  if (!isDigit(readToken(j))) fail(E_SYNTAX, j)
  mv a0, s2
  call readToken
  call isDigit
  bnez a0, .L7
  ; sci/eval.e16.ts:690  fail(E_SYNTAX, j)
  li a0, 2
  mv a1, s2
  call fail
  ; sci/eval.e16.ts:691  while (isDigit(readToken(j))) {
  j .L7
.L5:
  ; sci/eval.e16.ts:692  if (k >= 31) fail(E_SYNTAX, i)
  li t0, 31
  bltu s1, t0, .L9
  ; sci/eval.e16.ts:692  fail(E_SYNTAX, i)
  li a0, 2
  mv a1, s3
  call fail
.L9:
  ; sci/eval.e16.ts:693  numberText[k] = readToken(j)
  mv a0, s2
  call readToken
  sb a0, numberText(s1)
  ; sci/eval.e16.ts:694  k++
  addi s1, s1, 1
  ; sci/eval.e16.ts:695  j++
  addi s2, s2, 1
.L7:
  mv a0, s2
  call readToken
  call isDigit
  bnez a0, .L5
  ; sci/eval.e16.ts:697  exponentEnd = k
  sw s1, 0x05c8(zero)
  ; sci/eval.e16.ts:698  return j
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/eval.e16.ts:705 apply(f, at) at -O1
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
  ; sci/eval.e16.ts:706  const x = top()
  call top
  mv s1, a0 ; x
  ; sci/eval.e16.ts:707  copyValue(x, addr(argument))
  mv a0, s1
  la a1, argument
  call copyValue
  ; sci/eval.e16.ts:708  if (f === T_SIN) trig(M_SIN, TRIG_SIN, x, at)
  li t0, 1
  bne s2, t0, .L1
  ; sci/eval.e16.ts:708  trig(M_SIN, TRIG_SIN, x, at)
  li a0, 22
  li a1, 0
  mv a2, s1
  mv a3, s3
  call trig
  j .L2
.L1:
  ; sci/eval.e16.ts:709  if (f === T_COS) trig(M_COS, TRIG_COS, x, at)
  li t0, 2
  bne s2, t0, .L3
  ; sci/eval.e16.ts:709  trig(M_COS, TRIG_COS, x, at)
  li a0, 23
  li a1, 1
  mv a2, s1
  mv a3, s3
  call trig
  j .L4
.L3:
  ; sci/eval.e16.ts:710  if (f === T_TAN) trig(M_TAN, TRIG_TAN, x, at)
  li t0, 3
  bne s2, t0, .L5
  ; sci/eval.e16.ts:710  trig(M_TAN, TRIG_TAN, x, at)
  li a0, 24
  li a1, 2
  mv a2, s1
  mv a3, s3
  call trig
  j .L6
.L5:
  ; sci/eval.e16.ts:711  if (f === T_SQRT) {
  li t0, 9
  bne s2, t0, .L7
  ; sci/eval.e16.ts:712  math(M_SQR, x, 0, at)
  li a0, 21
  mv a1, s1
  li a2, 0
  mv a3, s3
  call math
  ; sci/eval.e16.ts:713  exactSqrt(x)
  mv a0, s1
  la t0, exactSqrt
  li t1, 2
  call far_call
  j .L8
.L7:
  ; sci/eval.e16.ts:715  other(f, x, at)
  mv a0, s2
  mv a1, s1
  mv a2, s3
  call other
  ; sci/eval.e16.ts:717  if (f !== T_ABS && f !== T_RND) exactWhole(x)
  li t0, 230
  beq s2, t0, .L9
  li t0, 234
  beq s2, t0, .L9
  ; sci/eval.e16.ts:717  exactWhole(x)
  mv a0, s1
  la t0, exactWhole
  li t1, 2
  call far_call
.L9:
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

; sci/eval.e16.ts:722 other(f, x, at) at -O1
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
  ; sci/eval.e16.ts:723  if (f >= T_SINH) {
  li t0, 224
  bltu s1, t0, .L1
  ; sci/eval.e16.ts:724  named(f, x, at)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call named
  ; sci/eval.e16.ts:725  return
  j .return
.L1:
  ; sci/eval.e16.ts:727  if (f === T_ASIN) math(M_ASN, x, 0, at)
  li t0, 4
  bne s1, t0, .L2
  ; sci/eval.e16.ts:727  math(M_ASN, x, 0, at)
  li a0, 25
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L3
.L2:
  ; sci/eval.e16.ts:728  if (f === T_ACOS) math(M_ACS, x, 0, at)
  li t0, 5
  bne s1, t0, .L4
  ; sci/eval.e16.ts:728  math(M_ACS, x, 0, at)
  li a0, 26
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L5
.L4:
  ; sci/eval.e16.ts:729  if (f === T_ATAN) math(M_ATN, x, 0, at)
  li t0, 6
  bne s1, t0, .L6
  ; sci/eval.e16.ts:729  math(M_ATN, x, 0, at)
  li a0, 27
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L7
.L6:
  ; sci/eval.e16.ts:730  if (f === T_LOG) math(M_LOG, x, 0, at)
  li t0, 7
  bne s1, t0, .L8
  ; sci/eval.e16.ts:730  math(M_LOG, x, 0, at)
  li a0, 29
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L9
.L8:
  ; sci/eval.e16.ts:731  if (f === T_LN) math(M_LN, x, 0, at)
  li t0, 8
  bne s1, t0, .L10
  ; sci/eval.e16.ts:731  math(M_LN, x, 0, at)
  li a0, 28
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L11
.L10:
  ; sci/eval.e16.ts:732  if (f === T_CBRT) cubeRoot(x, at)
  li t0, 10
  bne s1, t0, .L12
  ; sci/eval.e16.ts:732  cubeRoot(x, at)
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

; sci/eval.e16.ts:736 named(f, x, at) at -O1
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
  ; sci/eval.e16.ts:737  if (f === T_XEST || f === T_YEST || f === T_X2EST) {
  li t0, 250
  beq s1, t0, .L2
  li t0, 251
  beq s1, t0, .L2
  li t0, 253
  bne s1, t0, .L1
.L2:
  ; sci/eval.e16.ts:739  statEstimate(f === T_YEST ? EST_Y : f === T_XEST ? EST_X : EST_X2, x)
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
  ; sci/eval.e16.ts:740  return
  j .return
.L1:
  ; sci/eval.e16.ts:742  if (f === T_SINH) math(M_SINH, x, 0, at)
  li t0, 224
  bne s1, t0, .L7
  ; sci/eval.e16.ts:742  math(M_SINH, x, 0, at)
  li a0, 33
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L8
.L7:
  ; sci/eval.e16.ts:743  if (f === T_COSH) math(M_COSH, x, 0, at)
  li t0, 225
  bne s1, t0, .L9
  ; sci/eval.e16.ts:743  math(M_COSH, x, 0, at)
  li a0, 34
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L10
.L9:
  ; sci/eval.e16.ts:744  if (f === T_TANH) math(M_TANH, x, 0, at)
  li t0, 226
  bne s1, t0, .L11
  ; sci/eval.e16.ts:744  math(M_TANH, x, 0, at)
  li a0, 35
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L12
.L11:
  ; sci/eval.e16.ts:745  if (f === T_ASINH) math(M_ASNH, x, 0, at)
  li t0, 227
  bne s1, t0, .L13
  ; sci/eval.e16.ts:745  math(M_ASNH, x, 0, at)
  li a0, 36
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L14
.L13:
  ; sci/eval.e16.ts:746  if (f === T_ACOSH) math(M_ACSH, x, 0, at)
  li t0, 228
  bne s1, t0, .L15
  ; sci/eval.e16.ts:746  math(M_ACSH, x, 0, at)
  li a0, 37
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L16
.L15:
  ; sci/eval.e16.ts:747  if (f === T_ATANH) math(M_ATNH, x, 0, at)
  li t0, 229
  bne s1, t0, .L17
  ; sci/eval.e16.ts:747  math(M_ATNH, x, 0, at)
  li a0, 38
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L18
.L17:
  ; sci/eval.e16.ts:748  wholeOrRounded(f, x, at)
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

; sci/eval.e16.ts:752 wholeOrRounded(f/one, x, at) at -O1
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
  ; sci/eval.e16.ts:753  if (f === T_INT) {
  li t0, 233
  bne s2, t0, .L1
  ; sci/eval.e16.ts:754  const one = pushInt(1, at)
  li a0, 1
  mv a1, s3
  call pushInt
  mv s2, a0 ; f/one
  ; sci/eval.e16.ts:755  math(M_IDIV, x, one, at)
  li a0, 8
  mv a1, s1
  mv a2, s2
  mv a3, s3
  call math
  ; sci/eval.e16.ts:756  pop()
  call pop
  j .L2
.L1:
  ; sci/eval.e16.ts:757  if (f === T_RND) {
  li t0, 234
  bne s2, t0, .L3
  ; sci/eval.e16.ts:758  poke16(MATH_ARG, shownDigits())
  call shownDigits
  li t0, 65366
  sw a0, 0(t0)
  ; sci/eval.e16.ts:759  math(M_RNDTO, x, 0, at)
  li a0, 40
  mv a1, s1
  li a2, 0
  mv a3, s3
  call math
  ; sci/eval.e16.ts:760  exactLiteral(x)
  mv a0, s1
  la t0, exactLiteral
  li t1, 2
  call far_call
  j .L4
.L3:
  ; sci/eval.e16.ts:761  if (f === T_ABS && isNegative(x)) {
  li t0, 230
  bne s2, t0, .L5
  mv a0, s1
  call isNegative
  beqz a0, .L5
  ; sci/eval.e16.ts:762  math(M_NEG, x, 0, at)
  li a0, 16
  mv a1, s1
  li a2, 0
  mv a3, s3
  call math
  ; sci/eval.e16.ts:763  exactNeg(x)
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

; sci/eval.e16.ts:770 applyTwo(f, at) at -O1
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
  ; sci/eval.e16.ts:771  const b = top()
  call top
  mv s2, a0 ; b
  ; sci/eval.e16.ts:772  const a = b - VALUE_SIZE
  addi s3, s2, -36
  ; sci/eval.e16.ts:773  if (f === T_POL) polar(a, b, at)
  li t0, 235
  bne s0, t0, .L1
  ; sci/eval.e16.ts:773  polar(a, b, at)
  mv a0, s3
  mv a1, s2
  mv a2, s1
  call polar
  j .L2
.L1:
  ; sci/eval.e16.ts:774  if (f === T_REC) rectangular(a, b, at)
  li t0, 236
  bne s0, t0, .L3
  ; sci/eval.e16.ts:774  rectangular(a, b, at)
  mv a0, s3
  mv a1, s2
  mv a2, s1
  call rectangular
  j .L4
.L3:
  ; sci/eval.e16.ts:776  whole(a, at)
  mv a0, s3
  mv a1, s1
  call whole
  ; sci/eval.e16.ts:777  whole(b, at)
  mv a0, s2
  mv a1, s1
  call whole
  ; sci/eval.e16.ts:778  if (f === T_GCD) gcdInto(a, b, at)
  li t0, 231
  bne s0, t0, .L5
  ; sci/eval.e16.ts:778  gcdInto(a, b, at)
  mv a0, s3
  mv a1, s2
  mv a2, s1
  call gcdInto
  j .L6
.L5:
  ; sci/eval.e16.ts:779  lcm(a, b, at)
  mv a0, s3
  mv a1, s2
  mv a2, s1
  call lcm
.L6:
  ; sci/eval.e16.ts:780  exactWhole(a)
  mv a0, s3
  la t0, exactWhole
  li t1, 2
  call far_call
.L4:
.L2:
  ; sci/eval.e16.ts:782  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/eval.e16.ts:786 whole(v, at) at -O1
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
  ; sci/eval.e16.ts:787  const t = push(at)
  mv a0, s1
  call push
  mv s3, a0 ; t
  ; sci/eval.e16.ts:788  copyValue(v, t)
  mv a0, s2
  mv a1, s3
  call copyValue
  ; sci/eval.e16.ts:789  math(M_FRAC, t, 0, at)
  li a0, 19
  mv a1, s3
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:790  if (!isZero(t)) fail(E_MATH, at)
  mv a0, s3
  call isZero
  bnez a0, .L1
  ; sci/eval.e16.ts:790  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L1:
  ; sci/eval.e16.ts:791  pop()
  call pop
  ; sci/eval.e16.ts:792  if (isNegative(v)) math(M_NEG, v, 0, at)
  mv a0, s2
  call isNegative
  beqz a0, .L2
  ; sci/eval.e16.ts:792  math(M_NEG, v, 0, at)
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

; sci/eval.e16.ts:796 gcdInto(a, b, at) at -O1
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
  ; sci/eval.e16.ts:797  const t = push(at)
  mv a0, s0
  call push
  mv s2, a0 ; t
  ; sci/eval.e16.ts:798  while (!isZero(b)) {
  j .L3
.L1:
  ; sci/eval.e16.ts:799  copyValue(a, t)
  mv a0, s3
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:800  math(M_MOD, t, b, at)
  li a0, 9
  mv a1, s2
  mv a2, s1
  mv a3, s0
  call math
  ; sci/eval.e16.ts:801  copyValue(b, a)
  mv a0, s1
  mv a1, s3
  call copyValue
  ; sci/eval.e16.ts:802  copyValue(t, b)
  mv a0, s2
  mv a1, s1
  call copyValue
.L3:
  mv a0, s1
  call isZero
  beqz a0, .L1
  ; sci/eval.e16.ts:804  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/eval.e16.ts:808 lcm(a, b, at) at -O1
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
  ; sci/eval.e16.ts:809  const product = push(at)
  mv a0, s3
  call push
  mv s1, a0 ; product
  ; sci/eval.e16.ts:810  copyValue(a, product)
  mv a0, s2
  mv a1, s1
  call copyValue
  ; sci/eval.e16.ts:811  math(M_MUL, product, b, at)
  li a0, 3
  mv a1, s1
  mv a2, s0
  mv a3, s3
  call math
  ; sci/eval.e16.ts:812  if (isZero(product)) {
  mv a0, s1
  call isZero
  beqz a0, .L1
  ; sci/eval.e16.ts:813  copyValue(product, a)
  mv a0, s1
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:814  pop()
  call pop
  ; sci/eval.e16.ts:815  return
  j .return
.L1:
  ; sci/eval.e16.ts:817  gcdInto(a, b, at)
  mv a0, s2
  mv a1, s0
  mv a2, s3
  call gcdInto
  ; sci/eval.e16.ts:818  math(M_DIV, product, a, at)
  li a0, 4
  mv a1, s1
  mv a2, s2
  mv a3, s3
  call math
  ; sci/eval.e16.ts:819  copyValue(product, a)
  mv a0, s1
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:820  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s0, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/eval.e16.ts:824 polar(a, b, at) at -O1
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
  ; sci/eval.e16.ts:825  const r = push(at)
  mv a0, s1
  call push
  mv s3, a0 ; r
  ; sci/eval.e16.ts:826  copyValue(a, r)
  mv a0, s2
  mv a1, s3
  call copyValue
  ; sci/eval.e16.ts:827  math(M_MUL, r, a, at)
  li a0, 3
  mv a1, s3
  mv a2, s2
  mv a3, s1
  call math
  ; sci/eval.e16.ts:828  const y2 = push(at)
  mv a0, s1
  call push
  sw a0, 0(sp) ; y2
  ; sci/eval.e16.ts:829  copyValue(b, y2)
  mv a0, s0
  lw a1, 0(sp)
  call copyValue
  ; sci/eval.e16.ts:830  math(M_MUL, y2, b, at)
  li a0, 3
  lw a1, 0(sp)
  mv a2, s0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:831  math(M_ADD, r, y2, at)
  li a0, 1
  mv a1, s3
  lw a2, 0(sp)
  mv a3, s1
  call math
  ; sci/eval.e16.ts:832  pop()
  call pop
  ; sci/eval.e16.ts:833  math(M_SQR, r, 0, at)
  li a0, 21
  mv a1, s3
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:835  math(M_ATN2, b, a, at)
  li a0, 39
  mv a1, s0
  mv a2, s2
  mv a3, s1
  call math
  ; sci/eval.e16.ts:836  copyValue(r, a)
  mv a0, s3
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:837  pop()
  call pop
  ; sci/eval.e16.ts:838  pair(a, b)
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

; sci/eval.e16.ts:842 rectangular(a, b, at) at -O1
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
  ; sci/eval.e16.ts:843  const x = push(at)
  mv a0, s1
  call push
  mv s0, a0 ; x
  ; sci/eval.e16.ts:844  copyValue(b, x)
  mv a0, s3
  mv a1, s0
  call copyValue
  ; sci/eval.e16.ts:845  math(M_COS, x, 0, at)
  li a0, 23
  mv a1, s0
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:846  math(M_MUL, x, a, at)
  li a0, 3
  mv a1, s0
  mv a2, s2
  mv a3, s1
  call math
  ; sci/eval.e16.ts:847  math(M_SIN, b, 0, at)
  li a0, 22
  mv a1, s3
  li a2, 0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:848  math(M_MUL, b, a, at)
  li a0, 3
  mv a1, s3
  mv a2, s2
  mv a3, s1
  call math
  ; sci/eval.e16.ts:849  copyValue(x, a)
  mv a0, s0
  mv a1, s2
  call copyValue
  ; sci/eval.e16.ts:850  pop()
  call pop
  ; sci/eval.e16.ts:851  pair(a, b)
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

; sci/eval.e16.ts:855 pair(first, second) at -O1
;   first in s1
;   second in s2
pair:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; first
  mv s2, a1 ; second
  ; sci/eval.e16.ts:856  inexact(first)
  mv a0, s1
  call inexact
  ; sci/eval.e16.ts:857  inexact(second)
  mv a0, s2
  call inexact
  ; sci/eval.e16.ts:858  copyValue(first, varAt(0x58))
  mv a0, s1
  li a1, 3336
  call copyValue
  ; sci/eval.e16.ts:859  copyValue(second, varAt(0x59))
  mv a0, s2
  li a1, 3372
  call copyValue
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/eval.e16.ts:862 trig(op, which, x, at) at -O1
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
  ; sci/eval.e16.ts:863  math(op, x, 0, at)
  mv a0, s2
  mv a1, s1
  li a2, 0
  mv a3, s0
  call math
  ; sci/eval.e16.ts:864  exactTrig(which, x, addr(argument))
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

; sci/eval.e16.ts:868 cubeRoot(x, at) at -O1
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
  ; sci/eval.e16.ts:869  if (isZero(x)) return
  mv a0, s2
  call isZero
  beqz a0, .L1
  ; sci/eval.e16.ts:869  return
  j .return
.L1:
  ; sci/eval.e16.ts:870  const negative = isNegative(x)
  mv a0, s2
  call isNegative
  mv s3, a0 ; negative
  ; sci/eval.e16.ts:871  if (negative) math(M_NEG, x, 0, at)
  beqz s3, .L2
  ; sci/eval.e16.ts:871  math(M_NEG, x, 0, at)
  li a0, 16
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
.L2:
  ; sci/eval.e16.ts:872  const third = pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  mv s0, a0 ; third
  ; sci/eval.e16.ts:873  pushInt(3, at)
  li a0, 3
  mv a1, s1
  call pushInt
  ; sci/eval.e16.ts:874  binary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call binary
  ; sci/eval.e16.ts:875  math(M_POW, x, third, at)
  li a0, 5
  mv a1, s2
  mv a2, s0
  mv a3, s1
  call math
  ; sci/eval.e16.ts:876  pop()
  call pop
  ; sci/eval.e16.ts:877  if (negative) math(M_NEG, x, 0, at)
  beqz s3, .L3
  ; sci/eval.e16.ts:877  math(M_NEG, x, 0, at)
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

; sci/eval.e16.ts:886 shownDigits() at -O1
;   n in a0
;   format in a1
shownDigits:
  ; sci/eval.e16.ts:887  const n = peek(KEEP_DIGITS)
  lbu a0, 3078(zero)
  ; sci/eval.e16.ts:888  const format = peek(KEEP_FORMAT)
  lbu a1, 3077(zero)
  ; sci/eval.e16.ts:889  if (format === FORMAT_FIX) return u16(-i16(n))
  li t0, 1
  bne a1, t0, .L1
  ; sci/eval.e16.ts:889  return u16(-i16(n))
  neg a0, a0
  ret
.L1:
  ; sci/eval.e16.ts:890  if (format === FORMAT_EXP && n > 0) return n
  li t0, 2
  bne a1, t0, .L2
  bgeu zero, a0, .L2
  ; sci/eval.e16.ts:890  return n
  ret
.L2:
  ; sci/eval.e16.ts:891  return 10
  li a0, 10
.return:
  ret

; sci/eval.e16.ts:895 binary(op, at) at -O1
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
  ; sci/eval.e16.ts:896  const b = top()
  call top
  mv s2, a0 ; b
  ; sci/eval.e16.ts:897  pop()
  call pop
  ; sci/eval.e16.ts:898  const a = top()
  call top
  mv s3, a0 ; a
  ; sci/eval.e16.ts:899  math(op, a, b, at)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  mv a3, s0
  call math
  ; sci/eval.e16.ts:900  exactBinary(op, a, b)
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

; sci/eval.e16.ts:904 isWhole(n/whole, at) at -O1
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
  ; sci/eval.e16.ts:905  const t = push(at)
  mv a0, s3
  call push
  mv s2, a0 ; t
  ; sci/eval.e16.ts:906  copy8(n, t)
  mv a0, s1
  mv a1, s2
  call copy8
  ; sci/eval.e16.ts:907  math(M_FRAC, t, 0, at)
  li a0, 19
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  ; sci/eval.e16.ts:908  const whole = isZero(t)
  mv a0, s2
  call isZero
  mv s1, a0 ; n/whole
  ; sci/eval.e16.ts:909  pop()
  call pop
  ; sci/eval.e16.ts:910  return whole
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/eval.e16.ts:914 smallWhole(n/v, at) at -O1
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
  ; sci/eval.e16.ts:915  if (!isWhole(n, at) || isNegative(n)) fail(E_MATH, at)
  mv a0, s1
  mv a1, s2
  call isWhole
  beqz a0, .L2
  mv a0, s1
  call isNegative
  beqz a0, .L1
.L2:
  ; sci/eval.e16.ts:915  fail(E_MATH, at)
  li a0, 1
  mv a1, s2
  call fail
.L1:
  ; sci/eval.e16.ts:916  const t = push(at)
  mv a0, s2
  call push
  mv s3, a0 ; t
  ; sci/eval.e16.ts:917  copy8(n, t)
  mv a0, s1
  mv a1, s3
  call copy8
  ; sci/eval.e16.ts:918  math(M_TOINT, t, 0, at)
  li a0, 49
  mv a1, s3
  li a2, 0
  mv a3, s2
  call math
  ; sci/eval.e16.ts:919  pop()
  call pop
  ; sci/eval.e16.ts:920  const v = peek16(MATH_ARG)
  li t0, 65366
  lw s1, 0(t0)
  ; sci/eval.e16.ts:921  if (i16(v) < 0 || v > 999) fail(E_MATH, at)
  blt s1, zero, .L4
  li t0, 999
  bgeu t0, s1, .L3
.L4:
  ; sci/eval.e16.ts:921  fail(E_MATH, at)
  li a0, 1
  mv a1, s2
  call fail
.L3:
  ; sci/eval.e16.ts:922  return v
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

  .align 2

  .bank 1
  .org 0xc000
; sci/screens.e16.ts:117 powerOn() at -O1
;   contrastBack.kept in s1
powerOn:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/screens.e16.ts:118  keepReady()
  call keepReady
  ; sci/screens.e16.ts:119  modesReady()
  call modesReady
  ; sci/screens.e16.ts:120  v2Ready()
  call v2Ready
  ; sci/screens.e16.ts:121  contrastBack()
  ; sci/screens.e16.ts:132  const kept = peek(KEEP_CONTRAST)
  lbu s1, 3117(zero)
  ; sci/screens.e16.ts:133  if (kept !== 0) poke16(IO_CONTRAST, kept - 1)
  beq s1, zero, .I1_end
  ; sci/screens.e16.ts:133  poke16(IO_CONTRAST, kept - 1)
  addi t0, s1, -1
  li t1, 65320
  sw t0, 0(t1)
.I1_end:
  ; sci/screens.e16.ts:122  cls()
  call cls
  ; sci/screens.e16.ts:123  noCursor()
  call noCursor
  ; sci/screens.e16.ts:124  centre(2, str('ELEC-16 SCI'), 11)
  li a0, 2
  la a1, str_26
  li a2, 11
  call centre
  ; sci/screens.e16.ts:125  centre(4, str('SCI-128'), 7)
  li a0, 4
  la a1, str_27
  li a2, 7
  call centre
  ; sci/screens.e16.ts:126  marks(0)
  li a0, 0
  call marks
  ; sci/screens.e16.ts:127  pause(700)
  ; sci/screens.e16.ts:173  poke16(IO_TCMP, peek16(IO_TCOUNT) + ms)
  li t0, 65328
  lw t0, 0(t0)
  addi t0, t0, 700
  li t1, 65330
  sw t0, 0(t1)
  ; sci/screens.e16.ts:174  poke16(IO_TCTRL, 1)
  li t0, 1
  li t1, 65332
  sw t0, 0(t1)
  ; sci/screens.e16.ts:175  csrw(CSR_MIE, 3)
  li t0, 3
  csrw 772, t0
  ; sci/screens.e16.ts:176  wfi()
  wfi
  ; sci/screens.e16.ts:177  poke16(IO_TCTRL, 0)
  li t0, 65332
  sw zero, 0(t0)
  ; sci/screens.e16.ts:178  csrw(CSR_MIE, 0)
  csrw 772, zero
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:137 v2Ready() at -O1
;   i in a0
v2Ready:
  ; sci/screens.e16.ts:138  if (peek16(V2) === V2_MARK) return
  li t0, 10240
  lw t0, 0(t0)
  li t1, 23624
  bne t0, t1, .L1
  ; sci/screens.e16.ts:138  return
  ret
.L1:
  ; sci/screens.e16.ts:139  for (let i: u16 = 0; i < V2_END - V2; i += 2) poke16(V2 + i, 0)
  li a0, 0 ; i
  j .L4
.L2:
  ; sci/screens.e16.ts:139  poke16(V2 + i, 0)
  li t0, 10240
  add t0, t0, a0
  sw zero, 0(t0)
  addi a0, a0, 2
.L4:
  li t0, 2048
  bltu a0, t0, .L2
  ; sci/screens.e16.ts:140  poke16(V2, V2_MARK)
  li t0, 23624
  li t1, 10240
  sw t0, 0(t1)
.return:
  ret

; sci/screens.e16.ts:144 modesReady() at -O1
;   i in a0
modesReady:
  ; sci/screens.e16.ts:145  if (peek16(MODES) === MODES_MARK) return
  lw t0, 5632(zero)
  li t1, 23606
  bne t0, t1, .L1
  ; sci/screens.e16.ts:145  return
  ret
.L1:
  ; sci/screens.e16.ts:146  for (let i: u16 = 0; i < MODES_END - MODES; i += 2) poke16(MODES + i, 0)
  li a0, 0 ; i
  j .L4
.L2:
  ; sci/screens.e16.ts:146  poke16(MODES + i, 0)
  sw zero, 5632(a0)
  addi a0, a0, 2
.L4:
  li t0, 2816
  bltu a0, t0, .L2
  ; sci/screens.e16.ts:147  poke16(MODES, MODES_MARK)
  li t0, 23606
  sw t0, 5632(zero)
  ; sci/screens.e16.ts:148  poke(BASE_RADIX, 1)
  li t0, 1
  sb t0, 5639(zero)
.return:
  ret

; sci/screens.e16.ts:155 keepReady() at -O1
;   i in s1
keepReady:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/screens.e16.ts:156  if (peek16(KEEP) === KEEP_MARK) return
  lw t0, 3072(zero)
  li t1, 23588
  bne t0, t1, .L1
  ; sci/screens.e16.ts:156  return
  j .return
.L1:
  ; sci/screens.e16.ts:157  for (let i: u16 = 0; i < 0x182; i += 2) poke16(KEEP + i, 0)
  li s1, 0 ; i
  j .L4
.L2:
  ; sci/screens.e16.ts:157  poke16(KEEP + i, 0)
  sw zero, 3072(s1)
  addi s1, s1, 2
.L4:
  li t0, 386
  bltu s1, t0, .L2
  ; sci/screens.e16.ts:158  poke16(KEEP, KEEP_MARK)
  li t0, 23588
  sw t0, 3072(zero)
  ; sci/screens.e16.ts:159  zeroValues()
  call zeroValues
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:163 zeroValues() at -O1
;   i/k in s1
zeroValues:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/screens.e16.ts:165  for (let i: u16 = 0; i < VALUE_SIZE; i++) poke(KEEP_ANS + i, 0)
  li s1, 0 ; i/k
  j .L3
.L1:
  ; sci/screens.e16.ts:165  poke(KEEP_ANS + i, 0)
  sb zero, 3080(s1)
  addi s1, s1, 1
.L3:
  li t0, 36
  bltu s1, t0, .L1
  ; sci/screens.e16.ts:166  for (let i: u16 = 0; i < 9 * VALUE_SIZE; i++) poke(KEEP_VARS + i, 0)
  li s1, 0 ; i/k
  j .L7
.L5:
  ; sci/screens.e16.ts:166  poke(KEEP_VARS + i, 0)
  sb zero, 3120(s1)
  addi s1, s1, 1
.L7:
  li t0, 324
  bltu s1, t0, .L5
  ; sci/screens.e16.ts:167  exactWhole(KEEP_ANS)
  li a0, 3080
  la t0, exactWhole
  li t1, 2
  call far_call
  ; sci/screens.e16.ts:168  for (let k: u16 = 0; k < 9; k++) exactWhole(KEEP_VARS + k * VALUE_SIZE)
  li s1, 0 ; i/k
  j .L11
.L9:
  ; sci/screens.e16.ts:168  exactWhole(KEEP_VARS + k * VALUE_SIZE)
  slli t1, s1, 5
  slli t0, s1, 2
  add t0, t0, t1
  addi a0, t0, 3120
  la t0, exactWhole
  li t1, 2
  call far_call
  addi s1, s1, 1
.L11:
  li t0, 9
  bltu s1, t0, .L9
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:184 errorScreen(code) at -O1
;   code in s1
errorScreen:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; code
  ; sci/screens.e16.ts:185  if (code === E_MATH) {
  li t0, 1
  bne s1, t0, .L1
  ; sci/screens.e16.ts:186  band(str('ERR:MATH'))
  la a0, str_28
  call band
  ; sci/screens.e16.ts:187  textAt(str("OUT OF A FUNCTION'S"), 1, lineY(0))
  la a0, str_29
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:188  textAt(str('RANGE, OR /0'), 1, lineY(1))
  la a0, str_30
  li a1, 1
  li a2, 20
  call textAt
  j .L2
.L1:
  ; sci/screens.e16.ts:189  if (code === E_FIND) {
  li t0, 4
  bne s1, t0, .L3
  ; sci/screens.e16.ts:190  band(str('ERR:FIND'))
  la a0, str_31
  call band
  ; sci/screens.e16.ts:191  textAt(str('NO X WAS FOUND FROM'), 1, lineY(0))
  la a0, str_32
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:192  textAt(str('THE X IT STARTED AT'), 1, lineY(1))
  la a0, str_33
  li a1, 1
  li a2, 20
  call textAt
  j .L4
.L3:
  ; sci/screens.e16.ts:193  if (code === E_RANGE) {
  li t0, 5
  bne s1, t0, .L5
  ; sci/screens.e16.ts:194  band(str('ERR:RANGE'))
  la a0, str_34
  call band
  ; sci/screens.e16.ts:195  textAt(str('1-30 ROWS FROM START'), 1, lineY(0))
  la a0, str_35
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:196  textAt(str('TO END BY STEP'), 1, lineY(1))
  la a0, str_36
  li a1, 1
  li a2, 20
  call textAt
  j .L6
.L5:
  ; sci/screens.e16.ts:197  if (code === E_DIM) {
  li t0, 6
  bne s1, t0, .L7
  ; sci/screens.e16.ts:198  band(str('ERR:DIM'))
  la a0, str_37
  call band
  ; sci/screens.e16.ts:199  textAt(str('THE SIZES OF THE'), 1, lineY(0))
  la a0, str_38
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:200  textAt(str('MATRICES DO NOT FIT'), 1, lineY(1))
  la a0, str_39
  li a1, 1
  li a2, 20
  call textAt
  j .L8
.L7:
  ; sci/screens.e16.ts:201  if (code === E_STACK) {
  li t0, 3
  bne s1, t0, .L9
  ; sci/screens.e16.ts:202  band(str('ERR:STACK'))
  la a0, str_40
  call band
  ; sci/screens.e16.ts:203  textAt(str('TOO MANY BRACKETS OR'), 1, lineY(0))
  la a0, str_41
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:204  textAt(str('FUNCTIONS IN A LINE'), 1, lineY(1))
  la a0, str_42
  li a1, 1
  li a2, 20
  call textAt
  j .L10
.L9:
  ; sci/screens.e16.ts:206  band(str('ERR:SYNTAX'))
  la a0, str_43
  call band
  ; sci/screens.e16.ts:207  textAt(str('CANNOT READ THE LINE'), 1, lineY(0))
  la a0, str_44
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:208  textAt(str('AT THE CURSOR'), 1, lineY(1))
  la a0, str_45
  li a1, 1
  li a2, 20
  call textAt
.L10:
.L8:
.L6:
.L4:
.L2:
  ; sci/screens.e16.ts:210  textAt(str('\x8c\x8b:BACK TO THE LINE'), 1, lineY(4))
  la a0, str_46
  li a1, 1
  li a2, 47
  call textAt
  ; sci/screens.e16.ts:211  textAt(str('AC:CLEAR'), 1, lineY(5))
  la a0, str_47
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:217 menuScreen(mode) at -O1
;   mode in s1
;   n in s2
menuScreen:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; mode
  ; sci/screens.e16.ts:218  cls()
  call cls
  ; sci/screens.e16.ts:219  band(str('MENU'))
  la a0, str_48
  call band
  ; sci/screens.e16.ts:220  textAt(str('1:CALC    2:STATS'), 1, lineY(0))
  la a0, str_49
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:221  textAt(str('3:BASE    4:TABLE'), 1, lineY(1))
  la a0, str_50
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:222  textAt(str('5:EQUATION 6:CPLX'), 1, lineY(2))
  la a0, str_51
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:223  textAt(str('7:MATRIX  8:PROG'), 1, lineY(3))
  la a0, str_52
  li a1, 1
  li a2, 38
  call textAt
  ; sci/screens.e16.ts:224  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_53
  li a1, 1
  li a2, 56
  call textAt
  ; sci/screens.e16.ts:226  const n = mode >> 1
  srli s2, s1, 1
  ; sci/screens.e16.ts:227  if (mode === 4) mark(0, 10, n)
  li t0, 4
  bne s1, t0, .L1
  ; sci/screens.e16.ts:227  mark(0, 10, n)
  li a0, 0
  li a1, 10
  mv a2, s2
  call mark
  j .L2
.L1:
  ; sci/screens.e16.ts:228  if (mode === 6) mark(0, 8, n)
  li t0, 6
  bne s1, t0, .L3
  ; sci/screens.e16.ts:228  mark(0, 8, n)
  li a0, 0
  li a1, 8
  mv a2, s2
  call mark
  j .L4
.L3:
  ; sci/screens.e16.ts:229  if (mode === 5) mark(11, 6, n)
  li t0, 5
  bne s1, t0, .L5
  ; sci/screens.e16.ts:229  mark(11, 6, n)
  li a0, 11
  li a1, 6
  mv a2, s2
  call mark
  j .L6
.L5:
  ; sci/screens.e16.ts:230  if ((mode & 1) === 0) mark(0, 6, n)
  andi t0, s1, 1
  bne t0, zero, .L7
  ; sci/screens.e16.ts:230  mark(0, 6, n)
  li a0, 0
  li a1, 6
  mv a2, s2
  call mark
  j .L8
.L7:
  ; sci/screens.e16.ts:231  mark(10, mode === 7 ? 6 : 7, n)
  li t0, 10
  mv t1, s1
  li t2, 7
  bne t1, t2, .L9
  li t1, 6
  j .L10
.L9:
  li t1, 7
.L10:
  mv a0, t0
  mv a1, t1
  mv a2, s2
  call mark
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

; sci/screens.e16.ts:235 menuKey(k/d) at -O1
;   k/d in s1
menuKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/d
  ; sci/screens.e16.ts:236  if (k === K_AC) return 0xff
  li t0, 5
  bne s1, t0, .L1
  ; sci/screens.e16.ts:236  return 0xff
  li a0, 255
  j .return
.L1:
  ; sci/screens.e16.ts:237  const d = digitOf(k)
  mv a0, s1
  la t0, digitOf
  li t1, 4
  call far_call
  mv s1, a0 ; k/d
  ; sci/screens.e16.ts:238  if (d >= 1 && d <= 8) return d
  li t0, 1
  bltu s1, t0, .L2
  li t0, 8
  bltu t0, s1, .L2
  ; sci/screens.e16.ts:238  return d
  mv a0, s1
  j .return
.L2:
  ; sci/screens.e16.ts:239  refuse()
  call refuse
  ; sci/screens.e16.ts:240  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:250 setupScreen() at -O1
setupScreen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/screens.e16.ts:251  page = 0
  sw zero, 0x0618(zero)
  ; sci/screens.e16.ts:252  asking = 0
  sw zero, 0x061a(zero)
  ; sci/screens.e16.ts:253  drawSetup()
  call drawSetup
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/screens.e16.ts:262 drawSetup() at -O1
drawSetup:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/screens.e16.ts:263  cls()
  call cls
  ; sci/screens.e16.ts:264  bandWith(str('SETUP'), page === 0 ? str('1/2') : str('2/2'))
  lw t1, 0x0618(zero)
  la t0, str_54
  li t2, 0
  bne t1, t2, .L1
  la t1, str_55
  j .L2
.L1:
  la t1, str_56
.L2:
  mv a0, t0
  mv a1, t1
  call bandWith
  ; sci/screens.e16.ts:265  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_53
  li a1, 1
  li a2, 56
  call textAt
  ; sci/screens.e16.ts:266  if (page === 1) {
  lw t0, 0x0618(zero)
  li t1, 1
  bne t0, t1, .L3
  ; sci/screens.e16.ts:267  textAt(str('1:a/b  2:a b/c'), 1, lineY(0))
  la a0, str_57
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:268  if (peek(KEEP_MIXED) === 1) mark(7, 7, 0)
  lbu t0, 3079(zero)
  li t1, 1
  bne t0, t1, .L4
  ; sci/screens.e16.ts:268  mark(7, 7, 0)
  li a0, 7
  li a1, 7
  li a2, 0
  call mark
  j .L5
.L4:
  ; sci/screens.e16.ts:269  mark(0, 5, 0)
  li a0, 0
  li a1, 5
  li a2, 0
  call mark
.L5:
  ; sci/screens.e16.ts:270  textAt(str('CONTRAST'), 1, lineY(2))
  la a0, str_58
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:271  contrastBar()
  call contrastBar
  ; sci/screens.e16.ts:272  textAt(clearing ? str('=:CLEAR ALL?') : str('3:CLEAR MEMORY'), 1, lineY(3))
  lw t0, 0x061e(zero)
  beqz t0, .L6
  la t0, str_59
  j .L7
.L6:
  la t0, str_60
.L7:
  mv a0, t0
  li a1, 1
  li a2, 38
  call textAt
  ; sci/screens.e16.ts:273  textAt(str('\x8c\x8b:CONTRAST'), 1, lineY(4))
  la a0, str_61
  li a1, 1
  li a2, 47
  call textAt
  ; sci/screens.e16.ts:274  return
  j .return
.L3:
  ; sci/screens.e16.ts:276  textAt(str('1:2D  2:LINE'), 1, lineY(0))
  la a0, str_62
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:277  textAt(str('3:DEG 4:RAD 5:GRAD'), 1, lineY(1))
  la a0, str_63
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:278  textAt(str('6:EXACT 7:DECIMAL'), 1, lineY(2))
  la a0, str_64
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:279  textAt(str('8:FIX 9:EXP 0:AUTO'), 1, lineY(3))
  la a0, str_65
  li a1, 1
  li a2, 38
  call textAt
  ; sci/screens.e16.ts:280  marksOfPage1()
  call marksOfPage1
  ; sci/screens.e16.ts:281  drawDigits()
  call drawDigits
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/screens.e16.ts:284 marksOfPage1() at -O1
;   angle/shape in s1
marksOfPage1:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/screens.e16.ts:285  if (peek(KEEP_DISPLAY) === 1) mark(6, 6, 0)
  lbu t0, 3075(zero)
  li t1, 1
  bne t0, t1, .L1
  ; sci/screens.e16.ts:285  mark(6, 6, 0)
  li a0, 6
  li a1, 6
  li a2, 0
  call mark
  j .L2
.L1:
  ; sci/screens.e16.ts:286  mark(0, 4, 0)
  li a0, 0
  li a1, 4
  li a2, 0
  call mark
.L2:
  ; sci/screens.e16.ts:287  const angle = peek(KEEP_ANGLE)
  lbu s1, 3074(zero)
  ; sci/screens.e16.ts:288  if (angle === 1) mark(6, 5, 1)
  li t0, 1
  bne s1, t0, .L3
  ; sci/screens.e16.ts:288  mark(6, 5, 1)
  li a0, 6
  li a1, 5
  li a2, 1
  call mark
  j .L4
.L3:
  ; sci/screens.e16.ts:289  if (angle === 2) mark(12, 6, 1)
  li t0, 2
  bne s1, t0, .L5
  ; sci/screens.e16.ts:289  mark(12, 6, 1)
  li a0, 12
  li a1, 6
  li a2, 1
  call mark
  j .L6
.L5:
  ; sci/screens.e16.ts:290  mark(0, 5, 1)
  li a0, 0
  li a1, 5
  li a2, 1
  call mark
.L6:
.L4:
  ; sci/screens.e16.ts:291  if (peek(KEEP_ANSWER) === 1) mark(8, 9, 2)
  lbu t0, 3076(zero)
  li t1, 1
  bne t0, t1, .L7
  ; sci/screens.e16.ts:291  mark(8, 9, 2)
  li a0, 8
  li a1, 9
  li a2, 2
  call mark
  j .L8
.L7:
  ; sci/screens.e16.ts:292  mark(0, 7, 2)
  li a0, 0
  li a1, 7
  li a2, 2
  call mark
.L8:
  ; sci/screens.e16.ts:293  const shape = peek(KEEP_FORMAT)
  lbu s1, 3077(zero)
  ; sci/screens.e16.ts:294  if (shape === FORMAT_FIX) mark(0, 5, 3)
  li t0, 1
  bne s1, t0, .L9
  ; sci/screens.e16.ts:294  mark(0, 5, 3)
  li a0, 0
  li a1, 5
  li a2, 3
  call mark
  j .L10
.L9:
  ; sci/screens.e16.ts:295  if (shape === FORMAT_EXP) mark(6, 5, 3)
  li t0, 2
  bne s1, t0, .L11
  ; sci/screens.e16.ts:295  mark(6, 5, 3)
  li a0, 6
  li a1, 5
  li a2, 3
  call mark
  j .L12
.L11:
  ; sci/screens.e16.ts:296  mark(12, 6, 3)
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

; sci/screens.e16.ts:300 contrastBar() at -O1
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
  ; sci/screens.e16.ts:301  const now = peek16(IO_CONTRAST)
  li t0, 65320
  lw t0, 0(t0)
  sw t0, 0(sp) ; now
  ; sci/screens.e16.ts:302  const y = lineY(2)
  li s3, 29 ; y
  ; sci/screens.e16.ts:303  for (let k: u16 = 0; k < 16; k++) {
  li s1, 0 ; k
  j .L3
.L1:
  ; sci/screens.e16.ts:304  const x = 56 + k * 4
  slli t0, s1, 2
  addi s0, t0, 56
  ; sci/screens.e16.ts:305  for (let row: u16 = k <= now ? 0 : 6; row < 7; row++) {
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
  ; sci/screens.e16.ts:306  dot(x, y + row)
  add a1, s3, s2
  mv a0, s0
  call dot
  ; sci/screens.e16.ts:307  dot(x + 1, y + row)
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

; sci/screens.e16.ts:313 contrastStep(up/next) at -O1
;   up/next in s1
;   now in s2
contrastStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; up/next
  ; sci/screens.e16.ts:314  const now = peek16(IO_CONTRAST)
  li t0, 65320
  lw s2, 0(t0)
  ; sci/screens.e16.ts:315  if (up ? now >= 15 : now === 0) {
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
  ; sci/screens.e16.ts:316  refuse()
  call refuse
  ; sci/screens.e16.ts:317  return
  j .return
.L1:
  ; sci/screens.e16.ts:319  const next = up ? now + 1 : now - 1
  beqz s1, .L4
  addi t0, s2, 1
  j .L5
.L4:
  addi t0, s2, -1
.L5:
  mv s1, t0 ; up/next
  ; sci/screens.e16.ts:320  poke16(IO_CONTRAST, next)
  li t0, 65320
  sw s1, 0(t0)
  ; sci/screens.e16.ts:321  poke(KEEP_CONTRAST, next + 1)
  addi t0, s1, 1
  sb t0, 3117(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/screens.e16.ts:325 drawDigits() at -O1
;   shape in s1
drawDigits:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/screens.e16.ts:326  const shape = asking !== 0 ? asking : peek(KEEP_FORMAT)
  lw t0, 0x061a(zero)
  beq t0, zero, .L1
  lw t0, 0x061a(zero)
  j .L2
.L1:
  lbu t0, 3077(zero)
.L2:
  mv s1, t0 ; shape
  ; sci/screens.e16.ts:327  if (shape === FORMAT_AUTO) return
  bne s1, zero, .L3
  ; sci/screens.e16.ts:327  return
  j .return
.L3:
  ; sci/screens.e16.ts:328  if (shape === FORMAT_AUTO2) {
  li t0, 3
  bne s1, t0, .L4
  ; sci/screens.e16.ts:329  textAt(str('AUTO2'), 1, lineY(4))
  la a0, str_66
  li a1, 1
  li a2, 47
  call textAt
  ; sci/screens.e16.ts:330  return
  j .return
.L4:
  ; sci/screens.e16.ts:332  textAt(shape === FORMAT_FIX ? str('FIX') : str('EXP'), 1, lineY(4))
  li t0, 1
  bne s1, t0, .L5
  la t0, str_67
  j .L6
.L5:
  la t0, str_68
.L6:
  mv a0, t0
  li a1, 1
  li a2, 47
  call textAt
  ; sci/screens.e16.ts:333  if (asking !== 0) textAt(str('0-9?'), 25, lineY(4))
  lw t0, 0x061a(zero)
  beq t0, zero, .L7
  ; sci/screens.e16.ts:333  textAt(str('0-9?'), 25, lineY(4))
  la a0, str_69
  li a1, 25
  li a2, 47
  call textAt
  j .L8
.L7:
  ; sci/screens.e16.ts:335  digitText[0] = 0x30 + peek(KEEP_DIGITS)
  lbu t0, 3078(zero)
  addi t0, t0, 48
  sb t0, digitText(zero)
  ; sci/screens.e16.ts:336  digitText[1] = 0
  sb zero, digitText+1(zero)
  ; sci/screens.e16.ts:337  textAt(addr(digitText), 25, lineY(4))
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

; sci/screens.e16.ts:344 setupKey(k/d) at -O1
;   k/d in s1
setupKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/d
  ; sci/screens.e16.ts:345  if (clearing) {
  lw t0, 0x061e(zero)
  beqz t0, .L1
  ; sci/screens.e16.ts:347  clearing = false
  sw zero, 0x061e(zero)
  ; sci/screens.e16.ts:348  if (k === K_EQ) clearMemory()
  li t0, 4
  bne s1, t0, .L2
  ; sci/screens.e16.ts:348  clearMemory()
  call clearMemory
.L2:
  ; sci/screens.e16.ts:349  drawSetup()
  call drawSetup
  ; sci/screens.e16.ts:350  return 0
  li a0, 0
  j .return
.L1:
  ; sci/screens.e16.ts:352  if (k === K_AC) return 1
  li t0, 5
  bne s1, t0, .L3
  ; sci/screens.e16.ts:352  return 1
  li a0, 1
  j .return
.L3:
  ; sci/screens.e16.ts:353  if (asking !== 0) {
  lw t0, 0x061a(zero)
  beq t0, zero, .L4
  ; sci/screens.e16.ts:354  const d = digitOf(k)
  mv a0, s1
  la t0, digitOf
  li t1, 4
  call far_call
  mv s1, a0 ; k/d
  ; sci/screens.e16.ts:355  if (d === 0xffff) {
  li t0, 65535
  bne s1, t0, .L5
  ; sci/screens.e16.ts:356  refuse()
  call refuse
  ; sci/screens.e16.ts:357  return 0
  li a0, 0
  j .return
.L5:
  ; sci/screens.e16.ts:359  poke(KEEP_FORMAT, asking)
  lw t0, 0x061a(zero)
  sb t0, 3077(zero)
  ; sci/screens.e16.ts:360  poke(KEEP_DIGITS, d)
  sb s1, 3078(zero)
  ; sci/screens.e16.ts:361  asking = 0
  sw zero, 0x061a(zero)
  j .L6
.L4:
  ; sci/screens.e16.ts:362  if (k === K_DOWN || k === K_UP) page = k === K_DOWN ? 1 : 0
  li t0, 1
  beq s1, t0, .L8
  bne s1, zero, .L7
.L8:
  ; sci/screens.e16.ts:362  page = k === K_DOWN ? 1 : 0
  li t0, 1
  bne s1, t0, .L9
  li t0, 1
  j .L10
.L9:
  li t0, 0
.L10:
  sw t0, 0x0618(zero)
  j .L11
.L7:
  ; sci/screens.e16.ts:363  if (page === 1 && (k === K_LEFT || k === K_RIGHT)) contrastStep(k === K_RIGHT)
  lw t0, 0x0618(zero)
  li t1, 1
  bne t0, t1, .L12
  li t0, 2
  beq s1, t0, .L13
  li t0, 3
  bne s1, t0, .L12
.L13:
  ; sci/screens.e16.ts:363  contrastStep(k === K_RIGHT)
  li t0, 3
  sub t0, s1, t0
  seqz a0, t0
  call contrastStep
  j .L14
.L12:
  ; sci/screens.e16.ts:364  if (!setupChoice(k)) {
  mv a0, s1
  call setupChoice
  bnez a0, .L15
  ; sci/screens.e16.ts:365  refuse()
  call refuse
  ; sci/screens.e16.ts:366  return 0
  li a0, 0
  j .return
.L15:
.L14:
.L11:
.L6:
  ; sci/screens.e16.ts:368  drawSetup()
  call drawSetup
  ; sci/screens.e16.ts:369  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:373 setupChoice(k) at -O1
;   k in s1
setupChoice:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/screens.e16.ts:374  if (page === 1) return mixedChoice(k)
  lw t0, 0x0618(zero)
  li t1, 1
  bne t0, t1, .L1
  ; sci/screens.e16.ts:374  return mixedChoice(k)
  mv a0, s1
  call mixedChoice
  j .return
.L1:
  ; sci/screens.e16.ts:375  switch (k) {
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
  ; sci/screens.e16.ts:378  poke(KEEP_DISPLAY, k === K_1 ? 0 : 1)
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
  ; sci/screens.e16.ts:379  return true
  li a0, 1
  j .return
.L5:
.L6:
.L7:
  ; sci/screens.e16.ts:383  poke(KEEP_ANGLE, k === K_3 ? 0 : k === K_4 ? 1 : 2)
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
  ; sci/screens.e16.ts:384  return true
  li a0, 1
  j .return
.L8:
.L9:
  ; sci/screens.e16.ts:387  poke(KEEP_ANSWER, k === K_6 ? 0 : 1)
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
  ; sci/screens.e16.ts:388  return true
  li a0, 1
  j .return
.L10:
.L11:
  ; sci/screens.e16.ts:391  asking = k === K_8 ? FORMAT_FIX : FORMAT_EXP
  li t0, 41
  bne s1, t0, .L21
  li t0, 1
  j .L22
.L21:
  li t0, 2
.L22:
  sw t0, 0x061a(zero)
  ; sci/screens.e16.ts:392  return true
  li a0, 1
  j .return
.L12:
  ; sci/screens.e16.ts:394  poke(KEEP_FORMAT, peek(KEEP_FORMAT) === FORMAT_AUTO ? FORMAT_AUTO2 : FORMAT_AUTO)
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
  ; sci/screens.e16.ts:395  return true
  li a0, 1
  j .return
.L2:
  ; sci/screens.e16.ts:397  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:401 mixedChoice(k) at -O1
;   k in a0
mixedChoice:
  ; sci/screens.e16.ts:402  if (k === K_3) {
  li t0, 58
  bne a0, t0, .L1
  ; sci/screens.e16.ts:403  clearing = true
  li t0, 1
  sw t0, 0x061e(zero)
  ; sci/screens.e16.ts:404  return true
  li a0, 1
  ret
.L1:
  ; sci/screens.e16.ts:406  if (k !== K_1 && k !== K_2) return false
  li t0, 56
  beq a0, t0, .L2
  li t0, 57
  beq a0, t0, .L2
  ; sci/screens.e16.ts:406  return false
  li a0, 0
  ret
.L2:
  ; sci/screens.e16.ts:407  poke(KEEP_MIXED, k === K_1 ? 0 : 1)
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
  ; sci/screens.e16.ts:408  return true
  li a0, 1
.return:
  ret

; sci/screens.e16.ts:415 clearMemory() at -O1
;   i in s1
clearMemory:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/screens.e16.ts:416  zeroValues()
  call zeroValues
  ; sci/screens.e16.ts:417  poke16(STATS_COUNT, 0)
  sw zero, 5634(zero)
  ; sci/screens.e16.ts:418  for (let i: u16 = 0; i < 16; i++) poke(CPLX_ANS + i, 0)
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/screens.e16.ts:418  poke(CPLX_ANS + i, 0)
  li t0, 10352
  add t0, t0, s1
  sb zero, 0(t0)
  addi s1, s1, 1
.L3:
  li t0, 16
  bltu s1, t0, .L1
  ; sci/screens.e16.ts:419  for (let i: u16 = 0; i < 5 * MATRIX_SIZE; i++) poke(MATRICES + i, 0)
  li s1, 0 ; i
  j .L7
.L5:
  ; sci/screens.e16.ts:419  poke(MATRICES + i, 0)
  li t0, 10496
  add t0, t0, s1
  sb zero, 0(t0)
  addi s1, s1, 1
.L7:
  li t0, 400
  bltu s1, t0, .L5
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:433 extraPages() at -O1
extraPages:
  ; sci/screens.e16.ts:434  return mode === MODE_PROG ? PROG_PAGES : 0
  lw t0, 0x04b8(zero)
  li t1, 7
  bne t0, t1, .L1
  li t0, 3
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
.return:
  ret

; sci/screens.e16.ts:442 funcScreen() at -O1
funcScreen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/screens.e16.ts:443  funcPage = 0
  sw zero, 0x0620(zero)
  ; sci/screens.e16.ts:444  if (mode === MODE_CPLX) cplxFuncScreen()
  lw t0, 0x04b8(zero)
  li t1, 5
  bne t0, t1, .L1
  ; sci/screens.e16.ts:444  cplxFuncScreen()
  la t0, cplxFuncScreen
  li t1, 6
  call far_call
  j .L2
.L1:
  ; sci/screens.e16.ts:445  if (mode === MODE_MATRIX) matFuncScreen()
  lw t0, 0x04b8(zero)
  li t1, 6
  bne t0, t1, .L3
  ; sci/screens.e16.ts:445  matFuncScreen()
  la t0, matFuncScreen
  li t1, 4
  call far_call
  j .L4
.L3:
  ; sci/screens.e16.ts:446  drawFuncPage()
  call drawFuncPage
.L4:
.L2:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/screens.e16.ts:451 drawFuncPage() at -O1
;   page in s1
drawFuncPage:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/screens.e16.ts:452  cls()
  call cls
  ; sci/screens.e16.ts:453  funcPageText[0] = 0x31 + funcPage
  lw t0, 0x0620(zero)
  addi t0, t0, 49
  sb t0, funcPageText(zero)
  ; sci/screens.e16.ts:454  funcPageText[1] = 0x2f
  li t0, 47
  sb t0, funcPageText+1(zero)
  ; sci/screens.e16.ts:455  funcPageText[2] = 0x30 + FUNC_PAGES + extraPages()
  call extraPages
  addi t0, a0, 52
  sb t0, funcPageText+2(zero)
  ; sci/screens.e16.ts:456  funcPageText[3] = 0
  sb zero, funcPageText+3(zero)
  ; sci/screens.e16.ts:457  if (funcPage < extraPages()) {
  lw t0, 0x0620(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  call extraPages
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu t0, a0, .L1
  ; sci/screens.e16.ts:458  bandWith(str('FUNC PROG'), addr(funcPageText))
  la a0, str_70
  la a1, funcPageText
  call bandWith
  ; sci/screens.e16.ts:459  progFuncPage(funcPage)
  lw a0, 0x0620(zero)
  la t0, progFuncPage
  li t1, 5
  call far_call
  ; sci/screens.e16.ts:460  textAt(str('\x8d\x8e:PAGE AC:BACK'), 1, lineY(5))
  la a0, str_71
  li a1, 1
  li a2, 56
  call textAt
  ; sci/screens.e16.ts:461  return
  j .return
.L1:
  ; sci/screens.e16.ts:463  const page = funcPage - extraPages()
  lw t0, 0x0620(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  call extraPages
  lw t0, 0(sp)
  addi sp, sp, 2
  sub s1, t0, a0
  ; sci/screens.e16.ts:464  bandWith(funcTitle(page), addr(funcPageText))
  ; sci/screens.e16.ts:489  if (page === 0) return str('FUNC')
  bne s1, zero, .I1.L1
  ; sci/screens.e16.ts:489  return str('FUNC')
  la t0, str_87
  j .I1_end
.I1.L1:
  ; sci/screens.e16.ts:490  return page === 1 ? str('FUNC RANDOM') : str('FUNC STATS')
  li t0, 1
  bne s1, t0, .I1.L2
  la t0, str_88
  j .I1_end
.I1.L2:
  la t0, str_89
.I1_end:
  mv a0, t0
  la a1, funcPageText
  call bandWith
  ; sci/screens.e16.ts:465  if (page === 0) {
  bne s1, zero, .L2
  ; sci/screens.e16.ts:466  textAt(str('1:gcd(   2:lcm('), 1, lineY(0))
  la a0, str_72
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:467  textAt(str('3:%      4:int('), 1, lineY(1))
  la a0, str_73
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:468  textAt(str('5:round( 6:pol('), 1, lineY(2))
  la a0, str_74
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:469  textAt(str('7:rec(   8:d/dx('), 1, lineY(3))
  la a0, str_75
  li a1, 1
  li a2, 38
  call textAt
  ; sci/screens.e16.ts:470  textAt(str('9:\x97(     0:\x90('), 1, lineY(4))
  la a0, str_76
  li a1, 1
  li a2, 47
  call textAt
  j .L3
.L2:
  ; sci/screens.e16.ts:471  if (page === 1) {
  li t0, 1
  bne s1, t0, .L4
  ; sci/screens.e16.ts:472  textAt(str('1:rand   2:dice'), 1, lineY(0))
  la a0, str_77
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:473  textAt(str('3:coin   4:rint'), 1, lineY(1))
  la a0, str_78
  li a1, 1
  li a2, 20
  call textAt
  j .L5
.L4:
  ; sci/screens.e16.ts:474  if (page === 2) {
  li t0, 2
  bne s1, t0, .L6
  ; sci/screens.e16.ts:475  textAt(str('1:n    2:\x95    3:\x91x'), 1, lineY(0))
  la a0, str_79
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:476  textAt(str('4:sx   5:\x96    6:\x91y'), 1, lineY(1))
  la a0, str_80
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:477  textAt(str('7:sy   8:r    9:a'), 1, lineY(2))
  la a0, str_81
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:478  textAt(str('0:b'), 1, lineY(3))
  la a0, str_82
  li a1, 1
  li a2, 38
  call textAt
  j .L7
.L6:
  ; sci/screens.e16.ts:480  textAt(str('1:\x90x   2:\x90x\x84'), 1, lineY(0))
  la a0, str_83
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:481  textAt(str('3:\x90y   4:\x90y\x84'), 1, lineY(1))
  la a0, str_84
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:482  textAt(str('5:\x90xy  6:x\x89(  7:y\x89('), 1, lineY(2))
  la a0, str_85
  li a1, 1
  li a2, 29
  call textAt
  ; sci/screens.e16.ts:483  textAt(str('8:c    9:x\x93\x89('), 1, lineY(3))
  la a0, str_86
  li a1, 1
  li a2, 38
  call textAt
.L7:
.L5:
.L3:
  ; sci/screens.e16.ts:485  textAt(str('\x8d\x8e:PAGE AC:BACK'), 1, lineY(5))
  la a0, str_71
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:494 funcKey(k/t) at -O1
;   k/t in s1
funcKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/t
  ; sci/screens.e16.ts:495  if (mode === MODE_CPLX) return cplxFuncKey(k)
  lw t0, 0x04b8(zero)
  li t1, 5
  bne t0, t1, .L1
  ; sci/screens.e16.ts:495  return cplxFuncKey(k)
  mv a0, s1
  la t0, cplxFuncKey
  li t1, 6
  call far_call
  j .return
.L1:
  ; sci/screens.e16.ts:496  if (mode === MODE_MATRIX) return matFuncKey(k)
  lw t0, 0x04b8(zero)
  li t1, 6
  bne t0, t1, .L2
  ; sci/screens.e16.ts:496  return matFuncKey(k)
  mv a0, s1
  la t0, matFuncKey
  li t1, 4
  call far_call
  j .return
.L2:
  ; sci/screens.e16.ts:497  if (k === K_AC) return 1
  li t0, 5
  bne s1, t0, .L3
  ; sci/screens.e16.ts:497  return 1
  li a0, 1
  j .return
.L3:
  ; sci/screens.e16.ts:498  if (k === K_DOWN || k === K_UP) {
  li t0, 1
  beq s1, t0, .L5
  bne s1, zero, .L4
.L5:
  ; sci/screens.e16.ts:499  if (k === K_DOWN && funcPage + 1 < FUNC_PAGES + extraPages()) funcPage++
  li t0, 1
  bne s1, t0, .L6
  lw t0, 0x0620(zero)
  addi t0, t0, 1
  addi sp, sp, -2
  sw t0, 0(sp)
  call extraPages
  addi t0, a0, 4
  lw t1, 0(sp)
  addi sp, sp, 2
  bgeu t1, t0, .L6
  ; sci/screens.e16.ts:499  funcPage++
  lw t0, 0x0620(zero)
  addi t0, t0, 1
  sw t0, 0x0620(zero)
  j .L7
.L6:
  ; sci/screens.e16.ts:500  if (k === K_UP && funcPage > 0) funcPage--
  bne s1, zero, .L8
  lw t0, 0x0620(zero)
  bgeu zero, t0, .L8
  ; sci/screens.e16.ts:500  funcPage--
  lw t0, 0x0620(zero)
  addi t0, t0, -1
  sw t0, 0x0620(zero)
  j .L9
.L8:
  ; sci/screens.e16.ts:501  refuse()
  call refuse
.L9:
.L7:
  ; sci/screens.e16.ts:502  drawFuncPage()
  call drawFuncPage
  ; sci/screens.e16.ts:503  return 0
  li a0, 0
  j .return
.L4:
  ; sci/screens.e16.ts:505  const t = pageToken(digitOf(k))
  mv a0, s1
  la t0, digitOf
  li t1, 4
  call far_call
  call pageToken
  mv s1, a0 ; k/t
  ; sci/screens.e16.ts:506  if (t === 0) refuse()
  bne s1, zero, .L10
  ; sci/screens.e16.ts:506  refuse()
  call refuse
.L10:
  ; sci/screens.e16.ts:507  return t
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/screens.e16.ts:510 pageToken(d) at -O1
;   d in s1
;   page in s2
pageToken:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; d
  ; sci/screens.e16.ts:511  if (funcPage < extraPages()) return progFuncToken(funcPage, d)
  lw t0, 0x0620(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  call extraPages
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu t0, a0, .L1
  ; sci/screens.e16.ts:511  return progFuncToken(funcPage, d)
  lw a0, 0x0620(zero)
  mv a1, s1
  la t0, progFuncToken
  li t1, 5
  call far_call
  j .return
.L1:
  ; sci/screens.e16.ts:512  const page = funcPage - extraPages()
  lw t0, 0x0620(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  call extraPages
  lw t0, 0(sp)
  addi sp, sp, 2
  sub s2, t0, a0
  ; sci/screens.e16.ts:513  if (page === 0) return funcToken(d)
  bne s2, zero, .L2
  ; sci/screens.e16.ts:513  return funcToken(d)
  mv a0, s1
  call funcToken
  j .return
.L2:
  ; sci/screens.e16.ts:514  if (page === 1) return randomToken(d)
  li t0, 1
  bne s2, t0, .L3
  ; sci/screens.e16.ts:514  return randomToken(d)
  mv a0, s1
  call randomToken
  j .return
.L3:
  ; sci/screens.e16.ts:515  return page === 2 ? statToken(d) : sumToken(d)
  li t0, 2
  bne s2, t0, .L4
  mv a0, s1
  call statToken
  mv t0, a0
  j .L5
.L4:
  mv a0, s1
  call sumToken
  mv t0, a0
.L5:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/screens.e16.ts:519 funcToken(d) at -O1
;   d in a0
funcToken:
  ; sci/screens.e16.ts:520  switch (d) {
  li t0, 8
  beq a0, t0, .L2
  li t0, 9
  beq a0, t0, .L3
  beq a0, zero, .L4
  li t0, 1
  beq a0, t0, .L5
  li t0, 2
  beq a0, t0, .L6
  li t0, 3
  beq a0, t0, .L7
  li t0, 4
  beq a0, t0, .L8
  li t0, 5
  beq a0, t0, .L9
  li t0, 6
  beq a0, t0, .L10
  li t0, 7
  beq a0, t0, .L11
  j .L1
.L2:
  ; sci/screens.e16.ts:522  return T_DERIV
  li a0, 160
  ret
.L3:
  ; sci/screens.e16.ts:524  return T_INTEG
  li a0, 161
  ret
.L4:
  ; sci/screens.e16.ts:526  return T_SIGMA
  li a0, 162
  ret
.L5:
  ; sci/screens.e16.ts:528  return T_GCD
  li a0, 231
  ret
.L6:
  ; sci/screens.e16.ts:530  return T_LCM
  li a0, 232
  ret
.L7:
  ; sci/screens.e16.ts:532  return T_PERCENT
  li a0, 37
  ret
.L8:
  ; sci/screens.e16.ts:534  return T_INT
  li a0, 233
  ret
.L9:
  ; sci/screens.e16.ts:536  return T_RND
  li a0, 234
  ret
.L10:
  ; sci/screens.e16.ts:538  return T_POL
  li a0, 235
  ret
.L11:
  ; sci/screens.e16.ts:540  return T_REC
  li a0, 236
  ret
.L1:
  ; sci/screens.e16.ts:542  return 0
  li a0, 0
.return:
  ret

; sci/screens.e16.ts:546 randomToken(d) at -O1
;   d in a0
randomToken:
  ; sci/screens.e16.ts:547  switch (d) {
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
  ; sci/screens.e16.ts:549  return T_RAN
  li a0, 237
  ret
.L3:
  ; sci/screens.e16.ts:551  return T_DICE
  li a0, 12
  ret
.L4:
  ; sci/screens.e16.ts:553  return T_COIN
  li a0, 13
  ret
.L5:
  ; sci/screens.e16.ts:555  return T_RINT
  li a0, 14
  ret
.L1:
  ; sci/screens.e16.ts:557  return 0
  li a0, 0
.return:
  ret

; sci/screens.e16.ts:561 statToken(d) at -O1
;   d in s1
statToken:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; d
  ; sci/screens.e16.ts:562  if (d >= 1 && d <= 7) return statTokenOf(d - 1)
  li t0, 1
  bltu s1, t0, .L1
  li t0, 7
  bltu t0, s1, .L1
  ; sci/screens.e16.ts:562  return statTokenOf(d - 1)
  addi a0, s1, -1
  call statTokenOf
  j .return
.L1:
  ; sci/screens.e16.ts:563  if (d === 8 || d === 9) return statTokenOf(d + 4)
  li t0, 8
  beq s1, t0, .L3
  li t0, 9
  bne s1, t0, .L2
.L3:
  ; sci/screens.e16.ts:563  return statTokenOf(d + 4)
  addi a0, s1, 4
  call statTokenOf
  j .return
.L2:
  ; sci/screens.e16.ts:564  return d === 0 ? statTokenOf(14) : 0
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

; sci/screens.e16.ts:568 sumToken(d) at -O1
;   d in s1
sumToken:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; d
  ; sci/screens.e16.ts:569  if (d >= 1 && d <= 5) return statTokenOf(d + 6)
  li t0, 1
  bltu s1, t0, .L1
  li t0, 5
  bltu t0, s1, .L1
  ; sci/screens.e16.ts:569  return statTokenOf(d + 6)
  addi a0, s1, 6
  call statTokenOf
  j .return
.L1:
  ; sci/screens.e16.ts:570  if (d === 6) return T_XEST
  li t0, 6
  bne s1, t0, .L2
  ; sci/screens.e16.ts:570  return T_XEST
  li a0, 250
  j .return
.L2:
  ; sci/screens.e16.ts:571  if (d === 7) return T_YEST
  li t0, 7
  bne s1, t0, .L3
  ; sci/screens.e16.ts:571  return T_YEST
  li a0, 251
  j .return
.L3:
  ; sci/screens.e16.ts:572  if (d === 8) return T_STAT_C
  li t0, 8
  bne s1, t0, .L4
  ; sci/screens.e16.ts:572  return T_STAT_C
  li a0, 252
  j .return
.L4:
  ; sci/screens.e16.ts:573  return d === 9 ? T_X2EST : 0
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

; sci/screens.e16.ts:577 statTokenOf(k) at -O1
;   k in a0
statTokenOf:
  ; sci/screens.e16.ts:578  return k <= 8 ? T_STAT_N + k : 0xf4 + k - 9
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

; sci/screens.e16.ts:584 faultScreen(cause, pc) at -O1
;   cause in s1
;   pc in s2
faultScreen:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; cause
  mv s2, a1 ; pc
  ; sci/screens.e16.ts:585  if (cause === 0x800f || cause === 3) band(str('BREAK'))
  li t0, 32783
  beq s1, t0, .L2
  li t0, 3
  bne s1, t0, .L1
.L2:
  ; sci/screens.e16.ts:585  band(str('BREAK'))
  la a0, str_90
  call band
  j .L3
.L1:
  ; sci/screens.e16.ts:586  band(str('FAULT'))
  la a0, str_91
  call band
.L3:
  ; sci/screens.e16.ts:587  textAt(str('CAUSE'), 1, lineY(0))
  la a0, str_92
  li a1, 1
  li a2, 11
  call textAt
  ; sci/screens.e16.ts:588  hexAt(cause, 43, lineY(0))
  mv a0, s1
  li a1, 43
  li a2, 11
  call hexAt
  ; sci/screens.e16.ts:589  textAt(str('AT'), 1, lineY(1))
  la a0, str_93
  li a1, 1
  li a2, 20
  call textAt
  ; sci/screens.e16.ts:590  hexAt(pc, 43, lineY(1))
  mv a0, s2
  li a1, 43
  li a2, 20
  call hexAt
  ; sci/screens.e16.ts:591  textAt(str('AC:CLEAR'), 1, lineY(5))
  la a0, str_47
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/screens.e16.ts:596 hexAt(v, x, y) at -O1
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
  ; sci/screens.e16.ts:597  for (let s: u16 = 0; s < 4; s++) {
  li s1, 0 ; s
  j .L3
.L1:
  ; sci/screens.e16.ts:598  const d = (v >> (12 - s * 4)) & 15
  slli t0, s1, 2
  li t1, 12
  sub t1, t1, t0
  srl t1, s3, t1
  andi s2, t1, 15
  ; sci/screens.e16.ts:599  hexText[s] = d < 10 ? 0x30 + d : 0x37 + d
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
  ; sci/screens.e16.ts:601  hexText[4] = 0
  sb zero, hexText+4(zero)
  ; sci/screens.e16.ts:602  textAt(addr(hexText), x, y)
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

str_26:
  .byte 69, 76, 69, 67, 45, 49, 54, 32, 83, 67, 73, 0
str_27:
  .byte 83, 67, 73, 45, 49, 50, 56, 0
str_28:
  .byte 69, 82, 82, 58, 77, 65, 84, 72, 0
str_29:
  .byte 79, 85, 84, 32, 79, 70, 32, 65, 32, 70, 85, 78, 67, 84, 73, 79, 78, 39, 83, 0
str_30:
  .byte 82, 65, 78, 71, 69, 44, 32, 79, 82, 32, 47, 48, 0
str_31:
  .byte 69, 82, 82, 58, 70, 73, 78, 68, 0
str_32:
  .byte 78, 79, 32, 88, 32, 87, 65, 83, 32, 70, 79, 85, 78, 68, 32, 70, 82, 79, 77, 0
str_33:
  .byte 84, 72, 69, 32, 88, 32, 73, 84, 32, 83, 84, 65, 82, 84, 69, 68, 32, 65, 84, 0
str_34:
  .byte 69, 82, 82, 58, 82, 65, 78, 71, 69, 0
str_35:
  .byte 49, 45, 51, 48, 32, 82, 79, 87, 83, 32, 70, 82, 79, 77, 32, 83, 84, 65, 82, 84, 0
str_36:
  .byte 84, 79, 32, 69, 78, 68, 32, 66, 89, 32, 83, 84, 69, 80, 0
str_37:
  .byte 69, 82, 82, 58, 68, 73, 77, 0
str_38:
  .byte 84, 72, 69, 32, 83, 73, 90, 69, 83, 32, 79, 70, 32, 84, 72, 69, 0
str_39:
  .byte 77, 65, 84, 82, 73, 67, 69, 83, 32, 68, 79, 32, 78, 79, 84, 32, 70, 73, 84, 0
str_40:
  .byte 69, 82, 82, 58, 83, 84, 65, 67, 75, 0
str_41:
  .byte 84, 79, 79, 32, 77, 65, 78, 89, 32, 66, 82, 65, 67, 75, 69, 84, 83, 32, 79, 82, 0
str_42:
  .byte 70, 85, 78, 67, 84, 73, 79, 78, 83, 32, 73, 78, 32, 65, 32, 76, 73, 78, 69, 0
str_43:
  .byte 69, 82, 82, 58, 83, 89, 78, 84, 65, 88, 0
str_44:
  .byte 67, 65, 78, 78, 79, 84, 32, 82, 69, 65, 68, 32, 84, 72, 69, 32, 76, 73, 78, 69, 0
str_45:
  .byte 65, 84, 32, 84, 72, 69, 32, 67, 85, 82, 83, 79, 82, 0
str_46:
  .byte 140, 139, 58, 66, 65, 67, 75, 32, 84, 79, 32, 84, 72, 69, 32, 76, 73, 78, 69, 0
str_47:
  .byte 65, 67, 58, 67, 76, 69, 65, 82, 0
str_48:
  .byte 77, 69, 78, 85, 0
str_49:
  .byte 49, 58, 67, 65, 76, 67, 32, 32, 32, 32, 50, 58, 83, 84, 65, 84, 83, 0
str_50:
  .byte 51, 58, 66, 65, 83, 69, 32, 32, 32, 32, 52, 58, 84, 65, 66, 76, 69, 0
str_51:
  .byte 53, 58, 69, 81, 85, 65, 84, 73, 79, 78, 32, 54, 58, 67, 80, 76, 88, 0
str_52:
  .byte 55, 58, 77, 65, 84, 82, 73, 88, 32, 32, 56, 58, 80, 82, 79, 71, 0
str_53:
  .byte 65, 67, 58, 66, 65, 67, 75, 0
str_54:
  .byte 83, 69, 84, 85, 80, 0
str_55:
  .byte 49, 47, 50, 0
str_56:
  .byte 50, 47, 50, 0
str_57:
  .byte 49, 58, 97, 47, 98, 32, 32, 50, 58, 97, 32, 98, 47, 99, 0
str_58:
  .byte 67, 79, 78, 84, 82, 65, 83, 84, 0
str_59:
  .byte 61, 58, 67, 76, 69, 65, 82, 32, 65, 76, 76, 63, 0
str_60:
  .byte 51, 58, 67, 76, 69, 65, 82, 32, 77, 69, 77, 79, 82, 89, 0
str_61:
  .byte 140, 139, 58, 67, 79, 78, 84, 82, 65, 83, 84, 0
str_62:
  .byte 49, 58, 50, 68, 32, 32, 50, 58, 76, 73, 78, 69, 0
str_63:
  .byte 51, 58, 68, 69, 71, 32, 52, 58, 82, 65, 68, 32, 53, 58, 71, 82, 65, 68, 0
str_64:
  .byte 54, 58, 69, 88, 65, 67, 84, 32, 55, 58, 68, 69, 67, 73, 77, 65, 76, 0
str_65:
  .byte 56, 58, 70, 73, 88, 32, 57, 58, 69, 88, 80, 32, 48, 58, 65, 85, 84, 79, 0
str_66:
  .byte 65, 85, 84, 79, 50, 0
str_67:
  .byte 70, 73, 88, 0
str_68:
  .byte 69, 88, 80, 0
str_69:
  .byte 48, 45, 57, 63, 0
str_70:
  .byte 70, 85, 78, 67, 32, 80, 82, 79, 71, 0
str_71:
  .byte 141, 142, 58, 80, 65, 71, 69, 32, 65, 67, 58, 66, 65, 67, 75, 0
str_72:
  .byte 49, 58, 103, 99, 100, 40, 32, 32, 32, 50, 58, 108, 99, 109, 40, 0
str_73:
  .byte 51, 58, 37, 32, 32, 32, 32, 32, 32, 52, 58, 105, 110, 116, 40, 0
str_74:
  .byte 53, 58, 114, 111, 117, 110, 100, 40, 32, 54, 58, 112, 111, 108, 40, 0
str_75:
  .byte 55, 58, 114, 101, 99, 40, 32, 32, 32, 56, 58, 100, 47, 100, 120, 40, 0
str_76:
  .byte 57, 58, 151, 40, 32, 32, 32, 32, 32, 48, 58, 144, 40, 0
str_77:
  .byte 49, 58, 114, 97, 110, 100, 32, 32, 32, 50, 58, 100, 105, 99, 101, 0
str_78:
  .byte 51, 58, 99, 111, 105, 110, 32, 32, 32, 52, 58, 114, 105, 110, 116, 0
str_79:
  .byte 49, 58, 110, 32, 32, 32, 32, 50, 58, 149, 32, 32, 32, 32, 51, 58, 145, 120, 0
str_80:
  .byte 52, 58, 115, 120, 32, 32, 32, 53, 58, 150, 32, 32, 32, 32, 54, 58, 145, 121, 0
str_81:
  .byte 55, 58, 115, 121, 32, 32, 32, 56, 58, 114, 32, 32, 32, 32, 57, 58, 97, 0
str_82:
  .byte 48, 58, 98, 0
str_83:
  .byte 49, 58, 144, 120, 32, 32, 32, 50, 58, 144, 120, 132, 0
str_84:
  .byte 51, 58, 144, 121, 32, 32, 32, 52, 58, 144, 121, 132, 0
str_85:
  .byte 53, 58, 144, 120, 121, 32, 32, 54, 58, 120, 137, 40, 32, 32, 55, 58, 121, 137, 40, 0
str_86:
  .byte 56, 58, 99, 32, 32, 32, 32, 57, 58, 120, 147, 137, 40, 0
str_87:
  .byte 70, 85, 78, 67, 0
str_88:
  .byte 70, 85, 78, 67, 32, 82, 65, 78, 68, 79, 77, 0
str_89:
  .byte 70, 85, 78, 67, 32, 83, 84, 65, 84, 83, 0
str_90:
  .byte 66, 82, 69, 65, 75, 0
str_91:
  .byte 70, 65, 85, 76, 84, 0
str_92:
  .byte 67, 65, 85, 83, 69, 0
str_93:
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
  ; sci/exact.e16.ts:424  if (!nearWhole(arg, angle)) return 0xffff
  mv a0, s1
  mv a1, s2
  call nearWhole
  bnez a0, .L7
  ; sci/exact.e16.ts:424  return 0xffff
  li a0, 65535
  j .return
.L7:
.L6:
  ; sci/exact.e16.ts:425  setInt(w(W2), 24)
  li a0, 16
  call w
  li a1, 24
  call setInt
  ; sci/exact.e16.ts:426  run(M_MOD, w(W3), w(W2))
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
  ; sci/exact.e16.ts:427  run(M_TOINT, w(W3), 0)
  li a0, 24
  call w
  mv a1, a0
  li a0, 49
  li a2, 0
  call run
  ; sci/exact.e16.ts:428  const k = i16(peek16(MATH_ARG))
  li t0, 65366
  lw s1, 0(t0)
  ; sci/exact.e16.ts:429  return u16(k < 0 ? k + 24 : k)
  bge s1, zero, .L8
  addi t0, s1, 24
  j .L9
.L8:
  mv t0, s1
.L9:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/exact.e16.ts:436 nearWhole(arg, angle) at -O1
;   arg in s1
;   angle in s2
nearWhole:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; arg
  mv s2, a1 ; angle
  ; sci/exact.e16.ts:437  copy8(arg, w(W3))
  li a0, 24
  call w
  mv a1, a0
  mv a0, s1
  call copy8
  ; sci/exact.e16.ts:438  if (angle === 1) {
  li t0, 1
  bne s2, t0, .L1
  ; sci/exact.e16.ts:439  setInt(w(W2), 12)
  li a0, 16
  call w
  li a1, 12
  call setInt
  ; sci/exact.e16.ts:440  run(M_MUL, w(W3), w(W2))
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
  ; sci/exact.e16.ts:441  run(M_PI, w(W2), 0)
  li a0, 16
  call w
  mv a1, a0
  li a0, 32
  li a2, 0
  call run
  ; sci/exact.e16.ts:442  run(M_DIV, w(W3), w(W2))
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
  j .L2
.L1:
  ; sci/exact.e16.ts:444  setInt(w(W2), 3)
  li a0, 16
  call w
  li a1, 3
  call setInt
  ; sci/exact.e16.ts:445  run(M_MUL, w(W3), w(W2))
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
  ; sci/exact.e16.ts:446  setInt(w(W2), 50)
  li a0, 16
  call w
  li a1, 50
  call setInt
  ; sci/exact.e16.ts:447  run(M_DIV, w(W3), w(W2))
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
.L2:
  ; sci/exact.e16.ts:450  setInt(w(W2), 1)
  li a0, 16
  call w
  li a1, 1
  call setInt
  ; sci/exact.e16.ts:451  setInt(w(W4), 2)
  li a0, 32
  call w
  li a1, 2
  call setInt
  ; sci/exact.e16.ts:452  run(M_DIV, w(W2), w(W4))
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
  ; sci/exact.e16.ts:453  copy8(w(W3), w(W1))
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
  ; sci/exact.e16.ts:454  run(M_ADD, w(W1), w(W2))
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
  ; sci/exact.e16.ts:455  run(M_INT, w(W1), 0)
  li a0, 8
  call w
  mv a1, a0
  li a0, 18
  li a2, 0
  call run
  ; sci/exact.e16.ts:456  copy8(w(W3), w(W4))
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
  ; sci/exact.e16.ts:457  run(M_SUB, w(W4), w(W1))
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
  ; sci/exact.e16.ts:458  absInto(w(W4), w(W4))
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
  ; sci/exact.e16.ts:460  if (isZero(w(W1)) && !isZero(w(W4))) return false
  li a0, 8
  call w
  call isZero
  beqz a0, .L3
  li a0, 32
  call w
  call isZero
  bnez a0, .L3
  ; sci/exact.e16.ts:460  return false
  li a0, 0
  j .return
.L3:
  ; sci/exact.e16.ts:461  setInt(w(W2), 1)
  li a0, 16
  call w
  li a1, 1
  call setInt
  ; sci/exact.e16.ts:462  setInt(w(W0), 1000)
  li a0, 0
  call w
  li a1, 1000
  call setInt
  ; sci/exact.e16.ts:463  run(M_DIV, w(W2), w(W0))
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
  ; sci/exact.e16.ts:464  run(M_DIV, w(W2), w(W0))
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
  ; sci/exact.e16.ts:465  run(M_DIV, w(W2), w(W0))
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
  ; sci/exact.e16.ts:466  if (compare(w(W4), w(W2)) > 0) return false
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
  bge zero, a0, .L4
  ; sci/exact.e16.ts:466  return false
  li a0, 0
  j .return
.L4:
  ; sci/exact.e16.ts:467  copy8(w(W1), w(W3))
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
  ; sci/exact.e16.ts:468  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/exact.e16.ts:475 setSmall(p, r, s, q) at -O1
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
  ; sci/exact.e16.ts:476  setInt(w(W1), p)
  li a0, 8
  call w
  mv a1, s1
  call setInt
  ; sci/exact.e16.ts:477  setInt(w(W2), r)
  li a0, 16
  call w
  mv a1, s2
  call setInt
  ; sci/exact.e16.ts:478  setInt(w(W3), i16(q))
  li a0, 24
  call w
  mv a1, s0
  call setInt
  ; sci/exact.e16.ts:479  setForm(smallAt, w(W1), w(W2), w(W3))
  lw t0, 0x06bc(zero)
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
  ; sci/exact.e16.ts:480  poke16(smallAt + V_S, s)
  lw t0, 0x06bc(zero)
  sw s3, 10(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/exact.e16.ts:484 sinSpecial(k/sign) at -O1
;   k/sign in s2
;   half in s1
sinSpecial:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; k/sign
  ; sci/exact.e16.ts:485  const half = k % 12
  li t1, 43691
  mulhu t0, s2, t1
  srli t0, t0, 3
  li t1, 12
  mul t0, t0, t1
  sub s1, s2, t0
  ; sci/exact.e16.ts:486  const sign: i16 = k >= 12 ? -1 : 1
  li t0, 12
  bltu s2, t0, .L1
  li t0, 65535
  j .L2
.L1:
  li t0, 1
.L2:
  mv s2, t0 ; k/sign
  ; sci/exact.e16.ts:487  switch (half) {
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
  ; sci/exact.e16.ts:489  setSmall(0, 0, 1, 1)
  li a0, 0
  li a1, 0
  li a2, 1
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:490  return true
  li a0, 1
  j .return
.L5:
.L6:
  ; sci/exact.e16.ts:493  setSmall(sign, 0, 1, 2)
  mv a0, s2
  li a1, 0
  li a2, 1
  li a3, 2
  call setSmall
  ; sci/exact.e16.ts:494  return true
  li a0, 1
  j .return
.L7:
.L8:
  ; sci/exact.e16.ts:497  setSmall(0, sign, 2, 2)
  li a0, 0
  mv a1, s2
  li a2, 2
  li a3, 2
  call setSmall
  ; sci/exact.e16.ts:498  return true
  li a0, 1
  j .return
.L9:
.L10:
  ; sci/exact.e16.ts:501  setSmall(0, sign, 3, 2)
  li a0, 0
  mv a1, s2
  li a2, 3
  li a3, 2
  call setSmall
  ; sci/exact.e16.ts:502  return true
  li a0, 1
  j .return
.L11:
  ; sci/exact.e16.ts:504  setSmall(sign, 0, 1, 1)
  mv a0, s2
  li a1, 0
  li a2, 1
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:505  return true
  li a0, 1
  j .return
.L3:
  ; sci/exact.e16.ts:507  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/exact.e16.ts:511 tanSpecial(k/switch1) at -O1
;   k/switch1 in s1
tanSpecial:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/switch1
  ; sci/exact.e16.ts:512  switch (k % 12) {
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
  ; sci/exact.e16.ts:514  setSmall(0, 0, 1, 1)
  li a0, 0
  li a1, 0
  li a2, 1
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:515  return true
  li a0, 1
  j .return
.L3:
  ; sci/exact.e16.ts:517  setSmall(2, -1, 3, 1)
  li a0, 2
  li a1, 65535
  li a2, 3
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:518  return true
  li a0, 1
  j .return
.L4:
  ; sci/exact.e16.ts:520  setSmall(0, 1, 3, 3)
  li a0, 0
  li a1, 1
  li a2, 3
  li a3, 3
  call setSmall
  ; sci/exact.e16.ts:521  return true
  li a0, 1
  j .return
.L5:
  ; sci/exact.e16.ts:523  setSmall(1, 0, 1, 1)
  li a0, 1
  li a1, 0
  li a2, 1
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:524  return true
  li a0, 1
  j .return
.L6:
  ; sci/exact.e16.ts:526  setSmall(0, 1, 3, 1)
  li a0, 0
  li a1, 1
  li a2, 3
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:527  return true
  li a0, 1
  j .return
.L7:
  ; sci/exact.e16.ts:529  setSmall(2, 1, 3, 1)
  li a0, 2
  li a1, 1
  li a2, 3
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:530  return true
  li a0, 1
  j .return
.L8:
  ; sci/exact.e16.ts:532  setSmall(-2, -1, 3, 1)
  li a0, 65534
  li a1, 65535
  li a2, 3
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:533  return true
  li a0, 1
  j .return
.L9:
  ; sci/exact.e16.ts:535  setSmall(0, -1, 3, 1)
  li a0, 0
  li a1, 65535
  li a2, 3
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:536  return true
  li a0, 1
  j .return
.L10:
  ; sci/exact.e16.ts:538  setSmall(-1, 0, 1, 1)
  li a0, 65535
  li a1, 0
  li a2, 1
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:539  return true
  li a0, 1
  j .return
.L11:
  ; sci/exact.e16.ts:541  setSmall(0, -1, 3, 3)
  li a0, 0
  li a1, 65535
  li a2, 3
  li a3, 3
  call setSmall
  ; sci/exact.e16.ts:542  return true
  li a0, 1
  j .return
.L12:
  ; sci/exact.e16.ts:544  setSmall(-2, 1, 3, 1)
  li a0, 65534
  li a1, 1
  li a2, 3
  li a3, 1
  call setSmall
  ; sci/exact.e16.ts:545  return true
  li a0, 1
  j .return
.L1:
  ; sci/exact.e16.ts:547  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/exact.e16.ts:554 exactTrig(f, v, arg/k) at -O1
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
  ; sci/exact.e16.ts:555  const k = angleIndex(arg)
  mv a0, s1
  call angleIndex
  mv s1, a0 ; arg/k
  ; sci/exact.e16.ts:556  smallAt = v
  sw s0, 0x06bc(zero)
  ; sci/exact.e16.ts:557  let found = false
  li s2, 0 ; found
  ; sci/exact.e16.ts:558  if (k !== 0xffff) {
  li t0, 65535
  beq s1, t0, .L1
  ; sci/exact.e16.ts:559  if (f === TRIG_SIN) found = sinSpecial(k)
  bne s3, zero, .L2
  ; sci/exact.e16.ts:559  found = sinSpecial(k)
  mv a0, s1
  call sinSpecial
  mv s2, a0 ; found
  j .L3
.L2:
  ; sci/exact.e16.ts:560  if (f === TRIG_COS) found = sinSpecial((k + 6) % 24)
  li t0, 1
  bne s3, t0, .L4
  ; sci/exact.e16.ts:560  found = sinSpecial((k + 6) % 24)
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
  ; sci/exact.e16.ts:561  found = tanSpecial(k)
  mv a0, s1
  call tanSpecial
  mv s2, a0 ; found
.L5:
.L3:
.L1:
  ; sci/exact.e16.ts:563  if (!found) exactWhole(v)
  bnez s2, .L6
  ; sci/exact.e16.ts:563  exactWhole(v)
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
; sci/layout.e16.ts:40 tokenAt(i) at -O1
;   i in a0
tokenAt:
  ; sci/layout.e16.ts:41  return peek(buf + i)
  lw t0, 0x06be(zero)
  add t0, t0, a0
  lbu a0, 0(t0)
.return:
  ret

; sci/layout.e16.ts:47 closeOf(i/j) at -O1
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
  ; sci/layout.e16.ts:48  let depth: u16 = 0
  li s2, 0 ; depth
  ; sci/layout.e16.ts:49  for (let j = i; j < bufLength; j++) {
  j .L3
.L1:
  ; sci/layout.e16.ts:50  const t = tokenAt(j)
  mv a0, s1
  call tokenAt
  mv s3, a0 ; t
  ; sci/layout.e16.ts:51  if (opensTemplate(t)) depth++
  mv a0, s3
  call opensTemplate
  beqz a0, .L5
  ; sci/layout.e16.ts:51  depth++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/layout.e16.ts:52  if (t === T_END) {
  li t0, 24
  bne s3, t0, .L7
  ; sci/layout.e16.ts:53  depth--
  addi s2, s2, -1
  ; sci/layout.e16.ts:54  if (depth === 0) return j
  bne s2, zero, .L8
  ; sci/layout.e16.ts:54  return j
  mv a0, s1
  j .return
.L8:
.L7:
.L6:
  addi s1, s1, 1
.L3:
  lw t0, 0x06c0(zero)
  bltu s1, t0, .L1
  ; sci/layout.e16.ts:57  return bufLength
  lw a0, 0x06c0(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/layout.e16.ts:61 partEnd(from/j) at -O1
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
  ; sci/layout.e16.ts:62  let depth: u16 = 0
  li s2, 0 ; depth
  ; sci/layout.e16.ts:63  for (let j = from; j < bufLength; j++) {
  j .L3
.L1:
  ; sci/layout.e16.ts:64  const t = tokenAt(j)
  mv a0, s1
  call tokenAt
  mv s3, a0 ; t
  ; sci/layout.e16.ts:65  if (opensTemplate(t)) depth++
  mv a0, s3
  call opensTemplate
  beqz a0, .L5
  ; sci/layout.e16.ts:65  depth++
  addi s2, s2, 1
  j .L6
.L5:
  ; sci/layout.e16.ts:66  if (depth === 0 && (t === T_END || isSeparator(t))) return j
  bne s2, zero, .L7
  li t0, 24
  beq s3, t0, .L8
  mv a0, s3
  call isSeparator
  beqz a0, .L7
.L8:
  ; sci/layout.e16.ts:66  return j
  mv a0, s1
  j .return
.L7:
  ; sci/layout.e16.ts:67  if (t === T_END) depth--
  li t0, 24
  bne s3, t0, .L10
  ; sci/layout.e16.ts:67  depth--
  addi s2, s2, -1
.L10:
.L6:
  addi s1, s1, 1
.L3:
  lw t0, 0x06c0(zero)
  bltu s1, t0, .L1
  ; sci/layout.e16.ts:69  return bufLength
  lw a0, 0x06c0(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/layout.e16.ts:75 measureSeq(from/i, to) at -O1
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
  ; sci/layout.e16.ts:76  if (from >= to) {
  lw t0, 2(sp) ; to
  bltu s1, t0, .L1
  ; sci/layout.e16.ts:77  boxUp = 7
  li t0, 7
  sw t0, 0x06cc(zero)
  ; sci/layout.e16.ts:78  boxDown = 0
  sw zero, 0x06ce(zero)
  ; sci/layout.e16.ts:79  return 6
  li a0, 6
  j .return
.L1:
  ; sci/layout.e16.ts:81  let width: u16 = 0
  li s3, 0 ; width
  ; sci/layout.e16.ts:82  let up: u16 = 7
  li s0, 7 ; up
  ; sci/layout.e16.ts:83  let down: u16 = 0
  sw zero, 0(sp) ; down
  ; sci/layout.e16.ts:84  let lift: u16 = 0
  li s2, 0 ; lift
  ; sci/layout.e16.ts:85  let i = from
  ; sci/layout.e16.ts:86  while (i < to) {
  j .L4
.L2:
  ; sci/layout.e16.ts:87  const t = tokenAt(i)
  mv a0, s1
  call tokenAt
  sw a0, 4(sp) ; t
  ; sci/layout.e16.ts:88  lift = t === T_POWT ? lift + 4 : 0
  li t0, 26
  lw t1, 4(sp) ; t
  bne t1, t0, .L6
  addi t0, s2, 4
  j .L7
.L6:
  li t0, 0
.L7:
  mv s2, t0 ; lift
  ; sci/layout.e16.ts:89  width += measureItem(i)
  mv a0, s1
  call measureItem
  add s3, s3, a0
  ; sci/layout.e16.ts:90  if (boxUp + lift > up) up = boxUp + lift
  lw t0, 0x06cc(zero)
  add t0, t0, s2
  bgeu s0, t0, .L8
  ; sci/layout.e16.ts:90  up = boxUp + lift
  lw t0, 0x06cc(zero)
  add s0, t0, s2
.L8:
  ; sci/layout.e16.ts:91  if (boxDown > down) down = boxDown
  lw t0, 0x06ce(zero)
  lw t1, 0(sp) ; down
  bgeu t1, t0, .L9
  ; sci/layout.e16.ts:91  down = boxDown
  lw t0, 0x06ce(zero)
  sw t0, 0(sp) ; down
.L9:
  ; sci/layout.e16.ts:92  i = opensTemplate(t) ? closeOf(i) + 1 : i + 1
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
  ; sci/layout.e16.ts:94  boxUp = up
  sw s0, 0x06cc(zero)
  ; sci/layout.e16.ts:95  boxDown = down
  lw t0, 0(sp) ; down
  sw t0, 0x06ce(zero)
  ; sci/layout.e16.ts:96  return width
  mv a0, s3
.return:
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  lw s2, 14(sp)
  addi sp, sp, 16
  ret

; sci/layout.e16.ts:100 measureItem(i) at -O1
;   i in s2
;   t/sep/wa in s1
measureItem:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; i
  ; sci/layout.e16.ts:101  const t = tokenAt(i)
  mv a0, s2
  call tokenAt
  mv s1, a0 ; t/sep/wa
  ; sci/layout.e16.ts:102  if (t === T_FRAC) {
  li t0, 22
  bne s1, t0, .L1
  ; sci/layout.e16.ts:103  const sep = partEnd(i + 1)
  addi a0, s2, 1
  call partEnd
  mv s1, a0 ; t/sep/wa
  ; sci/layout.e16.ts:104  return measureFraction(i + 1, sep, partEnd(sep + 1))
  addi a0, s1, 1
  call partEnd
  mv a1, s1
  mv a2, a0
  addi a0, s2, 1
  call measureFraction
  j .return
.L1:
  ; sci/layout.e16.ts:106  if (t === T_MIXED) return measureMixed(i)
  li t0, 28
  bne s1, t0, .L2
  ; sci/layout.e16.ts:106  return measureMixed(i)
  mv a0, s2
  call measureMixed
  j .return
.L2:
  ; sci/layout.e16.ts:107  if (t === T_XROOT) return measureAnyRoot(i)
  li t0, 30
  bne s1, t0, .L3
  ; sci/layout.e16.ts:107  return measureAnyRoot(i)
  mv a0, s2
  call measureAnyRoot
  j .return
.L3:
  ; sci/layout.e16.ts:108  if (t === T_ROOT) {
  li t0, 25
  bne s1, t0, .L4
  ; sci/layout.e16.ts:109  const wa = measureSeq(i + 1, closeOf(i))
  mv a0, s2
  call closeOf
  mv a1, a0
  addi a0, s2, 1
  call measureSeq
  mv s1, a0 ; t/sep/wa
  ; sci/layout.e16.ts:110  boxUp += 2
  lw t0, 0x06cc(zero)
  addi t0, t0, 2
  sw t0, 0x06cc(zero)
  ; sci/layout.e16.ts:111  return wa + 6
  addi a0, s1, 6
  j .return
.L4:
  ; sci/layout.e16.ts:113  if (t === T_POWT) {
  li t0, 26
  bne s1, t0, .L5
  ; sci/layout.e16.ts:114  const wa = measureSeq(i + 1, closeOf(i))
  mv a0, s2
  call closeOf
  mv a1, a0
  addi a0, s2, 1
  call measureSeq
  mv s1, a0 ; t/sep/wa
  ; sci/layout.e16.ts:115  boxUp += 4
  lw t0, 0x06cc(zero)
  addi t0, t0, 4
  sw t0, 0x06cc(zero)
  ; sci/layout.e16.ts:116  boxDown = 0
  sw zero, 0x06ce(zero)
  ; sci/layout.e16.ts:117  return wa + 1
  addi a0, s1, 1
  j .return
.L5:
  ; sci/layout.e16.ts:119  boxUp = 7
  li t0, 7
  sw t0, 0x06cc(zero)
  ; sci/layout.e16.ts:120  boxDown = 0
  sw zero, 0x06ce(zero)
  ; sci/layout.e16.ts:121  return charsOf(t) * 6
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

; sci/layout.e16.ts:125 measureFraction(from/wa, sep/wb, end/reach) at -O1
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
  ; sci/layout.e16.ts:126  const wa = measureSeq(from, sep)
  mv a0, s3
  mv a1, s1
  call measureSeq
  mv s3, a0 ; from/wa
  ; sci/layout.e16.ts:127  const ua = boxUp
  lw s0, 0x06cc(zero)
  ; sci/layout.e16.ts:128  const da = boxDown
  lw t0, 0x06ce(zero)
  sw t0, 0(sp) ; da
  ; sci/layout.e16.ts:129  const wb = measureSeq(sep + 1, end)
  addi a0, s1, 1
  mv a1, s2
  call measureSeq
  mv s1, a0 ; sep/wb
  ; sci/layout.e16.ts:130  const reach = boxUp + boxDown
  lw t0, 0x06cc(zero)
  lw t1, 0x06ce(zero)
  add s2, t0, t1
  ; sci/layout.e16.ts:131  boxUp = MID + 2 + da + ua
  lw t0, 0(sp) ; da
  addi t0, t0, 6
  add t0, t0, s0
  sw t0, 0x06cc(zero)
  ; sci/layout.e16.ts:132  boxDown = reach > 0 ? reach - 1 : 0
  bgeu zero, s2, .L1
  addi t0, s2, -1
  j .L2
.L1:
  li t0, 0
.L2:
  sw t0, 0x06ce(zero)
  ; sci/layout.e16.ts:133  return wider(wa, wb) + 6
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

; sci/layout.e16.ts:137 measureMixed(i/ww) at -O1
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
  ; sci/layout.e16.ts:138  const msep = partEnd(i + 1)
  addi a0, s2, 1
  call partEnd
  mv s1, a0 ; msep/wf
  ; sci/layout.e16.ts:139  const mdiv = partEnd(msep + 1)
  addi a0, s1, 1
  call partEnd
  mv s3, a0 ; mdiv
  ; sci/layout.e16.ts:140  const ww = measureSeq(i + 1, msep)
  addi a0, s2, 1
  mv a1, s1
  call measureSeq
  mv s2, a0 ; i/ww
  ; sci/layout.e16.ts:141  const wu = boxUp
  lw s0, 0x06cc(zero)
  ; sci/layout.e16.ts:142  const wd = boxDown
  lw t0, 0x06ce(zero)
  sw t0, 0(sp) ; wd
  ; sci/layout.e16.ts:143  const wf = measureFraction(msep + 1, mdiv, partEnd(mdiv + 1))
  addi a0, s3, 1
  call partEnd
  mv a1, s3
  mv a2, a0
  addi a0, s1, 1
  call measureFraction
  mv s1, a0 ; msep/wf
  ; sci/layout.e16.ts:144  boxUp = wider(wu, boxUp)
  lw a1, 0x06cc(zero)
  mv a0, s0
  call wider
  sw a0, 0x06cc(zero)
  ; sci/layout.e16.ts:145  boxDown = wider(wd, boxDown)
  lw a1, 0x06ce(zero)
  lw a0, 0(sp)
  call wider
  sw a0, 0x06ce(zero)
  ; sci/layout.e16.ts:146  return ww + 1 + wf
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

; sci/layout.e16.ts:152 measureAnyRoot(i/wi) at -O1
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
  ; sci/layout.e16.ts:153  const xsep = partEnd(i + 1)
  addi a0, s2, 1
  call partEnd
  mv s1, a0 ; xsep/wb
  ; sci/layout.e16.ts:154  const wi = measureSeq(i + 1, xsep)
  addi a0, s2, 1
  mv a1, s1
  call measureSeq
  mv s2, a0 ; i/wi
  ; sci/layout.e16.ts:155  const iu = boxUp + INDEX_LIFT
  lw t0, 0x06cc(zero)
  addi s3, t0, 5
  ; sci/layout.e16.ts:156  const wb = measureSeq(xsep + 1, partEnd(xsep + 1))
  addi a0, s1, 1
  call partEnd
  mv a1, a0
  addi a0, s1, 1
  call measureSeq
  mv s1, a0 ; xsep/wb
  ; sci/layout.e16.ts:157  boxUp = wider(boxUp + 2, iu)
  lw t0, 0x06cc(zero)
  addi a0, t0, 2
  mv a1, s3
  call wider
  sw a0, 0x06cc(zero)
  ; sci/layout.e16.ts:158  return wi + wb + 4
  add t0, s2, s1
  addi a0, t0, 4
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/layout.e16.ts:162 wider(a, b) at -O1
;   a in a0
;   b in a1
wider:
  ; sci/layout.e16.ts:163  if (a > b) return a
  bgeu a1, a0, .L1
  ; sci/layout.e16.ts:163  return a
  ret
.L1:
  ; sci/layout.e16.ts:164  return b
  mv a0, a1
.return:
  ret

; sci/layout.e16.ts:168 charsOf(t/text) at -O1
;   t/text in s1
;   n in s2
charsOf:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t/text
  ; sci/layout.e16.ts:169  const text = tokenText(t)
  mv a0, s1
  call tokenText
  mv s1, a0 ; t/text
  ; sci/layout.e16.ts:170  if (text === 0) return 1
  bne s1, zero, .L1
  ; sci/layout.e16.ts:170  return 1
  li a0, 1
  j .return
.L1:
  ; sci/layout.e16.ts:171  let n: u16 = 0
  li s2, 0 ; n
  ; sci/layout.e16.ts:172  while (peek(text + n) !== 0) n++
  j .L4
.L2:
  ; sci/layout.e16.ts:172  n++
  addi s2, s2, 1
.L4:
  add t0, s1, s2
  lbu t0, 0(t0)
  bne t0, zero, .L2
  ; sci/layout.e16.ts:173  return n
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/layout.e16.ts:179 plot(x, y) at -O1
;   x in s1
;   y in s2
plot:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  ; sci/layout.e16.ts:180  if (!ink || x < slide || x - slide >= 128 || y >= 64) return
  lw t0, 0x06c4(zero)
  beqz t0, .L2
  lw t0, 0x06c2(zero)
  bltu s1, t0, .L2
  lw t0, 0x06c2(zero)
  sub t0, s1, t0
  li t1, 128
  bgeu t0, t1, .L2
  li t0, 64
  bltu s2, t0, .L1
.L2:
  ; sci/layout.e16.ts:180  return
  j .return
.L1:
  ; sci/layout.e16.ts:181  dot(x - slide, y)
  lw t0, 0x06c2(zero)
  sub a0, s1, t0
  mv a1, s2
  call dot
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/layout.e16.ts:184 hline(x0/x, x1, y) at -O1
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
  ; sci/layout.e16.ts:185  for (let x = x0; x <= x1; x++) plot(x, y)
  j .L3
.L1:
  ; sci/layout.e16.ts:185  plot(x, y)
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

; sci/layout.e16.ts:189 char(c, x, y) at -O1
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
  ; sci/layout.e16.ts:190  if (!ink || x < slide || x - slide > 122) return
  lw t0, 0x06c4(zero)
  beqz t0, .L2
  lw t0, 0x06c2(zero)
  bltu s1, t0, .L2
  lw t0, 0x06c2(zero)
  sub t0, s1, t0
  li t1, 122
  bgeu t1, t0, .L1
.L2:
  ; sci/layout.e16.ts:190  return
  j .return
.L1:
  ; sci/layout.e16.ts:191  glyphAt(c, x - slide, y)
  lw t0, 0x06c2(zero)
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

; sci/layout.e16.ts:195 cursorAt(i, x, foot) at -O1
;   i in a0
;   x in a1
;   foot in a2
cursorAt:
  ; sci/layout.e16.ts:196  if (i !== cursorIndex) return
  lw t0, 0x06c6(zero)
  beq a0, t0, .L1
  ; sci/layout.e16.ts:196  return
  ret
.L1:
  ; sci/layout.e16.ts:197  cursorX = x > 0 ? x - 1 : 0
  bgeu zero, a1, .L2
  addi t0, a1, -1
  j .L3
.L2:
  li t0, 0
.L3:
  sw t0, 0x06c8(zero)
  ; sci/layout.e16.ts:198  cursorTop = foot - 8
  addi t0, a2, -8
  sw t0, 0x06ca(zero)
.return:
  ret

; sci/layout.e16.ts:202 drawSeq(from/i, to, x/lift, foot) at -O1
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
  ; sci/layout.e16.ts:203  cursorAt(from, x, foot)
  mv a0, s2
  mv a1, s3
  mv a2, s0
  call cursorAt
  ; sci/layout.e16.ts:204  if (from >= to) {
  lw t0, 0(sp) ; to
  bltu s2, t0, .L1
  ; sci/layout.e16.ts:206  if (cursorIndex !== from) {
  lw t0, 0x06c6(zero)
  beq t0, s2, .L2
  ; sci/layout.e16.ts:207  for (let k: u16 = 0; k < 5; k += 2) {
  li s1, 0 ; k/at
  j .L5
.L3:
  ; sci/layout.e16.ts:208  plot(x + k, foot - 7)
  add a0, s3, s1
  addi a1, s0, -7
  call plot
  ; sci/layout.e16.ts:209  plot(x + k, foot - 1)
  add a0, s3, s1
  addi a1, s0, -1
  call plot
  addi s1, s1, 2
.L5:
  li t0, 5
  bltu s1, t0, .L3
  ; sci/layout.e16.ts:211  for (let k: u16 = 2; k < 6; k += 2) {
  li s1, 2 ; k/at
  j .L9
.L7:
  ; sci/layout.e16.ts:212  plot(x, foot - 7 + k)
  addi t0, s0, -7
  add a1, t0, s1
  mv a0, s3
  call plot
  ; sci/layout.e16.ts:213  plot(x + 4, foot - 7 + k)
  addi t0, s0, -7
  add a1, t0, s1
  addi a0, s3, 4
  call plot
  addi s1, s1, 2
.L9:
  li t0, 6
  bltu s1, t0, .L7
.L2:
  ; sci/layout.e16.ts:216  return x + 6
  addi a0, s3, 6
  j .return
.L1:
  ; sci/layout.e16.ts:218  let at = x
  mv s1, s3 ; k/at
  ; sci/layout.e16.ts:219  let lift: u16 = 0
  li s3, 0 ; x/lift
  ; sci/layout.e16.ts:220  let i = from
  ; sci/layout.e16.ts:221  while (i < to) {
  j .L13
.L11:
  ; sci/layout.e16.ts:222  const t = tokenAt(i)
  mv a0, s2
  call tokenAt
  sw a0, 2(sp) ; t
  ; sci/layout.e16.ts:223  lift = t === T_POWT ? lift + 4 : 0
  li t0, 26
  lw t1, 2(sp) ; t
  bne t1, t0, .L15
  addi t0, s3, 4
  j .L16
.L15:
  li t0, 0
.L16:
  mv s3, t0 ; x/lift
  ; sci/layout.e16.ts:224  at = drawItem(i, at, foot - lift)
  sub a2, s0, s3
  mv a0, s2
  mv a1, s1
  call drawItem
  mv s1, a0 ; k/at
  ; sci/layout.e16.ts:225  i = opensTemplate(t) ? closeOf(i) + 1 : i + 1
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
  ; sci/layout.e16.ts:226  cursorAt(i, at, foot)
  mv a0, s2
  mv a1, s1
  mv a2, s0
  call cursorAt
.L13:
  lw t0, 0(sp) ; to
  bltu s2, t0, .L11
  ; sci/layout.e16.ts:228  return at
  mv a0, s1
.return:
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s0, 10(sp)
  lw s1, 12(sp)
  addi sp, sp, 14
  ret

; sci/layout.e16.ts:231 drawItem(i/text/p, x/at, foot) at -O1
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
  ; sci/layout.e16.ts:232  const t = tokenAt(i)
  mv a0, s1
  call tokenAt
  mv s0, a0 ; t
  ; sci/layout.e16.ts:233  if (t === T_FRAC) {
  li t0, 22
  bne s0, t0, .L1
  ; sci/layout.e16.ts:234  return drawFraction(i + 1, partEnd(i + 1), x, foot)
  addi a0, s1, 1
  call partEnd
  mv a1, a0
  addi a0, s1, 1
  mv a2, s2
  mv a3, s3
  call drawFraction
  j .return
.L1:
  ; sci/layout.e16.ts:236  if (t === T_MIXED) return drawMixed(i, x, foot)
  li t0, 28
  bne s0, t0, .L2
  ; sci/layout.e16.ts:236  return drawMixed(i, x, foot)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call drawMixed
  j .return
.L2:
  ; sci/layout.e16.ts:237  if (t === T_XROOT) return drawAnyRoot(i, x, foot)
  li t0, 30
  bne s0, t0, .L3
  ; sci/layout.e16.ts:237  return drawAnyRoot(i, x, foot)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call drawAnyRoot
  j .return
.L3:
  ; sci/layout.e16.ts:238  if (t === T_ROOT) return drawRoot(i + 1, closeOf(i), x, foot)
  li t0, 25
  bne s0, t0, .L4
  ; sci/layout.e16.ts:238  return drawRoot(i + 1, closeOf(i), x, foot)
  mv a0, s1
  call closeOf
  mv a1, a0
  addi a0, s1, 1
  mv a2, s2
  mv a3, s3
  call drawRoot
  j .return
.L4:
  ; sci/layout.e16.ts:239  if (t === T_POWT) return drawSeq(i + 1, closeOf(i), x, foot - 4) + 1
  li t0, 26
  bne s0, t0, .L5
  ; sci/layout.e16.ts:239  return drawSeq(i + 1, closeOf(i), x, foot - 4) + 1
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
  ; sci/layout.e16.ts:240  const text = tokenText(t)
  mv a0, s0
  call tokenText
  mv s1, a0 ; i/text/p
  ; sci/layout.e16.ts:241  if (text === 0) {
  bne s1, zero, .L6
  ; sci/layout.e16.ts:242  char(t, x, foot - 7)
  mv a0, s0
  mv a1, s2
  addi a2, s3, -7
  call char
  ; sci/layout.e16.ts:243  return x + 6
  addi a0, s2, 6
  j .return
.L6:
  ; sci/layout.e16.ts:245  let at = x
  ; sci/layout.e16.ts:246  let p = text
  ; sci/layout.e16.ts:247  while (peek(p) !== 0) {
  j .L9
.L7:
  ; sci/layout.e16.ts:248  char(peek(p), at, foot - 7)
  lbu a0, 0(s1)
  mv a1, s2
  addi a2, s3, -7
  call char
  ; sci/layout.e16.ts:249  at += 6
  addi s2, s2, 6
  ; sci/layout.e16.ts:250  p++
  addi s1, s1, 1
.L9:
  lbu t0, 0(s1)
  bne t0, zero, .L7
  ; sci/layout.e16.ts:252  return at
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/layout.e16.ts:259 drawFraction(from, sep, x, foot/bar) at -O1
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
  ; sci/layout.e16.ts:260  const end = partEnd(sep + 1)
  addi a0, s1, 1
  call partEnd
  sw a0, 2(sp) ; end
  ; sci/layout.e16.ts:261  const wa = measureSeq(from, sep)
  lw a0, 0(sp)
  mv a1, s1
  call measureSeq
  sw a0, 4(sp) ; wa
  ; sci/layout.e16.ts:262  const da = boxDown
  lw t0, 0x06ce(zero)
  sw t0, 8(sp) ; da
  ; sci/layout.e16.ts:263  const wb = measureSeq(sep + 1, end)
  addi a0, s1, 1
  lw a1, 2(sp)
  call measureSeq
  sw a0, 6(sp) ; wb
  ; sci/layout.e16.ts:264  const ub = boxUp
  lw t0, 0x06cc(zero)
  sw t0, 10(sp) ; ub
  ; sci/layout.e16.ts:265  const w = wider(wa, wb) + 6
  lw a0, 4(sp)
  lw a1, 6(sp)
  call wider
  addi s0, a0, 6
  ; sci/layout.e16.ts:266  const bar = foot - MID
  addi s3, s3, -4
  ; sci/layout.e16.ts:267  hline(x + 1, x + w - 3, bar)
  add t0, s2, s0
  addi a0, s2, 1
  addi a1, t0, -3
  mv a2, s3
  call hline
  ; sci/layout.e16.ts:268  drawSeq(from, sep, x + ((w - wa) >> 1), bar - 2 - da)
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
  ; sci/layout.e16.ts:269  drawSeq(sep + 1, end, x + ((w - wb) >> 1), bar + 2 + ub)
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
  ; sci/layout.e16.ts:270  return x + w
  add a0, s2, s0
.return:
  lw ra, 12(sp)
  lw s1, 14(sp)
  lw s2, 16(sp)
  lw s3, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; sci/layout.e16.ts:273 drawMixed(i/after, x, foot) at -O1
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
  ; sci/layout.e16.ts:274  const msep = partEnd(i + 1)
  addi a0, s1, 1
  call partEnd
  mv s2, a0 ; msep
  ; sci/layout.e16.ts:275  const mdiv = partEnd(msep + 1)
  addi a0, s2, 1
  call partEnd
  sw a0, 0(sp) ; mdiv
  ; sci/layout.e16.ts:276  const after = drawSeq(i + 1, msep, x, foot)
  addi a0, s1, 1
  mv a1, s2
  mv a2, s0
  mv a3, s3
  call drawSeq
  mv s1, a0 ; i/after
  ; sci/layout.e16.ts:277  return drawFraction(msep + 1, mdiv, after + 1, foot)
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

; sci/layout.e16.ts:280 drawAnyRoot(i/after, x, foot) at -O1
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
  ; sci/layout.e16.ts:281  const xsep = partEnd(i + 1)
  addi a0, s1, 1
  call partEnd
  mv s2, a0 ; xsep
  ; sci/layout.e16.ts:282  const after = drawSeq(i + 1, xsep, x, foot - INDEX_LIFT)
  addi a0, s1, 1
  mv a1, s2
  mv a2, s0
  addi a3, s3, -5
  call drawSeq
  mv s1, a0 ; i/after
  ; sci/layout.e16.ts:283  return drawRoot(xsep + 1, partEnd(xsep + 1), after - 2, foot)
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

; sci/layout.e16.ts:287 drawRoot(from, end, x, foot) at -O1
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
  ; sci/layout.e16.ts:288  const wa = measureSeq(from, end)
  lw a0, 0(sp)
  lw a1, 2(sp)
  call measureSeq
  sw a0, 4(sp) ; wa
  ; sci/layout.e16.ts:289  const top = foot - boxUp - 2
  lw t0, 0x06cc(zero)
  sub t0, s2, t0
  addi s0, t0, -2
  ; sci/layout.e16.ts:290  plot(x, foot - 4)
  mv a0, s1
  addi a1, s2, -4
  call plot
  ; sci/layout.e16.ts:291  plot(x + 1, foot - 3)
  addi a0, s1, 1
  addi a1, s2, -3
  call plot
  ; sci/layout.e16.ts:292  plot(x + 1, foot - 2)
  addi a0, s1, 1
  addi a1, s2, -2
  call plot
  ; sci/layout.e16.ts:293  plot(x + 2, foot - 1)
  addi a0, s1, 2
  addi a1, s2, -1
  call plot
  ; sci/layout.e16.ts:294  const half = (foot - top) >> 1
  sub t0, s2, s0
  srli t0, t0, 1
  sw t0, 6(sp) ; half
  ; sci/layout.e16.ts:295  for (let y = top; y < foot; y++) plot(foot - y > half ? x + 3 : x + 4, y)
  mv s3, s0 ; y
  j .L3
.L1:
  ; sci/layout.e16.ts:295  plot(foot - y > half ? x + 3 : x + 4, y)
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
  ; sci/layout.e16.ts:296  hline(x + 4, x + 4 + wa, top)
  lw t0, 4(sp) ; wa
  addi t1, s1, 4
  add a1, t1, t0
  addi a0, s1, 4
  mv a2, s0
  call hline
  ; sci/layout.e16.ts:297  drawSeq(from, end, x + 5, foot)
  lw a0, 0(sp)
  lw a1, 2(sp)
  addi a2, s1, 5
  mv a3, s2
  call drawSeq
  ; sci/layout.e16.ts:298  return x + wa + 6
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

; sci/layout.e16.ts:304 heightOf(at, length) at -O1
;   at in s2
;   length in s1
heightOf:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; at
  mv s1, a1 ; length
  ; sci/layout.e16.ts:305  buf = at
  sw s2, 0x06be(zero)
  ; sci/layout.e16.ts:306  bufLength = length
  sw s1, 0x06c0(zero)
  ; sci/layout.e16.ts:307  measureSeq(0, length)
  li a0, 0
  mv a1, s1
  call measureSeq
  ; sci/layout.e16.ts:308  return boxUp + boxDown
  lw t0, 0x06cc(zero)
  lw t1, 0x06ce(zero)
  add a0, t0, t1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/layout.e16.ts:315 setLine(at/foot, length, cursor) at -O1
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
  ; sci/layout.e16.ts:316  buf = at
  sw s1, 0x06be(zero)
  ; sci/layout.e16.ts:317  bufLength = length
  sw s2, 0x06c0(zero)
  ; sci/layout.e16.ts:318  measureSeq(0, length)
  li a0, 0
  mv a1, s2
  call measureSeq
  ; sci/layout.e16.ts:319  const foot = 2 + (boxUp > 7 ? boxUp : 7)
  lw t1, 0x06cc(zero)
  li t0, 2
  li t2, 7
  bgeu t2, t1, .L1
  lw t1, 0x06cc(zero)
  j .L2
.L1:
  li t1, 7
.L2:
  add s1, t0, t1
  ; sci/layout.e16.ts:320  cursorIndex = cursor
  sw s3, 0x06c6(zero)
  ; sci/layout.e16.ts:321  slide = 0
  sw zero, 0x06c2(zero)
  ; sci/layout.e16.ts:322  ink = false
  sw zero, 0x06c4(zero)
  ; sci/layout.e16.ts:323  drawSeq(0, length, 1, foot)
  li a0, 0
  mv a1, s2
  li a2, 1
  mv a3, s1
  call drawSeq
  ; sci/layout.e16.ts:324  if (cursorX > 124) slide = cursorX - 124
  lw t0, 0x06c8(zero)
  li t1, 124
  bgeu t1, t0, .L3
  ; sci/layout.e16.ts:324  slide = cursorX - 124
  lw t0, 0x06c8(zero)
  addi t0, t0, -124
  sw t0, 0x06c2(zero)
.L3:
  ; sci/layout.e16.ts:325  ink = true
  li t0, 1
  sw t0, 0x06c4(zero)
  ; sci/layout.e16.ts:326  drawSeq(0, length, 1, foot)
  li a0, 0
  mv a1, s2
  li a2, 1
  mv a3, s1
  call drawSeq
  ; sci/layout.e16.ts:327  if (cursorX >= slide) cursorX -= slide
  lw t0, 0x06c8(zero)
  lw t1, 0x06c2(zero)
  bltu t0, t1, .L4
  ; sci/layout.e16.ts:327  cursorX -= slide
  lw t0, 0x06c8(zero)
  lw t1, 0x06c2(zero)
  sub t0, t0, t1
  sw t0, 0x06c8(zero)
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/layout.e16.ts:331 setTokensAt(at/w, length, foot) at -O1
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
  ; sci/layout.e16.ts:332  buf = at
  sw s1, 0x06be(zero)
  ; sci/layout.e16.ts:333  bufLength = length
  sw s2, 0x06c0(zero)
  ; sci/layout.e16.ts:334  const w = measureSeq(0, length)
  li a0, 0
  mv a1, s2
  call measureSeq
  mv s1, a0 ; at/w
  ; sci/layout.e16.ts:335  cursorIndex = 0xffff
  li t0, 65535
  sw t0, 0x06c6(zero)
  ; sci/layout.e16.ts:336  slide = 0
  sw zero, 0x06c2(zero)
  ; sci/layout.e16.ts:337  ink = true
  li t0, 1
  sw t0, 0x06c4(zero)
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

; sci/layout.e16.ts:342 setAnswer(at/w, length) at -O1
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
  ; sci/layout.e16.ts:343  buf = at
  sw s1, 0x06be(zero)
  ; sci/layout.e16.ts:344  bufLength = length
  sw s2, 0x06c0(zero)
  ; sci/layout.e16.ts:345  const w = measureSeq(0, length)
  li a0, 0
  mv a1, s2
  call measureSeq
  mv s1, a0 ; at/w
  ; sci/layout.e16.ts:346  const foot = 62 - boxDown
  lw t0, 0x06ce(zero)
  li t1, 62
  sub s3, t1, t0
  ; sci/layout.e16.ts:347  cursorIndex = 0xffff
  li t0, 65535
  sw t0, 0x06c6(zero)
  ; sci/layout.e16.ts:348  slide = 0
  sw zero, 0x06c2(zero)
  ; sci/layout.e16.ts:349  ink = true
  li t0, 1
  sw t0, 0x06c4(zero)
  ; sci/layout.e16.ts:350  drawSeq(0, length, 128 - w, foot)
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

; sci/draw.e16.ts:90 drawAnnunciators() at -O1
;   bits in s1
;   angle/format in s2
drawAnnunciators:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/draw.e16.ts:91  let bits: u16 = 0
  li s1, 0 ; bits
  ; sci/draw.e16.ts:92  if (shifted) bits |= ANN_S
  lw t0, 0x0588(zero)
  beqz t0, .L1
  ; sci/draw.e16.ts:92  bits |= ANN_S
  ori s1, s1, 2
.L1:
  ; sci/draw.e16.ts:93  if (alphaOn || storing || recalling) bits |= ANN_A
  lw t0, 0x058a(zero)
  bnez t0, .L3
  lw t0, 0x058c(zero)
  bnez t0, .L3
  lw t0, 0x058e(zero)
  beqz t0, .L2
.L3:
  ; sci/draw.e16.ts:93  bits |= ANN_A
  ori s1, s1, 4
.L2:
  ; sci/draw.e16.ts:94  if (storing) bits |= ANN_STO
  lw t0, 0x058c(zero)
  beqz t0, .L4
  ; sci/draw.e16.ts:94  bits |= ANN_STO
  ori s1, s1, 16
.L4:
  ; sci/draw.e16.ts:95  if (peek(varAt(0x4d) + 2) !== 0) bits |= ANN_M
  lbu t0, 3410(zero)
  beq t0, zero, .L5
  ; sci/draw.e16.ts:95  bits |= ANN_M
  ori s1, s1, 8
.L5:
  ; sci/draw.e16.ts:96  const angle = peek(KEEP_ANGLE)
  lbu s2, 3074(zero)
  ; sci/draw.e16.ts:97  bits |= angle === 1 ? ANN_R : angle === 2 ? ANN_G : ANN_D
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
  ; sci/draw.e16.ts:98  if (twoD()) bits |= ANN_2D
  call twoD
  beqz a0, .L10
  ; sci/draw.e16.ts:98  bits |= ANN_2D
  ori s1, s1, 4096
.L10:
  ; sci/draw.e16.ts:99  if (mode === MODE_STATS) bits |= ANN_STAT
  lw t0, 0x04b8(zero)
  li t1, 1
  bne t0, t1, .L11
  ; sci/draw.e16.ts:99  bits |= ANN_STAT
  ori s1, s1, 64
.L11:
  ; sci/draw.e16.ts:100  if (hyp) bits |= ANN_HYP
  lw t0, 0x0594(zero)
  beqz t0, .L12
  ; sci/draw.e16.ts:100  bits |= ANN_HYP
  ori s1, s1, 32
.L12:
  ; sci/draw.e16.ts:101  const format = peek(KEEP_FORMAT)
  lbu s2, 3077(zero)
  ; sci/draw.e16.ts:102  if (format === FORMAT_FIX) bits |= ANN_FIX
  li t0, 1
  bne s2, t0, .L13
  ; sci/draw.e16.ts:102  bits |= ANN_FIX
  ori s1, s1, 1024
  j .L14
.L13:
  ; sci/draw.e16.ts:103  if (format === FORMAT_EXP) bits |= ANN_EXP
  li t0, 2
  bne s2, t0, .L15
  ; sci/draw.e16.ts:103  bits |= ANN_EXP
  ori s1, s1, 2048
.L15:
.L14:
  ; sci/draw.e16.ts:104  if (screen === S_CALC) bits |= historyMarks()
  lw t0, 0x04b6(zero)
  bne t0, zero, .L16
  ; sci/draw.e16.ts:104  bits |= historyMarks()
  call historyMarks
  or s1, s1, a0
.L16:
  ; sci/draw.e16.ts:105  marks(bits)
  mv a0, s1
  call marks
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/draw.e16.ts:112 historyMarks() at -O1
;   count in s2
;   browsing in s3
;   bits in s1
historyMarks:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; sci/draw.e16.ts:113  if (mode === MODE_BASE && answered) return 0
  lw t0, 0x04b8(zero)
  li t1, 2
  bne t0, t1, .L1
  lw t0, 0x0586(zero)
  beqz t0, .L1
  ; sci/draw.e16.ts:113  return 0
  li a0, 0
  j .return
.L1:
  ; sci/draw.e16.ts:114  const count = historyEntries() === 0 ? 0 : peek16(historyCount())
  call historyEntries
  bne a0, zero, .L2
  li t0, 0
  j .L3
.L2:
  call historyCount
  lw t0, 0(a0)
.L3:
  mv s2, t0 ; count
  ; sci/draw.e16.ts:115  const browsing = historyAt !== 0xffff
  lw t0, 0x0598(zero)
  li t1, 65535
  sub t0, t0, t1
  snez s3, t0
  ; sci/draw.e16.ts:116  let bits: u16 = 0
  li s1, 0 ; bits
  ; sci/draw.e16.ts:117  if (browsing ? historyAt + 1 < count : count > 0 && (answered || length === 0)) bits |= ANN_UP
  beqz s3, .L5
  lw t0, 0x0598(zero)
  addi t0, t0, 1
  sltu t0, t0, s2
  j .L6
.L5:
  sltu t0, zero, s2
  mv t1, t0
  beqz t1, .L7
  lw t0, 0x0586(zero)
  mv t1, t0
  bnez t1, .L8
  lw t0, 0x0582(zero)
  sub t0, t0, zero
  seqz t0, t0
.L8:
.L7:
.L6:
  beqz t0, .L4
  ; sci/draw.e16.ts:117  bits |= ANN_UP
  li t0, 8192
  or s1, s1, t0
.L4:
  ; sci/draw.e16.ts:118  if (browsing && historyAt > 0) bits |= ANN_DOWN
  beqz s3, .L9
  lw t0, 0x0598(zero)
  bgeu zero, t0, .L9
  ; sci/draw.e16.ts:118  bits |= ANN_DOWN
  li t0, 16384
  or s1, s1, t0
.L9:
  ; sci/draw.e16.ts:119  return bits
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/draw.e16.ts:123 footMarks() at -O1
footMarks:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/draw.e16.ts:124  if (answered && mode === MODE_CALC && constantKept()) textAt(str('K'), 1, 56)
  lw t0, 0x0586(zero)
  beqz t0, .L1
  lw t0, 0x04b8(zero)
  bne t0, zero, .L1
  la t0, constantKept
  li t1, 10
  call far_call
  beqz a0, .L1
  ; sci/draw.e16.ts:124  textAt(str('K'), 1, 56)
  la a0, str_186
  li a1, 1
  li a2, 56
  call textAt
.L1:
  ; sci/draw.e16.ts:125  if (!answered && overwrite) textAt(str('OVR'), 1, 56)
  lw t0, 0x0586(zero)
  bnez t0, .L2
  lw t0, 0x0592(zero)
  beqz t0, .L2
  ; sci/draw.e16.ts:125  textAt(str('OVR'), 1, 56)
  la a0, str_187
  li a1, 1
  li a2, 56
  call textAt
.L2:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/draw.e16.ts:129 drawScreen() at -O1
drawScreen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/draw.e16.ts:130  if (!ownDrawn()) {
  call ownDrawn
  bnez a0, .L1
  ; sci/draw.e16.ts:131  cls()
  call cls
  ; sci/draw.e16.ts:132  if (twoD()) drawLine2D()
  call twoD
  beqz a0, .L2
  ; sci/draw.e16.ts:132  drawLine2D()
  call drawLine2D
  j .L3
.L2:
  ; sci/draw.e16.ts:133  drawLine()
  call drawLine
.L3:
  ; sci/draw.e16.ts:134  if (answered) drawAnswer()
  lw t0, 0x0586(zero)
  beqz t0, .L4
  ; sci/draw.e16.ts:134  drawAnswer()
  call drawAnswer
  j .L5
.L4:
  ; sci/draw.e16.ts:135  if (mode === MODE_PROG) progDrawFoot()
  lw t0, 0x04b8(zero)
  li t1, 7
  bne t0, t1, .L6
  ; sci/draw.e16.ts:135  progDrawFoot()
  la t0, progDrawFoot
  li t1, 5
  call far_call
.L6:
.L5:
  ; sci/draw.e16.ts:136  footMarks()
  call footMarks
  ; sci/draw.e16.ts:137  if (mode === MODE_TABLE) {
  lw t0, 0x04b8(zero)
  li t1, 3
  bne t0, t1, .L7
  ; sci/draw.e16.ts:138  textAt(str('TABLE f(X)'), 1, 47)
  la a0, str_188
  li a1, 1
  li a2, 47
  call textAt
  ; sci/draw.e16.ts:139  textAt(str('=:START,END,STEP'), 1, 56)
  la a0, str_189
  li a1, 1
  li a2, 56
  call textAt
.L7:
.L1:
  ; sci/draw.e16.ts:142  drawAnnunciators()
  call drawAnnunciators
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/draw.e16.ts:149 ownDrawn() at -O1
ownDrawn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/draw.e16.ts:150  if (mode === MODE_BASE) baseDraw()
  lw t0, 0x04b8(zero)
  li t1, 2
  bne t0, t1, .L1
  ; sci/draw.e16.ts:150  baseDraw()
  la t0, baseDraw
  li t1, 8
  call far_call
  j .L2
.L1:
  ; sci/draw.e16.ts:151  if (mode === MODE_MATRIX && matPhase() !== MAT_LINE) {
  lw t0, 0x04b8(zero)
  li t1, 6
  bne t0, t1, .L3
  la t0, matPhase
  li t1, 4
  call far_call
  beq a0, zero, .L3
  ; sci/draw.e16.ts:152  noCursor()
  call noCursor
  ; sci/draw.e16.ts:153  matDraw()
  la t0, matDraw
  li t1, 4
  call far_call
  j .L4
.L3:
  ; sci/draw.e16.ts:154  if (mode === MODE_PROG && progPhase() === PROG_LIST) progDrawList()
  lw t0, 0x04b8(zero)
  li t1, 7
  bne t0, t1, .L5
  la t0, progPhase
  li t1, 5
  call far_call
  bne a0, zero, .L5
  ; sci/draw.e16.ts:154  progDrawList()
  la t0, progDrawList
  li t1, 5
  call far_call
  j .L6
.L5:
  ; sci/draw.e16.ts:155  if (ownScreen() || (mode === MODE_TABLE && tablePhase() === TABLE_VIEW)) {
  call ownScreen
  bnez a0, .L8
  lw t0, 0x04b8(zero)
  li t1, 3
  bne t0, t1, .L7
  la t0, tablePhase
  li t1, 10
  call far_call
  li t0, 2
  bne a0, t0, .L7
.L8:
  ; sci/draw.e16.ts:156  noCursor()
  call noCursor
  ; sci/draw.e16.ts:157  if (mode === MODE_STATS) statsDraw()
  lw t0, 0x04b8(zero)
  li t1, 1
  bne t0, t1, .L9
  ; sci/draw.e16.ts:157  statsDraw()
  la t0, statsDraw
  li t1, 7
  call far_call
  j .L13
.L9:
  ; sci/draw.e16.ts:158  if (mode === MODE_EQN) eqnDraw()
  lw t0, 0x04b8(zero)
  li t1, 4
  bne t0, t1, .L11
  ; sci/draw.e16.ts:158  eqnDraw()
  la t0, eqnDraw
  li t1, 11
  call far_call
  j .L13
.L11:
  ; sci/draw.e16.ts:159  tableDraw()
  la t0, tableDraw
  li t1, 10
  call far_call
  j .L13
.L7:
  ; sci/draw.e16.ts:160  return false
  li a0, 0
  j .return
.L13:
.L6:
.L4:
.L2:
  ; sci/draw.e16.ts:161  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/draw.e16.ts:165 drawAnswer() at -O1
drawAnswer:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/draw.e16.ts:166  if (mode === MODE_CPLX) cplxAnswer()
  lw t0, 0x04b8(zero)
  li t1, 5
  bne t0, t1, .L1
  ; sci/draw.e16.ts:166  cplxAnswer()
  la t0, cplxAnswer
  li t1, 6
  call far_call
  j .L2
.L1:
  ; sci/draw.e16.ts:167  if (mode === MODE_MATRIX && matAnswered()) textRight(str('MatAns'), lineY(4))
  lw t0, 0x04b8(zero)
  li t1, 6
  bne t0, t1, .L3
  la t0, matAnswered
  li t1, 4
  call far_call
  beqz a0, .L3
  ; sci/draw.e16.ts:167  textRight(str('MatAns'), lineY(4))
  la a0, str_190
  li a1, 47
  call textRight
  j .L4
.L3:
  ; sci/draw.e16.ts:168  drawAnswerAs(shown)
  lw a0, 0x059a(zero)
  la t0, drawAnswerAs
  li t1, 5
  call far_call
.L4:
.L2:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/draw.e16.ts:172 drawLine2D() at -O1
drawLine2D:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/draw.e16.ts:173  setLine(addr(line), length, answered ? 0xffff : cursor)
  lw t1, 0x0582(zero)
  lw t2, 0x0586(zero)
  la t0, line
  beqz t2, .L1
  li t2, 65535
  j .L2
.L1:
  lw t2, 0x0584(zero)
.L2:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call setLine
  ; sci/draw.e16.ts:174  if (answered) noCursor()
  lw t0, 0x0586(zero)
  beqz t0, .L3
  ; sci/draw.e16.ts:174  noCursor()
  call noCursor
  j .L4
.L3:
  ; sci/draw.e16.ts:175  barDots(cursorX, cursorTop)
  lw a0, 0x06c8(zero)
  lw a1, 0x06ca(zero)
  call barDots
.L4:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/draw.e16.ts:179 charsTo(n) at -O1
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
  ; sci/draw.e16.ts:180  let c: u16 = 0
  li s2, 0 ; c
  ; sci/draw.e16.ts:181  for (let i: u16 = 0; i < n; i++) c += charsOf(line[i])
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/draw.e16.ts:181  c += charsOf(line[i])
  lbu a0, line(s1)
  call charsOf
  add s2, s2, a0
  addi s1, s1, 1
.L3:
  bltu s1, s3, .L1
  ; sci/draw.e16.ts:182  return c
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/draw.e16.ts:189 drawLine() at -O1
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
  ; sci/draw.e16.ts:190  const at = charsTo(cursor)
  lw a0, 0x0584(zero)
  call charsTo
  mv s1, a0 ; at
  ; sci/draw.e16.ts:191  if (at < scrollFrom) scrollFrom = at - (at % COLS)
  lw t0, 0x0918(zero)
  bgeu s1, t0, .L1
  ; sci/draw.e16.ts:191  scrollFrom = at - (at % COLS)
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
  sw t0, 0x0918(zero)
.L1:
  ; sci/draw.e16.ts:192  if (at >= scrollFrom + LINE_CHARS) scrollFrom = at - (at % COLS) - (LINE_ROWS - 1) * COLS
  lw t0, 0x0918(zero)
  addi t0, t0, 84
  bltu s1, t0, .L2
  ; sci/draw.e16.ts:192  scrollFrom = at - (at % COLS) - (LINE_ROWS - 1) * COLS
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
  sw t0, 0x0918(zero)
.L2:
  ; sci/draw.e16.ts:193  let c: u16 = 0
  li s0, 0 ; c
  ; sci/draw.e16.ts:194  for (let i: u16 = 0; i < length; i++) {
  li s2, 0 ; i/shown
  j .L5
.L3:
  ; sci/draw.e16.ts:195  const t = line[i]
  lbu t0, line(s2)
  sw t0, 0(sp) ; t
  ; sci/draw.e16.ts:196  const text = tokenText(t)
  lw a0, 0(sp)
  call tokenText
  mv s3, a0 ; text/p
  ; sci/draw.e16.ts:197  if (text === 0) {
  bne s3, zero, .L7
  ; sci/draw.e16.ts:198  showChar(t, c)
  lw a0, 0(sp)
  mv a1, s0
  call showChar
  ; sci/draw.e16.ts:199  c++
  addi s0, s0, 1
  j .L8
.L7:
  ; sci/draw.e16.ts:201  let p = text
  ; sci/draw.e16.ts:202  while (peek(p) !== 0) {
  j .L11
.L9:
  ; sci/draw.e16.ts:203  showChar(peek(p), c)
  lbu a0, 0(s3)
  mv a1, s0
  call showChar
  ; sci/draw.e16.ts:204  c++
  addi s0, s0, 1
  ; sci/draw.e16.ts:205  p++
  addi s3, s3, 1
.L11:
  lbu t0, 0(s3)
  bne t0, zero, .L9
.L8:
  addi s2, s2, 1
.L5:
  lw t0, 0x0582(zero)
  bltu s2, t0, .L3
  ; sci/draw.e16.ts:209  if (answered) {
  lw t0, 0x0586(zero)
  beqz t0, .L13
  ; sci/draw.e16.ts:210  noCursor()
  call noCursor
  ; sci/draw.e16.ts:211  return
  j .return
.L13:
  ; sci/draw.e16.ts:213  const shown = at - scrollFrom
  lw t0, 0x0918(zero)
  sub s2, s1, t0
  ; sci/draw.e16.ts:214  barAt(shown % COLS, div(shown, COLS))
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

; sci/draw.e16.ts:218 showChar(ch, c/shown) at -O1
;   ch in s2
;   c/shown in s1
showChar:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; ch
  mv s1, a1 ; c/shown
  ; sci/draw.e16.ts:219  if (c < scrollFrom || c >= scrollFrom + LINE_CHARS) return
  lw t0, 0x0918(zero)
  bltu s1, t0, .L2
  lw t0, 0x0918(zero)
  addi t0, t0, 84
  bltu s1, t0, .L1
.L2:
  ; sci/draw.e16.ts:219  return
  j .return
.L1:
  ; sci/draw.e16.ts:220  const shown = c - scrollFrom
  lw t0, 0x0918(zero)
  sub s1, s1, t0
  ; sci/draw.e16.ts:221  drawChar(ch, shown % COLS, div(shown, COLS))
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

str_186:
  .byte 75, 0
str_187:
  .byte 79, 86, 82, 0
str_188:
  .byte 84, 65, 66, 76, 69, 32, 102, 40, 88, 41, 0
str_189:
  .byte 61, 58, 83, 84, 65, 82, 84, 44, 69, 78, 68, 44, 83, 84, 69, 80, 0
str_190:
  .byte 77, 97, 116, 65, 110, 115, 0
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
  sw t1, 0x06d0(zero)
  ; sci/edit.e16.ts:122  editCursor = start === cur ? start + 1 : cur + 2
  bne s3, s2, .L5
  addi t0, s3, 1
  j .L6
.L5:
  addi t0, s2, 2
.L6:
  sw t0, 0x06d2(zero)
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
  sw s0, 0x06d0(zero)
  ; sci/edit.e16.ts:147  editCursor = cur
  sw s1, 0x06d2(zero)
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
  sw t0, 0x06d2(zero)
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
  sw t0, 0x06d0(zero)
  ; sci/edit.e16.ts:160  editCursor = cur - 1
  addi t0, s1, -1
  sw t0, 0x06d2(zero)
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
  sw t0, 0x06d2(zero)
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
  sw t0, 0x06d0(zero)
  ; sci/edit.e16.ts:170  editCursor = open
  sw s2, 0x06d2(zero)
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
  sw s3, 0x06d0(zero)
  ; sci/edit.e16.ts:222  editCursor = 0xffff
  li t0, 65535
  sw t0, 0x06d2(zero)
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
  sw a0, 0x06d2(zero)
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
  sw a0, 0x06d2(zero)
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
  sw s1, 0x06d2(zero)
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

; sci/keymap.e16.ts:81 tokenOf(k, shift) at -O1
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
  ; sci/keymap.e16.ts:82  const plain = plainToken(k)
  mv a0, s1
  call plainToken
  mv s2, a0 ; plain
  ; sci/keymap.e16.ts:83  return plain !== 0 ? plain : faceToken(k, shift)
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

; sci/keymap.e16.ts:87 plainToken(k) at -O1
;   k in a0
plainToken:
  ; sci/keymap.e16.ts:88  switch (k) {
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
  ; sci/keymap.e16.ts:90  return 0x30
  li a0, 48
  ret
.L3:
  ; sci/keymap.e16.ts:92  return 0x31
  li a0, 49
  ret
.L4:
  ; sci/keymap.e16.ts:94  return 0x32
  li a0, 50
  ret
.L5:
  ; sci/keymap.e16.ts:96  return 0x33
  li a0, 51
  ret
.L6:
  ; sci/keymap.e16.ts:98  return 0x34
  li a0, 52
  ret
.L7:
  ; sci/keymap.e16.ts:100  return 0x35
  li a0, 53
  ret
.L8:
  ; sci/keymap.e16.ts:102  return 0x36
  li a0, 54
  ret
.L9:
  ; sci/keymap.e16.ts:104  return 0x37
  li a0, 55
  ret
.L10:
  ; sci/keymap.e16.ts:106  return 0x38
  li a0, 56
  ret
.L11:
  ; sci/keymap.e16.ts:108  return 0x39
  li a0, 57
  ret
.L12:
  ; sci/keymap.e16.ts:110  return T_POINT
  li a0, 46
  ret
.L13:
  ; sci/keymap.e16.ts:112  return T_PLUS
  li a0, 43
  ret
.L14:
  ; sci/keymap.e16.ts:114  return T_MINUS
  li a0, 45
  ret
.L15:
  ; sci/keymap.e16.ts:116  return T_TIMES
  li a0, 129
  ret
.L16:
  ; sci/keymap.e16.ts:118  return T_DIVIDE
  li a0, 130
  ret
.L17:
  ; sci/keymap.e16.ts:120  return T_CLOSE
  li a0, 41
  ret
.L18:
  ; sci/keymap.e16.ts:122  return T_ANS
  li a0, 20
  ret
.L1:
  ; sci/keymap.e16.ts:124  return 0
  li a0, 0
.return:
  ret

; sci/keymap.e16.ts:128 faceToken(k, shift) at -O1
;   k in s1
;   shift in s2
faceToken:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; shift
  ; sci/keymap.e16.ts:129  return shift ? shiftFace(k) : capToken(k)
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

; sci/keymap.e16.ts:133 capToken(k) at -O1
;   k in a0
capToken:
  ; sci/keymap.e16.ts:134  switch (k) {
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
  ; sci/keymap.e16.ts:136  return T_OPEN
  li a0, 40
  ret
.L3:
  ; sci/keymap.e16.ts:138  return T_NEG
  li a0, 16
  ret
.L4:
  ; sci/keymap.e16.ts:140  return T_EXP
  li a0, 135
  ret
.L5:
  ; sci/keymap.e16.ts:142  return T_SQUARE
  li a0, 132
  ret
.L6:
  ; sci/keymap.e16.ts:144  return T_SQRT
  li a0, 9
  ret
.L7:
  ; sci/keymap.e16.ts:146  return T_POW
  li a0, 17
  ret
.L8:
  ; sci/keymap.e16.ts:148  return T_LOG
  li a0, 7
  ret
.L9:
  ; sci/keymap.e16.ts:150  return T_LN
  li a0, 8
  ret
.L10:
  ; sci/keymap.e16.ts:152  return T_SIN
  li a0, 1
  ret
.L11:
  ; sci/keymap.e16.ts:154  return T_COS
  li a0, 2
  ret
.L12:
  ; sci/keymap.e16.ts:156  return T_TAN
  li a0, 3
  ret
.L13:
  ; sci/keymap.e16.ts:158  return T_INVERSE
  li a0, 134
  ret
.L14:
  ; sci/keymap.e16.ts:160  return T_NCR
  li a0, 18
  ret
.L1:
  ; sci/keymap.e16.ts:162  return 0
  li a0, 0
.return:
  ret

; sci/keymap.e16.ts:166 shiftFace(k) at -O1
;   k in a0
shiftFace:
  ; sci/keymap.e16.ts:167  switch (k) {
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
  ; sci/keymap.e16.ts:169  return T_ABS
  li a0, 230
  ret
.L3:
  ; sci/keymap.e16.ts:171  return T_COMMA
  li a0, 44
  ret
.L4:
  ; sci/keymap.e16.ts:173  return T_PI
  li a0, 128
  ret
.L5:
  ; sci/keymap.e16.ts:175  return T_CUBE
  li a0, 133
  ret
.L6:
  ; sci/keymap.e16.ts:177  return T_CBRT
  li a0, 10
  ret
.L7:
  ; sci/keymap.e16.ts:179  return T_TEN
  li a0, 21
  ret
.L8:
  ; sci/keymap.e16.ts:181  return T_E
  li a0, 101
  ret
.L9:
  ; sci/keymap.e16.ts:183  return T_ASIN
  li a0, 4
  ret
.L10:
  ; sci/keymap.e16.ts:185  return T_ACOS
  li a0, 5
  ret
.L11:
  ; sci/keymap.e16.ts:187  return T_ATAN
  li a0, 6
  ret
.L12:
  ; sci/keymap.e16.ts:189  return T_BANG
  li a0, 33
  ret
.L13:
  ; sci/keymap.e16.ts:191  return T_NPR
  li a0, 19
  ret
.L1:
  ; sci/keymap.e16.ts:193  return 0
  li a0, 0
.return:
  ret

; sci/keymap.e16.ts:197 hypToken(k, shift) at -O1
;   k in a0
;   shift in a1
hypToken:
  ; sci/keymap.e16.ts:198  if (k === K_SIN) return shift ? T_ASINH : T_SINH
  li t0, 27
  bne a0, t0, .L1
  ; sci/keymap.e16.ts:198  return shift ? T_ASINH : T_SINH
  beqz a1, .L2
  li t0, 227
  j .L3
.L2:
  li t0, 224
.L3:
  mv a0, t0
  ret
.L1:
  ; sci/keymap.e16.ts:199  if (k === K_COS) return shift ? T_ACOSH : T_COSH
  li t0, 28
  bne a0, t0, .L4
  ; sci/keymap.e16.ts:199  return shift ? T_ACOSH : T_COSH
  beqz a1, .L5
  li t0, 228
  j .L6
.L5:
  li t0, 225
.L6:
  mv a0, t0
  ret
.L4:
  ; sci/keymap.e16.ts:200  if (k === K_TAN) return shift ? T_ATANH : T_TANH
  li t0, 29
  bne a0, t0, .L7
  ; sci/keymap.e16.ts:200  return shift ? T_ATANH : T_TANH
  beqz a1, .L8
  li t0, 229
  j .L9
.L8:
  li t0, 226
.L9:
  mv a0, t0
  ret
.L7:
  ; sci/keymap.e16.ts:201  return 0
  li a0, 0
.return:
  ret

; sci/keymap.e16.ts:205 letterOf(k) at -O1
;   k in a0
letterOf:
  ; sci/keymap.e16.ts:206  switch (k) {
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
  ; sci/keymap.e16.ts:208  return 0x41
  li a0, 65
  ret
.L3:
  ; sci/keymap.e16.ts:210  return 0x42
  li a0, 66
  ret
.L4:
  ; sci/keymap.e16.ts:212  return 0x43
  li a0, 67
  ret
.L5:
  ; sci/keymap.e16.ts:214  return 0x44
  li a0, 68
  ret
.L6:
  ; sci/keymap.e16.ts:216  return 0x45
  li a0, 69
  ret
.L7:
  ; sci/keymap.e16.ts:218  return 0x46
  li a0, 70
  ret
.L8:
  ; sci/keymap.e16.ts:220  return 0x58
  li a0, 88
  ret
.L9:
  ; sci/keymap.e16.ts:222  return 0x59
  li a0, 89
  ret
.L10:
  ; sci/keymap.e16.ts:224  return 0x4d
  li a0, 77
  ret
.L11:
  ; sci/keymap.e16.ts:226  return T_E
  li a0, 101
  ret
.L1:
  ; sci/keymap.e16.ts:228  return 0
  li a0, 0
.return:
  ret

; sci/keymap.e16.ts:232 digitOf(k) at -O1
;   k in a0
digitOf:
  ; sci/keymap.e16.ts:233  if (k === K_0) return 0
  li t0, 59
  bne a0, t0, .L1
  ; sci/keymap.e16.ts:233  return 0
  li a0, 0
  ret
.L1:
  ; sci/keymap.e16.ts:234  if (k === K_1) return 1
  li t0, 56
  bne a0, t0, .L2
  ; sci/keymap.e16.ts:234  return 1
  li a0, 1
  ret
.L2:
  ; sci/keymap.e16.ts:235  if (k === K_2) return 2
  li t0, 57
  bne a0, t0, .L3
  ; sci/keymap.e16.ts:235  return 2
  li a0, 2
  ret
.L3:
  ; sci/keymap.e16.ts:236  if (k === K_3) return 3
  li t0, 58
  bne a0, t0, .L4
  ; sci/keymap.e16.ts:236  return 3
  li a0, 3
  ret
.L4:
  ; sci/keymap.e16.ts:237  if (k >= K_4 && k <= K_6) return 4 + k - K_4
  li t0, 48
  bltu a0, t0, .L5
  li t0, 50
  bltu t0, a0, .L5
  ; sci/keymap.e16.ts:237  return 4 + k - K_4
  addi a0, a0, -44
  ret
.L5:
  ; sci/keymap.e16.ts:238  if (k >= K_7 && k <= K_9) return 7 + k - K_7
  li t0, 40
  bltu a0, t0, .L6
  li t0, 42
  bltu t0, a0, .L6
  ; sci/keymap.e16.ts:238  return 7 + k - K_7
  addi a0, a0, -33
  ret
.L6:
  ; sci/keymap.e16.ts:239  return 0xffff
  li a0, 65535
.return:
  ret

; sci/matview.e16.ts:24 matPhase() at -O1
matPhase:
  ; sci/matview.e16.ts:25  return matNow
  lw a0, 0x0978(zero)
.return:
  ret

; sci/matview.e16.ts:29 matStart() at -O1
matStart:
  ; sci/matview.e16.ts:30  matNow = MAT_LINE
  sw zero, 0x0978(zero)
.return:
  ret

; sci/matview.e16.ts:34 matAnswered() at -O1
matAnswered:
  ; sci/matview.e16.ts:35  return matrixAnswer
  lw a0, 0x0974(zero)
.return:
  ret

; sci/matview.e16.ts:38 openGrid(k/m) at -O1
;   k/m in s1
openGrid:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/m
  ; sci/matview.e16.ts:39  editing = k
  sw s1, 0x097a(zero)
  ; sci/matview.e16.ts:40  const m = matrixAt(k)
  mv a0, s1
  la t0, matrixAt
  li t1, 9
  call far_call
  mv s1, a0 ; k/m
  ; sci/matview.e16.ts:41  gridOpenMatrix(m, mRows(m), mCols(m))
  mv a0, s1
  la t0, mRows
  li t1, 9
  call far_call
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  la t0, mCols
  li t1, 9
  call far_call
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  mv a0, s1
  la t0, gridOpenMatrix
  li t1, 9
  call far_call
  ; sci/matview.e16.ts:42  matNow = MAT_GRID
  li t0, 2
  sw t0, 0x0978(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/matview.e16.ts:46 matKey(k/d, shift/m) at -O1
;   k/d in s1
;   shift/m in s2
matKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/d
  mv s2, a1 ; shift/m
  ; sci/matview.e16.ts:47  if (matNow === MAT_GRID) {
  lw t0, 0x0978(zero)
  li t1, 2
  bne t0, t1, .L1
  ; sci/matview.e16.ts:48  if (gridKey(k, shift) !== GRID_STAY) matNow = MAT_LINE
  mv a0, s1
  mv a1, s2
  la t0, gridKey
  li t1, 9
  call far_call
  beq a0, zero, .L2
  ; sci/matview.e16.ts:48  matNow = MAT_LINE
  sw zero, 0x0978(zero)
.L2:
  ; sci/matview.e16.ts:49  return
  j .return
.L1:
  ; sci/matview.e16.ts:51  if (k === K_AC) {
  li t0, 5
  bne s1, t0, .L3
  ; sci/matview.e16.ts:52  matNow = MAT_LINE
  sw zero, 0x0978(zero)
  ; sci/matview.e16.ts:53  return
  j .return
.L3:
  ; sci/matview.e16.ts:55  const m = matrixAt(editing)
  lw a0, 0x097a(zero)
  la t0, matrixAt
  li t1, 9
  call far_call
  mv s2, a0 ; shift/m
  ; sci/matview.e16.ts:56  if (k === K_EQ && rowsAsked === 0 && mRows(m) !== 0) {
  li t0, 4
  bne s1, t0, .L4
  lw t0, 0x097c(zero)
  bne t0, zero, .L4
  mv a0, s2
  la t0, mRows
  li t1, 9
  call far_call
  beq a0, zero, .L4
  ; sci/matview.e16.ts:57  openGrid(editing)
  lw a0, 0x097a(zero)
  call openGrid
  ; sci/matview.e16.ts:58  return
  j .return
.L4:
  ; sci/matview.e16.ts:60  const d = digitOf(k)
  mv a0, s1
  call digitOf
  mv s1, a0 ; k/d
  ; sci/matview.e16.ts:61  if (d < 1 || d > 3) {
  li t0, 1
  bltu s1, t0, .L6
  li t0, 3
  bgeu t0, s1, .L5
.L6:
  ; sci/matview.e16.ts:62  refuse()
  call refuse
  ; sci/matview.e16.ts:63  return
  j .return
.L5:
  ; sci/matview.e16.ts:65  if (rowsAsked === 0) {
  lw t0, 0x097c(zero)
  bne t0, zero, .L7
  ; sci/matview.e16.ts:66  rowsAsked = d
  sw s1, 0x097c(zero)
  ; sci/matview.e16.ts:67  return
  j .return
.L7:
  ; sci/matview.e16.ts:69  resize(m, rowsAsked, d)
  lw a1, 0x097c(zero)
  mv a0, s2
  mv a2, s1
  call resize
  ; sci/matview.e16.ts:70  openGrid(editing)
  lw a0, 0x097a(zero)
  call openGrid
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/matview.e16.ts:74 resize(m, r, c) at -O1
;   m in s3
;   r in s0
;   c in 0(sp)
;   i in s1
;   j in s2
resize:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  mv s3, a0 ; m
  mv s0, a1 ; r
  sw a2, 0(sp) ; c
  ; sci/matview.e16.ts:75  for (let i: u16 = 0; i < 3; i++) {
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/matview.e16.ts:76  for (let j: u16 = 0; j < 3; j++) {
  li s2, 0 ; j
  j .L7
.L5:
  ; sci/matview.e16.ts:77  if (i >= r || j >= c || i >= mRows(m) || j >= mCols(m)) wholeInto(el(m, i, j), 0)
  bgeu s1, s0, .L10
  lw t0, 0(sp) ; c
  bgeu s2, t0, .L10
  mv a0, s3
  la t0, mRows
  li t1, 9
  call far_call
  bgeu s1, a0, .L10
  mv a0, s3
  la t0, mCols
  li t1, 9
  call far_call
  bltu s2, a0, .L9
.L10:
  ; sci/matview.e16.ts:77  wholeInto(el(m, i, j), 0)
  mv a0, s3
  mv a1, s1
  mv a2, s2
  la t0, el
  li t1, 9
  call far_call
  li a1, 0
  call wholeInto
.L9:
  addi s2, s2, 1
.L7:
  li t0, 3
  bltu s2, t0, .L5
  addi s1, s1, 1
.L3:
  li t0, 3
  bltu s1, t0, .L1
  ; sci/matview.e16.ts:80  poke(m, r)
  sb s0, 0(s3)
  ; sci/matview.e16.ts:81  poke(m + 1, c)
  lw t0, 0(sp) ; c
  sb t0, 1(s3)
.return:
  lw ra, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  addi sp, sp, 12
  ret

; sci/matview.e16.ts:87 matDraw() at -O1
matDraw:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/matview.e16.ts:88  bandWith(matName(editing), 0)
  lw a0, 0x097a(zero)
  call matName
  li a1, 0
  call bandWith
  ; sci/matview.e16.ts:89  if (matNow === MAT_GRID) {
  lw t0, 0x0978(zero)
  li t1, 2
  bne t0, t1, .L1
  ; sci/matview.e16.ts:90  gridDraw()
  la t0, gridDraw
  li t1, 9
  call far_call
  ; sci/matview.e16.ts:91  return
  j .return
.L1:
  ; sci/matview.e16.ts:93  textAt(str('ROWS? 1-3'), 1, lineY(0))
  la a0, str_206
  li a1, 1
  li a2, 11
  call textAt
  ; sci/matview.e16.ts:94  if (rowsAsked !== 0) {
  lw t0, 0x097c(zero)
  beq t0, zero, .L2
  ; sci/matview.e16.ts:95  sizeText[0] = 0x30 + rowsAsked
  lw t0, 0x097c(zero)
  addi t0, t0, 48
  sb t0, sizeText(zero)
  ; sci/matview.e16.ts:96  sizeText[1] = 0
  sb zero, sizeText+1(zero)
  ; sci/matview.e16.ts:97  textAt(addr(sizeText), 49, lineY(0))
  la a0, sizeText
  li a1, 49
  li a2, 11
  call textAt
  ; sci/matview.e16.ts:98  textAt(str('COLS? 1-3'), 1, lineY(1))
  la a0, str_207
  li a1, 1
  li a2, 20
  call textAt
.L2:
  ; sci/matview.e16.ts:100  textAt(str('=:AS IT IS AC:BACK'), 1, lineY(5))
  la a0, str_208
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/matview.e16.ts:103 matName(k) at -O1
;   k in a0
matName:
  ; sci/matview.e16.ts:104  if (k === 0) return str('MatA')
  bne a0, zero, .L1
  ; sci/matview.e16.ts:104  return str('MatA')
  la a0, str_209
  ret
.L1:
  ; sci/matview.e16.ts:105  if (k === 1) return str('MatB')
  li t0, 1
  bne a0, t0, .L2
  ; sci/matview.e16.ts:105  return str('MatB')
  la a0, str_210
  ret
.L2:
  ; sci/matview.e16.ts:106  if (k === 2) return str('MatC')
  li t0, 2
  bne a0, t0, .L3
  ; sci/matview.e16.ts:106  return str('MatC')
  la a0, str_211
  ret
.L3:
  ; sci/matview.e16.ts:107  if (k === 3) return str('MatD')
  li t0, 3
  bne a0, t0, .L4
  ; sci/matview.e16.ts:107  return str('MatD')
  la a0, str_212
  ret
.L4:
  ; sci/matview.e16.ts:108  return str('MatAns')
  la a0, str_213
.return:
  ret

; sci/matview.e16.ts:114 matFuncScreen() at -O1
matFuncScreen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/matview.e16.ts:115  matFuncPage = 0
  sw zero, 0x0980(zero)
  ; sci/matview.e16.ts:116  drawMatFunc()
  call drawMatFunc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/matview.e16.ts:119 drawMatFunc() at -O1
drawMatFunc:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/matview.e16.ts:120  cls()
  call cls
  ; sci/matview.e16.ts:121  if (matFuncPage === 0) bandWith(str('FUNC'), str('1/3'))
  lw t0, 0x0980(zero)
  bne t0, zero, .L1
  ; sci/matview.e16.ts:121  bandWith(str('FUNC'), str('1/3'))
  la a0, str_214
  la a1, str_215
  call bandWith
  j .L2
.L1:
  ; sci/matview.e16.ts:122  if (matFuncPage === 1) bandWith(str('FUNC'), str('2/3'))
  lw t0, 0x0980(zero)
  li t1, 1
  bne t0, t1, .L3
  ; sci/matview.e16.ts:122  bandWith(str('FUNC'), str('2/3'))
  la a0, str_214
  la a1, str_216
  call bandWith
  j .L4
.L3:
  ; sci/matview.e16.ts:123  bandWith(str('FUNC EDIT'), str('3/3'))
  la a0, str_217
  la a1, str_218
  call bandWith
.L4:
.L2:
  ; sci/matview.e16.ts:124  if (matFuncPage === 1) {
  lw t0, 0x0980(zero)
  li t1, 1
  bne t0, t1, .L5
  ; sci/matview.e16.ts:125  textAt(str('1:det(   2:trn('), 1, lineY(0))
  la a0, str_219
  li a1, 1
  li a2, 11
  call textAt
  ; sci/matview.e16.ts:126  textAt(str('3:dot(   4:cross('), 1, lineY(1))
  la a0, str_220
  li a1, 1
  li a2, 20
  call textAt
  ; sci/matview.e16.ts:127  textAt(str('5:angle('), 1, lineY(2))
  la a0, str_221
  li a1, 1
  li a2, 29
  call textAt
  j .L6
.L5:
  ; sci/matview.e16.ts:129  textAt(str('1:MatA   2:MatB'), 1, lineY(0))
  la a0, str_222
  li a1, 1
  li a2, 11
  call textAt
  ; sci/matview.e16.ts:130  textAt(str('3:MatC   4:MatD'), 1, lineY(1))
  la a0, str_223
  li a1, 1
  li a2, 20
  call textAt
  ; sci/matview.e16.ts:131  if (matFuncPage === 0) textAt(str('5:MatAns'), 1, lineY(2))
  lw t0, 0x0980(zero)
  bne t0, zero, .L7
  ; sci/matview.e16.ts:131  textAt(str('5:MatAns'), 1, lineY(2))
  la a0, str_224
  li a1, 1
  li a2, 29
  call textAt
.L7:
.L6:
  ; sci/matview.e16.ts:133  textAt(str('\x8d\x8e:PAGE AC:BACK'), 1, lineY(5))
  la a0, str_225
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/matview.e16.ts:137 matFuncKey(k/d) at -O1
;   k/d in s1
matFuncKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/d
  ; sci/matview.e16.ts:138  if (k === K_AC) return 1
  li t0, 5
  bne s1, t0, .L1
  ; sci/matview.e16.ts:138  return 1
  li a0, 1
  j .return
.L1:
  ; sci/matview.e16.ts:139  if (k === K_DOWN || k === K_UP) {
  li t0, 1
  beq s1, t0, .L3
  bne s1, zero, .L2
.L3:
  ; sci/matview.e16.ts:140  turnMatPage(k === K_DOWN)
  li t0, 1
  sub t0, s1, t0
  seqz a0, t0
  call turnMatPage
  ; sci/matview.e16.ts:141  return 0
  li a0, 0
  j .return
.L2:
  ; sci/matview.e16.ts:143  const d = digitOf(k)
  mv a0, s1
  call digitOf
  mv s1, a0 ; k/d
  ; sci/matview.e16.ts:145  if (d < 1 || d > 5 || (d === 5 && matFuncPage === 2)) {
  li t0, 1
  bltu s1, t0, .L5
  li t0, 5
  bltu t0, s1, .L5
  li t0, 5
  bne s1, t0, .L4
  lw t0, 0x0980(zero)
  li t1, 2
  bne t0, t1, .L4
.L5:
  ; sci/matview.e16.ts:146  refuse()
  call refuse
  ; sci/matview.e16.ts:147  return 0
  li a0, 0
  j .return
.L4:
  ; sci/matview.e16.ts:149  if (matFuncPage === 0) return T_MAT + d - 1
  lw t0, 0x0980(zero)
  bne t0, zero, .L6
  ; sci/matview.e16.ts:149  return T_MAT + d - 1
  addi a0, s1, 176
  j .return
.L6:
  ; sci/matview.e16.ts:150  if (matFuncPage === 1) return T_DET + d - 1
  lw t0, 0x0980(zero)
  li t1, 1
  bne t0, t1, .L7
  ; sci/matview.e16.ts:150  return T_DET + d - 1
  addi a0, s1, 166
  j .return
.L7:
  ; sci/matview.e16.ts:151  editing = d - 1
  addi t0, s1, -1
  sw t0, 0x097a(zero)
  ; sci/matview.e16.ts:152  rowsAsked = 0
  sw zero, 0x097c(zero)
  ; sci/matview.e16.ts:153  matNow = MAT_DIMS
  li t0, 1
  sw t0, 0x0978(zero)
  ; sci/matview.e16.ts:154  return 0xff
  li a0, 255
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/matview.e16.ts:157 turnMatPage(down) at -O1
;   down in s1
turnMatPage:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; down
  ; sci/matview.e16.ts:158  if (down && matFuncPage < 2) matFuncPage++
  beqz s1, .L1
  lw t0, 0x0980(zero)
  li t1, 2
  bgeu t0, t1, .L1
  ; sci/matview.e16.ts:158  matFuncPage++
  lw t0, 0x0980(zero)
  addi t0, t0, 1
  sw t0, 0x0980(zero)
  j .L2
.L1:
  ; sci/matview.e16.ts:159  if (!down && matFuncPage > 0) matFuncPage--
  bnez s1, .L3
  lw t0, 0x0980(zero)
  bgeu zero, t0, .L3
  ; sci/matview.e16.ts:159  matFuncPage--
  lw t0, 0x0980(zero)
  addi t0, t0, -1
  sw t0, 0x0980(zero)
  j .L4
.L3:
  ; sci/matview.e16.ts:160  refuse()
  call refuse
.L4:
.L2:
  ; sci/matview.e16.ts:161  drawMatFunc()
  call drawMatFunc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

str_206:
  .byte 82, 79, 87, 83, 63, 32, 49, 45, 51, 0
str_207:
  .byte 67, 79, 76, 83, 63, 32, 49, 45, 51, 0
str_208:
  .byte 61, 58, 65, 83, 32, 73, 84, 32, 73, 83, 32, 65, 67, 58, 66, 65, 67, 75, 0
str_209:
  .byte 77, 97, 116, 65, 0
str_210:
  .byte 77, 97, 116, 66, 0
str_211:
  .byte 77, 97, 116, 67, 0
str_212:
  .byte 77, 97, 116, 68, 0
str_213:
  .byte 77, 97, 116, 65, 110, 115, 0
str_214:
  .byte 70, 85, 78, 67, 0
str_215:
  .byte 49, 47, 51, 0
str_216:
  .byte 50, 47, 51, 0
str_217:
  .byte 70, 85, 78, 67, 32, 69, 68, 73, 84, 0
str_218:
  .byte 51, 47, 51, 0
str_219:
  .byte 49, 58, 100, 101, 116, 40, 32, 32, 32, 50, 58, 116, 114, 110, 40, 0
str_220:
  .byte 51, 58, 100, 111, 116, 40, 32, 32, 32, 52, 58, 99, 114, 111, 115, 115, 40, 0
str_221:
  .byte 53, 58, 97, 110, 103, 108, 101, 40, 0
str_222:
  .byte 49, 58, 77, 97, 116, 65, 32, 32, 32, 50, 58, 77, 97, 116, 66, 0
str_223:
  .byte 51, 58, 77, 97, 116, 67, 32, 32, 32, 52, 58, 77, 97, 116, 68, 0
str_224:
  .byte 53, 58, 77, 97, 116, 65, 110, 115, 0
str_225:
  .byte 141, 142, 58, 80, 65, 71, 69, 32, 65, 67, 58, 66, 65, 67, 75, 0
  .align 2

  .bank 5
  .org 0xc000
; sci/display.e16.ts:101 hasForm() at -O1
hasForm:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:102  if (!isExact(KEEP_ANS)) return false
  li a0, 3080
  call isExact
  bnez a0, .L1
  ; sci/display.e16.ts:102  return false
  li a0, 0
  j .return
.L1:
  ; sci/display.e16.ts:103  return !isZero(KEEP_ANS + V_R) || !isOne(KEEP_ANS + V_Q)
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

; sci/display.e16.ts:107 mixable() at -O1
mixable:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:108  if (!hasForm() || !isZero(KEEP_ANS + V_R)) return false
  call hasForm
  beqz a0, .L2
  li a0, 3100
  call isZero
  bnez a0, .L1
.L2:
  ; sci/display.e16.ts:108  return false
  li a0, 0
  j .return
.L1:
  ; sci/display.e16.ts:109  copy(KEEP_ANS + V_P, addr(scratch))
  li a0, 3092
  la a1, scratch
  call copy
  ; sci/display.e16.ts:110  math(M_ABS, addr(scratch), 0, 0)
  li a0, 17
  la a1, scratch
  li a2, 0
  li a3, 0
  call math
  ; sci/display.e16.ts:111  math(M_SUB, addr(scratch), KEEP_ANS + V_Q, 0)
  li a0, 2
  la a1, scratch
  li a2, 3108
  li a3, 0
  call math
  ; sci/display.e16.ts:112  return !isNegative(addr(scratch)) && !isZero(addr(scratch))
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

; sci/display.e16.ts:119 pairLine(at, length) at -O1
;   at in 0(sp)
;   length in s0
;   first/depth in s1
;   i in s2
;   t in s3
pairLine:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw a0, 0(sp) ; at
  mv s0, a1 ; length
  ; sci/display.e16.ts:120  const first = peek(at)
  lw t0, 0(sp) ; at
  lbu s1, 0(t0)
  ; sci/display.e16.ts:121  if (length === 0 || (first !== T_POL && first !== T_REC)) return false
  beq s0, zero, .L2
  li t0, 235
  beq s1, t0, .L1
  li t0, 236
  beq s1, t0, .L1
.L2:
  ; sci/display.e16.ts:121  return false
  li a0, 0
  j .return
.L1:
  ; sci/display.e16.ts:122  let depth: u16 = 1
  li s1, 1 ; first/depth
  ; sci/display.e16.ts:123  for (let i: u16 = 1; i < length; i++) {
  li s2, 1 ; i
  j .L5
.L3:
  ; sci/display.e16.ts:124  const t = peek(at + i)
  lw t0, 0(sp) ; at
  add t0, t0, s2
  lbu s3, 0(t0)
  ; sci/display.e16.ts:125  if (t === T_CLOSE) depth--
  li t0, 41
  bne s3, t0, .L7
  ; sci/display.e16.ts:125  depth--
  addi s1, s1, -1
  j .L8
.L7:
  ; sci/display.e16.ts:126  if (t === T_OPEN || t === T_POW || isFunction(t)) depth++
  li t0, 40
  beq s3, t0, .L10
  li t0, 17
  beq s3, t0, .L10
  mv a0, s3
  call isFunction
  beqz a0, .L9
.L10:
  ; sci/display.e16.ts:126  depth++
  addi s1, s1, 1
.L9:
.L8:
  ; sci/display.e16.ts:127  if (depth === 0) return i === length - 1
  bne s1, zero, .L11
  ; sci/display.e16.ts:127  return i === length - 1
  addi t0, s0, -1
  sub t0, s2, t0
  seqz a0, t0
  j .return
.L11:
  addi s2, s2, 1
.L5:
  bltu s2, s0, .L3
  ; sci/display.e16.ts:129  return true
  li a0, 1
.return:
  lw ra, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  addi sp, sp, 12
  ret

; sci/display.e16.ts:133 firstShown(form) at -O1
;   form in s1
firstShown:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; form
  ; sci/display.e16.ts:134  if (!form || !hasForm()) return SHOW_DECIMAL
  beqz s1, .L2
  call hasForm
  bnez a0, .L1
.L2:
  ; sci/display.e16.ts:134  return SHOW_DECIMAL
  li a0, 0
  j .return
.L1:
  ; sci/display.e16.ts:135  if (peek(KEEP_MIXED) !== 0 && mixable()) return SHOW_MIXED
  lbu t0, 3079(zero)
  beq t0, zero, .L3
  call mixable
  beqz a0, .L3
  ; sci/display.e16.ts:135  return SHOW_MIXED
  li a0, 2
  j .return
.L3:
  ; sci/display.e16.ts:136  return SHOW_FORM
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:140 nextShown(shown) at -O1
;   shown in s1
nextShown:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; shown
  ; sci/display.e16.ts:141  if (shown === SHOW_FORM) return mixable() ? SHOW_MIXED : SHOW_DECIMAL
  li t0, 1
  bne s1, t0, .L1
  ; sci/display.e16.ts:141  return mixable() ? SHOW_MIXED : SHOW_DECIMAL
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
  ; sci/display.e16.ts:142  if (shown === SHOW_MIXED) return SHOW_DECIMAL
  li t0, 2
  bne s1, t0, .L4
  ; sci/display.e16.ts:142  return SHOW_DECIMAL
  li a0, 0
  j .return
.L4:
  ; sci/display.e16.ts:143  return SHOW_FORM
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:149 drawAnswerAs(shown) at -O1
;   shown in s1
drawAnswerAs:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; shown
  ; sci/display.e16.ts:150  if (shown === SHOW_FORM) drawForm()
  li t0, 1
  bne s1, t0, .L1
  ; sci/display.e16.ts:150  drawForm()
  call drawForm
  j .L2
.L1:
  ; sci/display.e16.ts:151  if (shown === SHOW_MIXED) showMixed()
  li t0, 2
  bne s1, t0, .L3
  ; sci/display.e16.ts:151  showMixed()
  call showMixed
  j .L4
.L3:
  ; sci/display.e16.ts:152  if (shown === SHOW_DMS) drawDms()
  li t0, 4
  bne s1, t0, .L5
  ; sci/display.e16.ts:152  drawDms()
  call drawDms
  j .L6
.L5:
  ; sci/display.e16.ts:153  if (shown === SHOW_PAIR) drawPair()
  li t0, 5
  bne s1, t0, .L7
  ; sci/display.e16.ts:153  drawPair()
  call drawPair
  j .L8
.L7:
  ; sci/display.e16.ts:155  if (shown === SHOW_ENG) engText(KEEP_ANS)
  li t0, 3
  bne s1, t0, .L9
  ; sci/display.e16.ts:155  engText(KEEP_ANS)
  li a0, 3080
  call engText
  j .L10
.L9:
  ; sci/display.e16.ts:156  decimalText(KEEP_ANS)
  li a0, 3080
  call decimalText
.L10:
  ; sci/display.e16.ts:157  drawDecimal()
  call drawDecimal
  ; sci/display.e16.ts:158  if (shown === SHOW_FOUND) drawFound()
  li t0, 6
  bne s1, t0, .L11
  ; sci/display.e16.ts:158  drawFound()
  call drawFound
.L11:
  ; sci/display.e16.ts:159  if (shown === SHOW_CONV) textAt(convLabel(), 1, 40)
  li t0, 7
  bne s1, t0, .L12
  ; sci/display.e16.ts:159  textAt(convLabel(), 1, 40)
  la t0, convLabel
  li t1, 10
  call far_call
  li a1, 1
  li a2, 40
  call textAt
.L12:
.L8:
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:164 drawBig(v) at -O1
;   v in s1
drawBig:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/display.e16.ts:165  decimalText(v)
  mv a0, s1
  call decimalText
  ; sci/display.e16.ts:166  drawDecimal()
  call drawDecimal
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:170 drawDecimal() at -O1
;   mantissa in s2
;   i/right/exponent in s1
;   digits/x in s3
drawDecimal:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  ; sci/display.e16.ts:171  let mantissa = textLength
  lw s2, 0x06f4(zero)
  ; sci/display.e16.ts:172  for (let i: u16 = 0; i < textLength; i++) {
  li s1, 0 ; i/right/exponent
  j .L3
.L1:
  ; sci/display.e16.ts:173  if (text[i] === 0x45) mantissa = i
  lbu t0, text(s1)
  li t1, 69
  bne t0, t1, .L5
  ; sci/display.e16.ts:173  mantissa = i
  mv s2, s1 ; mantissa
.L5:
  addi s1, s1, 1
.L3:
  lw t0, 0x06f4(zero)
  bltu s1, t0, .L1
  ; sci/display.e16.ts:175  let right: u16 = 127
  li s1, 127 ; i/right/exponent
  ; sci/display.e16.ts:176  if (mantissa < textLength) {
  lw t0, 0x06f4(zero)
  bgeu s2, t0, .L6
  ; sci/display.e16.ts:177  const exponent = addr(text) + mantissa + 1
  addi s1, s2, text+1
  ; sci/display.e16.ts:178  const digits = textLength - mantissa - 1
  lw t0, 0x06f4(zero)
  sub t0, t0, s2
  addi s3, t0, -1
  ; sci/display.e16.ts:179  const x = 128 - digits * 6
  slli t1, s3, 2
  slli t0, s3, 1
  add t0, t0, t1
  li t1, 128
  sub s3, t1, t0
  ; sci/display.e16.ts:180  textAt(exponent, x, 48)
  mv a0, s1
  mv a1, s3
  li a2, 48
  call textAt
  ; sci/display.e16.ts:181  textAt(str('\x8110'), x - 18, 55)
  la a0, str_94
  addi a1, s3, -18
  li a2, 55
  call textAt
  ; sci/display.e16.ts:182  right = x - 19
  addi s1, s3, -19
.L6:
  ; sci/display.e16.ts:184  bigNumber(addr(text), mantissa, right)
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

; sci/display.e16.ts:188 drawPair() at -O1
drawPair:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:189  textAt(str('X='), 1, 46)
  la a0, str_95
  li a1, 1
  li a2, 46
  call textAt
  ; sci/display.e16.ts:190  decimalText(varAt(0x58))
  li a0, 3336
  call decimalText
  ; sci/display.e16.ts:191  textRight(addr(text), 46)
  la a0, text
  li a1, 46
  call textRight
  ; sci/display.e16.ts:192  textAt(str('Y='), 1, 55)
  la a0, str_96
  li a1, 1
  li a2, 55
  call textAt
  ; sci/display.e16.ts:193  decimalText(varAt(0x59))
  li a0, 3372
  call decimalText
  ; sci/display.e16.ts:194  textRight(addr(text), 55)
  la a0, text
  li a1, 55
  call textRight
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/display.e16.ts:198 drawFound() at -O1
drawFound:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:199  textAt(str('X='), 1, 55)
  la a0, str_95
  li a1, 1
  li a2, 55
  call textAt
  ; sci/display.e16.ts:200  textAt(str('DIFF='), 1, 37)
  la a0, str_97
  li a1, 1
  li a2, 37
  call textAt
  ; sci/display.e16.ts:201  decimalText(addr(diffValue))
  la a0, diffValue
  call decimalText
  ; sci/display.e16.ts:202  textRight(addr(text), 37)
  la a0, text
  li a1, 37
  call textRight
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/display.e16.ts:206 drawDms() at -O1
drawDms:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:207  dmsText(KEEP_ANS)
  li a0, 3080
  call dmsText
  ; sci/display.e16.ts:208  textRight(addr(text), 55)
  la a0, text
  li a1, 55
  call textRight
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/display.e16.ts:214 drawForm() at -O1
drawForm:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:215  answerLength = 0
  sw zero, 0x074e(zero)
  ; sci/display.e16.ts:216  formTokens(KEEP_ANS)
  li a0, 3080
  call formTokens
  ; sci/display.e16.ts:217  setAnswer(addr(answerTokens), answerLength)
  lw a1, 0x074e(zero)
  la a0, answerTokens
  la t0, setAnswer
  li t1, 3
  call far_call
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/display.e16.ts:221 formTokens(v/q) at -O1
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
  ; sci/display.e16.ts:222  const p = v + V_P
  addi s3, s1, 12
  ; sci/display.e16.ts:223  const r = v + V_R
  addi s2, s1, 20
  ; sci/display.e16.ts:224  const q = v + V_Q
  addi s1, s1, 28
  ; sci/display.e16.ts:225  const fractionOf = !isOne(q)
  mv a0, s1
  call isOne
  seqz t0, a0
  sw t0, 0(sp) ; fractionOf
  ; sci/display.e16.ts:226  const oneTerm = isZero(p) || isZero(r)
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
  ; sci/display.e16.ts:228  const signOut = oneTerm && fractionOf && (isZero(r) ? isNegative(p) : isNegative(r))
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
  ; sci/display.e16.ts:229  if (signOut) answerToken(T_MINUS)
  beqz s0, .L6
  ; sci/display.e16.ts:229  answerToken(T_MINUS)
  li a0, 45
  call answerToken
.L6:
  ; sci/display.e16.ts:230  if (fractionOf) answerToken(T_FRAC)
  lw t0, 0(sp) ; fractionOf
  beqz t0, .L7
  ; sci/display.e16.ts:230  answerToken(T_FRAC)
  li a0, 22
  call answerToken
.L7:
  ; sci/display.e16.ts:231  if (!isZero(p) || isZero(r)) answerNumber(p, signOut)
  mv a0, s3
  call isZero
  beqz a0, .L9
  mv a0, s2
  call isZero
  beqz a0, .L8
.L9:
  ; sci/display.e16.ts:231  answerNumber(p, signOut)
  mv a0, s3
  mv a1, s0
  call answerNumber
.L8:
  ; sci/display.e16.ts:232  if (!isZero(r)) answerRoot(p, r, signOut)
  mv a0, s2
  call isZero
  bnez a0, .L10
  ; sci/display.e16.ts:232  answerRoot(p, r, signOut)
  mv a0, s3
  mv a1, s2
  mv a2, s0
  call answerRoot
.L10:
  ; sci/display.e16.ts:233  if (fractionOf) {
  lw t0, 0(sp) ; fractionOf
  beqz t0, .L11
  ; sci/display.e16.ts:234  answerToken(T_SEP)
  li a0, 23
  call answerToken
  ; sci/display.e16.ts:235  answerNumber(q, false)
  mv a0, s1
  li a1, 0
  call answerNumber
  ; sci/display.e16.ts:236  answerToken(T_END)
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

; sci/display.e16.ts:241 formOf(v) at -O1
;   v in s1
formOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/display.e16.ts:242  return isExact(v) && (!isZero(v + V_R) || !isOne(v + V_Q))
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

; sci/display.e16.ts:249 drawValueAt(v, foot, twoD) at -O1
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
  ; sci/display.e16.ts:250  if (twoD && formOf(v)) {
  beqz s3, .L1
  mv a0, s1
  call formOf
  beqz a0, .L1
  ; sci/display.e16.ts:251  answerLength = 0
  sw zero, 0x074e(zero)
  ; sci/display.e16.ts:252  formTokens(v)
  mv a0, s1
  call formTokens
  ; sci/display.e16.ts:253  setTokensAt(addr(answerTokens), answerLength, foot)
  lw a1, 0x074e(zero)
  la a0, answerTokens
  mv a2, s2
  la t0, setTokensAt
  li t1, 3
  call far_call
  ; sci/display.e16.ts:254  return
  j .return
.L1:
  ; sci/display.e16.ts:256  decimalText(v)
  mv a0, s1
  call decimalText
  ; sci/display.e16.ts:257  textRight(addr(text), foot - 7)
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

; sci/display.e16.ts:264 drawComplexAt(re, im, minus, foot) at -O1
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
  ; sci/display.e16.ts:265  answerLength = 0
  sw zero, 0x074e(zero)
  ; sci/display.e16.ts:266  const exact = isExact(re) && isExact(im)
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
  ; sci/display.e16.ts:267  if (!isZero(re)) {
  mv a0, s1
  call isZero
  bnez a0, .L2
  ; sci/display.e16.ts:268  if (exact) formTokens(re)
  beqz s3, .L3
  ; sci/display.e16.ts:268  formTokens(re)
  mv a0, s1
  call formTokens
  j .L4
.L3:
  ; sci/display.e16.ts:269  shortNumber(re)
  mv a0, s1
  call shortNumber
.L4:
.L2:
  ; sci/display.e16.ts:271  if (minus) answerToken(T_MINUS)
  beqz s0, .L5
  ; sci/display.e16.ts:271  answerToken(T_MINUS)
  li a0, 45
  call answerToken
  j .L6
.L5:
  ; sci/display.e16.ts:272  if (!isZero(re)) answerToken(T_PLUS)
  mv a0, s1
  call isZero
  bnez a0, .L7
  ; sci/display.e16.ts:272  answerToken(T_PLUS)
  li a0, 43
  call answerToken
.L7:
.L6:
  ; sci/display.e16.ts:273  if (!exact || !isOne(im)) {
  beqz s3, .L9
  mv a0, s2
  call isOne
  bnez a0, .L8
.L9:
  ; sci/display.e16.ts:274  if (exact) formTokens(im)
  beqz s3, .L10
  ; sci/display.e16.ts:274  formTokens(im)
  mv a0, s2
  call formTokens
  j .L11
.L10:
  ; sci/display.e16.ts:275  shortNumber(im)
  mv a0, s2
  call shortNumber
.L11:
.L8:
  ; sci/display.e16.ts:277  answerToken(0x69)
  li a0, 105
  call answerToken
  ; sci/display.e16.ts:278  setTokensAt(addr(answerTokens), answerLength, foot)
  lw a1, 0x074e(zero)
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

; sci/display.e16.ts:282 shortNumber(v/i) at -O1
;   v/i in s1
shortNumber:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v/i
  ; sci/display.e16.ts:283  format(v, 6)
  mv a0, s1
  li a1, 6
  call format
  ; sci/display.e16.ts:284  for (let i: u16 = 0; i < textLength; i++) answerToken(text[i] === 0x2d ? T_MINUS : text[i])
  li s1, 0 ; v/i
  j .L3
.L1:
  ; sci/display.e16.ts:284  answerToken(text[i] === 0x2d ? T_MINUS : text[i])
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
  lw t0, 0x06f4(zero)
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:288 showMixed() at -O1
showMixed:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/display.e16.ts:289  answerLength = 0
  sw zero, 0x074e(zero)
  ; sci/display.e16.ts:290  const p = KEEP_ANS + V_P
  ; sci/display.e16.ts:291  const q = KEEP_ANS + V_Q
  ; sci/display.e16.ts:292  if (isNegative(p)) answerToken(T_MINUS)
  li a0, 3092
  call isNegative
  beqz a0, .L1
  ; sci/display.e16.ts:292  answerToken(T_MINUS)
  li a0, 45
  call answerToken
.L1:
  ; sci/display.e16.ts:293  copy(p, addr(scratch))
  li a0, 3092
  la a1, scratch
  call copy
  ; sci/display.e16.ts:294  math(M_ABS, addr(scratch), 0, 0)
  li a0, 17
  la a1, scratch
  li a2, 0
  li a3, 0
  call math
  ; sci/display.e16.ts:295  copy(addr(scratch), addr(spare))
  la a0, scratch
  la a1, spare
  call copy
  ; sci/display.e16.ts:296  math(M_IDIV, addr(scratch), q, 0)
  li a0, 8
  la a1, scratch
  li a2, 3108
  li a3, 0
  call math
  ; sci/display.e16.ts:297  math(M_MOD, addr(spare), q, 0)
  li a0, 9
  la a1, spare
  li a2, 3108
  li a3, 0
  call math
  ; sci/display.e16.ts:298  answerToken(T_MIXED)
  li a0, 28
  call answerToken
  ; sci/display.e16.ts:299  answerNumber(addr(scratch), true)
  la a0, scratch
  li a1, 1
  call answerNumber
  ; sci/display.e16.ts:300  answerToken(T_MSEP)
  li a0, 29
  call answerToken
  ; sci/display.e16.ts:301  answerNumber(addr(spare), true)
  la a0, spare
  li a1, 1
  call answerNumber
  ; sci/display.e16.ts:302  answerToken(T_MDIV)
  li a0, 31
  call answerToken
  ; sci/display.e16.ts:303  answerNumber(q, true)
  li a0, 3108
  li a1, 1
  call answerNumber
  ; sci/display.e16.ts:304  answerToken(T_END)
  li a0, 24
  call answerToken
  ; sci/display.e16.ts:305  setAnswer(addr(answerTokens), answerLength)
  lw a1, 0x074e(zero)
  la a0, answerTokens
  la t0, setAnswer
  li t1, 3
  call far_call
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/display.e16.ts:309 answerRoot(p, r, signOut) at -O1
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
  ; sci/display.e16.ts:311  const s = peek16(r - V_R + V_S)
  lw s2, -10(s1)
  ; sci/display.e16.ts:312  if (!isZero(p)) answerToken(isNegative(r) ? T_MINUS : T_PLUS)
  mv a0, s3
  call isZero
  bnez a0, .L1
  ; sci/display.e16.ts:312  answerToken(isNegative(r) ? T_MINUS : T_PLUS)
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
  ; sci/display.e16.ts:313  if (isNegative(r) && !signOut) answerToken(T_MINUS)
  mv a0, s1
  call isNegative
  beqz a0, .L5
  bnez s0, .L5
  ; sci/display.e16.ts:313  answerToken(T_MINUS)
  li a0, 45
  call answerToken
.L5:
.L4:
  ; sci/display.e16.ts:314  if (!isOne(r) && !isMinusOne(r)) answerNumber(r, true)
  mv a0, s1
  call isOne
  bnez a0, .L6
  mv a0, s1
  call isMinusOne
  bnez a0, .L6
  ; sci/display.e16.ts:314  answerNumber(r, true)
  mv a0, s1
  li a1, 1
  call answerNumber
.L6:
  ; sci/display.e16.ts:315  answerToken(T_ROOT)
  li a0, 25
  call answerToken
  ; sci/display.e16.ts:316  if (s >= 10) answerToken(0x30 + div(s, 10))
  li t0, 10
  bltu s2, t0, .L7
  ; sci/display.e16.ts:316  answerToken(0x30 + div(s, 10))
  li t1, 52429
  mulhu t0, s2, t1
  srli t0, t0, 3
  addi a0, t0, 48
  call answerToken
.L7:
  ; sci/display.e16.ts:317  answerToken(0x30 + (s % 10))
  li t1, 52429
  mulhu t0, s2, t1
  srli t0, t0, 3
  li t1, 10
  mul t0, t0, t1
  sub t0, s2, t0
  addi a0, t0, 48
  call answerToken
  ; sci/display.e16.ts:318  answerToken(T_END)
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

; sci/display.e16.ts:321 answerToken(t) at -O1
;   t in a0
answerToken:
  ; sci/display.e16.ts:322  if (answerLength < 48) {
  lw t0, 0x074e(zero)
  li t1, 48
  bgeu t0, t1, .L1
  ; sci/display.e16.ts:323  answerTokens[answerLength] = t
  lw t0, 0x074e(zero)
  sb a0, answerTokens(t0)
  ; sci/display.e16.ts:324  answerLength++
  lw t0, 0x074e(zero)
  addi t0, t0, 1
  sw t0, 0x074e(zero)
.L1:
.return:
  ret

; sci/display.e16.ts:329 answerNumber(n/i, bare) at -O1
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
  ; sci/display.e16.ts:330  format(n, 12)
  mv a0, s1
  li a1, 12
  call format
  ; sci/display.e16.ts:331  for (let i: u16 = 0; i < textLength; i++) {
  li s1, 0 ; n/i
  j .L3
.L1:
  ; sci/display.e16.ts:332  const c = text[i]
  lbu s2, text(s1)
  ; sci/display.e16.ts:333  if (c === 0x2d) {
  li t0, 45
  bne s2, t0, .L5
  ; sci/display.e16.ts:334  if (!bare) answerToken(T_MINUS)
  bnez s3, .L7
  ; sci/display.e16.ts:334  answerToken(T_MINUS)
  li a0, 45
  call answerToken
  j .L7
.L5:
  ; sci/display.e16.ts:335  answerToken(c)
  mv a0, s2
  call answerToken
.L7:
  addi s1, s1, 1
.L3:
  lw t0, 0x06f4(zero)
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/display.e16.ts:339 isOne(n) at -O1
;   n in s1
isOne:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; sci/display.e16.ts:340  return peek(n) === 0 && isUnit(n)
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

; sci/display.e16.ts:343 isMinusOne(n) at -O1
;   n in s1
isMinusOne:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; sci/display.e16.ts:344  return peek(n) !== 0 && isUnit(n)
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

; sci/display.e16.ts:348 isUnit(n) at -O1
;   n in a0
isUnit:
  ; sci/display.e16.ts:349  return peek(n + 1) === 0 && peek(n + 2) === 0x10 && peek16(n + 4) === 0 && peek16(n + 6) === 0
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

; sci/display.e16.ts:355 format(v, digits) at -O1
;   v in s1
;   digits in s2
format:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; v
  mv s2, a1 ; digits
  ; sci/display.e16.ts:356  poke16(MATH_ARG, digits)
  li t0, 65366
  sw s2, 0(t0)
  ; sci/display.e16.ts:357  math(M_FORMAT, v, addr(text), 0)
  li a0, 57
  mv a1, s1
  la a2, text
  li a3, 0
  call math
  ; sci/display.e16.ts:358  textLength = peek16(MATH_ARG)
  li t0, 65366
  lw t0, 0(t0)
  sw t0, 0x06f4(zero)
  ; sci/display.e16.ts:359  text[textLength] = 0
  lw t0, 0x06f4(zero)
  sb zero, text(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/display.e16.ts:363 rounded(v, digits) at -O1
;   v in s1
;   digits in s2
rounded:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; v
  mv s2, a1 ; digits
  ; sci/display.e16.ts:364  copy(v, addr(scratch))
  mv a0, s1
  la a1, scratch
  call copy
  ; sci/display.e16.ts:365  poke16(MATH_ARG, digits)
  li t0, 65366
  sw s2, 0(t0)
  ; sci/display.e16.ts:366  math(M_RNDTO, addr(scratch), 0, 0)
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

; sci/display.e16.ts:370 exponentOf(v/e) at -O1
;   v/e in a0
exponentOf:
  ; sci/display.e16.ts:371  const e = peek(v + 1)
  lbu a0, 1(a0)
  ; sci/display.e16.ts:372  return e >= 128 ? i16(e) - 256 : i16(e)
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

; sci/display.e16.ts:380 decimalText(v) at -O1
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
  ; sci/display.e16.ts:381  const shape = peek(KEEP_FORMAT)
  lbu s2, 3077(zero)
  ; sci/display.e16.ts:382  const n = peek(KEEP_DIGITS)
  lbu s3, 3078(zero)
  ; sci/display.e16.ts:383  if (shape === FORMAT_FIX) fixText(v, n)
  li t0, 1
  bne s2, t0, .L1
  ; sci/display.e16.ts:383  fixText(v, n)
  mv a0, s1
  mv a1, s3
  call fixText
  j .L2
.L1:
  ; sci/display.e16.ts:384  if (shape === FORMAT_EXP) expText(v, n === 0 ? 10 : n, false)
  li t0, 2
  bne s2, t0, .L3
  ; sci/display.e16.ts:384  expText(v, n === 0 ? 10 : n, false)
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
  ; sci/display.e16.ts:385  autoText(v, shape === FORMAT_AUTO2)
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

; sci/display.e16.ts:389 textOf(v) at -O1
;   v in s1
textOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/display.e16.ts:390  decimalText(v)
  mv a0, s1
  call decimalText
  ; sci/display.e16.ts:391  return addr(text)
  la a0, text
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:395 autoText(v, small/places) at -O1
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
  ; sci/display.e16.ts:396  const e = exponentOf(v)
  mv a0, s1
  call exponentOf
  mv s2, a0 ; e
  ; sci/display.e16.ts:397  if (small && !isZero(v) && e < -2) {
  beqz s3, .L1
  mv a0, s1
  call isZero
  bnez a0, .L1
  li t0, 65534
  bge s2, t0, .L1
  ; sci/display.e16.ts:398  trimmed = true
  li t0, 1
  sw t0, 0x0750(zero)
  ; sci/display.e16.ts:399  expText(v, 10, false)
  mv a0, s1
  li a1, 10
  li a2, 0
  call expText
  ; sci/display.e16.ts:400  trimmed = false
  sw zero, 0x0750(zero)
  ; sci/display.e16.ts:401  return
  j .return
.L1:
  ; sci/display.e16.ts:403  if (isZero(v) || e < -9 || e > 9) {
  mv a0, s1
  call isZero
  bnez a0, .L3
  li t0, 65527
  blt s2, t0, .L3
  li t0, 9
  bge t0, s2, .L2
.L3:
  ; sci/display.e16.ts:404  format(v, 10)
  mv a0, s1
  li a1, 10
  call format
  ; sci/display.e16.ts:405  return
  j .return
.L2:
  ; sci/display.e16.ts:407  const places: i16 = e >= 0 ? 9 - e : 9
  blt s2, zero, .L4
  li t0, 9
  sub t0, t0, s2
  j .L5
.L4:
  li t0, 9
.L5:
  mv s3, t0 ; small/places
  ; sci/display.e16.ts:408  rounded(v, u16(-places))
  neg a1, s3
  mv a0, s1
  call rounded
  ; sci/display.e16.ts:409  format(addr(scratch), 12)
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

; sci/display.e16.ts:412 fixText(v/point, n) at -O1
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
  ; sci/display.e16.ts:413  rounded(v, u16(-i16(n)))
  neg a1, s3
  mv a0, s2
  call rounded
  ; sci/display.e16.ts:414  format(addr(scratch), 12)
  la a0, scratch
  li a1, 12
  call format
  ; sci/display.e16.ts:416  let point = textLength
  lw s2, 0x06f4(zero)
  ; sci/display.e16.ts:417  for (let i: u16 = 0; i < textLength; i++) {
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/display.e16.ts:418  if (text[i] === 0x45) return
  lbu t0, text(s1)
  li t1, 69
  bne t0, t1, .L5
  ; sci/display.e16.ts:418  return
  j .return
.L5:
  ; sci/display.e16.ts:419  if (text[i] === 0x2e) point = i
  lbu t0, text(s1)
  li t1, 46
  bne t0, t1, .L6
  ; sci/display.e16.ts:419  point = i
  mv s2, s1 ; v/point
.L6:
  addi s1, s1, 1
.L3:
  lw t0, 0x06f4(zero)
  bltu s1, t0, .L1
  ; sci/display.e16.ts:421  if (n === 0) return
  bne s3, zero, .L7
  ; sci/display.e16.ts:421  return
  j .return
.L7:
  ; sci/display.e16.ts:422  if (point === textLength) addChar(0x2e)
  lw t0, 0x06f4(zero)
  bne s2, t0, .L11
  ; sci/display.e16.ts:422  addChar(0x2e)
  li a0, 46
  call addChar
  ; sci/display.e16.ts:423  while (textLength - point - 1 < n) addChar(0x30)
  j .L11
.L9:
  ; sci/display.e16.ts:423  addChar(0x30)
  li a0, 48
  call addChar
.L11:
  lw t0, 0x06f4(zero)
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

; sci/display.e16.ts:430 expText(v/w, digits, eng) at -O1
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
  ; sci/display.e16.ts:431  textLength = 0
  sw zero, 0x06f4(zero)
  ; sci/display.e16.ts:432  rounded(v, digits)
  mv a0, s2
  mv a1, s0
  call rounded
  ; sci/display.e16.ts:433  const w = addr(scratch)
  la s2, scratch
  ; sci/display.e16.ts:434  if (isNegative(w)) addChar(0x2d)
  mv a0, s2
  call isNegative
  beqz a0, .L1
  ; sci/display.e16.ts:434  addChar(0x2d)
  li a0, 45
  call addChar
.L1:
  ; sci/display.e16.ts:435  const e = exponentOf(w)
  mv a0, s2
  call exponentOf
  mv s3, a0 ; e
  ; sci/display.e16.ts:436  let shift: i16 = 0
  sw zero, 0(sp) ; shift
  ; sci/display.e16.ts:437  if (eng) shift = e >= 0 ? e % 3 : (3 - (-e % 3)) % 3
  lw t0, 2(sp) ; eng
  beqz t0, .L2
  ; sci/display.e16.ts:437  shift = e >= 0 ? e % 3 : (3 - (-e % 3)) % 3
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
  ; sci/display.e16.ts:438  for (let k: u16 = 0; k < digits; k++) {
  li s1, 0 ; k
  j .L7
.L5:
  ; sci/display.e16.ts:439  const pair = peek(w + 2 + (k >> 1))
  srli t0, s1, 1
  addi t1, s2, 2
  add t1, t1, t0
  lbu t1, 0(t1)
  sw t1, 4(sp) ; pair
  ; sci/display.e16.ts:440  addChar(0x30 + ((k & 1) === 0 ? pair >> 4 : pair & 15))
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
  ; sci/display.e16.ts:441  if (i16(k) === shift && k + 1 < digits) addChar(0x2e)
  lw t0, 0(sp) ; shift
  bne s1, t0, .L11
  addi t0, s1, 1
  bgeu t0, s0, .L11
  ; sci/display.e16.ts:441  addChar(0x2e)
  li a0, 46
  call addChar
.L11:
  addi s1, s1, 1
.L7:
  bltu s1, s0, .L5
  ; sci/display.e16.ts:443  if (eng || trimmed) trimZeros()
  lw t0, 2(sp) ; eng
  bnez t0, .L13
  lw t0, 0x0750(zero)
  beqz t0, .L12
.L13:
  ; sci/display.e16.ts:443  trimZeros()
  call trimZeros
.L12:
  ; sci/display.e16.ts:444  addChar(0x45)
  li a0, 69
  call addChar
  ; sci/display.e16.ts:445  numberChars(e - shift)
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

; sci/display.e16.ts:452 engText(v) at -O1
;   v in s1
engText:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/display.e16.ts:453  if (isZero(v)) {
  mv a0, s1
  call isZero
  beqz a0, .L1
  ; sci/display.e16.ts:454  format(v, 10)
  mv a0, s1
  li a1, 10
  call format
  ; sci/display.e16.ts:455  return
  j .return
.L1:
  ; sci/display.e16.ts:457  expText(v, 10, true)
  mv a0, s1
  li a1, 10
  li a2, 1
  call expText
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:461 trimZeros() at -O1
;   point in a1
;   i in a0
trimZeros:
  ; sci/display.e16.ts:462  let point = textLength
  lw a1, 0x06f4(zero)
  ; sci/display.e16.ts:463  for (let i: u16 = 0; i < textLength; i++) {
  li a0, 0 ; i
  j .L3
.L1:
  ; sci/display.e16.ts:464  if (text[i] === 0x2e) point = i
  lbu t0, text(a0)
  li t1, 46
  bne t0, t1, .L5
  ; sci/display.e16.ts:464  point = i
  mv a1, a0 ; point
.L5:
  addi a0, a0, 1
.L3:
  lw t0, 0x06f4(zero)
  bltu a0, t0, .L1
  ; sci/display.e16.ts:466  if (point === textLength) return
  lw t0, 0x06f4(zero)
  bne a1, t0, .L9
  ; sci/display.e16.ts:466  return
  ret
  ; sci/display.e16.ts:467  while (textLength > point + 1 && text[textLength - 1] === 0x30) textLength--
.L7:
  ; sci/display.e16.ts:467  textLength--
  lw t0, 0x06f4(zero)
  addi t0, t0, -1
  sw t0, 0x06f4(zero)
.L9:
  lw t0, 0x06f4(zero)
  addi t1, a1, 1
  bgeu t1, t0, .L11
  lw t0, 0x06f4(zero)
  lbu t0, text-1(t0)
  li t1, 48
  beq t0, t1, .L7
.L11:
  ; sci/display.e16.ts:468  if (textLength === point + 1) textLength--
  lw t0, 0x06f4(zero)
  addi t1, a1, 1
  bne t0, t1, .L12
  ; sci/display.e16.ts:468  textLength--
  lw t0, 0x06f4(zero)
  addi t0, t0, -1
  sw t0, 0x06f4(zero)
.L12:
  ; sci/display.e16.ts:469  text[textLength] = 0
  lw t0, 0x06f4(zero)
  sb zero, text(t0)
.return:
  ret

; sci/display.e16.ts:473 numberChars(n/k) at -O1
;   n/k in s1
numberChars:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n/k
  ; sci/display.e16.ts:474  let k = n
  ; sci/display.e16.ts:475  if (k < 0) {
  bge s1, zero, .L1
  ; sci/display.e16.ts:476  addChar(0x2d)
  li a0, 45
  call addChar
  ; sci/display.e16.ts:477  k = -k
  neg s1, s1
.L1:
  ; sci/display.e16.ts:479  if (k >= 10) addChar(0x30 + div(u16(k), 10))
  li t0, 10
  blt s1, t0, .L2
  ; sci/display.e16.ts:479  addChar(0x30 + div(u16(k), 10))
  li t1, 52429
  mulhu t0, s1, t1
  srli t0, t0, 3
  addi a0, t0, 48
  call addChar
.L2:
  ; sci/display.e16.ts:480  addChar(0x30 + (u16(k) % 10))
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

; sci/display.e16.ts:483 addChar(c) at -O1
;   c in a0
addChar:
  ; sci/display.e16.ts:484  if (textLength < 31) {
  lw t0, 0x06f4(zero)
  li t1, 31
  bgeu t0, t1, .L1
  ; sci/display.e16.ts:485  text[textLength] = c
  lw t0, 0x06f4(zero)
  sb a0, text(t0)
  ; sci/display.e16.ts:486  textLength++
  lw t0, 0x06f4(zero)
  addi t0, t0, 1
  sw t0, 0x06f4(zero)
  ; sci/display.e16.ts:487  text[textLength] = 0
  lw t0, 0x06f4(zero)
  sb zero, text(t0)
.L1:
.return:
  ret

; sci/display.e16.ts:494 dmsText(v) at -O1
;   v in s1
dmsText:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/display.e16.ts:495  if (exponentOf(v) > 9) {
  mv a0, s1
  call exponentOf
  li t0, 9
  bge t0, a0, .L1
  ; sci/display.e16.ts:496  decimalText(v)
  mv a0, s1
  call decimalText
  ; sci/display.e16.ts:497  return
  j .return
.L1:
  ; sci/display.e16.ts:499  setDigits(1)
  li a0, 1
  call setDigits
  ; sci/display.e16.ts:500  copy(v, addr(degreePart))
  mv a0, s1
  la a1, degreePart
  call copy
  ; sci/display.e16.ts:501  math(M_ABS, addr(degreePart), 0, 0)
  li a0, 17
  la a1, degreePart
  li a2, 0
  li a3, 0
  call math
  ; sci/display.e16.ts:503  copy(addr(degreePart), addr(minutePart))
  la a0, degreePart
  la a1, minutePart
  call copy
  ; sci/display.e16.ts:504  math(M_IDIV, addr(degreePart), addr(unit), 0)
  li a0, 8
  la a1, degreePart
  la a2, unit
  li a3, 0
  call math
  ; sci/display.e16.ts:505  math(M_SUB, addr(minutePart), addr(degreePart), 0)
  li a0, 2
  la a1, minutePart
  la a2, degreePart
  li a3, 0
  call math
  ; sci/display.e16.ts:506  sixty(addr(minutePart))
  la a0, minutePart
  call sixty
  ; sci/display.e16.ts:507  copy(addr(minutePart), addr(spare))
  la a0, minutePart
  la a1, spare
  call copy
  ; sci/display.e16.ts:508  math(M_IDIV, addr(minutePart), addr(unit), 0)
  li a0, 8
  la a1, minutePart
  la a2, unit
  li a3, 0
  call math
  ; sci/display.e16.ts:509  math(M_SUB, addr(spare), addr(minutePart), 0)
  li a0, 2
  la a1, spare
  la a2, minutePart
  li a3, 0
  call math
  ; sci/display.e16.ts:510  sixty(addr(spare))
  la a0, spare
  call sixty
  ; sci/display.e16.ts:511  poke16(MATH_ARG, u16(-2))
  li t0, 65534
  li t1, 65366
  sw t0, 0(t1)
  ; sci/display.e16.ts:512  math(M_RNDTO, addr(spare), 0, 0)
  li a0, 40
  la a1, spare
  li a2, 0
  li a3, 0
  call math
  ; sci/display.e16.ts:514  setDigits(1)
  li a0, 1
  call setDigits
  ; sci/display.e16.ts:515  copy(addr(unit), addr(scratch))
  la a0, unit
  la a1, scratch
  call copy
  ; sci/display.e16.ts:516  setDigits(60)
  li a0, 60
  call setDigits
  ; sci/display.e16.ts:517  carry(addr(spare), addr(minutePart))
  la a0, spare
  la a1, minutePart
  call carry
  ; sci/display.e16.ts:518  carry(addr(minutePart), addr(degreePart))
  la a0, minutePart
  la a1, degreePart
  call carry
  ; sci/display.e16.ts:519  setDigits(1)
  li a0, 1
  call setDigits
  ; sci/display.e16.ts:520  textLength = 0
  sw zero, 0x06f4(zero)
  ; sci/display.e16.ts:521  if (isNegative(v)) addChar(0x2d)
  mv a0, s1
  call isNegative
  beqz a0, .L2
  ; sci/display.e16.ts:521  addChar(0x2d)
  li a0, 45
  call addChar
.L2:
  ; sci/display.e16.ts:522  part(addr(degreePart), T_DEG)
  la a0, degreePart
  li a1, 136
  call part
  ; sci/display.e16.ts:523  part(addr(minutePart), T_MIN)
  la a0, minutePart
  li a1, 137
  call part
  ; sci/display.e16.ts:524  part(addr(spare), T_SEC)
  la a0, spare
  li a1, 138
  call part
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:528 carry(low, high) at -O1
;   low in s1
;   high in s2
carry:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; low
  mv s2, a1 ; high
  ; sci/display.e16.ts:529  math(M_CMP, low, addr(unit), 0)
  li a0, 6
  mv a1, s1
  la a2, unit
  li a3, 0
  call math
  ; sci/display.e16.ts:530  if (i16(peek16(MATH_RESULT)) < 0) return
  li t0, 65370
  lw t0, 0(t0)
  bge t0, zero, .L1
  ; sci/display.e16.ts:530  return
  j .return
.L1:
  ; sci/display.e16.ts:531  math(M_SUB, low, addr(unit), 0)
  li a0, 2
  mv a1, s1
  la a2, unit
  li a3, 0
  call math
  ; sci/display.e16.ts:532  math(M_ADD, high, addr(scratch), 0)
  li a0, 1
  mv a1, s2
  la a2, scratch
  li a3, 0
  call math
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/display.e16.ts:536 sixty(n) at -O1
;   n in s1
sixty:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; sci/display.e16.ts:537  setDigits(60)
  li a0, 60
  call setDigits
  ; sci/display.e16.ts:538  math(M_MUL, n, addr(unit), 0)
  li a0, 3
  mv a1, s1
  la a2, unit
  li a3, 0
  call math
  ; sci/display.e16.ts:539  setDigits(1)
  li a0, 1
  call setDigits
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/display.e16.ts:543 part(n, mark) at -O1
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
  ; sci/display.e16.ts:544  const at = textLength
  lw s1, 0x06f4(zero)
  ; sci/display.e16.ts:545  const before = addr(text) + at
  addi s0, s1, text
  ; sci/display.e16.ts:546  poke16(MATH_ARG, 10)
  li t0, 10
  li t1, 65366
  sw t0, 0(t1)
  ; sci/display.e16.ts:547  math(M_FORMAT, n, before, 0)
  li a0, 57
  mv a1, s2
  mv a2, s0
  li a3, 0
  call math
  ; sci/display.e16.ts:548  textLength = at + peek16(MATH_ARG)
  li t0, 65366
  lw t0, 0(t0)
  add t0, s1, t0
  sw t0, 0x06f4(zero)
  ; sci/display.e16.ts:549  addChar(mark)
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

; sci/display.e16.ts:553 setDigits(n) at -O1
;   n in a0
;   k in a1
setDigits:
  ; sci/display.e16.ts:554  for (let k: u16 = 0; k < 8; k++) unit[k] = 0
  li a1, 0 ; k
  j .L3
.L1:
  ; sci/display.e16.ts:554  unit[k] = 0
  sb zero, unit(a1)
  addi a1, a1, 1
.L3:
  li t0, 8
  bltu a1, t0, .L1
  ; sci/display.e16.ts:555  if (n >= 10) {
  li t0, 10
  bltu a0, t0, .L5
  ; sci/display.e16.ts:556  unit[1] = 1
  li t0, 1
  sb t0, unit+1(zero)
  ; sci/display.e16.ts:557  unit[2] = (div(n, 10) << 4) | (n % 10)
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
  ; sci/display.e16.ts:558  unit[2] = n << 4
  slli t0, a0, 4
  sb t0, unit+2(zero)
.L6:
.return:
  ret

; sci/display.e16.ts:561 copy(from, to) at -O1
;   from in a0
;   to in a1
;   k in a2
copy:
  ; sci/display.e16.ts:562  for (let k: u16 = 0; k < 8; k++) poke(to + k, peek(from + k))
  li a2, 0 ; k
  j .L3
.L1:
  ; sci/display.e16.ts:562  poke(to + k, peek(from + k))
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

; sci/prog.e16.ts:47 progPhase() at -O1
progPhase:
  ; sci/prog.e16.ts:48  return progNow
  lw a0, 0x0982(zero)
.return:
  ret

; sci/prog.e16.ts:52 progList() at -O1
progList:
  ; sci/prog.e16.ts:53  progNow = PROG_LIST
  sw zero, 0x0982(zero)
.return:
  ret

; sci/prog.e16.ts:57 progEdit() at -O1
progEdit:
  ; sci/prog.e16.ts:58  progNow = PROG_EDIT
  li t0, 1
  sw t0, 0x0982(zero)
.return:
  ret

; sci/prog.e16.ts:64 progListKey(k/d) at -O1
;   k/d in s1
progListKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/d
  ; sci/prog.e16.ts:65  if (k === K_AC) return 0xff
  li t0, 5
  bne s1, t0, .L1
  ; sci/prog.e16.ts:65  return 0xff
  li a0, 255
  j .return
.L1:
  ; sci/prog.e16.ts:66  const d = digitOf(k)
  mv a0, s1
  la t0, digitOf
  li t1, 4
  call far_call
  mv s1, a0 ; k/d
  ; sci/prog.e16.ts:67  if (d >= 1 && d <= 4) return d
  li t0, 1
  bltu s1, t0, .L2
  li t0, 4
  bltu t0, s1, .L2
  ; sci/prog.e16.ts:67  return d
  mv a0, s1
  j .return
.L2:
  ; sci/prog.e16.ts:68  refuse()
  call refuse
  ; sci/prog.e16.ts:69  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/prog.e16.ts:75 progDrawList() at -O1
;   p in s2
;   n in s3
;   i in s1
progDrawList:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; sci/prog.e16.ts:76  noCursor()
  call noCursor
  ; sci/prog.e16.ts:77  bandWith(str('PROG'), 0)
  la a0, str_226
  li a1, 0
  call bandWith
  ; sci/prog.e16.ts:78  for (let p: u16 = 0; p < 4; p++) {
  li s2, 0 ; p
  j .L3
.L1:
  ; sci/prog.e16.ts:79  const n = peek(PROGRAMS + p * PROGRAM_SIZE)
  li t0, 202
  mul t0, s2, t0
  li t1, 11266
  add t1, t1, t0
  lbu s3, 0(t1)
  ; sci/prog.e16.ts:80  listText[0] = 0x31 + p
  addi t0, s2, 49
  sb t0, listText(zero)
  ; sci/prog.e16.ts:81  listText[1] = 0x3a
  li t0, 58
  sb t0, listText+1(zero)
  ; sci/prog.e16.ts:82  listText[2] = 0x50
  li t0, 80
  sb t0, listText+2(zero)
  ; sci/prog.e16.ts:83  listText[3] = 0x31 + p
  addi t0, s2, 49
  sb t0, listText+3(zero)
  ; sci/prog.e16.ts:84  listText[4] = 0x20
  li t0, 32
  sb t0, listText+4(zero)
  ; sci/prog.e16.ts:85  listText[5] = 0x20
  li t0, 32
  sb t0, listText+5(zero)
  ; sci/prog.e16.ts:86  let i: u16 = 6
  li s1, 6 ; i
  ; sci/prog.e16.ts:87  if (n === 0) i = copyInto(str('EMPTY'), i)
  bne s3, zero, .L5
  ; sci/prog.e16.ts:87  i = copyInto(str('EMPTY'), i)
  la a0, str_227
  mv a1, s1
  call copyInto
  mv s1, a0 ; i
  j .L6
.L5:
  ; sci/prog.e16.ts:89  if (n >= 100) {
  li t0, 100
  bltu s3, t0, .L7
  ; sci/prog.e16.ts:90  listText[i] = 0x30 + div(n, 100)
  li t1, 5243
  srli t0, s3, 2
  mulhu t0, t0, t1
  srli t0, t0, 1
  addi t0, t0, 48
  sb t0, listText(s1)
  ; sci/prog.e16.ts:91  i++
  addi s1, s1, 1
.L7:
  ; sci/prog.e16.ts:93  if (n >= 10) {
  li t0, 10
  bltu s3, t0, .L8
  ; sci/prog.e16.ts:94  listText[i] = 0x30 + (div(n, 10) % 10)
  li t1, 52429
  mulhu t0, s3, t1
  srli t0, t0, 3
  li t2, 52429
  mulhu t1, t0, t2
  srli t1, t1, 3
  li t2, 10
  mul t1, t1, t2
  sub t0, t0, t1
  addi t0, t0, 48
  sb t0, listText(s1)
  ; sci/prog.e16.ts:95  i++
  addi s1, s1, 1
.L8:
  ; sci/prog.e16.ts:97  listText[i] = 0x30 + (n % 10)
  li t1, 52429
  mulhu t0, s3, t1
  srli t0, t0, 3
  li t1, 10
  mul t0, t0, t1
  sub t0, s3, t0
  addi t0, t0, 48
  sb t0, listText(s1)
  ; sci/prog.e16.ts:98  i = copyInto(str(' STEPS'), i + 1)
  la a0, str_228
  addi a1, s1, 1
  call copyInto
  mv s1, a0 ; i
.L6:
  ; sci/prog.e16.ts:100  textAt(addr(listText), 1, lineY(p))
  mv a0, s2
  call lineY
  li a1, 1
  mv a2, a0
  la a0, listText
  call textAt
  addi s2, s2, 1
.L3:
  li t0, 4
  bltu s2, t0, .L1
  ; sci/prog.e16.ts:102  textAt(str('1-4:EDIT AC:BACK'), 1, lineY(5))
  la a0, str_229
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/prog.e16.ts:105 copyInto(s/p, from/i) at -O1
;   s/p in a0
;   from/i in a1
copyInto:
  ; sci/prog.e16.ts:106  let i = from
  ; sci/prog.e16.ts:107  let p = s
  ; sci/prog.e16.ts:108  while (peek(p) !== 0) {
  j .L3
.L1:
  ; sci/prog.e16.ts:109  listText[i] = peek(p)
  lbu t0, 0(a0)
  sb t0, listText(a1)
  ; sci/prog.e16.ts:110  i++
  addi a1, a1, 1
  ; sci/prog.e16.ts:111  p++
  addi a0, a0, 1
.L3:
  lbu t0, 0(a0)
  bne t0, zero, .L1
  ; sci/prog.e16.ts:113  listText[i] = 0
  sb zero, listText(a1)
  ; sci/prog.e16.ts:114  return i
  mv a0, a1
.return:
  ret

; sci/prog.e16.ts:118 progDrawFoot() at -O1
progDrawFoot:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/prog.e16.ts:119  listText[0] = 0x50
  li t0, 80
  sb t0, listText(zero)
  ; sci/prog.e16.ts:120  listText[1] = 0x31 + peek(PROG_CHOSEN)
  li t0, 11264
  lbu t0, 0(t0)
  addi t0, t0, 49
  sb t0, listText+1(zero)
  ; sci/prog.e16.ts:121  listText[2] = 0
  sb zero, listText+2(zero)
  ; sci/prog.e16.ts:122  textAt(addr(listText), 1, lineY(4))
  la a0, listText
  li a1, 1
  li a2, 47
  call textAt
  ; sci/prog.e16.ts:123  textAt(str('=:RUN AC:LIST'), 19, lineY(4))
  la a0, str_230
  li a1, 19
  li a2, 47
  call textAt
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/prog.e16.ts:131 progFuncPage(page) at -O1
;   page in s1
progFuncPage:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; page
  ; sci/prog.e16.ts:132  if (page === 0) {
  bne s1, zero, .L1
  ; sci/prog.e16.ts:133  textAt(str('1:?      2:\x94'), 1, lineY(0))
  la a0, str_231
  li a1, 1
  li a2, 11
  call textAt
  ; sci/prog.e16.ts:134  textAt(str('3:\x8b      4::'), 1, lineY(1))
  la a0, str_232
  li a1, 1
  li a2, 20
  call textAt
  ; sci/prog.e16.ts:135  textAt(str('5:\xe1'), 1, lineY(2))
  la a0, str_233
  li a1, 1
  li a2, 29
  call textAt
  j .L2
.L1:
  ; sci/prog.e16.ts:136  if (page === 1) {
  li t0, 1
  bne s1, t0, .L3
  ; sci/prog.e16.ts:137  textAt(str('1:=      2:\xe2'), 1, lineY(0))
  la a0, str_234
  li a1, 1
  li a2, 11
  call textAt
  ; sci/prog.e16.ts:138  textAt(str('3:<      4:>'), 1, lineY(1))
  la a0, str_235
  li a1, 1
  li a2, 20
  call textAt
  ; sci/prog.e16.ts:139  textAt(str('5:\xe3      6:\xe4'), 1, lineY(2))
  la a0, str_236
  li a1, 1
  li a2, 29
  call textAt
  j .L4
.L3:
  ; sci/prog.e16.ts:141  textAt(str('1:lbl    2:goto'), 1, lineY(0))
  la a0, str_237
  li a1, 1
  li a2, 11
  call textAt
  ; sci/prog.e16.ts:142  textAt(str('0:CLEAR'), 1, lineY(1))
  la a0, str_238
  li a1, 1
  li a2, 20
  call textAt
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/prog.e16.ts:150 progFuncToken(page, d) at -O1
;   page in a0
;   d in a1
;   n in a2
progFuncToken:
  ; sci/prog.e16.ts:151  if (page === 2) {
  li t0, 2
  bne a0, t0, .L1
  ; sci/prog.e16.ts:152  if (d === 1) return T_LBL
  li t0, 1
  bne a1, t0, .L2
  ; sci/prog.e16.ts:152  return T_LBL
  li a0, 188
  ret
.L2:
  ; sci/prog.e16.ts:153  if (d === 2) return T_GOTO
  li t0, 2
  bne a1, t0, .L3
  ; sci/prog.e16.ts:153  return T_GOTO
  li a0, 189
  ret
.L3:
  ; sci/prog.e16.ts:154  return d === 0 ? 0xfe : 0
  bne a1, zero, .L4
  li t0, 254
  j .L5
.L4:
  li t0, 0
.L5:
  mv a0, t0
  ret
.L1:
  ; sci/prog.e16.ts:156  const n = page === 0 ? 5 : 6
  bne a0, zero, .L6
  li t0, 5
  j .L7
.L6:
  li t0, 6
.L7:
  mv a2, t0 ; n
  ; sci/prog.e16.ts:157  if (d < 1 || d > n) return 0
  li t0, 1
  bltu a1, t0, .L9
  bgeu a2, a1, .L8
.L9:
  ; sci/prog.e16.ts:157  return 0
  li a0, 0
  ret
.L8:
  ; sci/prog.e16.ts:158  return peek((page === 0 ? str('?\x94\x8b:\xb8') : str('=\xb9<>\xba\xbb')) + d - 1)
  bne a0, zero, .L10
  la t0, str_239
  j .L11
.L10:
  la t0, str_240
.L11:
  add t0, t0, a1
  lbu a0, -1(t0)
.return:
  ret

; sci/prog.e16.ts:167 ptok(i) at -O1
;   i in a0
ptok:
  ; sci/prog.e16.ts:168  return i < runLength ? peek(runFrom + i) : 0
  lw t0, 0x099e(zero)
  bgeu a0, t0, .L1
  lw t0, 0x099c(zero)
  add t0, t0, a0
  lbu t0, 0(t0)
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
.return:
  ret

; sci/prog.e16.ts:175 progRun(from/s, length) at -O1
;   from/s in s1
;   length in s2
progRun:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; from/s
  mv s2, a1 ; length
  ; sci/prog.e16.ts:176  runFrom = from
  sw s1, 0x099c(zero)
  ; sci/prog.e16.ts:177  runLength = length
  sw s2, 0x099e(zero)
  ; sci/prog.e16.ts:178  let s: u16 = 0
  li s1, 0 ; from/s
  ; sci/prog.e16.ts:179  while (s < runLength) s = statement(s, statementEnd(s))
  j .L3
.L1:
  ; sci/prog.e16.ts:179  s = statement(s, statementEnd(s))
  mv a0, s1
  call statementEnd
  mv a1, a0
  mv a0, s1
  call statement
  mv s1, a0 ; from/s
.L3:
  lw t0, 0x099e(zero)
  bltu s1, t0, .L1
  ; sci/prog.e16.ts:180  clearStack()
  call clearStack
  ; sci/prog.e16.ts:181  copyValue(KEEP_ANS, push(0))
  li a0, 0
  call push
  mv a1, a0
  li a0, 3080
  call copyValue
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/prog.e16.ts:185 statementEnd(s/e) at -O1
;   s/e in s1
statementEnd:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; s/e
  ; sci/prog.e16.ts:186  let e = s
  ; sci/prog.e16.ts:187  while (e < runLength && ptok(e) !== T_COLON) e++
  j .L3
.L1:
  ; sci/prog.e16.ts:187  e++
  addi s1, s1, 1
.L3:
  lw t0, 0x099e(zero)
  bgeu s1, t0, .L5
  mv a0, s1
  call ptok
  li t0, 58
  bne a0, t0, .L1
.L5:
  ; sci/prog.e16.ts:188  return e
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/prog.e16.ts:192 statement(s, e) at -O1
;   s in s1
;   e in s2
;   t/then in s3
statement:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; s
  mv s2, a1 ; e
  ; sci/prog.e16.ts:193  const t = ptok(s)
  mv a0, s1
  call ptok
  mv s3, a0 ; t/then
  ; sci/prog.e16.ts:194  if (s === e || t === T_LBL) return e + 1
  beq s1, s2, .L2
  li t0, 188
  bne s3, t0, .L1
.L2:
  ; sci/prog.e16.ts:194  return e + 1
  addi a0, s2, 1
  j .return
.L1:
  ; sci/prog.e16.ts:195  if (t === T_GOTO) return labelAt(ptok(s + 1), s)
  li t0, 189
  bne s3, t0, .L3
  ; sci/prog.e16.ts:195  return labelAt(ptok(s + 1), s)
  addi a0, s1, 1
  call ptok
  mv a1, s1
  call labelAt
  j .return
.L3:
  ; sci/prog.e16.ts:196  if (t === T_ASK) {
  li t0, 63
  bne s3, t0, .L4
  ; sci/prog.e16.ts:197  if (ptok(s + 1) !== T_STORE || !isVariable(ptok(s + 2)) || e !== s + 3) fail(E_SYNTAX, s)
  addi a0, s1, 1
  call ptok
  li t0, 148
  bne a0, t0, .L6
  addi a0, s1, 2
  call ptok
  call isVariable
  beqz a0, .L6
  addi t0, s1, 3
  beq s2, t0, .L5
.L6:
  ; sci/prog.e16.ts:197  fail(E_SYNTAX, s)
  li a0, 2
  mv a1, s1
  call fail
.L5:
  ; sci/prog.e16.ts:198  ask(ptok(s + 2), s)
  addi a0, s1, 2
  call ptok
  mv a1, s1
  call ask
  ; sci/prog.e16.ts:199  return e + 1
  addi a0, s2, 1
  j .return
.L4:
  ; sci/prog.e16.ts:201  const then = find(T_THEN, s, e)
  li a0, 184
  mv a1, s1
  mv a2, s2
  call find
  mv s3, a0 ; t/then
  ; sci/prog.e16.ts:202  if (then === 0xffff) valueStatement(s, e)
  li t0, 65535
  bne s3, t0, .L7
  ; sci/prog.e16.ts:202  valueStatement(s, e)
  mv a0, s1
  mv a1, s2
  call valueStatement
  j .L8
.L7:
  ; sci/prog.e16.ts:204  runPart(s, then)
  mv a0, s1
  mv a1, s3
  call runPart
  ; sci/prog.e16.ts:205  if (!isZero(top())) return statement(then + 1, e)
  call top
  call isZero
  bnez a0, .L9
  ; sci/prog.e16.ts:205  return statement(then + 1, e)
  addi a0, s3, 1
  mv a1, s2
  call statement
  j .return
.L9:
.L8:
  ; sci/prog.e16.ts:207  return e + 1
  addi a0, s2, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/prog.e16.ts:211 valueStatement(s/v, e) at -O1
;   s/v in s2
;   e in s3
;   store in s1
;   show in s0
;   end in 0(sp)
valueStatement:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s0, 10(sp)
  mv s2, a0 ; s/v
  mv s3, a1 ; e
  ; sci/prog.e16.ts:212  const store = find(T_STORE, s, e)
  li a0, 148
  mv a1, s2
  mv a2, s3
  call find
  mv s1, a0 ; store
  ; sci/prog.e16.ts:213  const show = ptok(e - 1) === T_SHOW
  addi a0, s3, -1
  call ptok
  li t0, 139
  sub t0, a0, t0
  seqz s0, t0
  ; sci/prog.e16.ts:214  let end = store !== 0xffff ? store : e
  li t0, 65535
  beq s1, t0, .L1
  mv t0, s1
  j .L2
.L1:
  mv t0, s3
.L2:
  sw t0, 0(sp) ; end
  ; sci/prog.e16.ts:215  if (store === 0xffff && show) end = e - 1
  li t0, 65535
  bne s1, t0, .L3
  beqz s0, .L3
  ; sci/prog.e16.ts:215  end = e - 1
  addi t0, s3, -1
  sw t0, 0(sp) ; end
.L3:
  ; sci/prog.e16.ts:216  runPart(s, end)
  mv a0, s2
  lw a1, 0(sp)
  call runPart
  ; sci/prog.e16.ts:217  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
  ; sci/prog.e16.ts:218  if (store !== 0xffff) {
  li t0, 65535
  beq s1, t0, .L4
  ; sci/prog.e16.ts:219  const v = ptok(store + 1)
  addi a0, s1, 1
  call ptok
  mv s2, a0 ; s/v
  ; sci/prog.e16.ts:220  if (!isVariable(v) || e !== store + (show ? 3 : 2)) fail(E_SYNTAX, store)
  mv a0, s2
  call isVariable
  beqz a0, .L6
  mv t0, s3
  mv t1, s1
  mv t2, s0
  beqz t2, .L7
  li t2, 3
  j .L8
.L7:
  li t2, 2
.L8:
  add t1, t1, t2
  beq t0, t1, .L5
.L6:
  ; sci/prog.e16.ts:220  fail(E_SYNTAX, store)
  li a0, 2
  mv a1, s1
  call fail
.L5:
  ; sci/prog.e16.ts:221  copyValue(KEEP_ANS, varAt(v))
  mv a0, s2
  call varAt
  mv a1, a0
  li a0, 3080
  call copyValue
.L4:
  ; sci/prog.e16.ts:223  if (show) showStep()
  beqz s0, .L9
  ; sci/prog.e16.ts:223  showStep()
  call showStep
.L9:
.return:
  lw ra, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s0, 10(sp)
  addi sp, sp, 12
  ret

; sci/prog.e16.ts:227 find(t, s/i, e) at -O1
;   t in s2
;   s/i in s1
;   e in s3
find:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; t
  mv s1, a1 ; s/i
  mv s3, a2 ; e
  ; sci/prog.e16.ts:228  for (let i = s; i < e; i++) {
  j .L3
.L1:
  ; sci/prog.e16.ts:229  if (ptok(i) === t) return i
  mv a0, s1
  call ptok
  bne a0, s2, .L5
  ; sci/prog.e16.ts:229  return i
  mv a0, s1
  j .return
.L5:
  addi s1, s1, 1
.L3:
  bltu s1, s3, .L1
  ; sci/prog.e16.ts:231  return 0xffff
  li a0, 65535
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/prog.e16.ts:235 runPart(s, e) at -O1
;   s in s1
;   e in s2
runPart:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; s
  mv s2, a1 ; e
  ; sci/prog.e16.ts:236  clearStack()
  call clearStack
  ; sci/prog.e16.ts:237  errFrom(s)
  mv a0, s1
  call errFrom
  ; sci/prog.e16.ts:238  evaluate(runFrom + s, e - s)
  lw t0, 0x099c(zero)
  add a0, t0, s1
  sub a1, s2, s1
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/prog.e16.ts:239  errFrom(0)
  li a0, 0
  call errFrom
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/prog.e16.ts:243 labelAt(d, at) at -O1
;   d in s2
;   at in s3
;   s in s1
labelAt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; d
  mv s3, a1 ; at
  ; sci/prog.e16.ts:244  let s: u16 = 0
  li s1, 0 ; s
  ; sci/prog.e16.ts:245  while (s < runLength) {
  j .L3
.L1:
  ; sci/prog.e16.ts:246  if (ptok(s) === T_LBL && ptok(s + 1) === d) return s
  mv a0, s1
  call ptok
  li t0, 188
  bne a0, t0, .L5
  addi a0, s1, 1
  call ptok
  bne a0, s2, .L5
  ; sci/prog.e16.ts:246  return s
  mv a0, s1
  j .return
.L5:
  ; sci/prog.e16.ts:247  s = statementEnd(s) + 1
  mv a0, s1
  call statementEnd
  addi s1, a0, 1
.L3:
  lw t0, 0x099e(zero)
  bltu s1, t0, .L1
  ; sci/prog.e16.ts:249  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s3
  call fail
  ; sci/prog.e16.ts:250  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/prog.e16.ts:265 ask(v, s) at -O1
;   v in s1
;   s in s3
;   k in s2
ask:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; v
  mv s3, a1 ; s
  ; sci/prog.e16.ts:266  promptLength = 0
  sw zero, 0x09c8(zero)
  ; sci/prog.e16.ts:267  promptShift = false
  sw zero, 0x09e2(zero)
  ; sci/prog.e16.ts:268  promptAlpha = false
  sw zero, 0x09e4(zero)
  ; sci/prog.e16.ts:269  for (;;) {
.L1:
  ; sci/prog.e16.ts:270  drawPrompt(v)
  mv a0, s1
  call drawPrompt
  ; sci/prog.e16.ts:271  const k = getkey()
  call getkey
  mv s2, a0 ; k
  ; sci/prog.e16.ts:272  if (k === K_EQ && promptLength > 0) {
  li t0, 4
  bne s2, t0, .L5
  lw t0, 0x09c8(zero)
  bgeu zero, t0, .L5
  ; sci/prog.e16.ts:273  clearStack()
  call clearStack
  ; sci/prog.e16.ts:275  errFrom(ERR_PINNED | s)
  li t0, 32768
  or a0, t0, s3
  call errFrom
  ; sci/prog.e16.ts:276  evaluate(addr(promptLine), promptLength)
  lw a1, 0x09c8(zero)
  la a0, promptLine
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/prog.e16.ts:277  errFrom(0)
  li a0, 0
  call errFrom
  ; sci/prog.e16.ts:278  copyValue(top(), varAt(v))
  call top
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  call varAt
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copyValue
  ; sci/prog.e16.ts:279  return
  j .return
.L5:
  ; sci/prog.e16.ts:281  promptKey(k)
  mv a0, s2
  call promptKey
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/prog.e16.ts:286 promptKey(k) at -O1
;   k in s1
promptKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/prog.e16.ts:287  if (k === K_SHIFT) {
  li t0, 6
  bne s1, t0, .L1
  ; sci/prog.e16.ts:288  promptShift = !promptShift
  lw t0, 0x09e2(zero)
  seqz t0, t0
  sw t0, 0x09e2(zero)
  ; sci/prog.e16.ts:289  promptAlpha = false
  sw zero, 0x09e4(zero)
  j .L2
.L1:
  ; sci/prog.e16.ts:290  if (k === K_ALPHA) {
  li t0, 7
  bne s1, t0, .L3
  ; sci/prog.e16.ts:291  promptAlpha = !promptAlpha
  lw t0, 0x09e4(zero)
  seqz t0, t0
  sw t0, 0x09e4(zero)
  ; sci/prog.e16.ts:292  promptShift = false
  sw zero, 0x09e2(zero)
  j .L4
.L3:
  ; sci/prog.e16.ts:293  if (k === K_AC) calc_on()
  li t0, 5
  bne s1, t0, .L5
  ; sci/prog.e16.ts:293  calc_on()
  call calc_on
  j .L6
.L5:
  ; sci/prog.e16.ts:294  if (k === K_DEL && promptLength > 0) promptLength--
  li t0, 14
  bne s1, t0, .L7
  lw t0, 0x09c8(zero)
  bgeu zero, t0, .L7
  ; sci/prog.e16.ts:294  promptLength--
  lw t0, 0x09c8(zero)
  addi t0, t0, -1
  sw t0, 0x09c8(zero)
  j .L8
.L7:
  ; sci/prog.e16.ts:296  promptToken(k === K_EQ || k === K_DEL ? 0 : promptAlpha ? letterOf(k) : tokenOf(k, promptShift))
  li t0, 4
  beq s1, t0, .L11
  li t0, 14
  bne s1, t0, .L9
.L11:
  li t0, 0
  j .L10
.L9:
  lw t0, 0x09e4(zero)
  beqz t0, .L12
  mv a0, s1
  la t0, letterOf
  li t1, 4
  call far_call
  mv t0, a0
  j .L13
.L12:
  lw a1, 0x09e2(zero)
  mv a0, s1
  la t0, tokenOf
  li t1, 4
  call far_call
  mv t0, a0
.L13:
.L10:
  mv a0, t0
  call promptToken
.L8:
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/prog.e16.ts:300 promptToken(t) at -O1
;   t in s1
promptToken:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/prog.e16.ts:301  promptShift = false
  sw zero, 0x09e2(zero)
  ; sci/prog.e16.ts:302  promptAlpha = false
  sw zero, 0x09e4(zero)
  ; sci/prog.e16.ts:303  if (t === 0 || promptLength >= 40) refuse()
  beq s1, zero, .L2
  lw t0, 0x09c8(zero)
  li t1, 40
  bltu t0, t1, .L1
.L2:
  ; sci/prog.e16.ts:303  refuse()
  call refuse
  j .L3
.L1:
  ; sci/prog.e16.ts:305  promptLine[promptLength] = t
  lw t0, 0x09c8(zero)
  sb s1, promptLine(t0)
  ; sci/prog.e16.ts:306  promptLength++
  lw t0, 0x09c8(zero)
  addi t0, t0, 1
  sw t0, 0x09c8(zero)
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/prog.e16.ts:310 drawPrompt(v/n) at -O1
;   v/n in s1
;   i in s3
;   s/p in s2
drawPrompt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; v/n
  ; sci/prog.e16.ts:311  noCursor()
  call noCursor
  ; sci/prog.e16.ts:312  cls()
  call cls
  ; sci/prog.e16.ts:313  bandWith(programName(), 0)
  call programName
  li a1, 0
  call bandWith
  ; sci/prog.e16.ts:314  promptText[0] = v
  sb s1, promptText(zero)
  ; sci/prog.e16.ts:315  promptText[1] = 0x3f
  li t0, 63
  sb t0, promptText+1(zero)
  ; sci/prog.e16.ts:316  promptText[2] = 0
  sb zero, promptText+2(zero)
  ; sci/prog.e16.ts:317  textAt(addr(promptText), 1, lineY(0))
  la a0, promptText
  li a1, 1
  li a2, 11
  call textAt
  ; sci/prog.e16.ts:319  let n: u16 = 0
  li s1, 0 ; v/n
  ; sci/prog.e16.ts:320  for (let i: u16 = 0; i < promptLength; i++) {
  li s3, 0 ; i
  j .L3
.L1:
  ; sci/prog.e16.ts:321  const s = tokenText(promptLine[i])
  lbu a0, promptLine(s3)
  call tokenText
  mv s2, a0 ; s/p
  ; sci/prog.e16.ts:322  if (s === 0) n = put(promptLine[i], n)
  bne s2, zero, .L5
  ; sci/prog.e16.ts:322  n = put(promptLine[i], n)
  lbu a0, promptLine(s3)
  mv a1, s1
  call put
  mv s1, a0 ; v/n
  j .L6
.L5:
  ; sci/prog.e16.ts:324  let p = s
  ; sci/prog.e16.ts:325  while (peek(p) !== 0) {
  j .L9
.L7:
  ; sci/prog.e16.ts:326  n = put(peek(p), n)
  lbu a0, 0(s2)
  mv a1, s1
  call put
  mv s1, a0 ; v/n
  ; sci/prog.e16.ts:327  p++
  addi s2, s2, 1
.L9:
  lbu t0, 0(s2)
  bne t0, zero, .L7
.L6:
  addi s3, s3, 1
.L3:
  lw t0, 0x09c8(zero)
  bltu s3, t0, .L1
  ; sci/prog.e16.ts:331  promptText[n] = 0
  sb zero, promptText(s1)
  ; sci/prog.e16.ts:332  textAt(addr(promptText), 1, lineY(1))
  la a0, promptText
  li a1, 1
  li a2, 20
  call textAt
  ; sci/prog.e16.ts:333  textAt(str('=:OK AC:STOP'), 1, lineY(5))
  la a0, str_241
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/prog.e16.ts:337 put(c, n/i) at -O1
;   c in a0
;   n/i in a1
put:
  ; sci/prog.e16.ts:338  if (n < 21) {
  li t0, 21
  bgeu a1, t0, .L1
  ; sci/prog.e16.ts:339  promptText[n] = c
  sb a0, promptText(a1)
  ; sci/prog.e16.ts:340  return n + 1
  addi a0, a1, 1
  ret
.L1:
  ; sci/prog.e16.ts:342  for (let i: u16 = 0; i < 20; i++) promptText[i] = promptText[i + 1]
  li a1, 0 ; n/i
  j .L4
.L2:
  ; sci/prog.e16.ts:342  promptText[i] = promptText[i + 1]
  lbu t0, promptText+1(a1)
  sb t0, promptText(a1)
  addi a1, a1, 1
.L4:
  li t0, 20
  bltu a1, t0, .L2
  ; sci/prog.e16.ts:343  promptText[20] = c
  sb a0, promptText+20(zero)
  ; sci/prog.e16.ts:344  return 21
  li a0, 21
.return:
  ret

; sci/prog.e16.ts:348 showStep() at -O1
;   k in s1
showStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/prog.e16.ts:349  noCursor()
  call noCursor
  ; sci/prog.e16.ts:350  cls()
  call cls
  ; sci/prog.e16.ts:351  bandWith(programName(), 0)
  call programName
  li a1, 0
  call bandWith
  ; sci/prog.e16.ts:352  textAt(str('=:GO ON AC:STOP'), 1, lineY(0))
  la a0, str_242
  li a1, 1
  li a2, 11
  call textAt
  ; sci/prog.e16.ts:353  drawAnswerAs(SHOW_DECIMAL)
  li a0, 0
  call drawAnswerAs
  ; sci/prog.e16.ts:354  for (;;) {
.L1:
  ; sci/prog.e16.ts:355  const k = getkey()
  call getkey
  mv s1, a0 ; k
  ; sci/prog.e16.ts:356  if (k === K_EQ) return
  li t0, 4
  bne s1, t0, .L5
  ; sci/prog.e16.ts:356  return
  j .return
.L5:
  ; sci/prog.e16.ts:357  if (k === K_AC) calc_on()
  li t0, 5
  bne s1, t0, .L6
  ; sci/prog.e16.ts:357  calc_on()
  call calc_on
.L6:
  ; sci/prog.e16.ts:358  refuse()
  call refuse
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/prog.e16.ts:364 programName() at -O1
programName:
  ; sci/prog.e16.ts:365  nameText[0] = 0x50
  li t0, 80
  sb t0, nameText(zero)
  ; sci/prog.e16.ts:366  nameText[1] = 0x31 + peek(PROG_CHOSEN)
  li t0, 11264
  lbu t0, 0(t0)
  addi t0, t0, 49
  sb t0, nameText+1(zero)
  ; sci/prog.e16.ts:367  nameText[2] = 0
  sb zero, nameText+2(zero)
  ; sci/prog.e16.ts:368  return addr(nameText)
  la a0, nameText
.return:
  ret

str_94:
  .byte 129, 49, 48, 0
str_95:
  .byte 88, 61, 0
str_96:
  .byte 89, 61, 0
str_97:
  .byte 68, 73, 70, 70, 61, 0
str_226:
  .byte 80, 82, 79, 71, 0
str_227:
  .byte 69, 77, 80, 84, 89, 0
str_228:
  .byte 32, 83, 84, 69, 80, 83, 0
str_229:
  .byte 49, 45, 52, 58, 69, 68, 73, 84, 32, 65, 67, 58, 66, 65, 67, 75, 0
str_230:
  .byte 61, 58, 82, 85, 78, 32, 65, 67, 58, 76, 73, 83, 84, 0
str_231:
  .byte 49, 58, 63, 32, 32, 32, 32, 32, 32, 50, 58, 148, 0
str_232:
  .byte 51, 58, 139, 32, 32, 32, 32, 32, 32, 52, 58, 58, 0
str_233:
  .byte 53, 58, 225, 0
str_234:
  .byte 49, 58, 61, 32, 32, 32, 32, 32, 32, 50, 58, 226, 0
str_235:
  .byte 51, 58, 60, 32, 32, 32, 32, 32, 32, 52, 58, 62, 0
str_236:
  .byte 53, 58, 227, 32, 32, 32, 32, 32, 32, 54, 58, 228, 0
str_237:
  .byte 49, 58, 108, 98, 108, 32, 32, 32, 32, 50, 58, 103, 111, 116, 111, 0
str_238:
  .byte 48, 58, 67, 76, 69, 65, 82, 0
str_239:
  .byte 63, 148, 139, 58, 184, 0
str_240:
  .byte 61, 185, 60, 62, 186, 187, 0
str_241:
  .byte 61, 58, 79, 75, 32, 65, 67, 58, 83, 84, 79, 80, 0
str_242:
  .byte 61, 58, 71, 79, 32, 79, 78, 32, 65, 67, 58, 83, 84, 79, 80, 0
  .align 2

  .bank 6
  .org 0xc000
; sci/solve.e16.ts:77 askStart(at, length, find) at -O1
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
  ; sci/solve.e16.ts:78  askingAt = at
  sw s2, 0x0752(zero)
  ; sci/solve.e16.ts:79  askingLength = length
  sw s3, 0x0754(zero)
  ; sci/solve.e16.ts:80  finding = find
  sw s1, 0x0756(zero)
  ; sci/solve.e16.ts:81  askedFor = find ? FOR_FIND : FOR_FX
  beqz s1, .L1
  li t0, 1
  j .L2
.L1:
  li t0, 0
.L2:
  sw t0, 0x0758(zero)
  ; sci/solve.e16.ts:82  target = varAt(X)
  li t0, 3336
  sw t0, 0x075a(zero)
  ; sci/solve.e16.ts:83  label = str('X?')
  la t0, str_98
  sw t0, 0x075c(zero)
  ; sci/solve.e16.ts:84  entryLength = 0
  sw zero, 0x0786(zero)
  ; sci/solve.e16.ts:85  drawAsk()
  call drawAsk
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/solve.e16.ts:89 askRange(k, into) at -O1
;   k in s1
;   into in s2
askRange:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; into
  ; sci/solve.e16.ts:90  askedFor = FOR_TABLE
  li t0, 2
  sw t0, 0x0758(zero)
  ; sci/solve.e16.ts:91  target = into
  sw s2, 0x075a(zero)
  ; sci/solve.e16.ts:92  label = k === 0 ? str('START?') : k === 1 ? str('END?') : str('STEP?')
  bne s1, zero, .L1
  la t0, str_99
  j .L2
.L1:
  li t0, 1
  bne s1, t0, .L3
  la t0, str_100
  j .L4
.L3:
  la t0, str_101
.L4:
.L2:
  sw t0, 0x075c(zero)
  ; sci/solve.e16.ts:93  entryLength = 0
  sw zero, 0x0786(zero)
  ; sci/solve.e16.ts:94  drawAsk()
  call drawAsk
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/solve.e16.ts:98 askKey(isEquals, isDelete, isClear, t) at -O1
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
  ; sci/solve.e16.ts:99  if (isClear) return ASK_BACK
  beqz s0, .L1
  ; sci/solve.e16.ts:99  return ASK_BACK
  li a0, 1
  j .return
.L1:
  ; sci/solve.e16.ts:100  if (isEquals) {
  beqz s2, .L2
  ; sci/solve.e16.ts:101  finish()
  call finish
  ; sci/solve.e16.ts:102  return ASK_DONE
  li a0, 2
  j .return
.L2:
  ; sci/solve.e16.ts:104  if (isDelete) {
  beqz s3, .L3
  ; sci/solve.e16.ts:105  if (entryLength > 0) entryLength--
  lw t0, 0x0786(zero)
  bgeu zero, t0, .L5
  ; sci/solve.e16.ts:105  entryLength--
  lw t0, 0x0786(zero)
  addi t0, t0, -1
  sw t0, 0x0786(zero)
  j .L5
.L3:
  ; sci/solve.e16.ts:106  if (t !== 0 && entryLength < 40) {
  beq s1, zero, .L6
  lw t0, 0x0786(zero)
  li t1, 40
  bgeu t0, t1, .L6
  ; sci/solve.e16.ts:107  entry[entryLength] = t
  lw t0, 0x0786(zero)
  sb s1, entry(t0)
  ; sci/solve.e16.ts:108  entryLength++
  lw t0, 0x0786(zero)
  addi t0, t0, 1
  sw t0, 0x0786(zero)
.L6:
.L5:
  ; sci/solve.e16.ts:110  drawAsk()
  call drawAsk
  ; sci/solve.e16.ts:111  return ASK_STAY
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/solve.e16.ts:115 drawAsk() at -O1
;   col in s1
;   i in s2
drawAsk:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/solve.e16.ts:116  cls()
  call cls
  ; sci/solve.e16.ts:117  band(askedFor === FOR_TABLE ? str('TABLE') : finding ? str('FIND X') : str('f(X)'))
  lw t0, 0x0758(zero)
  li t1, 2
  bne t0, t1, .L1
  la t0, str_102
  j .L2
.L1:
  lw t0, 0x0756(zero)
  beqz t0, .L3
  la t0, str_103
  j .L4
.L3:
  la t0, str_104
.L4:
.L2:
  mv a0, t0
  call band
  ; sci/solve.e16.ts:118  textAt(label, 1, lineY(0))
  lw a0, 0x075c(zero)
  li a1, 1
  li a2, 11
  call textAt
  ; sci/solve.e16.ts:119  formatInto(target)
  lw a0, 0x075a(zero)
  call formatInto
  ; sci/solve.e16.ts:120  textRight(addr(xText), lineY(1))
  la a0, xText
  li a1, 20
  call textRight
  ; sci/solve.e16.ts:121  let col: u16 = 0
  li s1, 0 ; col
  ; sci/solve.e16.ts:122  for (let i: u16 = 0; i < entryLength; i++) col = shownAt(entry[i], col)
  li s2, 0 ; i
  j .L7
.L5:
  ; sci/solve.e16.ts:122  col = shownAt(entry[i], col)
  lbu a0, entry(s2)
  mv a1, s1
  call shownAt
  mv s1, a0 ; col
  addi s2, s2, 1
.L7:
  lw t0, 0x0786(zero)
  bltu s2, t0, .L5
  ; sci/solve.e16.ts:123  textAt(str('=:GO   AC:BACK'), 1, lineY(5))
  la a0, str_105
  li a1, 1
  li a2, 56
  call textAt
  ; sci/solve.e16.ts:124  barAt(col < 21 ? col : 20, 4)
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

; sci/solve.e16.ts:128 shownAt(t, col/c) at -O1
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
  ; sci/solve.e16.ts:129  const s = tokenText(t)
  mv a0, s3
  call tokenText
  mv s2, a0 ; s/p
  ; sci/solve.e16.ts:130  if (s === 0) {
  bne s2, zero, .L1
  ; sci/solve.e16.ts:131  if (col < 21) glyphAt(t, col * 6, 32)
  li t0, 21
  bgeu s1, t0, .L2
  ; sci/solve.e16.ts:131  glyphAt(t, col * 6, 32)
  slli t1, s1, 2
  slli t0, s1, 1
  add a1, t0, t1
  mv a0, s3
  li a2, 32
  call glyphAt
.L2:
  ; sci/solve.e16.ts:132  return col + 1
  addi a0, s1, 1
  j .return
.L1:
  ; sci/solve.e16.ts:134  let c = col
  ; sci/solve.e16.ts:135  let p = s
  ; sci/solve.e16.ts:136  while (peek(p) !== 0) {
  j .L5
.L3:
  ; sci/solve.e16.ts:137  if (c < 21) glyphAt(peek(p), c * 6, 32)
  li t0, 21
  bgeu s1, t0, .L7
  ; sci/solve.e16.ts:137  glyphAt(peek(p), c * 6, 32)
  lbu a0, 0(s2)
  slli t2, s1, 2
  slli t1, s1, 1
  add a1, t1, t2
  li a2, 32
  call glyphAt
.L7:
  ; sci/solve.e16.ts:138  c++
  addi s1, s1, 1
  ; sci/solve.e16.ts:139  p++
  addi s2, s2, 1
.L5:
  lbu t0, 0(s2)
  bne t0, zero, .L3
  ; sci/solve.e16.ts:141  return c
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/solve.e16.ts:146 formatInto(v) at -O1
;   v in s1
formatInto:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/solve.e16.ts:147  poke16(MATH_ARG, 10)
  li t0, 10
  li t1, 65366
  sw t0, 0(t1)
  ; sci/solve.e16.ts:148  math(M_FORMAT, v, addr(xText), 0)
  li a0, 57
  mv a1, s1
  la a2, xText
  li a3, 0
  call math
  ; sci/solve.e16.ts:149  xText[peek16(MATH_ARG)] = 0
  li t0, 65366
  lw t0, 0(t0)
  sb zero, xText(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/solve.e16.ts:153 finish() at -O1
finish:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:154  noCursor()
  call noCursor
  ; sci/solve.e16.ts:155  if (entryLength > 0) {
  lw t0, 0x0786(zero)
  bgeu zero, t0, .L1
  ; sci/solve.e16.ts:156  clearStack()
  call clearStack
  ; sci/solve.e16.ts:158  errFrom(ERR_PINNED | 0x7fff)
  li a0, 65535
  call errFrom
  ; sci/solve.e16.ts:159  evaluate(addr(entry), entryLength)
  lw a1, 0x0786(zero)
  la a0, entry
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/solve.e16.ts:160  errFrom(0)
  li a0, 0
  call errFrom
  ; sci/solve.e16.ts:161  copyValue(top(), target)
  call top
  lw a1, 0x075a(zero)
  call copyValue
.L1:
  ; sci/solve.e16.ts:163  if (askedFor === FOR_TABLE) return
  lw t0, 0x0758(zero)
  li t1, 2
  bne t0, t1, .L2
  ; sci/solve.e16.ts:163  return
  j .return
.L2:
  ; sci/solve.e16.ts:164  if (finding) newton()
  lw t0, 0x0756(zero)
  beqz t0, .L3
  ; sci/solve.e16.ts:164  newton()
  call newton
  j .L4
.L3:
  ; sci/solve.e16.ts:166  evalWith(varAt(X))
  li a0, 3336
  call evalWith
  ; sci/solve.e16.ts:167  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
.L4:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:172 evalWith(v) at -O1
;   v in s1
evalWith:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/solve.e16.ts:173  copyValue(v, varAt(X))
  mv a0, s1
  li a1, 3336
  call copyValue
  ; sci/solve.e16.ts:174  clearStack()
  call clearStack
  ; sci/solve.e16.ts:175  evaluate(askingAt, askingLength)
  lw a0, 0x0752(zero)
  lw a1, 0x0754(zero)
  la t0, evaluate
  li t1, 0
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/solve.e16.ts:183 newton() at -O1
;   settled in s1
;   k in s2
newton:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/solve.e16.ts:184  copyValue(varAt(X), addr(x))
  li a0, 3336
  la a1, x
  call copyValue
  ; sci/solve.e16.ts:185  inexact(addr(x))
  la a0, x
  call inexact
  ; sci/solve.e16.ts:186  let settled = false
  li s1, 0 ; settled
  ; sci/solve.e16.ts:187  for (let k: u16 = 0; k < STEPS && !settled; k++) settled = newtonStep()
  li s2, 0 ; k
  j .L3
.L1:
  ; sci/solve.e16.ts:187  settled = newtonStep()
  call newtonStep
  mv s1, a0 ; settled
  addi s2, s2, 1
.L3:
  li t0, 60
  bgeu s2, t0, .L5
  beqz s1, .L1
.L5:
  ; sci/solve.e16.ts:188  copyValue(addr(x), varAt(X))
  la a0, x
  li a1, 3336
  call copyValue
  ; sci/solve.e16.ts:189  if (!settled) fail(E_FIND, 0)
  bnez s1, .L6
  ; sci/solve.e16.ts:189  fail(E_FIND, 0)
  li a0, 4
  li a1, 0
  call fail
.L6:
  ; sci/solve.e16.ts:190  evalWith(addr(x))
  la a0, x
  call evalWith
  ; sci/solve.e16.ts:191  copyValue(top(), addr(diffValue))
  call top
  la a1, diffValue
  call copyValue
  ; sci/solve.e16.ts:192  copyValue(addr(x), varAt(X))
  la a0, x
  li a1, 3336
  call copyValue
  ; sci/solve.e16.ts:193  copyValue(addr(x), KEEP_ANS)
  la a0, x
  li a1, 3080
  call copyValue
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/solve.e16.ts:197 newtonStep() at -O1
newtonStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:198  evalWith(addr(x))
  la a0, x
  call evalWith
  ; sci/solve.e16.ts:199  copyValue(top(), addr(fx))
  call top
  la a1, fx
  call copyValue
  ; sci/solve.e16.ts:200  if (isZero(addr(fx))) return true
  la a0, fx
  call isZero
  beqz a0, .L1
  ; sci/solve.e16.ts:200  return true
  li a0, 1
  j .return
.L1:
  ; sci/solve.e16.ts:202  copyValue(addr(x), addr(step))
  la a0, x
  la a1, step
  call copyValue
  ; sci/solve.e16.ts:203  math(M_ABS, addr(step), 0, 0)
  li a0, 17
  la a1, step
  li a2, 0
  li a3, 0
  call math
  ; sci/solve.e16.ts:204  setConstant(0, 0x10)
  li a0, 0
  li a1, 16
  call setConstant
  ; sci/solve.e16.ts:205  math(M_CMP, addr(step), addr(small), 0)
  li a0, 6
  la a1, step
  la a2, small
  li a3, 0
  call math
  ; sci/solve.e16.ts:206  if (peek16(MATH_RESULT) === 0xffff) setOneInStep()
  li t0, 65370
  lw t0, 0(t0)
  li t1, 65535
  bne t0, t1, .L2
  ; sci/solve.e16.ts:206  setOneInStep()
  call setOneInStep
.L2:
  ; sci/solve.e16.ts:207  setMillionth()
  call setMillionth
  ; sci/solve.e16.ts:208  math(M_MUL, addr(step), addr(small), 0)
  li a0, 3
  la a1, step
  la a2, small
  li a3, 0
  call math
  ; sci/solve.e16.ts:209  slope()
  call slope
  ; sci/solve.e16.ts:210  if (isZero(addr(ahead))) fail(E_FIND, 0)
  la a0, ahead
  call isZero
  beqz a0, .L3
  ; sci/solve.e16.ts:210  fail(E_FIND, 0)
  li a0, 4
  li a1, 0
  call fail
.L3:
  ; sci/solve.e16.ts:212  math(M_DIV, addr(fx), addr(ahead), 0)
  li a0, 4
  la a1, fx
  la a2, ahead
  li a3, 0
  call math
  ; sci/solve.e16.ts:213  math(M_SUB, addr(x), addr(fx), 0)
  li a0, 2
  la a1, x
  la a2, fx
  li a3, 0
  call math
  ; sci/solve.e16.ts:214  return smallStep()
  call smallStep
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:218 slope() at -O1
slope:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:219  copyValue(addr(x), addr(ahead))
  la a0, x
  la a1, ahead
  call copyValue
  ; sci/solve.e16.ts:220  math(M_ADD, addr(ahead), addr(step), 0)
  li a0, 1
  la a1, ahead
  la a2, step
  li a3, 0
  call math
  ; sci/solve.e16.ts:221  evalWith(addr(ahead))
  la a0, ahead
  call evalWith
  ; sci/solve.e16.ts:222  copyValue(top(), addr(ahead))
  call top
  la a1, ahead
  call copyValue
  ; sci/solve.e16.ts:223  copyValue(addr(x), addr(small))
  la a0, x
  la a1, small
  call copyValue
  ; sci/solve.e16.ts:224  math(M_SUB, addr(small), addr(step), 0)
  li a0, 2
  la a1, small
  la a2, step
  li a3, 0
  call math
  ; sci/solve.e16.ts:225  evalWith(addr(small))
  la a0, small
  call evalWith
  ; sci/solve.e16.ts:226  math(M_SUB, addr(ahead), top(), 0)
  call top
  la a1, ahead
  mv a2, a0
  li a0, 2
  li a3, 0
  call math
  ; sci/solve.e16.ts:227  math(M_DIV, addr(ahead), addr(step), 0)
  li a0, 4
  la a1, ahead
  la a2, step
  li a3, 0
  call math
  ; sci/solve.e16.ts:228  setHalf()
  call setHalf
  ; sci/solve.e16.ts:229  math(M_MUL, addr(ahead), addr(small), 0)
  li a0, 3
  la a1, ahead
  la a2, small
  li a3, 0
  call math
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:233 smallStep() at -O1
smallStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:234  math(M_ABS, addr(fx), 0, 0)
  li a0, 17
  la a1, fx
  li a2, 0
  li a3, 0
  call math
  ; sci/solve.e16.ts:235  copyValue(addr(x), addr(step))
  la a0, x
  la a1, step
  call copyValue
  ; sci/solve.e16.ts:236  math(M_ABS, addr(step), 0, 0)
  li a0, 17
  la a1, step
  li a2, 0
  li a3, 0
  call math
  ; sci/solve.e16.ts:237  setTiny()
  call setTiny
  ; sci/solve.e16.ts:238  if (exponentBelowZero(addr(step))) {
  ; sci/solve.e16.ts:248  return peek(v + 1) >= 128
  lbu t0, step+1(zero)
  li t1, 128
  bltu t0, t1, .L1
  ; sci/solve.e16.ts:239  math(M_CMP, addr(fx), addr(small), 0)
  li a0, 6
  la a1, fx
  la a2, small
  li a3, 0
  call math
  j .L2
.L1:
  ; sci/solve.e16.ts:241  math(M_MUL, addr(step), addr(small), 0)
  li a0, 3
  la a1, step
  la a2, small
  li a3, 0
  call math
  ; sci/solve.e16.ts:242  math(M_CMP, addr(fx), addr(step), 0)
  li a0, 6
  la a1, fx
  la a2, step
  li a3, 0
  call math
.L2:
  ; sci/solve.e16.ts:244  return peek16(MATH_RESULT) !== 1
  li t0, 65370
  lw t0, 0(t0)
  li t1, 1
  sub t0, t0, t1
  snez a0, t0
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:253 setConstant(exponent, digits) at -O1
;   exponent in a0
;   digits in a1
;   k in a2
setConstant:
  ; sci/solve.e16.ts:254  for (let k: u16 = 0; k < VALUE_SIZE; k++) small[k] = 0
  li a2, 0 ; k
  j .L3
.L1:
  ; sci/solve.e16.ts:254  small[k] = 0
  sb zero, small(a2)
  addi a2, a2, 1
.L3:
  li t0, 36
  bltu a2, t0, .L1
  ; sci/solve.e16.ts:255  small[1] = exponent
  sb a0, small+1(zero)
  ; sci/solve.e16.ts:256  small[2] = digits
  sb a1, small+2(zero)
.return:
  ret

; sci/solve.e16.ts:260 setMillionth() at -O1
setMillionth:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:261  setConstant(0xfa, 0x10)
  li a0, 250
  li a1, 16
  call setConstant
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:265 setHalf() at -O1
setHalf:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:266  setConstant(0xff, 0x50)
  li a0, 255
  li a1, 80
  call setConstant
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:270 setTiny() at -O1
setTiny:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/solve.e16.ts:271  setConstant(0xf5, 0x10)
  li a0, 245
  li a1, 16
  call setConstant
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/solve.e16.ts:275 setOneInStep() at -O1
;   k in a0
setOneInStep:
  ; sci/solve.e16.ts:276  for (let k: u16 = 0; k < VALUE_SIZE; k++) step[k] = 0
  li a0, 0 ; k
  j .L3
.L1:
  ; sci/solve.e16.ts:276  step[k] = 0
  sb zero, step(a0)
  addi a0, a0, 1
.L3:
  li t0, 36
  bltu a0, t0, .L1
  ; sci/solve.e16.ts:277  step[2] = 0x10
  li t0, 16
  sb t0, step+2(zero)
.return:
  ret

; sci/cplx.e16.ts:128 ctok() at -O1
ctok:
  ; sci/cplx.e16.ts:129  return cPos < cLength ? peek(cFrom + cPos) : 0
  lw t0, 0x0940(zero)
  lw t1, 0x093e(zero)
  bgeu t0, t1, .L1
  lw t0, 0x093c(zero)
  lw t1, 0x0940(zero)
  add t0, t0, t1
  lbu t0, 0(t0)
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
.return:
  ret

; sci/cplx.e16.ts:132 cpush(at/z) at -O1
;   at/z in s1
cpush:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at/z
  ; sci/cplx.e16.ts:133  if (cDepth >= C_DEPTH) fail(E_STACK, at)
  lw t0, 0x0942(zero)
  li t1, 24
  bltu t0, t1, .L1
  ; sci/cplx.e16.ts:133  fail(E_STACK, at)
  li a0, 3
  mv a1, s1
  call fail
.L1:
  ; sci/cplx.e16.ts:134  const z = CPLX_STACK + cDepth * C_SIZE
  lw t0, 0x0942(zero)
  slli t0, t0, 4
  li t1, 12288
  add s1, t1, t0
  ; sci/cplx.e16.ts:135  cDepth++
  lw t0, 0x0942(zero)
  addi t0, t0, 1
  sw t0, 0x0942(zero)
  ; sci/cplx.e16.ts:136  wholeInto(z, 0)
  mv a0, s1
  li a1, 0
  call wholeInto
  ; sci/cplx.e16.ts:137  wholeInto(z + IM, 0)
  addi a0, s1, 8
  li a1, 0
  call wholeInto
  ; sci/cplx.e16.ts:138  return z
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/cplx.e16.ts:141 ctop() at -O1
ctop:
  ; sci/cplx.e16.ts:142  return CPLX_STACK + (cDepth - 1) * C_SIZE
  lw t0, 0x0942(zero)
  addi t0, t0, -1
  slli t0, t0, 4
  li t1, 12288
  add a0, t1, t0
.return:
  ret

; sci/cplx.e16.ts:145 cpop() at -O1
cpop:
  ; sci/cplx.e16.ts:146  cDepth--
  lw t0, 0x0942(zero)
  addi t0, t0, -1
  sw t0, 0x0942(zero)
.return:
  ret

; sci/cplx.e16.ts:155 cplxEvaluate(from/z, length) at -O1
;   from/z in s1
;   length in s2
cplxEvaluate:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; from/z
  mv s2, a1 ; length
  ; sci/cplx.e16.ts:156  cFrom = from
  sw s1, 0x093c(zero)
  ; sci/cplx.e16.ts:157  cLength = length
  sw s2, 0x093e(zero)
  ; sci/cplx.e16.ts:158  cPos = 0
  sw zero, 0x0940(zero)
  ; sci/cplx.e16.ts:159  cDepth = 0
  sw zero, 0x0942(zero)
  ; sci/cplx.e16.ts:160  poke16(MATH_ANGLE, peek(KEEP_ANGLE))
  lbu t0, 3074(zero)
  li t1, 65372
  sw t0, 0(t1)
  ; sci/cplx.e16.ts:161  if (length === 0) fail(E_SYNTAX, 0)
  bne s2, zero, .L1
  ; sci/cplx.e16.ts:161  fail(E_SYNTAX, 0)
  li a0, 2
  li a1, 0
  call fail
.L1:
  ; sci/cplx.e16.ts:162  csum()
  call csum
  ; sci/cplx.e16.ts:163  if (cPos < cLength) fail(E_SYNTAX, cPos)
  lw t0, 0x0940(zero)
  lw t1, 0x093e(zero)
  bgeu t0, t1, .L2
  ; sci/cplx.e16.ts:163  fail(E_SYNTAX, cPos)
  lw a1, 0x0940(zero)
  li a0, 2
  call fail
.L2:
  ; sci/cplx.e16.ts:164  const z = ctop()
  call ctop
  mv s1, a0 ; from/z
  ; sci/cplx.e16.ts:165  tidy(z, z + IM)
  mv a0, s1
  addi a1, s1, 8
  call tidy
  ; sci/cplx.e16.ts:166  tidy(z + IM, z)
  addi a0, s1, 8
  mv a1, s1
  call tidy
  ; sci/cplx.e16.ts:167  copy8(z, CPLX_ANS)
  mv a0, s1
  li a1, 10352
  call copy8
  ; sci/cplx.e16.ts:168  copy8(z + IM, CPLX_ANS + IM)
  addi a0, s1, 8
  li a1, 10360
  call copy8
  ; sci/cplx.e16.ts:169  polarShown = false
  sw zero, 0x0964(zero)
  ; sci/cplx.e16.ts:170  copyValue(KEEP_ANS, push(0))
  li a0, 0
  call push
  mv a1, a0
  li a0, 3080
  call copyValue
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/cplx.e16.ts:174 tidy(part, other) at -O1
;   part in s1
;   other in s2
tidy:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; part
  mv s2, a1 ; other
  ; sci/cplx.e16.ts:175  if (isZero(part)) return
  mv a0, s1
  call isZero
  beqz a0, .L1
  ; sci/cplx.e16.ts:175  return
  j .return
.L1:
  ; sci/cplx.e16.ts:177  copy8(other, ct1)
  mv a0, s2
  li a1, 12672
  call copy8
  ; sci/cplx.e16.ts:178  math(M_ABS, ct1, 0, 0)
  li a0, 17
  li a1, 12672
  li a2, 0
  li a3, 0
  call math
  ; sci/cplx.e16.ts:179  poke16(MATH_ARG, 6)
  li t0, 6
  li t1, 65366
  sw t0, 0(t1)
  ; sci/cplx.e16.ts:180  math(M_PARSE, ct2, elevenText(), 0)
  call elevenText
  li a1, 12680
  mv a2, a0
  li a0, 56
  li a3, 0
  call math
  ; sci/cplx.e16.ts:181  math(M_MUL, ct1, ct2, 0)
  li a0, 3
  li a1, 12672
  li a2, 12680
  li a3, 0
  call math
  ; sci/cplx.e16.ts:182  copy8(part, ct2)
  mv a0, s1
  li a1, 12680
  call copy8
  ; sci/cplx.e16.ts:183  math(M_ABS, ct2, 0, 0)
  li a0, 17
  li a1, 12680
  li a2, 0
  li a3, 0
  call math
  ; sci/cplx.e16.ts:184  math(M_CMP, ct2, ct1, 0)
  li a0, 6
  li a1, 12680
  li a2, 12672
  li a3, 0
  call math
  ; sci/cplx.e16.ts:185  if (i16(peek16(MATH_RESULT)) <= 0) wholeInto(part, 0)
  li t0, 65370
  lw t0, 0(t0)
  blt zero, t0, .L2
  ; sci/cplx.e16.ts:185  wholeInto(part, 0)
  mv a0, s1
  li a1, 0
  call wholeInto
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/cplx.e16.ts:191 elevenText() at -O1
elevenText:
  ; sci/cplx.e16.ts:192  eleven[0] = 0x31
  li t0, 49
  sb t0, eleven(zero)
  ; sci/cplx.e16.ts:193  eleven[1] = 0x45
  li t0, 69
  sb t0, eleven+1(zero)
  ; sci/cplx.e16.ts:194  eleven[2] = 0x2d
  li t0, 45
  sb t0, eleven+2(zero)
  ; sci/cplx.e16.ts:195  eleven[3] = 0x31
  li t0, 49
  sb t0, eleven+3(zero)
  ; sci/cplx.e16.ts:196  eleven[4] = 0x31
  li t0, 49
  sb t0, eleven+4(zero)
  ; sci/cplx.e16.ts:197  eleven[5] = 0
  sb zero, eleven+5(zero)
  ; sci/cplx.e16.ts:198  return addr(eleven)
  la a0, eleven
.return:
  ret

; sci/cplx.e16.ts:201 csum() at -O1
;   t in s1
;   at in s2
csum:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/cplx.e16.ts:202  cprod()
  call cprod
  ; sci/cplx.e16.ts:203  for (;;) {
.L1:
  ; sci/cplx.e16.ts:204  const t = ctok()
  call ctok
  mv s1, a0 ; t
  ; sci/cplx.e16.ts:205  if (t !== T_PLUS && t !== T_MINUS) return
  li t0, 43
  beq s1, t0, .L5
  li t0, 45
  beq s1, t0, .L5
  ; sci/cplx.e16.ts:205  return
  j .return
.L5:
  ; sci/cplx.e16.ts:206  const at = cPos
  lw s2, 0x0940(zero)
  ; sci/cplx.e16.ts:207  cPos++
  lw t0, 0x0940(zero)
  addi t0, t0, 1
  sw t0, 0x0940(zero)
  ; sci/cplx.e16.ts:208  cprod()
  call cprod
  ; sci/cplx.e16.ts:209  cbinary(t === T_PLUS ? M_ADD : M_SUB, at)
  li t0, 43
  bne s1, t0, .L6
  li t0, 1
  j .L7
.L6:
  li t0, 2
.L7:
  mv a0, t0
  mv a1, s2
  call cbinary
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/cplx.e16.ts:213 cprod() at -O1
;   t in s1
;   at in s2
cprod:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/cplx.e16.ts:214  cimplied()
  call cimplied
  ; sci/cplx.e16.ts:215  for (;;) {
.L1:
  ; sci/cplx.e16.ts:216  const t = ctok()
  call ctok
  mv s1, a0 ; t
  ; sci/cplx.e16.ts:217  if (t !== T_TIMES && t !== T_DIVIDE) return
  li t0, 129
  beq s1, t0, .L5
  li t0, 130
  beq s1, t0, .L5
  ; sci/cplx.e16.ts:217  return
  j .return
.L5:
  ; sci/cplx.e16.ts:218  const at = cPos
  lw s2, 0x0940(zero)
  ; sci/cplx.e16.ts:219  cPos++
  lw t0, 0x0940(zero)
  addi t0, t0, 1
  sw t0, 0x0940(zero)
  ; sci/cplx.e16.ts:220  cimplied()
  call cimplied
  ; sci/cplx.e16.ts:221  cbinary(t === T_TIMES ? M_MUL : M_DIV, at)
  li t0, 129
  bne s1, t0, .L6
  li t0, 3
  j .L7
.L6:
  li t0, 4
.L7:
  mv a0, t0
  mv a1, s2
  call cbinary
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/cplx.e16.ts:226 cstarts(t) at -O1
;   t in s1
cstarts:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/cplx.e16.ts:227  return (
  mv a0, s1
  call isDigit
  mv t1, a0
  mv t0, a0
  bnez t1, .L12
  li t0, 46
  sub t0, s1, t0
  seqz t0, t0
.L12:
  mv t1, t0
  bnez t1, .L11
  li t0, 135
  sub t0, s1, t0
  seqz t0, t0
.L11:
  mv t1, t0
  bnez t1, .L10
  li t0, 40
  sub t0, s1, t0
  seqz t0, t0
.L10:
  mv t1, t0
  bnez t1, .L9
  li t0, 105
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
  li t0, 9
  sub t0, s1, t0
  seqz t0, t0
.L4:
  mv t1, t0
  bnez t1, .L3
  mv a0, s1
  call isVariable
  mv t0, a0
.L3:
  mv t1, t0
  bnez t1, .L2
  mv a0, s1
  call isConstant
  mv t0, a0
.L2:
  mv t1, t0
  bnez t1, .L1
  mv a0, s1
  call cfunction
  mv t0, a0
.L1:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/cplx.e16.ts:244 cimplied() at -O1
;   at in s1
cimplied:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/cplx.e16.ts:245  cangled()
  call cangled
  ; sci/cplx.e16.ts:246  while (cstarts(ctok())) {
  j .L3
.L1:
  ; sci/cplx.e16.ts:247  const at = cPos
  lw s1, 0x0940(zero)
  ; sci/cplx.e16.ts:248  cangled()
  call cangled
  ; sci/cplx.e16.ts:249  cbinary(M_MUL, at)
  li a0, 3
  mv a1, s1
  call cbinary
.L3:
  call ctok
  call cstarts
  bnez a0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/cplx.e16.ts:254 cangled() at -O1
;   at in s2
;   t in s1
;   r in s3
cangled:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  ; sci/cplx.e16.ts:255  cslash()
  call cslash
  ; sci/cplx.e16.ts:256  if (ctok() !== T_POLAR) return
  call ctok
  li t0, 176
  beq a0, t0, .L1
  ; sci/cplx.e16.ts:256  return
  j .return
.L1:
  ; sci/cplx.e16.ts:257  const at = cPos
  lw s2, 0x0940(zero)
  ; sci/cplx.e16.ts:258  cPos++
  lw t0, 0x0940(zero)
  addi t0, t0, 1
  sw t0, 0x0940(zero)
  ; sci/cplx.e16.ts:259  cslash()
  call cslash
  ; sci/cplx.e16.ts:260  const t = ctop()
  call ctop
  mv s1, a0 ; t
  ; sci/cplx.e16.ts:261  const r = t - C_SIZE
  addi s3, s1, -16
  ; sci/cplx.e16.ts:262  if (!isZero(r + IM) || !isZero(t + IM)) fail(E_MATH, at)
  addi a0, s3, 8
  call isZero
  beqz a0, .L3
  addi a0, s1, 8
  call isZero
  bnez a0, .L2
.L3:
  ; sci/cplx.e16.ts:262  fail(E_MATH, at)
  li a0, 1
  mv a1, s2
  call fail
.L2:
  ; sci/cplx.e16.ts:264  copy8(t, ct1)
  mv a0, s1
  li a1, 12672
  call copy8
  ; sci/cplx.e16.ts:265  math(M_COS, ct1, 0, at)
  li a0, 23
  li a1, 12672
  li a2, 0
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:266  math(M_SIN, t, 0, at)
  li a0, 22
  mv a1, s1
  li a2, 0
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:267  math(M_MUL, t, r, at)
  li a0, 3
  mv a1, s1
  mv a2, s3
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:268  math(M_MUL, ct1, r, at)
  li a0, 3
  li a1, 12672
  mv a2, s3
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:269  copy8(ct1, r)
  li a0, 12672
  mv a1, s3
  call copy8
  ; sci/cplx.e16.ts:270  copy8(t, r + IM)
  mv a0, s1
  addi a1, s3, 8
  call copy8
  ; sci/cplx.e16.ts:271  cpop()
  call cpop
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/cplx.e16.ts:275 cslash() at -O1
;   at in s1
cslash:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/cplx.e16.ts:276  cunary()
  call cunary
  ; sci/cplx.e16.ts:277  while (ctok() === T_SLASH) {
  j .L3
.L1:
  ; sci/cplx.e16.ts:278  const at = cPos
  lw s1, 0x0940(zero)
  ; sci/cplx.e16.ts:279  cPos++
  lw t0, 0x0940(zero)
  addi t0, t0, 1
  sw t0, 0x0940(zero)
  ; sci/cplx.e16.ts:280  cunary()
  call cunary
  ; sci/cplx.e16.ts:281  cbinary(M_DIV, at)
  li a0, 4
  mv a1, s1
  call cbinary
.L3:
  call ctok
  li t0, 27
  beq a0, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/cplx.e16.ts:285 cunary() at -O1
;   t/at in s1
cunary:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/cplx.e16.ts:286  const t = ctok()
  call ctok
  mv s1, a0 ; t/at
  ; sci/cplx.e16.ts:287  if (t === T_NEG || t === T_MINUS) {
  li t0, 16
  beq s1, t0, .L2
  li t0, 45
  bne s1, t0, .L1
.L2:
  ; sci/cplx.e16.ts:288  const at = cPos
  lw s1, 0x0940(zero)
  ; sci/cplx.e16.ts:289  cPos++
  lw t0, 0x0940(zero)
  addi t0, t0, 1
  sw t0, 0x0940(zero)
  ; sci/cplx.e16.ts:290  cunary()
  call cunary
  ; sci/cplx.e16.ts:291  math(M_NEG, ctop(), 0, at)
  call ctop
  mv a1, a0
  li a0, 16
  li a2, 0
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:292  math(M_NEG, ctop() + IM, 0, at)
  call ctop
  addi a1, a0, 8
  li a0, 16
  li a2, 0
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:293  return
  j .return
.L1:
  ; sci/cplx.e16.ts:295  if (t === T_PLUS) {
  li t0, 43
  bne s1, t0, .L3
  ; sci/cplx.e16.ts:296  cPos++
  lw t0, 0x0940(zero)
  addi t0, t0, 1
  sw t0, 0x0940(zero)
  ; sci/cplx.e16.ts:297  cunary()
  call cunary
  ; sci/cplx.e16.ts:298  return
  j .return
.L3:
  ; sci/cplx.e16.ts:300  cpost()
  call cpost
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/cplx.e16.ts:303 cpost() at -O1
;   t/one in s1
;   at in s2
;   n/z in s3
cpost:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; sci/cplx.e16.ts:304  cprimary()
  call cprimary
  ; sci/cplx.e16.ts:305  for (;;) {
.L1:
  ; sci/cplx.e16.ts:306  const t = ctok()
  call ctok
  mv s1, a0 ; t/one
  ; sci/cplx.e16.ts:307  const at = cPos
  lw s2, 0x0940(zero)
  ; sci/cplx.e16.ts:308  if (t === T_POW) {
  li t0, 17
  bne s1, t0, .L5
  ; sci/cplx.e16.ts:309  cPos++
  lw t0, 0x0940(zero)
  addi t0, t0, 1
  sw t0, 0x0940(zero)
  ; sci/cplx.e16.ts:310  csum()
  call csum
  ; sci/cplx.e16.ts:311  if (ctok() === T_CLOSE) cPos++
  call ctok
  li t0, 41
  bne a0, t0, .L6
  ; sci/cplx.e16.ts:311  cPos++
  lw t0, 0x0940(zero)
  addi t0, t0, 1
  sw t0, 0x0940(zero)
.L6:
  ; sci/cplx.e16.ts:312  cpower(at)
  mv a0, s2
  call cpower
  j .L1
.L5:
  ; sci/cplx.e16.ts:313  if (t === T_SQUARE || t === T_CUBE) {
  li t0, 132
  beq s1, t0, .L9
  li t0, 133
  bne s1, t0, .L8
.L9:
  ; sci/cplx.e16.ts:314  cPos++
  lw t0, 0x0940(zero)
  addi t0, t0, 1
  sw t0, 0x0940(zero)
  ; sci/cplx.e16.ts:315  const n = cpush(at)
  mv a0, s2
  call cpush
  mv s3, a0 ; n/z
  ; sci/cplx.e16.ts:316  wholeInto(n, t === T_SQUARE ? 2 : 3)
  mv t0, s3
  mv t1, s1
  li t2, 132
  bne t1, t2, .L10
  li t1, 2
  j .L11
.L10:
  li t1, 3
.L11:
  mv a0, t0
  mv a1, t1
  call wholeInto
  ; sci/cplx.e16.ts:317  cpower(at)
  mv a0, s2
  call cpower
  j .L1
.L8:
  ; sci/cplx.e16.ts:318  if (t === T_INVERSE) {
  li t0, 134
  bne s1, t0, .L13
  ; sci/cplx.e16.ts:319  cPos++
  lw t0, 0x0940(zero)
  addi t0, t0, 1
  sw t0, 0x0940(zero)
  ; sci/cplx.e16.ts:320  const z = ctop()
  call ctop
  mv s3, a0 ; n/z
  ; sci/cplx.e16.ts:321  const one = cpush(at)
  mv a0, s2
  call cpush
  mv s1, a0 ; t/one
  ; sci/cplx.e16.ts:322  wholeInto(one, 1)
  mv a0, s1
  li a1, 1
  call wholeInto
  ; sci/cplx.e16.ts:323  cswap(z, one)
  mv a0, s3
  mv a1, s1
  call cswap
  ; sci/cplx.e16.ts:324  cbinary(M_DIV, at)
  li a0, 4
  mv a1, s2
  call cbinary
  j .L1
.L13:
  ; sci/cplx.e16.ts:325  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/cplx.e16.ts:330 cswap(a, b) at -O1
;   a in a0
;   b in a1
;   i in a2
;   v in a3
cswap:
  ; sci/cplx.e16.ts:331  for (let i: u16 = 0; i < C_SIZE; i++) {
  li a2, 0 ; i
  j .L3
.L1:
  ; sci/cplx.e16.ts:332  const v = peek(a + i)
  add t0, a0, a2
  lbu a3, 0(t0)
  ; sci/cplx.e16.ts:333  poke(a + i, peek(b + i))
  add t0, a0, a2
  add t1, a1, a2
  lbu t1, 0(t1)
  sb t1, 0(t0)
  ; sci/cplx.e16.ts:334  poke(b + i, v)
  add t0, a1, a2
  sb a3, 0(t0)
  addi a2, a2, 1
.L3:
  li t0, 16
  bltu a2, t0, .L1
.return:
  ret

; sci/cplx.e16.ts:338 cprimary() at -O1
;   t in s1
;   at in s3
;   z in s2
cprimary:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  ; sci/cplx.e16.ts:339  const t = ctok()
  call ctok
  mv s1, a0 ; t
  ; sci/cplx.e16.ts:340  const at = cPos
  lw s3, 0x0940(zero)
  ; sci/cplx.e16.ts:341  if (isDigit(t) || t === T_POINT || t === T_EXP) {
  mv a0, s1
  call isDigit
  bnez a0, .L2
  li t0, 46
  beq s1, t0, .L2
  li t0, 135
  bne s1, t0, .L1
.L2:
  ; sci/cplx.e16.ts:342  cnumber()
  call cnumber
  ; sci/cplx.e16.ts:343  return
  j .return
.L1:
  ; sci/cplx.e16.ts:345  if (t === 0) fail(E_SYNTAX, at)
  bne s1, zero, .L3
  ; sci/cplx.e16.ts:345  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s3
  call fail
.L3:
  ; sci/cplx.e16.ts:346  cPos++
  lw t0, 0x0940(zero)
  addi t0, t0, 1
  sw t0, 0x0940(zero)
  ; sci/cplx.e16.ts:347  const z = cpush(at)
  mv a0, s3
  call cpush
  mv s2, a0 ; z
  ; sci/cplx.e16.ts:348  if (t === T_I) wholeInto(z + IM, 1)
  li t0, 105
  bne s1, t0, .L4
  ; sci/cplx.e16.ts:348  wholeInto(z + IM, 1)
  addi a0, s2, 8
  li a1, 1
  call wholeInto
  j .L5
.L4:
  ; sci/cplx.e16.ts:349  if (t === T_PI) math(M_PI, z, 0, at)
  li t0, 128
  bne s1, t0, .L6
  ; sci/cplx.e16.ts:349  math(M_PI, z, 0, at)
  li a0, 32
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L7
.L6:
  ; sci/cplx.e16.ts:350  if (t === T_E) {
  li t0, 101
  bne s1, t0, .L8
  ; sci/cplx.e16.ts:351  wholeInto(z, 1)
  mv a0, s2
  li a1, 1
  call wholeInto
  ; sci/cplx.e16.ts:352  math(M_EXP, z, 0, at)
  li a0, 30
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  j .L9
.L8:
  ; sci/cplx.e16.ts:353  if (t === T_TEN) wholeInto(z, 10)
  li t0, 21
  bne s1, t0, .L10
  ; sci/cplx.e16.ts:353  wholeInto(z, 10)
  mv a0, s2
  li a1, 10
  call wholeInto
  j .L11
.L10:
  ; sci/cplx.e16.ts:354  if (t === T_ANS) {
  li t0, 20
  bne s1, t0, .L12
  ; sci/cplx.e16.ts:355  copy8(CPLX_ANS, z)
  li a0, 10352
  mv a1, s2
  call copy8
  ; sci/cplx.e16.ts:356  copy8(CPLX_ANS + IM, z + IM)
  li a0, 10360
  addi a1, s2, 8
  call copy8
  j .L13
.L12:
  ; sci/cplx.e16.ts:357  if (isVariable(t)) copy8(varAt(t), z)
  mv a0, s1
  call isVariable
  beqz a0, .L14
  ; sci/cplx.e16.ts:357  copy8(varAt(t), z)
  mv a0, s1
  call varAt
  mv a1, s2
  call copy8
  j .L15
.L14:
  ; sci/cplx.e16.ts:358  if (isConstant(t)) {
  mv a0, s1
  call isConstant
  beqz a0, .L16
  ; sci/cplx.e16.ts:359  constValue(t, ct4)
  mv a0, s1
  li a1, 12696
  la t0, constValue
  li t1, 10
  call far_call
  ; sci/cplx.e16.ts:360  copy8(ct4, z)
  li a0, 12696
  mv a1, s2
  call copy8
  j .L17
.L16:
  ; sci/cplx.e16.ts:362  cpop()
  call cpop
  ; sci/cplx.e16.ts:363  cbracketed(t, at)
  mv a0, s1
  mv a1, s3
  call cbracketed
.L17:
.L15:
.L13:
.L11:
.L9:
.L7:
.L5:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/cplx.e16.ts:368 cbracketed(t, at) at -O1
;   t in s1
;   at in s2
cbracketed:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t
  mv s2, a1 ; at
  ; sci/cplx.e16.ts:369  if (t !== T_OPEN && !cfunction(t)) fail(E_SYNTAX, at)
  li t0, 40
  beq s1, t0, .L1
  mv a0, s1
  call cfunction
  bnez a0, .L1
  ; sci/cplx.e16.ts:369  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s2
  call fail
.L1:
  ; sci/cplx.e16.ts:370  csum()
  call csum
  ; sci/cplx.e16.ts:371  if (ctok() === T_CLOSE) cPos++
  call ctok
  li t0, 41
  bne a0, t0, .L2
  ; sci/cplx.e16.ts:371  cPos++
  lw t0, 0x0940(zero)
  addi t0, t0, 1
  sw t0, 0x0940(zero)
.L2:
  ; sci/cplx.e16.ts:372  if (t !== T_OPEN) capply(t, at)
  li t0, 40
  beq s1, t0, .L3
  ; sci/cplx.e16.ts:372  capply(t, at)
  mv a0, s1
  mv a1, s2
  call capply
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/cplx.e16.ts:376 cfunction(t) at -O1
;   t in s1
cfunction:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/cplx.e16.ts:377  return (t >= T_ARG && t <= T_IM) || t === T_ABS || realOp(t) !== 0
  li t0, 163
  sltu t0, s1, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L3
  li t0, 166
  sltu t0, t0, s1
  xori t0, t0, 1
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 230
  sub t0, s1, t0
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  mv a0, s1
  call realOp
  sub t0, a0, zero
  snez t0, t0
.L1:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/cplx.e16.ts:381 realOp(t) at -O1
;   t in a0
realOp:
  ; sci/cplx.e16.ts:382  switch (t) {
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
  ; sci/cplx.e16.ts:384  return M_SIN
  li a0, 22
  ret
.L3:
  ; sci/cplx.e16.ts:386  return M_COS
  li a0, 23
  ret
.L4:
  ; sci/cplx.e16.ts:388  return M_TAN
  li a0, 24
  ret
.L5:
  ; sci/cplx.e16.ts:390  return M_ASN
  li a0, 25
  ret
.L6:
  ; sci/cplx.e16.ts:392  return M_ACS
  li a0, 26
  ret
.L7:
  ; sci/cplx.e16.ts:394  return M_ATN
  li a0, 27
  ret
.L8:
  ; sci/cplx.e16.ts:396  return M_LOG
  li a0, 29
  ret
.L9:
  ; sci/cplx.e16.ts:398  return M_LN
  li a0, 28
  ret
.L1:
  ; sci/cplx.e16.ts:400  return t === T_SQRT ? M_SQR : 0
  li t0, 9
  bne a0, t0, .L10
  li t0, 21
  j .L11
.L10:
  li t0, 0
.L11:
  mv a0, t0
.return:
  ret

; sci/cplx.e16.ts:403 capply(t, at) at -O1
;   t in s2
;   at in s3
;   z in s1
capply:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; t
  mv s3, a1 ; at
  ; sci/cplx.e16.ts:404  const z = ctop()
  call ctop
  mv s1, a0 ; z
  ; sci/cplx.e16.ts:405  if (t === T_SQRT) csqrt(z, at)
  li t0, 9
  bne s2, t0, .L1
  ; sci/cplx.e16.ts:405  csqrt(z, at)
  mv a0, s1
  mv a1, s3
  call csqrt
  j .L2
.L1:
  ; sci/cplx.e16.ts:406  if (t === T_ABS) {
  li t0, 230
  bne s2, t0, .L3
  ; sci/cplx.e16.ts:407  cabs(z, at)
  mv a0, s1
  mv a1, s3
  call cabs
  ; sci/cplx.e16.ts:408  wholeInto(z + IM, 0)
  addi a0, s1, 8
  li a1, 0
  call wholeInto
  j .L4
.L3:
  ; sci/cplx.e16.ts:409  if (t === T_ARG) {
  li t0, 163
  bne s2, t0, .L5
  ; sci/cplx.e16.ts:410  copy8(z + IM, ct1)
  addi a0, s1, 8
  li a1, 12672
  call copy8
  ; sci/cplx.e16.ts:411  math(M_ATN2, ct1, z, at)
  li a0, 39
  li a1, 12672
  mv a2, s1
  mv a3, s3
  call math
  ; sci/cplx.e16.ts:412  copy8(ct1, z)
  li a0, 12672
  mv a1, s1
  call copy8
  ; sci/cplx.e16.ts:413  wholeInto(z + IM, 0)
  addi a0, s1, 8
  li a1, 0
  call wholeInto
  j .L6
.L5:
  ; sci/cplx.e16.ts:414  if (t === T_CONJ) math(M_NEG, z + IM, 0, at)
  li t0, 164
  bne s2, t0, .L7
  ; sci/cplx.e16.ts:414  math(M_NEG, z + IM, 0, at)
  li a0, 16
  addi a1, s1, 8
  li a2, 0
  mv a3, s3
  call math
  j .L8
.L7:
  ; sci/cplx.e16.ts:415  if (t === T_RE) wholeInto(z + IM, 0)
  li t0, 165
  bne s2, t0, .L9
  ; sci/cplx.e16.ts:415  wholeInto(z + IM, 0)
  addi a0, s1, 8
  li a1, 0
  call wholeInto
  j .L10
.L9:
  ; sci/cplx.e16.ts:416  if (t === T_IM) {
  li t0, 166
  bne s2, t0, .L11
  ; sci/cplx.e16.ts:417  copy8(z + IM, z)
  addi a0, s1, 8
  mv a1, s1
  call copy8
  ; sci/cplx.e16.ts:418  wholeInto(z + IM, 0)
  addi a0, s1, 8
  li a1, 0
  call wholeInto
  j .L12
.L11:
  ; sci/cplx.e16.ts:420  if (!isZero(z + IM)) fail(E_MATH, at)
  addi a0, s1, 8
  call isZero
  bnez a0, .L13
  ; sci/cplx.e16.ts:420  fail(E_MATH, at)
  li a0, 1
  mv a1, s3
  call fail
.L13:
  ; sci/cplx.e16.ts:421  math(realOp(t), z, 0, at)
  mv a0, s2
  call realOp
  mv a1, s1
  li a2, 0
  mv a3, s3
  call math
.L12:
.L10:
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

; sci/cplx.e16.ts:426 cabs(z, at) at -O1
;   z in s1
;   at in s2
cabs:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; z
  mv s2, a1 ; at
  ; sci/cplx.e16.ts:427  copy8(z, ct1)
  mv a0, s1
  li a1, 12672
  call copy8
  ; sci/cplx.e16.ts:428  math(M_ABS, ct1, 0, at)
  li a0, 17
  li a1, 12672
  li a2, 0
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:429  copy8(z + IM, ct2)
  addi a0, s1, 8
  li a1, 12680
  call copy8
  ; sci/cplx.e16.ts:430  math(M_ABS, ct2, 0, at)
  li a0, 17
  li a1, 12680
  li a2, 0
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:431  math(M_CMP, ct1, ct2, at)
  li a0, 6
  li a1, 12672
  li a2, 12680
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:432  if (i16(peek16(MATH_RESULT)) < 0) {
  li t0, 65370
  lw t0, 0(t0)
  bge t0, zero, .L1
  ; sci/cplx.e16.ts:433  copy8(ct2, z)
  li a0, 12680
  mv a1, s1
  call copy8
  ; sci/cplx.e16.ts:434  copy8(ct1, ct2)
  li a0, 12672
  li a1, 12680
  call copy8
  ; sci/cplx.e16.ts:435  copy8(z, ct1)
  mv a0, s1
  li a1, 12672
  call copy8
.L1:
  ; sci/cplx.e16.ts:438  if (isZero(ct1)) {
  li a0, 12672
  call isZero
  beqz a0, .L2
  ; sci/cplx.e16.ts:439  wholeInto(z, 0)
  mv a0, s1
  li a1, 0
  call wholeInto
  ; sci/cplx.e16.ts:440  return
  j .return
.L2:
  ; sci/cplx.e16.ts:442  math(M_DIV, ct2, ct1, at)
  li a0, 4
  li a1, 12680
  li a2, 12672
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:443  math(M_MUL, ct2, ct2, at)
  li a0, 3
  li a1, 12680
  li a2, 12680
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:444  wholeInto(z, 1)
  mv a0, s1
  li a1, 1
  call wholeInto
  ; sci/cplx.e16.ts:445  math(M_ADD, ct2, z, at)
  li a0, 1
  li a1, 12680
  mv a2, s1
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:446  math(M_SQR, ct2, 0, at)
  li a0, 21
  li a1, 12680
  li a2, 0
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:447  math(M_MUL, ct2, ct1, at)
  li a0, 3
  li a1, 12680
  li a2, 12672
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:448  copy8(ct2, z)
  li a0, 12680
  mv a1, s1
  call copy8
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/cplx.e16.ts:452 csqrt(z, at) at -O1
;   z in s1
;   at in s2
;   negative in s3
csqrt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; z
  mv s2, a1 ; at
  ; sci/cplx.e16.ts:453  copy8(z, ct3)
  mv a0, s1
  li a1, 12688
  call copy8
  ; sci/cplx.e16.ts:454  const negative = isNegative(z + IM)
  addi a0, s1, 8
  call isNegative
  mv s3, a0 ; negative
  ; sci/cplx.e16.ts:455  cabs(z, at)
  mv a0, s1
  mv a1, s2
  call cabs
  ; sci/cplx.e16.ts:456  copy8(z, ct4)
  mv a0, s1
  li a1, 12696
  call copy8
  ; sci/cplx.e16.ts:457  wholeInto(ct2, 2)
  li a0, 12680
  li a1, 2
  call wholeInto
  ; sci/cplx.e16.ts:459  math(M_ADD, z, ct3, at)
  li a0, 1
  mv a1, s1
  li a2, 12688
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:460  math(M_DIV, z, ct2, at)
  li a0, 4
  mv a1, s1
  li a2, 12680
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:461  math(M_SQR, z, 0, at)
  li a0, 21
  mv a1, s1
  li a2, 0
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:462  math(M_SUB, ct4, ct3, at)
  li a0, 2
  li a1, 12696
  li a2, 12688
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:463  math(M_DIV, ct4, ct2, at)
  li a0, 4
  li a1, 12696
  li a2, 12680
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:464  math(M_SQR, ct4, 0, at)
  li a0, 21
  li a1, 12696
  li a2, 0
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:465  copy8(ct4, z + IM)
  li a0, 12696
  addi a1, s1, 8
  call copy8
  ; sci/cplx.e16.ts:466  if (negative) math(M_NEG, z + IM, 0, at)
  beqz s3, .L1
  ; sci/cplx.e16.ts:466  math(M_NEG, z + IM, 0, at)
  li a0, 16
  addi a1, s1, 8
  li a2, 0
  mv a3, s2
  call math
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/cplx.e16.ts:472 cbinary(op, at) at -O1
;   op in s1
;   at in s3
;   b in s2
;   a in s0
cbinary:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; op
  mv s3, a1 ; at
  ; sci/cplx.e16.ts:473  const b = ctop()
  call ctop
  mv s2, a0 ; b
  ; sci/cplx.e16.ts:474  const a = b - C_SIZE
  addi s0, s2, -16
  ; sci/cplx.e16.ts:475  if (op === M_ADD || op === M_SUB) {
  li t0, 1
  beq s1, t0, .L2
  li t0, 2
  bne s1, t0, .L1
.L2:
  ; sci/cplx.e16.ts:476  math(op, a, b, at)
  mv a0, s1
  mv a1, s0
  mv a2, s2
  mv a3, s3
  call math
  ; sci/cplx.e16.ts:477  math(op, a + IM, b + IM, at)
  mv a0, s1
  addi a1, s0, 8
  addi a2, s2, 8
  mv a3, s3
  call math
  j .L3
.L1:
  ; sci/cplx.e16.ts:478  if (op === M_MUL) cmul(a, b, at)
  li t0, 3
  bne s1, t0, .L4
  ; sci/cplx.e16.ts:478  cmul(a, b, at)
  mv a0, s0
  mv a1, s2
  mv a2, s3
  call cmul
  j .L5
.L4:
  ; sci/cplx.e16.ts:479  cdiv(a, b, at)
  mv a0, s0
  mv a1, s2
  mv a2, s3
  call cdiv
.L5:
.L3:
  ; sci/cplx.e16.ts:480  cpop()
  call cpop
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/cplx.e16.ts:484 cmul(a, b, at) at -O1
;   a in s1
;   b in s3
;   at in s2
cmul:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; a
  mv s3, a1 ; b
  mv s2, a2 ; at
  ; sci/cplx.e16.ts:485  copy8(a, ct1)
  mv a0, s1
  li a1, 12672
  call copy8
  ; sci/cplx.e16.ts:486  math(M_MUL, ct1, b, at)
  li a0, 3
  li a1, 12672
  mv a2, s3
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:487  copy8(a + IM, ct2)
  addi a0, s1, 8
  li a1, 12680
  call copy8
  ; sci/cplx.e16.ts:488  math(M_MUL, ct2, b + IM, at)
  li a0, 3
  li a1, 12680
  addi a2, s3, 8
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:489  math(M_SUB, ct1, ct2, at)
  li a0, 2
  li a1, 12672
  li a2, 12680
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:490  copy8(a, ct2)
  mv a0, s1
  li a1, 12680
  call copy8
  ; sci/cplx.e16.ts:491  math(M_MUL, ct2, b + IM, at)
  li a0, 3
  li a1, 12680
  addi a2, s3, 8
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:492  copy8(a + IM, ct3)
  addi a0, s1, 8
  li a1, 12688
  call copy8
  ; sci/cplx.e16.ts:493  math(M_MUL, ct3, b, at)
  li a0, 3
  li a1, 12688
  mv a2, s3
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:494  math(M_ADD, ct2, ct3, at)
  li a0, 1
  li a1, 12680
  li a2, 12688
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:495  copy8(ct1, a)
  li a0, 12672
  mv a1, s1
  call copy8
  ; sci/cplx.e16.ts:496  copy8(ct2, a + IM)
  li a0, 12680
  addi a1, s1, 8
  call copy8
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/cplx.e16.ts:504 cdiv(a, b/small, at) at -O1
;   a in s3
;   b/small in s2
;   at in s1
;   across in s0
;   big in 0(sp)
cdiv:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  sw s0, 10(sp)
  mv s3, a0 ; a
  mv s2, a1 ; b/small
  mv s1, a2 ; at
  ; sci/cplx.e16.ts:505  if (isZero(b) && isZero(b + IM)) fail(E_MATH, at)
  mv a0, s2
  call isZero
  beqz a0, .L1
  addi a0, s2, 8
  call isZero
  beqz a0, .L1
  ; sci/cplx.e16.ts:505  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L1:
  ; sci/cplx.e16.ts:506  copy8(b, ct1)
  mv a0, s2
  li a1, 12672
  call copy8
  ; sci/cplx.e16.ts:507  math(M_ABS, ct1, 0, at)
  li a0, 17
  li a1, 12672
  li a2, 0
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:508  copy8(b + IM, ct2)
  addi a0, s2, 8
  li a1, 12680
  call copy8
  ; sci/cplx.e16.ts:509  math(M_ABS, ct2, 0, at)
  li a0, 17
  li a1, 12680
  li a2, 0
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:510  math(M_CMP, ct1, ct2, at)
  li a0, 6
  li a1, 12672
  li a2, 12680
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:511  const across = i16(peek16(MATH_RESULT)) >= 0
  li t0, 65370
  lw t0, 0(t0)
  slt t0, t0, zero
  xori s0, t0, 1
  ; sci/cplx.e16.ts:513  const big = across ? b : b + IM
  beqz s0, .L2
  mv t0, s2
  j .L3
.L2:
  addi t0, s2, 8
.L3:
  sw t0, 0(sp) ; big
  ; sci/cplx.e16.ts:514  const small = across ? b + IM : b
  beqz s0, .L4
  addi t0, s2, 8
  j .L5
.L4:
  mv t0, s2
.L5:
  mv s2, t0 ; b/small
  ; sci/cplx.e16.ts:515  copy8(small, ct1)
  mv a0, s2
  li a1, 12672
  call copy8
  ; sci/cplx.e16.ts:516  math(M_DIV, ct1, big, at)
  li a0, 4
  li a1, 12672
  lw a2, 0(sp)
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:517  copy8(small, ct4)
  mv a0, s2
  li a1, 12696
  call copy8
  ; sci/cplx.e16.ts:518  math(M_MUL, ct4, ct1, at)
  li a0, 3
  li a1, 12696
  li a2, 12672
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:519  math(M_ADD, ct4, big, at)
  li a0, 1
  li a1, 12696
  lw a2, 0(sp)
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:521  copy8(across ? a + IM : a, ct2)
  beqz s0, .L6
  addi t0, s3, 8
  j .L7
.L6:
  mv t0, s3
.L7:
  mv a0, t0
  li a1, 12680
  call copy8
  ; sci/cplx.e16.ts:522  math(M_MUL, ct2, ct1, at)
  li a0, 3
  li a1, 12680
  li a2, 12672
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:523  math(M_ADD, ct2, across ? a : a + IM, at)
  li t0, 1
  li t1, 12680
  mv t2, s0
  beqz t2, .L8
  mv t2, s3
  j .L9
.L8:
  addi t2, s3, 8
.L9:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:524  copy8(across ? a : a + IM, ct3)
  beqz s0, .L10
  mv t0, s3
  j .L11
.L10:
  addi t0, s3, 8
.L11:
  mv a0, t0
  li a1, 12688
  call copy8
  ; sci/cplx.e16.ts:525  math(M_MUL, ct3, ct1, at)
  li a0, 3
  li a1, 12688
  li a2, 12672
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:526  if (across) {
  beqz s0, .L12
  ; sci/cplx.e16.ts:527  copy8(a + IM, ct1)
  addi a0, s3, 8
  li a1, 12672
  call copy8
  ; sci/cplx.e16.ts:528  math(M_SUB, ct1, ct3, at)
  li a0, 2
  li a1, 12672
  li a2, 12688
  mv a3, s1
  call math
  j .L13
.L12:
  ; sci/cplx.e16.ts:530  copy8(ct3, ct1)
  li a0, 12688
  li a1, 12672
  call copy8
  ; sci/cplx.e16.ts:531  math(M_SUB, ct1, a, at)
  li a0, 2
  li a1, 12672
  mv a2, s3
  mv a3, s1
  call math
.L13:
  ; sci/cplx.e16.ts:533  math(M_DIV, ct2, ct4, at)
  li a0, 4
  li a1, 12680
  li a2, 12696
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:534  math(M_DIV, ct1, ct4, at)
  li a0, 4
  li a1, 12672
  li a2, 12696
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:535  copy8(ct2, a)
  li a0, 12680
  mv a1, s3
  call copy8
  ; sci/cplx.e16.ts:536  copy8(ct1, a + IM)
  li a0, 12672
  addi a1, s3, 8
  call copy8
.return:
  lw ra, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  lw s0, 10(sp)
  addi sp, sp, 12
  ret

; sci/cplx.e16.ts:543 cpower(at) at -O1
;   at in s3
;   w in s2
;   z in s1
;   n in s0
;   negative in 2(sp)
;   k in 0(sp)
cpower:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s2, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv s3, a0 ; at
  ; sci/cplx.e16.ts:544  const w = ctop()
  call ctop
  mv s2, a0 ; w
  ; sci/cplx.e16.ts:545  const z = w - C_SIZE
  addi s1, s2, -16
  ; sci/cplx.e16.ts:546  if (isZero(w + IM) && cSmallWhole(w, at)) {
  addi a0, s2, 8
  call isZero
  beqz a0, .L1
  mv a0, s2
  mv a1, s3
  call cSmallWhole
  beqz a0, .L1
  ; sci/cplx.e16.ts:547  let n = i16(peek16(MATH_ARG))
  li t0, 65366
  lw s0, 0(t0)
  ; sci/cplx.e16.ts:548  const negative = n < 0
  slti t0, s0, 0
  sw t0, 2(sp) ; negative
  ; sci/cplx.e16.ts:549  if (negative) n = -n
  lw t0, 2(sp) ; negative
  beqz t0, .L2
  ; sci/cplx.e16.ts:549  n = -n
  neg s0, s0
.L2:
  ; sci/cplx.e16.ts:551  copy8(z, w)
  mv a0, s1
  mv a1, s2
  call copy8
  ; sci/cplx.e16.ts:552  copy8(z + IM, w + IM)
  addi a0, s1, 8
  addi a1, s2, 8
  call copy8
  ; sci/cplx.e16.ts:553  wholeInto(z, 1)
  mv a0, s1
  li a1, 1
  call wholeInto
  ; sci/cplx.e16.ts:554  wholeInto(z + IM, 0)
  addi a0, s1, 8
  li a1, 0
  call wholeInto
  ; sci/cplx.e16.ts:555  for (let k: i16 = 0; k < n; k++) cmul(z, w, at)
  sw zero, 0(sp) ; k
  j .L5
.L3:
  ; sci/cplx.e16.ts:555  cmul(z, w, at)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call cmul
  lw t0, 0(sp) ; k
  addi t0, t0, 1
  sw t0, 0(sp) ; k
.L5:
  lw t0, 0(sp) ; k
  blt t0, s0, .L3
  ; sci/cplx.e16.ts:556  if (negative) {
  lw t0, 2(sp) ; negative
  beqz t0, .L7
  ; sci/cplx.e16.ts:557  cswap(z, w)
  mv a0, s1
  mv a1, s2
  call cswap
  ; sci/cplx.e16.ts:558  wholeInto(z, 1)
  mv a0, s1
  li a1, 1
  call wholeInto
  ; sci/cplx.e16.ts:559  wholeInto(z + IM, 0)
  addi a0, s1, 8
  li a1, 0
  call wholeInto
  ; sci/cplx.e16.ts:560  cdiv(z, w, at)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call cdiv
.L7:
  ; sci/cplx.e16.ts:562  cpop()
  call cpop
  ; sci/cplx.e16.ts:563  return
  j .return
.L1:
  ; sci/cplx.e16.ts:565  cpowGeneral(z, w, at)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call cpowGeneral
  ; sci/cplx.e16.ts:566  cpop()
  call cpop
.return:
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; sci/cplx.e16.ts:570 cSmallWhole(v, at) at -O1
;   v in s2
;   at in s1
cSmallWhole:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; v
  mv s1, a1 ; at
  ; sci/cplx.e16.ts:571  copy8(v, ct1)
  mv a0, s2
  li a1, 12672
  call copy8
  ; sci/cplx.e16.ts:572  math(M_FRAC, ct1, 0, at)
  li a0, 19
  li a1, 12672
  li a2, 0
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:573  if (!isZero(ct1)) return false
  li a0, 12672
  call isZero
  bnez a0, .L1
  ; sci/cplx.e16.ts:573  return false
  li a0, 0
  j .return
.L1:
  ; sci/cplx.e16.ts:574  copy8(v, ct1)
  mv a0, s2
  li a1, 12672
  call copy8
  ; sci/cplx.e16.ts:575  math(M_ABS, ct1, 0, at)
  li a0, 17
  li a1, 12672
  li a2, 0
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:576  wholeInto(ct2, 64)
  li a0, 12680
  li a1, 64
  call wholeInto
  ; sci/cplx.e16.ts:577  math(M_CMP, ct1, ct2, at)
  li a0, 6
  li a1, 12672
  li a2, 12680
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:578  if (i16(peek16(MATH_RESULT)) > 0) return false
  li t0, 65370
  lw t0, 0(t0)
  bge zero, t0, .L2
  ; sci/cplx.e16.ts:578  return false
  li a0, 0
  j .return
.L2:
  ; sci/cplx.e16.ts:579  copy8(v, ct1)
  mv a0, s2
  li a1, 12672
  call copy8
  ; sci/cplx.e16.ts:580  math(M_TOINT, ct1, 0, at)
  li a0, 49
  li a1, 12672
  li a2, 0
  mv a3, s1
  call math
  ; sci/cplx.e16.ts:581  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/cplx.e16.ts:585 cpowGeneral(z, w, at) at -O1
;   z in s1
;   w in s3
;   at in s2
cpowGeneral:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; z
  mv s3, a1 ; w
  mv s2, a2 ; at
  ; sci/cplx.e16.ts:586  if (isZero(z) && isZero(z + IM)) {
  mv a0, s1
  call isZero
  beqz a0, .L1
  addi a0, s1, 8
  call isZero
  beqz a0, .L1
  ; sci/cplx.e16.ts:587  if (isNegative(w) || isZero(w)) fail(E_MATH, at)
  mv a0, s3
  call isNegative
  bnez a0, .L3
  mv a0, s3
  call isZero
  beqz a0, .L2
.L3:
  ; sci/cplx.e16.ts:587  fail(E_MATH, at)
  li a0, 1
  mv a1, s2
  call fail
.L2:
  ; sci/cplx.e16.ts:588  return
  j .return
.L1:
  ; sci/cplx.e16.ts:590  poke16(MATH_ANGLE, 1)
  li t0, 1
  li t1, 65372
  sw t0, 0(t1)
  ; sci/cplx.e16.ts:592  copy8(z + IM, ct3)
  addi a0, s1, 8
  li a1, 12688
  call copy8
  ; sci/cplx.e16.ts:593  math(M_ATN2, ct3, z, at)
  li a0, 39
  li a1, 12688
  mv a2, s1
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:594  cabs(z, at)
  mv a0, s1
  mv a1, s2
  call cabs
  ; sci/cplx.e16.ts:595  math(M_LN, z, 0, at)
  li a0, 28
  mv a1, s1
  li a2, 0
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:596  copy8(ct3, z + IM)
  li a0, 12688
  addi a1, s1, 8
  call copy8
  ; sci/cplx.e16.ts:597  cmul(z, w, at)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call cmul
  ; sci/cplx.e16.ts:599  math(M_EXP, z, 0, at)
  li a0, 30
  mv a1, s1
  li a2, 0
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:600  copy8(z + IM, ct1)
  addi a0, s1, 8
  li a1, 12672
  call copy8
  ; sci/cplx.e16.ts:601  copy8(z + IM, ct2)
  addi a0, s1, 8
  li a1, 12680
  call copy8
  ; sci/cplx.e16.ts:602  math(M_COS, ct1, 0, at)
  li a0, 23
  li a1, 12672
  li a2, 0
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:603  math(M_SIN, ct2, 0, at)
  li a0, 22
  li a1, 12680
  li a2, 0
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:604  math(M_MUL, ct1, z, at)
  li a0, 3
  li a1, 12672
  mv a2, s1
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:605  math(M_MUL, ct2, z, at)
  li a0, 3
  li a1, 12680
  mv a2, s1
  mv a3, s2
  call math
  ; sci/cplx.e16.ts:606  copy8(ct1, z)
  li a0, 12672
  mv a1, s1
  call copy8
  ; sci/cplx.e16.ts:607  copy8(ct2, z + IM)
  li a0, 12680
  addi a1, s1, 8
  call copy8
  ; sci/cplx.e16.ts:608  poke16(MATH_ANGLE, peek(KEEP_ANGLE))
  lbu t0, 3074(zero)
  li t1, 65372
  sw t0, 0(t1)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/cplx.e16.ts:612 cnumber() at -O1
;   z in s1
cnumber:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/cplx.e16.ts:613  const z = cpush(cPos)
  lw a0, 0x0940(zero)
  call cpush
  mv s1, a0 ; z
  ; sci/cplx.e16.ts:614  cPos = readNumber(cFrom, cLength, cPos, z)
  lw a0, 0x093c(zero)
  lw a1, 0x093e(zero)
  lw a2, 0x0940(zero)
  mv a3, s1
  la t0, readNumber
  li t1, 0
  call far_call
  sw a0, 0x0940(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/cplx.e16.ts:620 cplxTurn() at -O1
cplxTurn:
  ; sci/cplx.e16.ts:621  polarShown = !polarShown
  lw t0, 0x0964(zero)
  seqz t0, t0
  sw t0, 0x0964(zero)
.return:
  ret

; sci/cplx.e16.ts:625 cplxFuncScreen() at -O1
cplxFuncScreen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/cplx.e16.ts:626  bandWith(str('FUNC'), 0)
  la a0, str_200
  li a1, 0
  call bandWith
  ; sci/cplx.e16.ts:627  textAt(str('1:i      2:\x98'), 1, lineY(0))
  la a0, str_201
  li a1, 1
  li a2, 11
  call textAt
  ; sci/cplx.e16.ts:628  textAt(str('3:abs(   4:arg('), 1, lineY(1))
  la a0, str_202
  li a1, 1
  li a2, 20
  call textAt
  ; sci/cplx.e16.ts:629  textAt(str('5:conj(  6:Re('), 1, lineY(2))
  la a0, str_203
  li a1, 1
  li a2, 29
  call textAt
  ; sci/cplx.e16.ts:630  textAt(str('7:Im('), 1, lineY(3))
  la a0, str_204
  li a1, 1
  li a2, 38
  call textAt
  ; sci/cplx.e16.ts:631  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_205
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/cplx.e16.ts:635 cplxFuncKey(k) at -O1
;   k in s1
cplxFuncKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/cplx.e16.ts:636  if (k === K_AC) return 1
  li t0, 5
  bne s1, t0, .L1
  ; sci/cplx.e16.ts:636  return 1
  li a0, 1
  j .return
.L1:
  ; sci/cplx.e16.ts:637  return cplxItem(digitOf(k))
  mv a0, s1
  la t0, digitOf
  li t1, 4
  call far_call
  call cplxItem
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/cplx.e16.ts:640 cplxItem(d) at -O1
;   d in s1
cplxItem:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; d
  ; sci/cplx.e16.ts:641  switch (d) {
  li t0, 1
  beq s1, t0, .L2
  li t0, 2
  beq s1, t0, .L3
  li t0, 3
  beq s1, t0, .L4
  li t0, 4
  beq s1, t0, .L5
  li t0, 5
  beq s1, t0, .L6
  li t0, 6
  beq s1, t0, .L7
  li t0, 7
  beq s1, t0, .L8
  j .L1
.L2:
  ; sci/cplx.e16.ts:643  return T_I
  li a0, 105
  j .return
.L3:
  ; sci/cplx.e16.ts:645  return T_POLAR
  li a0, 176
  j .return
.L4:
  ; sci/cplx.e16.ts:647  return T_ABS
  li a0, 230
  j .return
.L5:
  ; sci/cplx.e16.ts:649  return T_ARG
  li a0, 163
  j .return
.L6:
  ; sci/cplx.e16.ts:651  return T_CONJ
  li a0, 164
  j .return
.L7:
  ; sci/cplx.e16.ts:653  return T_RE
  li a0, 165
  j .return
.L8:
  ; sci/cplx.e16.ts:655  return T_IM
  li a0, 166
  j .return
.L1:
  ; sci/cplx.e16.ts:657  refuse()
  call refuse
  ; sci/cplx.e16.ts:658  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/cplx.e16.ts:665 cplxAnswer() at -O1
cplxAnswer:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/cplx.e16.ts:666  copy8(CPLX_ANS, ct1)
  li a0, 10352
  li a1, 12672
  call copy8
  ; sci/cplx.e16.ts:667  copy8(CPLX_ANS + IM, ct2)
  li a0, 10360
  li a1, 12680
  call copy8
  ; sci/cplx.e16.ts:668  if (polarShown) {
  lw t0, 0x0964(zero)
  beqz t0, .L1
  ; sci/cplx.e16.ts:670  copy8(ct2, ct3)
  li a0, 12680
  li a1, 12688
  call copy8
  ; sci/cplx.e16.ts:671  math(M_ATN2, ct3, ct1, 0)
  li a0, 39
  li a1, 12688
  li a2, 12672
  li a3, 0
  call math
  ; sci/cplx.e16.ts:672  const z = CPLX_STACK
  ; sci/cplx.e16.ts:673  copy8(CPLX_ANS, z)
  li a0, 10352
  li a1, 12288
  call copy8
  ; sci/cplx.e16.ts:674  copy8(CPLX_ANS + IM, z + IM)
  li a0, 10360
  li a1, 12296
  call copy8
  ; sci/cplx.e16.ts:675  cabs(z, 0)
  li a0, 12288
  li a1, 0
  call cabs
  ; sci/cplx.e16.ts:676  textRight(textOf(z), lineY(4))
  li a0, 12288
  la t0, textOf
  li t1, 5
  call far_call
  li a1, 47
  call textRight
  ; sci/cplx.e16.ts:677  lineWith(0x98, ct3, 0)
  li a0, 152
  li a1, 12688
  li a2, 0
  call lineWith
  ; sci/cplx.e16.ts:678  return
  j .return
.L1:
  ; sci/cplx.e16.ts:680  if (isZero(ct2)) {
  li a0, 12680
  call isZero
  beqz a0, .L2
  ; sci/cplx.e16.ts:681  drawBig(ct1)
  li a0, 12672
  la t0, drawBig
  li t1, 5
  call far_call
  ; sci/cplx.e16.ts:682  return
  j .return
.L2:
  ; sci/cplx.e16.ts:684  textRight(textOf(ct1), lineY(4))
  li a0, 12672
  la t0, textOf
  li t1, 5
  call far_call
  li a1, 47
  call textRight
  ; sci/cplx.e16.ts:685  lineWith(isNegative(ct2) ? 0 : 0x2b, ct2, 0x69)
  li a0, 12680
  call isNegative
  beqz a0, .L3
  li t0, 0
  j .L4
.L3:
  li t0, 43
.L4:
  mv a0, t0
  li a1, 12680
  li a2, 105
  call lineWith
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/cplx.e16.ts:689 lineWith(before, v/s/p, after) at -O1
;   before in s3
;   v/s/p in s2
;   after in s0
;   n in s1
lineWith:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s3, a0 ; before
  mv s2, a1 ; v/s/p
  mv s0, a2 ; after
  ; sci/cplx.e16.ts:690  const s = textOf(v)
  mv a0, s2
  la t0, textOf
  li t1, 5
  call far_call
  mv s2, a0 ; v/s/p
  ; sci/cplx.e16.ts:691  let n: u16 = 0
  li s1, 0 ; n
  ; sci/cplx.e16.ts:692  if (before !== 0) {
  beq s3, zero, .L1
  ; sci/cplx.e16.ts:693  cText[0] = before
  sb s3, cText(zero)
  ; sci/cplx.e16.ts:694  n = 1
  li s1, 1 ; n
.L1:
  ; sci/cplx.e16.ts:696  let p = s
  ; sci/cplx.e16.ts:697  while (peek(p) !== 0 && n < 30) {
  j .L4
.L2:
  ; sci/cplx.e16.ts:698  cText[n] = peek(p)
  lbu t0, 0(s2)
  sb t0, cText(s1)
  ; sci/cplx.e16.ts:699  n++
  addi s1, s1, 1
  ; sci/cplx.e16.ts:700  p++
  addi s2, s2, 1
.L4:
  lbu t0, 0(s2)
  beq t0, zero, .L6
  li t0, 30
  bltu s1, t0, .L2
.L6:
  ; sci/cplx.e16.ts:702  if (after !== 0) {
  beq s0, zero, .L7
  ; sci/cplx.e16.ts:703  cText[n] = after
  sb s0, cText(s1)
  ; sci/cplx.e16.ts:704  n++
  addi s1, s1, 1
.L7:
  ; sci/cplx.e16.ts:706  cText[n] = 0
  sb zero, cText(s1)
  ; sci/cplx.e16.ts:707  textRight(addr(cText), lineY(5))
  la a0, cText
  li a1, 56
  call textRight
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

str_98:
  .byte 88, 63, 0
str_99:
  .byte 83, 84, 65, 82, 84, 63, 0
str_100:
  .byte 69, 78, 68, 63, 0
str_101:
  .byte 83, 84, 69, 80, 63, 0
str_102:
  .byte 84, 65, 66, 76, 69, 0
str_103:
  .byte 70, 73, 78, 68, 32, 88, 0
str_104:
  .byte 102, 40, 88, 41, 0
str_105:
  .byte 61, 58, 71, 79, 32, 32, 32, 65, 67, 58, 66, 65, 67, 75, 0
str_200:
  .byte 70, 85, 78, 67, 0
str_201:
  .byte 49, 58, 105, 32, 32, 32, 32, 32, 32, 50, 58, 152, 0
str_202:
  .byte 51, 58, 97, 98, 115, 40, 32, 32, 32, 52, 58, 97, 114, 103, 40, 0
str_203:
  .byte 53, 58, 99, 111, 110, 106, 40, 32, 32, 54, 58, 82, 101, 40, 0
str_204:
  .byte 55, 58, 73, 109, 40, 0
str_205:
  .byte 65, 67, 58, 66, 65, 67, 75, 0
  .align 2

  .bank 7
  .org 0xc000
; sci/stats.e16.ts:92 statsStart() at -O1
statsStart:
  ; sci/stats.e16.ts:93  phase = PH_TYPE
  sw zero, 0x084c(zero)
.return:
  ret

; sci/stats.e16.ts:97 statsReset() at -O1
statsReset:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/stats.e16.ts:98  phase = PH_GRID
  li t0, 1
  sw t0, 0x084c(zero)
  ; sci/stats.e16.ts:99  gridOpen(GRID_STATS, 0, 0)
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

; sci/stats.e16.ts:102 statKind() at -O1
;   t in a0
statKind:
  ; sci/stats.e16.ts:103  const t = peek(STATS_TYPE)
  lbu a0, 5636(zero)
  ; sci/stats.e16.ts:104  return t <= KIND_INV ? t : KIND_1VAR
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

; sci/stats.e16.ts:107 twoVar() at -O1
twoVar:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/stats.e16.ts:108  return statKind() !== KIND_1VAR
  call statKind
  sub t0, a0, zero
  snez a0, t0
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/stats.e16.ts:113 statsKey(k/r, shift) at -O1
;   k/r in s1
;   shift in s2
statsKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/r
  mv s2, a1 ; shift
  ; sci/stats.e16.ts:114  if (phase === PH_TYPE) typeKey(k)
  lw t0, 0x084c(zero)
  bne t0, zero, .L1
  ; sci/stats.e16.ts:114  typeKey(k)
  mv a0, s1
  call typeKey
  j .L2
.L1:
  ; sci/stats.e16.ts:115  if (phase === PH_FUNC) statsFuncKey(k)
  lw t0, 0x084c(zero)
  li t1, 2
  bne t0, t1, .L3
  ; sci/stats.e16.ts:115  statsFuncKey(k)
  mv a0, s1
  call statsFuncKey
  j .L4
.L3:
  ; sci/stats.e16.ts:116  if (phase === PH_RESULT) resultKey(k)
  lw t0, 0x084c(zero)
  li t1, 3
  bne t0, t1, .L5
  ; sci/stats.e16.ts:116  resultKey(k)
  mv a0, s1
  call resultKey
  j .L6
.L5:
  ; sci/stats.e16.ts:117  if (k === K_FUNC) phase = PH_FUNC
  li t0, 11
  bne s1, t0, .L7
  ; sci/stats.e16.ts:117  phase = PH_FUNC
  li t0, 2
  sw t0, 0x084c(zero)
  j .L8
.L7:
  ; sci/stats.e16.ts:119  const r = gridKey(k, shift)
  mv a0, s1
  mv a1, s2
  la t0, gridKey
  li t1, 9
  call far_call
  mv s1, a0 ; k/r
  ; sci/stats.e16.ts:120  if (r === GRID_DONE) {
  li t0, 1
  bne s1, t0, .L9
  ; sci/stats.e16.ts:121  if (peek16(STATS_COUNT) === 0) refuse()
  lw t0, 5634(zero)
  bne t0, zero, .L10
  ; sci/stats.e16.ts:121  refuse()
  call refuse
  j .L12
.L10:
  ; sci/stats.e16.ts:123  workOut()
  call workOut
  ; sci/stats.e16.ts:124  resultPage = 0
  sw zero, 0x084e(zero)
  ; sci/stats.e16.ts:125  phase = PH_RESULT
  li t0, 3
  sw t0, 0x084c(zero)
  j .L12
.L9:
  ; sci/stats.e16.ts:127  if (r === GRID_AC) refuse()
  li t0, 2
  bne s1, t0, .L13
  ; sci/stats.e16.ts:127  refuse()
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

; sci/stats.e16.ts:132 typeKey(k) at -O1
;   k in s1
;   t in s2
typeKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  ; sci/stats.e16.ts:133  const t = typeOfKey(k)
  mv a0, s1
  call typeOfKey
  mv s2, a0 ; t
  ; sci/stats.e16.ts:134  if (t !== 0xffff) {
  li t0, 65535
  beq s2, t0, .L1
  ; sci/stats.e16.ts:135  poke(STATS_TYPE, t)
  sb s2, 5636(zero)
  ; sci/stats.e16.ts:136  statsReset()
  call statsReset
  j .L2
.L1:
  ; sci/stats.e16.ts:137  if (k === K_8) poke(STATS_FREQ, peek(STATS_FREQ) === 0 ? 1 : 0)
  li t0, 41
  bne s1, t0, .L3
  ; sci/stats.e16.ts:137  poke(STATS_FREQ, peek(STATS_FREQ) === 0 ? 1 : 0)
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
  ; sci/stats.e16.ts:138  if (k === K_AC) statsReset()
  li t0, 5
  bne s1, t0, .L7
  ; sci/stats.e16.ts:138  statsReset()
  call statsReset
  j .L8
.L7:
  ; sci/stats.e16.ts:139  refuse()
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

; sci/stats.e16.ts:142 typeOfKey(k) at -O1
;   k in a0
typeOfKey:
  ; sci/stats.e16.ts:143  if (k === K_1) return KIND_1VAR
  li t0, 56
  bne a0, t0, .L1
  ; sci/stats.e16.ts:143  return KIND_1VAR
  li a0, 0
  ret
.L1:
  ; sci/stats.e16.ts:144  if (k === K_2) return KIND_LINE
  li t0, 57
  bne a0, t0, .L2
  ; sci/stats.e16.ts:144  return KIND_LINE
  li a0, 1
  ret
.L2:
  ; sci/stats.e16.ts:145  if (k === K_3) return KIND_QUAD
  li t0, 58
  bne a0, t0, .L3
  ; sci/stats.e16.ts:145  return KIND_QUAD
  li a0, 2
  ret
.L3:
  ; sci/stats.e16.ts:146  if (k === K_4) return KIND_EXP
  li t0, 48
  bne a0, t0, .L4
  ; sci/stats.e16.ts:146  return KIND_EXP
  li a0, 3
  ret
.L4:
  ; sci/stats.e16.ts:147  if (k === K_5) return KIND_LOG
  li t0, 49
  bne a0, t0, .L5
  ; sci/stats.e16.ts:147  return KIND_LOG
  li a0, 4
  ret
.L5:
  ; sci/stats.e16.ts:148  if (k === K_6) return KIND_PWR
  li t0, 50
  bne a0, t0, .L6
  ; sci/stats.e16.ts:148  return KIND_PWR
  li a0, 5
  ret
.L6:
  ; sci/stats.e16.ts:149  return k === K_7 ? KIND_INV : 0xffff
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

; sci/stats.e16.ts:153 statsFuncKey(k) at -O1
;   k in s1
statsFuncKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/stats.e16.ts:154  phase = PH_GRID
  li t0, 1
  sw t0, 0x084c(zero)
  ; sci/stats.e16.ts:155  if (k === K_1) newRow(gridRow())
  li t0, 56
  bne s1, t0, .L1
  ; sci/stats.e16.ts:155  newRow(gridRow())
  la t0, gridRow
  li t1, 9
  call far_call
  la t0, newRow
  li t1, 9
  call far_call
  j .L2
.L1:
  ; sci/stats.e16.ts:156  if (k === K_2) deleteRow()
  li t0, 57
  bne s1, t0, .L3
  ; sci/stats.e16.ts:156  deleteRow()
  la t0, deleteRow
  li t1, 9
  call far_call
  j .L4
.L3:
  ; sci/stats.e16.ts:157  if (k === K_3) clearRows()
  li t0, 58
  bne s1, t0, .L5
  ; sci/stats.e16.ts:157  clearRows()
  la t0, clearRows
  li t1, 9
  call far_call
  j .L6
.L5:
  ; sci/stats.e16.ts:158  if (k === K_4) phase = PH_TYPE
  li t0, 48
  bne s1, t0, .L7
  ; sci/stats.e16.ts:158  phase = PH_TYPE
  sw zero, 0x084c(zero)
  j .L8
.L7:
  ; sci/stats.e16.ts:159  if (k !== K_AC) {
  li t0, 5
  beq s1, t0, .L9
  ; sci/stats.e16.ts:160  refuse()
  call refuse
  ; sci/stats.e16.ts:161  phase = PH_FUNC
  li t0, 2
  sw t0, 0x084c(zero)
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

; sci/stats.e16.ts:165 resultKey(k) at -O1
;   k in s1
;   pages in s2
resultKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  ; sci/stats.e16.ts:166  const pages: u16 = twoVar() ? 3 : 1
  call twoVar
  beqz a0, .L1
  li t0, 3
  j .L2
.L1:
  li t0, 1
.L2:
  mv s2, t0 ; pages
  ; sci/stats.e16.ts:167  if (k === K_DOWN && resultPage + 1 < pages) resultPage++
  li t0, 1
  bne s1, t0, .L3
  lw t0, 0x084e(zero)
  addi t0, t0, 1
  bgeu t0, s2, .L3
  ; sci/stats.e16.ts:167  resultPage++
  lw t0, 0x084e(zero)
  addi t0, t0, 1
  sw t0, 0x084e(zero)
  j .L4
.L3:
  ; sci/stats.e16.ts:168  if (k === K_UP && resultPage > 0) resultPage--
  bne s1, zero, .L5
  lw t0, 0x084e(zero)
  bgeu zero, t0, .L5
  ; sci/stats.e16.ts:168  resultPage--
  lw t0, 0x084e(zero)
  addi t0, t0, -1
  sw t0, 0x084e(zero)
  j .L6
.L5:
  ; sci/stats.e16.ts:169  if (k === K_AC) phase = PH_GRID
  li t0, 5
  bne s1, t0, .L7
  ; sci/stats.e16.ts:169  phase = PH_GRID
  li t0, 1
  sw t0, 0x084c(zero)
  j .L8
.L7:
  ; sci/stats.e16.ts:170  refuse()
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

; sci/stats.e16.ts:175 statsDraw() at -O1
statsDraw:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/stats.e16.ts:176  cls()
  call cls
  ; sci/stats.e16.ts:177  if (phase === PH_TYPE) drawType()
  lw t0, 0x084c(zero)
  bne t0, zero, .L1
  ; sci/stats.e16.ts:177  drawType()
  call drawType
  j .L2
.L1:
  ; sci/stats.e16.ts:178  if (phase === PH_FUNC) drawFunc()
  lw t0, 0x084c(zero)
  li t1, 2
  bne t0, t1, .L3
  ; sci/stats.e16.ts:178  drawFunc()
  call drawFunc
  j .L4
.L3:
  ; sci/stats.e16.ts:179  if (phase === PH_RESULT) drawResults()
  lw t0, 0x084c(zero)
  li t1, 3
  bne t0, t1, .L5
  ; sci/stats.e16.ts:179  drawResults()
  call drawResults
  j .L6
.L5:
  ; sci/stats.e16.ts:181  countText()
  call countText
  ; sci/stats.e16.ts:182  bandWith(kindTitle(str('STATS '), 0), addr(countChars))
  la a0, str_106
  li a1, 0
  call kindTitle
  la a1, countChars
  call bandWith
  ; sci/stats.e16.ts:183  gridDraw()
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

; sci/stats.e16.ts:190 kindTitle(before, after) at -O1
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
  ; sci/stats.e16.ts:191  let n: u16 = 0
  li s1, 0 ; n
  ; sci/stats.e16.ts:192  if (before !== 0) n = copyText(before, n)
  beq s2, zero, .L1
  ; sci/stats.e16.ts:192  n = copyText(before, n)
  mv a0, s2
  mv a1, s1
  call copyText
  mv s1, a0 ; n
.L1:
  ; sci/stats.e16.ts:193  n = copyText(kindName(statKind()), n)
  call statKind
  call kindName
  mv a1, s1
  call copyText
  mv s1, a0 ; n
  ; sci/stats.e16.ts:194  if (after !== 0) n = copyText(after, n)
  beq s3, zero, .L2
  ; sci/stats.e16.ts:194  n = copyText(after, n)
  mv a0, s3
  mv a1, s1
  call copyText
  mv s1, a0 ; n
.L2:
  ; sci/stats.e16.ts:195  titleText[n] = 0
  sb zero, titleText(s1)
  ; sci/stats.e16.ts:196  return addr(titleText)
  la a0, titleText
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/stats.e16.ts:199 copyText(from/p, n/k) at -O1
;   from/p in a0
;   n/k in a1
copyText:
  ; sci/stats.e16.ts:200  let k = n
  ; sci/stats.e16.ts:201  let p = from
  ; sci/stats.e16.ts:202  while (peek(p) !== 0 && k < 15) {
  j .L3
.L1:
  ; sci/stats.e16.ts:203  titleText[k] = peek(p)
  lbu t0, 0(a0)
  sb t0, titleText(a1)
  ; sci/stats.e16.ts:204  k++
  addi a1, a1, 1
  ; sci/stats.e16.ts:205  p++
  addi a0, a0, 1
.L3:
  lbu t0, 0(a0)
  beq t0, zero, .L5
  li t0, 15
  bltu a1, t0, .L1
.L5:
  ; sci/stats.e16.ts:207  return k
  mv a0, a1
.return:
  ret

; sci/stats.e16.ts:210 kindName(t) at -O1
;   t in a0
kindName:
  ; sci/stats.e16.ts:211  switch (t) {
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
  ; sci/stats.e16.ts:213  return str('LINE')
  la a0, str_107
  ret
.L3:
  ; sci/stats.e16.ts:215  return str('QUAD')
  la a0, str_108
  ret
.L4:
  ; sci/stats.e16.ts:217  return str('EXP')
  la a0, str_109
  ret
.L5:
  ; sci/stats.e16.ts:219  return str('LOG')
  la a0, str_110
  ret
.L6:
  ; sci/stats.e16.ts:221  return str('PWR')
  la a0, str_111
  ret
.L7:
  ; sci/stats.e16.ts:223  return str('INV')
  la a0, str_112
  ret
.L1:
  ; sci/stats.e16.ts:225  return str('1-VAR')
  la a0, str_113
.return:
  ret

; sci/stats.e16.ts:231 countText() at -O1
;   n in a0
;   i in a1
countText:
  ; sci/stats.e16.ts:232  const n = peek16(STATS_COUNT)
  lw a0, 5634(zero)
  ; sci/stats.e16.ts:233  countChars[0] = 0x6e
  li t0, 110
  sb t0, countChars(zero)
  ; sci/stats.e16.ts:234  countChars[1] = 0x3d
  li t0, 61
  sb t0, countChars+1(zero)
  ; sci/stats.e16.ts:235  let i: u16 = 2
  li a1, 2 ; i
  ; sci/stats.e16.ts:236  if (n >= 10) {
  li t0, 10
  bltu a0, t0, .L1
  ; sci/stats.e16.ts:237  countChars[i] = 0x30 + (n >= 40 ? 4 : n >= 30 ? 3 : n >= 20 ? 2 : 1)
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
  ; sci/stats.e16.ts:238  i++
  addi a1, a1, 1
.L1:
  ; sci/stats.e16.ts:240  countChars[i] = 0x30 + (n % 10)
  li t1, 52429
  mulhu t0, a0, t1
  srli t0, t0, 3
  li t1, 10
  mul t0, t0, t1
  sub t0, a0, t0
  addi t0, t0, 48
  sb t0, countChars(a1)
  ; sci/stats.e16.ts:241  countChars[i + 1] = 0
  sb zero, countChars+1(a1)
.return:
  ret

; sci/stats.e16.ts:244 drawType() at -O1
drawType:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/stats.e16.ts:245  band(str('STATS'))
  la a0, str_114
  call band
  ; sci/stats.e16.ts:246  textAt(str('1:1-VAR 2:LINE'), 1, lineY(0))
  la a0, str_115
  li a1, 1
  li a2, 11
  call textAt
  ; sci/stats.e16.ts:247  textAt(str('3:QUAD 4:EXP 5:LOG'), 1, lineY(1))
  la a0, str_116
  li a1, 1
  li a2, 20
  call textAt
  ; sci/stats.e16.ts:248  textAt(str('6:PWR 7:INV'), 1, lineY(2))
  la a0, str_117
  li a1, 1
  li a2, 29
  call textAt
  ; sci/stats.e16.ts:249  textAt(str('8:FREQ'), 1, lineY(3))
  la a0, str_118
  li a1, 1
  li a2, 38
  call textAt
  ; sci/stats.e16.ts:250  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_119
  li a1, 1
  li a2, 56
  call textAt
  ; sci/stats.e16.ts:251  markKind(statKind())
  call statKind
  call markKind
  ; sci/stats.e16.ts:252  if (peek(STATS_FREQ) !== 0) mark(0, 6, 3)
  lbu t0, 5637(zero)
  beq t0, zero, .L1
  ; sci/stats.e16.ts:252  mark(0, 6, 3)
  li a0, 0
  li a1, 6
  li a2, 3
  call mark
.L1:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/stats.e16.ts:256 markKind(t) at -O1
;   t in s1
markKind:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/stats.e16.ts:257  switch (t) {
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
  ; sci/stats.e16.ts:259  mark(0, 7, 0)
  li a0, 0
  li a1, 7
  li a2, 0
  call mark
  ; sci/stats.e16.ts:260  return
  j .return
.L3:
  ; sci/stats.e16.ts:262  mark(8, 6, 0)
  li a0, 8
  li a1, 6
  li a2, 0
  call mark
  ; sci/stats.e16.ts:263  return
  j .return
.L4:
  ; sci/stats.e16.ts:265  mark(0, 6, 1)
  li a0, 0
  li a1, 6
  li a2, 1
  call mark
  ; sci/stats.e16.ts:266  return
  j .return
.L5:
  ; sci/stats.e16.ts:268  mark(7, 5, 1)
  li a0, 7
  li a1, 5
  li a2, 1
  call mark
  ; sci/stats.e16.ts:269  return
  j .return
.L6:
  ; sci/stats.e16.ts:271  mark(13, 5, 1)
  li a0, 13
  li a1, 5
  li a2, 1
  call mark
  ; sci/stats.e16.ts:272  return
  j .return
.L7:
  ; sci/stats.e16.ts:274  mark(0, 5, 2)
  li a0, 0
  li a1, 5
  li a2, 2
  call mark
  ; sci/stats.e16.ts:275  return
  j .return
.L1:
  ; sci/stats.e16.ts:277  mark(6, 5, 2)
  li a0, 6
  li a1, 5
  li a2, 2
  call mark
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/stats.e16.ts:280 drawFunc() at -O1
drawFunc:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/stats.e16.ts:281  band(str('FUNC'))
  la a0, str_120
  call band
  ; sci/stats.e16.ts:282  textAt(str('1:INSERT ROW'), 1, lineY(0))
  la a0, str_121
  li a1, 1
  li a2, 11
  call textAt
  ; sci/stats.e16.ts:283  textAt(str('2:DELETE ROW'), 1, lineY(1))
  la a0, str_122
  li a1, 1
  li a2, 20
  call textAt
  ; sci/stats.e16.ts:284  textAt(str('3:CLEAR ALL'), 1, lineY(2))
  la a0, str_123
  li a1, 1
  li a2, 29
  call textAt
  ; sci/stats.e16.ts:285  textAt(str('4:KIND'), 1, lineY(3))
  la a0, str_124
  li a1, 1
  li a2, 38
  call textAt
  ; sci/stats.e16.ts:286  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_119
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/stats.e16.ts:335 at(k) at -O1
;   k in a0
at:
  ; sci/stats.e16.ts:336  return STATS_WORK + k * 8
  slli t0, a0, 3
  li t1, 9472
  add a0, t1, t0
.return:
  ret

; sci/stats.e16.ts:339 isValid(k) at -O1
;   k in a0
isValid:
  ; sci/stats.e16.ts:340  return peek(STATS_WORK + SLOTS * 8 + k) !== 0
  li t0, 9864
  add t0, t0, a0
  lbu t0, 0(t0)
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; sci/stats.e16.ts:343 setValid(k, yes) at -O1
;   k in a0
;   yes in a1
setValid:
  ; sci/stats.e16.ts:344  poke(STATS_WORK + SLOTS * 8 + k, yes ? 1 : 0)
  li t0, 9864
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

; sci/stats.e16.ts:348 sop(op, dst, a, b) at -O1
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
  ; sci/stats.e16.ts:349  copy8(at(a), at(dst))
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
  ; sci/stats.e16.ts:350  math(op, at(dst), at(b), 0)
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

; sci/stats.e16.ts:353 zero(k) at -O1
;   k in s2
;   i in s1
zero:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; k
  ; sci/stats.e16.ts:354  for (let i: u16 = 0; i < 8; i++) poke(at(k) + i, 0)
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/stats.e16.ts:354  poke(at(k) + i, 0)
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

; sci/stats.e16.ts:357 setWhole(k, v) at -O1
;   k in s1
;   v in s2
setWhole:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; v
  ; sci/stats.e16.ts:358  wholeInto(at(k), v)
  mv a0, s1
  call at
  mv a1, s2
  call wholeInto
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:362 workOut() at -O1
;   k/n in s2
;   r in s1
workOut:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; sci/stats.e16.ts:363  for (let k: u16 = 0; k < SLOTS; k++) {
  li s2, 0 ; k/n
  j .L3
.L1:
  ; sci/stats.e16.ts:364  zero(k)
  mv a0, s2
  call zero
  ; sci/stats.e16.ts:365  setValid(k, true)
  mv a0, s2
  li a1, 1
  call setValid
  addi s2, s2, 1
.L3:
  li t0, 49
  bltu s2, t0, .L1
  ; sci/stats.e16.ts:367  const n = peek16(STATS_COUNT)
  lw s2, 5634(zero)
  ; sci/stats.e16.ts:368  for (let r: u16 = 0; r < n; r++) addRow(STATS_DATA + r * 24)
  li s1, 0 ; r
  j .L7
.L5:
  ; sci/stats.e16.ts:368  addRow(STATS_DATA + r * 24)
  slli t1, s1, 4
  slli t0, s1, 3
  add t0, t0, t1
  addi a0, t0, 5648
  call addRow
  addi s1, s1, 1
.L7:
  bltu s1, s2, .L5
  ; sci/stats.e16.ts:369  setValid(R_C, false)
  li a0, 15
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:370  if (isZero(at(S_N)) || isNegative(at(S_N))) {
  li a0, 9472
  call isZero
  bnez a0, .L10
  li a0, 9472
  call isNegative
  beqz a0, .L9
.L10:
  ; sci/stats.e16.ts:371  means(R_MX)
  li a0, 6
  call means
  ; sci/stats.e16.ts:372  if (twoVar()) {
  call twoVar
  beqz a0, .L11
  ; sci/stats.e16.ts:373  means(R_MY)
  li a0, 9
  call means
  ; sci/stats.e16.ts:374  fitLine()
  call fitLine
.L11:
  ; sci/stats.e16.ts:376  return
  j .return
.L9:
  ; sci/stats.e16.ts:378  sop(M_DIV, R_MX, S_X, S_N)
  li a0, 4
  li a1, 6
  li a2, 1
  li a3, 0
  call sop
  ; sci/stats.e16.ts:379  sop(M_DIV, R_MY, S_Y, S_N)
  li a0, 4
  li a1, 9
  li a2, 3
  li a3, 0
  call sop
  ; sci/stats.e16.ts:380  sop(M_DIV, F_MU, F_U, S_N)
  li a0, 4
  li a1, 21
  li a2, 16
  li a3, 0
  call sop
  ; sci/stats.e16.ts:381  sop(M_DIV, F_MV, F_V, S_N)
  li a0, 4
  li a1, 22
  li a2, 18
  li a3, 0
  call sop
  ; sci/stats.e16.ts:382  for (let r: u16 = 0; r < n; r++) aboutMeans(STATS_DATA + r * 24)
  li s1, 0 ; r
  j .L14
.L12:
  ; sci/stats.e16.ts:382  aboutMeans(STATS_DATA + r * 24)
  slli t1, s1, 4
  slli t0, s1, 3
  add t0, t0, t1
  addi a0, t0, 5648
  call aboutMeans
  addi s1, s1, 1
.L14:
  bltu s1, s2, .L12
  ; sci/stats.e16.ts:383  means(R_MX)
  li a0, 6
  call means
  ; sci/stats.e16.ts:384  if (!twoVar()) return
  call twoVar
  bnez a0, .L16
  ; sci/stats.e16.ts:384  return
  j .return
.L16:
  ; sci/stats.e16.ts:385  means(R_MY)
  li a0, 9
  call means
  ; sci/stats.e16.ts:386  if (statKind() === KIND_QUAD) fitQuadratic()
  call statKind
  li t0, 2
  bne a0, t0, .L17
  ; sci/stats.e16.ts:386  fitQuadratic()
  call fitQuadratic
  j .L18
.L17:
  ; sci/stats.e16.ts:387  fitLine()
  call fitLine
.L18:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:391 weightOf(row) at -O1
;   row in s1
weightOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; row
  ; sci/stats.e16.ts:392  if (peek(STATS_FREQ) !== 0) copy8(row + 16, at(FREQ))
  lbu t0, 5637(zero)
  beq t0, zero, .L1
  ; sci/stats.e16.ts:392  copy8(row + 16, at(FREQ))
  addi a0, s1, 16
  li a1, 9704
  call copy8
  j .L2
.L1:
  ; sci/stats.e16.ts:393  setWhole(FREQ, 1)
  li a0, 29
  li a1, 1
  call setWhole
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/stats.e16.ts:401 aboutMeans(row) at -O1
;   row in s1
aboutMeans:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; row
  ; sci/stats.e16.ts:402  weightOf(row)
  mv a0, s1
  call weightOf
  ; sci/stats.e16.ts:403  copy8(row, at(T1))
  mv a0, s1
  li a1, 9680
  call copy8
  ; sci/stats.e16.ts:404  math(M_SUB, at(T1), at(R_MX), 0)
  li a0, 2
  li a1, 9680
  li a2, 9520
  li a3, 0
  call math
  ; sci/stats.e16.ts:405  squared(T1, T1, C_XX)
  li a0, 26
  li a1, 26
  li a2, 44
  call squared
  ; sci/stats.e16.ts:406  if (!twoVar()) return
  call twoVar
  bnez a0, .L1
  ; sci/stats.e16.ts:406  return
  j .return
.L1:
  ; sci/stats.e16.ts:407  copy8(row + 8, at(T1))
  addi a0, s1, 8
  li a1, 9680
  call copy8
  ; sci/stats.e16.ts:408  math(M_SUB, at(T1), at(R_MY), 0)
  li a0, 2
  li a1, 9680
  li a2, 9544
  li a3, 0
  call math
  ; sci/stats.e16.ts:409  squared(T1, T1, C_YY)
  li a0, 26
  li a1, 26
  li a2, 45
  call squared
  ; sci/stats.e16.ts:410  uvOf(row)
  mv a0, s1
  call uvOf
  ; sci/stats.e16.ts:411  math(M_SUB, at(U), at(F_MU), 0)
  li a0, 2
  li a1, 9712
  li a2, 9640
  li a3, 0
  call math
  ; sci/stats.e16.ts:412  math(M_SUB, at(V), at(F_MV), 0)
  li a0, 2
  li a1, 9720
  li a2, 9648
  li a3, 0
  call math
  ; sci/stats.e16.ts:413  squared(U, U, C_UU)
  li a0, 30
  li a1, 30
  li a2, 46
  call squared
  ; sci/stats.e16.ts:414  squared(V, V, C_VV)
  li a0, 31
  li a1, 31
  li a2, 47
  call squared
  ; sci/stats.e16.ts:415  squared(U, V, C_UV)
  li a0, 30
  li a1, 31
  li a2, 48
  call squared
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/stats.e16.ts:419 squared(a, b, sum) at -O1
;   a in s1
;   b in s2
;   sum in s3
squared:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; a
  mv s2, a1 ; b
  mv s3, a2 ; sum
  ; sci/stats.e16.ts:420  sop(M_MUL, T2, a, b)
  li a0, 3
  li a1, 27
  mv a2, s1
  mv a3, s2
  call sop
  ; sci/stats.e16.ts:421  math(M_MUL, at(T2), at(FREQ), 0)
  li a0, 3
  li a1, 9688
  li a2, 9704
  li a3, 0
  call math
  ; sci/stats.e16.ts:422  math(M_ADD, at(sum), at(T2), 0)
  mv a0, s3
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
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/stats.e16.ts:426 addRow(row) at -O1
;   row in s1
addRow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; row
  ; sci/stats.e16.ts:427  weightOf(row)
  mv a0, s1
  call weightOf
  ; sci/stats.e16.ts:428  math(M_ADD, at(S_N), at(FREQ), 0)
  li a0, 1
  li a1, 9472
  li a2, 9704
  li a3, 0
  call math
  ; sci/stats.e16.ts:429  addWeighted(row, S_X)
  mv a0, s1
  li a1, 1
  call addWeighted
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
  ; sci/stats.e16.ts:432  addWeighted(at(T1), S_XX)
  li a0, 9680
  li a1, 2
  call addWeighted
  ; sci/stats.e16.ts:433  addWeighted(row + 8, S_Y)
  addi a0, s1, 8
  li a1, 3
  call addWeighted
  ; sci/stats.e16.ts:434  copy8(row + 8, at(T1))
  addi a0, s1, 8
  li a1, 9680
  call copy8
  ; sci/stats.e16.ts:435  math(M_MUL, at(T1), row + 8, 0)
  li a0, 3
  li a1, 9680
  addi a2, s1, 8
  li a3, 0
  call math
  ; sci/stats.e16.ts:436  addWeighted(at(T1), S_YY)
  li a0, 9680
  li a1, 4
  call addWeighted
  ; sci/stats.e16.ts:437  copy8(row, at(T1))
  mv a0, s1
  li a1, 9680
  call copy8
  ; sci/stats.e16.ts:438  math(M_MUL, at(T1), row + 8, 0)
  li a0, 3
  li a1, 9680
  addi a2, s1, 8
  li a3, 0
  call math
  ; sci/stats.e16.ts:439  addWeighted(at(T1), S_XY)
  li a0, 9680
  li a1, 5
  call addWeighted
  ; sci/stats.e16.ts:440  if (twoVar()) fitRow(row)
  call twoVar
  beqz a0, .L1
  ; sci/stats.e16.ts:440  fitRow(row)
  mv a0, s1
  call fitRow
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/stats.e16.ts:444 addWeighted(v, sum) at -O1
;   v in s1
;   sum in s2
addWeighted:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; v
  mv s2, a1 ; sum
  ; sci/stats.e16.ts:445  copy8(v, at(T2))
  mv a0, s1
  li a1, 9688
  call copy8
  ; sci/stats.e16.ts:446  math(M_MUL, at(T2), at(FREQ), 0)
  li a0, 3
  li a1, 9688
  li a2, 9704
  li a3, 0
  call math
  ; sci/stats.e16.ts:447  math(M_ADD, at(sum), at(T2), 0)
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

; sci/stats.e16.ts:454 fitRow(row) at -O1
;   row in s1
;   t in s2
fitRow:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; row
  ; sci/stats.e16.ts:455  const t = statKind()
  call statKind
  mv s2, a0 ; t
  ; sci/stats.e16.ts:456  uvOf(row)
  mv a0, s1
  call uvOf
  ; sci/stats.e16.ts:457  addWeighted(at(U), F_U)
  li a0, 9712
  li a1, 16
  call addWeighted
  ; sci/stats.e16.ts:458  addWeighted(at(V), F_V)
  li a0, 9720
  li a1, 18
  call addWeighted
  ; sci/stats.e16.ts:459  if (t === KIND_QUAD) quadRow(row)
  li t0, 2
  bne s2, t0, .L1
  ; sci/stats.e16.ts:459  quadRow(row)
  mv a0, s1
  call quadRow
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:463 uvOf(row) at -O1
;   row in s2
;   t in s1
uvOf:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; row
  ; sci/stats.e16.ts:464  const t = statKind()
  call statKind
  mv s1, a0 ; t
  ; sci/stats.e16.ts:465  copy8(row, at(U))
  mv a0, s2
  li a1, 9712
  call copy8
  ; sci/stats.e16.ts:466  copy8(row + 8, at(V))
  addi a0, s2, 8
  li a1, 9720
  call copy8
  ; sci/stats.e16.ts:467  if (t === KIND_LOG || t === KIND_PWR) math(M_LN, at(U), 0, 0)
  li t0, 4
  beq s1, t0, .L2
  li t0, 5
  bne s1, t0, .L1
.L2:
  ; sci/stats.e16.ts:467  math(M_LN, at(U), 0, 0)
  li a0, 28
  li a1, 9712
  li a2, 0
  li a3, 0
  call math
.L1:
  ; sci/stats.e16.ts:468  if (t === KIND_INV) {
  li t0, 6
  bne s1, t0, .L3
  ; sci/stats.e16.ts:469  setWhole(T3, 1)
  li a0, 28
  li a1, 1
  call setWhole
  ; sci/stats.e16.ts:470  math(M_DIV, at(T3), at(U), 0)
  li a0, 4
  li a1, 9696
  li a2, 9712
  li a3, 0
  call math
  ; sci/stats.e16.ts:471  copy8(at(T3), at(U))
  li a0, 9696
  li a1, 9712
  call copy8
.L3:
  ; sci/stats.e16.ts:473  if (t === KIND_EXP || t === KIND_PWR) math(M_LN, at(V), 0, 0)
  li t0, 3
  beq s1, t0, .L5
  li t0, 5
  bne s1, t0, .L4
.L5:
  ; sci/stats.e16.ts:473  math(M_LN, at(V), 0, 0)
  li a0, 28
  li a1, 9720
  li a2, 0
  li a3, 0
  call math
.L4:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:476 quadRow(row) at -O1
;   row in s1
quadRow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; row
  ; sci/stats.e16.ts:477  copy8(row, at(T1))
  mv a0, s1
  li a1, 9680
  call copy8
  ; sci/stats.e16.ts:478  math(M_MUL, at(T1), row, 0)
  li a0, 3
  li a1, 9680
  mv a2, s1
  li a3, 0
  call math
  ; sci/stats.e16.ts:479  math(M_MUL, at(T1), row, 0)
  li a0, 3
  li a1, 9680
  mv a2, s1
  li a3, 0
  call math
  ; sci/stats.e16.ts:480  addWeighted(at(T1), Q_X3)
  li a0, 9680
  li a1, 23
  call addWeighted
  ; sci/stats.e16.ts:481  math(M_MUL, at(T1), row, 0)
  li a0, 3
  li a1, 9680
  mv a2, s1
  li a3, 0
  call math
  ; sci/stats.e16.ts:482  addWeighted(at(T1), Q_X4)
  li a0, 9680
  li a1, 24
  call addWeighted
  ; sci/stats.e16.ts:483  copy8(row, at(T1))
  mv a0, s1
  li a1, 9680
  call copy8
  ; sci/stats.e16.ts:484  math(M_MUL, at(T1), row, 0)
  li a0, 3
  li a1, 9680
  mv a2, s1
  li a3, 0
  call math
  ; sci/stats.e16.ts:485  math(M_MUL, at(T1), row + 8, 0)
  li a0, 3
  li a1, 9680
  addi a2, s1, 8
  li a3, 0
  call math
  ; sci/stats.e16.ts:486  addWeighted(at(T1), Q_X2Y)
  li a0, 9680
  li a1, 25
  call addWeighted
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/stats.e16.ts:493 means(mean) at -O1
;   mean in s1
;   sd in s3
;   sample in s2
means:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; mean
  ; sci/stats.e16.ts:495  const sd = mean + 1
  addi s3, s1, 1
  ; sci/stats.e16.ts:496  const sample = mean + 2
  addi s2, s1, 2
  ; sci/stats.e16.ts:497  if (isZero(at(S_N)) || isNegative(at(S_N))) {
  li a0, 9472
  call isZero
  bnez a0, .L2
  li a0, 9472
  call isNegative
  beqz a0, .L1
.L2:
  ; sci/stats.e16.ts:498  setValid(mean, false)
  mv a0, s1
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:499  setValid(sd, false)
  mv a0, s3
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:500  setValid(sample, false)
  mv a0, s2
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:501  return
  j .return
.L1:
  ; sci/stats.e16.ts:503  sop(M_DIV, T1, mean === R_MX ? C_XX : C_YY, S_N)
  li t0, 4
  li t1, 26
  mv t2, s1
  li t3, 6
  bne t2, t3, .L3
  li t2, 44
  j .L4
.L3:
  li t2, 45
.L4:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 0
  call sop
  ; sci/stats.e16.ts:504  sop(M_SQR, sd, T1, T1)
  li a0, 21
  mv a1, s3
  li a2, 26
  li a3, 26
  call sop
  ; sci/stats.e16.ts:506  copy8(at(S_N), at(T2))
  li a0, 9472
  li a1, 9688
  call copy8
  ; sci/stats.e16.ts:507  setWhole(T3, 1)
  li a0, 28
  li a1, 1
  call setWhole
  ; sci/stats.e16.ts:508  math(M_SUB, at(T2), at(T3), 0)
  li a0, 2
  li a1, 9688
  li a2, 9696
  li a3, 0
  call math
  ; sci/stats.e16.ts:509  if (isZero(at(T2)) || isNegative(at(T2))) {
  li a0, 9688
  call isZero
  bnez a0, .L6
  li a0, 9688
  call isNegative
  beqz a0, .L5
.L6:
  ; sci/stats.e16.ts:510  setValid(sample, false)
  mv a0, s2
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:511  return
  j .return
.L5:
  ; sci/stats.e16.ts:513  math(M_MUL, at(T1), at(S_N), 0)
  li a0, 3
  li a1, 9680
  li a2, 9472
  li a3, 0
  call math
  ; sci/stats.e16.ts:514  math(M_DIV, at(T1), at(T2), 0)
  li a0, 4
  li a1, 9680
  li a2, 9688
  li a3, 0
  call math
  ; sci/stats.e16.ts:515  sop(M_SQR, sample, T1, T1)
  li a0, 21
  mv a1, s2
  li a2, 26
  li a3, 26
  call sop
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/stats.e16.ts:523 fitLine() at -O1
;   t in s1
fitLine:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/stats.e16.ts:524  if (isZero(at(S_N))) {
  li a0, 9472
  call isZero
  beqz a0, .L1
  ; sci/stats.e16.ts:525  setValid(R_R, false)
  li a0, 12
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:526  setValid(R_A, false)
  li a0, 13
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:527  setValid(R_B, false)
  li a0, 14
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:528  return
  j .return
.L1:
  ; sci/stats.e16.ts:530  copy8(at(C_UV), at(T1))
  li a0, 9856
  li a1, 9680
  call copy8
  ; sci/stats.e16.ts:531  copy8(at(C_UU), at(T2))
  li a0, 9840
  li a1, 9688
  call copy8
  ; sci/stats.e16.ts:532  copy8(at(C_VV), at(T3))
  li a0, 9848
  li a1, 9696
  call copy8
  ; sci/stats.e16.ts:533  if (isZero(at(T2))) {
  li a0, 9688
  call isZero
  beqz a0, .L2
  ; sci/stats.e16.ts:534  setValid(R_B, false)
  li a0, 14
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:535  setValid(R_A, false)
  li a0, 13
  li a1, 0
  call setValid
  j .L3
.L2:
  ; sci/stats.e16.ts:537  sop(M_DIV, R_B, T1, T2)
  li a0, 4
  li a1, 14
  li a2, 26
  li a3, 27
  call sop
  ; sci/stats.e16.ts:538  sop(M_MUL, FREQ, R_B, F_MU)
  li a0, 3
  li a1, 29
  li a2, 14
  li a3, 21
  call sop
  ; sci/stats.e16.ts:539  sop(M_SUB, R_A, F_MV, FREQ)
  li a0, 2
  li a1, 13
  li a2, 22
  li a3, 29
  call sop
  ; sci/stats.e16.ts:540  const t = statKind()
  call statKind
  mv s1, a0 ; t
  ; sci/stats.e16.ts:541  if (t === KIND_EXP || t === KIND_PWR) math(M_EXP, at(R_A), 0, 0)
  li t0, 3
  beq s1, t0, .L5
  li t0, 5
  bne s1, t0, .L4
.L5:
  ; sci/stats.e16.ts:541  math(M_EXP, at(R_A), 0, 0)
  li a0, 30
  li a1, 9576
  li a2, 0
  li a3, 0
  call math
.L4:
.L3:
  ; sci/stats.e16.ts:543  math(M_MUL, at(T2), at(T3), 0)
  li a0, 3
  li a1, 9688
  li a2, 9696
  li a3, 0
  call math
  ; sci/stats.e16.ts:544  if (isZero(at(T2)) || isNegative(at(T2))) {
  li a0, 9688
  call isZero
  bnez a0, .L7
  li a0, 9688
  call isNegative
  beqz a0, .L6
.L7:
  ; sci/stats.e16.ts:545  setValid(R_R, false)
  li a0, 12
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:546  return
  j .return
.L6:
  ; sci/stats.e16.ts:548  math(M_SQR, at(T2), 0, 0)
  li a0, 21
  li a1, 9688
  li a2, 0
  li a3, 0
  call math
  ; sci/stats.e16.ts:549  sop(M_DIV, R_R, T1, T2)
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

; sci/stats.e16.ts:553 qcell(r, c) at -O1
;   r in a0
;   c in a1
qcell:
  ; sci/stats.e16.ts:554  return QM + r * 4 + c
  slli t0, a0, 2
  addi t0, t0, 32
  add a0, t0, a1
.return:
  ret

; sci/stats.e16.ts:562 fitQuadratic() at -O1
;   k/i in s1
;   i in s2
fitQuadratic:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/stats.e16.ts:563  setValid(R_R, false)
  li a0, 12
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:564  copy8(at(S_N), at(qcell(0, 0)))
  li a0, 9472
  li a1, 9728
  call copy8
  ; sci/stats.e16.ts:565  copy8(at(S_X), at(qcell(0, 1)))
  li a0, 9480
  li a1, 9736
  call copy8
  ; sci/stats.e16.ts:566  copy8(at(S_XX), at(qcell(0, 2)))
  li a0, 9488
  li a1, 9744
  call copy8
  ; sci/stats.e16.ts:567  copy8(at(S_Y), at(qcell(0, 3)))
  li a0, 9496
  li a1, 9752
  call copy8
  ; sci/stats.e16.ts:568  copy8(at(S_X), at(qcell(1, 0)))
  li a0, 9480
  li a1, 9760
  call copy8
  ; sci/stats.e16.ts:569  copy8(at(S_XX), at(qcell(1, 1)))
  li a0, 9488
  li a1, 9768
  call copy8
  ; sci/stats.e16.ts:570  copy8(at(Q_X3), at(qcell(1, 2)))
  li a0, 9656
  li a1, 9776
  call copy8
  ; sci/stats.e16.ts:571  copy8(at(S_XY), at(qcell(1, 3)))
  li a0, 9512
  li a1, 9784
  call copy8
  ; sci/stats.e16.ts:572  copy8(at(S_XX), at(qcell(2, 0)))
  li a0, 9488
  li a1, 9792
  call copy8
  ; sci/stats.e16.ts:573  copy8(at(Q_X3), at(qcell(2, 1)))
  li a0, 9656
  li a1, 9800
  call copy8
  ; sci/stats.e16.ts:574  copy8(at(Q_X4), at(qcell(2, 2)))
  li a0, 9664
  li a1, 9808
  call copy8
  ; sci/stats.e16.ts:575  copy8(at(Q_X2Y), at(qcell(2, 3)))
  li a0, 9672
  li a1, 9816
  call copy8
  ; sci/stats.e16.ts:576  for (let k: u16 = 0; k < 3; k++) {
  li s1, 0 ; k/i
  j .L3
.L1:
  ; sci/stats.e16.ts:577  if (isZero(at(qcell(k, k)))) {
  mv a0, s1
  mv a1, s1
  call qcell
  call at
  call isZero
  beqz a0, .L5
  ; sci/stats.e16.ts:578  setValid(R_A, false)
  li a0, 13
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:579  setValid(R_B, false)
  li a0, 14
  li a1, 0
  call setValid
  ; sci/stats.e16.ts:580  return
  j .return
.L5:
  ; sci/stats.e16.ts:582  for (let i = k + 1; i < 3; i++) clearBelow(i, k)
  addi s2, s1, 1
  j .L8
.L6:
  ; sci/stats.e16.ts:582  clearBelow(i, k)
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
  ; sci/stats.e16.ts:584  for (let i: u16 = 3; i > 0; i--) quadBack(i - 1)
  li s1, 3 ; k/i
  j .L12
.L10:
  ; sci/stats.e16.ts:584  quadBack(i - 1)
  addi a0, s1, -1
  call quadBack
  addi s1, s1, -1
.L12:
  bltu zero, s1, .L10
  ; sci/stats.e16.ts:585  setValid(R_C, true)
  li a0, 15
  li a1, 1
  call setValid
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/stats.e16.ts:589 clearBelow(i, k) at -O1
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
  ; sci/stats.e16.ts:590  sop(M_DIV, T3, qcell(i, k), qcell(k, k))
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
  ; sci/stats.e16.ts:591  for (let c = k; c < 4; c++) {
  mv s2, s1 ; c
  j .L3
.L1:
  ; sci/stats.e16.ts:592  sop(M_MUL, T1, qcell(k, c), T3)
  mv a0, s1
  mv a1, s2
  call qcell
  li a1, 26
  mv a2, a0
  li a0, 3
  li a3, 28
  call sop
  ; sci/stats.e16.ts:593  math(M_SUB, at(qcell(i, c)), at(T1), 0)
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

; sci/stats.e16.ts:598 quadBack(i) at -O1
;   i in s1
;   j in s2
quadBack:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  ; sci/stats.e16.ts:599  copy8(at(qcell(i, 3)), at(T2))
  mv a0, s1
  li a1, 3
  call qcell
  call at
  li a1, 9688
  call copy8
  ; sci/stats.e16.ts:600  for (let j = i + 1; j < 3; j++) {
  addi s2, s1, 1
  j .L3
.L1:
  ; sci/stats.e16.ts:601  sop(M_MUL, T1, qcell(i, j), R_A + j)
  mv a0, s1
  mv a1, s2
  call qcell
  li a1, 26
  mv a2, a0
  li a0, 3
  addi a3, s2, 13
  call sop
  ; sci/stats.e16.ts:602  math(M_SUB, at(T2), at(T1), 0)
  li a0, 2
  li a1, 9688
  li a2, 9680
  li a3, 0
  call math
  addi s2, s2, 1
.L3:
  li t0, 3
  bltu s2, t0, .L1
  ; sci/stats.e16.ts:604  math(M_DIV, at(T2), at(qcell(i, i)), 0)
  mv a0, s1
  mv a1, s1
  call qcell
  call at
  li a1, 9688
  mv a2, a0
  li a0, 4
  li a3, 0
  call math
  ; sci/stats.e16.ts:605  copy8(at(T2), at(R_A + i))
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

; sci/stats.e16.ts:610 drawResults() at -O1
;   pages/i in s1
;   arrow/item in s2
drawResults:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/stats.e16.ts:611  const pages: u16 = twoVar() ? 3 : 1
  call twoVar
  beqz a0, .L1
  li t0, 3
  j .L2
.L1:
  li t0, 1
.L2:
  mv s1, t0 ; pages/i
  ; sci/stats.e16.ts:612  let arrow: u16 = 0
  li s2, 0 ; arrow/item
  ; sci/stats.e16.ts:613  if (resultPage + 1 < pages) arrow = str('\x8e')
  lw t0, 0x084e(zero)
  addi t0, t0, 1
  bgeu t0, s1, .L3
  ; sci/stats.e16.ts:613  arrow = str('\x8e')
  la s2, str_125
  j .L4
.L3:
  ; sci/stats.e16.ts:614  if (resultPage > 0) arrow = str('\x8d')
  lw t0, 0x084e(zero)
  bgeu zero, t0, .L5
  ; sci/stats.e16.ts:614  arrow = str('\x8d')
  la s2, str_126
.L5:
.L4:
  ; sci/stats.e16.ts:615  bandWith(kindTitle(0, str(' RESULT')), arrow)
  li a0, 0
  la a1, str_127
  call kindTitle
  mv a1, s2
  call bandWith
  ; sci/stats.e16.ts:616  for (let i: u16 = 0; i < 6; i++) {
  li s1, 0 ; pages/i
  j .L8
.L6:
  ; sci/stats.e16.ts:617  const item = itemOf(resultPage, i)
  lw a0, 0x084e(zero)
  mv a1, s1
  call itemOf
  mv s2, a0 ; arrow/item
  ; sci/stats.e16.ts:618  if (item !== 0xffff) resultLine(item, i)
  li t0, 65535
  beq s2, t0, .L10
  ; sci/stats.e16.ts:618  resultLine(item, i)
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

; sci/stats.e16.ts:623 itemOf(page, n) at -O1
;   page in s2
;   n in s1
itemOf:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; page
  mv s1, a1 ; n
  ; sci/stats.e16.ts:624  if (!twoVar()) return page === 0 ? pick1(n) : 0xffff
  call twoVar
  bnez a0, .L1
  ; sci/stats.e16.ts:624  return page === 0 ? pick1(n) : 0xffff
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
  ; sci/stats.e16.ts:625  if (page === 0) return pick2(n)
  bne s2, zero, .L4
  ; sci/stats.e16.ts:625  return pick2(n)
  mv a0, s1
  call pick2
  j .return
.L4:
  ; sci/stats.e16.ts:626  if (page === 1) return n < 5 ? pickSpread(n) : 0xffff
  li t0, 1
  bne s2, t0, .L5
  ; sci/stats.e16.ts:626  return n < 5 ? pickSpread(n) : 0xffff
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
  ; sci/stats.e16.ts:627  return n < 5 ? S_X + pickSum(n) : 0xffff
  li t0, 5
  bgeu s1, t0, .L8
  ; sci/stats.e16.ts:680  return n
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

; sci/stats.e16.ts:630 pick1(n) at -O1
;   n in a0
pick1:
  ; sci/stats.e16.ts:631  switch (n) {
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
  ; sci/stats.e16.ts:633  return S_N
  li a0, 0
  ret
.L3:
  ; sci/stats.e16.ts:635  return R_MX
  li a0, 6
  ret
.L4:
  ; sci/stats.e16.ts:637  return R_SDX
  li a0, 7
  ret
.L5:
  ; sci/stats.e16.ts:639  return R_SX
  li a0, 8
  ret
.L6:
  ; sci/stats.e16.ts:641  return S_X
  li a0, 1
  ret
.L1:
  ; sci/stats.e16.ts:643  return S_XX
  li a0, 2
.return:
  ret

; sci/stats.e16.ts:647 pick2(n) at -O1
;   n in a0
pick2:
  ; sci/stats.e16.ts:648  switch (n) {
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
  ; sci/stats.e16.ts:650  return S_N
  li a0, 0
  ret
.L3:
  ; sci/stats.e16.ts:652  return R_MX
  li a0, 6
  ret
.L4:
  ; sci/stats.e16.ts:654  return R_MY
  li a0, 9
  ret
.L5:
  ; sci/stats.e16.ts:656  return R_R
  li a0, 12
  ret
.L6:
  ; sci/stats.e16.ts:658  return R_A
  li a0, 13
  ret
.L1:
  ; sci/stats.e16.ts:660  return R_B
  li a0, 14
.return:
  ret

; sci/stats.e16.ts:664 pickSpread(n) at -O1
;   n in a0
pickSpread:
  ; sci/stats.e16.ts:665  switch (n) {
  beq a0, zero, .L2
  li t0, 1
  beq a0, t0, .L3
  li t0, 2
  beq a0, t0, .L4
  li t0, 3
  beq a0, t0, .L5
  j .L1
.L2:
  ; sci/stats.e16.ts:667  return R_C
  li a0, 15
  ret
.L3:
  ; sci/stats.e16.ts:669  return R_SDX
  li a0, 7
  ret
.L4:
  ; sci/stats.e16.ts:671  return R_SX
  li a0, 8
  ret
.L5:
  ; sci/stats.e16.ts:673  return R_SDY
  li a0, 10
  ret
.L1:
  ; sci/stats.e16.ts:675  return R_SY
  li a0, 11
.return:
  ret

; sci/stats.e16.ts:683 resultLine(item, row) at -O1
;   item in s1
;   row in s2
resultLine:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; item
  mv s2, a1 ; row
  ; sci/stats.e16.ts:684  textAt(nameOf(item), 1, lineY(row))
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
  ; sci/stats.e16.ts:685  if (!isValid(item)) textRight(str('-'), lineY(row))
  mv a0, s1
  call isValid
  bnez a0, .L1
  ; sci/stats.e16.ts:685  textRight(str('-'), lineY(row))
  mv a0, s2
  call lineY
  mv a1, a0
  la a0, str_128
  call textRight
  j .L2
.L1:
  ; sci/stats.e16.ts:686  textRight(textOf(at(item)), lineY(row))
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

; sci/stats.e16.ts:690 nameOf(item) at -O1
;   item in a0
nameOf:
  ; sci/stats.e16.ts:691  switch (item) {
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
  ; sci/stats.e16.ts:693  return str('n=')
  la a0, str_129
  ret
.L3:
  ; sci/stats.e16.ts:695  return str('\x95=')
  la a0, str_130
  ret
.L4:
  ; sci/stats.e16.ts:697  return str('\x96=')
  la a0, str_131
  ret
.L5:
  ; sci/stats.e16.ts:699  return str('\x91x=')
  la a0, str_132
  ret
.L6:
  ; sci/stats.e16.ts:701  return str('sx=')
  la a0, str_133
  ret
.L7:
  ; sci/stats.e16.ts:703  return str('\x91y=')
  la a0, str_134
  ret
.L8:
  ; sci/stats.e16.ts:705  return str('sy=')
  la a0, str_135
  ret
.L9:
  ; sci/stats.e16.ts:707  return str('\x90x=')
  la a0, str_136
  ret
.L10:
  ; sci/stats.e16.ts:709  return str('\x90x\x84=')
  la a0, str_137
  ret
.L11:
  ; sci/stats.e16.ts:711  return str('\x90y=')
  la a0, str_138
  ret
.L12:
  ; sci/stats.e16.ts:713  return str('\x90y\x84=')
  la a0, str_139
  ret
.L13:
  ; sci/stats.e16.ts:715  return str('\x90xy=')
  la a0, str_140
  ret
.L14:
  ; sci/stats.e16.ts:717  return str('r=')
  la a0, str_141
  ret
.L15:
  ; sci/stats.e16.ts:719  return str('a=')
  la a0, str_142
  ret
.L16:
  ; sci/stats.e16.ts:721  return str('c=')
  la a0, str_143
  ret
.L1:
  ; sci/stats.e16.ts:723  return str('b=')
  la a0, str_144
.return:
  ret

; sci/stats.e16.ts:733 statValue(k/item, dst) at -O1
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
  ; sci/stats.e16.ts:734  const item = statItem(k)
  mv a0, s1
  call statItem
  mv s1, a0 ; k/item
  ; sci/stats.e16.ts:735  const ofY =
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
  ; sci/stats.e16.ts:737  if (peek16(STATS_COUNT) === 0 || (ofY && !twoVar())) fail(E_MATH, 0)
  lw t0, 5634(zero)
  beq t0, zero, .L7
  beqz s3, .L6
  call twoVar
  bnez a0, .L6
.L7:
  ; sci/stats.e16.ts:737  fail(E_MATH, 0)
  li a0, 1
  li a1, 0
  call fail
.L6:
  ; sci/stats.e16.ts:738  workOut()
  call workOut
  ; sci/stats.e16.ts:739  if (!isValid(item)) fail(E_MATH, 0)
  mv a0, s1
  call isValid
  bnez a0, .L8
  ; sci/stats.e16.ts:739  fail(E_MATH, 0)
  li a0, 1
  li a1, 0
  call fail
.L8:
  ; sci/stats.e16.ts:740  copy8(at(item), dst)
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

; sci/stats.e16.ts:743 statItem(k) at -O1
;   k in a0
statItem:
  ; sci/stats.e16.ts:744  switch (k) {
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
  ; sci/stats.e16.ts:746  return S_N
  li a0, 0
  ret
.L3:
  ; sci/stats.e16.ts:748  return R_MX
  li a0, 6
  ret
.L4:
  ; sci/stats.e16.ts:750  return R_SDX
  li a0, 7
  ret
.L5:
  ; sci/stats.e16.ts:752  return R_SX
  li a0, 8
  ret
.L6:
  ; sci/stats.e16.ts:754  return R_MY
  li a0, 9
  ret
.L7:
  ; sci/stats.e16.ts:756  return R_SDY
  li a0, 10
  ret
.L8:
  ; sci/stats.e16.ts:758  return R_SY
  li a0, 11
  ret
.L9:
  ; sci/stats.e16.ts:760  return S_X
  li a0, 1
  ret
.L10:
  ; sci/stats.e16.ts:762  return S_XX
  li a0, 2
  ret
.L11:
  ; sci/stats.e16.ts:764  return S_Y
  li a0, 3
  ret
.L12:
  ; sci/stats.e16.ts:766  return S_YY
  li a0, 4
  ret
.L13:
  ; sci/stats.e16.ts:768  return S_XY
  li a0, 5
  ret
.L14:
  ; sci/stats.e16.ts:770  return R_R
  li a0, 12
  ret
.L15:
  ; sci/stats.e16.ts:772  return R_A
  li a0, 13
  ret
.L16:
  ; sci/stats.e16.ts:774  return R_C
  li a0, 15
  ret
.L1:
  ; sci/stats.e16.ts:776  return R_B
  li a0, 14
.return:
  ret

; sci/stats.e16.ts:789 statEstimate(which, v) at -O1
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
  ; sci/stats.e16.ts:790  const t = statKind()
  call statKind
  mv s1, a0 ; t
  ; sci/stats.e16.ts:791  if (peek16(STATS_COUNT) === 0 || t === KIND_1VAR) fail(E_MATH, 0)
  lw t0, 5634(zero)
  beq t0, zero, .L2
  bne s1, zero, .L1
.L2:
  ; sci/stats.e16.ts:791  fail(E_MATH, 0)
  li a0, 1
  li a1, 0
  call fail
.L1:
  ; sci/stats.e16.ts:792  workOut()
  call workOut
  ; sci/stats.e16.ts:793  if (!isValid(R_A) || !isValid(R_B)) fail(E_MATH, 0)
  li a0, 13
  call isValid
  beqz a0, .L4
  li a0, 14
  call isValid
  bnez a0, .L3
.L4:
  ; sci/stats.e16.ts:793  fail(E_MATH, 0)
  li a0, 1
  li a1, 0
  call fail
.L3:
  ; sci/stats.e16.ts:794  copy8(v, at(U))
  mv a0, s3
  li a1, 9712
  call copy8
  ; sci/stats.e16.ts:795  if (t === KIND_QUAD) quadEstimate(which)
  li t0, 2
  bne s1, t0, .L5
  ; sci/stats.e16.ts:795  quadEstimate(which)
  mv a0, s2
  call quadEstimate
  j .L6
.L5:
  ; sci/stats.e16.ts:796  if (which === EST_X2) fail(E_MATH, 0)
  li t0, 2
  bne s2, t0, .L7
  ; sci/stats.e16.ts:796  fail(E_MATH, 0)
  li a0, 1
  li a1, 0
  call fail
  j .L8
.L7:
  ; sci/stats.e16.ts:797  if (which === EST_Y) yOf(t)
  bne s2, zero, .L9
  ; sci/stats.e16.ts:797  yOf(t)
  mv a0, s1
  call yOf
  j .L10
.L9:
  ; sci/stats.e16.ts:798  xOf(t)
  mv a0, s1
  call xOf
.L10:
.L8:
.L6:
  ; sci/stats.e16.ts:799  copy8(at(U), v)
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

; sci/stats.e16.ts:803 yOf(t) at -O1
;   t in s1
yOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/stats.e16.ts:804  if (t === KIND_LOG) math(M_LN, at(U), 0, 0)
  li t0, 4
  bne s1, t0, .L1
  ; sci/stats.e16.ts:804  math(M_LN, at(U), 0, 0)
  li a0, 28
  li a1, 9712
  li a2, 0
  li a3, 0
  call math
.L1:
  ; sci/stats.e16.ts:805  if (t === KIND_INV) {
  li t0, 6
  bne s1, t0, .L2
  ; sci/stats.e16.ts:806  setWhole(T1, 1)
  li a0, 26
  li a1, 1
  call setWhole
  ; sci/stats.e16.ts:807  math(M_DIV, at(T1), at(U), 0)
  li a0, 4
  li a1, 9680
  li a2, 9712
  li a3, 0
  call math
  ; sci/stats.e16.ts:808  copy8(at(T1), at(U))
  li a0, 9680
  li a1, 9712
  call copy8
.L2:
  ; sci/stats.e16.ts:810  if (t === KIND_PWR) {
  li t0, 5
  bne s1, t0, .L3
  ; sci/stats.e16.ts:811  copy8(at(U), at(T1))
  li a0, 9712
  li a1, 9680
  call copy8
  ; sci/stats.e16.ts:812  copy8(at(R_B), at(U))
  li a0, 9584
  li a1, 9712
  call copy8
  ; sci/stats.e16.ts:813  math(M_POW, at(T1), at(U), 0)
  li a0, 5
  li a1, 9680
  li a2, 9712
  li a3, 0
  call math
  ; sci/stats.e16.ts:814  sop(M_MUL, U, T1, R_A)
  li a0, 3
  li a1, 30
  li a2, 26
  li a3, 13
  call sop
  ; sci/stats.e16.ts:815  return
  j .return
.L3:
  ; sci/stats.e16.ts:817  math(M_MUL, at(U), at(R_B), 0)
  li a0, 3
  li a1, 9712
  li a2, 9584
  li a3, 0
  call math
  ; sci/stats.e16.ts:818  if (t === KIND_EXP) {
  li t0, 3
  bne s1, t0, .L4
  ; sci/stats.e16.ts:819  math(M_EXP, at(U), 0, 0)
  li a0, 30
  li a1, 9712
  li a2, 0
  li a3, 0
  call math
  ; sci/stats.e16.ts:820  math(M_MUL, at(U), at(R_A), 0)
  li a0, 3
  li a1, 9712
  li a2, 9576
  li a3, 0
  call math
  j .L5
.L4:
  ; sci/stats.e16.ts:821  math(M_ADD, at(U), at(R_A), 0)
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

; sci/stats.e16.ts:825 xOf(t) at -O1
;   t in s1
xOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/stats.e16.ts:826  if (t === KIND_EXP || t === KIND_PWR) {
  li t0, 3
  beq s1, t0, .L2
  li t0, 5
  bne s1, t0, .L1
.L2:
  ; sci/stats.e16.ts:827  math(M_DIV, at(U), at(R_A), 0)
  li a0, 4
  li a1, 9712
  li a2, 9576
  li a3, 0
  call math
  ; sci/stats.e16.ts:828  if (t === KIND_EXP) {
  li t0, 3
  bne s1, t0, .L3
  ; sci/stats.e16.ts:829  math(M_LN, at(U), 0, 0)
  li a0, 28
  li a1, 9712
  li a2, 0
  li a3, 0
  call math
  ; sci/stats.e16.ts:830  math(M_DIV, at(U), at(R_B), 0)
  li a0, 4
  li a1, 9712
  li a2, 9584
  li a3, 0
  call math
  j .L4
.L3:
  ; sci/stats.e16.ts:832  setWhole(T1, 1)
  li a0, 26
  li a1, 1
  call setWhole
  ; sci/stats.e16.ts:833  math(M_DIV, at(T1), at(R_B), 0)
  li a0, 4
  li a1, 9680
  li a2, 9584
  li a3, 0
  call math
  ; sci/stats.e16.ts:834  math(M_POW, at(U), at(T1), 0)
  li a0, 5
  li a1, 9712
  li a2, 9680
  li a3, 0
  call math
.L4:
  ; sci/stats.e16.ts:836  return
  j .return
.L1:
  ; sci/stats.e16.ts:838  math(M_SUB, at(U), at(R_A), 0)
  li a0, 2
  li a1, 9712
  li a2, 9576
  li a3, 0
  call math
  ; sci/stats.e16.ts:839  if (t === KIND_INV) {
  li t0, 6
  bne s1, t0, .L5
  ; sci/stats.e16.ts:840  copy8(at(R_B), at(T1))
  li a0, 9584
  li a1, 9680
  call copy8
  ; sci/stats.e16.ts:841  math(M_DIV, at(T1), at(U), 0)
  li a0, 4
  li a1, 9680
  li a2, 9712
  li a3, 0
  call math
  ; sci/stats.e16.ts:842  copy8(at(T1), at(U))
  li a0, 9680
  li a1, 9712
  call copy8
  ; sci/stats.e16.ts:843  return
  j .return
.L5:
  ; sci/stats.e16.ts:845  math(M_DIV, at(U), at(R_B), 0)
  li a0, 4
  li a1, 9712
  li a2, 9584
  li a3, 0
  call math
  ; sci/stats.e16.ts:846  if (t === KIND_LOG) math(M_EXP, at(U), 0, 0)
  li t0, 4
  bne s1, t0, .L6
  ; sci/stats.e16.ts:846  math(M_EXP, at(U), 0, 0)
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

; sci/stats.e16.ts:850 quadEstimate(which) at -O1
;   which in s1
quadEstimate:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; which
  ; sci/stats.e16.ts:851  if (which === EST_Y) {
  bne s1, zero, .L1
  ; sci/stats.e16.ts:852  sop(M_MUL, T1, U, R_C)
  li a0, 3
  li a1, 26
  li a2, 30
  li a3, 15
  call sop
  ; sci/stats.e16.ts:853  math(M_ADD, at(T1), at(R_B), 0)
  li a0, 1
  li a1, 9680
  li a2, 9584
  li a3, 0
  call math
  ; sci/stats.e16.ts:854  math(M_MUL, at(T1), at(U), 0)
  li a0, 3
  li a1, 9680
  li a2, 9712
  li a3, 0
  call math
  ; sci/stats.e16.ts:855  math(M_ADD, at(T1), at(R_A), 0)
  li a0, 1
  li a1, 9680
  li a2, 9576
  li a3, 0
  call math
  ; sci/stats.e16.ts:856  copy8(at(T1), at(U))
  li a0, 9680
  li a1, 9712
  call copy8
  ; sci/stats.e16.ts:857  return
  j .return
.L1:
  ; sci/stats.e16.ts:859  if (isZero(at(R_C))) fail(E_MATH, 0)
  li a0, 9592
  call isZero
  beqz a0, .L2
  ; sci/stats.e16.ts:859  fail(E_MATH, 0)
  li a0, 1
  li a1, 0
  call fail
.L2:
  ; sci/stats.e16.ts:861  sop(M_SUB, T1, R_A, U)
  li a0, 2
  li a1, 26
  li a2, 13
  li a3, 30
  call sop
  ; sci/stats.e16.ts:862  math(M_MUL, at(T1), at(R_C), 0)
  li a0, 3
  li a1, 9680
  li a2, 9592
  li a3, 0
  call math
  ; sci/stats.e16.ts:863  setWhole(T2, 4)
  li a0, 27
  li a1, 4
  call setWhole
  ; sci/stats.e16.ts:864  math(M_MUL, at(T1), at(T2), 0)
  li a0, 3
  li a1, 9680
  li a2, 9688
  li a3, 0
  call math
  ; sci/stats.e16.ts:865  sop(M_MUL, T2, R_B, R_B)
  li a0, 3
  li a1, 27
  li a2, 14
  li a3, 14
  call sop
  ; sci/stats.e16.ts:866  math(M_SUB, at(T2), at(T1), 0)
  li a0, 2
  li a1, 9688
  li a2, 9680
  li a3, 0
  call math
  ; sci/stats.e16.ts:867  math(M_SQR, at(T2), 0, 0)
  li a0, 21
  li a1, 9688
  li a2, 0
  li a3, 0
  call math
  ; sci/stats.e16.ts:868  copy8(at(R_B), at(U))
  li a0, 9584
  li a1, 9712
  call copy8
  ; sci/stats.e16.ts:869  math(M_NEG, at(U), 0, 0)
  li a0, 16
  li a1, 9712
  li a2, 0
  li a3, 0
  call math
  ; sci/stats.e16.ts:870  if (which === EST_X) math(M_ADD, at(U), at(T2), 0)
  li t0, 1
  bne s1, t0, .L3
  ; sci/stats.e16.ts:870  math(M_ADD, at(U), at(T2), 0)
  li a0, 1
  li a1, 9712
  li a2, 9688
  li a3, 0
  call math
  j .L4
.L3:
  ; sci/stats.e16.ts:871  math(M_SUB, at(U), at(T2), 0)
  li a0, 2
  li a1, 9712
  li a2, 9688
  li a3, 0
  call math
.L4:
  ; sci/stats.e16.ts:872  sop(M_ADD, T1, R_C, R_C)
  li a0, 1
  li a1, 26
  li a2, 15
  li a3, 15
  call sop
  ; sci/stats.e16.ts:873  math(M_DIV, at(U), at(T1), 0)
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

str_106:
  .byte 83, 84, 65, 84, 83, 32, 0
str_107:
  .byte 76, 73, 78, 69, 0
str_108:
  .byte 81, 85, 65, 68, 0
str_109:
  .byte 69, 88, 80, 0
str_110:
  .byte 76, 79, 71, 0
str_111:
  .byte 80, 87, 82, 0
str_112:
  .byte 73, 78, 86, 0
str_113:
  .byte 49, 45, 86, 65, 82, 0
str_114:
  .byte 83, 84, 65, 84, 83, 0
str_115:
  .byte 49, 58, 49, 45, 86, 65, 82, 32, 50, 58, 76, 73, 78, 69, 0
str_116:
  .byte 51, 58, 81, 85, 65, 68, 32, 52, 58, 69, 88, 80, 32, 53, 58, 76, 79, 71, 0
str_117:
  .byte 54, 58, 80, 87, 82, 32, 55, 58, 73, 78, 86, 0
str_118:
  .byte 56, 58, 70, 82, 69, 81, 0
str_119:
  .byte 65, 67, 58, 66, 65, 67, 75, 0
str_120:
  .byte 70, 85, 78, 67, 0
str_121:
  .byte 49, 58, 73, 78, 83, 69, 82, 84, 32, 82, 79, 87, 0
str_122:
  .byte 50, 58, 68, 69, 76, 69, 84, 69, 32, 82, 79, 87, 0
str_123:
  .byte 51, 58, 67, 76, 69, 65, 82, 32, 65, 76, 76, 0
str_124:
  .byte 52, 58, 75, 73, 78, 68, 0
str_125:
  .byte 142, 0
str_126:
  .byte 141, 0
str_127:
  .byte 32, 82, 69, 83, 85, 76, 84, 0
str_128:
  .byte 45, 0
str_129:
  .byte 110, 61, 0
str_130:
  .byte 149, 61, 0
str_131:
  .byte 150, 61, 0
str_132:
  .byte 145, 120, 61, 0
str_133:
  .byte 115, 120, 61, 0
str_134:
  .byte 145, 121, 61, 0
str_135:
  .byte 115, 121, 61, 0
str_136:
  .byte 144, 120, 61, 0
str_137:
  .byte 144, 120, 132, 61, 0
str_138:
  .byte 144, 121, 61, 0
str_139:
  .byte 144, 121, 132, 61, 0
str_140:
  .byte 144, 120, 121, 61, 0
str_141:
  .byte 114, 61, 0
str_142:
  .byte 97, 61, 0
str_143:
  .byte 99, 61, 0
str_144:
  .byte 98, 61, 0
  .align 2

  .bank 8
  .org 0xc000
; sci/calculus.e16.ts:70 calculus(t, p/body, at) at -O1
;   t in s0
;   p/body in s1
;   at in 0(sp)
;   q in s2
;   a in s3
;   saved in 2(sp)
calculus:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  mv s0, a0 ; t
  mv s1, a1 ; p/body
  sw a2, 0(sp) ; at
  ; sci/calculus.e16.ts:71  const body = p
  ; sci/calculus.e16.ts:72  let q = nextArgument(bodyEnd(body))
  mv a0, s1
  call bodyEnd
  call nextArgument
  mv s2, a0 ; q
  ; sci/calculus.e16.ts:73  const a = top()
  call top
  mv s3, a0 ; a
  ; sci/calculus.e16.ts:74  if (t !== T_DERIV) q = nextArgument(q)
  li t0, 160
  beq s0, t0, .L1
  ; sci/calculus.e16.ts:74  q = nextArgument(q)
  mv a0, s2
  call nextArgument
  mv s2, a0 ; q
.L1:
  ; sci/calculus.e16.ts:75  if (evalToken(q) === T_CLOSE) q++
  mv a0, s2
  la t0, evalToken
  li t1, 0
  call far_call
  li t0, 41
  bne a0, t0, .L2
  ; sci/calculus.e16.ts:75  q++
  addi s2, s2, 1
.L2:
  ; sci/calculus.e16.ts:76  const saved = push(at)
  lw a0, 0(sp)
  call push
  sw a0, 2(sp) ; saved
  ; sci/calculus.e16.ts:77  copyValue(varAt(X_LETTER), saved)
  li a0, 3336
  lw a1, 2(sp)
  call copyValue
  ; sci/calculus.e16.ts:78  holdX()
  call holdX
  ; sci/calculus.e16.ts:79  if (t === T_DERIV) derivative(body, a, at)
  li t0, 160
  bne s0, t0, .L3
  ; sci/calculus.e16.ts:79  derivative(body, a, at)
  mv a0, s1
  mv a1, s3
  lw a2, 0(sp)
  call derivative
  j .L4
.L3:
  ; sci/calculus.e16.ts:80  if (t === T_INTEG) integral(body, a, a + VALUE_SIZE, at)
  li t0, 161
  bne s0, t0, .L5
  ; sci/calculus.e16.ts:80  integral(body, a, a + VALUE_SIZE, at)
  mv a0, s1
  mv a1, s3
  addi a2, s3, 36
  lw a3, 0(sp)
  call integral
  j .L6
.L5:
  ; sci/calculus.e16.ts:81  sigma(body, a, a + VALUE_SIZE, at)
  mv a0, s1
  mv a1, s3
  addi a2, s3, 36
  lw a3, 0(sp)
  call sigma
.L6:
.L4:
  ; sci/calculus.e16.ts:82  copyValue(saved, varAt(X_LETTER))
  lw a0, 2(sp)
  li a1, 3336
  call copyValue
  ; sci/calculus.e16.ts:83  releaseX()
  call releaseX
  ; sci/calculus.e16.ts:84  pop()
  call pop
  ; sci/calculus.e16.ts:85  if (t !== T_DERIV) pop()
  li t0, 160
  beq s0, t0, .L7
  ; sci/calculus.e16.ts:85  pop()
  call pop
.L7:
  ; sci/calculus.e16.ts:86  return q
  mv a0, s2
.return:
  lw ra, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  addi sp, sp, 14
  ret

; sci/calculus.e16.ts:90 nextArgument(q) at -O1
;   q in s1
nextArgument:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; q
  ; sci/calculus.e16.ts:91  if (evalToken(q) !== T_COMMA) fail(E_SYNTAX, q)
  mv a0, s1
  la t0, evalToken
  li t1, 0
  call far_call
  li t0, 44
  beq a0, t0, .L1
  ; sci/calculus.e16.ts:91  fail(E_SYNTAX, q)
  li a0, 2
  mv a1, s1
  call fail
.L1:
  ; sci/calculus.e16.ts:92  return evalSum(q + 1)
  addi a0, s1, 1
  la t0, evalSum
  li t1, 0
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/calculus.e16.ts:105 bodyEnd(from/p) at -O1
;   from/p in s1
;   depth in s3
;   t in s2
bodyEnd:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; from/p
  ; sci/calculus.e16.ts:106  let depth: u16 = 0
  li s3, 0 ; depth
  ; sci/calculus.e16.ts:107  let p = from
  ; sci/calculus.e16.ts:108  for (;;) {
.L1:
  ; sci/calculus.e16.ts:109  const t = evalToken(p)
  mv a0, s1
  la t0, evalToken
  li t1, 0
  call far_call
  mv s2, a0 ; t
  ; sci/calculus.e16.ts:110  if (t === 0 || (depth === 0 && (t === T_COMMA || t === T_CLOSE))) return p
  beq s2, zero, .L6
  bne s3, zero, .L5
  li t0, 44
  beq s2, t0, .L7
  li t0, 41
  bne s2, t0, .L5
.L7:
.L6:
  ; sci/calculus.e16.ts:110  return p
  mv a0, s1
  j .return
.L5:
  ; sci/calculus.e16.ts:111  depth = depthAfter(t, depth, p)
  mv a0, s2
  mv a1, s3
  mv a2, s1
  call depthAfter
  mv s3, a0 ; depth
  ; sci/calculus.e16.ts:112  p++
  addi s1, s1, 1
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/calculus.e16.ts:117 depthAfter(t, depth/d, p) at -O1
;   t in s2
;   depth/d in s1
;   p in s3
depthAfter:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; t
  mv s1, a1 ; depth/d
  mv s3, a2 ; p
  ; sci/calculus.e16.ts:118  if (t === T_OPEN || t === T_POW || isFunction(t)) return opening(depth, 1, p)
  li t0, 40
  beq s2, t0, .L2
  li t0, 17
  beq s2, t0, .L2
  mv a0, s2
  call isFunction
  beqz a0, .L1
.L2:
  ; sci/calculus.e16.ts:118  return opening(depth, 1, p)
  mv a0, s1
  li a1, 1
  mv a2, s3
  call opening
  j .return
.L1:
  ; sci/calculus.e16.ts:119  if (opensTemplate(t)) return opening(depth, 2, p)
  mv a0, s2
  call opensTemplate
  beqz a0, .L3
  ; sci/calculus.e16.ts:119  return opening(depth, 2, p)
  mv a0, s1
  li a1, 2
  mv a2, s3
  call opening
  j .return
.L3:
  ; sci/calculus.e16.ts:120  if (t === T_CLOSE) return depth - 1
  li t0, 41
  bne s2, t0, .L4
  ; sci/calculus.e16.ts:120  return depth - 1
  addi a0, s1, -1
  j .return
.L4:
  ; sci/calculus.e16.ts:121  if (!isSeparator(t) && t !== T_END) return depth
  mv a0, s2
  call isSeparator
  bnez a0, .L5
  li t0, 24
  beq s2, t0, .L5
  ; sci/calculus.e16.ts:121  return depth
  mv a0, s1
  j .return
.L5:
  ; sci/calculus.e16.ts:123  let d = depth
  ; sci/calculus.e16.ts:124  while (d > 0 && opened[d - 1] === 1) d--
  j .L8
.L6:
  ; sci/calculus.e16.ts:124  d--
  addi s1, s1, -1
.L8:
  bgeu zero, s1, .L10
  lbu t0, opened-1(s1)
  li t1, 1
  beq t0, t1, .L6
.L10:
  ; sci/calculus.e16.ts:125  if (t === T_END && d > 0) d--
  li t0, 24
  bne s2, t0, .L11
  bgeu zero, s1, .L11
  ; sci/calculus.e16.ts:125  d--
  addi s1, s1, -1
.L11:
  ; sci/calculus.e16.ts:126  return d
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calculus.e16.ts:129 opening(depth, kind, p) at -O1
;   depth in s1
;   kind in s2
;   p in s3
opening:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; depth
  mv s2, a1 ; kind
  mv s3, a2 ; p
  ; sci/calculus.e16.ts:130  if (depth >= 24) fail(E_SYNTAX, p)
  li t0, 24
  bltu s1, t0, .L1
  ; sci/calculus.e16.ts:130  fail(E_SYNTAX, p)
  li a0, 2
  mv a1, s3
  call fail
.L1:
  ; sci/calculus.e16.ts:131  opened[depth] = kind
  sb s2, opened(s1)
  ; sci/calculus.e16.ts:132  return depth + 1
  addi a0, s1, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calculus.e16.ts:136 bodyAt(body, x) at -O1
;   body in s1
;   x in s2
bodyAt:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; body
  mv s2, a1 ; x
  ; sci/calculus.e16.ts:137  copyValue(x, varAt(X_LETTER))
  mv a0, s2
  li a1, 3336
  call copyValue
  ; sci/calculus.e16.ts:138  evalSum(body)
  mv a0, s1
  la t0, evalSum
  li t1, 0
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calculus.e16.ts:144 sigma(body, a, b/terms, at) at -O1
;   body in 4(sp)
;   a in s2
;   b/terms in s3
;   at in s1
;   sum in 2(sp)
;   x in s0
;   i in 0(sp)
sigma:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  sw a0, 4(sp) ; body
  mv s2, a1 ; a
  mv s3, a2 ; b/terms
  mv s1, a3 ; at
  ; sci/calculus.e16.ts:145  const terms = termCount(a, b, at)
  mv a0, s2
  mv a1, s3
  mv a2, s1
  call termCount
  mv s3, a0 ; b/terms
  ; sci/calculus.e16.ts:146  const sum = pushInt(0, at)
  li a0, 0
  mv a1, s1
  call pushInt
  sw a0, 2(sp) ; sum
  ; sci/calculus.e16.ts:147  const x = push(at)
  mv a0, s1
  call push
  mv s0, a0 ; x
  ; sci/calculus.e16.ts:148  copyValue(a, x)
  mv a0, s2
  mv a1, s0
  call copyValue
  ; sci/calculus.e16.ts:149  for (let i: u16 = 0; i < terms; i++) {
  sw zero, 0(sp) ; i
  j .L3
.L1:
  ; sci/calculus.e16.ts:150  bodyAt(body, x)
  lw a0, 4(sp)
  mv a1, s0
  call bodyAt
  ; sci/calculus.e16.ts:151  addTop(sum, at)
  lw a0, 2(sp)
  mv a1, s1
  call addTop
  ; sci/calculus.e16.ts:152  pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  ; sci/calculus.e16.ts:153  addTop(x, at)
  mv a0, s0
  mv a1, s1
  call addTop
  lw t0, 0(sp) ; i
  addi t0, t0, 1
  sw t0, 0(sp) ; i
.L3:
  lw t0, 0(sp) ; i
  bltu t0, s3, .L1
  ; sci/calculus.e16.ts:155  copyValue(sum, a)
  lw a0, 2(sp)
  mv a1, s2
  call copyValue
  ; sci/calculus.e16.ts:156  pop()
  call pop
  ; sci/calculus.e16.ts:157  pop()
  call pop
.return:
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; sci/calculus.e16.ts:161 addTop(into, at) at -O1
;   into in s1
;   at in s2
addTop:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; into
  mv s2, a1 ; at
  ; sci/calculus.e16.ts:162  math(M_ADD, into, top(), at)
  call top
  mv a1, s1
  mv a2, a0
  li a0, 1
  mv a3, s2
  call math
  ; sci/calculus.e16.ts:163  exactBinary(M_ADD, into, top())
  call top
  mv a1, s1
  mv a2, a0
  li a0, 1
  la t0, exactBinary
  li t1, 2
  call far_call
  ; sci/calculus.e16.ts:164  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calculus.e16.ts:168 termCount(a, b, at) at -O1
;   a in s3
;   b in s0
;   at in s1
;   d in s2
termCount:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  mv s3, a0 ; a
  mv s0, a1 ; b
  mv s1, a2 ; at
  ; sci/calculus.e16.ts:169  const d = push(at)
  mv a0, s1
  call push
  mv s2, a0 ; d
  ; sci/calculus.e16.ts:170  copy8(b, d)
  mv a0, s0
  mv a1, s2
  call copy8
  ; sci/calculus.e16.ts:171  math(M_SUB, d, a, at)
  li a0, 2
  mv a1, s2
  mv a2, s3
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:172  if (!isWholeAt(a, at) || !isWholeAt(b, at) || isNegative(d)) fail(E_MATH, at)
  mv a0, s3
  mv a1, s1
  call isWholeAt
  beqz a0, .L2
  mv a0, s0
  mv a1, s1
  call isWholeAt
  beqz a0, .L2
  mv a0, s2
  call isNegative
  beqz a0, .L1
.L2:
  ; sci/calculus.e16.ts:172  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L1:
  ; sci/calculus.e16.ts:173  pushInt(999, at)
  li a0, 999
  mv a1, s1
  call pushInt
  ; sci/calculus.e16.ts:174  math(M_CMP, d, top(), at)
  call top
  mv a1, s2
  mv a2, a0
  li a0, 6
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:175  pop()
  call pop
  ; sci/calculus.e16.ts:176  if (i16(peek16(MATH_RESULT)) > 0) fail(E_MATH, at)
  li t0, 65370
  lw t0, 0(t0)
  bge zero, t0, .L3
  ; sci/calculus.e16.ts:176  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L3:
  ; sci/calculus.e16.ts:177  math(M_TOINT, d, 0, at)
  li a0, 49
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:178  pop()
  call pop
  ; sci/calculus.e16.ts:179  return peek16(MATH_ARG) + 1
  li t0, 65366
  lw t0, 0(t0)
  addi a0, t0, 1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/calculus.e16.ts:182 isWholeAt(v/whole, at) at -O1
;   v/whole in s1
;   at in s3
;   f in s2
isWholeAt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; v/whole
  mv s3, a1 ; at
  ; sci/calculus.e16.ts:183  const f = push(at)
  mv a0, s3
  call push
  mv s2, a0 ; f
  ; sci/calculus.e16.ts:184  copy8(v, f)
  mv a0, s1
  mv a1, s2
  call copy8
  ; sci/calculus.e16.ts:185  math(M_FRAC, f, 0, at)
  li a0, 19
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
  ; sci/calculus.e16.ts:186  const whole = isZero(f)
  mv a0, s2
  call isZero
  mv s1, a0 ; v/whole
  ; sci/calculus.e16.ts:187  pop()
  call pop
  ; sci/calculus.e16.ts:188  return whole
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/calculus.e16.ts:199 derivative(body/d3, a, at) at -O1
;   body/d3 in s3
;   a in s0
;   at in s1
;   h/d2 in s2
;   d1 in 0(sp)
;   k in 2(sp)
derivative:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  mv s3, a0 ; body/d3
  mv s0, a1 ; a
  mv s1, a2 ; at
  ; sci/calculus.e16.ts:200  const h = push(at)
  mv a0, s1
  call push
  mv s2, a0 ; h/d2
  ; sci/calculus.e16.ts:201  copy8(a, h)
  mv a0, s0
  mv a1, s2
  call copy8
  ; sci/calculus.e16.ts:202  math(M_ABS, h, 0, at)
  li a0, 17
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:203  if (isZero(h)) {
  mv a0, s2
  call isZero
  beqz a0, .L1
  ; sci/calculus.e16.ts:204  pushInt(1, at)
  li a0, 1
  mv a1, s1
  call pushInt
  ; sci/calculus.e16.ts:205  copy8(top(), h)
  call top
  mv a1, s2
  call copy8
  ; sci/calculus.e16.ts:206  pop()
  call pop
.L1:
  ; sci/calculus.e16.ts:208  pushInt(100, at)
  li a0, 100
  mv a1, s1
  call pushInt
  ; sci/calculus.e16.ts:209  math(M_DIV, h, top(), at)
  call top
  mv a1, s2
  mv a2, a0
  li a0, 4
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:210  pop()
  call pop
  ; sci/calculus.e16.ts:211  central(body, a, h, at)
  mv a0, s3
  mv a1, s0
  mv a2, s2
  mv a3, s1
  call central
  ; sci/calculus.e16.ts:212  halveStep(h, at)
  mv a0, s2
  mv a1, s1
  call halveStep
  ; sci/calculus.e16.ts:213  central(body, a, h, at)
  mv a0, s3
  mv a1, s0
  mv a2, s2
  mv a3, s1
  call central
  ; sci/calculus.e16.ts:214  halveStep(h, at)
  mv a0, s2
  mv a1, s1
  call halveStep
  ; sci/calculus.e16.ts:215  central(body, a, h, at)
  mv a0, s3
  mv a1, s0
  mv a2, s2
  mv a3, s1
  call central
  ; sci/calculus.e16.ts:216  const d3 = top()
  call top
  mv s3, a0 ; body/d3
  ; sci/calculus.e16.ts:217  const d2 = d3 - VALUE_SIZE
  addi s2, s3, -36
  ; sci/calculus.e16.ts:218  const d1 = d2 - VALUE_SIZE
  addi t0, s2, -36
  sw t0, 0(sp) ; d1
  ; sci/calculus.e16.ts:220  richardson(d1, d2, 4, at)
  lw a0, 0(sp)
  mv a1, s2
  li a2, 4
  mv a3, s1
  call richardson
  ; sci/calculus.e16.ts:221  richardson(d2, d3, 4, at)
  mv a0, s2
  mv a1, s3
  li a2, 4
  mv a3, s1
  call richardson
  ; sci/calculus.e16.ts:222  copy8(d2, d3)
  mv a0, s2
  mv a1, s3
  call copy8
  ; sci/calculus.e16.ts:223  math(M_SUB, d3, d1, at)
  li a0, 2
  mv a1, s3
  lw a2, 0(sp)
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:224  math(M_ABS, d3, 0, at)
  li a0, 17
  mv a1, s3
  li a2, 0
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:226  richardson(d1, d2, 16, at)
  lw a0, 0(sp)
  mv a1, s2
  li a2, 16
  mv a3, s1
  call richardson
  ; sci/calculus.e16.ts:228  pushInt(100, at)
  li a0, 100
  mv a1, s1
  call pushInt
  ; sci/calculus.e16.ts:229  for (let k: u16 = 0; k < 5; k++) math(M_MUL, d3, top(), at)
  sw zero, 2(sp) ; k
  j .L4
.L2:
  ; sci/calculus.e16.ts:229  math(M_MUL, d3, top(), at)
  call top
  mv a1, s3
  mv a2, a0
  li a0, 3
  mv a3, s1
  call math
  lw t0, 2(sp) ; k
  addi t0, t0, 1
  sw t0, 2(sp) ; k
.L4:
  li t0, 5
  lw t1, 2(sp) ; k
  bltu t1, t0, .L2
  ; sci/calculus.e16.ts:230  pop()
  call pop
  ; sci/calculus.e16.ts:231  copy8(d1, d2)
  lw a0, 0(sp)
  mv a1, s2
  call copy8
  ; sci/calculus.e16.ts:232  math(M_ABS, d2, 0, at)
  li a0, 17
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:233  math(M_CMP, d3, d2, at)
  li a0, 6
  mv a1, s3
  mv a2, s2
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:234  poke16(MATH_ARG, i16(peek16(MATH_RESULT)) > 0 ? 9 : 10)
  li t0, 65370
  lw t1, 0(t0)
  li t0, 65366
  li t2, 0
  bge t2, t1, .L6
  li t1, 9
  j .L7
.L6:
  li t1, 10
.L7:
  sw t1, 0(t0)
  ; sci/calculus.e16.ts:235  math(M_RNDTO, d1, 0, at)
  li a0, 40
  lw a1, 0(sp)
  li a2, 0
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:236  copy8(d1, a)
  lw a0, 0(sp)
  mv a1, s0
  call copy8
  ; sci/calculus.e16.ts:237  inexact(a)
  mv a0, s0
  call inexact
  ; sci/calculus.e16.ts:238  pop()
  call pop
  ; sci/calculus.e16.ts:239  pop()
  call pop
  ; sci/calculus.e16.ts:240  pop()
  call pop
  ; sci/calculus.e16.ts:241  pop()
  call pop
.return:
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  addi sp, sp, 14
  ret

; sci/calculus.e16.ts:245 halveStep(h, at) at -O1
;   h in s2
;   at in s1
halveStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; h
  mv s1, a1 ; at
  ; sci/calculus.e16.ts:246  pushInt(2, at)
  li a0, 2
  mv a1, s1
  call pushInt
  ; sci/calculus.e16.ts:247  math(M_DIV, h, top(), at)
  call top
  mv a1, s2
  mv a2, a0
  li a0, 4
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:248  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/calculus.e16.ts:252 richardson(coarse, fine, k, at) at -O1
;   coarse in s3
;   fine in 0(sp)
;   k in s0
;   at in s1
;   t in s2
richardson:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  mv s3, a0 ; coarse
  sw a1, 0(sp) ; fine
  mv s0, a2 ; k
  mv s1, a3 ; at
  ; sci/calculus.e16.ts:253  const t = push(at)
  mv a0, s1
  call push
  mv s2, a0 ; t
  ; sci/calculus.e16.ts:254  copy8(fine, t)
  lw a0, 0(sp)
  mv a1, s2
  call copy8
  ; sci/calculus.e16.ts:255  pushInt(k, at)
  mv a0, s0
  mv a1, s1
  call pushInt
  ; sci/calculus.e16.ts:256  math(M_MUL, t, top(), at)
  call top
  mv a1, s2
  mv a2, a0
  li a0, 3
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:257  pop()
  call pop
  ; sci/calculus.e16.ts:258  math(M_SUB, t, coarse, at)
  li a0, 2
  mv a1, s2
  mv a2, s3
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:259  pushInt(k - 1, at)
  addi a0, s0, -1
  mv a1, s1
  call pushInt
  ; sci/calculus.e16.ts:260  math(M_DIV, t, top(), at)
  call top
  mv a1, s2
  mv a2, a0
  li a0, 4
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:261  pop()
  call pop
  ; sci/calculus.e16.ts:262  copy8(t, coarse)
  mv a0, s2
  mv a1, s3
  call copy8
  ; sci/calculus.e16.ts:263  pop()
  call pop
.return:
  lw ra, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  addi sp, sp, 12
  ret

; sci/calculus.e16.ts:267 central(body/fm, a/fp, h, at) at -O1
;   body/fm in s1
;   a/fp in s3
;   h in 0(sp)
;   at in s2
;   out in 2(sp)
;   x in s0
central:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv s1, a0 ; body/fm
  mv s3, a1 ; a/fp
  sw a2, 0(sp) ; h
  mv s2, a3 ; at
  ; sci/calculus.e16.ts:268  const out = push(at)
  mv a0, s2
  call push
  sw a0, 2(sp) ; out
  ; sci/calculus.e16.ts:269  const x = push(at)
  mv a0, s2
  call push
  mv s0, a0 ; x
  ; sci/calculus.e16.ts:270  copy8(a, x)
  mv a0, s3
  mv a1, s0
  call copy8
  ; sci/calculus.e16.ts:271  math(M_ADD, x, h, at)
  li a0, 1
  mv a1, s0
  lw a2, 0(sp)
  mv a3, s2
  call math
  ; sci/calculus.e16.ts:272  bodyAt(body, x)
  mv a0, s1
  mv a1, s0
  call bodyAt
  ; sci/calculus.e16.ts:273  copy8(a, x)
  mv a0, s3
  mv a1, s0
  call copy8
  ; sci/calculus.e16.ts:274  math(M_SUB, x, h, at)
  li a0, 2
  mv a1, s0
  lw a2, 0(sp)
  mv a3, s2
  call math
  ; sci/calculus.e16.ts:275  bodyAt(body, x)
  mv a0, s1
  mv a1, s0
  call bodyAt
  ; sci/calculus.e16.ts:276  const fm = top()
  call top
  mv s1, a0 ; body/fm
  ; sci/calculus.e16.ts:277  const fp = fm - VALUE_SIZE
  addi s3, s1, -36
  ; sci/calculus.e16.ts:278  math(M_SUB, fp, fm, at)
  li a0, 2
  mv a1, s3
  mv a2, s1
  mv a3, s2
  call math
  ; sci/calculus.e16.ts:279  copy8(h, fm)
  lw a0, 0(sp)
  mv a1, s1
  call copy8
  ; sci/calculus.e16.ts:280  math(M_ADD, fm, h, at)
  li a0, 1
  mv a1, s1
  lw a2, 0(sp)
  mv a3, s2
  call math
  ; sci/calculus.e16.ts:281  math(M_DIV, fp, fm, at)
  li a0, 4
  mv a1, s3
  mv a2, s1
  mv a3, s2
  call math
  ; sci/calculus.e16.ts:282  copy8(fp, out)
  mv a0, s3
  lw a1, 2(sp)
  call copy8
  ; sci/calculus.e16.ts:283  pop()
  call pop
  ; sci/calculus.e16.ts:284  pop()
  call pop
  ; sci/calculus.e16.ts:285  pop()
  call pop
.return:
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; sci/calculus.e16.ts:289 tenDigits(v, at) at -O1
;   v in s1
;   at in s2
tenDigits:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; v
  mv s2, a1 ; at
  ; sci/calculus.e16.ts:290  poke16(MATH_ARG, 10)
  li t0, 10
  li t1, 65366
  sw t0, 0(t1)
  ; sci/calculus.e16.ts:291  math(M_RNDTO, v, 0, at)
  li a0, 40
  mv a1, s1
  li a2, 0
  mv a3, s2
  call math
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/calculus.e16.ts:307 integralReset() at -O1
integralReset:
  ; sci/calculus.e16.ts:308  integrating = false
  sw zero, 0x0606(zero)
.return:
  ret

; sci/calculus.e16.ts:311 slot(k) at -O1
;   k in a0
slot:
  ; sci/calculus.e16.ts:312  return I_SLOTS + k * 8
  slli t0, a0, 3
  li t1, 14112
  add a0, t1, t0
.return:
  ret

; sci/calculus.e16.ts:350 readNodes(at) at -O1
;   at in s0
;   p in s3
;   k in s2
;   n in s1
readNodes:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  mv s0, a0 ; at
  ; sci/calculus.e16.ts:351  let p = nodeText()
  ; sci/calculus.e16.ts:341  return str(
  la s3, str_25
  ; sci/calculus.e16.ts:352  for (let k: u16 = 0; k < 22; k++) {
  li s2, 0 ; k
  j .L3
.L1:
  ; sci/calculus.e16.ts:353  let n: u16 = 0
  li s1, 0 ; n
  ; sci/calculus.e16.ts:354  while (peek(p + n) !== 0x7c && peek(p + n) !== 0) {
  j .L7
.L5:
  ; sci/calculus.e16.ts:355  nodeChars[n] = peek(p + n)
  add t0, s3, s1
  lbu t0, 0(t0)
  sb t0, nodeChars(s1)
  ; sci/calculus.e16.ts:356  n++
  addi s1, s1, 1
.L7:
  add t0, s3, s1
  lbu t0, 0(t0)
  li t1, 124
  beq t0, t1, .L9
  add t0, s3, s1
  lbu t0, 0(t0)
  bne t0, zero, .L5
.L9:
  ; sci/calculus.e16.ts:358  poke16(MATH_ARG, n)
  li t0, 65366
  sw s1, 0(t0)
  ; sci/calculus.e16.ts:359  math(M_PARSE, k < 20 ? NODES + k * 8 : slot(I_EPS + k - 20), addr(nodeChars), at)
  li t0, 56
  mv t1, s2
  li t2, 20
  bgeu t1, t2, .L10
  slli t1, s2, 3
  li t2, 13952
  add t1, t2, t1
  j .L11
.L10:
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, s2, -7
  call slot
  lw t0, 0(sp)
  addi sp, sp, 2
  mv t1, a0
.L11:
  mv a0, t0
  mv a1, t1
  la a2, nodeChars
  mv a3, s0
  call math
  ; sci/calculus.e16.ts:360  p += n + 1
  addi t0, s1, 1
  add s3, s3, t0
  addi s2, s2, 1
.L3:
  li t0, 22
  bltu s2, t0, .L1
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/calculus.e16.ts:383 integral(body, a, b/count, at) at -O1
;   body in 0(sp)
;   a in s3
;   b/count in s1
;   at in s2
;   x in 2(sp)
;   first in s0
integral:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  sw a0, 0(sp) ; body
  mv s3, a1 ; a
  mv s1, a2 ; b/count
  mv s2, a3 ; at
  ; sci/calculus.e16.ts:384  if (integrating) fail(E_MATH, at)
  lw t0, 0x0606(zero)
  beqz t0, .L1
  ; sci/calculus.e16.ts:384  fail(E_MATH, at)
  li a0, 1
  mv a1, s2
  call fail
.L1:
  ; sci/calculus.e16.ts:385  integrating = true
  li t0, 1
  sw t0, 0x0606(zero)
  ; sci/calculus.e16.ts:386  readNodes(at)
  mv a0, s2
  call readNodes
  ; sci/calculus.e16.ts:387  const x = push(at)
  mv a0, s2
  call push
  sw a0, 2(sp) ; x
  ; sci/calculus.e16.ts:388  zeroAt(slot(I_TOTAL))
  li a0, 14184
  call zeroAt
  ; sci/calculus.e16.ts:389  copy8(a, slot(I_A))
  mv a0, s3
  li a1, 14232
  call copy8
  ; sci/calculus.e16.ts:390  copy8(b, slot(I_SPAN))
  mv a0, s1
  li a1, 14240
  call copy8
  ; sci/calculus.e16.ts:391  math(M_SUB, slot(I_SPAN), a, at)
  li a0, 2
  li a1, 14240
  mv a2, s3
  mv a3, s2
  call math
  ; sci/calculus.e16.ts:392  wholeInto(slot(I_WIDTH), 1)
  li a0, 14200
  li a1, 1
  call wholeInto
  ; sci/calculus.e16.ts:393  let count: u16 = 0
  li s1, 0 ; b/count
  ; sci/calculus.e16.ts:394  if (!isZero(slot(I_SPAN))) {
  li a0, 14240
  call isZero
  bnez a0, .L2
  ; sci/calculus.e16.ts:395  wholeInto(INTERVALS, 0)
  li a0, 13568
  li a1, 0
  call wholeInto
  ; sci/calculus.e16.ts:396  wholeInto(INTERVALS + 8, 1)
  li a0, 13576
  li a1, 1
  call wholeInto
  ; sci/calculus.e16.ts:397  count = 1
  li s1, 1 ; b/count
.L2:
  ; sci/calculus.e16.ts:399  let first = true
  li s0, 1 ; first
  ; sci/calculus.e16.ts:400  while (count > 0) {
  j .L5
.L3:
  ; sci/calculus.e16.ts:401  count--
  addi s1, s1, -1
  ; sci/calculus.e16.ts:402  copy8(INTERVALS + count * 16, slot(I_LO))
  slli t0, s1, 4
  li t1, 13568
  add a0, t1, t0
  li a1, 14112
  call copy8
  ; sci/calculus.e16.ts:403  copy8(INTERVALS + count * 16 + 8, slot(I_HI))
  slli t0, s1, 4
  li t1, 13568
  add t1, t1, t0
  addi a0, t1, 8
  li a1, 14120
  call copy8
  ; sci/calculus.e16.ts:404  kronrod(body, x, at)
  lw a0, 0(sp)
  lw a1, 2(sp)
  mv a2, s2
  call kronrod
  ; sci/calculus.e16.ts:405  if (first) copy8(slot(I_ABS), slot(I_SCALE))
  beqz s0, .L7
  ; sci/calculus.e16.ts:405  copy8(slot(I_ABS), slot(I_SCALE))
  li a0, 14160
  li a1, 14192
  call copy8
.L7:
  ; sci/calculus.e16.ts:406  first = false
  li s0, 0 ; first
  ; sci/calculus.e16.ts:407  if (good(at) || count + 2 > MAX_INTERVALS) math(M_ADD, slot(I_TOTAL), slot(I_KRONROD), at)
  mv a0, s2
  call good
  bnez a0, .L9
  li t0, 24
  addi t1, s1, 2
  bgeu t0, t1, .L8
.L9:
  ; sci/calculus.e16.ts:407  math(M_ADD, slot(I_TOTAL), slot(I_KRONROD), at)
  li a0, 1
  li a1, 14184
  li a2, 14144
  mv a3, s2
  call math
  j .L10
.L8:
  ; sci/calculus.e16.ts:410  copy8(slot(I_CENTRE), INTERVALS + count * 16)
  slli t0, s1, 4
  li t1, 13568
  add a1, t1, t0
  li a0, 14128
  call copy8
  ; sci/calculus.e16.ts:411  copy8(slot(I_HI), INTERVALS + count * 16 + 8)
  slli t0, s1, 4
  li t1, 13568
  add t1, t1, t0
  li a0, 14120
  addi a1, t1, 8
  call copy8
  ; sci/calculus.e16.ts:412  copy8(slot(I_LO), INTERVALS + count * 16 + 16)
  slli t0, s1, 4
  li t1, 13568
  add t1, t1, t0
  li a0, 14112
  addi a1, t1, 16
  call copy8
  ; sci/calculus.e16.ts:413  copy8(slot(I_CENTRE), INTERVALS + count * 16 + 24)
  slli t0, s1, 4
  li t1, 13568
  add t1, t1, t0
  li a0, 14128
  addi a1, t1, 24
  call copy8
  ; sci/calculus.e16.ts:414  count += 2
  addi s1, s1, 2
.L10:
.L5:
  bltu zero, s1, .L3
  ; sci/calculus.e16.ts:417  pop()
  call pop
  ; sci/calculus.e16.ts:418  copy8(slot(I_TOTAL), a)
  li a0, 14184
  mv a1, s3
  call copy8
  ; sci/calculus.e16.ts:419  tenDigits(a, at)
  mv a0, s3
  mv a1, s2
  call tenDigits
  ; sci/calculus.e16.ts:420  inexact(a)
  mv a0, s3
  call inexact
  ; sci/calculus.e16.ts:421  integrating = false
  sw zero, 0x0606(zero)
.return:
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; sci/calculus.e16.ts:424 zeroAt(v) at -O1
;   v in a0
;   i in a1
zeroAt:
  ; sci/calculus.e16.ts:425  for (let i: u16 = 0; i < 8; i += 2) poke16(v + i, 0)
  li a1, 0 ; i
  j .L3
.L1:
  ; sci/calculus.e16.ts:425  poke16(v + i, 0)
  add t0, a0, a1
  sw zero, 0(t0)
  addi a1, a1, 2
.L3:
  li t0, 8
  bltu a1, t0, .L1
.return:
  ret

; sci/calculus.e16.ts:432 good(at) at -O1
;   at in s1
;   width in s2
;   diff in s3
good:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; at
  ; sci/calculus.e16.ts:433  const width = slot(I_LIMIT)
  li s2, 14208 ; width
  ; sci/calculus.e16.ts:434  copy8(slot(I_HI), width)
  li a0, 14120
  mv a1, s2
  call copy8
  ; sci/calculus.e16.ts:435  math(M_SUB, width, slot(I_LO), at)
  li a0, 2
  mv a1, s2
  li a2, 14112
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:436  math(M_ABS, width, 0, at)
  li a0, 17
  mv a1, s2
  li a2, 0
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:437  math(M_DIV, width, slot(I_WIDTH), at)
  li a0, 4
  mv a1, s2
  li a2, 14200
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:438  math(M_CMP, width, slot(I_TINY), at)
  li a0, 6
  mv a1, s2
  li a2, 14224
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:439  if (i16(peek16(MATH_RESULT)) <= 0) return true
  li t0, 65370
  lw t0, 0(t0)
  blt zero, t0, .L1
  ; sci/calculus.e16.ts:439  return true
  li a0, 1
  j .return
.L1:
  ; sci/calculus.e16.ts:440  math(M_MUL, width, slot(I_SCALE), at)
  li a0, 3
  mv a1, s2
  li a2, 14192
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:441  math(M_MUL, width, slot(I_EPS), at)
  li a0, 3
  mv a1, s2
  li a2, 14216
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:442  const diff = slot(I_SPARE)
  li s3, 14176 ; diff
  ; sci/calculus.e16.ts:443  copy8(slot(I_KRONROD), diff)
  li a0, 14144
  mv a1, s3
  call copy8
  ; sci/calculus.e16.ts:444  math(M_SUB, diff, slot(I_GAUSS), at)
  li a0, 2
  mv a1, s3
  li a2, 14152
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:445  math(M_ABS, diff, 0, at)
  li a0, 17
  mv a1, s3
  li a2, 0
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:446  math(M_CMP, diff, width, at)
  li a0, 6
  mv a1, s3
  mv a2, s2
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:447  return i16(peek16(MATH_RESULT)) <= 0
  li t0, 65370
  lw t0, 0(t0)
  slt t0, zero, t0
  xori a0, t0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/calculus.e16.ts:451 kronrod(body, x, at) at -O1
;   body in 0(sp)
;   x in s3
;   at in s1
;   j/k in s2
;   side in s0
;   wg.j in 2(sp)
kronrod:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  sw a0, 0(sp) ; body
  mv s3, a1 ; x
  mv s1, a2 ; at
  ; sci/calculus.e16.ts:452  copy8(slot(I_LO), slot(I_CENTRE))
  li a0, 14112
  li a1, 14128
  call copy8
  ; sci/calculus.e16.ts:453  math(M_ADD, slot(I_CENTRE), slot(I_HI), at)
  li a0, 1
  li a1, 14128
  li a2, 14120
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:454  pushInt(2, at)
  li a0, 2
  mv a1, s1
  call pushInt
  ; sci/calculus.e16.ts:455  math(M_DIV, slot(I_CENTRE), top(), at)
  call top
  li a1, 14128
  mv a2, a0
  li a0, 4
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:456  copy8(slot(I_HI), slot(I_HALF))
  li a0, 14120
  li a1, 14136
  call copy8
  ; sci/calculus.e16.ts:457  math(M_SUB, slot(I_HALF), slot(I_CENTRE), at)
  li a0, 2
  li a1, 14136
  li a2, 14128
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:458  pop()
  call pop
  ; sci/calculus.e16.ts:459  zeroAt(slot(I_KRONROD))
  li a0, 14144
  call zeroAt
  ; sci/calculus.e16.ts:460  zeroAt(slot(I_GAUSS))
  li a0, 14152
  call zeroAt
  ; sci/calculus.e16.ts:461  zeroAt(slot(I_ABS))
  li a0, 14160
  call zeroAt
  ; sci/calculus.e16.ts:462  copy8(slot(I_CENTRE), x)
  li a0, 14128
  mv a1, s3
  call copy8
  ; sci/calculus.e16.ts:463  fOf(body, x, at)
  lw a0, 0(sp)
  mv a1, s3
  mv a2, s1
  call fOf
  ; sci/calculus.e16.ts:464  weigh(wk(7), wg(3), at)
  li a0, 14072
  li a1, 14104
  mv a2, s1
  call weigh
  ; sci/calculus.e16.ts:465  for (let j: u16 = 0; j < 7; j++) {
  li s2, 0 ; j/k
  j .L3
.L1:
  ; sci/calculus.e16.ts:466  for (let side: u16 = 0; side < 2; side++) {
  li s0, 0 ; side
  j .L7
.L5:
  ; sci/calculus.e16.ts:467  copy8(slot(I_HALF), x)
  li a0, 14136
  mv a1, s3
  call copy8
  ; sci/calculus.e16.ts:468  math(M_MUL, x, xk(j), at)
  ; sci/calculus.e16.ts:365  return NODES + j * 8
  slli t0, s2, 3
  li t1, 13952
  add a2, t1, t0
  li a0, 3
  mv a1, s3
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:469  if (side === 0) math(M_ADD, x, slot(I_CENTRE), at)
  bne s0, zero, .L9
  ; sci/calculus.e16.ts:469  math(M_ADD, x, slot(I_CENTRE), at)
  li a0, 1
  mv a1, s3
  li a2, 14128
  mv a3, s1
  call math
  j .L10
.L9:
  ; sci/calculus.e16.ts:471  copy8(x, slot(I_SPARE))
  mv a0, s3
  li a1, 14176
  call copy8
  ; sci/calculus.e16.ts:472  copy8(slot(I_CENTRE), x)
  li a0, 14128
  mv a1, s3
  call copy8
  ; sci/calculus.e16.ts:473  math(M_SUB, x, slot(I_SPARE), at)
  li a0, 2
  mv a1, s3
  li a2, 14176
  mv a3, s1
  call math
.L10:
  ; sci/calculus.e16.ts:475  fOf(body, x, at)
  lw a0, 0(sp)
  mv a1, s3
  mv a2, s1
  call fOf
  ; sci/calculus.e16.ts:476  weigh(wk(j), (j & 1) !== 0 ? wg(j >> 1) : 0, at)
  ; sci/calculus.e16.ts:369  return NODES + 64 + j * 8
  slli t0, s2, 3
  li t1, 14016
  add t1, t1, t0
  andi t0, s2, 1
  li t2, 0
  xor t0, t0, t1
  xor t1, t1, t0
  xor t0, t0, t1
  beq t1, t2, .L11
  srli t1, s2, 1
  sw t1, 2(sp) ; wg.j
  ; sci/calculus.e16.ts:373  return NODES + 128 + j * 8
  lw t1, 2(sp) ; wg.j
  slli t1, t1, 3
  li t2, 14080
  add t1, t2, t1
  j .L12
.L11:
  li t1, 0
.L12:
  mv a0, t0
  mv a1, t1
  mv a2, s1
  call weigh
  addi s0, s0, 1
.L7:
  li t0, 2
  bltu s0, t0, .L5
  addi s2, s2, 1
.L3:
  li t0, 7
  bltu s2, t0, .L1
  ; sci/calculus.e16.ts:479  for (let k: u16 = I_KRONROD; k <= I_ABS; k++) math(M_MUL, slot(k), slot(I_HALF), at)
  li s2, 4 ; j/k
  j .L15
.L13:
  ; sci/calculus.e16.ts:479  math(M_MUL, slot(k), slot(I_HALF), at)
  mv a0, s2
  call slot
  mv a1, a0
  li a0, 3
  li a2, 14136
  mv a3, s1
  call math
  addi s2, s2, 1
.L15:
  li t0, 6
  bgeu t0, s2, .L13
  ; sci/calculus.e16.ts:480  math(M_ABS, slot(I_ABS), 0, at)
  li a0, 17
  li a1, 14160
  li a2, 0
  mv a3, s1
  call math
.return:
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; sci/calculus.e16.ts:484 fOf(body, x, at) at -O1
;   body in 0(sp)
;   x in s2
;   at in s1
;   t in s0
;   w in s3
fOf:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  sw s0, 8(sp)
  sw s3, 10(sp)
  sw a0, 0(sp) ; body
  mv s2, a1 ; x
  mv s1, a2 ; at
  ; sci/calculus.e16.ts:485  const t = slot(I_T)
  li s0, 14248 ; t
  ; sci/calculus.e16.ts:486  const w = slot(I_WEIGHT)
  li s3, 14256 ; w
  ; sci/calculus.e16.ts:487  copy8(x, t)
  mv a0, s2
  mv a1, s0
  call copy8
  ; sci/calculus.e16.ts:488  wholeInto(w, 2)
  mv a0, s3
  li a1, 2
  call wholeInto
  ; sci/calculus.e16.ts:489  math(M_MUL, w, t, at)
  li a0, 3
  mv a1, s3
  mv a2, s0
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:490  wholeInto(x, 3)
  mv a0, s2
  li a1, 3
  call wholeInto
  ; sci/calculus.e16.ts:491  math(M_SUB, x, w, at)
  li a0, 2
  mv a1, s2
  mv a2, s3
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:492  math(M_MUL, x, t, at)
  li a0, 3
  mv a1, s2
  mv a2, s0
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:493  math(M_MUL, x, t, at)
  li a0, 3
  mv a1, s2
  mv a2, s0
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:494  math(M_MUL, x, slot(I_SPAN), at)
  li a0, 3
  mv a1, s2
  li a2, 14240
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:495  math(M_ADD, x, slot(I_A), at)
  li a0, 1
  mv a1, s2
  li a2, 14232
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:496  wholeInto(w, 1)
  mv a0, s3
  li a1, 1
  call wholeInto
  ; sci/calculus.e16.ts:497  math(M_SUB, w, t, at)
  li a0, 2
  mv a1, s3
  mv a2, s0
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:498  math(M_MUL, w, t, at)
  li a0, 3
  mv a1, s3
  mv a2, s0
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:499  math(M_MUL, w, slot(I_SPAN), at)
  li a0, 3
  mv a1, s3
  li a2, 14240
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:500  wholeInto(slot(I_F), 6)
  li a0, 14168
  li a1, 6
  call wholeInto
  ; sci/calculus.e16.ts:501  math(M_MUL, w, slot(I_F), at)
  li a0, 3
  mv a1, s3
  li a2, 14168
  mv a3, s1
  call math
  ; sci/calculus.e16.ts:502  inexact(x)
  mv a0, s2
  call inexact
  ; sci/calculus.e16.ts:503  bodyAt(body, x)
  lw a0, 0(sp)
  mv a1, s2
  call bodyAt
  ; sci/calculus.e16.ts:504  copy8(top(), slot(I_F))
  call top
  li a1, 14168
  call copy8
  ; sci/calculus.e16.ts:505  pop()
  call pop
  ; sci/calculus.e16.ts:506  math(M_MUL, slot(I_F), w, at)
  li a0, 3
  li a1, 14168
  mv a2, s3
  mv a3, s1
  call math
.return:
  lw ra, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  lw s0, 8(sp)
  lw s3, 10(sp)
  addi sp, sp, 12
  ret

; sci/calculus.e16.ts:510 weigh(kronrodWeight, gauss, at) at -O1
;   kronrodWeight in s3
;   gauss in s0
;   at in s2
;   s in s1
weigh:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  mv s3, a0 ; kronrodWeight
  mv s0, a1 ; gauss
  mv s2, a2 ; at
  ; sci/calculus.e16.ts:511  const s = slot(I_SPARE)
  li s1, 14176 ; s
  ; sci/calculus.e16.ts:512  copy8(slot(I_F), s)
  li a0, 14168
  mv a1, s1
  call copy8
  ; sci/calculus.e16.ts:513  math(M_MUL, s, kronrodWeight, at)
  li a0, 3
  mv a1, s1
  mv a2, s3
  mv a3, s2
  call math
  ; sci/calculus.e16.ts:514  math(M_ADD, slot(I_KRONROD), s, at)
  li a0, 1
  li a1, 14144
  mv a2, s1
  mv a3, s2
  call math
  ; sci/calculus.e16.ts:515  if (gauss !== 0) {
  beq s0, zero, .L1
  ; sci/calculus.e16.ts:516  copy8(slot(I_F), s)
  li a0, 14168
  mv a1, s1
  call copy8
  ; sci/calculus.e16.ts:517  math(M_MUL, s, gauss, at)
  li a0, 3
  mv a1, s1
  mv a2, s0
  mv a3, s2
  call math
  ; sci/calculus.e16.ts:518  math(M_ADD, slot(I_GAUSS), s, at)
  li a0, 1
  li a1, 14152
  mv a2, s1
  mv a3, s2
  call math
.L1:
  ; sci/calculus.e16.ts:520  copy8(slot(I_F), s)
  li a0, 14168
  mv a1, s1
  call copy8
  ; sci/calculus.e16.ts:521  math(M_ABS, s, 0, at)
  li a0, 17
  mv a1, s1
  li a2, 0
  mv a3, s2
  call math
  ; sci/calculus.e16.ts:522  math(M_MUL, s, kronrodWeight, at)
  li a0, 3
  mv a1, s1
  mv a2, s3
  mv a3, s2
  call math
  ; sci/calculus.e16.ts:523  math(M_ADD, slot(I_ABS), s, at)
  li a0, 1
  li a1, 14160
  mv a2, s1
  mv a3, s2
  call math
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/base.e16.ts:92 radix() at -O1
radix:
  ; sci/base.e16.ts:93  return peek(BASE_RADIX)
  lbu a0, 5639(zero)
.return:
  ret

; sci/base.e16.ts:96 radixValue(r) at -O1
;   r in a0
radixValue:
  ; sci/base.e16.ts:97  if (r === HEX) return 16
  bne a0, zero, .L1
  ; sci/base.e16.ts:97  return 16
  li a0, 16
  ret
.L1:
  ; sci/base.e16.ts:98  if (r === BIN) return 2
  li t0, 3
  bne a0, t0, .L2
  ; sci/base.e16.ts:98  return 2
  li a0, 2
  ret
.L2:
  ; sci/base.e16.ts:99  if (r === PEN) return 5
  li t0, 4
  bne a0, t0, .L3
  ; sci/base.e16.ts:99  return 5
  li a0, 5
  ret
.L3:
  ; sci/base.e16.ts:100  return r === 1 ? 10 : 8
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

; sci/base.e16.ts:106 baseToken(k) at -O1
;   k in s1
;   d/l in s2
baseToken:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  ; sci/base.e16.ts:107  const d = digitOf(k)
  mv a0, s1
  la t0, digitOf
  li t1, 4
  call far_call
  mv s2, a0 ; d/l
  ; sci/base.e16.ts:108  if (d !== 0xffff) return d < radixValue(radix()) ? 0x30 + d : 0
  li t0, 65535
  beq s2, t0, .L1
  ; sci/base.e16.ts:108  return d < radixValue(radix()) ? 0x30 + d : 0
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
  ; sci/base.e16.ts:109  if (radix() === HEX) {
  call radix
  bne a0, zero, .L4
  ; sci/base.e16.ts:110  const l = letterOf(k)
  mv a0, s1
  la t0, letterOf
  li t1, 4
  call far_call
  mv s2, a0 ; d/l
  ; sci/base.e16.ts:111  if (l >= 0x41 && l <= 0x46) return l
  li t0, 65
  bltu s2, t0, .L5
  li t0, 70
  bltu t0, s2, .L5
  ; sci/base.e16.ts:111  return l
  mv a0, s2
  j .return
.L5:
.L4:
  ; sci/base.e16.ts:113  switch (k) {
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
  ; sci/base.e16.ts:115  return T_MINUS
  li a0, 45
  j .return
.L8:
  ; sci/base.e16.ts:117  return T_PLUS
  li a0, 43
  j .return
.L9:
  ; sci/base.e16.ts:119  return T_MINUS
  li a0, 45
  j .return
.L10:
  ; sci/base.e16.ts:121  return T_TIMES
  li a0, 129
  j .return
.L11:
  ; sci/base.e16.ts:123  return T_DIVIDE
  li a0, 130
  j .return
.L12:
  ; sci/base.e16.ts:125  return T_OPEN
  li a0, 40
  j .return
.L13:
  ; sci/base.e16.ts:127  return T_CLOSE
  li a0, 41
  j .return
.L14:
  ; sci/base.e16.ts:129  return T_ANS
  li a0, 20
  j .return
.L6:
  ; sci/base.e16.ts:131  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/base.e16.ts:135 baseCommand(k) at -O1
;   k in s1
baseCommand:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/base.e16.ts:136  if (k === K_FD) {
  li t0, 13
  bne s1, t0, .L1
  ; sci/base.e16.ts:137  poke(BASE_RADIX, radix() + 1 < RADIXES ? radix() + 1 : 0)
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
  ; sci/base.e16.ts:138  return true
  li a0, 1
  j .return
.L1:
  ; sci/base.e16.ts:140  if (answered && (k === K_UP || k === K_DOWN)) {
  lw t0, 0x0586(zero)
  beqz t0, .L4
  beq s1, zero, .L5
  li t0, 1
  bne s1, t0, .L4
.L5:
  ; sci/base.e16.ts:141  high = k === K_UP
  sub t0, s1, zero
  seqz t0, t0
  sw t0, 0x0868(zero)
  ; sci/base.e16.ts:142  return true
  li a0, 1
  j .return
.L4:
  ; sci/base.e16.ts:144  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/base.e16.ts:150 baseFuncKey(k/d/t) at -O1
;   k/d/t in s1
baseFuncKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/d/t
  ; sci/base.e16.ts:151  if (k === K_AC) return 1
  li t0, 5
  bne s1, t0, .L1
  ; sci/base.e16.ts:151  return 1
  li a0, 1
  j .return
.L1:
  ; sci/base.e16.ts:152  if (k === K_DOWN || k === K_UP) {
  li t0, 1
  beq s1, t0, .L3
  bne s1, zero, .L2
.L3:
  ; sci/base.e16.ts:153  baseFuncPage = k === K_DOWN ? 1 : 0
  li t0, 1
  bne s1, t0, .L4
  li t0, 1
  j .L5
.L4:
  li t0, 0
.L5:
  sw t0, 0x086a(zero)
  ; sci/base.e16.ts:154  drawBaseFunc()
  call drawBaseFunc
  ; sci/base.e16.ts:155  return 0
  li a0, 0
  j .return
.L2:
  ; sci/base.e16.ts:157  const d = digitOf(k)
  mv a0, s1
  la t0, digitOf
  li t1, 4
  call far_call
  mv s1, a0 ; k/d/t
  ; sci/base.e16.ts:158  if (baseFuncPage === 0 && d >= 1 && d <= RADIXES) {
  lw t0, 0x086a(zero)
  bne t0, zero, .L6
  li t0, 1
  bltu s1, t0, .L6
  li t0, 5
  bltu t0, s1, .L6
  ; sci/base.e16.ts:159  poke(BASE_RADIX, d - 1)
  addi t0, s1, -1
  sb t0, 5639(zero)
  ; sci/base.e16.ts:160  return 1
  li a0, 1
  j .return
.L6:
  ; sci/base.e16.ts:162  const t = baseFuncPage === 1 ? logicOf(d) : 0
  lw t0, 0x086a(zero)
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
  ; sci/base.e16.ts:163  if (t === 0) refuse()
  bne s1, zero, .L9
  ; sci/base.e16.ts:163  refuse()
  call refuse
.L9:
  ; sci/base.e16.ts:164  return t
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/base.e16.ts:167 logicOf(d) at -O1
;   d in a0
logicOf:
  ; sci/base.e16.ts:168  if (d === 1) return T_AND
  li t0, 1
  bne a0, t0, .L1
  ; sci/base.e16.ts:168  return T_AND
  li a0, 238
  ret
.L1:
  ; sci/base.e16.ts:169  if (d === 2) return T_OR
  li t0, 2
  bne a0, t0, .L2
  ; sci/base.e16.ts:169  return T_OR
  li a0, 239
  ret
.L2:
  ; sci/base.e16.ts:170  if (d === 3) return T_XOR
  li t0, 3
  bne a0, t0, .L3
  ; sci/base.e16.ts:170  return T_XOR
  li a0, 240
  ret
.L3:
  ; sci/base.e16.ts:171  if (d === 4) return T_XNOR
  li t0, 4
  bne a0, t0, .L4
  ; sci/base.e16.ts:171  return T_XNOR
  li a0, 241
  ret
.L4:
  ; sci/base.e16.ts:172  if (d === 5) return T_NOT
  li t0, 5
  bne a0, t0, .L5
  ; sci/base.e16.ts:172  return T_NOT
  li a0, 242
  ret
.L5:
  ; sci/base.e16.ts:173  return d === 6 ? T_BNEG : 0
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

; sci/base.e16.ts:176 baseFuncScreen() at -O1
baseFuncScreen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/base.e16.ts:177  baseFuncPage = 0
  sw zero, 0x086a(zero)
  ; sci/base.e16.ts:178  drawBaseFunc()
  call drawBaseFunc
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/base.e16.ts:181 drawBaseFunc() at -O1
drawBaseFunc:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/base.e16.ts:182  cls()
  call cls
  ; sci/base.e16.ts:183  bandWith(str('FUNC'), baseFuncPage === 0 ? str('1/2') : str('2/2'))
  lw t1, 0x086a(zero)
  la t0, str_145
  li t2, 0
  bne t1, t2, .L1
  la t1, str_146
  j .L2
.L1:
  la t1, str_147
.L2:
  mv a0, t0
  mv a1, t1
  call bandWith
  ; sci/base.e16.ts:184  if (baseFuncPage === 0) {
  lw t0, 0x086a(zero)
  bne t0, zero, .L3
  ; sci/base.e16.ts:185  textAt(str('1:HEX 2:DEC 3:OCT'), 1, lineY(0))
  la a0, str_148
  li a1, 1
  li a2, 11
  call textAt
  ; sci/base.e16.ts:186  textAt(str('4:BIN 5:PEN'), 1, lineY(1))
  la a0, str_149
  li a1, 1
  li a2, 20
  call textAt
  j .L4
.L3:
  ; sci/base.e16.ts:188  textAt(str('1:AND 2:OR 3:XOR'), 1, lineY(0))
  la a0, str_150
  li a1, 1
  li a2, 11
  call textAt
  ; sci/base.e16.ts:189  textAt(str('4:XNOR 5:not( 6:neg('), 1, lineY(1))
  la a0, str_151
  li a1, 1
  li a2, 20
  call textAt
.L4:
  ; sci/base.e16.ts:191  textAt(str('\x8d\x8e:PAGE AC:BACK'), 1, lineY(5))
  la a0, str_152
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/base.e16.ts:201 peekToken() at -O1
peekToken:
  ; sci/base.e16.ts:202  return basePos < count ? peek(lineFrom + basePos) : 0
  lw t0, 0x0870(zero)
  lw t1, 0x086e(zero)
  bgeu t0, t1, .L1
  lw t0, 0x086c(zero)
  lw t1, 0x0870(zero)
  add t0, t0, t1
  lbu t0, 0(t0)
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
.return:
  ret

; sci/base.e16.ts:209 constants() at -O1
constants:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/base.e16.ts:210  setNumber(addr(TWO32), 0x4294, 0x9672, 0x9600)
  la a0, TWO32
  li a1, 17044
  li a2, 38514
  li a3, 38400
  call setNumber
  ; sci/base.e16.ts:211  setNumber(addr(TWO31), 0x2147, 0x4836, 0x4800)
  la a0, TWO31
  li a1, 8519
  li a2, 18486
  li a3, 18432
  call setNumber
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/base.e16.ts:215 setNumber(n, a, b, c) at -O1
;   n in a0
;   a in a1
;   b in a2
;   c in a3
setNumber:
  ; sci/base.e16.ts:216  poke(n, 0)
  sb zero, 0(a0)
  ; sci/base.e16.ts:217  poke(n + 1, 9)
  li t0, 9
  sb t0, 1(a0)
  ; sci/base.e16.ts:218  poke(n + 2, a >> 8)
  srli t0, a1, 8
  sb t0, 2(a0)
  ; sci/base.e16.ts:219  poke(n + 3, a & 0xff)
  andi t0, a1, 255
  sb t0, 3(a0)
  ; sci/base.e16.ts:220  poke(n + 4, b >> 8)
  srli t0, a2, 8
  sb t0, 4(a0)
  ; sci/base.e16.ts:221  poke(n + 5, b & 0xff)
  andi t0, a2, 255
  sb t0, 5(a0)
  ; sci/base.e16.ts:222  poke(n + 6, c >> 8)
  srli t0, a3, 8
  sb t0, 6(a0)
  ; sci/base.e16.ts:223  poke(n + 7, c & 0xff)
  andi t0, a3, 255
  sb t0, 7(a0)
.return:
  ret

; sci/base.e16.ts:227 baseEvaluate(from, size) at -O1
;   from in s2
;   size in s1
baseEvaluate:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; from
  mv s1, a1 ; size
  ; sci/base.e16.ts:228  lineFrom = from
  sw s2, 0x086c(zero)
  ; sci/base.e16.ts:229  count = size
  sw s1, 0x086e(zero)
  ; sci/base.e16.ts:230  basePos = 0
  sw zero, 0x0870(zero)
  ; sci/base.e16.ts:231  constants()
  call constants
  ; sci/base.e16.ts:232  if (size === 0) fail(E_SYNTAX, 0)
  bne s1, zero, .L1
  ; sci/base.e16.ts:232  fail(E_SYNTAX, 0)
  li a0, 2
  li a1, 0
  call fail
.L1:
  ; sci/base.e16.ts:233  either()
  call either
  ; sci/base.e16.ts:234  if (basePos < count) fail(E_SYNTAX, basePos)
  lw t0, 0x0870(zero)
  lw t1, 0x086e(zero)
  bgeu t0, t1, .L2
  ; sci/base.e16.ts:234  fail(E_SYNTAX, basePos)
  lw a1, 0x0870(zero)
  li a0, 2
  call fail
.L2:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/base.e16.ts:238 either() at -O1
;   t in s1
;   where in s2
either:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/base.e16.ts:239  both()
  call both
  ; sci/base.e16.ts:240  for (;;) {
.L1:
  ; sci/base.e16.ts:241  const t = peekToken()
  call peekToken
  mv s1, a0 ; t
  ; sci/base.e16.ts:242  if (t !== T_OR && t !== T_XOR && t !== T_XNOR) return
  li t0, 239
  beq s1, t0, .L5
  li t0, 240
  beq s1, t0, .L5
  li t0, 241
  beq s1, t0, .L5
  ; sci/base.e16.ts:242  return
  j .return
.L5:
  ; sci/base.e16.ts:243  const where = basePos
  lw s2, 0x0870(zero)
  ; sci/base.e16.ts:244  basePos++
  lw t0, 0x0870(zero)
  addi t0, t0, 1
  sw t0, 0x0870(zero)
  ; sci/base.e16.ts:245  both()
  call both
  ; sci/base.e16.ts:246  logic(t, where)
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

; sci/base.e16.ts:250 both() at -O1
;   where in s1
both:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/base.e16.ts:251  sum32()
  call sum32
  ; sci/base.e16.ts:252  while (peekToken() === T_AND) {
  j .L3
.L1:
  ; sci/base.e16.ts:253  const where = basePos
  lw s1, 0x0870(zero)
  ; sci/base.e16.ts:254  basePos++
  lw t0, 0x0870(zero)
  addi t0, t0, 1
  sw t0, 0x0870(zero)
  ; sci/base.e16.ts:255  sum32()
  call sum32
  ; sci/base.e16.ts:256  logic(T_AND, where)
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

; sci/base.e16.ts:260 sum32() at -O1
;   t in s1
;   where in s2
sum32:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/base.e16.ts:261  prod32()
  call prod32
  ; sci/base.e16.ts:262  for (;;) {
.L1:
  ; sci/base.e16.ts:263  const t = peekToken()
  call peekToken
  mv s1, a0 ; t
  ; sci/base.e16.ts:264  if (t !== T_PLUS && t !== T_MINUS) return
  li t0, 43
  beq s1, t0, .L5
  li t0, 45
  beq s1, t0, .L5
  ; sci/base.e16.ts:264  return
  j .return
.L5:
  ; sci/base.e16.ts:265  const where = basePos
  lw s2, 0x0870(zero)
  ; sci/base.e16.ts:266  basePos++
  lw t0, 0x0870(zero)
  addi t0, t0, 1
  sw t0, 0x0870(zero)
  ; sci/base.e16.ts:267  prod32()
  call prod32
  ; sci/base.e16.ts:268  arithmetic(t === T_PLUS ? M_ADD : M_SUB, where)
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

; sci/base.e16.ts:272 prod32() at -O1
;   t in s1
;   where in s2
prod32:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/base.e16.ts:273  sign32()
  call sign32
  ; sci/base.e16.ts:274  for (;;) {
.L1:
  ; sci/base.e16.ts:275  const t = peekToken()
  call peekToken
  mv s1, a0 ; t
  ; sci/base.e16.ts:276  if (t !== T_TIMES && t !== T_DIVIDE) return
  li t0, 129
  beq s1, t0, .L5
  li t0, 130
  beq s1, t0, .L5
  ; sci/base.e16.ts:276  return
  j .return
.L5:
  ; sci/base.e16.ts:277  const where = basePos
  lw s2, 0x0870(zero)
  ; sci/base.e16.ts:278  basePos++
  lw t0, 0x0870(zero)
  addi t0, t0, 1
  sw t0, 0x0870(zero)
  ; sci/base.e16.ts:279  sign32()
  call sign32
  ; sci/base.e16.ts:280  arithmetic(t === T_TIMES ? M_MUL : M_IDIV, where)
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

; sci/base.e16.ts:284 sign32() at -O1
;   where in s1
sign32:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/base.e16.ts:285  if (peekToken() === T_MINUS) {
  call peekToken
  li t0, 45
  bne a0, t0, .L1
  ; sci/base.e16.ts:286  const where = basePos
  lw s1, 0x0870(zero)
  ; sci/base.e16.ts:287  basePos++
  lw t0, 0x0870(zero)
  addi t0, t0, 1
  sw t0, 0x0870(zero)
  ; sci/base.e16.ts:288  sign32()
  call sign32
  ; sci/base.e16.ts:289  math(M_NEG, top(), 0, where)
  call top
  mv a1, a0
  li a0, 16
  li a2, 0
  mv a3, s1
  call math
  ; sci/base.e16.ts:290  wrap32(top(), where)
  call top
  mv a1, s1
  call wrap32
  ; sci/base.e16.ts:291  return
  j .return
.L1:
  ; sci/base.e16.ts:293  primary32()
  call primary32
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/base.e16.ts:296 primary32() at -O1
;   t in s1
;   where in s2
primary32:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/base.e16.ts:297  const t = peekToken()
  call peekToken
  mv s1, a0 ; t
  ; sci/base.e16.ts:298  const where = basePos
  lw s2, 0x0870(zero)
  ; sci/base.e16.ts:299  if (isDigitOf(t)) {
  mv a0, s1
  call isDigitOf
  beqz a0, .L1
  ; sci/base.e16.ts:300  number32()
  call number32
  ; sci/base.e16.ts:301  return
  j .return
.L1:
  ; sci/base.e16.ts:303  basePos++
  lw t0, 0x0870(zero)
  addi t0, t0, 1
  sw t0, 0x0870(zero)
  ; sci/base.e16.ts:304  if (t === T_ANS) {
  li t0, 20
  bne s1, t0, .L2
  ; sci/base.e16.ts:305  copy8(KEEP_ANS, push(where))
  mv a0, s2
  call push
  mv a1, a0
  li a0, 3080
  call copy8
  ; sci/base.e16.ts:306  wrap32(top(), where)
  call top
  mv a1, s2
  call wrap32
  j .L3
.L2:
  ; sci/base.e16.ts:307  if (t === T_OPEN || t === T_NOT || t === T_BNEG) {
  li t0, 40
  beq s1, t0, .L5
  li t0, 242
  beq s1, t0, .L5
  li t0, 243
  bne s1, t0, .L4
.L5:
  ; sci/base.e16.ts:308  either()
  call either
  ; sci/base.e16.ts:309  if (peekToken() === T_CLOSE) basePos++
  call peekToken
  li t0, 41
  bne a0, t0, .L6
  ; sci/base.e16.ts:309  basePos++
  lw t0, 0x0870(zero)
  addi t0, t0, 1
  sw t0, 0x0870(zero)
.L6:
  ; sci/base.e16.ts:310  if (t === T_NOT) logic(T_NOT, where)
  li t0, 242
  bne s1, t0, .L7
  ; sci/base.e16.ts:310  logic(T_NOT, where)
  li a0, 242
  mv a1, s2
  call logic
  j .L10
.L7:
  ; sci/base.e16.ts:311  if (t === T_BNEG) {
  li t0, 243
  bne s1, t0, .L10
  ; sci/base.e16.ts:312  math(M_NEG, top(), 0, where)
  call top
  mv a1, a0
  li a0, 16
  li a2, 0
  mv a3, s2
  call math
  ; sci/base.e16.ts:313  wrap32(top(), where)
  call top
  mv a1, s2
  call wrap32
  j .L10
.L4:
  ; sci/base.e16.ts:315  fail(E_SYNTAX, where)
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

; sci/base.e16.ts:319 digitValue(t) at -O1
;   t in a0
digitValue:
  ; sci/base.e16.ts:320  if (t >= 0x30 && t <= 0x39) return t - 0x30
  li t0, 48
  bltu a0, t0, .L1
  li t0, 57
  bltu t0, a0, .L1
  ; sci/base.e16.ts:320  return t - 0x30
  addi a0, a0, -48
  ret
.L1:
  ; sci/base.e16.ts:321  if (t >= 0x41 && t <= 0x46) return t - 0x37
  li t0, 65
  bltu a0, t0, .L2
  li t0, 70
  bltu t0, a0, .L2
  ; sci/base.e16.ts:321  return t - 0x37
  addi a0, a0, -55
  ret
.L2:
  ; sci/base.e16.ts:322  return 0xffff
  li a0, 65535
.return:
  ret

; sci/base.e16.ts:325 isDigitOf(t/d) at -O1
;   t/d in s1
isDigitOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t/d
  ; sci/base.e16.ts:326  const d = digitValue(t)
  mv a0, s1
  call digitValue
  mv s1, a0 ; t/d
  ; sci/base.e16.ts:327  return d !== 0xffff && d < radixValue(radix())
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

; sci/base.e16.ts:331 number32() at -O1
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
  ; sci/base.e16.ts:332  const where = basePos
  lw s1, 0x0870(zero)
  ; sci/base.e16.ts:333  const n = pushInt(0, where)
  li a0, 0
  mv a1, s1
  call pushInt
  mv s3, a0 ; n
  ; sci/base.e16.ts:334  const base = pushInt(radixValue(radix()), where)
  call radix
  call radixValue
  mv a1, s1
  call pushInt
  mv s0, a0 ; base
  ; sci/base.e16.ts:335  const digit = push(where)
  mv a0, s1
  call push
  mv s2, a0 ; digit
  ; sci/base.e16.ts:336  while (isDigitOf(peekToken())) {
  j .L3
.L1:
  ; sci/base.e16.ts:337  copy8(base, digit)
  mv a0, s0
  mv a1, s2
  call copy8
  ; sci/base.e16.ts:338  math(M_MUL, n, digit, where)
  li a0, 3
  mv a1, s3
  mv a2, s2
  mv a3, s1
  call math
  ; sci/base.e16.ts:339  setDigit(digit, digitValue(peekToken()))
  call peekToken
  call digitValue
  mv a1, a0
  mv a0, s2
  call setDigit
  ; sci/base.e16.ts:340  math(M_ADD, n, digit, where)
  li a0, 1
  mv a1, s3
  mv a2, s2
  mv a3, s1
  call math
  ; sci/base.e16.ts:341  wrap32(n, where)
  mv a0, s3
  mv a1, s1
  call wrap32
  ; sci/base.e16.ts:342  basePos++
  lw t0, 0x0870(zero)
  addi t0, t0, 1
  sw t0, 0x0870(zero)
.L3:
  call peekToken
  call isDigitOf
  bnez a0, .L1
  ; sci/base.e16.ts:344  pop()
  call pop
  ; sci/base.e16.ts:345  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/base.e16.ts:349 setDigit(n, v) at -O1
;   n in a0
;   v in a1
;   k in a2
setDigit:
  ; sci/base.e16.ts:350  for (let k: u16 = 0; k < 8; k++) poke(n + k, 0)
  li a2, 0 ; k
  j .L3
.L1:
  ; sci/base.e16.ts:350  poke(n + k, 0)
  add t0, a0, a2
  sb zero, 0(t0)
  addi a2, a2, 1
.L3:
  li t0, 8
  bltu a2, t0, .L1
  ; sci/base.e16.ts:351  if (v >= 10) {
  li t0, 10
  bltu a1, t0, .L5
  ; sci/base.e16.ts:352  poke(n + 1, 1)
  li t0, 1
  sb t0, 1(a0)
  ; sci/base.e16.ts:354  poke(n + 2, v + 6)
  addi t0, a1, 6
  sb t0, 2(a0)
  j .L6
.L5:
  ; sci/base.e16.ts:355  poke(n + 2, v << 4)
  slli t0, a1, 4
  sb t0, 2(a0)
.L6:
.return:
  ret

; sci/base.e16.ts:359 arithmetic(op, where) at -O1
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
  ; sci/base.e16.ts:360  const b = top()
  call top
  mv s2, a0 ; b
  ; sci/base.e16.ts:361  const a = b - VALUE_SIZE
  addi s3, s2, -36
  ; sci/base.e16.ts:362  math(op, a, b, where)
  mv a0, s0
  mv a1, s3
  mv a2, s2
  mv a3, s1
  call math
  ; sci/base.e16.ts:363  wrap32(a, where)
  mv a0, s3
  mv a1, s1
  call wrap32
  ; sci/base.e16.ts:364  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; sci/base.e16.ts:368 wrap32(v, where) at -O1
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
  ; sci/base.e16.ts:369  math(M_MOD, v, addr(TWO32), where)
  li a0, 9
  mv a1, s1
  la a2, TWO32
  mv a3, s2
  call math
  ; sci/base.e16.ts:370  if (isNegative(v)) math(M_ADD, v, addr(TWO32), where)
  mv a0, s1
  call isNegative
  beqz a0, .L1
  ; sci/base.e16.ts:370  math(M_ADD, v, addr(TWO32), where)
  li a0, 1
  mv a1, s1
  la a2, TWO32
  mv a3, s2
  call math
.L1:
  ; sci/base.e16.ts:371  const t = push(where)
  mv a0, s2
  call push
  mv s3, a0 ; t
  ; sci/base.e16.ts:372  copy8(v, t)
  mv a0, s1
  mv a1, s3
  call copy8
  ; sci/base.e16.ts:373  math(M_SUB, t, addr(TWO31), where)
  li a0, 2
  mv a1, s3
  la a2, TWO31
  mv a3, s2
  call math
  ; sci/base.e16.ts:374  if (!isNegative(t)) math(M_SUB, v, addr(TWO32), where)
  mv a0, s3
  call isNegative
  bnez a0, .L2
  ; sci/base.e16.ts:374  math(M_SUB, v, addr(TWO32), where)
  li a0, 2
  mv a1, s1
  la a2, TWO32
  mv a3, s2
  call math
.L2:
  ; sci/base.e16.ts:375  pop()
  call pop
  ; sci/base.e16.ts:376  exactWhole(v)
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

; sci/base.e16.ts:383 logic(t, where) at -O1
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
  ; sci/base.e16.ts:384  const b = top()
  call top
  mv s1, a0 ; b/k
  ; sci/base.e16.ts:385  if (t === T_NOT) {
  li t0, 242
  bne s0, t0, .L1
  ; sci/base.e16.ts:386  math(M_TOI32, b, addr(left), where)
  li a0, 42
  mv a1, s1
  la a2, left
  mv a3, s3
  call math
  ; sci/base.e16.ts:387  for (let k: u16 = 0; k < 4; k++) left[k] = ~left[k] & 0xff
  li s2, 0 ; k/a
  j .L4
.L2:
  ; sci/base.e16.ts:387  left[k] = ~left[k] & 0xff
  lbu t0, left(s2)
  not t0, t0
  andi t0, t0, 255
  sb t0, left(s2)
  addi s2, s2, 1
.L4:
  li t0, 4
  bltu s2, t0, .L2
  ; sci/base.e16.ts:388  math(M_FROMI32, b, addr(left), where)
  li a0, 41
  mv a1, s1
  la a2, left
  mv a3, s3
  call math
  ; sci/base.e16.ts:389  exactWhole(b)
  mv a0, s1
  la t0, exactWhole
  li t1, 2
  call far_call
  ; sci/base.e16.ts:390  return
  j .return
.L1:
  ; sci/base.e16.ts:392  const a = b - VALUE_SIZE
  addi s2, s1, -36
  ; sci/base.e16.ts:393  math(M_TOI32, a, addr(left), where)
  li a0, 42
  mv a1, s2
  la a2, left
  mv a3, s3
  call math
  ; sci/base.e16.ts:394  math(M_TOI32, b, addr(right), where)
  li a0, 42
  mv a1, s1
  la a2, right
  mv a3, s3
  call math
  ; sci/base.e16.ts:395  for (let k: u16 = 0; k < 4; k++) left[k] = bitsOf(t, left[k], right[k])
  li s1, 0 ; b/k
  j .L8
.L6:
  ; sci/base.e16.ts:395  left[k] = bitsOf(t, left[k], right[k])
  lbu a1, left(s1)
  lbu a2, right(s1)
  mv a0, s0
  call bitsOf
  sb a0, left(s1)
  addi s1, s1, 1
.L8:
  li t0, 4
  bltu s1, t0, .L6
  ; sci/base.e16.ts:396  math(M_FROMI32, a, addr(left), where)
  li a0, 41
  mv a1, s2
  la a2, left
  mv a3, s3
  call math
  ; sci/base.e16.ts:397  exactWhole(a)
  mv a0, s2
  la t0, exactWhole
  li t1, 2
  call far_call
  ; sci/base.e16.ts:398  pop()
  call pop
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/base.e16.ts:401 bitsOf(t, a, b) at -O1
;   t in a0
;   a in a1
;   b in a2
bitsOf:
  ; sci/base.e16.ts:402  if (t === T_AND) return a & b
  li t0, 238
  bne a0, t0, .L1
  ; sci/base.e16.ts:402  return a & b
  and a0, a1, a2
  ret
.L1:
  ; sci/base.e16.ts:403  if (t === T_OR) return a | b
  li t0, 239
  bne a0, t0, .L2
  ; sci/base.e16.ts:403  return a | b
  or a0, a1, a2
  ret
.L2:
  ; sci/base.e16.ts:404  if (t === T_XOR) return a ^ b
  li t0, 240
  bne a0, t0, .L3
  ; sci/base.e16.ts:404  return a ^ b
  xor a0, a1, a2
  ret
.L3:
  ; sci/base.e16.ts:405  return ~(a ^ b) & 0xff
  xor t0, a1, a2
  not t0, t0
  andi a0, t0, 255
.return:
  ret

; sci/base.e16.ts:414 baseDraw() at -O1
;   n in s2
;   r in s1
baseDraw:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; sci/base.e16.ts:415  cls()
  call cls
  ; sci/base.e16.ts:416  bandWith(str('BASE 32'), radixName(radix()))
  call radix
  call radixName
  mv a1, a0
  la a0, str_153
  call bandWith
  ; sci/base.e16.ts:417  drawLine32()
  call drawLine32
  ; sci/base.e16.ts:418  if (!answered) return
  lw t0, 0x0586(zero)
  bnez t0, .L1
  ; sci/base.e16.ts:418  return
  j .return
.L1:
  ; sci/base.e16.ts:419  noCursor()
  call noCursor
  ; sci/base.e16.ts:420  constants()
  call constants
  ; sci/base.e16.ts:421  math(M_TOI32, KEEP_ANS, addr(bits), 0)
  li a0, 42
  li a1, 3080
  la a2, bits
  li a3, 0
  call math
  ; sci/base.e16.ts:422  radixText(radix())
  call radix
  call radixText
  ; sci/base.e16.ts:423  textRight(addr(baseText), lineY(1))
  la a0, baseText
  li a1, 20
  call textRight
  ; sci/base.e16.ts:425  let n: u16 = 2
  li s2, 2 ; n
  ; sci/base.e16.ts:426  for (let r: u16 = 0; r < 4; r++) {
  li s1, 0 ; r
  j .L4
.L2:
  ; sci/base.e16.ts:427  if (r === radix()) continue
  call radix
  bne s1, a0, .L6
  ; sci/base.e16.ts:427  continue
  j .L3
.L6:
  ; sci/base.e16.ts:428  textAt(r === BIN ? binName() : radixName(r), 1, lineY(n))
  li t0, 3
  bne s1, t0, .L7
  ; sci/base.e16.ts:445  return high ? str('BIN\x8e') : str('BIN\x8d')
  lw t0, 0x0868(zero)
  beqz t0, .I1.L1
  la t0, str_159
  j .L8
.I1.L1:
  la t0, str_160
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
  ; sci/base.e16.ts:429  radixText(r)
  mv a0, s1
  call radixText
  ; sci/base.e16.ts:430  textRight(addr(baseText), lineY(n))
  mv a0, s2
  call lineY
  mv a1, a0
  la a0, baseText
  call textRight
  ; sci/base.e16.ts:431  n++
  addi s2, s2, 1
.L3:
  addi s1, s1, 1
.L4:
  li t0, 4
  bltu s1, t0, .L2
  ; sci/base.e16.ts:433  if (radix() !== PEN) dots()
  call radix
  li t0, 4
  beq a0, t0, .L9
  ; sci/base.e16.ts:433  dots()
  call dots
.L9:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/base.e16.ts:436 radixName(r) at -O1
;   r in a0
radixName:
  ; sci/base.e16.ts:437  if (r === HEX) return str('HEX')
  bne a0, zero, .L1
  ; sci/base.e16.ts:437  return str('HEX')
  la a0, str_154
  ret
.L1:
  ; sci/base.e16.ts:438  if (r === 1) return str('DEC')
  li t0, 1
  bne a0, t0, .L2
  ; sci/base.e16.ts:438  return str('DEC')
  la a0, str_155
  ret
.L2:
  ; sci/base.e16.ts:439  if (r === 2) return str('OCT')
  li t0, 2
  bne a0, t0, .L3
  ; sci/base.e16.ts:439  return str('OCT')
  la a0, str_156
  ret
.L3:
  ; sci/base.e16.ts:440  return r === PEN ? str('PEN') : str('BIN')
  li t0, 4
  bne a0, t0, .L4
  la t0, str_157
  j .L5
.L4:
  la t0, str_158
.L5:
  mv a0, t0
.return:
  ret

; sci/base.e16.ts:452 drawLine32() at -O1
;   chars/c in s2
;   cursorAt in s3
;   i/from in s1
;   i in s0
drawLine32:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  sw s0, 8(sp)
  ; sci/base.e16.ts:453  let chars: u16 = 0
  li s2, 0 ; chars/c
  ; sci/base.e16.ts:454  let cursorAt: u16 = 0
  li s3, 0 ; cursorAt
  ; sci/base.e16.ts:455  for (let i: u16 = 0; i < length; i++) {
  li s1, 0 ; i/from
  j .L3
.L1:
  ; sci/base.e16.ts:456  if (i === cursor) cursorAt = chars
  lw t0, 0x0584(zero)
  bne s1, t0, .L5
  ; sci/base.e16.ts:456  cursorAt = chars
  mv s3, s2 ; cursorAt
.L5:
  ; sci/base.e16.ts:457  chars += charsOf(line[i])
  lbu a0, line(s1)
  la t0, charsOf
  li t1, 3
  call far_call
  add s2, s2, a0
  addi s1, s1, 1
.L3:
  lw t0, 0x0582(zero)
  bltu s1, t0, .L1
  ; sci/base.e16.ts:459  if (cursor >= length) cursorAt = chars
  lw t0, 0x0584(zero)
  lw t1, 0x0582(zero)
  bltu t0, t1, .L6
  ; sci/base.e16.ts:459  cursorAt = chars
  mv s3, s2 ; cursorAt
.L6:
  ; sci/base.e16.ts:460  const from = cursorAt > 20 ? cursorAt - 20 : 0
  li t0, 20
  bgeu t0, s3, .L7
  addi t0, s3, -20
  j .L8
.L7:
  li t0, 0
.L8:
  mv s1, t0 ; i/from
  ; sci/base.e16.ts:461  let c: u16 = 0
  li s2, 0 ; chars/c
  ; sci/base.e16.ts:462  for (let i: u16 = 0; i < length; i++) c = drawToken(line[i], c, from)
  li s0, 0 ; i
  j .L11
.L9:
  ; sci/base.e16.ts:462  c = drawToken(line[i], c, from)
  lbu a0, line(s0)
  mv a1, s2
  mv a2, s1
  call drawToken
  mv s2, a0 ; chars/c
  addi s0, s0, 1
.L11:
  lw t0, 0x0582(zero)
  bltu s0, t0, .L9
  ; sci/base.e16.ts:463  if (!answered) barDots((cursorAt - from) * 6, lineY(0) - 1)
  lw t0, 0x0586(zero)
  bnez t0, .L13
  ; sci/base.e16.ts:463  barDots((cursorAt - from) * 6, lineY(0) - 1)
  sub t0, s3, s1
  slli t1, t0, 2
  slli t0, t0, 1
  add a0, t0, t1
  li a1, 10
  call barDots
.L13:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/base.e16.ts:467 drawToken(t, c/k, from) at -O1
;   t in s3
;   c/k in s1
;   from in s0
;   s/p in s2
drawToken:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s0, 6(sp)
  sw s2, 8(sp)
  mv s3, a0 ; t
  mv s1, a1 ; c/k
  mv s0, a2 ; from
  ; sci/base.e16.ts:468  const s = tokenText(t)
  mv a0, s3
  call tokenText
  mv s2, a0 ; s/p
  ; sci/base.e16.ts:469  if (s === 0) {
  bne s2, zero, .L1
  ; sci/base.e16.ts:470  charOnRow(t, c, from)
  mv a0, s3
  mv a1, s1
  mv a2, s0
  call charOnRow
  ; sci/base.e16.ts:471  return c + 1
  addi a0, s1, 1
  j .return
.L1:
  ; sci/base.e16.ts:473  let k = c
  ; sci/base.e16.ts:474  let p = s
  ; sci/base.e16.ts:475  while (peek(p) !== 0) {
  j .L4
.L2:
  ; sci/base.e16.ts:476  charOnRow(peek(p), k, from)
  lbu a0, 0(s2)
  mv a1, s1
  mv a2, s0
  call charOnRow
  ; sci/base.e16.ts:477  k++
  addi s1, s1, 1
  ; sci/base.e16.ts:478  p++
  addi s2, s2, 1
.L4:
  lbu t0, 0(s2)
  bne t0, zero, .L2
  ; sci/base.e16.ts:480  return k
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/base.e16.ts:483 charOnRow(ch, c, from) at -O1
;   ch in s3
;   c in s1
;   from in s2
charOnRow:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; ch
  mv s1, a1 ; c
  mv s2, a2 ; from
  ; sci/base.e16.ts:484  if (c >= from && c < from + 21) glyphAt(ch, (c - from) * 6 + 1, lineY(0))
  bltu s1, s2, .L1
  addi t0, s2, 21
  bgeu s1, t0, .L1
  ; sci/base.e16.ts:484  glyphAt(ch, (c - from) * 6 + 1, lineY(0))
  sub t0, s1, s2
  slli t1, t0, 2
  slli t0, t0, 1
  add t0, t0, t1
  mv a0, s3
  addi a1, t0, 1
  li a2, 11
  call glyphAt
.L1:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/base.e16.ts:488 radixText(r/first) at -O1
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
  ; sci/base.e16.ts:489  if (r === PEN) {
  li t0, 4
  bne s1, t0, .L1
  ; sci/base.e16.ts:490  penText()
  call penText
  ; sci/base.e16.ts:491  return
  j .return
.L1:
  ; sci/base.e16.ts:493  if (r === 1) {
  li t0, 1
  bne s1, t0, .L2
  ; sci/base.e16.ts:494  poke16(MATH_ARG, 10)
  li t0, 10
  li t1, 65366
  sw t0, 0(t1)
  ; sci/base.e16.ts:495  math(M_FORMAT, KEEP_ANS, addr(baseText), 0)
  li a0, 57
  li a1, 3080
  la a2, baseText
  li a3, 0
  call math
  ; sci/base.e16.ts:496  baseText[peek16(MATH_ARG)] = 0
  li t0, 65366
  lw t0, 0(t0)
  sb zero, baseText(t0)
  ; sci/base.e16.ts:497  return
  j .return
.L2:
  ; sci/base.e16.ts:499  const width: u16 = r === HEX ? 4 : r === BIN ? 1 : 3
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
  ; sci/base.e16.ts:500  const digits: u16 = r === HEX ? 8 : r === BIN ? 16 : 11
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
  ; sci/base.e16.ts:501  const first: u16 = r === BIN && high ? 16 : 0
  li t0, 3
  bne s1, t0, .L11
  lw t0, 0x0868(zero)
  beqz t0, .L11
  li t0, 16
  j .L12
.L11:
  li t0, 0
.L12:
  mv s1, t0 ; r/first
  ; sci/base.e16.ts:502  for (let k: u16 = 0; k < digits; k++) {
  li s2, 0 ; k
  j .L15
.L13:
  ; sci/base.e16.ts:503  const d = field(first + (digits - 1 - k) * width, width)
  addi t0, s3, -1
  sub t0, t0, s2
  lw t1, 0(sp) ; width
  mul t0, t0, t1
  add a0, s1, t0
  lw a1, 0(sp)
  call field
  mv s0, a0 ; d
  ; sci/base.e16.ts:504  baseText[k] = d < 10 ? 0x30 + d : 0x37 + d
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
  ; sci/base.e16.ts:506  baseText[digits] = 0
  sb zero, baseText(s3)
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  lw s0, 10(sp)
  addi sp, sp, 12
  ret

; sci/base.e16.ts:513 penText() at -O1
;   k in s1
penText:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/base.e16.ts:514  const left = WORK + 64
  ; sci/base.e16.ts:515  const five = WORK + 72
  ; sci/base.e16.ts:516  const digit = WORK + 80
  ; sci/base.e16.ts:517  copy8(KEEP_ANS, left)
  li a0, 3080
  li a1, 10048
  call copy8
  ; sci/base.e16.ts:518  if (isNegative(left)) math(M_ADD, left, addr(TWO32), 0)
  li a0, 10048
  call isNegative
  beqz a0, .L1
  ; sci/base.e16.ts:518  math(M_ADD, left, addr(TWO32), 0)
  li a0, 1
  li a1, 10048
  la a2, TWO32
  li a3, 0
  call math
.L1:
  ; sci/base.e16.ts:519  setDigit(five, 5)
  li a0, 10056
  li a1, 5
  call setDigit
  ; sci/base.e16.ts:520  for (let k: u16 = 14; k > 0; k--) {
  li s1, 14 ; k
  j .L4
.L2:
  ; sci/base.e16.ts:521  copy8(left, digit)
  li a0, 10048
  li a1, 10064
  call copy8
  ; sci/base.e16.ts:522  math(M_MOD, digit, five, 0)
  li a0, 9
  li a1, 10064
  li a2, 10056
  li a3, 0
  call math
  ; sci/base.e16.ts:523  baseText[k - 1] = 0x30 + (peek(digit + 2) >> 4)
  li t0, 10066
  lbu t0, 0(t0)
  srli t0, t0, 4
  addi t0, t0, 48
  sb t0, baseText-1(s1)
  ; sci/base.e16.ts:524  math(M_IDIV, left, five, 0)
  li a0, 8
  li a1, 10048
  li a2, 10056
  li a3, 0
  call math
  addi s1, s1, -1
.L4:
  bltu zero, s1, .L2
  ; sci/base.e16.ts:526  baseText[14] = 0
  sb zero, baseText+14(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/base.e16.ts:530 field(from, width) at -O1
;   from in a0
;   width in a1
;   v in a3
;   k in a2
;   b in s1
field:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; sci/base.e16.ts:531  let v: u16 = 0
  li a3, 0 ; v
  ; sci/base.e16.ts:532  for (let k: u16 = 0; k < width; k++) {
  li a2, 0 ; k
  j .L3
.L1:
  ; sci/base.e16.ts:533  const b = from + k
  add s1, a0, a2
  ; sci/base.e16.ts:534  if (b < 32 && ((bits[b >> 3] >> (b & 7)) & 1) !== 0) v |= 1 << k
  li t0, 32
  bgeu s1, t0, .L5
  srli t0, s1, 3
  lbu t0, bits(t0)
  andi t1, s1, 7
  srl t0, t0, t1
  andi t0, t0, 1
  beq t0, zero, .L5
  ; sci/base.e16.ts:534  v |= 1 << k
  li t0, 1
  sll t0, t0, a2
  or a3, a3, t0
.L5:
  addi a2, a2, 1
.L3:
  bltu a2, a1, .L1
  ; sci/base.e16.ts:536  return v
  mv a0, a3
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; sci/base.e16.ts:540 dots() at -O1
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
  ; sci/base.e16.ts:541  const first: u16 = high ? 16 : 0
  lw t0, 0x0868(zero)
  beqz t0, .L1
  li t0, 16
  j .L2
.L1:
  li t0, 0
.L2:
  mv s0, t0 ; first
  ; sci/base.e16.ts:542  for (let b: u16 = 0; b < 16; b++) {
  li s1, 0 ; b
  j .L5
.L3:
  ; sci/base.e16.ts:543  const x = 122 - b * 7 - (b >= 8 ? 2 : 0)
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
  ; sci/base.e16.ts:544  const on = field(first + b, 1) === 1
  add a0, s0, s1
  li a1, 1
  call field
  li t0, 1
  sub t0, a0, t0
  seqz s2, t0
  ; sci/base.e16.ts:545  for (let y: u16 = on ? 57 : 62; y <= 62; y++) {
  beqz s2, .L9
  li t0, 57
  j .L10
.L9:
  li t0, 62
.L10:
  mv s2, t0 ; on/y
  j .L13
.L11:
  ; sci/base.e16.ts:546  for (let dx: u16 = 0; dx < 5; dx++) dot(x + dx, y)
  li s3, 0 ; dx
  j .L17
.L15:
  ; sci/base.e16.ts:546  dot(x + dx, y)
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

str_25:
  .byte 48, 46, 57, 57, 49, 52, 53, 53, 51, 55, 49, 49, 50, 49, 124, 48, 46, 57, 52, 57, 49, 48, 55, 57, 49, 50, 51, 52, 51, 124, 48, 46, 56, 54, 52, 56, 54, 52, 52, 50, 51, 51, 54, 48, 124, 48, 46, 55, 52, 49, 53, 51, 49, 49, 56, 53, 53, 57, 57, 124, 48, 46, 53, 56, 54, 48, 56, 55, 50, 51, 53, 52, 54, 56, 124, 48, 46, 52, 48, 53, 56, 52, 53, 49, 53, 49, 51, 55, 55, 124, 48, 46, 50, 48, 55, 55, 56, 52, 57, 53, 53, 48, 48, 56, 124, 48, 124, 48, 46, 48, 50, 50, 57, 51, 53, 51, 50, 50, 48, 49, 48, 53, 124, 48, 46, 48, 54, 51, 48, 57, 50, 48, 57, 50, 54, 51, 48, 48, 124, 48, 46, 49, 48, 52, 55, 57, 48, 48, 49, 48, 51, 50, 50, 124, 48, 46, 49, 52, 48, 54, 53, 51, 50, 53, 57, 55, 49, 54, 124, 48, 46, 49, 54, 57, 48, 48, 52, 55, 50, 54, 54, 51, 57, 124, 48, 46, 49, 57, 48, 51, 53, 48, 53, 55, 56, 48, 54, 53, 124, 48, 46, 50, 48, 52, 52, 51, 50, 57, 52, 48, 48, 55, 53, 124, 48, 46, 50, 48, 57, 52, 56, 50, 49, 52, 49, 48, 56, 53, 124, 48, 46, 49, 50, 57, 52, 56, 52, 57, 54, 54, 49, 54, 57, 124, 48, 46, 50, 55, 57, 55, 48, 53, 51, 57, 49, 52, 56, 57, 124, 48, 46, 51, 56, 49, 56, 51, 48, 48, 53, 48, 53, 48, 53, 124, 48, 46, 52, 49, 55, 57, 53, 57, 49, 56, 51, 54, 55, 51, 124, 49, 69, 45, 49, 48, 124, 49, 69, 45, 49, 50, 0
str_145:
  .byte 70, 85, 78, 67, 0
str_146:
  .byte 49, 47, 50, 0
str_147:
  .byte 50, 47, 50, 0
str_148:
  .byte 49, 58, 72, 69, 88, 32, 50, 58, 68, 69, 67, 32, 51, 58, 79, 67, 84, 0
str_149:
  .byte 52, 58, 66, 73, 78, 32, 53, 58, 80, 69, 78, 0
str_150:
  .byte 49, 58, 65, 78, 68, 32, 50, 58, 79, 82, 32, 51, 58, 88, 79, 82, 0
str_151:
  .byte 52, 58, 88, 78, 79, 82, 32, 53, 58, 110, 111, 116, 40, 32, 54, 58, 110, 101, 103, 40, 0
str_152:
  .byte 141, 142, 58, 80, 65, 71, 69, 32, 65, 67, 58, 66, 65, 67, 75, 0
str_153:
  .byte 66, 65, 83, 69, 32, 51, 50, 0
str_154:
  .byte 72, 69, 88, 0
str_155:
  .byte 68, 69, 67, 0
str_156:
  .byte 79, 67, 84, 0
str_157:
  .byte 80, 69, 78, 0
str_158:
  .byte 66, 73, 78, 0
str_159:
  .byte 66, 73, 78, 142, 0
str_160:
  .byte 66, 73, 78, 141, 0
  .align 2

  .bank 9
  .org 0xc000
; sci/grid.e16.ts:70 gridOpenMatrix(base, rows, cols) at -O1
;   base in s1
;   rows in s2
;   cols in s3
gridOpenMatrix:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; base
  mv s2, a1 ; rows
  mv s3, a2 ; cols
  ; sci/grid.e16.ts:71  gridOpen(GRID_MAT, rows, cols)
  li a0, 2
  mv a1, s2
  mv a2, s3
  call gridOpen
  ; sci/grid.e16.ts:72  gridBase = base + 2
  addi t0, s1, 2
  sw t0, 0x08fc(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/grid.e16.ts:76 gridOpen(which, rows, cols) at -O1
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
  ; sci/grid.e16.ts:77  gridKind = which
  sw s1, 0x08b6(zero)
  ; sci/grid.e16.ts:78  gridRows = rows
  sw s2, 0x08b8(zero)
  ; sci/grid.e16.ts:79  gridCols = which === GRID_STATS ? statsCols() : cols
  bne s1, zero, .L1
  call statsCols
  mv t0, a0
  j .L2
.L1:
  mv t0, s3
.L2:
  sw t0, 0x08ba(zero)
  ; sci/grid.e16.ts:80  row = 0
  sw zero, 0x08bc(zero)
  ; sci/grid.e16.ts:81  col = 0
  sw zero, 0x08be(zero)
  ; sci/grid.e16.ts:82  firstRow = 0
  sw zero, 0x08c0(zero)
  ; sci/grid.e16.ts:83  cellLength = 0
  sw zero, 0x08e2(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/grid.e16.ts:87 statsCols() at -O1
;   n in a0
statsCols:
  ; sci/grid.e16.ts:88  let n: u16 = 1
  li a0, 1 ; n
  ; sci/grid.e16.ts:89  if (peek(STATS_TYPE) !== 0) n++
  lbu t0, 5636(zero)
  beq t0, zero, .L1
  ; sci/grid.e16.ts:89  n++
  addi a0, a0, 1
.L1:
  ; sci/grid.e16.ts:90  if (peek(STATS_FREQ) !== 0) n++
  lbu t0, 5637(zero)
  beq t0, zero, .L2
  ; sci/grid.e16.ts:90  n++
  addi a0, a0, 1
.L2:
  ; sci/grid.e16.ts:91  return n
.return:
  ret

; sci/grid.e16.ts:95 gridRow() at -O1
gridRow:
  ; sci/grid.e16.ts:96  return row
  lw a0, 0x08bc(zero)
.return:
  ret

; sci/grid.e16.ts:100 rowsNow() at -O1
;   n in a0
rowsNow:
  ; sci/grid.e16.ts:101  if (gridKind !== GRID_STATS) return gridRows
  lw t0, 0x08b6(zero)
  beq t0, zero, .L1
  ; sci/grid.e16.ts:101  return gridRows
  lw a0, 0x08b8(zero)
  ret
.L1:
  ; sci/grid.e16.ts:102  const n = peek16(STATS_COUNT)
  lw a0, 5634(zero)
  ; sci/grid.e16.ts:103  return n < STATS_ROWS ? n + 1 : n
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

; sci/grid.e16.ts:107 dataColumn(c) at -O1
;   c in a0
dataColumn:
  ; sci/grid.e16.ts:108  if (c === 0) return 0
  bne a0, zero, .L1
  ; sci/grid.e16.ts:108  return 0
  li a0, 0
  ret
.L1:
  ; sci/grid.e16.ts:109  if (c === 1 && peek(STATS_TYPE) !== 0) return 1
  li t0, 1
  bne a0, t0, .L2
  lbu t0, 5636(zero)
  beq t0, zero, .L2
  ; sci/grid.e16.ts:109  return 1
  li a0, 1
  ret
.L2:
  ; sci/grid.e16.ts:110  return 2
  li a0, 2
.return:
  ret

; sci/grid.e16.ts:114 cellAt(r, c) at -O1
;   r in s1
;   c in s2
cellAt:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; r
  mv s2, a1 ; c
  ; sci/grid.e16.ts:115  if (gridKind === GRID_STATS) return STATS_DATA + (r * 3 + dataColumn(c)) * 8
  lw t0, 0x08b6(zero)
  bne t0, zero, .L1
  ; sci/grid.e16.ts:115  return STATS_DATA + (r * 3 + dataColumn(c)) * 8
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
  ; sci/grid.e16.ts:116  if (gridKind === GRID_MAT) return gridBase + (r * 3 + c) * 8
  lw t0, 0x08b6(zero)
  li t1, 2
  bne t0, t1, .L2
  ; sci/grid.e16.ts:116  return gridBase + (r * 3 + c) * 8
  lw t0, 0x08fc(zero)
  slli t2, s1, 1
  add t1, t2, s1
  add t1, t1, s2
  slli t1, t1, 3
  add a0, t0, t1
  j .return
.L2:
  ; sci/grid.e16.ts:117  return EQN_COEFFS + (r * gridCols + c) * VALUE_SIZE
  lw t0, 0x08ba(zero)
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

; sci/grid.e16.ts:121 edge(c) at -O1
;   c in a0
edge:
  ; sci/grid.e16.ts:122  return INDEX_WIDTH + div(c * (128 - INDEX_WIDTH), gridCols)
  li t0, 115
  mul t0, a0, t0
  lw t1, 0x08ba(zero)
  divu t0, t0, t1
  addi a0, t0, 13
.return:
  ret

; sci/grid.e16.ts:128 gridKey(k/t, shift) at -O1
;   k/t in s1
;   shift in s2
gridKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/t
  mv s2, a1 ; shift
  ; sci/grid.e16.ts:129  if (k === K_AC || k === K_DEL) return clearKey(k === K_AC)
  li t0, 5
  beq s1, t0, .L2
  li t0, 14
  bne s1, t0, .L1
.L2:
  ; sci/grid.e16.ts:129  return clearKey(k === K_AC)
  li t0, 5
  sub t0, s1, t0
  seqz a0, t0
  call clearKey
  j .return
.L1:
  ; sci/grid.e16.ts:130  if (k === K_EQ) {
  li t0, 4
  bne s1, t0, .L3
  ; sci/grid.e16.ts:131  if (cellLength === 0) return GRID_DONE
  lw t0, 0x08e2(zero)
  bne t0, zero, .L4
  ; sci/grid.e16.ts:131  return GRID_DONE
  li a0, 1
  j .return
.L4:
  ; sci/grid.e16.ts:132  commit()
  call commit
  ; sci/grid.e16.ts:133  advance()
  call advance
  ; sci/grid.e16.ts:134  return GRID_STAY
  li a0, 0
  j .return
.L3:
  ; sci/grid.e16.ts:136  if (k === K_UP || k === K_DOWN || k === K_LEFT || k === K_RIGHT) {
  beq s1, zero, .L6
  li t0, 1
  beq s1, t0, .L6
  li t0, 2
  beq s1, t0, .L6
  li t0, 3
  bne s1, t0, .L5
.L6:
  ; sci/grid.e16.ts:137  if (cellLength > 0) commit()
  lw t0, 0x08e2(zero)
  bgeu zero, t0, .L7
  ; sci/grid.e16.ts:137  commit()
  call commit
.L7:
  ; sci/grid.e16.ts:138  move(k)
  mv a0, s1
  call move
  ; sci/grid.e16.ts:139  return GRID_STAY
  li a0, 0
  j .return
.L5:
  ; sci/grid.e16.ts:141  const t = alphaKey ? letterOf(k) : tokenOf(k, shift)
  lw t0, 0x0590(zero)
  beqz t0, .L8
  mv a0, s1
  la t0, letterOf
  li t1, 4
  call far_call
  mv t0, a0
  j .L9
.L8:
  mv a0, s1
  mv a1, s2
  la t0, tokenOf
  li t1, 4
  call far_call
  mv t0, a0
.L9:
  mv s1, t0 ; k/t
  ; sci/grid.e16.ts:142  if (t === 0 || cellLength >= 32) refuse()
  beq s1, zero, .L11
  lw t0, 0x08e2(zero)
  li t1, 32
  bltu t0, t1, .L10
.L11:
  ; sci/grid.e16.ts:142  refuse()
  call refuse
  j .L12
.L10:
  ; sci/grid.e16.ts:144  cellEntry[cellLength] = t
  lw t0, 0x08e2(zero)
  sb s1, cellEntry(t0)
  ; sci/grid.e16.ts:145  cellLength++
  lw t0, 0x08e2(zero)
  addi t0, t0, 1
  sw t0, 0x08e2(zero)
.L12:
  ; sci/grid.e16.ts:147  return GRID_STAY
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/grid.e16.ts:151 clearKey(all) at -O1
;   all in s1
clearKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; all
  ; sci/grid.e16.ts:152  if (all) {
  beqz s1, .L1
  ; sci/grid.e16.ts:153  if (cellLength === 0) return GRID_AC
  lw t0, 0x08e2(zero)
  bne t0, zero, .L2
  ; sci/grid.e16.ts:153  return GRID_AC
  li a0, 2
  j .return
.L2:
  ; sci/grid.e16.ts:154  cellLength = 0
  sw zero, 0x08e2(zero)
  j .L3
.L1:
  ; sci/grid.e16.ts:155  if (cellLength > 0) cellLength--
  lw t0, 0x08e2(zero)
  bgeu zero, t0, .L4
  ; sci/grid.e16.ts:155  cellLength--
  lw t0, 0x08e2(zero)
  addi t0, t0, -1
  sw t0, 0x08e2(zero)
  j .L5
.L4:
  ; sci/grid.e16.ts:156  refuse()
  call refuse
.L5:
.L3:
  ; sci/grid.e16.ts:157  return GRID_STAY
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/grid.e16.ts:160 move(k) at -O1
;   k in s1
move:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/grid.e16.ts:161  if (k === K_UP && row > 0) row--
  bne s1, zero, .L1
  lw t0, 0x08bc(zero)
  bgeu zero, t0, .L1
  ; sci/grid.e16.ts:161  row--
  lw t0, 0x08bc(zero)
  addi t0, t0, -1
  sw t0, 0x08bc(zero)
  j .L2
.L1:
  ; sci/grid.e16.ts:162  if (k === K_DOWN && row + 1 < rowsNow()) row++
  li t0, 1
  bne s1, t0, .L3
  lw t0, 0x08bc(zero)
  addi t0, t0, 1
  addi sp, sp, -2
  sw t0, 0(sp)
  call rowsNow
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu t0, a0, .L3
  ; sci/grid.e16.ts:162  row++
  lw t0, 0x08bc(zero)
  addi t0, t0, 1
  sw t0, 0x08bc(zero)
  j .L4
.L3:
  ; sci/grid.e16.ts:163  if (k === K_LEFT && col > 0) col--
  li t0, 2
  bne s1, t0, .L5
  lw t0, 0x08be(zero)
  bgeu zero, t0, .L5
  ; sci/grid.e16.ts:163  col--
  lw t0, 0x08be(zero)
  addi t0, t0, -1
  sw t0, 0x08be(zero)
  j .L6
.L5:
  ; sci/grid.e16.ts:164  if (k === K_RIGHT && col + 1 < gridCols) col++
  li t0, 3
  bne s1, t0, .L7
  lw t0, 0x08be(zero)
  lw t1, 0x08ba(zero)
  addi t0, t0, 1
  bgeu t0, t1, .L7
  ; sci/grid.e16.ts:164  col++
  lw t0, 0x08be(zero)
  addi t0, t0, 1
  sw t0, 0x08be(zero)
  j .L8
.L7:
  ; sci/grid.e16.ts:165  refuse()
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

; sci/grid.e16.ts:169 advance() at -O1
advance:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/grid.e16.ts:170  if (gridKind === GRID_STATS) {
  lw t0, 0x08b6(zero)
  bne t0, zero, .L1
  ; sci/grid.e16.ts:171  if (row + 1 < rowsNow()) row++
  lw t0, 0x08bc(zero)
  addi t0, t0, 1
  addi sp, sp, -2
  sw t0, 0(sp)
  call rowsNow
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu t0, a0, .L3
  ; sci/grid.e16.ts:171  row++
  lw t0, 0x08bc(zero)
  addi t0, t0, 1
  sw t0, 0x08bc(zero)
  j .L3
.L1:
  ; sci/grid.e16.ts:172  if (col + 1 < gridCols) col++
  lw t0, 0x08be(zero)
  lw t1, 0x08ba(zero)
  addi t0, t0, 1
  bgeu t0, t1, .L4
  ; sci/grid.e16.ts:172  col++
  lw t0, 0x08be(zero)
  addi t0, t0, 1
  sw t0, 0x08be(zero)
  j .L5
.L4:
  ; sci/grid.e16.ts:173  if (row + 1 < gridRows) {
  lw t0, 0x08bc(zero)
  lw t1, 0x08b8(zero)
  addi t0, t0, 1
  bgeu t0, t1, .L6
  ; sci/grid.e16.ts:174  row++
  lw t0, 0x08bc(zero)
  addi t0, t0, 1
  sw t0, 0x08bc(zero)
  ; sci/grid.e16.ts:175  col = 0
  sw zero, 0x08be(zero)
.L6:
.L5:
.L3:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/grid.e16.ts:180 commit() at -O1
;   count in s1
commit:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/grid.e16.ts:181  clearStack()
  call clearStack
  ; sci/grid.e16.ts:182  evaluate(addr(cellEntry), cellLength)
  lw a1, 0x08e2(zero)
  la a0, cellEntry
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/grid.e16.ts:183  cellLength = 0
  sw zero, 0x08e2(zero)
  ; sci/grid.e16.ts:184  if (gridKind === GRID_MAT) {
  lw t0, 0x08b6(zero)
  li t1, 2
  bne t0, t1, .L1
  ; sci/grid.e16.ts:185  copy8(top(), cellAt(row, col))
  call top
  lw t0, 0x08bc(zero)
  lw a1, 0x08be(zero)
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, t0
  call cellAt
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  ; sci/grid.e16.ts:186  return
  j .return
.L1:
  ; sci/grid.e16.ts:188  if (gridKind !== GRID_STATS) {
  lw t0, 0x08b6(zero)
  beq t0, zero, .L2
  ; sci/grid.e16.ts:189  copyValue(top(), cellAt(row, col))
  call top
  lw t0, 0x08bc(zero)
  lw a1, 0x08be(zero)
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, t0
  call cellAt
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copyValue
  ; sci/grid.e16.ts:190  return
  j .return
.L2:
  ; sci/grid.e16.ts:192  const count = peek16(STATS_COUNT)
  lw s1, 5634(zero)
  ; sci/grid.e16.ts:193  if (row === count) newRow(row)
  lw t0, 0x08bc(zero)
  bne t0, s1, .L3
  ; sci/grid.e16.ts:193  newRow(row)
  lw a0, 0x08bc(zero)
  call newRow
.L3:
  ; sci/grid.e16.ts:194  copy8(top(), cellAt(row, col))
  call top
  lw t0, 0x08bc(zero)
  lw a1, 0x08be(zero)
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

; sci/grid.e16.ts:200 newRow(r/at) at -O1
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
  ; sci/grid.e16.ts:201  const count = peek16(STATS_COUNT)
  lw s3, 5634(zero)
  ; sci/grid.e16.ts:202  if (count >= STATS_ROWS) {
  li t0, 40
  bltu s3, t0, .L1
  ; sci/grid.e16.ts:203  refuse()
  call refuse
  ; sci/grid.e16.ts:204  return
  j .return
.L1:
  ; sci/grid.e16.ts:206  const at = STATS_DATA + r * 24
  slli t1, s2, 4
  slli t0, s2, 3
  add t0, t0, t1
  addi s2, t0, 5648
  ; sci/grid.e16.ts:207  for (let i = STATS_DATA + count * 24 + 23; i >= at + 24; i--) poke(i, peek(i - 24))
  slli t1, s3, 4
  slli t0, s3, 3
  add t0, t0, t1
  addi s1, t0, 5671
  j .L4
.L2:
  ; sci/grid.e16.ts:207  poke(i, peek(i - 24))
  lbu t0, -24(s1)
  sb t0, 0(s1)
  addi s1, s1, -1
.L4:
  addi t0, s2, 24
  bgeu s1, t0, .L2
  ; sci/grid.e16.ts:208  for (let i: u16 = 0; i < 24; i++) poke(at + i, 0)
  li s1, 0 ; i
  j .L8
.L6:
  ; sci/grid.e16.ts:208  poke(at + i, 0)
  add t0, s2, s1
  sb zero, 0(t0)
  addi s1, s1, 1
.L8:
  li t0, 24
  bltu s1, t0, .L6
  ; sci/grid.e16.ts:210  poke(at + 18, 0x10)
  li t0, 16
  sb t0, 18(s2)
  ; sci/grid.e16.ts:211  poke16(STATS_COUNT, count + 1)
  addi t0, s3, 1
  sw t0, 5634(zero)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/grid.e16.ts:215 deleteRow() at -O1
;   count in s2
;   at/i in s1
deleteRow:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; sci/grid.e16.ts:216  const count = peek16(STATS_COUNT)
  lw s2, 5634(zero)
  ; sci/grid.e16.ts:217  if (row >= count) {
  lw t0, 0x08bc(zero)
  bltu t0, s2, .L1
  ; sci/grid.e16.ts:218  refuse()
  call refuse
  ; sci/grid.e16.ts:219  return
  j .return
.L1:
  ; sci/grid.e16.ts:221  const at = STATS_DATA + row * 24
  lw t0, 0x08bc(zero)
  slli t1, t0, 4
  slli t0, t0, 3
  add t0, t0, t1
  addi s1, t0, 5648
  ; sci/grid.e16.ts:222  for (let i = at; i < STATS_DATA + (count - 1) * 24; i++) poke(i, peek(i + 24))
  j .L4
.L2:
  ; sci/grid.e16.ts:222  poke(i, peek(i + 24))
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
  ; sci/grid.e16.ts:223  poke16(STATS_COUNT, count - 1)
  addi t0, s2, -1
  sw t0, 5634(zero)
  ; sci/grid.e16.ts:224  if (row > 0 && row >= count - 1) row--
  lw t0, 0x08bc(zero)
  bgeu zero, t0, .L6
  lw t0, 0x08bc(zero)
  addi t1, s2, -1
  bltu t0, t1, .L6
  ; sci/grid.e16.ts:224  row--
  lw t0, 0x08bc(zero)
  addi t0, t0, -1
  sw t0, 0x08bc(zero)
.L6:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/grid.e16.ts:228 clearRows() at -O1
clearRows:
  ; sci/grid.e16.ts:229  poke16(STATS_COUNT, 0)
  sw zero, 5634(zero)
  ; sci/grid.e16.ts:230  row = 0
  sw zero, 0x08bc(zero)
  ; sci/grid.e16.ts:231  firstRow = 0
  sw zero, 0x08c0(zero)
.return:
  ret

; sci/grid.e16.ts:237 gridDraw() at -O1
;   c/x/count in s1
;   y/k in s2
gridDraw:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/grid.e16.ts:238  if (row < firstRow) firstRow = row
  lw t0, 0x08bc(zero)
  lw t1, 0x08c0(zero)
  bgeu t0, t1, .L1
  ; sci/grid.e16.ts:238  firstRow = row
  lw t0, 0x08bc(zero)
  sw t0, 0x08c0(zero)
.L1:
  ; sci/grid.e16.ts:239  if (row >= firstRow + SHOWN_ROWS) firstRow = row - SHOWN_ROWS + 1
  lw t0, 0x08bc(zero)
  lw t1, 0x08c0(zero)
  addi t1, t1, 5
  bltu t0, t1, .L2
  ; sci/grid.e16.ts:239  firstRow = row - SHOWN_ROWS + 1
  lw t0, 0x08bc(zero)
  addi t0, t0, -4
  sw t0, 0x08c0(zero)
.L2:
  ; sci/grid.e16.ts:240  for (let c: u16 = 0; c < gridCols; c++) head(c)
  li s1, 0 ; c/x/count
  j .L5
.L3:
  ; sci/grid.e16.ts:240  head(c)
  mv a0, s1
  call head
  addi s1, s1, 1
.L5:
  lw t0, 0x08ba(zero)
  bltu s1, t0, .L3
  ; sci/grid.e16.ts:241  for (let x: u16 = 0; x < 128; x++) dot(x, 19)
  li s1, 0 ; c/x/count
  j .L9
.L7:
  ; sci/grid.e16.ts:241  dot(x, 19)
  mv a0, s1
  li a1, 19
  call dot
  addi s1, s1, 1
.L9:
  li t0, 128
  bltu s1, t0, .L7
  ; sci/grid.e16.ts:242  for (let c: u16 = 0; c < gridCols; c++) {
  li s1, 0 ; c/x/count
  j .L13
.L11:
  ; sci/grid.e16.ts:243  for (let y: u16 = 10; y < 64; y++) dot(edge(c), y)
  li s2, 10 ; y/k
  j .L17
.L15:
  ; sci/grid.e16.ts:243  dot(edge(c), y)
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
  lw t0, 0x08ba(zero)
  bltu s1, t0, .L11
  ; sci/grid.e16.ts:245  const count = rowsNow()
  call rowsNow
  mv s1, a0 ; c/x/count
  ; sci/grid.e16.ts:246  for (let k: u16 = 0; k < SHOWN_ROWS && firstRow + k < count; k++)
  li s2, 0 ; y/k
  j .L21
.L19:
  ; sci/grid.e16.ts:247  drawRow(firstRow + k, 21 + 9 * k)
  lw t0, 0x08c0(zero)
  add a0, t0, s2
  li t1, 9
  mul t1, t1, s2
  addi a1, t1, 21
  call drawRow
  addi s2, s2, 1
.L21:
  li t0, 5
  bgeu s2, t0, .L23
  lw t0, 0x08c0(zero)
  add t0, t0, s2
  bltu t0, s1, .L19
.L23:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/grid.e16.ts:251 head(c/name) at -O1
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
  ; sci/grid.e16.ts:252  const left = edge(c)
  mv a0, s1
  call edge
  mv s2, a0 ; left/x
  ; sci/grid.e16.ts:253  const right = c + 1 < gridCols ? edge(c + 1) : 128
  lw t0, 0x08ba(zero)
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
  ; sci/grid.e16.ts:254  const name = headOf(c)
  mv a0, s1
  call headOf
  mv s1, a0 ; c/name
  ; sci/grid.e16.ts:255  const width = name === 0x46 ? 24 : 6
  li t0, 70
  bne s1, t0, .L3
  li t0, 24
  j .L4
.L3:
  li t0, 6
.L4:
  mv s0, t0 ; width
  ; sci/grid.e16.ts:256  const x = left + ((right - left - width) >> 1)
  sub t0, s3, s2
  sub t0, t0, s0
  srli t0, t0, 1
  add s2, s2, t0
  ; sci/grid.e16.ts:257  if (name === 0x46) textAt(freqName(), x, lineY(0))
  li t0, 70
  bne s1, t0, .L5
  ; sci/grid.e16.ts:257  textAt(freqName(), x, lineY(0))
  call freqName
  mv a1, s2
  li a2, 11
  call textAt
  j .L6
.L5:
  ; sci/grid.e16.ts:258  glyphAt(name, x, lineY(0))
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

; sci/grid.e16.ts:263 freqName() at -O1
freqName:
  ; sci/grid.e16.ts:264  freqText[0] = 0x46
  li t0, 70
  sb t0, freqText(zero)
  ; sci/grid.e16.ts:265  freqText[1] = 0x52
  li t0, 82
  sb t0, freqText+1(zero)
  ; sci/grid.e16.ts:266  freqText[2] = 0x45
  li t0, 69
  sb t0, freqText+2(zero)
  ; sci/grid.e16.ts:267  freqText[3] = 0x51
  li t0, 81
  sb t0, freqText+3(zero)
  ; sci/grid.e16.ts:268  freqText[4] = 0
  sb zero, freqText+4(zero)
  ; sci/grid.e16.ts:269  return addr(freqText)
  la a0, freqText
.return:
  ret

; sci/grid.e16.ts:273 headOf(c/d) at -O1
;   c/d in s1
headOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c/d
  ; sci/grid.e16.ts:274  if (gridKind === GRID_MAT) return 0x31 + c
  lw t0, 0x08b6(zero)
  li t1, 2
  bne t0, t1, .L1
  ; sci/grid.e16.ts:274  return 0x31 + c
  addi a0, s1, 49
  j .return
.L1:
  ; sci/grid.e16.ts:275  if (gridKind !== GRID_STATS) return 0x61 + c
  lw t0, 0x08b6(zero)
  beq t0, zero, .L2
  ; sci/grid.e16.ts:275  return 0x61 + c
  addi a0, s1, 97
  j .return
.L2:
  ; sci/grid.e16.ts:276  const d = dataColumn(c)
  mv a0, s1
  call dataColumn
  mv s1, a0 ; c/d
  ; sci/grid.e16.ts:277  return d === 0 ? 0x58 : d === 1 ? 0x59 : 0x46
  bne s1, zero, .L3
  li t0, 88
  j .L4
.L3:
  li t0, 1
  bne s1, t0, .L5
  li t0, 89
  j .L6
.L5:
  li t0, 70
.L6:
.L4:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/grid.e16.ts:281 drawRow(r, y) at -O1
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
  ; sci/grid.e16.ts:282  rowNumberAt(r + 1, y)
  addi a0, s3, 1
  mv a1, s2
  call rowNumberAt
  ; sci/grid.e16.ts:283  const filled = gridKind !== GRID_STATS || r < peek16(STATS_COUNT)
  lw t0, 0x08b6(zero)
  sub t0, t0, zero
  snez t0, t0
  mv t1, t0
  bnez t1, .L1
  lw t0, 5634(zero)
  sltu t0, s3, t0
.L1:
  sw t0, 2(sp) ; filled
  ; sci/grid.e16.ts:284  for (let c: u16 = 0; c < gridCols; c++) {
  li s1, 0 ; c
  j .L4
.L2:
  ; sci/grid.e16.ts:285  const right = c + 1 < gridCols ? edge(c + 1) : 128
  lw t0, 0x08ba(zero)
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
  ; sci/grid.e16.ts:286  const chosen = r === row && c === col
  lw t0, 0x08bc(zero)
  sub t0, s3, t0
  seqz t0, t0
  mv t1, t0
  beqz t1, .L8
  lw t0, 0x08be(zero)
  sub t0, s1, t0
  seqz t0, t0
.L8:
  sw t0, 0(sp) ; chosen
  ; sci/grid.e16.ts:287  if (chosen && cellLength > 0) entryText(right, y)
  lw t0, 0(sp) ; chosen
  beqz t0, .L9
  lw t0, 0x08e2(zero)
  bgeu zero, t0, .L9
  ; sci/grid.e16.ts:287  entryText(right, y)
  mv a0, s0
  mv a1, s2
  call entryText
  j .L10
.L9:
  ; sci/grid.e16.ts:288  if (filled) fitNumber(cellAt(r, c), edgeLeft(right), right, y)
  lw t0, 2(sp) ; filled
  beqz t0, .L11
  ; sci/grid.e16.ts:288  fitNumber(cellAt(r, c), edgeLeft(right), right, y)
  mv a0, s3
  mv a1, s1
  call cellAt
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s0
  call edgeLeft
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  mv a2, s0
  mv a3, s2
  call fitNumber
.L11:
.L10:
  ; sci/grid.e16.ts:289  if (chosen) invertBox(edge(c) + 1, y - 1, right - 1, y + 7)
  lw t0, 0(sp) ; chosen
  beqz t0, .L12
  ; sci/grid.e16.ts:289  invertBox(edge(c) + 1, y - 1, right - 1, y + 7)
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
  lw t0, 0x08ba(zero)
  bltu s1, t0, .L2
.return:
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; sci/grid.e16.ts:294 rowNumberAt(n, y) at -O1
;   n in s1
;   y in s3
;   i in s2
rowNumberAt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; n
  mv s3, a1 ; y
  ; sci/grid.e16.ts:295  let i: u16 = 0
  li s2, 0 ; i
  ; sci/grid.e16.ts:296  if (n >= 10) {
  li t0, 10
  bltu s1, t0, .L1
  ; sci/grid.e16.ts:297  cellText[0] = 0x30 + div(n, 10)
  li t1, 52429
  mulhu t0, s1, t1
  srli t0, t0, 3
  addi t0, t0, 48
  sb t0, cellText(zero)
  ; sci/grid.e16.ts:298  i = 1
  li s2, 1 ; i
.L1:
  ; sci/grid.e16.ts:300  cellText[i] = 0x30 + (n % 10)
  li t1, 52429
  mulhu t0, s1, t1
  srli t0, t0, 3
  li t1, 10
  mul t0, t0, t1
  sub t0, s1, t0
  addi t0, t0, 48
  sb t0, cellText(s2)
  ; sci/grid.e16.ts:301  cellText[i + 1] = 0
  sb zero, cellText+1(s2)
  ; sci/grid.e16.ts:302  textAt(addr(cellText), 1, y)
  la a0, cellText
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

; sci/grid.e16.ts:309 fitNumber(v, left/room, right, y) at -O1
;   v in 0(sp)
;   left/room in s2
;   right in s0
;   y in 2(sp)
;   digits in s1
;   length in s3
fitNumber:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw a0, 0(sp) ; v
  mv s2, a1 ; left/room
  mv s0, a2 ; right
  sw a3, 2(sp) ; y
  ; sci/grid.e16.ts:310  const room = div(right - 3 - left, 6)
  addi t0, s0, -3
  sub t0, t0, s2
  li t1, 43691
  mulhu t0, t0, t1
  srli s2, t0, 2
  ; sci/grid.e16.ts:311  let digits = room
  mv s1, s2 ; digits
  ; sci/grid.e16.ts:312  if (digits > 10) digits = 10
  li t0, 10
  bgeu t0, s1, .L1
  ; sci/grid.e16.ts:312  digits = 10
  li s1, 10 ; digits
.L1:
  ; sci/grid.e16.ts:313  let length: u16 = 99
  li s3, 99 ; length
  ; sci/grid.e16.ts:314  while (length > room && digits > 0) {
  j .L4
.L2:
  ; sci/grid.e16.ts:315  poke16(MATH_ARG, digits)
  li t0, 65366
  sw s1, 0(t0)
  ; sci/grid.e16.ts:316  math(M_FORMAT, v, addr(cellText), 0)
  li a0, 57
  lw a1, 0(sp)
  la a2, cellText
  li a3, 0
  call math
  ; sci/grid.e16.ts:317  length = peek16(MATH_ARG)
  li t0, 65366
  lw s3, 0(t0)
  ; sci/grid.e16.ts:318  digits--
  addi s1, s1, -1
.L4:
  bgeu s2, s3, .L6
  bltu zero, s1, .L2
.L6:
  ; sci/grid.e16.ts:320  cellText[length] = 0
  sb zero, cellText(s3)
  ; sci/grid.e16.ts:321  textAt(addr(cellText), right - 1 - length * 6, y)
  slli t1, s3, 2
  slli t0, s3, 1
  add t0, t0, t1
  addi t1, s0, -1
  sub a1, t1, t0
  la a0, cellText
  lw a2, 2(sp)
  call textAt
.return:
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  addi sp, sp, 14
  ret

; sci/grid.e16.ts:325 edgeLeft(right) at -O1
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
  ; sci/grid.e16.ts:326  for (let c: u16 = 0; c < gridCols; c++) {
  li s1, 0 ; c
  j .L3
.L1:
  ; sci/grid.e16.ts:327  const r = c + 1 < gridCols ? edge(c + 1) : 128
  lw t0, 0x08ba(zero)
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
  ; sci/grid.e16.ts:328  if (r === right) return edge(c)
  bne s3, s2, .L7
  ; sci/grid.e16.ts:328  return edge(c)
  mv a0, s1
  call edge
  j .return
.L7:
  addi s1, s1, 1
.L3:
  lw t0, 0x08ba(zero)
  bltu s1, t0, .L1
  ; sci/grid.e16.ts:330  return INDEX_WIDTH
  li a0, 13
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/grid.e16.ts:334 entryText(right, y) at -O1
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
  ; sci/grid.e16.ts:335  let n: u16 = 0
  li s2, 0 ; n
  ; sci/grid.e16.ts:336  for (let i: u16 = 0; i < cellLength && n < 23; i++) n = charsInto(cellEntry[i], n)
  li s1, 0 ; i/room/from
  j .L3
.L1:
  ; sci/grid.e16.ts:336  n = charsInto(cellEntry[i], n)
  lbu a0, cellEntry(s1)
  mv a1, s2
  call charsInto
  mv s2, a0 ; n
  addi s1, s1, 1
.L3:
  lw t0, 0x08e2(zero)
  bgeu s1, t0, .L5
  li t0, 23
  bltu s2, t0, .L1
.L5:
  ; sci/grid.e16.ts:337  const room = div(right - 2 - edgeLeft(right), 6)
  mv a0, s3
  call edgeLeft
  addi t0, s3, -2
  sub t0, t0, a0
  li t1, 43691
  mulhu t0, t0, t1
  srli s1, t0, 2
  ; sci/grid.e16.ts:338  const from = n > room ? n - room : 0
  bgeu s1, s2, .L6
  sub t0, s2, s1
  j .L7
.L6:
  li t0, 0
.L7:
  mv s1, t0 ; i/room/from
  ; sci/grid.e16.ts:339  cellText[n] = 0
  sb zero, cellText(s2)
  ; sci/grid.e16.ts:340  textAt(addr(cellText) + from, right - 1 - (n - from) * 6, y)
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

; sci/grid.e16.ts:343 charsInto(t, n/k) at -O1
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
  ; sci/grid.e16.ts:344  const s = tokenText(t)
  mv a0, s3
  call tokenText
  mv s2, a0 ; s/p
  ; sci/grid.e16.ts:345  if (s === 0) {
  bne s2, zero, .L1
  ; sci/grid.e16.ts:346  cellText[n] = t
  sb s3, cellText(s1)
  ; sci/grid.e16.ts:347  return n + 1
  addi a0, s1, 1
  j .return
.L1:
  ; sci/grid.e16.ts:349  let k = n
  ; sci/grid.e16.ts:350  let p = s
  ; sci/grid.e16.ts:351  while (peek(p) !== 0 && k < 23) {
  j .L4
.L2:
  ; sci/grid.e16.ts:352  cellText[k] = peek(p)
  lbu t0, 0(s2)
  sb t0, cellText(s1)
  ; sci/grid.e16.ts:353  k++
  addi s1, s1, 1
  ; sci/grid.e16.ts:354  p++
  addi s2, s2, 1
.L4:
  lbu t0, 0(s2)
  beq t0, zero, .L6
  li t0, 23
  bltu s1, t0, .L2
.L6:
  ; sci/grid.e16.ts:356  return k
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; sci/matrix.e16.ts:113 mt(k) at -O1
;   k in a0
mt:
  ; sci/matrix.e16.ts:114  return MT + k * 8
  slli t0, a0, 3
  li t1, 13440
  add a0, t1, t0
.return:
  ret

; sci/matrix.e16.ts:126 mRows(v) at -O1
;   v in a0
mRows:
  ; sci/matrix.e16.ts:127  return peek(v)
  lbu a0, 0(a0)
.return:
  ret

; sci/matrix.e16.ts:130 mCols(v) at -O1
;   v in a0
mCols:
  ; sci/matrix.e16.ts:131  return peek(v + 1)
  lbu a0, 1(a0)
.return:
  ret

; sci/matrix.e16.ts:134 isNumber(v) at -O1
;   v in a0
isNumber:
  ; sci/matrix.e16.ts:135  return peek(v) === 0
  lbu t0, 0(a0)
  sub t0, t0, zero
  seqz a0, t0
.return:
  ret

; sci/matrix.e16.ts:139 el(v, r, c) at -O1
;   v in a0
;   r in a1
;   c in a2
el:
  ; sci/matrix.e16.ts:140  return v + 2 + (r * 3 + c) * 8
  slli t1, a1, 1
  add t0, t1, a1
  add t0, t0, a2
  slli t0, t0, 3
  addi t1, a0, 2
  add a0, t1, t0
.return:
  ret

; sci/matrix.e16.ts:143 matrixAt(k) at -O1
;   k in a0
matrixAt:
  ; sci/matrix.e16.ts:144  return MATRICES + k * MATRIX_SIZE
  slli t1, a0, 6
  slli t0, a0, 4
  add t0, t0, t1
  li t1, 10496
  add a0, t1, t0
.return:
  ret

; sci/matrix.e16.ts:147 mcopy(from, to) at -O1
;   from in a0
;   to in a1
;   i in a2
mcopy:
  ; sci/matrix.e16.ts:148  for (let i: u16 = 0; i < MATRIX_SIZE; i += 2) poke16(to + i, peek16(from + i))
  li a2, 0 ; i
  j .L3
.L1:
  ; sci/matrix.e16.ts:148  poke16(to + i, peek16(from + i))
  add t0, a1, a2
  add t1, a0, a2
  lw t1, 0(t1)
  sw t1, 0(t0)
  addi a2, a2, 2
.L3:
  li t0, 80
  bltu a2, t0, .L1
.return:
  ret

; sci/matrix.e16.ts:152 zeros(v, r/i, c) at -O1
;   v in s2
;   r/i in s1
;   c in s3
zeros:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; v
  mv s1, a1 ; r/i
  mv s3, a2 ; c
  ; sci/matrix.e16.ts:153  poke(v, r)
  sb s1, 0(s2)
  ; sci/matrix.e16.ts:154  poke(v + 1, c)
  sb s3, 1(s2)
  ; sci/matrix.e16.ts:155  for (let i: u16 = 0; i < 9; i++) wholeInto(v + 2 + i * 8, 0)
  li s1, 0 ; r/i
  j .L3
.L1:
  ; sci/matrix.e16.ts:155  wholeInto(v + 2 + i * 8, 0)
  slli t0, s1, 3
  addi t1, s2, 2
  add a0, t1, t0
  li a1, 0
  call wholeInto
  addi s1, s1, 1
.L3:
  li t0, 9
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/matrix.e16.ts:158 mpush(at/v) at -O1
;   at/v in s1
mpush:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at/v
  ; sci/matrix.e16.ts:159  if (mDepth >= M_DEPTH) fail(E_STACK, at)
  lw t0, 0x0972(zero)
  li t1, 8
  bltu t0, t1, .L1
  ; sci/matrix.e16.ts:159  fail(E_STACK, at)
  li a0, 3
  mv a1, s1
  call fail
.L1:
  ; sci/matrix.e16.ts:160  const v = MATRIX_STACK + mDepth * MATRIX_SIZE
  lw t0, 0x0972(zero)
  slli t1, t0, 6
  slli t0, t0, 4
  add t0, t0, t1
  li t1, 12800
  add s1, t1, t0
  ; sci/matrix.e16.ts:161  mDepth++
  lw t0, 0x0972(zero)
  addi t0, t0, 1
  sw t0, 0x0972(zero)
  ; sci/matrix.e16.ts:162  zeros(v, 0, 0)
  mv a0, s1
  li a1, 0
  li a2, 0
  call zeros
  ; sci/matrix.e16.ts:163  return v
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/matrix.e16.ts:166 mtop() at -O1
mtop:
  ; sci/matrix.e16.ts:167  return MATRIX_STACK + (mDepth - 1) * MATRIX_SIZE
  lw t0, 0x0972(zero)
  addi t0, t0, -1
  slli t1, t0, 6
  slli t0, t0, 4
  add t0, t0, t1
  li t1, 12800
  add a0, t1, t0
.return:
  ret

; sci/matrix.e16.ts:170 mpop() at -O1
mpop:
  ; sci/matrix.e16.ts:171  mDepth--
  lw t0, 0x0972(zero)
  addi t0, t0, -1
  sw t0, 0x0972(zero)
.return:
  ret

; sci/matrix.e16.ts:180 matEvaluate(from/v/i, length/n) at -O1
;   from/v/i in s1
;   length/n in s2
matEvaluate:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; from/v/i
  mv s2, a1 ; length/n
  ; sci/matrix.e16.ts:181  mFrom = from
  sw s1, 0x096c(zero)
  ; sci/matrix.e16.ts:182  mLength = length
  sw s2, 0x096e(zero)
  ; sci/matrix.e16.ts:183  mPos = 0
  sw zero, 0x0970(zero)
  ; sci/matrix.e16.ts:184  mDepth = 0
  sw zero, 0x0972(zero)
  ; sci/matrix.e16.ts:185  poke16(MATH_ANGLE, peek(KEEP_ANGLE))
  lbu t0, 3074(zero)
  li t1, 65372
  sw t0, 0(t1)
  ; sci/matrix.e16.ts:186  if (length === 0) fail(E_SYNTAX, 0)
  bne s2, zero, .L1
  ; sci/matrix.e16.ts:186  fail(E_SYNTAX, 0)
  li a0, 2
  li a1, 0
  call fail
.L1:
  ; sci/matrix.e16.ts:187  msum()
  call msum
  ; sci/matrix.e16.ts:188  if (mPos < mLength) fail(E_SYNTAX, mPos)
  lw t0, 0x0970(zero)
  lw t1, 0x096e(zero)
  bgeu t0, t1, .L2
  ; sci/matrix.e16.ts:188  fail(E_SYNTAX, mPos)
  lw a1, 0x0970(zero)
  li a0, 2
  call fail
.L2:
  ; sci/matrix.e16.ts:189  const v = mtop()
  call mtop
  mv s1, a0 ; from/v/i
  ; sci/matrix.e16.ts:190  const n = push(0)
  li a0, 0
  call push
  mv s2, a0 ; length/n
  ; sci/matrix.e16.ts:191  matrixAnswer = !isNumber(v)
  mv a0, s1
  call isNumber
  seqz t0, a0
  sw t0, 0x0974(zero)
  ; sci/matrix.e16.ts:192  if (matrixAnswer) {
  beqz t0, .L3
  ; sci/matrix.e16.ts:193  mcopy(v, matrixAt(MAT_ANS))
  mv a0, s1
  li a1, 10816
  call mcopy
  ; sci/matrix.e16.ts:194  for (let i: u16 = 0; i < 36; i += 2) poke16(n + i, peek16(KEEP_ANS + i))
  li s1, 0 ; from/v/i
  j .L6
.L4:
  ; sci/matrix.e16.ts:194  poke16(n + i, peek16(KEEP_ANS + i))
  add t0, s2, s1
  lw t1, 3080(s1)
  sw t1, 0(t0)
  addi s1, s1, 2
.L6:
  li t0, 36
  bltu s1, t0, .L4
  ; sci/matrix.e16.ts:195  openGrid(MAT_ANS)
  li a0, 4
  la t0, openGrid
  li t1, 4
  call far_call
  j .L8
.L3:
  ; sci/matrix.e16.ts:196  copy8(v + 2, n)
  addi a0, s1, 2
  mv a1, s2
  call copy8
.L8:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/matrix.e16.ts:199 mtok() at -O1
mtok:
  ; sci/matrix.e16.ts:200  return mPos < mLength ? peek(mFrom + mPos) : 0
  lw t0, 0x0970(zero)
  lw t1, 0x096e(zero)
  bgeu t0, t1, .L1
  lw t0, 0x096c(zero)
  lw t1, 0x0970(zero)
  add t0, t0, t1
  lbu t0, 0(t0)
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
.return:
  ret

; sci/matrix.e16.ts:203 msum() at -O1
;   t in s1
;   at in s2
msum:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/matrix.e16.ts:204  mprod()
  call mprod
  ; sci/matrix.e16.ts:205  for (;;) {
.L1:
  ; sci/matrix.e16.ts:206  const t = mtok()
  call mtok
  mv s1, a0 ; t
  ; sci/matrix.e16.ts:207  if (t !== T_PLUS && t !== T_MINUS) return
  li t0, 43
  beq s1, t0, .L5
  li t0, 45
  beq s1, t0, .L5
  ; sci/matrix.e16.ts:207  return
  j .return
.L5:
  ; sci/matrix.e16.ts:208  const at = mPos
  lw s2, 0x0970(zero)
  ; sci/matrix.e16.ts:209  mPos++
  lw t0, 0x0970(zero)
  addi t0, t0, 1
  sw t0, 0x0970(zero)
  ; sci/matrix.e16.ts:210  mprod()
  call mprod
  ; sci/matrix.e16.ts:211  mAddSub(t === T_PLUS ? M_ADD : M_SUB, at)
  li t0, 43
  bne s1, t0, .L6
  li t0, 1
  j .L7
.L6:
  li t0, 2
.L7:
  mv a0, t0
  mv a1, s2
  call mAddSub
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/matrix.e16.ts:215 mprod() at -O1
;   t in s1
;   at in s2
mprod:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/matrix.e16.ts:216  mimplied()
  call mimplied
  ; sci/matrix.e16.ts:217  for (;;) {
.L1:
  ; sci/matrix.e16.ts:218  const t = mtok()
  call mtok
  mv s1, a0 ; t
  ; sci/matrix.e16.ts:219  if (t !== T_TIMES && t !== T_DIVIDE) return
  li t0, 129
  beq s1, t0, .L5
  li t0, 130
  beq s1, t0, .L5
  ; sci/matrix.e16.ts:219  return
  j .return
.L5:
  ; sci/matrix.e16.ts:220  const at = mPos
  lw s2, 0x0970(zero)
  ; sci/matrix.e16.ts:221  mPos++
  lw t0, 0x0970(zero)
  addi t0, t0, 1
  sw t0, 0x0970(zero)
  ; sci/matrix.e16.ts:222  mimplied()
  call mimplied
  ; sci/matrix.e16.ts:223  if (t === T_TIMES) mmul(at)
  li t0, 129
  bne s1, t0, .L6
  ; sci/matrix.e16.ts:223  mmul(at)
  mv a0, s2
  call mmul
  j .L1
.L6:
  ; sci/matrix.e16.ts:224  mdiv(at)
  mv a0, s2
  call mdiv
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/matrix.e16.ts:229 mstarts(t) at -O1
;   t in s1
mstarts:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/matrix.e16.ts:230  return (
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
  li t0, 177
  sltu t0, s1, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L12
  li t0, 181
  sltu t0, t0, s1
  xori t0, t0, 1
.L12:
.L4:
  mv t1, t0
  bnez t1, .L3
  mv a0, s1
  call isVariable
  mv t0, a0
.L3:
  mv t1, t0
  bnez t1, .L2
  mv a0, s1
  call isConstant
  mv t0, a0
.L2:
  mv t1, t0
  bnez t1, .L1
  mv a0, s1
  call mfunction
  mv t0, a0
.L1:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/matrix.e16.ts:246 mimplied() at -O1
;   at in s1
mimplied:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/matrix.e16.ts:247  mslash()
  call mslash
  ; sci/matrix.e16.ts:248  while (mstarts(mtok())) {
  j .L3
.L1:
  ; sci/matrix.e16.ts:249  const at = mPos
  lw s1, 0x0970(zero)
  ; sci/matrix.e16.ts:250  mslash()
  call mslash
  ; sci/matrix.e16.ts:251  mmul(at)
  mv a0, s1
  call mmul
.L3:
  call mtok
  call mstarts
  bnez a0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/matrix.e16.ts:255 mslash() at -O1
;   at in s1
mslash:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/matrix.e16.ts:256  munary()
  call munary
  ; sci/matrix.e16.ts:257  while (mtok() === T_SLASH) {
  j .L3
.L1:
  ; sci/matrix.e16.ts:258  const at = mPos
  lw s1, 0x0970(zero)
  ; sci/matrix.e16.ts:259  mPos++
  lw t0, 0x0970(zero)
  addi t0, t0, 1
  sw t0, 0x0970(zero)
  ; sci/matrix.e16.ts:260  munary()
  call munary
  ; sci/matrix.e16.ts:261  mdiv(at)
  mv a0, s1
  call mdiv
.L3:
  call mtok
  li t0, 27
  beq a0, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/matrix.e16.ts:265 munary() at -O1
;   t/at in s1
munary:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/matrix.e16.ts:266  const t = mtok()
  call mtok
  mv s1, a0 ; t/at
  ; sci/matrix.e16.ts:267  if (t === T_NEG || t === T_MINUS) {
  li t0, 16
  beq s1, t0, .L2
  li t0, 45
  bne s1, t0, .L1
.L2:
  ; sci/matrix.e16.ts:268  const at = mPos
  lw s1, 0x0970(zero)
  ; sci/matrix.e16.ts:269  mPos++
  lw t0, 0x0970(zero)
  addi t0, t0, 1
  sw t0, 0x0970(zero)
  ; sci/matrix.e16.ts:270  munary()
  call munary
  ; sci/matrix.e16.ts:271  scale(mtop(), M_NEG, 0, at)
  call mtop
  li a1, 16
  li a2, 0
  mv a3, s1
  call scale
  ; sci/matrix.e16.ts:272  return
  j .return
.L1:
  ; sci/matrix.e16.ts:274  if (t === T_PLUS) {
  li t0, 43
  bne s1, t0, .L3
  ; sci/matrix.e16.ts:275  mPos++
  lw t0, 0x0970(zero)
  addi t0, t0, 1
  sw t0, 0x0970(zero)
  ; sci/matrix.e16.ts:276  munary()
  call munary
  ; sci/matrix.e16.ts:277  return
  j .return
.L3:
  ; sci/matrix.e16.ts:279  mpost()
  call mpost
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/matrix.e16.ts:283 scale(v, op, b, at) at -O1
;   v in s1
;   op in s0
;   b in 0(sp)
;   at in 2(sp)
;   r in 4(sp)
;   c in 6(sp)
;   i in s2
;   j in s3
scale:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  sw s2, 14(sp)
  sw s3, 16(sp)
  mv s1, a0 ; v
  mv s0, a1 ; op
  sw a2, 0(sp) ; b
  sw a3, 2(sp) ; at
  ; sci/matrix.e16.ts:284  const r = isNumber(v) ? 1 : mRows(v)
  mv a0, s1
  call isNumber
  beqz a0, .L1
  li t0, 1
  j .L2
.L1:
  mv a0, s1
  call mRows
  mv t0, a0
.L2:
  sw t0, 4(sp) ; r
  ; sci/matrix.e16.ts:285  const c = isNumber(v) ? 1 : mCols(v)
  mv a0, s1
  call isNumber
  beqz a0, .L3
  li t0, 1
  j .L4
.L3:
  mv a0, s1
  call mCols
  mv t0, a0
.L4:
  sw t0, 6(sp) ; c
  ; sci/matrix.e16.ts:286  for (let i: u16 = 0; i < r; i++) {
  li s2, 0 ; i
  j .L7
.L5:
  ; sci/matrix.e16.ts:287  for (let j: u16 = 0; j < c; j++) math(op, el(v, i, j), b, at)
  li s3, 0 ; j
  j .L11
.L9:
  ; sci/matrix.e16.ts:287  math(op, el(v, i, j), b, at)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call el
  mv a1, a0
  mv a0, s0
  lw a2, 0(sp)
  lw a3, 2(sp)
  call math
  addi s3, s3, 1
.L11:
  lw t0, 6(sp) ; c
  bltu s3, t0, .L9
  addi s2, s2, 1
.L7:
  lw t0, 4(sp) ; r
  bltu s2, t0, .L5
.return:
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  lw s2, 14(sp)
  lw s3, 16(sp)
  addi sp, sp, 18
  ret

; sci/matrix.e16.ts:291 mpost() at -O1
;   t in s1
;   at in s2
mpost:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/matrix.e16.ts:292  mprimary()
  call mprimary
  ; sci/matrix.e16.ts:293  for (;;) {
.L1:
  ; sci/matrix.e16.ts:294  const t = mtok()
  call mtok
  mv s1, a0 ; t
  ; sci/matrix.e16.ts:295  const at = mPos
  lw s2, 0x0970(zero)
  ; sci/matrix.e16.ts:296  if (t === T_POW) {
  li t0, 17
  bne s1, t0, .L5
  ; sci/matrix.e16.ts:297  mPos++
  lw t0, 0x0970(zero)
  addi t0, t0, 1
  sw t0, 0x0970(zero)
  ; sci/matrix.e16.ts:298  msum()
  call msum
  ; sci/matrix.e16.ts:299  if (mtok() === T_CLOSE) mPos++
  call mtok
  li t0, 41
  bne a0, t0, .L6
  ; sci/matrix.e16.ts:299  mPos++
  lw t0, 0x0970(zero)
  addi t0, t0, 1
  sw t0, 0x0970(zero)
.L6:
  ; sci/matrix.e16.ts:300  mpower(at)
  mv a0, s2
  call mpower
  j .L1
.L5:
  ; sci/matrix.e16.ts:301  if (t === T_SQUARE || t === T_CUBE) {
  li t0, 132
  beq s1, t0, .L9
  li t0, 133
  bne s1, t0, .L8
.L9:
  ; sci/matrix.e16.ts:302  mPos++
  lw t0, 0x0970(zero)
  addi t0, t0, 1
  sw t0, 0x0970(zero)
  ; sci/matrix.e16.ts:303  wholeInto(mpush(at) + 2, t === T_SQUARE ? 2 : 3)
  mv a0, s2
  call mpush
  addi t0, a0, 2
  mv t1, s1
  li t2, 132
  bne t1, t2, .L10
  li t1, 2
  j .L11
.L10:
  li t1, 3
.L11:
  mv a0, t0
  mv a1, t1
  call wholeInto
  ; sci/matrix.e16.ts:304  mpower(at)
  mv a0, s2
  call mpower
  j .L1
.L8:
  ; sci/matrix.e16.ts:305  if (t === T_INVERSE) {
  li t0, 134
  bne s1, t0, .L13
  ; sci/matrix.e16.ts:306  mPos++
  lw t0, 0x0970(zero)
  addi t0, t0, 1
  sw t0, 0x0970(zero)
  ; sci/matrix.e16.ts:307  mInverse(mtop(), at)
  call mtop
  mv a1, s2
  call mInverse
  j .L1
.L13:
  ; sci/matrix.e16.ts:308  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/matrix.e16.ts:312 mprimary() at -O1
;   t in s1
;   at in s2
mprimary:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/matrix.e16.ts:313  const t = mtok()
  call mtok
  mv s1, a0 ; t
  ; sci/matrix.e16.ts:314  const at = mPos
  lw s2, 0x0970(zero)
  ; sci/matrix.e16.ts:315  if (isDigit(t) || t === T_POINT || t === T_EXP) {
  mv a0, s1
  call isDigit
  bnez a0, .L2
  li t0, 46
  beq s1, t0, .L2
  li t0, 135
  bne s1, t0, .L1
.L2:
  ; sci/matrix.e16.ts:316  mnumber()
  call mnumber
  ; sci/matrix.e16.ts:317  return
  j .return
.L1:
  ; sci/matrix.e16.ts:319  if (t === 0) fail(E_SYNTAX, at)
  bne s1, zero, .L3
  ; sci/matrix.e16.ts:319  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s2
  call fail
.L3:
  ; sci/matrix.e16.ts:320  mPos++
  lw t0, 0x0970(zero)
  addi t0, t0, 1
  sw t0, 0x0970(zero)
  ; sci/matrix.e16.ts:321  if (!mvalue(t, mpush(at), at)) {
  mv a0, s2
  call mpush
  mv a1, a0
  mv a0, s1
  mv a2, s2
  call mvalue
  bnez a0, .L4
  ; sci/matrix.e16.ts:322  mpop()
  call mpop
  ; sci/matrix.e16.ts:323  mbracketed(t, at)
  mv a0, s1
  mv a1, s2
  call mbracketed
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/matrix.e16.ts:328 mvalue(t/m, v, at) at -O1
;   t/m in s1
;   v in s2
;   at in s3
mvalue:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; t/m
  mv s2, a1 ; v
  mv s3, a2 ; at
  ; sci/matrix.e16.ts:329  if (t >= T_MAT && t <= T_MAT_ANS) {
  li t0, 177
  bltu s1, t0, .L1
  li t0, 181
  bltu t0, s1, .L1
  ; sci/matrix.e16.ts:330  const m = matrixAt(t - T_MAT)
  addi a0, s1, -177
  call matrixAt
  mv s1, a0 ; t/m
  ; sci/matrix.e16.ts:331  if (mRows(m) === 0) fail(E_DIM, at)
  mv a0, s1
  call mRows
  bne a0, zero, .L2
  ; sci/matrix.e16.ts:331  fail(E_DIM, at)
  li a0, 6
  mv a1, s3
  call fail
.L2:
  ; sci/matrix.e16.ts:332  mcopy(m, v)
  mv a0, s1
  mv a1, s2
  call mcopy
  j .L3
.L1:
  ; sci/matrix.e16.ts:333  if (t === T_ANS) {
  li t0, 20
  bne s1, t0, .L4
  ; sci/matrix.e16.ts:334  if (matrixAnswer) mcopy(matrixAt(MAT_ANS), v)
  lw t0, 0x0974(zero)
  beqz t0, .L5
  ; sci/matrix.e16.ts:334  mcopy(matrixAt(MAT_ANS), v)
  li a0, 10816
  mv a1, s2
  call mcopy
  j .L7
.L5:
  ; sci/matrix.e16.ts:335  copy8(KEEP_ANS, v + 2)
  li a0, 3080
  addi a1, s2, 2
  call copy8
  j .L7
.L4:
  ; sci/matrix.e16.ts:336  if (t === T_PI) math(M_PI, v + 2, 0, at)
  li t0, 128
  bne s1, t0, .L8
  ; sci/matrix.e16.ts:336  math(M_PI, v + 2, 0, at)
  li a0, 32
  addi a1, s2, 2
  li a2, 0
  mv a3, s3
  call math
  j .L9
.L8:
  ; sci/matrix.e16.ts:337  if (t === T_E) {
  li t0, 101
  bne s1, t0, .L10
  ; sci/matrix.e16.ts:338  wholeInto(v + 2, 1)
  addi a0, s2, 2
  li a1, 1
  call wholeInto
  ; sci/matrix.e16.ts:339  math(M_EXP, v + 2, 0, at)
  li a0, 30
  addi a1, s2, 2
  li a2, 0
  mv a3, s3
  call math
  j .L11
.L10:
  ; sci/matrix.e16.ts:340  if (t === T_TEN) wholeInto(v + 2, 10)
  li t0, 21
  bne s1, t0, .L12
  ; sci/matrix.e16.ts:340  wholeInto(v + 2, 10)
  addi a0, s2, 2
  li a1, 10
  call wholeInto
  j .L13
.L12:
  ; sci/matrix.e16.ts:341  if (isVariable(t)) copy8(varAt(t), v + 2)
  mv a0, s1
  call isVariable
  beqz a0, .L14
  ; sci/matrix.e16.ts:341  copy8(varAt(t), v + 2)
  mv a0, s1
  call varAt
  addi a1, s2, 2
  call copy8
  j .L15
.L14:
  ; sci/matrix.e16.ts:342  if (isConstant(t)) constValue(t, v + 2)
  mv a0, s1
  call isConstant
  beqz a0, .L16
  ; sci/matrix.e16.ts:342  constValue(t, v + 2)
  mv a0, s1
  addi a1, s2, 2
  la t0, constValue
  li t1, 10
  call far_call
  j .L17
.L16:
  ; sci/matrix.e16.ts:343  return false
  li a0, 0
  j .return
.L17:
.L15:
.L13:
.L11:
.L9:
.L7:
.L3:
  ; sci/matrix.e16.ts:344  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/matrix.e16.ts:347 mbracketed(t, at) at -O1
;   t in s1
;   at in s2
;   two in s3
mbracketed:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; t
  mv s2, a1 ; at
  ; sci/matrix.e16.ts:348  if (t !== T_OPEN && !mfunction(t)) fail(E_SYNTAX, at)
  li t0, 40
  beq s1, t0, .L1
  mv a0, s1
  call mfunction
  bnez a0, .L1
  ; sci/matrix.e16.ts:348  fail(E_SYNTAX, at)
  li a0, 2
  mv a1, s2
  call fail
.L1:
  ; sci/matrix.e16.ts:349  msum()
  call msum
  ; sci/matrix.e16.ts:350  const two = t === T_DOT || t === T_CROSS || t === T_ANGLE
  li t0, 169
  sub t0, s1, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L3
  li t0, 170
  sub t0, s1, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 171
  sub t0, s1, t0
  seqz t0, t0
.L2:
  mv s3, t0 ; two
  ; sci/matrix.e16.ts:351  if (two) {
  beqz s3, .L4
  ; sci/matrix.e16.ts:352  if (mtok() !== T_COMMA) fail(E_SYNTAX, mPos)
  call mtok
  li t0, 44
  beq a0, t0, .L5
  ; sci/matrix.e16.ts:352  fail(E_SYNTAX, mPos)
  lw a1, 0x0970(zero)
  li a0, 2
  call fail
.L5:
  ; sci/matrix.e16.ts:353  mPos++
  lw t0, 0x0970(zero)
  addi t0, t0, 1
  sw t0, 0x0970(zero)
  ; sci/matrix.e16.ts:354  msum()
  call msum
.L4:
  ; sci/matrix.e16.ts:356  if (mtok() === T_CLOSE) mPos++
  call mtok
  li t0, 41
  bne a0, t0, .L6
  ; sci/matrix.e16.ts:356  mPos++
  lw t0, 0x0970(zero)
  addi t0, t0, 1
  sw t0, 0x0970(zero)
.L6:
  ; sci/matrix.e16.ts:357  if (two) twoVectors(t, at)
  beqz s3, .L7
  ; sci/matrix.e16.ts:357  twoVectors(t, at)
  mv a0, s1
  mv a1, s2
  call twoVectors
  j .L8
.L7:
  ; sci/matrix.e16.ts:358  if (t !== T_OPEN) mapply(t, at)
  li t0, 40
  beq s1, t0, .L9
  ; sci/matrix.e16.ts:358  mapply(t, at)
  mv a0, s1
  mv a1, s2
  call mapply
.L9:
.L8:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/matrix.e16.ts:362 mfunction(t) at -O1
;   t in s1
mfunction:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; sci/matrix.e16.ts:363  return (t >= T_DET && t <= T_ANGLE) || t === T_ABS || mrealOp(t) !== 0
  li t0, 167
  sltu t0, s1, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L3
  li t0, 171
  sltu t0, t0, s1
  xori t0, t0, 1
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 230
  sub t0, s1, t0
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  mv a0, s1
  call mrealOp
  sub t0, a0, zero
  snez t0, t0
.L1:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/matrix.e16.ts:366 mrealOp(t) at -O1
;   t in a0
mrealOp:
  ; sci/matrix.e16.ts:367  switch (t) {
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
  ; sci/matrix.e16.ts:369  return M_SIN
  li a0, 22
  ret
.L3:
  ; sci/matrix.e16.ts:371  return M_COS
  li a0, 23
  ret
.L4:
  ; sci/matrix.e16.ts:373  return M_TAN
  li a0, 24
  ret
.L5:
  ; sci/matrix.e16.ts:375  return M_ASN
  li a0, 25
  ret
.L6:
  ; sci/matrix.e16.ts:377  return M_ACS
  li a0, 26
  ret
.L7:
  ; sci/matrix.e16.ts:379  return M_ATN
  li a0, 27
  ret
.L8:
  ; sci/matrix.e16.ts:381  return M_LOG
  li a0, 29
  ret
.L9:
  ; sci/matrix.e16.ts:383  return M_LN
  li a0, 28
  ret
.L1:
  ; sci/matrix.e16.ts:385  return t === T_SQRT ? M_SQR : 0
  li t0, 9
  bne a0, t0, .L10
  li t0, 21
  j .L11
.L10:
  li t0, 0
.L11:
  mv a0, t0
.return:
  ret

; sci/matrix.e16.ts:389 mapply(t, at) at -O1
;   t in s3
;   at in s2
;   v in s1
mapply:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  mv s3, a0 ; t
  mv s2, a1 ; at
  ; sci/matrix.e16.ts:390  const v = mtop()
  call mtop
  mv s1, a0 ; v
  ; sci/matrix.e16.ts:391  if (t === T_DET) {
  li t0, 167
  bne s3, t0, .L1
  ; sci/matrix.e16.ts:392  square(v, at)
  mv a0, s1
  mv a1, s2
  call square
  ; sci/matrix.e16.ts:393  determinant(v, mt(0), at)
  mv a0, s1
  li a1, 13440
  mv a2, s2
  call determinant
  ; sci/matrix.e16.ts:394  zeros(v, 0, 0)
  mv a0, s1
  li a1, 0
  li a2, 0
  call zeros
  ; sci/matrix.e16.ts:395  copy8(mt(0), v + 2)
  li a0, 13440
  addi a1, s1, 2
  call copy8
  j .L2
.L1:
  ; sci/matrix.e16.ts:396  if (t === T_TRN) transpose(v, at)
  li t0, 168
  bne s3, t0, .L3
  ; sci/matrix.e16.ts:396  transpose(v, at)
  mv a0, s1
  mv a1, s2
  call transpose
  j .L4
.L3:
  ; sci/matrix.e16.ts:397  if (t === T_ABS) {
  li t0, 230
  bne s3, t0, .L5
  ; sci/matrix.e16.ts:398  if (isNumber(v)) math(M_ABS, v + 2, 0, at)
  mv a0, s1
  call isNumber
  beqz a0, .L6
  ; sci/matrix.e16.ts:398  math(M_ABS, v + 2, 0, at)
  li a0, 17
  addi a1, s1, 2
  li a2, 0
  mv a3, s2
  call math
  j .L8
.L6:
  ; sci/matrix.e16.ts:400  vectorLength(v, mt(0), at)
  mv a0, s1
  li a1, 13440
  mv a2, s2
  call vectorLength
  ; sci/matrix.e16.ts:401  zeros(v, 0, 0)
  mv a0, s1
  li a1, 0
  li a2, 0
  call zeros
  ; sci/matrix.e16.ts:402  copy8(mt(0), v + 2)
  li a0, 13440
  addi a1, s1, 2
  call copy8
  j .L8
.L5:
  ; sci/matrix.e16.ts:405  if (!isNumber(v)) fail(E_DIM, at)
  mv a0, s1
  call isNumber
  bnez a0, .L9
  ; sci/matrix.e16.ts:405  fail(E_DIM, at)
  li a0, 6
  mv a1, s2
  call fail
.L9:
  ; sci/matrix.e16.ts:406  math(mrealOp(t), v + 2, 0, at)
  mv a0, s3
  call mrealOp
  addi a1, s1, 2
  li a2, 0
  mv a3, s2
  call math
.L8:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/matrix.e16.ts:413 mAddSub(op, at) at -O1
;   op in 2(sp)
;   at in 0(sp)
;   b in s0
;   a in s1
;   r in 4(sp)
;   c in 6(sp)
;   i in s2
;   j in s3
mAddSub:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s0, 10(sp)
  sw s1, 12(sp)
  sw s2, 14(sp)
  sw s3, 16(sp)
  sw a0, 2(sp) ; op
  sw a1, 0(sp) ; at
  ; sci/matrix.e16.ts:414  const b = mtop()
  call mtop
  mv s0, a0 ; b
  ; sci/matrix.e16.ts:415  const a = b - MATRIX_SIZE
  addi s1, s0, -80
  ; sci/matrix.e16.ts:416  if (mRows(a) !== mRows(b) || mCols(a) !== mCols(b)) fail(E_DIM, at)
  mv a0, s1
  call mRows
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s0
  call mRows
  lw t0, 0(sp)
  addi sp, sp, 2
  bne t0, a0, .L2
  mv a0, s1
  call mCols
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s0
  call mCols
  lw t0, 0(sp)
  addi sp, sp, 2
  beq t0, a0, .L1
.L2:
  ; sci/matrix.e16.ts:416  fail(E_DIM, at)
  li a0, 6
  lw a1, 0(sp)
  call fail
.L1:
  ; sci/matrix.e16.ts:417  const r = isNumber(a) ? 1 : mRows(a)
  mv a0, s1
  call isNumber
  beqz a0, .L3
  li t0, 1
  j .L4
.L3:
  mv a0, s1
  call mRows
  mv t0, a0
.L4:
  sw t0, 4(sp) ; r
  ; sci/matrix.e16.ts:418  const c = isNumber(a) ? 1 : mCols(a)
  mv a0, s1
  call isNumber
  beqz a0, .L5
  li t0, 1
  j .L6
.L5:
  mv a0, s1
  call mCols
  mv t0, a0
.L6:
  sw t0, 6(sp) ; c
  ; sci/matrix.e16.ts:419  for (let i: u16 = 0; i < r; i++) {
  li s2, 0 ; i
  j .L9
.L7:
  ; sci/matrix.e16.ts:420  for (let j: u16 = 0; j < c; j++) math(op, el(a, i, j), el(b, i, j), at)
  li s3, 0 ; j
  j .L13
.L11:
  ; sci/matrix.e16.ts:420  math(op, el(a, i, j), el(b, i, j), at)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call el
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s0
  mv a1, s2
  mv a2, s3
  call el
  lw a1, 0(sp)
  addi sp, sp, 2
  mv a2, a0
  lw a0, 2(sp)
  lw a3, 0(sp)
  call math
  addi s3, s3, 1
.L13:
  lw t0, 6(sp) ; c
  bltu s3, t0, .L11
  addi s2, s2, 1
.L9:
  lw t0, 4(sp) ; r
  bltu s2, t0, .L7
  ; sci/matrix.e16.ts:422  mpop()
  call mpop
.return:
  lw ra, 8(sp)
  lw s0, 10(sp)
  lw s1, 12(sp)
  lw s2, 14(sp)
  lw s3, 16(sp)
  addi sp, sp, 18
  ret

; sci/matrix.e16.ts:426 mmul(at) at -O1
;   at in s3
;   b in s2
;   a in s1
mmul:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  mv s3, a0 ; at
  ; sci/matrix.e16.ts:427  const b = mtop()
  call mtop
  mv s2, a0 ; b
  ; sci/matrix.e16.ts:428  const a = b - MATRIX_SIZE
  addi s1, s2, -80
  ; sci/matrix.e16.ts:429  if (isNumber(b)) scale(a, M_MUL, b + 2, at)
  mv a0, s2
  call isNumber
  beqz a0, .L1
  ; sci/matrix.e16.ts:429  scale(a, M_MUL, b + 2, at)
  mv a0, s1
  li a1, 3
  addi a2, s2, 2
  mv a3, s3
  call scale
  j .L2
.L1:
  ; sci/matrix.e16.ts:430  if (isNumber(a)) {
  mv a0, s1
  call isNumber
  beqz a0, .L3
  ; sci/matrix.e16.ts:431  copy8(a + 2, mt(0))
  addi a0, s1, 2
  li a1, 13440
  call copy8
  ; sci/matrix.e16.ts:432  mcopy(b, a)
  mv a0, s2
  mv a1, s1
  call mcopy
  ; sci/matrix.e16.ts:433  scale(a, M_MUL, mt(0), at)
  mv a0, s1
  li a1, 3
  li a2, 13440
  mv a3, s3
  call scale
  j .L4
.L3:
  ; sci/matrix.e16.ts:434  product(a, b, at)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call product
.L4:
.L2:
  ; sci/matrix.e16.ts:435  mpop()
  call mpop
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/matrix.e16.ts:439 product(a, b, at) at -O1
;   a in s1
;   b in 0(sp)
;   at in 2(sp)
;   n in 6(sp)
;   out in 4(sp)
;   i in s2
;   j in s3
;   s in 8(sp)
;   k in s0
product:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s1, 12(sp)
  sw s2, 14(sp)
  sw s3, 16(sp)
  sw s0, 18(sp)
  mv s1, a0 ; a
  sw a1, 0(sp) ; b
  sw a2, 2(sp) ; at
  ; sci/matrix.e16.ts:440  const n = mCols(a)
  mv a0, s1
  call mCols
  sw a0, 6(sp) ; n
  ; sci/matrix.e16.ts:441  if (n !== mRows(b)) fail(E_DIM, at)
  lw a0, 0(sp)
  call mRows
  lw t0, 6(sp) ; n
  beq t0, a0, .L1
  ; sci/matrix.e16.ts:441  fail(E_DIM, at)
  li a0, 6
  lw a1, 2(sp)
  call fail
.L1:
  ; sci/matrix.e16.ts:442  const out = mpush(at)
  lw a0, 2(sp)
  call mpush
  sw a0, 4(sp) ; out
  ; sci/matrix.e16.ts:443  poke(out, mRows(a))
  mv a0, s1
  call mRows
  lw t0, 4(sp) ; out
  sb a0, 0(t0)
  ; sci/matrix.e16.ts:444  poke(out + 1, mCols(b))
  lw t0, 4(sp) ; out
  addi t0, t0, 1
  addi sp, sp, -2
  sw t0, 0(sp)
  lw a0, 2(sp)
  call mCols
  lw t0, 0(sp)
  addi sp, sp, 2
  sb a0, 0(t0)
  ; sci/matrix.e16.ts:445  for (let i: u16 = 0; i < mRows(a); i++) {
  li s2, 0 ; i
  j .L4
.L2:
  ; sci/matrix.e16.ts:446  for (let j: u16 = 0; j < mCols(b); j++) {
  li s3, 0 ; j
  j .L8
.L6:
  ; sci/matrix.e16.ts:447  const s = el(out, i, j)
  lw a0, 4(sp)
  mv a1, s2
  mv a2, s3
  call el
  sw a0, 8(sp) ; s
  ; sci/matrix.e16.ts:448  for (let k: u16 = 0; k < n; k++) {
  li s0, 0 ; k
  j .L12
.L10:
  ; sci/matrix.e16.ts:449  copy8(el(a, i, k), mt(1))
  mv a0, s1
  mv a1, s2
  mv a2, s0
  call el
  li a1, 13448
  call copy8
  ; sci/matrix.e16.ts:450  math(M_MUL, mt(1), el(b, k, j), at)
  lw a0, 0(sp)
  mv a1, s0
  mv a2, s3
  call el
  li a1, 13448
  mv a2, a0
  li a0, 3
  lw a3, 2(sp)
  call math
  ; sci/matrix.e16.ts:451  math(M_ADD, s, mt(1), at)
  li a0, 1
  lw a1, 8(sp)
  li a2, 13448
  lw a3, 2(sp)
  call math
  addi s0, s0, 1
.L12:
  lw t0, 6(sp) ; n
  bltu s0, t0, .L10
  addi s3, s3, 1
.L8:
  lw a0, 0(sp)
  call mCols
  bltu s3, a0, .L6
  addi s2, s2, 1
.L4:
  mv a0, s1
  call mRows
  bltu s2, a0, .L2
  ; sci/matrix.e16.ts:455  mcopy(out, a)
  lw a0, 4(sp)
  mv a1, s1
  call mcopy
  ; sci/matrix.e16.ts:456  mpop()
  call mpop
.return:
  lw ra, 10(sp)
  lw s1, 12(sp)
  lw s2, 14(sp)
  lw s3, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; sci/matrix.e16.ts:460 mdiv(at) at -O1
;   at in s2
;   b in s1
mdiv:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; at
  ; sci/matrix.e16.ts:461  const b = mtop()
  call mtop
  mv s1, a0 ; b
  ; sci/matrix.e16.ts:462  if (!isNumber(b)) fail(E_DIM, at)
  mv a0, s1
  call isNumber
  bnez a0, .L1
  ; sci/matrix.e16.ts:462  fail(E_DIM, at)
  li a0, 6
  mv a1, s2
  call fail
.L1:
  ; sci/matrix.e16.ts:463  scale(b - MATRIX_SIZE, M_DIV, b + 2, at)
  addi a0, s1, -80
  li a1, 4
  addi a2, s1, 2
  mv a3, s2
  call scale
  ; sci/matrix.e16.ts:464  mpop()
  call mpop
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sci/matrix.e16.ts:468 square(v, at) at -O1
;   v in s1
;   at in s2
square:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; v
  mv s2, a1 ; at
  ; sci/matrix.e16.ts:469  if (isNumber(v) || mRows(v) !== mCols(v)) fail(E_DIM, at)
  mv a0, s1
  call isNumber
  bnez a0, .L2
  mv a0, s1
  call mRows
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  call mCols
  lw t0, 0(sp)
  addi sp, sp, 2
  beq t0, a0, .L1
.L2:
  ; sci/matrix.e16.ts:469  fail(E_DIM, at)
  li a0, 6
  mv a1, s2
  call fail
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/matrix.e16.ts:476 mpower(at) at -O1
;   at in s1
;   w in s2
;   v in s3
;   n in s0
;   k in 0(sp)
mpower:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s0, 10(sp)
  mv s1, a0 ; at
  ; sci/matrix.e16.ts:477  const w = mtop()
  call mtop
  mv s2, a0 ; w
  ; sci/matrix.e16.ts:478  const v = w - MATRIX_SIZE
  addi s3, s2, -80
  ; sci/matrix.e16.ts:479  if (!isNumber(w)) fail(E_DIM, at)
  mv a0, s2
  call isNumber
  bnez a0, .L1
  ; sci/matrix.e16.ts:479  fail(E_DIM, at)
  li a0, 6
  mv a1, s1
  call fail
.L1:
  ; sci/matrix.e16.ts:480  if (isNumber(v)) {
  mv a0, s3
  call isNumber
  beqz a0, .L2
  ; sci/matrix.e16.ts:481  math(M_POW, v + 2, w + 2, at)
  li a0, 5
  addi a1, s3, 2
  addi a2, s2, 2
  mv a3, s1
  call math
  ; sci/matrix.e16.ts:482  mpop()
  call mpop
  ; sci/matrix.e16.ts:483  return
  j .return
.L2:
  ; sci/matrix.e16.ts:485  square(v, at)
  mv a0, s3
  mv a1, s1
  call square
  ; sci/matrix.e16.ts:486  copy8(w + 2, mt(0))
  addi a0, s2, 2
  li a1, 13440
  call copy8
  ; sci/matrix.e16.ts:487  math(M_FRAC, mt(0), 0, at)
  li a0, 19
  li a1, 13440
  li a2, 0
  mv a3, s1
  call math
  ; sci/matrix.e16.ts:488  if (!isZero(mt(0))) fail(E_MATH, at)
  li a0, 13440
  call isZero
  bnez a0, .L3
  ; sci/matrix.e16.ts:488  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L3:
  ; sci/matrix.e16.ts:489  copy8(w + 2, mt(0))
  addi a0, s2, 2
  li a1, 13440
  call copy8
  ; sci/matrix.e16.ts:490  math(M_TOINT, mt(0), 0, at)
  li a0, 49
  li a1, 13440
  li a2, 0
  mv a3, s1
  call math
  ; sci/matrix.e16.ts:491  let n = i16(peek16(MATH_ARG))
  li t0, 65366
  lw s0, 0(t0)
  ; sci/matrix.e16.ts:492  if (n < -9 || n > 9) fail(E_MATH, at)
  li t0, 65527
  blt s0, t0, .L5
  li t0, 9
  bge t0, s0, .L4
.L5:
  ; sci/matrix.e16.ts:492  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L4:
  ; sci/matrix.e16.ts:493  if (n < 0) {
  bge s0, zero, .L6
  ; sci/matrix.e16.ts:494  mInverse(v, at)
  mv a0, s3
  mv a1, s1
  call mInverse
  ; sci/matrix.e16.ts:495  n = -n
  neg s0, s0
.L6:
  ; sci/matrix.e16.ts:498  mcopy(v, w)
  mv a0, s3
  mv a1, s2
  call mcopy
  ; sci/matrix.e16.ts:499  identity(v)
  mv a0, s3
  call identity
  ; sci/matrix.e16.ts:500  for (let k: i16 = 0; k < n; k++) product(v, w, at)
  sw zero, 0(sp) ; k
  j .L9
.L7:
  ; sci/matrix.e16.ts:500  product(v, w, at)
  mv a0, s3
  mv a1, s2
  mv a2, s1
  call product
  lw t0, 0(sp) ; k
  addi t0, t0, 1
  sw t0, 0(sp) ; k
.L9:
  lw t0, 0(sp) ; k
  blt t0, s0, .L7
  ; sci/matrix.e16.ts:501  mpop()
  call mpop
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s0, 10(sp)
  addi sp, sp, 12
  ret

; sci/matrix.e16.ts:505 identity(v) at -O1
;   v in s2
;   n in s3
;   i in s1
identity:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; v
  ; sci/matrix.e16.ts:506  const n = mRows(v)
  mv a0, s2
  call mRows
  mv s3, a0 ; n
  ; sci/matrix.e16.ts:507  zeros(v, n, n)
  mv a0, s2
  mv a1, s3
  mv a2, s3
  call zeros
  ; sci/matrix.e16.ts:508  for (let i: u16 = 0; i < n; i++) wholeInto(el(v, i, i), 1)
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/matrix.e16.ts:508  wholeInto(el(v, i, i), 1)
  mv a0, s2
  mv a1, s1
  mv a2, s1
  call el
  li a1, 1
  call wholeInto
  addi s1, s1, 1
.L3:
  bltu s1, s3, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sci/matrix.e16.ts:512 transpose(v, at/t) at -O1
;   v in s1
;   at/t in s2
;   i in s3
;   j in s0
transpose:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; v
  mv s2, a1 ; at/t
  ; sci/matrix.e16.ts:513  if (isNumber(v)) return
  mv a0, s1
  call isNumber
  beqz a0, .L1
  ; sci/matrix.e16.ts:513  return
  j .return
.L1:
  ; sci/matrix.e16.ts:514  const t = mpush(at)
  mv a0, s2
  call mpush
  mv s2, a0 ; at/t
  ; sci/matrix.e16.ts:515  poke(t, mCols(v))
  mv a0, s1
  call mCols
  sb a0, 0(s2)
  ; sci/matrix.e16.ts:516  poke(t + 1, mRows(v))
  mv a0, s1
  call mRows
  sb a0, 1(s2)
  ; sci/matrix.e16.ts:517  for (let i: u16 = 0; i < mRows(v); i++) {
  li s3, 0 ; i
  j .L4
.L2:
  ; sci/matrix.e16.ts:518  for (let j: u16 = 0; j < mCols(v); j++) copy8(el(v, i, j), el(t, j, i))
  li s0, 0 ; j
  j .L8
.L6:
  ; sci/matrix.e16.ts:518  copy8(el(v, i, j), el(t, j, i))
  mv a0, s1
  mv a1, s3
  mv a2, s0
  call el
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  mv a1, s0
  mv a2, s3
  call el
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  addi s0, s0, 1
.L8:
  mv a0, s1
  call mCols
  bltu s0, a0, .L6
  addi s3, s3, 1
.L4:
  mv a0, s1
  call mRows
  bltu s3, a0, .L2
  ; sci/matrix.e16.ts:520  mcopy(t, v)
  mv a0, s2
  mv a1, s1
  call mcopy
  ; sci/matrix.e16.ts:521  mpop()
  call mpop
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/matrix.e16.ts:528 determinant(v, out, at) at -O1
;   v in s2
;   out in s3
;   at in s0
;   n/j in s1
determinant:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; v
  mv s3, a1 ; out
  mv s0, a2 ; at
  ; sci/matrix.e16.ts:529  mAt = at
  sw s0, 0x0976(zero)
  ; sci/matrix.e16.ts:530  const n = mRows(v)
  mv a0, s2
  call mRows
  mv s1, a0 ; n/j
  ; sci/matrix.e16.ts:531  if (n === 1) copy8(el(v, 0, 0), out)
  li t0, 1
  bne s1, t0, .L1
  ; sci/matrix.e16.ts:531  copy8(el(v, 0, 0), out)
  mv a0, s2
  li a1, 0
  li a2, 0
  call el
  mv a1, s3
  call copy8
  j .L2
.L1:
  ; sci/matrix.e16.ts:532  if (n === 2) minor2(v, 0x01, 0x01, out)
  li t0, 2
  bne s1, t0, .L3
  ; sci/matrix.e16.ts:532  minor2(v, 0x01, 0x01, out)
  mv a0, s2
  li a1, 1
  li a2, 1
  mv a3, s3
  call minor2
  j .L4
.L3:
  ; sci/matrix.e16.ts:534  wholeInto(out, 0)
  mv a0, s3
  li a1, 0
  call wholeInto
  ; sci/matrix.e16.ts:535  for (let j: u16 = 0; j < 3; j++) {
  li s1, 0 ; n/j
  j .L7
.L5:
  ; sci/matrix.e16.ts:536  cofactor(v, 0, j, mt(2))
  mv a0, s2
  li a1, 0
  mv a2, s1
  li a3, 13456
  call cofactor
  ; sci/matrix.e16.ts:537  math(M_MUL, mt(2), el(v, 0, j), at)
  mv a0, s2
  li a1, 0
  mv a2, s1
  call el
  li a1, 13456
  mv a2, a0
  li a0, 3
  mv a3, s0
  call math
  ; sci/matrix.e16.ts:538  math(M_ADD, out, mt(2), at)
  li a0, 1
  mv a1, s3
  li a2, 13456
  mv a3, s0
  call math
  addi s1, s1, 1
.L7:
  li t0, 3
  bltu s1, t0, .L5
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/matrix.e16.ts:544 minor2(v, rows/r1, cols/c1, out) at -O1
;   v in s3
;   rows/r1 in s1
;   cols/c1 in s2
;   out in s0
;   r0 in 2(sp)
;   c0 in 4(sp)
;   at in 0(sp)
minor2:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s0, 14(sp)
  mv s3, a0 ; v
  mv s1, a1 ; rows/r1
  mv s2, a2 ; cols/c1
  mv s0, a3 ; out
  ; sci/matrix.e16.ts:545  const r0 = rows >> 4
  srli t0, s1, 4
  sw t0, 2(sp) ; r0
  ; sci/matrix.e16.ts:546  const r1 = rows & 15
  andi s1, s1, 15
  ; sci/matrix.e16.ts:547  const c0 = cols >> 4
  srli t0, s2, 4
  sw t0, 4(sp) ; c0
  ; sci/matrix.e16.ts:548  const c1 = cols & 15
  andi s2, s2, 15
  ; sci/matrix.e16.ts:549  const at = mAt
  lw t0, 0x0976(zero)
  sw t0, 0(sp) ; at
  ; sci/matrix.e16.ts:550  copy8(el(v, r0, c0), out)
  mv a0, s3
  lw a1, 2(sp)
  lw a2, 4(sp)
  call el
  mv a1, s0
  call copy8
  ; sci/matrix.e16.ts:551  math(M_MUL, out, el(v, r1, c1), at)
  mv a0, s3
  mv a1, s1
  mv a2, s2
  call el
  mv a1, s0
  mv a2, a0
  li a0, 3
  lw a3, 0(sp)
  call math
  ; sci/matrix.e16.ts:552  copy8(el(v, r0, c1), mt(3))
  mv a0, s3
  lw a1, 2(sp)
  mv a2, s2
  call el
  li a1, 13464
  call copy8
  ; sci/matrix.e16.ts:553  math(M_MUL, mt(3), el(v, r1, c0), at)
  mv a0, s3
  mv a1, s1
  lw a2, 4(sp)
  call el
  li a1, 13464
  mv a2, a0
  li a0, 3
  lw a3, 0(sp)
  call math
  ; sci/matrix.e16.ts:554  math(M_SUB, out, mt(3), at)
  li a0, 2
  mv a1, s0
  li a2, 13464
  lw a3, 0(sp)
  call math
.return:
  lw ra, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; sci/matrix.e16.ts:558 cofactor(v, r, c, out) at -O1
;   v in s0
;   r in s1
;   c in s2
;   out in s3
;   r0 in 0(sp)
;   r1 in 2(sp)
;   c0 in 4(sp)
;   c1 in 6(sp)
cofactor:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s0, 10(sp)
  sw s1, 12(sp)
  sw s2, 14(sp)
  sw s3, 16(sp)
  mv s0, a0 ; v
  mv s1, a1 ; r
  mv s2, a2 ; c
  mv s3, a3 ; out
  ; sci/matrix.e16.ts:559  const r0 = r === 0 ? 1 : 0
  bne s1, zero, .L1
  li t0, 1
  j .L2
.L1:
  li t0, 0
.L2:
  sw t0, 0(sp) ; r0
  ; sci/matrix.e16.ts:560  const r1 = r === 2 ? 1 : 2
  li t0, 2
  bne s1, t0, .L3
  li t0, 1
  j .L4
.L3:
  li t0, 2
.L4:
  sw t0, 2(sp) ; r1
  ; sci/matrix.e16.ts:561  const c0 = c === 0 ? 1 : 0
  bne s2, zero, .L5
  li t0, 1
  j .L6
.L5:
  li t0, 0
.L6:
  sw t0, 4(sp) ; c0
  ; sci/matrix.e16.ts:562  const c1 = c === 2 ? 1 : 2
  li t0, 2
  bne s2, t0, .L7
  li t0, 1
  j .L8
.L7:
  li t0, 2
.L8:
  sw t0, 6(sp) ; c1
  ; sci/matrix.e16.ts:563  minor2(v, r0 * 16 + r1, c0 * 16 + c1, out)
  lw t0, 0(sp) ; r0
  slli t0, t0, 4
  lw t1, 2(sp) ; r1
  add a1, t0, t1
  lw t1, 4(sp) ; c0
  slli t1, t1, 4
  lw t2, 6(sp) ; c1
  add a2, t1, t2
  mv a0, s0
  mv a3, s3
  call minor2
  ; sci/matrix.e16.ts:564  if (((r + c) & 1) !== 0) math(M_NEG, out, 0, 0)
  add t0, s1, s2
  andi t0, t0, 1
  beq t0, zero, .L9
  ; sci/matrix.e16.ts:564  math(M_NEG, out, 0, 0)
  li a0, 16
  mv a1, s3
  li a2, 0
  li a3, 0
  call math
.L9:
.return:
  lw ra, 8(sp)
  lw s0, 10(sp)
  lw s1, 12(sp)
  lw s2, 14(sp)
  lw s3, 16(sp)
  addi sp, sp, 18
  ret

; sci/matrix.e16.ts:568 mInverse(v, at) at -O1
;   v in s1
;   at in s0
;   n/i in s3
;   adj in s2
;   j in 0(sp)
mInverse:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s1, 4(sp)
  sw s0, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  mv s1, a0 ; v
  mv s0, a1 ; at
  ; sci/matrix.e16.ts:569  if (isNumber(v)) {
  mv a0, s1
  call isNumber
  beqz a0, .L1
  ; sci/matrix.e16.ts:570  wholeInto(mt(0), 1)
  li a0, 13440
  li a1, 1
  call wholeInto
  ; sci/matrix.e16.ts:571  math(M_DIV, mt(0), v + 2, at)
  li a0, 4
  li a1, 13440
  addi a2, s1, 2
  mv a3, s0
  call math
  ; sci/matrix.e16.ts:572  copy8(mt(0), v + 2)
  li a0, 13440
  addi a1, s1, 2
  call copy8
  ; sci/matrix.e16.ts:573  return
  j .return
.L1:
  ; sci/matrix.e16.ts:575  square(v, at)
  mv a0, s1
  mv a1, s0
  call square
  ; sci/matrix.e16.ts:576  determinant(v, mt(0), at)
  mv a0, s1
  li a1, 13440
  mv a2, s0
  call determinant
  ; sci/matrix.e16.ts:577  if (isZero(mt(0))) fail(E_MATH, at)
  li a0, 13440
  call isZero
  beqz a0, .L2
  ; sci/matrix.e16.ts:577  fail(E_MATH, at)
  li a0, 1
  mv a1, s0
  call fail
.L2:
  ; sci/matrix.e16.ts:578  mAt = at
  sw s0, 0x0976(zero)
  ; sci/matrix.e16.ts:579  const n = mRows(v)
  mv a0, s1
  call mRows
  mv s3, a0 ; n/i
  ; sci/matrix.e16.ts:580  const adj = mpush(at)
  mv a0, s0
  call mpush
  mv s2, a0 ; adj
  ; sci/matrix.e16.ts:581  poke(adj, n)
  sb s3, 0(s2)
  ; sci/matrix.e16.ts:582  poke(adj + 1, n)
  sb s3, 1(s2)
  ; sci/matrix.e16.ts:583  if (n === 1) wholeInto(el(adj, 0, 0), 1)
  li t0, 1
  bne s3, t0, .L3
  ; sci/matrix.e16.ts:583  wholeInto(el(adj, 0, 0), 1)
  mv a0, s2
  li a1, 0
  li a2, 0
  call el
  li a1, 1
  call wholeInto
  j .L4
.L3:
  ; sci/matrix.e16.ts:584  if (n === 2) {
  li t0, 2
  bne s3, t0, .L5
  ; sci/matrix.e16.ts:585  copy8(el(v, 1, 1), el(adj, 0, 0))
  mv a0, s1
  li a1, 1
  li a2, 1
  call el
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  li a1, 0
  li a2, 0
  call el
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  ; sci/matrix.e16.ts:586  copy8(el(v, 0, 0), el(adj, 1, 1))
  mv a0, s1
  li a1, 0
  li a2, 0
  call el
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  li a1, 1
  li a2, 1
  call el
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  ; sci/matrix.e16.ts:587  copy8(el(v, 0, 1), el(adj, 0, 1))
  mv a0, s1
  li a1, 0
  li a2, 1
  call el
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  li a1, 0
  li a2, 1
  call el
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  ; sci/matrix.e16.ts:588  math(M_NEG, el(adj, 0, 1), 0, at)
  mv a0, s2
  li a1, 0
  li a2, 1
  call el
  mv a1, a0
  li a0, 16
  li a2, 0
  mv a3, s0
  call math
  ; sci/matrix.e16.ts:589  copy8(el(v, 1, 0), el(adj, 1, 0))
  mv a0, s1
  li a1, 1
  li a2, 0
  call el
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  li a1, 1
  li a2, 0
  call el
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  ; sci/matrix.e16.ts:590  math(M_NEG, el(adj, 1, 0), 0, at)
  mv a0, s2
  li a1, 1
  li a2, 0
  call el
  mv a1, a0
  li a0, 16
  li a2, 0
  mv a3, s0
  call math
  j .L6
.L5:
  ; sci/matrix.e16.ts:592  for (let i: u16 = 0; i < 3; i++) {
  li s3, 0 ; n/i
  j .L9
.L7:
  ; sci/matrix.e16.ts:593  for (let j: u16 = 0; j < 3; j++) cofactor(v, j, i, el(adj, i, j))
  sw zero, 0(sp) ; j
  j .L13
.L11:
  ; sci/matrix.e16.ts:593  cofactor(v, j, i, el(adj, i, j))
  mv a0, s2
  mv a1, s3
  lw a2, 0(sp)
  call el
  lw a1, 0(sp)
  mv a2, s3
  mv a3, a0
  mv a0, s1
  call cofactor
  lw t0, 0(sp) ; j
  addi t0, t0, 1
  sw t0, 0(sp) ; j
.L13:
  li t0, 3
  lw t1, 0(sp) ; j
  bltu t1, t0, .L11
  addi s3, s3, 1
.L9:
  li t0, 3
  bltu s3, t0, .L7
.L6:
.L4:
  ; sci/matrix.e16.ts:596  scale(adj, M_DIV, mt(0), at)
  mv a0, s2
  li a1, 4
  li a2, 13440
  mv a3, s0
  call scale
  ; sci/matrix.e16.ts:597  mcopy(adj, v)
  mv a0, s2
  mv a1, s1
  call mcopy
  ; sci/matrix.e16.ts:598  mpop()
  call mpop
.return:
  lw ra, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  addi sp, sp, 12
  ret

; sci/matrix.e16.ts:604 vectorSize(v, at) at -O1
;   v in s1
;   at in s2
vectorSize:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; v
  mv s2, a1 ; at
  ; sci/matrix.e16.ts:605  if (isNumber(v) || (mRows(v) !== 1 && mCols(v) !== 1)) fail(E_DIM, at)
  mv a0, s1
  call isNumber
  bnez a0, .L2
  mv a0, s1
  call mRows
  li t0, 1
  beq a0, t0, .L1
  mv a0, s1
  call mCols
  li t0, 1
  beq a0, t0, .L1
.L2:
  ; sci/matrix.e16.ts:605  fail(E_DIM, at)
  li a0, 6
  mv a1, s2
  call fail
.L1:
  ; sci/matrix.e16.ts:606  return mRows(v) === 1 ? mCols(v) : mRows(v)
  mv a0, s1
  call mRows
  li t0, 1
  bne a0, t0, .L3
  mv a0, s1
  call mCols
  mv t0, a0
  j .L4
.L3:
  mv a0, s1
  call mRows
  mv t0, a0
.L4:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/matrix.e16.ts:610 vPart(v, k) at -O1
;   v in s1
;   k in s2
vPart:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; v
  mv s2, a1 ; k
  ; sci/matrix.e16.ts:611  return mRows(v) === 1 ? el(v, 0, k) : el(v, k, 0)
  mv a0, s1
  call mRows
  li t0, 1
  bne a0, t0, .L1
  mv a0, s1
  li a1, 0
  mv a2, s2
  call el
  mv t0, a0
  j .L2
.L1:
  mv a0, s1
  mv a1, s2
  li a2, 0
  call el
  mv t0, a0
.L2:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/matrix.e16.ts:615 dotOf(u, v, out, at) at -O1
;   u in s3
;   v in s0
;   out in 0(sp)
;   at in s1
;   n in 2(sp)
;   k in s2
dotOf:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  mv s3, a0 ; u
  mv s0, a1 ; v
  sw a2, 0(sp) ; out
  mv s1, a3 ; at
  ; sci/matrix.e16.ts:616  const n = vectorSize(u, at)
  mv a0, s3
  mv a1, s1
  call vectorSize
  sw a0, 2(sp) ; n
  ; sci/matrix.e16.ts:617  if (vectorSize(v, at) !== n) fail(E_DIM, at)
  mv a0, s0
  mv a1, s1
  call vectorSize
  lw t0, 2(sp) ; n
  beq a0, t0, .L1
  ; sci/matrix.e16.ts:617  fail(E_DIM, at)
  li a0, 6
  mv a1, s1
  call fail
.L1:
  ; sci/matrix.e16.ts:618  wholeInto(out, 0)
  lw a0, 0(sp)
  li a1, 0
  call wholeInto
  ; sci/matrix.e16.ts:619  for (let k: u16 = 0; k < n; k++) {
  li s2, 0 ; k
  j .L4
.L2:
  ; sci/matrix.e16.ts:620  copy8(vPart(u, k), mt(4))
  mv a0, s3
  mv a1, s2
  call vPart
  li a1, 13472
  call copy8
  ; sci/matrix.e16.ts:621  math(M_MUL, mt(4), vPart(v, k), at)
  mv a0, s0
  mv a1, s2
  call vPart
  li a1, 13472
  mv a2, a0
  li a0, 3
  mv a3, s1
  call math
  ; sci/matrix.e16.ts:622  math(M_ADD, out, mt(4), at)
  li a0, 1
  lw a1, 0(sp)
  li a2, 13472
  mv a3, s1
  call math
  addi s2, s2, 1
.L4:
  lw t0, 2(sp) ; n
  bltu s2, t0, .L2
.return:
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  addi sp, sp, 14
  ret

; sci/matrix.e16.ts:627 vectorLength(v, out, at) at -O1
;   v in s1
;   out in s2
;   at in s3
vectorLength:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; v
  mv s2, a1 ; out
  mv s3, a2 ; at
  ; sci/matrix.e16.ts:628  dotOf(v, v, out, at)
  mv a0, s1
  mv a1, s1
  mv a2, s2
  mv a3, s3
  call dotOf
  ; sci/matrix.e16.ts:629  math(M_SQR, out, 0, at)
  li a0, 21
  mv a1, s2
  li a2, 0
  mv a3, s3
  call math
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/matrix.e16.ts:633 twoVectors(t, at) at -O1
;   t in s0
;   at in s1
;   v in s3
;   u in s2
twoVectors:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  sw s2, 8(sp)
  mv s0, a0 ; t
  mv s1, a1 ; at
  ; sci/matrix.e16.ts:634  const v = mtop()
  call mtop
  mv s3, a0 ; v
  ; sci/matrix.e16.ts:635  const u = v - MATRIX_SIZE
  addi s2, s3, -80
  ; sci/matrix.e16.ts:636  if (t === T_CROSS) cross(u, v, at)
  li t0, 170
  bne s0, t0, .L1
  ; sci/matrix.e16.ts:636  cross(u, v, at)
  mv a0, s2
  mv a1, s3
  mv a2, s1
  call cross
  j .L2
.L1:
  ; sci/matrix.e16.ts:638  dotOf(u, v, mt(5), at)
  mv a0, s2
  mv a1, s3
  li a2, 13480
  mv a3, s1
  call dotOf
  ; sci/matrix.e16.ts:639  if (t === T_ANGLE) {
  li t0, 171
  bne s0, t0, .L3
  ; sci/matrix.e16.ts:640  vectorLength(u, mt(6), at)
  mv a0, s2
  li a1, 13488
  mv a2, s1
  call vectorLength
  ; sci/matrix.e16.ts:641  vectorLength(v, mt(7), at)
  mv a0, s3
  li a1, 13496
  mv a2, s1
  call vectorLength
  ; sci/matrix.e16.ts:642  math(M_MUL, mt(6), mt(7), at)
  li a0, 3
  li a1, 13488
  li a2, 13496
  mv a3, s1
  call math
  ; sci/matrix.e16.ts:643  if (isZero(mt(6))) fail(E_MATH, at)
  li a0, 13488
  call isZero
  beqz a0, .L4
  ; sci/matrix.e16.ts:643  fail(E_MATH, at)
  li a0, 1
  mv a1, s1
  call fail
.L4:
  ; sci/matrix.e16.ts:644  math(M_DIV, mt(5), mt(6), at)
  li a0, 4
  li a1, 13480
  li a2, 13488
  mv a3, s1
  call math
  ; sci/matrix.e16.ts:646  clampOne(mt(5))
  li a0, 13480
  call clampOne
  ; sci/matrix.e16.ts:647  math(M_ACS, mt(5), 0, at)
  li a0, 26
  li a1, 13480
  li a2, 0
  mv a3, s1
  call math
.L3:
  ; sci/matrix.e16.ts:649  zeros(u, 0, 0)
  mv a0, s2
  li a1, 0
  li a2, 0
  call zeros
  ; sci/matrix.e16.ts:650  copy8(mt(5), u + 2)
  li a0, 13480
  addi a1, s2, 2
  call copy8
.L2:
  ; sci/matrix.e16.ts:652  mpop()
  call mpop
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; sci/matrix.e16.ts:656 clampOne(v) at -O1
;   v in s1
clampOne:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; sci/matrix.e16.ts:657  wholeInto(mt(8), 1)
  li a0, 13504
  li a1, 1
  call wholeInto
  ; sci/matrix.e16.ts:658  copy8(v, mt(7))
  mv a0, s1
  li a1, 13496
  call copy8
  ; sci/matrix.e16.ts:659  math(M_ABS, mt(7), 0, 0)
  li a0, 17
  li a1, 13496
  li a2, 0
  li a3, 0
  call math
  ; sci/matrix.e16.ts:660  math(M_CMP, mt(7), mt(8), 0)
  li a0, 6
  li a1, 13496
  li a2, 13504
  li a3, 0
  call math
  ; sci/matrix.e16.ts:661  if (i16(peek16(MATH_RESULT)) <= 0) return
  li t0, 65370
  lw t0, 0(t0)
  blt zero, t0, .L1
  ; sci/matrix.e16.ts:661  return
  j .return
.L1:
  ; sci/matrix.e16.ts:662  if (isNegative(v)) math(M_NEG, mt(8), 0, 0)
  mv a0, s1
  call isNegative
  beqz a0, .L2
  ; sci/matrix.e16.ts:662  math(M_NEG, mt(8), 0, 0)
  li a0, 16
  li a1, 13504
  li a2, 0
  li a3, 0
  call math
.L2:
  ; sci/matrix.e16.ts:663  copy8(mt(8), v)
  li a0, 13504
  mv a1, s1
  call copy8
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/matrix.e16.ts:667 cross(u, v/across/k, at) at -O1
;   u in 2(sp)
;   v/across/k in s1
;   at in s3
;   nu/i in s0
;   nv/j in 0(sp)
;   k/out in s2
cross:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s0, 10(sp)
  sw s2, 12(sp)
  sw a0, 2(sp) ; u
  mv s1, a1 ; v/across/k
  mv s3, a2 ; at
  ; sci/matrix.e16.ts:668  const nu = vectorSize(u, at)
  lw a0, 2(sp)
  mv a1, s3
  call vectorSize
  mv s0, a0 ; nu/i
  ; sci/matrix.e16.ts:669  const nv = vectorSize(v, at)
  mv a0, s1
  mv a1, s3
  call vectorSize
  sw a0, 0(sp) ; nv/j
  ; sci/matrix.e16.ts:670  if (nu < 2 || nv < 2) fail(E_DIM, at)
  li t0, 2
  bltu s0, t0, .L2
  li t0, 2
  lw t1, 0(sp) ; nv/j
  bgeu t1, t0, .L1
.L2:
  ; sci/matrix.e16.ts:670  fail(E_DIM, at)
  li a0, 6
  mv a1, s3
  call fail
.L1:
  ; sci/matrix.e16.ts:671  for (let k: u16 = 0; k < 3; k++) {
  li s2, 0 ; k/out
  j .L5
.L3:
  ; sci/matrix.e16.ts:672  copy8(k < nu ? vPart(u, k) : mZero(), mt(k))
  bgeu s2, s0, .L7
  lw a0, 2(sp)
  mv a1, s2
  call vPart
  mv t0, a0
  j .L8
.L7:
  call mZero
  mv t0, a0
.L8:
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s2
  call mt
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  ; sci/matrix.e16.ts:673  copy8(k < nv ? vPart(v, k) : mZero(), mt(k + 3))
  lw t0, 0(sp) ; nv/j
  bgeu s2, t0, .L9
  mv a0, s1
  mv a1, s2
  call vPart
  mv t0, a0
  j .L10
.L9:
  call mZero
  mv t0, a0
.L10:
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, s2, 3
  call mt
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call copy8
  addi s2, s2, 1
.L5:
  li t0, 3
  bltu s2, t0, .L3
  ; sci/matrix.e16.ts:675  const out = mpush(at)
  mv a0, s3
  call mpush
  mv s2, a0 ; k/out
  ; sci/matrix.e16.ts:676  const across = mRows(u) === 1
  lw a0, 2(sp)
  call mRows
  li t0, 1
  sub t0, a0, t0
  seqz s1, t0
  ; sci/matrix.e16.ts:677  poke(out, across ? 1 : 3)
  mv t0, s2
  mv t1, s1
  beqz t1, .L11
  li t1, 1
  j .L12
.L11:
  li t1, 3
.L12:
  sb t1, 0(t0)
  ; sci/matrix.e16.ts:678  poke(out + 1, across ? 3 : 1)
  addi t0, s2, 1
  mv t1, s1
  beqz t1, .L13
  li t1, 3
  j .L14
.L13:
  li t1, 1
.L14:
  sb t1, 0(t0)
  ; sci/matrix.e16.ts:679  for (let k: u16 = 0; k < 3; k++) {
  li s1, 0 ; v/across/k
  j .L17
.L15:
  ; sci/matrix.e16.ts:680  const i = k === 2 ? 0 : k + 1
  li t0, 2
  bne s1, t0, .L19
  li t0, 0
  j .L20
.L19:
  addi t0, s1, 1
.L20:
  mv s0, t0 ; nu/i
  ; sci/matrix.e16.ts:681  const j = k === 0 ? 2 : k - 1
  bne s1, zero, .L21
  li t0, 2
  j .L22
.L21:
  addi t0, s1, -1
.L22:
  sw t0, 0(sp) ; nv/j
  ; sci/matrix.e16.ts:683  copy8(mt(i), mt(6))
  mv a0, s0
  call mt
  li a1, 13488
  call copy8
  ; sci/matrix.e16.ts:684  math(M_MUL, mt(6), mt(j + 3), at)
  lw t0, 0(sp) ; nv/j
  addi a0, t0, 3
  call mt
  li a1, 13488
  mv a2, a0
  li a0, 3
  mv a3, s3
  call math
  ; sci/matrix.e16.ts:685  copy8(mt(j), mt(7))
  lw a0, 0(sp)
  call mt
  li a1, 13496
  call copy8
  ; sci/matrix.e16.ts:686  math(M_MUL, mt(7), mt(i + 3), at)
  addi a0, s0, 3
  call mt
  li a1, 13496
  mv a2, a0
  li a0, 3
  mv a3, s3
  call math
  ; sci/matrix.e16.ts:687  math(M_SUB, mt(6), mt(7), at)
  li a0, 2
  li a1, 13488
  li a2, 13496
  mv a3, s3
  call math
  ; sci/matrix.e16.ts:688  copy8(mt(6), vPart(out, k))
  mv a0, s2
  mv a1, s1
  call vPart
  mv a1, a0
  li a0, 13488
  call copy8
  addi s1, s1, 1
.L17:
  li t0, 3
  bltu s1, t0, .L15
  ; sci/matrix.e16.ts:690  mcopy(out, u)
  mv a0, s2
  lw a1, 2(sp)
  call mcopy
  ; sci/matrix.e16.ts:691  mpop()
  call mpop
.return:
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s0, 10(sp)
  lw s2, 12(sp)
  addi sp, sp, 14
  ret

; sci/matrix.e16.ts:695 mZero() at -O1
mZero:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/matrix.e16.ts:696  wholeInto(mt(8), 0)
  li a0, 13504
  li a1, 0
  call wholeInto
  ; sci/matrix.e16.ts:697  return mt(8)
  li a0, 13504
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/matrix.e16.ts:701 mnumber() at -O1
;   v in s1
mnumber:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/matrix.e16.ts:702  const v = mpush(mPos)
  lw a0, 0x0970(zero)
  call mpush
  mv s1, a0 ; v
  ; sci/matrix.e16.ts:703  mPos = readNumber(mFrom, mLength, mPos, v + 2)
  lw a0, 0x096c(zero)
  lw a1, 0x096e(zero)
  lw a2, 0x0970(zero)
  addi a3, s1, 2
  la t0, readNumber
  li t1, 0
  call far_call
  sw a0, 0x0970(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

  .align 2

  .bank 10
  .org 0xc000
; sci/table.e16.ts:50 tablePhase() at -O1
tablePhase:
  ; sci/table.e16.ts:51  return tableNow
  lw a0, 0x0904(zero)
.return:
  ret

; sci/table.e16.ts:55 tableReset() at -O1
tableReset:
  ; sci/table.e16.ts:56  tableNow = TABLE_EDIT
  sw zero, 0x0904(zero)
.return:
  ret

; sci/table.e16.ts:60 rangeAt(k) at -O1
;   k in a0
rangeAt:
  ; sci/table.e16.ts:61  return TABLE_RANGE + k * VALUE_SIZE
  slli t1, a0, 5
  slli t0, a0, 2
  add t0, t0, t1
  addi a0, t0, 7368
.return:
  ret

; sci/table.e16.ts:65 tableAskFrom() at -O1
tableAskFrom:
  ; sci/table.e16.ts:66  tableNow = TABLE_ASK
  li t0, 1
  sw t0, 0x0904(zero)
  ; sci/table.e16.ts:67  rangeAsked = 0
  sw zero, 0x0906(zero)
.return:
  ret

; sci/table.e16.ts:70 tableAsking() at -O1
tableAsking:
  ; sci/table.e16.ts:71  return rangeAsked
  lw a0, 0x0906(zero)
.return:
  ret

; sci/table.e16.ts:75 tableNext() at -O1
tableNext:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/table.e16.ts:76  rangeAsked++
  lw t0, 0x0906(zero)
  addi t0, t0, 1
  sw t0, 0x0906(zero)
  ; sci/table.e16.ts:77  if (rangeAsked < 3) return true
  li t1, 3
  bgeu t0, t1, .L1
  ; sci/table.e16.ts:77  return true
  li a0, 1
  j .return
.L1:
  ; sci/table.e16.ts:78  countRows()
  call countRows
  ; sci/table.e16.ts:79  chosen = 0
  sw zero, 0x090a(zero)
  ; sci/table.e16.ts:80  first = 0
  sw zero, 0x090c(zero)
  ; sci/table.e16.ts:81  tableNow = TABLE_VIEW
  li t0, 2
  sw t0, 0x0904(zero)
  ; sci/table.e16.ts:82  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/table.e16.ts:86 countRows() at -O1
;   n/count in s1
;   one in s2
countRows:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; sci/table.e16.ts:87  if (isZero(rangeAt(2))) fail(E_RANGE, 0)
  li a0, 7440
  call isZero
  beqz a0, .L1
  ; sci/table.e16.ts:87  fail(E_RANGE, 0)
  li a0, 5
  li a1, 0
  call fail
.L1:
  ; sci/table.e16.ts:88  clearStack()
  call clearStack
  ; sci/table.e16.ts:89  const n = push(0)
  li a0, 0
  call push
  mv s1, a0 ; n/count
  ; sci/table.e16.ts:90  copyValue(rangeAt(1), n)
  li a0, 7404
  mv a1, s1
  call copyValue
  ; sci/table.e16.ts:91  math(M_SUB, n, rangeAt(0), 0)
  li a0, 2
  mv a1, s1
  li a2, 7368
  li a3, 0
  call math
  ; sci/table.e16.ts:92  math(M_DIV, n, rangeAt(2), 0)
  li a0, 4
  mv a1, s1
  li a2, 7440
  li a3, 0
  call math
  ; sci/table.e16.ts:93  if (isNegative(n)) fail(E_RANGE, 0)
  mv a0, s1
  call isNegative
  beqz a0, .L2
  ; sci/table.e16.ts:93  fail(E_RANGE, 0)
  li a0, 5
  li a1, 0
  call fail
.L2:
  ; sci/table.e16.ts:94  const one = pushInt(1, 0)
  li a0, 1
  li a1, 0
  call pushInt
  mv s2, a0 ; one
  ; sci/table.e16.ts:95  math(M_IDIV, n, one, 0)
  li a0, 8
  mv a1, s1
  mv a2, s2
  li a3, 0
  call math
  ; sci/table.e16.ts:97  math(M_TOINT, n, 0, 0)
  li a0, 49
  mv a1, s1
  li a2, 0
  li a3, 0
  call math
  ; sci/table.e16.ts:98  const count = peek16(MATH_ARG) + 1
  li t0, 65366
  lw t0, 0(t0)
  addi s1, t0, 1
  ; sci/table.e16.ts:99  pop()
  call pop
  ; sci/table.e16.ts:100  pop()
  call pop
  ; sci/table.e16.ts:101  if (count > 30) fail(E_RANGE, 0)
  li t0, 30
  bgeu t0, s1, .L3
  ; sci/table.e16.ts:101  fail(E_RANGE, 0)
  li a0, 5
  li a1, 0
  call fail
.L3:
  ; sci/table.e16.ts:102  rows = count
  sw s1, 0x0908(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/table.e16.ts:106 tableKey(k) at -O1
;   k in s1
tableKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/table.e16.ts:107  if (k === K_UP && chosen > 0) chosen--
  bne s1, zero, .L1
  lw t0, 0x090a(zero)
  bgeu zero, t0, .L1
  ; sci/table.e16.ts:107  chosen--
  lw t0, 0x090a(zero)
  addi t0, t0, -1
  sw t0, 0x090a(zero)
  j .L2
.L1:
  ; sci/table.e16.ts:108  if (k === K_DOWN && chosen + 1 < rows) chosen++
  li t0, 1
  bne s1, t0, .L3
  lw t0, 0x090a(zero)
  lw t1, 0x0908(zero)
  addi t0, t0, 1
  bgeu t0, t1, .L3
  ; sci/table.e16.ts:108  chosen++
  lw t0, 0x090a(zero)
  addi t0, t0, 1
  sw t0, 0x090a(zero)
  j .L4
.L3:
  ; sci/table.e16.ts:109  if (k === K_AC) tableNow = TABLE_EDIT
  li t0, 5
  bne s1, t0, .L5
  ; sci/table.e16.ts:109  tableNow = TABLE_EDIT
  sw zero, 0x0904(zero)
  j .L6
.L5:
  ; sci/table.e16.ts:110  refuse()
  call refuse
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/table.e16.ts:117 tableDraw() at -O1
;   x/y/k in s1
tableDraw:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/table.e16.ts:118  cls()
  call cls
  ; sci/table.e16.ts:119  band(str('TABLE'))
  la a0, str_161
  call band
  ; sci/table.e16.ts:120  if (chosen < first) first = chosen
  lw t0, 0x090a(zero)
  lw t1, 0x090c(zero)
  bgeu t0, t1, .L1
  ; sci/table.e16.ts:120  first = chosen
  lw t0, 0x090a(zero)
  sw t0, 0x090c(zero)
.L1:
  ; sci/table.e16.ts:121  if (chosen >= first + 5) first = chosen - 4
  lw t0, 0x090a(zero)
  lw t1, 0x090c(zero)
  addi t1, t1, 5
  bltu t0, t1, .L2
  ; sci/table.e16.ts:121  first = chosen - 4
  lw t0, 0x090a(zero)
  addi t0, t0, -4
  sw t0, 0x090c(zero)
.L2:
  ; sci/table.e16.ts:122  textAt(str('X'), 33, lineY(0))
  la a0, str_162
  li a1, 33
  li a2, 11
  call textAt
  ; sci/table.e16.ts:123  textAt(str('f(X)'), 81, lineY(0))
  la a0, str_163
  li a1, 81
  li a2, 11
  call textAt
  ; sci/table.e16.ts:124  for (let x: u16 = 0; x < 128; x++) dot(x, 19)
  li s1, 0 ; x/y/k
  j .L5
.L3:
  ; sci/table.e16.ts:124  dot(x, 19)
  mv a0, s1
  li a1, 19
  call dot
  addi s1, s1, 1
.L5:
  li t0, 128
  bltu s1, t0, .L3
  ; sci/table.e16.ts:125  for (let y: u16 = 10; y < 64; y++) {
  li s1, 10 ; x/y/k
  j .L9
.L7:
  ; sci/table.e16.ts:126  dot(13, y)
  li a0, 13
  mv a1, s1
  call dot
  ; sci/table.e16.ts:127  dot(SPLIT, y)
  li a0, 58
  mv a1, s1
  call dot
  addi s1, s1, 1
.L9:
  li t0, 64
  bltu s1, t0, .L7
  ; sci/table.e16.ts:129  holdX()
  call holdX
  ; sci/table.e16.ts:130  for (let k: u16 = 0; k < 5 && first + k < rows; k++) drawTableRow(first + k, 21 + 9 * k)
  li s1, 0 ; x/y/k
  j .L13
.L11:
  ; sci/table.e16.ts:130  drawTableRow(first + k, 21 + 9 * k)
  lw t0, 0x090c(zero)
  add a0, t0, s1
  li t1, 9
  mul t1, t1, s1
  addi a1, t1, 21
  call drawTableRow
  addi s1, s1, 1
.L13:
  li t0, 5
  bgeu s1, t0, .L15
  lw t0, 0x090c(zero)
  add t0, t0, s1
  lw t1, 0x0908(zero)
  bltu t0, t1, .L11
.L15:
  ; sci/table.e16.ts:131  releaseX()
  call releaseX
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/table.e16.ts:135 drawTableRow(r, y) at -O1
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
  ; sci/table.e16.ts:136  rowNumberAt(r + 1, y)
  addi a0, s3, 1
  mv a1, s1
  la t0, rowNumberAt
  li t1, 9
  call far_call
  ; sci/table.e16.ts:138  clearStack()
  call clearStack
  ; sci/table.e16.ts:139  const x = pushInt(r, 0)
  mv a0, s3
  li a1, 0
  call pushInt
  mv s2, a0 ; x
  ; sci/table.e16.ts:140  math(M_MUL, x, rangeAt(2), 0)
  li a0, 3
  mv a1, s2
  li a2, 7440
  li a3, 0
  call math
  ; sci/table.e16.ts:141  math(M_ADD, x, rangeAt(0), 0)
  li a0, 1
  mv a1, s2
  li a2, 7368
  li a3, 0
  call math
  ; sci/table.e16.ts:142  copyValue(x, varAt(VAR_X))
  mv a0, s2
  li a1, 3336
  call copyValue
  ; sci/table.e16.ts:143  fitNumber(x, 13, SPLIT, y)
  mv a0, s2
  li a1, 13
  li a2, 58
  mv a3, s1
  la t0, fitNumber
  li t1, 9
  call far_call
  ; sci/table.e16.ts:144  clearStack()
  call clearStack
  ; sci/table.e16.ts:145  evaluate(addr(line), length)
  lw a1, 0x0582(zero)
  la a0, line
  la t0, evaluate
  li t1, 0
  call far_call
  ; sci/table.e16.ts:146  fitNumber(top(), SPLIT, 128, y)
  call top
  li a1, 58
  li a2, 128
  mv a3, s1
  la t0, fitNumber
  li t1, 9
  call far_call
  ; sci/table.e16.ts:147  if (r === chosen) invertBox(SPLIT + 1, y - 1, 127, y + 7)
  lw t0, 0x090a(zero)
  bne s3, t0, .L1
  ; sci/table.e16.ts:147  invertBox(SPLIT + 1, y - 1, 127, y + 7)
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

; sci/extras.e16.ts:24 nextAngle() at -O1
;   unit in s1
nextAngle:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/extras.e16.ts:25  const unit = peek(KEEP_ANGLE)
  lbu s1, 3074(zero)
  ; sci/extras.e16.ts:26  const k = WORK
  ; sci/extras.e16.ts:27  if (unit === 0) {
  bne s1, zero, .L1
  ; sci/extras.e16.ts:28  math(M_PI, k, 0, 0)
  li a0, 32
  li a1, 9984
  li a2, 0
  li a3, 0
  call math
  ; sci/extras.e16.ts:29  math(M_MUL, KEEP_ANS, k, 0)
  li a0, 3
  li a1, 3080
  li a2, 9984
  li a3, 0
  call math
  ; sci/extras.e16.ts:30  wholeInto(k, 180)
  li a0, 9984
  li a1, 180
  call wholeInto
  ; sci/extras.e16.ts:31  math(M_DIV, KEEP_ANS, k, 0)
  li a0, 4
  li a1, 3080
  li a2, 9984
  li a3, 0
  call math
  j .L2
.L1:
  ; sci/extras.e16.ts:32  if (unit === 1) {
  li t0, 1
  bne s1, t0, .L3
  ; sci/extras.e16.ts:33  wholeInto(k, 200)
  li a0, 9984
  li a1, 200
  call wholeInto
  ; sci/extras.e16.ts:34  math(M_MUL, KEEP_ANS, k, 0)
  li a0, 3
  li a1, 3080
  li a2, 9984
  li a3, 0
  call math
  ; sci/extras.e16.ts:35  math(M_PI, k, 0, 0)
  li a0, 32
  li a1, 9984
  li a2, 0
  li a3, 0
  call math
  ; sci/extras.e16.ts:36  math(M_DIV, KEEP_ANS, k, 0)
  li a0, 4
  li a1, 3080
  li a2, 9984
  li a3, 0
  call math
  j .L4
.L3:
  ; sci/extras.e16.ts:38  wholeInto(k, 9)
  li a0, 9984
  li a1, 9
  call wholeInto
  ; sci/extras.e16.ts:39  math(M_MUL, KEEP_ANS, k, 0)
  li a0, 3
  li a1, 3080
  li a2, 9984
  li a3, 0
  call math
  ; sci/extras.e16.ts:40  wholeInto(k, 10)
  li a0, 9984
  li a1, 10
  call wholeInto
  ; sci/extras.e16.ts:41  math(M_DIV, KEEP_ANS, k, 0)
  li a0, 4
  li a1, 3080
  li a2, 9984
  li a3, 0
  call math
.L4:
.L2:
  ; sci/extras.e16.ts:43  inexact(KEEP_ANS)
  li a0, 3080
  call inexact
  ; sci/extras.e16.ts:44  poke(KEEP_ANGLE, unit >= 2 ? 0 : unit + 1)
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

; sci/extras.e16.ts:57 constantKept() at -O1
constantKept:
  ; sci/extras.e16.ts:58  return constOp !== 0
  lw t0, 0x0916(zero)
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; sci/extras.e16.ts:65 operator(t) at -O1
;   t in a0
operator:
  ; sci/extras.e16.ts:66  return t === T_PLUS || t === T_MINUS || t === T_TIMES || t === T_DIVIDE
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

; sci/extras.e16.ts:70 numberLength(at, from, length) at -O1
;   at in a0
;   from in a1
;   length in a2
;   n in a3
;   numberChar.t in s1
numberLength:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; sci/extras.e16.ts:71  let n: u16 = 0
  li a3, 0 ; n
  ; sci/extras.e16.ts:72  while (from + n < length && numberChar(peek(at + from + n))) n++
  j .L3
.L1:
  ; sci/extras.e16.ts:72  n++
  addi a3, a3, 1
.L3:
  add t0, a1, a3
  bgeu t0, a2, .L5
  add t0, a0, a1
  add t0, t0, a3
  lbu s1, 0(t0)
  ; sci/extras.e16.ts:62  return (t >= 0x30 && t <= 0x39) || t === T_POINT
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
  ; sci/extras.e16.ts:73  return n
  mv a0, a3
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; sci/extras.e16.ts:80 noteConstant(at, length/from) at -O1
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
  ; sci/extras.e16.ts:81  const first = numberLength(at, 0, length)
  mv a0, s0
  li a1, 0
  mv a2, s3
  call numberLength
  mv s1, a0 ; first/size
  ; sci/extras.e16.ts:82  if (first === length && length > 0 && constOp !== 0) return
  bne s1, s3, .L1
  bgeu zero, s3, .L1
  lw t0, 0x0916(zero)
  beq t0, zero, .L1
  ; sci/extras.e16.ts:82  return
  j .return
.L1:
  ; sci/extras.e16.ts:83  constOp = 0
  sw zero, 0x0916(zero)
  ; sci/extras.e16.ts:84  if (first === 0 || first >= length) return
  beq s1, zero, .L3
  bltu s1, s3, .L2
.L3:
  ; sci/extras.e16.ts:84  return
  j .return
.L2:
  ; sci/extras.e16.ts:85  const op = peek(at + first)
  add t0, s0, s1
  lbu s2, 0(t0)
  ; sci/extras.e16.ts:86  const second = numberLength(at, first + 1, length)
  mv a0, s0
  addi a1, s1, 1
  mv a2, s3
  call numberLength
  sw a0, 0(sp) ; second
  ; sci/extras.e16.ts:87  if (!operator(op) || second === 0 || first + 1 + second !== length) return
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
  ; sci/extras.e16.ts:87  return
  j .return
.L4:
  ; sci/extras.e16.ts:88  constOp = op
  sw s2, 0x0916(zero)
  ; sci/extras.e16.ts:90  const from: u16 = op === T_TIMES ? 0 : first + 1
  li t0, 129
  bne s2, t0, .L6
  li t0, 0
  j .L7
.L6:
  addi t0, s1, 1
.L7:
  mv s3, t0 ; length/from
  ; sci/extras.e16.ts:91  const size: u16 = op === T_TIMES ? first : second
  li t0, 129
  bne s2, t0, .L8
  mv t0, s1
  j .L9
.L8:
  lw t0, 0(sp)
.L9:
  mv s1, t0 ; first/size
  ; sci/extras.e16.ts:92  if (size > 24) {
  li t0, 24
  bgeu t0, s1, .L10
  ; sci/extras.e16.ts:93  constOp = 0
  sw zero, 0x0916(zero)
  ; sci/extras.e16.ts:94  return
  j .return
.L10:
  ; sci/extras.e16.ts:96  poke(CONST, size)
  li t0, 10000
  sb s1, 0(t0)
  ; sci/extras.e16.ts:97  for (let i: u16 = 0; i < size; i++) poke(CONST + 1 + i, peek(at + from + i))
  li s2, 0 ; op/i
  j .L13
.L11:
  ; sci/extras.e16.ts:97  poke(CONST + 1 + i, peek(at + from + i))
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

; sci/extras.e16.ts:104 withConstant(at, length) at -O1
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
  ; sci/extras.e16.ts:105  if (constOp === 0 || length === 0 || numberLength(at, 0, length) !== length) return 0xffff
  lw t0, 0x0916(zero)
  beq t0, zero, .L2
  beq s2, zero, .L2
  mv a0, s3
  li a1, 0
  mv a2, s2
  call numberLength
  beq a0, s2, .L1
.L2:
  ; sci/extras.e16.ts:105  return 0xffff
  li a0, 65535
  j .return
.L1:
  ; sci/extras.e16.ts:106  const size = peek(CONST)
  li t0, 10000
  lbu s0, 0(t0)
  ; sci/extras.e16.ts:107  if (length + 1 + size > 190) return 0xffff
  addi t0, s2, 1
  add t0, t0, s0
  li t1, 190
  bgeu t1, t0, .L3
  ; sci/extras.e16.ts:107  return 0xffff
  li a0, 65535
  j .return
.L3:
  ; sci/extras.e16.ts:108  if (constOp === T_TIMES) {
  lw t0, 0x0916(zero)
  li t1, 129
  bne t0, t1, .L4
  ; sci/extras.e16.ts:110  for (let i = length; i > 0; i--) poke(at + i + size, peek(at + i - 1))
  mv s1, s2 ; i
  j .L7
.L5:
  ; sci/extras.e16.ts:110  poke(at + i + size, peek(at + i - 1))
  add t0, s3, s1
  add t0, t0, s0
  add t1, s3, s1
  lbu t1, -1(t1)
  sb t1, 0(t0)
  addi s1, s1, -1
.L7:
  bltu zero, s1, .L5
  ; sci/extras.e16.ts:111  for (let i: u16 = 0; i < size; i++) poke(at + i, peek(CONST + 1 + i))
  li s1, 0 ; i
  j .L11
.L9:
  ; sci/extras.e16.ts:111  poke(at + i, peek(CONST + 1 + i))
  add t0, s3, s1
  li t1, 10001
  add t1, t1, s1
  lbu t1, 0(t1)
  sb t1, 0(t0)
  addi s1, s1, 1
.L11:
  bltu s1, s0, .L9
  ; sci/extras.e16.ts:112  poke(at + size, T_TIMES)
  add t0, s3, s0
  li t1, 129
  sb t1, 0(t0)
  j .L13
.L4:
  ; sci/extras.e16.ts:114  poke(at + length, constOp)
  add t0, s3, s2
  lw t1, 0x0916(zero)
  sb t1, 0(t0)
  ; sci/extras.e16.ts:115  for (let i: u16 = 0; i < size; i++) poke(at + length + 1 + i, peek(CONST + 1 + i))
  li s1, 0 ; i
  j .L16
.L14:
  ; sci/extras.e16.ts:115  poke(at + length + 1 + i, peek(CONST + 1 + i))
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
  ; sci/extras.e16.ts:117  return length + 1 + size
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

; sci/extras.e16.ts:121 dropConstant() at -O1
dropConstant:
  ; sci/extras.e16.ts:122  constOp = 0
  sw zero, 0x0916(zero)
.return:
  ret

; sci/consts.e16.ts:44 fieldInto(table/p, n, from) at -O1
;   table/p in a0
;   n in a1
;   from in a2
;   k/i in a3
fieldInto:
  ; sci/consts.e16.ts:45  let p = table
  ; sci/consts.e16.ts:46  for (let k: u16 = 0; k < n; k++) {
  li a3, 0 ; k/i
  j .L3
  ; sci/consts.e16.ts:47  while (peek(p) !== 0x7c) {
.L5:
  ; sci/consts.e16.ts:49  if (peek(p) === 0) {
  lbu t0, 0(a0)
  bne t0, zero, .L9
  ; sci/consts.e16.ts:50  fieldText[from] = 0
  sb zero, fieldText(a2)
  ; sci/consts.e16.ts:51  return from
  mv a0, a2
  ret
.L9:
  ; sci/consts.e16.ts:53  p++
  addi a0, a0, 1
.L7:
  lbu t0, 0(a0)
  li t1, 124
  bne t0, t1, .L5
  ; sci/consts.e16.ts:55  p++
  addi a0, a0, 1
  addi a3, a3, 1
.L3:
  bltu a3, a1, .L7
  ; sci/consts.e16.ts:57  let i = from
  mv a3, a2 ; k/i
  ; sci/consts.e16.ts:58  while (peek(p) !== 0x7c && peek(p) !== 0 && i < 23) {
  j .L12
.L10:
  ; sci/consts.e16.ts:59  fieldText[i] = peek(p)
  lbu t0, 0(a0)
  sb t0, fieldText(a3)
  ; sci/consts.e16.ts:60  i++
  addi a3, a3, 1
  ; sci/consts.e16.ts:61  p++
  addi a0, a0, 1
.L12:
  lbu t0, 0(a0)
  li t1, 124
  beq t0, t1, .L14
  lbu t0, 0(a0)
  beq t0, zero, .L14
  li t0, 23
  bltu a3, t0, .L10
.L14:
  ; sci/consts.e16.ts:63  fieldText[i] = 0
  sb zero, fieldText(a3)
  ; sci/consts.e16.ts:64  return i
  mv a0, a3
.return:
  ret

; sci/consts.e16.ts:83 extName(t) at -O1
;   t in s1
;   n in s2
extName:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t
  ; sci/consts.e16.ts:84  let n: u16 = 0
  li s2, 0 ; n
  ; sci/consts.e16.ts:85  if (t >= 0xe0) n = fieldInto(namedTable(), t - 0xe0, 0)
  li t0, 224
  bltu s1, t0, .L1
  ; sci/consts.e16.ts:85  n = fieldInto(namedTable(), t - 0xe0, 0)
  ; sci/consts.e16.ts:98  return str(
  la a0, str_192
  addi a1, s1, -224
  li a2, 0
  call fieldInto
  mv s2, a0 ; n
  j .L2
.L1:
  ; sci/consts.e16.ts:86  if (t >= 0xc0) n = fieldInto(constTable(), (t - 0xc0) * 3, 0)
  li t0, 192
  bltu s1, t0, .L3
  ; sci/consts.e16.ts:86  n = fieldInto(constTable(), (t - 0xc0) * 3, 0)
  ; sci/consts.e16.ts:115  return str(
  addi t0, s1, -192
  slli t1, t0, 1
  add a1, t1, t0
  la a0, str_194
  li a2, 0
  call fieldInto
  mv s2, a0 ; n
  j .L4
.L3:
  ; sci/consts.e16.ts:87  if (t >= 0xa0) n = fieldInto(wordTable(), t - 0xa0, 0)
  li t0, 160
  bltu s1, t0, .L5
  ; sci/consts.e16.ts:87  n = fieldInto(wordTable(), t - 0xa0, 0)
  ; sci/consts.e16.ts:74  return str(
  la a0, str_191
  addi a1, s1, -160
  li a2, 0
  call fieldInto
  mv s2, a0 ; n
  j .L6
.L5:
  ; sci/consts.e16.ts:88  n = fieldInto(statTable(), t - 0x97, 0)
  ; sci/consts.e16.ts:105  return str('n|\x95|\x91x|sx|\x96|\x91y|sy|\x90x|\x90x\x84')
  la a0, str_193
  addi a1, s1, -151
  li a2, 0
  call fieldInto
  mv s2, a0 ; n
.L6:
.L4:
.L2:
  ; sci/consts.e16.ts:89  return n === 0 ? 0 : addr(fieldText)
  bne s2, zero, .L7
  li t0, 0
  j .L8
.L7:
  la t0, fieldText
.L8:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/consts.e16.ts:124 constValue(t/n, v) at -O1
;   t/n in s1
;   v in s2
constValue:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t/n
  mv s2, a1 ; v
  ; sci/consts.e16.ts:125  const n = fieldInto(constTable(), (t - 0xc0) * 3 + 2, 0)
  ; sci/consts.e16.ts:115  return str(
  addi t0, s1, -192
  slli t1, t0, 1
  add t0, t1, t0
  la a0, str_194
  addi a1, t0, 2
  li a2, 0
  call fieldInto
  mv s1, a0 ; t/n
  ; sci/consts.e16.ts:126  poke16(MATH_ARG, n)
  li t0, 65366
  sw s1, 0(t0)
  ; sci/consts.e16.ts:127  math(M_PARSE, v, addr(fieldText), 0)
  li a0, 56
  mv a1, s2
  la a2, fieldText
  li a3, 0
  call math
  ; sci/consts.e16.ts:128  inexact(v)
  mv a0, s2
  call inexact
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/consts.e16.ts:132 constScreen() at -O1
constScreen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/consts.e16.ts:133  constPage = 0
  sw zero, 0x0932(zero)
  ; sci/consts.e16.ts:134  drawConst()
  call drawConst
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/consts.e16.ts:137 drawConst() at -O1
;   r in s1
;   k in s2
;   n in s3
drawConst:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; sci/consts.e16.ts:138  bandWith(str('CONST'), pageText(constPage, CONST_PAGES))
  lw a0, 0x0932(zero)
  li a1, 4
  call pageText
  mv a1, a0
  la a0, str_195
  call bandWith
  ; sci/consts.e16.ts:139  for (let r: u16 = 0; r < 5; r++) {
  li s1, 0 ; r
  j .L3
.L1:
  ; sci/consts.e16.ts:140  const k = constPage * 5 + r
  lw t0, 0x0932(zero)
  slli t1, t0, 2
  add t0, t1, t0
  add s2, t0, s1
  ; sci/consts.e16.ts:141  fieldText[0] = 0x31 + r
  addi t0, s1, 49
  sb t0, fieldText(zero)
  ; sci/consts.e16.ts:142  fieldText[1] = 0x3a
  li t0, 58
  sb t0, fieldText+1(zero)
  ; sci/consts.e16.ts:143  const n = fieldInto(constTable(), k * 3, 2)
  ; sci/consts.e16.ts:115  return str(
  slli t1, s2, 1
  add a1, t1, s2
  la a0, str_194
  li a2, 2
  call fieldInto
  mv s3, a0 ; n
  ; sci/consts.e16.ts:144  fieldText[n] = 0x20
  li t0, 32
  sb t0, fieldText(s3)
  ; sci/consts.e16.ts:145  fieldInto(constTable(), k * 3 + 1, n + 1)
  ; sci/consts.e16.ts:115  return str(
  slli t1, s2, 1
  add t0, t1, s2
  la a0, str_194
  addi a1, t0, 1
  addi a2, s3, 1
  call fieldInto
  ; sci/consts.e16.ts:146  textAt(addr(fieldText), 1, lineY(r))
  mv a0, s1
  call lineY
  li a1, 1
  mv a2, a0
  la a0, fieldText
  call textAt
  addi s1, s1, 1
.L3:
  li t0, 5
  bltu s1, t0, .L1
  ; sci/consts.e16.ts:148  textAt(str('\x8d\x8e:PAGE AC:BACK'), 1, lineY(5))
  la a0, str_196
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/consts.e16.ts:152 constKey(k/d) at -O1
;   k/d in s1
constKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/d
  ; sci/consts.e16.ts:153  if (k === K_AC) return 1
  li t0, 5
  bne s1, t0, .L1
  ; sci/consts.e16.ts:153  return 1
  li a0, 1
  j .return
.L1:
  ; sci/consts.e16.ts:154  if (k === K_DOWN || k === K_UP) {
  li t0, 1
  beq s1, t0, .L3
  bne s1, zero, .L2
.L3:
  ; sci/consts.e16.ts:155  constPage = turnPage(constPage, CONST_PAGES, k === K_DOWN)
  lw a0, 0x0932(zero)
  li t1, 1
  sub t1, s1, t1
  seqz a2, t1
  li a1, 4
  call turnPage
  sw a0, 0x0932(zero)
  ; sci/consts.e16.ts:156  drawConst()
  call drawConst
  ; sci/consts.e16.ts:157  return 0
  li a0, 0
  j .return
.L2:
  ; sci/consts.e16.ts:159  const d = digitOf(k)
  mv a0, s1
  la t0, digitOf
  li t1, 4
  call far_call
  mv s1, a0 ; k/d
  ; sci/consts.e16.ts:160  if (d < 1 || d > 5) {
  li t0, 1
  bltu s1, t0, .L5
  li t0, 5
  bgeu t0, s1, .L4
.L5:
  ; sci/consts.e16.ts:161  refuse()
  call refuse
  ; sci/consts.e16.ts:162  return 0
  li a0, 0
  j .return
.L4:
  ; sci/consts.e16.ts:164  return 0xc0 + constPage * 5 + d - 1
  lw t0, 0x0932(zero)
  slli t1, t0, 2
  add t0, t1, t0
  addi t0, t0, 192
  add t0, t0, s1
  addi a0, t0, -1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/consts.e16.ts:191 convScreen() at -O1
convScreen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/consts.e16.ts:192  convPage = 0
  sw zero, 0x0934(zero)
  ; sci/consts.e16.ts:193  drawConv()
  call drawConv
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/consts.e16.ts:196 drawConv() at -O1
;   r in s1
drawConv:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/consts.e16.ts:197  bandWith(str('CONV'), pageText(convPage, CONV_PAGES))
  lw a0, 0x0934(zero)
  li a1, 4
  call pageText
  mv a1, a0
  la a0, str_199
  call bandWith
  ; sci/consts.e16.ts:198  for (let r: u16 = 0; r < 5; r++) {
  li s1, 0 ; r
  j .L3
.L1:
  ; sci/consts.e16.ts:199  convItem(r * 2, 1, lineY(r))
  slli t0, s1, 1
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  call lineY
  lw t0, 0(sp)
  addi sp, sp, 2
  li a1, 1
  mv a2, a0
  mv a0, t0
  call convItem
  ; sci/consts.e16.ts:200  convItem(r * 2 + 1, 67, lineY(r))
  slli t0, s1, 1
  addi t0, t0, 1
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  call lineY
  lw t0, 0(sp)
  addi sp, sp, 2
  li a1, 67
  mv a2, a0
  mv a0, t0
  call convItem
  addi s1, s1, 1
.L3:
  li t0, 5
  bltu s1, t0, .L1
  ; sci/consts.e16.ts:202  textAt(str('\x8d\x8e:PAGE AC:BACK'), 1, lineY(5))
  la a0, str_196
  li a1, 1
  li a2, 56
  call textAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/consts.e16.ts:206 convItem(i, x, y) at -O1
;   i in s1
;   x in s2
;   y in s3
convItem:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i
  mv s2, a1 ; x
  mv s3, a2 ; y
  ; sci/consts.e16.ts:207  fieldText[0] = i === 9 ? 0x30 : 0x31 + i
  la t0, fieldText
  mv t1, s1
  li t2, 9
  bne t1, t2, .L1
  li t1, 48
  j .L2
.L1:
  addi t1, s1, 49
.L2:
  sb t1, 0(t0)
  ; sci/consts.e16.ts:208  fieldText[1] = 0x3a
  li t0, 58
  sb t0, fieldText+1(zero)
  ; sci/consts.e16.ts:209  fieldInto(convTable(), convPage * 10 + i, 2)
  ; sci/consts.e16.ts:171  return str(
  lw t0, 0x0934(zero)
  slli t1, t0, 3
  slli t0, t0, 1
  add t0, t0, t1
  add a1, t0, s1
  la a0, str_197
  li a2, 2
  call fieldInto
  ; sci/consts.e16.ts:210  textAt(addr(fieldText), x, y)
  la a0, fieldText
  mv a1, s2
  mv a2, s3
  call textAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sci/consts.e16.ts:214 convKey(k/d/item) at -O1
;   k/d/item in s1
convKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k/d/item
  ; sci/consts.e16.ts:215  if (k === K_AC) return 1
  li t0, 5
  bne s1, t0, .L1
  ; sci/consts.e16.ts:215  return 1
  li a0, 1
  j .return
.L1:
  ; sci/consts.e16.ts:216  if (k === K_DOWN || k === K_UP) {
  li t0, 1
  beq s1, t0, .L3
  bne s1, zero, .L2
.L3:
  ; sci/consts.e16.ts:217  convPage = turnPage(convPage, CONV_PAGES, k === K_DOWN)
  lw a0, 0x0934(zero)
  li t1, 1
  sub t1, s1, t1
  seqz a2, t1
  li a1, 4
  call turnPage
  sw a0, 0x0934(zero)
  ; sci/consts.e16.ts:218  drawConv()
  call drawConv
  ; sci/consts.e16.ts:219  return 0
  li a0, 0
  j .return
.L2:
  ; sci/consts.e16.ts:221  let d = digitOf(k)
  mv a0, s1
  la t0, digitOf
  li t1, 4
  call far_call
  mv s1, a0 ; k/d/item
  ; sci/consts.e16.ts:222  if (d === 0xffff) {
  li t0, 65535
  bne s1, t0, .L4
  ; sci/consts.e16.ts:223  refuse()
  call refuse
  ; sci/consts.e16.ts:224  return 0
  li a0, 0
  j .return
.L4:
  ; sci/consts.e16.ts:226  if (d === 0) d = 10
  bne s1, zero, .L5
  ; sci/consts.e16.ts:226  d = 10
  li s1, 10 ; k/d/item
.L5:
  ; sci/consts.e16.ts:227  const item = convPage * 10 + d - 1
  lw t0, 0x0934(zero)
  slli t1, t0, 3
  slli t0, t0, 1
  add t0, t0, t1
  add t0, t0, s1
  addi s1, t0, -1
  ; sci/consts.e16.ts:228  convert(item >> 1, (item & 1) !== 0)
  srli a0, s1, 1
  andi t1, s1, 1
  sub t1, t1, zero
  snez a1, t1
  call convert
  ; sci/consts.e16.ts:229  convDone = item
  sw s1, 0x0936(zero)
  ; sci/consts.e16.ts:230  return 2
  li a0, 2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/consts.e16.ts:234 convert(pair/n, back) at -O1
;   pair/n in s1
;   back in s3
;   divides in s2
;   v in s0
convert:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; pair/n
  mv s3, a1 ; back
  ; sci/consts.e16.ts:235  clearStack()
  call clearStack
  ; sci/consts.e16.ts:236  copyValue(KEEP_ANS, push(0))
  li a0, 0
  call push
  mv a1, a0
  li a0, 3080
  call copyValue
  ; sci/consts.e16.ts:237  if (pair === FAHRENHEIT) {
  li t0, 10
  bne s1, t0, .L1
  ; sci/consts.e16.ts:238  if (back) {
  beqz s3, .L2
  ; sci/consts.e16.ts:239  times(9, 5)
  li a0, 9
  li a1, 5
  call times
  ; sci/consts.e16.ts:240  pushInt(32, 0)
  li a0, 32
  li a1, 0
  call pushInt
  ; sci/consts.e16.ts:241  binary(M_ADD, 0)
  li a0, 1
  li a1, 0
  la t0, binary
  li t1, 0
  call far_call
  j .L4
.L2:
  ; sci/consts.e16.ts:243  pushInt(32, 0)
  li a0, 32
  li a1, 0
  call pushInt
  ; sci/consts.e16.ts:244  binary(M_SUB, 0)
  li a0, 2
  li a1, 0
  la t0, binary
  li t1, 0
  call far_call
  ; sci/consts.e16.ts:245  times(5, 9)
  li a0, 5
  li a1, 9
  call times
  j .L4
.L1:
  ; sci/consts.e16.ts:248  const n = fieldInto(factorTable(), pair, 0)
  ; sci/consts.e16.ts:178  return str(
  la a0, str_198
  mv a1, s1
  li a2, 0
  call fieldInto
  mv s1, a0 ; pair/n
  ; sci/consts.e16.ts:249  const divides = fieldText[0] === 0x2f
  lbu t0, fieldText(zero)
  li t1, 47
  sub t0, t0, t1
  seqz s2, t0
  ; sci/consts.e16.ts:250  const v = push(0)
  li a0, 0
  call push
  mv s0, a0 ; v
  ; sci/consts.e16.ts:251  poke16(MATH_ARG, divides ? n - 1 : n)
  li t0, 65366
  mv t1, s2
  beqz t1, .L5
  addi t1, s1, -1
  j .L6
.L5:
  mv t1, s1
.L6:
  sw t1, 0(t0)
  ; sci/consts.e16.ts:252  math(M_PARSE, v, addr(fieldText) + (divides ? 1 : 0), 0)
  li t0, 56
  mv t1, s0
  la t2, fieldText
  mv t3, s2
  beqz t3, .L7
  li t3, 1
  j .L8
.L7:
  li t3, 0
.L8:
  add a2, t2, t3
  mv a0, t0
  mv a1, t1
  li a3, 0
  call math
  ; sci/consts.e16.ts:253  exactLiteral(v)
  mv a0, s0
  la t0, exactLiteral
  li t1, 2
  call far_call
  ; sci/consts.e16.ts:254  binary(divides === back ? M_MUL : M_DIV, 0)
  bne s2, s3, .L9
  li t0, 3
  j .L10
.L9:
  li t0, 4
.L10:
  mv a0, t0
  li a1, 0
  la t0, binary
  li t1, 0
  call far_call
.L4:
  ; sci/consts.e16.ts:256  copyValue(top(), KEEP_ANS)
  call top
  li a1, 3080
  call copyValue
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/consts.e16.ts:260 times(a, b) at -O1
;   a in s1
;   b in s2
times:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; a
  mv s2, a1 ; b
  ; sci/consts.e16.ts:261  pushInt(a, 0)
  mv a0, s1
  li a1, 0
  call pushInt
  ; sci/consts.e16.ts:262  binary(M_MUL, 0)
  li a0, 3
  li a1, 0
  la t0, binary
  li t1, 0
  call far_call
  ; sci/consts.e16.ts:263  pushInt(b, 0)
  mv a0, s2
  li a1, 0
  call pushInt
  ; sci/consts.e16.ts:264  binary(M_DIV, 0)
  li a0, 4
  li a1, 0
  la t0, binary
  li t1, 0
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/consts.e16.ts:268 convLabel() at -O1
convLabel:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/consts.e16.ts:269  fieldInto(convTable(), convDone, 0)
  ; sci/consts.e16.ts:171  return str(
  lw a1, 0x0936(zero)
  la a0, str_197
  li a2, 0
  call fieldInto
  ; sci/consts.e16.ts:270  return addr(fieldText)
  la a0, fieldText
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/consts.e16.ts:277 pageText(page, pages) at -O1
;   page in a0
;   pages in a1
pageText:
  ; sci/consts.e16.ts:278  pageChars[0] = 0x31 + page
  addi t0, a0, 49
  sb t0, pageChars(zero)
  ; sci/consts.e16.ts:279  pageChars[1] = 0x2f
  li t0, 47
  sb t0, pageChars+1(zero)
  ; sci/consts.e16.ts:280  pageChars[2] = 0x30 + pages
  addi t0, a1, 48
  sb t0, pageChars+2(zero)
  ; sci/consts.e16.ts:281  pageChars[3] = 0
  sb zero, pageChars+3(zero)
  ; sci/consts.e16.ts:282  return addr(pageChars)
  la a0, pageChars
.return:
  ret

; sci/consts.e16.ts:286 turnPage(page, pages, down) at -O1
;   page in s1
;   pages in s3
;   down in s2
turnPage:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; page
  mv s3, a1 ; pages
  mv s2, a2 ; down
  ; sci/consts.e16.ts:287  if (down && page + 1 < pages) return page + 1
  beqz s2, .L1
  addi t0, s1, 1
  bgeu t0, s3, .L1
  ; sci/consts.e16.ts:287  return page + 1
  addi a0, s1, 1
  j .return
.L1:
  ; sci/consts.e16.ts:288  if (!down && page > 0) return page - 1
  bnez s2, .L2
  bgeu zero, s1, .L2
  ; sci/consts.e16.ts:288  return page - 1
  addi a0, s1, -1
  j .return
.L2:
  ; sci/consts.e16.ts:289  refuse()
  call refuse
  ; sci/consts.e16.ts:290  return page
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

str_161:
  .byte 84, 65, 66, 76, 69, 0
str_162:
  .byte 88, 0
str_163:
  .byte 102, 40, 88, 41, 0
str_191:
  .byte 100, 47, 100, 120, 40, 124, 151, 40, 124, 144, 40, 124, 97, 114, 103, 40, 124, 99, 111, 110, 106, 40, 124, 82, 101, 40, 124, 73, 109, 40, 124, 100, 101, 116, 40, 124, 116, 114, 110, 40, 124, 100, 111, 116, 40, 124, 99, 114, 111, 115, 115, 40, 124, 97, 110, 103, 108, 101, 40, 124, 124, 124, 124, 124, 152, 124, 77, 97, 116, 65, 124, 77, 97, 116, 66, 124, 77, 97, 116, 67, 124, 77, 97, 116, 68, 124, 77, 97, 116, 65, 110, 115, 124, 124, 124, 225, 124, 226, 124, 227, 124, 228, 124, 108, 98, 108, 32, 124, 103, 111, 116, 111, 32, 0
str_192:
  .byte 115, 105, 110, 104, 40, 124, 99, 111, 115, 104, 40, 124, 116, 97, 110, 104, 40, 124, 115, 105, 110, 104, 134, 40, 124, 99, 111, 115, 104, 134, 40, 124, 116, 97, 110, 104, 134, 40, 124, 97, 98, 115, 40, 124, 103, 99, 100, 40, 124, 108, 99, 109, 40, 124, 105, 110, 116, 40, 124, 114, 111, 117, 110, 100, 40, 124, 112, 111, 108, 40, 124, 114, 101, 99, 40, 124, 114, 97, 110, 100, 124, 32, 65, 78, 68, 32, 124, 32, 79, 82, 32, 124, 32, 88, 79, 82, 32, 124, 32, 88, 78, 79, 82, 32, 124, 110, 111, 116, 40, 124, 110, 101, 103, 40, 124, 144, 121, 124, 144, 121, 132, 124, 144, 120, 121, 124, 114, 124, 97, 124, 98, 124, 120, 137, 40, 124, 121, 137, 40, 124, 99, 124, 120, 147, 137, 40, 0
str_193:
  .byte 110, 124, 149, 124, 145, 120, 124, 115, 120, 124, 150, 124, 145, 121, 124, 115, 121, 124, 144, 120, 124, 144, 120, 132, 0
str_194:
  .byte 99, 153, 124, 76, 73, 71, 72, 84, 124, 50, 57, 57, 55, 57, 50, 52, 53, 56, 124, 104, 124, 80, 76, 65, 78, 67, 75, 124, 54, 46, 54, 50, 54, 48, 55, 48, 49, 53, 69, 45, 51, 52, 124, 157, 124, 80, 76, 65, 78, 67, 75, 47, 50, 128, 124, 49, 46, 48, 53, 52, 53, 55, 49, 56, 49, 55, 54, 53, 69, 45, 51, 52, 124, 71, 124, 71, 82, 65, 86, 73, 84, 65, 84, 73, 79, 78, 124, 54, 46, 54, 55, 52, 51, 48, 69, 45, 49, 49, 124, 158, 153, 124, 69, 76, 69, 67, 84, 82, 73, 67, 124, 56, 46, 56, 53, 52, 49, 56, 55, 56, 49, 56, 56, 69, 45, 49, 50, 124, 159, 153, 124, 77, 65, 71, 78, 69, 84, 73, 67, 124, 49, 46, 50, 53, 54, 54, 51, 55, 48, 54, 49, 50, 55, 69, 45, 54, 124, 113, 154, 124, 67, 72, 65, 82, 71, 69, 124, 49, 46, 54, 48, 50, 49, 55, 54, 54, 51, 52, 69, 45, 49, 57, 124, 109, 154, 124, 69, 76, 69, 67, 84, 82, 79, 78, 124, 57, 46, 49, 48, 57, 51, 56, 51, 55, 49, 51, 57, 69, 45, 51, 49, 124, 109, 155, 124, 80, 82, 79, 84, 79, 78, 124, 49, 46, 54, 55, 50, 54, 50, 49, 57, 50, 53, 57, 53, 69, 45, 50, 55, 124, 109, 156, 124, 78, 69, 85, 84, 82, 79, 78, 124, 49, 46, 54, 55, 52, 57, 50, 55, 53, 48, 48, 53, 54, 69, 45, 50, 55, 124, 117, 124, 65, 84, 79, 77, 73, 67, 32, 77, 65, 83, 83, 124, 49, 46, 54, 54, 48, 53, 51, 57, 48, 54, 56, 57, 50, 69, 45, 50, 55, 124, 78, 65, 124, 65, 86, 79, 71, 65, 68, 82, 79, 124, 54, 46, 48, 50, 50, 49, 52, 48, 55, 54, 69, 50, 51, 124, 107, 124, 66, 79, 76, 84, 90, 77, 65, 78, 78, 124, 49, 46, 51, 56, 48, 54, 52, 57, 69, 45, 50, 51, 124, 82, 124, 71, 65, 83, 124, 56, 46, 51, 49, 52, 52, 54, 50, 54, 49, 56, 49, 53, 124, 145, 124, 83, 84, 69, 70, 65, 78, 45, 66, 79, 76, 84, 90, 77, 65, 78, 78, 124, 53, 46, 54, 55, 48, 51, 55, 52, 52, 49, 57, 49, 56, 69, 45, 56, 124, 103, 124, 71, 82, 65, 86, 73, 84, 89, 124, 57, 46, 56, 48, 54, 54, 53, 124, 97, 116, 109, 124, 65, 84, 77, 79, 83, 80, 72, 69, 82, 69, 124, 49, 48, 49, 51, 50, 53, 124, 97, 153, 124, 66, 79, 72, 82, 32, 82, 65, 68, 73, 85, 83, 124, 53, 46, 50, 57, 49, 55, 55, 50, 49, 48, 53, 52, 52, 69, 45, 49, 49, 124, 224, 124, 70, 73, 78, 69, 32, 83, 84, 82, 85, 67, 84, 85, 82, 69, 124, 55, 46, 50, 57, 55, 51, 53, 50, 53, 54, 52, 51, 69, 45, 51, 124, 86, 109, 124, 77, 79, 76, 65, 82, 32, 86, 79, 76, 85, 77, 69, 124, 50, 46, 50, 52, 49, 51, 57, 54, 57, 53, 52, 53, 48, 69, 45, 50, 0
str_195:
  .byte 67, 79, 78, 83, 84, 0
str_196:
  .byte 141, 142, 58, 80, 65, 71, 69, 32, 65, 67, 58, 66, 65, 67, 75, 0
str_197:
  .byte 105, 110, 148, 99, 109, 124, 99, 109, 148, 105, 110, 124, 102, 116, 148, 109, 124, 109, 148, 102, 116, 124, 121, 100, 148, 109, 124, 109, 148, 121, 100, 124, 109, 105, 108, 101, 148, 107, 109, 124, 107, 109, 148, 109, 105, 108, 101, 124, 110, 109, 105, 148, 109, 124, 109, 148, 110, 109, 105, 124, 97, 99, 114, 101, 148, 109, 132, 124, 109, 132, 148, 97, 99, 114, 101, 124, 103, 97, 108, 148, 76, 124, 76, 148, 103, 97, 108, 124, 102, 108, 111, 122, 148, 109, 76, 124, 109, 76, 148, 102, 108, 111, 122, 124, 111, 122, 148, 103, 124, 103, 148, 111, 122, 124, 108, 98, 148, 107, 103, 124, 107, 103, 148, 108, 98, 124, 136, 70, 148, 136, 67, 124, 136, 67, 148, 136, 70, 124, 107, 109, 47, 104, 148, 109, 47, 115, 124, 109, 47, 115, 148, 107, 109, 47, 104, 124, 107, 103, 102, 148, 78, 124, 78, 148, 107, 103, 102, 124, 97, 116, 109, 148, 80, 97, 124, 80, 97, 148, 97, 116, 109, 124, 109, 109, 72, 103, 148, 80, 97, 124, 80, 97, 148, 109, 109, 72, 103, 124, 107, 103, 102, 109, 148, 74, 124, 74, 148, 107, 103, 102, 109, 124, 99, 97, 108, 148, 74, 124, 74, 148, 99, 97, 108, 124, 104, 112, 148, 87, 124, 87, 148, 104, 112, 124, 107, 87, 104, 148, 77, 74, 124, 77, 74, 148, 107, 87, 104, 124, 101, 86, 148, 74, 124, 74, 148, 101, 86, 0
str_198:
  .byte 50, 46, 53, 52, 124, 48, 46, 51, 48, 52, 56, 124, 48, 46, 57, 49, 52, 52, 124, 49, 46, 54, 48, 57, 51, 52, 52, 124, 49, 56, 53, 50, 124, 52, 48, 52, 54, 46, 56, 53, 54, 52, 50, 50, 52, 124, 51, 46, 55, 56, 53, 52, 49, 49, 55, 56, 52, 124, 50, 57, 46, 53, 55, 51, 53, 50, 57, 53, 54, 50, 53, 124, 50, 56, 46, 51, 52, 57, 53, 50, 51, 49, 50, 53, 124, 48, 46, 52, 53, 51, 53, 57, 50, 51, 55, 124, 124, 47, 51, 46, 54, 124, 57, 46, 56, 48, 54, 54, 53, 124, 49, 48, 49, 51, 50, 53, 124, 49, 51, 51, 46, 51, 50, 50, 51, 56, 55, 52, 49, 53, 124, 57, 46, 56, 48, 54, 54, 53, 124, 52, 46, 49, 56, 52, 124, 55, 52, 53, 46, 54, 57, 57, 56, 55, 49, 53, 56, 50, 124, 51, 46, 54, 124, 49, 46, 54, 48, 50, 49, 55, 54, 54, 51, 52, 69, 45, 49, 57, 0
str_199:
  .byte 67, 79, 78, 86, 0
  .align 2

  .bank 11
  .org 0xc000
; sci/equation.e16.ts:70 kind() at -O1
kind:
  ; sci/equation.e16.ts:71  return peek(EQN_TYPE)
  lbu a0, 5638(zero)
.return:
  ret

; sci/equation.e16.ts:80 colsOf(k) at -O1
;   k in a0
colsOf:
  ; sci/equation.e16.ts:81  return k === 1 || k === 3 ? 3 : 4
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

; sci/equation.e16.ts:84 coeff(r, c) at -O1
;   r in s1
;   c in s2
coeff:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; r
  mv s2, a1 ; c
  ; sci/equation.e16.ts:85  return EQN_COEFFS + (r * colsOf(kind()) + c) * VALUE_SIZE
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

; sci/equation.e16.ts:88 rootAt(k) at -O1
;   k in a0
rootAt:
  ; sci/equation.e16.ts:89  return ROOTS + k * VALUE_SIZE
  slli t1, a0, 5
  slli t0, a0, 2
  add t0, t0, t1
  li t1, 8448
  add a0, t1, t0
.return:
  ret

; sci/equation.e16.ts:92 imAt(k) at -O1
;   k in a0
imAt:
  ; sci/equation.e16.ts:93  return IMAGINARY + k * VALUE_SIZE
  slli t1, a0, 5
  slli t0, a0, 2
  add t0, t0, t1
  li t1, 8556
  add a0, t1, t0
.return:
  ret

; sci/equation.e16.ts:99 eqnStart() at -O1
eqnStart:
  ; sci/equation.e16.ts:100  eqPhase = EQ_TYPE
  sw zero, 0x090e(zero)
.return:
  ret

; sci/equation.e16.ts:104 eqnReset() at -O1
;   rowsOf.k in s1
eqnReset:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/equation.e16.ts:105  if (kind() === 0) {
  call kind
  bne a0, zero, .L1
  ; sci/equation.e16.ts:106  eqPhase = EQ_TYPE
  sw zero, 0x090e(zero)
  ; sci/equation.e16.ts:107  return
  j .return
.L1:
  ; sci/equation.e16.ts:109  eqPhase = EQ_GRID
  li t0, 1
  sw t0, 0x090e(zero)
  ; sci/equation.e16.ts:110  gridOpen(GRID_EQN, rowsOf(kind()), colsOf(kind()))
  call kind
  mv s1, a0 ; rowsOf.k
  ; sci/equation.e16.ts:76  if (k === 1) return 2
  li t0, 1
  mv t1, s1
  li t2, 1
  bne t1, t2, .I1.L1
  ; sci/equation.e16.ts:76  return 2
  li t1, 2
  j .I1_end
.I1.L1:
  ; sci/equation.e16.ts:77  return k === 2 ? 3 : 1
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

; sci/equation.e16.ts:114 eqnKey(k/r, shift) at -O1
;   k/r in s1
;   shift in s2
eqnKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/r
  mv s2, a1 ; shift
  ; sci/equation.e16.ts:115  if (eqPhase === EQ_TYPE) return eqTypeKey(k)
  lw t0, 0x090e(zero)
  bne t0, zero, .L1
  ; sci/equation.e16.ts:115  return eqTypeKey(k)
  mv a0, s1
  call eqTypeKey
  j .return
.L1:
  ; sci/equation.e16.ts:116  if (eqPhase === EQ_RESULT) eqResultKey(k)
  lw t0, 0x090e(zero)
  li t1, 2
  bne t0, t1, .L2
  ; sci/equation.e16.ts:116  eqResultKey(k)
  mv a0, s1
  call eqResultKey
  j .L3
.L2:
  ; sci/equation.e16.ts:118  const r = gridKey(k, shift)
  mv a0, s1
  mv a1, s2
  la t0, gridKey
  li t1, 9
  call far_call
  mv s1, a0 ; k/r
  ; sci/equation.e16.ts:119  if (r === GRID_DONE) {
  li t0, 1
  bne s1, t0, .L4
  ; sci/equation.e16.ts:120  solve()
  call solve
  ; sci/equation.e16.ts:121  vertex = false
  sw zero, 0x0910(zero)
  ; sci/equation.e16.ts:122  eqPhase = EQ_RESULT
  li t0, 2
  sw t0, 0x090e(zero)
  j .L5
.L4:
  ; sci/equation.e16.ts:123  if (r === GRID_AC) eqPhase = EQ_TYPE
  li t0, 2
  bne s1, t0, .L6
  ; sci/equation.e16.ts:123  eqPhase = EQ_TYPE
  sw zero, 0x090e(zero)
.L6:
.L5:
.L3:
  ; sci/equation.e16.ts:125  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/equation.e16.ts:132 eqTypeKey(k/i) at -O1
;   k/i in s1
;   chosen in s2
eqTypeKey:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k/i
  ; sci/equation.e16.ts:133  const chosen = typeOf(k)
  mv a0, s1
  call typeOf
  mv s2, a0 ; chosen
  ; sci/equation.e16.ts:134  if (chosen !== 0) {
  beq s2, zero, .L1
  ; sci/equation.e16.ts:135  if (chosen !== kind()) {
  call kind
  beq s2, a0, .L2
  ; sci/equation.e16.ts:136  poke(EQN_TYPE, chosen)
  sb s2, 5638(zero)
  ; sci/equation.e16.ts:137  for (let i: u16 = 0; i < 12; i++) zeroValue(EQN_COEFFS + i * VALUE_SIZE)
  li s1, 0 ; k/i
  j .L5
.L3:
  ; sci/equation.e16.ts:137  zeroValue(EQN_COEFFS + i * VALUE_SIZE)
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
  ; sci/equation.e16.ts:139  eqnReset()
  call eqnReset
  j .L7
.L1:
  ; sci/equation.e16.ts:140  if (k === K_AC) {
  li t0, 5
  bne s1, t0, .L8
  ; sci/equation.e16.ts:141  if (kind() === 0) return true
  call kind
  bne a0, zero, .L9
  ; sci/equation.e16.ts:141  return true
  li a0, 1
  j .return
.L9:
  ; sci/equation.e16.ts:142  eqnReset()
  call eqnReset
  j .L10
.L8:
  ; sci/equation.e16.ts:143  refuse()
  call refuse
.L10:
.L7:
  ; sci/equation.e16.ts:144  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sci/equation.e16.ts:148 typeOf(k) at -O1
;   k in a0
typeOf:
  ; sci/equation.e16.ts:149  if (k === K_1) return 1
  li t0, 56
  bne a0, t0, .L1
  ; sci/equation.e16.ts:149  return 1
  li a0, 1
  ret
.L1:
  ; sci/equation.e16.ts:150  if (k === K_2) return 2
  li t0, 57
  bne a0, t0, .L2
  ; sci/equation.e16.ts:150  return 2
  li a0, 2
  ret
.L2:
  ; sci/equation.e16.ts:151  if (k === K_3) return 3
  li t0, 58
  bne a0, t0, .L3
  ; sci/equation.e16.ts:151  return 3
  li a0, 3
  ret
.L3:
  ; sci/equation.e16.ts:152  return k === K_4 ? 4 : 0
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

; sci/equation.e16.ts:155 eqResultKey(k) at -O1
;   k in s1
eqResultKey:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/equation.e16.ts:156  if (k === K_AC) eqPhase = EQ_GRID
  li t0, 5
  bne s1, t0, .L1
  ; sci/equation.e16.ts:156  eqPhase = EQ_GRID
  li t0, 1
  sw t0, 0x090e(zero)
  j .L2
.L1:
  ; sci/equation.e16.ts:157  if (kind() === 3 && (k === K_DOWN || k === K_UP)) vertex = k === K_DOWN
  call kind
  li t0, 3
  bne a0, t0, .L3
  li t0, 1
  beq s1, t0, .L4
  bne s1, zero, .L3
.L4:
  ; sci/equation.e16.ts:157  vertex = k === K_DOWN
  li t0, 1
  sub t0, s1, t0
  seqz t0, t0
  sw t0, 0x0910(zero)
  j .L5
.L3:
  ; sci/equation.e16.ts:158  refuse()
  call refuse
.L5:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/equation.e16.ts:162 zeroValue(v) at -O1
;   v in s2
;   i in s1
zeroValue:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; v
  ; sci/equation.e16.ts:163  for (let i: u16 = 0; i < VALUE_SIZE; i++) poke(v + i, 0)
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/equation.e16.ts:163  poke(v + i, 0)
  add t0, s2, s1
  sb zero, 0(t0)
  addi s1, s1, 1
.L3:
  li t0, 36
  bltu s1, t0, .L1
  ; sci/equation.e16.ts:164  exactWhole(v)
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

; sci/equation.e16.ts:169 eqnDraw() at -O1
eqnDraw:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/equation.e16.ts:170  cls()
  call cls
  ; sci/equation.e16.ts:171  if (eqPhase === EQ_TYPE) eqDrawType()
  lw t0, 0x090e(zero)
  bne t0, zero, .L1
  ; sci/equation.e16.ts:171  eqDrawType()
  call eqDrawType
  j .L2
.L1:
  ; sci/equation.e16.ts:172  if (eqPhase === EQ_GRID) {
  lw t0, 0x090e(zero)
  li t1, 1
  bne t0, t1, .L3
  ; sci/equation.e16.ts:173  band(titleOf(kind()))
  call kind
  call titleOf
  call band
  ; sci/equation.e16.ts:174  gridDraw()
  la t0, gridDraw
  li t1, 9
  call far_call
  j .L4
.L3:
  ; sci/equation.e16.ts:175  eqDrawResults()
  call eqDrawResults
.L4:
.L2:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sci/equation.e16.ts:178 titleOf(k) at -O1
;   k in a0
titleOf:
  ; sci/equation.e16.ts:179  if (k === 1) return str('aX+bY=c')
  li t0, 1
  bne a0, t0, .L1
  ; sci/equation.e16.ts:179  return str('aX+bY=c')
  la a0, str_164
  ret
.L1:
  ; sci/equation.e16.ts:180  if (k === 2) return str('aX+bY+cZ=d')
  li t0, 2
  bne a0, t0, .L2
  ; sci/equation.e16.ts:180  return str('aX+bY+cZ=d')
  la a0, str_165
  ret
.L2:
  ; sci/equation.e16.ts:181  if (k === 3) return str('aX\x84+bX+c=0')
  li t0, 3
  bne a0, t0, .L3
  ; sci/equation.e16.ts:181  return str('aX\x84+bX+c=0')
  la a0, str_166
  ret
.L3:
  ; sci/equation.e16.ts:182  return str('aX\x85+bX\x84+cX+d=0')
  la a0, str_167
.return:
  ret

; sci/equation.e16.ts:185 eqDrawType() at -O1
;   k in s1
eqDrawType:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/equation.e16.ts:186  band(str('EQUATION'))
  la a0, str_168
  call band
  ; sci/equation.e16.ts:187  textAt(str('1:aX+bY=c'), 1, lineY(0))
  la a0, str_169
  li a1, 1
  li a2, 11
  call textAt
  ; sci/equation.e16.ts:188  textAt(str('2:aX+bY+cZ=d'), 1, lineY(1))
  la a0, str_170
  li a1, 1
  li a2, 20
  call textAt
  ; sci/equation.e16.ts:189  textAt(str('3:aX\x84+bX+c=0'), 1, lineY(2))
  la a0, str_171
  li a1, 1
  li a2, 29
  call textAt
  ; sci/equation.e16.ts:190  textAt(str('4:aX\x85+bX\x84+cX+d=0'), 1, lineY(3))
  la a0, str_172
  li a1, 1
  li a2, 38
  call textAt
  ; sci/equation.e16.ts:191  textAt(str('AC:BACK'), 1, lineY(5))
  la a0, str_173
  li a1, 1
  li a2, 56
  call textAt
  ; sci/equation.e16.ts:192  const k = kind()
  call kind
  mv s1, a0 ; k
  ; sci/equation.e16.ts:193  if (k !== 0) mark(0, 2, k - 1)
  beq s1, zero, .L1
  ; sci/equation.e16.ts:193  mark(0, 2, k - 1)
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

; sci/equation.e16.ts:197 eqDrawResults() at -O1
;   twoD in s2
;   k in s1
;   foot in s3
eqDrawResults:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  ; sci/equation.e16.ts:198  const twoD = peek(KEEP_DISPLAY) === 0
  lbu t0, 3075(zero)
  sub t0, t0, zero
  seqz s2, t0
  ; sci/equation.e16.ts:199  if (!unique) {
  lw t0, 0x0914(zero)
  bnez t0, .L1
  ; sci/equation.e16.ts:200  band(titleOf(kind()))
  call kind
  call titleOf
  call band
  ; sci/equation.e16.ts:201  textAt(str('NO ONE SOLUTION:'), 1, lineY(0))
  la a0, str_174
  li a1, 1
  li a2, 11
  call textAt
  ; sci/equation.e16.ts:202  textAt(str('NONE, OR MANY'), 1, lineY(1))
  la a0, str_175
  li a1, 1
  li a2, 20
  call textAt
  ; sci/equation.e16.ts:203  textAt(str('AC:EDIT'), 1, lineY(5))
  la a0, str_176
  li a1, 1
  li a2, 56
  call textAt
  ; sci/equation.e16.ts:204  return
  j .return
.L1:
  ; sci/equation.e16.ts:206  if (vertex) {
  lw t0, 0x0910(zero)
  beqz t0, .L2
  ; sci/equation.e16.ts:207  textAt(str('VERTEX'), 1, 0)
  la a0, str_177
  li a1, 1
  li a2, 0
  call textAt
  ; sci/equation.e16.ts:208  textAt(str('X='), 1, 21)
  la a0, str_178
  li a1, 1
  li a2, 21
  call textAt
  ; sci/equation.e16.ts:209  drawValueAt(VERTEX, 28, twoD)
  li a0, 8664
  li a1, 28
  mv a2, s2
  la t0, drawValueAt
  li t1, 5
  call far_call
  ; sci/equation.e16.ts:210  textAt(str('Y='), 1, 42)
  la a0, str_179
  li a1, 1
  li a2, 42
  call textAt
  ; sci/equation.e16.ts:211  drawValueAt(VERTEX + VALUE_SIZE, 49, twoD)
  li a0, 8700
  li a1, 49
  mv a2, s2
  la t0, drawValueAt
  li t1, 5
  call far_call
  ; sci/equation.e16.ts:212  textAt(str('\x8d:ROOTS  AC:EDIT'), 1, 56)
  la a0, str_180
  li a1, 1
  li a2, 56
  call textAt
  ; sci/equation.e16.ts:213  return
  j .return
.L2:
  ; sci/equation.e16.ts:215  for (let k: u16 = 0; k < answers; k++) {
  li s1, 0 ; k
  j .L5
.L3:
  ; sci/equation.e16.ts:216  const foot = 14 + 21 * k
  li t0, 21
  mul t0, t0, s1
  addi s3, t0, 14
  ; sci/equation.e16.ts:217  textAt(labelOf(k), 1, foot - 7)
  mv a0, s1
  call labelOf
  li a1, 1
  addi a2, s3, -7
  call textAt
  ; sci/equation.e16.ts:218  if (isZero(imAt(k))) drawValueAt(rootAt(k), foot, twoD)
  mv a0, s1
  call imAt
  call isZero
  beqz a0, .L7
  ; sci/equation.e16.ts:218  drawValueAt(rootAt(k), foot, twoD)
  mv a0, s1
  call rootAt
  mv a1, s3
  mv a2, s2
  la t0, drawValueAt
  li t1, 5
  call far_call
  j .L8
.L7:
  ; sci/equation.e16.ts:219  complexAt(k, foot)
  mv a0, s1
  mv a1, s3
  call complexAt
.L8:
  addi s1, s1, 1
.L5:
  lw t0, 0x0912(zero)
  bltu s1, t0, .L3
  ; sci/equation.e16.ts:221  if (kind() === 3) textAt(str('\x8e:VERTEX  AC:EDIT'), 1, 56)
  call kind
  li t0, 3
  bne a0, t0, .L9
  ; sci/equation.e16.ts:221  textAt(str('\x8e:VERTEX  AC:EDIT'), 1, 56)
  la a0, str_181
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

; sci/equation.e16.ts:225 complexAt(k, foot) at -O1
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
  ; sci/equation.e16.ts:226  const minus = isNegative(imAt(k))
  mv a0, s1
  call imAt
  call isNegative
  mv s2, a0 ; minus
  ; sci/equation.e16.ts:227  copyValue(imAt(k), E1)
  mv a0, s1
  call imAt
  li a1, 9168
  call copyValue
  ; sci/equation.e16.ts:228  if (minus) vneg(E1)
  beqz s2, .L1
  ; sci/equation.e16.ts:228  vneg(E1)
  li a0, 9168
  call vneg
.L1:
  ; sci/equation.e16.ts:229  drawComplexAt(rootAt(k), E1, minus, foot)
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

; sci/equation.e16.ts:232 labelOf(k) at -O1
;   k in s1
labelOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; sci/equation.e16.ts:233  if (kind() <= 2) return k === 0 ? str('X=') : k === 1 ? str('Y=') : str('Z=')
  call kind
  li t0, 2
  bltu t0, a0, .L1
  ; sci/equation.e16.ts:233  return k === 0 ? str('X=') : k === 1 ? str('Y=') : str('Z=')
  bne s1, zero, .L2
  la t0, str_178
  j .L3
.L2:
  li t0, 1
  bne s1, t0, .L4
  la t0, str_179
  j .L5
.L4:
  la t0, str_182
.L5:
.L3:
  mv a0, t0
  j .return
.L1:
  ; sci/equation.e16.ts:234  return k === 0 ? str('X1=') : k === 1 ? str('X2=') : str('X3=')
  bne s1, zero, .L6
  la t0, str_183
  j .L7
.L6:
  li t0, 1
  bne s1, t0, .L8
  la t0, str_184
  j .L9
.L8:
  la t0, str_185
.L9:
.L7:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/equation.e16.ts:240 vop(op, a, b) at -O1
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
  ; sci/equation.e16.ts:241  math(op, a, b, 0)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  li a3, 0
  call math
  ; sci/equation.e16.ts:242  exactBinary(op, a, b)
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

; sci/equation.e16.ts:245 vneg(a) at -O1
;   a in s1
vneg:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; a
  ; sci/equation.e16.ts:246  math(M_NEG, a, 0, 0)
  li a0, 16
  mv a1, s1
  li a2, 0
  li a3, 0
  call math
  ; sci/equation.e16.ts:247  exactNeg(a)
  mv a0, s1
  la t0, exactNeg
  li t1, 2
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/equation.e16.ts:250 solve() at -O1
;   k in s1
solve:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/equation.e16.ts:251  unique = true
  li t0, 1
  sw t0, 0x0914(zero)
  ; sci/equation.e16.ts:252  for (let k: u16 = 0; k < 3; k++) zeroValue(imAt(k))
  li s1, 0 ; k
  j .L3
.L1:
  ; sci/equation.e16.ts:252  zeroValue(imAt(k))
  mv a0, s1
  call imAt
  call zeroValue
  addi s1, s1, 1
.L3:
  li t0, 3
  bltu s1, t0, .L1
  ; sci/equation.e16.ts:253  const k = kind()
  call kind
  mv s1, a0 ; k
  ; sci/equation.e16.ts:254  if (k <= 2) linear(k + 1)
  li t0, 2
  bltu t0, s1, .L5
  ; sci/equation.e16.ts:254  linear(k + 1)
  addi a0, s1, 1
  call linear
  j .L6
.L5:
  ; sci/equation.e16.ts:255  if (k === 3) {
  li t0, 3
  bne s1, t0, .L7
  ; sci/equation.e16.ts:256  quadratic(coeff(0, 0), coeff(0, 1), coeff(0, 2), 0)
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
  ; sci/equation.e16.ts:257  answers = 2
  li t0, 2
  sw t0, 0x0912(zero)
  ; sci/equation.e16.ts:258  vertexOf()
  call vertexOf
  j .L8
.L7:
  ; sci/equation.e16.ts:259  cubic()
  call cubic
.L8:
.L6:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/equation.e16.ts:264 cell(r, c, n) at -O1
;   r in a0
;   c in a1
;   n in a2
cell:
  ; sci/equation.e16.ts:265  return MATRIX + (r * (n + 1) + c) * VALUE_SIZE
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

; sci/equation.e16.ts:268 linear(n) at -O1
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
  ; sci/equation.e16.ts:269  answers = n
  sw s3, 0x0912(zero)
  ; sci/equation.e16.ts:270  for (let r: u16 = 0; r < n; r++) {
  li s1, 0 ; r/k/i
  j .L3
.L1:
  ; sci/equation.e16.ts:271  for (let c: u16 = 0; c <= n; c++) copyValue(coeff(r, c), cell(r, c, n))
  li s2, 0 ; c/p/i
  j .L7
.L5:
  ; sci/equation.e16.ts:271  copyValue(coeff(r, c), cell(r, c, n))
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
  ; sci/equation.e16.ts:273  for (let k: u16 = 0; k < n; k++) {
  li s1, 0 ; r/k/i
  j .L11
.L9:
  ; sci/equation.e16.ts:274  const p = pivotRow(k, n)
  mv a0, s1
  mv a1, s3
  call pivotRow
  mv s2, a0 ; c/p/i
  ; sci/equation.e16.ts:275  if (isZero(cell(p, k, n))) {
  mv a0, s2
  mv a1, s1
  mv a2, s3
  call cell
  call isZero
  beqz a0, .L13
  ; sci/equation.e16.ts:276  unique = false
  sw zero, 0x0914(zero)
  ; sci/equation.e16.ts:277  return
  j .return
.L13:
  ; sci/equation.e16.ts:279  if (p !== k) swapRows(p, k, n)
  beq s2, s1, .L14
  ; sci/equation.e16.ts:279  swapRows(p, k, n)
  mv a0, s2
  mv a1, s1
  mv a2, s3
  call swapRows
.L14:
  ; sci/equation.e16.ts:280  for (let i = k + 1; i < n; i++) eliminate(i, k, n)
  addi s2, s1, 1
  j .L17
.L15:
  ; sci/equation.e16.ts:280  eliminate(i, k, n)
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
  ; sci/equation.e16.ts:282  for (let i = n; i > 0; i--) backSubstitute(i - 1, n)
  mv s1, s3 ; r/k/i
  j .L21
.L19:
  ; sci/equation.e16.ts:282  backSubstitute(i - 1, n)
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

; sci/equation.e16.ts:286 pivotRow(k, n) at -O1
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
  ; sci/equation.e16.ts:287  let best = k
  mv s0, s2 ; best
  ; sci/equation.e16.ts:288  for (let i = k + 1; i < n; i++) {
  addi s1, s2, 1
  j .L3
.L1:
  ; sci/equation.e16.ts:289  copyValue(cell(i, k, n), E1)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call cell
  li a1, 9168
  call copyValue
  ; sci/equation.e16.ts:290  math(M_ABS, E1, 0, 0)
  li a0, 17
  li a1, 9168
  li a2, 0
  li a3, 0
  call math
  ; sci/equation.e16.ts:291  copyValue(cell(best, k, n), E2)
  mv a0, s0
  mv a1, s2
  mv a2, s3
  call cell
  li a1, 9204
  call copyValue
  ; sci/equation.e16.ts:292  math(M_ABS, E2, 0, 0)
  li a0, 17
  li a1, 9204
  li a2, 0
  li a3, 0
  call math
  ; sci/equation.e16.ts:293  math(M_CMP, E1, E2, 0)
  li a0, 6
  li a1, 9168
  li a2, 9204
  li a3, 0
  call math
  ; sci/equation.e16.ts:294  if (peek16(MATH_RESULT) === 1) best = i
  li t0, 65370
  lw t0, 0(t0)
  li t1, 1
  bne t0, t1, .L5
  ; sci/equation.e16.ts:294  best = i
  mv s0, s1 ; best
.L5:
  addi s1, s1, 1
.L3:
  bltu s1, s3, .L1
  ; sci/equation.e16.ts:296  return best
  mv a0, s0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sci/equation.e16.ts:299 swapRows(a, b, n) at -O1
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
  ; sci/equation.e16.ts:300  for (let c: u16 = 0; c <= n; c++) {
  li s1, 0 ; c
  j .L3
.L1:
  ; sci/equation.e16.ts:301  copyValue(cell(a, c, n), E1)
  mv a0, s3
  mv a1, s1
  mv a2, s2
  call cell
  li a1, 9168
  call copyValue
  ; sci/equation.e16.ts:302  copyValue(cell(b, c, n), cell(a, c, n))
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
  ; sci/equation.e16.ts:303  copyValue(E1, cell(b, c, n))
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

; sci/equation.e16.ts:308 eliminate(i, k, n) at -O1
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
  ; sci/equation.e16.ts:309  copyValue(cell(i, k, n), E3)
  mv a0, s0
  mv a1, s1
  mv a2, s2
  call cell
  li a1, 9240
  call copyValue
  ; sci/equation.e16.ts:310  vop(M_DIV, E3, cell(k, k, n))
  mv a0, s1
  mv a1, s1
  mv a2, s2
  call cell
  li a1, 9240
  mv a2, a0
  li a0, 4
  call vop
  ; sci/equation.e16.ts:311  for (let c = k; c <= n; c++) {
  mv s3, s1 ; c
  j .L3
.L1:
  ; sci/equation.e16.ts:312  copyValue(cell(k, c, n), E1)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call cell
  li a1, 9168
  call copyValue
  ; sci/equation.e16.ts:313  vop(M_MUL, E1, E3)
  li a0, 3
  li a1, 9168
  li a2, 9240
  call vop
  ; sci/equation.e16.ts:314  vop(M_SUB, cell(i, c, n), E1)
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

; sci/equation.e16.ts:319 backSubstitute(i, n) at -O1
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
  ; sci/equation.e16.ts:320  copyValue(cell(i, n, n), E2)
  mv a0, s1
  mv a1, s2
  mv a2, s2
  call cell
  li a1, 9204
  call copyValue
  ; sci/equation.e16.ts:321  for (let j = i + 1; j < n; j++) {
  addi s3, s1, 1
  j .L3
.L1:
  ; sci/equation.e16.ts:322  copyValue(cell(i, j, n), E1)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call cell
  li a1, 9168
  call copyValue
  ; sci/equation.e16.ts:323  vop(M_MUL, E1, rootAt(j))
  mv a0, s3
  call rootAt
  li a1, 9168
  mv a2, a0
  li a0, 3
  call vop
  ; sci/equation.e16.ts:324  vop(M_SUB, E2, E1)
  li a0, 2
  li a1, 9204
  li a2, 9168
  call vop
  addi s3, s3, 1
.L3:
  bltu s3, s2, .L1
  ; sci/equation.e16.ts:326  vop(M_DIV, E2, cell(i, i, n))
  mv a0, s1
  mv a1, s1
  mv a2, s2
  call cell
  li a1, 9204
  mv a2, a0
  li a0, 4
  call vop
  ; sci/equation.e16.ts:327  copyValue(E2, rootAt(i))
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

; sci/equation.e16.ts:334 quadratic(a, b/small, c, first) at -O1
;   a in s3
;   b/small in s2
;   c in s0
;   first in s1
;   complex in 0(sp)
quadratic:
  addi sp, sp, -12
  sw ra, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  sw s1, 10(sp)
  mv s3, a0 ; a
  mv s2, a1 ; b/small
  mv s0, a2 ; c
  mv s1, a3 ; first
  ; sci/equation.e16.ts:335  if (isZero(a)) fail(E_MATH, 0)
  mv a0, s3
  call isZero
  beqz a0, .L1
  ; sci/equation.e16.ts:335  fail(E_MATH, 0)
  li a0, 1
  li a1, 0
  call fail
.L1:
  ; sci/equation.e16.ts:336  copyValue(b, E1)
  mv a0, s2
  li a1, 9168
  call copyValue
  ; sci/equation.e16.ts:337  vop(M_MUL, E1, b)
  li a0, 3
  li a1, 9168
  mv a2, s2
  call vop
  ; sci/equation.e16.ts:338  copyValue(a, E2)
  mv a0, s3
  li a1, 9204
  call copyValue
  ; sci/equation.e16.ts:339  vop(M_MUL, E2, c)
  li a0, 3
  li a1, 9204
  mv a2, s0
  call vop
  ; sci/equation.e16.ts:340  eqSmall(E3, 4)
  li a0, 9240
  li a1, 4
  call eqSmall
  ; sci/equation.e16.ts:341  vop(M_MUL, E2, E3)
  li a0, 3
  li a1, 9204
  li a2, 9240
  call vop
  ; sci/equation.e16.ts:342  vop(M_SUB, E1, E2)
  li a0, 2
  li a1, 9168
  li a2, 9204
  call vop
  ; sci/equation.e16.ts:344  copyValue(a, E2)
  mv a0, s3
  li a1, 9204
  call copyValue
  ; sci/equation.e16.ts:345  eqSmall(E3, 2)
  li a0, 9240
  li a1, 2
  call eqSmall
  ; sci/equation.e16.ts:346  vop(M_MUL, E2, E3)
  li a0, 3
  li a1, 9204
  li a2, 9240
  call vop
  ; sci/equation.e16.ts:347  copyValue(b, E3)
  mv a0, s2
  li a1, 9240
  call copyValue
  ; sci/equation.e16.ts:348  vneg(E3)
  li a0, 9240
  call vneg
  ; sci/equation.e16.ts:349  const complex = isNegative(E1)
  li a0, 9168
  call isNegative
  sw a0, 0(sp) ; complex
  ; sci/equation.e16.ts:350  if (complex) vneg(E1)
  lw t0, 0(sp) ; complex
  beqz t0, .L2
  ; sci/equation.e16.ts:350  vneg(E1)
  li a0, 9168
  call vneg
.L2:
  ; sci/equation.e16.ts:351  math(M_SQR, E1, 0, 0)
  li a0, 21
  li a1, 9168
  li a2, 0
  li a3, 0
  call math
  ; sci/equation.e16.ts:352  exactSqrt(E1)
  li a0, 9168
  la t0, exactSqrt
  li t1, 2
  call far_call
  ; sci/equation.e16.ts:353  if (complex) {
  lw t0, 0(sp) ; complex
  beqz t0, .L3
  ; sci/equation.e16.ts:354  complexRoots(first)
  mv a0, s1
  call complexRoots
  ; sci/equation.e16.ts:355  return
  j .return
.L3:
  ; sci/equation.e16.ts:357  copyValue(E3, rootAt(first))
  mv a0, s1
  call rootAt
  mv a1, a0
  li a0, 9240
  call copyValue
  ; sci/equation.e16.ts:358  vop(M_ADD, rootAt(first), E1)
  mv a0, s1
  call rootAt
  mv a1, a0
  li a0, 1
  li a2, 9168
  call vop
  ; sci/equation.e16.ts:359  vop(M_DIV, rootAt(first), E2)
  mv a0, s1
  call rootAt
  mv a1, a0
  li a0, 4
  li a2, 9204
  call vop
  ; sci/equation.e16.ts:360  copyValue(E3, rootAt(first + 1))
  addi a0, s1, 1
  call rootAt
  mv a1, a0
  li a0, 9240
  call copyValue
  ; sci/equation.e16.ts:361  vop(M_SUB, rootAt(first + 1), E1)
  addi a0, s1, 1
  call rootAt
  mv a1, a0
  li a0, 2
  li a2, 9168
  call vop
  ; sci/equation.e16.ts:362  vop(M_DIV, rootAt(first + 1), E2)
  addi a0, s1, 1
  call rootAt
  mv a1, a0
  li a0, 4
  li a2, 9204
  call vop
  ; sci/equation.e16.ts:365  const small = isNegative(b) ? first + 1 : first
  mv a0, s2
  call isNegative
  beqz a0, .L4
  addi t0, s1, 1
  j .L5
.L4:
  mv t0, s1
.L5:
  mv s2, t0 ; b/small
  ; sci/equation.e16.ts:366  fromProduct(rootAt(small), rootAt(small === first ? first + 1 : first), a, c)
  mv a0, s2
  call rootAt
  mv t0, a0
  mv t1, s2
  mv t2, s1
  bne t1, t2, .L6
  addi t1, s1, 1
  j .L7
.L6:
  mv t1, s1
.L7:
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  call rootAt
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  mv a2, s3
  mv a3, s0
  call fromProduct
.return:
  lw ra, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  lw s1, 10(sp)
  addi sp, sp, 12
  ret

; sci/equation.e16.ts:370 fromProduct(r, other, a, c) at -O1
;   r in s1
;   other in s2
;   a in s3
;   c in s0
fromProduct:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; r
  mv s2, a1 ; other
  mv s3, a2 ; a
  mv s0, a3 ; c
  ; sci/equation.e16.ts:371  if (isExact(r) || isZero(other)) return
  mv a0, s1
  call isExact
  bnez a0, .L2
  mv a0, s2
  call isZero
  beqz a0, .L1
.L2:
  ; sci/equation.e16.ts:371  return
  j .return
.L1:
  ; sci/equation.e16.ts:372  copyValue(c, r)
  mv a0, s0
  mv a1, s1
  call copyValue
  ; sci/equation.e16.ts:373  vop(M_DIV, r, a)
  li a0, 4
  mv a1, s1
  mv a2, s3
  call vop
  ; sci/equation.e16.ts:374  vop(M_DIV, r, other)
  li a0, 4
  mv a1, s1
  mv a2, s2
  call vop
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; sci/equation.e16.ts:378 complexRoots(first) at -O1
;   first in s1
complexRoots:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; first
  ; sci/equation.e16.ts:379  copyValue(E3, rootAt(first))
  mv a0, s1
  call rootAt
  mv a1, a0
  li a0, 9240
  call copyValue
  ; sci/equation.e16.ts:380  vop(M_DIV, rootAt(first), E2)
  mv a0, s1
  call rootAt
  mv a1, a0
  li a0, 4
  li a2, 9204
  call vop
  ; sci/equation.e16.ts:381  copyValue(rootAt(first), rootAt(first + 1))
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
  ; sci/equation.e16.ts:382  if (isNegative(E2)) vneg(E2)
  li a0, 9204
  call isNegative
  beqz a0, .L1
  ; sci/equation.e16.ts:382  vneg(E2)
  li a0, 9204
  call vneg
.L1:
  ; sci/equation.e16.ts:383  copyValue(E1, imAt(first))
  mv a0, s1
  call imAt
  mv a1, a0
  li a0, 9168
  call copyValue
  ; sci/equation.e16.ts:384  vop(M_DIV, imAt(first), E2)
  mv a0, s1
  call imAt
  mv a1, a0
  li a0, 4
  li a2, 9204
  call vop
  ; sci/equation.e16.ts:385  copyValue(imAt(first), imAt(first + 1))
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
  ; sci/equation.e16.ts:386  vneg(imAt(first + 1))
  addi a0, s1, 1
  call imAt
  call vneg
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sci/equation.e16.ts:390 vertexOf() at -O1
vertexOf:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sci/equation.e16.ts:391  const x = VERTEX
  ; sci/equation.e16.ts:392  const y = VERTEX + VALUE_SIZE
  ; sci/equation.e16.ts:393  copyValue(coeff(0, 1), x)
  li a0, 0
  li a1, 1
  call coeff
  li a1, 8664
  call copyValue
  ; sci/equation.e16.ts:394  vneg(x)
  li a0, 8664
  call vneg
  ; sci/equation.e16.ts:395  copyValue(coeff(0, 0), E1)
  li a0, 0
  li a1, 0
  call coeff
  li a1, 9168
  call copyValue
  ; sci/equation.e16.ts:396  eqSmall(E2, 2)
  li a0, 9204
  li a1, 2
  call eqSmall
  ; sci/equation.e16.ts:397  vop(M_MUL, E1, E2)
  li a0, 3
  li a1, 9168
  li a2, 9204
  call vop
  ; sci/equation.e16.ts:398  vop(M_DIV, x, E1)
  li a0, 4
  li a1, 8664
  li a2, 9168
  call vop
  ; sci/equation.e16.ts:400  copyValue(x, y)
  li a0, 8664
  li a1, 8700
  call copyValue
  ; sci/equation.e16.ts:401  vop(M_MUL, y, coeff(0, 0))
  li a0, 0
  li a1, 0
  call coeff
  li a1, 8700
  mv a2, a0
  li a0, 3
  call vop
  ; sci/equation.e16.ts:402  vop(M_ADD, y, coeff(0, 1))
  li a0, 0
  li a1, 1
  call coeff
  li a1, 8700
  mv a2, a0
  li a0, 1
  call vop
  ; sci/equation.e16.ts:403  vop(M_MUL, y, x)
  li a0, 3
  li a1, 8700
  li a2, 8664
  call vop
  ; sci/equation.e16.ts:404  vop(M_ADD, y, coeff(0, 2))
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

; sci/equation.e16.ts:408 eqSmall(v, n) at -O1
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
  ; sci/equation.e16.ts:409  for (let i: u16 = 0; i < VALUE_SIZE; i++) poke(v + i, 0)
  li s1, 0 ; i
  j .L3
.L1:
  ; sci/equation.e16.ts:409  poke(v + i, 0)
  add t0, s2, s1
  sb zero, 0(t0)
  addi s1, s1, 1
.L3:
  li t0, 36
  bltu s1, t0, .L1
  ; sci/equation.e16.ts:410  poke(v + 2, n << 4)
  slli t0, s3, 4
  sb t0, 2(s2)
  ; sci/equation.e16.ts:411  exactWhole(v)
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

; sci/equation.e16.ts:418 cubic() at -O1
;   a in s1
cubic:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/equation.e16.ts:419  answers = 3
  li t0, 3
  sw t0, 0x0912(zero)
  ; sci/equation.e16.ts:420  const a = coeff(0, 0)
  li a0, 0
  li a1, 0
  call coeff
  mv s1, a0 ; a
  ; sci/equation.e16.ts:421  if (isZero(a)) fail(E_MATH, 0)
  mv a0, s1
  call isZero
  beqz a0, .L1
  ; sci/equation.e16.ts:421  fail(E_MATH, 0)
  li a0, 1
  li a1, 0
  call fail
.L1:
  ; sci/equation.e16.ts:422  halve()
  call halve
  ; sci/equation.e16.ts:424  copyValue(rootAt(0), E4)
  li a0, 8448
  li a1, 9276
  call copyValue
  ; sci/equation.e16.ts:425  poke16(MATH_ARG, 0)
  li t0, 65366
  sw zero, 0(t0)
  ; sci/equation.e16.ts:426  math(M_RNDTO, E4, 0, 0)
  li a0, 40
  li a1, 9276
  li a2, 0
  li a3, 0
  call math
  ; sci/equation.e16.ts:427  exactWhole(E4)
  li a0, 9276
  la t0, exactWhole
  li t1, 2
  call far_call
  ; sci/equation.e16.ts:428  cubicAt(E4, E1)
  li a0, 9276
  li a1, 9168
  call cubicAt
  ; sci/equation.e16.ts:429  if (isZero(E1)) copyValue(E4, rootAt(0))
  li a0, 9168
  call isZero
  beqz a0, .L2
  ; sci/equation.e16.ts:429  copyValue(E4, rootAt(0))
  li a0, 9276
  li a1, 8448
  call copyValue
  j .L3
.L2:
  ; sci/equation.e16.ts:430  inexact(rootAt(0))
  li a0, 8448
  call inexact
.L3:
  ; sci/equation.e16.ts:432  const qa = MATRIX
  ; sci/equation.e16.ts:433  const qb = qa + VALUE_SIZE
  ; sci/equation.e16.ts:434  const qc = qb + VALUE_SIZE
  ; sci/equation.e16.ts:435  copyValue(a, qa)
  mv a0, s1
  li a1, 8736
  call copyValue
  ; sci/equation.e16.ts:436  copyValue(a, qb)
  mv a0, s1
  li a1, 8772
  call copyValue
  ; sci/equation.e16.ts:437  vop(M_MUL, qb, rootAt(0))
  li a0, 3
  li a1, 8772
  li a2, 8448
  call vop
  ; sci/equation.e16.ts:438  vop(M_ADD, qb, coeff(0, 1))
  li a0, 0
  li a1, 1
  call coeff
  li a1, 8772
  mv a2, a0
  li a0, 1
  call vop
  ; sci/equation.e16.ts:439  copyValue(qb, qc)
  li a0, 8772
  li a1, 8808
  call copyValue
  ; sci/equation.e16.ts:440  vop(M_MUL, qc, rootAt(0))
  li a0, 3
  li a1, 8808
  li a2, 8448
  call vop
  ; sci/equation.e16.ts:441  vop(M_ADD, qc, coeff(0, 2))
  li a0, 0
  li a1, 2
  call coeff
  li a1, 8808
  mv a2, a0
  li a0, 1
  call vop
  ; sci/equation.e16.ts:442  quadratic(qa, qb, qc, 1)
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

; sci/equation.e16.ts:446 cubicAt(x, out) at -O1
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
  ; sci/equation.e16.ts:447  copyValue(coeff(0, 0), out)
  li a0, 0
  li a1, 0
  call coeff
  mv a1, s2
  call copyValue
  ; sci/equation.e16.ts:448  for (let c: u16 = 1; c < 4; c++) {
  li s1, 1 ; c
  j .L3
.L1:
  ; sci/equation.e16.ts:449  vop(M_MUL, out, x)
  li a0, 3
  mv a1, s2
  mv a2, s3
  call vop
  ; sci/equation.e16.ts:450  vop(M_ADD, out, coeff(0, c))
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

; sci/equation.e16.ts:458 halve() at -O1
;   c/k in s1
halve:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sci/equation.e16.ts:459  const lo = MATRIX
  ; sci/equation.e16.ts:460  const hi = lo + VALUE_SIZE
  ; sci/equation.e16.ts:461  const mid = hi + VALUE_SIZE
  ; sci/equation.e16.ts:462  const flo = mid + VALUE_SIZE
  ; sci/equation.e16.ts:463  eqSmall(hi, 1)
  li a0, 8772
  li a1, 1
  call eqSmall
  ; sci/equation.e16.ts:464  for (let c: u16 = 1; c < 4; c++) {
  li s1, 1 ; c/k
  j .L3
.L1:
  ; sci/equation.e16.ts:465  copyValue(coeff(0, c), E1)
  li a0, 0
  mv a1, s1
  call coeff
  li a1, 9168
  call copyValue
  ; sci/equation.e16.ts:466  math(M_DIV, E1, coeff(0, 0), 0)
  li a0, 0
  li a1, 0
  call coeff
  li a1, 9168
  mv a2, a0
  li a0, 4
  li a3, 0
  call math
  ; sci/equation.e16.ts:467  math(M_ABS, E1, 0, 0)
  li a0, 17
  li a1, 9168
  li a2, 0
  li a3, 0
  call math
  ; sci/equation.e16.ts:468  eqSmall(E2, 1)
  li a0, 9204
  li a1, 1
  call eqSmall
  ; sci/equation.e16.ts:469  math(M_ADD, E1, E2, 0)
  li a0, 1
  li a1, 9168
  li a2, 9204
  li a3, 0
  call math
  ; sci/equation.e16.ts:470  math(M_CMP, E1, hi, 0)
  li a0, 6
  li a1, 9168
  li a2, 8772
  li a3, 0
  call math
  ; sci/equation.e16.ts:471  if (peek16(MATH_RESULT) === 1) copyValue(E1, hi)
  li t0, 65370
  lw t0, 0(t0)
  li t1, 1
  bne t0, t1, .L5
  ; sci/equation.e16.ts:471  copyValue(E1, hi)
  li a0, 9168
  li a1, 8772
  call copyValue
.L5:
  addi s1, s1, 1
.L3:
  li t0, 4
  bltu s1, t0, .L1
  ; sci/equation.e16.ts:473  copyValue(hi, lo)
  li a0, 8772
  li a1, 8736
  call copyValue
  ; sci/equation.e16.ts:474  math(M_NEG, lo, 0, 0)
  li a0, 16
  li a1, 8736
  li a2, 0
  li a3, 0
  call math
  ; sci/equation.e16.ts:475  inexact(lo)
  li a0, 8736
  call inexact
  ; sci/equation.e16.ts:476  inexact(hi)
  li a0, 8772
  call inexact
  ; sci/equation.e16.ts:477  cubicAt(lo, flo)
  li a0, 8736
  li a1, 8844
  call cubicAt
  ; sci/equation.e16.ts:478  for (let k: u16 = 0; k < 80; k++) {
  li s1, 0 ; c/k
  j .L8
.L6:
  ; sci/equation.e16.ts:479  copyValue(lo, mid)
  li a0, 8736
  li a1, 8808
  call copyValue
  ; sci/equation.e16.ts:480  math(M_ADD, mid, hi, 0)
  li a0, 1
  li a1, 8808
  li a2, 8772
  li a3, 0
  call math
  ; sci/equation.e16.ts:481  eqSmall(E2, 2)
  li a0, 9204
  li a1, 2
  call eqSmall
  ; sci/equation.e16.ts:482  math(M_DIV, mid, E2, 0)
  li a0, 4
  li a1, 8808
  li a2, 9204
  li a3, 0
  call math
  ; sci/equation.e16.ts:483  inexact(mid)
  li a0, 8808
  call inexact
  ; sci/equation.e16.ts:484  cubicAt(mid, E3)
  li a0, 8808
  li a1, 9240
  call cubicAt
  ; sci/equation.e16.ts:485  if (isZero(E3)) break
  li a0, 9240
  call isZero
  beqz a0, .L10
  ; sci/equation.e16.ts:485  break
  j .L9
.L10:
  ; sci/equation.e16.ts:486  if (isNegative(E3) === isNegative(flo)) copyValue(mid, lo)
  li a0, 9240
  call isNegative
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 8844
  call isNegative
  lw t0, 0(sp)
  addi sp, sp, 2
  bne t0, a0, .L11
  ; sci/equation.e16.ts:486  copyValue(mid, lo)
  li a0, 8808
  li a1, 8736
  call copyValue
  j .L12
.L11:
  ; sci/equation.e16.ts:487  copyValue(mid, hi)
  li a0, 8808
  li a1, 8772
  call copyValue
.L12:
  addi s1, s1, 1
.L8:
  li t0, 80
  bltu s1, t0, .L6
.L9:
  ; sci/equation.e16.ts:489  copyValue(mid, rootAt(0))
  li a0, 8808
  li a1, 8448
  call copyValue
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

str_164:
  .byte 97, 88, 43, 98, 89, 61, 99, 0
str_165:
  .byte 97, 88, 43, 98, 89, 43, 99, 90, 61, 100, 0
str_166:
  .byte 97, 88, 132, 43, 98, 88, 43, 99, 61, 48, 0
str_167:
  .byte 97, 88, 133, 43, 98, 88, 132, 43, 99, 88, 43, 100, 61, 48, 0
str_168:
  .byte 69, 81, 85, 65, 84, 73, 79, 78, 0
str_169:
  .byte 49, 58, 97, 88, 43, 98, 89, 61, 99, 0
str_170:
  .byte 50, 58, 97, 88, 43, 98, 89, 43, 99, 90, 61, 100, 0
str_171:
  .byte 51, 58, 97, 88, 132, 43, 98, 88, 43, 99, 61, 48, 0
str_172:
  .byte 52, 58, 97, 88, 133, 43, 98, 88, 132, 43, 99, 88, 43, 100, 61, 48, 0
str_173:
  .byte 65, 67, 58, 66, 65, 67, 75, 0
str_174:
  .byte 78, 79, 32, 79, 78, 69, 32, 83, 79, 76, 85, 84, 73, 79, 78, 58, 0
str_175:
  .byte 78, 79, 78, 69, 44, 32, 79, 82, 32, 77, 65, 78, 89, 0
str_176:
  .byte 65, 67, 58, 69, 68, 73, 84, 0
str_177:
  .byte 86, 69, 82, 84, 69, 88, 0
str_178:
  .byte 88, 61, 0
str_179:
  .byte 89, 61, 0
str_180:
  .byte 141, 58, 82, 79, 79, 84, 83, 32, 32, 65, 67, 58, 69, 68, 73, 84, 0
str_181:
  .byte 142, 58, 86, 69, 82, 84, 69, 88, 32, 32, 65, 67, 58, 69, 68, 73, 84, 0
str_182:
  .byte 90, 61, 0
str_183:
  .byte 88, 49, 61, 0
str_184:
  .byte 88, 50, 61, 0
str_185:
  .byte 88, 51, 61, 0
  .align 2
