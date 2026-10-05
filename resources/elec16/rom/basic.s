; Made by e16c from basic/rom.e16.ts, basic/text.e16.ts, basic/edit.e16.ts, basic/basic.e16.ts, basic/strings.e16.ts, basic/screen.e16.ts, basic/files.e16.ts, basic/tools.e16.ts, basic/monitor.e16.ts, basic/link.e16.ts: do not edit.

; matchedLength at 0x0100
; inQuotes at 0x0102
; rawMode at 0x0104
; startX at 0x0106
; startY at 0x0108
; n at 0x010a
; at at 0x010c
; txt at 0x010e
; curLine at 0x0110
; progEnd at 0x0112
; varEnd at 0x0114
; nsp at 0x0116
; strType at 0x0118
; varRoom at 0x011a
; outFile at 0x011c
; dataLine at 0x011e
; dataAt at 0x0120
; filesOpen at 0x0122
; tracing at 0x0124
; autoLine at 0x0126
; autoStep at 0x0128
; fsp at 0x012a
; gsp at 0x012c
; running at 0x012e
; contLine at 0x0130
; contTxt at 0x0132
; jumping at 0x0134
; jumpLine at 0x0136
; jumpTxt at 0x0138
; proMode at 0x013a
; angleMarks at 0x013c
; recallNo at 0x013e
; justStored at 0x0140
; lastLength at 0x0142
; strTop at 0x04f4
; name0 at 0x0616
; name1 at 0x0618
; nameIsString at 0x061a
; printed at 0x061c
; atX at 0x061e
; atY at 0x0620
; newStart at 0x07ea
; renumFrom at 0x07ec
; renumStep at 0x07ee
; rp at 0x07f0
; ro at 0x07f2
; rChanged at 0x07f4
; rInside at 0x07f6
; rWanting at 0x07f8
; askType at 0x07fa
lineBuf = 0x0144 ; 80 bytes
lastLine = 0x0194 ; 80 bytes
tokens = 0x01e4 ; 80 bytes
nums = 0x0234 ; 192 bytes
strTemp = 0x02f4 ; 512 bytes
ans = 0x04f6 ; 8 bytes
textOut = 0x04fe ; 24 bytes
forStack = 0x0516 ; 176 bytes
gosubStack = 0x05c6 ; 64 bytes
gosubFor = 0x0606 ; 16 bytes
cardBlock = 0x0622 ; 32 bytes
cardBuf = 0x0642 ; 256 bytes
nothing = 0x0742 ; 2 bytes
fileMode = 0x0744 ; 2 bytes
fileName = 0x0746 ; 24 bytes
fileOffset = 0x075e ; 4 bytes
fileLen = 0x0762 ; 4 bytes
filePos = 0x0766 ; 4 bytes
fileBuf = 0x076a ; 128 bytes

e16c_init:
  ; matchedLength = 0
  sw zero, 0x0100(zero)
  ; inQuotes = 0
  sw zero, 0x0102(zero)
  ; rawMode = 0
  sw zero, 0x0104(zero)
  ; startX = 0
  sw zero, 0x0106(zero)
  ; startY = 0
  sw zero, 0x0108(zero)
  ; n = 0
  sw zero, 0x010a(zero)
  ; at = 0
  sw zero, 0x010c(zero)
  ; txt = 0
  sw zero, 0x010e(zero)
  ; curLine = 0
  sw zero, 0x0110(zero)
  ; progEnd = 2048
  li t0, 2048
  sw t0, 0x0112(zero)
  ; varEnd = 2050
  li t0, 2050
  sw t0, 0x0114(zero)
  ; nsp = 0
  sw zero, 0x0116(zero)
  ; strType = 0
  sw zero, 0x0118(zero)
  ; varRoom = 0
  sw zero, 0x011a(zero)
  ; outFile = 0
  sw zero, 0x011c(zero)
  ; dataLine = 0
  sw zero, 0x011e(zero)
  ; dataAt = 0
  sw zero, 0x0120(zero)
  ; filesOpen = 0
  sw zero, 0x0122(zero)
  ; tracing = 0
  sw zero, 0x0124(zero)
  ; autoLine = 0
  sw zero, 0x0126(zero)
  ; autoStep = 10
  li t0, 10
  sw t0, 0x0128(zero)
  ; fsp = 0
  sw zero, 0x012a(zero)
  ; gsp = 0
  sw zero, 0x012c(zero)
  ; running = 0
  sw zero, 0x012e(zero)
  ; contLine = 0
  sw zero, 0x0130(zero)
  ; contTxt = 0
  sw zero, 0x0132(zero)
  ; jumping = 0
  sw zero, 0x0134(zero)
  ; jumpLine = 0
  sw zero, 0x0136(zero)
  ; jumpTxt = 0
  sw zero, 0x0138(zero)
  ; proMode = 0
  sw zero, 0x013a(zero)
  ; angleMarks = 128
  li t0, 128
  sw t0, 0x013c(zero)
  ; recallNo = 0
  sw zero, 0x013e(zero)
  ; justStored = 0
  sw zero, 0x0140(zero)
  ; lastLength = 0
  sw zero, 0x0142(zero)
  ; strTop = 0
  sw zero, 0x04f4(zero)
  ; name0 = 0
  sw zero, 0x0616(zero)
  ; name1 = 0
  sw zero, 0x0618(zero)
  ; nameIsString = 0
  sw zero, 0x061a(zero)
  ; printed = 0
  sw zero, 0x061c(zero)
  ; atX = 0
  sw zero, 0x061e(zero)
  ; atY = 0
  sw zero, 0x0620(zero)
  ; newStart = 10
  li t0, 10
  sw t0, 0x07ea(zero)
  ; renumFrom = 0
  sw zero, 0x07ec(zero)
  ; renumStep = 10
  li t0, 10
  sw t0, 0x07ee(zero)
  ; rp = 0
  sw zero, 0x07f0(zero)
  ; ro = 0
  sw zero, 0x07f2(zero)
  ; rChanged = 0
  sw zero, 0x07f4(zero)
  ; rInside = 0
  sw zero, 0x07f6(zero)
  ; rWanting = 0
  sw zero, 0x07f8(zero)
  ; askType = 0
  sw zero, 0x07fa(zero)
  ; lineBuf: 80 bytes of 0
  li t0, 0x0144
  li t1, 80
  mset t0, zero, t1
  ; lastLine: 80 bytes of 0
  li t0, 0x0194
  li t1, 80
  mset t0, zero, t1
  ; tokens: 80 bytes of 0
  li t0, 0x01e4
  li t1, 80
  mset t0, zero, t1
  ; nums: 192 bytes of 0
  li t0, 0x0234
  li t1, 192
  mset t0, zero, t1
  ; strTemp: 512 bytes of 0
  li t0, 0x02f4
  li t1, 512
  mset t0, zero, t1
  ; ans: 8 bytes of 0
  li t0, 0x04f6
  li t1, 8
  mset t0, zero, t1
  ; textOut: 24 bytes of 0
  li t0, 0x04fe
  li t1, 24
  mset t0, zero, t1
  ; forStack: 176 bytes of 0
  li t0, 0x0516
  li t1, 176
  mset t0, zero, t1
  ; gosubStack: 64 bytes of 0
  li t0, 0x05c6
  li t1, 64
  mset t0, zero, t1
  ; gosubFor: 16 bytes of 0
  li t0, 0x0606
  li t1, 16
  mset t0, zero, t1
  ; cardBlock: 32 bytes of 0
  li t0, 0x0622
  li t1, 32
  mset t0, zero, t1
  ; cardBuf: 256 bytes of 0
  li t0, 0x0642
  li t1, 256
  mset t0, zero, t1
  ; nothing: 2 bytes of 0
  li t0, 0x0742
  li t1, 2
  mset t0, zero, t1
  ; fileMode: 2 bytes of 0
  li t0, 0x0744
  li t1, 2
  mset t0, zero, t1
  ; fileName: 24 bytes of 0
  li t0, 0x0746
  li t1, 24
  mset t0, zero, t1
  ; fileOffset: 4 bytes of 0
  li t0, 0x075e
  li t1, 4
  mset t0, zero, t1
  ; fileLen: 4 bytes of 0
  li t0, 0x0762
  li t1, 4
  mset t0, zero, t1
  ; filePos: 4 bytes of 0
  li t0, 0x0766
  li t1, 4
  mset t0, zero, t1
  ; fileBuf: 128 bytes of 0
  li t0, 0x076a
  li t1, 128
  mset t0, zero, t1
  ret

; basic/text.e16.ts:132 isLetter(c) at -O1
;   c in a0
isLetter:
  ; basic/text.e16.ts:133  return (c >= CH_A && c <= CH_Z) || (c >= CH_LOWER_A && c <= CH_LOWER_Z)
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

; basic/text.e16.ts:136 upper(c) at -O1
;   c in a0
upper:
  ; basic/text.e16.ts:137  if (c >= CH_LOWER_A && c <= CH_LOWER_Z) return c - 0x20
  li t0, 97
  bltu a0, t0, .L1
  li t0, 122
  bltu t0, a0, .L1
  ; basic/text.e16.ts:137  return c - 0x20
  addi a0, a0, -32
.L1:
  ; basic/text.e16.ts:138  return c
.return:
  ret

; basic/text.e16.ts:142 keywordText(token) at -O1
;   token in a0
;   at in a1
;   k in a2
keywordText:
  ; basic/text.e16.ts:143  let at = KEYWORDS
  la a1, str_0
  ; basic/text.e16.ts:144  let k: u16 = 0x80
  li a2, 128 ; k
  ; basic/text.e16.ts:145  while (k < token) {
  j .L3
  ; basic/text.e16.ts:146  while (peek(at) !== CH_SPACE && peek(at) !== 0) at++
.L5:
  ; basic/text.e16.ts:146  at++
  addi a1, a1, 1
.L7:
  lbu t0, 0(a1)
  li t1, 32
  beq t0, t1, .L9
  lbu t0, 0(a1)
  bne t0, zero, .L5
.L9:
  ; basic/text.e16.ts:147  if (peek(at) === 0) return 0
  lbu t0, 0(a1)
  bne t0, zero, .L10
  ; basic/text.e16.ts:147  return 0
  li a0, 0
  ret
.L10:
  ; basic/text.e16.ts:148  at++
  addi a1, a1, 1
  ; basic/text.e16.ts:149  k++
  addi a2, a2, 1
.L3:
  bltu a2, a0, .L7
  ; basic/text.e16.ts:151  return at
  mv a0, a1
.return:
  ret

; basic/text.e16.ts:155 matches(text, word) at -O1
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
  ; basic/text.e16.ts:156  let n: u16 = 0
  li s1, 0 ; n
  ; basic/text.e16.ts:157  while (peek(word + n) !== CH_SPACE && peek(word + n) !== 0) {
  j .L3
.L1:
  ; basic/text.e16.ts:158  if (upper(peek(text + n)) !== peek(word + n)) return 0
  add t0, s3, s1
  lbu a0, 0(t0)
  call upper
  add t0, s2, s1
  lbu t0, 0(t0)
  beq a0, t0, .L5
  ; basic/text.e16.ts:158  return 0
  li a0, 0
  j .return
.L5:
  ; basic/text.e16.ts:159  n++
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
  ; basic/text.e16.ts:161  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/text.e16.ts:167 keywordAt(text) at -O1
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
  ; basic/text.e16.ts:168  let best: u16 = 0
  sw zero, 0(fp) ; best
  ; basic/text.e16.ts:169  let bestLength: u16 = 0
  li s2, 0 ; bestLength
  ; basic/text.e16.ts:170  let at = KEYWORDS
  la s1, str_0
  ; basic/text.e16.ts:171  let token: u16 = 0x80
  li s3, 128 ; token
  ; basic/text.e16.ts:172  while (peek(at) !== 0) {
  j .L3
.L1:
  ; basic/text.e16.ts:173  const n = matches(text, at)
  lw a0, 4(fp)
  mv a1, s1
  call matches
  sw a0, 2(fp) ; n
  ; basic/text.e16.ts:174  if (n > bestLength) {
  lw t0, 2(fp) ; n
  bgeu s2, t0, .L8
  ; basic/text.e16.ts:175  best = token
  sw s3, 0(fp) ; best
  ; basic/text.e16.ts:176  bestLength = n
  lw s2, 2(fp) ; n
  ; basic/text.e16.ts:178  while (peek(at) !== CH_SPACE && peek(at) !== 0) at++
  j .L8
.L6:
  ; basic/text.e16.ts:178  at++
  addi s1, s1, 1
.L8:
  lbu t0, 0(s1)
  li t1, 32
  beq t0, t1, .L10
  lbu t0, 0(s1)
  bne t0, zero, .L6
.L10:
  ; basic/text.e16.ts:179  if (peek(at) === CH_SPACE) at++
  lbu t0, 0(s1)
  li t1, 32
  bne t0, t1, .L11
  ; basic/text.e16.ts:179  at++
  addi s1, s1, 1
.L11:
  ; basic/text.e16.ts:180  token++
  addi s3, s3, 1
.L3:
  lbu t0, 0(s1)
  bne t0, zero, .L1
  ; basic/text.e16.ts:182  matchedLength = bestLength
  sw s2, 0x0100(zero)
  ; basic/text.e16.ts:183  return best
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

; basic/text.e16.ts:194 rawFrom() at -O1
rawFrom:
  ; basic/text.e16.ts:195  inQuotes = false
  sw zero, 0x0102(zero)
  ; basic/text.e16.ts:196  rawMode = RAW_NONE
  sw zero, 0x0104(zero)
.return:
  ret

; basic/text.e16.ts:200 kept() at -O1
kept:
  ; basic/text.e16.ts:201  return inQuotes || rawMode !== RAW_NONE
  lw t0, 0x0102(zero)
  sub t0, t0, zero
  snez t0, t0
  mv t1, t0
  bnez t1, .L1
  lw t0, 0x0104(zero)
  sub t0, t0, zero
  snez t0, t0
.L1:
  mv a0, t0
.return:
  ret

; basic/text.e16.ts:205 afterToken(token) at -O1
;   token in a0
afterToken:
  ; basic/text.e16.ts:206  if (token === T_REM) rawMode = RAW_REM
  li t0, 147
  bne a0, t0, .L1
  ; basic/text.e16.ts:206  rawMode = RAW_REM
  li t0, 1
  sw t0, 0x0104(zero)
  j .L2
.L1:
  ; basic/text.e16.ts:207  if (token === T_DATA) rawMode = RAW_DATA
  li t0, 158
  bne a0, t0, .L3
  ; basic/text.e16.ts:207  rawMode = RAW_DATA
  li t0, 2
  sw t0, 0x0104(zero)
.L3:
.L2:
.return:
  ret

; basic/text.e16.ts:211 afterChar(c) at -O1
;   c in a0
afterChar:
  ; basic/text.e16.ts:212  if (c === CH_QUOTE) inQuotes = !inQuotes
  li t0, 34
  bne a0, t0, .L1
  ; basic/text.e16.ts:212  inQuotes = !inQuotes
  lw t0, 0x0102(zero)
  seqz t0, t0
  sw t0, 0x0102(zero)
  j .L2
.L1:
  ; basic/text.e16.ts:213  if (c === CH_COLON && rawMode === RAW_DATA && !inQuotes) rawMode = RAW_NONE
  li t0, 58
  bne a0, t0, .L3
  lw t0, 0x0104(zero)
  li t1, 2
  bne t0, t1, .L3
  lw t0, 0x0102(zero)
  bnez t0, .L3
  ; basic/text.e16.ts:213  rawMode = RAW_NONE
  sw zero, 0x0104(zero)
.L3:
.L2:
.return:
  ret

; basic/text.e16.ts:221 tokenize(text, out) at -O1
;   text in 0(fp)
;   out in 2(fp)
;   i in s1
;   o in s2
;   c in s3
;   keep in 4(fp)
;   token in 6(fp)
tokenize:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 0(fp) ; text
  sw a1, 2(fp) ; out
  ; basic/text.e16.ts:222  let i: u16 = 0
  li s1, 0 ; i
  ; basic/text.e16.ts:223  let o: u16 = 0
  li s2, 0 ; o
  ; basic/text.e16.ts:224  rawFrom()
  call rawFrom
  ; basic/text.e16.ts:225  while (peek(text + i) !== 0) {
  j .L3
.L1:
  ; basic/text.e16.ts:226  const c: u8 = peek(text + i)
  lw t0, 0(fp) ; text
  add t0, t0, s1
  lbu s3, 0(t0)
  ; basic/text.e16.ts:228  const keep: bool = kept()
  call kept
  sw a0, 4(fp) ; keep
  ; basic/text.e16.ts:231  if (c >= 0x80 && !keep) fail(E_SYNTAX)
  li t0, 128
  bltu s3, t0, .L5
  lw t0, 4(fp) ; keep
  bnez t0, .L5
  ; basic/text.e16.ts:231  fail(E_SYNTAX)
  li a0, 1
  call fail
.L5:
  ; basic/text.e16.ts:232  const token: u16 = keep || !isLetter(c) ? 0 : keywordAt(text + i)
  lw t0, 4(fp) ; keep
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
  ; basic/text.e16.ts:233  if (token !== 0) {
  lw t0, 6(fp) ; token
  beq t0, zero, .L9
  ; basic/text.e16.ts:234  poke(out + o, token)
  lw t0, 2(fp) ; out
  add t0, t0, s2
  lw t1, 6(fp) ; token
  sb t1, 0(t0)
  ; basic/text.e16.ts:235  i += matchedLength
  lw t0, 0x0100(zero)
  add s1, s1, t0
  ; basic/text.e16.ts:236  afterToken(token)
  lw a0, 6(fp)
  call afterToken
  j .L10
.L9:
  ; basic/text.e16.ts:238  afterChar(c)
  mv a0, s3
  call afterChar
  ; basic/text.e16.ts:239  poke(out + o, keep ? c : upper(c))
  lw t0, 2(fp) ; out
  add t0, t0, s2
  lw t1, 4(fp)
  beqz t1, .L11
  mv t1, s3
  j .L12
.L11:
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s3
  call upper
  lw t0, 0(sp)
  addi sp, sp, 2
  mv t1, a0
.L12:
  sb t1, 0(t0)
  ; basic/text.e16.ts:240  i++
  addi s1, s1, 1
.L10:
  ; basic/text.e16.ts:242  o++
  addi s2, s2, 1
.L3:
  lw t0, 0(fp) ; text
  add t0, t0, s1
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; basic/text.e16.ts:244  poke(out + o, 0)
  lw t0, 2(fp) ; out
  add t0, t0, s2
  sb zero, 0(t0)
  ; basic/text.e16.ts:245  return o + 1
  addi a0, s2, 1
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; basic/text.e16.ts:253 expand(at, out, max) at -O1
;   at in 6(fp)
;   out in 2(fp)
;   max in 4(fp)
;   p in 0(fp)
;   n in s2
;   c in s3
;   w in s1
expand:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s1, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 6(fp) ; at
  sw a1, 2(fp) ; out
  sw a2, 4(fp) ; max
  ; basic/text.e16.ts:254  let p = at
  lw t0, 6(fp) ; at
  sw t0, 0(fp) ; p
  ; basic/text.e16.ts:255  let n: u16 = 0
  li s2, 0 ; n
  ; basic/text.e16.ts:256  rawFrom()
  call rawFrom
  ; basic/text.e16.ts:257  while (peek(p) !== 0) {
  j .L3
.L1:
  ; basic/text.e16.ts:258  const c: u8 = peek(p)
  lw t0, 0(fp) ; p
  lbu s3, 0(t0)
  ; basic/text.e16.ts:259  if (c >= 0x80 && !kept()) {
  li t0, 128
  bltu s3, t0, .L5
  call kept
  bnez a0, .L5
  ; basic/text.e16.ts:260  let w = keywordText(c)
  mv a0, s3
  call keywordText
  mv s1, a0 ; w
  ; basic/text.e16.ts:261  while (w !== 0 && peek(w) !== CH_SPACE && peek(w) !== 0) {
  j .L8
.L6:
  ; basic/text.e16.ts:262  n = give(out, n, max, peek(w))
  lbu t0, 0(s1)
  lw a0, 2(fp)
  mv a1, s2
  lw a2, 4(fp)
  mv a3, t0
  call give
  mv s2, a0 ; n
  ; basic/text.e16.ts:263  w++
  addi s1, s1, 1
.L8:
  beq s1, zero, .L10
  lbu t0, 0(s1)
  li t1, 32
  beq t0, t1, .L10
  lbu t0, 0(s1)
  bne t0, zero, .L6
.L10:
  ; basic/text.e16.ts:265  afterToken(c)
  mv a0, s3
  call afterToken
  j .L11
.L5:
  ; basic/text.e16.ts:267  afterChar(c)
  mv a0, s3
  call afterChar
  ; basic/text.e16.ts:268  n = give(out, n, max, c)
  lw a0, 2(fp)
  mv a1, s2
  lw a2, 4(fp)
  mv a3, s3
  call give
  mv s2, a0 ; n
.L11:
  ; basic/text.e16.ts:270  p++
  lw t0, 0(fp) ; p
  addi t0, t0, 1
  sw t0, 0(fp) ; p
.L3:
  lw t0, 0(fp) ; p
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; basic/text.e16.ts:272  return n
  mv a0, s2
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s1, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; basic/text.e16.ts:276 give(out, n, max, c) at -O1
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
  ; basic/text.e16.ts:277  if (out === 0) {
  bne s2, zero, .L1
  ; basic/text.e16.ts:278  putc(c)
  mv a0, s3
  call putc
  ; basic/text.e16.ts:279  return n + 1
  addi a0, s1, 1
  j .return
.L1:
  ; basic/text.e16.ts:281  if (n >= max) return n
  bltu s1, s0, .L2
  ; basic/text.e16.ts:281  return n
  mv a0, s1
  j .return
.L2:
  ; basic/text.e16.ts:282  poke(out + n, c)
  add t0, s2, s1
  sb s3, 0(t0)
  ; basic/text.e16.ts:283  return n + 1
  addi a0, s1, 1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; basic/text.e16.ts:287 unsignedText(value, out) at -O1
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
  ; basic/text.e16.ts:288  let n: u16 = 0
  li s2, 0 ; n
  ; basic/text.e16.ts:289  if (value >= 10) n = unsignedText(div(value, 10), out)
  li t0, 10
  bltu s1, t0, .L1
  ; basic/text.e16.ts:289  n = unsignedText(div(value, 10), out)
  li t0, 10
  divu a0, s1, t0
  mv a1, s3
  call unsignedText
  mv s2, a0 ; n
.L1:
  ; basic/text.e16.ts:290  poke(out + n, CH_0 + (value % 10))
  add t0, s3, s2
  li t1, 10
  remu t1, s1, t1
  addi t1, t1, 48
  sb t1, 0(t0)
  ; basic/text.e16.ts:291  return n + 1
  addi a0, s2, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; basic/text.e16.ts:295 printUnsigned(value) at -O1
;   value in s1
printUnsigned:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; value
  ; basic/text.e16.ts:296  if (value >= 10) printUnsigned(div(value, 10))
  li t0, 10
  bltu s1, t0, .L1
  ; basic/text.e16.ts:296  printUnsigned(div(value, 10))
  li t0, 10
  divu a0, s1, t0
  call printUnsigned
.L1:
  ; basic/text.e16.ts:297  putc(CH_0 + (value % 10))
  li t0, 10
  remu t0, s1, t0
  addi a0, t0, 48
  call putc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/edit.e16.ts:62 place(at) at -O1
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
  ; basic/edit.e16.ts:63  const cols = peek16(COLS)
  lw s1, 4(zero)
  ; basic/edit.e16.ts:64  const cell = startX + at
  lw t0, 0x0106(zero)
  add s2, t0, s3
  ; basic/edit.e16.ts:65  locate(cell % cols, startY + div(cell, cols))
  remu t0, s2, s1
  lw t1, 0x0108(zero)
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

; basic/edit.e16.ts:73 redraw(buf, length, from, at) at -O1
;   buf in 6(fp)
;   length in s3
;   from in 0(fp)
;   at in 8(fp)
;   k/cols in s1
;   cell in s2
;   expected in 2(fp)
;   now in 4(fp)
redraw:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s3, 12(sp)
  sw s1, 14(sp)
  sw s2, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  sw a0, 6(fp) ; buf
  mv s3, a1 ; length
  sw a2, 0(fp) ; from
  sw a3, 8(fp) ; at
  ; basic/edit.e16.ts:74  place(from)
  lw a0, 0(fp)
  call place
  ; basic/edit.e16.ts:75  for (let k = from; k < length; k++) putc(peek(buf + k))
  lw s1, 0(fp) ; from
  j .L3
.L1:
  ; basic/edit.e16.ts:75  putc(peek(buf + k))
  lw t0, 6(fp) ; buf
  add t0, t0, s1
  lbu a0, 0(t0)
  call putc
  addi s1, s1, 1
.L3:
  bltu s1, s3, .L1
  ; basic/edit.e16.ts:76  putc(CH_SPACE)
  li a0, 32
  call putc
  ; basic/edit.e16.ts:77  const cols = peek16(COLS)
  lw s1, 4(zero)
  ; basic/edit.e16.ts:78  const cell = startX + length + 1
  lw t0, 0x0106(zero)
  add t0, t0, s3
  addi s2, t0, 1
  ; basic/edit.e16.ts:79  const expected = startY + div(cell, cols)
  lw t0, 0x0108(zero)
  divu t1, s2, s1
  add t0, t0, t1
  sw t0, 2(fp) ; expected
  ; basic/edit.e16.ts:81  const now = peek16(CURY)
  lw t0, 2(zero)
  sw t0, 4(fp) ; now
  ; basic/edit.e16.ts:82  if (now < expected) startY -= expected - now
  lw t0, 2(fp) ; expected
  lw t1, 4(fp) ; now
  bgeu t1, t0, .L5
  ; basic/edit.e16.ts:82  startY -= expected - now
  lw t0, 0x0108(zero)
  lw t1, 4(fp) ; now
  lw t2, 2(fp) ; expected
  sub t2, t2, t1
  sub t0, t0, t2
  sw t0, 0x0108(zero)
.L5:
  ; basic/edit.e16.ts:85  clearRest(cell % cols, startY + div(cell, cols))
  remu t0, s2, s1
  lw t1, 0x0108(zero)
  divu t2, s2, s1
  add t1, t1, t2
  mv a0, t0
  mv a1, t1
  call clearRest
  ; basic/edit.e16.ts:86  place(at)
  lw a0, 8(fp)
  call place
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s3, 12(sp)
  lw s1, 14(sp)
  lw s2, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; basic/edit.e16.ts:93 clearRest(col, row) at -O1
;   col in s1
;   row in s3
;   width in 0(fp)
;   at in 2(fp)
;   p in s2
clearRest:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; col
  mv s3, a1 ; row
  ; basic/edit.e16.ts:94  if (col === 0 || col >= peek16(COLS) || row >= peek16(ROWS)) return
  beq s1, zero, .L2
  lw t0, 4(zero)
  bgeu s1, t0, .L2
  lw t0, 6(zero)
  bltu s3, t0, .L1
.L2:
  ; basic/edit.e16.ts:94  return
  j .return
.L1:
  ; basic/edit.e16.ts:95  const width = peek16(WIDTH)
  lw t0, 8(zero)
  sw t0, 0(fp) ; width
  ; basic/edit.e16.ts:96  const at = VRAM + row * width + col * 6
  lw t0, 0(fp) ; width
  mul t0, s3, t0
  slli t2, s1, 2
  slli t1, s1, 1
  add t1, t1, t2
  addi t0, t0, -8192
  add t0, t0, t1
  sw t0, 2(fp) ; at
  ; basic/edit.e16.ts:97  for (let p: u16 = 0; p < peek16(DEPTH); p++) memset(at + p * peek16(PLANE), 0, width - col * 6)
  li s2, 0 ; p
  j .L5
.L3:
  ; basic/edit.e16.ts:97  memset(at + p * peek16(PLANE), 0, width - col * 6)
  lw t0, 10(zero)
  mul t0, s2, t0
  lw t1, 2(fp) ; at
  add t1, t1, t0
  slli t2, s1, 2
  slli t0, s1, 1
  add t0, t0, t2
  lw t2, 0(fp) ; width
  sub t2, t2, t0
  mv a0, t1
  li a1, 0
  mv a2, t2
  mset a0, a1, a2
  addi s2, s2, 1
.L5:
  lw t0, 12(zero)
  bltu s2, t0, .L3
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/edit.e16.ts:109 editLine(buf, max, length, recalls) at -O1
;   buf in s2
;   max in 2(fp)
;   length in s3
;   recalls in 4(fp)
;   k in 0(fp)
;   control in s1
editLine:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; buf
  sw a1, 2(fp) ; max
  mv s3, a2 ; length
  sw a3, 4(fp) ; recalls
  ; basic/edit.e16.ts:110  startX = peek16(CURX)
  lw t0, 0(zero)
  sw t0, 0x0106(zero)
  ; basic/edit.e16.ts:111  startY = peek16(CURY)
  lw t0, 2(zero)
  sw t0, 0x0108(zero)
  ; basic/edit.e16.ts:112  n = length
  sw s3, 0x010a(zero)
  ; basic/edit.e16.ts:113  at = length
  sw s3, 0x010c(zero)
  ; basic/edit.e16.ts:114  redraw(buf, n, 0, at)
  lw t0, 0x010a(zero)
  lw t1, 0x010c(zero)
  mv a0, s2
  mv a1, t0
  li a2, 0
  mv a3, t1
  call redraw
  ; basic/edit.e16.ts:115  poke16(IO_CURMODE, 6)
  li t0, 6
  li t1, 65324
  sw t0, 0(t1)
  ; basic/edit.e16.ts:116  for (;;) {
.L1:
  ; basic/edit.e16.ts:117  const k = getkey()
  call getkey
  sw a0, 0(fp) ; k
  ; basic/edit.e16.ts:118  const control = controlKey(k, recalls)
  lw a0, 0(fp)
  lw a1, 4(fp)
  call controlKey
  mv s1, a0 ; control
  ; basic/edit.e16.ts:119  if (control === 0) {
  bne s1, zero, .L5
  ; basic/edit.e16.ts:120  editKey(buf, max, k)
  mv a0, s2
  lw a1, 2(fp)
  lw a2, 0(fp)
  call editKey
  ; basic/edit.e16.ts:121  continue
  j .L1
.L5:
  ; basic/edit.e16.ts:123  poke16(IO_CURMODE, 0)
  li t0, 65324
  sw zero, 0(t0)
  ; basic/edit.e16.ts:125  place(n)
  lw a0, 0x010a(zero)
  call place
  ; basic/edit.e16.ts:126  if (control === EDIT_CLS) cls()
  li t0, 65535
  bne s1, t0, .L6
  ; basic/edit.e16.ts:126  cls()
  call cls
.L6:
  ; basic/edit.e16.ts:127  if (control !== 1 && control !== EDIT_CLS) rubOut(n)
  li t0, 1
  beq s1, t0, .L7
  li t0, 65535
  beq s1, t0, .L7
  ; basic/edit.e16.ts:127  rubOut(n)
  lw a0, 0x010a(zero)
  call rubOut
.L7:
  ; basic/edit.e16.ts:128  if (control !== 1) return control
  li t0, 1
  beq s1, t0, .L8
  ; basic/edit.e16.ts:128  return control
  mv a0, s1
  j .return
.L8:
  ; basic/edit.e16.ts:129  poke(buf + n, 0)
  lw t0, 0x010a(zero)
  add t0, s2, t0
  sb zero, 0(t0)
  ; basic/edit.e16.ts:130  return i16(n)
  lw a0, 0x010a(zero)
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; basic/edit.e16.ts:139 editKey(buf, max, k) at -O1
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
  ; basic/edit.e16.ts:140  if (k === K_LEFT || k === K_RIGHT) stepCursor(k === K_RIGHT)
  li t0, 28
  beq s1, t0, .L2
  li t0, 29
  bne s1, t0, .L1
.L2:
  ; basic/edit.e16.ts:140  stepCursor(k === K_RIGHT)
  li t0, 29
  sub t0, s1, t0
  seqz a0, t0
  call stepCursor
  j .L3
.L1:
  ; basic/edit.e16.ts:141  if (k === K_BS || k === K_DEL) erase(buf, k === K_BS)
  li t0, 8
  beq s1, t0, .L5
  li t0, 15
  bne s1, t0, .L4
.L5:
  ; basic/edit.e16.ts:141  erase(buf, k === K_BS)
  li t0, 8
  sub t0, s1, t0
  seqz t0, t0
  mv a0, s2
  mv a1, t0
  call erase
  j .L6
.L4:
  ; basic/edit.e16.ts:142  if (k === K_INS && n < max) n = openSpace(buf, n, at)
  li t0, 14
  bne s1, t0, .L7
  lw t0, 0x010a(zero)
  bgeu t0, s3, .L7
  ; basic/edit.e16.ts:142  n = openSpace(buf, n, at)
  lw t0, 0x010a(zero)
  lw t1, 0x010c(zero)
  mv a0, s2
  mv a1, t0
  mv a2, t1
  call openSpace
  sw a0, 0x010a(zero)
  j .L8
.L7:
  ; basic/edit.e16.ts:143  if (k === K_ANS) typeAns(buf, max)
  li t0, 20
  bne s1, t0, .L9
  ; basic/edit.e16.ts:143  typeAns(buf, max)
  mv a0, s2
  mv a1, s3
  call typeAns
  j .L10
.L9:
  ; basic/edit.e16.ts:144  if (k >= CH_SPACE && (at < n || n < max)) write(buf, k)
  li t0, 32
  bltu s1, t0, .L11
  lw t0, 0x010c(zero)
  lw t1, 0x010a(zero)
  bltu t0, t1, .L12
  lw t0, 0x010a(zero)
  bgeu t0, s3, .L11
.L12:
  ; basic/edit.e16.ts:144  write(buf, k)
  mv a0, s2
  mv a1, s1
  call write
.L11:
.L10:
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

; basic/edit.e16.ts:148 typeAns(buf, max) at -O1
;   buf in s1
;   max in s2
typeAns:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; buf
  mv s2, a1 ; max
  ; basic/edit.e16.ts:149  if (at + 3 > max) return
  lw t0, 0x010c(zero)
  addi t0, t0, 3
  bgeu s2, t0, .L1
  ; basic/edit.e16.ts:149  return
  j .return
.L1:
  ; basic/edit.e16.ts:150  write(buf, 0x41)
  mv a0, s1
  li a1, 65
  call write
  ; basic/edit.e16.ts:151  write(buf, 0x4e)
  mv a0, s1
  li a1, 78
  call write
  ; basic/edit.e16.ts:152  write(buf, 0x53)
  mv a0, s1
  li a1, 83
  call write
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/edit.e16.ts:156 stepCursor(right) at -O1
;   right in s1
stepCursor:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; right
  ; basic/edit.e16.ts:157  if (right && at < n) at++
  beqz s1, .L1
  lw t0, 0x010c(zero)
  lw t1, 0x010a(zero)
  bgeu t0, t1, .L1
  ; basic/edit.e16.ts:157  at++
  lw t0, 0x010c(zero)
  addi t0, t0, 1
  sw t0, 0x010c(zero)
.L1:
  ; basic/edit.e16.ts:158  if (!right && at > 0) at--
  bnez s1, .L2
  lw t0, 0x010c(zero)
  bgeu zero, t0, .L2
  ; basic/edit.e16.ts:158  at--
  lw t0, 0x010c(zero)
  addi t0, t0, -1
  sw t0, 0x010c(zero)
.L2:
  ; basic/edit.e16.ts:159  place(at)
  lw a0, 0x010c(zero)
  call place
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/edit.e16.ts:163 erase(buf, before) at -O1
;   buf in s1
;   before in s2
erase:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; buf
  mv s2, a1 ; before
  ; basic/edit.e16.ts:164  if (before) {
  beqz s2, .L1
  ; basic/edit.e16.ts:165  if (at === 0) return
  lw t0, 0x010c(zero)
  bne t0, zero, .L2
  ; basic/edit.e16.ts:165  return
  j .return
.L2:
  ; basic/edit.e16.ts:166  at--
  lw t0, 0x010c(zero)
  addi t0, t0, -1
  sw t0, 0x010c(zero)
  j .L3
.L1:
  ; basic/edit.e16.ts:167  if (at === n) return
  lw t0, 0x010c(zero)
  lw t1, 0x010a(zero)
  bne t0, t1, .L4
  ; basic/edit.e16.ts:167  return
  j .return
.L4:
.L3:
  ; basic/edit.e16.ts:168  n = takeOut(buf, n, at)
  lw t0, 0x010a(zero)
  lw t1, 0x010c(zero)
  mv a0, s1
  mv a1, t0
  mv a2, t1
  call takeOut
  sw a0, 0x010a(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/edit.e16.ts:172 write(buf, k) at -O1
;   buf in s1
;   k in s2
write:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; buf
  mv s2, a1 ; k
  ; basic/edit.e16.ts:173  poke(buf + at, k)
  lw t0, 0x010c(zero)
  add t0, s1, t0
  sb s2, 0(t0)
  ; basic/edit.e16.ts:174  if (at === n) n++
  lw t0, 0x010c(zero)
  lw t1, 0x010a(zero)
  bne t0, t1, .L1
  ; basic/edit.e16.ts:174  n++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
.L1:
  ; basic/edit.e16.ts:175  at++
  lw t0, 0x010c(zero)
  addi t0, t0, 1
  sw t0, 0x010c(zero)
  ; basic/edit.e16.ts:176  redraw(buf, n, at - 1, at)
  lw t0, 0x010a(zero)
  lw t1, 0x010c(zero)
  lw t2, 0x010c(zero)
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

; basic/edit.e16.ts:180 controlKey(k, recalls) at -O1
;   k in a0
;   recalls in a1
controlKey:
  ; basic/edit.e16.ts:181  if (k === K_ENTER) return 1
  li t0, 13
  bne a0, t0, .L1
  ; basic/edit.e16.ts:181  return 1
  li a0, 1
  ret
.L1:
  ; basic/edit.e16.ts:182  if (k === K_CLS) return EDIT_CLS
  li t0, 12
  bne a0, t0, .L2
  ; basic/edit.e16.ts:182  return EDIT_CLS
  li a0, 65535
  ret
.L2:
  ; basic/edit.e16.ts:183  if (k === K_BRK) return EDIT_BRK
  li t0, 3
  bne a0, t0, .L3
  ; basic/edit.e16.ts:183  return EDIT_BRK
  li a0, 65534
  ret
.L3:
  ; basic/edit.e16.ts:184  if (k === K_MODE) return EDIT_MODE
  li t0, 16
  bne a0, t0, .L4
  ; basic/edit.e16.ts:184  return EDIT_MODE
  li a0, 65533
  ret
.L4:
  ; basic/edit.e16.ts:186  if (k === K_UP) return (recalls & EDIT_RECALLS_UP) !== 0 ? EDIT_UP : 0
  li t0, 30
  bne a0, t0, .L5
  ; basic/edit.e16.ts:186  return (recalls & EDIT_RECALLS_UP) !== 0 ? EDIT_UP : 0
  andi t0, a1, 1
  beq t0, zero, .L6
  li t0, 65532
  j .L7
.L6:
  li t0, 0
.L7:
  mv a0, t0
  ret
.L5:
  ; basic/edit.e16.ts:187  if (k === K_DOWN) return (recalls & EDIT_RECALLS_DOWN) !== 0 ? EDIT_DOWN : 0
  li t0, 31
  bne a0, t0, .L8
  ; basic/edit.e16.ts:187  return (recalls & EDIT_RECALLS_DOWN) !== 0 ? EDIT_DOWN : 0
  andi t0, a1, 2
  beq t0, zero, .L9
  li t0, 65531
  j .L10
.L9:
  li t0, 0
.L10:
  mv a0, t0
  ret
.L8:
  ; basic/edit.e16.ts:188  return 0
  li a0, 0
.return:
  ret

; basic/edit.e16.ts:192 rubOut(n) at -O1
;   n in s2
;   k in s1
rubOut:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; n
  ; basic/edit.e16.ts:193  place(0)
  li a0, 0
  call place
  ; basic/edit.e16.ts:194  for (let k: u16 = 0; k < n; k++) putc(CH_SPACE)
  li s1, 0 ; k
  j .L3
.L1:
  ; basic/edit.e16.ts:194  putc(CH_SPACE)
  li a0, 32
  call putc
  addi s1, s1, 1
.L3:
  bltu s1, s2, .L1
  ; basic/edit.e16.ts:195  place(0)
  li a0, 0
  call place
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/edit.e16.ts:199 takeOut(buf, n, at) at -O1
;   buf in s3
;   n in s2
;   at in s1
takeOut:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  mv s3, a0 ; buf
  mv s2, a1 ; n
  mv s1, a2 ; at
  ; basic/edit.e16.ts:200  if (at + 1 < n) memcpy(buf + at, buf + at + 1, n - at - 1)
  addi t0, s1, 1
  bgeu t0, s2, .L1
  ; basic/edit.e16.ts:200  memcpy(buf + at, buf + at + 1, n - at - 1)
  add t0, s3, s1
  add t1, s3, s1
  sub t2, s2, s1
  mv a0, t0
  addi a1, t1, 1
  addi a2, t2, -1
  mcpy a0, a1, a2
.L1:
  ; basic/edit.e16.ts:201  redraw(buf, n - 1, at, at)
  mv a0, s3
  addi a1, s2, -1
  mv a2, s1
  mv a3, s1
  call redraw
  ; basic/edit.e16.ts:202  return n - 1
  addi a0, s2, -1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/edit.e16.ts:206 openSpace(buf, n, at) at -O1
;   buf in s2
;   n in s3
;   at in s1
openSpace:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; buf
  mv s3, a1 ; n
  mv s1, a2 ; at
  ; basic/edit.e16.ts:207  if (n > at) memcpy(buf + at + 1, buf + at, n - at)
  bgeu s1, s3, .L1
  ; basic/edit.e16.ts:207  memcpy(buf + at + 1, buf + at, n - at)
  add t0, s2, s1
  add t1, s2, s1
  sub t2, s3, s1
  addi a0, t0, 1
  mv a1, t1
  mv a2, t2
  mcpy a0, a1, a2
.L1:
  ; basic/edit.e16.ts:208  poke(buf + at, CH_SPACE)
  add t0, s2, s1
  li t1, 32
  sb t1, 0(t0)
  ; basic/edit.e16.ts:209  redraw(buf, n + 1, at, at)
  mv a0, s2
  addi a1, s3, 1
  mv a2, s1
  mv a3, s1
  call redraw
  ; basic/edit.e16.ts:210  return n + 1
  addi a0, s3, 1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:303 setTxt(p) at -O1
;   p in a0
setTxt:
  ; basic/basic.e16.ts:304  txt = p
  sw a0, 0x010e(zero)
.return:
  ret

; basic/basic.e16.ts:308 step() at -O1
step:
  ; basic/basic.e16.ts:309  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.return:
  ret

; basic/basic.e16.ts:312 setNsp(p) at -O1
;   p in a0
setNsp:
  ; basic/basic.e16.ts:313  nsp = p
  sw a0, 0x0116(zero)
.return:
  ret

; basic/basic.e16.ts:316 setStrType(s) at -O1
;   s in a0
setStrType:
  ; basic/basic.e16.ts:317  strType = s
  sw a0, 0x0118(zero)
.return:
  ret

; basic/basic.e16.ts:320 setVarRoom(room) at -O1
;   room in a0
setVarRoom:
  ; basic/basic.e16.ts:321  varRoom = room
  sw a0, 0x011a(zero)
.return:
  ret

; basic/basic.e16.ts:324 setOutFile(n) at -O1
;   n in a0
setOutFile:
  ; basic/basic.e16.ts:325  outFile = n
  sw a0, 0x011c(zero)
.return:
  ret

; basic/basic.e16.ts:328 setData(line, at) at -O1
;   line in a0
;   at in a1
setData:
  ; basic/basic.e16.ts:329  dataLine = line
  sw a0, 0x011e(zero)
  ; basic/basic.e16.ts:330  dataAt = at
  sw a1, 0x0120(zero)
.return:
  ret

; basic/basic.e16.ts:333 setFilesOpen(open) at -O1
;   open in a0
setFilesOpen:
  ; basic/basic.e16.ts:334  filesOpen = open
  sw a0, 0x0122(zero)
.return:
  ret

; basic/basic.e16.ts:337 setTracing(on) at -O1
;   on in a0
setTracing:
  ; basic/basic.e16.ts:338  tracing = on
  sw a0, 0x0124(zero)
.return:
  ret

; basic/basic.e16.ts:341 setAuto(line, by) at -O1
;   line in a0
;   by in a1
setAuto:
  ; basic/basic.e16.ts:342  autoLine = line
  sw a0, 0x0126(zero)
  ; basic/basic.e16.ts:343  autoStep = by
  sw a1, 0x0128(zero)
.return:
  ret

; basic/basic.e16.ts:346 setVarEnd(at) at -O1
;   at in a0
setVarEnd:
  ; basic/basic.e16.ts:347  varEnd = at
  sw a0, 0x0114(zero)
.return:
  ret

; basic/basic.e16.ts:352 errorWord(code) at -O1
;   code in s1
errorWord:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; code
  ; basic/basic.e16.ts:353  switch (code) {
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
  li t0, 8
  beq s1, t0, .L9
  li t0, 9
  beq s1, t0, .L10
  li t0, 10
  beq s1, t0, .L11
  j .L12
.L2:
  ; basic/basic.e16.ts:355  return str('SYNTAX')
  la a0, str_3
  j .return
.L3:
  ; basic/basic.e16.ts:357  return str('OVERFLOW')
  la a0, str_4
  j .return
.L4:
  ; basic/basic.e16.ts:359  return str('DIV BY 0')
  la a0, str_5
  j .return
.L5:
  ; basic/basic.e16.ts:361  return str('ARGUMENT')
  la a0, str_6
  j .return
.L6:
  ; basic/basic.e16.ts:363  return str('NO LINE')
  la a0, str_7
  j .return
.L7:
  ; basic/basic.e16.ts:365  return str('NEXT')
  la a0, str_8
  j .return
.L8:
  ; basic/basic.e16.ts:367  return str('RETURN')
  la a0, str_9
  j .return
.L9:
  ; basic/basic.e16.ts:369  return str('MEMORY')
  la a0, str_10
  j .return
.L10:
  ; basic/basic.e16.ts:371  return str('TOO COMPLEX')
  la a0, str_11
  j .return
.L11:
  ; basic/basic.e16.ts:373  return str('CONT')
  la a0, str_12
  j .return
.L12:
  ; basic/basic.e16.ts:375  return moreErrorWord(code)
  mv a0, s1
  call moreErrorWord
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:379 moreErrorWord(code) at -O1
;   code in a0
moreErrorWord:
  ; basic/basic.e16.ts:380  switch (code) {
  li t0, 11
  beq a0, t0, .L2
  li t0, 12
  beq a0, t0, .L3
  li t0, 13
  beq a0, t0, .L4
  li t0, 14
  beq a0, t0, .L5
  li t0, 15
  beq a0, t0, .L6
  li t0, 16
  beq a0, t0, .L7
  li t0, 18
  beq a0, t0, .L8
  li t0, 19
  beq a0, t0, .L9
  li t0, 20
  beq a0, t0, .L10
  li t0, 21
  beq a0, t0, .L11
  j .L12
.L2:
  ; basic/basic.e16.ts:382  return str('TYPE')
  la a0, str_13
  ret
.L3:
  ; basic/basic.e16.ts:384  return str('NO FILE')
  la a0, str_14
  ret
.L4:
  ; basic/basic.e16.ts:386  return str('CARD')
  la a0, str_15
  ret
.L5:
  ; basic/basic.e16.ts:388  return str('NO DATA')
  la a0, str_16
  ret
.L6:
  ; basic/basic.e16.ts:390  return str('INDEX')
  la a0, str_17
  ret
.L7:
  ; basic/basic.e16.ts:392  return str('DIM')
  la a0, str_18
  ret
.L8:
  ; basic/basic.e16.ts:394  return str('LINK')
  la a0, str_19
  ret
.L9:
  ; basic/basic.e16.ts:396  return str('LINK OFF')
  la a0, str_20
  ret
.L10:
  ; basic/basic.e16.ts:398  return str('LINK HELD')
  la a0, str_21
  ret
.L11:
  ; basic/basic.e16.ts:400  return str('TOO LONG')
  la a0, str_22
  ret
.L12:
  ; basic/basic.e16.ts:402  return str('FILE')
  la a0, str_23
.return:
  ret

; basic/basic.e16.ts:407 inLine() at -O1
inLine:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:408  if (curLine === 0) return
  lw t0, 0x0110(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:408  return
  j .return
.L1:
  ; basic/basic.e16.ts:409  puts(str(' IN '))
  la a0, str_24
  call puts
  ; basic/basic.e16.ts:410  printUnsigned(peek16(curLine))
  lw t0, 0x0110(zero)
  lw a0, 0(t0)
  call printUnsigned
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:414 fail(code) at -O1
;   code in s1
fail:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; code
  ; basic/basic.e16.ts:415  failIn(code, running && curLine !== 0 ? peek16(curLine) : 0)
  lw t1, 0x012e(zero)
  mv t0, s1
  beqz t1, .L1
  lw t1, 0x0110(zero)
  li t2, 0
  beq t1, t2, .L1
  lw t1, 0x0110(zero)
  lw t1, 0(t1)
  j .L2
.L1:
  li t1, 0
.L2:
  mv a0, t0
  mv a1, t1
  call failIn
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:419 failIn(code, n) at -O1
;   code in s2
;   n in s1
failIn:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; code
  mv s1, a1 ; n
  ; basic/basic.e16.ts:420  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:421  puts(str('ERR:'))
  la a0, str_25
  call puts
  ; basic/basic.e16.ts:422  puts(errorWord(code))
  mv a0, s2
  call errorWord
  call puts
  ; basic/basic.e16.ts:423  if (n !== 0) {
  beq s1, zero, .L1
  ; basic/basic.e16.ts:424  puts(str(' IN '))
  la a0, str_24
  call puts
  ; basic/basic.e16.ts:425  printUnsigned(n)
  mv a0, s1
  call printUnsigned
.L1:
  ; basic/basic.e16.ts:427  newline()
  call newline
  ; basic/basic.e16.ts:428  contLine = 0
  sw zero, 0x0130(zero)
  ; basic/basic.e16.ts:429  stopRunning()
  call stopRunning
  ; basic/basic.e16.ts:430  basic_abort()
  call basic_abort
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:434 checkBreak() at -O1
checkBreak:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:435  if (peek16(BRKFLAG) === 0) return
  lw t0, 30(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:435  return
  j .return
.L1:
  ; basic/basic.e16.ts:436  poke16(BRKFLAG, 0)
  sw zero, 30(zero)
  ; basic/basic.e16.ts:437  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:438  puts(str('BREAK'))
  la a0, str_26
  call puts
  ; basic/basic.e16.ts:439  if (running) inLine()
  lw t0, 0x012e(zero)
  beqz t0, .L2
  ; basic/basic.e16.ts:439  inLine()
  call inLine
.L2:
  ; basic/basic.e16.ts:440  newline()
  call newline
  ; basic/basic.e16.ts:441  contLine = curLine
  lw t0, 0x0110(zero)
  sw t0, 0x0130(zero)
  ; basic/basic.e16.ts:442  contTxt = txt
  lw t0, 0x010e(zero)
  sw t0, 0x0132(zero)
  ; basic/basic.e16.ts:443  stopRunning()
  call stopRunning
  ; basic/basic.e16.ts:444  basic_abort()
  call basic_abort
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:447 marks() at -O1
;   m in s1
marks:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:448  let m: u16 = proMode ? ANN_PRO : ANN_RUN
  lw t0, 0x013a(zero)
  beqz t0, .L1
  li t0, 32
  j .L2
.L1:
  li t0, 16
.L2:
  mv s1, t0 ; m
  ; basic/basic.e16.ts:449  m |= angleMarks
  lw t0, 0x013c(zero)
  or s1, s1, t0
  ; basic/basic.e16.ts:450  if (running) m |= ANN_BUSY
  lw t0, 0x012e(zero)
  beqz t0, .L3
  ; basic/basic.e16.ts:450  m |= ANN_BUSY
  ori s1, s1, 1
.L3:
  ; basic/basic.e16.ts:451  poke16(ANNMODE, m)
  sw s1, 26(zero)
  ; basic/basic.e16.ts:452  annunciate()
  call annunciate
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:455 stopRunning() at -O1
stopRunning:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:456  running = false
  sw zero, 0x012e(zero)
  ; basic/basic.e16.ts:457  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:458  outFile = 0
  sw zero, 0x011c(zero)
  ; basic/basic.e16.ts:460  if (filesOpen) closeFiles()
  lw t0, 0x0122(zero)
  beqz t0, .L1
  ; basic/basic.e16.ts:460  closeFiles()
  la t0, closeFiles
  li t1, 2
  call far_call
.L1:
  ; basic/basic.e16.ts:461  marks()
  call marks
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:467 next() at -O1
next:
  ; basic/basic.e16.ts:468  while (peek(txt) === CH_SPACE) txt++
  j .L3
.L1:
  ; basic/basic.e16.ts:468  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.L3:
  lw t0, 0x010e(zero)
  lbu t0, 0(t0)
  li t1, 32
  beq t0, t1, .L1
  ; basic/basic.e16.ts:469  return peek(txt)
  lw t0, 0x010e(zero)
  lbu a0, 0(t0)
.return:
  ret

; basic/basic.e16.ts:472 expect(c) at -O1
;   c in s1
expect:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/basic.e16.ts:473  if (next() !== c) fail(E_SYNTAX)
  call next
  beq a0, s1, .L1
  ; basic/basic.e16.ts:473  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:474  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:477 isDigit(c) at -O1
;   c in a0
isDigit:
  ; basic/basic.e16.ts:478  return c >= CH_0 && c <= CH_9
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

; basic/basic.e16.ts:482 readUnsigned() at -O1
;   v in s1
readUnsigned:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:483  next()
  call next
  ; basic/basic.e16.ts:484  if (!isDigit(peek(txt))) fail(E_SYNTAX)
  lw t0, 0x010e(zero)
  lbu a0, 0(t0)
  call isDigit
  bnez a0, .L1
  ; basic/basic.e16.ts:484  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:485  let v: u16 = 0
  li s1, 0 ; v
  ; basic/basic.e16.ts:486  while (isDigit(peek(txt))) {
  j .L4
.L2:
  ; basic/basic.e16.ts:487  v = moreDigit(v, peek(txt) - CH_0)
  lw t0, 0x010e(zero)
  lbu t0, 0(t0)
  mv a0, s1
  addi a1, t0, -48
  call moreDigit
  mv s1, a0 ; v
  ; basic/basic.e16.ts:488  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.L4:
  lw t0, 0x010e(zero)
  lbu a0, 0(t0)
  call isDigit
  bnez a0, .L2
  ; basic/basic.e16.ts:490  return v
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:494 moreDigit(v, d) at -O1
;   v in s1
;   d in s2
moreDigit:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; v
  mv s2, a1 ; d
  ; basic/basic.e16.ts:495  if (v > 6553 || (v === 6553 && d > 5)) fail(E_LINE)
  li t0, 6553
  bltu t0, s1, .L2
  li t0, 6553
  bne s1, t0, .L1
  li t0, 5
  bgeu t0, s2, .L1
.L2:
  ; basic/basic.e16.ts:495  fail(E_LINE)
  li a0, 5
  call fail
.L1:
  ; basic/basic.e16.ts:496  return v * 10 + d
  slli t1, s1, 3
  slli t0, s1, 1
  add t0, t0, t1
  add a0, t0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:502 math(op, a, b) at -O1
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
  ; basic/basic.e16.ts:503  poke16(MATH_A, a)
  li t0, 65362
  sw s3, 0(t0)
  ; basic/basic.e16.ts:504  poke16(MATH_B, b)
  li t0, 65364
  sw s0, 0(t0)
  ; basic/basic.e16.ts:505  poke16(MATH_OP, op)
  li t0, 65360
  sw s2, 0(t0)
  ; basic/basic.e16.ts:506  const status = peek16(MATH_STATUS)
  li t0, 65368
  lw s1, 0(t0)
  ; basic/basic.e16.ts:507  if (status === 0) return
  bne s1, zero, .L1
  ; basic/basic.e16.ts:507  return
  j .return
.L1:
  ; basic/basic.e16.ts:508  if (status === 1) fail(E_OVERFLOW)
  li t0, 1
  bne s1, t0, .L2
  ; basic/basic.e16.ts:508  fail(E_OVERFLOW)
  li a0, 2
  call fail
.L2:
  ; basic/basic.e16.ts:509  if (status === 2) fail(E_DIVIDE)
  li t0, 2
  bne s1, t0, .L3
  ; basic/basic.e16.ts:509  fail(E_DIVIDE)
  li a0, 3
  call fail
.L3:
  ; basic/basic.e16.ts:510  fail(E_ARGUMENT)
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

; basic/basic.e16.ts:514 push() at -O1
;   at in s1
push:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:515  if (nsp >= addr(nums) + 192) fail(E_COMPLEX)
  lw t0, 0x0116(zero)
  li t1, nums+192
  bltu t0, t1, .L1
  ; basic/basic.e16.ts:515  fail(E_COMPLEX)
  li a0, 9
  call fail
.L1:
  ; basic/basic.e16.ts:516  const at = nsp
  lw s1, 0x0116(zero)
  ; basic/basic.e16.ts:517  nsp += 8
  lw t0, 0x0116(zero)
  addi t0, t0, 8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:518  return at
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:521 top() at -O1
top:
  ; basic/basic.e16.ts:522  return nsp - 8
  lw t0, 0x0116(zero)
  addi a0, t0, -8
.return:
  ret

; basic/basic.e16.ts:525 copy8(from, to) at -O1
;   from in a0
;   to in a1
copy8:
  ; basic/basic.e16.ts:526  poke16(to, peek16(from))
  lw t0, 0(a0)
  sw t0, 0(a1)
  ; basic/basic.e16.ts:527  poke16(to + 2, peek16(from + 2))
  lw t0, 2(a0)
  sw t0, 2(a1)
  ; basic/basic.e16.ts:528  poke16(to + 4, peek16(from + 4))
  lw t0, 4(a0)
  sw t0, 4(a1)
  ; basic/basic.e16.ts:529  poke16(to + 6, peek16(from + 6))
  lw t0, 6(a0)
  sw t0, 6(a1)
.return:
  ret

; basic/basic.e16.ts:532 isZero(at) at -O1
;   at in a0
isZero:
  ; basic/basic.e16.ts:533  return peek(at + 2) === 0
  lbu t0, 2(a0)
  sub t0, t0, zero
  seqz a0, t0
.return:
  ret

; basic/basic.e16.ts:536 setInt(at, v) at -O1
;   at in s1
;   v in s2
setInt:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; at
  mv s2, a1 ; v
  ; basic/basic.e16.ts:537  poke16(MATH_ARG, u16(v))
  li t0, 65366
  sw s2, 0(t0)
  ; basic/basic.e16.ts:538  math(M_FROMINT, at, 0)
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

; basic/basic.e16.ts:542 toInt(at) at -O1
;   at in s1
toInt:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; basic/basic.e16.ts:543  math(M_TOINT, at, 0)
  li a0, 49
  mv a1, s1
  li a2, 0
  call math
  ; basic/basic.e16.ts:544  return i16(peek16(MATH_ARG))
  li t0, 65366
  lw a0, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:548 toWord(at) at -O1
;   at in s1
toWord:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; basic/basic.e16.ts:549  math(M_TOWORD, at, 0)
  li a0, 50
  mv a1, s1
  li a2, 0
  call math
  ; basic/basic.e16.ts:550  return peek16(MATH_ARG)
  li t0, 65366
  lw a0, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:554 binary(op) at -O1
;   op in s1
;   b in s2
binary:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; op
  ; basic/basic.e16.ts:555  const b = top()
  call top
  mv s2, a0 ; b
  ; basic/basic.e16.ts:556  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:557  math(op, top(), b)
  call top
  mv a1, a0
  mv a0, s1
  mv a2, s2
  call math
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:561 pushString(at, length) at -O1
;   at in s2
;   length in s3
;   e in s1
pushString:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; at
  mv s3, a1 ; length
  ; basic/basic.e16.ts:562  const e = push()
  call push
  mv s1, a0 ; e
  ; basic/basic.e16.ts:563  poke(e, STR_MARK)
  li t0, 255
  sb t0, 0(s1)
  ; basic/basic.e16.ts:564  poke(e + 1, length)
  sb s3, 1(s1)
  ; basic/basic.e16.ts:565  poke16(e + 2, at)
  sw s2, 2(s1)
  ; basic/basic.e16.ts:566  strType = true
  li t0, 1
  sw t0, 0x0118(zero)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:569 stringLength(e) at -O1
;   e in a0
stringLength:
  ; basic/basic.e16.ts:570  return peek(e + 1)
  lbu a0, 1(a0)
.return:
  ret

; basic/basic.e16.ts:573 stringAt(e) at -O1
;   e in a0
stringAt:
  ; basic/basic.e16.ts:574  return peek16(e + 2)
  lw a0, 2(a0)
.return:
  ret

; basic/basic.e16.ts:578 tempString(length) at -O1
;   length in s1
;   at in s2
tempString:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; length
  ; basic/basic.e16.ts:579  if (strTop + length > 512) fail(E_COMPLEX)
  lw t0, 0x04f4(zero)
  add t0, t0, s1
  li t1, 512
  bgeu t1, t0, .L1
  ; basic/basic.e16.ts:579  fail(E_COMPLEX)
  li a0, 9
  call fail
.L1:
  ; basic/basic.e16.ts:580  const at = addr(strTemp) + strTop
  lw t0, 0x04f4(zero)
  addi s2, t0, strTemp
  ; basic/basic.e16.ts:581  strTop += length
  lw t0, 0x04f4(zero)
  add t0, t0, s1
  sw t0, 0x04f4(zero)
  ; basic/basic.e16.ts:582  return at
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:586 needNumber() at -O1
needNumber:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:587  if (strType) fail(E_TYPE)
  lw t0, 0x0118(zero)
  beqz t0, .L1
  ; basic/basic.e16.ts:587  fail(E_TYPE)
  li a0, 11
  call fail
.L1:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:590 needString() at -O1
needString:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:591  if (!strType) fail(E_TYPE)
  lw t0, 0x0118(zero)
  bnez t0, .L1
  ; basic/basic.e16.ts:591  fail(E_TYPE)
  li a0, 11
  call fail
.L1:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:595 literal() at -O1
;   at in s2
;   n in s1
literal:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; basic/basic.e16.ts:596  strType = false
  sw zero, 0x0118(zero)
  ; basic/basic.e16.ts:597  const at = push()
  call push
  mv s2, a0 ; at
  ; basic/basic.e16.ts:599  poke16(MATH_ARG, 255)
  li t0, 255
  li t1, 65366
  sw t0, 0(t1)
  ; basic/basic.e16.ts:600  math(M_PARSE, at, txt)
  lw t0, 0x010e(zero)
  li a0, 56
  mv a1, s2
  mv a2, t0
  call math
  ; basic/basic.e16.ts:601  const n = peek16(MATH_ARG)
  li t0, 65366
  lw s1, 0(t0)
  ; basic/basic.e16.ts:602  if (n === 0) fail(E_SYNTAX)
  bne s1, zero, .L1
  ; basic/basic.e16.ts:602  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:603  txt += n
  lw t0, 0x010e(zero)
  add t0, t0, s1
  sw t0, 0x010e(zero)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:607 formatTop() at -O1
;   n in s1
formatTop:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:608  poke16(MATH_ARG, 0)
  li t0, 65366
  sw zero, 0(t0)
  ; basic/basic.e16.ts:609  math(M_FORMAT, top(), addr(textOut))
  call top
  mv a1, a0
  li a0, 57
  la a2, textOut
  call math
  ; basic/basic.e16.ts:610  const n = peek16(MATH_ARG)
  li t0, 65366
  lw s1, 0(t0)
  ; basic/basic.e16.ts:611  poke(addr(textOut) + n, 0)
  sb zero, textOut(s1)
  ; basic/basic.e16.ts:612  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:623 nameKey() at -O1
nameKey:
  ; basic/basic.e16.ts:624  return name0 | (name1 << 8) | (nameIsString ? 0x8000 : 0)
  lw t0, 0x0616(zero)
  lw t1, 0x0618(zero)
  slli t1, t1, 8
  or t0, t0, t1
  lw t1, 0x061a(zero)
  beqz t1, .L1
  li t1, 32768
  j .L2
.L1:
  li t1, 0
.L2:
  or a0, t0, t1
.return:
  ret

; basic/basic.e16.ts:627 setNameKey(key) at -O1
;   key in a0
setNameKey:
  ; basic/basic.e16.ts:628  name0 = key & 0xff
  andi t0, a0, 255
  sw t0, 0x0616(zero)
  ; basic/basic.e16.ts:629  name1 = (key >> 8) & 0x7f
  srli t0, a0, 8
  andi t0, t0, 127
  sw t0, 0x0618(zero)
  ; basic/basic.e16.ts:630  nameIsString = (key & 0x8000) !== 0
  li t0, 32768
  and t0, a0, t0
  sub t0, t0, zero
  snez t0, t0
  sw t0, 0x061a(zero)
.return:
  ret

; basic/basic.e16.ts:634 readName() at -O1
readName:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:635  next()
  call next
  ; basic/basic.e16.ts:636  name0 = peek(txt)
  lw t0, 0x010e(zero)
  lbu t0, 0(t0)
  sw t0, 0x0616(zero)
  ; basic/basic.e16.ts:637  if (!isLetter(name0)) fail(E_SYNTAX)
  mv a0, t0
  call isLetter
  bnez a0, .L1
  ; basic/basic.e16.ts:637  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:638  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:639  name1 = peek(txt)
  lbu t0, 0(t0)
  sw t0, 0x0618(zero)
  ; basic/basic.e16.ts:640  if (isLetter(name1) || isDigit(name1)) txt++
  mv a0, t0
  call isLetter
  bnez a0, .L3
  lw a0, 0x0618(zero)
  call isDigit
  beqz a0, .L2
.L3:
  ; basic/basic.e16.ts:640  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  j .L4
.L2:
  ; basic/basic.e16.ts:641  name1 = 0
  sw zero, 0x0618(zero)
.L4:
  ; basic/basic.e16.ts:642  nameIsString = peek(txt) === CH_DOLLAR
  lw t0, 0x010e(zero)
  lbu t0, 0(t0)
  li t1, 36
  sub t0, t0, t1
  seqz t0, t0
  sw t0, 0x061a(zero)
  ; basic/basic.e16.ts:643  if (nameIsString) txt++
  beqz t0, .L5
  ; basic/basic.e16.ts:643  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.L5:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:647 findRecord(kind) at -O1
;   kind in a0
;   at in a1
findRecord:
  ; basic/basic.e16.ts:648  let at = progEnd + 2
  lw t0, 0x0112(zero)
  addi a1, t0, 2
  ; basic/basic.e16.ts:649  while (at < varEnd) {
  j .L3
.L1:
  ; basic/basic.e16.ts:650  if (peek(at) === name0 && peek(at + 1) === name1 && (peek(at + 2) & 3) === (kind & 3)) return at
  lbu t0, 0(a1)
  lw t1, 0x0616(zero)
  bne t0, t1, .L5
  lbu t0, 1(a1)
  lw t1, 0x0618(zero)
  bne t0, t1, .L5
  lbu t0, 2(a1)
  andi t0, t0, 3
  andi t1, a0, 3
  bne t0, t1, .L5
  ; basic/basic.e16.ts:650  return at
  mv a0, a1
  ret
.L5:
  ; basic/basic.e16.ts:651  at += peek16(at + 4)
  lw t0, 4(a1)
  add a1, a1, t0
.L3:
  lw t0, 0x0114(zero)
  bltu a1, t0, .L1
  ; basic/basic.e16.ts:653  return 0
  li a0, 0
.return:
  ret

; basic/basic.e16.ts:657 newRecord(kind, room, size) at -O1
;   kind in 0(fp)
;   room in 2(fp)
;   size in s2
;   at in s1
;   k in s3
newRecord:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  sw a0, 0(fp) ; kind
  sw a1, 2(fp) ; room
  mv s2, a2 ; size
  ; basic/basic.e16.ts:658  if (size > LIMIT - varEnd) fail(E_MEMORY)
  lw t0, 0x0114(zero)
  li t1, 28672
  sub t1, t1, t0
  bgeu t1, s2, .L1
  ; basic/basic.e16.ts:658  fail(E_MEMORY)
  li a0, 8
  call fail
.L1:
  ; basic/basic.e16.ts:659  const at = varEnd
  lw s1, 0x0114(zero)
  ; basic/basic.e16.ts:660  poke(at, name0)
  lw t0, 0x0616(zero)
  sb t0, 0(s1)
  ; basic/basic.e16.ts:661  poke(at + 1, name1)
  lw t0, 0x0618(zero)
  sb t0, 1(s1)
  ; basic/basic.e16.ts:662  poke(at + 2, kind)
  lw t0, 0(fp) ; kind
  sb t0, 2(s1)
  ; basic/basic.e16.ts:663  poke(at + 3, room)
  lw t0, 2(fp) ; room
  sb t0, 3(s1)
  ; basic/basic.e16.ts:664  poke16(at + 4, size)
  sw s2, 4(s1)
  ; basic/basic.e16.ts:665  for (let k: u16 = VAR_HEAD; k < size; k += 2) poke16(at + k, 0)
  li s3, 6 ; k
  j .L4
.L2:
  ; basic/basic.e16.ts:665  poke16(at + k, 0)
  add t0, s1, s3
  sw zero, 0(t0)
  addi s3, s3, 2
.L4:
  bltu s3, s2, .L2
  ; basic/basic.e16.ts:666  varEnd += size
  lw t0, 0x0114(zero)
  add t0, t0, s2
  sw t0, 0x0114(zero)
  ; basic/basic.e16.ts:667  return at
  mv a0, s1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/basic.e16.ts:671 stringSize(room) at -O1
;   room in a0
stringSize:
  ; basic/basic.e16.ts:672  return (VAR_HEAD + 1 + room + 1) & 0xfffe
  addi t0, a0, 8
  andi a0, t0, -2
.return:
  ret

; basic/basic.e16.ts:679 varAt(make) at -O1
;   make in s3
;   kind in s2
;   at in s1
varAt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  mv s3, a0 ; make
  ; basic/basic.e16.ts:680  readName()
  call readName
  ; basic/basic.e16.ts:681  strType = nameIsString
  lw t0, 0x061a(zero)
  sw t0, 0x0118(zero)
  ; basic/basic.e16.ts:682  if (next() === CH_LPAREN) return elementAt()
  call next
  li t0, 40
  bne a0, t0, .L1
  ; basic/basic.e16.ts:682  return elementAt()
  la t0, elementAt
  li t1, 0
  call far_call
  j .return
.L1:
  ; basic/basic.e16.ts:683  const kind: u16 = nameIsString ? K_STRING : 0
  lw t0, 0x061a(zero)
  beqz t0, .L2
  li t0, 1
  j .L3
.L2:
  li t0, 0
.L3:
  mv s2, t0 ; kind
  ; basic/basic.e16.ts:684  let at = findRecord(kind)
  mv a0, s2
  call findRecord
  mv s1, a0 ; at
  ; basic/basic.e16.ts:685  if (at === 0) {
  bne s1, zero, .L4
  ; basic/basic.e16.ts:686  if (!make) return 0
  bnez s3, .L5
  ; basic/basic.e16.ts:686  return 0
  li a0, 0
  j .return
.L5:
  ; basic/basic.e16.ts:687  at = nameIsString
  lw t0, 0x061a(zero)
  beqz t0, .L6
  mv a0, s2
  li a1, 16
  li a2, 24
  call newRecord
  mv t0, a0
  j .L7
.L6:
  mv a0, s2
  li a1, 0
  li a2, 14
  call newRecord
  mv t0, a0
.L7:
  mv s1, t0 ; at
.L4:
  ; basic/basic.e16.ts:691  varRoom = peek(at + 3)
  lbu t0, 3(s1)
  sw t0, 0x011a(zero)
  ; basic/basic.e16.ts:692  return at + VAR_HEAD
  addi a0, s1, 6
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:696 storeString(at, room) at -O1
;   at in s2
;   room in s3
;   e in s0
;   n in s1
storeString:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; at
  mv s3, a1 ; room
  ; basic/basic.e16.ts:697  const e = top()
  call top
  mv s0, a0 ; e
  ; basic/basic.e16.ts:698  let n = stringLength(e)
  mv a0, s0
  call stringLength
  mv s1, a0 ; n
  ; basic/basic.e16.ts:699  if (n > room) n = room
  bgeu s3, s1, .L1
  ; basic/basic.e16.ts:699  n = room
  mv s1, s3 ; n
.L1:
  ; basic/basic.e16.ts:700  move(stringAt(e), at + 1, n)
  mv a0, s0
  call stringAt
  addi a1, s2, 1
  mv a2, s1
  call move
  ; basic/basic.e16.ts:701  poke(at, n)
  sb s1, 0(s2)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:704 clearVariables() at -O1
clearVariables:
  ; basic/basic.e16.ts:706  poke16(LINK_CMD, LINK_CANCEL)
  li t0, 3
  li t1, 65392
  sw t0, 0(t1)
  ; basic/basic.e16.ts:707  varEnd = progEnd + 2
  lw t0, 0x0112(zero)
  addi t0, t0, 2
  sw t0, 0x0114(zero)
  ; basic/basic.e16.ts:708  fsp = 0
  sw zero, 0x012a(zero)
  ; basic/basic.e16.ts:709  gsp = 0
  sw zero, 0x012c(zero)
  ; basic/basic.e16.ts:710  dataLine = 0
  sw zero, 0x011e(zero)
  ; basic/basic.e16.ts:711  dataAt = 0
  sw zero, 0x0120(zero)
.return:
  ret

; basic/basic.e16.ts:717 expr() at -O1
expr:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:719  if (stack_room() < EXPR_STACK) fail(E_COMPLEX)
  call stack_room
  li t0, 256
  bgeu a0, t0, .L1
  ; basic/basic.e16.ts:719  fail(E_COMPLEX)
  li a0, 9
  call fail
.L1:
  ; basic/basic.e16.ts:720  andExpr()
  call andExpr
  ; basic/basic.e16.ts:721  while (next() === T_OR) {
  j .L4
.L2:
  ; basic/basic.e16.ts:722  needNumber()
  call needNumber
  ; basic/basic.e16.ts:723  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:724  andExpr()
  call andExpr
  ; basic/basic.e16.ts:725  logical(false)
  li a0, 0
  call logical
.L4:
  call next
  li t0, 200
  beq a0, t0, .L2
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:729 andExpr() at -O1
andExpr:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:730  notExpr()
  call notExpr
  ; basic/basic.e16.ts:731  while (next() === T_AND) {
  j .L3
.L1:
  ; basic/basic.e16.ts:732  needNumber()
  call needNumber
  ; basic/basic.e16.ts:733  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:734  notExpr()
  call notExpr
  ; basic/basic.e16.ts:735  logical(true)
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

; basic/basic.e16.ts:740 logical(both) at -O1
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
  ; basic/basic.e16.ts:741  needNumber()
  call needNumber
  ; basic/basic.e16.ts:742  const b = !isZero(top())
  call top
  call isZero
  seqz s1, a0
  ; basic/basic.e16.ts:743  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:744  const a = !isZero(top())
  call top
  call isZero
  seqz s2, a0
  ; basic/basic.e16.ts:745  setInt(top(), (both ? a && b : a || b) ? 1 : 0)
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

; basic/basic.e16.ts:748 notExpr() at -O1
notExpr:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:749  if (next() === T_NOT) {
  call next
  li t0, 198
  bne a0, t0, .L1
  ; basic/basic.e16.ts:750  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:751  notExpr()
  call notExpr
  ; basic/basic.e16.ts:752  needNumber()
  call needNumber
  ; basic/basic.e16.ts:753  setInt(top(), isZero(top()) ? 1 : 0)
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
  ; basic/basic.e16.ts:754  return
  j .return
.L1:
  ; basic/basic.e16.ts:756  compare()
  call compare
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:760 compare() at -O1
;   want in s1
;   strings in s2
;   r in s3
;   got in s0
compare:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  ; basic/basic.e16.ts:761  addExpr()
  call addExpr
  ; basic/basic.e16.ts:762  const want = relation()
  call relation
  mv s1, a0 ; want
  ; basic/basic.e16.ts:763  if (want === 0) return
  bne s1, zero, .L1
  ; basic/basic.e16.ts:763  return
  j .return
.L1:
  ; basic/basic.e16.ts:764  const strings = strType
  lw s2, 0x0118(zero)
  ; basic/basic.e16.ts:765  addExpr()
  call addExpr
  ; basic/basic.e16.ts:766  if (strType !== strings) fail(E_TYPE)
  lw t0, 0x0118(zero)
  beq t0, s2, .L2
  ; basic/basic.e16.ts:766  fail(E_TYPE)
  li a0, 11
  call fail
.L2:
  ; basic/basic.e16.ts:767  const r = strings ? compareStrings() : compareNumbers()
  beqz s2, .L3
  la t0, compareStrings
  li t1, 0
  call far_call
  mv t0, a0
  j .L4
.L3:
  call compareNumbers
  mv t0, a0
.L4:
  mv s3, t0 ; r
  ; basic/basic.e16.ts:768  const got: u16 = r === 0xffff ? 1 : r === 0 ? 2 : 4
  li t0, 65535
  bne s3, t0, .L5
  li t0, 1
  j .L6
.L5:
  bne s3, zero, .L7
  li t0, 2
  j .L8
.L7:
  li t0, 4
.L8:
.L6:
  mv s0, t0 ; got
  ; basic/basic.e16.ts:769  setInt(top(), (want & got) !== 0 ? 1 : 0)
  call top
  and t1, s1, s0
  mv t0, a0
  li t2, 0
  beq t1, t2, .L9
  li t1, 1
  j .L10
.L9:
  li t1, 0
.L10:
  mv a0, t0
  mv a1, t1
  call setInt
  ; basic/basic.e16.ts:770  strType = false
  sw zero, 0x0118(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:774 relation() at -O1
;   c in s1
;   want in s2
;   d in s3
relation:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/basic.e16.ts:775  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:776  if (c !== CH_LT && c !== CH_EQ && c !== CH_GT) return 0
  li t0, 60
  beq s1, t0, .L1
  li t0, 61
  beq s1, t0, .L1
  li t0, 62
  beq s1, t0, .L1
  ; basic/basic.e16.ts:776  return 0
  li a0, 0
  j .return
.L1:
  ; basic/basic.e16.ts:777  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:778  let want: u16 = c === CH_LT ? 1 : c === CH_EQ ? 2 : 4
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
  ; basic/basic.e16.ts:779  const d = peek(txt)
  lw t0, 0x010e(zero)
  lbu s3, 0(t0)
  ; basic/basic.e16.ts:780  if (c !== CH_EQ && (d === CH_EQ || (c === CH_LT && d === CH_GT))) {
  li t0, 61
  beq s1, t0, .L6
  li t0, 61
  beq s3, t0, .L7
  li t0, 60
  bne s1, t0, .L6
  li t0, 62
  bne s3, t0, .L6
.L7:
  ; basic/basic.e16.ts:781  want |= d === CH_EQ ? 2 : 4
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
  ; basic/basic.e16.ts:782  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.L6:
  ; basic/basic.e16.ts:784  return want
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:788 compareNumbers() at -O1
;   b in s1
compareNumbers:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:789  const b = top()
  call top
  mv s1, a0 ; b
  ; basic/basic.e16.ts:790  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:791  math(M_CMP, top(), b)
  call top
  mv a1, a0
  li a0, 6
  mv a2, s1
  call math
  ; basic/basic.e16.ts:792  return peek16(MATH_RESULT)
  li t0, 65370
  lw a0, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:795 addExpr() at -O1
;   c in s1
;   strings in s2
addExpr:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; basic/basic.e16.ts:796  mulExpr()
  call mulExpr
  ; basic/basic.e16.ts:797  for (;;) {
.L1:
  ; basic/basic.e16.ts:798  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:799  if (c !== CH_PLUS && c !== CH_MINUS) return
  li t0, 43
  beq s1, t0, .L5
  li t0, 45
  beq s1, t0, .L5
  ; basic/basic.e16.ts:799  return
  j .return
.L5:
  ; basic/basic.e16.ts:800  const strings = strType
  lw s2, 0x0118(zero)
  ; basic/basic.e16.ts:801  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:802  mulExpr()
  call mulExpr
  ; basic/basic.e16.ts:803  if (strType !== strings || (strings && c === CH_MINUS)) fail(E_TYPE)
  lw t0, 0x0118(zero)
  bne t0, s2, .L7
  beqz s2, .L6
  li t0, 45
  bne s1, t0, .L6
.L7:
  ; basic/basic.e16.ts:803  fail(E_TYPE)
  li a0, 11
  call fail
.L6:
  ; basic/basic.e16.ts:804  if (strings) join()
  beqz s2, .L8
  ; basic/basic.e16.ts:804  join()
  la t0, join
  li t1, 0
  call far_call
  j .L1
.L8:
  ; basic/basic.e16.ts:805  binary(c === CH_PLUS ? M_ADD : M_SUB)
  li t0, 43
  bne s1, t0, .L10
  li t0, 1
  j .L11
.L10:
  li t0, 2
.L11:
  mv a0, t0
  call binary
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:810 mulExpr() at -O1
;   c in s1
;   op in s2
mulExpr:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; basic/basic.e16.ts:811  unary()
  call unary
  ; basic/basic.e16.ts:812  for (;;) {
.L1:
  ; basic/basic.e16.ts:813  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:814  let op: u16 = M_MUL
  li s2, 3 ; op
  ; basic/basic.e16.ts:815  if (c === CH_SLASH) op = M_DIV
  li t0, 47
  bne s1, t0, .L5
  ; basic/basic.e16.ts:815  op = M_DIV
  li s2, 4 ; op
  j .L6
.L5:
  ; basic/basic.e16.ts:816  if (c === CH_BACKSLASH) op = M_IDIV
  li t0, 92
  bne s1, t0, .L7
  ; basic/basic.e16.ts:816  op = M_IDIV
  li s2, 8 ; op
  j .L8
.L7:
  ; basic/basic.e16.ts:817  if (c === T_MOD) op = M_MOD
  li t0, 222
  bne s1, t0, .L9
  ; basic/basic.e16.ts:817  op = M_MOD
  li s2, 9 ; op
  j .L10
.L9:
  ; basic/basic.e16.ts:818  if (c !== CH_STAR) return
  li t0, 42
  beq s1, t0, .L11
  ; basic/basic.e16.ts:818  return
  j .return
.L11:
.L10:
.L8:
.L6:
  ; basic/basic.e16.ts:819  needNumber()
  call needNumber
  ; basic/basic.e16.ts:820  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:821  unary()
  call unary
  ; basic/basic.e16.ts:822  needNumber()
  call needNumber
  ; basic/basic.e16.ts:823  binary(op)
  mv a0, s2
  call binary
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:831 unary() at -O1
;   c in s1
unary:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:832  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:833  if (c === CH_MINUS) {
  li t0, 45
  bne s1, t0, .L1
  ; basic/basic.e16.ts:834  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:835  unary()
  call unary
  ; basic/basic.e16.ts:836  needNumber()
  call needNumber
  ; basic/basic.e16.ts:837  math(M_NEG, top(), 0)
  call top
  mv a1, a0
  li a0, 16
  li a2, 0
  call math
  ; basic/basic.e16.ts:838  return
  j .return
.L1:
  ; basic/basic.e16.ts:840  if (c === CH_PLUS) txt++
  li t0, 43
  bne s1, t0, .L2
  ; basic/basic.e16.ts:840  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.L2:
  ; basic/basic.e16.ts:841  power()
  call power
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:844 power() at -O1
power:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:845  primary()
  call primary
  ; basic/basic.e16.ts:846  if (next() !== CH_CARET) return
  call next
  li t0, 94
  beq a0, t0, .L1
  ; basic/basic.e16.ts:846  return
  j .return
.L1:
  ; basic/basic.e16.ts:847  needNumber()
  call needNumber
  ; basic/basic.e16.ts:848  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:849  unary()
  call unary
  ; basic/basic.e16.ts:850  needNumber()
  call needNumber
  ; basic/basic.e16.ts:851  binary(M_POW)
  li a0, 5
  call binary
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:854 primary() at -O1
;   c in s1
;   at in s2
primary:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; basic/basic.e16.ts:855  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:856  if (isDigit(c) || c === CH_DOT) {
  mv a0, s1
  call isDigit
  bnez a0, .L2
  li t0, 46
  bne s1, t0, .L1
.L2:
  ; basic/basic.e16.ts:857  literal()
  call literal
  ; basic/basic.e16.ts:858  return
  j .return
.L1:
  ; basic/basic.e16.ts:860  if (c === CH_QUOTE) {
  li t0, 34
  bne s1, t0, .L3
  ; basic/basic.e16.ts:862  const at = txt + 1
  lw t0, 0x010e(zero)
  addi s2, t0, 1
  ; basic/basic.e16.ts:863  txt = quoted(at, false)
  mv a0, s2
  li a1, 0
  call quoted
  sw a0, 0x010e(zero)
  ; basic/basic.e16.ts:864  pushString(at, txt - at - (peek(txt - 1) === CH_QUOTE ? 1 : 0))
  lw t0, 0x010e(zero)
  sub t0, t0, s2
  lw t1, 0x010e(zero)
  lbu t2, -1(t1)
  mv t1, t0
  mv t0, s2
  li t3, 34
  bne t2, t3, .L4
  li t2, 1
  j .L5
.L4:
  li t2, 0
.L5:
  sub t1, t1, t2
  mv a0, t0
  mv a1, t1
  call pushString
  ; basic/basic.e16.ts:865  return
  j .return
.L3:
  ; basic/basic.e16.ts:867  if (c === CH_LPAREN) {
  li t0, 40
  bne s1, t0, .L6
  ; basic/basic.e16.ts:868  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:869  expr()
  call expr
  ; basic/basic.e16.ts:870  expect(CH_RPAREN)
  li a0, 41
  call expect
  ; basic/basic.e16.ts:871  return
  j .return
.L6:
  ; basic/basic.e16.ts:873  if (isLetter(c)) {
  mv a0, s1
  call isLetter
  beqz a0, .L7
  ; basic/basic.e16.ts:874  variableValue()
  call variableValue
  ; basic/basic.e16.ts:875  return
  j .return
.L7:
  ; basic/basic.e16.ts:877  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:878  functionCall(c)
  mv a0, s1
  call functionCall
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:882 variableValue() at -O1
;   at in s1
;   to in s2
variableValue:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; basic/basic.e16.ts:883  const at = varAt(false)
  li a0, 0
  call varAt
  mv s1, a0 ; at
  ; basic/basic.e16.ts:884  if (strType) {
  lw t0, 0x0118(zero)
  beqz t0, .L1
  ; basic/basic.e16.ts:885  if (at === 0) pushString(0, 0)
  bne s1, zero, .L2
  ; basic/basic.e16.ts:885  pushString(0, 0)
  li a0, 0
  li a1, 0
  call pushString
  j .L3
.L2:
  ; basic/basic.e16.ts:886  pushString(at + 1, peek(at))
  lbu t0, 0(s1)
  addi a0, s1, 1
  mv a1, t0
  call pushString
.L3:
  ; basic/basic.e16.ts:887  return
  j .return
.L1:
  ; basic/basic.e16.ts:889  const to = push()
  call push
  mv s2, a0 ; to
  ; basic/basic.e16.ts:890  if (at === 0) setInt(to, 0)
  bne s1, zero, .L4
  ; basic/basic.e16.ts:890  setInt(to, 0)
  mv a0, s2
  li a1, 0
  call setInt
  j .L5
.L4:
  ; basic/basic.e16.ts:891  copy8(at, to)
  mv a0, s1
  mv a1, s2
  call copy8
.L5:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:899 functionCall(token) at -O1
;   token in s1
functionCall:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; token
  ; basic/basic.e16.ts:900  strType = false
  sw zero, 0x0118(zero)
  ; basic/basic.e16.ts:901  if (token >= T_LEN) {
  li t0, 201
  bltu s1, t0, .L1
  ; basic/basic.e16.ts:902  moreFunctions(token)
  mv a0, s1
  la t0, moreFunctions
  li t1, 0
  call far_call
  ; basic/basic.e16.ts:903  return
  j .return
.L1:
  ; basic/basic.e16.ts:905  if (token === T_POINT) {
  li t0, 197
  bne s1, t0, .L2
  ; basic/basic.e16.ts:906  pointFunction()
  la t0, pointFunction
  li t1, 1
  call far_call
  ; basic/basic.e16.ts:907  return
  j .return
.L2:
  ; basic/basic.e16.ts:909  if (token >= T_SIN && token <= T_EXP) {
  li t0, 180
  bltu s1, t0, .L3
  li t0, 192
  bltu t0, s1, .L3
  ; basic/basic.e16.ts:910  unary()
  call unary
  ; basic/basic.e16.ts:911  needNumber()
  call needNumber
  ; basic/basic.e16.ts:912  math(peek(FUNCTION_OPS + (token - T_SIN)), top(), 0)
  addi t0, s1, -180
  la t1, str_1
  add t1, t1, t0
  lbu t1, 0(t1)
  addi sp, sp, -2
  sw t1, 0(sp)
  call top
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  li a2, 0
  call math
  ; basic/basic.e16.ts:913  return
  j .return
.L3:
  ; basic/basic.e16.ts:915  if (token === T_PI) {
  li t0, 194
  bne s1, t0, .L4
  ; basic/basic.e16.ts:916  math(M_PI, push(), 0)
  call push
  mv a1, a0
  li a0, 32
  li a2, 0
  call math
  ; basic/basic.e16.ts:917  return
  j .return
.L4:
  ; basic/basic.e16.ts:919  if (token === T_ANS) {
  li t0, 195
  bne s1, t0, .L5
  ; basic/basic.e16.ts:920  copy8(addr(ans), push())
  call push
  mv a1, a0
  la a0, ans
  call copy8
  ; basic/basic.e16.ts:921  return
  j .return
.L5:
  ; basic/basic.e16.ts:923  if (token === T_RND) {
  li t0, 193
  bne s1, t0, .L6
  ; basic/basic.e16.ts:924  random()
  call random
  ; basic/basic.e16.ts:925  return
  j .return
.L6:
  ; basic/basic.e16.ts:927  if (token === T_PEEK) {
  li t0, 196
  bne s1, t0, .L7
  ; basic/basic.e16.ts:928  unary()
  call unary
  ; basic/basic.e16.ts:929  needNumber()
  call needNumber
  ; basic/basic.e16.ts:930  setInt(top(), peek(toWord(top())))
  call top
  addi sp, sp, -2
  sw a0, 0(sp)
  call top
  call toWord
  lbu t0, 0(a0)
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  mv a1, t0
  call setInt
  ; basic/basic.e16.ts:931  return
  j .return
.L7:
  ; basic/basic.e16.ts:933  fail(E_SYNTAX)
  li a0, 1
  call fail
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:937 random() at -O1
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
  ; basic/basic.e16.ts:938  unary()
  call unary
  ; basic/basic.e16.ts:939  needNumber()
  call needNumber
  ; basic/basic.e16.ts:940  const n = top()
  call top
  mv s2, a0 ; n
  ; basic/basic.e16.ts:941  const r = push()
  call push
  mv s1, a0 ; r
  ; basic/basic.e16.ts:942  math(M_RND, r, 0)
  li a0, 31
  mv a1, s1
  li a2, 0
  call math
  ; basic/basic.e16.ts:943  const one = push()
  call push
  mv s3, a0 ; one
  ; basic/basic.e16.ts:944  setInt(one, 1)
  mv a0, s3
  li a1, 1
  call setInt
  ; basic/basic.e16.ts:945  math(M_CMP, n, one)
  li a0, 6
  mv a1, s2
  mv a2, s3
  call math
  ; basic/basic.e16.ts:946  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:947  if (peek16(MATH_RESULT) === 0xffff) {
  li t0, 65370
  lw t0, 0(t0)
  li t1, 65535
  bne t0, t1, .L1
  ; basic/basic.e16.ts:948  copy8(r, n)
  mv a0, s1
  mv a1, s2
  call copy8
  ; basic/basic.e16.ts:949  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:950  return
  j .return
.L1:
  ; basic/basic.e16.ts:952  math(M_MUL, r, n)
  li a0, 3
  mv a1, s1
  mv a2, s2
  call math
  ; basic/basic.e16.ts:953  math(M_INT, r, 0)
  li a0, 18
  mv a1, s1
  li a2, 0
  call math
  ; basic/basic.e16.ts:954  copy8(r, n)
  mv a0, s1
  mv a1, s2
  call copy8
  ; basic/basic.e16.ts:955  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:956  const k = push()
  call push
  mv s0, a0 ; k
  ; basic/basic.e16.ts:957  setInt(k, 1)
  mv a0, s0
  li a1, 1
  call setInt
  ; basic/basic.e16.ts:958  binary(M_ADD)
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

; basic/basic.e16.ts:964 findLine(n, exact) at -O1
;   n in a0
;   exact in a1
;   at in a2
;   here in a3
findLine:
  ; basic/basic.e16.ts:965  let at = PROG
  li a2, 2048 ; at
  ; basic/basic.e16.ts:966  while (peek16(at) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:967  const here = peek16(at)
  lw a3, 0(a2)
  ; basic/basic.e16.ts:968  if (here === n) return at
  bne a3, a0, .L5
  ; basic/basic.e16.ts:968  return at
  mv a0, a2
  ret
.L5:
  ; basic/basic.e16.ts:969  if (here > n) return exact ? 0 : at
  bgeu a0, a3, .L6
  ; basic/basic.e16.ts:969  return exact ? 0 : at
  beqz a1, .L7
  li t0, 0
  j .L8
.L7:
  mv t0, a2
.L8:
  mv a0, t0
  ret
.L6:
  ; basic/basic.e16.ts:970  at += peek16(at + 2)
  lw t0, 2(a2)
  add a2, a2, t0
.L3:
  lw t0, 0(a2)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:972  return 0
  li a0, 0
.return:
  ret

; basic/basic.e16.ts:976 move(from, to, count) at -O1
;   from in s1
;   to in s2
;   count in s3
move:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; from
  mv s2, a1 ; to
  mv s3, a2 ; count
  ; basic/basic.e16.ts:977  memcpy(to, from, count)
  mv a0, s2
  mv a1, s1
  mv a2, s3
  mcpy a0, a1, a2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:981 storeLine(n, text, length) at -O1
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
  ; basic/basic.e16.ts:982  const old = findLine(n, true)
  lw a0, 0(fp)
  li a1, 1
  call findLine
  mv s3, a0 ; old
  ; basic/basic.e16.ts:983  if (old !== 0) {
  beq s3, zero, .L1
  ; basic/basic.e16.ts:984  const size = peek16(old + 2)
  lw s1, 2(s3)
  ; basic/basic.e16.ts:985  move(old + size, old, progEnd + 2 - (old + size))
  add t0, s3, s1
  lw t1, 0x0112(zero)
  add t2, s3, s1
  addi t1, t1, 2
  sub t1, t1, t2
  mv a0, t0
  mv a1, s3
  mv a2, t1
  call move
  ; basic/basic.e16.ts:986  progEnd -= size
  lw t0, 0x0112(zero)
  sub t0, t0, s1
  sw t0, 0x0112(zero)
.L1:
  ; basic/basic.e16.ts:988  if (length > 1) {
  li t0, 1
  lw t1, 2(fp) ; length
  bgeu t0, t1, .L2
  ; basic/basic.e16.ts:989  const size = (4 + length + 1) & 0xfffe
  lw t0, 2(fp) ; length
  addi t0, t0, 5
  andi s1, t0, -2
  ; basic/basic.e16.ts:990  if (progEnd + 2 + size > LIMIT) fail(E_MEMORY)
  lw t0, 0x0112(zero)
  addi t0, t0, 2
  add t0, t0, s1
  li t1, 28672
  bgeu t1, t0, .L3
  ; basic/basic.e16.ts:990  fail(E_MEMORY)
  li a0, 8
  call fail
.L3:
  ; basic/basic.e16.ts:991  let at = findLine(n, false)
  lw a0, 0(fp)
  li a1, 0
  call findLine
  mv s2, a0 ; at
  ; basic/basic.e16.ts:992  if (at === 0) at = progEnd
  bne s2, zero, .L4
  ; basic/basic.e16.ts:992  at = progEnd
  lw s2, 0x0112(zero)
.L4:
  ; basic/basic.e16.ts:993  move(at, at + size, progEnd + 2 - at)
  add t0, s2, s1
  lw t1, 0x0112(zero)
  addi t1, t1, 2
  sub t1, t1, s2
  mv a0, s2
  mv a1, t0
  mv a2, t1
  call move
  ; basic/basic.e16.ts:994  poke16(at, n)
  lw t0, 0(fp) ; n
  sw t0, 0(s2)
  ; basic/basic.e16.ts:995  poke16(at + 2, size)
  sw s1, 2(s2)
  ; basic/basic.e16.ts:996  move(text, at + 4, length)
  lw a0, 4(fp)
  addi a1, s2, 4
  lw a2, 2(fp)
  call move
  ; basic/basic.e16.ts:997  progEnd += size
  lw t0, 0x0112(zero)
  add t0, t0, s1
  sw t0, 0x0112(zero)
.L2:
  ; basic/basic.e16.ts:999  poke16(progEnd, 0)
  lw t0, 0x0112(zero)
  sw zero, 0(t0)
  ; basic/basic.e16.ts:1000  clearVariables()
  call clearVariables
  ; basic/basic.e16.ts:1001  contLine = 0
  sw zero, 0x0130(zero)
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; basic/basic.e16.ts:1005 keepProgramTo(end) at -O1
;   end in s1
keepProgramTo:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; end
  ; basic/basic.e16.ts:1006  progEnd = end
  sw s1, 0x0112(zero)
  ; basic/basic.e16.ts:1007  poke16(end, 0)
  sw zero, 0(s1)
  ; basic/basic.e16.ts:1008  clearVariables()
  call clearVariables
  ; basic/basic.e16.ts:1009  contLine = 0
  sw zero, 0x0130(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1017 keptProgramEnd() at -O1
;   at in a0
;   last in a2
;   n in a3
;   size in a1
keptProgramEnd:
  ; basic/basic.e16.ts:1018  let at: u16 = PROG
  li a0, 2048 ; at
  ; basic/basic.e16.ts:1019  let last: u16 = 0
  li a2, 0 ; last
  ; basic/basic.e16.ts:1020  while (peek16(at) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:1021  const n = peek16(at)
  lw a3, 0(a0)
  ; basic/basic.e16.ts:1022  const size = peek16(at + 2)
  lw a1, 2(a0)
  ; basic/basic.e16.ts:1023  if (n <= last || size < 6 || (size & 1) !== 0 || size > LIMIT - 2 - at) return PROG
  bgeu a2, a3, .L6
  li t0, 6
  bltu a1, t0, .L6
  andi t0, a1, 1
  bne t0, zero, .L6
  li t0, 28670
  sub t0, t0, a0
  bgeu t0, a1, .L5
.L6:
  ; basic/basic.e16.ts:1023  return PROG
  li a0, 2048
  ret
.L5:
  ; basic/basic.e16.ts:1024  if (peek(at + size - 1) !== 0 && peek(at + size - 2) !== 0) return PROG
  add t0, a0, a1
  lbu t0, -1(t0)
  beq t0, zero, .L7
  add t0, a0, a1
  lbu t0, -2(t0)
  beq t0, zero, .L7
  ; basic/basic.e16.ts:1024  return PROG
  li a0, 2048
  ret
.L7:
  ; basic/basic.e16.ts:1025  last = n
  mv a2, a3 ; last
  ; basic/basic.e16.ts:1026  at += size
  add a0, a0, a1
.L3:
  lw t0, 0(a0)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1028  return at
.return:
  ret

; basic/basic.e16.ts:1033 jump(line, text) at -O1
;   line in a0
;   text in a1
jump:
  ; basic/basic.e16.ts:1034  jumping = true
  li t0, 1
  sw t0, 0x0134(zero)
  ; basic/basic.e16.ts:1035  jumpLine = line
  sw a0, 0x0136(zero)
  ; basic/basic.e16.ts:1036  jumpTxt = text
  sw a1, 0x0138(zero)
.return:
  ret

; basic/basic.e16.ts:1040 statements() at -O1
;   c in s1
statements:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1041  for (;;) {
.L1:
  ; basic/basic.e16.ts:1042  checkBreak()
  call checkBreak
  ; basic/basic.e16.ts:1044  strTop = 0
  sw zero, 0x04f4(zero)
  ; basic/basic.e16.ts:1045  statement()
  call statement
  ; basic/basic.e16.ts:1046  if (jumping || (!running && curLine !== 0)) return
  lw t0, 0x0134(zero)
  bnez t0, .L6
  lw t0, 0x012e(zero)
  bnez t0, .L5
  lw t0, 0x0110(zero)
  beq t0, zero, .L5
.L6:
  ; basic/basic.e16.ts:1046  return
  j .return
.L5:
  ; basic/basic.e16.ts:1047  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1048  if (c === CH_COLON) {
  li t0, 58
  bne s1, t0, .L7
  ; basic/basic.e16.ts:1049  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1050  continue
  j .L1
.L7:
  ; basic/basic.e16.ts:1053  if (c === 0 || c === T_ELSE) return
  beq s1, zero, .L9
  li t0, 137
  bne s1, t0, .L8
.L9:
  ; basic/basic.e16.ts:1053  return
  j .return
.L8:
  ; basic/basic.e16.ts:1054  fail(E_SYNTAX)
  li a0, 1
  call fail
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1058 statement() at -O1
;   c in s1
statement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1059  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1060  if (c === 0 || c === CH_COLON) return
  beq s1, zero, .L2
  li t0, 58
  bne s1, t0, .L1
.L2:
  ; basic/basic.e16.ts:1060  return
  j .return
.L1:
  ; basic/basic.e16.ts:1061  if (isLetter(c)) {
  mv a0, s1
  call isLetter
  beqz a0, .L3
  ; basic/basic.e16.ts:1062  assignment()
  call assignment
  ; basic/basic.e16.ts:1063  return
  j .return
.L3:
  ; basic/basic.e16.ts:1065  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1066  switch (c) {
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
  li t0, 158
  beq s1, t0, .L14
  j .L15
.L5:
  ; basic/basic.e16.ts:1068  printStatement()
  call printStatement
  ; basic/basic.e16.ts:1069  return
  j .return
.L6:
  ; basic/basic.e16.ts:1071  assignment()
  call assignment
  ; basic/basic.e16.ts:1072  return
  j .return
.L7:
  ; basic/basic.e16.ts:1074  ifStatement()
  call ifStatement
  ; basic/basic.e16.ts:1075  return
  j .return
.L8:
  ; basic/basic.e16.ts:1077  forStatement()
  call forStatement
  ; basic/basic.e16.ts:1078  return
  j .return
.L9:
  ; basic/basic.e16.ts:1080  nextStatement()
  call nextStatement
  ; basic/basic.e16.ts:1081  return
  j .return
.L10:
  ; basic/basic.e16.ts:1083  gotoStatement()
  call gotoStatement
  ; basic/basic.e16.ts:1084  return
  j .return
.L11:
  ; basic/basic.e16.ts:1086  gosubStatement()
  call gosubStatement
  ; basic/basic.e16.ts:1087  return
  j .return
.L12:
  ; basic/basic.e16.ts:1089  returnStatement()
  call returnStatement
  ; basic/basic.e16.ts:1090  return
  j .return
.L13:
  ; basic/basic.e16.ts:1092  toLineEnd()
  call toLineEnd
  ; basic/basic.e16.ts:1093  return
  j .return
.L14:
  ; basic/basic.e16.ts:1095  skipData()
  call skipData
  ; basic/basic.e16.ts:1096  return
  j .return
.L15:
  ; basic/basic.e16.ts:1098  commandStatement(c)
  mv a0, s1
  call commandStatement
  ; basic/basic.e16.ts:1099  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1104 skipData() at -O1
;   inside in a0
skipData:
  ; basic/basic.e16.ts:1105  let inside = false
  li a0, 0 ; inside
  ; basic/basic.e16.ts:1106  while (peek(txt) !== 0 && (inside || peek(txt) !== CH_COLON)) {
  j .L3
.L1:
  ; basic/basic.e16.ts:1107  if (peek(txt) === CH_QUOTE) inside = !inside
  lw t0, 0x010e(zero)
  lbu t0, 0(t0)
  li t1, 34
  bne t0, t1, .L5
  ; basic/basic.e16.ts:1107  inside = !inside
  seqz a0, a0
.L5:
  ; basic/basic.e16.ts:1108  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.L3:
  lw t0, 0x010e(zero)
  lbu t0, 0(t0)
  beq t0, zero, .L6
  bnez a0, .L1
  lw t0, 0x010e(zero)
  lbu t0, 0(t0)
  li t1, 58
  bne t0, t1, .L1
.L6:
.return:
  ret

; basic/basic.e16.ts:1112 commandStatement(c) at -O1
;   c in s1
commandStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1113  switch (c) {
  li t0, 133
  beq s1, t0, .L2
  li t0, 215
  beq s1, t0, .L3
  li t0, 145
  beq s1, t0, .L4
  li t0, 146
  beq s1, t0, .L5
  li t0, 128
  beq s1, t0, .L6
  li t0, 129
  beq s1, t0, .L7
  li t0, 130
  beq s1, t0, .L8
  li t0, 131
  beq s1, t0, .L9
  li t0, 149
  beq s1, t0, .L10
  li t0, 153
  beq s1, t0, .L11
  li t0, 154
  beq s1, t0, .L12
  li t0, 148
  beq s1, t0, .L13
  j .L14
.L2:
  ; basic/basic.e16.ts:1115  inputStatement()
  la t0, inputStatement
  li t1, 0
  call far_call
  ; basic/basic.e16.ts:1116  return
  j .return
.L3:
  ; basic/basic.e16.ts:1118  offStatement()
  ; basic/basic.e16.ts:1455  poke16(IO_POWER, 0)
  li t0, 65286
  sw zero, 0(t0)
  ; basic/basic.e16.ts:1119  return
  j .return
.L4:
  ; basic/basic.e16.ts:1121  contLine = 0
  sw zero, 0x0130(zero)
  ; basic/basic.e16.ts:1122  endProgram()
  call endProgram
  ; basic/basic.e16.ts:1123  return
  j .return
.L5:
  ; basic/basic.e16.ts:1125  contLine = curLine
  lw t0, 0x0110(zero)
  sw t0, 0x0130(zero)
  ; basic/basic.e16.ts:1126  contTxt = txt
  lw t0, 0x010e(zero)
  sw t0, 0x0132(zero)
  ; basic/basic.e16.ts:1127  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1128  puts(str('STOP'))
  la a0, str_27
  call puts
  ; basic/basic.e16.ts:1129  inLine()
  call inLine
  ; basic/basic.e16.ts:1130  newline()
  call newline
  ; basic/basic.e16.ts:1131  endProgram()
  call endProgram
  ; basic/basic.e16.ts:1132  return
  j .return
.L6:
  ; basic/basic.e16.ts:1134  runStatement()
  call runStatement
  ; basic/basic.e16.ts:1135  return
  j .return
.L7:
  ; basic/basic.e16.ts:1137  listStatement()
  call listStatement
  ; basic/basic.e16.ts:1138  return
  j .return
.L8:
  ; basic/basic.e16.ts:1140  keepProgramTo(PROG)
  li a0, 2048
  call keepProgramTo
  ; basic/basic.e16.ts:1141  recallNo = 0
  sw zero, 0x013e(zero)
  ; basic/basic.e16.ts:1142  endProgram()
  call endProgram
  ; basic/basic.e16.ts:1143  return
  j .return
.L9:
  ; basic/basic.e16.ts:1145  contStatement()
  call contStatement
  ; basic/basic.e16.ts:1146  return
  j .return
.L10:
  ; basic/basic.e16.ts:1148  cls()
  call cls
  ; basic/basic.e16.ts:1149  return
  j .return
.L11:
  ; basic/basic.e16.ts:1151  pokeStatement()
  call pokeStatement
  ; basic/basic.e16.ts:1152  return
  j .return
.L12:
  ; basic/basic.e16.ts:1154  expr()
  call expr
  ; basic/basic.e16.ts:1157  poke16(INBASIC, 0)
  sw zero, 28(zero)
  ; basic/basic.e16.ts:1158  call_at(toWord(top()))
  call top
  call toWord
  call call_at
  ; basic/basic.e16.ts:1160  poke16(LINK_CMD, LINK_CANCEL)
  li t0, 3
  li t1, 65392
  sw t0, 0(t1)
  ; basic/basic.e16.ts:1161  poke16(INBASIC, 1)
  li t0, 1
  sw t0, 28(zero)
  ; basic/basic.e16.ts:1162  poke16(BRKFLAG, 0)
  sw zero, 30(zero)
  ; basic/basic.e16.ts:1163  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:1164  return
  j .return
.L13:
  ; basic/basic.e16.ts:1166  poke16(INBASIC, 0)
  sw zero, 28(zero)
  ; basic/basic.e16.ts:1167  monitor()
  call monitor
  ; basic/basic.e16.ts:1168  return
  j .return
.L14:
  ; basic/basic.e16.ts:1170  angleStatement(c)
  mv a0, s1
  call angleStatement
  ; basic/basic.e16.ts:1171  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1175 angleStatement(c) at -O1
;   c in s1
;   unit in s2
angleStatement:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1176  if (c === T_DEG || c === T_RAD || c === T_GRAD) {
  li t0, 150
  beq s1, t0, .L2
  li t0, 151
  beq s1, t0, .L2
  li t0, 152
  bne s1, t0, .L1
.L2:
  ; basic/basic.e16.ts:1177  const unit: u16 = c - T_DEG
  addi s2, s1, -150
  ; basic/basic.e16.ts:1178  poke16(MATH_ANGLE, unit)
  li t0, 65372
  sw s2, 0(t0)
  ; basic/basic.e16.ts:1179  angleMarks = unit === 0 ? ANN_DEG : unit === 1 ? ANN_RAD : ANN_GRAD
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
  sw t0, 0x013c(zero)
  ; basic/basic.e16.ts:1180  marks()
  call marks
  ; basic/basic.e16.ts:1181  return
  j .return
.L1:
  ; basic/basic.e16.ts:1184  if ((c >= T_LOCATE && c <= T_GPRINT) || c === T_CIRCLE) screenStatement(c)
  li t0, 172
  bltu s1, t0, .L9
  li t0, 177
  bgeu t0, s1, .L8
.L9:
  li t0, 219
  bne s1, t0, .L7
.L8:
  ; basic/basic.e16.ts:1184  screenStatement(c)
  mv a0, s1
  la t0, screenStatement
  li t1, 1
  call far_call
  j .L10
.L7:
  ; basic/basic.e16.ts:1185  if ((c >= T_FILES && c <= T_KILL) || c === T_OPEN || c === T_CLOSE) fileStatement(c)
  li t0, 168
  bltu s1, t0, .L13
  li t0, 171
  bgeu t0, s1, .L12
.L13:
  li t0, 178
  beq s1, t0, .L12
  li t0, 179
  bne s1, t0, .L11
.L12:
  ; basic/basic.e16.ts:1185  fileStatement(c)
  mv a0, s1
  la t0, fileStatement
  li t1, 2
  call far_call
  j .L14
.L11:
  ; basic/basic.e16.ts:1186  if (c >= T_AUTO && c <= T_TROFF) toolStatement(c)
  li t0, 163
  bltu s1, t0, .L15
  li t0, 167
  bltu t0, s1, .L15
  ; basic/basic.e16.ts:1186  toolStatement(c)
  mv a0, s1
  la t0, toolStatement
  li t1, 3
  call far_call
  j .L16
.L15:
  ; basic/basic.e16.ts:1187  if (c === T_ASK) askStatement()
  li t0, 220
  bne s1, t0, .L17
  ; basic/basic.e16.ts:1187  askStatement()
  la t0, askStatement
  li t1, 5
  call far_call
  j .L18
.L17:
  ; basic/basic.e16.ts:1188  dataStatement(c)
  mv a0, s1
  la t0, dataStatement
  li t1, 0
  call far_call
.L18:
.L16:
.L14:
.L10:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:1191 toLineEnd() at -O1
toLineEnd:
  ; basic/basic.e16.ts:1192  while (peek(txt) !== 0) txt++
  j .L3
.L1:
  ; basic/basic.e16.ts:1192  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.L3:
  lw t0, 0x010e(zero)
  lbu t0, 0(t0)
  bne t0, zero, .L1
.return:
  ret

; basic/basic.e16.ts:1195 endProgram() at -O1
endProgram:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1196  running = false
  sw zero, 0x012e(zero)
  ; basic/basic.e16.ts:1197  toLineEnd()
  call toLineEnd
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1200 assignment() at -O1
;   at in s1
;   strings in s2
;   room in s3
assignment:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/basic.e16.ts:1201  const at = varAt(true)
  li a0, 1
  call varAt
  mv s1, a0 ; at
  ; basic/basic.e16.ts:1202  const strings = strType
  lw s2, 0x0118(zero)
  ; basic/basic.e16.ts:1203  const room = varRoom
  lw s3, 0x011a(zero)
  ; basic/basic.e16.ts:1204  expect(CH_EQ)
  li a0, 61
  call expect
  ; basic/basic.e16.ts:1205  expr()
  call expr
  ; basic/basic.e16.ts:1206  if (strType !== strings) fail(E_TYPE)
  lw t0, 0x0118(zero)
  beq t0, s2, .L1
  ; basic/basic.e16.ts:1206  fail(E_TYPE)
  li a0, 11
  call fail
.L1:
  ; basic/basic.e16.ts:1207  if (strings) storeString(at, room)
  beqz s2, .L2
  ; basic/basic.e16.ts:1207  storeString(at, room)
  mv a0, s1
  mv a1, s3
  call storeString
  j .L3
.L2:
  ; basic/basic.e16.ts:1208  copy8(top(), at)
  call top
  mv a1, s1
  call copy8
.L3:
  ; basic/basic.e16.ts:1209  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:1213 printStatement() at -O1
printStatement:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1214  if (next() === CH_HASH) printToFile()
  call next
  li t0, 35
  bne a0, t0, .L1
  ; basic/basic.e16.ts:1214  printToFile()
  la t0, printToFile
  li t1, 2
  call far_call
  j .L2
.L1:
  ; basic/basic.e16.ts:1215  printItems()
  call printItems
.L2:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1222 printItems() at -O1
;   joined in s1
printItems:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1223  let joined = false
  li s1, 0 ; joined
  ; basic/basic.e16.ts:1224  printed = false
  sw zero, 0x061c(zero)
  ; basic/basic.e16.ts:1225  while (!statementEnds()) {
  j .L3
.L1:
  ; basic/basic.e16.ts:1226  printItem()
  call printItem
  ; basic/basic.e16.ts:1227  joined = separator()
  call separator
  mv s1, a0 ; joined
  ; basic/basic.e16.ts:1228  if (!joined && !statementEnds()) fail(E_SYNTAX)
  bnez s1, .L5
  call statementEnds
  bnez a0, .L5
  ; basic/basic.e16.ts:1228  fail(E_SYNTAX)
  li a0, 1
  call fail
.L5:
.L3:
  call statementEnds
  beqz a0, .L1
  ; basic/basic.e16.ts:1230  if (joined) return
  beqz s1, .L6
  ; basic/basic.e16.ts:1230  return
  j .return
.L6:
  ; basic/basic.e16.ts:1231  if (outFile !== 0) fileByte(K_ENTER)
  lw t0, 0x011c(zero)
  beq t0, zero, .L7
  ; basic/basic.e16.ts:1231  fileByte(K_ENTER)
  li a0, 13
  la t0, fileByte
  li t1, 2
  call far_call
  j .L8
.L7:
  ; basic/basic.e16.ts:1233  if (!printed || peek16(CURX) !== 0) newline()
  lw t0, 0x061c(zero)
  beqz t0, .L10
  lw t0, 0(zero)
  beq t0, zero, .L9
.L10:
  ; basic/basic.e16.ts:1233  newline()
  call newline
.L9:
.L8:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1237 printItem() at -O1
;   p in s1
printItem:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1238  expr()
  call expr
  ; basic/basic.e16.ts:1239  if (strType) outString(top())
  lw t0, 0x0118(zero)
  beqz t0, .L1
  ; basic/basic.e16.ts:1239  outString(top())
  call top
  call outString
  j .L2
.L1:
  ; basic/basic.e16.ts:1241  formatTop()
  call formatTop
  ; basic/basic.e16.ts:1242  for (let p = addr(textOut); peek(p) !== 0; p++) out(peek(p))
  la s1, textOut
  j .L5
.L3:
  ; basic/basic.e16.ts:1242  out(peek(p))
  lbu a0, 0(s1)
  call out
  addi s1, s1, 1
.L5:
  lbu t0, 0(s1)
  bne t0, zero, .L3
  ; basic/basic.e16.ts:1243  if (next() === CH_SEMI) out(CH_SPACE)
  call next
  li t0, 59
  bne a0, t0, .L7
  ; basic/basic.e16.ts:1243  out(CH_SPACE)
  li a0, 32
  call out
.L7:
.L2:
  ; basic/basic.e16.ts:1245  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1252 out(c) at -O1
;   c in s1
out:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1253  printed = true
  li t0, 1
  sw t0, 0x061c(zero)
  ; basic/basic.e16.ts:1254  if (outFile === 0) putc(c)
  lw t0, 0x011c(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1254  putc(c)
  mv a0, s1
  call putc
  j .L2
.L1:
  ; basic/basic.e16.ts:1255  fileByte(c)
  mv a0, s1
  la t0, fileByte
  li t1, 2
  call far_call
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1259 outString(e) at -O1
;   e in s2
;   at in s3
;   n in s0
;   k in s1
outString:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; e
  ; basic/basic.e16.ts:1260  const at = stringAt(e)
  mv a0, s2
  call stringAt
  mv s3, a0 ; at
  ; basic/basic.e16.ts:1261  const n = stringLength(e)
  mv a0, s2
  call stringLength
  mv s0, a0 ; n
  ; basic/basic.e16.ts:1262  for (let k: u16 = 0; k < n; k++) out(peek(at + k))
  li s1, 0 ; k
  j .L3
.L1:
  ; basic/basic.e16.ts:1262  out(peek(at + k))
  add t0, s3, s1
  lbu a0, 0(t0)
  call out
  addi s1, s1, 1
.L3:
  bltu s1, s0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:1266 statementEnds() at -O1
;   c in s1
statementEnds:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1267  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1268  return c === 0 || c === CH_COLON || c === T_ELSE
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

; basic/basic.e16.ts:1272 quoted(p, show) at -O1
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
  ; basic/basic.e16.ts:1273  let q = p
  mv s1, s2 ; q
  ; basic/basic.e16.ts:1274  while (peek(q) !== CH_QUOTE && peek(q) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:1275  if (show) putc(peek(q))
  beqz s3, .L5
  ; basic/basic.e16.ts:1275  putc(peek(q))
  lbu a0, 0(s1)
  call putc
.L5:
  ; basic/basic.e16.ts:1276  q++
  addi s1, s1, 1
.L3:
  lbu t0, 0(s1)
  li t1, 34
  beq t0, t1, .L6
  lbu t0, 0(s1)
  bne t0, zero, .L1
.L6:
  ; basic/basic.e16.ts:1278  return peek(q) === CH_QUOTE ? q + 1 : q
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

; basic/basic.e16.ts:1282 separator() at -O1
;   c in s1
separator:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1283  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1284  if (c === CH_SEMI) {
  li t0, 59
  bne s1, t0, .L1
  ; basic/basic.e16.ts:1285  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1286  return true
  li a0, 1
  j .return
.L1:
  ; basic/basic.e16.ts:1288  if (c !== CH_COMMA) return false
  li t0, 44
  beq s1, t0, .L2
  ; basic/basic.e16.ts:1288  return false
  li a0, 0
  j .return
.L2:
  ; basic/basic.e16.ts:1289  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1290  if (outFile !== 0) {
  lw t0, 0x011c(zero)
  beq t0, zero, .L3
  ; basic/basic.e16.ts:1291  fileByte(CH_COMMA)
  li a0, 44
  la t0, fileByte
  li t1, 2
  call far_call
  ; basic/basic.e16.ts:1292  return true
  li a0, 1
  j .return
.L3:
  ; basic/basic.e16.ts:1294  putc(CH_SPACE)
  li a0, 32
  call putc
  ; basic/basic.e16.ts:1295  while (peek16(CURX) % 10 !== 0 && peek16(CURX) !== 0) putc(CH_SPACE)
  j .L6
.L4:
  ; basic/basic.e16.ts:1295  putc(CH_SPACE)
  li a0, 32
  call putc
.L6:
  lw t0, 0(zero)
  li t1, 10
  remu t0, t0, t1
  beq t0, zero, .L8
  lw t0, 0(zero)
  bne t0, zero, .L4
.L8:
  ; basic/basic.e16.ts:1296  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1299 ifStatement() at -O1
;   holds in s1
ifStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1300  expr()
  call expr
  ; basic/basic.e16.ts:1301  needNumber()
  call needNumber
  ; basic/basic.e16.ts:1302  const holds = !isZero(top())
  call top
  call isZero
  seqz s1, a0
  ; basic/basic.e16.ts:1303  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:1304  if (next() === T_THEN) txt++
  call next
  li t0, 136
  bne a0, t0, .L1
  ; basic/basic.e16.ts:1304  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.L1:
  ; basic/basic.e16.ts:1305  if (!holds && !skipToElse()) return
  bnez s1, .L2
  call skipToElse
  bnez a0, .L2
  ; basic/basic.e16.ts:1305  return
  j .return
.L2:
  ; basic/basic.e16.ts:1308  if (isDigit(next())) gotoStatement()
  call next
  call isDigit
  beqz a0, .L3
  ; basic/basic.e16.ts:1308  gotoStatement()
  call gotoStatement
  j .L4
.L3:
  ; basic/basic.e16.ts:1309  statements()
  call statements
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1313 skipToElse() at -O1
;   quoted in a0
;   c in a1
skipToElse:
  ; basic/basic.e16.ts:1314  let quoted = false
  li a0, 0 ; quoted
  ; basic/basic.e16.ts:1315  while (peek(txt) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:1316  const c = peek(txt)
  lw t0, 0x010e(zero)
  lbu a1, 0(t0)
  ; basic/basic.e16.ts:1317  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1318  if (c === CH_QUOTE) quoted = !quoted
  li t0, 34
  bne a1, t0, .L5
  ; basic/basic.e16.ts:1318  quoted = !quoted
  seqz a0, a0
.L5:
  ; basic/basic.e16.ts:1319  if (c === T_ELSE && !quoted) return true
  li t0, 137
  bne a1, t0, .L6
  bnez a0, .L6
  ; basic/basic.e16.ts:1319  return true
  li a0, 1
  ret
.L6:
.L3:
  lw t0, 0x010e(zero)
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1321  return false
  li a0, 0
.return:
  ret

; basic/basic.e16.ts:1328 targetLine() at -O1
;   save in s2
;   n in s3
;   line in s1
targetLine:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; basic/basic.e16.ts:1329  const save = txt
  lw s2, 0x010e(zero)
  ; basic/basic.e16.ts:1330  if (isDigit(next())) {
  call next
  call isDigit
  beqz a0, .L1
  ; basic/basic.e16.ts:1331  const n = readUnsigned()
  call readUnsigned
  mv s3, a0 ; n
  ; basic/basic.e16.ts:1332  if (statementEnds()) {
  call statementEnds
  beqz a0, .L2
  ; basic/basic.e16.ts:1333  const line = findLine(n, true)
  mv a0, s3
  li a1, 1
  call findLine
  mv s1, a0 ; line
  ; basic/basic.e16.ts:1334  if (line === 0) fail(E_LINE)
  bne s1, zero, .L3
  ; basic/basic.e16.ts:1334  fail(E_LINE)
  li a0, 5
  call fail
.L3:
  ; basic/basic.e16.ts:1335  return line
  mv a0, s1
  j .return
.L2:
  ; basic/basic.e16.ts:1337  txt = save
  sw s2, 0x010e(zero)
.L1:
  ; basic/basic.e16.ts:1339  return computedLine()
  la t0, computedLine
  li t1, 0
  call far_call
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:1342 gotoStatement() at -O1
;   line in s1
gotoStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1343  const line = targetLine()
  call targetLine
  mv s1, a0 ; line
  ; basic/basic.e16.ts:1344  jump(line, line + 4)
  mv a0, s1
  addi a1, s1, 4
  call jump
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1347 gosubStatement() at -O1
gosubStatement:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1348  gosubTo(targetLine())
  call targetLine
  call gosubTo
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1352 gosubTo(line) at -O1
;   line in s1
gosubTo:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; line
  ; basic/basic.e16.ts:1353  if (gsp >= GOSUB_DEPTH) fail(E_COMPLEX)
  lw t0, 0x012c(zero)
  li t1, 16
  bltu t0, t1, .L1
  ; basic/basic.e16.ts:1353  fail(E_COMPLEX)
  li a0, 9
  call fail
.L1:
  ; basic/basic.e16.ts:1354  gosubStack[gsp * 2] = curLine
  lw t0, 0x012c(zero)
  slli t0, t0, 1
  slli t0, t0, 1
  lw t1, 0x0110(zero)
  sw t1, gosubStack(t0)
  ; basic/basic.e16.ts:1355  gosubStack[gsp * 2 + 1] = txt
  lw t0, 0x012c(zero)
  slli t0, t0, 1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t1, 0x010e(zero)
  sw t1, gosubStack(t0)
  ; basic/basic.e16.ts:1356  gosubFor[gsp] = fsp
  lw t0, 0x012c(zero)
  lw t1, 0x012a(zero)
  sb t1, gosubFor(t0)
  ; basic/basic.e16.ts:1357  gsp++
  lw t0, 0x012c(zero)
  addi t0, t0, 1
  sw t0, 0x012c(zero)
  ; basic/basic.e16.ts:1358  jump(line, line + 4)
  mv a0, s1
  addi a1, s1, 4
  call jump
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1362 returnStatement() at -O1
returnStatement:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1363  if (gsp === 0) fail(E_RETURN)
  lw t0, 0x012c(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1363  fail(E_RETURN)
  li a0, 7
  call fail
.L1:
  ; basic/basic.e16.ts:1364  gsp--
  lw t0, 0x012c(zero)
  addi t0, t0, -1
  sw t0, 0x012c(zero)
  ; basic/basic.e16.ts:1365  fsp = gosubFor[gsp]
  lw t0, 0x012c(zero)
  lbu t0, gosubFor(t0)
  sw t0, 0x012a(zero)
  ; basic/basic.e16.ts:1366  jump(gosubStack[gsp * 2], gosubStack[gsp * 2 + 1])
  lw t0, 0x012c(zero)
  slli t0, t0, 1
  slli t0, t0, 1
  lw t0, gosubStack(t0)
  lw t1, 0x012c(zero)
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

; basic/basic.e16.ts:1370 forBase() at -O1
forBase:
  ; basic/basic.e16.ts:1371  return gsp === 0 ? 0 : gosubFor[gsp - 1]
  lw t0, 0x012c(zero)
  bne t0, zero, .L1
  li t0, 0
  j .L2
.L1:
  lw t0, 0x012c(zero)
  lbu t0, gosubFor-1(t0)
.L2:
  mv a0, t0
.return:
  ret

; basic/basic.e16.ts:1375 forStatement() at -O1
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
  ; basic/basic.e16.ts:1376  const at = varAt(true)
  li a0, 1
  call varAt
  mv s3, a0 ; at
  ; basic/basic.e16.ts:1377  needNumber()
  call needNumber
  ; basic/basic.e16.ts:1378  expect(CH_EQ)
  li a0, 61
  call expect
  ; basic/basic.e16.ts:1379  expr()
  call expr
  ; basic/basic.e16.ts:1380  copy8(top(), at)
  call top
  mv a1, s3
  call copy8
  ; basic/basic.e16.ts:1381  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:1382  if (next() !== T_TO) fail(E_SYNTAX)
  call next
  li t0, 139
  beq a0, t0, .L1
  ; basic/basic.e16.ts:1382  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:1383  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1384  expr()
  call expr
  ; basic/basic.e16.ts:1385  needNumber()
  call needNumber
  ; basic/basic.e16.ts:1386  const limit = top()
  call top
  sw a0, 0(fp) ; limit
  ; basic/basic.e16.ts:1387  if (next() === T_STEP) {
  call next
  li t0, 140
  bne a0, t0, .L2
  ; basic/basic.e16.ts:1388  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1389  expr()
  call expr
  ; basic/basic.e16.ts:1390  needNumber()
  call needNumber
  j .L3
.L2:
  ; basic/basic.e16.ts:1391  setInt(push(), 1)
  call push
  li a1, 1
  call setInt
.L3:
  ; basic/basic.e16.ts:1392  const step = top()
  call top
  sw a0, 2(fp) ; step
  ; basic/basic.e16.ts:1394  let k = forBase()
  call forBase
  mv s1, a0 ; k
  ; basic/basic.e16.ts:1395  while (k < fsp && peek16(forEntry(k)) !== at) k++
  j .L6
.L4:
  ; basic/basic.e16.ts:1395  k++
  addi s1, s1, 1
.L6:
  lw t0, 0x012a(zero)
  bgeu s1, t0, .L8
  mv a0, s1
  call forEntry
  lw t0, 0(a0)
  bne t0, s3, .L4
.L8:
  ; basic/basic.e16.ts:1396  fsp = k
  sw s1, 0x012a(zero)
  ; basic/basic.e16.ts:1397  if (fsp >= FOR_DEPTH) fail(E_COMPLEX)
  li t0, 8
  bltu s1, t0, .L9
  ; basic/basic.e16.ts:1397  fail(E_COMPLEX)
  li a0, 9
  call fail
.L9:
  ; basic/basic.e16.ts:1398  const e = forEntry(fsp)
  lw a0, 0x012a(zero)
  call forEntry
  mv s2, a0 ; e
  ; basic/basic.e16.ts:1399  poke16(e, at)
  sw s3, 0(s2)
  ; basic/basic.e16.ts:1400  copy8(limit, e + 2)
  lw a0, 0(fp)
  addi a1, s2, 2
  call copy8
  ; basic/basic.e16.ts:1401  copy8(step, e + 10)
  lw a0, 2(fp)
  addi a1, s2, 10
  call copy8
  ; basic/basic.e16.ts:1402  poke16(e + 18, curLine)
  lw t0, 0x0110(zero)
  sw t0, 18(s2)
  ; basic/basic.e16.ts:1403  poke16(e + 20, txt)
  lw t0, 0x010e(zero)
  sw t0, 20(s2)
  ; basic/basic.e16.ts:1404  fsp++
  lw t0, 0x012a(zero)
  addi t0, t0, 1
  sw t0, 0x012a(zero)
  ; basic/basic.e16.ts:1405  nsp -= 16
  lw t0, 0x0116(zero)
  addi t0, t0, -16
  sw t0, 0x0116(zero)
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/basic.e16.ts:1408 forEntry(k) at -O1
;   k in a0
forEntry:
  ; basic/basic.e16.ts:1409  return addr(forStack) + k * FOR_SIZE
  li t0, 22
  mul t0, a0, t0
  addi a0, t0, forStack
.return:
  ret

; basic/basic.e16.ts:1413 nextStatement() at -O1
;   base in s3
;   k in s2
;   at/e in s1
;   at in 0(fp)
;   r in 2(fp)
;   up in 4(fp)
;   past in 6(fp)
nextStatement:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s3, 10(sp)
  sw s2, 12(sp)
  sw s1, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  ; basic/basic.e16.ts:1415  const base = forBase()
  call forBase
  mv s3, a0 ; base
  ; basic/basic.e16.ts:1416  if (fsp <= base) fail(E_NEXT)
  lw t0, 0x012a(zero)
  bltu s3, t0, .L1
  ; basic/basic.e16.ts:1416  fail(E_NEXT)
  li a0, 6
  call fail
.L1:
  ; basic/basic.e16.ts:1417  let k = fsp - 1
  lw t0, 0x012a(zero)
  addi s2, t0, -1
  ; basic/basic.e16.ts:1418  if (isLetter(next())) {
  call next
  call isLetter
  beqz a0, .L2
  ; basic/basic.e16.ts:1419  const at = varAt(false)
  li a0, 0
  call varAt
  mv s1, a0 ; at/e
  ; basic/basic.e16.ts:1420  while (peek16(forEntry(k)) !== at) {
  j .L5
.L3:
  ; basic/basic.e16.ts:1421  if (k === base) fail(E_NEXT)
  bne s2, s3, .L7
  ; basic/basic.e16.ts:1421  fail(E_NEXT)
  li a0, 6
  call fail
.L7:
  ; basic/basic.e16.ts:1422  k--
  addi s2, s2, -1
.L5:
  mv a0, s2
  call forEntry
  lw t0, 0(a0)
  bne t0, s1, .L3
.L2:
  ; basic/basic.e16.ts:1425  const e = forEntry(k)
  mv a0, s2
  call forEntry
  mv s1, a0 ; at/e
  ; basic/basic.e16.ts:1426  const at = peek16(e)
  lw t0, 0(s1)
  sw t0, 0(fp) ; at
  ; basic/basic.e16.ts:1427  math(M_ADD, at, e + 10)
  li a0, 1
  lw a1, 0(fp)
  addi a2, s1, 10
  call math
  ; basic/basic.e16.ts:1428  math(M_CMP, at, e + 2)
  li a0, 6
  lw a1, 0(fp)
  addi a2, s1, 2
  call math
  ; basic/basic.e16.ts:1429  const r = peek16(MATH_RESULT)
  li t0, 65370
  lw t0, 0(t0)
  sw t0, 2(fp) ; r
  ; basic/basic.e16.ts:1431  const up = (peek(e + 10) & 0x80) === 0
  lbu t0, 10(s1)
  andi t0, t0, 128
  sub t0, t0, zero
  seqz t0, t0
  sw t0, 4(fp) ; up
  ; basic/basic.e16.ts:1432  const past = up ? r === 1 : r === 0xffff
  lw t0, 4(fp) ; up
  beqz t0, .L8
  li t0, 1
  lw t1, 2(fp) ; r
  sub t1, t1, t0
  seqz t0, t1
  j .L9
.L8:
  li t0, 65535
  lw t1, 2(fp) ; r
  sub t1, t1, t0
  seqz t0, t1
.L9:
  sw t0, 6(fp) ; past
  ; basic/basic.e16.ts:1433  if (past) {
  lw t0, 6(fp) ; past
  beqz t0, .L10
  ; basic/basic.e16.ts:1434  fsp = k
  sw s2, 0x012a(zero)
  ; basic/basic.e16.ts:1435  return
  j .return
.L10:
  ; basic/basic.e16.ts:1437  fsp = k + 1
  addi t0, s2, 1
  sw t0, 0x012a(zero)
  ; basic/basic.e16.ts:1438  jump(peek16(e + 18), peek16(e + 20))
  lw t0, 18(s1)
  lw t1, 20(s1)
  mv a0, t0
  mv a1, t1
  call jump
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s3, 10(sp)
  lw s2, 12(sp)
  lw s1, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; basic/basic.e16.ts:1441 pokeStatement() at -O1
;   a in s1
pokeStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1442  expr()
  call expr
  ; basic/basic.e16.ts:1443  needNumber()
  call needNumber
  ; basic/basic.e16.ts:1444  const a = toWord(top())
  call top
  call toWord
  mv s1, a0 ; a
  ; basic/basic.e16.ts:1445  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:1446  expect(CH_COMMA)
  li a0, 44
  call expect
  ; basic/basic.e16.ts:1447  expr()
  call expr
  ; basic/basic.e16.ts:1448  needNumber()
  call needNumber
  ; basic/basic.e16.ts:1449  poke(a, u16(toInt(top())))
  call top
  call toInt
  sb a0, 0(s1)
  ; basic/basic.e16.ts:1450  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1460 runStatement() at -O1
;   from in s1
runStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1461  let from = PROG
  li s1, 2048 ; from
  ; basic/basic.e16.ts:1462  if (isDigit(next())) {
  call next
  call isDigit
  beqz a0, .L1
  ; basic/basic.e16.ts:1463  from = findLine(readUnsigned(), true)
  call readUnsigned
  li a1, 1
  call findLine
  mv s1, a0 ; from
  ; basic/basic.e16.ts:1464  if (from === 0) fail(E_LINE)
  bne s1, zero, .L2
  ; basic/basic.e16.ts:1464  fail(E_LINE)
  li a0, 5
  call fail
.L2:
.L1:
  ; basic/basic.e16.ts:1466  clearVariables()
  call clearVariables
  ; basic/basic.e16.ts:1468  contLine = 0
  sw zero, 0x0130(zero)
  ; basic/basic.e16.ts:1469  if (peek16(from) === 0) {
  lw t0, 0(s1)
  bne t0, zero, .L3
  ; basic/basic.e16.ts:1470  endProgram()
  call endProgram
  ; basic/basic.e16.ts:1471  return
  j .return
.L3:
  ; basic/basic.e16.ts:1473  startRun(from, from + 4)
  mv a0, s1
  addi a1, s1, 4
  call startRun
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1476 contStatement() at -O1
contStatement:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1477  if (contLine === 0) fail(E_CONT)
  lw t0, 0x0130(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1477  fail(E_CONT)
  li a0, 10
  call fail
.L1:
  ; basic/basic.e16.ts:1478  startRun(contLine, contTxt)
  lw t0, 0x0130(zero)
  lw t1, 0x0132(zero)
  mv a0, t0
  mv a1, t1
  call startRun
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1482 startRun(line, text) at -O1
;   line in s1
;   text in s2
startRun:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; line
  mv s2, a1 ; text
  ; basic/basic.e16.ts:1483  running = true
  li t0, 1
  sw t0, 0x012e(zero)
  ; basic/basic.e16.ts:1484  marks()
  call marks
  ; basic/basic.e16.ts:1485  jump(line, text)
  mv a0, s1
  mv a1, s2
  call jump
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:1489 listStatement() at -O1
;   from in s2
;   to in s3
;   at in s1
listStatement:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; basic/basic.e16.ts:1490  let from: u16 = 0
  li s2, 0 ; from
  ; basic/basic.e16.ts:1491  let to: u16 = 0xffff
  li s3, 65535 ; to
  ; basic/basic.e16.ts:1492  if (isDigit(next())) from = readUnsigned()
  call next
  call isDigit
  beqz a0, .L1
  ; basic/basic.e16.ts:1492  from = readUnsigned()
  call readUnsigned
  mv s2, a0 ; from
.L1:
  ; basic/basic.e16.ts:1493  if (next() === CH_MINUS) {
  call next
  li t0, 45
  bne a0, t0, .L2
  ; basic/basic.e16.ts:1494  step()
  call step
  ; basic/basic.e16.ts:1495  if (isDigit(next())) to = readUnsigned()
  call next
  call isDigit
  beqz a0, .L3
  ; basic/basic.e16.ts:1495  to = readUnsigned()
  call readUnsigned
  mv s3, a0 ; to
.L3:
.L2:
  ; basic/basic.e16.ts:1497  if (to < from) fail(E_ARGUMENT)
  bgeu s3, s2, .L4
  ; basic/basic.e16.ts:1497  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L4:
  ; basic/basic.e16.ts:1498  let at = findLine(from, false)
  mv a0, s2
  li a1, 0
  call findLine
  mv s1, a0 ; at
  ; basic/basic.e16.ts:1499  while (at !== 0 && peek16(at) !== 0 && peek16(at) <= to) {
  j .L7
.L5:
  ; basic/basic.e16.ts:1500  checkBreak()
  call checkBreak
  ; basic/basic.e16.ts:1501  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1502  printUnsigned(peek16(at))
  lw a0, 0(s1)
  call printUnsigned
  ; basic/basic.e16.ts:1503  putc(CH_SPACE)
  li a0, 32
  call putc
  ; basic/basic.e16.ts:1504  expand(at + 4, 0, 0)
  addi a0, s1, 4
  li a1, 0
  li a2, 0
  call expand
  ; basic/basic.e16.ts:1506  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1507  at += peek16(at + 2)
  lw t0, 2(s1)
  add s1, s1, t0
.L7:
  beq s1, zero, .L9
  lw t0, 0(s1)
  beq t0, zero, .L9
  lw t0, 0(s1)
  bgeu s3, t0, .L5
.L9:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:1514 run() at -O1
;   nextLine in s1
run:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1515  while (running) {
  j .L3
.L1:
  ; basic/basic.e16.ts:1516  if (jumping) {
  lw t0, 0x0134(zero)
  beqz t0, .L5
  ; basic/basic.e16.ts:1517  jumping = false
  sw zero, 0x0134(zero)
  ; basic/basic.e16.ts:1518  curLine = jumpLine
  lw t0, 0x0136(zero)
  sw t0, 0x0110(zero)
  ; basic/basic.e16.ts:1519  txt = jumpTxt
  lw t0, 0x0138(zero)
  sw t0, 0x010e(zero)
  j .L6
.L5:
  ; basic/basic.e16.ts:1521  const nextLine = curLine + peek16(curLine + 2)
  lw t0, 0x0110(zero)
  lw t1, 0x0110(zero)
  lw t1, 2(t1)
  add s1, t0, t1
  ; basic/basic.e16.ts:1522  if (peek16(nextLine) === 0) {
  lw t0, 0(s1)
  bne t0, zero, .L7
  ; basic/basic.e16.ts:1524  contLine = 0
  sw zero, 0x0130(zero)
  ; basic/basic.e16.ts:1525  running = false
  sw zero, 0x012e(zero)
  ; basic/basic.e16.ts:1526  break
  j .L4
.L7:
  ; basic/basic.e16.ts:1528  curLine = nextLine
  sw s1, 0x0110(zero)
  ; basic/basic.e16.ts:1529  txt = curLine + 4
  addi t0, s1, 4
  sw t0, 0x010e(zero)
.L6:
  ; basic/basic.e16.ts:1531  if (tracing && curLine !== 0) {
  lw t0, 0x0124(zero)
  beqz t0, .L8
  lw t0, 0x0110(zero)
  beq t0, zero, .L8
  ; basic/basic.e16.ts:1532  putc(CH_LBRACKET)
  li a0, 91
  call putc
  ; basic/basic.e16.ts:1533  printUnsigned(peek16(curLine))
  lw t0, 0x0110(zero)
  lw a0, 0(t0)
  call printUnsigned
  ; basic/basic.e16.ts:1534  putc(CH_RBRACKET)
  li a0, 93
  call putc
.L8:
  ; basic/basic.e16.ts:1537  if (curLine === 0) {
  lw t0, 0x0110(zero)
  bne t0, zero, .L9
  ; basic/basic.e16.ts:1538  statements()
  call statements
  ; basic/basic.e16.ts:1539  if (!jumping) running = false
  lw t0, 0x0134(zero)
  bnez t0, .L2
  ; basic/basic.e16.ts:1539  running = false
  sw zero, 0x012e(zero)
  ; basic/basic.e16.ts:1540  continue
  j .L2
.L9:
  ; basic/basic.e16.ts:1542  statements()
  call statements
.L2:
.L3:
  lw t0, 0x012e(zero)
  bnez t0, .L1
.L4:
  ; basic/basic.e16.ts:1544  stopRunning()
  call stopRunning
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1548 isCalculation() at -O1
;   c in s2
;   save in s0
;   depth/assigns in s1
;   d in s3
isCalculation:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  ; basic/basic.e16.ts:1549  const c = next()
  call next
  mv s2, a0 ; c
  ; basic/basic.e16.ts:1552  if (c >= 0x80) return u16(c - T_SIN) <= T_LCDH - T_SIN || u16(c - T_SPACES) <= T_STRING - T_SPACES
  li t0, 128
  bltu s2, t0, .L1
  ; basic/basic.e16.ts:1552  return u16(c - T_SIN) <= T_LCDH - T_SIN || u16(c - T_SPACES) <= T_STRING - T_SPACES
  li t0, 34
  addi t1, s2, -180
  sltu t1, t0, t1
  xori t1, t1, 1
  mv t0, t1
  xor t0, t0, t1
  xor t1, t1, t0
  xor t0, t0, t1
  bnez t1, .L2
  li t0, 1
  addi t1, s2, -223
  sltu t1, t0, t1
  xori t0, t1, 1
.L2:
  mv a0, t0
  j .return
.L1:
  ; basic/basic.e16.ts:1553  if (!isLetter(c)) return c !== 0
  mv a0, s2
  call isLetter
  bnez a0, .L3
  ; basic/basic.e16.ts:1553  return c !== 0
  sub t0, s2, zero
  snez a0, t0
  j .return
.L3:
  ; basic/basic.e16.ts:1554  const save = txt
  lw s0, 0x010e(zero)
  ; basic/basic.e16.ts:1555  readName()
  call readName
  ; basic/basic.e16.ts:1557  if (next() === CH_LPAREN) {
  call next
  li t0, 40
  bne a0, t0, .L4
  ; basic/basic.e16.ts:1558  let depth: u16 = 0
  li s1, 0 ; depth/assigns
  ; basic/basic.e16.ts:1559  do {
.L5:
  ; basic/basic.e16.ts:1560  const d = peek(txt)
  lw t0, 0x010e(zero)
  lbu s3, 0(t0)
  ; basic/basic.e16.ts:1561  if (d === CH_LPAREN) depth++
  li t0, 40
  bne s3, t0, .L8
  ; basic/basic.e16.ts:1561  depth++
  addi s1, s1, 1
  j .L9
.L8:
  ; basic/basic.e16.ts:1562  if (d === CH_RPAREN) depth--
  li t0, 41
  bne s3, t0, .L10
  ; basic/basic.e16.ts:1562  depth--
  addi s1, s1, -1
  j .L11
.L10:
  ; basic/basic.e16.ts:1563  if (d === 0) break
  bne s3, zero, .L12
  ; basic/basic.e16.ts:1563  break
  j .L7
.L12:
.L11:
.L9:
  ; basic/basic.e16.ts:1564  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  bltu zero, s1, .L5
.L7:
.L4:
  ; basic/basic.e16.ts:1567  const assigns = next() === CH_EQ
  call next
  li t0, 61
  sub t0, a0, t0
  seqz s1, t0
  ; basic/basic.e16.ts:1568  txt = save
  sw s0, 0x010e(zero)
  ; basic/basic.e16.ts:1569  return !assigns
  seqz a0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:1573 calculate() at -O1
;   n in s2
;   cols in s3
;   pad in s1
calculate:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; basic/basic.e16.ts:1574  expr()
  call expr
  ; basic/basic.e16.ts:1575  if (next() !== 0) fail(E_SYNTAX)
  call next
  beq a0, zero, .L1
  ; basic/basic.e16.ts:1575  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:1577  const n = strType ? stringLength(top()) : formatTop()
  lw t0, 0x0118(zero)
  beqz t0, .L2
  call top
  call stringLength
  mv t0, a0
  j .L3
.L2:
  call formatTop
  mv t0, a0
.L3:
  mv s2, t0 ; n
  ; basic/basic.e16.ts:1578  if (!strType) copy8(top(), addr(ans))
  lw t0, 0x0118(zero)
  bnez t0, .L4
  ; basic/basic.e16.ts:1578  copy8(top(), addr(ans))
  call top
  la a1, ans
  call copy8
.L4:
  ; basic/basic.e16.ts:1579  const cols = peek16(COLS)
  lw s3, 4(zero)
  ; basic/basic.e16.ts:1580  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1581  let pad: i16 = i16(cols - n - 1)
  sub t0, s3, s2
  addi s1, t0, -1
  ; basic/basic.e16.ts:1582  while (pad > 0) {
  j .L7
.L5:
  ; basic/basic.e16.ts:1583  putc(CH_SPACE)
  li a0, 32
  call putc
  ; basic/basic.e16.ts:1584  pad--
  addi s1, s1, -1
.L7:
  blt zero, s1, .L5
  ; basic/basic.e16.ts:1586  if (strType) outString(top())
  lw t0, 0x0118(zero)
  beqz t0, .L9
  ; basic/basic.e16.ts:1586  outString(top())
  call top
  call outString
  j .L10
.L9:
  ; basic/basic.e16.ts:1587  puts(addr(textOut))
  la a0, textOut
  call puts
.L10:
  ; basic/basic.e16.ts:1588  newline()
  call newline
  ; basic/basic.e16.ts:1589  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:1597 storeTypedLine(keep) at -O1
;   keep in s3
;   length in s0
;   n in s1
;   rest in s2
storeTypedLine:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  mv s3, a0 ; keep
  ; basic/basic.e16.ts:1598  const length = tokenize(addr(lineBuf), addr(tokens))
  la a0, lineBuf
  la a1, tokens
  call tokenize
  mv s0, a0 ; length
  ; basic/basic.e16.ts:1599  txt = addr(tokens)
  la t0, tokens
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1600  if (!isDigit(next())) return 0
  call next
  call isDigit
  bnez a0, .L1
  ; basic/basic.e16.ts:1600  return 0
  li a0, 0
  j .return
.L1:
  ; basic/basic.e16.ts:1601  const n = readUnsigned()
  call readUnsigned
  mv s1, a0 ; n
  ; basic/basic.e16.ts:1602  if (n === 0 || next() === 0) return 0
  beq s1, zero, .L3
  call next
  bne a0, zero, .L2
.L3:
  ; basic/basic.e16.ts:1602  return 0
  li a0, 0
  j .return
.L2:
  ; basic/basic.e16.ts:1603  const rest = length - (txt - addr(tokens))
  lw t0, 0x010e(zero)
  la t1, tokens
  sub t0, t0, t1
  sub s2, s0, t0
  ; basic/basic.e16.ts:1604  if (keep) storeLine(n, txt, rest)
  beqz s3, .L4
  ; basic/basic.e16.ts:1604  storeLine(n, txt, rest)
  lw t0, 0x010e(zero)
  mv a0, s1
  mv a1, t0
  mv a2, s2
  call storeLine
  j .L5
.L4:
  ; basic/basic.e16.ts:1605  checkLength(n, txt)
  lw t0, 0x010e(zero)
  mv a0, s1
  mv a1, t0
  la t0, checkLength
  li t1, 3
  call far_call
.L5:
  ; basic/basic.e16.ts:1606  return (4 + rest + 1) & 0xfffe
  addi t0, s2, 5
  andi a0, t0, -2
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:1610 enter() at -O1
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
  ; basic/basic.e16.ts:1611  const length = tokenize(addr(lineBuf), addr(tokens))
  la a0, lineBuf
  la a1, tokens
  call tokenize
  mv s3, a0 ; length
  ; basic/basic.e16.ts:1612  txt = addr(tokens)
  la t0, tokens
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1613  curLine = 0
  sw zero, 0x0110(zero)
  ; basic/basic.e16.ts:1614  if (isDigit(next())) {
  call next
  call isDigit
  beqz a0, .L1
  ; basic/basic.e16.ts:1615  const save = txt
  lw s0, 0x010e(zero)
  ; basic/basic.e16.ts:1616  const n = readUnsigned()
  call readUnsigned
  mv s1, a0 ; n
  ; basic/basic.e16.ts:1617  const c = next()
  call next
  mv s2, a0 ; c
  ; basic/basic.e16.ts:1619  if (autoLine !== 0 && c === 0) {
  lw t0, 0x0126(zero)
  beq t0, zero, .L2
  bne s2, zero, .L2
  ; basic/basic.e16.ts:1620  autoLine = 0
  sw zero, 0x0126(zero)
  ; basic/basic.e16.ts:1621  return
  j .return
.L2:
  ; basic/basic.e16.ts:1624  if (n !== 0 && (isLetter(c) || c >= 0x80 || (c === 0 && proMode))) {
  beq s1, zero, .L3
  mv a0, s2
  call isLetter
  bnez a0, .L4
  li t0, 128
  bgeu s2, t0, .L4
  bne s2, zero, .L3
  lw t0, 0x013a(zero)
  beqz t0, .L3
.L4:
  ; basic/basic.e16.ts:1626  checkLength(n, txt)
  lw t0, 0x010e(zero)
  mv a0, s1
  mv a1, t0
  la t0, checkLength
  li t1, 3
  call far_call
  ; basic/basic.e16.ts:1627  storeLine(n, txt, length - (txt - addr(tokens)))
  lw t0, 0x010e(zero)
  lw t1, 0x010e(zero)
  la t2, tokens
  sub t1, t1, t2
  sub t1, s3, t1
  mv a0, s1
  mv a1, t0
  mv a2, t1
  call storeLine
  ; basic/basic.e16.ts:1628  recallNo = n
  sw s1, 0x013e(zero)
  ; basic/basic.e16.ts:1629  justStored = true
  li t0, 1
  sw t0, 0x0140(zero)
  ; basic/basic.e16.ts:1630  if (autoLine !== 0) autoLine = n + autoStep
  lw t0, 0x0126(zero)
  beq t0, zero, .L5
  ; basic/basic.e16.ts:1630  autoLine = n + autoStep
  lw t0, 0x0128(zero)
  add t0, s1, t0
  sw t0, 0x0126(zero)
.L5:
  ; basic/basic.e16.ts:1631  return
  j .return
.L3:
  ; basic/basic.e16.ts:1633  txt = save
  sw s0, 0x010e(zero)
.L1:
  ; basic/basic.e16.ts:1635  if (isCalculation()) {
  call isCalculation
  beqz a0, .L6
  ; basic/basic.e16.ts:1637  strTop = 0
  sw zero, 0x04f4(zero)
  ; basic/basic.e16.ts:1638  calculate()
  call calculate
  ; basic/basic.e16.ts:1639  return
  j .return
.L6:
  ; basic/basic.e16.ts:1641  jumping = false
  sw zero, 0x0134(zero)
  ; basic/basic.e16.ts:1642  running = false
  sw zero, 0x012e(zero)
  ; basic/basic.e16.ts:1643  statements()
  call statements
  ; basic/basic.e16.ts:1644  if (jumping) {
  lw t0, 0x0134(zero)
  beqz t0, .L7
  ; basic/basic.e16.ts:1645  running = true
  li t0, 1
  sw t0, 0x012e(zero)
  ; basic/basic.e16.ts:1646  marks()
  call marks
  ; basic/basic.e16.ts:1647  run()
  call run
.L7:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:1652 basicLoop() at -O1
;   length in s2
;   prompt in s3
;   recalls in s0
;   n in s1
basicLoop:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  ; basic/basic.e16.ts:1653  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:1654  running = false
  sw zero, 0x012e(zero)
  ; basic/basic.e16.ts:1655  marks()
  call marks
  ; basic/basic.e16.ts:1657  let length: u16 = 0
  li s2, 0 ; length
  ; basic/basic.e16.ts:1658  let prompt = true
  li s3, 1 ; prompt
  ; basic/basic.e16.ts:1659  for (;;) {
.L1:
  ; basic/basic.e16.ts:1660  if (prompt) {
  beqz s3, .L5
  ; basic/basic.e16.ts:1661  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1662  putc(CH_GT)
  li a0, 62
  call putc
.L5:
  ; basic/basic.e16.ts:1664  prompt = true
  li s3, 1 ; prompt
  ; basic/basic.e16.ts:1665  if (length === 0) length = autoPrefix()
  bne s2, zero, .L6
  ; basic/basic.e16.ts:1665  length = autoPrefix()
  call autoPrefix
  mv s2, a0 ; length
.L6:
  ; basic/basic.e16.ts:1667  let recalls: u16 = 0
  li s0, 0 ; recalls
  ; basic/basic.e16.ts:1668  if (proMode) recalls = EDIT_RECALLS_UP | EDIT_RECALLS_DOWN
  lw t0, 0x013a(zero)
  beqz t0, .L7
  ; basic/basic.e16.ts:1668  recalls = EDIT_RECALLS_UP | EDIT_RECALLS_DOWN
  li s0, 3 ; recalls
  j .L8
.L7:
  ; basic/basic.e16.ts:1669  if (lastLength > 0) recalls = EDIT_RECALLS_UP
  lw t0, 0x0142(zero)
  bgeu zero, t0, .L9
  ; basic/basic.e16.ts:1669  recalls = EDIT_RECALLS_UP
  li s0, 1 ; recalls
.L9:
.L8:
  ; basic/basic.e16.ts:1670  const n: i16 = editLine(addr(lineBuf), LINE_MAX, length, recalls)
  la a0, lineBuf
  li a1, 78
  mv a2, s2
  mv a3, s0
  call editLine
  mv s1, a0 ; n
  ; basic/basic.e16.ts:1671  length = 0
  li s2, 0 ; length
  ; basic/basic.e16.ts:1672  if (n === EDIT_UP || n === EDIT_DOWN) {
  li t0, 65532
  beq s1, t0, .L11
  li t0, 65531
  bne s1, t0, .L10
.L11:
  ; basic/basic.e16.ts:1673  length = recall(n === EDIT_UP)
  li t0, 65532
  sub t0, s1, t0
  seqz a0, t0
  call recall
  mv s2, a0 ; length
  ; basic/basic.e16.ts:1674  prompt = false
  li s3, 0 ; prompt
  ; basic/basic.e16.ts:1675  continue
  j .L1
.L10:
  ; basic/basic.e16.ts:1677  edited(n)
  mv a0, s1
  call edited
  ; basic/basic.e16.ts:1679  if (n === EDIT_MODE || n === EDIT_BRK) prompt = false
  li t0, 65533
  beq s1, t0, .L13
  li t0, 65534
  bne s1, t0, .L1
.L13:
  ; basic/basic.e16.ts:1679  prompt = false
  li s3, 0 ; prompt
  j .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:1684 autoPrefix() at -O1
;   n in s1
autoPrefix:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1685  if (autoLine === 0) return 0
  lw t0, 0x0126(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1685  return 0
  li a0, 0
  j .return
.L1:
  ; basic/basic.e16.ts:1686  const n = unsignedText(autoLine, addr(lineBuf))
  lw a0, 0x0126(zero)
  la a1, lineBuf
  call unsignedText
  mv s1, a0 ; n
  ; basic/basic.e16.ts:1687  poke(addr(lineBuf) + n, CH_SPACE)
  li t0, 32
  sb t0, lineBuf(s1)
  ; basic/basic.e16.ts:1688  return n + 1
  addi a0, s1, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1692 edited(n) at -O1
;   n in s1
edited:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; basic/basic.e16.ts:1693  if (n < 0) autoLine = 0
  bge s1, zero, .L1
  ; basic/basic.e16.ts:1693  autoLine = 0
  sw zero, 0x0126(zero)
.L1:
  ; basic/basic.e16.ts:1694  if (n === EDIT_MODE) {
  li t0, 65533
  bne s1, t0, .L2
  ; basic/basic.e16.ts:1695  proMode = !proMode
  lw t0, 0x013a(zero)
  seqz t0, t0
  sw t0, 0x013a(zero)
  ; basic/basic.e16.ts:1696  marks()
  call marks
  ; basic/basic.e16.ts:1697  return
  j .return
.L2:
  ; basic/basic.e16.ts:1700  if (n < 0) return
  bge s1, zero, .L3
  ; basic/basic.e16.ts:1700  return
  j .return
.L3:
  ; basic/basic.e16.ts:1702  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1703  if (n === 0) return
  bne s1, zero, .L4
  ; basic/basic.e16.ts:1703  return
  j .return
.L4:
  ; basic/basic.e16.ts:1704  move(addr(lineBuf), addr(lastLine), u16(n))
  la a0, lineBuf
  la a1, lastLine
  mv a2, s1
  call move
  ; basic/basic.e16.ts:1705  lastLength = u16(n)
  sw s1, 0x0142(zero)
  ; basic/basic.e16.ts:1706  enter()
  call enter
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1714 recall(up) at -O1
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
  ; basic/basic.e16.ts:1715  if (!proMode) {
  lw t0, 0x013a(zero)
  bnez t0, .L1
  ; basic/basic.e16.ts:1716  if (!up) return 0
  bnez s3, .L2
  ; basic/basic.e16.ts:1716  return 0
  li a0, 0
  j .return
.L2:
  ; basic/basic.e16.ts:1717  move(addr(lastLine), addr(lineBuf), lastLength)
  lw t0, 0x0142(zero)
  la a0, lastLine
  la a1, lineBuf
  mv a2, t0
  call move
  ; basic/basic.e16.ts:1718  return lastLength
  lw a0, 0x0142(zero)
  j .return
.L1:
  ; basic/basic.e16.ts:1720  let at: u16 = 0
  li s1, 0 ; at
  ; basic/basic.e16.ts:1721  if (up && justStored) at = findLine(recallNo, true)
  beqz s3, .L3
  lw t0, 0x0140(zero)
  beqz t0, .L3
  ; basic/basic.e16.ts:1721  at = findLine(recallNo, true)
  lw a0, 0x013e(zero)
  li a1, 1
  call findLine
  mv s1, a0 ; at
.L3:
  ; basic/basic.e16.ts:1722  justStored = false
  sw zero, 0x0140(zero)
  ; basic/basic.e16.ts:1723  if (at === 0) at = neighbour(up)
  bne s1, zero, .L4
  ; basic/basic.e16.ts:1723  at = neighbour(up)
  mv a0, s3
  call neighbour
  mv s1, a0 ; at
.L4:
  ; basic/basic.e16.ts:1724  if (at === 0) at = findLine(recallNo, true)
  bne s1, zero, .L5
  ; basic/basic.e16.ts:1724  at = findLine(recallNo, true)
  lw a0, 0x013e(zero)
  li a1, 1
  call findLine
  mv s1, a0 ; at
.L5:
  ; basic/basic.e16.ts:1725  if (at === 0) return 0
  bne s1, zero, .L6
  ; basic/basic.e16.ts:1725  return 0
  li a0, 0
  j .return
.L6:
  ; basic/basic.e16.ts:1726  recallNo = peek16(at)
  lw t0, 0(s1)
  sw t0, 0x013e(zero)
  ; basic/basic.e16.ts:1727  const digits = unsignedText(recallNo, addr(lineBuf))
  mv a0, t0
  la a1, lineBuf
  call unsignedText
  mv s2, a0 ; digits
  ; basic/basic.e16.ts:1728  poke(addr(lineBuf) + digits, CH_SPACE)
  li t0, 32
  sb t0, lineBuf(s2)
  ; basic/basic.e16.ts:1729  return digits + 1 + expand(at + 4, addr(lineBuf) + digits + 1, LINE_MAX - digits - 1)
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

; basic/basic.e16.ts:1733 neighbour(up) at -O1
;   up in a0
;   at in a1
;   found in a2
;   n in a3
neighbour:
  ; basic/basic.e16.ts:1734  let at = PROG
  li a1, 2048 ; at
  ; basic/basic.e16.ts:1735  let found: u16 = 0
  li a2, 0 ; found
  ; basic/basic.e16.ts:1736  while (peek16(at) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:1737  const n = peek16(at)
  lw a3, 0(a1)
  ; basic/basic.e16.ts:1738  if (!up && n > recallNo) return at
  bnez a0, .L5
  lw t0, 0x013e(zero)
  bgeu t0, a3, .L5
  ; basic/basic.e16.ts:1738  return at
  mv a0, a1
  ret
.L5:
  ; basic/basic.e16.ts:1739  if (up && (recallNo === 0 || n < recallNo)) found = at
  beqz a0, .L6
  lw t0, 0x013e(zero)
  beq t0, zero, .L7
  lw t0, 0x013e(zero)
  bgeu a3, t0, .L6
.L7:
  ; basic/basic.e16.ts:1739  found = at
  mv a2, a1 ; found
.L6:
  ; basic/basic.e16.ts:1740  at += peek16(at + 2)
  lw t0, 2(a1)
  add a1, a1, t0
.L3:
  lw t0, 0(a1)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1742  return found
  mv a0, a2
.return:
  ret

; basic/basic.e16.ts:1745 showBanner() at -O1
showBanner:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1746  puts(str('ELEC-16 BASIC 1.0'))
  la a0, str_28
  call puts
  ; basic/basic.e16.ts:1747  newline()
  call newline
  ; basic/basic.e16.ts:1748  printUnsigned(LIMIT - varEnd)
  lw t0, 0x0114(zero)
  li t1, 28672
  sub a0, t1, t0
  call printUnsigned
  ; basic/basic.e16.ts:1749  puts(str(' BYTES FREE'))
  la a0, str_29
  call puts
  ; basic/basic.e16.ts:1750  newline()
  call newline
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1754 basicCold() at -O1
basicCold:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1755  poke16(INBASIC, 1)
  li t0, 1
  sw t0, 28(zero)
  ; basic/basic.e16.ts:1756  poke16(BRKFLAG, 0)
  sw zero, 30(zero)
  ; basic/basic.e16.ts:1758  keepProgramTo(keptProgramEnd())
  call keptProgramEnd
  call keepProgramTo
  ; basic/basic.e16.ts:1759  poke16(MATH_ANGLE, 0)
  li t0, 65372
  sw zero, 0(t0)
  ; basic/basic.e16.ts:1760  angleMarks = ANN_DEG
  li t0, 128
  sw t0, 0x013c(zero)
  ; basic/basic.e16.ts:1761  proMode = false
  sw zero, 0x013a(zero)
  ; basic/basic.e16.ts:1762  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1763  showBanner()
  call showBanner
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1767 basicWarm() at -O1
basicWarm:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1768  poke16(INBASIC, 1)
  li t0, 1
  sw t0, 28(zero)
  ; basic/basic.e16.ts:1769  poke16(BRKFLAG, 0)
  sw zero, 30(zero)
  ; basic/basic.e16.ts:1770  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1771  showBanner()
  call showBanner
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

str_0:
  .byte 82, 85, 78, 32, 76, 73, 83, 84, 32, 78, 69, 87, 32, 67, 79, 78, 84, 32, 80, 82, 73, 78, 84, 32, 73, 78, 80, 85, 84, 32, 76, 69, 84, 32, 73, 70, 32, 84, 72, 69, 78, 32, 69, 76, 83, 69, 32, 70, 79, 82, 32, 84, 79, 32, 83, 84, 69, 80, 32, 78, 69, 88, 84, 32, 71, 79, 84, 79, 32, 71, 79, 83, 85, 66, 32, 82, 69, 84, 85, 82, 78, 32, 69, 78, 68, 32, 83, 84, 79, 80, 32, 82, 69, 77, 32, 77, 79, 78, 32, 67, 76, 83, 32, 68, 69, 71, 32, 82, 65, 68, 32, 71, 82, 65, 68, 32, 80, 79, 75, 69, 32, 67, 65, 76, 76, 32, 87, 65, 73, 84, 32, 66, 69, 69, 80, 32, 68, 73, 77, 32, 68, 65, 84, 65, 32, 82, 69, 65, 68, 32, 82, 69, 83, 84, 79, 82, 69, 32, 79, 78, 32, 67, 76, 69, 65, 82, 32, 65, 85, 84, 79, 32, 82, 69, 78, 85, 77, 32, 68, 69, 76, 69, 84, 69, 32, 84, 82, 79, 78, 32, 84, 82, 79, 70, 70, 32, 70, 73, 76, 69, 83, 32, 76, 79, 65, 68, 32, 83, 65, 86, 69, 32, 75, 73, 76, 76, 32, 76, 79, 67, 65, 84, 69, 32, 67, 85, 82, 83, 79, 82, 32, 80, 83, 69, 84, 32, 80, 82, 69, 83, 69, 84, 32, 76, 73, 78, 69, 32, 71, 80, 82, 73, 78, 84, 32, 79, 80, 69, 78, 32, 67, 76, 79, 83, 69, 32, 83, 73, 78, 32, 67, 79, 83, 32, 84, 65, 78, 32, 65, 83, 73, 78, 32, 65, 67, 79, 83, 32, 65, 84, 65, 78, 32, 83, 81, 82, 32, 65, 66, 83, 32, 73, 78, 84, 32, 83, 71, 78, 32, 76, 79, 71, 32, 76, 78, 32, 69, 88, 80, 32, 82, 78, 68, 32, 80, 73, 32, 65, 78, 83, 32, 80, 69, 69, 75, 32, 80, 79, 73, 78, 84, 32, 78, 79, 84, 32, 65, 78, 68, 32, 79, 82, 32, 76, 69, 78, 32, 76, 69, 70, 84, 36, 32, 77, 73, 68, 36, 32, 82, 73, 71, 72, 84, 36, 32, 67, 72, 82, 36, 32, 65, 83, 67, 32, 83, 84, 82, 36, 32, 86, 65, 76, 32, 73, 78, 75, 69, 89, 36, 32, 84, 73, 77, 69, 36, 32, 68, 65, 84, 69, 36, 32, 69, 79, 70, 32, 76, 67, 68, 87, 32, 76, 67, 68, 72, 32, 79, 70, 70, 32, 65, 83, 32, 79, 85, 84, 80, 85, 84, 32, 65, 80, 80, 69, 78, 68, 32, 67, 73, 82, 67, 76, 69, 32, 65, 83, 75, 32, 84, 89, 80, 69, 32, 77, 79, 68, 32, 83, 80, 65, 67, 69, 36, 32, 83, 84, 82, 73, 78, 71, 36, 0
str_1:
  .byte 22, 23, 24, 25, 26, 27, 21, 17, 18, 20, 29, 28, 30, 0
str_3:
  .byte 83, 89, 78, 84, 65, 88, 0
str_4:
  .byte 79, 86, 69, 82, 70, 76, 79, 87, 0
str_5:
  .byte 68, 73, 86, 32, 66, 89, 32, 48, 0
str_6:
  .byte 65, 82, 71, 85, 77, 69, 78, 84, 0
str_7:
  .byte 78, 79, 32, 76, 73, 78, 69, 0
str_8:
  .byte 78, 69, 88, 84, 0
str_9:
  .byte 82, 69, 84, 85, 82, 78, 0
str_10:
  .byte 77, 69, 77, 79, 82, 89, 0
str_11:
  .byte 84, 79, 79, 32, 67, 79, 77, 80, 76, 69, 88, 0
str_12:
  .byte 67, 79, 78, 84, 0
str_13:
  .byte 84, 89, 80, 69, 0
str_14:
  .byte 78, 79, 32, 70, 73, 76, 69, 0
str_15:
  .byte 67, 65, 82, 68, 0
str_16:
  .byte 78, 79, 32, 68, 65, 84, 65, 0
str_17:
  .byte 73, 78, 68, 69, 88, 0
str_18:
  .byte 68, 73, 77, 0
str_19:
  .byte 76, 73, 78, 75, 0
str_20:
  .byte 76, 73, 78, 75, 32, 79, 70, 70, 0
str_21:
  .byte 76, 73, 78, 75, 32, 72, 69, 76, 68, 0
str_22:
  .byte 84, 79, 79, 32, 76, 79, 78, 71, 0
str_23:
  .byte 70, 73, 76, 69, 0
str_24:
  .byte 32, 73, 78, 32, 0
str_25:
  .byte 69, 82, 82, 58, 0
str_26:
  .byte 66, 82, 69, 65, 75, 0
str_27:
  .byte 83, 84, 79, 80, 0
str_28:
  .byte 69, 76, 69, 67, 45, 49, 54, 32, 66, 65, 83, 73, 67, 32, 49, 46, 48, 0
str_29:
  .byte 32, 66, 89, 84, 69, 83, 32, 70, 82, 69, 69, 0
  .align 2
e16c_fixed_end:

  .bank 0
  .org 0xc000
; basic/strings.e16.ts:158 index() at -O1
;   i in s1
index:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/strings.e16.ts:159  needNumber()
  call needNumber
  ; basic/strings.e16.ts:160  const i = toInt(top())
  call top
  call toInt
  mv s1, a0 ; i
  ; basic/strings.e16.ts:161  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:162  if (i < 0) fail(E_INDEX)
  bge s1, zero, .L1
  ; basic/strings.e16.ts:162  fail(E_INDEX)
  li a0, 15
  call fail
.L1:
  ; basic/strings.e16.ts:163  return u16(i)
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/strings.e16.ts:171 dimension(kind, d1, d2, room) at -O1
;   kind in 0(fp)
;   d1 in s1
;   d2 in s2
;   room in 2(fp)
;   each in 4(fp)
;   count in 6(fp)
;   rec in s3
dimension:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 0(fp) ; kind
  mv s1, a1 ; d1
  mv s2, a2 ; d2
  sw a3, 2(fp) ; room
  ; basic/strings.e16.ts:172  const each: u16 = (kind & K_STRING) !== 0 ? room + 1 : 8
  lw t0, 0(fp) ; kind
  andi t0, t0, 1
  beq t0, zero, .L1
  lw t0, 2(fp) ; room
  addi t0, t0, 1
  j .L2
.L1:
  li t0, 8
.L2:
  sw t0, 4(fp) ; each
  ; basic/strings.e16.ts:173  const count = (d1 + 1) * (d2 + 1)
  addi t0, s2, 1
  addi t1, s1, 1
  mul t1, t1, t0
  sw t1, 6(fp) ; count
  ; basic/strings.e16.ts:175  if (d1 >= 0x7fff || d2 >= 0x7fff || d2 + 1 > div(0x7fff, d1 + 1) || count > div(0x7ff0, each))
  li t0, 32767
  bgeu s1, t0, .L4
  li t0, 32767
  bgeu s2, t0, .L4
  addi t0, s1, 1
  li t1, 32767
  divu t1, t1, t0
  addi t0, s2, 1
  bltu t1, t0, .L4
  lw t0, 4(fp) ; each
  li t1, 32752
  divu t1, t1, t0
  lw t0, 6(fp) ; count
  bgeu t1, t0, .L3
.L4:
  ; basic/strings.e16.ts:176  fail(E_MEMORY)
  li a0, 8
  call fail
.L3:
  ; basic/strings.e16.ts:177  const rec = newRecord(kind, room, (VAR_HEAD + 4 + count * each + 1) & 0xfffe)
  lw t0, 4(fp) ; each
  lw t1, 6(fp) ; count
  mul t1, t1, t0
  addi t1, t1, 11
  andi t1, t1, -2
  lw a0, 0(fp)
  lw a1, 2(fp)
  mv a2, t1
  call newRecord
  mv s3, a0 ; rec
  ; basic/strings.e16.ts:178  poke16(rec + VAR_HEAD, d1)
  sw s1, 6(s3)
  ; basic/strings.e16.ts:179  poke16(rec + VAR_HEAD + 2, d2)
  sw s2, 8(s3)
  ; basic/strings.e16.ts:180  return rec
  mv a0, s3
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; basic/strings.e16.ts:184 kindOf(strings, two) at -O1
;   strings in a0
;   two in a1
kindOf:
  ; basic/strings.e16.ts:185  return K_ARRAY | (strings ? K_STRING : 0) | (two ? K_TWO : 0)
  li t0, 2
  mv t1, a0
  beqz t1, .L1
  li t1, 1
  j .L2
.L1:
  li t1, 0
.L2:
  or t0, t0, t1
  mv t1, a1
  beqz t1, .L3
  li t1, 4
  j .L4
.L3:
  li t1, 0
.L4:
  or a0, t0, t1
.return:
  ret

; basic/strings.e16.ts:192 elementAt() at -O1
;   key in 8(fp)
;   strings in s2
;   i in 2(fp)
;   j in 0(fp)
;   two in s3
;   rec in s1
;   d1 in 10(fp)
;   d2 in 4(fp)
;   hasTwo in 12(fp)
;   room in 6(fp)
;   each in 14(fp)
elementAt:
  addi sp, sp, -26
  sw ra, 16(sp)
  sw s2, 18(sp)
  sw s3, 20(sp)
  sw s1, 22(sp)
  sw s0, 24(sp)
  mv fp, sp
  ; basic/strings.e16.ts:193  const key = nameKey()
  call nameKey
  sw a0, 8(fp) ; key
  ; basic/strings.e16.ts:194  const strings = nameIsString
  lw s2, 0x061a(zero)
  ; basic/strings.e16.ts:195  step()
  call step
  ; basic/strings.e16.ts:196  expr()
  call expr
  ; basic/strings.e16.ts:197  const i = index()
  call index
  sw a0, 2(fp) ; i
  ; basic/strings.e16.ts:198  let j: u16 = 0
  sw zero, 0(fp) ; j
  ; basic/strings.e16.ts:199  let two = false
  li s3, 0 ; two
  ; basic/strings.e16.ts:200  if (next() === CH_COMMA) {
  call next
  li t0, 44
  bne a0, t0, .L1
  ; basic/strings.e16.ts:201  step()
  call step
  ; basic/strings.e16.ts:202  expr()
  call expr
  ; basic/strings.e16.ts:203  j = index()
  call index
  sw a0, 0(fp) ; j
  ; basic/strings.e16.ts:204  two = true
  li s3, 1 ; two
.L1:
  ; basic/strings.e16.ts:206  expect(CH_RPAREN)
  li a0, 41
  call expect
  ; basic/strings.e16.ts:207  setNameKey(key)
  lw a0, 8(fp)
  call setNameKey
  ; basic/strings.e16.ts:208  let rec = findRecord(K_ARRAY | (strings ? K_STRING : 0))
  li t0, 2
  mv t1, s2
  beqz t1, .L2
  li t1, 1
  j .L3
.L2:
  li t1, 0
.L3:
  or a0, t0, t1
  call findRecord
  mv s1, a0 ; rec
  ; basic/strings.e16.ts:209  if (rec === 0) rec = dimension(kindOf(strings, two), 10, two ? 10 : 0, strings ? STRING_ROOM : 0)
  bne s1, zero, .L4
  ; basic/strings.e16.ts:209  rec = dimension(kindOf(strings, two), 10, two ? 10 : 0, strings ? STRING_ROOM : 0)
  mv a0, s2
  mv a1, s3
  call kindOf
  mv t0, a0
  li t1, 10
  mv t2, s3
  beqz t2, .L5
  li t2, 10
  j .L6
.L5:
  li t2, 0
.L6:
  mv t3, s2
  beqz t3, .L7
  li t3, 16
  j .L8
.L7:
  li t3, 0
.L8:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  call dimension
  mv s1, a0 ; rec
.L4:
  ; basic/strings.e16.ts:210  const d1 = peek16(rec + VAR_HEAD)
  lw t0, 6(s1)
  sw t0, 10(fp) ; d1
  ; basic/strings.e16.ts:211  const d2 = peek16(rec + VAR_HEAD + 2)
  lw t0, 8(s1)
  sw t0, 4(fp) ; d2
  ; basic/strings.e16.ts:212  const hasTwo = (peek(rec + 2) & K_TWO) !== 0
  lbu t0, 2(s1)
  andi t0, t0, 4
  sub t0, t0, zero
  snez t0, t0
  sw t0, 12(fp) ; hasTwo
  ; basic/strings.e16.ts:213  if (hasTwo !== two || i > d1 || j > d2) fail(E_INDEX)
  lw t0, 12(fp) ; hasTwo
  bne t0, s3, .L10
  lw t0, 10(fp) ; d1
  lw t1, 2(fp) ; i
  bltu t0, t1, .L10
  lw t0, 4(fp) ; d2
  lw t1, 0(fp) ; j
  bgeu t0, t1, .L9
.L10:
  ; basic/strings.e16.ts:213  fail(E_INDEX)
  li a0, 15
  call fail
.L9:
  ; basic/strings.e16.ts:214  const room = peek(rec + 3)
  lbu t0, 3(s1)
  sw t0, 6(fp) ; room
  ; basic/strings.e16.ts:215  setVarRoom(room)
  lw a0, 6(fp)
  call setVarRoom
  ; basic/strings.e16.ts:216  setStrType(strings)
  mv a0, s2
  call setStrType
  ; basic/strings.e16.ts:217  const each: u16 = strings ? room + 1 : 8
  beqz s2, .L11
  lw t0, 6(fp) ; room
  addi t0, t0, 1
  j .L12
.L11:
  li t0, 8
.L12:
  sw t0, 14(fp) ; each
  ; basic/strings.e16.ts:218  return rec + VAR_HEAD + 4 + (i * (d2 + 1) + j) * each
  lw t0, 4(fp) ; d2
  addi t0, t0, 1
  lw t1, 2(fp) ; i
  mul t1, t1, t0
  lw t0, 0(fp) ; j
  add t1, t1, t0
  lw t0, 14(fp) ; each
  mul t1, t1, t0
  addi t0, s1, 10
  add a0, t0, t1
.return:
  mv sp, fp
  lw ra, 16(sp)
  lw s2, 18(sp)
  lw s3, 20(sp)
  lw s1, 22(sp)
  lw s0, 24(sp)
  addi sp, sp, 26
  ret

; basic/strings.e16.ts:222 roomOf() at -O1
;   room in s1
roomOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/strings.e16.ts:223  if (next() !== CH_STAR) return STRING_ROOM
  call next
  li t0, 42
  beq a0, t0, .L1
  ; basic/strings.e16.ts:223  return STRING_ROOM
  li a0, 16
  j .return
.L1:
  ; basic/strings.e16.ts:224  step()
  call step
  ; basic/strings.e16.ts:225  const room = readUnsigned()
  call readUnsigned
  mv s1, a0 ; room
  ; basic/strings.e16.ts:226  if (room < 1 || room > 255) fail(E_ARGUMENT)
  li t0, 1
  bltu s1, t0, .L3
  li t0, 255
  bgeu t0, s1, .L2
.L3:
  ; basic/strings.e16.ts:226  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L2:
  ; basic/strings.e16.ts:227  return room
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/strings.e16.ts:231 dimStatement() at -O1
dimStatement:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/strings.e16.ts:232  for (;;) {
.L1:
  ; basic/strings.e16.ts:233  readName()
  call readName
  ; basic/strings.e16.ts:234  if (next() === CH_LPAREN) dimArray(nameKey())
  call next
  li t0, 40
  bne a0, t0, .L5
  ; basic/strings.e16.ts:234  dimArray(nameKey())
  call nameKey
  call dimArray
  j .L6
.L5:
  ; basic/strings.e16.ts:235  dimString(nameKey())
  call nameKey
  call dimString
.L6:
  ; basic/strings.e16.ts:236  if (next() !== CH_COMMA) return
  call next
  li t0, 44
  beq a0, t0, .L7
  ; basic/strings.e16.ts:236  return
  j .return
.L7:
  ; basic/strings.e16.ts:237  step()
  call step
  j .L1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/strings.e16.ts:242 dimArray(key) at -O1
;   key in 0(fp)
;   strings in s1
;   d1 in 2(fp)
;   d2 in s2
;   two in s3
;   room in 4(fp)
dimArray:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  sw a0, 0(fp) ; key
  ; basic/strings.e16.ts:243  const strings = nameIsString
  lw s1, 0x061a(zero)
  ; basic/strings.e16.ts:244  step()
  call step
  ; basic/strings.e16.ts:245  expr()
  call expr
  ; basic/strings.e16.ts:246  const d1 = index()
  call index
  sw a0, 2(fp) ; d1
  ; basic/strings.e16.ts:247  let d2: u16 = 0
  li s2, 0 ; d2
  ; basic/strings.e16.ts:248  const two = next() === CH_COMMA
  call next
  li t0, 44
  sub t0, a0, t0
  seqz s3, t0
  ; basic/strings.e16.ts:249  if (two) {
  beqz s3, .L1
  ; basic/strings.e16.ts:250  step()
  call step
  ; basic/strings.e16.ts:251  expr()
  call expr
  ; basic/strings.e16.ts:252  d2 = index()
  call index
  mv s2, a0 ; d2
.L1:
  ; basic/strings.e16.ts:254  expect(CH_RPAREN)
  li a0, 41
  call expect
  ; basic/strings.e16.ts:255  const room = strings ? roomOf() : 0
  beqz s1, .L2
  call roomOf
  mv t0, a0
  j .L3
.L2:
  li t0, 0
.L3:
  sw t0, 4(fp) ; room
  ; basic/strings.e16.ts:256  setNameKey(key)
  lw a0, 0(fp)
  call setNameKey
  ; basic/strings.e16.ts:257  if (findRecord(K_ARRAY | (strings ? K_STRING : 0)) !== 0) fail(E_DIM)
  li t0, 2
  mv t1, s1
  beqz t1, .L5
  li t1, 1
  j .L6
.L5:
  li t1, 0
.L6:
  or a0, t0, t1
  call findRecord
  beq a0, zero, .L4
  ; basic/strings.e16.ts:257  fail(E_DIM)
  li a0, 16
  call fail
.L4:
  ; basic/strings.e16.ts:258  dimension(kindOf(strings, two), d1, d2, room)
  mv a0, s1
  mv a1, s3
  call kindOf
  lw a1, 2(fp)
  mv a2, s2
  lw a3, 4(fp)
  call dimension
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; basic/strings.e16.ts:262 dimString(key) at -O1
;   key in s2
;   room in s1
dimString:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; key
  ; basic/strings.e16.ts:263  if (!nameIsString) fail(E_SYNTAX)
  lw t0, 0x061a(zero)
  bnez t0, .L1
  ; basic/strings.e16.ts:263  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/strings.e16.ts:264  const room = roomOf()
  call roomOf
  mv s1, a0 ; room
  ; basic/strings.e16.ts:265  setNameKey(key)
  mv a0, s2
  call setNameKey
  ; basic/strings.e16.ts:266  if (findRecord(K_STRING) !== 0) fail(E_DIM)
  li a0, 1
  call findRecord
  beq a0, zero, .L2
  ; basic/strings.e16.ts:266  fail(E_DIM)
  li a0, 16
  call fail
.L2:
  ; basic/strings.e16.ts:267  newRecord(K_STRING, room, stringSize(room))
  mv a0, s1
  call stringSize
  mv a1, s1
  mv a2, a0
  li a0, 1
  call newRecord
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/strings.e16.ts:273 join() at -O1
;   b in s3
;   a in 2(fp)
;   na in s1
;   nb in s2
;   at in 0(fp)
join:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  ; basic/strings.e16.ts:274  const b = top()
  call top
  mv s3, a0 ; b
  ; basic/strings.e16.ts:275  const a = b - 8
  addi t0, s3, -8
  sw t0, 2(fp) ; a
  ; basic/strings.e16.ts:276  const na = stringLength(a)
  lw a0, 2(fp)
  call stringLength
  mv s1, a0 ; na
  ; basic/strings.e16.ts:277  const nb = stringLength(b)
  mv a0, s3
  call stringLength
  mv s2, a0 ; nb
  ; basic/strings.e16.ts:278  if (na + nb > 255) fail(E_ARGUMENT)
  add t0, s1, s2
  li t1, 255
  bgeu t1, t0, .L1
  ; basic/strings.e16.ts:278  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L1:
  ; basic/strings.e16.ts:279  const at = tempString(na + nb)
  add a0, s1, s2
  call tempString
  sw a0, 0(fp) ; at
  ; basic/strings.e16.ts:280  move(stringAt(a), at, na)
  lw a0, 2(fp)
  call stringAt
  lw a1, 0(fp)
  mv a2, s1
  call move
  ; basic/strings.e16.ts:281  move(stringAt(b), at + na, nb)
  mv a0, s3
  call stringAt
  lw t0, 0(fp) ; at
  add a1, t0, s1
  mv a2, s2
  call move
  ; basic/strings.e16.ts:282  setNsp(nsp - 16)
  lw t0, 0x0116(zero)
  addi a0, t0, -16
  call setNsp
  ; basic/strings.e16.ts:283  pushString(at, na + nb)
  add t0, s1, s2
  lw a0, 0(fp)
  mv a1, t0
  call pushString
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/strings.e16.ts:287 compareStrings() at -O1
;   b in s2
;   a in 2(fp)
;   na in s3
;   nb in 0(fp)
;   pa in 8(fp)
;   pb in 10(fp)
;   k in s1
;   ca in 4(fp)
;   cb in 6(fp)
compareStrings:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s2, 14(sp)
  sw s3, 16(sp)
  sw s1, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  ; basic/strings.e16.ts:288  const b = top()
  call top
  mv s2, a0 ; b
  ; basic/strings.e16.ts:289  const a = b - 8
  addi t0, s2, -8
  sw t0, 2(fp) ; a
  ; basic/strings.e16.ts:290  const na = stringLength(a)
  lw a0, 2(fp)
  call stringLength
  mv s3, a0 ; na
  ; basic/strings.e16.ts:291  const nb = stringLength(b)
  mv a0, s2
  call stringLength
  sw a0, 0(fp) ; nb
  ; basic/strings.e16.ts:292  const pa = stringAt(a)
  lw a0, 2(fp)
  call stringAt
  sw a0, 8(fp) ; pa
  ; basic/strings.e16.ts:293  const pb = stringAt(b)
  mv a0, s2
  call stringAt
  sw a0, 10(fp) ; pb
  ; basic/strings.e16.ts:294  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:295  for (let k: u16 = 0; k < na && k < nb; k++) {
  li s1, 0 ; k
  j .L3
.L1:
  ; basic/strings.e16.ts:296  const ca = peek(pa + k)
  lw t0, 8(fp) ; pa
  add t0, t0, s1
  lbu t0, 0(t0)
  sw t0, 4(fp) ; ca
  ; basic/strings.e16.ts:297  const cb = peek(pb + k)
  lw t0, 10(fp) ; pb
  add t0, t0, s1
  lbu t0, 0(t0)
  sw t0, 6(fp) ; cb
  ; basic/strings.e16.ts:298  if (ca !== cb) return ca < cb ? 0xffff : 1
  lw t0, 6(fp) ; cb
  lw t1, 4(fp) ; ca
  beq t1, t0, .L5
  ; basic/strings.e16.ts:298  return ca < cb ? 0xffff : 1
  lw t0, 6(fp) ; cb
  lw t1, 4(fp) ; ca
  bgeu t1, t0, .L6
  li t0, 65535
  j .L7
.L6:
  li t0, 1
.L7:
  mv a0, t0
  j .return
.L5:
  addi s1, s1, 1
.L3:
  bgeu s1, s3, .L8
  lw t0, 0(fp) ; nb
  bltu s1, t0, .L1
.L8:
  ; basic/strings.e16.ts:300  if (na === nb) return 0
  lw t0, 0(fp) ; nb
  bne s3, t0, .L9
  ; basic/strings.e16.ts:300  return 0
  li a0, 0
  j .return
.L9:
  ; basic/strings.e16.ts:301  return na < nb ? 0xffff : 1
  lw t0, 0(fp) ; nb
  bgeu s3, t0, .L10
  li t0, 65535
  j .L11
.L10:
  li t0, 1
.L11:
  mv a0, t0
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s2, 14(sp)
  lw s3, 16(sp)
  lw s1, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; basic/strings.e16.ts:305 moreFunctions(token) at -O1
;   token in s1
moreFunctions:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; token
  ; basic/strings.e16.ts:306  if (token === T_LEFT || token === T_MID || token === T_RIGHT) {
  li t0, 202
  beq s1, t0, .L2
  li t0, 203
  beq s1, t0, .L2
  li t0, 204
  bne s1, t0, .L1
.L2:
  ; basic/strings.e16.ts:307  part(token)
  mv a0, s1
  call part
  ; basic/strings.e16.ts:308  return
  j .return
.L1:
  ; basic/strings.e16.ts:310  if (token === T_INKEY || token === T_TIME || token === T_DATE) {
  li t0, 209
  beq s1, t0, .L4
  li t0, 210
  beq s1, t0, .L4
  li t0, 211
  bne s1, t0, .L3
.L4:
  ; basic/strings.e16.ts:311  noArgument(token)
  mv a0, s1
  call noArgument
  ; basic/strings.e16.ts:312  return
  j .return
.L3:
  ; basic/strings.e16.ts:314  if (token === T_LCDW || token === T_LCDH) {
  li t0, 213
  beq s1, t0, .L6
  li t0, 214
  bne s1, t0, .L5
.L6:
  ; basic/strings.e16.ts:315  setInt(push(), i16(peek16(token === T_LCDW ? IO_WIDTH : IO_HEIGHT)))
  call push
  mv t0, a0
  mv t1, s1
  li t2, 213
  bne t1, t2, .L7
  li t1, 65312
  j .L8
.L7:
  li t1, 65314
.L8:
  lw t1, 0(t1)
  mv a0, t0
  mv a1, t1
  call setInt
  ; basic/strings.e16.ts:316  setStrType(false)
  li a0, 0
  call setStrType
  ; basic/strings.e16.ts:317  return
  j .return
.L5:
  ; basic/strings.e16.ts:319  if (token === T_EOF) {
  li t0, 212
  bne s1, t0, .L9
  ; basic/strings.e16.ts:320  eofFunction()
  la t0, eofFunction
  li t1, 2
  call far_call
  ; basic/strings.e16.ts:321  return
  j .return
.L9:
  ; basic/strings.e16.ts:323  if (token === T_STRING) {
  li t0, 224
  bne s1, t0, .L10
  ; basic/strings.e16.ts:324  stringOf()
  call stringOf
  ; basic/strings.e16.ts:325  return
  j .return
.L10:
  ; basic/strings.e16.ts:327  unary()
  call unary
  ; basic/strings.e16.ts:328  if (token === T_SPACES) repeated(CH_SPACE, repeatCount())
  li t0, 223
  bne s1, t0, .L11
  ; basic/strings.e16.ts:328  repeated(CH_SPACE, repeatCount())
  call repeatCount
  mv a1, a0
  li a0, 32
  call repeated
  j .L12
.L11:
  ; basic/strings.e16.ts:329  oneArgument(token)
  mv a0, s1
  call oneArgument
.L12:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/strings.e16.ts:333 stringOf() at -O1
;   n in s2
;   c in s1
stringOf:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; basic/strings.e16.ts:334  expect(CH_LPAREN)
  li a0, 40
  call expect
  ; basic/strings.e16.ts:335  expr()
  call expr
  ; basic/strings.e16.ts:336  const n = repeatCount()
  call repeatCount
  mv s2, a0 ; n
  ; basic/strings.e16.ts:337  expect(CH_COMMA)
  li a0, 44
  call expect
  ; basic/strings.e16.ts:338  expr()
  call expr
  ; basic/strings.e16.ts:339  let c: u16 = 0
  li s1, 0 ; c
  ; basic/strings.e16.ts:340  if (strType) {
  lw t0, 0x0118(zero)
  beqz t0, .L1
  ; basic/strings.e16.ts:342  if (stringLength(top()) === 0) fail(E_ARGUMENT)
  call top
  call stringLength
  bne a0, zero, .L2
  ; basic/strings.e16.ts:342  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L2:
  ; basic/strings.e16.ts:343  c = peek(stringAt(top()))
  call top
  call stringAt
  lbu s1, 0(a0)
  j .L3
.L1:
  ; basic/strings.e16.ts:344  c = charCode(top())
  call top
  call charCode
  mv s1, a0 ; c
.L3:
  ; basic/strings.e16.ts:345  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:346  expect(CH_RPAREN)
  li a0, 41
  call expect
  ; basic/strings.e16.ts:347  repeated(c, n)
  mv a0, s1
  mv a1, s2
  call repeated
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/strings.e16.ts:351 charCode(e) at -O1
;   e in s2
;   c in s1
charCode:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; e
  ; basic/strings.e16.ts:352  const c = toInt(e)
  mv a0, s2
  call toInt
  mv s1, a0 ; c
  ; basic/strings.e16.ts:353  if (c < 0 || c > 255) fail(E_ARGUMENT)
  blt s1, zero, .L2
  li t0, 255
  bge t0, s1, .L1
.L2:
  ; basic/strings.e16.ts:353  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L1:
  ; basic/strings.e16.ts:354  return u16(c)
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/strings.e16.ts:358 repeatCount() at -O1
;   n in s1
repeatCount:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/strings.e16.ts:359  needNumber()
  call needNumber
  ; basic/strings.e16.ts:360  const n = charCode(top())
  call top
  call charCode
  mv s1, a0 ; n
  ; basic/strings.e16.ts:361  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:362  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/strings.e16.ts:366 repeated(c, n) at -O1
;   c in s3
;   n in s1
;   at in s2
repeated:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; c
  mv s1, a1 ; n
  ; basic/strings.e16.ts:367  const at = tempString(n)
  mv a0, s1
  call tempString
  mv s2, a0 ; at
  ; basic/strings.e16.ts:368  memset(at, c, n)
  mv a0, s2
  mv a1, s3
  mv a2, s1
  mset a0, a1, a2
  ; basic/strings.e16.ts:369  pushString(at, n)
  mv a0, s2
  mv a1, s1
  call pushString
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; basic/strings.e16.ts:373 oneArgument(token) at -O1
;   token in s1
oneArgument:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; token
  ; basic/strings.e16.ts:374  if (token === T_LEN || token === T_ASC || token === T_VAL) ofString(token)
  li t0, 201
  beq s1, t0, .L2
  li t0, 206
  beq s1, t0, .L2
  li t0, 208
  bne s1, t0, .L1
.L2:
  ; basic/strings.e16.ts:374  ofString(token)
  mv a0, s1
  call ofString
  j .L3
.L1:
  ; basic/strings.e16.ts:375  ofNumber(token)
  mv a0, s1
  call ofNumber
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/strings.e16.ts:379 ofString(token) at -O1
;   token in s3
;   e in s1
;   n in s2
;   at in s0
ofString:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  mv s3, a0 ; token
  ; basic/strings.e16.ts:380  const e = top()
  call top
  mv s1, a0 ; e
  ; basic/strings.e16.ts:381  needString()
  call needString
  ; basic/strings.e16.ts:382  const n = stringLength(e)
  mv a0, s1
  call stringLength
  mv s2, a0 ; n
  ; basic/strings.e16.ts:383  const at = stringAt(e)
  mv a0, s1
  call stringAt
  mv s0, a0 ; at
  ; basic/strings.e16.ts:384  setStrType(false)
  li a0, 0
  call setStrType
  ; basic/strings.e16.ts:385  if (token === T_VAL) {
  li t0, 208
  bne s3, t0, .L1
  ; basic/strings.e16.ts:386  if (readNumber(e, at, n) === 0) setInt(e, 0)
  mv a0, s1
  mv a1, s0
  mv a2, s2
  call readNumber
  bne a0, zero, .L2
  ; basic/strings.e16.ts:386  setInt(e, 0)
  mv a0, s1
  li a1, 0
  call setInt
.L2:
  ; basic/strings.e16.ts:387  return
  j .return
.L1:
  ; basic/strings.e16.ts:389  setInt(e, token === T_LEN ? i16(n) : n === 0 ? 0 : i16(peek(at)))
  mv t0, s1
  mv t1, s3
  li t2, 201
  bne t1, t2, .L3
  mv t1, s2
  j .L4
.L3:
  mv t1, s2
  li t2, 0
  bne t1, t2, .L5
  li t1, 0
  j .L6
.L5:
  lbu t1, 0(s0)
.L6:
.L4:
  mv a0, t0
  mv a1, t1
  call setInt
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; basic/strings.e16.ts:393 ofNumber(token) at -O1
;   token in s3
;   e in s0
;   c/n in s1
;   at in s2
ofNumber:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  mv s3, a0 ; token
  ; basic/strings.e16.ts:394  const e = top()
  call top
  mv s0, a0 ; e
  ; basic/strings.e16.ts:395  needNumber()
  call needNumber
  ; basic/strings.e16.ts:396  if (token === T_CHR) {
  li t0, 205
  bne s3, t0, .L1
  ; basic/strings.e16.ts:397  const c = toInt(e)
  mv a0, s0
  call toInt
  mv s1, a0 ; c/n
  ; basic/strings.e16.ts:398  if (c < 0 || c > 255) fail(E_ARGUMENT)
  blt s1, zero, .L3
  li t0, 255
  bge t0, s1, .L2
.L3:
  ; basic/strings.e16.ts:398  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L2:
  ; basic/strings.e16.ts:399  const at = tempString(1)
  li a0, 1
  call tempString
  mv s2, a0 ; at
  ; basic/strings.e16.ts:400  poke(at, u16(c))
  sb s1, 0(s2)
  ; basic/strings.e16.ts:401  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:402  pushString(at, 1)
  mv a0, s2
  li a1, 1
  call pushString
  ; basic/strings.e16.ts:403  return
  j .return
.L1:
  ; basic/strings.e16.ts:405  if (token !== T_STR) fail(E_SYNTAX)
  li t0, 207
  beq s3, t0, .L4
  ; basic/strings.e16.ts:405  fail(E_SYNTAX)
  li a0, 1
  call fail
.L4:
  ; basic/strings.e16.ts:406  const n = formatTop()
  call formatTop
  mv s1, a0 ; c/n
  ; basic/strings.e16.ts:407  const at = tempString(n)
  mv a0, s1
  call tempString
  mv s2, a0 ; at
  ; basic/strings.e16.ts:408  move(addr(textOut), at, n)
  la a0, textOut
  mv a1, s2
  mv a2, s1
  call move
  ; basic/strings.e16.ts:409  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:410  pushString(at, n)
  mv a0, s2
  mv a1, s1
  call pushString
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; basic/strings.e16.ts:414 part(token) at -O1
;   token in 2(fp)
;   a in s3
;   b in 4(fp)
;   e in 6(fp)
;   n in s2
;   from in s1
;   length in 0(fp)
;   at in 8(fp)
part:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s3, 12(sp)
  sw s2, 14(sp)
  sw s1, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  sw a0, 2(fp) ; token
  ; basic/strings.e16.ts:415  expect(CH_LPAREN)
  li a0, 40
  call expect
  ; basic/strings.e16.ts:416  expr()
  call expr
  ; basic/strings.e16.ts:417  needString()
  call needString
  ; basic/strings.e16.ts:418  expect(CH_COMMA)
  li a0, 44
  call expect
  ; basic/strings.e16.ts:419  expr()
  call expr
  ; basic/strings.e16.ts:420  const a = count()
  call count
  mv s3, a0 ; a
  ; basic/strings.e16.ts:421  let b: u16 = 255
  li t0, 255
  sw t0, 4(fp) ; b
  ; basic/strings.e16.ts:422  if (token === T_MID && next() === CH_COMMA) {
  li t0, 203
  lw t1, 2(fp) ; token
  bne t1, t0, .L1
  call next
  li t0, 44
  bne a0, t0, .L1
  ; basic/strings.e16.ts:423  step()
  call step
  ; basic/strings.e16.ts:424  expr()
  call expr
  ; basic/strings.e16.ts:425  b = count()
  call count
  sw a0, 4(fp) ; b
.L1:
  ; basic/strings.e16.ts:427  expect(CH_RPAREN)
  li a0, 41
  call expect
  ; basic/strings.e16.ts:428  const e = top()
  call top
  sw a0, 6(fp) ; e
  ; basic/strings.e16.ts:429  const n = stringLength(e)
  lw a0, 6(fp)
  call stringLength
  mv s2, a0 ; n
  ; basic/strings.e16.ts:430  let from: u16 = 0
  li s1, 0 ; from
  ; basic/strings.e16.ts:431  let length = a
  sw s3, 0(fp) ; length
  ; basic/strings.e16.ts:432  if (token === T_RIGHT) from = a < n ? n - a : 0
  li t0, 204
  lw t1, 2(fp) ; token
  bne t1, t0, .L2
  ; basic/strings.e16.ts:432  from = a < n ? n - a : 0
  bgeu s3, s2, .L3
  sub t0, s2, s3
  j .L4
.L3:
  li t0, 0
.L4:
  mv s1, t0 ; from
.L2:
  ; basic/strings.e16.ts:433  if (token === T_MID) {
  li t0, 203
  lw t1, 2(fp) ; token
  bne t1, t0, .L5
  ; basic/strings.e16.ts:435  from = a === 0 ? 0 : a - 1
  bne s3, zero, .L6
  li t0, 0
  j .L7
.L6:
  addi t0, s3, -1
.L7:
  mv s1, t0 ; from
  ; basic/strings.e16.ts:436  length = b
  lw t0, 4(fp) ; b
  sw t0, 0(fp) ; length
.L5:
  ; basic/strings.e16.ts:438  if (from > n) from = n
  bgeu s2, s1, .L8
  ; basic/strings.e16.ts:438  from = n
  mv s1, s2 ; from
.L8:
  ; basic/strings.e16.ts:439  if (length > n - from) length = n - from
  sub t0, s2, s1
  lw t1, 0(fp) ; length
  bgeu t0, t1, .L9
  ; basic/strings.e16.ts:439  length = n - from
  sub t0, s2, s1
  sw t0, 0(fp) ; length
.L9:
  ; basic/strings.e16.ts:440  const at = stringAt(e)
  lw a0, 6(fp)
  call stringAt
  sw a0, 8(fp) ; at
  ; basic/strings.e16.ts:441  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:442  pushString(at + from, length)
  lw t0, 8(fp) ; at
  add a0, t0, s1
  lw a1, 0(fp)
  call pushString
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s3, 12(sp)
  lw s2, 14(sp)
  lw s1, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; basic/strings.e16.ts:446 count() at -O1
;   v in s1
count:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/strings.e16.ts:447  needNumber()
  call needNumber
  ; basic/strings.e16.ts:448  const v = toInt(top())
  call top
  call toInt
  mv s1, a0 ; v
  ; basic/strings.e16.ts:449  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:450  if (v < 0) fail(E_ARGUMENT)
  bge s1, zero, .L1
  ; basic/strings.e16.ts:450  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L1:
  ; basic/strings.e16.ts:451  return v > 255 ? 255 : u16(v)
  li t0, 255
  bge t0, s1, .L2
  li t0, 255
  j .L3
.L2:
  mv t0, s1
.L3:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/strings.e16.ts:455 noArgument(token) at -O1
;   token in s2
;   c/at in s1
;   at in s3
noArgument:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; token
  ; basic/strings.e16.ts:456  if (token === T_INKEY) {
  li t0, 209
  bne s2, t0, .L1
  ; basic/strings.e16.ts:458  const c = pollkey()
  call pollkey
  mv s1, a0 ; c/at
  ; basic/strings.e16.ts:459  if (c === 0) {
  bne s1, zero, .L2
  ; basic/strings.e16.ts:460  pushString(0, 0)
  li a0, 0
  li a1, 0
  call pushString
  ; basic/strings.e16.ts:461  return
  j .return
.L2:
  ; basic/strings.e16.ts:463  const at = tempString(1)
  li a0, 1
  call tempString
  mv s3, a0 ; at
  ; basic/strings.e16.ts:464  poke(at, c)
  sb s1, 0(s3)
  ; basic/strings.e16.ts:465  pushString(at, 1)
  mv a0, s3
  li a1, 1
  call pushString
  ; basic/strings.e16.ts:466  return
  j .return
.L1:
  ; basic/strings.e16.ts:468  const at = tempString(10)
  li a0, 10
  call tempString
  mv s1, a0 ; c/at
  ; basic/strings.e16.ts:469  if (token === T_TIME) {
  li t0, 210
  bne s2, t0, .L3
  ; basic/strings.e16.ts:470  twoDigits(at, peek(IO_CLOCK + 2), 0x3a)
  li t0, 65338
  lbu t0, 0(t0)
  mv a0, s1
  mv a1, t0
  li a2, 58
  call twoDigits
  ; basic/strings.e16.ts:471  twoDigits(at + 3, peek(IO_CLOCK + 1), 0x3a)
  li t0, 65337
  lbu t0, 0(t0)
  addi a0, s1, 3
  mv a1, t0
  li a2, 58
  call twoDigits
  ; basic/strings.e16.ts:472  twoDigits(at + 6, peek(IO_CLOCK), 0)
  li t0, 65336
  lbu t0, 0(t0)
  addi a0, s1, 6
  mv a1, t0
  li a2, 0
  call twoDigits
  ; basic/strings.e16.ts:473  pushString(at, 8)
  mv a0, s1
  li a1, 8
  call pushString
  ; basic/strings.e16.ts:474  return
  j .return
.L3:
  ; basic/strings.e16.ts:476  twoDigits(at, 20, 0)
  mv a0, s1
  li a1, 20
  li a2, 0
  call twoDigits
  ; basic/strings.e16.ts:477  twoDigits(at + 2, peek(IO_CLOCK + 5), CH_MINUS)
  li t0, 65341
  lbu t0, 0(t0)
  addi a0, s1, 2
  mv a1, t0
  li a2, 45
  call twoDigits
  ; basic/strings.e16.ts:478  twoDigits(at + 5, peek(IO_CLOCK + 4), CH_MINUS)
  li t0, 65340
  lbu t0, 0(t0)
  addi a0, s1, 5
  mv a1, t0
  li a2, 45
  call twoDigits
  ; basic/strings.e16.ts:479  twoDigits(at + 8, peek(IO_CLOCK + 3), 0)
  li t0, 65339
  lbu t0, 0(t0)
  addi a0, s1, 8
  mv a1, t0
  li a2, 0
  call twoDigits
  ; basic/strings.e16.ts:480  pushString(at, 10)
  mv a0, s1
  li a1, 10
  call pushString
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/strings.e16.ts:484 twoDigits(at, v, after) at -O1
;   at in a0
;   v in a1
;   after in a2
twoDigits:
  ; basic/strings.e16.ts:485  poke(at, CH_0 + div(v, 10))
  li t0, 10
  divu t0, a1, t0
  addi t0, t0, 48
  sb t0, 0(a0)
  ; basic/strings.e16.ts:486  poke(at + 1, CH_0 + (v % 10))
  li t0, 10
  remu t0, a1, t0
  addi t0, t0, 48
  sb t0, 1(a0)
  ; basic/strings.e16.ts:487  if (after !== 0) poke(at + 2, after)
  beq a2, zero, .L1
  ; basic/strings.e16.ts:487  poke(at + 2, after)
  sb a2, 2(a0)
.L1:
.return:
  ret

; basic/strings.e16.ts:494 readNumber(e, at, max) at -O1
;   e in a0
;   at in a1
;   max in a2
;   p in a3
;   left in s1
;   minus in s2
;   n in s3
readNumber:
  addi sp, sp, -6
  sw s1, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  ; basic/strings.e16.ts:495  let p = at
  mv a3, a1 ; p
  ; basic/strings.e16.ts:496  let left = max
  mv s1, a2 ; left
  ; basic/strings.e16.ts:497  while (left > 0 && peek(p) === CH_SPACE) {
  j .L3
.L1:
  ; basic/strings.e16.ts:498  p++
  addi a3, a3, 1
  ; basic/strings.e16.ts:499  left--
  addi s1, s1, -1
.L3:
  bgeu zero, s1, .L5
  lbu t0, 0(a3)
  li t1, 32
  beq t0, t1, .L1
.L5:
  ; basic/strings.e16.ts:501  const minus = left > 0 && peek(p) === CH_MINUS
  sltu t0, zero, s1
  mv t1, t0
  beqz t1, .L6
  lbu t0, 0(a3)
  li t1, 45
  sub t0, t0, t1
  seqz t0, t0
.L6:
  mv s2, t0 ; minus
  ; basic/strings.e16.ts:502  if (minus) {
  beqz s2, .L7
  ; basic/strings.e16.ts:503  p++
  addi a3, a3, 1
  ; basic/strings.e16.ts:504  left--
  addi s1, s1, -1
.L7:
  ; basic/strings.e16.ts:506  poke16(MATH_A, e)
  li t0, 65362
  sw a0, 0(t0)
  ; basic/strings.e16.ts:507  poke16(MATH_B, p)
  li t0, 65364
  sw a3, 0(t0)
  ; basic/strings.e16.ts:508  poke16(MATH_ARG, left)
  li t0, 65366
  sw s1, 0(t0)
  ; basic/strings.e16.ts:509  poke16(MATH_OP, M_PARSE)
  li t0, 56
  li t1, 65360
  sw t0, 0(t1)
  ; basic/strings.e16.ts:510  const n = peek16(MATH_ARG)
  li t0, 65366
  lw s3, 0(t0)
  ; basic/strings.e16.ts:511  if (peek16(MATH_STATUS) !== 0 || n === 0) return 0
  li t0, 65368
  lw t0, 0(t0)
  bne t0, zero, .L9
  bne s3, zero, .L8
.L9:
  ; basic/strings.e16.ts:511  return 0
  li a0, 0
  j .return
.L8:
  ; basic/strings.e16.ts:512  if (minus) {
  beqz s2, .L10
  ; basic/strings.e16.ts:513  poke16(MATH_A, e)
  li t0, 65362
  sw a0, 0(t0)
  ; basic/strings.e16.ts:514  poke16(MATH_OP, M_NEG)
  li t0, 16
  li t1, 65360
  sw t0, 0(t1)
.L10:
  ; basic/strings.e16.ts:516  return p + n - at
  add t0, a3, s3
  sub a0, t0, a1
.return:
  lw s1, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  addi sp, sp, 6
  ret

; basic/strings.e16.ts:522 inputStatement() at -O1
;   again in s3
;   prompt in s1
;   list in s0
;   n in s2
inputStatement:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s0, 6(sp)
  sw s2, 8(sp)
  ; basic/strings.e16.ts:524  const again = txt - 1
  lw t0, 0x010e(zero)
  addi s3, t0, -1
  ; basic/strings.e16.ts:525  if (next() === CH_HASH) {
  call next
  li t0, 35
  bne a0, t0, .L1
  ; basic/strings.e16.ts:526  inputFromFile()
  la t0, inputFromFile
  li t1, 2
  call far_call
  ; basic/strings.e16.ts:527  return
  j .return
.L1:
  ; basic/strings.e16.ts:529  let prompt: u16 = 0
  li s1, 0 ; prompt
  ; basic/strings.e16.ts:530  if (next() === CH_QUOTE) {
  call next
  li t0, 34
  bne a0, t0, .L2
  ; basic/strings.e16.ts:531  prompt = txt + 1
  lw t0, 0x010e(zero)
  addi s1, t0, 1
  ; basic/strings.e16.ts:532  setTxt(quoted(prompt, false))
  mv a0, s1
  li a1, 0
  call quoted
  call setTxt
  ; basic/strings.e16.ts:533  if (next() === CH_SEMI || next() === CH_COMMA) step()
  call next
  li t0, 59
  beq a0, t0, .L4
  call next
  li t0, 44
  bne a0, t0, .L3
.L4:
  ; basic/strings.e16.ts:533  step()
  call step
.L3:
.L2:
  ; basic/strings.e16.ts:535  const list = txt
  lw s0, 0x010e(zero)
  ; basic/strings.e16.ts:536  for (;;) {
.L5:
  ; basic/strings.e16.ts:537  fresh_line()
  call fresh_line
  ; basic/strings.e16.ts:538  if (prompt !== 0) quoted(prompt, true)
  beq s1, zero, .L9
  ; basic/strings.e16.ts:538  quoted(prompt, true)
  mv a0, s1
  li a1, 1
  call quoted
.L9:
  ; basic/strings.e16.ts:539  putc(CH_QUESTION)
  li a0, 63
  call putc
  ; basic/strings.e16.ts:540  const n: i16 = readline(addr(lineBuf), 78)
  la a0, lineBuf
  li a1, 78
  call readline
  mv s2, a0 ; n
  ; basic/strings.e16.ts:541  if (n === -2) {
  li t0, 65534
  bne s2, t0, .L10
  ; basic/strings.e16.ts:542  setTxt(again)
  mv a0, s3
  call setTxt
  ; basic/strings.e16.ts:543  poke16(BRKFLAG, 1)
  li t0, 1
  sw t0, 30(zero)
  ; basic/strings.e16.ts:544  checkBreak()
  call checkBreak
.L10:
  ; basic/strings.e16.ts:546  fresh_line()
  call fresh_line
  ; basic/strings.e16.ts:547  setTxt(list)
  mv a0, s0
  call setTxt
  ; basic/strings.e16.ts:548  if (n >= 0 && takeItems(addr(lineBuf))) return
  blt s2, zero, .L5
  la a0, lineBuf
  call takeItems
  beqz a0, .L5
  ; basic/strings.e16.ts:548  return
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; basic/strings.e16.ts:553 takeItems(from) at -O1
;   from in s3
;   p in s1
;   at in 0(fp)
;   room in 2(fp)
;   taken in s2
takeItems:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s3, a0 ; from
  ; basic/strings.e16.ts:554  let p = from
  mv s1, s3 ; p
  ; basic/strings.e16.ts:555  for (;;) {
.L1:
  ; basic/strings.e16.ts:556  const at = varAt(true)
  li a0, 1
  call varAt
  sw a0, 0(fp) ; at
  ; basic/strings.e16.ts:557  const room = varRoom
  lw t0, 0x011a(zero)
  sw t0, 2(fp) ; room
  ; basic/strings.e16.ts:558  const taken = takeItem(at, room, p, false)
  lw a0, 0(fp)
  lw a1, 2(fp)
  mv a2, s1
  li a3, 0
  call takeItem
  mv s2, a0 ; taken
  ; basic/strings.e16.ts:559  if (taken === 0xffff) return false
  li t0, 65535
  bne s2, t0, .L5
  ; basic/strings.e16.ts:559  return false
  li a0, 0
  j .return
.L5:
  ; basic/strings.e16.ts:560  p += taken
  add s1, s1, s2
  ; basic/strings.e16.ts:561  if (next() !== CH_COMMA) return true
  call next
  li t0, 44
  beq a0, t0, .L6
  ; basic/strings.e16.ts:561  return true
  li a0, 1
  j .return
.L6:
  ; basic/strings.e16.ts:562  step()
  call step
  ; basic/strings.e16.ts:563  if (peek(p) !== CH_COMMA) return false
  lbu t0, 0(s1)
  li t1, 44
  beq t0, t1, .L7
  ; basic/strings.e16.ts:563  return false
  li a0, 0
  j .return
.L7:
  ; basic/strings.e16.ts:564  p++
  addi s1, s1, 1
  j .L1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/strings.e16.ts:573 takeItem(at, room, p, data) at -O1
;   at in s3
;   room in 4(fp)
;   p in s2
;   data in 6(fp)
;   q in s1
;   e in 0(fp)
;   n in 2(fp)
takeItem:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s3, 10(sp)
  sw s2, 12(sp)
  sw s1, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s3, a0 ; at
  sw a1, 4(fp) ; room
  mv s2, a2 ; p
  sw a3, 6(fp) ; data
  ; basic/strings.e16.ts:574  let q = p
  mv s1, s2 ; q
  ; basic/strings.e16.ts:575  while (peek(q) === CH_SPACE) q++
  j .L3
.L1:
  ; basic/strings.e16.ts:575  q++
  addi s1, s1, 1
.L3:
  lbu t0, 0(s1)
  li t1, 32
  beq t0, t1, .L1
  ; basic/strings.e16.ts:576  if (nameIsString) return takeString(at, room, q, data) - p
  lw t0, 0x061a(zero)
  beqz t0, .L5
  ; basic/strings.e16.ts:576  return takeString(at, room, q, data) - p
  mv a0, s3
  lw a1, 4(fp)
  mv a2, s1
  lw a3, 6(fp)
  call takeString
  sub a0, a0, s2
  j .return
.L5:
  ; basic/strings.e16.ts:577  const e = push()
  call push
  sw a0, 0(fp) ; e
  ; basic/strings.e16.ts:578  const n = readNumber(e, q, 255)
  lw a0, 0(fp)
  mv a1, s1
  li a2, 255
  call readNumber
  sw a0, 2(fp) ; n
  ; basic/strings.e16.ts:579  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:580  if (n === 0) return 0xffff
  lw t0, 2(fp) ; n
  bne t0, zero, .L6
  ; basic/strings.e16.ts:580  return 0xffff
  li a0, 65535
  j .return
.L6:
  ; basic/strings.e16.ts:581  copy8(e, at)
  lw a0, 0(fp)
  mv a1, s3
  call copy8
  ; basic/strings.e16.ts:582  q += n
  lw t0, 2(fp) ; n
  add s1, s1, t0
  ; basic/strings.e16.ts:583  while (peek(q) === CH_SPACE) q++
  j .L9
.L7:
  ; basic/strings.e16.ts:583  q++
  addi s1, s1, 1
.L9:
  lbu t0, 0(s1)
  li t1, 32
  beq t0, t1, .L7
  ; basic/strings.e16.ts:584  return q - p
  sub a0, s1, s2
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s3, 10(sp)
  lw s2, 12(sp)
  lw s1, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; basic/strings.e16.ts:588 takeString(at, room, q, data) at -O1
;   at in 2(fp)
;   room in 4(fp)
;   q in s3
;   data in 6(fp)
;   start in 0(fp)
;   end in s1
;   after in s2
takeString:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s2, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 2(fp) ; at
  sw a1, 4(fp) ; room
  mv s3, a2 ; q
  sw a3, 6(fp) ; data
  ; basic/strings.e16.ts:589  let start = q
  sw s3, 0(fp) ; start
  ; basic/strings.e16.ts:590  let end = q
  mv s1, s3 ; end
  ; basic/strings.e16.ts:591  let after = q
  mv s2, s3 ; after
  ; basic/strings.e16.ts:592  if (peek(q) === CH_QUOTE) {
  lbu t0, 0(s3)
  li t1, 34
  bne t0, t1, .L16
  ; basic/strings.e16.ts:593  start = q + 1
  addi t0, s3, 1
  sw t0, 0(fp) ; start
  ; basic/strings.e16.ts:594  end = start
  lw s1, 0(fp) ; start
  ; basic/strings.e16.ts:595  while (peek(end) !== CH_QUOTE && peek(end) !== 0) end++
  j .L4
.L2:
  ; basic/strings.e16.ts:595  end++
  addi s1, s1, 1
.L4:
  lbu t0, 0(s1)
  li t1, 34
  beq t0, t1, .L6
  lbu t0, 0(s1)
  bne t0, zero, .L2
.L6:
  ; basic/strings.e16.ts:596  after = peek(end) === CH_QUOTE ? end + 1 : end
  lbu t0, 0(s1)
  li t1, 34
  bne t0, t1, .L7
  addi t0, s1, 1
  j .L8
.L7:
  mv t0, s1
.L8:
  mv s2, t0 ; after
  ; basic/strings.e16.ts:598  while (peek(after) === CH_SPACE) after++
  j .L11
.L9:
  ; basic/strings.e16.ts:598  after++
  addi s2, s2, 1
.L11:
  lbu t0, 0(s2)
  li t1, 32
  beq t0, t1, .L9
  j .L13
  ; basic/strings.e16.ts:600  while (!itemEnds(peek(end), data)) end++
.L14:
  ; basic/strings.e16.ts:600  end++
  addi s1, s1, 1
.L16:
  lbu a0, 0(s1)
  lw a1, 6(fp)
  call itemEnds
  beqz a0, .L14
  ; basic/strings.e16.ts:601  after = end
  mv s2, s1 ; after
  ; basic/strings.e16.ts:602  while (end > start && peek(end - 1) === CH_SPACE) end--
  j .L20
.L18:
  ; basic/strings.e16.ts:602  end--
  addi s1, s1, -1
.L20:
  lw t0, 0(fp) ; start
  bgeu t0, s1, .L22
  lbu t0, -1(s1)
  li t1, 32
  beq t0, t1, .L18
.L22:
.L13:
  ; basic/strings.e16.ts:604  pushString(start, end - start)
  lw t0, 0(fp) ; start
  sub t0, s1, t0
  lw a0, 0(fp)
  mv a1, t0
  call pushString
  ; basic/strings.e16.ts:605  storeString(at, room)
  lw a0, 2(fp)
  lw a1, 4(fp)
  call storeString
  ; basic/strings.e16.ts:606  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:607  return after
  mv a0, s2
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s2, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; basic/strings.e16.ts:611 itemEnds(c, data) at -O1
;   c in a0
;   data in a1
itemEnds:
  ; basic/strings.e16.ts:612  return c === CH_COMMA || c === 0 || c === 0x0d || (data && c === CH_COLON)
  li t0, 44
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L3
  sub t0, a0, zero
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 13
  sub t0, a0, t0
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  mv t0, a1
  mv t1, a1
  beqz t1, .L4
  li t0, 58
  sub t0, a0, t0
  seqz t0, t0
.L4:
.L1:
  mv a0, t0
.return:
  ret

; basic/strings.e16.ts:618 readStatement() at -O1
;   at in 0(fp)
;   room in 2(fp)
;   item in s2
;   taken in s3
;   after in s1
readStatement:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  ; basic/strings.e16.ts:619  for (;;) {
.L1:
  ; basic/strings.e16.ts:620  const at = varAt(true)
  li a0, 1
  call varAt
  sw a0, 0(fp) ; at
  ; basic/strings.e16.ts:621  const room = varRoom
  lw t0, 0x011a(zero)
  sw t0, 2(fp) ; room
  ; basic/strings.e16.ts:622  const item = nextItem()
  call nextItem
  mv s2, a0 ; item
  ; basic/strings.e16.ts:623  const taken = takeItem(at, room, item, true)
  lw a0, 0(fp)
  lw a1, 2(fp)
  mv a2, s2
  li a3, 1
  call takeItem
  mv s3, a0 ; taken
  ; basic/strings.e16.ts:624  if (taken === 0xffff) fail(E_TYPE)
  li t0, 65535
  bne s3, t0, .L5
  ; basic/strings.e16.ts:624  fail(E_TYPE)
  li a0, 11
  call fail
.L5:
  ; basic/strings.e16.ts:626  const after = item + taken
  add s1, s2, s3
  ; basic/strings.e16.ts:627  setData(dataLine, peek(after) === CH_COMMA ? after + 1 : after)
  lw t0, 0x011e(zero)
  lbu t1, 0(s1)
  li t2, 44
  bne t1, t2, .L6
  addi t1, s1, 1
  j .L7
.L6:
  mv t1, s1
.L7:
  mv a0, t0
  mv a1, t1
  call setData
  ; basic/strings.e16.ts:628  if (next() !== CH_COMMA) return
  call next
  li t0, 44
  beq a0, t0, .L8
  ; basic/strings.e16.ts:628  return
  j .return
.L8:
  ; basic/strings.e16.ts:629  step()
  call step
  j .L1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/strings.e16.ts:634 nextItem() at -O1
;   at in s1
;   line in s2
;   from in s3
nextItem:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/strings.e16.ts:635  let at = dataAt
  lw s1, 0x0120(zero)
  ; basic/strings.e16.ts:636  if (at !== 0 && peek(at) !== 0 && peek(at) !== CH_COLON) return at
  beq s1, zero, .L1
  lbu t0, 0(s1)
  beq t0, zero, .L1
  lbu t0, 0(s1)
  li t1, 58
  beq t0, t1, .L1
  ; basic/strings.e16.ts:636  return at
  mv a0, s1
  j .return
.L1:
  ; basic/strings.e16.ts:637  let line = dataLine === 0 ? PROG : dataLine
  lw t0, 0x011e(zero)
  bne t0, zero, .L2
  li t0, 2048
  j .L3
.L2:
  lw t0, 0x011e(zero)
.L3:
  mv s2, t0 ; line
  ; basic/strings.e16.ts:639  let from = at === 0 ? line + 4 : at
  bne s1, zero, .L4
  addi t0, s2, 4
  j .L5
.L4:
  mv t0, s1
.L5:
  mv s3, t0 ; from
  ; basic/strings.e16.ts:640  for (;;) {
.L6:
  ; basic/strings.e16.ts:641  if (peek16(line) === 0) fail(E_DATA)
  lw t0, 0(s2)
  bne t0, zero, .L10
  ; basic/strings.e16.ts:641  fail(E_DATA)
  li a0, 14
  call fail
.L10:
  ; basic/strings.e16.ts:642  at = findData(from)
  mv a0, s3
  call findData
  mv s1, a0 ; at
  ; basic/strings.e16.ts:643  if (at !== 0) {
  beq s1, zero, .L11
  ; basic/strings.e16.ts:644  setData(line, at)
  mv a0, s2
  mv a1, s1
  call setData
  ; basic/strings.e16.ts:645  return at
  mv a0, s1
  j .return
.L11:
  ; basic/strings.e16.ts:647  line += peek16(line + 2)
  lw t0, 2(s2)
  add s2, s2, t0
  ; basic/strings.e16.ts:648  from = line + 4
  addi s3, s2, 4
  j .L6
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/strings.e16.ts:653 findData(from) at -O1
;   from in a0
;   p in a1
;   inside in a2
;   c in a3
findData:
  ; basic/strings.e16.ts:654  let p = from
  mv a1, a0 ; p
  ; basic/strings.e16.ts:655  let inside = false
  li a2, 0 ; inside
  ; basic/strings.e16.ts:656  while (peek(p) !== 0) {
  j .L3
.L1:
  ; basic/strings.e16.ts:657  const c = peek(p)
  lbu a3, 0(a1)
  ; basic/strings.e16.ts:658  p++
  addi a1, a1, 1
  ; basic/strings.e16.ts:659  if (c === CH_QUOTE) inside = !inside
  li t0, 34
  bne a3, t0, .L5
  ; basic/strings.e16.ts:659  inside = !inside
  seqz a2, a2
.L5:
  ; basic/strings.e16.ts:660  if (inside) continue
  beqz a2, .L6
  ; basic/strings.e16.ts:660  continue
  j .L2
.L6:
  ; basic/strings.e16.ts:661  if (c === T_REM) return 0
  li t0, 147
  bne a3, t0, .L7
  ; basic/strings.e16.ts:661  return 0
  li a0, 0
  ret
.L7:
  ; basic/strings.e16.ts:662  if (c === T_DATA) return p
  li t0, 158
  bne a3, t0, .L8
  ; basic/strings.e16.ts:662  return p
  mv a0, a1
  ret
.L8:
.L2:
.L3:
  lbu t0, 0(a1)
  bne t0, zero, .L1
  ; basic/strings.e16.ts:664  return 0
  li a0, 0
.return:
  ret

; basic/strings.e16.ts:668 restoreStatement() at -O1
;   line in s1
restoreStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/strings.e16.ts:669  if (!isDigit(next())) {
  call next
  call isDigit
  bnez a0, .L1
  ; basic/strings.e16.ts:670  setData(0, 0)
  li a0, 0
  li a1, 0
  call setData
  ; basic/strings.e16.ts:671  return
  j .return
.L1:
  ; basic/strings.e16.ts:673  const line = findLine(readUnsigned(), true)
  call readUnsigned
  li a1, 1
  call findLine
  mv s1, a0 ; line
  ; basic/strings.e16.ts:674  if (line === 0) fail(E_LINE)
  bne s1, zero, .L2
  ; basic/strings.e16.ts:674  fail(E_LINE)
  li a0, 5
  call fail
.L2:
  ; basic/strings.e16.ts:675  setData(line, 0)
  mv a0, s1
  li a1, 0
  call setData
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/strings.e16.ts:684 computedLine() at -O1
;   e in s1
;   at in s2
computedLine:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; basic/strings.e16.ts:685  expr()
  call expr
  ; basic/strings.e16.ts:686  needNumber()
  call needNumber
  ; basic/strings.e16.ts:687  const e = top()
  call top
  mv s1, a0 ; e
  ; basic/strings.e16.ts:688  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:689  poke16(MATH_A, e)
  li t0, 65362
  sw s1, 0(t0)
  ; basic/strings.e16.ts:690  poke16(MATH_OP, M_TOWORD)
  li t0, 50
  li t1, 65360
  sw t0, 0(t1)
  ; basic/strings.e16.ts:692  if (peek16(MATH_STATUS) !== 0 || (peek(e) & 0x80) !== 0) fail(E_LINE)
  li t0, 65368
  lw t0, 0(t0)
  bne t0, zero, .L2
  lbu t0, 0(s1)
  andi t0, t0, 128
  beq t0, zero, .L1
.L2:
  ; basic/strings.e16.ts:692  fail(E_LINE)
  li a0, 5
  call fail
.L1:
  ; basic/strings.e16.ts:693  const at = findLine(peek16(MATH_ARG), true)
  li t0, 65366
  lw a0, 0(t0)
  li a1, 1
  call findLine
  mv s2, a0 ; at
  ; basic/strings.e16.ts:694  if (at === 0) fail(E_LINE)
  bne s2, zero, .L3
  ; basic/strings.e16.ts:694  fail(E_LINE)
  li a0, 5
  call fail
.L3:
  ; basic/strings.e16.ts:695  return at
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/strings.e16.ts:699 onStatement() at -O1
;   n in 2(fp)
;   how in s2
;   chosen in s3
;   k in 0(fp)
;   line/at in s1
onStatement:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  ; basic/strings.e16.ts:700  expr()
  call expr
  ; basic/strings.e16.ts:701  needNumber()
  call needNumber
  ; basic/strings.e16.ts:702  const n = toInt(top())
  call top
  call toInt
  sw a0, 2(fp) ; n
  ; basic/strings.e16.ts:703  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:704  const how = next()
  call next
  mv s2, a0 ; how
  ; basic/strings.e16.ts:705  if (how !== T_GOTO && how !== T_GOSUB) fail(E_SYNTAX)
  li t0, 142
  beq s2, t0, .L1
  li t0, 143
  beq s2, t0, .L1
  ; basic/strings.e16.ts:705  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/strings.e16.ts:706  step()
  call step
  ; basic/strings.e16.ts:707  let chosen: u16 = 0
  li s3, 0 ; chosen
  ; basic/strings.e16.ts:708  let k: i16 = 1
  li t0, 1
  sw t0, 0(fp) ; k
  ; basic/strings.e16.ts:709  for (;;) {
.L2:
  ; basic/strings.e16.ts:710  const line = readUnsigned()
  call readUnsigned
  mv s1, a0 ; line/at
  ; basic/strings.e16.ts:711  if (k === n) chosen = line
  lw t0, 2(fp) ; n
  lw t1, 0(fp) ; k
  bne t1, t0, .L6
  ; basic/strings.e16.ts:711  chosen = line
  mv s3, s1 ; chosen
.L6:
  ; basic/strings.e16.ts:712  if (next() !== CH_COMMA) break
  call next
  li t0, 44
  beq a0, t0, .L7
  ; basic/strings.e16.ts:712  break
  j .L5
.L7:
  ; basic/strings.e16.ts:713  step()
  call step
  ; basic/strings.e16.ts:714  k++
  lw t0, 0(fp) ; k
  addi t0, t0, 1
  sw t0, 0(fp) ; k
  j .L2
.L5:
  ; basic/strings.e16.ts:716  if (chosen === 0) return
  bne s3, zero, .L8
  ; basic/strings.e16.ts:716  return
  j .return
.L8:
  ; basic/strings.e16.ts:717  const at = findLine(chosen, true)
  mv a0, s3
  li a1, 1
  call findLine
  mv s1, a0 ; line/at
  ; basic/strings.e16.ts:718  if (at === 0) fail(E_LINE)
  bne s1, zero, .L9
  ; basic/strings.e16.ts:718  fail(E_LINE)
  li a0, 5
  call fail
.L9:
  ; basic/strings.e16.ts:720  if (how === T_GOSUB) gosubTo(at)
  li t0, 143
  bne s2, t0, .L10
  ; basic/strings.e16.ts:720  gosubTo(at)
  mv a0, s1
  call gosubTo
  j .L11
.L10:
  ; basic/strings.e16.ts:721  jump(at, at + 4)
  mv a0, s1
  addi a1, s1, 4
  call jump
.L11:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/strings.e16.ts:728 waitTicks(ticks) at -O1
;   ticks in s1
;   start in s2
;   lines in s3
waitTicks:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; ticks
  ; basic/strings.e16.ts:729  const start = peek16(IO_TCOUNT)
  li t0, 65328
  lw s2, 0(t0)
  ; basic/strings.e16.ts:730  const lines = csrr(CSR_MIE)
  csrr s3, 772
  ; basic/strings.e16.ts:731  while (u16(peek16(IO_TCOUNT) - start) < ticks) {
  j .L3
.L1:
  ; basic/strings.e16.ts:732  poke16(IO_TCMP, start + ticks)
  add t0, s2, s1
  li t1, 65330
  sw t0, 0(t1)
  ; basic/strings.e16.ts:733  poke16(IO_TCTRL, 1)
  li t0, 1
  li t1, 65332
  sw t0, 0(t1)
  ; basic/strings.e16.ts:736  csrw(CSR_MIE, MIE_TIMER)
  li t0, 1
  csrw 772, t0
  ; basic/strings.e16.ts:739  if (u16(peek16(IO_TCOUNT) - start) < ticks) wfi()
  li t0, 65328
  lw t0, 0(t0)
  sub t0, t0, s2
  bgeu t0, s1, .L5
  ; basic/strings.e16.ts:739  wfi()
  wfi
.L5:
  ; basic/strings.e16.ts:740  poke16(IO_TCTRL, 0)
  li t0, 65332
  sw zero, 0(t0)
  ; basic/strings.e16.ts:741  csrw(CSR_MIE, lines)
  csrw 772, s3
  ; basic/strings.e16.ts:742  checkBreak()
  call checkBreak
.L3:
  li t0, 65328
  lw t0, 0(t0)
  sub t0, t0, s2
  bltu t0, s1, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/strings.e16.ts:747 waitStatement() at -O1
;   n in s1
waitStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/strings.e16.ts:748  let n = wholeArgument(0x7fff)
  li a0, 32767
  call wholeArgument
  mv s1, a0 ; n
  ; basic/strings.e16.ts:749  while (n > 0) {
  j .L3
.L1:
  ; basic/strings.e16.ts:750  waitTicks(16)
  li a0, 16
  call waitTicks
  ; basic/strings.e16.ts:751  n--
  addi s1, s1, -1
.L3:
  bltu zero, s1, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/strings.e16.ts:756 beepStatement() at -O1
;   f in s2
;   ms in s1
beepStatement:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; basic/strings.e16.ts:757  const f = wholeArgument(20000)
  li a0, 20000
  call wholeArgument
  mv s2, a0 ; f
  ; basic/strings.e16.ts:758  let ms: u16 = 100
  li s1, 100 ; ms
  ; basic/strings.e16.ts:759  if (next() === CH_COMMA) {
  call next
  li t0, 44
  bne a0, t0, .L1
  ; basic/strings.e16.ts:760  step()
  call step
  ; basic/strings.e16.ts:761  ms = wholeArgument(10000)
  li a0, 10000
  call wholeArgument
  mv s1, a0 ; ms
.L1:
  ; basic/strings.e16.ts:763  poke16(IO_FREQ, f)
  li t0, 65344
  sw s2, 0(t0)
  ; basic/strings.e16.ts:764  poke16(IO_DUR, ms)
  li t0, 65346
  sw s1, 0(t0)
  ; basic/strings.e16.ts:767  soundMark(true)
  li a0, 1
  call soundMark
  ; basic/strings.e16.ts:769  waitTicks(ms + div(ms * 3 + 124, 125))
  slli t1, s1, 1
  add t0, t1, s1
  li t1, 125
  addi t0, t0, 124
  divu t0, t0, t1
  add a0, s1, t0
  call waitTicks
  ; basic/strings.e16.ts:770  soundMark(false)
  li a0, 0
  call soundMark
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/strings.e16.ts:773 soundMark(on) at -O1
;   on in s2
;   marks in s1
soundMark:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; on
  ; basic/strings.e16.ts:774  const marks = peek16(ANNMODE)
  lw s1, 26(zero)
  ; basic/strings.e16.ts:775  poke16(ANNMODE, on ? marks | ANN_SOUND : marks & (0xffff ^ ANN_SOUND))
  li t0, 26
  mv t1, s2
  beqz t1, .L1
  ori t1, s1, 1024
  j .L2
.L1:
  andi t1, s1, -1025
.L2:
  sw t1, 0(t0)
  ; basic/strings.e16.ts:776  annunciate()
  call annunciate
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/strings.e16.ts:780 wholeArgument(max) at -O1
;   max in s2
;   v in s1
wholeArgument:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; max
  ; basic/strings.e16.ts:781  expr()
  call expr
  ; basic/strings.e16.ts:782  needNumber()
  call needNumber
  ; basic/strings.e16.ts:783  const v = toInt(top())
  call top
  call toInt
  mv s1, a0 ; v
  ; basic/strings.e16.ts:784  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:785  if (v < 0 || u16(v) > max) fail(E_ARGUMENT)
  blt s1, zero, .L2
  bgeu s2, s1, .L1
.L2:
  ; basic/strings.e16.ts:785  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L1:
  ; basic/strings.e16.ts:786  return u16(v)
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/strings.e16.ts:790 dataStatement(c) at -O1
;   c in s1
dataStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/strings.e16.ts:791  if (c === T_DIM) dimStatement()
  li t0, 157
  bne s1, t0, .L1
  ; basic/strings.e16.ts:791  dimStatement()
  call dimStatement
  j .L2
.L1:
  ; basic/strings.e16.ts:792  if (c === T_READ) readStatement()
  li t0, 159
  bne s1, t0, .L3
  ; basic/strings.e16.ts:792  readStatement()
  call readStatement
  j .L4
.L3:
  ; basic/strings.e16.ts:793  if (c === T_RESTORE) restoreStatement()
  li t0, 160
  bne s1, t0, .L5
  ; basic/strings.e16.ts:793  restoreStatement()
  call restoreStatement
  j .L6
.L5:
  ; basic/strings.e16.ts:794  if (c === T_ON) onStatement()
  li t0, 161
  bne s1, t0, .L7
  ; basic/strings.e16.ts:794  onStatement()
  call onStatement
  j .L8
.L7:
  ; basic/strings.e16.ts:795  if (c === T_CLEAR) clearVariables()
  li t0, 162
  bne s1, t0, .L9
  ; basic/strings.e16.ts:795  clearVariables()
  call clearVariables
  j .L10
.L9:
  ; basic/strings.e16.ts:796  if (c === T_WAIT) waitStatement()
  li t0, 155
  bne s1, t0, .L11
  ; basic/strings.e16.ts:796  waitStatement()
  call waitStatement
  j .L12
.L11:
  ; basic/strings.e16.ts:797  if (c === T_BEEP) beepStatement()
  li t0, 156
  bne s1, t0, .L13
  ; basic/strings.e16.ts:797  beepStatement()
  call beepStatement
  j .L14
.L13:
  ; basic/strings.e16.ts:798  fail(E_SYNTAX)
  li a0, 1
  call fail
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
  addi sp, sp, 4
  ret

  .align 2

  .bank 1
  .org 0xc000
; basic/screen.e16.ts:67 whole() at -O1
;   v in s1
whole:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/screen.e16.ts:68  expr()
  call expr
  ; basic/screen.e16.ts:69  needNumber()
  call needNumber
  ; basic/screen.e16.ts:70  const v = toInt(top())
  call top
  call toInt
  mv s1, a0 ; v
  ; basic/screen.e16.ts:71  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/screen.e16.ts:72  return v
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/screen.e16.ts:81 point() at -O1
point:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/screen.e16.ts:82  atX = near(whole())
  call whole
  call near
  sw a0, 0x061e(zero)
  ; basic/screen.e16.ts:83  expect(CH_COMMA)
  li a0, 44
  call expect
  ; basic/screen.e16.ts:84  atY = near(whole())
  call whole
  call near
  sw a0, 0x0620(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/screen.e16.ts:89 near(v) at -O1
;   v in s1
near:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; basic/screen.e16.ts:90  if (v < -FAR || v > FAR) fail(E_ARGUMENT)
  li t0, 61440
  blt s1, t0, .L2
  li t0, 4096
  bge t0, s1, .L1
.L2:
  ; basic/screen.e16.ts:90  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L1:
  ; basic/screen.e16.ts:91  return v
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/screen.e16.ts:95 cell(x, y) at -O1
;   x in a0
;   y in a1
;   width in a2
cell:
  ; basic/screen.e16.ts:96  const width = peek16(WIDTH)
  lw a2, 8(zero)
  ; basic/screen.e16.ts:97  if (x < 0 || y < 0 || u16(x) >= width || u16(y) >= peek16(ROWS) * 8) return 0
  blt a0, zero, .L2
  blt a1, zero, .L2
  bgeu a0, a2, .L2
  lw t0, 6(zero)
  slli t0, t0, 3
  bltu a1, t0, .L1
.L2:
  ; basic/screen.e16.ts:97  return 0
  li a0, 0
  ret
.L1:
  ; basic/screen.e16.ts:98  return VRAM + (u16(y) >> 3) * width + u16(x)
  srli t0, a1, 3
  mul t0, t0, a2
  addi t0, t0, -8192
  add a0, t0, a0
.return:
  ret

; basic/screen.e16.ts:102 dot(x, y, mode) at -O1
;   x in 8(fp)
;   y in 0(fp)
;   mode in 2(fp)
;   at in 4(fp)
;   bit in s2
;   plane in 10(fp)
;   p in s1
;   b in 6(fp)
;   was in s3
dot:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s2, 14(sp)
  sw s1, 16(sp)
  sw s3, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  sw a0, 8(fp) ; x
  sw a1, 0(fp) ; y
  sw a2, 2(fp) ; mode
  ; basic/screen.e16.ts:103  const at = cell(x, y)
  lw a0, 8(fp)
  lw a1, 0(fp)
  call cell
  sw a0, 4(fp) ; at
  ; basic/screen.e16.ts:104  if (at === 0) return
  lw t0, 4(fp) ; at
  bne t0, zero, .L1
  ; basic/screen.e16.ts:104  return
  j .return
.L1:
  ; basic/screen.e16.ts:105  const bit: u16 = 1 << (u16(y) & 7)
  lw t0, 0(fp) ; y
  andi t0, t0, 7
  li t1, 1
  sll s2, t1, t0
  ; basic/screen.e16.ts:106  const plane = peek16(PLANE)
  lw t0, 10(zero)
  sw t0, 10(fp) ; plane
  ; basic/screen.e16.ts:107  for (let p: u16 = 0; p < peek16(DEPTH); p++) {
  li s1, 0 ; p
  j .L4
.L2:
  ; basic/screen.e16.ts:108  const b = at + p * plane
  lw t0, 10(fp) ; plane
  mul t0, s1, t0
  lw t1, 4(fp) ; at
  add t1, t1, t0
  sw t1, 6(fp) ; b
  ; basic/screen.e16.ts:109  const was = peek(b)
  lw t0, 6(fp) ; b
  lbu s3, 0(t0)
  ; basic/screen.e16.ts:110  poke(b, mode === DOT_ON ? was | bit : mode === DOT_OFF ? was & (0xff ^ bit) : was ^ bit)
  lw t0, 6(fp)
  lw t1, 2(fp)
  li t2, 1
  bne t1, t2, .L6
  or t1, s3, s2
  j .L7
.L6:
  lw t1, 2(fp)
  li t2, 0
  bne t1, t2, .L8
  li t1, 255
  xor t1, t1, s2
  and t1, s3, t1
  j .L9
.L8:
  xor t1, s3, s2
.L9:
.L7:
  sb t1, 0(t0)
  addi s1, s1, 1
.L4:
  lw t0, 12(zero)
  bltu s1, t0, .L2
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s2, 14(sp)
  lw s1, 16(sp)
  lw s3, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; basic/screen.e16.ts:115 option(c) at -O1
;   c in s1
option:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/screen.e16.ts:116  if (next() !== CH_COMMA) return false
  call next
  li t0, 44
  beq a0, t0, .L1
  ; basic/screen.e16.ts:116  return false
  li a0, 0
  j .return
.L1:
  ; basic/screen.e16.ts:117  step()
  call step
  ; basic/screen.e16.ts:118  if (next() !== c) fail(E_SYNTAX)
  call next
  beq a0, s1, .L2
  ; basic/screen.e16.ts:118  fail(E_SYNTAX)
  li a0, 1
  call fail
.L2:
  ; basic/screen.e16.ts:119  step()
  call step
  ; basic/screen.e16.ts:120  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/screen.e16.ts:124 dotStatement(set) at -O1
;   set in s1
dotStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; set
  ; basic/screen.e16.ts:125  point()
  call point
  ; basic/screen.e16.ts:126  dot(atX, atY, !set ? DOT_OFF : option(CH_X) ? DOT_FLIP : DOT_ON)
  lw t0, 0x061e(zero)
  lw t1, 0x0620(zero)
  mv t2, s1
  bnez t2, .L1
  li t2, 0
  j .L2
.L1:
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 88
  call option
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv t2, a0
  xor t0, t0, t1
  xor t1, t1, t0
  xor t0, t0, t1
  beqz t2, .L3
  li t2, 2
  j .L4
.L3:
  li t2, 1
.L4:
.L2:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call dot
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/screen.e16.ts:130 locateStatement() at -O1
locateStatement:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/screen.e16.ts:131  point()
  call point
  ; basic/screen.e16.ts:132  if (atX < 0 || atY < 0) fail(E_ARGUMENT)
  lw t0, 0x061e(zero)
  blt t0, zero, .L2
  lw t0, 0x0620(zero)
  bge t0, zero, .L1
.L2:
  ; basic/screen.e16.ts:132  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L1:
  ; basic/screen.e16.ts:133  locate(u16(atX), u16(atY))
  lw t0, 0x061e(zero)
  lw t1, 0x0620(zero)
  mv a0, t0
  mv a1, t1
  call locate
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/screen.e16.ts:137 lineStatement() at -O1
;   x1 in s2
;   y1 in s3
;   box in s1
lineStatement:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; basic/screen.e16.ts:138  expect(CH_LPAREN)
  li a0, 40
  call expect
  ; basic/screen.e16.ts:139  point()
  call point
  ; basic/screen.e16.ts:140  const x1 = atX
  lw s2, 0x061e(zero)
  ; basic/screen.e16.ts:141  const y1 = atY
  lw s3, 0x0620(zero)
  ; basic/screen.e16.ts:142  expect(CH_RPAREN)
  li a0, 41
  call expect
  ; basic/screen.e16.ts:143  expect(CH_MINUS)
  li a0, 45
  call expect
  ; basic/screen.e16.ts:144  expect(CH_LPAREN)
  li a0, 40
  call expect
  ; basic/screen.e16.ts:145  point()
  call point
  ; basic/screen.e16.ts:146  expect(CH_RPAREN)
  li a0, 41
  call expect
  ; basic/screen.e16.ts:147  let box: u16 = 0
  li s1, 0 ; box
  ; basic/screen.e16.ts:148  if (option(CH_B)) {
  li a0, 66
  call option
  beqz a0, .L1
  ; basic/screen.e16.ts:149  box = 1
  li s1, 1 ; box
  ; basic/screen.e16.ts:150  if (next() === CH_F) {
  call next
  li t0, 70
  bne a0, t0, .L2
  ; basic/screen.e16.ts:151  step()
  call step
  ; basic/screen.e16.ts:152  box = 2
  li s1, 2 ; box
.L2:
.L1:
  ; basic/screen.e16.ts:155  if (box === 0) line(x1, y1, atX, atY)
  bne s1, zero, .L3
  ; basic/screen.e16.ts:155  line(x1, y1, atX, atY)
  lw t0, 0x061e(zero)
  lw t1, 0x0620(zero)
  mv a0, s2
  mv a1, s3
  mv a2, t0
  mv a3, t1
  call line
  j .L4
.L3:
  ; basic/screen.e16.ts:156  rectangle(x1, y1, box === 2)
  li t0, 2
  sub t0, s1, t0
  seqz t0, t0
  mv a0, s2
  mv a1, s3
  mv a2, t0
  call rectangle
.L4:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/screen.e16.ts:160 rectangle(x1, y1, filled) at -O1
;   x1 in s3
;   y1 in s1
;   filled in 4(fp)
;   x2 in 0(fp)
;   y2 in s2
;   from in 6(fp)
;   to in 8(fp)
;   y in 2(fp)
rectangle:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s3, 12(sp)
  sw s1, 14(sp)
  sw s2, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  mv s3, a0 ; x1
  mv s1, a1 ; y1
  sw a2, 4(fp) ; filled
  ; basic/screen.e16.ts:161  const x2 = atX
  lw t0, 0x061e(zero)
  sw t0, 0(fp) ; x2
  ; basic/screen.e16.ts:162  const y2 = atY
  lw s2, 0x0620(zero)
  ; basic/screen.e16.ts:163  if (!filled) {
  lw t0, 4(fp) ; filled
  bnez t0, .L1
  ; basic/screen.e16.ts:164  line(x1, y1, x2, y1)
  mv a0, s3
  mv a1, s1
  lw a2, 0(fp)
  mv a3, s1
  call line
  ; basic/screen.e16.ts:165  line(x2, y1, x2, y2)
  lw a0, 0(fp)
  mv a1, s1
  lw a2, 0(fp)
  mv a3, s2
  call line
  ; basic/screen.e16.ts:166  line(x2, y2, x1, y2)
  lw a0, 0(fp)
  mv a1, s2
  mv a2, s3
  mv a3, s2
  call line
  ; basic/screen.e16.ts:167  line(x1, y2, x1, y1)
  mv a0, s3
  mv a1, s2
  mv a2, s3
  mv a3, s1
  call line
  ; basic/screen.e16.ts:168  return
  j .return
.L1:
  ; basic/screen.e16.ts:170  const from = y1 < y2 ? y1 : y2
  bge s1, s2, .L2
  mv t0, s1
  j .L3
.L2:
  mv t0, s2
.L3:
  sw t0, 6(fp) ; from
  ; basic/screen.e16.ts:171  const to = y1 < y2 ? y2 : y1
  bge s1, s2, .L4
  mv t0, s2
  j .L5
.L4:
  mv t0, s1
.L5:
  sw t0, 8(fp) ; to
  ; basic/screen.e16.ts:172  for (let y = from; y <= to; y++) {
  lw t0, 6(fp) ; from
  sw t0, 2(fp) ; y
  j .L8
.L6:
  ; basic/screen.e16.ts:173  checkBreak()
  call checkBreak
  ; basic/screen.e16.ts:174  line(x1, y, x2, y)
  mv a0, s3
  lw a1, 2(fp)
  lw a2, 0(fp)
  lw a3, 2(fp)
  call line
  lw t0, 2(fp) ; y
  addi t0, t0, 1
  sw t0, 2(fp) ; y
.L8:
  lw t0, 8(fp) ; to
  lw t1, 2(fp) ; y
  bge t0, t1, .L6
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s3, 12(sp)
  lw s1, 14(sp)
  lw s2, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; basic/screen.e16.ts:179 line(x1, y1, x2, y2) at -O1
;   x1 in s1
;   y1 in s2
;   x2 in s3
;   y2 in 0(fp)
;   dx in 8(fp)
;   dy in 10(fp)
;   sx in 14(fp)
;   sy in 16(fp)
;   err in 2(fp)
;   x in 4(fp)
;   y in 6(fp)
;   e2 in 12(fp)
line:
  addi sp, sp, -28
  sw ra, 18(sp)
  sw s1, 20(sp)
  sw s2, 22(sp)
  sw s3, 24(sp)
  sw s0, 26(sp)
  mv fp, sp
  mv s1, a0 ; x1
  mv s2, a1 ; y1
  mv s3, a2 ; x2
  sw a3, 0(fp) ; y2
  ; basic/screen.e16.ts:180  const dx: i16 = x2 > x1 ? x2 - x1 : x1 - x2
  bge s1, s3, .L1
  sub t0, s3, s1
  j .L2
.L1:
  sub t0, s1, s3
.L2:
  sw t0, 8(fp) ; dx
  ; basic/screen.e16.ts:181  const dy: i16 = y2 > y1 ? y2 - y1 : y1 - y2
  lw t0, 0(fp) ; y2
  bge s2, t0, .L3
  lw t0, 0(fp) ; y2
  sub t0, t0, s2
  j .L4
.L3:
  lw t0, 0(fp) ; y2
  sub t0, s2, t0
.L4:
  sw t0, 10(fp) ; dy
  ; basic/screen.e16.ts:182  const sx: i16 = x1 < x2 ? 1 : -1
  bge s1, s3, .L5
  li t0, 1
  j .L6
.L5:
  li t0, 65535
.L6:
  sw t0, 14(fp) ; sx
  ; basic/screen.e16.ts:183  const sy: i16 = y1 < y2 ? 1 : -1
  lw t0, 0(fp) ; y2
  bge s2, t0, .L7
  li t0, 1
  j .L8
.L7:
  li t0, 65535
.L8:
  sw t0, 16(fp) ; sy
  ; basic/screen.e16.ts:184  let err: i16 = dx - dy
  lw t0, 10(fp) ; dy
  lw t1, 8(fp) ; dx
  sub t1, t1, t0
  sw t1, 2(fp) ; err
  ; basic/screen.e16.ts:185  let x = x1
  sw s1, 4(fp) ; x
  ; basic/screen.e16.ts:186  let y = y1
  sw s2, 6(fp) ; y
  ; basic/screen.e16.ts:187  for (;;) {
.L9:
  ; basic/screen.e16.ts:188  dot(x, y, DOT_ON)
  lw a0, 4(fp)
  lw a1, 6(fp)
  li a2, 1
  call dot
  ; basic/screen.e16.ts:189  if (x === x2 && y === y2) return
  lw t0, 4(fp) ; x
  bne t0, s3, .L13
  lw t0, 0(fp) ; y2
  lw t1, 6(fp) ; y
  bne t1, t0, .L13
  ; basic/screen.e16.ts:189  return
  j .return
.L13:
  ; basic/screen.e16.ts:190  const e2: i16 = err * 2
  lw t0, 2(fp) ; err
  slli t0, t0, 1
  sw t0, 12(fp) ; e2
  ; basic/screen.e16.ts:191  if (e2 > -dy) {
  lw t0, 10(fp) ; dy
  neg t0, t0
  lw t1, 12(fp) ; e2
  bge t0, t1, .L14
  ; basic/screen.e16.ts:192  err -= dy
  lw t0, 10(fp) ; dy
  lw t1, 2(fp) ; err
  sub t1, t1, t0
  sw t1, 2(fp) ; err
  ; basic/screen.e16.ts:193  x += sx
  lw t0, 14(fp) ; sx
  lw t1, 4(fp) ; x
  add t1, t1, t0
  sw t1, 4(fp) ; x
.L14:
  ; basic/screen.e16.ts:195  if (e2 < dx) {
  lw t0, 8(fp) ; dx
  lw t1, 12(fp) ; e2
  bge t1, t0, .L9
  ; basic/screen.e16.ts:196  err += dx
  lw t0, 8(fp) ; dx
  lw t1, 2(fp) ; err
  add t1, t1, t0
  sw t1, 2(fp) ; err
  ; basic/screen.e16.ts:197  y += sy
  lw t0, 16(fp) ; sy
  lw t1, 6(fp) ; y
  add t1, t1, t0
  sw t1, 6(fp) ; y
  j .L9
.return:
  mv sp, fp
  lw ra, 18(sp)
  lw s1, 20(sp)
  lw s2, 22(sp)
  lw s3, 24(sp)
  lw s0, 26(sp)
  addi sp, sp, 28
  ret

; basic/screen.e16.ts:206 circleStatement() at -O1
;   r in 4(fp)
;   filled in 6(fp)
;   cx in s3
;   cy in 0(fp)
;   x in s2
;   y in s1
;   err in 2(fp)
circleStatement:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s3, 10(sp)
  sw s2, 12(sp)
  sw s1, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  ; basic/screen.e16.ts:207  expect(CH_LPAREN)
  li a0, 40
  call expect
  ; basic/screen.e16.ts:208  point()
  call point
  ; basic/screen.e16.ts:209  expect(CH_RPAREN)
  li a0, 41
  call expect
  ; basic/screen.e16.ts:210  expect(CH_COMMA)
  li a0, 44
  call expect
  ; basic/screen.e16.ts:211  const r = near(whole())
  call whole
  call near
  sw a0, 4(fp) ; r
  ; basic/screen.e16.ts:212  if (r < 0) fail(E_ARGUMENT)
  lw t0, 4(fp) ; r
  bge t0, zero, .L1
  ; basic/screen.e16.ts:212  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L1:
  ; basic/screen.e16.ts:213  const filled = option(CH_F)
  li a0, 70
  call option
  sw a0, 6(fp) ; filled
  ; basic/screen.e16.ts:214  const cx = atX
  lw s3, 0x061e(zero)
  ; basic/screen.e16.ts:215  const cy = atY
  lw t0, 0x0620(zero)
  sw t0, 0(fp) ; cy
  ; basic/screen.e16.ts:216  let x: i16 = r
  lw s2, 4(fp) ; r
  ; basic/screen.e16.ts:217  let y: i16 = 0
  li s1, 0 ; y
  ; basic/screen.e16.ts:218  let err: i16 = 1 - r
  lw t0, 4(fp) ; r
  li t1, 1
  sub t1, t1, t0
  sw t1, 2(fp) ; err
  ; basic/screen.e16.ts:219  while (x >= y) {
  j .L4
.L2:
  ; basic/screen.e16.ts:220  checkBreak()
  call checkBreak
  ; basic/screen.e16.ts:221  if (filled) {
  lw t0, 6(fp) ; filled
  beqz t0, .L6
  ; basic/screen.e16.ts:222  span(cx - x, cx + x, cy + y)
  sub t0, s3, s2
  add t1, s3, s2
  lw t2, 0(fp) ; cy
  add t2, t2, s1
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call span
  ; basic/screen.e16.ts:223  span(cx - x, cx + x, cy - y)
  sub t0, s3, s2
  add t1, s3, s2
  lw t2, 0(fp) ; cy
  sub t2, t2, s1
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call span
  ; basic/screen.e16.ts:224  span(cx - y, cx + y, cy + x)
  sub t0, s3, s1
  add t1, s3, s1
  lw t2, 0(fp) ; cy
  add t2, t2, s2
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call span
  ; basic/screen.e16.ts:225  span(cx - y, cx + y, cy - x)
  sub t0, s3, s1
  add t1, s3, s1
  lw t2, 0(fp) ; cy
  sub t2, t2, s2
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call span
  j .L7
.L6:
  ; basic/screen.e16.ts:227  eight(cx, cy, x, y)
  mv a0, s3
  lw a1, 0(fp)
  mv a2, s2
  mv a3, s1
  call eight
.L7:
  ; basic/screen.e16.ts:229  y++
  addi s1, s1, 1
  ; basic/screen.e16.ts:230  if (err < 0) err += 2 * y + 1
  lw t0, 2(fp) ; err
  bge t0, zero, .L8
  ; basic/screen.e16.ts:230  err += 2 * y + 1
  li t0, 2
  mul t0, t0, s1
  addi t0, t0, 1
  lw t1, 2(fp) ; err
  add t1, t1, t0
  sw t1, 2(fp) ; err
  j .L9
.L8:
  ; basic/screen.e16.ts:232  x--
  addi s2, s2, -1
  ; basic/screen.e16.ts:233  err += 2 * (y - x) + 1
  sub t0, s1, s2
  li t1, 2
  mul t1, t1, t0
  addi t1, t1, 1
  lw t0, 2(fp) ; err
  add t0, t0, t1
  sw t0, 2(fp) ; err
.L9:
.L4:
  bge s2, s1, .L2
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s3, 10(sp)
  lw s2, 12(sp)
  lw s1, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; basic/screen.e16.ts:239 eight(cx, cy, x, y) at -O1
;   cx in s1
;   cy in s2
;   x in s3
;   y in s0
eight:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; cx
  mv s2, a1 ; cy
  mv s3, a2 ; x
  mv s0, a3 ; y
  ; basic/screen.e16.ts:240  dot(cx + x, cy + y, DOT_ON)
  add t0, s1, s3
  add t1, s2, s0
  mv a0, t0
  mv a1, t1
  li a2, 1
  call dot
  ; basic/screen.e16.ts:241  dot(cx - x, cy + y, DOT_ON)
  sub t0, s1, s3
  add t1, s2, s0
  mv a0, t0
  mv a1, t1
  li a2, 1
  call dot
  ; basic/screen.e16.ts:242  dot(cx + x, cy - y, DOT_ON)
  add t0, s1, s3
  sub t1, s2, s0
  mv a0, t0
  mv a1, t1
  li a2, 1
  call dot
  ; basic/screen.e16.ts:243  dot(cx - x, cy - y, DOT_ON)
  sub t0, s1, s3
  sub t1, s2, s0
  mv a0, t0
  mv a1, t1
  li a2, 1
  call dot
  ; basic/screen.e16.ts:244  dot(cx + y, cy + x, DOT_ON)
  add t0, s1, s0
  add t1, s2, s3
  mv a0, t0
  mv a1, t1
  li a2, 1
  call dot
  ; basic/screen.e16.ts:245  dot(cx - y, cy + x, DOT_ON)
  sub t0, s1, s0
  add t1, s2, s3
  mv a0, t0
  mv a1, t1
  li a2, 1
  call dot
  ; basic/screen.e16.ts:246  dot(cx + y, cy - x, DOT_ON)
  add t0, s1, s0
  sub t1, s2, s3
  mv a0, t0
  mv a1, t1
  li a2, 1
  call dot
  ; basic/screen.e16.ts:247  dot(cx - y, cy - x, DOT_ON)
  sub t0, s1, s0
  sub t1, s2, s3
  mv a0, t0
  mv a1, t1
  li a2, 1
  call dot
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; basic/screen.e16.ts:254 span(x1, x2, y) at -O1
;   x1 in s3
;   x2 in 0(fp)
;   y in s2
;   last in 2(fp)
;   from in 4(fp)
;   to in 6(fp)
;   x in s1
span:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s3, 10(sp)
  sw s2, 12(sp)
  sw s1, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s3, a0 ; x1
  sw a1, 0(fp) ; x2
  mv s2, a2 ; y
  ; basic/screen.e16.ts:255  if (y < 0 || u16(y) >= peek16(ROWS) * 8) return
  blt s2, zero, .L2
  lw t0, 6(zero)
  slli t0, t0, 3
  bltu s2, t0, .L1
.L2:
  ; basic/screen.e16.ts:255  return
  j .return
.L1:
  ; basic/screen.e16.ts:256  const last = i16(peek16(WIDTH) - 1)
  lw t0, 8(zero)
  addi t0, t0, -1
  sw t0, 2(fp) ; last
  ; basic/screen.e16.ts:257  const from = x1 < 0 ? 0 : x1
  bge s3, zero, .L3
  li t0, 0
  j .L4
.L3:
  mv t0, s3
.L4:
  sw t0, 4(fp) ; from
  ; basic/screen.e16.ts:258  const to = x2 > last ? last : x2
  lw t0, 2(fp) ; last
  lw t1, 0(fp) ; x2
  bge t0, t1, .L5
  lw t0, 2(fp)
  j .L6
.L5:
  lw t0, 0(fp)
.L6:
  sw t0, 6(fp) ; to
  ; basic/screen.e16.ts:259  for (let x = from; x <= to; x++) dot(x, y, DOT_ON)
  lw s1, 4(fp) ; from
  j .L9
.L7:
  ; basic/screen.e16.ts:259  dot(x, y, DOT_ON)
  mv a0, s1
  mv a1, s2
  li a2, 1
  call dot
  addi s1, s1, 1
.L9:
  lw t0, 6(fp) ; to
  bge t0, s1, .L7
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s3, 10(sp)
  lw s2, 12(sp)
  lw s1, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; basic/screen.e16.ts:267 gprintStatement() at -O1
;   x in s2
;   row in 2(fp)
;   at/c/cols in s1
;   n/after in 0(fp)
;   k in s3
gprintStatement:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  ; basic/screen.e16.ts:268  let x = peek16(CURX) * 6
  lw t0, 0(zero)
  slli t1, t0, 2
  slli t0, t0, 1
  add s2, t0, t1
  ; basic/screen.e16.ts:269  const row = peek16(CURY)
  lw t0, 2(zero)
  sw t0, 2(fp) ; row
  ; basic/screen.e16.ts:270  for (;;) {
.L1:
  ; basic/screen.e16.ts:271  expr()
  call expr
  ; basic/screen.e16.ts:272  if (strType) {
  lw t0, 0x0118(zero)
  beqz t0, .L5
  ; basic/screen.e16.ts:273  const at = stringAt(top())
  call top
  call stringAt
  mv s1, a0 ; at/c/cols
  ; basic/screen.e16.ts:274  const n = stringLength(top())
  call top
  call stringLength
  sw a0, 0(fp) ; n/after
  ; basic/screen.e16.ts:275  for (let k: u16 = 0; k + 1 < n; k += 2) {
  li s3, 0 ; k
  j .L8
.L6:
  ; basic/screen.e16.ts:276  column(x, row, hex(peek(at + k)) * 16 + hex(peek(at + k + 1)))
  add t0, s1, s3
  lbu a0, 0(t0)
  call hex
  slli t0, a0, 4
  add t1, s1, s3
  lbu t1, 1(t1)
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  call hex
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  mv a0, s2
  lw a1, 2(fp)
  mv a2, t0
  call column
  ; basic/screen.e16.ts:277  x++
  addi s2, s2, 1
  addi s3, s3, 2
.L8:
  lw t0, 0(fp) ; n/after
  addi t1, s3, 1
  bltu t1, t0, .L6
  j .L10
.L5:
  ; basic/screen.e16.ts:279  column(x, row, u16(toInt(top())) & 0xff)
  call top
  call toInt
  andi t0, a0, 255
  mv a0, s2
  lw a1, 2(fp)
  mv a2, t0
  call column
.L10:
  ; basic/screen.e16.ts:280  if (!strType) x++
  lw t0, 0x0118(zero)
  bnez t0, .L11
  ; basic/screen.e16.ts:280  x++
  addi s2, s2, 1
.L11:
  ; basic/screen.e16.ts:281  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/screen.e16.ts:282  const c = next()
  call next
  mv s1, a0 ; at/c/cols
  ; basic/screen.e16.ts:283  if (c !== CH_SEMI && c !== CH_COMMA) break
  li t0, 59
  beq s1, t0, .L12
  li t0, 44
  beq s1, t0, .L12
  ; basic/screen.e16.ts:283  break
  j .L4
.L12:
  ; basic/screen.e16.ts:284  step()
  call step
  j .L1
.L4:
  ; basic/screen.e16.ts:286  const cols = peek16(COLS)
  lw s1, 4(zero)
  ; basic/screen.e16.ts:287  const after = div(x + 5, 6)
  li t0, 6
  addi t1, s2, 5
  divu t1, t1, t0
  sw t1, 0(fp) ; n/after
  ; basic/screen.e16.ts:288  locate(after < cols ? after : cols - 1, row)
  lw t0, 0(fp) ; n/after
  bgeu t0, s1, .L13
  lw t0, 0(fp)
  j .L14
.L13:
  addi t0, s1, -1
.L14:
  mv a0, t0
  lw a1, 2(fp)
  call locate
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/screen.e16.ts:292 column(x, row, bits) at -O1
;   x in a0
;   row in a1
;   bits in a2
;   width in s1
;   plane in s2
;   p in a3
column:
  addi sp, sp, -4
  sw s1, 0(sp)
  sw s2, 2(sp)
  ; basic/screen.e16.ts:293  const width = peek16(WIDTH)
  lw s1, 8(zero)
  ; basic/screen.e16.ts:294  if (x >= width) return
  bltu a0, s1, .L1
  ; basic/screen.e16.ts:294  return
  j .return
.L1:
  ; basic/screen.e16.ts:295  const plane = peek16(PLANE)
  lw s2, 10(zero)
  ; basic/screen.e16.ts:296  for (let p: u16 = 0; p < peek16(DEPTH); p++) poke(VRAM + row * width + x + p * plane, bits)
  li a3, 0 ; p
  j .L4
.L2:
  ; basic/screen.e16.ts:296  poke(VRAM + row * width + x + p * plane, bits)
  mul t0, a1, s1
  addi t0, t0, -8192
  add t0, t0, a0
  mul t1, a3, s2
  add t0, t0, t1
  sb a2, 0(t0)
  addi a3, a3, 1
.L4:
  lw t0, 12(zero)
  bltu a3, t0, .L2
.return:
  lw s1, 0(sp)
  lw s2, 2(sp)
  addi sp, sp, 4
  ret

; basic/screen.e16.ts:300 hex(c) at -O1
;   c in s1
hex:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/screen.e16.ts:301  if (c >= CH_0 && c <= CH_0 + 9) return c - CH_0
  li t0, 48
  bltu s1, t0, .L1
  li t0, 57
  bltu t0, s1, .L1
  ; basic/screen.e16.ts:301  return c - CH_0
  addi a0, s1, -48
  j .return
.L1:
  ; basic/screen.e16.ts:302  if (c >= CH_A && c <= CH_A + 5) return c - CH_A + 10
  li t0, 65
  bltu s1, t0, .L2
  li t0, 70
  bltu t0, s1, .L2
  ; basic/screen.e16.ts:302  return c - CH_A + 10
  addi a0, s1, -55
  j .return
.L2:
  ; basic/screen.e16.ts:303  fail(E_ARGUMENT)
  li a0, 4
  call fail
  ; basic/screen.e16.ts:304  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/screen.e16.ts:308 pointFunction() at -O1
;   at in s1
;   on in s2
pointFunction:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; basic/screen.e16.ts:309  expect(CH_LPAREN)
  li a0, 40
  call expect
  ; basic/screen.e16.ts:310  point()
  call point
  ; basic/screen.e16.ts:311  expect(CH_RPAREN)
  li a0, 41
  call expect
  ; basic/screen.e16.ts:312  const at = cell(atX, atY)
  lw t0, 0x061e(zero)
  lw t1, 0x0620(zero)
  mv a0, t0
  mv a1, t1
  call cell
  mv s1, a0 ; at
  ; basic/screen.e16.ts:313  const on = at !== 0 && (peek(at) & (1 << (u16(atY) & 7))) !== 0
  sub t0, s1, zero
  snez t0, t0
  mv t1, t0
  beqz t1, .L1
  lbu t0, 0(s1)
  lw t1, 0x0620(zero)
  andi t1, t1, 7
  li t2, 1
  sll t2, t2, t1
  and t0, t0, t2
  sub t0, t0, zero
  snez t0, t0
.L1:
  mv s2, t0 ; on
  ; basic/screen.e16.ts:314  setInt(push(), on ? 1 : 0)
  call push
  mv t0, a0
  mv t1, s2
  beqz t1, .L2
  li t1, 1
  j .L3
.L2:
  li t1, 0
.L3:
  mv a0, t0
  mv a1, t1
  call setInt
  ; basic/screen.e16.ts:315  setStrType(false)
  li a0, 0
  call setStrType
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/screen.e16.ts:319 screenStatement(c) at -O1
;   c in s1
screenStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/screen.e16.ts:320  if (c === T_LOCATE) locateStatement()
  li t0, 172
  bne s1, t0, .L1
  ; basic/screen.e16.ts:320  locateStatement()
  call locateStatement
  j .L2
.L1:
  ; basic/screen.e16.ts:321  if (c === T_CURSOR) poke16(IO_CURMODE, u16(whole()) & 7)
  li t0, 173
  bne s1, t0, .L3
  ; basic/screen.e16.ts:321  poke16(IO_CURMODE, u16(whole()) & 7)
  call whole
  andi t0, a0, 7
  li t1, 65324
  sw t0, 0(t1)
  j .L4
.L3:
  ; basic/screen.e16.ts:322  if (c === T_PSET || c === T_PRESET) dotStatement(c === T_PSET)
  li t0, 174
  beq s1, t0, .L6
  li t0, 175
  bne s1, t0, .L5
.L6:
  ; basic/screen.e16.ts:322  dotStatement(c === T_PSET)
  li t0, 174
  sub t0, s1, t0
  seqz a0, t0
  call dotStatement
  j .L7
.L5:
  ; basic/screen.e16.ts:323  if (c === T_LINE) lineStatement()
  li t0, 176
  bne s1, t0, .L8
  ; basic/screen.e16.ts:323  lineStatement()
  call lineStatement
  j .L9
.L8:
  ; basic/screen.e16.ts:324  if (c === T_CIRCLE) circleStatement()
  li t0, 219
  bne s1, t0, .L10
  ; basic/screen.e16.ts:324  circleStatement()
  call circleStatement
  j .L11
.L10:
  ; basic/screen.e16.ts:325  if (c === T_GPRINT) gprintStatement()
  li t0, 177
  bne s1, t0, .L12
  ; basic/screen.e16.ts:325  gprintStatement()
  call gprintStatement
  j .L13
.L12:
  ; basic/screen.e16.ts:326  fail(E_SYNTAX)
  li a0, 1
  call fail
.L13:
.L11:
.L9:
.L7:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

  .align 2

  .bank 2
  .org 0xc000
; basic/files.e16.ts:135 cardCall(op, offset, at, length) at -O1
;   op in a0
;   offset in a1
;   at in a2
;   length in a3
;   b in s1
;   st in s2
cardCall:
  addi sp, sp, -4
  sw s1, 0(sp)
  sw s2, 2(sp)
  ; basic/files.e16.ts:136  const b = addr(cardBlock)
  la s1, cardBlock
  ; basic/files.e16.ts:137  poke16(b + 24, offset)
  sw a1, 24(s1)
  ; basic/files.e16.ts:138  poke16(b + 26, at)
  sw a2, 26(s1)
  ; basic/files.e16.ts:139  poke16(b + 28, length)
  sw a3, 28(s1)
  ; basic/files.e16.ts:140  poke16(CARD_BLOCK, b)
  li t0, 65378
  sw s1, 0(t0)
  ; basic/files.e16.ts:141  poke16(CARD_CMD, op)
  li t0, 65376
  sw a0, 0(t0)
  ; basic/files.e16.ts:142  for (;;) {
.L1:
  ; basic/files.e16.ts:143  const st = peek16(CARD_STATUS)
  li t0, 65380
  lw s2, 0(t0)
  ; basic/files.e16.ts:144  if (st !== ST_BUSY) return st
  li t0, 1
  beq s2, t0, .L5
  ; basic/files.e16.ts:144  return st
  mv a0, s2
  j .return
.L5:
  ; basic/files.e16.ts:145  wfi()
  wfi
  j .L1
.return:
  lw s1, 0(sp)
  lw s2, 2(sp)
  addi sp, sp, 4
  ret

; basic/files.e16.ts:150 cardMust(op, offset, at, length) at -O1
;   op in s2
;   offset in s3
;   at in 0(fp)
;   length in 2(fp)
;   st in s1
cardMust:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; op
  mv s3, a1 ; offset
  sw a2, 0(fp) ; at
  sw a3, 2(fp) ; length
  ; basic/files.e16.ts:151  const st = cardCall(op, offset, at, length)
  mv a0, s2
  mv a1, s3
  lw a2, 0(fp)
  lw a3, 2(fp)
  call cardCall
  mv s1, a0 ; st
  ; basic/files.e16.ts:152  if (st === 0) return
  bne s1, zero, .L1
  ; basic/files.e16.ts:152  return
  j .return
.L1:
  ; basic/files.e16.ts:153  if (st === ST_NOFILE) fail(E_NOFILE)
  li t0, 2
  bne s1, t0, .L2
  ; basic/files.e16.ts:153  fail(E_NOFILE)
  li a0, 12
  call fail
.L2:
  ; basic/files.e16.ts:154  if (st === ST_BADNAME) fail(E_FILE)
  li t0, 3
  bne s1, t0, .L3
  ; basic/files.e16.ts:154  fail(E_FILE)
  li a0, 17
  call fail
.L3:
  ; basic/files.e16.ts:155  fail(E_CARD)
  li a0, 13
  call fail
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/files.e16.ts:159 nameArg(ext) at -O1
;   ext in 0(fp)
;   at in 2(fp)
;   n in 4(fp)
;   b in s3
;   dot in 6(fp)
;   k/e in s1
;   k in s2
nameArg:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s2, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 0(fp) ; ext
  ; basic/files.e16.ts:160  expr()
  call expr
  ; basic/files.e16.ts:161  needString()
  call needString
  ; basic/files.e16.ts:162  const at = stringAt(top())
  call top
  call stringAt
  sw a0, 2(fp) ; at
  ; basic/files.e16.ts:163  const n = stringLength(top())
  call top
  call stringLength
  sw a0, 4(fp) ; n
  ; basic/files.e16.ts:164  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/files.e16.ts:165  const b = addr(cardBlock)
  la s3, cardBlock
  ; basic/files.e16.ts:166  memset(b, 0, 24)
  mv a0, s3
  li a1, 0
  li a2, 24
  mset a0, a1, a2
  ; basic/files.e16.ts:167  let dot = false
  sw zero, 6(fp) ; dot
  ; basic/files.e16.ts:168  for (let k: u16 = 0; k < n; k++) {
  li s1, 0 ; k/e
  j .L3
.L1:
  ; basic/files.e16.ts:169  if (k >= 12) fail(E_FILE)
  li t0, 12
  bltu s1, t0, .L5
  ; basic/files.e16.ts:169  fail(E_FILE)
  li a0, 17
  call fail
.L5:
  ; basic/files.e16.ts:170  poke(b + k, peek(at + k))
  add t0, s3, s1
  lw t1, 2(fp) ; at
  add t1, t1, s1
  lbu t1, 0(t1)
  sb t1, 0(t0)
  ; basic/files.e16.ts:171  if (peek(at + k) === CH_DOT) dot = true
  lw t0, 2(fp) ; at
  add t0, t0, s1
  lbu t0, 0(t0)
  li t1, 46
  bne t0, t1, .L6
  ; basic/files.e16.ts:171  dot = true
  li t0, 1
  sw t0, 6(fp) ; dot
.L6:
  addi s1, s1, 1
.L3:
  lw t0, 4(fp) ; n
  bltu s1, t0, .L1
  ; basic/files.e16.ts:173  if (dot || ext === 0) return
  lw t0, 6(fp) ; dot
  bnez t0, .L8
  lw t0, 0(fp) ; ext
  bne t0, zero, .L7
.L8:
  ; basic/files.e16.ts:173  return
  j .return
.L7:
  ; basic/files.e16.ts:174  let e = ext
  lw s1, 0(fp) ; ext
  ; basic/files.e16.ts:175  let k = n
  lw s2, 4(fp) ; n
  ; basic/files.e16.ts:176  while (peek(e) !== 0) {
  j .L11
.L9:
  ; basic/files.e16.ts:177  if (k >= 12) fail(E_FILE)
  li t0, 12
  bltu s2, t0, .L13
  ; basic/files.e16.ts:177  fail(E_FILE)
  li a0, 17
  call fail
.L13:
  ; basic/files.e16.ts:178  poke(b + k, peek(e))
  add t0, s3, s2
  lbu t1, 0(s1)
  sb t1, 0(t0)
  ; basic/files.e16.ts:179  e++
  addi s1, s1, 1
  ; basic/files.e16.ts:180  k++
  addi s2, s2, 1
.L11:
  lbu t0, 0(s1)
  bne t0, zero, .L9
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s2, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; basic/files.e16.ts:185 isMachineCode() at -O1
;   b in a1
;   k in a0
isMachineCode:
  ; basic/files.e16.ts:186  const b = addr(cardBlock)
  la a1, cardBlock
  ; basic/files.e16.ts:187  let k: u16 = 0
  li a0, 0 ; k
  ; basic/files.e16.ts:188  while (k < 12 && peek(b + k) !== 0) k++
  j .L3
.L1:
  ; basic/files.e16.ts:188  k++
  addi a0, a0, 1
.L3:
  li t0, 12
  bgeu a0, t0, .L5
  add t0, a1, a0
  lbu t0, 0(t0)
  bne t0, zero, .L1
.L5:
  ; basic/files.e16.ts:189  return (
  li t0, 4
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L9
  add t0, a1, a0
  lbu t0, -4(t0)
  li t1, 46
  sub t0, t0, t1
  seqz t0, t0
.L9:
  mv t1, t0
  beqz t1, .L8
  add t0, a1, a0
  lbu t0, -3(t0)
  li t1, 66
  sub t0, t0, t1
  seqz t0, t0
.L8:
  mv t1, t0
  beqz t1, .L7
  add t0, a1, a0
  lbu t0, -2(t0)
  li t1, 73
  sub t0, t0, t1
  seqz t0, t0
.L7:
  mv t1, t0
  beqz t1, .L6
  add t0, a1, a0
  lbu t0, -1(t0)
  li t1, 78
  sub t0, t0, t1
  seqz t0, t0
.L6:
  mv a0, t0
.return:
  ret

; basic/files.e16.ts:199 address() at -O1
;   v in s1
address:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/files.e16.ts:200  expr()
  call expr
  ; basic/files.e16.ts:201  needNumber()
  call needNumber
  ; basic/files.e16.ts:202  const v = toWord(top())
  call top
  call toWord
  mv s1, a0 ; v
  ; basic/files.e16.ts:203  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/files.e16.ts:204  return v
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/files.e16.ts:213 filesStatement() at -O1
;   soft in 2(fp)
;   total in s3
;   shown in 4(fp)
;   k/kb in s2
;   e in 0(fp)
;   n in s1
filesStatement:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  ; basic/files.e16.ts:214  const soft = !statementEnds()
  call statementEnds
  seqz t0, a0
  sw t0, 2(fp) ; soft
  ; basic/files.e16.ts:215  if (soft) nameArg(0)
  lw t0, 2(fp) ; soft
  beqz t0, .L1
  ; basic/files.e16.ts:215  nameArg(0)
  li a0, 0
  call nameArg
  j .L2
.L1:
  ; basic/files.e16.ts:216  poke(addr(cardBlock), 0)
  sb zero, cardBlock(zero)
.L2:
  ; basic/files.e16.ts:217  cardMust(OP_DIR, 0, addr(cardBuf), 256)
  li a0, 1
  li a1, 0
  la a2, cardBuf
  li a3, 256
  call cardMust
  ; basic/files.e16.ts:218  const total = peek16(CARD_RESULT)
  li t0, 65382
  lw s3, 0(t0)
  ; basic/files.e16.ts:219  const shown = total < 16 ? total : 16
  li t0, 16
  bgeu s3, t0, .L3
  mv t0, s3
  j .L4
.L3:
  li t0, 16
.L4:
  sw t0, 4(fp) ; shown
  ; basic/files.e16.ts:220  for (let k: u16 = 0; k < shown; k++) {
  li s2, 0 ; k/kb
  j .L7
.L5:
  ; basic/files.e16.ts:221  checkBreak()
  call checkBreak
  ; basic/files.e16.ts:222  const e = addr(cardBuf) + k * 16
  slli t0, s2, 4
  addi t0, t0, cardBuf
  sw t0, 0(fp) ; e
  ; basic/files.e16.ts:223  let n: u16 = 0
  li s1, 0 ; n
  ; basic/files.e16.ts:224  while (n < 12 && peek(e + n) !== 0) {
  j .L11
.L9:
  ; basic/files.e16.ts:225  putc(peek(e + n))
  lw t0, 0(fp) ; e
  add t0, t0, s1
  lbu a0, 0(t0)
  call putc
  ; basic/files.e16.ts:226  n++
  addi s1, s1, 1
.L11:
  li t0, 12
  bgeu s1, t0, .L16
  lw t0, 0(fp) ; e
  add t0, t0, s1
  lbu t0, 0(t0)
  bne t0, zero, .L9
  ; basic/files.e16.ts:228  while (n < 13) {
  j .L16
.L14:
  ; basic/files.e16.ts:229  putc(CH_SPACE)
  li a0, 32
  call putc
  ; basic/files.e16.ts:230  n++
  addi s1, s1, 1
.L16:
  li t0, 13
  bltu s1, t0, .L14
  ; basic/files.e16.ts:232  printUnsigned(peek16(e + 12))
  lw t0, 0(fp) ; e
  lw a0, 12(t0)
  call printUnsigned
  ; basic/files.e16.ts:233  newline()
  call newline
  addi s2, s2, 1
.L7:
  lw t0, 4(fp) ; shown
  bltu s2, t0, .L5
  ; basic/files.e16.ts:235  if (total > shown) {
  lw t0, 4(fp) ; shown
  bgeu t0, s3, .L18
  ; basic/files.e16.ts:236  puts(str('...'))
  la a0, str_30
  call puts
  ; basic/files.e16.ts:237  newline()
  call newline
.L18:
  ; basic/files.e16.ts:239  if (soft) return
  lw t0, 2(fp) ; soft
  beqz t0, .L19
  ; basic/files.e16.ts:239  return
  j .return
.L19:
  ; basic/files.e16.ts:240  cardCall(OP_FREE, 0, 0, 0)
  li a0, 6
  li a1, 0
  li a2, 0
  li a3, 0
  call cardCall
  ; basic/files.e16.ts:241  const kb = (peek16(CARD_RESULT_HIGH) << 6) | (peek16(CARD_RESULT) >> 10)
  li t0, 65384
  lw t0, 0(t0)
  slli t0, t0, 6
  li t1, 65382
  lw t1, 0(t1)
  srli t1, t1, 10
  or s2, t0, t1
  ; basic/files.e16.ts:242  printUnsigned(kb)
  mv a0, s2
  call printUnsigned
  ; basic/files.e16.ts:243  puts(str(' KB FREE'))
  la a0, str_31
  call puts
  ; basic/files.e16.ts:244  newline()
  call newline
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  lw s1, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; basic/files.e16.ts:251 saveStatement() at -O1
;   from/at/n in s1
;   length/at in s2
;   line in s3
;   digits in 0(fp)
;   length in 2(fp)
saveStatement:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  ; basic/files.e16.ts:252  nameArg(str('.BAS'))
  la a0, str_32
  call nameArg
  ; basic/files.e16.ts:253  if (next() === CH_COMMA) {
  call next
  li t0, 44
  bne a0, t0, .L1
  ; basic/files.e16.ts:254  step()
  call step
  ; basic/files.e16.ts:255  const from = address()
  call address
  mv s1, a0 ; from/at/n
  ; basic/files.e16.ts:256  expect(CH_COMMA)
  li a0, 44
  call expect
  ; basic/files.e16.ts:257  const length = address()
  call address
  mv s2, a0 ; length/at
  ; basic/files.e16.ts:258  if (from + length < from || from + length > 0x8000) fail(E_MEMORY)
  add t0, s1, s2
  bltu t0, s1, .L3
  add t0, s1, s2
  li t1, 32768
  bgeu t1, t0, .L2
.L3:
  ; basic/files.e16.ts:258  fail(E_MEMORY)
  li a0, 8
  call fail
.L2:
  ; basic/files.e16.ts:259  cardMust(OP_WRITE, 0, from, length)
  li a0, 3
  li a1, 0
  mv a2, s1
  mv a3, s2
  call cardMust
  ; basic/files.e16.ts:260  return
  j .return
.L1:
  ; basic/files.e16.ts:264  for (let at = PROG; peek16(at) !== 0; at += peek16(at + 2)) {
  li s1, 2048 ; from/at/n
  j .L6
.L4:
  ; basic/files.e16.ts:265  if (listedLength(peek16(at), at + 4) > LINE_MAX) failIn(E_LONG, peek16(at))
  lw a0, 0(s1)
  addi a1, s1, 4
  la t0, listedLength
  li t1, 3
  call far_call
  li t0, 78
  bgeu t0, a0, .L8
  ; basic/files.e16.ts:265  failIn(E_LONG, peek16(at))
  lw t0, 0(s1)
  li a0, 21
  mv a1, t0
  call failIn
.L8:
  lw t0, 2(s1)
  add s1, s1, t0
.L6:
  lw t0, 0(s1)
  bne t0, zero, .L4
  ; basic/files.e16.ts:267  cardMust(OP_WRITE, 0, addr(cardBuf), 0)
  li a0, 3
  li a1, 0
  la a2, cardBuf
  li a3, 0
  call cardMust
  ; basic/files.e16.ts:268  let n: u16 = 0
  li s1, 0 ; from/at/n
  ; basic/files.e16.ts:269  let at = PROG
  li s2, 2048 ; length/at
  ; basic/files.e16.ts:270  while (peek16(at) !== 0) {
  j .L11
.L9:
  ; basic/files.e16.ts:271  checkBreak()
  call checkBreak
  ; basic/files.e16.ts:272  const line = addr(lineBuf)
  la s3, lineBuf
  ; basic/files.e16.ts:273  const digits = unsignedText(peek16(at), line)
  lw a0, 0(s2)
  mv a1, s3
  call unsignedText
  sw a0, 0(fp) ; digits
  ; basic/files.e16.ts:274  poke(line + digits, CH_SPACE)
  lw t0, 0(fp) ; digits
  add t0, s3, t0
  li t1, 32
  sb t1, 0(t0)
  ; basic/files.e16.ts:275  const length = digits + 1 + expand(at + 4, line + digits + 1, 77 - digits)
  lw t0, 0(fp) ; digits
  lw t1, 0(fp) ; digits
  add t1, s3, t1
  lw t2, 0(fp) ; digits
  li t3, 77
  sub t3, t3, t2
  addi t0, t0, 1
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, s2, 4
  addi a1, t1, 1
  mv a2, t3
  call expand
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  sw t0, 2(fp) ; length
  ; basic/files.e16.ts:276  poke(line + length, K_ENTER)
  lw t0, 2(fp) ; length
  add t0, s3, t0
  li t1, 13
  sb t1, 0(t0)
  ; basic/files.e16.ts:277  if (n + length + 1 > 256) {
  lw t0, 2(fp) ; length
  add t0, s1, t0
  li t1, 256
  addi t0, t0, 1
  bgeu t1, t0, .L13
  ; basic/files.e16.ts:278  cardMust(OP_WRITE, APPEND, addr(cardBuf), n)
  li a0, 3
  li a1, 65535
  la a2, cardBuf
  mv a3, s1
  call cardMust
  ; basic/files.e16.ts:279  n = 0
  li s1, 0 ; from/at/n
.L13:
  ; basic/files.e16.ts:281  memcpy(addr(cardBuf) + n, line, length + 1)
  lw t0, 2(fp) ; length
  addi a0, s1, cardBuf
  mv a1, s3
  addi a2, t0, 1
  mcpy a0, a1, a2
  ; basic/files.e16.ts:282  n += length + 1
  lw t0, 2(fp) ; length
  addi t0, t0, 1
  add s1, s1, t0
  ; basic/files.e16.ts:283  at += peek16(at + 2)
  lw t0, 2(s2)
  add s2, s2, t0
.L11:
  lw t0, 0(s2)
  bne t0, zero, .L9
  ; basic/files.e16.ts:285  if (n > 0) cardMust(OP_WRITE, APPEND, addr(cardBuf), n)
  bgeu zero, s1, .L14
  ; basic/files.e16.ts:285  cardMust(OP_WRITE, APPEND, addr(cardBuf), n)
  li a0, 3
  li a1, 65535
  la a2, cardBuf
  mv a3, s1
  call cardMust
.L14:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/files.e16.ts:292 loadStatement() at -O1
;   to in s1
loadStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/files.e16.ts:293  nameArg(str('.BAS'))
  la a0, str_32
  call nameArg
  ; basic/files.e16.ts:294  if (isMachineCode() || next() === CH_COMMA) {
  call isMachineCode
  bnez a0, .L2
  call next
  li t0, 44
  bne a0, t0, .L1
.L2:
  ; basic/files.e16.ts:295  let to = CODE_AREA
  li s1, 28672 ; to
  ; basic/files.e16.ts:296  if (next() === CH_COMMA) {
  call next
  li t0, 44
  bne a0, t0, .L3
  ; basic/files.e16.ts:297  step()
  call step
  ; basic/files.e16.ts:298  to = address()
  call address
  mv s1, a0 ; to
.L3:
  ; basic/files.e16.ts:301  if (to < varEnd || to >= CODE_AREA_END) fail(E_MEMORY)
  lw t0, 0x0114(zero)
  bltu s1, t0, .L5
  li t0, 31744
  bltu s1, t0, .L4
.L5:
  ; basic/files.e16.ts:301  fail(E_MEMORY)
  li a0, 8
  call fail
.L4:
  ; basic/files.e16.ts:302  cardMust(OP_READ, 0, to, CODE_AREA_END - to)
  li t0, 31744
  sub t0, t0, s1
  li a0, 2
  li a1, 0
  mv a2, s1
  mv a3, t0
  call cardMust
  ; basic/files.e16.ts:303  return
  j .return
.L1:
  ; basic/files.e16.ts:307  readListing(false)
  li a0, 0
  call readListing
  ; basic/files.e16.ts:308  keepProgramTo(PROG)
  li a0, 2048
  call keepProgramTo
  ; basic/files.e16.ts:309  readListing(true)
  li a0, 1
  call readListing
  ; basic/files.e16.ts:311  endProgram()
  call endProgram
  ; basic/files.e16.ts:312  setTxt(addr(nothing))
  la a0, nothing
  call setTxt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/files.e16.ts:320 readListing(keep) at -O1
;   keep in 8(fp)
;   offset in s3
;   n in s1
;   room in 0(fp)
;   got in 2(fp)
;   k in s2
;   c in 4(fp)
;   lineChar.n in 6(fp)
;   lineChar.c in 10(fp)
readListing:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s3, 14(sp)
  sw s1, 16(sp)
  sw s2, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  sw a0, 8(fp) ; keep
  ; basic/files.e16.ts:321  let offset: u16 = 0
  li s3, 0 ; offset
  ; basic/files.e16.ts:322  let n: u16 = 0
  li s1, 0 ; n
  ; basic/files.e16.ts:323  let room: u16 = LIMIT - PROG - 2
  li t0, 26622
  sw t0, 0(fp) ; room
  ; basic/files.e16.ts:324  for (;;) {
.L1:
  ; basic/files.e16.ts:325  cardMust(OP_READ, offset, addr(cardBuf), 256)
  li a0, 2
  mv a1, s3
  la a2, cardBuf
  li a3, 256
  call cardMust
  ; basic/files.e16.ts:326  const got = peek16(CARD_RESULT)
  li t0, 65382
  lw t0, 0(t0)
  sw t0, 2(fp) ; got
  ; basic/files.e16.ts:327  if (got === 0) break
  lw t0, 2(fp) ; got
  bne t0, zero, .L5
  ; basic/files.e16.ts:327  break
  j .L4
.L5:
  ; basic/files.e16.ts:328  for (let k: u16 = 0; k < got; k++) {
  li s2, 0 ; k
  j .L8
.L6:
  ; basic/files.e16.ts:329  const c = peek(addr(cardBuf) + k)
  lbu t0, cardBuf(s2)
  sw t0, 4(fp) ; c
  ; basic/files.e16.ts:330  if (c === K_ENTER || c === LF) {
  li t0, 13
  lw t1, 4(fp) ; c
  beq t1, t0, .L11
  li t0, 10
  lw t1, 4(fp) ; c
  bne t1, t0, .L10
.L11:
  ; basic/files.e16.ts:331  if (n > 0) room = lineRead(n, keep, room)
  bgeu zero, s1, .L12
  ; basic/files.e16.ts:331  room = lineRead(n, keep, room)
  mv a0, s1
  lw a1, 8(fp)
  lw a2, 0(fp)
  call lineRead
  sw a0, 0(fp) ; room
.L12:
  ; basic/files.e16.ts:332  n = 0
  li s1, 0 ; n
  j .L13
.L10:
  ; basic/files.e16.ts:333  n = lineChar(n, c)
  lw t0, 4(fp) ; c
  sw t0, 10(fp) ; lineChar.c
  sw s1, 6(fp) ; lineChar.n
  ; basic/files.e16.ts:342  if (n < LINE_MAX) poke(addr(lineBuf) + n, c)
  li t0, 78
  lw t1, 6(fp) ; lineChar.n
  bgeu t1, t0, .I1.L1
  ; basic/files.e16.ts:342  poke(addr(lineBuf) + n, c)
  lw t0, 6(fp) ; lineChar.n
  lw t1, 10(fp) ; lineChar.c
  sb t1, lineBuf(t0)
.I1.L1:
  ; basic/files.e16.ts:343  return n + 1
  lw t0, 6(fp) ; lineChar.n
  addi s1, t0, 1
.L13:
  addi s2, s2, 1
.L8:
  lw t0, 2(fp) ; got
  bltu s2, t0, .L6
  ; basic/files.e16.ts:335  offset += got
  lw t0, 2(fp) ; got
  add s3, s3, t0
  j .L1
.L4:
  ; basic/files.e16.ts:337  if (n > 0) lineRead(n, keep, room)
  bgeu zero, s1, .L14
  ; basic/files.e16.ts:337  lineRead(n, keep, room)
  mv a0, s1
  lw a1, 8(fp)
  lw a2, 0(fp)
  call lineRead
.L14:
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s3, 14(sp)
  lw s1, 16(sp)
  lw s2, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; basic/files.e16.ts:347 lineRead(n, keep, room) at -O1
;   n in s3
;   keep in 0(fp)
;   room in 2(fp)
;   line in s1
;   size in s2
lineRead:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s3, a0 ; n
  sw a1, 0(fp) ; keep
  sw a2, 2(fp) ; room
  ; basic/files.e16.ts:348  const line = addr(lineBuf)
  la s1, lineBuf
  ; basic/files.e16.ts:349  if (n > LINE_MAX) {
  li t0, 78
  bgeu t0, s3, .L1
  ; basic/files.e16.ts:351  poke(line + LINE_MAX, 0)
  sb zero, 78(s1)
  ; basic/files.e16.ts:352  setTxt(line)
  mv a0, s1
  call setTxt
  ; basic/files.e16.ts:353  if (!isDigit(next())) fail(E_FILE)
  call next
  call isDigit
  bnez a0, .L2
  ; basic/files.e16.ts:353  fail(E_FILE)
  li a0, 17
  call fail
.L2:
  ; basic/files.e16.ts:354  failIn(E_LONG, readUnsigned())
  call readUnsigned
  mv a1, a0
  li a0, 21
  call failIn
.L1:
  ; basic/files.e16.ts:356  poke(line + n, 0)
  add t0, s1, s3
  sb zero, 0(t0)
  ; basic/files.e16.ts:357  const size = storeTypedLine(keep)
  lw a0, 0(fp)
  call storeTypedLine
  mv s2, a0 ; size
  ; basic/files.e16.ts:358  if (size === 0) fail(E_FILE)
  bne s2, zero, .L3
  ; basic/files.e16.ts:358  fail(E_FILE)
  li a0, 17
  call fail
.L3:
  ; basic/files.e16.ts:361  if (!keep && size > room) fail(E_MEMORY)
  lw t0, 0(fp) ; keep
  bnez t0, .L4
  lw t0, 2(fp) ; room
  bgeu t0, s2, .L4
  ; basic/files.e16.ts:361  fail(E_MEMORY)
  li a0, 8
  call fail
.L4:
  ; basic/files.e16.ts:362  return room - size
  lw t0, 2(fp) ; room
  sub a0, t0, s2
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/files.e16.ts:368 fileNumber() at -O1
;   n in s1
fileNumber:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/files.e16.ts:369  if (next() === CH_HASH) step()
  call next
  li t0, 35
  bne a0, t0, .L1
  ; basic/files.e16.ts:369  step()
  call step
.L1:
  ; basic/files.e16.ts:370  const n = readUnsigned()
  call readUnsigned
  mv s1, a0 ; n
  ; basic/files.e16.ts:371  if (n < 1 || n > 2) fail(E_FILE)
  li t0, 1
  bltu s1, t0, .L3
  li t0, 2
  bgeu t0, s1, .L2
.L3:
  ; basic/files.e16.ts:371  fail(E_FILE)
  li a0, 17
  call fail
.L2:
  ; basic/files.e16.ts:372  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/files.e16.ts:376 fileToBlock(n) at -O1
;   n in s1
;   b in s2
fileToBlock:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; n
  ; basic/files.e16.ts:377  const b = addr(cardBlock)
  la s2, cardBlock
  ; basic/files.e16.ts:378  memcpy(b, addr(fileName) + (n - 1) * 12, 12)
  addi t0, s1, -1
  slli t1, t0, 3
  slli t0, t0, 2
  add t0, t0, t1
  mv a0, s2
  addi a1, t0, fileName
  li a2, 12
  mcpy a0, a1, a2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/files.e16.ts:382 openStatement() at -O1
;   how in s1
;   n in s2
openStatement:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; basic/files.e16.ts:383  nameArg(str('.DAT'))
  la a0, str_33
  call nameArg
  ; basic/files.e16.ts:384  if (next() !== T_FOR) fail(E_SYNTAX)
  call next
  li t0, 138
  beq a0, t0, .L1
  ; basic/files.e16.ts:384  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/files.e16.ts:385  step()
  call step
  ; basic/files.e16.ts:386  const how = next()
  call next
  mv s1, a0 ; how
  ; basic/files.e16.ts:387  if (how !== T_INPUT && how !== T_OUTPUT && how !== T_APPEND) fail(E_SYNTAX)
  li t0, 133
  beq s1, t0, .L2
  li t0, 217
  beq s1, t0, .L2
  li t0, 218
  beq s1, t0, .L2
  ; basic/files.e16.ts:387  fail(E_SYNTAX)
  li a0, 1
  call fail
.L2:
  ; basic/files.e16.ts:388  step()
  call step
  ; basic/files.e16.ts:389  if (next() !== T_AS) fail(E_SYNTAX)
  call next
  li t0, 216
  beq a0, t0, .L3
  ; basic/files.e16.ts:389  fail(E_SYNTAX)
  li a0, 1
  call fail
.L3:
  ; basic/files.e16.ts:390  step()
  call step
  ; basic/files.e16.ts:391  const n = fileNumber()
  call fileNumber
  mv s2, a0 ; n
  ; basic/files.e16.ts:392  if (peek(addr(fileMode) + n - 1) !== 0) fail(E_FILE)
  lbu t0, fileMode-1(s2)
  beq t0, zero, .L4
  ; basic/files.e16.ts:392  fail(E_FILE)
  li a0, 17
  call fail
.L4:
  ; basic/files.e16.ts:393  if (how === T_INPUT) cardMust(OP_READ, 0, addr(cardBuf), 0)
  li t0, 133
  bne s1, t0, .L5
  ; basic/files.e16.ts:393  cardMust(OP_READ, 0, addr(cardBuf), 0)
  li a0, 2
  li a1, 0
  la a2, cardBuf
  li a3, 0
  call cardMust
  j .L6
.L5:
  ; basic/files.e16.ts:394  cardMust(OP_WRITE, how === T_OUTPUT ? 0 : APPEND, addr(cardBuf), 0)
  li t0, 3
  mv t1, s1
  li t2, 217
  bne t1, t2, .L7
  li t1, 0
  j .L8
.L7:
  li t1, 65535
.L8:
  mv a0, t0
  mv a1, t1
  la a2, cardBuf
  li a3, 0
  call cardMust
.L6:
  ; basic/files.e16.ts:395  memcpy(addr(fileName) + (n - 1) * 12, addr(cardBlock), 12)
  addi t0, s2, -1
  slli t1, t0, 3
  slli t0, t0, 2
  add t0, t0, t1
  addi a0, t0, fileName
  la a1, cardBlock
  li a2, 12
  mcpy a0, a1, a2
  ; basic/files.e16.ts:396  fileOffset[n - 1] = 0
  addi t0, s2, -1
  slli t0, t0, 1
  sw zero, fileOffset(t0)
  ; basic/files.e16.ts:397  fileLen[n - 1] = 0
  addi t0, s2, -1
  slli t0, t0, 1
  sw zero, fileLen(t0)
  ; basic/files.e16.ts:398  filePos[n - 1] = 0
  addi t0, s2, -1
  slli t0, t0, 1
  sw zero, filePos(t0)
  ; basic/files.e16.ts:399  poke(addr(fileMode) + n - 1, how === T_INPUT ? 1 : 2)
  addi t0, s2, fileMode-1
  mv t1, s1
  li t2, 133
  bne t1, t2, .L9
  li t1, 1
  j .L10
.L9:
  li t1, 2
.L10:
  sb t1, 0(t0)
  ; basic/files.e16.ts:400  setFilesOpen(true)
  li a0, 1
  call setFilesOpen
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/files.e16.ts:404 printToFile() at -O1
;   n in s1
printToFile:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/files.e16.ts:405  const n = fileNumber()
  call fileNumber
  mv s1, a0 ; n
  ; basic/files.e16.ts:406  if (peek(addr(fileMode) + n - 1) !== 2) fail(E_FILE)
  lbu t0, fileMode-1(s1)
  li t1, 2
  beq t0, t1, .L1
  ; basic/files.e16.ts:406  fail(E_FILE)
  li a0, 17
  call fail
.L1:
  ; basic/files.e16.ts:407  if (next() === CH_COMMA) step()
  call next
  li t0, 44
  bne a0, t0, .L2
  ; basic/files.e16.ts:407  step()
  call step
.L2:
  ; basic/files.e16.ts:408  setOutFile(n)
  mv a0, s1
  call setOutFile
  ; basic/files.e16.ts:409  printItems()
  call printItems
  ; basic/files.e16.ts:410  setOutFile(0)
  li a0, 0
  call setOutFile
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/files.e16.ts:414 fileByte(c) at -O1
;   c in s3
;   n in s1
;   at in s0
;   len in s2
fileByte:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s0, 6(sp)
  sw s2, 8(sp)
  mv s3, a0 ; c
  ; basic/files.e16.ts:415  const n = outFile
  lw s1, 0x011c(zero)
  ; basic/files.e16.ts:416  const at = addr(fileBuf) + (n - 1) * FILE_BUF
  addi t0, s1, -1
  slli t0, t0, 6
  addi s0, t0, fileBuf
  ; basic/files.e16.ts:417  const len = fileLen[n - 1]
  addi t0, s1, -1
  slli t0, t0, 1
  lw s2, fileLen(t0)
  ; basic/files.e16.ts:418  poke(at + len, c)
  add t0, s0, s2
  sb s3, 0(t0)
  ; basic/files.e16.ts:419  fileLen[n - 1] = len + 1
  addi t0, s1, -1
  slli t0, t0, 1
  addi t1, s2, 1
  sw t1, fileLen(t0)
  ; basic/files.e16.ts:420  if (len + 1 === FILE_BUF) flush(n, true)
  li t0, 64
  addi t1, s2, 1
  bne t1, t0, .L1
  ; basic/files.e16.ts:420  flush(n, true)
  mv a0, s1
  li a1, 1
  call flush
.L1:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; basic/files.e16.ts:424 flush(n, must) at -O1
;   n in s1
;   must in s0
;   len in s2
;   at in s3
flush:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s1, a0 ; n
  mv s0, a1 ; must
  ; basic/files.e16.ts:425  const len = fileLen[n - 1]
  addi t0, s1, -1
  slli t0, t0, 1
  lw s2, fileLen(t0)
  ; basic/files.e16.ts:426  if (len === 0) return
  bne s2, zero, .L1
  ; basic/files.e16.ts:426  return
  j .return
.L1:
  ; basic/files.e16.ts:427  fileToBlock(n)
  mv a0, s1
  call fileToBlock
  ; basic/files.e16.ts:428  fileLen[n - 1] = 0
  addi t0, s1, -1
  slli t0, t0, 1
  sw zero, fileLen(t0)
  ; basic/files.e16.ts:429  const at = addr(fileBuf) + (n - 1) * FILE_BUF
  addi t0, s1, -1
  slli t0, t0, 6
  addi s3, t0, fileBuf
  ; basic/files.e16.ts:430  if (must) cardMust(OP_WRITE, APPEND, at, len)
  beqz s0, .L2
  ; basic/files.e16.ts:430  cardMust(OP_WRITE, APPEND, at, len)
  li a0, 3
  li a1, 65535
  mv a2, s3
  mv a3, s2
  call cardMust
  j .L3
.L2:
  ; basic/files.e16.ts:431  cardCall(OP_WRITE, APPEND, at, len)
  li a0, 3
  li a1, 65535
  mv a2, s3
  mv a3, s2
  call cardCall
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; basic/files.e16.ts:435 fileByteIn(n) at -O1
;   n in s1
;   pos in s2
fileByteIn:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; n
  ; basic/files.e16.ts:436  if (filePos[n - 1] >= fileLen[n - 1] && !fill(n)) return 0xffff
  addi t0, s1, -1
  slli t0, t0, 1
  lw t0, filePos(t0)
  addi t1, s1, -1
  slli t1, t1, 1
  lw t1, fileLen(t1)
  bltu t0, t1, .L1
  mv a0, s1
  call fill
  bnez a0, .L1
  ; basic/files.e16.ts:436  return 0xffff
  li a0, 65535
  j .return
.L1:
  ; basic/files.e16.ts:437  const pos = filePos[n - 1]
  addi t0, s1, -1
  slli t0, t0, 1
  lw s2, filePos(t0)
  ; basic/files.e16.ts:438  filePos[n - 1] = pos + 1
  addi t0, s1, -1
  slli t0, t0, 1
  addi t1, s2, 1
  sw t1, filePos(t0)
  ; basic/files.e16.ts:439  return peek(addr(fileBuf) + (n - 1) * FILE_BUF + pos)
  addi t0, s1, -1
  slli t0, t0, 6
  addi t0, t0, fileBuf
  add t0, t0, s2
  lbu a0, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/files.e16.ts:443 fill(n) at -O1
;   n in s1
;   got in s2
fill:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; n
  ; basic/files.e16.ts:444  fileToBlock(n)
  mv a0, s1
  call fileToBlock
  ; basic/files.e16.ts:445  cardMust(OP_READ, fileOffset[n - 1], addr(fileBuf) + (n - 1) * FILE_BUF, FILE_BUF)
  addi t0, s1, -1
  slli t0, t0, 1
  lw t0, fileOffset(t0)
  addi t1, s1, -1
  slli t1, t1, 6
  li a0, 2
  mv a1, t0
  addi a2, t1, fileBuf
  li a3, 64
  call cardMust
  ; basic/files.e16.ts:446  const got = peek16(CARD_RESULT)
  li t0, 65382
  lw s2, 0(t0)
  ; basic/files.e16.ts:447  fileOffset[n - 1] = fileOffset[n - 1] + got
  addi t0, s1, -1
  slli t0, t0, 1
  addi t1, s1, -1
  slli t1, t1, 1
  lw t1, fileOffset(t1)
  add t1, t1, s2
  sw t1, fileOffset(t0)
  ; basic/files.e16.ts:448  fileLen[n - 1] = got
  addi t0, s1, -1
  slli t0, t0, 1
  sw s2, fileLen(t0)
  ; basic/files.e16.ts:449  filePos[n - 1] = 0
  addi t0, s1, -1
  slli t0, t0, 1
  sw zero, filePos(t0)
  ; basic/files.e16.ts:450  return got > 0
  sltu a0, zero, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/files.e16.ts:454 inputFromFile() at -O1
;   n in s1
;   at in s2
;   room in s3
;   length in s0
inputFromFile:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  ; basic/files.e16.ts:455  const n = fileNumber()
  call fileNumber
  mv s1, a0 ; n
  ; basic/files.e16.ts:456  if (peek(addr(fileMode) + n - 1) !== 1) fail(E_FILE)
  lbu t0, fileMode-1(s1)
  li t1, 1
  beq t0, t1, .L1
  ; basic/files.e16.ts:456  fail(E_FILE)
  li a0, 17
  call fail
.L1:
  ; basic/files.e16.ts:457  expect(CH_COMMA)
  li a0, 44
  call expect
  ; basic/files.e16.ts:458  for (;;) {
.L2:
  ; basic/files.e16.ts:459  const at = varAt(true)
  li a0, 1
  call varAt
  mv s2, a0 ; at
  ; basic/files.e16.ts:460  const room = varRoom
  lw s3, 0x011a(zero)
  ; basic/files.e16.ts:461  const length = itemIn(n)
  mv a0, s1
  call itemIn
  mv s0, a0 ; length
  ; basic/files.e16.ts:462  if (length === 0xffff) fail(E_DATA)
  li t0, 65535
  bne s0, t0, .L6
  ; basic/files.e16.ts:462  fail(E_DATA)
  li a0, 14
  call fail
.L6:
  ; basic/files.e16.ts:463  if (takeItem(at, room, addr(lineBuf), false) === 0xffff) fail(E_TYPE)
  mv a0, s2
  mv a1, s3
  la a2, lineBuf
  li a3, 0
  la t0, takeItem
  li t1, 0
  call far_call
  li t0, 65535
  bne a0, t0, .L7
  ; basic/files.e16.ts:463  fail(E_TYPE)
  li a0, 11
  call fail
.L7:
  ; basic/files.e16.ts:464  if (next() !== CH_COMMA) return
  call next
  li t0, 44
  beq a0, t0, .L8
  ; basic/files.e16.ts:464  return
  j .return
.L8:
  ; basic/files.e16.ts:465  step()
  call step
  j .L2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; basic/files.e16.ts:473 itemIn(n) at -O1
;   n in s3
;   line in 0(fp)
;   c in s1
;   k in s2
;   inQuote in 2(fp)
itemIn:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s3, a0 ; n
  ; basic/files.e16.ts:474  const line = addr(lineBuf)
  la t0, lineBuf
  sw t0, 0(fp) ; line
  ; basic/files.e16.ts:475  let c = fileByteIn(n)
  mv a0, s3
  call fileByteIn
  mv s1, a0 ; c
  ; basic/files.e16.ts:476  while (c === CH_SPACE || c === K_ENTER || c === LF) c = fileByteIn(n)
  j .L3
.L1:
  ; basic/files.e16.ts:476  c = fileByteIn(n)
  mv a0, s3
  call fileByteIn
  mv s1, a0 ; c
.L3:
  li t0, 32
  beq s1, t0, .L1
  li t0, 13
  beq s1, t0, .L1
  li t0, 10
  beq s1, t0, .L1
  ; basic/files.e16.ts:477  if (c === 0xffff) return 0xffff
  li t0, 65535
  bne s1, t0, .L5
  ; basic/files.e16.ts:477  return 0xffff
  li a0, 65535
  j .return
.L5:
  ; basic/files.e16.ts:478  let k: u16 = 0
  li s2, 0 ; k
  ; basic/files.e16.ts:479  const inQuote = c === CH_QUOTE
  li t0, 34
  sub t0, s1, t0
  seqz t0, t0
  sw t0, 2(fp) ; inQuote
  ; basic/files.e16.ts:481  if (inQuote) {
  lw t0, 2(fp) ; inQuote
  beqz t0, .L9
  ; basic/files.e16.ts:482  poke(line, CH_QUOTE)
  li t0, 34
  lw t1, 0(fp) ; line
  sb t0, 0(t1)
  ; basic/files.e16.ts:483  k = 1
  li s2, 1 ; k
  ; basic/files.e16.ts:484  c = fileByteIn(n)
  mv a0, s3
  call fileByteIn
  mv s1, a0 ; c
  ; basic/files.e16.ts:486  while (c !== 0xffff && k < 77) {
  j .L9
.L7:
  ; basic/files.e16.ts:487  if (inQuote ? c === CH_QUOTE : c === CH_COMMA || c === K_ENTER || c === LF) break
  lw t0, 2(fp) ; inQuote
  beqz t0, .L12
  li t0, 34
  sub t0, s1, t0
  seqz t0, t0
  j .L13
.L12:
  li t0, 44
  sub t0, s1, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L15
  li t0, 13
  sub t0, s1, t0
  seqz t0, t0
.L15:
  mv t1, t0
  bnez t1, .L14
  li t0, 10
  sub t0, s1, t0
  seqz t0, t0
.L14:
.L13:
  beqz t0, .L11
  ; basic/files.e16.ts:487  break
  j .L10
.L11:
  ; basic/files.e16.ts:488  poke(line + k, c)
  lw t0, 0(fp) ; line
  add t0, t0, s2
  sb s1, 0(t0)
  ; basic/files.e16.ts:489  k++
  addi s2, s2, 1
  ; basic/files.e16.ts:490  c = fileByteIn(n)
  mv a0, s3
  call fileByteIn
  mv s1, a0 ; c
.L9:
  li t0, 65535
  beq s1, t0, .L16
  li t0, 77
  bltu s2, t0, .L7
.L16:
.L10:
  ; basic/files.e16.ts:494  if (inQuote) {
  lw t0, 2(fp) ; inQuote
  beqz t0, .L17
  ; basic/files.e16.ts:495  poke(line + k, CH_QUOTE)
  lw t0, 0(fp) ; line
  add t0, t0, s2
  li t1, 34
  sb t1, 0(t0)
  ; basic/files.e16.ts:496  k++
  addi s2, s2, 1
  ; basic/files.e16.ts:497  c = fileByteIn(n)
  mv a0, s3
  call fileByteIn
  mv s1, a0 ; c
  ; basic/files.e16.ts:498  while (c === CH_SPACE) c = fileByteIn(n)
  j .L20
.L18:
  ; basic/files.e16.ts:498  c = fileByteIn(n)
  mv a0, s3
  call fileByteIn
  mv s1, a0 ; c
.L20:
  li t0, 32
  beq s1, t0, .L18
.L17:
  ; basic/files.e16.ts:500  poke(line + k, 0)
  lw t0, 0(fp) ; line
  add t0, t0, s2
  sb zero, 0(t0)
  ; basic/files.e16.ts:501  return k
  mv a0, s2
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/files.e16.ts:505 itemLeft(f) at -O1
;   f in s1
;   c in s2
itemLeft:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; f
  ; basic/files.e16.ts:506  for (;;) {
.L1:
  ; basic/files.e16.ts:507  if (filePos[f - 1] >= fileLen[f - 1] && !fill(f)) return false
  addi t0, s1, -1
  slli t0, t0, 1
  lw t0, filePos(t0)
  addi t1, s1, -1
  slli t1, t1, 1
  lw t1, fileLen(t1)
  bltu t0, t1, .L5
  mv a0, s1
  call fill
  bnez a0, .L5
  ; basic/files.e16.ts:507  return false
  li a0, 0
  j .return
.L5:
  ; basic/files.e16.ts:508  const c = peek(addr(fileBuf) + (f - 1) * FILE_BUF + filePos[f - 1])
  addi t0, s1, -1
  slli t0, t0, 6
  addi t1, s1, -1
  slli t1, t1, 1
  lw t1, filePos(t1)
  addi t0, t0, fileBuf
  add t0, t0, t1
  lbu s2, 0(t0)
  ; basic/files.e16.ts:509  if (c !== CH_SPACE && c !== K_ENTER && c !== LF) return true
  li t0, 32
  beq s2, t0, .L6
  li t0, 13
  beq s2, t0, .L6
  li t0, 10
  beq s2, t0, .L6
  ; basic/files.e16.ts:509  return true
  li a0, 1
  j .return
.L6:
  ; basic/files.e16.ts:510  filePos[f - 1] = filePos[f - 1] + 1
  addi t0, s1, -1
  slli t0, t0, 1
  addi t1, s1, -1
  slli t1, t1, 1
  lw t1, filePos(t1)
  addi t1, t1, 1
  sw t1, filePos(t0)
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/files.e16.ts:515 eofFunction() at -O1
;   n in s1
eofFunction:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/files.e16.ts:516  unary()
  call unary
  ; basic/files.e16.ts:517  needNumber()
  call needNumber
  ; basic/files.e16.ts:518  const n = toInt(top())
  call top
  call toInt
  mv s1, a0 ; n
  ; basic/files.e16.ts:519  if (n < 1 || n > 2 || peek(addr(fileMode) + u16(n) - 1) !== 1) fail(E_FILE)
  li t0, 1
  blt s1, t0, .L2
  li t0, 2
  blt t0, s1, .L2
  lbu t0, fileMode-1(s1)
  li t1, 1
  beq t0, t1, .L1
.L2:
  ; basic/files.e16.ts:519  fail(E_FILE)
  li a0, 17
  call fail
.L1:
  ; basic/files.e16.ts:520  setInt(top(), itemLeft(u16(n)) ? 0 : 1)
  call top
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  call itemLeft
  lw t0, 0(sp)
  addi sp, sp, 2
  mv t1, a0
  beqz t1, .L3
  li t1, 0
  j .L4
.L3:
  li t1, 1
.L4:
  mv a0, t0
  mv a1, t1
  call setInt
  ; basic/files.e16.ts:521  setStrType(false)
  li a0, 0
  call setStrType
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/files.e16.ts:525 closeStatement() at -O1
;   n in s1
closeStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/files.e16.ts:526  if (statementEnds()) {
  call statementEnds
  beqz a0, .L1
  ; basic/files.e16.ts:527  for (let n: u16 = 1; n <= 2; n++) closeFile(n, true)
  li s1, 1 ; n
  j .L4
.L2:
  ; basic/files.e16.ts:527  closeFile(n, true)
  mv a0, s1
  li a1, 1
  call closeFile
  addi s1, s1, 1
.L4:
  li t0, 2
  bgeu t0, s1, .L2
  ; basic/files.e16.ts:528  return
  j .return
.L1:
  ; basic/files.e16.ts:530  closeFile(fileNumber(), true)
  call fileNumber
  li a1, 1
  call closeFile
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/files.e16.ts:533 closeFile(n, must) at -O1
;   n in s1
;   must in s2
closeFile:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; n
  mv s2, a1 ; must
  ; basic/files.e16.ts:534  if (peek(addr(fileMode) + n - 1) === 2) flush(n, must)
  lbu t0, fileMode-1(s1)
  li t1, 2
  bne t0, t1, .L1
  ; basic/files.e16.ts:534  flush(n, must)
  mv a0, s1
  mv a1, s2
  call flush
.L1:
  ; basic/files.e16.ts:535  poke(addr(fileMode) + n - 1, 0)
  sb zero, fileMode-1(s1)
  ; basic/files.e16.ts:536  setFilesOpen(peek(addr(fileMode)) !== 0 || peek(addr(fileMode) + 1) !== 0)
  lbu t0, fileMode(zero)
  sub t0, t0, zero
  snez t0, t0
  mv t1, t0
  bnez t1, .L2
  lbu t0, fileMode+1(zero)
  sub t0, t0, zero
  snez t0, t0
.L2:
  mv a0, t0
  call setFilesOpen
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/files.e16.ts:540 closeFiles() at -O1
;   n in s1
;   written in s2
closeFiles:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; basic/files.e16.ts:542  setFilesOpen(false)
  li a0, 0
  call setFilesOpen
  ; basic/files.e16.ts:543  for (let n: u16 = 1; n <= 2; n++) {
  li s1, 1 ; n
  j .L3
.L1:
  ; basic/files.e16.ts:544  const written = peek(addr(fileMode) + n - 1) === 2
  lbu t0, fileMode-1(s1)
  li t1, 2
  sub t0, t0, t1
  seqz s2, t0
  ; basic/files.e16.ts:545  poke(addr(fileMode) + n - 1, 0)
  sb zero, fileMode-1(s1)
  ; basic/files.e16.ts:546  if (written) flush(n, false)
  beqz s2, .L5
  ; basic/files.e16.ts:546  flush(n, false)
  mv a0, s1
  li a1, 0
  call flush
.L5:
  addi s1, s1, 1
.L3:
  li t0, 2
  bgeu t0, s1, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/files.e16.ts:551 fileStatement(c) at -O1
;   c in s1
fileStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/files.e16.ts:552  if (c === T_FILES) filesStatement()
  li t0, 168
  bne s1, t0, .L1
  ; basic/files.e16.ts:552  filesStatement()
  call filesStatement
  j .L2
.L1:
  ; basic/files.e16.ts:553  if (c === T_SAVE) saveStatement()
  li t0, 170
  bne s1, t0, .L3
  ; basic/files.e16.ts:553  saveStatement()
  call saveStatement
  j .L4
.L3:
  ; basic/files.e16.ts:554  if (c === T_LOAD) loadStatement()
  li t0, 169
  bne s1, t0, .L5
  ; basic/files.e16.ts:554  loadStatement()
  call loadStatement
  j .L6
.L5:
  ; basic/files.e16.ts:555  if (c === T_KILL) {
  li t0, 171
  bne s1, t0, .L7
  ; basic/files.e16.ts:556  nameArg(str('.BAS'))
  la a0, str_32
  call nameArg
  ; basic/files.e16.ts:557  cardMust(OP_DELETE, 0, 0, 0)
  li a0, 4
  li a1, 0
  li a2, 0
  li a3, 0
  call cardMust
  j .L8
.L7:
  ; basic/files.e16.ts:558  if (c === T_OPEN) openStatement()
  li t0, 178
  bne s1, t0, .L9
  ; basic/files.e16.ts:558  openStatement()
  call openStatement
  j .L10
.L9:
  ; basic/files.e16.ts:559  if (c === T_CLOSE) closeStatement()
  li t0, 179
  bne s1, t0, .L11
  ; basic/files.e16.ts:559  closeStatement()
  call closeStatement
  j .L12
.L11:
  ; basic/files.e16.ts:560  fail(E_SYNTAX)
  li a0, 1
  call fail
.L12:
.L10:
.L8:
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

str_30:
  .byte 46, 46, 46, 0
str_31:
  .byte 32, 75, 66, 32, 70, 82, 69, 69, 0
str_32:
  .byte 46, 66, 65, 83, 0
str_33:
  .byte 46, 68, 65, 84, 0
  .align 2

  .bank 3
  .org 0xc000
; basic/tools.e16.ts:72 autoStatement() at -O1
;   start in s2
;   by in s3
;   at in s1
autoStatement:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; basic/tools.e16.ts:73  let start: u16 = 10
  li s2, 10 ; start
  ; basic/tools.e16.ts:74  let by: u16 = 10
  li s3, 10 ; by
  ; basic/tools.e16.ts:76  for (let at = PROG; peek16(at) !== 0; at += peek16(at + 2)) start = peek16(at) + 10
  li s1, 2048 ; at
  j .L3
.L1:
  ; basic/tools.e16.ts:76  start = peek16(at) + 10
  lw t0, 0(s1)
  addi s2, t0, 10
  lw t0, 2(s1)
  add s1, s1, t0
.L3:
  lw t0, 0(s1)
  bne t0, zero, .L1
  ; basic/tools.e16.ts:77  if (isDigit(next())) start = readUnsigned()
  call next
  call isDigit
  beqz a0, .L5
  ; basic/tools.e16.ts:77  start = readUnsigned()
  call readUnsigned
  mv s2, a0 ; start
.L5:
  ; basic/tools.e16.ts:78  if (next() === CH_COMMA) {
  call next
  li t0, 44
  bne a0, t0, .L6
  ; basic/tools.e16.ts:79  step()
  call step
  ; basic/tools.e16.ts:80  by = readUnsigned()
  call readUnsigned
  mv s3, a0 ; by
.L6:
  ; basic/tools.e16.ts:82  if (start === 0 || by === 0) fail(E_ARGUMENT)
  beq s2, zero, .L8
  bne s3, zero, .L7
.L8:
  ; basic/tools.e16.ts:82  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L7:
  ; basic/tools.e16.ts:83  setAuto(start, by)
  mv a0, s2
  mv a1, s3
  call setAuto
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/tools.e16.ts:87 deleteStatement() at -O1
;   from in s1
;   to in s2
;   at in s3
deleteStatement:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/tools.e16.ts:89  if (statementEnds()) fail(E_SYNTAX)
  call statementEnds
  beqz a0, .L1
  ; basic/tools.e16.ts:89  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/tools.e16.ts:90  let from: u16 = 0
  li s1, 0 ; from
  ; basic/tools.e16.ts:91  let to: u16 = 0xffff
  li s2, 65535 ; to
  ; basic/tools.e16.ts:92  if (isDigit(next())) {
  call next
  call isDigit
  beqz a0, .L2
  ; basic/tools.e16.ts:93  from = readUnsigned()
  call readUnsigned
  mv s1, a0 ; from
  ; basic/tools.e16.ts:94  to = from
  mv s2, s1 ; to
.L2:
  ; basic/tools.e16.ts:96  if (next() === CH_MINUS) {
  call next
  li t0, 45
  bne a0, t0, .L3
  ; basic/tools.e16.ts:97  step()
  call step
  ; basic/tools.e16.ts:98  to = isDigit(next()) ? readUnsigned() : 0xffff
  call next
  call isDigit
  beqz a0, .L4
  call readUnsigned
  mv t0, a0
  j .L5
.L4:
  li t0, 65535
.L5:
  mv s2, t0 ; to
.L3:
  ; basic/tools.e16.ts:100  if (to < from) fail(E_ARGUMENT)
  bgeu s2, s1, .L6
  ; basic/tools.e16.ts:100  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L6:
  ; basic/tools.e16.ts:101  let at = findLine(from, false)
  mv a0, s1
  li a1, 0
  call findLine
  mv s3, a0 ; at
  ; basic/tools.e16.ts:102  while (at !== 0 && peek16(at) <= to) {
  j .L9
.L7:
  ; basic/tools.e16.ts:103  storeLine(peek16(at), 0, 1)
  lw a0, 0(s3)
  li a1, 0
  li a2, 1
  call storeLine
  ; basic/tools.e16.ts:104  at = findLine(from, false)
  mv a0, s1
  li a1, 0
  call findLine
  mv s3, a0 ; at
.L9:
  beq s3, zero, .L11
  lw t0, 0(s3)
  bgeu s2, t0, .L7
.L11:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/tools.e16.ts:111 listedLength(n, text) at -O1
;   n in s1
;   text in s2
listedLength:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; n
  mv s2, a1 ; text
  ; basic/tools.e16.ts:113  return unsignedText(n, addr(strTemp)) + 1 + expand(text, addr(strTemp), 255)
  mv a0, s1
  la a1, strTemp
  call unsignedText
  addi a0, a0, 1
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  la a1, strTemp
  li a2, 255
  call expand
  lw t0, 0(sp)
  addi sp, sp, 2
  add a0, t0, a0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/tools.e16.ts:121 checkLength(n, text) at -O1
;   n in s1
;   text in s2
checkLength:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; n
  mv s2, a1 ; text
  ; basic/tools.e16.ts:122  if (listedLength(n, text) > LINE_MAX) failIn(E_LONG, n)
  mv a0, s1
  mv a1, s2
  call listedLength
  li t0, 78
  bgeu t0, a0, .L1
  ; basic/tools.e16.ts:122  failIn(E_LONG, n)
  li a0, 21
  mv a1, s1
  call failIn
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/tools.e16.ts:132 renumbered(old) at -O1
;   old in a0
;   k in a2
;   at in a1
;   n in a3
renumbered:
  ; basic/tools.e16.ts:133  if (old < renumFrom) return old
  lw t0, 0x07ec(zero)
  bgeu a0, t0, .L1
  ; basic/tools.e16.ts:133  return old
  ret
.L1:
  ; basic/tools.e16.ts:134  let k: u16 = 0
  li a2, 0 ; k
  ; basic/tools.e16.ts:135  for (let at = PROG; peek16(at) !== 0; at += peek16(at + 2)) {
  li a1, 2048 ; at
  j .L4
.L2:
  ; basic/tools.e16.ts:136  const n = peek16(at)
  lw a3, 0(a1)
  ; basic/tools.e16.ts:137  if (n === old) return newStart + k * renumStep
  bne a3, a0, .L6
  ; basic/tools.e16.ts:137  return newStart + k * renumStep
  lw t0, 0x07ea(zero)
  lw t1, 0x07ee(zero)
  mul t1, a2, t1
  add a0, t0, t1
  ret
.L6:
  ; basic/tools.e16.ts:138  if (n >= renumFrom) k++
  lw t0, 0x07ec(zero)
  bltu a3, t0, .L7
  ; basic/tools.e16.ts:138  k++
  addi a2, a2, 1
.L7:
  lw t0, 2(a1)
  add a1, a1, t0
.L4:
  lw t0, 0(a1)
  bne t0, zero, .L2
  ; basic/tools.e16.ts:141  return old
.return:
  ret

; basic/tools.e16.ts:149 renumStatement() at -O1
;   at in s1
;   n/k in s2
;   length in s3
renumStatement:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/tools.e16.ts:150  newStart = 10
  li t0, 10
  sw t0, 0x07ea(zero)
  ; basic/tools.e16.ts:151  renumFrom = 0
  sw zero, 0x07ec(zero)
  ; basic/tools.e16.ts:152  renumStep = 10
  li t0, 10
  sw t0, 0x07ee(zero)
  ; basic/tools.e16.ts:153  if (isDigit(next())) newStart = readUnsigned()
  call next
  call isDigit
  beqz a0, .L1
  ; basic/tools.e16.ts:153  newStart = readUnsigned()
  call readUnsigned
  sw a0, 0x07ea(zero)
.L1:
  ; basic/tools.e16.ts:154  if (next() === CH_COMMA) {
  call next
  li t0, 44
  bne a0, t0, .L2
  ; basic/tools.e16.ts:155  step()
  call step
  ; basic/tools.e16.ts:156  if (isDigit(next())) renumFrom = readUnsigned()
  call next
  call isDigit
  beqz a0, .L3
  ; basic/tools.e16.ts:156  renumFrom = readUnsigned()
  call readUnsigned
  sw a0, 0x07ec(zero)
.L3:
.L2:
  ; basic/tools.e16.ts:158  if (next() === CH_COMMA) {
  call next
  li t0, 44
  bne a0, t0, .L4
  ; basic/tools.e16.ts:159  step()
  call step
  ; basic/tools.e16.ts:160  renumStep = readUnsigned()
  call readUnsigned
  sw a0, 0x07ee(zero)
.L4:
  ; basic/tools.e16.ts:162  checkRoom()
  call checkRoom
  ; basic/tools.e16.ts:163  checkRewrites()
  call checkRewrites
  ; basic/tools.e16.ts:165  let at = PROG
  li s1, 2048 ; at
  ; basic/tools.e16.ts:166  while (peek16(at) !== 0) {
  j .L7
.L5:
  ; basic/tools.e16.ts:167  const n = peek16(at)
  lw s2, 0(s1)
  ; basic/tools.e16.ts:168  const length = rewrite(at + 4)
  addi a0, s1, 4
  call rewrite
  mv s3, a0 ; length
  ; basic/tools.e16.ts:169  if (length !== 0) {
  beq s3, zero, .L9
  ; basic/tools.e16.ts:170  storeLine(n, addr(lineBuf), length)
  mv a0, s2
  la a1, lineBuf
  mv a2, s3
  call storeLine
  ; basic/tools.e16.ts:171  at = findLine(n, true)
  mv a0, s2
  li a1, 1
  call findLine
  mv s1, a0 ; at
.L9:
  ; basic/tools.e16.ts:173  at += peek16(at + 2)
  lw t0, 2(s1)
  add s1, s1, t0
.L7:
  lw t0, 0(s1)
  bne t0, zero, .L5
  ; basic/tools.e16.ts:175  let k: u16 = 0
  li s2, 0 ; n/k
  ; basic/tools.e16.ts:176  for (at = PROG; peek16(at) !== 0; at += peek16(at + 2)) {
  li s1, 2048 ; at
  j .L12
.L10:
  ; basic/tools.e16.ts:177  if (peek16(at) < renumFrom) continue
  lw t0, 0(s1)
  lw t1, 0x07ec(zero)
  bgeu t0, t1, .L14
  ; basic/tools.e16.ts:177  continue
  j .L11
.L14:
  ; basic/tools.e16.ts:178  poke16(at, newStart + k * renumStep)
  lw t0, 0x07ea(zero)
  lw t1, 0x07ee(zero)
  mul t1, s2, t1
  add t0, t0, t1
  sw t0, 0(s1)
  ; basic/tools.e16.ts:179  k++
  addi s2, s2, 1
.L11:
  lw t0, 2(s1)
  add s1, s1, t0
.L12:
  lw t0, 0(s1)
  bne t0, zero, .L10
  ; basic/tools.e16.ts:181  keepProgramTo(progEnd)
  lw a0, 0x0112(zero)
  call keepProgramTo
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/tools.e16.ts:185 checkRoom() at -O1
;   count in s2
;   at in s1
;   n in s3
checkRoom:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  ; basic/tools.e16.ts:186  if (renumStep === 0 || newStart === 0 || newStart > 65529) fail(E_ARGUMENT)
  lw t0, 0x07ee(zero)
  beq t0, zero, .L2
  lw t0, 0x07ea(zero)
  beq t0, zero, .L2
  lw t0, 0x07ea(zero)
  li t1, 65529
  bgeu t1, t0, .L1
.L2:
  ; basic/tools.e16.ts:186  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L1:
  ; basic/tools.e16.ts:187  let count: u16 = 0
  li s2, 0 ; count
  ; basic/tools.e16.ts:188  for (let at = PROG; peek16(at) !== 0; at += peek16(at + 2)) {
  li s1, 2048 ; at
  j .L5
.L3:
  ; basic/tools.e16.ts:189  const n = peek16(at)
  lw s3, 0(s1)
  ; basic/tools.e16.ts:190  if (n < renumFrom && n >= newStart) fail(E_ARGUMENT)
  lw t0, 0x07ec(zero)
  bgeu s3, t0, .L7
  lw t0, 0x07ea(zero)
  bltu s3, t0, .L7
  ; basic/tools.e16.ts:190  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L7:
  ; basic/tools.e16.ts:191  if (n >= renumFrom) count++
  lw t0, 0x07ec(zero)
  bltu s3, t0, .L8
  ; basic/tools.e16.ts:191  count++
  addi s2, s2, 1
.L8:
  lw t0, 2(s1)
  add s1, s1, t0
.L5:
  lw t0, 0(s1)
  bne t0, zero, .L3
  ; basic/tools.e16.ts:193  if (count > 0 && count - 1 > div(65529 - newStart, renumStep)) fail(E_ARGUMENT)
  bgeu zero, s2, .L9
  lw t0, 0x07ea(zero)
  li t1, 65529
  sub t1, t1, t0
  lw t0, 0x07ee(zero)
  divu t1, t1, t0
  addi t0, s2, -1
  bgeu t1, t0, .L9
  ; basic/tools.e16.ts:193  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L9:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/tools.e16.ts:201 checkRewrites() at -O1
;   grows in s3
;   k in 0(fp)
;   at in s1
;   n in 2(fp)
;   length in s2
;   was in 4(fp)
;   now in 6(fp)
;   text in 8(fp)
checkRewrites:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s3, 12(sp)
  sw s1, 14(sp)
  sw s2, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  ; basic/tools.e16.ts:202  let grows: u16 = 0
  li s3, 0 ; grows
  ; basic/tools.e16.ts:203  let k: u16 = 0
  sw zero, 0(fp) ; k
  ; basic/tools.e16.ts:204  for (let at = PROG; peek16(at) !== 0; at += peek16(at + 2)) {
  li s1, 2048 ; at
  j .L3
.L1:
  ; basic/tools.e16.ts:205  const n = peek16(at)
  lw t0, 0(s1)
  sw t0, 2(fp) ; n
  ; basic/tools.e16.ts:206  const length = rewrite(at + 4)
  addi a0, s1, 4
  call rewrite
  mv s2, a0 ; length
  ; basic/tools.e16.ts:207  const was = peek16(at + 2) - 4
  lw t0, 2(s1)
  addi t0, t0, -4
  sw t0, 4(fp) ; was
  ; basic/tools.e16.ts:208  if (length > was) grows += length - was
  lw t0, 4(fp) ; was
  bgeu t0, s2, .L5
  ; basic/tools.e16.ts:208  grows += length - was
  lw t0, 4(fp) ; was
  sub t0, s2, t0
  add s3, s3, t0
.L5:
  ; basic/tools.e16.ts:210  let now = n
  lw t0, 2(fp) ; n
  sw t0, 6(fp) ; now
  ; basic/tools.e16.ts:211  if (n >= renumFrom) {
  lw t0, 0x07ec(zero)
  lw t1, 2(fp) ; n
  bltu t1, t0, .L6
  ; basic/tools.e16.ts:212  now = newStart + k * renumStep
  lw t0, 0x07ea(zero)
  lw t1, 0x07ee(zero)
  lw t2, 0(fp) ; k
  mul t2, t2, t1
  add t0, t0, t2
  sw t0, 6(fp) ; now
  ; basic/tools.e16.ts:213  k++
  lw t0, 0(fp) ; k
  addi t0, t0, 1
  sw t0, 0(fp) ; k
.L6:
  ; basic/tools.e16.ts:215  const text = length === 0 ? at + 4 : addr(lineBuf)
  bne s2, zero, .L7
  addi t0, s1, 4
  j .L8
.L7:
  la t0, lineBuf
.L8:
  sw t0, 8(fp) ; text
  ; basic/tools.e16.ts:216  if (length > LINE_MAX + 1 || listedLength(now, text) > LINE_MAX) failIn(E_LONG, n)
  li t0, 79
  bltu t0, s2, .L10
  lw a0, 6(fp)
  lw a1, 8(fp)
  call listedLength
  li t0, 78
  bgeu t0, a0, .L9
.L10:
  ; basic/tools.e16.ts:216  failIn(E_LONG, n)
  li a0, 21
  lw a1, 2(fp)
  call failIn
.L9:
  lw t0, 2(s1)
  add s1, s1, t0
.L3:
  lw t0, 0(s1)
  bne t0, zero, .L1
  ; basic/tools.e16.ts:218  if (progEnd + 2 + grows > LIMIT) fail(E_MEMORY)
  lw t0, 0x0112(zero)
  addi t0, t0, 2
  add t0, t0, s3
  li t1, 28672
  bgeu t1, t0, .L11
  ; basic/tools.e16.ts:218  fail(E_MEMORY)
  li a0, 8
  call fail
.L11:
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s3, 12(sp)
  lw s1, 14(sp)
  lw s2, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; basic/tools.e16.ts:222 takesLine(c) at -O1
;   c in a0
takesLine:
  ; basic/tools.e16.ts:223  return c === T_GOTO || c === T_GOSUB || c === T_THEN || c === T_ELSE || c === T_RESTORE
  li t0, 142
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L4
  li t0, 143
  sub t0, a0, t0
  seqz t0, t0
.L4:
  mv t1, t0
  bnez t1, .L3
  li t0, 136
  sub t0, a0, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 137
  sub t0, a0, t0
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 160
  sub t0, a0, t0
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; basic/tools.e16.ts:236 rewrite(from) at -O1
;   from in s1
rewrite:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; from
  ; basic/tools.e16.ts:237  rp = from
  sw s1, 0x07f0(zero)
  ; basic/tools.e16.ts:238  ro = 0
  sw zero, 0x07f2(zero)
  ; basic/tools.e16.ts:239  rChanged = false
  sw zero, 0x07f4(zero)
  ; basic/tools.e16.ts:240  rWanting = false
  sw zero, 0x07f8(zero)
  ; basic/tools.e16.ts:241  rInside = false
  sw zero, 0x07f6(zero)
  ; basic/tools.e16.ts:242  while (peek(rp) !== 0) {
  j .L3
.L1:
  ; basic/tools.e16.ts:243  if (!rInside && rWanting && isDigit(peek(rp))) {
  lw t0, 0x07f6(zero)
  bnez t0, .L5
  lw t0, 0x07f8(zero)
  beqz t0, .L5
  lw t0, 0x07f0(zero)
  lbu a0, 0(t0)
  call isDigit
  beqz a0, .L5
  ; basic/tools.e16.ts:244  renumberHere()
  call renumberHere
  ; basic/tools.e16.ts:245  continue
  j .L2
.L5:
  ; basic/tools.e16.ts:247  if (!rInside && peek(rp) === T_REM) {
  lw t0, 0x07f6(zero)
  bnez t0, .L6
  lw t0, 0x07f0(zero)
  lbu t0, 0(t0)
  li t1, 147
  bne t0, t1, .L6
  ; basic/tools.e16.ts:249  while (peek(rp) !== 0) copyOne()
  j .L9
.L7:
  ; basic/tools.e16.ts:249  copyOne()
  call copyOne
.L9:
  lw t0, 0x07f0(zero)
  lbu t0, 0(t0)
  bne t0, zero, .L7
  ; basic/tools.e16.ts:250  break
  j .L4
.L6:
  ; basic/tools.e16.ts:252  note(peek(rp))
  lw t0, 0x07f0(zero)
  lbu a0, 0(t0)
  call note
  ; basic/tools.e16.ts:253  copyOne()
  call copyOne
.L2:
.L3:
  lw t0, 0x07f0(zero)
  lbu t0, 0(t0)
  bne t0, zero, .L1
.L4:
  ; basic/tools.e16.ts:255  if (ro <= LINE_MAX) poke(addr(lineBuf) + ro, 0)
  lw t0, 0x07f2(zero)
  li t1, 78
  bltu t1, t0, .L11
  ; basic/tools.e16.ts:255  poke(addr(lineBuf) + ro, 0)
  lw t0, 0x07f2(zero)
  sb zero, lineBuf(t0)
.L11:
  ; basic/tools.e16.ts:256  return rChanged ? ro + 1 : 0
  lw t0, 0x07f4(zero)
  beqz t0, .L12
  lw t0, 0x07f2(zero)
  addi t0, t0, 1
  j .L13
.L12:
  li t0, 0
.L13:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/tools.e16.ts:264 note(c) at -O1
;   c in s1
note:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/tools.e16.ts:265  if (c === CH_QUOTE) rInside = !rInside
  li t0, 34
  bne s1, t0, .L1
  ; basic/tools.e16.ts:265  rInside = !rInside
  lw t0, 0x07f6(zero)
  seqz t0, t0
  sw t0, 0x07f6(zero)
.L1:
  ; basic/tools.e16.ts:267  if (!rInside && c !== CH_SPACE) rWanting = takesLine(c) || (rWanting && c === CH_COMMA)
  lw t0, 0x07f6(zero)
  bnez t0, .L2
  li t0, 32
  beq s1, t0, .L2
  ; basic/tools.e16.ts:267  rWanting = takesLine(c) || (rWanting && c === CH_COMMA)
  mv a0, s1
  call takesLine
  mv t1, a0
  mv t0, a0
  bnez t1, .L3
  lw t0, 0x07f8(zero)
  sub t0, t0, zero
  snez t0, t0
  mv t1, t0
  beqz t1, .L4
  li t0, 44
  sub t0, s1, t0
  seqz t0, t0
.L4:
.L3:
  sw t0, 0x07f8(zero)
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/tools.e16.ts:274 copyOne() at -O1
copyOne:
  ; basic/tools.e16.ts:275  if (ro < LINE_MAX) poke(addr(lineBuf) + ro, peek(rp))
  lw t0, 0x07f2(zero)
  li t1, 78
  bgeu t0, t1, .L1
  ; basic/tools.e16.ts:275  poke(addr(lineBuf) + ro, peek(rp))
  lw t0, 0x07f2(zero)
  lw t1, 0x07f0(zero)
  lbu t1, 0(t1)
  sb t1, lineBuf(t0)
.L1:
  ; basic/tools.e16.ts:276  ro++
  lw t0, 0x07f2(zero)
  addi t0, t0, 1
  sw t0, 0x07f2(zero)
  ; basic/tools.e16.ts:277  rp++
  lw t0, 0x07f0(zero)
  addi t0, t0, 1
  sw t0, 0x07f0(zero)
.return:
  ret

; basic/tools.e16.ts:281 renumberHere() at -O1
;   old in s1
;   start in s2
;   now in s3
;   written in s0
renumberHere:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  ; basic/tools.e16.ts:282  let old: u16 = 0
  li s1, 0 ; old
  ; basic/tools.e16.ts:283  const start = rp
  lw s2, 0x07f0(zero)
  ; basic/tools.e16.ts:284  while (isDigit(peek(rp))) {
  j .L3
.L1:
  ; basic/tools.e16.ts:285  old = old * 10 + (peek(rp) - 0x30)
  slli t1, s1, 3
  slli t0, s1, 1
  add t0, t0, t1
  lw t1, 0x07f0(zero)
  lbu t1, 0(t1)
  addi t1, t1, -48
  add s1, t0, t1
  ; basic/tools.e16.ts:286  rp++
  lw t0, 0x07f0(zero)
  addi t0, t0, 1
  sw t0, 0x07f0(zero)
.L3:
  lw t0, 0x07f0(zero)
  lbu a0, 0(t0)
  call isDigit
  bnez a0, .L1
  ; basic/tools.e16.ts:288  if (!standsAlone(rp)) {
  lw a0, 0x07f0(zero)
  call standsAlone
  bnez a0, .L5
  ; basic/tools.e16.ts:289  rp = start
  sw s2, 0x07f0(zero)
  ; basic/tools.e16.ts:290  while (isDigit(peek(rp))) copyOne()
  j .L8
.L6:
  ; basic/tools.e16.ts:290  copyOne()
  call copyOne
.L8:
  lw t0, 0x07f0(zero)
  lbu a0, 0(t0)
  call isDigit
  bnez a0, .L6
  ; basic/tools.e16.ts:291  return
  j .return
.L5:
  ; basic/tools.e16.ts:293  const now = renumbered(old)
  mv a0, s1
  call renumbered
  mv s3, a0 ; now
  ; basic/tools.e16.ts:295  const written = unsignedText(now, ro + 5 <= LINE_MAX ? addr(lineBuf) + ro : addr(textOut))
  lw t0, 0x07f2(zero)
  addi t1, t0, 5
  mv t0, s3
  li t2, 78
  bltu t2, t1, .L10
  lw t1, 0x07f2(zero)
  addi t1, t1, lineBuf
  j .L11
.L10:
  la t1, textOut
.L11:
  mv a0, t0
  mv a1, t1
  call unsignedText
  mv s0, a0 ; written
  ; basic/tools.e16.ts:296  if (written !== rp - start || now !== old) rChanged = true
  lw t0, 0x07f0(zero)
  sub t0, t0, s2
  bne s0, t0, .L13
  beq s3, s1, .L12
.L13:
  ; basic/tools.e16.ts:296  rChanged = true
  li t0, 1
  sw t0, 0x07f4(zero)
.L12:
  ; basic/tools.e16.ts:297  ro += written
  lw t0, 0x07f2(zero)
  add t0, t0, s0
  sw t0, 0x07f2(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; basic/tools.e16.ts:305 standsAlone(p) at -O1
;   p in s2
;   q in s1
standsAlone:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; p
  ; basic/tools.e16.ts:306  let q = p
  mv s1, s2 ; q
  ; basic/tools.e16.ts:307  while (peek(q) === CH_SPACE) q++
  j .L3
.L1:
  ; basic/tools.e16.ts:307  q++
  addi s1, s1, 1
.L3:
  lbu t0, 0(s1)
  li t1, 32
  beq t0, t1, .L1
  ; basic/tools.e16.ts:308  return !isOperator(peek(q))
  lbu a0, 0(s1)
  call isOperator
  seqz a0, a0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/tools.e16.ts:312 isOperator(c) at -O1
;   c in a0
isOperator:
  ; basic/tools.e16.ts:313  if (c === T_MOD || c === T_AND || c === T_OR) return true
  li t0, 222
  beq a0, t0, .L2
  li t0, 199
  beq a0, t0, .L2
  li t0, 200
  bne a0, t0, .L1
.L2:
  ; basic/tools.e16.ts:313  return true
  li a0, 1
  ret
.L1:
  ; basic/tools.e16.ts:314  return (
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
  li t0, 42
  sub t0, a0, t0
  seqz t0, t0
.L9:
  mv t1, t0
  bnez t1, .L8
  li t0, 47
  sub t0, a0, t0
  seqz t0, t0
.L8:
  mv t1, t0
  bnez t1, .L7
  li t0, 92
  sub t0, a0, t0
  seqz t0, t0
.L7:
  mv t1, t0
  bnez t1, .L6
  li t0, 94
  sub t0, a0, t0
  seqz t0, t0
.L6:
  mv t1, t0
  bnez t1, .L5
  li t0, 60
  sub t0, a0, t0
  seqz t0, t0
.L5:
  mv t1, t0
  bnez t1, .L4
  li t0, 61
  sub t0, a0, t0
  seqz t0, t0
.L4:
  mv t1, t0
  bnez t1, .L3
  li t0, 62
  sub t0, a0, t0
  seqz t0, t0
.L3:
  mv a0, t0
.return:
  ret

; basic/tools.e16.ts:328 toolStatement(c) at -O1
;   c in s1
toolStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/tools.e16.ts:329  if (c === T_AUTO) autoStatement()
  li t0, 163
  bne s1, t0, .L1
  ; basic/tools.e16.ts:329  autoStatement()
  call autoStatement
  j .L2
.L1:
  ; basic/tools.e16.ts:330  if (c === T_RENUM) renumStatement()
  li t0, 164
  bne s1, t0, .L3
  ; basic/tools.e16.ts:330  renumStatement()
  call renumStatement
  j .L4
.L3:
  ; basic/tools.e16.ts:331  if (c === T_DELETE) deleteStatement()
  li t0, 165
  bne s1, t0, .L5
  ; basic/tools.e16.ts:331  deleteStatement()
  call deleteStatement
  j .L6
.L5:
  ; basic/tools.e16.ts:332  setTracing(c === T_TRON)
  li t0, 166
  sub t0, s1, t0
  seqz a0, t0
  call setTracing
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

  .align 2

  .bank 4
  .org 0xc000
; basic/monitor.e16.ts:46 emit(c) at -O1
;   c in a0
;   at in a1
emit:
  ; basic/monitor.e16.ts:47  const at = peek16(OUT_AT)
  lw a1, 130(zero)
  ; basic/monitor.e16.ts:48  poke(at, c)
  sb a0, 0(a1)
  ; basic/monitor.e16.ts:49  poke16(OUT_AT, at + 1)
  addi t0, a1, 1
  sw t0, 130(zero)
.return:
  ret

; basic/monitor.e16.ts:52 emitStr(s) at -O1
;   s in s2
;   p in s1
emitStr:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; s
  ; basic/monitor.e16.ts:53  let p = s
  mv s1, s2 ; p
  ; basic/monitor.e16.ts:54  while (peek(p) !== 0) {
  j .L3
.L1:
  ; basic/monitor.e16.ts:55  emit(peek(p))
  lbu a0, 0(s1)
  call emit
  ; basic/monitor.e16.ts:56  p++
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

; basic/monitor.e16.ts:61 emitWord(list, n) at -O1
;   list in s3
;   n in s0
;   p in s1
;   k in s2
emitWord:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  mv s3, a0 ; list
  mv s0, a1 ; n
  ; basic/monitor.e16.ts:62  let p = list
  mv s1, s3 ; p
  ; basic/monitor.e16.ts:63  let k: u16 = 0
  li s2, 0 ; k
  ; basic/monitor.e16.ts:64  while (k < n) {
  j .L3
  ; basic/monitor.e16.ts:65  while (peek(p) !== 0x20) p++
.L5:
  ; basic/monitor.e16.ts:65  p++
  addi s1, s1, 1
.L7:
  lbu t0, 0(s1)
  li t1, 32
  bne t0, t1, .L5
  ; basic/monitor.e16.ts:66  p++
  addi s1, s1, 1
  ; basic/monitor.e16.ts:67  k++
  addi s2, s2, 1
.L3:
  bltu s2, s0, .L7
  ; basic/monitor.e16.ts:69  while (peek(p) !== 0x20 && peek(p) !== 0) {
  j .L11
.L9:
  ; basic/monitor.e16.ts:70  emit(peek(p))
  lbu a0, 0(s1)
  call emit
  ; basic/monitor.e16.ts:71  p++
  addi s1, s1, 1
.L11:
  lbu t0, 0(s1)
  li t1, 32
  beq t0, t1, .L13
  lbu t0, 0(s1)
  bne t0, zero, .L9
.L13:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; basic/monitor.e16.ts:75 emitReg(r) at -O1
;   r in s1
emitReg:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; r
  ; basic/monitor.e16.ts:76  emitWord(str('zero ra sp gp a0 a1 a2 a3 t0 t1 t2 t3 s0 s1 s2 s3'), r)
  la a0, str_34
  mv a1, s1
  call emitWord
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/monitor.e16.ts:79 comma() at -O1
comma:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/monitor.e16.ts:80  emit(0x2c)
  li a0, 44
  call emit
  ; basic/monitor.e16.ts:81  emit(0x20)
  li a0, 32
  call emit
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/monitor.e16.ts:84 emitHex4(v) at -O1
;   v in s3
;   shift in s1
;   d in s2
emitHex4:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; v
  ; basic/monitor.e16.ts:85  let shift: u16 = 16
  li s1, 16 ; shift
  ; basic/monitor.e16.ts:86  while (shift !== 0) {
  j .L3
.L1:
  ; basic/monitor.e16.ts:87  shift -= 4
  addi s1, s1, -4
  ; basic/monitor.e16.ts:88  const d = (v >> shift) & 15
  srl t0, s3, s1
  andi s2, t0, 15
  ; basic/monitor.e16.ts:89  emit(d < 10 ? 0x30 + d : 0x37 + d)
  li t0, 10
  bgeu s2, t0, .L5
  addi t0, s2, 48
  j .L6
.L5:
  addi t0, s2, 55
.L6:
  mv a0, t0
  call emit
.L3:
  bne s1, zero, .L1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; basic/monitor.e16.ts:93 emitHex(v) at -O1
;   v in s1
emitHex:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; basic/monitor.e16.ts:94  emit(0x30)
  li a0, 48
  call emit
  ; basic/monitor.e16.ts:95  emit(0x78)
  li a0, 120
  call emit
  ; basic/monitor.e16.ts:96  emitHex4(v)
  mv a0, s1
  call emitHex4
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/monitor.e16.ts:99 emitUnsigned(v) at -O1
;   v in s1
emitUnsigned:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; basic/monitor.e16.ts:100  if (v >= 10) emitUnsigned(div(v, 10))
  li t0, 10
  bltu s1, t0, .L1
  ; basic/monitor.e16.ts:100  emitUnsigned(div(v, 10))
  li t0, 10
  divu a0, s1, t0
  call emitUnsigned
.L1:
  ; basic/monitor.e16.ts:101  emit(0x30 + (v % 10))
  li t0, 10
  remu t0, s1, t0
  addi a0, t0, 48
  call emit
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/monitor.e16.ts:104 emitNumber(v) at -O1
;   v in s1
emitNumber:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; basic/monitor.e16.ts:105  if (v < 0) {
  bge s1, zero, .L1
  ; basic/monitor.e16.ts:106  emit(0x2d)
  li a0, 45
  call emit
  ; basic/monitor.e16.ts:107  emitUnsigned(u16(-v))
  neg a0, s1
  call emitUnsigned
  j .L2
.L1:
  ; basic/monitor.e16.ts:109  emitUnsigned(u16(v))
  mv a0, s1
  call emitUnsigned
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/monitor.e16.ts:114 emitCsr(n) at -O1
;   n in s1
emitCsr:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; basic/monitor.e16.ts:115  if (n === 0x300) emitStr(str('mstatus'))
  li t0, 768
  bne s1, t0, .L1
  ; basic/monitor.e16.ts:115  emitStr(str('mstatus'))
  la a0, str_35
  call emitStr
  j .L2
.L1:
  ; basic/monitor.e16.ts:116  if (n === 0x301) emitStr(str('misa'))
  li t0, 769
  bne s1, t0, .L3
  ; basic/monitor.e16.ts:116  emitStr(str('misa'))
  la a0, str_36
  call emitStr
  j .L4
.L3:
  ; basic/monitor.e16.ts:117  if (n === 0x304) emitStr(str('mie'))
  li t0, 772
  bne s1, t0, .L5
  ; basic/monitor.e16.ts:117  emitStr(str('mie'))
  la a0, str_37
  call emitStr
  j .L6
.L5:
  ; basic/monitor.e16.ts:118  if (n === 0x305) emitStr(str('mtvec'))
  li t0, 773
  bne s1, t0, .L7
  ; basic/monitor.e16.ts:118  emitStr(str('mtvec'))
  la a0, str_38
  call emitStr
  j .L8
.L7:
  ; basic/monitor.e16.ts:119  if (n === 0x340) emitStr(str('mscratch'))
  li t0, 832
  bne s1, t0, .L9
  ; basic/monitor.e16.ts:119  emitStr(str('mscratch'))
  la a0, str_39
  call emitStr
  j .L10
.L9:
  ; basic/monitor.e16.ts:120  if (n === 0x341) emitStr(str('mepc'))
  li t0, 833
  bne s1, t0, .L11
  ; basic/monitor.e16.ts:120  emitStr(str('mepc'))
  la a0, str_40
  call emitStr
  j .L12
.L11:
  ; basic/monitor.e16.ts:121  if (n === 0x342) emitStr(str('mcause'))
  li t0, 834
  bne s1, t0, .L13
  ; basic/monitor.e16.ts:121  emitStr(str('mcause'))
  la a0, str_41
  call emitStr
  j .L14
.L13:
  ; basic/monitor.e16.ts:122  if (n === 0x343) emitStr(str('mtval'))
  li t0, 835
  bne s1, t0, .L15
  ; basic/monitor.e16.ts:122  emitStr(str('mtval'))
  la a0, str_42
  call emitStr
  j .L16
.L15:
  ; basic/monitor.e16.ts:123  if (n === 0x344) emitStr(str('mip'))
  li t0, 836
  bne s1, t0, .L17
  ; basic/monitor.e16.ts:123  emitStr(str('mip'))
  la a0, str_43
  call emitStr
  j .L18
.L17:
  ; basic/monitor.e16.ts:124  if (n === 0xc00) emitStr(str('cycle'))
  li t0, 3072
  bne s1, t0, .L19
  ; basic/monitor.e16.ts:124  emitStr(str('cycle'))
  la a0, str_44
  call emitStr
  j .L20
.L19:
  ; basic/monitor.e16.ts:125  if (n === 0xc02) emitStr(str('instret'))
  li t0, 3074
  bne s1, t0, .L21
  ; basic/monitor.e16.ts:125  emitStr(str('instret'))
  la a0, str_45
  call emitStr
  j .L22
.L21:
  ; basic/monitor.e16.ts:126  if (n === 0xc80) emitStr(str('cycleh'))
  li t0, 3200
  bne s1, t0, .L23
  ; basic/monitor.e16.ts:126  emitStr(str('cycleh'))
  la a0, str_46
  call emitStr
  j .L24
.L23:
  ; basic/monitor.e16.ts:127  if (n === 0xc82) emitStr(str('instreth'))
  li t0, 3202
  bne s1, t0, .L25
  ; basic/monitor.e16.ts:127  emitStr(str('instreth'))
  la a0, str_47
  call emitStr
  j .L26
.L25:
  ; basic/monitor.e16.ts:128  emitUnsigned(n)
  mv a0, s1
  call emitUnsigned
.L26:
.L24:
.L22:
.L20:
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
  addi sp, sp, 4
  ret

; basic/monitor.e16.ts:174 decoded(name, format, rd, rs1) at -O1
;   name in a0
;   format in a1
;   rd in a2
;   rs1 in a3
decoded:
  ; basic/monitor.e16.ts:175  poke16(D_NAME, name)
  sw a0, 132(zero)
  ; basic/monitor.e16.ts:176  poke16(D_FORMAT, name === 0 ? F_ILLEGAL : format)
  li t0, 134
  mv t1, a0
  li t2, 0
  bne t1, t2, .L1
  li t1, 0
  j .L2
.L1:
  mv t1, a1
.L2:
  sw t1, 0(t0)
  ; basic/monitor.e16.ts:177  poke16(D_RD, rd)
  sw a2, 136(zero)
  ; basic/monitor.e16.ts:178  poke16(D_RS1, rs1)
  sw a3, 138(zero)
.return:
  ret

; basic/monitor.e16.ts:193 imm() at -O1
imm:
  ; basic/monitor.e16.ts:194  return i16(peek16(D_IMM))
  lw a0, 142(zero)
.return:
  ret

; basic/monitor.e16.ts:200 rName(key) at -O1
;   key in s1
rName:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; key
  ; basic/monitor.e16.ts:201  switch (key) {
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
  li t0, 13
  beq s1, t0, .L11
  li t0, 16
  beq s1, t0, .L12
  li t0, 17
  beq s1, t0, .L13
  li t0, 18
  beq s1, t0, .L14
  li t0, 19
  beq s1, t0, .L15
  li t0, 20
  beq s1, t0, .L16
  li t0, 21
  beq s1, t0, .L17
  li t0, 22
  beq s1, t0, .L18
  li t0, 23
  beq s1, t0, .L19
  j .L20
.L2:
  ; basic/monitor.e16.ts:203  return str('add')
  la a0, str_48
  j .return
.L3:
  ; basic/monitor.e16.ts:205  return str('sll')
  la a0, str_49
  j .return
.L4:
  ; basic/monitor.e16.ts:207  return str('slt')
  la a0, str_50
  j .return
.L5:
  ; basic/monitor.e16.ts:209  return str('sltu')
  la a0, str_51
  j .return
.L6:
  ; basic/monitor.e16.ts:211  return str('xor')
  la a0, str_52
  j .return
.L7:
  ; basic/monitor.e16.ts:213  return str('srl')
  la a0, str_53
  j .return
.L8:
  ; basic/monitor.e16.ts:215  return str('or')
  la a0, str_54
  j .return
.L9:
  ; basic/monitor.e16.ts:217  return str('and')
  la a0, str_55
  j .return
.L10:
  ; basic/monitor.e16.ts:219  return str('sub')
  la a0, str_56
  j .return
.L11:
  ; basic/monitor.e16.ts:221  return str('sra')
  la a0, str_57
  j .return
.L12:
  ; basic/monitor.e16.ts:223  return str('mul')
  la a0, str_58
  j .return
.L13:
  ; basic/monitor.e16.ts:225  return str('mulh')
  la a0, str_59
  j .return
.L14:
  ; basic/monitor.e16.ts:227  return str('mulhsu')
  la a0, str_60
  j .return
.L15:
  ; basic/monitor.e16.ts:229  return str('mulhu')
  la a0, str_61
  j .return
.L16:
  ; basic/monitor.e16.ts:231  return str('div')
  la a0, str_62
  j .return
.L17:
  ; basic/monitor.e16.ts:233  return str('divu')
  la a0, str_63
  j .return
.L18:
  ; basic/monitor.e16.ts:235  return str('rem')
  la a0, str_64
  j .return
.L19:
  ; basic/monitor.e16.ts:237  return str('remu')
  la a0, str_65
  j .return
.L20:
  ; basic/monitor.e16.ts:239  return bitName(key)
  mv a0, s1
  call bitName
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/monitor.e16.ts:243 bitName(key) at -O1
;   key in a0
bitName:
  ; basic/monitor.e16.ts:244  switch (key) {
  li t0, 25
  beq a0, t0, .L2
  li t0, 28
  beq a0, t0, .L3
  li t0, 29
  beq a0, t0, .L4
  li t0, 30
  beq a0, t0, .L5
  li t0, 31
  beq a0, t0, .L6
  li t0, 36
  beq a0, t0, .L7
  li t0, 37
  beq a0, t0, .L8
  li t0, 38
  beq a0, t0, .L9
  li t0, 39
  beq a0, t0, .L10
  li t0, 40
  beq a0, t0, .L11
  li t0, 41
  beq a0, t0, .L12
  li t0, 42
  beq a0, t0, .L13
  li t0, 43
  beq a0, t0, .L14
  li t0, 48
  beq a0, t0, .L15
  li t0, 49
  beq a0, t0, .L16
  j .L17
.L2:
  ; basic/monitor.e16.ts:246  return str('rol')
  la a0, str_66
  ret
.L3:
  ; basic/monitor.e16.ts:248  return str('xnor')
  la a0, str_67
  ret
.L4:
  ; basic/monitor.e16.ts:250  return str('ror')
  la a0, str_68
  ret
.L5:
  ; basic/monitor.e16.ts:252  return str('orn')
  la a0, str_69
  ret
.L6:
  ; basic/monitor.e16.ts:254  return str('andn')
  la a0, str_70
  ret
.L7:
  ; basic/monitor.e16.ts:256  return str('min')
  la a0, str_71
  ret
.L8:
  ; basic/monitor.e16.ts:258  return str('minu')
  la a0, str_72
  ret
.L9:
  ; basic/monitor.e16.ts:260  return str('max')
  la a0, str_73
  ret
.L10:
  ; basic/monitor.e16.ts:262  return str('maxu')
  la a0, str_74
  ret
.L11:
  ; basic/monitor.e16.ts:264  return str('bset')
  la a0, str_75
  ret
.L12:
  ; basic/monitor.e16.ts:266  return str('bclr')
  la a0, str_76
  ret
.L13:
  ; basic/monitor.e16.ts:268  return str('binv')
  la a0, str_77
  ret
.L14:
  ; basic/monitor.e16.ts:270  return str('bext')
  la a0, str_78
  ret
.L15:
  ; basic/monitor.e16.ts:272  return str('mcpy')
  la a0, str_79
  ret
.L16:
  ; basic/monitor.e16.ts:274  return str('mset')
  la a0, str_80
  ret
.L17:
  ; basic/monitor.e16.ts:276  return 0
  li a0, 0
.return:
  ret

; basic/monitor.e16.ts:284 blockRegisters(key, rd, rs1, rs2) at -O1
;   key in a0
;   rd in a1
;   rs1 in a2
;   rs2 in a3
blockRegisters:
  ; basic/monitor.e16.ts:285  if (key !== 48 && key !== 49) return true
  li t0, 48
  beq a0, t0, .L1
  li t0, 49
  beq a0, t0, .L1
  ; basic/monitor.e16.ts:285  return true
  li a0, 1
  ret
.L1:
  ; basic/monitor.e16.ts:286  if (rd === 0 || rs2 === 0 || rd === rs2 || rd === rs1 || rs1 === rs2) return false
  beq a1, zero, .L3
  beq a3, zero, .L3
  beq a1, a3, .L3
  beq a1, a2, .L3
  bne a2, a3, .L2
.L3:
  ; basic/monitor.e16.ts:286  return false
  li a0, 0
  ret
.L2:
  ; basic/monitor.e16.ts:287  return key === 49 || rs1 !== 0
  li t0, 49
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L4
  sub t0, a2, zero
  snez t0, t0
.L4:
  mv a0, t0
.return:
  ret

; basic/monitor.e16.ts:291 shiftName(f3, sel) at -O1
;   f3 in a0
;   sel in a1
shiftName:
  ; basic/monitor.e16.ts:292  if (f3 === 5) {
  li t0, 5
  bne a0, t0, .L1
  ; basic/monitor.e16.ts:293  if (sel === 0) return str('srli')
  bne a1, zero, .L2
  ; basic/monitor.e16.ts:293  return str('srli')
  la a0, str_81
  ret
.L2:
  ; basic/monitor.e16.ts:294  if (sel === 1) return str('srai')
  li t0, 1
  bne a1, t0, .L3
  ; basic/monitor.e16.ts:294  return str('srai')
  la a0, str_82
  ret
.L3:
  ; basic/monitor.e16.ts:295  if (sel === 2) return str('rori')
  li t0, 2
  bne a1, t0, .L4
  ; basic/monitor.e16.ts:295  return str('rori')
  la a0, str_83
  ret
.L4:
  ; basic/monitor.e16.ts:296  if (sel === 3) return str('bexti')
  li t0, 3
  bne a1, t0, .L5
  ; basic/monitor.e16.ts:296  return str('bexti')
  la a0, str_84
  ret
.L5:
  ; basic/monitor.e16.ts:297  return 0
  li a0, 0
  ret
.L1:
  ; basic/monitor.e16.ts:299  switch (sel) {
  beq a1, zero, .L7
  li t0, 1
  beq a1, t0, .L8
  li t0, 2
  beq a1, t0, .L9
  li t0, 3
  beq a1, t0, .L10
  li t0, 16
  beq a1, t0, .L11
  li t0, 17
  beq a1, t0, .L12
  li t0, 18
  beq a1, t0, .L13
  li t0, 19
  beq a1, t0, .L14
  li t0, 20
  beq a1, t0, .L15
  li t0, 21
  beq a1, t0, .L16
  j .L17
.L7:
  ; basic/monitor.e16.ts:301  return str('slli')
  la a0, str_85
  ret
.L8:
  ; basic/monitor.e16.ts:303  return str('bseti')
  la a0, str_86
  ret
.L9:
  ; basic/monitor.e16.ts:305  return str('bclri')
  la a0, str_87
  ret
.L10:
  ; basic/monitor.e16.ts:307  return str('binvi')
  la a0, str_88
  ret
.L11:
  ; basic/monitor.e16.ts:309  return str('clz')
  la a0, str_89
  ret
.L12:
  ; basic/monitor.e16.ts:311  return str('ctz')
  la a0, str_90
  ret
.L13:
  ; basic/monitor.e16.ts:313  return str('cpop')
  la a0, str_91
  ret
.L14:
  ; basic/monitor.e16.ts:315  return str('sext.b')
  la a0, str_92
  ret
.L15:
  ; basic/monitor.e16.ts:317  return str('zext.b')
  la a0, str_93
  ret
.L16:
  ; basic/monitor.e16.ts:319  return str('rev8')
  la a0, str_94
  ret
.L17:
  ; basic/monitor.e16.ts:321  return 0
  li a0, 0
.return:
  ret

; basic/monitor.e16.ts:325 immName(f3) at -O1
;   f3 in a0
immName:
  ; basic/monitor.e16.ts:326  switch (f3) {
  beq a0, zero, .L2
  li t0, 2
  beq a0, t0, .L3
  li t0, 3
  beq a0, t0, .L4
  li t0, 4
  beq a0, t0, .L5
  li t0, 6
  beq a0, t0, .L6
  li t0, 7
  beq a0, t0, .L7
  j .L8
.L2:
  ; basic/monitor.e16.ts:328  return str('addi')
  la a0, str_95
  ret
.L3:
  ; basic/monitor.e16.ts:330  return str('slti')
  la a0, str_96
  ret
.L4:
  ; basic/monitor.e16.ts:332  return str('sltiu')
  la a0, str_97
  ret
.L5:
  ; basic/monitor.e16.ts:334  return str('xori')
  la a0, str_98
  ret
.L6:
  ; basic/monitor.e16.ts:336  return str('ori')
  la a0, str_99
  ret
.L7:
  ; basic/monitor.e16.ts:338  return str('andi')
  la a0, str_100
  ret
.L8:
  ; basic/monitor.e16.ts:340  return 0
  li a0, 0
.return:
  ret

; basic/monitor.e16.ts:344 opImm(f3, rd, rs1, imm14) at -O1
;   f3 in s1
;   rd in s3
;   rs1 in 0(fp)
;   imm14 in s2
;   sel in 2(fp)
;   setImm.v in 4(fp)
;   setImm.v in 6(fp)
opImm:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw s2, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s1, a0 ; f3
  mv s3, a1 ; rd
  sw a2, 0(fp) ; rs1
  mv s2, a3 ; imm14
  ; basic/monitor.e16.ts:345  if (f3 !== 1 && f3 !== 5) {
  li t0, 1
  beq s1, t0, .L1
  li t0, 5
  beq s1, t0, .L1
  ; basic/monitor.e16.ts:346  decoded(immName(f3), F_I, rd, rs1)
  mv a0, s1
  call immName
  li a1, 2
  mv a2, s3
  lw a3, 0(fp)
  call decoded
  ; basic/monitor.e16.ts:347  setImm(i16(wrap16(imm14 << 2)) >> 2)
  slli t0, s2, 2
  srai t0, t0, 2
  sw t0, 4(fp) ; setImm.v
  ; basic/monitor.e16.ts:186  poke16(D_IMM, u16(v))
  lw t0, 4(fp) ; setImm.v
  sw t0, 142(zero)
  ; basic/monitor.e16.ts:348  return
  j .return
.L1:
  ; basic/monitor.e16.ts:350  const sel = imm14 >> 4
  srli t0, s2, 4
  sw t0, 2(fp) ; sel
  ; basic/monitor.e16.ts:351  if (sel < 0x10) {
  li t0, 16
  lw t1, 2(fp) ; sel
  bgeu t1, t0, .L2
  ; basic/monitor.e16.ts:352  decoded(shiftName(f3, sel), F_I, rd, rs1)
  mv a0, s1
  lw a1, 2(fp)
  call shiftName
  li a1, 2
  mv a2, s3
  lw a3, 0(fp)
  call decoded
  ; basic/monitor.e16.ts:353  setImm(i16(imm14 & 15))
  andi t0, s2, 15
  sw t0, 6(fp) ; setImm.v
  ; basic/monitor.e16.ts:186  poke16(D_IMM, u16(v))
  lw t0, 6(fp) ; setImm.v
  sw t0, 142(zero)
  j .L3
.L2:
  ; basic/monitor.e16.ts:354  if ((imm14 & 15) === 0) {
  andi t0, s2, 15
  bne t0, zero, .L4
  ; basic/monitor.e16.ts:355  decoded(shiftName(f3, sel), F_UNARY, rd, rs1)
  mv a0, s1
  lw a1, 2(fp)
  call shiftName
  li a1, 4
  mv a2, s3
  lw a3, 0(fp)
  call decoded
  j .L5
.L4:
  ; basic/monitor.e16.ts:357  illegal()
  ; basic/monitor.e16.ts:182  poke16(D_FORMAT, F_ILLEGAL)
  sw zero, 134(zero)
.L5:
.L3:
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s2, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; basic/monitor.e16.ts:361 loadOrJalr(major, f3) at -O1
;   major in a0
;   f3 in a1
loadOrJalr:
  ; basic/monitor.e16.ts:362  if (major === 6) return f3 === 0 ? str('jalr') : 0
  li t0, 6
  bne a0, t0, .L1
  ; basic/monitor.e16.ts:362  return f3 === 0 ? str('jalr') : 0
  bne a1, zero, .L2
  la t0, str_101
  j .L3
.L2:
  li t0, 0
.L3:
  mv a0, t0
  ret
.L1:
  ; basic/monitor.e16.ts:363  if (f3 === 0) return str('lb')
  bne a1, zero, .L4
  ; basic/monitor.e16.ts:363  return str('lb')
  la a0, str_102
  ret
.L4:
  ; basic/monitor.e16.ts:364  if (f3 === 1) return str('lw')
  li t0, 1
  bne a1, t0, .L5
  ; basic/monitor.e16.ts:364  return str('lw')
  la a0, str_103
  ret
.L5:
  ; basic/monitor.e16.ts:365  if (f3 === 4) return str('lbu')
  li t0, 4
  bne a1, t0, .L6
  ; basic/monitor.e16.ts:365  return str('lbu')
  la a0, str_104
  ret
.L6:
  ; basic/monitor.e16.ts:366  return 0
  li a0, 0
.return:
  ret

; basic/monitor.e16.ts:369 branchName(f3) at -O1
;   f3 in a0
branchName:
  ; basic/monitor.e16.ts:370  switch (f3) {
  beq a0, zero, .L2
  li t0, 1
  beq a0, t0, .L3
  li t0, 4
  beq a0, t0, .L4
  li t0, 5
  beq a0, t0, .L5
  li t0, 6
  beq a0, t0, .L6
  li t0, 7
  beq a0, t0, .L7
  j .L8
.L2:
  ; basic/monitor.e16.ts:372  return str('beq')
  la a0, str_105
  ret
.L3:
  ; basic/monitor.e16.ts:374  return str('bne')
  la a0, str_106
  ret
.L4:
  ; basic/monitor.e16.ts:376  return str('blt')
  la a0, str_107
  ret
.L5:
  ; basic/monitor.e16.ts:378  return str('bge')
  la a0, str_108
  ret
.L6:
  ; basic/monitor.e16.ts:380  return str('bltu')
  la a0, str_109
  ret
.L7:
  ; basic/monitor.e16.ts:382  return str('bgeu')
  la a0, str_110
  ret
.L8:
  ; basic/monitor.e16.ts:384  return 0
  li a0, 0
.return:
  ret

; basic/monitor.e16.ts:388 csrName(f3) at -O1
;   f3 in a0
csrName:
  ; basic/monitor.e16.ts:389  switch (f3) {
  li t0, 1
  beq a0, t0, .L2
  li t0, 2
  beq a0, t0, .L3
  li t0, 3
  beq a0, t0, .L4
  li t0, 5
  beq a0, t0, .L5
  li t0, 6
  beq a0, t0, .L6
  li t0, 7
  beq a0, t0, .L7
  j .L8
.L2:
  ; basic/monitor.e16.ts:391  return str('csrrw')
  la a0, str_111
  ret
.L3:
  ; basic/monitor.e16.ts:393  return str('csrrs')
  la a0, str_112
  ret
.L4:
  ; basic/monitor.e16.ts:395  return str('csrrc')
  la a0, str_113
  ret
.L5:
  ; basic/monitor.e16.ts:397  return str('csrrwi')
  la a0, str_114
  ret
.L6:
  ; basic/monitor.e16.ts:399  return str('csrrsi')
  la a0, str_115
  ret
.L7:
  ; basic/monitor.e16.ts:401  return str('csrrci')
  la a0, str_116
  ret
.L8:
  ; basic/monitor.e16.ts:403  return 0
  li a0, 0
.return:
  ret

; basic/monitor.e16.ts:407 sysName(kind) at -O1
;   kind in a0
sysName:
  ; basic/monitor.e16.ts:408  if (kind === 0) return str('ecall')
  bne a0, zero, .L1
  ; basic/monitor.e16.ts:408  return str('ecall')
  la a0, str_117
  ret
.L1:
  ; basic/monitor.e16.ts:409  if (kind === 1) return str('ebreak')
  li t0, 1
  bne a0, t0, .L2
  ; basic/monitor.e16.ts:409  return str('ebreak')
  la a0, str_118
  ret
.L2:
  ; basic/monitor.e16.ts:410  if (kind === 2) return str('mret')
  li t0, 2
  bne a0, t0, .L3
  ; basic/monitor.e16.ts:410  return str('mret')
  la a0, str_119
  ret
.L3:
  ; basic/monitor.e16.ts:411  if (kind === 3) return str('wfi')
  li t0, 3
  bne a0, t0, .L4
  ; basic/monitor.e16.ts:411  return str('wfi')
  la a0, str_120
  ret
.L4:
  ; basic/monitor.e16.ts:412  return 0
  li a0, 0
.return:
  ret

; basic/monitor.e16.ts:415 system(f3, rd, rs1, imm14) at -O1
;   f3 in s1
;   rd in s3
;   rs1 in 0(fp)
;   imm14 in s2
;   setImm.v in 2(fp)
system:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; f3
  mv s3, a1 ; rd
  sw a2, 0(fp) ; rs1
  mv s2, a3 ; imm14
  ; basic/monitor.e16.ts:416  if (f3 === 0) {
  bne s1, zero, .L1
  ; basic/monitor.e16.ts:418  if (rd !== 0 || rs1 !== 0) illegal()
  bne s3, zero, .L3
  lw t0, 0(fp) ; rs1
  beq t0, zero, .L2
.L3:
  ; basic/monitor.e16.ts:418  illegal()
  ; basic/monitor.e16.ts:182  poke16(D_FORMAT, F_ILLEGAL)
  sw zero, 134(zero)
  j .L5
.L2:
  ; basic/monitor.e16.ts:419  decoded(sysName(imm14), F_NONE, 0, 0)
  mv a0, s2
  call sysName
  li a1, 11
  li a2, 0
  li a3, 0
  call decoded
  j .L5
.L1:
  ; basic/monitor.e16.ts:420  if (imm14 > 0xfff) {
  li t0, 4095
  bgeu t0, s2, .L6
  ; basic/monitor.e16.ts:421  illegal()
  ; basic/monitor.e16.ts:182  poke16(D_FORMAT, F_ILLEGAL)
  sw zero, 134(zero)
  j .L7
.L6:
  ; basic/monitor.e16.ts:423  decoded(csrName(f3), f3 >= 5 ? F_CSRI : F_CSR, rd, rs1)
  mv a0, s1
  call csrName
  mv t0, a0
  mv t1, s1
  li t2, 5
  bltu t1, t2, .L8
  li t1, 10
  j .L9
.L8:
  li t1, 9
.L9:
  mv a0, t0
  mv a1, t1
  mv a2, s3
  lw a3, 0(fp)
  call decoded
  ; basic/monitor.e16.ts:424  setImm(i16(imm14))
  sw s2, 2(fp) ; setImm.v
  ; basic/monitor.e16.ts:186  poke16(D_IMM, u16(v))
  lw t0, 2(fp) ; setImm.v
  sw t0, 142(zero)
.L7:
.L5:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/monitor.e16.ts:429 upperForm(major, rd, lo, hi) at -O1
;   major in s1
;   rd in s2
;   lo in 2(fp)
;   hi in s3
;   field in 0(fp)
;   setImm.v in 4(fp)
;   setImm.v in 6(fp)
upperForm:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s1, a0 ; major
  mv s2, a1 ; rd
  sw a2, 2(fp) ; lo
  mv s3, a3 ; hi
  ; basic/monitor.e16.ts:430  const field = wrap16((lo >> 11) | (hi << 5))
  lw t0, 2(fp) ; lo
  srli t0, t0, 11
  slli t1, s3, 5
  or t0, t0, t1
  sw t0, 0(fp) ; field
  ; basic/monitor.e16.ts:431  if (hi >> 11 !== 0) {
  srli t0, s3, 11
  beq t0, zero, .L1
  ; basic/monitor.e16.ts:432  illegal()
  ; basic/monitor.e16.ts:182  poke16(D_FORMAT, F_ILLEGAL)
  sw zero, 134(zero)
  j .L2
.L1:
  ; basic/monitor.e16.ts:433  if (major === 5) {
  li t0, 5
  bne s1, t0, .L3
  ; basic/monitor.e16.ts:434  decoded(str('jal'), F_J, rd, 0)
  la a0, str_121
  li a1, 7
  mv a2, s2
  li a3, 0
  call decoded
  ; basic/monitor.e16.ts:435  setImm(i16(wrap16(field << 1)))
  lw t0, 0(fp) ; field
  slli t0, t0, 1
  sw t0, 4(fp) ; setImm.v
  ; basic/monitor.e16.ts:186  poke16(D_IMM, u16(v))
  lw t0, 4(fp) ; setImm.v
  sw t0, 142(zero)
  j .L4
.L3:
  ; basic/monitor.e16.ts:437  decoded(major === 7 ? str('li') : str('auipc'), F_U, rd, 0)
  li t0, 7
  bne s1, t0, .L5
  la t0, str_122
  j .L6
.L5:
  la t0, str_123
.L6:
  mv a0, t0
  li a1, 8
  mv a2, s2
  li a3, 0
  call decoded
  ; basic/monitor.e16.ts:438  setImm(i16(field))
  lw t0, 0(fp) ; field
  sw t0, 6(fp) ; setImm.v
  ; basic/monitor.e16.ts:186  poke16(D_IMM, u16(v))
  lw t0, 6(fp) ; setImm.v
  sw t0, 142(zero)
.L4:
.L2:
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; basic/monitor.e16.ts:443 registers(f10, f3, rd, rs1) at -O1
;   f10 in s2
;   f3 in 2(fp)
;   rd in s3
;   rs1 in 0(fp)
;   amount/key in s1
;   setImm.v in 4(fp)
registers:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; f10
  sw a1, 2(fp) ; f3
  mv s3, a2 ; rd
  sw a3, 0(fp) ; rs1
  ; basic/monitor.e16.ts:444  if (f10 >= 16) {
  li t0, 16
  bltu s2, t0, .L1
  ; basic/monitor.e16.ts:445  const amount = f10 & 15
  andi s1, s2, 15
  ; basic/monitor.e16.ts:446  decoded(f10 >> 4 === 1 && f3 === 0 && amount !== 0 ? str('mulq') : 0, F_RQ, rd, rs1)
  srli t0, s2, 4
  li t1, 1
  bne t0, t1, .L2
  lw t0, 2(fp) ; f3
  bne t0, zero, .L2
  beq s1, zero, .L2
  la t0, str_124
  j .L3
.L2:
  li t0, 0
.L3:
  mv a0, t0
  li a1, 19
  mv a2, s3
  lw a3, 0(fp)
  call decoded
  ; basic/monitor.e16.ts:447  setImm(i16(amount))
  sw s1, 4(fp) ; setImm.v
  ; basic/monitor.e16.ts:186  poke16(D_IMM, u16(v))
  lw t0, 4(fp) ; setImm.v
  sw t0, 142(zero)
  ; basic/monitor.e16.ts:448  return
  j .return
.L1:
  ; basic/monitor.e16.ts:450  const key = (f10 << 3) | f3
  slli t0, s2, 3
  lw t1, 2(fp) ; f3
  or s1, t0, t1
  ; basic/monitor.e16.ts:451  decoded(blockRegisters(key, rd, rs1, peek16(D_RS2)) ? rName(key) : 0, F_R, rd, rs1)
  lw t0, 140(zero)
  mv a0, s1
  mv a1, s3
  lw a2, 0(fp)
  mv a3, t0
  call blockRegisters
  beqz a0, .L4
  mv a0, s1
  call rName
  mv t0, a0
  j .L5
.L4:
  li t0, 0
.L5:
  mv a0, t0
  li a1, 1
  mv a2, s3
  lw a3, 0(fp)
  call decoded
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; basic/monitor.e16.ts:454 decode32(lo, hi) at -O1
;   lo in 2(fp)
;   hi in 4(fp)
;   major in s1
;   rd in s2
;   f3 in s3
;   rs1 in 0(fp)
;   f10 in 6(fp)
;   imm14 in 8(fp)
;   setRs2.r in 10(fp)
;   setImm.v in 12(fp)
;   setImm.v in 14(fp)
;   setImm.v in 16(fp)
decode32:
  addi sp, sp, -28
  sw ra, 18(sp)
  sw s1, 20(sp)
  sw s2, 22(sp)
  sw s3, 24(sp)
  sw s0, 26(sp)
  mv fp, sp
  sw a0, 2(fp) ; lo
  sw a1, 4(fp) ; hi
  ; basic/monitor.e16.ts:455  poke16(D_SIZE, 4)
  li t0, 4
  sw t0, 144(zero)
  ; basic/monitor.e16.ts:456  const major = (lo >> 2) & 31
  lw t0, 2(fp) ; lo
  srli t0, t0, 2
  andi s1, t0, 31
  ; basic/monitor.e16.ts:457  const rd = (lo >> 7) & 15
  lw t0, 2(fp) ; lo
  srli t0, t0, 7
  andi s2, t0, 15
  ; basic/monitor.e16.ts:458  const f3 = (lo >> 11) & 7
  lw t0, 2(fp) ; lo
  srli t0, t0, 11
  andi s3, t0, 7
  ; basic/monitor.e16.ts:459  const rs1 = ((lo >> 14) | (hi << 2)) & 15
  lw t0, 2(fp) ; lo
  srli t0, t0, 14
  lw t1, 4(fp) ; hi
  slli t1, t1, 2
  or t0, t0, t1
  andi t0, t0, 15
  sw t0, 0(fp) ; rs1
  ; basic/monitor.e16.ts:460  const f10 = (hi >> 6) & 0x3ff
  lw t0, 4(fp) ; hi
  srli t0, t0, 6
  andi t0, t0, 1023
  sw t0, 6(fp) ; f10
  ; basic/monitor.e16.ts:461  const imm14 = (hi >> 2) & 0x3fff
  lw t0, 4(fp) ; hi
  srli t0, t0, 2
  li t1, 16383
  and t0, t0, t1
  sw t0, 8(fp) ; imm14
  ; basic/monitor.e16.ts:462  setRs2((hi >> 2) & 15)
  lw t0, 4(fp) ; hi
  srli t0, t0, 2
  andi t0, t0, 15
  sw t0, 10(fp) ; setRs2.r
  ; basic/monitor.e16.ts:190  poke16(D_RS2, r)
  lw t0, 10(fp) ; setRs2.r
  sw t0, 140(zero)
  ; basic/monitor.e16.ts:463  if (major === 3) {
  li t0, 3
  bne s1, t0, .L1
  ; basic/monitor.e16.ts:464  registers(f10, f3, rd, rs1)
  lw a0, 6(fp)
  mv a1, s3
  mv a2, s2
  lw a3, 0(fp)
  call registers
  j .L2
.L1:
  ; basic/monitor.e16.ts:465  if (major === 2) {
  li t0, 2
  bne s1, t0, .L3
  ; basic/monitor.e16.ts:466  opImm(f3, rd, rs1, imm14)
  mv a0, s3
  mv a1, s2
  lw a2, 0(fp)
  lw a3, 8(fp)
  call opImm
  j .L4
.L3:
  ; basic/monitor.e16.ts:467  if (major === 0 || major === 6) {
  beq s1, zero, .L6
  li t0, 6
  bne s1, t0, .L5
.L6:
  ; basic/monitor.e16.ts:468  decoded(loadOrJalr(major, f3), F_MEM, rd, rs1)
  mv a0, s1
  mv a1, s3
  call loadOrJalr
  li a1, 3
  mv a2, s2
  lw a3, 0(fp)
  call decoded
  ; basic/monitor.e16.ts:469  setImm(i16(wrap16(imm14 << 2)) >> 2)
  lw t0, 8(fp) ; imm14
  slli t0, t0, 2
  srai t0, t0, 2
  sw t0, 12(fp) ; setImm.v
  ; basic/monitor.e16.ts:186  poke16(D_IMM, u16(v))
  lw t0, 12(fp) ; setImm.v
  sw t0, 142(zero)
  j .L7
.L5:
  ; basic/monitor.e16.ts:470  if (major === 1) {
  li t0, 1
  bne s1, t0, .L8
  ; basic/monitor.e16.ts:471  decoded(f3 === 0 ? str('sb') : f3 === 1 ? str('sw') : 0, F_S, 0, rs1)
  bne s3, zero, .L9
  la t0, str_125
  j .L10
.L9:
  li t0, 1
  bne s3, t0, .L11
  la t0, str_126
  j .L12
.L11:
  li t0, 0
.L12:
.L10:
  mv a0, t0
  li a1, 5
  li a2, 0
  lw a3, 0(fp)
  call decoded
  ; basic/monitor.e16.ts:472  setImm(i16(wrap16(((f10 << 4) | rd) << 2)) >> 2)
  lw t0, 6(fp) ; f10
  slli t0, t0, 4
  or t0, t0, s2
  slli t0, t0, 2
  srai t0, t0, 2
  sw t0, 14(fp) ; setImm.v
  ; basic/monitor.e16.ts:186  poke16(D_IMM, u16(v))
  lw t0, 14(fp) ; setImm.v
  sw t0, 142(zero)
  j .L13
.L8:
  ; basic/monitor.e16.ts:473  if (major === 4) {
  li t0, 4
  bne s1, t0, .L14
  ; basic/monitor.e16.ts:474  decoded(branchName(f3), F_B, 0, rs1)
  mv a0, s3
  call branchName
  li a1, 6
  li a2, 0
  lw a3, 0(fp)
  call decoded
  ; basic/monitor.e16.ts:475  setImm(i16(wrap16(((f10 << 5) | (rd << 1)) << 1)) >> 1)
  lw t0, 6(fp) ; f10
  slli t0, t0, 5
  slli t1, s2, 1
  or t0, t0, t1
  slli t0, t0, 1
  srai t0, t0, 1
  sw t0, 16(fp) ; setImm.v
  ; basic/monitor.e16.ts:186  poke16(D_IMM, u16(v))
  lw t0, 16(fp) ; setImm.v
  sw t0, 142(zero)
  j .L15
.L14:
  ; basic/monitor.e16.ts:476  if (major === 5 || major === 7 || major === 8) {
  li t0, 5
  beq s1, t0, .L17
  li t0, 7
  beq s1, t0, .L17
  li t0, 8
  bne s1, t0, .L16
.L17:
  ; basic/monitor.e16.ts:477  upperForm(major, rd, lo, hi)
  mv a0, s1
  mv a1, s2
  lw a2, 2(fp)
  lw a3, 4(fp)
  call upperForm
  j .L18
.L16:
  ; basic/monitor.e16.ts:478  if (major === 9) {
  li t0, 9
  bne s1, t0, .L19
  ; basic/monitor.e16.ts:479  system(f3, rd, rs1, imm14)
  mv a0, s3
  mv a1, s2
  lw a2, 0(fp)
  lw a3, 8(fp)
  call system
  j .L20
.L19:
  ; basic/monitor.e16.ts:481  illegal()
  ; basic/monitor.e16.ts:182  poke16(D_FORMAT, F_ILLEGAL)
  sw zero, 134(zero)
.L20:
.L18:
.L15:
.L13:
.L7:
.L4:
.L2:
.return:
  mv sp, fp
  lw ra, 18(sp)
  lw s1, 20(sp)
  lw s2, 22(sp)
  lw s3, 24(sp)
  lw s0, 26(sp)
  addi sp, sp, 28
  ret

; basic/monitor.e16.ts:488 quadrant0(h) at -O1
;   h in s1
;   f3 in s3
;   r9 in 0(fp)
;   reg/off7 in s2
;   setImm.v in 2(fp)
;   setRs2.r in 4(fp)
;   setImm.v in 6(fp)
;   setRs2.r in 8(fp)
quadrant0:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s1, 12(sp)
  sw s3, 14(sp)
  sw s2, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  mv s1, a0 ; h
  ; basic/monitor.e16.ts:489  const f3 = h >> 13
  srli s3, s1, 13
  ; basic/monitor.e16.ts:490  const r9 = (h >> 9) & 15
  srli t0, s1, 9
  andi t0, t0, 15
  sw t0, 0(fp) ; r9
  ; basic/monitor.e16.ts:491  if (f3 <= 1) {
  li t0, 1
  bltu t0, s3, .L1
  ; basic/monitor.e16.ts:492  const reg = (h >> 7) & 15
  srli t0, s1, 7
  andi s2, t0, 15
  ; basic/monitor.e16.ts:493  setImm(i16(((((h >> 11) & 3) << 1) | ((h >> 2) & 1)) << 1))
  srli t0, s1, 11
  andi t0, t0, 3
  slli t0, t0, 1
  srli t1, s1, 2
  andi t1, t1, 1
  or t0, t0, t1
  slli t0, t0, 1
  sw t0, 2(fp) ; setImm.v
  ; basic/monitor.e16.ts:186  poke16(D_IMM, u16(v))
  lw t0, 2(fp) ; setImm.v
  sw t0, 142(zero)
  ; basic/monitor.e16.ts:494  if (f3 === 1) {
  li t0, 1
  bne s3, t0, .L2
  ; basic/monitor.e16.ts:495  decoded(str('c.sw'), F_S, 0, (h >> 3) & 15)
  srli t0, s1, 3
  andi t0, t0, 15
  la a0, str_127
  li a1, 5
  li a2, 0
  mv a3, t0
  call decoded
  ; basic/monitor.e16.ts:496  setRs2(reg)
  sw s2, 4(fp) ; setRs2.r
  ; basic/monitor.e16.ts:190  poke16(D_RS2, r)
  lw t0, 4(fp) ; setRs2.r
  sw t0, 140(zero)
  j .L3
.L2:
  ; basic/monitor.e16.ts:498  decoded(reg === 0 ? 0 : str('c.lw'), F_MEM, reg, (h >> 3) & 15)
  bne s2, zero, .L4
  li t0, 0
  j .L5
.L4:
  la t0, str_128
.L5:
  srli t1, s1, 3
  andi t1, t1, 15
  mv a0, t0
  li a1, 3
  mv a2, s2
  mv a3, t1
  call decoded
.L3:
  ; basic/monitor.e16.ts:500  return
  j .return
.L1:
  ; basic/monitor.e16.ts:502  const off7 = ((h >> 2) & 0x7f) << 1
  srli t0, s1, 2
  andi t0, t0, 127
  slli s2, t0, 1
  ; basic/monitor.e16.ts:503  setImm(i16(off7))
  sw s2, 6(fp) ; setImm.v
  ; basic/monitor.e16.ts:186  poke16(D_IMM, u16(v))
  lw t0, 6(fp) ; setImm.v
  sw t0, 142(zero)
  ; basic/monitor.e16.ts:504  if (f3 === 2) {
  li t0, 2
  bne s3, t0, .L6
  ; basic/monitor.e16.ts:505  decoded(r9 === 0 ? 0 : str('c.lwsp'), F_C_LWSP, r9, 2)
  lw t0, 0(fp) ; r9
  bne t0, zero, .L7
  li t0, 0
  j .L8
.L7:
  la t0, str_129
.L8:
  mv a0, t0
  li a1, 14
  lw a2, 0(fp)
  li a3, 2
  call decoded
  j .L9
.L6:
  ; basic/monitor.e16.ts:506  if (f3 === 3) {
  li t0, 3
  bne s3, t0, .L10
  ; basic/monitor.e16.ts:507  decoded(str('c.swsp'), F_C_SWSP, 0, 2)
  la a0, str_130
  li a1, 15
  li a2, 0
  li a3, 2
  call decoded
  ; basic/monitor.e16.ts:508  setRs2(r9)
  lw t0, 0(fp) ; r9
  sw t0, 8(fp) ; setRs2.r
  ; basic/monitor.e16.ts:190  poke16(D_RS2, r)
  lw t0, 8(fp) ; setRs2.r
  sw t0, 140(zero)
  j .L11
.L10:
  ; basic/monitor.e16.ts:509  if (f3 === 4 && off7 !== 0 && r9 !== 0) {
  li t0, 4
  bne s3, t0, .L12
  beq s2, zero, .L12
  lw t0, 0(fp) ; r9
  beq t0, zero, .L12
  ; basic/monitor.e16.ts:510  decoded(str('c.addi2spn'), F_C_RI, r9, 2)
  la a0, str_131
  li a1, 12
  lw a2, 0(fp)
  li a3, 2
  call decoded
  j .L13
.L12:
  ; basic/monitor.e16.ts:512  illegal()
  ; basic/monitor.e16.ts:182  poke16(D_FORMAT, F_ILLEGAL)
  sw zero, 134(zero)
.L13:
.L11:
.L9:
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s1, 12(sp)
  lw s3, 14(sp)
  lw s2, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; basic/monitor.e16.ts:517 shiftC(name, r, amount) at -O1
;   name in s3
;   r in s1
;   amount in s2
;   setImm.v in s0
shiftC:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  mv s3, a0 ; name
  mv s1, a1 ; r
  mv s2, a2 ; amount
  ; basic/monitor.e16.ts:518  if (amount > 15 || amount === 0 || r === 0) {
  li t0, 15
  bltu t0, s2, .L2
  beq s2, zero, .L2
  bne s1, zero, .L1
.L2:
  ; basic/monitor.e16.ts:519  illegal()
  ; basic/monitor.e16.ts:182  poke16(D_FORMAT, F_ILLEGAL)
  sw zero, 134(zero)
  j .L3
.L1:
  ; basic/monitor.e16.ts:521  decoded(name, F_C_RI, r, r)
  mv a0, s3
  li a1, 12
  mv a2, s1
  mv a3, s1
  call decoded
  ; basic/monitor.e16.ts:522  setImm(i16(amount))
  mv s0, s2 ; setImm.v
  ; basic/monitor.e16.ts:186  poke16(D_IMM, u16(v))
  sw s0, 142(zero)
.L3:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; basic/monitor.e16.ts:527 quadrant1(h) at -O1
;   h in s3
;   f3 in 4(fp)
;   r in s1
;   raw6 in 0(fp)
;   imm6 in 2(fp)
;   switch1 in s2
;   setImm.v in 6(fp)
quadrant1:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s2, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s3, a0 ; h
  ; basic/monitor.e16.ts:528  const f3 = h >> 13
  srli t0, s3, 13
  sw t0, 4(fp) ; f3
  ; basic/monitor.e16.ts:529  const r = (h >> 9) & 15
  srli t0, s3, 9
  andi s1, t0, 15
  ; basic/monitor.e16.ts:530  const raw6 = (h >> 3) & 63
  srli t0, s3, 3
  andi t0, t0, 63
  sw t0, 0(fp) ; raw6
  ; basic/monitor.e16.ts:531  const imm6 = i16(wrap16(raw6 << 10)) >> 10
  lw t0, 0(fp) ; raw6
  slli t0, t0, 10
  srai t0, t0, 10
  sw t0, 2(fp) ; imm6
  ; basic/monitor.e16.ts:532  setImm(imm6)
  lw t0, 2(fp) ; imm6
  sw t0, 6(fp) ; setImm.v
  ; basic/monitor.e16.ts:186  poke16(D_IMM, u16(v))
  lw t0, 6(fp) ; setImm.v
  sw t0, 142(zero)
  ; basic/monitor.e16.ts:533  switch ((f3 << 1) | ((h >> 2) & 1)) {
  lw t0, 4(fp) ; f3
  slli t0, t0, 1
  srli t1, s3, 2
  andi t1, t1, 1
  or s2, t0, t1
  beq s2, zero, .L2
  li t0, 1
  beq s2, t0, .L3
  li t0, 2
  beq s2, t0, .L4
  li t0, 3
  beq s2, t0, .L5
  li t0, 4
  beq s2, t0, .L6
  li t0, 5
  beq s2, t0, .L7
  j .L8
.L2:
  ; basic/monitor.e16.ts:535  if (r === 0) decoded(imm6 === 0 ? str('c.nop') : 0, F_NONE, 0, 0)
  bne s1, zero, .L9
  ; basic/monitor.e16.ts:535  decoded(imm6 === 0 ? str('c.nop') : 0, F_NONE, 0, 0)
  lw t0, 2(fp) ; imm6
  bne t0, zero, .L10
  la t0, str_132
  j .L11
.L10:
  li t0, 0
.L11:
  mv a0, t0
  li a1, 11
  li a2, 0
  li a3, 0
  call decoded
  j .L1
.L9:
  ; basic/monitor.e16.ts:536  decoded(imm6 === 0 ? 0 : str('c.addi'), F_C_RI, r, r)
  lw t0, 2(fp) ; imm6
  bne t0, zero, .L13
  li t0, 0
  j .L14
.L13:
  la t0, str_133
.L14:
  mv a0, t0
  li a1, 12
  mv a2, s1
  mv a3, s1
  call decoded
  ; basic/monitor.e16.ts:537  break
  j .L1
.L3:
  ; basic/monitor.e16.ts:539  decoded(r === 0 ? 0 : str('c.li'), F_C_RI, r, 0)
  bne s1, zero, .L15
  li t0, 0
  j .L16
.L15:
  la t0, str_134
.L16:
  mv a0, t0
  li a1, 12
  mv a2, s1
  li a3, 0
  call decoded
  ; basic/monitor.e16.ts:540  break
  j .L1
.L4:
  ; basic/monitor.e16.ts:542  shiftC(str('c.slli'), r, raw6)
  la a0, str_135
  mv a1, s1
  lw a2, 0(fp)
  call shiftC
  ; basic/monitor.e16.ts:543  break
  j .L1
.L5:
  ; basic/monitor.e16.ts:545  shiftC(str('c.srli'), r, raw6)
  la a0, str_136
  mv a1, s1
  lw a2, 0(fp)
  call shiftC
  ; basic/monitor.e16.ts:546  break
  j .L1
.L6:
  ; basic/monitor.e16.ts:548  shiftC(str('c.srai'), r, raw6)
  la a0, str_137
  mv a1, s1
  lw a2, 0(fp)
  call shiftC
  ; basic/monitor.e16.ts:549  break
  j .L1
.L7:
  ; basic/monitor.e16.ts:552  decoded(r === 0 || imm6 === -1 ? 0 : str('c.andi'), F_C_RI, r, r)
  beq s1, zero, .L19
  li t0, 65535
  lw t1, 2(fp) ; imm6
  bne t1, t0, .L17
.L19:
  li t0, 0
  j .L18
.L17:
  la t0, str_138
.L18:
  mv a0, t0
  li a1, 12
  mv a2, s1
  mv a3, s1
  call decoded
  ; basic/monitor.e16.ts:553  break
  j .L1
.L8:
  ; basic/monitor.e16.ts:555  jumpsC(h, f3, r)
  mv a0, s3
  lw a1, 4(fp)
  mv a2, s1
  call jumpsC
.L1:
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s2, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; basic/monitor.e16.ts:559 jumpsC(h, f3, r) at -O1
;   h in s2
;   f3 in s1
;   r in s3
;   setImm.v in 0(fp)
;   setImm.v in 2(fp)
jumpsC:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; h
  mv s1, a1 ; f3
  mv s3, a2 ; r
  ; basic/monitor.e16.ts:560  if (f3 === 3 || f3 === 4) {
  li t0, 3
  beq s1, t0, .L2
  li t0, 4
  bne s1, t0, .L1
.L2:
  ; basic/monitor.e16.ts:561  decoded(f3 === 3 ? str('c.beqz') : str('c.bnez'), F_C_B, 0, r)
  li t0, 3
  bne s1, t0, .L3
  la t0, str_139
  j .L4
.L3:
  la t0, str_140
.L4:
  mv a0, t0
  li a1, 16
  li a2, 0
  mv a3, s3
  call decoded
  ; basic/monitor.e16.ts:562  setImm(i16(wrap16(((h >> 2) & 0x7f) << 9)) >> 8)
  srli t0, s2, 2
  andi t0, t0, 127
  slli t0, t0, 9
  srai t0, t0, 8
  sw t0, 0(fp) ; setImm.v
  ; basic/monitor.e16.ts:186  poke16(D_IMM, u16(v))
  lw t0, 0(fp) ; setImm.v
  sw t0, 142(zero)
  j .L5
.L1:
  ; basic/monitor.e16.ts:563  if (f3 === 5 || f3 === 6) {
  li t0, 5
  beq s1, t0, .L7
  li t0, 6
  bne s1, t0, .L6
.L7:
  ; basic/monitor.e16.ts:564  decoded(f3 === 5 ? str('c.j') : str('c.jal'), F_C_J, 0, 0)
  li t0, 5
  bne s1, t0, .L8
  la t0, str_141
  j .L9
.L8:
  la t0, str_142
.L9:
  mv a0, t0
  li a1, 17
  li a2, 0
  li a3, 0
  call decoded
  ; basic/monitor.e16.ts:565  setImm(i16(wrap16(((h >> 2) & 0x7ff) << 5)) >> 4)
  srli t0, s2, 2
  andi t0, t0, 2047
  slli t0, t0, 5
  srai t0, t0, 4
  sw t0, 2(fp) ; setImm.v
  ; basic/monitor.e16.ts:186  poke16(D_IMM, u16(v))
  lw t0, 2(fp) ; setImm.v
  sw t0, 142(zero)
  j .L10
.L6:
  ; basic/monitor.e16.ts:567  illegal()
  ; basic/monitor.e16.ts:182  poke16(D_FORMAT, F_ILLEGAL)
  sw zero, 134(zero)
.L10:
.L5:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/monitor.e16.ts:571 pairName(form) at -O1
;   form in a0
pairName:
  ; basic/monitor.e16.ts:572  switch (form) {
  beq a0, zero, .L2
  li t0, 1
  beq a0, t0, .L3
  li t0, 2
  beq a0, t0, .L4
  li t0, 3
  beq a0, t0, .L5
  li t0, 4
  beq a0, t0, .L6
  j .L7
.L2:
  ; basic/monitor.e16.ts:574  return str('c.mv')
  la a0, str_143
  ret
.L3:
  ; basic/monitor.e16.ts:576  return str('c.add')
  la a0, str_144
  ret
.L4:
  ; basic/monitor.e16.ts:578  return str('c.sub')
  la a0, str_145
  ret
.L5:
  ; basic/monitor.e16.ts:580  return str('c.xor')
  la a0, str_146
  ret
.L6:
  ; basic/monitor.e16.ts:582  return str('c.and')
  la a0, str_147
  ret
.L7:
  ; basic/monitor.e16.ts:584  return str('c.or')
  la a0, str_148
.return:
  ret

; basic/monitor.e16.ts:589 quadrant2(h) at -O1
;   h in s3
;   rd in s1
;   rs2 in 0(fp)
;   form in s2
;   ok in 2(fp)
;   setRs2.r in 4(fp)
quadrant2:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s3, a0 ; h
  ; basic/monitor.e16.ts:590  const rd = (h >> 8) & 15
  srli t0, s3, 8
  andi s1, t0, 15
  ; basic/monitor.e16.ts:591  const rs2 = (h >> 4) & 15
  srli t0, s3, 4
  andi t0, t0, 15
  sw t0, 0(fp) ; rs2
  ; basic/monitor.e16.ts:592  const form = ((h >> 12) << 2) | ((h >> 2) & 3)
  srli t0, s3, 12
  slli t0, t0, 2
  srli t1, s3, 2
  andi t1, t1, 3
  or s2, t0, t1
  ; basic/monitor.e16.ts:593  setRs2(rs2)
  lw t0, 0(fp) ; rs2
  sw t0, 4(fp) ; setRs2.r
  ; basic/monitor.e16.ts:190  poke16(D_RS2, r)
  lw t0, 4(fp) ; setRs2.r
  sw t0, 140(zero)
  ; basic/monitor.e16.ts:594  if (form === 8 || form === 9) {
  li t0, 8
  beq s2, t0, .L2
  li t0, 9
  bne s2, t0, .L1
.L2:
  ; basic/monitor.e16.ts:595  const ok = rd !== 0 && rs2 === 0
  sub t0, s1, zero
  snez t0, t0
  mv t1, t0
  beqz t1, .L3
  lw t0, 0(fp) ; rs2
  sub t0, t0, zero
  seqz t0, t0
.L3:
  sw t0, 2(fp) ; ok
  ; basic/monitor.e16.ts:596  decoded(!ok ? 0 : form === 8 ? str('c.jr') : str('c.jalr'), F_C_R, 0, rd)
  lw t0, 2(fp) ; ok
  bnez t0, .L4
  li t0, 0
  j .L5
.L4:
  li t0, 8
  bne s2, t0, .L6
  la t0, str_149
  j .L7
.L6:
  la t0, str_150
.L7:
.L5:
  mv a0, t0
  li a1, 18
  li a2, 0
  mv a3, s1
  call decoded
  j .L8
.L1:
  ; basic/monitor.e16.ts:597  if (form === 10) {
  li t0, 10
  bne s2, t0, .L9
  ; basic/monitor.e16.ts:598  decoded(rd !== 0 || rs2 !== 0 ? 0 : str('c.ebreak'), F_NONE, 0, 0)
  bne s1, zero, .L12
  lw t0, 0(fp) ; rs2
  beq t0, zero, .L10
.L12:
  li t0, 0
  j .L11
.L10:
  la t0, str_151
.L11:
  mv a0, t0
  li a1, 11
  li a2, 0
  li a3, 0
  call decoded
  j .L13
.L9:
  ; basic/monitor.e16.ts:600  decoded(pairChanges(form, rd, rs2) ? pairName(form) : 0, F_C_RR, rd, rd)
  mv a0, s2
  mv a1, s1
  lw a2, 0(fp)
  call pairChanges
  beqz a0, .L14
  mv a0, s2
  call pairName
  mv t0, a0
  j .L15
.L14:
  li t0, 0
.L15:
  mv a0, t0
  li a1, 13
  mv a2, s1
  mv a3, s1
  call decoded
.L13:
.L8:
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; basic/monitor.e16.ts:608 pairChanges(form, rd, rs2) at -O1
;   form in a0
;   rd in a1
;   rs2 in a2
pairChanges:
  ; basic/monitor.e16.ts:609  if (form > 5 || rd === 0) return false
  li t0, 5
  bltu t0, a0, .L2
  bne a1, zero, .L1
.L2:
  ; basic/monitor.e16.ts:609  return false
  li a0, 0
  ret
.L1:
  ; basic/monitor.e16.ts:610  if (form === 0) return rd !== rs2
  bne a0, zero, .L3
  ; basic/monitor.e16.ts:610  return rd !== rs2
  sub t0, a1, a2
  snez a0, t0
  ret
.L3:
  ; basic/monitor.e16.ts:611  return form === 4 || rs2 !== 0
  li t0, 4
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L4
  sub t0, a2, zero
  snez t0, t0
.L4:
  mv a0, t0
.return:
  ret

; basic/monitor.e16.ts:614 decode16(h) at -O1
;   h in s1
;   q in s2
decode16:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; h
  ; basic/monitor.e16.ts:615  poke16(D_SIZE, 2)
  li t0, 2
  sw t0, 144(zero)
  ; basic/monitor.e16.ts:616  const q = h & 3
  andi s2, s1, 3
  ; basic/monitor.e16.ts:617  if (q === 0) quadrant0(h)
  bne s2, zero, .L1
  ; basic/monitor.e16.ts:617  quadrant0(h)
  mv a0, s1
  call quadrant0
  j .L2
.L1:
  ; basic/monitor.e16.ts:618  if (q === 1) quadrant1(h)
  li t0, 1
  bne s2, t0, .L3
  ; basic/monitor.e16.ts:618  quadrant1(h)
  mv a0, s1
  call quadrant1
  j .L4
.L3:
  ; basic/monitor.e16.ts:619  quadrant2(h)
  mv a0, s1
  call quadrant2
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/monitor.e16.ts:625 emitOffset() at -O1
emitOffset:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/monitor.e16.ts:626  emitNumber(imm())
  call imm
  call emitNumber
  ; basic/monitor.e16.ts:627  emit(0x28)
  li a0, 40
  call emit
  ; basic/monitor.e16.ts:628  emitReg(peek16(D_RS1))
  lw a0, 138(zero)
  call emitReg
  ; basic/monitor.e16.ts:629  emit(0x29)
  li a0, 41
  call emit
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/monitor.e16.ts:633 emitFirst(format, target) at -O1
;   format in s1
;   target in s2
emitFirst:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; format
  mv s2, a1 ; target
  ; basic/monitor.e16.ts:634  if (format === F_S || format === F_C_SWSP) emitReg(peek16(D_RS2))
  li t0, 5
  beq s1, t0, .L2
  li t0, 15
  bne s1, t0, .L1
.L2:
  ; basic/monitor.e16.ts:634  emitReg(peek16(D_RS2))
  lw a0, 140(zero)
  call emitReg
  j .L3
.L1:
  ; basic/monitor.e16.ts:635  if (format === F_B || format === F_C_B || format === F_C_R) emitReg(peek16(D_RS1))
  li t0, 6
  beq s1, t0, .L5
  li t0, 16
  beq s1, t0, .L5
  li t0, 18
  bne s1, t0, .L4
.L5:
  ; basic/monitor.e16.ts:635  emitReg(peek16(D_RS1))
  lw a0, 138(zero)
  call emitReg
  j .L6
.L4:
  ; basic/monitor.e16.ts:636  if (format === F_C_J) emitHex(target)
  li t0, 17
  bne s1, t0, .L7
  ; basic/monitor.e16.ts:636  emitHex(target)
  mv a0, s2
  call emitHex
  j .L8
.L7:
  ; basic/monitor.e16.ts:637  emitReg(peek16(D_RD))
  lw a0, 136(zero)
  call emitReg
.L8:
.L6:
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/monitor.e16.ts:641 emitRest(format, target) at -O1
;   format in s1
;   target in s2
emitRest:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; format
  mv s2, a1 ; target
  ; basic/monitor.e16.ts:642  switch (format) {
  li t0, 1
  beq s1, t0, .L2
  li t0, 19
  beq s1, t0, .L3
  li t0, 2
  beq s1, t0, .L4
  li t0, 3
  beq s1, t0, .L5
  li t0, 5
  beq s1, t0, .L6
  li t0, 4
  beq s1, t0, .L7
  li t0, 6
  beq s1, t0, .L8
  li t0, 7
  beq s1, t0, .L9
  li t0, 16
  beq s1, t0, .L10
  li t0, 8
  beq s1, t0, .L11
  li t0, 13
  beq s1, t0, .L12
  j .L13
.L2:
.L3:
  ; basic/monitor.e16.ts:645  emitReg(peek16(D_RS1))
  lw a0, 138(zero)
  call emitReg
  ; basic/monitor.e16.ts:646  comma()
  call comma
  ; basic/monitor.e16.ts:647  emitReg(peek16(D_RS2))
  lw a0, 140(zero)
  call emitReg
  ; basic/monitor.e16.ts:648  if (format === F_RQ) {
  li t0, 19
  bne s1, t0, .L1
  ; basic/monitor.e16.ts:649  comma()
  call comma
  ; basic/monitor.e16.ts:650  emitNumber(imm())
  call imm
  call emitNumber
  ; basic/monitor.e16.ts:652  break
  j .L1
.L4:
  ; basic/monitor.e16.ts:654  emitReg(peek16(D_RS1))
  lw a0, 138(zero)
  call emitReg
  ; basic/monitor.e16.ts:655  comma()
  call comma
  ; basic/monitor.e16.ts:656  emitNumber(imm())
  call imm
  call emitNumber
  ; basic/monitor.e16.ts:657  break
  j .L1
.L5:
.L6:
  ; basic/monitor.e16.ts:660  emitOffset()
  call emitOffset
  ; basic/monitor.e16.ts:661  break
  j .L1
.L7:
  ; basic/monitor.e16.ts:663  emitReg(peek16(D_RS1))
  lw a0, 138(zero)
  call emitReg
  ; basic/monitor.e16.ts:664  break
  j .L1
.L8:
  ; basic/monitor.e16.ts:666  emitReg(peek16(D_RS2))
  lw a0, 140(zero)
  call emitReg
  ; basic/monitor.e16.ts:667  comma()
  call comma
  ; basic/monitor.e16.ts:668  emitHex(target)
  mv a0, s2
  call emitHex
  ; basic/monitor.e16.ts:669  break
  j .L1
.L9:
.L10:
  ; basic/monitor.e16.ts:672  emitHex(target)
  mv a0, s2
  call emitHex
  ; basic/monitor.e16.ts:673  break
  j .L1
.L11:
  ; basic/monitor.e16.ts:675  emitHex(peek16(D_IMM))
  lw a0, 142(zero)
  call emitHex
  ; basic/monitor.e16.ts:676  break
  j .L1
.L12:
  ; basic/monitor.e16.ts:678  emitReg(peek16(D_RS2))
  lw a0, 140(zero)
  call emitReg
  ; basic/monitor.e16.ts:679  break
  j .L1
.L13:
  ; basic/monitor.e16.ts:681  emitLast(format)
  mv a0, s1
  call emitLast
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/monitor.e16.ts:685 emitLast(format) at -O1
;   format in s1
emitLast:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; format
  ; basic/monitor.e16.ts:686  if (format === F_CSR || format === F_CSRI) {
  li t0, 9
  beq s1, t0, .L2
  li t0, 10
  bne s1, t0, .L1
.L2:
  ; basic/monitor.e16.ts:687  emitCsr(peek16(D_IMM))
  lw a0, 142(zero)
  call emitCsr
  ; basic/monitor.e16.ts:688  comma()
  call comma
  ; basic/monitor.e16.ts:689  if (format === F_CSR) emitReg(peek16(D_RS1))
  li t0, 9
  bne s1, t0, .L3
  ; basic/monitor.e16.ts:689  emitReg(peek16(D_RS1))
  lw a0, 138(zero)
  call emitReg
  j .L5
.L3:
  ; basic/monitor.e16.ts:690  emitUnsigned(peek16(D_RS1))
  lw a0, 138(zero)
  call emitUnsigned
  j .L5
.L1:
  ; basic/monitor.e16.ts:693  emitNumber(imm())
  call imm
  call emitNumber
.L5:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/monitor.e16.ts:701 disasmInto(at, out) at -O1
;   at in s2
;   out in 2(fp)
;   lo in s3
;   format in s1
;   target in 0(fp)
disasmInto:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; at
  sw a1, 2(fp) ; out
  ; basic/monitor.e16.ts:702  poke16(OUT_AT, out)
  lw t0, 2(fp) ; out
  sw t0, 130(zero)
  ; basic/monitor.e16.ts:703  const lo = peek(at) | (peek(at + 1) << 8)
  lbu t0, 0(s2)
  lbu t1, 1(s2)
  slli t1, t1, 8
  or s3, t0, t1
  ; basic/monitor.e16.ts:704  if ((lo & 3) === 3) decode32(lo, peek(at + 2) | (peek(at + 3) << 8))
  andi t0, s3, 3
  li t1, 3
  bne t0, t1, .L1
  ; basic/monitor.e16.ts:704  decode32(lo, peek(at + 2) | (peek(at + 3) << 8))
  lbu t0, 2(s2)
  lbu t1, 3(s2)
  slli t1, t1, 8
  or t0, t0, t1
  mv a0, s3
  mv a1, t0
  call decode32
  j .L2
.L1:
  ; basic/monitor.e16.ts:705  decode16(lo)
  mv a0, s3
  call decode16
.L2:
  ; basic/monitor.e16.ts:706  const format = peek16(D_FORMAT)
  lw s1, 134(zero)
  ; basic/monitor.e16.ts:707  if (format === F_ILLEGAL) {
  bne s1, zero, .L3
  ; basic/monitor.e16.ts:708  emitStr(peek16(D_SIZE) === 2 ? str('.word ?') : str('.word ?, ?'))
  lw t0, 144(zero)
  li t1, 2
  bne t0, t1, .L4
  la t0, str_152
  j .L5
.L4:
  la t0, str_153
.L5:
  mv a0, t0
  call emitStr
  j .L6
.L3:
  ; basic/monitor.e16.ts:710  emitStr(peek16(D_NAME))
  lw a0, 132(zero)
  call emitStr
  ; basic/monitor.e16.ts:711  if (format !== F_NONE) {
  li t0, 11
  beq s1, t0, .L7
  ; basic/monitor.e16.ts:712  const target = u16(at + peek16(D_IMM))
  lw t0, 142(zero)
  add t0, s2, t0
  sw t0, 0(fp) ; target
  ; basic/monitor.e16.ts:713  emit(0x20)
  li a0, 32
  call emit
  ; basic/monitor.e16.ts:714  emitFirst(format, target)
  mv a0, s1
  lw a1, 0(fp)
  call emitFirst
  ; basic/monitor.e16.ts:716  if (format !== F_C_J && format !== F_C_R) {
  li t0, 17
  beq s1, t0, .L8
  li t0, 18
  beq s1, t0, .L8
  ; basic/monitor.e16.ts:717  comma()
  call comma
  ; basic/monitor.e16.ts:718  emitRest(format, target)
  mv a0, s1
  lw a1, 0(fp)
  call emitRest
.L8:
.L7:
.L6:
  ; basic/monitor.e16.ts:722  emit(0)
  li a0, 0
  call emit
  ; basic/monitor.e16.ts:723  return peek16(D_SIZE)
  lw a0, 144(zero)
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/monitor.e16.ts:729 unassemble(from, given) at -O1
;   from in s3
;   given in s0
;   at in s1
;   k in s2
unassemble:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  mv s3, a0 ; from
  mv s0, a1 ; given
  ; basic/monitor.e16.ts:730  let at = given ? from : peek16(U_NEXT)
  beqz s0, .L1
  mv t0, s3
  j .L2
.L1:
  lw t0, 146(zero)
.L2:
  mv s1, t0 ; at
  ; basic/monitor.e16.ts:731  for (let k: u16 = 1; k < peek16(ROWS); k++) {
  li s2, 1 ; k
  j .L5
.L3:
  ; basic/monitor.e16.ts:732  poke16(OUT_AT, LINEBUF)
  li t0, 64
  sw t0, 130(zero)
  ; basic/monitor.e16.ts:733  emitHex4(at)
  mv a0, s1
  call emitHex4
  ; basic/monitor.e16.ts:734  emit(0x20)
  li a0, 32
  call emit
  ; basic/monitor.e16.ts:735  at = u16(at + disasmInto(at, peek16(OUT_AT)))
  lw t0, 130(zero)
  mv a0, s1
  mv a1, t0
  call disasmInto
  add s1, s1, a0
  ; basic/monitor.e16.ts:736  puts(LINEBUF)
  li a0, 64
  call puts
  ; basic/monitor.e16.ts:737  newline()
  call newline
  addi s2, s2, 1
.L5:
  lw t0, 6(zero)
  bltu s2, t0, .L3
  ; basic/monitor.e16.ts:739  poke16(U_NEXT, at)
  sw s1, 146(zero)
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; basic/monitor.e16.ts:745 breakAt(k) at -O1
;   k in a0
breakAt:
  ; basic/monitor.e16.ts:746  return peek16(BREAKS + k * 2)
  slli t0, a0, 1
  lw a0, 150(t0)
.return:
  ret

; basic/monitor.e16.ts:753 breakCommand(at, given) at -O1
;   at in s1
;   given in s2
breakCommand:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; at
  mv s2, a1 ; given
  ; basic/monitor.e16.ts:754  if (given && !toggleBreak(at)) return 1
  beqz s2, .L1
  mv a0, s1
  call toggleBreak
  bnez a0, .L1
  ; basic/monitor.e16.ts:754  return 1
  li a0, 1
  j .return
.L1:
  ; basic/monitor.e16.ts:755  listBreaks()
  call listBreaks
  ; basic/monitor.e16.ts:756  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/monitor.e16.ts:760 toggleBreak(at) at -O1
;   at in s2
;   free in s3
;   k in s1
toggleBreak:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; at
  ; basic/monitor.e16.ts:762  if (at >= 0x8000 || at < 0x0800 || (at & 1) !== 0) return false
  li t0, 32768
  bgeu s2, t0, .L2
  li t0, 2048
  bltu s2, t0, .L2
  andi t0, s2, 1
  beq t0, zero, .L1
.L2:
  ; basic/monitor.e16.ts:762  return false
  li a0, 0
  j .return
.L1:
  ; basic/monitor.e16.ts:763  let free: u16 = 4
  li s3, 4 ; free
  ; basic/monitor.e16.ts:764  for (let k: u16 = 0; k < 4; k++) {
  li s1, 0 ; k
  j .L5
.L3:
  ; basic/monitor.e16.ts:765  if (breakAt(k) === at) {
  mv a0, s1
  call breakAt
  bne a0, s2, .L7
  ; basic/monitor.e16.ts:766  poke16(BREAKS + k * 2, 0)
  slli t0, s1, 1
  sw zero, 150(t0)
  ; basic/monitor.e16.ts:767  return true
  li a0, 1
  j .return
.L7:
  ; basic/monitor.e16.ts:769  if (breakAt(k) === 0 && free === 4) free = k
  mv a0, s1
  call breakAt
  bne a0, zero, .L8
  li t0, 4
  bne s3, t0, .L8
  ; basic/monitor.e16.ts:769  free = k
  mv s3, s1 ; free
.L8:
  addi s1, s1, 1
.L5:
  li t0, 4
  bltu s1, t0, .L3
  ; basic/monitor.e16.ts:771  if (free === 4) return false
  li t0, 4
  bne s3, t0, .L9
  ; basic/monitor.e16.ts:771  return false
  li a0, 0
  j .return
.L9:
  ; basic/monitor.e16.ts:772  poke16(BREAKS + free * 2, at)
  slli t0, s3, 1
  sw s2, 150(t0)
  ; basic/monitor.e16.ts:773  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/monitor.e16.ts:776 listBreaks() at -O1
;   any in s2
;   k in s1
listBreaks:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; basic/monitor.e16.ts:777  poke16(OUT_AT, LINEBUF)
  li t0, 64
  sw t0, 130(zero)
  ; basic/monitor.e16.ts:778  let any = false
  li s2, 0 ; any
  ; basic/monitor.e16.ts:779  for (let k: u16 = 0; k < 4; k++) {
  li s1, 0 ; k
  j .L3
.L1:
  ; basic/monitor.e16.ts:780  if (breakAt(k) !== 0) {
  mv a0, s1
  call breakAt
  beq a0, zero, .L5
  ; basic/monitor.e16.ts:781  if (any) emit(0x20)
  beqz s2, .L6
  ; basic/monitor.e16.ts:781  emit(0x20)
  li a0, 32
  call emit
.L6:
  ; basic/monitor.e16.ts:782  emitHex4(breakAt(k))
  mv a0, s1
  call breakAt
  call emitHex4
  ; basic/monitor.e16.ts:783  any = true
  li s2, 1 ; any
.L5:
  addi s1, s1, 1
.L3:
  li t0, 4
  bltu s1, t0, .L1
  ; basic/monitor.e16.ts:786  if (!any) emitStr(str('NO BREAKPOINTS'))
  bnez s2, .L7
  ; basic/monitor.e16.ts:786  emitStr(str('NO BREAKPOINTS'))
  la a0, str_154
  call emitStr
.L7:
  ; basic/monitor.e16.ts:787  emit(0)
  li a0, 0
  call emit
  ; basic/monitor.e16.ts:788  puts(LINEBUF)
  li a0, 64
  call puts
  ; basic/monitor.e16.ts:789  newline()
  call newline
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/monitor.e16.ts:793 armBreaks(start) at -O1
;   start in s3
;   k in s2
;   at in s1
armBreaks:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  mv s3, a0 ; start
  ; basic/monitor.e16.ts:794  disarmBreaks()
  call disarmBreaks
  ; basic/monitor.e16.ts:795  for (let k: u16 = 0; k < 4; k++) {
  li s2, 0 ; k
  j .L3
.L1:
  ; basic/monitor.e16.ts:796  const at = breakAt(k)
  mv a0, s2
  call breakAt
  mv s1, a0 ; at
  ; basic/monitor.e16.ts:797  if (at !== 0 && at !== start) {
  beq s1, zero, .L5
  beq s1, s3, .L5
  ; basic/monitor.e16.ts:798  poke16(SAVED + k * 2, peek(at) | (peek(at + 1) << 8))
  slli t0, s2, 1
  lbu t1, 0(s1)
  lbu t2, 1(s1)
  slli t2, t2, 8
  or t1, t1, t2
  sw t1, 158(t0)
  ; basic/monitor.e16.ts:799  poke(at, C_EBREAK & 0xff)
  li t0, 10
  sb t0, 0(s1)
  ; basic/monitor.e16.ts:800  poke(at + 1, C_EBREAK >> 8)
  li t0, 32
  sb t0, 1(s1)
.L5:
  addi s2, s2, 1
.L3:
  li t0, 4
  bltu s2, t0, .L1
  ; basic/monitor.e16.ts:803  poke16(ARMED, 1)
  li t0, 1
  sw t0, 148(zero)
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/monitor.e16.ts:807 disarmBreaks() at -O1
;   k in s1
;   at in s2
;   was in s3
disarmBreaks:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/monitor.e16.ts:808  if (peek16(ARMED) === 0) return
  lw t0, 148(zero)
  bne t0, zero, .L1
  ; basic/monitor.e16.ts:808  return
  j .return
.L1:
  ; basic/monitor.e16.ts:809  for (let k: u16 = 0; k < 4; k++) {
  li s1, 0 ; k
  j .L4
.L2:
  ; basic/monitor.e16.ts:810  const at = breakAt(k)
  mv a0, s1
  call breakAt
  mv s2, a0 ; at
  ; basic/monitor.e16.ts:811  if (at !== 0 && peek(at) === (C_EBREAK & 0xff) && peek(at + 1) === C_EBREAK >> 8) {
  beq s2, zero, .L6
  lbu t0, 0(s2)
  li t1, 10
  bne t0, t1, .L6
  lbu t0, 1(s2)
  li t1, 32
  bne t0, t1, .L6
  ; basic/monitor.e16.ts:812  const was = peek16(SAVED + k * 2)
  slli t0, s1, 1
  lw s3, 158(t0)
  ; basic/monitor.e16.ts:813  poke(at, was & 0xff)
  andi t0, s3, 255
  sb t0, 0(s2)
  ; basic/monitor.e16.ts:814  poke(at + 1, was >> 8)
  srli t0, s3, 8
  sb t0, 1(s2)
.L6:
  addi s1, s1, 1
.L4:
  li t0, 4
  bltu s1, t0, .L2
  ; basic/monitor.e16.ts:817  poke16(ARMED, 0)
  sw zero, 148(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

str_34:
  .byte 122, 101, 114, 111, 32, 114, 97, 32, 115, 112, 32, 103, 112, 32, 97, 48, 32, 97, 49, 32, 97, 50, 32, 97, 51, 32, 116, 48, 32, 116, 49, 32, 116, 50, 32, 116, 51, 32, 115, 48, 32, 115, 49, 32, 115, 50, 32, 115, 51, 0
str_35:
  .byte 109, 115, 116, 97, 116, 117, 115, 0
str_36:
  .byte 109, 105, 115, 97, 0
str_37:
  .byte 109, 105, 101, 0
str_38:
  .byte 109, 116, 118, 101, 99, 0
str_39:
  .byte 109, 115, 99, 114, 97, 116, 99, 104, 0
str_40:
  .byte 109, 101, 112, 99, 0
str_41:
  .byte 109, 99, 97, 117, 115, 101, 0
str_42:
  .byte 109, 116, 118, 97, 108, 0
str_43:
  .byte 109, 105, 112, 0
str_44:
  .byte 99, 121, 99, 108, 101, 0
str_45:
  .byte 105, 110, 115, 116, 114, 101, 116, 0
str_46:
  .byte 99, 121, 99, 108, 101, 104, 0
str_47:
  .byte 105, 110, 115, 116, 114, 101, 116, 104, 0
str_48:
  .byte 97, 100, 100, 0
str_49:
  .byte 115, 108, 108, 0
str_50:
  .byte 115, 108, 116, 0
str_51:
  .byte 115, 108, 116, 117, 0
str_52:
  .byte 120, 111, 114, 0
str_53:
  .byte 115, 114, 108, 0
str_54:
  .byte 111, 114, 0
str_55:
  .byte 97, 110, 100, 0
str_56:
  .byte 115, 117, 98, 0
str_57:
  .byte 115, 114, 97, 0
str_58:
  .byte 109, 117, 108, 0
str_59:
  .byte 109, 117, 108, 104, 0
str_60:
  .byte 109, 117, 108, 104, 115, 117, 0
str_61:
  .byte 109, 117, 108, 104, 117, 0
str_62:
  .byte 100, 105, 118, 0
str_63:
  .byte 100, 105, 118, 117, 0
str_64:
  .byte 114, 101, 109, 0
str_65:
  .byte 114, 101, 109, 117, 0
str_66:
  .byte 114, 111, 108, 0
str_67:
  .byte 120, 110, 111, 114, 0
str_68:
  .byte 114, 111, 114, 0
str_69:
  .byte 111, 114, 110, 0
str_70:
  .byte 97, 110, 100, 110, 0
str_71:
  .byte 109, 105, 110, 0
str_72:
  .byte 109, 105, 110, 117, 0
str_73:
  .byte 109, 97, 120, 0
str_74:
  .byte 109, 97, 120, 117, 0
str_75:
  .byte 98, 115, 101, 116, 0
str_76:
  .byte 98, 99, 108, 114, 0
str_77:
  .byte 98, 105, 110, 118, 0
str_78:
  .byte 98, 101, 120, 116, 0
str_79:
  .byte 109, 99, 112, 121, 0
str_80:
  .byte 109, 115, 101, 116, 0
str_81:
  .byte 115, 114, 108, 105, 0
str_82:
  .byte 115, 114, 97, 105, 0
str_83:
  .byte 114, 111, 114, 105, 0
str_84:
  .byte 98, 101, 120, 116, 105, 0
str_85:
  .byte 115, 108, 108, 105, 0
str_86:
  .byte 98, 115, 101, 116, 105, 0
str_87:
  .byte 98, 99, 108, 114, 105, 0
str_88:
  .byte 98, 105, 110, 118, 105, 0
str_89:
  .byte 99, 108, 122, 0
str_90:
  .byte 99, 116, 122, 0
str_91:
  .byte 99, 112, 111, 112, 0
str_92:
  .byte 115, 101, 120, 116, 46, 98, 0
str_93:
  .byte 122, 101, 120, 116, 46, 98, 0
str_94:
  .byte 114, 101, 118, 56, 0
str_95:
  .byte 97, 100, 100, 105, 0
str_96:
  .byte 115, 108, 116, 105, 0
str_97:
  .byte 115, 108, 116, 105, 117, 0
str_98:
  .byte 120, 111, 114, 105, 0
str_99:
  .byte 111, 114, 105, 0
str_100:
  .byte 97, 110, 100, 105, 0
str_101:
  .byte 106, 97, 108, 114, 0
str_102:
  .byte 108, 98, 0
str_103:
  .byte 108, 119, 0
str_104:
  .byte 108, 98, 117, 0
str_105:
  .byte 98, 101, 113, 0
str_106:
  .byte 98, 110, 101, 0
str_107:
  .byte 98, 108, 116, 0
str_108:
  .byte 98, 103, 101, 0
str_109:
  .byte 98, 108, 116, 117, 0
str_110:
  .byte 98, 103, 101, 117, 0
str_111:
  .byte 99, 115, 114, 114, 119, 0
str_112:
  .byte 99, 115, 114, 114, 115, 0
str_113:
  .byte 99, 115, 114, 114, 99, 0
str_114:
  .byte 99, 115, 114, 114, 119, 105, 0
str_115:
  .byte 99, 115, 114, 114, 115, 105, 0
str_116:
  .byte 99, 115, 114, 114, 99, 105, 0
str_117:
  .byte 101, 99, 97, 108, 108, 0
str_118:
  .byte 101, 98, 114, 101, 97, 107, 0
str_119:
  .byte 109, 114, 101, 116, 0
str_120:
  .byte 119, 102, 105, 0
str_121:
  .byte 106, 97, 108, 0
str_122:
  .byte 108, 105, 0
str_123:
  .byte 97, 117, 105, 112, 99, 0
str_124:
  .byte 109, 117, 108, 113, 0
str_125:
  .byte 115, 98, 0
str_126:
  .byte 115, 119, 0
str_127:
  .byte 99, 46, 115, 119, 0
str_128:
  .byte 99, 46, 108, 119, 0
str_129:
  .byte 99, 46, 108, 119, 115, 112, 0
str_130:
  .byte 99, 46, 115, 119, 115, 112, 0
str_131:
  .byte 99, 46, 97, 100, 100, 105, 50, 115, 112, 110, 0
str_132:
  .byte 99, 46, 110, 111, 112, 0
str_133:
  .byte 99, 46, 97, 100, 100, 105, 0
str_134:
  .byte 99, 46, 108, 105, 0
str_135:
  .byte 99, 46, 115, 108, 108, 105, 0
str_136:
  .byte 99, 46, 115, 114, 108, 105, 0
str_137:
  .byte 99, 46, 115, 114, 97, 105, 0
str_138:
  .byte 99, 46, 97, 110, 100, 105, 0
str_139:
  .byte 99, 46, 98, 101, 113, 122, 0
str_140:
  .byte 99, 46, 98, 110, 101, 122, 0
str_141:
  .byte 99, 46, 106, 0
str_142:
  .byte 99, 46, 106, 97, 108, 0
str_143:
  .byte 99, 46, 109, 118, 0
str_144:
  .byte 99, 46, 97, 100, 100, 0
str_145:
  .byte 99, 46, 115, 117, 98, 0
str_146:
  .byte 99, 46, 120, 111, 114, 0
str_147:
  .byte 99, 46, 97, 110, 100, 0
str_148:
  .byte 99, 46, 111, 114, 0
str_149:
  .byte 99, 46, 106, 114, 0
str_150:
  .byte 99, 46, 106, 97, 108, 114, 0
str_151:
  .byte 99, 46, 101, 98, 114, 101, 97, 107, 0
str_152:
  .byte 46, 119, 111, 114, 100, 32, 63, 0
str_153:
  .byte 46, 119, 111, 114, 100, 32, 63, 44, 32, 63, 0
str_154:
  .byte 78, 79, 32, 66, 82, 69, 65, 75, 80, 79, 73, 78, 84, 83, 0
  .align 2

  .bank 5
  .org 0xc000
; basic/link.e16.ts:58 askStatement() at -O1
;   again in s1
askStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/link.e16.ts:60  const again = txt - 1
  lw t0, 0x010e(zero)
  addi s1, t0, -1
  ; basic/link.e16.ts:61  if (next() === T_NEW) {
  call next
  li t0, 130
  bne a0, t0, .L1
  ; basic/link.e16.ts:62  step()
  call step
  ; basic/link.e16.ts:63  poke16(LINK_CMD, LINK_FRESH)
  li t0, 2
  li t1, 65392
  sw t0, 0(t1)
  ; basic/link.e16.ts:64  return
  j .return
.L1:
  ; basic/link.e16.ts:66  if (next() === T_TYPE) {
  call next
  li t0, 221
  bne a0, t0, .L2
  ; basic/link.e16.ts:67  step()
  call step
  ; basic/link.e16.ts:68  askType = typeArgument()
  call typeArgument
  sw a0, 0x07fa(zero)
  ; basic/link.e16.ts:69  return
  j .return
.L2:
  ; basic/link.e16.ts:71  ask(again)
  mv a0, s1
  call ask
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/link.e16.ts:80 ask(again) at -O1
;   again in 10(fp)
;   n in s2
;   question in 0(fp)
;   at in 2(fp)
;   room in 6(fp)
;   said in s1
;   reply in 8(fp)
;   got in s3
;   status in 4(fp)
ask:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s2, 14(sp)
  sw s1, 16(sp)
  sw s3, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  sw a0, 10(fp) ; again
  ; basic/link.e16.ts:81  expr()
  call expr
  ; basic/link.e16.ts:82  needString()
  call needString
  ; basic/link.e16.ts:83  const n = stringLength(top())
  call top
  call stringLength
  mv s2, a0 ; n
  ; basic/link.e16.ts:84  if (n === 0) fail(E_ARGUMENT)
  bne s2, zero, .L1
  ; basic/link.e16.ts:84  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L1:
  ; basic/link.e16.ts:85  const question = tempString(n + 1)
  addi a0, s2, 1
  call tempString
  sw a0, 0(fp) ; question
  ; basic/link.e16.ts:86  move(stringAt(top()), question, n)
  call top
  call stringAt
  lw a1, 0(fp)
  mv a2, s2
  call move
  ; basic/link.e16.ts:87  poke(question + n, 0)
  lw t0, 0(fp) ; question
  add t0, t0, s2
  sb zero, 0(t0)
  ; basic/link.e16.ts:88  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/link.e16.ts:89  expect(CH_COMMA)
  li a0, 44
  call expect
  ; basic/link.e16.ts:90  const at = varAt(true)
  li a0, 1
  call varAt
  sw a0, 2(fp) ; at
  ; basic/link.e16.ts:91  if (!nameIsString) fail(E_TYPE)
  lw t0, 0x061a(zero)
  bnez t0, .L2
  ; basic/link.e16.ts:91  fail(E_TYPE)
  li a0, 11
  call fail
.L2:
  ; basic/link.e16.ts:92  const room = varRoom
  lw t0, 0x011a(zero)
  sw t0, 6(fp) ; room
  ; basic/link.e16.ts:93  let said: u16 = 0
  li s1, 0 ; said
  ; basic/link.e16.ts:94  if (next() === CH_COMMA) {
  call next
  li t0, 44
  bne a0, t0, .L3
  ; basic/link.e16.ts:95  step()
  call step
  ; basic/link.e16.ts:96  said = varAt(true)
  li a0, 1
  call varAt
  mv s1, a0 ; said
  ; basic/link.e16.ts:97  if (nameIsString) fail(E_TYPE)
  lw t0, 0x061a(zero)
  beqz t0, .L4
  ; basic/link.e16.ts:97  fail(E_TYPE)
  li a0, 11
  call fail
.L4:
.L3:
  ; basic/link.e16.ts:99  const reply = tempString(room + 1)
  lw t0, 6(fp) ; room
  addi a0, t0, 1
  call tempString
  sw a0, 8(fp) ; reply
  ; basic/link.e16.ts:100  const got: i16 = link(question, reply, room, askType)
  lw t0, 0x07fa(zero)
  lw a0, 0(fp)
  lw a1, 8(fp)
  lw a2, 6(fp)
  mv a3, t0
  call link
  mv s3, a0 ; got
  ; basic/link.e16.ts:101  if (got < 0) {
  bge s3, zero, .L5
  ; basic/link.e16.ts:102  const status = u16(-got)
  neg t0, s3
  sw t0, 4(fp) ; status
  ; basic/link.e16.ts:103  if (said === 0 || status === LINK_ST_CANCELLED) failed(status, again)
  beq s1, zero, .L7
  li t0, 7
  lw t1, 4(fp) ; status
  bne t1, t0, .L6
.L7:
  ; basic/link.e16.ts:103  failed(status, again)
  lw a0, 4(fp)
  lw a1, 10(fp)
  call failed
.L6:
  ; basic/link.e16.ts:104  poke(at, 0)
  lw t0, 2(fp) ; at
  sb zero, 0(t0)
  ; basic/link.e16.ts:105  setInt(said, i16(status))
  mv a0, s1
  lw a1, 4(fp)
  call setInt
  ; basic/link.e16.ts:106  return
  j .return
.L5:
  ; basic/link.e16.ts:108  move(reply, at + 1, u16(got))
  lw t0, 2(fp) ; at
  lw a0, 8(fp)
  addi a1, t0, 1
  mv a2, s3
  call move
  ; basic/link.e16.ts:109  poke(at, u16(got))
  lw t0, 2(fp) ; at
  sb s3, 0(t0)
  ; basic/link.e16.ts:110  if (said !== 0) setInt(said, 0)
  beq s1, zero, .L8
  ; basic/link.e16.ts:110  setInt(said, 0)
  mv a0, s1
  li a1, 0
  call setInt
.L8:
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s2, 14(sp)
  lw s1, 16(sp)
  lw s3, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; basic/link.e16.ts:114 failed(status, again) at -O1
;   status in s1
;   again in s2
failed:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; status
  mv s2, a1 ; again
  ; basic/link.e16.ts:115  if (status === LINK_ST_CANCELLED) {
  li t0, 7
  bne s1, t0, .L1
  ; basic/link.e16.ts:116  setTxt(again)
  mv a0, s2
  call setTxt
  ; basic/link.e16.ts:117  poke16(BRKFLAG, 1)
  li t0, 1
  sw t0, 30(zero)
  ; basic/link.e16.ts:118  checkBreak()
  call checkBreak
.L1:
  ; basic/link.e16.ts:120  if (status === LINK_ST_OFF) fail(E_LINK_OFF)
  li t0, 2
  bne s1, t0, .L2
  ; basic/link.e16.ts:120  fail(E_LINK_OFF)
  li a0, 19
  call fail
.L2:
  ; basic/link.e16.ts:121  if (status === LINK_ST_HELD) fail(E_LINK_HELD)
  li t0, 3
  bne s1, t0, .L3
  ; basic/link.e16.ts:121  fail(E_LINK_HELD)
  li a0, 20
  call fail
.L3:
  ; basic/link.e16.ts:122  if (status === LINK_ST_BAD_REQUEST) fail(E_ARGUMENT)
  li t0, 5
  bne s1, t0, .L4
  ; basic/link.e16.ts:122  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L4:
  ; basic/link.e16.ts:123  fail(E_LINK)
  li a0, 18
  call fail
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/link.e16.ts:127 typeArgument() at -O1
;   found/n in s1
typeArgument:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/link.e16.ts:128  expr()
  call expr
  ; basic/link.e16.ts:129  if (strType) {
  lw t0, 0x0118(zero)
  beqz t0, .L1
  ; basic/link.e16.ts:130  const found = typeNamed(stringAt(top()), stringLength(top()))
  call top
  call stringAt
  addi sp, sp, -2
  sw a0, 0(sp)
  call top
  call stringLength
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call typeNamed
  mv s1, a0 ; found/n
  ; basic/link.e16.ts:131  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/link.e16.ts:132  if (found >= AI_TYPES) fail(E_ARGUMENT)
  li t0, 11
  bltu s1, t0, .L2
  ; basic/link.e16.ts:132  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L2:
  ; basic/link.e16.ts:133  return found
  mv a0, s1
  j .return
.L1:
  ; basic/link.e16.ts:135  const n = toInt(top())
  call top
  call toInt
  mv s1, a0 ; found/n
  ; basic/link.e16.ts:136  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/link.e16.ts:137  if (n < 0 || n >= AI_TYPES) fail(E_ARGUMENT)
  blt s1, zero, .L4
  li t0, 11
  blt s1, t0, .L3
.L4:
  ; basic/link.e16.ts:137  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L3:
  ; basic/link.e16.ts:138  return u16(n)
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/link.e16.ts:142 typeNamed(at, length) at -O1
;   at in 2(fp)
;   length in 0(fp)
;   p in s2
;   k in s3
;   q in s1
typeNamed:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  sw a0, 2(fp) ; at
  sw a1, 0(fp) ; length
  ; basic/link.e16.ts:143  let p = AI_TYPE_NAMES
  la s2, str_2
  ; basic/link.e16.ts:144  let k: u16 = 0
  li s3, 0 ; k
  ; basic/link.e16.ts:145  while (peek(p) !== 0) {
  j .L3
.L1:
  ; basic/link.e16.ts:146  let q = p
  mv s1, s2 ; q
  ; basic/link.e16.ts:147  while (peek(q) !== 0 && peek(q) !== 0x20) q++
  j .L7
.L5:
  ; basic/link.e16.ts:147  q++
  addi s1, s1, 1
.L7:
  lbu t0, 0(s1)
  beq t0, zero, .L9
  lbu t0, 0(s1)
  li t1, 32
  bne t0, t1, .L5
.L9:
  ; basic/link.e16.ts:148  if (q - p === length && same(p, at, length)) return k
  sub t0, s1, s2
  lw t1, 0(fp) ; length
  bne t0, t1, .L10
  mv a0, s2
  lw a1, 2(fp)
  lw a2, 0(fp)
  call same
  beqz a0, .L10
  ; basic/link.e16.ts:148  return k
  mv a0, s3
  j .return
.L10:
  ; basic/link.e16.ts:149  p = peek(q) === 0 ? q : q + 1
  lbu t0, 0(s1)
  bne t0, zero, .L11
  mv t0, s1
  j .L12
.L11:
  addi t0, s1, 1
.L12:
  mv s2, t0 ; p
  ; basic/link.e16.ts:150  k++
  addi s3, s3, 1
.L3:
  lbu t0, 0(s2)
  bne t0, zero, .L1
  ; basic/link.e16.ts:152  return AI_TYPES
  li a0, 11
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/link.e16.ts:155 same(a, b, length) at -O1
;   a in a0
;   b in a1
;   length in a2
;   k in a3
same:
  ; basic/link.e16.ts:156  for (let k: u16 = 0; k < length; k++) {
  li a3, 0 ; k
  j .L3
.L1:
  ; basic/link.e16.ts:157  if (peek(a + k) !== peek(b + k)) return false
  add t0, a0, a3
  lbu t0, 0(t0)
  add t1, a1, a3
  lbu t1, 0(t1)
  beq t0, t1, .L5
  ; basic/link.e16.ts:157  return false
  li a0, 0
  ret
.L5:
  addi a3, a3, 1
.L3:
  bltu a3, a2, .L1
  ; basic/link.e16.ts:159  return true
  li a0, 1
.return:
  ret

str_2:
  .byte 78, 79, 82, 77, 65, 76, 32, 84, 85, 84, 79, 82, 32, 66, 65, 83, 73, 67, 32, 81, 85, 73, 90, 32, 83, 84, 79, 82, 89, 32, 80, 79, 69, 84, 32, 70, 79, 82, 84, 85, 78, 69, 32, 68, 73, 67, 84, 32, 84, 82, 65, 78, 83, 32, 83, 69, 65, 82, 67, 72, 32, 87, 69, 65, 84, 72, 69, 82, 0
  .align 2
