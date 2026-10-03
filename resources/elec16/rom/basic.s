; Made by e16c from basic/rom.e16.ts, basic/text.e16.ts, basic/edit.e16.ts, basic/basic.e16.ts, basic/strings.e16.ts, basic/screen.e16.ts, basic/files.e16.ts, basic/tools.e16.ts, basic/monitor.e16.ts: do not edit.

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
; strTop at 0x0504
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
lineBuf = 0x0144 ; 80 bytes
lastLine = 0x0194 ; 80 bytes
tokens = 0x01e4 ; 96 bytes
nums = 0x0244 ; 192 bytes
strTemp = 0x0304 ; 512 bytes
ans = 0x0506 ; 8 bytes
textOut = 0x050e ; 24 bytes
forStack = 0x0526 ; 176 bytes
gosubStack = 0x05d6 ; 64 bytes
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
  sw zero, 0x0504(zero)
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
  ; lineBuf: 80 bytes of 0
  li t0, 0x0144
  li t1, 0x0194
.clear_lineBuf:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_lineBuf
  ; lastLine: 80 bytes of 0
  li t0, 0x0194
  li t1, 0x01e4
.clear_lastLine:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_lastLine
  ; tokens: 96 bytes of 0
  li t0, 0x01e4
  li t1, 0x0244
.clear_tokens:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_tokens
  ; nums: 192 bytes of 0
  li t0, 0x0244
  li t1, 0x0304
.clear_nums:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_nums
  ; strTemp: 512 bytes of 0
  li t0, 0x0304
  li t1, 0x0504
.clear_strTemp:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_strTemp
  ; ans: 8 bytes of 0
  li t0, 0x0506
  li t1, 0x050e
.clear_ans:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_ans
  ; textOut: 24 bytes of 0
  li t0, 0x050e
  li t1, 0x0526
.clear_textOut:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_textOut
  ; forStack: 176 bytes of 0
  li t0, 0x0526
  li t1, 0x05d6
.clear_forStack:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_forStack
  ; gosubStack: 64 bytes of 0
  li t0, 0x05d6
  li t1, 0x0616
.clear_gosubStack:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_gosubStack
  ; cardBlock: 32 bytes of 0
  li t0, 0x0622
  li t1, 0x0642
.clear_cardBlock:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_cardBlock
  ; cardBuf: 256 bytes of 0
  li t0, 0x0642
  li t1, 0x0742
.clear_cardBuf:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_cardBuf
  ; nothing: 2 bytes of 0
  li t0, 0x0742
  li t1, 0x0744
.clear_nothing:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_nothing
  ; fileMode: 2 bytes of 0
  li t0, 0x0744
  li t1, 0x0746
.clear_fileMode:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_fileMode
  ; fileName: 24 bytes of 0
  li t0, 0x0746
  li t1, 0x075e
.clear_fileName:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_fileName
  ; fileOffset: 4 bytes of 0
  li t0, 0x075e
  li t1, 0x0762
.clear_fileOffset:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_fileOffset
  ; fileLen: 4 bytes of 0
  li t0, 0x0762
  li t1, 0x0766
.clear_fileLen:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_fileLen
  ; filePos: 4 bytes of 0
  li t0, 0x0766
  li t1, 0x076a
.clear_filePos:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_filePos
  ; fileBuf: 128 bytes of 0
  li t0, 0x076a
  li t1, 0x07ea
.clear_fileBuf:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_fileBuf
  ret

; basic/text.e16.ts:127 isLetter(c) at -O1
;   c in a0
isLetter:
  ; basic/text.e16.ts:128  return (c >= CH_A && c <= CH_Z) || (c >= CH_LOWER_A && c <= CH_LOWER_Z)
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

; basic/text.e16.ts:131 upper(c) at -O1
;   c in a0
upper:
  ; basic/text.e16.ts:132  if (c >= CH_LOWER_A && c <= CH_LOWER_Z) return c - 0x20
  li t0, 97
  bltu a0, t0, .L1
  li t0, 122
  bltu t0, a0, .L1
  ; basic/text.e16.ts:132  return c - 0x20
  addi a0, a0, -32
.L1:
  ; basic/text.e16.ts:133  return c
.return:
  ret

; basic/text.e16.ts:137 keywordText(token) at -O1
;   token in a0
;   at in a1
;   k in a2
keywordText:
  ; basic/text.e16.ts:138  let at = KEYWORDS
  la a1, str_0
  ; basic/text.e16.ts:139  let k: u16 = 0x80
  li a2, 128 ; k
  ; basic/text.e16.ts:140  while (k < token) {
  j .L3
  ; basic/text.e16.ts:141  while (peek(at) !== CH_SPACE && peek(at) !== 0) at++
.L5:
  ; basic/text.e16.ts:141  at++
  addi a1, a1, 1
.L7:
  lbu t0, 0(a1)
  li t1, 32
  beq t0, t1, .L9
  lbu t0, 0(a1)
  bne t0, zero, .L5
.L9:
  ; basic/text.e16.ts:142  if (peek(at) === 0) return 0
  lbu t0, 0(a1)
  bne t0, zero, .L10
  ; basic/text.e16.ts:142  return 0
  li a0, 0
  ret
.L10:
  ; basic/text.e16.ts:143  at++
  addi a1, a1, 1
  ; basic/text.e16.ts:144  k++
  addi a2, a2, 1
.L3:
  bltu a2, a0, .L7
  ; basic/text.e16.ts:146  return at
  mv a0, a1
.return:
  ret

; basic/text.e16.ts:150 matches(text, word) at -O1
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
  ; basic/text.e16.ts:151  let n: u16 = 0
  li s1, 0 ; n
  ; basic/text.e16.ts:152  while (peek(word + n) !== CH_SPACE && peek(word + n) !== 0) {
  j .L3
.L1:
  ; basic/text.e16.ts:153  if (upper(peek(text + n)) !== peek(word + n)) return 0
  add t0, s3, s1
  lbu a0, 0(t0)
  call upper
  add t0, s2, s1
  lbu t0, 0(t0)
  beq a0, t0, .L5
  ; basic/text.e16.ts:153  return 0
  li a0, 0
  j .return
.L5:
  ; basic/text.e16.ts:154  n++
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
  ; basic/text.e16.ts:156  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/text.e16.ts:162 keywordAt(text) at -O1
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
  ; basic/text.e16.ts:163  let best: u16 = 0
  sw zero, 0(fp) ; best
  ; basic/text.e16.ts:164  let bestLength: u16 = 0
  li s2, 0 ; bestLength
  ; basic/text.e16.ts:165  let at = KEYWORDS
  la s1, str_0
  ; basic/text.e16.ts:166  let token: u16 = 0x80
  li s3, 128 ; token
  ; basic/text.e16.ts:167  while (peek(at) !== 0) {
  j .L3
.L1:
  ; basic/text.e16.ts:168  const n = matches(text, at)
  lw a0, 4(fp)
  mv a1, s1
  call matches
  sw a0, 2(fp) ; n
  ; basic/text.e16.ts:169  if (n > bestLength) {
  lw t0, 2(fp) ; n
  bgeu s2, t0, .L8
  ; basic/text.e16.ts:170  best = token
  sw s3, 0(fp) ; best
  ; basic/text.e16.ts:171  bestLength = n
  lw s2, 2(fp) ; n
  ; basic/text.e16.ts:173  while (peek(at) !== CH_SPACE && peek(at) !== 0) at++
  j .L8
.L6:
  ; basic/text.e16.ts:173  at++
  addi s1, s1, 1
.L8:
  lbu t0, 0(s1)
  li t1, 32
  beq t0, t1, .L10
  lbu t0, 0(s1)
  bne t0, zero, .L6
.L10:
  ; basic/text.e16.ts:174  if (peek(at) === CH_SPACE) at++
  lbu t0, 0(s1)
  li t1, 32
  bne t0, t1, .L11
  ; basic/text.e16.ts:174  at++
  addi s1, s1, 1
.L11:
  ; basic/text.e16.ts:175  token++
  addi s3, s3, 1
.L3:
  lbu t0, 0(s1)
  bne t0, zero, .L1
  ; basic/text.e16.ts:177  matchedLength = bestLength
  sw s2, 0x0100(zero)
  ; basic/text.e16.ts:178  return best
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

; basic/text.e16.ts:189 rawFrom() at -O1
rawFrom:
  ; basic/text.e16.ts:190  inQuotes = false
  sw zero, 0x0102(zero)
  ; basic/text.e16.ts:191  rawMode = RAW_NONE
  sw zero, 0x0104(zero)
.return:
  ret

; basic/text.e16.ts:195 kept() at -O1
kept:
  ; basic/text.e16.ts:196  return inQuotes || rawMode !== RAW_NONE
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

; basic/text.e16.ts:200 afterToken(token) at -O1
;   token in a0
afterToken:
  ; basic/text.e16.ts:201  if (token === T_REM) rawMode = RAW_REM
  li t0, 147
  bne a0, t0, .L1
  ; basic/text.e16.ts:201  rawMode = RAW_REM
  li t0, 1
  sw t0, 0x0104(zero)
  j .L2
.L1:
  ; basic/text.e16.ts:202  if (token === T_DATA) rawMode = RAW_DATA
  li t0, 158
  bne a0, t0, .L3
  ; basic/text.e16.ts:202  rawMode = RAW_DATA
  li t0, 2
  sw t0, 0x0104(zero)
.L3:
.L2:
.return:
  ret

; basic/text.e16.ts:206 afterChar(c) at -O1
;   c in a0
afterChar:
  ; basic/text.e16.ts:207  if (c === CH_QUOTE) inQuotes = !inQuotes
  li t0, 34
  bne a0, t0, .L1
  ; basic/text.e16.ts:207  inQuotes = !inQuotes
  lw t0, 0x0102(zero)
  seqz t0, t0
  sw t0, 0x0102(zero)
  j .L2
.L1:
  ; basic/text.e16.ts:208  if (c === CH_COLON && rawMode === RAW_DATA && !inQuotes) rawMode = RAW_NONE
  li t0, 58
  bne a0, t0, .L3
  lw t0, 0x0104(zero)
  li t1, 2
  bne t0, t1, .L3
  lw t0, 0x0102(zero)
  bnez t0, .L3
  ; basic/text.e16.ts:208  rawMode = RAW_NONE
  sw zero, 0x0104(zero)
.L3:
.L2:
.return:
  ret

; basic/text.e16.ts:216 tokenize(text, out) at -O1
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
  ; basic/text.e16.ts:217  let i: u16 = 0
  li s1, 0 ; i
  ; basic/text.e16.ts:218  let o: u16 = 0
  li s2, 0 ; o
  ; basic/text.e16.ts:219  rawFrom()
  call rawFrom
  ; basic/text.e16.ts:220  while (peek(text + i) !== 0) {
  j .L3
.L1:
  ; basic/text.e16.ts:221  const c: u8 = peek(text + i)
  lw t0, 0(fp) ; text
  add t0, t0, s1
  lbu s3, 0(t0)
  ; basic/text.e16.ts:223  const keep: bool = kept()
  call kept
  sw a0, 4(fp) ; keep
  ; basic/text.e16.ts:226  if (c >= 0x80 && !keep) fail(E_SYNTAX)
  li t0, 128
  bltu s3, t0, .L5
  lw t0, 4(fp) ; keep
  bnez t0, .L5
  ; basic/text.e16.ts:226  fail(E_SYNTAX)
  li a0, 1
  call fail
.L5:
  ; basic/text.e16.ts:227  const token: u16 = keep || !isLetter(c) ? 0 : keywordAt(text + i)
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
  ; basic/text.e16.ts:228  if (token !== 0) {
  lw t0, 6(fp) ; token
  beq t0, zero, .L9
  ; basic/text.e16.ts:229  poke(out + o, token)
  lw t0, 2(fp) ; out
  add t0, t0, s2
  lw t1, 6(fp) ; token
  sb t1, 0(t0)
  ; basic/text.e16.ts:230  i += matchedLength
  lw t0, 0x0100(zero)
  add s1, s1, t0
  ; basic/text.e16.ts:231  afterToken(token)
  lw a0, 6(fp)
  call afterToken
  j .L10
.L9:
  ; basic/text.e16.ts:233  afterChar(c)
  mv a0, s3
  call afterChar
  ; basic/text.e16.ts:234  poke(out + o, keep ? c : upper(c))
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
  ; basic/text.e16.ts:235  i++
  addi s1, s1, 1
.L10:
  ; basic/text.e16.ts:237  o++
  addi s2, s2, 1
.L3:
  lw t0, 0(fp) ; text
  add t0, t0, s1
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; basic/text.e16.ts:239  poke(out + o, 0)
  lw t0, 2(fp) ; out
  add t0, t0, s2
  sb zero, 0(t0)
  ; basic/text.e16.ts:240  return o + 1
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

; basic/text.e16.ts:248 expand(at, out, max) at -O1
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
  ; basic/text.e16.ts:249  let p = at
  lw t0, 6(fp) ; at
  sw t0, 0(fp) ; p
  ; basic/text.e16.ts:250  let n: u16 = 0
  li s2, 0 ; n
  ; basic/text.e16.ts:251  rawFrom()
  call rawFrom
  ; basic/text.e16.ts:252  while (peek(p) !== 0) {
  j .L3
.L1:
  ; basic/text.e16.ts:253  const c: u8 = peek(p)
  lw t0, 0(fp) ; p
  lbu s3, 0(t0)
  ; basic/text.e16.ts:254  if (c >= 0x80 && !kept()) {
  li t0, 128
  bltu s3, t0, .L5
  call kept
  bnez a0, .L5
  ; basic/text.e16.ts:255  let w = keywordText(c)
  mv a0, s3
  call keywordText
  mv s1, a0 ; w
  ; basic/text.e16.ts:256  while (w !== 0 && peek(w) !== CH_SPACE && peek(w) !== 0) {
  j .L8
.L6:
  ; basic/text.e16.ts:257  n = give(out, n, max, peek(w))
  lbu t0, 0(s1)
  lw a0, 2(fp)
  mv a1, s2
  lw a2, 4(fp)
  mv a3, t0
  call give
  mv s2, a0 ; n
  ; basic/text.e16.ts:258  w++
  addi s1, s1, 1
.L8:
  beq s1, zero, .L10
  lbu t0, 0(s1)
  li t1, 32
  beq t0, t1, .L10
  lbu t0, 0(s1)
  bne t0, zero, .L6
.L10:
  ; basic/text.e16.ts:260  afterToken(c)
  mv a0, s3
  call afterToken
  j .L11
.L5:
  ; basic/text.e16.ts:262  afterChar(c)
  mv a0, s3
  call afterChar
  ; basic/text.e16.ts:263  n = give(out, n, max, c)
  lw a0, 2(fp)
  mv a1, s2
  lw a2, 4(fp)
  mv a3, s3
  call give
  mv s2, a0 ; n
.L11:
  ; basic/text.e16.ts:265  p++
  lw t0, 0(fp) ; p
  addi t0, t0, 1
  sw t0, 0(fp) ; p
.L3:
  lw t0, 0(fp) ; p
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; basic/text.e16.ts:267  return n
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

; basic/text.e16.ts:271 give(out, n, max, c) at -O1
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
  ; basic/text.e16.ts:272  if (out === 0) {
  bne s2, zero, .L1
  ; basic/text.e16.ts:273  putc(c)
  mv a0, s3
  call putc
  ; basic/text.e16.ts:274  return n + 1
  addi a0, s1, 1
  j .return
.L1:
  ; basic/text.e16.ts:276  if (n >= max) return n
  bltu s1, s0, .L2
  ; basic/text.e16.ts:276  return n
  mv a0, s1
  j .return
.L2:
  ; basic/text.e16.ts:277  poke(out + n, c)
  add t0, s2, s1
  sb s3, 0(t0)
  ; basic/text.e16.ts:278  return n + 1
  addi a0, s1, 1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; basic/text.e16.ts:282 unsignedText(value, out) at -O1
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
  ; basic/text.e16.ts:283  let n: u16 = 0
  li s2, 0 ; n
  ; basic/text.e16.ts:284  if (value >= 10) n = unsignedText(div(value, 10), out)
  li t0, 10
  bltu s1, t0, .L1
  ; basic/text.e16.ts:284  n = unsignedText(div(value, 10), out)
  li t0, 10
  divu a0, s1, t0
  mv a1, s3
  call unsignedText
  mv s2, a0 ; n
.L1:
  ; basic/text.e16.ts:285  poke(out + n, CH_0 + (value % 10))
  add t0, s3, s2
  li t1, 10
  remu t1, s1, t1
  addi t1, t1, 48
  sb t1, 0(t0)
  ; basic/text.e16.ts:286  return n + 1
  addi a0, s2, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; basic/text.e16.ts:290 printUnsigned(value) at -O1
;   value in s1
printUnsigned:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; value
  ; basic/text.e16.ts:291  if (value >= 10) printUnsigned(div(value, 10))
  li t0, 10
  bltu s1, t0, .L1
  ; basic/text.e16.ts:291  printUnsigned(div(value, 10))
  li t0, 10
  divu a0, s1, t0
  call printUnsigned
.L1:
  ; basic/text.e16.ts:292  putc(CH_0 + (value % 10))
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
  lw t0, 0x0106(zero)
  add s2, t0, s3
  ; basic/edit.e16.ts:54  locate(cell % cols, startY + div(cell, cols))
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
  lw t0, 0x0106(zero)
  add t0, t0, s2
  addi t0, t0, 1
  sw t0, 8(fp) ; cell
  ; basic/edit.e16.ts:68  const expected = startY + div(cell, cols)
  lw t0, 0x0108(zero)
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
  lw t0, 0x0108(zero)
  lw t1, 2(fp) ; now
  lw t2, 0(fp) ; expected
  sub t2, t2, t1
  sub t0, t0, t2
  sw t0, 0x0108(zero)
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
  sw t0, 0x0106(zero)
  ; basic/edit.e16.ts:83  startY = peek16(CURY)
  lw t0, 2(zero)
  sw t0, 0x0108(zero)
  ; basic/edit.e16.ts:84  n = length
  sw s3, 0x010a(zero)
  ; basic/edit.e16.ts:85  at = length
  sw s3, 0x010c(zero)
  ; basic/edit.e16.ts:86  redraw(buf, n, 0, at)
  lw t0, 0x010a(zero)
  lw t1, 0x010c(zero)
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
  lw a0, 0x010a(zero)
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
  lw a0, 0x010a(zero)
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
  lw t0, 0x010a(zero)
  add t0, s2, t0
  sb zero, 0(t0)
  ; basic/edit.e16.ts:102  return i16(n)
  lw a0, 0x010a(zero)
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
  ; basic/edit.e16.ts:112  if (k === K_LEFT || k === K_RIGHT) stepCursor(k === K_RIGHT)
  li t0, 28
  beq s1, t0, .L2
  li t0, 29
  bne s1, t0, .L1
.L2:
  ; basic/edit.e16.ts:112  stepCursor(k === K_RIGHT)
  li t0, 29
  sub t0, s1, t0
  seqz a0, t0
  call stepCursor
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
  lw t0, 0x010a(zero)
  bgeu t0, s3, .L7
  ; basic/edit.e16.ts:114  n = openSpace(buf, n, at)
  lw t0, 0x010a(zero)
  lw t1, 0x010c(zero)
  mv a0, s2
  mv a1, t0
  mv a2, t1
  call openSpace
  sw a0, 0x010a(zero)
  j .L8
.L7:
  ; basic/edit.e16.ts:115  if (k >= CH_SPACE && (at < n || n < max)) write(buf, k)
  li t0, 32
  bltu s1, t0, .L9
  lw t0, 0x010c(zero)
  lw t1, 0x010a(zero)
  bltu t0, t1, .L10
  lw t0, 0x010a(zero)
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

; basic/edit.e16.ts:119 stepCursor(right) at -O1
;   right in s1
stepCursor:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; right
  ; basic/edit.e16.ts:120  if (right && at < n) at++
  beqz s1, .L1
  lw t0, 0x010c(zero)
  lw t1, 0x010a(zero)
  bgeu t0, t1, .L1
  ; basic/edit.e16.ts:120  at++
  lw t0, 0x010c(zero)
  addi t0, t0, 1
  sw t0, 0x010c(zero)
.L1:
  ; basic/edit.e16.ts:121  if (!right && at > 0) at--
  bnez s1, .L2
  lw t0, 0x010c(zero)
  bgeu zero, t0, .L2
  ; basic/edit.e16.ts:121  at--
  lw t0, 0x010c(zero)
  addi t0, t0, -1
  sw t0, 0x010c(zero)
.L2:
  ; basic/edit.e16.ts:122  place(at)
  lw a0, 0x010c(zero)
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
  lw t0, 0x010c(zero)
  bne t0, zero, .L2
  ; basic/edit.e16.ts:128  return
  j .return
.L2:
  ; basic/edit.e16.ts:129  at--
  lw t0, 0x010c(zero)
  addi t0, t0, -1
  sw t0, 0x010c(zero)
  j .L3
.L1:
  ; basic/edit.e16.ts:130  if (at === n) return
  lw t0, 0x010c(zero)
  lw t1, 0x010a(zero)
  bne t0, t1, .L4
  ; basic/edit.e16.ts:130  return
  j .return
.L4:
.L3:
  ; basic/edit.e16.ts:131  n = takeOut(buf, n, at)
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
  lw t0, 0x010c(zero)
  add t0, s1, t0
  sb s2, 0(t0)
  ; basic/edit.e16.ts:137  if (at === n) n++
  lw t0, 0x010c(zero)
  lw t1, 0x010a(zero)
  bne t0, t1, .L1
  ; basic/edit.e16.ts:137  n++
  lw t0, 0x010a(zero)
  addi t0, t0, 1
  sw t0, 0x010a(zero)
.L1:
  ; basic/edit.e16.ts:138  at++
  lw t0, 0x010c(zero)
  addi t0, t0, 1
  sw t0, 0x010c(zero)
  ; basic/edit.e16.ts:139  redraw(buf, n, at - 1, at)
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

; basic/edit.e16.ts:143 controlKey(k) at -O1
;   k in a0
controlKey:
  ; basic/edit.e16.ts:144  if (k === K_ENTER) return 1
  li t0, 13
  bne a0, t0, .L1
  ; basic/edit.e16.ts:144  return 1
  li a0, 1
  ret
.L1:
  ; basic/edit.e16.ts:145  if (k === K_CLS) return EDIT_CLS
  li t0, 12
  bne a0, t0, .L2
  ; basic/edit.e16.ts:145  return EDIT_CLS
  li a0, 65535
  ret
.L2:
  ; basic/edit.e16.ts:146  if (k === K_BRK) return EDIT_BRK
  li t0, 3
  bne a0, t0, .L3
  ; basic/edit.e16.ts:146  return EDIT_BRK
  li a0, 65534
  ret
.L3:
  ; basic/edit.e16.ts:147  if (k === K_MODE) return EDIT_MODE
  li t0, 16
  bne a0, t0, .L4
  ; basic/edit.e16.ts:147  return EDIT_MODE
  li a0, 65533
  ret
.L4:
  ; basic/edit.e16.ts:148  if (k === K_UP) return EDIT_UP
  li t0, 30
  bne a0, t0, .L5
  ; basic/edit.e16.ts:148  return EDIT_UP
  li a0, 65532
  ret
.L5:
  ; basic/edit.e16.ts:149  if (k === K_DOWN) return EDIT_DOWN
  li t0, 31
  bne a0, t0, .L6
  ; basic/edit.e16.ts:149  return EDIT_DOWN
  li a0, 65531
  ret
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

; basic/basic.e16.ts:275 setTxt(p) at -O1
;   p in a0
setTxt:
  ; basic/basic.e16.ts:276  txt = p
  sw a0, 0x010e(zero)
.return:
  ret

; basic/basic.e16.ts:280 step() at -O1
step:
  ; basic/basic.e16.ts:281  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.return:
  ret

; basic/basic.e16.ts:284 setNsp(p) at -O1
;   p in a0
setNsp:
  ; basic/basic.e16.ts:285  nsp = p
  sw a0, 0x0116(zero)
.return:
  ret

; basic/basic.e16.ts:288 setStrType(s) at -O1
;   s in a0
setStrType:
  ; basic/basic.e16.ts:289  strType = s
  sw a0, 0x0118(zero)
.return:
  ret

; basic/basic.e16.ts:292 setVarRoom(room) at -O1
;   room in a0
setVarRoom:
  ; basic/basic.e16.ts:293  varRoom = room
  sw a0, 0x011a(zero)
.return:
  ret

; basic/basic.e16.ts:296 setOutFile(n) at -O1
;   n in a0
setOutFile:
  ; basic/basic.e16.ts:297  outFile = n
  sw a0, 0x011c(zero)
.return:
  ret

; basic/basic.e16.ts:300 setData(line, at) at -O1
;   line in a0
;   at in a1
setData:
  ; basic/basic.e16.ts:301  dataLine = line
  sw a0, 0x011e(zero)
  ; basic/basic.e16.ts:302  dataAt = at
  sw a1, 0x0120(zero)
.return:
  ret

; basic/basic.e16.ts:305 setFilesOpen(open) at -O1
;   open in a0
setFilesOpen:
  ; basic/basic.e16.ts:306  filesOpen = open
  sw a0, 0x0122(zero)
.return:
  ret

; basic/basic.e16.ts:309 setTracing(on) at -O1
;   on in a0
setTracing:
  ; basic/basic.e16.ts:310  tracing = on
  sw a0, 0x0124(zero)
.return:
  ret

; basic/basic.e16.ts:313 setAuto(line, by) at -O1
;   line in a0
;   by in a1
setAuto:
  ; basic/basic.e16.ts:314  autoLine = line
  sw a0, 0x0126(zero)
  ; basic/basic.e16.ts:315  autoStep = by
  sw a1, 0x0128(zero)
.return:
  ret

; basic/basic.e16.ts:318 setVarEnd(at) at -O1
;   at in a0
setVarEnd:
  ; basic/basic.e16.ts:319  varEnd = at
  sw a0, 0x0114(zero)
.return:
  ret

; basic/basic.e16.ts:324 errorWord(code) at -O1
;   code in s1
errorWord:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; code
  ; basic/basic.e16.ts:325  switch (code) {
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
  ; basic/basic.e16.ts:327  return str('SYNTAX')
  la a0, str_2
  j .return
.L3:
  ; basic/basic.e16.ts:329  return str('OVERFLOW')
  la a0, str_3
  j .return
.L4:
  ; basic/basic.e16.ts:331  return str('DIV BY 0')
  la a0, str_4
  j .return
.L5:
  ; basic/basic.e16.ts:333  return str('ARGUMENT')
  la a0, str_5
  j .return
.L6:
  ; basic/basic.e16.ts:335  return str('NO LINE')
  la a0, str_6
  j .return
.L7:
  ; basic/basic.e16.ts:337  return str('NEXT')
  la a0, str_7
  j .return
.L8:
  ; basic/basic.e16.ts:339  return str('RETURN')
  la a0, str_8
  j .return
.L9:
  ; basic/basic.e16.ts:341  return str('MEMORY')
  la a0, str_9
  j .return
.L10:
  ; basic/basic.e16.ts:343  return str('TOO COMPLEX')
  la a0, str_10
  j .return
.L11:
  ; basic/basic.e16.ts:345  return str('CONT')
  la a0, str_11
  j .return
.L12:
  ; basic/basic.e16.ts:347  return moreErrorWord(code)
  mv a0, s1
  call moreErrorWord
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:351 moreErrorWord(code) at -O1
;   code in a0
moreErrorWord:
  ; basic/basic.e16.ts:352  switch (code) {
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
  j .L8
.L2:
  ; basic/basic.e16.ts:354  return str('TYPE')
  la a0, str_12
  ret
.L3:
  ; basic/basic.e16.ts:356  return str('NO FILE')
  la a0, str_13
  ret
.L4:
  ; basic/basic.e16.ts:358  return str('CARD')
  la a0, str_14
  ret
.L5:
  ; basic/basic.e16.ts:360  return str('NO DATA')
  la a0, str_15
  ret
.L6:
  ; basic/basic.e16.ts:362  return str('INDEX')
  la a0, str_16
  ret
.L7:
  ; basic/basic.e16.ts:364  return str('DIM')
  la a0, str_17
  ret
.L8:
  ; basic/basic.e16.ts:366  return str('FILE')
  la a0, str_18
.return:
  ret

; basic/basic.e16.ts:371 inLine() at -O1
inLine:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:372  if (curLine === 0) return
  lw t0, 0x0110(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:372  return
  j .return
.L1:
  ; basic/basic.e16.ts:373  puts(str(' IN '))
  la a0, str_19
  call puts
  ; basic/basic.e16.ts:374  printUnsigned(peek16(curLine))
  lw t0, 0x0110(zero)
  lw a0, 0(t0)
  call printUnsigned
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:378 fail(code) at -O1
;   code in s1
fail:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; code
  ; basic/basic.e16.ts:379  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:380  puts(str('ERR:'))
  la a0, str_20
  call puts
  ; basic/basic.e16.ts:381  puts(errorWord(code))
  mv a0, s1
  call errorWord
  call puts
  ; basic/basic.e16.ts:382  if (running) inLine()
  lw t0, 0x012e(zero)
  beqz t0, .L1
  ; basic/basic.e16.ts:382  inLine()
  call inLine
.L1:
  ; basic/basic.e16.ts:383  newline()
  call newline
  ; basic/basic.e16.ts:384  contLine = 0
  sw zero, 0x0130(zero)
  ; basic/basic.e16.ts:385  stopRunning()
  call stopRunning
  ; basic/basic.e16.ts:386  basic_abort()
  call basic_abort
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:390 checkBreak() at -O1
checkBreak:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:391  if (peek16(BRKFLAG) === 0) return
  lw t0, 30(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:391  return
  j .return
.L1:
  ; basic/basic.e16.ts:392  poke16(BRKFLAG, 0)
  sw zero, 30(zero)
  ; basic/basic.e16.ts:393  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:394  puts(str('BREAK'))
  la a0, str_21
  call puts
  ; basic/basic.e16.ts:395  if (running) inLine()
  lw t0, 0x012e(zero)
  beqz t0, .L2
  ; basic/basic.e16.ts:395  inLine()
  call inLine
.L2:
  ; basic/basic.e16.ts:396  newline()
  call newline
  ; basic/basic.e16.ts:397  contLine = curLine
  lw t0, 0x0110(zero)
  sw t0, 0x0130(zero)
  ; basic/basic.e16.ts:398  contTxt = txt
  lw t0, 0x010e(zero)
  sw t0, 0x0132(zero)
  ; basic/basic.e16.ts:399  stopRunning()
  call stopRunning
  ; basic/basic.e16.ts:400  basic_abort()
  call basic_abort
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:403 marks() at -O1
;   m in s1
marks:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:404  let m: u16 = proMode ? ANN_PRO : ANN_RUN
  lw t0, 0x013a(zero)
  beqz t0, .L1
  li t0, 32
  j .L2
.L1:
  li t0, 16
.L2:
  mv s1, t0 ; m
  ; basic/basic.e16.ts:405  m |= angleMarks
  lw t0, 0x013c(zero)
  or s1, s1, t0
  ; basic/basic.e16.ts:406  if (running) m |= ANN_BUSY
  lw t0, 0x012e(zero)
  beqz t0, .L3
  ; basic/basic.e16.ts:406  m |= ANN_BUSY
  ori s1, s1, 1
.L3:
  ; basic/basic.e16.ts:407  poke16(ANNMODE, m)
  sw s1, 26(zero)
  ; basic/basic.e16.ts:408  annunciate()
  call annunciate
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:411 stopRunning() at -O1
stopRunning:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:412  running = false
  sw zero, 0x012e(zero)
  ; basic/basic.e16.ts:413  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:414  outFile = 0
  sw zero, 0x011c(zero)
  ; basic/basic.e16.ts:416  if (filesOpen) closeFiles()
  lw t0, 0x0122(zero)
  beqz t0, .L1
  ; basic/basic.e16.ts:416  closeFiles()
  la t0, closeFiles
  li t1, 2
  call far_call
.L1:
  ; basic/basic.e16.ts:417  marks()
  call marks
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:423 next() at -O1
next:
  ; basic/basic.e16.ts:424  while (peek(txt) === CH_SPACE) txt++
  j .L3
.L1:
  ; basic/basic.e16.ts:424  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.L3:
  lw t0, 0x010e(zero)
  lbu t0, 0(t0)
  li t1, 32
  beq t0, t1, .L1
  ; basic/basic.e16.ts:425  return peek(txt)
  lw t0, 0x010e(zero)
  lbu a0, 0(t0)
.return:
  ret

; basic/basic.e16.ts:428 expect(c) at -O1
;   c in s1
expect:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/basic.e16.ts:429  if (next() !== c) fail(E_SYNTAX)
  call next
  beq a0, s1, .L1
  ; basic/basic.e16.ts:429  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:430  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:433 isDigit(c) at -O1
;   c in a0
isDigit:
  ; basic/basic.e16.ts:434  return c >= CH_0 && c <= CH_9
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

; basic/basic.e16.ts:438 readUnsigned() at -O1
;   v in s1
readUnsigned:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:439  next()
  call next
  ; basic/basic.e16.ts:440  if (!isDigit(peek(txt))) fail(E_SYNTAX)
  lw t0, 0x010e(zero)
  lbu a0, 0(t0)
  call isDigit
  bnez a0, .L1
  ; basic/basic.e16.ts:440  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:441  let v: u16 = 0
  li s1, 0 ; v
  ; basic/basic.e16.ts:442  while (isDigit(peek(txt))) {
  j .L4
.L2:
  ; basic/basic.e16.ts:443  v = moreDigit(v, peek(txt) - CH_0)
  lw t0, 0x010e(zero)
  lbu t0, 0(t0)
  mv a0, s1
  addi a1, t0, -48
  call moreDigit
  mv s1, a0 ; v
  ; basic/basic.e16.ts:444  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.L4:
  lw t0, 0x010e(zero)
  lbu a0, 0(t0)
  call isDigit
  bnez a0, .L2
  ; basic/basic.e16.ts:446  return v
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:450 moreDigit(v, d) at -O1
;   v in s1
;   d in s2
moreDigit:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; v
  mv s2, a1 ; d
  ; basic/basic.e16.ts:451  if (v > 6553 || (v === 6553 && d > 5)) fail(E_LINE)
  li t0, 6553
  bltu t0, s1, .L2
  li t0, 6553
  bne s1, t0, .L1
  li t0, 5
  bgeu t0, s2, .L1
.L2:
  ; basic/basic.e16.ts:451  fail(E_LINE)
  li a0, 5
  call fail
.L1:
  ; basic/basic.e16.ts:452  return v * 10 + d
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

; basic/basic.e16.ts:458 math(op, a, b) at -O1
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
  ; basic/basic.e16.ts:459  poke16(MATH_A, a)
  li t0, 65362
  sw s3, 0(t0)
  ; basic/basic.e16.ts:460  poke16(MATH_B, b)
  li t0, 65364
  sw s0, 0(t0)
  ; basic/basic.e16.ts:461  poke16(MATH_OP, op)
  li t0, 65360
  sw s2, 0(t0)
  ; basic/basic.e16.ts:462  const status = peek16(MATH_STATUS)
  li t0, 65368
  lw s1, 0(t0)
  ; basic/basic.e16.ts:463  if (status === 0) return
  bne s1, zero, .L1
  ; basic/basic.e16.ts:463  return
  j .return
.L1:
  ; basic/basic.e16.ts:464  if (status === 1) fail(E_OVERFLOW)
  li t0, 1
  bne s1, t0, .L2
  ; basic/basic.e16.ts:464  fail(E_OVERFLOW)
  li a0, 2
  call fail
.L2:
  ; basic/basic.e16.ts:465  if (status === 2) fail(E_DIVIDE)
  li t0, 2
  bne s1, t0, .L3
  ; basic/basic.e16.ts:465  fail(E_DIVIDE)
  li a0, 3
  call fail
.L3:
  ; basic/basic.e16.ts:466  fail(E_ARGUMENT)
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

; basic/basic.e16.ts:470 push() at -O1
;   at in s1
push:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:471  if (nsp >= addr(nums) + 192) fail(E_COMPLEX)
  lw t0, 0x0116(zero)
  li t1, nums+192
  bltu t0, t1, .L1
  ; basic/basic.e16.ts:471  fail(E_COMPLEX)
  li a0, 9
  call fail
.L1:
  ; basic/basic.e16.ts:472  const at = nsp
  lw s1, 0x0116(zero)
  ; basic/basic.e16.ts:473  nsp += 8
  lw t0, 0x0116(zero)
  addi t0, t0, 8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:474  return at
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:477 top() at -O1
top:
  ; basic/basic.e16.ts:478  return nsp - 8
  lw t0, 0x0116(zero)
  addi a0, t0, -8
.return:
  ret

; basic/basic.e16.ts:481 copy8(from, to) at -O1
;   from in a0
;   to in a1
copy8:
  ; basic/basic.e16.ts:482  poke16(to, peek16(from))
  lw t0, 0(a0)
  sw t0, 0(a1)
  ; basic/basic.e16.ts:483  poke16(to + 2, peek16(from + 2))
  lw t0, 2(a0)
  sw t0, 2(a1)
  ; basic/basic.e16.ts:484  poke16(to + 4, peek16(from + 4))
  lw t0, 4(a0)
  sw t0, 4(a1)
  ; basic/basic.e16.ts:485  poke16(to + 6, peek16(from + 6))
  lw t0, 6(a0)
  sw t0, 6(a1)
.return:
  ret

; basic/basic.e16.ts:488 isZero(at) at -O1
;   at in a0
isZero:
  ; basic/basic.e16.ts:489  return peek(at + 2) === 0
  lbu t0, 2(a0)
  sub t0, t0, zero
  seqz a0, t0
.return:
  ret

; basic/basic.e16.ts:492 setInt(at, v) at -O1
;   at in s1
;   v in s2
setInt:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; at
  mv s2, a1 ; v
  ; basic/basic.e16.ts:493  poke16(MATH_ARG, u16(v))
  li t0, 65366
  sw s2, 0(t0)
  ; basic/basic.e16.ts:494  math(M_FROMINT, at, 0)
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

; basic/basic.e16.ts:498 toInt(at) at -O1
;   at in s1
toInt:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; basic/basic.e16.ts:499  math(M_TOINT, at, 0)
  li a0, 49
  mv a1, s1
  li a2, 0
  call math
  ; basic/basic.e16.ts:500  return i16(peek16(MATH_ARG))
  li t0, 65366
  lw a0, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:504 toWord(at) at -O1
;   at in s1
toWord:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; basic/basic.e16.ts:505  math(M_TOWORD, at, 0)
  li a0, 50
  mv a1, s1
  li a2, 0
  call math
  ; basic/basic.e16.ts:506  return peek16(MATH_ARG)
  li t0, 65366
  lw a0, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:510 binary(op) at -O1
;   op in s1
;   b in s2
binary:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; op
  ; basic/basic.e16.ts:511  const b = top()
  call top
  mv s2, a0 ; b
  ; basic/basic.e16.ts:512  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:513  math(op, top(), b)
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

; basic/basic.e16.ts:517 pushString(at, length) at -O1
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
  ; basic/basic.e16.ts:518  const e = push()
  call push
  mv s1, a0 ; e
  ; basic/basic.e16.ts:519  poke(e, STR_MARK)
  li t0, 255
  sb t0, 0(s1)
  ; basic/basic.e16.ts:520  poke(e + 1, length)
  sb s3, 1(s1)
  ; basic/basic.e16.ts:521  poke16(e + 2, at)
  sw s2, 2(s1)
  ; basic/basic.e16.ts:522  strType = true
  li t0, 1
  sw t0, 0x0118(zero)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:525 stringLength(e) at -O1
;   e in a0
stringLength:
  ; basic/basic.e16.ts:526  return peek(e + 1)
  lbu a0, 1(a0)
.return:
  ret

; basic/basic.e16.ts:529 stringAt(e) at -O1
;   e in a0
stringAt:
  ; basic/basic.e16.ts:530  return peek16(e + 2)
  lw a0, 2(a0)
.return:
  ret

; basic/basic.e16.ts:534 tempString(length) at -O1
;   length in s1
;   at in s2
tempString:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; length
  ; basic/basic.e16.ts:535  if (strTop + length > 512) fail(E_COMPLEX)
  lw t0, 0x0504(zero)
  add t0, t0, s1
  li t1, 512
  bgeu t1, t0, .L1
  ; basic/basic.e16.ts:535  fail(E_COMPLEX)
  li a0, 9
  call fail
.L1:
  ; basic/basic.e16.ts:536  const at = addr(strTemp) + strTop
  lw t0, 0x0504(zero)
  addi s2, t0, strTemp
  ; basic/basic.e16.ts:537  strTop += length
  lw t0, 0x0504(zero)
  add t0, t0, s1
  sw t0, 0x0504(zero)
  ; basic/basic.e16.ts:538  return at
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:542 needNumber() at -O1
needNumber:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:543  if (strType) fail(E_TYPE)
  lw t0, 0x0118(zero)
  beqz t0, .L1
  ; basic/basic.e16.ts:543  fail(E_TYPE)
  li a0, 11
  call fail
.L1:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:546 needString() at -O1
needString:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:547  if (!strType) fail(E_TYPE)
  lw t0, 0x0118(zero)
  bnez t0, .L1
  ; basic/basic.e16.ts:547  fail(E_TYPE)
  li a0, 11
  call fail
.L1:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:551 literal() at -O1
;   at in s2
;   n in s1
literal:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; basic/basic.e16.ts:552  strType = false
  sw zero, 0x0118(zero)
  ; basic/basic.e16.ts:553  const at = push()
  call push
  mv s2, a0 ; at
  ; basic/basic.e16.ts:555  poke16(MATH_ARG, 255)
  li t0, 255
  li t1, 65366
  sw t0, 0(t1)
  ; basic/basic.e16.ts:556  math(M_PARSE, at, txt)
  lw t0, 0x010e(zero)
  li a0, 56
  mv a1, s2
  mv a2, t0
  call math
  ; basic/basic.e16.ts:557  const n = peek16(MATH_ARG)
  li t0, 65366
  lw s1, 0(t0)
  ; basic/basic.e16.ts:558  if (n === 0) fail(E_SYNTAX)
  bne s1, zero, .L1
  ; basic/basic.e16.ts:558  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:559  txt += n
  lw t0, 0x010e(zero)
  add t0, t0, s1
  sw t0, 0x010e(zero)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:563 formatTop() at -O1
;   n in s1
formatTop:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:564  poke16(MATH_ARG, 0)
  li t0, 65366
  sw zero, 0(t0)
  ; basic/basic.e16.ts:565  math(M_FORMAT, top(), addr(textOut))
  call top
  mv a1, a0
  li a0, 57
  la a2, textOut
  call math
  ; basic/basic.e16.ts:566  const n = peek16(MATH_ARG)
  li t0, 65366
  lw s1, 0(t0)
  ; basic/basic.e16.ts:567  poke(addr(textOut) + n, 0)
  sb zero, textOut(s1)
  ; basic/basic.e16.ts:568  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:579 nameKey() at -O1
nameKey:
  ; basic/basic.e16.ts:580  return name0 | (name1 << 8) | (nameIsString ? 0x8000 : 0)
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

; basic/basic.e16.ts:583 setNameKey(key) at -O1
;   key in a0
setNameKey:
  ; basic/basic.e16.ts:584  name0 = key & 0xff
  andi t0, a0, 255
  sw t0, 0x0616(zero)
  ; basic/basic.e16.ts:585  name1 = (key >> 8) & 0x7f
  srli t0, a0, 8
  andi t0, t0, 127
  sw t0, 0x0618(zero)
  ; basic/basic.e16.ts:586  nameIsString = (key & 0x8000) !== 0
  li t0, 32768
  and t0, a0, t0
  sub t0, t0, zero
  snez t0, t0
  sw t0, 0x061a(zero)
.return:
  ret

; basic/basic.e16.ts:590 readName() at -O1
readName:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:591  next()
  call next
  ; basic/basic.e16.ts:592  name0 = peek(txt)
  lw t0, 0x010e(zero)
  lbu t0, 0(t0)
  sw t0, 0x0616(zero)
  ; basic/basic.e16.ts:593  if (!isLetter(name0)) fail(E_SYNTAX)
  mv a0, t0
  call isLetter
  bnez a0, .L1
  ; basic/basic.e16.ts:593  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:594  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:595  name1 = peek(txt)
  lbu t0, 0(t0)
  sw t0, 0x0618(zero)
  ; basic/basic.e16.ts:596  if (isLetter(name1) || isDigit(name1)) txt++
  mv a0, t0
  call isLetter
  bnez a0, .L3
  lw a0, 0x0618(zero)
  call isDigit
  beqz a0, .L2
.L3:
  ; basic/basic.e16.ts:596  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  j .L4
.L2:
  ; basic/basic.e16.ts:597  name1 = 0
  sw zero, 0x0618(zero)
.L4:
  ; basic/basic.e16.ts:598  nameIsString = peek(txt) === CH_DOLLAR
  lw t0, 0x010e(zero)
  lbu t0, 0(t0)
  li t1, 36
  sub t0, t0, t1
  seqz t0, t0
  sw t0, 0x061a(zero)
  ; basic/basic.e16.ts:599  if (nameIsString) txt++
  beqz t0, .L5
  ; basic/basic.e16.ts:599  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.L5:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:603 findRecord(kind) at -O1
;   kind in a0
;   at in a1
findRecord:
  ; basic/basic.e16.ts:604  let at = progEnd + 2
  lw t0, 0x0112(zero)
  addi a1, t0, 2
  ; basic/basic.e16.ts:605  while (at < varEnd) {
  j .L3
.L1:
  ; basic/basic.e16.ts:606  if (peek(at) === name0 && peek(at + 1) === name1 && (peek(at + 2) & 3) === (kind & 3)) return at
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
  ; basic/basic.e16.ts:606  return at
  mv a0, a1
  ret
.L5:
  ; basic/basic.e16.ts:607  at += peek16(at + 4)
  lw t0, 4(a1)
  add a1, a1, t0
.L3:
  lw t0, 0x0114(zero)
  bltu a1, t0, .L1
  ; basic/basic.e16.ts:609  return 0
  li a0, 0
.return:
  ret

; basic/basic.e16.ts:613 newRecord(kind, room, size) at -O1
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
  ; basic/basic.e16.ts:614  if (size > LIMIT - varEnd) fail(E_MEMORY)
  lw t0, 0x0114(zero)
  li t1, 28672
  sub t1, t1, t0
  bgeu t1, s2, .L1
  ; basic/basic.e16.ts:614  fail(E_MEMORY)
  li a0, 8
  call fail
.L1:
  ; basic/basic.e16.ts:615  const at = varEnd
  lw s1, 0x0114(zero)
  ; basic/basic.e16.ts:616  poke(at, name0)
  lw t0, 0x0616(zero)
  sb t0, 0(s1)
  ; basic/basic.e16.ts:617  poke(at + 1, name1)
  lw t0, 0x0618(zero)
  sb t0, 1(s1)
  ; basic/basic.e16.ts:618  poke(at + 2, kind)
  lw t0, 0(fp) ; kind
  sb t0, 2(s1)
  ; basic/basic.e16.ts:619  poke(at + 3, room)
  lw t0, 2(fp) ; room
  sb t0, 3(s1)
  ; basic/basic.e16.ts:620  poke16(at + 4, size)
  sw s2, 4(s1)
  ; basic/basic.e16.ts:621  for (let k: u16 = VAR_HEAD; k < size; k += 2) poke16(at + k, 0)
  li s3, 6 ; k
  j .L4
.L2:
  ; basic/basic.e16.ts:621  poke16(at + k, 0)
  add t0, s1, s3
  sw zero, 0(t0)
  addi s3, s3, 2
.L4:
  bltu s3, s2, .L2
  ; basic/basic.e16.ts:622  varEnd += size
  lw t0, 0x0114(zero)
  add t0, t0, s2
  sw t0, 0x0114(zero)
  ; basic/basic.e16.ts:623  return at
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

; basic/basic.e16.ts:627 stringSize(room) at -O1
;   room in a0
stringSize:
  ; basic/basic.e16.ts:628  return (VAR_HEAD + 1 + room + 1) & 0xfffe
  addi t0, a0, 8
  andi a0, t0, -2
.return:
  ret

; basic/basic.e16.ts:635 varAt(make) at -O1
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
  ; basic/basic.e16.ts:636  readName()
  call readName
  ; basic/basic.e16.ts:637  strType = nameIsString
  lw t0, 0x061a(zero)
  sw t0, 0x0118(zero)
  ; basic/basic.e16.ts:638  if (next() === CH_LPAREN) return elementAt()
  call next
  li t0, 40
  bne a0, t0, .L1
  ; basic/basic.e16.ts:638  return elementAt()
  la t0, elementAt
  li t1, 0
  call far_call
  j .return
.L1:
  ; basic/basic.e16.ts:639  const kind: u16 = nameIsString ? K_STRING : 0
  lw t0, 0x061a(zero)
  beqz t0, .L2
  li t0, 1
  j .L3
.L2:
  li t0, 0
.L3:
  mv s2, t0 ; kind
  ; basic/basic.e16.ts:640  let at = findRecord(kind)
  mv a0, s2
  call findRecord
  mv s1, a0 ; at
  ; basic/basic.e16.ts:641  if (at === 0) {
  bne s1, zero, .L4
  ; basic/basic.e16.ts:642  if (!make) return 0
  bnez s3, .L5
  ; basic/basic.e16.ts:642  return 0
  li a0, 0
  j .return
.L5:
  ; basic/basic.e16.ts:643  at = nameIsString
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
  ; basic/basic.e16.ts:647  varRoom = peek(at + 3)
  lbu t0, 3(s1)
  sw t0, 0x011a(zero)
  ; basic/basic.e16.ts:648  return at + VAR_HEAD
  addi a0, s1, 6
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:652 storeString(at, room) at -O1
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
  ; basic/basic.e16.ts:653  const e = top()
  call top
  mv s0, a0 ; e
  ; basic/basic.e16.ts:654  let n = stringLength(e)
  mv a0, s0
  call stringLength
  mv s1, a0 ; n
  ; basic/basic.e16.ts:655  if (n > room) n = room
  bgeu s3, s1, .L1
  ; basic/basic.e16.ts:655  n = room
  mv s1, s3 ; n
.L1:
  ; basic/basic.e16.ts:656  move(stringAt(e), at + 1, n)
  mv a0, s0
  call stringAt
  addi a1, s2, 1
  mv a2, s1
  call move
  ; basic/basic.e16.ts:657  poke(at, n)
  sb s1, 0(s2)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:660 clearVariables() at -O1
clearVariables:
  ; basic/basic.e16.ts:661  varEnd = progEnd + 2
  lw t0, 0x0112(zero)
  addi t0, t0, 2
  sw t0, 0x0114(zero)
  ; basic/basic.e16.ts:662  fsp = 0
  sw zero, 0x012a(zero)
  ; basic/basic.e16.ts:663  gsp = 0
  sw zero, 0x012c(zero)
  ; basic/basic.e16.ts:664  dataLine = 0
  sw zero, 0x011e(zero)
  ; basic/basic.e16.ts:665  dataAt = 0
  sw zero, 0x0120(zero)
.return:
  ret

; basic/basic.e16.ts:671 expr() at -O1
expr:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:673  if (stack_room() < EXPR_STACK) fail(E_COMPLEX)
  call stack_room
  li t0, 256
  bgeu a0, t0, .L1
  ; basic/basic.e16.ts:673  fail(E_COMPLEX)
  li a0, 9
  call fail
.L1:
  ; basic/basic.e16.ts:674  andExpr()
  call andExpr
  ; basic/basic.e16.ts:675  while (next() === T_OR) {
  j .L4
.L2:
  ; basic/basic.e16.ts:676  needNumber()
  call needNumber
  ; basic/basic.e16.ts:677  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:678  andExpr()
  call andExpr
  ; basic/basic.e16.ts:679  logical(false)
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

; basic/basic.e16.ts:683 andExpr() at -O1
andExpr:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:684  notExpr()
  call notExpr
  ; basic/basic.e16.ts:685  while (next() === T_AND) {
  j .L3
.L1:
  ; basic/basic.e16.ts:686  needNumber()
  call needNumber
  ; basic/basic.e16.ts:687  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:688  notExpr()
  call notExpr
  ; basic/basic.e16.ts:689  logical(true)
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

; basic/basic.e16.ts:694 logical(both) at -O1
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
  ; basic/basic.e16.ts:695  needNumber()
  call needNumber
  ; basic/basic.e16.ts:696  const b = !isZero(top())
  call top
  call isZero
  seqz s1, a0
  ; basic/basic.e16.ts:697  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:698  const a = !isZero(top())
  call top
  call isZero
  seqz s2, a0
  ; basic/basic.e16.ts:699  setInt(top(), (both ? a && b : a || b) ? 1 : 0)
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

; basic/basic.e16.ts:702 notExpr() at -O1
notExpr:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:703  if (next() === T_NOT) {
  call next
  li t0, 198
  bne a0, t0, .L1
  ; basic/basic.e16.ts:704  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:705  notExpr()
  call notExpr
  ; basic/basic.e16.ts:706  needNumber()
  call needNumber
  ; basic/basic.e16.ts:707  setInt(top(), isZero(top()) ? 1 : 0)
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
  ; basic/basic.e16.ts:708  return
  j .return
.L1:
  ; basic/basic.e16.ts:710  compare()
  call compare
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:714 compare() at -O1
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
  ; basic/basic.e16.ts:715  addExpr()
  call addExpr
  ; basic/basic.e16.ts:716  const want = relation()
  call relation
  mv s1, a0 ; want
  ; basic/basic.e16.ts:717  if (want === 0) return
  bne s1, zero, .L1
  ; basic/basic.e16.ts:717  return
  j .return
.L1:
  ; basic/basic.e16.ts:718  const strings = strType
  lw s2, 0x0118(zero)
  ; basic/basic.e16.ts:719  addExpr()
  call addExpr
  ; basic/basic.e16.ts:720  if (strType !== strings) fail(E_TYPE)
  lw t0, 0x0118(zero)
  beq t0, s2, .L2
  ; basic/basic.e16.ts:720  fail(E_TYPE)
  li a0, 11
  call fail
.L2:
  ; basic/basic.e16.ts:721  const r = strings ? compareStrings() : compareNumbers()
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
  ; basic/basic.e16.ts:722  const got: u16 = r === 0xffff ? 1 : r === 0 ? 2 : 4
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
  ; basic/basic.e16.ts:723  setInt(top(), (want & got) !== 0 ? 1 : 0)
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
  ; basic/basic.e16.ts:724  strType = false
  sw zero, 0x0118(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:728 relation() at -O1
;   c in s1
;   want in s2
;   d in s3
relation:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/basic.e16.ts:729  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:730  if (c !== CH_LT && c !== CH_EQ && c !== CH_GT) return 0
  li t0, 60
  beq s1, t0, .L1
  li t0, 61
  beq s1, t0, .L1
  li t0, 62
  beq s1, t0, .L1
  ; basic/basic.e16.ts:730  return 0
  li a0, 0
  j .return
.L1:
  ; basic/basic.e16.ts:731  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:732  let want: u16 = c === CH_LT ? 1 : c === CH_EQ ? 2 : 4
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
  ; basic/basic.e16.ts:733  const d = peek(txt)
  lw t0, 0x010e(zero)
  lbu s3, 0(t0)
  ; basic/basic.e16.ts:734  if (c !== CH_EQ && (d === CH_EQ || (c === CH_LT && d === CH_GT))) {
  li t0, 61
  beq s1, t0, .L6
  li t0, 61
  beq s3, t0, .L7
  li t0, 60
  bne s1, t0, .L6
  li t0, 62
  bne s3, t0, .L6
.L7:
  ; basic/basic.e16.ts:735  want |= d === CH_EQ ? 2 : 4
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
  ; basic/basic.e16.ts:736  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.L6:
  ; basic/basic.e16.ts:738  return want
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:742 compareNumbers() at -O1
;   b in s1
compareNumbers:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:743  const b = top()
  call top
  mv s1, a0 ; b
  ; basic/basic.e16.ts:744  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:745  math(M_CMP, top(), b)
  call top
  mv a1, a0
  li a0, 6
  mv a2, s1
  call math
  ; basic/basic.e16.ts:746  return peek16(MATH_RESULT)
  li t0, 65370
  lw a0, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:749 addExpr() at -O1
;   c in s1
;   strings in s2
addExpr:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; basic/basic.e16.ts:750  mulExpr()
  call mulExpr
  ; basic/basic.e16.ts:751  for (;;) {
.L1:
  ; basic/basic.e16.ts:752  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:753  if (c !== CH_PLUS && c !== CH_MINUS) return
  li t0, 43
  beq s1, t0, .L5
  li t0, 45
  beq s1, t0, .L5
  ; basic/basic.e16.ts:753  return
  j .return
.L5:
  ; basic/basic.e16.ts:754  const strings = strType
  lw s2, 0x0118(zero)
  ; basic/basic.e16.ts:755  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:756  mulExpr()
  call mulExpr
  ; basic/basic.e16.ts:757  if (strType !== strings || (strings && c === CH_MINUS)) fail(E_TYPE)
  lw t0, 0x0118(zero)
  bne t0, s2, .L7
  beqz s2, .L6
  li t0, 45
  bne s1, t0, .L6
.L7:
  ; basic/basic.e16.ts:757  fail(E_TYPE)
  li a0, 11
  call fail
.L6:
  ; basic/basic.e16.ts:758  if (strings) join()
  beqz s2, .L8
  ; basic/basic.e16.ts:758  join()
  la t0, join
  li t1, 0
  call far_call
  j .L1
.L8:
  ; basic/basic.e16.ts:759  binary(c === CH_PLUS ? M_ADD : M_SUB)
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

; basic/basic.e16.ts:763 mulExpr() at -O1
;   c in s1
mulExpr:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:764  unary()
  call unary
  ; basic/basic.e16.ts:765  for (;;) {
.L1:
  ; basic/basic.e16.ts:766  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:767  if (c !== CH_STAR && c !== CH_SLASH) return
  li t0, 42
  beq s1, t0, .L5
  li t0, 47
  beq s1, t0, .L5
  ; basic/basic.e16.ts:767  return
  j .return
.L5:
  ; basic/basic.e16.ts:768  needNumber()
  call needNumber
  ; basic/basic.e16.ts:769  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:770  unary()
  call unary
  ; basic/basic.e16.ts:771  needNumber()
  call needNumber
  ; basic/basic.e16.ts:772  binary(c === CH_STAR ? M_MUL : M_DIV)
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

; basic/basic.e16.ts:780 unary() at -O1
;   c in s1
unary:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:781  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:782  if (c === CH_MINUS) {
  li t0, 45
  bne s1, t0, .L1
  ; basic/basic.e16.ts:783  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:784  unary()
  call unary
  ; basic/basic.e16.ts:785  needNumber()
  call needNumber
  ; basic/basic.e16.ts:786  math(M_NEG, top(), 0)
  call top
  mv a1, a0
  li a0, 16
  li a2, 0
  call math
  ; basic/basic.e16.ts:787  return
  j .return
.L1:
  ; basic/basic.e16.ts:789  if (c === CH_PLUS) txt++
  li t0, 43
  bne s1, t0, .L2
  ; basic/basic.e16.ts:789  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.L2:
  ; basic/basic.e16.ts:790  power()
  call power
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:793 power() at -O1
power:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:794  primary()
  call primary
  ; basic/basic.e16.ts:795  if (next() !== CH_CARET) return
  call next
  li t0, 94
  beq a0, t0, .L1
  ; basic/basic.e16.ts:795  return
  j .return
.L1:
  ; basic/basic.e16.ts:796  needNumber()
  call needNumber
  ; basic/basic.e16.ts:797  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:798  unary()
  call unary
  ; basic/basic.e16.ts:799  needNumber()
  call needNumber
  ; basic/basic.e16.ts:800  binary(M_POW)
  li a0, 5
  call binary
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:803 primary() at -O1
;   c in s1
;   at in s2
primary:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; basic/basic.e16.ts:804  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:805  if (isDigit(c) || c === CH_DOT) {
  mv a0, s1
  call isDigit
  bnez a0, .L2
  li t0, 46
  bne s1, t0, .L1
.L2:
  ; basic/basic.e16.ts:806  literal()
  call literal
  ; basic/basic.e16.ts:807  return
  j .return
.L1:
  ; basic/basic.e16.ts:809  if (c === CH_QUOTE) {
  li t0, 34
  bne s1, t0, .L3
  ; basic/basic.e16.ts:811  const at = txt + 1
  lw t0, 0x010e(zero)
  addi s2, t0, 1
  ; basic/basic.e16.ts:812  txt = quoted(at, false)
  mv a0, s2
  li a1, 0
  call quoted
  sw a0, 0x010e(zero)
  ; basic/basic.e16.ts:813  pushString(at, txt - at - (peek(txt - 1) === CH_QUOTE ? 1 : 0))
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
  ; basic/basic.e16.ts:814  return
  j .return
.L3:
  ; basic/basic.e16.ts:816  if (c === CH_LPAREN) {
  li t0, 40
  bne s1, t0, .L6
  ; basic/basic.e16.ts:817  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:818  expr()
  call expr
  ; basic/basic.e16.ts:819  expect(CH_RPAREN)
  li a0, 41
  call expect
  ; basic/basic.e16.ts:820  return
  j .return
.L6:
  ; basic/basic.e16.ts:822  if (isLetter(c)) {
  mv a0, s1
  call isLetter
  beqz a0, .L7
  ; basic/basic.e16.ts:823  variableValue()
  call variableValue
  ; basic/basic.e16.ts:824  return
  j .return
.L7:
  ; basic/basic.e16.ts:826  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:827  functionCall(c)
  mv a0, s1
  call functionCall
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:831 variableValue() at -O1
;   at in s1
;   to in s2
variableValue:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; basic/basic.e16.ts:832  const at = varAt(false)
  li a0, 0
  call varAt
  mv s1, a0 ; at
  ; basic/basic.e16.ts:833  if (strType) {
  lw t0, 0x0118(zero)
  beqz t0, .L1
  ; basic/basic.e16.ts:834  if (at === 0) pushString(0, 0)
  bne s1, zero, .L2
  ; basic/basic.e16.ts:834  pushString(0, 0)
  li a0, 0
  li a1, 0
  call pushString
  j .L3
.L2:
  ; basic/basic.e16.ts:835  pushString(at + 1, peek(at))
  lbu t0, 0(s1)
  addi a0, s1, 1
  mv a1, t0
  call pushString
.L3:
  ; basic/basic.e16.ts:836  return
  j .return
.L1:
  ; basic/basic.e16.ts:838  const to = push()
  call push
  mv s2, a0 ; to
  ; basic/basic.e16.ts:839  if (at === 0) setInt(to, 0)
  bne s1, zero, .L4
  ; basic/basic.e16.ts:839  setInt(to, 0)
  mv a0, s2
  li a1, 0
  call setInt
  j .L5
.L4:
  ; basic/basic.e16.ts:840  copy8(at, to)
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

; basic/basic.e16.ts:848 functionCall(token) at -O1
;   token in s1
functionCall:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; token
  ; basic/basic.e16.ts:849  strType = false
  sw zero, 0x0118(zero)
  ; basic/basic.e16.ts:850  if (token >= T_LEN) {
  li t0, 201
  bltu s1, t0, .L1
  ; basic/basic.e16.ts:851  moreFunctions(token)
  mv a0, s1
  la t0, moreFunctions
  li t1, 0
  call far_call
  ; basic/basic.e16.ts:852  return
  j .return
.L1:
  ; basic/basic.e16.ts:854  if (token === T_POINT) {
  li t0, 197
  bne s1, t0, .L2
  ; basic/basic.e16.ts:855  pointFunction()
  la t0, pointFunction
  li t1, 1
  call far_call
  ; basic/basic.e16.ts:856  return
  j .return
.L2:
  ; basic/basic.e16.ts:858  if (token >= T_SIN && token <= T_EXP) {
  li t0, 180
  bltu s1, t0, .L3
  li t0, 192
  bltu t0, s1, .L3
  ; basic/basic.e16.ts:859  unary()
  call unary
  ; basic/basic.e16.ts:860  needNumber()
  call needNumber
  ; basic/basic.e16.ts:861  math(peek(FUNCTION_OPS + (token - T_SIN)), top(), 0)
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
  ; basic/basic.e16.ts:862  return
  j .return
.L3:
  ; basic/basic.e16.ts:864  if (token === T_PI) {
  li t0, 194
  bne s1, t0, .L4
  ; basic/basic.e16.ts:865  math(M_PI, push(), 0)
  call push
  mv a1, a0
  li a0, 32
  li a2, 0
  call math
  ; basic/basic.e16.ts:866  return
  j .return
.L4:
  ; basic/basic.e16.ts:868  if (token === T_ANS) {
  li t0, 195
  bne s1, t0, .L5
  ; basic/basic.e16.ts:869  copy8(addr(ans), push())
  call push
  mv a1, a0
  la a0, ans
  call copy8
  ; basic/basic.e16.ts:870  return
  j .return
.L5:
  ; basic/basic.e16.ts:872  if (token === T_RND) {
  li t0, 193
  bne s1, t0, .L6
  ; basic/basic.e16.ts:873  random()
  call random
  ; basic/basic.e16.ts:874  return
  j .return
.L6:
  ; basic/basic.e16.ts:876  if (token === T_PEEK) {
  li t0, 196
  bne s1, t0, .L7
  ; basic/basic.e16.ts:877  unary()
  call unary
  ; basic/basic.e16.ts:878  needNumber()
  call needNumber
  ; basic/basic.e16.ts:879  setInt(top(), peek(toWord(top())))
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
  ; basic/basic.e16.ts:880  return
  j .return
.L7:
  ; basic/basic.e16.ts:882  fail(E_SYNTAX)
  li a0, 1
  call fail
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:886 random() at -O1
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
  ; basic/basic.e16.ts:887  unary()
  call unary
  ; basic/basic.e16.ts:888  needNumber()
  call needNumber
  ; basic/basic.e16.ts:889  const n = top()
  call top
  mv s2, a0 ; n
  ; basic/basic.e16.ts:890  const r = push()
  call push
  mv s1, a0 ; r
  ; basic/basic.e16.ts:891  math(M_RND, r, 0)
  li a0, 31
  mv a1, s1
  li a2, 0
  call math
  ; basic/basic.e16.ts:892  const one = push()
  call push
  mv s3, a0 ; one
  ; basic/basic.e16.ts:893  setInt(one, 1)
  mv a0, s3
  li a1, 1
  call setInt
  ; basic/basic.e16.ts:894  math(M_CMP, n, one)
  li a0, 6
  mv a1, s2
  mv a2, s3
  call math
  ; basic/basic.e16.ts:895  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:896  if (peek16(MATH_RESULT) === 0xffff) {
  li t0, 65370
  lw t0, 0(t0)
  li t1, 65535
  bne t0, t1, .L1
  ; basic/basic.e16.ts:897  copy8(r, n)
  mv a0, s1
  mv a1, s2
  call copy8
  ; basic/basic.e16.ts:898  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:899  return
  j .return
.L1:
  ; basic/basic.e16.ts:901  math(M_MUL, r, n)
  li a0, 3
  mv a1, s1
  mv a2, s2
  call math
  ; basic/basic.e16.ts:902  math(M_INT, r, 0)
  li a0, 18
  mv a1, s1
  li a2, 0
  call math
  ; basic/basic.e16.ts:903  copy8(r, n)
  mv a0, s1
  mv a1, s2
  call copy8
  ; basic/basic.e16.ts:904  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:905  const k = push()
  call push
  mv s0, a0 ; k
  ; basic/basic.e16.ts:906  setInt(k, 1)
  mv a0, s0
  li a1, 1
  call setInt
  ; basic/basic.e16.ts:907  binary(M_ADD)
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

; basic/basic.e16.ts:913 findLine(n, exact) at -O1
;   n in a0
;   exact in a1
;   at in a2
;   here in a3
findLine:
  ; basic/basic.e16.ts:914  let at = PROG
  li a2, 2048 ; at
  ; basic/basic.e16.ts:915  while (peek16(at) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:916  const here = peek16(at)
  lw a3, 0(a2)
  ; basic/basic.e16.ts:917  if (here === n) return at
  bne a3, a0, .L5
  ; basic/basic.e16.ts:917  return at
  mv a0, a2
  ret
.L5:
  ; basic/basic.e16.ts:918  if (here > n) return exact ? 0 : at
  bgeu a0, a3, .L6
  ; basic/basic.e16.ts:918  return exact ? 0 : at
  beqz a1, .L7
  li t0, 0
  j .L8
.L7:
  mv t0, a2
.L8:
  mv a0, t0
  ret
.L6:
  ; basic/basic.e16.ts:919  at += peek16(at + 2)
  lw t0, 2(a2)
  add a2, a2, t0
.L3:
  lw t0, 0(a2)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:921  return 0
  li a0, 0
.return:
  ret

; basic/basic.e16.ts:925 move(from, to, count) at -O1
;   from in a0
;   to in a1
;   count in a2
;   k in a3
move:
  ; basic/basic.e16.ts:926  if (to < from) {
  bgeu a1, a0, .L1
  ; basic/basic.e16.ts:927  for (let k: u16 = 0; k < count; k++) poke(to + k, peek(from + k))
  li a3, 0 ; k
  j .L4
.L2:
  ; basic/basic.e16.ts:927  poke(to + k, peek(from + k))
  add t0, a1, a3
  add t1, a0, a3
  lbu t1, 0(t1)
  sb t1, 0(t0)
  addi a3, a3, 1
.L4:
  bltu a3, a2, .L2
  ; basic/basic.e16.ts:928  return
  ret
.L1:
  ; basic/basic.e16.ts:930  let k = count
  mv a3, a2 ; k
  ; basic/basic.e16.ts:931  while (k > 0) {
  j .L8
.L6:
  ; basic/basic.e16.ts:932  k--
  addi a3, a3, -1
  ; basic/basic.e16.ts:933  poke(to + k, peek(from + k))
  add t0, a1, a3
  add t1, a0, a3
  lbu t1, 0(t1)
  sb t1, 0(t0)
.L8:
  bltu zero, a3, .L6
.return:
  ret

; basic/basic.e16.ts:938 storeLine(n, text, length) at -O1
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
  ; basic/basic.e16.ts:939  const old = findLine(n, true)
  lw a0, 0(fp)
  li a1, 1
  call findLine
  mv s3, a0 ; old
  ; basic/basic.e16.ts:940  if (old !== 0) {
  beq s3, zero, .L1
  ; basic/basic.e16.ts:941  const size = peek16(old + 2)
  lw s1, 2(s3)
  ; basic/basic.e16.ts:942  move(old + size, old, progEnd + 2 - (old + size))
  add t0, s3, s1
  lw t1, 0x0112(zero)
  add t2, s3, s1
  addi t1, t1, 2
  sub t1, t1, t2
  mv a0, t0
  mv a1, s3
  mv a2, t1
  call move
  ; basic/basic.e16.ts:943  progEnd -= size
  lw t0, 0x0112(zero)
  sub t0, t0, s1
  sw t0, 0x0112(zero)
.L1:
  ; basic/basic.e16.ts:945  if (length > 1) {
  li t0, 1
  lw t1, 2(fp) ; length
  bgeu t0, t1, .L2
  ; basic/basic.e16.ts:946  const size = (4 + length + 1) & 0xfffe
  lw t0, 2(fp) ; length
  addi t0, t0, 5
  andi s1, t0, -2
  ; basic/basic.e16.ts:947  if (progEnd + 2 + size > LIMIT) fail(E_MEMORY)
  lw t0, 0x0112(zero)
  addi t0, t0, 2
  add t0, t0, s1
  li t1, 28672
  bgeu t1, t0, .L3
  ; basic/basic.e16.ts:947  fail(E_MEMORY)
  li a0, 8
  call fail
.L3:
  ; basic/basic.e16.ts:948  let at = findLine(n, false)
  lw a0, 0(fp)
  li a1, 0
  call findLine
  mv s2, a0 ; at
  ; basic/basic.e16.ts:949  if (at === 0) at = progEnd
  bne s2, zero, .L4
  ; basic/basic.e16.ts:949  at = progEnd
  lw s2, 0x0112(zero)
.L4:
  ; basic/basic.e16.ts:950  move(at, at + size, progEnd + 2 - at)
  add t0, s2, s1
  lw t1, 0x0112(zero)
  addi t1, t1, 2
  sub t1, t1, s2
  mv a0, s2
  mv a1, t0
  mv a2, t1
  call move
  ; basic/basic.e16.ts:951  poke16(at, n)
  lw t0, 0(fp) ; n
  sw t0, 0(s2)
  ; basic/basic.e16.ts:952  poke16(at + 2, size)
  sw s1, 2(s2)
  ; basic/basic.e16.ts:953  move(text, at + 4, length)
  lw a0, 4(fp)
  addi a1, s2, 4
  lw a2, 2(fp)
  call move
  ; basic/basic.e16.ts:954  progEnd += size
  lw t0, 0x0112(zero)
  add t0, t0, s1
  sw t0, 0x0112(zero)
.L2:
  ; basic/basic.e16.ts:956  poke16(progEnd, 0)
  lw t0, 0x0112(zero)
  sw zero, 0(t0)
  ; basic/basic.e16.ts:957  clearVariables()
  call clearVariables
  ; basic/basic.e16.ts:958  contLine = 0
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

; basic/basic.e16.ts:962 keepProgramTo(end) at -O1
;   end in s1
keepProgramTo:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; end
  ; basic/basic.e16.ts:963  progEnd = end
  sw s1, 0x0112(zero)
  ; basic/basic.e16.ts:964  poke16(end, 0)
  sw zero, 0(s1)
  ; basic/basic.e16.ts:965  clearVariables()
  call clearVariables
  ; basic/basic.e16.ts:966  contLine = 0
  sw zero, 0x0130(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:974 keptProgramEnd() at -O1
;   at in a0
;   last in a2
;   n in a3
;   size in a1
keptProgramEnd:
  ; basic/basic.e16.ts:975  let at: u16 = PROG
  li a0, 2048 ; at
  ; basic/basic.e16.ts:976  let last: u16 = 0
  li a2, 0 ; last
  ; basic/basic.e16.ts:977  while (peek16(at) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:978  const n = peek16(at)
  lw a3, 0(a0)
  ; basic/basic.e16.ts:979  const size = peek16(at + 2)
  lw a1, 2(a0)
  ; basic/basic.e16.ts:980  if (n <= last || size < 6 || (size & 1) !== 0 || size > LIMIT - 2 - at) return PROG
  bgeu a2, a3, .L6
  li t0, 6
  bltu a1, t0, .L6
  andi t0, a1, 1
  bne t0, zero, .L6
  li t0, 28670
  sub t0, t0, a0
  bgeu t0, a1, .L5
.L6:
  ; basic/basic.e16.ts:980  return PROG
  li a0, 2048
  ret
.L5:
  ; basic/basic.e16.ts:981  if (peek(at + size - 1) !== 0 && peek(at + size - 2) !== 0) return PROG
  add t0, a0, a1
  lbu t0, -1(t0)
  beq t0, zero, .L7
  add t0, a0, a1
  lbu t0, -2(t0)
  beq t0, zero, .L7
  ; basic/basic.e16.ts:981  return PROG
  li a0, 2048
  ret
.L7:
  ; basic/basic.e16.ts:982  last = n
  mv a2, a3 ; last
  ; basic/basic.e16.ts:983  at += size
  add a0, a0, a1
.L3:
  lw t0, 0(a0)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:985  return at
.return:
  ret

; basic/basic.e16.ts:990 jump(line, text) at -O1
;   line in a0
;   text in a1
jump:
  ; basic/basic.e16.ts:991  jumping = true
  li t0, 1
  sw t0, 0x0134(zero)
  ; basic/basic.e16.ts:992  jumpLine = line
  sw a0, 0x0136(zero)
  ; basic/basic.e16.ts:993  jumpTxt = text
  sw a1, 0x0138(zero)
.return:
  ret

; basic/basic.e16.ts:997 statements() at -O1
;   c in s1
statements:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:998  for (;;) {
.L1:
  ; basic/basic.e16.ts:999  checkBreak()
  call checkBreak
  ; basic/basic.e16.ts:1001  strTop = 0
  sw zero, 0x0504(zero)
  ; basic/basic.e16.ts:1002  statement()
  call statement
  ; basic/basic.e16.ts:1003  if (jumping || (!running && curLine !== 0)) return
  lw t0, 0x0134(zero)
  bnez t0, .L6
  lw t0, 0x012e(zero)
  bnez t0, .L5
  lw t0, 0x0110(zero)
  beq t0, zero, .L5
.L6:
  ; basic/basic.e16.ts:1003  return
  j .return
.L5:
  ; basic/basic.e16.ts:1004  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1005  if (c === CH_COLON) {
  li t0, 58
  bne s1, t0, .L7
  ; basic/basic.e16.ts:1006  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1007  continue
  j .L1
.L7:
  ; basic/basic.e16.ts:1010  if (c === 0 || c === T_ELSE) return
  beq s1, zero, .L9
  li t0, 137
  bne s1, t0, .L8
.L9:
  ; basic/basic.e16.ts:1010  return
  j .return
.L8:
  ; basic/basic.e16.ts:1011  fail(E_SYNTAX)
  li a0, 1
  call fail
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1015 statement() at -O1
;   c in s1
statement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1016  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1017  if (c === 0 || c === CH_COLON) return
  beq s1, zero, .L2
  li t0, 58
  bne s1, t0, .L1
.L2:
  ; basic/basic.e16.ts:1017  return
  j .return
.L1:
  ; basic/basic.e16.ts:1018  if (isLetter(c)) {
  mv a0, s1
  call isLetter
  beqz a0, .L3
  ; basic/basic.e16.ts:1019  assignment()
  call assignment
  ; basic/basic.e16.ts:1020  return
  j .return
.L3:
  ; basic/basic.e16.ts:1022  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1023  switch (c) {
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
  ; basic/basic.e16.ts:1025  printStatement()
  call printStatement
  ; basic/basic.e16.ts:1026  return
  j .return
.L6:
  ; basic/basic.e16.ts:1028  assignment()
  call assignment
  ; basic/basic.e16.ts:1029  return
  j .return
.L7:
  ; basic/basic.e16.ts:1031  ifStatement()
  call ifStatement
  ; basic/basic.e16.ts:1032  return
  j .return
.L8:
  ; basic/basic.e16.ts:1034  forStatement()
  call forStatement
  ; basic/basic.e16.ts:1035  return
  j .return
.L9:
  ; basic/basic.e16.ts:1037  nextStatement()
  call nextStatement
  ; basic/basic.e16.ts:1038  return
  j .return
.L10:
  ; basic/basic.e16.ts:1040  gotoStatement()
  call gotoStatement
  ; basic/basic.e16.ts:1041  return
  j .return
.L11:
  ; basic/basic.e16.ts:1043  gosubStatement()
  call gosubStatement
  ; basic/basic.e16.ts:1044  return
  j .return
.L12:
  ; basic/basic.e16.ts:1046  returnStatement()
  call returnStatement
  ; basic/basic.e16.ts:1047  return
  j .return
.L13:
  ; basic/basic.e16.ts:1049  toLineEnd()
  call toLineEnd
  ; basic/basic.e16.ts:1050  return
  j .return
.L14:
  ; basic/basic.e16.ts:1052  skipData()
  call skipData
  ; basic/basic.e16.ts:1053  return
  j .return
.L15:
  ; basic/basic.e16.ts:1055  commandStatement(c)
  mv a0, s1
  call commandStatement
  ; basic/basic.e16.ts:1056  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1061 skipData() at -O1
;   inside in a0
skipData:
  ; basic/basic.e16.ts:1062  let inside = false
  li a0, 0 ; inside
  ; basic/basic.e16.ts:1063  while (peek(txt) !== 0 && (inside || peek(txt) !== CH_COLON)) {
  j .L3
.L1:
  ; basic/basic.e16.ts:1064  if (peek(txt) === CH_QUOTE) inside = !inside
  lw t0, 0x010e(zero)
  lbu t0, 0(t0)
  li t1, 34
  bne t0, t1, .L5
  ; basic/basic.e16.ts:1064  inside = !inside
  seqz a0, a0
.L5:
  ; basic/basic.e16.ts:1065  txt++
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

; basic/basic.e16.ts:1069 commandStatement(c) at -O1
;   c in s1
commandStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1070  switch (c) {
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
  ; basic/basic.e16.ts:1072  inputStatement()
  la t0, inputStatement
  li t1, 0
  call far_call
  ; basic/basic.e16.ts:1073  return
  j .return
.L3:
  ; basic/basic.e16.ts:1075  offStatement()
  ; basic/basic.e16.ts:1379  poke16(IO_POWER, 0)
  li t0, 65286
  sw zero, 0(t0)
  ; basic/basic.e16.ts:1076  return
  j .return
.L4:
  ; basic/basic.e16.ts:1078  contLine = 0
  sw zero, 0x0130(zero)
  ; basic/basic.e16.ts:1079  endProgram()
  call endProgram
  ; basic/basic.e16.ts:1080  return
  j .return
.L5:
  ; basic/basic.e16.ts:1082  contLine = curLine
  lw t0, 0x0110(zero)
  sw t0, 0x0130(zero)
  ; basic/basic.e16.ts:1083  contTxt = txt
  lw t0, 0x010e(zero)
  sw t0, 0x0132(zero)
  ; basic/basic.e16.ts:1084  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1085  puts(str('STOP'))
  la a0, str_22
  call puts
  ; basic/basic.e16.ts:1086  inLine()
  call inLine
  ; basic/basic.e16.ts:1087  newline()
  call newline
  ; basic/basic.e16.ts:1088  endProgram()
  call endProgram
  ; basic/basic.e16.ts:1089  return
  j .return
.L6:
  ; basic/basic.e16.ts:1091  runStatement()
  call runStatement
  ; basic/basic.e16.ts:1092  return
  j .return
.L7:
  ; basic/basic.e16.ts:1094  listStatement()
  call listStatement
  ; basic/basic.e16.ts:1095  return
  j .return
.L8:
  ; basic/basic.e16.ts:1097  keepProgramTo(PROG)
  li a0, 2048
  call keepProgramTo
  ; basic/basic.e16.ts:1098  recallNo = 0
  sw zero, 0x013e(zero)
  ; basic/basic.e16.ts:1099  endProgram()
  call endProgram
  ; basic/basic.e16.ts:1100  return
  j .return
.L9:
  ; basic/basic.e16.ts:1102  contStatement()
  call contStatement
  ; basic/basic.e16.ts:1103  return
  j .return
.L10:
  ; basic/basic.e16.ts:1105  cls()
  call cls
  ; basic/basic.e16.ts:1106  return
  j .return
.L11:
  ; basic/basic.e16.ts:1108  pokeStatement()
  call pokeStatement
  ; basic/basic.e16.ts:1109  return
  j .return
.L12:
  ; basic/basic.e16.ts:1111  expr()
  call expr
  ; basic/basic.e16.ts:1112  call_at(toWord(top()))
  call top
  call toWord
  call call_at
  ; basic/basic.e16.ts:1113  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:1114  return
  j .return
.L13:
  ; basic/basic.e16.ts:1116  poke16(INBASIC, 0)
  sw zero, 28(zero)
  ; basic/basic.e16.ts:1117  monitor()
  call monitor
  ; basic/basic.e16.ts:1118  return
  j .return
.L14:
  ; basic/basic.e16.ts:1120  angleStatement(c)
  mv a0, s1
  call angleStatement
  ; basic/basic.e16.ts:1121  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1125 angleStatement(c) at -O1
;   c in s1
;   unit in s2
angleStatement:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1126  if (c === T_DEG || c === T_RAD || c === T_GRAD) {
  li t0, 150
  beq s1, t0, .L2
  li t0, 151
  beq s1, t0, .L2
  li t0, 152
  bne s1, t0, .L1
.L2:
  ; basic/basic.e16.ts:1127  const unit: u16 = c - T_DEG
  addi s2, s1, -150
  ; basic/basic.e16.ts:1128  poke16(MATH_ANGLE, unit)
  li t0, 65372
  sw s2, 0(t0)
  ; basic/basic.e16.ts:1129  angleMarks = unit === 0 ? ANN_DEG : unit === 1 ? ANN_RAD : ANN_GRAD
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
  ; basic/basic.e16.ts:1130  marks()
  call marks
  ; basic/basic.e16.ts:1131  return
  j .return
.L1:
  ; basic/basic.e16.ts:1134  if ((c >= T_LOCATE && c <= T_GPRINT) || c === T_CIRCLE) screenStatement(c)
  li t0, 172
  bltu s1, t0, .L9
  li t0, 177
  bgeu t0, s1, .L8
.L9:
  li t0, 219
  bne s1, t0, .L7
.L8:
  ; basic/basic.e16.ts:1134  screenStatement(c)
  mv a0, s1
  la t0, screenStatement
  li t1, 1
  call far_call
  j .L10
.L7:
  ; basic/basic.e16.ts:1135  if ((c >= T_FILES && c <= T_KILL) || c === T_OPEN || c === T_CLOSE) fileStatement(c)
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
  ; basic/basic.e16.ts:1135  fileStatement(c)
  mv a0, s1
  la t0, fileStatement
  li t1, 2
  call far_call
  j .L14
.L11:
  ; basic/basic.e16.ts:1136  if (c >= T_AUTO && c <= T_TROFF) toolStatement(c)
  li t0, 163
  bltu s1, t0, .L15
  li t0, 167
  bltu t0, s1, .L15
  ; basic/basic.e16.ts:1136  toolStatement(c)
  mv a0, s1
  la t0, toolStatement
  li t1, 3
  call far_call
  j .L16
.L15:
  ; basic/basic.e16.ts:1137  dataStatement(c)
  mv a0, s1
  la t0, dataStatement
  li t1, 0
  call far_call
.L16:
.L14:
.L10:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:1140 toLineEnd() at -O1
toLineEnd:
  ; basic/basic.e16.ts:1141  while (peek(txt) !== 0) txt++
  j .L3
.L1:
  ; basic/basic.e16.ts:1141  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.L3:
  lw t0, 0x010e(zero)
  lbu t0, 0(t0)
  bne t0, zero, .L1
.return:
  ret

; basic/basic.e16.ts:1144 endProgram() at -O1
endProgram:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1145  running = false
  sw zero, 0x012e(zero)
  ; basic/basic.e16.ts:1146  toLineEnd()
  call toLineEnd
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1149 assignment() at -O1
;   at in s1
;   strings in s2
;   room in s3
assignment:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/basic.e16.ts:1150  const at = varAt(true)
  li a0, 1
  call varAt
  mv s1, a0 ; at
  ; basic/basic.e16.ts:1151  const strings = strType
  lw s2, 0x0118(zero)
  ; basic/basic.e16.ts:1152  const room = varRoom
  lw s3, 0x011a(zero)
  ; basic/basic.e16.ts:1153  expect(CH_EQ)
  li a0, 61
  call expect
  ; basic/basic.e16.ts:1154  expr()
  call expr
  ; basic/basic.e16.ts:1155  if (strType !== strings) fail(E_TYPE)
  lw t0, 0x0118(zero)
  beq t0, s2, .L1
  ; basic/basic.e16.ts:1155  fail(E_TYPE)
  li a0, 11
  call fail
.L1:
  ; basic/basic.e16.ts:1156  if (strings) storeString(at, room)
  beqz s2, .L2
  ; basic/basic.e16.ts:1156  storeString(at, room)
  mv a0, s1
  mv a1, s3
  call storeString
  j .L3
.L2:
  ; basic/basic.e16.ts:1157  copy8(top(), at)
  call top
  mv a1, s1
  call copy8
.L3:
  ; basic/basic.e16.ts:1158  nsp -= 8
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

; basic/basic.e16.ts:1162 printStatement() at -O1
printStatement:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1163  if (next() === CH_HASH) printToFile()
  call next
  li t0, 35
  bne a0, t0, .L1
  ; basic/basic.e16.ts:1163  printToFile()
  la t0, printToFile
  li t1, 2
  call far_call
  j .L2
.L1:
  ; basic/basic.e16.ts:1164  printItems()
  call printItems
.L2:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1171 printItems() at -O1
;   joined in s1
printItems:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1172  let joined = false
  li s1, 0 ; joined
  ; basic/basic.e16.ts:1173  printed = false
  sw zero, 0x061c(zero)
  ; basic/basic.e16.ts:1174  while (!statementEnds()) {
  j .L3
.L1:
  ; basic/basic.e16.ts:1175  printItem()
  call printItem
  ; basic/basic.e16.ts:1176  joined = separator()
  call separator
  mv s1, a0 ; joined
  ; basic/basic.e16.ts:1177  if (!joined && !statementEnds()) fail(E_SYNTAX)
  bnez s1, .L5
  call statementEnds
  bnez a0, .L5
  ; basic/basic.e16.ts:1177  fail(E_SYNTAX)
  li a0, 1
  call fail
.L5:
.L3:
  call statementEnds
  beqz a0, .L1
  ; basic/basic.e16.ts:1179  if (joined) return
  beqz s1, .L6
  ; basic/basic.e16.ts:1179  return
  j .return
.L6:
  ; basic/basic.e16.ts:1180  if (outFile !== 0) fileByte(K_ENTER)
  lw t0, 0x011c(zero)
  beq t0, zero, .L7
  ; basic/basic.e16.ts:1180  fileByte(K_ENTER)
  li a0, 13
  la t0, fileByte
  li t1, 2
  call far_call
  j .L8
.L7:
  ; basic/basic.e16.ts:1182  if (!printed || peek16(CURX) !== 0) newline()
  lw t0, 0x061c(zero)
  beqz t0, .L10
  lw t0, 0(zero)
  beq t0, zero, .L9
.L10:
  ; basic/basic.e16.ts:1182  newline()
  call newline
.L9:
.L8:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1186 printItem() at -O1
;   p in s1
printItem:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1187  expr()
  call expr
  ; basic/basic.e16.ts:1188  if (strType) outString(top())
  lw t0, 0x0118(zero)
  beqz t0, .L1
  ; basic/basic.e16.ts:1188  outString(top())
  call top
  call outString
  j .L2
.L1:
  ; basic/basic.e16.ts:1190  formatTop()
  call formatTop
  ; basic/basic.e16.ts:1191  for (let p = addr(textOut); peek(p) !== 0; p++) out(peek(p))
  la s1, textOut
  j .L5
.L3:
  ; basic/basic.e16.ts:1191  out(peek(p))
  lbu a0, 0(s1)
  call out
  addi s1, s1, 1
.L5:
  lbu t0, 0(s1)
  bne t0, zero, .L3
  ; basic/basic.e16.ts:1192  if (next() === CH_SEMI) out(CH_SPACE)
  call next
  li t0, 59
  bne a0, t0, .L7
  ; basic/basic.e16.ts:1192  out(CH_SPACE)
  li a0, 32
  call out
.L7:
.L2:
  ; basic/basic.e16.ts:1194  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1201 out(c) at -O1
;   c in s1
out:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1202  printed = true
  li t0, 1
  sw t0, 0x061c(zero)
  ; basic/basic.e16.ts:1203  if (outFile === 0) putc(c)
  lw t0, 0x011c(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1203  putc(c)
  mv a0, s1
  call putc
  j .L2
.L1:
  ; basic/basic.e16.ts:1204  fileByte(c)
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

; basic/basic.e16.ts:1208 outString(e) at -O1
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
  ; basic/basic.e16.ts:1209  const at = stringAt(e)
  mv a0, s2
  call stringAt
  mv s3, a0 ; at
  ; basic/basic.e16.ts:1210  const n = stringLength(e)
  mv a0, s2
  call stringLength
  mv s0, a0 ; n
  ; basic/basic.e16.ts:1211  for (let k: u16 = 0; k < n; k++) out(peek(at + k))
  li s1, 0 ; k
  j .L3
.L1:
  ; basic/basic.e16.ts:1211  out(peek(at + k))
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

; basic/basic.e16.ts:1215 statementEnds() at -O1
;   c in s1
statementEnds:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1216  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1217  return c === 0 || c === CH_COLON || c === T_ELSE
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

; basic/basic.e16.ts:1221 quoted(p, show) at -O1
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
  ; basic/basic.e16.ts:1222  let q = p
  mv s1, s2 ; q
  ; basic/basic.e16.ts:1223  while (peek(q) !== CH_QUOTE && peek(q) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:1224  if (show) putc(peek(q))
  beqz s3, .L5
  ; basic/basic.e16.ts:1224  putc(peek(q))
  lbu a0, 0(s1)
  call putc
.L5:
  ; basic/basic.e16.ts:1225  q++
  addi s1, s1, 1
.L3:
  lbu t0, 0(s1)
  li t1, 34
  beq t0, t1, .L6
  lbu t0, 0(s1)
  bne t0, zero, .L1
.L6:
  ; basic/basic.e16.ts:1227  return peek(q) === CH_QUOTE ? q + 1 : q
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

; basic/basic.e16.ts:1231 separator() at -O1
;   c in s1
separator:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1232  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1233  if (c === CH_SEMI) {
  li t0, 59
  bne s1, t0, .L1
  ; basic/basic.e16.ts:1234  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1235  return true
  li a0, 1
  j .return
.L1:
  ; basic/basic.e16.ts:1237  if (c !== CH_COMMA) return false
  li t0, 44
  beq s1, t0, .L2
  ; basic/basic.e16.ts:1237  return false
  li a0, 0
  j .return
.L2:
  ; basic/basic.e16.ts:1238  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1239  if (outFile !== 0) {
  lw t0, 0x011c(zero)
  beq t0, zero, .L3
  ; basic/basic.e16.ts:1240  fileByte(CH_COMMA)
  li a0, 44
  la t0, fileByte
  li t1, 2
  call far_call
  ; basic/basic.e16.ts:1241  return true
  li a0, 1
  j .return
.L3:
  ; basic/basic.e16.ts:1243  putc(CH_SPACE)
  li a0, 32
  call putc
  ; basic/basic.e16.ts:1244  while (peek16(CURX) % 10 !== 0 && peek16(CURX) !== 0) putc(CH_SPACE)
  j .L6
.L4:
  ; basic/basic.e16.ts:1244  putc(CH_SPACE)
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
  ; basic/basic.e16.ts:1245  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1248 ifStatement() at -O1
;   holds in s1
ifStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1249  expr()
  call expr
  ; basic/basic.e16.ts:1250  needNumber()
  call needNumber
  ; basic/basic.e16.ts:1251  const holds = !isZero(top())
  call top
  call isZero
  seqz s1, a0
  ; basic/basic.e16.ts:1252  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:1253  if (next() === T_THEN) txt++
  call next
  li t0, 136
  bne a0, t0, .L1
  ; basic/basic.e16.ts:1253  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
.L1:
  ; basic/basic.e16.ts:1254  if (!holds && !skipToElse()) return
  bnez s1, .L2
  call skipToElse
  bnez a0, .L2
  ; basic/basic.e16.ts:1254  return
  j .return
.L2:
  ; basic/basic.e16.ts:1257  if (isDigit(next())) gotoStatement()
  call next
  call isDigit
  beqz a0, .L3
  ; basic/basic.e16.ts:1257  gotoStatement()
  call gotoStatement
  j .L4
.L3:
  ; basic/basic.e16.ts:1258  statements()
  call statements
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1262 skipToElse() at -O1
;   quoted in a0
;   c in a1
skipToElse:
  ; basic/basic.e16.ts:1263  let quoted = false
  li a0, 0 ; quoted
  ; basic/basic.e16.ts:1264  while (peek(txt) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:1265  const c = peek(txt)
  lw t0, 0x010e(zero)
  lbu a1, 0(t0)
  ; basic/basic.e16.ts:1266  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1267  if (c === CH_QUOTE) quoted = !quoted
  li t0, 34
  bne a1, t0, .L5
  ; basic/basic.e16.ts:1267  quoted = !quoted
  seqz a0, a0
.L5:
  ; basic/basic.e16.ts:1268  if (c === T_ELSE && !quoted) return true
  li t0, 137
  bne a1, t0, .L6
  bnez a0, .L6
  ; basic/basic.e16.ts:1268  return true
  li a0, 1
  ret
.L6:
.L3:
  lw t0, 0x010e(zero)
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1270  return false
  li a0, 0
.return:
  ret

; basic/basic.e16.ts:1273 gotoStatement() at -O1
;   line in s1
gotoStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1274  const line = findLine(readUnsigned(), true)
  call readUnsigned
  li a1, 1
  call findLine
  mv s1, a0 ; line
  ; basic/basic.e16.ts:1275  if (line === 0) fail(E_LINE)
  bne s1, zero, .L1
  ; basic/basic.e16.ts:1275  fail(E_LINE)
  li a0, 5
  call fail
.L1:
  ; basic/basic.e16.ts:1276  jump(line, line + 4)
  mv a0, s1
  addi a1, s1, 4
  call jump
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1279 gosubStatement() at -O1
;   line in s1
gosubStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1280  const line = findLine(readUnsigned(), true)
  call readUnsigned
  li a1, 1
  call findLine
  mv s1, a0 ; line
  ; basic/basic.e16.ts:1281  if (line === 0) fail(E_LINE)
  bne s1, zero, .L1
  ; basic/basic.e16.ts:1281  fail(E_LINE)
  li a0, 5
  call fail
.L1:
  ; basic/basic.e16.ts:1282  gosubTo(line)
  mv a0, s1
  call gosubTo
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1286 gosubTo(line) at -O1
;   line in s1
gosubTo:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; line
  ; basic/basic.e16.ts:1287  if (gsp >= GOSUB_DEPTH) fail(E_COMPLEX)
  lw t0, 0x012c(zero)
  li t1, 16
  bltu t0, t1, .L1
  ; basic/basic.e16.ts:1287  fail(E_COMPLEX)
  li a0, 9
  call fail
.L1:
  ; basic/basic.e16.ts:1288  gosubStack[gsp * 2] = curLine
  lw t0, 0x012c(zero)
  slli t0, t0, 1
  slli t0, t0, 1
  lw t1, 0x0110(zero)
  sw t1, gosubStack(t0)
  ; basic/basic.e16.ts:1289  gosubStack[gsp * 2 + 1] = txt
  lw t0, 0x012c(zero)
  slli t0, t0, 1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t1, 0x010e(zero)
  sw t1, gosubStack(t0)
  ; basic/basic.e16.ts:1290  gsp++
  lw t0, 0x012c(zero)
  addi t0, t0, 1
  sw t0, 0x012c(zero)
  ; basic/basic.e16.ts:1291  jump(line, line + 4)
  mv a0, s1
  addi a1, s1, 4
  call jump
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1294 returnStatement() at -O1
returnStatement:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1295  if (gsp === 0) fail(E_RETURN)
  lw t0, 0x012c(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1295  fail(E_RETURN)
  li a0, 7
  call fail
.L1:
  ; basic/basic.e16.ts:1296  gsp--
  lw t0, 0x012c(zero)
  addi t0, t0, -1
  sw t0, 0x012c(zero)
  ; basic/basic.e16.ts:1297  jump(gosubStack[gsp * 2], gosubStack[gsp * 2 + 1])
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

; basic/basic.e16.ts:1301 forStatement() at -O1
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
  ; basic/basic.e16.ts:1302  const at = varAt(true)
  li a0, 1
  call varAt
  mv s3, a0 ; at
  ; basic/basic.e16.ts:1303  needNumber()
  call needNumber
  ; basic/basic.e16.ts:1304  expect(CH_EQ)
  li a0, 61
  call expect
  ; basic/basic.e16.ts:1305  expr()
  call expr
  ; basic/basic.e16.ts:1306  copy8(top(), at)
  call top
  mv a1, s3
  call copy8
  ; basic/basic.e16.ts:1307  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:1308  if (next() !== T_TO) fail(E_SYNTAX)
  call next
  li t0, 139
  beq a0, t0, .L1
  ; basic/basic.e16.ts:1308  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:1309  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1310  expr()
  call expr
  ; basic/basic.e16.ts:1311  needNumber()
  call needNumber
  ; basic/basic.e16.ts:1312  const limit = top()
  call top
  sw a0, 0(fp) ; limit
  ; basic/basic.e16.ts:1313  if (next() === T_STEP) {
  call next
  li t0, 140
  bne a0, t0, .L2
  ; basic/basic.e16.ts:1314  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1315  expr()
  call expr
  ; basic/basic.e16.ts:1316  needNumber()
  call needNumber
  j .L3
.L2:
  ; basic/basic.e16.ts:1317  setInt(push(), 1)
  call push
  li a1, 1
  call setInt
.L3:
  ; basic/basic.e16.ts:1318  const step = top()
  call top
  sw a0, 2(fp) ; step
  ; basic/basic.e16.ts:1320  let k: u16 = 0
  li s1, 0 ; k
  ; basic/basic.e16.ts:1321  while (k < fsp && peek16(forEntry(k)) !== at) k++
  j .L6
.L4:
  ; basic/basic.e16.ts:1321  k++
  addi s1, s1, 1
.L6:
  lw t0, 0x012a(zero)
  bgeu s1, t0, .L8
  mv a0, s1
  call forEntry
  lw t0, 0(a0)
  bne t0, s3, .L4
.L8:
  ; basic/basic.e16.ts:1322  fsp = k
  sw s1, 0x012a(zero)
  ; basic/basic.e16.ts:1323  if (fsp >= FOR_DEPTH) fail(E_COMPLEX)
  li t0, 8
  bltu s1, t0, .L9
  ; basic/basic.e16.ts:1323  fail(E_COMPLEX)
  li a0, 9
  call fail
.L9:
  ; basic/basic.e16.ts:1324  const e = forEntry(fsp)
  lw a0, 0x012a(zero)
  call forEntry
  mv s2, a0 ; e
  ; basic/basic.e16.ts:1325  poke16(e, at)
  sw s3, 0(s2)
  ; basic/basic.e16.ts:1326  copy8(limit, e + 2)
  lw a0, 0(fp)
  addi a1, s2, 2
  call copy8
  ; basic/basic.e16.ts:1327  copy8(step, e + 10)
  lw a0, 2(fp)
  addi a1, s2, 10
  call copy8
  ; basic/basic.e16.ts:1328  poke16(e + 18, curLine)
  lw t0, 0x0110(zero)
  sw t0, 18(s2)
  ; basic/basic.e16.ts:1329  poke16(e + 20, txt)
  lw t0, 0x010e(zero)
  sw t0, 20(s2)
  ; basic/basic.e16.ts:1330  fsp++
  lw t0, 0x012a(zero)
  addi t0, t0, 1
  sw t0, 0x012a(zero)
  ; basic/basic.e16.ts:1331  nsp -= 16
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

; basic/basic.e16.ts:1334 forEntry(k) at -O1
;   k in a0
forEntry:
  ; basic/basic.e16.ts:1335  return addr(forStack) + k * FOR_SIZE
  li t0, 22
  mul t0, a0, t0
  addi a0, t0, forStack
.return:
  ret

; basic/basic.e16.ts:1339 nextStatement() at -O1
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
  ; basic/basic.e16.ts:1340  if (fsp === 0) fail(E_NEXT)
  lw t0, 0x012a(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1340  fail(E_NEXT)
  li a0, 6
  call fail
.L1:
  ; basic/basic.e16.ts:1341  let k = fsp - 1
  lw t0, 0x012a(zero)
  addi s2, t0, -1
  ; basic/basic.e16.ts:1342  if (isLetter(next())) {
  call next
  call isLetter
  beqz a0, .L2
  ; basic/basic.e16.ts:1343  const at = varAt(false)
  li a0, 0
  call varAt
  mv s1, a0 ; at/e
  ; basic/basic.e16.ts:1344  while (peek16(forEntry(k)) !== at) {
  j .L5
.L3:
  ; basic/basic.e16.ts:1345  if (k === 0) fail(E_NEXT)
  bne s2, zero, .L7
  ; basic/basic.e16.ts:1345  fail(E_NEXT)
  li a0, 6
  call fail
.L7:
  ; basic/basic.e16.ts:1346  k--
  addi s2, s2, -1
.L5:
  mv a0, s2
  call forEntry
  lw t0, 0(a0)
  bne t0, s1, .L3
.L2:
  ; basic/basic.e16.ts:1349  const e = forEntry(k)
  mv a0, s2
  call forEntry
  mv s1, a0 ; at/e
  ; basic/basic.e16.ts:1350  const at = peek16(e)
  lw s3, 0(s1)
  ; basic/basic.e16.ts:1351  math(M_ADD, at, e + 10)
  li a0, 1
  mv a1, s3
  addi a2, s1, 10
  call math
  ; basic/basic.e16.ts:1352  math(M_CMP, at, e + 2)
  li a0, 6
  mv a1, s3
  addi a2, s1, 2
  call math
  ; basic/basic.e16.ts:1353  const r = peek16(MATH_RESULT)
  li t0, 65370
  lw t0, 0(t0)
  sw t0, 0(fp) ; r
  ; basic/basic.e16.ts:1355  const up = (peek(e + 10) & 0x80) === 0
  lbu t0, 10(s1)
  andi t0, t0, 128
  sub t0, t0, zero
  seqz t0, t0
  sw t0, 2(fp) ; up
  ; basic/basic.e16.ts:1356  const past = up ? r === 1 : r === 0xffff
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
  ; basic/basic.e16.ts:1357  if (past) {
  lw t0, 4(fp) ; past
  beqz t0, .L10
  ; basic/basic.e16.ts:1358  fsp = k
  sw s2, 0x012a(zero)
  ; basic/basic.e16.ts:1359  return
  j .return
.L10:
  ; basic/basic.e16.ts:1361  fsp = k + 1
  addi t0, s2, 1
  sw t0, 0x012a(zero)
  ; basic/basic.e16.ts:1362  jump(peek16(e + 18), peek16(e + 20))
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

; basic/basic.e16.ts:1365 pokeStatement() at -O1
;   a in s1
pokeStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1366  expr()
  call expr
  ; basic/basic.e16.ts:1367  needNumber()
  call needNumber
  ; basic/basic.e16.ts:1368  const a = toWord(top())
  call top
  call toWord
  mv s1, a0 ; a
  ; basic/basic.e16.ts:1369  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:1370  expect(CH_COMMA)
  li a0, 44
  call expect
  ; basic/basic.e16.ts:1371  expr()
  call expr
  ; basic/basic.e16.ts:1372  needNumber()
  call needNumber
  ; basic/basic.e16.ts:1373  poke(a, u16(toInt(top())))
  call top
  call toInt
  sb a0, 0(s1)
  ; basic/basic.e16.ts:1374  nsp -= 8
  lw t0, 0x0116(zero)
  addi t0, t0, -8
  sw t0, 0x0116(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1384 runStatement() at -O1
;   from in s1
runStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1385  let from = PROG
  li s1, 2048 ; from
  ; basic/basic.e16.ts:1386  if (isDigit(next())) {
  call next
  call isDigit
  beqz a0, .L1
  ; basic/basic.e16.ts:1387  from = findLine(readUnsigned(), true)
  call readUnsigned
  li a1, 1
  call findLine
  mv s1, a0 ; from
  ; basic/basic.e16.ts:1388  if (from === 0) fail(E_LINE)
  bne s1, zero, .L2
  ; basic/basic.e16.ts:1388  fail(E_LINE)
  li a0, 5
  call fail
.L2:
.L1:
  ; basic/basic.e16.ts:1390  clearVariables()
  call clearVariables
  ; basic/basic.e16.ts:1391  if (peek16(from) === 0) {
  lw t0, 0(s1)
  bne t0, zero, .L3
  ; basic/basic.e16.ts:1392  endProgram()
  call endProgram
  ; basic/basic.e16.ts:1393  return
  j .return
.L3:
  ; basic/basic.e16.ts:1395  startRun(from, from + 4)
  mv a0, s1
  addi a1, s1, 4
  call startRun
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1398 contStatement() at -O1
contStatement:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1399  if (contLine === 0) fail(E_CONT)
  lw t0, 0x0130(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1399  fail(E_CONT)
  li a0, 10
  call fail
.L1:
  ; basic/basic.e16.ts:1400  startRun(contLine, contTxt)
  lw t0, 0x0130(zero)
  lw t1, 0x0132(zero)
  mv a0, t0
  mv a1, t1
  call startRun
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1404 startRun(line, text) at -O1
;   line in s1
;   text in s2
startRun:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; line
  mv s2, a1 ; text
  ; basic/basic.e16.ts:1405  running = true
  li t0, 1
  sw t0, 0x012e(zero)
  ; basic/basic.e16.ts:1406  marks()
  call marks
  ; basic/basic.e16.ts:1407  jump(line, text)
  mv a0, s1
  mv a1, s2
  call jump
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:1410 listStatement() at -O1
;   at in s1
listStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1411  let at = PROG
  li s1, 2048 ; at
  ; basic/basic.e16.ts:1412  if (isDigit(next())) at = findLine(readUnsigned(), false)
  call next
  call isDigit
  beqz a0, .L4
  ; basic/basic.e16.ts:1412  at = findLine(readUnsigned(), false)
  call readUnsigned
  li a1, 0
  call findLine
  mv s1, a0 ; at
  ; basic/basic.e16.ts:1413  while (at !== 0 && peek16(at) !== 0) {
  j .L4
.L2:
  ; basic/basic.e16.ts:1414  checkBreak()
  call checkBreak
  ; basic/basic.e16.ts:1415  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1416  printUnsigned(peek16(at))
  lw a0, 0(s1)
  call printUnsigned
  ; basic/basic.e16.ts:1417  putc(CH_SPACE)
  li a0, 32
  call putc
  ; basic/basic.e16.ts:1418  expand(at + 4, 0, 0)
  addi a0, s1, 4
  li a1, 0
  li a2, 0
  call expand
  ; basic/basic.e16.ts:1420  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1421  at += peek16(at + 2)
  lw t0, 2(s1)
  add s1, s1, t0
.L4:
  beq s1, zero, .L6
  lw t0, 0(s1)
  bne t0, zero, .L2
.L6:
  ; basic/basic.e16.ts:1423  toLineEnd()
  call toLineEnd
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1429 run() at -O1
;   nextLine in s1
run:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1430  while (running) {
  j .L3
.L1:
  ; basic/basic.e16.ts:1431  if (jumping) {
  lw t0, 0x0134(zero)
  beqz t0, .L5
  ; basic/basic.e16.ts:1432  jumping = false
  sw zero, 0x0134(zero)
  ; basic/basic.e16.ts:1433  curLine = jumpLine
  lw t0, 0x0136(zero)
  sw t0, 0x0110(zero)
  ; basic/basic.e16.ts:1434  txt = jumpTxt
  lw t0, 0x0138(zero)
  sw t0, 0x010e(zero)
  j .L6
.L5:
  ; basic/basic.e16.ts:1436  const nextLine = curLine + peek16(curLine + 2)
  lw t0, 0x0110(zero)
  lw t1, 0x0110(zero)
  lw t1, 2(t1)
  add s1, t0, t1
  ; basic/basic.e16.ts:1437  if (peek16(nextLine) === 0) {
  lw t0, 0(s1)
  bne t0, zero, .L7
  ; basic/basic.e16.ts:1438  running = false
  sw zero, 0x012e(zero)
  ; basic/basic.e16.ts:1439  break
  j .L4
.L7:
  ; basic/basic.e16.ts:1441  curLine = nextLine
  sw s1, 0x0110(zero)
  ; basic/basic.e16.ts:1442  txt = curLine + 4
  addi t0, s1, 4
  sw t0, 0x010e(zero)
.L6:
  ; basic/basic.e16.ts:1444  if (tracing && curLine !== 0) {
  lw t0, 0x0124(zero)
  beqz t0, .L8
  lw t0, 0x0110(zero)
  beq t0, zero, .L8
  ; basic/basic.e16.ts:1445  putc(CH_LBRACKET)
  li a0, 91
  call putc
  ; basic/basic.e16.ts:1446  printUnsigned(peek16(curLine))
  lw t0, 0x0110(zero)
  lw a0, 0(t0)
  call printUnsigned
  ; basic/basic.e16.ts:1447  putc(CH_RBRACKET)
  li a0, 93
  call putc
.L8:
  ; basic/basic.e16.ts:1450  if (curLine === 0) {
  lw t0, 0x0110(zero)
  bne t0, zero, .L9
  ; basic/basic.e16.ts:1451  statements()
  call statements
  ; basic/basic.e16.ts:1452  if (!jumping) running = false
  lw t0, 0x0134(zero)
  bnez t0, .L2
  ; basic/basic.e16.ts:1452  running = false
  sw zero, 0x012e(zero)
  ; basic/basic.e16.ts:1453  continue
  j .L2
.L9:
  ; basic/basic.e16.ts:1455  statements()
  call statements
.L2:
.L3:
  lw t0, 0x012e(zero)
  bnez t0, .L1
.L4:
  ; basic/basic.e16.ts:1457  stopRunning()
  call stopRunning
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1461 isCalculation() at -O1
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
  ; basic/basic.e16.ts:1462  const c = next()
  call next
  mv s2, a0 ; c
  ; basic/basic.e16.ts:1463  if (c >= 0x80) return c >= T_SIN && c <= T_LCDH
  li t0, 128
  bltu s2, t0, .L1
  ; basic/basic.e16.ts:1463  return c >= T_SIN && c <= T_LCDH
  li t0, 180
  sltu t0, s2, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L2
  li t0, 214
  sltu t0, t0, s2
  xori t0, t0, 1
.L2:
  mv a0, t0
  j .return
.L1:
  ; basic/basic.e16.ts:1464  if (!isLetter(c)) return c !== 0
  mv a0, s2
  call isLetter
  bnez a0, .L3
  ; basic/basic.e16.ts:1464  return c !== 0
  sub t0, s2, zero
  snez a0, t0
  j .return
.L3:
  ; basic/basic.e16.ts:1465  const save = txt
  lw s0, 0x010e(zero)
  ; basic/basic.e16.ts:1466  readName()
  call readName
  ; basic/basic.e16.ts:1468  if (next() === CH_LPAREN) {
  call next
  li t0, 40
  bne a0, t0, .L4
  ; basic/basic.e16.ts:1469  let depth: u16 = 0
  li s1, 0 ; depth/assigns
  ; basic/basic.e16.ts:1470  do {
.L5:
  ; basic/basic.e16.ts:1471  const d = peek(txt)
  lw t0, 0x010e(zero)
  lbu s3, 0(t0)
  ; basic/basic.e16.ts:1472  if (d === CH_LPAREN) depth++
  li t0, 40
  bne s3, t0, .L8
  ; basic/basic.e16.ts:1472  depth++
  addi s1, s1, 1
  j .L9
.L8:
  ; basic/basic.e16.ts:1473  if (d === CH_RPAREN) depth--
  li t0, 41
  bne s3, t0, .L10
  ; basic/basic.e16.ts:1473  depth--
  addi s1, s1, -1
  j .L11
.L10:
  ; basic/basic.e16.ts:1474  if (d === 0) break
  bne s3, zero, .L12
  ; basic/basic.e16.ts:1474  break
  j .L7
.L12:
.L11:
.L9:
  ; basic/basic.e16.ts:1475  txt++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  bltu zero, s1, .L5
.L7:
.L4:
  ; basic/basic.e16.ts:1478  const assigns = next() === CH_EQ
  call next
  li t0, 61
  sub t0, a0, t0
  seqz s1, t0
  ; basic/basic.e16.ts:1479  txt = save
  sw s0, 0x010e(zero)
  ; basic/basic.e16.ts:1480  return !assigns
  seqz a0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:1484 calculate() at -O1
;   n in s2
;   cols in s3
;   pad in s1
calculate:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; basic/basic.e16.ts:1485  expr()
  call expr
  ; basic/basic.e16.ts:1486  if (next() !== 0) fail(E_SYNTAX)
  call next
  beq a0, zero, .L1
  ; basic/basic.e16.ts:1486  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:1488  const n = strType ? stringLength(top()) : formatTop()
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
  ; basic/basic.e16.ts:1489  if (!strType) copy8(top(), addr(ans))
  lw t0, 0x0118(zero)
  bnez t0, .L4
  ; basic/basic.e16.ts:1489  copy8(top(), addr(ans))
  call top
  la a1, ans
  call copy8
.L4:
  ; basic/basic.e16.ts:1490  const cols = peek16(COLS)
  lw s3, 4(zero)
  ; basic/basic.e16.ts:1491  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1492  let pad: i16 = i16(cols - n - 1)
  sub t0, s3, s2
  addi s1, t0, -1
  ; basic/basic.e16.ts:1493  while (pad > 0) {
  j .L7
.L5:
  ; basic/basic.e16.ts:1494  putc(CH_SPACE)
  li a0, 32
  call putc
  ; basic/basic.e16.ts:1495  pad--
  addi s1, s1, -1
.L7:
  blt zero, s1, .L5
  ; basic/basic.e16.ts:1497  if (strType) outString(top())
  lw t0, 0x0118(zero)
  beqz t0, .L9
  ; basic/basic.e16.ts:1497  outString(top())
  call top
  call outString
  j .L10
.L9:
  ; basic/basic.e16.ts:1498  puts(addr(textOut))
  la a0, textOut
  call puts
.L10:
  ; basic/basic.e16.ts:1499  newline()
  call newline
  ; basic/basic.e16.ts:1500  nsp -= 8
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

; basic/basic.e16.ts:1507 storeTypedLine() at -O1
;   length in s2
;   n in s1
storeTypedLine:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; basic/basic.e16.ts:1508  const length = tokenize(addr(lineBuf), addr(tokens))
  la a0, lineBuf
  la a1, tokens
  call tokenize
  mv s2, a0 ; length
  ; basic/basic.e16.ts:1509  txt = addr(tokens)
  la t0, tokens
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1510  if (!isDigit(next())) return false
  call next
  call isDigit
  bnez a0, .L1
  ; basic/basic.e16.ts:1510  return false
  li a0, 0
  j .return
.L1:
  ; basic/basic.e16.ts:1511  const n = readUnsigned()
  call readUnsigned
  mv s1, a0 ; n
  ; basic/basic.e16.ts:1512  if (n === 0 || next() === 0) return false
  beq s1, zero, .L3
  call next
  bne a0, zero, .L2
.L3:
  ; basic/basic.e16.ts:1512  return false
  li a0, 0
  j .return
.L2:
  ; basic/basic.e16.ts:1513  storeLine(n, txt, length - (txt - addr(tokens)))
  lw t0, 0x010e(zero)
  lw t1, 0x010e(zero)
  la t2, tokens
  sub t1, t1, t2
  sub t1, s2, t1
  mv a0, s1
  mv a1, t0
  mv a2, t1
  call storeLine
  ; basic/basic.e16.ts:1514  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:1518 enter() at -O1
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
  ; basic/basic.e16.ts:1519  const length = tokenize(addr(lineBuf), addr(tokens))
  la a0, lineBuf
  la a1, tokens
  call tokenize
  mv s3, a0 ; length
  ; basic/basic.e16.ts:1520  txt = addr(tokens)
  la t0, tokens
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:1521  curLine = 0
  sw zero, 0x0110(zero)
  ; basic/basic.e16.ts:1522  if (isDigit(next())) {
  call next
  call isDigit
  beqz a0, .L1
  ; basic/basic.e16.ts:1523  const save = txt
  lw s0, 0x010e(zero)
  ; basic/basic.e16.ts:1524  const n = readUnsigned()
  call readUnsigned
  mv s1, a0 ; n
  ; basic/basic.e16.ts:1525  const c = next()
  call next
  mv s2, a0 ; c
  ; basic/basic.e16.ts:1527  if (autoLine !== 0 && c === 0) {
  lw t0, 0x0126(zero)
  beq t0, zero, .L2
  bne s2, zero, .L2
  ; basic/basic.e16.ts:1528  autoLine = 0
  sw zero, 0x0126(zero)
  ; basic/basic.e16.ts:1529  return
  j .return
.L2:
  ; basic/basic.e16.ts:1532  if (n !== 0 && (isLetter(c) || c >= 0x80 || (c === 0 && proMode))) {
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
  ; basic/basic.e16.ts:1533  storeLine(n, txt, length - (txt - addr(tokens)))
  lw t0, 0x010e(zero)
  lw t1, 0x010e(zero)
  la t2, tokens
  sub t1, t1, t2
  sub t1, s3, t1
  mv a0, s1
  mv a1, t0
  mv a2, t1
  call storeLine
  ; basic/basic.e16.ts:1534  recallNo = n
  sw s1, 0x013e(zero)
  ; basic/basic.e16.ts:1535  justStored = true
  li t0, 1
  sw t0, 0x0140(zero)
  ; basic/basic.e16.ts:1536  if (autoLine !== 0) autoLine = n + autoStep
  lw t0, 0x0126(zero)
  beq t0, zero, .L5
  ; basic/basic.e16.ts:1536  autoLine = n + autoStep
  lw t0, 0x0128(zero)
  add t0, s1, t0
  sw t0, 0x0126(zero)
.L5:
  ; basic/basic.e16.ts:1537  return
  j .return
.L3:
  ; basic/basic.e16.ts:1539  txt = save
  sw s0, 0x010e(zero)
.L1:
  ; basic/basic.e16.ts:1541  if (isCalculation()) {
  call isCalculation
  beqz a0, .L6
  ; basic/basic.e16.ts:1543  strTop = 0
  sw zero, 0x0504(zero)
  ; basic/basic.e16.ts:1544  calculate()
  call calculate
  ; basic/basic.e16.ts:1545  return
  j .return
.L6:
  ; basic/basic.e16.ts:1547  jumping = false
  sw zero, 0x0134(zero)
  ; basic/basic.e16.ts:1548  running = false
  sw zero, 0x012e(zero)
  ; basic/basic.e16.ts:1549  statements()
  call statements
  ; basic/basic.e16.ts:1550  if (jumping) {
  lw t0, 0x0134(zero)
  beqz t0, .L7
  ; basic/basic.e16.ts:1551  running = true
  li t0, 1
  sw t0, 0x012e(zero)
  ; basic/basic.e16.ts:1552  marks()
  call marks
  ; basic/basic.e16.ts:1553  run()
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

; basic/basic.e16.ts:1558 basicLoop() at -O1
;   length in s1
;   prompt in s3
;   n in s2
basicLoop:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  ; basic/basic.e16.ts:1559  nsp = addr(nums)
  la t0, nums
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:1560  running = false
  sw zero, 0x012e(zero)
  ; basic/basic.e16.ts:1561  marks()
  call marks
  ; basic/basic.e16.ts:1563  let length: u16 = 0
  li s1, 0 ; length
  ; basic/basic.e16.ts:1564  let prompt = true
  li s3, 1 ; prompt
  ; basic/basic.e16.ts:1565  for (;;) {
.L1:
  ; basic/basic.e16.ts:1566  if (prompt) {
  beqz s3, .L5
  ; basic/basic.e16.ts:1567  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1568  putc(CH_GT)
  li a0, 62
  call putc
.L5:
  ; basic/basic.e16.ts:1570  prompt = true
  li s3, 1 ; prompt
  ; basic/basic.e16.ts:1571  if (length === 0) length = autoPrefix()
  bne s1, zero, .L6
  ; basic/basic.e16.ts:1571  length = autoPrefix()
  call autoPrefix
  mv s1, a0 ; length
.L6:
  ; basic/basic.e16.ts:1572  const n: i16 = editLine(addr(lineBuf), LINE_MAX, length)
  la a0, lineBuf
  li a1, 78
  mv a2, s1
  call editLine
  mv s2, a0 ; n
  ; basic/basic.e16.ts:1573  length = 0
  li s1, 0 ; length
  ; basic/basic.e16.ts:1574  if (n === EDIT_UP || n === EDIT_DOWN) {
  li t0, 65532
  beq s2, t0, .L8
  li t0, 65531
  bne s2, t0, .L7
.L8:
  ; basic/basic.e16.ts:1575  length = recall(n === EDIT_UP)
  li t0, 65532
  sub t0, s2, t0
  seqz a0, t0
  call recall
  mv s1, a0 ; length
  ; basic/basic.e16.ts:1576  prompt = false
  li s3, 0 ; prompt
  ; basic/basic.e16.ts:1577  continue
  j .L1
.L7:
  ; basic/basic.e16.ts:1579  edited(n)
  mv a0, s2
  call edited
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:1584 autoPrefix() at -O1
;   n in s1
autoPrefix:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1585  if (autoLine === 0) return 0
  lw t0, 0x0126(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1585  return 0
  li a0, 0
  j .return
.L1:
  ; basic/basic.e16.ts:1586  const n = unsignedText(autoLine, addr(lineBuf))
  lw a0, 0x0126(zero)
  la a1, lineBuf
  call unsignedText
  mv s1, a0 ; n
  ; basic/basic.e16.ts:1587  poke(addr(lineBuf) + n, CH_SPACE)
  li t0, 32
  sb t0, lineBuf(s1)
  ; basic/basic.e16.ts:1588  return n + 1
  addi a0, s1, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1592 edited(n) at -O1
;   n in s1
edited:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; basic/basic.e16.ts:1593  if (n < 0) autoLine = 0
  bge s1, zero, .L1
  ; basic/basic.e16.ts:1593  autoLine = 0
  sw zero, 0x0126(zero)
.L1:
  ; basic/basic.e16.ts:1594  if (n === EDIT_MODE) {
  li t0, 65533
  bne s1, t0, .L2
  ; basic/basic.e16.ts:1595  proMode = !proMode
  lw t0, 0x013a(zero)
  seqz t0, t0
  sw t0, 0x013a(zero)
  ; basic/basic.e16.ts:1596  marks()
  call marks
  ; basic/basic.e16.ts:1597  return
  j .return
.L2:
  ; basic/basic.e16.ts:1600  if (n < 0) return
  bge s1, zero, .L3
  ; basic/basic.e16.ts:1600  return
  j .return
.L3:
  ; basic/basic.e16.ts:1602  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1603  if (n === 0) return
  bne s1, zero, .L4
  ; basic/basic.e16.ts:1603  return
  j .return
.L4:
  ; basic/basic.e16.ts:1604  move(addr(lineBuf), addr(lastLine), u16(n))
  la a0, lineBuf
  la a1, lastLine
  mv a2, s1
  call move
  ; basic/basic.e16.ts:1605  lastLength = u16(n)
  sw s1, 0x0142(zero)
  ; basic/basic.e16.ts:1606  enter()
  call enter
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1614 recall(up) at -O1
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
  ; basic/basic.e16.ts:1615  if (!proMode) {
  lw t0, 0x013a(zero)
  bnez t0, .L1
  ; basic/basic.e16.ts:1616  if (!up) return 0
  bnez s3, .L2
  ; basic/basic.e16.ts:1616  return 0
  li a0, 0
  j .return
.L2:
  ; basic/basic.e16.ts:1617  move(addr(lastLine), addr(lineBuf), lastLength)
  lw t0, 0x0142(zero)
  la a0, lastLine
  la a1, lineBuf
  mv a2, t0
  call move
  ; basic/basic.e16.ts:1618  return lastLength
  lw a0, 0x0142(zero)
  j .return
.L1:
  ; basic/basic.e16.ts:1620  let at: u16 = 0
  li s1, 0 ; at
  ; basic/basic.e16.ts:1621  if (up && justStored) at = findLine(recallNo, true)
  beqz s3, .L3
  lw t0, 0x0140(zero)
  beqz t0, .L3
  ; basic/basic.e16.ts:1621  at = findLine(recallNo, true)
  lw a0, 0x013e(zero)
  li a1, 1
  call findLine
  mv s1, a0 ; at
.L3:
  ; basic/basic.e16.ts:1622  justStored = false
  sw zero, 0x0140(zero)
  ; basic/basic.e16.ts:1623  if (at === 0) at = neighbour(up)
  bne s1, zero, .L4
  ; basic/basic.e16.ts:1623  at = neighbour(up)
  mv a0, s3
  call neighbour
  mv s1, a0 ; at
.L4:
  ; basic/basic.e16.ts:1624  if (at === 0) at = findLine(recallNo, true)
  bne s1, zero, .L5
  ; basic/basic.e16.ts:1624  at = findLine(recallNo, true)
  lw a0, 0x013e(zero)
  li a1, 1
  call findLine
  mv s1, a0 ; at
.L5:
  ; basic/basic.e16.ts:1625  if (at === 0) return 0
  bne s1, zero, .L6
  ; basic/basic.e16.ts:1625  return 0
  li a0, 0
  j .return
.L6:
  ; basic/basic.e16.ts:1626  recallNo = peek16(at)
  lw t0, 0(s1)
  sw t0, 0x013e(zero)
  ; basic/basic.e16.ts:1627  const digits = unsignedText(recallNo, addr(lineBuf))
  mv a0, t0
  la a1, lineBuf
  call unsignedText
  mv s2, a0 ; digits
  ; basic/basic.e16.ts:1628  poke(addr(lineBuf) + digits, CH_SPACE)
  li t0, 32
  sb t0, lineBuf(s2)
  ; basic/basic.e16.ts:1629  return digits + 1 + expand(at + 4, addr(lineBuf) + digits + 1, LINE_MAX - digits - 1)
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

; basic/basic.e16.ts:1633 neighbour(up) at -O1
;   up in a0
;   at in a1
;   found in a2
;   n in a3
neighbour:
  ; basic/basic.e16.ts:1634  let at = PROG
  li a1, 2048 ; at
  ; basic/basic.e16.ts:1635  let found: u16 = 0
  li a2, 0 ; found
  ; basic/basic.e16.ts:1636  while (peek16(at) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:1637  const n = peek16(at)
  lw a3, 0(a1)
  ; basic/basic.e16.ts:1638  if (!up && n > recallNo) return at
  bnez a0, .L5
  lw t0, 0x013e(zero)
  bgeu t0, a3, .L5
  ; basic/basic.e16.ts:1638  return at
  mv a0, a1
  ret
.L5:
  ; basic/basic.e16.ts:1639  if (up && (recallNo === 0 || n < recallNo)) found = at
  beqz a0, .L6
  lw t0, 0x013e(zero)
  beq t0, zero, .L7
  lw t0, 0x013e(zero)
  bgeu a3, t0, .L6
.L7:
  ; basic/basic.e16.ts:1639  found = at
  mv a2, a1 ; found
.L6:
  ; basic/basic.e16.ts:1640  at += peek16(at + 2)
  lw t0, 2(a1)
  add a1, a1, t0
.L3:
  lw t0, 0(a1)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1642  return found
  mv a0, a2
.return:
  ret

; basic/basic.e16.ts:1645 showBanner() at -O1
showBanner:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1646  puts(str('ELEC-16 BASIC 1.0'))
  la a0, str_23
  call puts
  ; basic/basic.e16.ts:1647  newline()
  call newline
  ; basic/basic.e16.ts:1648  printUnsigned(LIMIT - varEnd)
  lw t0, 0x0114(zero)
  li t1, 28672
  sub a0, t1, t0
  call printUnsigned
  ; basic/basic.e16.ts:1649  puts(str(' BYTES FREE'))
  la a0, str_24
  call puts
  ; basic/basic.e16.ts:1650  newline()
  call newline
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1654 basicCold() at -O1
basicCold:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1655  poke16(INBASIC, 1)
  li t0, 1
  sw t0, 28(zero)
  ; basic/basic.e16.ts:1656  poke16(BRKFLAG, 0)
  sw zero, 30(zero)
  ; basic/basic.e16.ts:1658  keepProgramTo(keptProgramEnd())
  call keptProgramEnd
  call keepProgramTo
  ; basic/basic.e16.ts:1659  poke16(MATH_ANGLE, 0)
  li t0, 65372
  sw zero, 0(t0)
  ; basic/basic.e16.ts:1660  angleMarks = ANN_DEG
  li t0, 128
  sw t0, 0x013c(zero)
  ; basic/basic.e16.ts:1661  proMode = false
  sw zero, 0x013a(zero)
  ; basic/basic.e16.ts:1662  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1663  showBanner()
  call showBanner
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1667 basicWarm() at -O1
basicWarm:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1668  poke16(INBASIC, 1)
  li t0, 1
  sw t0, 28(zero)
  ; basic/basic.e16.ts:1669  poke16(BRKFLAG, 0)
  sw zero, 30(zero)
  ; basic/basic.e16.ts:1670  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1671  showBanner()
  call showBanner
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

str_0:
  .byte 82, 85, 78, 32, 76, 73, 83, 84, 32, 78, 69, 87, 32, 67, 79, 78, 84, 32, 80, 82, 73, 78, 84, 32, 73, 78, 80, 85, 84, 32, 76, 69, 84, 32, 73, 70, 32, 84, 72, 69, 78, 32, 69, 76, 83, 69, 32, 70, 79, 82, 32, 84, 79, 32, 83, 84, 69, 80, 32, 78, 69, 88, 84, 32, 71, 79, 84, 79, 32, 71, 79, 83, 85, 66, 32, 82, 69, 84, 85, 82, 78, 32, 69, 78, 68, 32, 83, 84, 79, 80, 32, 82, 69, 77, 32, 77, 79, 78, 32, 67, 76, 83, 32, 68, 69, 71, 32, 82, 65, 68, 32, 71, 82, 65, 68, 32, 80, 79, 75, 69, 32, 67, 65, 76, 76, 32, 87, 65, 73, 84, 32, 66, 69, 69, 80, 32, 68, 73, 77, 32, 68, 65, 84, 65, 32, 82, 69, 65, 68, 32, 82, 69, 83, 84, 79, 82, 69, 32, 79, 78, 32, 67, 76, 69, 65, 82, 32, 65, 85, 84, 79, 32, 82, 69, 78, 85, 77, 32, 68, 69, 76, 69, 84, 69, 32, 84, 82, 79, 78, 32, 84, 82, 79, 70, 70, 32, 70, 73, 76, 69, 83, 32, 76, 79, 65, 68, 32, 83, 65, 86, 69, 32, 75, 73, 76, 76, 32, 76, 79, 67, 65, 84, 69, 32, 67, 85, 82, 83, 79, 82, 32, 80, 83, 69, 84, 32, 80, 82, 69, 83, 69, 84, 32, 76, 73, 78, 69, 32, 71, 80, 82, 73, 78, 84, 32, 79, 80, 69, 78, 32, 67, 76, 79, 83, 69, 32, 83, 73, 78, 32, 67, 79, 83, 32, 84, 65, 78, 32, 65, 83, 73, 78, 32, 65, 67, 79, 83, 32, 65, 84, 65, 78, 32, 83, 81, 82, 32, 65, 66, 83, 32, 73, 78, 84, 32, 83, 71, 78, 32, 76, 79, 71, 32, 76, 78, 32, 69, 88, 80, 32, 82, 78, 68, 32, 80, 73, 32, 65, 78, 83, 32, 80, 69, 69, 75, 32, 80, 79, 73, 78, 84, 32, 78, 79, 84, 32, 65, 78, 68, 32, 79, 82, 32, 76, 69, 78, 32, 76, 69, 70, 84, 36, 32, 77, 73, 68, 36, 32, 82, 73, 71, 72, 84, 36, 32, 67, 72, 82, 36, 32, 65, 83, 67, 32, 83, 84, 82, 36, 32, 86, 65, 76, 32, 73, 78, 75, 69, 89, 36, 32, 84, 73, 77, 69, 36, 32, 68, 65, 84, 69, 36, 32, 69, 79, 70, 32, 76, 67, 68, 87, 32, 76, 67, 68, 72, 32, 79, 70, 70, 32, 65, 83, 32, 79, 85, 84, 80, 85, 84, 32, 65, 80, 80, 69, 78, 68, 32, 67, 73, 82, 67, 76, 69, 0
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
  .byte 84, 89, 80, 69, 0
str_13:
  .byte 78, 79, 32, 70, 73, 76, 69, 0
str_14:
  .byte 67, 65, 82, 68, 0
str_15:
  .byte 78, 79, 32, 68, 65, 84, 65, 0
str_16:
  .byte 73, 78, 68, 69, 88, 0
str_17:
  .byte 68, 73, 77, 0
str_18:
  .byte 70, 73, 76, 69, 0
str_19:
  .byte 32, 73, 78, 32, 0
str_20:
  .byte 69, 82, 82, 58, 0
str_21:
  .byte 66, 82, 69, 65, 75, 0
str_22:
  .byte 83, 84, 79, 80, 0
str_23:
  .byte 69, 76, 69, 67, 45, 49, 54, 32, 66, 65, 83, 73, 67, 32, 49, 46, 48, 0
str_24:
  .byte 32, 66, 89, 84, 69, 83, 32, 70, 82, 69, 69, 0
  .align 2
e16c_fixed_end:

  .bank 0
  .org 0xc000
; basic/strings.e16.ts:150 index() at -O1
;   i in s1
index:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/strings.e16.ts:151  needNumber()
  call needNumber
  ; basic/strings.e16.ts:152  const i = toInt(top())
  call top
  call toInt
  mv s1, a0 ; i
  ; basic/strings.e16.ts:153  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:154  if (i < 0) fail(E_INDEX)
  bge s1, zero, .L1
  ; basic/strings.e16.ts:154  fail(E_INDEX)
  li a0, 15
  call fail
.L1:
  ; basic/strings.e16.ts:155  return u16(i)
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/strings.e16.ts:163 dimension(kind, d1, d2, room) at -O1
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
  ; basic/strings.e16.ts:164  const each: u16 = (kind & K_STRING) !== 0 ? room + 1 : 8
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
  ; basic/strings.e16.ts:165  const count = (d1 + 1) * (d2 + 1)
  addi t0, s2, 1
  addi t1, s1, 1
  mul t1, t1, t0
  sw t1, 6(fp) ; count
  ; basic/strings.e16.ts:167  if (d1 >= 0x7fff || d2 >= 0x7fff || d2 + 1 > div(0x7fff, d1 + 1) || count > div(0x7ff0, each))
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
  ; basic/strings.e16.ts:168  fail(E_MEMORY)
  li a0, 8
  call fail
.L3:
  ; basic/strings.e16.ts:169  const rec = newRecord(kind, room, (VAR_HEAD + 4 + count * each + 1) & 0xfffe)
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
  ; basic/strings.e16.ts:170  poke16(rec + VAR_HEAD, d1)
  sw s1, 6(s3)
  ; basic/strings.e16.ts:171  poke16(rec + VAR_HEAD + 2, d2)
  sw s2, 8(s3)
  ; basic/strings.e16.ts:172  return rec
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

; basic/strings.e16.ts:176 kindOf(strings, two) at -O1
;   strings in a0
;   two in a1
kindOf:
  ; basic/strings.e16.ts:177  return K_ARRAY | (strings ? K_STRING : 0) | (two ? K_TWO : 0)
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

; basic/strings.e16.ts:184 elementAt() at -O1
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
  ; basic/strings.e16.ts:185  const key = nameKey()
  call nameKey
  sw a0, 8(fp) ; key
  ; basic/strings.e16.ts:186  const strings = nameIsString
  lw s2, 0x061a(zero)
  ; basic/strings.e16.ts:187  step()
  call step
  ; basic/strings.e16.ts:188  expr()
  call expr
  ; basic/strings.e16.ts:189  const i = index()
  call index
  sw a0, 2(fp) ; i
  ; basic/strings.e16.ts:190  let j: u16 = 0
  sw zero, 0(fp) ; j
  ; basic/strings.e16.ts:191  let two = false
  li s3, 0 ; two
  ; basic/strings.e16.ts:192  if (next() === CH_COMMA) {
  call next
  li t0, 44
  bne a0, t0, .L1
  ; basic/strings.e16.ts:193  step()
  call step
  ; basic/strings.e16.ts:194  expr()
  call expr
  ; basic/strings.e16.ts:195  j = index()
  call index
  sw a0, 0(fp) ; j
  ; basic/strings.e16.ts:196  two = true
  li s3, 1 ; two
.L1:
  ; basic/strings.e16.ts:198  expect(CH_RPAREN)
  li a0, 41
  call expect
  ; basic/strings.e16.ts:199  setNameKey(key)
  lw a0, 8(fp)
  call setNameKey
  ; basic/strings.e16.ts:200  let rec = findRecord(K_ARRAY | (strings ? K_STRING : 0))
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
  ; basic/strings.e16.ts:201  if (rec === 0) rec = dimension(kindOf(strings, two), 10, two ? 10 : 0, strings ? STRING_ROOM : 0)
  bne s1, zero, .L4
  ; basic/strings.e16.ts:201  rec = dimension(kindOf(strings, two), 10, two ? 10 : 0, strings ? STRING_ROOM : 0)
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
  ; basic/strings.e16.ts:202  const d1 = peek16(rec + VAR_HEAD)
  lw t0, 6(s1)
  sw t0, 10(fp) ; d1
  ; basic/strings.e16.ts:203  const d2 = peek16(rec + VAR_HEAD + 2)
  lw t0, 8(s1)
  sw t0, 4(fp) ; d2
  ; basic/strings.e16.ts:204  const hasTwo = (peek(rec + 2) & K_TWO) !== 0
  lbu t0, 2(s1)
  andi t0, t0, 4
  sub t0, t0, zero
  snez t0, t0
  sw t0, 12(fp) ; hasTwo
  ; basic/strings.e16.ts:205  if (hasTwo !== two || i > d1 || j > d2) fail(E_INDEX)
  lw t0, 12(fp) ; hasTwo
  bne t0, s3, .L10
  lw t0, 10(fp) ; d1
  lw t1, 2(fp) ; i
  bltu t0, t1, .L10
  lw t0, 4(fp) ; d2
  lw t1, 0(fp) ; j
  bgeu t0, t1, .L9
.L10:
  ; basic/strings.e16.ts:205  fail(E_INDEX)
  li a0, 15
  call fail
.L9:
  ; basic/strings.e16.ts:206  const room = peek(rec + 3)
  lbu t0, 3(s1)
  sw t0, 6(fp) ; room
  ; basic/strings.e16.ts:207  setVarRoom(room)
  lw a0, 6(fp)
  call setVarRoom
  ; basic/strings.e16.ts:208  setStrType(strings)
  mv a0, s2
  call setStrType
  ; basic/strings.e16.ts:209  const each: u16 = strings ? room + 1 : 8
  beqz s2, .L11
  lw t0, 6(fp) ; room
  addi t0, t0, 1
  j .L12
.L11:
  li t0, 8
.L12:
  sw t0, 14(fp) ; each
  ; basic/strings.e16.ts:210  return rec + VAR_HEAD + 4 + (i * (d2 + 1) + j) * each
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

; basic/strings.e16.ts:214 roomOf() at -O1
;   room in s1
roomOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/strings.e16.ts:215  if (next() !== CH_STAR) return STRING_ROOM
  call next
  li t0, 42
  beq a0, t0, .L1
  ; basic/strings.e16.ts:215  return STRING_ROOM
  li a0, 16
  j .return
.L1:
  ; basic/strings.e16.ts:216  step()
  call step
  ; basic/strings.e16.ts:217  const room = readUnsigned()
  call readUnsigned
  mv s1, a0 ; room
  ; basic/strings.e16.ts:218  if (room < 1 || room > 255) fail(E_ARGUMENT)
  li t0, 1
  bltu s1, t0, .L3
  li t0, 255
  bgeu t0, s1, .L2
.L3:
  ; basic/strings.e16.ts:218  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L2:
  ; basic/strings.e16.ts:219  return room
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/strings.e16.ts:223 dimStatement() at -O1
dimStatement:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/strings.e16.ts:224  for (;;) {
.L1:
  ; basic/strings.e16.ts:225  readName()
  call readName
  ; basic/strings.e16.ts:226  if (next() === CH_LPAREN) dimArray(nameKey())
  call next
  li t0, 40
  bne a0, t0, .L5
  ; basic/strings.e16.ts:226  dimArray(nameKey())
  call nameKey
  call dimArray
  j .L6
.L5:
  ; basic/strings.e16.ts:227  dimString(nameKey())
  call nameKey
  call dimString
.L6:
  ; basic/strings.e16.ts:228  if (next() !== CH_COMMA) return
  call next
  li t0, 44
  beq a0, t0, .L7
  ; basic/strings.e16.ts:228  return
  j .return
.L7:
  ; basic/strings.e16.ts:229  step()
  call step
  j .L1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/strings.e16.ts:234 dimArray(key) at -O1
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
  ; basic/strings.e16.ts:235  const strings = nameIsString
  lw s1, 0x061a(zero)
  ; basic/strings.e16.ts:236  step()
  call step
  ; basic/strings.e16.ts:237  expr()
  call expr
  ; basic/strings.e16.ts:238  const d1 = index()
  call index
  sw a0, 2(fp) ; d1
  ; basic/strings.e16.ts:239  let d2: u16 = 0
  li s2, 0 ; d2
  ; basic/strings.e16.ts:240  const two = next() === CH_COMMA
  call next
  li t0, 44
  sub t0, a0, t0
  seqz s3, t0
  ; basic/strings.e16.ts:241  if (two) {
  beqz s3, .L1
  ; basic/strings.e16.ts:242  step()
  call step
  ; basic/strings.e16.ts:243  expr()
  call expr
  ; basic/strings.e16.ts:244  d2 = index()
  call index
  mv s2, a0 ; d2
.L1:
  ; basic/strings.e16.ts:246  expect(CH_RPAREN)
  li a0, 41
  call expect
  ; basic/strings.e16.ts:247  const room = strings ? roomOf() : 0
  beqz s1, .L2
  call roomOf
  mv t0, a0
  j .L3
.L2:
  li t0, 0
.L3:
  sw t0, 4(fp) ; room
  ; basic/strings.e16.ts:248  setNameKey(key)
  lw a0, 0(fp)
  call setNameKey
  ; basic/strings.e16.ts:249  if (findRecord(K_ARRAY | (strings ? K_STRING : 0)) !== 0) fail(E_DIM)
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
  ; basic/strings.e16.ts:249  fail(E_DIM)
  li a0, 16
  call fail
.L4:
  ; basic/strings.e16.ts:250  dimension(kindOf(strings, two), d1, d2, room)
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

; basic/strings.e16.ts:254 dimString(key) at -O1
;   key in s2
;   room in s1
dimString:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; key
  ; basic/strings.e16.ts:255  if (!nameIsString) fail(E_SYNTAX)
  lw t0, 0x061a(zero)
  bnez t0, .L1
  ; basic/strings.e16.ts:255  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/strings.e16.ts:256  const room = roomOf()
  call roomOf
  mv s1, a0 ; room
  ; basic/strings.e16.ts:257  setNameKey(key)
  mv a0, s2
  call setNameKey
  ; basic/strings.e16.ts:258  if (findRecord(K_STRING) !== 0) fail(E_DIM)
  li a0, 1
  call findRecord
  beq a0, zero, .L2
  ; basic/strings.e16.ts:258  fail(E_DIM)
  li a0, 16
  call fail
.L2:
  ; basic/strings.e16.ts:259  newRecord(K_STRING, room, stringSize(room))
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

; basic/strings.e16.ts:265 join() at -O1
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
  ; basic/strings.e16.ts:266  const b = top()
  call top
  mv s3, a0 ; b
  ; basic/strings.e16.ts:267  const a = b - 8
  addi t0, s3, -8
  sw t0, 2(fp) ; a
  ; basic/strings.e16.ts:268  const na = stringLength(a)
  lw a0, 2(fp)
  call stringLength
  mv s1, a0 ; na
  ; basic/strings.e16.ts:269  const nb = stringLength(b)
  mv a0, s3
  call stringLength
  mv s2, a0 ; nb
  ; basic/strings.e16.ts:270  if (na + nb > 255) fail(E_ARGUMENT)
  add t0, s1, s2
  li t1, 255
  bgeu t1, t0, .L1
  ; basic/strings.e16.ts:270  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L1:
  ; basic/strings.e16.ts:271  const at = tempString(na + nb)
  add a0, s1, s2
  call tempString
  sw a0, 0(fp) ; at
  ; basic/strings.e16.ts:272  move(stringAt(a), at, na)
  lw a0, 2(fp)
  call stringAt
  lw a1, 0(fp)
  mv a2, s1
  call move
  ; basic/strings.e16.ts:273  move(stringAt(b), at + na, nb)
  mv a0, s3
  call stringAt
  lw t0, 0(fp) ; at
  add a1, t0, s1
  mv a2, s2
  call move
  ; basic/strings.e16.ts:274  setNsp(nsp - 16)
  lw t0, 0x0116(zero)
  addi a0, t0, -16
  call setNsp
  ; basic/strings.e16.ts:275  pushString(at, na + nb)
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

; basic/strings.e16.ts:279 compareStrings() at -O1
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
  ; basic/strings.e16.ts:280  const b = top()
  call top
  mv s2, a0 ; b
  ; basic/strings.e16.ts:281  const a = b - 8
  addi t0, s2, -8
  sw t0, 2(fp) ; a
  ; basic/strings.e16.ts:282  const na = stringLength(a)
  lw a0, 2(fp)
  call stringLength
  mv s3, a0 ; na
  ; basic/strings.e16.ts:283  const nb = stringLength(b)
  mv a0, s2
  call stringLength
  sw a0, 0(fp) ; nb
  ; basic/strings.e16.ts:284  const pa = stringAt(a)
  lw a0, 2(fp)
  call stringAt
  sw a0, 8(fp) ; pa
  ; basic/strings.e16.ts:285  const pb = stringAt(b)
  mv a0, s2
  call stringAt
  sw a0, 10(fp) ; pb
  ; basic/strings.e16.ts:286  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:287  for (let k: u16 = 0; k < na && k < nb; k++) {
  li s1, 0 ; k
  j .L3
.L1:
  ; basic/strings.e16.ts:288  const ca = peek(pa + k)
  lw t0, 8(fp) ; pa
  add t0, t0, s1
  lbu t0, 0(t0)
  sw t0, 4(fp) ; ca
  ; basic/strings.e16.ts:289  const cb = peek(pb + k)
  lw t0, 10(fp) ; pb
  add t0, t0, s1
  lbu t0, 0(t0)
  sw t0, 6(fp) ; cb
  ; basic/strings.e16.ts:290  if (ca !== cb) return ca < cb ? 0xffff : 1
  lw t0, 6(fp) ; cb
  lw t1, 4(fp) ; ca
  beq t1, t0, .L5
  ; basic/strings.e16.ts:290  return ca < cb ? 0xffff : 1
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
  ; basic/strings.e16.ts:292  if (na === nb) return 0
  lw t0, 0(fp) ; nb
  bne s3, t0, .L9
  ; basic/strings.e16.ts:292  return 0
  li a0, 0
  j .return
.L9:
  ; basic/strings.e16.ts:293  return na < nb ? 0xffff : 1
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

; basic/strings.e16.ts:297 moreFunctions(token) at -O1
;   token in s1
moreFunctions:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; token
  ; basic/strings.e16.ts:298  if (token === T_LEFT || token === T_MID || token === T_RIGHT) {
  li t0, 202
  beq s1, t0, .L2
  li t0, 203
  beq s1, t0, .L2
  li t0, 204
  bne s1, t0, .L1
.L2:
  ; basic/strings.e16.ts:299  part(token)
  mv a0, s1
  call part
  ; basic/strings.e16.ts:300  return
  j .return
.L1:
  ; basic/strings.e16.ts:302  if (token === T_INKEY || token === T_TIME || token === T_DATE) {
  li t0, 209
  beq s1, t0, .L4
  li t0, 210
  beq s1, t0, .L4
  li t0, 211
  bne s1, t0, .L3
.L4:
  ; basic/strings.e16.ts:303  noArgument(token)
  mv a0, s1
  call noArgument
  ; basic/strings.e16.ts:304  return
  j .return
.L3:
  ; basic/strings.e16.ts:306  if (token === T_LCDW || token === T_LCDH) {
  li t0, 213
  beq s1, t0, .L6
  li t0, 214
  bne s1, t0, .L5
.L6:
  ; basic/strings.e16.ts:307  setInt(push(), i16(peek16(token === T_LCDW ? IO_WIDTH : IO_HEIGHT)))
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
  ; basic/strings.e16.ts:308  setStrType(false)
  li a0, 0
  call setStrType
  ; basic/strings.e16.ts:309  return
  j .return
.L5:
  ; basic/strings.e16.ts:311  if (token === T_EOF) {
  li t0, 212
  bne s1, t0, .L9
  ; basic/strings.e16.ts:312  eofFunction()
  la t0, eofFunction
  li t1, 2
  call far_call
  ; basic/strings.e16.ts:313  return
  j .return
.L9:
  ; basic/strings.e16.ts:315  unary()
  call unary
  ; basic/strings.e16.ts:316  oneArgument(token)
  mv a0, s1
  call oneArgument
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/strings.e16.ts:320 oneArgument(token) at -O1
;   token in s1
oneArgument:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; token
  ; basic/strings.e16.ts:321  if (token === T_LEN || token === T_ASC || token === T_VAL) ofString(token)
  li t0, 201
  beq s1, t0, .L2
  li t0, 206
  beq s1, t0, .L2
  li t0, 208
  bne s1, t0, .L1
.L2:
  ; basic/strings.e16.ts:321  ofString(token)
  mv a0, s1
  call ofString
  j .L3
.L1:
  ; basic/strings.e16.ts:322  ofNumber(token)
  mv a0, s1
  call ofNumber
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/strings.e16.ts:326 ofString(token) at -O1
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
  ; basic/strings.e16.ts:327  const e = top()
  call top
  mv s1, a0 ; e
  ; basic/strings.e16.ts:328  needString()
  call needString
  ; basic/strings.e16.ts:329  const n = stringLength(e)
  mv a0, s1
  call stringLength
  mv s2, a0 ; n
  ; basic/strings.e16.ts:330  const at = stringAt(e)
  mv a0, s1
  call stringAt
  mv s0, a0 ; at
  ; basic/strings.e16.ts:331  setStrType(false)
  li a0, 0
  call setStrType
  ; basic/strings.e16.ts:332  if (token === T_VAL) {
  li t0, 208
  bne s3, t0, .L1
  ; basic/strings.e16.ts:333  if (readNumber(e, at, n) === 0) setInt(e, 0)
  mv a0, s1
  mv a1, s0
  mv a2, s2
  call readNumber
  bne a0, zero, .L2
  ; basic/strings.e16.ts:333  setInt(e, 0)
  mv a0, s1
  li a1, 0
  call setInt
.L2:
  ; basic/strings.e16.ts:334  return
  j .return
.L1:
  ; basic/strings.e16.ts:336  setInt(e, token === T_LEN ? i16(n) : n === 0 ? 0 : i16(peek(at)))
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

; basic/strings.e16.ts:340 ofNumber(token) at -O1
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
  ; basic/strings.e16.ts:341  const e = top()
  call top
  mv s0, a0 ; e
  ; basic/strings.e16.ts:342  needNumber()
  call needNumber
  ; basic/strings.e16.ts:343  if (token === T_CHR) {
  li t0, 205
  bne s3, t0, .L1
  ; basic/strings.e16.ts:344  const c = toInt(e)
  mv a0, s0
  call toInt
  mv s1, a0 ; c/n
  ; basic/strings.e16.ts:345  if (c < 0 || c > 255) fail(E_ARGUMENT)
  blt s1, zero, .L3
  li t0, 255
  bge t0, s1, .L2
.L3:
  ; basic/strings.e16.ts:345  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L2:
  ; basic/strings.e16.ts:346  const at = tempString(1)
  li a0, 1
  call tempString
  mv s2, a0 ; at
  ; basic/strings.e16.ts:347  poke(at, u16(c))
  sb s1, 0(s2)
  ; basic/strings.e16.ts:348  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:349  pushString(at, 1)
  mv a0, s2
  li a1, 1
  call pushString
  ; basic/strings.e16.ts:350  return
  j .return
.L1:
  ; basic/strings.e16.ts:352  if (token !== T_STR) fail(E_SYNTAX)
  li t0, 207
  beq s3, t0, .L4
  ; basic/strings.e16.ts:352  fail(E_SYNTAX)
  li a0, 1
  call fail
.L4:
  ; basic/strings.e16.ts:353  const n = formatTop()
  call formatTop
  mv s1, a0 ; c/n
  ; basic/strings.e16.ts:354  const at = tempString(n)
  mv a0, s1
  call tempString
  mv s2, a0 ; at
  ; basic/strings.e16.ts:355  move(addr(textOut), at, n)
  la a0, textOut
  mv a1, s2
  mv a2, s1
  call move
  ; basic/strings.e16.ts:356  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:357  pushString(at, n)
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

; basic/strings.e16.ts:361 part(token) at -O1
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
  ; basic/strings.e16.ts:362  expect(CH_LPAREN)
  li a0, 40
  call expect
  ; basic/strings.e16.ts:363  expr()
  call expr
  ; basic/strings.e16.ts:364  needString()
  call needString
  ; basic/strings.e16.ts:365  expect(CH_COMMA)
  li a0, 44
  call expect
  ; basic/strings.e16.ts:366  expr()
  call expr
  ; basic/strings.e16.ts:367  const a = count()
  call count
  mv s3, a0 ; a
  ; basic/strings.e16.ts:368  let b: u16 = 255
  li t0, 255
  sw t0, 4(fp) ; b
  ; basic/strings.e16.ts:369  if (token === T_MID && next() === CH_COMMA) {
  li t0, 203
  lw t1, 2(fp) ; token
  bne t1, t0, .L1
  call next
  li t0, 44
  bne a0, t0, .L1
  ; basic/strings.e16.ts:370  step()
  call step
  ; basic/strings.e16.ts:371  expr()
  call expr
  ; basic/strings.e16.ts:372  b = count()
  call count
  sw a0, 4(fp) ; b
.L1:
  ; basic/strings.e16.ts:374  expect(CH_RPAREN)
  li a0, 41
  call expect
  ; basic/strings.e16.ts:375  const e = top()
  call top
  sw a0, 6(fp) ; e
  ; basic/strings.e16.ts:376  const n = stringLength(e)
  lw a0, 6(fp)
  call stringLength
  mv s2, a0 ; n
  ; basic/strings.e16.ts:377  let from: u16 = 0
  li s1, 0 ; from
  ; basic/strings.e16.ts:378  let length = a
  sw s3, 0(fp) ; length
  ; basic/strings.e16.ts:379  if (token === T_RIGHT) from = a < n ? n - a : 0
  li t0, 204
  lw t1, 2(fp) ; token
  bne t1, t0, .L2
  ; basic/strings.e16.ts:379  from = a < n ? n - a : 0
  bgeu s3, s2, .L3
  sub t0, s2, s3
  j .L4
.L3:
  li t0, 0
.L4:
  mv s1, t0 ; from
.L2:
  ; basic/strings.e16.ts:380  if (token === T_MID) {
  li t0, 203
  lw t1, 2(fp) ; token
  bne t1, t0, .L5
  ; basic/strings.e16.ts:382  from = a === 0 ? 0 : a - 1
  bne s3, zero, .L6
  li t0, 0
  j .L7
.L6:
  addi t0, s3, -1
.L7:
  mv s1, t0 ; from
  ; basic/strings.e16.ts:383  length = b
  lw t0, 4(fp) ; b
  sw t0, 0(fp) ; length
.L5:
  ; basic/strings.e16.ts:385  if (from > n) from = n
  bgeu s2, s1, .L8
  ; basic/strings.e16.ts:385  from = n
  mv s1, s2 ; from
.L8:
  ; basic/strings.e16.ts:386  if (length > n - from) length = n - from
  sub t0, s2, s1
  lw t1, 0(fp) ; length
  bgeu t0, t1, .L9
  ; basic/strings.e16.ts:386  length = n - from
  sub t0, s2, s1
  sw t0, 0(fp) ; length
.L9:
  ; basic/strings.e16.ts:387  const at = stringAt(e)
  lw a0, 6(fp)
  call stringAt
  sw a0, 8(fp) ; at
  ; basic/strings.e16.ts:388  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:389  pushString(at + from, length)
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

; basic/strings.e16.ts:393 count() at -O1
;   v in s1
count:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/strings.e16.ts:394  needNumber()
  call needNumber
  ; basic/strings.e16.ts:395  const v = toInt(top())
  call top
  call toInt
  mv s1, a0 ; v
  ; basic/strings.e16.ts:396  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:397  if (v < 0) fail(E_ARGUMENT)
  bge s1, zero, .L1
  ; basic/strings.e16.ts:397  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L1:
  ; basic/strings.e16.ts:398  return v > 255 ? 255 : u16(v)
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

; basic/strings.e16.ts:402 noArgument(token) at -O1
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
  ; basic/strings.e16.ts:403  if (token === T_INKEY) {
  li t0, 209
  bne s2, t0, .L1
  ; basic/strings.e16.ts:405  const c = pollkey()
  call pollkey
  mv s1, a0 ; c/at
  ; basic/strings.e16.ts:406  if (c === 0) {
  bne s1, zero, .L2
  ; basic/strings.e16.ts:407  pushString(0, 0)
  li a0, 0
  li a1, 0
  call pushString
  ; basic/strings.e16.ts:408  return
  j .return
.L2:
  ; basic/strings.e16.ts:410  const at = tempString(1)
  li a0, 1
  call tempString
  mv s3, a0 ; at
  ; basic/strings.e16.ts:411  poke(at, c)
  sb s1, 0(s3)
  ; basic/strings.e16.ts:412  pushString(at, 1)
  mv a0, s3
  li a1, 1
  call pushString
  ; basic/strings.e16.ts:413  return
  j .return
.L1:
  ; basic/strings.e16.ts:415  const at = tempString(10)
  li a0, 10
  call tempString
  mv s1, a0 ; c/at
  ; basic/strings.e16.ts:416  if (token === T_TIME) {
  li t0, 210
  bne s2, t0, .L3
  ; basic/strings.e16.ts:417  twoDigits(at, peek(IO_CLOCK + 2), 0x3a)
  li t0, 65338
  lbu t0, 0(t0)
  mv a0, s1
  mv a1, t0
  li a2, 58
  call twoDigits
  ; basic/strings.e16.ts:418  twoDigits(at + 3, peek(IO_CLOCK + 1), 0x3a)
  li t0, 65337
  lbu t0, 0(t0)
  addi a0, s1, 3
  mv a1, t0
  li a2, 58
  call twoDigits
  ; basic/strings.e16.ts:419  twoDigits(at + 6, peek(IO_CLOCK), 0)
  li t0, 65336
  lbu t0, 0(t0)
  addi a0, s1, 6
  mv a1, t0
  li a2, 0
  call twoDigits
  ; basic/strings.e16.ts:420  pushString(at, 8)
  mv a0, s1
  li a1, 8
  call pushString
  ; basic/strings.e16.ts:421  return
  j .return
.L3:
  ; basic/strings.e16.ts:423  twoDigits(at, 20, 0)
  mv a0, s1
  li a1, 20
  li a2, 0
  call twoDigits
  ; basic/strings.e16.ts:424  twoDigits(at + 2, peek(IO_CLOCK + 5), CH_MINUS)
  li t0, 65341
  lbu t0, 0(t0)
  addi a0, s1, 2
  mv a1, t0
  li a2, 45
  call twoDigits
  ; basic/strings.e16.ts:425  twoDigits(at + 5, peek(IO_CLOCK + 4), CH_MINUS)
  li t0, 65340
  lbu t0, 0(t0)
  addi a0, s1, 5
  mv a1, t0
  li a2, 45
  call twoDigits
  ; basic/strings.e16.ts:426  twoDigits(at + 8, peek(IO_CLOCK + 3), 0)
  li t0, 65339
  lbu t0, 0(t0)
  addi a0, s1, 8
  mv a1, t0
  li a2, 0
  call twoDigits
  ; basic/strings.e16.ts:427  pushString(at, 10)
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

; basic/strings.e16.ts:431 twoDigits(at, v, after) at -O1
;   at in a0
;   v in a1
;   after in a2
twoDigits:
  ; basic/strings.e16.ts:432  poke(at, CH_0 + div(v, 10))
  li t0, 10
  divu t0, a1, t0
  addi t0, t0, 48
  sb t0, 0(a0)
  ; basic/strings.e16.ts:433  poke(at + 1, CH_0 + (v % 10))
  li t0, 10
  remu t0, a1, t0
  addi t0, t0, 48
  sb t0, 1(a0)
  ; basic/strings.e16.ts:434  if (after !== 0) poke(at + 2, after)
  beq a2, zero, .L1
  ; basic/strings.e16.ts:434  poke(at + 2, after)
  sb a2, 2(a0)
.L1:
.return:
  ret

; basic/strings.e16.ts:441 readNumber(e, at, max) at -O1
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
  ; basic/strings.e16.ts:442  let p = at
  mv a3, a1 ; p
  ; basic/strings.e16.ts:443  let left = max
  mv s1, a2 ; left
  ; basic/strings.e16.ts:444  while (left > 0 && peek(p) === CH_SPACE) {
  j .L3
.L1:
  ; basic/strings.e16.ts:445  p++
  addi a3, a3, 1
  ; basic/strings.e16.ts:446  left--
  addi s1, s1, -1
.L3:
  bgeu zero, s1, .L5
  lbu t0, 0(a3)
  li t1, 32
  beq t0, t1, .L1
.L5:
  ; basic/strings.e16.ts:448  const minus = left > 0 && peek(p) === CH_MINUS
  sltu t0, zero, s1
  mv t1, t0
  beqz t1, .L6
  lbu t0, 0(a3)
  li t1, 45
  sub t0, t0, t1
  seqz t0, t0
.L6:
  mv s2, t0 ; minus
  ; basic/strings.e16.ts:449  if (minus) {
  beqz s2, .L7
  ; basic/strings.e16.ts:450  p++
  addi a3, a3, 1
  ; basic/strings.e16.ts:451  left--
  addi s1, s1, -1
.L7:
  ; basic/strings.e16.ts:453  poke16(MATH_A, e)
  li t0, 65362
  sw a0, 0(t0)
  ; basic/strings.e16.ts:454  poke16(MATH_B, p)
  li t0, 65364
  sw a3, 0(t0)
  ; basic/strings.e16.ts:455  poke16(MATH_ARG, left)
  li t0, 65366
  sw s1, 0(t0)
  ; basic/strings.e16.ts:456  poke16(MATH_OP, M_PARSE)
  li t0, 56
  li t1, 65360
  sw t0, 0(t1)
  ; basic/strings.e16.ts:457  const n = peek16(MATH_ARG)
  li t0, 65366
  lw s3, 0(t0)
  ; basic/strings.e16.ts:458  if (peek16(MATH_STATUS) !== 0 || n === 0) return 0
  li t0, 65368
  lw t0, 0(t0)
  bne t0, zero, .L9
  bne s3, zero, .L8
.L9:
  ; basic/strings.e16.ts:458  return 0
  li a0, 0
  j .return
.L8:
  ; basic/strings.e16.ts:459  if (minus) {
  beqz s2, .L10
  ; basic/strings.e16.ts:460  poke16(MATH_A, e)
  li t0, 65362
  sw a0, 0(t0)
  ; basic/strings.e16.ts:461  poke16(MATH_OP, M_NEG)
  li t0, 16
  li t1, 65360
  sw t0, 0(t1)
.L10:
  ; basic/strings.e16.ts:463  return p + n - at
  add t0, a3, s3
  sub a0, t0, a1
.return:
  lw s1, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  addi sp, sp, 6
  ret

; basic/strings.e16.ts:469 inputStatement() at -O1
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
  ; basic/strings.e16.ts:471  const again = txt - 1
  lw t0, 0x010e(zero)
  addi s3, t0, -1
  ; basic/strings.e16.ts:472  if (next() === CH_HASH) {
  call next
  li t0, 35
  bne a0, t0, .L1
  ; basic/strings.e16.ts:473  inputFromFile()
  la t0, inputFromFile
  li t1, 2
  call far_call
  ; basic/strings.e16.ts:474  return
  j .return
.L1:
  ; basic/strings.e16.ts:476  let prompt: u16 = 0
  li s1, 0 ; prompt
  ; basic/strings.e16.ts:477  if (next() === CH_QUOTE) {
  call next
  li t0, 34
  bne a0, t0, .L2
  ; basic/strings.e16.ts:478  prompt = txt + 1
  lw t0, 0x010e(zero)
  addi s1, t0, 1
  ; basic/strings.e16.ts:479  setTxt(quoted(prompt, false))
  mv a0, s1
  li a1, 0
  call quoted
  call setTxt
  ; basic/strings.e16.ts:480  if (next() === CH_SEMI || next() === CH_COMMA) step()
  call next
  li t0, 59
  beq a0, t0, .L4
  call next
  li t0, 44
  bne a0, t0, .L3
.L4:
  ; basic/strings.e16.ts:480  step()
  call step
.L3:
.L2:
  ; basic/strings.e16.ts:482  const list = txt
  lw s0, 0x010e(zero)
  ; basic/strings.e16.ts:483  for (;;) {
.L5:
  ; basic/strings.e16.ts:484  fresh_line()
  call fresh_line
  ; basic/strings.e16.ts:485  if (prompt !== 0) quoted(prompt, true)
  beq s1, zero, .L9
  ; basic/strings.e16.ts:485  quoted(prompt, true)
  mv a0, s1
  li a1, 1
  call quoted
.L9:
  ; basic/strings.e16.ts:486  putc(CH_QUESTION)
  li a0, 63
  call putc
  ; basic/strings.e16.ts:487  const n: i16 = readline(addr(lineBuf), 78)
  la a0, lineBuf
  li a1, 78
  call readline
  mv s2, a0 ; n
  ; basic/strings.e16.ts:488  if (n === -2) {
  li t0, 65534
  bne s2, t0, .L10
  ; basic/strings.e16.ts:489  setTxt(again)
  mv a0, s3
  call setTxt
  ; basic/strings.e16.ts:490  poke16(BRKFLAG, 1)
  li t0, 1
  sw t0, 30(zero)
  ; basic/strings.e16.ts:491  checkBreak()
  call checkBreak
.L10:
  ; basic/strings.e16.ts:493  fresh_line()
  call fresh_line
  ; basic/strings.e16.ts:494  setTxt(list)
  mv a0, s0
  call setTxt
  ; basic/strings.e16.ts:495  if (n >= 0 && takeItems(addr(lineBuf))) return
  blt s2, zero, .L5
  la a0, lineBuf
  call takeItems
  beqz a0, .L5
  ; basic/strings.e16.ts:495  return
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; basic/strings.e16.ts:500 takeItems(from) at -O1
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
  ; basic/strings.e16.ts:501  let p = from
  mv s1, s3 ; p
  ; basic/strings.e16.ts:502  for (;;) {
.L1:
  ; basic/strings.e16.ts:503  const at = varAt(true)
  li a0, 1
  call varAt
  sw a0, 0(fp) ; at
  ; basic/strings.e16.ts:504  const room = varRoom
  lw t0, 0x011a(zero)
  sw t0, 2(fp) ; room
  ; basic/strings.e16.ts:505  const taken = takeItem(at, room, p, false)
  lw a0, 0(fp)
  lw a1, 2(fp)
  mv a2, s1
  li a3, 0
  call takeItem
  mv s2, a0 ; taken
  ; basic/strings.e16.ts:506  if (taken === 0xffff) return false
  li t0, 65535
  bne s2, t0, .L5
  ; basic/strings.e16.ts:506  return false
  li a0, 0
  j .return
.L5:
  ; basic/strings.e16.ts:507  p += taken
  add s1, s1, s2
  ; basic/strings.e16.ts:508  if (next() !== CH_COMMA) return true
  call next
  li t0, 44
  beq a0, t0, .L6
  ; basic/strings.e16.ts:508  return true
  li a0, 1
  j .return
.L6:
  ; basic/strings.e16.ts:509  step()
  call step
  ; basic/strings.e16.ts:510  if (peek(p) !== CH_COMMA) return false
  lbu t0, 0(s1)
  li t1, 44
  beq t0, t1, .L7
  ; basic/strings.e16.ts:510  return false
  li a0, 0
  j .return
.L7:
  ; basic/strings.e16.ts:511  p++
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

; basic/strings.e16.ts:520 takeItem(at, room, p, data) at -O1
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
  ; basic/strings.e16.ts:521  let q = p
  mv s1, s2 ; q
  ; basic/strings.e16.ts:522  while (peek(q) === CH_SPACE) q++
  j .L3
.L1:
  ; basic/strings.e16.ts:522  q++
  addi s1, s1, 1
.L3:
  lbu t0, 0(s1)
  li t1, 32
  beq t0, t1, .L1
  ; basic/strings.e16.ts:523  if (nameIsString) return takeString(at, room, q, data) - p
  lw t0, 0x061a(zero)
  beqz t0, .L5
  ; basic/strings.e16.ts:523  return takeString(at, room, q, data) - p
  mv a0, s3
  lw a1, 4(fp)
  mv a2, s1
  lw a3, 6(fp)
  call takeString
  sub a0, a0, s2
  j .return
.L5:
  ; basic/strings.e16.ts:524  const e = push()
  call push
  sw a0, 0(fp) ; e
  ; basic/strings.e16.ts:525  const n = readNumber(e, q, 255)
  lw a0, 0(fp)
  mv a1, s1
  li a2, 255
  call readNumber
  sw a0, 2(fp) ; n
  ; basic/strings.e16.ts:526  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:527  if (n === 0) return 0xffff
  lw t0, 2(fp) ; n
  bne t0, zero, .L6
  ; basic/strings.e16.ts:527  return 0xffff
  li a0, 65535
  j .return
.L6:
  ; basic/strings.e16.ts:528  copy8(e, at)
  lw a0, 0(fp)
  mv a1, s3
  call copy8
  ; basic/strings.e16.ts:529  q += n
  lw t0, 2(fp) ; n
  add s1, s1, t0
  ; basic/strings.e16.ts:530  while (peek(q) === CH_SPACE) q++
  j .L9
.L7:
  ; basic/strings.e16.ts:530  q++
  addi s1, s1, 1
.L9:
  lbu t0, 0(s1)
  li t1, 32
  beq t0, t1, .L7
  ; basic/strings.e16.ts:531  return q - p
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

; basic/strings.e16.ts:535 takeString(at, room, q, data) at -O1
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
  ; basic/strings.e16.ts:536  let start = q
  sw s3, 0(fp) ; start
  ; basic/strings.e16.ts:537  let end = q
  mv s1, s3 ; end
  ; basic/strings.e16.ts:538  let after = q
  mv s2, s3 ; after
  ; basic/strings.e16.ts:539  if (peek(q) === CH_QUOTE) {
  lbu t0, 0(s3)
  li t1, 34
  bne t0, t1, .L16
  ; basic/strings.e16.ts:540  start = q + 1
  addi t0, s3, 1
  sw t0, 0(fp) ; start
  ; basic/strings.e16.ts:541  end = start
  lw s1, 0(fp) ; start
  ; basic/strings.e16.ts:542  while (peek(end) !== CH_QUOTE && peek(end) !== 0) end++
  j .L4
.L2:
  ; basic/strings.e16.ts:542  end++
  addi s1, s1, 1
.L4:
  lbu t0, 0(s1)
  li t1, 34
  beq t0, t1, .L6
  lbu t0, 0(s1)
  bne t0, zero, .L2
.L6:
  ; basic/strings.e16.ts:543  after = peek(end) === CH_QUOTE ? end + 1 : end
  lbu t0, 0(s1)
  li t1, 34
  bne t0, t1, .L7
  addi t0, s1, 1
  j .L8
.L7:
  mv t0, s1
.L8:
  mv s2, t0 ; after
  ; basic/strings.e16.ts:545  while (peek(after) === CH_SPACE) after++
  j .L11
.L9:
  ; basic/strings.e16.ts:545  after++
  addi s2, s2, 1
.L11:
  lbu t0, 0(s2)
  li t1, 32
  beq t0, t1, .L9
  j .L13
  ; basic/strings.e16.ts:547  while (!itemEnds(peek(end), data)) end++
.L14:
  ; basic/strings.e16.ts:547  end++
  addi s1, s1, 1
.L16:
  lbu a0, 0(s1)
  lw a1, 6(fp)
  call itemEnds
  beqz a0, .L14
  ; basic/strings.e16.ts:548  after = end
  mv s2, s1 ; after
  ; basic/strings.e16.ts:549  while (end > start && peek(end - 1) === CH_SPACE) end--
  j .L20
.L18:
  ; basic/strings.e16.ts:549  end--
  addi s1, s1, -1
.L20:
  lw t0, 0(fp) ; start
  bgeu t0, s1, .L22
  lbu t0, -1(s1)
  li t1, 32
  beq t0, t1, .L18
.L22:
.L13:
  ; basic/strings.e16.ts:551  pushString(start, end - start)
  lw t0, 0(fp) ; start
  sub t0, s1, t0
  lw a0, 0(fp)
  mv a1, t0
  call pushString
  ; basic/strings.e16.ts:552  storeString(at, room)
  lw a0, 2(fp)
  lw a1, 4(fp)
  call storeString
  ; basic/strings.e16.ts:553  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:554  return after
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

; basic/strings.e16.ts:558 itemEnds(c, data) at -O1
;   c in a0
;   data in a1
itemEnds:
  ; basic/strings.e16.ts:559  return c === CH_COMMA || c === 0 || c === 0x0d || (data && c === CH_COLON)
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

; basic/strings.e16.ts:565 readStatement() at -O1
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
  ; basic/strings.e16.ts:566  for (;;) {
.L1:
  ; basic/strings.e16.ts:567  const at = varAt(true)
  li a0, 1
  call varAt
  sw a0, 0(fp) ; at
  ; basic/strings.e16.ts:568  const room = varRoom
  lw t0, 0x011a(zero)
  sw t0, 2(fp) ; room
  ; basic/strings.e16.ts:569  const item = nextItem()
  call nextItem
  mv s2, a0 ; item
  ; basic/strings.e16.ts:570  const taken = takeItem(at, room, item, true)
  lw a0, 0(fp)
  lw a1, 2(fp)
  mv a2, s2
  li a3, 1
  call takeItem
  mv s3, a0 ; taken
  ; basic/strings.e16.ts:571  if (taken === 0xffff) fail(E_TYPE)
  li t0, 65535
  bne s3, t0, .L5
  ; basic/strings.e16.ts:571  fail(E_TYPE)
  li a0, 11
  call fail
.L5:
  ; basic/strings.e16.ts:573  const after = item + taken
  add s1, s2, s3
  ; basic/strings.e16.ts:574  setData(dataLine, peek(after) === CH_COMMA ? after + 1 : after)
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
  ; basic/strings.e16.ts:575  if (next() !== CH_COMMA) return
  call next
  li t0, 44
  beq a0, t0, .L8
  ; basic/strings.e16.ts:575  return
  j .return
.L8:
  ; basic/strings.e16.ts:576  step()
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

; basic/strings.e16.ts:581 nextItem() at -O1
;   at in s1
;   line in s2
;   from in s3
nextItem:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/strings.e16.ts:582  let at = dataAt
  lw s1, 0x0120(zero)
  ; basic/strings.e16.ts:583  if (at !== 0 && peek(at) !== 0 && peek(at) !== CH_COLON) return at
  beq s1, zero, .L1
  lbu t0, 0(s1)
  beq t0, zero, .L1
  lbu t0, 0(s1)
  li t1, 58
  beq t0, t1, .L1
  ; basic/strings.e16.ts:583  return at
  mv a0, s1
  j .return
.L1:
  ; basic/strings.e16.ts:584  let line = dataLine === 0 ? PROG : dataLine
  lw t0, 0x011e(zero)
  bne t0, zero, .L2
  li t0, 2048
  j .L3
.L2:
  lw t0, 0x011e(zero)
.L3:
  mv s2, t0 ; line
  ; basic/strings.e16.ts:586  let from = at === 0 ? line + 4 : at
  bne s1, zero, .L4
  addi t0, s2, 4
  j .L5
.L4:
  mv t0, s1
.L5:
  mv s3, t0 ; from
  ; basic/strings.e16.ts:587  for (;;) {
.L6:
  ; basic/strings.e16.ts:588  if (peek16(line) === 0) fail(E_DATA)
  lw t0, 0(s2)
  bne t0, zero, .L10
  ; basic/strings.e16.ts:588  fail(E_DATA)
  li a0, 14
  call fail
.L10:
  ; basic/strings.e16.ts:589  at = findData(from)
  mv a0, s3
  call findData
  mv s1, a0 ; at
  ; basic/strings.e16.ts:590  if (at !== 0) {
  beq s1, zero, .L11
  ; basic/strings.e16.ts:591  setData(line, at)
  mv a0, s2
  mv a1, s1
  call setData
  ; basic/strings.e16.ts:592  return at
  mv a0, s1
  j .return
.L11:
  ; basic/strings.e16.ts:594  line += peek16(line + 2)
  lw t0, 2(s2)
  add s2, s2, t0
  ; basic/strings.e16.ts:595  from = line + 4
  addi s3, s2, 4
  j .L6
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/strings.e16.ts:600 findData(from) at -O1
;   from in a0
;   p in a1
;   inside in a2
;   c in a3
findData:
  ; basic/strings.e16.ts:601  let p = from
  mv a1, a0 ; p
  ; basic/strings.e16.ts:602  let inside = false
  li a2, 0 ; inside
  ; basic/strings.e16.ts:603  while (peek(p) !== 0) {
  j .L3
.L1:
  ; basic/strings.e16.ts:604  const c = peek(p)
  lbu a3, 0(a1)
  ; basic/strings.e16.ts:605  p++
  addi a1, a1, 1
  ; basic/strings.e16.ts:606  if (c === CH_QUOTE) inside = !inside
  li t0, 34
  bne a3, t0, .L5
  ; basic/strings.e16.ts:606  inside = !inside
  seqz a2, a2
.L5:
  ; basic/strings.e16.ts:607  if (inside) continue
  beqz a2, .L6
  ; basic/strings.e16.ts:607  continue
  j .L2
.L6:
  ; basic/strings.e16.ts:608  if (c === T_REM) return 0
  li t0, 147
  bne a3, t0, .L7
  ; basic/strings.e16.ts:608  return 0
  li a0, 0
  ret
.L7:
  ; basic/strings.e16.ts:609  if (c === T_DATA) return p
  li t0, 158
  bne a3, t0, .L8
  ; basic/strings.e16.ts:609  return p
  mv a0, a1
  ret
.L8:
.L2:
.L3:
  lbu t0, 0(a1)
  bne t0, zero, .L1
  ; basic/strings.e16.ts:611  return 0
  li a0, 0
.return:
  ret

; basic/strings.e16.ts:615 restoreStatement() at -O1
;   line in s1
restoreStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/strings.e16.ts:616  if (!isDigit(next())) {
  call next
  call isDigit
  bnez a0, .L1
  ; basic/strings.e16.ts:617  setData(0, 0)
  li a0, 0
  li a1, 0
  call setData
  ; basic/strings.e16.ts:618  return
  j .return
.L1:
  ; basic/strings.e16.ts:620  const line = findLine(readUnsigned(), true)
  call readUnsigned
  li a1, 1
  call findLine
  mv s1, a0 ; line
  ; basic/strings.e16.ts:621  if (line === 0) fail(E_LINE)
  bne s1, zero, .L2
  ; basic/strings.e16.ts:621  fail(E_LINE)
  li a0, 5
  call fail
.L2:
  ; basic/strings.e16.ts:622  setData(line, 0)
  mv a0, s1
  li a1, 0
  call setData
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/strings.e16.ts:628 onStatement() at -O1
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
  ; basic/strings.e16.ts:629  expr()
  call expr
  ; basic/strings.e16.ts:630  needNumber()
  call needNumber
  ; basic/strings.e16.ts:631  const n = toInt(top())
  call top
  call toInt
  sw a0, 2(fp) ; n
  ; basic/strings.e16.ts:632  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:633  const how = next()
  call next
  mv s2, a0 ; how
  ; basic/strings.e16.ts:634  if (how !== T_GOTO && how !== T_GOSUB) fail(E_SYNTAX)
  li t0, 142
  beq s2, t0, .L1
  li t0, 143
  beq s2, t0, .L1
  ; basic/strings.e16.ts:634  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/strings.e16.ts:635  step()
  call step
  ; basic/strings.e16.ts:636  let chosen: u16 = 0
  li s3, 0 ; chosen
  ; basic/strings.e16.ts:637  let k: i16 = 1
  li t0, 1
  sw t0, 0(fp) ; k
  ; basic/strings.e16.ts:638  for (;;) {
.L2:
  ; basic/strings.e16.ts:639  const line = readUnsigned()
  call readUnsigned
  mv s1, a0 ; line/at
  ; basic/strings.e16.ts:640  if (k === n) chosen = line
  lw t0, 2(fp) ; n
  lw t1, 0(fp) ; k
  bne t1, t0, .L6
  ; basic/strings.e16.ts:640  chosen = line
  mv s3, s1 ; chosen
.L6:
  ; basic/strings.e16.ts:641  if (next() !== CH_COMMA) break
  call next
  li t0, 44
  beq a0, t0, .L7
  ; basic/strings.e16.ts:641  break
  j .L5
.L7:
  ; basic/strings.e16.ts:642  step()
  call step
  ; basic/strings.e16.ts:643  k++
  lw t0, 0(fp) ; k
  addi t0, t0, 1
  sw t0, 0(fp) ; k
  j .L2
.L5:
  ; basic/strings.e16.ts:645  if (chosen === 0) return
  bne s3, zero, .L8
  ; basic/strings.e16.ts:645  return
  j .return
.L8:
  ; basic/strings.e16.ts:646  const at = findLine(chosen, true)
  mv a0, s3
  li a1, 1
  call findLine
  mv s1, a0 ; line/at
  ; basic/strings.e16.ts:647  if (at === 0) fail(E_LINE)
  bne s1, zero, .L9
  ; basic/strings.e16.ts:647  fail(E_LINE)
  li a0, 5
  call fail
.L9:
  ; basic/strings.e16.ts:649  if (how === T_GOSUB) gosubTo(at)
  li t0, 143
  bne s2, t0, .L10
  ; basic/strings.e16.ts:649  gosubTo(at)
  mv a0, s1
  call gosubTo
  j .L11
.L10:
  ; basic/strings.e16.ts:650  jump(at, at + 4)
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

; basic/strings.e16.ts:657 waitTicks(ticks) at -O1
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
  ; basic/strings.e16.ts:658  const start = peek16(IO_TCOUNT)
  li t0, 65328
  lw s2, 0(t0)
  ; basic/strings.e16.ts:659  const lines = csrr(CSR_MIE)
  csrr s3, 772
  ; basic/strings.e16.ts:660  while (u16(peek16(IO_TCOUNT) - start) < ticks) {
  j .L3
.L1:
  ; basic/strings.e16.ts:661  poke16(IO_TCMP, start + ticks)
  add t0, s2, s1
  li t1, 65330
  sw t0, 0(t1)
  ; basic/strings.e16.ts:662  poke16(IO_TCTRL, 1)
  li t0, 1
  li t1, 65332
  sw t0, 0(t1)
  ; basic/strings.e16.ts:665  csrw(CSR_MIE, MIE_TIMER)
  li t0, 1
  csrw 772, t0
  ; basic/strings.e16.ts:668  if (u16(peek16(IO_TCOUNT) - start) < ticks) wfi()
  li t0, 65328
  lw t0, 0(t0)
  sub t0, t0, s2
  bgeu t0, s1, .L5
  ; basic/strings.e16.ts:668  wfi()
  wfi
.L5:
  ; basic/strings.e16.ts:669  poke16(IO_TCTRL, 0)
  li t0, 65332
  sw zero, 0(t0)
  ; basic/strings.e16.ts:670  csrw(CSR_MIE, lines)
  csrw 772, s3
  ; basic/strings.e16.ts:671  checkBreak()
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

; basic/strings.e16.ts:676 waitStatement() at -O1
;   n in s1
waitStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/strings.e16.ts:677  let n = wholeArgument(0x7fff)
  li a0, 32767
  call wholeArgument
  mv s1, a0 ; n
  ; basic/strings.e16.ts:678  while (n > 0) {
  j .L3
.L1:
  ; basic/strings.e16.ts:679  waitTicks(16)
  li a0, 16
  call waitTicks
  ; basic/strings.e16.ts:680  n--
  addi s1, s1, -1
.L3:
  bltu zero, s1, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/strings.e16.ts:685 beepStatement() at -O1
;   f in s2
;   ms in s1
beepStatement:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; basic/strings.e16.ts:686  const f = wholeArgument(20000)
  li a0, 20000
  call wholeArgument
  mv s2, a0 ; f
  ; basic/strings.e16.ts:687  let ms: u16 = 100
  li s1, 100 ; ms
  ; basic/strings.e16.ts:688  if (next() === CH_COMMA) {
  call next
  li t0, 44
  bne a0, t0, .L1
  ; basic/strings.e16.ts:689  step()
  call step
  ; basic/strings.e16.ts:690  ms = wholeArgument(10000)
  li a0, 10000
  call wholeArgument
  mv s1, a0 ; ms
.L1:
  ; basic/strings.e16.ts:692  poke16(IO_FREQ, f)
  li t0, 65344
  sw s2, 0(t0)
  ; basic/strings.e16.ts:693  poke16(IO_DUR, ms)
  li t0, 65346
  sw s1, 0(t0)
  ; basic/strings.e16.ts:695  waitTicks(ms + div(ms * 3 + 124, 125))
  slli t1, s1, 1
  add t0, t1, s1
  li t1, 125
  addi t0, t0, 124
  divu t0, t0, t1
  add a0, s1, t0
  call waitTicks
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/strings.e16.ts:699 wholeArgument(max) at -O1
;   max in s2
;   v in s1
wholeArgument:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; max
  ; basic/strings.e16.ts:700  expr()
  call expr
  ; basic/strings.e16.ts:701  needNumber()
  call needNumber
  ; basic/strings.e16.ts:702  const v = toInt(top())
  call top
  call toInt
  mv s1, a0 ; v
  ; basic/strings.e16.ts:703  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/strings.e16.ts:704  if (v < 0 || u16(v) > max) fail(E_ARGUMENT)
  blt s1, zero, .L2
  bgeu s2, s1, .L1
.L2:
  ; basic/strings.e16.ts:704  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L1:
  ; basic/strings.e16.ts:705  return u16(v)
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/strings.e16.ts:709 dataStatement(c) at -O1
;   c in s1
dataStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/strings.e16.ts:710  if (c === T_DIM) dimStatement()
  li t0, 157
  bne s1, t0, .L1
  ; basic/strings.e16.ts:710  dimStatement()
  call dimStatement
  j .L2
.L1:
  ; basic/strings.e16.ts:711  if (c === T_READ) readStatement()
  li t0, 159
  bne s1, t0, .L3
  ; basic/strings.e16.ts:711  readStatement()
  call readStatement
  j .L4
.L3:
  ; basic/strings.e16.ts:712  if (c === T_RESTORE) restoreStatement()
  li t0, 160
  bne s1, t0, .L5
  ; basic/strings.e16.ts:712  restoreStatement()
  call restoreStatement
  j .L6
.L5:
  ; basic/strings.e16.ts:713  if (c === T_ON) onStatement()
  li t0, 161
  bne s1, t0, .L7
  ; basic/strings.e16.ts:713  onStatement()
  call onStatement
  j .L8
.L7:
  ; basic/strings.e16.ts:714  if (c === T_CLEAR) clearVariables()
  li t0, 162
  bne s1, t0, .L9
  ; basic/strings.e16.ts:714  clearVariables()
  call clearVariables
  j .L10
.L9:
  ; basic/strings.e16.ts:715  if (c === T_WAIT) waitStatement()
  li t0, 155
  bne s1, t0, .L11
  ; basic/strings.e16.ts:715  waitStatement()
  call waitStatement
  j .L12
.L11:
  ; basic/strings.e16.ts:716  if (c === T_BEEP) beepStatement()
  li t0, 156
  bne s1, t0, .L13
  ; basic/strings.e16.ts:716  beepStatement()
  call beepStatement
  j .L14
.L13:
  ; basic/strings.e16.ts:717  fail(E_SYNTAX)
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
; basic/files.e16.ts:127 cardCall(op, offset, at, length) at -O1
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
  ; basic/files.e16.ts:128  const b = addr(cardBlock)
  la s1, cardBlock
  ; basic/files.e16.ts:129  poke16(b + 24, offset)
  sw a1, 24(s1)
  ; basic/files.e16.ts:130  poke16(b + 26, at)
  sw a2, 26(s1)
  ; basic/files.e16.ts:131  poke16(b + 28, length)
  sw a3, 28(s1)
  ; basic/files.e16.ts:132  poke16(CARD_BLOCK, b)
  li t0, 65378
  sw s1, 0(t0)
  ; basic/files.e16.ts:133  poke16(CARD_CMD, op)
  li t0, 65376
  sw a0, 0(t0)
  ; basic/files.e16.ts:134  for (;;) {
.L1:
  ; basic/files.e16.ts:135  const st = peek16(CARD_STATUS)
  li t0, 65380
  lw s2, 0(t0)
  ; basic/files.e16.ts:136  if (st !== ST_BUSY) return st
  li t0, 1
  beq s2, t0, .L5
  ; basic/files.e16.ts:136  return st
  mv a0, s2
  j .return
.L5:
  ; basic/files.e16.ts:137  wfi()
  wfi
  j .L1
.return:
  lw s1, 0(sp)
  lw s2, 2(sp)
  addi sp, sp, 4
  ret

; basic/files.e16.ts:142 cardMust(op, offset, at, length) at -O1
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
  ; basic/files.e16.ts:143  const st = cardCall(op, offset, at, length)
  mv a0, s2
  mv a1, s3
  lw a2, 0(fp)
  lw a3, 2(fp)
  call cardCall
  mv s1, a0 ; st
  ; basic/files.e16.ts:144  if (st === 0) return
  bne s1, zero, .L1
  ; basic/files.e16.ts:144  return
  j .return
.L1:
  ; basic/files.e16.ts:145  if (st === ST_NOFILE) fail(E_NOFILE)
  li t0, 2
  bne s1, t0, .L2
  ; basic/files.e16.ts:145  fail(E_NOFILE)
  li a0, 12
  call fail
.L2:
  ; basic/files.e16.ts:146  if (st === ST_BADNAME) fail(E_FILE)
  li t0, 3
  bne s1, t0, .L3
  ; basic/files.e16.ts:146  fail(E_FILE)
  li a0, 17
  call fail
.L3:
  ; basic/files.e16.ts:147  fail(E_CARD)
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

; basic/files.e16.ts:151 nameArg(ext) at -O1
;   ext in 2(fp)
;   at in 4(fp)
;   n in 6(fp)
;   b in 0(fp)
;   k/dot in s2
;   k/e in s1
;   k in s3
nameArg:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s2, 10(sp)
  sw s1, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 2(fp) ; ext
  ; basic/files.e16.ts:152  expr()
  call expr
  ; basic/files.e16.ts:153  needString()
  call needString
  ; basic/files.e16.ts:154  const at = stringAt(top())
  call top
  call stringAt
  sw a0, 4(fp) ; at
  ; basic/files.e16.ts:155  const n = stringLength(top())
  call top
  call stringLength
  sw a0, 6(fp) ; n
  ; basic/files.e16.ts:156  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/files.e16.ts:157  const b = addr(cardBlock)
  la t0, cardBlock
  sw t0, 0(fp) ; b
  ; basic/files.e16.ts:158  for (let k: u16 = 0; k < 24; k++) poke(b + k, 0)
  li s2, 0 ; k/dot
  j .L3
.L1:
  ; basic/files.e16.ts:158  poke(b + k, 0)
  lw t0, 0(fp) ; b
  add t0, t0, s2
  sb zero, 0(t0)
  addi s2, s2, 1
.L3:
  li t0, 24
  bltu s2, t0, .L1
  ; basic/files.e16.ts:159  let dot = false
  li s2, 0 ; k/dot
  ; basic/files.e16.ts:160  for (let k: u16 = 0; k < n; k++) {
  li s1, 0 ; k/e
  j .L7
.L5:
  ; basic/files.e16.ts:161  if (k >= 12) fail(E_FILE)
  li t0, 12
  bltu s1, t0, .L9
  ; basic/files.e16.ts:161  fail(E_FILE)
  li a0, 17
  call fail
.L9:
  ; basic/files.e16.ts:162  poke(b + k, peek(at + k))
  lw t0, 0(fp) ; b
  add t0, t0, s1
  lw t1, 4(fp) ; at
  add t1, t1, s1
  lbu t1, 0(t1)
  sb t1, 0(t0)
  ; basic/files.e16.ts:163  if (peek(at + k) === CH_DOT) dot = true
  lw t0, 4(fp) ; at
  add t0, t0, s1
  lbu t0, 0(t0)
  li t1, 46
  bne t0, t1, .L10
  ; basic/files.e16.ts:163  dot = true
  li s2, 1 ; k/dot
.L10:
  addi s1, s1, 1
.L7:
  lw t0, 6(fp) ; n
  bltu s1, t0, .L5
  ; basic/files.e16.ts:165  if (dot || ext === 0) return
  bnez s2, .L12
  lw t0, 2(fp) ; ext
  bne t0, zero, .L11
.L12:
  ; basic/files.e16.ts:165  return
  j .return
.L11:
  ; basic/files.e16.ts:166  let e = ext
  lw s1, 2(fp) ; ext
  ; basic/files.e16.ts:167  let k = n
  lw s3, 6(fp) ; n
  ; basic/files.e16.ts:168  while (peek(e) !== 0) {
  j .L15
.L13:
  ; basic/files.e16.ts:169  if (k >= 12) fail(E_FILE)
  li t0, 12
  bltu s3, t0, .L17
  ; basic/files.e16.ts:169  fail(E_FILE)
  li a0, 17
  call fail
.L17:
  ; basic/files.e16.ts:170  poke(b + k, peek(e))
  lw t0, 0(fp) ; b
  add t0, t0, s3
  lbu t1, 0(s1)
  sb t1, 0(t0)
  ; basic/files.e16.ts:171  e++
  addi s1, s1, 1
  ; basic/files.e16.ts:172  k++
  addi s3, s3, 1
.L15:
  lbu t0, 0(s1)
  bne t0, zero, .L13
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s2, 10(sp)
  lw s1, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; basic/files.e16.ts:177 isMachineCode() at -O1
;   b in a1
;   k in a0
isMachineCode:
  ; basic/files.e16.ts:178  const b = addr(cardBlock)
  la a1, cardBlock
  ; basic/files.e16.ts:179  let k: u16 = 0
  li a0, 0 ; k
  ; basic/files.e16.ts:180  while (k < 12 && peek(b + k) !== 0) k++
  j .L3
.L1:
  ; basic/files.e16.ts:180  k++
  addi a0, a0, 1
.L3:
  li t0, 12
  bgeu a0, t0, .L5
  add t0, a1, a0
  lbu t0, 0(t0)
  bne t0, zero, .L1
.L5:
  ; basic/files.e16.ts:181  return (
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

; basic/files.e16.ts:191 address() at -O1
;   v in s1
address:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/files.e16.ts:192  expr()
  call expr
  ; basic/files.e16.ts:193  needNumber()
  call needNumber
  ; basic/files.e16.ts:194  const v = toWord(top())
  call top
  call toWord
  mv s1, a0 ; v
  ; basic/files.e16.ts:195  setNsp(nsp - 8)
  lw t0, 0x0116(zero)
  addi a0, t0, -8
  call setNsp
  ; basic/files.e16.ts:196  return v
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/files.e16.ts:205 filesStatement() at -O1
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
  ; basic/files.e16.ts:206  const soft = !statementEnds()
  call statementEnds
  seqz t0, a0
  sw t0, 2(fp) ; soft
  ; basic/files.e16.ts:207  if (soft) nameArg(0)
  lw t0, 2(fp) ; soft
  beqz t0, .L1
  ; basic/files.e16.ts:207  nameArg(0)
  li a0, 0
  call nameArg
  j .L2
.L1:
  ; basic/files.e16.ts:208  poke(addr(cardBlock), 0)
  sb zero, cardBlock(zero)
.L2:
  ; basic/files.e16.ts:209  cardMust(OP_DIR, 0, addr(cardBuf), 256)
  li a0, 1
  li a1, 0
  la a2, cardBuf
  li a3, 256
  call cardMust
  ; basic/files.e16.ts:210  const total = peek16(CARD_RESULT)
  li t0, 65382
  lw s3, 0(t0)
  ; basic/files.e16.ts:211  const shown = total < 16 ? total : 16
  li t0, 16
  bgeu s3, t0, .L3
  mv t0, s3
  j .L4
.L3:
  li t0, 16
.L4:
  sw t0, 4(fp) ; shown
  ; basic/files.e16.ts:212  for (let k: u16 = 0; k < shown; k++) {
  li s2, 0 ; k/kb
  j .L7
.L5:
  ; basic/files.e16.ts:213  checkBreak()
  call checkBreak
  ; basic/files.e16.ts:214  const e = addr(cardBuf) + k * 16
  slli t0, s2, 4
  addi t0, t0, cardBuf
  sw t0, 0(fp) ; e
  ; basic/files.e16.ts:215  let n: u16 = 0
  li s1, 0 ; n
  ; basic/files.e16.ts:216  while (n < 12 && peek(e + n) !== 0) {
  j .L11
.L9:
  ; basic/files.e16.ts:217  putc(peek(e + n))
  lw t0, 0(fp) ; e
  add t0, t0, s1
  lbu a0, 0(t0)
  call putc
  ; basic/files.e16.ts:218  n++
  addi s1, s1, 1
.L11:
  li t0, 12
  bgeu s1, t0, .L16
  lw t0, 0(fp) ; e
  add t0, t0, s1
  lbu t0, 0(t0)
  bne t0, zero, .L9
  ; basic/files.e16.ts:220  while (n < 13) {
  j .L16
.L14:
  ; basic/files.e16.ts:221  putc(CH_SPACE)
  li a0, 32
  call putc
  ; basic/files.e16.ts:222  n++
  addi s1, s1, 1
.L16:
  li t0, 13
  bltu s1, t0, .L14
  ; basic/files.e16.ts:224  printUnsigned(peek16(e + 12))
  lw t0, 0(fp) ; e
  lw a0, 12(t0)
  call printUnsigned
  ; basic/files.e16.ts:225  newline()
  call newline
  addi s2, s2, 1
.L7:
  lw t0, 4(fp) ; shown
  bltu s2, t0, .L5
  ; basic/files.e16.ts:227  if (total > shown) {
  lw t0, 4(fp) ; shown
  bgeu t0, s3, .L18
  ; basic/files.e16.ts:228  puts(str('...'))
  la a0, str_25
  call puts
  ; basic/files.e16.ts:229  newline()
  call newline
.L18:
  ; basic/files.e16.ts:231  if (soft) return
  lw t0, 2(fp) ; soft
  beqz t0, .L19
  ; basic/files.e16.ts:231  return
  j .return
.L19:
  ; basic/files.e16.ts:232  cardCall(OP_FREE, 0, 0, 0)
  li a0, 6
  li a1, 0
  li a2, 0
  li a3, 0
  call cardCall
  ; basic/files.e16.ts:233  const kb = (peek16(CARD_RESULT_HIGH) << 6) | (peek16(CARD_RESULT) >> 10)
  li t0, 65384
  lw t0, 0(t0)
  slli t0, t0, 6
  li t1, 65382
  lw t1, 0(t1)
  srli t1, t1, 10
  or s2, t0, t1
  ; basic/files.e16.ts:234  printUnsigned(kb)
  mv a0, s2
  call printUnsigned
  ; basic/files.e16.ts:235  puts(str(' KB FREE'))
  la a0, str_26
  call puts
  ; basic/files.e16.ts:236  newline()
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

; basic/files.e16.ts:243 saveStatement() at -O1
;   from/n in s1
;   length/at in s2
;   line in s3
;   digits in 2(fp)
;   length in 4(fp)
;   k in 0(fp)
saveStatement:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  ; basic/files.e16.ts:244  nameArg(str('.BAS'))
  la a0, str_27
  call nameArg
  ; basic/files.e16.ts:245  if (next() === CH_COMMA) {
  call next
  li t0, 44
  bne a0, t0, .L1
  ; basic/files.e16.ts:246  step()
  call step
  ; basic/files.e16.ts:247  const from = address()
  call address
  mv s1, a0 ; from/n
  ; basic/files.e16.ts:248  expect(CH_COMMA)
  li a0, 44
  call expect
  ; basic/files.e16.ts:249  const length = address()
  call address
  mv s2, a0 ; length/at
  ; basic/files.e16.ts:250  if (from + length < from || from + length > 0x8000) fail(E_MEMORY)
  add t0, s1, s2
  bltu t0, s1, .L3
  add t0, s1, s2
  li t1, 32768
  bgeu t1, t0, .L2
.L3:
  ; basic/files.e16.ts:250  fail(E_MEMORY)
  li a0, 8
  call fail
.L2:
  ; basic/files.e16.ts:251  cardMust(OP_WRITE, 0, from, length)
  li a0, 3
  li a1, 0
  mv a2, s1
  mv a3, s2
  call cardMust
  ; basic/files.e16.ts:252  return
  j .return
.L1:
  ; basic/files.e16.ts:254  cardMust(OP_WRITE, 0, addr(cardBuf), 0)
  li a0, 3
  li a1, 0
  la a2, cardBuf
  li a3, 0
  call cardMust
  ; basic/files.e16.ts:255  let n: u16 = 0
  li s1, 0 ; from/n
  ; basic/files.e16.ts:256  let at = PROG
  li s2, 2048 ; length/at
  ; basic/files.e16.ts:257  while (peek16(at) !== 0) {
  j .L6
.L4:
  ; basic/files.e16.ts:258  checkBreak()
  call checkBreak
  ; basic/files.e16.ts:259  const line = addr(lineBuf)
  la s3, lineBuf
  ; basic/files.e16.ts:260  const digits = unsignedText(peek16(at), line)
  lw a0, 0(s2)
  mv a1, s3
  call unsignedText
  sw a0, 2(fp) ; digits
  ; basic/files.e16.ts:261  poke(line + digits, CH_SPACE)
  lw t0, 2(fp) ; digits
  add t0, s3, t0
  li t1, 32
  sb t1, 0(t0)
  ; basic/files.e16.ts:262  const length = digits + 1 + expand(at + 4, line + digits + 1, 77 - digits)
  lw t0, 2(fp) ; digits
  lw t1, 2(fp) ; digits
  add t1, s3, t1
  lw t2, 2(fp) ; digits
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
  sw t0, 4(fp) ; length
  ; basic/files.e16.ts:263  poke(line + length, K_ENTER)
  lw t0, 4(fp) ; length
  add t0, s3, t0
  li t1, 13
  sb t1, 0(t0)
  ; basic/files.e16.ts:264  if (n + length + 1 > 256) {
  lw t0, 4(fp) ; length
  add t0, s1, t0
  li t1, 256
  addi t0, t0, 1
  bgeu t1, t0, .L8
  ; basic/files.e16.ts:265  cardMust(OP_WRITE, APPEND, addr(cardBuf), n)
  li a0, 3
  li a1, 65535
  la a2, cardBuf
  mv a3, s1
  call cardMust
  ; basic/files.e16.ts:266  n = 0
  li s1, 0 ; from/n
.L8:
  ; basic/files.e16.ts:268  for (let k: u16 = 0; k <= length; k++) poke(addr(cardBuf) + n + k, peek(line + k))
  sw zero, 0(fp) ; k
  j .L11
.L9:
  ; basic/files.e16.ts:268  poke(addr(cardBuf) + n + k, peek(line + k))
  lw t0, 0(fp) ; k
  addi t1, s1, cardBuf
  add t1, t1, t0
  lw t0, 0(fp) ; k
  add t0, s3, t0
  lbu t0, 0(t0)
  sb t0, 0(t1)
  lw t0, 0(fp) ; k
  addi t0, t0, 1
  sw t0, 0(fp) ; k
.L11:
  lw t0, 4(fp) ; length
  lw t1, 0(fp) ; k
  bgeu t0, t1, .L9
  ; basic/files.e16.ts:269  n += length + 1
  lw t0, 4(fp) ; length
  addi t0, t0, 1
  add s1, s1, t0
  ; basic/files.e16.ts:270  at += peek16(at + 2)
  lw t0, 2(s2)
  add s2, s2, t0
.L6:
  lw t0, 0(s2)
  bne t0, zero, .L4
  ; basic/files.e16.ts:272  if (n > 0) cardMust(OP_WRITE, APPEND, addr(cardBuf), n)
  bgeu zero, s1, .L13
  ; basic/files.e16.ts:272  cardMust(OP_WRITE, APPEND, addr(cardBuf), n)
  li a0, 3
  li a1, 65535
  la a2, cardBuf
  mv a3, s1
  call cardMust
.L13:
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; basic/files.e16.ts:279 loadStatement() at -O1
;   to/offset in s1
;   n in s3
;   got in s0
;   k in s2
loadStatement:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s2, 8(sp)
  ; basic/files.e16.ts:280  nameArg(str('.BAS'))
  la a0, str_27
  call nameArg
  ; basic/files.e16.ts:281  if (isMachineCode() || next() === CH_COMMA) {
  call isMachineCode
  bnez a0, .L2
  call next
  li t0, 44
  bne a0, t0, .L1
.L2:
  ; basic/files.e16.ts:282  let to = CODE_AREA
  li s1, 28672 ; to/offset
  ; basic/files.e16.ts:283  if (next() === CH_COMMA) {
  call next
  li t0, 44
  bne a0, t0, .L3
  ; basic/files.e16.ts:284  step()
  call step
  ; basic/files.e16.ts:285  to = address()
  call address
  mv s1, a0 ; to/offset
.L3:
  ; basic/files.e16.ts:288  if (to < varEnd || to >= CODE_AREA_END) fail(E_MEMORY)
  lw t0, 0x0114(zero)
  bltu s1, t0, .L5
  li t0, 31744
  bltu s1, t0, .L4
.L5:
  ; basic/files.e16.ts:288  fail(E_MEMORY)
  li a0, 8
  call fail
.L4:
  ; basic/files.e16.ts:289  cardMust(OP_READ, 0, to, CODE_AREA_END - to)
  li t0, 31744
  sub t0, t0, s1
  li a0, 2
  li a1, 0
  mv a2, s1
  mv a3, t0
  call cardMust
  ; basic/files.e16.ts:290  return
  j .return
.L1:
  ; basic/files.e16.ts:293  cardMust(OP_READ, 0, addr(cardBuf), 256)
  li a0, 2
  li a1, 0
  la a2, cardBuf
  li a3, 256
  call cardMust
  ; basic/files.e16.ts:294  keepProgramTo(PROG)
  li a0, 2048
  call keepProgramTo
  ; basic/files.e16.ts:295  let offset: u16 = 0
  li s1, 0 ; to/offset
  ; basic/files.e16.ts:296  let n: u16 = 0
  li s3, 0 ; n
  ; basic/files.e16.ts:297  for (;;) {
.L6:
  ; basic/files.e16.ts:298  if (offset > 0) cardMust(OP_READ, offset, addr(cardBuf), 256)
  bgeu zero, s1, .L10
  ; basic/files.e16.ts:298  cardMust(OP_READ, offset, addr(cardBuf), 256)
  li a0, 2
  mv a1, s1
  la a2, cardBuf
  li a3, 256
  call cardMust
.L10:
  ; basic/files.e16.ts:299  const got = peek16(CARD_RESULT)
  li t0, 65382
  lw s0, 0(t0)
  ; basic/files.e16.ts:300  if (got === 0) break
  bne s0, zero, .L11
  ; basic/files.e16.ts:300  break
  j .L9
.L11:
  ; basic/files.e16.ts:301  for (let k: u16 = 0; k < got; k++) n = loadByte(n, peek(addr(cardBuf) + k))
  li s2, 0 ; k
  j .L14
.L12:
  ; basic/files.e16.ts:301  n = loadByte(n, peek(addr(cardBuf) + k))
  lbu t0, cardBuf(s2)
  mv a0, s3
  mv a1, t0
  call loadByte
  mv s3, a0 ; n
  addi s2, s2, 1
.L14:
  bltu s2, s0, .L12
  ; basic/files.e16.ts:302  offset += got
  add s1, s1, s0
  j .L6
.L9:
  ; basic/files.e16.ts:304  loadByte(n, K_ENTER)
  mv a0, s3
  li a1, 13
  call loadByte
  ; basic/files.e16.ts:306  endProgram()
  call endProgram
  ; basic/files.e16.ts:307  setTxt(addr(nothing))
  la a0, nothing
  call setTxt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; basic/files.e16.ts:311 loadByte(n, c) at -O1
;   n in s1
;   c in s2
;   line in s3
loadByte:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; n
  mv s2, a1 ; c
  ; basic/files.e16.ts:312  const line = addr(lineBuf)
  la s3, lineBuf
  ; basic/files.e16.ts:313  if (c === K_ENTER || c === LF) {
  li t0, 13
  beq s2, t0, .L2
  li t0, 10
  bne s2, t0, .L1
.L2:
  ; basic/files.e16.ts:314  if (n === 0) return 0
  bne s1, zero, .L3
  ; basic/files.e16.ts:314  return 0
  li a0, 0
  j .return
.L3:
  ; basic/files.e16.ts:315  poke(line + n, 0)
  add t0, s3, s1
  sb zero, 0(t0)
  ; basic/files.e16.ts:316  if (!storeTypedLine()) fail(E_FILE)
  call storeTypedLine
  bnez a0, .L4
  ; basic/files.e16.ts:316  fail(E_FILE)
  li a0, 17
  call fail
.L4:
  ; basic/files.e16.ts:317  return 0
  li a0, 0
  j .return
.L1:
  ; basic/files.e16.ts:319  if (n >= 78) fail(E_FILE)
  li t0, 78
  bltu s1, t0, .L5
  ; basic/files.e16.ts:319  fail(E_FILE)
  li a0, 17
  call fail
.L5:
  ; basic/files.e16.ts:320  poke(line + n, c)
  add t0, s3, s1
  sb s2, 0(t0)
  ; basic/files.e16.ts:321  return n + 1
  addi a0, s1, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/files.e16.ts:327 fileNumber() at -O1
;   n in s1
fileNumber:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/files.e16.ts:328  if (next() === CH_HASH) step()
  call next
  li t0, 35
  bne a0, t0, .L1
  ; basic/files.e16.ts:328  step()
  call step
.L1:
  ; basic/files.e16.ts:329  const n = readUnsigned()
  call readUnsigned
  mv s1, a0 ; n
  ; basic/files.e16.ts:330  if (n < 1 || n > 2) fail(E_FILE)
  li t0, 1
  bltu s1, t0, .L3
  li t0, 2
  bgeu t0, s1, .L2
.L3:
  ; basic/files.e16.ts:330  fail(E_FILE)
  li a0, 17
  call fail
.L2:
  ; basic/files.e16.ts:331  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/files.e16.ts:335 fileToBlock(n) at -O1
;   n in a0
;   b in a2
;   k in a1
fileToBlock:
  ; basic/files.e16.ts:336  const b = addr(cardBlock)
  la a2, cardBlock
  ; basic/files.e16.ts:337  for (let k: u16 = 0; k < 12; k++) poke(b + k, peek(addr(fileName) + (n - 1) * 12 + k))
  li a1, 0 ; k
  j .L3
.L1:
  ; basic/files.e16.ts:337  poke(b + k, peek(addr(fileName) + (n - 1) * 12 + k))
  add t0, a2, a1
  addi t1, a0, -1
  slli t2, t1, 3
  slli t1, t1, 2
  add t1, t1, t2
  addi t1, t1, fileName
  add t1, t1, a1
  lbu t1, 0(t1)
  sb t1, 0(t0)
  addi a1, a1, 1
.L3:
  li t0, 12
  bltu a1, t0, .L1
.return:
  ret

; basic/files.e16.ts:341 openStatement() at -O1
;   how in s1
;   n in s2
;   k in s3
openStatement:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/files.e16.ts:342  nameArg(str('.DAT'))
  la a0, str_28
  call nameArg
  ; basic/files.e16.ts:343  if (next() !== T_FOR) fail(E_SYNTAX)
  call next
  li t0, 138
  beq a0, t0, .L1
  ; basic/files.e16.ts:343  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/files.e16.ts:344  step()
  call step
  ; basic/files.e16.ts:345  const how = next()
  call next
  mv s1, a0 ; how
  ; basic/files.e16.ts:346  if (how !== T_INPUT && how !== T_OUTPUT && how !== T_APPEND) fail(E_SYNTAX)
  li t0, 133
  beq s1, t0, .L2
  li t0, 217
  beq s1, t0, .L2
  li t0, 218
  beq s1, t0, .L2
  ; basic/files.e16.ts:346  fail(E_SYNTAX)
  li a0, 1
  call fail
.L2:
  ; basic/files.e16.ts:347  step()
  call step
  ; basic/files.e16.ts:348  if (next() !== T_AS) fail(E_SYNTAX)
  call next
  li t0, 216
  beq a0, t0, .L3
  ; basic/files.e16.ts:348  fail(E_SYNTAX)
  li a0, 1
  call fail
.L3:
  ; basic/files.e16.ts:349  step()
  call step
  ; basic/files.e16.ts:350  const n = fileNumber()
  call fileNumber
  mv s2, a0 ; n
  ; basic/files.e16.ts:351  if (peek(addr(fileMode) + n - 1) !== 0) fail(E_FILE)
  lbu t0, fileMode-1(s2)
  beq t0, zero, .L4
  ; basic/files.e16.ts:351  fail(E_FILE)
  li a0, 17
  call fail
.L4:
  ; basic/files.e16.ts:352  if (how === T_INPUT) cardMust(OP_READ, 0, addr(cardBuf), 0)
  li t0, 133
  bne s1, t0, .L5
  ; basic/files.e16.ts:352  cardMust(OP_READ, 0, addr(cardBuf), 0)
  li a0, 2
  li a1, 0
  la a2, cardBuf
  li a3, 0
  call cardMust
  j .L6
.L5:
  ; basic/files.e16.ts:353  cardMust(OP_WRITE, how === T_OUTPUT ? 0 : APPEND, addr(cardBuf), 0)
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
  ; basic/files.e16.ts:354  for (let k: u16 = 0; k < 12; k++)
  li s3, 0 ; k
  j .L11
.L9:
  ; basic/files.e16.ts:355  poke(addr(fileName) + (n - 1) * 12 + k, peek(addr(cardBlock) + k))
  addi t0, s2, -1
  slli t1, t0, 3
  slli t0, t0, 2
  add t0, t0, t1
  addi t0, t0, fileName
  add t0, t0, s3
  lbu t1, cardBlock(s3)
  sb t1, 0(t0)
  addi s3, s3, 1
.L11:
  li t0, 12
  bltu s3, t0, .L9
  ; basic/files.e16.ts:356  fileOffset[n - 1] = 0
  addi t0, s2, -1
  slli t0, t0, 1
  sw zero, fileOffset(t0)
  ; basic/files.e16.ts:357  fileLen[n - 1] = 0
  addi t0, s2, -1
  slli t0, t0, 1
  sw zero, fileLen(t0)
  ; basic/files.e16.ts:358  filePos[n - 1] = 0
  addi t0, s2, -1
  slli t0, t0, 1
  sw zero, filePos(t0)
  ; basic/files.e16.ts:359  poke(addr(fileMode) + n - 1, how === T_INPUT ? 1 : 2)
  addi t0, s2, fileMode-1
  mv t1, s1
  li t2, 133
  bne t1, t2, .L13
  li t1, 1
  j .L14
.L13:
  li t1, 2
.L14:
  sb t1, 0(t0)
  ; basic/files.e16.ts:360  setFilesOpen(true)
  li a0, 1
  call setFilesOpen
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/files.e16.ts:364 printToFile() at -O1
;   n in s1
printToFile:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/files.e16.ts:365  const n = fileNumber()
  call fileNumber
  mv s1, a0 ; n
  ; basic/files.e16.ts:366  if (peek(addr(fileMode) + n - 1) !== 2) fail(E_FILE)
  lbu t0, fileMode-1(s1)
  li t1, 2
  beq t0, t1, .L1
  ; basic/files.e16.ts:366  fail(E_FILE)
  li a0, 17
  call fail
.L1:
  ; basic/files.e16.ts:367  if (next() === CH_COMMA) step()
  call next
  li t0, 44
  bne a0, t0, .L2
  ; basic/files.e16.ts:367  step()
  call step
.L2:
  ; basic/files.e16.ts:368  setOutFile(n)
  mv a0, s1
  call setOutFile
  ; basic/files.e16.ts:369  printItems()
  call printItems
  ; basic/files.e16.ts:370  setOutFile(0)
  li a0, 0
  call setOutFile
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/files.e16.ts:374 fileByte(c) at -O1
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
  ; basic/files.e16.ts:375  const n = outFile
  lw s1, 0x011c(zero)
  ; basic/files.e16.ts:376  const at = addr(fileBuf) + (n - 1) * FILE_BUF
  addi t0, s1, -1
  slli t0, t0, 6
  addi s0, t0, fileBuf
  ; basic/files.e16.ts:377  const len = fileLen[n - 1]
  addi t0, s1, -1
  slli t0, t0, 1
  lw s2, fileLen(t0)
  ; basic/files.e16.ts:378  poke(at + len, c)
  add t0, s0, s2
  sb s3, 0(t0)
  ; basic/files.e16.ts:379  fileLen[n - 1] = len + 1
  addi t0, s1, -1
  slli t0, t0, 1
  addi t1, s2, 1
  sw t1, fileLen(t0)
  ; basic/files.e16.ts:380  if (len + 1 === FILE_BUF) flush(n, true)
  li t0, 64
  addi t1, s2, 1
  bne t1, t0, .L1
  ; basic/files.e16.ts:380  flush(n, true)
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

; basic/files.e16.ts:384 flush(n, must) at -O1
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
  ; basic/files.e16.ts:385  const len = fileLen[n - 1]
  addi t0, s1, -1
  slli t0, t0, 1
  lw s2, fileLen(t0)
  ; basic/files.e16.ts:386  if (len === 0) return
  bne s2, zero, .L1
  ; basic/files.e16.ts:386  return
  j .return
.L1:
  ; basic/files.e16.ts:387  fileToBlock(n)
  mv a0, s1
  call fileToBlock
  ; basic/files.e16.ts:388  fileLen[n - 1] = 0
  addi t0, s1, -1
  slli t0, t0, 1
  sw zero, fileLen(t0)
  ; basic/files.e16.ts:389  const at = addr(fileBuf) + (n - 1) * FILE_BUF
  addi t0, s1, -1
  slli t0, t0, 6
  addi s3, t0, fileBuf
  ; basic/files.e16.ts:390  if (must) cardMust(OP_WRITE, APPEND, at, len)
  beqz s0, .L2
  ; basic/files.e16.ts:390  cardMust(OP_WRITE, APPEND, at, len)
  li a0, 3
  li a1, 65535
  mv a2, s3
  mv a3, s2
  call cardMust
  j .L3
.L2:
  ; basic/files.e16.ts:391  cardCall(OP_WRITE, APPEND, at, len)
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

; basic/files.e16.ts:395 fileByteIn(n) at -O1
;   n in s1
;   pos in s2
fileByteIn:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; n
  ; basic/files.e16.ts:396  if (filePos[n - 1] >= fileLen[n - 1] && !fill(n)) return 0xffff
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
  ; basic/files.e16.ts:396  return 0xffff
  li a0, 65535
  j .return
.L1:
  ; basic/files.e16.ts:397  const pos = filePos[n - 1]
  addi t0, s1, -1
  slli t0, t0, 1
  lw s2, filePos(t0)
  ; basic/files.e16.ts:398  filePos[n - 1] = pos + 1
  addi t0, s1, -1
  slli t0, t0, 1
  addi t1, s2, 1
  sw t1, filePos(t0)
  ; basic/files.e16.ts:399  return peek(addr(fileBuf) + (n - 1) * FILE_BUF + pos)
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

; basic/files.e16.ts:403 fill(n) at -O1
;   n in s1
;   got in s2
fill:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; n
  ; basic/files.e16.ts:404  fileToBlock(n)
  mv a0, s1
  call fileToBlock
  ; basic/files.e16.ts:405  cardMust(OP_READ, fileOffset[n - 1], addr(fileBuf) + (n - 1) * FILE_BUF, FILE_BUF)
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
  ; basic/files.e16.ts:406  const got = peek16(CARD_RESULT)
  li t0, 65382
  lw s2, 0(t0)
  ; basic/files.e16.ts:407  fileOffset[n - 1] = fileOffset[n - 1] + got
  addi t0, s1, -1
  slli t0, t0, 1
  addi t1, s1, -1
  slli t1, t1, 1
  lw t1, fileOffset(t1)
  add t1, t1, s2
  sw t1, fileOffset(t0)
  ; basic/files.e16.ts:408  fileLen[n - 1] = got
  addi t0, s1, -1
  slli t0, t0, 1
  sw s2, fileLen(t0)
  ; basic/files.e16.ts:409  filePos[n - 1] = 0
  addi t0, s1, -1
  slli t0, t0, 1
  sw zero, filePos(t0)
  ; basic/files.e16.ts:410  return got > 0
  sltu a0, zero, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/files.e16.ts:414 inputFromFile() at -O1
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
  ; basic/files.e16.ts:415  const n = fileNumber()
  call fileNumber
  mv s1, a0 ; n
  ; basic/files.e16.ts:416  if (peek(addr(fileMode) + n - 1) !== 1) fail(E_FILE)
  lbu t0, fileMode-1(s1)
  li t1, 1
  beq t0, t1, .L1
  ; basic/files.e16.ts:416  fail(E_FILE)
  li a0, 17
  call fail
.L1:
  ; basic/files.e16.ts:417  expect(CH_COMMA)
  li a0, 44
  call expect
  ; basic/files.e16.ts:418  for (;;) {
.L2:
  ; basic/files.e16.ts:419  const at = varAt(true)
  li a0, 1
  call varAt
  mv s2, a0 ; at
  ; basic/files.e16.ts:420  const room = varRoom
  lw s3, 0x011a(zero)
  ; basic/files.e16.ts:421  const length = itemIn(n)
  mv a0, s1
  call itemIn
  mv s0, a0 ; length
  ; basic/files.e16.ts:422  if (length === 0xffff) fail(E_DATA)
  li t0, 65535
  bne s0, t0, .L6
  ; basic/files.e16.ts:422  fail(E_DATA)
  li a0, 14
  call fail
.L6:
  ; basic/files.e16.ts:423  if (takeItem(at, room, addr(lineBuf), false) === 0xffff) fail(E_TYPE)
  mv a0, s2
  mv a1, s3
  la a2, lineBuf
  li a3, 0
  la t0, takeItem
  li t1, 0
  call far_call
  li t0, 65535
  bne a0, t0, .L7
  ; basic/files.e16.ts:423  fail(E_TYPE)
  li a0, 11
  call fail
.L7:
  ; basic/files.e16.ts:424  if (next() !== CH_COMMA) return
  call next
  li t0, 44
  beq a0, t0, .L8
  ; basic/files.e16.ts:424  return
  j .return
.L8:
  ; basic/files.e16.ts:425  step()
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

; basic/files.e16.ts:433 itemIn(n) at -O1
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
  ; basic/files.e16.ts:434  const line = addr(lineBuf)
  la t0, lineBuf
  sw t0, 0(fp) ; line
  ; basic/files.e16.ts:435  let c = fileByteIn(n)
  mv a0, s3
  call fileByteIn
  mv s1, a0 ; c
  ; basic/files.e16.ts:436  while (c === CH_SPACE || c === K_ENTER || c === LF) c = fileByteIn(n)
  j .L3
.L1:
  ; basic/files.e16.ts:436  c = fileByteIn(n)
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
  ; basic/files.e16.ts:437  if (c === 0xffff) return 0xffff
  li t0, 65535
  bne s1, t0, .L5
  ; basic/files.e16.ts:437  return 0xffff
  li a0, 65535
  j .return
.L5:
  ; basic/files.e16.ts:438  let k: u16 = 0
  li s2, 0 ; k
  ; basic/files.e16.ts:439  const inQuote = c === CH_QUOTE
  li t0, 34
  sub t0, s1, t0
  seqz t0, t0
  sw t0, 2(fp) ; inQuote
  ; basic/files.e16.ts:441  if (inQuote) {
  lw t0, 2(fp) ; inQuote
  beqz t0, .L9
  ; basic/files.e16.ts:442  poke(line, CH_QUOTE)
  li t0, 34
  lw t1, 0(fp) ; line
  sb t0, 0(t1)
  ; basic/files.e16.ts:443  k = 1
  li s2, 1 ; k
  ; basic/files.e16.ts:444  c = fileByteIn(n)
  mv a0, s3
  call fileByteIn
  mv s1, a0 ; c
  ; basic/files.e16.ts:446  while (c !== 0xffff && k < 77) {
  j .L9
.L7:
  ; basic/files.e16.ts:447  if (inQuote ? c === CH_QUOTE : c === CH_COMMA || c === K_ENTER || c === LF) break
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
  ; basic/files.e16.ts:447  break
  j .L10
.L11:
  ; basic/files.e16.ts:448  poke(line + k, c)
  lw t0, 0(fp) ; line
  add t0, t0, s2
  sb s1, 0(t0)
  ; basic/files.e16.ts:449  k++
  addi s2, s2, 1
  ; basic/files.e16.ts:450  c = fileByteIn(n)
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
  ; basic/files.e16.ts:454  if (inQuote) {
  lw t0, 2(fp) ; inQuote
  beqz t0, .L17
  ; basic/files.e16.ts:455  poke(line + k, CH_QUOTE)
  lw t0, 0(fp) ; line
  add t0, t0, s2
  li t1, 34
  sb t1, 0(t0)
  ; basic/files.e16.ts:456  k++
  addi s2, s2, 1
  ; basic/files.e16.ts:457  c = fileByteIn(n)
  mv a0, s3
  call fileByteIn
  mv s1, a0 ; c
  ; basic/files.e16.ts:458  while (c === CH_SPACE) c = fileByteIn(n)
  j .L20
.L18:
  ; basic/files.e16.ts:458  c = fileByteIn(n)
  mv a0, s3
  call fileByteIn
  mv s1, a0 ; c
.L20:
  li t0, 32
  beq s1, t0, .L18
.L17:
  ; basic/files.e16.ts:460  poke(line + k, 0)
  lw t0, 0(fp) ; line
  add t0, t0, s2
  sb zero, 0(t0)
  ; basic/files.e16.ts:461  return k
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

; basic/files.e16.ts:465 itemLeft(f) at -O1
;   f in s1
;   c in s2
itemLeft:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; f
  ; basic/files.e16.ts:466  for (;;) {
.L1:
  ; basic/files.e16.ts:467  if (filePos[f - 1] >= fileLen[f - 1] && !fill(f)) return false
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
  ; basic/files.e16.ts:467  return false
  li a0, 0
  j .return
.L5:
  ; basic/files.e16.ts:468  const c = peek(addr(fileBuf) + (f - 1) * FILE_BUF + filePos[f - 1])
  addi t0, s1, -1
  slli t0, t0, 6
  addi t1, s1, -1
  slli t1, t1, 1
  lw t1, filePos(t1)
  addi t0, t0, fileBuf
  add t0, t0, t1
  lbu s2, 0(t0)
  ; basic/files.e16.ts:469  if (c !== CH_SPACE && c !== K_ENTER && c !== LF) return true
  li t0, 32
  beq s2, t0, .L6
  li t0, 13
  beq s2, t0, .L6
  li t0, 10
  beq s2, t0, .L6
  ; basic/files.e16.ts:469  return true
  li a0, 1
  j .return
.L6:
  ; basic/files.e16.ts:470  filePos[f - 1] = filePos[f - 1] + 1
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

; basic/files.e16.ts:475 eofFunction() at -O1
;   n in s1
eofFunction:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/files.e16.ts:476  unary()
  call unary
  ; basic/files.e16.ts:477  needNumber()
  call needNumber
  ; basic/files.e16.ts:478  const n = toInt(top())
  call top
  call toInt
  mv s1, a0 ; n
  ; basic/files.e16.ts:479  if (n < 1 || n > 2 || peek(addr(fileMode) + u16(n) - 1) !== 1) fail(E_FILE)
  li t0, 1
  blt s1, t0, .L2
  li t0, 2
  blt t0, s1, .L2
  lbu t0, fileMode-1(s1)
  li t1, 1
  beq t0, t1, .L1
.L2:
  ; basic/files.e16.ts:479  fail(E_FILE)
  li a0, 17
  call fail
.L1:
  ; basic/files.e16.ts:480  setInt(top(), itemLeft(u16(n)) ? 0 : 1)
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
  ; basic/files.e16.ts:481  setStrType(false)
  li a0, 0
  call setStrType
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/files.e16.ts:485 closeStatement() at -O1
;   n in s1
closeStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/files.e16.ts:486  if (statementEnds()) {
  call statementEnds
  beqz a0, .L1
  ; basic/files.e16.ts:487  for (let n: u16 = 1; n <= 2; n++) closeFile(n, true)
  li s1, 1 ; n
  j .L4
.L2:
  ; basic/files.e16.ts:487  closeFile(n, true)
  mv a0, s1
  li a1, 1
  call closeFile
  addi s1, s1, 1
.L4:
  li t0, 2
  bgeu t0, s1, .L2
  ; basic/files.e16.ts:488  return
  j .return
.L1:
  ; basic/files.e16.ts:490  closeFile(fileNumber(), true)
  call fileNumber
  li a1, 1
  call closeFile
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/files.e16.ts:493 closeFile(n, must) at -O1
;   n in s1
;   must in s2
closeFile:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; n
  mv s2, a1 ; must
  ; basic/files.e16.ts:494  if (peek(addr(fileMode) + n - 1) === 2) flush(n, must)
  lbu t0, fileMode-1(s1)
  li t1, 2
  bne t0, t1, .L1
  ; basic/files.e16.ts:494  flush(n, must)
  mv a0, s1
  mv a1, s2
  call flush
.L1:
  ; basic/files.e16.ts:495  poke(addr(fileMode) + n - 1, 0)
  sb zero, fileMode-1(s1)
  ; basic/files.e16.ts:496  setFilesOpen(peek(addr(fileMode)) !== 0 || peek(addr(fileMode) + 1) !== 0)
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

; basic/files.e16.ts:500 closeFiles() at -O1
;   n in s1
;   written in s2
closeFiles:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; basic/files.e16.ts:502  setFilesOpen(false)
  li a0, 0
  call setFilesOpen
  ; basic/files.e16.ts:503  for (let n: u16 = 1; n <= 2; n++) {
  li s1, 1 ; n
  j .L3
.L1:
  ; basic/files.e16.ts:504  const written = peek(addr(fileMode) + n - 1) === 2
  lbu t0, fileMode-1(s1)
  li t1, 2
  sub t0, t0, t1
  seqz s2, t0
  ; basic/files.e16.ts:505  poke(addr(fileMode) + n - 1, 0)
  sb zero, fileMode-1(s1)
  ; basic/files.e16.ts:506  if (written) flush(n, false)
  beqz s2, .L5
  ; basic/files.e16.ts:506  flush(n, false)
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

; basic/files.e16.ts:511 fileStatement(c) at -O1
;   c in s1
fileStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/files.e16.ts:512  if (c === T_FILES) filesStatement()
  li t0, 168
  bne s1, t0, .L1
  ; basic/files.e16.ts:512  filesStatement()
  call filesStatement
  j .L2
.L1:
  ; basic/files.e16.ts:513  if (c === T_SAVE) saveStatement()
  li t0, 170
  bne s1, t0, .L3
  ; basic/files.e16.ts:513  saveStatement()
  call saveStatement
  j .L4
.L3:
  ; basic/files.e16.ts:514  if (c === T_LOAD) loadStatement()
  li t0, 169
  bne s1, t0, .L5
  ; basic/files.e16.ts:514  loadStatement()
  call loadStatement
  j .L6
.L5:
  ; basic/files.e16.ts:515  if (c === T_KILL) {
  li t0, 171
  bne s1, t0, .L7
  ; basic/files.e16.ts:516  nameArg(str('.BAS'))
  la a0, str_27
  call nameArg
  ; basic/files.e16.ts:517  cardMust(OP_DELETE, 0, 0, 0)
  li a0, 4
  li a1, 0
  li a2, 0
  li a3, 0
  call cardMust
  j .L8
.L7:
  ; basic/files.e16.ts:518  if (c === T_OPEN) openStatement()
  li t0, 178
  bne s1, t0, .L9
  ; basic/files.e16.ts:518  openStatement()
  call openStatement
  j .L10
.L9:
  ; basic/files.e16.ts:519  if (c === T_CLOSE) closeStatement()
  li t0, 179
  bne s1, t0, .L11
  ; basic/files.e16.ts:519  closeStatement()
  call closeStatement
  j .L12
.L11:
  ; basic/files.e16.ts:520  fail(E_SYNTAX)
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

str_25:
  .byte 46, 46, 46, 0
str_26:
  .byte 32, 75, 66, 32, 70, 82, 69, 69, 0
str_27:
  .byte 46, 66, 65, 83, 0
str_28:
  .byte 46, 68, 65, 84, 0
  .align 2

  .bank 3
  .org 0xc000
; basic/tools.e16.ts:48 autoStatement() at -O1
;   start in s2
;   by in s3
;   at in s1
autoStatement:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; basic/tools.e16.ts:49  let start: u16 = 10
  li s2, 10 ; start
  ; basic/tools.e16.ts:50  let by: u16 = 10
  li s3, 10 ; by
  ; basic/tools.e16.ts:52  for (let at = PROG; peek16(at) !== 0; at += peek16(at + 2)) start = peek16(at) + 10
  li s1, 2048 ; at
  j .L3
.L1:
  ; basic/tools.e16.ts:52  start = peek16(at) + 10
  lw t0, 0(s1)
  addi s2, t0, 10
  lw t0, 2(s1)
  add s1, s1, t0
.L3:
  lw t0, 0(s1)
  bne t0, zero, .L1
  ; basic/tools.e16.ts:53  if (isDigit(next())) start = readUnsigned()
  call next
  call isDigit
  beqz a0, .L5
  ; basic/tools.e16.ts:53  start = readUnsigned()
  call readUnsigned
  mv s2, a0 ; start
.L5:
  ; basic/tools.e16.ts:54  if (next() === CH_COMMA) {
  call next
  li t0, 44
  bne a0, t0, .L6
  ; basic/tools.e16.ts:55  step()
  call step
  ; basic/tools.e16.ts:56  by = readUnsigned()
  call readUnsigned
  mv s3, a0 ; by
.L6:
  ; basic/tools.e16.ts:58  if (start === 0 || by === 0) fail(E_ARGUMENT)
  beq s2, zero, .L8
  bne s3, zero, .L7
.L8:
  ; basic/tools.e16.ts:58  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L7:
  ; basic/tools.e16.ts:59  setAuto(start, by)
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

; basic/tools.e16.ts:63 deleteStatement() at -O1
;   from in s1
;   to in s2
;   at in s3
deleteStatement:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/tools.e16.ts:65  if (statementEnds()) fail(E_SYNTAX)
  call statementEnds
  beqz a0, .L1
  ; basic/tools.e16.ts:65  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/tools.e16.ts:66  let from: u16 = 0
  li s1, 0 ; from
  ; basic/tools.e16.ts:67  let to: u16 = 0xffff
  li s2, 65535 ; to
  ; basic/tools.e16.ts:68  if (isDigit(next())) {
  call next
  call isDigit
  beqz a0, .L2
  ; basic/tools.e16.ts:69  from = readUnsigned()
  call readUnsigned
  mv s1, a0 ; from
  ; basic/tools.e16.ts:70  to = from
  mv s2, s1 ; to
.L2:
  ; basic/tools.e16.ts:72  if (next() === CH_MINUS) {
  call next
  li t0, 45
  bne a0, t0, .L3
  ; basic/tools.e16.ts:73  step()
  call step
  ; basic/tools.e16.ts:74  to = isDigit(next()) ? readUnsigned() : 0xffff
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
  ; basic/tools.e16.ts:76  if (to < from) fail(E_ARGUMENT)
  bgeu s2, s1, .L6
  ; basic/tools.e16.ts:76  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L6:
  ; basic/tools.e16.ts:77  let at = findLine(from, false)
  mv a0, s1
  li a1, 0
  call findLine
  mv s3, a0 ; at
  ; basic/tools.e16.ts:78  while (at !== 0 && peek16(at) <= to) {
  j .L9
.L7:
  ; basic/tools.e16.ts:79  storeLine(peek16(at), 0, 1)
  lw a0, 0(s3)
  li a1, 0
  li a2, 1
  call storeLine
  ; basic/tools.e16.ts:80  at = findLine(from, false)
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

; basic/tools.e16.ts:91 renumbered(old) at -O1
;   old in a0
;   k in a2
;   at in a1
;   n in a3
renumbered:
  ; basic/tools.e16.ts:92  if (old < renumFrom) return old
  lw t0, 0x07ec(zero)
  bgeu a0, t0, .L1
  ; basic/tools.e16.ts:92  return old
  ret
.L1:
  ; basic/tools.e16.ts:93  let k: u16 = 0
  li a2, 0 ; k
  ; basic/tools.e16.ts:94  for (let at = PROG; peek16(at) !== 0; at += peek16(at + 2)) {
  li a1, 2048 ; at
  j .L4
.L2:
  ; basic/tools.e16.ts:95  const n = peek16(at)
  lw a3, 0(a1)
  ; basic/tools.e16.ts:96  if (n === old) return newStart + k * renumStep
  bne a3, a0, .L6
  ; basic/tools.e16.ts:96  return newStart + k * renumStep
  lw t0, 0x07ea(zero)
  lw t1, 0x07ee(zero)
  mul t1, a2, t1
  add a0, t0, t1
  ret
.L6:
  ; basic/tools.e16.ts:97  if (n >= renumFrom) k++
  lw t0, 0x07ec(zero)
  bltu a3, t0, .L7
  ; basic/tools.e16.ts:97  k++
  addi a2, a2, 1
.L7:
  lw t0, 2(a1)
  add a1, a1, t0
.L4:
  lw t0, 0(a1)
  bne t0, zero, .L2
  ; basic/tools.e16.ts:100  return old
.return:
  ret

; basic/tools.e16.ts:107 renumStatement() at -O1
;   at in s1
;   n/k in s2
;   length in s3
renumStatement:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/tools.e16.ts:108  newStart = 10
  li t0, 10
  sw t0, 0x07ea(zero)
  ; basic/tools.e16.ts:109  renumFrom = 0
  sw zero, 0x07ec(zero)
  ; basic/tools.e16.ts:110  renumStep = 10
  li t0, 10
  sw t0, 0x07ee(zero)
  ; basic/tools.e16.ts:111  if (isDigit(next())) newStart = readUnsigned()
  call next
  call isDigit
  beqz a0, .L1
  ; basic/tools.e16.ts:111  newStart = readUnsigned()
  call readUnsigned
  sw a0, 0x07ea(zero)
.L1:
  ; basic/tools.e16.ts:112  if (next() === CH_COMMA) {
  call next
  li t0, 44
  bne a0, t0, .L2
  ; basic/tools.e16.ts:113  step()
  call step
  ; basic/tools.e16.ts:114  if (isDigit(next())) renumFrom = readUnsigned()
  call next
  call isDigit
  beqz a0, .L3
  ; basic/tools.e16.ts:114  renumFrom = readUnsigned()
  call readUnsigned
  sw a0, 0x07ec(zero)
.L3:
.L2:
  ; basic/tools.e16.ts:116  if (next() === CH_COMMA) {
  call next
  li t0, 44
  bne a0, t0, .L4
  ; basic/tools.e16.ts:117  step()
  call step
  ; basic/tools.e16.ts:118  renumStep = readUnsigned()
  call readUnsigned
  sw a0, 0x07ee(zero)
.L4:
  ; basic/tools.e16.ts:120  checkRoom()
  call checkRoom
  ; basic/tools.e16.ts:121  checkRewrites()
  call checkRewrites
  ; basic/tools.e16.ts:123  let at = PROG
  li s1, 2048 ; at
  ; basic/tools.e16.ts:124  while (peek16(at) !== 0) {
  j .L7
.L5:
  ; basic/tools.e16.ts:125  const n = peek16(at)
  lw s2, 0(s1)
  ; basic/tools.e16.ts:126  const length = rewrite(at + 4)
  addi a0, s1, 4
  call rewrite
  mv s3, a0 ; length
  ; basic/tools.e16.ts:127  if (length !== 0) {
  beq s3, zero, .L9
  ; basic/tools.e16.ts:128  storeLine(n, addr(lineBuf), length)
  mv a0, s2
  la a1, lineBuf
  mv a2, s3
  call storeLine
  ; basic/tools.e16.ts:129  at = findLine(n, true)
  mv a0, s2
  li a1, 1
  call findLine
  mv s1, a0 ; at
.L9:
  ; basic/tools.e16.ts:131  at += peek16(at + 2)
  lw t0, 2(s1)
  add s1, s1, t0
.L7:
  lw t0, 0(s1)
  bne t0, zero, .L5
  ; basic/tools.e16.ts:133  let k: u16 = 0
  li s2, 0 ; n/k
  ; basic/tools.e16.ts:134  for (at = PROG; peek16(at) !== 0; at += peek16(at + 2)) {
  li s1, 2048 ; at
  j .L12
.L10:
  ; basic/tools.e16.ts:135  if (peek16(at) < renumFrom) continue
  lw t0, 0(s1)
  lw t1, 0x07ec(zero)
  bgeu t0, t1, .L14
  ; basic/tools.e16.ts:135  continue
  j .L11
.L14:
  ; basic/tools.e16.ts:136  poke16(at, newStart + k * renumStep)
  lw t0, 0x07ea(zero)
  lw t1, 0x07ee(zero)
  mul t1, s2, t1
  add t0, t0, t1
  sw t0, 0(s1)
  ; basic/tools.e16.ts:137  k++
  addi s2, s2, 1
.L11:
  lw t0, 2(s1)
  add s1, s1, t0
.L12:
  lw t0, 0(s1)
  bne t0, zero, .L10
  ; basic/tools.e16.ts:139  keepProgramTo(progEnd)
  lw a0, 0x0112(zero)
  call keepProgramTo
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/tools.e16.ts:143 checkRoom() at -O1
;   count in s2
;   at in s1
;   n in s3
checkRoom:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  ; basic/tools.e16.ts:144  if (renumStep === 0 || newStart === 0 || newStart > 65529) fail(E_ARGUMENT)
  lw t0, 0x07ee(zero)
  beq t0, zero, .L2
  lw t0, 0x07ea(zero)
  beq t0, zero, .L2
  lw t0, 0x07ea(zero)
  li t1, 65529
  bgeu t1, t0, .L1
.L2:
  ; basic/tools.e16.ts:144  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L1:
  ; basic/tools.e16.ts:145  let count: u16 = 0
  li s2, 0 ; count
  ; basic/tools.e16.ts:146  for (let at = PROG; peek16(at) !== 0; at += peek16(at + 2)) {
  li s1, 2048 ; at
  j .L5
.L3:
  ; basic/tools.e16.ts:147  const n = peek16(at)
  lw s3, 0(s1)
  ; basic/tools.e16.ts:148  if (n < renumFrom && n >= newStart) fail(E_ARGUMENT)
  lw t0, 0x07ec(zero)
  bgeu s3, t0, .L7
  lw t0, 0x07ea(zero)
  bltu s3, t0, .L7
  ; basic/tools.e16.ts:148  fail(E_ARGUMENT)
  li a0, 4
  call fail
.L7:
  ; basic/tools.e16.ts:149  if (n >= renumFrom) count++
  lw t0, 0x07ec(zero)
  bltu s3, t0, .L8
  ; basic/tools.e16.ts:149  count++
  addi s2, s2, 1
.L8:
  lw t0, 2(s1)
  add s1, s1, t0
.L5:
  lw t0, 0(s1)
  bne t0, zero, .L3
  ; basic/tools.e16.ts:151  if (count > 0 && count - 1 > div(65529 - newStart, renumStep)) fail(E_ARGUMENT)
  bgeu zero, s2, .L9
  lw t0, 0x07ea(zero)
  li t1, 65529
  sub t1, t1, t0
  lw t0, 0x07ee(zero)
  divu t1, t1, t0
  addi t0, s2, -1
  bgeu t1, t0, .L9
  ; basic/tools.e16.ts:151  fail(E_ARGUMENT)
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

; basic/tools.e16.ts:158 checkRewrites() at -O1
;   grows in s2
;   at in s1
;   length in s3
;   was in s0
checkRewrites:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  ; basic/tools.e16.ts:159  let grows: u16 = 0
  li s2, 0 ; grows
  ; basic/tools.e16.ts:160  for (let at = PROG; peek16(at) !== 0; at += peek16(at + 2)) {
  li s1, 2048 ; at
  j .L3
.L1:
  ; basic/tools.e16.ts:161  const length = rewrite(at + 4)
  addi a0, s1, 4
  call rewrite
  mv s3, a0 ; length
  ; basic/tools.e16.ts:162  const was = peek16(at + 2) - 4
  lw t0, 2(s1)
  addi s0, t0, -4
  ; basic/tools.e16.ts:163  if (length > was) grows += length - was
  bgeu s0, s3, .L5
  ; basic/tools.e16.ts:163  grows += length - was
  sub t0, s3, s0
  add s2, s2, t0
.L5:
  lw t0, 2(s1)
  add s1, s1, t0
.L3:
  lw t0, 0(s1)
  bne t0, zero, .L1
  ; basic/tools.e16.ts:165  if (progEnd + 2 + grows > LIMIT) fail(E_MEMORY)
  lw t0, 0x0112(zero)
  addi t0, t0, 2
  add t0, t0, s2
  li t1, 28672
  bgeu t1, t0, .L6
  ; basic/tools.e16.ts:165  fail(E_MEMORY)
  li a0, 8
  call fail
.L6:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; basic/tools.e16.ts:169 takesLine(c) at -O1
;   c in a0
takesLine:
  ; basic/tools.e16.ts:170  return c === T_GOTO || c === T_GOSUB || c === T_THEN || c === T_ELSE || c === T_RESTORE
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

; basic/tools.e16.ts:183 rewrite(from) at -O1
;   from in s1
rewrite:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; from
  ; basic/tools.e16.ts:184  rp = from
  sw s1, 0x07f0(zero)
  ; basic/tools.e16.ts:185  ro = 0
  sw zero, 0x07f2(zero)
  ; basic/tools.e16.ts:186  rChanged = false
  sw zero, 0x07f4(zero)
  ; basic/tools.e16.ts:187  rWanting = false
  sw zero, 0x07f8(zero)
  ; basic/tools.e16.ts:188  rInside = false
  sw zero, 0x07f6(zero)
  ; basic/tools.e16.ts:189  while (peek(rp) !== 0) {
  j .L3
.L1:
  ; basic/tools.e16.ts:190  if (!rInside && rWanting && isDigit(peek(rp))) {
  lw t0, 0x07f6(zero)
  bnez t0, .L5
  lw t0, 0x07f8(zero)
  beqz t0, .L5
  lw t0, 0x07f0(zero)
  lbu a0, 0(t0)
  call isDigit
  beqz a0, .L5
  ; basic/tools.e16.ts:191  renumberHere()
  call renumberHere
  ; basic/tools.e16.ts:192  continue
  j .L2
.L5:
  ; basic/tools.e16.ts:194  if (!rInside && peek(rp) === T_REM) {
  lw t0, 0x07f6(zero)
  bnez t0, .L6
  lw t0, 0x07f0(zero)
  lbu t0, 0(t0)
  li t1, 147
  bne t0, t1, .L6
  ; basic/tools.e16.ts:196  while (peek(rp) !== 0) copyOne()
  j .L9
.L7:
  ; basic/tools.e16.ts:196  copyOne()
  call copyOne
.L9:
  lw t0, 0x07f0(zero)
  lbu t0, 0(t0)
  bne t0, zero, .L7
  ; basic/tools.e16.ts:197  break
  j .L4
.L6:
  ; basic/tools.e16.ts:199  note(peek(rp))
  lw t0, 0x07f0(zero)
  lbu a0, 0(t0)
  call note
  ; basic/tools.e16.ts:200  copyOne()
  call copyOne
.L2:
.L3:
  lw t0, 0x07f0(zero)
  lbu t0, 0(t0)
  bne t0, zero, .L1
.L4:
  ; basic/tools.e16.ts:202  poke(addr(lineBuf) + ro, 0)
  lw t0, 0x07f2(zero)
  sb zero, lineBuf(t0)
  ; basic/tools.e16.ts:203  return rChanged ? ro + 1 : 0
  lw t0, 0x07f4(zero)
  beqz t0, .L11
  lw t0, 0x07f2(zero)
  addi t0, t0, 1
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

; basic/tools.e16.ts:211 note(c) at -O1
;   c in s1
note:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/tools.e16.ts:212  if (c === CH_QUOTE) rInside = !rInside
  li t0, 34
  bne s1, t0, .L1
  ; basic/tools.e16.ts:212  rInside = !rInside
  lw t0, 0x07f6(zero)
  seqz t0, t0
  sw t0, 0x07f6(zero)
.L1:
  ; basic/tools.e16.ts:214  if (!rInside && c !== CH_SPACE) rWanting = takesLine(c) || (rWanting && c === CH_COMMA)
  lw t0, 0x07f6(zero)
  bnez t0, .L2
  li t0, 32
  beq s1, t0, .L2
  ; basic/tools.e16.ts:214  rWanting = takesLine(c) || (rWanting && c === CH_COMMA)
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

; basic/tools.e16.ts:218 copyOne() at -O1
copyOne:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/tools.e16.ts:219  if (ro >= 78) fail(E_COMPLEX)
  lw t0, 0x07f2(zero)
  li t1, 78
  bltu t0, t1, .L1
  ; basic/tools.e16.ts:219  fail(E_COMPLEX)
  li a0, 9
  call fail
.L1:
  ; basic/tools.e16.ts:220  poke(addr(lineBuf) + ro, peek(rp))
  lw t0, 0x07f2(zero)
  lw t1, 0x07f0(zero)
  lbu t1, 0(t1)
  sb t1, lineBuf(t0)
  ; basic/tools.e16.ts:221  ro++
  lw t0, 0x07f2(zero)
  addi t0, t0, 1
  sw t0, 0x07f2(zero)
  ; basic/tools.e16.ts:222  rp++
  lw t0, 0x07f0(zero)
  addi t0, t0, 1
  sw t0, 0x07f0(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/tools.e16.ts:226 renumberHere() at -O1
;   old in s1
;   start in s0
;   now in s2
;   written in s3
renumberHere:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  ; basic/tools.e16.ts:227  let old: u16 = 0
  li s1, 0 ; old
  ; basic/tools.e16.ts:228  const start = rp
  lw s0, 0x07f0(zero)
  ; basic/tools.e16.ts:229  while (isDigit(peek(rp))) {
  j .L3
.L1:
  ; basic/tools.e16.ts:230  old = old * 10 + (peek(rp) - 0x30)
  slli t1, s1, 3
  slli t0, s1, 1
  add t0, t0, t1
  lw t1, 0x07f0(zero)
  lbu t1, 0(t1)
  addi t1, t1, -48
  add s1, t0, t1
  ; basic/tools.e16.ts:231  rp++
  lw t0, 0x07f0(zero)
  addi t0, t0, 1
  sw t0, 0x07f0(zero)
.L3:
  lw t0, 0x07f0(zero)
  lbu a0, 0(t0)
  call isDigit
  bnez a0, .L1
  ; basic/tools.e16.ts:233  if (ro + 6 > 78) fail(E_COMPLEX)
  lw t0, 0x07f2(zero)
  li t1, 78
  addi t0, t0, 6
  bgeu t1, t0, .L5
  ; basic/tools.e16.ts:233  fail(E_COMPLEX)
  li a0, 9
  call fail
.L5:
  ; basic/tools.e16.ts:234  const now = renumbered(old)
  mv a0, s1
  call renumbered
  mv s2, a0 ; now
  ; basic/tools.e16.ts:235  const written = unsignedText(now, addr(lineBuf) + ro)
  lw t0, 0x07f2(zero)
  mv a0, s2
  addi a1, t0, lineBuf
  call unsignedText
  mv s3, a0 ; written
  ; basic/tools.e16.ts:236  if (written !== rp - start || now !== old) rChanged = true
  lw t0, 0x07f0(zero)
  sub t0, t0, s0
  bne s3, t0, .L7
  beq s2, s1, .L6
.L7:
  ; basic/tools.e16.ts:236  rChanged = true
  li t0, 1
  sw t0, 0x07f4(zero)
.L6:
  ; basic/tools.e16.ts:237  ro += written
  lw t0, 0x07f2(zero)
  add t0, t0, s3
  sw t0, 0x07f2(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; basic/tools.e16.ts:241 toolStatement(c) at -O1
;   c in s1
toolStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/tools.e16.ts:242  if (c === T_AUTO) autoStatement()
  li t0, 163
  bne s1, t0, .L1
  ; basic/tools.e16.ts:242  autoStatement()
  call autoStatement
  j .L2
.L1:
  ; basic/tools.e16.ts:243  if (c === T_RENUM) renumStatement()
  li t0, 164
  bne s1, t0, .L3
  ; basic/tools.e16.ts:243  renumStatement()
  call renumStatement
  j .L4
.L3:
  ; basic/tools.e16.ts:244  if (c === T_DELETE) deleteStatement()
  li t0, 165
  bne s1, t0, .L5
  ; basic/tools.e16.ts:244  deleteStatement()
  call deleteStatement
  j .L6
.L5:
  ; basic/tools.e16.ts:245  setTracing(c === T_TRON)
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
  la a0, str_29
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
  la a0, str_30
  call emitStr
  j .L2
.L1:
  ; basic/monitor.e16.ts:116  if (n === 0x301) emitStr(str('misa'))
  li t0, 769
  bne s1, t0, .L3
  ; basic/monitor.e16.ts:116  emitStr(str('misa'))
  la a0, str_31
  call emitStr
  j .L4
.L3:
  ; basic/monitor.e16.ts:117  if (n === 0x304) emitStr(str('mie'))
  li t0, 772
  bne s1, t0, .L5
  ; basic/monitor.e16.ts:117  emitStr(str('mie'))
  la a0, str_32
  call emitStr
  j .L6
.L5:
  ; basic/monitor.e16.ts:118  if (n === 0x305) emitStr(str('mtvec'))
  li t0, 773
  bne s1, t0, .L7
  ; basic/monitor.e16.ts:118  emitStr(str('mtvec'))
  la a0, str_33
  call emitStr
  j .L8
.L7:
  ; basic/monitor.e16.ts:119  if (n === 0x340) emitStr(str('mscratch'))
  li t0, 832
  bne s1, t0, .L9
  ; basic/monitor.e16.ts:119  emitStr(str('mscratch'))
  la a0, str_34
  call emitStr
  j .L10
.L9:
  ; basic/monitor.e16.ts:120  if (n === 0x341) emitStr(str('mepc'))
  li t0, 833
  bne s1, t0, .L11
  ; basic/monitor.e16.ts:120  emitStr(str('mepc'))
  la a0, str_35
  call emitStr
  j .L12
.L11:
  ; basic/monitor.e16.ts:121  if (n === 0x342) emitStr(str('mcause'))
  li t0, 834
  bne s1, t0, .L13
  ; basic/monitor.e16.ts:121  emitStr(str('mcause'))
  la a0, str_36
  call emitStr
  j .L14
.L13:
  ; basic/monitor.e16.ts:122  if (n === 0x343) emitStr(str('mtval'))
  li t0, 835
  bne s1, t0, .L15
  ; basic/monitor.e16.ts:122  emitStr(str('mtval'))
  la a0, str_37
  call emitStr
  j .L16
.L15:
  ; basic/monitor.e16.ts:123  if (n === 0x344) emitStr(str('mip'))
  li t0, 836
  bne s1, t0, .L17
  ; basic/monitor.e16.ts:123  emitStr(str('mip'))
  la a0, str_38
  call emitStr
  j .L18
.L17:
  ; basic/monitor.e16.ts:124  if (n === 0xc00) emitStr(str('cycle'))
  li t0, 3072
  bne s1, t0, .L19
  ; basic/monitor.e16.ts:124  emitStr(str('cycle'))
  la a0, str_39
  call emitStr
  j .L20
.L19:
  ; basic/monitor.e16.ts:125  if (n === 0xc02) emitStr(str('instret'))
  li t0, 3074
  bne s1, t0, .L21
  ; basic/monitor.e16.ts:125  emitStr(str('instret'))
  la a0, str_40
  call emitStr
  j .L22
.L21:
  ; basic/monitor.e16.ts:126  if (n === 0xc80) emitStr(str('cycleh'))
  li t0, 3200
  bne s1, t0, .L23
  ; basic/monitor.e16.ts:126  emitStr(str('cycleh'))
  la a0, str_41
  call emitStr
  j .L24
.L23:
  ; basic/monitor.e16.ts:127  if (n === 0xc82) emitStr(str('instreth'))
  li t0, 3202
  bne s1, t0, .L25
  ; basic/monitor.e16.ts:127  emitStr(str('instreth'))
  la a0, str_42
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

; basic/monitor.e16.ts:172 decoded(name, format, rd, rs1) at -O1
;   name in a0
;   format in a1
;   rd in a2
;   rs1 in a3
decoded:
  ; basic/monitor.e16.ts:173  poke16(D_NAME, name)
  sw a0, 132(zero)
  ; basic/monitor.e16.ts:174  poke16(D_FORMAT, name === 0 ? F_ILLEGAL : format)
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
  ; basic/monitor.e16.ts:175  poke16(D_RD, rd)
  sw a2, 136(zero)
  ; basic/monitor.e16.ts:176  poke16(D_RS1, rs1)
  sw a3, 138(zero)
.return:
  ret

; basic/monitor.e16.ts:191 imm() at -O1
imm:
  ; basic/monitor.e16.ts:192  return i16(peek16(D_IMM))
  lw a0, 142(zero)
.return:
  ret

; basic/monitor.e16.ts:198 rName(key) at -O1
;   key in s1
rName:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; key
  ; basic/monitor.e16.ts:199  switch (key) {
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
  ; basic/monitor.e16.ts:201  return str('add')
  la a0, str_43
  j .return
.L3:
  ; basic/monitor.e16.ts:203  return str('sll')
  la a0, str_44
  j .return
.L4:
  ; basic/monitor.e16.ts:205  return str('slt')
  la a0, str_45
  j .return
.L5:
  ; basic/monitor.e16.ts:207  return str('sltu')
  la a0, str_46
  j .return
.L6:
  ; basic/monitor.e16.ts:209  return str('xor')
  la a0, str_47
  j .return
.L7:
  ; basic/monitor.e16.ts:211  return str('srl')
  la a0, str_48
  j .return
.L8:
  ; basic/monitor.e16.ts:213  return str('or')
  la a0, str_49
  j .return
.L9:
  ; basic/monitor.e16.ts:215  return str('and')
  la a0, str_50
  j .return
.L10:
  ; basic/monitor.e16.ts:217  return str('sub')
  la a0, str_51
  j .return
.L11:
  ; basic/monitor.e16.ts:219  return str('sra')
  la a0, str_52
  j .return
.L12:
  ; basic/monitor.e16.ts:221  return str('mul')
  la a0, str_53
  j .return
.L13:
  ; basic/monitor.e16.ts:223  return str('mulh')
  la a0, str_54
  j .return
.L14:
  ; basic/monitor.e16.ts:225  return str('mulhsu')
  la a0, str_55
  j .return
.L15:
  ; basic/monitor.e16.ts:227  return str('mulhu')
  la a0, str_56
  j .return
.L16:
  ; basic/monitor.e16.ts:229  return str('div')
  la a0, str_57
  j .return
.L17:
  ; basic/monitor.e16.ts:231  return str('divu')
  la a0, str_58
  j .return
.L18:
  ; basic/monitor.e16.ts:233  return str('rem')
  la a0, str_59
  j .return
.L19:
  ; basic/monitor.e16.ts:235  return str('remu')
  la a0, str_60
  j .return
.L20:
  ; basic/monitor.e16.ts:237  return bitName(key)
  mv a0, s1
  call bitName
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/monitor.e16.ts:241 bitName(key) at -O1
;   key in a0
bitName:
  ; basic/monitor.e16.ts:242  switch (key) {
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
  j .L15
.L2:
  ; basic/monitor.e16.ts:244  return str('rol')
  la a0, str_61
  ret
.L3:
  ; basic/monitor.e16.ts:246  return str('xnor')
  la a0, str_62
  ret
.L4:
  ; basic/monitor.e16.ts:248  return str('ror')
  la a0, str_63
  ret
.L5:
  ; basic/monitor.e16.ts:250  return str('orn')
  la a0, str_64
  ret
.L6:
  ; basic/monitor.e16.ts:252  return str('andn')
  la a0, str_65
  ret
.L7:
  ; basic/monitor.e16.ts:254  return str('min')
  la a0, str_66
  ret
.L8:
  ; basic/monitor.e16.ts:256  return str('minu')
  la a0, str_67
  ret
.L9:
  ; basic/monitor.e16.ts:258  return str('max')
  la a0, str_68
  ret
.L10:
  ; basic/monitor.e16.ts:260  return str('maxu')
  la a0, str_69
  ret
.L11:
  ; basic/monitor.e16.ts:262  return str('bset')
  la a0, str_70
  ret
.L12:
  ; basic/monitor.e16.ts:264  return str('bclr')
  la a0, str_71
  ret
.L13:
  ; basic/monitor.e16.ts:266  return str('binv')
  la a0, str_72
  ret
.L14:
  ; basic/monitor.e16.ts:268  return str('bext')
  la a0, str_73
  ret
.L15:
  ; basic/monitor.e16.ts:270  return 0
  li a0, 0
.return:
  ret

; basic/monitor.e16.ts:275 shiftName(f3, sel) at -O1
;   f3 in a0
;   sel in a1
shiftName:
  ; basic/monitor.e16.ts:276  if (f3 === 5) {
  li t0, 5
  bne a0, t0, .L1
  ; basic/monitor.e16.ts:277  if (sel === 0) return str('srli')
  bne a1, zero, .L2
  ; basic/monitor.e16.ts:277  return str('srli')
  la a0, str_74
  ret
.L2:
  ; basic/monitor.e16.ts:278  if (sel === 1) return str('srai')
  li t0, 1
  bne a1, t0, .L3
  ; basic/monitor.e16.ts:278  return str('srai')
  la a0, str_75
  ret
.L3:
  ; basic/monitor.e16.ts:279  if (sel === 2) return str('rori')
  li t0, 2
  bne a1, t0, .L4
  ; basic/monitor.e16.ts:279  return str('rori')
  la a0, str_76
  ret
.L4:
  ; basic/monitor.e16.ts:280  if (sel === 3) return str('bexti')
  li t0, 3
  bne a1, t0, .L5
  ; basic/monitor.e16.ts:280  return str('bexti')
  la a0, str_77
  ret
.L5:
  ; basic/monitor.e16.ts:281  return 0
  li a0, 0
  ret
.L1:
  ; basic/monitor.e16.ts:283  switch (sel) {
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
  ; basic/monitor.e16.ts:285  return str('slli')
  la a0, str_78
  ret
.L8:
  ; basic/monitor.e16.ts:287  return str('bseti')
  la a0, str_79
  ret
.L9:
  ; basic/monitor.e16.ts:289  return str('bclri')
  la a0, str_80
  ret
.L10:
  ; basic/monitor.e16.ts:291  return str('binvi')
  la a0, str_81
  ret
.L11:
  ; basic/monitor.e16.ts:293  return str('clz')
  la a0, str_82
  ret
.L12:
  ; basic/monitor.e16.ts:295  return str('ctz')
  la a0, str_83
  ret
.L13:
  ; basic/monitor.e16.ts:297  return str('cpop')
  la a0, str_84
  ret
.L14:
  ; basic/monitor.e16.ts:299  return str('sext.b')
  la a0, str_85
  ret
.L15:
  ; basic/monitor.e16.ts:301  return str('zext.b')
  la a0, str_86
  ret
.L16:
  ; basic/monitor.e16.ts:303  return str('rev8')
  la a0, str_87
  ret
.L17:
  ; basic/monitor.e16.ts:305  return 0
  li a0, 0
.return:
  ret

; basic/monitor.e16.ts:309 immName(f3) at -O1
;   f3 in a0
immName:
  ; basic/monitor.e16.ts:310  switch (f3) {
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
  ; basic/monitor.e16.ts:312  return str('addi')
  la a0, str_88
  ret
.L3:
  ; basic/monitor.e16.ts:314  return str('slti')
  la a0, str_89
  ret
.L4:
  ; basic/monitor.e16.ts:316  return str('sltiu')
  la a0, str_90
  ret
.L5:
  ; basic/monitor.e16.ts:318  return str('xori')
  la a0, str_91
  ret
.L6:
  ; basic/monitor.e16.ts:320  return str('ori')
  la a0, str_92
  ret
.L7:
  ; basic/monitor.e16.ts:322  return str('andi')
  la a0, str_93
  ret
.L8:
  ; basic/monitor.e16.ts:324  return 0
  li a0, 0
.return:
  ret

; basic/monitor.e16.ts:328 opImm(f3, rd, rs1, imm14) at -O1
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
  ; basic/monitor.e16.ts:329  if (f3 !== 1 && f3 !== 5) {
  li t0, 1
  beq s1, t0, .L1
  li t0, 5
  beq s1, t0, .L1
  ; basic/monitor.e16.ts:330  decoded(immName(f3), F_I, rd, rs1)
  mv a0, s1
  call immName
  li a1, 2
  mv a2, s3
  lw a3, 0(fp)
  call decoded
  ; basic/monitor.e16.ts:331  setImm(i16(wrap16(imm14 << 2)) >> 2)
  slli t0, s2, 2
  srai t0, t0, 2
  sw t0, 4(fp) ; setImm.v
  ; basic/monitor.e16.ts:184  poke16(D_IMM, u16(v))
  lw t0, 4(fp) ; setImm.v
  sw t0, 142(zero)
  ; basic/monitor.e16.ts:332  return
  j .return
.L1:
  ; basic/monitor.e16.ts:334  const sel = imm14 >> 4
  srli t0, s2, 4
  sw t0, 2(fp) ; sel
  ; basic/monitor.e16.ts:335  if (sel < 0x10) {
  li t0, 16
  lw t1, 2(fp) ; sel
  bgeu t1, t0, .L2
  ; basic/monitor.e16.ts:336  decoded(shiftName(f3, sel), F_I, rd, rs1)
  mv a0, s1
  lw a1, 2(fp)
  call shiftName
  li a1, 2
  mv a2, s3
  lw a3, 0(fp)
  call decoded
  ; basic/monitor.e16.ts:337  setImm(i16(imm14 & 15))
  andi t0, s2, 15
  sw t0, 6(fp) ; setImm.v
  ; basic/monitor.e16.ts:184  poke16(D_IMM, u16(v))
  lw t0, 6(fp) ; setImm.v
  sw t0, 142(zero)
  j .L3
.L2:
  ; basic/monitor.e16.ts:338  if ((imm14 & 15) === 0) {
  andi t0, s2, 15
  bne t0, zero, .L4
  ; basic/monitor.e16.ts:339  decoded(shiftName(f3, sel), F_UNARY, rd, rs1)
  mv a0, s1
  lw a1, 2(fp)
  call shiftName
  li a1, 4
  mv a2, s3
  lw a3, 0(fp)
  call decoded
  j .L5
.L4:
  ; basic/monitor.e16.ts:341  illegal()
  ; basic/monitor.e16.ts:180  poke16(D_FORMAT, F_ILLEGAL)
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

; basic/monitor.e16.ts:345 loadOrJalr(major, f3) at -O1
;   major in a0
;   f3 in a1
loadOrJalr:
  ; basic/monitor.e16.ts:346  if (major === 6) return f3 === 0 ? str('jalr') : 0
  li t0, 6
  bne a0, t0, .L1
  ; basic/monitor.e16.ts:346  return f3 === 0 ? str('jalr') : 0
  bne a1, zero, .L2
  la t0, str_94
  j .L3
.L2:
  li t0, 0
.L3:
  mv a0, t0
  ret
.L1:
  ; basic/monitor.e16.ts:347  if (f3 === 0) return str('lb')
  bne a1, zero, .L4
  ; basic/monitor.e16.ts:347  return str('lb')
  la a0, str_95
  ret
.L4:
  ; basic/monitor.e16.ts:348  if (f3 === 1) return str('lw')
  li t0, 1
  bne a1, t0, .L5
  ; basic/monitor.e16.ts:348  return str('lw')
  la a0, str_96
  ret
.L5:
  ; basic/monitor.e16.ts:349  if (f3 === 4) return str('lbu')
  li t0, 4
  bne a1, t0, .L6
  ; basic/monitor.e16.ts:349  return str('lbu')
  la a0, str_97
  ret
.L6:
  ; basic/monitor.e16.ts:350  return 0
  li a0, 0
.return:
  ret

; basic/monitor.e16.ts:353 branchName(f3) at -O1
;   f3 in a0
branchName:
  ; basic/monitor.e16.ts:354  switch (f3) {
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
  ; basic/monitor.e16.ts:356  return str('beq')
  la a0, str_98
  ret
.L3:
  ; basic/monitor.e16.ts:358  return str('bne')
  la a0, str_99
  ret
.L4:
  ; basic/monitor.e16.ts:360  return str('blt')
  la a0, str_100
  ret
.L5:
  ; basic/monitor.e16.ts:362  return str('bge')
  la a0, str_101
  ret
.L6:
  ; basic/monitor.e16.ts:364  return str('bltu')
  la a0, str_102
  ret
.L7:
  ; basic/monitor.e16.ts:366  return str('bgeu')
  la a0, str_103
  ret
.L8:
  ; basic/monitor.e16.ts:368  return 0
  li a0, 0
.return:
  ret

; basic/monitor.e16.ts:372 csrName(f3) at -O1
;   f3 in a0
csrName:
  ; basic/monitor.e16.ts:373  switch (f3) {
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
  ; basic/monitor.e16.ts:375  return str('csrrw')
  la a0, str_104
  ret
.L3:
  ; basic/monitor.e16.ts:377  return str('csrrs')
  la a0, str_105
  ret
.L4:
  ; basic/monitor.e16.ts:379  return str('csrrc')
  la a0, str_106
  ret
.L5:
  ; basic/monitor.e16.ts:381  return str('csrrwi')
  la a0, str_107
  ret
.L6:
  ; basic/monitor.e16.ts:383  return str('csrrsi')
  la a0, str_108
  ret
.L7:
  ; basic/monitor.e16.ts:385  return str('csrrci')
  la a0, str_109
  ret
.L8:
  ; basic/monitor.e16.ts:387  return 0
  li a0, 0
.return:
  ret

; basic/monitor.e16.ts:391 sysName(kind) at -O1
;   kind in a0
sysName:
  ; basic/monitor.e16.ts:392  if (kind === 0) return str('ecall')
  bne a0, zero, .L1
  ; basic/monitor.e16.ts:392  return str('ecall')
  la a0, str_110
  ret
.L1:
  ; basic/monitor.e16.ts:393  if (kind === 1) return str('ebreak')
  li t0, 1
  bne a0, t0, .L2
  ; basic/monitor.e16.ts:393  return str('ebreak')
  la a0, str_111
  ret
.L2:
  ; basic/monitor.e16.ts:394  if (kind === 2) return str('mret')
  li t0, 2
  bne a0, t0, .L3
  ; basic/monitor.e16.ts:394  return str('mret')
  la a0, str_112
  ret
.L3:
  ; basic/monitor.e16.ts:395  if (kind === 3) return str('wfi')
  li t0, 3
  bne a0, t0, .L4
  ; basic/monitor.e16.ts:395  return str('wfi')
  la a0, str_113
  ret
.L4:
  ; basic/monitor.e16.ts:396  return 0
  li a0, 0
.return:
  ret

; basic/monitor.e16.ts:399 system(f3, rd, rs1, imm14) at -O1
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
  ; basic/monitor.e16.ts:400  if (f3 === 0) {
  bne s1, zero, .L1
  ; basic/monitor.e16.ts:402  if (rd !== 0 || rs1 !== 0) illegal()
  bne s3, zero, .L3
  lw t0, 0(fp) ; rs1
  beq t0, zero, .L2
.L3:
  ; basic/monitor.e16.ts:402  illegal()
  ; basic/monitor.e16.ts:180  poke16(D_FORMAT, F_ILLEGAL)
  sw zero, 134(zero)
  j .L5
.L2:
  ; basic/monitor.e16.ts:403  decoded(sysName(imm14), F_NONE, 0, 0)
  mv a0, s2
  call sysName
  li a1, 11
  li a2, 0
  li a3, 0
  call decoded
  j .L5
.L1:
  ; basic/monitor.e16.ts:404  if (imm14 > 0xfff) {
  li t0, 4095
  bgeu t0, s2, .L6
  ; basic/monitor.e16.ts:405  illegal()
  ; basic/monitor.e16.ts:180  poke16(D_FORMAT, F_ILLEGAL)
  sw zero, 134(zero)
  j .L7
.L6:
  ; basic/monitor.e16.ts:407  decoded(csrName(f3), f3 >= 5 ? F_CSRI : F_CSR, rd, rs1)
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
  ; basic/monitor.e16.ts:408  setImm(i16(imm14))
  sw s2, 2(fp) ; setImm.v
  ; basic/monitor.e16.ts:184  poke16(D_IMM, u16(v))
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

; basic/monitor.e16.ts:413 upperForm(major, rd, lo, hi) at -O1
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
  ; basic/monitor.e16.ts:414  const field = wrap16((lo >> 11) | (hi << 5))
  lw t0, 2(fp) ; lo
  srli t0, t0, 11
  slli t1, s3, 5
  or t0, t0, t1
  sw t0, 0(fp) ; field
  ; basic/monitor.e16.ts:415  if (hi >> 11 !== 0) {
  srli t0, s3, 11
  beq t0, zero, .L1
  ; basic/monitor.e16.ts:416  illegal()
  ; basic/monitor.e16.ts:180  poke16(D_FORMAT, F_ILLEGAL)
  sw zero, 134(zero)
  j .L2
.L1:
  ; basic/monitor.e16.ts:417  if (major === 5) {
  li t0, 5
  bne s1, t0, .L3
  ; basic/monitor.e16.ts:418  decoded(str('jal'), F_J, rd, 0)
  la a0, str_114
  li a1, 7
  mv a2, s2
  li a3, 0
  call decoded
  ; basic/monitor.e16.ts:419  setImm(i16(wrap16(field << 1)))
  lw t0, 0(fp) ; field
  slli t0, t0, 1
  sw t0, 4(fp) ; setImm.v
  ; basic/monitor.e16.ts:184  poke16(D_IMM, u16(v))
  lw t0, 4(fp) ; setImm.v
  sw t0, 142(zero)
  j .L4
.L3:
  ; basic/monitor.e16.ts:421  decoded(major === 7 ? str('li') : str('auipc'), F_U, rd, 0)
  li t0, 7
  bne s1, t0, .L5
  la t0, str_115
  j .L6
.L5:
  la t0, str_116
.L6:
  mv a0, t0
  li a1, 8
  mv a2, s2
  li a3, 0
  call decoded
  ; basic/monitor.e16.ts:422  setImm(i16(field))
  lw t0, 0(fp) ; field
  sw t0, 6(fp) ; setImm.v
  ; basic/monitor.e16.ts:184  poke16(D_IMM, u16(v))
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

; basic/monitor.e16.ts:426 decode32(lo, hi) at -O1
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
  ; basic/monitor.e16.ts:427  poke16(D_SIZE, 4)
  li t0, 4
  sw t0, 144(zero)
  ; basic/monitor.e16.ts:428  const major = (lo >> 2) & 31
  lw t0, 2(fp) ; lo
  srli t0, t0, 2
  andi s1, t0, 31
  ; basic/monitor.e16.ts:429  const rd = (lo >> 7) & 15
  lw t0, 2(fp) ; lo
  srli t0, t0, 7
  andi s2, t0, 15
  ; basic/monitor.e16.ts:430  const f3 = (lo >> 11) & 7
  lw t0, 2(fp) ; lo
  srli t0, t0, 11
  andi s3, t0, 7
  ; basic/monitor.e16.ts:431  const rs1 = ((lo >> 14) | (hi << 2)) & 15
  lw t0, 2(fp) ; lo
  srli t0, t0, 14
  lw t1, 4(fp) ; hi
  slli t1, t1, 2
  or t0, t0, t1
  andi t0, t0, 15
  sw t0, 0(fp) ; rs1
  ; basic/monitor.e16.ts:432  const f10 = (hi >> 6) & 0x3ff
  lw t0, 4(fp) ; hi
  srli t0, t0, 6
  andi t0, t0, 1023
  sw t0, 6(fp) ; f10
  ; basic/monitor.e16.ts:433  const imm14 = (hi >> 2) & 0x3fff
  lw t0, 4(fp) ; hi
  srli t0, t0, 2
  li t1, 16383
  and t0, t0, t1
  sw t0, 8(fp) ; imm14
  ; basic/monitor.e16.ts:434  setRs2((hi >> 2) & 15)
  lw t0, 4(fp) ; hi
  srli t0, t0, 2
  andi t0, t0, 15
  sw t0, 10(fp) ; setRs2.r
  ; basic/monitor.e16.ts:188  poke16(D_RS2, r)
  lw t0, 10(fp) ; setRs2.r
  sw t0, 140(zero)
  ; basic/monitor.e16.ts:435  if (major === 3) {
  li t0, 3
  bne s1, t0, .L1
  ; basic/monitor.e16.ts:436  decoded(rName((f10 << 3) | f3), F_R, rd, rs1)
  lw t0, 6(fp) ; f10
  slli t0, t0, 3
  or a0, t0, s3
  call rName
  li a1, 1
  mv a2, s2
  lw a3, 0(fp)
  call decoded
  j .L2
.L1:
  ; basic/monitor.e16.ts:437  if (major === 2) {
  li t0, 2
  bne s1, t0, .L3
  ; basic/monitor.e16.ts:438  opImm(f3, rd, rs1, imm14)
  mv a0, s3
  mv a1, s2
  lw a2, 0(fp)
  lw a3, 8(fp)
  call opImm
  j .L4
.L3:
  ; basic/monitor.e16.ts:439  if (major === 0 || major === 6) {
  beq s1, zero, .L6
  li t0, 6
  bne s1, t0, .L5
.L6:
  ; basic/monitor.e16.ts:440  decoded(loadOrJalr(major, f3), F_MEM, rd, rs1)
  mv a0, s1
  mv a1, s3
  call loadOrJalr
  li a1, 3
  mv a2, s2
  lw a3, 0(fp)
  call decoded
  ; basic/monitor.e16.ts:441  setImm(i16(wrap16(imm14 << 2)) >> 2)
  lw t0, 8(fp) ; imm14
  slli t0, t0, 2
  srai t0, t0, 2
  sw t0, 12(fp) ; setImm.v
  ; basic/monitor.e16.ts:184  poke16(D_IMM, u16(v))
  lw t0, 12(fp) ; setImm.v
  sw t0, 142(zero)
  j .L7
.L5:
  ; basic/monitor.e16.ts:442  if (major === 1) {
  li t0, 1
  bne s1, t0, .L8
  ; basic/monitor.e16.ts:443  decoded(f3 === 0 ? str('sb') : f3 === 1 ? str('sw') : 0, F_S, 0, rs1)
  bne s3, zero, .L9
  la t0, str_117
  j .L10
.L9:
  li t0, 1
  bne s3, t0, .L11
  la t0, str_118
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
  ; basic/monitor.e16.ts:444  setImm(i16(wrap16(((f10 << 4) | rd) << 2)) >> 2)
  lw t0, 6(fp) ; f10
  slli t0, t0, 4
  or t0, t0, s2
  slli t0, t0, 2
  srai t0, t0, 2
  sw t0, 14(fp) ; setImm.v
  ; basic/monitor.e16.ts:184  poke16(D_IMM, u16(v))
  lw t0, 14(fp) ; setImm.v
  sw t0, 142(zero)
  j .L13
.L8:
  ; basic/monitor.e16.ts:445  if (major === 4) {
  li t0, 4
  bne s1, t0, .L14
  ; basic/monitor.e16.ts:446  decoded(branchName(f3), F_B, 0, rs1)
  mv a0, s3
  call branchName
  li a1, 6
  li a2, 0
  lw a3, 0(fp)
  call decoded
  ; basic/monitor.e16.ts:447  setImm(i16(wrap16(((f10 << 5) | (rd << 1)) << 1)) >> 1)
  lw t0, 6(fp) ; f10
  slli t0, t0, 5
  slli t1, s2, 1
  or t0, t0, t1
  slli t0, t0, 1
  srai t0, t0, 1
  sw t0, 16(fp) ; setImm.v
  ; basic/monitor.e16.ts:184  poke16(D_IMM, u16(v))
  lw t0, 16(fp) ; setImm.v
  sw t0, 142(zero)
  j .L15
.L14:
  ; basic/monitor.e16.ts:448  if (major === 5 || major === 7 || major === 8) {
  li t0, 5
  beq s1, t0, .L17
  li t0, 7
  beq s1, t0, .L17
  li t0, 8
  bne s1, t0, .L16
.L17:
  ; basic/monitor.e16.ts:449  upperForm(major, rd, lo, hi)
  mv a0, s1
  mv a1, s2
  lw a2, 2(fp)
  lw a3, 4(fp)
  call upperForm
  j .L18
.L16:
  ; basic/monitor.e16.ts:450  if (major === 9) {
  li t0, 9
  bne s1, t0, .L19
  ; basic/monitor.e16.ts:451  system(f3, rd, rs1, imm14)
  mv a0, s3
  mv a1, s2
  lw a2, 0(fp)
  lw a3, 8(fp)
  call system
  j .L20
.L19:
  ; basic/monitor.e16.ts:453  illegal()
  ; basic/monitor.e16.ts:180  poke16(D_FORMAT, F_ILLEGAL)
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

; basic/monitor.e16.ts:460 quadrant0(h) at -O1
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
  ; basic/monitor.e16.ts:461  const f3 = h >> 13
  srli s3, s1, 13
  ; basic/monitor.e16.ts:462  const r9 = (h >> 9) & 15
  srli t0, s1, 9
  andi t0, t0, 15
  sw t0, 0(fp) ; r9
  ; basic/monitor.e16.ts:463  if (f3 <= 1) {
  li t0, 1
  bltu t0, s3, .L1
  ; basic/monitor.e16.ts:464  const reg = (h >> 7) & 15
  srli t0, s1, 7
  andi s2, t0, 15
  ; basic/monitor.e16.ts:465  setImm(i16(((((h >> 11) & 3) << 1) | ((h >> 2) & 1)) << 1))
  srli t0, s1, 11
  andi t0, t0, 3
  slli t0, t0, 1
  srli t1, s1, 2
  andi t1, t1, 1
  or t0, t0, t1
  slli t0, t0, 1
  sw t0, 2(fp) ; setImm.v
  ; basic/monitor.e16.ts:184  poke16(D_IMM, u16(v))
  lw t0, 2(fp) ; setImm.v
  sw t0, 142(zero)
  ; basic/monitor.e16.ts:466  if (f3 === 1) {
  li t0, 1
  bne s3, t0, .L2
  ; basic/monitor.e16.ts:467  decoded(str('c.sw'), F_S, 0, (h >> 3) & 15)
  srli t0, s1, 3
  andi t0, t0, 15
  la a0, str_119
  li a1, 5
  li a2, 0
  mv a3, t0
  call decoded
  ; basic/monitor.e16.ts:468  setRs2(reg)
  sw s2, 4(fp) ; setRs2.r
  ; basic/monitor.e16.ts:188  poke16(D_RS2, r)
  lw t0, 4(fp) ; setRs2.r
  sw t0, 140(zero)
  j .L3
.L2:
  ; basic/monitor.e16.ts:470  decoded(reg === 0 ? 0 : str('c.lw'), F_MEM, reg, (h >> 3) & 15)
  bne s2, zero, .L4
  li t0, 0
  j .L5
.L4:
  la t0, str_120
.L5:
  srli t1, s1, 3
  andi t1, t1, 15
  mv a0, t0
  li a1, 3
  mv a2, s2
  mv a3, t1
  call decoded
.L3:
  ; basic/monitor.e16.ts:472  return
  j .return
.L1:
  ; basic/monitor.e16.ts:474  const off7 = ((h >> 2) & 0x7f) << 1
  srli t0, s1, 2
  andi t0, t0, 127
  slli s2, t0, 1
  ; basic/monitor.e16.ts:475  setImm(i16(off7))
  sw s2, 6(fp) ; setImm.v
  ; basic/monitor.e16.ts:184  poke16(D_IMM, u16(v))
  lw t0, 6(fp) ; setImm.v
  sw t0, 142(zero)
  ; basic/monitor.e16.ts:476  if (f3 === 2) {
  li t0, 2
  bne s3, t0, .L6
  ; basic/monitor.e16.ts:477  decoded(r9 === 0 ? 0 : str('c.lwsp'), F_C_LWSP, r9, 2)
  lw t0, 0(fp) ; r9
  bne t0, zero, .L7
  li t0, 0
  j .L8
.L7:
  la t0, str_121
.L8:
  mv a0, t0
  li a1, 14
  lw a2, 0(fp)
  li a3, 2
  call decoded
  j .L9
.L6:
  ; basic/monitor.e16.ts:478  if (f3 === 3) {
  li t0, 3
  bne s3, t0, .L10
  ; basic/monitor.e16.ts:479  decoded(str('c.swsp'), F_C_SWSP, 0, 2)
  la a0, str_122
  li a1, 15
  li a2, 0
  li a3, 2
  call decoded
  ; basic/monitor.e16.ts:480  setRs2(r9)
  lw t0, 0(fp) ; r9
  sw t0, 8(fp) ; setRs2.r
  ; basic/monitor.e16.ts:188  poke16(D_RS2, r)
  lw t0, 8(fp) ; setRs2.r
  sw t0, 140(zero)
  j .L11
.L10:
  ; basic/monitor.e16.ts:481  if (f3 === 4 && off7 !== 0 && r9 !== 0) {
  li t0, 4
  bne s3, t0, .L12
  beq s2, zero, .L12
  lw t0, 0(fp) ; r9
  beq t0, zero, .L12
  ; basic/monitor.e16.ts:482  decoded(str('c.addi2spn'), F_C_RI, r9, 2)
  la a0, str_123
  li a1, 12
  lw a2, 0(fp)
  li a3, 2
  call decoded
  j .L13
.L12:
  ; basic/monitor.e16.ts:484  illegal()
  ; basic/monitor.e16.ts:180  poke16(D_FORMAT, F_ILLEGAL)
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

; basic/monitor.e16.ts:489 shiftC(name, r, amount) at -O1
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
  ; basic/monitor.e16.ts:490  if (amount > 15 || amount === 0 || r === 0) {
  li t0, 15
  bltu t0, s2, .L2
  beq s2, zero, .L2
  bne s1, zero, .L1
.L2:
  ; basic/monitor.e16.ts:491  illegal()
  ; basic/monitor.e16.ts:180  poke16(D_FORMAT, F_ILLEGAL)
  sw zero, 134(zero)
  j .L3
.L1:
  ; basic/monitor.e16.ts:493  decoded(name, F_C_RI, r, r)
  mv a0, s3
  li a1, 12
  mv a2, s1
  mv a3, s1
  call decoded
  ; basic/monitor.e16.ts:494  setImm(i16(amount))
  mv s0, s2 ; setImm.v
  ; basic/monitor.e16.ts:184  poke16(D_IMM, u16(v))
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

; basic/monitor.e16.ts:499 quadrant1(h) at -O1
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
  ; basic/monitor.e16.ts:500  const f3 = h >> 13
  srli t0, s3, 13
  sw t0, 4(fp) ; f3
  ; basic/monitor.e16.ts:501  const r = (h >> 9) & 15
  srli t0, s3, 9
  andi s1, t0, 15
  ; basic/monitor.e16.ts:502  const raw6 = (h >> 3) & 63
  srli t0, s3, 3
  andi t0, t0, 63
  sw t0, 0(fp) ; raw6
  ; basic/monitor.e16.ts:503  const imm6 = i16(wrap16(raw6 << 10)) >> 10
  lw t0, 0(fp) ; raw6
  slli t0, t0, 10
  srai t0, t0, 10
  sw t0, 2(fp) ; imm6
  ; basic/monitor.e16.ts:504  setImm(imm6)
  lw t0, 2(fp) ; imm6
  sw t0, 6(fp) ; setImm.v
  ; basic/monitor.e16.ts:184  poke16(D_IMM, u16(v))
  lw t0, 6(fp) ; setImm.v
  sw t0, 142(zero)
  ; basic/monitor.e16.ts:505  switch ((f3 << 1) | ((h >> 2) & 1)) {
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
  ; basic/monitor.e16.ts:507  if (r === 0) decoded(imm6 === 0 ? str('c.nop') : 0, F_NONE, 0, 0)
  bne s1, zero, .L9
  ; basic/monitor.e16.ts:507  decoded(imm6 === 0 ? str('c.nop') : 0, F_NONE, 0, 0)
  lw t0, 2(fp) ; imm6
  bne t0, zero, .L10
  la t0, str_124
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
  ; basic/monitor.e16.ts:508  decoded(imm6 === 0 ? 0 : str('c.addi'), F_C_RI, r, r)
  lw t0, 2(fp) ; imm6
  bne t0, zero, .L13
  li t0, 0
  j .L14
.L13:
  la t0, str_125
.L14:
  mv a0, t0
  li a1, 12
  mv a2, s1
  mv a3, s1
  call decoded
  ; basic/monitor.e16.ts:509  break
  j .L1
.L3:
  ; basic/monitor.e16.ts:511  decoded(r === 0 ? 0 : str('c.li'), F_C_RI, r, 0)
  bne s1, zero, .L15
  li t0, 0
  j .L16
.L15:
  la t0, str_126
.L16:
  mv a0, t0
  li a1, 12
  mv a2, s1
  li a3, 0
  call decoded
  ; basic/monitor.e16.ts:512  break
  j .L1
.L4:
  ; basic/monitor.e16.ts:514  shiftC(str('c.slli'), r, raw6)
  la a0, str_127
  mv a1, s1
  lw a2, 0(fp)
  call shiftC
  ; basic/monitor.e16.ts:515  break
  j .L1
.L5:
  ; basic/monitor.e16.ts:517  shiftC(str('c.srli'), r, raw6)
  la a0, str_128
  mv a1, s1
  lw a2, 0(fp)
  call shiftC
  ; basic/monitor.e16.ts:518  break
  j .L1
.L6:
  ; basic/monitor.e16.ts:520  shiftC(str('c.srai'), r, raw6)
  la a0, str_129
  mv a1, s1
  lw a2, 0(fp)
  call shiftC
  ; basic/monitor.e16.ts:521  break
  j .L1
.L7:
  ; basic/monitor.e16.ts:524  decoded(r === 0 || imm6 === -1 ? 0 : str('c.andi'), F_C_RI, r, r)
  beq s1, zero, .L19
  li t0, 65535
  lw t1, 2(fp) ; imm6
  bne t1, t0, .L17
.L19:
  li t0, 0
  j .L18
.L17:
  la t0, str_130
.L18:
  mv a0, t0
  li a1, 12
  mv a2, s1
  mv a3, s1
  call decoded
  ; basic/monitor.e16.ts:525  break
  j .L1
.L8:
  ; basic/monitor.e16.ts:527  jumpsC(h, f3, r)
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

; basic/monitor.e16.ts:531 jumpsC(h, f3, r) at -O1
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
  ; basic/monitor.e16.ts:532  if (f3 === 3 || f3 === 4) {
  li t0, 3
  beq s1, t0, .L2
  li t0, 4
  bne s1, t0, .L1
.L2:
  ; basic/monitor.e16.ts:533  decoded(f3 === 3 ? str('c.beqz') : str('c.bnez'), F_C_B, 0, r)
  li t0, 3
  bne s1, t0, .L3
  la t0, str_131
  j .L4
.L3:
  la t0, str_132
.L4:
  mv a0, t0
  li a1, 16
  li a2, 0
  mv a3, s3
  call decoded
  ; basic/monitor.e16.ts:534  setImm(i16(wrap16(((h >> 2) & 0x7f) << 9)) >> 8)
  srli t0, s2, 2
  andi t0, t0, 127
  slli t0, t0, 9
  srai t0, t0, 8
  sw t0, 0(fp) ; setImm.v
  ; basic/monitor.e16.ts:184  poke16(D_IMM, u16(v))
  lw t0, 0(fp) ; setImm.v
  sw t0, 142(zero)
  j .L5
.L1:
  ; basic/monitor.e16.ts:535  if (f3 === 5 || f3 === 6) {
  li t0, 5
  beq s1, t0, .L7
  li t0, 6
  bne s1, t0, .L6
.L7:
  ; basic/monitor.e16.ts:536  decoded(f3 === 5 ? str('c.j') : str('c.jal'), F_C_J, 0, 0)
  li t0, 5
  bne s1, t0, .L8
  la t0, str_133
  j .L9
.L8:
  la t0, str_134
.L9:
  mv a0, t0
  li a1, 17
  li a2, 0
  li a3, 0
  call decoded
  ; basic/monitor.e16.ts:537  setImm(i16(wrap16(((h >> 2) & 0x7ff) << 5)) >> 4)
  srli t0, s2, 2
  andi t0, t0, 2047
  slli t0, t0, 5
  srai t0, t0, 4
  sw t0, 2(fp) ; setImm.v
  ; basic/monitor.e16.ts:184  poke16(D_IMM, u16(v))
  lw t0, 2(fp) ; setImm.v
  sw t0, 142(zero)
  j .L10
.L6:
  ; basic/monitor.e16.ts:539  illegal()
  ; basic/monitor.e16.ts:180  poke16(D_FORMAT, F_ILLEGAL)
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

; basic/monitor.e16.ts:543 pairName(form) at -O1
;   form in a0
pairName:
  ; basic/monitor.e16.ts:544  switch (form) {
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
  ; basic/monitor.e16.ts:546  return str('c.mv')
  la a0, str_135
  ret
.L3:
  ; basic/monitor.e16.ts:548  return str('c.add')
  la a0, str_136
  ret
.L4:
  ; basic/monitor.e16.ts:550  return str('c.sub')
  la a0, str_137
  ret
.L5:
  ; basic/monitor.e16.ts:552  return str('c.xor')
  la a0, str_138
  ret
.L6:
  ; basic/monitor.e16.ts:554  return str('c.and')
  la a0, str_139
  ret
.L7:
  ; basic/monitor.e16.ts:556  return str('c.or')
  la a0, str_140
.return:
  ret

; basic/monitor.e16.ts:561 quadrant2(h) at -O1
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
  ; basic/monitor.e16.ts:562  const rd = (h >> 8) & 15
  srli t0, s3, 8
  andi s1, t0, 15
  ; basic/monitor.e16.ts:563  const rs2 = (h >> 4) & 15
  srli t0, s3, 4
  andi t0, t0, 15
  sw t0, 0(fp) ; rs2
  ; basic/monitor.e16.ts:564  const form = ((h >> 12) << 2) | ((h >> 2) & 3)
  srli t0, s3, 12
  slli t0, t0, 2
  srli t1, s3, 2
  andi t1, t1, 3
  or s2, t0, t1
  ; basic/monitor.e16.ts:565  setRs2(rs2)
  lw t0, 0(fp) ; rs2
  sw t0, 4(fp) ; setRs2.r
  ; basic/monitor.e16.ts:188  poke16(D_RS2, r)
  lw t0, 4(fp) ; setRs2.r
  sw t0, 140(zero)
  ; basic/monitor.e16.ts:566  if (form === 8 || form === 9) {
  li t0, 8
  beq s2, t0, .L2
  li t0, 9
  bne s2, t0, .L1
.L2:
  ; basic/monitor.e16.ts:567  const ok = rd !== 0 && rs2 === 0
  sub t0, s1, zero
  snez t0, t0
  mv t1, t0
  beqz t1, .L3
  lw t0, 0(fp) ; rs2
  sub t0, t0, zero
  seqz t0, t0
.L3:
  sw t0, 2(fp) ; ok
  ; basic/monitor.e16.ts:568  decoded(!ok ? 0 : form === 8 ? str('c.jr') : str('c.jalr'), F_C_R, 0, rd)
  lw t0, 2(fp) ; ok
  bnez t0, .L4
  li t0, 0
  j .L5
.L4:
  li t0, 8
  bne s2, t0, .L6
  la t0, str_141
  j .L7
.L6:
  la t0, str_142
.L7:
.L5:
  mv a0, t0
  li a1, 18
  li a2, 0
  mv a3, s1
  call decoded
  j .L8
.L1:
  ; basic/monitor.e16.ts:569  if (form === 10) {
  li t0, 10
  bne s2, t0, .L9
  ; basic/monitor.e16.ts:570  decoded(rd !== 0 || rs2 !== 0 ? 0 : str('c.ebreak'), F_NONE, 0, 0)
  bne s1, zero, .L12
  lw t0, 0(fp) ; rs2
  beq t0, zero, .L10
.L12:
  li t0, 0
  j .L11
.L10:
  la t0, str_143
.L11:
  mv a0, t0
  li a1, 11
  li a2, 0
  li a3, 0
  call decoded
  j .L13
.L9:
  ; basic/monitor.e16.ts:572  decoded(pairChanges(form, rd, rs2) ? pairName(form) : 0, F_C_RR, rd, rd)
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

; basic/monitor.e16.ts:580 pairChanges(form, rd, rs2) at -O1
;   form in a0
;   rd in a1
;   rs2 in a2
pairChanges:
  ; basic/monitor.e16.ts:581  if (form > 5 || rd === 0) return false
  li t0, 5
  bltu t0, a0, .L2
  bne a1, zero, .L1
.L2:
  ; basic/monitor.e16.ts:581  return false
  li a0, 0
  ret
.L1:
  ; basic/monitor.e16.ts:582  if (form === 0) return rd !== rs2
  bne a0, zero, .L3
  ; basic/monitor.e16.ts:582  return rd !== rs2
  sub t0, a1, a2
  snez a0, t0
  ret
.L3:
  ; basic/monitor.e16.ts:583  return form === 4 || rs2 !== 0
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

; basic/monitor.e16.ts:586 decode16(h) at -O1
;   h in s1
;   q in s2
decode16:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; h
  ; basic/monitor.e16.ts:587  poke16(D_SIZE, 2)
  li t0, 2
  sw t0, 144(zero)
  ; basic/monitor.e16.ts:588  const q = h & 3
  andi s2, s1, 3
  ; basic/monitor.e16.ts:589  if (q === 0) quadrant0(h)
  bne s2, zero, .L1
  ; basic/monitor.e16.ts:589  quadrant0(h)
  mv a0, s1
  call quadrant0
  j .L2
.L1:
  ; basic/monitor.e16.ts:590  if (q === 1) quadrant1(h)
  li t0, 1
  bne s2, t0, .L3
  ; basic/monitor.e16.ts:590  quadrant1(h)
  mv a0, s1
  call quadrant1
  j .L4
.L3:
  ; basic/monitor.e16.ts:591  quadrant2(h)
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

; basic/monitor.e16.ts:597 emitOffset() at -O1
emitOffset:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/monitor.e16.ts:598  emitNumber(imm())
  call imm
  call emitNumber
  ; basic/monitor.e16.ts:599  emit(0x28)
  li a0, 40
  call emit
  ; basic/monitor.e16.ts:600  emitReg(peek16(D_RS1))
  lw a0, 138(zero)
  call emitReg
  ; basic/monitor.e16.ts:601  emit(0x29)
  li a0, 41
  call emit
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/monitor.e16.ts:605 emitFirst(format, target) at -O1
;   format in s1
;   target in s2
emitFirst:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; format
  mv s2, a1 ; target
  ; basic/monitor.e16.ts:606  if (format === F_S || format === F_C_SWSP) emitReg(peek16(D_RS2))
  li t0, 5
  beq s1, t0, .L2
  li t0, 15
  bne s1, t0, .L1
.L2:
  ; basic/monitor.e16.ts:606  emitReg(peek16(D_RS2))
  lw a0, 140(zero)
  call emitReg
  j .L3
.L1:
  ; basic/monitor.e16.ts:607  if (format === F_B || format === F_C_B || format === F_C_R) emitReg(peek16(D_RS1))
  li t0, 6
  beq s1, t0, .L5
  li t0, 16
  beq s1, t0, .L5
  li t0, 18
  bne s1, t0, .L4
.L5:
  ; basic/monitor.e16.ts:607  emitReg(peek16(D_RS1))
  lw a0, 138(zero)
  call emitReg
  j .L6
.L4:
  ; basic/monitor.e16.ts:608  if (format === F_C_J) emitHex(target)
  li t0, 17
  bne s1, t0, .L7
  ; basic/monitor.e16.ts:608  emitHex(target)
  mv a0, s2
  call emitHex
  j .L8
.L7:
  ; basic/monitor.e16.ts:609  emitReg(peek16(D_RD))
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

; basic/monitor.e16.ts:613 emitRest(format, target) at -O1
;   format in s1
;   target in s2
emitRest:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; format
  mv s2, a1 ; target
  ; basic/monitor.e16.ts:614  switch (format) {
  li t0, 1
  beq s1, t0, .L2
  li t0, 2
  beq s1, t0, .L3
  li t0, 3
  beq s1, t0, .L4
  li t0, 5
  beq s1, t0, .L5
  li t0, 4
  beq s1, t0, .L6
  li t0, 6
  beq s1, t0, .L7
  li t0, 7
  beq s1, t0, .L8
  li t0, 16
  beq s1, t0, .L9
  li t0, 8
  beq s1, t0, .L10
  li t0, 13
  beq s1, t0, .L11
  j .L12
.L2:
  ; basic/monitor.e16.ts:616  emitReg(peek16(D_RS1))
  lw a0, 138(zero)
  call emitReg
  ; basic/monitor.e16.ts:617  comma()
  call comma
  ; basic/monitor.e16.ts:618  emitReg(peek16(D_RS2))
  lw a0, 140(zero)
  call emitReg
  ; basic/monitor.e16.ts:619  break
  j .L1
.L3:
  ; basic/monitor.e16.ts:621  emitReg(peek16(D_RS1))
  lw a0, 138(zero)
  call emitReg
  ; basic/monitor.e16.ts:622  comma()
  call comma
  ; basic/monitor.e16.ts:623  emitNumber(imm())
  call imm
  call emitNumber
  ; basic/monitor.e16.ts:624  break
  j .L1
.L4:
.L5:
  ; basic/monitor.e16.ts:627  emitOffset()
  call emitOffset
  ; basic/monitor.e16.ts:628  break
  j .L1
.L6:
  ; basic/monitor.e16.ts:630  emitReg(peek16(D_RS1))
  lw a0, 138(zero)
  call emitReg
  ; basic/monitor.e16.ts:631  break
  j .L1
.L7:
  ; basic/monitor.e16.ts:633  emitReg(peek16(D_RS2))
  lw a0, 140(zero)
  call emitReg
  ; basic/monitor.e16.ts:634  comma()
  call comma
  ; basic/monitor.e16.ts:635  emitHex(target)
  mv a0, s2
  call emitHex
  ; basic/monitor.e16.ts:636  break
  j .L1
.L8:
.L9:
  ; basic/monitor.e16.ts:639  emitHex(target)
  mv a0, s2
  call emitHex
  ; basic/monitor.e16.ts:640  break
  j .L1
.L10:
  ; basic/monitor.e16.ts:642  emitHex(peek16(D_IMM))
  lw a0, 142(zero)
  call emitHex
  ; basic/monitor.e16.ts:643  break
  j .L1
.L11:
  ; basic/monitor.e16.ts:645  emitReg(peek16(D_RS2))
  lw a0, 140(zero)
  call emitReg
  ; basic/monitor.e16.ts:646  break
  j .L1
.L12:
  ; basic/monitor.e16.ts:648  emitLast(format)
  mv a0, s1
  call emitLast
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/monitor.e16.ts:652 emitLast(format) at -O1
;   format in s1
emitLast:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; format
  ; basic/monitor.e16.ts:653  if (format === F_CSR || format === F_CSRI) {
  li t0, 9
  beq s1, t0, .L2
  li t0, 10
  bne s1, t0, .L1
.L2:
  ; basic/monitor.e16.ts:654  emitCsr(peek16(D_IMM))
  lw a0, 142(zero)
  call emitCsr
  ; basic/monitor.e16.ts:655  comma()
  call comma
  ; basic/monitor.e16.ts:656  if (format === F_CSR) emitReg(peek16(D_RS1))
  li t0, 9
  bne s1, t0, .L3
  ; basic/monitor.e16.ts:656  emitReg(peek16(D_RS1))
  lw a0, 138(zero)
  call emitReg
  j .L5
.L3:
  ; basic/monitor.e16.ts:657  emitUnsigned(peek16(D_RS1))
  lw a0, 138(zero)
  call emitUnsigned
  j .L5
.L1:
  ; basic/monitor.e16.ts:660  emitNumber(imm())
  call imm
  call emitNumber
.L5:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/monitor.e16.ts:668 disasmInto(at, out) at -O1
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
  ; basic/monitor.e16.ts:669  poke16(OUT_AT, out)
  lw t0, 2(fp) ; out
  sw t0, 130(zero)
  ; basic/monitor.e16.ts:670  const lo = peek(at) | (peek(at + 1) << 8)
  lbu t0, 0(s2)
  lbu t1, 1(s2)
  slli t1, t1, 8
  or s3, t0, t1
  ; basic/monitor.e16.ts:671  if ((lo & 3) === 3) decode32(lo, peek(at + 2) | (peek(at + 3) << 8))
  andi t0, s3, 3
  li t1, 3
  bne t0, t1, .L1
  ; basic/monitor.e16.ts:671  decode32(lo, peek(at + 2) | (peek(at + 3) << 8))
  lbu t0, 2(s2)
  lbu t1, 3(s2)
  slli t1, t1, 8
  or t0, t0, t1
  mv a0, s3
  mv a1, t0
  call decode32
  j .L2
.L1:
  ; basic/monitor.e16.ts:672  decode16(lo)
  mv a0, s3
  call decode16
.L2:
  ; basic/monitor.e16.ts:673  const format = peek16(D_FORMAT)
  lw s1, 134(zero)
  ; basic/monitor.e16.ts:674  if (format === F_ILLEGAL) {
  bne s1, zero, .L3
  ; basic/monitor.e16.ts:675  emitStr(peek16(D_SIZE) === 2 ? str('.word ?') : str('.word ?, ?'))
  lw t0, 144(zero)
  li t1, 2
  bne t0, t1, .L4
  la t0, str_144
  j .L5
.L4:
  la t0, str_145
.L5:
  mv a0, t0
  call emitStr
  j .L6
.L3:
  ; basic/monitor.e16.ts:677  emitStr(peek16(D_NAME))
  lw a0, 132(zero)
  call emitStr
  ; basic/monitor.e16.ts:678  if (format !== F_NONE) {
  li t0, 11
  beq s1, t0, .L7
  ; basic/monitor.e16.ts:679  const target = u16(at + peek16(D_IMM))
  lw t0, 142(zero)
  add t0, s2, t0
  sw t0, 0(fp) ; target
  ; basic/monitor.e16.ts:680  emit(0x20)
  li a0, 32
  call emit
  ; basic/monitor.e16.ts:681  emitFirst(format, target)
  mv a0, s1
  lw a1, 0(fp)
  call emitFirst
  ; basic/monitor.e16.ts:683  if (format !== F_C_J && format !== F_C_R) {
  li t0, 17
  beq s1, t0, .L8
  li t0, 18
  beq s1, t0, .L8
  ; basic/monitor.e16.ts:684  comma()
  call comma
  ; basic/monitor.e16.ts:685  emitRest(format, target)
  mv a0, s1
  lw a1, 0(fp)
  call emitRest
.L8:
.L7:
.L6:
  ; basic/monitor.e16.ts:689  emit(0)
  li a0, 0
  call emit
  ; basic/monitor.e16.ts:690  return peek16(D_SIZE)
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

; basic/monitor.e16.ts:696 unassemble(from, given) at -O1
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
  ; basic/monitor.e16.ts:697  let at = given ? from : peek16(U_NEXT)
  beqz s0, .L1
  mv t0, s3
  j .L2
.L1:
  lw t0, 146(zero)
.L2:
  mv s1, t0 ; at
  ; basic/monitor.e16.ts:698  for (let k: u16 = 1; k < peek16(ROWS); k++) {
  li s2, 1 ; k
  j .L5
.L3:
  ; basic/monitor.e16.ts:699  poke16(OUT_AT, LINEBUF)
  li t0, 64
  sw t0, 130(zero)
  ; basic/monitor.e16.ts:700  emitHex4(at)
  mv a0, s1
  call emitHex4
  ; basic/monitor.e16.ts:701  emit(0x20)
  li a0, 32
  call emit
  ; basic/monitor.e16.ts:702  at = u16(at + disasmInto(at, peek16(OUT_AT)))
  lw t0, 130(zero)
  mv a0, s1
  mv a1, t0
  call disasmInto
  add s1, s1, a0
  ; basic/monitor.e16.ts:703  puts(LINEBUF)
  li a0, 64
  call puts
  ; basic/monitor.e16.ts:704  newline()
  call newline
  addi s2, s2, 1
.L5:
  lw t0, 6(zero)
  bltu s2, t0, .L3
  ; basic/monitor.e16.ts:706  poke16(U_NEXT, at)
  sw s1, 146(zero)
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; basic/monitor.e16.ts:712 breakAt(k) at -O1
;   k in a0
breakAt:
  ; basic/monitor.e16.ts:713  return peek16(BREAKS + k * 2)
  slli t0, a0, 1
  lw a0, 150(t0)
.return:
  ret

; basic/monitor.e16.ts:720 breakCommand(at, given) at -O1
;   at in s1
;   given in s2
breakCommand:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; at
  mv s2, a1 ; given
  ; basic/monitor.e16.ts:721  if (given && !toggleBreak(at)) return 1
  beqz s2, .L1
  mv a0, s1
  call toggleBreak
  bnez a0, .L1
  ; basic/monitor.e16.ts:721  return 1
  li a0, 1
  j .return
.L1:
  ; basic/monitor.e16.ts:722  listBreaks()
  call listBreaks
  ; basic/monitor.e16.ts:723  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/monitor.e16.ts:727 toggleBreak(at) at -O1
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
  ; basic/monitor.e16.ts:728  if (at >= 0x8000 || at < 0x0800) return false
  li t0, 32768
  bgeu s2, t0, .L2
  li t0, 2048
  bgeu s2, t0, .L1
.L2:
  ; basic/monitor.e16.ts:728  return false
  li a0, 0
  j .return
.L1:
  ; basic/monitor.e16.ts:729  let free: u16 = 4
  li s3, 4 ; free
  ; basic/monitor.e16.ts:730  for (let k: u16 = 0; k < 4; k++) {
  li s1, 0 ; k
  j .L5
.L3:
  ; basic/monitor.e16.ts:731  if (breakAt(k) === at) {
  mv a0, s1
  call breakAt
  bne a0, s2, .L7
  ; basic/monitor.e16.ts:732  poke16(BREAKS + k * 2, 0)
  slli t0, s1, 1
  sw zero, 150(t0)
  ; basic/monitor.e16.ts:733  return true
  li a0, 1
  j .return
.L7:
  ; basic/monitor.e16.ts:735  if (breakAt(k) === 0 && free === 4) free = k
  mv a0, s1
  call breakAt
  bne a0, zero, .L8
  li t0, 4
  bne s3, t0, .L8
  ; basic/monitor.e16.ts:735  free = k
  mv s3, s1 ; free
.L8:
  addi s1, s1, 1
.L5:
  li t0, 4
  bltu s1, t0, .L3
  ; basic/monitor.e16.ts:737  if (free === 4) return false
  li t0, 4
  bne s3, t0, .L9
  ; basic/monitor.e16.ts:737  return false
  li a0, 0
  j .return
.L9:
  ; basic/monitor.e16.ts:738  poke16(BREAKS + free * 2, at)
  slli t0, s3, 1
  sw s2, 150(t0)
  ; basic/monitor.e16.ts:739  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/monitor.e16.ts:742 listBreaks() at -O1
;   any in s2
;   k in s1
listBreaks:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; basic/monitor.e16.ts:743  poke16(OUT_AT, LINEBUF)
  li t0, 64
  sw t0, 130(zero)
  ; basic/monitor.e16.ts:744  let any = false
  li s2, 0 ; any
  ; basic/monitor.e16.ts:745  for (let k: u16 = 0; k < 4; k++) {
  li s1, 0 ; k
  j .L3
.L1:
  ; basic/monitor.e16.ts:746  if (breakAt(k) !== 0) {
  mv a0, s1
  call breakAt
  beq a0, zero, .L5
  ; basic/monitor.e16.ts:747  if (any) emit(0x20)
  beqz s2, .L6
  ; basic/monitor.e16.ts:747  emit(0x20)
  li a0, 32
  call emit
.L6:
  ; basic/monitor.e16.ts:748  emitHex4(breakAt(k))
  mv a0, s1
  call breakAt
  call emitHex4
  ; basic/monitor.e16.ts:749  any = true
  li s2, 1 ; any
.L5:
  addi s1, s1, 1
.L3:
  li t0, 4
  bltu s1, t0, .L1
  ; basic/monitor.e16.ts:752  if (!any) emitStr(str('NO BREAKPOINTS'))
  bnez s2, .L7
  ; basic/monitor.e16.ts:752  emitStr(str('NO BREAKPOINTS'))
  la a0, str_146
  call emitStr
.L7:
  ; basic/monitor.e16.ts:753  emit(0)
  li a0, 0
  call emit
  ; basic/monitor.e16.ts:754  puts(LINEBUF)
  li a0, 64
  call puts
  ; basic/monitor.e16.ts:755  newline()
  call newline
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/monitor.e16.ts:759 armBreaks(start) at -O1
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
  ; basic/monitor.e16.ts:760  disarmBreaks()
  call disarmBreaks
  ; basic/monitor.e16.ts:761  for (let k: u16 = 0; k < 4; k++) {
  li s2, 0 ; k
  j .L3
.L1:
  ; basic/monitor.e16.ts:762  const at = breakAt(k)
  mv a0, s2
  call breakAt
  mv s1, a0 ; at
  ; basic/monitor.e16.ts:763  if (at !== 0 && at !== start) {
  beq s1, zero, .L5
  beq s1, s3, .L5
  ; basic/monitor.e16.ts:764  poke16(SAVED + k * 2, peek(at) | (peek(at + 1) << 8))
  slli t0, s2, 1
  lbu t1, 0(s1)
  lbu t2, 1(s1)
  slli t2, t2, 8
  or t1, t1, t2
  sw t1, 158(t0)
  ; basic/monitor.e16.ts:765  poke(at, C_EBREAK & 0xff)
  li t0, 10
  sb t0, 0(s1)
  ; basic/monitor.e16.ts:766  poke(at + 1, C_EBREAK >> 8)
  li t0, 32
  sb t0, 1(s1)
.L5:
  addi s2, s2, 1
.L3:
  li t0, 4
  bltu s2, t0, .L1
  ; basic/monitor.e16.ts:769  poke16(ARMED, 1)
  li t0, 1
  sw t0, 148(zero)
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/monitor.e16.ts:773 disarmBreaks() at -O1
;   k in s1
;   at in s2
;   was in s3
disarmBreaks:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/monitor.e16.ts:774  if (peek16(ARMED) === 0) return
  lw t0, 148(zero)
  bne t0, zero, .L1
  ; basic/monitor.e16.ts:774  return
  j .return
.L1:
  ; basic/monitor.e16.ts:775  for (let k: u16 = 0; k < 4; k++) {
  li s1, 0 ; k
  j .L4
.L2:
  ; basic/monitor.e16.ts:776  const at = breakAt(k)
  mv a0, s1
  call breakAt
  mv s2, a0 ; at
  ; basic/monitor.e16.ts:777  if (at !== 0 && peek(at) === (C_EBREAK & 0xff) && peek(at + 1) === C_EBREAK >> 8) {
  beq s2, zero, .L6
  lbu t0, 0(s2)
  li t1, 10
  bne t0, t1, .L6
  lbu t0, 1(s2)
  li t1, 32
  bne t0, t1, .L6
  ; basic/monitor.e16.ts:778  const was = peek16(SAVED + k * 2)
  slli t0, s1, 1
  lw s3, 158(t0)
  ; basic/monitor.e16.ts:779  poke(at, was & 0xff)
  andi t0, s3, 255
  sb t0, 0(s2)
  ; basic/monitor.e16.ts:780  poke(at + 1, was >> 8)
  srli t0, s3, 8
  sb t0, 1(s2)
.L6:
  addi s1, s1, 1
.L4:
  li t0, 4
  bltu s1, t0, .L2
  ; basic/monitor.e16.ts:783  poke16(ARMED, 0)
  sw zero, 148(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

str_29:
  .byte 122, 101, 114, 111, 32, 114, 97, 32, 115, 112, 32, 103, 112, 32, 97, 48, 32, 97, 49, 32, 97, 50, 32, 97, 51, 32, 116, 48, 32, 116, 49, 32, 116, 50, 32, 116, 51, 32, 115, 48, 32, 115, 49, 32, 115, 50, 32, 115, 51, 0
str_30:
  .byte 109, 115, 116, 97, 116, 117, 115, 0
str_31:
  .byte 109, 105, 115, 97, 0
str_32:
  .byte 109, 105, 101, 0
str_33:
  .byte 109, 116, 118, 101, 99, 0
str_34:
  .byte 109, 115, 99, 114, 97, 116, 99, 104, 0
str_35:
  .byte 109, 101, 112, 99, 0
str_36:
  .byte 109, 99, 97, 117, 115, 101, 0
str_37:
  .byte 109, 116, 118, 97, 108, 0
str_38:
  .byte 109, 105, 112, 0
str_39:
  .byte 99, 121, 99, 108, 101, 0
str_40:
  .byte 105, 110, 115, 116, 114, 101, 116, 0
str_41:
  .byte 99, 121, 99, 108, 101, 104, 0
str_42:
  .byte 105, 110, 115, 116, 114, 101, 116, 104, 0
str_43:
  .byte 97, 100, 100, 0
str_44:
  .byte 115, 108, 108, 0
str_45:
  .byte 115, 108, 116, 0
str_46:
  .byte 115, 108, 116, 117, 0
str_47:
  .byte 120, 111, 114, 0
str_48:
  .byte 115, 114, 108, 0
str_49:
  .byte 111, 114, 0
str_50:
  .byte 97, 110, 100, 0
str_51:
  .byte 115, 117, 98, 0
str_52:
  .byte 115, 114, 97, 0
str_53:
  .byte 109, 117, 108, 0
str_54:
  .byte 109, 117, 108, 104, 0
str_55:
  .byte 109, 117, 108, 104, 115, 117, 0
str_56:
  .byte 109, 117, 108, 104, 117, 0
str_57:
  .byte 100, 105, 118, 0
str_58:
  .byte 100, 105, 118, 117, 0
str_59:
  .byte 114, 101, 109, 0
str_60:
  .byte 114, 101, 109, 117, 0
str_61:
  .byte 114, 111, 108, 0
str_62:
  .byte 120, 110, 111, 114, 0
str_63:
  .byte 114, 111, 114, 0
str_64:
  .byte 111, 114, 110, 0
str_65:
  .byte 97, 110, 100, 110, 0
str_66:
  .byte 109, 105, 110, 0
str_67:
  .byte 109, 105, 110, 117, 0
str_68:
  .byte 109, 97, 120, 0
str_69:
  .byte 109, 97, 120, 117, 0
str_70:
  .byte 98, 115, 101, 116, 0
str_71:
  .byte 98, 99, 108, 114, 0
str_72:
  .byte 98, 105, 110, 118, 0
str_73:
  .byte 98, 101, 120, 116, 0
str_74:
  .byte 115, 114, 108, 105, 0
str_75:
  .byte 115, 114, 97, 105, 0
str_76:
  .byte 114, 111, 114, 105, 0
str_77:
  .byte 98, 101, 120, 116, 105, 0
str_78:
  .byte 115, 108, 108, 105, 0
str_79:
  .byte 98, 115, 101, 116, 105, 0
str_80:
  .byte 98, 99, 108, 114, 105, 0
str_81:
  .byte 98, 105, 110, 118, 105, 0
str_82:
  .byte 99, 108, 122, 0
str_83:
  .byte 99, 116, 122, 0
str_84:
  .byte 99, 112, 111, 112, 0
str_85:
  .byte 115, 101, 120, 116, 46, 98, 0
str_86:
  .byte 122, 101, 120, 116, 46, 98, 0
str_87:
  .byte 114, 101, 118, 56, 0
str_88:
  .byte 97, 100, 100, 105, 0
str_89:
  .byte 115, 108, 116, 105, 0
str_90:
  .byte 115, 108, 116, 105, 117, 0
str_91:
  .byte 120, 111, 114, 105, 0
str_92:
  .byte 111, 114, 105, 0
str_93:
  .byte 97, 110, 100, 105, 0
str_94:
  .byte 106, 97, 108, 114, 0
str_95:
  .byte 108, 98, 0
str_96:
  .byte 108, 119, 0
str_97:
  .byte 108, 98, 117, 0
str_98:
  .byte 98, 101, 113, 0
str_99:
  .byte 98, 110, 101, 0
str_100:
  .byte 98, 108, 116, 0
str_101:
  .byte 98, 103, 101, 0
str_102:
  .byte 98, 108, 116, 117, 0
str_103:
  .byte 98, 103, 101, 117, 0
str_104:
  .byte 99, 115, 114, 114, 119, 0
str_105:
  .byte 99, 115, 114, 114, 115, 0
str_106:
  .byte 99, 115, 114, 114, 99, 0
str_107:
  .byte 99, 115, 114, 114, 119, 105, 0
str_108:
  .byte 99, 115, 114, 114, 115, 105, 0
str_109:
  .byte 99, 115, 114, 114, 99, 105, 0
str_110:
  .byte 101, 99, 97, 108, 108, 0
str_111:
  .byte 101, 98, 114, 101, 97, 107, 0
str_112:
  .byte 109, 114, 101, 116, 0
str_113:
  .byte 119, 102, 105, 0
str_114:
  .byte 106, 97, 108, 0
str_115:
  .byte 108, 105, 0
str_116:
  .byte 97, 117, 105, 112, 99, 0
str_117:
  .byte 115, 98, 0
str_118:
  .byte 115, 119, 0
str_119:
  .byte 99, 46, 115, 119, 0
str_120:
  .byte 99, 46, 108, 119, 0
str_121:
  .byte 99, 46, 108, 119, 115, 112, 0
str_122:
  .byte 99, 46, 115, 119, 115, 112, 0
str_123:
  .byte 99, 46, 97, 100, 100, 105, 50, 115, 112, 110, 0
str_124:
  .byte 99, 46, 110, 111, 112, 0
str_125:
  .byte 99, 46, 97, 100, 100, 105, 0
str_126:
  .byte 99, 46, 108, 105, 0
str_127:
  .byte 99, 46, 115, 108, 108, 105, 0
str_128:
  .byte 99, 46, 115, 114, 108, 105, 0
str_129:
  .byte 99, 46, 115, 114, 97, 105, 0
str_130:
  .byte 99, 46, 97, 110, 100, 105, 0
str_131:
  .byte 99, 46, 98, 101, 113, 122, 0
str_132:
  .byte 99, 46, 98, 110, 101, 122, 0
str_133:
  .byte 99, 46, 106, 0
str_134:
  .byte 99, 46, 106, 97, 108, 0
str_135:
  .byte 99, 46, 109, 118, 0
str_136:
  .byte 99, 46, 97, 100, 100, 0
str_137:
  .byte 99, 46, 115, 117, 98, 0
str_138:
  .byte 99, 46, 120, 111, 114, 0
str_139:
  .byte 99, 46, 97, 110, 100, 0
str_140:
  .byte 99, 46, 111, 114, 0
str_141:
  .byte 99, 46, 106, 114, 0
str_142:
  .byte 99, 46, 106, 97, 108, 114, 0
str_143:
  .byte 99, 46, 101, 98, 114, 101, 97, 107, 0
str_144:
  .byte 46, 119, 111, 114, 100, 32, 63, 0
str_145:
  .byte 46, 119, 111, 114, 100, 32, 63, 44, 32, 63, 0
str_146:
  .byte 78, 79, 32, 66, 82, 69, 65, 75, 80, 79, 73, 78, 84, 83, 0
  .align 2
