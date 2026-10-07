; Made by e16c from lib/kit.e16.ts, lib/sound.e16.ts, engine/main.e16.ts, engine/data.e16.ts, engine/input.e16.ts, engine/fighter.e16.ts, engine/hit.e16.ts, engine/draw.e16.ts, scenes/match.e16.ts, scenes/scenes.e16.ts, cpu/standin.e16.ts, assets.e16.ts: do not edit.

; sprN at 0x0880
; sprShown at 0x0882
; padIs at 0x0884
; padWas at 0x0886
; padDown at 0x0888
; seed at 0x0acc
; muted at 0x0c8e
; opTook at 0x0c90
; seen at 0x0c92
; frame at 0x0c94
; scrollNext at 0x0c96
; phase at 0x0c98
; phaseT at 0x0c9a
; timeLeft at 0x0c9c
; timeT at 0x0c9e
; roundWon at 0x0ca0
; stageNow at 0x1124
; buttonSet at 0x1142
; ringAt at 0x11c4
; hitstop at 0x129e
; camX at 0x12a0
; timeShown at 0x12b6
; round at 0x12b8
; draws at 0x12be
; outcome at 0x12c0
palCopy = 0x0280 ; 512 bytes
oam = 0x0480 ; 1024 bytes
sines = 0x088a ; 512 bytes
atans = 0x0a8a ; 66 bytes
chBank = 0x0ace ; 32 bytes
chSong = 0x0aee ; 32 bytes
chAt = 0x0b0e ; 32 bytes
chLoop = 0x0b2e ; 32 bytes
chWait = 0x0b4e ; 32 bytes
chGate = 0x0b6e ; 32 bytes
chFreq = 0x0b8e ; 32 bytes
lastFreq = 0x0bae ; 32 bytes
chLen = 0x0bce ; 32 bytes
chHeld = 0x0bee ; 32 bytes
chDrop = 0x0c0e ; 32 bytes
chVol = 0x0c2e ; 32 bytes
chInstVol = 0x0c4e ; 32 bytes
chOn = 0x0c6e ; 32 bytes
cpuHeld = 0x0ca2 ; 4 bytes
slMovesB = 0x0ca6 ; 8 bytes
slMovesA = 0x0cae ; 8 bytes
slPosesB = 0x0cb6 ; 8 bytes
slPosesA = 0x0cbe ; 8 bytes
slProfB = 0x0cc6 ; 8 bytes
slProfA = 0x0cce ; 8 bytes
slName = 0x0cd6 ; 8 bytes
mv = 0x0cde ; 832 bytes
pr = 0x101e ; 64 bytes
bx = 0x105e ; 96 bytes
boxPose = 0x10be ; 4 bytes
stTile = 0x10c2 ; 2 bytes
stTilesB = 0x10c4 ; 2 bytes
stTilesA = 0x10c6 ; 2 bytes
stTilesN = 0x10c8 ; 2 bytes
stMapB = 0x10ca ; 2 bytes
stRows = 0x10cc ; 2 bytes
stDataB = 0x10ce ; 2 bytes
stDataA = 0x10d0 ; 2 bytes
stageWords = 0x10d2 ; 82 bytes
opp = 0x1126 ; 16 bytes
ctl = 0x1136 ; 4 bytes
extHeld = 0x113a ; 4 bytes
lastHeld = 0x113e ; 4 bytes
ringH = 0x1144 ; 64 bytes
ringD = 0x1184 ; 64 bytes
fX = 0x11c6 ; 4 bytes
fY = 0x11ca ; 4 bytes
fZ = 0x11ce ; 4 bytes
fVX = 0x11d2 ; 4 bytes
fVY = 0x11d6 ; 4 bytes
fVZ = 0x11da ; 4 bytes
fFace = 0x11de ; 4 bytes
fState = 0x11e2 ; 4 bytes
fStateT = 0x11e6 ; 4 bytes
fLife = 0x11ea ; 4 bytes
fMove = 0x11ee ; 4 bytes
fMoveF = 0x11f2 ; 4 bytes
fHitDone = 0x11f6 ; 4 bytes
fCombo = 0x11fa ; 4 bytes
fComboMax = 0x11fe ; 4 bytes
fStun = 0x1202 ; 4 bytes
fCrouch = 0x1206 ; 4 bytes
fAir = 0x120a ; 4 bytes
fAirUsed = 0x120e ; 4 bytes
fKnock = 0x1212 ; 4 bytes
fJump = 0x1216 ; 4 bytes
fPush = 0x121a ; 4 bytes
fSlot = 0x121e ; 4 bytes
fPose = 0x1222 ; 4 bytes
was = 0x1226 ; 4 bytes
before = 0x122a ; 4 bytes
wb = 0x122e ; 96 bytes
how = 0x128e ; 4 bytes
moveOf = 0x1292 ; 4 bytes
struck = 0x1296 ; 4 bytes
dealt = 0x129a ; 4 bytes
trail = 0x12a2 ; 4 bytes
trailT = 0x12a6 ; 4 bytes
shownLife = 0x12aa ; 4 bytes
shownTrail = 0x12ae ; 4 bytes
lowShown = 0x12b2 ; 4 bytes
wins = 0x12ba ; 4 bytes
choice = 0x12c2 ; 4 bytes
cpuT = 0x12c6 ; 4 bytes
cpuKeep = 0x12ca ; 4 bytes

e16c_init:
  ; sprN = 0
  sw zero, 0x0880(zero)
  ; sprShown = 128
  li t0, 128
  sw t0, 0x0882(zero)
  ; padIs = 0
  sw zero, 0x0884(zero)
  ; padWas = 0
  sw zero, 0x0886(zero)
  ; padDown = 0
  sw zero, 0x0888(zero)
  ; seed = 7467
  li t0, 7467
  sw t0, 0x0acc(zero)
  ; muted = 0
  sw zero, 0x0c8e(zero)
  ; opTook = 0
  sw zero, 0x0c90(zero)
  ; seen = 0
  sw zero, 0x0c92(zero)
  ; frame = 0
  sw zero, 0x0c94(zero)
  ; scrollNext = 0
  sw zero, 0x0c96(zero)
  ; phase = 0
  sw zero, 0x0c98(zero)
  ; phaseT = 0
  sw zero, 0x0c9a(zero)
  ; timeLeft = 99
  li t0, 99
  sw t0, 0x0c9c(zero)
  ; timeT = 0
  sw zero, 0x0c9e(zero)
  ; roundWon = 0
  sw zero, 0x0ca0(zero)
  ; stageNow = 0
  sw zero, 0x1124(zero)
  ; buttonSet = 0
  sw zero, 0x1142(zero)
  ; ringAt = 0
  sw zero, 0x11c4(zero)
  ; hitstop = 0
  sw zero, 0x129e(zero)
  ; camX = 0
  sw zero, 0x12a0(zero)
  ; timeShown = 65535
  li t0, 65535
  sw t0, 0x12b6(zero)
  ; round = 1
  li t0, 1
  sw t0, 0x12b8(zero)
  ; draws = 0
  sw zero, 0x12be(zero)
  ; outcome = 0
  sw zero, 0x12c0(zero)
  ; palCopy, oam: 1536 bytes of 0
  li t0, 0x0280
  li t1, 1536
  mset t0, zero, t1
  ; sines, atans: 578 bytes of 0
  li t0, 0x088a
  li t1, 578
  mset t0, zero, t1
  ; chBank, chSong, chAt, chLoop, chWait, chGate, chFreq, lastFreq, chLen, chHeld, chDrop, chVol, chInstVol, chOn: 448 bytes of 0
  li t0, 0x0ace
  li t1, 448
  mset t0, zero, t1
  ; cpuHeld, slMovesB, slMovesA, slPosesB, slPosesA, slProfB, slProfA, slName, mv, pr, bx, boxPose, stTile, stTilesB, stTilesA, stTilesN, stMapB, stRows, stDataB, stDataA, stageWords: 1154 bytes of 0
  li t0, 0x0ca2
  li t1, 1154
  mset t0, zero, t1
  ; opp, ctl, extHeld, lastHeld: 28 bytes of 0
  li t0, 0x1126
  li t1, 28
  mset t0, zero, t1
  ; ringH, ringD: 128 bytes of 0
  li t0, 0x1144
  li t1, 128
  mset t0, zero, t1
  ; fX, fY, fZ, fVX, fVY, fVZ, fFace, fState, fStateT, fLife, fMove, fMoveF, fHitDone, fCombo, fComboMax, fStun, fCrouch, fAir, fAirUsed, fKnock, fJump, fPush, fSlot, fPose, was, before, wb, how, moveOf, struck, dealt: 216 bytes of 0
  li t0, 0x11c6
  li t1, 216
  mset t0, zero, t1
  ; trail, trailT, shownLife, shownTrail, lowShown: 20 bytes of 0
  li t0, 0x12a2
  li t1, 20
  mset t0, zero, t1
  ; wins: 4 bytes of 0
  li t0, 0x12ba
  li t1, 4
  mset t0, zero, t1
  ; choice, cpuT, cpuKeep: 12 bytes of 0
  li t0, 0x12c2
  li t1, 12
  mset t0, zero, t1
  ret

; lib/kit.e16.ts:85 bank(b) at -O1
;   b in a0
;   old in a1
bank:
  ; lib/kit.e16.ts:86  const old = peek16(IO_BANK)
  li t0, 65284
  lw a1, 0(t0)
  ; lib/kit.e16.ts:87  poke16(IO_BANK, b)
  li t0, 65284
  sw a0, 0(t0)
  ; lib/kit.e16.ts:88  return old
  mv a0, a1
.return:
  ret

; lib/kit.e16.ts:92 vpoke(at, v) at -O1
;   at in a0
;   v in a1
vpoke:
  ; lib/kit.e16.ts:93  poke16(VPAGE, at >> 12)
  srli t0, a0, 12
  li t1, 63490
  sw t0, 0(t1)
  ; lib/kit.e16.ts:94  poke16(VWIN + (at & 0xfff), v)
  andi t0, a0, 4095
  sw a1, -8192(t0)
.return:
  ret

; lib/kit.e16.ts:98 vfill(at, v, n) at -O1
;   at in a0
;   v in a1
;   n in a2
;   p in s1
;   k in a3
vfill:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; lib/kit.e16.ts:99  while (n > 0) {
  j .L3
.L1:
  ; lib/kit.e16.ts:100  poke16(VPAGE, at >> 12)
  srli t0, a0, 12
  li t1, 63490
  sw t0, 0(t1)
  ; lib/kit.e16.ts:101  let p = VWIN + (at & 0xfff)
  andi t0, a0, 4095
  addi s1, t0, -8192
  ; lib/kit.e16.ts:102  let k = div(0x1000 - (at & 0xfff), 2)
  andi t0, a0, 4095
  li t1, 4096
  sub t1, t1, t0
  srli a3, t1, 1
  ; lib/kit.e16.ts:103  if (k > n) k = n
  bgeu a2, a3, .L5
  ; lib/kit.e16.ts:103  k = n
  mv a3, a2 ; k
.L5:
  ; lib/kit.e16.ts:104  n = wrap16(n - k)
  sub a2, a2, a3
  ; lib/kit.e16.ts:105  at = wrap16(at + k * 2)
  slli t0, a3, 1
  add a0, a0, t0
  ; lib/kit.e16.ts:106  while (k > 0) {
  j .L8
.L6:
  ; lib/kit.e16.ts:107  poke16(p, v)
  sw a1, 0(s1)
  ; lib/kit.e16.ts:108  p = wrap16(p + 2)
  addi s1, s1, 2
  ; lib/kit.e16.ts:109  k--
  addi a3, a3, -1
.L8:
  bltu zero, a3, .L6
.L3:
  bltu zero, a2, .L1
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; lib/kit.e16.ts:115 dma(src, dst, len) at -O1
;   src in a0
;   dst in a1
;   len in a2
dma:
  ; lib/kit.e16.ts:116  poke16(DMASRC, src)
  li t0, 63536
  sw a0, 0(t0)
  ; lib/kit.e16.ts:117  poke16(DMADST, dst)
  li t0, 63538
  sw a1, 0(t0)
  ; lib/kit.e16.ts:118  poke16(DMALEN, len)
  li t0, 63540
  sw a2, 0(t0)
  ; lib/kit.e16.ts:119  poke16(DMACTRL, 1)
  li t0, 1
  li t1, 63542
  sw t0, 0(t1)
.return:
  ret

; lib/kit.e16.ts:126 load(b, src, dst, len) at -O1
;   b in s3
;   src in 0(fp)
;   dst in 2(fp)
;   len in s1
;   old in 4(fp)
;   n in s2
load:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s3, a0 ; b
  sw a1, 0(fp) ; src
  sw a2, 2(fp) ; dst
  mv s1, a3 ; len
  ; lib/kit.e16.ts:127  const old = bank(b)
  mv a0, s3
  call bank
  sw a0, 4(fp) ; old
  ; lib/kit.e16.ts:128  while (len > 0) {
  j .L3
.L1:
  ; lib/kit.e16.ts:129  let n = wrap16(0xe000 - src)
  lw t0, 0(fp) ; src
  li t1, 57344
  sub s2, t1, t0
  ; lib/kit.e16.ts:130  if (n > len) n = len
  bgeu s1, s2, .L5
  ; lib/kit.e16.ts:130  n = len
  mv s2, s1 ; n
.L5:
  ; lib/kit.e16.ts:131  dma(src, dst, n)
  lw a0, 0(fp)
  lw a1, 2(fp)
  mv a2, s2
  call dma
  ; lib/kit.e16.ts:132  len = wrap16(len - n)
  sub s1, s1, s2
  ; lib/kit.e16.ts:133  dst = wrap16(dst + n)
  lw t0, 2(fp) ; dst
  add t0, t0, s2
  sw t0, 2(fp) ; dst
  ; lib/kit.e16.ts:134  b++
  addi s3, s3, 1
  ; lib/kit.e16.ts:135  poke16(IO_BANK, b)
  li t0, 65284
  sw s3, 0(t0)
  ; lib/kit.e16.ts:136  src = WINDOW
  li t0, 49152
  sw t0, 0(fp) ; src
.L3:
  bltu zero, s1, .L1
  ; lib/kit.e16.ts:138  poke16(IO_BANK, old)
  lw t0, 4(fp) ; old
  li t1, 65284
  sw t0, 0(t1)
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; lib/kit.e16.ts:142 palette(row, slot) at -O1
;   row in s1
;   slot in s2
palette:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; row
  mv s2, a1 ; slot
  ; lib/kit.e16.ts:143  load(PALETTES_BANK, PALETTES_AT + row * 32, PALS + slot * 32, 32)
  slli t0, s1, 5
  li t1, 49730
  add t1, t1, t0
  slli t0, s2, 5
  li t2, 50176
  add t2, t2, t0
  li a0, 259
  mv a1, t1
  mv a2, t2
  li a3, 32
  call load
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; lib/kit.e16.ts:147 colour(slot, k, rgb) at -O1
;   slot in s1
;   k in s2
;   rgb in s3
colour:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; slot
  mv s2, a1 ; k
  mv s3, a2 ; rgb
  ; lib/kit.e16.ts:148  vpoke(PALS + slot * 32 + k * 2, rgb)
  slli t0, s1, 5
  li t1, 50176
  add t1, t1, t0
  slli t0, s2, 1
  add a0, t1, t0
  mv a1, s3
  call vpoke
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; lib/kit.e16.ts:155 palKeep(row, slot) at -O1
;   row in s2
;   slot in s3
;   old in s0
;   k in s1
palKeep:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; row
  mv s3, a1 ; slot
  ; lib/kit.e16.ts:156  const old = bank(PALETTES_BANK)
  li a0, 259
  call bank
  mv s0, a0 ; old
  ; lib/kit.e16.ts:157  let k: u16 = 0
  li s1, 0 ; k
  ; lib/kit.e16.ts:158  while (k < 16) {
  j .L3
.L1:
  ; lib/kit.e16.ts:159  palCopy[slot * 16 + k] = peek16(PALETTES_AT + row * 32 + k * 2)
  slli t0, s3, 4
  add t0, t0, s1
  slli t0, t0, 1
  slli t1, s2, 5
  li t2, 49730
  add t2, t2, t1
  slli t1, s1, 1
  add t2, t2, t1
  lw t2, 0(t2)
  sw t2, palCopy(t0)
  ; lib/kit.e16.ts:160  k++
  addi s1, s1, 1
.L3:
  li t0, 16
  bltu s1, t0, .L1
  ; lib/kit.e16.ts:162  poke16(IO_BANK, old)
  li t0, 65284
  sw s0, 0(t0)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; lib/kit.e16.ts:169 palMix(slot, rgb, t) at -O1
;   slot in a0
;   rgb in a1
;   t in a2
;   u in s1
;   r in 0(fp)
;   g in 2(fp)
;   b in 4(fp)
;   p in s2
;   k in a3
;   end in 6(fp)
;   c in s3
;   mr in 8(fp)
;   mg in 10(fp)
;   mb in 12(fp)
palMix:
  addi sp, sp, -22
  sw s1, 14(sp)
  sw s2, 16(sp)
  sw s3, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  ; lib/kit.e16.ts:170  const u = 16 - t
  li t0, 16
  sub s1, t0, a2
  ; lib/kit.e16.ts:171  const r = (rgb & 31) * t
  andi t0, a1, 31
  mul t0, t0, a2
  sw t0, 0(fp) ; r
  ; lib/kit.e16.ts:172  const g = ((rgb >> 5) & 31) * t
  srli t0, a1, 5
  andi t0, t0, 31
  mul t0, t0, a2
  sw t0, 2(fp) ; g
  ; lib/kit.e16.ts:173  const b = ((rgb >> 10) & 31) * t
  srli t0, a1, 10
  andi t0, t0, 31
  mul t0, t0, a2
  sw t0, 4(fp) ; b
  ; lib/kit.e16.ts:174  poke16(VPAGE, (PALS + slot * 32) >> 12)
  slli t0, a0, 5
  li t1, 50176
  add t1, t1, t0
  srli t1, t1, 12
  li t0, 63490
  sw t1, 0(t0)
  ; lib/kit.e16.ts:175  let p = VWIN + ((PALS + slot * 32 + 2) & 0xfff)
  slli t0, a0, 5
  li t1, 50176
  add t1, t1, t0
  addi t1, t1, 2
  andi t1, t1, 4095
  addi s2, t1, -8192
  ; lib/kit.e16.ts:176  let k = slot * 16 + 1
  slli t0, a0, 4
  addi a3, t0, 1
  ; lib/kit.e16.ts:177  const end = slot * 16 + 16
  slli t0, a0, 4
  addi t0, t0, 16
  sw t0, 6(fp) ; end
  ; lib/kit.e16.ts:178  while (k < end) {
  j .L3
.L1:
  ; lib/kit.e16.ts:179  const c = palCopy[k]
  slli t0, a3, 1
  lw s3, palCopy(t0)
  ; lib/kit.e16.ts:180  const mr = ((c & 31) * u + r) >> 4
  andi t0, s3, 31
  mul t0, t0, s1
  lw t1, 0(fp) ; r
  add t0, t0, t1
  srli t0, t0, 4
  sw t0, 8(fp) ; mr
  ; lib/kit.e16.ts:181  const mg = (((c >> 5) & 31) * u + g) >> 4
  srli t0, s3, 5
  andi t0, t0, 31
  mul t0, t0, s1
  lw t1, 2(fp) ; g
  add t0, t0, t1
  srli t0, t0, 4
  sw t0, 10(fp) ; mg
  ; lib/kit.e16.ts:182  const mb = (((c >> 10) & 31) * u + b) >> 4
  srli t0, s3, 10
  andi t0, t0, 31
  mul t0, t0, s1
  lw t1, 4(fp) ; b
  add t0, t0, t1
  srli t0, t0, 4
  sw t0, 12(fp) ; mb
  ; lib/kit.e16.ts:183  poke16(p, mr | (mg << 5) | (mb << 10))
  lw t0, 10(fp) ; mg
  slli t0, t0, 5
  lw t1, 8(fp) ; mr
  or t1, t1, t0
  lw t0, 12(fp) ; mb
  slli t0, t0, 10
  or t1, t1, t0
  sw t1, 0(s2)
  ; lib/kit.e16.ts:184  p = wrap16(p + 2)
  addi s2, s2, 2
  ; lib/kit.e16.ts:185  k++
  addi a3, a3, 1
.L3:
  lw t0, 6(fp) ; end
  bltu a3, t0, .L1
.return:
  mv sp, fp
  lw s1, 14(sp)
  lw s2, 16(sp)
  lw s3, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; lib/kit.e16.ts:190 mix(a, b, t) at -O1
;   a in s1
;   b in s2
;   t in s3
;   r in 0(fp)
;   g in 2(fp)
;   bl in 4(fp)
mix:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s1, a0 ; a
  mv s2, a1 ; b
  mv s3, a2 ; t
  ; lib/kit.e16.ts:191  const r = mixPart(a & 31, b & 31, t)
  andi t0, s1, 31
  andi t1, s2, 31
  mv a0, t0
  mv a1, t1
  mv a2, s3
  call mixPart
  sw a0, 0(fp) ; r
  ; lib/kit.e16.ts:192  const g = mixPart((a >> 5) & 31, (b >> 5) & 31, t)
  srli t0, s1, 5
  andi t0, t0, 31
  srli t1, s2, 5
  andi t1, t1, 31
  mv a0, t0
  mv a1, t1
  mv a2, s3
  call mixPart
  sw a0, 2(fp) ; g
  ; lib/kit.e16.ts:193  const bl = mixPart((a >> 10) & 31, (b >> 10) & 31, t)
  srli t0, s1, 10
  andi t0, t0, 31
  srli t1, s2, 10
  andi t1, t1, 31
  mv a0, t0
  mv a1, t1
  mv a2, s3
  call mixPart
  sw a0, 4(fp) ; bl
  ; lib/kit.e16.ts:194  return r | (g << 5) | (bl << 10)
  lw t0, 2(fp) ; g
  slli t0, t0, 5
  lw t1, 0(fp) ; r
  or t1, t1, t0
  lw t0, 4(fp) ; bl
  slli t0, t0, 10
  or a0, t1, t0
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; lib/kit.e16.ts:197 mixPart(a, b, t) at -O1
;   a in a0
;   b in a1
;   t in a2
mixPart:
  ; lib/kit.e16.ts:198  return (a * (16 - t) + b * t) >> 4
  li t0, 16
  sub t0, t0, a2
  mul t0, a0, t0
  mul t1, a1, a2
  add t0, t0, t1
  srli a0, t0, 4
.return:
  ret

; lib/kit.e16.ts:204 cellAt(layer, x, y) at -O1
;   layer in a0
;   x in a1
;   y in a2
cellAt:
  ; lib/kit.e16.ts:205  return (layer === 0 ? MAP0 : MAP1) + ((y & 63) << 7) + ((x & 63) << 1)
  bne a0, zero, .L1
  li t0, 32768
  j .L2
.L1:
  li t0, 40960
.L2:
  andi t1, a2, 63
  slli t1, t1, 7
  add t0, t0, t1
  andi t1, a1, 63
  slli t1, t1, 1
  add a0, t0, t1
.return:
  ret

; lib/kit.e16.ts:212 mapRow(b, src, layer, y) at -O1
;   b in s1
;   src in s2
;   layer in s3
;   y in 0(fp)
;   old in 2(fp)
mapRow:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; b
  mv s2, a1 ; src
  mv s3, a2 ; layer
  sw a3, 0(fp) ; y
  ; lib/kit.e16.ts:213  const old = bank(b)
  mv a0, s1
  call bank
  sw a0, 2(fp) ; old
  ; lib/kit.e16.ts:214  dma(src, cellAt(layer, 0, y), 128)
  mv a0, s3
  li a1, 0
  lw a2, 0(fp)
  call cellAt
  mv a1, a0
  mv a0, s2
  li a2, 128
  call dma
  ; lib/kit.e16.ts:215  poke16(IO_BANK, old)
  lw t0, 2(fp) ; old
  li t1, 65284
  sw t0, 0(t1)
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; lib/kit.e16.ts:219 text(at, s, font) at -O1
;   at in s2
;   s in s1
;   font in s0
;   c in s3
text:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s0, 6(sp)
  sw s3, 8(sp)
  mv s2, a0 ; at
  mv s1, a1 ; s
  mv s0, a2 ; font
  ; lib/kit.e16.ts:220  let c = peek(s)
  lbu s3, 0(s1)
  ; lib/kit.e16.ts:221  while (c !== 0) {
  j .L3
.L1:
  ; lib/kit.e16.ts:222  vpoke(at, font + c - 32)
  add t0, s0, s3
  mv a0, s2
  addi a1, t0, -32
  call vpoke
  ; lib/kit.e16.ts:223  at = wrap16(at + 2)
  addi s2, s2, 2
  ; lib/kit.e16.ts:224  s++
  addi s1, s1, 1
  ; lib/kit.e16.ts:225  c = peek(s)
  lbu s3, 0(s1)
.L3:
  bne s3, zero, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; lib/kit.e16.ts:230 number(at, n, digits, zero) at -O1
;   at in s1
;   n in s3
;   digits in s2
;   zero in 2(fp)
;   q in 0(fp)
number:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; at
  mv s3, a1 ; n
  mv s2, a2 ; digits
  sw a3, 2(fp) ; zero
  ; lib/kit.e16.ts:231  at = wrap16(at + digits * 2)
  slli t0, s2, 1
  add s1, s1, t0
  ; lib/kit.e16.ts:232  while (digits > 0) {
  j .L3
.L1:
  ; lib/kit.e16.ts:233  at = wrap16(at - 2)
  addi s1, s1, -2
  ; lib/kit.e16.ts:235  const q = div(n, 10)
  li t0, 10
  divu t0, s3, t0
  sw t0, 0(fp) ; q
  ; lib/kit.e16.ts:236  vpoke(at, wrap16(zero + n - q * 10))
  lw t0, 2(fp) ; zero
  add t0, t0, s3
  lw t1, 0(fp) ; q
  slli t2, t1, 3
  slli t1, t1, 1
  add t1, t1, t2
  sub t0, t0, t1
  mv a0, s1
  mv a1, t0
  call vpoke
  ; lib/kit.e16.ts:237  n = q
  lw s3, 0(fp) ; q
  ; lib/kit.e16.ts:238  digits--
  addi s2, s2, -1
.L3:
  bltu zero, s2, .L1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; lib/kit.e16.ts:250 sprBegin() at -O1
sprBegin:
  ; lib/kit.e16.ts:251  sprN = 0
  sw zero, 0x0880(zero)
.return:
  ret

; lib/kit.e16.ts:255 spr(x, y, tile, size) at -O1
;   x in a0
;   y in a1
;   tile in a2
;   size in a3
;   k in s1
spr:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; lib/kit.e16.ts:256  if (sprN >= 128) return
  lw t0, 0x0880(zero)
  li t1, 128
  bltu t0, t1, .L1
  ; lib/kit.e16.ts:256  return
  j .return
.L1:
  ; lib/kit.e16.ts:257  const k = sprN << 2
  lw t0, 0x0880(zero)
  slli s1, t0, 2
  ; lib/kit.e16.ts:258  oam[k] = u16(x)
  slli t0, s1, 1
  sw a0, oam(t0)
  ; lib/kit.e16.ts:259  oam[k + 1] = u16(y)
  addi t0, s1, 1
  slli t0, t0, 1
  sw a1, oam(t0)
  ; lib/kit.e16.ts:260  oam[k + 2] = tile
  addi t0, s1, 2
  slli t0, t0, 1
  sw a2, oam(t0)
  ; lib/kit.e16.ts:261  oam[k + 3] = size
  addi t0, s1, 3
  slli t0, t0, 1
  sw a3, oam(t0)
  ; lib/kit.e16.ts:262  sprN++
  lw t0, 0x0880(zero)
  addi t0, t0, 1
  sw t0, 0x0880(zero)
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; lib/kit.e16.ts:266 sprCount() at -O1
sprCount:
  ; lib/kit.e16.ts:267  return sprN
  lw a0, 0x0880(zero)
.return:
  ret

; lib/kit.e16.ts:275 sprShow() at -O1
;   k in s1
;   was in s2
;   n in s3
sprShow:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; lib/kit.e16.ts:276  let k = sprN
  lw s1, 0x0880(zero)
  ; lib/kit.e16.ts:277  const was = sprShown
  lw s2, 0x0882(zero)
  ; lib/kit.e16.ts:278  while (k < was) {
  j .L3
.L1:
  ; lib/kit.e16.ts:279  oam[(k << 2) + 3] = S_NONE
  slli t0, s1, 2
  addi t0, t0, 3
  slli t0, t0, 1
  li t1, 3
  sw t1, oam(t0)
  ; lib/kit.e16.ts:280  k++
  addi s1, s1, 1
.L3:
  bltu s1, s2, .L1
  ; lib/kit.e16.ts:282  sprShown = sprN
  lw t0, 0x0880(zero)
  sw t0, 0x0882(zero)
  ; lib/kit.e16.ts:283  const n = sprN > was ? sprN : was
  lw t0, 0x0880(zero)
  bgeu s2, t0, .L5
  lw t0, 0x0880(zero)
  j .L6
.L5:
  mv t0, s2
.L6:
  mv s3, t0 ; n
  ; lib/kit.e16.ts:284  if (n > 0) dma(addr(oam), OAM, n << 3)
  bgeu zero, s3, .L7
  ; lib/kit.e16.ts:284  dma(addr(oam), OAM, n << 3)
  slli t0, s3, 3
  la a0, oam
  li a1, 49152
  mv a2, t0
  call dma
.L7:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; lib/kit.e16.ts:298 padRead() at -O1
;   hit in a0
padRead:
  ; lib/kit.e16.ts:299  const hit = peek16(PADHIT)
  li t0, 63506
  lw a0, 0(t0)
  ; lib/kit.e16.ts:300  poke16(PADHIT, hit)
  li t0, 63506
  sw a0, 0(t0)
  ; lib/kit.e16.ts:301  padWas = padIs
  lw t0, 0x0884(zero)
  sw t0, 0x0886(zero)
  ; lib/kit.e16.ts:302  padIs = peek16(PAD)
  li t0, 63504
  lw t0, 0(t0)
  sw t0, 0x0884(zero)
  ; lib/kit.e16.ts:303  padDown = (hit | padIs) & ~padWas
  lw t0, 0x0884(zero)
  or t0, a0, t0
  lw t1, 0x0886(zero)
  not t1, t1
  and t0, t0, t1
  sw t0, 0x0888(zero)
.return:
  ret

; lib/kit.e16.ts:307 held(mask) at -O1
;   mask in a0
held:
  ; lib/kit.e16.ts:308  return (padIs & mask) === mask
  lw t0, 0x0884(zero)
  and t0, t0, a0
  sub t0, t0, a0
  seqz a0, t0
.return:
  ret

; lib/kit.e16.ts:312 pressed(mask) at -O1
;   mask in a0
pressed:
  ; lib/kit.e16.ts:313  return (padDown & mask) !== 0
  lw t0, 0x0888(zero)
  and t0, t0, a0
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; lib/kit.e16.ts:317 padNow() at -O1
padNow:
  ; lib/kit.e16.ts:318  return padIs
  lw a0, 0x0884(zero)
.return:
  ret

; lib/kit.e16.ts:330 kitInit() at -O1
;   old in s2
;   k in s1
kitInit:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; lib/kit.e16.ts:331  const old = bank(KIT_TABLES_BANK)
  li a0, 259
  call bank
  mv s2, a0 ; old
  ; lib/kit.e16.ts:332  let k: u16 = 0
  li s1, 0 ; k
  ; lib/kit.e16.ts:333  while (k < 256) {
  j .L3
.L1:
  ; lib/kit.e16.ts:334  sines[k] = peek16(KIT_SIN_AT + k * 2)
  slli t0, s1, 1
  slli t1, s1, 1
  li t2, 49152
  add t2, t2, t1
  lw t2, 0(t2)
  sw t2, sines(t0)
  ; lib/kit.e16.ts:335  k++
  addi s1, s1, 1
.L3:
  li t0, 256
  bltu s1, t0, .L1
  ; lib/kit.e16.ts:337  k = 0
  li s1, 0 ; k
  ; lib/kit.e16.ts:338  while (k < 33) {
  j .L7
.L5:
  ; lib/kit.e16.ts:339  atans[k] = peek16(KIT_ATAN_AT + k * 2)
  slli t0, s1, 1
  slli t1, s1, 1
  li t2, 49664
  add t2, t2, t1
  lw t2, 0(t2)
  sw t2, atans(t0)
  ; lib/kit.e16.ts:340  k++
  addi s1, s1, 1
.L7:
  li t0, 33
  bltu s1, t0, .L5
  ; lib/kit.e16.ts:342  poke16(IO_BANK, old)
  li t0, 65284
  sw s2, 0(t0)
  ; lib/kit.e16.ts:345  padIs = peek16(PAD)
  li t0, 63504
  lw t0, 0(t0)
  sw t0, 0x0884(zero)
  ; lib/kit.e16.ts:346  padWas = padIs
  sw t0, 0x0886(zero)
  ; lib/kit.e16.ts:347  padDown = 0
  sw zero, 0x0888(zero)
  ; lib/kit.e16.ts:348  poke16(PADHIT, 0xfff)
  li t0, 4095
  li t1, 63506
  sw t0, 0(t1)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; lib/kit.e16.ts:352 sin(a) at -O1
;   a in a0
sin:
  ; lib/kit.e16.ts:353  return i16(sines[a & 255])
  andi t0, a0, 255
  slli t0, t0, 1
  lw a0, sines(t0)
.return:
  ret

; lib/kit.e16.ts:357 cos(a) at -O1
;   a in a0
cos:
  ; lib/kit.e16.ts:358  return i16(sines[(a + 64) & 255])
  addi t0, a0, 64
  andi t0, t0, 255
  slli t0, t0, 1
  lw a0, sines(t0)
.return:
  ret

; lib/kit.e16.ts:362 aim(dx, dy) at -O1
;   dx in a0
;   dy in a1
;   ax in a2
;   ay in a3
;   a in s1
aim:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; lib/kit.e16.ts:363  let ax = dx < 0 ? u16(-dx) : u16(dx)
  bge a0, zero, .L1
  neg t0, a0
  j .L2
.L1:
  mv t0, a0
.L2:
  mv a2, t0 ; ax
  ; lib/kit.e16.ts:364  let ay = dy < 0 ? u16(-dy) : u16(dy)
  bge a1, zero, .L3
  neg t0, a1
  j .L4
.L3:
  mv t0, a1
.L4:
  mv a3, t0 ; ay
  ; lib/kit.e16.ts:365  if (ax === 0 && ay === 0) return 64
  bne a2, zero, .L8
  bne a3, zero, .L8
  ; lib/kit.e16.ts:365  return 64
  li a0, 64
  j .return
  ; lib/kit.e16.ts:368  while (ax >= 1024 || ay >= 1024) {
.L6:
  ; lib/kit.e16.ts:369  ax = ax >> 1
  srli a2, a2, 1
  ; lib/kit.e16.ts:370  ay = ay >> 1
  srli a3, a3, 1
.L8:
  li t0, 1024
  bgeu a2, t0, .L6
  li t0, 1024
  bgeu a3, t0, .L6
  ; lib/kit.e16.ts:373  let a: u16 = 0
  li s1, 0 ; a
  ; lib/kit.e16.ts:374  if (ax >= ay) a = atans[div(ay * 32 + (ax >> 1), ax)]
  bltu a2, a3, .L10
  ; lib/kit.e16.ts:374  a = atans[div(ay * 32 + (ax >> 1), ax)]
  slli t0, a3, 5
  srli t1, a2, 1
  add t0, t0, t1
  divu t0, t0, a2
  slli t0, t0, 1
  lw s1, atans(t0)
  j .L11
.L10:
  ; lib/kit.e16.ts:375  a = 64 - atans[div(ax * 32 + (ay >> 1), ay)]
  slli t0, a2, 5
  srli t1, a3, 1
  add t0, t0, t1
  divu t0, t0, a3
  slli t0, t0, 1
  lw t0, atans(t0)
  li t1, 64
  sub s1, t1, t0
.L11:
  ; lib/kit.e16.ts:376  if (dx < 0) a = 128 - a
  bge a0, zero, .L12
  ; lib/kit.e16.ts:376  a = 128 - a
  li t0, 128
  sub s1, t0, s1
.L12:
  ; lib/kit.e16.ts:377  if (dy < 0) a = wrap16(256 - a)
  bge a1, zero, .L13
  ; lib/kit.e16.ts:377  a = wrap16(256 - a)
  li t0, 256
  sub s1, t0, s1
.L13:
  ; lib/kit.e16.ts:378  return a & 255
  andi a0, s1, 255
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; lib/kit.e16.ts:382 rand() at -O1
;   x in a0
rand:
  ; lib/kit.e16.ts:383  let x = seed
  lw a0, 0x0acc(zero)
  ; lib/kit.e16.ts:384  x = wrap16(x ^ (x << 7))
  slli t0, a0, 7
  xor a0, a0, t0
  ; lib/kit.e16.ts:385  x = x ^ (x >> 9)
  srli t0, a0, 9
  xor a0, a0, t0
  ; lib/kit.e16.ts:386  x = wrap16(x ^ (x << 8))
  slli t0, a0, 8
  xor a0, a0, t0
  ; lib/kit.e16.ts:387  seed = x
  sw a0, 0x0acc(zero)
  ; lib/kit.e16.ts:388  return x
.return:
  ret

; lib/kit.e16.ts:392 randBelow(n) at -O1
;   n in s1
randBelow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; lib/kit.e16.ts:393  return u16(mulShift(i16(rand() >> 8), i16(n), 8))
  call rand
  srli t0, a0, 8
  mulq a0, t0, s1, 8
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; lib/kit.e16.ts:397 randSeed(s) at -O1
;   s in a0
randSeed:
  ; lib/kit.e16.ts:398  seed = s === 0 ? 0x1d2b : s
  bne a0, zero, .L1
  li t0, 7467
  j .L2
.L1:
  mv t0, a0
.L2:
  sw t0, 0x0acc(zero)
.return:
  ret

; lib/kit.e16.ts:404 scoreAdd(at, n) at -O1
;   at in a0
;   n in a1
;   lo in a2
;   hi in a3
scoreAdd:
  ; lib/kit.e16.ts:405  let lo = peek16(at) + n
  lw t0, 0(a0)
  add a2, t0, a1
  ; lib/kit.e16.ts:406  let hi = peek16(at + 2)
  lw a3, 2(a0)
  ; lib/kit.e16.ts:407  while (lo >= 10000) {
  j .L3
.L1:
  ; lib/kit.e16.ts:408  lo = lo - 10000
  li t0, 10000
  sub a2, a2, t0
  ; lib/kit.e16.ts:409  hi++
  addi a3, a3, 1
.L3:
  li t0, 10000
  bgeu a2, t0, .L1
  ; lib/kit.e16.ts:411  if (hi > 9999) {
  li t0, 9999
  bgeu t0, a3, .L5
  ; lib/kit.e16.ts:412  hi = 9999
  li a3, 9999 ; hi
  ; lib/kit.e16.ts:413  lo = 9999
  li a2, 9999 ; lo
.L5:
  ; lib/kit.e16.ts:415  poke16(at, lo)
  sw a2, 0(a0)
  ; lib/kit.e16.ts:416  poke16(at + 2, hi)
  sw a3, 2(a0)
.return:
  ret

; lib/kit.e16.ts:420 scoreMore(a, b) at -O1
;   a in a0
;   b in a1
;   ah in a2
;   bh in a3
scoreMore:
  ; lib/kit.e16.ts:421  const ah = peek16(a + 2)
  lw a2, 2(a0)
  ; lib/kit.e16.ts:422  const bh = peek16(b + 2)
  lw a3, 2(a1)
  ; lib/kit.e16.ts:423  return ah > bh || (ah === bh && peek16(a) > peek16(b))
  sltu t0, a3, a2
  mv t1, t0
  bnez t1, .L1
  sub t0, a2, a3
  seqz t0, t0
  mv t1, t0
  beqz t1, .L2
  lw t0, 0(a0)
  lw t1, 0(a1)
  sltu t0, t1, t0
.L2:
.L1:
  mv a0, t0
.return:
  ret

; lib/kit.e16.ts:427 scoreShow(cell, at, zero) at -O1
;   cell in s1
;   at in s2
;   zero in s3
scoreShow:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; cell
  mv s2, a1 ; at
  mv s3, a2 ; zero
  ; lib/kit.e16.ts:428  number(cell, peek16(at + 2), 4, zero)
  lw t0, 2(s2)
  mv a0, s1
  mv a1, t0
  li a2, 4
  mv a3, s3
  call number
  ; lib/kit.e16.ts:429  number(wrap16(cell + 8), peek16(at), 4, zero)
  lw t0, 0(s2)
  addi a0, s1, 8
  mv a1, t0
  li a2, 4
  mv a3, s3
  call number
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; lib/kit.e16.ts:435 saveRead(off) at -O1
;   off in s1
;   old in s2
;   v in s3
saveRead:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; off
  ; lib/kit.e16.ts:436  const old = bank(SAVE_BANK)
  li a0, 128
  call bank
  mv s2, a0 ; old
  ; lib/kit.e16.ts:437  const v = peek16(WINDOW + (off & SAVE_MASK))
  andi t0, s1, 8190
  li t1, 49152
  add t1, t1, t0
  lw s3, 0(t1)
  ; lib/kit.e16.ts:438  poke16(IO_BANK, old)
  li t0, 65284
  sw s2, 0(t0)
  ; lib/kit.e16.ts:439  return v
  mv a0, s3
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; lib/kit.e16.ts:443 saveWrite(off, v) at -O1
;   off in s1
;   v in s2
;   old in s3
saveWrite:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; off
  mv s2, a1 ; v
  ; lib/kit.e16.ts:444  const old = bank(SAVE_BANK)
  li a0, 128
  call bank
  mv s3, a0 ; old
  ; lib/kit.e16.ts:445  poke16(WINDOW + (off & SAVE_MASK), v)
  andi t0, s1, 8190
  li t1, 49152
  add t1, t1, t0
  sw s2, 0(t1)
  ; lib/kit.e16.ts:446  poke16(IO_BANK, old)
  li t0, 65284
  sw s3, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; lib/sound.e16.ts:58 soundInit() at -O1
;   c in s1
soundInit:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; lib/sound.e16.ts:59  let c: u16 = 0
  li s1, 0 ; c
  ; lib/sound.e16.ts:60  while (c < 16) {
  j .L3
.L1:
  ; lib/sound.e16.ts:61  stopChannel(c)
  mv a0, s1
  call stopChannel
  ; lib/sound.e16.ts:62  c++
  addi s1, s1, 1
.L3:
  li t0, 16
  bltu s1, t0, .L1
  ; lib/sound.e16.ts:64  poke16(MASTER, 15)
  li t0, 15
  li t1, 63568
  sw t0, 0(t1)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; lib/sound.e16.ts:67 stopChannel(c) at -O1
;   c in a0
stopChannel:
  ; lib/sound.e16.ts:68  chOn[c] = 0
  slli t0, a0, 1
  sw zero, chOn(t0)
  ; lib/sound.e16.ts:69  poke16(CHSEL, c)
  li t0, 63552
  sw a0, 0(t0)
  ; lib/sound.e16.ts:70  poke16(KEY, 0)
  li t0, 63566
  sw zero, 0(t0)
.return:
  ret

; lib/sound.e16.ts:74 play(b, at, music) at -O1
;   b in 4(fp)
;   at in s3
;   music in 6(fp)
;   old in 8(fp)
;   c/n in s2
;   k in 0(fp)
;   head in 2(fp)
;   c in s1
play:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s3, 12(sp)
  sw s2, 14(sp)
  sw s1, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  sw a0, 4(fp) ; b
  mv s3, a1 ; at
  sw a2, 6(fp) ; music
  ; lib/sound.e16.ts:75  const old = bank(b)
  lw a0, 4(fp)
  call bank
  sw a0, 8(fp) ; old
  ; lib/sound.e16.ts:76  if (music) {
  lw t0, 6(fp) ; music
  beqz t0, .L1
  ; lib/sound.e16.ts:77  let c: u16 = 0
  li s2, 0 ; c/n
  ; lib/sound.e16.ts:78  while (c < 12) {
  j .L4
.L2:
  ; lib/sound.e16.ts:79  stopChannel(c)
  mv a0, s2
  call stopChannel
  ; lib/sound.e16.ts:80  c++
  addi s2, s2, 1
.L4:
  li t0, 12
  bltu s2, t0, .L2
.L1:
  ; lib/sound.e16.ts:83  const n = peek(at)
  lbu s2, 0(s3)
  ; lib/sound.e16.ts:84  let k: u16 = 0
  sw zero, 0(fp) ; k
  ; lib/sound.e16.ts:85  while (k < n) {
  j .L8
.L6:
  ; lib/sound.e16.ts:86  const head = at + 2 + k * 6
  lw t0, 0(fp) ; k
  slli t1, t0, 2
  slli t0, t0, 1
  add t0, t0, t1
  addi t1, s3, 2
  add t1, t1, t0
  sw t1, 2(fp) ; head
  ; lib/sound.e16.ts:87  const c = peek(head) & 15
  lw t0, 2(fp) ; head
  lbu t0, 0(t0)
  andi s1, t0, 15
  ; lib/sound.e16.ts:88  chBank[c] = b
  slli t0, s1, 1
  lw t1, 4(fp) ; b
  sw t1, chBank(t0)
  ; lib/sound.e16.ts:89  chSong[c] = at
  slli t0, s1, 1
  sw s3, chSong(t0)
  ; lib/sound.e16.ts:90  chAt[c] = at + peek16(head + 2)
  slli t0, s1, 1
  lw t1, 2(fp) ; head
  lw t1, 2(t1)
  add t1, s3, t1
  sw t1, chAt(t0)
  ; lib/sound.e16.ts:91  chLoop[c] = peek16(head + 4)
  slli t0, s1, 1
  lw t1, 2(fp) ; head
  lw t1, 4(t1)
  sw t1, chLoop(t0)
  ; lib/sound.e16.ts:92  chWait[c] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, chWait(t0)
  ; lib/sound.e16.ts:93  chGate[c] = 0
  slli t0, s1, 1
  sw zero, chGate(t0)
  ; lib/sound.e16.ts:94  chDrop[c] = 0
  slli t0, s1, 1
  sw zero, chDrop(t0)
  ; lib/sound.e16.ts:95  chVol[c] = 15
  slli t0, s1, 1
  li t1, 15
  sw t1, chVol(t0)
  ; lib/sound.e16.ts:96  chInstVol[c] = 15
  slli t0, s1, 1
  li t1, 15
  sw t1, chInstVol(t0)
  ; lib/sound.e16.ts:97  chOn[c] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, chOn(t0)
  ; lib/sound.e16.ts:98  poke16(CHSEL, c)
  li t0, 63552
  sw s1, 0(t0)
  ; lib/sound.e16.ts:99  poke16(KEY, 0)
  li t0, 63566
  sw zero, 0(t0)
  ; lib/sound.e16.ts:100  k++
  lw t0, 0(fp) ; k
  addi t0, t0, 1
  sw t0, 0(fp) ; k
.L8:
  lw t0, 0(fp) ; k
  bltu t0, s2, .L6
  ; lib/sound.e16.ts:102  poke16(IO_BANK, old)
  lw t0, 8(fp) ; old
  li t1, 65284
  sw t0, 0(t1)
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s3, 12(sp)
  lw s2, 14(sp)
  lw s1, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; lib/sound.e16.ts:106 musicStop() at -O1
;   c in s1
musicStop:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; lib/sound.e16.ts:107  let c: u16 = 0
  li s1, 0 ; c
  ; lib/sound.e16.ts:108  while (c < 12) {
  j .L3
.L1:
  ; lib/sound.e16.ts:109  stopChannel(c)
  mv a0, s1
  call stopChannel
  ; lib/sound.e16.ts:110  c++
  addi s1, s1, 1
.L3:
  li t0, 12
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; lib/sound.e16.ts:115 musicMute(mask) at -O1
;   mask in a0
musicMute:
  ; lib/sound.e16.ts:116  muted = mask
  sw a0, 0x0c8e(zero)
.return:
  ret

; lib/sound.e16.ts:120 soundMaster(v) at -O1
;   v in a0
soundMaster:
  ; lib/sound.e16.ts:121  poke16(MASTER, v & 15)
  andi t0, a0, 15
  li t1, 63568
  sw t0, 0(t1)
.return:
  ret

; lib/sound.e16.ts:125 soundTick() at -O1
;   old in s2
;   c in s1
soundTick:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; lib/sound.e16.ts:126  const old = peek16(IO_BANK)
  li t0, 65284
  lw s2, 0(t0)
  ; lib/sound.e16.ts:127  let c: u16 = 0
  li s1, 0 ; c
  ; lib/sound.e16.ts:128  while (c < 16) {
  j .L3
.L1:
  ; lib/sound.e16.ts:129  if (chOn[c] !== 0) tickChannel(c)
  slli t0, s1, 1
  lw t0, chOn(t0)
  beq t0, zero, .L5
  ; lib/sound.e16.ts:129  tickChannel(c)
  mv a0, s1
  call tickChannel
.L5:
  ; lib/sound.e16.ts:130  c++
  addi s1, s1, 1
.L3:
  li t0, 16
  bltu s1, t0, .L1
  ; lib/sound.e16.ts:132  poke16(IO_BANK, old)
  li t0, 65284
  sw s2, 0(t0)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; lib/sound.e16.ts:135 tickChannel(c) at -O1
;   c in s1
;   f in s2
tickChannel:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; c
  ; lib/sound.e16.ts:136  if (chGate[c] > 0) {
  slli t0, s1, 1
  lw t0, chGate(t0)
  bgeu zero, t0, .L1
  ; lib/sound.e16.ts:137  chGate[c] = chGate[c] - 1
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, chGate(t1)
  addi t1, t1, -1
  sw t1, chGate(t0)
  ; lib/sound.e16.ts:138  if (chGate[c] === 0) {
  slli t0, s1, 1
  lw t0, chGate(t0)
  bne t0, zero, .L2
  ; lib/sound.e16.ts:139  poke16(CHSEL, c)
  li t0, 63552
  sw s1, 0(t0)
  ; lib/sound.e16.ts:140  poke16(KEY, 0)
  li t0, 63566
  sw zero, 0(t0)
.L2:
.L1:
  ; lib/sound.e16.ts:143  if (chDrop[c] !== 0 && chGate[c] > 0) {
  slli t0, s1, 1
  lw t0, chDrop(t0)
  beq t0, zero, .L3
  slli t0, s1, 1
  lw t0, chGate(t0)
  bgeu zero, t0, .L3
  ; lib/sound.e16.ts:144  const f = chFreq[c]
  slli t0, s1, 1
  lw s2, chFreq(t0)
  ; lib/sound.e16.ts:145  chFreq[c] = f - (f >> chDrop[c])
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, chDrop(t1)
  srl t1, s2, t1
  sub t1, s2, t1
  sw t1, chFreq(t0)
  ; lib/sound.e16.ts:146  poke16(CHSEL, c)
  li t0, 63552
  sw s1, 0(t0)
  ; lib/sound.e16.ts:147  poke16(FREQ, chFreq[c])
  slli t0, s1, 1
  lw t0, chFreq(t0)
  li t1, 63556
  sw t0, 0(t1)
.L3:
  ; lib/sound.e16.ts:149  chWait[c] = chWait[c] - 1
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, chWait(t1)
  addi t1, t1, -1
  sw t1, chWait(t0)
  ; lib/sound.e16.ts:150  if (chWait[c] !== 0) return
  slli t0, s1, 1
  lw t0, chWait(t0)
  beq t0, zero, .L4
  ; lib/sound.e16.ts:150  return
  j .return
.L4:
  ; lib/sound.e16.ts:151  poke16(IO_BANK, chBank[c])
  slli t0, s1, 1
  lw t0, chBank(t0)
  li t1, 65284
  sw t0, 0(t1)
  ; lib/sound.e16.ts:152  readOps(c)
  mv a0, s1
  call readOps
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; lib/sound.e16.ts:159 readOps(c) at -O1
;   c in s1
;   at in s2
readOps:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; c
  ; lib/sound.e16.ts:160  let at = chAt[c]
  slli t0, s1, 1
  lw s2, chAt(t0)
  ; lib/sound.e16.ts:161  opTook = false
  sw zero, 0x0c90(zero)
  ; lib/sound.e16.ts:162  while (!opTook) at = oneOp(c, at)
  j .L3
.L1:
  ; lib/sound.e16.ts:162  at = oneOp(c, at)
  mv a0, s1
  mv a1, s2
  call oneOp
  mv s2, a0 ; at
.L3:
  lw t0, 0x0c90(zero)
  beqz t0, .L1
  ; lib/sound.e16.ts:163  chAt[c] = at
  slli t0, s1, 1
  sw s2, chAt(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; lib/sound.e16.ts:167 oneOp(c, at) at -O1
;   c in s2
;   at in s1
;   switch1 in s3
oneOp:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; c
  mv s1, a1 ; at
  ; lib/sound.e16.ts:168  switch (peek(at)) {
  lbu s3, 0(s1)
  li t0, 1
  beq s3, t0, .L2
  li t0, 9
  beq s3, t0, .L3
  li t0, 10
  beq s3, t0, .L4
  li t0, 2
  beq s3, t0, .L5
  li t0, 8
  beq s3, t0, .L6
  li t0, 3
  beq s3, t0, .L7
  li t0, 4
  beq s3, t0, .L8
  li t0, 5
  beq s3, t0, .L9
  li t0, 6
  beq s3, t0, .L10
  j .L11
.L2:
  ; lib/sound.e16.ts:171  startNote(c, peek(at + 1) | (peek(at + 2) << 8), peek(at + 3), peek(at + 4))
  lbu t0, 1(s1)
  lbu t1, 2(s1)
  slli t1, t1, 8
  or t0, t0, t1
  lbu t1, 3(s1)
  lbu t2, 4(s1)
  mv a0, s2
  mv a1, t0
  mv a2, t1
  mv a3, t2
  call startNote
  ; lib/sound.e16.ts:172  opTook = true
  li t0, 1
  sw t0, 0x0c90(zero)
  ; lib/sound.e16.ts:173  return wrap16(at + 5)
  addi a0, s1, 5
  j .return
.L3:
  ; lib/sound.e16.ts:175  startNote(c, peek(at + 1) | (peek(at + 2) << 8), chLen[c], chHeld[c])
  lbu t0, 1(s1)
  lbu t1, 2(s1)
  slli t1, t1, 8
  or t0, t0, t1
  slli t1, s2, 1
  lw t1, chLen(t1)
  slli t2, s2, 1
  lw t2, chHeld(t2)
  mv a0, s2
  mv a1, t0
  mv a2, t1
  mv a3, t2
  call startNote
  ; lib/sound.e16.ts:176  opTook = true
  li t0, 1
  sw t0, 0x0c90(zero)
  ; lib/sound.e16.ts:177  return wrap16(at + 3)
  addi a0, s1, 3
  j .return
.L4:
  ; lib/sound.e16.ts:179  startNote(c, lastFreq[c], chLen[c], chHeld[c])
  slli t0, s2, 1
  lw t0, lastFreq(t0)
  slli t1, s2, 1
  lw t1, chLen(t1)
  slli t2, s2, 1
  lw t2, chHeld(t2)
  mv a0, s2
  mv a1, t0
  mv a2, t1
  mv a3, t2
  call startNote
  ; lib/sound.e16.ts:180  opTook = true
  li t0, 1
  sw t0, 0x0c90(zero)
  ; lib/sound.e16.ts:181  return wrap16(at + 1)
  addi a0, s1, 1
  j .return
.L5:
  ; lib/sound.e16.ts:183  chWait[c] = peek(at + 1)
  slli t0, s2, 1
  lbu t1, 1(s1)
  sw t1, chWait(t0)
  ; lib/sound.e16.ts:184  opTook = true
  li t0, 1
  sw t0, 0x0c90(zero)
  ; lib/sound.e16.ts:185  return wrap16(at + 2)
  addi a0, s1, 2
  j .return
.L6:
  ; lib/sound.e16.ts:188  chWait[c] = peek(at + 1)
  slli t0, s2, 1
  lbu t1, 1(s1)
  sw t1, chWait(t0)
  ; lib/sound.e16.ts:189  chGate[c] = peek(at + 2)
  slli t0, s2, 1
  lbu t1, 2(s1)
  sw t1, chGate(t0)
  ; lib/sound.e16.ts:190  opTook = true
  li t0, 1
  sw t0, 0x0c90(zero)
  ; lib/sound.e16.ts:191  return wrap16(at + 3)
  addi a0, s1, 3
  j .return
.L7:
  ; lib/sound.e16.ts:193  setInstrument(c, peek(at + 1))
  lbu t0, 1(s1)
  mv a0, s2
  mv a1, t0
  call setInstrument
  ; lib/sound.e16.ts:194  return wrap16(at + 2)
  addi a0, s1, 2
  j .return
.L8:
  ; lib/sound.e16.ts:196  chVol[c] = peek(at + 1)
  slli t0, s2, 1
  lbu t1, 1(s1)
  sw t1, chVol(t0)
  ; lib/sound.e16.ts:197  return wrap16(at + 2)
  addi a0, s1, 2
  j .return
.L9:
  ; lib/sound.e16.ts:199  poke16(CHSEL, c)
  li t0, 63552
  sw s2, 0(t0)
  ; lib/sound.e16.ts:200  poke16(PAN, peek(at + 1))
  lbu t0, 1(s1)
  li t1, 63560
  sw t0, 0(t1)
  ; lib/sound.e16.ts:201  return wrap16(at + 2)
  addi a0, s1, 2
  j .return
.L10:
  ; lib/sound.e16.ts:203  if (chLoop[c] !== 0xffff) return wrap16(chSong[c] + chLoop[c])
  slli t0, s2, 1
  lw t0, chLoop(t0)
  li t1, 65535
  beq t0, t1, .L12
  ; lib/sound.e16.ts:203  return wrap16(chSong[c] + chLoop[c])
  slli t0, s2, 1
  lw t0, chSong(t0)
  slli t1, s2, 1
  lw t1, chLoop(t1)
  add a0, t0, t1
  j .return
.L12:
  ; lib/sound.e16.ts:204  return endChannel(c, at)
  mv a0, s2
  mv a1, s1
  call endChannel
  j .return
.L11:
  ; lib/sound.e16.ts:207  return endChannel(c, at)
  mv a0, s2
  mv a1, s1
  call endChannel
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; lib/sound.e16.ts:211 endChannel(c, at) at -O1
;   c in a0
;   at in a1
endChannel:
  ; lib/sound.e16.ts:212  poke16(CHSEL, c)
  li t0, 63552
  sw a0, 0(t0)
  ; lib/sound.e16.ts:213  poke16(KEY, 0)
  li t0, 63566
  sw zero, 0(t0)
  ; lib/sound.e16.ts:214  chOn[c] = 0
  slli t0, a0, 1
  sw zero, chOn(t0)
  ; lib/sound.e16.ts:215  opTook = true
  li t0, 1
  sw t0, 0x0c90(zero)
  ; lib/sound.e16.ts:216  return at
  mv a0, a1
.return:
  ret

; lib/sound.e16.ts:220 startNote(c, freq, frames, held) at -O1
;   c in a0
;   freq in a1
;   frames in a2
;   held in a3
;   quiet in s1
startNote:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; lib/sound.e16.ts:221  chLen[c] = frames
  slli t0, a0, 1
  sw a2, chLen(t0)
  ; lib/sound.e16.ts:222  chHeld[c] = held
  slli t0, a0, 1
  sw a3, chHeld(t0)
  ; lib/sound.e16.ts:223  lastFreq[c] = freq
  slli t0, a0, 1
  sw a1, lastFreq(t0)
  ; lib/sound.e16.ts:224  chWait[c] = frames
  slli t0, a0, 1
  sw a2, chWait(t0)
  ; lib/sound.e16.ts:225  chGate[c] = held
  slli t0, a0, 1
  sw a3, chGate(t0)
  ; lib/sound.e16.ts:226  chFreq[c] = freq
  slli t0, a0, 1
  sw a1, chFreq(t0)
  ; lib/sound.e16.ts:227  poke16(CHSEL, c)
  li t0, 63552
  sw a0, 0(t0)
  ; lib/sound.e16.ts:228  poke16(FREQ, freq)
  li t0, 63556
  sw a1, 0(t0)
  ; lib/sound.e16.ts:229  const quiet = c < 12 && (muted & (1 << c)) !== 0
  sltiu t0, a0, 12
  mv t1, t0
  beqz t1, .L1
  lw t0, 0x0c8e(zero)
  li t1, 1
  sll t1, t1, a0
  and t0, t0, t1
  sub t0, t0, zero
  snez t0, t0
.L1:
  mv s1, t0 ; quiet
  ; lib/sound.e16.ts:231  poke16(VOL, quiet ? 0 : (chVol[c] * chInstVol[c] * 17 + 128) >> 8)
  li t0, 63558
  mv t1, s1
  beqz t1, .L2
  li t1, 0
  j .L3
.L2:
  slli t1, a0, 1
  lw t1, chVol(t1)
  slli t2, a0, 1
  lw t2, chInstVol(t2)
  mul t1, t1, t2
  slli t2, t1, 4
  add t1, t2, t1
  addi t1, t1, 128
  srli t1, t1, 8
.L3:
  sw t1, 0(t0)
  ; lib/sound.e16.ts:232  poke16(KEY, 1)
  li t0, 1
  li t1, 63566
  sw t0, 0(t1)
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; lib/sound.e16.ts:236 setInstrument(c, k) at -O1
;   c in a0
;   k in a1
;   song in a3
;   at in a2
setInstrument:
  ; lib/sound.e16.ts:237  const song = chSong[c]
  slli t0, a0, 1
  lw a3, chSong(t0)
  ; lib/sound.e16.ts:238  const at = song + 2 + peek(song) * 6 + k * 8
  lbu t0, 0(a3)
  slli t1, t0, 2
  slli t0, t0, 1
  add t0, t0, t1
  addi t1, a3, 2
  add t1, t1, t0
  slli t0, a1, 3
  add a2, t1, t0
  ; lib/sound.e16.ts:239  poke16(CHSEL, c)
  li t0, 63552
  sw a0, 0(t0)
  ; lib/sound.e16.ts:240  poke16(WAVE, peek(at))
  lbu t0, 0(a2)
  li t1, 63554
  sw t0, 0(t1)
  ; lib/sound.e16.ts:241  chInstVol[c] = peek(at + 1)
  slli t0, a0, 1
  lbu t1, 1(a2)
  sw t1, chInstVol(t0)
  ; lib/sound.e16.ts:242  poke16(ENV, peek16(at + 2))
  lw t0, 2(a2)
  li t1, 63562
  sw t0, 0(t1)
  ; lib/sound.e16.ts:243  poke16(MOD, peek16(at + 4))
  lw t0, 4(a2)
  li t1, 63564
  sw t0, 0(t1)
  ; lib/sound.e16.ts:244  poke16(PAN, peek(at + 6))
  lbu t0, 6(a2)
  li t1, 63560
  sw t0, 0(t1)
  ; lib/sound.e16.ts:245  chDrop[c] = peek(at + 7)
  slli t0, a0, 1
  lbu t1, 7(a2)
  sw t1, chDrop(t0)
.return:
  ret

; engine/main.e16.ts:88 main() at -O1
main:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:89  kitInit()
  call kitInit
  ; engine/main.e16.ts:90  screenOn()
  call screenOn
  ; engine/main.e16.ts:91  palettesIn()
  call palettesIn
  ; engine/main.e16.ts:92  tilesIn()
  call tilesIn
  ; engine/main.e16.ts:93  slotsIn()
  call slotsIn
  ; engine/main.e16.ts:94  stagesIn()
  call stagesIn
  ; engine/main.e16.ts:95  controlsLoad()
  la t0, controlsLoad
  li t1, 257
  call far_call
  ; engine/main.e16.ts:96  ctl[0] = C_PAD
  sw zero, ctl(zero)
  ; engine/main.e16.ts:97  ctl[1] = C_CPU
  li t0, 1
  sw t0, ctl+2(zero)
  ; engine/main.e16.ts:98  for (;;) {
.L1:
  ; engine/main.e16.ts:99  title()
  la t0, title
  li t1, 257
  call far_call
  ; engine/main.e16.ts:100  matchPlay()
  la t0, matchPlay
  li t1, 257
  call far_call
  j .L1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:105 screenOn() at -O1
screenOn:
  ; engine/main.e16.ts:106  poke16(VCTRL, 3)
  li t0, 3
  li t1, 63488
  sw t0, 0(t1)
  ; engine/main.e16.ts:107  poke16(LAYERS, 7)
  li t0, 7
  li t1, 63528
  sw t0, 0(t1)
  ; engine/main.e16.ts:108  poke16(BG0X, 0)
  li t0, 63520
  sw zero, 0(t0)
  ; engine/main.e16.ts:109  poke16(BG0Y, 0)
  li t0, 63522
  sw zero, 0(t0)
  ; engine/main.e16.ts:110  poke16(BG1X, 0)
  li t0, 63524
  sw zero, 0(t0)
  ; engine/main.e16.ts:111  poke16(BG1Y, 508)
  li t0, 508
  li t1, 63526
  sw t0, 0(t1)
.return:
  ret

; engine/main.e16.ts:115 palettesIn() at -O1
palettesIn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:116  slot(PAL_HUD, 1)
  li a0, 1
  li a1, 1
  call slot
  ; engine/main.e16.ts:117  slot(PAL_HUD, 2)
  li a0, 1
  li a1, 2
  call slot
  ; engine/main.e16.ts:118  slot(PAL_HUDDIM, 3)
  li a0, 2
  li a1, 3
  call slot
  ; engine/main.e16.ts:119  slot(PAL_HUD, 4)
  li a0, 1
  li a1, 4
  call slot
  ; engine/main.e16.ts:120  slot(PAL_P1, 8)
  li a0, 3
  li a1, 8
  call slot
  ; engine/main.e16.ts:121  slot(PAL_CPU, 9)
  li a0, 4
  li a1, 9
  call slot
  ; engine/main.e16.ts:122  slot(PAL_FX, 10)
  li a0, 5
  li a1, 10
  call slot
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:125 slot(row, s) at -O1
;   row in s1
;   s in s2
slot:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; row
  mv s2, a1 ; s
  ; engine/main.e16.ts:126  palette(row, s)
  mv a0, s1
  mv a1, s2
  call palette
  ; engine/main.e16.ts:127  palKeep(row, s)
  mv a0, s1
  mv a1, s2
  call palKeep
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/main.e16.ts:130 tilesIn() at -O1
tilesIn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:131  load(FONT_BANK, FONT_AT, FONT_TILE * 32, FONT_BYTES)
  li a0, 259
  li a1, 49922
  li a2, 0
  li a3, 2048
  call load
  ; engine/main.e16.ts:132  load(FONTB_BANK, FONTB_AT, FONTB_TILE * 32, FONTB_BYTES)
  li a0, 259
  li a1, 51970
  li a2, 2048
  li a3, 2048
  call load
  ; engine/main.e16.ts:133  load(DIGITS_BANK, DIGITS_AT, DIGITS_TILE * 32, DIGITS_BYTES)
  li a0, 259
  li a1, 54018
  li a2, 4096
  li a3, 1280
  call load
  ; engine/main.e16.ts:134  load(HUD_BANK, HUD_AT, HUD_TILE * 32, HUD_BYTES)
  li a0, 260
  li a1, 49152
  li a2, 5376
  li a3, 2848
  call load
  ; engine/main.e16.ts:135  load(BOX_BANK, BOX_AT, BOX_TILE * 32, BOX_BYTES)
  li a0, 260
  li a1, 52000
  li a2, 8224
  li a3, 512
  call load
  ; engine/main.e16.ts:136  load(FX_BANK, FX_AT, FX_TILE * 32, FX_BYTES)
  li a0, 260
  li a1, 52512
  li a2, 8736
  li a3, 32
  call load
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:140 screenClear() at -O1
screenClear:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:141  vfill(MAP0, stageClearTile(), 64 * 64)
  call stageClearTile
  mv a1, a0
  li a0, 32768
  li a2, 4096
  call vfill
  ; engine/main.e16.ts:142  hudClear()
  call hudClear
  ; engine/main.e16.ts:143  scrollNext = 0
  sw zero, 0x0c96(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:147 frameBegin() at -O1
frameBegin:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:148  seen = frame_wait(seen)
  lw a0, 0x0c92(zero)
  call frame_wait
  sw a0, 0x0c92(zero)
  ; engine/main.e16.ts:149  sprShow()
  call sprShow
  ; engine/main.e16.ts:150  poke16(BG0X, scrollNext)
  lw t0, 0x0c96(zero)
  li t1, 63520
  sw t0, 0(t1)
  ; engine/main.e16.ts:151  padRead()
  call padRead
  ; engine/main.e16.ts:152  frame++
  lw t0, 0x0c94(zero)
  addi t0, t0, 1
  sw t0, 0x0c94(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:158 phaseIs(p) at -O1
;   p in a0
phaseIs:
  ; engine/main.e16.ts:159  phase = p
  sw a0, 0x0c98(zero)
  ; engine/main.e16.ts:160  phaseT = 0
  sw zero, 0x0c9a(zero)
.return:
  ret

; engine/main.e16.ts:163 phaseTick() at -O1
phaseTick:
  ; engine/main.e16.ts:164  phaseT++
  lw t0, 0x0c9a(zero)
  addi t0, t0, 1
  sw t0, 0x0c9a(zero)
.return:
  ret

; engine/main.e16.ts:168 clockReset() at -O1
clockReset:
  ; engine/main.e16.ts:169  timeLeft = 99
  li t0, 99
  sw t0, 0x0c9c(zero)
  ; engine/main.e16.ts:170  timeT = 0
  sw zero, 0x0c9e(zero)
.return:
  ret

; engine/main.e16.ts:177 judgeRound() at -O1
judgeRound:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:178  if (phase !== PH_FIGHT) return
  lw t0, 0x0c98(zero)
  li t1, 1
  beq t0, t1, .L1
  ; engine/main.e16.ts:178  return
  j .return
.L1:
  ; engine/main.e16.ts:179  if (fLife[0] === 0 || fLife[1] === 0) knockedOut()
  lw t0, fLife(zero)
  beq t0, zero, .L3
  lw t0, fLife+2(zero)
  bne t0, zero, .L2
.L3:
  ; engine/main.e16.ts:179  knockedOut()
  call knockedOut
  j .L4
.L2:
  ; engine/main.e16.ts:180  clockStep()
  call clockStep
.L4:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:183 knockedOut() at -O1
;   both in s1
;   hitstopIs.n in s2
knockedOut:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; engine/main.e16.ts:184  const both = fLife[0] === 0 && fLife[1] === 0
  lw t0, fLife(zero)
  sub t0, t0, zero
  seqz t0, t0
  mv t1, t0
  beqz t1, .L1
  lw t0, fLife+2(zero)
  sub t0, t0, zero
  seqz t0, t0
.L1:
  mv s1, t0 ; both
  ; engine/main.e16.ts:185  roundWon = both ? 2 : fLife[1] === 0 ? 0 : 1
  beqz s1, .L2
  li t0, 2
  j .L3
.L2:
  lw t0, fLife+2(zero)
  bne t0, zero, .L4
  li t0, 0
  j .L5
.L4:
  li t0, 1
.L5:
.L3:
  sw t0, 0x0ca0(zero)
  ; engine/main.e16.ts:186  hitstopIs(KO_STOP)
  li s2, 24 ; hitstopIs.n
  ; engine/hit.e16.ts:133  hitstop = n
  sw s2, 0x129e(zero)
  ; engine/main.e16.ts:187  roundOver(both ? str('DOUBLE K.O.') : str('K.O.'))
  beqz s1, .L6
  la t0, str_0
  j .L7
.L6:
  la t0, str_1
.L7:
  mv a0, t0
  call roundOver
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/main.e16.ts:191 clockStep() at -O1
clockStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:192  timeT++
  lw t0, 0x0c9e(zero)
  addi t0, t0, 1
  sw t0, 0x0c9e(zero)
  ; engine/main.e16.ts:193  if (timeT < SECOND) return
  li t1, 60
  bgeu t0, t1, .L1
  ; engine/main.e16.ts:193  return
  j .return
.L1:
  ; engine/main.e16.ts:194  timeT = 0
  sw zero, 0x0c9e(zero)
  ; engine/main.e16.ts:195  timeLeft--
  lw t0, 0x0c9c(zero)
  addi t0, t0, -1
  sw t0, 0x0c9c(zero)
  ; engine/main.e16.ts:196  if (timeLeft > 0) return
  bgeu zero, t0, .L2
  ; engine/main.e16.ts:196  return
  j .return
.L2:
  ; engine/main.e16.ts:197  roundWon = fLife[0] === fLife[1] ? 2 : fLife[0] > fLife[1] ? 0 : 1
  lw t0, fLife(zero)
  lw t1, fLife+2(zero)
  bne t0, t1, .L3
  li t0, 2
  j .L4
.L3:
  lw t0, fLife(zero)
  lw t1, fLife+2(zero)
  bgeu t1, t0, .L5
  li t0, 0
  j .L6
.L5:
  li t0, 1
.L6:
.L4:
  sw t0, 0x0ca0(zero)
  ; engine/main.e16.ts:198  roundOver(roundWon === 2 ? str('TIME UP  DRAW') : str('TIME UP'))
  li t1, 2
  bne t0, t1, .L7
  la t0, str_2
  j .L8
.L7:
  la t0, str_3
.L8:
  mv a0, t0
  call roundOver
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:201 roundOver(s) at -O1
;   s in s1
roundOver:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; s
  ; engine/main.e16.ts:202  phaseIs(PH_OVER)
  li a0, 2
  call phaseIs
  ; engine/main.e16.ts:203  bandShow(s)
  mv a0, s1
  call bandShow
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/main.e16.ts:220 frameStep() at -O1
;   hitstopIs.n in s1
frameStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; engine/main.e16.ts:221  frameBegin()
  call frameBegin
  ; engine/main.e16.ts:222  struckClear()
  call struckClear
  ; engine/main.e16.ts:223  ringStep()
  call ringStep
  ; engine/main.e16.ts:224  inputsGather()
  call inputsGather
  ; engine/main.e16.ts:225  if (hitstop > 0) {
  lw t0, 0x129e(zero)
  bgeu zero, t0, .L1
  ; engine/main.e16.ts:226  hitstopIs(hitstop - 1)
  lw t0, 0x129e(zero)
  addi s1, t0, -1
  ; engine/hit.e16.ts:133  hitstop = n
  sw s1, 0x129e(zero)
  ; engine/main.e16.ts:227  cpuInputs(false)
  li a0, 0
  call cpuInputs
  ; engine/main.e16.ts:228  pictureStep()
  call pictureStep
  ; engine/main.e16.ts:229  return
  j .return
.L1:
  ; engine/main.e16.ts:231  cpuInputs(true)
  li a0, 1
  call cpuInputs
  ; engine/main.e16.ts:232  fightersSeen()
  call fightersSeen
  ; engine/main.e16.ts:233  fighterStep(0)
  li a0, 0
  call fighterStep
  ; engine/main.e16.ts:234  fighterStep(1)
  li a0, 1
  call fighterStep
  ; engine/main.e16.ts:235  motion(0)
  li a0, 0
  call motion
  ; engine/main.e16.ts:236  motion(1)
  li a0, 1
  call motion
  ; engine/main.e16.ts:237  wall(0)
  li a0, 0
  call wall
  ; engine/main.e16.ts:238  wall(1)
  li a0, 1
  call wall
  ; engine/main.e16.ts:239  apart()
  call apart
  ; engine/main.e16.ts:240  bodies()
  call bodies
  ; engine/main.e16.ts:241  boxesWorld()
  call boxesWorld
  ; engine/main.e16.ts:242  hitsResolve()
  call hitsResolve
  ; engine/main.e16.ts:243  judgeRound()
  call judgeRound
  ; engine/main.e16.ts:244  cameraStep()
  call cameraStep
  ; engine/main.e16.ts:245  pictureStep()
  call pictureStep
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/main.e16.ts:248 pictureStep() at -O1
pictureStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:249  scrollNext = camX
  lw t0, 0x12a0(zero)
  sw t0, 0x0c96(zero)
  ; engine/main.e16.ts:250  spritesBuild()
  call spritesBuild
  ; engine/main.e16.ts:251  hudStep(timeLeft, frame)
  lw t0, 0x0c9c(zero)
  lw t1, 0x0c94(zero)
  mv a0, t0
  mv a1, t1
  call hudStep
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:255 live() at -O1
live:
  ; engine/main.e16.ts:256  return phase === PH_FIGHT
  lw t0, 0x0c98(zero)
  li t1, 1
  sub t0, t0, t1
  seqz a0, t0
.return:
  ret

; engine/main.e16.ts:260 inputsGather() at -O1
;   i in s1
inputsGather:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; engine/main.e16.ts:261  let i: u16 = 0
  li s1, 0 ; i
  ; engine/main.e16.ts:262  while (i < 2) {
  j .L3
.L1:
  ; engine/main.e16.ts:263  if (!live()) inputNone(i)
  call live
  bnez a0, .L5
  ; engine/main.e16.ts:263  inputNone(i)
  mv a0, s1
  call inputNone
  j .L6
.L5:
  ; engine/main.e16.ts:264  if (ctl[i] === C_PAD) inputPad(i, fFace[i] !== 0)
  slli t0, s1, 1
  lw t0, ctl(t0)
  bne t0, zero, .L7
  ; engine/main.e16.ts:264  inputPad(i, fFace[i] !== 0)
  slli t0, s1, 1
  lw t0, fFace(t0)
  sub t0, t0, zero
  snez t0, t0
  mv a0, s1
  mv a1, t0
  call inputPad
  j .L8
.L7:
  ; engine/main.e16.ts:265  if (ctl[i] !== C_CPU) inputExt(i)
  slli t0, s1, 1
  lw t0, ctl(t0)
  li t1, 1
  beq t0, t1, .L9
  ; engine/main.e16.ts:265  inputExt(i)
  mv a0, s1
  call inputExt
.L9:
.L8:
.L6:
  ; engine/main.e16.ts:266  i++
  addi s1, s1, 1
.L3:
  li t0, 2
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/main.e16.ts:271 cpuInputs(think) at -O1
;   think in s2
;   i in s1
cpuInputs:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; think
  ; engine/main.e16.ts:272  let i: u16 = 0
  li s1, 0 ; i
  ; engine/main.e16.ts:273  while (i < 2) {
  j .L3
.L1:
  ; engine/main.e16.ts:274  if (ctl[i] === C_CPU) {
  slli t0, s1, 1
  lw t0, ctl(t0)
  li t1, 1
  bne t0, t1, .L5
  ; engine/main.e16.ts:275  if (!live()) cpuHeld[i] = 0
  call live
  bnez a0, .L6
  ; engine/main.e16.ts:275  cpuHeld[i] = 0
  slli t0, s1, 1
  sw zero, cpuHeld(t0)
  j .L7
.L6:
  ; engine/main.e16.ts:276  if (think) cpuHeld[i] = cpuThink(i)
  beqz s2, .L8
  ; engine/main.e16.ts:276  cpuHeld[i] = cpuThink(i)
  slli t0, s1, 1
  addi t0, t0, cpuHeld
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  la t0, cpuThink
  li t1, 258
  call far_call
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
.L8:
.L7:
  ; engine/main.e16.ts:277  inputHeld(i, cpuHeld[i])
  slli t0, s1, 1
  lw t0, cpuHeld(t0)
  mv a0, s1
  mv a1, t0
  call inputHeld
.L5:
  ; engine/main.e16.ts:279  i++
  addi s1, s1, 1
.L3:
  li t0, 2
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; engine/data.e16.ts:98 slotsIn() at -O1
slotsIn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/data.e16.ts:99  slotTables(0, S1_MOVES_BANK, S1_MOVES_AT, S1_POSES_BANK)
  li a0, 0
  li a1, 261
  li a2, 53760
  li a3, 261
  call slotTables
  ; engine/data.e16.ts:100  slotPlaces(0, S1_POSES_AT, S1_PROFILE_BANK, S1_PROFILE_AT)
  li a0, 0
  li a1, 54176
  li a2, 261
  li a3, 56624
  call slotPlaces
  ; engine/data.e16.ts:101  slName[0] = str('S1 BALANCE')
  la t0, str_4
  sw t0, slName(zero)
  ; engine/data.e16.ts:102  slotTables(1, S2_MOVES_BANK, S2_MOVES_AT, S2_POSES_BANK)
  li a0, 1
  li a1, 261
  li a2, 56656
  li a3, 262
  call slotTables
  ; engine/data.e16.ts:103  slotPlaces(1, S2_POSES_AT, S2_PROFILE_BANK, S2_PROFILE_AT)
  li a0, 1
  li a1, 49152
  li a2, 262
  li a3, 51600
  call slotPlaces
  ; engine/data.e16.ts:104  slName[1] = str('S2 RUSH')
  la t0, str_5
  sw t0, slName+2(zero)
  ; engine/data.e16.ts:105  slotTables(2, S3_MOVES_BANK, S3_MOVES_AT, S3_POSES_BANK)
  li a0, 2
  li a1, 262
  li a2, 51632
  li a3, 262
  call slotTables
  ; engine/data.e16.ts:106  slotPlaces(2, S3_POSES_AT, S3_PROFILE_BANK, S3_PROFILE_AT)
  li a0, 2
  li a1, 52048
  li a2, 262
  li a3, 54496
  call slotPlaces
  ; engine/data.e16.ts:107  slName[2] = str('S3 POWER')
  la t0, str_6
  sw t0, slName+4(zero)
  ; engine/data.e16.ts:108  slotTables(3, S4_MOVES_BANK, S4_MOVES_AT, S4_POSES_BANK)
  li a0, 3
  li a1, 262
  li a2, 54528
  li a3, 263
  call slotTables
  ; engine/data.e16.ts:109  slotPlaces(3, S4_POSES_AT, S4_PROFILE_BANK, S4_PROFILE_AT)
  li a0, 3
  li a1, 49152
  li a2, 263
  li a3, 51600
  call slotPlaces
  ; engine/data.e16.ts:110  slName[3] = str('S4 OUTBOX')
  la t0, str_7
  sw t0, slName+6(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/data.e16.ts:113 slotTables(k, mb, ma, pb) at -O1
;   k in a0
;   mb in a1
;   ma in a2
;   pb in a3
slotTables:
  ; engine/data.e16.ts:114  slMovesB[k] = mb
  slli t0, a0, 1
  sw a1, slMovesB(t0)
  ; engine/data.e16.ts:115  slMovesA[k] = ma
  slli t0, a0, 1
  sw a2, slMovesA(t0)
  ; engine/data.e16.ts:116  slPosesB[k] = pb
  slli t0, a0, 1
  sw a3, slPosesB(t0)
.return:
  ret

; engine/data.e16.ts:119 slotPlaces(k, pa, fb, fa) at -O1
;   k in a0
;   pa in a1
;   fb in a2
;   fa in a3
slotPlaces:
  ; engine/data.e16.ts:120  slPosesA[k] = pa
  slli t0, a0, 1
  sw a1, slPosesA(t0)
  ; engine/data.e16.ts:121  slProfB[k] = fb
  slli t0, a0, 1
  sw a2, slProfB(t0)
  ; engine/data.e16.ts:122  slProfA[k] = fa
  slli t0, a0, 1
  sw a3, slProfA(t0)
.return:
  ret

; engine/data.e16.ts:137 fighterLoad(i, s) at -O1
;   i in s3
;   s in s2
;   old in s0
;   k in s1
fighterLoad:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s3, a0 ; i
  mv s2, a1 ; s
  ; engine/data.e16.ts:138  copyIn(slMovesB[s], slMovesA[s], i * MOVES * MOVE_W, MOVES * MOVE_W)
  slli t0, s2, 1
  lw t0, slMovesB(t0)
  slli t1, s2, 1
  lw t1, slMovesA(t1)
  li t2, 13
  mul t2, s3, t2
  slli t2, t2, 4
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 208
  call copyIn
  ; engine/data.e16.ts:139  const old = bank(slProfB[s])
  slli t0, s2, 1
  lw a0, slProfB(t0)
  call bank
  mv s0, a0 ; old
  ; engine/data.e16.ts:140  let k: u16 = 0
  li s1, 0 ; k
  ; engine/data.e16.ts:141  while (k < PROF_W) {
  j .L3
.L1:
  ; engine/data.e16.ts:142  pr[i * PROF_W + k] = peek16(slProfA[s] + k * 2)
  slli t0, s3, 4
  add t0, t0, s1
  slli t0, t0, 1
  slli t1, s2, 1
  lw t1, slProfA(t1)
  slli t2, s1, 1
  add t1, t1, t2
  lw t1, 0(t1)
  sw t1, pr(t0)
  ; engine/data.e16.ts:143  k++
  addi s1, s1, 1
.L3:
  li t0, 16
  bltu s1, t0, .L1
  ; engine/data.e16.ts:145  poke16(IO_BANK, old)
  li t0, 65284
  sw s0, 0(t0)
  ; engine/data.e16.ts:146  boxPose[i] = 0xffff
  slli t0, s3, 1
  li t1, 65535
  sw t1, boxPose(t0)
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; engine/data.e16.ts:149 copyIn(b, at, to, n) at -O1
;   b in s2
;   at in s3
;   to in 0(fp)
;   n in 2(fp)
;   old in 4(fp)
;   k in s1
copyIn:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; b
  mv s3, a1 ; at
  sw a2, 0(fp) ; to
  sw a3, 2(fp) ; n
  ; engine/data.e16.ts:150  const old = bank(b)
  mv a0, s2
  call bank
  sw a0, 4(fp) ; old
  ; engine/data.e16.ts:151  let k: u16 = 0
  li s1, 0 ; k
  ; engine/data.e16.ts:152  while (k < n) {
  j .L3
.L1:
  ; engine/data.e16.ts:153  mv[to + k] = peek16(at + k * 2)
  lw t0, 0(fp) ; to
  add t0, t0, s1
  slli t0, t0, 1
  slli t1, s1, 1
  add t1, s3, t1
  lw t1, 0(t1)
  sw t1, mv(t0)
  ; engine/data.e16.ts:154  k++
  addi s1, s1, 1
.L3:
  lw t0, 2(fp) ; n
  bltu s1, t0, .L1
  ; engine/data.e16.ts:156  poke16(IO_BANK, old)
  lw t0, 4(fp) ; old
  li t1, 65284
  sw t0, 0(t1)
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; engine/data.e16.ts:160 poseLoad(i, s, p) at -O1
;   i in s2
;   s in 0(fp)
;   p in s3
;   old in 2(fp)
;   from in 4(fp)
;   k in s1
poseLoad:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; i
  sw a1, 0(fp) ; s
  mv s3, a2 ; p
  ; engine/data.e16.ts:161  if (boxPose[i] === p) return
  slli t0, s2, 1
  lw t0, boxPose(t0)
  bne t0, s3, .L1
  ; engine/data.e16.ts:161  return
  j .return
.L1:
  ; engine/data.e16.ts:162  boxPose[i] = p
  slli t0, s2, 1
  sw s3, boxPose(t0)
  ; engine/data.e16.ts:163  const old = bank(slPosesB[s])
  lw t0, 0(fp) ; s
  slli t0, t0, 1
  lw a0, slPosesB(t0)
  call bank
  sw a0, 2(fp) ; old
  ; engine/data.e16.ts:164  const from = slPosesA[s] + p * POSE_W * 2
  lw t0, 0(fp) ; s
  slli t0, t0, 1
  lw t0, slPosesA(t0)
  slli t2, s3, 4
  slli t1, s3, 3
  add t1, t1, t2
  slli t1, t1, 1
  add t0, t0, t1
  sw t0, 4(fp) ; from
  ; engine/data.e16.ts:165  let k: u16 = 0
  li s1, 0 ; k
  ; engine/data.e16.ts:166  while (k < POSE_W) {
  j .L4
.L2:
  ; engine/data.e16.ts:167  bx[i * POSE_W + k] = peek16(from + k * 2)
  slli t1, s2, 4
  slli t0, s2, 3
  add t0, t0, t1
  add t0, t0, s1
  slli t0, t0, 1
  slli t1, s1, 1
  lw t2, 4(fp) ; from
  add t2, t2, t1
  lw t2, 0(t2)
  sw t2, bx(t0)
  ; engine/data.e16.ts:168  k++
  addi s1, s1, 1
.L4:
  li t0, 24
  bltu s1, t0, .L2
  ; engine/data.e16.ts:170  poke16(IO_BANK, old)
  lw t0, 2(fp) ; old
  li t1, 65284
  sw t0, 0(t1)
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; engine/data.e16.ts:174 mvAt(i, m, c) at -O1
;   i in a0
;   m in a1
;   c in a2
mvAt:
  ; engine/data.e16.ts:175  return mv[(i * MOVES + m) * MOVE_W + c]
  li t0, 13
  mul t0, a0, t0
  add t0, t0, a1
  slli t0, t0, 4
  add t0, t0, a2
  slli t0, t0, 1
  lw a0, mv(t0)
.return:
  ret

; engine/data.e16.ts:179 prAt(i, c) at -O1
;   i in a0
;   c in a1
prAt:
  ; engine/data.e16.ts:180  return pr[i * PROF_W + c]
  slli t0, a0, 4
  add t0, t0, a1
  slli t0, t0, 1
  lw a0, pr(t0)
.return:
  ret

; engine/data.e16.ts:196 stagesIn() at -O1
;   stagePictures.k in a0
;   stagePictures.tile in a2
;   stagePictures.b in a3
;   stagePictures.at in s1
;   stagePlaces.k in a1
;   stagePlaces.n in s2
;   stagePlaces.mapB in s3
;   stagePlaces.rows in s0
stagesIn:
  addi sp, sp, -8
  sw s1, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  ; engine/data.e16.ts:197  stagePictures(0, GRID_TILE, GRID_TILES_BANK, GRID_TILES_AT)
  li s1, 52544 ; stagePictures.at
  li a3, 260 ; stagePictures.b
  li a2, 274 ; stagePictures.tile
  li a0, 0 ; stagePictures.k
  ; engine/data.e16.ts:204  stTile[k] = tile
  slli t0, a0, 1
  sw a2, stTile(t0)
  ; engine/data.e16.ts:205  stTilesB[k] = b
  slli t0, a0, 1
  sw a3, stTilesB(t0)
  ; engine/data.e16.ts:206  stTilesA[k] = at
  slli t0, a0, 1
  sw s1, stTilesA(t0)
  ; engine/data.e16.ts:198  stagePlaces(0, GRID_TILES_BYTES, GRID_MAP_BANK, GRID_H)
  li s0, 36 ; stagePlaces.rows
  li s3, 261 ; stagePlaces.mapB
  li s2, 672 ; stagePlaces.n
  li a1, 0 ; stagePlaces.k
  ; engine/data.e16.ts:210  stTilesN[k] = n
  slli t0, a1, 1
  sw s2, stTilesN(t0)
  ; engine/data.e16.ts:211  stMapB[k] = mapB
  slli t0, a1, 1
  sw s3, stMapB(t0)
  ; engine/data.e16.ts:212  stRows[k] = rows
  slli t0, a1, 1
  sw s0, stRows(t0)
  ; engine/data.e16.ts:199  stDataB[0] = STAGE_GRID_BANK
  li t0, 263
  sw t0, stDataB(zero)
  ; engine/data.e16.ts:200  stDataA[0] = STAGE_GRID_AT
  li t0, 51632
  sw t0, stDataA(zero)
.return:
  lw s1, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  addi sp, sp, 8
  ret

; engine/data.e16.ts:223 stageBand(k) at -O1
;   k in a0
stageBand:
  ; engine/data.e16.ts:224  return stageWords[S_BANDS + k]
  addi t0, a0, 5
  slli t0, t0, 1
  lw a0, stageWords(t0)
.return:
  ret

; engine/data.e16.ts:226 stageRaster() at -O1
stageRaster:
  ; engine/data.e16.ts:227  return stageWords[S_RASTER]
  lw a0, stageWords+8(zero)
.return:
  ret

; engine/data.e16.ts:231 stageLoad(k) at -O1
;   k in s2
;   old in s0
;   w in s1
;   y in s3
stageLoad:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  mv s2, a0 ; k
  ; engine/data.e16.ts:232  stageNow = k
  sw s2, 0x1124(zero)
  ; engine/data.e16.ts:233  const old = bank(stDataB[k])
  slli t0, s2, 1
  lw a0, stDataB(t0)
  call bank
  mv s0, a0 ; old
  ; engine/data.e16.ts:234  let w: u16 = 0
  li s1, 0 ; w
  ; engine/data.e16.ts:235  while (w < 41) {
  j .L3
.L1:
  ; engine/data.e16.ts:236  stageWords[w] = peek16(stDataA[k] + w * 2)
  slli t0, s1, 1
  slli t1, s2, 1
  lw t1, stDataA(t1)
  slli t2, s1, 1
  add t1, t1, t2
  lw t1, 0(t1)
  sw t1, stageWords(t0)
  ; engine/data.e16.ts:237  w++
  addi s1, s1, 1
.L3:
  li t0, 41
  bltu s1, t0, .L1
  ; engine/data.e16.ts:239  poke16(IO_BANK, old)
  li t0, 65284
  sw s0, 0(t0)
  ; engine/data.e16.ts:240  palette(stageWords[S_PALETTE], 0)
  lw a0, stageWords(zero)
  li a1, 0
  call palette
  ; engine/data.e16.ts:241  palKeep(stageWords[S_PALETTE], 0)
  lw a0, stageWords(zero)
  li a1, 0
  call palKeep
  ; engine/data.e16.ts:242  load(stTilesB[k], stTilesA[k], stTile[k] * 32, stTilesN[k])
  slli t0, s2, 1
  lw t0, stTilesB(t0)
  slli t1, s2, 1
  lw t1, stTilesA(t1)
  slli t2, s2, 1
  lw t2, stTile(t2)
  slli t2, t2, 5
  slli t3, s2, 1
  lw t3, stTilesN(t3)
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  call load
  ; engine/data.e16.ts:243  let y: u16 = 0
  li s3, 0 ; y
  ; engine/data.e16.ts:244  while (y < stRows[k]) {
  j .L7
.L5:
  ; engine/data.e16.ts:245  mapRow(stMapB[k], 0xc000 + y * 128, 0, y)
  slli t0, s2, 1
  lw t0, stMapB(t0)
  slli t1, s3, 7
  li t2, 49152
  add t2, t2, t1
  mv a0, t0
  mv a1, t2
  li a2, 0
  mv a3, s3
  call mapRow
  ; engine/data.e16.ts:246  y++
  addi s3, s3, 1
.L7:
  slli t0, s2, 1
  lw t0, stRows(t0)
  bltu s3, t0, .L5
  ; engine/data.e16.ts:248  w = 0
  li s1, 0 ; w
  ; engine/data.e16.ts:249  while (w < 36) {
  j .L11
.L9:
  ; engine/data.e16.ts:250  poke16(RASTER + w * 2, 0)
  slli t0, s1, 1
  sw zero, 528(t0)
  ; engine/data.e16.ts:251  w++
  addi s1, s1, 1
.L11:
  li t0, 36
  bltu s1, t0, .L9
  ; engine/data.e16.ts:253  poke16(BG0X, 0)
  li t0, 63520
  sw zero, 0(t0)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; engine/data.e16.ts:257 stageClearTile() at -O1
stageClearTile:
  ; engine/data.e16.ts:258  return stTile[0]
  lw a0, stTile(zero)
.return:
  ret

; engine/data.e16.ts:275 oppLoad(k) at -O1
;   k in s2
;   old in s3
;   c in s1
oppLoad:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; k
  ; engine/data.e16.ts:276  const old = bank(OPPONENTS_BANK)
  li a0, 263
  call bank
  mv s3, a0 ; old
  ; engine/data.e16.ts:277  let c: u16 = 0
  li s1, 0 ; c
  ; engine/data.e16.ts:278  while (c < OPP_W) {
  j .L3
.L1:
  ; engine/data.e16.ts:279  opp[c] = peek16(OPPONENTS_AT + (k * OPP_W + c) * 2)
  slli t0, s1, 1
  slli t1, s2, 3
  add t1, t1, s1
  slli t1, t1, 1
  li t2, 51714
  add t2, t2, t1
  lw t2, 0(t2)
  sw t2, opp(t0)
  ; engine/data.e16.ts:280  c++
  addi s1, s1, 1
.L3:
  li t0, 8
  bltu s1, t0, .L1
  ; engine/data.e16.ts:282  poke16(IO_BANK, old)
  li t0, 65284
  sw s3, 0(t0)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; engine/input.e16.ts:42 buttonSetIs(t) at -O1
;   t in a0
buttonSetIs:
  ; engine/input.e16.ts:43  buttonSet = t & 1
  andi t0, a0, 1
  sw t0, 0x1142(zero)
.return:
  ret

; engine/input.e16.ts:53 ringStep() at -O1
ringStep:
  ; engine/input.e16.ts:54  ringAt = (ringAt + 1) & 15
  lw t0, 0x11c4(zero)
  addi t0, t0, 1
  andi t0, t0, 15
  sw t0, 0x11c4(zero)
  ; engine/input.e16.ts:55  ringH[ringAt] = 0
  lw t0, 0x11c4(zero)
  slli t0, t0, 1
  sw zero, ringH(t0)
  ; engine/input.e16.ts:56  ringD[ringAt] = 0
  lw t0, 0x11c4(zero)
  slli t0, t0, 1
  sw zero, ringD(t0)
  ; engine/input.e16.ts:57  ringH[16 + ringAt] = 0
  lw t0, 0x11c4(zero)
  addi t0, t0, 16
  slli t0, t0, 1
  sw zero, ringH(t0)
  ; engine/input.e16.ts:58  ringD[16 + ringAt] = 0
  lw t0, 0x11c4(zero)
  addi t0, t0, 16
  slli t0, t0, 1
  sw zero, ringD(t0)
.return:
  ret

; engine/input.e16.ts:62 ringClear() at -O1
;   k in a0
ringClear:
  ; engine/input.e16.ts:63  let k: u16 = 0
  li a0, 0 ; k
  ; engine/input.e16.ts:64  while (k < 32) {
  j .L3
.L1:
  ; engine/input.e16.ts:65  ringH[k] = 0
  slli t0, a0, 1
  sw zero, ringH(t0)
  ; engine/input.e16.ts:66  ringD[k] = 0
  slli t0, a0, 1
  sw zero, ringD(t0)
  ; engine/input.e16.ts:67  k++
  addi a0, a0, 1
.L3:
  li t0, 32
  bltu a0, t0, .L1
  ; engine/input.e16.ts:69  lastHeld[0] = 0
  sw zero, lastHeld(zero)
  ; engine/input.e16.ts:70  lastHeld[1] = 0
  sw zero, lastHeld+2(zero)
.return:
  ret

; engine/input.e16.ts:74 inputPut(i, held, down) at -O1
;   i in a0
;   held in a1
;   down in a2
inputPut:
  ; engine/input.e16.ts:75  ringH[i * 16 + ringAt] = held
  slli t0, a0, 4
  lw t1, 0x11c4(zero)
  add t0, t0, t1
  slli t0, t0, 1
  sw a1, ringH(t0)
  ; engine/input.e16.ts:76  ringD[i * 16 + ringAt] = down
  slli t0, a0, 4
  lw t1, 0x11c4(zero)
  add t0, t0, t1
  slli t0, t0, 1
  sw a2, ringD(t0)
.return:
  ret

; engine/input.e16.ts:84 inputPad(i, faceRight) at -O1
;   i in s3
;   faceRight in s0
;   p in s2
;   held in s1
inputPad:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  mv s3, a0 ; i
  mv s0, a1 ; faceRight
  ; engine/input.e16.ts:85  const p = padNow()
  ; lib/kit.e16.ts:318  return padIs
  lw s2, 0x0884(zero)
  ; engine/input.e16.ts:86  let held = padButtons(p)
  mv a0, s2
  call padButtons
  mv s1, a0 ; held
  ; engine/input.e16.ts:87  if ((p & B_LEFT) !== 0) held |= faceRight ? I_BACK : I_FWD
  andi t0, s2, 4
  beq t0, zero, .L1
  ; engine/input.e16.ts:87  held |= faceRight ? I_BACK : I_FWD
  mv t0, s1
  mv t1, s0
  beqz t1, .L2
  li t1, 4
  j .L3
.L2:
  li t1, 8
.L3:
  or s1, t0, t1
.L1:
  ; engine/input.e16.ts:88  if ((p & B_RIGHT) !== 0) held |= faceRight ? I_FWD : I_BACK
  andi t0, s2, 8
  beq t0, zero, .L4
  ; engine/input.e16.ts:88  held |= faceRight ? I_FWD : I_BACK
  mv t0, s1
  mv t1, s0
  beqz t1, .L5
  li t1, 8
  j .L6
.L5:
  li t1, 4
.L6:
  or s1, t0, t1
.L4:
  ; engine/input.e16.ts:89  inputPut(i, held, padPresses())
  call padPresses
  mv a1, s1
  mv a2, a0
  mv a0, s3
  call inputPut
  ; engine/input.e16.ts:90  lastHeld[i] = held
  slli t0, s3, 1
  sw s1, lastHeld(t0)
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; engine/input.e16.ts:94 lightKick() at -O1
lightKick:
  ; engine/input.e16.ts:95  return buttonSet === 0 ? B_B : B_A
  lw t0, 0x1142(zero)
  bne t0, zero, .L1
  li t0, 32
  j .L2
.L1:
  li t0, 16
.L2:
  mv a0, t0
.return:
  ret

; engine/input.e16.ts:98 heavyKick() at -O1
heavyKick:
  ; engine/input.e16.ts:99  return buttonSet === 0 ? B_A : B_B
  lw t0, 0x1142(zero)
  bne t0, zero, .L1
  li t0, 16
  j .L2
.L1:
  li t0, 32
.L2:
  mv a0, t0
.return:
  ret

; engine/input.e16.ts:103 padButtons(p) at -O1
;   p in s2
;   held in s1
padButtons:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; p
  ; engine/input.e16.ts:104  let held: u16 = 0
  li s1, 0 ; held
  ; engine/input.e16.ts:105  if ((p & B_UP) !== 0) held |= I_UP
  andi t0, s2, 1
  beq t0, zero, .L1
  ; engine/input.e16.ts:105  held |= I_UP
  ori s1, s1, 1
.L1:
  ; engine/input.e16.ts:106  if ((p & B_DOWN) !== 0) held |= I_DOWN
  andi t0, s2, 2
  beq t0, zero, .L2
  ; engine/input.e16.ts:106  held |= I_DOWN
  ori s1, s1, 2
.L2:
  ; engine/input.e16.ts:107  if ((p & B_Y) !== 0) held |= I_LP
  andi t0, s2, 128
  beq t0, zero, .L3
  ; engine/input.e16.ts:107  held |= I_LP
  ori s1, s1, 16
.L3:
  ; engine/input.e16.ts:108  if ((p & B_X) !== 0) held |= I_HP
  andi t0, s2, 64
  beq t0, zero, .L4
  ; engine/input.e16.ts:108  held |= I_HP
  ori s1, s1, 32
.L4:
  ; engine/input.e16.ts:109  if ((p & lightKick()) !== 0) held |= I_LK
  call lightKick
  and t0, s2, a0
  beq t0, zero, .L5
  ; engine/input.e16.ts:109  held |= I_LK
  ori s1, s1, 64
.L5:
  ; engine/input.e16.ts:110  if ((p & heavyKick()) !== 0) held |= I_HK
  call heavyKick
  and t0, s2, a0
  beq t0, zero, .L6
  ; engine/input.e16.ts:110  held |= I_HK
  ori s1, s1, 128
.L6:
  ; engine/input.e16.ts:111  return held
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; engine/input.e16.ts:115 padPresses() at -O1
;   down in s1
padPresses:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; engine/input.e16.ts:116  let down: u16 = 0
  li s1, 0 ; down
  ; engine/input.e16.ts:117  if (pressed(B_Y)) down |= I_LP
  li a0, 128
  call pressed
  beqz a0, .L1
  ; engine/input.e16.ts:117  down |= I_LP
  ori s1, s1, 16
.L1:
  ; engine/input.e16.ts:118  if (pressed(B_X)) down |= I_HP
  li a0, 64
  call pressed
  beqz a0, .L2
  ; engine/input.e16.ts:118  down |= I_HP
  ori s1, s1, 32
.L2:
  ; engine/input.e16.ts:119  if (pressed(lightKick())) down |= I_LK
  call lightKick
  call pressed
  beqz a0, .L3
  ; engine/input.e16.ts:119  down |= I_LK
  ori s1, s1, 64
.L3:
  ; engine/input.e16.ts:120  if (pressed(heavyKick())) down |= I_HK
  call heavyKick
  call pressed
  beqz a0, .L4
  ; engine/input.e16.ts:120  down |= I_HK
  ori s1, s1, 128
.L4:
  ; engine/input.e16.ts:121  if (pressed(B_UP)) down |= I_UP
  li a0, 1
  call pressed
  beqz a0, .L5
  ; engine/input.e16.ts:121  down |= I_UP
  ori s1, s1, 1
.L5:
  ; engine/input.e16.ts:122  if (pressed(B_DOWN)) down |= I_DOWN
  li a0, 2
  call pressed
  beqz a0, .L6
  ; engine/input.e16.ts:122  down |= I_DOWN
  ori s1, s1, 2
.L6:
  ; engine/input.e16.ts:123  return down
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/input.e16.ts:127 inputHeld(i, held) at -O1
;   i in s1
;   held in s2
inputHeld:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  mv s2, a1 ; held
  ; engine/input.e16.ts:128  inputPut(i, held, held & ~lastHeld[i])
  slli t0, s1, 1
  lw t0, lastHeld(t0)
  not t0, t0
  and t0, s2, t0
  mv a0, s1
  mv a1, s2
  mv a2, t0
  call inputPut
  ; engine/input.e16.ts:129  lastHeld[i] = held
  slli t0, s1, 1
  sw s2, lastHeld(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/input.e16.ts:133 inputExt(i) at -O1
;   i in s1
inputExt:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; engine/input.e16.ts:134  inputHeld(i, extHeld[i])
  slli t0, s1, 1
  lw t0, extHeld(t0)
  mv a0, s1
  mv a1, t0
  call inputHeld
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/input.e16.ts:138 inputNone(i) at -O1
;   i in s1
inputNone:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; engine/input.e16.ts:139  inputHeld(i, 0)
  mv a0, s1
  li a1, 0
  call inputHeld
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/input.e16.ts:143 heldNow(i) at -O1
;   i in a0
heldNow:
  ; engine/input.e16.ts:144  return ringH[i * 16 + ringAt]
  slli t0, a0, 4
  lw t1, 0x11c4(zero)
  add t0, t0, t1
  slli t0, t0, 1
  lw a0, ringH(t0)
.return:
  ret

; engine/input.e16.ts:148 buffered(i, mask) at -O1
;   i in a0
;   mask in a1
;   out in a2
;   k in a3
;   at in s1
buffered:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; engine/input.e16.ts:149  let out: u16 = 0
  li a2, 0 ; out
  ; engine/input.e16.ts:150  let k: u16 = 0
  li a3, 0 ; k
  ; engine/input.e16.ts:151  let at = ringAt
  lw s1, 0x11c4(zero)
  ; engine/input.e16.ts:152  while (k < BUFFER) {
  j .L3
.L1:
  ; engine/input.e16.ts:153  out |= ringD[i * 16 + at]
  slli t0, a0, 4
  add t0, t0, s1
  slli t0, t0, 1
  lw t0, ringD(t0)
  or a2, a2, t0
  ; engine/input.e16.ts:154  at = (at + 15) & 15
  addi t0, s1, 15
  andi s1, t0, 15
  ; engine/input.e16.ts:155  k++
  addi a3, a3, 1
.L3:
  li t0, 8
  bltu a3, t0, .L1
  ; engine/input.e16.ts:157  return out & mask
  and a0, a2, a1
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; engine/input.e16.ts:161 consume(i, mask) at -O1
;   i in a0
;   mask in a1
;   k in a2
;   at in a3
consume:
  ; engine/input.e16.ts:162  let k: u16 = 0
  li a2, 0 ; k
  ; engine/input.e16.ts:163  let at = ringAt
  lw a3, 0x11c4(zero)
  ; engine/input.e16.ts:164  while (k < BUFFER) {
  j .L3
.L1:
  ; engine/input.e16.ts:165  ringD[i * 16 + at] &= ~mask
  slli t0, a0, 4
  add t0, t0, a3
  slli t0, t0, 1
  addi t0, t0, ringD
  mv t1, t0
  lw t1, 0(t1)
  not t2, a1
  and t1, t1, t2
  sw t1, 0(t0)
  ; engine/input.e16.ts:166  at = (at + 15) & 15
  addi t0, a3, 15
  andi a3, t0, 15
  ; engine/input.e16.ts:167  k++
  addi a2, a2, 1
.L3:
  li t0, 8
  bltu a2, t0, .L1
.return:
  ret

; engine/fighter.e16.ts:122 fighterReset(i) at -O1
;   i in s1
;   left in s2
fighterReset:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:123  const left = i === 0
  sub t0, s1, zero
  seqz s2, t0
  ; engine/fighter.e16.ts:124  fX[i] = (left ? 256 - START_HALF : 256 + START_HALF) * 16
  slli t0, s1, 1
  addi t0, t0, fX
  mv t1, s2
  beqz t1, .L1
  li t1, 206
  j .L2
.L1:
  li t1, 306
.L2:
  slli t1, t1, 4
  sw t1, 0(t0)
  ; engine/fighter.e16.ts:125  fY[i] = 0
  slli t0, s1, 1
  sw zero, fY(t0)
  ; engine/fighter.e16.ts:126  fVX[i] = 0
  slli t0, s1, 1
  sw zero, fVX(t0)
  ; engine/fighter.e16.ts:127  fVY[i] = 0
  slli t0, s1, 1
  sw zero, fVY(t0)
  ; engine/fighter.e16.ts:128  fFace[i] = left ? 1 : 0
  slli t0, s1, 1
  addi t0, t0, fFace
  mv t1, s2
  beqz t1, .L3
  li t1, 1
  j .L4
.L3:
  li t1, 0
.L4:
  sw t1, 0(t0)
  ; engine/fighter.e16.ts:129  fState[i] = ST_STAND
  slli t0, s1, 1
  sw zero, fState(t0)
  ; engine/fighter.e16.ts:130  fStateT[i] = 0
  slli t0, s1, 1
  sw zero, fStateT(t0)
  ; engine/fighter.e16.ts:131  fLife[i] = prAt(i, P_LIFE)
  slli t0, s1, 1
  addi t0, t0, fLife
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  li a1, 0
  call prAt
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; engine/fighter.e16.ts:132  fMove[i] = 0
  slli t0, s1, 1
  sw zero, fMove(t0)
  ; engine/fighter.e16.ts:133  fMoveF[i] = 0
  slli t0, s1, 1
  sw zero, fMoveF(t0)
  ; engine/fighter.e16.ts:134  fHitDone[i] = 0
  slli t0, s1, 1
  sw zero, fHitDone(t0)
  ; engine/fighter.e16.ts:135  fCombo[i] = 0
  slli t0, s1, 1
  sw zero, fCombo(t0)
  ; engine/fighter.e16.ts:136  fStun[i] = 0
  slli t0, s1, 1
  sw zero, fStun(t0)
  ; engine/fighter.e16.ts:137  fCrouch[i] = 0
  slli t0, s1, 1
  sw zero, fCrouch(t0)
  ; engine/fighter.e16.ts:138  fAir[i] = 0
  slli t0, s1, 1
  sw zero, fAir(t0)
  ; engine/fighter.e16.ts:139  fAirUsed[i] = 0
  slli t0, s1, 1
  sw zero, fAirUsed(t0)
  ; engine/fighter.e16.ts:140  fKnock[i] = 0
  slli t0, s1, 1
  sw zero, fKnock(t0)
  ; engine/fighter.e16.ts:141  fPush[i] = 0
  slli t0, s1, 1
  sw zero, fPush(t0)
  ; engine/fighter.e16.ts:142  fPose[i] = PO_STAND
  slli t0, s1, 1
  sw zero, fPose(t0)
  ; engine/fighter.e16.ts:143  poseLoad(i, fSlot[i], PO_STAND)
  slli t0, s1, 1
  lw t0, fSlot(t0)
  mv a0, s1
  mv a1, t0
  li a2, 0
  call poseLoad
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/fighter.e16.ts:147 faceSign(i) at -O1
;   i in a0
faceSign:
  ; engine/fighter.e16.ts:148  return fFace[i] !== 0 ? 1 : -1
  slli t0, a0, 1
  lw t0, fFace(t0)
  beq t0, zero, .L1
  li t0, 1
  j .L2
.L1:
  li t0, 65535
.L2:
  mv a0, t0
.return:
  ret

; engine/fighter.e16.ts:151 enter(i, st) at -O1
;   i in a0
;   st in a1
enter:
  ; engine/fighter.e16.ts:152  fState[i] = st
  slli t0, a0, 1
  sw a1, fState(t0)
  ; engine/fighter.e16.ts:153  fStateT[i] = 0
  slli t0, a0, 1
  sw zero, fStateT(t0)
.return:
  ret

; engine/fighter.e16.ts:157 fightersSeen() at -O1
fightersSeen:
  ; engine/fighter.e16.ts:158  was[0] = fX[0]
  lw t0, fX(zero)
  sw t0, was(zero)
  ; engine/fighter.e16.ts:159  was[1] = fX[1]
  lw t0, fX+2(zero)
  sw t0, was+2(zero)
.return:
  ret

; engine/fighter.e16.ts:168 fighterStep(i) at -O1
;   i in s1
;   st in s2
;   now in s3
fighterStep:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:169  const st = fState[i]
  slli t0, s1, 1
  lw s2, fState(t0)
  ; engine/fighter.e16.ts:170  if (st === ST_ATTACK) attackStep(i)
  li t0, 5
  bne s2, t0, .L1
  ; engine/fighter.e16.ts:170  attackStep(i)
  mv a0, s1
  call attackStep
  j .L2
.L1:
  ; engine/fighter.e16.ts:171  if (st === ST_HIT || st === ST_GUARD) stunStep(i)
  li t0, 6
  beq s2, t0, .L4
  li t0, 7
  bne s2, t0, .L3
.L4:
  ; engine/fighter.e16.ts:171  stunStep(i)
  mv a0, s1
  call stunStep
  j .L5
.L3:
  ; engine/fighter.e16.ts:172  if (st === ST_PREJUMP) prejumpStep(i)
  li t0, 2
  bne s2, t0, .L6
  ; engine/fighter.e16.ts:172  prejumpStep(i)
  mv a0, s1
  call prejumpStep
  j .L7
.L6:
  ; engine/fighter.e16.ts:173  if (st === ST_JUMP) jumpStep(i)
  li t0, 3
  bne s2, t0, .L8
  ; engine/fighter.e16.ts:173  jumpStep(i)
  mv a0, s1
  call jumpStep
  j .L9
.L8:
  ; engine/fighter.e16.ts:174  timedStep(i, st)
  mv a0, s1
  mv a1, s2
  call timedStep
.L9:
.L7:
.L5:
.L2:
  ; engine/fighter.e16.ts:175  const now = fState[i]
  slli t0, s1, 1
  lw s3, fState(t0)
  ; engine/fighter.e16.ts:176  if (now === ST_STAND || now === ST_CROUCH) freeStep(i)
  beq s3, zero, .L11
  li t0, 1
  bne s3, t0, .L10
.L11:
  ; engine/fighter.e16.ts:176  freeStep(i)
  mv a0, s1
  call freeStep
.L10:
  ; engine/fighter.e16.ts:177  if (fAir[i] !== 0) fVY[i] = wrap16(fVY[i] - prAt(i, P_GRAVITY))
  slli t0, s1, 1
  lw t0, fAir(t0)
  beq t0, zero, .L12
  ; engine/fighter.e16.ts:177  fVY[i] = wrap16(fVY[i] - prAt(i, P_GRAVITY))
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fVY(t1)
  addi t0, t0, fVY
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  mv a0, s1
  li a1, 5
  call prAt
  lw t0, 0(sp)
  addi sp, sp, 2
  sub t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
.L12:
  ; engine/fighter.e16.ts:178  poseSet(i)
  mv a0, s1
  call poseSet
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/fighter.e16.ts:182 timedStep(i, st) at -O1
;   i in s1
;   st in s2
;   t in s3
timedStep:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i
  mv s2, a1 ; st
  ; engine/fighter.e16.ts:183  if (st !== ST_LAND && st !== ST_DOWN && st !== ST_WAKE) return
  li t0, 4
  beq s2, t0, .L1
  li t0, 8
  beq s2, t0, .L1
  li t0, 9
  beq s2, t0, .L1
  ; engine/fighter.e16.ts:183  return
  j .return
.L1:
  ; engine/fighter.e16.ts:184  fStateT[i]++
  slli t0, s1, 1
  addi t0, t0, fStateT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; engine/fighter.e16.ts:185  const t = fStateT[i]
  slli t0, s1, 1
  lw s3, fStateT(t0)
  ; engine/fighter.e16.ts:186  if (st === ST_LAND && t >= LAND_F) enter(i, ST_STAND)
  li t0, 4
  bne s2, t0, .L2
  li t0, 3
  bltu s3, t0, .L2
  ; engine/fighter.e16.ts:186  enter(i, ST_STAND)
  mv a0, s1
  li a1, 0
  call enter
.L2:
  ; engine/fighter.e16.ts:187  if (st === ST_DOWN && t >= DOWN_F) enter(i, fLife[i] === 0 ? ST_DEAD : ST_WAKE)
  li t0, 8
  bne s2, t0, .L3
  li t0, 36
  bltu s3, t0, .L3
  ; engine/fighter.e16.ts:187  enter(i, fLife[i] === 0 ? ST_DEAD : ST_WAKE)
  slli t0, s1, 1
  lw t1, fLife(t0)
  mv t0, s1
  li t2, 0
  bne t1, t2, .L4
  li t1, 10
  j .L5
.L4:
  li t1, 9
.L5:
  mv a0, t0
  mv a1, t1
  call enter
.L3:
  ; engine/fighter.e16.ts:188  if (st === ST_WAKE && t >= WAKE_F) enter(i, ST_STAND)
  li t0, 9
  bne s2, t0, .L6
  li t0, 12
  bltu s3, t0, .L6
  ; engine/fighter.e16.ts:188  enter(i, ST_STAND)
  mv a0, s1
  li a1, 0
  call enter
.L6:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/fighter.e16.ts:192 freeStep(i) at -O1
;   i in s1
;   held in s2
;   crouch in s3
freeStep:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:193  faceOther(i)
  mv a0, s1
  call faceOther
  ; engine/fighter.e16.ts:194  fVX[i] = 0
  slli t0, s1, 1
  sw zero, fVX(t0)
  ; engine/fighter.e16.ts:195  fCombo[i] = 0
  slli t0, s1, 1
  sw zero, fCombo(t0)
  ; engine/fighter.e16.ts:196  const held = heldNow(i)
  mv a0, s1
  call heldNow
  mv s2, a0 ; held
  ; engine/fighter.e16.ts:197  const crouch = (held & I_DOWN) !== 0
  andi t0, s2, 2
  sub t0, t0, zero
  snez s3, t0
  ; engine/fighter.e16.ts:198  if (attackTry(i, crouch ? 1 : 0)) return
  mv t0, s1
  mv t1, s3
  beqz t1, .L2
  li t1, 1
  j .L3
.L2:
  li t1, 0
.L3:
  mv a0, t0
  mv a1, t1
  call attackTry
  beqz a0, .L1
  ; engine/fighter.e16.ts:198  return
  j .return
.L1:
  ; engine/fighter.e16.ts:199  if ((held & I_UP) !== 0) {
  andi t0, s2, 1
  beq t0, zero, .L4
  ; engine/fighter.e16.ts:200  enter(i, ST_PREJUMP)
  mv a0, s1
  li a1, 2
  call enter
  ; engine/fighter.e16.ts:201  fJump[i] = (held & I_FWD) !== 0 ? 1 : (held & I_BACK) !== 0 ? 2 : 0
  slli t0, s1, 1
  andi t1, s2, 8
  addi t0, t0, fJump
  li t2, 0
  beq t1, t2, .L5
  li t1, 1
  j .L6
.L5:
  andi t1, s2, 4
  li t2, 0
  beq t1, t2, .L7
  li t1, 2
  j .L8
.L7:
  li t1, 0
.L8:
.L6:
  sw t1, 0(t0)
  ; engine/fighter.e16.ts:202  return
  j .return
.L4:
  ; engine/fighter.e16.ts:204  if (crouch) {
  beqz s3, .L9
  ; engine/fighter.e16.ts:205  if (fState[i] !== ST_CROUCH) enter(i, ST_CROUCH)
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 1
  beq t0, t1, .L10
  ; engine/fighter.e16.ts:205  enter(i, ST_CROUCH)
  mv a0, s1
  li a1, 1
  call enter
.L10:
  ; engine/fighter.e16.ts:206  return
  j .return
.L9:
  ; engine/fighter.e16.ts:208  if (fState[i] !== ST_STAND) enter(i, ST_STAND)
  slli t0, s1, 1
  lw t0, fState(t0)
  beq t0, zero, .L11
  ; engine/fighter.e16.ts:208  enter(i, ST_STAND)
  mv a0, s1
  li a1, 0
  call enter
.L11:
  ; engine/fighter.e16.ts:209  walk(i, held)
  mv a0, s1
  mv a1, s2
  call walk
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/fighter.e16.ts:213 faceOther(i) at -O1
;   i in a0
faceOther:
  ; engine/fighter.e16.ts:214  if (was[1 - i] > fX[i]) fFace[i] = 1
  li t0, 1
  sub t0, t0, a0
  slli t0, t0, 1
  lw t0, was(t0)
  slli t1, a0, 1
  lw t1, fX(t1)
  bgeu t1, t0, .L1
  ; engine/fighter.e16.ts:214  fFace[i] = 1
  slli t0, a0, 1
  li t1, 1
  sw t1, fFace(t0)
  j .L2
.L1:
  ; engine/fighter.e16.ts:215  if (was[1 - i] < fX[i]) fFace[i] = 0
  li t0, 1
  sub t0, t0, a0
  slli t0, t0, 1
  lw t0, was(t0)
  slli t1, a0, 1
  lw t1, fX(t1)
  bgeu t0, t1, .L3
  ; engine/fighter.e16.ts:215  fFace[i] = 0
  slli t0, a0, 1
  sw zero, fFace(t0)
.L3:
.L2:
.return:
  ret

; engine/fighter.e16.ts:219 walk(i, held) at -O1
;   i in s1
;   held in s2
;   s in s3
walk:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i
  mv s2, a1 ; held
  ; engine/fighter.e16.ts:220  const s = faceSign(i)
  mv a0, s1
  call faceSign
  mv s3, a0 ; s
  ; engine/fighter.e16.ts:221  if ((held & I_FWD) !== 0) fVX[i] = u16(s * i16(prAt(i, P_WALK_F)))
  andi t0, s2, 8
  beq t0, zero, .L1
  ; engine/fighter.e16.ts:221  fVX[i] = u16(s * i16(prAt(i, P_WALK_F)))
  slli t0, s1, 1
  addi t0, t0, fVX
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  li a1, 2
  call prAt
  mul t0, s3, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  j .L2
.L1:
  ; engine/fighter.e16.ts:222  if ((held & I_BACK) !== 0) fVX[i] = u16(-s * i16(prAt(i, P_WALK_B)))
  andi t0, s2, 4
  beq t0, zero, .L3
  ; engine/fighter.e16.ts:222  fVX[i] = u16(-s * i16(prAt(i, P_WALK_B)))
  slli t0, s1, 1
  neg t1, s3
  addi t0, t0, fVX
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  mv a0, s1
  li a1, 3
  call prAt
  lw t0, 0(sp)
  addi sp, sp, 2
  mul t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
.L3:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/fighter.e16.ts:229 attackTry(i, posture) at -O1
;   i in s3
;   posture in s0
;   b in s2
;   col in s1
attackTry:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  mv s3, a0 ; i
  mv s0, a1 ; posture
  ; engine/fighter.e16.ts:230  const b = buffered(i, I_ATTACKS)
  mv a0, s3
  li a1, 240
  call buffered
  mv s2, a0 ; b
  ; engine/fighter.e16.ts:231  if (b === 0) return false
  bne s2, zero, .L1
  ; engine/fighter.e16.ts:231  return false
  li a0, 0
  j .return
.L1:
  ; engine/fighter.e16.ts:232  let col: u16 = 0
  li s1, 0 ; col
  ; engine/fighter.e16.ts:233  if ((b & I_HP) !== 0) col = 1
  andi t0, s2, 32
  beq t0, zero, .L2
  ; engine/fighter.e16.ts:233  col = 1
  li s1, 1 ; col
  j .L3
.L2:
  ; engine/fighter.e16.ts:234  if ((b & I_HK) !== 0) col = 3
  andi t0, s2, 128
  beq t0, zero, .L4
  ; engine/fighter.e16.ts:234  col = 3
  li s1, 3 ; col
  j .L5
.L4:
  ; engine/fighter.e16.ts:235  if ((b & I_LP) !== 0) col = 0
  andi t0, s2, 16
  beq t0, zero, .L6
  ; engine/fighter.e16.ts:235  col = 0
  li s1, 0 ; col
  j .L7
.L6:
  ; engine/fighter.e16.ts:236  col = 2
  li s1, 2 ; col
.L7:
.L5:
.L3:
  ; engine/fighter.e16.ts:237  consume(i, I_ATTACKS)
  mv a0, s3
  li a1, 240
  call consume
  ; engine/fighter.e16.ts:238  moveStart(i, posture * 4 + col)
  slli t0, s0, 2
  add t0, t0, s1
  mv a0, s3
  mv a1, t0
  call moveStart
  ; engine/fighter.e16.ts:239  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; engine/fighter.e16.ts:243 moveStart(i, m) at -O1
;   i in s1
;   m in s2
moveStart:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  mv s2, a1 ; m
  ; engine/fighter.e16.ts:244  enter(i, ST_ATTACK)
  mv a0, s1
  li a1, 5
  call enter
  ; engine/fighter.e16.ts:245  fMove[i] = m
  slli t0, s1, 1
  sw s2, fMove(t0)
  ; engine/fighter.e16.ts:246  fMoveF[i] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, fMoveF(t0)
  ; engine/fighter.e16.ts:247  fHitDone[i] = 0
  slli t0, s1, 1
  sw zero, fHitDone(t0)
  ; engine/fighter.e16.ts:248  if (fAir[i] === 0) fVX[i] = 0
  slli t0, s1, 1
  lw t0, fAir(t0)
  bne t0, zero, .L1
  ; engine/fighter.e16.ts:248  fVX[i] = 0
  slli t0, s1, 1
  sw zero, fVX(t0)
  j .L2
.L1:
  ; engine/fighter.e16.ts:249  fAirUsed[i] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, fAirUsed(t0)
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/fighter.e16.ts:253 attackStep(i) at -O1
;   i in s1
;   m in s2
;   total in s3
attackStep:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:254  fMoveF[i]++
  slli t0, s1, 1
  addi t0, t0, fMoveF
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; engine/fighter.e16.ts:255  const m = fMove[i]
  slli t0, s1, 1
  lw s2, fMove(t0)
  ; engine/fighter.e16.ts:256  const total = mvAt(i, m, M_STARTUP) + mvAt(i, m, M_ACTIVE) + mvAt(i, m, M_RECOVERY) - 1
  mv a0, s1
  mv a1, s2
  li a2, 0
  call mvAt
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  mv a1, s2
  li a2, 1
  call mvAt
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  mv a1, s2
  li a2, 2
  call mvAt
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  addi s3, t0, -1
  ; engine/fighter.e16.ts:257  if (fMoveF[i] > total) {
  slli t0, s1, 1
  lw t0, fMoveF(t0)
  bgeu s3, t0, .L1
  ; engine/fighter.e16.ts:258  if (fAir[i] !== 0) enter(i, ST_JUMP)
  slli t0, s1, 1
  lw t0, fAir(t0)
  beq t0, zero, .L2
  ; engine/fighter.e16.ts:258  enter(i, ST_JUMP)
  mv a0, s1
  li a1, 3
  call enter
  j .L3
.L2:
  ; engine/fighter.e16.ts:259  enter(i, (heldNow(i) & I_DOWN) !== 0 ? ST_CROUCH : ST_STAND)
  mv a0, s1
  call heldNow
  andi t1, a0, 2
  mv t0, s1
  li t2, 0
  beq t1, t2, .L4
  li t1, 1
  j .L5
.L4:
  li t1, 0
.L5:
  mv a0, t0
  mv a1, t1
  call enter
.L3:
  ; engine/fighter.e16.ts:260  return
  j .return
.L1:
  ; engine/fighter.e16.ts:262  chainTry(i, m)
  mv a0, s1
  mv a1, s2
  call chainTry
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/fighter.e16.ts:269 chainTry(i, m) at -O1
;   i in s1
;   m in s3
;   s in 0(fp)
;   f in 2(fp)
;   kind in 4(fp)
;   button in 6(fp)
;   h in s2
chainTry:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw s2, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s1, a0 ; i
  mv s3, a1 ; m
  ; engine/fighter.e16.ts:270  if (fHitDone[i] === 0 || (mvAt(i, m, M_FLAGS) & F_CHAIN) === 0) return
  slli t0, s1, 1
  lw t0, fHitDone(t0)
  beq t0, zero, .L2
  mv a0, s1
  mv a1, s3
  li a2, 12
  call mvAt
  andi t0, a0, 1
  bne t0, zero, .L1
.L2:
  ; engine/fighter.e16.ts:270  return
  j .return
.L1:
  ; engine/fighter.e16.ts:271  const s = mvAt(i, m, M_STARTUP)
  mv a0, s1
  mv a1, s3
  li a2, 0
  call mvAt
  sw a0, 0(fp) ; s
  ; engine/fighter.e16.ts:272  const f = fMoveF[i]
  slli t0, s1, 1
  lw t0, fMoveF(t0)
  sw t0, 2(fp) ; f
  ; engine/fighter.e16.ts:273  if (f < s || f >= s + mvAt(i, m, M_ACTIVE) + CHAIN_LATE) return
  lw t0, 0(fp) ; s
  lw t1, 2(fp) ; f
  bltu t1, t0, .L4
  mv a0, s1
  mv a1, s3
  li a2, 1
  call mvAt
  lw t0, 0(fp) ; s
  add t0, t0, a0
  addi t0, t0, 4
  lw t1, 2(fp) ; f
  bltu t1, t0, .L3
.L4:
  ; engine/fighter.e16.ts:273  return
  j .return
.L3:
  ; engine/fighter.e16.ts:274  const kind = mvAt(i, m, M_KIND)
  mv a0, s1
  mv a1, s3
  li a2, 11
  call mvAt
  sw a0, 4(fp) ; kind
  ; engine/fighter.e16.ts:275  const button = (kind & 1) !== 0 ? I_HK : I_HP
  lw t0, 4(fp) ; kind
  andi t0, t0, 1
  beq t0, zero, .L5
  li t0, 128
  j .L6
.L5:
  li t0, 32
.L6:
  sw t0, 6(fp) ; button
  ; engine/fighter.e16.ts:276  if (buffered(i, button) === 0) return
  mv a0, s1
  lw a1, 6(fp)
  call buffered
  bne a0, zero, .L7
  ; engine/fighter.e16.ts:276  return
  j .return
.L7:
  ; engine/fighter.e16.ts:277  let h: u16 = 0
  li s2, 0 ; h
  ; engine/fighter.e16.ts:278  while (h < MOVES - 1) {
  j .L10
.L8:
  ; engine/fighter.e16.ts:279  if (mvAt(i, h, M_KIND) === (kind | K_HEAVY)) {
  mv a0, s1
  mv a1, s2
  li a2, 11
  call mvAt
  lw t0, 4(fp) ; kind
  ori t0, t0, 2
  bne a0, t0, .L12
  ; engine/fighter.e16.ts:280  consume(i, I_ATTACKS)
  mv a0, s1
  li a1, 240
  call consume
  ; engine/fighter.e16.ts:281  moveStart(i, h)
  mv a0, s1
  mv a1, s2
  call moveStart
  ; engine/fighter.e16.ts:282  return
  j .return
.L12:
  ; engine/fighter.e16.ts:284  h++
  addi s2, s2, 1
.L10:
  li t0, 12
  bltu s2, t0, .L8
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s2, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; engine/fighter.e16.ts:289 stunStep(i) at -O1
;   i in s1
stunStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:290  if (fStun[i] > 0) {
  slli t0, s1, 1
  lw t0, fStun(t0)
  bgeu zero, t0, .L1
  ; engine/fighter.e16.ts:291  fStun[i]--
  slli t0, s1, 1
  addi t0, t0, fStun
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, -1
  sw t1, 0(t0)
  ; engine/fighter.e16.ts:292  if (fState[i] === ST_GUARD) fCrouch[i] = (heldNow(i) & I_DOWN) !== 0 ? 1 : 0
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 7
  bne t0, t1, .L2
  ; engine/fighter.e16.ts:292  fCrouch[i] = (heldNow(i) & I_DOWN) !== 0 ? 1 : 0
  slli t0, s1, 1
  addi t0, t0, fCrouch
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  call heldNow
  andi t0, a0, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  li t2, 0
  xor t0, t0, t1
  xor t1, t1, t0
  xor t0, t0, t1
  beq t1, t2, .L3
  li t1, 1
  j .L4
.L3:
  li t1, 0
.L4:
  sw t1, 0(t0)
.L2:
  ; engine/fighter.e16.ts:293  return
  j .return
.L1:
  ; engine/fighter.e16.ts:295  if (fKnock[i] !== 0) return
  slli t0, s1, 1
  lw t0, fKnock(t0)
  beq t0, zero, .L5
  ; engine/fighter.e16.ts:295  return
  j .return
.L5:
  ; engine/fighter.e16.ts:296  enter(i, fCrouch[i] !== 0 ? ST_CROUCH : ST_STAND)
  slli t0, s1, 1
  lw t1, fCrouch(t0)
  mv t0, s1
  li t2, 0
  beq t1, t2, .L6
  li t1, 1
  j .L7
.L6:
  li t1, 0
.L7:
  mv a0, t0
  mv a1, t1
  call enter
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/fighter.e16.ts:300 prejumpStep(i) at -O1
;   i in s1
;   s in s2
prejumpStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:301  fStateT[i]++
  slli t0, s1, 1
  addi t0, t0, fStateT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; engine/fighter.e16.ts:302  if (fStateT[i] < PREJUMP_F) return
  slli t0, s1, 1
  lw t0, fStateT(t0)
  li t1, 3
  bgeu t0, t1, .L1
  ; engine/fighter.e16.ts:302  return
  j .return
.L1:
  ; engine/fighter.e16.ts:303  const s = faceSign(i)
  mv a0, s1
  call faceSign
  mv s2, a0 ; s
  ; engine/fighter.e16.ts:304  fAir[i] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, fAir(t0)
  ; engine/fighter.e16.ts:305  fAirUsed[i] = 0
  slli t0, s1, 1
  sw zero, fAirUsed(t0)
  ; engine/fighter.e16.ts:306  fVY[i] = prAt(i, P_JUMP)
  slli t0, s1, 1
  addi t0, t0, fVY
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  li a1, 4
  call prAt
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; engine/fighter.e16.ts:307  fVX[i] = 0
  slli t0, s1, 1
  sw zero, fVX(t0)
  ; engine/fighter.e16.ts:308  if (fJump[i] === 1) fVX[i] = u16(s * i16(prAt(i, P_JUMP_F)))
  slli t0, s1, 1
  lw t0, fJump(t0)
  li t1, 1
  bne t0, t1, .L2
  ; engine/fighter.e16.ts:308  fVX[i] = u16(s * i16(prAt(i, P_JUMP_F)))
  slli t0, s1, 1
  addi t0, t0, fVX
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  li a1, 6
  call prAt
  mul t0, s2, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
.L2:
  ; engine/fighter.e16.ts:309  if (fJump[i] === 2) fVX[i] = u16(-s * i16(prAt(i, P_JUMP_B)))
  slli t0, s1, 1
  lw t0, fJump(t0)
  li t1, 2
  bne t0, t1, .L3
  ; engine/fighter.e16.ts:309  fVX[i] = u16(-s * i16(prAt(i, P_JUMP_B)))
  slli t0, s1, 1
  neg t1, s2
  addi t0, t0, fVX
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  mv a0, s1
  li a1, 7
  call prAt
  lw t0, 0(sp)
  addi sp, sp, 2
  mul t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
.L3:
  ; engine/fighter.e16.ts:310  enter(i, ST_JUMP)
  mv a0, s1
  li a1, 3
  call enter
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/fighter.e16.ts:314 jumpStep(i) at -O1
;   i in s1
jumpStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:315  if (fAirUsed[i] === 0) attackTry(i, 2)
  slli t0, s1, 1
  lw t0, fAirUsed(t0)
  bne t0, zero, .L1
  ; engine/fighter.e16.ts:315  attackTry(i, 2)
  mv a0, s1
  li a1, 2
  call attackTry
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/fighter.e16.ts:319 poseSet(i) at -O1
;   i in s3
;   st in s2
;   p in s1
poseSet:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  mv s3, a0 ; i
  ; engine/fighter.e16.ts:320  const st = fState[i]
  slli t0, s3, 1
  lw s2, fState(t0)
  ; engine/fighter.e16.ts:321  let p: u16 = PO_STAND
  li s1, 0 ; p
  ; engine/fighter.e16.ts:322  if (st === ST_ATTACK) p = attackPose(i)
  li t0, 5
  bne s2, t0, .L1
  ; engine/fighter.e16.ts:322  p = attackPose(i)
  mv a0, s3
  call attackPose
  mv s1, a0 ; p
  j .L2
.L1:
  ; engine/fighter.e16.ts:323  if (st === ST_CROUCH) p = PO_CROUCH
  li t0, 1
  bne s2, t0, .L3
  ; engine/fighter.e16.ts:323  p = PO_CROUCH
  li s1, 1 ; p
  j .L4
.L3:
  ; engine/fighter.e16.ts:324  if (st === ST_PREJUMP) p = PO_PREJUMP
  li t0, 2
  bne s2, t0, .L5
  ; engine/fighter.e16.ts:324  p = PO_PREJUMP
  li s1, 2 ; p
  j .L6
.L5:
  ; engine/fighter.e16.ts:325  if (st === ST_JUMP) p = PO_JUMP
  li t0, 3
  bne s2, t0, .L7
  ; engine/fighter.e16.ts:325  p = PO_JUMP
  li s1, 3 ; p
  j .L8
.L7:
  ; engine/fighter.e16.ts:326  if (st === ST_LAND) p = PO_LAND
  li t0, 4
  bne s2, t0, .L9
  ; engine/fighter.e16.ts:326  p = PO_LAND
  li s1, 4 ; p
  j .L10
.L9:
  ; engine/fighter.e16.ts:327  if (st === ST_HIT) p = fKnock[i] !== 0 ? PO_FALLING : PO_HIT + fCrouch[i]
  li t0, 6
  bne s2, t0, .L11
  ; engine/fighter.e16.ts:327  p = fKnock[i] !== 0 ? PO_FALLING : PO_HIT + fCrouch[i]
  slli t0, s3, 1
  lw t0, fKnock(t0)
  beq t0, zero, .L12
  li t0, 11
  j .L13
.L12:
  slli t0, s3, 1
  lw t0, fCrouch(t0)
  addi t0, t0, 5
.L13:
  mv s1, t0 ; p
  j .L14
.L11:
  ; engine/fighter.e16.ts:328  if (st === ST_GUARD) p = PO_GUARD + fCrouch[i]
  li t0, 7
  bne s2, t0, .L15
  ; engine/fighter.e16.ts:328  p = PO_GUARD + fCrouch[i]
  slli t0, s3, 1
  lw t0, fCrouch(t0)
  addi s1, t0, 7
  j .L16
.L15:
  ; engine/fighter.e16.ts:329  if (st === ST_DOWN || st === ST_DEAD) p = PO_DOWN
  li t0, 8
  beq s2, t0, .L18
  li t0, 10
  bne s2, t0, .L17
.L18:
  ; engine/fighter.e16.ts:329  p = PO_DOWN
  li s1, 9 ; p
  j .L19
.L17:
  ; engine/fighter.e16.ts:330  if (st === ST_WAKE) p = PO_WAKE
  li t0, 9
  bne s2, t0, .L20
  ; engine/fighter.e16.ts:330  p = PO_WAKE
  li s1, 10 ; p
.L20:
.L19:
.L16:
.L14:
.L10:
.L8:
.L6:
.L4:
.L2:
  ; engine/fighter.e16.ts:331  fPose[i] = p
  slli t0, s3, 1
  sw s1, fPose(t0)
  ; engine/fighter.e16.ts:332  poseLoad(i, fSlot[i], p)
  slli t0, s3, 1
  lw t0, fSlot(t0)
  mv a0, s3
  mv a1, t0
  mv a2, s1
  call poseLoad
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; engine/fighter.e16.ts:335 attackPose(i) at -O1
;   i in s1
;   m in s2
;   s in 0(fp)
;   f in 2(fp)
;   base in s3
attackPose:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:336  const m = fMove[i]
  slli t0, s1, 1
  lw s2, fMove(t0)
  ; engine/fighter.e16.ts:337  const s = mvAt(i, m, M_STARTUP)
  mv a0, s1
  mv a1, s2
  li a2, 0
  call mvAt
  sw a0, 0(fp) ; s
  ; engine/fighter.e16.ts:338  const f = fMoveF[i]
  slli t0, s1, 1
  lw t0, fMoveF(t0)
  sw t0, 2(fp) ; f
  ; engine/fighter.e16.ts:339  const base = mvAt(i, m, M_POSE)
  mv a0, s1
  mv a1, s2
  li a2, 14
  call mvAt
  mv s3, a0 ; base
  ; engine/fighter.e16.ts:340  if (f < s) return base
  lw t0, 0(fp) ; s
  lw t1, 2(fp) ; f
  bgeu t1, t0, .L1
  ; engine/fighter.e16.ts:340  return base
  mv a0, s3
  j .return
.L1:
  ; engine/fighter.e16.ts:341  if (f < s + mvAt(i, m, M_ACTIVE)) return base + 1
  mv a0, s1
  mv a1, s2
  li a2, 1
  call mvAt
  lw t0, 0(fp) ; s
  add t0, t0, a0
  lw t1, 2(fp) ; f
  bgeu t1, t0, .L2
  ; engine/fighter.e16.ts:341  return base + 1
  addi a0, s3, 1
  j .return
.L2:
  ; engine/fighter.e16.ts:342  return base + 2
  addi a0, s3, 2
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; engine/fighter.e16.ts:346 inStartup(i) at -O1
;   i in s1
inStartup:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:347  return fState[i] === ST_ATTACK && fMoveF[i] < mvAt(i, fMove[i], M_STARTUP)
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 5
  sub t0, t0, t1
  seqz t0, t0
  mv t1, t0
  beqz t1, .L1
  slli t0, s1, 1
  lw t0, fMoveF(t0)
  slli t1, s1, 1
  lw t1, fMove(t1)
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  mv a1, t1
  li a2, 0
  call mvAt
  lw t0, 0(sp)
  addi sp, sp, 2
  sltu t0, t0, a0
.L1:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/fighter.e16.ts:351 inActive(i) at -O1
;   i in s1
;   s in s2
;   f in s3
inActive:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:352  if (fState[i] !== ST_ATTACK) return false
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 5
  beq t0, t1, .L1
  ; engine/fighter.e16.ts:352  return false
  li a0, 0
  j .return
.L1:
  ; engine/fighter.e16.ts:353  const s = mvAt(i, fMove[i], M_STARTUP)
  slli t0, s1, 1
  lw t0, fMove(t0)
  mv a0, s1
  mv a1, t0
  li a2, 0
  call mvAt
  mv s2, a0 ; s
  ; engine/fighter.e16.ts:354  const f = fMoveF[i]
  slli t0, s1, 1
  lw s3, fMoveF(t0)
  ; engine/fighter.e16.ts:355  return f >= s && f < s + mvAt(i, fMove[i], M_ACTIVE)
  sltu t0, s3, s2
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L2
  slli t0, s1, 1
  lw t0, fMove(t0)
  mv a0, s1
  mv a1, t0
  li a2, 1
  call mvAt
  add t0, s2, a0
  sltu t0, s3, t0
.L2:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/fighter.e16.ts:361 motion(i) at -O1
;   i in s1
;   p in s2
;   y in s3
motion:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:362  before[i] = fX[i]
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fX(t1)
  sw t1, before(t0)
  ; engine/fighter.e16.ts:363  const p = i16(fPush[i])
  slli t0, s1, 1
  lw s2, fPush(t0)
  ; engine/fighter.e16.ts:364  fX[i] = u16(i16(fX[i]) + i16(fVX[i]) + p)
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fX(t1)
  slli t2, s1, 1
  lw t2, fVX(t2)
  add t1, t1, t2
  add t1, t1, s2
  sw t1, fX(t0)
  ; engine/fighter.e16.ts:365  if (p > FRICTION) fPush[i] = u16(p - FRICTION)
  li t0, 4
  bge t0, s2, .L1
  ; engine/fighter.e16.ts:365  fPush[i] = u16(p - FRICTION)
  slli t0, s1, 1
  addi t1, s2, -4
  sw t1, fPush(t0)
  j .L2
.L1:
  ; engine/fighter.e16.ts:366  if (p < -FRICTION) fPush[i] = u16(p + FRICTION)
  li t0, 65532
  bge s2, t0, .L3
  ; engine/fighter.e16.ts:366  fPush[i] = u16(p + FRICTION)
  slli t0, s1, 1
  addi t1, s2, 4
  sw t1, fPush(t0)
  j .L4
.L3:
  ; engine/fighter.e16.ts:367  fPush[i] = 0
  slli t0, s1, 1
  sw zero, fPush(t0)
.L4:
.L2:
  ; engine/fighter.e16.ts:368  if (fAir[i] === 0) return
  slli t0, s1, 1
  lw t0, fAir(t0)
  bne t0, zero, .L5
  ; engine/fighter.e16.ts:368  return
  j .return
.L5:
  ; engine/fighter.e16.ts:369  const y = i16(fY[i]) + i16(fVY[i])
  slli t0, s1, 1
  lw t0, fY(t0)
  slli t1, s1, 1
  lw t1, fVY(t1)
  add s3, t0, t1
  ; engine/fighter.e16.ts:370  if (y > 0) {
  bge zero, s3, .L6
  ; engine/fighter.e16.ts:371  fY[i] = u16(y)
  slli t0, s1, 1
  sw s3, fY(t0)
  ; engine/fighter.e16.ts:372  return
  j .return
.L6:
  ; engine/fighter.e16.ts:374  land(i)
  mv a0, s1
  call land
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/fighter.e16.ts:377 land(i) at -O1
;   i in s1
;   st in s2
land:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:378  fY[i] = 0
  slli t0, s1, 1
  sw zero, fY(t0)
  ; engine/fighter.e16.ts:379  fVY[i] = 0
  slli t0, s1, 1
  sw zero, fVY(t0)
  ; engine/fighter.e16.ts:380  fVX[i] = 0
  slli t0, s1, 1
  sw zero, fVX(t0)
  ; engine/fighter.e16.ts:381  fAir[i] = 0
  slli t0, s1, 1
  sw zero, fAir(t0)
  ; engine/fighter.e16.ts:382  fAirUsed[i] = 0
  slli t0, s1, 1
  sw zero, fAirUsed(t0)
  ; engine/fighter.e16.ts:383  const st = fState[i]
  slli t0, s1, 1
  lw s2, fState(t0)
  ; engine/fighter.e16.ts:384  if (st === ST_HIT && fKnock[i] !== 0) {
  li t0, 6
  bne s2, t0, .L1
  slli t0, s1, 1
  lw t0, fKnock(t0)
  beq t0, zero, .L1
  ; engine/fighter.e16.ts:385  fKnock[i] = 0
  slli t0, s1, 1
  sw zero, fKnock(t0)
  ; engine/fighter.e16.ts:386  enter(i, ST_DOWN)
  mv a0, s1
  li a1, 8
  call enter
  j .L2
.L1:
  ; engine/fighter.e16.ts:387  if (st === ST_JUMP || st === ST_ATTACK) enter(i, ST_LAND)
  li t0, 3
  beq s2, t0, .L4
  li t0, 5
  bne s2, t0, .L3
.L4:
  ; engine/fighter.e16.ts:387  enter(i, ST_LAND)
  mv a0, s1
  li a1, 4
  call enter
.L3:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/fighter.e16.ts:391 half(i) at -O1
;   i in a0
half:
  ; engine/fighter.e16.ts:392  return bx[i * POSE_W + 2] >> 1
  slli t1, a0, 4
  slli t0, a0, 3
  add t0, t0, t1
  addi t0, t0, 2
  slli t0, t0, 1
  lw t0, bx(t0)
  srli a0, t0, 1
.return:
  ret

; engine/fighter.e16.ts:396 wall(i) at -O1
;   i in s1
;   h in s2
;   lo in s3
;   hi in s0
wall:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:397  const h = half(i)
  mv a0, s1
  call half
  mv s2, a0 ; h
  ; engine/fighter.e16.ts:398  const lo = (RING_L + h) * 16
  addi t0, s2, 32
  slli s3, t0, 4
  ; engine/fighter.e16.ts:399  const hi = (RING_R - h) * 16
  li t0, 480
  sub t0, t0, s2
  slli s0, t0, 4
  ; engine/fighter.e16.ts:400  if (fX[i] < lo) fX[i] = lo
  slli t0, s1, 1
  lw t0, fX(t0)
  bgeu t0, s3, .L1
  ; engine/fighter.e16.ts:400  fX[i] = lo
  slli t0, s1, 1
  sw s3, fX(t0)
.L1:
  ; engine/fighter.e16.ts:401  if (fX[i] > hi) fX[i] = hi
  slli t0, s1, 1
  lw t0, fX(t0)
  bgeu s0, t0, .L2
  ; engine/fighter.e16.ts:401  fX[i] = hi
  slli t0, s1, 1
  sw s0, fX(t0)
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; engine/fighter.e16.ts:408 apart() at -O1
;   l in a0
;   r in a1
;   gap in s2
;   excess in a3
;   outL in s3
;   outR in s0
;   cutL in a2
;   cutR in s1
apart:
  addi sp, sp, -8
  sw s2, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  ; engine/fighter.e16.ts:409  const l = fX[0] <= fX[1] ? 0 : 1
  lw t0, fX(zero)
  lw t1, fX+2(zero)
  bltu t1, t0, .L1
  li t0, 0
  j .L2
.L1:
  li t0, 1
.L2:
  mv a0, t0 ; l
  ; engine/fighter.e16.ts:410  const r = 1 - l
  li t0, 1
  sub a1, t0, a0
  ; engine/fighter.e16.ts:411  const gap = fX[r] - fX[l]
  slli t0, a1, 1
  lw t0, fX(t0)
  slli t1, a0, 1
  lw t1, fX(t1)
  sub s2, t0, t1
  ; engine/fighter.e16.ts:412  if (gap <= MAX_APART * 16) return
  li t0, 4096
  bltu t0, s2, .L3
  ; engine/fighter.e16.ts:412  return
  j .return
.L3:
  ; engine/fighter.e16.ts:413  const excess = gap - MAX_APART * 16
  addi a3, s2, -4096
  ; engine/fighter.e16.ts:414  const outL = before[l] > fX[l] ? before[l] - fX[l] : 0
  slli t0, a0, 1
  lw t0, before(t0)
  slli t1, a0, 1
  lw t1, fX(t1)
  bgeu t1, t0, .L4
  slli t0, a0, 1
  lw t0, before(t0)
  slli t1, a0, 1
  lw t1, fX(t1)
  sub t0, t0, t1
  j .L5
.L4:
  li t0, 0
.L5:
  mv s3, t0 ; outL
  ; engine/fighter.e16.ts:415  const outR = fX[r] > before[r] ? fX[r] - before[r] : 0
  slli t0, a1, 1
  lw t0, fX(t0)
  slli t1, a1, 1
  lw t1, before(t1)
  bgeu t1, t0, .L6
  slli t0, a1, 1
  lw t0, fX(t0)
  slli t1, a1, 1
  lw t1, before(t1)
  sub t0, t0, t1
  j .L7
.L6:
  li t0, 0
.L7:
  mv s0, t0 ; outR
  ; engine/fighter.e16.ts:416  let cutL: u16 = 0
  li a2, 0 ; cutL
  ; engine/fighter.e16.ts:417  let cutR: u16 = 0
  li s1, 0 ; cutR
  ; engine/fighter.e16.ts:418  if (outL > 0 && outR > 0) {
  bgeu zero, s3, .L8
  bgeu zero, s0, .L8
  ; engine/fighter.e16.ts:419  cutL = (excess + 1) >> 1
  addi t0, a3, 1
  srli a2, t0, 1
  ; engine/fighter.e16.ts:420  cutR = cutL
  mv s1, a2 ; cutR
  j .L9
.L8:
  ; engine/fighter.e16.ts:421  if (outL > 0) cutL = excess
  bgeu zero, s3, .L10
  ; engine/fighter.e16.ts:421  cutL = excess
  mv a2, a3 ; cutL
  j .L11
.L10:
  ; engine/fighter.e16.ts:422  cutR = excess
  mv s1, a3 ; cutR
.L11:
.L9:
  ; engine/fighter.e16.ts:423  fX[l] = fX[l] + cutL
  slli t0, a0, 1
  slli t1, a0, 1
  lw t1, fX(t1)
  add t1, t1, a2
  sw t1, fX(t0)
  ; engine/fighter.e16.ts:424  fX[r] = fX[r] - cutR
  slli t0, a1, 1
  slli t1, a1, 1
  lw t1, fX(t1)
  sub t1, t1, s1
  sw t1, fX(t0)
.return:
  lw s2, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; engine/fighter.e16.ts:431 bodies() at -O1
;   l in s1
;   r in s2
;   reach in s3
;   gap in 0(fp)
;   each in 2(fp)
;   still in 4(fp)
;   left in 6(fp)
bodies:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  ; engine/fighter.e16.ts:432  if (fAir[0] !== 0 || fAir[1] !== 0) return
  lw t0, fAir(zero)
  bne t0, zero, .L2
  lw t0, fAir+2(zero)
  beq t0, zero, .L1
.L2:
  ; engine/fighter.e16.ts:432  return
  j .return
.L1:
  ; engine/fighter.e16.ts:433  const l = leftOne()
  call leftOne
  mv s1, a0 ; l
  ; engine/fighter.e16.ts:434  const r = 1 - l
  li t0, 1
  sub s2, t0, s1
  ; engine/fighter.e16.ts:435  const reach = (half(l) + half(r)) * 16
  mv a0, s1
  call half
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  call half
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  slli s3, t0, 4
  ; engine/fighter.e16.ts:436  const gap = fX[r] - fX[l]
  slli t0, s2, 1
  lw t0, fX(t0)
  slli t1, s1, 1
  lw t1, fX(t1)
  sub t0, t0, t1
  sw t0, 0(fp) ; gap
  ; engine/fighter.e16.ts:437  if (gap >= reach) return
  lw t0, 0(fp) ; gap
  bltu t0, s3, .L3
  ; engine/fighter.e16.ts:437  return
  j .return
.L3:
  ; engine/fighter.e16.ts:438  const each = (reach - gap + 1) >> 1
  lw t0, 0(fp) ; gap
  sub t0, s3, t0
  addi t0, t0, 1
  srli t0, t0, 1
  sw t0, 2(fp) ; each
  ; engine/fighter.e16.ts:439  fX[l] = wrap16(fX[l] - each)
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fX(t1)
  lw t2, 2(fp) ; each
  sub t1, t1, t2
  sw t1, fX(t0)
  ; engine/fighter.e16.ts:440  fX[r] = fX[r] + each
  slli t0, s2, 1
  slli t1, s2, 1
  lw t1, fX(t1)
  lw t2, 2(fp) ; each
  add t1, t1, t2
  sw t1, fX(t0)
  ; engine/fighter.e16.ts:441  wall(l)
  mv a0, s1
  call wall
  ; engine/fighter.e16.ts:442  wall(r)
  mv a0, s2
  call wall
  ; engine/fighter.e16.ts:443  const still = fX[r] - fX[l]
  slli t0, s2, 1
  lw t0, fX(t0)
  slli t1, s1, 1
  lw t1, fX(t1)
  sub t0, t0, t1
  sw t0, 4(fp) ; still
  ; engine/fighter.e16.ts:444  if (still >= reach) return
  lw t0, 4(fp) ; still
  bltu t0, s3, .L4
  ; engine/fighter.e16.ts:444  return
  j .return
.L4:
  ; engine/fighter.e16.ts:445  const left = reach - still
  lw t0, 4(fp) ; still
  sub t0, s3, t0
  sw t0, 6(fp) ; left
  ; engine/fighter.e16.ts:446  if (fX[l] <= (RING_L + half(l)) * 16) fX[r] = fX[r] + left
  slli t0, s1, 1
  lw t0, fX(t0)
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  call half
  addi t0, a0, 32
  slli t0, t0, 4
  lw t1, 0(sp)
  addi sp, sp, 2
  bltu t0, t1, .L5
  ; engine/fighter.e16.ts:446  fX[r] = fX[r] + left
  slli t0, s2, 1
  slli t1, s2, 1
  lw t1, fX(t1)
  lw t2, 6(fp) ; left
  add t1, t1, t2
  sw t1, fX(t0)
  j .L6
.L5:
  ; engine/fighter.e16.ts:447  fX[l] = fX[l] - left
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fX(t1)
  lw t2, 6(fp) ; left
  sub t1, t1, t2
  sw t1, fX(t0)
.L6:
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; engine/fighter.e16.ts:451 leftOne() at -O1
leftOne:
  ; engine/fighter.e16.ts:452  if (fX[0] < fX[1]) return 0
  lw t0, fX(zero)
  lw t1, fX+2(zero)
  bgeu t0, t1, .L1
  ; engine/fighter.e16.ts:452  return 0
  li a0, 0
  ret
.L1:
  ; engine/fighter.e16.ts:453  if (fX[1] < fX[0]) return 1
  lw t0, fX+2(zero)
  lw t1, fX(zero)
  bgeu t0, t1, .L2
  ; engine/fighter.e16.ts:453  return 1
  li a0, 1
  ret
.L2:
  ; engine/fighter.e16.ts:454  return fFace[1] !== 0 && fFace[0] === 0 ? 1 : 0
  lw t0, fFace+2(zero)
  beq t0, zero, .L3
  lw t0, fFace(zero)
  bne t0, zero, .L3
  li t0, 1
  j .L4
.L3:
  li t0, 0
.L4:
  mv a0, t0
.return:
  ret

; engine/fighter.e16.ts:458 comboNote(d) at -O1
;   d in a0
comboNote:
  ; engine/fighter.e16.ts:459  if (fCombo[d] > fComboMax[d]) fComboMax[d] = fCombo[d]
  slli t0, a0, 1
  lw t0, fCombo(t0)
  slli t1, a0, 1
  lw t1, fComboMax(t1)
  bgeu t1, t0, .L1
  ; engine/fighter.e16.ts:459  fComboMax[d] = fCombo[d]
  slli t0, a0, 1
  slli t1, a0, 1
  lw t1, fCombo(t1)
  sw t1, fComboMax(t0)
.L1:
.return:
  ret

; engine/fighter.e16.ts:463 pushOf(push, weight, towardsRight) at -O1
;   push in a0
;   weight in a1
;   towardsRight in a2
;   v in a3
pushOf:
  ; engine/fighter.e16.ts:464  const v = div(push * 100, weight)
  li t0, 100
  mul t0, a0, t0
  divu a3, t0, a1
  ; engine/fighter.e16.ts:465  return towardsRight ? v : wrap16(0 - v)
  beqz a2, .L1
  mv t0, a3
  j .L2
.L1:
  sub t0, zero, a3
.L2:
  mv a0, t0
.return:
  ret

; engine/fighter.e16.ts:469 free(i) at -O1
;   i in a0
free:
  ; engine/fighter.e16.ts:470  return fState[i] === ST_STAND || fState[i] === ST_CROUCH
  slli t0, a0, 1
  lw t0, fState(t0)
  sub t0, t0, zero
  seqz t0, t0
  mv t1, t0
  bnez t1, .L1
  slli t0, a0, 1
  lw t0, fState(t0)
  li t1, 1
  sub t0, t0, t1
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; engine/fighter.e16.ts:474 holdsBack(i) at -O1
;   i in s1
holdsBack:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:475  return (heldNow(i) & I_BACK) !== 0
  mv a0, s1
  call heldNow
  andi t0, a0, 4
  sub t0, t0, zero
  snez a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/hit.e16.ts:60 boxesWorld() at -O1
boxesWorld:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/hit.e16.ts:61  boxesOf(0)
  li a0, 0
  call boxesOf
  ; engine/hit.e16.ts:62  boxesOf(1)
  li a0, 1
  call boxesOf
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/hit.e16.ts:65 boxesOf(i) at -O1
;   i in a0
;   x in s2
;   y in 4(fp)
;   right in 6(fp)
;   k in a2
;   at in a3
;   w in s1
;   o in a1
;   bx0 in s3
;   left in 0(fp)
;   top in 2(fp)
boxesOf:
  addi sp, sp, -16
  sw s2, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  ; engine/hit.e16.ts:66  const x = i16(fX[i] >> 4)
  slli t0, a0, 1
  lw t0, fX(t0)
  srli s2, t0, 4
  ; engine/hit.e16.ts:67  const y = i16(fY[i] >> 4)
  slli t0, a0, 1
  lw t0, fY(t0)
  srli t0, t0, 4
  sw t0, 4(fp) ; y
  ; engine/hit.e16.ts:68  const right = fFace[i] !== 0
  slli t0, a0, 1
  lw t0, fFace(t0)
  sub t0, t0, zero
  snez t0, t0
  sw t0, 6(fp) ; right
  ; engine/hit.e16.ts:69  let k: u16 = 0
  li a2, 0 ; k
  ; engine/hit.e16.ts:70  while (k < BOXES) {
  j .L3
.L1:
  ; engine/hit.e16.ts:71  const at = i * POSE_W + k * 4
  slli t1, a0, 4
  slli t0, a0, 3
  add t0, t0, t1
  slli t1, a2, 2
  add a3, t0, t1
  ; engine/hit.e16.ts:72  const w = i16(bx[at + 2])
  addi t0, a3, 2
  slli t0, t0, 1
  lw s1, bx(t0)
  ; engine/hit.e16.ts:73  const o = i * 24 + k * 4
  slli t1, a0, 4
  slli t0, a0, 3
  add t0, t0, t1
  slli t1, a2, 2
  add a1, t0, t1
  ; engine/hit.e16.ts:74  if (w === 0) {
  bne s1, zero, .L5
  ; engine/hit.e16.ts:75  wb[o] = 0
  slli t0, a1, 1
  sw zero, wb(t0)
  ; engine/hit.e16.ts:76  wb[o + 1] = 0
  addi t0, a1, 1
  slli t0, t0, 1
  sw zero, wb(t0)
  j .L6
.L5:
  ; engine/hit.e16.ts:78  const bx0 = i16(bx[at])
  slli t0, a3, 1
  lw s3, bx(t0)
  ; engine/hit.e16.ts:79  const left = right ? x + bx0 : x - bx0 - w
  lw t0, 6(fp) ; right
  beqz t0, .L7
  add t0, s2, s3
  j .L8
.L7:
  sub t0, s2, s3
  sub t0, t0, s1
.L8:
  sw t0, 0(fp) ; left
  ; engine/hit.e16.ts:80  const top = y + i16(bx[at + 1])
  addi t0, a3, 1
  slli t0, t0, 1
  lw t0, bx(t0)
  lw t1, 4(fp) ; y
  add t1, t1, t0
  sw t1, 2(fp) ; top
  ; engine/hit.e16.ts:81  wb[o] = u16(left)
  slli t0, a1, 1
  lw t1, 0(fp) ; left
  sw t1, wb(t0)
  ; engine/hit.e16.ts:82  wb[o + 1] = u16(left + w)
  addi t0, a1, 1
  slli t0, t0, 1
  lw t1, 0(fp) ; left
  add t1, t1, s1
  sw t1, wb(t0)
  ; engine/hit.e16.ts:83  wb[o + 2] = u16(top)
  addi t0, a1, 2
  slli t0, t0, 1
  lw t1, 2(fp) ; top
  sw t1, wb(t0)
  ; engine/hit.e16.ts:84  wb[o + 3] = u16(top - i16(bx[at + 3]))
  addi t0, a1, 3
  slli t0, t0, 1
  addi t1, a3, 3
  slli t1, t1, 1
  lw t1, bx(t1)
  lw t2, 2(fp) ; top
  sub t2, t2, t1
  sw t2, wb(t0)
.L6:
  ; engine/hit.e16.ts:86  k++
  addi a2, a2, 1
.L3:
  li t0, 6
  bltu a2, t0, .L1
.return:
  mv sp, fp
  lw s2, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; engine/hit.e16.ts:91 overlap(a, ka, b, kb) at -O1
;   a in a0
;   ka in a1
;   b in a2
;   kb in a3
;   p in s1
;   q in s2
overlap:
  addi sp, sp, -4
  sw s1, 0(sp)
  sw s2, 2(sp)
  ; engine/hit.e16.ts:92  const p = a * 24 + ka * 4
  slli t1, a0, 4
  slli t0, a0, 3
  add t0, t0, t1
  slli t1, a1, 2
  add s1, t0, t1
  ; engine/hit.e16.ts:93  const q = b * 24 + kb * 4
  slli t1, a2, 4
  slli t0, a2, 3
  add t0, t0, t1
  slli t1, a3, 2
  add s2, t0, t1
  ; engine/hit.e16.ts:94  return (
  slli t0, s1, 1
  lw t0, wb(t0)
  addi t1, s2, 1
  slli t1, t1, 1
  lw t1, wb(t1)
  slt t0, t0, t1
  mv t1, t0
  beqz t1, .L3
  slli t0, s2, 1
  lw t0, wb(t0)
  addi t1, s1, 1
  slli t1, t1, 1
  lw t1, wb(t1)
  slt t0, t0, t1
.L3:
  mv t1, t0
  beqz t1, .L2
  addi t0, s1, 3
  slli t0, t0, 1
  lw t0, wb(t0)
  addi t1, s2, 2
  slli t1, t1, 1
  lw t1, wb(t1)
  slt t0, t0, t1
.L2:
  mv t1, t0
  beqz t1, .L1
  addi t0, s2, 3
  slli t0, t0, 1
  lw t0, wb(t0)
  addi t1, s1, 2
  slli t1, t1, 1
  lw t1, wb(t1)
  slt t0, t0, t1
.L1:
  mv a0, t0
.return:
  lw s1, 0(sp)
  lw s2, 2(sp)
  addi sp, sp, 4
  ret

; engine/hit.e16.ts:103 strikes(a) at -O1
;   a in s1
;   d in s0
;   h in s2
;   k in s3
strikes:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s1, a0 ; a
  ; engine/hit.e16.ts:104  if (!inActive(a) || fHitDone[a] !== 0) return false
  mv a0, s1
  call inActive
  beqz a0, .L2
  slli t0, s1, 1
  lw t0, fHitDone(t0)
  beq t0, zero, .L1
.L2:
  ; engine/hit.e16.ts:104  return false
  li a0, 0
  j .return
.L1:
  ; engine/hit.e16.ts:105  const d = 1 - a
  li t0, 1
  sub s0, t0, s1
  ; engine/hit.e16.ts:106  let h: u16 = 4
  li s2, 4 ; h
  ; engine/hit.e16.ts:107  while (h < 6) {
  j .L5
.L3:
  ; engine/hit.e16.ts:108  let k: u16 = 1
  li s3, 1 ; k
  ; engine/hit.e16.ts:109  while (k < 4) {
  j .L9
.L7:
  ; engine/hit.e16.ts:110  if (overlap(a, h, d, k)) return true
  mv a0, s1
  mv a1, s2
  mv a2, s0
  mv a3, s3
  call overlap
  beqz a0, .L11
  ; engine/hit.e16.ts:110  return true
  li a0, 1
  j .return
.L11:
  ; engine/hit.e16.ts:111  k++
  addi s3, s3, 1
.L9:
  li t0, 4
  bltu s3, t0, .L7
  ; engine/hit.e16.ts:113  h++
  addi s2, s2, 1
.L5:
  li t0, 6
  bltu s2, t0, .L3
  ; engine/hit.e16.ts:115  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; engine/hit.e16.ts:132 hitstopIs(n) at -O1
;   n in a0
hitstopIs:
  ; engine/hit.e16.ts:133  hitstop = n
  sw a0, 0x129e(zero)
.return:
  ret

; engine/hit.e16.ts:138 scaleOf(n) at -O1
;   n in a0
;   k in a1
scaleOf:
  ; engine/hit.e16.ts:139  const k = n > SCALE_LAST ? SCALE_LAST : n
  li t0, 6
  bgeu t0, a0, .L1
  li t0, 6
  j .L2
.L1:
  mv t0, a0
.L2:
  mv a1, t0 ; k
  ; engine/hit.e16.ts:140  if (k === 0) return 256
  bne a1, zero, .L3
  ; engine/hit.e16.ts:140  return 256
  li a0, 256
  ret
.L3:
  ; engine/hit.e16.ts:141  if (k === 1) return 230
  li t0, 1
  bne a1, t0, .L4
  ; engine/hit.e16.ts:141  return 230
  li a0, 230
  ret
.L4:
  ; engine/hit.e16.ts:142  if (k === 2) return 205
  li t0, 2
  bne a1, t0, .L5
  ; engine/hit.e16.ts:142  return 205
  li a0, 205
  ret
.L5:
  ; engine/hit.e16.ts:143  if (k === 3) return 179
  li t0, 3
  bne a1, t0, .L6
  ; engine/hit.e16.ts:143  return 179
  li a0, 179
  ret
.L6:
  ; engine/hit.e16.ts:144  if (k === 4) return 154
  li t0, 4
  bne a1, t0, .L7
  ; engine/hit.e16.ts:144  return 154
  li a0, 154
  ret
.L7:
  ; engine/hit.e16.ts:145  if (k === 5) return 128
  li t0, 5
  bne a1, t0, .L8
  ; engine/hit.e16.ts:145  return 128
  li a0, 128
  ret
.L8:
  ; engine/hit.e16.ts:146  return 102
  li a0, 102
.return:
  ret

; engine/hit.e16.ts:150 damageOf(base, n, counter) at -O1
;   base in s3
;   n in 0(fp)
;   counter in 2(fp)
;   f in s1
;   d in s2
damageOf:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s3, a0 ; base
  sw a1, 0(fp) ; n
  sw a2, 2(fp) ; counter
  ; engine/hit.e16.ts:151  let f = scaleOf(n - 1)
  lw t0, 0(fp) ; n
  addi a0, t0, -1
  call scaleOf
  mv s1, a0 ; f
  ; engine/hit.e16.ts:152  if (counter) f = f + ((f * 13) >> 6)
  lw t0, 2(fp) ; counter
  beqz t0, .L1
  ; engine/hit.e16.ts:152  f = f + ((f * 13) >> 6)
  li t0, 13
  mul t0, s1, t0
  srli t0, t0, 6
  add s1, s1, t0
.L1:
  ; engine/hit.e16.ts:153  const d = (base * f + 128) >> 8
  mul t0, s3, s1
  addi t0, t0, 128
  srli s2, t0, 8
  ; engine/hit.e16.ts:154  return d === 0 ? 1 : d
  bne s2, zero, .L2
  li t0, 1
  j .L3
.L2:
  mv t0, s2
.L3:
  mv a0, t0
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; engine/hit.e16.ts:158 struckClear() at -O1
struckClear:
  ; engine/hit.e16.ts:159  struck[0] = 0
  sw zero, struck(zero)
  ; engine/hit.e16.ts:160  struck[1] = 0
  sw zero, struck+2(zero)
  ; engine/hit.e16.ts:161  dealt[0] = 0
  sw zero, dealt(zero)
  ; engine/hit.e16.ts:162  dealt[1] = 0
  sw zero, dealt+2(zero)
.return:
  ret

; engine/hit.e16.ts:166 hitsResolve() at -O1
;   s0 in s1
;   s1 in s2
hitsResolve:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; engine/hit.e16.ts:167  const s0 = strikes(0)
  li a0, 0
  call strikes
  mv s1, a0 ; s0
  ; engine/hit.e16.ts:168  const s1 = strikes(1)
  li a0, 1
  call strikes
  mv s2, a0 ; s1
  ; engine/hit.e16.ts:169  if (s0) judge(0)
  beqz s1, .L1
  ; engine/hit.e16.ts:169  judge(0)
  li a0, 0
  call judge
.L1:
  ; engine/hit.e16.ts:170  if (s1) judge(1)
  beqz s2, .L2
  ; engine/hit.e16.ts:170  judge(1)
  li a0, 1
  call judge
.L2:
  ; engine/hit.e16.ts:171  if (s0) deal(0)
  beqz s1, .L3
  ; engine/hit.e16.ts:171  deal(0)
  li a0, 0
  call deal
.L3:
  ; engine/hit.e16.ts:172  if (s1) deal(1)
  beqz s2, .L4
  ; engine/hit.e16.ts:172  deal(1)
  li a0, 1
  call deal
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/hit.e16.ts:176 crouched(d) at -O1
;   d in s1
;   st in s2
crouched:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; d
  ; engine/hit.e16.ts:177  const st = fState[d]
  slli t0, s1, 1
  lw s2, fState(t0)
  ; engine/hit.e16.ts:178  if (st === ST_CROUCH) return true
  li t0, 1
  bne s2, t0, .L1
  ; engine/hit.e16.ts:178  return true
  li a0, 1
  j .return
.L1:
  ; engine/hit.e16.ts:179  if (st === ST_GUARD || st === ST_HIT) return fCrouch[d] !== 0
  li t0, 7
  beq s2, t0, .L3
  li t0, 6
  bne s2, t0, .L2
.L3:
  ; engine/hit.e16.ts:179  return fCrouch[d] !== 0
  slli t0, s1, 1
  lw t0, fCrouch(t0)
  sub t0, t0, zero
  snez a0, t0
  j .return
.L2:
  ; engine/hit.e16.ts:180  if (st === ST_ATTACK) return ((mvAt(d, fMove[d], M_KIND) >> 2) & 3) === 1
  li t0, 5
  bne s2, t0, .L4
  ; engine/hit.e16.ts:180  return ((mvAt(d, fMove[d], M_KIND) >> 2) & 3) === 1
  slli t0, s1, 1
  lw t0, fMove(t0)
  mv a0, s1
  mv a1, t0
  li a2, 11
  call mvAt
  srli t0, a0, 2
  andi t0, t0, 3
  li t1, 1
  sub t0, t0, t1
  seqz a0, t0
  j .return
.L4:
  ; engine/hit.e16.ts:181  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/hit.e16.ts:185 guards(d, height) at -O1
;   d in s1
;   height in s2
;   guarding in s3
guards:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; d
  mv s2, a1 ; height
  ; engine/hit.e16.ts:186  if (fAir[d] !== 0) return false
  slli t0, s1, 1
  lw t0, fAir(t0)
  beq t0, zero, .L1
  ; engine/hit.e16.ts:186  return false
  li a0, 0
  j .return
.L1:
  ; engine/hit.e16.ts:187  const guarding = fState[d] === ST_GUARD || (free(d) && holdsBack(d))
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 7
  sub t0, t0, t1
  seqz t0, t0
  mv t1, t0
  bnez t1, .L2
  mv a0, s1
  call free
  mv t1, a0
  mv t0, a0
  beqz t1, .L3
  mv a0, s1
  call holdsBack
  mv t0, a0
.L3:
.L2:
  mv s3, t0 ; guarding
  ; engine/hit.e16.ts:188  if (!guarding) return false
  bnez s3, .L4
  ; engine/hit.e16.ts:188  return false
  li a0, 0
  j .return
.L4:
  ; engine/hit.e16.ts:189  if (height === H_HIGH) return true
  li t0, 1
  bne s2, t0, .L5
  ; engine/hit.e16.ts:189  return true
  li a0, 1
  j .return
.L5:
  ; engine/hit.e16.ts:190  if (height === H_LOW) return crouched(d)
  li t0, 2
  bne s2, t0, .L6
  ; engine/hit.e16.ts:190  return crouched(d)
  mv a0, s1
  call crouched
  j .return
.L6:
  ; engine/hit.e16.ts:191  return !crouched(d)
  mv a0, s1
  call crouched
  seqz a0, a0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/hit.e16.ts:195 judge(a) at -O1
;   a in s2
;   d in s3
;   m in s0
;   w in s1
judge:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; a
  ; engine/hit.e16.ts:196  const d = 1 - a
  li t0, 1
  sub s3, t0, s2
  ; engine/hit.e16.ts:197  const m = fMove[a]
  slli t0, s2, 1
  lw s0, fMove(t0)
  ; engine/hit.e16.ts:198  moveOf[a] = m
  slli t0, s2, 1
  sw s0, moveOf(t0)
  ; engine/hit.e16.ts:199  let w: u16 = 0
  li s1, 0 ; w
  ; engine/hit.e16.ts:200  if (guards(d, mvAt(a, m, M_HEIGHT))) w |= W_GUARDED
  mv a0, s2
  mv a1, s0
  li a2, 10
  call mvAt
  mv a1, a0
  mv a0, s3
  call guards
  beqz a0, .L1
  ; engine/hit.e16.ts:200  w |= W_GUARDED
  ori s1, s1, 1
  j .L2
.L1:
  ; engine/hit.e16.ts:201  if (inStartup(d)) w |= W_COUNTER
  mv a0, s3
  call inStartup
  beqz a0, .L3
  ; engine/hit.e16.ts:201  w |= W_COUNTER
  ori s1, s1, 2
.L3:
.L2:
  ; engine/hit.e16.ts:202  if (fState[d] === ST_HIT) w |= W_AGAIN
  slli t0, s3, 1
  lw t0, fState(t0)
  li t1, 6
  bne t0, t1, .L4
  ; engine/hit.e16.ts:202  w |= W_AGAIN
  ori s1, s1, 4
.L4:
  ; engine/hit.e16.ts:203  if (crouched(d)) w |= W_CROUCH
  mv a0, s3
  call crouched
  beqz a0, .L5
  ; engine/hit.e16.ts:203  w |= W_CROUCH
  ori s1, s1, 8
.L5:
  ; engine/hit.e16.ts:204  how[a] = w
  slli t0, s2, 1
  sw s1, how(t0)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; engine/hit.e16.ts:208 deal(a) at -O1
;   a in s2
;   d in s1
;   m in s3
;   w in 0(fp)
;   toRight in 6(fp)
;   weight in 8(fp)
;   stop in 10(fp)
;   counter in 2(fp)
;   n in 12(fp)
;   dmg in 4(fp)
;   push in 14(fp)
;   down in 16(fp)
deal:
  addi sp, sp, -28
  sw ra, 18(sp)
  sw s2, 20(sp)
  sw s1, 22(sp)
  sw s3, 24(sp)
  sw s0, 26(sp)
  mv fp, sp
  mv s2, a0 ; a
  ; engine/hit.e16.ts:209  const d = 1 - a
  li t0, 1
  sub s1, t0, s2
  ; engine/hit.e16.ts:210  const m = moveOf[a]
  slli t0, s2, 1
  lw s3, moveOf(t0)
  ; engine/hit.e16.ts:211  const w = how[a]
  slli t0, s2, 1
  lw t0, how(t0)
  sw t0, 0(fp) ; w
  ; engine/hit.e16.ts:212  const toRight = fFace[a] !== 0
  slli t0, s2, 1
  lw t0, fFace(t0)
  sub t0, t0, zero
  snez t0, t0
  sw t0, 6(fp) ; toRight
  ; engine/hit.e16.ts:213  const weight = prAt(d, P_WEIGHT)
  mv a0, s1
  li a1, 1
  call prAt
  sw a0, 8(fp) ; weight
  ; engine/hit.e16.ts:214  fHitDone[a] = 1
  slli t0, s2, 1
  li t1, 1
  sw t1, fHitDone(t0)
  ; engine/hit.e16.ts:215  fCrouch[d] = (w & W_CROUCH) !== 0 ? 1 : 0
  slli t0, s1, 1
  lw t1, 0(fp) ; w
  andi t1, t1, 8
  addi t0, t0, fCrouch
  li t2, 0
  beq t1, t2, .L1
  li t1, 1
  j .L2
.L1:
  li t1, 0
.L2:
  sw t1, 0(t0)
  ; engine/hit.e16.ts:216  const stop = mvAt(a, m, M_HITSTOP)
  mv a0, s2
  mv a1, s3
  li a2, 7
  call mvAt
  sw a0, 10(fp) ; stop
  ; engine/hit.e16.ts:217  if (stop > hitstop) hitstop = stop
  lw t0, 0x129e(zero)
  lw t1, 10(fp) ; stop
  bgeu t0, t1, .L3
  ; engine/hit.e16.ts:217  hitstop = stop
  lw t0, 10(fp) ; stop
  sw t0, 0x129e(zero)
.L3:
  ; engine/hit.e16.ts:218  if ((w & W_GUARDED) !== 0) {
  lw t0, 0(fp) ; w
  andi t0, t0, 1
  beq t0, zero, .L4
  ; engine/hit.e16.ts:219  enter(d, ST_GUARD)
  mv a0, s1
  li a1, 7
  call enter
  ; engine/hit.e16.ts:220  fStun[d] = mvAt(a, m, M_BLOCKSTUN)
  slli t0, s1, 1
  addi t0, t0, fStun
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s2
  mv a1, s3
  li a2, 6
  call mvAt
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; engine/hit.e16.ts:221  fPush[d] = pushOf(mvAt(a, m, M_PUSH_GUARD), weight, toRight)
  slli t0, s1, 1
  addi t0, t0, fPush
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s2
  mv a1, s3
  li a2, 9
  call mvAt
  lw a1, 8(fp)
  lw a2, 6(fp)
  call pushOf
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; engine/hit.e16.ts:222  struck[a] = 2
  slli t0, s2, 1
  li t1, 2
  sw t1, struck(t0)
  ; engine/hit.e16.ts:223  return
  j .return
.L4:
  ; engine/hit.e16.ts:225  const counter = (w & W_COUNTER) !== 0
  lw t0, 0(fp) ; w
  andi t0, t0, 2
  sub t0, t0, zero
  snez t0, t0
  sw t0, 2(fp) ; counter
  ; engine/hit.e16.ts:226  const n = (w & W_AGAIN) !== 0 ? fCombo[d] + 1 : 1
  lw t0, 0(fp) ; w
  andi t0, t0, 4
  beq t0, zero, .L5
  slli t0, s1, 1
  lw t0, fCombo(t0)
  addi t0, t0, 1
  j .L6
.L5:
  li t0, 1
.L6:
  sw t0, 12(fp) ; n
  ; engine/hit.e16.ts:227  const dmg = damageOf(mvAt(a, m, M_DAMAGE), n, counter)
  mv a0, s2
  mv a1, s3
  li a2, 3
  call mvAt
  lw a1, 12(fp)
  lw a2, 2(fp)
  call damageOf
  sw a0, 4(fp) ; dmg
  ; engine/hit.e16.ts:228  fLife[d] = dmg >= fLife[d] ? 0 : fLife[d] - dmg
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fLife(t1)
  addi t0, t0, fLife
  mv t2, t1
  lw t1, 4(fp)
  bltu t1, t2, .L7
  li t1, 0
  j .L8
.L7:
  slli t1, s1, 1
  lw t1, fLife(t1)
  lw t2, 4(fp) ; dmg
  sub t1, t1, t2
.L8:
  sw t1, 0(t0)
  ; engine/hit.e16.ts:229  fCombo[d] = n
  slli t0, s1, 1
  lw t1, 12(fp) ; n
  sw t1, fCombo(t0)
  ; engine/hit.e16.ts:230  comboNote(d)
  mv a0, s1
  call comboNote
  ; engine/hit.e16.ts:231  dealt[a] = dmg
  slli t0, s2, 1
  lw t1, 4(fp) ; dmg
  sw t1, dealt(t0)
  ; engine/hit.e16.ts:232  struck[a] = counter ? 3 : 1
  slli t0, s2, 1
  addi t0, t0, struck
  lw t1, 2(fp)
  beqz t1, .L9
  li t1, 3
  j .L10
.L9:
  li t1, 1
.L10:
  sw t1, 0(t0)
  ; engine/hit.e16.ts:233  const push = pushOf(mvAt(a, m, M_PUSH_HIT), weight, toRight)
  mv a0, s2
  mv a1, s3
  li a2, 8
  call mvAt
  lw a1, 8(fp)
  lw a2, 6(fp)
  call pushOf
  sw a0, 14(fp) ; push
  ; engine/hit.e16.ts:234  const down = (mvAt(a, m, M_FLAGS) & F_KNOCKDOWN) !== 0
  mv a0, s2
  mv a1, s3
  li a2, 12
  call mvAt
  andi t0, a0, 2
  sub t0, t0, zero
  snez t0, t0
  sw t0, 16(fp) ; down
  ; engine/hit.e16.ts:235  if (down || fAir[d] !== 0 || fLife[d] === 0) {
  lw t0, 16(fp) ; down
  bnez t0, .L12
  slli t0, s1, 1
  lw t0, fAir(t0)
  bne t0, zero, .L12
  slli t0, s1, 1
  lw t0, fLife(t0)
  bne t0, zero, .L11
.L12:
  ; engine/hit.e16.ts:236  knock(d, push)
  mv a0, s1
  lw a1, 14(fp)
  call knock
  ; engine/hit.e16.ts:237  return
  j .return
.L11:
  ; engine/hit.e16.ts:239  enter(d, ST_HIT)
  mv a0, s1
  li a1, 6
  call enter
  ; engine/hit.e16.ts:240  fStun[d] = mvAt(a, m, M_HITSTUN) + (counter ? 4 : 0)
  slli t0, s1, 1
  addi t0, t0, fStun
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s2
  mv a1, s3
  li a2, 5
  call mvAt
  lw t0, 0(sp)
  addi sp, sp, 2
  mv t1, a0
  lw t2, 2(fp)
  beqz t2, .L13
  li t2, 4
  j .L14
.L13:
  li t2, 0
.L14:
  add t1, t1, t2
  sw t1, 0(t0)
  ; engine/hit.e16.ts:241  fPush[d] = push
  slli t0, s1, 1
  lw t1, 14(fp) ; push
  sw t1, fPush(t0)
.return:
  mv sp, fp
  lw ra, 18(sp)
  lw s2, 20(sp)
  lw s1, 22(sp)
  lw s3, 24(sp)
  lw s0, 26(sp)
  addi sp, sp, 28
  ret

; engine/hit.e16.ts:248 knock(d, push) at -O1
;   d in s1
;   push in s2
knock:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; d
  mv s2, a1 ; push
  ; engine/hit.e16.ts:249  fStun[d] = 0
  slli t0, s1, 1
  sw zero, fStun(t0)
  ; engine/hit.e16.ts:250  if (fAir[d] !== 0) {
  slli t0, s1, 1
  lw t0, fAir(t0)
  beq t0, zero, .L1
  ; engine/hit.e16.ts:251  enter(d, ST_HIT)
  mv a0, s1
  li a1, 6
  call enter
  ; engine/hit.e16.ts:252  fKnock[d] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, fKnock(t0)
  ; engine/hit.e16.ts:253  fVY[d] = 32
  slli t0, s1, 1
  li t1, 32
  sw t1, fVY(t0)
  ; engine/hit.e16.ts:254  fVX[d] = push
  slli t0, s1, 1
  sw s2, fVX(t0)
  ; engine/hit.e16.ts:255  return
  j .return
.L1:
  ; engine/hit.e16.ts:257  enter(d, ST_DOWN)
  mv a0, s1
  li a1, 8
  call enter
  ; engine/hit.e16.ts:258  fPush[d] = push
  slli t0, s1, 1
  sw s2, fPush(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/draw.e16.ts:29 cameraStep() at -O1
;   mid in a1
;   c in a0
cameraStep:
  ; engine/draw.e16.ts:30  const mid = i16((fX[0] + fX[1]) >> 5)
  lw t0, fX(zero)
  lw t1, fX+2(zero)
  add t0, t0, t1
  srli a1, t0, 5
  ; engine/draw.e16.ts:31  let c = mid - 160
  addi a0, a1, -160
  ; engine/draw.e16.ts:32  if (c < 0) c = 0
  bge a0, zero, .L1
  ; engine/draw.e16.ts:32  c = 0
  li a0, 0 ; c
.L1:
  ; engine/draw.e16.ts:33  if (c > CAM_MAX) c = CAM_MAX
  li t0, 192
  bge t0, a0, .L2
  ; engine/draw.e16.ts:33  c = CAM_MAX
  li a0, 192 ; c
.L2:
  ; engine/draw.e16.ts:34  camX = u16(c)
  sw a0, 0x12a0(zero)
.return:
  ret

; engine/draw.e16.ts:45 spritesBuild() at -O1
spritesBuild:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/draw.e16.ts:46  sprBegin()
  ; lib/kit.e16.ts:251  sprN = 0
  sw zero, 0x0880(zero)
  ; engine/draw.e16.ts:47  hitSprites(0)
  li a0, 0
  call hitSprites
  ; engine/draw.e16.ts:48  hitSprites(1)
  li a0, 1
  call hitSprites
  ; engine/draw.e16.ts:49  bodySprites(0)
  li a0, 0
  call bodySprites
  ; engine/draw.e16.ts:50  bodySprites(1)
  li a0, 1
  call bodySprites
  ; engine/draw.e16.ts:51  shadow(0)
  li a0, 0
  call shadow
  ; engine/draw.e16.ts:52  shadow(1)
  li a0, 1
  call shadow
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/draw.e16.ts:55 hitSprites(i) at -O1
;   i in s1
;   pal in s2
hitSprites:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  ; engine/draw.e16.ts:56  const pal = i << 10
  slli s2, s1, 10
  ; engine/draw.e16.ts:57  if (wb[i * 24 + 17] !== wb[i * 24 + 16]) boxSprites(i, 4, (BOX_TILE + T_HIT) | pal)
  slli t1, s1, 4
  slli t0, s1, 3
  add t0, t0, t1
  addi t0, t0, 17
  slli t0, t0, 1
  lw t0, wb(t0)
  slli t2, s1, 4
  slli t1, s1, 3
  add t1, t1, t2
  addi t1, t1, 16
  slli t1, t1, 1
  lw t1, wb(t1)
  beq t0, t1, .L1
  ; engine/draw.e16.ts:57  boxSprites(i, 4, (BOX_TILE + T_HIT) | pal)
  li t0, 269
  or t0, t0, s2
  mv a0, s1
  li a1, 4
  mv a2, t0
  call boxSprites
.L1:
  ; engine/draw.e16.ts:58  if (wb[i * 24 + 21] !== wb[i * 24 + 20]) boxSprites(i, 5, (BOX_TILE + T_HIT) | pal)
  slli t1, s1, 4
  slli t0, s1, 3
  add t0, t0, t1
  addi t0, t0, 21
  slli t0, t0, 1
  lw t0, wb(t0)
  slli t2, s1, 4
  slli t1, s1, 3
  add t1, t1, t2
  addi t1, t1, 20
  slli t1, t1, 1
  lw t1, wb(t1)
  beq t0, t1, .L2
  ; engine/draw.e16.ts:58  boxSprites(i, 5, (BOX_TILE + T_HIT) | pal)
  li t0, 269
  or t0, t0, s2
  mv a0, s1
  li a1, 5
  mv a2, t0
  call boxSprites
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/draw.e16.ts:61 bodySprites(i) at -O1
;   i in s2
;   pal in s3
;   any in 0(fp)
;   k in s1
;   o in 2(fp)
bodySprites:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; i
  ; engine/draw.e16.ts:62  const pal = i << 10
  slli s3, s2, 10
  ; engine/draw.e16.ts:63  let any = false
  sw zero, 0(fp) ; any
  ; engine/draw.e16.ts:64  let k: u16 = 1
  li s1, 1 ; k
  ; engine/draw.e16.ts:65  while (k < 4) {
  j .L3
.L1:
  ; engine/draw.e16.ts:66  const o = i * 24 + k * 4
  slli t1, s2, 4
  slli t0, s2, 3
  add t0, t0, t1
  slli t1, s1, 2
  add t0, t0, t1
  sw t0, 2(fp) ; o
  ; engine/draw.e16.ts:67  if (wb[o + 1] !== wb[o]) {
  lw t0, 2(fp) ; o
  addi t0, t0, 1
  slli t0, t0, 1
  lw t0, wb(t0)
  lw t1, 2(fp) ; o
  slli t1, t1, 1
  lw t1, wb(t1)
  beq t0, t1, .L5
  ; engine/draw.e16.ts:68  boxSprites(i, k, (BOX_TILE + (k - 1) * 4) | pal)
  addi t0, s1, -1
  slli t0, t0, 2
  addi t0, t0, 257
  or t0, t0, s3
  mv a0, s2
  mv a1, s1
  mv a2, t0
  call boxSprites
  ; engine/draw.e16.ts:69  any = true
  li t0, 1
  sw t0, 0(fp) ; any
.L5:
  ; engine/draw.e16.ts:71  k++
  addi s1, s1, 1
.L3:
  li t0, 4
  bltu s1, t0, .L1
  ; engine/draw.e16.ts:73  if (!any) boxSprites(i, 0, (BOX_TILE + T_BODY) | pal)
  lw t0, 0(fp) ; any
  bnez t0, .L6
  ; engine/draw.e16.ts:73  boxSprites(i, 0, (BOX_TILE + T_BODY) | pal)
  li t0, 265
  or t0, t0, s3
  mv a0, s2
  li a1, 0
  mv a2, t0
  call boxSprites
.L6:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; engine/draw.e16.ts:77 boxSprites(i, k, tile) at -O1
;   i in 6(fp)
;   k in 8(fp)
;   tile in 10(fp)
;   o in s1
;   x0 in 12(fp)
;   w in 2(fp)
;   y0 in 14(fp)
;   h in s3
;   big in 4(fp)
;   step in 0(fp)
;   dy in s2
boxSprites:
  addi sp, sp, -26
  sw ra, 16(sp)
  sw s1, 18(sp)
  sw s3, 20(sp)
  sw s2, 22(sp)
  sw s0, 24(sp)
  mv fp, sp
  sw a0, 6(fp) ; i
  sw a1, 8(fp) ; k
  sw a2, 10(fp) ; tile
  ; engine/draw.e16.ts:78  const o = i * 24 + k * 4
  lw t0, 6(fp) ; i
  slli t1, t0, 4
  slli t0, t0, 3
  add t0, t0, t1
  lw t1, 8(fp) ; k
  slli t1, t1, 2
  add s1, t0, t1
  ; engine/draw.e16.ts:79  const x0 = i16(wb[o]) - i16(camX)
  slli t0, s1, 1
  lw t0, wb(t0)
  lw t1, 0x12a0(zero)
  sub t0, t0, t1
  sw t0, 12(fp) ; x0
  ; engine/draw.e16.ts:80  const w = i16(wb[o + 1]) - i16(wb[o])
  addi t0, s1, 1
  slli t0, t0, 1
  lw t0, wb(t0)
  slli t1, s1, 1
  lw t1, wb(t1)
  sub t0, t0, t1
  sw t0, 2(fp) ; w
  ; engine/draw.e16.ts:81  const y0 = GROUND_Y - i16(wb[o + 2])
  addi t0, s1, 2
  slli t0, t0, 1
  lw t0, wb(t0)
  li t1, 244
  sub t1, t1, t0
  sw t1, 14(fp) ; y0
  ; engine/draw.e16.ts:82  const h = i16(wb[o + 2]) - i16(wb[o + 3])
  addi t0, s1, 2
  slli t0, t0, 1
  lw t0, wb(t0)
  addi t1, s1, 3
  slli t1, t1, 1
  lw t1, wb(t1)
  sub s3, t0, t1
  ; engine/draw.e16.ts:83  const big = w >= 16 && h >= 16
  li t0, 16
  lw t1, 2(fp) ; w
  slt t1, t1, t0
  xori t1, t1, 1
  mv t0, t1
  xor t0, t0, t1
  xor t1, t1, t0
  xor t0, t0, t1
  beqz t1, .L1
  li t0, 16
  slt t0, s3, t0
  xori t0, t0, 1
.L1:
  sw t0, 4(fp) ; big
  ; engine/draw.e16.ts:84  const step: i16 = big ? 16 : 8
  lw t0, 4(fp) ; big
  beqz t0, .L2
  li t0, 16
  j .L3
.L2:
  li t0, 8
.L3:
  sw t0, 0(fp) ; step
  ; engine/draw.e16.ts:85  let dy: i16 = 0
  li s2, 0 ; dy
  ; engine/draw.e16.ts:86  for (;;) {
.L4:
  ; engine/draw.e16.ts:88  boxRow(x0, y0 + (dy + step > h ? h - step : dy), w, tile | (big ? 0x8000 : 0))
  lw t0, 0(fp) ; step
  add t0, s2, t0
  lw t1, 14(fp)
  mv t2, t0
  lw t0, 12(fp)
  mv t3, s3
  bge t3, t2, .L8
  lw t2, 0(fp) ; step
  sub t2, s3, t2
  j .L9
.L8:
  mv t2, s2
.L9:
  add t1, t1, t2
  lw t2, 2(fp)
  lw t3, 10(fp)
  lw a1, 4(fp)
  beqz a1, .L10
  li a1, 32768
  j .L11
.L10:
  li a1, 0
.L11:
  or t3, t3, a1
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  call boxRow
  ; engine/draw.e16.ts:89  dy = dy + step
  lw t0, 0(fp) ; step
  add s2, s2, t0
  ; engine/draw.e16.ts:90  if (dy >= h) break
  blt s2, s3, .L4
  ; engine/draw.e16.ts:90  break
.return:
  mv sp, fp
  lw ra, 16(sp)
  lw s1, 18(sp)
  lw s3, 20(sp)
  lw s2, 22(sp)
  lw s0, 24(sp)
  addi sp, sp, 26
  ret

; engine/draw.e16.ts:95 boxRow(x0, y, w, tile) at -O1
;   x0 in 4(fp)
;   y in 6(fp)
;   w in s2
;   tile in 0(fp)
;   big in 2(fp)
;   step in s3
;   t in 8(fp)
;   dx in s1
boxRow:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s1, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  sw a0, 4(fp) ; x0
  sw a1, 6(fp) ; y
  mv s2, a2 ; w
  sw a3, 0(fp) ; tile
  ; engine/draw.e16.ts:96  const big = (tile & 0x8000) !== 0
  li t0, 32768
  lw t1, 0(fp) ; tile
  and t1, t1, t0
  sub t1, t1, zero
  snez t1, t1
  sw t1, 2(fp) ; big
  ; engine/draw.e16.ts:97  const step: i16 = big ? 16 : 8
  lw t0, 2(fp) ; big
  beqz t0, .L1
  li t0, 16
  j .L2
.L1:
  li t0, 8
.L2:
  mv s3, t0 ; step
  ; engine/draw.e16.ts:98  const t = tile & 0x7fff
  li t0, 32767
  lw t1, 0(fp) ; tile
  and t1, t1, t0
  sw t1, 8(fp) ; t
  ; engine/draw.e16.ts:99  let dx: i16 = 0
  li s1, 0 ; dx
  ; engine/draw.e16.ts:100  for (;;) {
.L3:
  ; engine/draw.e16.ts:101  spr(x0 + (dx + step > w ? w - step : dx), y, t, big ? S16 : S8)
  add t1, s1, s3
  lw t0, 4(fp)
  mv t2, s2
  bge t2, t1, .L7
  sub t1, s2, s3
  j .L8
.L7:
  mv t1, s1
.L8:
  add t0, t0, t1
  lw t1, 6(fp)
  lw t2, 8(fp)
  lw t3, 2(fp)
  beqz t3, .L9
  li t3, 1
  j .L10
.L9:
  li t3, 0
.L10:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  call spr
  ; engine/draw.e16.ts:102  dx = dx + step
  add s1, s1, s3
  ; engine/draw.e16.ts:103  if (dx >= w) break
  blt s1, s2, .L3
  ; engine/draw.e16.ts:103  break
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s1, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; engine/draw.e16.ts:108 shadow(i) at -O1
;   i in s2
;   x in s3
;   k in s1
shadow:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; i
  ; engine/draw.e16.ts:109  const x = i16(fX[i] >> 4) - i16(camX) - 16
  slli t0, s2, 1
  lw t0, fX(t0)
  srli t0, t0, 4
  lw t1, 0x12a0(zero)
  sub t0, t0, t1
  addi s3, t0, -16
  ; engine/draw.e16.ts:110  let k: i16 = 0
  li s1, 0 ; k
  ; engine/draw.e16.ts:111  while (k < 32) {
  j .L3
.L1:
  ; engine/draw.e16.ts:112  spr(x + k, GROUND_Y, FX_TILE | SHADOW_PAL, S8)
  add a0, s3, s1
  li a1, 244
  li a2, 2321
  li a3, 0
  call spr
  ; engine/draw.e16.ts:113  k = k + 8
  addi s1, s1, 8
.L3:
  li t0, 32
  blt s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; engine/draw.e16.ts:151 say(x, y, s, sl) at -O1
;   x in 0(fp)
;   y in 2(fp)
;   s in s1
;   sl in 4(fp)
;   at in s2
;   c in s3
say:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  sw a0, 0(fp) ; x
  sw a1, 2(fp) ; y
  mv s1, a2 ; s
  sw a3, 4(fp) ; sl
  ; engine/draw.e16.ts:152  let at = cellAt(1, x, y)
  li a0, 1
  lw a1, 0(fp)
  lw a2, 2(fp)
  call cellAt
  mv s2, a0 ; at
  ; engine/draw.e16.ts:153  let c = peek(s)
  lbu s3, 0(s1)
  ; engine/draw.e16.ts:154  while (c !== 0) {
  j .L3
.L1:
  ; engine/draw.e16.ts:155  vpoke(at, (FONT_TILE + c - 32) | (sl << 10) | FRONT)
  lw t0, 4(fp) ; sl
  slli t0, t0, 10
  addi t1, s3, -32
  or t1, t1, t0
  li t0, 32768
  or t1, t1, t0
  mv a0, s2
  mv a1, t1
  call vpoke
  ; engine/draw.e16.ts:156  at = wrap16(at + 2)
  addi s2, s2, 2
  ; engine/draw.e16.ts:157  s++
  addi s1, s1, 1
  ; engine/draw.e16.ts:158  c = peek(s)
  lbu s3, 0(s1)
.L3:
  bne s3, zero, .L1
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; engine/draw.e16.ts:162 hudTile(x, y, t, sl) at -O1
;   x in s1
;   y in s2
;   t in s3
;   sl in s0
hudTile:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; t
  mv s0, a3 ; sl
  ; engine/draw.e16.ts:163  vpoke(cellAt(1, x, y), (HUD_TILE + t) | (sl << 10) | FRONT)
  li a0, 1
  mv a1, s1
  mv a2, s2
  call cellAt
  slli t0, s0, 10
  addi t1, s3, 168
  or t1, t1, t0
  li t0, 32768
  or a1, t1, t0
  call vpoke
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; engine/draw.e16.ts:167 hudClear() at -O1
hudClear:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/draw.e16.ts:168  vfill(cellAt(1, 0, 0), HUD_TILE + T_CLEAR, 64 * 64)
  li a0, 40960
  li a1, 168
  li a2, 4096
  call vfill
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/draw.e16.ts:175 hudStatic(p2, wins0, wins1) at -O1
;   p2 in s1
;   wins0 in s2
;   wins1 in s3
hudStatic:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; p2
  mv s2, a1 ; wins0
  mv s3, a2 ; wins1
  ; engine/draw.e16.ts:176  heading(0, 0)
  li a0, 0
  li a1, 0
  call heading
  ; engine/draw.e16.ts:177  heading(22, 0)
  li a0, 22
  li a1, 0
  call heading
  ; engine/draw.e16.ts:178  say(2, 1, slName[fSlot[0]], SL_P1)
  lw t0, fSlot(zero)
  slli t0, t0, 1
  lw t0, slName(t0)
  li a0, 2
  li a1, 1
  mv a2, t0
  li a3, 1
  call say
  ; engine/draw.e16.ts:179  say(13, 1, str('P1'), SL_DIM)
  li a0, 13
  li a1, 1
  la a2, str_8
  li a3, 3
  call say
  ; engine/draw.e16.ts:180  say(24, 1, p2, SL_P1)
  li a0, 24
  li a1, 1
  mv a2, s1
  li a3, 1
  call say
  ; engine/draw.e16.ts:181  say(28, 1, slName[fSlot[1]], SL_DIM)
  lw t0, fSlot+2(zero)
  slli t0, t0, 1
  lw t0, slName(t0)
  li a0, 28
  li a1, 1
  mv a2, t0
  li a3, 3
  call say
  ; engine/draw.e16.ts:182  say(18, 3, str('TIME'), SL_DIM)
  li a0, 18
  li a1, 3
  la a2, str_9
  li a3, 3
  call say
  ; engine/draw.e16.ts:183  lamps(15, wins0, false)
  li a0, 15
  mv a1, s2
  li a2, 0
  call lamps
  ; engine/draw.e16.ts:184  lamps(23, wins1, true)
  li a0, 23
  mv a1, s3
  li a2, 1
  call lamps
  ; engine/draw.e16.ts:185  shownLife[0] = 0xffff
  li t0, 65535
  sw t0, shownLife(zero)
  ; engine/draw.e16.ts:186  shownLife[1] = 0xffff
  li t0, 65535
  sw t0, shownLife+2(zero)
  ; engine/draw.e16.ts:187  timeShown = 0xffff
  li t0, 65535
  sw t0, 0x12b6(zero)
  ; engine/draw.e16.ts:188  trail[0] = fLife[0]
  lw t0, fLife(zero)
  sw t0, trail(zero)
  ; engine/draw.e16.ts:189  trail[1] = fLife[1]
  lw t0, fLife+2(zero)
  sw t0, trail+2(zero)
  ; engine/draw.e16.ts:190  lowShown[0] = 2
  li t0, 2
  sw t0, lowShown(zero)
  ; engine/draw.e16.ts:191  lowShown[1] = 2
  li t0, 2
  sw t0, lowShown+2(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/draw.e16.ts:194 heading(x, y) at -O1
;   x in s1
;   y in s2
heading:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  ; engine/draw.e16.ts:195  hudTile(x, y + 1, T_RULE, SL_P1)
  mv a0, s1
  addi a1, s2, 1
  li a2, 1
  li a3, 1
  call hudTile
  ; engine/draw.e16.ts:196  hudTile(x + 1, y + 1, T_TICK, SL_P1)
  addi a0, s1, 1
  addi a1, s2, 1
  li a2, 2
  li a3, 1
  call hudTile
  ; engine/draw.e16.ts:197  vpoke(cellAt(1, x + 16, y + 1), (HUD_TILE + T_TICK) | (SL_P1 << 10) | FRONT | FLIP)
  li a0, 1
  addi a1, s1, 16
  addi a2, s2, 1
  call cellAt
  li a1, 42154
  call vpoke
  ; engine/draw.e16.ts:198  hudTile(x + 17, y + 1, T_RULE, SL_P1)
  addi a0, s1, 17
  addi a1, s2, 1
  li a2, 1
  li a3, 1
  call hudTile
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/draw.e16.ts:202 lamps(x, n, right) at -O1
;   x in s3
;   n in s2
;   right in 0(fp)
;   k in s1
;   lit in 2(fp)
lamps:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s2, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s3, a0 ; x
  mv s2, a1 ; n
  sw a2, 0(fp) ; right
  ; engine/draw.e16.ts:203  let k: u16 = 0
  li s1, 0 ; k
  ; engine/draw.e16.ts:204  while (k < 2) {
  j .L3
.L1:
  ; engine/draw.e16.ts:205  const lit = right ? k < n : 1 - k < n
  lw t0, 0(fp) ; right
  beqz t0, .L5
  sltu t0, s1, s2
  j .L6
.L5:
  li t0, 1
  sub t0, t0, s1
  sltu t0, t0, s2
.L6:
  sw t0, 2(fp) ; lit
  ; engine/draw.e16.ts:206  hudTile(x + k, 3, T_LAMP + (lit ? 1 : 0), SL_P1)
  add t0, s3, s1
  li t1, 3
  li t2, 3
  lw t3, 2(fp)
  beqz t3, .L7
  li t3, 1
  j .L8
.L7:
  li t3, 0
.L8:
  add t2, t2, t3
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 1
  call hudTile
  ; engine/draw.e16.ts:207  k++
  addi s1, s1, 1
.L3:
  li t0, 2
  bltu s1, t0, .L1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; engine/draw.e16.ts:212 hudStep(time, frame) at -O1
;   time in s1
;   frame in s2
hudStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; time
  mv s2, a1 ; frame
  ; engine/draw.e16.ts:213  barStep(0, frame)
  li a0, 0
  mv a1, s2
  call barStep
  ; engine/draw.e16.ts:214  barStep(1, frame)
  li a0, 1
  mv a1, s2
  call barStep
  ; engine/draw.e16.ts:215  if (time !== timeShown) timeShow(time)
  lw t0, 0x12b6(zero)
  beq s1, t0, .L1
  ; engine/draw.e16.ts:215  timeShow(time)
  mv a0, s1
  call timeShow
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/draw.e16.ts:218 barStep(i, frame) at -O1
;   i in s1
;   frame in s3
;   life in s2
barStep:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; i
  mv s3, a1 ; frame
  ; engine/draw.e16.ts:219  const life = fLife[i]
  slli t0, s1, 1
  lw s2, fLife(t0)
  ; engine/draw.e16.ts:220  if (life < shownLife[i] && shownLife[i] !== 0xffff) trailT[i] = 0
  slli t0, s1, 1
  lw t0, shownLife(t0)
  bgeu s2, t0, .L1
  slli t0, s1, 1
  lw t0, shownLife(t0)
  li t1, 65535
  beq t0, t1, .L1
  ; engine/draw.e16.ts:220  trailT[i] = 0
  slli t0, s1, 1
  sw zero, trailT(t0)
.L1:
  ; engine/draw.e16.ts:221  if (trail[i] > life) {
  slli t0, s1, 1
  lw t0, trail(t0)
  bgeu s2, t0, .L2
  ; engine/draw.e16.ts:222  if (trailT[i] < TRAIL_WAIT) trailT[i]++
  slli t0, s1, 1
  lw t0, trailT(t0)
  li t1, 20
  bgeu t0, t1, .L3
  ; engine/draw.e16.ts:222  trailT[i]++
  slli t0, s1, 1
  addi t0, t0, trailT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  j .L5
.L3:
  ; engine/draw.e16.ts:223  trail[i]--
  slli t0, s1, 1
  addi t0, t0, trail
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, -1
  sw t1, 0(t0)
  j .L5
.L2:
  ; engine/draw.e16.ts:224  trail[i] = life
  slli t0, s1, 1
  sw s2, trail(t0)
.L5:
  ; engine/draw.e16.ts:225  lowStep(i, life, frame)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call lowStep
  ; engine/draw.e16.ts:226  if (life === shownLife[i] && trail[i] === shownTrail[i]) return
  slli t0, s1, 1
  lw t0, shownLife(t0)
  bne s2, t0, .L6
  slli t0, s1, 1
  lw t0, trail(t0)
  slli t1, s1, 1
  lw t1, shownTrail(t1)
  bne t0, t1, .L6
  ; engine/draw.e16.ts:226  return
  j .return
.L6:
  ; engine/draw.e16.ts:227  shownLife[i] = life
  slli t0, s1, 1
  sw s2, shownLife(t0)
  ; engine/draw.e16.ts:228  shownTrail[i] = trail[i]
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, trail(t1)
  sw t1, shownTrail(t0)
  ; engine/draw.e16.ts:229  barDraw(i)
  mv a0, s1
  call barDraw
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; engine/draw.e16.ts:233 lowStep(i, life, frame) at -O1
;   i in s2
;   life in 0(fp)
;   frame in 2(fp)
;   max in 4(fp)
;   state in s1
;   sl in s3
lowStep:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; i
  sw a1, 0(fp) ; life
  sw a2, 2(fp) ; frame
  ; engine/draw.e16.ts:234  const max = prAt(i, P_LIFE)
  mv a0, s2
  li a1, 0
  call prAt
  sw a0, 4(fp) ; max
  ; engine/draw.e16.ts:235  let state: u16 = 0
  li s1, 0 ; state
  ; engine/draw.e16.ts:236  if (life * 4 < max) state = (frame & 16) !== 0 ? 1 : 3
  lw t0, 0(fp) ; life
  slli t0, t0, 2
  lw t1, 4(fp) ; max
  bgeu t0, t1, .L1
  ; engine/draw.e16.ts:236  state = (frame & 16) !== 0 ? 1 : 3
  lw t0, 2(fp) ; frame
  andi t0, t0, 16
  beq t0, zero, .L2
  li t0, 1
  j .L3
.L2:
  li t0, 3
.L3:
  mv s1, t0 ; state
.L1:
  ; engine/draw.e16.ts:237  if (state === lowShown[i]) return
  slli t0, s2, 1
  lw t0, lowShown(t0)
  bne s1, t0, .L4
  ; engine/draw.e16.ts:237  return
  j .return
.L4:
  ; engine/draw.e16.ts:238  lowShown[i] = state
  slli t0, s2, 1
  sw s1, lowShown(t0)
  ; engine/draw.e16.ts:239  const sl = SL_P1 + i
  addi s3, s2, 1
  ; engine/draw.e16.ts:240  if (state === 0) colour(sl, C_LIFE, palCopy[sl * 16 + C_LIFE])
  bne s1, zero, .L5
  ; engine/draw.e16.ts:240  colour(sl, C_LIFE, palCopy[sl * 16 + C_LIFE])
  slli t0, s3, 4
  addi t0, t0, 5
  slli t0, t0, 1
  lw t0, palCopy(t0)
  mv a0, s3
  li a1, 5
  mv a2, t0
  call colour
  j .L6
.L5:
  ; engine/draw.e16.ts:241  colour(sl, C_LIFE, state === 1 ? RED : RED_DIM)
  mv t0, s3
  li t1, 5
  mv t2, s1
  li t3, 1
  bne t2, t3, .L7
  li t2, 7229
  j .L8
.L7:
  li t2, 3092
.L8:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call colour
.L6:
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; engine/draw.e16.ts:245 barPoints(i, v) at -O1
;   i in s1
;   v in s2
barPoints:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  mv s2, a1 ; v
  ; engine/draw.e16.ts:246  return div(v * 120, prAt(i, P_LIFE))
  li t0, 120
  mul t0, s2, t0
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  li a1, 0
  call prAt
  lw t0, 0(sp)
  addi sp, sp, 2
  divu a0, t0, a0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/draw.e16.ts:250 barDraw(i) at -O1
;   i in s2
;   l in 0(fp)
;   t in 2(fp)
;   sl in 4(fp)
;   c in s1
;   lc in 6(fp)
;   tc in 8(fp)
;   tile in s3
barDraw:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s2, 12(sp)
  sw s1, 14(sp)
  sw s3, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  mv s2, a0 ; i
  ; engine/draw.e16.ts:251  const l = barPoints(i, fLife[i])
  slli t0, s2, 1
  lw t0, fLife(t0)
  mv a0, s2
  mv a1, t0
  call barPoints
  sw a0, 0(fp) ; l
  ; engine/draw.e16.ts:252  const t = barPoints(i, trail[i])
  slli t0, s2, 1
  lw t0, trail(t0)
  mv a0, s2
  mv a1, t0
  call barPoints
  sw a0, 2(fp) ; t
  ; engine/draw.e16.ts:253  const sl = (SL_P1 + i) << 10
  addi t0, s2, 1
  slli t0, t0, 10
  sw t0, 4(fp) ; sl
  ; engine/draw.e16.ts:254  let c: u16 = 0
  li s1, 0 ; c
  ; engine/draw.e16.ts:255  while (c < BAR_CELLS) {
  j .L3
.L1:
  ; engine/draw.e16.ts:256  const lc = cellPart(l, c)
  lw a0, 0(fp)
  mv a1, s1
  call cellPart
  sw a0, 6(fp) ; lc
  ; engine/draw.e16.ts:257  const tc = cellPart(t, c)
  lw a0, 2(fp)
  mv a1, s1
  call cellPart
  sw a0, 8(fp) ; tc
  ; engine/draw.e16.ts:258  const tile = (HUD_TILE + T_BAR + lc * 9 + tc) | sl | FRONT
  lw t0, 6(fp) ; lc
  slli t1, t0, 3
  add t0, t1, t0
  lw t1, 8(fp) ; tc
  addi t0, t0, 176
  add t0, t0, t1
  lw t1, 4(fp) ; sl
  or t0, t0, t1
  li t1, 32768
  or s3, t0, t1
  ; engine/draw.e16.ts:259  if (i === 0) vpoke(cellAt(1, 2 + c, BAR_ROW), tile)
  bne s2, zero, .L5
  ; engine/draw.e16.ts:259  vpoke(cellAt(1, 2 + c, BAR_ROW), tile)
  li a0, 1
  addi a1, s1, 2
  li a2, 2
  call cellAt
  mv a1, s3
  call vpoke
  j .L6
.L5:
  ; engine/draw.e16.ts:260  vpoke(cellAt(1, 37 - c, BAR_ROW), tile | FLIP)
  li t0, 37
  sub t0, t0, s1
  li a0, 1
  mv a1, t0
  li a2, 2
  call cellAt
  li t0, 8192
  or a1, s3, t0
  call vpoke
.L6:
  ; engine/draw.e16.ts:261  c++
  addi s1, s1, 1
.L3:
  li t0, 15
  bltu s1, t0, .L1
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s2, 12(sp)
  lw s1, 14(sp)
  lw s3, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; engine/draw.e16.ts:266 cellPart(p, c) at -O1
;   p in a0
;   c in a1
;   from in a2
cellPart:
  ; engine/draw.e16.ts:267  const from = c * 8
  slli a2, a1, 3
  ; engine/draw.e16.ts:268  if (p <= from) return 0
  bltu a2, a0, .L1
  ; engine/draw.e16.ts:268  return 0
  li a0, 0
  ret
.L1:
  ; engine/draw.e16.ts:269  return p - from >= 8 ? 8 : p - from
  sub t0, a0, a2
  li t1, 8
  bltu t0, t1, .L2
  li t0, 8
  j .L3
.L2:
  sub t0, a0, a2
.L3:
  mv a0, t0
.return:
  ret

; engine/draw.e16.ts:273 timeShow(t) at -O1
;   t in s1
;   tens in s2
timeShow:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t
  ; engine/draw.e16.ts:274  if (timeShown === 0xffff || t <= 10 !== timeShown <= 10) {
  lw t0, 0x12b6(zero)
  li t1, 65535
  beq t0, t1, .L2
  li t0, 10
  sltu t0, t0, s1
  xori t0, t0, 1
  lw t1, 0x12b6(zero)
  li t2, 10
  sltu t1, t2, t1
  xori t1, t1, 1
  beq t0, t1, .L1
.L2:
  ; engine/draw.e16.ts:275  colour(SL_TIME, 1, t <= 10 ? RED : palCopy[SL_TIME * 16 + 1])
  li t0, 4
  li t1, 1
  mv t2, s1
  li t3, 10
  bltu t3, t2, .L3
  li t2, 7229
  j .L4
.L3:
  lw t2, palCopy+130(zero)
.L4:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call colour
.L1:
  ; engine/draw.e16.ts:277  timeShown = t
  sw s1, 0x12b6(zero)
  ; engine/draw.e16.ts:278  const tens = div(t, 10)
  li t0, 10
  divu s2, s1, t0
  ; engine/draw.e16.ts:279  bigDigit(18, tens)
  li a0, 18
  mv a1, s2
  call bigDigit
  ; engine/draw.e16.ts:280  bigDigit(20, t - tens * 10)
  slli t1, s2, 3
  slli t0, s2, 1
  add t0, t0, t1
  sub t0, s1, t0
  li a0, 20
  mv a1, t0
  call bigDigit
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/draw.e16.ts:283 bigDigit(x, d) at -O1
;   x in s1
;   d in s3
;   tile in s2
bigDigit:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; x
  mv s3, a1 ; d
  ; engine/draw.e16.ts:284  const tile = (DIGITS_TILE + d * 4) | (SL_TIME << 10) | FRONT
  slli t0, s3, 2
  addi t0, t0, 128
  ori t0, t0, 4096
  li t1, 32768
  or s2, t0, t1
  ; engine/draw.e16.ts:285  vpoke(cellAt(1, x, 1), tile)
  li a0, 1
  mv a1, s1
  li a2, 1
  call cellAt
  mv a1, s2
  call vpoke
  ; engine/draw.e16.ts:286  vpoke(cellAt(1, x + 1, 1), tile + 1)
  li a0, 1
  addi a1, s1, 1
  li a2, 1
  call cellAt
  addi a1, s2, 1
  call vpoke
  ; engine/draw.e16.ts:287  vpoke(cellAt(1, x, 2), tile + 2)
  li a0, 1
  mv a1, s1
  li a2, 2
  call cellAt
  addi a1, s2, 2
  call vpoke
  ; engine/draw.e16.ts:288  vpoke(cellAt(1, x + 1, 2), tile + 3)
  li a0, 1
  addi a1, s1, 1
  li a2, 2
  call cellAt
  addi a1, s2, 3
  call vpoke
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; engine/draw.e16.ts:294 bandShow(s) at -O1
;   s in s0
;   n in s1
;   at in s3
;   k in s2
bandShow:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  sw s2, 8(sp)
  mv s0, a0 ; s
  ; engine/draw.e16.ts:295  vfill(cellAt(1, 0, BAND_ROW), (HUD_TILE + T_BAND_TOP) | (SL_P1 << 10) | FRONT, 40)
  li a0, 42880
  li a1, 33966
  li a2, 40
  call vfill
  ; engine/draw.e16.ts:296  vfill(cellAt(1, 0, BAND_ROW + 1), (HUD_TILE + T_BAND) | (SL_P1 << 10) | FRONT, 40)
  li a0, 43008
  li a1, 33965
  li a2, 40
  call vfill
  ; engine/draw.e16.ts:297  vfill(cellAt(1, 0, BAND_ROW + 2), (HUD_TILE + T_BAND_BOTTOM) | (SL_P1 << 10) | FRONT, 40)
  li a0, 43136
  li a1, 33967
  li a2, 40
  call vfill
  ; engine/draw.e16.ts:298  let n: u16 = 0
  li s1, 0 ; n
  ; engine/draw.e16.ts:299  while (peek(s + n) !== 0) n++
  j .L3
.L1:
  ; engine/draw.e16.ts:299  n++
  addi s1, s1, 1
.L3:
  add t0, s0, s1
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; engine/draw.e16.ts:300  let at = cellAt(1, 20 - (n >> 1), BAND_ROW + 1)
  srli t0, s1, 1
  li t1, 20
  sub t1, t1, t0
  li a0, 1
  mv a1, t1
  li a2, 16
  call cellAt
  mv s3, a0 ; at
  ; engine/draw.e16.ts:301  let k: u16 = 0
  li s2, 0 ; k
  ; engine/draw.e16.ts:302  while (k < n) {
  j .L7
.L5:
  ; engine/draw.e16.ts:303  vpoke(at, (FONTB_TILE + peek(s + k) - 32) | (SL_P1 << 10) | FRONT)
  add t0, s0, s2
  lbu t0, 0(t0)
  addi t0, t0, 32
  ori t0, t0, 1024
  li t1, 32768
  or t0, t0, t1
  mv a0, s3
  mv a1, t0
  call vpoke
  ; engine/draw.e16.ts:304  at = wrap16(at + 2)
  addi s3, s3, 2
  ; engine/draw.e16.ts:305  k++
  addi s2, s2, 1
.L7:
  bltu s2, s1, .L5
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; engine/draw.e16.ts:310 bandClear() at -O1
bandClear:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/draw.e16.ts:311  vfill(cellAt(1, 0, BAND_ROW), HUD_TILE + T_CLEAR, 64 * 3)
  li a0, 42880
  li a1, 168
  li a2, 192
  call vfill
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

str_0:
  .byte 68, 79, 85, 66, 76, 69, 32, 75, 46, 79, 46, 0
str_1:
  .byte 75, 46, 79, 46, 0
str_2:
  .byte 84, 73, 77, 69, 32, 85, 80, 32, 32, 68, 82, 65, 87, 0
str_3:
  .byte 84, 73, 77, 69, 32, 85, 80, 0
str_4:
  .byte 83, 49, 32, 66, 65, 76, 65, 78, 67, 69, 0
str_5:
  .byte 83, 50, 32, 82, 85, 83, 72, 0
str_6:
  .byte 83, 51, 32, 80, 79, 87, 69, 82, 0
str_7:
  .byte 83, 52, 32, 79, 85, 84, 66, 79, 88, 0
str_8:
  .byte 80, 49, 0
str_9:
  .byte 84, 73, 77, 69, 0
  .align 2
e16c_fixed_end:

  .bank 1
  .org 0xc000
; scenes/match.e16.ts:47 matchPlay() at -O1
matchPlay:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/match.e16.ts:48  oppLoad(choice[1])
  lw a0, choice+2(zero)
  call oppLoad
  ; scenes/match.e16.ts:49  fSlot[0] = choice[0]
  lw t0, choice(zero)
  sw t0, fSlot(zero)
  ; scenes/match.e16.ts:50  fSlot[1] = opp[O_SLOT]
  lw t0, opp(zero)
  sw t0, fSlot+2(zero)
  ; scenes/match.e16.ts:51  fighterLoad(0, fSlot[0])
  lw t0, fSlot(zero)
  li a0, 0
  mv a1, t0
  call fighterLoad
  ; scenes/match.e16.ts:52  fighterLoad(1, fSlot[1])
  lw t0, fSlot+2(zero)
  li a0, 1
  mv a1, t0
  call fighterLoad
  ; scenes/match.e16.ts:53  screenClear()
  call screenClear
  ; scenes/match.e16.ts:54  stageLoad(opp[O_STAGE])
  lw a0, opp+2(zero)
  call stageLoad
  ; scenes/match.e16.ts:55  wins[0] = 0
  sw zero, wins(zero)
  ; scenes/match.e16.ts:56  wins[1] = 0
  sw zero, wins+2(zero)
  ; scenes/match.e16.ts:57  round = 1
  li t0, 1
  sw t0, 0x12b8(zero)
  ; scenes/match.e16.ts:58  draws = 0
  sw zero, 0x12be(zero)
  ; scenes/match.e16.ts:59  outcome = 0
  sw zero, 0x12c0(zero)
  ; scenes/match.e16.ts:60  fComboMax[0] = 0
  sw zero, fComboMax(zero)
  ; scenes/match.e16.ts:61  fComboMax[1] = 0
  sw zero, fComboMax+2(zero)
  ; scenes/match.e16.ts:62  while (outcome === 0) roundPlay()
  j .L3
.L1:
  ; scenes/match.e16.ts:62  roundPlay()
  call roundPlay
.L3:
  lw t0, 0x12c0(zero)
  beq t0, zero, .L1
  ; scenes/match.e16.ts:63  phaseIs(PH_END)
  li a0, 3
  call phaseIs
  ; scenes/match.e16.ts:64  if (outcome === 1) bandShow(str('P1 WINS'))
  lw t0, 0x12c0(zero)
  li t1, 1
  bne t0, t1, .L5
  ; scenes/match.e16.ts:64  bandShow(str('P1 WINS'))
  la a0, str_10
  call bandShow
  j .L11
.L5:
  ; scenes/match.e16.ts:65  if (outcome === 2) bandShow(str('CPU WINS'))
  lw t0, 0x12c0(zero)
  li t1, 2
  bne t0, t1, .L7
  ; scenes/match.e16.ts:65  bandShow(str('CPU WINS'))
  la a0, str_11
  call bandShow
  j .L11
.L7:
  ; scenes/match.e16.ts:66  bandShow(str('BOTH LOSE'))
  la a0, str_12
  call bandShow
  ; scenes/match.e16.ts:67  while (phaseT < END_F) {
  j .L11
.L9:
  ; scenes/match.e16.ts:68  frameStep()
  call frameStep
  ; scenes/match.e16.ts:69  phaseTick()
  call phaseTick
.L11:
  lw t0, 0x0c9a(zero)
  li t1, 150
  bltu t0, t1, .L9
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/match.e16.ts:74 roundPlay() at -O1
roundPlay:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/match.e16.ts:75  fighterReset(0)
  li a0, 0
  call fighterReset
  ; scenes/match.e16.ts:76  fighterReset(1)
  li a0, 1
  call fighterReset
  ; scenes/match.e16.ts:77  ringClear()
  call ringClear
  ; scenes/match.e16.ts:78  hitstopIs(0)
  li a0, 0
  call hitstopIs
  ; scenes/match.e16.ts:79  clockReset()
  call clockReset
  ; scenes/match.e16.ts:80  hudStatic(str('CPU'), wins[0], wins[1])
  lw t0, wins(zero)
  lw t1, wins+2(zero)
  la a0, str_13
  mv a1, t0
  mv a2, t1
  call hudStatic
  ; scenes/match.e16.ts:81  bandShow(roundWord(round))
  lw a0, 0x12b8(zero)
  call roundWord
  call bandShow
  ; scenes/match.e16.ts:82  phaseIs(PH_ROUND)
  li a0, 0
  call phaseIs
  ; scenes/match.e16.ts:83  for (;;) {
.L1:
  ; scenes/match.e16.ts:84  frameStep()
  call frameStep
  ; scenes/match.e16.ts:85  phaseTick()
  call phaseTick
  ; scenes/match.e16.ts:86  if (phaseStep()) return
  call phaseStep
  beqz a0, .L1
  ; scenes/match.e16.ts:86  return
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/match.e16.ts:90 roundWord(n) at -O1
;   n in a0
roundWord:
  ; scenes/match.e16.ts:91  if (n === 1) return str('ROUND 1')
  li t0, 1
  bne a0, t0, .L1
  ; scenes/match.e16.ts:91  return str('ROUND 1')
  la a0, str_14
  ret
.L1:
  ; scenes/match.e16.ts:92  if (n === 2) return str('ROUND 2')
  li t0, 2
  bne a0, t0, .L2
  ; scenes/match.e16.ts:92  return str('ROUND 2')
  la a0, str_15
  ret
.L2:
  ; scenes/match.e16.ts:93  if (n === 3) return str('ROUND 3')
  li t0, 3
  bne a0, t0, .L3
  ; scenes/match.e16.ts:93  return str('ROUND 3')
  la a0, str_16
  ret
.L3:
  ; scenes/match.e16.ts:94  if (n === 4) return str('ROUND 4')
  li t0, 4
  bne a0, t0, .L4
  ; scenes/match.e16.ts:94  return str('ROUND 4')
  la a0, str_17
  ret
.L4:
  ; scenes/match.e16.ts:95  return str('FINAL ROUND')
  la a0, str_18
.return:
  ret

; scenes/match.e16.ts:99 phaseStep() at -O1
phaseStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/match.e16.ts:100  if (phase === PH_ROUND && phaseT >= ROUND_F) {
  lw t0, 0x0c98(zero)
  bne t0, zero, .L1
  lw t0, 0x0c9a(zero)
  li t1, 45
  bltu t0, t1, .L1
  ; scenes/match.e16.ts:101  phaseIs(PH_FIGHT)
  li a0, 1
  call phaseIs
  ; scenes/match.e16.ts:102  bandShow(str('FIGHT'))
  la a0, str_19
  call bandShow
  j .L2
.L1:
  ; scenes/match.e16.ts:103  if (phase === PH_FIGHT && phaseT === FIGHT_BAND_F) bandClear()
  lw t0, 0x0c98(zero)
  li t1, 1
  bne t0, t1, .L3
  lw t0, 0x0c9a(zero)
  li t1, 30
  bne t0, t1, .L3
  ; scenes/match.e16.ts:103  bandClear()
  call bandClear
  j .L4
.L3:
  ; scenes/match.e16.ts:104  if (phase === PH_OVER && phaseT >= OVER_F) {
  lw t0, 0x0c98(zero)
  li t1, 2
  bne t0, t1, .L5
  lw t0, 0x0c9a(zero)
  li t1, 120
  bltu t0, t1, .L5
  ; scenes/match.e16.ts:105  roundScore()
  call roundScore
  ; scenes/match.e16.ts:106  return true
  li a0, 1
  j .return
.L5:
.L4:
.L2:
  ; scenes/match.e16.ts:108  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/match.e16.ts:112 roundScore() at -O1
roundScore:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/match.e16.ts:113  bandClear()
  call bandClear
  ; scenes/match.e16.ts:114  if (roundWon === 2) {
  lw t0, 0x0ca0(zero)
  li t1, 2
  bne t0, t1, .L1
  ; scenes/match.e16.ts:115  draws++
  lw t0, 0x12be(zero)
  addi t0, t0, 1
  sw t0, 0x12be(zero)
  ; scenes/match.e16.ts:116  if (draws >= DRAWS_LOST) outcome = 3
  li t1, 3
  bltu t0, t1, .L2
  ; scenes/match.e16.ts:116  outcome = 3
  li t0, 3
  sw t0, 0x12c0(zero)
.L2:
  ; scenes/match.e16.ts:117  return
  j .return
.L1:
  ; scenes/match.e16.ts:119  draws = 0
  sw zero, 0x12be(zero)
  ; scenes/match.e16.ts:120  wins[roundWon]++
  lw t0, 0x0ca0(zero)
  slli t0, t0, 1
  addi t0, t0, wins
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; scenes/match.e16.ts:121  round++
  lw t0, 0x12b8(zero)
  addi t0, t0, 1
  sw t0, 0x12b8(zero)
  ; scenes/match.e16.ts:122  if (wins[roundWon] >= WINS) outcome = roundWon + 1
  lw t0, 0x0ca0(zero)
  slli t0, t0, 1
  lw t0, wins(t0)
  li t1, 2
  bltu t0, t1, .L3
  ; scenes/match.e16.ts:122  outcome = roundWon + 1
  lw t0, 0x0ca0(zero)
  addi t0, t0, 1
  sw t0, 0x12c0(zero)
.L3:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/scenes.e16.ts:22 controlsLoad() at -O1
controlsLoad:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/scenes.e16.ts:23  if (saveRead(SV_MARK) === SAVE_MARK) buttonSetIs(saveRead(SV_SET))
  li a0, 0
  call saveRead
  li t0, 17989
  bne a0, t0, .L1
  ; scenes/scenes.e16.ts:23  buttonSetIs(saveRead(SV_SET))
  li a0, 2
  call saveRead
  call buttonSetIs
.L1:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/scenes.e16.ts:27 title() at -O1
title:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/scenes.e16.ts:28  screenClear()
  call screenClear
  ; scenes/scenes.e16.ts:29  say(14, 6, str('ELECFIGHTER'), TL_TEXT)
  li a0, 14
  li a1, 6
  la a2, str_20
  li a3, 1
  call say
  ; scenes/scenes.e16.ts:30  say(14, 9, str('PRESS START'), TL_DIM)
  li a0, 14
  li a1, 9
  la a2, str_21
  li a3, 3
  call say
  ; scenes/scenes.e16.ts:31  say(6, 14, str('PAD    PC KEY  ACTION'), TL_DIM)
  li a0, 6
  li a1, 14
  la a2, str_22
  li a3, 3
  call say
  ; scenes/scenes.e16.ts:32  say(6, 16, str('D-PAD  ARROWS  MOVE, BACK GUARDS'), TL_TEXT)
  li a0, 6
  li a1, 16
  la a2, str_23
  li a3, 1
  call say
  ; scenes/scenes.e16.ts:33  say(6, 17, str('Y      A       LIGHT PUNCH'), TL_TEXT)
  li a0, 6
  li a1, 17
  la a2, str_24
  li a3, 1
  call say
  ; scenes/scenes.e16.ts:34  say(6, 18, str('X      S       HEAVY PUNCH'), TL_TEXT)
  li a0, 6
  li a1, 18
  la a2, str_25
  li a3, 1
  call say
  ; scenes/scenes.e16.ts:35  say(6, 19, str('B      X'), TL_TEXT)
  li a0, 6
  li a1, 19
  la a2, str_26
  li a3, 1
  call say
  ; scenes/scenes.e16.ts:36  say(6, 20, str('A      Z'), TL_TEXT)
  li a0, 6
  li a1, 20
  la a2, str_27
  li a3, 1
  call say
  ; scenes/scenes.e16.ts:37  say(6, 23, str('SELECT: SWITCH THE BUTTON SET'), TL_DIM)
  li a0, 6
  li a1, 23
  la a2, str_28
  li a3, 3
  call say
  ; scenes/scenes.e16.ts:38  setShow()
  call setShow
  ; scenes/scenes.e16.ts:39  for (;;) {
.L1:
  ; scenes/scenes.e16.ts:40  frameBegin()
  call frameBegin
  ; scenes/scenes.e16.ts:41  if (pressed(B_SELECT)) {
  li a0, 2048
  call pressed
  beqz a0, .L5
  ; scenes/scenes.e16.ts:42  buttonSetIs(1 - buttonSet)
  lw t0, 0x1142(zero)
  li t1, 1
  sub a0, t1, t0
  call buttonSetIs
  ; scenes/scenes.e16.ts:43  saveWrite(SV_MARK, SAVE_MARK)
  li a0, 0
  li a1, 17989
  call saveWrite
  ; scenes/scenes.e16.ts:44  saveWrite(SV_SET, buttonSet)
  lw t0, 0x1142(zero)
  li a0, 2
  mv a1, t0
  call saveWrite
  ; scenes/scenes.e16.ts:45  setShow()
  call setShow
.L5:
  ; scenes/scenes.e16.ts:47  if (pressed(B_START)) {
  li a0, 1024
  call pressed
  beqz a0, .L1
  ; scenes/scenes.e16.ts:48  seedFromClock()
  call seedFromClock
  ; scenes/scenes.e16.ts:49  return
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/scenes.e16.ts:55 setShow() at -O1
setShow:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/scenes.e16.ts:56  if (buttonSet === 0) {
  lw t0, 0x1142(zero)
  bne t0, zero, .L1
  ; scenes/scenes.e16.ts:57  say(6, 12, str('CONTROLS  TYPE A'), TL_TEXT)
  li a0, 6
  li a1, 12
  la a2, str_29
  li a3, 1
  call say
  ; scenes/scenes.e16.ts:58  say(21, 19, str('LIGHT KICK'), TL_TEXT)
  li a0, 21
  li a1, 19
  la a2, str_30
  li a3, 1
  call say
  ; scenes/scenes.e16.ts:59  say(21, 20, str('HEAVY KICK'), TL_TEXT)
  li a0, 21
  li a1, 20
  la a2, str_31
  li a3, 1
  call say
  j .L2
.L1:
  ; scenes/scenes.e16.ts:61  say(6, 12, str('CONTROLS  TYPE B'), TL_TEXT)
  li a0, 6
  li a1, 12
  la a2, str_32
  li a3, 1
  call say
  ; scenes/scenes.e16.ts:62  say(21, 19, str('HEAVY KICK'), TL_TEXT)
  li a0, 21
  li a1, 19
  la a2, str_31
  li a3, 1
  call say
  ; scenes/scenes.e16.ts:63  say(21, 20, str('LIGHT KICK'), TL_TEXT)
  li a0, 21
  li a1, 20
  la a2, str_30
  li a3, 1
  call say
.L2:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/scenes.e16.ts:71 seedFromClock() at -O1
;   h in s2
;   k in s1
seedFromClock:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; scenes/scenes.e16.ts:72  let h: u16 = 0x2b1d
  li s2, 11037 ; h
  ; scenes/scenes.e16.ts:73  let k: u16 = 0
  li s1, 0 ; k
  ; scenes/scenes.e16.ts:74  while (k < 7) {
  j .L3
.L1:
  ; scenes/scenes.e16.ts:75  h = wrap16((h ^ peek(CLOCK + k)) * 31 + 7)
  lbu t0, -200(s1)
  xor t0, s2, t0
  slli t1, t0, 5
  sub t0, t1, t0
  addi s2, t0, 7
  ; scenes/scenes.e16.ts:76  k++
  addi s1, s1, 1
.L3:
  li t0, 7
  bltu s1, t0, .L1
  ; scenes/scenes.e16.ts:78  randSeed(h ^ csrr(CSR_CYCLE))
  csrr t0, 3072
  xor a0, s2, t0
  call randSeed
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

str_10:
  .byte 80, 49, 32, 87, 73, 78, 83, 0
str_11:
  .byte 67, 80, 85, 32, 87, 73, 78, 83, 0
str_12:
  .byte 66, 79, 84, 72, 32, 76, 79, 83, 69, 0
str_13:
  .byte 67, 80, 85, 0
str_14:
  .byte 82, 79, 85, 78, 68, 32, 49, 0
str_15:
  .byte 82, 79, 85, 78, 68, 32, 50, 0
str_16:
  .byte 82, 79, 85, 78, 68, 32, 51, 0
str_17:
  .byte 82, 79, 85, 78, 68, 32, 52, 0
str_18:
  .byte 70, 73, 78, 65, 76, 32, 82, 79, 85, 78, 68, 0
str_19:
  .byte 70, 73, 71, 72, 84, 0
str_20:
  .byte 69, 76, 69, 67, 70, 73, 71, 72, 84, 69, 82, 0
str_21:
  .byte 80, 82, 69, 83, 83, 32, 83, 84, 65, 82, 84, 0
str_22:
  .byte 80, 65, 68, 32, 32, 32, 32, 80, 67, 32, 75, 69, 89, 32, 32, 65, 67, 84, 73, 79, 78, 0
str_23:
  .byte 68, 45, 80, 65, 68, 32, 32, 65, 82, 82, 79, 87, 83, 32, 32, 77, 79, 86, 69, 44, 32, 66, 65, 67, 75, 32, 71, 85, 65, 82, 68, 83, 0
str_24:
  .byte 89, 32, 32, 32, 32, 32, 32, 65, 32, 32, 32, 32, 32, 32, 32, 76, 73, 71, 72, 84, 32, 80, 85, 78, 67, 72, 0
str_25:
  .byte 88, 32, 32, 32, 32, 32, 32, 83, 32, 32, 32, 32, 32, 32, 32, 72, 69, 65, 86, 89, 32, 80, 85, 78, 67, 72, 0
str_26:
  .byte 66, 32, 32, 32, 32, 32, 32, 88, 0
str_27:
  .byte 65, 32, 32, 32, 32, 32, 32, 90, 0
str_28:
  .byte 83, 69, 76, 69, 67, 84, 58, 32, 83, 87, 73, 84, 67, 72, 32, 84, 72, 69, 32, 66, 85, 84, 84, 79, 78, 32, 83, 69, 84, 0
str_29:
  .byte 67, 79, 78, 84, 82, 79, 76, 83, 32, 32, 84, 89, 80, 69, 32, 65, 0
str_30:
  .byte 76, 73, 71, 72, 84, 32, 75, 73, 67, 75, 0
str_31:
  .byte 72, 69, 65, 86, 89, 32, 75, 73, 67, 75, 0
str_32:
  .byte 67, 79, 78, 84, 82, 79, 76, 83, 32, 32, 84, 89, 80, 69, 32, 66, 0
  .align 2

  .bank 2
  .org 0xc000
; cpu/standin.e16.ts:17 cpuThink(i) at -O1
;   i in s1
;   held in s2
cpuThink:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  ; cpu/standin.e16.ts:18  if (cpuT[i] > 0) {
  slli t0, s1, 1
  lw t0, cpuT(t0)
  bgeu zero, t0, .L1
  ; cpu/standin.e16.ts:19  cpuT[i]--
  slli t0, s1, 1
  addi t0, t0, cpuT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, -1
  sw t1, 0(t0)
  ; cpu/standin.e16.ts:20  return cpuKeep[i]
  slli t0, s1, 1
  lw a0, cpuKeep(t0)
  j .return
.L1:
  ; cpu/standin.e16.ts:22  cpuT[i] = opp[O_THINK] + randBelow(8)
  slli t0, s1, 1
  lw t1, opp+4(zero)
  addi t0, t0, cpuT
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 8
  call randBelow
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; cpu/standin.e16.ts:23  const held = cpuChoose(i)
  mv a0, s1
  call cpuChoose
  mv s2, a0 ; held
  ; cpu/standin.e16.ts:25  cpuKeep[i] = held & ~(I_ATTACKS | I_UP)
  slli t0, s1, 1
  andi t1, s2, -242
  sw t1, cpuKeep(t0)
  ; cpu/standin.e16.ts:26  return held
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; cpu/standin.e16.ts:29 cpuChoose(i) at -O1
;   i in 0(fp)
;   a in s2
;   b in s3
;   dist in 6(fp)
;   r in s1
;   attack in 2(fp)
;   guard in 4(fp)
;   jump in 8(fp)
cpuChoose:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s1, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  sw a0, 0(fp) ; i
  ; cpu/standin.e16.ts:30  const a = fX[i] >> 4
  lw t0, 0(fp) ; i
  slli t0, t0, 1
  lw t0, fX(t0)
  srli s2, t0, 4
  ; cpu/standin.e16.ts:31  const b = fX[1 - i] >> 4
  lw t0, 0(fp) ; i
  li t1, 1
  sub t1, t1, t0
  slli t1, t1, 1
  lw t1, fX(t1)
  srli s3, t1, 4
  ; cpu/standin.e16.ts:32  const dist = a > b ? a - b : b - a
  bgeu s3, s2, .L1
  sub t0, s2, s3
  j .L2
.L1:
  sub t0, s3, s2
.L2:
  sw t0, 6(fp) ; dist
  ; cpu/standin.e16.ts:33  const r = randBelow(256)
  li a0, 256
  call randBelow
  mv s1, a0 ; r
  ; cpu/standin.e16.ts:34  const attack = opp[O_ATTACK]
  lw t0, opp+6(zero)
  sw t0, 2(fp) ; attack
  ; cpu/standin.e16.ts:35  const guard = attack + opp[O_GUARD]
  lw t0, opp+8(zero)
  lw t1, 2(fp) ; attack
  add t1, t1, t0
  sw t1, 4(fp) ; guard
  ; cpu/standin.e16.ts:36  const jump = guard + opp[O_JUMP]
  lw t0, opp+10(zero)
  lw t1, 4(fp) ; guard
  add t1, t1, t0
  sw t1, 8(fp) ; jump
  ; cpu/standin.e16.ts:37  if (dist > opp[O_REACH] + 8) return r < opp[O_JUMP] ? I_UP | I_FWD : I_FWD
  lw t0, opp+12(zero)
  addi t0, t0, 8
  lw t1, 6(fp) ; dist
  bgeu t0, t1, .L3
  ; cpu/standin.e16.ts:37  return r < opp[O_JUMP] ? I_UP | I_FWD : I_FWD
  lw t0, opp+10(zero)
  bgeu s1, t0, .L4
  li t0, 9
  j .L5
.L4:
  li t0, 8
.L5:
  mv a0, t0
  j .return
.L3:
  ; cpu/standin.e16.ts:38  if (r < attack) return u16(I_LP << randBelow(4)) | (randBelow(3) === 0 ? I_DOWN : 0)
  lw t0, 2(fp) ; attack
  bgeu s1, t0, .L6
  ; cpu/standin.e16.ts:38  return u16(I_LP << randBelow(4)) | (randBelow(3) === 0 ? I_DOWN : 0)
  li a0, 4
  call randBelow
  li t0, 16
  sll t0, t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 3
  call randBelow
  lw t0, 0(sp)
  addi sp, sp, 2
  mv t1, a0
  li t2, 0
  bne t1, t2, .L7
  li t1, 2
  j .L8
.L7:
  li t1, 0
.L8:
  or a0, t0, t1
  j .return
.L6:
  ; cpu/standin.e16.ts:39  if (r < guard) return I_BACK | (randBelow(2) === 0 ? I_DOWN : 0)
  lw t0, 4(fp) ; guard
  bgeu s1, t0, .L9
  ; cpu/standin.e16.ts:39  return I_BACK | (randBelow(2) === 0 ? I_DOWN : 0)
  li a0, 2
  call randBelow
  li t0, 4
  mv t1, a0
  li t2, 0
  bne t1, t2, .L10
  li t1, 2
  j .L11
.L10:
  li t1, 0
.L11:
  or a0, t0, t1
  j .return
.L9:
  ; cpu/standin.e16.ts:40  if (r < jump) return I_UP | I_FWD
  lw t0, 8(fp) ; jump
  bgeu s1, t0, .L12
  ; cpu/standin.e16.ts:40  return I_UP | I_FWD
  li a0, 9
  j .return
.L12:
  ; cpu/standin.e16.ts:41  return 0
  li a0, 0
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s1, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

  .align 2
