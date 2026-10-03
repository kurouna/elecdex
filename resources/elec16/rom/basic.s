; Made by e16c from basic/rom.e16.ts, basic/text.e16.ts, basic/basic.e16.ts: do not edit.

; matchedLength at 0x0100
; txt at 0x0102
; curLine at 0x0104
; progEnd at 0x0106
; varEnd at 0x0108
; nsp at 0x010a
; fsp at 0x010c
; gsp at 0x010e
; running at 0x0110
; contLine at 0x0112
; contTxt at 0x0114
; jumping at 0x0116
; jumpLine at 0x0118
; jumpTxt at 0x011a
; proMode at 0x011c
; angleMarks at 0x011e
; name0 at 0x03a0
; name1 at 0x03a2
lineBuf = 0x0120 ; 80 bytes
tokens = 0x0170 ; 96 bytes
nums = 0x01d0 ; 192 bytes
ans = 0x0290 ; 8 bytes
textOut = 0x0298 ; 24 bytes
forStack = 0x02b0 ; 176 bytes
gosubStack = 0x0360 ; 64 bytes

e16c_init:
  ; matchedLength = 0
  li t0, 0
  sw t0, 0x0100(zero)
  ; txt = 0
  li t0, 0
  sw t0, 0x0102(zero)
  ; curLine = 0
  li t0, 0
  sw t0, 0x0104(zero)
  ; progEnd = 1024
  li t0, 1024
  sw t0, 0x0106(zero)
  ; varEnd = 1026
  li t0, 1026
  sw t0, 0x0108(zero)
  ; nsp = 0
  li t0, 0
  sw t0, 0x010a(zero)
  ; fsp = 0
  li t0, 0
  sw t0, 0x010c(zero)
  ; gsp = 0
  li t0, 0
  sw t0, 0x010e(zero)
  ; running = 0
  li t0, 0
  sw t0, 0x0110(zero)
  ; contLine = 0
  li t0, 0
  sw t0, 0x0112(zero)
  ; contTxt = 0
  li t0, 0
  sw t0, 0x0114(zero)
  ; jumping = 0
  li t0, 0
  sw t0, 0x0116(zero)
  ; jumpLine = 0
  li t0, 0
  sw t0, 0x0118(zero)
  ; jumpTxt = 0
  li t0, 0
  sw t0, 0x011a(zero)
  ; proMode = 0
  li t0, 0
  sw t0, 0x011c(zero)
  ; angleMarks = 128
  li t0, 128
  sw t0, 0x011e(zero)
  ; name0 = 0
  li t0, 0
  sw t0, 0x03a0(zero)
  ; name1 = 0
  li t0, 0
  sw t0, 0x03a2(zero)
  ; lineBuf: 80 bytes of 0
  li t0, 0x0120
  li t1, 0x0170
.clear_lineBuf:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_lineBuf
  ; tokens: 96 bytes of 0
  li t0, 0x0170
  li t1, 0x01d0
.clear_tokens:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_tokens
  ; nums: 192 bytes of 0
  li t0, 0x01d0
  li t1, 0x0290
.clear_nums:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_nums
  ; ans: 8 bytes of 0
  li t0, 0x0290
  li t1, 0x0298
.clear_ans:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_ans
  ; textOut: 24 bytes of 0
  li t0, 0x0298
  li t1, 0x02b0
.clear_textOut:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_textOut
  ; forStack: 176 bytes of 0
  li t0, 0x02b0
  li t1, 0x0360
.clear_forStack:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .clear_forStack
  ; gosubStack: 64 bytes of 0
  li t0, 0x0360
  li t1, 0x03a0
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

; basic/text.e16.ts:157 printTokens(at) at -O1
;   at in s0
;   p in s2
;   c in s3
;   w in s1
printTokens:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  mv s0, a0 ; at
  ; basic/text.e16.ts:158  let p = at
  mv s2, s0 ; p
  ; basic/text.e16.ts:159  while (peek(p) !== 0) {
  j .L3
.L1:
  ; basic/text.e16.ts:160  const c: u8 = peek(p)
  lbu s3, 0(s2)
  ; basic/text.e16.ts:161  if (c >= 0x80) {
  li t0, 128
  bltu s3, t0, .L5
  ; basic/text.e16.ts:162  let w = keywordText(c)
  mv a0, s3
  call keywordText
  mv s1, a0 ; w
  ; basic/text.e16.ts:163  while (w !== 0 && peek(w) !== CH_SPACE && peek(w) !== 0) {
  j .L8
.L6:
  ; basic/text.e16.ts:164  putc(peek(w))
  lbu a0, 0(s1)
  call putc
  ; basic/text.e16.ts:165  w++
  addi s1, s1, 1
.L8:
  beq s1, zero, .L11
  lbu t0, 0(s1)
  li t1, 32
  beq t0, t1, .L11
  lbu t0, 0(s1)
  bne t0, zero, .L6
  j .L11
.L5:
  ; basic/text.e16.ts:167  putc(c)
  mv a0, s3
  call putc
.L11:
  ; basic/text.e16.ts:168  p++
  addi s2, s2, 1
.L3:
  lbu t0, 0(s2)
  bne t0, zero, .L1
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; basic/text.e16.ts:173 printUnsigned(value) at -O1
;   value in s1
printUnsigned:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; value
  ; basic/text.e16.ts:174  if (value >= 10) printUnsigned(div(value, 10))
  li t0, 10
  bltu s1, t0, .L1
  ; basic/text.e16.ts:174  printUnsigned(div(value, 10))
  li t0, 10
  divu a0, s1, t0
  call printUnsigned
.L1:
  ; basic/text.e16.ts:175  putc(CH_0 + (value % 10))
  li t0, 10
  remu t0, s1, t0
  addi a0, t0, 48
  call putc
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:191 errorWord(code) at -O1
;   code in a0
errorWord:
  ; basic/basic.e16.ts:192  switch (code) {
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
  ; basic/basic.e16.ts:194  return str('SYNTAX')
  la a0, str_2
  j .return
.L3:
  ; basic/basic.e16.ts:196  return str('OVERFLOW')
  la a0, str_3
  j .return
.L4:
  ; basic/basic.e16.ts:198  return str('DIV BY 0')
  la a0, str_4
  j .return
.L5:
  ; basic/basic.e16.ts:200  return str('ARGUMENT')
  la a0, str_5
  j .return
.L6:
  ; basic/basic.e16.ts:202  return str('NO LINE')
  la a0, str_6
  j .return
.L7:
  ; basic/basic.e16.ts:204  return str('NEXT')
  la a0, str_7
  j .return
.L8:
  ; basic/basic.e16.ts:206  return str('RETURN')
  la a0, str_8
  j .return
.L9:
  ; basic/basic.e16.ts:208  return str('MEMORY')
  la a0, str_9
  j .return
.L10:
  ; basic/basic.e16.ts:210  return str('TOO COMPLEX')
  la a0, str_10
  j .return
.L11:
  ; basic/basic.e16.ts:212  return str('CONT')
  la a0, str_11
.return:
  ret

; basic/basic.e16.ts:217 inLine() at -O1
inLine:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:218  if (curLine === 0) return
  lw t0, 0x0104(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:218  return
  j .return
.L1:
  ; basic/basic.e16.ts:219  puts(str(' IN '))
  la a0, str_12
  call puts
  ; basic/basic.e16.ts:220  printUnsigned(peek16(curLine))
  lw t0, 0x0104(zero)
  lw a0, 0(t0)
  call printUnsigned
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:224 fail(code) at -O1
;   code in s1
fail:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; code
  ; basic/basic.e16.ts:225  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:226  puts(str('ERR:'))
  la a0, str_13
  call puts
  ; basic/basic.e16.ts:227  puts(errorWord(code))
  mv a0, s1
  call errorWord
  call puts
  ; basic/basic.e16.ts:228  if (running) inLine()
  lw t0, 0x0110(zero)
  beqz t0, .L1
  ; basic/basic.e16.ts:228  inLine()
  call inLine
.L1:
  ; basic/basic.e16.ts:229  newline()
  call newline
  ; basic/basic.e16.ts:230  contLine = 0
  sw zero, 0x0112(zero)
  ; basic/basic.e16.ts:231  stopRunning()
  call stopRunning
  ; basic/basic.e16.ts:232  basic_abort()
  call basic_abort
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:236 checkBreak() at -O1
checkBreak:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:237  if (peek16(BRKFLAG) === 0) return
  lw t0, 30(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:237  return
  j .return
.L1:
  ; basic/basic.e16.ts:238  poke16(BRKFLAG, 0)
  sw zero, 30(zero)
  ; basic/basic.e16.ts:239  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:240  puts(str('BREAK'))
  la a0, str_14
  call puts
  ; basic/basic.e16.ts:241  if (running) inLine()
  lw t0, 0x0110(zero)
  beqz t0, .L2
  ; basic/basic.e16.ts:241  inLine()
  call inLine
.L2:
  ; basic/basic.e16.ts:242  newline()
  call newline
  ; basic/basic.e16.ts:243  contLine = curLine
  lw t0, 0x0104(zero)
  sw t0, 0x0112(zero)
  ; basic/basic.e16.ts:244  contTxt = txt
  lw t0, 0x0102(zero)
  sw t0, 0x0114(zero)
  ; basic/basic.e16.ts:245  stopRunning()
  call stopRunning
  ; basic/basic.e16.ts:246  basic_abort()
  call basic_abort
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:249 marks() at -O1
;   m in s1
marks:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:250  let m: u16 = proMode ? ANN_PRO : ANN_RUN
  lw t0, 0x011c(zero)
  beqz t0, .L1
  li t0, 32
  j .L2
.L1:
  li t0, 16
.L2:
  mv s1, t0 ; m
  ; basic/basic.e16.ts:251  m |= angleMarks
  lw t0, 0x011e(zero)
  or s1, s1, t0
  ; basic/basic.e16.ts:252  if (running) m |= ANN_BUSY
  lw t0, 0x0110(zero)
  beqz t0, .L3
  ; basic/basic.e16.ts:252  m |= ANN_BUSY
  ori s1, s1, 1
.L3:
  ; basic/basic.e16.ts:253  poke16(ANNMODE, m)
  sw s1, 26(zero)
  ; basic/basic.e16.ts:254  annunciate()
  call annunciate
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:257 stopRunning() at -O1
stopRunning:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:258  running = false
  sw zero, 0x0110(zero)
  ; basic/basic.e16.ts:259  nsp = addr(nums)
  la t0, nums
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:260  marks()
  call marks
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:266 next() at -O1
next:
  ; basic/basic.e16.ts:267  while (peek(txt) === CH_SPACE) txt++
  j .L3
.L1:
  ; basic/basic.e16.ts:267  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
.L3:
  lw t0, 0x0102(zero)
  lbu t0, 0(t0)
  li t1, 32
  beq t0, t1, .L1
  ; basic/basic.e16.ts:268  return peek(txt)
  lw t0, 0x0102(zero)
  lbu a0, 0(t0)
.return:
  ret

; basic/basic.e16.ts:271 expect(c) at -O1
;   c in s1
expect:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/basic.e16.ts:272  if (next() !== c) fail(E_SYNTAX)
  call next
  beq a0, s1, .L1
  ; basic/basic.e16.ts:272  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:273  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:276 isDigit(c) at -O1
;   c in a0
isDigit:
  ; basic/basic.e16.ts:277  return c >= CH_0 && c <= CH_9
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

; basic/basic.e16.ts:281 readUnsigned() at -O1
;   v in s1
readUnsigned:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:282  next()
  call next
  ; basic/basic.e16.ts:283  if (!isDigit(peek(txt))) fail(E_SYNTAX)
  lw t0, 0x0102(zero)
  lbu a0, 0(t0)
  call isDigit
  bnez a0, .L1
  ; basic/basic.e16.ts:283  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:284  let v: u16 = 0
  li s1, 0 ; v
  ; basic/basic.e16.ts:285  while (isDigit(peek(txt))) {
  j .L4
.L2:
  ; basic/basic.e16.ts:286  v = wrapMul10(v) + (peek(txt) - CH_0)
  mv a0, s1
  call wrapMul10
  lw t0, 0x0102(zero)
  lbu t0, 0(t0)
  addi t0, t0, -48
  add s1, a0, t0
  ; basic/basic.e16.ts:287  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
.L4:
  lw t0, 0x0102(zero)
  lbu a0, 0(t0)
  call isDigit
  bnez a0, .L2
  ; basic/basic.e16.ts:289  return v
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:292 wrapMul10(v) at -O1
;   v in s1
wrapMul10:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; v
  ; basic/basic.e16.ts:293  if (v > 6553) fail(E_LINE)
  li t0, 6553
  bgeu t0, s1, .L1
  ; basic/basic.e16.ts:293  fail(E_LINE)
  li a0, 5
  call fail
.L1:
  ; basic/basic.e16.ts:294  return v * 10
  slli t1, s1, 3
  slli t0, s1, 1
  add a0, t0, t1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:300 math(op, a, b) at -O1
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
  ; basic/basic.e16.ts:301  poke16(MATH_A, a)
  li t0, 65362
  sw s3, 0(t0)
  ; basic/basic.e16.ts:302  poke16(MATH_B, b)
  li t0, 65364
  sw s0, 0(t0)
  ; basic/basic.e16.ts:303  poke16(MATH_OP, op)
  li t0, 65360
  sw s2, 0(t0)
  ; basic/basic.e16.ts:304  const status = peek16(MATH_STATUS)
  li t0, 65368
  lw s1, 0(t0)
  ; basic/basic.e16.ts:305  if (status === 0) return
  bne s1, zero, .L1
  ; basic/basic.e16.ts:305  return
  j .return
.L1:
  ; basic/basic.e16.ts:306  if (status === 1) fail(E_OVERFLOW)
  li t0, 1
  bne s1, t0, .L2
  ; basic/basic.e16.ts:306  fail(E_OVERFLOW)
  li a0, 2
  call fail
.L2:
  ; basic/basic.e16.ts:307  if (status === 2) fail(E_DIVIDE)
  li t0, 2
  bne s1, t0, .L3
  ; basic/basic.e16.ts:307  fail(E_DIVIDE)
  li a0, 3
  call fail
.L3:
  ; basic/basic.e16.ts:308  fail(E_ARGUMENT)
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

; basic/basic.e16.ts:312 push() at -O1
;   at in s1
push:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:313  if (nsp >= addr(nums) + 192) fail(E_COMPLEX)
  lw t0, 0x010a(zero)
  li t1, nums+192
  bltu t0, t1, .L1
  ; basic/basic.e16.ts:313  fail(E_COMPLEX)
  li a0, 9
  call fail
.L1:
  ; basic/basic.e16.ts:314  const at = nsp
  lw s1, 0x010a(zero)
  ; basic/basic.e16.ts:315  nsp += 8
  lw t0, 0x010a(zero)
  addi t0, t0, 8
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:316  return at
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:319 top() at -O1
top:
  ; basic/basic.e16.ts:320  return nsp - 8
  lw t0, 0x010a(zero)
  addi a0, t0, -8
.return:
  ret

; basic/basic.e16.ts:323 copy8(from, to) at -O1
;   from in a0
;   to in a1
copy8:
  ; basic/basic.e16.ts:324  poke16(to, peek16(from))
  lw t0, 0(a0)
  sw t0, 0(a1)
  ; basic/basic.e16.ts:325  poke16(to + 2, peek16(from + 2))
  lw t0, 2(a0)
  sw t0, 2(a1)
  ; basic/basic.e16.ts:326  poke16(to + 4, peek16(from + 4))
  lw t0, 4(a0)
  sw t0, 4(a1)
  ; basic/basic.e16.ts:327  poke16(to + 6, peek16(from + 6))
  lw t0, 6(a0)
  sw t0, 6(a1)
.return:
  ret

; basic/basic.e16.ts:330 isZero(at) at -O1
;   at in a0
isZero:
  ; basic/basic.e16.ts:331  return peek(at + 2) === 0
  lbu t0, 2(a0)
  sub t0, t0, zero
  seqz a0, t0
.return:
  ret

; basic/basic.e16.ts:334 setInt(at, v) at -O1
;   at in s1
;   v in s2
setInt:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; at
  mv s2, a1 ; v
  ; basic/basic.e16.ts:335  poke16(MATH_ARG, u16(v))
  li t0, 65366
  sw s2, 0(t0)
  ; basic/basic.e16.ts:336  math(M_FROMINT, at, 0)
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

; basic/basic.e16.ts:340 toInt(at) at -O1
;   at in s1
toInt:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; basic/basic.e16.ts:341  math(M_TOINT, at, 0)
  li a0, 49
  mv a1, s1
  li a2, 0
  call math
  ; basic/basic.e16.ts:342  return i16(peek16(MATH_ARG))
  li t0, 65366
  lw a0, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:346 binary(op) at -O1
;   op in s1
;   b in s2
binary:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; op
  ; basic/basic.e16.ts:347  const b = top()
  call top
  mv s2, a0 ; b
  ; basic/basic.e16.ts:348  nsp -= 8
  lw t0, 0x010a(zero)
  addi t0, t0, -8
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:349  math(op, top(), b)
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

; basic/basic.e16.ts:353 literal() at -O1
;   at in s2
;   n in s1
literal:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; basic/basic.e16.ts:354  const at = push()
  call push
  mv s2, a0 ; at
  ; basic/basic.e16.ts:355  poke16(MATH_ARG, 40)
  li t0, 40
  li t1, 65366
  sw t0, 0(t1)
  ; basic/basic.e16.ts:356  math(M_PARSE, at, txt)
  lw t0, 0x0102(zero)
  li a0, 56
  mv a1, s2
  mv a2, t0
  call math
  ; basic/basic.e16.ts:357  const n = peek16(MATH_ARG)
  li t0, 65366
  lw s1, 0(t0)
  ; basic/basic.e16.ts:358  if (n === 0) fail(E_SYNTAX)
  bne s1, zero, .L1
  ; basic/basic.e16.ts:358  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:359  txt += n
  lw t0, 0x0102(zero)
  add t0, t0, s1
  sw t0, 0x0102(zero)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:363 formatTop() at -O1
;   n in s1
formatTop:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:364  poke16(MATH_ARG, 0)
  li t0, 65366
  sw zero, 0(t0)
  ; basic/basic.e16.ts:365  math(M_FORMAT, top(), addr(textOut))
  call top
  mv t0, a0
  li a0, 57
  mv a1, t0
  la a2, textOut
  call math
  ; basic/basic.e16.ts:366  const n = peek16(MATH_ARG)
  li t0, 65366
  lw s1, 0(t0)
  ; basic/basic.e16.ts:367  poke(addr(textOut) + n, 0)
  sb zero, textOut(s1)
  ; basic/basic.e16.ts:368  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:377 readName() at -O1
readName:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:378  next()
  call next
  ; basic/basic.e16.ts:379  name0 = peek(txt)
  lw t0, 0x0102(zero)
  lbu t0, 0(t0)
  sw t0, 0x03a0(zero)
  ; basic/basic.e16.ts:380  if (!isLetter(name0)) fail(E_SYNTAX)
  lw a0, 0x03a0(zero)
  call isLetter
  bnez a0, .L1
  ; basic/basic.e16.ts:380  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:381  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:382  name1 = peek(txt)
  lw t0, 0x0102(zero)
  lbu t0, 0(t0)
  sw t0, 0x03a2(zero)
  ; basic/basic.e16.ts:383  if (isLetter(name1) || isDigit(name1)) txt++
  lw a0, 0x03a2(zero)
  call isLetter
  bnez a0, .L3
  lw a0, 0x03a2(zero)
  call isDigit
  beqz a0, .L2
.L3:
  ; basic/basic.e16.ts:383  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  j .L4
.L2:
  ; basic/basic.e16.ts:384  name1 = 0
  sw zero, 0x03a2(zero)
.L4:
  ; basic/basic.e16.ts:385  if (peek(txt) === CH_DOLLAR) fail(E_SYNTAX)
  lw t0, 0x0102(zero)
  lbu t0, 0(t0)
  li t1, 36
  bne t0, t1, .L5
  ; basic/basic.e16.ts:385  fail(E_SYNTAX)
  li a0, 1
  call fail
.L5:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:389 findVar(make) at -O1
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
  ; basic/basic.e16.ts:390  let at = progEnd + 2
  lw t0, 0x0106(zero)
  addi s1, t0, 2
  ; basic/basic.e16.ts:391  while (at < varEnd) {
  j .L3
.L1:
  ; basic/basic.e16.ts:392  if (peek(at) === name0 && peek(at + 1) === name1) return at + 2
  lbu t0, 0(s1)
  lw t1, 0x03a0(zero)
  bne t0, t1, .L5
  lbu t0, 1(s1)
  lw t1, 0x03a2(zero)
  bne t0, t1, .L5
  ; basic/basic.e16.ts:392  return at + 2
  addi a0, s1, 2
  j .return
.L5:
  ; basic/basic.e16.ts:393  at += 10
  addi s1, s1, 10
.L3:
  lw t0, 0x0108(zero)
  bltu s1, t0, .L1
  ; basic/basic.e16.ts:395  if (!make) return 0
  bnez s3, .L6
  ; basic/basic.e16.ts:395  return 0
  li a0, 0
  j .return
.L6:
  ; basic/basic.e16.ts:396  if (varEnd + 10 > LIMIT) fail(E_MEMORY)
  lw t0, 0x0108(zero)
  li t1, 28672
  addi t0, t0, 10
  bgeu t1, t0, .L7
  ; basic/basic.e16.ts:396  fail(E_MEMORY)
  li a0, 8
  call fail
.L7:
  ; basic/basic.e16.ts:397  poke(at, name0)
  lw t0, 0x03a0(zero)
  sb t0, 0(s1)
  ; basic/basic.e16.ts:398  poke(at + 1, name1)
  lw t0, 0x03a2(zero)
  sb t0, 1(s1)
  ; basic/basic.e16.ts:399  for (let k: u16 = 2; k < 10; k += 2) poke16(at + k, 0)
  li s2, 2 ; k
  j .L10
.L8:
  ; basic/basic.e16.ts:399  poke16(at + k, 0)
  add t0, s1, s2
  sw zero, 0(t0)
  addi s2, s2, 2
.L10:
  li t0, 10
  bltu s2, t0, .L8
  ; basic/basic.e16.ts:400  varEnd += 10
  lw t0, 0x0108(zero)
  addi t0, t0, 10
  sw t0, 0x0108(zero)
  ; basic/basic.e16.ts:401  return at + 2
  addi a0, s1, 2
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:404 clearVariables() at -O1
clearVariables:
  ; basic/basic.e16.ts:405  varEnd = progEnd + 2
  lw t0, 0x0106(zero)
  addi t0, t0, 2
  sw t0, 0x0108(zero)
  ; basic/basic.e16.ts:406  fsp = 0
  sw zero, 0x010c(zero)
  ; basic/basic.e16.ts:407  gsp = 0
  sw zero, 0x010e(zero)
.return:
  ret

; basic/basic.e16.ts:413 expr() at -O1
expr:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:414  andExpr()
  call andExpr
  ; basic/basic.e16.ts:415  while (next() === T_OR) {
  j .L3
.L1:
  ; basic/basic.e16.ts:416  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:417  andExpr()
  call andExpr
  ; basic/basic.e16.ts:418  logical(false)
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

; basic/basic.e16.ts:422 andExpr() at -O1
andExpr:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:423  notExpr()
  call notExpr
  ; basic/basic.e16.ts:424  while (next() === T_AND) {
  j .L3
.L1:
  ; basic/basic.e16.ts:425  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:426  notExpr()
  call notExpr
  ; basic/basic.e16.ts:427  logical(true)
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

; basic/basic.e16.ts:432 logical(both) at -O1
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
  ; basic/basic.e16.ts:433  const b = !isZero(top())
  call top
  call isZero
  seqz s1, a0
  ; basic/basic.e16.ts:434  nsp -= 8
  lw t0, 0x010a(zero)
  addi t0, t0, -8
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:435  const a = !isZero(top())
  call top
  call isZero
  seqz s2, a0
  ; basic/basic.e16.ts:436  setInt(top(), (both ? a && b : a || b) ? 1 : 0)
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

; basic/basic.e16.ts:439 notExpr() at -O1
notExpr:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:440  if (next() === T_NOT) {
  call next
  li t0, 198
  bne a0, t0, .L1
  ; basic/basic.e16.ts:441  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:442  notExpr()
  call notExpr
  ; basic/basic.e16.ts:443  setInt(top(), isZero(top()) ? 1 : 0)
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
  ; basic/basic.e16.ts:444  return
  j .return
.L1:
  ; basic/basic.e16.ts:446  compare()
  call compare
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:450 compare() at -O1
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
  ; basic/basic.e16.ts:451  addExpr()
  call addExpr
  ; basic/basic.e16.ts:452  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:453  if (c !== CH_LT && c !== CH_EQ && c !== CH_GT) return
  li t0, 60
  beq s1, t0, .L1
  li t0, 61
  beq s1, t0, .L1
  li t0, 62
  beq s1, t0, .L1
  ; basic/basic.e16.ts:453  return
  j .return
.L1:
  ; basic/basic.e16.ts:454  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:455  let want: u16 = c === CH_LT ? 1 : c === CH_EQ ? 2 : 4
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
  ; basic/basic.e16.ts:456  const d = peek(txt)
  lw t0, 0x0102(zero)
  lbu s3, 0(t0)
  ; basic/basic.e16.ts:457  if (c !== CH_EQ && (d === CH_EQ || (c === CH_LT && d === CH_GT))) {
  li t0, 61
  beq s1, t0, .L6
  li t0, 61
  beq s3, t0, .L7
  li t0, 60
  bne s1, t0, .L6
  li t0, 62
  bne s3, t0, .L6
.L7:
  ; basic/basic.e16.ts:458  want |= d === CH_EQ ? 2 : 4
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
  ; basic/basic.e16.ts:459  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
.L6:
  ; basic/basic.e16.ts:461  addExpr()
  call addExpr
  ; basic/basic.e16.ts:462  const b = top()
  call top
  sw a0, 2(fp) ; b
  ; basic/basic.e16.ts:463  nsp -= 8
  lw t0, 0x010a(zero)
  addi t0, t0, -8
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:464  math(M_CMP, top(), b)
  call top
  mv t0, a0
  li a0, 6
  mv a1, t0
  lw a2, 2(fp)
  call math
  ; basic/basic.e16.ts:465  const r = peek16(MATH_RESULT)
  li t0, 65370
  lw t0, 0(t0)
  sw t0, 0(fp) ; r
  ; basic/basic.e16.ts:466  const got: u16 = r === 0xffff ? 1 : r === 0 ? 2 : 4
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
  ; basic/basic.e16.ts:467  setInt(top(), (want & got) !== 0 ? 1 : 0)
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

; basic/basic.e16.ts:470 addExpr() at -O1
;   c in s1
addExpr:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:471  mulExpr()
  call mulExpr
  ; basic/basic.e16.ts:472  for (;;) {
.L1:
  ; basic/basic.e16.ts:473  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:474  if (c !== CH_PLUS && c !== CH_MINUS) return
  li t0, 43
  beq s1, t0, .L5
  li t0, 45
  beq s1, t0, .L5
  ; basic/basic.e16.ts:474  return
  j .return
.L5:
  ; basic/basic.e16.ts:475  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:476  mulExpr()
  call mulExpr
  ; basic/basic.e16.ts:477  binary(c === CH_PLUS ? M_ADD : M_SUB)
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

; basic/basic.e16.ts:481 mulExpr() at -O1
;   c in s1
mulExpr:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:482  unary()
  call unary
  ; basic/basic.e16.ts:483  for (;;) {
.L1:
  ; basic/basic.e16.ts:484  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:485  if (c !== CH_STAR && c !== CH_SLASH) return
  li t0, 42
  beq s1, t0, .L5
  li t0, 47
  beq s1, t0, .L5
  ; basic/basic.e16.ts:485  return
  j .return
.L5:
  ; basic/basic.e16.ts:486  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:487  unary()
  call unary
  ; basic/basic.e16.ts:488  binary(c === CH_STAR ? M_MUL : M_DIV)
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

; basic/basic.e16.ts:496 unary() at -O1
;   c in s1
unary:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:497  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:498  if (c === CH_MINUS) {
  li t0, 45
  bne s1, t0, .L1
  ; basic/basic.e16.ts:499  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:500  unary()
  call unary
  ; basic/basic.e16.ts:501  math(M_NEG, top(), 0)
  call top
  mv t0, a0
  li a0, 16
  mv a1, t0
  li a2, 0
  call math
  ; basic/basic.e16.ts:502  return
  j .return
.L1:
  ; basic/basic.e16.ts:504  if (c === CH_PLUS) txt++
  li t0, 43
  bne s1, t0, .L2
  ; basic/basic.e16.ts:504  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
.L2:
  ; basic/basic.e16.ts:505  power()
  call power
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:508 power() at -O1
power:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:509  primary()
  call primary
  ; basic/basic.e16.ts:510  if (next() !== CH_CARET) return
  call next
  li t0, 94
  beq a0, t0, .L1
  ; basic/basic.e16.ts:510  return
  j .return
.L1:
  ; basic/basic.e16.ts:511  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:512  unary()
  call unary
  ; basic/basic.e16.ts:513  binary(M_POW)
  li a0, 5
  call binary
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:516 primary() at -O1
;   c in s1
;   at in s2
;   to in s3
primary:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/basic.e16.ts:517  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:518  if (isDigit(c) || c === CH_DOT) {
  mv a0, s1
  call isDigit
  bnez a0, .L2
  li t0, 46
  bne s1, t0, .L1
.L2:
  ; basic/basic.e16.ts:519  literal()
  call literal
  ; basic/basic.e16.ts:520  return
  j .return
.L1:
  ; basic/basic.e16.ts:522  if (c === CH_LPAREN) {
  li t0, 40
  bne s1, t0, .L3
  ; basic/basic.e16.ts:523  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:524  expr()
  call expr
  ; basic/basic.e16.ts:525  expect(CH_RPAREN)
  li a0, 41
  call expect
  ; basic/basic.e16.ts:526  return
  j .return
.L3:
  ; basic/basic.e16.ts:528  if (isLetter(c)) {
  mv a0, s1
  call isLetter
  beqz a0, .L4
  ; basic/basic.e16.ts:529  readName()
  call readName
  ; basic/basic.e16.ts:530  const at = findVar(false)
  li a0, 0
  call findVar
  mv s2, a0 ; at
  ; basic/basic.e16.ts:531  const to = push()
  call push
  mv s3, a0 ; to
  ; basic/basic.e16.ts:532  if (at === 0) setInt(to, 0)
  bne s2, zero, .L5
  ; basic/basic.e16.ts:532  setInt(to, 0)
  mv a0, s3
  li a1, 0
  call setInt
  j .L6
.L5:
  ; basic/basic.e16.ts:533  copy8(at, to)
  mv a0, s2
  mv a1, s3
  call copy8
.L6:
  ; basic/basic.e16.ts:534  return
  j .return
.L4:
  ; basic/basic.e16.ts:536  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:537  functionCall(c)
  mv a0, s1
  call functionCall
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:545 functionCall(token) at -O1
;   token in s1
functionCall:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; token
  ; basic/basic.e16.ts:546  if (token >= T_SIN && token <= T_EXP) {
  li t0, 180
  bltu s1, t0, .L1
  li t0, 192
  bltu t0, s1, .L1
  ; basic/basic.e16.ts:547  unary()
  call unary
  ; basic/basic.e16.ts:548  math(peek(FUNCTION_OPS + (token - T_SIN)), top(), 0)
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
  ; basic/basic.e16.ts:549  return
  j .return
.L1:
  ; basic/basic.e16.ts:551  if (token === T_PI) {
  li t0, 194
  bne s1, t0, .L2
  ; basic/basic.e16.ts:552  math(M_PI, push(), 0)
  call push
  mv t0, a0
  li a0, 32
  mv a1, t0
  li a2, 0
  call math
  ; basic/basic.e16.ts:553  return
  j .return
.L2:
  ; basic/basic.e16.ts:555  if (token === T_ANS) {
  li t0, 195
  bne s1, t0, .L3
  ; basic/basic.e16.ts:556  copy8(addr(ans), push())
  call push
  mv t0, a0
  la a0, ans
  mv a1, t0
  call copy8
  ; basic/basic.e16.ts:557  return
  j .return
.L3:
  ; basic/basic.e16.ts:559  if (token === T_RND) {
  li t0, 193
  bne s1, t0, .L4
  ; basic/basic.e16.ts:560  random()
  call random
  ; basic/basic.e16.ts:561  return
  j .return
.L4:
  ; basic/basic.e16.ts:563  if (token === T_PEEK) {
  li t0, 196
  bne s1, t0, .L5
  ; basic/basic.e16.ts:564  unary()
  call unary
  ; basic/basic.e16.ts:565  setInt(top(), peek(u16(toInt(top()))))
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
  ; basic/basic.e16.ts:566  return
  j .return
.L5:
  ; basic/basic.e16.ts:568  fail(E_SYNTAX)
  li a0, 1
  call fail
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:572 random() at -O1
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
  ; basic/basic.e16.ts:573  unary()
  call unary
  ; basic/basic.e16.ts:574  const n = top()
  call top
  mv s2, a0 ; n
  ; basic/basic.e16.ts:575  const r = push()
  call push
  mv s1, a0 ; r
  ; basic/basic.e16.ts:576  math(M_RND, r, 0)
  li a0, 31
  mv a1, s1
  li a2, 0
  call math
  ; basic/basic.e16.ts:577  const one = push()
  call push
  mv s3, a0 ; one
  ; basic/basic.e16.ts:578  setInt(one, 1)
  mv a0, s3
  li a1, 1
  call setInt
  ; basic/basic.e16.ts:579  math(M_CMP, n, one)
  li a0, 6
  mv a1, s2
  mv a2, s3
  call math
  ; basic/basic.e16.ts:580  nsp -= 8
  lw t0, 0x010a(zero)
  addi t0, t0, -8
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:581  if (peek16(MATH_RESULT) === 0xffff) {
  li t0, 65370
  lw t0, 0(t0)
  li t1, 65535
  bne t0, t1, .L1
  ; basic/basic.e16.ts:582  copy8(r, n)
  mv a0, s1
  mv a1, s2
  call copy8
  ; basic/basic.e16.ts:583  nsp -= 8
  lw t0, 0x010a(zero)
  addi t0, t0, -8
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:584  return
  j .return
.L1:
  ; basic/basic.e16.ts:586  math(M_MUL, r, n)
  li a0, 3
  mv a1, s1
  mv a2, s2
  call math
  ; basic/basic.e16.ts:587  math(M_INT, r, 0)
  li a0, 18
  mv a1, s1
  li a2, 0
  call math
  ; basic/basic.e16.ts:588  copy8(r, n)
  mv a0, s1
  mv a1, s2
  call copy8
  ; basic/basic.e16.ts:589  nsp -= 8
  lw t0, 0x010a(zero)
  addi t0, t0, -8
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:590  const k = push()
  call push
  mv s0, a0 ; k
  ; basic/basic.e16.ts:591  setInt(k, 1)
  mv a0, s0
  li a1, 1
  call setInt
  ; basic/basic.e16.ts:592  binary(M_ADD)
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

; basic/basic.e16.ts:598 findLine(n, exact) at -O1
;   n in a0
;   exact in a1
;   at in a2
;   here in a3
findLine:
  ; basic/basic.e16.ts:599  let at = PROG
  li a2, 1024 ; at
  ; basic/basic.e16.ts:600  while (peek16(at) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:601  const here = peek16(at)
  lw a3, 0(a2)
  ; basic/basic.e16.ts:602  if (here === n) return at
  bne a3, a0, .L5
  ; basic/basic.e16.ts:602  return at
  mv a0, a2
  j .return
.L5:
  ; basic/basic.e16.ts:603  if (here > n) return exact ? 0 : at
  bgeu a0, a3, .L6
  ; basic/basic.e16.ts:603  return exact ? 0 : at
  beqz a1, .L7
  li t0, 0
  j .L8
.L7:
  mv t0, a2
.L8:
  mv a0, t0
  j .return
.L6:
  ; basic/basic.e16.ts:604  at += peek16(at + 2)
  lw t0, 2(a2)
  add a2, a2, t0
.L3:
  lw t0, 0(a2)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:606  return 0
  li a0, 0
.return:
  ret

; basic/basic.e16.ts:610 move(from, to, count) at -O1
;   from in a0
;   to in a1
;   count in a2
;   k in a3
move:
  ; basic/basic.e16.ts:611  if (to < from) {
  bgeu a1, a0, .L1
  ; basic/basic.e16.ts:612  for (let k: u16 = 0; k < count; k++) poke(to + k, peek(from + k))
  li a3, 0 ; k
  j .L4
.L2:
  ; basic/basic.e16.ts:612  poke(to + k, peek(from + k))
  add t0, a1, a3
  add t1, a0, a3
  lbu t1, 0(t1)
  sb t1, 0(t0)
  addi a3, a3, 1
.L4:
  bltu a3, a2, .L2
  ; basic/basic.e16.ts:613  return
  j .return
.L1:
  ; basic/basic.e16.ts:615  let k = count
  mv a3, a2 ; k
  ; basic/basic.e16.ts:616  while (k > 0) {
  j .L8
.L6:
  ; basic/basic.e16.ts:617  k--
  addi a3, a3, -1
  ; basic/basic.e16.ts:618  poke(to + k, peek(from + k))
  add t0, a1, a3
  add t1, a0, a3
  lbu t1, 0(t1)
  sb t1, 0(t0)
.L8:
  bltu zero, a3, .L6
.return:
  ret

; basic/basic.e16.ts:623 storeLine(n, text, length) at -O1
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
  ; basic/basic.e16.ts:624  const old = findLine(n, true)
  lw a0, 0(fp)
  li a1, 1
  call findLine
  mv s3, a0 ; old
  ; basic/basic.e16.ts:625  if (old !== 0) {
  beq s3, zero, .L1
  ; basic/basic.e16.ts:626  const size = peek16(old + 2)
  lw s1, 2(s3)
  ; basic/basic.e16.ts:627  move(old + size, old, progEnd + 2 - (old + size))
  add t0, s3, s1
  lw t1, 0x0106(zero)
  add t2, s3, s1
  addi t1, t1, 2
  sub t1, t1, t2
  mv a0, t0
  mv a1, s3
  mv a2, t1
  call move
  ; basic/basic.e16.ts:628  progEnd -= size
  lw t0, 0x0106(zero)
  sub t0, t0, s1
  sw t0, 0x0106(zero)
.L1:
  ; basic/basic.e16.ts:630  if (length > 1) {
  li t0, 1
  lw t1, 2(fp) ; length
  bgeu t0, t1, .L2
  ; basic/basic.e16.ts:631  const size = (4 + length + 1) & 0xfffe
  lw t0, 2(fp) ; length
  addi t0, t0, 5
  andi s1, t0, -2
  ; basic/basic.e16.ts:632  if (progEnd + 2 + size > LIMIT) fail(E_MEMORY)
  lw t0, 0x0106(zero)
  addi t0, t0, 2
  add t0, t0, s1
  li t1, 28672
  bgeu t1, t0, .L3
  ; basic/basic.e16.ts:632  fail(E_MEMORY)
  li a0, 8
  call fail
.L3:
  ; basic/basic.e16.ts:633  let at = findLine(n, false)
  lw a0, 0(fp)
  li a1, 0
  call findLine
  mv s2, a0 ; at
  ; basic/basic.e16.ts:634  if (at === 0) at = progEnd
  bne s2, zero, .L4
  ; basic/basic.e16.ts:634  at = progEnd
  lw s2, 0x0106(zero)
.L4:
  ; basic/basic.e16.ts:635  move(at, at + size, progEnd + 2 - at)
  add t0, s2, s1
  lw t1, 0x0106(zero)
  addi t1, t1, 2
  sub t1, t1, s2
  mv a0, s2
  mv a1, t0
  mv a2, t1
  call move
  ; basic/basic.e16.ts:636  poke16(at, n)
  lw t0, 0(fp) ; n
  sw t0, 0(s2)
  ; basic/basic.e16.ts:637  poke16(at + 2, size)
  sw s1, 2(s2)
  ; basic/basic.e16.ts:638  move(text, at + 4, length)
  lw a0, 4(fp)
  addi a1, s2, 4
  lw a2, 2(fp)
  call move
  ; basic/basic.e16.ts:639  progEnd += size
  lw t0, 0x0106(zero)
  add t0, t0, s1
  sw t0, 0x0106(zero)
.L2:
  ; basic/basic.e16.ts:641  poke16(progEnd, 0)
  lw t0, 0x0106(zero)
  sw zero, 0(t0)
  ; basic/basic.e16.ts:642  clearVariables()
  call clearVariables
  ; basic/basic.e16.ts:643  contLine = 0
  sw zero, 0x0112(zero)
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; basic/basic.e16.ts:647 keepProgramTo(end) at -O1
;   end in s1
keepProgramTo:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; end
  ; basic/basic.e16.ts:648  progEnd = end
  sw s1, 0x0106(zero)
  ; basic/basic.e16.ts:649  poke16(end, 0)
  sw zero, 0(s1)
  ; basic/basic.e16.ts:650  clearVariables()
  call clearVariables
  ; basic/basic.e16.ts:651  contLine = 0
  sw zero, 0x0112(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:659 keptProgramEnd() at -O1
;   at in a0
;   last in a2
;   n in a3
;   size in a1
keptProgramEnd:
  ; basic/basic.e16.ts:660  let at: u16 = PROG
  li a0, 1024 ; at
  ; basic/basic.e16.ts:661  let last: u16 = 0
  li a2, 0 ; last
  ; basic/basic.e16.ts:662  while (peek16(at) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:663  const n = peek16(at)
  lw a3, 0(a0)
  ; basic/basic.e16.ts:664  const size = peek16(at + 2)
  lw a1, 2(a0)
  ; basic/basic.e16.ts:665  if (n <= last || size < 6 || (size & 1) !== 0 || size > LIMIT - 2 - at) return PROG
  bgeu a2, a3, .L6
  li t0, 6
  bltu a1, t0, .L6
  andi t0, a1, 1
  bne t0, zero, .L6
  li t0, 28670
  sub t0, t0, a0
  bgeu t0, a1, .L5
.L6:
  ; basic/basic.e16.ts:665  return PROG
  li a0, 1024
  j .return
.L5:
  ; basic/basic.e16.ts:666  if (peek(at + size - 1) !== 0 && peek(at + size - 2) !== 0) return PROG
  add t0, a0, a1
  lbu t0, -1(t0)
  beq t0, zero, .L7
  add t0, a0, a1
  lbu t0, -2(t0)
  beq t0, zero, .L7
  ; basic/basic.e16.ts:666  return PROG
  li a0, 1024
  j .return
.L7:
  ; basic/basic.e16.ts:667  last = n
  mv a2, a3 ; last
  ; basic/basic.e16.ts:668  at += size
  add a0, a0, a1
.L3:
  lw t0, 0(a0)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:670  return at
.return:
  ret

; basic/basic.e16.ts:675 jump(line, text) at -O1
;   line in a0
;   text in a1
jump:
  ; basic/basic.e16.ts:676  jumping = true
  li t0, 1
  sw t0, 0x0116(zero)
  ; basic/basic.e16.ts:677  jumpLine = line
  sw a0, 0x0118(zero)
  ; basic/basic.e16.ts:678  jumpTxt = text
  sw a1, 0x011a(zero)
.return:
  ret

; basic/basic.e16.ts:682 statements() at -O1
;   c in s1
statements:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:683  for (;;) {
.L1:
  ; basic/basic.e16.ts:684  checkBreak()
  call checkBreak
  ; basic/basic.e16.ts:685  statement()
  call statement
  ; basic/basic.e16.ts:686  if (jumping || (!running && curLine !== 0)) return
  lw t0, 0x0116(zero)
  bnez t0, .L6
  lw t0, 0x0110(zero)
  bnez t0, .L5
  lw t0, 0x0104(zero)
  beq t0, zero, .L5
.L6:
  ; basic/basic.e16.ts:686  return
  j .return
.L5:
  ; basic/basic.e16.ts:687  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:688  if (c === CH_COLON) {
  li t0, 58
  bne s1, t0, .L7
  ; basic/basic.e16.ts:689  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:690  continue
  j .L1
.L7:
  ; basic/basic.e16.ts:693  if (c === 0 || c === T_ELSE) return
  beq s1, zero, .L9
  li t0, 137
  bne s1, t0, .L8
.L9:
  ; basic/basic.e16.ts:693  return
  j .return
.L8:
  ; basic/basic.e16.ts:694  fail(E_SYNTAX)
  li a0, 1
  call fail
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:698 statement() at -O1
;   c in s1
statement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:699  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:700  if (c === 0 || c === CH_COLON) return
  beq s1, zero, .L2
  li t0, 58
  bne s1, t0, .L1
.L2:
  ; basic/basic.e16.ts:700  return
  j .return
.L1:
  ; basic/basic.e16.ts:701  if (isLetter(c)) {
  mv a0, s1
  call isLetter
  beqz a0, .L3
  ; basic/basic.e16.ts:702  assignment()
  call assignment
  ; basic/basic.e16.ts:703  return
  j .return
.L3:
  ; basic/basic.e16.ts:705  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:706  switch (c) {
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
  ; basic/basic.e16.ts:708  printStatement()
  call printStatement
  ; basic/basic.e16.ts:709  return
  j .return
.L6:
  ; basic/basic.e16.ts:711  assignment()
  call assignment
  ; basic/basic.e16.ts:712  return
  j .return
.L7:
  ; basic/basic.e16.ts:714  ifStatement()
  call ifStatement
  ; basic/basic.e16.ts:715  return
  j .return
.L8:
  ; basic/basic.e16.ts:717  forStatement()
  call forStatement
  ; basic/basic.e16.ts:718  return
  j .return
.L9:
  ; basic/basic.e16.ts:720  nextStatement()
  call nextStatement
  ; basic/basic.e16.ts:721  return
  j .return
.L10:
  ; basic/basic.e16.ts:723  gotoStatement()
  call gotoStatement
  ; basic/basic.e16.ts:724  return
  j .return
.L11:
  ; basic/basic.e16.ts:726  gosubStatement()
  call gosubStatement
  ; basic/basic.e16.ts:727  return
  j .return
.L12:
  ; basic/basic.e16.ts:729  returnStatement()
  call returnStatement
  ; basic/basic.e16.ts:730  return
  j .return
.L13:
  ; basic/basic.e16.ts:732  toLineEnd()
  call toLineEnd
  ; basic/basic.e16.ts:733  return
  j .return
.L14:
  ; basic/basic.e16.ts:735  commandStatement(c)
  mv a0, s1
  call commandStatement
  ; basic/basic.e16.ts:736  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:740 commandStatement(c) at -O1
;   c in s1
commandStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; basic/basic.e16.ts:741  switch (c) {
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
  ; basic/basic.e16.ts:743  inputStatement()
  call inputStatement
  ; basic/basic.e16.ts:744  return
  j .return
.L3:
  ; basic/basic.e16.ts:746  contLine = 0
  sw zero, 0x0112(zero)
  ; basic/basic.e16.ts:747  endProgram()
  call endProgram
  ; basic/basic.e16.ts:748  return
  j .return
.L4:
  ; basic/basic.e16.ts:750  contLine = curLine
  lw t0, 0x0104(zero)
  sw t0, 0x0112(zero)
  ; basic/basic.e16.ts:751  contTxt = txt
  lw t0, 0x0102(zero)
  sw t0, 0x0114(zero)
  ; basic/basic.e16.ts:752  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:753  puts(str('STOP'))
  la a0, str_15
  call puts
  ; basic/basic.e16.ts:754  inLine()
  call inLine
  ; basic/basic.e16.ts:755  newline()
  call newline
  ; basic/basic.e16.ts:756  endProgram()
  call endProgram
  ; basic/basic.e16.ts:757  return
  j .return
.L5:
  ; basic/basic.e16.ts:759  runStatement()
  call runStatement
  ; basic/basic.e16.ts:760  return
  j .return
.L6:
  ; basic/basic.e16.ts:762  listStatement()
  call listStatement
  ; basic/basic.e16.ts:763  return
  j .return
.L7:
  ; basic/basic.e16.ts:765  keepProgramTo(PROG)
  li a0, 1024
  call keepProgramTo
  ; basic/basic.e16.ts:766  endProgram()
  call endProgram
  ; basic/basic.e16.ts:767  return
  j .return
.L8:
  ; basic/basic.e16.ts:769  contStatement()
  call contStatement
  ; basic/basic.e16.ts:770  return
  j .return
.L9:
  ; basic/basic.e16.ts:772  cls()
  call cls
  ; basic/basic.e16.ts:773  return
  j .return
.L10:
  ; basic/basic.e16.ts:775  pokeStatement()
  call pokeStatement
  ; basic/basic.e16.ts:776  return
  j .return
.L11:
  ; basic/basic.e16.ts:778  expr()
  call expr
  ; basic/basic.e16.ts:779  call_at(u16(toInt(top())))
  call top
  call toInt
  call call_at
  ; basic/basic.e16.ts:780  nsp -= 8
  lw t0, 0x010a(zero)
  addi t0, t0, -8
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:781  return
  j .return
.L12:
  ; basic/basic.e16.ts:783  poke16(INBASIC, 0)
  sw zero, 28(zero)
  ; basic/basic.e16.ts:784  monitor()
  call monitor
  ; basic/basic.e16.ts:785  return
  j .return
.L13:
  ; basic/basic.e16.ts:787  angleStatement(c)
  mv a0, s1
  call angleStatement
  ; basic/basic.e16.ts:788  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:792 angleStatement(c) at -O1
;   c in s1
;   unit in s2
angleStatement:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; c
  ; basic/basic.e16.ts:793  if (c === T_DEG || c === T_RAD || c === T_GRAD) {
  li t0, 150
  beq s1, t0, .L2
  li t0, 151
  beq s1, t0, .L2
  li t0, 152
  bne s1, t0, .L1
.L2:
  ; basic/basic.e16.ts:794  const unit: u16 = c - T_DEG
  addi s2, s1, -150
  ; basic/basic.e16.ts:795  poke16(MATH_ANGLE, unit)
  li t0, 65372
  sw s2, 0(t0)
  ; basic/basic.e16.ts:796  angleMarks = unit === 0 ? ANN_DEG : unit === 1 ? ANN_RAD : ANN_GRAD
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
  sw t0, 0x011e(zero)
  ; basic/basic.e16.ts:797  marks()
  call marks
  ; basic/basic.e16.ts:798  return
  j .return
.L1:
  ; basic/basic.e16.ts:800  fail(E_SYNTAX)
  li a0, 1
  call fail
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:803 toLineEnd() at -O1
toLineEnd:
  ; basic/basic.e16.ts:804  while (peek(txt) !== 0) txt++
  j .L3
.L1:
  ; basic/basic.e16.ts:804  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
.L3:
  lw t0, 0x0102(zero)
  lbu t0, 0(t0)
  bne t0, zero, .L1
.return:
  ret

; basic/basic.e16.ts:807 endProgram() at -O1
endProgram:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:808  running = false
  sw zero, 0x0110(zero)
  ; basic/basic.e16.ts:809  toLineEnd()
  call toLineEnd
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:812 assignment() at -O1
;   at in s1
assignment:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:813  readName()
  call readName
  ; basic/basic.e16.ts:814  const at = findVar(true)
  li a0, 1
  call findVar
  mv s1, a0 ; at
  ; basic/basic.e16.ts:815  expect(CH_EQ)
  li a0, 61
  call expect
  ; basic/basic.e16.ts:816  expr()
  call expr
  ; basic/basic.e16.ts:817  copy8(top(), at)
  call top
  mv a1, s1
  call copy8
  ; basic/basic.e16.ts:818  nsp -= 8
  lw t0, 0x010a(zero)
  addi t0, t0, -8
  sw t0, 0x010a(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:825 printStatement() at -O1
;   joined in s1
printStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:826  let joined = false
  li s1, 0 ; joined
  ; basic/basic.e16.ts:827  while (!statementEnds()) {
  j .L3
.L1:
  ; basic/basic.e16.ts:828  if (next() === CH_QUOTE) {
  call next
  li t0, 34
  bne a0, t0, .L5
  ; basic/basic.e16.ts:829  txt = quoted(txt + 1, true)
  lw t0, 0x0102(zero)
  addi a0, t0, 1
  li a1, 1
  call quoted
  sw a0, 0x0102(zero)
  j .L6
.L5:
  ; basic/basic.e16.ts:831  expr()
  call expr
  ; basic/basic.e16.ts:832  formatTop()
  call formatTop
  ; basic/basic.e16.ts:833  puts(addr(textOut))
  la a0, textOut
  call puts
  ; basic/basic.e16.ts:834  nsp -= 8
  lw t0, 0x010a(zero)
  addi t0, t0, -8
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:835  if (next() === CH_SEMI) putc(CH_SPACE)
  call next
  li t0, 59
  bne a0, t0, .L7
  ; basic/basic.e16.ts:835  putc(CH_SPACE)
  li a0, 32
  call putc
.L7:
.L6:
  ; basic/basic.e16.ts:837  joined = separator()
  call separator
  mv s1, a0 ; joined
  ; basic/basic.e16.ts:838  if (!joined && !statementEnds()) fail(E_SYNTAX)
  bnez s1, .L8
  call statementEnds
  bnez a0, .L8
  ; basic/basic.e16.ts:838  fail(E_SYNTAX)
  li a0, 1
  call fail
.L8:
.L3:
  call statementEnds
  beqz a0, .L1
  ; basic/basic.e16.ts:840  if (!joined) newline()
  bnez s1, .L9
  ; basic/basic.e16.ts:840  newline()
  call newline
.L9:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:844 statementEnds() at -O1
;   c in s1
statementEnds:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:845  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:846  return c === 0 || c === CH_COLON || c === T_ELSE
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

; basic/basic.e16.ts:850 quoted(p, show) at -O1
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
  ; basic/basic.e16.ts:851  let q = p
  mv s1, s2 ; q
  ; basic/basic.e16.ts:852  while (peek(q) !== CH_QUOTE && peek(q) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:853  if (show) putc(peek(q))
  beqz s3, .L5
  ; basic/basic.e16.ts:853  putc(peek(q))
  lbu a0, 0(s1)
  call putc
.L5:
  ; basic/basic.e16.ts:854  q++
  addi s1, s1, 1
.L3:
  lbu t0, 0(s1)
  li t1, 34
  beq t0, t1, .L6
  lbu t0, 0(s1)
  bne t0, zero, .L1
.L6:
  ; basic/basic.e16.ts:856  return peek(q) === CH_QUOTE ? q + 1 : q
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

; basic/basic.e16.ts:860 separator() at -O1
;   c in s1
separator:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:861  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:862  if (c === CH_SEMI) {
  li t0, 59
  bne s1, t0, .L1
  ; basic/basic.e16.ts:863  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:864  return true
  li a0, 1
  j .return
.L1:
  ; basic/basic.e16.ts:866  if (c !== CH_COMMA) return false
  li t0, 44
  beq s1, t0, .L2
  ; basic/basic.e16.ts:866  return false
  li a0, 0
  j .return
.L2:
  ; basic/basic.e16.ts:867  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:868  putc(CH_SPACE)
  li a0, 32
  call putc
  ; basic/basic.e16.ts:869  while (peek16(CURX) % 10 !== 0 && peek16(CURX) !== 0) putc(CH_SPACE)
  j .L5
.L3:
  ; basic/basic.e16.ts:869  putc(CH_SPACE)
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
  ; basic/basic.e16.ts:870  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:874 inputStatement() at -O1
;   prompt in s1
;   at in s3
;   n in s2
inputStatement:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  ; basic/basic.e16.ts:875  let prompt: u16 = 0
  li s1, 0 ; prompt
  ; basic/basic.e16.ts:876  if (next() === CH_QUOTE) {
  call next
  li t0, 34
  bne a0, t0, .L1
  ; basic/basic.e16.ts:877  prompt = txt + 1
  lw t0, 0x0102(zero)
  addi s1, t0, 1
  ; basic/basic.e16.ts:878  txt = quoted(prompt, false)
  mv a0, s1
  li a1, 0
  call quoted
  sw a0, 0x0102(zero)
  ; basic/basic.e16.ts:879  if (next() === CH_SEMI || next() === CH_COMMA) txt++
  call next
  li t0, 59
  beq a0, t0, .L3
  call next
  li t0, 44
  bne a0, t0, .L2
.L3:
  ; basic/basic.e16.ts:879  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
.L2:
.L1:
  ; basic/basic.e16.ts:881  readName()
  call readName
  ; basic/basic.e16.ts:882  const at = findVar(true)
  li a0, 1
  call findVar
  mv s3, a0 ; at
  ; basic/basic.e16.ts:883  for (;;) {
.L4:
  ; basic/basic.e16.ts:884  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:885  if (prompt !== 0) quoted(prompt, true)
  beq s1, zero, .L8
  ; basic/basic.e16.ts:885  quoted(prompt, true)
  mv a0, s1
  li a1, 1
  call quoted
.L8:
  ; basic/basic.e16.ts:886  putc(CH_QUESTION)
  li a0, 63
  call putc
  ; basic/basic.e16.ts:887  const n: i16 = readline(addr(lineBuf), 40)
  la a0, lineBuf
  li a1, 40
  call readline
  mv s2, a0 ; n
  ; basic/basic.e16.ts:888  if (n === -2) {
  li t0, 65534
  bne s2, t0, .L9
  ; basic/basic.e16.ts:889  poke16(BRKFLAG, 1)
  li t0, 1
  sw t0, 30(zero)
  ; basic/basic.e16.ts:890  checkBreak()
  call checkBreak
.L9:
  ; basic/basic.e16.ts:892  newline()
  call newline
  ; basic/basic.e16.ts:893  if (n >= 0 && readInput(at)) return
  blt s2, zero, .L4
  mv a0, s3
  call readInput
  beqz a0, .L4
  ; basic/basic.e16.ts:893  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:898 readInput(at) at -O1
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
  ; basic/basic.e16.ts:899  let p = addr(lineBuf)
  la s1, lineBuf
  ; basic/basic.e16.ts:900  while (peek(p) === CH_SPACE) p++
  j .L3
.L1:
  ; basic/basic.e16.ts:900  p++
  addi s1, s1, 1
.L3:
  lbu t0, 0(s1)
  li t1, 32
  beq t0, t1, .L1
  ; basic/basic.e16.ts:901  const minus = peek(p) === CH_MINUS
  lbu t0, 0(s1)
  li t1, 45
  sub t0, t0, t1
  seqz s3, t0
  ; basic/basic.e16.ts:902  if (minus) p++
  beqz s3, .L5
  ; basic/basic.e16.ts:902  p++
  addi s1, s1, 1
.L5:
  ; basic/basic.e16.ts:903  poke16(MATH_A, at)
  li t0, 65362
  sw s2, 0(t0)
  ; basic/basic.e16.ts:904  poke16(MATH_B, p)
  li t0, 65364
  sw s1, 0(t0)
  ; basic/basic.e16.ts:905  poke16(MATH_ARG, 40)
  li t0, 40
  li t1, 65366
  sw t0, 0(t1)
  ; basic/basic.e16.ts:906  poke16(MATH_OP, M_PARSE)
  li t0, 56
  li t1, 65360
  sw t0, 0(t1)
  ; basic/basic.e16.ts:907  const n = peek16(MATH_ARG)
  li t0, 65366
  lw s0, 0(t0)
  ; basic/basic.e16.ts:908  if (peek16(MATH_STATUS) !== 0 || n === 0) return false
  li t0, 65368
  lw t0, 0(t0)
  bne t0, zero, .L7
  bne s0, zero, .L6
.L7:
  ; basic/basic.e16.ts:908  return false
  li a0, 0
  j .return
.L6:
  ; basic/basic.e16.ts:909  if (minus) math(M_NEG, at, 0)
  beqz s3, .L8
  ; basic/basic.e16.ts:909  math(M_NEG, at, 0)
  li a0, 16
  mv a1, s2
  li a2, 0
  call math
.L8:
  ; basic/basic.e16.ts:910  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:913 ifStatement() at -O1
;   holds in s1
ifStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:914  expr()
  call expr
  ; basic/basic.e16.ts:915  const holds = !isZero(top())
  call top
  call isZero
  seqz s1, a0
  ; basic/basic.e16.ts:916  nsp -= 8
  lw t0, 0x010a(zero)
  addi t0, t0, -8
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:917  if (next() === T_THEN) txt++
  call next
  li t0, 136
  bne a0, t0, .L1
  ; basic/basic.e16.ts:917  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
.L1:
  ; basic/basic.e16.ts:918  if (!holds && !skipToElse()) return
  bnez s1, .L2
  call skipToElse
  bnez a0, .L2
  ; basic/basic.e16.ts:918  return
  j .return
.L2:
  ; basic/basic.e16.ts:921  if (isDigit(next())) gotoStatement()
  call next
  call isDigit
  beqz a0, .L3
  ; basic/basic.e16.ts:921  gotoStatement()
  call gotoStatement
  j .L4
.L3:
  ; basic/basic.e16.ts:922  statements()
  call statements
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:926 skipToElse() at -O1
;   quoted in a0
;   c in a1
skipToElse:
  ; basic/basic.e16.ts:927  let quoted = false
  li a0, 0 ; quoted
  ; basic/basic.e16.ts:928  while (peek(txt) !== 0) {
  j .L3
.L1:
  ; basic/basic.e16.ts:929  const c = peek(txt)
  lw t0, 0x0102(zero)
  lbu a1, 0(t0)
  ; basic/basic.e16.ts:930  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:931  if (c === CH_QUOTE) quoted = !quoted
  li t0, 34
  bne a1, t0, .L5
  ; basic/basic.e16.ts:931  quoted = !quoted
  seqz a0, a0
.L5:
  ; basic/basic.e16.ts:932  if (c === T_ELSE && !quoted) return true
  li t0, 137
  bne a1, t0, .L6
  bnez a0, .L6
  ; basic/basic.e16.ts:932  return true
  li a0, 1
  j .return
.L6:
.L3:
  lw t0, 0x0102(zero)
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:934  return false
  li a0, 0
.return:
  ret

; basic/basic.e16.ts:937 gotoStatement() at -O1
;   line in s1
gotoStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:938  const line = findLine(readUnsigned(), true)
  call readUnsigned
  li a1, 1
  call findLine
  mv s1, a0 ; line
  ; basic/basic.e16.ts:939  if (line === 0) fail(E_LINE)
  bne s1, zero, .L1
  ; basic/basic.e16.ts:939  fail(E_LINE)
  li a0, 5
  call fail
.L1:
  ; basic/basic.e16.ts:940  jump(line, line + 4)
  mv a0, s1
  addi a1, s1, 4
  call jump
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:943 gosubStatement() at -O1
;   line in s1
gosubStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:944  const line = findLine(readUnsigned(), true)
  call readUnsigned
  li a1, 1
  call findLine
  mv s1, a0 ; line
  ; basic/basic.e16.ts:945  if (line === 0) fail(E_LINE)
  bne s1, zero, .L1
  ; basic/basic.e16.ts:945  fail(E_LINE)
  li a0, 5
  call fail
.L1:
  ; basic/basic.e16.ts:946  if (gsp >= GOSUB_DEPTH) fail(E_COMPLEX)
  lw t0, 0x010e(zero)
  li t1, 16
  bltu t0, t1, .L2
  ; basic/basic.e16.ts:946  fail(E_COMPLEX)
  li a0, 9
  call fail
.L2:
  ; basic/basic.e16.ts:947  gosubStack[gsp * 2] = curLine
  lw t0, 0x010e(zero)
  slli t0, t0, 1
  slli t0, t0, 1
  lw t1, 0x0104(zero)
  sw t1, gosubStack(t0)
  ; basic/basic.e16.ts:948  gosubStack[gsp * 2 + 1] = txt
  lw t0, 0x010e(zero)
  slli t0, t0, 1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t1, 0x0102(zero)
  sw t1, gosubStack(t0)
  ; basic/basic.e16.ts:949  gsp++
  lw t0, 0x010e(zero)
  addi t0, t0, 1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:950  jump(line, line + 4)
  mv a0, s1
  addi a1, s1, 4
  call jump
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:953 returnStatement() at -O1
returnStatement:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:954  if (gsp === 0) fail(E_RETURN)
  lw t0, 0x010e(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:954  fail(E_RETURN)
  li a0, 7
  call fail
.L1:
  ; basic/basic.e16.ts:955  gsp--
  lw t0, 0x010e(zero)
  addi t0, t0, -1
  sw t0, 0x010e(zero)
  ; basic/basic.e16.ts:956  jump(gosubStack[gsp * 2], gosubStack[gsp * 2 + 1])
  lw t0, 0x010e(zero)
  slli t0, t0, 1
  slli t0, t0, 1
  lw t0, gosubStack(t0)
  lw t1, 0x010e(zero)
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

; basic/basic.e16.ts:960 forStatement() at -O1
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
  ; basic/basic.e16.ts:961  readName()
  call readName
  ; basic/basic.e16.ts:962  const at = findVar(true)
  li a0, 1
  call findVar
  mv s3, a0 ; at
  ; basic/basic.e16.ts:963  expect(CH_EQ)
  li a0, 61
  call expect
  ; basic/basic.e16.ts:964  expr()
  call expr
  ; basic/basic.e16.ts:965  copy8(top(), at)
  call top
  mv a1, s3
  call copy8
  ; basic/basic.e16.ts:966  nsp -= 8
  lw t0, 0x010a(zero)
  addi t0, t0, -8
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:967  if (next() !== T_TO) fail(E_SYNTAX)
  call next
  li t0, 139
  beq a0, t0, .L1
  ; basic/basic.e16.ts:967  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:968  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:969  expr()
  call expr
  ; basic/basic.e16.ts:970  const limit = top()
  call top
  sw a0, 0(fp) ; limit
  ; basic/basic.e16.ts:971  if (next() === T_STEP) {
  call next
  li t0, 140
  bne a0, t0, .L2
  ; basic/basic.e16.ts:972  txt++
  lw t0, 0x0102(zero)
  addi t0, t0, 1
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:973  expr()
  call expr
  j .L3
.L2:
  ; basic/basic.e16.ts:974  setInt(push(), 1)
  call push
  li a1, 1
  call setInt
.L3:
  ; basic/basic.e16.ts:975  const step = top()
  call top
  sw a0, 2(fp) ; step
  ; basic/basic.e16.ts:977  let k: u16 = 0
  li s1, 0 ; k
  ; basic/basic.e16.ts:978  while (k < fsp && peek16(forEntry(k)) !== at) k++
  j .L6
.L4:
  ; basic/basic.e16.ts:978  k++
  addi s1, s1, 1
.L6:
  lw t0, 0x010c(zero)
  bgeu s1, t0, .L8
  mv a0, s1
  call forEntry
  lw t0, 0(a0)
  bne t0, s3, .L4
.L8:
  ; basic/basic.e16.ts:979  fsp = k
  sw s1, 0x010c(zero)
  ; basic/basic.e16.ts:980  if (fsp >= FOR_DEPTH) fail(E_COMPLEX)
  lw t0, 0x010c(zero)
  li t1, 8
  bltu t0, t1, .L9
  ; basic/basic.e16.ts:980  fail(E_COMPLEX)
  li a0, 9
  call fail
.L9:
  ; basic/basic.e16.ts:981  const e = forEntry(fsp)
  lw a0, 0x010c(zero)
  call forEntry
  mv s2, a0 ; e
  ; basic/basic.e16.ts:982  poke16(e, at)
  sw s3, 0(s2)
  ; basic/basic.e16.ts:983  copy8(limit, e + 2)
  lw a0, 0(fp)
  addi a1, s2, 2
  call copy8
  ; basic/basic.e16.ts:984  copy8(step, e + 10)
  lw a0, 2(fp)
  addi a1, s2, 10
  call copy8
  ; basic/basic.e16.ts:985  poke16(e + 18, curLine)
  lw t0, 0x0104(zero)
  sw t0, 18(s2)
  ; basic/basic.e16.ts:986  poke16(e + 20, txt)
  lw t0, 0x0102(zero)
  sw t0, 20(s2)
  ; basic/basic.e16.ts:987  fsp++
  lw t0, 0x010c(zero)
  addi t0, t0, 1
  sw t0, 0x010c(zero)
  ; basic/basic.e16.ts:988  nsp -= 16
  lw t0, 0x010a(zero)
  addi t0, t0, -16
  sw t0, 0x010a(zero)
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; basic/basic.e16.ts:991 forEntry(k) at -O1
;   k in a0
forEntry:
  ; basic/basic.e16.ts:992  return addr(forStack) + k * FOR_SIZE
  li t0, 22
  mul t0, a0, t0
  addi a0, t0, forStack
.return:
  ret

; basic/basic.e16.ts:996 nextStatement() at -O1
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
  ; basic/basic.e16.ts:997  if (fsp === 0) fail(E_NEXT)
  lw t0, 0x010c(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:997  fail(E_NEXT)
  li a0, 6
  call fail
.L1:
  ; basic/basic.e16.ts:998  let k = fsp - 1
  lw t0, 0x010c(zero)
  addi s2, t0, -1
  ; basic/basic.e16.ts:999  if (isLetter(next())) {
  call next
  call isLetter
  beqz a0, .L2
  ; basic/basic.e16.ts:1000  readName()
  call readName
  ; basic/basic.e16.ts:1001  const at = findVar(false)
  li a0, 0
  call findVar
  mv s1, a0 ; at/e
  ; basic/basic.e16.ts:1002  while (peek16(forEntry(k)) !== at) {
  j .L5
.L3:
  ; basic/basic.e16.ts:1003  if (k === 0) fail(E_NEXT)
  bne s2, zero, .L7
  ; basic/basic.e16.ts:1003  fail(E_NEXT)
  li a0, 6
  call fail
.L7:
  ; basic/basic.e16.ts:1004  k--
  addi s2, s2, -1
.L5:
  mv a0, s2
  call forEntry
  lw t0, 0(a0)
  bne t0, s1, .L3
.L2:
  ; basic/basic.e16.ts:1007  const e = forEntry(k)
  mv a0, s2
  call forEntry
  mv s1, a0 ; at/e
  ; basic/basic.e16.ts:1008  const at = peek16(e)
  lw s3, 0(s1)
  ; basic/basic.e16.ts:1009  math(M_ADD, at, e + 10)
  li a0, 1
  mv a1, s3
  addi a2, s1, 10
  call math
  ; basic/basic.e16.ts:1010  math(M_CMP, at, e + 2)
  li a0, 6
  mv a1, s3
  addi a2, s1, 2
  call math
  ; basic/basic.e16.ts:1011  const r = peek16(MATH_RESULT)
  li t0, 65370
  lw t0, 0(t0)
  sw t0, 0(fp) ; r
  ; basic/basic.e16.ts:1013  const up = (peek(e + 10) & 0x80) === 0
  lbu t0, 10(s1)
  andi t0, t0, 128
  sub t0, t0, zero
  seqz t0, t0
  sw t0, 2(fp) ; up
  ; basic/basic.e16.ts:1014  const past = up ? r === 1 : r === 0xffff
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
  ; basic/basic.e16.ts:1015  if (past) {
  lw t0, 4(fp) ; past
  beqz t0, .L10
  ; basic/basic.e16.ts:1016  fsp = k
  sw s2, 0x010c(zero)
  ; basic/basic.e16.ts:1017  return
  j .return
.L10:
  ; basic/basic.e16.ts:1019  fsp = k + 1
  addi t0, s2, 1
  sw t0, 0x010c(zero)
  ; basic/basic.e16.ts:1020  jump(peek16(e + 18), peek16(e + 20))
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

; basic/basic.e16.ts:1023 pokeStatement() at -O1
;   a in s1
pokeStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1024  expr()
  call expr
  ; basic/basic.e16.ts:1025  const a = u16(toInt(top()))
  call top
  call toInt
  mv s1, a0 ; a
  ; basic/basic.e16.ts:1026  nsp -= 8
  lw t0, 0x010a(zero)
  addi t0, t0, -8
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:1027  expect(CH_COMMA)
  li a0, 44
  call expect
  ; basic/basic.e16.ts:1028  expr()
  call expr
  ; basic/basic.e16.ts:1029  poke(a, u16(toInt(top())))
  call top
  call toInt
  sb a0, 0(s1)
  ; basic/basic.e16.ts:1030  nsp -= 8
  lw t0, 0x010a(zero)
  addi t0, t0, -8
  sw t0, 0x010a(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1035 runStatement() at -O1
;   from in s1
runStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1036  let from = PROG
  li s1, 1024 ; from
  ; basic/basic.e16.ts:1037  if (isDigit(next())) {
  call next
  call isDigit
  beqz a0, .L1
  ; basic/basic.e16.ts:1038  from = findLine(readUnsigned(), true)
  call readUnsigned
  li a1, 1
  call findLine
  mv s1, a0 ; from
  ; basic/basic.e16.ts:1039  if (from === 0) fail(E_LINE)
  bne s1, zero, .L2
  ; basic/basic.e16.ts:1039  fail(E_LINE)
  li a0, 5
  call fail
.L2:
.L1:
  ; basic/basic.e16.ts:1041  clearVariables()
  call clearVariables
  ; basic/basic.e16.ts:1042  if (peek16(from) === 0) {
  lw t0, 0(s1)
  bne t0, zero, .L3
  ; basic/basic.e16.ts:1043  endProgram()
  call endProgram
  ; basic/basic.e16.ts:1044  return
  j .return
.L3:
  ; basic/basic.e16.ts:1046  startRun(from, from + 4)
  mv a0, s1
  addi a1, s1, 4
  call startRun
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1049 contStatement() at -O1
contStatement:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1050  if (contLine === 0) fail(E_CONT)
  lw t0, 0x0112(zero)
  bne t0, zero, .L1
  ; basic/basic.e16.ts:1050  fail(E_CONT)
  li a0, 10
  call fail
.L1:
  ; basic/basic.e16.ts:1051  startRun(contLine, contTxt)
  lw t0, 0x0112(zero)
  lw t1, 0x0114(zero)
  mv a0, t0
  mv a1, t1
  call startRun
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1055 startRun(line, text) at -O1
;   line in s1
;   text in s2
startRun:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; line
  mv s2, a1 ; text
  ; basic/basic.e16.ts:1056  running = true
  li t0, 1
  sw t0, 0x0110(zero)
  ; basic/basic.e16.ts:1057  marks()
  call marks
  ; basic/basic.e16.ts:1058  jump(line, text)
  mv a0, s1
  mv a1, s2
  call jump
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; basic/basic.e16.ts:1061 listStatement() at -O1
;   at in s1
listStatement:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1062  let at = PROG
  li s1, 1024 ; at
  ; basic/basic.e16.ts:1063  if (isDigit(next())) at = findLine(readUnsigned(), false)
  call next
  call isDigit
  beqz a0, .L4
  ; basic/basic.e16.ts:1063  at = findLine(readUnsigned(), false)
  call readUnsigned
  li a1, 0
  call findLine
  mv s1, a0 ; at
  ; basic/basic.e16.ts:1064  while (at !== 0 && peek16(at) !== 0) {
  j .L4
.L2:
  ; basic/basic.e16.ts:1065  checkBreak()
  call checkBreak
  ; basic/basic.e16.ts:1066  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1067  printUnsigned(peek16(at))
  lw a0, 0(s1)
  call printUnsigned
  ; basic/basic.e16.ts:1068  putc(CH_SPACE)
  li a0, 32
  call putc
  ; basic/basic.e16.ts:1069  printTokens(at + 4)
  addi a0, s1, 4
  call printTokens
  ; basic/basic.e16.ts:1070  newline()
  call newline
  ; basic/basic.e16.ts:1071  at += peek16(at + 2)
  lw t0, 2(s1)
  add s1, s1, t0
.L4:
  beq s1, zero, .L6
  lw t0, 0(s1)
  bne t0, zero, .L2
.L6:
  ; basic/basic.e16.ts:1073  toLineEnd()
  call toLineEnd
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1079 run() at -O1
;   nextLine in s1
run:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1080  while (running) {
  j .L3
.L1:
  ; basic/basic.e16.ts:1081  if (jumping) {
  lw t0, 0x0116(zero)
  beqz t0, .L5
  ; basic/basic.e16.ts:1082  jumping = false
  sw zero, 0x0116(zero)
  ; basic/basic.e16.ts:1083  curLine = jumpLine
  lw t0, 0x0118(zero)
  sw t0, 0x0104(zero)
  ; basic/basic.e16.ts:1084  txt = jumpTxt
  lw t0, 0x011a(zero)
  sw t0, 0x0102(zero)
  j .L6
.L5:
  ; basic/basic.e16.ts:1086  const nextLine = curLine + peek16(curLine + 2)
  lw t0, 0x0104(zero)
  lw t1, 0x0104(zero)
  lw t1, 2(t1)
  add s1, t0, t1
  ; basic/basic.e16.ts:1087  if (peek16(nextLine) === 0) {
  lw t0, 0(s1)
  bne t0, zero, .L7
  ; basic/basic.e16.ts:1088  running = false
  sw zero, 0x0110(zero)
  ; basic/basic.e16.ts:1089  break
  j .L4
.L7:
  ; basic/basic.e16.ts:1091  curLine = nextLine
  sw s1, 0x0104(zero)
  ; basic/basic.e16.ts:1092  txt = curLine + 4
  lw t0, 0x0104(zero)
  addi t0, t0, 4
  sw t0, 0x0102(zero)
.L6:
  ; basic/basic.e16.ts:1095  if (curLine === 0) {
  lw t0, 0x0104(zero)
  bne t0, zero, .L8
  ; basic/basic.e16.ts:1096  statements()
  call statements
  ; basic/basic.e16.ts:1097  if (!jumping) running = false
  lw t0, 0x0116(zero)
  bnez t0, .L2
  ; basic/basic.e16.ts:1097  running = false
  sw zero, 0x0110(zero)
  ; basic/basic.e16.ts:1098  continue
  j .L2
.L8:
  ; basic/basic.e16.ts:1100  statements()
  call statements
.L2:
.L3:
  lw t0, 0x0110(zero)
  bnez t0, .L1
.L4:
  ; basic/basic.e16.ts:1102  stopRunning()
  call stopRunning
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1106 isCalculation() at -O1
;   c in s1
;   save in s2
;   assigns in s3
isCalculation:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; basic/basic.e16.ts:1107  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1108  if (c >= 0x80) return c >= T_SIN
  li t0, 128
  bltu s1, t0, .L1
  ; basic/basic.e16.ts:1108  return c >= T_SIN
  li t0, 180
  sltu t0, s1, t0
  xori a0, t0, 1
  j .return
.L1:
  ; basic/basic.e16.ts:1109  if (!isLetter(c)) return c !== 0
  mv a0, s1
  call isLetter
  bnez a0, .L2
  ; basic/basic.e16.ts:1109  return c !== 0
  sub t0, s1, zero
  snez a0, t0
  j .return
.L2:
  ; basic/basic.e16.ts:1110  const save = txt
  lw s2, 0x0102(zero)
  ; basic/basic.e16.ts:1111  readName()
  call readName
  ; basic/basic.e16.ts:1112  const assigns = next() === CH_EQ
  call next
  li t0, 61
  sub t0, a0, t0
  seqz s3, t0
  ; basic/basic.e16.ts:1113  txt = save
  sw s2, 0x0102(zero)
  ; basic/basic.e16.ts:1114  return !assigns
  seqz a0, s3
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:1118 calculate() at -O1
;   n in s2
;   cols in s3
;   pad in s1
calculate:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; basic/basic.e16.ts:1119  expr()
  call expr
  ; basic/basic.e16.ts:1120  if (next() !== 0) fail(E_SYNTAX)
  call next
  beq a0, zero, .L1
  ; basic/basic.e16.ts:1120  fail(E_SYNTAX)
  li a0, 1
  call fail
.L1:
  ; basic/basic.e16.ts:1121  copy8(top(), addr(ans))
  call top
  la a1, ans
  call copy8
  ; basic/basic.e16.ts:1122  const n = formatTop()
  call formatTop
  mv s2, a0 ; n
  ; basic/basic.e16.ts:1123  const cols = peek16(COLS)
  lw s3, 4(zero)
  ; basic/basic.e16.ts:1124  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1125  let pad: i16 = i16(cols - n - 1)
  sub t0, s3, s2
  addi s1, t0, -1
  ; basic/basic.e16.ts:1126  while (pad > 0) {
  j .L4
.L2:
  ; basic/basic.e16.ts:1127  putc(CH_SPACE)
  li a0, 32
  call putc
  ; basic/basic.e16.ts:1128  pad--
  addi s1, s1, -1
.L4:
  blt zero, s1, .L2
  ; basic/basic.e16.ts:1130  puts(addr(textOut))
  la a0, textOut
  call puts
  ; basic/basic.e16.ts:1131  newline()
  call newline
  ; basic/basic.e16.ts:1132  nsp -= 8
  lw t0, 0x010a(zero)
  addi t0, t0, -8
  sw t0, 0x010a(zero)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; basic/basic.e16.ts:1136 enter() at -O1
;   length in s3
;   save in s0
;   n in s2
;   c in s1
enter:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  ; basic/basic.e16.ts:1137  const length = tokenize(addr(lineBuf), addr(tokens))
  la a0, lineBuf
  la a1, tokens
  call tokenize
  mv s3, a0 ; length
  ; basic/basic.e16.ts:1138  txt = addr(tokens)
  la t0, tokens
  sw t0, 0x0102(zero)
  ; basic/basic.e16.ts:1139  curLine = 0
  sw zero, 0x0104(zero)
  ; basic/basic.e16.ts:1140  if (isDigit(next())) {
  call next
  call isDigit
  beqz a0, .L1
  ; basic/basic.e16.ts:1141  const save = txt
  lw s0, 0x0102(zero)
  ; basic/basic.e16.ts:1142  const n = readUnsigned()
  call readUnsigned
  mv s2, a0 ; n
  ; basic/basic.e16.ts:1143  const c = next()
  call next
  mv s1, a0 ; c
  ; basic/basic.e16.ts:1145  if (n !== 0 && (isLetter(c) || c >= 0x80 || (c === 0 && proMode))) {
  beq s2, zero, .L2
  mv a0, s1
  call isLetter
  bnez a0, .L3
  li t0, 128
  bgeu s1, t0, .L3
  bne s1, zero, .L2
  lw t0, 0x011c(zero)
  beqz t0, .L2
.L3:
  ; basic/basic.e16.ts:1146  storeLine(n, txt, length - (txt - addr(tokens)))
  lw t0, 0x0102(zero)
  lw t1, 0x0102(zero)
  la t2, tokens
  sub t1, t1, t2
  sub t1, s3, t1
  mv a0, s2
  mv a1, t0
  mv a2, t1
  call storeLine
  ; basic/basic.e16.ts:1147  return
  j .return
.L2:
  ; basic/basic.e16.ts:1149  txt = save
  sw s0, 0x0102(zero)
.L1:
  ; basic/basic.e16.ts:1151  if (isCalculation()) {
  call isCalculation
  beqz a0, .L4
  ; basic/basic.e16.ts:1152  calculate()
  call calculate
  ; basic/basic.e16.ts:1153  return
  j .return
.L4:
  ; basic/basic.e16.ts:1155  jumping = false
  sw zero, 0x0116(zero)
  ; basic/basic.e16.ts:1156  running = false
  sw zero, 0x0110(zero)
  ; basic/basic.e16.ts:1157  statements()
  call statements
  ; basic/basic.e16.ts:1158  if (jumping) {
  lw t0, 0x0116(zero)
  beqz t0, .L5
  ; basic/basic.e16.ts:1159  running = true
  li t0, 1
  sw t0, 0x0110(zero)
  ; basic/basic.e16.ts:1160  marks()
  call marks
  ; basic/basic.e16.ts:1161  run()
  call run
.L5:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; basic/basic.e16.ts:1166 basicLoop() at -O1
;   n in s1
basicLoop:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; basic/basic.e16.ts:1167  nsp = addr(nums)
  la t0, nums
  sw t0, 0x010a(zero)
  ; basic/basic.e16.ts:1168  running = false
  sw zero, 0x0110(zero)
  ; basic/basic.e16.ts:1169  marks()
  call marks
  ; basic/basic.e16.ts:1170  for (;;) {
.L1:
  ; basic/basic.e16.ts:1171  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1172  putc(CH_GT)
  li a0, 62
  call putc
  ; basic/basic.e16.ts:1173  const n: i16 = readline(addr(lineBuf), 78)
  la a0, lineBuf
  li a1, 78
  call readline
  mv s1, a0 ; n
  ; basic/basic.e16.ts:1174  if (n === -3) {
  li t0, 65533
  bne s1, t0, .L5
  ; basic/basic.e16.ts:1175  proMode = !proMode
  lw t0, 0x011c(zero)
  seqz t0, t0
  sw t0, 0x011c(zero)
  ; basic/basic.e16.ts:1176  marks()
  call marks
  ; basic/basic.e16.ts:1177  continue
  j .L1
.L5:
  ; basic/basic.e16.ts:1180  if (n < 0) continue
  bge s1, zero, .L6
  ; basic/basic.e16.ts:1180  continue
  j .L1
.L6:
  ; basic/basic.e16.ts:1181  newline()
  call newline
  ; basic/basic.e16.ts:1182  if (n > 0) enter()
  bge zero, s1, .L1
  ; basic/basic.e16.ts:1182  enter()
  call enter
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; basic/basic.e16.ts:1186 showBanner() at -O1
showBanner:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1187  puts(str('ELEC-16 BASIC 1.0'))
  la a0, str_16
  call puts
  ; basic/basic.e16.ts:1188  newline()
  call newline
  ; basic/basic.e16.ts:1189  printUnsigned(LIMIT - varEnd)
  lw t0, 0x0108(zero)
  li t1, 28672
  sub a0, t1, t0
  call printUnsigned
  ; basic/basic.e16.ts:1190  puts(str(' BYTES FREE'))
  la a0, str_17
  call puts
  ; basic/basic.e16.ts:1191  newline()
  call newline
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1195 basicCold() at -O1
basicCold:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1196  poke16(INBASIC, 1)
  li t0, 1
  sw t0, 28(zero)
  ; basic/basic.e16.ts:1197  poke16(BRKFLAG, 0)
  sw zero, 30(zero)
  ; basic/basic.e16.ts:1199  keepProgramTo(keptProgramEnd())
  call keptProgramEnd
  call keepProgramTo
  ; basic/basic.e16.ts:1200  poke16(MATH_ANGLE, 0)
  li t0, 65372
  sw zero, 0(t0)
  ; basic/basic.e16.ts:1201  angleMarks = ANN_DEG
  li t0, 128
  sw t0, 0x011e(zero)
  ; basic/basic.e16.ts:1202  proMode = false
  sw zero, 0x011c(zero)
  ; basic/basic.e16.ts:1203  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1204  showBanner()
  call showBanner
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; basic/basic.e16.ts:1208 basicWarm() at -O1
basicWarm:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; basic/basic.e16.ts:1209  poke16(INBASIC, 1)
  li t0, 1
  sw t0, 28(zero)
  ; basic/basic.e16.ts:1210  poke16(BRKFLAG, 0)
  sw zero, 30(zero)
  ; basic/basic.e16.ts:1211  fresh_line()
  call fresh_line
  ; basic/basic.e16.ts:1212  showBanner()
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
