; Made by e16c from basic/rom.e16.ts, basic/text.e16.ts, basic/edit.e16.ts, basic/basic.e16.ts: do not edit.

; matchedLength at 0x0100
; startX at 0x0102
; startY at 0x0104
; n at 0x0106
; at at 0x0108
; txt at 0x010a
; curLine at 0x010c
; progEnd at 0x010e
; varEnd at 0x0110
; nsp at 0x0112
; fsp at 0x0114
; gsp at 0x0116
; running at 0x0118
; contLine at 0x011a
; contTxt at 0x011c
; jumping at 0x011e
; jumpLine at 0x0120
; jumpTxt at 0x0122
; proMode at 0x0124
; angleMarks at 0x0126
; recallNo at 0x0128
; justStored at 0x012a
; lastLength at 0x012c
; name0 at 0x03fe
; name1 at 0x0400
lineBuf = 0x012e ; 80 bytes
lastLine = 0x017e ; 80 bytes
tokens = 0x01ce ; 96 bytes
nums = 0x022e ; 192 bytes
ans = 0x02ee ; 8 bytes
textOut = 0x02f6 ; 24 bytes
forStack = 0x030e ; 176 bytes
gosubStack = 0x03be ; 64 bytes

e16c_init:
  ; matchedLength = 0
  li t0, 0
  sw t0, 0x0100(zero)
  ; startX = 0
  li t0, 0
  sw t0, 0x0102(zero)
  ; startY = 0
  li t0, 0
  sw t0, 0x0104(zero)
  ; n = 0
  li t0, 0
  sw t0, 0x0106(zero)
  ; at = 0
  li t0, 0
  sw t0, 0x0108(zero)
  ; txt = 0
  li t0, 0
  sw t0, 0x010a(zero)
  ; curLine = 0
  li t0, 0
  sw t0, 0x010c(zero)
  ; progEnd = 2048
  li t0, 2048
  sw t0, 0x010e(zero)
  ; varEnd = 2050
  li t0, 2050
  sw t0, 0x0110(zero)
  ; nsp = 0
  li t0, 0
  sw t0, 0x0112(zero)
  ; fsp = 0
  li t0, 0
  sw t0, 0x0114(zero)
  ; gsp = 0
  li t0, 0
  sw t0, 0x0116(zero)
  ; running = 0
  li t0, 0
  sw t0, 0x0118(zero)
  ; contLine = 0
  li t0, 0
  sw t0, 0x011a(zero)
  ; contTxt = 0
  li t0, 0
  sw t0, 0x011c(zero)
  ; jumping = 0
  li t0, 0
  sw t0, 0x011e(zero)
  ; jumpLine = 0
  li t0, 0
  sw t0, 0x0120(zero)
  ; jumpTxt = 0
  li t0, 0
  sw t0, 0x0122(zero)
  ; proMode = 0
  li t0, 0
  sw t0, 0x0124(zero)
  ; angleMarks = 128
  li t0, 128
  sw t0, 0x0126(zero)
  ; recallNo = 0
  li t0, 0
  sw t0, 0x0128(zero)
  ; justStored = 0
  li t0, 0
  sw t0, 0x012a(zero)
  ; lastLength = 0
  li t0, 0
  sw t0, 0x012c(zero)
  ; name0 = 0
  li t0, 0
  sw t0, 0x03fe(zero)
  ; name1 = 0
  li t0, 0
  sw t0, 0x0400(zero)
  ; lineBuf: 80 bytes of 0
  li t0, 0x012e
  li t1, 0x017e
.clear_lineBuf:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_lineBuf
  ; lastLine: 80 bytes of 0
  li t0, 0x017e
  li t1, 0x01ce
.clear_lastLine:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_lastLine
  ; tokens: 96 bytes of 0
  li t0, 0x01ce
  li t1, 0x022e
.clear_tokens:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_tokens
  ; nums: 192 bytes of 0
  li t0, 0x022e
  li t1, 0x02ee
.clear_nums:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_nums
  ; ans: 8 bytes of 0
  li t0, 0x02ee
  li t1, 0x02f6
.clear_ans:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_ans
  ; textOut: 24 bytes of 0
  li t0, 0x02f6
  li t1, 0x030e
.clear_textOut:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_textOut
  ; forStack: 176 bytes of 0
  li t0, 0x030e
  li t1, 0x03be
.clear_forStack:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_forStack
  ; gosubStack: 64 bytes of 0
  li t0, 0x03be
  li t1, 0x03fe
.clear_gosubStack:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_gosubStack
  ret

; basic/text.e16.ts:72 isLetter(c) at -O1
;   c in a0
isLetter:
  ; basic/text.e16.ts:73  return (c >= CH_A && c <= CH_Z) || (c >= CH_LOWER_A && c <= CH_LOWER_Z)
  li t0, 65
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L2
  li t0, 90
  sltu t0, t0, a0
  xori t0, t0, 1
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 97
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L3
  li t0, 122
  sltu t0, t0, a0
  xori t0, t0, 1
.L3:
.L1:
  mv a0, t0
.return:
  ret

; basic/text.e16.ts:76 upper(c) at -O1
;   c in a0
upper:
  ; basic/text.e16.ts:77  if (c >= CH_LOWER_A && c <= CH_LOWER_Z) return c - 0x20
  li t0, 97
  bltu a0, t0, .L1
  li t0, 122
  bltu t0, a0, .L1
  ; basic/text.e16.ts:77  return c - 0x20
  addi a0, a0, -32
  j .return
.L1:
  ; basic/text.e16.ts:78  return c
.return:
  ret

; basic/text.e16.ts:82 keywordText(token) at -O1
;   token in a0
;   at in a1
;   k in a2
keywordText:
  ; basic/text.e16.ts:83  let at = KEYWORDS
  la a1, str_0
  ; basic/text.e16.ts:84  let k: u16 = 0x80
  li a2, 128 ; k
  ; basic/text.e16.ts:85  while (k < token) {
  j .L3
  ; basic/text.e16.ts:86  while (peek(at) !== CH_SPACE && peek(at) !== 0) at++
.L5:
  ; basic/text.e16.ts:86  at++
  addi a1, a1, 1
.L7:
  lbu t0, 0(a1)
  li t1, 32
  beq t0, t1, .L9
  lbu t0, 0(a1)
  bne t0, zero, .L5
.L9:
  ; basic/text.e16.ts:87  if (peek(at) === 0) return 0
  lbu t0, 0(a1)
  bne t0, zero, .L10
  ; basic/text.e16.ts:87  return 0
  li a0, 0
  j .return
.L10:
  ; basic/text.e16.ts:88  at++
  addi a1, a1, 1
  ; basic/text.e16.ts:89  k++
  addi a2, a2, 1
.L3:
  bltu a2, a0, .L7
  ; basic/text.e16.ts:91  return at
  mv a0, a1
.return:
  ret

; basic/text.e16.ts:95 matches(text, word) at -O1
;   text in s3
;   word in s2
;   n in s1
matches:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  mv s3, a0 ; text
  mv s2, a1 ; word
  ; basic/text.e16.ts:96  let n: u16 = 0
  li s1, 0 ; n
  ; basic/text.e16.ts:97  while (peek(word + n) !== CH_SPACE && peek(word + n) !== 0) {
  j .L3
.L1:
  ; basic/text.e16.ts:98  if (upper(peek(text + n)) !== peek(word + n)) return 0
  add t0, s3, s1
  lbu a0, 0(t0)
  call upper
  add t0, s2, s1
  lbu t0, 0(t0)
  beq a0, t0, .L5
  ; basic/text.e16.ts:98  return 0
  li a0, 0
  j .return
.L5:
  ; basic/text.e16.ts:99  n++
  addi s1, s1, 1
.L3:
  add t0, s2, s1
  lbu t0, 0(t0)
  li t1, 32
  beq t0, t1, .L6
  add t0, s2, s1
  lbu t0, 0(t0)
  bne t0, zero, .L1
.L6:
  ; basic/text.e16.ts:101  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/text.e16.ts:107 keywordAt(text) at -O1
;   text in 4(fp)
;   best in 0(fp)
;   bestLength in s2
;   at in s1
;   token in s3
;   n in 2(fp)
keywordAt:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  sw a0, 4(fp) ; text
  ; basic/text.e16.ts:108  let best: u16 = 0
  sw zero, 0(fp) ; best
  ; basic/text.e16.ts:109  let bestLength: u16 = 0
  li s2, 0 ; bestLength
  ; basic/text.e16.ts:110  let at = KEYWORDS
  la s1, str_0
  ; basic/text.e16.ts:111  let token: u16 = 0x80
  li s3, 128 ; token
  ; basic/text.e16.ts:112  while (peek(at) !== 0) {
  j .L3
.L1:
  ; basic/text.e16.ts:113  const n = matches(text, at)
  lw a0, 4(fp)
  mv a1, s1
  call matches
  sw a0, 2(fp) ; n
  ; basic/text.e16.ts:114  if (n > bestLength) {
  lw t0, 2(fp) ; n
  bgeu s2, t0, .L8
  ; basic/text.e16.ts:115  best = token
  sw s3, 0(fp) ; best
  ; basic/text.e16.ts:116  bestLength = n
  lw s2, 2(fp) ; n
  ; basic/text.e16.ts:118  while (peek(at) !== CH_SPACE && peek(at) !== 0) at++
  j .L8
.L6:
  ; basic/text.e16.ts:118  at++
  addi s1, s1, 1
.L8:
  lbu t0, 0(s1)
  li t1, 32
  beq t0, t1, .L10
  lbu t0, 0(s1)
  bne t0, zero, .L6
.L10:
  ; basic/text.e16.ts:119  if (peek(at) === CH_SPACE) at++
  lbu t0, 0(s1)
  li t1, 32
  bne t0, t1, .L11
  ; basic/text.e16.ts:119  at++
  addi s1, s1, 1
.L11:
  ; basic/text.e16.ts:120  token++
  addi s3, s3, 1
.L3:
  lbu t0, 0(s1)
  bne t0, zero, .L1
  ; basic/text.e16.ts:122  matchedLength = bestLength
  sw s2, 0x0100(zero)
  ; basic/text.e16.ts:123  return best
  lw a0, 0(fp)
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; basic/text.e16.ts:131 tokenize(text, out) at -O1
;   text in 0(fp)
;   out in 2(fp)
;   i in s1
;   o in s2
;   quoted in 4(fp)
;   rest in 8(fp)
;   c in s3
;   kept in 10(fp)
;   token in 6(fp)
tokenize:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s1, 14(sp)
  sw s2, 16(sp)
  sw s3, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  sw a0, 0(fp) ; text
  sw a1, 2(fp) ; out
  ; basic/text.e16.ts:132  let i: u16 = 0
  li s1, 0 ; i
  ; basic/text.e16.ts:133  let o: u16 = 0
  li s2, 0 ; o
  ; basic/text.e16.ts:134  let quoted = false
  sw zero, 4(fp) ; quoted
  ; basic/text.e16.ts:135  let rest = false
  sw zero, 8(fp) ; rest
  ; basic/text.e16.ts:136  while (peek(text + i) !== 0) {
  j .L3
.L1:
  ; basic/text.e16.ts:137  const c: u8 = peek(text + i)
  lw t0, 0(fp) ; text
  add t0, t0, s1
  lbu s3, 0(t0)
  ; basic/text.e16.ts:139  const kept: bool = quoted || rest
  lw t0, 4(fp)
  lw t1, 4(fp)
  bnez t1, .L5
  lw t0, 8(fp)
.L5:
  sw t0, 10(fp) ; kept
  ; basic/text.e16.ts:140  const token: u16 = kept || !isLetter(c) ? 0 : keywordAt(text + i)
  lw t0, 10(fp) ; kept
  bnez t0, .L8
  mv a0, s3
  call isLetter
  bnez a0, .L6
.L8:
  li t0, 0
  j .L7
.L6:
  lw t0, 0(fp) ; text
  add a0, t0, s1
  call keywordAt
  mv t0, a0
.L7:
  sw t0, 6(fp) ; token
  ; basic/text.e16.ts:141  if (token !== 0) {
  lw t0, 6(fp) ; token
  beq t0, zero, .L9
  ; basic/text.e16.ts:142  poke(out + o, token)
  lw t0, 2(fp) ; out
  add t0, t0, s2
  lw t1, 6(fp) ; token
  sb t1, 0(t0)
  ; basic/text.e16.ts:143  i += matchedLength
  lw t0, 0x0100(zero)
  add s1, s1, t0
  ; basic/text.e16.ts:144  rest = token === T_REM
  li t0, 147
  lw t1, 6(fp) ; token
  sub t1, t1, t0
  seqz t1, t1
  sw t1, 8(fp) ; rest
  j .L10
.L9:
  ; basic/text.e16.ts:146  if (c === CH_QUOTE) quoted = !quoted
  li t0, 34
  bne s3, t0, .L11
  ; basic/text.e16.ts:146  quoted = !quoted
  lw t0, 4(fp) ; quoted
  seqz t0, t0
  sw t0, 4(fp) ; quoted
.L11:
  ; basic/text.e16.ts:147  poke(out + o, kept ? c : upper(c))
  lw t0, 2(fp) ; out
  add t0, t0, s2
  lw t1, 10(fp)
  beqz t1, .L12
  mv t1, s3
  j .L13
.L12:
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s3
  call upper
  lw t0, 0(sp)
  addi sp, sp, 2
  mv t1, a0
.L13:
  sb t1, 0(t0)
  ; basic/text.e16.ts:148  i++
  addi s1, s1, 1
.L10:
  ; basic/text.e16.ts:150  o++
  addi s2, s2, 1
.L3:
  lw t0, 0(fp) ; text
  add t0, t0, s1
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; basic/text.e16.ts:152  poke(out + o, 0)
  lw t0, 2(fp) ; out
  add t0, t0, s2
  sb zero, 0(t0)
  ; basic/text.e16.ts:153  return o + 1
  addi a0, s2, 1
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s1, 14(sp)
  lw s2, 16(sp)
  lw s3, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; basic/text.e16.ts:161 expand(at, out, max) at -O1
;   at in 10(fp)
;   out in 4(fp)
;   max in 6(fp)
;   p in 0(fp)
;   n in s2
;   quoted in 2(fp)
;   raw in 8(fp)
;   c in s3
;   w in s1
expand:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s2, 14(sp)
  sw s3, 16(sp)
  sw s1, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  sw a0, 10(fp) ; at
  sw a1, 4(fp) ; out
  sw a2, 6(fp) ; max
  ; basic/text.e16.ts:162  let p = at
  lw t0, 10(fp) ; at
  sw t0, 0(fp) ; p
  ; basic/text.e16.ts:163  let n: u16 = 0
  li s2, 0 ; n
  ; basic/text.e16.ts:164  let quoted = false
  sw zero, 2(fp) ; quoted
  ; basic/text.e16.ts:165  let raw = false
  sw zero, 8(fp) ; raw
  ; basic/text.e16.ts:166  while (peek(p) !== 0) {
  j .L3
.L1:
  ; basic/text.e16.ts:167  const c: u8 = peek(p)
  lw t0, 0(fp) ; p
  lbu s3, 0(t0)
  ; basic/text.e16.ts:168  if (c >= 0x80 && !quoted && !raw) {
  li t0, 128
  bltu s3, t0, .L5
  lw t0, 2(fp) ; quoted
  bnez t0, .L5
  lw t0, 8(fp) ; raw
  bnez t0, .L5
  ; basic/text.e16.ts:169  let w = keywordText(c)
  mv a0, s3
  call keywordText
  mv s1, a0 ; w
  ; basic/text.e16.ts:170  while (w !== 0 && peek(w) !== CH_SPACE && peek(w) !== 0) {
  j .L8
.L6:
  ; basic/text.e16.ts:171  n = give(out, n, max, peek(w))
  lbu t0, 0(s1)
  lw a0, 4(fp)
  mv a1, s2
  lw a2, 6(fp)
  mv a3, t0
  call give
  mv s2, a0 ; n
  ; basic/text.e16.ts:172  w++
  addi s1, s1, 1
.L8:
  beq s1, zero, .L10
  lbu t0, 0(s1)
  li t1, 32
  beq t0, t1, .L10
  lbu t0, 0(s1)
  bne t0, zero, .L6
.L10:
  ; basic/text.e16.ts:174  raw = c === T_REM
  li t0, 147
  sub t0, s3, t0
  seqz t0, t0
  sw t0, 8(fp) ; raw
  j .L11
.L5:
  ; basic/text.e16.ts:176  if (c === CH_QUOTE) quoted = !quoted
  li t0, 34
  bne s3, t0, .L12
  ; basic/text.e16.ts:176  quoted = !quoted
  lw t0, 2(fp) ; quoted
  seqz t0, t0
  sw t0, 2(fp) ; quoted
.L12:
  ; basic/text.e16.ts:177  n = give(out, n, max, c)
  lw a0, 4(fp)
  mv a1, s2
  lw a2, 6(fp)
  mv a3, s3
  call give
  mv s2, a0 ; n
.L11:
  ; basic/text.e16.ts:179  p++
  lw t0, 0(fp) ; p
  addi t0, t0, 1
  sw t0, 0(fp) ; p
.L3:
  lw t0, 0(fp) ; p
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; basic/text.e16.ts:181  return n
  mv a0, s2
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s2, 14(sp)
  lw s3, 16(sp)
  lw s1, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; basic/text.e16.ts:185 give(out, n, max, c) at -O1
;   out in s2
;   n in s1
;   max in s0
;   c in s3
give:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s0, 6(sp)
  sw s3, 8(sp)
  mv s2, a0 ; out
  mv s1, a1 ; n
  mv s0, a2 ; max
  mv s3, a3 ; c
  ; basic/text.e16.ts:186  if (out === 0) {
  bne s2, zero, .L1
  ; basic/text.e16.ts:187  putc(c)
  mv a0, s3
  call putc
  ; basic/text.e16.ts:188  return n + 1
  addi a0, s1, 1
  j .return
.L1:
  ; basic/text.e16.ts:190  if (n >= max) return n
  bltu s1, s0, .L2
  ; basic/text.e16.ts:190  return n
  mv a0, s1
  j .return
.L2:
  ; basic/text.e16.ts:191  poke(out + n, c)
  add t0, s2, s1
  sb s3, 0(t0)
  ; basic/text.e16.ts:192  return n + 1
  addi a0, s1, 1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; basic/text.e16.ts:196 unsignedText(value, out) at -O1
;   value in s1
;   out in s3
;   n in s2
unsignedText:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; value
  mv s3, a1 ; out
  ; basic/text.e16.ts:197  let n: u16 = 0
  li s2, 0 ; n
  ; basic/text.e16.ts:198  if (value >= 10) n = unsignedText(div(value, 10), out)
  li t0, 10
  bltu s1, t0, .L1
  ; basic/text.e16.ts:198  n = unsignedText(div(value, 10), out)
  li t0, 10
  divu a0, s1, t0
  mv a1, s3
  call unsignedText
  mv s2, a0 ; n
.L1:
  ; basic/text.e16.ts:199  poke(out + n, CH_0 + (value % 10))
  add t0, s3, s2
  li t1, 10
  remu t1, s1, t1
  addi t1, t1, 48
  sb t1, 0(t0)
  ; basic/text.e16.ts:200  return n + 1
  addi a0, s2, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; basic/text.e16.ts:204 printUnsigned(value) at -O1
;   value in s1
printUnsigned:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; value
  ; basic/text.e16.ts:205  if (value >= 10) printUnsigned(div(value, 10))
  li t0, 10
  bltu s1, t0, .L1
  ; basic/text.e16.ts:205  printUnsigned(div(value, 10))
  li t0, 10
  divu a0, s1, t0
  call printUnsigned
.L1:
  ; basic/text.e16.ts:206  putc(CH_0 + (value % 10))
  li t0, 10
  remu t0, s1, t0
  addi a0, t0, 48
  call putc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/edit.e16.ts:51 place(at) at -O1
;   at in s3
;   cols in s1
;   cell in s2
place:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; at
  ; basic/edit.e16.ts:52  const cols = peek16(COLS)
  lw s1, 4(zero)
  ; basic/edit.e16.ts:53  const cell = startX + at
  lw t0, 0x0102(zero)
  add s2, t0, s3
  ; basic/edit.e16.ts:54  locate(cell % cols, startY + div(cell, cols))
  remu t0, s2, s1
  lw t1, 0x0104(zero)
  divu t2, s2, s1
  add t1, t1, t2
  mv a0, t0
  mv a1, t1
  call locate
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; basic/edit.e16.ts:62 redraw(buf, length, from, at) at -O1
;   buf in 4(fp)
;   length in s2
;   from in s3
;   at in 6(fp)
;   k/cols in s1
;   cell in 8(fp)
;   expected in 0(fp)
;   now in 2(fp)
redraw:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s1, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  sw a0, 4(fp) ; buf
  mv s2, a1 ; length
  mv s3, a2 ; from
  sw a3, 6(fp) ; at
  ; basic/edit.e16.ts:63  place(from)
  mv a0, s3
  call place
  ; basic/edit.e16.ts:64  for (let k = from; k < length; k++) putc(peek(buf + k))
  mv s1, s3 ; k/cols
  j .L3
.L1:
  ; basic/edit.e16.ts:64  putc(peek(buf + k))
  lw t0, 4(fp) ; buf
  add t0, t0, s1
  lbu a0, 0(t0)
  call putc
  addi s1, s1, 1
.L3:
  bltu s1, s2, .L1
  ; basic/edit.e16.ts:65  putc(CH_SPACE)
  li a0, 32
  call putc
  ; basic/edit.e16.ts:66  const cols = peek16(COLS)
  lw s1, 4(zero)
  ; basic/edit.e16.ts:67  const cell = startX + length + 1
  lw t0, 0x0102(zero)
  add t0, t0, s2
  addi t0, t0, 1
  sw t0, 8(fp) ; cell
  ; basic/edit.e16.ts:68  const expected = startY + div(cell, cols)
  lw t0, 0x0104(zero)
  lw t1, 8(fp) ; cell
  divu t1, t1, s1
  add t0, t0, t1
  sw t0, 0(fp) ; expected
  ; basic/edit.e16.ts:70  const now = peek16(CURY)
  lw t0, 2(zero)
  sw t0, 2(fp) ; now
  ; basic/edit.e16.ts:71  if (now < expected) startY -= expected - now
  lw t0, 0(fp) ; expected
  lw t1, 2(fp) ; now
  bgeu t1, t0, .L5
  ; basic/edit.e16.ts:71  startY -= expected - now
  lw t0, 0x0104(zero)
  lw t1, 2(fp) ; now
  lw t2, 0(fp) ; expected
  sub t2, t2, t1
  sub t0, t0, t2
  sw t0, 0x0104(zero)
.L5:
  ; basic/edit.e16.ts:72  place(at)
  lw a0, 6(fp)
  call place
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s1, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; basic/edit.e16.ts:81 editLine(buf, max, length) at -O1
;   buf in s2
;   max in 2(fp)
;   length in s3
;   k in 0(fp)
;   control in s1
editLine:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; buf
  sw a1, 2(fp) ; max
  mv s3, a2 ; length
  ; basic/edit.e16.ts:82  startX = peek16(CURX)
  lw t0, 0(zero)
  sw t0, 0x0102(zero)
  ; basic/edit.e16.ts:83  startY = peek16(CURY)
  lw t0, 2(zero)
  sw t0, 0x0104(zero)
  ; basic/edit.e16.ts:84  n = length
  sw s3, 0x0106(zero)
  ; basic/edit.e16.ts:85  at = length
  sw s3, 0x0108(zero)
  ; basic/edit.e16.ts:86  redraw(buf, n, 0, at)
  lw t0, 0x0106(zero)
  lw t1, 0x0108(zero)
  mv a0, s2
  mv a1, t0
  li a2, 0
  mv a3, t1
  call redraw
  ; basic/edit.e16.ts:87  poke16(IO_CURMODE, 6)
  li t0, 6
  li t1, 65324
  sw t0, 0(t1)
  ; basic/edit.e16.ts:88  for (;;) {
.L1:
  ; basic/edit.e16.ts:89  const k = getkey()
  call getkey
  sw a0, 0(fp) ; k
  ; basic/edit.e16.ts:90  const control = controlKey(k)
  lw a0, 0(fp)
  call controlKey
  mv s1, a0 ; control
  ; basic/edit.e16.ts:91  if (control === 0) {
  bne s1, zero, .L5
  ; basic/edit.e16.ts:92  editKey(buf, max, k)
  mv a0, s2
  lw a1, 2(fp)
  lw a2, 0(fp)
  call editKey
  ; basic/edit.e16.ts:93  continue
  j .L1
.L5:
  ; basic/edit.e16.ts:95  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; basic/edit.e16.ts:97  place(n)
  lw a0, 0x0106(zero)
  call place
  ; basic/edit.e16.ts:98  if (control === EDIT_CLS) cls()
  li t0, 65535
  bne s1, t0, .L6
  ; basic/edit.e16.ts:98  cls()
  call cls
.L6:
  ; basic/edit.e16.ts:99  if (control === EDIT_UP || control === EDIT_DOWN) rubOut(n)
  li t0, 65532
  beq s1, t0, .L8
  li t0, 65531
  bne s1, t0, .L7
.L8:
  ; basic/edit.e16.ts:99  rubOut(n)
  lw a0, 0x0106(zero)
  call rubOut
.L7:
  ; basic/edit.e16.ts:100  if (control !== 1) return control
  li t0, 1
  beq s1, t0, .L9
  ; basic/edit.e16.ts:100  return control
  mv a0, s1
  j .return
.L9:
  ; basic/edit.e16.ts:101  poke(buf + n, 0)
  lw t0, 0x0106(zero)
  add t0, s2, t0
  sb zero, 0(t0)
  ; basic/edit.e16.ts:102  return i16(n)
  lw a0, 0x0106(zero)
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/edit.e16.ts:111 editKey(buf, max, k) at -O1
;   buf in s2
;   max in s3
;   k in s1
editKey:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; buf
  mv s3, a1 ; max
  mv s1, a2 ; k
  ; basic/edit.e16.ts:112  if (k === K_LEFT || k === K_RIGHT) step(k === K_RIGHT)
  li t0, 28
  beq s1, t0, .L2
  li t0, 29
  bne s1, t0, .L1
.L2:
  ; basic/edit.e16.ts:112  step(k === K_RIGHT)
  li t0, 29
  sub t0, s1, t0
  seqz a0, t0
  call step
  j .L3
.L1:
  ; basic/edit.e16.ts:113  if (k === K_BS || k === K_DEL) erase(buf, k === K_BS)
  li t0, 8
  beq s1, t0, .L5
  li t0, 15
  bne s1, t0, .L4
.L5:
  ; basic/edit.e16.ts:113  erase(buf, k === K_BS)
  li t0, 8
  sub t0, s1, t0
  seqz t0, t0
  mv a0, s2
  mv a1, t0
  call erase
  j .L6
.L4:
  ; basic/edit.e16.ts:114  if (k === K_INS && n < max) n = openSpace(buf, n, at)
  li t0, 14
  bne s1, t0, .L7
  lw t0, 0x0106(zero)
  bgeu t0, s3, .L7
  ; basic/edit.e16.ts:114  n = openSpace(buf, n, at)
  lw t0, 0x0106(zero)
  lw t1, 0x0108(zero)
  mv a0, s2
  mv a1, t0
  mv a2, t1
  call openSpace
  sw a0, 0x0106(zero)
  j .L8
.L7:
  ; basic/edit.e16.ts:115  if (k >= CH_SPACE && (at < n || n < max)) write(buf, k)
  li t0, 32
  bltu s1, t0, .L9
  lw t0, 0x0108(zero)
  lw t1, 0x0106(zero)
  bltu t0, t1, .L10
  lw t0, 0x0106(zero)
  bgeu t0, s3, .L9
.L10:
  ; basic/edit.e16.ts:115  write(buf, k)
  mv a0, s2
  mv a1, s1
  call write
.L9:
.L8:
.L6:
.L3:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/edit.e16.ts:119 step(right) at -O1
;   right in s1
step:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; right
  ; basic/edit.e16.ts:120  if (right && at < n) at++
  beqz s1, .L1
  lw t0, 0x0108(zero)
  lw t1, 0x0106(zero)
  bgeu t0, t1, .L1
  ; basic/edit.e16.ts:120  at++
  lw t0, 0x0108(zero)
  addi t0, t0, 1
  sw t0, 0x0108(zero)
.L1:
  ; basic/edit.e16.ts:121  if (!right && at > 0) at--
  bnez s1, .L2
  lw t0, 0x0108(zero)
  bgeu zero, t0, .L2
  ; basic/edit.e16.ts:121  at--
  lw t0, 0x0108(zero)
  addi t0, t0, -1
  sw t0, 0x0108(zero)
.L2:
  ; basic/edit.e16.ts:122  place(at)
  lw a0, 0x0108(zero)
  call place
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/edit.e16.ts:126 erase(buf, before) at -O1
;   buf in s1
;   before in s2
erase:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; buf
  mv s2, a1 ; before
  ; basic/edit.e16.ts:127  if (before) {
  beqz s2, .L1
  ; basic/edit.e16.ts:128  if (at === 0) return
  lw t0, 0x0108(zero)
  bne t0, zero, .L2
  ; basic/edit.e16.ts:128  return
  j .return
.L2:
  ; basic/edit.e16.ts:129  at--
  lw t0, 0x0108(zero)
  addi t0, t0, -1
  sw t0, 0x0108(zero)
  j .L3
.L1:
  ; basic/edit.e16.ts:130  if (at === n) return
  lw t0, 0x0108(zero)
  lw t1, 0x0106(zero)
  bne t0, t1, .L4
  ; basic/edit.e16.ts:130  return
  j .return
.L4:
.L3:
  ; basic/edit.e16.ts:131  n = takeOut(buf, n, at)
  lw t0, 0x0106(zero)
  lw t1, 0x0108(zero)
  mv a0, s1
  mv a1, t0
  mv a2, t1
  call takeOut
  sw a0, 0x0106(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/edit.e16.ts:135 write(buf, k) at -O1
;   buf in s1
;   k in s2
write:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; buf
  mv s2, a1 ; k
  ; basic/edit.e16.ts:136  poke(buf + at, k)
  lw t0, 0x0108(zero)
  add t0, s1, t0
  sb s2, 0(t0)
  ; basic/edit.e16.ts:137  if (at === n) n++
  lw t0, 0x0108(zero)
  lw t1, 0x0106(zero)
  bne t0, t1, .L1
  ; basic/edit.e16.ts:137  n++
  lw t0, 0x0106(zero)
  addi t0, t0, 1
  sw t0, 0x0106(zero)
.L1:
  ; basic/edit.e16.ts:138  at++
  lw t0, 0x0108(zero)
  addi t0, t0, 1
  sw t0, 0x0108(zero)
  ; basic/edit.e16.ts:139  redraw(buf, n, at - 1, at)
  lw t0, 0x0106(zero)
  lw t1, 0x0108(zero)
  lw t2, 0x0108(zero)
  mv a0, s1
  mv a1, t0
  addi a2, t1, -1
  mv a3, t2
  call redraw
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/edit.e16.ts:143 controlKey(k) at -O1
;   k in a0
controlKey:
  ; basic/edit.e16.ts:144  if (k === K_ENTER) return 1
  li t0, 13
  bne a0, t0, .L1
  ; basic/edit.e16.ts:144  return 1
  li a0, 1
  j .return
.L1:
  ; basic/edit.e16.ts:145  if (k === K_CLS) return EDIT_CLS
  li t0, 12
  bne a0, t0, .L2
  ; basic/edit.e16.ts:145  return EDIT_CLS
  li a0, 65535
  j .return
.L2:
  ; basic/edit.e16.ts:146  if (k === K_BRK) return EDIT_BRK
  li t0, 3
  bne a0, t0, .L3
  ; basic/edit.e16.ts:146  return EDIT_BRK
  li a0, 65534
  j .return
.L3:
  ; basic/edit.e16.ts:147  if (k === K_MODE) return EDIT_MODE
  li t0, 16
  bne a0, t0, .L4
  ; basic/edit.e16.ts:147  return EDIT_MODE
  li a0, 65533
  j .return
.L4:
  ; basic/edit.e16.ts:148  if (k === K_UP) return EDIT_UP
  li t0, 30
  bne a0, t0, .L5
  ; basic/edit.e16.ts:148  return EDIT_UP
  li a0, 65532
  j .return
.L5:
  ; basic/edit.e16.ts:149  if (k === K_DOWN) return EDIT_DOWN
  li t0, 31
  bne a0, t0, .L6
  ; basic/edit.e16.ts:149  return EDIT_DOWN
  li a0, 65531
  j .return
.L6:
  ; basic/edit.e16.ts:150  return 0
  li a0, 0
.return:
  ret

; basic/edit.e16.ts:154 rubOut(n) at -O1
;   n in s2
;   k in s1
rubOut:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; n
  ; basic/edit.e16.ts:155  place(0)
  li a0, 0
  call place
  ; basic/edit.e16.ts:156  for (let k: u16 = 0; k < n; k++) putc(CH_SPACE)
  li s1, 0 ; k
  j .L3
.L1:
  ; basic/edit.e16.ts:156  putc(CH_SPACE)
  li a0, 32
  call putc
  addi s1, s1, 1
.L3:
  bltu s1, s2, .L1
  ; basic/edit.e16.ts:157  place(0)
  li a0, 0
  call place
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/edit.e16.ts:161 takeOut(buf, n, at) at -O1
;   buf in s2
;   n in s3
;   at in s0
;   k in s1
takeOut:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; buf
  mv s3, a1 ; n
  mv s0, a2 ; at
  ; basic/edit.e16.ts:162  for (let k = at; k + 1 < n; k++) poke(buf + k, peek(buf + k + 1))
  mv s1, s0 ; k
  j .L3
.L1:
  ; basic/edit.e16.ts:162  poke(buf + k, peek(buf + k + 1))
  add t0, s2, s1
  add t1, s2, s1
  lbu t1, 1(t1)
  sb t1, 0(t0)
  addi s1, s1, 1
.L3:
  addi t0, s1, 1
  bltu t0, s3, .L1
  ; basic/edit.e16.ts:163  redraw(buf, n - 1, at, at)
  mv a0, s2
  addi a1, s3, -1
  mv a2, s0
  mv a3, s0
  call redraw
  ; basic/edit.e16.ts:164  return n - 1
  addi a0, s3, -1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; basic/edit.e16.ts:168 openSpace(buf, n, at) at -O1
;   buf in s2
;   n in s0
;   at in s3
;   k in s1
openSpace:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s0, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; buf
  mv s0, a1 ; n
  mv s3, a2 ; at
  ; basic/edit.e16.ts:169  for (let k = n; k > at; k--) poke(buf + k, peek(buf + k - 1))
  mv s1, s0 ; k
  j .L3
.L1:
  ; basic/edit.e16.ts:169  poke(buf + k, peek(buf + k - 1))
  add t0, s2, s1
  add t1, s2, s1
  lbu t1, -1(t1)
  sb t1, 0(t0)
  addi s1, s1, -1
.L3:
  bltu s3, s1, .L1
  ; basic/edit.e16.ts:170  poke(buf + at, CH_SPACE)
  add t0, s2, s3
  li t1, 32
  sb t1, 0(t0)
  ; basic/edit.e16.ts:171  redraw(buf, n + 1, at, at)
  mv a0, s2
  addi a1, s0, 1
  mv a2, s3
  mv a3, s3
  call redraw
  ; basic/edit.e16.ts:172  return n + 1
  addi a0, s0, 1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s0, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:202 errorWord(code) at -O1
;   code in a0
errorWord:
  ; basic/basic.e16.ts:203  switch (code) {
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
  j .L11
.L2:
  ; basic/basic.e16.ts:205  return str('SYNTAX')
  la a0, str_2
  j .return
.L3:
  ; basic/basic.e16.ts:207  return str('OVERFLOW')
  la a0, str_3
  j .return
.L4:
  ; basic/basic.e16.ts:209  return str('DIV BY 0')
  la a0, str_4
  j .return
.L5:
  ; basic/basic.e16.ts:211  return str('ARGUMENT')
  la a0, str_5
  j .return
.L6:
  ; basic/basic.e16.ts:213  return str('NO LINE')
  la a0, str_6
  j .return
.L7:
  ; basic/basic.e16.ts:215  return str('NEXT')
  la a0, str_7
  j .return
.L8:
  ; basic/basic.e16.ts:217  return str('RETURN')
  la a0, str_8
  j .return
.L9:
  ; basic/basic.e16.ts:219  return str('MEMORY')
  la a0, str_9
  j .return
.L10:
  ; basic/basic.e16.ts:221  return str('TOO COMPLEX')
  la a0, str_10
  j .return
.L11:
  ; basic/basic.e16.ts:223  return str('CONT')
  la a0, str_11
.return:
  ret

; basic/basic.e16.ts:228 inLine() at -O1
inLine:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:229  if (curLine === 0) return
  lw t0, 0x010c(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:229  return
  j .return
.L1:
  ; basic/basic.e16.ts:230  puts(str(' IN '))
  la a0, str_12
  call puts
  ; basic/basic.e16.ts:231  printUnsigned(peek16(curLine))
  lw t0, 0x010c(zero)
  lw a0, 0(t0)
  call printUnsigned
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:235 fail(code) at -O1
;   code in s1
fail:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; code
  ; basic/basic.e16.ts:236  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:237  puts(str('ERR:'))
  la a0, str_13
  call puts
  ; basic/basic.e16.ts:238  puts(errorWord(code))
  mv a0, s1
  call errorWord
  call puts
  ; basic/basic.e16.ts:239  if (running) inLine()
  lw t0, 0x0118(zero)
  beqz t0, .L1
  ; basic/basic.e16.ts:239  inLine()
  call inLine
.L1:
  ; basic/basic.e16.ts:240  newline()
  call newline
  ; basic/basic.e16.ts:241  contLine = 0
  sw zero, 0x011a(zero)
  ; basic/basic.e16.ts:242  stopRunning()
  call stopRunning
  ; basic/basic.e16.ts:243  basic_abort()
  call basic_abort
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:247 checkBreak() at -O1
checkBreak:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:248  if (peek16(BRKFLAG) === 0) return
  lw t0, 30(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:248  return
  j .return
.L1:
  ; basic/basic.e16.ts:249  poke16(BRKFLAG, 0)
  sw zero, 30(zero)
  ; basic/basic.e16.ts:250  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:251  puts(str('BREAK'))
  la a0, str_14
  call puts
  ; basic/basic.e16.ts:252  if (running) inLine()
  lw t0, 0x0118(zero)
  beqz t0, .L2
  ; basic/basic.e16.ts:252  inLine()
  call inLine
.L2:
  ; basic/basic.e16.ts:253  newline()
  call newline
  ; basic/basic.e16.ts:254  contLine = curLine
  lw t0, 0x010c(zero)
  sw t0, 0x011a(zero)
  ; basic/basic.e16.ts:255  contTxt = txt
  lw t0, 0x010a(zero)
  sw t0, 0x011c(zero)
  ; basic/basic.e16.ts:256  stopRunning()
  call stopRunning
  ; basic/basic.e16.ts:257  basic_abort()
  call basic_abort
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:260 marks() at -O1
;   m in s1
marks:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:261  let m: u16 = proMode ? ANN_PRO : ANN_RUN
  lw t0, 0x0124(zero)
  beqz t0, .L1
  li t0, 32
  j .L2
.L1:
  li t0, 16
.L2:
  mv s1, t0 ; m
  ; basic/basic.e16.ts:262  m |= angleMarks
  lw t0, 0x0126(zero)
  or s1, s1, t0
  ; basic/basic.e16.ts:263  if (running) m |= ANN_BUSY
  lw t0, 0x0118(zero)
  beqz t0, .L3
  ; basic/basic.e16.ts:263  m |= ANN_BUSY
  ori s1, s1, 1
.L3:
  ; basic/basic.e16.ts:264  poke16(ANNMODE, m)
  sw s1, 26(zero)
  ; basic/basic.e16.ts:265  annunciate()
  call annunciate
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:268 stopRunning() at -O1
stopRunning:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:269  running = false
  sw zero, 0x0118(zero)
  ; basic/basic.e16.ts:270  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0112(zero)
  ; basic/basic.e16.ts:271  marks()
  call marks
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:277 next() at -O1
next:
  ; basic/basic.e16.ts:278  while (peek(txt) === CH_SPACE) txt++
  j .L3
.L1:
  ; basic/basic.e16.ts:278  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
.L3:
  lw t0, 0x010a(zero)
  lbu t0, 0(t0)
  li t1, 32
  beq t0, t1, .L1
  ; basic/basic.e16.ts:279  return peek(txt)
  lw t0, 0x010a(zero)
  lbu a0, 0(t0)
.return:
  ret

; basic/basic.e16.ts:282 expect(c) at -O1
;   c in s1
expect:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/basic.e16.ts:283  if (next() !== c) fail(E_SYNTAX)
  call next
  beq a0, s1, .L1
  ; basic/basic.e16.ts:283  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:284  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:287 isDigit(c) at -O1
;   c in a0
isDigit:
  ; basic/basic.e16.ts:288  return c >= CH_0 && c <= CH_9
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

; basic/basic.e16.ts:292 readUnsigned() at -O1
;   v in s1
readUnsigned:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:293  next()
  call next
  ; basic/basic.e16.ts:294  if (!isDigit(peek(txt))) fail(E_SYNTAX)
  lw t0, 0x010a(zero)
  lbu a0, 0(t0)
  call isDigit
  bnez a0, .L1
  ; basic/basic.e16.ts:294  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:295  let v: u16 = 0
  li s1, 0 ; v
  ; basic/basic.e16.ts:296  while (isDigit(peek(txt))) {
  j .L4
.L2:
  ; basic/basic.e16.ts:297  v = wrapMul10(v) + (peek(txt) - CH_0)
  mv a0, s1
  call wrapMul10
  lw t0, 0x010a(zero)
  lbu t0, 0(t0)
  addi t0, t0, -48
  add s1, a0, t0
  ; basic/basic.e16.ts:298  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
.L4:
  lw t0, 0x010a(zero)
  lbu a0, 0(t0)
  call isDigit
  bnez a0, .L2
  ; basic/basic.e16.ts:300  return v
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:303 wrapMul10(v) at -O1
;   v in s1
wrapMul10:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; basic/basic.e16.ts:304  if (v > 6553) fail(E_LINE)
  li t0, 6553
  bgeu t0, s1, .L1
  ; basic/basic.e16.ts:304  fail(E_LINE)
  li a0, 5
  call fail
.L1:
  ; basic/basic.e16.ts:305  return v * 10
  slli t1, s1, 3
  slli t0, s1, 1
  add a0, t0, t1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:311 math(op, a, b) at -O1
;   op in s2
;   a in s3
;   b in s0
;   status in s1
math:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; op
  mv s3, a1 ; a
  mv s0, a2 ; b
  ; basic/basic.e16.ts:312  poke16(MATH_A, a)
  li t0, 65362
  sw s3, 0(t0)
  ; basic/basic.e16.ts:313  poke16(MATH_B, b)
  li t0, 65364
  sw s0, 0(t0)
  ; basic/basic.e16.ts:314  poke16(MATH_OP, op)
  li t0, 65360
  sw s2, 0(t0)
  ; basic/basic.e16.ts:315  const status = peek16(MATH_STATUS)
  li t0, 65368
  lw s1, 0(t0)
  ; basic/basic.e16.ts:316  if (status === 0) return
  bne s1, zero, .L1
  ; basic/basic.e16.ts:316  return
  j .return
.L1:
  ; basic/basic.e16.ts:317  if (status === 1) fail(E_OVERFLOW)
  li t0, 1
  bne s1, t0, .L2
  ; basic/basic.e16.ts:317  fail(E_OVERFLOW)
  li a0, 2
  call fail
.L2:
  ; basic/basic.e16.ts:318  if (status === 2) fail(E_DIVIDE)
  li t0, 2
  bne s1, t0, .L3
  ; basic/basic.e16.ts:318  fail(E_DIVIDE)
  li a0, 3
  call fail
.L3:
  ; basic/basic.e16.ts:319  fail(E_ARGUMENT)
  li a0, 4
  call fail
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:323 push() at -O1
;   at in s1
push:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:324  if (nsp >= addr(nums) + 192) fail(E_COMPLEX)
  lw t0, 0x0112(zero)
  li t1, nums+192
  bltu t0, t1, .L1
  ; basic/basic.e16.ts:324  fail(E_COMPLEX)
  li a0, 9
  call fail
.L1:
  ; basic/basic.e16.ts:325  const at = nsp
  lw s1, 0x0112(zero)
  ; basic/basic.e16.ts:326  nsp += 8
  lw t0, 0x0112(zero)
  addi t0, t0, 8
  sw t0, 0x0112(zero)
  ; basic/basic.e16.ts:327  return at
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:330 top() at -O1
top:
  ; basic/basic.e16.ts:331  return nsp - 8
  lw t0, 0x0112(zero)
  addi a0, t0, -8
.return:
  ret

; basic/basic.e16.ts:334 copy8(from, to) at -O1
;   from in a0
;   to in a1
copy8:
  ; basic/basic.e16.ts:335  poke16(to, peek16(from))
  lw t0, 0(a0)
  sw t0, 0(a1)
  ; basic/basic.e16.ts:336  poke16(to + 2, peek16(from + 2))
  lw t0, 2(a0)
  sw t0, 2(a1)
  ; basic/basic.e16.ts:337  poke16(to + 4, peek16(from + 4))
  lw t0, 4(a0)
  sw t0, 4(a1)
  ; basic/basic.e16.ts:338  poke16(to + 6, peek16(from + 6))
  lw t0, 6(a0)
  sw t0, 6(a1)
.return:
  ret

; basic/basic.e16.ts:341 isZero(at) at -O1
;   at in a0
isZero:
  ; basic/basic.e16.ts:342  return peek(at + 2) === 0
  lbu t0, 2(a0)
  sub t0, t0, zero
  seqz a0, t0
.return:
  ret

; basic/basic.e16.ts:345 setInt(at, v) at -O1
;   at in s1
;   v in s2
setInt:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; at
  mv s2, a1 ; v
  ; basic/basic.e16.ts:346  poke16(MATH_ARG, u16(v))
  li t0, 65366
  sw s2, 0(t0)
  ; basic/basic.e16.ts:347  math(M_FROMINT, at, 0)
  li a0, 48
  mv a1, s1
  li a2, 0
  call math
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:351 toInt(at) at -O1
;   at in s1
toInt:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; basic/basic.e16.ts:352  math(M_TOINT, at, 0)
  li a0, 49
  mv a1, s1
  li a2, 0
  call math
  ; basic/basic.e16.ts:353  return i16(peek16(MATH_ARG))
  li t0, 65366
  lw a0, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:357 binary(op) at -O1
;   op in s1
;   b in s2
binary:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; op
  ; basic/basic.e16.ts:358  const b = top()
  call top
  mv s2, a0 ; b
  ; basic/basic.e16.ts:359  nsp -= 8
  lw t0, 0x0112(zero)
  addi t0, t0, -8
  sw t0, 0x0112(zero)
  ; basic/basic.e16.ts:360  math(op, top(), b)
  call top
  mv t0, a0
  mv a0, s1
  mv a1, t0
  mv a2, s2
  call math
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:364 literal() at -O1
;   at in s2
;   n in s1
literal:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; basic/basic.e16.ts:365  const at = push()
  call push
  mv s2, a0 ; at
  ; basic/basic.e16.ts:367  poke16(MATH_ARG, 255)
  li t0, 255
  li t1, 65366
  sw t0, 0(t1)
  ; basic/basic.e16.ts:368  math(M_PARSE, at, txt)
  lw t0, 0x010a(zero)
  li a0, 56
  mv a1, s2
  mv a2, t0
  call math
  ; basic/basic.e16.ts:369  const n = peek16(MATH_ARG)
  li t0, 65366
  lw s1, 0(t0)
  ; basic/basic.e16.ts:370  if (n === 0) fail(E_SYNTAX)
  bne s1, zero, .L1
  ; basic/basic.e16.ts:370  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:371  txt += n
  lw t0, 0x010a(zero)
  add t0, t0, s1
  sw t0, 0x010a(zero)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:375 formatTop() at -O1
;   n in s1
formatTop:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:376  poke16(MATH_ARG, 0)
  li t0, 65366
  sw zero, 0(t0)
  ; basic/basic.e16.ts:377  math(M_FORMAT, top(), addr(textOut))
  call top
  mv t0, a0
  li a0, 57
  mv a1, t0
  la a2, textOut
  call math
  ; basic/basic.e16.ts:378  const n = peek16(MATH_ARG)
  li t0, 65366
  lw s1, 0(t0)
  ; basic/basic.e16.ts:379  poke(addr(textOut) + n, 0)
  sb zero, textOut(s1)
  ; basic/basic.e16.ts:380  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:389 readName() at -O1
readName:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:390  next()
  call next
  ; basic/basic.e16.ts:391  name0 = peek(txt)
  lw t0, 0x010a(zero)
  lbu t0, 0(t0)
  sw t0, 0x03fe(zero)
  ; basic/basic.e16.ts:392  if (!isLetter(name0)) fail(E_SYNTAX)
  lw a0, 0x03fe(zero)
  call isLetter
  bnez a0, .L1
  ; basic/basic.e16.ts:392  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:393  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:394  name1 = peek(txt)
  lw t0, 0x010a(zero)
  lbu t0, 0(t0)
  sw t0, 0x0400(zero)
  ; basic/basic.e16.ts:395  if (isLetter(name1) || isDigit(name1)) txt++
  lw a0, 0x0400(zero)
  call isLetter
  bnez a0, .L3
  lw a0, 0x0400(zero)
  call isDigit
  beqz a0, .L2
.L3:
  ; basic/basic.e16.ts:395  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  j .L4
.L2:
  ; basic/basic.e16.ts:396  name1 = 0
  sw zero, 0x0400(zero)
.L4:
  ; basic/basic.e16.ts:397  if (peek(txt) === CH_DOLLAR) fail(E_SYNTAX)
  lw t0, 0x010a(zero)
  lbu t0, 0(t0)
  li t1, 36
  bne t0, t1, .L5
  ; basic/basic.e16.ts:397  fail(E_SYNTAX)
  li a0, 1
  call fail
.L5:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:401 findVar(make) at -O1
;   make in s3
;   at in s1
;   k in s2
findVar:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; make
  ; basic/basic.e16.ts:402  let at = progEnd + 2
  lw t0, 0x010e(zero)
  addi s1, t0, 2
  ; basic/basic.e16.ts:403  while (at < varEnd) {
  j .L3
.L1:
  ; basic/basic.e16.ts:404  if (peek(at) === name0 && peek(at + 1) === name1) return at + 2
  lbu t0, 0(s1)
  lw t1, 0x03fe(zero)
  bne t0, t1, .L5
  lbu t0, 1(s1)
  lw t1, 0x0400(zero)
  bne t0, t1, .L5
  ; basic/basic.e16.ts:404  return at + 2
  addi a0, s1, 2
  j .return
.L5:
  ; basic/basic.e16.ts:405  at += 10
  addi s1, s1, 10
.L3:
  lw t0, 0x0110(zero)
  bltu s1, t0, .L1
  ; basic/basic.e16.ts:407  if (!make) return 0
  bnez s3, .L6
  ; basic/basic.e16.ts:407  return 0
  li a0, 0
  j .return
.L6:
  ; basic/basic.e16.ts:408  if (varEnd + 10 > LIMIT) fail(E_MEMORY)
  lw t0, 0x0110(zero)
  li t1, 28672
  addi t0, t0, 10
  bgeu t1, t0, .L7
  ; basic/basic.e16.ts:408  fail(E_MEMORY)
  li a0, 8
  call fail
.L7:
  ; basic/basic.e16.ts:409  poke(at, name0)
  lw t0, 0x03fe(zero)
  sb t0, 0(s1)
  ; basic/basic.e16.ts:410  poke(at + 1, name1)
  lw t0, 0x0400(zero)
  sb t0, 1(s1)
  ; basic/basic.e16.ts:411  for (let k: u16 = 2; k < 10; k += 2) poke16(at + k, 0)
  li s2, 2 ; k
  j .L10
.L8:
  ; basic/basic.e16.ts:411  poke16(at + k, 0)
  add t0, s1, s2
  sw zero, 0(t0)
  addi s2, s2, 2
.L10:
  li t0, 10
  bltu s2, t0, .L8
  ; basic/basic.e16.ts:412  varEnd += 10
  lw t0, 0x0110(zero)
  addi t0, t0, 10
  sw t0, 0x0110(zero)
  ; basic/basic.e16.ts:413  return at + 2
  addi a0, s1, 2
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:416 clearVariables() at -O1
clearVariables:
  ; basic/basic.e16.ts:417  varEnd = progEnd + 2
  lw t0, 0x010e(zero)
  addi t0, t0, 2
  sw t0, 0x0110(zero)
  ; basic/basic.e16.ts:418  fsp = 0
  sw zero, 0x0114(zero)
  ; basic/basic.e16.ts:419  gsp = 0
  sw zero, 0x0116(zero)
.return:
  ret

; basic/basic.e16.ts:425 expr() at -O1
expr:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:426  andExpr()
  call andExpr
  ; basic/basic.e16.ts:427  while (next() === T_OR) {
  j .L3
.L1:
  ; basic/basic.e16.ts:428  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:429  andExpr()
  call andExpr
  ; basic/basic.e16.ts:430  logical(false)
  li a0, 0
  call logical
.L3:
  call next
  li t0, 200
  beq a0, t0, .L1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:434 andExpr() at -O1
andExpr:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:435  notExpr()
  call notExpr
  ; basic/basic.e16.ts:436  while (next() === T_AND) {
  j .L3
.L1:
  ; basic/basic.e16.ts:437  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:438  notExpr()
  call notExpr
  ; basic/basic.e16.ts:439  logical(true)
  li a0, 1
  call logical
.L3:
  call next
  li t0, 199
  beq a0, t0, .L1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:444 logical(both) at -O1
;   both in s3
;   b in s1
;   a in s2
logical:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; both
  ; basic/basic.e16.ts:445  const b = !isZero(top())
  call top
  call isZero
  seqz s1, a0
  ; basic/basic.e16.ts:446  nsp -= 8
  lw t0, 0x0112(zero)
  addi t0, t0, -8
  sw t0, 0x0112(zero)
  ; basic/basic.e16.ts:447  const a = !isZero(top())
  call top
  call isZero
  seqz s2, a0
  ; basic/basic.e16.ts:448  setInt(top(), (both ? a && b : a || b) ? 1 : 0)
  call top
  mv t0, a0
  mv t1, s3
  beqz t1, .L3
  mv t1, s2
  mv t2, s2
  beqz t2, .L4
  mv t1, s1
  j .L4
.L3:
  mv t1, s2
  mv t2, s2
  bnez t2, .L6
  mv t1, s1
.L6:
.L4:
  beqz t1, .L1
  li t1, 1
  j .L2
.L1:
  li t1, 0
.L2:
  mv a0, t0
  mv a1, t1
  call setInt
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:451 notExpr() at -O1
notExpr:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:452  if (next() === T_NOT) {
  call next
  li t0, 198
  bne a0, t0, .L1
  ; basic/basic.e16.ts:453  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:454  notExpr()
  call notExpr
  ; basic/basic.e16.ts:455  setInt(top(), isZero(top()) ? 1 : 0)
  call top
  addi sp, sp, -2
  sw a0, 0(sp)
  call top
  call isZero
  lw t0, 0(sp)
  addi sp, sp, 2
  mv t1, a0
  beqz t1, .L2
  li t1, 1
  j .L3
.L2:
  li t1, 0
.L3:
  mv a0, t0
  mv a1, t1
  call setInt
  ; basic/basic.e16.ts:456  return
  j .return
.L1:
  ; basic/basic.e16.ts:458  compare()
  call compare
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:462 compare() at -O1
;   c in s1
;   want in s2
;   d in s3
;   b in 2(fp)
;   r in 0(fp)
;   got in 4(fp)
compare:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  ; basic/basic.e16.ts:463  addExpr()
  call addExpr
  ; basic/basic.e16.ts:464  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:465  if (c !== CH_LT && c !== CH_EQ && c !== CH_GT) return
  li t0, 60
  beq s1, t0, .L1
  li t0, 61
  beq s1, t0, .L1
  li t0, 62
  beq s1, t0, .L1
  ; basic/basic.e16.ts:465  return
  j .return
.L1:
  ; basic/basic.e16.ts:466  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:467  let want: u16 = c === CH_LT ? 1 : c === CH_EQ ? 2 : 4
  li t0, 60
  bne s1, t0, .L2
  li t0, 1
  j .L3
.L2:
  li t0, 61
  bne s1, t0, .L4
  li t0, 2
  j .L5
.L4:
  li t0, 4
.L5:
.L3:
  mv s2, t0 ; want
  ; basic/basic.e16.ts:468  const d = peek(txt)
  lw t0, 0x010a(zero)
  lbu s3, 0(t0)
  ; basic/basic.e16.ts:469  if (c !== CH_EQ && (d === CH_EQ || (c === CH_LT && d === CH_GT))) {
  li t0, 61
  beq s1, t0, .L6
  li t0, 61
  beq s3, t0, .L7
  li t0, 60
  bne s1, t0, .L6
  li t0, 62
  bne s3, t0, .L6
.L7:
  ; basic/basic.e16.ts:470  want |= d === CH_EQ ? 2 : 4
  mv t0, s2
  mv t1, s3
  li t2, 61
  bne t1, t2, .L8
  li t1, 2
  j .L9
.L8:
  li t1, 4
.L9:
  or s2, t0, t1
  ; basic/basic.e16.ts:471  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
.L6:
  ; basic/basic.e16.ts:473  addExpr()
  call addExpr
  ; basic/basic.e16.ts:474  const b = top()
  call top
  sw a0, 2(fp) ; b
  ; basic/basic.e16.ts:475  nsp -= 8
  lw t0, 0x0112(zero)
  addi t0, t0, -8
  sw t0, 0x0112(zero)
  ; basic/basic.e16.ts:476  math(M_CMP, top(), b)
  call top
  mv t0, a0
  li a0, 6
  mv a1, t0
  lw a2, 2(fp)
  call math
  ; basic/basic.e16.ts:477  const r = peek16(MATH_RESULT)
  li t0, 65370
  lw t0, 0(t0)
  sw t0, 0(fp) ; r
  ; basic/basic.e16.ts:478  const got: u16 = r === 0xffff ? 1 : r === 0 ? 2 : 4
  li t0, 65535
  lw t1, 0(fp) ; r
  bne t1, t0, .L10
  li t0, 1
  j .L11
.L10:
  lw t0, 0(fp) ; r
  bne t0, zero, .L12
  li t0, 2
  j .L13
.L12:
  li t0, 4
.L13:
.L11:
  sw t0, 4(fp) ; got
  ; basic/basic.e16.ts:479  setInt(top(), (want & got) !== 0 ? 1 : 0)
  call top
  lw t0, 4(fp) ; got
  and t0, s2, t0
  mv t3, t0
  mv t0, a0
  mv t1, t3
  li t2, 0
  beq t1, t2, .L14
  li t1, 1
  j .L15
.L14:
  li t1, 0
.L15:
  mv a0, t0
  mv a1, t1
  call setInt
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; basic/basic.e16.ts:482 addExpr() at -O1
;   c in s1
addExpr:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:483  mulExpr()
  call mulExpr
  ; basic/basic.e16.ts:484  for (;;) {
.L1:
  ; basic/basic.e16.ts:485  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:486  if (c !== CH_PLUS && c !== CH_MINUS) return
  li t0, 43
  beq s1, t0, .L5
  li t0, 45
  beq s1, t0, .L5
  ; basic/basic.e16.ts:486  return
  j .return
.L5:
  ; basic/basic.e16.ts:487  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:488  mulExpr()
  call mulExpr
  ; basic/basic.e16.ts:489  binary(c === CH_PLUS ? M_ADD : M_SUB)
  li t0, 43
  bne s1, t0, .L6
  li t0, 1
  j .L7
.L6:
  li t0, 2
.L7:
  mv a0, t0
  call binary
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:493 mulExpr() at -O1
;   c in s1
mulExpr:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:494  unary()
  call unary
  ; basic/basic.e16.ts:495  for (;;) {
.L1:
  ; basic/basic.e16.ts:496  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:497  if (c !== CH_STAR && c !== CH_SLASH) return
  li t0, 42
  beq s1, t0, .L5
  li t0, 47
  beq s1, t0, .L5
  ; basic/basic.e16.ts:497  return
  j .return
.L5:
  ; basic/basic.e16.ts:498  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:499  unary()
  call unary
  ; basic/basic.e16.ts:500  binary(c === CH_STAR ? M_MUL : M_DIV)
  li t0, 42
  bne s1, t0, .L6
  li t0, 3
  j .L7
.L6:
  li t0, 4
.L7:
  mv a0, t0
  call binary
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:508 unary() at -O1
;   c in s1
unary:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:509  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:510  if (c === CH_MINUS) {
  li t0, 45
  bne s1, t0, .L1
  ; basic/basic.e16.ts:511  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:512  unary()
  call unary
  ; basic/basic.e16.ts:513  math(M_NEG, top(), 0)
  call top
  mv t0, a0
  li a0, 16
  mv a1, t0
  li a2, 0
  call math
  ; basic/basic.e16.ts:514  return
  j .return
.L1:
  ; basic/basic.e16.ts:516  if (c === CH_PLUS) txt++
  li t0, 43
  bne s1, t0, .L2
  ; basic/basic.e16.ts:516  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
.L2:
  ; basic/basic.e16.ts:517  power()
  call power
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:520 power() at -O1
power:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:521  primary()
  call primary
  ; basic/basic.e16.ts:522  if (next() !== CH_CARET) return
  call next
  li t0, 94
  beq a0, t0, .L1
  ; basic/basic.e16.ts:522  return
  j .return
.L1:
  ; basic/basic.e16.ts:523  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:524  unary()
  call unary
  ; basic/basic.e16.ts:525  binary(M_POW)
  li a0, 5
  call binary
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:528 primary() at -O1
;   c in s1
;   at in s2
;   to in s3
primary:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/basic.e16.ts:529  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:530  if (isDigit(c) || c === CH_DOT) {
  mv a0, s1
  call isDigit
  bnez a0, .L2
  li t0, 46
  bne s1, t0, .L1
.L2:
  ; basic/basic.e16.ts:531  literal()
  call literal
  ; basic/basic.e16.ts:532  return
  j .return
.L1:
  ; basic/basic.e16.ts:534  if (c === CH_LPAREN) {
  li t0, 40
  bne s1, t0, .L3
  ; basic/basic.e16.ts:535  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:536  expr()
  call expr
  ; basic/basic.e16.ts:537  expect(CH_RPAREN)
  li a0, 41
  call expect
  ; basic/basic.e16.ts:538  return
  j .return
.L3:
  ; basic/basic.e16.ts:540  if (isLetter(c)) {
  mv a0, s1
  call isLetter
  beqz a0, .L4
  ; basic/basic.e16.ts:541  readName()
  call readName
  ; basic/basic.e16.ts:542  const at = findVar(false)
  li a0, 0
  call findVar
  mv s2, a0 ; at
  ; basic/basic.e16.ts:543  const to = push()
  call push
  mv s3, a0 ; to
  ; basic/basic.e16.ts:544  if (at === 0) setInt(to, 0)
  bne s2, zero, .L5
  ; basic/basic.e16.ts:544  setInt(to, 0)
  mv a0, s3
  li a1, 0
  call setInt
  j .L6
.L5:
  ; basic/basic.e16.ts:545  copy8(at, to)
  mv a0, s2
  mv a1, s3
  call copy8
.L6:
  ; basic/basic.e16.ts:546  return
  j .return
.L4:
  ; basic/basic.e16.ts:548  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:549  functionCall(c)
  mv a0, s1
  call functionCall
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:557 functionCall(token) at -O1
;   token in s1
functionCall:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; token
  ; basic/basic.e16.ts:558  if (token >= T_SIN && token <= T_EXP) {
  li t0, 180
  bltu s1, t0, .L1
  li t0, 192
  bltu t0, s1, .L1
  ; basic/basic.e16.ts:559  unary()
  call unary
  ; basic/basic.e16.ts:560  math(peek(FUNCTION_OPS + (token - T_SIN)), top(), 0)
  addi t0, s1, -180
  la t1, str_1
  add t1, t1, t0
  lbu t1, 0(t1)
  addi sp, sp, -2
  sw t1, 0(sp)
  call top
  lw t0, 0(sp)
  addi sp, sp, 2
  mv t1, a0
  mv a0, t0
  mv a1, t1
  li a2, 0
  call math
  ; basic/basic.e16.ts:561  return
  j .return
.L1:
  ; basic/basic.e16.ts:563  if (token === T_PI) {
  li t0, 194
  bne s1, t0, .L2
  ; basic/basic.e16.ts:564  math(M_PI, push(), 0)
  call push
  mv t0, a0
  li a0, 32
  mv a1, t0
  li a2, 0
  call math
  ; basic/basic.e16.ts:565  return
  j .return
.L2:
  ; basic/basic.e16.ts:567  if (token === T_ANS) {
  li t0, 195
  bne s1, t0, .L3
  ; basic/basic.e16.ts:568  copy8(addr(ans), push())
  call push
  mv t0, a0
  la a0, ans
  mv a1, t0
  call copy8
  ; basic/basic.e16.ts:569  return
  j .return
.L3:
  ; basic/basic.e16.ts:571  if (token === T_RND) {
  li t0, 193
  bne s1, t0, .L4
  ; basic/basic.e16.ts:572  random()
  call random
  ; basic/basic.e16.ts:573  return
  j .return
.L4:
  ; basic/basic.e16.ts:575  if (token === T_PEEK) {
  li t0, 196
  bne s1, t0, .L5
  ; basic/basic.e16.ts:576  unary()
  call unary
  ; basic/basic.e16.ts:577  setInt(top(), peek(u16(toInt(top()))))
  call top
  addi sp, sp, -2
  sw a0, 0(sp)
  call top
  call toInt
  lbu t0, 0(a0)
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  mv a1, t0
  call setInt
  ; basic/basic.e16.ts:578  return
  j .return
.L5:
  ; basic/basic.e16.ts:580  fail(E_SYNTAX)
  li a0, 1
  call fail
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:584 random() at -O1
;   n in s2
;   r in s1
;   one in s3
;   k in s0
random:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  ; basic/basic.e16.ts:585  unary()
  call unary
  ; basic/basic.e16.ts:586  const n = top()
  call top
  mv s2, a0 ; n
  ; basic/basic.e16.ts:587  const r = push()
  call push
  mv s1, a0 ; r
  ; basic/basic.e16.ts:588  math(M_RND, r, 0)
  li a0, 31
  mv a1, s1
  li a2, 0
  call math
  ; basic/basic.e16.ts:589  const one = push()
  call push
  mv s3, a0 ; one
  ; basic/basic.e16.ts:590  setInt(one, 1)
  mv a0, s3
  li a1, 1
  call setInt
  ; basic/basic.e16.ts:591  math(M_CMP, n, one)
  li a0, 6
  mv a1, s2
  mv a2, s3
  call math
  ; basic/basic.e16.ts:592  nsp -= 8
  lw t0, 0x0112(zero)
  addi t0, t0, -8
  sw t0, 0x0112(zero)
  ; basic/basic.e16.ts:593  if (peek16(MATH_RESULT) === 0xffff) {
  li t0, 65370
  lw t0, 0(t0)
  li t1, 65535
  bne t0, t1, .L1
  ; basic/basic.e16.ts:594  copy8(r, n)
  mv a0, s1
  mv a1, s2
  call copy8
  ; basic/basic.e16.ts:595  nsp -= 8
  lw t0, 0x0112(zero)
  addi t0, t0, -8
  sw t0, 0x0112(zero)
  ; basic/basic.e16.ts:596  return
  j .return
.L1:
  ; basic/basic.e16.ts:598  math(M_MUL, r, n)
  li a0, 3
  mv a1, s1
  mv a2, s2
  call math
  ; basic/basic.e16.ts:599  math(M_INT, r, 0)
  li a0, 18
  mv a1, s1
  li a2, 0
  call math
  ; basic/basic.e16.ts:600  copy8(r, n)
  mv a0, s1
  mv a1, s2
  call copy8
  ; basic/basic.e16.ts:601  nsp -= 8
  lw t0, 0x0112(zero)
  addi t0, t0, -8
  sw t0, 0x0112(zero)
  ; basic/basic.e16.ts:602  const k = push()
  call push
  mv s0, a0 ; k
  ; basic/basic.e16.ts:603  setInt(k, 1)
  mv a0, s0
  li a1, 1
  call setInt
  ; basic/basic.e16.ts:604  binary(M_ADD)
  li a0, 1
  call binary
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:610 findLine(n, exact) at -O1
;   n in a0
;   exact in a1
;   at in a2
;   here in a3
findLine:
  ; basic/basic.e16.ts:611  let at = PROG
  li a2, 2048 ; at
  ; basic/basic.e16.ts:612  while (peek16(at) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:613  const here = peek16(at)
  lw a3, 0(a2)
  ; basic/basic.e16.ts:614  if (here === n) return at
  bne a3, a0, .L5
  ; basic/basic.e16.ts:614  return at
  mv a0, a2
  j .return
.L5:
  ; basic/basic.e16.ts:615  if (here > n) return exact ? 0 : at
  bgeu a0, a3, .L6
  ; basic/basic.e16.ts:615  return exact ? 0 : at
  beqz a1, .L7
  li t0, 0
  j .L8
.L7:
  mv t0, a2
.L8:
  mv a0, t0
  j .return
.L6:
  ; basic/basic.e16.ts:616  at += peek16(at + 2)
  lw t0, 2(a2)
  add a2, a2, t0
.L3:
  lw t0, 0(a2)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:618  return 0
  li a0, 0
.return:
  ret

; basic/basic.e16.ts:622 move(from, to, count) at -O1
;   from in a0
;   to in a1
;   count in a2
;   k in a3
move:
  ; basic/basic.e16.ts:623  if (to < from) {
  bgeu a1, a0, .L1
  ; basic/basic.e16.ts:624  for (let k: u16 = 0; k < count; k++) poke(to + k, peek(from + k))
  li a3, 0 ; k
  j .L4
.L2:
  ; basic/basic.e16.ts:624  poke(to + k, peek(from + k))
  add t0, a1, a3
  add t1, a0, a3
  lbu t1, 0(t1)
  sb t1, 0(t0)
  addi a3, a3, 1
.L4:
  bltu a3, a2, .L2
  ; basic/basic.e16.ts:625  return
  j .return
.L1:
  ; basic/basic.e16.ts:627  let k = count
  mv a3, a2 ; k
  ; basic/basic.e16.ts:628  while (k > 0) {
  j .L8
.L6:
  ; basic/basic.e16.ts:629  k--
  addi a3, a3, -1
  ; basic/basic.e16.ts:630  poke(to + k, peek(from + k))
  add t0, a1, a3
  add t1, a0, a3
  lbu t1, 0(t1)
  sb t1, 0(t0)
.L8:
  bltu zero, a3, .L6
.return:
  ret

; basic/basic.e16.ts:635 storeLine(n, text, length) at -O1
;   n in 0(fp)
;   text in 4(fp)
;   length in 2(fp)
;   old in s3
;   size in s1
;   at in s2
storeLine:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  sw a0, 0(fp) ; n
  sw a1, 4(fp) ; text
  sw a2, 2(fp) ; length
  ; basic/basic.e16.ts:636  const old = findLine(n, true)
  lw a0, 0(fp)
  li a1, 1
  call findLine
  mv s3, a0 ; old
  ; basic/basic.e16.ts:637  if (old !== 0) {
  beq s3, zero, .L1
  ; basic/basic.e16.ts:638  const size = peek16(old + 2)
  lw s1, 2(s3)
  ; basic/basic.e16.ts:639  move(old + size, old, progEnd + 2 - (old + size))
  add t0, s3, s1
  lw t1, 0x010e(zero)
  add t2, s3, s1
  addi t1, t1, 2
  sub t1, t1, t2
  mv a0, t0
  mv a1, s3
  mv a2, t1
  call move
  ; basic/basic.e16.ts:640  progEnd -= size
  lw t0, 0x010e(zero)
  sub t0, t0, s1
  sw t0, 0x010e(zero)
.L1:
  ; basic/basic.e16.ts:642  if (length > 1) {
  li t0, 1
  lw t1, 2(fp) ; length
  bgeu t0, t1, .L2
  ; basic/basic.e16.ts:643  const size = (4 + length + 1) & 0xfffe
  lw t0, 2(fp) ; length
  addi t0, t0, 5
  andi s1, t0, -2
  ; basic/basic.e16.ts:644  if (progEnd + 2 + size > LIMIT) fail(E_MEMORY)
  lw t0, 0x010e(zero)
  addi t0, t0, 2
  add t0, t0, s1
  li t1, 28672
  bgeu t1, t0, .L3
  ; basic/basic.e16.ts:644  fail(E_MEMORY)
  li a0, 8
  call fail
.L3:
  ; basic/basic.e16.ts:645  let at = findLine(n, false)
  lw a0, 0(fp)
  li a1, 0
  call findLine
  mv s2, a0 ; at
  ; basic/basic.e16.ts:646  if (at === 0) at = progEnd
  bne s2, zero, .L4
  ; basic/basic.e16.ts:646  at = progEnd
  lw s2, 0x010e(zero)
.L4:
  ; basic/basic.e16.ts:647  move(at, at + size, progEnd + 2 - at)
  add t0, s2, s1
  lw t1, 0x010e(zero)
  addi t1, t1, 2
  sub t1, t1, s2
  mv a0, s2
  mv a1, t0
  mv a2, t1
  call move
  ; basic/basic.e16.ts:648  poke16(at, n)
  lw t0, 0(fp) ; n
  sw t0, 0(s2)
  ; basic/basic.e16.ts:649  poke16(at + 2, size)
  sw s1, 2(s2)
  ; basic/basic.e16.ts:650  move(text, at + 4, length)
  lw a0, 4(fp)
  addi a1, s2, 4
  lw a2, 2(fp)
  call move
  ; basic/basic.e16.ts:651  progEnd += size
  lw t0, 0x010e(zero)
  add t0, t0, s1
  sw t0, 0x010e(zero)
.L2:
  ; basic/basic.e16.ts:653  poke16(progEnd, 0)
  lw t0, 0x010e(zero)
  sw zero, 0(t0)
  ; basic/basic.e16.ts:654  clearVariables()
  call clearVariables
  ; basic/basic.e16.ts:655  contLine = 0
  sw zero, 0x011a(zero)
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; basic/basic.e16.ts:659 keepProgramTo(end) at -O1
;   end in s1
keepProgramTo:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; end
  ; basic/basic.e16.ts:660  progEnd = end
  sw s1, 0x010e(zero)
  ; basic/basic.e16.ts:661  poke16(end, 0)
  sw zero, 0(s1)
  ; basic/basic.e16.ts:662  clearVariables()
  call clearVariables
  ; basic/basic.e16.ts:663  contLine = 0
  sw zero, 0x011a(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:671 keptProgramEnd() at -O1
;   at in a0
;   last in a2
;   n in a3
;   size in a1
keptProgramEnd:
  ; basic/basic.e16.ts:672  let at: u16 = PROG
  li a0, 2048 ; at
  ; basic/basic.e16.ts:673  let last: u16 = 0
  li a2, 0 ; last
  ; basic/basic.e16.ts:674  while (peek16(at) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:675  const n = peek16(at)
  lw a3, 0(a0)
  ; basic/basic.e16.ts:676  const size = peek16(at + 2)
  lw a1, 2(a0)
  ; basic/basic.e16.ts:677  if (n <= last || size < 6 || (size & 1) !== 0 || size > LIMIT - 2 - at) return PROG
  bgeu a2, a3, .L6
  li t0, 6
  bltu a1, t0, .L6
  andi t0, a1, 1
  bne t0, zero, .L6
  li t0, 28670
  sub t0, t0, a0
  bgeu t0, a1, .L5
.L6:
  ; basic/basic.e16.ts:677  return PROG
  li a0, 2048
  j .return
.L5:
  ; basic/basic.e16.ts:678  if (peek(at + size - 1) !== 0 && peek(at + size - 2) !== 0) return PROG
  add t0, a0, a1
  lbu t0, -1(t0)
  beq t0, zero, .L7
  add t0, a0, a1
  lbu t0, -2(t0)
  beq t0, zero, .L7
  ; basic/basic.e16.ts:678  return PROG
  li a0, 2048
  j .return
.L7:
  ; basic/basic.e16.ts:679  last = n
  mv a2, a3 ; last
  ; basic/basic.e16.ts:680  at += size
  add a0, a0, a1
.L3:
  lw t0, 0(a0)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:682  return at
.return:
  ret

; basic/basic.e16.ts:687 jump(line, text) at -O1
;   line in a0
;   text in a1
jump:
  ; basic/basic.e16.ts:688  jumping = true
  li t0, 1
  sw t0, 0x011e(zero)
  ; basic/basic.e16.ts:689  jumpLine = line
  sw a0, 0x0120(zero)
  ; basic/basic.e16.ts:690  jumpTxt = text
  sw a1, 0x0122(zero)
.return:
  ret

; basic/basic.e16.ts:694 statements() at -O1
;   c in s1
statements:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:695  for (;;) {
.L1:
  ; basic/basic.e16.ts:696  checkBreak()
  call checkBreak
  ; basic/basic.e16.ts:697  statement()
  call statement
  ; basic/basic.e16.ts:698  if (jumping || (!running && curLine !== 0)) return
  lw t0, 0x011e(zero)
  bnez t0, .L6
  lw t0, 0x0118(zero)
  bnez t0, .L5
  lw t0, 0x010c(zero)
  beq t0, zero, .L5
.L6:
  ; basic/basic.e16.ts:698  return
  j .return
.L5:
  ; basic/basic.e16.ts:699  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:700  if (c === CH_COLON) {
  li t0, 58
  bne s1, t0, .L7
  ; basic/basic.e16.ts:701  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:702  continue
  j .L1
.L7:
  ; basic/basic.e16.ts:705  if (c === 0 || c === T_ELSE) return
  beq s1, zero, .L9
  li t0, 137
  bne s1, t0, .L8
.L9:
  ; basic/basic.e16.ts:705  return
  j .return
.L8:
  ; basic/basic.e16.ts:706  fail(E_SYNTAX)
  li a0, 1
  call fail
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:710 statement() at -O1
;   c in s1
statement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:711  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:712  if (c === 0 || c === CH_COLON) return
  beq s1, zero, .L2
  li t0, 58
  bne s1, t0, .L1
.L2:
  ; basic/basic.e16.ts:712  return
  j .return
.L1:
  ; basic/basic.e16.ts:713  if (isLetter(c)) {
  mv a0, s1
  call isLetter
  beqz a0, .L3
  ; basic/basic.e16.ts:714  assignment()
  call assignment
  ; basic/basic.e16.ts:715  return
  j .return
.L3:
  ; basic/basic.e16.ts:717  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:718  switch (c) {
  li t0, 132
  beq s1, t0, .L5
  li t0, 134
  beq s1, t0, .L6
  li t0, 135
  beq s1, t0, .L7
  li t0, 138
  beq s1, t0, .L8
  li t0, 141
  beq s1, t0, .L9
  li t0, 142
  beq s1, t0, .L10
  li t0, 143
  beq s1, t0, .L11
  li t0, 144
  beq s1, t0, .L12
  li t0, 147
  beq s1, t0, .L13
  j .L14
.L5:
  ; basic/basic.e16.ts:720  printStatement()
  call printStatement
  ; basic/basic.e16.ts:721  return
  j .return
.L6:
  ; basic/basic.e16.ts:723  assignment()
  call assignment
  ; basic/basic.e16.ts:724  return
  j .return
.L7:
  ; basic/basic.e16.ts:726  ifStatement()
  call ifStatement
  ; basic/basic.e16.ts:727  return
  j .return
.L8:
  ; basic/basic.e16.ts:729  forStatement()
  call forStatement
  ; basic/basic.e16.ts:730  return
  j .return
.L9:
  ; basic/basic.e16.ts:732  nextStatement()
  call nextStatement
  ; basic/basic.e16.ts:733  return
  j .return
.L10:
  ; basic/basic.e16.ts:735  gotoStatement()
  call gotoStatement
  ; basic/basic.e16.ts:736  return
  j .return
.L11:
  ; basic/basic.e16.ts:738  gosubStatement()
  call gosubStatement
  ; basic/basic.e16.ts:739  return
  j .return
.L12:
  ; basic/basic.e16.ts:741  returnStatement()
  call returnStatement
  ; basic/basic.e16.ts:742  return
  j .return
.L13:
  ; basic/basic.e16.ts:744  toLineEnd()
  call toLineEnd
  ; basic/basic.e16.ts:745  return
  j .return
.L14:
  ; basic/basic.e16.ts:747  commandStatement(c)
  mv a0, s1
  call commandStatement
  ; basic/basic.e16.ts:748  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:752 commandStatement(c) at -O1
;   c in s1
commandStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/basic.e16.ts:753  switch (c) {
  li t0, 133
  beq s1, t0, .L2
  li t0, 145
  beq s1, t0, .L3
  li t0, 146
  beq s1, t0, .L4
  li t0, 128
  beq s1, t0, .L5
  li t0, 129
  beq s1, t0, .L6
  li t0, 130
  beq s1, t0, .L7
  li t0, 131
  beq s1, t0, .L8
  li t0, 149
  beq s1, t0, .L9
  li t0, 153
  beq s1, t0, .L10
  li t0, 154
  beq s1, t0, .L11
  li t0, 148
  beq s1, t0, .L12
  j .L13
.L2:
  ; basic/basic.e16.ts:755  inputStatement()
  call inputStatement
  ; basic/basic.e16.ts:756  return
  j .return
.L3:
  ; basic/basic.e16.ts:758  contLine = 0
  sw zero, 0x011a(zero)
  ; basic/basic.e16.ts:759  endProgram()
  call endProgram
  ; basic/basic.e16.ts:760  return
  j .return
.L4:
  ; basic/basic.e16.ts:762  contLine = curLine
  lw t0, 0x010c(zero)
  sw t0, 0x011a(zero)
  ; basic/basic.e16.ts:763  contTxt = txt
  lw t0, 0x010a(zero)
  sw t0, 0x011c(zero)
  ; basic/basic.e16.ts:764  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:765  puts(str('STOP'))
  la a0, str_15
  call puts
  ; basic/basic.e16.ts:766  inLine()
  call inLine
  ; basic/basic.e16.ts:767  newline()
  call newline
  ; basic/basic.e16.ts:768  endProgram()
  call endProgram
  ; basic/basic.e16.ts:769  return
  j .return
.L5:
  ; basic/basic.e16.ts:771  runStatement()
  call runStatement
  ; basic/basic.e16.ts:772  return
  j .return
.L6:
  ; basic/basic.e16.ts:774  listStatement()
  call listStatement
  ; basic/basic.e16.ts:775  return
  j .return
.L7:
  ; basic/basic.e16.ts:777  keepProgramTo(PROG)
  li a0, 2048
  call keepProgramTo
  ; basic/basic.e16.ts:778  recallNo = 0
  sw zero, 0x0128(zero)
  ; basic/basic.e16.ts:779  endProgram()
  call endProgram
  ; basic/basic.e16.ts:780  return
  j .return
.L8:
  ; basic/basic.e16.ts:782  contStatement()
  call contStatement
  ; basic/basic.e16.ts:783  return
  j .return
.L9:
  ; basic/basic.e16.ts:785  cls()
  call cls
  ; basic/basic.e16.ts:786  return
  j .return
.L10:
  ; basic/basic.e16.ts:788  pokeStatement()
  call pokeStatement
  ; basic/basic.e16.ts:789  return
  j .return
.L11:
  ; basic/basic.e16.ts:791  expr()
  call expr
  ; basic/basic.e16.ts:792  call_at(u16(toInt(top())))
  call top
  call toInt
  call call_at
  ; basic/basic.e16.ts:793  nsp -= 8
  lw t0, 0x0112(zero)
  addi t0, t0, -8
  sw t0, 0x0112(zero)
  ; basic/basic.e16.ts:794  return
  j .return
.L12:
  ; basic/basic.e16.ts:796  poke16(INBASIC, 0)
  sw zero, 28(zero)
  ; basic/basic.e16.ts:797  monitor()
  call monitor
  ; basic/basic.e16.ts:798  return
  j .return
.L13:
  ; basic/basic.e16.ts:800  angleStatement(c)
  mv a0, s1
  call angleStatement
  ; basic/basic.e16.ts:801  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:805 angleStatement(c) at -O1
;   c in s1
;   unit in s2
angleStatement:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; c
  ; basic/basic.e16.ts:806  if (c === T_DEG || c === T_RAD || c === T_GRAD) {
  li t0, 150
  beq s1, t0, .L2
  li t0, 151
  beq s1, t0, .L2
  li t0, 152
  bne s1, t0, .L1
.L2:
  ; basic/basic.e16.ts:807  const unit: u16 = c - T_DEG
  addi s2, s1, -150
  ; basic/basic.e16.ts:808  poke16(MATH_ANGLE, unit)
  li t0, 65372
  sw s2, 0(t0)
  ; basic/basic.e16.ts:809  angleMarks = unit === 0 ? ANN_DEG : unit === 1 ? ANN_RAD : ANN_GRAD
  bne s2, zero, .L3
  li t0, 128
  j .L4
.L3:
  li t0, 1
  bne s2, t0, .L5
  li t0, 256
  j .L6
.L5:
  li t0, 512
.L6:
.L4:
  sw t0, 0x0126(zero)
  ; basic/basic.e16.ts:810  marks()
  call marks
  ; basic/basic.e16.ts:811  return
  j .return
.L1:
  ; basic/basic.e16.ts:813  fail(E_SYNTAX)
  li a0, 1
  call fail
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:816 toLineEnd() at -O1
toLineEnd:
  ; basic/basic.e16.ts:817  while (peek(txt) !== 0) txt++
  j .L3
.L1:
  ; basic/basic.e16.ts:817  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
.L3:
  lw t0, 0x010a(zero)
  lbu t0, 0(t0)
  bne t0, zero, .L1
.return:
  ret

; basic/basic.e16.ts:820 endProgram() at -O1
endProgram:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:821  running = false
  sw zero, 0x0118(zero)
  ; basic/basic.e16.ts:822  toLineEnd()
  call toLineEnd
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:825 assignment() at -O1
;   at in s1
assignment:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:826  readName()
  call readName
  ; basic/basic.e16.ts:827  const at = findVar(true)
  li a0, 1
  call findVar
  mv s1, a0 ; at
  ; basic/basic.e16.ts:828  expect(CH_EQ)
  li a0, 61
  call expect
  ; basic/basic.e16.ts:829  expr()
  call expr
  ; basic/basic.e16.ts:830  copy8(top(), at)
  call top
  mv a1, s1
  call copy8
  ; basic/basic.e16.ts:831  nsp -= 8
  lw t0, 0x0112(zero)
  addi t0, t0, -8
  sw t0, 0x0112(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:838 printStatement() at -O1
;   joined in s1
printStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:839  let joined = false
  li s1, 0 ; joined
  ; basic/basic.e16.ts:840  while (!statementEnds()) {
  j .L3
.L1:
  ; basic/basic.e16.ts:841  if (next() === CH_QUOTE) {
  call next
  li t0, 34
  bne a0, t0, .L5
  ; basic/basic.e16.ts:842  txt = quoted(txt + 1, true)
  lw t0, 0x010a(zero)
  addi a0, t0, 1
  li a1, 1
  call quoted
  sw a0, 0x010a(zero)
  j .L6
.L5:
  ; basic/basic.e16.ts:844  expr()
  call expr
  ; basic/basic.e16.ts:845  formatTop()
  call formatTop
  ; basic/basic.e16.ts:846  puts(addr(textOut))
  la a0, textOut
  call puts
  ; basic/basic.e16.ts:847  nsp -= 8
  lw t0, 0x0112(zero)
  addi t0, t0, -8
  sw t0, 0x0112(zero)
  ; basic/basic.e16.ts:848  if (next() === CH_SEMI) putc(CH_SPACE)
  call next
  li t0, 59
  bne a0, t0, .L7
  ; basic/basic.e16.ts:848  putc(CH_SPACE)
  li a0, 32
  call putc
.L7:
.L6:
  ; basic/basic.e16.ts:850  joined = separator()
  call separator
  mv s1, a0 ; joined
  ; basic/basic.e16.ts:851  if (!joined && !statementEnds()) fail(E_SYNTAX)
  bnez s1, .L8
  call statementEnds
  bnez a0, .L8
  ; basic/basic.e16.ts:851  fail(E_SYNTAX)
  li a0, 1
  call fail
.L8:
.L3:
  call statementEnds
  beqz a0, .L1
  ; basic/basic.e16.ts:853  if (!joined) newline()
  bnez s1, .L9
  ; basic/basic.e16.ts:853  newline()
  call newline
.L9:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:857 statementEnds() at -O1
;   c in s1
statementEnds:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:858  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:859  return c === 0 || c === CH_COLON || c === T_ELSE
  sub t0, s1, zero
  seqz t0, t0
  mv t1, t0
  bnez t1, .L2
  li t0, 58
  sub t0, s1, t0
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 137
  sub t0, s1, t0
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:863 quoted(p, show) at -O1
;   p in s2
;   show in s3
;   q in s1
quoted:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; p
  mv s3, a1 ; show
  ; basic/basic.e16.ts:864  let q = p
  mv s1, s2 ; q
  ; basic/basic.e16.ts:865  while (peek(q) !== CH_QUOTE && peek(q) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:866  if (show) putc(peek(q))
  beqz s3, .L5
  ; basic/basic.e16.ts:866  putc(peek(q))
  lbu a0, 0(s1)
  call putc
.L5:
  ; basic/basic.e16.ts:867  q++
  addi s1, s1, 1
.L3:
  lbu t0, 0(s1)
  li t1, 34
  beq t0, t1, .L6
  lbu t0, 0(s1)
  bne t0, zero, .L1
.L6:
  ; basic/basic.e16.ts:869  return peek(q) === CH_QUOTE ? q + 1 : q
  lbu t0, 0(s1)
  li t1, 34
  bne t0, t1, .L7
  addi t0, s1, 1
  j .L8
.L7:
  mv t0, s1
.L8:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:873 separator() at -O1
;   c in s1
separator:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:874  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:875  if (c === CH_SEMI) {
  li t0, 59
  bne s1, t0, .L1
  ; basic/basic.e16.ts:876  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:877  return true
  li a0, 1
  j .return
.L1:
  ; basic/basic.e16.ts:879  if (c !== CH_COMMA) return false
  li t0, 44
  beq s1, t0, .L2
  ; basic/basic.e16.ts:879  return false
  li a0, 0
  j .return
.L2:
  ; basic/basic.e16.ts:880  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:881  putc(CH_SPACE)
  li a0, 32
  call putc
  ; basic/basic.e16.ts:882  while (peek16(CURX) % 10 !== 0 && peek16(CURX) !== 0) putc(CH_SPACE)
  j .L5
.L3:
  ; basic/basic.e16.ts:882  putc(CH_SPACE)
  li a0, 32
  call putc
.L5:
  lw t0, 0(zero)
  li t1, 10
  remu t0, t0, t1
  beq t0, zero, .L7
  lw t0, 0(zero)
  bne t0, zero, .L3
.L7:
  ; basic/basic.e16.ts:883  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:887 inputStatement() at -O1
;   prompt in s1
;   at in s3
;   n in s2
inputStatement:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  ; basic/basic.e16.ts:888  let prompt: u16 = 0
  li s1, 0 ; prompt
  ; basic/basic.e16.ts:889  if (next() === CH_QUOTE) {
  call next
  li t0, 34
  bne a0, t0, .L1
  ; basic/basic.e16.ts:890  prompt = txt + 1
  lw t0, 0x010a(zero)
  addi s1, t0, 1
  ; basic/basic.e16.ts:891  txt = quoted(prompt, false)
  mv a0, s1
  li a1, 0
  call quoted
  sw a0, 0x010a(zero)
  ; basic/basic.e16.ts:892  if (next() === CH_SEMI || next() === CH_COMMA) txt++
  call next
  li t0, 59
  beq a0, t0, .L3
  call next
  li t0, 44
  bne a0, t0, .L2
.L3:
  ; basic/basic.e16.ts:892  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
.L2:
.L1:
  ; basic/basic.e16.ts:894  readName()
  call readName
  ; basic/basic.e16.ts:895  const at = findVar(true)
  li a0, 1
  call findVar
  mv s3, a0 ; at
  ; basic/basic.e16.ts:896  for (;;) {
.L4:
  ; basic/basic.e16.ts:897  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:898  if (prompt !== 0) quoted(prompt, true)
  beq s1, zero, .L8
  ; basic/basic.e16.ts:898  quoted(prompt, true)
  mv a0, s1
  li a1, 1
  call quoted
.L8:
  ; basic/basic.e16.ts:899  putc(CH_QUESTION)
  li a0, 63
  call putc
  ; basic/basic.e16.ts:900  const n: i16 = readline(addr(lineBuf), 40)
  la a0, lineBuf
  li a1, 40
  call readline
  mv s2, a0 ; n
  ; basic/basic.e16.ts:901  if (n === -2) {
  li t0, 65534
  bne s2, t0, .L9
  ; basic/basic.e16.ts:902  poke16(BRKFLAG, 1)
  li t0, 1
  sw t0, 30(zero)
  ; basic/basic.e16.ts:903  checkBreak()
  call checkBreak
.L9:
  ; basic/basic.e16.ts:905  newline()
  call newline
  ; basic/basic.e16.ts:906  if (n >= 0 && readInput(at)) return
  blt s2, zero, .L4
  mv a0, s3
  call readInput
  beqz a0, .L4
  ; basic/basic.e16.ts:906  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:911 readInput(at) at -O1
;   at in s2
;   p in s1
;   minus in s3
;   n in s0
readInput:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s2, a0 ; at
  ; basic/basic.e16.ts:912  let p = addr(lineBuf)
  la s1, lineBuf
  ; basic/basic.e16.ts:913  while (peek(p) === CH_SPACE) p++
  j .L3
.L1:
  ; basic/basic.e16.ts:913  p++
  addi s1, s1, 1
.L3:
  lbu t0, 0(s1)
  li t1, 32
  beq t0, t1, .L1
  ; basic/basic.e16.ts:914  const minus = peek(p) === CH_MINUS
  lbu t0, 0(s1)
  li t1, 45
  sub t0, t0, t1
  seqz s3, t0
  ; basic/basic.e16.ts:915  if (minus) p++
  beqz s3, .L5
  ; basic/basic.e16.ts:915  p++
  addi s1, s1, 1
.L5:
  ; basic/basic.e16.ts:916  poke16(MATH_A, at)
  li t0, 65362
  sw s2, 0(t0)
  ; basic/basic.e16.ts:917  poke16(MATH_B, p)
  li t0, 65364
  sw s1, 0(t0)
  ; basic/basic.e16.ts:918  poke16(MATH_ARG, 40)
  li t0, 40
  li t1, 65366
  sw t0, 0(t1)
  ; basic/basic.e16.ts:919  poke16(MATH_OP, M_PARSE)
  li t0, 56
  li t1, 65360
  sw t0, 0(t1)
  ; basic/basic.e16.ts:920  const n = peek16(MATH_ARG)
  li t0, 65366
  lw s0, 0(t0)
  ; basic/basic.e16.ts:921  if (peek16(MATH_STATUS) !== 0 || n === 0) return false
  li t0, 65368
  lw t0, 0(t0)
  bne t0, zero, .L7
  bne s0, zero, .L6
.L7:
  ; basic/basic.e16.ts:921  return false
  li a0, 0
  j .return
.L6:
  ; basic/basic.e16.ts:922  if (minus) math(M_NEG, at, 0)
  beqz s3, .L8
  ; basic/basic.e16.ts:922  math(M_NEG, at, 0)
  li a0, 16
  mv a1, s2
  li a2, 0
  call math
.L8:
  ; basic/basic.e16.ts:923  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:926 ifStatement() at -O1
;   holds in s1
ifStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:927  expr()
  call expr
  ; basic/basic.e16.ts:928  const holds = !isZero(top())
  call top
  call isZero
  seqz s1, a0
  ; basic/basic.e16.ts:929  nsp -= 8
  lw t0, 0x0112(zero)
  addi t0, t0, -8
  sw t0, 0x0112(zero)
  ; basic/basic.e16.ts:930  if (next() === T_THEN) txt++
  call next
  li t0, 136
  bne a0, t0, .L1
  ; basic/basic.e16.ts:930  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
.L1:
  ; basic/basic.e16.ts:931  if (!holds && !skipToElse()) return
  bnez s1, .L2
  call skipToElse
  bnez a0, .L2
  ; basic/basic.e16.ts:931  return
  j .return
.L2:
  ; basic/basic.e16.ts:934  if (isDigit(next())) gotoStatement()
  call next
  call isDigit
  beqz a0, .L3
  ; basic/basic.e16.ts:934  gotoStatement()
  call gotoStatement
  j .L4
.L3:
  ; basic/basic.e16.ts:935  statements()
  call statements
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:939 skipToElse() at -O1
;   quoted in a0
;   c in a1
skipToElse:
  ; basic/basic.e16.ts:940  let quoted = false
  li a0, 0 ; quoted
  ; basic/basic.e16.ts:941  while (peek(txt) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:942  const c = peek(txt)
  lw t0, 0x010a(zero)
  lbu a1, 0(t0)
  ; basic/basic.e16.ts:943  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:944  if (c === CH_QUOTE) quoted = !quoted
  li t0, 34
  bne a1, t0, .L5
  ; basic/basic.e16.ts:944  quoted = !quoted
  seqz a0, a0
.L5:
  ; basic/basic.e16.ts:945  if (c === T_ELSE && !quoted) return true
  li t0, 137
  bne a1, t0, .L6
  bnez a0, .L6
  ; basic/basic.e16.ts:945  return true
  li a0, 1
  j .return
.L6:
.L3:
  lw t0, 0x010a(zero)
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:947  return false
  li a0, 0
.return:
  ret

; basic/basic.e16.ts:950 gotoStatement() at -O1
;   line in s1
gotoStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:951  const line = findLine(readUnsigned(), true)
  call readUnsigned
  li a1, 1
  call findLine
  mv s1, a0 ; line
  ; basic/basic.e16.ts:952  if (line === 0) fail(E_LINE)
  bne s1, zero, .L1
  ; basic/basic.e16.ts:952  fail(E_LINE)
  li a0, 5
  call fail
.L1:
  ; basic/basic.e16.ts:953  jump(line, line + 4)
  mv a0, s1
  addi a1, s1, 4
  call jump
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:956 gosubStatement() at -O1
;   line in s1
gosubStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:957  const line = findLine(readUnsigned(), true)
  call readUnsigned
  li a1, 1
  call findLine
  mv s1, a0 ; line
  ; basic/basic.e16.ts:958  if (line === 0) fail(E_LINE)
  bne s1, zero, .L1
  ; basic/basic.e16.ts:958  fail(E_LINE)
  li a0, 5
  call fail
.L1:
  ; basic/basic.e16.ts:959  if (gsp >= GOSUB_DEPTH) fail(E_COMPLEX)
  lw t0, 0x0116(zero)
  li t1, 16
  bltu t0, t1, .L2
  ; basic/basic.e16.ts:959  fail(E_COMPLEX)
  li a0, 9
  call fail
.L2:
  ; basic/basic.e16.ts:960  gosubStack[gsp * 2] = curLine
  lw t0, 0x0116(zero)
  slli t0, t0, 1
  slli t0, t0, 1
  lw t1, 0x010c(zero)
  sw t1, gosubStack(t0)
  ; basic/basic.e16.ts:961  gosubStack[gsp * 2 + 1] = txt
  lw t0, 0x0116(zero)
  slli t0, t0, 1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t1, 0x010a(zero)
  sw t1, gosubStack(t0)
  ; basic/basic.e16.ts:962  gsp++
  lw t0, 0x0116(zero)
  addi t0, t0, 1
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:963  jump(line, line + 4)
  mv a0, s1
  addi a1, s1, 4
  call jump
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:966 returnStatement() at -O1
returnStatement:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:967  if (gsp === 0) fail(E_RETURN)
  lw t0, 0x0116(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:967  fail(E_RETURN)
  li a0, 7
  call fail
.L1:
  ; basic/basic.e16.ts:968  gsp--
  lw t0, 0x0116(zero)
  addi t0, t0, -1
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:969  jump(gosubStack[gsp * 2], gosubStack[gsp * 2 + 1])
  lw t0, 0x0116(zero)
  slli t0, t0, 1
  slli t0, t0, 1
  lw t0, gosubStack(t0)
  lw t1, 0x0116(zero)
  slli t1, t1, 1
  addi t1, t1, 1
  slli t1, t1, 1
  lw t1, gosubStack(t1)
  mv a0, t0
  mv a1, t1
  call jump
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:973 forStatement() at -O1
;   at in s3
;   limit in 0(fp)
;   step in 2(fp)
;   k in s1
;   e in s2
forStatement:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  ; basic/basic.e16.ts:974  readName()
  call readName
  ; basic/basic.e16.ts:975  const at = findVar(true)
  li a0, 1
  call findVar
  mv s3, a0 ; at
  ; basic/basic.e16.ts:976  expect(CH_EQ)
  li a0, 61
  call expect
  ; basic/basic.e16.ts:977  expr()
  call expr
  ; basic/basic.e16.ts:978  copy8(top(), at)
  call top
  mv a1, s3
  call copy8
  ; basic/basic.e16.ts:979  nsp -= 8
  lw t0, 0x0112(zero)
  addi t0, t0, -8
  sw t0, 0x0112(zero)
  ; basic/basic.e16.ts:980  if (next() !== T_TO) fail(E_SYNTAX)
  call next
  li t0, 139
  beq a0, t0, .L1
  ; basic/basic.e16.ts:980  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:981  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:982  expr()
  call expr
  ; basic/basic.e16.ts:983  const limit = top()
  call top
  sw a0, 0(fp) ; limit
  ; basic/basic.e16.ts:984  if (next() === T_STEP) {
  call next
  li t0, 140
  bne a0, t0, .L2
  ; basic/basic.e16.ts:985  txt++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:986  expr()
  call expr
  j .L3
.L2:
  ; basic/basic.e16.ts:987  setInt(push(), 1)
  call push
  li a1, 1
  call setInt
.L3:
  ; basic/basic.e16.ts:988  const step = top()
  call top
  sw a0, 2(fp) ; step
  ; basic/basic.e16.ts:990  let k: u16 = 0
  li s1, 0 ; k
  ; basic/basic.e16.ts:991  while (k < fsp && peek16(forEntry(k)) !== at) k++
  j .L6
.L4:
  ; basic/basic.e16.ts:991  k++
  addi s1, s1, 1
.L6:
  lw t0, 0x0114(zero)
  bgeu s1, t0, .L8
  mv a0, s1
  call forEntry
  lw t0, 0(a0)
  bne t0, s3, .L4
.L8:
  ; basic/basic.e16.ts:992  fsp = k
  sw s1, 0x0114(zero)
  ; basic/basic.e16.ts:993  if (fsp >= FOR_DEPTH) fail(E_COMPLEX)
  lw t0, 0x0114(zero)
  li t1, 8
  bltu t0, t1, .L9
  ; basic/basic.e16.ts:993  fail(E_COMPLEX)
  li a0, 9
  call fail
.L9:
  ; basic/basic.e16.ts:994  const e = forEntry(fsp)
  lw a0, 0x0114(zero)
  call forEntry
  mv s2, a0 ; e
  ; basic/basic.e16.ts:995  poke16(e, at)
  sw s3, 0(s2)
  ; basic/basic.e16.ts:996  copy8(limit, e + 2)
  lw a0, 0(fp)
  addi a1, s2, 2
  call copy8
  ; basic/basic.e16.ts:997  copy8(step, e + 10)
  lw a0, 2(fp)
  addi a1, s2, 10
  call copy8
  ; basic/basic.e16.ts:998  poke16(e + 18, curLine)
  lw t0, 0x010c(zero)
  sw t0, 18(s2)
  ; basic/basic.e16.ts:999  poke16(e + 20, txt)
  lw t0, 0x010a(zero)
  sw t0, 20(s2)
  ; basic/basic.e16.ts:1000  fsp++
  lw t0, 0x0114(zero)
  addi t0, t0, 1
  sw t0, 0x0114(zero)
  ; basic/basic.e16.ts:1001  nsp -= 16
  lw t0, 0x0112(zero)
  addi t0, t0, -16
  sw t0, 0x0112(zero)
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/basic.e16.ts:1004 forEntry(k) at -O1
;   k in a0
forEntry:
  ; basic/basic.e16.ts:1005  return addr(forStack) + k * FOR_SIZE
  li t0, 22
  mul t0, a0, t0
  addi a0, t0, forStack
.return:
  ret

; basic/basic.e16.ts:1009 nextStatement() at -O1
;   k in s2
;   at/e in s1
;   at in s3
;   r in 0(fp)
;   up in 2(fp)
;   past in 4(fp)
nextStatement:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  ; basic/basic.e16.ts:1010  if (fsp === 0) fail(E_NEXT)
  lw t0, 0x0114(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1010  fail(E_NEXT)
  li a0, 6
  call fail
.L1:
  ; basic/basic.e16.ts:1011  let k = fsp - 1
  lw t0, 0x0114(zero)
  addi s2, t0, -1
  ; basic/basic.e16.ts:1012  if (isLetter(next())) {
  call next
  call isLetter
  beqz a0, .L2
  ; basic/basic.e16.ts:1013  readName()
  call readName
  ; basic/basic.e16.ts:1014  const at = findVar(false)
  li a0, 0
  call findVar
  mv s1, a0 ; at/e
  ; basic/basic.e16.ts:1015  while (peek16(forEntry(k)) !== at) {
  j .L5
.L3:
  ; basic/basic.e16.ts:1016  if (k === 0) fail(E_NEXT)
  bne s2, zero, .L7
  ; basic/basic.e16.ts:1016  fail(E_NEXT)
  li a0, 6
  call fail
.L7:
  ; basic/basic.e16.ts:1017  k--
  addi s2, s2, -1
.L5:
  mv a0, s2
  call forEntry
  lw t0, 0(a0)
  bne t0, s1, .L3
.L2:
  ; basic/basic.e16.ts:1020  const e = forEntry(k)
  mv a0, s2
  call forEntry
  mv s1, a0 ; at/e
  ; basic/basic.e16.ts:1021  const at = peek16(e)
  lw s3, 0(s1)
  ; basic/basic.e16.ts:1022  math(M_ADD, at, e + 10)
  li a0, 1
  mv a1, s3
  addi a2, s1, 10
  call math
  ; basic/basic.e16.ts:1023  math(M_CMP, at, e + 2)
  li a0, 6
  mv a1, s3
  addi a2, s1, 2
  call math
  ; basic/basic.e16.ts:1024  const r = peek16(MATH_RESULT)
  li t0, 65370
  lw t0, 0(t0)
  sw t0, 0(fp) ; r
  ; basic/basic.e16.ts:1026  const up = (peek(e + 10) & 0x80) === 0
  lbu t0, 10(s1)
  andi t0, t0, 128
  sub t0, t0, zero
  seqz t0, t0
  sw t0, 2(fp) ; up
  ; basic/basic.e16.ts:1027  const past = up ? r === 1 : r === 0xffff
  lw t0, 2(fp) ; up
  beqz t0, .L8
  li t0, 1
  lw t1, 0(fp) ; r
  sub t1, t1, t0
  seqz t0, t1
  j .L9
.L8:
  li t0, 65535
  lw t1, 0(fp) ; r
  sub t1, t1, t0
  seqz t0, t1
.L9:
  sw t0, 4(fp) ; past
  ; basic/basic.e16.ts:1028  if (past) {
  lw t0, 4(fp) ; past
  beqz t0, .L10
  ; basic/basic.e16.ts:1029  fsp = k
  sw s2, 0x0114(zero)
  ; basic/basic.e16.ts:1030  return
  j .return
.L10:
  ; basic/basic.e16.ts:1032  fsp = k + 1
  addi t0, s2, 1
  sw t0, 0x0114(zero)
  ; basic/basic.e16.ts:1033  jump(peek16(e + 18), peek16(e + 20))
  lw t0, 18(s1)
  lw t1, 20(s1)
  mv a0, t0
  mv a1, t1
  call jump
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; basic/basic.e16.ts:1036 pokeStatement() at -O1
;   a in s1
pokeStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1037  expr()
  call expr
  ; basic/basic.e16.ts:1038  const a = u16(toInt(top()))
  call top
  call toInt
  mv s1, a0 ; a
  ; basic/basic.e16.ts:1039  nsp -= 8
  lw t0, 0x0112(zero)
  addi t0, t0, -8
  sw t0, 0x0112(zero)
  ; basic/basic.e16.ts:1040  expect(CH_COMMA)
  li a0, 44
  call expect
  ; basic/basic.e16.ts:1041  expr()
  call expr
  ; basic/basic.e16.ts:1042  poke(a, u16(toInt(top())))
  call top
  call toInt
  sb a0, 0(s1)
  ; basic/basic.e16.ts:1043  nsp -= 8
  lw t0, 0x0112(zero)
  addi t0, t0, -8
  sw t0, 0x0112(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1048 runStatement() at -O1
;   from in s1
runStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1049  let from = PROG
  li s1, 2048 ; from
  ; basic/basic.e16.ts:1050  if (isDigit(next())) {
  call next
  call isDigit
  beqz a0, .L1
  ; basic/basic.e16.ts:1051  from = findLine(readUnsigned(), true)
  call readUnsigned
  li a1, 1
  call findLine
  mv s1, a0 ; from
  ; basic/basic.e16.ts:1052  if (from === 0) fail(E_LINE)
  bne s1, zero, .L2
  ; basic/basic.e16.ts:1052  fail(E_LINE)
  li a0, 5
  call fail
.L2:
.L1:
  ; basic/basic.e16.ts:1054  clearVariables()
  call clearVariables
  ; basic/basic.e16.ts:1055  if (peek16(from) === 0) {
  lw t0, 0(s1)
  bne t0, zero, .L3
  ; basic/basic.e16.ts:1056  endProgram()
  call endProgram
  ; basic/basic.e16.ts:1057  return
  j .return
.L3:
  ; basic/basic.e16.ts:1059  startRun(from, from + 4)
  mv a0, s1
  addi a1, s1, 4
  call startRun
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1062 contStatement() at -O1
contStatement:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1063  if (contLine === 0) fail(E_CONT)
  lw t0, 0x011a(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1063  fail(E_CONT)
  li a0, 10
  call fail
.L1:
  ; basic/basic.e16.ts:1064  startRun(contLine, contTxt)
  lw t0, 0x011a(zero)
  lw t1, 0x011c(zero)
  mv a0, t0
  mv a1, t1
  call startRun
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1068 startRun(line, text) at -O1
;   line in s1
;   text in s2
startRun:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; line
  mv s2, a1 ; text
  ; basic/basic.e16.ts:1069  running = true
  li t0, 1
  sw t0, 0x0118(zero)
  ; basic/basic.e16.ts:1070  marks()
  call marks
  ; basic/basic.e16.ts:1071  jump(line, text)
  mv a0, s1
  mv a1, s2
  call jump
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:1074 listStatement() at -O1
;   at in s1
listStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1075  let at = PROG
  li s1, 2048 ; at
  ; basic/basic.e16.ts:1076  if (isDigit(next())) at = findLine(readUnsigned(), false)
  call next
  call isDigit
  beqz a0, .L4
  ; basic/basic.e16.ts:1076  at = findLine(readUnsigned(), false)
  call readUnsigned
  li a1, 0
  call findLine
  mv s1, a0 ; at
  ; basic/basic.e16.ts:1077  while (at !== 0 && peek16(at) !== 0) {
  j .L4
.L2:
  ; basic/basic.e16.ts:1078  checkBreak()
  call checkBreak
  ; basic/basic.e16.ts:1079  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1080  printUnsigned(peek16(at))
  lw a0, 0(s1)
  call printUnsigned
  ; basic/basic.e16.ts:1081  putc(CH_SPACE)
  li a0, 32
  call putc
  ; basic/basic.e16.ts:1082  expand(at + 4, 0, 0)
  addi a0, s1, 4
  li a1, 0
  li a2, 0
  call expand
  ; basic/basic.e16.ts:1083  newline()
  call newline
  ; basic/basic.e16.ts:1084  at += peek16(at + 2)
  lw t0, 2(s1)
  add s1, s1, t0
.L4:
  beq s1, zero, .L6
  lw t0, 0(s1)
  bne t0, zero, .L2
.L6:
  ; basic/basic.e16.ts:1086  toLineEnd()
  call toLineEnd
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1092 run() at -O1
;   nextLine in s1
run:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1093  while (running) {
  j .L3
.L1:
  ; basic/basic.e16.ts:1094  if (jumping) {
  lw t0, 0x011e(zero)
  beqz t0, .L5
  ; basic/basic.e16.ts:1095  jumping = false
  sw zero, 0x011e(zero)
  ; basic/basic.e16.ts:1096  curLine = jumpLine
  lw t0, 0x0120(zero)
  sw t0, 0x010c(zero)
  ; basic/basic.e16.ts:1097  txt = jumpTxt
  lw t0, 0x0122(zero)
  sw t0, 0x010a(zero)
  j .L6
.L5:
  ; basic/basic.e16.ts:1099  const nextLine = curLine + peek16(curLine + 2)
  lw t0, 0x010c(zero)
  lw t1, 0x010c(zero)
  lw t1, 2(t1)
  add s1, t0, t1
  ; basic/basic.e16.ts:1100  if (peek16(nextLine) === 0) {
  lw t0, 0(s1)
  bne t0, zero, .L7
  ; basic/basic.e16.ts:1101  running = false
  sw zero, 0x0118(zero)
  ; basic/basic.e16.ts:1102  break
  j .L4
.L7:
  ; basic/basic.e16.ts:1104  curLine = nextLine
  sw s1, 0x010c(zero)
  ; basic/basic.e16.ts:1105  txt = curLine + 4
  lw t0, 0x010c(zero)
  addi t0, t0, 4
  sw t0, 0x010a(zero)
.L6:
  ; basic/basic.e16.ts:1108  if (curLine === 0) {
  lw t0, 0x010c(zero)
  bne t0, zero, .L8
  ; basic/basic.e16.ts:1109  statements()
  call statements
  ; basic/basic.e16.ts:1110  if (!jumping) running = false
  lw t0, 0x011e(zero)
  bnez t0, .L2
  ; basic/basic.e16.ts:1110  running = false
  sw zero, 0x0118(zero)
  ; basic/basic.e16.ts:1111  continue
  j .L2
.L8:
  ; basic/basic.e16.ts:1113  statements()
  call statements
.L2:
.L3:
  lw t0, 0x0118(zero)
  bnez t0, .L1
.L4:
  ; basic/basic.e16.ts:1115  stopRunning()
  call stopRunning
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1119 isCalculation() at -O1
;   c in s1
;   save in s2
;   assigns in s3
isCalculation:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/basic.e16.ts:1120  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1121  if (c >= 0x80) return c >= T_SIN
  li t0, 128
  bltu s1, t0, .L1
  ; basic/basic.e16.ts:1121  return c >= T_SIN
  li t0, 180
  sltu t0, s1, t0
  xori a0, t0, 1
  j .return
.L1:
  ; basic/basic.e16.ts:1122  if (!isLetter(c)) return c !== 0
  mv a0, s1
  call isLetter
  bnez a0, .L2
  ; basic/basic.e16.ts:1122  return c !== 0
  sub t0, s1, zero
  snez a0, t0
  j .return
.L2:
  ; basic/basic.e16.ts:1123  const save = txt
  lw s2, 0x010a(zero)
  ; basic/basic.e16.ts:1124  readName()
  call readName
  ; basic/basic.e16.ts:1125  const assigns = next() === CH_EQ
  call next
  li t0, 61
  sub t0, a0, t0
  seqz s3, t0
  ; basic/basic.e16.ts:1126  txt = save
  sw s2, 0x010a(zero)
  ; basic/basic.e16.ts:1127  return !assigns
  seqz a0, s3
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:1131 calculate() at -O1
;   n in s2
;   cols in s3
;   pad in s1
calculate:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; basic/basic.e16.ts:1132  expr()
  call expr
  ; basic/basic.e16.ts:1133  if (next() !== 0) fail(E_SYNTAX)
  call next
  beq a0, zero, .L1
  ; basic/basic.e16.ts:1133  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:1134  copy8(top(), addr(ans))
  call top
  la a1, ans
  call copy8
  ; basic/basic.e16.ts:1135  const n = formatTop()
  call formatTop
  mv s2, a0 ; n
  ; basic/basic.e16.ts:1136  const cols = peek16(COLS)
  lw s3, 4(zero)
  ; basic/basic.e16.ts:1137  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1138  let pad: i16 = i16(cols - n - 1)
  sub t0, s3, s2
  addi s1, t0, -1
  ; basic/basic.e16.ts:1139  while (pad > 0) {
  j .L4
.L2:
  ; basic/basic.e16.ts:1140  putc(CH_SPACE)
  li a0, 32
  call putc
  ; basic/basic.e16.ts:1141  pad--
  addi s1, s1, -1
.L4:
  blt zero, s1, .L2
  ; basic/basic.e16.ts:1143  puts(addr(textOut))
  la a0, textOut
  call puts
  ; basic/basic.e16.ts:1144  newline()
  call newline
  ; basic/basic.e16.ts:1145  nsp -= 8
  lw t0, 0x0112(zero)
  addi t0, t0, -8
  sw t0, 0x0112(zero)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:1149 enter() at -O1
;   length in s3
;   save in s0
;   n in s1
;   c in s2
enter:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  ; basic/basic.e16.ts:1150  const length = tokenize(addr(lineBuf), addr(tokens))
  la a0, lineBuf
  la a1, tokens
  call tokenize
  mv s3, a0 ; length
  ; basic/basic.e16.ts:1151  txt = addr(tokens)
  la t0, tokens
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:1152  curLine = 0
  sw zero, 0x010c(zero)
  ; basic/basic.e16.ts:1153  if (isDigit(next())) {
  call next
  call isDigit
  beqz a0, .L1
  ; basic/basic.e16.ts:1154  const save = txt
  lw s0, 0x010a(zero)
  ; basic/basic.e16.ts:1155  const n = readUnsigned()
  call readUnsigned
  mv s1, a0 ; n
  ; basic/basic.e16.ts:1156  const c = next()
  call next
  mv s2, a0 ; c
  ; basic/basic.e16.ts:1158  if (n !== 0 && (isLetter(c) || c >= 0x80 || (c === 0 && proMode))) {
  beq s1, zero, .L2
  mv a0, s2
  call isLetter
  bnez a0, .L3
  li t0, 128
  bgeu s2, t0, .L3
  bne s2, zero, .L2
  lw t0, 0x0124(zero)
  beqz t0, .L2
.L3:
  ; basic/basic.e16.ts:1159  storeLine(n, txt, length - (txt - addr(tokens)))
  lw t0, 0x010a(zero)
  lw t1, 0x010a(zero)
  la t2, tokens
  sub t1, t1, t2
  sub t1, s3, t1
  mv a0, s1
  mv a1, t0
  mv a2, t1
  call storeLine
  ; basic/basic.e16.ts:1160  recallNo = n
  sw s1, 0x0128(zero)
  ; basic/basic.e16.ts:1161  justStored = true
  li t0, 1
  sw t0, 0x012a(zero)
  ; basic/basic.e16.ts:1162  return
  j .return
.L2:
  ; basic/basic.e16.ts:1164  txt = save
  sw s0, 0x010a(zero)
.L1:
  ; basic/basic.e16.ts:1166  if (isCalculation()) {
  call isCalculation
  beqz a0, .L4
  ; basic/basic.e16.ts:1167  calculate()
  call calculate
  ; basic/basic.e16.ts:1168  return
  j .return
.L4:
  ; basic/basic.e16.ts:1170  jumping = false
  sw zero, 0x011e(zero)
  ; basic/basic.e16.ts:1171  running = false
  sw zero, 0x0118(zero)
  ; basic/basic.e16.ts:1172  statements()
  call statements
  ; basic/basic.e16.ts:1173  if (jumping) {
  lw t0, 0x011e(zero)
  beqz t0, .L5
  ; basic/basic.e16.ts:1174  running = true
  li t0, 1
  sw t0, 0x0118(zero)
  ; basic/basic.e16.ts:1175  marks()
  call marks
  ; basic/basic.e16.ts:1176  run()
  call run
.L5:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:1181 basicLoop() at -O1
;   length in s2
;   prompt in s3
;   n in s1
basicLoop:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; basic/basic.e16.ts:1182  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0112(zero)
  ; basic/basic.e16.ts:1183  running = false
  sw zero, 0x0118(zero)
  ; basic/basic.e16.ts:1184  marks()
  call marks
  ; basic/basic.e16.ts:1186  let length: u16 = 0
  li s2, 0 ; length
  ; basic/basic.e16.ts:1187  let prompt = true
  li s3, 1 ; prompt
  ; basic/basic.e16.ts:1188  for (;;) {
.L1:
  ; basic/basic.e16.ts:1189  if (prompt) {
  beqz s3, .L5
  ; basic/basic.e16.ts:1190  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1191  putc(CH_GT)
  li a0, 62
  call putc
.L5:
  ; basic/basic.e16.ts:1193  prompt = true
  li s3, 1 ; prompt
  ; basic/basic.e16.ts:1194  const n: i16 = editLine(addr(lineBuf), LINE_MAX, length)
  la a0, lineBuf
  li a1, 78
  mv a2, s2
  call editLine
  mv s1, a0 ; n
  ; basic/basic.e16.ts:1195  length = 0
  li s2, 0 ; length
  ; basic/basic.e16.ts:1196  if (n === EDIT_MODE) {
  li t0, 65533
  bne s1, t0, .L6
  ; basic/basic.e16.ts:1197  proMode = !proMode
  lw t0, 0x0124(zero)
  seqz t0, t0
  sw t0, 0x0124(zero)
  ; basic/basic.e16.ts:1198  marks()
  call marks
  ; basic/basic.e16.ts:1199  continue
  j .L1
.L6:
  ; basic/basic.e16.ts:1201  if (n === EDIT_UP || n === EDIT_DOWN) {
  li t0, 65532
  beq s1, t0, .L8
  li t0, 65531
  bne s1, t0, .L7
.L8:
  ; basic/basic.e16.ts:1202  length = recall(n === EDIT_UP)
  li t0, 65532
  sub t0, s1, t0
  seqz a0, t0
  call recall
  mv s2, a0 ; length
  ; basic/basic.e16.ts:1203  prompt = false
  li s3, 0 ; prompt
  ; basic/basic.e16.ts:1204  continue
  j .L1
.L7:
  ; basic/basic.e16.ts:1207  if (n < 0) continue
  bge s1, zero, .L9
  ; basic/basic.e16.ts:1207  continue
  j .L1
.L9:
  ; basic/basic.e16.ts:1208  newline()
  call newline
  ; basic/basic.e16.ts:1209  if (n > 0) {
  bge zero, s1, .L1
  ; basic/basic.e16.ts:1210  move(addr(lineBuf), addr(lastLine), u16(n))
  la a0, lineBuf
  la a1, lastLine
  mv a2, s1
  call move
  ; basic/basic.e16.ts:1211  lastLength = u16(n)
  sw s1, 0x012c(zero)
  ; basic/basic.e16.ts:1212  enter()
  call enter
  j .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:1222 recall(up) at -O1
;   up in s3
;   at in s1
;   digits in s2
recall:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; up
  ; basic/basic.e16.ts:1223  if (!proMode) {
  lw t0, 0x0124(zero)
  bnez t0, .L1
  ; basic/basic.e16.ts:1224  if (!up) return 0
  bnez s3, .L2
  ; basic/basic.e16.ts:1224  return 0
  li a0, 0
  j .return
.L2:
  ; basic/basic.e16.ts:1225  move(addr(lastLine), addr(lineBuf), lastLength)
  lw t0, 0x012c(zero)
  la a0, lastLine
  la a1, lineBuf
  mv a2, t0
  call move
  ; basic/basic.e16.ts:1226  return lastLength
  lw a0, 0x012c(zero)
  j .return
.L1:
  ; basic/basic.e16.ts:1228  let at: u16 = 0
  li s1, 0 ; at
  ; basic/basic.e16.ts:1229  if (up && justStored) at = findLine(recallNo, true)
  beqz s3, .L3
  lw t0, 0x012a(zero)
  beqz t0, .L3
  ; basic/basic.e16.ts:1229  at = findLine(recallNo, true)
  lw a0, 0x0128(zero)
  li a1, 1
  call findLine
  mv s1, a0 ; at
.L3:
  ; basic/basic.e16.ts:1230  justStored = false
  sw zero, 0x012a(zero)
  ; basic/basic.e16.ts:1231  if (at === 0) at = neighbour(up)
  bne s1, zero, .L4
  ; basic/basic.e16.ts:1231  at = neighbour(up)
  mv a0, s3
  call neighbour
  mv s1, a0 ; at
.L4:
  ; basic/basic.e16.ts:1232  if (at === 0) at = findLine(recallNo, true)
  bne s1, zero, .L5
  ; basic/basic.e16.ts:1232  at = findLine(recallNo, true)
  lw a0, 0x0128(zero)
  li a1, 1
  call findLine
  mv s1, a0 ; at
.L5:
  ; basic/basic.e16.ts:1233  if (at === 0) return 0
  bne s1, zero, .L6
  ; basic/basic.e16.ts:1233  return 0
  li a0, 0
  j .return
.L6:
  ; basic/basic.e16.ts:1234  recallNo = peek16(at)
  lw t0, 0(s1)
  sw t0, 0x0128(zero)
  ; basic/basic.e16.ts:1235  const digits = unsignedText(recallNo, addr(lineBuf))
  lw a0, 0x0128(zero)
  la a1, lineBuf
  call unsignedText
  mv s2, a0 ; digits
  ; basic/basic.e16.ts:1236  poke(addr(lineBuf) + digits, CH_SPACE)
  li t0, 32
  sb t0, lineBuf(s2)
  ; basic/basic.e16.ts:1237  return digits + 1 + expand(at + 4, addr(lineBuf) + digits + 1, LINE_MAX - digits - 1)
  li t0, 78
  sub t0, t0, s2
  addi a0, s1, 4
  addi a1, s2, lineBuf+1
  addi a2, t0, -1
  call expand
  addi t0, s2, 1
  add a0, t0, a0
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:1241 neighbour(up) at -O1
;   up in a0
;   at in a1
;   found in a2
;   n in a3
neighbour:
  ; basic/basic.e16.ts:1242  let at = PROG
  li a1, 2048 ; at
  ; basic/basic.e16.ts:1243  let found: u16 = 0
  li a2, 0 ; found
  ; basic/basic.e16.ts:1244  while (peek16(at) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:1245  const n = peek16(at)
  lw a3, 0(a1)
  ; basic/basic.e16.ts:1246  if (!up && n > recallNo) return at
  bnez a0, .L5
  lw t0, 0x0128(zero)
  bgeu t0, a3, .L5
  ; basic/basic.e16.ts:1246  return at
  mv a0, a1
  j .return
.L5:
  ; basic/basic.e16.ts:1247  if (up && (recallNo === 0 || n < recallNo)) found = at
  beqz a0, .L6
  lw t0, 0x0128(zero)
  beq t0, zero, .L7
  lw t0, 0x0128(zero)
  bgeu a3, t0, .L6
.L7:
  ; basic/basic.e16.ts:1247  found = at
  mv a2, a1 ; found
.L6:
  ; basic/basic.e16.ts:1248  at += peek16(at + 2)
  lw t0, 2(a1)
  add a1, a1, t0
.L3:
  lw t0, 0(a1)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1250  return found
  mv a0, a2
.return:
  ret

; basic/basic.e16.ts:1253 showBanner() at -O1
showBanner:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1254  puts(str('ELEC-16 BASIC 1.0'))
  la a0, str_16
  call puts
  ; basic/basic.e16.ts:1255  newline()
  call newline
  ; basic/basic.e16.ts:1256  printUnsigned(LIMIT - varEnd)
  lw t0, 0x0110(zero)
  li t1, 28672
  sub a0, t1, t0
  call printUnsigned
  ; basic/basic.e16.ts:1257  puts(str(' BYTES FREE'))
  la a0, str_17
  call puts
  ; basic/basic.e16.ts:1258  newline()
  call newline
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1262 basicCold() at -O1
basicCold:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1263  poke16(INBASIC, 1)
  li t0, 1
  sw t0, 28(zero)
  ; basic/basic.e16.ts:1264  poke16(BRKFLAG, 0)
  sw zero, 30(zero)
  ; basic/basic.e16.ts:1266  keepProgramTo(keptProgramEnd())
  call keptProgramEnd
  call keepProgramTo
  ; basic/basic.e16.ts:1267  poke16(MATH_ANGLE, 0)
  li t0, 65372
  sw zero, 0(t0)
  ; basic/basic.e16.ts:1268  angleMarks = ANN_DEG
  li t0, 128
  sw t0, 0x0126(zero)
  ; basic/basic.e16.ts:1269  proMode = false
  sw zero, 0x0124(zero)
  ; basic/basic.e16.ts:1270  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1271  showBanner()
  call showBanner
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1275 basicWarm() at -O1
basicWarm:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1276  poke16(INBASIC, 1)
  li t0, 1
  sw t0, 28(zero)
  ; basic/basic.e16.ts:1277  poke16(BRKFLAG, 0)
  sw zero, 30(zero)
  ; basic/basic.e16.ts:1278  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1279  showBanner()
  call showBanner
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

str_0:
  .byte 82, 85, 78, 32, 76, 73, 83, 84, 32, 78, 69, 87, 32, 67, 79, 78, 84, 32, 80, 82, 73, 78, 84, 32, 73, 78, 80, 85, 84, 32, 76, 69, 84, 32, 73, 70, 32, 84, 72, 69, 78, 32, 69, 76, 83, 69, 32, 70, 79, 82, 32, 84, 79, 32, 83, 84, 69, 80, 32, 78, 69, 88, 84, 32, 71, 79, 84, 79, 32, 71, 79, 83, 85, 66, 32, 82, 69, 84, 85, 82, 78, 32, 69, 78, 68, 32, 83, 84, 79, 80, 32, 82, 69, 77, 32, 77, 79, 78, 32, 67, 76, 83, 32, 68, 69, 71, 32, 82, 65, 68, 32, 71, 82, 65, 68, 32, 80, 79, 75, 69, 32, 67, 65, 76, 76, 32, 87, 65, 73, 84, 32, 66, 69, 69, 80, 32, 68, 73, 77, 32, 68, 65, 84, 65, 32, 82, 69, 65, 68, 32, 82, 69, 83, 84, 79, 82, 69, 32, 79, 78, 32, 67, 76, 69, 65, 82, 32, 65, 85, 84, 79, 32, 82, 69, 78, 85, 77, 32, 68, 69, 76, 69, 84, 69, 32, 84, 82, 79, 78, 32, 84, 82, 79, 70, 70, 32, 70, 73, 76, 69, 83, 32, 76, 79, 65, 68, 32, 83, 65, 86, 69, 32, 75, 73, 76, 76, 32, 76, 79, 67, 65, 84, 69, 32, 67, 85, 82, 83, 79, 82, 32, 80, 83, 69, 84, 32, 80, 82, 69, 83, 69, 84, 32, 76, 73, 78, 69, 32, 71, 80, 82, 73, 78, 84, 32, 79, 80, 69, 78, 32, 67, 76, 79, 83, 69, 32, 83, 73, 78, 32, 67, 79, 83, 32, 84, 65, 78, 32, 65, 83, 73, 78, 32, 65, 67, 79, 83, 32, 65, 84, 65, 78, 32, 83, 81, 82, 32, 65, 66, 83, 32, 73, 78, 84, 32, 83, 71, 78, 32, 76, 79, 71, 32, 76, 78, 32, 69, 88, 80, 32, 82, 78, 68, 32, 80, 73, 32, 65, 78, 83, 32, 80, 69, 69, 75, 32, 80, 79, 73, 78, 84, 32, 78, 79, 84, 32, 65, 78, 68, 32, 79, 82, 0
str_1:
  .byte 22, 23, 24, 25, 26, 27, 21, 17, 18, 20, 29, 28, 30, 0
str_2:
  .byte 83, 89, 78, 84, 65, 88, 0
str_3:
  .byte 79, 86, 69, 82, 70, 76, 79, 87, 0
str_4:
  .byte 68, 73, 86, 32, 66, 89, 32, 48, 0
str_5:
  .byte 65, 82, 71, 85, 77, 69, 78, 84, 0
str_6:
  .byte 78, 79, 32, 76, 73, 78, 69, 0
str_7:
  .byte 78, 69, 88, 84, 0
str_8:
  .byte 82, 69, 84, 85, 82, 78, 0
str_9:
  .byte 77, 69, 77, 79, 82, 89, 0
str_10:
  .byte 84, 79, 79, 32, 67, 79, 77, 80, 76, 69, 88, 0
str_11:
  .byte 67, 79, 78, 84, 0
str_12:
  .byte 32, 73, 78, 32, 0
str_13:
  .byte 69, 82, 82, 58, 0
str_14:
  .byte 66, 82, 69, 65, 75, 0
str_15:
  .byte 83, 84, 79, 80, 0
str_16:
  .byte 69, 76, 69, 67, 45, 49, 54, 32, 66, 65, 83, 73, 67, 32, 49, 46, 48, 0
str_17:
  .byte 32, 66, 89, 84, 69, 83, 32, 70, 82, 69, 69, 0
  .align 2
