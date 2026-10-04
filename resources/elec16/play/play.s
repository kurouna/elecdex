; Made by e16c from play/play.e16.ts: do not edit.

; curX at 0x0100
; curY at 0x0102
rowBuffer = 0x0104 ; 80 bytes
header = 0x0154 ; 66 bytes
question = 0x0196 ; 2 bytes

e16c_init:
  ; curX = 0
  sw zero, 0x0100(zero)
  ; curY = 0
  sw zero, 0x0102(zero)
  ; rowBuffer: 80 bytes of 0
  li t0, 0x0104
  li t1, 80
  mset t0, zero, t1
  ; header: 66 bytes of 0
  li t0, 0x0154
  li t1, 66
  mset t0, zero, t1
  ; question: 2 bytes of 0
  li t0, 0x0196
  li t1, 2
  mset t0, zero, t1
  ret

; play/play.e16.ts:78 window(at) at -O1
;   at in a0
window:
  ; play/play.e16.ts:79  poke16(VPAGE, at >> 12)
  srli t0, a0, 12
  li t1, 63490
  sw t0, 0(t1)
  ; play/play.e16.ts:80  return WINDOW + (at & (PAGE_SIZE - 1))
  andi t0, a0, 4095
  addi a0, t0, -8192
.return:
  ret

; play/play.e16.ts:84 videoOut(at, to, n) at -O1
;   at in s2
;   to in s3
;   n in s0
;   first in s1
videoOut:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; at
  mv s3, a1 ; to
  mv s0, a2 ; n
  ; play/play.e16.ts:85  const first = PAGE_SIZE - (at & (PAGE_SIZE - 1))
  andi t0, s2, 4095
  li t1, 4096
  sub s1, t1, t0
  ; play/play.e16.ts:86  if (n <= first) {
  bltu s1, s0, .L1
  ; play/play.e16.ts:87  memcpy(to, window(at), n)
  mv a0, s2
  call window
  mv a1, a0
  mv a0, s3
  mv a2, s0
  mcpy a0, a1, a2
  ; play/play.e16.ts:88  return
  j .return
.L1:
  ; play/play.e16.ts:90  memcpy(to, window(at), first)
  mv a0, s2
  call window
  mv a1, a0
  mv a0, s3
  mv a2, s1
  mcpy a0, a1, a2
  ; play/play.e16.ts:91  memcpy(to + first, window(at + first), n - first)
  add t0, s3, s1
  add t1, s2, s1
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  call window
  sub t0, s0, s1
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t1
  mv a2, t0
  mcpy a0, a1, a2
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; play/play.e16.ts:95 videoIn(from, at, n) at -O1
;   from in s3
;   at in s2
;   n in s0
;   first in s1
videoIn:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s3, a0 ; from
  mv s2, a1 ; at
  mv s0, a2 ; n
  ; play/play.e16.ts:96  const first = PAGE_SIZE - (at & (PAGE_SIZE - 1))
  andi t0, s2, 4095
  li t1, 4096
  sub s1, t1, t0
  ; play/play.e16.ts:97  if (n <= first) {
  bltu s1, s0, .L1
  ; play/play.e16.ts:98  memcpy(window(at), from, n)
  mv a0, s2
  call window
  mv a1, s3
  mv a2, s0
  mcpy a0, a1, a2
  ; play/play.e16.ts:99  return
  j .return
.L1:
  ; play/play.e16.ts:101  memcpy(window(at), from, first)
  mv a0, s2
  call window
  mv a1, s3
  mv a2, s1
  mcpy a0, a1, a2
  ; play/play.e16.ts:102  memcpy(window(at + first), from + first, n - first)
  add a0, s2, s1
  call window
  add t0, s3, s1
  sub t1, s0, s1
  mv a1, t0
  mv a2, t1
  mcpy a0, a1, a2
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; play/play.e16.ts:106 videoFill(at, value, n) at -O1
;   at in 2(fp)
;   value in 4(fp)
;   n in 6(fp)
;   left in s1
;   to in s2
;   room in 0(fp)
;   now in s3
videoFill:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 2(fp) ; at
  sw a1, 4(fp) ; value
  sw a2, 6(fp) ; n
  ; play/play.e16.ts:107  let left = n
  lw s1, 6(fp) ; n
  ; play/play.e16.ts:108  let to = at
  lw s2, 2(fp) ; at
  ; play/play.e16.ts:109  while (left > 0) {
  j .L3
.L1:
  ; play/play.e16.ts:110  const room = PAGE_SIZE - (to & (PAGE_SIZE - 1))
  andi t0, s2, 4095
  li t1, 4096
  sub t1, t1, t0
  sw t1, 0(fp) ; room
  ; play/play.e16.ts:111  const now = left < room ? left : room
  lw t0, 0(fp) ; room
  bgeu s1, t0, .L5
  mv t0, s1
  j .L6
.L5:
  lw t0, 0(fp)
.L6:
  mv s3, t0 ; now
  ; play/play.e16.ts:112  memset(window(to), value, now)
  mv a0, s2
  call window
  lw a1, 4(fp)
  mv a2, s3
  mset a0, a1, a2
  ; play/play.e16.ts:113  to += now
  add s2, s2, s3
  ; play/play.e16.ts:114  left -= now
  sub s1, s1, s3
.L3:
  bltu zero, s1, .L1
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; play/play.e16.ts:119 plot(x, y, c) at -O1
;   x in s1
;   y in 0(fp)
;   c in 2(fp)
;   at in s2
;   shift in s3
plot:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; x
  sw a1, 0(fp) ; y
  sw a2, 2(fp) ; c
  ; play/play.e16.ts:120  const at = window(y * ROW_BYTES + (x >> 2))
  lw t0, 0(fp) ; y
  slli t1, t0, 6
  slli t0, t0, 4
  add t0, t0, t1
  srli t1, s1, 2
  add a0, t0, t1
  call window
  mv s2, a0 ; at
  ; play/play.e16.ts:121  const shift = 6 - ((x & 3) << 1)
  andi t0, s1, 3
  slli t0, t0, 1
  li t1, 6
  sub s3, t1, t0
  ; play/play.e16.ts:122  poke(at, (peek(at) & (0xff ^ (3 << shift))) | (c << shift))
  lbu t0, 0(s2)
  li t1, 3
  sll t1, t1, s3
  li t2, 255
  xor t2, t2, t1
  and t0, t0, t2
  lw t1, 2(fp) ; c
  sll t1, t1, s3
  or t0, t0, t1
  sb t0, 0(s2)
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; play/play.e16.ts:128 screenInit() at -O1
;   at in s1
screenInit:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; play/play.e16.ts:129  poke16(VCTRL, 1)
  li t0, 1
  li t1, 63488
  sw t0, 0(t1)
  ; play/play.e16.ts:130  const at = window(PALETTE)
  li a0, 50176
  call window
  mv s1, a0 ; at
  ; play/play.e16.ts:131  poke16(at, COLOUR_0)
  li t0, 6242
  sw t0, 0(s1)
  ; play/play.e16.ts:132  poke16(at + 2, COLOUR_1)
  li t0, 15657
  sw t0, 2(s1)
  ; play/play.e16.ts:133  poke16(at + 4, COLOUR_2)
  li t0, 24178
  sw t0, 4(s1)
  ; play/play.e16.ts:134  poke16(at + 6, COLOUR_3)
  li t0, 32732
  sw t0, 6(s1)
  ; play/play.e16.ts:135  cls()
  call cls
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; play/play.e16.ts:139 cls() at -O1
cls:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; play/play.e16.ts:140  videoFill(0, 0, BITMAP_SIZE)
  li a0, 0
  li a1, 0
  li a2, 23040
  call videoFill
  ; play/play.e16.ts:141  curX = 0
  sw zero, 0x0100(zero)
  ; play/play.e16.ts:142  curY = 0
  sw zero, 0x0102(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; play/play.e16.ts:146 drawChar(c, column, row) at -O1
;   c in s3
;   column in 0(fp)
;   row in 2(fp)
;   glyph in 4(fp)
;   x0 in 6(fp)
;   y0 in 8(fp)
;   cx in s1
;   bits in 10(fp)
;   r in s2
drawChar:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s3, 14(sp)
  sw s1, 16(sp)
  sw s2, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  mv s3, a0 ; c
  sw a1, 0(fp) ; column
  sw a2, 2(fp) ; row
  ; play/play.e16.ts:147  const glyph = font_base() + (c - FIRST_CODE) * 5
  call font_base
  addi t0, s3, -32
  slli t1, t0, 2
  add t0, t1, t0
  add t0, a0, t0
  sw t0, 4(fp) ; glyph
  ; play/play.e16.ts:148  const x0 = column * 6
  lw t0, 0(fp) ; column
  slli t1, t0, 2
  slli t0, t0, 1
  add t0, t0, t1
  sw t0, 6(fp) ; x0
  ; play/play.e16.ts:149  const y0 = row * 8
  lw t0, 2(fp) ; row
  slli t0, t0, 3
  sw t0, 8(fp) ; y0
  ; play/play.e16.ts:150  for (let cx: u16 = 0; cx < 6; cx++) {
  li s1, 0 ; cx
  j .L3
.L1:
  ; play/play.e16.ts:151  const bits = cx < 5 ? peek(glyph + cx) : 0
  li t0, 5
  bgeu s1, t0, .L5
  lw t0, 4(fp) ; glyph
  add t0, t0, s1
  lbu t0, 0(t0)
  j .L6
.L5:
  li t0, 0
.L6:
  sw t0, 10(fp) ; bits
  ; play/play.e16.ts:152  for (let r: u16 = 0; r < 8; r++) plot(x0 + cx, y0 + r, ((bits >> r) & 1) === 1 ? INK : PAPER)
  li s2, 0 ; r
  j .L9
.L7:
  ; play/play.e16.ts:152  plot(x0 + cx, y0 + r, ((bits >> r) & 1) === 1 ? INK : PAPER)
  lw t0, 6(fp) ; x0
  add t0, t0, s1
  lw t1, 8(fp) ; y0
  add t1, t1, s2
  lw t2, 10(fp) ; bits
  srl t2, t2, s2
  andi t2, t2, 1
  li t3, 1
  bne t2, t3, .L11
  li t2, 3
  j .L12
.L11:
  li t2, 0
.L12:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call plot
  addi s2, s2, 1
.L9:
  li t0, 8
  bltu s2, t0, .L7
  addi s1, s1, 1
.L3:
  li t0, 6
  bltu s1, t0, .L1
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s3, 14(sp)
  lw s1, 16(sp)
  lw s2, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; play/play.e16.ts:157 scroll() at -O1
;   y in s1
scroll:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; play/play.e16.ts:158  for (let y: u16 = 0; y < SCREEN_ROWS - 8; y++) {
  li s1, 0 ; y
  j .L3
.L1:
  ; play/play.e16.ts:159  videoOut((y + 8) * ROW_BYTES, addr(rowBuffer), ROW_BYTES)
  addi t0, s1, 8
  slli t1, t0, 6
  slli t0, t0, 4
  add a0, t0, t1
  la a1, rowBuffer
  li a2, 80
  call videoOut
  ; play/play.e16.ts:160  videoIn(addr(rowBuffer), y * ROW_BYTES, ROW_BYTES)
  slli t1, s1, 6
  slli t0, s1, 4
  add t0, t0, t1
  la a0, rowBuffer
  mv a1, t0
  li a2, 80
  call videoIn
  addi s1, s1, 1
.L3:
  li t0, 280
  bltu s1, t0, .L1
  ; play/play.e16.ts:162  videoFill((SCREEN_ROWS - 8) * ROW_BYTES, 0, 8 * ROW_BYTES)
  li a0, 22400
  li a1, 0
  li a2, 640
  call videoFill
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; play/play.e16.ts:165 newline() at -O1
newline:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; play/play.e16.ts:166  curX = 0
  sw zero, 0x0100(zero)
  ; play/play.e16.ts:167  if (curY + 1 < ROWS) {
  lw t0, 0x0102(zero)
  li t1, 36
  addi t0, t0, 1
  bgeu t0, t1, .L1
  ; play/play.e16.ts:168  curY++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; play/play.e16.ts:169  return
  j .return
.L1:
  ; play/play.e16.ts:171  scroll()
  call scroll
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; play/play.e16.ts:175 putc(c) at -O1
;   c in s1
putc:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; play/play.e16.ts:176  if (c === CH_CR) {
  li t0, 13
  bne s1, t0, .L1
  ; play/play.e16.ts:177  newline()
  call newline
  ; play/play.e16.ts:178  return
  j .return
.L1:
  ; play/play.e16.ts:180  if (c === CH_CLS) {
  li t0, 12
  bne s1, t0, .L2
  ; play/play.e16.ts:181  cls()
  call cls
  ; play/play.e16.ts:182  return
  j .return
.L2:
  ; play/play.e16.ts:184  if (c === CH_BS) {
  li t0, 8
  bne s1, t0, .L3
  ; play/play.e16.ts:185  if (curX > 0) curX--
  lw t0, 0x0100(zero)
  bgeu zero, t0, .L4
  ; play/play.e16.ts:185  curX--
  lw t0, 0x0100(zero)
  addi t0, t0, -1
  sw t0, 0x0100(zero)
.L4:
  ; play/play.e16.ts:186  return
  j .return
.L3:
  ; play/play.e16.ts:188  if (c < FIRST_CODE) return
  li t0, 32
  bgeu s1, t0, .L5
  ; play/play.e16.ts:188  return
  j .return
.L5:
  ; play/play.e16.ts:189  drawChar(c, curX, curY)
  lw t0, 0x0100(zero)
  lw t1, 0x0102(zero)
  mv a0, s1
  mv a1, t0
  mv a2, t1
  call drawChar
  ; play/play.e16.ts:190  curX++
  lw t0, 0x0100(zero)
  addi t0, t0, 1
  sw t0, 0x0100(zero)
  ; play/play.e16.ts:191  if (curX >= COLS) newline()
  li t1, 53
  bltu t0, t1, .L6
  ; play/play.e16.ts:191  newline()
  call newline
.L6:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; play/play.e16.ts:195 puts(at) at -O1
;   at in s2
;   p in s1
puts:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; at
  ; play/play.e16.ts:196  for (let p = at; peek(p) !== 0; p++) putc(peek(p))
  mv s1, s2 ; p
  j .L3
.L1:
  ; play/play.e16.ts:196  putc(peek(p))
  lbu a0, 0(s1)
  call putc
  addi s1, s1, 1
.L3:
  lbu t0, 0(s1)
  bne t0, zero, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; play/play.e16.ts:200 locate(column, row) at -O1
;   column in a0
;   row in a1
locate:
  ; play/play.e16.ts:201  curX = column < COLS ? column : COLS - 1
  li t0, 53
  bgeu a0, t0, .L1
  mv t0, a0
  j .L2
.L1:
  li t0, 52
.L2:
  sw t0, 0x0100(zero)
  ; play/play.e16.ts:202  curY = row < ROWS ? row : ROWS - 1
  li t0, 36
  bgeu a1, t0, .L3
  mv t0, a1
  j .L4
.L3:
  li t0, 35
.L4:
  sw t0, 0x0102(zero)
.return:
  ret

; play/play.e16.ts:206 puthex(v) at -O1
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
  ; play/play.e16.ts:207  for (let s: u16 = 0; s < 4; s++) {
  li s1, 0 ; s
  j .L3
.L1:
  ; play/play.e16.ts:208  const d = (v >> (12 - s * 4)) & 15
  slli t0, s1, 2
  li t1, 12
  sub t1, t1, t0
  srl t1, s3, t1
  andi s2, t1, 15
  ; play/play.e16.ts:209  putc(d < 10 ? 0x30 + d : 0x37 + d)
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

; play/play.e16.ts:214 putDecimal(v) at -O1
;   v in s2
;   tens in s1
putDecimal:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; v
  ; play/play.e16.ts:215  const tens = div(v, 10)
  li t0, 10
  divu s1, s2, t0
  ; play/play.e16.ts:216  if (tens > 0) putDecimal(tens)
  bgeu zero, s1, .L1
  ; play/play.e16.ts:216  putDecimal(tens)
  mv a0, s1
  call putDecimal
.L1:
  ; play/play.e16.ts:217  putc(0x30 + v - tens * 10)
  slli t1, s1, 3
  slli t0, s1, 1
  add t0, t0, t1
  addi t1, s2, 48
  sub a0, t1, t0
  call putc
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; play/play.e16.ts:221 centre(row, at, length) at -O1
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
  ; play/play.e16.ts:222  locate((COLS - length) >> 1, row)
  li t0, 53
  sub t0, t0, s3
  srli a0, t0, 1
  mv a1, s1
  call locate
  ; play/play.e16.ts:223  puts(at)
  mv a0, s2
  call puts
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; play/play.e16.ts:246 cart(kind) at -O1
;   kind in s1
cart:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; kind
  ; play/play.e16.ts:247  poke(addr(question), 0x47)
  li t0, 71
  sb t0, question(zero)
  ; play/play.e16.ts:248  return link(addr(question), addr(header), HEADER, kind)
  la a0, question
  la a1, header
  li a2, 64
  mv a3, s1
  call link
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; play/play.e16.ts:252 cartLine(got) at -O1
;   got in a0
cartLine:
  ; play/play.e16.ts:253  if (got >= HEADER) return str('PRESS START')
  li t0, 64
  blt a0, t0, .L1
  ; play/play.e16.ts:253  return str('PRESS START')
  la a0, str_2
  ret
.L1:
  ; play/play.e16.ts:254  if (got === -ST_HELD) return str('PRESS START')
  li t0, 65533
  bne a0, t0, .L2
  ; play/play.e16.ts:254  return str('PRESS START')
  la a0, str_2
  ret
.L2:
  ; play/play.e16.ts:255  if (got === -ST_OFF) return str('LINK CART IS OFF')
  li t0, 65534
  bne a0, t0, .L3
  ; play/play.e16.ts:255  return str('LINK CART IS OFF')
  la a0, str_3
  ret
.L3:
  ; play/play.e16.ts:256  return str('NO CARTRIDGE')
  la a0, str_4
.return:
  ret

; play/play.e16.ts:260 showCart(got) at -O1
;   got in s2
;   name/line in s1
showCart:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; got
  ; play/play.e16.ts:261  clearRow(14)
  li a0, 14
  call clearRow
  ; play/play.e16.ts:262  clearRow(16)
  li a0, 16
  call clearRow
  ; play/play.e16.ts:263  if (got >= HEADER) {
  li t0, 64
  blt s2, t0, .L1
  ; play/play.e16.ts:264  const name = addr(header) + NAME_AT
  li s1, header+32
  ; play/play.e16.ts:265  centre(14, name, length(name))
  mv a0, s1
  call length
  mv a1, s1
  mv a2, a0
  li a0, 14
  call centre
.L1:
  ; play/play.e16.ts:267  const line = cartLine(got)
  mv a0, s2
  call cartLine
  mv s1, a0 ; name/line
  ; play/play.e16.ts:268  centre(16, line, length(line))
  mv a0, s1
  call length
  mv a1, s1
  mv a2, a0
  li a0, 16
  call centre
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; play/play.e16.ts:276 startPressed() at -O1
;   got in s1
startPressed:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; play/play.e16.ts:277  const got = cart(CART_LOAD)
  li a0, 257
  call cart
  mv s1, a0 ; got
  ; play/play.e16.ts:278  if (got < HEADER) {
  li t0, 64
  bge s1, t0, .L1
  ; play/play.e16.ts:279  showCart(got)
  mv a0, s1
  call showCart
  ; play/play.e16.ts:280  return
  j .return
.L1:
  ; play/play.e16.ts:282  start_game(peek16(addr(header) + ENTRY_AT))
  lw a0, header+8(zero)
  call start_game
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; play/play.e16.ts:285 length(at) at -O1
;   at in a0
;   n in a1
length:
  ; play/play.e16.ts:286  let n: u16 = 0
  li a1, 0 ; n
  ; play/play.e16.ts:287  while (peek(at + n) !== 0) n++
  j .L3
.L1:
  ; play/play.e16.ts:287  n++
  addi a1, a1, 1
.L3:
  add t0, a0, a1
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; play/play.e16.ts:288  return n
  mv a0, a1
.return:
  ret

; play/play.e16.ts:291 clearRow(row) at -O1
;   row in s1
clearRow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; row
  ; play/play.e16.ts:292  videoFill(row * 8 * ROW_BYTES, 0, 8 * ROW_BYTES)
  slli t0, s1, 3
  slli t1, t0, 6
  slli t0, t0, 4
  add a0, t0, t1
  li a1, 0
  li a2, 640
  call videoFill
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; play/play.e16.ts:301 xramBanks() at -O1
;   was in a1
;   banks in a0
xramBanks:
  ; play/play.e16.ts:302  const was = peek16(IO_BANK)
  li t0, 65284
  lw a1, 0(t0)
  ; play/play.e16.ts:303  let banks: u16 = 0
  li a0, 0 ; banks
  ; play/play.e16.ts:304  while (banks < XRAM_BANKS) {
  j .L3
.L1:
  ; play/play.e16.ts:305  poke16(IO_BANK, XRAM_BANK + banks)
  addi t0, a0, 32
  li t1, 65284
  sw t0, 0(t1)
  ; play/play.e16.ts:306  if (peek16(IO_BANK) !== XRAM_BANK + banks) break
  li t0, 65284
  lw t0, 0(t0)
  addi t1, a0, 32
  beq t0, t1, .L5
  ; play/play.e16.ts:306  break
  j .L4
.L5:
  ; play/play.e16.ts:307  banks++
  addi a0, a0, 1
.L3:
  li t0, 64
  bltu a0, t0, .L1
.L4:
  ; play/play.e16.ts:309  poke16(IO_BANK, was)
  li t0, 65284
  sw a1, 0(t0)
  ; play/play.e16.ts:310  return banks
.return:
  ret

; play/play.e16.ts:317 bootScreen(cause, pc) at -O1
;   cause in s1
;   pc in s2
bootScreen:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; cause
  mv s2, a1 ; pc
  ; play/play.e16.ts:318  cls()
  call cls
  ; play/play.e16.ts:319  centre(4, TITLE, 12)
  li a0, 4
  la a1, str_0
  li a2, 12
  call centre
  ; play/play.e16.ts:320  centre(6, MODEL, 8)
  li a0, 6
  la a1, str_1
  li a2, 8
  call centre
  ; play/play.e16.ts:321  locate(15, 10)
  li a0, 15
  li a1, 10
  call locate
  ; play/play.e16.ts:322  puts(str('RAM 32K  XRAM '))
  la a0, str_5
  call puts
  ; play/play.e16.ts:323  putDecimal(xramBanks() * 8)
  call xramBanks
  slli a0, a0, 3
  call putDecimal
  ; play/play.e16.ts:324  putc(0x4b)
  li a0, 75
  call putc
  ; play/play.e16.ts:325  showCart(cart(CART_INFO))
  li a0, 256
  call cart
  call showCart
  ; play/play.e16.ts:326  if (cause === 0) return
  bne s1, zero, .L1
  ; play/play.e16.ts:326  return
  j .return
.L1:
  ; play/play.e16.ts:327  locate(2, ROWS - 3)
  li a0, 2
  li a1, 33
  call locate
  ; play/play.e16.ts:329  if (cause === 0x800f || cause === 3) {
  li t0, 32783
  beq s1, t0, .L3
  li t0, 3
  bne s1, t0, .L2
.L3:
  ; play/play.e16.ts:330  puts(str('BREAK AT '))
  la a0, str_6
  call puts
  j .L4
.L2:
  ; play/play.e16.ts:332  puts(str('FAULT '))
  la a0, str_7
  call puts
  ; play/play.e16.ts:333  puthex(cause)
  mv a0, s1
  call puthex
  ; play/play.e16.ts:334  puts(str(' AT '))
  la a0, str_8
  call puts
.L4:
  ; play/play.e16.ts:336  puthex(pc)
  mv a0, s2
  call puthex
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

str_0:
  .byte 69, 76, 69, 67, 45, 49, 54, 32, 80, 76, 65, 89, 0
str_1:
  .byte 80, 76, 65, 89, 45, 51, 50, 48, 0
str_2:
  .byte 80, 82, 69, 83, 83, 32, 83, 84, 65, 82, 84, 0
str_3:
  .byte 76, 73, 78, 75, 32, 67, 65, 82, 84, 32, 73, 83, 32, 79, 70, 70, 0
str_4:
  .byte 78, 79, 32, 67, 65, 82, 84, 82, 73, 68, 71, 69, 0
str_5:
  .byte 82, 65, 77, 32, 51, 50, 75, 32, 32, 88, 82, 65, 77, 32, 0
str_6:
  .byte 66, 82, 69, 65, 75, 32, 65, 84, 32, 0
str_7:
  .byte 70, 65, 85, 76, 84, 32, 0
str_8:
  .byte 32, 65, 84, 32, 0
  .align 2
e16c_fixed_end:
